import { chebyshev } from '../../combat/CombatSystem.js';
import { createCombatHazard, HAZARD_TYPES } from '../../combat/CombatHazards.js';
import { rollHit } from '../../combat/HitChance.js';
import { applyStatus, hasStatus, removeStatus } from '../../combat/StatusEffects.js';
import {
  companionAbilityNodes,
  hasCompanionUpgrade,
  snapshotCompanionEntity
} from '../../companions/CompanionSystem.js';
import { COMPANION_ACTION_RULES } from '../../companions/CompanionActionRules.js';
import { findPath } from '../../world/Pathfinder.js';
import { VIEWPORT_HEIGHT } from '../../render/renderConfig.js';
import { contextActionAt } from '../../ui/contextActionLayout.js';
import { installGameMethods } from './installGameMethods.js';

const CLEANSES = Object.freeze(['burning', 'snared', 'suppressed', 'rattled', 'fatigued', 'sealed', 'off-balance', 'guard-broken']);

class GameDroneCombatRuntime {
  _livingPlayerTeam() {
    return [this.player, ...(this.companions ?? [])].filter((actor) => actor && !actor.isDead && !actor.disabled);
  }

  _beginDroneCombatState() {
    this.droneCombatState = {
      reserveChargeSpent: false,
      deployDiscountSpent: false,
      redundantCoreSpent: false,
      lastWallSpent: false,
      emergencyClampSpent: false,
      ambushLinkSpent: false,
      usedAbilities: new Set(),
      cooldowns: new Map(),
      pendingAp: new Map(),
      commandBus: new Set(),
      combatSignalPlayed: false,
      forkedTurn: null,
      palatineRound: null,
      interceptRound: null,
      counterRound: null
    };
    this.combatDeployables = [];
    const companion = this._activeCompanion?.();
    if (companion) {
      companion.isDead = Boolean(companion.disabled);
      companion.movedThisTurn = false;
    }
  }

  _clearDroneCombatState() {
    this.droneCombatState = null;
    this.combatDeployables = [];
  }

  _handleCompanionCombat(actions, click) {
    const companion = this.turnManager.current();
    if (!companion || companion.type !== 'companion' || companion.isDead) {
      this._advanceCombatTurn();
      return;
    }
    if (click) {
      if (this._handleCombatAbilityTrayClick?.(click)) return;
      if (this._handleCombatAbilityTargetClick?.(click)) return;
      if (this._handleDroneContextActionClick(click)) return;
      if (click.button === 2) {
        this._openDroneContextActionMenu(click);
        return;
      }
      this.contextActionMenu = null;
      if (click.button === 0) this._handleDroneCombatClick(companion, click);
    }
    for (const action of actions) {
      if (this.combatAbilityTargeting) {
        this._clearCombatAbilityTargeting();
        if (action === 'cancel') return;
      }
      if (this.contextActionMenu && action === 'cancel') {
        this.contextActionMenu = null;
        return;
      }
      this.contextActionMenu = null;
      const movement = this._movementAction(action);
      if (movement) {
        const cost = this._combatMoveApCost(companion);
        if (companion.ap < cost) {
          this._log('Not enough AP to move.');
          continue;
        }
        if (this._tryStep(companion, movement.dir, { logBlock: false })) {
          companion.ap -= cost;
          this._markCombatMoveSpent(companion);
          return;
        }
        continue;
      }
      if (action === 'cycle') this._cycleTarget();
      else if (action === 'confirm' || action === 'space') this._companionBasicAttack();
      else if (action === 'cancel') {
        this._openPauseMenu?.();
        return;
      }
      else if (action === 'interact') {
        this._endCompanionTurn(companion);
        return;
      } else if (action === 'journal') {
        this._toggleJournal({ section: 'DRONE' });
        return;
      } else if (action === 'map') {
        this._toggleJournal({ section: 'MAP' });
        return;
      } else if (action === 'inventory' || action === 'dressing' || action === 'reload') {
        this._log('The attendant has no pack or weapon magazine.');
      } else if (action === 'restart') {
        this._requestRunRestart?.();
        return;
      } else if (action === 'debug') this.debugGrid = !this.debugGrid;
    }
  }

