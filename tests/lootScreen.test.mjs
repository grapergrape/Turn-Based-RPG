import assert from 'node:assert/strict';

import { Game } from '../src/core/Game.js';
import { Inventory } from '../src/core/Inventory.js';
import { Entity } from '../src/entities/Entity.js';
import { InteractionSystem } from '../src/world/InteractionSystem.js';

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

globalThis.window = { addEventListener() {} };
globalThis.document = { createElement: () => mockCanvas() };

const itemDefs = {
  ducat: { name: 'Ducat', type: 'currency', rarity: 'common', weight: 0, groundModel: 'chit', description: 'Stamped trade coin.' },
  'field-dressing': { name: 'Field Dressing', type: 'consumable', rarity: 'rare', weight: 0.2, groundModel: 'dressing', description: 'Sterile dressing.' }
};

function buildLootGame({ actions, loot, inspect = null, maxCarryWeight = 10, startInLoot = true }) {
  const game = new Game({
    canvas: mockCanvas(),
    levelPath: './data/levels/ash_chapel_breach.json',
    atlas: null,
    statusElement: null,
    bootOptions: { skipIntro: true }
  });
  const player = new Entity({
    id: 'mara-vey',
    name: 'Mara Vey',
    type: 'player',
    stats: { hp: 14, maxHp: 14, actionPoints: 6 },
    attacks: [{ id: 'melee', name: 'Knife', apCost: 1, damage: 3, range: 1 }],
    position: { x: 1, y: 1 },
    progression: { level: 1, xp: 0, build: 'field-agent' }
  });
  const enemy = new Entity({
    id: 'dead-guard',
    name: 'Dead Guard',
    type: 'enemy',
    stats: { hp: 0, maxHp: 4, actionPoints: 0 },
    position: { x: 1, y: 2 }
  });
  enemy.isDead = true;
  enemy.loot = loot;
  enemy.inspect = inspect;

  game.ready = true;
  game.anim = { tick: 0, bob: 0, flicker: 0, pulse: 0 };
  game.areaTitleTimer = 0;
  game.effects = [];
  game.speakingProps = [];
  game.player = player;
  game.enemies = [enemy];
  game.npcs = [];
  game.groundItems = [];
  game.moving = null;
  game.pathQueue = [];
  game.pendingExploreTarget = null;
  game.mode = 'explore';
  game.uiScreen = startInLoot ? 'loot' : null;
  game.loot = startInLoot ? { title: enemy.name, sourceType: 'enemy', source: enemy } : null;
  game.lootIndex = 0;
  game.dialogue = null;
  game.log = [];
  game.inventory = new Inventory(itemDefs, { maxCarryWeight });
  game.inventoryOrder = [];
  game.level = { name: 'Test Level', interactables: [], props: [], mood: null };
  game.dialogueDefs = {
    'penitent-corpse': {
      id: 'penitent-corpse',
      title: 'The Turned Engine',
      nodes: { start: { lines: ['Steel remains under the bone growth.'] } }
    }
  };
  game.questDefs = {};
  game.questStages = new Map();
  game.questReached = new Map();
  game.awardedQuestXp = new Set();
  game.appliedLevelEvents = new Set();
  game.clearedEncounters = new Set();
  game.stealthRuntime = { registerSuspiciousAction: () => [] };
  game.input = {
    consume: () => actions.shift() ?? [],
    consumeClick: () => null
  };
  return { game, enemy };
}

{
  const { game, enemy } = buildLootGame({
    actions: [['confirm'], ['interact'], ['cancel']],
    loot: [{ item: 'field-dressing', count: 1 }],
    inspect: 'penitent-corpse',
    maxCarryWeight: 0.1,
    startInLoot: false
  });

  assert.deepEqual(
    game._targetActionInfo({ type: 'corpse', enemy }),
    { state: 'inspect', text: 'INSPECT: Dead Guard' }
  );
  game._interactWithCorpse(enemy);
  assert.equal(game.uiScreen, 'dialogue');
  assert.equal(game.dialogue.id, 'penitent-corpse');
  assert.equal(game.pendingLootAfterDialogue.source, enemy);

  game.update(0);
  assert.equal(game.uiScreen, 'loot');
  assert.equal(enemy.inspectShownBeforeLoot, true);
  assert.deepEqual(
    game._targetActionInfo({ type: 'corpse', enemy }),
    { state: 'loot', text: 'LOOT: Dead Guard' }
  );

  game.update(0);
  assert.equal(game.inventory.count('field-dressing'), 0);
  assert.equal(game.uiScreen, 'loot');
  assert.ok(game.log.some((line) => line.startsWith('Too much to carry.')));

  game.update(0);
  assert.equal(game.uiScreen, null);
}

function simpleGrid() {
  return {
    width: 8,
    height: 8,
    isInside: (x, y) => x >= 0 && y >= 0 && x < 8 && y < 8,
    isWalkable: () => true
  };
}

