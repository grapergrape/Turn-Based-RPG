import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import { PALETTE } from '../src/render/palette.js';
import { TILE_HEIGHT, TILE_WIDTH, WALL_HEIGHT } from '../src/render/renderConfig.js';
import {
  drawSouthMeasureInteriorWallBlock,
  southMeasureInteriorWallCapCourses,
  southMeasureInteriorWallGeometry,
  southMeasureInteriorWallPerimeterEdges,
  southMeasureRunConnections,
  southMeasureRunGeometry
} from '../src/render/primitives/southMeasureInteriors.js';
import {
  FLOOR_STYLE_IDS,
  drawStyledFloorCell,
  reliefChannelGeometry
} from '../src/render/primitives/terrain.js';
import {
  CATEGORY,
  SPRITE_CATALOG,
  displayNameForKind
} from '../src/render/spriteCatalog.js';

function createRecordingContext() {
  const ops = [];
  const stack = [];
  let fillStyle = null;
  let strokeStyle = null;
  let globalAlpha = 1;
  let lineWidth = 1;
  let path = [];

  return {
    ops,
    get fillStyle() { return fillStyle; },
    set fillStyle(value) { fillStyle = value; },
    get strokeStyle() { return strokeStyle; },
    set strokeStyle(value) { strokeStyle = value; },
    get globalAlpha() { return globalAlpha; },
    set globalAlpha(value) { globalAlpha = value; },
    get lineWidth() { return lineWidth; },
    set lineWidth(value) { lineWidth = value; },
    save() {
      stack.push({ fillStyle, strokeStyle, globalAlpha, lineWidth });
    },
    restore() {
      const state = stack.pop();
      if (!state) return;
      ({ fillStyle, strokeStyle, globalAlpha, lineWidth } = state);
    },
    beginPath() { path = []; },
    moveTo(x, y) { path.push(['M', x, y]); },
    lineTo(x, y) { path.push(['L', x, y]); },
    closePath() { path.push(['Z']); },
    fill() { ops.push({ type: 'fill', style: fillStyle, alpha: globalAlpha, path: structuredClone(path) }); },
    stroke() { ops.push({ type: 'stroke', style: strokeStyle, alpha: globalAlpha, width: lineWidth, path: structuredClone(path) }); },
    fillRect(x, y, w, h) { ops.push({ type: 'rect', style: fillStyle, alpha: globalAlpha, x, y, w, h }); },
    createLinearGradient() { throw new Error('smooth gradients are forbidden'); },
    createRadialGradient() { throw new Error('smooth gradients are forbidden'); }
  };
}

function contextForProp(overrides = {}) {
  return {
    prop: {
      x: 4,
      y: 5,
      orient: 'se',
      variant: undefined,
      wallPlane: undefined,
      wallSide: 'near',
      connected: { xMinus: false, xPlus: false, yMinus: false, yPlus: false },
      ...overrides
    },
    anim: { tick: 0 },
    pulse: 0,
    flicker: 0,
    player: null
  };
}

function renderKind(kind, overrides = {}, seed = 37) {
  const ctx = createRecordingContext();
  SPRITE_CATALOG[kind].draw(ctx, 300, 260, seed, contextForProp(overrides));
  return ctx.ops;
}

function assertCatalogContact(kind) {
  const contact = SPRITE_CATALOG[kind]?.shadow?.contact;
  assert.ok(contact, `${kind} must declare a shape-aware contact profile`);
  assert.notEqual(contact.mode, 'none', `${kind} must derive a grounded contact mask`);
  assert.ok(contact.spread <= 1, `${kind} contact expansion must stay within one native pixel`);
}

function signature(ops) {
  return JSON.stringify(ops);
}

function assertPaletteOnly(ops, label) {
  const palette = new Set(Object.values(PALETTE));
  const colors = new Set(ops.map((op) => op.style).filter(Boolean));
  for (const color of colors) assert.ok(palette.has(color), `${label} used non-palette color ${color}`);
}

function countStyle(ops, color) {
  return ops.filter((op) => op.style === color).length;
}

function renderBounds(ops) {
  const xs = [];
  const ys = [];
  for (const op of ops) {
    if (op.type === 'rect') {
      xs.push(op.x, op.x + op.w);
      ys.push(op.y, op.y + op.h);
    }
    for (const point of op.path ?? []) {
      if (point[0] !== 'M' && point[0] !== 'L') continue;
      xs.push(point[1]);
      ys.push(point[2]);
    }
  }
  return {
    width: Math.max(...xs) - Math.min(...xs),
    height: Math.max(...ys) - Math.min(...ys)
  };
}

