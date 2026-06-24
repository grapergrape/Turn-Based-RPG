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

const naked = deriveMaraStyle({});

assert.equal(naked.coat, PALETTE.clothDark);
assert.equal(naked.coatHi, PALETTE.stoneDark);
assert.equal(naked.coatLo, PALETTE.clothDark);
assert.equal(naked.coatDk, PALETTE.stoneDark);
assert.equal(naked.pants, PALETTE.clothDark);
assert.equal(naked.pantsHi, PALETTE.stoneDark);
assert.equal(naked.pantsLo, PALETTE.stoneDark);
assert.equal(naked.pantsDk, PALETTE.stoneDark);
assert.equal(naked.belt, PALETTE.rustDark);
assert.equal(naked.bareFeet, true);
assert.equal(naked.bareHead, true);
assert.equal(naked.fieldHarness, false);
assert.equal(naked.vest, null);
assert.equal(naked.bodyFrame, 'feminine');
assert.equal(naked.anatomy, 'vulva');
assert.equal(naked.anatomyVisible, false);
assert.notEqual(naked.coat, naked.skin);
assert.notEqual(naked.pants, naked.skin);

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
assert.equal(masculineModel.anatomyVisible, false);
assert.ok(masculineModel.shoulders > naked.shoulders);

const feminineWithPenis = deriveMaraStyle({}, {}, {
  bodyFrame: 'feminine',
  anatomy: 'penis'
});

assert.equal(feminineWithPenis.bodyFrame, 'feminine');
assert.equal(feminineWithPenis.anatomy, 'penis');
assert.equal(feminineWithPenis.anatomyVisible, false);
assert.equal(feminineWithPenis.shoulders, naked.shoulders);

const masculineWithVulva = deriveMaraStyle({}, {}, {
  bodyFrame: 'masculine',
  anatomy: 'vulva'
});

assert.equal(masculineWithVulva.bodyFrame, 'masculine');
assert.equal(masculineWithVulva.anatomy, 'vulva');
assert.equal(masculineWithVulva.anatomyVisible, false);

const androgynousSmooth = deriveMaraStyle({}, {}, {
  genderModel: 'androgynous'
});

assert.equal(androgynousSmooth.bodyFrame, 'androgynous');
assert.equal(androgynousSmooth.anatomy, 'smooth');
assert.equal(androgynousSmooth.anatomyVisible, false);
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
assert.equal(intersex.anatomyVisible, false);

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
    assert.equal(style.anatomyVisible, false);
    assert.notEqual(style.coat, style.skin);
    assert.notEqual(style.pants, style.skin);

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
