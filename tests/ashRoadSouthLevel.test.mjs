import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';

import { ASH_ROAD_SOUTH_DISTRICTS } from '../scripts/content/ash-road-south-cast.mjs';
import { meetsDialogueConditions } from '../src/core/DialogueConditions.js';
import { resolveDevStart } from '../src/core/DevStart.js';
import { getSprite } from '../src/render/spriteCatalog.js';
import { Grid } from '../src/world/Grid.js';
import {
  isTargetInReach,
  resolveInteractionTargetAtCell
} from '../src/world/InteractionTargeting.js';

async function readJson(path) {
  return JSON.parse(await readFile(new URL(path, import.meta.url), 'utf8'));
}

function objectById(level, id) {
  const object = (level.objects ?? []).find((entry) => entry.id === id);
  assert.ok(object, `missing object ${id}`);
  return object;
}

function addBlockingObjects(grid, objects) {
  for (const object of objects ?? []) {
    if (object.blocking) grid.addBlocked(object.x, object.y);
  }
}

function pathExists(grid, start, target) {
  assert.equal(grid.isWalkable(start.x, start.y), true, `path start ${start.x},${start.y} is walkable`);
  assert.equal(grid.isWalkable(target.x, target.y), true, `path target ${target.x},${target.y} is walkable`);
  const queue = [start];
  const seen = new Set([`${start.x},${start.y}`]);
  for (let index = 0; index < queue.length; index += 1) {
    const cell = queue[index];
    if (cell.x === target.x && cell.y === target.y) return true;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const next = { x: cell.x + dx, y: cell.y + dy };
      const key = `${next.x},${next.y}`;
      if (seen.has(key) || !grid.isWalkable(next.x, next.y)) continue;
      seen.add(key);
      queue.push(next);
    }
  }
  return false;
}

function countTilesForKind(level, kind) {
  let count = 0;
  for (const row of level.tiles) {
    for (const tile of row) {
      if (level.legend[tile]?.kind === kind) count += 1;
    }
  }
  return count;
}

function countObjects(level, kind) {
  return (level.objects ?? []).filter((object) => object.kind === kind).length;
}

function floorCounts(level) {
  const counts = new Map();
  for (const row of level.tiles) {
    for (const tile of row) {
      const floor = level.legend[tile]?.floor;
      if (floor) counts.set(floor, (counts.get(floor) ?? 0) + 1);
    }
  }
  return counts;
}

function visualKindCounts(level) {
  const counts = new Map();
  for (const object of level.objects ?? []) {
    counts.set(object.kind, (counts.get(object.kind) ?? 0) + 1);
  }
  for (const row of level.tiles ?? []) {
    for (const tile of row) {
      const kind = level.legend[tile]?.kind;
      if (kind && kind !== 'floor') counts.set(kind, (counts.get(kind) ?? 0) + 1);
    }
  }
  return counts;
}

function objectsInDistrict(level, district, kinds) {
  const bounds = ASH_ROAD_SOUTH_DISTRICTS[district];
  const allowed = new Set(Array.isArray(kinds) ? kinds : [kinds]);
  return (level.objects ?? []).filter((object) => (
    allowed.has(object.kind)
    && object.x >= bounds.x0
    && object.x <= bounds.x1
    && object.y >= bounds.y0
    && object.y <= bounds.y1
  ));
}

function objectsInBounds(level, bounds, kinds) {
  const allowed = new Set(Array.isArray(kinds) ? kinds : [kinds]);
  return (level.objects ?? []).filter((object) => (
    allowed.has(object.kind)
    && object.x >= bounds.x0
    && object.x <= bounds.x1
    && object.y >= bounds.y0
    && object.y <= bounds.y1
  ));
}

function countKindTilesInBounds(level, bounds, kind) {
  let count = 0;
  for (let y = bounds.y0; y <= bounds.y1; y += 1) {
    for (let x = bounds.x0; x <= bounds.x1; x += 1) {
      if (level.legend[level.tiles[y][x]]?.kind === kind) count += 1;
    }
  }
  return count;
}

function assertDistrictMinimum(level, district, kind, minimum) {
  const count = objectsInDistrict(level, district, kind).length;
  assert.ok(count >= minimum, `${district} keeps ${minimum} ${kind} placements, found ${count}`);
}