function maxFilledPathHeight(ops) {
  let maxHeight = 0;
  for (const op of ops) {
    if (op.type !== 'fill') continue;
    const ys = (op.path ?? [])
      .filter((point) => point[0] === 'M' || point[0] === 'L')
      .map((point) => point[2]);
    if (ys.length > 0) maxHeight = Math.max(maxHeight, Math.max(...ys) - Math.min(...ys));
  }
  return maxHeight;
}

const wallKinds = [
  'south-measure-intake-wall',
  'south-measure-service-wall',
  'south-measure-freight-wall',
  'south-measure-domestic-wall'
];
const propKinds = [
  'south-measure-door',
  'service-hatch',
  'service-pipe-run',
  'utility-railing',
  'south-measure-wall-board',
  'south-measure-worktable',
  'south-measure-storage',
  'south-measure-custody-rest',
  'intake-screening-frame',
  'fixed-hoist',
  'mesh-cage-panel',
  'relief-machine',
  'intake-pump-assembly',
  'freight-scale',
  'clinic-bed',
  'cloth-partition',
  'intake-clerk-wicket'
];

for (const kind of [...wallKinds, ...propKinds]) {
  assert.ok(SPRITE_CATALOG[kind], `${kind} must be registered`);
  assert.equal(typeof SPRITE_CATALOG[kind].draw, 'function', `${kind} must have a draw function`);
  assert.notEqual(displayNameForKind(kind), kind.replaceAll('-', ' '), `${kind} must have an authored display name`);
}
for (const kind of wallKinds) {
  assert.equal(SPRITE_CATALOG[kind].category, CATEGORY.TERRAIN, `${kind} must be terrain`);
  assert.equal(SPRITE_CATALOG[kind].layer, 0, `${kind} must draw in the wall band`);
  assert.equal(SPRITE_CATALOG[kind].block, true, `${kind} must be a wall-grid block`);
  assert.equal(SPRITE_CATALOG[kind].cover, 'hard', `${kind} must provide hard cover`);
}
assert.equal(
  new Set(wallKinds.map((kind) => signature(renderKind(kind)))).size,
  wallKinds.length,
  'the four wall families must render as distinct material systems'
);
assert.equal(SPRITE_CATALOG['south-measure-door'].category, CATEGORY.FIXTURE);
assert.equal(SPRITE_CATALOG['south-measure-door'].block, undefined, 'door is an overlay and must leave its authored tile wall in place');
assert.equal(SPRITE_CATALOG['south-measure-wall-board'].layer, 0);
assert.equal(SPRITE_CATALOG['service-hatch'].layer, 1);
assert.equal(SPRITE_CATALOG['relief-machine'].layer, 4);
assert.equal(SPRITE_CATALOG['intake-pump-assembly'].layer, 4);
assert.equal(SPRITE_CATALOG['intake-clerk-wicket'].category, CATEGORY.CREATURE);

const wall = southMeasureInteriorWallGeometry(0, 0);
const wallX = southMeasureInteriorWallGeometry(TILE_WIDTH / 2, TILE_HEIGHT / 2);
const wallY = southMeasureInteriorWallGeometry(-TILE_WIDTH / 2, TILE_HEIGHT / 2);
assert.equal(wall.height, WALL_HEIGHT);
assert.deepEqual(wall.cap.right, wallX.cap.top, 'x-adjacent wall caps share their upper endpoint');
assert.deepEqual(wall.cap.bottom, wallX.cap.left, 'x-adjacent wall caps share their lower endpoint');
assert.deepEqual(wall.cap.left, wallY.cap.top, 'y-adjacent wall caps share their upper endpoint');
assert.deepEqual(wall.cap.bottom, wallY.cap.right, 'y-adjacent wall caps share their lower endpoint');
for (let index = 0; index < southMeasureInteriorWallCapCourses(wall.cap).length; index += 1) {
  assert.deepEqual(
    southMeasureInteriorWallCapCourses(wall.cap)[index].end,
    southMeasureInteriorWallCapCourses(wallX.cap)[index].start,
    `wall cap course ${index} continues across the x-axis join`
  );
}
assert.deepEqual(
  southMeasureInteriorWallPerimeterEdges(wall.cap, { xMinus: true, xPlus: true, yMinus: true, yPlus: true }),
  [],
  'an interior wall cell draws no shared cap perimeter'
);
assert.deepEqual(
  southMeasureInteriorWallPerimeterEdges(wall.cap, { xPlus: true }).map((edge) => edge.side),
  ['xMinus', 'yMinus', 'yPlus'],
  'an x-plus neighbor suppresses only the bottom-right cap edge'
);

