import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  ASH_ROAD_SOUTH_CAST,
  ASH_ROAD_SOUTH_DIALOGUE_IDS,
  ASH_ROAD_SOUTH_DISTRICTS,
  ASH_ROAD_SOUTH_HELPER_ANCHORS
} from './content/ash-road-south-cast.mjs';
import { ASH_ROAD_SOUTH_NPC_ROUTINES } from './content/ash-road-south-routines.mjs';
import { ASH_ROAD_SOUTH_TABLEAUX } from './content/ash-road-south-tableaux.mjs';
import { ASH_ROAD_SOUTH_SOUNDSCAPE } from './content/ash-road-south-soundscape.mjs';
import { applyAshRoadSouthInspections } from './content/ash-road-south-inspections.mjs';
import { SOUTH_MEASURE_QUEST_IDS } from './content/south-measure-state.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const outputPath = join(root, 'data', 'levels', 'ash_road_south.json');

const WIDTH = 130;
const HEIGHT = 80;
const START = { x: 65, y: 77 };
const WALKABLE_TILES = new Set(['.', 'r', 's', 'g', 'm', 'e', 'p', 'c', 'y', 'h', 'x', 'z', 'j']);
const objects = [];
const occupied = new Set();
const groundItems = [
  { id: 'ash-road-south-return-crate-spill', item: 'tinned-beans', count: 1, x: 72, y: 27 },
  { id: 'ash-road-south-freight-gear', item: 'penitent-gear-scrap', count: 1, x: 33, y: 43 },
  { id: 'ash-road-south-screening-ducats', item: 'ducat', count: 3, x: 52, y: 30 },
  { id: 'ash-road-south-clinic-dressing', item: 'field-dressing', count: 1, x: 82, y: 34 },
  { id: 'ash-road-south-north-road-chit', item: 'road-warden-chit', count: 1, x: 65, y: 15 },
  { id: 'ash-road-south-arrival-ration', item: 'tinned-beans', count: 1, x: 65, y: 68 },
  { id: 'ash-road-south-east-yard-rounds', item: 'relic-rounds', count: 2, x: 110, y: 25 },
  { id: 'ash-road-south-grave-strip-token', item: 'tarnished-saint-token', count: 1, x: 90, y: 62 }
];

const HELPER_GATES = Object.freeze([
  { gate: { x: 64, y: 36 }, approach: { x: 64, y: 37 } },
  { gate: { x: 120, y: 73 }, approach: { x: 119, y: 73 } },
  { gate: { x: 31, y: 54 }, approach: { x: 31, y: 55 } },
  { gate: { x: 20, y: 24 }, approach: { x: 20, y: 25 } },
  { gate: { x: 18, y: 26 }, approach: { x: 18, y: 27 } },
  { gate: { x: 31, y: 48 }, approach: { x: 30, y: 48 } },
  { gate: { x: 37, y: 49 }, approach: { x: 37, y: 50 } },
  { gate: { x: 98, y: 33 }, approach: { x: 98, y: 34 } },
  { gate: { x: 94, y: 51 }, approach: { x: 94, y: 52 } },
  { gate: { x: 114, y: 48 }, approach: { x: 113, y: 48 } },
  { gate: { x: 124, y: 58 }, approach: { x: 125, y: 58 } },
  { gate: { x: 112, y: 16 }, approach: { x: 112, y: 16 } },
  { gate: { x: 96, y: 72 }, approach: { x: 96, y: 72 } }
]);

const HELPER_DIALOGUE_IDS = Object.freeze([
  'south-measure-civil-stair-surface',
  'south-measure-collapsed-culvert-surface',
  'south-measure-repair-trench-surface',
  'south-measure-annex-service-hatch-surface',
  'south-measure-annex-main-door-surface',
  'south-measure-freight-main-door-surface',
  'south-measure-freight-rear-door-surface',
  'south-measure-clinic-main-door-surface',
  'south-measure-hall-main-door-surface',
  'south-measure-varo-door-surface',
  'south-measure-hidden-rows-drying-frame-surface',
  'south-measure-hidden-rows-grave-passage-surface',
  'south-measure-charity-trapdoor-surface'
]);

const reservedHelperCells = new Set();
for (const { gate, approach } of HELPER_GATES) {
  reservedHelperCells.add(`${gate.x},${gate.y}`);
  for (let dy = -1; dy <= 1; dy += 1) {
    for (let dx = -1; dx <= 1; dx += 1) {
      reservedHelperCells.add(`${approach.x + dx},${approach.y + dy}`);
    }
  }
}

function key(x, y) {
  return `${x},${y}`;
}

function inBounds(x, y) {
  return x >= 0 && y >= 0 && x < WIDTH && y < HEIGHT;
}

function hash(x, y, salt = 0) {
  let value = (Math.imul(x + salt * 19, 374761393) + Math.imul(y + 131, 668265263)) | 0;
  value = Math.imul(value ^ (value >>> 13), 1274126177);
  return (value ^ (value >>> 16)) >>> 0;
}

function borderTile(x, y) {
  // South Measure ends against its own retired drainage berm. The former
  // mixed forest border borrowed Long Ash and Censure silhouettes and made the
  // settlement read like another camp clearing before the player reached it.
  void x;
  void y;
  return 'b';
}

const tiles = Array.from({ length: HEIGHT }, (_, y) =>
  Array.from({ length: WIDTH }, (_, x) => borderTile(x, y))
);

function getTile(x, y) {
  return inBounds(x, y) ? tiles[y][x] : null;
}

function setTile(x, y, tile) {
  if (inBounds(x, y)) tiles[y][x] = tile;
}

function paintRect(x0, y0, x1, y1, tile) {
  for (let y = y0; y <= y1; y += 1) {
    for (let x = x0; x <= x1; x += 1) setTile(x, y, tile);
  }
}

function paintEllipse(cx, cy, rx, ry, tile) {
  for (let y = Math.max(0, cy - ry); y <= Math.min(HEIGHT - 1, cy + ry); y += 1) {
    for (let x = Math.max(0, cx - rx); x <= Math.min(WIDTH - 1, cx + rx); x += 1) {
      const dx = (x - cx) / rx;
      const dy = (y - cy) / ry;
      if (dx * dx + dy * dy <= 1) setTile(x, y, tile);
    }
  }
}

function distanceToSegment(px, py, a, b) {
  const vx = b.x - a.x;
  const vy = b.y - a.y;
  const wx = px - a.x;
  const wy = py - a.y;
  const len2 = vx * vx + vy * vy;
  const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, (wx * vx + wy * vy) / len2));
  const qx = a.x + t * vx;
  const qy = a.y + t * vy;
  return Math.hypot(px - qx, py - qy);
}

function paintPath(points, radius, coreTile = 'r', shoulderTile = 's') {
  for (let y = 0; y < HEIGHT; y += 1) {
    for (let x = 0; x < WIDTH; x += 1) {
      let distance = Number.POSITIVE_INFINITY;
      for (let index = 0; index < points.length - 1; index += 1) {
        distance = Math.min(distance, distanceToSegment(x, y, points[index], points[index + 1]));
      }
      if (distance <= radius + 2 && WALKABLE_TILES.has(getTile(x, y))) setTile(x, y, shoulderTile);
      if (distance <= radius) setTile(x, y, coreTile);
    }
  }
}

function paintBuilding(x0, y0, x1, y1, tile, cuts = []) {
  paintRect(x0, y0, x1, y1, tile);
  for (const [cx0, cy0, cx1, cy1, replacement = '.'] of cuts) paintRect(cx0, cy0, cx1, cy1, replacement);
}

function addObject(kind, x, y, extra = {}) {
  if (!inBounds(x, y)) throw new Error(`Object ${kind} is out of bounds at ${x},${y}`);
  const object = {
    id: extra.id ?? `${kind}-${objects.length + 1}`,
    kind,
    x,
    y,
    seed: extra.seed ?? hash(x, y, objects.length + 3),
    ...extra
  };
  objects.push(object);
  if (object.blocking) occupied.add(key(x, y));
  return object;
}

function canPlace(x, y) {
  return inBounds(x, y)
    && WALKABLE_TILES.has(getTile(x, y))
    && !occupied.has(key(x, y))
    && !reservedHelperCells.has(key(x, y));
}

function placeIfOpen(kind, x, y, extra = {}) {
  if (!canPlace(x, y)) return null;
  return addObject(kind, x, y, extra);
}

function placeIfClear(kind, x, y, extra = {}) {
  if (!canPlace(x, y) || objects.some((object) => object.x === x && object.y === y)) return null;
  return addObject(kind, x, y, extra);
}

