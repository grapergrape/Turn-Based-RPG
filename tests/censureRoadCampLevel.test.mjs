import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import { meetsDialogueConditions } from '../src/core/DialogueConditions.js';
import { getSprite } from '../src/render/spriteCatalog.js';
import { Grid } from '../src/world/Grid.js';
import { isTargetInReach, resolveInteractionTargetAtCell } from '../src/world/InteractionTargeting.js';
import { searchMethodStatus } from '../src/world/SearchSystem.js';

async function readJson(path) {
  return JSON.parse(await readFile(new URL(path, import.meta.url), 'utf8'));
}

function addBlockingObjects(grid, objects) {
  for (const object of objects) {
    if (object.blocking) grid.addBlocked(object.x, object.y);
  }
}

function pathExists(grid, start, target) {
  assert.equal(grid.isWalkable(start.x, start.y), true, 'path start is walkable');
  assert.equal(grid.isWalkable(target.x, target.y), true, `path target ${target.x},${target.y} is walkable`);
  const seen = new Set([`${start.x},${start.y}`]);
  const queue = [start];
  const dirs = [
    { x: 1, y: 0 },
    { x: -1, y: 0 },
    { x: 0, y: 1 },
    { x: 0, y: -1 }
  ];
  for (let index = 0; index < queue.length; index += 1) {
    const cell = queue[index];
    if (cell.x === target.x && cell.y === target.y) return true;
    for (const dir of dirs) {
      const next = { x: cell.x + dir.x, y: cell.y + dir.y };
      const key = `${next.x},${next.y}`;
      if (seen.has(key) || !grid.isWalkable(next.x, next.y)) continue;
      seen.add(key);
      queue.push(next);
    }
  }
  return false;
}

function reachableInteractionApproach(level, grid, object, start) {
  const candidates = [
    { x: object.x, y: object.y },
    { x: object.x + 1, y: object.y },
    { x: object.x - 1, y: object.y },
    { x: object.x, y: object.y + 1 },
    { x: object.x, y: object.y - 1 },
    { x: object.x + 1, y: object.y + 1 },
    { x: object.x + 1, y: object.y - 1 },
    { x: object.x - 1, y: object.y + 1 },
    { x: object.x - 1, y: object.y - 1 }
  ].filter((cell) => grid.isWalkable(cell.x, cell.y));

  for (const candidate of candidates) {
    if (!pathExists(grid, start, candidate)) continue;
    const target = interactionTarget(level, grid, object, candidate);
    if (target?.type === 'object' && target.object.id === object.id && isTargetInReach({ position: candidate }, target)) {
      return candidate;
    }
  }
  return null;
}

function tileComponents(level, tileChar) {
  const seen = new Set();
  const components = [];
  const dirs = [
    { x: 1, y: 0 },
    { x: -1, y: 0 },
    { x: 0, y: 1 },
    { x: 0, y: -1 }
  ];

  for (let y = 0; y < level.height; y += 1) {
    for (let x = 0; x < level.width; x += 1) {
      const key = `${x},${y}`;
      if (seen.has(key) || level.tiles[y][x] !== tileChar) continue;
      const cells = [];
      const queue = [{ x, y }];
      seen.add(key);
      for (let index = 0; index < queue.length; index += 1) {
        const cell = queue[index];
        cells.push(cell);
        for (const dir of dirs) {
          const next = { x: cell.x + dir.x, y: cell.y + dir.y };
          const nextKey = `${next.x},${next.y}`;
          if (
            seen.has(nextKey)
            || next.x < 0
            || next.y < 0
            || next.x >= level.width
            || next.y >= level.height
            || level.tiles[next.y][next.x] !== tileChar
          ) continue;
          seen.add(nextKey);
          queue.push(next);
        }
      }
      components.push(cells);
    }
  }
  return components;
}

function objectById(level, id) {
  const object = level.objects.find((entry) => entry.id === id);
  assert.ok(object, `${id} exists`);
  return object;
}

function transitionById(level, id) {
  const transition = (level.levelTransitions ?? []).find((entry) => entry.id === id);
  assert.ok(transition, `${id} exists`);
  return transition;
}

function pointInAreas(point, areas = []) {
  return areas.some((area) => {
    const left = Math.min(area.x0, area.x1);
    const right = Math.max(area.x0, area.x1);
    const top = Math.min(area.y0, area.y1);
    const bottom = Math.max(area.y0, area.y1);
    return point.x >= left && point.x <= right && point.y >= top && point.y <= bottom;
  });
}

function isCardinalAdjacent(a, b) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y) === 1;
}

function tileAt(level, point) {
  return level.tiles[point.y]?.[point.x] ?? null;
}

function interactionTarget(level, grid, object, player) {
  return resolveInteractionTargetAtCell({
    cell: { x: object.x, y: object.y },
    grid,
    player: { position: player },
    actors: [],
    enemies: [],
    interactables: level.objects.filter((entry) => entry.interact),
    mode: 'explore'
  });
}

