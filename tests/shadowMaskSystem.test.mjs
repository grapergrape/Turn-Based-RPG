import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

import { SPRITE_CATALOG } from '../src/render/spriteCatalog.js';
import {
  DEFAULT_SHADOW_MASK_BYTES,
  ShadowMaskCache,
  buildCastMask,
  buildContactMask,
  buildOutlineMask,
  unionBinaryMasks
} from '../src/render/ShadowMaskCache.js';

const entries = Object.entries(SPRITE_CATALOG);
const volumetric = entries.filter(([, entry]) => !entry.flat);
assert.equal(entries.length, 233, 'the shadow migration must cover the current complete catalog');
assert.equal(volumetric.length, 204, 'the shadow migration must cover all current volumetric kinds');
assert.equal(DEFAULT_SHADOW_MASK_BYTES, 24 * 1024 * 1024);

for (const [kind, entry] of entries) {
  const shadow = entry.shadow;
  assert.ok(shadow && typeof shadow === 'object', `${kind} must resolve a shadow profile`);
  assert.ok(shadow.contact && shadow.cast, `${kind} must resolve both mask channels`);
  assert.ok(['ground-band', 'full-silhouette', 'custom', 'none'].includes(shadow.contact.mode), `${kind} contact mode is invalid`);
  assert.ok(['silhouette', 'custom', 'none'].includes(shadow.cast.mode), `${kind} cast mode is invalid`);
  for (const field of ['depth', 'spread', 'offsetX', 'offsetY', 'alphaScale']) {
    assert.equal(Number.isFinite(shadow.contact[field]), true, `${kind} contact.${field} must be finite`);
  }
  for (const field of ['referenceHeight', 'alphaScale']) {
    assert.equal(Number.isFinite(shadow.cast[field]), true, `${kind} cast.${field} must be finite`);
  }
  assert.ok(shadow.contact.spread >= 0 && shadow.contact.spread <= 1, `${kind} may expand by at most one native pixel`);
  if (shadow.contact.mode === 'none') assert.ok(shadow.contact.reason, `${kind} reviewed contact none needs a reason`);
  if (shadow.cast.mode === 'none') assert.ok(shadow.cast.reason, `${kind} reviewed cast none needs a reason`);
  if (entry.flat) {
    assert.equal(shadow.contact.mode, 'none', `${kind} flat contact must be none`);
    assert.equal(shadow.cast.mode, 'none', `${kind} flat cast must be none`);
  }
}

function sourceFor(width, height, offsetX = -width / 4, offsetY = -(height - 1) / 2) {
  return { surface: { width, height }, offsetX, offsetY };
}

function alphaRaster(width, height, points) {
  const alpha = new Uint8Array(width * height);
  for (const [x, y, value = 255] of points) alpha[y * width + x] = value;
  return alpha;
}

function filled(mask) {
  const result = [];
  for (let y = 0; y < mask.height; y += 1) {
    for (let x = 0; x < mask.width; x += 1) {
      if (mask.data[y * mask.width + x]) result.push(`${x},${y}`);
    }
  }
  return result;
}

const feetSource = sourceFor(10, 8, -2.5, -3.5);
const feetAlpha = alphaRaster(10, 8, [
  [1, 5], [2, 5], [1, 6], [2, 6],
  [7, 5], [8, 5], [7, 6], [8, 6]
]);
const contactProfile = {
  mode: 'ground-band', depth: 2, spread: 1, offsetX: 0, offsetY: 0,
  alphaScale: 0.3, opacityThreshold: 128
};
const feetContact = buildContactMask(feetAlpha, feetSource, contactProfile);
assert.ok(feetContact, 'separated supports produce a contact mask');
assert.ok(filled(feetContact).length < feetContact.width * feetContact.height, 'contact geometry is not a generic rectangle');
const middleColumn = Math.floor(feetContact.width / 2);
assert.ok(
  Array.from({ length: feetContact.height }, (_, y) => feetContact.data[y * feetContact.width + middleColumn]).some((value) => value === 0),
  'separated supports retain a gap after the one-native-pixel expansion'
);

const turnedAlpha = alphaRaster(10, 8, [
  [3, 4], [4, 4], [3, 5], [4, 5],
  [5, 6], [6, 6], [5, 7], [6, 7]
]);
const turnedContact = buildContactMask(turnedAlpha, feetSource, contactProfile);
assert.notDeepEqual(filled(turnedContact), filled(feetContact), 'contact geometry changes with the current orientation or state silhouette');

const lightPoolAlpha = alphaRaster(10, 8, [
  ...Array.from({ length: 10 }, (_, x) => [x, 6, 32]),
  [4, 5, 255], [5, 5, 255], [4, 6, 255], [5, 6, 255]
]);
const lightContact = buildContactMask(lightPoolAlpha, feetSource, { ...contactProfile, opacityThreshold: 192, spread: 0 });
assert.ok(filled(lightContact).length <= 4, 'low-alpha authored light pools never enter the contact mask');

