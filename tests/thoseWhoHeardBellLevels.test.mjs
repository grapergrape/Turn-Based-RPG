import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { Game } from '../src/core/Game.js';
import { getSprite } from '../src/render/spriteCatalog.js';
import { Grid } from '../src/world/Grid.js';
import { findPath, reachableCells } from '../src/world/Pathfinder.js';

const root = new URL('../', import.meta.url);

async function json(path) {
  return JSON.parse(await readFile(new URL(path, root), 'utf8'));
}

function objectById(level, id) {
  const object = level.objects.find((entry) => entry.id === id);
  assert.ok(object, `${level.id} is missing object ${id}`);
  return object;
}

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
  globalThis.fetch = async (path) => {
    const normalized = String(path).replace(/^\.\//, '');
    try {
      const text = await readFile(new URL(normalized, root), 'utf8');
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

async function waitFor(predicate, label) {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    if (predicate()) return;
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
  assert.fail(label);
}

function gridWithClosedObjects(level) {
  const grid = new Grid(level);
  for (const object of level.objects) {
    if (object.blocking) grid.addBlocked(object.x, object.y);
  }
  return grid;
}

function pathExists(grid, start, target) {
  if (!grid.isWalkable(start.x, start.y) || !grid.isWalkable(target.x, target.y)) return false;
  const queue = [start];
  const seen = new Set([`${start.x},${start.y}`]);
  const directions = [
    { x: 1, y: 0 },
    { x: -1, y: 0 },
    { x: 0, y: 1 },
    { x: 0, y: -1 }
  ];
  for (let index = 0; index < queue.length; index += 1) {
    const cell = queue[index];
    if (cell.x === target.x && cell.y === target.y) return true;
    for (const direction of directions) {
      const next = { x: cell.x + direction.x, y: cell.y + direction.y };
      const key = `${next.x},${next.y}`;
      if (seen.has(key) || !grid.isWalkable(next.x, next.y)) continue;
      seen.add(key);
      queue.push(next);
    }
  }
  return false;
}

function hasReachableAdjacent(grid, start, object) {
  return [
    { x: 1, y: 0 },
    { x: -1, y: 0 },
    { x: 0, y: 1 },
    { x: 0, y: -1 },
    { x: 1, y: 1 },
    { x: 1, y: -1 },
    { x: -1, y: 1 },
    { x: -1, y: -1 }
  ].some((offset) => pathExists(grid, start, {
    x: object.x + offset.x,
    y: object.y + offset.y
  }));
}

test('graveyard chapel entries and the two-way catacomb mouth are wired at the locked coordinates', async () => {
  const exterior = await json('data/levels/long_ash_road_approach.json');
  const vigil = objectById(exterior, 'long-ash-vigil-chapel-entry');
  const mortuary = objectById(exterior, 'long-ash-mortuary-chapel-entry');
  const mouth = objectById(exterior, 'graveyard-catacomb-mouth');

  assert.deepEqual([vigil.x, vigil.y, vigil.blocking ?? false], [131, 47, false]);
  assert.equal(vigil.interact.dialogue, 'long-ash-vigil-chapel-entry');
  assert.deepEqual(vigil.clickAreas, [
    { x0: 129, y0: 45, x1: 130, y1: 46 },
    { x0: 130, y0: 46, x1: 131, y1: 47 }
  ]);
  assert.deepEqual(vigil.interactionMarker, { x: 130, y: 46 });
  assert.deepEqual([mortuary.x, mortuary.y, mortuary.blocking ?? false], [142, 47, false]);
  assert.equal(mortuary.interact.dialogue, 'long-ash-mortuary-chapel-entry');
  assert.deepEqual(mortuary.clickAreas, [
    { x0: 140, y0: 45, x1: 141, y1: 46 },
    { x0: 141, y0: 46, x1: 142, y1: 47 }
  ]);
  assert.deepEqual(mortuary.interactionMarker, { x: 141, y: 46 });
  assert.deepEqual([mouth.x, mouth.y, mouth.blocking], [143, 48, true]);
  assert.equal(mouth.interact.dialogue, 'long-ash-listening-shortcut-return');
});

test('clicking either rendered chapel door opens its entry and loads the matching interior', async () => {
  installBrowserStubs();
  const specs = [
    {
      player: { x: 130, y: 48 },
      doorCells: [{ x: 130, y: 46 }, { x: 131, y: 46 }],
      dialogue: 'long-ash-vigil-chapel-entry',
      level: 'long-ash-vigil-chapel',
      destination: { x: 4, y: 7 }
    },
    {
      player: { x: 141, y: 48 },
      doorCells: [{ x: 141, y: 46 }, { x: 142, y: 46 }],
      dialogue: 'long-ash-mortuary-chapel-entry',
      level: 'long-ash-mortuary-chapel',
      destination: { x: 6, y: 9 }
    }
  ];

  for (const spec of specs) {
    const game = new Game({
      canvas: mockCanvas(),
      levelPath: './data/levels/long_ash_road_approach.json',
      atlas: {},
      statusElement: null,
      bootOptions: {
        skipIntro: true,
        noCombat: true,
        player: spec.player
      }
    });
    await game.boot();

    for (const doorCell of spec.doorCells) {
      const target = game._interactionTargetAtCell(doorCell, 'explore');
      assert.equal(target.type, 'object');
      assert.equal(target.object.interact.dialogue, spec.dialogue);
    }

    game.renderer.toGrid = () => spec.doorCells[0];
    game._handleExploreClick({ button: 0, x: 0, y: 0 });
    assert.equal(game.dialogue?.id, spec.dialogue);
    game._chooseDialogueOption(0);
    await waitFor(
      () => game.level?.id === spec.level && game.ready,
      `${spec.dialogue} did not load ${spec.level}`
    );
    assert.deepEqual(game.player.position, spec.destination);
  }
});

test('graveyard chapel exits remain usable after choosing to stay inside', async () => {
  installBrowserStubs();
  const specs = [
    {
      path: './data/levels/long_ash_vigil_chapel.json',
      doors: [{ x: 4, y: 8 }, { x: 5, y: 8 }],
      dialogue: 'long-ash-vigil-chapel-exit',
      destination: { x: 131, y: 47 }
    },
    {
      path: './data/levels/long_ash_mortuary_chapel.json',
      doors: [{ x: 6, y: 10 }, { x: 7, y: 10 }],
      dialogue: 'long-ash-mortuary-chapel-exit',
      destination: { x: 142, y: 47 }
    }
  ];

  for (const spec of specs) {
    const game = new Game({
      canvas: mockCanvas(),
      levelPath: spec.path,
      atlas: {},
      statusElement: null,
      bootOptions: { skipIntro: true, noCombat: true }
    });
    await game.boot();

    const firstTarget = game._interactionTargetAtCell(spec.doors[0], 'explore');
    assert.equal(firstTarget.type, 'object');
    game._executeExploreTarget(firstTarget);
    assert.equal(game.dialogue?.id, spec.dialogue);
    game._chooseDialogueOption(1);
    assert.equal(game.uiScreen, null);

    const retryTarget = game._interactionTargetAtCell(spec.doors[1], 'explore');
    assert.equal(retryTarget.type, 'object', `${spec.dialogue} remains targetable after staying inside`);
    game._executeExploreTarget(retryTarget);
    assert.equal(game.dialogue?.id, spec.dialogue);
    game._chooseDialogueOption(0);

    await waitFor(
      () => game.level?.id === 'long-ash-road-approach' && game.ready,
      `${spec.dialogue} did not return to the graveyard`
    );
    assert.deepEqual(game.player.position, spec.destination);
  }
});

test('the three interiors keep their locked footprints and open circulation paths', async () => {
  const levels = [
    await json('data/levels/long_ash_vigil_chapel.json'),
    await json('data/levels/long_ash_mortuary_chapel.json'),
    await json('data/levels/long_ash_listening_vault.json')
  ];
  assert.deepEqual(levels.map((level) => [level.width, level.height]), [
    [10, 9],
    [14, 11],
    [15, 15]
  ]);

  for (const level of levels) {
    assert.equal(level.tiles.length, level.height);
    assert.equal(level.tiles.every((row) => row.length === level.width), true);
    const grid = gridWithClosedObjects(level);
    assert.equal(grid.isWalkable(level.spawns.player.x, level.spawns.player.y), true);
  }

  const vigil = levels[0];
  const vigilGrid = gridWithClosedObjects(vigil);
  for (const id of ['hessa-concealed-panel', 'vigil-twelve-cup-rack', 'hessa-gravekeeper-chair', 'vigil-alms-box']) {
    assert.equal(hasReachableAdjacent(vigilGrid, vigil.spawns.player, objectById(vigil, id)), true, `${id} is reachable`);
  }

  const mortuary = levels[1];
  const mortuaryGrid = gridWithClosedObjects(mortuary);
  for (const id of ['mortuary-tag-board', 'mortuary-counterweight-panel', 'mortuary-road-warden-lockbox', 'mortuary-linen-cabinet']) {
    assert.equal(hasReachableAdjacent(mortuaryGrid, mortuary.spawns.player, objectById(mortuary, id)), true, `${id} is reachable`);
  }

  const vault = levels[2];
  const vaultGrid = gridWithClosedObjects(vault);
  for (const id of ['sava-niche-inspection-hatch', 'vault-listening-apparatus', 'mortuary-examination-docket', 'vault-restraint-chair', 'listening-vault-catacomb-shortcut']) {
    assert.equal(hasReachableAdjacent(vaultGrid, vault.spawns.player, objectById(vault, id)), true, `${id} is reachable`);
  }

  const niche = objectById(vault, 'sava-sealed-listening-niche');
  const combatGrid = gridWithClosedObjects(vault);
  combatGrid.removeBlocked(niche.x, niche.y);
  const nicheApproach = { x: 7, y: 3 };
  for (let y = 3; y <= 8; y += 1) {
    assert.equal(combatGrid.isWalkable(7, y), true, `Sapphira retreat lane is open at 7,${y}`);
  }
  assert.equal(reachableCells(combatGrid, nicheApproach, 99).size + 1, 140);
  assert.equal(findPath(combatGrid, nicheApproach, vault.spawns.player)?.length, 10);

  const retreatCells = [
    { x: 6, y: 3 },
    { x: 8, y: 3 },
    { x: 6, y: 4 },
    { x: 7, y: 4 },
    { x: 8, y: 4 }
  ];
  assert.equal(retreatCells.every((cell) => combatGrid.isWalkable(cell.x, cell.y)), true);

  const vaultArrival = { x: vault.spawns.player.x, y: vault.spawns.player.y };
  const mortuaryStair = mortuary.levelTransitions.find((transition) => transition.id === 'mortuary-listening-vault-stair');
  assert.deepEqual(mortuaryStair.loadLevel.player, vaultArrival);
  const stairDialogue = await json('data/dialogue/long-ash-mortuary-stair.json');
  assert.deepEqual(stairDialogue.nodes.start.choices[0].effects.loadLevel.player, vaultArrival);
});

test('the hidden register and counterweight landing reveal through their own door groups', async () => {
  const vigil = await json('data/levels/long_ash_vigil_chapel.json');
  const panel = objectById(vigil, 'hessa-concealed-panel');
  const register = objectById(vigil, 'vigil-book-of-kept-names');
  assert.equal(panel.doorGroup, 'vigil-hidden-panel');
  assert.deepEqual(panel.closedWhenFlags, ['heard-bell-register-rehidden']);
  assert.deepEqual(panel.disabledWhenFlags, ['heard-bell-register-rehidden']);
  assert.equal(register.interact.dialogue, 'long-ash-book-of-kept-names');
  assert.deepEqual(register.hiddenWhenFlags, [
    'heard-bell-register-rehidden',
    'heard-bell-records-carried'
  ]);
  assert.equal(register.doorGroup, 'vigil-hidden-panel');
  assert.equal(register.hiddenUntilOpened, true);
  assert.equal((vigil.hiddenRegions ?? []).some((entry) => entry.id === 'vigil-hidden-register-compartment'), false);

  const mortuary = await json('data/levels/long_ash_mortuary_chapel.json');
  const counterweight = objectById(mortuary, 'mortuary-counterweight-panel');
  const landing = objectById(mortuary, 'mortuary-stair-landing');
  assert.equal(counterweight.doorGroup, 'mortuary-counterweight-stair');
  assert.equal(landing.interact.dialogue, 'long-ash-mortuary-stair');
  assert.equal(landing.doorGroup, 'mortuary-counterweight-stair');
  assert.equal(landing.hiddenUntilOpened, true);
  assert.equal((mortuary.hiddenRegions ?? []).some((entry) => entry.id === 'mortuary-counterweight-landing'), false);

  const methods = counterweight.interact.lock.methods;
  assert.deepEqual(methods.map((method) => method.id), [
    'use-gravekeeper-key',
    'pick-counterweight-keyway',
    'release-counterweight-service-slot'
  ]);
  assert.equal(methods[1].requiresSecurityTool, false);
  const expectedRouteFlags = [
    'heard-bell-stair-opened-key',
    'heard-bell-stair-opened-security',
    'heard-bell-stair-opened-engineering'
  ];
  for (const [index, method] of methods.entries()) {
    assert.equal(method.success.openDoorGroup, 'mortuary-counterweight-stair');
    assert.equal(method.success.setFlag.includes('heard-bell-mortuary-stair-opened'), true);
    assert.equal(method.success.setFlag.includes(expectedRouteFlags[index]), true);
  }
});

test('completed record outcomes update the physical rooms across level loads', async () => {
  const vigil = await json('data/levels/long_ash_vigil_chapel.json');
  const panel = objectById(vigil, 'hessa-concealed-panel');
  const register = objectById(vigil, 'vigil-book-of-kept-names');
  panel.opened = true;
  const vigilRuntime = {
    flags: new Set(['heard-bell-register-rehidden']),
    grid: gridWithClosedObjects(vigil),
    level: {
      props: vigil.objects,
      interactables: vigil.objects.filter((object) => object.interact)
    },
    groundItems: []
  };

  assert.equal(Game.prototype._syncFlagConditionalObjects.call(vigilRuntime, { refreshScene: false }), true);
  assert.equal(panel.opened, false);
  assert.equal(panel.disabledByFlag, true);
  assert.equal(register.hiddenByFlag, true);
  assert.equal(Game.prototype._allInteractables.call(vigilRuntime).includes(panel), false);
  assert.equal(Game.prototype._allInteractables.call(vigilRuntime).includes(register), false);

  const evidenceVigil = await json('data/levels/long_ash_vigil_chapel.json');
  const carriedRegister = objectById(evidenceVigil, 'vigil-book-of-kept-names');
  const evidenceVigilRuntime = {
    flags: new Set(['heard-bell-records-carried']),
    grid: gridWithClosedObjects(evidenceVigil),
    level: {
      props: evidenceVigil.objects,
      interactables: evidenceVigil.objects.filter((object) => object.interact)
    },
    groundItems: []
  };
  Game.prototype._syncFlagConditionalObjects.call(evidenceVigilRuntime, { refreshScene: false });
  assert.equal(carriedRegister.hiddenByFlag, true);
  assert.equal(Game.prototype._allInteractables.call(evidenceVigilRuntime).includes(carriedRegister), false);

  const vault = await json('data/levels/long_ash_listening_vault.json');
  const docket = objectById(vault, 'mortuary-examination-docket');
  const lectern = objectById(vault, 'vault-examination-lectern');
  assert.equal(docket.kind, 'paper-scraps');
  assert.deepEqual(docket.hiddenWhenFlags, ['heard-bell-records-carried']);
  const vaultRuntime = {
    flags: new Set(['heard-bell-records-carried']),
    grid: gridWithClosedObjects(vault),
    level: {
      props: vault.objects,
      interactables: vault.objects.filter((object) => object.interact)
    },
    groundItems: []
  };
  Game.prototype._syncFlagConditionalObjects.call(vaultRuntime, { refreshScene: false });
  assert.equal(docket.hiddenByFlag, true);
  assert.equal(Boolean(lectern.hiddenByFlag), false);
  assert.equal(Game.prototype._allInteractables.call(vaultRuntime).includes(docket), false);
});

test('a concealed stair cannot be targeted or mapped before its door group opens', async () => {
  const mortuary = await json('data/levels/long_ash_mortuary_chapel.json');
  const landing = objectById(mortuary, 'mortuary-stair-landing');
  const counterweight = objectById(mortuary, 'mortuary-counterweight-panel');
  const runtime = {
    groundItems: [],
    level: { interactables: [counterweight, landing] }
  };

  assert.deepEqual(Game.prototype._allInteractables.call(runtime), [counterweight]);
  assert.equal(Game.prototype._allInteractables.call(runtime).some((object) => object.mapMarker?.label === 'Listening Vault Stair'), false);

  const explored = new Set();
  for (let y = 0; y < mortuary.height; y += 1) {
    for (let x = 0; x < mortuary.width; x += 1) explored.add(`${x},${y}`);
  }
  const journalRuntime = {
    grid: new Grid(mortuary),
    level: { ...mortuary, interactables: [landing], combatTriggers: [] },
    player: { position: { x: 7, y: 2 } },
    exploredMapTiles: explored,
    hiddenTiles: new Set(),
    npcs: [],
    enemies: [],
    questDefs: {},
    clearedEncounters: new Set(),
    _isQuestUpdateActiveForMap: () => false,
    _objectName: (object) => object.name,
    _resolveEncounterId: (id) => id,
    _livingEnemiesForEncounter: () => []
  };
  const markerExists = () => Game.prototype._buildJournalMap.call(journalRuntime).markers
    .some((marker) => marker.label === 'Listening Vault Stair');
  assert.equal(markerExists(), false);

  landing.opened = true;
  assert.deepEqual(Game.prototype._allInteractables.call(runtime), [counterweight, landing]);
  assert.equal(markerExists(), true);
});

test('Sapphira stays hidden behind the locked niche and every normal opening starts the authored encounter safely', async () => {
  const vault = await json('data/levels/long_ash_listening_vault.json');
  const sava = vault.spawns.enemies.find((enemy) => enemy.spawnId === 'sava-rell');
  assert.ok(sava);
  assert.deepEqual({ id: sava.id, x: sava.x, y: sava.y, encounter: sava.encounter }, {
    id: 'host-sava-rell',
    x: 7,
    y: 1,
    encounter: 'sava-listening-niche'
  });
  assert.equal(sava.loot, undefined);
  assert.deepEqual(vault.onVictory, {
    setFlag: ['heard-bell-sava-found', 'heard-bell-sava-killed'],
    questUpdate: {
      quest: 'those-who-heard-the-bell',
      stage: 'judge-at-chair',
      log: 'Quest updated: pass judgment at the restraint chair.'
    }
  });

  const niche = objectById(vault, 'sava-sealed-listening-niche');
  assert.equal(niche.doorGroup, 'sava-listening-niche');
  assert.equal(niche.passableWhenOpen, true);
  assert.equal(vault.hiddenRegions[0].doorGroup, 'sava-listening-niche');
  assert.deepEqual([vault.hiddenRegions[0].x, vault.hiddenRegions[0].y], [7, 1]);

  assert.deepEqual([vault.width, vault.height], [15, 15]);
  assert.deepEqual([niche.x, niche.y], [7, 2]);
  assert.deepEqual([objectById(vault, 'sava-niche-inspection-hatch').x, objectById(vault, 'sava-niche-inspection-hatch').y], [7, 3]);
  assert.deepEqual([objectById(vault, 'vault-listening-apparatus').x, objectById(vault, 'vault-listening-apparatus').y], [5, 6]);
  const chair = objectById(vault, 'vault-restraint-chair');
  assert.deepEqual([chair.x, chair.y], [7, 9]);
  assert.deepEqual(chair.mapMarker, {
    label: 'Judgment Chair',
    kind: 'quest',
    reveal: 'always',
    conditions: {
      flag: 'heard-bell-sava-found',
      flagsAbsent: ['heard-bell-resolved']
    }
  });
  assert.deepEqual([vault.spawns.player.x, vault.spawns.player.y], [7, 13]);
  assert.deepEqual([vault.levelTransitions[0].x, vault.levelTransitions[0].y], [7, 13]);
  assert.deepEqual(vault.levelTransitions[0].clickAreas, [{ x0: 7, y0: 14, x1: 7, y1: 14 }]);
  assert.deepEqual([objectById(vault, 'listening-vault-return-door').x, objectById(vault, 'listening-vault-return-door').y], [7, 14]);
  assert.deepEqual([objectById(vault, 'listening-vault-catacomb-shortcut').x, objectById(vault, 'listening-vault-catacomb-shortcut').y], [12, 10]);

  const hatch = objectById(vault, 'sava-niche-inspection-hatch');
  assert.equal(hatch.blocking ?? false, false);
  assert.equal(hatch.interact.dialogue, 'long-ash-sava-niche');

  for (const method of niche.interact.lock.methods) {
    assert.equal(method.conditions.flag, 'heard-bell-test-third');
    assert.deepEqual(method.conditions.flagsAbsent, ['heard-bell-sava-quieted']);
    assert.equal(method.success.setFlag, 'heard-bell-sava-found');
    assert.equal(method.success.openDoorGroup, 'sava-listening-niche');
    assert.equal(method.success.startCombat, 'sava-listening-niche');
  }
  assert.equal(
    niche.interact.lock.methods.find((method) => method.field === 'security').requiresSecurityTool,
    false
  );

  const assay = objectById(vault, 'examiner-assay-case');
  assert.equal(
    assay.interact.lock.methods.find((method) => method.field === 'security').requiresSecurityTool,
    false
  );
});

test('Sapphira defeat points the journal and map back to the judgment chair', async () => {
  installBrowserStubs();
  const game = new Game({
    canvas: mockCanvas(),
    levelPath: './data/levels/long_ash_listening_vault.json',
    atlas: {},
    statusElement: null,
    bootOptions: { skipIntro: true, noCombat: true }
  });
  await game.boot();

  const chairMarker = () => game._buildJournalMap().markers
    .find((marker) => marker.label === 'Judgment Chair');
  assert.equal(chairMarker(), undefined);

  game._applyEffects(game.level.onVictory);
  assert.equal(game.flags.has('heard-bell-sava-found'), true);
  assert.equal(game.flags.has('heard-bell-sava-killed'), true);
  assert.equal(game.questStages.get('those-who-heard-the-bell'), 'judge-at-chair');

  const quest = game._buildJournal().quests
    .find((entry) => entry.title === 'Those Who Heard the Bell');
  assert.equal(quest?.task, 'Pass judgment at the restraint chair');
  assert.equal(
    quest?.objectives.find((objective) => objective.active)?.text,
    'Pass judgment at the restraint chair.'
  );
  assert.deepEqual(chairMarker(), {
    id: 'dialogue:vault-restraint-chair',
    kind: 'quest',
    label: 'Judgment Chair',
    x: 7,
    y: 9,
    reveal: 'always'
  });

  game.flags.add('heard-bell-resolved');
  game._applyQuestUpdate({ quest: 'those-who-heard-the-bell', stage: 'complete' });
  assert.equal(chairMarker(), undefined);
  game._applyEffects(game.level.onVictory);
  assert.equal(game.questStages.get('those-who-heard-the-bell'), 'complete');
});

test('chapel-specific static kinds are registered with the intended depth and flatness', async () => {
  const expected = new Map([
    ['vigil-candle-rack', { category: 'fixture', flat: false }],
    ['gravekeeper-chair', { category: 'furniture', flat: false }],
    ['mortuary-washing-table', { category: 'furniture', flat: false }],
    ['examiner-assay-case', { category: 'furniture', flat: false }],
    ['mortuary-drain', { category: 'decal', flat: true }],
    ['mortuary-tag-board', { category: 'fixture', flat: false }],
    ['listening-apparatus', { category: 'structure', flat: false }],
    ['listening-wire', { category: 'decal', flat: true }],
    ['sealed-listening-niche', { category: 'structure', flat: false }]
  ]);
  for (const [kind, wanted] of expected) {
    const entry = getSprite(kind);
    assert.ok(entry, `${kind} is registered`);
    assert.equal(entry.category, wanted.category);
    assert.equal(Boolean(entry.flat), wanted.flat);
  }
  assert.equal(getSprite('sealed-listening-niche').layer, 18);
  assert.equal(getSprite('sealed-listening-niche').cover, 'hard');
  const vault = await json('data/levels/long_ash_listening_vault.json');
  assert.equal(objectById(vault, 'examiner-assay-case').kind, 'examiner-assay-case');
});

test('the four containers preserve the modest immediate supply manifest', async () => {
  const vigil = await json('data/levels/long_ash_vigil_chapel.json');
  const mortuary = await json('data/levels/long_ash_mortuary_chapel.json');
  const vault = await json('data/levels/long_ash_listening_vault.json');
  const loot = new Map();
  const add = (item, count) => loot.set(item, (loot.get(item) ?? 0) + count);
  for (const object of [...vigil.objects, ...mortuary.objects, ...vault.objects]) {
    for (const entry of object.interact?.loot ?? []) add(entry.item, entry.count ?? 1);
  }
  const falseTray = objectById(vigil, 'vigil-alms-box').interact.search.methods[0].success.inventory.add[0];
  add(falseTray.item, falseTray.count);

  assert.deepEqual(Object.fromEntries([...loot.entries()].sort()), {
    'ducat': 13,
    'field-dressing': 3,
    'mortuary-quieting-salt': 1,
    'relic-rounds': 3,
    'road-warden-chit': 1,
    'tarnished-saint-token': 1
  });
});

test('new level player text has no doubled or em dash', async () => {
  for (const path of [
    'data/levels/long_ash_vigil_chapel.json',
    'data/levels/long_ash_mortuary_chapel.json',
    'data/levels/long_ash_listening_vault.json'
  ]) {
    const text = await readFile(new URL(path, root), 'utf8');
    assert.equal(text.includes(String.fromCodePoint(0x2014)), false, `${path} contains an em dash`);
    assert.equal(text.includes(String.fromCodePoint(45, 45)), false, `${path} contains a doubled hyphen`);
  }
});
