import { findPath, findPathToAdjacent } from './Pathfinder.js';
import { SUSPICION_STATES, tileDistance } from './PerceptionSystem.js';

const INVESTIGATE_STEP_DELAY = 0.7;

export class PatrolSystem {
  constructor(game, callbacks = {}) {
    this.game = game;
    this.callbacks = callbacks;
  }

  handleArrival(actor) {
    const patrol = actor?.patrol;
    if (!patrol || patrol.complete || !Array.isArray(patrol.path)) return;
    const index = patrol.index ?? 0;
    const point = patrol.path[index];
    if (!point || actor.position.x !== point.x || actor.position.y !== point.y) return;
    if (point.activity && patrol.activityCompletedIndex !== index) return;
    if (patrol.mode !== 'once' || index < patrol.path.length - 1) return;
    patrol.complete = true;
    actor.patrolTimer = 0;
    if (!patrol.completedEffects && patrol.onComplete) {
      patrol.completedEffects = true;
      this.callbacks.applyEffects?.(patrol.onComplete);
    }
    if (patrol.removeOnComplete) this.callbacks.removeActorFromLevel?.(actor);
  }

  advanceExplore(dt) {
    if (this.game.mode !== 'explore' || this.game.uiScreen) return;
    for (const actor of [...this.game.enemies, ...this.game.npcs]) {
      if (actor.tableauReservation) continue;
      if (actor.dormant || actor.isDead || this.callbacks.isCellHidden?.(actor.position.x, actor.position.y)) continue;
      if (this.callbacks.isActorMoving?.(actor)) continue;
      const investigating = actor.type === 'enemy' && actor.suspicionState === SUSPICION_STATES.INVESTIGATING;
      if (investigating) {
        this.cancelActivity(actor);
      }
      if (this.advanceActivity(actor, dt)) continue;
      if (!investigating && this.startWaypointActivity(actor)) continue;
      const moveTarget = this.moveTarget(actor, dt);
      if (!moveTarget) continue;

      if (moveTarget.delay != null) {
        actor.patrolTimer = (actor.patrolTimer ?? moveTarget.delay) - dt;
        if (actor.patrolTimer > 0) continue;
      }

      const moveResult = this.moveActorTowardTarget(actor, moveTarget);
      if (moveResult.moved) {
        actor.patrolTimer = moveTarget.delay ?? this.waitAfterMove(actor, moveResult);
        return;
      }
      actor.patrolTimer = moveTarget.delay ?? this.waitAfterMove(actor, { reachedTarget: true });
    }
  }

  startWaypointActivity(actor) {
    const patrol = actor?.patrol;
    if (!patrol || patrol.complete || actor.patrolActivity || !Array.isArray(patrol.path)) return false;
    const waypointIndex = patrol.index ?? 0;
    const point = patrol.path[waypointIndex];
    if (!point?.activity || patrol.activityCompletedIndex === waypointIndex) return false;
    if (actor.position.x !== point.x || actor.position.y !== point.y) return false;

    const duration = Number.isFinite(point.activity.duration) && point.activity.duration > 0
      ? point.activity.duration
      : 2.4;
    actor.patrolActivity = {
      waypointIndex,
      activity: point.activity,
      elapsed: 0,
      duration
    };
    actor.patrolTimer = 0;
    const started = this.callbacks.startPatrolActivity?.(actor, point.activity);
    if (started === false) {
      actor.patrolActivity = null;
      patrol.activityCompletedIndex = waypointIndex;
      this.handleArrival(actor);
      return true;
    }
    this.callbacks.updatePatrolActivity?.(actor, point.activity, 0);
    return true;
  }

  advanceActivity(actor, dt) {
    const state = actor?.patrolActivity;
    if (!state) return false;
    const patrol = actor.patrol;
    const point = patrol?.path?.[state.waypointIndex];
    if (!patrol || patrol.complete || patrol.index !== state.waypointIndex ||
      actor.position.x !== point?.x || actor.position.y !== point?.y) {
      this.cancelActivity(actor);
      return false;
    }

    state.elapsed = Math.min(state.duration, state.elapsed + Math.max(0, dt));
    const progress = state.duration > 0 ? state.elapsed / state.duration : 1;
    this.callbacks.updatePatrolActivity?.(actor, state.activity, progress);
    if (progress < 1) return true;

    actor.patrolActivity = null;
    patrol.activityCompletedIndex = state.waypointIndex;
    this.callbacks.finishPatrolActivity?.(actor, state.activity, { cancelled: false });
    this.handleArrival(actor);
    return true;
  }