function paintSettlementGround() {
  paintEllipse(65, 42, 63, 39, 'h');
  paintEllipse(27, 44, 25, 33, 'y');
  paintEllipse(107, 43, 25, 35, 'h');
  paintRect(59, 0, 71, 79, 's');
  paintRect(62, 0, 68, 79, 'r');

  paintPath([
    { x: 65, y: 77 }, { x: 63, y: 67 }, { x: 64, y: 57 },
    { x: 65, y: 46 }, { x: 64, y: 34 }, { x: 65, y: 20 }, { x: 65, y: 0 }
  ], 4);

  paintPath([
    { x: 59, y: 60 }, { x: 43, y: 57 }, { x: 24, y: 54 },
    { x: 16, y: 45 }, { x: 20, y: 32 }, { x: 39, y: 28 }, { x: 57, y: 34 }
  ], 2, 'y', 'c');

  paintPath([
    { x: 72, y: 62 }, { x: 88, y: 67 }, { x: 108, y: 62 },
    { x: 119, y: 52 }, { x: 112, y: 39 }, { x: 99, y: 29 }, { x: 76, y: 34 }
  ], 2, 'h', 'c');

  paintRect(47, 44, 81, 64, 'c');
  paintRect(51, 48, 60, 61, 'y');
  paintRect(61, 47, 70, 62, 'c');
  paintRect(71, 49, 78, 61, 'h');
  paintRect(48, 24, 82, 43, 'c');
  paintRect(50, 27, 58, 41, 'y');
  paintRect(59, 27, 72, 41, 'c');
  paintRect(73, 27, 81, 41, 'h');
  // Two complete intake treads carry the surviving civic process from the
  // records end to weighing. Narrow slab breaks at each stage preserve the
  // cross-aisles; the shorter south tread belongs to the failed basket lane.
  for (const [x0, x1, y] of [
    [49, 55, 28], [57, 62, 28], [64, 69, 28], [71, 77, 28],
    [50, 55, 35], [57, 62, 35], [66, 70, 35], [72, 78, 35],
    [50, 60, 41]
  ]) {
    for (let x = x0; x <= x1; x += 1) setTile(x, y, 'y');
  }
  paintRect(83, 17, 123, 35, 'c');
  paintRect(87, 20, 119, 34, 'c');
  paintRect(82, 2, 128, 18, 'e');
  paintRect(14, 62, 45, 79, 'h');
  paintRect(26, 66, 34, 78, 'y');
  paintRect(35, 64, 48, 77, 'c');
  paintRect(46, 69, 58, 77, 'c');
  paintRect(84, 64, 109, 79, 'c');
  paintRect(87, 66, 107, 77, 'h');
  paintRect(110, 66, 128, 79, 'y');

  // Three work aprons organize the freight yard without turning its public
  // circulation into another road. Each material patch belongs to one
  // clustered operation: wagon service, bonded loading, or medicine dispatch.
  paintRect(6, 45, 19, 60, 'y');
  paintRect(20, 48, 33, 61, 'c');
  paintRect(35, 49, 46, 61, 'h');

  // Surviving relief channels visibly connect the water court to the south
  // drain. They are authored as coherent runs, not isolated blue floor marks.
  for (let x = 52; x <= 77; x += 1) setTile(x, 55, 'x');
  for (let y = 50; y <= 61; y += 1) setTile(65, y, 'z');
  setTile(65, 55, 'j');
  for (let x = 110; x <= 119; x += 1) setTile(x, 68, 'x');
  for (let y = 68; y <= 73; y += 1) setTile(119, y, 'z');
  setTile(119, 68, 'j');
  setTile(120, 73, 'x');

  // Preserve the two campaign-road throats after district painting.
  paintRect(61, 0, 69, 11, 's');
  paintRect(63, 0, 67, 11, 'r');
  paintRect(60, 63, 70, 79, 's');
  paintRect(63, 63, 67, 79, 'r');
}

function placeBuildings() {
  // Relief annex, L-shaped to leave a damaged rear court and service apron.
  paintBuilding(8, 10, 31, 17, 'A', [
    [8, 13, 11, 16, 'g'], [13, 10, 15, 12, 'g'],
    [22, 14, 31, 17, 'g'], [28, 10, 31, 12, 'g']
  ]);
  paintBuilding(8, 18, 20, 23, 'A', [[8, 18, 10, 20, 'g'], [16, 21, 20, 23, 'g']]);
  // The canonical loading door is south of the original block. This short
  // frontage makes the gate a real annex wall while leaving the east service
  // hatch at 20,24 outside the shell.
  paintBuilding(14, 22, 19, 26, 'A');

  // Morrow freight house and guard bunk.
  paintBuilding(10, 34, 27, 41, 'F', [
    [10, 34, 13, 36, 'g'], [20, 38, 27, 41, 'g'], [24, 34, 27, 36, 'g']
  ]);
  paintBuilding(31, 44, 39, 49, 'F');

  // Compact clinic and intake processing canopy.
  paintBuilding(96, 20, 109, 26, 'C', [[105, 24, 109, 26, 'g']]);
  paintBuilding(113, 22, 119, 26, 'C');
  // A narrow intake wing carries the canonical clinic gate at 98,33 onto a
  // real south-facing wall instead of leaving the transition loose in the
  // screening yard.
  paintBuilding(96, 27, 100, 33, 'C');

  // Admission booth beside the central screening lanes.
  paintBuilding(53, 29, 58, 34, 'B');

  // Rope Rows use tightly staggered households. One-cell alleys and offset
  // fronts make shared courts, while the cut corners keep each legal holding
  // distinct instead of stamping one rectangular roof down the district.
  const rowhouses = [
    [82, 36, 87, 42, [[82, 36, 83, 38, 'h']]],
    [89, 37, 95, 42, [[94, 37, 95, 38, 'h']]],
    [97, 36, 102, 41, []],
    [104, 38, 110, 43, [[104, 42, 105, 43, 'h']]],
    [112, 36, 118, 42, [[112, 36, 113, 40, 'h'], [116, 36, 118, 38, 'h'], [117, 41, 118, 42, 'h']]],
    [120, 38, 125, 43, [[120, 38, 121, 40, 'h']]],
    [127, 36, 129, 42, [[127, 41, 128, 42, 'h']]],
    [82, 44, 88, 51, [[82, 44, 84, 46, 'h'], [87, 50, 88, 51, 'h']]],
    [99, 44, 105, 50, [[103, 44, 105, 46, 'h']]],
    [107, 45, 112, 52, [[107, 50, 108, 52, 'h']]],
    [114, 44, 121, 51, [[114, 44, 116, 46, 'h'], [120, 47, 121, 49, 'h'], [119, 50, 121, 51, 'h']]],
    [123, 45, 129, 52, [[127, 45, 129, 47, 'h'], [123, 51, 124, 52, 'h']]],
    [82, 53, 89, 61, [[82, 53, 85, 55, 'h'], [88, 59, 89, 61, 'h']]],
    [91, 54, 98, 62, [[96, 54, 98, 56, 'h'], [91, 60, 93, 62, 'h']]],
    [100, 53, 107, 61, [[100, 53, 102, 55, 'h'], [106, 59, 107, 61, 'h']]],
    [109, 54, 116, 63, [[114, 54, 116, 57, 'h'], [109, 61, 111, 63, 'h']]],
    [118, 53, 124, 61, [[118, 53, 120, 55, 'h'], [123, 60, 124, 61, 'h']]],
    [126, 54, 129, 62, [[126, 60, 127, 62, 'h']]]
  ];
  const roofFamilies = ['R', 'T', 'U', 'V'];
  rowhouses.forEach(([x0, y0, x1, y1, cuts], index) => {
    paintBuilding(x0, y0, x1, y1, roofFamilies[index % roofFamilies.length], cuts);
  });
  // Measure Hall's story-map door is 94,51. Put the Hall on that frontage,
  // then return its former footprint to ordinary Rope Rows housing.
  paintBuilding(90, 45, 97, 51, 'H', [[90, 45, 91, 46, 'h']]);

  // Burial tool shed. Keep it inside the central family plots so the burial
  // edge reads as one tended precinct at ordinary walking distance.
  paintBuilding(104, 11, 109, 14, 'S');
}

function placeRoadBoundaries() {
  for (const [x, y, orient] of [
    [60, 79, 'se'], [61, 79, 'se'], [69, 79, 'se'], [70, 79, 'se'],
    [60, 1, 'se'], [61, 1, 'se'], [69, 1, 'se'], [70, 1, 'se']
  ]) addObject('measure-boundary-fence', x, y, { blocking: true, orient });

  addObject('south-chain-gate', 65, 79, {
    id: 'ash-road-south-censure-gate',
    name: 'South Chain',
    blocking: true,
    orient: 'se',
    interact: {
      type: 'secret-exit',
      dialogue: 'ash-road-south-censure-road-exit',
      log: 'The south road returns to the Censure camp.'
    },
    clickAreas: [{ x0: 62, y0: 78, x1: 68, y1: 79 }],
    interactionMarker: { x: 65, y: 78 },
    mapMarker: { label: 'Censure Road Camp', kind: 'exit', reveal: 'always' }
  });

  addObject('north-chain-gate', 65, 1, {
    id: 'ash-road-south-north-chain',
    name: 'North Chain',
    blocking: true,
    orient: 'se',
    hiddenWhenFlags: ['south-measure-north-lane-open'],
    interact: {
      type: 'secret-exit',
      dialogue: 'ash-road-south-north-departure',
      log: 'The north chain waits on South Measure’s water settlement.'
    },
    clickAreas: [{ x0: 62, y0: 0, x1: 68, y1: 2 }],
    interactionMarker: { x: 65, y: 2 },
    mapMarker: { label: 'Old Pilgrim Way', kind: 'locked', reveal: 'always' }
  });
  addObject('south-measure-notice-board', 71, 1, {
    id: 'ash-road-south-open-north-road',
    name: 'Open North Road',
    blocking: false,
    visibleWhenFlags: ['south-measure-north-lane-open'],
    interact: {
      type: 'secret-exit',
      dialogue: 'ash-road-south-north-departure',
      log: 'The raised chain leaves Old Pilgrim Way open.'
    },
    interactionMarker: { x: 71, y: 2 },
    mapMarker: { label: 'Old Pilgrim Way', kind: 'exit', reveal: 'always' }
  });
  addObject('south-measure-notice-board', 73, 5, {
    id: 'ash-road-south-hallowfen-marker',
    blocking: true,
    name: 'Damaged Hallowfen Marker',
    mapMarker: { label: 'Hallowfen Marker', kind: 'note', reveal: 'explored' }
  });
}

