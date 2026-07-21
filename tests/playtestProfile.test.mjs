import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';

import { Game } from '../src/core/Game.js';
import { resolveDevStart } from '../src/core/DevStart.js';
import {
  applyPlaytestProgression,
  loadPlaytestSeed,
  resolvePlaytestSeed
} from '../src/core/PlaytestProfile.js';
import { FIELD_RATINGS, calculateFieldRating, normalizeProgression } from '../src/core/Progression.js';
import { Entity } from '../src/entities/Entity.js';

const root = new URL('../', import.meta.url);
const profile = JSON.parse(await readFile(new URL('data/playtests/fresh.json', root), 'utf8'));

function mockContext() {
  return new Proxy({ imageSmoothingEnabled: false }, {
    get(target, property) {
      if (property in target) return target[property];
      return () => {};
    },
    set(target, property, value) {
      target[property] = value;
      return true;
    }
  });
}

function mockCanvas() {
  return {
    width: 1280,
    height: 960,
    style: {},
    addEventListener() {},
    getBoundingClientRect() { return { left: 0, top: 0, width: 1280, height: 960 }; },
    getContext() { return mockContext(); }
  };
}

function installBrowserStubs() {
  globalThis.window = {
    addEventListener() {},
    requestAnimationFrame(callback) { callback(); }
  };
  globalThis.document = { createElement: () => mockCanvas() };
  globalThis.fetch = async (requestPath) => {
    const normalized = String(requestPath).replace(/^\.\//, '');
    try {
      const body = await readFile(new URL(normalized, root), 'utf8');
      return {
        ok: true,
        status: 200,
        statusText: 'OK',
        async json() { return JSON.parse(body); }
      };
    } catch {
      return {
        ok: false,
        status: 404,
        statusText: 'Not Found',
        async json() { return null; }
      };
    }
  };
}

{
  const start = resolveDevStart(new URL('http://localhost:4173/?level=camp&playtest=fresh'));
  assert.equal(start.playtestProfile, 'fresh');
  assert.equal(start.levelPath, './data/levels/censure_road_camp.json');
  assert.equal(start.enabled, true);

  const road = resolveDevStart(new URL('http://localhost:4173/?level=road&playtest=fresh'));
  assert.equal(road.levelPath, './data/levels/long_ash_road_approach.json');
  assert.equal(road.playtestProfile, 'fresh');

  const shorthand = resolveDevStart(new URL('http://localhost:4173/?level=camp&playtest=1'));
  assert.equal(shorthand.playtestProfile, 'fresh');

  const ordinaryJump = resolveDevStart(new URL('http://localhost:4173/?level=camp'));
  assert.equal(ordinaryJump.playtestProfile, null);

  const profileWithoutLevel = resolveDevStart(new URL('http://localhost:4173/?playtest=fresh'));
  assert.equal(profileWithoutLevel.playtestProfile, null);
  assert.equal(profileWithoutLevel.enabled, false);
}

{
  const levelFiles = (await readdir(new URL('data/levels/', root)))
    .filter((fileName) => fileName.endsWith('.json'))
    .sort();
  assert.deepEqual(Object.keys(profile.levels).sort(), levelFiles, 'fresh playtest profile covers every current level');
}

{
  const road = resolvePlaytestSeed(profile, './data/levels/long_ash_road_approach.json');
  assert.equal(road.companionRun.recruited, undefined, 'Long Ash keeps its attendant recruitment fresh');
  assert.equal(road.flags.includes('censure-attendant-registered'), false);

  const camp = resolvePlaytestSeed(profile, './data/levels/censure_road_camp.json');
  assert.equal(camp.flags.includes('ash-chapel-cult-broken'), true);
  assert.equal(camp.flags.includes('long-ash-field-family-truth'), true);
  assert.equal(camp.flags.includes('long-ash-field-family-lie'), false);
  assert.equal(camp.flags.includes('censure-road-voss-route-cleared'), false);
  assert.equal(camp.flags.includes('censure-road-drill-close-complete'), false);
  assert.equal(camp.questStages['investigate-ash-chapel-cult'], 'hallowfen-checkpoints');
  assert.equal(camp.questStages['calcified-brothers'], 'complete');
  assert.equal(camp.inventory.items.find((entry) => entry.item === 'choir-hymnal-fragment')?.count, 3);
  assert.equal(camp.inventory.items.find((entry) => entry.item === 'choir-tally-strip')?.count, 1);
  assert.equal(camp.inventory.items.find((entry) => entry.item === 'drone-service-parts')?.count, 2);
  assert.equal(camp.companionRun.recruited, true);
  assert.equal(camp.companionRun.name, 'Pip');
  assert.equal(camp.companionRun.upgradePoints, 42);
  assert.equal(camp.flags.includes('censure-attendant-registered'), true);

  const south = resolvePlaytestSeed(profile, './data/levels/ash_road_south.json');
  assert.equal(south.flags.includes('censure-road-voss-route-cleared'), true);
  assert.equal(south.flags.includes('met-ressa-venn'), false);
  assert.equal(south.inventory.items.some((entry) => entry.item === 'choir-hymnal-fragment'), false);
  assert.equal(south.inventory.items.find((entry) => entry.item === 'ducat')?.count, 10000);
}

{
  const cyclic = {
    id: 'cycle',
    checkpoints: {
      first: { extends: 'second' },
      second: { extends: 'first' }
    },
    levels: {
      'ash_chapel_breach.json': { checkpoint: 'first' }
    }
  };
  assert.throws(
    () => resolvePlaytestSeed(cyclic, './data/levels/ash_chapel_breach.json'),
    /checkpoint cycle/
  );
  assert.throws(
    () => resolvePlaytestSeed(profile, './data/levels/not_a_level.json'),
    /does not cover/
  );
}

{
  const loaded = await loadPlaytestSeed('fresh', {
    levelPath: './data/levels/censure_road_camp.json',
    fetchImpl: async (path) => ({
      ok: path === './data/playtests/fresh.json',
      status: 200,
      async json() { return profile; }
    })
  });
  assert.equal(loaded.profileId, 'fresh');
  await assert.rejects(
    () => loadPlaytestSeed('../bad', { levelPath: './data/levels/censure_road_camp.json', fetchImpl: async () => null }),
    /Invalid playtest profile/
  );
}

{
  const player = new Entity({
    id: 'mara-vey',
    name: 'Test Agent',
    type: 'player',
    stats: { hp: 14, maxHp: 14, actionPoints: 6 },
    position: { x: 1, y: 1 },
    progression: { level: 1, build: 'field-agent', primaries: {} }
  });
  const techniqueDefs = Object.fromEntries(['aimed-shot', 'stabilize', 'wire-snare'].map((id) => [id, { id }]));
  applyPlaytestProgression(player, profile.defaults.progression, techniqueDefs);
  const progression = normalizeProgression(player.progression);
  assert.equal(progression.level, 20);
  assert.deepEqual(progression.techniques, Object.keys(techniqueDefs));
  for (const field of FIELD_RATINGS) {
    assert.equal(calculateFieldRating(progression, field) >= 90, true, `${field.id} passes maximum authored checks`);
  }
  assert.equal(player.hp, player.maxHp);
  assert.equal(player.ap, player.maxAp);
}

{
  installBrowserStubs();
  const campSeed = resolvePlaytestSeed(profile, './data/levels/censure_road_camp.json');
  const game = new Game({
    canvas: mockCanvas(),
    levelPath: './data/levels/censure_road_camp.json',
    atlas: null,
    statusElement: null,
    bootOptions: { skipIntro: true, playtestSeed: campSeed }
  });
  await game.boot();
  assert.equal(game.flags.has('ash-chapel-cult-broken'), true);
  assert.equal(game.flags.has('long-ash-field-family-truth'), true);
  assert.equal(game.flags.has('censure-road-voss-route-cleared'), false);
  assert.equal(game.flags.has('censure-road-drill-close-complete'), false);
  assert.equal(game.inventory.count('choir-hymnal-fragment'), 3);
  assert.equal(game.inventory.count('choir-tally-strip'), 1);
  assert.equal(game.inventory.count('drone-service-parts'), 2);
  assert.equal(game.inventory.count('ducat') >= 10000, true);
  assert.equal(game.inventory.maxCarryWeight, 200);
  assert.equal(game.player.progression.techniques.length, Object.keys(game.techniqueDefs).length);
  assert.equal(game.questStages.get('investigate-ash-chapel-cult'), 'hallowfen-checkpoints');
  assert.equal(game.questStages.get('calcified-brothers'), 'complete');
  assert.equal(game.companionRun.recruited, true);
  assert.equal(game.companionRun.name, 'Pip');
  assert.equal(game.companionRun.upgradePoints, 42);
  assert.equal(game.companions.length, 1);
  assert.equal(game.companions[0].name, 'Pip');

  game.flags.delete('ash-chapel-cult-broken');
  game.flags.add('censure-road-drill-close-complete');
  game.companionRun.upgradePoints = 41;
  await game.boot({ preserveRun: true, skipIntro: true });
  assert.equal(game.flags.has('ash-chapel-cult-broken'), false, 'level transitions do not reapply the playtest seed');
  assert.equal(game.flags.has('censure-road-drill-close-complete'), true, 'level transitions preserve newly earned state');
  assert.equal(game.companionRun.upgradePoints, 41, 'level transitions preserve attendant progression');

  await game.boot();
  assert.equal(game.flags.has('ash-chapel-cult-broken'), true, 'restart restores the checkpoint');
  assert.equal(game.flags.has('censure-road-drill-close-complete'), false, 'restart clears target-map progress');
  assert.equal(game.companionRun.recruited, true, 'restart restores the checkpoint attendant');
  assert.equal(game.companionRun.upgradePoints, 42, 'restart restores attendant progression');

  game.levelPath = './data/levels/censure_road_supply_tent.json';
  let restartedPath = null;
  game.boot = async () => { restartedPath = game.levelPath; };
  assert.equal(game._requestRunRestart(), true);
  await Promise.resolve();
  assert.equal(restartedPath, './data/levels/censure_road_camp.json', 'dev restart returns to the URL target');
}

console.log('Fresh-map playtest profile tests passed.');
