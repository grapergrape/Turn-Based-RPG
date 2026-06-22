// Game orchestration and the explore/combat state machine.
//
// Responsibilities: load a level, run the animation clock, route input per
// mode, drive deliberate stepped movement, run exploration interactions,
// start and run AP-based turn combat, and assemble the render state each frame.
// It coordinates systems but contains no drawing and no hardcoded lore beyond
// the encounter's scripted log lines.

import { GameLoop } from './GameLoop.js';
import { Input } from './Input.js';
import { Inventory } from './Inventory.js';
import { loadLevel } from './LevelLoader.js';
import {
  FIELD_RATINGS,
  PRIMARY_ATTRIBUTES,
  awardExperience,
  buildCharacterSheet,
  calculateFieldRating,
  experienceRewardForEncounter,
  normalizeProgression,
  questStageExperience,
  questStageExperienceKey
} from './Progression.js';
import { TurnManager } from '../combat/TurnManager.js';
import { CombatSystem, manhattan, chebyshev } from '../combat/CombatSystem.js';
import { planTurn, flavorLine } from '../combat/EnemyAI.js';
import { findPath, findPathToAdjacent } from '../world/Pathfinder.js';
import { InteractionSystem } from '../world/InteractionSystem.js';
import {
  SECURITY_TOOL_ITEM,
  isObjectLocked,
  lockLines,
  lockMethodById,
  lockMethodStatus,
  lockMethods,
  lockMethodUsesSecurityTool,
  lockTitle,
  objectLock,
  resolveLockMethod,
  securityToolSurvives
} from '../world/LockSystem.js';
import {
  completeSearchMethod,
  objectSearch,
  resolveSearchMethod,
  restoreSearchCompleted,
  searchCompletedIds,
  searchLines,
  searchMethodById,
  searchMethodCompleted,
  searchMethodStatus,
  searchMethods,
  searchTitle
} from '../world/SearchSystem.js';
import {
  isDoorObject,
  objectGroupId,
  openLinkedObjects,
  syncObjectPassability,
  unlockLinkedObjects
} from '../world/DoorSystem.js';
import {
  GROUND_ITEM_KIND,
  canActorPickupGroundItem,
  createGroundItem,
  hydrateGroundItem,
  isGroundItemPickupComplete,
  serializeGroundItem
} from '../world/GroundItems.js';
import {
  isActionTarget,
  isTargetInReach,
  resolveInteractionTargetAtCell
} from '../world/InteractionTargeting.js';
import { IsometricRenderer } from '../render/IsometricRenderer.js';
import { bakeMara } from '../render/SpriteAtlas.js';
import { gridToScreen, screenFacing } from '../render/isoMath.js';
import { DEBUG_GRID_DEFAULT, VIEWPORT_HEIGHT } from '../render/renderConfig.js';
import { DIALOGUE_MAX_CHOICES, buildDialogueLayout } from '../ui/dialogueLayout.js';
import { journalArrowAt } from '../ui/journalLayout.js';

const STEP_DURATION = 0.64;
const ENEMY_ACTION_DELAY = 0.2;
const EFFECT_LIFE = 0.45;
const ATTACK_ANIM = 0.5;
const HIT_ANIM = 0.24;
const TRIGGER_RADIUS = 2;
const AMBIENT_SPEECH_LIFE = 2.7;
const AMBIENT_SPEECH_COOLDOWN = 7.5;
const AMBIENT_ACTOR_DELAY = 18;
const AMBIENT_PROP_DELAY = 12;
const AREA_TITLE_DURATION = 2.35;
const JOURNAL_SECTIONS = ['QUESTS', 'NOTES', 'FACTIONS', 'CHARACTER', 'SCARS'];
const JOURNAL_TURN_DURATION = 0.46;
const MAX_LOG = 8;
const WALK_FRAMES = 8;
const ATTACK_FRAMES = 6;
const HIT_FRAMES = 4;
const DEATH_FRAMES = 10;

const DIRS = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 }
};

const OBJECT_NAMES = {
  'broken-pew': 'Broken Pew',
  'rusted-reliquary': 'Rusted Reliquary',
  'rusted-barrel': 'Rusted Barrel',
  'field-satchel': 'Field Satchel',
  corpse: 'Corpse',
  'paper-scraps': 'Paper Scraps',
  'quarantine-sign': 'Quarantine Sign',
  'damaged-altar': 'Damaged Altar',
  'host-growth': 'Host Growth',
  'candle-cluster': 'Candle Cluster',
  'rubble-pile': 'Rubble',
  'rusted-crate': 'Rusted Crate',
  campfire: 'Campfire',
  'chapel-banner': 'Torn Chapel Banner',
  'broken-bell': 'Broken Bell',
  'bell-rope': 'Bell Rope',
  'prayer-lectern': 'Prayer Lectern',
  'ritual-bowl': 'Ritual Bowl',
  'cracked-column': 'Cracked Column',
  'quarantine-barricade': 'Quarantine Barricade',
  'chapel-double-door': 'Chapel Doors',
  'blood-stain': 'Blood Stain',
  'floor-crack': 'Floor Crack',
  'rubble-decal': 'Broken Stone',
  'glass-debris': 'Glass Debris',
  dust: 'Dust',
  'road-dust': 'Road Dust',
  'scorch-mark': 'Scorch Mark',
  'wax-stain': 'Wax Stain',
  'loose-flagstone': 'Loose Flagstone',
  'bone-pile': 'Ossuary Heap',
  'chalk-drawing': "Child's Drawing",
  'machine-oil': 'Oil Smear',
  'blood-sigil': 'Blood Sigil',
  'ritual-circle': 'Rite Circle',
  'cross-martyr': 'The Opened Saint',
  'bound-victim': 'Bound Captive',
  wall: 'Chapel Wall',
  'wall-broken': 'Broken Wall'
};

export class Game {
  constructor({ canvas, levelPath, atlas, statusElement, bootOptions = {}, debugGrid = null }) {
    this.canvas = canvas;
    this.levelPath = levelPath;
    this.atlas = atlas;
    this.statusElement = statusElement;
    this.startupOptions = { ...bootOptions };

    this.input = new Input(canvas);
    this.renderer = new IsometricRenderer(canvas, atlas);
    this.combat = new CombatSystem();
    this.turnManager = new TurnManager();

    this.debugGridDefault = debugGrid ?? DEBUG_GRID_DEFAULT;
    this.debugGrid = this.debugGridDefault;
    this.introSeen = false; // the opening writ shows once per session, not on R
    this.levelStateByPath = new Map();
    this.loop = new GameLoop({
      update: (dt) => this.update(dt),
      render: () => this.render()
    });
    this.ready = false;
    this.areaTitle = null;
    this.areaTitleTimer = 0;
    this.pendingExploreTarget = null;
  }

  // (Re)load the level and reset runtime state. Level transitions preserve the
  // run state; restarts intentionally start clean.
  async boot(options = {}) {
    const bootOptions = this.#bootOptions(options);
    this.ready = false;
    if (!bootOptions.preserveRun) {
      this.levelStateByPath = new Map();
      this.debugGrid = this.debugGridDefault;
    }

    const previousInventory = bootOptions.preserveRun ? this.inventory : null;
    const previousQuestStages = bootOptions.preserveRun && this.questStages
      ? new Map(this.questStages)
      : null;
    const previousQuestReached = bootOptions.preserveRun && this.questReached
      ? new Map([...this.questReached].map(([id, reached]) => [id, new Set(reached)]))
      : null;
    const previousQuestDefs = bootOptions.preserveRun && this.questDefs
      ? { ...this.questDefs }
      : null;
    const previousFlags = bootOptions.preserveRun && this.flags
      ? new Set(this.flags)
      : null;
    const previousAwardedQuestXp = bootOptions.preserveRun && this.awardedQuestXp
      ? new Set(this.awardedQuestXp)
      : null;
    const previousPlayer = bootOptions.preserveRun && this.player
      ? {
          hp: this.player.hp,
          maxHp: this.player.maxHp,
          progression: this.player.progression ? JSON.parse(JSON.stringify(this.player.progression)) : null
        }
      : null;
    const previousGroundItemSeq = bootOptions.preserveRun ? this.groundItemSeq ?? 0 : 0;

    const level = await loadLevel(this.levelPath);
    this.level = level;
    this.grid = level.grid;
    this.player = level.player;
    if (previousPlayer?.progression) {
      this.player.progression = JSON.parse(JSON.stringify(previousPlayer.progression));
      if (typeof this.player.refreshProgressionStats === 'function') this.player.refreshProgressionStats();
    }
    this.flags = previousFlags ?? new Set();
    this.enemies = level.enemies;
    if (bootOptions.noCombat) this.enemies = [];
    this.npcs = (level.npcs ?? []).filter((npc) => this.#meetsConditions(npc.conditions));
    this.groundItems = level.groundItems ?? [];
    this.groundItemSeq = previousGroundItemSeq;
    if (previousPlayer) {
      const hpRatio = previousPlayer.maxHp > 0 ? previousPlayer.hp / previousPlayer.maxHp : 1;
      this.player.hp = Math.max(1, Math.min(this.player.maxHp, Math.round(this.player.maxHp * hpRatio)));
    }

    this.inventory = new Inventory(
      { ...(previousInventory?.itemDefs ?? {}), ...level.itemDefs },
      { maxCarryWeight: previousInventory?.maxCarryWeight ?? level.playerLoadout?.maxCarryWeight }
    );
    if (previousInventory) {
      for (const [itemId, count] of previousInventory.counts) {
        this.inventory.add(itemId, count, { ignoreCapacity: true });
      }
      this.inventory.loadEquipment(previousInventory.equipmentSnapshot());
    } else {
      this.#loadStartingInventory(level.playerLoadout);
    }
    // Bake the player sprite to match the loaded equipment so the world figure
    // and inventory paper doll reflect what Mara is actually wearing.
    this.#refreshPlayerAppearance();
    this.interactions = new InteractionSystem(level.interactables);
    // Props that murmur on their own (e.g. the crucified Opened Saint) get the
    // same ambient-speech treatment as enemies, on a staggered timer.
    this.speakingProps = (level.props ?? []).filter(
      (prop) => Array.isArray(prop.ambient) && prop.ambient.length > 0
    );
    for (const prop of this.speakingProps) {
      prop.ambientIndex = 0;
      prop.ambientTimer = 5 + ((prop.x + prop.y) % 4) * 2;
      prop.speech = null;
    }
    this.ambientSpeechCooldown = 2.5;
    this.dialogueDefs = level.dialogueDefs ?? {};
    this.questDefs = { ...(previousQuestDefs ?? {}), ...(level.questDefs ?? {}) };
    // Static journal sources: faction/cult codex and flag-gated field notes.
    this.codexDefs = level.codex ?? [];
    this.journalNotes = level.journalNotes ?? [];
    this.questStages = new Map();
    // Per-quest set of every stage id reached, so the journal shows monotonic
    // progress and crosses off objectives regardless of discovery order.
    this.questReached = new Map();
    // Run-global story flags (e.g. "read-warden-journal"). Like quest stages they
    // survive level transitions within a run and clear on a fresh start (R).
    this.appliedLevelEvents = new Set();
    this.awardedQuestXp = previousAwardedQuestXp ?? new Set();
    this.activeEncounter = null;
    this.clearedEncounters = new Set();

    this.mode = 'explore';
    this.log = [];
    this.effects = [];
    this.moving = null;
    this.pathQueue = [];
    this.pendingExploreTarget = null;
    this.uiScreen = null;
    this.journalSection = 0;
    this.journalFactionIndex = 0;
    this.journalTurn = null;
    this.inventoryFocus = 'items';
    this.inventoryIndex = 0;
    this.equipmentIndex = 0;
    this.dialogue = null;
    this.briefing = null;
    this.briefingTitle = null;
    this.briefingPage = 0;
    this.briefingNextPrompt = null;
    this.briefingLastPrompt = null;
    this.briefingSkipPrompt = null;
    this.briefingMarksIntro = false;
    this.anim = { tick: 0, bob: 0, flicker: 0, pulse: 0 };
    this.hiddenTiles = new Set();
    this.hiddenTilesKey = null;

    this.selectedAttackId = this.player.attacks[0]?.id ?? null;
    this.targetIndex = 0;
    this.enemyActions = null;
    this.enemyActor = null;
    this.actionTimer = 0;

    this.#restoreLevelState();
    if (bootOptions.player) this.#teleportPlayer(bootOptions.player);
    this.#refreshHiddenTiles();
    this.renderer.rebuildStaticScene({
      grid: this.grid,
      props: this.level.props,
      mood: this.level.mood,
      hiddenTiles: this.hiddenTiles
    });

    this.areaTitle = level.name;
    this.areaTitleTimer = AREA_TITLE_DURATION;
    this.#log(level.intro || level.name);
    this.#startQuests(previousQuestStages, previousQuestReached);
    this.#log('Explore the chapel. Click to move or inspect. I pack, J journal, H bind wounds.');
    if (bootOptions.skipIntro) this.introSeen = true;

    // The opening writ plays once, on a fresh start (not on level transitions
    // or R restarts), before the player is dropped into the chapel.
    if (!this.introSeen && !bootOptions.preserveRun && Array.isArray(level.briefing) && level.briefing.length) {
      this.mode = 'intro';
      this.briefing = level.briefing;
      this.briefingTitle = level.briefingTitle ?? 'FIELD WRIT';
      this.briefingPage = 0;
      this.briefingNextPrompt = 'ENTER: CONTINUE';
      this.briefingLastPrompt = 'ENTER: ENTER THE CHAPEL';
      this.briefingSkipPrompt = 'ESC: SKIP';
      this.briefingMarksIntro = true;
    }
    this.ready = true;
  }

  start() {
    this.loop.start();
  }

  get actors() {
    return [this.player, ...this.enemies, ...(this.npcs ?? [])];
  }

  #bootOptions(options) {
    if (options.preserveRun) {
      return {
        noCombat: this.startupOptions.noCombat,
        ...options
      };
    }
    return { ...this.startupOptions, ...options };
  }

