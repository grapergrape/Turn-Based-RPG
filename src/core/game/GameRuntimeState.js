import { buildJournalState } from '../JournalState.js';
import { questStageExperience, questStageExperienceKey } from '../Progression.js';
import { objectGroupId, syncObjectPassability } from '../../world/DoorSystem.js';
import { hydrateGroundItem, isGroundItemPickupComplete, serializeGroundItem } from '../../world/GroundItems.js';
import { objectStateKey } from '../../world/ObjectIdentity.js';
import { restoreSearchCompleted, searchCompletedIds } from '../../world/SearchSystem.js';
import { screenFacing } from '../../render/isoMath.js';
import {
  AMBIENT_ACTOR_DELAY,
  AMBIENT_PROP_DELAY,
  AMBIENT_SPEECH_COOLDOWN,
  AMBIENT_SPEECH_LIFE,
  ATTACK_ANIM,
  ATTACK_FRAMES,
  DEATH_FRAMES,
  DIRS,
  EFFECT_LIFE,
  HIT_ANIM,
  HIT_FRAMES,
  MAX_LOG
} from './runtimeConstants.js';
import { installGameMethods } from './installGameMethods.js';

class GameRuntimeState {
  // ---- Animation & effects ----------------------------------------------

  _advanceAmbientSpeech(dt) {
    let speechActive = false;
    for (const actor of [this.player, ...this.enemies, ...(this.npcs ?? [])]) {
      if (actor.speech) {
        actor.speech.ttl -= dt;
        if (actor.speech.ttl <= 0) actor.speech = null;
        else speechActive = true;
      }
    }
    for (const prop of this.speakingProps ?? []) {
      if (prop.speech) {
        prop.speech.ttl -= dt;
        if (prop.speech.ttl <= 0) prop.speech = null;
        else speechActive = true;
      }
    }

    if (this.mode !== 'explore' || this.uiScreen) return;

    this.ambientSpeechCooldown = Math.max(0, (this.ambientSpeechCooldown ?? 0) - dt);
    const candidates = [];

    for (const actor of [...this.enemies, ...(this.npcs ?? [])]) {
      if (actor.isDead || actor.speech || !Array.isArray(actor.ambient) || actor.ambient.length === 0) continue;
      if (this._isCellHidden(actor.position.x, actor.position.y)) continue;
      const distance = manhattan(this.player.position, actor.position);
      if (distance > 10) continue;

      actor.ambientTimer = (actor.ambientTimer ?? AMBIENT_ACTOR_DELAY) - dt;
      if (actor.ambientTimer > 0) continue;
      candidates.push({ type: 'actor', subject: actor, distance });
    }

    for (const prop of this.speakingProps ?? []) {
      if (prop.killed || prop.speech) continue;
      if (this._isCellHidden(prop.x, prop.y)) continue;
      const distance = manhattan(this.player.position, prop);
      if (distance > 11) continue;
      prop.ambientTimer = (prop.ambientTimer ?? AMBIENT_PROP_DELAY) - dt;
      if (prop.ambientTimer > 0) continue;
      candidates.push({ type: 'prop', subject: prop, distance });
    }

    if (speechActive || this.ambientSpeechCooldown > 0 || candidates.length === 0) return;

    candidates.sort((a, b) => a.distance - b.distance || a.subject.y - b.subject.y || a.subject.x - b.subject.x);
    const next = candidates[0];
    if (next.type === 'actor') {
      const actor = next.subject;
      const index = actor.ambientIndex ?? 0;
      actor.speech = { text: actor.ambient[index % actor.ambient.length], ttl: AMBIENT_SPEECH_LIFE };
      actor.ambientIndex = index + 1;
      actor.ambientTimer = AMBIENT_ACTOR_DELAY + ((index + actor.x + actor.y) % 5) * 3.5;
    } else {
      const prop = next.subject;
      const index = prop.ambientIndex ?? 0;
      prop.speech = { text: prop.ambient[index % prop.ambient.length], ttl: AMBIENT_SPEECH_LIFE + 1.4 };
      prop.ambientIndex = index + 1;
      prop.ambientTimer = AMBIENT_PROP_DELAY + ((index + prop.x + prop.y) % 4) * 2.4;
    }
    this.ambientSpeechCooldown = AMBIENT_SPEECH_COOLDOWN;
  }

