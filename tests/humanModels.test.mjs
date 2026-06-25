import assert from 'node:assert/strict';

import {
  bakeHumanAppearance,
  buildSpriteAtlas,
  deriveHumanAppearanceStyle,
  HUMAN_ACCENT_IDS,
  HUMAN_BODY_IDS,
  HUMAN_GEAR_IDS,
  HUMAN_MODEL_IDS,
  HUMAN_MODEL_SUMMARY,
  HUMAN_OUTFIT_IDS,
  isHumanAppearance,
  spriteIdForHumanAppearance,
  SPRITE_ATLAS_IDS
} from '../src/render/SpriteAtlas.js';

function createMockContext() {
  return {
    imageSmoothingEnabled: false,
    fillStyle: '#000000',
    fillRect() {}
  };
}

globalThis.document = {
  createElement(tag) {
    assert.equal(tag, 'canvas');
    return {
      width: 0,
      height: 0,
      getContext(type) {
        assert.equal(type, '2d');
        return createMockContext();
      }
    };
  }
};

assert.ok(HUMAN_MODEL_SUMMARY.length >= 32);
assert.equal(HUMAN_MODEL_IDS.length, HUMAN_MODEL_SUMMARY.length);
assert.equal(new Set(HUMAN_MODEL_IDS).size, HUMAN_MODEL_IDS.length);
assert.ok(HUMAN_BODY_IDS.length >= 10);
assert.ok(HUMAN_OUTFIT_IDS.length >= 10);
assert.ok(HUMAN_GEAR_IDS.length >= 20);
assert.ok(HUMAN_ACCENT_IDS.length >= 8);

for (const model of HUMAN_MODEL_SUMMARY) {
  assert.equal(typeof model.id, 'string');
  assert.equal(typeof model.description, 'string');
  assert.ok(model.id.length > 0);
  assert.ok(model.description.length > 20);
}

const atlasIds = new Set(SPRITE_ATLAS_IDS);
for (const id of HUMAN_MODEL_IDS) {
  assert.ok(atlasIds.has(id), `${id} is missing from SPRITE_ATLAS_IDS`);
}

const hostWolfIds = ['host-wolf-spider', 'host-wolf-maw', 'host-wolf-ribsplit'];
for (const id of hostWolfIds) {
  assert.ok(atlasIds.has(id), `${id} is missing from SPRITE_ATLAS_IDS`);
}

const survivorAppearance = {
  body: 'broad',
  outfit: 'settlement-work-coat',
  gear: ['rope-coil', 'shoulder-plate', 'scarred-face'],
  accent: 'bare-brown'
};
const survivorSpriteId = spriteIdForHumanAppearance(survivorAppearance);
assert.ok(survivorSpriteId.startsWith('human-composite-broad-settlement-work-coat-bare-brown'));
assert.equal(
  survivorSpriteId,
  spriteIdForHumanAppearance({ ...survivorAppearance, gear: ['scarred-face', 'rope-coil', 'shoulder-plate'] })
);
assert.equal(isHumanAppearance(survivorAppearance), true);
assert.equal(isHumanAppearance({ bodyFrame: 'feminine' }), false);

const choirAppearance = {
  body: 'old-stooped',
  outfit: 'choir-dark-robe',
  gear: ['bone-scroll', 'confessor-staff'],
  accent: 'dark-cowl'
};
const survivorModel = deriveHumanAppearanceStyle(survivorAppearance);
assert.equal(survivorModel.width, 48);
assert.equal(survivorModel.height, 64);
assert.equal(survivorModel.appearance.gear.join(','), 'scarred-face,shoulder-plate,rope-coil');

const atlas = buildSpriteAtlas();
for (const id of HUMAN_MODEL_IDS) {
  const sprite = atlas[id];
  assert.ok(sprite, `${id} was not baked into the atlas`);
  assert.ok(sprite.width > 0);
  assert.ok(sprite.height > 0);
  assert.equal(sprite.death.length, 10);
  assert.ok(sprite.frames.idle.s.length > 0);
  assert.ok(sprite.frames.walk.se.length > 0);
  assert.ok(sprite.frames.attack.e.length > 0);
}

for (const id of hostWolfIds) {
  const sprite = atlas[id];
  assert.ok(sprite, `${id} was not baked into the atlas`);
  assert.equal(sprite.width, 72);
  assert.equal(sprite.height, 54);
  assert.equal(sprite.death.length, 10);
  assert.ok(sprite.frames.idle.s.length > 0);
  assert.ok(sprite.frames.walk.se.length > 0);
  assert.ok(sprite.frames.attack.e.length > 0);
  assert.ok(sprite.frames.hit.nw.length > 0);
  assert.ok(sprite.frames.interact.w.length > 0);
}

for (const appearance of [survivorAppearance, choirAppearance]) {
  const sprite = bakeHumanAppearance(appearance);
  assert.ok(sprite.width > 0);
  assert.ok(sprite.height > 0);
  assert.equal(sprite.death.length, 10);
  assert.ok(sprite.frames.idle.s.length > 0);
  assert.ok(sprite.frames.walk.se.length > 0);
  assert.ok(sprite.frames.attack.e.length > 0);
}
