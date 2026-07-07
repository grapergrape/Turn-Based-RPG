import { buildContextActionsForTarget } from '../ContextActions.js';
import { FIELD_RATINGS, awardExperience, calculateFieldRating, experienceRewardForEncounter, normalizeProgression } from '../Progression.js';
import { activeHazards, createCombatHazard, decrementHazardRounds, hazardAffectsActor, hazardAt, hazardsAtCell, HAZARD_TYPES } from '../../combat/CombatHazards.js';
import { chooseCombatStartBark, combatStartBarkLines } from '../../combat/CombatBarks.js';
import { chebyshev } from '../../combat/CombatSystem.js';
import { calculateAttackDamage, damageFieldFor, formatDamage } from '../../combat/DamageScaling.js';
import { flavorLine, planTurn } from '../../combat/EnemyAI.js';
import { attackFieldFor, calculateHitChance, defenseFieldsFor, formatChance, rollHit } from '../../combat/HitChance.js';
import { applyStatus, clearStatuses, getStatus, hasStatus, removeStatus, tickActorStatuses } from '../../combat/StatusEffects.js';
import {
  AIMED_SHOT_DAMAGE_MULTIPLIER,
  AIMED_SHOT_HIT_BONUS,
  BRACED_HIT_BONUS,
  CASE_FILE_AP_REFUND,
  CASE_FILE_DAMAGE_BONUS,
  CASE_FILE_HIT_BONUS,
  CENSURE_SPARK_DAMAGE,
  FADED_DEFENSE_BONUS,
  FATIGUED_HIT_PENALTY,
  FIELD_STIMULANT_AP_GAIN,
  GUARDED_TARGET_HIT_BONUS,
  NAME_THE_ERROR_AP_LOSS,
  OFF_BALANCE_HIT_BONUS,
  PREPARED_DAMAGE_BONUS,
  PREPARED_HIT_BONUS,
  QUARANTINE_LINE_AP_LOSS,
  RALLIED_HIT_BONUS,
  RATTLED_HIT_PENALTY,
  SEAL_TILE_AP_LOSS,
  SEAL_TILE_HOST_AP_LOSS,
  STEADY_HANDS_CRITICAL_BONUS,
  STEADY_HANDS_WOUNDED_BONUS,
  STILLING_LITANY_AP_LOSS,
  STUDIED_DAMAGE_BONUS,
  STUDIED_HIT_BONUS,
  SUPPRESSED_HIT_PENALTY,
  TECHNIQUE_AP_COSTS,
  TECHNIQUE_RANGES,
  WIRE_SNARE_AP_LOSS
} from '../../combat/TechniqueRules.js';
import { evaluateLineOfFire } from '../../world/CoverSystem.js';
import { findPath } from '../../world/Pathfinder.js';
import { SUSPICION_SEVERITY } from '../../world/PerceptionSystem.js';
import { VIEWPORT_HEIGHT } from '../../render/renderConfig.js';
import { contextActionAt } from '../../ui/contextActionLayout.js';
import { AGGRO_SPEECH_LIFE, ENEMY_ACTION_DELAY, SNEAK_ATTACK_MULTIPLIER } from './runtimeConstants.js';
import { installGameMethods } from './installGameMethods.js';

class GameCombatRuntime {
  // ---- Combat mode -------------------------------------------------------

  _handleCombat(actions, click, dt) {
    if (this.turnManager.isPlayerTurn()) {
      this._handlePlayerCombat(actions, click);
    } else {
      this._runEnemyTurn(dt);
    }
  }

  _handlePlayerCombat(actions, click) {
    if (click) {
      if (this._handleContextActionClick(click)) return;
      if (click.button === 2) {
        this._openContextActionMenuAt(click);
        return;
      }
      this.contextActionMenu = null;
      this._handleClickMove(click, true);
    }
    for (const action of actions) {
      if (this.contextActionMenu && action === 'cancel') {
        this.contextActionMenu = null;
        return;
      }
      this.contextActionMenu = null;
      const movement = this._movementAction(action);
      if (movement) {
        this.pathQueue = [];
        const moveCost = this._combatMoveApCost(this.player);
        if (this.player.ap >= moveCost) {
          const moved = this._tryStep(this.player, movement.dir, { logBlock: false });
          if (moved) {
            this.player.ap -= moveCost;
            this._markCombatMoveSpent(this.player);
            return;
          }
        } else {
          this._log('Not enough AP to move.');
        }
        continue;
      }
      switch (action) {
        case 'melee':
          this._selectAttack('melee');
          break;
        case 'sidearm':
          this._selectAttack('sidearm');
          break;
        case 'cycle':
          this._cycleTarget();
          break;
        case 'confirm':
        case 'space':
          this._playerAttack();
          break;
        case 'interact': // E = end turn in combat
          this._endPlayerTurn();
          return;
        case 'dressing':
          this._log(this.inventory.useFieldDressing(this.player));
          this._syncInventoryOrder();
          this._clampInventorySelection();
          break;
        case 'inventory':
          this._toggleInventory();
          return;
        case 'journal':
          this._toggleJournal();
          return;
        case 'map':
          this._toggleJournal({ section: 'MAP' });
          return;
        case 'restart':
          this.boot();
          return;
        case 'debug':
          this.debugGrid = !this.debugGrid;
          break;
        default:
          break;
      }
    }
  }

  _handleContextActionClick(click) {
    if (!this.contextActionMenu) return false;
    const action = contextActionAt(click, this.contextActionMenu);
    if (!action) {
      this.contextActionMenu = null;
      return true;
    }
    this.contextActionMenu = null;
    this._executeContextAction(action);
    return true;
  }

  _openContextActionMenuAt(click) {
    if (click.y >= VIEWPORT_HEIGHT) {
      this.contextActionMenu = null;
      return;
    }
    const cell = this.renderer.toGrid(click.x, click.y);
    if (!this.grid.isInside(cell.x, cell.y)) {
      this.contextActionMenu = null;
      return;
    }
    const target = this._interactionTargetAtCell(cell, 'combat');
    const actions = this._contextActionsForTarget(target);
    this.contextActionMenu = actions.length > 0
      ? { anchor: { x: click.x, y: click.y }, target, actions }
      : null;
  }

  _contextActionsForTarget(target) {
    this._refreshPlayerAttacks();
    return buildContextActionsForTarget({
      player: this.player,
      target,
      enemies: this.enemies,
      grid: this.grid,
      occupied: this._occupiedSet(this.player),
      techniqueDefs: this.techniqueDefs,
      inventory: this.inventory,
      objectName: (object) => this._objectName(object),
      attackPreview: ({ attack, target: actor, extraAp = 0, aimedShot = false, damageMultiplier = 1 } = {}) =>
        this._attackPreview(this.player, actor, attack, { extraAp, aimedShot, damageMultiplier })
    });
  }

  _attackActionState(attack, target, extraAp = 0) {
    if (!attack) return { enabled: false, reason: 'No attack' };
    if (attack.broken) return { enabled: false, reason: 'Needs repair' };
    if (!target || target.isDead) return { enabled: false, reason: 'No target' };
    if (chebyshev(this.player.position, target.position) > attack.range) {
      return { enabled: false, reason: 'Out of range' };
    }
    const cost = attack.apCost + extraAp;
    if (this.player.ap < cost) return { enabled: false, reason: `Need ${cost} AP` };
    return { enabled: true, reason: '' };
  }

