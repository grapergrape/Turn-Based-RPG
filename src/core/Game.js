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
import { mapLoadingProgress, normalizeLoadingState } from './LoadingProgress.js';
import { loadLevel, randomPatrolDelay } from './LevelLoader.js';
import { buildContextActionsForTarget } from './ContextActions.js';
import {
  PRIMARY_ASSIGNMENT_FLAG,
  applyCustomizationText,
  changeCustomizationOption,
  changePrimaryAssignmentValue,
  createCustomizationState,
  createPrimaryAssignmentState,
  currentCustomizationRows,
  customizationCanConfirm,
  customizationResult,
  moveCustomizationSelection,
  movePrimaryAssignmentSelection,
  primaryAssignmentCanConfirm,
  primaryAssignmentResult,
  primaryAssignmentRows
} from './CharacterCreation.js';
import {
  FIELD_RATINGS,
  PRIMARY_ATTRIBUTES,
  awardExperience,
  calculateFieldRating,
  experienceRewardForEncounter,
  normalizeProgression,
  questStageExperience,
  questStageExperienceKey,
  spendPrimaryPoint
} from './Progression.js';
import { learnTechnique, techniqueList } from './TechniqueSystem.js';
import { meetsDialogueConditions } from './DialogueConditions.js';
import { DialogueEffects } from './DialogueEffects.js';
import {
  JOURNAL_SECTIONS,
  JOURNAL_TURN_DURATION,
  buildJournalState,
  journalConditionMet
} from './JournalState.js';
import { LootSession, enemyHasLoot, enemyHasUnclaimedLoot } from './LootSession.js';
import { TradeSession } from './TradeSession.js';
import { TurnManager } from '../combat/TurnManager.js';
import { CombatSystem, manhattan, chebyshev } from '../combat/CombatSystem.js';
import { chooseCombatStartBark, combatStartBarkLines } from '../combat/CombatBarks.js';
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
import {
  SUSPICION_SEVERITY,
  SUSPICION_STATES,
  canSeeActor,
  suspicionStateRank,
} from '../world/PerceptionSystem.js';
import { PatrolSystem } from '../world/PatrolSystem.js';
import { StealthRuntime } from '../world/StealthRuntime.js';
import { IsometricRenderer } from '../render/IsometricRenderer.js';
import { bakeHumanAppearance, bakePlayerCharacter, isHumanAppearance, spriteIdForHumanAppearance } from '../render/SpriteAtlas.js';
import { gridToScreen, screenFacing } from '../render/isoMath.js';
import { DEBUG_GRID_DEFAULT, VIEWPORT_HEIGHT } from '../render/renderConfig.js';
import { DIALOGUE_MAX_CHOICES, buildDialogueLayout } from '../ui/dialogueLayout.js';
import {
  inventoryActionAt,
  inventoryGearBox,
  inventoryGearAt,
  inventorySlotAt,
  inventorySlotBox,
  inventorySplitActionAt,
  inventorySplitAmountAt
} from '../ui/inventoryLayout.js';
import { contextActionAt } from '../ui/contextActionLayout.js';
import { journalArrowAt } from '../ui/journalLayout.js';
import {
  tradeActionAt,
  tradePlayerIndexAt,
  tradeTraderIndexAt
} from '../ui/tradeLayout.js';