const level = await readJson('../data/levels/censure_road_camp.json');
const grid = new Grid(level);
addBlockingObjects(grid, level.objects ?? []);
const longAsh = await readJson('../data/levels/long_ash_road_approach.json');
const longAshGrid = new Grid(longAsh);
addBlockingObjects(longAshGrid, longAsh.objects ?? []);
const longAshToCamp = await readJson('../data/dialogue/long-ash-censure-road-camp-exit.json');
const campToLongAsh = await readJson('../data/dialogue/censure-road-camp-long-ash-road-exit.json');
const hallowfenGate = await readJson('../data/dialogue/censure-road-camp-hallowfen-gate.json');
const odranDialogue = await readJson('../data/dialogue/censure-road-camp-odran.json');
const odranWatch = await readJson('../data/dialogue/censure-road-odran-watch.json');
const pellDialogue = await readJson('../data/dialogue/censure-road-camp-pell.json');
const brunaDialogue = await readJson('../data/dialogue/censure-road-camp-widow-bruna.json');
const maevActor = await readJson('../data/actors/censure-sutler-maev.json');
const maevDialogue = await readJson('../data/dialogue/censure-road-camp-maev.json');
const vossDialogue = await readJson('../data/dialogue/censure-road-camp-voss.json');
const confessionQuest = await readJson('../data/quests/censure-road-confession.json');
const absolutionChit = await readJson('../data/items/censure-absolution-chit.json');
const campRibguard = await readJson('../data/items/camp-issue-ribguard.json');
const tentSpecs = [
  {
    objectId: 'censure-road-odran-private-tent-flap',
    interiorPath: './data/levels/censure_road_odran_tent_interior.json',
    interiorFile: '../data/levels/censure_road_odran_tent_interior.json',
    returnPlayer: { x: 16, y: 19 },
    interiorPlayer: { x: 8, y: 7 },
    interiorExit: { x: 8, y: 8 },
    interiorFlap: { x: 8, y: 9 },
    approach: { x: 16, y: 19 },
    clickAreas: [{ x0: 14, y0: 14, x1: 17, y1: 18 }]
  },
  {
    objectId: 'censure-road-writ-chapel-flap',
    interiorPath: './data/levels/censure_road_writ_chapel_tent.json',
    interiorFile: '../data/levels/censure_road_writ_chapel_tent.json',
    returnPlayer: { x: 23, y: 17 },
    interiorPlayer: { x: 6, y: 7 },
    interiorExit: { x: 6, y: 8 },
    interiorFlap: { x: 6, y: 9 },
    approach: { x: 23, y: 17 },
    clickAreas: [{ x0: 20, y0: 12, x1: 26, y1: 16 }]
  },
  {
    objectId: 'censure-road-preceptor-tent-flap',
    interiorPath: './data/levels/censure_road_preceptor_tent.json',
    interiorFile: '../data/levels/censure_road_preceptor_tent.json',
    returnPlayer: { x: 47, y: 13 },
    interiorPlayer: { x: 6, y: 7 },
    interiorExit: { x: 6, y: 8 },
    interiorFlap: { x: 6, y: 9 },
    approach: { x: 47, y: 13 },
    clickAreas: [{ x0: 43, y0: 8, x1: 49, y1: 12 }]
  },
  {
    objectId: 'censure-road-quartermaster-tent-flap',
    interiorPath: './data/levels/censure_road_quartermaster_tent.json',
    interiorFile: '../data/levels/censure_road_quartermaster_tent.json',
    returnPlayer: { x: 28, y: 30 },
    interiorPlayer: { x: 6, y: 7 },
    interiorExit: { x: 6, y: 8 },
    interiorFlap: { x: 6, y: 9 },
    approach: { x: 28, y: 30 },
    clickAreas: [{ x0: 24, y0: 25, x1: 32, y1: 29 }]
  },
  {
    objectId: 'censure-road-supply-tent-flap',
    interiorPath: './data/levels/censure_road_supply_tent.json',
    interiorFile: '../data/levels/censure_road_supply_tent.json',
    returnPlayer: { x: 39, y: 36 },
    interiorPlayer: { x: 9, y: 7 },
    interiorExit: { x: 9, y: 8 },
    interiorFlap: { x: 9, y: 9 },
    approach: { x: 39, y: 36 },
    clickAreas: [
      { x0: 35, y0: 31, x1: 38, y1: 35 },
      { x0: 40, y0: 31, x1: 43, y1: 35 }
    ]
  },
  {
    objectId: 'censure-road-sutler-tent-flap',
    interiorPath: './data/levels/censure_road_sutler_tent.json',
    interiorFile: '../data/levels/censure_road_sutler_tent.json',
    returnPlayer: { x: 50, y: 37 },
    interiorPlayer: { x: 5, y: 7 },
    interiorExit: { x: 5, y: 8 },
    interiorFlap: { x: 5, y: 9 },
    approach: { x: 50, y: 37 },
    clickAreas: [{ x0: 48, y0: 32, x1: 53, y1: 36 }]
  },
  {
    objectId: 'censure-road-medic-tent-flap',
    interiorPath: './data/levels/censure_road_medic_tent.json',
    interiorFile: '../data/levels/censure_road_medic_tent.json',
    returnPlayer: { x: 60, y: 46 },
    interiorPlayer: { x: 2, y: 7 },
    interiorExit: { x: 1, y: 7 },
    interiorFlap: { x: 0, y: 7 },
    approach: { x: 60, y: 46 },
    clickAreas: [{ x0: 61, y0: 42, x1: 65, y1: 46 }]
  },
  {
    objectId: 'censure-road-quarters-tent-flap',
    interiorPath: './data/levels/censure_road_quarters_tent.json',
    interiorFile: '../data/levels/censure_road_quarters_tent.json',
    returnPlayer: { x: 16, y: 41 },
    interiorPlayer: { x: 6, y: 7 },
    interiorExit: { x: 6, y: 8 },
    interiorFlap: { x: 6, y: 9 },
    approach: { x: 16, y: 41 },
    clickAreas: [
      { x0: 12, y0: 36, x1: 14, y1: 40 },
      { x0: 16, y0: 35, x1: 18, y1: 40 },
      { x0: 20, y0: 36, x1: 22, y1: 40 }
    ]
  }
];