function connectedComponentsForKind(level, kind) {
  const unvisited = new Set();
  for (let y = 0; y < level.height; y += 1) {
    for (let x = 0; x < level.width; x += 1) {
      if (level.legend[level.tiles[y][x]]?.kind === kind) unvisited.add(`${x},${y}`);
    }
  }
  const components = [];
  while (unvisited.size > 0) {
    const first = unvisited.values().next().value;
    unvisited.delete(first);
    const queue = [first];
    const component = [];
    for (let index = 0; index < queue.length; index += 1) {
      const cell = queue[index];
      component.push(cell);
      const [x, y] = cell.split(',').map(Number);
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const neighbor = `${x + dx},${y + dy}`;
        if (unvisited.delete(neighbor)) queue.push(neighbor);
      }
    }
    components.push(component);
  }
  return components;
}

const level = await readJson('../data/levels/ash_road_south.json');
const campLevel = await readJson('../data/levels/censure_road_camp.json');
const levelDirectory = new URL('../data/levels/', import.meta.url);
const otherNonSouthMeasureLevels = (await Promise.all(
  (await readdir(levelDirectory))
    .filter((name) => name.endsWith('.json') && name !== 'ash_road_south.json')
    .map(async (name) => JSON.parse(await readFile(new URL(name, levelDirectory), 'utf8')))
)).filter((candidate) => !candidate.id?.startsWith('south-measure-'));
const returnDialogue = await readJson('../data/dialogue/ash-road-south-censure-road-exit.json');
const campGateDialogue = await readJson('../data/dialogue/censure-road-camp-hallowfen-gate.json');
const grid = new Grid(level);
addBlockingObjects(grid, level.objects);
const campGrid = new Grid(campLevel);
addBlockingObjects(campGrid, campLevel.objects);

assert.equal(level.id, 'ash-road-south');
assert.equal(level.width, 130);
assert.equal(level.height, 80);
assert.equal(level.tiles.length, 80);
assert.equal(level.tiles.every((row) => row.length === 130), true);
assert.deepEqual(level.spawns.player, { actor: 'mara-vey', x: 65, y: 77 });
assert.deepEqual(level.spawns.enemies, []);
assert.equal(level.spawns.npcs.length, 81);
assert.equal(level.spawns.npcs.filter((spawn) => spawn.dialogue).length, 31);
assert.equal(level.spawns.npcs.filter((spawn) => spawn.patrol).length, 24);
assert.equal(level.spawns.npcs.filter((spawn) => spawn.mapMarker).length, 9);
assert.deepEqual(level.quests, [
  'names-for-the-gate',
  'household-of-one',
  'debt-that-drinks',
  'charity-cot',
  'names-under-lime',
  'lesson-under-the-wrap',
  'carry-lucky-necklace'
]);
assert.equal(level.dialogue.length, 46);
assert.equal(level.dialogue[0], 'ash-road-south-censure-road-exit');
assert.equal(level.dialogue[1], 'ash-road-south-north-departure');
assert.equal(level.levelTransitions, undefined, 'surface shell has no walk-on transitions');

for (const object of level.objects) {
  assert.ok(object.x >= 0 && object.x < level.width, `${object.id} x is in bounds`);
  assert.ok(object.y >= 0 && object.y < level.height, `${object.id} y is in bounds`);
  assert.ok(getSprite(object.kind), `${object.id} uses registered kind ${object.kind}`);
}

for (const kind of [
  'south-measure-rowhouse-building-block',
  'relief-annex-building-block',
  'compact-clinic-building-block',
  'morrow-freight-house-building-block',
  'measure-hall-building-block',
  'admission-booth-building-block',
  'south-measure-burial-shed-building-block'
]) {
  assert.ok(countTilesForKind(level, kind) > 0, `${kind} has authored footprint cells`);
}
assert.equal(
  countTilesForKind(level, 'storage-shed-building-block'),
  0,
  'burial shed does not reuse the overlapping farm-roof geometry'
);
assert.ok(countTilesForKind(level, 'south-measure-rowhouse-building-block') >= 350, 'Rope Rows has town-scale housing mass');
assert.ok(countTilesForKind(level, 'relief-annex-building-block') >= 190, 'relief annex has a large industrial footprint');
assert.ok(countTilesForKind(level, 'compact-clinic-building-block') >= 110, 'Compact clinic has a distinct precinct silhouette');
assert.ok(countTilesForKind(level, 'morrow-freight-house-building-block') >= 120, 'Morrow freight buildings anchor the west yard');
assert.ok(countTilesForKind(level, 'south-measure-berm-block') >= 1000, 'the retired drainage berm owns the settlement edge');