const seRun = southMeasureRunGeometry(0, 0, 'se');
const seNeighbor = southMeasureRunGeometry(TILE_WIDTH / 2, TILE_HEIGHT / 2, 'se');
assert.deepEqual(seRun.end, seNeighbor.start, 'SE runs meet exactly across x-adjacent cells');
const swRun = southMeasureRunGeometry(0, 0, 'sw');
const swNeighbor = southMeasureRunGeometry(-TILE_WIDTH / 2, TILE_HEIGHT / 2, 'sw');
assert.deepEqual(swRun.end, swNeighbor.start, 'SW runs meet exactly across y-adjacent cells');
const nwRun = southMeasureRunGeometry(0, 0, 'nw');
const nwNeighbor = southMeasureRunGeometry(-TILE_WIDTH / 2, -TILE_HEIGHT / 2, 'nw');
assert.deepEqual(nwRun.end, nwNeighbor.start, 'NW runs meet exactly across reverse x-adjacent cells');
const neRun = southMeasureRunGeometry(0, 0, 'ne');
const neNeighbor = southMeasureRunGeometry(TILE_WIDTH / 2, -TILE_HEIGHT / 2, 'ne');
assert.deepEqual(neRun.end, neNeighbor.start, 'NE runs meet exactly across reverse y-adjacent cells');
assert.deepEqual(southMeasureRunConnections('se', { xMinus: true, xPlus: false }), {
  startKey: 'xMinus', endKey: 'xPlus', start: true, end: false
});
assert.deepEqual(southMeasureRunConnections('sw', { yMinus: false, yPlus: true }), {
  startKey: 'yMinus', endKey: 'yPlus', start: false, end: true
});
assert.deepEqual(southMeasureRunConnections('nw', { xMinus: true, xPlus: false }), {
  startKey: 'xPlus', endKey: 'xMinus', start: false, end: true
});
assert.deepEqual(southMeasureRunConnections('ne', { yMinus: true, yPlus: false }), {
  startKey: 'yPlus', endKey: 'yMinus', start: false, end: true
});

for (const [axis, dx, dy] of [['x', TILE_WIDTH / 2, TILE_HEIGHT / 2], ['y', -TILE_WIDTH / 2, TILE_HEIGHT / 2]]) {
  const center = reliefChannelGeometry(0, 0, axis);
  const neighbor = reliefChannelGeometry(dx, dy, axis);
  for (let index = 0; index < center.flowLines.length; index += 1) {
    assert.deepEqual(center.flowLines[index].end, neighbor.flowLines[index].start, `${axis} channel flow line ${index} crosses the tile seam exactly`);
  }
  for (let index = 0; index < center.banks.length; index += 1) {
    assert.deepEqual(center.banks[index].end, neighbor.banks[index].start, `${axis} channel bank ${index} crosses the tile seam exactly`);
  }
}
assert.ok(FLOOR_STYLE_IDS.includes('relief-channel-x'));
assert.ok(FLOOR_STYLE_IDS.includes('relief-channel-y'));
assert.ok(FLOOR_STYLE_IDS.includes('relief-channel-junction'));

const variants = {
  'south-measure-door': ['civil', 'clinic'],
  'service-hatch': ['hatch', 'grate'],
  'service-pipe-run': ['straight', 'valve'],
  'utility-railing': ['service', 'civic'],
  'south-measure-wall-board': ['schedule-bank', 'crawl-marks'],
  'intake-screening-frame': ['intact', 'broken-baskets'],
  'south-measure-worktable': ['family-meal', 'meeting'],
  'south-measure-storage': ['work-shelf', 'burial-copies'],
  'mesh-cage-panel': ['parts', 'bonded'],
  'relief-machine': ['generator', 'press'],
  'intake-pump-assembly': ['coupled', 'failed'],
  'freight-scale': ['cargo', 'claim'],
  'clinic-bed': ['clean', 'isolation'],
  'cloth-partition': ['clinic', 'domestic'],
  'intake-clerk-wicket': ['dormant', 'opened']
};
for (const [kind, [variantA, variantB]] of Object.entries(variants)) {
  const extra = kind.includes('door') || kind.includes('board') || kind.includes('wicket') ? { wallPlane: 'sw' } : {};
  const a = renderKind(kind, { ...extra, variant: variantA });
  const b = renderKind(kind, { ...extra, variant: variantB });
  assert.notEqual(signature(a), signature(b), `${kind} must forward and render variant ${variantA}/${variantB}`);
  assertPaletteOnly(a, `${kind}:${variantA}`);
  assertPaletteOnly(b, `${kind}:${variantB}`);
}