  _handleDroneCombatClick(companion, click) {
    if (click.y >= VIEWPORT_HEIGHT) return;
    const cell = this.renderer.toGrid(click.x, click.y);
    if (!this.grid.isInside(cell.x, cell.y)) return;
    const enemy = this._livingEnemyAtCell(cell);
    if (enemy) {
      this._setCombatTarget(enemy);
      this._faceToward(companion, enemy.position);
      this._log(`Target: ${enemy.name}.`);
      return;
    }
    if (!this.grid.isWalkable(cell.x, cell.y) || this._isCellHidden(cell.x, cell.y)) return;
    const path = findPath(this.grid, companion.position, cell, this._occupiedSet(companion));
    const next = path?.[0];
    if (!next) return;
    const cost = this._combatMoveApCost(companion);
    if (companion.ap < cost) {
      this._log('Not enough AP to move.');
      return;
    }
    if (this._tryStep(companion, { x: next.x - companion.x, y: next.y - companion.y }, { logBlock: false })) {
      companion.ap -= cost;
      this._markCombatMoveSpent(companion);
    }
  }

  _handleDroneContextActionClick(click) {
    if (!this.contextActionMenu) return false;
    const action = contextActionAt(click, this.contextActionMenu);
    if (!action) {
      this.contextActionMenu = null;
      return true;
    }
    this.contextActionMenu = null;
    this._executeDroneAction(action);
    return true;
  }

  _openDroneContextActionMenu(click) {
    if (click.y >= VIEWPORT_HEIGHT) return;
    const cell = this.renderer.toGrid(click.x, click.y);
    if (!this.grid.isInside(cell.x, cell.y)) return;
    const target = this._interactionTargetAtCell(cell, 'combat');
    const actions = this._buildDroneContextActions(target);
    this.contextActionMenu = actions.length ? { anchor: { x: click.x, y: click.y }, target, actions } : null;
  }

  _buildDroneContextActions(target) {
    const companion = this.turnManager.current();
    if (!companion || companion.type !== 'companion') return [];
    const targetActor = target?.actor ?? null;
    const targetEnemy = targetActor && this.enemies.includes(targetActor) ? targetActor : null;
    const targetAlly = target?.type === 'self'
      ? this.player
      : targetActor?.team === 'player' || targetActor?.type === 'player' || targetActor?.type === 'companion'
        ? targetActor
        : null;
    const cell = target?.cell ?? targetActor?.position ?? null;
    const actions = [];
    if (targetEnemy) {
      const attack = companion.attacks?.[0];
      const preview = this._attackPreview(companion, targetEnemy, attack);
      actions.push({
        id: 'drone:arc-pin', kind: 'drone-action', effect: 'arc-pin', label: `Arc Pin ${attack?.apCost ?? 3} AP`,
        target: targetEnemy, enabled: Boolean(preview?.enabled), reason: preview?.reason ?? ''
      });
    }
    for (const node of companionAbilityNodes(this._companionDefinition(), this.companionRun)) {
      const rule = COMPANION_ACTION_RULES[node.effect];
      if (!rule) continue;
      if (rule.target === 'enemy' && !targetEnemy) continue;
      if (rule.target === 'ally' && !targetAlly) continue;
      if (rule.target === 'self' && targetActor !== companion) continue;
      if (rule.target === 'tile' && !cell) continue;
      const actionTarget = rule.target === 'enemy' ? targetEnemy : rule.target === 'ally' ? targetAlly : rule.target === 'self' ? companion : null;
      const status = this._droneActionStatus(node.effect, actionTarget, cell);
      actions.push({
        id: `drone:${node.effect}`,
        kind: 'drone-action',
        effect: node.effect,
        label: `${rule.label} ${status.cost} AP`,
        target: actionTarget,
        cell,
        enabled: status.enabled,
        reason: status.reason
      });
    }
    return actions;
  }

  _droneActionStatus(effect, target, cell) {
    const companion = this.turnManager.current();
    const rule = COMPANION_ACTION_RULES[effect];
    if (!companion || !rule) return { enabled: false, reason: 'Unavailable.', cost: 0 };
    const cost = this._droneActionCost(effect, rule.ap);
    const destination = target?.position ?? cell ?? companion.position;
    const range = this._droneActionRange(effect, rule.range);
    if (chebyshev(companion.position, destination) > range) return { enabled: false, reason: 'Out of range', cost };
    if (companion.ap < cost) return { enabled: false, reason: `Need ${cost} AP`, cost };
    if (effect === 'ability-stimulant-needle' && target !== this.player) {
      return { enabled: false, reason: 'Agent only', cost };
    }
    if (rule.cooldown && (this.droneCombatState?.cooldowns.get(effect) ?? 0) > 0) {
      return { enabled: false, reason: `Cooldown ${this.droneCombatState.cooldowns.get(effect)}`, cost };
    }
    if (rule.once && this.droneCombatState?.usedAbilities.has(effect)) return { enabled: false, reason: 'Spent', cost };
    if (effect.startsWith('deploy-')) {
      if (!cell || !this.grid.isWalkable(cell.x, cell.y) || this._isCellHidden(cell.x, cell.y)) return { enabled: false, reason: 'Blocked', cost };
      if (this._isOccupied(cell.x, cell.y, null)) return { enabled: false, reason: 'Occupied', cost };
      if ((this.combatDeployables ?? []).some((device) => device.x === cell.x && device.y === cell.y)) {
        return { enabled: false, reason: 'Device already set', cost };
      }
      if ((this.combatDeployables?.length ?? 0) >= this._droneDeployableLimit()) return { enabled: false, reason: 'Rack full', cost };
    }
    return { enabled: true, reason: '', cost };
  }

