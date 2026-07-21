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
import { cloneGameClock, createGameClock } from './GameClock.js';
import { mapLoadingProgress, normalizeLoadingState } from './LoadingProgress.js';
import { loadLevel, randomPatrolDelay } from './LevelLoader.js';
import { applyDevPrimaryOverrides } from './DevStart.js';
import {
  applyPlaytestInventory,
  applyPlaytestProgression,
  playtestClock,
  playtestRequiredItemIds
} from './PlaytestProfile.js';
import {
  PRIMARY_ASSIGNMENT_FLAG,
  createCustomizationState,
  createPrimaryAssignmentState
} from './CharacterCreation.js';
import { DialogueEffects } from './DialogueEffects.js';
import { mergeCodexDefinitions, mergeJournalNotes } from './JournalState.js';
import { LootSession, enemyHasLoot, enemyHasUnclaimedLoot } from './LootSession.js';
import { TradeSession } from './TradeSession.js';
import { TurnManager } from '../combat/TurnManager.js';
import { CombatSystem, chebyshev } from '../combat/CombatSystem.js';
import { isMeleeAttack } from '../combat/AttackMode.js';
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
  unlockLinkedObjects
} from '../world/DoorSystem.js';
import {
  GROUND_ITEM_KIND,
  canActorPickupGroundItem
} from '../world/GroundItems.js';
import { syncObjectFlagState } from '../world/ObjectFlagState.js';
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
import { TableauSystem } from '../world/TableauSystem.js';
import { StealthRuntime } from '../world/StealthRuntime.js';
import { IsometricRenderer } from '../render/IsometricRenderer.js';
import { WorldAudioRuntime } from '../audio/WorldAudioRuntime.js';
import { bakePlayerCharacter } from '../render/SpriteAtlas.js';
import { DEBUG_GRID_DEFAULT, VIEWPORT_HEIGHT } from '../render/renderConfig.js';
import { DIALOGUE_MAX_CHOICES } from '../ui/dialogueLayout.js';
import {
  AREA_TITLE_DURATION,
  PLAYER_CUSTOM_PREVIEW_SPRITE_ID,
  SNEAK_ATTACK_MULTIPLIER,
  isExplorationMode
} from './game/runtimeConstants.js';
import { installGameUiScreens } from './game/GameUiScreens.js';
import { installGameInventoryScreen } from './game/GameInventoryScreen.js';
import { installGameDialogueRuntime } from './game/GameDialogueRuntime.js';
import { installGameCombatRuntime } from './game/GameCombatRuntime.js';
import { installGameMovementRuntime } from './game/GameMovementRuntime.js';
import { installGameRuntimeState } from './game/GameRuntimeState.js';
import { installGameRenderState } from './game/GameRenderState.js';
import { installGameDroneRuntime } from './game/GameDroneRuntime.js';
import { installGameDroneCombatRuntime } from './game/GameDroneCombatRuntime.js';
import { installGameCombatAbilityRuntime } from './game/GameCombatAbilityRuntime.js';
import { installGameSaveRuntime } from './game/GameSaveRuntime.js';
import { createLootSessionState, createTradeSessionState } from './game/sessionState.js';

const FACING_OFFSETS = Object.freeze({
  n: { x: -1, y: -1 },
  ne: { x: 0, y: -1 },
  e: { x: 1, y: -1 },
  se: { x: 1, y: 0 },
  s: { x: 1, y: 1 },
  sw: { x: 0, y: 1 },
  w: { x: -1, y: 1 },
  nw: { x: -1, y: 0 }
});

const ADJACENT_INTERACT_OFFSETS = Object.freeze([
  { x: 0, y: -1 },
  { x: 1, y: 0 },
  { x: 0, y: 1 },
  { x: -1, y: 0 },
  { x: 1, y: -1 },
  { x: 1, y: 1 },
  { x: -1, y: 1 },
  { x: -1, y: -1 }
]);

