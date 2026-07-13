import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import { calculateHitChance } from '../src/combat/HitChance.js';
import { FIELD_RATINGS, calculateFieldRating, normalizeProgression } from '../src/core/Progression.js';
import { PALETTE } from '../src/render/palette.js';
import { SPRITE_ATLAS_IDS, SPRITE_POSE_FRAME_COUNTS, buildSpriteAtlas } from '../src/render/SpriteAtlas.js';

function recordingCanvas() {
  const canvas = { width: 0, height: 0, calls: [] };
  const ctx = {
    imageSmoothingEnabled: false,
    fillStyle: PALETTE.void,
    fillRect(x, y, w, h) {
      canvas.calls.push({ x, y, w, h, color: this.fillStyle });
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

const readJson = async (path) => JSON.parse(await readFile(new URL(path, import.meta.url), 'utf8'));
const [mara, sava, vault] = await Promise.all([
  readJson('../data/actors/mara-vey.json'),
  readJson('../data/enemies/host-sava-rell.json'),
  readJson('../data/levels/long_ash_listening_vault.json')
]);

assert.equal(sava.id, 'host-sava-rell');
assert.equal(sava.spriteId, 'host-sava-rell');
assert.equal(sava.faction, 'the-host');
assert.deepEqual(sava.loot, []);
assert.equal(sava.stats.hp, 20);
assert.equal(sava.stats.actionPoints, 6);
assert.equal(sava.attacks.length, 1);
assert.deepEqual(sava.attacks[0], {
  id: 'grave-hand-rake',
  name: 'Grave-Hand Rake',
  apCost: 3,
  damage: 2,
  range: 1,
  accuracyField: 'unarmed',
  damageField: 'unarmed'
});
assert.ok(sava.tags.includes('boss'));
assert.ok(sava.tags.includes('host'));
assert.ok(sava.tags.includes('vale-imprint'));
assert.equal(sava.progression.complexity, 'boss');
assert.equal(sava.progression.xpReward, 45);
assert.equal(/[—]|--/.test([sava.description, ...(sava.aggro ?? [])].join(' ')), false);

const savaSpawn = vault.spawns.enemies.find((spawn) => spawn.id === 'host-sava-rell');
const niche = vault.objects.find((object) => object.doorGroup === 'sava-listening-niche');
const nicheApproach = { x: 7, y: 3 };
assert.deepEqual({ x: savaSpawn.x, y: savaSpawn.y }, { x: 7, y: 1 });
assert.equal(savaSpawn.encounter, 'sava-listening-niche');
assert.deepEqual({ x: niche.x, y: niche.y }, { x: 7, y: 2 });
assert.equal(vault.tiles[nicheApproach.y][nicheApproach.x], '.');
assert.equal(Math.max(Math.abs(nicheApproach.x - savaSpawn.x), Math.abs(nicheApproach.y - savaSpawn.y)), 2);

assert.ok(SPRITE_ATLAS_IDS.includes('host-sava-rell'));
const atlas = buildSpriteAtlas();
const sprite = atlas['host-sava-rell'];
assert.ok(sprite);
assert.equal(sprite.width, 46);
assert.equal(sprite.height, 68);
assert.equal(sprite.death.length, 10);

const facings = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'];
for (const [state, count] of Object.entries(SPRITE_POSE_FRAME_COUNTS)) {
  for (const facing of facings) {
    assert.equal(sprite.frames[state][facing].length, count, `${state}/${facing} frame count`);
  }
}

const paletteColors = new Set(Object.values(PALETTE));
for (const state of Object.keys(SPRITE_POSE_FRAME_COUNTS)) {
  for (const facing of facings) {
    for (const frame of sprite.frames[state][facing]) {
      assert.ok(frame.calls.length > 0, `${state}/${facing} draws pixels`);
      for (const call of frame.calls) {
        assert.ok(paletteColors.has(call.color), `${state}/${facing} uses palette color ${call.color}`);
      }
    }
  }
}

function occupiedPixels(frame, width, height) {
  const pixels = new Set();
  for (const call of frame.calls) {
    const x0 = Math.max(0, call.x);
    const y0 = Math.max(0, call.y);
    const x1 = Math.min(width, call.x + call.w);
    const y1 = Math.min(height, call.y + call.h);
    for (let y = y0; y < y1; y += 1) {
      for (let x = x0; x < x1; x += 1) pixels.add(`${x},${y}`);
    }
  }
  return pixels;
}

function pixelBounds(pixels) {
  const points = [...pixels].map((entry) => entry.split(',').map(Number));
  return {
    count: points.length,
    minX: Math.min(...points.map(([x]) => x)),
    maxX: Math.max(...points.map(([x]) => x)),
    minY: Math.min(...points.map(([, y]) => y)),
    maxY: Math.max(...points.map(([, y]) => y))
  };
}

function pixelDifference(left, right) {
  let count = 0;
  for (const pixel of left) if (!right.has(pixel)) count += 1;
  for (const pixel of right) if (!left.has(pixel)) count += 1;
  return count;
}

// Sava's defining anatomy must survive every facing. Rear and side frames used
// to fall back to a generic grave-clerk body with no wound or rake silhouette.
for (const facing of facings) {
  const idle = sprite.frames.idle[facing][2];
  for (const [color, label] of [
    [PALETTE.hostBone, 'broken aureole and ribs'],
    [PALETTE.skinMid, 'preserved human tissue'],
    [PALETTE.hostGold, 'thin Vale seam'],
    [PALETTE.hostRed, 'one-sided rib wound']
  ]) {
    assert.ok(idle.calls.some((call) => call.color === color), `${facing} retains ${label}`);
  }
}

// The impact frame reaches in the facing direction and keeps the pale three
// finger rake inside the visible actor canvas instead of ending as a clipped arm.
const rightImpactFacings = new Set(['n', 'ne', 'e', 'se', 's']);
for (const facing of facings) {
  const impact = sprite.frames.attack[facing][3];
  const bounds = pixelBounds(occupiedPixels(impact, sprite.width, sprite.height));
  if (rightImpactFacings.has(facing)) {
    assert.ok(bounds.maxX >= sprite.width - 2, `${facing} rake reaches right edge`);
    assert.ok(impact.calls.some((call) => call.color === PALETTE.hostBone && call.x >= sprite.width - 9), `${facing} right rake fingers remain visible`);
  } else {
    assert.ok(bounds.minX <= 3, `${facing} rake reaches left edge`);
    assert.ok(impact.calls.some((call) => call.color === PALETTE.hostBone && call.x <= 8), `${facing} left rake fingers remain visible`);
  }
}

// Opposed walk keys keep both planted-foot contact and a substantial silhouette
// change. Hit keys likewise move the body instead of flashing a static figure.
for (const facing of ['n', 'se', 'sw']) {
  const walkA = occupiedPixels(sprite.frames.walk[facing][0], sprite.width, sprite.height);
  const walkB = occupiedPixels(sprite.frames.walk[facing][4], sprite.width, sprite.height);
  assert.ok(pixelDifference(walkA, walkB) >= 250, `${facing} walk has opposing weight shift`);
  assert.ok([...walkA].filter((pixel) => Number(pixel.split(',')[1]) >= sprite.height - 4).length >= 40, `${facing} walk start stays planted`);
  assert.ok([...walkB].filter((pixel) => Number(pixel.split(',')[1]) >= sprite.height - 4).length >= 40, `${facing} walk opposite stays planted`);

  const hitA = occupiedPixels(sprite.frames.hit[facing][0], sprite.width, sprite.height);
  const hitB = occupiedPixels(sprite.frames.hit[facing][1], sprite.width, sprite.height);
  assert.ok(pixelDifference(hitA, hitB) >= 300, `${facing} hit reaction shifts body weight`);
}

const frontPulse = sprite.frames.idle.s[2];
const glowArea = frontPulse.calls
  .filter((call) => call.color === PALETTE.hostGlow)
  .reduce((sum, call) => sum + call.w * call.h, 0);
assert.ok(glowArea > 0 && glowArea <= 2, `live wound glow stays tiny (${glowArea} px)`);
assert.ok(frontPulse.calls.some((call) => call.color === PALETTE.skinMid), 'preserved human skin remains visible');
assert.ok(frontPulse.calls.some((call) => call.color === PALETTE.hostBone), 'broken bone and ribs remain visible');
assert.ok(frontPulse.calls.some((call) => call.color === PALETTE.hostRed), 'one-sided rib wound remains visible');
for (const deathFrame of sprite.death) {
  assert.equal(deathFrame.calls.some((call) => call.color === PALETTE.hostGlow), false, 'dead Sava has no living glow');
  assert.equal(deathFrame.calls.some((call) => call.color === PALETTE.flash), false, 'dead Sava has no flash pixels');
}

const deathStartBounds = pixelBounds(occupiedPixels(sprite.death[0], sprite.width, sprite.height));
const deathCrouchBounds = pixelBounds(occupiedPixels(sprite.death[3], sprite.width, sprite.height));
const corpseBounds = pixelBounds(occupiedPixels(sprite.death.at(-1), sprite.width, sprite.height));
const deathStartCollar = occupiedPixels({
  calls: sprite.death[0].calls.filter((call) =>
    call.color === PALETTE.stoneMid || call.color === PALETTE.stoneDust
  )
}, sprite.width, sprite.height);
for (let y = 18; y <= 22; y += 1) {
  assert.ok(
    [...deathStartCollar].some((pixel) => {
      const [x, py] = pixel.split(',').map(Number);
      return py === y && x >= 20 && x <= 28;
    }),
    `death start keeps a visible head-to-collar bridge on row ${y}`
  );
}
assert.ok(deathCrouchBounds.minY >= deathStartBounds.minY + 15, 'death animation visibly buckles before impact');
assert.ok(corpseBounds.minY >= deathCrouchBounds.minY + 15, 'death animation lands instead of sliding a flat icon');
assert.ok(corpseBounds.count >= 520, `corpse keeps substantial human mass (${corpseBounds.count} px)`);
assert.ok(corpseBounds.maxX - corpseBounds.minX >= 44, 'corpse spans a full human fall');
assert.equal(corpseBounds.maxY, sprite.height - 1, 'corpse remains grounded inside the frame');

function fieldRating(actor, id) {
  const field = FIELD_RATINGS.find((entry) => entry.id === id);
  return calculateFieldRating(normalizeProgression(actor.progression), field);
}

const maraFirearms = fieldRating(mara, 'firearms');
const maraDefense = Math.max(fieldRating(mara, 'melee'), fieldRating(mara, 'unarmed'));
const savaStealth = fieldRating(sava, 'stealth');
const savaUnarmed = fieldRating(sava, 'unarmed');
const sidearm = await readJson('../data/items/censure-sidearm.json').then((item) => item.weapon.attack);
const rake = sava.attacks[0];

const pistolChanceAt = (distance) => calculateHitChance({
  attackerRating: maraFirearms,
  defenderRating: savaStealth,
  attack: sidearm,
  distance
}).chance;
const rakeChance = calculateHitChance({
  attackerRating: savaUnarmed,
  defenderRating: maraDefense,
  attack: rake,
  distance: 1
}).chance;

assert.equal(maraFirearms, 27);
assert.equal(savaStealth, 31);
assert.equal(savaUnarmed, 34);
assert.equal(maraDefense, 27);
assert.equal(pistolChanceAt(1), 68);
assert.equal(pistolChanceAt(2), 64);
assert.equal(pistolChanceAt(3), 60);
assert.equal(rakeChance, 74);

const expectedPistolTurnsAdjacent = sava.stats.hp / (sidearm.damage * pistolChanceAt(1) / 100);
const expectedSavaDamageAdjacent = 2 * rake.damage * rakeChance / 100;
const starterEffectiveHp = mara.stats.hp + 4;
assert.ok(expectedPistolTurnsAdjacent > 5.5 && expectedPistolTurnsAdjacent < 6.1);
assert.ok(starterEffectiveHp / expectedSavaDamageAdjacent > expectedPistolTurnsAdjacent);

function seededRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 2 ** 32;
  };
}

function simulateSidearmFight(seed, { dressings, spaced, openingAtTwo = false }) {
  const random = seededRandom(seed);
  let maraHp = mara.stats.hp;
  let savaHp = sava.stats.hp;
  let usedDressings = 0;

  for (let round = 1; round <= 30; round += 1) {
    if (maraHp <= 6 && usedDressings < dressings) {
      maraHp = Math.min(mara.stats.maxHp, maraHp + 4);
      usedDressings += 1;
    }

    const openingRound = openingAtTwo && round === 1;
    const distance = openingRound ? 2 : spaced ? 3 : 1;
    if (random() < pistolChanceAt(distance) / 100) savaHp -= sidearm.damage;
    if (savaHp <= 0) return { won: true, round, maraHp };

    // At distance three Sava spends two AP closing, so only one rake remains.
    // Standing adjacent lets him use the full two-rake pressure turn.
    const attacks = openingRound || spaced ? 1 : 2;
    for (let attack = 0; attack < attacks; attack += 1) {
      if (random() < rakeChance / 100) maraHp -= rake.damage;
      if (maraHp <= 0) return { won: false, round, maraHp };
    }
  }
  return { won: false, round: 30, maraHp };
}

function sampleWinRate(options, samples = 20000) {
  let wins = 0;
  let winningTurns = 0;
  for (let sample = 1; sample <= samples; sample += 1) {
    const result = simulateSidearmFight(sample * 7919, options);
    if (!result.won) continue;
    wins += 1;
    winningTurns += result.round;
  }
  return { winRate: wins / samples, averageWinningTurns: winningTurns / wins };
}

const adjacentStarter = sampleWinRate({ dressings: 1, spaced: false });
const adjacentSupplies = sampleWinRate({ dressings: 3, spaced: false });
const spacedStarter = sampleWinRate({ dressings: 1, spaced: true });
const actualOpeningStarter = sampleWinRate({ dressings: 1, spaced: false, openingAtTwo: true });

assert.ok(adjacentStarter.winRate >= 0.68 && adjacentStarter.winRate <= 0.78, adjacentStarter);
assert.ok(adjacentSupplies.winRate >= 0.93, adjacentSupplies);
assert.ok(spacedStarter.winRate >= 0.95, spacedStarter);
assert.ok(actualOpeningStarter.winRate >= 0.75 && actualOpeningStarter.winRate <= 0.82, actualOpeningStarter);
assert.ok(adjacentStarter.averageWinningTurns >= 4.8 && adjacentStarter.averageWinningTurns <= 5.5);

console.log('savaRellBoss: art registration, no-loot contract, and early-boss balance pass.');
console.log({
  chances: { pistolAdjacent: pistolChanceAt(1), pistolAtThree: pistolChanceAt(3), savaRake: rakeChance },
  expected: {
    pistolTurnsAdjacent: Number(expectedPistolTurnsAdjacent.toFixed(2)),
    savaDamageAdjacent: Number(expectedSavaDamageAdjacent.toFixed(2))
  },
  simulations: { actualOpeningStarter, adjacentStarter, adjacentSupplies, spacedStarter }
});