  _droneActionRange(effect, baseRange) {
    const energyAction = effect === 'ability-overcharge' || effect === 'ability-arc-sweep';
    return baseRange + (energyAction && hasCompanionUpgrade(this.companionRun, 'energy-range-lens') ? 1 : 0);
  }

  _droneActionCost(effect, baseCost) {
    let cost = baseCost;
    if (effect.startsWith('deploy-') && hasCompanionUpgrade(this.companionRun, 'fieldworks-rapid-assembly') && !this.droneCombatState?.deployDiscountSpent) {
      cost -= 2;
    }
    if (hasCompanionUpgrade(this.companionRun, 'core-reserve-charge') && !this.droneCombatState?.reserveChargeSpent) cost -= 1;
    return Math.max(1, cost);
  }

  _executeDroneAction(action) {
    if (action?.kind !== 'drone-action') return false;
    if (action.enabled === false) {
      if (action.reason) this._log(action.reason);
      return false;
    }
    if (action.effect === 'arc-pin') return this._companionBasicAttack(action.target);
    const status = this._droneActionStatus(action.effect, action.target, action.cell);
    if (!status.enabled) {
      if (status.reason) this._log(status.reason);
      return false;
    }
    const companion = this.turnManager.current();
    let used = false;
    switch (action.effect) {
      case 'ability-overcharge': used = this._droneAttack(action.target, overchargeAttack(this.companionRun), status.cost, { energy: true, overcharge: true }); break;
      case 'ability-arc-sweep': used = this._droneArcSweep(action.target, status.cost); break;
      case 'ability-ram': used = this._droneRam(action.target, status.cost); break;
      case 'ability-guard-stance':
        companion.ap -= status.cost;
        applyStatus(companion, { id: 'braced', duration: 2, sourceId: companion.id });
        applyStatus(companion, { id: 'taunting', duration: 1, sourceId: companion.id });
        this._pushEffect({ type: 'spark', x: companion.x, y: companion.y, text: 'GUARD' });
        used = true;
        break;
      case 'ability-dressing-arm': used = this._droneHeal(action.target, 3, status.cost, action.effect); break;
      case 'ability-clean-line': used = this._droneCleanse(action.target, status.cost); break;
      case 'ability-repair-foam': used = this._droneHeal(companion, 4, status.cost, action.effect); break;
      case 'ability-stimulant-needle':
        companion.ap -= status.cost;
        action.target.ap = Math.min(action.target.maxAp + 2, action.target.ap + 2);
        applyStatus(action.target, { id: 'fatigued', duration: 3, sourceId: companion.id });
        this._pushEffect({ type: 'spark', x: action.target.x, y: action.target.y, text: '+2 AP' });
        used = true;
        break;
      case 'ability-marking-beam':
        companion.ap -= status.cost;
        applyStatus(action.target, {
          id: 'studied',
          duration: 2,
          sourceId: companion.id,
          data: { hitBonus: 10, damageBonus: 1, sharedTeam: 'player' }
        });
        this._pushEffect({ type: 'spark', x: action.target.x, y: action.target.y, text: 'STUDIED' });
        used = true;
        break;
      case 'ability-ghost-light': used = this._droneGhostLight(action.cell, status.cost); break;
      case 'ability-shadow-screen':
        companion.ap -= status.cost;
        applyStatus(companion, { id: 'faded', duration: 2, sourceId: companion.id });
        applyStatus(this.player, { id: 'faded', duration: 2, sourceId: companion.id });
        used = true;
        break;
      default:
        if (action.effect.startsWith('deploy-')) used = this._deployDroneDevice(action.effect, action.cell, status.cost);
        break;
    }
    if (!used) return false;
    this._markDroneNonmoveAction(action.effect);
    const rule = COMPANION_ACTION_RULES[action.effect];
    if (rule?.cooldown) this.droneCombatState.cooldowns.set(action.effect, rule.cooldown);
    if (rule?.once) this.droneCombatState.usedAbilities.add(action.effect);
    this._checkOutcome();
    return true;
  }