function placeOutcomeDressing() {
  addObject('south-measure-notice-board', 80, 59, {
    id: 'ash-road-south-compact-census-desk', blocking: true,
    variant: 'census',
    visibleWhenFlags: ['south-measure-compact'],
    name: 'Compact Pump Register',
    interact: { type: 'note', log: 'Compact clinic numbers now mark every pump inspection and patient follow-up.' }
  });
  addObject('south-measure-return-stall', 55, 59, {
    id: 'ash-road-south-morrow-service-store', blocking: true, orient: 'sw',
    variant: 'bonded',
    visibleWhenFlags: ['south-measure-morrow'],
    name: 'Morrow Service Store',
    interact: { type: 'note', log: 'Morrow filters and service tools sit behind a bonded cage beside the water court.' }
  });
  addObject('mesh-cage-panel', 52, 58, {
    id: 'ash-road-south-morrow-court-cage', blocking: false, orient: 'se', variant: 'bonded',
    visibleWhenFlags: ['south-measure-morrow']
  });
  addObject('south-measure-water-vessels', 52, 60, {
    id: 'ash-road-south-morrow-court-freight-vessels', blocking: false, orient: 'se', variant: 'freight',
    visibleWhenFlags: ['south-measure-morrow']
  });
  addObject('south-measure-return-stall', 69, 59, {
    id: 'ash-road-south-resident-key-table', blocking: true, orient: 'se',
    variant: 'pump-keys',
    visibleWhenFlags: ['south-measure-resident'],
    name: 'Resident Pump Table',
    interact: { type: 'note', log: 'Four resident keys lie beneath Noa’s maintenance slate. No outside seal covers them.' }
  });
  addObject('south-measure-hand-pump', 67, 61, {
    id: 'ash-road-south-resident-table-pump', blocking: false,
    visibleWhenFlags: ['south-measure-resident']
  });
  addObject('south-measure-notice-board', 61, 55, {
    id: 'ash-road-south-sealed-ration-board', blocking: true,
    variant: 'sealed',
    visibleWhenFlags: ['south-measure-sealed'],
    name: 'Sealed Ration Board',
    interact: { type: 'note', log: 'The ration board limits every household claim and records no outside pump access.' }
  });
}

function placeOldMeasureGates() {
  // Two surviving lanes retain the whole records, threshold, inspection and
  // weighing sequence. Their frame tails and joined rails stop only at narrow
  // cross-aisles. A third basket lane failed near its records end and remains
  // as one short connected ruin instead of another complete portal row.
  const screeningStages = [
    [50, 28, 'se', 'records', false],
    [51, 35, 'se', 'records', false],
    [52, 41, 'se', 'broken-baskets', true],
    [57, 28, 'se', 'threshold', false],
    [58, 35, 'se', 'threshold', false],
    [59, 41, 'se', 'broken-baskets', true],
    [64, 28, 'se', 'inspection', false],
    [66, 35, 'se', 'inspection', false],
    [71, 28, 'se', 'weighing', false],
    [73, 35, 'se', 'weighing', false]
  ];
  screeningStages.forEach(([x, y, orient, variant, damaged], index) => {
    addObject('intake-screening-frame', x, y, {
      id: `ash-road-south-screening-stage-${String(index + 1).padStart(2, '0')}`,
      blocking: true,
      orient,
      variant,
      damaged,
      seed: hash(x, y, 211 + index * 17)
    });
  });

  addObject('south-measure-notice-board', 49, 36, {
    id: 'ash-road-south-public-water-board',
    blocking: true,
    orient: 'se',
    variant: 'census',
    name: 'Public Water Board',
    mapMarker: { label: 'Old Measure Gates', kind: 'note', reveal: 'always' }
  });
  addObject('south-measure-return-stall', 78, 36, {
    id: 'ash-road-south-return-shelf', blocking: true, orient: 'sw', variant: 'bonded'
  });
  addObject('freight-scale', 76, 29, {
    id: 'ash-road-south-old-gate-scale', blocking: true, orient: 'sw', variant: 'claim'
  });

  // Each rail list is one end-to-end run. The one-cell omissions align with
  // the tread breaks above, keeping lateral movement without losing the lane.
  for (const [x, y, orient] of [
    [52, 28, 'se'], [54, 28, 'se'], [59, 28, 'se'], [61, 28, 'se'],
    [66, 28, 'se'], [68, 28, 'se'], [73, 28, 'se'],
    [53, 35, 'se'], [55, 35, 'se'], [60, 35, 'se'], [62, 35, 'se'],
    [68, 35, 'se'], [70, 35, 'se'], [75, 35, 'se'],
    [54, 41, 'se'], [56, 41, 'se']
  ]) {
    addObject('south-measure-queue-rail', x, y, {
      blocking: true,
      orient,
      seed: hash(x, y, 263 + x + y)
    });
  }
  for (const [x, y, variant, orient] of [
    [55, 27, 'lime-records-chest', 'se'],
    [49, 31, 'current-records', 'sw'],
    [56, 38, 'current-records', 'se'],
    [76, 39, 'locked-cabinet', 'sw']
  ]) {
    const extra = { blocking: true, variant, orient };
    if (x === 55 && y === 27) {
      Object.assign(extra, {
        id: 'ash-road-south-discarded-return-crate',
        name: 'Discarded Return Crate',
        interact: {
          type: 'container',
          log: 'The return crate has split at one corner. Dry rations and small change remain under the broken slat.',
          loot: [
            { item: 'tinned-beans', count: 2 },
            { item: 'ducat', count: 3 },
            { item: 'penitent-gear-scrap', count: 1 }
          ]
        }
      });
    }
    addObject('south-measure-storage', x, y, extra);
  }
}

function placeWaterCourt() {
  addObject('water-condenser', 65, 52, {
    id: 'ash-road-south-water-condenser',
    blocking: true,
    name: 'Water Condenser',
    clickAreas: [{ x0: 62, y0: 48, x1: 68, y1: 53 }],
    mapMarker: { label: 'Water Court', kind: 'note', reveal: 'always' }
  });
  addObject('south-measure-settling-vat', 58, 50, {
    id: 'ash-road-south-settling-tank-west', blocking: true, seed: hash(58, 50, 307)
  });
  addObject('south-measure-settling-vat', 57, 56, {
    id: 'ash-road-south-settling-tank-east', blocking: true, seed: hash(57, 56, 331)
  });
  addObject('public-tap-stand', 72, 50, {
    id: 'ash-road-south-public-taps-west', blocking: true, orient: 'se', seed: hash(72, 50, 347)
  });
  addObject('public-tap-stand', 74, 56, {
    id: 'ash-road-south-public-taps-east', blocking: true, orient: 'sw', seed: hash(74, 56, 359)
  });
  addObject('south-measure-hand-pump', 62, 60, {
    id: 'ash-road-south-maintenance-sump', blocking: true
  });
  addObject('south-measure-repair-rack', 60, 58, {
    id: 'ash-road-south-settling-tools', blocking: true, orient: 'sw'
  });
  addObject('south-measure-repair-rack', 69, 60, {
    id: 'ash-road-south-pump-tools', blocking: true, orient: 'se'
  });
  addObject('wash-wall', 78, 54, {
    id: 'ash-road-south-tap-wash-wall', blocking: true, orient: 'sw'
  });
  addObject('south-measure-notice-board', 80, 50, {
    id: 'ash-road-south-ration-board',
    blocking: true,
    orient: 'sw',
    variant: 'census',
    hiddenWhenFlags: ['south-measure-compact']
  });
  addObject('south-measure-return-stall', 52, 57, {
    id: 'ash-road-south-water-issue-stall', blocking: true, orient: 'se', variant: 'pump-keys'
  });

  // Dirty intake stays west of the condenser; clean issue and washing stay
  // east. The mixed vessel silhouettes make the transfer sequence visible.
  for (const [x, y, orient, variant, salt] of [
    [52, 50, 'sw', 'freight', 373],
    [52, 61, 'se', 'household', 379],
    [61, 47, 'se', 'freight', 383],
    [75, 48, 'sw', 'clinic', 389],
    [78, 58, 'se', 'household', 397],
    [75, 61, 'sw', 'clinic', 401]
  ]) {
    addObject('south-measure-water-vessels', x, y, {
      blocking: true, orient, variant, seed: hash(x, y, salt)
    });
  }
  for (const [x, y, orient, salt] of [
    [55, 48, 'sw', 409],
    [60, 47, 'se', 419],
    [59, 54, 'sw', 421],
    [69, 57, 'se', 431],
    [76, 56, 'sw', 433]
  ]) {
    const extra = {
      blocking: true,
      orient,
      seed: hash(x, y, salt)
    };
    if (x === 60 && y === 47) extra.id = 'ash-road-south-condenser-feed-gantry';
    addObject('south-measure-pipe-gantry', x, y, extra);
  }
  for (const [x, y, orient] of [
    [49, 47, 'se'], [52, 46, 'se'], [79, 47, 'sw'], [80, 60, 'sw'], [80, 62, 'sw'], [50, 62, 'se']
  ]) {
    addObject('south-measure-queue-rail', x, y, { blocking: true, orient });
  }
}

