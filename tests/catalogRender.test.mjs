import assert from 'node:assert/strict';

import { PALETTE } from '../src/render/palette.js';
import {
  CATEGORY,
  SPRITE_CATALOG,
  displayNameForKind
} from '../src/render/spriteCatalog.js';

// A permissive 2D-context stand-in: every method is a no-op, every property
// assignment is accepted, and gradient/pattern factories return a stub. This
// lets us execute each catalog draw function purely to prove it does not throw
// (a misplaced free variable once shipped a "side is not defined" crash into a
// live level - see the calcified-crossroad-brother fix).
function createMockContext() {
  const grad = { addColorStop() {} };
  const handler = {
    get(_target, prop) {
      if (prop === 'globalAlpha') return 1;
      if (prop === 'canvas') return { width: 640, height: 480 };
      if (prop === 'createLinearGradient' || prop === 'createRadialGradient' || prop === 'createPattern') {
        return () => grad;
      }
      if (prop === 'measureText') return () => ({ width: 0 });
      if (prop === 'getImageData') return () => ({ data: new Uint8ClampedArray(4) });
      return () => {};
    },
    set() {
      return true;
    }
  };
  return new Proxy({}, handler);
}

globalThis.document = globalThis.document ?? {
  createElement() {
    return { width: 0, height: 0, getContext() { return createMockContext(); } };
  }
};

const orients = ['se', 'sw', 'nw', 'ne'];
const kinds = Object.keys(SPRITE_CATALOG);

assert.ok(kinds.length >= 100, `catalog unexpectedly small (${kinds.length} kinds)`);

const reusableFieldKinds = [
  ['field-backpack', CATEGORY.FURNITURE, 'Field Backpack'],
  ['small-pouch', CATEGORY.PROP, 'Small Pouch'],
  ['dead-grass-tuft', CATEGORY.PLANT, 'Dead Grass Tuft']
];

for (const [kind, category, displayName] of reusableFieldKinds) {
  const entry = SPRITE_CATALOG[kind];
  assert.ok(entry, `catalog is missing ${kind}`);
  assert.equal(entry.category, category, `${kind} has the expected category`);
  assert.equal(entry.layer, 2, `${kind} uses the low prop depth layer`);
  assert.equal(entry.flat, undefined, `${kind} is volumetric rather than a floor decal`);
  assert.equal(entry.block, undefined, `${kind} does not become a wall-grid block`);
  assert.equal(entry.cover, undefined, `${kind} does not grant combat cover`);
  assert.equal(displayNameForKind(kind), displayName, `${kind} has an authored display name`);
}
assert.equal(
  SPRITE_CATALOG['dead-grass-tuft'].canopyRadius,
  undefined,
  'dead grass stays low and does not trigger canopy fading'
);

let draws = 0;
for (const [kind, entry] of Object.entries(SPRITE_CATALOG)) {
  assert.equal(typeof entry.draw, 'function', `catalog kind "${kind}" has no draw function`);
  for (let seed = 0; seed < 6; seed += 1) {
    for (const [orientIndex, orient] of orients.entries()) {
      const prop = {
        kind,
        x: 5,
        y: 7,
        seed,
        orient,
        height: 64,
        interact: { lock: {} },
        opened: seed % 2 === 0,
        consumed: seed % 3 === 0,
        defiled: seed % 2 === 1,
        dry: seed % 3 === 1,
        dim: seed % 2 === 0,
        connected: {
          xPlus: orientIndex === 0,
          yPlus: orientIndex === 1,
          xMinus: orientIndex === 2,
          yMinus: orientIndex === 3
        }
      };
      assert.doesNotThrow(
        () => entry.draw(
          createMockContext(),
          300,
          300,
          seed,
          {
            prop,
            anim: { pulse: seed % 2, flicker: seed % 2, tick: seed / 5 },
            pulse: seed % 2,
            flicker: seed % 2,
            player: null
          }
        ),
        `catalog kind "${kind}" threw while drawing (seed ${seed}, orient ${prop.orient})`
      );
      draws += 1;
    }
  }
}

// Loot containers must not keep their sealed silhouette after the last item is
// taken. A tiny call-count context proves the catalog forwards runtime state to
// a distinct drawing branch without depending on browser pixel APIs here.
function drawCallCount(kind, opened, consumed = opened) {
  let calls = 0;
  const grad = { addColorStop() { calls += 1; } };
  const ctx = new Proxy({}, {
    get(_target, prop) {
      if (prop === 'globalAlpha') return 1;
      if (prop === 'canvas') return { width: 640, height: 480 };
      if (prop === 'createLinearGradient' || prop === 'createRadialGradient' || prop === 'createPattern') {
        return () => { calls += 1; return grad; };
      }
      if (prop === 'measureText') return () => { calls += 1; return { width: 0 }; };
      if (prop === 'getImageData') return () => { calls += 1; return { data: new Uint8ClampedArray(4) }; };
      return () => { calls += 1; };
    },
    set() {
      calls += 1;
      return true;
    }
  });
  const prop = {
    kind,
    x: 5,
    y: 7,
    seed: 3,
    opened,
    consumed,
    interact: { type: 'container' }
  };
  SPRITE_CATALOG[kind].draw(
    ctx,
    300,
    300,
    3,
    { prop, anim: { pulse: 0, flicker: 0, tick: 0 }, pulse: 0, flicker: 0, player: null }
  );
  return calls;
}

for (const kind of [
  'field-satchel',
  'field-backpack',
  'small-pouch',
  'rusted-reliquary',
  'rusted-crate',
  'sealed-storage-crate',
  'rusted-barrel'
]) {
  const closedCalls = drawCallCount(kind, false, false);
  const openedCalls = drawCallCount(kind, true, false);
  const consumedCalls = drawCallCount(kind, false, true);
  assert.notEqual(
    closedCalls,
    openedCalls,
    `${kind} has a distinct opened drawing branch`
  );
  assert.equal(
    consumedCalls,
    openedCalls,
    `${kind} treats consumed containers as opened`
  );
}

function assignedWorldColors(kind, opened = false) {
  const colors = [];
  const ctx = new Proxy({}, {
    get(_target, prop) {
      if (prop === 'globalAlpha') return 1;
      if (prop === 'canvas') return { width: 640, height: 480 };
      return () => {};
    },
    set(_target, prop, value) {
      if ((prop === 'fillStyle' || prop === 'strokeStyle') && typeof value === 'string') {
        colors.push(value);
      }
      return true;
    }
  });
  const prop = {
    kind,
    x: 5,
    y: 7,
    seed: 11,
    opened,
    consumed: opened,
    interact: { type: 'container' }
  };
  SPRITE_CATALOG[kind].draw(
    ctx,
    300,
    300,
    11,
    { prop, anim: { pulse: 0, flicker: 0, tick: 0 }, pulse: 0, flicker: 0, player: null }
  );
  return colors;
}

const worldPalette = new Set(
  Object.entries(PALETTE)
    .filter(([name]) => !name.startsWith('ui'))
    .map(([, color]) => color)
);
for (const kind of ['field-backpack', 'small-pouch', 'dead-grass-tuft', 'rusted-reliquary']) {
  for (const opened of [false, true]) {
    for (const color of assignedWorldColors(kind, opened)) {
      assert.ok(worldPalette.has(color), `${kind} uses palette color ${color}`);
    }
  }
}

console.log(`catalogRender: ${kinds.length} kinds x 6 seeds x 4 orientations = ${draws} draws, none threw.`);
