import assert from 'node:assert/strict';

import { Game } from '../src/core/Game.js';
import { PRIMARY_ATTRIBUTES } from '../src/core/Progression.js';
import { HAZARD_TYPES } from '../src/combat/CombatHazards.js';
import { applyStatus, getStatus, hasStatus } from '../src/combat/StatusEffects.js';
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

globalThis.window = { addEventListener() {} };
globalThis.document = { createElement: () => mockCanvas() };

function primaries(value = 10) {
  return Object.fromEntries(PRIMARY_ATTRIBUTES.map((primary) => [primary.id, value]));
}

function withRandom(value, fn) {
  const original = Math.random;
  Math.random = () => value;
  try {
    return fn();
  } finally {
    Math.random = original;
  }
}

function makeGame(techniques = [], { playerOverrides = {}, enemyOverrides = {} } = {}) {
  const game = new Game({
    canvas: mockCanvas(),
    levelPath: './data/levels/ash_chapel_breach.json',
    atlas: null,
    statusElement: null,
    bootOptions: { skipIntro: true }
  });
  const level = {
    id: 'technique-runtime-test',
    name: 'Technique Runtime Test',
    width: 8,
    height: 5,
    tileSize: 64,
    tiles: ['........', '........', '........', '........', '........'],
    legend: { '.': { kind: 'floor', walkable: true } },
    combatTriggers: [],
    combatStartBarks: [],
    interactables: [],
    props: [],
    mood: null
  };
  const player = new Entity({
    id: 'mara-vey',
    name: 'Mara Vey',
    type: 'player',
    stats: { hp: 14, maxHp: 14, actionPoints: 8 },
    attacks: [
      { id: 'melee', name: 'Knife', apCost: 2, damage: 3, range: 1 },
      { id: 'sidearm', name: 'Sidearm', apCost: 3, damage: 4, range: 5 }
    ],
    position: { x: 1, y: 2 },
    progression: { level: 1, build: 'field-agent', primaries: primaries(), techniques },
    ...playerOverrides
  });
  const enemy = new Entity({
    id: 'choir-feral',
    name: 'Choir Feral',
    type: 'enemy',
    stats: { hp: 12, maxHp: 12, actionPoints: 4 },
    attacks: [{ id: 'claw', name: 'Claw', apCost: 2, damage: 2, range: 1 }],
    position: { x: 4, y: 2 },
    progression: { level: 1, build: 'field-agent', primaries: primaries(4) },
    ...enemyOverrides
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
  game.level = level;
  game.inventory = {};
  game.inventoryOrder = [];
  game.appliedLevelEvents = new Set();
  game.clearedEncounters = new Set();
  game.awardedQuestXp = new Set();
  game.renderer = { rebuildStaticScene() {} };
  game._startCombat('room');
  return { game, player, enemy };
}

{
  const { game, player, enemy } = makeGame(['study-target']);
  game._executeTechniqueAction({ techniqueId: 'study-target', target: enemy, apCost: 2 });

  assert.equal(player.ap, 6);
  assert.equal(hasStatus(enemy, 'studied'), true);
  const preview = game._attackPreview(player, enemy, player.getAttack('sidearm'));
  assert(preview.tags.includes('STUDIED'));
  assert(preview.damageTags.includes('STUDIED +2'));
}

{
  const { game, player, enemy } = makeGame(['study-target', 'case-file']);
  game._executeTechniqueAction({ techniqueId: 'study-target', target: enemy, apCost: 2 });

  assert.equal(player.ap, 7);
  const status = getStatus(enemy, 'studied');
  assert.equal(status.remainingTurns, 5);
  assert.equal(status.data.hitBonus, 25);
  assert.equal(status.data.damageBonus, 3);
  assert(game.log.some((line) => line === 'Case file locks.'));
}

{
  const { game, player, enemy } = makeGame(['field-measure']);
  game._executeTechniqueAction({ techniqueId: 'field-measure', apCost: 1 });

  assert.equal(player.ap, 7);
  assert.equal(hasStatus(player, 'prepared'), true);

  const preview = game._attackPreview(player, enemy, player.getAttack('sidearm'));
  assert(preview.tags.includes('PREPARED'));
  assert(preview.damageTags.includes('PREPARED +1'));

  game.selectedAttackId = 'sidearm';
  withRandom(0, () => {
    game._playerAttack();
  });

  assert.equal(hasStatus(player, 'prepared'), false);
}

{
  const { game, player, enemy } = makeGame(['trip-mine']);
  game._executeTechniqueAction({ techniqueId: 'trip-mine', cell: { x: 2, y: 2 }, apCost: 3 });

  assert.equal(player.ap, 5);
  assert.equal(game.combatHazards.length, 1);
  assert.equal(game.combatHazards[0].type, HAZARD_TYPES.TRIP_MINE);

  enemy.moveTo(2, 2);
  game._triggerHazardsForActor(enemy);

  assert.equal(enemy.hp, 7);
  assert.equal(hasStatus(enemy, 'snared'), true);
  assert.equal(game.combatHazards.length, 0);
}

{
  const { game, player, enemy } = makeGame(['burn-line', 'hard-seal']);
  enemy.moveTo(5, 2);
  game._executeTechniqueAction({ techniqueId: 'burn-line', cell: { x: 4, y: 2 }, apCost: 3 });

  assert.equal(player.ap, 5);
  assert.equal(game.combatHazards.length, 3);
  assert(game.combatHazards.every((hazard) => hazard.type === HAZARD_TYPES.BURNING_GROUND));
  assert(game.combatHazards.every((hazard) => hazard.durationRounds === 3));

  enemy.moveTo(2, 2);
  game._triggerHazardsForActor(enemy);

  assert.equal(enemy.hp, 11);
  assert.equal(getStatus(enemy, 'burning').power, 3);
}

{
  const { game, player, enemy } = makeGame(['burn-line']);
  game._executeTechniqueAction({ techniqueId: 'burn-line', target: enemy, cell: enemy.position, apCost: 3 });

  assert.equal(player.ap, 5);
  assert.equal(enemy.hp, 11);
  assert.equal(hasStatus(enemy, 'burning'), true);
}

{
  const { game, player, enemy } = makeGame(['overwatch']);
  game._executeTechniqueAction({
    techniqueId: 'overwatch',
    target: enemy,
    attackId: 'sidearm',
    apCost: 2
  });

  assert.equal(player.ap, 6);
  assert.equal(hasStatus(player, 'overwatch'), true);
  const triggered = game._triggerOverwatch(enemy);

  assert.equal(triggered, true);
  assert.equal(hasStatus(player, 'overwatch'), false);
  assert(game.log.some((line) => line === 'Overwatch fires at Choir Feral.'));
}

{
  const { game, player, enemy } = makeGame(['shove']);
  enemy.moveTo(2, 2);
  game._executeTechniqueAction({ techniqueId: 'shove', target: enemy, apCost: 2 });

  assert.equal(player.ap, 6);
  assert.deepEqual(enemy.position, { x: 3, y: 2 });
  assert.equal(hasStatus(enemy, 'off-balance'), true);
}

{
  const { game, player, enemy } = makeGame(['guard-break']);
  enemy.moveTo(2, 2);
  withRandom(0, () => {
    game._executeTechniqueAction({ techniqueId: 'guard-break', target: enemy, attackId: 'melee', apCost: 3 });
  });

  assert.equal(player.ap, 5);
  assert.equal(hasStatus(enemy, 'guard-broken'), true);
}

{
  const { game, player } = makeGame(['stabilize', 'surgeons-nerve']);
  player.hp = 10;
  applyStatus(player, { id: 'burning', duration: 2, power: 2 });
  applyStatus(player, { id: 'fatigued', duration: 2 });
  game._executeTechniqueAction({ techniqueId: 'stabilize', apCost: 2 });

  assert.equal(player.ap, 6);
  assert.equal(player.hp, 12);
  assert.equal(hasStatus(player, 'burning'), false);
  assert.equal(hasStatus(player, 'fatigued'), false);
  assert.equal(hasStatus(player, 'braced'), true);
}

{
  const { game, player } = makeGame(['field-stimulant', 'stabilize']);
  player.ap = 2;
  game._executeTechniqueAction({ techniqueId: 'field-stimulant', apCost: 1 });

  assert.equal(player.ap, 4);
  assert.equal(hasStatus(player, 'stimmed'), true);
  assert.equal(hasStatus(player, 'fatigued'), true);

  applyStatus(player, { id: 'burning', duration: 2, power: 2 });
  game._executeTechniqueAction({ techniqueId: 'stabilize', apCost: 2 });

  assert.equal(hasStatus(player, 'burning'), false);
  assert.equal(hasStatus(player, 'fatigued'), true);
}

{
  const { game, player, enemy } = makeGame(['name-the-error', 'feint'], {
    enemyOverrides: { faction: 'ash-cartel', tags: ['human'], position: { x: 2, y: 2 } }
  });
  game._executeTechniqueAction({ techniqueId: 'name-the-error', target: enemy, apCost: 2 });
  game._executeTechniqueAction({ techniqueId: 'feint', target: enemy, apCost: 2 });

  assert.equal(player.ap, 4);
  assert.equal(enemy.ap, 3);
  assert.equal(hasStatus(enemy, 'rattled'), true);
  assert.equal(hasStatus(enemy, 'off-balance'), true);
}

{
  const { game, player, enemy } = makeGame(['stilling-litany'], {
    enemyOverrides: { faction: 'the-host', tags: ['host'] }
  });
  game._executeTechniqueAction({ techniqueId: 'stilling-litany', target: enemy, apCost: 2 });

  assert.equal(player.ap, 6);
  assert.equal(enemy.ap, 3);
  assert.equal(hasStatus(enemy, 'suppressed'), true);
}

{
  const { game, player } = makeGame(['rally']);
  player.ap = 4;
  applyStatus(player, { id: 'rattled', duration: 2 });
  applyStatus(player, { id: 'suppressed', duration: 2 });
  game._executeTechniqueAction({ techniqueId: 'rally', apCost: 2 });

  assert.equal(player.ap, 3);
  assert.equal(hasStatus(player, 'rallied'), true);
  assert.equal(hasStatus(player, 'rattled'), false);
  assert.equal(hasStatus(player, 'suppressed'), false);
}

{
  const { game, player, enemy } = makeGame(['wire-snare']);
  game._executeTechniqueAction({ techniqueId: 'wire-snare', target: enemy, apCost: 2 });

  assert.equal(player.ap, 6);
  assert.equal(enemy.ap, 3);
  assert.equal(hasStatus(enemy, 'snared'), true);
  assert.equal(hasStatus(enemy, 'off-balance'), true);
}

{
  const { game, player, enemy } = makeGame(['censure-spark'], {
    enemyOverrides: { faction: 'the-host', tags: ['host'] }
  });
  game._executeTechniqueAction({ techniqueId: 'censure-spark', target: enemy, apCost: 2 });

  assert.equal(player.ap, 6);
  assert.equal(enemy.hp, 11);
  assert.equal(getStatus(enemy, 'burning').remainingTurns, 3);
}

{
  const { game, player } = makeGame(['fade-back']);
  game._executeTechniqueAction({ techniqueId: 'fade-back', cell: { x: 2, y: 1 }, apCost: 2 });

  assert.equal(player.ap, 6);
  assert.deepEqual(player.position, { x: 2, y: 1 });
  assert.equal(hasStatus(player, 'faded'), true);
}

{
  const { game, player, enemy } = makeGame(['seal-tile'], {
    enemyOverrides: { faction: 'the-host', tags: ['host'] }
  });
  game._executeTechniqueAction({ techniqueId: 'seal-tile', cell: { x: 2, y: 2 }, apCost: 2 });

  assert.equal(player.ap, 6);
  assert.equal(game.combatHazards.length, 1);
  assert.equal(game.combatHazards[0].type, HAZARD_TYPES.SEALED_TILE);

  enemy.moveTo(2, 2);
  game._triggerHazardsForActor(enemy);

  assert.equal(enemy.ap, 2);
  assert.equal(hasStatus(enemy, 'sealed'), true);
  assert.equal(game.combatHazards.length, 1);
}

{
  const { game, player, enemy } = makeGame(['seal-tile'], {
    enemyOverrides: { faction: 'the-host', tags: ['host'], position: { x: 2, y: 2 } }
  });
  game._executeTechniqueAction({ techniqueId: 'seal-tile', target: enemy, cell: enemy.position, apCost: 2 });

  assert.equal(player.ap, 6);
  assert.equal(enemy.ap, 2);
  assert.equal(hasStatus(enemy, 'sealed'), true);
}

{
  const { game, player, enemy } = makeGame(['quarantine-line']);
  enemy.moveTo(5, 4);
  game._executeTechniqueAction({ techniqueId: 'quarantine-line', cell: { x: 4, y: 2 }, apCost: 3 });

  assert.equal(player.ap, 5);
  assert.equal(game.combatHazards.length, 3);
  assert(game.combatHazards.every((hazard) => hazard.type === HAZARD_TYPES.QUARANTINE_LINE));

  enemy.moveTo(2, 2);
  game._triggerHazardsForActor(enemy);

  assert.equal(enemy.ap, 2);
  assert.equal(hasStatus(enemy, 'suppressed'), true);
  assert.equal(game.combatHazards.length, 3);
}

{
  const { game, player, enemy } = makeGame(['quarantine-line']);
  game._executeTechniqueAction({ techniqueId: 'quarantine-line', target: enemy, cell: enemy.position, apCost: 3 });

  assert.equal(player.ap, 5);
  assert.equal(enemy.ap, 2);
  assert.equal(hasStatus(enemy, 'suppressed'), true);
}

{
  const { game, enemy } = makeGame(['ambush-mark']);
  enemy.moveTo(2, 2);
  game.selectedAttackId = 'melee';
  withRandom(0, () => {
    game._playerAttack({ sneakAttack: true, ignoreApCost: true, spendAp: false });
  });

  assert.equal(hasStatus(enemy, 'studied'), true);
  assert(game.log.some((line) => line === 'Ambush mark set.'));
}

{
  const { game, player, enemy } = makeGame(['riposte']);
  enemy.moveTo(2, 2);
  const triggered = withRandom(0, () => game._triggerRiposte(enemy));

  assert.equal(triggered, true);
  assert.equal(hasStatus(player, 'riposte-spent'), true);
  assert(enemy.hp < enemy.maxHp);
  assert(game.log.some((line) => line === 'Riposte.'));
}

{
  const { game, player } = makeGame(['low-step']);
  assert.equal(game._combatMoveApCost(player), 0);
  game._markCombatMoveSpent(player);

  assert.equal(hasStatus(player, 'low-step-spent'), true);
  assert.equal(game._combatMoveApCost(player), 1);
}
