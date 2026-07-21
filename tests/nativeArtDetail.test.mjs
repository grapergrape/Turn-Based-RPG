import assert from 'node:assert/strict';

import { PALETTE } from '../src/render/palette.js';
import { drawGroundItem, GROUND_ITEM_MODEL_IDS } from '../src/render/primitives/groundItems.js';
import {
  drawFarmCrossVictim,
  drawBoundVictim,
  FARM_CROSS_VICTIM_MEMBER_IDS
} from '../src/render/primitives/goreVictims.js';
import { drawCrossMartyr } from '../src/render/primitives/goreOssuary.js';
import {
  drawCalcifiedGraveBody,
  GRAVE_BODY_VARIANT_IDS
} from '../src/render/primitives/goreGraves.js';
import { drawOpenedPilgrimRemains } from '../src/render/primitives/oldPilgrim.js';
import { drawStageIvCartLure } from '../src/render/primitives/stageIvAmbush.js';
import { drawSouthMeasureIntakeClerkWicket } from '../src/render/primitives/southMeasureInteriors.js';
import { FLOOR_STYLE_IDS, drawStyledFloorCell } from '../src/render/primitives/terrain.js';
import { CATEGORY, SPRITE_CATALOG } from '../src/render/spriteCatalog.js';

function recordingContext() {
  const calls = [];
  let path = [];
  const stateStack = [];
  const target = {
    calls,
    fillStyle: PALETTE.void,
    strokeStyle: PALETTE.void,
    globalAlpha: 1,
    globalCompositeOperation: 'source-over',
    lineWidth: 1,
    fillRect(x, y, w, h) { calls.push({ type: 'fillRect', x, y, w, h, color: this.fillStyle }); },
    save() {
      stateStack.push({
        fillStyle: this.fillStyle,
        strokeStyle: this.strokeStyle,
        globalAlpha: this.globalAlpha,
        globalCompositeOperation: this.globalCompositeOperation,
        lineWidth: this.lineWidth
      });
    },
    restore() {
      const state = stateStack.pop();
      if (state) Object.assign(this, state);
    },
    beginPath() { path = []; },
    closePath() { path.push(['close']); },
    moveTo(x, y) { path.push(['move', x, y]); },
    lineTo(x, y) { path.push(['line', x, y]); },
    fill() { calls.push({ type: 'fill', path: structuredClone(path), color: this.fillStyle, alpha: this.globalAlpha }); },
    stroke() { calls.push({ type: 'stroke', path: structuredClone(path), color: this.strokeStyle, alpha: this.globalAlpha, lineWidth: this.lineWidth }); },
    rect(x, y, w, h) { path.push(['rect', x, y, w, h]); },
    clip() {}
  };
  return new Proxy(target, {
    get(object, property) {
      if (property in object) return object[property];
      return () => {};
    },
    set(object, property, value) {
      object[property] = value;
      return true;
    }
  });
}

const palette = new Set(Object.values(PALETTE));
function assertNativeMarks(label, calls) {
  const nativeMarks = calls.filter((call) => call.w === 0.5 || call.h === 0.5);
  assert.ok(nativeMarks.length > 0, `${label} must contain deliberate one-native-pixel marks`);
  for (const mark of nativeMarks) {
    assert.ok(palette.has(mark.color), `${label} native detail uses palette color ${mark.color}`);
    for (const value of [mark.x, mark.y, mark.w, mark.h]) {
      assert.equal(Number.isInteger(value * 2), true, `${label} detail must land on the native half-pixel grid`);
    }
  }
}

for (const [index, style] of FLOOR_STYLE_IDS.entries()) {
  const ctx = recordingContext();
  drawStyledFloorCell(ctx, 64, 32, index + 3, index + 7, style);
  assertNativeMarks(style, ctx.calls);
}

for (const [index, model] of GROUND_ITEM_MODEL_IDS.entries()) {
  const ctx = recordingContext();
  drawGroundItem(ctx, 64, 32, index + 41, { model, count: 1, drop: 1, pickup: 0 });
  assertNativeMarks(`ground-item:${model}`, ctx.calls);
}

for (const [index, member] of FARM_CROSS_VICTIM_MEMBER_IDS.entries()) {
  const ctx = recordingContext();
  drawFarmCrossVictim(ctx, 64, 92, index + 61, { member });
  assertNativeMarks(`farm-cross-victim:${member}`, ctx.calls);
}

for (const [index, variant] of GRAVE_BODY_VARIANT_IDS.entries()) {
  const ctx = recordingContext();
  drawCalcifiedGraveBody(ctx, 64, 92, index + 71, { variant });
  assertNativeMarks(`calcified-grave-body:${variant}`, ctx.calls);
}