  _advanceAnim(dt) {
    this.anim.tick += dt;
    this.anim.idleFrame = Math.floor(this.anim.tick / 0.35) % 4;
    this.anim.bob = Math.floor(this.anim.tick / 0.5) % 2;
    this.anim.flicker = Math.floor(this.anim.tick / 0.13) % 2;
    this.anim.pulse = Math.floor(this.anim.tick / 0.6) % 2;
  }

  _advanceGroundItems() {
    if (!this.groundItems?.length) return;
    this.groundItems = this.groundItems.filter((item) => !isGroundItemPickupComplete(item, this.anim.tick));
  }

  _advanceActorAnim(actor, dt) {
    const r = actor.render;
    if (actor.isDead) {
      if (r.state !== 'dead') {
        r.state = 'dead';
        r.timer = 0;
      } else {
        r.timer += dt;
      }
      r.frameIndex = Math.min(DEATH_FRAMES - 1, Math.floor(r.timer / 0.1));
      return;
    }
    r.timer += dt;
    if (r.state === 'attack') {
      r.frameIndex = Math.min(ATTACK_FRAMES - 1, Math.floor((r.timer / ATTACK_ANIM) * ATTACK_FRAMES));
      if (r.timer >= ATTACK_ANIM) {
        r.state = 'idle';
        r.timer = 0;
        r.frameIndex = 0;
      }
    } else if (r.state === 'hit') {
      r.frameIndex = Math.min(HIT_FRAMES - 1, Math.floor((r.timer / HIT_ANIM) * HIT_FRAMES));
      if (r.timer >= HIT_ANIM) {
        r.state = 'idle';
        r.timer = 0;
      }
    }
    // 'walk' frames come from _advanceMovement; 'idle' from anim.bob in render.
  }

  _pushEffect(effect) {
    if (effect) this.effects.push({ ...effect, age: 0 });
  }

  _ageEffects(dt) {
    for (const effect of this.effects) {
      effect.age += dt;
      effect.rise = Math.round(effect.age * 24);
    }
    this.effects = this.effects.filter((effect) => effect.age < EFFECT_LIFE);
  }

  // ---- Helpers -----------------------------------------------------------

  _movementAction(action) {
    if (DIRS[action]) return { dir: DIRS[action] };
    return null;
  }

  _isOccupied(x, y, exclude) {
    return this.actors.some(
      (actor) => actor !== exclude &&
        !actor.isDead &&
        !this._isCellHidden(actor.position.x, actor.position.y) &&
        actor.position.x === x &&
        actor.position.y === y
    );
  }

  _occupiedSet(exclude) {
    const set = new Set();
    for (const actor of this.actors) {
      if (actor === exclude || actor.isDead) continue;
      if (this._isCellHidden(actor.position.x, actor.position.y)) continue;
      set.add(`${actor.position.x},${actor.position.y}`);
    }
    return set;
  }

  _livingEnemyAtCell(cell) {
    return this.enemies.find((enemy) =>
      !enemy.isDead &&
      !this._isCellHidden(enemy.position.x, enemy.position.y) &&
      enemy.position.x === cell.x &&
      enemy.position.y === cell.y
    ) ?? null;
  }

  _livingEnemies() {
    if (this.mode === 'combat' && this.activeEncounter) {
      return this._livingEnemiesForEncounter(this.activeEncounter);
    }
    return this.enemies.filter((enemy) =>
      !enemy.isDead && !this._isCellHidden(enemy.position.x, enemy.position.y)
    );
  }

  _livingEnemiesForEncounter(encounterId) {
    const resolved = this._resolveEncounterId(encounterId);
    return this.enemies.filter((enemy) =>
      !enemy.isDead &&
      !this._isCellHidden(enemy.position.x, enemy.position.y) &&
      this._resolveEncounterId(enemy.encounter) === resolved
    );
  }

