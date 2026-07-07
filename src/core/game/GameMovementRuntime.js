import { FIELD_RATINGS, calculateFieldRating, normalizeProgression } from '../Progression.js';
import { manhattan } from '../../combat/CombatSystem.js';
import { findPath } from '../../world/Pathfinder.js';
import { SUSPICION_SEVERITY } from '../../world/PerceptionSystem.js';
import { gridToScreen, screenFacing } from '../../render/isoMath.js';
import { VIEWPORT_HEIGHT } from '../../render/renderConfig.js';
import {
  SNEAK_SPEECH_LIFE,
  SNEAK_STEP_DURATION,
  SPRINT_STEP_DURATION,
  STEP_DURATION,
  TRIGGER_RADIUS,
  WALK_FRAMES
} from './runtimeConstants.js';
import { installGameMethods } from './installGameMethods.js';

class GameMovementRuntime {
  // ---- Movement ----------------------------------------------------------

  // Begin a stepped move of `actor` by `dir` if the destination is free.
  // Returns true if a step started.
  _tryStep(actor, dir, { logBlock = false, moveState = null } = {}) {
    if (this.moving) return false;
    const nx = actor.position.x + dir.x;
    const ny = actor.position.y + dir.y;
    if (this._isCellHidden(nx, ny) || !this.grid.isWalkable(nx, ny) || this._isOccupied(nx, ny, actor)) {
      if (logBlock) this._log('The ruins do not give way.');
      return false;
    }

    // Face the way we step (one of eight isometric facings).
    actor.facing = screenFacing(dir.x, dir.y);
    // Screen-space delta is independent of the camera origin (it cancels).
    const from = gridToScreen(actor.position.x, actor.position.y, 0);
    actor.moveTo(nx, ny);
    const to = gridToScreen(nx, ny, 0);
    actor.pxOffset = { x: from.x - to.x, y: from.y - to.y };
    const stateName = moveState ?? this._defaultMoveState(actor);
    actor.render.state = stateName;
    actor.render.frameIndex = 0;
    actor.render.timer = 0;

    this.moving = {
      actor,
      t: 0,
      stateName,
      sneakMode: actor === this.player && this.mode === 'explore' && this.sneakMode,
      usedSprint: actor === this.player && this.mode === 'explore' && this._isSprintHeld(),
      fromX: actor.pxOffset.x,
      fromY: actor.pxOffset.y
    };
    return true;
  }

  // Advance the active step. Returns true while a step is in flight. The visual
  // offset is quantized to the walk frames so movement keeps an old CRPG cadence
  // instead of smooth modern tweening.
  _advanceMovement(dt) {
    if (!this.moving) return false;
    const move = this.moving;
    const movementState = this._movementStateForActiveStep(move);
    if (move.actor === this.player && this.mode === 'explore' && this._isSprintHeld()) {
      move.usedSprint = true;
    }
    const duration = this._stepDurationForState(movementState);
    move.t = Math.min((move.t ?? 0) + (dt / duration), 1);
    const ratio = move.t;
    const frameIndex = Math.min(WALK_FRAMES - 1, Math.floor(ratio * WALK_FRAMES));
    const visualRatio = ratio >= 1 ? 1 : frameIndex / WALK_FRAMES;
    move.actor.pxOffset = {
      x: Math.round(move.fromX * (1 - visualRatio)),
      y: Math.round(move.fromY * (1 - visualRatio))
    };
    if (!move.actor.isDead) {
      move.actor.render.state = movementState;
      move.actor.render.frameIndex = frameIndex;
    }

    if (ratio >= 1) {
      move.actor.pxOffset = { x: 0, y: 0 };
      if (move.actor === this.player && this.mode === 'explore') {
        move.actor.pendingSuspicionSeverity = this._movementSeverityForCompletedStep(move);
      }
      if (move.actor.render.state === movementState) {
        move.actor.render.state = this._idleStateFor(move.actor);
        move.actor.render.frameIndex = 0;
      }
      this.moving = null;
      this._onStepComplete(move.actor);
    }
    return this.moving !== null;
  }

  _defaultMoveState(actor) {
    return actor === this.player && this.mode === 'explore' ? this._currentPlayerMoveState() : 'walk';
  }

  _currentPlayerMoveState() {
    if (this.mode === 'explore' && this._isSprintHeld()) return 'walk';
    return this.mode === 'explore' && this.sneakMode ? 'sneak' : 'walk';
  }

  _movementStateForActiveStep(move) {
    if (move.actor === this.player && this.mode === 'explore') {
      if (this._isSprintHeld()) return 'walk';
      return move.sneakMode ? 'sneak' : 'walk';
    }
    return move.stateName ?? 'walk';
  }

  _stepDurationForState(stateName) {
    if (this.mode === 'explore' && this.moving?.actor === this.player && this._isSprintHeld()) {
      return SPRINT_STEP_DURATION;
    }
    return stateName === 'sneak' ? SNEAK_STEP_DURATION : STEP_DURATION;
  }

