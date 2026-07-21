import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { PALETTE } from '../src/render/palette.js';
import { drawStyledFloorCell } from '../src/render/primitives/terrain.js';
import { SPRITE_CATALOG } from '../src/render/spriteCatalog.js';

function recordingContext() {
  const calls = [];
  const states = [];
  let path = [];
  const target = {
    calls,
    fillStyle: PALETTE.void,
    strokeStyle: PALETTE.void,
    globalAlpha: 1,
    globalCompositeOperation: 'source-over',
    lineWidth: 1,
    fillRect(x, y, w, h) {
      calls.push(['fillRect', x, y, w, h, this.fillStyle, this.globalAlpha]);
    },
    save() {
      states.push({
        fillStyle: this.fillStyle,
        strokeStyle: this.strokeStyle,
        globalAlpha: this.globalAlpha,
        globalCompositeOperation: this.globalCompositeOperation,
        lineWidth: this.lineWidth
      });
    },
    restore() {
      const state = states.pop();
      if (state) Object.assign(this, state);
    },
    beginPath() { path = []; },
    closePath() { path.push(['close']); },
    moveTo(x, y) { path.push(['move', x, y]); },
    lineTo(x, y) { path.push(['line', x, y]); },
    rect(x, y, w, h) { path.push(['rect', x, y, w, h]); },
    fill() { calls.push(['fill', structuredClone(path), this.fillStyle, this.globalAlpha]); },
    stroke() { calls.push(['stroke', structuredClone(path), this.strokeStyle, this.globalAlpha, this.lineWidth]); },
    clip() { calls.push(['clip', structuredClone(path)]); }
  };
  return new Proxy(target, {
    get(object, property) {
      if (property in object) return object[property];
      return (...args) => calls.push([String(property), ...args]);
    },
    set(object, property, value) {
      object[property] = value;
      return true;
    }
  });
}

function catalogSignature(kind, prop = {}, anim = {}) {
  const ctx = recordingContext();
  SPRITE_CATALOG[kind].draw(ctx, 96, 112, 37, {
    prop: {
      kind,
      x: 4,
      y: 4,
      orient: 'se',
      connected: {},
      opened: false,
      consumed: false,
      ...prop
    },
    anim: { tick: 0, pulse: 0, flicker: 0, idleFrame: 0, bob: 0, ...anim },
    pulse: 0,
    flicker: 0,
    player: null
  });
  return JSON.stringify(ctx.calls);
}

function floorSignature(style) {
  const ctx = recordingContext();
  for (let y = 0; y < 3; y += 1) {
    for (let x = 0; x < 3; x += 1) {
      drawStyledFloorCell(ctx, 96 + (x - y) * 32, 72 + (x + y) * 16, x + 11, y + 17, style);
    }
  }
  return JSON.stringify(ctx.calls);
}

const replacementPairs = [
  ['south-measure-receiving-shelter', {}, 'canvas-tent', {}],
  ['south-measure-charity-canopy', {}, 'canvas-tent', {}],
  ['south-measure-arrival-hearth', {}, 'campfire', {}],
  ['south-measure-sleeping-pallet', {}, 'camp-bedroll', {}],
  ['south-measure-hand-pump', {}, 'water-pump', {}],
  ['south-measure-settling-vat', {}, 'settling-tank', {}],
  ['south-measure-medicine-cart', {}, 'medicine-cart', {}],
  ['south-measure-service-pack', {}, 'field-backpack', {}],
  ['south-measure-water-lesson', {}, 'chalk-drawing', {}],
  ['south-measure-brass-hook-memorial', {}, 'graveyard-remnant-cross', {}],
  ['south-measure-berm-block', {}, 'ash-tree', {}]
];

for (const [localKind, localProp, borrowedKind, borrowedProp] of replacementPairs) {
  assert.notEqual(
    catalogSignature(localKind, localProp),
    catalogSignature(borrowedKind, borrowedProp),
    `${localKind} must not be a renamed rendering of ${borrowedKind}`
  );
}

for (const [localFloor, borrowedFloor] of [
  ['south-measure-slab', 'stone'],
  ['south-measure-yard', 'packed-earth'],
  ['south-measure-row', 'farm-plank'],
  ['south-measure-grave-strip', 'graveyard-earth']
]) {
  assert.notEqual(
    floorSignature(localFloor),
    floorSignature(borrowedFloor),
    `${localFloor} must have a distinct rendered surface from ${borrowedFloor}`
  );
}

const tumbleweedEntry = SPRITE_CATALOG['south-measure-tumbleweed'];
assert.equal(tumbleweedEntry?.category, 'plant', 'the tumbleweed must be registered as a plant');
assert.equal(tumbleweedEntry?.animated, true, 'the tumbleweed must bypass the static prop cache');
assert.notEqual(
  catalogSignature('south-measure-tumbleweed', { phase: 0, direction: 1 }, { tick: 0.4 }),
  catalogSignature('south-measure-tumbleweed', { phase: 0, direction: 1 }, { tick: 0.9 }),
  'the tumbleweed must visibly advance through discrete rolling frames'
);
assert.notEqual(
  catalogSignature('south-measure-tumbleweed', { phase: 0, direction: 1 }, { tick: 0.4 }),
  catalogSignature('south-measure-tumbleweed', { phase: 0, direction: 1 }, { tick: 7 }),
  'the tumbleweed must have distinct gusting and resting poses'
);

const ashRoadSouth = JSON.parse(readFileSync(new URL('../data/levels/ash_road_south.json', import.meta.url), 'utf8'));
const tumbleweeds = ashRoadSouth.objects.filter((object) => object.kind === 'south-measure-tumbleweed');
assert.ok(tumbleweeds.length >= 8, 'Ash Road South must place tumbleweeds across several open outskirts');
assert.ok(tumbleweeds.every((object) => object.blocking === false), 'tumbleweeds must never block navigation');
assert.ok(tumbleweeds.every((object) => Number.isFinite(object.phase)), 'tumbleweeds need independent gust phases');
assert.deepEqual(new Set(tumbleweeds.map((object) => object.direction)), new Set([-1, 1]), 'both travel directions must be represented');

console.log(`ashRoadSouthArtIdentity: ${replacementPairs.length} model replacements, 4 floor families, and ${tumbleweeds.length} animated tumbleweeds render distinctly.`);