export class Game {
  constructor({
    canvas,
    levelPath,
    atlas,
    statusElement,
    bootOptions = {},
    debugGrid = null,
    saveCoordinator = null,
    gameVersion = 'dev'
  }) {
    this.canvas = canvas;
    this.levelPath = levelPath;
    this.initialLevelPath = levelPath;
    this.atlas = atlas;
    this.statusElement = statusElement;
    this.saveCoordinator = saveCoordinator;
    this.gameVersion = gameVersion;
    this.startupOptions = { ...bootOptions };
    this.clock = createGameClock(this.startupOptions.clock);

    this.input = new Input(canvas);
    this.worldAudio = new WorldAudioRuntime();
    this.renderer = new IsometricRenderer(canvas, atlas);
    this.combat = new CombatSystem();
    this.turnManager = new TurnManager();
    this.lootSession = new LootSession(createLootSessionState(this), {
      log: (message) => this._log(message),
      logCarryFailure: (carry) => this._logCarryFailure(carry),
      objectName: (object) => this._objectName(object),
      openDialogueById: (dialogueId) => this._openDialogueById(dialogueId),
      openDialogue: (title, lines, kind) => this._openDialogue(title, lines, kind),
      applyQuestUpdate: (update) => this._applyQuestUpdate(update),
      registerSuspiciousAction: (severity, action, options) => this._registerSuspiciousAction(severity, action, options),
      syncInventoryOrder: () => this._syncInventoryOrder()
    });
    this.tradeSession = new TradeSession(createTradeSessionState(this), {
      inventoryEntries: () => this._inventoryEntries(),
      log: (message) => this._log(message),
      logCarryFailure: (carry) => this._logCarryFailure(carry),
      syncInventoryOrder: () => this._syncInventoryOrder()
    });
    this.dialogueEffects = new DialogueEffects(this, {
      log: (message) => this._log(message),
      applyQuestUpdate: (update) => this._applyQuestUpdate(update),
      awardPlayerExperience: (amount) => this._awardPlayerExperience(amount),
      silenceProp: (propId) => this._silenceProp(propId),
      teleportPlayer: (point) => this._teleportPlayer(point),
      openTradeScreen: (targetId) => this._openTradeScreen(targetId),
      closeUiScreen: () => this._closeUiScreen(),
      openDoorGroup: (groupId) => this._openDoorGroup(groupId),
      syncFlagConditionalObjects: () => this._syncFlagConditionalObjects(),
      startCombat: (encounterId, options) => this._startCombat(encounterId, options),
      transitionLevel: (effect) => this._transitionLevel(effect),
      journalStateChanged: () => this._checkJournalUpdates(),
      meetsConditions: (conditions) => this._meetsConditions(conditions),
      logCarryFailure: (carry) => this._logCarryFailure(carry),
      syncInventoryOrder: () => this._syncInventoryOrder(),
      clampInventorySelection: () => this._clampInventorySelection()
    });
    this.stealthRuntime = new StealthRuntime(this, {
      resolveEncounterId: (encounterId) => this._resolveEncounterId(encounterId),
      isCellHidden: (x, y) => this._isCellHidden(x, y),
      fieldRating: (fieldId) => this._fieldRating(fieldId),
      enemyPerceptionRating: (enemy, perception) => this._enemyPerceptionRating(enemy, perception),
      faceToward: (actor, target) => this._faceToward(actor, target),
      deferDetection: (context) => this._consumeDroneDetectionDeferral?.(context) ?? false,
      log: (message) => this._log(message),
      closeUiScreen: () => this._closeUiScreen(),
      startCombat: (encounterId) => this._startCombat(encounterId)
    });
    this.patrolSystem = new PatrolSystem(this, {
      applyEffects: (effects) => this._applyEffects(effects),
      removeActorFromLevel: (actor) => this._removeActorFromLevel(actor),
      isCellHidden: (x, y) => this._isCellHidden(x, y),
      isActorMoving: (actor) => this._isActorMoving(actor),
      occupiedSet: (exclude) => this._occupiedSet(exclude),
      tryStep: (actor, dir, options) => this._tryStep(actor, dir, options),
      startPatrolActivity: (actor, activity) => this._startPatrolActivity(actor, activity),
      updatePatrolActivity: (actor, activity, progress) => this._updatePatrolActivity(actor, activity, progress),
      finishPatrolActivity: (actor, activity, options) => this._finishPatrolActivity(actor, activity, options),
      randomPatrolDelay
    });
    this.tableauSystem = new TableauSystem(this, {
      cancelPatrolActivity: (actor) => this.patrolSystem.cancelActivity(actor),
      cancelMovement: (actor) => this._cancelNpcMovement(actor),
      isActorMoving: (actor) => this._isActorMoving(actor),
      occupiedSet: (exclude) => this._occupiedSet(exclude),
      tryStep: (actor, dir, options) => this._tryStep(actor, dir, options),
      startActivity: (actor, activity, owner) => this._startNpcActivity(actor, activity, owner),
      updateActivity: (actor, activity, progress, owner) => this._updateNpcActivity(actor, activity, progress, owner),
      finishActivity: (actor, owner) => this._finishNpcActivity(actor, owner)
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
    this.journalNotice = null;
    this.journalNoticeSnapshot = null;
    this.journalNoticePollTimer = 0;
    this.pendingExploreTarget = null;
    this.preCombatTarget = null;
    this.dialogueActor = null;
    this.pendingLootAfterDialogue = null;
    this.characterCreation = null;
    this.primaryAssignment = null;
    this.briefingAfter = null;
    this.pendingPrimaryAssignmentTransition = null;
    this.runId = null;
    this.runCreatedAt = null;
    this.playtimeSeconds = 0;
    this.autosaveElapsed = 0;
    this.lastSaveAt = null;
    this.lastSaveError = null;
  }

  // (Re)load the level and reset runtime state. Level transitions preserve the
  // run state; restarts intentionally start clean.
  async boot(options = {}) {
    const bootOptions = this._bootOptions(options);
    const restoredSnapshot = bootOptions.restoreSnapshot ?? null;
    const restored = this._restoreSnapshotValues?.(restoredSnapshot);
    const playtestSeed = !bootOptions.preserveRun && !restored ? bootOptions.playtestSeed ?? null : null;
    const seededQuestStages = playtestSeed
      ? new Map(Object.entries(playtestSeed.questStages ?? {}))
      : null;
    const seededQuestReached = playtestSeed
      ? new Map(Object.entries(playtestSeed.questReached ?? {}).map(([id, stages]) => [id, new Set(stages)]))
      : null;
    this.ready = false;
    this._renderLoading(0.03, 'Preparing field load');
    await this._loadingFrame();
    if (!bootOptions.preserveRun) {
      this.levelStateByPath = new Map();
      this.debugGrid = this.debugGridDefault;
    }
    if (restored) {
      this.levelPath = restoredSnapshot.levelPath;
      this.levelStateByPath = restored.levelStates;
    }

    const previousInventory = bootOptions.preserveRun && !restored ? this.inventory : null;
    const previousInventoryState = restored?.inventoryState ?? previousInventory?.stateSnapshot?.() ?? null;
    const previousInventoryOrder = restored?.inventoryOrder ?? (bootOptions.preserveRun && Array.isArray(this.inventoryOrder)
      ? [...this.inventoryOrder]
      : []);
    const previousQuestStages = restored?.questStages ?? (bootOptions.preserveRun && this.questStages
      ? new Map(this.questStages)
      : seededQuestStages);
    const previousQuestReached = restored?.questReached ?? (bootOptions.preserveRun && this.questReached
      ? new Map([...this.questReached].map(([id, reached]) => [id, new Set(reached)]))
      : seededQuestReached);
    const previousQuestDefs = restored?.questDefs ?? (bootOptions.preserveRun && this.questDefs
      ? { ...this.questDefs }
      : null);
    const previousCodexDefs = restored?.codexDefs ?? (bootOptions.preserveRun && Array.isArray(this.codexDefs)
      ? [...this.codexDefs]
      : []);
    const previousJournalNotes = restored?.journalNotes ?? (bootOptions.preserveRun && Array.isArray(this.journalNotes)
      ? [...this.journalNotes]
      : []);
    const previousFlags = restored?.flags ?? (bootOptions.preserveRun && this.flags
      ? new Set(this.flags)
      : playtestSeed ? new Set(playtestSeed.flags ?? []) : null);
    const previousAwardedQuestXp = restored?.awardedQuestXp ?? (bootOptions.preserveRun && this.awardedQuestXp
      ? new Set(this.awardedQuestXp)
      : null);
    const previousClock = restored?.clock ?? (bootOptions.preserveRun
      ? cloneGameClock(this.clock)
      : playtestClock(playtestSeed));
    const previousPlayer = restored?.player ?? (bootOptions.preserveRun && this.player
      ? {
          name: this.player.name,
          appearance: this.player.appearance ? JSON.parse(JSON.stringify(this.player.appearance)) : null,
          hp: this.player.hp,
          maxHp: this.player.maxHp,
          progression: this.player.progression ? JSON.parse(JSON.stringify(this.player.progression)) : null
        }
      : null);
    const previousGroundItemSeq = restored?.groundItemSeq ?? (bootOptions.preserveRun ? this.groundItemSeq ?? 0 : 0);
    const previousCompanionRun = restored?.companionRun ?? (bootOptions.preserveRun && typeof this._snapshotCompanionRunState === 'function'
      ? this._snapshotCompanionRunState()
      : playtestSeed?.companionRun ?? null);

    const level = await loadLevel(this.levelPath, {
      requiredItemIds: [
        ...(restoredSnapshot?.requiredItemIds ?? []),
        ...playtestRequiredItemIds(playtestSeed)
      ],
      requiredLevelPaths: [
        ...(restoredSnapshot?.contentLevelPaths ?? restoredSnapshot?.levels?.map((entry) => entry.path) ?? []),
        ...(playtestSeed?.requiredLevelPaths ?? [])
      ],
      onProgress: (state) => this._renderLoading({
        ...state,
        progress: mapLoadingProgress(state.progress, 0.12, 0.68)
      })
    });
    this._renderLoading(0.7, 'Restoring run state');
    await this._loadingFrame();
    this.level = level;
    this.worldAudio.setSoundscape(level.soundscape);
    this.grid = level.grid;
    this.player = level.player;
    if (previousPlayer?.name) this.player.name = previousPlayer.name;
    if (previousPlayer?.appearance) this.player.appearance = JSON.parse(JSON.stringify(previousPlayer.appearance));
    if (previousPlayer?.progression) {
      this.player.progression = JSON.parse(JSON.stringify(previousPlayer.progression));
      if (typeof this.player.refreshProgressionStats === 'function') this.player.refreshProgressionStats();
    }
    if (playtestSeed?.progression) {
      applyPlaytestProgression(this.player, playtestSeed.progression, level.techniqueDefs);
    }
    if (bootOptions.primaries) applyDevPrimaryOverrides(this.player, bootOptions.primaries);
    this.flags = previousFlags ?? new Set();
    // Conditional spawns must be evaluated against the run being restored,
    // never against state left on the Game object by the run being replaced.
    this.questStages = new Map(previousQuestStages ?? []);
    this.questReached = new Map(
      [...(previousQuestReached ?? [])].map(([id, reached]) => [id, new Set(reached)])
    );
    this.inventoryOrder = previousInventoryOrder;
    this.inventory = new Inventory(
      { ...(previousInventory?.itemDefs ?? {}), ...level.itemDefs },
      {
        maxCarryWeight: restoredSnapshot?.maxCarryWeight ??
          previousInventory?.maxCarryWeight ??
          playtestSeed?.inventory?.maxCarryWeight ??
          level.playerLoadout?.maxCarryWeight
      }
    );
    if (previousInventoryState) {
      this.inventory.loadState(previousInventoryState);
    } else {
      this._loadStartingInventory(level.playerLoadout);
    }
    if (playtestSeed?.inventory) applyPlaytestInventory(this.inventory, playtestSeed.inventory);
    this._syncInventoryOrder();
    this._refreshPlayerAttacks?.();
    this.enemies = (level.enemies ?? []).filter((enemy) => this._meetsConditions(enemy.conditions));
    if (bootOptions.noCombat) this.enemies = [];
    this.npcs = (level.npcs ?? []).filter((npc) => this._meetsConditions(npc.conditions));
    this.tableauSystem.setTableaux(level.tableaux ?? []);
    this._refreshActorAppearances([...this.enemies, ...this.npcs]);
    this.groundItems = level.groundItems ?? [];
    this.groundItemSeq = previousGroundItemSeq;
    if (previousPlayer) {
      const hpRatio = previousPlayer.maxHp > 0 ? previousPlayer.hp / previousPlayer.maxHp : 1;
      this.player.hp = Math.max(1, Math.min(this.player.maxHp, Math.round(this.player.maxHp * hpRatio)));
    }

    this.companionDefs = level.companionDefs ?? {};
    this._initializeCompanionRun(previousCompanionRun);
    // Bake the player sprite to match the loaded equipment so the world figure
    // and inventory paper doll reflect the customized actor.
    this._renderLoading(0.78, 'Baking player model');
    this._refreshPlayerAppearance();
    await this._loadingFrame();
    this.interactions = new InteractionSystem(level.interactables, {
      meetsConditions: (conditions) => this._meetsConditions(conditions)
    });
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
    // Static journal sources accumulate as their levels are visited. A fresh
    // boot passes empty previous collections and therefore starts a clean run.
    this.codexDefs = mergeCodexDefinitions(previousCodexDefs, level.codex);
    this.journalNotes = mergeJournalNotes(previousJournalNotes, level.journalNotes);
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
    this.combatHazards = [];
    this.moving = null;
    this.explorationMovements = new Map();
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
    this.journalEvidenceIndex = 0;
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
    this.combatAbilityTargeting = null;
    this.combatAbilityTrayPage = 0;
    this.inventorySplit = null;
    this.inventoryRepair = null;
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
    this.clock = previousClock ?? createGameClock(this.startupOptions.clock);
    this.hiddenTiles = new Set();
    this.hiddenTilesKey = null;
    this.exploredMapTiles = new Set();

    this.selectedAttackId = this.player.attacks[0]?.id ?? null;
    this.targetIndex = 0;
    this.preCombatTarget = null;
    this.enemyActions = null;
    this.enemyActor = null;
    this.actionTimer = 0;

    this._restoreLevelState();
    this._syncFlagConditionalObjects({ refreshScene: false });
    const restoredPlayerPoint = restoredSnapshot?.player?.position
      ? { ...restoredSnapshot.player.position, facing: restoredSnapshot.player.facing }
      : null;
    if (restoredPlayerPoint ?? bootOptions.player) this._teleportPlayer(restoredPlayerPoint ?? bootOptions.player);
    this._refreshHiddenTiles();
    this._revealMapAroundPlayer();
    this._renderLoading(0.88, 'Baking field view');
    await this._loadingFrame();
    this.renderer.rebuildStaticScene({
      grid: this.grid,
      props: this.level.props,
      mood: this.level.mood,
      hiddenTiles: this.hiddenTiles
    });
    this._renderLoading(0.96, 'Entering field');
    await this._loadingFrame();

    this.areaTitle = level.name;
    this.areaTitleTimer = AREA_TITLE_DURATION;
    this._log(level.intro || level.name);
    this._startQuests(previousQuestStages, previousQuestReached);
    this._resetJournalNoticeTracking({ preserveNotice: bootOptions.preserveRun });
    this._log('C crouches. Hold Shift while moving to sprint.');
    this._log('I pack, J journal, M map, H bind wounds.');
    if (bootOptions.skipIntro) this.introSeen = true;
    this._applyRestoredRuntimeMetadata?.(restoredSnapshot);

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
    this._renderLoading(1, 'Load complete');
    this.ready = true;
    this.loadingState = null;
    if (this.statusElement) this.statusElement.textContent = '';
  }

  start() {
    this.loop.start();
  }

  get actors() {
    return [
      this.player,
      ...(this.companions ?? []).filter((companion) => !companion.removed),
      ...this.enemies.filter((enemy) => !enemy.dormant),
      ...(this.npcs ?? []).filter((npc) => !npc.dormant)
    ];
  }

  _bootOptions(options) {
    if (options.preserveRun) {
      return {
        noCombat: this.startupOptions.noCombat,
        ...options
      };
    }
    return { ...this.startupOptions, ...options };
  }

  _renderLoading(progressOrState, message = '', detail = '') {
    const state = typeof progressOrState === 'object' && progressOrState !== null
      ? normalizeLoadingState(progressOrState)
      : normalizeLoadingState({ progress: progressOrState, message, detail });
    this.loadingState = state;
    this.renderer.renderLoading(state);
  }

  async _loadingFrame() {
    if (typeof window === 'undefined' || typeof window.requestAnimationFrame !== 'function') return;
    await new Promise((resolve) => window.requestAnimationFrame(() => resolve()));
  }

  // ---- Main update -------------------------------------------------------

  update(dt) {
    if (!this.ready) return;

    this.worldAudio?.update?.(dt, this.player?.position, {
      paused: this.mode !== 'explore' || Boolean(this.uiScreen)
    });

    if (this.mode === 'title') {
      const actions = this.input.consume();
      const click = this.input.consumeClick();
      this.input.consumeText?.();
      this._handleSaveScreen?.(actions, click);
      return;
    }

    this._advanceAnim(dt);
    this._advanceSaveRuntime?.(dt);
    if (this.pendingInitialAutosave && this._canSaveRun?.()) {
      this.pendingInitialAutosave = false;
      void this._requestAutosave?.('new run');
    }
    if (this.mode !== 'intro' && !this.uiScreen) this._advanceClock(dt);
    this._advanceJournalTurn(dt);
    this._advanceJournalNotice(dt);
    this._advanceGroundItems();
    if (this.areaTitleTimer > 0 && this.mode !== 'intro') {
      this.areaTitleTimer = Math.max(0, this.areaTitleTimer - dt);
    }
    this._ageEffects(dt);
    this._advanceAmbientSpeech(dt);
    for (const actor of this.actors) this._advanceActorAnim(actor, dt);
    this._advanceCompanionFollow?.(dt);
    this._advanceExplorationMovements(dt);

    if (this._advanceMovement(dt)) {
      // A step is in flight; consume input but ignore most of it mid-step.
      this._drainBlockingInput();
      return;
    }

    const actions = this.input.consume();
    const click = this.input.consumeClick();
    const textInput = typeof this.input.consumeText === 'function' ? this.input.consumeText() : [];

    if (this._isSaveScreen?.()) {
      this._handleSaveScreen(actions, click);
      return;
    }

    if (this.mode === 'intro') {
      this._handleIntro(actions, click);
      return;
    }

    if (this.uiScreen) {
      this._handleUiScreen(actions, click, textInput);
      return;
    }

    if (isExplorationMode(this.mode)) {
      this._handleExplore(actions, click);
    } else if (this.mode === 'combat') {
      this._handleCombat(actions, click, dt);
    } else if (this.mode === 'defeat') {
      this._handleEndState(actions);
    }

    // Continue walking a queued click-to-move path when otherwise idle.
    if (!this.moving) this._stepAlongPath();
    this._advanceExplorePatrols(dt);
  }

  // ---- Opening writ (intro) ----------------------------------------------

  _handleIntro(actions, click) {
    const advance = () => {
      this.briefingPage += 1;
      if (this.briefingPage >= (this.briefing?.length ?? 0)) this._finishIntro();
    };
    if (click) {
      advance();
      return;
    }
    for (const action of actions) {
      if (action === 'cancel') {
        this._finishIntro();
        return;
      }
      if (this._isConfirmAction(action) || action === 'interact' || action === 'down') {
        advance();
        return;
      }
      if (action === 'up') {
        this.briefingPage = Math.max(0, this.briefingPage - 1);
        return;
      }
    }
  }

  _finishIntro() {
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
    if (this._runPostBriefingAction(after)) return;
    this.mode = 'explore';
  }

  _runPostBriefingAction(action) {
    if (!action) return false;
    const normalized = typeof action === 'string' ? { openScreen: action } : action;
    const screen = normalized.openScreen ?? normalized.screen ?? normalized.type;
    const loadLevel = normalized.loadLevel ?? normalized.thenLoadLevel ?? null;
    const postEffects = {
      clock: normalized.clock,
      log: normalized.log,
      setFlag: normalized.setFlag
    };
    this._applyEffects(postEffects);

    if (screen === 'character-customization') {
      this._openCharacterCustomization();
      return true;
    }
    if (screen === 'primary-assignment') {
      this.pendingPrimaryAssignmentTransition = loadLevel ? JSON.parse(JSON.stringify(loadLevel)) : null;
      this._openPrimaryAssignment();
      return true;
    }
    if (loadLevel) {
      void this._transitionLevel(loadLevel);
      return true;
    }
    return false;
  }

  _openCharacterCustomization() {
    this.mode = 'explore';
    this.uiScreen = 'character-customization';
    this.contextActionMenu = null;
    this.characterCreation = createCustomizationState(this.player);
    this._refreshCharacterPreview();
  }

  _openPrimaryAssignment() {
    this.mode = 'explore';
    if (this.flags?.has(PRIMARY_ASSIGNMENT_FLAG)) {
      const transition = this.pendingPrimaryAssignmentTransition;
      this.pendingPrimaryAssignmentTransition = null;
      if (transition) void this._transitionLevel(transition);
      return;
    }
    this.uiScreen = 'primary-assignment';
    this.contextActionMenu = null;
    this.primaryAssignment = createPrimaryAssignmentState(this.player);
  }

  _refreshCharacterPreview() {
    if (!this.atlas || !this.characterCreation) return;
    const equipment = this.inventory?.equipmentSnapshot?.() ?? {};
    const bareBodyEquipment = { ...equipment, clothes: null, armor: null, boots: null, helmet: null };
    this.atlas[PLAYER_CUSTOM_PREVIEW_SPRITE_ID] = bakePlayerCharacter(
      bareBodyEquipment,
      this.inventory?.itemDefs ?? {},
      this.characterCreation.appearance
    );
  }

  _drainBlockingInput() {
    const actions = this.input.consume();
    const click = this.input.consumeClick();
    const textInput = typeof this.input.consumeText === 'function' ? this.input.consumeText() : [];
    if (this.uiScreen) {
      this._handleUiScreen(actions, click, textInput);
      return;
    }

    if (click?.button === 0 && this.moving?.actor === this.player && isExplorationMode(this.mode)) {
      this._handleExploreClick(click, { deferReachedTarget: true });
    }

    // Still honour persistent toggles and lightweight screens while animating.
    for (const action of actions) {
      if (action === 'restart') this._requestRunRestart?.();
      else if (action === 'debug') this.debugGrid = !this.debugGrid;
      else if (action === 'toggle-sneak') this._toggleSneakMode();
      else if (action === 'journal') this._toggleJournal();
      else if (action === 'map') this._toggleJournal({ section: 'MAP' });
    }
  }

  // ---- Explore mode ------------------------------------------------------

  _handleExplore(actions, click) {
    if (click) this._handleExploreClick(click);
    for (const action of actions) {
      const movement = this._movementAction(action);
      if (movement) {
        this.pendingExploreTarget = null;
        this.pathQueue = []; // manual step overrides any click path
        this._tryStep(this.player, movement.dir, {
          logBlock: true,
          moveState: this._currentPlayerMoveState()
        });
        return; // one step per update; trigger check runs on completion
      }
      switch (action) {
        case 'weapon1':
          this._selectReadyWeapon('weapon1');
          break;
        case 'weapon2':
          this._selectReadyWeapon('weapon2');
          break;
        case 'toggle-sneak':
          this._toggleSneakMode();
          break;
        case 'melee':
        case 'sidearm':
          this._selectAttack(action);
          break;
        case 'confirm':
        case 'space':
          if (this._currentPreCombatTarget()) {
            this._attackPreCombatTarget();
            return;
          }
          break;
        case 'interact':
          if (this._interactWithNearbyTarget()) return;
          break;
        case 'cancel':
          if (this.preCombatTarget) this.preCombatTarget = null;
          else this._openPauseMenu?.();
          break;
        case 'inventory':
          this._toggleInventory();
          break;
        case 'journal':
          this._toggleJournal();
          break;
        case 'map':
          this._toggleJournal({ section: 'MAP' });
          break;
        case 'dressing':
          this._log(this.inventory.useFieldDressing(this.player));
          this._syncInventoryOrder();
          this._clampInventorySelection();
          break;
        case 'reload':
          this._reloadSelectedWeapon(false);
          break;
        case 'restart':
          this._requestRunRestart?.();
          return;
        case 'debug':
          this.debugGrid = !this.debugGrid;
          break;
        default:
          break;
      }
    }
  }

  _interactWithNearbyTarget() {
    const target = this._nearbyExploreActionTarget();
    if (!target) return false;
    this._executeExploreTarget(target);
    return true;
  }

  _nearbyExploreActionTarget() {
    const origin = this.player?.position;
    if (!origin) return null;

    const cells = [{ x: origin.x, y: origin.y }];
    const facing = FACING_OFFSETS[this.player.facing];
    if (facing) cells.push({ x: origin.x + facing.x, y: origin.y + facing.y });
    for (const offset of ADJACENT_INTERACT_OFFSETS) {
      cells.push({ x: origin.x + offset.x, y: origin.y + offset.y });
    }

    const seen = new Set();
    for (const cell of cells) {
      const key = `${cell.x},${cell.y}`;
      if (seen.has(key)) continue;
      seen.add(key);

      const target = this._interactionTargetAtCell(cell, 'explore');
      if (isActionTarget(target) && isTargetInReach(this.player, target)) return target;
    }
    return null;
  }

  _handleExploreClick(click, { deferReachedTarget = false } = {}) {
    if (click.y >= VIEWPORT_HEIGHT) return;
    if (click.button === 2) {
      if (click.ctrlKey) {
        const cell = this.renderer.toGrid(click.x, click.y);
        if (this._projectDroneGhostLightExplore?.(cell)) return;
      }
      this._handlePreCombatTargetClick(click);
      return;
    }
    if (click.button !== 0) return;

    const target = this._interactionTargetFromPoint(click, 'explore');
    if (!target) return;

    if (target.type === 'move') {
      this.pendingExploreTarget = null;
      const path = findPath(this.grid, this.player.position, target.cell, this._occupiedSet(this.player));
      this.pathQueue = path && path.length ? path : [];
      return;
    }

    if (!isActionTarget(target)) {
      this.pendingExploreTarget = null;
      return;
    }

    const sortAfterLoot = Boolean(click.shiftKey);
    if (isTargetInReach(this.player, target)) {
      if (deferReachedTarget) {
        this.pendingExploreTarget = { ...target, sortAfterLoot };
        this.pathQueue = [];
        return;
      }
      this._executeExploreTarget(target, { sortAfterLoot });
      return;
    }

    const path = this._pathToExploreTarget(target);
    this.pendingExploreTarget = path && path.length ? { ...target, sortAfterLoot } : null;
    this.pathQueue = path && path.length ? path : [];
  }

  _handlePreCombatTargetClick(click) {
    const cell = this.renderer.toGrid(click.x, click.y);
    if (!this.grid.isInside(cell.x, cell.y)) return;
    const enemy = this._livingEnemyAtCell(cell);
    if (!enemy) {
      this.preCombatTarget = null;
      return;
    }
    this._selectPreCombatTarget(enemy);
  }

  _selectPreCombatTarget(enemy) {
    if (!enemy || enemy.isDead) return;
    this.preCombatTarget = enemy;
    const idx = this._livingEnemies().indexOf(enemy);
    if (idx >= 0) this.targetIndex = idx;
    this.pendingExploreTarget = null;
    this.pathQueue = [];
    this._faceToward(this.player, enemy.position);
    this._log(`Target: ${enemy.name}.`);
  }

  _currentPreCombatTarget() {
    const target = this.preCombatTarget;
    if (!target) return null;
    if (!this.enemies.includes(target) || target.isDead || this._isCellHidden(target.position.x, target.position.y)) {
      this.preCombatTarget = null;
      return null;
    }
    return target;
  }

  _attackPreCombatTarget() {
    this._refreshPlayerAttacks?.();
    const target = this._currentPreCombatTarget();
    if (!target) return;
    const attack = this.player.getAttack(this.selectedAttackId) ?? this.player.attacks[0] ?? null;
    if (!attack) return;
    this.selectedAttackId = attack.id;
    if (chebyshev(this.player.position, target.position) > attack.range) {
      this._log('Target is out of range.');
      return;
    }

    const sneakAttack = this._canOpenWithSneakAttack(target, attack);
    const preview = this._attackPreview?.(this.player, target, attack, {
      sneakAttack,
      ignoreApCost: true,
      damageMultiplier: sneakAttack ? SNEAK_ATTACK_MULTIPLIER : 1
    });
    if (preview && !preview.enabled) {
      if (preview.reason) this._log(preview.reason);
      return;
    }
    this._startCombat(target.encounter, { initialTarget: target, selectedAttackId: attack.id });
    if (this.mode !== 'combat') return;
    this._registerSuspiciousAction(SUSPICION_SEVERITY.HIGH, 'attack', { requireSight: true });
    const attacked = this._playerAttack({ sneakAttack, ignoreApCost: true, spendAp: false });
    if (attacked && this.mode === 'combat' && this.turnManager.isPlayerTurn()) {
      this._endPlayerTurn();
    }
  }

  _canOpenWithSneakAttack(target, attack) {
    if (!this.sneakMode || !target || !attack || !isMeleeAttack(attack)) return false;
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

  _interactionTargetFromPoint(point, mode = this.mode) {
    const cell = this._interactionHighlightCellFromPoint(point, mode) ?? this.renderer.toGrid(point.x, point.y);
    return this._interactionTargetAtCell(cell, mode);
  }

  _interactionHighlightCellFromPoint(point, mode = this.mode) {
    if (!isExplorationMode(mode) || !point || !this.input?.isHeld?.('tab')) return null;
    return this.renderer.interactionHighlightAt?.(point.x, point.y) ?? null;
  }

  _interactionTargetAtCell(cell, mode = this.mode) {
    const target = resolveInteractionTargetAtCell({
      cell,
      grid: this.grid,
      player: this.player,
      actors: this.actors,
      enemies: this.enemies,
      interactables: this._allInteractables(),
      hiddenTiles: this.hiddenTiles,
      mode
    });
    if (mode !== 'explore' || target.type !== 'blocked') return target;

    const transition = this._levelTransitionAtCell?.(cell, { includeClickAreas: true });
    if (!transition) return target;
    if (this._isCellHidden?.(cell.x, cell.y)) return target;

    const transitionCell = { x: transition.x, y: transition.y };
    if (
      !this.grid?.isInside?.(transitionCell.x, transitionCell.y) ||
      !this.grid.isWalkable(transitionCell.x, transitionCell.y) ||
      this._isCellHidden?.(transitionCell.x, transitionCell.y) ||
      this._isOccupied?.(transitionCell.x, transitionCell.y, this.player)
    ) {
      return target;
    }
    return { type: 'move', cell: transitionCell, sourceCell: cell, transition };
  }

  _allInteractables() {
    return [
      ...(this.groundItems ?? []).filter((item) => !item.consumed),
      ...(this.level?.interactables ?? []).filter((object) =>
        !object.hiddenByFlag &&
        !object.disabledByFlag &&
        (!object.hiddenUntilOpened || object.opened || object.consumed)
      )
    ];
  }

  _pathToExploreTarget(target) {
    const occupied = this._occupiedSet(this.player);
    const cell = target.cell;
    if ((target.type === 'object' || target.type === 'corpse') &&
        this.grid.isWalkable(cell.x, cell.y) &&
        !this._isOccupied(cell.x, cell.y, this.player)) {
      const direct = findPath(this.grid, this.player.position, cell, occupied);
      if (direct && direct.length) return direct;
    }
    return findPathToAdjacent(this.grid, this.player.position, cell, occupied);
  }

  _tryCompletePendingExploreTarget() {
    const target = this.pendingExploreTarget;
    if (!target || this.mode !== 'explore' || this.uiScreen) return;
    if (!this._isExploreTargetValid(target)) {
      this.pendingExploreTarget = null;
      return;
    }
    if (isTargetInReach(this.player, target)) {
      this._executeExploreTarget(target, { sortAfterLoot: target.sortAfterLoot });
    }
  }

  _isExploreTargetValid(target) {
    if (target.type === 'talk') {
      const actor = target.actor;
      return Boolean(actor && !actor.isDead && actor.dialogue && !(actor.dialogueSeen && !actor.dialogueRepeat));
    }
    if (target.type === 'corpse') {
      const enemy = target.enemy;
      return Boolean(enemy && enemy.isDead && (enemy.inspect || this._enemyHasUnclaimedLoot(enemy)));
    }
    if (target.type === 'object') {
      const object = target.object;
      return Boolean(object && !object.consumed && object.x === target.cell.x && object.y === target.cell.y);
    }
    return false;
  }

  _executeExploreTarget(target, options = {}) {
    this.pendingExploreTarget = null;
    this.pathQueue = [];
    const beforeInventory = options.sortAfterLoot ? this._inventoryFingerprint() : null;
    const finish = () => {
      if (beforeInventory !== null && this._inventoryFingerprint() !== beforeInventory) {
        this._sortInventory();
      }
    };
    if (target.type === 'talk') {
      this._openEnemyDialogue(target.actor);
      finish();
      return;
    }
    if (target.type === 'corpse') {
      this._interactWithCorpse(target.enemy);
      finish();
      return;
    }
    if (target.type === 'object') {
      this._interactWithObject(target.object);
      finish();
    }
  }

  _enemyHasLoot(enemy) {
    return enemyHasLoot(enemy);
  }

  _enemyHasUnclaimedLoot(enemy) {
    return enemyHasUnclaimedLoot(enemy);
  }

  _logCarryFailure(carry) {
    const current = Inventory.formatWeight(carry.current);
    const max = Inventory.formatWeight(this.inventory.maxCarryWeight);
    const over = Inventory.formatWeight(carry.overBy);
    this._log(`Too much to carry. Pack ${current}/${max} kg.`);
    this._log(`Need ${over} kg free.`);
  }

  _interactWithCorpse(enemy) {
    if (!enemy) return;
    const lootSource = { sourceType: 'enemy', source: enemy };
    if (this._lootSourceHasItems(lootSource)) {
      if (enemy.inspect && !enemy.inspectShownBeforeLoot) {
        this.pendingLootAfterDialogue = lootSource;
        this._openDialogueById(enemy.inspect);
        if (this.uiScreen === 'dialogue') return;
        this.pendingLootAfterDialogue = null;
      }
      this._openEnemyLootScreen(enemy);
      return;
    }

    if (enemy.inspect) {
      this._openDialogueById(enemy.inspect);
    } else if (this._enemyHasLoot(enemy) && enemy.lootClaimed) {
      this._openDialogue(enemy.name, ['Nothing useful remains.'], 'corpse');
    }
  }

  _openEnemyLootScreen(enemy) {
    const lootSource = { sourceType: 'enemy', source: enemy };
    if (!this._lootSourceHasItems(lootSource)) return false;
    this._registerSuspiciousAction(SUSPICION_SEVERITY.LOW, 'looting');
    if (this.mode !== 'explore') return false;
    this._openLootScreen({ title: enemy.name, ...lootSource });
    return true;
  }

  _interactWithObject(object, { bypassSearch = false } = {}) {
    if (object?.kind === GROUND_ITEM_KIND || object?.interact?.type === 'ground-item') {
      this._pickupGroundItem(object);
      return;
    }
    if (object?.interact?.type === 'drone-shrine') {
      this._openDroneShrine(object);
      return;
    }
    if (isObjectLocked(object)) {
      this._openLockDialogue(object);
      return;
    }
    if (isDoorObject(object)) {
      this._openDoorObject(object);
      return;
    }
    if (!bypassSearch && this._hasSearchChoices(object)) {
      this._openSearchDialogue(object);
      return;
    }
    if (this._objectShouldShowTextBeforeLoot(object)) {
      if (this._openObjectTextBeforeLoot(object)) return;
    }
    if (this._objectShouldOpenLoot(object)) {
      this._openObjectLootScreen(object);
      return;
    }

    const result = this.interactions.interact(object, this.inventory);
    this._syncInventoryOrder();
    for (const line of result.logs) this._log(line);
    this._applyQuestUpdate(result.questUpdate);
    if (result.dialogueId) {
      this._openDialogueById(result.dialogueId);
    } else {
      this._openDialogue(this._objectName(object), result.logs, object.interact?.type ?? 'inspect');
    }
    if (result.triggersCombat && this.mode !== 'combat') {
      this._startCombat(result.combatEncounter ?? true, { fromAltar: true });
    }
  }

  _openDoorObject(object, { log = true } = {}) {
    if (!isDoorObject(object)) return;
    openLinkedObjects(object, this.level?.interactables ?? [], {
      grid: this.grid,
      now: this.anim?.tick ?? null
    });
    this._refreshHiddenTiles({ rebuildStatic: true });
    this._revealMapAroundPlayer();
    if (log) {
      for (const line of [].concat(object.interact?.log ?? [])) this._log(line);
    }
    if (object.interact?.questUpdate) this._applyQuestUpdate(object.interact.questUpdate);
    if (object.interact?.dialogue) this._openDialogueById(object.interact.dialogue);
  }

  _openDoorGroup(groupId) {
    if (typeof groupId !== 'string' || groupId.trim() === '') return false;
    const object = (this.level?.interactables ?? []).find((candidate) =>
      objectGroupId(candidate) === groupId
    );
    if (!object) return false;
    openLinkedObjects(object, this.level?.interactables ?? [], {
      grid: this.grid,
      now: this.anim?.tick ?? null
    });
    this._refreshHiddenTiles({ rebuildStatic: true });
    this._revealMapAroundPlayer();
    return true;
  }

  _syncFlagConditionalObjects({ refreshScene = true } = {}) {
    let changed = false;
    for (const object of this.level?.props ?? []) {
      if (syncObjectFlagState(object, this.flags, { grid: this.grid })) {
        if (object.hiddenByFlag) object.speech = null;
        changed = true;
      }
    }
    if (!changed || !refreshScene) return changed;
    this.pendingExploreTarget = null;
    this._refreshHiddenTiles({ rebuildStatic: true });
    this._revealMapAroundPlayer();
    return true;
  }

  _pickupGroundItem(item) {
    if (!canActorPickupGroundItem(this.player, item)) return;
    const count = item.count ?? 1;
    const carry = this.inventory.canAdd(item.itemId, count);
    if (!carry.ok) {
      const current = Inventory.formatWeight(carry.current);
      const max = Inventory.formatWeight(this.inventory.maxCarryWeight);
      const over = Inventory.formatWeight(carry.overBy);
      this._log(`Too much to carry. Pack ${current}/${max} kg.`);
      this._log(`Need ${over} kg free.`);
      return;
    }

    const result = this.inventory.add(item.itemId, count, {
      condition: item.condition,
      loaded: item.loaded
    });
    if (!result.ok) {
      this._log('Could not pick that up.');
      return;
    }

    item.consumed = true;
    item.pickupStart = this.anim.tick;
    const label = `${count}x ${item.name ?? this.inventory.displayName(item.itemId)}`;
    this._log(`Picked up: ${label}.`);
    this._syncInventoryOrder();
    this._refreshPlayerAttacks?.();
    this._clampInventorySelection();
  }

  _openLockDialogue(object, leadLines = []) {
    const lock = objectLock(object);
    if (!lock) return;

    const title = lockTitle(lock, this._objectName(object));
    const bodyLines = [
      ...[].concat(leadLines ?? []).filter(Boolean),
      ...lockLines(lock, `${this._objectName(object)} is locked.`)
    ];
    const choices = lockMethods(lock)
      .filter((method) => this._meetsConditions(method.conditions))
      .map((method) => ({
        method,
        status: lockMethodStatus(method, {
          inventory: this.inventory,
          fieldRating: (fieldId) => this._fieldRating(fieldId),
          primaryRating: (primaryId) => this._primaryRating(primaryId)
        })
      }))
      .filter(({ status }) => status.available)
      .slice(0, DIALOGUE_MAX_CHOICES - 1)
      .map(({ method, status }) => ({
        label: this._lockChoiceLabel(method, status),
        lockAction: { object, methodId: method.id },
        close: false
      }));

    if (choices.length === 0) {
      bodyLines.push('You see no useful way through this lock yet.');
    }
    choices.push({ label: 'Leave it shut', close: true });

    this._setDialogueState({
      id: '__lock__',
      title,
      kind: 'lock',
      lines: bodyLines,
      choices,
      scroll: 0,
      options: choices.map((choice, index) => `${index + 1}. ${choice.label}`)
    });
  }

  _lockChoiceLabel(method, status) {
    const base = method.label ?? 'Try the lock';
    const check = status?.check;
    if (!check) return base;
    const label = check.kind === 'primary'
      ? this._primaryLabel(check.id)
      : this._fieldLabel(check.id);
    return `${base} (${label} ${check.rating} of ${check.dc})`;
  }

  _chooseLockOption(action) {
    const object = action?.object;
    if (!object) {
      this._closeUiScreen();
      return;
    }
    if (!isObjectLocked(object)) {
      this._closeUiScreen();
      this._interactWithObject(object);
      return;
    }

    const method = lockMethodById(objectLock(object), action.methodId);
    const result = resolveLockMethod(method, {
      inventory: this.inventory,
      fieldRating: (fieldId) => this._fieldRating(fieldId),
      primaryRating: (primaryId) => this._primaryRating(primaryId),
      itemName: (itemId) => this.inventory.displayName(itemId)
    });
    if (result.unlocked) unlockLinkedObjects(object, this.level?.interactables ?? []);
    for (const line of result.logs) this._log(line);
    if (result.unlocked) this._applyLockToolWear(method, result.status);

    const didTransition = this._applyEffects(result.effects);
    if (didTransition) return;

    if (result.unlocked) {
      this._closeUiScreen();
      if (isDoorObject(object) && result.openOnSuccess) {
        this._openDoorObject(object, { log: false });
        return;
      }
      if (result.openOnSuccess) this._interactWithObject(object);
      return;
    }
    this._openLockDialogue(object, result.logs);
  }

  _applyLockToolWear(method, status) {
    if (!lockMethodUsesSecurityTool(method, status)) return;
    if (securityToolSurvives(status)) return;
    if (!this.inventory.remove(SECURITY_TOOL_ITEM, 1)) return;
    this._log(`${this.inventory.displayName(SECURITY_TOOL_ITEM)} bends past saving.`);
    this._syncInventoryOrder();
    this._clampInventorySelection();
  }

  _hasSearchChoices(object) {
    const search = objectSearch(object);
    if (!search || object?.consumed) return false;
    return searchMethods(search)
      .filter((method) => this._meetsConditions(method.conditions))
      .filter((method) => !searchMethodCompleted(object, method))
      .some((method) => searchMethodStatus(method, {
        inventory: this.inventory,
        fieldRating: (fieldId) => this._fieldRating(fieldId),
        primaryRating: (primaryId) => this._primaryRating(primaryId)
      }).available);
  }

  _openSearchDialogue(object, leadLines = []) {
    const search = objectSearch(object);
    if (!search) return;

    const bodyLines = [
      ...[].concat(leadLines ?? []).filter(Boolean),
      ...searchLines(search)
    ];
    const searchChoices = searchMethods(search)
      .filter((method) => this._meetsConditions(method.conditions))
      .filter((method) => !searchMethodCompleted(object, method))
      .map((method) => ({
        method,
        status: searchMethodStatus(method, {
          inventory: this.inventory,
          fieldRating: (fieldId) => this._fieldRating(fieldId),
          primaryRating: (primaryId) => this._primaryRating(primaryId)
        })
      }))
      .filter(({ status }) => status.available)
      .slice(0, DIALOGUE_MAX_CHOICES - 2)
      .map(({ method, status }) => ({
        label: this._searchChoiceLabel(method, status),
        searchAction: { object, methodId: method.id },
        close: false
      }));

    const choices = [
      ...searchChoices,
      {
        label: this._searchUseLabel(object, search),
        searchAction: { object, useObject: true },
        close: false
      },
      { label: this._searchLeaveLabel(search), close: true }
    ];

    this._setDialogueState({
      id: '__search__',
      title: searchTitle(search, this._objectName(object)),
      kind: 'search',
      lines: bodyLines,
      choices,
      scroll: 0,
      options: choices.map((choice, index) => `${index + 1}. ${choice.label}`)
    });
  }

  _searchChoiceLabel(method, status) {
    const base = method.label ?? 'Search';
    const check = status?.check;
    if (!check) return base;
    const label = check.kind === 'primary'
      ? this._primaryLabel(check.id)
      : this._fieldLabel(check.id);
    return `${base} (${label} ${check.rating} of ${check.dc})`;
  }

  _searchUseLabel(object, search) {
    if (typeof search?.useLabel === 'string' && search.useLabel.trim() !== '') return search.useLabel;
    const name = this._objectName(object);
    if (object?.interact?.type === 'container') return `Loot ${name}`;
    if (object?.interact?.type === 'secret-entrance' || object?.interact?.type === 'secret-exit') return `Use ${name}`;
    return `Inspect ${name}`;
  }

  _searchLeaveLabel(search) {
    return typeof search?.leaveLabel === 'string' && search.leaveLabel.trim() !== ''
      ? search.leaveLabel
      : 'Leave it';
  }

  _chooseSearchOption(action) {
    const object = action?.object;
    if (!object) {
      this._closeUiScreen();
      return;
    }
    if (action.useObject) {
      this._closeUiScreen();
      this._interactWithObject(object, { bypassSearch: true });
      return;
    }

    const method = searchMethodById(objectSearch(object), action.methodId);
    const result = resolveSearchMethod(method, {
      inventory: this.inventory,
      fieldRating: (fieldId) => this._fieldRating(fieldId),
      primaryRating: (primaryId) => this._primaryRating(primaryId),
      itemName: (itemId) => this.inventory.displayName(itemId)
    });
    // Search completion and its effects are one transaction. DialogueEffects
    // owns the inventory preflight; check it before recording completion so a
    // full pack or missing requireAll item leaves the method retryable.
    if (result.completed && !this.dialogueEffects.canApplyInventoryEffects(result.effects?.inventory)) return;
    if (result.completed) completeSearchMethod(object, method);
    for (const line of result.logs) this._log(line);

    const didTransition = this._applyEffects(result.effects);
    if (didTransition) return;

    this._openSearchDialogue(object, result.logs);
  }

}

installGameUiScreens(Game);
installGameInventoryScreen(Game);
installGameDialogueRuntime(Game);
installGameCombatRuntime(Game);
installGameMovementRuntime(Game);
installGameRuntimeState(Game);
installGameRenderState(Game);
installGameDroneRuntime(Game);
installGameDroneCombatRuntime(Game);
installGameCombatAbilityRuntime(Game);
installGameSaveRuntime(Game);