for (const [label, options] of [
  ['alive', { pulse: 1, flicker: 1 }],
  ['dead-hanging', { dead: true }],
  ['released-start', { released: true, fall: 0 }],
  ['released-mid', { released: true, fall: 0.5 }],
  ['released-landed', { released: true, fall: 1 }]
]) {
  const ctx = recordingContext();
  drawCrossMartyr(ctx, 64, 112, 83, options);
  assertNativeMarks(`cross-martyr:${label}`, ctx.calls);
}

for (const [label, options] of [
  ['alive', { pulse: 1, flicker: 1 }],
  ['dim', { dim: true }],
  ['killed', { killed: true }]
]) {
  const ctx = recordingContext();
  drawBoundVictim(ctx, 64, 100, 89, options);
  assertNativeMarks(`bound-victim:${label}`, ctx.calls);
}

for (const variant of ['runner', 'bell', 'cord']) {
  const ctx = recordingContext();
  drawOpenedPilgrimRemains(ctx, 64, 72, 97, { variant });
  assertNativeMarks(`opened-pilgrim-remains:${variant}`, ctx.calls);
}

for (const orient of ['se', 'sw']) {
  const ctx = recordingContext();
  drawStageIvCartLure(ctx, 64, 72, 101, { orient });
  assertNativeMarks(`stage-iv-cart-lure:${orient}`, ctx.calls);
}

for (const state of ['dormant', 'stirring', 'opened']) {
  const ctx = recordingContext();
  drawSouthMeasureIntakeClerkWicket(ctx, 64, 100, 103, { state, wallPlane: 'sw', wallSide: 'near' });
  assertNativeMarks(`intake-clerk-wicket:${state}`, ctx.calls);
}

const context = {
  prop: { orient: 'se', density: 'full', connected: {} },
  anim: { tick: 0 },
  pulse: 0,
  flicker: 0,
  player: null
};

function catalogContext(prop = {}, anim = {}) {
  return {
    ...context,
    prop: { orient: 'se', density: 'full', connected: {}, ...prop },
    anim: { tick: 0, ...anim }
  };
}

function catalogCalls(kind, prop = {}, anim = {}) {
  const ctx = recordingContext();
  SPRITE_CATALOG[kind].draw(ctx, 96, 112, 113, catalogContext(prop, anim));
  assertNativeMarks(`${kind}:${JSON.stringify(prop)}`, ctx.calls);
  return ctx.calls;
}

function callSignature(calls) {
  return JSON.stringify(calls.map((call) => call.type === 'fillRect'
    ? [call.type, call.x, call.y, call.w, call.h, call.color]
    : [call.type, call.path, call.color, call.alpha, call.lineWidth]));
}

function assertCatalogVariantsDiffer(kind, variants) {
  const signatures = variants.map(({ label, prop, anim }) => ({
    label,
    signature: callSignature(catalogCalls(kind, prop, anim))
  }));
  assert.equal(
    new Set(signatures.map(({ signature }) => signature)).size,
    signatures.length,
    `${kind} variants must produce distinct native redraws: ${signatures.map(({ label }) => label).join(', ')}`
  );
}
const nativeStructureKinds = [
  'farm-fence',
  'farm-building-block',
  'farmhouse-building-block',
  'barn-building-block',
  'tool-shed-building-block',
  'storage-shed-building-block',
  'grain-shed-building-block',
  'censure-attendant-shrine',
  'drone-folding-screen',
  'drone-arc-sentry',
  'drone-relay-pylon',
  'south-measure-rowhouse-building-block',
  'relief-annex-building-block',
  'compact-clinic-building-block',
  'morrow-freight-house-building-block',
  'measure-hall-building-block',
  'admission-booth-building-block',
  'south-measure-burial-shed-building-block',
  'south-measure-berm-block',
  'canvas-tent-building-block',
  'graveyard-mortuary-chapel-block',
  'graveyard-vigil-chapel-block',
  'pilgrim-road-shrine',
  'pilgrim-trial-frame',
  'cracked-column',
  'saint-statue',
  'stone-tomb',
  'graveyard-wall',
  'calcified-grave-plot',
  'calcified-headstone',
  'graveyard-tomb-slab',
  'graveyard-catacomb-mouth',
  'graveyard-bone-marker',
  'graveyard-remnant-cross',
  'stone-stairwell',
  'quarantine-barricade',
  'broken-bell',
  'bell-rope',
  'quarantine-sign',
  'chapel-double-door',
  'damaged-altar',
  'farm-door',
  'road-sign-post',
  'infected-cave-entrance',
  'listening-apparatus',
  'sealed-listening-niche',
  'devil-target',
  'water-condenser',
  'settling-tank',
  'south-measure-settling-vat',
  'public-tap-stand',
  'intake-screening-frame',
  'fixed-hoist',
  'collapsed-culvert',
  'south-chain-gate',
  'north-chain-gate',
  'measure-boundary-fence',
  'south-measure-receiving-shelter',
  'south-measure-charity-canopy',
  'south-measure-pipe-gantry',
  'south-measure-queue-rail',
  'south-measure-brass-hook-memorial',
  'south-measure-grave-family-rail',
  'south-measure-sample-burner',
  'service-hatch',
  'service-pipe-run',
  'utility-railing',
  'mesh-cage-panel',
  'relief-machine',
  'intake-pump-assembly'
];
const catalogStructureKinds = Object.entries(SPRITE_CATALOG)
  .filter(([, entry]) => entry.category === CATEGORY.STRUCTURE)
  .map(([kind]) => kind);
