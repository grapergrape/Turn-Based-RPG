import assert from 'node:assert/strict';

class FakeContext {
  constructor(canvas) {
    this.canvas = canvas;
    this.imageSmoothingEnabled = true;
    this.globalAlpha = 1;
    this.globalCompositeOperation = 'source-over';
    this.lineWidth = 1;
    this.drawImageCalls = 0;
  }

  setTransform() {}
  clearRect() {}
  fillRect() {}
  strokeRect() {}
  beginPath() {}
  moveTo() {}
  lineTo() {}
  closePath() {}
  rect() {}
  arc() {}
  fill() {}
  stroke() {}
  save() {}
  restore() {}
  measureText(text) { return { width: String(text).length * 6 }; }
  fillText() {}
  drawImage() { this.drawImageCalls += 1; }
}

class FakeCanvas {
  constructor() {
    this.width = 0;
    this.height = 0;
    this.context = new FakeContext(this);
    this.handlers = new Map();
  }

  getContext() {
    return this.context;
  }

  addEventListener(type, handler) {
    this.handlers.set(type, handler);
  }

  dispatch(type) {
    this.handlers.get(type)?.({ preventDefault() {} });
  }
}

globalThis.document = {
  createElement(tag) {
    assert.equal(tag, 'canvas');
    return new FakeCanvas();
  }
};

const { PropSpriteCache } = await import('../src/render/PropSpriteCache.js');
const { drawNoisePixels } = await import('../src/render/primitives/basePixels.js');
const { SPRITE_CATALOG } = await import('../src/render/spriteCatalog.js');

const expectedAnimatedKinds = [
  'bound-victim',
  'campfire',
  'candle-cluster',
  'chapel-double-door',
  'cross-martyr',
  'damaged-altar',
  'ground-item',
  'host-growth',
  'south-measure-arrival-hearth',
  'south-measure-tumbleweed',
  'wall-window'
];
assert.deepEqual(
  Object.entries(SPRITE_CATALOG)
    .filter(([, entry]) => entry.animated)
    .map(([kind]) => kind)
    .sort(),
  expectedAnimatedKinds,
  'every time-, pulse-, and flicker-dependent catalog entry bypasses the static cache'
);

const output = new FakeContext(new FakeCanvas());
const cache = new PropSpriteCache({ maxBytes: 1024 * 1024, maxEntries: 8 });
let staticDraws = 0;
const staticEntry = {
  draw(ctx, x, y, _seed, state) {
    staticDraws += 1;
    ctx.fillRect(x - 3, y - 9, 6, state.prop.opened ? 7 : 9);
    ctx.beginPath();
    ctx.moveTo(x - 4, y);
    ctx.lineTo(x, y + 3);
    ctx.lineTo(x + 4, y);
    ctx.fill();
  }
};
const prop = { kind: 'test-prop', opened: false, connected: {} };
const state = { prop, anim: {}, pulse: 0, flicker: 0, player: null };

assert.equal(cache.draw(output, staticEntry, prop, 7, state, 40, 50), true);
assert.equal(staticDraws, 1, 'the first static draw bakes one native sprite');
assert.equal(output.drawImageCalls, 1, 'the baked sprite is composited on its first frame');
assert.equal(cache.stats.misses, 1);
assert.equal(cache.stats.entries, 1);
assert.ok(cache.stats.bytes > 0 && cache.stats.bytes < 1024 * 1024);

cache.draw(output, staticEntry, prop, 7, state, 41, 50);
assert.equal(staticDraws, 1, 'an unchanged prop reuses its baked pixels');
assert.equal(output.drawImageCalls, 2);
assert.equal(cache.stats.hits, 1);

const firstSurface = [...cache.live][0].surface;
firstSurface.dispatch('contextlost');
cache.draw(output, staticEntry, prop, 7, state, 41, 50);
assert.equal(staticDraws, 2, 'a lost prop surface is rebuilt on its next draw');
assert.equal(cache.stats.misses, 2);

prop.opened = true;
cache.draw(output, staticEntry, prop, 7, state, 41, 50);
assert.equal(staticDraws, 3, 'a visible state change invalidates and rebuilds the prop');
assert.equal(cache.stats.misses, 3);
assert.equal(cache.stats.entries, 1, 'invalidating a prop replaces rather than leaks its surface');

prop.workActivity = { actorId: 'worker-a', motion: 'pump', response: 'water', frame: 2 };
cache.draw(output, staticEntry, prop, 7, state, 41, 50);
prop.workActivity.frame = 3;
cache.draw(output, staticEntry, prop, 7, state, 41, 50);
assert.equal(staticDraws, 3, 'transient work overlays do not rebuild an unchanged base prop');
assert.equal(cache.stats.hits, 3);

let animatedDraws = 0;
const animatedEntry = {
  animated: true,
  draw(ctx, x, y) {
    animatedDraws += 1;
    ctx.fillRect(x, y, 2, 2);
  }
};
const animatedProp = { kind: 'test-flame' };
cache.draw(output, animatedEntry, animatedProp, 1, { prop: animatedProp }, 0, 0);
cache.draw(output, animatedEntry, animatedProp, 1, { prop: animatedProp }, 0, 0);
assert.equal(animatedDraws, 1, 'one prepared animated raster is shared by mask and model composites in the same state');
cache.draw(output, animatedEntry, animatedProp, 1, { prop: animatedProp, flicker: 1 }, 0, 0);
assert.equal(animatedDraws, 2, 'a changed visible animation state rebuilds the prepared raster');
cache.draw(output, animatedEntry, animatedProp, 1, { prop: animatedProp }, 0, 0);
assert.equal(animatedDraws, 2, 'a previously prepared animation state is reused when the cycle returns');
assert.equal(cache.stats.entries, 3, 'visible animation states share the ordinary bounded prop cache');

const oversizeCache = new PropSpriteCache({ maxBytes: 1, maxEntries: 1 });
const oversizeOutput = new FakeContext(new FakeCanvas());
const oversizeProp = { kind: 'oversize' };
oversizeCache.draw(
  oversizeOutput,
  { draw(ctx) { ctx.fillRect(-20, -20, 40, 40); } },
  oversizeProp,
  1,
  { prop: oversizeProp },
  0,
  0
);
assert.equal(oversizeOutput.drawImageCalls, 1, 'one oversized entry remains drawable despite the soft byte cap');

cache.clear();
assert.deepEqual(cache.stats, { entries: 0, bytes: 0, hits: 0, misses: 0, evictions: 0 });

function noiseMarks(x, y) {
  const marks = [];
  const ctx = {
    fillStyle: null,
    fillRect(px, py, width, height) {
      marks.push([px - x, py - y, width, height, this.fillStyle]);
    }
  };
  drawNoisePixels(ctx, x, y, 30, 18, ['#111111', '#222222'], 0.08, 37);
  return marks;
}
assert.deepEqual(
  noiseMarks(14, 22),
  noiseMarks(114, 122),
  'seeded surface noise stays attached to the prop instead of changing with screen position'
);

console.log('propSpriteCache: reuse, invalidation, bounded animation states, bounds, memory, and stable noise passed.');