  _attackPreview(attacker, target, attack, options = {}) {
    if (!attacker || !attack) return { enabled: false, reason: 'No attack', chance: null, chanceText: '', tags: [] };
    if (attack.broken) return { enabled: false, reason: 'Needs repair', chance: null, chanceText: '', tags: [] };
    if (!target || target.isDead) return { enabled: false, reason: 'No target', chance: null, chanceText: '', tags: [] };

    const distance = chebyshev(attacker.position, target.position);
    if (distance > attack.range) return { enabled: false, reason: 'Out of range', chance: null, chanceText: '', tags: [] };

    const cost = attack.apCost + (options.extraAp ?? 0);
    if (!options.ignoreApCost && attacker.ap < cost) {
      return { enabled: false, reason: `Need ${cost} AP`, chance: null, chanceText: '', tags: [] };
    }

    const line = evaluateLineOfFire({
      grid: this.grid,
      props: this.level?.props ?? [],
      attacker,
      defender: target,
      attack,
      hiddenTiles: this.hiddenTiles
    });
    if (line.blocked) {
      return { enabled: false, reason: line.reason || 'No shot', chance: null, chanceText: '', tags: ['NO SHOT'], cover: line.cover };
    }

    const attackerRating = this._actorFieldRating(attacker, attackFieldFor(attack));
    const damage = this._modifiedAttackDamage(attacker, target, calculateAttackDamage({
      baseDamage: attack.damage,
      damageMultiplier: options.damageMultiplier ?? 1,
      attackerRating: this._actorFieldRating(attacker, damageFieldFor(attack))
    }));
    const result = calculateHitChance({
      attackerRating,
      defenderRating: this._actorDefenseRating(target, attack),
      attack,
      distance,
      cover: line.cover?.level,
      attackerHpRatio: attacker.maxHp > 0 ? attacker.hp / attacker.maxHp : 1,
      modifiers: this._attackChanceModifiers(attacker, target, attack, options)
    });

    return {
      enabled: true,
      reason: '',
      chance: result.chance,
      chanceText: formatChance(result.chance),
      damage: damage.damage,
      damageText: formatDamage(damage.damage),
      damageTags: damage.tags,
      skillBonusDamage: damage.skillBonus,
      tags: result.tags,
      parts: result.parts,
      cover: line.cover,
      distance
    };
  }

  _actorProgression(actor) {
    return normalizeProgression(actor?.progression);
  }

  _actorFieldRating(actor, fieldId) {
    const field = FIELD_RATINGS.find((entry) => entry.id === fieldId);
    if (!field) return Number.NEGATIVE_INFINITY;
    return calculateFieldRating(this._actorProgression(actor), field);
  }

  _actorDefenseRating(actor, attack) {
    const fields = defenseFieldsFor(attack);
    return Math.max(...fields.map((fieldId) => this._actorFieldRating(actor, fieldId)));
  }

  _actorHasTechnique(actor, techniqueId) {
    return normalizeProgression(actor?.progression).techniques.includes(techniqueId);
  }

  _statusSourceApplies(status, attacker) {
    return !status?.sourceId || status.sourceId === attacker?.id;
  }

  _firearmAttack(actor) {
    return actor?.getAttack?.('sidearm')
      ?? (actor?.attacks ?? []).find((attack) => attack.range > 1)
      ?? null;
  }

  _meleeAttack(actor) {
    return actor?.getAttack?.('melee')
      ?? (actor?.attacks ?? []).find((attack) => attack.range <= 1)
      ?? null;
  }

  _targetTechniqueState(target, apCost, range) {
    if (!target || target.isDead) return { enabled: false, reason: 'No target.' };
    if (chebyshev(this.player.position, target.position) > range) return { enabled: false, reason: 'Out of range.' };
    if (this.player.ap < apCost) return { enabled: false, reason: `Need ${apCost} AP.` };
    return { enabled: true, reason: '' };
  }

  _tileTechniqueState(cell, apCost, range, { allowOccupied = false } = {}) {
    if (!cell || !this.grid?.isWalkable?.(cell.x, cell.y) || this._isCellHidden(cell.x, cell.y)) {
      return { enabled: false, reason: 'Blocked.' };
    }
    if (!allowOccupied && (this._isOccupied(cell.x, cell.y, this.player) || (cell.x === this.player.position.x && cell.y === this.player.position.y))) {
      return { enabled: false, reason: 'Occupied.' };
    }
    if (chebyshev(this.player.position, cell) > range) return { enabled: false, reason: 'Out of range.' };
    if (this.player.ap < apCost) return { enabled: false, reason: `Need ${apCost} AP.` };
    return { enabled: true, reason: '' };
  }

  _burnLineCells(targetCell) {
    if (!targetCell) return [];
    const dx = Math.sign(targetCell.x - this.player.position.x);
    const dy = Math.sign(targetCell.y - this.player.position.y);
    if (dx === 0 && dy === 0) return [];
    const maxSteps = Math.min(3, chebyshev(this.player.position, targetCell));
    const cells = [];
    let x = this.player.position.x;
    let y = this.player.position.y;
    for (let step = 0; step < maxSteps; step += 1) {
      x += dx;
      y += dy;
      if (!this.grid?.isInside?.(x, y) || !this.grid.isWalkable(x, y) || this._isCellHidden(x, y)) break;
      cells.push({ x, y });
      if (x === targetCell.x && y === targetCell.y) break;
    }
    return cells;
  }

  _combatMoveApCost(actor) {
    let cost = (actor?.moveCost ?? 1) +
      (hasStatus(actor, 'snared') ? 1 : 0) +
      (hasStatus(actor, 'sealed') ? 1 : 0);
    if (actor?.type === 'player' && this._actorHasTechnique(actor, 'low-step') && !hasStatus(actor, 'low-step-spent')) {
      cost = Math.max(0, cost - 1);
    }
    return cost;
  }

  _markCombatMoveSpent(actor) {
    if (actor?.type === 'player' && this._actorHasTechnique(actor, 'low-step')) {
      applyStatus(actor, { id: 'low-step-spent', duration: 1, sourceId: actor.id });
    }
  }

  _attackChanceModifiers(attacker, target, attack, options = {}) {
    const modifiers = [];
    if (options.sneakAttack) modifiers.push({ id: 'sneak', label: 'SNEAK', value: 25 });
    if (options.aimedShot) modifiers.push({ id: 'aimed', label: 'AIMED', value: AIMED_SHOT_HIT_BONUS });
    if (Number.isFinite(attack.accuracyBonus)) modifiers.push({ id: 'gear', label: 'GEAR', value: attack.accuracyBonus });
    if (this._actorHasTechnique(attacker, 'steady-hands')) {
      const hpRatio = attacker.maxHp > 0 ? attacker.hp / attacker.maxHp : 1;
      if (hpRatio > 0 && hpRatio <= 0.25) {
        modifiers.push({ id: 'steady-hands', label: 'STEADY', value: STEADY_HANDS_CRITICAL_BONUS });
      } else if (hpRatio > 0 && hpRatio <= 0.5) {
        modifiers.push({ id: 'steady-hands', label: 'STEADY', value: STEADY_HANDS_WOUNDED_BONUS });
      }
    }
    if (hasStatus(attacker, 'rattled')) modifiers.push({ id: 'rattled', label: 'RATTLED', value: RATTLED_HIT_PENALTY });
    if (hasStatus(attacker, 'suppressed')) modifiers.push({ id: 'suppressed', label: 'SUPPRESSED', value: SUPPRESSED_HIT_PENALTY });
    if (hasStatus(attacker, 'fatigued')) modifiers.push({ id: 'fatigued', label: 'FATIGUED', value: FATIGUED_HIT_PENALTY });
    if (hasStatus(attacker, 'rallied')) modifiers.push({ id: 'rallied', label: 'RALLIED', value: RALLIED_HIT_BONUS });
    if (hasStatus(attacker, 'braced')) modifiers.push({ id: 'braced', label: 'BRACED', value: BRACED_HIT_BONUS });
    if (hasStatus(attacker, 'prepared')) modifiers.push({ id: 'prepared', label: 'PREPARED', value: PREPARED_HIT_BONUS });
    if (hasStatus(target, 'guard-broken')) modifiers.push({ id: 'guard-broken', label: 'BROKEN GUARD', value: GUARDED_TARGET_HIT_BONUS });
    if (hasStatus(target, 'off-balance')) modifiers.push({ id: 'off-balance', label: 'OFF BALANCE', value: OFF_BALANCE_HIT_BONUS });
    if (hasStatus(target, 'faded')) modifiers.push({ id: 'faded', label: 'FADED', value: -FADED_DEFENSE_BONUS });
    const studied = getStatus(target, 'studied');
    if (studied && this._statusSourceApplies(studied, attacker)) {
      modifiers.push({ id: 'studied', label: 'STUDIED', value: studied.data?.hitBonus ?? STUDIED_HIT_BONUS });
    }
    if (Number.isFinite(options.hitModifier)) modifiers.push({ id: 'modifier', label: options.hitModifierLabel ?? 'MOD', value: options.hitModifier });
    if (Array.isArray(options.modifiers)) modifiers.push(...options.modifiers);
    return modifiers;
  }