const completeVariantMatrix = {
  'south-measure-door': ['civil', 'service', 'freight', 'domestic', 'clinic'],
  'service-hatch': ['hatch', 'grate', 'ladder'],
  'service-pipe-run': ['straight', 'elbow', 'valve'],
  'utility-railing': ['service', 'intake', 'civic', 'broken'],
  'south-measure-wall-board': ['diagram', 'schedules', 'route', 'blood-card', 'memorial', 'slate', 'prayer-card', 'prayer-cards', 'private-list', 'handprints', 'schedule-bank', 'crawl-marks'],
  'intake-screening-frame': ['intact', 'broken-baskets'],
  'south-measure-worktable': ['records', 'clinic', 'cup-repair', 'burned-label', 'council', 'route', 'meeting', 'school', 'family-meal', 'evidence-bench'],
  'south-measure-storage': ['archive-shelf', 'lime-records-chest', 'medicine-shelf', 'locked-cabinet', 'current-records', 'work-shelf', 'school-tools', 'burial-copies', 'suspect-shelf', 'clean-shelf'],
  'mesh-cage-panel': ['parts', 'ledger', 'bonded'],
  'relief-machine': ['generator', 'cooling-jacket', 'lathe', 'press', 'pump-jig', 'cold-coil'],
  'intake-pump-assembly': ['coupled', 'bypassed', 'failed'],
  'freight-scale': ['cargo', 'claim'],
  'clinic-bed': ['clean', 'used', 'isolation'],
  'cloth-partition': ['clinic', 'domestic', 'isolation'],
  'intake-clerk-wicket': ['dormant', 'stirring', 'opened']
};
for (const [kind, supportedVariants] of Object.entries(completeVariantMatrix)) {
  const signatures = new Set();
  for (const variant of supportedVariants) {
    const wallPlane = kind === 'south-measure-door' || kind === 'south-measure-wall-board' || kind === 'intake-clerk-wicket'
      ? 'sw'
      : undefined;
    const ops = renderKind(kind, { variant, wallPlane });
    assertPaletteOnly(ops, `${kind}:${variant}`);
    signatures.add(signature(ops));
  }
  assert.equal(signatures.size, supportedVariants.length, `${kind} must give every supported variant a distinct render`);
}

const pumpDiagram = renderKind('south-measure-wall-board', { wallPlane: 'sw', variant: 'diagram' });
assert.ok(countStyle(pumpDiagram, PALETTE.clothBlue) >= 10, 'diagram must show a substantial blue inlet and outlet pipe run');
assert.ok(countStyle(pumpDiagram, PALETTE.rustLight) >= 8, 'diagram must show a highlighted metal pump rotor and base');
assert.ok(countStyle(pumpDiagram, PALETTE.stoneMid) >= 1, 'diagram must show a solid pump housing');

const privateList = renderKind('south-measure-wall-board', { wallPlane: 'sw', variant: 'private-list' });
const prayerCard = renderKind('south-measure-wall-board', { wallPlane: 'sw', variant: 'prayer-card' });
const prayerCards = renderKind('south-measure-wall-board', { wallPlane: 'sw', variant: 'prayer-cards' });
const schedules = renderKind('south-measure-wall-board', { wallPlane: 'se', variant: 'schedules' });
const scheduleBank = renderKind('south-measure-wall-board', { wallPlane: 'se', variant: 'schedule-bank' });
const crawlMarks = renderKind('south-measure-wall-board', { wallPlane: 'se', variant: 'crawl-marks' });
assert.ok(countStyle(privateList, PALETTE.clothRed) >= 1, 'private list must carry a visible red security seal');
assert.ok(countStyle(privateList, PALETTE.rustDark) >= 2, 'private list must be held behind dark securing straps');
assert.ok(renderBounds(privateList).width > renderBounds(prayerCard).width + 20, 'private list must span two wall cells');
assert.ok(countStyle(privateList, PALETTE.clothBlue) >= 10, 'private list must show a broad blue water-route and tally motif');
assert.ok(privateList.some((op) => op.type === 'rect' && op.style === PALETTE.void && op.alpha === 1), 'private list must show a solid lock keyway');
assert.ok(countStyle(prayerCards, PALETTE.clothRed) > countStyle(prayerCard, PALETTE.clothRed), 'prayer-cards must read as a devotional cluster, not the single-card treatment');
assert.ok(renderBounds(scheduleBank).width > renderBounds(schedules).width + 20, 'schedule bank must span a broad joined workflow surface');
assert.ok(countStyle(scheduleBank, PALETTE.clothBlueDark) >= 1, 'schedule bank must carry one joined blue route header');
assert.ok(countStyle(scheduleBank, PALETTE.clothRed) >= 3, 'schedule bank must show linked shift markers');
assert.ok(countStyle(crawlMarks, PALETTE.hostBone) >= 6, 'crawl marks must preserve one unmistakable pale hand trail');
assert.ok(countStyle(crawlMarks, PALETTE.stoneDust) >= 10, 'crawl marks must show multiple small human palms and fingers');