  _activeEncounterEnemies() {
    if (!this.activeEncounter) return this.enemies;
    const resolved = this._resolveEncounterId(this.activeEncounter);
    return this.enemies.filter((enemy) => this._resolveEncounterId(enemy.encounter) === resolved);
  }

  _resolveEncounterId(encounterId) {
    if (encounterId === true || encounterId == null) {
      const nearest = this.enemies
        .filter((enemy) => !enemy.isDead)
        .sort((a, b) => manhattan(this.player.position, a.position) - manhattan(this.player.position, b.position))[0];
      return nearest?.encounter ?? nearest?.spawnId ?? null;
    }
    return encounterId;
  }

  _encounterTrigger(encounterId) {
    return (this.level.combatTriggers ?? []).find((entry) =>
      this._resolveEncounterId(entry.encounter ?? entry.id) === encounterId
    );
  }

  _encounterIntro(encounterId) {
    const trigger = this._encounterTrigger(encounterId);
    return trigger?.intro ?? this.level.combatIntro ?? [];
  }

  // Turn an actor to face a tile (one of eight isometric facings).
  _faceToward(actor, target) {
    actor.facing = screenFacing(target.x - actor.position.x, target.y - actor.position.y);
  }

  // Last word of a name, for the cramped target readout ("Cutthroat 4/9").
  _shortName(name) {
    const parts = String(name).split(' ');
    return parts[parts.length - 1];
  }

  _log(message) {
    if (!message) return;
    this.log.push(message);
    if (this.log.length > MAX_LOG) this.log = this.log.slice(-MAX_LOG);
  }

  _loadStartingInventory(loadout) {
    for (const entry of loadout?.items ?? []) {
      this.inventory.add(entry.item, entry.count ?? 1, { ignoreCapacity: true });
    }
    this.inventory.loadEquipment(loadout?.equipment ?? {});
  }

  _clampInventorySelection() {
    this._syncInventoryOrder();
    this.inventoryFocus = this.inventoryFocus === 'gear' ? 'gear' : 'items';
    const itemCount = this._inventoryEntries().length ?? 0;
    const slotCount = this.inventory?.equipmentEntries().length ?? 0;
    this.inventoryIndex = Math.max(0, Math.min(Math.max(0, itemCount - 1), this.inventoryIndex ?? 0));
    this.equipmentIndex = Math.max(0, Math.min(Math.max(0, slotCount - 1), this.equipmentIndex ?? 0));
  }

  _startQuests(previousStages = null, previousReached = null) {
    for (const quest of Object.values(this.questDefs)) {
      const stage = previousStages?.get(quest.id) ?? quest.initialStage ?? quest.stages?.[0]?.id ?? 'active';
      this.questStages.set(quest.id, stage);
      const reached = previousReached?.get(quest.id)
        ? new Set(previousReached.get(quest.id))
        : this._stagesUpTo(quest, stage);
      for (const reachedStage of this._stagesUpTo(quest, stage)) reached.add(reachedStage);
      this.questReached.set(quest.id, reached);
      this._log(`Quest: ${quest.title}.`);
      const description = this._questStageDescription(quest.id, stage);
      if (description) this._log(description);
    }
  }

  // Every stage id up to and including `stageId` in the quest's ordered list.
  // Stages advance forward, so this yields sensible progress even after a reload
  // that only restored the current stage.
  _stagesUpTo(quest, stageId) {
    const stages = quest.stages ?? [];
    const idx = stages.findIndex((stage) => stage.id === stageId);
    const reached = new Set();
    if (idx < 0) {
      reached.add(stageId);
      return reached;
    }
    for (let i = 0; i <= idx; i += 1) reached.add(stages[i].id);
    return reached;
  }

  _applyQuestUpdate(update) {
    if (!update?.quest || !update.stage) return;
    const quest = this.questDefs[update.quest];
    const current = this.questStages.get(update.quest);
    if (!quest || current === update.stage) return;
    this.questStages.set(update.quest, update.stage);
    const reached = this.questReached.get(update.quest) ?? new Set();
    reached.add(update.stage);
    this.questReached.set(update.quest, reached);
    if (update.log) this._log(update.log);
    this._awardQuestStageExperience(quest, update.stage);
    if (update.stage === 'complete') {
      this._log(`Quest complete: ${quest.title}.`);
      return;
    }
    const description = this._questStageDescription(update.quest, update.stage);
    if (description) this._log(description);
  }