  // ---- Main update -------------------------------------------------------

  update(dt) {
    if (!this.ready) return;

    this.#advanceAnim(dt);
    this.#advanceJournalTurn(dt);
    this.#advanceGroundItems();
    if (this.areaTitleTimer > 0 && this.mode !== 'intro') {
      this.areaTitleTimer = Math.max(0, this.areaTitleTimer - dt);
    }
    this.#ageEffects(dt);
    this.#advanceAmbientSpeech(dt);
    for (const actor of this.actors) this.#advanceActorAnim(actor, dt);

    if (this.#advanceMovement(dt)) {
      // A step is in flight; consume input but ignore most of it mid-step.
      this.#drainBlockingInput();
      return;
    }

    const actions = this.input.consume();
    const click = this.input.consumeClick();

    if (this.mode === 'intro') {
      this.#handleIntro(actions, click);
      return;
    }

    if (this.uiScreen) {
      this.#handleUiScreen(actions, click);
      return;
    }

    if (this.mode === 'explore' || this.mode === 'victory') {
      this.#handleExplore(actions, click);
    } else if (this.mode === 'combat') {
      this.#handleCombat(actions, click, dt);
    } else if (this.mode === 'defeat') {
      this.#handleEndState(actions);
    }

    // Continue walking a queued click-to-move path when otherwise idle.
    if (!this.moving) this.#stepAlongPath();
  }

  // ---- Opening writ (intro) ----------------------------------------------