const intactScreen = renderKind('intake-screening-frame', { orient: 'sw', variant: 'intact' });
const brokenScreen = renderKind('intake-screening-frame', { orient: 'sw', variant: 'broken-baskets', damaged: true });
assertPaletteOnly(brokenScreen, 'intake-screening-frame:broken-baskets');
assert.notEqual(signature(brokenScreen), signature(intactScreen), 'broken filter baskets must not reuse the intact screening gate silhouette');
assert.ok(countStyle(brokenScreen, PALETTE.rustLight) >= 10, 'broken filter baskets must expose torn highlighted mesh and bent frame edges');
assert.ok(countStyle(brokenScreen, PALETTE.clothBlueDark) >= 1, 'broken filter baskets must remain visibly caught in the wet channel');

const fixedHoist = renderKind('fixed-hoist');
assertPaletteOnly(fixedHoist, 'fixed-hoist');
assert.ok(renderBounds(fixedHoist).width >= 84, 'fixed hoist must retain a broad shared bridge silhouette');
assert.ok(renderBounds(fixedHoist).height >= 80, 'fixed hoist must tower over its suspended bearing block');
assert.ok(countStyle(fixedHoist, PALETTE.rustLight) >= 12, 'fixed hoist must show prominent bridge, pulley, and chain highlights');
assert.ok(countStyle(fixedHoist, PALETTE.clothRed) >= 1, 'fixed hoist must mark the condemned suspended load');
assertCatalogContact('fixed-hoist');

const medicineTrolley = renderKind('south-measure-medicine-cart', { orient: 'se' });
const coveredMedicineWagon = renderKind('medicine-cart', { orient: 'se' });
assertPaletteOnly(medicineTrolley, 'south-measure-medicine-cart');
assert.ok(renderBounds(medicineTrolley).height + 18 < renderBounds(coveredMedicineWagon).height, 'South Measure medicine trolley must stay waist-high instead of reusing the covered wagon silhouette');
assert.ok(countStyle(medicineTrolley, PALETTE.clothBlueDark) >= 1, 'medicine trolley must show a blue lower shelf');
assert.ok(countStyle(medicineTrolley, PALETTE.clothBlue) >= 2, 'medicine trolley must show a blue enamel basin and tray accents');
assert.ok(
  medicineTrolley.filter((op) => op.type === 'fill' && op.style === PALETTE.rustDark).length >= 4,
  'medicine trolley must show four connected wheel bodies instead of a cabinet drawer band'
);
assert.ok(countStyle(medicineTrolley, PALETTE.hostBone) >= 1, 'medicine trolley must show pale wrapped treatment supplies');
assertCatalogContact('south-measure-medicine-cart');

const cellarFlight = renderKind('stone-stairwell', { orient: 'se', variant: 'cellar-flight' });
const stairLanding = renderKind('stone-stairwell', { orient: 'se' });
assertPaletteOnly(cellarFlight, 'stone-stairwell:cellar-flight');
assert.notEqual(signature(cellarFlight), signature(stairLanding), 'cellar stair flight must not reuse the ordinary threshold landing');
assert.ok(renderBounds(cellarFlight).width > renderBounds(stairLanding).width + 20, 'cellar stair flight must span several visible treads');
assert.ok(countStyle(cellarFlight, PALETTE.rustLight) >= 10, 'cellar stair flight must show repeated rising handrail highlights');
assertCatalogContact('stone-stairwell');

