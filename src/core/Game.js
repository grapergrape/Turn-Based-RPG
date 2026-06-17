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
import { TurnManager } from '../combat/TurnManager.js';
import { CombatSystem, manhattan, chebyshev } from '../combat/CombatSystem.js';
import { planTurn, flavorLine } from '../combat/EnemyAI.js';
import { findPath } from '../world/Pathfinder.js';
import { InteractionSystem } from '../world/InteractionSystem.js';
import { IsometricRenderer } from '../render/IsometricRenderer.js';
import { gridToScreen, screenFacing } from '../render/isoMath.js';
import { DEBUG_GRID_DEFAULT, VIEWPORT_HEIGHT } from '../render/renderConfig.js';

const STEP_DURATION = 0.64;
const ENEMY_ACTION_DELAY = 0.2;
const EFFECT_LIFE = 0.45;
const ATTACK_ANIM = 0.5;
const HIT_ANIM = 0.24;
const TRIGGER_RADIUS = 2;
const AMBIENT_SPEECH_LIFE = 2.7;
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
  'prayer-lectern': 'Prayer Lectern',
  'ritual-bowl': 'Ritual Bowl',
  'cracked-column': 'Cracked Column',
  'quarantine-barricade': 'Quarantine Barricade',
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
  wall: 'Chapel Wall',
  'wall-broken': 'Broken Wall'
};

export class Game {
  constructor({ canvas, levelPath, atlas, statusElement }) {
    this.canvas = canvas;
    this.levelPath = levelPath;
    this.atlas = atlas;
    this.statusElement = statusElement;

    this.input = new Input(canvas);
    this.renderer = new IsometricRenderer(canvas, atlas);
    this.combat = new CombatSystem();
    this.turnManager = new TurnManager();

    this.debugGrid = DEBUG_GRID_DEFAULT;
    this.introSeen = false; // the opening writ shows once per session, not on R
    this.levelStateByPath = new Map();
    this.loop = new GameLoop({
      update: (dt) => this.update(dt),
      render: () => this.render()
    });
    this.ready = false;
  }

  // (Re)load the level and reset runtime state. Level transitions preserve the
  // run state; restarts intentionally start clean.
  async boot(options = {}) {
    this.ready = false;
    if (!options.preserveRun) this.levelStateByPath = new Map();

    const previousInventory = options.preserveRun ? this.inventory : null;
    const previousQuestStages = options.preserveRun && this.questStages
      ? new Map(this.questStages)
      : null;
    const previousPlayer = options.preserveRun && this.player
      ? { hp: this.player.hp, maxHp: this.player.maxHp }
      : null;

    const level = await loadLevel(this.levelPath);
    this.level = level;
    this.grid = level.grid;
    this.player = level.player;
    this.enemies = level.enemies;
    if (previousPlayer) {
      const hpRatio = previousPlayer.maxHp > 0 ? previousPlayer.hp / previousPlayer.maxHp : 1;
      this.player.hp = Math.max(1, Math.min(this.player.maxHp, Math.round(this.player.maxHp * hpRatio)));
    }

    this.inventory = new Inventory({ ...(previousInventory?.itemDefs ?? {}), ...level.itemDefs });
    if (previousInventory) {
      for (const [itemId, count] of previousInventory.counts) {
        this.inventory.add(itemId, count);
      }
    }
    this.interactions = new InteractionSystem(level.interactables);
    // Props that murmur on their own (e.g. the crucified Opened Saint) get the
    // same ambient-speech treatment as enemies, on a staggered timer.
    this.speakingProps = (level.props ?? []).filter(
      (prop) => Array.isArray(prop.ambient) && prop.ambient.length > 0
    );
    for (const prop of this.speakingProps) {
      prop.ambientIndex = 0;
      prop.ambientTimer = 2 + ((prop.x + prop.y) % 4) * 1.1;
      prop.speech = null;
    }
    this.dialogueDefs = level.dialogueDefs ?? {};
    this.questDefs = level.questDefs ?? {};
    this.questStages = new Map();
    this.appliedLevelEvents = new Set();
    this.activeEncounter = null;
    this.clearedEncounters = new Set();

    this.mode = 'explore';
    this.log = [];
    this.effects = [];
    this.moving = null;
    this.pathQueue = [];
    this.uiScreen = null;
    this.dialogue = null;
    this.briefing = null;
    this.briefingPage = 0;
    this.anim = { tick: 0, bob: 0, flicker: 0, pulse: 0 };

    this.selectedAttackId = this.player.attacks[0]?.id ?? null;
    this.targetIndex = 0;
    this.enemyActions = null;
    this.enemyActor = null;
    this.actionTimer = 0;

    this.#restoreLevelState();
    if (options.player) this.#teleportPlayer(options.player);
    this.renderer.rebuildStaticScene({ grid: this.grid, props: this.level.props, mood: this.level.mood });

    this.#log(level.intro || level.name);
    this.#startQuests(previousQuestStages);
    this.#log('Explore the chapel. E inspect, I pack, H bind wounds.');

    // The opening writ plays once, on a fresh start (not on level transitions
    // or R restarts), before the player is dropped into the chapel.
    if (!this.introSeen && !options.preserveRun && Array.isArray(level.briefing) && level.briefing.length) {
      this.mode = 'intro';
      this.briefing = level.briefing;
      this.briefingTitle = level.briefingTitle ?? 'FIELD WRIT';
      this.briefingPage = 0;
    }
    this.ready = true;
  }