assert.deepEqual(
  [...nativeStructureKinds].sort(),
  [...catalogStructureKinds].sort(),
  'every registered structure must participate in the native 2x detail contract'
);
const nativeFixtureKinds = [
  'wall-window',
  'wall-safe',
  'wall-stash',
  'wall-stair-door',
  'vigil-candle-rack',
  'mortuary-tag-board',
  'south-measure-door',
  'south-measure-wall-board',
  'canvas-tent-flap'
];
const catalogFixtureKinds = Object.entries(SPRITE_CATALOG)
  .filter(([, entry]) => entry.category === CATEGORY.FIXTURE)
  .map(([kind]) => kind);
assert.deepEqual(
  [...nativeFixtureKinds].sort(),
  [...catalogFixtureKinds].sort(),
  'every registered fixture must participate in the native 2x detail contract'
);
const nativePropKinds = [
  'rubble-pile',
  'cave-stalagmite',
  'cave-stalactites',
  'bone-pile',
  'bone-niche',
  'loose-flagstone',
  'small-pouch',
  'blue-ball',
  'ground-item',
  'drone-sensor-stake',
  'drone-snare-pod'
];
const catalogPropKinds = Object.entries(SPRITE_CATALOG)
  .filter(([, entry]) => entry.category === CATEGORY.PROP)
  .map(([kind]) => kind);
assert.deepEqual(
  [...nativePropKinds].sort(),
  [...catalogPropKinds].sort(),
  'every registered prop must participate in the native 2x detail contract'
);
const nativeLightKinds = [
  'candle-cluster',
  'window-light-pool',
  'campfire',
  'south-measure-arrival-hearth'
];
const catalogLightKinds = Object.entries(SPRITE_CATALOG)
  .filter(([, entry]) => entry.category === CATEGORY.LIGHT)
  .map(([kind]) => kind);
assert.deepEqual(
  [...nativeLightKinds].sort(),
  [...catalogLightKinds].sort(),
  'every registered light must participate in the native 2x detail contract'
);
const nativeRitualKinds = [
  'choir-pentagram',
  'blood-sigil',
  'ritual-circle'
];
const catalogRitualKinds = Object.entries(SPRITE_CATALOG)
  .filter(([, entry]) => entry.category === CATEGORY.RITUAL)
  .map(([kind]) => kind);
assert.deepEqual(
  [...nativeRitualKinds].sort(),
  [...catalogRitualKinds].sort(),
  'every registered ritual kind must participate in the native 2x detail contract'
);
const nativeGoreKinds = [
  'corpse',
  'cult-victim',
  'farm-cross-victim',
  'skeleton',
  'dead-cultist'
];
const catalogGoreKinds = Object.entries(SPRITE_CATALOG)
  .filter(([, entry]) => entry.category === CATEGORY.GORE)
  .map(([kind]) => kind);
assert.deepEqual(
  [...nativeGoreKinds].sort(),
  [...catalogGoreKinds].sort(),
  'every registered gore kind must participate in the native 2x detail contract'
);
const nativeDecalKinds = [
  'blood-stain',
  'road-dust',
  'glass-debris',
  'dust',
  'rubble-decal',
  'floor-crack',
  'scorch-mark',
  'wax-stain',
  'paper-scraps',
  'host-vein-seam',
  'graveyard-packed-ash',
  'graveyard-path-stones',
  'graveyard-root-seam',
  'graveyard-prayer-scratch',
  'cave-flowstone',
  'chaff-scatter',
  'trampled-mud',
  'practice-scars',
  'spent-casings',
  'chalk-drawing',
  'machine-oil',
  'south-measure-service-stain',
  'south-measure-tally-scraps',
  'south-measure-work-grit',
  'mortuary-drain',
  'listening-wire',
  'cobweb'
];
const catalogDecalKinds = Object.entries(SPRITE_CATALOG)
  .filter(([, entry]) => entry.category === CATEGORY.DECAL)
  .map(([kind]) => kind);
