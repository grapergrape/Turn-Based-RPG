import assert from 'node:assert/strict';

import { Game } from '../src/core/Game.js';
import { Entity } from '../src/entities/Entity.js';
import { Grid } from '../src/world/Grid.js';
import { GROUND_ITEM_KIND } from '../src/world/GroundItems.js';

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
    maxCarryWeight: 10
  };
}

globalThis.window = { addEventListener() {} };
globalThis.document = { createElement: () => mockCanvas() };

const level = {
  id: 'nearby-action-hint-test',
  name: 'Nearby Action Hint Test',
  width: 6,
  height: 4,
  tileSize: 64,
  tiles: ['......', '......', '......', '......'],
  legend: { '.': { kind: 'floor', walkable: true } },
  combatTriggers: [],
  combatStartBarks: ['Hold.'],
  interactables: [],
  props: [],
  mood: null
};

function makePlayer() {
  const player = new Entity({
    id: 'mara-vey',
    name: 'Mara Vey',
    type: 'player',
    stats: { hp: 14, maxHp: 14, actionPoints: 6 },
    attacks: [{ id: 'knife', name: 'Knife', apCost: 1, damage: 3, range: 1 }],
    position: { x: 1, y: 1 },
    progression: { level: 1, build: 'field-agent' }
  });
  player.facing = 'se';
  return player;
}

function makeGame({ interactables = [], npcs = [], groundItems = [] } = {}) {
  const game = new Game({
    canvas: mockCanvas(),
    levelPath: './data/levels/ash_chapel_breach.json',
    atlas: null,
    statusElement: null,
    bootOptions: { skipIntro: true }
  });
  game.ready = true;
  game.anim = { tick: 0, bob: 0, flicker: 0, pulse: 0 };
  game.areaTitleTimer = 0;
  game.effects = [];
  game.speakingProps = [];
  game.player = makePlayer();
  game.enemies = [];
  game.npcs = npcs;
  game.groundItems = groundItems;
  game.grid = new Grid(level);
  game.hiddenTiles = new Set();
  game.moving = null;
  game.pathQueue = [];
  game.pendingExploreTarget = null;
  game.preCombatTarget = null;
  game.mode = 'explore';
  game.sneakMode = false;
  game.uiScreen = null;
  game.dialogue = null;
  game.log = [];
  game.inventory = mockInventory();
  game.inventoryOrder = [];
  game.level = { ...level, interactables };
  game.questDefs = {};
  game.questStages = new Map();
  game.questReached = new Map();
  game.flags = new Set();
  game.codexDefs = [];
  game.journalNotes = [];
  game.clearedEncounters = new Set();
  game.contextActionMenu = null;
  game.input = { mouse: null };
  return game;
}

{
  const note = {
    id: 'warden-note',
    kind: 'paper-scraps',
    name: 'Warden Note',
    x: 2,
    y: 1,
    interact: { type: 'note' }
  };
  const game = makeGame({ interactables: [note] });
  assert.equal(game._buildUi().nearbyActionText, 'E INSPECT: Warden Note');
  assert.equal(game._buildOverlay().interactionTile, '2,1');
}

{
  const groundItem = {
    id: 'dropped-chit',
    kind: GROUND_ITEM_KIND,
    name: 'Road Chit',
    x: 1,
    y: 1,
    interact: { type: 'ground-item' }
  };
  const game = makeGame({ groundItems: [groundItem] });
  assert.equal(game._buildUi().nearbyActionText, 'E PICK UP: Road Chit');
  assert.equal(game._buildOverlay().interactionTile, '1,1');
}

{
  const wallDoor = {
    id: 'wall-door',
    kind: 'paper-scraps',
    name: 'Wall Door',
    x: 2,
    y: 1,
    interactionMarker: { x: 1, y: 0 },
    interact: { type: 'secret-entrance' }
  };
  const game = makeGame({ interactables: [wallDoor] });
  assert.equal(game._buildUi().nearbyActionText, 'E USE: Wall Door');
  assert.equal(game._buildOverlay().interactionTile, '1,0');
}

{
  const npc = {
    id: 'selka',
    name: 'Selka',
    x: 2,
    y: 1,
    position: { x: 2, y: 1 },
    dialogue: 'selka',
    dialogueRepeat: true
  };
  const game = makeGame({ npcs: [npc] });
  assert.equal(game._buildUi().nearbyActionText, 'E TALK: Selka');
  assert.equal(game._buildOverlay().interactionTile, '2,1');
}

{
  const game = makeGame();
  assert.equal(game._buildUi().nearbyActionText, null);
  assert.equal(game._buildOverlay().interactionTile, undefined);
}