function placeMorrowYard() {
  // Wagon service occupies the west apron. Two wagons turn around a shared
  // hoist, tool rack and freight-water stand instead of repeating across the
  // full yard.
  for (const [x, y, orient, salt] of [
    [9, 54, 'se', 457], [14, 57, 'sw', 461]
  ]) {
    addObject('freight-wagon', x, y, {
      blocking: true, orient, seed: hash(x, y, salt)
    });
  }
  addObject('fixed-hoist', 12, 49, {
    id: 'ash-road-south-wagon-service-hoist', blocking: true, seed: hash(12, 49, 463)
  });
  addObject('south-measure-repair-rack', 17, 51, {
    id: 'ash-road-south-wagon-service-tools', blocking: true, orient: 'sw'
  });
  addObject('south-measure-water-vessels', 8, 58, {
    id: 'ash-road-south-animal-trough', blocking: true, orient: 'se', variant: 'freight'
  });
  addObject('south-measure-hand-pump', 18, 58, {
    id: 'ash-road-south-wagon-yard-pump', blocking: true
  });
  addObject('south-measure-pipe-gantry', 16, 55, {
    id: 'ash-road-south-wagon-service-frame', blocking: true, orient: 'sw'
  });

  // The middle apron is one bonded load compound. Seven cages form an uneven
  // perimeter around a scale, two wagons and the loading hoist while leaving
  // the freight-house and repair-trench approaches open.
  for (const [x, y, orient, salt] of [
    [23, 53, 'se', 467], [27, 58, 'sw', 479]
  ]) {
    addObject('freight-wagon', x, y, {
      blocking: true, orient, seed: hash(x, y, salt)
    });
  }
  for (const [x, y, orient, salt] of [
    [21, 50, 'se', 487], [24, 49, 'sw', 491], [27, 51, 'se', 499],
    [21, 57, 'sw', 503], [24, 59, 'se', 509], [29, 59, 'sw', 521], [30, 52, 'se', 523]
  ]) {
    addObject('grain-cage', x, y, {
      blocking: true, orient, seed: hash(x, y, salt)
    });
  }
  for (const [x, y, orient] of [
    [20, 52, 'sw'], [20, 54, 'sw'], [20, 56, 'sw'], [28, 49, 'se'], [30, 58, 'se']
  ]) {
    addObject('mesh-cage-panel', x, y, {
      blocking: true, variant: 'parts', orient, seed: hash(x, y, 541 + x + y)
    });
  }
  addObject('freight-scale', 26, 54, {
    id: 'ash-road-south-yard-scale', blocking: true, orient: 'se', variant: 'claim'
  });
  addObject('fixed-hoist', 29, 50, {
    id: 'ash-road-south-bonded-load-hoist', blocking: true, seed: hash(29, 50, 547)
  });

  // Medicine dispatch uses the east apron as a compact cistern station. The
  // treatment trolley, one outbound wagon and the blue freight tanks share a
  // single service frame and tool line.
  addObject('south-measure-medicine-cart', 39, 56, {
    id: 'ash-road-south-medicine-cart',
    blocking: true,
    orient: 'sw',
    name: 'Medicine Cart',
    mapMarker: { label: 'Morrow Freight Yard', kind: 'note', reveal: 'always' }
  });
  addObject('freight-wagon', 45, 56, {
    id: 'ash-road-south-medicine-dispatch-wagon', blocking: true, orient: 'se', seed: hash(45, 56, 557)
  });
  addObject('fixed-hoist', 43, 51, {
    id: 'ash-road-south-medicine-dispatch-hoist', blocking: true, seed: hash(43, 51, 563)
  });
  for (const [x, y, orient, variant, salt] of [
    [36, 52, 'se', 'freight', 569], [43, 59, 'sw', 'clinic', 571]
  ]) {
    addObject('south-measure-water-vessels', x, y, {
      blocking: true, orient, variant, seed: hash(x, y, salt)
    });
  }
  addObject('south-measure-repair-rack', 37, 59, {
    id: 'ash-road-south-repair-stand', blocking: true, orient: 'se'
  });
  addObject('south-measure-repair-rack', 44, 53, {
    id: 'ash-road-south-yard-tools', blocking: true, orient: 'sw'
  });
  for (const [x, y, orient] of [[38, 52, 'se'], [42, 55, 'sw']]) {
    addObject('south-measure-pipe-gantry', x, y, {
      blocking: true, orient, seed: hash(x, y, 577 + x + y)
    });
  }

  // The three hoists and machine nests below belong to the relief annex,
  // whose composition is outside the freight-yard repair.
  for (const [x, y] of [[10, 27], [27, 26], [37, 25]]) addObject('fixed-hoist', x, y, { blocking: true });
  for (const [x, y, variant, orient] of [
    [11, 24, 'generator', 'se'],
    [29, 24, 'pump-jig', 'sw'],
    [35, 26, 'cooling-jacket', 'sw']
  ]) addObject('relief-machine', x, y, { blocking: true, variant, orient });
  for (const [x, y, variant] of [
    [8, 25, 'straight'], [9, 25, 'straight'], [10, 25, 'valve'],
    [27, 23, 'straight'], [28, 23, 'straight'], [29, 23, 'elbow']
  ]) addObject('service-pipe-run', x, y, { blocking: false, variant, orient: 'se' });
  for (const x of [31, 32, 33]) {
    addObject('mesh-cage-panel', x, 26, { blocking: true, variant: 'parts', orient: 'se' });
  }
  addObject('freight-scale', 29, 27, { id: 'ash-road-south-annex-scale', blocking: true, variant: 'claim', orient: 'se' });
  addObject('south-measure-repair-rack', 33, 28, {
    id: 'ash-road-south-annex-salvage-rack', blocking: true, orient: 'sw'
  });
}

function placeCompactPrecinct() {
  for (const [x, y] of [
    [88, 22], [93, 22], [88, 27], [93, 27], [88, 32], [93, 32], [117, 30]
  ]) {
    addObject('intake-screening-frame', x, y, { blocking: true, orient: 'sw' });
  }
  addObject('wash-wall', 119, 29, { id: 'ash-road-south-compact-wash', blocking: true, orient: 'sw' });
  addObject('south-measure-sample-burner', 122, 31, { id: 'ash-road-south-sample-burner', blocking: true });
  addObject('south-measure-hand-pump', 87, 33, { id: 'ash-road-south-clinic-pump', blocking: true });
  addObject('south-measure-receiving-shelter', 91, 24, {
    id: 'ash-road-south-dependent-awning', blocking: true, orient: 'se'
  });
  for (const x of [85, 90, 95]) {
    for (let y = 21; y <= 33; y += 1) {
      addObject('south-measure-queue-rail', x, y, { blocking: true, orient: 'sw' });
    }
  }
  addObject('south-measure-queue-rail', 113, 32, { blocking: true, orient: 'sw' });
  for (const [x, y] of [[85, 24], [85, 28]]) {
    addObject('charity-cot', x, y, { blocking: true, orient: 'sw' });
  }
  for (const [x, y] of [[84, 25], [84, 29]]) {
    addObject('cloth-partition', x, y, { blocking: true, orient: 'sw', variant: 'clinic' });
  }
  addObject('south-measure-notice-board', 91, 20, {
    id: 'ash-road-south-compact-queue-board',
    blocking: true,
    name: 'Compact Counting Canvas',
    mapMarker: { label: 'Compact Clinic', kind: 'note', reveal: 'always' }
  });
  addObject('south-measure-pipe-gantry', 115, 30, {
    id: 'ash-road-south-compact-generator-frame', blocking: true, orient: 'sw'
  });
  addObject('relief-machine', 113, 28, {
    id: 'ash-road-south-compact-generator', blocking: true, orient: 'sw', variant: 'generator'
  });
  addObject('mesh-cage-panel', 113, 30, {
    id: 'ash-road-south-compact-generator-cage', blocking: true, orient: 'sw', variant: 'parts'
  });
  addObject('south-measure-water-vessels', 120, 27, {
    id: 'ash-road-south-compact-clean-vessels', blocking: true, orient: 'sw', variant: 'clinic'
  });
}

function placeRopeRows() {
  const laundry = [
    [84, 44, 'sw'], [94, 44, 'se'], [105, 44, 'sw'], [116, 44, 'se'],
    [84, 54, 'se'], [96, 54, 'sw'], [108, 55, 'se'], [121, 54, 'sw']
  ];
  for (const [x, y, orient] of laundry) addObject('laundry-line', x, y, { orient });
  for (const [x, y] of [[89, 46], [103, 46], [114, 46], [90, 56], [103, 56], [112, 56]]) {
    addObject('shared-oven', x, y, { blocking: true });
  }
  for (const [x, y, orient] of [[83, 57, 'sw'], [104, 47, 'sw'], [126, 47, 'sw'], [115, 64, 'se']]) {
    addObject('wash-wall', x, y, { blocking: true, orient });
  }
  for (const [x, y] of [[93, 44], [104, 44], [93, 55], [104, 57]]) {
    addObject('south-measure-hand-pump', x, y, { blocking: true });
  }
  for (const [x, y, orient] of [
    [82, 42, 'sw'], [98, 43, 'se'], [105, 43, 'sw'], [117, 44, 'se'],
    [84, 55, 'sw'], [91, 54, 'se'], [114, 56, 'sw'], [121, 56, 'se']
  ]) {
    addObject('south-measure-water-vessels', x, y, { blocking: true, orient, variant: 'household' });
  }
  addObject('south-measure-repair-rack', 116, 46, {
    id: 'ash-road-south-varo-pump-parts', blocking: true, orient: 'sw'
  });
  addObject('south-measure-return-stall', 126, 56, {
    id: 'ash-road-south-boot-repair-stall', blocking: true, orient: 'se'
  });
  addObject('south-measure-notice-board', 94, 53, {
    id: 'ash-road-south-measure-hall-board',
    blocking: true,
    name: 'Measure Hall',
    mapMarker: { label: 'Rope Rows', kind: 'note', reveal: 'always' }
  });
}