const rowhouseComponents = connectedComponentsForKind(level, 'south-measure-rowhouse-building-block');
const rowhouseSizes = rowhouseComponents.map((component) => component.length);
assert.ok(rowhouseComponents.length >= 15, 'Rope Rows remains a neighborhood of separate houses');
assert.ok(Math.max(...rowhouseSizes) <= 80, 'attached rowhouse clusters never regress into one giant district roof slab');
assert.ok(new Set(rowhouseSizes).size >= 8, 'Rope Rows keeps varied household footprints');

for (const [kind, minimum] of [
  ['water-condenser', 1],
  ['south-measure-settling-vat', 2],
  ['public-tap-stand', 2],
  ['intake-screening-frame', 14],
  ['fixed-hoist', 3],
  ['freight-wagon', 5],
  ['south-measure-medicine-cart', 1],
  ['grain-cage', 7],
  ['freight-scale', 3],
  ['laundry-line', 8],
  ['shared-oven', 6],
  ['wash-wall', 5],
  ['south-measure-receiving-shelter', 4],
  ['south-measure-charity-canopy', 2],
  ['south-measure-arrival-hearth', 3],
  ['south-measure-sleeping-pallet', 7],
  ['south-measure-water-vessels', 20],
  ['south-measure-hand-pump', 6],
  ['south-measure-notice-board', 11],
  ['south-measure-pipe-gantry', 7],
  ['south-measure-queue-rail', 19],
  ['south-measure-return-stall', 3],
  ['south-measure-repair-rack', 7],
  ['south-measure-water-lesson', 2],
  ['south-measure-brass-hook-memorial', 1],
  ['south-measure-sample-burner', 1],
  ['south-measure-service-pack', 1],
  ['south-measure-drain-reeds', 8],
  ['measure-boundary-fence', 60],
  ['south-measure-storage', 4],
  ['relief-machine', 4],
  ['service-pipe-run', 6],
  ['mesh-cage-panel', 4],
  ['cloth-partition', 2],
  ['measure-grave-plot', 24],
  ['charity-cot', 8],
  ['collapsed-culvert', 1],
  ['service-hatch', 5],
  ['south-measure-door', 5]
]) {
  assert.ok(countObjects(level, kind) >= minimum, `${kind} meets placement minimum ${minimum}`);
}

for (const [district, kind, minimum] of [
  ['arrival-fringe', 'south-measure-receiving-shelter', 3],
  ['arrival-fringe', 'south-measure-arrival-hearth', 3],
  ['arrival-fringe', 'south-measure-sleeping-pallet', 7],
  ['charity-edge', 'south-measure-charity-canopy', 2],
  ['charity-edge', 'charity-cot', 6],
  ['water-court', 'water-condenser', 1],
  ['water-court', 'south-measure-settling-vat', 2],
  ['water-court', 'public-tap-stand', 2],
  ['water-court', 'south-measure-pipe-gantry', 3],
  ['morrow-yard', 'freight-wagon', 5],
  ['morrow-yard', 'grain-cage', 7],
  ['morrow-yard', 'freight-scale', 1],
  ['old-measure-gates', 'intake-screening-frame', 10],
  ['old-measure-gates', 'south-measure-queue-rail', 7],
  ['old-measure-gates', 'south-measure-storage', 4],
  ['old-measure-gates', 'freight-scale', 1],
  ['compact-precinct', 'intake-screening-frame', 4],
  ['compact-precinct', 'charity-cot', 2],
  ['compact-precinct', 'cloth-partition', 2],
  ['compact-precinct', 'relief-machine', 1],
  ['rope-rows', 'laundry-line', 8],
  ['rope-rows', 'shared-oven', 6],
  ['rope-rows', 'south-measure-hand-pump', 4],
  ['grave-strip', 'measure-grave-plot', 24],
  ['grave-strip', 'south-measure-brass-hook-memorial', 1],
  ['relief-annex', 'fixed-hoist', 3],
  ['relief-annex', 'relief-machine', 3],
  ['relief-annex', 'service-pipe-run', 6],
  ['relief-annex', 'mesh-cage-panel', 3]
]) {
  assertDistrictMinimum(level, district, kind, minimum);
}

