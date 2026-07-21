import assert from 'node:assert/strict';

import { createActor } from '../src/entities/ActorFactory.js';
import { PALETTE } from '../src/render/palette.js';
import {
  PLAYER_DEFAULT_APPEARANCE,
  PLAYER_AGE_IDS,
  PLAYER_BODY_TYPE_IDS,
  PLAYER_FACE_MARK_IDS,
  PLAYER_FACE_SHAPE_IDS,
  PLAYER_FACIAL_HAIR_IDS,
  PLAYER_GENDER_MODEL_IDS,
  PLAYER_HAIR_COLOR_IDS,
  PLAYER_HAIR_STYLE_IDS,
  PLAYER_POSTURE_IDS,
  PLAYER_SKIN_TONE_IDS,
  PLAYER_STATURE_IDS,
  SPRITE_POSE_FRAME_COUNTS,
  bakePlayerCharacter,
  derivePlayerStyle
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

const naked = derivePlayerStyle({});

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
assert.equal(naked.stature, 'average');
assert.equal(naked.posture, 'upright');
assert.equal(naked.age, 'adult');
assert.equal(naked.faceShape, 'oval');
assert.equal(naked.faceMark, 'none');
assert.equal(naked.anatomy, 'vulva');
assert.equal(naked.breastSize, 5);
assert.equal(naked.penisSize, 0);
assert.equal(naked.anatomyVisible, true);

const dressed = derivePlayerStyle({
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

const masculineModel = derivePlayerStyle({}, {}, {
  genderModel: 'male'
});

assert.equal(masculineModel.bodyFrame, 'masculine');
assert.equal(masculineModel.anatomy, 'penis');
assert.equal(masculineModel.breastSize, 1);
assert.equal(masculineModel.penisSize, 5);
assert.equal(masculineModel.anatomyVisible, true);
assert.ok(masculineModel.shoulders > naked.shoulders);

const customSizes = derivePlayerStyle({}, {}, {
  genderModel: 'female',
  breastSize: 9,
  penisSize: 3
});

assert.equal(customSizes.breastSize, 9);
assert.equal(customSizes.penisSize, 3);

const feminineWithPenis = derivePlayerStyle({}, {}, {
  bodyFrame: 'feminine',
  anatomy: 'penis'
});

assert.equal(feminineWithPenis.bodyFrame, 'feminine');
assert.equal(feminineWithPenis.anatomy, 'penis');
assert.equal(feminineWithPenis.anatomyVisible, true);
assert.equal(feminineWithPenis.shoulders, naked.shoulders);

const masculineWithVulva = derivePlayerStyle({}, {}, {
  bodyFrame: 'masculine',
  anatomy: 'vulva'
});

assert.equal(masculineWithVulva.bodyFrame, 'masculine');
assert.equal(masculineWithVulva.anatomy, 'vulva');
assert.equal(masculineWithVulva.anatomyVisible, true);

const androgynousSmooth = derivePlayerStyle({}, {}, {
  genderModel: 'androgynous'
});

assert.equal(androgynousSmooth.bodyFrame, 'androgynous');
assert.equal(androgynousSmooth.anatomy, 'smooth');
assert.equal(androgynousSmooth.anatomyVisible, true);
assert.ok(androgynousSmooth.waist < masculineModel.waist);

const buffMale = derivePlayerStyle({}, {}, {
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

const intersex = derivePlayerStyle({}, {}, {
  bodyFrame: 'androgynous',
  anatomy: 'intersex'
});

assert.equal(intersex.anatomy, 'intersex');
assert.equal(intersex.anatomyVisible, true);

const roadWorn = derivePlayerStyle({}, {}, {
  stature: 'tall',
  posture: 'stooped',
  age: 'elder',
  faceShape: 'long',
  faceMark: 'eye-patch',
  skinTone: 'ruddy',
  hairColor: 'auburn',
  hairStyle: 'braid',
  facialHair: 'short-beard'
});

assert.equal(roadWorn.stature, 'tall');
assert.equal(roadWorn.posture, 'stooped');
assert.equal(roadWorn.age, 'elder');
assert.equal(roadWorn.faceShape, 'long');
assert.equal(roadWorn.faceMark, 'eye-patch');
assert.equal(roadWorn.skinTone, 'ruddy');
assert.equal(roadWorn.hairColor, 'auburn');
assert.equal(roadWorn.hairStyle, 'braid');
assert.equal(roadWorn.facialHair, 'short-beard');
assert.ok(roadWorn.legLength > naked.legLength);
assert.ok(roadWorn.hunch > naked.hunch);
assert.ok(roadWorn.headHeight > naked.headHeight);

const roadWornSprite = bakePlayerCharacter({}, {}, {
  age: 'elder',
  faceShape: 'long',
  faceMark: 'eye-patch',
  hairColor: 'auburn',
  hairStyle: 'braid',
  facialHair: 'short-beard',
  bodyType: 'stocky',
  stature: 'tall',
  posture: 'stooped'
});
for (const [state, count] of Object.entries(SPRITE_POSE_FRAME_COUNTS)) {
  for (const facing of ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw']) {
    assert.equal(roadWornSprite.frames[state][facing].length, count);
  }
}
assert.equal(roadWornSprite.death.length, 10);

const shortUpright = derivePlayerStyle({}, {}, { stature: 'short', posture: 'upright' });
assert.ok(shortUpright.legLength < naked.legLength);
assert.equal(shortUpright.hunch, 0);

for (const [key, ids] of Object.entries({
  age: PLAYER_AGE_IDS,
  bodyType: PLAYER_BODY_TYPE_IDS,
  faceMark: PLAYER_FACE_MARK_IDS,
  faceShape: PLAYER_FACE_SHAPE_IDS,
  facialHair: PLAYER_FACIAL_HAIR_IDS,
  genderModel: PLAYER_GENDER_MODEL_IDS,
  hairColor: PLAYER_HAIR_COLOR_IDS,
  hairStyle: PLAYER_HAIR_STYLE_IDS,
  posture: PLAYER_POSTURE_IDS,
  skinTone: PLAYER_SKIN_TONE_IDS,
  stature: PLAYER_STATURE_IDS
})) {
  for (const id of ids) {
    const style = derivePlayerStyle({}, {}, { ...PLAYER_DEFAULT_APPEARANCE, bodyFrame: undefined, [key]: id });
    assert.equal(style[key], id, `${key} should accept ${id}`);
  }
}

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
  const small = derivePlayerStyle({}, {}, { genderModel: 'male', penisSize: 2 });
  const large = derivePlayerStyle({}, {}, { genderModel: 'male', penisSize: 9 });
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
    const style = derivePlayerStyle({}, {}, {
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

    const sprite = bakePlayerCharacter({}, {}, {
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