  _companionBasicAttack(target = null) {
    const companion = this.turnManager.current();
    const enemy = target ?? this._currentTarget();
    const attack = companion?.attacks?.[0];
    if (!companion || !attack || !enemy) return false;
    const cost = this._droneActionCost('arc-pin', attack.apCost);
    return this._droneAttack(enemy, attack, cost, { energy: true });
  }

  _triggerDroneAmbushLink(target) {
    const companion = this._activeCompanion?.();
    const attack = companion?.attacks?.[0];
    if (
      !target ||
      target.isDead ||
      !companion ||
      companion.isDead ||
      !attack ||
      !this.droneCombatState ||
      this.droneCombatState.ambushLinkSpent ||
      !hasCompanionUpgrade(this.companionRun, 'veil-ambush-link')
    ) return false;
    const preview = this._attackPreview(companion, target, attack, { ignoreApCost: true });
    if (!preview.enabled) return false;

    this.droneCombatState.ambushLinkSpent = true;
    this._faceToward(companion, target.position);
    const roll = rollHit(preview.chance);
    const result = this.combat.performAttack(companion, target, attack, {
      spendAp: false,
      chance: preview.chance,
      roll: roll.roll,
      hit: roll.hit,
      damage: preview.damage,
      damageTags: preview.damageTags,
      cover: preview.cover,
      chanceTags: preview.tags
    });
    this._log(`${companion.name} answers the opening with Arc Pin.`);
    for (const line of result.logs) this._log(line);
    this._pushEffect(result.effect);
    if (roll.hit) this._afterDroneEnergyHit(target, { arcPin: true });
    return true;
  }

  _droneAttack(target, attack, cost, options = {}) {
    const companion = this.turnManager.current();
    if (!companion || !target || target.isDead || companion.ap < cost) return false;
    const preview = this._attackPreview(companion, target, { ...attack, apCost: cost });
    if (!preview.enabled) {
      if (preview.reason) this._log(preview.reason);
      return false;
    }
    this._faceToward(companion, target.position);
    const roll = rollHit(preview.chance);
    companion.ap -= cost;
    const result = this.combat.performAttack(companion, target, attack, {
      spendAp: false,
      chance: preview.chance,
      roll: roll.roll,
      hit: roll.hit,
      damage: preview.damage,
      damageTags: preview.damageTags,
      cover: preview.cover,
      chanceTags: preview.tags
    });
    for (const line of result.logs) this._log(line);
    this._pushEffect(result.effect);
    if (roll.hit && options.energy) this._afterDroneEnergyHit(target, { arcPin: attack.id === 'arc-pin' });
    if (options.overcharge && !hasCompanionUpgrade(this.companionRun, 'energy-heat-sink')) companion.droneOverchargePenalty = true;
    this._markDroneNonmoveAction(options.overcharge ? 'ability-overcharge' : 'arc-pin');
    this._checkOutcome();
    return true;
  }

  _afterDroneEnergyHit(target, { arcPin = false } = {}) {
    const companion = this._activeCompanion();
    if (!companion || !target) return;
    if (hasCompanionUpgrade(this.companionRun, 'energy-ion-scar') && !target.isDead) {
      applyStatus(target, { id: 'conductive', duration: 2, sourceId: companion.id });
    }
    const turnKey = `${this.turnManager.round}:${companion.id}`;
    if (arcPin && hasCompanionUpgrade(this.companionRun, 'energy-forked-current') && this.droneCombatState.forkedTurn !== turnKey) {
      const secondary = this._livingEnemies()
        .filter((enemy) => enemy !== target && chebyshev(enemy.position, target.position) <= 1)
        .sort((a, b) => chebyshev(a.position, target.position) - chebyshev(b.position, target.position))[0];
      if (secondary) this._droneDealDirectDamage(secondary, 1, 'Forked Current');
      this.droneCombatState.forkedTurn = turnKey;
    }
    if (hasCompanionUpgrade(this.companionRun, 'energy-palatine-circuit') && this.droneCombatState.palatineRound !== this.turnManager.round) {
      const chained = this._livingEnemies()
        .filter((enemy) => enemy !== target && chebyshev(enemy.position, target.position) <= 2)
        .sort((a, b) => chebyshev(a.position, target.position) - chebyshev(b.position, target.position))
        .slice(0, 2);
      for (const enemy of chained) this._droneDealDirectDamage(enemy, 2, 'Palatine Circuit');
      this.droneCombatState.palatineRound = this.turnManager.round;
    }
  }