const receivingTightBounds = { x0: 22, y0: 66, x1: 36, y1: 76 };
for (const kind of [
  'south-measure-receiving-shelter',
  'south-measure-arrival-hearth',
  'south-measure-sleeping-pallet',
  'south-measure-hand-pump',
  'wash-wall',
  'south-measure-water-vessels'
]) {
  assert.ok(
    objectsInBounds(level, receivingTightBounds, kind).length > 0,
    `tight receiving view keeps ${kind} inside one visible operation`
  );
}

const graveTightBounds = { x0: 99, y0: 6, x1: 113, y1: 16 };
for (const kind of [
  'measure-grave-plot',
  'south-measure-brass-hook-memorial',
  'south-measure-repair-rack',
  'south-measure-drain-reeds'
]) {
  assert.ok(
    objectsInBounds(level, graveTightBounds, kind).length > 0,
    `tight grave view keeps ${kind} inside one tended burial precinct`
  );
}
assert.ok(
  countKindTilesInBounds(level, graveTightBounds, 'south-measure-burial-shed-building-block') > 0,
  'tight grave view keeps the burial shed beside the central family plots'
);

for (const forbiddenKind of [
  'canvas-tent', 'campfire', 'camp-bedroll', 'farm-fence', 'water-pump',
  'rusted-barrel', 'quarantine-sign', 'chalk-drawing', 'graveyard-remnant-cross',
  'road-dust', 'trampled-mud', 'rubble-decal', 'paper-scraps', 'dead-grass-tuft',
  'settling-tank', 'medicine-cart', 'machine-oil', 'scorch-mark', 'small-pouch',
  'road-sign-post', 'rusted-crate', 'clinic-bed', 'ash-tree', 'ash-tree-stump',
  'fallen-ash-log', 'scrub-bush'
]) {
  assert.equal(countObjects(level, forbiddenKind), 0, `South Measure does not borrow ${forbiddenKind}`);
}

const southFloors = floorCounts(level);
const localFloorCells = [
  'south-measure-slab', 'south-measure-yard', 'south-measure-row', 'south-measure-grave-strip'
]
  .reduce((total, floor) => total + (southFloors.get(floor) ?? 0), 0);
assert.ok(localFloorCells >= 7000, 'South Measure-owned floors dominate the walkable settlement surface');

const externalVisualKinds = new Set(
  otherNonSouthMeasureLevels.flatMap((candidate) => [...visualKindCounts(candidate).keys()])
);
const sharedExternalVisualKinds = [...visualKindCounts(level).keys()]
  .filter((kind) => externalVisualKinds.has(kind))
  .sort();
assert.deepEqual(
  sharedExternalVisualKinds,
  [],
  'Ash Road South surface models stay location-owned instead of borrowing another map kit'
);

const externalFloorStyles = new Set(
  otherNonSouthMeasureLevels.flatMap((candidate) => [...floorCounts(candidate).keys()])
);
const sharedExternalFloorStyles = [...southFloors.keys()]
  .filter((floor) => externalFloorStyles.has(floor))
  .sort();
assert.deepEqual(
  sharedExternalFloorStyles,
  ['ash-road', 'road-shoulder'],
  'only the campaign road continues into Ash Road South from another map'
);
const sharedFloorCells = [...southFloors]
  .filter(([floor]) => externalFloorStyles.has(floor))
  .reduce((total, [, count]) => total + count, 0);
assert.ok(sharedFloorCells / (level.width * level.height) < 0.06, 'cross-map floor continuity stays below six percent');
assert.ok(
  ((southFloors.get('ash-road') ?? 0) + (southFloors.get('road-shoulder') ?? 0)) / (level.width * level.height) < 0.06,
  'the regional campaign road is continuity, not the map surface language'
);

