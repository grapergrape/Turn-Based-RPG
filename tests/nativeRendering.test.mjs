import assert from 'node:assert/strict';

import { Input } from '../src/core/Input.js';
import {
  SOFTWARE_CANVAS_2D_OPTIONS,
  getSoftwareCanvasContext2D
} from '../src/render/canvasContext.js';
import {
  INTERNAL_HEIGHT,
  INTERNAL_WIDTH,
  LOGICAL_HEIGHT,
  LOGICAL_VIEWPORT_HEIGHT,
  LOGICAL_WIDTH,
  NATIVE_PIXEL,
  NATIVE_SCALE,
  NATIVE_TILE_HEIGHT,
  NATIVE_TILE_WIDTH,
  snapToNativePixel,
  toNativePixels
} from '../src/render/renderConfig.js';
import { StaticSceneCache } from '../src/render/StaticSceneCache.js';
import { bakeActor, makeLazyFrameList } from '../src/render/sprites/spriteBake.js';

assert.equal(NATIVE_SCALE, 2);
assert.equal(INTERNAL_WIDTH, 1280);
assert.equal(INTERNAL_HEIGHT, 960);
assert.equal(LOGICAL_WIDTH, 640);
assert.equal(LOGICAL_HEIGHT, 480);
assert.equal(LOGICAL_VIEWPORT_HEIGHT, 384);
assert.equal(NATIVE_TILE_WIDTH, 128);
assert.equal(NATIVE_TILE_HEIGHT, 64);
assert.equal(NATIVE_PIXEL, 0.5);
assert.equal(toNativePixels(31.5), 63);
assert.equal(snapToNativePixel(4.26), 4.5);

// Every runtime canvas requests the software Canvas2D backend. This prevents
// Firefox from routing this workload through its crash-prone accelerated path.
{
  let request = null;
  const context = { imageSmoothingEnabled: true };
  const canvas = {
    getContext(type, options) {
      request = { type, options };
      return context;
    }
  };
  assert.equal(getSoftwareCanvasContext2D(canvas), context);
  assert.deepEqual(request, {
    type: '2d',
    options: SOFTWARE_CANVAS_2D_OPTIONS
  });
  assert.equal(request.options.willReadFrequently, true);
  assert.equal(context.imageSmoothingEnabled, false);
}

// Pointer hit testing stays on the logical design grid even though the canvas
// backing store now contains four times as many physical pixels.
{
  const handlers = {};
  globalThis.window = { addEventListener() {} };
  const canvas = {
    width: INTERNAL_WIDTH,
    height: INTERNAL_HEIGHT,
    style: {},
    addEventListener(type, handler) { handlers[type] = handler; },
    getBoundingClientRect() {
      return { left: 100, top: 50, width: 1280, height: 960 };
    }
  };
  const input = new Input(canvas);
  handlers.mousedown({
    button: 0,
    clientX: 740,
    clientY: 530,
    ctrlKey: false,
    metaKey: false,
    shiftKey: false,
    preventDefault() {}
  });
  assert.deepEqual(input.consumeClick(), {
    x: 320,
    y: 240,
    button: 0,
    shiftKey: false,
    ctrlKey: false
  });
  let wheelPrevented = 0;
  handlers.wheel({ deltaY: 120, preventDefault() { wheelPrevented += 1; } });
  handlers.wheel({ deltaY: -120, preventDefault() { wheelPrevented += 1; } });
  assert.deepEqual(input.consume(), ['scroll-down', 'scroll-up']);
  assert.equal(wheelPrevented, 2);
}

let createdCanvases = 0;
function mockCanvas() {
  createdCanvases += 1;
  const transforms = [];
  const canvas = { width: 0, height: 0, transforms };
  const target = {
    canvas,
    imageSmoothingEnabled: false,
    globalAlpha: 1,
    globalCompositeOperation: 'source-over',
    setTransform(...args) { transforms.push(args); },
    fillRect() {},
    save() {},
    restore() {},
    beginPath() {},
    closePath() {},
    moveTo() {},
    lineTo() {},
    rect() {},
    clip() {},
    fill() {},
    stroke() {},
    strokeRect() {},
    arc() {},
    ellipse() {},
    translate() {},
    rotate() {},
    scale() {},
    drawImage() {},
    getImageData() { return { data: new Uint8ClampedArray([4, 4, 4, 255]) }; },
    measureText(text) { return { width: String(text).length * 6 }; },
    fillText() {}
  };
  const ctx = new Proxy(target, {
    get(object, property) {
      if (property in object) return object[property];
      return () => {};
    },
    set(object, property, value) {
      object[property] = value;
      return true;
    }
  });
  canvas.getContext = () => ctx;
  return canvas;
}

