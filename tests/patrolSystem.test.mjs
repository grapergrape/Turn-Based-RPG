import assert from 'node:assert/strict';

import { Game } from '../src/core/Game.js';
import {
  PATROL_MIN_DWELL,
  normalizePatrol,
  normalizePatrolDelay,
  randomPatrolDelay
} from '../src/core/LevelLoader.js';
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

{
  assert.equal(normalizePatrol({ patrol: [] }), null);
  assert.equal(normalizePatrol({ patrol: { path: [{ x: 1, y: 1 }] } }), null);
}

{
  const patrol = normalizePatrol({
    patrol: [
      { x: 1, y: 1 },
      { x: 3, y: 1 }
    ]
  }, 1);

  assert.deepEqual(patrol.path, [{ x: 1, y: 1 }, { x: 3, y: 1 }]);
  assert.equal(patrol.mode, 'loop');
  assert.equal(patrol.index, 0);
  assert.equal(patrol.direction, 1);
  assert.ok(patrol.delay.min > 0);
  assert.ok(patrol.delay.max >= patrol.delay.min);
  assert.ok(patrol.timer >= patrol.delay.min);
  assert.ok(patrol.timer <= patrol.delay.max);
}

{
  const range = normalizePatrolDelay([3, 1]);
  assert.deepEqual(range, { min: PATROL_MIN_DWELL, max: 3 });

  const objectRange = normalizePatrolDelay({ min: 2, max: 4 });
  assert.deepEqual(objectRange, { min: PATROL_MIN_DWELL, max: 4 });

  const averaged = normalizePatrolDelay(2);
  assert.deepEqual(averaged, { min: PATROL_MIN_DWELL, max: PATROL_MIN_DWELL + 0.6 });
}

{
  const patrol = normalizePatrol({
    patrol: {
      mode: 'bad-mode',
      delay: { min: 0.5, max: 1.5 },
      path: [
        { x: 2, y: 2 },
        { x: 2, y: 5 }
      ]
    }
  });

  assert.equal(patrol.mode, 'loop');
  assert.deepEqual(patrol.delay, { min: PATROL_MIN_DWELL, max: PATROL_MIN_DWELL + 0.6 });
}

{
  const patrol = normalizePatrol({
    patrol: {
      mode: 'once',
      startDelay: 0,
      path: [
        { x: 1, y: 1 },
        { x: 2, y: 1 }
      ],
      onComplete: {
        setFlag: 'runner-arrived',
        log: 'The runner arrives.'
      }
    }
  });

  assert.equal(patrol.mode, 'once');
  assert.equal(patrol.timer, 0);
  assert.deepEqual(patrol.onComplete, {
    setFlag: 'runner-arrived',
    log: 'The runner arrives.'
  });
}

{
  const previousRandom = Math.random;
  Math.random = () => 0;
  try {
    assert.equal(randomPatrolDelay({ delay: normalizePatrolDelay([0.5, 1.2]) }), PATROL_MIN_DWELL);
  } finally {
    Math.random = previousRandom;
  }
}