  _questStageDescription(questId, stageId) {
    const quest = this.questDefs[questId];
    return quest?.stages?.find((stage) => stage.id === stageId)?.description ?? '';
  }

  _awardQuestStageExperience(quest, stageId) {
    const key = questStageExperienceKey(quest.id, stageId);
    if (this.awardedQuestXp.has(key)) return;
    this.awardedQuestXp.add(key);
    this._awardPlayerExperience(questStageExperience(quest, stageId));
  }

  // The whole journal book: the quest checklist (source of truth), the running
  // findings log that grows as the player discovers things, and the faction
  // codex whose cult entries unlock as the investigation advances.
  _buildJournal() {
    return buildJournalState({
      section: this.journalSection ?? 0,
      turn: this.journalTurn,
      factionIndex: this.journalFactionIndex ?? 0,
      questDefs: this.questDefs,
      questStages: this.questStages,
      questReached: this.questReached,
      journalNotes: this.journalNotes,
      codexDefs: this.codexDefs,
      flags: this.flags,
      player: this.player,
      techniqueDefs: this.techniqueDefs,
      techniqueContext: this._techniqueContext(),
      primaryIndex: this.journalPrimaryIndex ?? 0,
      techniqueIndex: this.journalTechniqueIndex ?? 0
    });
  }

  _techniqueContext() {
    return {
      itemIds: new Set(this.inventory?.counts?.keys?.() ?? []),
      equipment: this.inventory?.equipmentSnapshot?.() ?? {}
    };
  }

  _snapshotLevelState() {
    if (!this.levelPath || !this.level) return;
    const objectStateKeys = (predicate) => (this.level.interactables ?? [])
      .filter(predicate)
      .map((object) => this._objectStateKey(object))
      .filter(Boolean);
    const consumedObjects = new Set(objectStateKeys((object) => object.consumed));
    const deadEnemies = new Set(
      this.enemies
        .filter((enemy) => enemy.isDead)
        .map((enemy) => enemy.spawnId ?? enemy.id)
    );
    const lootedEnemies = new Set(
      this.enemies
        .filter((enemy) => enemy.lootClaimed)
        .map((enemy) => enemy.spawnId ?? enemy.id)
    );
    const killedObjects = new Set(objectStateKeys((object) => object.killed));
    const unlockedObjects = new Set(objectStateKeys((object) => object.unlocked));
    const openedObjects = new Set(objectStateKeys((object) => object.opened));
    const lootedObjects = new Set(objectStateKeys((object) => object.looted));
    const revealedObjects = new Set(objectStateKeys((object) => object.revealed));
    const searchedObjects = new Map(
      (this.level.interactables ?? [])
        .map((object) => [this._objectStateKey(object), searchCompletedIds(object)])
        .filter(([key, ids]) => key && ids.length > 0)
        .map(([key, ids]) => [key, new Set(ids)])
    );
    const groundItems = (this.groundItems ?? [])
      .map((item) => serializeGroundItem(item))
      .filter(Boolean);
    const tradeStockByActor = new Map(
      [...(this.npcs ?? []), ...(this.enemies ?? [])]
        .filter((actor) => Array.isArray(actor.trade?.stock))
        .map((actor) => [
          actor.spawnId ?? actor.id,
          actor.trade.stock.map((entry) => ({ ...entry }))
        ])
    );
    this.levelStateByPath.set(this.levelPath, {
      consumedObjects,
      killedObjects,
      unlockedObjects,
      openedObjects,
      lootedObjects,
      revealedObjects,
      searchedObjects,
      deadEnemies,
      lootedEnemies,
      clearedEncounters: new Set(this.clearedEncounters ?? []),
      tradeStockByActor,
      groundItems
    });
  }