function placeGraveStrip() {
  let graveIndex = 1;
  const graveFamilies = [
    {
      rail: [86, 6, 'se'],
      graves: [
        [83, 3, 'se'], [86, 3, 'sw'], [89, 4, 'ne'],
        [84, 6, 'nw'], [88, 8, 'sw'], [85, 9, 'ne']
      ]
    },
    {
      rail: [100, 6, 'sw'],
      graves: [
        [97, 3, 'sw'], [100, 3, 'ne'], [103, 4, 'se'],
        [98, 6, 'nw'], [102, 8, 'sw'], [99, 9, 'se']
      ]
    },
    {
      rail: [87, 15, 'nw'],
      graves: [
        [83, 13, 'se'], [87, 13, 'nw'], [91, 14, 'sw'],
        [84, 16, 'ne'], [88, 18, 'se'], [93, 17, 'nw']
      ]
    },
    {
      rail: [111, 6, 'ne'],
      graves: [
        [108, 3, 'se'], [112, 3, 'sw'], [115, 4, 'ne'],
        [109, 6, 'nw'], [113, 8, 'se'], [116, 9, 'sw']
      ]
    },
    {
      rail: [121, 14, 'se'],
      graves: [
        [118, 12, 'se'], [122, 12, 'nw'], [126, 13, 'sw'],
        [119, 15, 'ne'], [123, 17, 'se'], [127, 18, 'sw']
      ]
    }
  ];
  graveFamilies.forEach(({ rail, graves }, familyIndex) => {
    const [railX, railY, railOrient] = rail;
    addObject('south-measure-grave-family-rail', railX, railY, {
      id: `ash-road-south-grave-family-tally-${familyIndex + 1}`,
      blocking: false,
      orient: railOrient,
      seed: hash(railX, railY, 601 + familyIndex * 29)
    });
    for (const [x, y, orient] of graves) {
      if (reservedHelperCells.has(key(x, y))) continue;
      const familySeed = (hash(x, y, 617 + graveIndex * 13) & ~3) | ((graveIndex - 1) & 3);
      addObject('measure-grave-plot', x, y, {
        id: `ash-road-south-grave-${String(graveIndex).padStart(2, '0')}`,
        blocking: true,
        orient,
        seed: familySeed
      });
      graveIndex += 1;
    }
  });
  addObject('south-measure-brass-hook-memorial', 111, 14, {
    id: 'ash-road-south-brass-hook-memorial', blocking: true
  });
  addObject('south-measure-repair-rack', 111, 11, {
    id: 'ash-road-south-burial-tools', blocking: true, orient: 'se'
  });
  addObject('south-measure-notice-board', 82, 16, {
    id: 'ash-road-south-grave-strip-marker',
    blocking: true,
    name: 'Grave Strip',
    mapMarker: { label: 'Grave Strip', kind: 'note', reveal: 'always' }
  });
  for (const [x, y] of [[112, 10], [118, 3], [125, 4], [127, 8], [127, 13], [116, 17], [126, 18]]) {
    addObject('south-measure-drain-reeds', x, y, {
      id: `ash-road-south-grave-reeds-${x}-${y}`,
      blocking: true,
      seed: hash(x, y, 701)
    });
  }
}

function placeArrivalAndCharityEdges() {
  // Receiving stays legible at walking distance from west to east. A backed
  // sleeping bay leads directly into one shared warming line, then a hard
  // registration counter hands arrivals into the established water service.
  for (const [x, y, orient, salt] of [
    [22, 67, 'se', 733], [29, 67, 'sw', 739], [36, 68, 'se', 743]
  ]) {
    addObject('south-measure-receiving-shelter', x, y, {
      blocking: true, orient, seed: hash(x, y, salt)
    });
  }
  for (const [x, y, salt] of [[27, 72, 751], [29, 72, 757], [31, 72, 761]]) {
    addObject('south-measure-arrival-hearth', x, y, {
      seed: hash(x, y, salt)
    });
  }
  for (const [x, y, orient, salt] of [
    [16, 69, 'se', 769], [19, 70, 'sw', 773], [22, 69, 'ne', 787],
    [15, 73, 'nw', 797], [19, 74, 'se', 809], [23, 73, 'sw', 811], [17, 76, 'ne', 821]
  ]) {
    addObject('south-measure-sleeping-pallet', x, y, {
      orient, seed: hash(x, y, salt)
    });
  }
  addObject('south-measure-notice-board', 42, 66, {
    id: 'ash-road-south-arrival-board',
    blocking: true,
    orient: 'sw',
    variant: 'census',
    name: 'New Arrival Fires',
    mapMarker: { label: 'New Arrival Fires', kind: 'note', reveal: 'always' }
  });
  addObject('south-measure-repair-rack', 15, 66, {
    id: 'ash-road-south-arrival-picket', blocking: true, orient: 'se'
  });
  addObject('south-measure-return-stall', 37, 71, {
    id: 'ash-road-south-receiving-register', blocking: true, orient: 'sw', variant: 'returns'
  });
  addObject('south-measure-repair-rack', 40, 75, {
    id: 'ash-road-south-receiving-service-rack', blocking: true, orient: 'sw'
  });

  for (const [x, y, orient] of [
    [14, 65, 'se'], [16, 65, 'se'], [18, 65, 'se'], [20, 65, 'se'], [22, 65, 'se'],
    [24, 65, 'se'], [26, 65, 'se'], [28, 65, 'se'], [30, 65, 'se'], [32, 65, 'se'],
    [14, 78, 'se'], [16, 78, 'se'], [18, 78, 'se'], [20, 78, 'se'], [22, 78, 'se'], [24, 78, 'se'],
    [26, 78, 'se'], [28, 78, 'se'], [30, 78, 'se'], [32, 78, 'se'], [34, 78, 'se'], [36, 78, 'se'],
    [38, 78, 'se'], [40, 78, 'se'], [42, 78, 'se'], [44, 78, 'se'],
    [14, 67, 'sw'], [14, 69, 'sw'], [14, 71, 'sw'], [14, 73, 'sw'], [14, 75, 'sw'], [14, 77, 'sw']
  ]) {
    addObject('measure-boundary-fence', x, y, {
      blocking: true, orient, seed: hash(x, y, 823 + x + y)
    });
  }
  for (const [x, y, orient] of [
    [46, 68, 'se'], [48, 68, 'se'], [50, 68, 'se'], [52, 68, 'se'], [54, 68, 'se'], [56, 68, 'se'], [58, 68, 'se'],
    [46, 77, 'se'], [48, 77, 'se'], [50, 77, 'se'], [52, 77, 'se'], [54, 77, 'se'], [56, 77, 'se'], [58, 77, 'se']
  ]) {
    addObject('south-measure-queue-rail', x, y, {
      blocking: true, orient, seed: hash(x, y, 827 + x + y)
    });
  }

  // The receiving pump, public taps and wash wall begin inside the shelter
  // court. Their blue fittings remain visible beside the hearths and pallets
  // before the service line continues east toward the South Chain.
  addObject('wash-wall', 33, 75, {
    id: 'ash-road-south-receiving-wash-wall', blocking: true, orient: 'sw'
  });
  addObject('south-measure-hand-pump', 35, 73, {
    id: 'ash-road-south-receiving-pump', blocking: true
  });
  addObject('public-tap-stand', 39, 71, {
    id: 'ash-road-south-arrival-water-point', blocking: true, orient: 'se'
  });
  for (const [x, y, orient, variant, salt] of [
    [34, 76, 'sw', 'clinic', 839], [40, 73, 'se', 'household', 853], [44, 75, 'sw', 'freight', 857]
  ]) {
    addObject('south-measure-water-vessels', x, y, {
      id: x === 51 ? 'ash-road-south-arrival-water-vessels' : `ash-road-south-receiving-vessels-${x}-${y}`,
      blocking: true,
      orient,
      variant,
      seed: hash(x, y, salt)
    });
  }

  // Charity Cot is a single enclosed institution. Two unequal treatment
  // stations and the bonded service counter form its north frontage; the cots
  // share one south ward behind a clear west gate and central access aisle.
  for (const [x, y, orient, salt] of [[91, 67, 'se', 863], [96, 68, 'sw', 877]]) {
    addObject('south-measure-charity-canopy', x, y, {
      blocking: true, orient, seed: hash(x, y, salt)
    });
  }
  addObject('south-measure-return-stall', 102, 67, {
    id: 'ash-road-south-charity-service-counter', blocking: true, orient: 'sw', variant: 'bonded'
  });
  for (const [x, y, orient, salt] of [
    [88, 74, 'se', 881], [91, 76, 'nw', 883], [94, 75, 'sw', 887],
    [100, 74, 'ne', 907], [103, 76, 'se', 911], [106, 75, 'sw', 919]
  ]) {
    addObject('charity-cot', x, y, {
      blocking: true, orient, seed: hash(x, y, salt)
    });
  }
  for (const [x, y, orient, variant] of [
    [87, 75, 'sw', 'clinic'], [93, 77, 'se', 'domestic'],
    [101, 75, 'sw', 'isolation'], [105, 73, 'se', 'clinic']
  ]) {
    addObject('cloth-partition', x, y, { blocking: true, orient, variant });
  }
  addObject('wash-wall', 106, 70, {
    id: 'ash-road-south-charity-water', blocking: true, orient: 'sw'
  });
  addObject('south-measure-hand-pump', 108, 72, {
    id: 'ash-road-south-charity-pump', blocking: true
  });
  addObject('south-measure-water-vessels', 107, 77, {
    id: 'ash-road-south-charity-clean-vessels', blocking: true, orient: 'sw', variant: 'clinic'
  });
  addObject('south-measure-repair-rack', 103, 78, {
    id: 'ash-road-south-charity-linen-rack', blocking: true, orient: 'se'
  });
  addObject('south-measure-notice-board', 86, 71, {
    id: 'ash-road-south-charity-board',
    blocking: true,
    orient: 'se',
    variant: 'census',
    name: 'Charity Cot',
    mapMarker: { label: 'Charity Cot', kind: 'note', reveal: 'always' }
  });
  for (const [x, y, orient] of [
    [84, 67, 'sw'], [84, 69, 'sw'], [84, 75, 'sw'], [84, 77, 'sw'],
    [84, 78, 'se'], [86, 78, 'se'], [88, 78, 'se'], [90, 78, 'se'], [92, 78, 'se'], [94, 78, 'se'],
    [96, 78, 'se'], [98, 78, 'se'], [100, 78, 'se'], [104, 78, 'se'], [106, 78, 'se'], [108, 78, 'se'],
    [109, 65, 'sw'], [109, 67, 'sw'], [109, 69, 'sw'], [109, 71, 'sw'], [109, 73, 'sw'], [109, 75, 'sw'], [109, 77, 'sw']
  ]) {
    addObject('measure-boundary-fence', x, y, {
      blocking: true, orient, seed: hash(x, y, 923 + x + y)
    });
  }
  for (const [x, y, orient] of [
    [84, 65, 'se'], [86, 65, 'se'], [88, 65, 'se'], [90, 65, 'se'], [92, 65, 'se'], [94, 65, 'se'],
    [96, 65, 'se'], [98, 65, 'se'], [100, 65, 'se'], [102, 65, 'se'], [104, 65, 'se'], [106, 65, 'se'], [108, 65, 'se']
  ]) {
    addObject('south-measure-queue-rail', x, y, {
      blocking: true, orient, seed: hash(x, y, 929 + x + y)
    });
  }
  for (const [x, y] of [[113, 69], [116, 70], [124, 70], [127, 74], [115, 78], [124, 78]]) {
    if (!reservedHelperCells.has(key(x, y))) addObject('south-measure-berm-block', x, y, { blocking: true });
  }
}

