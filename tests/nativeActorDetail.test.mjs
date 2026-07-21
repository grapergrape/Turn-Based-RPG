import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { PALETTE } from '../src/render/palette.js';
import { NATIVE_PIXEL, NATIVE_SCALE } from '../src/render/renderConfig.js';
import {
  SPRITE_ATLAS_IDS,
  SPRITE_POSE_FRAME_COUNTS,
  bakeHumanAppearance,
  buildSpriteAtlas,
  isHumanAppearance,
  spriteIdForHumanAppearance
} from '../src/render/SpriteAtlas.js';

const palette = new Set(Object.values(PALETTE));

function recordingCanvas() {
  const audit = {
    calls: 0,
    nativeCalls: 0,
    invalidColors: new Set(),
    gridErrors: [],
    dimensionErrors: [],
    transform: null
  };
  const canvas = { width: 0, height: 0, __nativeActorAudit: audit };
  const ctx = {
    imageSmoothingEnabled: true,
    fillStyle: PALETTE.void,
    setTransform(...values) {
      audit.transform = values;
    },
    fillRect(x, y, w, h) {
      audit.calls += 1;
      if (w === NATIVE_PIXEL || h === NATIVE_PIXEL) audit.nativeCalls += 1;
      if (!palette.has(this.fillStyle)) audit.invalidColors.add(this.fillStyle);
      for (const [name, value] of Object.entries({ x, y, w, h })) {
        if (!Number.isFinite(value) || !Number.isInteger(value * NATIVE_SCALE)) {
          if (audit.gridErrors.length < 4) audit.gridErrors.push(`${name}=${value}`);
        }
      }
      if (w < NATIVE_PIXEL || h < NATIVE_PIXEL) {
        if (audit.dimensionErrors.length < 4) audit.dimensionErrors.push(`${w}x${h}`);
      }
    }
  };
  canvas.getContext = (type) => {
    assert.equal(type, '2d');
    return ctx;
  };
  return canvas;
}

globalThis.document = {
  createElement(tag) {
    assert.equal(tag, 'canvas');
    return recordingCanvas();
  }
};

const FACINGS = Object.freeze(['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw']);
const DEATH_FRAME_COUNT = 10;
const LIVE_FRAMES_PER_MODEL = FACINGS.length * Object.values(SPRITE_POSE_FRAME_COUNTS)
  .reduce((sum, count) => sum + count, 0);
const FRAMES_PER_MODEL = LIVE_FRAMES_PER_MODEL + DEATH_FRAME_COUNT;

function assertFrame(label, frame, sprite) {
  assert.ok(frame, `${label} produces a canvas`);
  assert.equal(frame.width, sprite.width * NATIVE_SCALE, `${label} native width`);
  assert.equal(frame.height, sprite.height * NATIVE_SCALE, `${label} native height`);
  const audit = frame.__nativeActorAudit;
  assert.ok(audit, `${label} exposes its native audit`);
  assert.deepEqual(audit.transform, [NATIVE_SCALE, 0, 0, NATIVE_SCALE, 0, 0], `${label} uses the native transform`);
  assert.ok(audit.calls > 0, `${label} draws hard pixels`);
  assert.ok(audit.nativeCalls > 0, `${label} includes one-backing-pixel redraw detail`);
  assert.deepEqual([...audit.invalidColors], [], `${label} stays inside the project palette`);
  assert.deepEqual(audit.gridErrors, [], `${label} stays on the half-logical-pixel grid`);
  assert.deepEqual(audit.dimensionErrors, [], `${label} never draws below one backing pixel`);
}

function auditSprite(label, sprite) {
  assert.ok(Number.isInteger(sprite.width) && sprite.width > 0, `${label} has a logical width`);
  assert.ok(Number.isInteger(sprite.height) && sprite.height > 0, `${label} has a logical height`);
  let frameCount = 0;
  for (const [state, expectedCount] of Object.entries(SPRITE_POSE_FRAME_COUNTS)) {
    assert.ok(sprite.frames[state], `${label} provides ${state}`);
    for (const facing of FACINGS) {
      const frames = sprite.frames[state][facing];
      assert.equal(frames.length, expectedCount, `${label}/${state}/${facing} frame count`);
      for (let frame = 0; frame < frames.length; frame += 1) {
        assertFrame(`${label}/${state}/${facing}/${frame}`, frames[frame], sprite);
        frameCount += 1;
      }
    }
  }
  assert.equal(sprite.death.length, DEATH_FRAME_COUNT, `${label} death frame count`);
  for (let frame = 0; frame < sprite.death.length; frame += 1) {
    assertFrame(`${label}/death/${frame}`, sprite.death[frame], sprite);
    frameCount += 1;
  }
  assert.equal(frameCount, FRAMES_PER_MODEL, `${label} exhaustive frame total`);
  return frameCount;
}

async function jsonFilesUnder(root) {
  const entries = await readdir(root, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const target = path.join(root, entry.name);
    if (entry.isDirectory()) files.push(...await jsonFilesUnder(target));
    else if (entry.isFile() && entry.name.endsWith('.json')) files.push(target);
  }
  return files;
}

function collectHumanAppearances(value, appearances) {
  if (!value || typeof value !== 'object') return;
  if (Array.isArray(value)) {
    for (const child of value) collectHumanAppearances(child, appearances);
    return;
  }
  for (const [key, child] of Object.entries(value)) {
    if (key === 'appearance' && isHumanAppearance(child)) {
      appearances.set(spriteIdForHumanAppearance(child), child);
    }
    collectHumanAppearances(child, appearances);
  }
}

const atlas = buildSpriteAtlas();
assert.deepEqual(Object.keys(atlas).sort(), [...SPRITE_ATLAS_IDS].sort(), 'atlas ids and constructed sprites stay in lockstep');

let registeredFrames = 0;
for (const id of SPRITE_ATLAS_IDS) registeredFrames += auditSprite(`atlas:${id}`, atlas[id]);

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dataFiles = await jsonFilesUnder(path.join(repoRoot, 'data'));
const appearances = new Map();
for (const file of dataFiles) {
  const value = JSON.parse(await readFile(file, 'utf8'));
  collectHumanAppearances(value, appearances);
}

let compositeFrames = 0;
for (const [id, appearance] of [...appearances].sort(([left], [right]) => left.localeCompare(right))) {
  compositeFrames += auditSprite(`data:${id}`, bakeHumanAppearance(appearance));
}

assert.equal(registeredFrames, SPRITE_ATLAS_IDS.length * FRAMES_PER_MODEL, 'registered frame inventory is exhaustive');
assert.equal(compositeFrames, appearances.size * FRAMES_PER_MODEL, 'data-driven frame inventory is exhaustive');

console.log(
  `nativeActorDetail: ${SPRITE_ATLAS_IDS.length} atlas models and ${appearances.size} data appearances, ` +
  `${registeredFrames + compositeFrames} frames total, passed native sizing, palette, hard-pixel, and half-grid audits.`
);