  cancelActivity(actor) {
    const state = actor?.patrolActivity;
    if (!state) return false;
    actor.patrolActivity = null;
    this.callbacks.finishPatrolActivity?.(actor, state.activity, { cancelled: true });
    return true;
  }

  cancelAllActivities() {
    for (const actor of [...(this.game.enemies ?? []), ...(this.game.npcs ?? [])]) {
      this.cancelActivity(actor);
    }
  }

  waitAfterMove(actor, moveResult) {
    if (!moveResult?.reachedTarget) return 0;
    if (actor.patrol?.mode === 'once') return 0;
    return this.callbacks.randomPatrolDelay?.(actor.patrol) ?? 0;
  }

  moveTarget(actor, dt) {
    if (actor.type === 'enemy' && actor.suspicionState === SUSPICION_STATES.INVESTIGATING && actor.investigationTarget) {
      const target = actor.investigationTarget;
      if (tileDistance(actor.position, target) <= 1) {
        actor.suspicionState = SUSPICION_STATES.WATCHING;
        actor.investigationTarget = null;
        return null;
      }
      return { target, adjacent: true, delay: INVESTIGATE_STEP_DELAY };
    }

    const patrol = actor.patrol;
    if (!patrol || patrol.complete || !Array.isArray(patrol.path) || patrol.path.length < 2) return null;
    let target = patrol.path[patrol.index ?? 0];
    if (target && actor.position.x === target.x && actor.position.y === target.y) {
      if (patrol.mode === 'once' && (patrol.index ?? 0) >= patrol.path.length - 1) return null;
      this.advanceIndex(actor);
      if (patrol.complete) return null;
      target = patrol.path[patrol.index ?? 0];
      actor.patrolTimer = actor.patrolTimer ?? patrol.timer ?? this.callbacks.randomPatrolDelay?.(patrol) ?? 0;
    }
    actor.patrolTimer = (actor.patrolTimer ?? 0) - dt;
    if (actor.patrolTimer > 0) return null;
    actor.patrolTimer = 0;
    if (target && actor.position.x === target.x && actor.position.y === target.y) {
      this.advanceIndex(actor);
      if (patrol.complete) return null;
      target = patrol.path[patrol.index ?? 0];
    }
    if (!target) return null;
    return { target, adjacent: false };
  }

  advanceIndex(actor) {
    const patrol = actor.patrol;
    if (!patrol || !Array.isArray(patrol.path) || patrol.path.length < 2) return;
    patrol.activityCompletedIndex = null;
    if (patrol.mode === 'once') {
      const next = (patrol.index ?? 0) + 1;
      if (next >= patrol.path.length) {
        patrol.complete = true;
        return;
      }
      patrol.index = next;
      return;
    }
    if (patrol.mode === 'pingpong') {
      const direction = patrol.direction === -1 ? -1 : 1;
      let next = (patrol.index ?? 0) + direction;
      if (next >= patrol.path.length || next < 0) {
        patrol.direction = direction * -1;
        next = (patrol.index ?? 0) + patrol.direction;
      }
      patrol.index = Math.max(0, Math.min(patrol.path.length - 1, next));
      return;
    }
    patrol.index = ((patrol.index ?? 0) + 1) % patrol.path.length;
  }

  moveActorTowardTarget(actor, moveTarget) {
    const occupied = this.callbacks.occupiedSet?.(actor) ?? new Set();
    const path = moveTarget.adjacent
      ? findPathToAdjacent(this.game.grid, actor.position, moveTarget.target, occupied)
      : findPath(this.game.grid, actor.position, moveTarget.target, occupied);
    if (!path || path.length === 0) return { moved: false, reachedTarget: false };
    const step = path[0];
    const dir = {
      x: Math.sign(step.x - actor.position.x),
      y: Math.sign(step.y - actor.position.y)
    };
    const moved = this.callbacks.tryStep?.(actor, dir, { logBlock: false }) ?? false;
    return { moved, reachedTarget: moved && path.length === 1 };
  }
}