  _modifiedAttackDamage(attacker, target, damage) {
    let modified = {
      ...damage,
      tags: [...(damage.tags ?? [])]
    };
    const studied = getStatus(target, 'studied');
    if (studied && this._statusSourceApplies(studied, attacker)) {
      const bonus = studied.data?.damageBonus ?? STUDIED_DAMAGE_BONUS;
      if (Number.isFinite(bonus) && bonus > 0) {
        modified = {
          ...modified,
          damage: modified.damage + bonus,
          tags: [...modified.tags, `STUDIED +${bonus}`]
        };
      }
    }
    if (hasStatus(attacker, 'prepared')) {
      modified = {
        ...modified,
        damage: modified.damage + PREPARED_DAMAGE_BONUS,
        tags: [...modified.tags, `PREPARED +${PREPARED_DAMAGE_BONUS}`]
      };
    }
    return modified;
  }

  _executeContextAction(action) {
    if (action.enabled === false) {
      if (action.reason) this._log(action.reason);
      return;
    }
    if (action.kind === 'attack') {
      this._setCombatTarget(action.target);
      this.selectedAttackId = action.attackId;
      this._playerAttack();
      return;
    }
    if (action.kind === 'technique') {
      this._executeTechniqueAction(action);
      return;
    }
    if (action.kind === 'move') {
      const path = findPath(this.grid, this.player.position, action.cell, this._occupiedSet(this.player));
      this.pathQueue = path && path.length ? path : [];
      return;
    }
    if (action.kind === 'bind-wounds') {
      this._log(this.inventory.useFieldDressing(this.player));
      this._syncInventoryOrder();
      this._clampInventorySelection();
      return;
    }
    if (action.kind === 'reload') {
      this._log(action.reason || 'No reload needed.');
    }
  }

  _executeTechniqueAction(action) {
    if (action.techniqueId === 'aimed-shot') return this._executeAimedShot(action);
    if (action.techniqueId === 'study-target') return this._executeStudyTarget(action);
    if (action.techniqueId === 'overwatch') return this._executeOverwatch(action);
    if (action.techniqueId === 'trip-mine') return this._executeTripMine(action);
    if (action.techniqueId === 'burn-line') return this._executeBurnLine(action);
    if (action.techniqueId === 'shove') return this._executeShove(action);
    if (action.techniqueId === 'guard-break') return this._executeGuardBreak(action);
    if (action.techniqueId === 'stabilize') return this._executeStabilize(action);
    if (action.techniqueId === 'field-stimulant') return this._executeFieldStimulant(action);
    if (action.techniqueId === 'field-measure') return this._executeFieldMeasure(action);
    if (action.techniqueId === 'name-the-error') return this._executeNameTheError(action);
    if (action.techniqueId === 'stilling-litany') return this._executeStillingLitany(action);
    if (action.techniqueId === 'rally') return this._executeRally(action);
    if (action.techniqueId === 'feint') return this._executeFeint(action);
    if (action.techniqueId === 'wire-snare') return this._executeWireSnare(action);
    if (action.techniqueId === 'censure-spark') return this._executeCensureSpark(action);
    if (action.techniqueId === 'fade-back') return this._executeFadeBack(action);
    if (action.techniqueId === 'seal-tile') return this._executeSealTile(action);
    if (action.techniqueId === 'quarantine-line') return this._executeQuarantineLine(action);
    this._log('Technique is not ready yet.');
  }

  _executeAimedShot(action) {
    this._refreshPlayerAttacks();
    const attack = this.player.getAttack(action.attackId);
    const target = action.target;
    const preview = this._attackPreview(this.player, target, attack, {
      extraAp: action.extraAp ?? 0,
      aimedShot: true,
      damageMultiplier: action.damageMultiplier ?? 1
    });
    if (!preview.enabled) {
      if (preview.reason) this._log(preview.reason);
      return;
    }
    this._setCombatTarget(target);
    this.selectedAttackId = attack.id;
    this.player.ap -= attack.apCost + (action.extraAp ?? 0);
    this._registerSuspiciousAction(SUSPICION_SEVERITY.HIGH, 'firing');
    this._faceToward(this.player, target.position);
    this._log('Aimed Shot.');
    const roll = rollHit(preview.chance);
    const result = this.combat.performAttack(this.player, target, attack, {
      damageMultiplier: action.damageMultiplier ?? 1,
      spendAp: false,
      chance: preview.chance,
      roll: roll.roll,
      hit: roll.hit,
      damage: preview.damage,
      damageTags: preview.damageTags,
      cover: preview.cover,
      chanceTags: preview.tags
    });
    this._degradeWeaponAttack(attack);
    this._consumePreparedAttack(this.player);
    for (const line of result.logs) this._log(line);
    this._pushEffect(result.effect);
    this._checkOutcome();
  }

  _executeStudyTarget(action) {
    const target = action.target;
    const apCost = action.apCost ?? TECHNIQUE_AP_COSTS['study-target'];
    const state = this._targetTechniqueState(target, apCost, TECHNIQUE_RANGES['study-target']);
    if (!state.enabled) {
      if (state.reason) this._log(state.reason);
      return;
    }

    const rating = Math.max(
      this._actorFieldRating(this.player, 'search'),
      this._actorFieldRating(this.player, 'hostSigns')
    );
    const expert = rating >= 65;
    const caseFile = this._actorHasTechnique(this.player, 'case-file');
    this.player.ap -= apCost;
    if (caseFile) this.player.ap = Math.min(this.player.maxAp, this.player.ap + CASE_FILE_AP_REFUND);
    this._faceToward(this.player, target.position);
    applyStatus(target, {
      id: 'studied',
      duration: (expert ? 4 : 3) + (caseFile ? 1 : 0),
      sourceId: this.player.id,
      sourceName: this.player.name,
      data: {
        hitBonus: (expert ? STUDIED_HIT_BONUS + 5 : STUDIED_HIT_BONUS) + (caseFile ? CASE_FILE_HIT_BONUS : 0),
        damageBonus: (expert ? STUDIED_DAMAGE_BONUS + 1 : STUDIED_DAMAGE_BONUS) + (caseFile ? CASE_FILE_DAMAGE_BONUS : 0)
      }
    });
    this._pushEffect({ type: 'spark', x: target.position.x, y: target.position.y, text: 'MARK' });
    this._log(`Studied ${target.name}.`);
    if (caseFile) this._log('Case file locks.');
  }

  _executeOverwatch(action) {
    this._refreshPlayerAttacks();
    const attack = this.player.getAttack(action.attackId) ?? this._firearmAttack(this.player);
    if (!attack) {
      this._log('Requires firearm.');
      return;
    }
    const apCost = action.apCost ?? TECHNIQUE_AP_COSTS.overwatch;
    if (this.player.ap < apCost) {
      this._log(`Need ${apCost} AP.`);
      return;
    }
    const cell = action.cell ?? action.target?.position ?? null;
    if (!cell) {
      this._log('No target.');
      return;
    }
    const range = attack.range ?? TECHNIQUE_RANGES.overwatch;
    if (chebyshev(this.player.position, cell) > range) {
      this._log('Out of range.');
      return;
    }

    this.player.ap -= apCost;
    applyStatus(this.player, {
      id: 'overwatch',
      duration: 1,
      sourceId: this.player.id,
      sourceName: this.player.name,
      data: {
        attackId: attack.id,
        targetId: action.target?.id ?? action.target?.spawnId ?? null,
        tileKey: `${cell.x},${cell.y}`
      }
    });
    this._faceToward(this.player, cell);
    this._pushEffect({ type: 'spark', x: this.player.position.x, y: this.player.position.y, text: 'WATCH' });
    this._log(action.target ? `Overwatch set on ${action.target.name}.` : 'Overwatch set.');
  }