{
  assert.equal(level.id, 'censure-road-camp');
  assert.equal(level.name, 'Censure Road Camp');
  assert.equal(level.width, 70);
  assert.equal(level.height, 50);
  assert.equal(level.tiles.length, level.height);
  for (const [index, row] of level.tiles.entries()) {
    assert.equal(row.length, level.width, `camp row ${index} is ${level.width} cells`);
  }
  assert.deepEqual(level.spawns.player, { actor: 'mara-vey', x: 34, y: 46 });
  assert.equal(grid.isWalkable(level.spawns.player.x, level.spawns.player.y), true, 'camp spawn is walkable');
  assert.deepEqual(level.spawns.enemies, [], 'the road camp has no enemies in the demo pass');
  assert.deepEqual(level.quests, [
    'investigate-ash-chapel-cult',
    'calcified-brothers',
    'censure-road-confession'
  ]);
}

{
  for (const tile of ['u', 'v', 'l', 't']) {
    assert.equal(level.legend[tile].floor, 'forest-floor', `${tile} renders as dark undergrowth floor`);
    assert.equal(level.legend[tile].walkable, false, `${tile} blocks movement`);
    assert.equal(getSprite(level.legend[tile].kind)?.category, 'plant', `${tile} uses a plant blocker`);
  }
  assert.equal(level.legend.r.floor, 'ash-road');
  assert.equal(level.legend.s.floor, 'road-shoulder');
  assert.equal(level.legend['.'].floor, 'packed-earth');
  assert.equal(level.legend.m.floor, 'mud-track');
  assert.equal(level.legend.g.floor, 'ash-gravel');
  assert.equal(level.legend.p.floor, 'worn-canvas');
  for (const tile of ['m', 'g', 'p']) {
    assert.equal(level.legend[tile].kind, 'floor', `${tile} remains a floor tile`);
    assert.equal(level.legend[tile].walkable, true, `${tile} remains walkable`);
  }
  const floorCounts = Object.fromEntries(Object.keys(level.legend).map((tile) => [tile, 0]));
  for (const row of level.tiles) {
    for (const tile of row) floorCounts[tile] = (floorCounts[tile] ?? 0) + 1;
  }
  assert.ok(floorCounts.g >= 240, 'camp has ash-gravel work-ground texture');
  assert.ok(floorCounts.m >= 200, 'camp has muddy traffic and drill-yard texture');
  assert.ok(floorCounts.p >= 30, 'camp has worn-canvas floor mats at tent mouths');
  const pathTiles = new Set(['m', 'g', 'p', 'r', 's']);
  for (const [label, point] of [
    ['south spine', { x: 34, y: 46 }],
    ['bell lane', { x: 33, y: 18 }],
    ['north camp spine', { x: 34, y: 20 }],
    ['preceptor spur', { x: 47, y: 14 }],
    ['training ground lane', { x: 54, y: 27 }],
    ['quartermaster lane', { x: 30, y: 31 }],
    ['supply lane', { x: 39, y: 36 }],
    ['sutler lane', { x: 50, y: 37 }],
    ['quarters lane', { x: 16, y: 41 }],
    ['evidence lane', { x: 58, y: 41 }],
    ['medic lane', { x: 60, y: 46 }]
  ]) {
    assert.equal(pathTiles.has(tileAt(level, point)), true, `${label} is marked by a visible path tile`);
    assert.equal(grid.isWalkable(point.x, point.y), true, `${label} remains walkable`);
  }
  for (const point of [
    { x: 0, y: 0 },
    { x: 69, y: 0 },
    { x: 0, y: 49 },
    { x: 69, y: 49 },
    { x: 8, y: 8 },
    { x: 68, y: 46 }
  ]) {
    assert.equal(grid.isWalkable(point.x, point.y), false, `undergrowth blocks ${point.x},${point.y}`);
  }
  assert.equal(grid.isWalkable(34, 48), true, 'south road remains walkable to the return gate');
  assert.equal(grid.isWalkable(66, 16), true, 'east road reaches the sealed gate approach');
  assert.equal(grid.isWalkable(67, 16), false, 'sealed Hallowfen gate blocks the east road');
  assert.equal(pathExists(grid, level.spawns.player, { x: 34, y: 48 }), true, 'spawn reaches the Long Ash return gate');
  assert.equal(pathExists(grid, level.spawns.player, { x: 66, y: 16 }), true, 'spawn reaches the Hallowfen gate approach');
}