function addHelperEntrance({
  id,
  name,
  kind,
  x,
  y,
  approach,
  dialogue,
  mapLabel,
  mapReveal = 'always',
  blocking = true,
  ...art
}) {
  addObject(kind, x, y, {
    id,
    name,
    blocking,
    ...art,
    interact: {
      type: 'secret-entrance',
      dialogue
    },
    interactionMarker: approach,
    mapMarker: { label: mapLabel, kind: 'exit', reveal: mapReveal }
  });
}

function placeHelperEntrances() {
  addHelperEntrance({
    id: 'ash-road-south-civil-stair',
    name: 'Civil Stair',
    kind: 'service-hatch',
    x: 64,
    y: 36,
    approach: { x: 64, y: 37 },
    dialogue: 'south-measure-civil-stair-surface',
    mapLabel: 'Intake Undercroft',
    orient: 'se',
    variant: 'ladder',
    opened: true
  });
  addHelperEntrance({
    id: 'ash-road-south-collapsed-culvert',
    name: 'Collapsed Culvert',
    kind: 'collapsed-culvert',
    x: 120,
    y: 73,
    approach: { x: 119, y: 73 },
    dialogue: 'south-measure-collapsed-culvert-surface',
    mapLabel: 'Relief Drain'
  });
  addHelperEntrance({
    id: 'ash-road-south-repair-trench',
    name: 'Morrow Repair Trench',
    kind: 'service-hatch',
    x: 31,
    y: 54,
    approach: { x: 31, y: 55 },
    dialogue: 'south-measure-repair-trench-surface',
    mapLabel: 'Repair Trench',
    orient: 'sw',
    variant: 'ladder',
    opened: true
  });
  addHelperEntrance({
    id: 'ash-road-south-annex-service-hatch',
    name: 'Annex Service Hatch',
    kind: 'service-hatch',
    x: 20,
    y: 24,
    approach: { x: 20, y: 25 },
    dialogue: 'south-measure-annex-service-hatch-surface',
    mapLabel: 'Annex Service Hatch',
    orient: 'sw',
    variant: 'hatch',
    opened: true
  });
  addHelperEntrance({
    id: 'ash-road-south-annex-main-door',
    name: 'Annex Loading Door',
    kind: 'south-measure-door',
    x: 18,
    y: 26,
    approach: { x: 18, y: 27 },
    dialogue: 'south-measure-annex-main-door-surface',
    mapLabel: 'Maintenance Annex',
    wallPlane: 'sw',
    variant: 'service'
  });
  addHelperEntrance({
    id: 'ash-road-south-freight-main-door',
    name: 'Freight House Main Door',
    kind: 'south-measure-door',
    x: 31,
    y: 48,
    approach: { x: 30, y: 48 },
    dialogue: 'south-measure-freight-main-door-surface',
    mapLabel: 'Freight House',
    wallPlane: 'se',
    variant: 'freight'
  });
  addHelperEntrance({
    id: 'ash-road-south-freight-rear-door',
    name: 'Freight Service Door',
    kind: 'south-measure-door',
    x: 37,
    y: 49,
    approach: { x: 37, y: 50 },
    dialogue: 'south-measure-freight-rear-door-surface',
    mapLabel: 'Freight Service Door',
    wallPlane: 'sw',
    variant: 'freight'
  });
  addHelperEntrance({
    id: 'ash-road-south-clinic-main-door',
    name: 'Clinic Intake Door',
    kind: 'south-measure-door',
    x: 98,
    y: 33,
    approach: { x: 98, y: 34 },
    dialogue: 'south-measure-clinic-main-door-surface',
    mapLabel: 'Compact Clinic',
    wallPlane: 'sw',
    variant: 'clinic'
  });
  addHelperEntrance({
    id: 'ash-road-south-hall-main-door',
    name: 'Measure Hall Door',
    kind: 'south-measure-door',
    x: 94,
    y: 51,
    approach: { x: 94, y: 52 },
    dialogue: 'south-measure-hall-main-door-surface',
    mapLabel: 'Measure Hall',
    wallPlane: 'sw',
    variant: 'domestic'
  });
  addHelperEntrance({
    id: 'ash-road-south-varo-door',
    name: 'Faber House Door',
    kind: 'south-measure-door',
    x: 114,
    y: 48,
    approach: { x: 113, y: 48 },
    dialogue: 'south-measure-varo-door-surface',
    mapLabel: 'Faber House',
    wallPlane: 'se',
    variant: 'domestic'
  });
  addHelperEntrance({
    id: 'ash-road-south-hidden-rows-drying-frame',
    name: 'Movable Drying Frame',
    kind: 'south-measure-door',
    x: 124,
    y: 58,
    approach: { x: 125, y: 58 },
    dialogue: 'south-measure-hidden-rows-drying-frame-surface',
    mapLabel: 'Drying Frame',
    mapReveal: 'explored',
    wallPlane: 'se',
    variant: 'domestic'
  });
  addHelperEntrance({
    id: 'ash-road-south-hidden-rows-grave-passage',
    name: 'Grave Passage',
    kind: 'service-hatch',
    x: 112,
    y: 16,
    approach: { x: 112, y: 16 },
    dialogue: 'south-measure-hidden-rows-grave-passage-surface',
    mapLabel: 'Grave Passage',
    mapReveal: 'explored',
    blocking: false,
    orient: 'sw',
    variant: 'hatch',
    opened: true
  });
  addHelperEntrance({
    id: 'ash-road-south-charity-trapdoor',
    name: 'Charity Cot Trapdoor',
    kind: 'service-hatch',
    x: 96,
    y: 72,
    approach: { x: 96, y: 72 },
    dialogue: 'south-measure-charity-trapdoor-surface',
    mapLabel: 'Charity Cellar',
    mapReveal: 'explored',
    blocking: false,
    orient: 'se',
    variant: 'ladder',
    opened: true
  });
}

function placePerimeterAndVegetation() {
  // A broken boundary fence frames the town but leaves both side loops legible.
  for (let x = 4; x <= 125; x += 3) {
    if (x >= 58 && x <= 72) continue;
    if (canPlace(x, 3) && hash(x, 3, 71) % 5 !== 0) addObject('measure-boundary-fence', x, 3, { blocking: true, orient: 'se' });
    if (canPlace(x, 78) && hash(x, 78, 73) % 4 !== 0 && !(x >= 58 && x <= 72)) {
      addObject('measure-boundary-fence', x, 78, { blocking: true, orient: 'se' });
    }
  }
  for (const x of [3, 7, 12, 44, 80, 127]) {
    for (let y = 8; y < 72; y += 7) {
      if (!canPlace(x, y) || hash(x, y, 79) % 3 === 0) continue;
      addObject('measure-boundary-fence', x, y, { blocking: true, orient: 'sw' });
    }
  }

  for (let y = 2; y < HEIGHT - 1; y += 1) {
    for (let x = 2; x < WIDTH - 1; x += 1) {
      if (!WALKABLE_TILES.has(getTile(x, y)) || occupied.has(key(x, y)) || reservedHelperCells.has(key(x, y))) continue;
      const h = hash(x, y, 83);
      const edge = x < 6 || x > 125 || y < 4;
      if (edge && h % 100 < 14) placeIfOpen('south-measure-drain-reeds', x, y, { blocking: true });
    }
  }
}

function placeSurfaceDressing() {
  // Wear is authored around actual work instead of sprayed uniformly across
  // town. The local floor families already carry their own material
  // grain, seams and repair history.
  for (const [x, y, kind] of [
    [49, 63, 'south-measure-water-lesson'],
    [103, 64, 'south-measure-water-lesson']
  ]) addObject(kind, x, y);
}