  start() {
    this.loop.start();
  }

  get actors() {
    return [this.player, ...this.enemies];
  }

  // ---- Main update -------------------------------------------------------

  update(dt) {
    if (!this.ready) return;

    this.#advanceAnim(dt);
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
    this.introSeen = true;
    this.briefing = null;
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
    if (click) this.#handleClickMove(click, false);
    for (const action of actions) {
      if (DIRS[action]) {
        this.pathQueue = []; // manual step overrides any click path
        this.#tryStep(this.player, DIRS[action], { logBlock: true });
        return; // one step per update; trigger check runs on completion
      }
      switch (action) {
        case 'interact':
        case 'confirm':
          this.#doInteract();
          break;
        case 'inventory':
          this.#toggleInventory();
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

  #doInteract() {
    const object = this.interactions.findInReach(this.player);
    if (!object) {
      this.#log('Nothing within reach.');
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

  // ---- UI screens --------------------------------------------------------

  #handleUiScreen(actions, click) {
    if (click) return;
    if (this.uiScreen === 'dialogue') {
      this.#handleDialogueScreen(actions);
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
  }

  #openDialogue(title, lines, kind = 'inspect') {
    const cleanLines = [].concat(lines ?? []).filter(Boolean);
    if (cleanLines.length === 0) return;
    this.uiScreen = 'dialogue';
    this.dialogue = {
      title,
      kind,
      lines: cleanLines,
      choices: [],
      scroll: 0,
      options: ['ENTER CLOSE', 'ESC CLOSE']
    };
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
    const node = definition.nodes?.[nodeId];
    if (!node) {
      this.#log(`Missing dialogue node: ${definition.id}.${nodeId}.`);
      return;
    }
    const lines = [].concat(node.lines ?? node.text ?? []).filter(Boolean);
    const choices = (node.choices ?? []).slice(0, 2);
    this.uiScreen = 'dialogue';
    this.dialogue = {
      id: definition.id,
      nodeId,
      title: node.title ?? definition.title ?? 'Inspect',
      kind: 'dialogue',
      lines,
      choices,
      scroll: 0,
      options: choices.length > 0
        ? choices.map((choice, index) => `${index + 1} ${choice.label}`)
        : ['ENTER CLOSE', 'ESC CLOSE']
    };
  }

  #handleDialogueScreen(actions) {
    const choices = this.dialogue?.choices ?? [];
    for (const action of actions) {
      if (action === 'up') {
        this.dialogue.scroll = Math.max(0, (this.dialogue.scroll ?? 0) - 1);
        continue;
      }
      if (action === 'down') {
        this.dialogue.scroll = Math.min(this.dialogue.maxScroll ?? 0, (this.dialogue.scroll ?? 0) + 1);
        continue;
      }
      if (choices.length > 0) {
        // 1 / melee, or Enter / Space / E, all take the first (default) option;
        // 2 / sidearm takes the second. Destructive choices are authored second
        // so the forgiving default key never triggers them by accident.
        if (action === 'melee' || action === 'confirm' || action === 'interact') {
          this.#chooseDialogueOption(0);
          return;
        }
        if (action === 'sidearm') {
          this.#chooseDialogueOption(1);
          return;
        }
        if (action === 'cancel') {
          this.#closeUiScreen();
          return;
        }
      } else if (action === 'cancel' || action === 'confirm' || action === 'interact') {
        this.#closeUiScreen();
        return;
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

  #chooseDialogueOption(index) {
    const choice = this.dialogue?.choices?.[index];
    if (!choice) return;
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
    this.#applyQuestUpdate(effects.questUpdate);
    if (effects.kill) this.#silenceProp(effects.kill);
    if (effects.teleport) this.#teleportPlayer(effects.teleport);
    if (effects.loadLevel) {
      void this.#transitionLevel(effects.loadLevel);
      return true;
    }
    return false;
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
    const activeEnemies = this.#activeEncounterEnemies();
    const outcome = this.combat.outcome(this.player, activeEnemies);
    if (outcome === 'victory') {
      this.turnManager.active = false;
      if (this.activeEncounter) this.clearedEncounters.add(this.activeEncounter);
      this.activeEncounter = null;
      this.enemyActions = null;
      this.enemyActor = null;

      if (this.enemies.some((enemy) => !enemy.isDead)) {
        this.mode = 'explore';
        this.#log('The immediate fight breaks. Other voices still move in the ruins.');
        return;
      }

      this.mode = 'victory';
      this.#log('The chapel falls quiet. No cultist answers the bells now.');
      if (this.level.onVictory?.questUpdate && !this.appliedLevelEvents.has('victory')) {
        this.appliedLevelEvents.add('victory');
        this.#applyQuestUpdate(this.level.onVictory?.questUpdate);
      }
      this.#log('Explore on, or press R to begin again.');
    } else if (outcome === 'defeat') {
      this.mode = 'defeat';
      this.turnManager.active = false;
      this.player.render.state = 'dead';
      this.#log('Mara Vey falls on the chapel stone. Press R to try again.');
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
      : this.#livingEnemies().map((enemy) => `${enemy.name} advances.`);
    for (const line of introLines) this.#log(line);
  }

  // ---- Movement ----------------------------------------------------------

  // Begin a stepped move of `actor` by `dir` if the destination is free.
  // Returns true if a step started.
  #tryStep(actor, dir, { logBlock = false } = {}) {
    if (this.moving) return false;
    const nx = actor.position.x + dir.x;
    const ny = actor.position.y + dir.y;
    if (!this.grid.isWalkable(nx, ny) || this.#isOccupied(nx, ny, actor)) {
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
    if (!this.grid.isWalkable(cell.x, cell.y)) return;
    const path = findPath(this.grid, this.player.position, cell, this.#occupiedSet(this.player));
    this.pathQueue = path && path.length ? path : [];
  }

  #onStepComplete(actor) {
    if (actor === this.player && this.mode === 'explore') {
      this.#checkCombatProximity();
    }
  }

  #checkCombatProximity() {
    for (const trigger of this.level.combatTriggers ?? []) {
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
      const radius = enemy.aggroRadius ?? TRIGGER_RADIUS;
      if (manhattan(this.player.position, enemy.position) <= radius) {
        this.#startCombat(encounterId);
        return;
      }
    }
  }

  // ---- Animation & effects ----------------------------------------------

  #advanceAmbientSpeech(dt) {
    for (const enemy of this.enemies) {
      if (enemy.speech) {
        enemy.speech.ttl -= dt;
        if (enemy.speech.ttl <= 0) enemy.speech = null;
      }
    }
    for (const prop of this.speakingProps ?? []) {
      if (prop.speech) {
        prop.speech.ttl -= dt;
        if (prop.speech.ttl <= 0) prop.speech = null;
      }
    }

    if (this.mode !== 'explore' || this.uiScreen) return;

    for (const enemy of this.enemies) {
      if (enemy.isDead || !Array.isArray(enemy.ambient) || enemy.ambient.length === 0) continue;
      if (manhattan(this.player.position, enemy.position) > 10) continue;

      enemy.ambientTimer = (enemy.ambientTimer ?? 1) - dt;
      if (enemy.ambientTimer > 0) continue;

      const index = enemy.ambientIndex ?? 0;
      enemy.speech = { text: enemy.ambient[index % enemy.ambient.length], ttl: AMBIENT_SPEECH_LIFE };
      enemy.ambientIndex = index + 1;
      enemy.ambientTimer = 5.5 + ((index + enemy.x + enemy.y) % 3) * 1.2;
    }

    for (const prop of this.speakingProps ?? []) {
      if (prop.killed || prop.speech) continue;
      if (manhattan(this.player.position, prop) > 11) continue;
      prop.ambientTimer = (prop.ambientTimer ?? 1) - dt;
      if (prop.ambientTimer > 0) continue;
      const index = prop.ambientIndex ?? 0;
      prop.speech = { text: prop.ambient[index % prop.ambient.length], ttl: AMBIENT_SPEECH_LIFE + 1.4 };
      prop.ambientIndex = index + 1;
      prop.ambientTimer = 6.5 + ((index + prop.x + prop.y) % 3) * 1.3;
    }
  }

  #advanceAnim(dt) {
    this.anim.tick += dt;
    this.anim.idleFrame = Math.floor(this.anim.tick / 0.35) % 4;
    this.anim.bob = Math.floor(this.anim.tick / 0.5) % 2;
    this.anim.flicker = Math.floor(this.anim.tick / 0.13) % 2;
    this.anim.pulse = Math.floor(this.anim.tick / 0.6) % 2;
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
      (actor) => actor !== exclude && !actor.isDead && actor.position.x === x && actor.position.y === y
    );
  }

  #occupiedSet(exclude) {
    const set = new Set();
    for (const actor of this.actors) {
      if (actor === exclude || actor.isDead) continue;
      set.add(`${actor.position.x},${actor.position.y}`);
    }
    return set;
  }