  _executeTripMine(action) {
    const apCost = action.apCost ?? TECHNIQUE_AP_COSTS['trip-mine'];
    const state = this._tileTechniqueState(action.cell, apCost, TECHNIQUE_RANGES['trip-mine']);
    if (!state.enabled) {
      if (state.reason) this._log(state.reason);
      return;
    }
    if (hazardAt(this.combatHazards ?? [], action.cell)) {
      this._log('A hazard is already set there.');
      return;
    }

    const rating = Math.max(
      this._actorFieldRating(this.player, 'engineering'),
      this._actorFieldRating(this.player, 'security')
    );
    const damage = 3 + Math.max(0, Math.floor((rating - 45) / 20));
    const hazard = createCombatHazard({
      id: `trip-mine:${action.cell.x},${action.cell.y}:${this.turnManager.round}`,
      type: HAZARD_TYPES.TRIP_MINE,
      owner: this.player,
      cell: action.cell,
      damage,
      durationRounds: 99,
      status: { id: 'snared', duration: 1 }
    });
    if (!hazard) return;
    this.combatHazards = activeHazards([...(this.combatHazards ?? []), hazard]);
    this.player.ap -= apCost;
    this._pushEffect({ type: 'spark', x: action.cell.x, y: action.cell.y, text: 'SET' });
    this._log('Trip mine set.');
  }

  _executeBurnLine(action) {
    const apCost = action.apCost ?? TECHNIQUE_AP_COSTS['burn-line'];
    const state = this._tileTechniqueState(action.cell, apCost, TECHNIQUE_RANGES['burn-line'], {
      allowOccupied: Boolean(action.target)
    });
    if (!state.enabled) {
      if (state.reason) this._log(state.reason);
      return;
    }

    const cells = this._burnLineCells(action.cell);
    if (cells.length === 0) {
      this._log('No clean line.');
      return;
    }

    const rating = this._actorFieldRating(this.player, 'purgationTools');
    const power = 2 + Math.max(0, Math.floor((rating - 45) / 25));
    const duration = this._actorHasTechnique(this.player, 'hard-seal') ? 3 : 2;
    const existingKeys = new Set((this.combatHazards ?? []).filter((hazard) => !hazard.spent).map((hazard) => `${hazard.type}:${hazard.x},${hazard.y}`));
    const hazards = [];
    for (const cell of cells) {
      const key = `${HAZARD_TYPES.BURNING_GROUND}:${cell.x},${cell.y}`;
      if (existingKeys.has(key)) continue;
      hazards.push(createCombatHazard({
        id: `burn-line:${cell.x},${cell.y}:${this.turnManager.round}`,
        type: HAZARD_TYPES.BURNING_GROUND,
        owner: this.player,
        cell,
        damage: 1,
        durationRounds: duration,
        status: { id: 'burning', duration: 2, power }
      }));
    }
    const added = hazards.filter(Boolean);
    if (added.length === 0) {
      this._log('A burn line already covers that path.');
      return;
    }

    this.combatHazards = activeHazards([...(this.combatHazards ?? []), ...added]);
    this.player.ap -= apCost;
    for (const cell of cells) this._pushEffect({ type: 'spark', x: cell.x, y: cell.y, text: 'FIRE' });
    this._log('Burn line laid.');
    for (const enemy of this._livingEnemies()) {
      if (cells.some((cell) => cell.x === enemy.position.x && cell.y === enemy.position.y)) {
        this._triggerHazardsForActor(enemy);
      }
    }
  }

  _executeShove(action) {
    const target = action.target;
    const apCost = action.apCost ?? TECHNIQUE_AP_COSTS.shove;
    const state = this._targetTechniqueState(target, apCost, TECHNIQUE_RANGES.shove);
    if (!state.enabled) {
      if (state.reason) this._log(state.reason);
      return;
    }

    this.player.ap -= apCost;
    this._faceToward(this.player, target.position);
    const destination = action.destination ?? this._pushDestination(target);
    if (destination && this._moveActorInstant(target, destination)) {
      applyStatus(target, { id: 'off-balance', duration: 2, sourceId: this.player.id });
      this._pushEffect({ type: 'spark', x: target.position.x, y: target.position.y, text: 'PUSH' });
      this._log(`Shoved ${target.name}.`);
      this._triggerCombatStepEffects(target);
      return;
    }

    applyStatus(target, { id: 'off-balance', duration: 2, sourceId: this.player.id });
    this._pushEffect({ type: 'spark', x: target.position.x, y: target.position.y, text: 'STAGGER' });
    this._log(`${target.name} staggers.`);
  }

  _executeGuardBreak(action) {
    this._refreshPlayerAttacks();
    const target = action.target;
    const attack = this.player.getAttack(action.attackId) ?? this._meleeAttack(this.player);
    const apCost = action.apCost ?? TECHNIQUE_AP_COSTS['guard-break'];
    const state = this._targetTechniqueState(target, apCost, TECHNIQUE_RANGES['guard-break']);
    if (!attack) {
      this._log('Requires melee.');
      return;
    }
    if (!state.enabled) {
      if (state.reason) this._log(state.reason);
      return;
    }
    const preview = this._attackPreview(this.player, target, attack, {
      ignoreApCost: true,
      damageMultiplier: 0.75
    });
    if (!preview.enabled) {
      if (preview.reason) this._log(preview.reason);
      return;
    }

    this.player.ap -= apCost;
    this._setCombatTarget(target);
    this.selectedAttackId = attack.id;
    this._faceToward(this.player, target.position);
    this._log('Guard Break.');
    const roll = rollHit(preview.chance);
    const result = this.combat.performAttack(this.player, target, attack, {
      spendAp: false,
      chance: preview.chance,
      roll: roll.roll,
      hit: roll.hit,
      damage: preview.damage,
      damageTags: preview.damageTags,
      cover: preview.cover,
      chanceTags: preview.tags
    });
    this._degradeWeaponAttack(attack);
    this._consumePreparedAttack(this.player);
    for (const line of result.logs) this._log(line);
    this._pushEffect(result.effect);
    if (roll.hit && !target.isDead) {
      applyStatus(target, { id: 'guard-broken', duration: 2, sourceId: this.player.id });
      this._log(`${target.name}'s guard breaks.`);
    }
    this._checkOutcome();
  }

  _executeStabilize(action) {
    const apCost = action.apCost ?? TECHNIQUE_AP_COSTS.stabilize;
    if (this.player.ap < apCost) {
      this._log(`Need ${apCost} AP.`);
      return;
    }
    const removed = this._removeStatuses(this.player, ['burning', 'snared', 'suppressed', 'rattled', 'fatigued', 'sealed']);
    const surgeon = this._actorHasTechnique(this.player, 'surgeons-nerve');
    const healed = this.player.heal(surgeon ? 2 : 1);
    this.player.ap -= apCost;
    if (surgeon) applyStatus(this.player, { id: 'braced', duration: 2, sourceId: this.player.id });
    this._pushEffect({ type: 'spark', x: this.player.position.x, y: this.player.position.y, text: healed > 0 ? `+${healed}` : 'STEADY' });
    if (removed.length > 0 || healed > 0) this._log('Stabilized.');
    else this._log('No wound takes the work.');
  }

  _executeFieldStimulant(action) {
    const apCost = action.apCost ?? TECHNIQUE_AP_COSTS['field-stimulant'];
    if (hasStatus(this.player, 'stimmed')) {
      this._log('Dose already spent.');
      return;
    }
    if (this.player.ap < apCost) {
      this._log(`Need ${apCost} AP.`);
      return;
    }
    this.player.ap = Math.min(this.player.maxAp + 2, this.player.ap - apCost + FIELD_STIMULANT_AP_GAIN);
    applyStatus(this.player, { id: 'stimmed', duration: 99, sourceId: this.player.id });
    applyStatus(this.player, {
      id: 'fatigued',
      duration: 3,
      sourceId: this.player.id,
      data: { lockedBy: 'field-stimulant' }
    });
    this._pushEffect({ type: 'spark', x: this.player.position.x, y: this.player.position.y, text: 'DOSE' });
    this._log('Field stimulant taken.');
  }

  _executeFieldMeasure(action) {
    const apCost = action.apCost ?? TECHNIQUE_AP_COSTS['field-measure'];
    if (hasStatus(this.player, 'prepared')) {
      this._log('Already prepared.');
      return;
    }
    if (this.player.ap < apCost) {
      this._log(`Need ${apCost} AP.`);
      return;
    }
    this.player.ap -= apCost;
    applyStatus(this.player, { id: 'prepared', duration: 2, sourceId: this.player.id });
    this._pushEffect({ type: 'spark', x: this.player.position.x, y: this.player.position.y, text: 'READY' });
    this._log('Field measure taken.');
  }

