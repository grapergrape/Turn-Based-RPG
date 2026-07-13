import assert from 'node:assert/strict';

import { Game } from '../src/core/Game.js';
import { Entity } from '../src/entities/Entity.js';
import { Grid } from '../src/world/Grid.js';

function mockCanvas() {
  return {
    width: 640,
    height: 480,
    style: {},
    addEventListener() {},
    getBoundingClientRect() { return { left: 0, top: 0, width: 640, height: 480 }; },
    getContext() { return mockCtx(); }
  };
}

function mockCtx() {
  return new Proxy({ imageSmoothingEnabled: false }, {
    get(target, prop) {
      if (prop in target) return target[prop];
      return () => {};
    },
    set(target, prop, value) {
      target[prop] = value;
      return true;
    }
  });
}

function mockInventory() {
  return {
    summary: () => 'Pack 0/10 kg',
    entries: () => [],
    count: () => 0,
    equipmentEntries: () => [],
    currentWeight: () => 0,
    maxCarryWeight: 10,
    useFieldDressing: () => 'No field dressing remains.'
  };
}

globalThis.window = { addEventListener() {} };
globalThis.document = { createElement: () => mockCanvas() };

function makeGame() {
  const game = new Game({
    canvas: mockCanvas(),
    levelPath: './data/levels/ash_chapel_breach.json',
    atlas: null,
    statusElement: null,
    bootOptions: { skipIntro: true }
  });
  const level = {
    id: 'pre-combat-targeting-test',
    name: 'Pre Combat Targeting Test',
    width: 6,
    height: 4,
    tileSize: 64,
    tiles: ['......', '......', '......', '......'],
    legend: { '.': { kind: 'floor', walkable: true } },
    combatTriggers: [],
    combatStartBarks: ['Hold the aisle.'],
    interactables: [],
    props: [],
    mood: null
  };
  const player = new Entity({
    id: 'mara-vey',
    name: 'Mara Vey',
    type: 'player',
    stats: { hp: 14, maxHp: 14, actionPoints: 6 },
    attacks: [{ id: 'melee', name: 'Knife', apCost: 1, damage: 3, range: 1 }],
    position: { x: 1, y: 1 },
    progression: { level: 1, build: 'field-agent' }
  });
  const target = new Entity({
    id: 'choir-cutthroat',
    name: 'Choir Cutthroat',
    type: 'enemy',
    stats: { hp: 8, maxHp: 8, actionPoints: 4 },
    attacks: [{ id: 'knife', name: 'Knife', apCost: 1, damage: 2, range: 1 }],
    position: { x: 2, y: 1 }
  });
  target.encounter = 'room-a';
  const watcher = new Entity({
    id: 'choir-watcher',
    name: 'Choir Watcher',
    type: 'enemy',
    stats: { hp: 8, maxHp: 8, actionPoints: 4 },
    attacks: [{ id: 'knife', name: 'Knife', apCost: 1, damage: 2, range: 1 }],
    position: { x: 4, y: 1 }
  });
  watcher.encounter = 'room-b';
  watcher.facing = 'nw';
  watcher.perception = { visionRadius: 6, coneDegrees: 120 };

  let gridPoint = { x: 2, y: 1 };
  let frame = null;
  game.ready = true;
  game.anim = { tick: 0, bob: 0, flicker: 0, pulse: 0 };
  game.areaTitleTimer = 0;
  game.effects = [];
  game.speakingProps = [];
  game.player = player;
  game.enemies = [target, watcher];
  game.npcs = [];
  game.groundItems = [];
  game.grid = new Grid(level);
  game.hiddenTiles = new Set();
  game.moving = null;
  game.pathQueue = [];
  game.pendingExploreTarget = null;
  game.preCombatTarget = null;
  game.mode = 'explore';
  game.sneakMode = true;
  game.uiScreen = null;
  game.dialogue = null;
  game.log = [];
  game.level = level;
  game.inventory = mockInventory();
  game.inventoryOrder = [];
  game.inventoryMoveIndex = null;
  game.inventoryActionMenu = null;
  game.inventorySplit = null;
  game.inventoryFocus = 'items';
  game.inventoryIndex = 0;
  game.equipmentIndex = 0;
  game.appliedLevelEvents = new Set();
  game.clearedEncounters = new Set();
  game.awardedQuestXp = new Set();
  game.renderer = {
    toGrid: () => ({ ...gridPoint }),
    renderFrame: (payload) => { frame = payload; },
    rebuildStaticScene() {}
  };

  return {
    game,
    target,
    watcher,
    setGridPoint(point) { gridPoint = { ...point }; },
    frame: () => frame
  };
}

