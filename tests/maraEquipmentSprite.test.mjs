import assert from 'node:assert/strict';

import { createActor } from '../src/entities/ActorFactory.js';
import { PALETTE } from '../src/render/palette.js';
import { deriveMaraStyle } from '../src/render/SpriteAtlas.js';

const naked = deriveMaraStyle({});

assert.equal(naked.coat, PALETTE.skinMid);
assert.equal(naked.coatHi, PALETTE.skinLight);
assert.equal(naked.coatLo, PALETTE.skinDark);
assert.equal(naked.pants, PALETTE.skinMid);
assert.equal(naked.pantsHi, PALETTE.skinLight);
assert.equal(naked.pantsLo, PALETTE.skinDark);
assert.equal(naked.belt, null);
assert.equal(naked.bareFeet, true);
assert.equal(naked.bareHead, true);
assert.equal(naked.fieldHarness, false);
assert.equal(naked.vest, null);
assert.equal(naked.bodyFrame, 'feminine');
assert.equal(naked.anatomy, 'vulva');
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

const masculineWithPenis = deriveMaraStyle({}, {}, {
  bodyFrame: 'masculine',
  anatomy: 'penis'
});

assert.equal(masculineWithPenis.bodyFrame, 'masculine');
assert.equal(masculineWithPenis.anatomy, 'penis');
assert.equal(masculineWithPenis.anatomyVisible, true);
assert.ok(masculineWithPenis.shoulders > naked.shoulders);

const feminineWithPenis = deriveMaraStyle({}, {}, {
  bodyFrame: 'feminine',
  anatomy: 'penis'
});

assert.equal(feminineWithPenis.bodyFrame, 'feminine');
assert.equal(feminineWithPenis.anatomy, 'penis');
assert.equal(feminineWithPenis.shoulders, naked.shoulders);

const masculineWithVulva = deriveMaraStyle({}, {}, {
  bodyFrame: 'masculine',
  anatomy: 'vulva'
});

assert.equal(masculineWithVulva.bodyFrame, 'masculine');
assert.equal(masculineWithVulva.anatomy, 'vulva');

const androgynousSmooth = deriveMaraStyle({}, {}, {
  bodyFrame: 'androgynous',
  anatomy: 'smooth'
});

assert.equal(androgynousSmooth.bodyFrame, 'androgynous');
assert.equal(androgynousSmooth.anatomy, 'smooth');
assert.ok(androgynousSmooth.waist < masculineWithPenis.waist);

const intersex = deriveMaraStyle({}, {}, {
  bodyFrame: 'androgynous',
  anatomy: 'intersex'
});

assert.equal(intersex.anatomy, 'intersex');

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