const campKinds = new Set((campLevel.objects ?? []).map((object) => object.kind));
const sharedObjectPlacements = (level.objects ?? []).filter((object) => campKinds.has(object.kind)).length;
assert.equal(sharedObjectPlacements, 0, 'Ash Road South does not reuse Censure Road Camp object models');

const start = { x: 65, y: 77 };
for (const target of [
  { x: 64, y: 63 },
  { x: 64, y: 58 },
  { x: 64, y: 43 },
  { x: 65, y: 2 }
]) {
  assert.equal(pathExists(grid, start, target), true, `central spine reaches ${target.x},${target.y}`);
}
for (const target of [
  { x: 48, y: 58 }, { x: 40, y: 56 }, { x: 24, y: 54 },
  { x: 16, y: 45 }, { x: 20, y: 32 }, { x: 39, y: 28 }, { x: 59, y: 36 }
]) {
  assert.equal(pathExists(grid, start, target), true, `west loop reaches ${target.x},${target.y}`);
}
for (const target of [
  { x: 72, y: 62 }, { x: 88, y: 67 }, { x: 108, y: 64 },
  { x: 115, y: 52 }, { x: 112, y: 37 }, { x: 101, y: 29 }, { x: 76, y: 34 }
]) {
  assert.equal(pathExists(grid, start, target), true, `east loop reaches ${target.x},${target.y}`);
}

const condenser = objectById(level, 'ash-road-south-water-condenser');
assert.ok(condenser.x >= 47 && condenser.x <= 81 && condenser.y >= 44 && condenser.y <= 64);
const medicineCart = objectById(level, 'ash-road-south-medicine-cart');
assert.ok(medicineCart.x >= 5 && medicineCart.x <= 46 && medicineCart.y >= 29 && medicineCart.y <= 61);
assert.equal(level.legend[level.tiles[33][98]].kind, 'compact-clinic-building-block', 'clinic gate occupies its intake frontage wall');
const collapsedDrain = objectById(level, 'ash-road-south-collapsed-culvert');
assert.ok(collapsedDrain.x >= 110 && collapsedDrain.x <= 128 && collapsedDrain.y >= 66 && collapsedDrain.y <= 79);
assert.equal(collapsedDrain.interact?.type, 'secret-entrance', 'collapsed culvert now opens the relief drain');
assert.deepEqual(collapsedDrain.interactionMarker, { x: 119, y: 73 });

const southGate = objectById(level, 'ash-road-south-censure-gate');
assert.equal(southGate.blocking, true);
assert.equal(southGate.interact?.dialogue, 'ash-road-south-censure-road-exit');
assert.deepEqual({ x: southGate.x, y: southGate.y }, { x: 65, y: 79 });
const returnChoice = returnDialogue.nodes.start.choices.find((choice) => choice.effects?.loadLevel);
assert.ok(returnChoice, 'South Chain offers return travel');
assert.equal(returnChoice.effects.loadLevel.path, './data/levels/censure_road_camp.json');
assert.deepEqual(returnChoice.effects.loadLevel.player, { x: 66, y: 16, facing: 'nw' });
const campGate = objectById(campLevel, 'censure-road-hallowfen-gate-16');
assert.deepEqual({ x: campGate.x, y: campGate.y }, { x: 67, y: 16 });
assert.equal(campGrid.isWalkable(66, 16), true, 'return arrival is clear on the inward side of the Censure gate');
assert.equal(returnChoice.effects.loadLevel.player.x < campGate.x, true, 'return arrival sits inside the west side of the Censure gate');

