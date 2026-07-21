import { findPath } from './Pathfinder.js';

const TABLEAU_STEP_DELAY = 0.42;
const TABLEAU_STALL_LIMIT = 9;
const TABLEAU_BARK_LIFE = 2.8;

function cellKey(x, y) {
  return `${x},${y}`;
}

function distance(a, b) {
  return Math.abs((a?.x ?? 0) - (b?.x ?? 0)) + Math.abs((a?.y ?? 0) - (b?.y ?? 0));
}

function stableHash(value) {
  let hash = 2166136261;
  for (const character of String(value)) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export class TableauSystem {
  constructor(game, callbacks = {}) {
    this.game = game;
    this.callbacks = callbacks;
    this.states = [];
    this.reservations = new Map();
  }

  setTableaux(definitions = []) {
    this.cancelAll('level-change');
    this.states = (definitions ?? []).map((definition) => ({
      definition,
      timer: definition.startDelay ?? 0,
      cycle: 0,
      active: null
    }));
  }

  advanceExplore(dt) {
    if (this.states.length === 0) return;
    if (this.game.mode !== 'explore' || this.game.uiScreen) {
      this.cancelAll(this.game.mode !== 'explore' ? 'mode-change' : 'ui-interrupt');
      return;
    }

    for (const state of this.states) {
      if (state.active) {
        this.#advanceActive(state, Math.max(0, dt));
        continue;
      }
      state.timer = Math.max(0, state.timer - Math.max(0, dt));
      if (state.timer > 0 || !this.#playerIsNear(state.definition)) continue;
      if (!this.#start(state)) state.timer = 2;
    }
  }

  isReserved(x, y, actor = null) {
    const owner = this.reservations.get(cellKey(x, y));
    return Boolean(owner && owner !== actor);
  }

  addReservedCells(target, actor = null) {
    for (const [key, owner] of this.reservations) {
      if (owner !== actor) target.add(key);
    }
    return target;
  }

  cancelAll(reason = 'cancelled') {
    for (const state of this.states) {
      if (state.active) this.#finish(state, { cancelled: true, reason });
    }
    this.reservations.clear();
  }

  #playerIsNear(definition) {
    return distance(this.game.player?.position, definition.center) <= definition.activationRadius;
  }

  #actorById(actorId) {
    return [...(this.game.npcs ?? []), ...(this.game.enemies ?? [])].find((actor) =>
      (actor.spawnId ?? actor.id) === actorId || actor.id === actorId
    ) ?? null;
  }

  #start(state) {
    const participantIds = new Set(state.definition.participants.map((entry) => entry.actor));
    const participants = [];
    for (const definition of state.definition.participants) {
      const actor = this.#actorById(definition.actor);
      if (!actor || actor.isDead || actor.removed || actor.dormant || actor.tableauReservation) return false;
      const occupant = this.game.actors.find((candidate) =>
        candidate !== actor &&
        !candidate.isDead &&
        candidate.position.x === definition.slot.x &&
        candidate.position.y === definition.slot.y
      );
      if (occupant && !participantIds.has(occupant.spawnId ?? occupant.id)) return false;
      participants.push({
        definition,
        actor,
        home: { x: actor.position.x, y: actor.position.y },
        homeFacing: actor.facing,
        moveTimer: 0,
        stalled: 0,
        arrived: false,
        activityStarted: false,
        activityFinished: false
      });
    }

    for (const participant of participants) {
      const { actor, definition } = participant;
      this.callbacks.cancelPatrolActivity?.(actor);
      this.callbacks.cancelMovement?.(actor);
      actor.speech = null;
      actor.tableauReservation = {
        tableauId: state.definition.id,
        home: { ...participant.home },
        homeFacing: participant.homeFacing,
        slot: { ...definition.slot }
      };
      this.reservations.set(cellKey(definition.slot.x, definition.slot.y), actor);
    }

    state.active = {
      phase: 'gather',
      elapsed: 0,
      stalled: 0,
      participants,
      firedBarks: new Set()
    };
    return true;
  }

  #advanceActive(state, dt) {
    const active = state.active;
    if (!active) return;
    if (active.participants.some(({ actor }) => actor.isDead || actor.removed || actor.dormant)) {
      this.#finish(state, { cancelled: true, reason: 'participant-unavailable' });
      return;
    }

    if (active.phase === 'gather') {
      const allArrived = this.#advanceMovementPhase(active, dt, (participant) => participant.definition.slot);
      if (allArrived) {
        active.phase = 'perform';
        active.elapsed = 0;
        active.stalled = 0;
      }
      return;
    }

    if (active.phase === 'perform') {
      active.elapsed += dt;
      for (const bark of state.definition.barks ?? []) {
        const barkKey = `${bark.actor}:${bark.at}`;
        if (active.firedBarks.has(barkKey) || active.elapsed < bark.at) continue;
        active.firedBarks.add(barkKey);
        const actor = this.#actorById(bark.actor);
        if (actor && !actor.speech) actor.speech = { text: bark.text, ttl: TABLEAU_BARK_LIFE, kind: 'tableau' };
      }

      let allFinished = true;
      for (const participant of active.participants) {
        const localTime = active.elapsed - participant.definition.delay;
        if (localTime < 0) {
          allFinished = false;
          continue;
        }
        const owner = `tableau:${state.definition.id}`;
        if (!participant.activityStarted) {
          participant.activityStarted = this.callbacks.startActivity?.(
            participant.actor,
            participant.definition.activity,
            owner
          ) !== false;
          if (!participant.activityStarted) {
            this.#finish(state, { cancelled: true, reason: 'activity-unavailable' });
            return;
          }
        }
        const duration = participant.definition.activity.duration;
        const progress = Math.max(0, Math.min(1, localTime / duration));
        this.callbacks.updateActivity?.(participant.actor, participant.definition.activity, progress, owner);
        if (progress < 1) {
          allFinished = false;
          continue;
        }
        if (!participant.activityFinished) {
          participant.activityFinished = true;
          this.callbacks.finishActivity?.(participant.actor, owner);
        }
      }

      if (allFinished) {
        active.phase = 'return';
        active.elapsed = 0;
        active.stalled = 0;
        for (const participant of active.participants) {
          participant.moveTimer = 0;
          participant.stalled = 0;
          participant.arrived = false;
        }
      }
      return;
    }

    if (active.phase === 'return') {
      const allHome = this.#advanceMovementPhase(active, dt, (participant) => participant.home);
      if (allHome) this.#finish(state, { cancelled: false, reason: 'complete' });
    }
  }

  #advanceMovementPhase(active, dt, targetFor) {
    let allArrived = true;
    let anyPath = false;
    for (const participant of active.participants) {
      const { actor } = participant;
      const target = targetFor(participant);
      if (actor.position.x === target.x && actor.position.y === target.y) {
        participant.arrived = true;
        participant.stalled = 0;
        continue;
      }
      participant.arrived = false;
      allArrived = false;
      if (this.callbacks.isActorMoving?.(actor)) {
        anyPath = true;
        continue;
      }
      participant.moveTimer = Math.max(0, participant.moveTimer - dt);
      if (participant.moveTimer > 0) continue;

      const occupied = this.callbacks.occupiedSet?.(actor) ?? new Set();
      const path = findPath(this.game.grid, actor.position, target, occupied);
      if (!path?.length) {
        participant.stalled += dt;
        continue;
      }
      const step = path[0];
      const moved = this.callbacks.tryStep?.(actor, {
        x: Math.sign(step.x - actor.position.x),
        y: Math.sign(step.y - actor.position.y)
      }, { logBlock: false }) ?? false;
      participant.moveTimer = TABLEAU_STEP_DELAY;
      if (moved) {
        anyPath = true;
        participant.stalled = 0;
      } else {
        participant.stalled += dt;
      }
    }

    if (allArrived) return true;
    active.stalled = anyPath
      ? 0
      : active.stalled + dt;
    if (active.stalled >= TABLEAU_STALL_LIMIT || active.participants.some((entry) => entry.stalled >= TABLEAU_STALL_LIMIT)) {
      const ownerState = this.states.find((state) => state.active === active);
      if (ownerState) this.#finish(ownerState, { cancelled: true, reason: 'path-stalled' });
    }
    return false;
  }

  #finish(state, { cancelled, reason }) {
    const active = state.active;
    if (!active) return;
    const owner = `tableau:${state.definition.id}`;
    for (const participant of active.participants) {
      this.callbacks.finishActivity?.(participant.actor, owner);
      this.callbacks.cancelMovement?.(participant.actor);
      this.reservations.delete(cellKey(participant.definition.slot.x, participant.definition.slot.y));
      if (participant.actor.tableauReservation?.tableauId === state.definition.id) {
        participant.actor.tableauReservation = null;
      }
      if (!participant.actor.isDead && !participant.actor.removed) {
        participant.actor.render.state = 'idle';
        participant.actor.render.frameIndex = 0;
        participant.actor.render.timer = 0;
        if (!cancelled && participant.actor.position.x === participant.home.x && participant.actor.position.y === participant.home.y) {
          participant.actor.facing = participant.homeFacing;
        }
      }
    }
    state.active = null;
    state.cycle += 1;
    state.timer = this.#cooldown(state.definition, state.cycle, reason);
  }

  #cooldown(definition, cycle, reason) {
    const min = definition.cooldown?.min ?? 30;
    const max = Math.max(min, definition.cooldown?.max ?? min);
    if (reason === 'level-change') return min;
    const span = max - min;
    if (span <= 0) return min;
    return min + (stableHash(`${definition.id}:${cycle}`) % 1001) / 1000 * span;
  }
}
