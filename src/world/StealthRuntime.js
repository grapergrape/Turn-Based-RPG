import {
  canSeeActor,
  nextSuspicionState,
  noticeSuspiciousAction,
  resolveStealthCheck,
  suspicionStateRank,
  visionConeCells,
  SUSPICION_SEVERITY,
  SUSPICION_STATES
} from './PerceptionSystem.js';

const AGGRO_SPEECH_LIFE = 2.35;

export class StealthRuntime {
  constructor(game, callbacks = {}) {
    this.game = game;
    this.callbacks = callbacks;
  }

  registerSuspiciousAction(severity = SUSPICION_SEVERITY.LOW, action = 'movement', options = {}) {
    const requireSight = options.requireSight ?? action !== 'firing';
    const encounterFilter = options.encounterId != null
      ? this.callbacks.resolveEncounterId?.(options.encounterId)
      : null;
    const canAlertInCombat = this.game.mode === 'combat' && (action === 'firing' || action === 'attack');
    if ((this.game.mode !== 'explore' && !canAlertInCombat) || !this.game.player || this.game.player.isDead) return false;
    const notices = [];
    for (const enemy of this.game.enemies) {
      if (!this.canEnemyNoticeSuspicion(enemy)) continue;
      if (options.observer && enemy !== options.observer) continue;
      if (encounterFilter && this.callbacks.resolveEncounterId?.(enemy.encounter) !== encounterFilter) continue;
      if (requireSight) {
        const sight = canSeeActor(enemy, this.game.player, {
          grid: this.game.grid,
          hiddenTiles: this.game.hiddenTiles,
          defaults: this.perceptionDefaults()
        });
        if (!sight.canSee) continue;
        notices.push({ enemy, notice: { noticed: true, reason: 'seen', ...sight } });
      } else {
        const notice = noticeSuspiciousAction(enemy, this.game.player, {
          severity,
          grid: this.game.grid,
          hiddenTiles: this.game.hiddenTiles,
          defaults: this.perceptionDefaults()
        });
        if (!notice.noticed) continue;
        notices.push({ enemy, notice });
      }
    }
    if (!notices.length) return false;

    notices.sort((a, b) =>
      (a.notice.reason === 'seen' ? 0 : 1) - (b.notice.reason === 'seen' ? 0 : 1) ||
      a.notice.distance - b.notice.distance ||
      suspicionStateRank(b.enemy.suspicionState) - suspicionStateRank(a.enemy.suspicionState)
    );

    const stealthRating = this.callbacks.fieldRating?.('stealth') ?? 0;
    for (const { enemy, notice } of notices) {
      const observerRating = this.callbacks.enemyPerceptionRating?.(enemy, notice.perception) ?? 0;
      const check = resolveStealthCheck({
        severity,
        stealthRating,
        observerRating,
        perception: notice.perception
      });
      const nextState = nextSuspicionState({
        severity,
        success: check.success,
        currentState: enemy.suspicionState
      });
      if (!check.success) this.callbacks.faceToward?.(enemy, this.game.player.position);
      if (this.applySuspicionState(enemy, nextState, { action, severity, notice, check })) {
        return true;
      }
    }
    return true;
  }

  canEnemyNoticeSuspicion(enemy) {
    if (!enemy || enemy.isDead) return false;
    const encounterId = this.callbacks.resolveEncounterId?.(enemy.encounter);
    if (this.game.mode === 'combat' && this.game.activeEncounter && encounterId === this.callbacks.resolveEncounterId?.(this.game.activeEncounter)) {
      return false;
    }
    if (this.game.clearedEncounters.has(encounterId)) return false;
    if (this.callbacks.isCellHidden?.(enemy.position.x, enemy.position.y)) return false;
    if (enemy.aggroRadius === 0 && enemy.dialogue && !enemy.perception) return false;
    return true;
  }

  applySuspicionState(enemy, nextState, { action, notice } = {}) {
    const previous = enemy.suspicionState ?? SUSPICION_STATES.CALM;
    if (suspicionStateRank(nextState) <= suspicionStateRank(previous)) {
      if (nextState === SUSPICION_STATES.INVESTIGATING) {
        enemy.investigationTarget = { ...this.game.player.position };
      }
      return false;
    }

    enemy.suspicionState = nextState;
    enemy.suspicionAction = action;
    enemy.suspicionReason = notice?.reason ?? null;
    if (nextState === SUSPICION_STATES.WATCHING) {
      enemy.investigationTarget = { ...this.game.player.position };
      this.callbacks.log?.(notice?.reason === 'seen'
        ? `${enemy.name} catches movement.`
        : `${enemy.name} pauses and listens.`);
      return false;
    }
    if (nextState === SUSPICION_STATES.INVESTIGATING) {
      enemy.investigationTarget = { ...this.game.player.position };
      enemy.patrolTimer = 0;
      this.callbacks.log?.(notice?.reason === 'seen'
        ? `${enemy.name} moves to check the aisle.`
        : `${enemy.name} moves to check the noise.`);
      return false;
    }
    if (nextState === SUSPICION_STATES.ALERTED) {
      this.speakAggroLine(enemy);
      this.callbacks.log?.(`${enemy.name} raises the alarm.`);
      this.alertEnemy(enemy);
      return true;
    }
    return false;
  }

  speakAggroLine(enemy) {
    if (!enemy || enemy.isDead || !Array.isArray(enemy.aggro) || enemy.aggro.length === 0) return;
    const index = enemy.aggroIndex ?? 0;
    enemy.speech = {
      text: enemy.aggro[index % enemy.aggro.length],
      ttl: AGGRO_SPEECH_LIFE,
      kind: 'aggro'
    };
    enemy.aggroIndex = index + 1;
  }

  alertEnemy(enemy) {
    if (this.game.mode === 'combat' && this.game.activeEncounter) {
      const active = this.callbacks.resolveEncounterId?.(this.game.activeEncounter);
      if (this.callbacks.resolveEncounterId?.(enemy.encounter) !== active) {
        enemy.encounter = active;
        if (!this.game.turnManager.order.includes(enemy)) {
          enemy.resetAp();
          this.game.turnManager.order.push(enemy);
        }
        this.callbacks.log?.(`${enemy.name} joins the fight.`);
      }
      return;
    }
    this.callbacks.closeUiScreen?.();
    this.callbacks.startCombat?.(enemy.encounter);
  }

  perceptionDefaults() {
    return {
      visionRadius: this.game.level?.enemyVisionRadius ?? null,
      coneDegrees: this.game.level?.enemyVisionCone ?? null,
      hearingRadius: this.game.level?.enemyHearingRadius ?? null
    };
  }

  visionCones() {
    const defaults = this.perceptionDefaults();
    return (this.game.enemies ?? [])
      .filter((enemy) => this.canEnemyNoticeSuspicion(enemy))
      .map((enemy) => ({
        enemyId: enemy.spawnId ?? enemy.id,
        state: enemy.suspicionState ?? SUSPICION_STATES.CALM,
        cells: visionConeCells(enemy, {
          grid: this.game.grid,
          hiddenTiles: this.game.hiddenTiles,
          defaults
        }).map((cell) => cell.key)
      }))
      .filter((cone) => cone.cells.length > 0);
  }
}
