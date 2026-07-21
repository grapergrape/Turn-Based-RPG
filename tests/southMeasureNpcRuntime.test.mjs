import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import { Game } from '../src/core/Game.js';
import { buildSpriteAtlas, getFrame } from '../src/render/SpriteAtlas.js';

const ROOT = new URL('../', import.meta.url);
const UNDERCROFT_FLAGS = [
  'resident-isolation-requested',
  'tarn-water-help-requested',
  'heard-yara-quell-terms'
];
const LEVELS = [
  ['ash_road_south', 81],
  ['south_measure_intake_undercroft', 4],
  ['south_measure_relief_drain', 3],
  ['south_measure_relief_maintenance_annex', 8],
  ['south_measure_morrow_freight_house', 9],
  ['south_measure_compact_clinic', 12],
  ['south_measure_measure_hall', 14],
  ['south_measure_varo_house', 3],
  ['south_measure_hidden_rows', 12],
  ['south_measure_charity_cellar', 5]
];

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
    width: 640,
    height: 480,
    style: {},
    addEventListener() {},
    getBoundingClientRect() {
      return { left: 0, top: 0, width: 640, height: 480 };
    },
    getContext() {
      return mockContext();
    }
  };
}

function installBrowserStubs() {
  globalThis.window = {
    addEventListener() {},
    requestAnimationFrame(callback) {
      callback();
      return 1;
    },
    setTimeout
  };
  globalThis.document = { createElement: () => mockCanvas() };
}

function installFileFetch() {
  globalThis.fetch = async (path) => {
    const normalized = String(path).replace(/^\.\//, '');
    try {
      const text = await readFile(new URL(normalized, ROOT), 'utf8');
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

async function bootLevel(atlas, levelName, flags = []) {
  const game = new Game({
    canvas: mockCanvas(),
    levelPath: `./data/levels/${levelName}.json`,
    atlas,
    statusElement: null,
    bootOptions: { skipIntro: true }
  });
  game.flags = new Set(flags);
  await game.boot({ preserveRun: flags.length > 0 });
  return game;
}

function assertLiveNpc(game, actor) {
  assert.equal(game.actors.includes(actor), true, `${actor.name} is in the live actor collection`);
  assert.equal(game._isOccupied(actor.x, actor.y, game.player), true, `${actor.name} blocks their occupied tile`);
  assert.ok(
    getFrame(game.atlas, actor.spriteId, 'idle', actor.facing, 0)?.frame,
    `${actor.name} resolves an idle sprite frame`
  );
  assert.equal(actor.ambient.length, 3, `${actor.name} has three runtime ambient lines`);
  if (!actor.dialogue) return;
  assert.ok(game.dialogueDefs[actor.dialogue], `${actor.name}'s dialogue is loaded with the level`);
  const target = game._interactionTargetAtCell(actor.position, 'explore');
  assert.equal(target.type, 'talk', `${actor.name} resolves as a talk target`);
}

function assertAmbientSpeech(game, actor) {
  const originalPlayerPosition = { ...game.player.position };
  for (const candidate of game.npcs) {
    candidate.speech = null;
    candidate.ambientTimer = 999;
  }
  game.player.moveTo(actor.x, actor.y);
  game.ambientSpeechCooldown = 0;
  actor.ambientTimer = 0;
  game._advanceAmbientSpeech(0.1);
  assert.ok(actor.speech, `${actor.name} can speak an ambient line in exploration`);
  assert.ok(actor.ambient.includes(actor.speech.text), `${actor.name}'s speech comes from authored barks`);
  game.player.moveTo(originalPlayerPosition.x, originalPlayerPosition.y);
}

installBrowserStubs();
installFileFetch();
const atlas = buildSpriteAtlas();

for (const [levelName, expectedNpcCount] of LEVELS) {
  const flags = levelName === 'south_measure_intake_undercroft' ? UNDERCROFT_FLAGS : [];
  const game = await bootLevel(atlas, levelName, flags);
  assert.equal(game.level.npcs.length, expectedNpcCount, `${levelName} loads every authored NPC record`);
  assert.equal(game.npcs.length, expectedNpcCount, `${levelName} instantiates every active NPC`);
  for (const actor of game.npcs) assertLiveNpc(game, actor);

  const speaker = game.npcs.find((actor) => actor.dialogue);
  assert.ok(speaker, `${levelName} has a live conversation target`);
  assertAmbientSpeech(game, speaker);
  game._executeExploreTarget(game._interactionTargetAtCell(speaker.position, 'explore'));
  assert.equal(game.dialogue?.id, speaker.dialogue, `${speaker.name}'s conversation opens through gameplay targeting`);

  if (levelName === 'south_measure_intake_undercroft') {
    game._closeDialogueScreen();
    const ona = game.level.interactables.find((object) => object.id === 'undercroft-intake-clerk');
    assert.ok(ona, 'Junia Lector is loaded as the fixed Intake Clerk character');
    const target = game._interactionTargetAtCell({ x: ona.x, y: ona.y }, 'explore');
    assert.equal(target.type, 'object', 'Junia resolves as an interactable fixed character');
    game._executeExploreTarget(target);
    assert.equal(game.dialogue?.id, 'south-measure-undercroft-ona-veyl');
  }
}

const cellar = await bootLevel(atlas, 'south_measure_charity_cellar', ['neri-agent-exposed']);
assert.equal(
  cellar.npcs.some((actor) => actor.id === 'ash-road-south-neri-vaun'),
  false,
  'exposed Salome no longer instantiates as a neutral NPC'
);
const falseCatechist = cellar.enemies.find((actor) => actor.id === 'south-measure-false-catechist');
assert.ok(falseCatechist, 'exposed Salome instantiates as the False Catechist encounter actor');
assert.ok(
  getFrame(cellar.atlas, falseCatechist.spriteId, 'idle', falseCatechist.facing, 0)?.frame,
  'the False Catechist resolves a runtime sprite frame'
);

const releasedUndercroft = await bootLevel(atlas, 'south_measure_intake_undercroft', ['intake-clerk-forced-open']);
const releasedClerk = releasedUndercroft.enemies.find((actor) => actor.id === 'south-measure-intake-clerk');
assert.ok(releasedClerk, 'forcing the wicket open instantiates Junia as a combat actor');
assert.ok(
  getFrame(releasedUndercroft.atlas, releasedClerk.spriteId, 'idle', releasedClerk.facing, 0)?.frame,
  'the released Intake Clerk resolves a runtime sprite frame'
);
assert.equal(
  releasedUndercroft.level.interactables.find((object) => object.id === 'undercroft-intake-clerk').hiddenByFlag,
  true,
  'the fixed wicket body is hidden when released Junia is active'
);

console.log('South Measure NPC runtime loading, sprites, barks, targeting, dialogue, and Salome reveal passed.');