  _droneArcSweep(primaryTarget, cost) {
    const companion = this.turnManager.current();
    if (!companion || companion.ap < cost) return false;
    const direction = {
      x: Math.sign(primaryTarget.x - companion.x),
      y: Math.sign(primaryTarget.y - companion.y)
    };
    const range = this._droneActionRange('ability-arc-sweep', 2);
    const targets = this._livingEnemies().filter((enemy) => {
      const dx = enemy.x - companion.x;
      const dy = enemy.y - companion.y;
      const forward = dx * direction.x + dy * direction.y;
      const side = Math.abs(dx * direction.y - dy * direction.x);
      return chebyshev(companion.position, enemy.position) <= range && forward > 0 && side <= forward;
    });
    if (!targets.length) return false;
    companion.ap -= cost;
    companion.render.state = 'attack';
    companion.render.timer = 0;
    for (const enemy of targets) {
      this._droneDealDirectDamage(enemy, 3, 'Arc Sweep');
      this._afterDroneEnergyHit(enemy);
    }
    return true;
  }

  _droneRam(target, cost) {
    const companion = this.turnManager.current();
    if (!companion || !target || companion.ap < cost) return false;
    const damage = hasCompanionUpgrade(this.companionRun, 'bulwark-breach-teeth') ? 5 : 3;
    companion.ap -= cost;
    this._faceToward(companion, target.position);
    companion.render.state = 'attack';
    companion.render.timer = 0;
    this._droneDealDirectDamage(target, damage, 'Ram');
    if (!target.isDead) {
      if (hasCompanionUpgrade(this.companionRun, 'bulwark-breach-teeth')) {
        applyStatus(target, { id: 'guard-broken', duration: 2, sourceId: companion.id });
      }
      const dx = Math.sign(target.x - companion.x);
      const dy = Math.sign(target.y - companion.y);
      const cell = { x: target.x + dx, y: target.y + dy };
      if (this.grid.isInside(cell.x, cell.y) && this.grid.isWalkable(cell.x, cell.y) && !this._isOccupied(cell.x, cell.y, target)) {
        target.moveTo(cell.x, cell.y);
      }
    }
    return true;
  }

  _droneHeal(target, baseAmount, cost, cooldownId = null) {
    const companion = this.turnManager.current();
    if (!target || target.isDead || companion.ap < cost) return false;
    const low = target.maxHp > 0 && target.hp / target.maxHp <= 0.5;
    const amount = baseAmount + (low && hasCompanionUpgrade(this.companionRun, 'medical-triage-optic') ? 2 : 0);
    companion.ap -= cost;
    const healed = target.heal(amount);
    this._pushEffect({ type: 'spark', x: target.x, y: target.y, text: healed ? `+${healed}` : 'STABLE' });
    this._log(`${companion.name} restores ${healed} HP to ${target.name}.`);
    if (cooldownId && COMPANION_ACTION_RULES[cooldownId]?.cooldown) {
      this.droneCombatState.cooldowns.set(cooldownId, COMPANION_ACTION_RULES[cooldownId].cooldown);
    }
    return true;
  }

  _droneCleanse(target, cost) {
    const companion = this.turnManager.current();
    if (!target || companion.ap < cost) return false;
    const status = CLEANSES.find((id) => hasStatus(target, id));
    if (!status) {
      this._log(`${target.name} has no cleansable condition.`);
      return false;
    }
    companion.ap -= cost;
    removeStatus(target, status);
    this._pushEffect({ type: 'spark', x: target.x, y: target.y, text: 'CLEAN' });
    return true;
  }

  _droneGhostLight(cell, cost) {
    const companion = this.turnManager.current();
    if (!cell || companion.ap < cost) return false;
    companion.ap -= cost;
    let affected = 0;
    for (const enemy of this._livingEnemies()) {
      if (chebyshev(enemy.position, cell) > 2 || !this._isHumanLike(enemy)) continue;
      applyStatus(enemy, { id: 'rattled', duration: 2, sourceId: companion.id });
      affected += 1;
    }
    this._pushEffect({ type: 'spark', x: cell.x, y: cell.y, text: 'GHOST' });
    this._log(affected ? `Ghost Light rattles ${affected} target${affected === 1 ? '' : 's'}.` : 'Ghost Light finds no human attention.');
    return true;
  }

