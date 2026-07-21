import assert from 'node:assert/strict';

import { Game } from '../src/core/Game.js';
import { Inventory } from '../src/core/Inventory.js';
import { Entity } from '../src/entities/Entity.js';
import { inventoryActionBox, inventorySlotBox } from '../src/ui/inventoryLayout.js';

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
  'censure-field-coat': {
    name: 'Censure Field Coat',
    type: 'clothes',
    weight: 1.5,
    groundModel: 'coat',
    equipment: { slot: 'clothes' },
    description: 'Long black field coat.'
  }
};

const game = new Game({
  canvas: mockCanvas(),
  levelPath: './data/levels/ash_chapel_breach.json',
  atlas: null,
  statusElement: null,
  bootOptions: { skipIntro: true }
});
const player = new Entity({
  id: 'mara-vey',
  name: 'Test Agent',
  type: 'player',
  stats: { hp: 14, maxHp: 14, actionPoints: 6 },
  attacks: [{ id: 'melee', name: 'Knife', apCost: 1, damage: 3, range: 1 }],
  position: { x: 1, y: 1 },
  progression: { level: 1, xp: 0, build: 'field-agent' }
});
const inventory = new Inventory(itemDefs);
inventory.add('censure-field-coat', 1);
inventory.equip('censure-field-coat');

const slot = inventorySlotBox(0);
const equipAction = inventoryActionBox('equip', slot, { anchor: slot, canEquip: true, canUnequip: true, canSplit: false });
const clicks = [
  { x: slot.x + 4, y: slot.y + 4, button: 2, shiftKey: false, ctrlKey: false },
  { x: equipAction.x + 2, y: equipAction.y + 2, button: 0, shiftKey: false, ctrlKey: false }
];

game.ready = true;
game.anim = { tick: 0, bob: 0, flicker: 0, pulse: 0 };
game.areaTitleTimer = 0;
game.effects = [];
game.speakingProps = [];
game.player = player;
game.enemies = [];
game.npcs = [];
game.groundItems = [];
game.moving = null;
game.pathQueue = [];
game.pendingExploreTarget = null;
game.mode = 'explore';
game.uiScreen = 'inventory';
game.dialogue = null;
game.log = [];
game.inventory = inventory;
game.inventoryOrder = ['censure-field-coat'];
game.inventoryFocus = 'items';
game.inventoryIndex = 0;
game.equipmentIndex = 0;
game.level = { name: 'Test Level', interactables: [], props: [], mood: null };
game.questDefs = {};
game.questStages = new Map();
game.questReached = new Map();
game.awardedQuestXp = new Set();
game.appliedLevelEvents = new Set();
game.clearedEncounters = new Set();
game.input = {
  consume: () => [],
  consumeClick: () => clicks.shift() ?? null
};

game.update(0);
assert.equal(game.inventoryActionMenu?.itemId, 'censure-field-coat');
assert.equal(game.inventory.equipmentSnapshot().clothes, 'censure-field-coat');

game.update(0);
assert.equal(game.inventory.equipmentSnapshot().clothes, undefined);