const northGate = objectById(level, 'ash-road-south-north-chain');
assert.equal(northGate.blocking, true);
assert.equal(northGate.interact?.type, 'secret-exit');
assert.equal(northGate.interact?.dialogue, 'ash-road-south-north-departure');
assert.deepEqual(northGate.hiddenWhenFlags, ['south-measure-north-lane-open']);
const northDeparture = await readJson('../data/dialogue/ash-road-south-north-departure.json');
const departChoice = northDeparture.nodes.start.choices.find((choice) => choice.effects?.showBriefing);
assert.equal(departChoice.conditions, undefined);
assert.equal(departChoice.effects.questUpdate.stage, 'complete');
assert.equal(departChoice.effects.setFlag, 'departed-south-measure');
assert.equal(northDeparture.nodes.start.conditions.flag, 'south-measure-north-lane-open');
const openNorthRoad = objectById(level, 'ash-road-south-open-north-road');
assert.deepEqual(openNorthRoad.visibleWhenFlags, ['south-measure-north-lane-open']);
assert.equal(openNorthRoad.interact.dialogue, 'ash-road-south-north-departure');

for (const gate of [southGate, northGate]) {
  assert.ok(Array.isArray(gate.clickAreas) && gate.clickAreas.length > 0, `${gate.id} has an authored click footprint`);
  for (const area of gate.clickAreas) {
    for (let y = area.y0; y <= area.y1; y += 1) {
      for (let x = area.x0; x <= area.x1; x += 1) {
        const target = resolveInteractionTargetAtCell({
          cell: { x, y },
          grid,
          player: { x: -1, y: -1, position: { x: -1, y: -1 } },
          interactables: level.objects.filter((object) => object.interact)
        });
        assert.equal(target.type, 'object', `${gate.id} footprint cell ${x},${y} resolves to an object`);
        assert.equal(target.object, gate, `${gate.id} owns footprint cell ${x},${y}`);
      }
    }
  }
  const markerTarget = resolveInteractionTargetAtCell({
    cell: gate.interactionMarker,
    grid,
    player: { x: -1, y: -1, position: { x: -1, y: -1 } },
    interactables: level.objects.filter((object) => object.interact)
  });
  assert.equal(
    isTargetInReach({ position: gate.interactionMarker }, markerTarget),
    true,
    `${gate.id} can be used from its visible interaction marker`
  );
}

const campTravel = campGateDialogue.nodes.start.choices.find((choice) =>
  choice.effects?.loadLevel?.path === './data/levels/ash_road_south.json'
);
assert.ok(campTravel, 'Censure Road gate has an Ash Road South travel choice');
assert.equal(campTravel.conditions?.flag, 'censure-road-voss-route-cleared');
assert.equal(meetsDialogueConditions(campTravel.conditions, { flags: new Set() }), false);
assert.equal(meetsDialogueConditions(campTravel.conditions, {
  flags: new Set(['censure-road-voss-route-cleared'])
}), true);
assert.deepEqual(campTravel.effects.loadLevel.player, { x: 65, y: 77, facing: 'ne' });
assert.equal(grid.isWalkable(65, 77), true, 'unlocked arrival is clear on the inward side of the South Chain');
assert.equal(campTravel.effects.loadLevel.player.y < southGate.y, true, 'camp travel enters north of the South Chain');

const helperEntrances = [
  ['ash-road-south-civil-stair', 'south-measure-civil-stair-surface', './data/levels/south_measure_intake_undercroft.json', { x: 29, y: 39, facing: 'ne' }],
  ['ash-road-south-collapsed-culvert', 'south-measure-collapsed-culvert-surface', './data/levels/south_measure_relief_drain.json', { x: 41, y: 15, facing: 'nw' }],
  ['ash-road-south-repair-trench', 'south-measure-repair-trench-surface', './data/levels/south_measure_relief_drain.json', { x: 20, y: 2, facing: 'sw' }],
  ['ash-road-south-annex-service-hatch', 'south-measure-annex-service-hatch-surface', './data/levels/south_measure_relief_drain.json', { x: 2, y: 16, facing: 'se' }],
  ['ash-road-south-annex-main-door', 'south-measure-annex-main-door-surface', './data/levels/south_measure_relief_maintenance_annex.json', { x: 19, y: 23, facing: 'ne' }],
  ['ash-road-south-freight-main-door', 'south-measure-freight-main-door-surface', './data/levels/south_measure_morrow_freight_house.json', { x: 2, y: 13, facing: 'se' }],
  ['ash-road-south-freight-rear-door', 'south-measure-freight-rear-door-surface', './data/levels/south_measure_morrow_freight_house.json', { x: 29, y: 19, facing: 'ne' }],
  ['ash-road-south-clinic-main-door', 'south-measure-clinic-main-door-surface', './data/levels/south_measure_compact_clinic.json', { x: 18, y: 21, facing: 'ne' }],
  ['ash-road-south-hall-main-door', 'south-measure-hall-main-door-surface', './data/levels/south_measure_measure_hall.json', { x: 17, y: 19, facing: 'ne' }],
  ['ash-road-south-varo-door', 'south-measure-varo-door-surface', './data/levels/south_measure_varo_house.json', { x: 2, y: 10, facing: 'se' }],
  ['ash-road-south-hidden-rows-drying-frame', 'south-measure-hidden-rows-drying-frame-surface', './data/levels/south_measure_hidden_rows.json', { x: 2, y: 6, facing: 'se' }],
  ['ash-road-south-hidden-rows-grave-passage', 'south-measure-hidden-rows-grave-passage-surface', './data/levels/south_measure_hidden_rows.json', { x: 24, y: 2, facing: 'sw' }],
  ['ash-road-south-charity-trapdoor', 'south-measure-charity-trapdoor-surface', './data/levels/south_measure_charity_cellar.json', { x: 18, y: 13, facing: 'nw' }]
];