function placeLivedInCompositions() {
  const compositions = [
    {
      id: 'arrival-registry',
      entries: [
        ['south-measure-tally-scraps', 38, 69, { blocking: false }],
        ['south-measure-work-grit', 40, 70, { blocking: false }],
        ['south-measure-water-vessels', 43, 70, { blocking: true, orient: 'sw', variant: 'household' }],
        ['south-measure-sleeping-pallet', 34, 70, { blocking: true, orient: 'se' }],
        ['south-measure-queue-rail', 35, 68, { blocking: true, orient: 'sw' }],
        ['south-measure-repair-rack', 43, 68, { blocking: true, orient: 'se' }]
      ]
    },
    {
      id: 'water-court-issue',
      entries: [
        ['south-measure-tally-scraps', 64, 53, { blocking: false }],
        ['south-measure-service-stain', 68, 54, { blocking: false, variant: 'mineral' }],
        ['south-measure-work-grit', 70, 55, { blocking: false }],
        ['south-measure-water-vessels', 70, 52, { blocking: true, orient: 'se', variant: 'household' }],
        ['south-measure-queue-rail', 72, 53, { blocking: true, orient: 'sw' }],
        ['south-measure-notice-board', 72, 55, { blocking: true, orient: 'se', variant: 'water' }]
      ]
    },
    {
      id: 'freight-loading-bay',
      entries: [
        ['south-measure-service-stain', 25, 52, { blocking: false, variant: 'oil' }],
        ['south-measure-work-grit', 28, 55, { blocking: false }],
        ['south-measure-tally-scraps', 22, 56, { blocking: false }],
        ['south-measure-return-stall', 24, 53, { blocking: true, orient: 'se', variant: 'bonded' }],
        ['grain-cage', 29, 53, { blocking: true, orient: 'sw', variant: 'bonded' }],
        ['south-measure-water-vessels', 20, 55, { blocking: true, orient: 'se', variant: 'freight' }]
      ]
    },
    {
      id: 'old-gate-weighing',
      entries: [
        ['south-measure-tally-scraps', 75, 31, { blocking: false }],
        ['south-measure-work-grit', 77, 33, { blocking: false }],
        ['south-measure-queue-rail', 72, 31, { blocking: true, orient: 'se' }],
        ['south-measure-queue-rail', 79, 33, { blocking: true, orient: 'sw' }],
        ['south-measure-water-vessels', 80, 34, { blocking: true, orient: 'sw', variant: 'freight' }],
        ['south-measure-repair-rack', 74, 34, { blocking: true, orient: 'se' }]
      ]
    },
    {
      id: 'compact-screening',
      entries: [
        ['south-measure-tally-scraps', 118, 28, { blocking: false }],
        ['south-measure-service-stain', 116, 31, { blocking: false, variant: 'lye' }],
        ['south-measure-work-grit', 120, 33, { blocking: false }],
        ['south-measure-notice-board', 116, 27, { blocking: true, orient: 'sw', variant: 'clinic' }],
        ['charity-cot', 116, 32, { blocking: true, orient: 'se' }],
        ['south-measure-water-vessels', 121, 33, { blocking: true, orient: 'sw', variant: 'clinic' }]
      ]
    },
    {
      id: 'charity-linen-court',
      entries: [
        ['south-measure-tally-scraps', 101, 72, { blocking: false }],
        ['south-measure-work-grit', 99, 73, { blocking: false }],
        ['south-measure-service-stain', 104, 71, { blocking: false, variant: 'lye' }],
        ['south-measure-water-vessels', 98, 71, { blocking: true, orient: 'se', variant: 'clinic' }],
        ['south-measure-repair-rack', 100, 69, { blocking: true, orient: 'sw' }],
        ['charity-cot', 98, 73, { blocking: true, orient: 'se' }]
      ]
    }
  ];

  for (const composition of compositions) {
    for (const [kind, x, y, extra] of composition.entries) {
      const placed = placeIfClear(kind, x, y, {
        id: `ash-road-south-${composition.id}-${kind}-${x}-${y}`,
        seed: hash(x, y, 181),
        ...extra
      });
      if (!placed) throw new Error(`Composition ${composition.id} cannot place ${kind} at ${x},${y}.`);
    }
  }
}

function placeTumbleweeds() {
  // These nonblocking anchors sit in long, open lanes. Each weed rests between
  // deterministic gust windows, then rolls to the other end of its short run.
  const anchors = [
    [18, 73, 1, 0.7],
    [49, 71, -1, 3.2],
    [77, 72, 1, 6.1],
    [112, 74, -1, 9.0],
    [126, 68, 1, 1.8],
    [124, 29, -1, 4.7],
    [119, 11, 1, 7.9],
    [88, 7, -1, 10.8],
    [42, 7, 1, 2.6],
    [10, 58, -1, 5.9]
  ];
  for (const [x, y, direction, phase] of anchors) {
    placeIfClear('south-measure-tumbleweed', x, y, {
      id: `ash-road-south-tumbleweed-${x}-${y}`,
      blocking: false,
      direction,
      phase,
      seed: hash(x, y, 139)
    });
  }
}

function placeRpgLootAndGrowth() {
  placeIfClear('south-measure-service-pack', 20, 60, {
    id: 'ash-road-south-drainage-pack',
    name: 'Drainage Pack',
    seed: hash(20, 60, 149),
    interact: {
      type: 'container',
      log: 'A patched field pack rests against the drainage wall. Its flap is tied with clean cord.',
      loot: [
        { item: 'field-dressing', count: 1 },
        { item: 'tinned-beans', count: 1 },
        { item: 'ducat', count: 2 }
      ]
    }
  });
  placeIfClear('south-measure-service-pack', 121, 64, {
    id: 'ash-road-south-buried-yard-pouch',
    name: 'Dust-Buried Service Pack',
    seed: hash(121, 64, 151),
    interact: {
      type: 'container',
      log: 'A waxed service pack lies half buried in grey dust. Its buckled flap has held.',
      loot: [
        { item: 'ducat', count: 4 },
        { item: 'relic-rounds', count: 1 }
      ]
    }
  });

  for (const [x, y] of [
    [52, 56], [56, 55], [62, 57], [68, 55], [73, 56], [77, 54],
    [110, 67], [113, 69], [116, 68], [118, 71], [121, 72], [123, 69]
  ]) {
    placeIfClear('south-measure-drain-reeds', x, y, {
      id: `ash-road-south-drain-reeds-${x}-${y}`,
      seed: hash(x, y, 153)
    });
  }

}

function insideBounds(x, y, bounds) {
  return x >= bounds.x0 && x <= bounds.x1 && y >= bounds.y0 && y <= bounds.y1;
}

function nearFutureHelperAnchor(x, y) {
  return ASH_ROAD_SOUTH_HELPER_ANCHORS.some((anchor) =>
    Math.abs(anchor.x - x) + Math.abs(anchor.y - y) <= 1
  );
}

function reservedSpineCell(x, y) {
  return x >= 61 && x <= 69 && y >= 2 && y <= 76;
}

const DISTRICT_ACTIVITY_PATHS = Object.freeze({
  'south-chain': [[58, 72], [65, 74], [73, 72]],
  'arrival-fringe': [[18, 70], [27, 70], [39, 72]],
  'charity-edge': [[88, 72], [97, 72], [105, 74]],
  'water-court': [[55, 54], [63, 58], [72, 55], [77, 59]],
  'morrow-yard': [[15, 50], [31, 54], [42, 49], [24, 46]],
  'old-measure-gates': [[56, 34], [65, 35], [75, 37]],
  'rope-rows': [[86, 45], [96, 54], [108, 55], [121, 54]],
  'compact-precinct': [[88, 27], [91, 30], [113, 29]],
  'relief-annex': [[20, 25], [31, 24], [39, 20]],
  'grave-strip': [[90, 14], [109, 15], [122, 14]],
  'north-verge': [[56, 8], [65, 6], [74, 8]]
});

const ACTIVITY_APPROACH_OFFSETS = Object.freeze([
  { x: 0, y: 1 },
  { x: 1, y: 0 },
  { x: 0, y: -1 },
  { x: -1, y: 0 },
  { x: 1, y: 1 },
  { x: 1, y: -1 },
  { x: -1, y: 1 },
  { x: -1, y: -1 }
]);

function facingToward(from, target) {
  const dx = target.x - from.x;
  const dy = target.y - from.y;
  if (Math.abs(dx) > Math.abs(dy) * 1.5) return dx >= 0 ? 'e' : 'w';
  if (Math.abs(dy) > Math.abs(dx) * 1.5) return dy >= 0 ? 's' : 'n';
  if (dx >= 0 && dy >= 0) return 'se';
  if (dx >= 0 && dy < 0) return 'ne';
  if (dx < 0 && dy >= 0) return 'sw';
  return 'nw';
}

