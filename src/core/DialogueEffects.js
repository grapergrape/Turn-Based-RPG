import { SUSPICION_STATES } from '../world/PerceptionSystem.js';
import { createGameClock } from './GameClock.js';

function cloneEffect(effect) {
  if (!effect || typeof effect !== 'object' || Array.isArray(effect)) return null;
  return JSON.parse(JSON.stringify(effect));
}

function normalizeEffectPoint(point) {
  if (!point || typeof point !== 'object') return null;
  const x = Number(point.x);
  const y = Number(point.y);
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
  return { x: Math.round(x), y: Math.round(y) };
}

function normalizeEffectPath(value) {
  const raw = Array.isArray(value) ? value : [value];
  return raw.map(normalizeEffectPoint).filter(Boolean);
}

export class DialogueEffects {
  constructor(game, callbacks = {}) {
    this.game = game;
    this.callbacks = callbacks;
  }

  apply(effects) {
    if (!effects) return false;
    // A blocked transaction is handled even though it applies no effects.
    // Returning true keeps the current choice open so the player can correct
    // the problem without losing payment, flags, or rewards.
    if (!this.canApplyHealingEffect(effects.heal)) return true;
    if (!this.canApplyInventoryEffects(effects.inventory)) return true;
    for (const line of [].concat(effects.log ?? [])) this.callbacks.log?.(line);
    const clearFlags = [].concat(effects.clearFlag ?? []);
    for (const flag of clearFlags) this.game.flags.delete(flag);
    const setFlags = [].concat(effects.setFlag ?? []);
    for (const flag of setFlags) this.game.flags.add(flag);
    this.applyInventoryEffects(effects.inventory);
    this.applyHealingEffect(effects.heal);
    if (clearFlags.length > 0 || setFlags.length > 0) this.callbacks.syncFlagConditionalObjects?.();
    const questUpdates = [].concat(effects.questUpdate ?? []).filter(Boolean);
    for (const update of questUpdates) {
      this.callbacks.applyQuestUpdate?.(update);
    }
    if (clearFlags.length > 0 || setFlags.length > 0 || questUpdates.length > 0) {
      this.callbacks.journalStateChanged?.();
    }
    if (effects.xp !== undefined) this.callbacks.awardPlayerExperience?.(effects.xp);
    if (effects.kill) this.callbacks.silenceProp?.(effects.kill);
    if (effects.teleport) this.callbacks.teleportPlayer?.(effects.teleport);
    this.applyClockEffect(effects.clock);
    this.applyMoveActorEffects(effects.moveActor);
    this.applyActorSpeechEffect(effects.actorSpeech);
    if (effects.openDoorGroup) {
      this.callbacks.openDoorGroup?.(effects.openDoorGroup);
    }
    if (effects.trade) {
      return this.callbacks.openTradeScreen?.(effects.trade) ?? false;
    }
    if (effects.showBriefing) {
      const briefing = cloneEffect(effects.showBriefing) ?? {};
      if (effects.loadLevel && !briefing.afterBriefing) {
        briefing.afterBriefing = { loadLevel: cloneEffect(effects.loadLevel) };
      }
      this.showBriefing(briefing);
      return true;
    }
    if (effects.startCombat) {
      const start = effects.startCombat;
      const encounter = typeof start === 'string' ? start : start.encounter;
      const options = typeof start === 'string'
        ? {}
        : {
            fromAltar: Boolean(start.fromAltar),
            openingAttack: cloneEffect(start.openingAttack)
          };
      this.callbacks.closeUiScreen?.();
      this.callbacks.startCombat?.(encounter ?? true, options);
      return true;
    }
    if (effects.loadLevel) {
      void this.callbacks.transitionLevel?.(effects.loadLevel);
      return true;
    }
    return false;
  }

  canApplyHealingEffect(effect) {
    if (effect === undefined) return true;
    const spec = effect && typeof effect === 'object' && !Array.isArray(effect) ? effect : null;
    const target = spec ? this.effectActor(spec.target ?? 'player') : null;
    if (!target || target.isDead || !Number.isFinite(target.hp) || !Number.isFinite(target.maxHp)) {
      this.callbacks.log?.('Treatment cannot be given.');
      return false;
    }
    if (target.hp >= target.maxHp) {
      this.callbacks.log?.('No wounds need treatment.');
      return false;
    }
    if (this.healingAmount(spec, target) <= 0) {
      this.callbacks.log?.('Treatment cannot be given.');
      return false;
    }
    return true;
  }