const helperDialogueRecords = [];
for (const [objectId, dialogueId, destinationPath, destinationPlayer] of helperEntrances) {
  const gate = objectById(level, objectId);
  assert.equal(gate.interact?.dialogue, dialogueId, `${objectId} uses its reciprocal travel dialogue`);
  assert.equal(level.dialogue.includes(dialogueId), true, `${dialogueId} is loaded on the surface`);
  assert.equal(grid.isWalkable(gate.interactionMarker.x, gate.interactionMarker.y), true, `${objectId} has a walkable use cell`);
  assert.equal(pathExists(grid, start, gate.interactionMarker), true, `${objectId} is reachable from the South Chain`);

  const target = resolveInteractionTargetAtCell({
    cell: { x: gate.x, y: gate.y },
    grid,
    player: { position: gate.interactionMarker },
    interactables: level.objects.filter((object) => object.interact)
  });
  assert.equal(target.type, 'object', `${objectId} resolves as its physical gate`);
  assert.equal(target.object, gate, `${objectId} owns its gate cell`);
  assert.equal(isTargetInReach({ position: gate.interactionMarker }, target), true, `${objectId} is usable from its marked approach`);

  const dialogue = await readJson(`../data/dialogue/${dialogueId}.json`);
  helperDialogueRecords.push(dialogue);
  const travel = dialogue.nodes.start.choices.find((choice) => choice.effects?.loadLevel);
  assert.ok(travel, `${dialogueId} offers travel`);
  assert.equal(travel.effects.loadLevel.path, destinationPath, `${dialogueId} loads the correct helper map`);
  assert.deepEqual(travel.effects.loadLevel.player, destinationPlayer, `${dialogueId} preserves arrival position and facing`);
}

assert.equal(level.legend[level.tiles[51][94]].kind, 'measure-hall-building-block', 'Measure Hall occupies its canonical 94,51 frontage');
assert.equal(departChoice.effects.loadLevel.path, './data/levels/old_pilgrim_way.json', 'the handoff loads Old Pilgrim Way');
assert.deepEqual(departChoice.effects.loadLevel.player, { x: 60, y: 67, facing: 'n' });

const authoredText = JSON.stringify([level, returnDialogue, campGateDialogue, ...helperDialogueRecords]);
assert.equal(authoredText.includes('—'), false, 'Ash Road South player text contains no em dash');
assert.equal(authoredText.includes('--'), false, 'Ash Road South player text contains no doubled dash');

for (const alias of ['south', 'south-measure', 'ash-road-south', 'ash_road_south']) {
  const startOptions = resolveDevStart(new URL(`http://localhost:4173/?level=${alias}`));
  assert.equal(startOptions.levelPath, './data/levels/ash_road_south.json', `${alias} resolves to Ash Road South`);
}

console.log(`ashRoadSouthLevel: ${level.width}x${level.height}, ${level.objects.length} objects, routes and progression valid.`);