{
  const npcs = level.spawns.npcs;
  const expected = [
    'censure-father-odran',
    'censure-preceptor-voss',
    'censure-quartermaster-runa',
    'censure-sutler-maev',
    'censure-brother-caldus',
    'censure-bell-clerk-sera',
    'censure-writ-runner-pell',
    'censure-novice-ivarn',
    'censure-sister-hanne',
    'censure-ash-porter-joric',
    'censure-evidence-keeper-malco',
    'censure-tether-guard-elian',
    'censure-widow-bruna'
  ];
  assert.equal(npcs.length, 13, 'the camp keeps exactly thirteen people');
  assert.deepEqual(npcs.map((npc) => npc.actor), expected);
  assert.equal(new Set(npcs.map((npc) => npc.actor)).size, 13, 'camp NPC actors are unique');
  for (const npc of npcs) {
    assert.equal(level.dialogue.includes(npc.dialogue), true, `${npc.dialogue} is loaded by the camp`);
    assert.equal(grid.isWalkable(npc.x, npc.y), true, `${npc.actor} stands on walkable ground`);
    assert.equal(pathExists(grid, level.spawns.player, { x: npc.x, y: npc.y }), true, `${npc.actor} is reachable from spawn`);
    assert.equal(Array.isArray(npc.ambient) && npc.ambient.length > 0, true, `${npc.actor} has an ambient line`);
  }
}

{
  const requiredSites = [
    'censure-road-writ-chapel-flap',
    'censure-road-odran-private-tent-flap',
    'censure-road-confession-screen',
    'censure-road-bell-mast',
    'censure-road-preceptor-tent-flap',
    'censure-road-drill-yard-chalk',
    'censure-road-sword-yard-dummy-west',
    'censure-road-sword-yard-dummy-east',
    'censure-road-shooting-range-target-left',
    'censure-road-shooting-range-target-center',
    'censure-road-shooting-range-target-right',
    'censure-road-quartermaster-table',
    'censure-road-supply-tent-flap',
    'censure-road-sutler-tent-flap',
    'censure-road-sutler-cart',
    'censure-road-evidence-shed-door',
    'censure-road-medic-tent-flap',
    'censure-road-quarters-tent-flap',
    'censure-road-writ-board',
    'censure-road-tether-line',
    'censure-road-ash-latrines',
    'censure-road-water-barrel-45'
  ];
  for (const id of requiredSites) objectById(level, id);
  assert.ok(level.objects.filter((object) => object.kind === 'farm-fence' && object.blocking).length >= 180, 'camp walls are fenced around the playable area');
  const tentTiles = level.tiles.join('').split('').filter((tile) => tile === 'C').length;
  assert.ok(tentTiles >= 250, 'camp uses mapped multi-cell tents for work and quarters');
  assert.equal(level.legend.C.kind, 'canvas-tent-building-block');
  assert.equal(getSprite(level.legend.C.kind)?.block, true, 'camp tent bodies are connected render blocks');
  assert.equal(level.objects.filter((object) => object.kind === 'canvas-tent-flap').length, tentSpecs.length);
  assert.equal(objectById(level, 'censure-road-evidence-shed-door').variant, 'storage-shed');
  assert.equal(level.legend.S.kind, 'storage-shed-building-block', 'evidence shed uses the existing storage shed block');
  assert.ok(tileComponents(level, 'C').length >= 10, 'camp tents are arranged as separate chapel, command, supply, trade, medical, and quarters footprints');
  assert.equal(level.tiles[36][15], '.', 'cult-breaker quarters keep a lane gap between tent bays');
  assert.equal(level.tiles[36][19], '.', 'cult-breaker quarters keep a second lane gap between tent bays');
  assert.notEqual(level.tiles[34][39], 'C', 'supply tents keep a work lane between the two supply bays');
  assert.equal(grid.isWalkable(39, 34), true, 'supply tent work lane is walkable');
  assert.ok(level.objects.filter((object) => object.id?.startsWith('censure-road-drill-yard-rope-')).length >= 6, 'drill yard has rope and stake detail');
  assert.ok(level.objects.filter((object) => object.id?.startsWith('censure-road-drill-yard-chalk')).length >= 4, 'drill yard has readable chalk marks');
  assert.equal(getSprite('training-dummy')?.category, 'furniture', 'training dummies are cataloged as furniture');
  assert.equal(getSprite('devil-target')?.category, 'structure', 'shooting range targets are cataloged as structures');
  for (const kind of ['trampled-mud', 'practice-scars', 'spent-casings']) {
    assert.equal(getSprite(kind)?.flat, true, `${kind} renders as a flat ground texture`);
  }
  assert.ok(level.objects.filter((object) => object.kind === 'trampled-mud').length >= 20, 'training spaces have trampled ground texture');
  assert.ok(level.objects.filter((object) => object.kind === 'practice-scars').length >= 6, 'sword yard has cut and chalk ground marks');
  assert.ok(level.objects.filter((object) => object.kind === 'spent-casings').length >= 6, 'shooting range has spent casing detail');
  assert.equal(level.objects.filter((object) => object.kind === 'training-dummy').length, 2, 'sword yard has two training dummies');
  assert.equal(level.objects.filter((object) => object.kind === 'devil-target').length, 3, 'shooting range has three devil targets');
  const swordDummy = objectById(level, 'censure-road-sword-yard-dummy-west');
  assert.equal(swordDummy.interact?.type, 'note', 'sword yard dummy is inspectable');
  assert.equal(swordDummy.mapMarker?.label, 'Sword Yard');
  const rangeTarget = objectById(level, 'censure-road-shooting-range-target-center');
  assert.equal(rangeTarget.interact?.type, 'note', 'center devil target is inspectable');
  assert.equal(rangeTarget.mapMarker?.label, 'Shooting Range');
  assert.equal(pathExists(grid, level.spawns.player, { x: 54, y: 27 }), true, 'spawn reaches the shooting range firing line');
}

