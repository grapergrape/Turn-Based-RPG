import assert from 'node:assert/strict';

import { createActor } from '../src/entities/ActorFactory.js';
import { PALETTE } from '../src/render/palette.js';
import {
  PLAYER_BODY_TYPE_IDS,
  PLAYER_GENDER_MODEL_IDS,
  SPRITE_POSE_FRAME_COUNTS,
  bakeMara,
  deriveMaraStyle
} from '../src/render/SpriteAtlas.js';
import { drawAdultAnatomy, drawAdultChest } from '../src/render/sprites/spriteBake.js';

function createMockContext() {
  return {
    imageSmoothingEnabled: false,
    fillStyle: '#000000',
    fillRect() {}
  };
}

function createRecordingContext() {
  return {
    imageSmoothingEnabled: false,
    fillStyle: '#000000',
    calls: [],
    fillRect(x, y, w, h) {
      this.calls.push({ x, y, w, h, color: this.fillStyle });
    }
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

const naked = deriveMaraStyle({});

assert.equal(naked.coat, naked.skin);
assert.equal(naked.coatHi, naked.skinHi);
assert.equal(naked.coatLo, naked.skinLo);
assert.equal(naked.coatDk, naked.skinDk);
assert.equal(naked.pants, naked.skin);
assert.equal(naked.pantsHi, naked.skinHi);
assert.equal(naked.pantsLo, naked.skinLo);
assert.equal(naked.pantsDk, naked.skinDk);
assert.equal(naked.belt, null);
assert.equal(naked.bareFeet, true);
assert.equal(naked.bareHead, true);
assert.equal(naked.fieldHarness, false);
assert.equal(naked.vest, null);
assert.equal(naked.bodyFrame, 'feminine');
assert.equal(naked.anatomy, 'vulva');
assert.equal(naked.breastSize, 5);
assert.equal(naked.penisSize, 0);
assert.equal(naked.anatomyVisible, true);

const dressed = deriveMaraStyle({
  clothes: 'censure-field-coat',
  armor: 'scarred-leather-vest',
  boots: 'ash-road-boots',
  helmet: 'censure-hood'
});

assert.equal(dressed.coat, PALETTE.stoneDust);
assert.equal(dressed.pants, PALETTE.clothDark);
assert.equal(dressed.belt, PALETTE.rustDark);
assert.equal(dressed.bareFeet, false);
assert.equal(dressed.bareHead, false);
assert.equal(dressed.fieldHarness, true);
assert.equal(dressed.vest.mid, PALETTE.rustMid);
assert.equal(dressed.anatomyVisible, false);

const masculineModel = deriveMaraStyle({}, {}, {
  genderModel: 'male'
});

assert.equal(masculineModel.bodyFrame, 'masculine');
assert.equal(masculineModel.anatomy, 'penis');
assert.equal(masculineModel.breastSize, 1);
assert.equal(masculineModel.penisSize, 5);
assert.equal(masculineModel.anatomyVisible, true);
assert.ok(masculineModel.shoulders > naked.shoulders);

const customSizes = deriveMaraStyle({}, {}, {
  genderModel: 'female',
  breastSize: 9,
  penisSize: 3
});

assert.equal(customSizes.breastSize, 9);
assert.equal(customSizes.penisSize, 3);

const feminineWithPenis = deriveMaraStyle({}, {}, {
  bodyFrame: 'feminine',
  anatomy: 'penis'
});

assert.equal(feminineWithPenis.bodyFrame, 'feminine');
assert.equal(feminineWithPenis.anatomy, 'penis');
assert.equal(feminineWithPenis.anatomyVisible, true);
assert.equal(feminineWithPenis.shoulders, naked.shoulders);

const masculineWithVulva = deriveMaraStyle({}, {}, {
  bodyFrame: 'masculine',
  anatomy: 'vulva'
});

assert.equal(masculineWithVulva.bodyFrame, 'masculine');
assert.equal(masculineWithVulva.anatomy, 'vulva');
assert.equal(masculineWithVulva.anatomyVisible, true);

const androgynousSmooth = deriveMaraStyle({}, {}, {
  genderModel: 'androgynous'
});

assert.equal(androgynousSmooth.bodyFrame, 'androgynous');
assert.equal(androgynousSmooth.anatomy, 'smooth');
assert.equal(androgynousSmooth.anatomyVisible, true);
assert.ok(androgynousSmooth.waist < masculineModel.waist);

const buffMale = deriveMaraStyle({}, {}, {
  genderModel: 'male',
  bodyType: 'buff',
  skinTone: 'dark',
  hairColor: 'black',
  hairStyle: 'loose',
  facialHair: 'beard'
});

assert.equal(buffMale.genderModel, 'male');
assert.equal(buffMale.bodyType, 'buff');
assert.equal(buffMale.skinTone, 'dark');
assert.equal(buffMale.hairStyle, 'loose');
assert.equal(buffMale.facialHair, 'beard');
assert.ok(buffMale.shoulders > masculineModel.shoulders);
assert.ok(buffMale.armSize > masculineModel.armSize);

const intersex = deriveMaraStyle({}, {}, {
  bodyFrame: 'androgynous',
  anatomy: 'intersex'
});

assert.equal(intersex.anatomy, 'intersex');
assert.equal(intersex.anatomyVisible, true);

{
  const ctx = createRecordingContext();
  drawAdultAnatomy(ctx, { bodyCx: 20 }, 30, { view: 'front', back: false, side: 0, bodyTurn: 0 }, {}, naked);
  assert.ok(ctx.calls.some((call) => call.color === naked.skinDk && call.w === 1 && call.h === 2));
  assert.equal(ctx.calls.some((call) => call.color === naked.skinDk && call.w === 1 && call.h === 3), false);
}

{
  const ctx = createRecordingContext();
  drawAdultAnatomy(ctx, { bodyCx: 20 }, 30, { view: 'front', back: false, side: 0, bodyTurn: 0 }, {}, dressed);
  assert.equal(ctx.calls.length, 0);
}

{
  const ctx = createRecordingContext();
  drawAdultAnatomy(ctx, { bodyCx: 20, waistW: 8 }, 30, { view: 'front', back: false, side: 0, bodyTurn: 0 }, {}, customSizes);
  assert.ok(ctx.calls.some((call) => call.color === customSizes.skinLo && call.w >= 2));
}

{
  const small = deriveMaraStyle({}, {}, { genderModel: 'male', penisSize: 2 });
  const large = deriveMaraStyle({}, {}, { genderModel: 'male', penisSize: 9 });
  const smallCtx = createRecordingContext();
  const largeCtx = createRecordingContext();
  drawAdultAnatomy(smallCtx, { bodyCx: 20, waistW: 8 }, 30, { view: 'front', back: false, side: 0, bodyTurn: 0 }, {}, small);
  drawAdultAnatomy(largeCtx, { bodyCx: 20, waistW: 8 }, 30, { view: 'front', back: false, side: 0, bodyTurn: 0 }, {}, large);
  const skinLoArea = (calls, color) => calls
    .filter((call) => call.color === color)
    .reduce((total, call) => total + call.w * call.h, 0);
  assert.ok(skinLoArea(largeCtx.calls, large.skinLo) > skinLoArea(smallCtx.calls, small.skinLo));
}

{
  const ctx = createRecordingContext();
  drawAdultChest(ctx, { bodyCx: 20, waistW: 9 }, 18, { view: 'front', back: false, side: 0, bodyTurn: 0 }, {}, naked);
  assert.ok(ctx.calls.length > 0);
  assert.ok(ctx.calls.some((call) => call.color === naked.skinLo));
}

const actor = createActor({
  id: 'test-player',
  name: 'Test Player',
  type: 'player',
  stats: { hp: 10, maxHp: 10, actionPoints: 6 },
  appearance: {
    bodyFrame: 'masculine',
    anatomy: 'vulva'
  }
}, { x: 0, y: 0 });

assert.deepEqual(actor.appearance, {
  bodyFrame: 'masculine',
  anatomy: 'vulva'
});

assert.equal(SPRITE_POSE_FRAME_COUNTS.sneak, 8);
assert.equal(SPRITE_POSE_FRAME_COUNTS.sneakIdle, 4);
assert.equal(SPRITE_POSE_FRAME_COUNTS.walk, 8);

for (const genderModel of PLAYER_GENDER_MODEL_IDS) {
  for (const bodyType of PLAYER_BODY_TYPE_IDS) {
    const style = deriveMaraStyle({}, {}, {
      genderModel,
      bodyType,
      skinTone: 'tan',
      hairColor: 'brown',
      hairStyle: 'cropped',
      facialHair: genderModel === 'male' ? 'stubble' : 'none'
    });
    assert.equal(style.anatomyVisible, true);
    assert.equal(style.coat, style.skin);
    assert.equal(style.pants, style.skin);

    const sprite = bakeMara({}, {}, {
      genderModel,
      bodyType,
      skinTone: 'tan',
      hairColor: 'brown',
      hairStyle: 'cropped',
      facialHair: genderModel === 'male' ? 'stubble' : 'none'
    });
    assert.equal(sprite.death.length, 10);
    for (const state of ['idle', 'walk', 'sneak', 'sneakIdle', 'attack', 'hit']) {
      assert.equal(sprite.frames[state].s.length, SPRITE_POSE_FRAME_COUNTS[state]);
    }
  }
}