  _deployDroneDevice(effect, cell, cost) {
    const companion = this.turnManager.current();
    if (!companion || !cell || companion.ap < cost) return false;
    const workshop = hasCompanionUpgrade(this.companionRun, 'fieldworks-field-workshop');
    const rapid = hasCompanionUpgrade(this.companionRun, 'fieldworks-rapid-assembly');
    const mercy = hasCompanionUpgrade(this.companionRun, 'medical-mercy-rig');
    const baseDuration = effect === 'deploy-med-station' && mercy ? 4 : 3;
    const duration = baseDuration + (rapid ? 1 : 0) + (workshop ? 2 : 0);
    const kindByEffect = {
      'deploy-med-station': 'drone-med-station',
      'deploy-sensor-stake': 'drone-sensor-stake',
      'deploy-folding-screen': 'drone-folding-screen',
      'deploy-snare-pod': 'drone-snare-pod',
      'deploy-arc-sentry': 'drone-arc-sentry',
      'deploy-relay-pylon': 'drone-relay-pylon'
    };
    const deployable = {
      id: `drone-device-${this.turnManager.round}-${this.combatDeployables.length + 1}`,
      kind: kindByEffect[effect],
      effect,
      x: cell.x,
      y: cell.y,
      seed: (cell.x * 97 + cell.y * 53 + this.turnManager.round * 11) >>> 0,
      ownerId: companion.id,
      durationRounds: duration,
      blocking: effect === 'deploy-folding-screen',
      cover: effect === 'deploy-folding-screen' ? (workshop ? 'hard' : 'light') : undefined,
      radius: effect === 'deploy-sensor-stake' && workshop ? 3 : effect === 'deploy-relay-pylon' && workshop ? 3 : 2,
      damage: effect === 'deploy-arc-sentry' && workshop ? 2 : 1,
      heal: effect === 'deploy-med-station' && mercy ? 2 : 1,
      cleansed: false
    };
    companion.ap -= cost;
    this.combatDeployables.push(deployable);
    if (effect === 'deploy-snare-pod') {
      this.combatHazards.push(createCombatHazard({
        id: `${deployable.id}:hazard`,
        type: HAZARD_TYPES.TRIP_MINE,
        owner: companion,
        cell,
        damage: workshop ? 2 : 1,
        durationRounds: 99,
        status: { id: 'snared', duration: workshop ? 2 : 1 }
      }));
    }
    if (rapid && !this.droneCombatState.deployDiscountSpent) this.droneCombatState.deployDiscountSpent = true;
    this._pushEffect({ type: 'spark', x: cell.x, y: cell.y, text: 'DEPLOY' });
    return true;
  }

  _droneDeployableLimit() {
    if (hasCompanionUpgrade(this.companionRun, 'fieldworks-field-workshop')) return 3;
    if (hasCompanionUpgrade(this.companionRun, 'fieldworks-double-rack')) return 2;
    return 1;
  }

  _markDroneNonmoveAction(effect) {
    if (this.droneCombatState && !this.droneCombatState.reserveChargeSpent) this.droneCombatState.reserveChargeSpent = true;
  }

  _endCompanionTurn(companion) {
    this._onCombatTurnEnded(companion);
    this.enemyActions = null;
    this.enemyActor = null;
    this._advanceCombatTurn();
  }

  _onDroneTurnStarted(actor) {
    if (!actor || !this.droneCombatState) return;
    const pending = this.droneCombatState.pendingAp.get(actor.id) ?? 0;
    if (pending > 0) {
      actor.ap = Math.min(actor.maxAp + pending, actor.ap + pending);
      this.droneCombatState.pendingAp.delete(actor.id);
      this._pushEffect({ type: 'spark', x: actor.x, y: actor.y, text: `+${pending} AP` });
    }
    if (actor.type === 'player') {
      if (this.turnManager.round > 1) this._advanceDroneDeployablesRound();
      this._pulseRelayPylons(actor);
      actor.droneTurnStartAp = actor.ap;
      return;
    }
    if (actor.type !== 'companion') return;
    if (this.turnManager.round === 1 && !this.droneCombatState.combatSignalPlayed) {
      this.droneCombatState.combatSignalPlayed = true;
      this._emitCompanionSignal?.(actor, 'combat', 1.1);
    }
    if (actor.droneOverchargePenalty) {
      actor.ap = Math.max(0, actor.ap - 1);
      actor.droneOverchargePenalty = false;
      this._log(`${actor.name} vents its charged cell and loses 1 AP.`);
    }
    if (hasCompanionUpgrade(this.companionRun, 'core-recovery-loop')) {
      const healed = actor.heal(1);
      if (healed) this._pushEffect({ type: 'spark', x: actor.x, y: actor.y, text: '+1' });
    }
    if (hasCompanionUpgrade(this.companionRun, 'bulwark-anchor-feet')) {
      removeStatus(actor, 'snared');
      removeStatus(actor, 'off-balance');
    }
    for (const [id, turns] of this.droneCombatState.cooldowns) {
      if (turns <= 1) this.droneCombatState.cooldowns.delete(id);
      else this.droneCombatState.cooldowns.set(id, turns - 1);
    }
    this._pulseRelayPylons(actor);
    this._fireArcSentries(actor);
    actor.droneTurnStartAp = actor.ap;
  }

