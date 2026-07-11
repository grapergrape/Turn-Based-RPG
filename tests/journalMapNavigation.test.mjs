import assert from 'node:assert/strict';

import { Game } from '../src/core/Game.js';
import { JOURNAL_SECTIONS } from '../src/core/JournalState.js';
import { Entity } from '../src/entities/Entity.js';
import { Grid } from '../src/world/Grid.js';
import {
  JOURNAL_TECHNIQUE_LIST,
  journalMapCellAt,
  journalMapGridMetrics,
  journalTabBoxes
} from '../src/ui/journalLayout.js';

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

const level = {
  id: 'journal-map-navigation-test',
  name: 'Journal Map Navigation Test',
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
  return new Entity({
    id: 'mara-vey',
    name: 'Mara Vey',
    type: 'player',
    stats: { hp: 14, maxHp: 14, actionPoints: 6 },
    attacks: [{ id: 'knife', name: 'Knife', apCost: 1, damage: 3, range: 1 }],
    position: { x: 1, y: 1 },
    progression: { level: 1, build: 'field-agent' }
  });
}

function makeGame(exploredMapTiles = allCells()) {
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
  game.npcs = [];
  game.groundItems = [];
  game.grid = new Grid(level);
  game.hiddenTiles = new Set();
  game.hiddenTilesKey = 'ready';
  game.exploredMapTiles = new Set(exploredMapTiles);
  game.moving = null;
  game.pathQueue = [];
  game.pendingExploreTarget = null;
  game.preCombatTarget = null;
  game.mode = 'explore';
  game.sneakMode = false;
  game.uiScreen = null;
  game.dialogue = null;
  game.log = [];
  game.level = level;
  game.questDefs = {};
  game.questStages = new Map();
  game.questReached = new Map();
  game.flags = new Set();
  game.codexDefs = [];
  game.journalNotes = [];
  game.clearedEncounters = new Set();
  game.awardedQuestXp = new Set();
  game.inventoryOrder = [];
  game.contextActionMenu = null;
  game.renderer = {
    toGrid: () => ({ x: 1, y: 1 }),
    renderFrame() {},
    rebuildStaticScene() {}
  };
  game.input = {
    consume: () => [],
    consumeClick: () => null,
    consumeText: () => [],
    isHeld: () => false
  };
  return game;
}

function allCells() {
  const cells = [];
  for (let y = 0; y < level.height; y += 1) {
    for (let x = 0; x < level.width; x += 1) cells.push(`${x},${y}`);
  }
  return cells;
}

function openMap(game) {
  game.uiScreen = 'journal';
  game.journalSection = JOURNAL_SECTIONS.indexOf('MAP');
  game.journalTurn = null;
}

function mapClickFor(game, x, y) {
  const map = game._buildJournalMap();
  const metrics = journalMapGridMetrics(map);
  return {
    x: metrics.x + x * metrics.scaleX + Math.floor(metrics.scaleX / 2),
    y: metrics.y + y * metrics.scaleY + Math.floor(metrics.scaleY / 2),
    button: 0,
    shiftKey: false,
    ctrlKey: false
  };
}

{
  const roadMap = { width: 160, height: 70 };
  const metrics = journalMapGridMetrics(roadMap);
  assert.equal(metrics.scaleX, 1);
  assert.equal(metrics.scaleY, 3);

  const playerClick = {
    x: metrics.x + 142 * metrics.scaleX + Math.floor(metrics.scaleX / 2),
    y: metrics.y + 68 * metrics.scaleY + Math.floor(metrics.scaleY / 2)
  };
  assert.deepEqual(journalMapCellAt(playerClick, roadMap), { x: 142, y: 68, key: '142,68' });
  assert.ok(playerClick.y > metrics.y + metrics.h - 8);
}

{
  const game = makeGame();
  game._tryStep(game.player, { x: 1, y: 0 });
  let actions = [['map']];
  game.input = {
    consume: () => actions.shift() ?? [],
    consumeClick: () => null,
    consumeText: () => [],
    isHeld: () => false
  };

  game.update(0);

  assert.equal(game.uiScreen, 'journal');
  assert.equal(JOURNAL_SECTIONS[game.journalSection], 'MAP');
  assert.ok(game.moving, 'the current step remains in flight');
}

{
  const game = makeGame();
  openMap(game);

  game._handleJournalScreen([], mapClickFor(game, 3, 1));

  assert.equal(game.uiScreen, null);
  assert.deepEqual(game.pathQueue.map((cell) => `${cell.x},${cell.y}`), ['2,1', '3,1']);
}

{
  const explored = allCells().filter((key) => key !== '3,1');
  const game = makeGame(explored);
  openMap(game);

  game._handleJournalScreen([], mapClickFor(game, 3, 1));

  assert.equal(game.uiScreen, 'journal');
  assert.deepEqual(game.pathQueue, []);
}

{
  const explored = ['1,1', '3,1'];
  const game = makeGame(explored);
  openMap(game);

  game._handleJournalScreen([], mapClickFor(game, 3, 1));

  assert.equal(game.uiScreen, 'journal');
  assert.deepEqual(game.pathQueue, []);
}

{
  const game = makeGame();
  game.uiScreen = 'journal';
  game.journalSection = JOURNAL_SECTIONS.indexOf('QUESTS');
  game.journalTurn = null;
  const techniquesTab = journalTabBoxes(JOURNAL_SECTIONS.length)[JOURNAL_SECTIONS.indexOf('TECHNIQUES')];

  game._handleJournalScreen([], {
    x: techniquesTab.x + 3,
    y: techniquesTab.y + 3,
    button: 0
  });

  assert.equal(game.journalTurn?.to, JOURNAL_SECTIONS.indexOf('TECHNIQUES'));
  game._advanceJournalTurn(game.journalTurn.duration);
  assert.equal(JOURNAL_SECTIONS[game.journalSection], 'TECHNIQUES');
}

{
  const game = makeGame();
  game.uiScreen = 'journal';
  game.journalSection = JOURNAL_SECTIONS.indexOf('TECHNIQUES');
  game.journalTurn = null;
  game.journalTechniqueIndex = 25;
  game.techniqueDefs = Object.fromEntries(Array.from({ length: 26 }, (_, index) => {
    const number = String(index + 1).padStart(2, '0');
    return [`method-${number}`, {
      id: `method-${number}`,
      name: `Method ${number}`,
      type: 'active',
      summary: 'Test method.',
      requirements: {}
    }];
  }));

  game._handleJournalScreen([], {
    x: JOURNAL_TECHNIQUE_LIST.x + 3,
    y: JOURNAL_TECHNIQUE_LIST.y + 2,
    button: 0
  });

  assert.equal(game.journalTechniqueIndex, 12);
}
