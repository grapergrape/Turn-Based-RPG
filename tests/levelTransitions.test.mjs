import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import { Game } from '../src/core/Game.js';

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

function installBrowserStubs() {
  globalThis.window = {
    addEventListener() {},
    requestAnimationFrame: (callback) => setTimeout(callback, 0)
  };
  globalThis.document = { createElement: () => mockCanvas() };
}

function installFileFetch(overrides = {}) {
  const rootUrl = new URL('../', import.meta.url);
  globalThis.fetch = async (path) => {
    const normalized = String(path).replace(/^\.\//, '');
    if (Object.hasOwn(overrides, normalized)) {
      return {
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => JSON.parse(JSON.stringify(overrides[normalized]))
      };
    }
    const fileUrl = new URL(normalized, rootUrl);
    try {
      const text = await readFile(fileUrl, 'utf8');
      return {
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => JSON.parse(text)
      };
    } catch {
      return {
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => null
      };
    }
  };
}

function journalTestLevel({ id, codex, journalNotes }) {
  return {
    id,
    name: id,
    intro: 'Test field load.',
    width: 4,
    height: 4,
    tileSize: 64,
    tiles: ['....', '....', '....', '....'],
    legend: { '.': { kind: 'floor', walkable: true } },
    spawns: {
      player: { actor: 'mara-vey', x: 1, y: 1 },
      enemies: [],
      npcs: []
    },
    objects: [],
    dialogue: [],
    quests: [],
    codex,
    journalNotes
  };
}

function finishMovingStep(game) {
  for (let i = 0; i < 8 && game.moving; i += 1) {
    game._advanceMovement(1);
  }
}

function finishQueuedMovement(game) {
  for (let i = 0; i < 80 && (game.moving || game.pathQueue.length > 0); i += 1) {
    if (!game.moving) game._stepAlongPath();
    finishMovingStep(game);
  }
  assert.equal(game.moving, null, 'movement should finish within the test guard');
  assert.deepEqual(game.pathQueue, [], 'queued path should finish within the test guard');
}

async function waitFor(predicate, label) {
  for (let i = 0; i < 80; i += 1) {
    if (predicate()) return;
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
  assert.fail(label);
}

{
  const effect = {
    path: './data/levels/test_interior.json',
    player: { x: 2, y: 3 }
  };
  const calls = [];
  const game = {
    pendingLevelTransition: null,
    mode: 'explore',
    player: { position: { x: 4, y: 5 } },
    level: {
      levelTransitions: [
        {
          id: 'locked-threshold',
          x: 4,
          y: 5,
          conditions: { flag: 'missing' },
          loadLevel: { path: './data/levels/locked.json', player: { x: 1, y: 1 } }
        },
        {
          id: 'open-threshold',
          x: 4,
          y: 5,
          loadLevel: effect
        }
      ]
    },
    pathQueue: [{ x: 5, y: 5 }],
    pendingExploreTarget: { type: 'move' },
    preCombatTarget: { id: 'target' },
    _meetsConditions: (conditions) => !conditions?.flag,
    _levelTransitionAtCell: Game.prototype._levelTransitionAtCell,
    _transitionLevel: (transitionEffect) => {
      calls.push(transitionEffect);
      return Promise.resolve();
    }
  };

  assert.equal(Game.prototype._triggerLevelTransitionAtPlayer.call(game), true);
  assert.deepEqual(calls, [effect]);
  assert.deepEqual(game.pathQueue, []);
  assert.equal(game.pendingExploreTarget, null);
  assert.equal(game.preCombatTarget, null);
  assert.equal(game.pendingLevelTransition, 'open-threshold');
  await Promise.resolve();
  assert.equal(game.pendingLevelTransition, null);
}

{
  const calls = [];
  const game = {
    pendingLevelTransition: null,
    mode: 'explore',
    player: { position: { x: 1, y: 1 } },
    level: {
      levelTransitions: [
        {
          id: 'other-cell',
          x: 2,
          y: 1,
          loadLevel: { path: './data/levels/other.json', player: { x: 1, y: 1 } }
        }
      ]
    },
    _meetsConditions: () => true,
    _levelTransitionAtCell: Game.prototype._levelTransitionAtCell,
    _transitionLevel: (transitionEffect) => {
      calls.push(transitionEffect);
      return Promise.resolve();
    }
  };

  assert.equal(Game.prototype._triggerLevelTransitionAtPlayer.call(game), false);
  assert.deepEqual(calls, []);
}

{
  const player = {
    facing: 'se',
    position: { x: 1, y: 1 },
    pxOffset: { x: 4, y: 3 },
    render: { state: 'walk', frameIndex: 3 },
    moveTo(x, y) { this.position = { x, y }; }
  };
  const game = {
    grid: { isWalkable: (x, y) => x === 3 && y === 4 },
    player,
    moving: { from: { x: 1, y: 1 } },
    pathQueue: [{ x: 2, y: 2 }],
    pendingExploreTarget: { type: 'move' },
    hiddenTilesKey: null,
    _idleStateFor: () => 'idle'
  };

  Game.prototype._teleportPlayer.call(game, { x: 3, y: 4, facing: 'w' });
  assert.deepEqual(player.position, { x: 3, y: 4 });
  assert.equal(player.facing, 'w', 'level arrival can preserve doorway-facing continuity');
  assert.deepEqual(player.pxOffset, { x: 0, y: 0 });
  assert.equal(player.render.state, 'idle');
  assert.equal(player.render.frameIndex, 0);
  assert.equal(game.moving, null);
  assert.deepEqual(game.pathQueue, []);
  assert.equal(game.pendingExploreTarget, null);
}

{
  const game = Object.create(Game.prototype);
  Object.assign(game, {
    mode: 'explore',
    grid: {
      isInside: (x, y) => x >= 0 && y >= 0 && x < 10 && y < 10,
      isWalkable: (x, y) => x !== 5 || y !== 5
    },
    player: { position: { x: 1, y: 1 } },
    level: {
      interactables: [],
      levelTransitions: [
        {
          id: 'tent-threshold',
          x: 4,
          y: 5,
          clickAreas: [{ x0: 5, y0: 5, x1: 6, y1: 6 }],
          loadLevel: { path: './data/levels/tent.json', player: { x: 6, y: 7 } }
        }
      ]
    },
    hiddenTiles: new Set(),
    enemies: [],
    npcs: [],
    groundItems: [],
    _meetsConditions: () => true,
    _isCellHidden: () => false,
    _isOccupied: () => false
  });

  const exploreTarget = game._interactionTargetAtCell({ x: 5, y: 5 }, 'explore');
  assert.equal(exploreTarget.type, 'move');
  assert.deepEqual(exploreTarget.cell, { x: 4, y: 5 });
  assert.equal(exploreTarget.transition.id, 'tent-threshold');

  const combatTarget = game._interactionTargetAtCell({ x: 5, y: 5 }, 'combat');
  assert.equal(combatTarget.type, 'blocked');
}

{
  installBrowserStubs();
  installFileFetch();

  const game = new Game({
    canvas: mockCanvas(),
    levelPath: './data/levels/censure_road_camp.json',
    atlas: {},
    statusElement: null,
    bootOptions: {
      skipIntro: true,
      noCombat: true,
      player: { x: 47, y: 14 }
    }
  });

  await game.boot();
  assert.equal(game.level.id, 'censure-road-camp');
  assert.deepEqual(game.player.position, { x: 47, y: 14 });

  const tentBodyTarget = game._interactionTargetAtCell({ x: 46, y: 10 }, 'explore');
  assert.equal(tentBodyTarget.type, 'object');
  assert.equal(tentBodyTarget.object.id, 'censure-road-preceptor-tent-flap');
  assert.deepEqual(tentBodyTarget.cell, { x: 46, y: 12 });

  game.renderer.toGrid = () => ({ x: 46, y: 10 });
  game._handleExploreClick({ button: 0, x: 0, y: 0 });
  assert.deepEqual(game.pathQueue.at(-1), { x: 47, y: 13 });
  finishQueuedMovement(game);
  assert.equal(game.level.id, 'censure-road-camp', 'approaching the tent does not enter it');
  assert.equal(game.ready, true);
  assert.equal(game.uiScreen, 'dialogue');
  assert.equal(game.dialogue.id, 'censure-road-preceptor-tent-entry');

  game._chooseDialogueOption(1);
  assert.equal(game.level.id, 'censure-road-camp', 'Stay outside keeps the player in camp');
  assert.equal(game.uiScreen, null);
  assert.deepEqual(game.player.position, { x: 47, y: 13 });

  game._handleExploreClick({ button: 0, x: 0, y: 0 });
  assert.equal(game.uiScreen, 'dialogue');
  assert.equal(game.dialogue.id, 'censure-road-preceptor-tent-entry');
  game._chooseDialogueOption(0);
  await waitFor(
    () => game.level.id === 'censure-road-preceptor-tent' && game.ready,
    'preceptor tent did not finish loading after choosing Enter'
  );
  assert.deepEqual(game.player.position, { x: 6, y: 7 });

  const exitFlapTarget = game._interactionTargetAtCell({ x: 6, y: 9 }, 'explore');
  assert.equal(exitFlapTarget.type, 'object');
  assert.equal(exitFlapTarget.object.id, 'preceptor-tent-exit-flap');
  assert.deepEqual(exitFlapTarget.cell, { x: 6, y: 9 });
  game.renderer.toGrid = () => ({ x: 6, y: 9 });
  game._handleExploreClick({ button: 0, x: 0, y: 0 });
  assert.deepEqual(game.pathQueue.at(-1), { x: 6, y: 8 });
  finishQueuedMovement(game);
  assert.equal(game.level.id, 'censure-road-preceptor-tent', 'approaching the flap does not leave the tent');
  assert.equal(game.ready, true);
  assert.equal(game.uiScreen, 'dialogue');
  assert.equal(game.dialogue.id, 'censure-road-preceptor-tent-exit');

  game._chooseDialogueOption(1);
  assert.equal(game.level.id, 'censure-road-preceptor-tent', 'Stay inside keeps the player in the tent');
  assert.equal(game.uiScreen, null);
  assert.deepEqual(game.player.position, { x: 6, y: 8 });

  game._handleExploreClick({ button: 0, x: 0, y: 0 });
  assert.equal(game.uiScreen, 'dialogue');
  assert.equal(game.dialogue.id, 'censure-road-preceptor-tent-exit');
  game._chooseDialogueOption(0);
  await waitFor(
    () => game.level.id === 'censure-road-camp' && game.ready,
    'camp did not finish loading after choosing Return to camp'
  );
  assert.deepEqual(game.player.position, { x: 47, y: 13 });
}

{
  installBrowserStubs();
  const firstPath = './data/levels/journal_persistence_a.json';
  const secondPath = './data/levels/journal_persistence_b.json';
  const stableNote = {
    flag: 'stable-note-seen',
    questStage: { 'test-alpha': 'found', 'test-beta': 'filed' },
    text: 'The stable finding remains filed.'
  };
  const firstLevel = journalTestLevel({
    id: 'journal-persistence-a',
    journalNotes: [
      { id: 'shared-note', flag: 'first-note-seen', text: 'The first finding remains filed.' },
      stableNote,
      { flag: 'first-only-seen', text: 'The first field has its own record.' }
    ],
    codex: [
      { id: 'shared-codex', name: 'Shared Office', summary: 'First entry.' },
      { name: 'Name Only Office', summary: 'First named entry.' },
      { id: 'first-office', name: 'First Office', summary: 'First field entry.' }
    ]
  });
  const secondLevel = journalTestLevel({
    id: 'journal-persistence-b',
    journalNotes: [
      { id: 'shared-note', flag: 'second-note-seen', text: 'A duplicate id does not add a second note.' },
      {
        questStage: { 'test-beta': 'filed', 'test-alpha': 'found' },
        flag: 'stable-note-seen',
        text: stableNote.text
      },
      { flag: 'second-only-seen', text: 'The second field has its own record.' }
    ],
    codex: [
      { id: 'shared-codex', name: 'Changed Shared Office', summary: 'Duplicate id.' },
      { name: 'Name Only Office', summary: 'Duplicate name.' },
      { id: 'second-office', name: 'Second Office', summary: 'Second field entry.' }
    ]
  });
  installFileFetch({
    'data/levels/journal_persistence_a.json': firstLevel,
    'data/levels/journal_persistence_b.json': secondLevel
  });

  const game = new Game({
    canvas: mockCanvas(),
    levelPath: firstPath,
    atlas: {},
    statusElement: null,
    bootOptions: { skipIntro: true, noCombat: true }
  });

  await game.boot();
  game.flags.add('first-note-seen');
  game.flags.add('stable-note-seen');
  game.flags.add('first-only-seen');
  await game._transitionLevel({ path: secondPath, player: { x: 1, y: 1 } });
  game.flags.add('second-only-seen');

  assert.equal(game.journalNotes.length, 4, 'visited-level notes merge without duplicate ids or condition-text pairs');
  assert.equal(game.codexDefs.length, 4, 'visited-level codex entries merge without duplicate ids or names');
  assert.equal(game.journalNotes.find((note) => note.id === 'shared-note')?.text, 'The first finding remains filed.');
  assert.equal(game.codexDefs.find((entry) => entry.id === 'shared-codex')?.name, 'Shared Office');
  assert.deepEqual(game._buildJournal().findings, [
    'The first finding remains filed.',
    'The stable finding remains filed.',
    'The first field has its own record.',
    'The second field has its own record.'
  ]);

  await game._transitionLevel({ path: firstPath, player: { x: 1, y: 1 } });
  assert.equal(game.journalNotes.length, 4, 'a second transition back does not duplicate definitions');
  assert.equal(game.codexDefs.length, 4);

  game.levelPath = secondPath;
  await game.boot();
  assert.equal(game.journalNotes.length, 3, 'a fresh boot resets notes to the current level');
  assert.equal(game.codexDefs.length, 3, 'a fresh boot resets codex entries to the current level');
  assert.equal(game.flags.size, 0, 'a fresh boot also clears the run flags that reveal findings');
}