{
  for (const object of level.objects.filter((entry) => entry.interact)) {
    const approach = reachableInteractionApproach(level, grid, object, level.spawns.player);
    assert.ok(approach, `${object.id ?? object.kind} has a reachable interaction approach`);
  }
}

{
  const privateTent = objectById(level, 'censure-road-odran-private-tent-flap');
  assert.equal(privateTent.interact, undefined, "Odran's tent is open and entered by walking through it");
  assert.equal(privateTent.mapMarker?.kind, 'exit');

  const odranInterior = await readJson('../data/levels/censure_road_odran_tent_interior.json');
  const odranGrid = new Grid(odranInterior);
  addBlockingObjects(odranGrid, odranInterior.objects ?? []);
  const chest = objectById(odranInterior, 'odran-tent-travel-chest');
  const evidenceMethod = chest.interact.search.methods[0];
  assert.equal(evidenceMethod.field, 'search');
  assert.equal(evidenceMethod.dc, 45);
  assert.equal(searchMethodStatus(evidenceMethod, {
    inventory: { has: () => true },
    fieldRating: () => 44
  }).success, false);
  assert.equal(searchMethodStatus(evidenceMethod, {
    inventory: { has: () => true },
    fieldRating: () => 45
  }).success, true);
  assert.equal(evidenceMethod.success.setFlag, 'odran-late-visit-suspected');
}

{
  const occupiedCampCells = new Map(
    (level.spawns.npcs ?? []).map((npc) => [`${npc.x},${npc.y}`, npc.actor])
  );
  for (const spec of tentSpecs) {
    const flap = objectById(level, spec.objectId);
    assert.equal(flap.kind, 'canvas-tent-flap', `${spec.objectId} uses the tent flap art`);
    assert.equal(flap.interact, undefined, `${spec.objectId} is not a click-to-enter door`);
    assert.equal(flap.blocking, undefined, `${spec.objectId} does not add prop collision`);

    const transition = transitionById(level, `${spec.objectId}-transition`);
    assert.deepEqual({ x: transition.x, y: transition.y }, spec.approach, `${spec.objectId} transition sits on the tent mouth`);
    assert.deepEqual(transition.clickAreas, spec.clickAreas, `${spec.objectId} transition owns its tent click footprint`);
    assert.equal(pointInAreas(flap, transition.clickAreas), true, `${spec.objectId} click footprint covers the visible flap`);
    assert.equal(grid.isWalkable(flap.x, flap.y), false, `${spec.objectId} visible flap tile remains tent body`);
    assert.equal(grid.isWalkable(transition.x, transition.y), true, `${spec.objectId} transition tile is walkable`);
    assert.equal(occupiedCampCells.has(`${transition.x},${transition.y}`), false, `${spec.objectId} transition is not occupied by an NPC`);
    assert.equal(pathExists(grid, level.spawns.player, spec.approach), true, `${spec.objectId} transition is reachable from camp spawn`);
    assert.equal(transition.loadLevel.path, spec.interiorPath, `${spec.objectId} transition loads its interior`);
    assert.deepEqual(transition.loadLevel.player, spec.interiorPlayer, `${spec.objectId} loads into the matching interior entry tile`);

    const interior = await readJson(spec.interiorFile);
    const interiorGrid = new Grid(interior);
    addBlockingObjects(interiorGrid, interior.objects ?? []);
    assert.equal(interior.legend['#'].kind, 'canvas-tent-interior-wall', `${interior.id} uses canvas interior walls`);
    assert.equal(interior.legend['.'].floor, 'worn-canvas', `${interior.id} uses visible worn-canvas floor tiles`);
    assert.ok(interior.mood.floorShadeAlpha <= 0.14, `${interior.id} floor shade leaves the canvas floor readable`);
    assert.ok(interior.mood.ambientAlpha <= 0.08, `${interior.id} ambient wash leaves the canvas floor readable`);
    assert.deepEqual(interior.spawns.player, { actor: 'mara-vey', ...spec.interiorPlayer }, `${interior.id} authored spawn matches the exterior entry`);
    assert.equal(interiorGrid.isWalkable(interior.spawns.player.x, interior.spawns.player.y), true, `${interior.id} player start is walkable`);
    for (const object of interior.objects.filter((entry) => entry.interact)) {
      const approach = reachableInteractionApproach(interior, interiorGrid, object, interior.spawns.player);
      assert.ok(approach, `${interior.id} ${object.id ?? object.kind} has a reachable interaction approach`);
    }
    const exitFlap = interior.objects.find((object) => object.kind === 'canvas-tent-flap');
    assert.ok(exitFlap, `${interior.id} keeps visible tent flap art`);
    assert.deepEqual({ x: exitFlap.x, y: exitFlap.y }, spec.interiorFlap, `${interior.id} wall flap sits on the authored wall cell`);
    assert.equal(exitFlap.interact, undefined, `${interior.id} exit is not a click-to-use door`);
    assert.equal(exitFlap.blocking, undefined, `${interior.id} exit flap does not block movement`);
    const exitTransition = (interior.levelTransitions ?? []).find((transition) =>
      transition.loadLevel?.path === './data/levels/censure_road_camp.json'
    );
    assert.ok(exitTransition, `${interior.id} has a walk-out transition`);
    assert.deepEqual({ x: exitTransition.x, y: exitTransition.y }, spec.interiorExit, `${interior.id} exit transition sits just inside the flap`);
    assert.equal(isCardinalAdjacent(exitTransition, exitFlap), true, `${interior.id} exit transition is adjacent to the wall flap`);
    assert.equal(interiorGrid.isWalkable(exitTransition.x, exitTransition.y), true, `${interior.id} exit transition is walkable`);
    assert.equal(interiorGrid.isWalkable(exitFlap.x, exitFlap.y), false, `${interior.id} exit flap is mounted on a wall tile, not floating on the floor`);
    assert.equal(pathExists(interiorGrid, interior.spawns.player, exitTransition), true, `${interior.id} exit transition is reachable from spawn`);
    assert.deepEqual(exitTransition.loadLevel.player, spec.returnPlayer);
    assert.equal(grid.isWalkable(spec.returnPlayer.x, spec.returnPlayer.y), true, `${interior.id} return point is walkable`);
  }
}