  _executeNameTheError(action) {
    const target = action.target;
    const apCost = action.apCost ?? TECHNIQUE_AP_COSTS['name-the-error'];
    const state = this._targetTechniqueState(target, apCost, TECHNIQUE_RANGES['name-the-error']);
    if (!this._isHumanLike(target)) {
      this._log('No purchase.');
      return;
    }
    if (!state.enabled) {
      if (state.reason) this._log(state.reason);
      return;
    }
    this.player.ap -= apCost;
    target.ap = Math.max(0, (target.ap ?? 0) - NAME_THE_ERROR_AP_LOSS);
    applyStatus(target, { id: 'rattled', duration: 2, sourceId: this.player.id });
    this._faceToward(this.player, target.position);
    this._pushEffect({ type: 'spark', x: target.position.x, y: target.position.y, text: 'DOUBT' });
    this._log(`Named the error in ${target.name}.`);
  }

  _executeRally(action) {
    const apCost = action.apCost ?? TECHNIQUE_AP_COSTS.rally;
    if (hasStatus(this.player, 'rallied')) {
      this._log('Already rallied.');
      return;
    }
    if (this.player.ap < apCost) {
      this._log(`Need ${apCost} AP.`);
      return;
    }
    this.player.ap = Math.min(this.player.maxAp, this.player.ap - apCost + 1);
    this._removeStatuses(this.player, ['rattled', 'suppressed', 'fatigued']);
    applyStatus(this.player, { id: 'rallied', duration: 2, sourceId: this.player.id });
    this._pushEffect({ type: 'spark', x: this.player.position.x, y: this.player.position.y, text: 'RALLY' });
    this._log('Rallied.');
  }

  _executeStillingLitany(action) {
    const target = action.target;
    const apCost = action.apCost ?? TECHNIQUE_AP_COSTS['stilling-litany'];
    const state = this._targetTechniqueState(target, apCost, TECHNIQUE_RANGES['stilling-litany']);
    if (!this._isHostLike(target)) {
      this._log('No purchase.');
      return;
    }
    if (!state.enabled) {
      if (state.reason) this._log(state.reason);
      return;
    }
    this.player.ap -= apCost;
    target.ap = Math.max(0, (target.ap ?? 0) - STILLING_LITANY_AP_LOSS);
    applyStatus(target, { id: 'suppressed', duration: 2, sourceId: this.player.id });
    this._faceToward(this.player, target.position);
    this._pushEffect({ type: 'spark', x: target.position.x, y: target.position.y, text: 'STILL' });
    this._log(`Stilling litany holds ${target.name}.`);
  }

  _executeFeint(action) {
    const target = action.target;
    const apCost = action.apCost ?? TECHNIQUE_AP_COSTS.feint;
    const state = this._targetTechniqueState(target, apCost, TECHNIQUE_RANGES.feint);
    if (!this._isHumanLike(target)) {
      this._log('No purchase.');
      return;
    }
    if (!state.enabled) {
      if (state.reason) this._log(state.reason);
      return;
    }
    this.player.ap -= apCost;
    applyStatus(target, { id: 'off-balance', duration: 2, sourceId: this.player.id });
    this._faceToward(this.player, target.position);
    this._pushEffect({ type: 'spark', x: target.position.x, y: target.position.y, text: 'FEINT' });
    this._log(`${target.name} takes the feint.`);
  }

  _executeWireSnare(action) {
    const target = action.target;
    const apCost = action.apCost ?? TECHNIQUE_AP_COSTS['wire-snare'];
    const state = this._targetTechniqueState(target, apCost, TECHNIQUE_RANGES['wire-snare']);
    if (!state.enabled) {
      if (state.reason) this._log(state.reason);
      return;
    }
    this.player.ap -= apCost;
    target.ap = Math.max(0, (target.ap ?? 0) - WIRE_SNARE_AP_LOSS);
    applyStatus(target, { id: 'snared', duration: 1, sourceId: this.player.id });
    applyStatus(target, { id: 'off-balance', duration: 2, sourceId: this.player.id });
    this._faceToward(this.player, target.position);
    this._pushEffect({ type: 'spark', x: target.position.x, y: target.position.y, text: 'SNARE' });
    this._log(`${target.name} catches the wire.`);
  }

  _executeCensureSpark(action) {
    const target = action.target;
    const apCost = action.apCost ?? TECHNIQUE_AP_COSTS['censure-spark'];
    const state = this._targetTechniqueState(target, apCost, TECHNIQUE_RANGES['censure-spark']);
    if (!state.enabled) {
      if (state.reason) this._log(state.reason);
      return;
    }
    const rating = this._actorFieldRating(this.player, 'purgationTools');
    const power = 2 + Math.max(0, Math.floor((rating - 55) / 25));
    const duration = this._isHostLike(target) ? 3 : 2;
    this.player.ap -= apCost;
    this._faceToward(this.player, target.position);
    const killed = target.takeDamage(CENSURE_SPARK_DAMAGE);
    target.render.state = killed ? 'dead' : 'hit';
    target.render.timer = 0;
    this._pushEffect({ type: 'spark', x: target.position.x, y: target.position.y, text: 'FIRE' });
    this._log(`${target.name} catches fire.`);
    this._log(`${CENSURE_SPARK_DAMAGE} damage to ${target.name}.`);
    if (!killed) {
      applyStatus(target, { id: 'burning', duration, power, sourceId: this.player.id });
    } else {
      this._log(`${target.name} falls.`);
    }
    this._checkOutcome();
  }

  _executeFadeBack(action) {
    const apCost = action.apCost ?? TECHNIQUE_AP_COSTS['fade-back'];
    const state = this._tileTechniqueState(action.cell, apCost, TECHNIQUE_RANGES['fade-back']);
    if (!state.enabled) {
      if (state.reason) this._log(state.reason);
      return;
    }
    const path = findPath(this.grid, this.player.position, action.cell, this._occupiedSet(this.player));
    if (!path || path.length === 0 || path.length > TECHNIQUE_RANGES['fade-back']) {
      this._log('No quiet line.');
      return;
    }
    this.player.ap -= apCost;
    this._moveActorInstant(this.player, action.cell);
    applyStatus(this.player, { id: 'faded', duration: 2, sourceId: this.player.id });
    this._pushEffect({ type: 'spark', x: this.player.position.x, y: this.player.position.y, text: 'FADE' });
    this._log('Faded back.');
    if (!this._actorHasTechnique(this.player, 'low-step')) this._triggerCombatStepEffects(this.player);
  }

  _executeSealTile(action) {
    const apCost = action.apCost ?? TECHNIQUE_AP_COSTS['seal-tile'];
    const state = this._tileTechniqueState(action.cell, apCost, TECHNIQUE_RANGES['seal-tile'], {
      allowOccupied: Boolean(action.target)
    });
    if (!state.enabled) {
      if (state.reason) this._log(state.reason);
      return;
    }
    if (hazardAt(this.combatHazards ?? [], action.cell, HAZARD_TYPES.SEALED_TILE)) {
      this._log('A seal is already set there.');
      return;
    }
    const hazard = createCombatHazard({
      id: `seal-tile:${action.cell.x},${action.cell.y}:${this.turnManager.round}`,
      type: HAZARD_TYPES.SEALED_TILE,
      owner: this.player,
      cell: action.cell,
      durationRounds: this._actorHasTechnique(this.player, 'hard-seal') ? 3 : 2,
      status: { id: 'sealed', duration: 1 }
    });
    if (!hazard) return;
    this.combatHazards = activeHazards([...(this.combatHazards ?? []), hazard]);
    this.player.ap -= apCost;
    this._pushEffect({ type: 'spark', x: action.cell.x, y: action.cell.y, text: 'SEAL' });
    this._log('Seal set.');
    for (const enemy of this._livingEnemies()) {
      if (enemy.position.x === action.cell.x && enemy.position.y === action.cell.y) {
        this._triggerHazardsForActor(enemy);
      }
    }
  }

