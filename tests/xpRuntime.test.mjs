import assert from 'node:assert/strict';

import { Game } from '../src/core/Game.js';
import { Entity } from '../src/entities/Entity.js';

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

function buildGameForQuestXp() {
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
  game.enemies = [];
  game.npcs = [];
  game.groundItems = [];
  game.moving = null;
  game.pathQueue = [];
  game.mode = 'explore';
  game.uiScreen = 'dialogue';
  game.log = [];
  game.awardedQuestXp = new Set();
  game.questDefs = {
    'test-quest': {
      id: 'test-quest',
      title: 'Test Quest',
      initialStage: 'active',
      stages: [
        { id: 'active', description: 'Start' },
        { id: 'found', description: 'Found it.', xp: 25 }
      ]
    }
  };
  game.questStages = new Map([['test-quest', 'active']]);
  game.questReached = new Map([['test-quest', new Set(['active'])]]);
  game.player = new Entity({
    id: 'mara-vey',
    name: 'Mara Vey',
    type: 'player',
    stats: { hp: 14, maxHp: 14, actionPoints: 6 },
    progression: { level: 1, xp: 0, build: 'field-agent' }
  });
  game.dialogueDefs = { runtime: { id: 'runtime' } };
  game.dialogue = {
    id: 'runtime',
    choices: [
      { label: 'Finish task', effects: { questUpdate: { quest: 'test-quest', stage: 'found' } } }
    ]
  };
  game.input = {
    consume: () => ['confirm'],
    consumeClick: () => null
  };
  return game;
}

function buildGameForCombatXp() {
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
    position: { x: 0, y: 0 },
    progression: { level: 1, xp: 0, build: 'field-agent' }
  });
  const enemy = new Entity({
    id: 'test-hardened',
    name: 'Hardened Test Enemy',
    type: 'enemy',
    stats: { hp: 1, maxHp: 1, actionPoints: 0 },
    position: { x: 1, y: 0 },
    tags: ['tank'],
    progression: { level: 2, build: 'breaker' }
  });
  enemy.encounter = 'room';

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
  game.mode = 'combat';
  game.uiScreen = null;
  game.log = [];
  game.level = { name: 'Test Level', victoryLog: null, onVictory: null };
  game.appliedLevelEvents = new Set();
  game.clearedEncounters = new Set();
  game.activeEncounter = 'room';
  game.targetIndex = 0;
  game.selectedAttackId = 'melee';
  game.turnManager = { active: true, isPlayerTurn: () => true };
  game.input = {
    consume: () => ['confirm'],
    consumeClick: () => null
  };
  return { game, enemy };
}

{
  const game = buildGameForQuestXp();
  game.update(0);

  assert.equal(game.player.progression.xp, 25);
  assert.equal(game.questStages.get('test-quest'), 'found');
  assert.equal(game.awardedQuestXp.has('test-quest:found'), true);
  assert.equal(game.log.includes('Experience gained: 25.'), true);
}

{
  const game = buildGameForQuestXp();
  game.awardedQuestXp.add('test-quest:found');
  game.update(0);

  assert.equal(game.player.progression.xp, 0);
  assert.equal(game.questStages.get('test-quest'), 'found');
}

{
  const { game, enemy } = buildGameForCombatXp();
  game.update(0);

  assert.equal(enemy.isDead, true);
  assert.equal(game.player.progression.xp, 60);
  assert.equal(game.mode, 'victory');
  assert.equal(game.clearedEncounters.has('room'), true);
  assert.equal(game.log.includes('Experience gained: 60.'), true);
}