  _movementSeverityForCompletedStep(move) {
    if (move.usedSprint) return SUSPICION_SEVERITY.HIGH;
    return move.sneakMode ? SUSPICION_SEVERITY.LOW : SUSPICION_SEVERITY.MEDIUM;
  }

  _idleStateFor(actor) {
    return actor === this.player && this.mode === 'explore' && this.sneakMode ? 'sneakIdle' : 'idle';
  }

  _isSprintHeld() {
    return Boolean(this.input?.isHeld?.('shift') || this.input?.keys?.has?.('shift'));
  }

  _toggleSneakMode() {
    if (this.mode !== 'explore') return;
    this.sneakMode = !this.sneakMode;
    if (this.sneakMode) {
      this.player.speech = { text: 'Shhh.', ttl: SNEAK_SPEECH_LIFE, kind: 'sneak' };
    } else if (this.player.speech?.kind === 'sneak') {
      this.player.speech = null;
    }
    if (this.moving?.actor === this.player && !this.player.isDead) {
      this.moving.sneakMode = this.sneakMode;
      this.moving.stateName = this._currentPlayerMoveState();
      this.player.render.state = this._movementStateForActiveStep(this.moving);
    } else if (!this.moving && !this.player.isDead) {
      this.player.render.state = this._idleStateFor(this.player);
      this.player.render.frameIndex = 0;
    }
    this._log(this.sneakMode ? 'You crouch low.' : 'You stand.');
  }

  // Walk the next cell of a queued click-to-move path.
  _stepAlongPath() {
    if (this.pathQueue.length === 0) return;
    if (this.mode === 'combat' && !this.turnManager.isPlayerTurn()) return;
    if (this.mode === 'defeat') { this.pathQueue = []; return; }
    const moveCost = this.mode === 'combat'
      ? (this._combatMoveApCost?.(this.player) ?? this.player.moveCost)
      : this.player.moveCost;
    if (this.mode === 'combat' && this.player.ap < moveCost) {
      this.pathQueue = [];
      return;
    }
    const next = this.pathQueue[0];
    const dir = {
      x: Math.sign(next.x - this.player.position.x),
      y: Math.sign(next.y - this.player.position.y)
    };
    if (this._tryStep(this.player, dir, { logBlock: false })) {
      this.pathQueue.shift();
      if (this.mode === 'combat') {
        this.player.ap -= moveCost;
        this._markCombatMoveSpent?.(this.player);
      }
    } else {
      this.pathQueue = [];
    }
  }

  // Left-click a walkable tile to path there; click an enemy (in combat) to
  // target it.
  _handleClickMove(click, combat) {
    if (click.button !== 0) return;
    if (click.y >= VIEWPORT_HEIGHT) return; // ignore clicks on the UI bar
    const cell = this.renderer.toGrid(click.x, click.y);
    if (!this.grid.isInside(cell.x, cell.y)) return;

    if (combat) {
      const idx = this._livingEnemies().findIndex(
        (e) => e.position.x === cell.x && e.position.y === cell.y
      );
      if (idx >= 0) {
        this.targetIndex = idx;
        this._faceToward(this.player, cell);
        this.pathQueue = [];
        this._log(`Target: ${this._livingEnemies()[idx].name}.`);
        return;
      }
    }
    if (this._isCellHidden(cell.x, cell.y) || !this.grid.isWalkable(cell.x, cell.y)) return;
    const path = findPath(this.grid, this.player.position, cell, this._occupiedSet(this.player));
    this.pathQueue = path && path.length ? path : [];
  }

  _queueJournalMapWalk(cell, map) {
    if (this.mode !== 'explore' || !cell || !map) return false;
    const target = { x: Math.round(cell.x), y: Math.round(cell.y) };
    if (!this.grid?.isInside?.(target.x, target.y)) return false;
    if (!journalMapCellIsKnown(map, target)) return false;
    if (this._isCellHidden(target.x, target.y) || !this.grid.isWalkable(target.x, target.y)) return false;
    if (target.x === this.player.position.x && target.y === this.player.position.y) return false;

    const known = knownJournalMapCells(map);
    const startKey = cellKey(this.player.position.x, this.player.position.y);
    const knownGrid = {
      isWalkable: (x, y) => {
        const key = cellKey(x, y);
        return this.grid.isInside(x, y) &&
          this.grid.isWalkable(x, y) &&
          !this._isCellHidden(x, y) &&
          (key === startKey || known.has(key));
      }
    };
    const path = findPath(knownGrid, this.player.position, target, this._occupiedSet(this.player));
    if (!path?.length) return false;

    this.pendingExploreTarget = null;
    this.preCombatTarget = null;
    this.pathQueue = path;
    return true;
  }

