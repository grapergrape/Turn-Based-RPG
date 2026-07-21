import assert from 'node:assert/strict';

import { PALETTE } from '../src/render/palette.js';
import { IsometricRenderer } from '../src/render/IsometricRenderer.js';

const calls = [];

function mockContext(canvas) {
  const state = { globalAlpha: 1, fillStyle: PALETTE.void };
  const stack = [];
  return {
    canvas,
    imageSmoothingEnabled: false,
    get globalAlpha() { return state.globalAlpha; },
    set globalAlpha(value) { state.globalAlpha = value; },
    get fillStyle() { return state.fillStyle; },
    set fillStyle(value) { state.fillStyle = value; },
    save() { stack.push({ ...state }); },
    restore() {
      const prev = stack.pop();
      if (prev) {
        state.globalAlpha = prev.globalAlpha;
        state.fillStyle = prev.fillStyle;
      }
    },
    beginPath() {},
    rect() {},
    clip() {},
    drawImage() {},
    fillRect(x, y, w, h) {
      calls.push({ x, y, w, h, color: state.fillStyle, alpha: state.globalAlpha });
    },
    strokeRect() {},
    moveTo() {},
    lineTo() {},
    closePath() {},
    fill() {},
    stroke() {},
    set strokeStyle(value) { this._strokeStyle = value; },
    get strokeStyle() { return this._strokeStyle; },
    set lineWidth(value) { this._lineWidth = value; },
    get lineWidth() { return this._lineWidth; },
    set font(value) { this._font = value; },
    get font() { return this._font; },
    set textBaseline(value) { this._textBaseline = value; },
    get textBaseline() { return this._textBaseline; },
    measureText(text) { return { width: String(text).length * 6 }; },
    fillText() {}
  };
}

function mockCanvas(width = 640, height = 480) {
  const canvas = { width, height };
  canvas.getContext = () => mockContext(canvas);
  return canvas;
}

globalThis.document = {
  createElement() {
    return mockCanvas(640, 384);
  }
};

const renderer = new IsometricRenderer(mockCanvas(), {});
renderer.scene.width = 640;
renderer.scene.height = 384;
renderer.sceneOrigin = { x: 320, y: 64 };
renderer.mood = { sun: { enabled: true } };

renderer.renderFrame({
  focus: { x: 0, y: 0 },
  actors: [],
  effects: [],
  anim: {},
  time: { phase: 'deep-night' },
  ui: { log: [], controls: [] }
});

const blueWash = calls.find((call) =>
  call.x === 0 &&
  call.y === 0 &&
  call.w === 640 &&
  call.h === 384 &&
  call.color === PALETTE.clothBlueDark
);
const darkWash = calls.find((call) =>
  call.x === 0 &&
  call.y === 0 &&
  call.w === 640 &&
  call.h === 384 &&
  call.color === PALETTE.void &&
  call.alpha === 0.14
);

assert.ok(blueWash, 'deep night applies a blue night wash');
assert.equal(blueWash.alpha, 0.28);
assert.ok(darkWash, 'deep night applies only a bounded dark wash');
assert.ok(darkWash.alpha < 0.2, 'deep night darkness remains below blackout alpha');

calls.length = 0;
renderer.mood = {
  ambient: PALETTE.rustDark,
  ambientAlpha: 0.1,
  vignette: 1.3
};
renderer.renderFrame({
  focus: { x: 0, y: 0 },
  actors: [],
  effects: [],
  anim: {},
  time: { phase: 'deep-night' },
  ui: { log: [], controls: [] }
});

const indoorNightWash = calls.find((call) =>
  call.x === 0 &&
  call.y === 0 &&
  call.w === 640 &&
  call.h === 384 &&
  (call.color === PALETTE.clothBlueDark || (call.color === PALETTE.void && call.alpha === 0.14))
);
const indoorAmbient = calls.find((call) =>
  call.x === 0 &&
  call.y === 0 &&
  call.w === 640 &&
  call.h === 384 &&
  call.color === PALETTE.rustDark &&
  call.alpha === 0.1
);
const indoorVignetteBands = calls.filter((call) =>
  call.color === PALETTE.void &&
  call.alpha > 0.1 &&
  call.alpha < 0.2 &&
  (call.w === 5 || call.h === 5)
);

assert.equal(indoorNightWash, undefined, 'indoor scenes do not receive the clock phase wash');
assert.ok(indoorAmbient, 'indoor authored ambient lighting remains active');
assert.ok(indoorVignetteBands.length > 0, 'indoor authored vignette remains active');
assert.ok(indoorVignetteBands.every((call) => Math.abs(call.alpha - 0.13) < 1e-9), 'indoor vignette ignores clock phase strength');
