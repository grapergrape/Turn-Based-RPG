import assert from 'node:assert/strict';

import { SPRITE_CATALOG } from '../src/render/spriteCatalog.js';

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

let draws = 0;
for (const [kind, entry] of Object.entries(SPRITE_CATALOG)) {
  assert.equal(typeof entry.draw, 'function', `catalog kind "${kind}" has no draw function`);
  for (let seed = 0; seed < 6; seed += 1) {
    const prop = {
      x: 5,
      y: 7,
      seed,
      orient: orients[seed % orients.length],
      height: 64,
      interact: { lock: {} },
      opened: seed % 2 === 0,
      consumed: seed % 3 === 0,
      defiled: seed % 2 === 1,
      dry: seed % 3 === 1,
      dim: seed % 2 === 0,
      connected: { xPlus: false, yPlus: false, xMinus: false, yMinus: false }
    };
    assert.doesNotThrow(
      () => entry.draw(
        createMockContext(),
        300,
        300,
        seed,
        { prop, anim: { pulse: 0, flicker: 0, tick: 0 }, pulse: 0, flicker: 0, player: null }
      ),
      `catalog kind "${kind}" threw while drawing (seed ${seed}, orient ${prop.orient})`
    );
    draws += 1;
  }
}

console.log(`catalogRender: ${kinds.length} kinds x 6 seeds = ${draws} draws, none threw.`);
