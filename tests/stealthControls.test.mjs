import assert from 'node:assert/strict';

import { Game } from '../src/core/Game.js';
import { Input } from '../src/core/Input.js';
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
  let keydown = null;
  globalThis.window = {
    addEventListener(type, handler) {
      if (type === 'keydown') keydown = handler;
    }
  };
  const input = new Input(mockCanvas());
  keydown({ key: 'ç', code: 'KeyC', repeat: false, preventDefault() {} });
  keydown({ key: 'ç', code: 'KeyC', repeat: true, preventDefault() {} });
  assert.deepEqual(input.consume(), ['toggle-sneak']);
}

{
  let keydown = null;
  globalThis.window = {
    addEventListener(type, handler) {
      if (type === 'keydown') keydown = handler;
    }
  };
  const input = new Input(mockCanvas());
  keydown({ key: 'Spacebar', code: 'Space', repeat: false, preventDefault() {} });
  assert.deepEqual(input.consume(), ['space']);
}

function makeGame() {
  globalThis.window = { addEventListener() {} };
  globalThis.document = { createElement: () => mockCanvas() };

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
    position: { x: 1, y: 1 }
  });
  const level = {
    id: 'stealth-controls-test',
    name: 'Stealth Controls Test',
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

  game.ready = true;
  game.anim = { tick: 0, bob: 0, flicker: 0, pulse: 0 };
  game.areaTitleTimer = 0;
  game.effects = [];
  game.speakingProps = [];
  game.player = player;
  game.enemies = [];
  game.npcs = [];
  game.groundItems = [];
  game.grid = new Grid(level);
  game.hiddenTiles = new Set();
  game.moving = null;
  game.pathQueue = [];
  game.pendingExploreTarget = null;
  game.mode = 'explore';
  game.sneakMode = false;
  game.uiScreen = null;
  game.dialogue = null;
  game.log = [];
  game.level = level;
  game.clearedEncounters = new Set();
  return game;
}

{
  const game = makeGame();
  const actionBatches = [['toggle-sneak'], ['toggle-sneak']];
  game.input = {
    consume: () => actionBatches.shift() ?? [],
    consumeClick: () => null,
    isHeld: () => false
  };

  game.update(0);
  assert.equal(game.sneakMode, true);
  assert.equal(game.player.render.state, 'sneakIdle');
  assert.equal(game.player.speech?.text, 'Shhh.');

  game.update(0);
  assert.equal(game.sneakMode, false);
  assert.equal(game.player.render.state, 'idle');
  assert.equal(game.player.speech, null);
}

{
  const game = makeGame();
  let shiftHeld = false;
  game.sneakMode = true;
  game.player.render.state = 'sneakIdle';
  game.pathQueue = [{ x: 2, y: 1 }];
  game.input = {
    consume: () => [],
    consumeClick: () => null,
    isHeld: (key) => key === 'shift' && shiftHeld
  };

  game.update(0);
  assert.equal(game.moving?.actor, game.player);
  assert.equal(game.player.render.state, 'sneak');

  game.update(0.64);
  assert.equal(game.moving?.actor, game.player);
  assert.equal(game.player.render.state, 'sneak');

  shiftHeld = true;
  game.update(0.1);
  assert.equal(game.player.render.state, 'walk');
  assert.equal(game.moving.usedSprint, true);
  assert.ok(game.moving.t > 0.2);

  shiftHeld = false;
  game.update(1);
  assert.equal(game.moving, null);
  assert.equal(game.player.render.state, 'sneakIdle');
}

{
  const game = makeGame();
  const actionBatches = [[], ['toggle-sneak']];
  game.pathQueue = [{ x: 2, y: 1 }];
  game.input = {
    consume: () => actionBatches.shift() ?? [],
    consumeClick: () => null,
    isHeld: () => false
  };

  game.update(0);
  assert.equal(game.moving?.actor, game.player);
  assert.equal(game.player.render.state, 'walk');

  game.update(0);
  assert.equal(game.sneakMode, true);
  assert.equal(game.moving?.sneakMode, true);
  assert.equal(game.player.render.state, 'sneak');
}