  #handleIntro(actions, click) {
    const advance = () => {
      this.briefingPage += 1;
      if (this.briefingPage >= (this.briefing?.length ?? 0)) this.#finishIntro();
    };
    if (click) {
      advance();
      return;
    }
    for (const action of actions) {
      if (action === 'cancel') {
        this.#finishIntro();
        return;
      }
      if (action === 'confirm' || action === 'interact' || action === 'down') {
        advance();
        return;
      }
      if (action === 'up') {
        this.briefingPage = Math.max(0, this.briefingPage - 1);
        return;
      }
    }
  }

  #finishIntro() {
    if (this.briefingMarksIntro) this.introSeen = true;
    this.briefing = null;
    this.briefingTitle = null;
    this.briefingPage = 0;
    this.briefingNextPrompt = null;
    this.briefingLastPrompt = null;
    this.briefingSkipPrompt = null;
    this.briefingMarksIntro = false;
    this.mode = 'explore';
  }

  #drainBlockingInput() {
    // Still honour restart/debug while animating.
    for (const action of this.input.consume()) {
      if (action === 'restart') this.boot();
      else if (action === 'debug') this.debugGrid = !this.debugGrid;
    }
  }

  // ---- Explore mode ------------------------------------------------------

  #handleExplore(actions, click) {
    if (click) this.#handleExploreClick(click);
    for (const action of actions) {
      if (DIRS[action]) {
        this.pendingExploreTarget = null;
        this.pathQueue = []; // manual step overrides any click path
        this.#tryStep(this.player, DIRS[action], { logBlock: true });
        return; // one step per update; trigger check runs on completion
      }
      switch (action) {
        case 'inventory':
          this.#toggleInventory();
          break;
        case 'journal':
          this.#toggleJournal();
          break;
        case 'dressing':
          this.#log(this.inventory.useFieldDressing(this.player));
          break;
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

  #handleExploreClick(click) {
    if (click.button !== 0) return;
    if (click.y >= VIEWPORT_HEIGHT) return;

    const target = this.#interactionTargetFromPoint(click, 'explore');
    if (!target) return;

    if (target.type === 'move') {
      this.pendingExploreTarget = null;
      const path = findPath(this.grid, this.player.position, target.cell, this.#occupiedSet(this.player));
      this.pathQueue = path && path.length ? path : [];
      return;
    }

    if (!isActionTarget(target)) {
      this.pendingExploreTarget = null;
      return;
    }

    if (isTargetInReach(this.player, target)) {
      this.#executeExploreTarget(target);
      return;
    }

    const path = this.#pathToExploreTarget(target);
    this.pendingExploreTarget = path && path.length ? target : null;
    this.pathQueue = path && path.length ? path : [];
  }

  #interactionTargetFromPoint(point, mode = this.mode) {
    const cell = this.renderer.toGrid(point.x, point.y);
    return this.#interactionTargetAtCell(cell, mode);
  }

  #interactionTargetAtCell(cell, mode = this.mode) {
    return resolveInteractionTargetAtCell({
      cell,
      grid: this.grid,
      player: this.player,
      actors: this.actors,
      enemies: this.enemies,
      interactables: this.#allInteractables(),
      hiddenTiles: this.hiddenTiles,
      mode
    });
  }

  #allInteractables() {
    return [
      ...(this.groundItems ?? []).filter((item) => !item.consumed),
      ...(this.level?.interactables ?? [])
    ];
  }

  #pathToExploreTarget(target) {
    const occupied = this.#occupiedSet(this.player);
    const cell = target.cell;
    if ((target.type === 'object' || target.type === 'corpse') &&
        this.grid.isWalkable(cell.x, cell.y) &&
        !this.#isOccupied(cell.x, cell.y, this.player)) {
      const direct = findPath(this.grid, this.player.position, cell, occupied);
      if (direct && direct.length) return direct;
    }
    return findPathToAdjacent(this.grid, this.player.position, cell, occupied);
  }

  #tryCompletePendingExploreTarget() {
    const target = this.pendingExploreTarget;
    if (!target || this.mode !== 'explore' || this.uiScreen) return;
    if (!this.#isExploreTargetValid(target)) {
      this.pendingExploreTarget = null;
      return;
    }
    if (isTargetInReach(this.player, target)) {
      this.#executeExploreTarget(target);
    }
  }

  #isExploreTargetValid(target) {
    if (target.type === 'talk') {
      const actor = target.actor;
      return Boolean(actor && !actor.isDead && actor.dialogue && !(actor.dialogueSeen && !actor.dialogueRepeat));
    }
    if (target.type === 'corpse') {
      const enemy = target.enemy;
      return Boolean(enemy && enemy.isDead && (enemy.inspect || this.#enemyHasUnclaimedLoot(enemy)));
    }
    if (target.type === 'object') {
      const object = target.object;
      return Boolean(object && !object.consumed && object.x === target.cell.x && object.y === target.cell.y);
    }
    return false;
  }

  #executeExploreTarget(target) {
    this.pendingExploreTarget = null;
    this.pathQueue = [];
    if (target.type === 'talk') {
      this.#openEnemyDialogue(target.actor);
      return;
    }
    if (target.type === 'corpse') {
      this.#interactWithCorpse(target.enemy);
      return;
    }
    if (target.type === 'object') {
      this.#interactWithObject(target.object);
    }
  }

  #enemyHasLoot(enemy) {
    return Array.isArray(enemy?.loot) && enemy.loot.length > 0;
  }

  #enemyHasUnclaimedLoot(enemy) {
    return this.#enemyHasLoot(enemy) && !enemy.lootClaimed;
  }

  #lootSummary(loot) {
    return (loot ?? [])
      .map((entry) => `${entry.count ?? 1}x ${this.inventory.displayName(entry.item)}`)
      .join(', ');
  }

  #logCarryFailure(carry) {
    const current = Inventory.formatWeight(carry.current);
    const max = Inventory.formatWeight(this.inventory.maxCarryWeight);
    const over = Inventory.formatWeight(carry.overBy);
    this.#log(`Too much to carry. Pack ${current}/${max} kg.`);
    this.#log(`Need ${over} kg free.`);
  }

  #interactWithCorpse(enemy) {
    if (!enemy) return;
    const loot = Array.isArray(enemy.loot) ? enemy.loot : [];
    const panelLines = [];

    if (loot.length && !enemy.lootClaimed) {
      const carry = this.inventory.canAddLoot(loot);
      if (!carry.ok) {
        this.#logCarryFailure(carry);
        panelLines.push('Too much to carry.');
        if (enemy.inspect) this.#openDialogueById(enemy.inspect);
        else this.#openDialogue(enemy.name, panelLines, 'corpse');
        return;
      }
      for (const entry of loot) this.inventory.add(entry.item, entry.count ?? 1);
      enemy.lootClaimed = true;
      const summary = this.#lootSummary(loot);
      if (summary) {
        const line = `Recovered: ${summary}.`;
        this.#log(line);
        panelLines.push(line);
      }
    } else if (loot.length && enemy.lootClaimed && !enemy.inspect) {
      panelLines.push('Nothing useful remains.');
    }

    if (enemy.inspect) {
      this.#openDialogueById(enemy.inspect);
    } else if (panelLines.length) {
      this.#openDialogue(enemy.name, panelLines, 'corpse');
    }
  }

  #interactWithObject(object, { bypassSearch = false } = {}) {
    if (object?.kind === GROUND_ITEM_KIND || object?.interact?.type === 'ground-item') {
      this.#pickupGroundItem(object);
      return;
    }
    if (isObjectLocked(object)) {
      this.#openLockDialogue(object);
      return;
    }
    if (isDoorObject(object)) {
      this.#openDoorObject(object);
      return;
    }
    if (!bypassSearch && this.#hasSearchChoices(object)) {
      this.#openSearchDialogue(object);
      return;
    }

    const result = this.interactions.interact(object, this.inventory);
    for (const line of result.logs) this.#log(line);
    this.#applyQuestUpdate(result.questUpdate);
    if (result.dialogueId) {
      this.#openDialogueById(result.dialogueId);
    } else {
      this.#openDialogue(this.#objectName(object), result.logs, object.interact?.type ?? 'inspect');
    }
    if (result.triggersCombat && this.mode !== 'combat') {
      this.#startCombat(result.combatEncounter ?? true, { fromAltar: true });
    }
  }

  #openDoorObject(object, { log = true } = {}) {
    if (!isDoorObject(object)) return;
    openLinkedObjects(object, this.level?.interactables ?? [], {
      grid: this.grid,
      now: this.anim?.tick ?? null
    });
    this.#refreshHiddenTiles({ rebuildStatic: true });
    if (log) {
      for (const line of [].concat(object.interact?.log ?? [])) this.#log(line);
    }
    if (object.interact?.questUpdate) this.#applyQuestUpdate(object.interact.questUpdate);
    if (object.interact?.dialogue) this.#openDialogueById(object.interact.dialogue);
  }

  #pickupGroundItem(item) {
    if (!canActorPickupGroundItem(this.player, item)) return;
    const count = item.count ?? 1;
    const carry = this.inventory.canAdd(item.itemId, count);
    if (!carry.ok) {
      const current = Inventory.formatWeight(carry.current);
      const max = Inventory.formatWeight(this.inventory.maxCarryWeight);
      const over = Inventory.formatWeight(carry.overBy);
      this.#log(`Too much to carry. Pack ${current}/${max} kg.`);
      this.#log(`Need ${over} kg free.`);
      return;
    }

    const result = this.inventory.add(item.itemId, count);
    if (!result.ok) {
      this.#log('Could not pick that up.');
      return;
    }

    item.consumed = true;
    item.pickupStart = this.anim.tick;
    const label = `${count}x ${item.name ?? this.inventory.displayName(item.itemId)}`;
    this.#log(`Picked up: ${label}.`);
    this.#clampInventorySelection();
  }

  #openLockDialogue(object, leadLines = []) {
    const lock = objectLock(object);
    if (!lock) return;

    const title = lockTitle(lock, this.#objectName(object));
    const bodyLines = [
      ...[].concat(leadLines ?? []).filter(Boolean),
      ...lockLines(lock, `${this.#objectName(object)} is locked.`)
    ];
    const choices = lockMethods(lock)
      .filter((method) => this.#meetsConditions(method.conditions))
      .map((method) => ({
        method,
        status: lockMethodStatus(method, {
          inventory: this.inventory,
          fieldRating: (fieldId) => this.#fieldRating(fieldId),
          primaryRating: (primaryId) => this.#primaryRating(primaryId)
        })
      }))
      .filter(({ status }) => status.available)
      .slice(0, DIALOGUE_MAX_CHOICES - 1)
      .map(({ method, status }) => ({
        label: this.#lockChoiceLabel(method, status),
        lockAction: { object, methodId: method.id },
        close: false
      }));

    if (choices.length === 0) {
      bodyLines.push('You see no useful way through this lock yet.');
    }
    choices.push({ label: 'Leave it shut', close: true });

    this.#setDialogueState({
      id: '__lock__',
      title,
      kind: 'lock',
      lines: bodyLines,
      choices,
      scroll: 0,
      options: choices.map((choice, index) => `${index + 1}. ${choice.label}`)
    });
  }

  #lockChoiceLabel(method, status) {
    const base = method.label ?? 'Try the lock';
    const check = status?.check;
    if (!check) return base;
    const label = check.kind === 'primary'
      ? this.#primaryLabel(check.id)
      : this.#fieldLabel(check.id);
    return `${base} (${label} ${check.rating} of ${check.dc})`;
  }

  #chooseLockOption(action) {
    const object = action?.object;
    if (!object) {
      this.#closeUiScreen();
      return;
    }
    if (!isObjectLocked(object)) {
      this.#closeUiScreen();
      this.#interactWithObject(object);
      return;
    }

    const method = lockMethodById(objectLock(object), action.methodId);
    const result = resolveLockMethod(method, {
      inventory: this.inventory,
      fieldRating: (fieldId) => this.#fieldRating(fieldId),
      primaryRating: (primaryId) => this.#primaryRating(primaryId),
      itemName: (itemId) => this.inventory.displayName(itemId)
    });
    if (result.unlocked) unlockLinkedObjects(object, this.level?.interactables ?? []);
    for (const line of result.logs) this.#log(line);
    if (result.unlocked) this.#applyLockToolWear(method, result.status);

    const didTransition = this.#applyEffects(result.effects);
    if (didTransition) return;

    if (result.unlocked) {
      this.#closeUiScreen();
      if (isDoorObject(object) && result.openOnSuccess) {
        this.#openDoorObject(object, { log: false });
        return;
      }
      if (result.openOnSuccess) this.#interactWithObject(object);
      return;
    }
    this.#openLockDialogue(object, result.logs);
  }

  #applyLockToolWear(method, status) {
    if (!lockMethodUsesSecurityTool(method, status)) return;
    if (securityToolSurvives(status)) return;
    if (!this.inventory.remove(SECURITY_TOOL_ITEM, 1)) return;
    this.#log(`${this.inventory.displayName(SECURITY_TOOL_ITEM)} bends past saving.`);
    this.#clampInventorySelection();
  }

  #hasSearchChoices(object) {
    const search = objectSearch(object);
    if (!search || object?.consumed) return false;
    return searchMethods(search)
      .filter((method) => this.#meetsConditions(method.conditions))
      .filter((method) => !searchMethodCompleted(object, method))
      .some((method) => searchMethodStatus(method, {
        inventory: this.inventory,
        fieldRating: (fieldId) => this.#fieldRating(fieldId),
        primaryRating: (primaryId) => this.#primaryRating(primaryId)
      }).available);
  }

  #openSearchDialogue(object, leadLines = []) {
    const search = objectSearch(object);
    if (!search) return;

    const bodyLines = [
      ...[].concat(leadLines ?? []).filter(Boolean),
      ...searchLines(search)
    ];
    const searchChoices = searchMethods(search)
      .filter((method) => this.#meetsConditions(method.conditions))
      .filter((method) => !searchMethodCompleted(object, method))
      .map((method) => ({
        method,
        status: searchMethodStatus(method, {
          inventory: this.inventory,
          fieldRating: (fieldId) => this.#fieldRating(fieldId),
          primaryRating: (primaryId) => this.#primaryRating(primaryId)
        })
      }))
      .filter(({ status }) => status.available)
      .slice(0, DIALOGUE_MAX_CHOICES - 2)
      .map(({ method, status }) => ({
        label: this.#searchChoiceLabel(method, status),
        searchAction: { object, methodId: method.id },
        close: false
      }));

    const choices = [
      ...searchChoices,
      {
        label: this.#searchUseLabel(object, search),
        searchAction: { object, useObject: true },
        close: false
      },
      { label: this.#searchLeaveLabel(search), close: true }
    ];

    this.#setDialogueState({
      id: '__search__',
      title: searchTitle(search, this.#objectName(object)),
      kind: 'search',
      lines: bodyLines,
      choices,
      scroll: 0,
      options: choices.map((choice, index) => `${index + 1}. ${choice.label}`)
    });
  }

  #searchChoiceLabel(method, status) {
    const base = method.label ?? 'Search';
    const check = status?.check;
    if (!check) return base;
    const label = check.kind === 'primary'
      ? this.#primaryLabel(check.id)
      : this.#fieldLabel(check.id);
    return `${base} (${label} ${check.rating} of ${check.dc})`;
  }

  #searchUseLabel(object, search) {
    if (typeof search?.useLabel === 'string' && search.useLabel.trim() !== '') return search.useLabel;
    const name = this.#objectName(object);
    if (object?.interact?.type === 'container') return `Loot ${name}`;
    if (object?.interact?.type === 'secret-entrance' || object?.interact?.type === 'secret-exit') return `Use ${name}`;
    return `Inspect ${name}`;
  }

  #searchLeaveLabel(search) {
    return typeof search?.leaveLabel === 'string' && search.leaveLabel.trim() !== ''
      ? search.leaveLabel
      : 'Leave it';
  }

  #chooseSearchOption(action) {
    const object = action?.object;
    if (!object) {
      this.#closeUiScreen();
      return;
    }
    if (action.useObject) {
      this.#closeUiScreen();
      this.#interactWithObject(object, { bypassSearch: true });
      return;
    }

    const method = searchMethodById(objectSearch(object), action.methodId);
    const result = resolveSearchMethod(method, {
      inventory: this.inventory,
      fieldRating: (fieldId) => this.#fieldRating(fieldId),
      primaryRating: (primaryId) => this.#primaryRating(primaryId),
      itemName: (itemId) => this.inventory.displayName(itemId)
    });
    if (result.completed) completeSearchMethod(object, method);
    for (const line of result.logs) this.#log(line);

    const didTransition = this.#applyEffects(result.effects);
    if (didTransition) return;

    this.#openSearchDialogue(object, result.logs);
  }

  // ---- UI screens --------------------------------------------------------

  #handleUiScreen(actions, click) {
    if (this.uiScreen === 'journal') {
      this.#handleJournalScreen(actions, click);
      return;
    }
    if (click) return;
    if (this.uiScreen === 'dialogue') {
      this.#handleDialogueScreen(actions);
      return;
    }
    if (this.uiScreen === 'inventory') {
      this.#handleInventoryScreen(actions);
      return;
    }
    for (const action of actions) {
      if (action === 'cancel' || action === 'confirm' || action === 'interact') {
        this.#closeUiScreen();
        return;
      }
      if (action === 'inventory') {
        this.#toggleInventory();
        return;
      }
      if (action === 'journal') {
        this.#toggleJournal();
        return;
      }
      if (action === 'dressing') {
        this.#log(this.inventory.useFieldDressing(this.player));
        return;
      }
      if (action === 'restart') {
        this.boot();
        return;
      }
      if (action === 'debug') this.debugGrid = !this.debugGrid;
    }
  }

  #toggleInventory() {
    if (this.uiScreen === 'inventory') {
      this.#closeUiScreen();
      return;
    }
    this.uiScreen = 'inventory';
    this.dialogue = null;
    this.#clampInventorySelection();
  }

  #toggleJournal() {
    if (this.uiScreen === 'journal') {
      this.#closeUiScreen();
      return;
    }
    this.uiScreen = 'journal';
    this.journalSection = 0;
    this.journalFactionIndex = 0;
    this.journalTurn = null;
    this.dialogue = null;
  }

  #handleJournalScreen(actions, click = null) {
    if (click) {
      const arrow = journalArrowAt(click);
      if (arrow === 'prev') this.#cycleJournalSection(-1);
      else if (arrow === 'next') this.#cycleJournalSection(1);
      return;
    }
    for (const action of actions) {
      if (action === 'cancel' || action === 'journal') {
        this.#closeUiScreen();
        return;
      }
      if (action === 'left' || action === 'cycle') this.#cycleJournalSection(-1);
      else if (action === 'right') this.#cycleJournalSection(1);
      else if (action === 'up') { if (this.journalSection === 2) this.#moveJournalFaction(-1); }
      else if (action === 'down') { if (this.journalSection === 2) this.#moveJournalFaction(1); }
      else if (action === 'inventory') { this.#toggleInventory(); return; }
      else if (action === 'restart') { this.boot(); return; }
      else if (action === 'debug') this.debugGrid = !this.debugGrid;
    }
  }

  #cycleJournalSection(delta) {
    if (this.journalTurn) return;
    const count = JOURNAL_SECTIONS.length;
    const from = this.journalSection ?? 0;
    const to = ((from + delta) % count + count) % count;
    if (to === from) return;
    this.journalTurn = {
      from,
      to,
      direction: delta < 0 ? -1 : 1,
      age: 0,
      duration: JOURNAL_TURN_DURATION
    };
  }

  #advanceJournalTurn(dt) {
    if (!this.journalTurn) return;
    this.journalTurn.age += dt;
    if (this.journalTurn.age >= this.journalTurn.duration) {
      this.journalSection = this.journalTurn.to;
      this.journalTurn = null;
    }
  }

  #moveJournalFaction(delta) {
    const known = (this.codexDefs ?? []).filter((entry) => !entry.unlockedBy || this.#journalConditionMet(entry.unlockedBy));
    if (!known.length) { this.journalFactionIndex = 0; return; }
    this.journalFactionIndex = Math.max(0, Math.min(known.length - 1, (this.journalFactionIndex ?? 0) + delta));
  }

  #handleInventoryScreen(actions) {
    this.#clampInventorySelection();
    for (const action of actions) {
      if (action === 'cancel' || action === 'inventory') {
        this.#closeUiScreen();
        return;
      }
      if (action === 'restart') {
        this.boot();
        return;
      }
      if (action === 'debug') {
        this.debugGrid = !this.debugGrid;
        continue;
      }
      if (action === 'dressing') {
        this.#log(this.inventory.useFieldDressing(this.player));
        continue;
      }
      if (action === 'left' || action === 'right' || action === 'cycle') {
        this.inventoryFocus = this.inventoryFocus === 'gear' ? 'items' : 'gear';
        this.#clampInventorySelection();
        continue;
      }
      if (action === 'up' || action === 'down') {
        this.#moveInventorySelection(action === 'down' ? 1 : -1);
        continue;
      }
      if (action === 'melee' || action === 'confirm' || action === 'interact') {
        if (this.inventoryFocus === 'gear') this.#unequipSelectedGear();
        else this.#equipSelectedInventoryItem();
        this.#refreshPlayerAppearance();
        this.#clampInventorySelection();
        continue;
      }
      if (action === 'sidearm') {
        if (this.inventoryFocus === 'gear') this.#unequipSelectedGear();
        else this.#unequipSelectedInventoryItem();
        this.#refreshPlayerAppearance();
        this.#clampInventorySelection();
        continue;
      }
      if (action === 'choice3') {
        this.#dropSelectedInventoryItem();
        this.#refreshPlayerAppearance();
        this.#clampInventorySelection();
      }
    }
  }

  #moveInventorySelection(delta) {
    if (this.inventoryFocus === 'gear') {
      const slots = this.inventory.equipmentEntries();
      this.equipmentIndex = Math.max(0, Math.min(slots.length - 1, this.equipmentIndex + delta));
      return;
    }
    const items = this.inventory.entries();
    this.inventoryIndex = Math.max(0, Math.min(items.length - 1, this.inventoryIndex + delta));
  }

  #equipSelectedInventoryItem() {
    const item = this.inventory.entries()[this.inventoryIndex];
    if (!item) {
      this.#log('Pack is empty.');
      return;
    }
    const result = this.inventory.equip(item.id);
    this.#log(result.message);
  }

  #unequipSelectedInventoryItem() {
    const item = this.inventory.entries()[this.inventoryIndex];
    if (!item) {
      this.#log('Pack is empty.');
      return;
    }
    const slot = this.inventory.equipmentEntries().find((entry) => entry.itemId === item.id);
    if (!slot) {
      this.#log('That item is not worn.');
      return;
    }
    this.#log(this.inventory.unequip(slot.slot).message);
  }

  #unequipSelectedGear() {
    const slot = this.inventory.equipmentEntries()[this.equipmentIndex];
    if (!slot) return;
    this.#log(this.inventory.unequip(slot.slot).message);
  }

  #dropSelectedInventoryItem() {
    if (this.inventoryFocus === 'gear') {
      const slot = this.inventory.equipmentEntries()[this.equipmentIndex];
      if (!slot || !slot.itemId) {
        this.#log(slot?.empty ? `${slot.label} is empty.` : 'No gear selected.');
        return;
      }
      this.#dropItemFromInventory(slot.itemId, { slot: slot.slot });
      return;
    }

    const item = this.inventory.entries()[this.inventoryIndex];
    if (!item) {
      this.#log('Pack is empty.');
      return;
    }
    this.#dropItemFromInventory(item.id);
  }

  #dropItemFromInventory(itemId, options = {}) {
    const itemDef = this.inventory.itemDefs[itemId] ?? {};
    const name = this.inventory.displayName(itemId);
    if (options.slot) {
      const result = this.inventory.unequip(options.slot);
      if (!result.ok) {
        this.#log(result.message);
        return false;
      }
    }
    if (!this.inventory.remove(itemId, 1)) {
      this.#log(`${name} is not in the pack.`);
      return false;
    }

    this.groundItemSeq += 1;
    const groundItem = createGroundItem({
      id: `${this.level?.id ?? 'level'}-drop-${this.groundItemSeq}`,
      itemId,
      itemDef,
      count: 1,
      x: this.player.x,
      y: this.player.y,
      tick: this.anim.tick,
      source: 'player'
    });
    if (!groundItem) {
      this.inventory.add(itemId, 1, { ignoreCapacity: true });
      this.#log(`Could not drop ${name}.`);
      return false;
    }

    this.groundItems.push(groundItem);
    this.#log(`Dropped: ${name}.`);
    return true;
  }

  // Re-bake the player sprite from the current equipment. The new atlas entry
  // replaces the old one in the shared atlas, so both the world renderer and the
  // inventory paper doll (which read the same atlas) update together. Only the
  // equipment-aware player sprite is rebaked; enemy sprites are left untouched.
  #refreshPlayerAppearance() {
    if (!this.atlas || this.player?.spriteId !== 'mara-vey') return;
    this.atlas[this.player.spriteId] = bakeMara(
      this.inventory.equipmentSnapshot(),
      this.inventory.itemDefs
    );
  }

  #openDialogue(title, lines, kind = 'inspect') {
    const cleanLines = [].concat(lines ?? []).filter(Boolean);
    if (cleanLines.length === 0) return;
    this.#setDialogueState({
      title,
      kind,
      lines: cleanLines,
      choices: [],
      scroll: 0,
      options: ['ENTER CLOSE', 'ESC CLOSE']
    });
  }

  #openDialogueById(dialogueId, nodeId = 'start') {
    const definition = this.dialogueDefs[dialogueId];
    if (!definition) {
      this.#log(`Missing dialogue: ${dialogueId}.`);
      return;
    }
    this.#setDialogueNode(definition, nodeId);
  }

  #setDialogueNode(definition, nodeId) {
    let node = definition.nodes?.[nodeId];
    // A node may be gated on story flags / quest stages. If its conditions are
    // not met it redirects to its `else` node, so (for example) a locked safe
    // only names the key's hiding place once the warden's journal has been read.
    let guard = 0;
    while (node && node.conditions && !this.#meetsConditions(node.conditions)) {
      if (!node.else || guard++ > 8) break;
      nodeId = node.else;
      node = definition.nodes?.[nodeId];
    }
    if (!node) {
      this.#log(`Missing dialogue node: ${definition.id}.${nodeId}.`);
      return;
    }
    // Showing a node can set run-global flags. This is idempotent (a Set), so
    // re-reading the same note is safe; one-shot effects stay on choices.
    if (node.effects?.setFlag) {
      for (const flag of [].concat(node.effects.setFlag)) this.flags.add(flag);
    }
    const lines = [].concat(node.lines ?? node.text ?? []).filter(Boolean);
    const choices = (node.choices ?? [])
      .filter((choice) => this.#meetsConditions(choice.conditions))
      .slice(0, DIALOGUE_MAX_CHOICES);
    this.#setDialogueState({
      id: definition.id,
      nodeId,
      title: node.title ?? definition.title ?? 'Inspect',
      kind: 'dialogue',
      lines,
      choices,
      mustChoose: Boolean(definition.mustChoose || node.mustChoose),
      scroll: 0,
      options: choices.length > 0
        ? choices.map((choice, index) => `${index + 1}. ${choice.label}`)
        : ['ENTER CLOSE', 'ESC CLOSE']
    });
  }

  #setDialogueState(dialogue) {
    this.uiScreen = 'dialogue';
    this.dialogue = dialogue;
    this.#syncDialogueLayout();
  }

  #syncDialogueLayout() {
    if (!this.dialogue) return;
    const layout = buildDialogueLayout(this.dialogue);
    this.dialogue.scroll = layout.scroll;
    this.dialogue.maxScroll = layout.maxScroll;
  }

  // True when every flag, quest, scar, Trace, and field-rating gate is satisfied.
  #meetsConditions(conditions) {
    if (!conditions) return true;
    for (const flag of [].concat(conditions.flag ?? [], conditions.flags ?? [])) {
      if (!this.flags.has(flag)) return false;
    }
    for (const flag of [].concat(conditions.notFlag ?? [], conditions.flagsAbsent ?? [])) {
      if (this.flags.has(flag)) return false;
    }
    for (const [questId, stage] of Object.entries(conditions.questStages ?? {})) {
      if (this.questStages?.get(questId) !== stage) return false;
    }
    for (const scarId of [].concat(conditions.scar ?? [], conditions.scars ?? [])) {
      if (!this.#hasScar(scarId)) return false;
    }
    for (const scarId of [].concat(conditions.notScar ?? [], conditions.scarsAbsent ?? [])) {
      if (this.#hasScar(scarId)) return false;
    }
    for (const [scarId, rank] of Object.entries(conditions.scarRanks ?? {})) {
      if (!this.#hasScar(scarId, rank)) return false;
    }
    for (const [fieldId, minimum] of Object.entries(conditions.fieldRatings ?? {})) {
      if (typeof minimum !== 'number' || this.#fieldRating(fieldId) < minimum) return false;
    }
    if (conditions.traceMin !== undefined && this.#traceValue() < conditions.traceMin) return false;
    if (conditions.traceMax !== undefined && this.#traceValue() > conditions.traceMax) return false;
    return true;
  }

  #playerProgression() {
    return normalizeProgression(this.player?.progression);
  }

  #hasScar(scarId, rank = 1) {
    const minRank = typeof rank === 'number' ? rank : 1;
    return this.#playerProgression().scars.some((scar) => scar.id === scarId && scar.rank >= minRank);
  }

  #fieldRating(fieldId) {
    const field = FIELD_RATINGS.find((entry) => entry.id === fieldId);
    if (!field) return Number.NEGATIVE_INFINITY;
    return calculateFieldRating(this.#playerProgression(), field);
  }

  #primaryRating(primaryId) {
    return this.#playerProgression().primaries[primaryId] ?? Number.NEGATIVE_INFINITY;
  }

  #fieldLabel(fieldId) {
    return FIELD_RATINGS.find((entry) => entry.id === fieldId)?.label ?? fieldId;
  }

  #primaryLabel(primaryId) {
    return PRIMARY_ATTRIBUTES.find((entry) => entry.id === primaryId)?.label ?? primaryId;
  }

  #traceValue() {
    return this.#playerProgression().trace;
  }

  #handleDialogueScreen(actions) {
    const choices = this.dialogue?.choices ?? [];
    this.#syncDialogueLayout();
    for (const action of actions) {
      if (action === 'up') {
        this.dialogue.scroll = Math.max(0, (this.dialogue.scroll ?? 0) - 1);
        this.#syncDialogueLayout();
        continue;
      }
      if (action === 'down') {
        this.dialogue.scroll = Math.min(this.dialogue.maxScroll ?? 0, (this.dialogue.scroll ?? 0) + 1);
        this.#syncDialogueLayout();
        continue;
      }
      if (choices.length > 0) {
        const choiceIndex = this.#dialogueChoiceIndex(action);
        if (choiceIndex !== null) {
          this.#chooseDialogueOption(choiceIndex);
          return;
        }
        if (action === 'confirm' || action === 'interact') {
          this.#chooseDialogueOption(0);
          return;
        }
        if (action === 'cancel' && !this.dialogue?.mustChoose) {
          this.#closeUiScreen();
          return;
        }
      } else if (action === 'cancel' || action === 'confirm' || action === 'interact') {
        this.#closeUiScreen();
        return;
      }

      if (this.dialogue?.mustChoose && choices.length > 0) {
        if (action === 'restart') {
          this.boot();
          return;
        }
        if (action === 'debug') this.debugGrid = !this.debugGrid;
        continue;
      }

      if (action === 'inventory') {
        this.#toggleInventory();
        return;
      }
      if (action === 'dressing') {
        this.#log(this.inventory.useFieldDressing(this.player));
        return;
      }
      if (action === 'restart') {
        this.boot();
        return;
      }
      if (action === 'debug') this.debugGrid = !this.debugGrid;
    }
  }

  #dialogueChoiceIndex(action) {
    const choiceKeys = { melee: 0, sidearm: 1, choice3: 2, choice4: 3, choice5: 4 };
    return choiceKeys[action] ?? null;
  }

  #chooseDialogueOption(index) {
    const choice = this.dialogue?.choices?.[index];
    if (!choice) return;
    if (choice.lockAction) {
      this.#chooseLockOption(choice.lockAction);
      return;
    }
    if (choice.searchAction) {
      this.#chooseSearchOption(choice.searchAction);
      return;
    }
    const didTransition = this.#applyEffects(choice.effects);
    if (didTransition) return;
    const definition = this.dialogueDefs[this.dialogue.id];
    if (choice.next && definition) {
      this.#setDialogueNode(definition, choice.next);
      return;
    }
    if (choice.close !== false) this.#closeUiScreen();
  }

  #applyEffects(effects) {
    if (!effects) return false;
    for (const line of [].concat(effects.log ?? [])) this.#log(line);
    for (const flag of [].concat(effects.setFlag ?? [])) this.flags.add(flag);
    this.#applyInventoryEffects(effects.inventory);
    this.#applyQuestUpdate(effects.questUpdate);
    if (effects.xp !== undefined) this.#awardPlayerExperience(effects.xp);
    if (effects.kill) this.#silenceProp(effects.kill);
    if (effects.teleport) this.#teleportPlayer(effects.teleport);
    if (effects.showBriefing) {
      this.#showBriefing(effects.showBriefing);
      return true;
    }
    if (effects.startCombat) {
      const start = effects.startCombat;
      const encounter = typeof start === 'string' ? start : start.encounter;
      this.#closeUiScreen();
      this.#startCombat(encounter ?? true, { fromAltar: Boolean(start.fromAltar) });
      return true;
    }
    if (effects.loadLevel) {
      void this.#transitionLevel(effects.loadLevel);
      return true;
    }
    return false;
  }

  #showBriefing(effect) {
    const pages = [];
    const pushPage = (page) => {
      const lines = [].concat(page ?? []).filter(Boolean);
      if (lines.length) pages.push(lines);
    };
    for (const page of effect.pages ?? []) pushPage(page);
    for (const entry of effect.conditionalPages ?? []) {
      if (this.#meetsConditions(entry.conditions)) pushPage(entry.page);
    }
    if (!pages.length) return;

    this.#closeUiScreen();
    this.mode = 'intro';
    this.briefing = pages;
    this.briefingTitle = effect.title ?? 'FIELD WRIT';
    this.briefingPage = 0;
    this.briefingNextPrompt = effect.nextPrompt ?? 'ENTER: CONTINUE';
    this.briefingLastPrompt = effect.lastPrompt ?? 'ENTER: CONTINUE';
    this.briefingSkipPrompt = effect.skipPrompt ?? 'ESC: SKIP';
    this.briefingMarksIntro = false;
  }

  #applyInventoryEffects(inventoryEffects) {
    if (!inventoryEffects) return;
    for (const entry of [].concat(inventoryEffects.remove ?? [])) {
      if (!entry?.item) continue;
      const count = entry.count ?? 1;
      if (!this.inventory.remove(entry.item, count)) {
        this.#log(`${this.inventory.displayName(entry.item)} is not in the pack.`);
      }
    }
    for (const entry of [].concat(inventoryEffects.add ?? [])) {
      if (!entry?.item) continue;
      const count = entry.count ?? 1;
      const result = this.inventory.add(entry.item, count);
      if (!result.ok) {
        this.#log(`No room for ${this.inventory.displayName(entry.item)}.`);
        continue;
      }
      this.#log(`Received: ${count}x ${this.inventory.displayName(entry.item)}.`);
    }
  }

  // End a still-living staged victim (the crucified Opened Saint, or its cellar
  // successor): it stops whispering, its backlight gutters out, and it will not
  // offer the choice again. `consumed` keeps the prop killed across re-entry.
  #silenceProp(propId) {
    const prop = (this.level.props ?? []).find((object) => object.id === propId);
    if (!prop) return;
    prop.killed = true;
    prop.consumed = true;
    prop.speech = null;
    prop.ambient = [];
    // A crucified saint cut down falls off the cross and dies on the ground; the
    // renderer animates the drop from this timestamp.
    if (prop.kind === 'cross-martyr') {
      prop.released = true;
      prop.fallStart = this.anim?.tick ?? 0;
    }
  }

  async #transitionLevel(effect) {
    this.#closeUiScreen();
    this.#snapshotLevelState();
    this.ready = false;
    this.levelPath = effect.path ?? this.levelPath;
    await this.boot({ preserveRun: true, player: effect.player ?? null });
  }

  #teleportPlayer(point) {
    if (!point || !this.grid.isWalkable(point.x, point.y)) return;
    this.player.moveTo(point.x, point.y);
    this.player.pxOffset = { x: 0, y: 0 };
    this.player.render.state = 'idle';
    this.player.render.frameIndex = 0;
    this.moving = null;
    this.pathQueue = [];
    this.pendingExploreTarget = null;
  }

  #closeUiScreen() {
    this.uiScreen = null;
    this.dialogue = null;
  }

  // ---- Combat mode -------------------------------------------------------

  #handleCombat(actions, click, dt) {
    if (this.turnManager.isPlayerTurn()) {
      this.#handlePlayerCombat(actions, click);
    } else {
      this.#runEnemyTurn(dt);
    }
  }

  #handlePlayerCombat(actions, click) {
    if (click) this.#handleClickMove(click, true);
    for (const action of actions) {
      if (DIRS[action]) {
        this.pathQueue = [];
        if (this.player.ap >= this.player.moveCost) {
          const moved = this.#tryStep(this.player, DIRS[action], { logBlock: false });
          if (moved) {
            this.player.ap -= this.player.moveCost;
            return;
          }
        } else {
          this.#log('Not enough AP to move.');
        }
        continue;
      }
      switch (action) {
        case 'melee':
          this.#selectAttack('melee');
          break;
        case 'sidearm':
          this.#selectAttack('sidearm');
          break;
        case 'cycle':
          this.#cycleTarget();
          break;
        case 'confirm':
          this.#playerAttack();
          break;
        case 'interact': // E = end turn in combat
          this.#endPlayerTurn();
          return;
        case 'dressing':
          this.#log(this.inventory.useFieldDressing(this.player));
          break;
        case 'inventory':
          this.#toggleInventory();
          return;
        case 'journal':
          this.#toggleJournal();
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

  #selectAttack(id) {
    const attack = this.player.getAttack(id);
    if (!attack) return;
    this.selectedAttackId = id;
    this.#log(`Readied ${attack.name}.`);
  }

  #cycleTarget() {
    const living = this.#livingEnemies();
    if (living.length === 0) return;
    this.targetIndex = (this.targetIndex + 1) % living.length;
    this.#log(`Target: ${living[this.targetIndex].name}.`);
  }

  #currentTarget() {
    const living = this.#livingEnemies();
    if (living.length === 0) return null;
    if (this.targetIndex >= living.length) this.targetIndex = 0;
    return living[this.targetIndex];
  }

  #playerAttack() {
    const attack = this.player.getAttack(this.selectedAttackId);
    const target = this.#currentTarget();
    if (!attack || !target) return;
    if (this.player.ap < attack.apCost) {
      this.#log('Not enough AP for that attack.');
      return;
    }
    if (chebyshev(this.player.position, target.position) > attack.range) {
      this.#log('Target is out of range.');
      return;
    }
    this.#faceToward(this.player, target.position);
    const result = this.combat.performAttack(this.player, target, attack);
    for (const line of result.logs) this.#log(line);
    this.#pushEffect(result.effect);
    this.#checkOutcome();
  }

  #endPlayerTurn() {
    if (this.mode !== 'combat') return;
    const next = this.turnManager.endTurn();
    if (!next) return;
    this.enemyActions = null;
  }

  #runEnemyTurn(dt) {
    const enemy = this.turnManager.current();
    if (!enemy || enemy.isDead) {
      this.#advanceTurnPastDead();
      return;
    }

    // Plan this enemy's turn once.
    if (this.enemyActions === null || this.enemyActor !== enemy) {
      this.enemyActor = enemy;
      this.enemyActions = planTurn(enemy, this.player, this.grid, this.actors);
      this.actionTimer = ENEMY_ACTION_DELAY;
      const flavor = flavorLine(enemy, this.turnManager.round);
      if (flavor) this.#log(flavor);
      if (this.enemyActions.length === 0) {
        this.#log(`${enemy.name} holds its ground.`);
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
      if (next && next.type === 'player') this.#log('Your move.');
      return;
    }

    const action = this.enemyActions.shift();
    if (action.type === 'move') {
      const dir = { x: action.to.x - enemy.position.x, y: action.to.y - enemy.position.y };
      this.#tryStep(enemy, dir, true);
      enemy.ap -= enemy.moveCost;
    } else if (action.type === 'attack') {
      const attack = enemy.attacks[0];
      this.#faceToward(enemy, this.player.position);
      const result = this.combat.performAttack(enemy, this.player, attack);
      for (const line of result.logs) this.#log(line);
      this.#pushEffect(result.effect);
      this.#checkOutcome();
      if (this.mode !== 'combat') this.enemyActions = [];
    }
  }

  #advanceTurnPastDead() {
    this.enemyActions = null;
    this.enemyActor = null;
    this.turnManager.endTurn();
  }

  #checkOutcome() {
    const encounterEnemies = this.#activeEncounterEnemies();
    const outcome = this.combat.outcome(this.player, encounterEnemies);
    if (outcome === 'victory') {
      const clearedEncounter = this.activeEncounter;
      if (!this.clearedEncounters.has(clearedEncounter)) this.#awardExperienceForEnemies(encounterEnemies);
      this.turnManager.active = false;
      if (clearedEncounter) this.clearedEncounters.add(clearedEncounter);
      this.activeEncounter = null;
      this.enemyActions = null;
      this.enemyActor = null;

      if (this.enemies.some((enemy) => !enemy.isDead)) {
        this.mode = 'explore';
        this.#log('The immediate fight breaks. Other voices still move in the ruins.');
        return;
      }

      this.mode = 'victory';
      this.#log(this.level.victoryLog ?? 'The area falls quiet. Nothing answers now.');
      if (this.level.onVictory && !this.appliedLevelEvents.has('victory')) {
        this.appliedLevelEvents.add('victory');
        this.#applyEffects(this.level.onVictory);
      }
      this.#log('Explore on, or press R to begin again.');
    } else if (outcome === 'defeat') {
      this.mode = 'defeat';
      this.turnManager.active = false;
      this.player.render.state = 'dead';
      this.#log('Mara Vey falls on the chapel stone. Press R to try again.');
    }
  }

  #awardExperienceForEnemies(enemies) {
    const total = experienceRewardForEncounter(enemies);
    this.#awardPlayerExperience(total);
  }

  #awardPlayerExperience(amount) {
    const result = awardExperience(this.player, amount);
    if (result.amount <= 0) return;
    this.#log(`Experience gained: ${result.amount}.`);
    if (result.levelDelta > 0) {
      this.#log(`Level ${result.level} reached.`);
      this.#log(`Primary points available: ${result.primaryPoints}.`);
    }
  }

  // ---- End state ---------------------------------------------------------

  #handleEndState(actions) {
    for (const action of actions) {
      if (action === 'restart') {
        this.boot();
        return;
      }
      if (action === 'debug') this.debugGrid = !this.debugGrid;
    }
  }

  // ---- Combat start ------------------------------------------------------

  #startCombat(encounterId = null, { fromAltar = false } = {}) {
    if (this.mode === 'combat') return;
    const resolvedEncounter = this.#resolveEncounterId(encounterId);
    const combatants = this.#livingEnemiesForEncounter(resolvedEncounter);
    if (combatants.length === 0) return;

    this.mode = 'combat';
    this.activeEncounter = resolvedEncounter;
    this.pathQueue = [];
    this.pendingExploreTarget = null;
    for (const enemy of combatants) enemy.speech = null;
    this.turnManager.begin([this.player, ...combatants]);
    this.targetIndex = 0;
    this.selectedAttackId = this.player.attacks[0]?.id ?? null;

    if (fromAltar) {
      this.#log('The Host tissue beneath the altar pulses once, like a heart remembering worship.');
    }
    this.#log('Combat begins.');
    const introLines = this.#encounterIntro(resolvedEncounter).length
      ? this.#encounterIntro(resolvedEncounter)
      : combatants.map((enemy) => `${enemy.name} advances.`);
    for (const line of introLines) this.#log(line);
  }

  // ---- Movement ----------------------------------------------------------

  // Begin a stepped move of `actor` by `dir` if the destination is free.
  // Returns true if a step started.
  #tryStep(actor, dir, { logBlock = false } = {}) {
    if (this.moving) return false;
    const nx = actor.position.x + dir.x;
    const ny = actor.position.y + dir.y;
    if (this.#isCellHidden(nx, ny) || !this.grid.isWalkable(nx, ny) || this.#isOccupied(nx, ny, actor)) {
      if (logBlock) this.#log('The ruins do not give way.');
      return false;
    }

    // Face the way we step (one of eight isometric facings).
    actor.facing = screenFacing(dir.x, dir.y);
    // Screen-space delta is independent of the camera origin (it cancels).
    const from = gridToScreen(actor.position.x, actor.position.y, 0);
    actor.moveTo(nx, ny);
    const to = gridToScreen(nx, ny, 0);
    actor.pxOffset = { x: from.x - to.x, y: from.y - to.y };
    actor.render.state = 'walk';
    actor.render.frameIndex = 0;
    actor.render.timer = 0;

    this.moving = {
      actor,
      t: 0,
      fromX: actor.pxOffset.x,
      fromY: actor.pxOffset.y
    };
    return true;
  }

  // Advance the active step. Returns true while a step is in flight. The visual
  // offset is quantized to the walk frames so movement keeps an old CRPG cadence
  // instead of smooth modern tweening.
  #advanceMovement(dt) {
    if (!this.moving) return false;
    const move = this.moving;
    move.t += dt;
    const ratio = Math.min(move.t / STEP_DURATION, 1);
    const frameIndex = Math.min(WALK_FRAMES - 1, Math.floor(ratio * WALK_FRAMES));
    const visualRatio = ratio >= 1 ? 1 : frameIndex / WALK_FRAMES;
    move.actor.pxOffset = {
      x: Math.round(move.fromX * (1 - visualRatio)),
      y: Math.round(move.fromY * (1 - visualRatio))
    };
    if (!move.actor.isDead) {
      move.actor.render.state = 'walk';
      move.actor.render.frameIndex = frameIndex;
    }

    if (ratio >= 1) {
      move.actor.pxOffset = { x: 0, y: 0 };
      if (move.actor.render.state === 'walk') {
        move.actor.render.state = 'idle';
        move.actor.render.frameIndex = 0;
      }
      this.moving = null;
      this.#onStepComplete(move.actor);
    }
    return this.moving !== null;
  }

  // Walk the next cell of a queued click-to-move path.
  #stepAlongPath() {
    if (this.pathQueue.length === 0) return;
    if (this.mode === 'combat' && !this.turnManager.isPlayerTurn()) return;
    if (this.mode === 'defeat') { this.pathQueue = []; return; }
    if (this.mode === 'combat' && this.player.ap < this.player.moveCost) {
      this.pathQueue = [];
      return;
    }
    const next = this.pathQueue[0];
    const dir = {
      x: Math.sign(next.x - this.player.position.x),
      y: Math.sign(next.y - this.player.position.y)
    };
    if (this.#tryStep(this.player, dir, { logBlock: false })) {
      this.pathQueue.shift();
      if (this.mode === 'combat') this.player.ap -= this.player.moveCost;
    } else {
      this.pathQueue = [];
    }
  }

  // Left-click a walkable tile to path there; click an enemy (in combat) to
  // target it.
  #handleClickMove(click, combat) {
    if (click.button !== 0) return;
    if (click.y >= VIEWPORT_HEIGHT) return; // ignore clicks on the UI bar
    const cell = this.renderer.toGrid(click.x, click.y);
    if (!this.grid.isInside(cell.x, cell.y)) return;

    if (combat) {
      const idx = this.#livingEnemies().findIndex(
        (e) => e.position.x === cell.x && e.position.y === cell.y
      );
      if (idx >= 0) {
        this.targetIndex = idx;
        this.#faceToward(this.player, cell);
        this.pathQueue = [];
        this.#log(`Target: ${this.#livingEnemies()[idx].name}.`);
        return;
      }
    }
    if (this.#isCellHidden(cell.x, cell.y) || !this.grid.isWalkable(cell.x, cell.y)) return;
    const path = findPath(this.grid, this.player.position, cell, this.#occupiedSet(this.player));
    this.pathQueue = path && path.length ? path : [];
  }

  #onStepComplete(actor) {
    if (actor === this.player && this.mode === 'explore') {
      this.#checkCombatProximity();
      this.#tryCompletePendingExploreTarget();
    }
  }

  #checkCombatProximity() {
    const speaker = this.#triggeredDialogueEnemy();
    if (speaker) {
      this.#openEnemyDialogue(speaker);
      return;
    }

    for (const trigger of this.level.combatTriggers ?? []) {
      if (this.#isCellHidden(trigger.x, trigger.y)) continue;
      const encounterId = this.#resolveEncounterId(trigger.encounter ?? trigger.id);
      if (this.clearedEncounters.has(encounterId)) continue;
      if (this.#livingEnemiesForEncounter(encounterId).length === 0) continue;
      if (manhattan(this.player.position, trigger) <= (trigger.radius ?? TRIGGER_RADIUS)) {
        this.#startCombat(encounterId);
        return;
      }
    }
    for (const enemy of this.enemies) {
      const encounterId = this.#resolveEncounterId(enemy.encounter);
      if (enemy.isDead || this.clearedEncounters.has(encounterId)) continue;
      if (this.#isCellHidden(enemy.position.x, enemy.position.y)) continue;
      const radius = enemy.aggroRadius ?? TRIGGER_RADIUS;
      if (manhattan(this.player.position, enemy.position) <= radius) {
        this.#startCombat(encounterId);
        return;
      }
    }
  }

  // ---- Animation & effects ----------------------------------------------

  #advanceAmbientSpeech(dt) {
    let speechActive = false;
    for (const actor of [...this.enemies, ...(this.npcs ?? [])]) {
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
      if (this.#isCellHidden(actor.position.x, actor.position.y)) continue;
      const distance = manhattan(this.player.position, actor.position);
      if (distance > 10) continue;

      actor.ambientTimer = (actor.ambientTimer ?? AMBIENT_ACTOR_DELAY) - dt;
      if (actor.ambientTimer > 0) continue;
      candidates.push({ type: 'actor', subject: actor, distance });
    }

    for (const prop of this.speakingProps ?? []) {
      if (prop.killed || prop.speech) continue;
      if (this.#isCellHidden(prop.x, prop.y)) continue;
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

  #advanceAnim(dt) {
    this.anim.tick += dt;
    this.anim.idleFrame = Math.floor(this.anim.tick / 0.35) % 4;
    this.anim.bob = Math.floor(this.anim.tick / 0.5) % 2;
    this.anim.flicker = Math.floor(this.anim.tick / 0.13) % 2;
    this.anim.pulse = Math.floor(this.anim.tick / 0.6) % 2;
  }

  #advanceGroundItems() {
    if (!this.groundItems?.length) return;
    this.groundItems = this.groundItems.filter((item) => !isGroundItemPickupComplete(item, this.anim.tick));
  }

  #advanceActorAnim(actor, dt) {
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
    // 'walk' frames come from #advanceMovement; 'idle' from anim.bob in render.
  }

  #pushEffect(effect) {
    if (effect) this.effects.push({ ...effect, age: 0 });
  }

  #ageEffects(dt) {
    for (const effect of this.effects) {
      effect.age += dt;
      effect.rise = Math.round(effect.age * 24);
    }
    this.effects = this.effects.filter((effect) => effect.age < EFFECT_LIFE);
  }

  // ---- Helpers -----------------------------------------------------------

  #isOccupied(x, y, exclude) {
    return this.actors.some(
      (actor) => actor !== exclude &&
        !actor.isDead &&
        !this.#isCellHidden(actor.position.x, actor.position.y) &&
        actor.position.x === x &&
        actor.position.y === y
    );
  }

  #occupiedSet(exclude) {
    const set = new Set();
    for (const actor of this.actors) {
      if (actor === exclude || actor.isDead) continue;
      if (this.#isCellHidden(actor.position.x, actor.position.y)) continue;
      set.add(`${actor.position.x},${actor.position.y}`);
    }
    return set;
  }

  #livingEnemies() {
    if (this.mode === 'combat' && this.activeEncounter) {
      return this.#livingEnemiesForEncounter(this.activeEncounter);
    }
    return this.enemies.filter((enemy) =>
      !enemy.isDead && !this.#isCellHidden(enemy.position.x, enemy.position.y)
    );
  }

  #livingEnemiesForEncounter(encounterId) {
    const resolved = this.#resolveEncounterId(encounterId);
    return this.enemies.filter((enemy) =>
      !enemy.isDead &&
      !this.#isCellHidden(enemy.position.x, enemy.position.y) &&
      this.#resolveEncounterId(enemy.encounter) === resolved
    );
  }

  #activeEncounterEnemies() {
    if (!this.activeEncounter) return this.enemies;
    const resolved = this.#resolveEncounterId(this.activeEncounter);
    return this.enemies.filter((enemy) => this.#resolveEncounterId(enemy.encounter) === resolved);
  }

  #resolveEncounterId(encounterId) {
    if (encounterId === true || encounterId == null) {
      const nearest = this.enemies
        .filter((enemy) => !enemy.isDead)
        .sort((a, b) => manhattan(this.player.position, a.position) - manhattan(this.player.position, b.position))[0];
      return nearest?.encounter ?? nearest?.spawnId ?? null;
    }
    return encounterId;
  }

  #encounterIntro(encounterId) {
    const trigger = (this.level.combatTriggers ?? []).find((entry) =>
      this.#resolveEncounterId(entry.encounter ?? entry.id) === encounterId
    );
    return trigger?.intro ?? this.level.combatIntro ?? [];
  }

  // Turn an actor to face a tile (one of eight isometric facings).
  #faceToward(actor, target) {
    actor.facing = screenFacing(target.x - actor.position.x, target.y - actor.position.y);
  }

  // Last word of a name, for the cramped target readout ("Cutthroat 4/9").
  #shortName(name) {
    const parts = String(name).split(' ');
    return parts[parts.length - 1];
  }

  #log(message) {
    if (!message) return;
    this.log.push(message);
    if (this.log.length > MAX_LOG) this.log = this.log.slice(-MAX_LOG);
  }

  #loadStartingInventory(loadout) {
    for (const entry of loadout?.items ?? []) {
      this.inventory.add(entry.item, entry.count ?? 1, { ignoreCapacity: true });
    }
    this.inventory.loadEquipment(loadout?.equipment ?? {});
  }

  #clampInventorySelection() {
    this.inventoryFocus = this.inventoryFocus === 'gear' ? 'gear' : 'items';
    const itemCount = this.inventory?.entries().length ?? 0;
    const slotCount = this.inventory?.equipmentEntries().length ?? 0;
    this.inventoryIndex = Math.max(0, Math.min(Math.max(0, itemCount - 1), this.inventoryIndex ?? 0));
    this.equipmentIndex = Math.max(0, Math.min(Math.max(0, slotCount - 1), this.equipmentIndex ?? 0));
  }

  #startQuests(previousStages = null, previousReached = null) {
    for (const quest of Object.values(this.questDefs)) {
      const stage = previousStages?.get(quest.id) ?? quest.initialStage ?? quest.stages?.[0]?.id ?? 'active';
      this.questStages.set(quest.id, stage);
      const reached = previousReached?.get(quest.id)
        ? new Set(previousReached.get(quest.id))
        : this.#stagesUpTo(quest, stage);
      for (const reachedStage of this.#stagesUpTo(quest, stage)) reached.add(reachedStage);
      this.questReached.set(quest.id, reached);
      this.#log(`Quest: ${quest.title}.`);
      const description = this.#questStageDescription(quest.id, stage);
      if (description) this.#log(description);
    }
  }

  // Every stage id up to and including `stageId` in the quest's ordered list.
  // Stages advance forward, so this yields sensible progress even after a reload
  // that only restored the current stage.
  #stagesUpTo(quest, stageId) {
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

  #applyQuestUpdate(update) {
    if (!update?.quest || !update.stage) return;
    const quest = this.questDefs[update.quest];
    const current = this.questStages.get(update.quest);
    if (!quest || current === update.stage) return;
    this.questStages.set(update.quest, update.stage);
    const reached = this.questReached.get(update.quest) ?? new Set();
    reached.add(update.stage);
    this.questReached.set(update.quest, reached);
    if (update.log) this.#log(update.log);
    this.#awardQuestStageExperience(quest, update.stage);
    if (update.stage === 'complete') {
      this.#log(`Quest complete: ${quest.title}.`);
      return;
    }
    const description = this.#questStageDescription(update.quest, update.stage);
    if (description) this.#log(description);
  }

  #questStageDescription(questId, stageId) {
    const quest = this.questDefs[questId];
    return quest?.stages?.find((stage) => stage.id === stageId)?.description ?? '';
  }

  #awardQuestStageExperience(quest, stageId) {
    const key = questStageExperienceKey(quest.id, stageId);
    if (this.awardedQuestXp.has(key)) return;
    this.awardedQuestXp.add(key);
    this.#awardPlayerExperience(questStageExperience(quest, stageId));
  }

  // The whole journal book: the quest checklist (source of truth), the running
  // findings log that grows as the player discovers things, and the faction
  // codex whose cult entries unlock as the investigation advances.
  #buildJournal() {
    return {
      section: this.journalSection ?? 0,
      sections: JOURNAL_SECTIONS,
      turn: this.#journalTurnState(),
      factionIndex: this.journalFactionIndex ?? 0,
      quests: this.#journalQuests(),
      findings: this.#journalFindings(),
      factions: this.#journalFactions(),
      character: this.#journalCharacter()
    };
  }

  #journalTurnState() {
    if (!this.journalTurn) return null;
    const duration = this.journalTurn.duration || JOURNAL_TURN_DURATION;
    return {
      from: this.journalTurn.from,
      to: this.journalTurn.to,
      direction: this.journalTurn.direction,
      progress: Math.max(0, Math.min(1, this.journalTurn.age / duration))
    };
  }

  #journalCharacter() {
    return buildCharacterSheet(this.player);
  }

  #journalQuests() {
    const quests = [];
    for (const quest of Object.values(this.questDefs)) {
      const stages = quest.stages ?? [];
      const reached = this.questReached.get(quest.id) ?? new Set();
      const currentStage = this.questStages.get(quest.id);
      const isComplete = reached.has('complete') || currentStage === 'complete';
      let bestIdx = -1;
      stages.forEach((stage, i) => { if (reached.has(stage.id)) bestIdx = Math.max(bestIdx, i); });
      const headStage = stages[bestIdx] ?? stages.find((stage) => stage.id === currentStage) ?? stages[0] ?? null;
      const objectives = (quest.objectives ?? [])
        .filter((obj) => !obj.reveal || reached.has(obj.reveal))
        .map((obj) => {
          if (obj.lead) return { text: obj.text, done: false, active: false, lead: true };
          const done = isComplete || (obj.stage ? reached.has(obj.stage) : false);
          return { text: obj.text, done, active: false, lead: false };
        });
      const firstOpen = objectives.find((obj) => !obj.lead && !obj.done);
      if (firstOpen) {
        firstOpen.active = true;
      } else {
        const lead = objectives.find((obj) => obj.lead);
        if (lead) lead.active = true;
      }
      quests.push({
        title: quest.title ?? quest.id,
        task: headStage?.task ?? null,
        note: headStage?.description ?? '',
        complete: isComplete,
        objectives
      });
    }
    return quests;
  }

  // Findings accumulate: each reached quest stage logs its note, and each
  // flag-gated field note appears once the player has actually seen the thing.
  #journalFindings() {
    const findings = [];
    for (const quest of Object.values(this.questDefs)) {
      const reached = this.questReached.get(quest.id) ?? new Set();
      for (const stage of quest.stages ?? []) {
        if (reached.has(stage.id) && stage.description) findings.push(stage.description);
      }
    }
    for (const note of this.journalNotes ?? []) {
      if (note.text && this.#journalConditionMet(note)) findings.push(note.text);
    }
    return findings;
  }

  #journalFactions() {
    return (this.codexDefs ?? []).map((entry) => ({
      name: entry.name,
      kind: entry.kind ?? '',
      summary: entry.summary ?? '',
      facts: entry.facts ?? [],
      known: !entry.unlockedBy || this.#journalConditionMet(entry.unlockedBy)
    }));
  }

  // A flag/quest-stage gate shared by codex entries and field notes. A note may
  // carry the condition inline; a codex entry nests it under `unlockedBy`.
  #journalConditionMet(spec) {
    if (!spec) return true;
    if (spec.flag && this.flags.has(spec.flag)) return true;
    if (spec.questStage) {
      for (const [questId, stageId] of Object.entries(spec.questStage)) {
        if ((this.questReached.get(questId) ?? new Set()).has(stageId)) return true;
      }
    }
    if (!spec.flag && !spec.questStage) return true;
    return false;
  }

  #snapshotLevelState() {
    if (!this.levelPath || !this.level) return;
    const consumedObjects = new Set(
      (this.level.interactables ?? [])
        .filter((object) => object.consumed)
        .map((object) => this.#objectStateKey(object))
    );
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
    const killedObjects = new Set(
      (this.level.interactables ?? [])
        .filter((object) => object.killed)
        .map((object) => this.#objectStateKey(object))
    );
    const unlockedObjects = new Set(
      (this.level.interactables ?? [])
        .filter((object) => object.unlocked)
        .map((object) => this.#objectStateKey(object))
    );
    const openedObjects = new Set(
      (this.level.interactables ?? [])
        .filter((object) => object.opened)
        .map((object) => this.#objectStateKey(object))
    );
    const lootedObjects = new Set(
      (this.level.interactables ?? [])
        .filter((object) => object.looted)
        .map((object) => this.#objectStateKey(object))
    );
    const revealedObjects = new Set(
      (this.level.interactables ?? [])
        .filter((object) => object.revealed)
        .map((object) => this.#objectStateKey(object))
    );
    const searchedObjects = new Map(
      (this.level.interactables ?? [])
        .map((object) => [this.#objectStateKey(object), searchCompletedIds(object)])
        .filter(([, ids]) => ids.length > 0)
        .map(([key, ids]) => [key, new Set(ids)])
    );
    const groundItems = (this.groundItems ?? [])
      .map((item) => serializeGroundItem(item))
      .filter(Boolean);
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
      groundItems
    });
  }

  #restoreLevelState() {
    const state = this.levelStateByPath.get(this.levelPath);
    if (!state) return;

    for (const object of this.level.interactables ?? []) {
      const key = this.#objectStateKey(object);
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
      const key = this.#objectStateKey(object);
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
    this.clearedEncounters = new Set(state.clearedEncounters ?? []);
  }

  #refreshHiddenTiles({ rebuildStatic = false } = {}) {
    const next = this.#activeHiddenTiles();
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

  #activeHiddenTiles() {
    const hidden = new Set();
    for (const region of this.level?.hiddenRegions ?? []) {
      if (this.#isHiddenRegionRevealed(region)) continue;
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

  #isHiddenRegionRevealed(region) {
    const group = typeof region?.doorGroup === 'string' && region.doorGroup.trim() !== ''
      ? region.doorGroup
      : null;
    if (!group) return false;
    return (this.level?.interactables ?? []).some((object) =>
      objectGroupId(object) === group && object.opened
    );
  }

  #isCellHidden(x, y) {
    return this.hiddenTiles?.has?.(`${x},${y}`) ?? false;
  }

  #objectStateKey(object) {
    return `${object.kind}:${object.name ?? ''}:${object.x}:${object.y}`;
  }

  // ---- Render ------------------------------------------------------------

  render() {
    if (!this.ready) return;
    if (this.mode === 'intro') {
      this.renderer.renderBriefing({
        title: this.briefingTitle,
        page: this.briefing?.[this.briefingPage] ?? [],
        pageIndex: this.briefingPage,
        pageCount: this.briefing?.length ?? 0,
        nextPrompt: this.briefingNextPrompt,
        lastPrompt: this.briefingLastPrompt,
        skipPrompt: this.briefingSkipPrompt
      });
      return;
    }
    this.renderer.renderFrame({
      focus: { x: this.player.x, y: this.player.y, pxOffset: this.player.pxOffset },
      actors: this.actors,
      ambientSpeakers: this.speakingProps ?? [],
      groundItems: this.groundItems ?? [],
      hiddenTiles: this.hiddenTiles,
      effects: this.effects,
      anim: this.anim,
      overlay: this.#buildOverlay(),
      ui: this.#buildUi()
    });
  }

  #buildOverlay() {
    const overlay = { mode: this.mode === 'combat' ? 'COMBAT' : 'EXPLORE', debugGrid: this.debugGrid };

    if (this.mode === 'combat' && this.turnManager.isPlayerTurn() && !this.moving) {
      overlay.selectedTile = `${this.player.position.x},${this.player.position.y}`;
      const target = this.#currentTarget();
      if (target) overlay.targetTile = `${target.position.x},${target.position.y}`;
      const attack = this.player.getAttack(this.selectedAttackId);
      if (attack) {
        overlay.attackRange = new Set(
          this.#livingEnemies()
            .filter((enemy) => chebyshev(this.player.position, enemy.position) <= attack.range)
            .map((enemy) => `${enemy.position.x},${enemy.position.y}`)
        );
      }
      // Show the move path to the hovered tile + its AP cost instead of
      // flooding every reachable cell.
      const hover = this.#hoverCell();
      if (hover && !this.#isCellHidden(hover.x, hover.y) && this.grid.isWalkable(hover.x, hover.y) &&
          !(hover.x === this.player.position.x && hover.y === this.player.position.y)) {
        const path = findPath(this.grid, this.player.position, hover, this.#occupiedSet(this.player));
        const budget = Math.floor(this.player.ap / this.player.moveCost);
        if (path && path.length > 0) {
          overlay.pathCells = path.map((c) => `${c.x},${c.y}`);
          overlay.pathTile = `${hover.x},${hover.y}`;
          overlay.pathCost = path.length;
          overlay.pathAffordable = path.length <= budget;
        }
      }
    } else if (this.mode !== 'combat') {
      overlay.footTile = `${this.player.position.x},${this.player.position.y}`;
      const hover = this.#hoverTile();
      if (hover) overlay.hoverTile = hover;
    } else {
      const target = this.#currentTarget();
      if (target) overlay.targetTile = `${target.position.x},${target.position.y}`;
    }
    return overlay;
  }

  #hoverTile() {
    const cell = this.#hoverCell();
    if (!cell || this.#isCellHidden(cell.x, cell.y) || !this.grid.isWalkable(cell.x, cell.y)) return null;
    return `${cell.x},${cell.y}`;
  }

  #hoverCell() {
    const mouse = this.input.mouse;
    if (!mouse || mouse.y >= VIEWPORT_HEIGHT) return null;
    const cell = this.renderer.toGrid(mouse.x, mouse.y);
    return this.grid.isInside(cell.x, cell.y) ? cell : null;
  }

  #triggeredDialogueEnemy() {
    let best = null;
    let bestDist = Infinity;
    for (const enemy of [...(this.npcs ?? []), ...this.enemies]) {
      if (enemy.isDead || !enemy.dialogue || enemy.dialogueTriggerRadius == null) continue;
      if (this.#isCellHidden(enemy.position.x, enemy.position.y)) continue;
      if (enemy.dialogueSeen && !enemy.dialogueRepeat) continue;
      const encounterId = enemy.encounter ? this.#resolveEncounterId(enemy.encounter) : null;
      if (encounterId && this.clearedEncounters.has(encounterId)) continue;
      const dist = manhattan(this.player.position, enemy.position);
      if (dist > enemy.dialogueTriggerRadius || dist >= bestDist) continue;
      best = enemy;
      bestDist = dist;
    }
    return best;
  }

  #openEnemyDialogue(enemy) {
    if (!enemy?.dialogue) return;
    enemy.dialogueSeen = true;
    enemy.speech = null;
    this.pathQueue = [];
    this.pendingExploreTarget = null;
    this.#faceToward(this.player, enemy.position);
    this.#faceToward(enemy, this.player.position);
    this.#openDialogueById(enemy.dialogue);
  }

  #objectName(object) {
    if (!object) return 'Unknown';
    if (object.name) return object.name;
    return OBJECT_NAMES[object.kind] ?? String(object.kind ?? 'Object').replaceAll('-', ' ');
  }

  #cursorInfo() {
    const mouse = this.input.mouse;
    if (!mouse) return null;
    if (this.uiScreen === 'journal') {
      const arrow = journalArrowAt(mouse);
      const text = arrow === 'prev' ? 'PREV PAGE' : arrow === 'next' ? 'NEXT PAGE' : null;
      return { x: mouse.x, y: mouse.y, state: 'ui', text };
    }
    if (mouse.y >= VIEWPORT_HEIGHT) {
      return { x: mouse.x, y: mouse.y, state: 'ui', text: null };
    }

    const cell = this.#hoverCell();
    if (!cell) return { x: mouse.x, y: mouse.y, state: 'blocked', text: 'OUT OF BOUNDS' };

    const target = this.#interactionTargetAtCell(cell, this.mode);
    if (target.type === 'combatant') {
      return { x: mouse.x, y: mouse.y, state: 'attack', text: `ATTACK: ${target.actor.name}` };
    }
    if (target.type === 'talk') {
      return { x: mouse.x, y: mouse.y, state: 'talk', text: `TALK: ${target.actor.name}` };
    }
    if (target.type === 'corpse') {
      if (this.#enemyHasUnclaimedLoot(target.enemy)) {
        return { x: mouse.x, y: mouse.y, state: 'loot', text: `LOOT: ${target.enemy.name}` };
      }
      return { x: mouse.x, y: mouse.y, state: 'inspect', text: `INSPECT: ${target.enemy.name}` };
    }
    if (target.type === 'object') {
      return this.#objectCursorInfo(mouse, target.object);
    }

    if (target.type === 'move') {
      if (this.mode === 'combat' && this.turnManager.isPlayerTurn()) {
        const path = findPath(this.grid, this.player.position, cell, this.#occupiedSet(this.player));
        if (path && path.length > 0) {
          return { x: mouse.x, y: mouse.y, state: 'move', text: `MOVE: ${path.length} AP` };
        }
      }
      return { x: mouse.x, y: mouse.y, state: 'move', text: `MOVE: ${cell.x},${cell.y}` };
    }

    return { x: mouse.x, y: mouse.y, state: 'blocked', text: 'BLOCKED' };
  }

  #objectCursorInfo(mouse, object) {
    const name = this.#objectName(object);
    if (object.kind === GROUND_ITEM_KIND || object.interact?.type === 'ground-item') {
      return { x: mouse.x, y: mouse.y, state: 'loot', text: `PICK UP: ${name}` };
    }
    if (isObjectLocked(object)) {
      return { x: mouse.x, y: mouse.y, state: 'use', text: `LOCKED: ${name}` };
    }
    if (object.interact?.type === 'container') {
      return { x: mouse.x, y: mouse.y, state: 'loot', text: `LOOT: ${name}` };
    }
    if (object.interact?.type === 'corpse' && !object.looted && object.interact?.loot?.length) {
      return { x: mouse.x, y: mouse.y, state: 'loot', text: `LOOT: ${name}` };
    }
    if (object.interact?.type === 'altar' ||
        object.interact?.type === 'secret-entrance' ||
        object.interact?.type === 'secret-exit') {
      return { x: mouse.x, y: mouse.y, state: 'use', text: `USE: ${name}` };
    }
    if (object.kind === 'cross-martyr') {
      return { x: mouse.x, y: mouse.y, state: 'use', text: `APPROACH: ${name}` };
    }
    return { x: mouse.x, y: mouse.y, state: 'inspect', text: `INSPECT: ${name}` };
  }

  #buildUi() {
    const target = this.#currentTarget();
    const attack = this.player.getAttack(this.selectedAttackId);
    const modeLabel = { explore: 'EXPLORE', combat: 'COMBAT', victory: 'VICTORY', defeat: 'DEFEAT' }[this.mode];

    let controls;
    if (this.uiScreen === 'journal') {
      controls = this.journalSection === 2
        ? ['Up/Dn Select', 'A/D Turn Page', 'J/Esc Close']
        : ['A/D Turn Page', 'J/Esc Close'];
    } else if (this.uiScreen === 'inventory') {
      controls = ['Up/Dn Select', 'Left/Right Panel', '1/Enter Equip', '2 Remove', '3 Drop', 'H Dress', 'Esc Close'];
    } else if (this.uiScreen === 'dialogue' && this.dialogue?.choices?.length) {
      const choiceMax = Math.min(this.dialogue.choices.length, DIALOGUE_MAX_CHOICES);
      const choiceHelp = choiceMax === 1 ? '1 Choose' : `1 TO ${choiceMax} Choose`;
      controls = this.dialogue.mustChoose
        ? [choiceHelp, 'Enter First']
        : [choiceHelp, 'Enter First', 'Esc Close', 'I Pack'];
    } else if (this.uiScreen === 'dialogue') {
      controls = ['Enter Close', 'Esc Close', 'I Pack'];
    } else if (this.mode === 'combat') {
      controls = ['Click/WASD Move', '1 Knife 2 Gun', 'Tab Target', 'Space Attack', 'E End Turn', 'I Pack', 'H Dress'];
    } else {
      controls = ['Click Move/Use', 'WASD Move', 'I Pack', 'J Journal', 'H Dressing', 'R Restart', 'G Debug'];
    }

    const cursor = this.#cursorInfo();

    return {
      levelName: this.level.name,
      actorName: this.player.name,
      role: this.player.role ?? null,
      mode: modeLabel,
      hp: this.player.hp,
      maxHp: this.player.maxHp,
      ap: this.player.ap,
      maxAp: this.player.maxAp,
      action: attack ? attack.name : '-',
      target: target ? `${this.#shortName(target.name)} ${target.hp}/${target.maxHp}` : '-',
      inventory: this.inventory.summary(),
      inventoryItems: this.inventory.entries(),
      inventoryIndex: this.inventoryIndex ?? 0,
      inventoryFocus: this.inventoryFocus ?? 'items',
      figureSpriteId: this.player.spriteId,
      equipmentSlots: this.inventory.equipmentEntries(),
      equipmentIndex: this.equipmentIndex ?? 0,
      carryWeight: this.inventory.currentWeight(),
      maxCarryWeight: this.inventory.maxCarryWeight,
      areaTitle: this.areaTitleTimer > 0
        ? { text: this.areaTitle, ttl: this.areaTitleTimer, duration: AREA_TITLE_DURATION }
        : null,
      screen: this.uiScreen,
      journal: this.uiScreen === 'journal' ? this.#buildJournal() : null,
      dialogue: this.dialogue,
      hoverText: cursor?.text ?? null,
      cursor,
      log: this.log,
      controls
    };
  }
}