  _executeQuarantineLine(action) {
    const apCost = action.apCost ?? TECHNIQUE_AP_COSTS['quarantine-line'];
    const state = this._tileTechniqueState(action.cell, apCost, TECHNIQUE_RANGES['quarantine-line'], {
      allowOccupied: Boolean(action.target)
    });
    if (!state.enabled) {
      if (state.reason) this._log(state.reason);
      return;
    }
    const cells = this._laneCells(action.cell, 3);
    if (cells.length === 0) {
      this._log('No clean line.');
      return;
    }
    const existingKeys = new Set((this.combatHazards ?? []).filter((hazard) => !hazard.spent).map((hazard) => `${hazard.type}:${hazard.x},${hazard.y}`));
    const duration = this._actorHasTechnique(this.player, 'hard-seal') ? 3 : 2;
    const added = cells
      .filter((cell) => !existingKeys.has(`${HAZARD_TYPES.QUARANTINE_LINE}:${cell.x},${cell.y}`))
      .map((cell) => createCombatHazard({
        id: `quarantine-line:${cell.x},${cell.y}:${this.turnManager.round}`,
        type: HAZARD_TYPES.QUARANTINE_LINE,
        owner: this.player,
        cell,
        durationRounds: duration,
        status: { id: 'suppressed', duration: 2 }
      }))
      .filter(Boolean);
    if (added.length === 0) {
      this._log('A quarantine line already covers that path.');
      return;
    }
    this.combatHazards = activeHazards([...(this.combatHazards ?? []), ...added]);
    this.player.ap -= apCost;
    for (const cell of cells) this._pushEffect({ type: 'spark', x: cell.x, y: cell.y, text: 'LINE' });
    this._log('Quarantine line laid.');
    for (const enemy of this._livingEnemies()) {
      if (cells.some((cell) => cell.x === enemy.position.x && cell.y === enemy.position.y)) {
        this._triggerHazardsForActor(enemy);
      }
    }
  }

  _pushDestination(target) {
    if (!target?.position) return null;
    const dx = Math.sign(target.position.x - this.player.position.x);
    const dy = Math.sign(target.position.y - this.player.position.y);
    if (dx === 0 && dy === 0) return null;
    const cell = { x: target.position.x + dx, y: target.position.y + dy };
    return this._cellIsFreeForActor(cell, target) ? cell : null;
  }

  _cellIsFreeForActor(cell, actor) {
    if (!cell || this._isCellHidden(cell.x, cell.y)) return false;
    if (!this.grid?.isInside?.(cell.x, cell.y) || !this.grid.isWalkable(cell.x, cell.y)) return false;
    return !this._isOccupied(cell.x, cell.y, actor);
  }

  _moveActorInstant(actor, cell) {
    if (!actor || !this._cellIsFreeForActor(cell, actor)) return false;
    this._faceToward(actor, cell);
    actor.moveTo(cell.x, cell.y);
    actor.pxOffset = { x: 0, y: 0 };
    if (!actor.isDead) {
      actor.render.state = 'idle';
      actor.render.frameIndex = 0;
      actor.render.timer = 0;
    }
    return true;
  }

  _removeStatuses(actor, statusIds) {
    const removed = [];
    if (!actor) return removed;
    const ids = new Set(statusIds);
    actor.statuses = (actor.statuses ?? []).filter((status) => {
      if (!ids.has(status.id)) return true;
      if (!this._statusCanBeCleansed(status)) return true;
      removed.push(status.id);
      return false;
    });
    return removed;
  }

  _statusCanBeCleansed(status) {
    return !(status?.id === 'fatigued' && status?.data?.lockedBy === 'field-stimulant');
  }

  _consumePreparedAttack(attacker) {
    if (attacker?.type === 'player') removeStatus(attacker, 'prepared');
  }

  _isHumanLike(actor) {
    const tags = new Set(actor?.tags ?? []);
    return tags.has('human') || tags.has('cultist') || actor?.faction === 'ash-cartel' || actor?.faction === 'choir-open-wound';
  }

  _isHostLike(actor) {
    const tags = new Set(actor?.tags ?? []);
    return tags.has('host') || actor?.faction === 'the-host';
  }

  _laneCells(targetCell, maxSteps = 3) {
    if (!targetCell) return [];
    const dx = Math.sign(targetCell.x - this.player.position.x);
    const dy = Math.sign(targetCell.y - this.player.position.y);
    if (dx === 0 && dy === 0) return [];
    const steps = Math.min(maxSteps, chebyshev(this.player.position, targetCell));
    const cells = [];
    let x = this.player.position.x;
    let y = this.player.position.y;
    for (let step = 0; step < steps; step += 1) {
      x += dx;
      y += dy;
      if (!this.grid?.isInside?.(x, y) || !this.grid.isWalkable(x, y) || this._isCellHidden(x, y)) break;
      cells.push({ x, y });
      if (x === targetCell.x && y === targetCell.y) break;
    }
    return cells;
  }

  _setCombatTarget(target) {
    const idx = this._livingEnemies().indexOf(target);
    if (idx >= 0) this.targetIndex = idx;
  }

  _selectAttack(id) {
    this._refreshPlayerAttacks();
    const attack = this.player.getAttack(id);
    if (!attack) return;
    this.selectedAttackId = id;
    this._log(`Readied ${attack.name}.`);
  }

  _cycleTarget() {
    const living = this._livingEnemies();
    if (living.length === 0) return;
    this.targetIndex = (this.targetIndex + 1) % living.length;
    this._log(`Target: ${living[this.targetIndex].name}.`);
  }

  _currentTarget() {
    if (this.mode === 'explore') return this._currentPreCombatTarget();
    if (this.mode !== 'combat') return null;
    const living = this._livingEnemies();
    if (living.length === 0) return null;
    if (this.targetIndex >= living.length) this.targetIndex = 0;
    return living[this.targetIndex];
  }

  _playerAttack(options = {}) {
    this._refreshPlayerAttacks();
    const attack = this.player.getAttack(this.selectedAttackId);
    const target = this._currentTarget();
    if (!attack || !target) return false;
    if (attack.broken) {
      this._log(`${attack.name} needs repair.`);
      return false;
    }
    if (!options.ignoreApCost && this.player.ap < attack.apCost) {
      this._log('Not enough AP for that attack.');
      return false;
    }
    if (chebyshev(this.player.position, target.position) > attack.range) {
      this._log('Target is out of range.');
      return false;
    }
    const preview = this._attackPreview(this.player, target, attack, {
      ...options,
      ignoreApCost: Boolean(options.ignoreApCost),
      damageMultiplier: options.sneakAttack
        ? SNEAK_ATTACK_MULTIPLIER
        : options.damageMultiplier
    });
    if (!preview.enabled) {
      if (preview.reason) this._log(preview.reason);
      return false;
    }
    if (attack.range > 1) this._registerSuspiciousAction(SUSPICION_SEVERITY.HIGH, 'firing');
    this._faceToward(this.player, target.position);
    const roll = rollHit(preview.chance);
    const result = this.combat.performAttack(this.player, target, attack, options.sneakAttack ? {
      damageMultiplier: SNEAK_ATTACK_MULTIPLIER,
      opening: 'sneak',
      spendAp: options.spendAp,
      chance: preview.chance,
      roll: roll.roll,
      hit: roll.hit,
      damage: preview.damage,
      damageTags: preview.damageTags,
      cover: preview.cover,
      chanceTags: preview.tags
    } : {
      spendAp: options.spendAp,
      chance: preview.chance,
      roll: roll.roll,
      hit: roll.hit,
      damage: preview.damage,
      damageTags: preview.damageTags,
      cover: preview.cover,
      chanceTags: preview.tags
    });
    this._degradeWeaponAttack(attack);
    this._consumePreparedAttack(this.player);
    for (const line of result.logs) this._log(line);
    this._pushEffect(result.effect);
    if (options.sneakAttack && roll.hit && !target.isDead && this._actorHasTechnique(this.player, 'ambush-mark')) {
      applyStatus(target, {
        id: 'studied',
        duration: 2,
        sourceId: this.player.id,
        sourceName: this.player.name,
        data: {
          hitBonus: STUDIED_HIT_BONUS,
          damageBonus: STUDIED_DAMAGE_BONUS
        }
      });
      this._pushEffect({ type: 'spark', x: target.position.x, y: target.position.y, text: 'MARK' });
      this._log('Ambush mark set.');
    }
    this._checkOutcome();
    return true;
  }