assert.deepEqual(
  [...nativeDecalKinds].sort(),
  [...catalogDecalKinds].sort(),
  'every registered decal must participate in the native 2x detail contract'
);
const nativeCreatureKinds = [
  'host-growth',
  'cross-martyr',
  'bound-victim',
  'calcified-penitent',
  'calcified-crossroad-brother',
  'calcified-scarecrow-brother',
  'calcified-grave-body',
  'dead-host-wolf-spider',
  'dead-host-wolf-maw',
  'dead-host-wolf-ribsplit',
  'host-wolf-remains',
  'stage-iv-cart-lure',
  'opened-pilgrim-remains',
  'intake-clerk-wicket'
];
const catalogCreatureKinds = Object.entries(SPRITE_CATALOG)
  .filter(([, entry]) => entry.category === CATEGORY.CREATURE)
  .map(([kind]) => kind);
assert.deepEqual(
  [...nativeCreatureKinds].sort(),
  [...catalogCreatureKinds].sort(),
  'every registered creature/remains kind must participate in the native 2x detail contract'
);
const nativeFurnitureKinds = [
  'broken-pew',
  'rusted-reliquary',
  'field-satchel',
  'field-backpack',
  'south-measure-service-pack',
  'rusted-crate',
  'sealed-storage-crate',
  'canvas-tent',
  'camp-bedroll',
  'settlement-table',
  'low-stool',
  'dining-table',
  'dining-bench',
  'kitchen-counter',
  'farm-prep-table',
  'farm-bed',
  'pilgrim-cot',
  'pilgrim-memorial-tablet',
  'closure-control-panel',
  'processional-pike-rack',
  'grain-sack-stack',
  'grain-bin',
  'farm-workbench',
  'stable-divider',
  'gravekeeper-chair',
  'mortuary-washing-table',
  'examiner-assay-case',
  'kitchen-hearth',
  'farm-kitchen-hearth',
  'pantry-shelf',
  'wash-tub',
  'chapel-banner',
  'prayer-lectern',
  'ritual-bowl',
  'chapel-font',
  'rusted-barrel',
  'field-cart',
  'overturned-field-cart',
  'hay-rick',
  'field-plow',
  'field-harrow',
  'feed-trough',
  'water-pump',
  'tool-rack',
  'training-dummy',
  'wagon-wheel',
  'woodpile',
  'freight-wagon',
  'medicine-cart',
  'south-measure-medicine-cart',
  'grain-cage',
  'laundry-line',
  'shared-oven',
  'wash-wall',
  'measure-grave-plot',
  'charity-cot',
  'south-measure-sleeping-pallet',
  'south-measure-hand-pump',
  'south-measure-water-vessels',
  'south-measure-water-lesson',
  'south-measure-notice-board',
  'south-measure-return-stall',
  'south-measure-repair-rack',
  'south-measure-worktable',
  'south-measure-storage',
  'south-measure-custody-rest',
  'freight-scale',
  'clinic-bed',
  'cloth-partition',
  'drone-med-station'
];
const catalogFurnitureKinds = Object.entries(SPRITE_CATALOG)
  .filter(([, entry]) => entry.category === CATEGORY.FURNITURE)
  .map(([kind]) => kind);
assert.deepEqual(
  [...nativeFurnitureKinds].sort(),
  [...catalogFurnitureKinds].sort(),
  'every registered furniture kind must participate in the native 2x detail contract'
);
const nativeKinds = [...new Set([
  ...Object.entries(SPRITE_CATALOG)
    .filter(([, entry]) => entry.category === CATEGORY.PLANT || entry.category === CATEGORY.TERRAIN)
    .map(([kind]) => kind),
  ...nativeStructureKinds,
  ...nativeFixtureKinds,
  ...nativePropKinds,
  ...nativeLightKinds,
  ...nativeRitualKinds,
  ...nativeGoreKinds,
  ...nativeDecalKinds,
  ...nativeCreatureKinds,
  ...nativeFurnitureKinds
])];
for (const [index, kind] of nativeKinds.entries()) {
  const ctx = recordingContext();
  SPRITE_CATALOG[kind].draw(ctx, 96, 112, index + 11, context);
  assertNativeMarks(kind, ctx.calls);
}