const uprightAlpha = alphaRaster(10, 8, [
  [4, 0], [5, 0], [4, 1], [5, 1],
  [3, 2], [4, 2], [5, 2], [6, 2],
  [3, 3], [4, 3], [5, 3], [6, 3],
  [4, 4], [5, 4], [4, 5], [5, 5], [4, 6], [5, 6]
]);
const castProfile = { mode: 'silhouette', referenceHeight: 4, alphaScale: 1, opacityThreshold: 128 };
const cast = buildCastMask(uprightAlpha, feetSource, castProfile, { x: 4, y: 2 }, 1);
assert.ok(cast, 'an upright silhouette produces a projected cast mask');
assert.ok(filled(cast).length < cast.width * cast.height, 'projected cast geometry is not a category diamond or rectangle');
const turnedCast = buildCastMask(turnedAlpha, feetSource, castProfile, { x: 4, y: 2 }, 1);
assert.notDeepEqual(filled(turnedCast), filled(cast), 'cast geometry derives from the current silhouette');
assert.ok([...cast.data].every((value) => value === 0 || value === 1), 'cast masks contain hard native pixels only');

const outline = buildOutlineMask(uprightAlpha, feetSource, '#ffffff', 128);
assert.ok(outline, 'a visible raster produces a hover outline');
assert.ok([...outline.data].every((value) => value === 0 || value === 1), 'hover rims contain hard native pixels only');

const union = new Uint8Array(12 * 12);
const unionMask = { data: new Uint8Array([1, 1, 1, 1]), width: 2, height: 2 };
unionBinaryMasks(union, 12, unionMask, 4, 4);
unionBinaryMasks(union, 12, unionMask, 5, 5);
assert.equal(Math.max(...union), 1, 'overlapping cast masks remain a constant-alpha binary union');

class FakeContext {
  constructor(canvas) {
    this.canvas = canvas;
    this.fillStyle = '#000000';
    this.globalAlpha = 1;
    this.globalCompositeOperation = 'source-over';
    this.imageSmoothingEnabled = false;
  }
  setTransform() {}
  fillRect() {}
  getImageData() { return { data: this.canvas.pixels }; }
}
class FakeCanvas {
  constructor(width = 8, height = 8, opaque = true) {
    this._width = width;
    this._height = height;
    this.pixels = new Uint8ClampedArray(width * height * 4);
    if (opaque) for (let index = 3; index < this.pixels.length; index += 4) this.pixels[index] = 255;
    this.context = new FakeContext(this);
    this.listeners = new Map();
  }
  get width() { return this._width; }
  set width(value) { this._width = value; this.pixels = new Uint8ClampedArray(this._width * this._height * 4); }
  get height() { return this._height; }
  set height(value) { this._height = value; this.pixels = new Uint8ClampedArray(this._width * this._height * 4); }
  getContext() { return this.context; }
  addEventListener(type, listener) { this.listeners.set(type, listener); }
  dispatch(type) { this.listeners.get(type)?.({ preventDefault() {} }); }
}

globalThis.document = { createElement: () => new FakeCanvas(1, 1, false) };
const recoverable = new ShadowMaskCache();
const recoverableSurface = new FakeCanvas(8, 8, true);
const recoverableSource = { surface: recoverableSurface, offsetX: -2, offsetY: -3.5 };
const firstOutline = recoverable.prepareOutline(recoverableSource, '#ffffff');
firstOutline.surface.dispatch('contextlost');
const rebuiltOutline = recoverable.prepareOutline(recoverableSource, '#ffffff');
assert.notEqual(rebuiltOutline, firstOutline, 'a lost mask surface is rebuilt from retained source alpha');

const bounded = new ShadowMaskCache({ maxBytes: 900, maxSources: 2 });
for (let index = 0; index < 4; index += 1) {
  const surface = new FakeCanvas(8, 8, true);
  bounded.prepareOutline({ surface, offsetX: -2, offsetY: -3.5 }, '#ffffff');
}
assert.ok(bounded.stats.sources <= 2, 'the mask cache evicts old source families');
assert.ok(bounded.stats.bytes <= 900, 'the mask cache respects its configured byte cap when one record fits');
bounded.clear();
assert.deepEqual(bounded.stats, { sources: 0, masks: 0, bytes: 0, hits: 0, misses: 0, evictions: 0 });

const guardedRoots = [
  new URL('../src/', import.meta.url),
  new URL('../scripts/', import.meta.url),
  new URL('../.ai/map-review/', import.meta.url)
];
for (const file of (await Promise.all(guardedRoots.map(sourceFiles))).flat()) {
  const source = await readFile(file, 'utf8');
  assert.equal(/drawShadowBlob|drawDaylightCastShadow|drawPixelShadow/.test(source), false, `${file} reintroduced a legacy generic shadow helper`);
}

console.log('shadowMaskSystem: 204 profiles, silhouette masks, union, rim, cache budget, and legacy guard passed.');

async function sourceFiles(rootUrl) {
  const root = path.resolve(rootUrl.pathname);
  const files = [];
  async function walk(dir) {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) await walk(full);
      else if (entry.isFile() && /\.(?:html|js|mjs)$/.test(entry.name)) files.push(full);
    }
  }
  await walk(root);
  return files;
}
