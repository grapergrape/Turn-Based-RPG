import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import {
  checksumForEnvelope,
  createSaveEnvelope,
  exportSaveJson,
  readSaveEnvelope
} from '../src/core/save/SaveCodec.js';
import { SaveCoordinator } from '../src/core/save/SaveCoordinator.js';
import { MemorySaveRepository } from '../src/core/save/SaveRepository.js';
import {
  clearSaveMigrationsForTests,
  registerSaveMigration,
  SaveValidationError
} from '../src/core/save/SaveSchema.js';
import { deserializeLevelState, serializeLevelState } from '../src/core/game/GameSaveRuntime.js';
import { Game } from '../src/core/Game.js';

const LEVEL_PATH = './data/levels/ash_chapel_breach.json';

function levelState(overrides = {}) {
  return {
    consumedObjects: [],
    killedObjects: [],
    unlockedObjects: [],
    openedObjects: [],
    lootedObjects: [],
    revealedObjects: [],
    searchedObjects: [],
    deadEnemies: [],
    lootedEnemies: [],
    clearedEncounters: [],
    appliedLevelEvents: [],
    seenCombatTriggers: [],
    actorStates: [],
    tradeStockByActor: [],
    groundItems: [],
    exploredMapTiles: [],
    ...overrides
  };
}

function snapshot(overrides = {}) {
  return {
    runId: 'run-save-test',
    createdAt: '2026-07-18T08:00:00.000Z',
    levelPath: LEVEL_PATH,
    levelName: 'Ash Chapel Breach',
    mode: 'explore',
    playtimeSeconds: 321,
    player: {
      name: 'Test Agent',
      appearance: {},
      hp: 11,
      maxHp: 14,
      position: { x: 7, y: 9 },
      facing: 'nw',
      progression: { level: 3 }
    },
    companion: { run: null, position: null, facing: null },
    inventory: {
      counts: [{ item: 'field-dressing', count: 2 }],
      instances: [{ entryKey: 'censure-sidearm:1', itemId: 'censure-sidearm', condition: 77, loaded: 5 }],
      equipment: { weapon1: 'censure-sidearm:1' }
    },
    inventoryOrder: ['field-dressing', 'censure-sidearm:1'],
    maxCarryWeight: 18,
    requiredItemIds: ['censure-sidearm', 'field-dressing'],
    contentLevelPaths: [LEVEL_PATH],
    flags: ['read-warden-journal'],
    questStages: [['investigate-ash-chapel-cult', 'evidence-found']],
    questReached: [['investigate-ash-chapel-cult', ['briefed', 'evidence-found']]],
    awardedQuestXp: ['investigate-ash-chapel-cult:evidence-found'],
    clock: { yearAfterDescent: 130, fieldDay: 4, minuteOfDay: 781 },
    groundItemSeq: 2,
    selectedAttackId: 'service-knife',
    sneakMode: true,
    levels: [{ path: LEVEL_PATH, state: levelState() }],
    ...overrides
  };
}

async function envelopeFor(runSnapshot, slot = 'manual', now = '2026-07-18T09:00:00.000Z') {
  return createSaveEnvelope({ snapshot: runSnapshot, gameVersion: '0.1.0', slot, now });
}

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
    getBoundingClientRect() { return { left: 0, top: 0, width: 640, height: 480 }; },
    getContext() { return mockContext(); }
  };
}

function testLevel(id, codexId, noteId) {
  return {
    id,
    name: id,
    intro: 'Test field.',
    width: 5,
    height: 5,
    tileSize: 64,
    tiles: ['.....', '.....', '.....', '.....', '.....'],
    legend: { '.': { kind: 'floor', walkable: true } },
    spawns: { player: { actor: 'mara-vey', x: 1, y: 1 }, enemies: [], npcs: [] },
    objects: [],
    dialogue: [],
    quests: [],
    codex: [{ id: codexId, name: codexId, summary: 'Current referenced content.' }],
    journalNotes: [{ id: noteId, flag: noteId, text: 'Current referenced finding.' }]
  };
}

