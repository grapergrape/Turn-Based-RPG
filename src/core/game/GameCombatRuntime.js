import { buildContextActionsForTarget } from '../ContextActions.js';
import { awardExperience, experienceRewardForEncounter } from '../Progression.js';
import { chooseCombatStartBark, combatStartBarkLines } from '../../combat/CombatBarks.js';
import { chebyshev } from '../../combat/CombatSystem.js';
import { flavorLine, planTurn } from '../../combat/EnemyAI.js';
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
        if (this.player.ap >= this.player.moveCost) {
          const moved = this._tryStep(this.player, movement.dir, { logBlock: false });
          if (moved) {
            this.player.ap -= this.player.moveCost;
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
    return buildContextActionsForTarget({
      player: this.player,
      target,
      enemies: this.enemies,
      grid: this.grid,
      occupied: this._occupiedSet(this.player),
      techniqueDefs: this.techniqueDefs,
      inventory: this.inventory,
      objectName: (object) => this._objectName(object)
    });
  }

  _attackActionState(attack, target, extraAp = 0) {
    if (!attack) return { enabled: false, reason: 'No attack' };
    if (!target || target.isDead) return { enabled: false, reason: 'No target' };
    if (chebyshev(this.player.position, target.position) > attack.range) {
      return { enabled: false, reason: 'Out of range' };
    }
    const cost = attack.apCost + extraAp;
    if (this.player.ap < cost) return { enabled: false, reason: `Need ${cost} AP` };
    return { enabled: true, reason: '' };
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
    if (action.techniqueId !== 'aimed-shot') {
      this._log('Technique is not ready yet.');
      return;
    }
    const attack = this.player.getAttack(action.attackId);
    const target = action.target;
    const state = this._attackActionState(attack, target, action.extraAp ?? 0);
    if (!state.enabled) {
      if (state.reason) this._log(state.reason);
      return;
    }
    this._setCombatTarget(target);
    this.selectedAttackId = attack.id;
    this.player.ap -= attack.apCost + (action.extraAp ?? 0);
    this._registerSuspiciousAction(SUSPICION_SEVERITY.HIGH, 'firing');
    this._faceToward(this.player, target.position);
    this._log('Aimed Shot.');
    const result = this.combat.performAttack(this.player, target, attack, {
      damageMultiplier: action.damageMultiplier ?? 1,
      spendAp: false
    });
    for (const line of result.logs) this._log(line);
    this._pushEffect(result.effect);
    this._checkOutcome();
  }

  _setCombatTarget(target) {
    const idx = this._livingEnemies().indexOf(target);
    if (idx >= 0) this.targetIndex = idx;
  }

  _selectAttack(id) {
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
    const attack = this.player.getAttack(this.selectedAttackId);
    const target = this._currentTarget();
    if (!attack || !target) return;
    if (!options.ignoreApCost && this.player.ap < attack.apCost) {
      this._log('Not enough AP for that attack.');
      return;
    }
    if (chebyshev(this.player.position, target.position) > attack.range) {
      this._log('Target is out of range.');
      return;
    }
    if (attack.range > 1) this._registerSuspiciousAction(SUSPICION_SEVERITY.HIGH, 'firing');
    this._faceToward(this.player, target.position);
    const result = this.combat.performAttack(this.player, target, attack, options.sneakAttack ? {
      damageMultiplier: SNEAK_ATTACK_MULTIPLIER,
      opening: 'sneak',
      spendAp: options.spendAp
    } : {
      spendAp: options.spendAp
    });
    for (const line of result.logs) this._log(line);
    this._pushEffect(result.effect);
    this._checkOutcome();
  }

  _endPlayerTurn() {
    if (this.mode !== 'combat') return;
    const next = this.turnManager.endTurn();
    if (!next) return;
    this.enemyActions = null;
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
      this.enemyActions = null;
      this.enemyActor = null;
      const next = this.turnManager.endTurn();
      if (next && next.type === 'player') this._log('Your move.');
      return;
    }

    const action = this.enemyActions.shift();
    if (action.type === 'move') {
      const dir = { x: action.to.x - enemy.position.x, y: action.to.y - enemy.position.y };
      this._tryStep(enemy, dir, true);
      enemy.ap -= enemy.moveCost;
    } else if (action.type === 'attack') {
      const attack = enemy.attacks[0];
      this._faceToward(enemy, this.player.position);
      const result = this.combat.performAttack(enemy, this.player, attack);
      for (const line of result.logs) this._log(line);
      this._pushEffect(result.effect);
      this._checkOutcome();
      if (this.mode !== 'combat') this.enemyActions = [];
    }
  }

  _advanceTurnPastDead() {
    this.enemyActions = null;
    this.enemyActor = null;
    this.turnManager.endTurn();
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
    const resolvedEncounter = this._resolveEncounterId(encounterId);
    const combatants = this._livingEnemiesForEncounter(resolvedEncounter);
    if (combatants.length === 0) return;

    this.mode = 'combat';
    this.activeEncounter = resolvedEncounter;
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