{
  const southExit = objectById(level, 'censure-road-long-ash-gate');
  assert.equal(southExit.interact?.type, 'secret-exit');
  assert.equal(southExit.interact?.dialogue, 'censure-road-camp-long-ash-road-exit');
  const target = interactionTarget(level, grid, southExit, { x: 34, y: 47 });
  assert.equal(target.type, 'object', 'south road exit resolves as an object target');
  assert.equal(target.object.id, southExit.id);
  assert.equal(isTargetInReach({ position: { x: 34, y: 47 } }, target), true, 'south road exit is reachable from the gate');
  const returnChoice = campToLongAsh.nodes.start.choices.find((choice) =>
    choice.effects?.loadLevel?.path === './data/levels/long_ash_road_approach.json'
  );
  assert.ok(returnChoice, 'camp return dialogue loads Long Ash Road');
  assert.deepEqual(returnChoice.effects.loadLevel.player, { x: 116, y: 4 });
}

{
  const eastGate = objectById(level, 'censure-road-hallowfen-gate-16');
  assert.equal(eastGate.interact?.type, 'note');
  assert.equal(eastGate.interact?.dialogue, 'censure-road-camp-hallowfen-gate');
  const target = interactionTarget(level, grid, eastGate, { x: 66, y: 16 });
  assert.equal(target.type, 'object', 'Hallowfen gate resolves as an object target');
  assert.equal(target.object.id, eastGate.id);
  assert.equal(isTargetInReach({ position: { x: 66, y: 16 } }, target), true, 'Hallowfen gate is inspectable from the road');
  assert.equal(
    hallowfenGate.nodes.start.choices.some((choice) => choice.effects?.loadLevel),
    false,
    'Hallowfen checkpoint exit is present but not unlocked in this demo map'
  );
}

{
  assert.deepEqual(maevActor.trade.stock.map((entry) => entry.item), [
    'field-dressing',
    'tinned-beans',
    'relic-rounds',
    'censure-entry-roll',
    'camp-issue-ribguard',
    'ash-road-boots'
  ]);
  assert.equal(campRibguard.equipment.slot, 'armor');
  assert.equal(campRibguard.groundModel, 'ribguard');
  const tradeChoice = maevDialogue.nodes.start.choices.find((choice) => choice.effects?.trade);
  assert.ok(tradeChoice, 'Maev dialogue has a trade choice');
  assert.equal(tradeChoice.effects.trade, 'censure-sutler-maev');
}

{
  const reportChoice = vossDialogue.nodes.start.choices.find((choice) => choice.next === 'report-briefing');
  assert.ok(reportChoice, 'Voss can assign the Hallowfen route report');

  const reportNodes = Object.keys(vossDialogue.nodes)
    .filter((nodeId) => /^report-q\d\d$/.test(nodeId))
    .sort();
  assert.equal(reportNodes.length, 30, 'Voss report has thirty questions');

  for (const nodeId of reportNodes) {
    const choices = vossDialogue.nodes[nodeId].choices;
    assert.equal(choices.length, 4, `${nodeId} has three answers plus the circle-one shortcut`);
    const shortcut = choices[3];
    assert.equal(shortcut.label, 'Circle answer 1 on every remaining line');
    assert.equal(shortcut.effects.setFlag, 'censure-road-voss-report-circled');
    assert.equal(shortcut.next, 'report-circled');
  }

  assert.equal(vossDialogue.nodes['report-q01'].choices[0].next, 'report-q02');
  assert.equal(vossDialogue.nodes['report-q30'].choices[0].effects.setFlag, 'censure-road-voss-report-perfect');

  const rewardChoice = maevDialogue.nodes.start.choices.find((choice) => choice.next === 'voss-report-reward');
  assert.ok(rewardChoice, 'Maev can pay out Voss report gear');
  assert.equal(meetsDialogueConditions(rewardChoice.conditions, {
    flags: new Set(['censure-road-voss-report-perfect'])
  }), true);
  assert.equal(meetsDialogueConditions(rewardChoice.conditions, {
    flags: new Set(['censure-road-voss-report-perfect', 'censure-road-voss-report-rewarded'])
  }), false);
  assert.deepEqual(maevDialogue.nodes['voss-report-reward'].choices[0].effects.inventory.add, [
    { item: 'camp-issue-ribguard', count: 1 },
    { item: 'field-dressing', count: 1 },
    { item: 'relic-rounds', count: 2 }
  ]);
}