const STEP_DURATION = 0.64;
const SNEAK_STEP_DURATION = 0.92;
const SPRINT_STEP_DURATION = 0.38;
const SNEAK_ATTACK_MULTIPLIER = 1.5;
const SNEAK_SPEECH_LIFE = 1.8;
const ENEMY_ACTION_DELAY = 0.2;
const EFFECT_LIFE = 0.45;
const ATTACK_ANIM = 0.5;
const HIT_ANIM = 0.24;
const TRIGGER_RADIUS = 2;
const AMBIENT_SPEECH_LIFE = 2.7;
const AGGRO_SPEECH_LIFE = 2.35;
const AMBIENT_SPEECH_COOLDOWN = 7.5;
const AMBIENT_ACTOR_DELAY = 18;
const AMBIENT_PROP_DELAY = 12;
const AREA_TITLE_DURATION = 2.35;
const MAX_LOG = 8;
const WALK_FRAMES = 8;
const ATTACK_FRAMES = 6;
const HIT_FRAMES = 4;
const DEATH_FRAMES = 10;
const PLAYER_CUSTOM_PREVIEW_SPRITE_ID = 'player-custom-preview';

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
    this.lootSession = new LootSession(this, {
      log: (message) => this.#log(message),
      logCarryFailure: (carry) => this.#logCarryFailure(carry),
      objectName: (object) => this.#objectName(object),
      openDialogueById: (dialogueId) => this.#openDialogueById(dialogueId),
      openDialogue: (title, lines, kind) => this.#openDialogue(title, lines, kind),
      applyQuestUpdate: (update) => this.#applyQuestUpdate(update),
      registerSuspiciousAction: (severity, action, options) => this.#registerSuspiciousAction(severity, action, options),
      syncInventoryOrder: () => this.#syncInventoryOrder()
    });
    this.tradeSession = new TradeSession(this, {
      inventoryEntries: () => this.#inventoryEntries(),
      log: (message) => this.#log(message),
      logCarryFailure: (carry) => this.#logCarryFailure(carry),
      syncInventoryOrder: () => this.#syncInventoryOrder()
    });
    this.dialogueEffects = new DialogueEffects(this, {
      log: (message) => this.#log(message),
      applyQuestUpdate: (update) => this.#applyQuestUpdate(update),
      awardPlayerExperience: (amount) => this.#awardPlayerExperience(amount),
      silenceProp: (propId) => this.#silenceProp(propId),
      teleportPlayer: (point) => this.#teleportPlayer(point),
      openTradeScreen: (targetId) => this.#openTradeScreen(targetId),
      closeUiScreen: () => this.#closeUiScreen(),
      startCombat: (encounterId, options) => this.#startCombat(encounterId, options),
      transitionLevel: (effect) => this.#transitionLevel(effect),
      meetsConditions: (conditions) => this.#meetsConditions(conditions),
      syncInventoryOrder: () => this.#syncInventoryOrder(),
      clampInventorySelection: () => this.#clampInventorySelection()
    });
    this.stealthRuntime = new StealthRuntime(this, {
      resolveEncounterId: (encounterId) => this.#resolveEncounterId(encounterId),
      isCellHidden: (x, y) => this.#isCellHidden(x, y),
      fieldRating: (fieldId) => this.#fieldRating(fieldId),
      enemyPerceptionRating: (enemy, perception) => this.#enemyPerceptionRating(enemy, perception),
      faceToward: (actor, target) => this.#faceToward(actor, target),
      log: (message) => this.#log(message),
      closeUiScreen: () => this.#closeUiScreen(),
      startCombat: (encounterId) => this.#startCombat(encounterId)
    });
    this.patrolSystem = new PatrolSystem(this, {
      applyEffects: (effects) => this.#applyEffects(effects),
      removeActorFromLevel: (actor) => this.#removeActorFromLevel(actor),
      isCellHidden: (x, y) => this.#isCellHidden(x, y),
      occupiedSet: (exclude) => this.#occupiedSet(exclude),
      tryStep: (actor, dir, options) => this.#tryStep(actor, dir, options),
      randomPatrolDelay
    });

    this.debugGridDefault = debugGrid ?? DEBUG_GRID_DEFAULT;
    this.debugGrid = this.debugGridDefault;
    this.introSeen = false; // the opening writ shows once per session, not on R
    this.levelStateByPath = new Map();
    this.loop = new GameLoop({
      update: (dt) => this.update(dt),
      render: () => this.render()
    });
    this.ready = false;
    this.loadingState = null;
    this.areaTitle = null;
    this.areaTitleTimer = 0;
    this.pendingExploreTarget = null;
    this.preCombatTarget = null;
    this.dialogueActor = null;
    this.pendingLootAfterDialogue = null;
    this.characterCreation = null;
    this.primaryAssignment = null;
    this.briefingAfter = null;
    this.pendingPrimaryAssignmentTransition = null;
  }

  // (Re)load the level and reset runtime state. Level transitions preserve the
  // run state; restarts intentionally start clean.
  async boot(options = {}) {
    const bootOptions = this.#bootOptions(options);
    this.ready = false;
    this.#renderLoading(0.03, 'Preparing field load');
    await this.#loadingFrame();
    if (!bootOptions.preserveRun) {
      this.levelStateByPath = new Map();
      this.debugGrid = this.debugGridDefault;
    }

    const previousInventory = bootOptions.preserveRun ? this.inventory : null;
    const previousInventoryOrder = bootOptions.preserveRun && Array.isArray(this.inventoryOrder)
      ? [...this.inventoryOrder]
      : [];
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
          name: this.player.name,
          appearance: this.player.appearance ? JSON.parse(JSON.stringify(this.player.appearance)) : null,
          hp: this.player.hp,
          maxHp: this.player.maxHp,
          progression: this.player.progression ? JSON.parse(JSON.stringify(this.player.progression)) : null
        }
      : null;
    const previousGroundItemSeq = bootOptions.preserveRun ? this.groundItemSeq ?? 0 : 0;

    const level = await loadLevel(this.levelPath, {
      onProgress: (state) => this.#renderLoading({
        ...state,
        progress: mapLoadingProgress(state.progress, 0.12, 0.68)
      })
    });
    this.#renderLoading(0.7, 'Restoring run state');
    await this.#loadingFrame();
    this.level = level;
    this.grid = level.grid;
    this.player = level.player;
    if (previousPlayer?.name) this.player.name = previousPlayer.name;
    if (previousPlayer?.appearance) this.player.appearance = JSON.parse(JSON.stringify(previousPlayer.appearance));
    if (previousPlayer?.progression) {
      this.player.progression = JSON.parse(JSON.stringify(previousPlayer.progression));
      if (typeof this.player.refreshProgressionStats === 'function') this.player.refreshProgressionStats();
    }
    this.flags = previousFlags ?? new Set();
    this.enemies = level.enemies;
    if (bootOptions.noCombat) this.enemies = [];
    this.npcs = (level.npcs ?? []).filter((npc) => this.#meetsConditions(npc.conditions));
    this.#refreshActorAppearances([...this.enemies, ...this.npcs]);
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
    this.#syncInventoryOrder();
    // Bake the player sprite to match the loaded equipment so the world figure
    // and inventory paper doll reflect the customized actor.
    this.#renderLoading(0.78, 'Baking player model');
    this.#refreshPlayerAppearance();
    await this.#loadingFrame();
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
    this.techniqueDefs = level.techniqueDefs ?? {};
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
    this.sneakMode = false;
    this.uiScreen = null;
    this.characterCreation = null;
    this.primaryAssignment = null;
    this.briefingAfter = null;
    this.pendingPrimaryAssignmentTransition = null;
    this.journalSection = 0;
    this.journalFactionIndex = 0;
    this.journalPrimaryIndex = 0;
    this.journalTechniqueIndex = 0;
    this.journalTurn = null;
    this.inventoryFocus = 'items';
    this.inventoryIndex = 0;
    this.equipmentIndex = 0;
    this.inventoryOrder = previousInventoryOrder;
    this.inventoryMoveIndex = null;
    this.inventoryActionMenu = null;
    this.contextActionMenu = null;
    this.inventorySplit = null;
    this.loot = null;
    this.lootIndex = 0;
    this.pendingLootAfterDialogue = null;
    this.trade = null;
    this.tradeFocus = 'trader';
    this.tradeStockIndex = 0;
    this.tradePlayerIndex = 0;
    this.dialogue = null;
    this.dialogueActor = null;
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
    this.preCombatTarget = null;
    this.enemyActions = null;
    this.enemyActor = null;
    this.actionTimer = 0;

    this.#restoreLevelState();
    if (bootOptions.player) this.#teleportPlayer(bootOptions.player);
    this.#refreshHiddenTiles();
    this.#renderLoading(0.88, 'Baking field view');
    await this.#loadingFrame();
    this.renderer.rebuildStaticScene({
      grid: this.grid,
      props: this.level.props,
      mood: this.level.mood,
      hiddenTiles: this.hiddenTiles
    });
    this.#renderLoading(0.96, 'Entering field');
    await this.#loadingFrame();

    this.areaTitle = level.name;
    this.areaTitleTimer = AREA_TITLE_DURATION;
    this.#log(level.intro || level.name);
    this.#startQuests(previousQuestStages, previousQuestReached);
    this.#log('C crouches. Hold Shift while moving to sprint.');
    this.#log('I pack, J journal, H bind wounds.');
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
      this.briefingAfter = { openScreen: 'character-customization' };
    }
    this.#renderLoading(1, 'Load complete');
    this.ready = true;
    this.loadingState = null;
    if (this.statusElement) this.statusElement.textContent = '';
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

  #renderLoading(progressOrState, message = '', detail = '') {
    const state = typeof progressOrState === 'object' && progressOrState !== null
      ? normalizeLoadingState(progressOrState)
      : normalizeLoadingState({ progress: progressOrState, message, detail });
    this.loadingState = state;
    this.renderer.renderLoading(state);
  }

  async #loadingFrame() {
    if (typeof window === 'undefined' || typeof window.requestAnimationFrame !== 'function') return;
    await new Promise((resolve) => window.requestAnimationFrame(() => resolve()));
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
    const textInput = typeof this.input.consumeText === 'function' ? this.input.consumeText() : [];

    if (this.mode === 'intro') {
      this.#handleIntro(actions, click);
      return;
    }

    if (this.uiScreen) {
      this.#handleUiScreen(actions, click, textInput);
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
    if (!this.moving) {
      this.#stepAlongPath();
      if (!this.moving) this.#advanceExplorePatrols(dt);
    }
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
      if (this.#isConfirmAction(action) || action === 'interact' || action === 'down') {
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
    const after = this.briefingAfter;
    if (this.briefingMarksIntro) this.introSeen = true;
    this.briefing = null;
    this.briefingTitle = null;
    this.briefingPage = 0;
    this.briefingNextPrompt = null;
    this.briefingLastPrompt = null;
    this.briefingSkipPrompt = null;
    this.briefingMarksIntro = false;
    this.briefingAfter = null;
    if (this.#runPostBriefingAction(after)) return;
    this.mode = 'explore';
  }

  #runPostBriefingAction(action) {
    if (!action) return false;
    const normalized = typeof action === 'string' ? { openScreen: action } : action;
    const screen = normalized.openScreen ?? normalized.screen ?? normalized.type;
    const loadLevel = normalized.loadLevel ?? normalized.thenLoadLevel ?? null;

    if (screen === 'character-customization') {
      this.#openCharacterCustomization();
      return true;
    }
    if (screen === 'primary-assignment') {
      this.pendingPrimaryAssignmentTransition = loadLevel ? JSON.parse(JSON.stringify(loadLevel)) : null;
      this.#openPrimaryAssignment();
      return true;
    }
    if (loadLevel) {
      void this.#transitionLevel(loadLevel);
      return true;
    }
    return false;
  }

  #openCharacterCustomization() {
    this.mode = 'explore';
    this.uiScreen = 'character-customization';
    this.contextActionMenu = null;
    this.characterCreation = createCustomizationState(this.player);
    this.#refreshCharacterPreview();
  }

  #openPrimaryAssignment() {
    this.mode = 'explore';
    if (this.flags?.has(PRIMARY_ASSIGNMENT_FLAG)) {
      const transition = this.pendingPrimaryAssignmentTransition;
      this.pendingPrimaryAssignmentTransition = null;
      if (transition) void this.#transitionLevel(transition);
      return;
    }
    this.uiScreen = 'primary-assignment';
    this.contextActionMenu = null;
    this.primaryAssignment = createPrimaryAssignmentState(this.player);
  }

  #refreshCharacterPreview() {
    if (!this.atlas || !this.characterCreation) return;
    const equipment = this.inventory?.equipmentSnapshot?.() ?? {};
    const bareHeadEquipment = { ...equipment, helmet: null };
    this.atlas[PLAYER_CUSTOM_PREVIEW_SPRITE_ID] = bakePlayerCharacter(
      bareHeadEquipment,
      this.inventory?.itemDefs ?? {},
      this.characterCreation.appearance
    );
  }

  #drainBlockingInput() {
    // Still honour persistent toggles and restart/debug while animating.
    if (typeof this.input.consumeText === 'function') this.input.consumeText();
    for (const action of this.input.consume()) {
      if (action === 'restart') this.boot();
      else if (action === 'debug') this.debugGrid = !this.debugGrid;
      else if (action === 'toggle-sneak') this.#toggleSneakMode();
    }
  }

  // ---- Explore mode ------------------------------------------------------

  #handleExplore(actions, click) {
    if (click) this.#handleExploreClick(click);
    for (const action of actions) {
      const movement = this.#movementAction(action);
      if (movement) {
        this.pendingExploreTarget = null;
        this.pathQueue = []; // manual step overrides any click path
        this.#tryStep(this.player, movement.dir, {
          logBlock: true,
          moveState: this.#currentPlayerMoveState()
        });
        return; // one step per update; trigger check runs on completion
      }
      switch (action) {
        case 'toggle-sneak':
          this.#toggleSneakMode();
          break;
        case 'melee':
        case 'sidearm':
          this.#selectAttack(action);
          break;
        case 'confirm':
        case 'space':
          if (this.#currentPreCombatTarget()) {
            this.#attackPreCombatTarget();
            return;
          }
          break;
        case 'cancel':
          this.preCombatTarget = null;
          break;
        case 'inventory':
          this.#toggleInventory();
          break;
        case 'journal':
          this.#toggleJournal();
          break;
        case 'dressing':
          this.#log(this.inventory.useFieldDressing(this.player));
          this.#syncInventoryOrder();
          this.#clampInventorySelection();
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
    if (click.y >= VIEWPORT_HEIGHT) return;
    if (click.button === 2) {
      this.#handlePreCombatTargetClick(click);
      return;
    }
    if (click.button !== 0) return;

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

    const sortAfterLoot = Boolean(click.shiftKey);
    if (isTargetInReach(this.player, target)) {
      this.#executeExploreTarget(target, { sortAfterLoot });
      return;
    }

    const path = this.#pathToExploreTarget(target);
    this.pendingExploreTarget = path && path.length ? { ...target, sortAfterLoot } : null;
    this.pathQueue = path && path.length ? path : [];
  }

  #handlePreCombatTargetClick(click) {
    const cell = this.renderer.toGrid(click.x, click.y);
    if (!this.grid.isInside(cell.x, cell.y)) return;
    const enemy = this.#livingEnemyAtCell(cell);
    if (!enemy) {
      this.preCombatTarget = null;
      return;
    }
    this.#selectPreCombatTarget(enemy);
  }

  #selectPreCombatTarget(enemy) {
    if (!enemy || enemy.isDead) return;
    this.preCombatTarget = enemy;
    const idx = this.#livingEnemies().indexOf(enemy);
    if (idx >= 0) this.targetIndex = idx;
    this.pendingExploreTarget = null;
    this.pathQueue = [];
    this.#faceToward(this.player, enemy.position);
    this.#log(`Target: ${enemy.name}.`);
  }

  #currentPreCombatTarget() {
    const target = this.preCombatTarget;
    if (!target) return null;
    if (!this.enemies.includes(target) || target.isDead || this.#isCellHidden(target.position.x, target.position.y)) {
      this.preCombatTarget = null;
      return null;
    }
    return target;
  }

  #attackPreCombatTarget() {
    const target = this.#currentPreCombatTarget();
    if (!target) return;
    const attack = this.player.getAttack(this.selectedAttackId) ?? this.player.attacks[0] ?? null;
    if (!attack) return;
    this.selectedAttackId = attack.id;
    if (chebyshev(this.player.position, target.position) > attack.range) {
      this.#log('Target is out of range.');
      return;
    }

    const sneakAttack = this.#canOpenWithSneakAttack(target, attack);
    this.#startCombat(target.encounter, { initialTarget: target, selectedAttackId: attack.id });
    if (this.mode !== 'combat') return;
    this.#registerSuspiciousAction(SUSPICION_SEVERITY.HIGH, 'attack', { requireSight: true });
    this.#playerAttack({ sneakAttack, ignoreApCost: true, spendAp: false });
    if (this.mode === 'combat' && this.turnManager.isPlayerTurn()) {
      this.#endPlayerTurn();
    }
  }

  #canOpenWithSneakAttack(target, attack) {
    if (!this.sneakMode || !target || !attack || attack.range > 1) return false;
    if (target.isDead || chebyshev(this.player.position, target.position) > 1) return false;
    if (suspicionStateRank(target.suspicionState ?? SUSPICION_STATES.CALM) >= suspicionStateRank(SUSPICION_STATES.ALERTED)) {
      return false;
    }
    return !canSeeActor(target, this.player, {
      grid: this.grid,
      hiddenTiles: this.hiddenTiles,
      defaults: this.stealthRuntime.perceptionDefaults()
    }).canSee;
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
      this.#executeExploreTarget(target, { sortAfterLoot: target.sortAfterLoot });
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

  #executeExploreTarget(target, options = {}) {
    this.pendingExploreTarget = null;
    this.pathQueue = [];
    const beforeInventory = options.sortAfterLoot ? this.#inventoryFingerprint() : null;
    const finish = () => {
      if (beforeInventory !== null && this.#inventoryFingerprint() !== beforeInventory) {
        this.#sortInventory();
      }
    };
    if (target.type === 'talk') {
      this.#openEnemyDialogue(target.actor);
      finish();
      return;
    }
    if (target.type === 'corpse') {
      this.#interactWithCorpse(target.enemy);
      finish();
      return;
    }
    if (target.type === 'object') {
      this.#interactWithObject(target.object);
      finish();
    }
  }

  #enemyHasLoot(enemy) {
    return enemyHasLoot(enemy);
  }

  #enemyHasUnclaimedLoot(enemy) {
    return enemyHasUnclaimedLoot(enemy);
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
    if (this.#lootSourceHasItems({ sourceType: 'enemy', source: enemy })) {
      this.#registerSuspiciousAction(SUSPICION_SEVERITY.LOW, 'looting');
      if (this.mode !== 'explore') return;
      this.#openLootScreen({ title: enemy.name, sourceType: 'enemy', source: enemy });
      return;
    }

    if (enemy.inspect) {
      this.#openDialogueById(enemy.inspect);
    } else if (this.#enemyHasLoot(enemy) && enemy.lootClaimed) {
      this.#openDialogue(enemy.name, ['Nothing useful remains.'], 'corpse');
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
    if (this.#objectShouldShowTextBeforeLoot(object)) {
      if (this.#openObjectTextBeforeLoot(object)) return;
    }
    if (this.#objectShouldOpenLoot(object)) {
      this.#openObjectLootScreen(object);
      return;
    }

    const result = this.interactions.interact(object, this.inventory);
    this.#syncInventoryOrder();
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
    this.#syncInventoryOrder();
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
    this.#syncInventoryOrder();
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

  #handleUiScreen(actions, click, textInput = []) {
    if (this.uiScreen === 'character-customization') {
      this.#handleCharacterCustomizationScreen(actions, textInput);
      return;
    }
    if (this.uiScreen === 'primary-assignment') {
      this.#handlePrimaryAssignmentScreen(actions);
      return;
    }
    if (this.uiScreen === 'journal') {
      this.#handleJournalScreen(actions, click);
      return;
    }
    if (this.uiScreen === 'dialogue') {
      if (click) return;
      this.#handleDialogueScreen(actions);
      return;
    }
    if (this.uiScreen === 'loot') {
      this.#handleLootScreen(actions, click);
      return;
    }
    if (this.uiScreen === 'trade') {
      this.#handleTradeScreen(actions, click);
      return;
    }
    if (this.uiScreen === 'inventory') {
      this.#handleInventoryScreen(actions, click);
      return;
    }
    if (click) return;
    for (const action of actions) {
      if (action === 'cancel' || this.#isConfirmAction(action) || action === 'interact') {
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
        this.#syncInventoryOrder();
        this.#clampInventorySelection();
        return;
      }
      if (action === 'restart') {
        this.boot();
        return;
      }
      if (action === 'debug') this.debugGrid = !this.debugGrid;
    }
  }

  #handleCharacterCustomizationScreen(actions, textInput = []) {
    if (!this.characterCreation) this.characterCreation = createCustomizationState(this.player);
    const selected = this.characterCreation.selectedIndex ?? 0;
    const selectedField = currentCustomizationRows(this.characterCreation)[selected];
    if (selectedField?.kind === 'name' && textInput.length > 0) {
      this.characterCreation = applyCustomizationText(this.characterCreation, textInput);
      this.#refreshCharacterPreview();
      return;
    }

    for (const action of actions) {
      if (action === 'up') {
        this.characterCreation = moveCustomizationSelection(this.characterCreation, -1);
        continue;
      }
      if (action === 'down') {
        this.characterCreation = moveCustomizationSelection(this.characterCreation, 1);
        continue;
      }
      if (action === 'left' || action === 'right') {
        this.characterCreation = changeCustomizationOption(this.characterCreation, action === 'right' ? 1 : -1);
        this.#refreshCharacterPreview();
        continue;
      }
      if (this.#isConfirmAction(action) || action === 'interact') {
        if (!customizationCanConfirm(this.characterCreation)) continue;
        const result = customizationResult(this.characterCreation);
        this.player.name = result.name;
        this.player.appearance = result.appearance;
        this.#refreshPlayerAppearance();
        this.characterCreation = null;
        this.uiScreen = null;
        this.mode = 'explore';
        continue;
      }
      if (action === 'restart') {
        this.boot();
        return;
      }
      if (action === 'debug') this.debugGrid = !this.debugGrid;
    }
  }

  #handlePrimaryAssignmentScreen(actions) {
    if (!this.primaryAssignment) this.primaryAssignment = createPrimaryAssignmentState(this.player);
    for (const action of actions) {
      if (action === 'up') {
        this.primaryAssignment = movePrimaryAssignmentSelection(this.primaryAssignment, -1);
        continue;
      }
      if (action === 'down') {
        this.primaryAssignment = movePrimaryAssignmentSelection(this.primaryAssignment, 1);
        continue;
      }
      if (action === 'left' || action === 'right') {
        this.primaryAssignment = changePrimaryAssignmentValue(this.primaryAssignment, action === 'right' ? 1 : -1);
        continue;
      }
      if (this.#isConfirmAction(action) || action === 'interact') {
        if (!primaryAssignmentCanConfirm(this.primaryAssignment)) continue;
        this.#confirmPrimaryAssignment();
        return;
      }
      if (action === 'restart') {
        this.boot();
        return;
      }
      if (action === 'debug') this.debugGrid = !this.debugGrid;
    }
  }

  #confirmPrimaryAssignment() {
    const values = primaryAssignmentResult(this.primaryAssignment);
    const progression = normalizeProgression(this.player?.progression);
    this.player.progression = {
      ...this.player.progression,
      level: progression.level,
      xp: progression.xp,
      build: progression.build.id,
      primaryPoints: progression.primaryPoints,
      activeTechniquePoints: progression.activeTechniquePoints,
      passiveTechniquePoints: progression.passiveTechniquePoints,
      techniques: [...progression.techniques],
      basePrimaries: { ...values },
      primaries: { ...values },
      primaryBonuses: {},
      trace: progression.trace,
      iconRisk: progression.iconRisk,
      scarPoints: progression.scarPoints,
      scars: progression.scars,
      fieldModifiers: progression.fieldModifiers
    };
    if (typeof this.player.refreshProgressionStats === 'function') this.player.refreshProgressionStats();
    this.flags.add(PRIMARY_ASSIGNMENT_FLAG);
    this.primaryAssignment = null;
    this.uiScreen = null;
    const transition = this.pendingPrimaryAssignmentTransition;
    this.pendingPrimaryAssignmentTransition = null;
    if (transition) {
      void this.#transitionLevel(transition);
      return;
    }
    this.mode = 'explore';
  }

  #toggleInventory() {
    if (this.uiScreen === 'inventory') {
      this.#closeUiScreen();
      return;
    }
    this.uiScreen = 'inventory';
    this.dialogue = null;
    this.dialogueActor = null;
    this.pendingLootAfterDialogue = null;
    this.contextActionMenu = null;
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
    this.journalPrimaryIndex = 0;
    this.journalTechniqueIndex = 0;
    this.journalTurn = null;
    this.dialogue = null;
    this.dialogueActor = null;
    this.pendingLootAfterDialogue = null;
    this.contextActionMenu = null;
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
      else if (action === 'up') this.#moveJournalSelection(-1);
      else if (action === 'down') this.#moveJournalSelection(1);
      else if (action === 'confirm') this.#confirmJournalSelection();
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
    const known = (this.codexDefs ?? []).filter((entry) =>
      !entry.unlockedBy || journalConditionMet(entry.unlockedBy, {
        flags: this.flags,
        questReached: this.questReached
      })
    );
    if (!known.length) { this.journalFactionIndex = 0; return; }
    this.journalFactionIndex = Math.max(0, Math.min(known.length - 1, (this.journalFactionIndex ?? 0) + delta));
  }

  #moveJournalSelection(delta) {
    if (this.journalSection === 2) this.#moveJournalFaction(delta);
    else if (this.journalSection === 3) this.#moveJournalPrimary(delta);
    else if (this.journalSection === 5) this.#moveJournalTechnique(delta);
  }

  #moveJournalPrimary(delta) {
    const count = PRIMARY_ATTRIBUTES.length;
    this.journalPrimaryIndex = Math.max(0, Math.min(count - 1, (this.journalPrimaryIndex ?? 0) + delta));
  }

  #moveJournalTechnique(delta) {
    const count = techniqueList(this.techniqueDefs).length;
    if (count <= 0) { this.journalTechniqueIndex = 0; return; }
    this.journalTechniqueIndex = Math.max(0, Math.min(count - 1, (this.journalTechniqueIndex ?? 0) + delta));
  }

  #confirmJournalSelection() {
    if (this.journalSection === 3) this.#spendSelectedPrimary();
    else if (this.journalSection === 5) this.#learnSelectedTechnique();
  }

  #spendSelectedPrimary() {
    const primary = PRIMARY_ATTRIBUTES[this.journalPrimaryIndex ?? 0];
    if (!primary) return;
    const result = spendPrimaryPoint(this.player?.progression, primary.id);
    if (!result.ok) {
      if (result.reason) this.#log(result.reason);
      return;
    }
    this.player.progression = result.progression;
    if (typeof this.player.refreshProgressionStats === 'function') this.player.refreshProgressionStats();
    this.#log(`${primary.label} improved.`);
  }

  #learnSelectedTechnique() {
    const technique = techniqueList(this.techniqueDefs)[this.journalTechniqueIndex ?? 0];
    if (!technique) return;
    const result = learnTechnique(this.player?.progression, technique.id, this.techniqueDefs, this.#techniqueContext());
    if (!result.ok) {
      if (result.reason) this.#log(result.reason);
      return;
    }
    this.player.progression = result.progression;
    if (typeof this.player.refreshProgressionStats === 'function') this.player.refreshProgressionStats();
    this.#log(`${technique.name} learned.`);
  }

  #handleLootScreen(actions, click = null) {
    if (click) return;
    const entries = this.#currentLootEntries();
    if (!entries.length) {
      this.#finalizeLootIfEmpty();
      return;
    }
    this.lootIndex = Math.max(0, Math.min(entries.length - 1, this.lootIndex ?? 0));

    for (const action of actions) {
      if (action === 'cancel' || action === 'space') {
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
      if (action === 'up' || action === 'down') {
        this.lootIndex = Math.max(0, Math.min(entries.length - 1, this.lootIndex + (action === 'down' ? 1 : -1)));
        continue;
      }
      if (action === 'left') {
        this.#takeAllLoot();
        return;
      }
      if (action === 'interact') {
        this.#takeMarkedLoot();
        return;
      }
    }
  }

  #objectShouldOpenLoot(object) {
    return this.lootSession.objectShouldOpen(object);
  }

  #objectShouldShowTextBeforeLoot(object) {
    return this.lootSession.objectShouldShowTextBeforeLoot(object);
  }

  #openObjectTextBeforeLoot(object) {
    return this.lootSession.openObjectTextBeforeLoot(object);
  }

  #openObjectLootScreen(object, { log = true } = {}) {
    this.lootSession.openObjectLootScreen(object, { log });
  }

  #openLootScreen({ title, sourceType, source }) {
    this.lootSession.open({ title, sourceType, source });
  }

  #lootSourceHasItems(loot) {
    return this.lootSession.sourceHasItems(loot);
  }

  #currentLootEntries() {
    return this.lootSession.currentEntries();
  }

  #takeMarkedLoot() {
    this.lootSession.takeMarked();
  }

  #takeAllLoot() {
    this.lootSession.takeAll();
  }

  #finalizeLootIfEmpty() {
    return this.lootSession.finalizeIfEmpty();
  }

  #handleTradeScreen(actions, click = null) {
    this.#syncInventoryOrder();
    this.#clampTradeSelection();

    if (click) {
      const action = tradeActionAt(click);
      if (action === 'close') {
        this.#closeUiScreen();
        return;
      }
      if (action === 'buy') {
        this.tradeFocus = 'trader';
        this.#buySelectedTradeItem();
        return;
      }

      const stockIndex = tradeTraderIndexAt(click, this.#tradeStockEntries().length);
      if (stockIndex !== null) {
        this.tradeFocus = 'trader';
        this.tradeStockIndex = stockIndex;
        this.#clampTradeSelection();
        return;
      }

      const playerIndex = tradePlayerIndexAt(click, this.#tradePlayerEntries().length);
      if (playerIndex !== null) {
        this.tradeFocus = 'player';
        this.tradePlayerIndex = playerIndex;
        this.#clampTradeSelection();
      }
      return;
    }

    for (const action of actions) {
      if (action === 'cancel') {
        this.#closeUiScreen();
        return;
      }
      if (action === 'inventory') {
        this.#closeUiScreen();
        this.#toggleInventory();
        return;
      }
      if (action === 'journal') {
        this.#closeUiScreen();
        this.#toggleJournal();
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
      if (action === 'left' || action === 'right' || action === 'cycle') {
        this.tradeFocus = this.tradeFocus === 'player' ? 'trader' : 'player';
        this.#clampTradeSelection();
        continue;
      }
      if (action === 'up' || action === 'down') {
        this.#moveTradeSelection(action === 'down' ? 1 : -1);
        continue;
      }
      if (action === 'interact' || this.#isConfirmAction(action)) {
        if (this.tradeFocus === 'player') {
          this.tradeFocus = 'trader';
          this.#clampTradeSelection();
          continue;
        }
        this.#buySelectedTradeItem();
      }
    }
  }

  #openTradeScreen(targetId) {
    return this.tradeSession.open(targetId);
  }

  #tradeStockEntries() {
    return this.tradeSession.stockEntries();
  }

  #tradePlayerEntries() {
    return this.tradeSession.playerEntries();
  }

  #clampTradeSelection() {
    this.tradeSession.clampSelection();
  }

  #moveTradeSelection(delta) {
    this.tradeSession.moveSelection(delta);
  }

  #buySelectedTradeItem() {
    return this.tradeSession.buySelectedItem();
  }

  #buildTradeUi() {
    return this.tradeSession.buildUi();
  }

  #handleInventoryScreen(actions, click = null) {
    this.#syncInventoryOrder();
    this.#clampInventorySelection();
    if (this.inventorySplit) {
      this.#handleInventorySplit(actions, click);
      return;
    }
    if (click) {
      this.#handleInventoryClick(click);
      return;
    }
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
        this.#syncInventoryOrder();
        this.#clampInventorySelection();
        continue;
      }
      if (action === 'left' || action === 'right' || action === 'cycle') {
        this.inventoryFocus = this.inventoryFocus === 'gear' ? 'items' : 'gear';
        this.inventoryMoveIndex = null;
        this.#clampInventorySelection();
        continue;
      }
      if (action === 'up' || action === 'down') {
        this.inventoryMoveIndex = null;
        this.#moveInventorySelection(action === 'down' ? 1 : -1);
        continue;
      }
      if (action === 'melee' || this.#isConfirmAction(action) || action === 'interact') {
        this.inventoryMoveIndex = null;
        if (this.inventoryFocus === 'gear') this.#unequipSelectedGear();
        else this.#equipSelectedInventoryItem();
        this.#refreshPlayerAppearance();
        this.#clampInventorySelection();
        continue;
      }
      if (action === 'sidearm') {
        this.inventoryMoveIndex = null;
        if (this.inventoryFocus === 'gear') this.#unequipSelectedGear();
        else this.#unequipSelectedInventoryItem();
        this.#refreshPlayerAppearance();
        this.#clampInventorySelection();
        continue;
      }
      if (action === 'choice3') {
        this.inventoryMoveIndex = null;
        this.#dropSelectedInventoryItem();
        this.#refreshPlayerAppearance();
        this.#clampInventorySelection();
      }
    }
  }

  #handleInventoryClick(click) {
    const currentMenu = this.#currentInventoryActionMenu();
    const action = inventoryActionAt(click, currentMenu);
    if (action) {
      this.#handleInventoryAction(action);
      return;
    }

    if (click.button === 2) {
      this.#openInventoryActionMenuAt(click);
      return;
    }

    const gearIndex = inventoryGearAt(click, this.inventory.equipmentEntries().length);
    if (gearIndex !== null) {
      this.inventoryFocus = 'gear';
      this.equipmentIndex = gearIndex;
      this.inventoryMoveIndex = null;
      this.inventoryActionMenu = null;
      this.#clampInventorySelection();
      return;
    }

    const slotIndex = inventorySlotAt(click);
    if (slotIndex === null) return;
    if (click.shiftKey) {
      this.#sortInventory();
      return;
    }

    const items = this.#inventoryEntries();
    if (this.inventoryMoveIndex !== null) {
      this.inventoryActionMenu = null;
      this.#moveInventoryOrder(this.inventoryMoveIndex, slotIndex);
      return;
    }

    const item = items[slotIndex] ?? null;
    this.inventoryFocus = 'items';
    if (!item) {
      this.inventoryMoveIndex = null;
      this.inventoryActionMenu = null;
      this.#clampInventorySelection();
      return;
    }

    const wasSelected = this.inventoryIndex === slotIndex;
    this.inventoryIndex = slotIndex;
    if (click.ctrlKey) {
      this.inventoryActionMenu = null;
      this.#openInventorySplit(item.id);
      return;
    }

    this.inventoryMoveIndex = wasSelected ? slotIndex : null;
    this.inventoryActionMenu = null;
    this.#clampInventorySelection();
  }

  #handleInventoryAction(action) {
    if (action === 'sort') {
      this.inventoryMoveIndex = null;
      this.inventoryActionMenu = null;
      this.#sortInventory();
      return;
    }
    const menu = this.#currentInventoryActionMenu();
    if (!menu) {
      this.#log('Right click an item first.');
      return;
    }
    this.#selectInventoryActionMenuTarget(menu);
    this.inventoryMoveIndex = null;
    if (action === 'use') {
      this.#useSelectedInventoryItem();
      this.inventoryActionMenu = null;
      this.#clampInventorySelection();
      return;
    }
    if (action === 'equip') {
      if (menu.canUnequip) {
        if (this.inventoryFocus === 'gear') this.#unequipSelectedGear();
        else this.#unequipSelectedInventoryItem();
      } else {
        this.#equipSelectedInventoryItem();
      }
      this.#refreshPlayerAppearance();
      this.#clampInventorySelection();
      return;
    }
    if (action === 'remove') {
      if (this.inventoryFocus === 'gear') this.#unequipSelectedGear();
      else this.#unequipSelectedInventoryItem();
      this.#refreshPlayerAppearance();
      this.#clampInventorySelection();
      return;
    }
    if (action === 'drop') {
      this.#dropSelectedInventoryItem();
      this.#refreshPlayerAppearance();
      this.inventoryActionMenu = null;
      this.#clampInventorySelection();
      return;
    }
    if (action === 'split') this.#openSelectedInventorySplit();
  }

  #openInventoryActionMenuAt(click) {
    const gearIndex = inventoryGearAt(click, this.inventory.equipmentEntries().length);
    if (gearIndex !== null) {
      const slot = this.inventory.equipmentEntries()[gearIndex];
      this.inventoryFocus = 'gear';
      this.equipmentIndex = gearIndex;
      this.inventoryMoveIndex = null;
      this.inventoryActionMenu = slot?.itemId
        ? { focus: 'gear', slot: slot.slot, itemId: slot.itemId, anchor: inventoryGearBox(gearIndex) }
        : null;
      this.#clampInventorySelection();
      return;
    }

    const slotIndex = inventorySlotAt(click);
    const item = slotIndex !== null ? this.#inventoryEntries()[slotIndex] : null;
    this.inventoryFocus = 'items';
    this.inventoryMoveIndex = null;
    if (item) {
      this.inventoryIndex = slotIndex;
      this.inventoryActionMenu = { focus: 'items', itemId: item.id, anchor: inventorySlotBox(slotIndex) };
    } else {
      this.inventoryActionMenu = null;
    }
    this.#clampInventorySelection();
  }

  #currentInventoryActionMenu() {
    const menu = this.inventoryActionMenu;
    if (!menu?.itemId) return null;
    if (menu.focus === 'gear') {
      const slotIndex = this.inventory.equipmentEntries().findIndex((entry) =>
        entry.slot === menu.slot && entry.itemId === menu.itemId
      );
      if (slotIndex < 0) {
        this.inventoryActionMenu = null;
        return null;
      }
      const slot = this.inventory.equipmentEntries()[slotIndex];
      return {
        ...menu,
        slotIndex,
        anchor: inventoryGearBox(slotIndex),
        item: slot,
        canEquip: false,
        canUse: false,
        canUnequip: true,
        canSplit: this.inventory.count(menu.itemId) > 1
      };
    }

    const itemIndex = this.#inventoryEntries().findIndex((entry) => entry.id === menu.itemId);
    if (itemIndex < 0) {
      this.inventoryActionMenu = null;
      return null;
    }
    const item = this.#inventoryEntries()[itemIndex];
    return {
      ...menu,
      itemIndex,
      anchor: inventorySlotBox(itemIndex),
      item,
      canEquip: Boolean(item.equipmentSlot),
      canUse: Boolean(item.canUse),
      canUnequip: item.equippedCount > 0,
      canSplit: item.count > 1
    };
  }

  #selectInventoryActionMenuTarget(menu) {
    if (menu.focus === 'gear') {
      this.inventoryFocus = 'gear';
      this.equipmentIndex = menu.slotIndex;
      return;
    }
    this.inventoryFocus = 'items';
    this.inventoryIndex = menu.itemIndex;
  }

  #handleInventorySplit(actions, click = null) {
    const split = this.#currentInventorySplit();
    if (!split) return;

    if (click) {
      const action = inventorySplitActionAt(click);
      if (action === 'cancel') {
        this.inventorySplit = null;
        return;
      }
      if (this.#isConfirmAction(action)) {
        this.#confirmInventorySplitDrop();
        return;
      }
      if (action === 'minus') {
        this.#adjustInventorySplit(-1);
        return;
      }
      if (action === 'plus') {
        this.#adjustInventorySplit(1);
        return;
      }
      if (action === 'slider') {
        const amount = inventorySplitAmountAt(click, split.max);
        if (amount !== null) this.inventorySplit.amount = amount;
      }
      return;
    }

    for (const action of actions) {
      if (action === 'cancel' || action === 'inventory') {
        this.inventorySplit = null;
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
      if (action === 'left' || action === 'down') {
        this.#adjustInventorySplit(-1);
        continue;
      }
      if (action === 'right' || action === 'up') {
        this.#adjustInventorySplit(1);
        continue;
      }
      if (this.#isConfirmAction(action) || action === 'interact' || action === 'choice3') {
        this.#confirmInventorySplitDrop();
        return;
      }
    }
  }

  #openSelectedInventorySplit() {
    if (this.inventoryFocus === 'gear') {
      const slot = this.inventory.equipmentEntries()[this.equipmentIndex];
      if (!slot || !slot.itemId) {
        this.#log(slot?.empty ? `${slot.label} is empty.` : 'No gear selected.');
        return;
      }
      this.#openInventorySplit(slot.itemId);
      return;
    }

    const item = this.#selectedInventoryItem();
    if (!item) {
      this.#log('Pack is empty.');
      return;
    }
    this.#openInventorySplit(item.id);
  }

  #openInventorySplit(itemId) {
    const item = this.#inventoryEntries().find((entry) => entry.id === itemId);
    if (!item) return;
    if (item.count <= 1) {
      this.#log('Only one item in stack.');
      return;
    }
    this.inventorySplit = {
      itemId,
      amount: Math.min(item.count, Math.max(1, Math.ceil(item.count / 2)))
    };
    this.inventoryMoveIndex = null;
  }

  #currentInventorySplit() {
    if (!this.inventorySplit?.itemId) {
      this.inventorySplit = null;
      return null;
    }
    const item = this.#inventoryEntries().find((entry) => entry.id === this.inventorySplit.itemId);
    if (!item || item.count <= 1) {
      this.inventorySplit = null;
      return null;
    }
    const max = item.count;
    const amount = Math.max(1, Math.min(max, Math.floor(Number(this.inventorySplit.amount) || 1)));
    this.inventorySplit.amount = amount;
    return { ...this.inventorySplit, amount, max, item };
  }

  #adjustInventorySplit(delta) {
    const split = this.#currentInventorySplit();
    if (!split) return;
    this.inventorySplit.amount = Math.max(1, Math.min(split.max, split.amount + delta));
  }

  #confirmInventorySplitDrop() {
    const split = this.#currentInventorySplit();
    if (!split) return;
    const amount = Math.max(1, Math.min(split.max, split.amount));
    if (this.#dropItemFromInventory(split.itemId, { count: amount })) {
      this.inventorySplit = null;
      this.#refreshPlayerAppearance();
      this.#clampInventorySelection();
    }
  }

  #inventoryEntries() {
    const entries = this.inventory?.entries() ?? [];
    this.#syncInventoryOrder(entries);
    const byId = new Map(entries.map((entry) => [entry.id, entry]));
    return (this.inventoryOrder ?? []).map((id) => byId.get(id)).filter(Boolean);
  }

  #selectedInventoryItem() {
    return this.#inventoryEntries()[this.inventoryIndex] ?? null;
  }

  #inventoryFingerprint() {
    return (this.inventory?.entries() ?? [])
      .map((entry) => `${entry.id}:${entry.count}`)
      .sort()
      .join('|');
  }

  #syncInventoryOrder(entries = null) {
    const current = entries ?? this.inventory?.entries() ?? [];
    const present = new Set(current.map((entry) => entry.id));
    const next = [];
    for (const itemId of this.inventoryOrder ?? []) {
      if (present.has(itemId) && !next.includes(itemId)) next.push(itemId);
    }
    for (const entry of current) {
      if (!next.includes(entry.id)) next.push(entry.id);
    }
    this.inventoryOrder = next;
    if (this.inventoryMoveIndex !== null && this.inventoryMoveIndex >= next.length) {
      this.inventoryMoveIndex = null;
    }
  }

  #sortInventory() {
    const rank = {
      currency: 0,
      consumable: 1,
      ammo: 2,
      tool: 3,
      key: 3,
      quest: 4,
      evidence: 4,
      clothes: 5,
      armor: 5,
      boots: 5,
      helmet: 5,
      ring: 5,
      trinket: 5,
      salvage: 6,
      contraband: 7
    };
    this.inventoryOrder = this.inventory.entries()
      .sort((a, b) => {
        const ar = rank[a.type] ?? 9;
        const br = rank[b.type] ?? 9;
        if (ar !== br) return ar - br;
        return a.name.localeCompare(b.name);
      })
      .map((entry) => entry.id);
    this.inventoryMoveIndex = null;
    this.#clampInventorySelection();
    this.#log('Pack sorted.');
  }

  #moveInventoryOrder(fromIndex, targetIndex) {
    this.#syncInventoryOrder();
    const order = [...(this.inventoryOrder ?? [])];
    if (fromIndex < 0 || fromIndex >= order.length) {
      this.inventoryMoveIndex = null;
      return;
    }
    const [itemId] = order.splice(fromIndex, 1);
    const insertAt = Math.max(0, Math.min(targetIndex, order.length));
    order.splice(insertAt, 0, itemId);
    this.inventoryOrder = order;
    this.inventoryFocus = 'items';
    this.inventoryIndex = insertAt;
    this.inventoryMoveIndex = null;
    this.#clampInventorySelection();
  }

  #moveInventorySelection(delta) {
    if (this.inventoryFocus === 'gear') {
      const slots = this.inventory.equipmentEntries();
      this.equipmentIndex = Math.max(0, Math.min(slots.length - 1, this.equipmentIndex + delta));
      return;
    }
    const items = this.#inventoryEntries();
    this.inventoryIndex = Math.max(0, Math.min(items.length - 1, this.inventoryIndex + delta));
  }

  #equipSelectedInventoryItem() {
    const item = this.#selectedInventoryItem();
    if (!item) {
      this.#log('Pack is empty.');
      return;
    }
    if (item.canUse && !item.equipmentSlot) {
      this.#useSelectedInventoryItem();
      return;
    }
    const result = this.inventory.equip(item.id);
    this.#log(result.message);
  }

  #useSelectedInventoryItem() {
    const item = this.#selectedInventoryItem();
    if (!item) {
      this.#log('Pack is empty.');
      return;
    }
    this.#log(this.inventory.useItem(this.player, item.id));
    this.#syncInventoryOrder();
    this.#clampInventorySelection();
  }

  #unequipSelectedInventoryItem() {
    const item = this.#selectedInventoryItem();
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

    const item = this.#selectedInventoryItem();
    if (!item) {
      this.#log('Pack is empty.');
      return;
    }
    this.#dropItemFromInventory(item.id);
  }

  #dropItemFromInventory(itemId, options = {}) {
    const itemDef = this.inventory.itemDefs[itemId] ?? {};
    const name = this.inventory.displayName(itemId);
    const amount = options.slot ? 1 : Math.max(1, Math.floor(Number(options.count) || 1));
    const count = Math.min(amount, this.inventory.count(itemId));
    if (options.slot) {
      const result = this.inventory.unequip(options.slot);
      if (!result.ok) {
        this.#log(result.message);
        return false;
      }
    }
    if (count <= 0 || !this.inventory.remove(itemId, count)) {
      this.#log(`${name} is not in the pack.`);
      return false;
    }

    this.groundItemSeq += 1;
    const groundItem = createGroundItem({
      id: `${this.level?.id ?? 'level'}-drop-${this.groundItemSeq}`,
      itemId,
      itemDef,
      count,
      x: this.player.x,
      y: this.player.y,
      tick: this.anim.tick,
      source: 'player'
    });
    if (!groundItem) {
      this.inventory.add(itemId, count, { ignoreCapacity: true });
      this.#log(`Could not drop ${name}.`);
      return false;
    }

    this.groundItems.push(groundItem);
    this.#syncInventoryOrder();
    this.#log(count === 1 ? `Dropped: ${name}.` : `Dropped: ${count}x ${name}.`);
    return true;
  }

  #refreshActorAppearances(actors) {
    if (!this.atlas) return;
    for (const actor of actors ?? []) {
      if (!isHumanAppearance(actor?.appearance)) continue;
      const spriteId = spriteIdForHumanAppearance(actor.appearance);
      actor.spriteId = spriteId;
      if (!this.atlas[spriteId]) this.atlas[spriteId] = bakeHumanAppearance(actor.appearance);
    }
  }

  // Re-bake the player sprite from the current equipment and appearance. The
  // atlas entry is replaced in place so the world renderer and paper doll match.
  #refreshPlayerAppearance() {
    if (!this.atlas || this.player?.spriteId !== 'mara-vey') return;
    this.atlas[this.player.spriteId] = bakePlayerCharacter(
      this.inventory.equipmentSnapshot(),
      this.inventory.itemDefs,
      this.player.appearance ?? null
    );
  }

  #openDialogue(title, lines, kind = 'inspect') {
    const cleanLines = [].concat(lines ?? []).filter(Boolean);
    if (cleanLines.length === 0) return;
    this.dialogueActor = null;
    this.#setDialogueState({
      title,
      kind,
      lines: cleanLines,
      choices: [],
      scroll: 0,
      options: ['ENTER CLOSE', 'ESC CLOSE']
    });
  }

  #openDialogueById(dialogueId, nodeId = 'start', sourceActor = null) {
    const definition = this.dialogueDefs[dialogueId];
    if (!definition) {
      this.#log(`Missing dialogue: ${dialogueId}.`);
      return;
    }
    this.dialogueActor = sourceActor;
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
    return meetsDialogueConditions(conditions, {
      flags: this.flags,
      questStages: this.questStages,
      hasScar: (scarId, rank) => this.#hasScar(scarId, rank),
      fieldRating: (fieldId) => this.#fieldRating(fieldId),
      traceValue: () => this.#traceValue()
    });
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
        if (this.#isConfirmAction(action) || action === 'interact') {
          this.#chooseDialogueOption(0);
          return;
        }
        if (action === 'cancel' && !this.dialogue?.mustChoose) {
          this.#closeDialogueScreen({ openPendingLoot: false });
          return;
        }
      } else if (action === 'cancel') {
        this.#closeDialogueScreen({ openPendingLoot: false });
        return;
      } else if (this.#isConfirmAction(action) || action === 'interact') {
        this.#closeDialogueScreen();
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
        this.#syncInventoryOrder();
        this.#clampInventorySelection();
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
    if (choice.close !== false) this.#closeDialogueScreen();
  }

  #applyEffects(effects) {
    return this.dialogueEffects.apply(effects);
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
    this.player.render.state = this.#idleStateFor(this.player);
    this.player.render.frameIndex = 0;
    this.moving = null;
    this.pathQueue = [];
    this.pendingExploreTarget = null;
  }

  #closeUiScreen() {
    this.uiScreen = null;
    this.characterCreation = null;
    this.primaryAssignment = null;
    this.dialogue = null;
    this.dialogueActor = null;
    this.pendingLootAfterDialogue = null;
    this.inventoryActionMenu = null;
    this.inventorySplit = null;
    this.contextActionMenu = null;
    this.loot = null;
    this.lootIndex = 0;
    this.trade = null;
    this.tradeFocus = 'trader';
    this.tradeStockIndex = 0;
    this.tradePlayerIndex = 0;
  }

  #closeDialogueScreen({ openPendingLoot = true } = {}) {
    const pendingLoot = openPendingLoot ? this.pendingLootAfterDialogue : null;
    this.#closeUiScreen();
    if (!pendingLoot || this.mode !== 'explore') return;
    if (pendingLoot.sourceType === 'object' && this.#objectShouldOpenLoot(pendingLoot.source)) {
      pendingLoot.source.dialogueShownBeforeLoot = true;
      this.#openObjectLootScreen(pendingLoot.source, { log: false });
    }
  }

  #isConfirmAction(action) {
    return action === 'confirm' || action === 'space';
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
    if (click) {
      if (this.#handleContextActionClick(click)) return;
      if (click.button === 2) {
        this.#openContextActionMenuAt(click);
        return;
      }
      this.contextActionMenu = null;
      this.#handleClickMove(click, true);
    }
    for (const action of actions) {
      if (this.contextActionMenu && action === 'cancel') {
        this.contextActionMenu = null;
        return;
      }
      this.contextActionMenu = null;
      const movement = this.#movementAction(action);
      if (movement) {
        this.pathQueue = [];
        if (this.player.ap >= this.player.moveCost) {
          const moved = this.#tryStep(this.player, movement.dir, { logBlock: false });
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
        case 'space':
          this.#playerAttack();
          break;
        case 'interact': // E = end turn in combat
          this.#endPlayerTurn();
          return;
        case 'dressing':
          this.#log(this.inventory.useFieldDressing(this.player));
          this.#syncInventoryOrder();
          this.#clampInventorySelection();
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

  #handleContextActionClick(click) {
    if (!this.contextActionMenu) return false;
    const action = contextActionAt(click, this.contextActionMenu);
    if (!action) {
      this.contextActionMenu = null;
      return true;
    }
    this.contextActionMenu = null;
    this.#executeContextAction(action);
    return true;
  }

  #openContextActionMenuAt(click) {
    if (click.y >= VIEWPORT_HEIGHT) {
      this.contextActionMenu = null;
      return;
    }
    const cell = this.renderer.toGrid(click.x, click.y);
    if (!this.grid.isInside(cell.x, cell.y)) {
      this.contextActionMenu = null;
      return;
    }
    const target = this.#interactionTargetAtCell(cell, 'combat');
    const actions = this.#contextActionsForTarget(target);
    this.contextActionMenu = actions.length > 0
      ? { anchor: { x: click.x, y: click.y }, target, actions }
      : null;
  }

  #contextActionsForTarget(target) {
    return buildContextActionsForTarget({
      player: this.player,
      target,
      enemies: this.enemies,
      grid: this.grid,
      occupied: this.#occupiedSet(this.player),
      techniqueDefs: this.techniqueDefs,
      inventory: this.inventory,
      objectName: (object) => this.#objectName(object)
    });
  }

  #attackActionState(attack, target, extraAp = 0) {
    if (!attack) return { enabled: false, reason: 'No attack' };
    if (!target || target.isDead) return { enabled: false, reason: 'No target' };
    if (chebyshev(this.player.position, target.position) > attack.range) {
      return { enabled: false, reason: 'Out of range' };
    }
    const cost = attack.apCost + extraAp;
    if (this.player.ap < cost) return { enabled: false, reason: `Need ${cost} AP` };
    return { enabled: true, reason: '' };
  }

  #executeContextAction(action) {
    if (action.enabled === false) {
      if (action.reason) this.#log(action.reason);
      return;
    }
    if (action.kind === 'attack') {
      this.#setCombatTarget(action.target);
      this.selectedAttackId = action.attackId;
      this.#playerAttack();
      return;
    }
    if (action.kind === 'technique') {
      this.#executeTechniqueAction(action);
      return;
    }
    if (action.kind === 'move') {
      const path = findPath(this.grid, this.player.position, action.cell, this.#occupiedSet(this.player));
      this.pathQueue = path && path.length ? path : [];
      return;
    }
    if (action.kind === 'bind-wounds') {
      this.#log(this.inventory.useFieldDressing(this.player));
      this.#syncInventoryOrder();
      this.#clampInventorySelection();
      return;
    }
    if (action.kind === 'reload') {
      this.#log(action.reason || 'No reload needed.');
    }
  }

  #executeTechniqueAction(action) {
    if (action.techniqueId !== 'aimed-shot') {
      this.#log('Technique is not ready yet.');
      return;
    }
    const attack = this.player.getAttack(action.attackId);
    const target = action.target;
    const state = this.#attackActionState(attack, target, action.extraAp ?? 0);
    if (!state.enabled) {
      if (state.reason) this.#log(state.reason);
      return;
    }
    this.#setCombatTarget(target);
    this.selectedAttackId = attack.id;
    this.player.ap -= attack.apCost + (action.extraAp ?? 0);
    this.#registerSuspiciousAction(SUSPICION_SEVERITY.HIGH, 'firing');
    this.#faceToward(this.player, target.position);
    this.#log('Aimed Shot.');
    const result = this.combat.performAttack(this.player, target, attack, {
      damageMultiplier: action.damageMultiplier ?? 1,
      spendAp: false
    });
    for (const line of result.logs) this.#log(line);
    this.#pushEffect(result.effect);
    this.#checkOutcome();
  }

  #setCombatTarget(target) {
    const idx = this.#livingEnemies().indexOf(target);
    if (idx >= 0) this.targetIndex = idx;
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
    if (this.mode === 'explore') return this.#currentPreCombatTarget();
    if (this.mode !== 'combat') return null;
    const living = this.#livingEnemies();
    if (living.length === 0) return null;
    if (this.targetIndex >= living.length) this.targetIndex = 0;
    return living[this.targetIndex];
  }

  #playerAttack(options = {}) {
    const attack = this.player.getAttack(this.selectedAttackId);
    const target = this.#currentTarget();
    if (!attack || !target) return;
    if (!options.ignoreApCost && this.player.ap < attack.apCost) {
      this.#log('Not enough AP for that attack.');
      return;
    }
    if (chebyshev(this.player.position, target.position) > attack.range) {
      this.#log('Target is out of range.');
      return;
    }
    if (attack.range > 1) this.#registerSuspiciousAction(SUSPICION_SEVERITY.HIGH, 'firing');
    this.#faceToward(this.player, target.position);
    const result = this.combat.performAttack(this.player, target, attack, options.sneakAttack ? {
      damageMultiplier: SNEAK_ATTACK_MULTIPLIER,
      opening: 'sneak',
      spendAp: options.spendAp
    } : {
      spendAp: options.spendAp
    });
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
      this.#log(`${this.player.name} falls on the chapel stone. Press R to try again.`);
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

  #startCombat(encounterId = null, { fromAltar = false, initialTarget = null, selectedAttackId = null } = {}) {
    if (this.mode === 'combat') return;
    const resolvedEncounter = this.#resolveEncounterId(encounterId);
    const combatants = this.#livingEnemiesForEncounter(resolvedEncounter);
    if (combatants.length === 0) return;

    this.mode = 'combat';
    this.activeEncounter = resolvedEncounter;
    this.pathQueue = [];
    this.pendingExploreTarget = null;
    this.preCombatTarget = null;
    if (!combatants.some((enemy) => enemy.speech?.kind === 'aggro')) {
      this.#speakCombatStartBark(combatants, resolvedEncounter);
    }
    for (const enemy of combatants) {
      if (enemy.speech?.kind !== 'aggro') enemy.speech = null;
    }
    this.turnManager.begin([this.player, ...combatants]);
    const initialIndex = initialTarget ? combatants.indexOf(initialTarget) : -1;
    this.targetIndex = initialIndex >= 0 ? initialIndex : 0;
    this.selectedAttackId = selectedAttackId ?? this.player.attacks[0]?.id ?? null;

    if (fromAltar) {
      this.#log('The Host tissue beneath the altar pulses once, like a heart remembering worship.');
    }
    this.#log('Combat begins.');
    const introLines = this.#encounterIntro(resolvedEncounter).length
      ? this.#encounterIntro(resolvedEncounter)
      : combatants.map((enemy) => `${enemy.name} advances.`);
    for (const line of introLines) this.#log(line);
  }

  #speakCombatStartBark(combatants, encounterId) {
    const lines = combatStartBarkLines({
      level: this.level,
      trigger: this.#encounterTrigger(encounterId)
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
    this.#speakAggroLine(fallback);
    return true;
  }

  // ---- Movement ----------------------------------------------------------

  // Begin a stepped move of `actor` by `dir` if the destination is free.
  // Returns true if a step started.
  #tryStep(actor, dir, { logBlock = false, moveState = null } = {}) {
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
    const stateName = moveState ?? this.#defaultMoveState(actor);
    actor.render.state = stateName;
    actor.render.frameIndex = 0;
    actor.render.timer = 0;

    this.moving = {
      actor,
      t: 0,
      stateName,
      sneakMode: actor === this.player && this.mode === 'explore' && this.sneakMode,
      usedSprint: actor === this.player && this.mode === 'explore' && this.#isSprintHeld(),
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
    const movementState = this.#movementStateForActiveStep(move);
    if (move.actor === this.player && this.mode === 'explore' && this.#isSprintHeld()) {
      move.usedSprint = true;
    }
    const duration = this.#stepDurationForState(movementState);
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
        move.actor.pendingSuspicionSeverity = this.#movementSeverityForCompletedStep(move);
      }
      if (move.actor.render.state === movementState) {
        move.actor.render.state = this.#idleStateFor(move.actor);
        move.actor.render.frameIndex = 0;
      }
      this.moving = null;
      this.#onStepComplete(move.actor);
    }
    return this.moving !== null;
  }

  #defaultMoveState(actor) {
    return actor === this.player && this.mode === 'explore' ? this.#currentPlayerMoveState() : 'walk';
  }

  #currentPlayerMoveState() {
    if (this.mode === 'explore' && this.#isSprintHeld()) return 'walk';
    return this.mode === 'explore' && this.sneakMode ? 'sneak' : 'walk';
  }

  #movementStateForActiveStep(move) {
    if (move.actor === this.player && this.mode === 'explore') {
      if (this.#isSprintHeld()) return 'walk';
      return move.sneakMode ? 'sneak' : 'walk';
    }
    return move.stateName ?? 'walk';
  }

  #stepDurationForState(stateName) {
    if (this.mode === 'explore' && this.moving?.actor === this.player && this.#isSprintHeld()) {
      return SPRINT_STEP_DURATION;
    }
    return stateName === 'sneak' ? SNEAK_STEP_DURATION : STEP_DURATION;
  }

  #movementSeverityForCompletedStep(move) {
    if (move.usedSprint) return SUSPICION_SEVERITY.HIGH;
    return move.sneakMode ? SUSPICION_SEVERITY.LOW : SUSPICION_SEVERITY.MEDIUM;
  }

  #idleStateFor(actor) {
    return actor === this.player && this.mode === 'explore' && this.sneakMode ? 'sneakIdle' : 'idle';
  }

  #isSprintHeld() {
    return Boolean(this.input?.isHeld?.('shift') || this.input?.keys?.has?.('shift'));
  }

  #toggleSneakMode() {
    if (this.mode !== 'explore') return;
    this.sneakMode = !this.sneakMode;
    if (this.sneakMode) {
      this.player.speech = { text: 'Shhh.', ttl: SNEAK_SPEECH_LIFE, kind: 'sneak' };
    } else if (this.player.speech?.kind === 'sneak') {
      this.player.speech = null;
    }
    if (this.moving?.actor === this.player && !this.player.isDead) {
      this.moving.sneakMode = this.sneakMode;
      this.moving.stateName = this.#currentPlayerMoveState();
      this.player.render.state = this.#movementStateForActiveStep(this.moving);
    } else if (!this.moving && !this.player.isDead) {
      this.player.render.state = this.#idleStateFor(this.player);
      this.player.render.frameIndex = 0;
    }
    this.#log(this.sneakMode ? 'You crouch low.' : 'You stand.');
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
      const severity = this.player.pendingSuspicionSeverity ?? SUSPICION_SEVERITY.LOW;
      this.player.pendingSuspicionSeverity = null;
      this.#registerSuspiciousAction(severity, 'movement');
      if (this.mode !== 'explore') return;
      this.#checkCombatProximity();
      if (this.mode !== 'explore') return;
      this.#tryCompletePendingExploreTarget();
    } else if (actor?.type === 'enemy' && this.mode === 'explore') {
      this.#registerSuspiciousAction(SUSPICION_SEVERITY.MEDIUM, 'patrol');
    }
    if (actor !== this.player && this.mode === 'explore') {
      this.#handlePatrolArrival(actor);
    }
  }

  #handlePatrolArrival(actor) {
    this.patrolSystem.handleArrival(actor);
  }

  #removeActorFromLevel(actor) {
    if (!actor) return;
    actor.removed = true;
    actor.speech = null;
    this.npcs = (this.npcs ?? []).filter((entry) => entry !== actor);
    this.enemies = (this.enemies ?? []).filter((entry) => entry !== actor);
    if (this.dialogueActor === actor) this.dialogueActor = null;
    if (this.preCombatTarget === actor) this.preCombatTarget = null;
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
      if (trigger.forceCombat === true && manhattan(this.player.position, trigger) <= (trigger.radius ?? TRIGGER_RADIUS)) {
        this.#startCombat(encounterId);
        return;
      }
    }
  }

  #registerSuspiciousAction(severity = SUSPICION_SEVERITY.LOW, action = 'movement', options = {}) {
    return this.stealthRuntime.registerSuspiciousAction(severity, action, options);
  }

  #speakAggroLine(enemy) {
    this.stealthRuntime.speakAggroLine(enemy);
  }

  #enemyPerceptionRating(enemy, perception = null) {
    const field = FIELD_RATINGS.find((entry) => entry.id === 'search');
    const base = field ? calculateFieldRating(normalizeProgression(enemy.progression), field) : 0;
    return base + (perception?.ratingBonus ?? 0);
  }

  #advanceExplorePatrols(dt) {
    this.patrolSystem.advanceExplore(dt);
  }

  // ---- Animation & effects ----------------------------------------------

  #advanceAmbientSpeech(dt) {
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

  #movementAction(action) {
    if (DIRS[action]) return { dir: DIRS[action] };
    return null;
  }

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

  #livingEnemyAtCell(cell) {
    return this.enemies.find((enemy) =>
      !enemy.isDead &&
      !this.#isCellHidden(enemy.position.x, enemy.position.y) &&
      enemy.position.x === cell.x &&
      enemy.position.y === cell.y
    ) ?? null;
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

  #encounterTrigger(encounterId) {
    return (this.level.combatTriggers ?? []).find((entry) =>
      this.#resolveEncounterId(entry.encounter ?? entry.id) === encounterId
    );
  }

  #encounterIntro(encounterId) {
    const trigger = this.#encounterTrigger(encounterId);
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
    this.#syncInventoryOrder();
    this.inventoryFocus = this.inventoryFocus === 'gear' ? 'gear' : 'items';
    const itemCount = this.#inventoryEntries().length ?? 0;
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
      techniqueContext: this.#techniqueContext(),
      primaryIndex: this.journalPrimaryIndex ?? 0,
      techniqueIndex: this.journalTechniqueIndex ?? 0
    });
  }

  #techniqueContext() {
    return {
      itemIds: new Set(this.inventory?.counts?.keys?.() ?? []),
      equipment: this.inventory?.equipmentSnapshot?.() ?? {}
    };
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
    for (const actor of [...(this.npcs ?? []), ...(this.enemies ?? [])]) {
      const key = actor.spawnId ?? actor.id;
      const stock = state.tradeStockByActor?.get(key);
      if (Array.isArray(stock) && actor.trade) {
        actor.trade.stock = stock.map((entry) => ({ ...entry }));
      }
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
    if (!this.ready) {
      if (this.loadingState) this.renderer.renderLoading(this.loadingState);
      return;
    }
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
    if (this.mode === 'explore' && this.sneakMode) overlay.enemyVisionCones = this.#enemyVisionCones();

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
      const target = this.#currentTarget();
      if (target) overlay.targetTile = `${target.position.x},${target.position.y}`;
    } else {
      const target = this.#currentTarget();
      if (target) overlay.targetTile = `${target.position.x},${target.position.y}`;
    }
    return overlay;
  }

  #enemyVisionCones() {
    return this.stealthRuntime.visionCones();
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
    this.preCombatTarget = null;
    this.#faceToward(this.player, enemy.position);
    this.#faceToward(enemy, this.player.position);
    this.#openDialogueById(enemy.dialogue, 'start', enemy);
  }

  #objectName(object) {
    if (!object) return 'Unknown';
    if (object.name) return object.name;
    return OBJECT_NAMES[object.kind] ?? String(object.kind ?? 'Object').replaceAll('-', ' ');
  }

  #cursorInfo() {
    const mouse = this.input.mouse;
    if (!mouse) return null;
    if (this.uiScreen === 'character-customization' || this.uiScreen === 'primary-assignment') {
      return { x: mouse.x, y: mouse.y, state: 'ui', text: null };
    }
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
    if (target.type === 'hostile') {
      const selected = this.#currentPreCombatTarget() === target.actor;
      return { x: mouse.x, y: mouse.y, state: 'attack', text: `${selected ? 'ATTACK' : 'TARGET'}: ${target.actor.name}` };
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
      if (this.#objectShouldShowTextBeforeLoot(object)) {
        return { x: mouse.x, y: mouse.y, state: 'inspect', text: `INSPECT: ${name}` };
      }
      return { x: mouse.x, y: mouse.y, state: 'loot', text: `LOOT: ${name}` };
    }
    if (object.interact?.type === 'corpse' && !object.looted && object.interact?.loot?.length) {
      if (this.#objectShouldShowTextBeforeLoot(object)) {
        return { x: mouse.x, y: mouse.y, state: 'inspect', text: `INSPECT: ${name}` };
      }
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
    const modeLabel = this.mode === 'explore'
      ? (this.sneakMode ? 'SNEAK' : 'EXPLORE')
      : { combat: 'COMBAT', victory: 'VICTORY', defeat: 'DEFEAT' }[this.mode];
    const crouchControl = this.sneakMode ? 'C Stand' : 'C Crouch';

    let controls;
    if (this.uiScreen === 'character-customization') {
      controls = ['Type Name', 'Arrows Select', 'Enter Confirm'];
    } else if (this.uiScreen === 'primary-assignment') {
      controls = ['Arrows Assign', 'Enter Confirm'];
    } else if (this.uiScreen === 'journal') {
      if (this.journalSection === 2) controls = ['Up/Dn Select', 'A/D Turn Page', 'J/Esc Close'];
      else if (this.journalSection === 3 || this.journalSection === 5) controls = ['Up/Dn Select', 'Enter Confirm', 'A/D Turn Page', 'J/Esc Close'];
      else controls = ['A/D Turn Page', 'J/Esc Close'];
    } else if (this.uiScreen === 'inventory') {
      controls = this.inventorySplit
        ? ['Left/Right Count', 'Enter Drop', 'Esc Back']
        : ['Click Select', 'Right Menu', 'Shift Sort', 'Ctrl Split', 'Esc Close'];
    } else if (this.uiScreen === 'loot') {
      controls = ['Up/Dn Mark', 'E Pick Item', 'A Pick All', 'Space Leave'];
    } else if (this.uiScreen === 'trade') {
      controls = ['Up/Dn Select', 'A/D Side', 'E Buy', 'Esc Close'];
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
    } else if (this.mode === 'explore' && target) {
      controls = ['Space Attack', '1 Knife 2 Gun', 'Right Click Target', 'Esc Clear', crouchControl, 'I Pack'];
    } else {
      controls = ['Click Move/Use', 'WASD Move', crouchControl, 'Hold Shift Sprint', 'I Pack', 'J Journal', 'H Dressing'];
    }

    const cursor = this.#cursorInfo();

    return {
      levelName: this.level.name,
      actorName: this.player.name,
      role: this.player.role ?? null,
      mode: modeLabel,
      sneakMode: this.mode === 'explore' && this.sneakMode,
      hp: this.player.hp,
      maxHp: this.player.maxHp,
      ap: this.player.ap,
      maxAp: this.player.maxAp,
      action: attack ? attack.name : '-',
      target: target ? `${this.#shortName(target.name)} ${target.hp}/${target.maxHp}` : '-',
      inventory: this.inventory.summary(),
      inventoryItems: this.#inventoryEntries(),
      inventoryIndex: this.inventoryIndex ?? 0,
      inventoryFocus: this.inventoryFocus ?? 'items',
      inventoryMoveIndex: this.inventoryMoveIndex,
      inventoryActionMenu: this.#currentInventoryActionMenu(),
      inventorySplit: this.#currentInventorySplit(),
      ducats: this.inventory.count('ducat'),
      figureSpriteId: this.player.spriteId,
      equipmentSlots: this.inventory.equipmentEntries(),
      equipmentIndex: this.equipmentIndex ?? 0,
      carryWeight: this.inventory.currentWeight(),
      maxCarryWeight: this.inventory.maxCarryWeight,
      areaTitle: this.areaTitleTimer > 0
        ? { text: this.areaTitle, ttl: this.areaTitleTimer, duration: AREA_TITLE_DURATION }
        : null,
      screen: this.uiScreen,
      loot: this.uiScreen === 'loot' ? {
        title: this.loot?.title ?? 'Loot',
        entries: this.#currentLootEntries(),
        index: this.lootIndex ?? 0
      } : null,
      trade: this.uiScreen === 'trade' ? this.#buildTradeUi() : null,
      characterCreation: this.uiScreen === 'character-customization' ? {
        name: this.characterCreation?.name ?? this.player.name,
        rows: currentCustomizationRows(this.characterCreation ?? createCustomizationState(this.player)),
        canConfirm: customizationCanConfirm(this.characterCreation ?? createCustomizationState(this.player)),
        error: this.characterCreation?.error ?? '',
        previewSpriteId: PLAYER_CUSTOM_PREVIEW_SPRITE_ID
      } : null,
      primaryAssignment: this.uiScreen === 'primary-assignment' ? {
        rows: primaryAssignmentRows(this.primaryAssignment ?? createPrimaryAssignmentState(this.player)),
        pointsRemaining: this.primaryAssignment?.pointsRemaining ?? 0,
        canConfirm: primaryAssignmentCanConfirm(this.primaryAssignment ?? createPrimaryAssignmentState(this.player))
      } : null,
      journal: this.uiScreen === 'journal' ? this.#buildJournal() : null,
      dialogue: this.dialogue,
      contextActionMenu: this.contextActionMenu,
      hoverText: cursor?.text ?? null,
      cursor,
      log: this.log,
      controls
    };
  }
}