  applyHealingEffect(effect) {
    if (effect === undefined) return 0;
    const target = this.effectActor(effect.target ?? 'player');
    if (!target) return 0;
    const amount = this.healingAmount(effect, target);
    if (amount <= 0) return 0;
    if (typeof target.heal === 'function') return target.heal(amount);
    const before = target.hp;
    target.hp = Math.min(target.maxHp, target.hp + amount);
    return target.hp - before;
  }

  healingAmount(effect, target) {
    if (effect?.amount === 'full') return Math.max(0, target.maxHp - target.hp);
    const amount = Number(effect?.amount);
    return Number.isInteger(amount) && amount > 0 ? amount : 0;
  }

  applyClockEffect(effect) {
    if (effect === undefined) return;
    const spec = typeof effect === 'number' ? { minuteOfDay: effect } : effect;
    if (!spec || typeof spec !== 'object' || Array.isArray(spec)) return;
    const current = createGameClock(this.game.clock);
    const dayDelta = Number.isInteger(spec.fieldDayDelta)
      ? spec.fieldDayDelta
      : spec.nextDay === true
        ? 1
        : 0;
    if (dayDelta > 0) current.fieldDay += dayDelta;
    if (typeof spec.advanceToMinuteOfDay === 'number' && Number.isFinite(spec.advanceToMinuteOfDay)) {
      if (current.minuteOfDay > spec.advanceToMinuteOfDay) current.fieldDay += 1;
      current.minuteOfDay = spec.advanceToMinuteOfDay;
      current.minuteCarry = 0;
    }
    if (typeof spec.minuteOfDay === 'number' && Number.isFinite(spec.minuteOfDay)) {
      current.minuteOfDay = spec.minuteOfDay;
      current.minuteCarry = 0;
    }
    this.game.clock = createGameClock(current);
  }

  canApplyInventoryEffects(inventoryEffects) {
    if (!inventoryEffects) return true;
    const removeEntries = [].concat(inventoryEffects.remove ?? []);
    if (inventoryEffects.requireAll) {
      for (const entry of removeEntries) {
        if (!entry?.item) continue;
        const count = entry.count ?? 1;
        if ((this.game.inventory.count(entry.item) ?? 0) < count) {
          this.callbacks.log?.(entry.failLog ?? `${this.game.inventory.displayName(entry.item)} is not in the pack.`);
          return false;
        }
      }
    }

    const addEntries = [].concat(inventoryEffects.add ?? []).filter((entry) => entry?.item);
    if (addEntries.length === 0) return true;

    const inventory = this.game.inventory;
    const current = inventory.currentWeight?.() ?? 0;
    const max = Number.isFinite(inventory.maxCarryWeight) ? inventory.maxCarryWeight : Number.POSITIVE_INFINITY;
    const removalCounts = new Map();
    for (const entry of removeEntries) {
      if (!entry?.item) continue;
      removalCounts.set(entry.item, (removalCounts.get(entry.item) ?? 0) + (entry.count ?? 1));
    }
    let removed = 0;
    for (const [itemId, requested] of removalCounts) {
      const available = inventory.count?.(itemId) ?? 0;
      removed += (inventory.itemWeight?.(itemId) ?? 0) * Math.min(available, requested);
    }
    let added = 0;
    for (const entry of addEntries) {
      added += (inventory.itemWeight?.(entry.item) ?? 0) * (entry.count ?? 1);
    }
    const projected = Math.round(Math.max(0, current - removed + added) * 10) / 10;
    const overBy = Math.max(0, Math.round((projected - max) * 10) / 10);
    if (projected > max + 0.0001) {
      const carry = {
        ok: false,
        current,
        added: Math.round(added * 10) / 10,
        projected,
        overBy
      };
      if (this.callbacks.logCarryFailure) {
        this.callbacks.logCarryFailure(carry);
      } else {
        const format = (value) => Number.isInteger(value) ? String(value) : value.toFixed(1);
        this.callbacks.log?.(`Too much to carry. Pack ${format(current)}/${format(max)} kg.`);
        this.callbacks.log?.(`Need ${format(overBy)} kg free.`);
      }
      return false;
    }
    return true;
  }

  applyMoveActorEffects(effect) {
    if (effect === undefined) return;
    for (const spec of [].concat(effect)) this.applyMoveActorEffect(spec);
  }