function installGameStubs(overrides) {
  globalThis.window = {
    addEventListener() {},
    requestAnimationFrame: (callback) => setTimeout(callback, 0)
  };
  globalThis.document = { createElement: () => mockCanvas() };
  const rootUrl = new URL('../', import.meta.url);
  globalThis.fetch = async (path) => {
    const normalized = String(path).replace(/^\.\//, '');
    if (Object.hasOwn(overrides, normalized)) {
      return {
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => structuredClone(overrides[normalized])
      };
    }
    try {
      const text = await readFile(new URL(normalized, rootUrl), 'utf8');
      return { ok: true, status: 200, statusText: 'OK', json: async () => JSON.parse(text) };
    } catch {
      return { ok: false, status: 404, statusText: 'Not Found', json: async () => null };
    }
  };
}

{
  const run = snapshot();
  const envelope = await envelopeFor(run);
  const read = await readSaveEnvelope(exportSaveJson(envelope));
  assert.deepEqual(read.envelope.payload, run);
  assert.equal(read.envelope.summary.playerLevel, 3);
  assert.equal(read.envelope.summary.levelPath, LEVEL_PATH);
  assert.equal(read.migrated, false);
}

{
  const damaged = await envelopeFor(snapshot());
  damaged.payload.player.hp = 1;
  await assert.rejects(() => readSaveEnvelope(damaged), (error) => error.code === 'checksum');
}

{
  const future = await envelopeFor(snapshot());
  future.formatVersion = 2;
  future.checksum = await checksumForEnvelope(future);
  await assert.rejects(() => readSaveEnvelope(future), (error) => error.code === 'future-version');
}

{
  await assert.rejects(
    () => envelopeFor(snapshot({ levelPath: '../private.json' })),
    (error) => error instanceof SaveValidationError && error.code === 'unsafe-level'
  );
  await assert.rejects(
    () => envelopeFor(snapshot({ requiredItemIds: ['../../package'] })),
    (error) => error instanceof SaveValidationError && error.code === 'malformed'
  );
}

{
  clearSaveMigrationsForTests();
  registerSaveMigration(1, (record) => ({
    ...record,
    formatVersion: 2,
    payload: { ...record.payload, playtimeSeconds: record.payload.playtimeSeconds + 1 }
  }));
  const original = await envelopeFor(snapshot());
  const migrated = await readSaveEnvelope(original, { targetVersion: 2 });
  assert.equal(migrated.migrated, true);
  assert.equal(migrated.envelope.formatVersion, 2);
  assert.equal(migrated.envelope.payload.playtimeSeconds, 322);
  assert.equal(migrated.envelope.checksum, await checksumForEnvelope(migrated.envelope));
  clearSaveMigrationsForTests();
}

{
  const record = await envelopeFor(snapshot());
  const repository = new MemorySaveRepository([record]);
  const coordinator = new SaveCoordinator({ repository, gameVersion: '0.2.0' });
  const manual = (await coordinator.listSlots()).find((row) => row.slot === 'manual');
  assert.equal(manual.status, 'valid');
  assert.equal(manual.gameVersionMismatch, true);
  assert.deepEqual((await coordinator.load('manual')).payload, snapshot());
}

{
  const records = await Promise.all([
    envelopeFor(snapshot({ runId: 'rotation-run' }), 'autosave-1', '2026-07-18T09:00:00.000Z'),
    envelopeFor(snapshot({ runId: 'rotation-run' }), 'autosave-2', '2026-07-18T09:01:00.000Z'),
    envelopeFor(snapshot({ runId: 'rotation-run' }), 'autosave-3', '2026-07-18T09:02:00.000Z')
  ]);
  const repository = new MemorySaveRepository(records);
  const coordinator = new SaveCoordinator({ repository, gameVersion: '0.1.0' });
  const written = await coordinator.saveAuto(snapshot({ runId: 'rotation-run', playtimeSeconds: 999 }));
  assert.equal(written.slot, 'autosave-1');
  assert.equal((await repository.get('autosave-1')).payload.playtimeSeconds, 999);
  assert.equal((await repository.get('autosave-2')).payload.playtimeSeconds, 321);
}

{
  const oldRecord = await envelopeFor(snapshot());
  const repository = new MemorySaveRepository([oldRecord]);
  const coordinator = new SaveCoordinator({ repository, gameVersion: '0.1.0' });
  repository.failNextWrite = new Error('disk full');
  await assert.rejects(() => coordinator.saveManual(snapshot({ playtimeSeconds: 600 })), /disk full/);
  assert.deepEqual(await repository.get('manual'), oldRecord);
}

{
  const oldManual = await envelopeFor(snapshot());
  const oldAuto = await envelopeFor(snapshot(), 'autosave-1');
  const imported = await envelopeFor(snapshot({ runId: 'imported-run', playtimeSeconds: 700 }));
  const repository = new MemorySaveRepository([oldManual, oldAuto]);
  const coordinator = new SaveCoordinator({ repository, gameVersion: '0.1.0' });
  const result = await coordinator.importJson(exportSaveJson(imported));
  assert.equal(result.slot, 'manual');
  assert.equal(result.runId, 'imported-run');
  assert.deepEqual((await repository.list()).map((entry) => entry.slot), ['manual']);
}

{
  const repository = new MemorySaveRepository([await envelopeFor(snapshot())]);
  const coordinator = new SaveCoordinator({ repository, gameVersion: '0.1.0' });
  coordinator.beginNewRun();
  repository.failNextWrite = new Error('quota exceeded');
  await assert.rejects(() => coordinator.saveAuto(snapshot({ runId: 'new-run' })), /quota exceeded/);
  assert.equal((await repository.list()).length, 1);
  await coordinator.saveAuto(snapshot({ runId: 'new-run' }));
  const records = await repository.list();
  assert.equal(records.length, 1);
  assert.equal(records[0].runId, 'new-run');
}

{
  const runtimeState = {
    consumedObjects: new Set(['altar']),
    killedObjects: new Set(),
    unlockedObjects: new Set(['gate']),
    openedObjects: new Set(),
    lootedObjects: new Set(),
    revealedObjects: new Set(),
    searchedObjects: new Map([['desk', new Set(['careful'])]]),
    deadEnemies: new Set(['cultist-1']),
    lootedEnemies: new Set(),
    clearedEncounters: new Set(['nave']),
    appliedLevelEvents: new Set(['victory']),
    seenCombatTriggers: new Set(['nave-trigger']),
    actorStates: new Map([['guard', { hp: 4, position: { x: 3, y: 2 } }]]),
    tradeStockByActor: new Map([['trader', [{ item: 'field-dressing', count: 1 }]]]),
    groundItems: [{ id: 'drop-1', itemId: 'field-dressing', name: 'Old Dressing Name', model: 'old-model', x: 1, y: 2 }],
    exploredMapTiles: new Set(['1,1', '1,2'])
  };
  const serialized = serializeLevelState(runtimeState);
  assert.equal(Object.hasOwn(serialized.groundItems[0], 'name'), false);
  assert.equal(Object.hasOwn(serialized.groundItems[0], 'model'), false);
  const restored = deserializeLevelState(serialized);
  assert.deepEqual(restored.consumedObjects, runtimeState.consumedObjects);
  assert.deepEqual(restored.searchedObjects, runtimeState.searchedObjects);
  assert.deepEqual(restored.actorStates, runtimeState.actorStates);
  assert.deepEqual(restored.exploredMapTiles, runtimeState.exploredMapTiles);
}

{
  const firstPath = './data/levels/save_integration_a.json';
  const secondPath = './data/levels/save_integration_b.json';
  const secondLevel = testLevel('save-integration-b', 'second-file', 'second-note');
  secondLevel.quests = ['investigate-ash-chapel-cult'];
  secondLevel.spawns.npcs = [{
    actor: 'catacombs-survivor-hanne',
    spawnId: 'conditional-witness',
    x: 2,
    y: 2,
    conditions: {
      flag: 'second-note',
      items: { 'field-dressing': 1 },
      questStages: { 'investigate-ash-chapel-cult': 'evidence-found' }
    }
  }];
  installGameStubs({
    'data/levels/save_integration_a.json': testLevel('save-integration-a', 'first-file', 'first-note'),
    'data/levels/save_integration_b.json': secondLevel
  });
  const game = new Game({
    canvas: mockCanvas(),
    levelPath: firstPath,
    atlas: {},
    statusElement: null,
    bootOptions: { skipIntro: true, noCombat: true },
    gameVersion: '0.1.0'
  });
  game._beginFreshRunMetadata();
  await game.boot();
  game.flags.add('first-note');
  game.player.hp = Math.max(1, game.player.hp - 2);
  await game._transitionLevel({ path: secondPath, player: { x: 3, y: 3 } });
  game.flags.add('second-note');
  game.questStages.set('investigate-ash-chapel-cult', 'evidence-found');
  game.questReached.set('investigate-ash-chapel-cult', new Set(['active', 'evidence-found']));
  game.clock.fieldDay = 7;
  game.clock.minuteOfDay = 915;
  const dressingCount = game.inventory.count('field-dressing');

  const run = game.createRunSnapshot();
  assert.equal(Object.hasOwn(run, 'questDefs'), false);
  assert.equal(Object.hasOwn(run, 'codexDefs'), false);
  assert.equal(Object.hasOwn(run, 'journalNotes'), false);
  assert.deepEqual(run.contentLevelPaths, [firstPath, secondPath]);
  await envelopeFor(run);

  game.flags.clear();
  game.questStages.set('investigate-ash-chapel-cult', 'active');
  game.player.hp = 1;
  game.inventory.remove('field-dressing', game.inventory.count('field-dressing'));
  await game.boot({ preserveRun: true, restoreSnapshot: run, skipIntro: true });

  assert.equal(game.levelPath, secondPath);
  assert.deepEqual(game.player.position, { x: 3, y: 3 });
  assert.equal(game.player.hp, run.player.hp);
  assert.equal(game.inventory.count('field-dressing'), dressingCount);
  assert.deepEqual([...game.flags].sort(), ['first-note', 'second-note']);
  assert.equal(game.questStages.get('investigate-ash-chapel-cult'), 'evidence-found');
  assert.ok(game.npcs.some((actor) => actor.spawnId === 'conditional-witness'));
  assert.equal(game.clock.fieldDay, 7);
  assert.equal(game.clock.minuteOfDay, 915);
  assert.deepEqual(game.codexDefs.map((entry) => entry.id).sort(), ['first-file', 'second-file']);
  assert.deepEqual(game.journalNotes.map((entry) => entry.id).sort(), ['first-note', 'second-note']);
}

console.log('saveSystem: codec, compatibility, rotation, recovery, import, and state round trips passed.');