const cupRepair = renderKind('south-measure-worktable', { variant: 'cup-repair' });
const recordsTable = renderKind('south-measure-worktable', { variant: 'records' });
const councilTable = renderKind('south-measure-worktable', { variant: 'council' });
const routeTable = renderKind('south-measure-worktable', { variant: 'route' });
const meetingTable = renderKind('south-measure-worktable', { variant: 'meeting' });
const familyMeal = renderKind('south-measure-worktable', { variant: 'family-meal' });
const burnedLabel = renderKind('south-measure-worktable', { variant: 'burned-label' });
const evidenceBench = renderKind('south-measure-worktable', { variant: 'evidence-bench' });
const familyPlaceSettings = familyMeal.filter((op) => op.type === 'fill' && (op.style === PALETTE.stoneDust || op.style === PALETTE.clothTan));
const meetingPlaces = meetingTable.filter((op) => op.type === 'fill' && (op.style === PALETTE.stoneDust || op.style === PALETTE.clothTan));
assert.ok(countStyle(cupRepair, PALETTE.rustLight) >= 12, 'cup-repair must show long metal repair tools and binding');
assert.ok(countStyle(cupRepair, PALETTE.hostBone) >= 2, 'cup-repair must show a pale broken cup and separate shard');
assert.ok(familyPlaceSettings.length >= 6, 'family-meal must show at least six large place settings');
assert.ok(renderBounds(familyMeal).width > renderBounds(recordsTable).width + 8, 'family-meal must have a broader family-table silhouette');
assert.ok(countStyle(familyMeal, PALETTE.woodMid) >= 6, 'family-meal must show two distinct low seating benches around the table');
assert.ok(renderBounds(meetingTable).width > renderBounds(councilTable).width + 12, 'meeting must be one dominant long shared table, broader than council work');
assert.ok(meetingPlaces.length >= 7, 'meeting must show a central ledger and at least six individual docket places');
assert.ok(countStyle(meetingTable, PALETTE.clothBlue) >= 10, 'meeting ledger must carry a conspicuous blue tally system');
assert.ok(renderBounds(routeTable).width > renderBounds(recordsTable).width + 20, 'route table must have a broad dispatch-map silhouette');
assert.ok(countStyle(routeTable, PALETTE.clothBlue) >= 12, 'route table must show a conspicuous blue water-route overlay');
assert.ok(countStyle(routeTable, PALETTE.rustMid) >= 8, 'route table must show a separate rust road network');
assert.ok(countStyle(routeTable, PALETTE.rustLight) >= 8, 'route table must show several weighted dispatch markers');
assert.ok(countStyle(burnedLabel, PALETTE.clothDark) >= 4, 'burned-label must show a broad char patch and multiple burned label corners');
assert.ok(burnedLabel.some((op) => op.type === 'fill' && op.style === PALETTE.void && op.alpha === 1), 'burned-label must show a broken-open corner on its ash container');
assert.ok(renderBounds(evidenceBench).width > renderBounds(recordsTable).width + 35, 'evidence-bench must dominate the investigation zone with a broad work surface');
assert.ok(countStyle(evidenceBench, PALETTE.clothRed) >= 8, 'evidence-bench must show large burned red-marked labels');
assert.ok(countStyle(evidenceBench, PALETTE.rustLight) >= 8, 'evidence-bench must show a prominent metal examination tool');

const cargoScale = renderKind('freight-scale', { orient: 'se', variant: 'cargo' });
const claimScale = renderKind('freight-scale', { orient: 'se', variant: 'claim' });
assert.ok(renderBounds(cargoScale).width > renderBounds(claimScale).width + 45, 'cargo scale must be a dominant broad weighbridge rather than a second claim pad');
assert.ok(renderBounds(cargoScale).height > renderBounds(claimScale).height + 12, 'cargo scale balance beam must rise above the compact claim scale');
assert.ok(countStyle(cargoScale, PALETTE.rustLight) >= countStyle(claimScale, PALETTE.rustLight) + 12, 'cargo scale must expose a prominent highlighted balance beam and deck rails');