{
  const rumorChoice = pellDialogue.nodes.start.choices.find((choice) => choice.next === 'last-bell');
  assert.ok(rumorChoice, 'Pell can seed the optional Odran rumor');
  assert.equal(rumorChoice.effects.setFlag, 'odran-late-visit-suspected');
  assert.equal(meetsDialogueConditions(rumorChoice.conditions, { flags: new Set() }), true);
  assert.equal(meetsDialogueConditions(rumorChoice.conditions, {
    flags: new Set(['odran-late-visit-suspected'])
  }), false);

  const watchChoice = odranWatch.nodes.start.choices.find((choice) => choice.effects?.showBriefing);
  assert.ok(watchChoice, 'confession screen can start the late watch');
  assert.equal(watchChoice.effects.setFlag, 'odran-late-visit-seen');
  assert.deepEqual(watchChoice.effects.clock, { advanceToMinuteOfDay: 1380 });
  assert.deepEqual(watchChoice.effects.showBriefing.afterBriefing.clock, {
    nextDay: true,
    minuteOfDay: 480
  });
  assert.equal(meetsDialogueConditions(watchChoice.conditions, {
    flags: new Set(['odran-late-visit-suspected'])
  }), true);
  assert.equal(meetsDialogueConditions(watchChoice.conditions, {
    flags: new Set(['odran-late-visit-suspected', 'odran-late-visit-seen'])
  }), false);

  const brunaOdranChoice = brunaDialogue.nodes.start.choices.find((choice) => choice.next === 'odran');
  assert.ok(brunaOdranChoice, 'Bruna has a post-observation Odran branch');
  assert.equal(meetsDialogueConditions(brunaOdranChoice.conditions, {
    flags: new Set(['odran-late-visit-seen'])
  }), true);
  assert.equal(meetsDialogueConditions(brunaOdranChoice.conditions, {
    flags: new Set(['odran-late-visit-seen', 'odran-late-visit-resolved'])
  }), false);
  assert.equal(brunaDialogue.nodes.odran.choices[0].effects.setFlag, 'odran-widow-heard');
}