  _restoreLevelState() {
    const state = this.levelStateByPath.get(this.levelPath);
    if (!state) return;

    for (const object of this.level.interactables ?? []) {
      const key = this._objectStateKey(object);
      if (!key) continue;
      if (state.searchedObjects?.has(key)) {
        restoreSearchCompleted(object, [...state.searchedObjects.get(key)]);
      }
      if (state.revealedObjects?.has(key)) {
        object.revealed = true;
      }
      if (state.killedObjects?.has(key)) {
        object.killed = true;
        object.consumed = true;
        object.ambient = [];
        // A cut-down saint stays fallen on the ground when you return (fall=1).
        if (object.kind === 'cross-martyr') object.released = true;
      }
      if (state.lootedObjects?.has(key)) {
        object.looted = true;
        object.opened = true;
      }
      if (!state.consumedObjects?.has(key)) continue;
      object.consumed = true;
      object.opened = true;
      syncObjectPassability(object, this.grid);
    }
    for (const object of this.level.interactables ?? []) {
      const key = this._objectStateKey(object);
      if (!key) continue;
      if (state.unlockedObjects?.has(key)) object.unlocked = true;
      if (state.openedObjects?.has(key)) {
        object.opened = true;
        syncObjectPassability(object, this.grid);
      }
    }
    for (const enemy of this.enemies) {
      const key = enemy.spawnId ?? enemy.id;
      if (state.lootedEnemies?.has(key)) enemy.lootClaimed = true;
      if (!state.deadEnemies?.has(key)) continue;
      enemy.hp = 0;
      enemy.isDead = true;
      enemy.render.state = 'dead';
      enemy.render.frameIndex = DEATH_FRAMES - 1;
    }
    if (Array.isArray(state.groundItems)) {
      this.groundItems = state.groundItems
        .map((item) => hydrateGroundItem(item))
        .filter(Boolean);
    }
    for (const actor of [...(this.npcs ?? []), ...(this.enemies ?? [])]) {
      const key = actor.spawnId ?? actor.id;
      const stock = state.tradeStockByActor?.get(key);
      if (Array.isArray(stock) && actor.trade) {
        actor.trade.stock = stock.map((entry) => ({ ...entry }));
      }
    }
    this.clearedEncounters = new Set(state.clearedEncounters ?? []);
  }

  _refreshHiddenTiles({ rebuildStatic = false } = {}) {
    const next = this._activeHiddenTiles();
    const key = [...next].sort().join('|');
    if (this.hiddenTilesKey === key) return false;

    this.hiddenTiles = next;
    this.hiddenTilesKey = key;
    if (rebuildStatic) {
      this.renderer.rebuildStaticScene({
        grid: this.grid,
        props: this.level.props,
        mood: this.level.mood,
        hiddenTiles: this.hiddenTiles
      });
    }
    return true;
  }

  _activeHiddenTiles() {
    const hidden = new Set();
    for (const region of this.level?.hiddenRegions ?? []) {
      if (this._isHiddenRegionRevealed(region)) continue;
      const x0 = Math.floor(region.x);
      const y0 = Math.floor(region.y);
      const width = Math.floor(region.width);
      const height = Math.floor(region.height);
      if (
        !Number.isFinite(x0) ||
        !Number.isFinite(y0) ||
        !Number.isFinite(width) ||
        !Number.isFinite(height) ||
        width <= 0 ||
        height <= 0
      ) continue;
      for (let y = y0; y < y0 + height; y += 1) {
        for (let x = x0; x < x0 + width; x += 1) {
          if (this.grid?.isInside(x, y)) hidden.add(`${x},${y}`);
        }
      }
    }
    return hidden;
  }

  _isHiddenRegionRevealed(region) {
    const group = typeof region?.doorGroup === 'string' && region.doorGroup.trim() !== ''
      ? region.doorGroup
      : null;
    if (!group) return false;
    return (this.level?.interactables ?? []).some((object) =>
      objectGroupId(object) === group && object.opened
    );
  }

  _isCellHidden(x, y) {
    return this.hiddenTiles?.has?.(`${x},${y}`) ?? false;
  }

  _objectStateKey(object) {
    return objectStateKey(object);
  }
}

export function installGameRuntimeState(GameClass) {
  installGameMethods(GameClass, GameRuntimeState);
}