const archiveShelf = renderKind('south-measure-storage', { variant: 'archive-shelf' });
const workShelf = renderKind('south-measure-storage', { variant: 'work-shelf' });
const schoolTools = renderKind('south-measure-storage', { variant: 'school-tools' });
const burialCopies = renderKind('south-measure-storage', { variant: 'burial-copies' });
const suspectShelf = renderKind('south-measure-storage', { variant: 'suspect-shelf' });
const cleanShelf = renderKind('south-measure-storage', { variant: 'clean-shelf' });
assert.ok(renderBounds(workShelf).width > renderBounds(archiveShelf).width + 8, 'work-shelf must be visibly wider than generic archive storage');
assert.ok(countStyle(workShelf, PALETTE.rustLight) >= 8, 'work-shelf must expose large highlighted tools');
assert.ok(maxFilledPathHeight(workShelf) < 40, 'work-shelf must remain an open rack without a full-height solid box face');
assert.ok(countStyle(workShelf, PALETTE.woodMid) >= 6, 'work-shelf must expose three separate shelf planks');
assert.ok(countStyle(schoolTools, PALETTE.clothBlue) >= 2, 'school-tools must carry blue teaching diagrams');
assert.ok(countStyle(schoolTools, PALETTE.clothTan) >= 8, 'school-tools must show large lesson cards and a teaching triangle');
assert.ok(maxFilledPathHeight(schoolTools) < 40, 'school-tools must remain an open human-scale rack without a solid cabinet face');
assert.ok(countStyle(schoolTools, PALETTE.woodMid) >= 6, 'school-tools must expose three separate shelf planks');
assert.ok(renderBounds(burialCopies).width > renderBounds(archiveShelf).width + 8, 'burial-copies must form a broad public archive mass');
assert.ok(countStyle(burialCopies, PALETTE.hostBone) >= 12, 'burial-copies must show many pale tied copy packets');
assert.ok(countStyle(burialCopies, PALETTE.clothRed) >= 2, 'burial-copies must carry visible civic memorial seals');
assert.ok(countStyle(suspectShelf, PALETTE.clothRed) >= 2, 'suspect-shelf must carry controlled red medicine markings');
assert.ok(renderBounds(suspectShelf).height > renderBounds(archiveShelf).height + 4, 'suspect-shelf must be a taller locked cabinet silhouette');
assert.ok(renderBounds(cleanShelf).width > renderBounds(archiveShelf).width + 8, 'clean-shelf must form a wide open medicine run');
assert.ok(countStyle(cleanShelf, PALETTE.hostBone) >= 10, 'clean-shelf must be densely stocked with gauze, vial tops, and dressings');
assert.ok(countStyle(cleanShelf, PALETTE.clothBlue) >= 4, 'clean-shelf must show a dense row of blue medicine vials');

const custodyRest = renderKind('south-measure-custody-rest', { orient: 'sw' });
assertPaletteOnly(custodyRest, 'south-measure-custody-rest');
assert.ok(renderBounds(custodyRest).width >= 50, 'custody rest must leave a broad missing-furniture footprint');
assert.ok(countStyle(custodyRest, PALETTE.stoneDust) >= 5, 'custody rest must show a pale rectangular floor scar');
assert.ok(countStyle(custodyRest, PALETTE.rustLight) >= 4, 'custody rest must retain visible iron mounting brackets');
assertCatalogContact('south-measure-custody-rest');

const fieldSatchel = renderKind('field-satchel');
assertPaletteOnly(fieldSatchel, 'field-satchel');
assert.ok(renderBounds(fieldSatchel).width >= 44, 'field satchel must retain a readable kit-bag silhouette at native scale');
assert.ok(renderBounds(fieldSatchel).height >= 34, 'field satchel shoulder loop must remain visible above surrounding clutter');
assert.ok(countStyle(fieldSatchel, PALETTE.clothBlue) >= 5, 'field satchel must carry a conspicuous Censure blue strap and cord');
assertCatalogContact('field-satchel');

const domesticPartition = renderKind('cloth-partition', { orient: 'se', variant: 'domestic' });
const clinicPartition = renderKind('cloth-partition', { orient: 'se', variant: 'clinic' });
const domesticPanels = domesticPartition.filter((op) => op.type === 'fill' && op.style === PALETTE.clothTan);
assert.ok(domesticPanels.length >= 2, 'domestic partition must show two separate soft curtain panels with a center gap');
assert.ok(renderBounds(domesticPartition).height + 7 < renderBounds(clinicPartition).height, 'domestic partition must hang visibly shorter than the clinic screen');

const ordinaryLaundry = renderKind('laundry-line', { orient: 'se' });
const entryLaundry = renderKind('laundry-line', { orient: 'se', variant: 'entry-screen' });
assertPaletteOnly(entryLaundry, 'laundry-line:entry-screen');
assert.notEqual(signature(entryLaundry), signature(ordinaryLaundry), 'entry-screen laundry must have a dedicated domestic silhouette');
assert.ok(renderBounds(entryLaundry).width >= renderBounds(ordinaryLaundry).width + 20, 'entry-screen laundry must form a much broader masking screen');
assert.ok(countStyle(entryLaundry, PALETTE.clothTan) >= 1, 'entry-screen laundry must carry one broad household sheet');
assert.ok(countStyle(entryLaundry, PALETTE.clothBlueDark) >= 1, 'entry-screen laundry must show a separate blue work shirt');
assert.ok(countStyle(entryLaundry, PALETTE.clothRed) >= 3, 'entry-screen laundry must show a patched sheet and two separated trouser legs');
assertCatalogContact('laundry-line');