  _onDroneTurnEnded(actor) {
    if (!actor || !this.droneCombatState) return;
    this._pulseMedStations(actor);
    if (actor.type === 'companion') this.companionRun = snapshotCompanionEntity(this.companionRun, actor);
    if (!hasCompanionUpgrade(this.companionRun, 'core-command-bus')) return;
    const spent = Math.max(0, (actor.droneTurnStartAp ?? actor.maxAp) - actor.ap);
    if (spent < 3) return;
    const other = actor.type === 'player' ? this._activeCompanion() : this.player;
    if (!other || other.isDead) return;
    const key = String(this.turnManager.round);
    if (this.droneCombatState.commandBus.has(key)) return;
    this.droneCombatState.commandBus.add(key);
    this.droneCombatState.pendingAp.set(other.id, (this.droneCombatState.pendingAp.get(other.id) ?? 0) + 1);
    this._log(`Command Bus reserves 1 AP for ${other.name}.`);
  }

  _advanceDroneDeployablesRound() {
    for (const device of this.combatDeployables ?? []) device.durationRounds -= 1;
    this.combatDeployables = (this.combatDeployables ?? []).filter((device) => device.durationRounds > 0);
    const activeIds = new Set(this.combatDeployables.map((device) => device.id));
    this.combatHazards = (this.combatHazards ?? []).filter((hazard) => {
      const deviceId = String(hazard.id ?? '').split(':hazard')[0];
      return !String(hazard.id ?? '').startsWith('drone-device-') || activeIds.has(deviceId);
    });
  }

  _pulseRelayPylons(actor) {
    for (const device of this.combatDeployables ?? []) {
      if (device.effect !== 'deploy-relay-pylon' || chebyshev(actor.position, device) > device.radius) continue;
      const key = `${this.turnManager.round}:${device.id}:${actor.id}`;
      if (device.lastPulseKey === key) continue;
      device.lastPulseKey = key;
      actor.ap = Math.min(actor.maxAp + 1, actor.ap + 1);
      this._pushEffect({ type: 'spark', x: actor.x, y: actor.y, text: '+1 AP' });
    }
  }

  _pulseMedStations(actor) {
    if (actor.team !== 'player' || actor.isDead) return;
    for (const device of this.combatDeployables ?? []) {
      if (device.effect !== 'deploy-med-station') continue;
      const radius = hasCompanionUpgrade(this.companionRun, 'medical-mercy-rig') ? 2 : 1;
      if (chebyshev(actor.position, device) > radius) continue;
      const key = `${this.turnManager.round}:${device.id}:${actor.id}`;
      if (device.lastHealKey === key) continue;
      device.lastHealKey = key;
      const healed = actor.heal(device.heal);
      if (healed) this._pushEffect({ type: 'spark', x: actor.x, y: actor.y, text: `+${healed}` });
      if (!device.cleansed && hasCompanionUpgrade(this.companionRun, 'medical-mercy-rig')) {
        const status = CLEANSES.find((id) => hasStatus(actor, id));
        if (status) removeStatus(actor, status);
        device.cleansed = true;
      }
    }
  }

  _fireArcSentries(companion) {
    for (const device of this.combatDeployables ?? []) {
      if (device.effect !== 'deploy-arc-sentry') continue;
      const target = this._livingEnemies()
        .filter((enemy) => chebyshev(device, enemy.position) <= 4)
        .sort((a, b) => chebyshev(device, a.position) - chebyshev(device, b.position))[0];
      if (!target) continue;
      const attack = { id: 'arc-sentry', name: 'Arc Sentry', apCost: 0, damage: device.damage, range: 4, mode: 'ranged', accuracyField: 'engineering', damageField: 'engineering', tags: ['energy'] };
      const proxy = { ...companion, position: { x: device.x, y: device.y }, ap: 99 };
      const preview = this._attackPreview(proxy, target, attack, { ignoreApCost: true });
      if (!preview.enabled) continue;
      const roll = rollHit(preview.chance);
      if (roll.hit) this._droneDealDirectDamage(target, device.damage, 'Arc Sentry');
      else this._log(`Arc Sentry missed ${target.name}.`);
    }
  }

  _droneSensorModifiers(attacker, target) {
    if (attacker?.team !== 'player' || target?.team === 'player') return [];
    const active = (this.combatDeployables ?? []).some((device) =>
      device.effect === 'deploy-sensor-stake' && chebyshev(target.position, device) <= device.radius
    );
    return active ? [{ id: 'sensor-stake', label: 'SENSOR', value: 10 }] : [];
  }