globalThis.document = {
  createElement(tag) {
    assert.equal(tag, 'canvas');
    return mockCanvas();
  }
};

// Lazy lists retain ordinary Array behavior while avoiding an eager bake of
// every actor, state, facing, and frame at native resolution.
{
  let bakes = 0;
  const frames = makeLazyFrameList(3, (index) => {
    bakes += 1;
    return { index };
  });
  assert.equal(frames.length, 3);
  assert.equal(bakes, 0);
  assert.deepEqual(frames[1], { index: 1 });
  assert.equal(bakes, 1);
  assert.deepEqual(frames[1], { index: 1 });
  assert.equal(bakes, 1);
  assert.equal(frames.at(-1).index, 2);
  assert.equal(bakes, 2);
}

{
  createdCanvases = 0;
  const sprite = bakeActor(42, 62, {
    coat: '#222222', coatHi: '#333333', coatLo: '#111111',
    pants: '#222222', pantsHi: '#333333', pantsLo: '#111111',
    skin: '#aa8866', skinHi: '#bb9977', skinLo: '#886644', skinDk: '#664422',
    boot: '#222222', bootHi: '#333333', bootLo: '#111111',
    hair: '#222222', hairHi: '#333333',
    belt: '#111111', weapon: '#777777'
  });
  assert.equal(createdCanvases, 0, 'actor construction does not eagerly allocate frame canvases');
  const frame = sprite.frames.idle.s[0];
  assert.equal(createdCanvases, 1);
  assert.equal(frame.width, sprite.width * NATIVE_SCALE);
  assert.equal(frame.height, sprite.height * NATIVE_SCALE);
  assert.deepEqual(frame.transforms[0], [NATIVE_SCALE, 0, 0, NATIVE_SCALE, 0, 0]);
}

// A large level keeps a bounded camera cache instead of allocating its full
// projected dimensions at 2x. The cache remains stable inside its margins and
// rebuilds only after the camera crosses them.
{
  const grid = {
    width: 100,
    height: 100,
    getTileDef() { return { kind: 'floor', floor: 'stone' }; },
    isInside(x, y) { return x >= 0 && y >= 0 && x < 100 && y < 100; }
  };
  const cache = new StaticSceneCache();
  const bounds = cache.setLevel({ grid, props: [], mood: null, hiddenTiles: new Set() });
  assert.ok(bounds.width > LOGICAL_WIDTH * 4);
  assert.ok(bounds.height > LOGICAL_VIEWPORT_HEIGHT * 4);

  const viewport = { width: LOGICAL_WIDTH, height: LOGICAL_VIEWPORT_HEIGHT };
  assert.equal(cache.ensure({ x: 1000, y: 1000 }, viewport), true);
  assert.equal(cache.buildCount, 1);
  assert.ok(cache.canvas.width <= toNativePixels(LOGICAL_WIDTH + 384));
  assert.ok(cache.canvas.height <= toNativePixels(LOGICAL_VIEWPORT_HEIGHT + 320));
  assert.equal(cache.ensure({ x: 1100, y: 1050 }, viewport), false);
  assert.equal(cache.buildCount, 1);
  assert.equal(cache.ensure({ x: 1300, y: 1200 }, viewport), true);
  assert.equal(cache.buildCount, 2);

  // Cache health must not synchronously read pixels from a GPU-backed canvas.
  // Browser context events and lifecycle invalidation own recovery instead.
  let readbacks = 0;
  cache.ctx.getImageData = () => {
    readbacks += 1;
    return { data: new Uint8ClampedArray([0, 0, 0, 0]) };
  };
  for (let frame = 0; frame < 90; frame += 1) {
    cache.ensure({ x: 1300, y: 1200 }, viewport);
  }
  assert.equal(readbacks, 0, 'static scene cache never polls pixels with getImageData');
  assert.equal(cache.buildCount, 2, 'a stable camera window remains cached without readback');

  cache.invalidate();
  assert.equal(cache.ensure({ x: 1300, y: 1200 }, viewport), true);
  assert.equal(cache.buildCount, 3, 'explicit lifecycle invalidation rebuilds the static cache');
  assert.equal(cache.consumeRecovery(), false);
}

console.log('nativeRendering: 2x backing store, logical input, lazy actors, and bounded scene cache passed.');