  #livingEnemies() {
    if (this.mode === 'combat' && this.activeEncounter) {
      return this.#livingEnemiesForEncounter(this.activeEncounter);
    }
    return this.enemies.filter((enemy) => !enemy.isDead);
  }

  #livingEnemiesForEncounter(encounterId) {
    const resolved = this.#resolveEncounterId(encounterId);
    return this.enemies.filter((enemy) =>
      !enemy.isDead && this.#resolveEncounterId(enemy.encounter) === resolved
    );
  }

  #activeEncounterEnemies() {
    if (!this.activeEncounter) return this.#livingEnemies();
    return this.#livingEnemiesForEncounter(this.activeEncounter);
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

  #startQuests(previousStages = null) {
    for (const quest of Object.values(this.questDefs)) {
      const stage = previousStages?.get(quest.id) ?? quest.initialStage ?? quest.stages?.[0]?.id ?? 'active';
      this.questStages.set(quest.id, stage);
      this.#log(`Quest: ${quest.title}.`);
      const description = this.#questStageDescription(quest.id, stage);
      if (description) this.#log(description);
    }
  }

  #applyQuestUpdate(update) {
    if (!update?.quest || !update.stage) return;
    const quest = this.questDefs[update.quest];
    const current = this.questStages.get(update.quest);
    if (!quest || current === update.stage) return;
    this.questStages.set(update.quest, update.stage);
    if (update.log) this.#log(update.log);
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
    const killedObjects = new Set(
      (this.level.interactables ?? [])
        .filter((object) => object.killed)
        .map((object) => this.#objectStateKey(object))
    );
    this.levelStateByPath.set(this.levelPath, {
      consumedObjects,
      killedObjects,
      deadEnemies,
      clearedEncounters: new Set(this.clearedEncounters ?? [])
    });
  }

  #restoreLevelState() {
    const state = this.levelStateByPath.get(this.levelPath);
    if (!state) return;

    for (const object of this.level.interactables ?? []) {
      const key = this.#objectStateKey(object);
      if (state.killedObjects?.has(key)) {
        object.killed = true;
        object.consumed = true;
        object.ambient = [];
      }
      if (!state.consumedObjects?.has(key)) continue;
      object.consumed = true;
      object.opened = true;
    }
    for (const enemy of this.enemies) {
      if (!state.deadEnemies?.has(enemy.spawnId ?? enemy.id)) continue;
      enemy.hp = 0;
      enemy.isDead = true;
      enemy.render.state = 'dead';
      enemy.render.frameIndex = DEATH_FRAMES - 1;
    }
    this.clearedEncounters = new Set(state.clearedEncounters ?? []);
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
        pageCount: this.briefing?.length ?? 0
      });
      return;
    }
    this.renderer.renderFrame({
      focus: { x: this.player.x, y: this.player.y, pxOffset: this.player.pxOffset },
      actors: this.actors,
      ambientSpeakers: this.speakingProps ?? [],
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
      if (hover && this.grid.isWalkable(hover.x, hover.y) &&
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
    if (!cell || !this.grid.isWalkable(cell.x, cell.y)) return null;
    return `${cell.x},${cell.y}`;
  }

  #hoverCell() {
    const mouse = this.input.mouse;
    if (!mouse || mouse.y >= VIEWPORT_HEIGHT) return null;
    const cell = this.renderer.toGrid(mouse.x, mouse.y);
    return this.grid.isInside(cell.x, cell.y) ? cell : null;
  }

  #actorAtCell(cell) {
    return this.actors.find((actor) => !actor.isDead && actor.x === cell.x && actor.y === cell.y) ?? null;
  }

  #objectAtCell(cell) {
    const interactable = this.level.interactables.find((object) => object.x === cell.x && object.y === cell.y);
    if (interactable) return interactable;
    return [...this.level.props].reverse().find((object) => object.x === cell.x && object.y === cell.y) ?? null;
  }

  #objectName(object) {
    if (!object) return 'Unknown';
    if (object.name) return object.name;
    return OBJECT_NAMES[object.kind] ?? String(object.kind ?? 'Object').replaceAll('-', ' ');
  }

  #cursorInfo() {
    const mouse = this.input.mouse;
    if (!mouse) return null;
    if (mouse.y >= VIEWPORT_HEIGHT) {
      return { x: mouse.x, y: mouse.y, state: 'ui', text: null };
    }

    const cell = this.#hoverCell();
    if (!cell) return { x: mouse.x, y: mouse.y, state: 'blocked', text: 'OUT OF BOUNDS' };

    const actor = this.#actorAtCell(cell);
    if (actor === this.player) {
      return { x: mouse.x, y: mouse.y, state: 'talk', text: `TALK: ${actor.name}` };
    }
    if (actor) {
      const state = this.mode === 'combat' ? 'attack' : 'inspect';
      const verb = this.mode === 'combat' ? 'ATTACK' : 'LOOK';
      return { x: mouse.x, y: mouse.y, state, text: `${verb}: ${actor.name}` };
    }

    const object = this.#objectAtCell(cell);
    if (object) {
      const name = this.#objectName(object);
      if (object.interact?.type === 'container' && !object.consumed) {
        return { x: mouse.x, y: mouse.y, state: 'loot', text: `LOOT: ${name}` };
      }
      if (object.interact?.type === 'altar') {
        return { x: mouse.x, y: mouse.y, state: 'use', text: `USE: ${name}` };
      }
      if (object.interact?.type === 'secret-entrance' || object.interact?.type === 'secret-exit') {
        return { x: mouse.x, y: mouse.y, state: 'use', text: `USE: ${name}` };
      }
      if (object.kind === 'cross-martyr' && !object.consumed) {
        return { x: mouse.x, y: mouse.y, state: 'use', text: `APPROACH: ${name}` };
      }
      if (object.kind !== 'wall') {
        return { x: mouse.x, y: mouse.y, state: 'inspect', text: `INSPECT: ${name}` };
      }
    }

    if (this.grid.isWalkable(cell.x, cell.y)) {
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

  #buildUi() {
    const target = this.#currentTarget();
    const attack = this.player.getAttack(this.selectedAttackId);
    const modeLabel = { explore: 'EXPLORE', combat: 'COMBAT', victory: 'VICTORY', defeat: 'DEFEAT' }[this.mode];

    let controls;
    if (this.uiScreen === 'inventory') {
      controls = ['I/ESC Close', 'H Use Dressing', 'R Restart'];
    } else if (this.uiScreen === 'dialogue' && this.dialogue?.choices?.length) {
      controls = ['1/2 or Enter Choose', 'Esc Close', 'I Pack'];
    } else if (this.uiScreen === 'dialogue') {
      controls = ['Enter Close', 'Esc Close', 'I Pack'];
    } else if (this.mode === 'combat') {
      controls = ['Click/WASD Move', '1 Knife 2 Gun', 'Tab Target', 'Space Attack', 'E End Turn', 'I Pack', 'H Dress'];
    } else {
      controls = ['Click/WASD Move', 'E Inspect/Use', 'I Pack', 'H Dressing', 'R Restart', 'G Debug'];
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
      screen: this.uiScreen,
      dialogue: this.dialogue,
      hoverText: cursor?.text ?? null,
      cursor,
      log: this.log,
      controls
    };
  }
}