  _droneTeamModifiers(attacker, target, attack) {
    const modifiers = [...this._droneSensorModifiers(attacker, target)];
    const companion = this._activeCompanion?.();
    if (companion && !companion.isDead && hasCompanionUpgrade(this.companionRun, 'core-shared-telemetry')) {
      if ((attacker === this.player || attacker === companion) && chebyshev(this.player.position, companion.position) <= 3) {
        modifiers.push({ id: 'shared-telemetry', label: 'TELEMETRY', value: 5 });
      }
    }
    if (attacker?.type === 'companion' && hasStatus(target, 'conductive') && (attack?.tags ?? []).includes('energy')) {
      modifiers.push({ id: 'conductive', label: 'CONDUCTIVE', value: 10 });
    }
    if (target === this.player && companion && !companion.isDead && hasCompanionUpgrade(this.companionRun, 'bulwark-anchor-feet') && chebyshev(target.position, companion.position) <= 1) {
      modifiers.push({ id: 'anchor-cover', label: 'LIGHT COVER', value: -15 });
    }
    return modifiers;
  }

  _resolveDroneDefenseTarget(enemy, target, damage) {
    const companion = this._activeCompanion?.();
    if (!companion || companion.isDead || target !== this.player) return target;
    const round = this.turnManager.round;
    if (hasCompanionUpgrade(this.companionRun, 'bulwark-last-wall') && !this.droneCombatState.lastWallSpent && damage >= this.player.hp && chebyshev(this.player.position, companion.position) <= 3) {
      this.droneCombatState.lastWallSpent = true;
      this._log(`${companion.name} becomes the Last Wall.`);
      return companion;
    }
    if (hasCompanionUpgrade(this.companionRun, 'bulwark-intercept-arm') && this.droneCombatState.interceptRound !== round && chebyshev(this.player.position, companion.position) <= 1) {
      this.droneCombatState.interceptRound = round;
      this._log(`${companion.name} intercepts the attack.`);
      return companion;
    }
    return target;
  }

  _afterEnemyAttackTarget(enemy, target, hit) {
    if (!hit || !target) return;
    const companion = this._activeCompanion?.();
    if (target === companion && !companion.isDead && hasCompanionUpgrade(this.companionRun, 'bulwark-counter-ram') && chebyshev(enemy.position, companion.position) <= 1 && this.droneCombatState.counterRound !== this.turnManager.round) {
      this.droneCombatState.counterRound = this.turnManager.round;
      this._droneDealDirectDamage(enemy, 2, 'Counter Ram');
    }
    if (target === this.player && !this.player.isDead && this.player.maxHp > 0 && this.player.hp / this.player.maxHp <= 0.25 && hasCompanionUpgrade(this.companionRun, 'medical-emergency-clamp') && !this.droneCombatState.emergencyClampSpent) {
      this.droneCombatState.emergencyClampSpent = true;
      const healed = this.player.heal(3);
      this._pushEffect({ type: 'spark', x: this.player.x, y: this.player.y, text: `+${healed}` });
      this._log(`${companion.name} closes the wound with its emergency clamp.`);
    }
    if (target?.type === 'companion' && target.isDead) this._disableCompanion(target);
  }

  _protectCompanionFromLethal(actor, damage) {
    if (actor?.type !== 'companion' || actor.isDead || damage < actor.hp) return false;
    if (!hasCompanionUpgrade(this.companionRun, 'core-redundant-core') || this.droneCombatState?.redundantCoreSpent) return false;
    this.droneCombatState.redundantCoreSpent = true;
    applyStatus(actor, { id: 'braced', duration: 1, sourceId: actor.id });
    actor.render.state = 'hit';
    actor.render.timer = 0;
    this._pushEffect({ type: 'spark', x: actor.x, y: actor.y, text: '1 HP' });
    this._log(`${actor.name} catches on its redundant core.`);
    return true;
  }

  _droneDealDirectDamage(target, damage, source) {
    if (!target || target.isDead) return false;
    const killed = target.takeDamage(damage);
    target.render.state = killed ? 'dead' : 'hit';
    target.render.timer = 0;
    this._pushEffect({ type: 'spark', x: target.x, y: target.y, text: `-${damage}` });
    this._log(`${source} deals ${damage} damage to ${target.name}.`);
    if (killed) this._log(`${target.name} falls.`);
    return killed;
  }
}

function overchargeAttack(companionRun) {
  const rangeLens = hasCompanionUpgrade(companionRun, 'energy-range-lens');
  return {
    id: 'overcharge',
    name: 'Overcharge',
    apCost: 4,
    damage: 5,
    range: 4 + (rangeLens ? 1 : 0),
    mode: 'ranged',
    accuracyField: 'engineering',
    damageField: 'engineering',
    tags: ['energy'],
    accuracyBonus: rangeLens ? 10 : 0
  };
}

export function installGameDroneCombatRuntime(GameClass) {
  installGameMethods(GameClass, GameDroneCombatRuntime);
}