  _endPlayerTurn() {
    if (this.mode !== 'combat') return;
    this._onCombatTurnEnded(this.player);
    const next = this._advanceCombatTurn();
    if (!next) return;
    this.enemyActions = null;
  }

  _advanceCombatTurn() {
    const next = this.turnManager.endTurn();
    if (next) this._onCombatTurnStarted(next);
    return next;
  }

  _onCombatTurnStarted(actor) {
    if (!actor || this.mode !== 'combat') return;
    if (actor.type === 'player') {
      if (removeStatus(actor, 'overwatch')) this._log('Overwatch lapses.');
      this.combatHazards = decrementHazardRounds(this.combatHazards ?? []);
    }
    this._triggerHazardsForActor(actor);
    const logs = tickActorStatuses(actor, {
      effect: (effect) => this._pushEffect(effect),
      damageActor: (target, damage) => {
        const killed = target.takeDamage(damage);
        target.render.state = killed ? 'dead' : 'hit';
        target.render.timer = 0;
        return killed;
      }
    });
    for (const line of logs) this._log(line);
    if (logs.length > 0) this._checkOutcome();
  }

  _onCombatTurnEnded(actor) {
    if (!actor || this.mode !== 'combat') return;
  }

  _triggerCombatStepEffects(actor) {
    if (this.mode !== 'combat' || !actor || actor.isDead) return false;
    const hazardTriggered = this._triggerHazardsForActor(actor);
    const overwatchTriggered = actor.type === 'enemy'
      ? this._triggerOverwatch(actor, { tileOnly: true })
      : false;
    return hazardTriggered || overwatchTriggered;
  }

  _triggerHazardsForActor(actor) {
    if (!actor || actor.isDead) return false;
    const hazards = hazardsAtCell(this.combatHazards ?? [], actor.position)
      .filter((hazard) => hazardAffectsActor(hazard, actor));
    if (hazards.length === 0) return false;

    let triggered = false;
    for (const hazard of hazards) {
      if (actor.isDead) break;
      triggered = true;
      if (actor.type === 'player' && this._actorHasTechnique(actor, 'low-step') && hazard.type !== HAZARD_TYPES.TRIP_MINE) {
        continue;
      }
      if (hazard.type === HAZARD_TYPES.TRIP_MINE) {
        this._log(`${actor.name} trips a mine.`);
        hazard.spent = true;
      } else if (hazard.type === HAZARD_TYPES.BURNING_GROUND) {
        this._log(`${actor.name} crosses burning ground.`);
      } else if (hazard.type === HAZARD_TYPES.SEALED_TILE) {
        this._log(`${actor.name} hits a seal.`);
        const apLoss = this._isHostLike(actor) ? SEAL_TILE_HOST_AP_LOSS : SEAL_TILE_AP_LOSS;
        actor.ap = Math.max(0, (actor.ap ?? 0) - apLoss);
        this._pushEffect({ type: 'spark', x: actor.position.x, y: actor.position.y, text: `-${apLoss} AP` });
      } else if (hazard.type === HAZARD_TYPES.QUARANTINE_LINE) {
        this._log(`${actor.name} crosses the quarantine line.`);
        actor.ap = Math.max(0, (actor.ap ?? 0) - QUARANTINE_LINE_AP_LOSS);
        this._pushEffect({ type: 'spark', x: actor.position.x, y: actor.position.y, text: `-${QUARANTINE_LINE_AP_LOSS} AP` });
      }

      if (hazard.damage > 0) {
        const killed = actor.takeDamage(hazard.damage);
        actor.render.state = killed ? 'dead' : 'hit';
        actor.render.timer = 0;
        this._pushEffect({ type: 'spark', x: actor.position.x, y: actor.position.y, text: `-${hazard.damage}` });
        this._log(`${hazard.damage} damage to ${actor.name}.`);
        if (killed) {
          this._log(`${actor.name} falls.`);
          break;
        }
      }

      if (hazard.status?.id && !actor.isDead) {
        applyStatus(actor, {
          id: hazard.status.id,
          duration: hazard.status.duration,
          power: hazard.status.power,
          sourceId: hazard.ownerId,
          data: hazard.status.data
        });
        if (hazard.status.id === 'snared') this._log(`${actor.name} is snared.`);
        if (hazard.status.id === 'burning') this._log(`${actor.name} is burning.`);
        if (hazard.status.id === 'sealed') this._log(`${actor.name} is sealed.`);
        if (hazard.status.id === 'suppressed') this._log(`${actor.name} is suppressed.`);
      }
    }

    this.combatHazards = activeHazards(this.combatHazards ?? []);
    this._checkOutcome();
    return triggered;
  }

  _triggerOverwatch(enemy, { tileOnly = false } = {}) {
    if (!enemy || enemy.isDead || this.player?.isDead) return false;
    const status = getStatus(this.player, 'overwatch');
    if (!status) return false;
    const data = status.data ?? {};
    const enemyId = enemy.id ?? enemy.spawnId ?? null;
    const tileKey = `${enemy.position.x},${enemy.position.y}`;
    const targetMatches = data.targetId && data.targetId === enemyId;
    const tileMatches = data.tileKey && data.tileKey === tileKey;
    if (tileOnly && !tileMatches) return false;
    if (!targetMatches && !tileMatches) return false;

    this._refreshPlayerAttacks();
    const attack = this.player.getAttack(data.attackId) ?? this._firearmAttack(this.player);
    if (!attack) {
      removeStatus(this.player, 'overwatch');
      return false;
    }
    const preview = this._attackPreview(this.player, enemy, attack, {
      ignoreApCost: true,
      modifiers: [{ id: 'overwatch', label: 'OVERWATCH', value: 10 }]
    });
    if (!preview.enabled) return false;

    removeStatus(this.player, 'overwatch');
    this._faceToward(this.player, enemy.position);
    this._log(`Overwatch fires at ${enemy.name}.`);
    const roll = rollHit(preview.chance);
    const result = this.combat.performAttack(this.player, enemy, attack, {
      spendAp: false,
      chance: preview.chance,
      roll: roll.roll,
      hit: roll.hit,
      damage: preview.damage,
      damageTags: preview.damageTags,
      cover: preview.cover,
      chanceTags: preview.tags
    });
    this._degradeWeaponAttack(attack);
    this._consumePreparedAttack(this.player);
    for (const line of result.logs) this._log(line);
    this._pushEffect(result.effect);
    this._checkOutcome();
    return true;
  }