  _onStepComplete(actor) {
    if (this.mode === 'combat') {
      this._triggerCombatStepEffects?.(actor);
      return;
    }
    if (actor === this.player && this.mode === 'explore') {
      this._revealMapAroundPlayer();
      const severity = this.player.pendingSuspicionSeverity ?? SUSPICION_SEVERITY.LOW;
      this.player.pendingSuspicionSeverity = null;
      this._registerSuspiciousAction(severity, 'movement');
      if (this.mode !== 'explore') return;
      this._checkCombatProximity();
      if (this.mode !== 'explore') return;
      if (this._triggerLevelTransitionAtPlayer()) return;
      this._tryCompletePendingExploreTarget();
    } else if (actor?.type === 'enemy' && this.mode === 'explore') {
      this._registerSuspiciousAction(SUSPICION_SEVERITY.MEDIUM, 'patrol');
    }
    if (actor !== this.player && this.mode === 'explore') {
      this._handlePatrolArrival(actor);
    }
  }

  _handlePatrolArrival(actor) {
    this.patrolSystem.handleArrival(actor);
  }

  _removeActorFromLevel(actor) {
    if (!actor) return;
    actor.removed = true;
    actor.speech = null;
    this.npcs = (this.npcs ?? []).filter((entry) => entry !== actor);
    this.enemies = (this.enemies ?? []).filter((entry) => entry !== actor);
    if (this.dialogueActor === actor) this.dialogueActor = null;
    if (this.preCombatTarget === actor) this.preCombatTarget = null;
  }

  _checkCombatProximity() {
    const speaker = this._triggeredDialogueEnemy();
    if (speaker) {
      this._openEnemyDialogue(speaker);
      return;
    }

    for (const trigger of this.level.combatTriggers ?? []) {
      if (this._isCellHidden(trigger.x, trigger.y)) continue;
      const encounterId = this._resolveEncounterId(trigger.encounter ?? trigger.id);
      if (this.clearedEncounters.has(encounterId)) continue;
      if (this._livingEnemiesForEncounter(encounterId).length === 0) continue;
      if (trigger.forceCombat === true && manhattan(this.player.position, trigger) <= (trigger.radius ?? TRIGGER_RADIUS)) {
        this._startCombat(encounterId);
        return;
      }
    }
  }

  _triggerLevelTransitionAtPlayer() {
    if (this.pendingLevelTransition || this.mode !== 'explore' || !this.player?.position) return false;
    const transition = this._levelTransitionAtCell(this.player.position);
    const loadLevel = transition?.loadLevel ?? null;
    if (!loadLevel || typeof loadLevel !== 'object' || Array.isArray(loadLevel)) return false;

    this.pendingLevelTransition = transition.id ?? `${transition.x},${transition.y}`;
    this.pathQueue = [];
    this.pendingExploreTarget = null;
    this.preCombatTarget = null;
    void this._transitionLevel(loadLevel).finally(() => {
      this.pendingLevelTransition = null;
    });
    return true;
  }

  _levelTransitionAtCell(cell, { includeClickAreas = false } = {}) {
    if (!cell) return null;
    return (this.level?.levelTransitions ?? []).find((entry) =>
      this._meetsConditions(entry.conditions) &&
      transitionMatchesCell(entry, cell, includeClickAreas)
    ) ?? null;
  }

  _registerSuspiciousAction(severity = SUSPICION_SEVERITY.LOW, action = 'movement', options = {}) {
    return this.stealthRuntime.registerSuspiciousAction(severity, action, options);
  }

  _speakAggroLine(enemy) {
    this.stealthRuntime.speakAggroLine(enemy);
  }

  _enemyPerceptionRating(enemy, perception = null) {
    const field = FIELD_RATINGS.find((entry) => entry.id === 'search');
    const base = field ? calculateFieldRating(normalizeProgression(enemy.progression), field) : 0;
    return base + (perception?.ratingBonus ?? 0);
  }

  _advanceExplorePatrols(dt) {
    this.patrolSystem.advanceExplore(dt);
  }
}

export function installGameMovementRuntime(GameClass) {
  installGameMethods(GameClass, GameMovementRuntime);
}

function journalMapCellIsKnown(map, cell) {
  return (map.cells ?? []).some((entry) =>
    entry.x === cell.x &&
    entry.y === cell.y &&
    entry.explored &&
    !entry.hidden
  );
}

function knownJournalMapCells(map) {
  return new Set(
    (map.cells ?? [])
      .filter((entry) => entry.explored && !entry.hidden)
      .map((entry) => entry.key ?? cellKey(entry.x, entry.y))
  );
}

function cellKey(x, y) {
  return `${x},${y}`;
}

function transitionMatchesCell(transition, cell, includeClickAreas) {
  if (!transition || typeof transition !== 'object') return false;
  if (transition.x === cell.x && transition.y === cell.y) return true;
  if (!includeClickAreas || !Array.isArray(transition.clickAreas)) return false;
  return transition.clickAreas.some((area) => cellInRect(cell, area));
}

function cellInRect(cell, area) {
  if (!area || typeof area !== 'object') return false;
  const { x0, y0, x1, y1 } = area;
  if (![x0, y0, x1, y1].every((value) => typeof value === 'number')) return false;
  const left = Math.min(x0, x1);
  const right = Math.max(x0, x1);
  const top = Math.min(y0, y1);
  const bottom = Math.max(y0, y1);
  return cell.x >= left && cell.x <= right && cell.y >= top && cell.y <= bottom;
}