function buildObjectLootGame({ actions, clicks, object }) {
  const game = new Game({
    canvas: mockCanvas(),
    levelPath: './data/levels/ash_chapel_breach.json',
    atlas: null,
    statusElement: null,
    bootOptions: { skipIntro: true }
  });
  const player = new Entity({
    id: 'mara-vey',
    name: 'Mara Vey',
    type: 'player',
    stats: { hp: 14, maxHp: 14, actionPoints: 6 },
    attacks: [{ id: 'melee', name: 'Knife', apCost: 1, damage: 3, range: 1 }],
    position: { x: 2, y: 2 },
    progression: { level: 1, xp: 0, build: 'field-agent' }
  });

  game.ready = true;
  game.anim = { tick: 0, bob: 0, flicker: 0, pulse: 0 };
  game.areaTitleTimer = 0;
  game.effects = [];
  game.speakingProps = [];
  game.player = player;
  game.enemies = [];
  game.npcs = [];
  game.groundItems = [];
  game.grid = simpleGrid();
  game.hiddenTiles = new Set();
  game.moving = null;
  game.pathQueue = [];
  game.pendingExploreTarget = null;
  game.mode = 'explore';
  game.uiScreen = null;
  game.loot = null;
  game.lootIndex = 0;
  game.dialogue = null;
  game.dialogueActor = null;
  game.log = [];
  game.inventory = new Inventory(itemDefs, { maxCarryWeight: 10 });
  game.inventoryOrder = [];
  game.level = { name: 'Test Level', interactables: [object], props: [], mood: null };
  game.interactions = new InteractionSystem([object]);
  game.dialogueDefs = {
    'crate-readout': {
      id: 'crate-readout',
      title: 'Medicine Crate',
      nodes: {
        start: {
          lines: ['The crate label explains what is inside.']
        }
      }
    }
  };
  game.questDefs = {};
  game.questStages = new Map();
  game.questReached = new Map();
  game.awardedQuestXp = new Set();
  game.appliedLevelEvents = new Set();
  game.clearedEncounters = new Set();
  game.input = {
    consume: () => actions.shift() ?? [],
    consumeClick: () => clicks.shift() ?? null
  };
  return { game, object };
}

{
  const { game, enemy } = buildLootGame({
    actions: [['interact'], ['interact']],
    loot: [{ item: 'ducat', count: 2 }, { item: 'field-dressing', count: 1 }]
  });

  const entries = game._currentLootEntries();
  assert.equal(entries.find((entry) => entry.id === 'field-dressing').rarity, 'rare');
  assert.equal(entries.find((entry) => entry.id === 'field-dressing').rarityLabel, 'Rare');

  game.update(0);
  assert.equal(game.inventory.count('ducat'), 2);
  assert.equal(enemy.loot[0].count, 0);
  assert.equal(game.uiScreen, 'loot');

  game.update(0);
  assert.equal(game.inventory.count('field-dressing'), 1);
  assert.equal(enemy.lootClaimed, true);
  assert.equal(game.uiScreen, null);
}

{
  const { game, enemy } = buildLootGame({
    actions: [['left']],
    loot: [{ item: 'ducat', count: 3 }, { item: 'field-dressing', count: 1 }]
  });

  game.update(0);
  assert.equal(game.inventory.count('ducat'), 3);
  assert.equal(game.inventory.count('field-dressing'), 1);
  assert.equal(enemy.lootClaimed, true);
  assert.equal(game.uiScreen, null);
}

{
  const { game, enemy } = buildLootGame({
    actions: [['down'], ['interact']],
    loot: [{ item: 'ducat', count: 3 }, { item: 'field-dressing', count: 1 }]
  });

  game.update(0);
  assert.equal(game.lootIndex, 1);

  game.update(0);
  assert.equal(game.inventory.count('ducat'), 0);
  assert.equal(game.inventory.count('field-dressing'), 1);
  assert.equal(enemy.loot[0].count, 3);
  assert.equal(enemy.loot[1].count, 0);
  assert.equal(game.uiScreen, 'loot');
}

{
  const { game, enemy } = buildLootGame({
    actions: [['space']],
    loot: [{ item: 'ducat', count: 3 }]
  });

  game.update(0);
  assert.equal(game.inventory.count('ducat'), 0);
  assert.equal(enemy.loot[0].count, 3);
  assert.equal(enemy.lootClaimed, false);
  assert.equal(game.uiScreen, null);
}

{
  const object = {
    kind: 'medicine-crate',
    name: 'Medicine Crate',
    x: 3,
    y: 2,
    interact: {
      type: 'container',
      dialogue: 'crate-readout',
      log: 'A stamped crate waits under the bench.',
      loot: [{ item: 'field-dressing', count: 1 }]
    }
  };
  const { game } = buildObjectLootGame({
    actions: [[], ['confirm'], ['interact']],
    clicks: [{ x: 32, y: 80, button: 0 }],
    object
  });

  game.update(0);
  assert.equal(game.uiScreen, 'dialogue');
  assert.equal(game.dialogue.title, 'Medicine Crate');
  assert.equal(game.inventory.count('field-dressing'), 0);

  game.update(0);
  assert.equal(game.uiScreen, 'loot');
  assert.equal(game.inventory.count('field-dressing'), 0);

  game.update(0);
  assert.equal(game.inventory.count('field-dressing'), 1);
  assert.equal(object.consumed, true);
  assert.equal(game.uiScreen, null);
  assert.equal(game.log.filter((line) => line === 'A stamped crate waits under the bench.').length, 1);
}

{
  const object = {
    kind: 'medicine-crate',
    name: 'Medicine Crate',
    x: 3,
    y: 2,
    interact: {
      type: 'container',
      dialogue: 'crate-readout',
      loot: [{ item: 'field-dressing', count: 1 }]
    }
  };
  const { game } = buildObjectLootGame({
    actions: [[], ['cancel']],
    clicks: [{ x: 32, y: 80, button: 0 }],
    object
  });

  game.update(0);
  assert.equal(game.uiScreen, 'dialogue');

  game.update(0);
  assert.equal(game.uiScreen, null);
  assert.equal(game.inventory.count('field-dressing'), 0);
  assert.equal(object.consumed, undefined);
}