// Every orientation-aware furniture kind must retain native detail in all four
// projected facings. This catches detail drawn in screen space by accident.
const orientedFurnitureKinds = [
  'dining-table', 'dining-bench', 'kitchen-counter', 'farm-prep-table',
  'farm-bed', 'pilgrim-cot', 'grain-bin', 'farm-workbench', 'stable-divider',
  'gravekeeper-chair', 'mortuary-washing-table', 'examiner-assay-case',
  'field-cart', 'overturned-field-cart', 'field-plow', 'field-harrow',
  'feed-trough', 'training-dummy', 'freight-wagon', 'medicine-cart',
  'south-measure-medicine-cart', 'grain-cage', 'laundry-line', 'wash-wall', 'measure-grave-plot',
  'charity-cot', 'south-measure-worktable', 'south-measure-storage', 'south-measure-custody-rest',
  'south-measure-sleeping-pallet', 'south-measure-water-vessels',
  'south-measure-notice-board', 'south-measure-return-stall', 'south-measure-repair-rack',
  'freight-scale', 'clinic-bed', 'cloth-partition'
];
for (const kind of orientedFurnitureKinds) {
  for (const orient of ['se', 'sw', 'nw', 'ne']) catalogCalls(kind, { orient });
}

for (const kind of ['rusted-reliquary', 'field-satchel', 'field-backpack', 'south-measure-service-pack', 'rusted-crate', 'sealed-storage-crate']) {
  assertCatalogVariantsDiffer(kind, [
    { label: 'closed', prop: {} },
    { label: 'opened', prop: { opened: true } }
  ]);
}
assertCatalogVariantsDiffer('rusted-barrel', [
  { label: 'closed', prop: { interact: { type: 'container' } } },
  { label: 'opened', prop: { interact: { type: 'container' }, opened: true } },
  { label: 'ladder', prop: { interact: { type: 'secret-exit' } } }
]);
assertCatalogVariantsDiffer('pilgrim-cot', ['novice', 'sister', 'priest'].map((variant) => ({ label: variant, prop: { variant } })));
assertCatalogVariantsDiffer('pilgrim-memorial-tablet', [
  'record', 'sealed', 'road-book', 'memorial', 'profession-forced', 'profession-kept', 'last-office'
].map((variant) => ({ label: variant, prop: { variant } })));
assertCatalogVariantsDiffer('closure-control-panel', [
  'register', 'wheel', 'gauge', 'tally', 'chapter-record'
].map((variant) => ({ label: variant, prop: { variant } })));
assertCatalogVariantsDiffer('processional-pike-rack', [
  { label: 'stocked', prop: {} },
  { label: 'opened', prop: { opened: true } }
]);
assertCatalogVariantsDiffer('gravekeeper-chair', [
  { label: 'cord', prop: { variant: 'cord' } },
  { label: 'restraint', prop: { variant: 'restraint' } }
]);
assertCatalogVariantsDiffer('prayer-lectern', [
  { label: 'intact', prop: {} },
  { label: 'defiled', prop: { defiled: true } }
]);
assertCatalogVariantsDiffer('chapel-font', [
  { label: 'water', prop: {} },
  { label: 'dim', prop: { dim: true } },
  { label: 'dry', prop: { dry: true } },
  { label: 'defiled', prop: { defiled: true } }
]);
assertCatalogVariantsDiffer('south-measure-worktable', [
  'records', 'clinic', 'cup-repair', 'burned-label', 'council', 'school'
].map((variant) => ({ label: variant, prop: { variant } })));
assertCatalogVariantsDiffer('south-measure-storage', [
  'archive-shelf', 'lime-records-chest', 'medicine-shelf', 'locked-cabinet', 'current-records'
].map((variant) => ({ label: variant, prop: { variant } })));
assertCatalogVariantsDiffer('freight-scale', ['cargo', 'claim'].map((variant) => ({ label: variant, prop: { variant } })));
assertCatalogVariantsDiffer('clinic-bed', ['clean', 'used', 'isolation'].map((variant) => ({ label: variant, prop: { variant } })));
assertCatalogVariantsDiffer('cloth-partition', ['clinic', 'domestic', 'isolation'].map((variant) => ({ label: variant, prop: { variant } })));

console.log(
  `nativeArtDetail: ${FLOOR_STYLE_IDS.length} floor styles, ${GROUND_ITEM_MODEL_IDS.length} ground-item models, ${FARM_CROSS_VICTIM_MEMBER_IDS.length} farm-cross variants, ${GRAVE_BODY_VARIANT_IDS.length} grave-body variants, and ${nativeKinds.length} completed catalog kinds use palette-safe one-native-pixel detail.`
);
