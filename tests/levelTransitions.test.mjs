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

function installFileFetch() {
  const rootUrl = new URL('../', import.meta.url);
  globalThis.fetch = async (path) => {
    const normalized = String(path).replace(/^\.\//, '');
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

function finishMovingStep(game) {
  for (let i = 0; i < 8 && game.moving; i += 1) {
    game._advanceMovement(1);
  }
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
  assert.equal(tentBodyTarget.type, 'move');
  assert.deepEqual(tentBodyTarget.cell, { x: 47, y: 13 });

  game.renderer.toGrid = () => ({ x: 46, y: 10 });
  game._handleExploreClick({ button: 0, x: 0, y: 0 });
  assert.deepEqual(game.pathQueue.at(-1), { x: 47, y: 13 });
  game._stepAlongPath();
  finishMovingStep(game);
  await waitFor(
    () => game.level.id === 'censure-road-preceptor-tent' && game.pendingLevelTransition === null,
    'preceptor tent did not finish loading after stepping onto the tent mouth'
  );
  assert.deepEqual(game.player.position, { x: 6, y: 7 });

  assert.equal(game._tryStep(game.player, { x: 0, y: 1 }), true);
  finishMovingStep(game);
  await waitFor(
    () => game.level.id === 'censure-road-camp' && game.pendingLevelTransition === null,
    'camp did not finish loading after stepping out of the tent'
  );
  assert.deepEqual(game.player.position, { x: 47, y: 13 });
}