  _runEnemyTurn(dt) {
    const enemy = this.turnManager.current();
    if (!enemy || enemy.isDead) {
      this._advanceTurnPastDead();
      return;
    }

    // Plan this enemy's turn once.
    if (this.enemyActions === null || this.enemyActor !== enemy) {
      this.enemyActor = enemy;
      this.enemyActions = planTurn(enemy, this.player, this.grid, this.actors);
      this.actionTimer = ENEMY_ACTION_DELAY;
      const flavor = flavorLine(enemy, this.turnManager.round);
      if (flavor) this._log(flavor);
      if (this.enemyActions.length === 0) {
        this._log(`${enemy.name} holds its ground.`);
      }
      return;
    }

    this.actionTimer -= dt;
    if (this.actionTimer > 0) return;
    this.actionTimer = ENEMY_ACTION_DELAY;

    if (this.enemyActions.length === 0) {
      // Turn complete; hand off to the next actor.
      this._onCombatTurnEnded(enemy);
      this.enemyActions = null;
      this.enemyActor = null;
      const next = this._advanceCombatTurn();
      if (this.mode !== 'combat') return;
      if (next && next.type === 'player') this._log('Your move.');
      return;
    }

    const action = this.enemyActions.shift();
    this._triggerOverwatch(enemy);
    if (enemy.isDead || this.mode !== 'combat') return;
    if (action.type === 'move') {
      const moveCost = this._combatMoveApCost(enemy);
      if (enemy.ap < moveCost) {
        enemy.ap = 0;
        this.enemyActions = [];
        return;
      }
      const dir = { x: action.to.x - enemy.position.x, y: action.to.y - enemy.position.y };
      this._tryStep(enemy, dir, true);
      enemy.ap -= moveCost;
    } else if (action.type === 'attack') {
      const attack = enemy.attacks[0];
      const preview = this._attackPreview(enemy, this.player, attack);
      if (!preview.enabled) {
        this._log(preview.reason === 'No shot'
          ? `${enemy.name} has no shot.`
          : `${enemy.name} cannot attack. ${preview.reason}.`);
        enemy.ap = 0;
        this.enemyActions = [];
        return;
      }
      this._faceToward(enemy, this.player.position);
      const roll = rollHit(preview.chance);
      const result = this.combat.performAttack(enemy, this.player, attack, {
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
      if (!roll.hit) this._triggerRiposte(enemy);
      this._checkOutcome();
      if (this.mode !== 'combat') this.enemyActions = [];
    }
  }

  _triggerRiposte(enemy) {
    if (!enemy || enemy.isDead || this.player?.isDead) return false;
    if (!this._actorHasTechnique(this.player, 'riposte') || hasStatus(this.player, 'riposte-spent')) return false;
    if (chebyshev(this.player.position, enemy.position) > 1) return false;
    this._refreshPlayerAttacks();
    const attack = this._meleeAttack(this.player);
    if (!attack || attack.broken) return false;
    const preview = this._attackPreview(this.player, enemy, attack, {
      ignoreApCost: true,
      modifiers: [{ id: 'riposte', label: 'RIPOSTE', value: 10 }]
    });
    if (!preview.enabled) return false;

    applyStatus(this.player, { id: 'riposte-spent', duration: 1, sourceId: this.player.id });
    this._faceToward(this.player, enemy.position);
    this._log('Riposte.');
    const roll = rollHit(preview.chance);
    const result = this.combat.performAttack(this.player, enemy, attack, {
      spendAp: false,
      chance: preview.chance,
      roll: roll.roll,
      hit: roll.hit,
      damage: preview.damage,
      damageTags: preview.damageTags,
      cover: preview.cover,
      chanceTags: preview.tags
    });
    this._degradeWeaponAttack(attack);
    this._consumePreparedAttack(this.player);
    for (const line of result.logs) this._log(line);
    this._pushEffect(result.effect);
    this._checkOutcome();
    return true;
  }

  _advanceTurnPastDead() {
    this.enemyActions = null;
    this.enemyActor = null;
    this._advanceCombatTurn();
  }

  _checkOutcome() {
    const encounterEnemies = this._activeEncounterEnemies();
    const outcome = this.combat.outcome(this.player, encounterEnemies);
    if (outcome === 'victory') {
      const clearedEncounter = this.activeEncounter;
      if (!this.clearedEncounters.has(clearedEncounter)) this._awardExperienceForEnemies(encounterEnemies);
      this.turnManager.active = false;
      if (clearedEncounter) this.clearedEncounters.add(clearedEncounter);
      this.activeEncounter = null;
      this.enemyActions = null;
      this.enemyActor = null;
      this._clearCombatTechniquesState();

      if (this.enemies.some((enemy) => !enemy.isDead)) {
        this.mode = 'explore';
        this._log('The immediate fight breaks. Other voices still move in the ruins.');
        return;
      }

      this.mode = 'victory';
      this._log(this.level.victoryLog ?? 'The area falls quiet. Nothing answers now.');
      if (this.level.onVictory && !this.appliedLevelEvents.has('victory')) {
        this.appliedLevelEvents.add('victory');
        this._applyEffects(this.level.onVictory);
      }
      this._log('Explore on, or press R to begin again.');
    } else if (outcome === 'defeat') {
      this.mode = 'defeat';
      this.turnManager.active = false;
      this._clearCombatTechniquesState();
      this.player.render.state = 'dead';
      this._log(`${this.player.name} falls on the chapel stone. Press R to try again.`);
    }
  }

  _awardExperienceForEnemies(enemies) {
    const total = experienceRewardForEncounter(enemies);
    this._awardPlayerExperience(total);
  }

  _awardPlayerExperience(amount) {
    const result = awardExperience(this.player, amount);
    if (result.amount <= 0) return;
    this._log(`Experience gained: ${result.amount}.`);
    if (result.levelDelta > 0) {
      this._log(`Level ${result.level} reached.`);
      this._log(`Primary points available: ${result.primaryPoints}.`);
    }
  }

  // ---- End state ---------------------------------------------------------

  _handleEndState(actions) {
    for (const action of actions) {
      if (action === 'restart') {
        this.boot();
        return;
      }
      if (action === 'journal') {
        this._toggleJournal();
        return;
      }
      if (action === 'map') {
        this._toggleJournal({ section: 'MAP' });
        return;
      }
      if (action === 'debug') this.debugGrid = !this.debugGrid;
    }
  }

  // ---- Combat start ------------------------------------------------------

  _startCombat(encounterId = null, { fromAltar = false, initialTarget = null, selectedAttackId = null } = {}) {
    if (this.mode === 'combat') return;
    this._refreshPlayerAttacks();
    const resolvedEncounter = this._resolveEncounterId(encounterId);
    const combatants = this._livingEnemiesForEncounter(resolvedEncounter);
    if (combatants.length === 0) return;

    this.mode = 'combat';
    this.activeEncounter = resolvedEncounter;
    this._clearCombatTechniquesState();
    this.pathQueue = [];
    this.pendingExploreTarget = null;
    this.preCombatTarget = null;
    if (!combatants.some((enemy) => enemy.speech?.kind === 'aggro')) {
      this._speakCombatStartBark(combatants, resolvedEncounter);
    }
    for (const enemy of combatants) {
      if (enemy.speech?.kind !== 'aggro') enemy.speech = null;
    }
    this.turnManager.begin([this.player, ...combatants]);
    const initialIndex = initialTarget ? combatants.indexOf(initialTarget) : -1;
    this.targetIndex = initialIndex >= 0 ? initialIndex : 0;
    this.selectedAttackId = selectedAttackId ?? this.player.attacks[0]?.id ?? null;

    if (fromAltar) {
      this._log('The Host tissue beneath the altar pulses once, like a heart remembering worship.');
    }
    this._log('Combat begins.');
    const introLines = this._encounterIntro(resolvedEncounter).length
      ? this._encounterIntro(resolvedEncounter)
      : combatants.map((enemy) => `${enemy.name} advances.`);
    for (const line of introLines) this._log(line);
  }

  _clearCombatTechniquesState() {
    this.combatHazards = [];
    for (const actor of this.actors ?? []) clearStatuses(actor);
  }

  _refreshPlayerAttacks() {
    if (!this.player) return;
    const baseAttacks = this.player.baseAttacks ?? this.player.attacks ?? [];
    if (typeof this.inventory?.weaponAttacks === 'function') {
      this.player.attacks = this.inventory.weaponAttacks(baseAttacks);
    } else {
      this.player.attacks = baseAttacks.map((attack) => ({ ...attack }));
    }
    if (this.selectedAttackId && this.player.getAttack(this.selectedAttackId)) return;
    this.selectedAttackId = this.player.attacks[0]?.id ?? null;
  }

  _degradeWeaponAttack(attack) {
    if (!this.inventory?.degradeWeaponAttack?.(attack, 1)) return;
    this._refreshPlayerAttacks();
    this._syncInventoryOrder?.();
  }

  _speakCombatStartBark(combatants, encounterId) {
    const lines = combatStartBarkLines({
      level: this.level,
      trigger: this._encounterTrigger(encounterId)
    });
    const picked = chooseCombatStartBark({ combatants, lines });
    if (picked?.speaker && picked.line) {
      picked.speaker.speech = {
        text: picked.line,
        ttl: AGGRO_SPEECH_LIFE,
        kind: 'aggro'
      };
      return true;
    }

    const fallback = combatants.find((enemy) => Array.isArray(enemy.aggro) && enemy.aggro.length > 0 && !enemy.speech);
    if (!fallback) return false;
    this._speakAggroLine(fallback);
    return true;
  }
}

export function installGameCombatRuntime(GameClass) {
  installGameMethods(GameClass, GameCombatRuntime);
}