function placePopulation() {
  const objectCells = new Set([
    ...objects.map((object) => key(object.x, object.y)),
    ...groundItems.map((item) => key(item.x, item.y))
  ]);
  const spawnCells = new Set([key(START.x, START.y)]);
  const objectById = new Map(objects.filter((object) => object.id).map((object) => [object.id, object]));

  function available(x, y, bounds, { allowSpine = false, allowSpawn = false } = {}) {
    return insideBounds(x, y, bounds)
      && WALKABLE_TILES.has(getTile(x, y))
      && !objectCells.has(key(x, y))
      && (allowSpawn || !spawnCells.has(key(x, y)))
      && !nearFutureHelperAnchor(x, y)
      && !reservedHelperCells.has(key(x, y))
      && (allowSpine || !reservedSpineCell(x, y));
  }

  function nearestAvailable(preferred, bounds, options = {}) {
    const maxRadius = Math.max(bounds.x1 - bounds.x0, bounds.y1 - bounds.y0);
    for (let radius = 0; radius <= maxRadius; radius += 1) {
      for (let dy = -radius; dy <= radius; dy += 1) {
        const dx = radius - Math.abs(dy);
        for (const x of dx === 0 ? [preferred.x] : [preferred.x - dx, preferred.x + dx]) {
          const y = preferred.y + dy;
          if (available(x, y, bounds, options)) return { x, y };
        }
      }
    }
    throw new Error(`No population cell near ${preferred.x},${preferred.y}`);
  }

  const placements = ASH_ROAD_SOUTH_CAST.map((person, index) => {
    const bounds = ASH_ROAD_SOUTH_DISTRICTS[person.district];
    const position = nearestAvailable(person.preferred, bounds);
    spawnCells.add(key(position.x, position.y));
    return { person, index, position, bounds };
  });

  function patrolPathFor(placement) {
    const { person, position, bounds, index } = placement;
    const localCells = new Set([key(position.x, position.y)]);
    const routine = ASH_ROAD_SOUTH_NPC_ROUTINES[person.id];
    if (routine?.length) {
      const path = [{ x: position.x, y: position.y }];
      for (const [step, activity] of routine.entries()) {
        const target = objectById.get(activity.target);
        if (!target) throw new Error(`Routine for ${person.id} references missing object ${activity.target}.`);
        if (!insideBounds(target.x, target.y, bounds)) {
          throw new Error(`Routine target ${activity.target} lies outside ${person.district}.`);
        }

        let point = null;
        const offsetStart = (index + step) % ACTIVITY_APPROACH_OFFSETS.length;
        for (let offsetIndex = 0; offsetIndex < ACTIVITY_APPROACH_OFFSETS.length; offsetIndex += 1) {
          const offset = ACTIVITY_APPROACH_OFFSETS[(offsetStart + offsetIndex) % ACTIVITY_APPROACH_OFFSETS.length];
          const candidate = { x: target.x + offset.x, y: target.y + offset.y };
          if (!localCells.has(key(candidate.x, candidate.y)) && available(candidate.x, candidate.y, bounds)) {
            point = candidate;
            break;
          }
        }
        if (!point) throw new Error(`Routine target ${activity.target} has no adjacent work cell.`);
        localCells.add(key(point.x, point.y));
        path.push({
          ...point,
          activity: { ...activity }
        });
      }
      return path;
    }

    const activityPath = DISTRICT_ACTIVITY_PATHS[person.district] ?? [];
    const path = [{ x: position.x, y: position.y }];
    for (let step = 0; step < Math.min(3, activityPath.length); step += 1) {
      const target = activityPath[(index + step) % activityPath.length];
      const point = nearestAvailable(
        { x: target[0], y: target[1] },
        bounds,
        { allowSpawn: false }
      );
      const pointKey = key(point.x, point.y);
      if (localCells.has(pointKey)) continue;
      localCells.add(pointKey);
      path.push(point);
    }
    if (path.length < 2) throw new Error(`Patrol for ${placement.person.name} has no usable waypoint.`);
    return path;
  }

  return placements.map((placement) => {
    const { person, index, position } = placement;
    const route = person.patrol ? patrolPathFor(placement) : null;
    const hasRoutine = Boolean(ASH_ROAD_SOUTH_NPC_ROUTINES[person.id]);
    const activity = DISTRICT_ACTIVITY_PATHS[person.district] ?? [];
    const focal = route?.[1]
      ?? (activity.length > 0
        ? { x: activity[index % activity.length][0], y: activity[index % activity.length][1] }
        : { x: position.x + 1, y: position.y + 1 });
    const spawn = {
      actor: person.id,
      x: position.x,
      y: position.y,
      facing: facingToward(position, focal),
      ambient: [...person.ambient]
    };
    if (person.dialogue) spawn.dialogue = person.dialogue;
    if (person.mapMarker) spawn.mapMarker = person.mapMarker;
    if (person.patrol) {
      spawn.patrol = {
        path: route,
        mode: 'loop',
        delay: hasRoutine ? { min: 2.4, max: 4.8 } : { min: 4, max: 9 }
      };
    }
    return spawn;
  });
}

function buildSurfaceTableaux(npcSpawns) {
  const objectById = new Map(objects.filter((object) => object.id).map((object) => [object.id, object]));
  const actorIds = new Set(npcSpawns.map((spawn) => spawn.actor));
  const unavailable = new Set([
    key(START.x, START.y),
    ...objects.map((object) => key(object.x, object.y)),
    ...groundItems.map((item) => key(item.x, item.y)),
    ...npcSpawns.map((spawn) => key(spawn.x, spawn.y))
  ]);
  const reservations = new Set();

  return ASH_ROAD_SOUTH_TABLEAUX.map((tableau) => ({
    id: tableau.id,
    center: { ...tableau.center },
    activationRadius: tableau.activationRadius,
    startDelay: tableau.startDelay,
    cooldown: { ...tableau.cooldown },
    participants: tableau.participants.map((participant) => {
      if (!actorIds.has(participant.actor)) {
        throw new Error(`Tableau ${tableau.id} references missing actor ${participant.actor}.`);
      }
      const target = objectById.get(participant.activity.target);
      if (!target) {
        throw new Error(`Tableau ${tableau.id} references missing object ${participant.activity.target}.`);
      }
      let slot = null;
      const offsetStart = participant.slotPreference % ACTIVITY_APPROACH_OFFSETS.length;
      for (let index = 0; index < ACTIVITY_APPROACH_OFFSETS.length; index += 1) {
        const offset = ACTIVITY_APPROACH_OFFSETS[(offsetStart + index) % ACTIVITY_APPROACH_OFFSETS.length];
        const candidate = { x: target.x + offset.x, y: target.y + offset.y };
        const candidateKey = key(candidate.x, candidate.y);
        if (!inBounds(candidate.x, candidate.y) || !WALKABLE_TILES.has(getTile(candidate.x, candidate.y))) continue;
        if (unavailable.has(candidateKey) || reservations.has(candidateKey) || reservedHelperCells.has(candidateKey)) continue;
        slot = candidate;
        break;
      }
      if (!slot) {
        throw new Error(`Tableau ${tableau.id} has no clear slot beside ${participant.activity.target}.`);
      }
      reservations.add(key(slot.x, slot.y));
      return {
        actor: participant.actor,
        slot,
        delay: participant.delay,
        activity: { ...participant.activity }
      };
    }),
    barks: tableau.barks.map((bark) => ({ ...bark }))
  }));
}

paintSettlementGround();
placeBuildings();
placeRoadBoundaries();
placeOldMeasureGates();
placeWaterCourt();
placeMorrowYard();
placeCompactPrecinct();
placeRopeRows();
placeGraveStrip();
placeArrivalAndCharityEdges();
placeHelperEntrances();
placePerimeterAndVegetation();
placeTumbleweeds();
placeSurfaceDressing();
placeOutcomeDressing();
placeRpgLootAndGrowth();
placeLivedInCompositions();
applyAshRoadSouthInspections(objects);

const npcSpawns = placePopulation();
const tableaux = buildSurfaceTableaux(npcSpawns);

objects.sort((a, b) => (a.y - b.y) || (a.x - b.x) || a.kind.localeCompare(b.kind));

const level = {
  id: 'ash-road-south',
  name: 'Ash Road South',
  intro: 'South Measure fills the old intake field. Its patched roofs crowd around the water works.',
  width: WIDTH,
  height: HEIGHT,
  tileSize: 64,
  quests: [...SOUTH_MEASURE_QUEST_IDS, 'carry-lucky-necklace'],
  dialogue: [
    'ash-road-south-censure-road-exit',
    'ash-road-south-north-departure',
    ...ASH_ROAD_SOUTH_DIALOGUE_IDS,
    ...HELPER_DIALOGUE_IDS
  ],
  tiles: tiles.map((row) => row.join('')),
  legend: {
    '.': { kind: 'floor', floor: 'south-measure-row', walkable: true },
    r: { kind: 'floor', floor: 'ash-road', walkable: true },
    s: { kind: 'floor', floor: 'road-shoulder', walkable: true },
    g: { kind: 'floor', floor: 'south-measure-slab', walkable: true },
    m: { kind: 'floor', floor: 'south-measure-yard', walkable: true },
    e: { kind: 'floor', floor: 'south-measure-grave-strip', walkable: true },
    p: { kind: 'floor', floor: 'south-measure-row', walkable: true },
    c: { kind: 'floor', floor: 'south-measure-slab', walkable: true },
    y: { kind: 'floor', floor: 'south-measure-yard', walkable: true },
    h: { kind: 'floor', floor: 'south-measure-row', walkable: true },
    x: { kind: 'floor', floor: 'relief-channel-x', walkable: true },
    z: { kind: 'floor', floor: 'relief-channel-y', walkable: true },
    j: { kind: 'floor', floor: 'relief-channel-junction', walkable: true },
    b: { kind: 'south-measure-berm-block', walkable: false },
    R: { kind: 'south-measure-rowhouse-building-block', variant: 'rowhouse-tar', walkable: false },
    T: { kind: 'south-measure-rowhouse-building-block', variant: 'rowhouse-timber', walkable: false },
    U: { kind: 'south-measure-rowhouse-building-block', variant: 'rowhouse-sheet', walkable: false },
    V: { kind: 'south-measure-rowhouse-building-block', variant: 'rowhouse-lime', walkable: false },
    A: { kind: 'relief-annex-building-block', walkable: false },
    C: { kind: 'compact-clinic-building-block', walkable: false },
    F: { kind: 'morrow-freight-house-building-block', walkable: false },
    H: { kind: 'measure-hall-building-block', walkable: false },
    B: { kind: 'admission-booth-building-block', walkable: false },
    S: { kind: 'south-measure-burial-shed-building-block', walkable: false }
  },
  mood: {
    floorShade: '#15130e',
    floorShadeAlpha: 0.06,
    ambient: '#b8aa83',
    ambientAlpha: 0.075,
    vignette: 0.29,
    sun: {
      enabled: true,
      shadowOffsetX: 12,
      shadowOffsetY: 6,
      shadowAlpha: 0.14
    }
  },
  soundscape: ASH_ROAD_SOUTH_SOUNDSCAPE,
  spawns: {
    player: { actor: 'mara-vey', x: START.x, y: START.y },
    enemies: [],
    npcs: npcSpawns
  },
  tableaux,
  groundItems,
  objects
};

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(level, null, 2)}\n`, 'utf8');
console.log(`Generated ${outputPath}`);