{
  globalThis.window = { addEventListener() {} };
  globalThis.document = { createElement: () => mockCanvas() };

  const level = {
    id: 'patrol-once-test',
    name: 'Patrol Once Test',
    width: 4,
    height: 4,
    tileSize: 64,
    tiles: ['....', '....', '....', '....'],
    legend: { '.': { kind: 'floor', walkable: true } },
    combatTriggers: [],
    interactables: [],
    props: [],
    mood: null
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
    name: 'Mara Vey',
    type: 'player',
    stats: { hp: 14, maxHp: 14, actionPoints: 6 },
    attacks: [],
    position: { x: 3, y: 3 }
  });
  const runner = new Entity({
    id: 'settlement-runner',
    name: 'Settlement Runner',
    type: 'npc',
    stats: { hp: 6, maxHp: 6, actionPoints: 4 },
    attacks: [],
    position: { x: 1, y: 1 }
  });
  runner.patrol = null;

  game.ready = true;
  game.anim = { tick: 0, bob: 0, flicker: 0, pulse: 0 };
  game.areaTitleTimer = 0;
  game.effects = [];
  game.speakingProps = [];
  game.player = player;
  game.enemies = [];
  game.npcs = [runner];
  game.groundItems = [];
  game.grid = new Grid(level);
  game.hiddenTiles = new Set();
  game.moving = null;
  game.pathQueue = [];
  game.pendingExploreTarget = null;
  game.preCombatTarget = null;
  game.mode = 'explore';
  game.sneakMode = false;
  game.uiScreen = 'dialogue';
  game.dialogue = {
    id: 'move-dialogue',
    lines: ['Move.'],
    choices: [
      {
        label: 'Move',
        effects: {
          moveActor: {
            target: 'speaker',
            path: [
              { x: 2, y: 1 }
            ],
            removeOnComplete: true,
            onComplete: {
              setFlag: 'runner-arrived',
              log: 'The runner arrives.'
            }
          }
        }
      }
    ],
    scroll: 0
  };
  game.dialogueDefs = {
    'move-dialogue': {
      id: 'move-dialogue',
      nodes: {}
    }
  };
  game.dialogueActor = runner;
  game.flags = new Set();
  game.log = [];
  game.level = level;
  game.appliedLevelEvents = new Set();
  game.clearedEncounters = new Set();
  const actionQueue = [['confirm'], [], []];
  game.input = {
    consume: () => actionQueue.shift() ?? [],
    consumeClick: () => null,
    isHeld: () => false
  };

  game.update(0);
  assert.equal(game.uiScreen, null);
  assert.equal(runner.patrol?.mode, 'once');
  assert.deepEqual(runner.patrol.path, [{ x: 1, y: 1 }, { x: 2, y: 1 }]);

  game.update(0);
  assert.equal(game.moving?.actor, runner);
  assert.equal(runner.position.x, 2);
  assert.equal(game.flags.has('runner-arrived'), false);

  game.update(0.64);
  assert.equal(game.moving, null);
  assert.equal(runner.patrol.complete, true);
  assert.equal(game.flags.has('runner-arrived'), true);
  assert.ok(game.log.includes('The runner arrives.'));
  assert.equal(game.npcs.includes(runner), false);
}

{
  globalThis.window = { addEventListener() {} };
  globalThis.document = { createElement: () => mockCanvas() };

  const level = {
    id: 'patrol-runtime-test',
    name: 'Patrol Runtime Test',
    width: 6,
    height: 5,
    tileSize: 64,
    tiles: ['......', '......', '......', '......', '......'],
    legend: { '.': { kind: 'floor', walkable: true } },
    combatTriggers: [],
    interactables: [],
    props: [],
    mood: null
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
    name: 'Mara Vey',
    type: 'player',
    stats: { hp: 14, maxHp: 14, actionPoints: 6 },
    attacks: [],
    position: { x: 5, y: 4 }
  });
  const guard = new Entity({
    id: 'choir-guard',
    name: 'Choir Guard',
    type: 'enemy',
    stats: { hp: 8, maxHp: 8, actionPoints: 4 },
    attacks: [],
    position: { x: 1, y: 1 }
  });
  guard.encounter = 'patrol-test';
  guard.patrol = normalizePatrol({
    patrol: {
      mode: 'pingpong',
      delay: [0.5, 1.2],
      path: [
        { x: 1, y: 1 },
        { x: 2, y: 1 }
      ]
    }
  });
  guard.patrolTimer = 0;

  game.ready = true;
  game.anim = { tick: 0, bob: 0, flicker: 0, pulse: 0 };
  game.areaTitleTimer = 0;
  game.effects = [];
  game.speakingProps = [];
  game.player = player;
  game.enemies = [guard];
  game.npcs = [];
  game.groundItems = [];
  game.grid = new Grid(level);
  game.hiddenTiles = new Set(['5,4']);
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
  game.appliedLevelEvents = new Set();
  game.clearedEncounters = new Set();
  game.input = {
    consume: () => [],
    consumeClick: () => null,
    isHeld: () => false
  };

  const previousRandom = Math.random;
  Math.random = () => 0;
  try {
    game.update(0);
    assert.equal(game.moving?.actor, guard);
    assert.equal(guard.position.x, 2);
    assert.equal(guard.patrolTimer, PATROL_MIN_DWELL);

    game.update(0.64);
    assert.equal(game.moving, null);
    assert.equal(guard.position.x, 2);
    assert.ok(guard.patrolTimer > 0);

    game.update(0.5);
    assert.equal(game.moving, null);
    assert.equal(guard.position.x, 2);
  } finally {
    Math.random = previousRandom;
  }
}