{
  const { game, target, watcher, frame } = makeGame();
  const clicks = [{ x: 320, y: 180, button: 2, shiftKey: false, ctrlKey: false }];
  let actions = [];
  game.input = {
    consume: () => actions.shift() ?? [],
    consumeClick: () => clicks.shift() ?? null,
    isHeld: () => false
  };

  game.update(0);
  assert.equal(game.preCombatTarget, target);
  assert.equal(game.mode, 'explore');
  game.player.ap = 0;

  game.render();
  assert.equal(frame().overlay.targetTile, '2,1');
  assert.equal(frame().ui.target, 'Cutthroat 8/8');
  assert.equal(frame().ui.action, 'Knife 95% D5');
  assert.equal(frame().ui.actionName, 'Knife');
  assert.equal(frame().ui.actionChance, '95%');
  assert.equal(frame().ui.actionDamage, 'D5');
  assert.equal(frame().ui.actionReason, '');
  target.name = 'Sava Rell';
  assert.equal(game._targetReadout(target, null), 'Sava Rell 8/8');
  target.name = 'Choir Cutthroat';
  assert.ok(frame().ui.controls.includes('Space Attack'));

  const previousRandom = Math.random;
  const rolls = [0, 0, 0.99, 0];
  Math.random = () => rolls.shift() ?? 0;
  try {
    actions = [['confirm']];
    game.update(0);
  } finally {
    Math.random = previousRandom;
  }

  assert.equal(target.hp, 3);
  assert.equal(game.mode, 'combat');
  assert.equal(game.activeEncounter, 'room-a');
  assert.equal(game.player.ap, game.player.maxAp);
  assert.equal(target.speech?.text, 'Hold the aisle.');
  assert.equal(watcher.speech?.text, undefined);
  assert.equal(game.turnManager.current(), target);
  assert.equal(watcher.encounter, 'room-a');
  assert.equal(game.turnManager.order.includes(watcher), true);
  assert.equal(game.preCombatTarget, null);
  assert.ok(game.log.some((line) => line.includes('Sneak attack hit. Chance 95%, roll 1. Sneak. 5 damage to Choir Cutthroat.')));
  assert.equal(game.log.some((line) => line.includes('Not enough AP for that attack.')), false);
  game.areaTitle = 'Listening Vault';
  game.areaTitleTimer = 1;
  game.render();
  assert.equal(frame().ui.areaTitle, null, 'combat should suppress a stale area title');
}

{
  const { game, target } = makeGame();
  game.sneakMode = false;
  const clicks = [{ x: 320, y: 180, button: 2, shiftKey: false, ctrlKey: false }];
  let actions = [];
  game.input = {
    consume: () => actions.shift() ?? [],
    consumeClick: () => clicks.shift() ?? null,
    isHeld: () => false
  };

  game.update(0);
  game.player.ap = 0;
  const previousRandom = Math.random;
  Math.random = () => 0;
  try {
    actions = [['confirm']];
    game.update(0);
  } finally {
    Math.random = previousRandom;
  }

  assert.equal(target.hp, 5);
  assert.equal(game.mode, 'combat');
  assert.equal(game.player.ap, game.player.maxAp);
  assert.ok(game.log.some((line) => line.includes("Mara Vey's Knife hit. Chance 70%, roll 1. 3 damage to Choir Cutthroat.")));
  assert.equal(game.log.some((line) => line.includes('Not enough AP for that attack.')), false);
}

{
  const { game, target } = makeGame();
  const clicks = [{ x: 320, y: 180, button: 2, shiftKey: false, ctrlKey: false }];
  let actions = [];
  game.input = {
    consume: () => actions.shift() ?? [],
    consumeClick: () => clicks.shift() ?? null,
    isHeld: () => false
  };

  game.update(0);
  const previousRandom = Math.random;
  Math.random = () => 0.99;
  try {
    actions = [['confirm']];
    game.update(0);
  } finally {
    Math.random = previousRandom;
  }

  assert.equal(target.hp, 8);
  assert.equal(game.mode, 'combat');
  assert.ok(game.log.some((line) => line.includes('Sneak attack missed. Chance 95%, roll 100. Sneak.')));
  assert.equal(game.effects.at(-1)?.text, 'MISS');
}