{
  assert.equal(confessionQuest.initialStage, 'seek-confession');
  assert.equal(confessionQuest.stages.some((stage) => stage.id === 'absolved-with-ducats' && stage.xp === 15), true);
  assert.equal(confessionQuest.stages.some((stage) => stage.id === 'absolved-after-lying' && stage.xp === 10), true);
  assert.equal(absolutionChit.equipment.slot, 'trinket');
  assert.equal(absolutionChit.groundModel, 'chit');

  assert.equal(odranDialogue.nodes.start.conditions.flag, 'censure-road-confession-absolved');
  assert.equal(odranDialogue.nodes.start.else, 'start-open');
  assert.equal(odranDialogue.nodes['chapel-cult-broken'].conditions.flag, 'ash-chapel-cult-broken');
  assert.equal(odranDialogue.nodes['chapel-martyr-ended'].conditions.flag, 'nave-cross-martyr-ended');
  assert.equal(odranDialogue.nodes['road-family-lie'].conditions.flag, 'long-ash-field-family-lie');
  assert.equal(odranDialogue.nodes['road-family-truth'].conditions.flag, 'long-ash-field-family-truth');
  assert.equal(odranDialogue.nodes['road-wolves-evidence'].conditions.flag, 'long-ash-wolves-avenged-family');
  const confrontationChoice = odranDialogue.nodes.start.choices.find((choice) => choice.next === 'late-visit-confront-widow');
  assert.ok(confrontationChoice, 'Odran can be confronted after the late visit is observed');
  assert.equal(meetsDialogueConditions(confrontationChoice.conditions, {
    flags: new Set(['odran-late-visit-seen'])
  }), true);
  assert.equal(meetsDialogueConditions(confrontationChoice.conditions, {
    flags: new Set(['odran-late-visit-seen', 'odran-late-visit-resolved'])
  }), false);

  const settleChoice = odranDialogue.nodes['record-summary'].choices.find((choice) => choice.next === 'price');
  assert.ok(settleChoice, 'Odran confession reaches the payment screen');
  assert.deepEqual(settleChoice.effects.questUpdate, {
    quest: 'censure-road-confession',
    stage: 'record-read'
  });

  const payChoice = odranDialogue.nodes.price.choices.find((choice) => choice.label === 'Pay 5 ducats');
  assert.ok(payChoice, 'Odran has a normal five ducat payment option');
  assert.equal(meetsDialogueConditions(payChoice.conditions, { itemCount: (id) => (id === 'ducat' ? 5 : 0) }), true);
  assert.equal(meetsDialogueConditions(payChoice.conditions, { itemCount: (id) => (id === 'ducat' ? 4 : 0) }), false);
  assert.equal(payChoice.effects.inventory.requireAll, true);
  assert.deepEqual(payChoice.effects.inventory.remove, [
    { item: 'ducat', count: 5, failLog: 'Father Odran waits for the fifth ducat that is not there.' }
  ]);
  assert.deepEqual(payChoice.effects.inventory.add, [
    { item: 'censure-absolution-chit', count: 1 }
  ]);
  assert.deepEqual(payChoice.effects.setFlag, ['censure-road-confession-absolved', 'odran-confession-paid-5']);
  assert.deepEqual(payChoice.effects.questUpdate, {
    quest: 'censure-road-confession',
    stage: 'absolved-with-ducats'
  });

  const noCoinPrayer = odranDialogue.nodes['price-low'].choices.find((choice) => choice.label === 'Pray five times');
  assert.ok(noCoinPrayer, 'Odran has a no-money prayer route');
  assert.equal(meetsDialogueConditions(noCoinPrayer.conditions, { itemCount: (id) => (id === 'ducat' ? 0 : 0) }), true);
  assert.equal(meetsDialogueConditions(noCoinPrayer.conditions, { itemCount: (id) => (id === 'ducat' ? 1 : 0) }), false);

  const lieChoice = odranDialogue.nodes.price.choices.find((choice) => choice.label === 'Lie that your purse is empty');
  assert.ok(lieChoice, 'Odran has a lying route');
  assert.equal(lieChoice.next, 'lie-caught-rich');
  assert.equal(meetsDialogueConditions(lieChoice.conditions, { itemCount: (id) => (id === 'ducat' ? 1 : 0) }), true);
  assert.equal(meetsDialogueConditions(lieChoice.conditions, { itemCount: (id) => (id === 'ducat' ? 0 : 0) }), false);

  const lieTax = odranDialogue.nodes['lie-caught-rich'].choices.find((choice) => choice.label === 'Pay 6 ducats');
  assert.ok(lieTax, 'Odran charges a six ducat lie tax when the player can pay it');
  assert.deepEqual(lieTax.effects.questUpdate, {
    quest: 'censure-road-confession',
    stage: 'absolved-after-lying'
  });
  assert.deepEqual(lieTax.effects.setFlag, ['censure-road-confession-absolved', 'odran-confession-paid-6']);

  assert.equal(odranDialogue.nodes['late-visit-refund-6'].else, 'late-visit-refund-5');
  assert.equal(odranDialogue.nodes['late-visit-refund-5'].choices[0].effects.inventory.add[0].count, 5);
  assert.equal(odranDialogue.nodes['late-visit-refund-1'].choices[0].effects.inventory.add[0].count, 1);
  assert.equal(odranDialogue.nodes['late-visit-refund-none'].choices[0].next, 'late-visit-blackmail');
  const blackmail = odranDialogue.nodes['late-visit-blackmail'].choices.find((choice) => choice.label === 'Take 8 ducats');
  assert.ok(blackmail, 'Odran blackmail route pays silence money');
  assert.deepEqual(blackmail.effects.setFlag, ['odran-late-visit-resolved', 'odran-silence-money-taken']);
  assert.deepEqual(blackmail.effects.inventory.add, [{ item: 'ducat', count: 8 }]);
  const askBruna = odranDialogue.nodes['late-visit-confront'].choices.find((choice) => choice.label === 'Ask Bruna first');
  assert.ok(askBruna, 'Odran confrontation can defer to Bruna');
  assert.equal(askBruna.effects.setFlag, 'odran-ask-widow-first');
}

{
  const sign = objectById(longAsh, 'long-ash-censure-camp-sign');
  assert.equal(sign.interact?.type, 'secret-entrance');
  assert.equal(sign.interact?.dialogue, 'long-ash-censure-road-camp-exit');
  assert.equal(sign.mapMarker?.kind, 'exit');
  assert.equal(pathExists(longAshGrid, longAsh.spawns.player, { x: 116, y: 4 }), true, 'Long Ash start reaches the camp approach');
  const target = interactionTarget(longAsh, longAshGrid, sign, { x: 116, y: 4 });
  assert.equal(target.type, 'object', 'Long Ash camp sign resolves as an object target');
  assert.equal(target.object.id, sign.id);
  assert.equal(isTargetInReach({ position: { x: 116, y: 4 } }, target), true, 'camp sign is reachable from the north road');
  const enterChoice = longAshToCamp.nodes.start.choices.find((choice) =>
    choice.effects?.loadLevel?.path === './data/levels/censure_road_camp.json'
  );
  assert.ok(enterChoice, 'Long Ash camp dialogue loads Censure Road Camp');
  assert.deepEqual(enterChoice.effects.loadLevel.player, { x: 34, y: 46 });
}