  applyMoveActorEffect(spec) {
    if (!spec || typeof spec !== 'object' || Array.isArray(spec)) return;
    const actor = this.effectActor(spec.target ?? spec.actor ?? spec.id ?? 'speaker');
    if (!actor || actor.isDead) return;
    const path = normalizeEffectPath(spec.path ?? spec.to ?? spec.targetCell);
    if (path.length === 0) return;
    const route = [{ x: actor.position.x, y: actor.position.y }, ...path]
      .filter((point, index, points) => index === 0 || point.x !== points[index - 1].x || point.y !== points[index - 1].y);
    if (route.length < 2) return;
    actor.patrol = {
      path: route,
      mode: 'once',
      delay: { min: 0, max: 0 },
      index: 0,
      direction: 1,
      timer: Math.max(0, Number(spec.startDelay ?? spec.timer ?? 0) || 0),
      onComplete: cloneEffect(spec.onComplete ?? spec.complete ?? spec.arrival),
      removeOnComplete: Boolean(spec.removeOnComplete ?? spec.remove ?? spec.hideOnComplete)
    };
    actor.patrolTimer = actor.patrol.timer;
    actor.suspicionState = actor.suspicionState === SUSPICION_STATES.INVESTIGATING
      ? SUSPICION_STATES.WATCHING
      : actor.suspicionState;
    actor.investigationTarget = null;
  }

  applyActorSpeechEffect(spec) {
    if (!spec || typeof spec !== 'object' || Array.isArray(spec)) return;
    const actor = this.effectActor(spec.target ?? 'speaker');
    if (!actor || actor.isDead || actor.removed) return;
    const lines = Array.isArray(spec.lines)
      ? spec.lines.filter((line) => typeof line === 'string' && line.trim().length > 0)
      : [];
    if (lines.length === 0) return;

    const initialDelay = Number(spec.initialDelay);
    const interval = Number(spec.interval);
    const ttl = Number(spec.ttl);
    actor.speech = null;
    actor.actorSpeechQueue = {
      lines: [...lines],
      index: 0,
      delay: Number.isFinite(initialDelay) && initialDelay >= 0 ? initialDelay : 0,
      interval: Number.isFinite(interval) && interval >= 0 ? interval : 0,
      ttl: Number.isFinite(ttl) && ttl > 0 ? ttl : null
    };
  }

  effectActor(target) {
    if (!target || target === 'speaker' || target === 'source') return this.game.dialogueActor;
    if (target === 'player') return this.game.player;
    if (typeof target !== 'string') return null;
    return [this.game.player, ...(this.game.npcs ?? []), ...(this.game.enemies ?? [])].find((actor) =>
      actor && (actor.spawnId === target || actor.id === target || actor.name === target)
    ) ?? null;
  }

  showBriefing(effect) {
    const pages = [];
    const pushPage = (page) => {
      const lines = [].concat(page ?? []).filter(Boolean);
      if (lines.length) pages.push(lines);
    };
    for (const page of effect.pages ?? []) pushPage(page);
    for (const entry of effect.conditionalPages ?? []) {
      if (this.callbacks.meetsConditions?.(entry.conditions)) pushPage(entry.page);
    }
    if (!pages.length) return;

    this.callbacks.closeUiScreen?.();
    this.game.mode = 'intro';
    this.game.briefing = pages;
    this.game.briefingTitle = effect.title ?? 'FIELD WRIT';
    this.game.briefingPage = 0;
    this.game.briefingNextPrompt = effect.nextPrompt ?? 'ENTER: CONTINUE';
    this.game.briefingLastPrompt = effect.lastPrompt ?? 'ENTER: CONTINUE';
    this.game.briefingSkipPrompt = effect.skipPrompt ?? 'ESC: SKIP';
    this.game.briefingMarksIntro = false;
    this.game.briefingAfter = cloneEffect(effect.afterBriefing);
  }

  applyInventoryEffects(inventoryEffects) {
    if (!inventoryEffects) return true;
    const removeEntries = [].concat(inventoryEffects.remove ?? []);
    for (const entry of removeEntries) {
      if (!entry?.item) continue;
      const count = entry.count ?? 1;
      if (!this.game.inventory.remove(entry.item, count)) {
        this.callbacks.log?.(`${this.game.inventory.displayName(entry.item)} is not in the pack.`);
      }
    }
    for (const entry of [].concat(inventoryEffects.add ?? [])) {
      if (!entry?.item) continue;
      const count = entry.count ?? 1;
      const result = this.game.inventory.add(entry.item, count);
      if (!result.ok) {
        this.callbacks.log?.(`No room for ${this.game.inventory.displayName(entry.item)}.`);
        continue;
      }
      this.callbacks.log?.(`Received: ${count}x ${this.game.inventory.displayName(entry.item)}.`);
    }
    this.callbacks.syncInventoryOrder?.();
    this.callbacks.clampInventorySelection?.();
    return true;
  }
}