for (const kind of ['service-hatch', 'service-pipe-run', 'utility-railing', 'south-measure-worktable', 'south-measure-storage', 'mesh-cage-panel', 'relief-machine', 'intake-pump-assembly', 'freight-scale', 'clinic-bed', 'cloth-partition']) {
  const se = renderKind(kind, { orient: 'se' });
  const sw = renderKind(kind, { orient: 'sw' });
  assert.notEqual(signature(se), signature(sw), `${kind} must honor authored orientation`);
  assertCatalogContact(kind);
}
for (const kind of ['service-pipe-run', 'utility-railing', 'mesh-cage-panel', 'cloth-partition']) {
  const openEnds = renderKind(kind, { orient: 'se', connected: {} });
  const joinedStart = renderKind(kind, { orient: 'se', connected: { xMinus: true } });
  assert.notEqual(signature(openEnds), signature(joinedStart), `${kind} must suppress duplicate start hardware on a connected run`);
}

for (const kind of wallKinds) {
  const ops = renderKind(kind, { connected: { xPlus: false, yPlus: false } });
  assertPaletteOnly(ops, kind);
  assertCatalogContact(kind);
}
assert.notEqual(
  signature(renderKind('south-measure-door', { wallPlane: 'se', variant: 'service' })),
  signature(renderKind('south-measure-door', { wallPlane: 'sw', variant: 'service' })),
  'door geometry must follow either wall plane'
);
assert.notEqual(
  signature(renderKind('south-measure-wall-board', { wallPlane: 'se', variant: 'route' })),
  signature(renderKind('south-measure-wall-board', { wallPlane: 'sw', variant: 'route' })),
  'wall-board geometry must follow either wall plane'
);
assert.notEqual(
  signature(renderKind('intake-clerk-wicket', { wallPlane: 'se', variant: 'stirring' })),
  signature(renderKind('intake-clerk-wicket', { wallPlane: 'sw', variant: 'stirring' })),
  'clerk wicket geometry must follow either wall plane'
);
assert.notEqual(
  signature(renderKind('service-pipe-run', { wallPlane: 'se', variant: 'valve' })),
  signature(renderKind('service-pipe-run', { wallPlane: 'sw', variant: 'valve' })),
  'wall-mounted service pipes must follow either wall plane'
);
assert.notEqual(
  signature(renderKind('south-measure-door', { wallPlane: 'sw', variant: 'civil', opened: false })),
  signature(renderKind('south-measure-door', { wallPlane: 'sw', variant: 'civil', opened: true })),
  'door open state must survive catalog dispatch'
);
assert.notEqual(
  signature(renderKind('service-hatch', { orient: 'se', variant: 'ladder', opened: false })),
  signature(renderKind('service-hatch', { orient: 'se', variant: 'ladder', opened: true })),
  'service hatch open state must survive catalog dispatch'
);

for (const style of ['relief-channel-x', 'relief-channel-y', 'relief-channel-junction']) {
  const first = createRecordingContext();
  const second = createRecordingContext();
  drawStyledFloorCell(first, 200, 180, 7, 11, style);
  drawStyledFloorCell(second, 200, 180, 7, 11, style);
  assert.deepEqual(first.ops, second.ops, `${style} must be deterministic`);
  assertPaletteOnly(first.ops, style);
}
const deterministicA = createRecordingContext();
const deterministicB = createRecordingContext();
drawSouthMeasureInteriorWallBlock(deterministicA, 200, 180, WALL_HEIGHT, 73, { variant: 'service', connected: {} });
drawSouthMeasureInteriorWallBlock(deterministicB, 200, 180, WALL_HEIGHT, 73, { variant: 'service', connected: {} });
assert.deepEqual(deterministicA.ops, deterministicB.ops, 'interior wall art must be deterministic');

const source = await readFile(new URL('../src/render/primitives/southMeasureInteriors.js', import.meta.url), 'utf8');
assert.doesNotMatch(source, /create(?:Linear|Radial)Gradient|shadowBlur|\.filter\s*=/, 'interior art must use hard pixel bands, never smooth effects');

console.log('southMeasureInteriorArt: catalog, variants, orientation, connected geometry, palette, shadows, and channel seams passed.');
