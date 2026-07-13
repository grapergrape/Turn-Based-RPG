// Story-specific furniture and fixtures for the Long Ash graveyard chapels.

import { PALETTE } from '../palette.js';
import {
  drawIsoDiamond,
  drawShadowBlob,
  hash2D,
  isoFrame,
  linePx,
  orientedBox,
  poly,
  px,
  rngFrom,
  wallRunFace
} from './basePixels.js';

function fixtureFace(ctx, cx, cy, opts = {}) {
  return wallRunFace(ctx, cx, cy, {
    plane: opts.wallPlane === 'se' ? 'se' : 'sw',
    side: opts.wallSide === 'far' ? 'far' : 'near'
  });
}

function pixelCup(ctx, x, y, { crushed = false, pale = false } = {}) {
  if (crushed) {
    px(ctx, x - 3, y, PALETTE.outline, 7, 3);
    px(ctx, x - 2, y - 1, PALETTE.rustDark, 5, 2);
    px(ctx, x - 1, y - 2, PALETTE.stoneDust, 3, 1);
    px(ctx, x + 2, y + 1, PALETTE.stoneDark, 2, 1);
    return;
  }
  px(ctx, x - 3, y - 3, PALETTE.outline, 7, 6);
  px(ctx, x - 2, y - 3, pale ? PALETTE.stoneDust : PALETTE.rustLight, 5, 1);
  px(ctx, x - 2, y - 2, pale ? PALETTE.stoneMid : PALETTE.rustDark, 5, 3);
  px(ctx, x - 1, y - 2, PALETTE.void, 3, 1);
  px(ctx, x - 2, y - 1, pale ? PALETTE.stoneLight : PALETTE.rustMid, 1, 2);
  px(ctx, x + 1, y - 1, PALETTE.stoneDust, 1, 2);
  px(ctx, x + 2, y, PALETTE.rustDark, 1, 2);
  px(ctx, x - 2, y + 2, PALETTE.outline, 5, 1);
}

export function drawVigilCandleRack(ctx, cx, cy, seed, opts = {}) {
  const face = fixtureFace(ctx, cx, cy, opts);
  const rng = rngFrom(hash2D(seed + 307, seed * 7 + 73));

  face.rect(0.06, 0.1, 0.94, 0.9, PALETTE.outline);
  face.rect(0.09, 0.13, 0.91, 0.87, PALETTE.woodDark);
  face.rect(0.12, 0.16, 0.88, 0.84, PALETTE.stoneDark);
  face.line(0.08, 0.1, 0.94, 0.1, PALETTE.woodLight, 2);
  face.line(0.06, 0.9, 0.94, 0.9, PALETTE.outline, 3);
  face.line(0.09, 0.12, 0.09, 0.88, PALETTE.woodMid, 2);
  face.line(0.92, 0.13, 0.92, 0.88, PALETTE.outline, 3);

  for (const v of [0.46, 0.79]) {
    face.line(0.1, v, 0.91, v, PALETTE.outline, 4);
    face.line(0.12, v - 0.025, 0.89, v - 0.025, PALETTE.woodLight, 2);
    face.line(0.14, v + 0.035, 0.88, v + 0.035, PALETTE.woodDark, 1);
  }

  for (let index = 0; index < 12; index += 1) {
    const row = index < 6 ? 0 : 1;
    const col = index % 6;
    const anchor = face.point(0.175 + col * 0.13, row === 0 ? 0.36 : 0.69);
    const crushed = index === 11;
    pixelCup(ctx, anchor[0], anchor[1], { crushed, pale: index === 3 || index === 8 });
    if (!crushed) {
      const sootHeight = 2 + Math.floor(rng() * 5);
      px(ctx, anchor[0] - 1, anchor[1] - 5 - sootHeight, PALETTE.void, 2, sootHeight);
      if ((index + seed) % 3 === 0) px(ctx, anchor[0] + 2, anchor[1] + 2, PALETTE.hostBone, 1, 4);
      if ((index + seed) % 5 === 0) px(ctx, anchor[0] - 1, anchor[1] - 4, PALETTE.stoneDust, 2, 2);
    }
  }

  // Three name slips remain tied beneath the lower shelf. They turn the rack
  // from a repeating icon grid into something one keeper used for years.
  for (const [u, drop] of [[0.25, 0], [0.51, 3], [0.7, 1]]) {
    const knot = face.point(u, 0.81);
    linePx(ctx, knot[0], knot[1], knot[0] - 1, knot[1] + 4 + drop, PALETTE.rustDark, 1);
    px(ctx, knot[0] - 3, knot[1] + 3 + drop, PALETTE.outline, 7, 5);
    px(ctx, knot[0] - 2, knot[1] + 3 + drop, PALETTE.clothTan, 5, 3);
    px(ctx, knot[0] - 1, knot[1] + 4 + drop, PALETTE.stoneDark, 3, 1);
  }

  const hook = face.point(0.82, 0.2);
  px(ctx, hook[0] - 2, hook[1] - 2, PALETTE.outline, 5, 5);
  px(ctx, hook[0] - 1, hook[1] - 1, PALETTE.rustLight, 3, 2);
  px(ctx, hook[0], hook[1] + 1, PALETTE.void, 1, 2);
}

export function drawGravekeeperChair(ctx, cx, cy, seed, opts = {}) {
  const frame = isoFrame(cx, cy, opts.orient ?? 'ne');
  const at = (a, b, h = 0) => frame.point(a, b, h);
  const rng = rngFrom(hash2D(seed + 313, seed * 11 + 79));

  drawShadowBlob(ctx, cx, cy + 6, 45, 18);

  const seatHeight = 21;
  for (const [a, b, far] of [
    [-0.25, -0.2, true],
    [-0.25, 0.2, false],
    [0.25, -0.2, true],
    [0.25, 0.2, false]
  ]) {
    const foot = at(a, b, 0);
    const tone = far ? PALETTE.woodDark : PALETTE.woodMid;
    linePx(ctx, foot[0], foot[1], foot[0], foot[1] - seatHeight, PALETTE.outline, 4);
    linePx(ctx, foot[0] - 1, foot[1], foot[0] - 1, foot[1] - seatHeight, tone, 2);
    px(ctx, foot[0] - 1, foot[1] - seatHeight, far ? PALETTE.woodMid : PALETTE.woodLight, 1, 4);
  }

  const seat = orientedBox(ctx, frame, 0.62, 0.52, 6, {
    top: PALETTE.woodLight,
    lit: PALETTE.woodMid,
    shade: PALETTE.woodDark,
    outline: PALETTE.outline
  }, seatHeight);
  linePx(ctx, seat.cap.left[0], seat.cap.left[1], seat.cap.top[0], seat.cap.top[1], PALETTE.clothTan, 1);
  linePx(ctx, seat.cap.bottom[0], seat.cap.bottom[1], seat.cap.right[0], seat.cap.right[1], PALETTE.outline, 2);

  const wornA = at(0.02, 0, seatHeight + 6);
  px(ctx, wornA[0] - 5, wornA[1] - 2, PALETTE.woodMid, 11, 4);
  px(ctx, wornA[0] - 3, wornA[1] - 3, PALETTE.stoneDust, 7, 1);
  px(ctx, wornA[0] + 3, wornA[1] + 1, PALETTE.woodDark, 3, 1);

  const backLeftFloor = at(-0.31, -0.23, 0);
  const backRightFloor = at(-0.31, 0.23, 0);
  const backLeftTop = at(-0.31, -0.23, 51);
  const backRightTop = at(-0.31, 0.23, 48);
  linePx(ctx, backLeftFloor[0], backLeftFloor[1], backLeftTop[0], backLeftTop[1], PALETTE.outline, 5);
  linePx(ctx, backRightFloor[0], backRightFloor[1], backRightTop[0], backRightTop[1], PALETTE.outline, 5);
  linePx(ctx, backLeftFloor[0] - 1, backLeftFloor[1], backLeftTop[0] - 1, backLeftTop[1], PALETTE.woodMid, 2);
  linePx(ctx, backRightFloor[0] - 1, backRightFloor[1], backRightTop[0] - 1, backRightTop[1], PALETTE.woodDark, 2);

  for (const height of [32, 43]) {
    const a = at(-0.31, -0.23, height);
    const b = at(-0.31, 0.23, height - 1);
    linePx(ctx, a[0], a[1], b[0], b[1], PALETTE.outline, 5);
    linePx(ctx, a[0], a[1] - 1, b[0], b[1] - 1, height === 43 ? PALETTE.woodLight : PALETTE.woodMid, 2);
  }
  const splatTop = at(-0.31, 0, 46);
  const splatBottom = at(-0.31, 0, 27);
  linePx(ctx, splatTop[0], splatTop[1], splatBottom[0], splatBottom[1], PALETTE.outline, 7);
  linePx(ctx, splatTop[0] - 1, splatTop[1] + 1, splatBottom[0] - 1, splatBottom[1], PALETTE.woodMid, 3);
  for (const h of [31, 35, 39]) {
    const notch = at(-0.31, 0, h);
    px(ctx, notch[0] - 1, notch[1], PALETTE.stoneDark, 4, 1);
  }

  const leftArmA = at(-0.18, -0.32, 27);
  const leftArmB = at(0.22, -0.32, 27);
  linePx(ctx, leftArmA[0], leftArmA[1], leftArmB[0], leftArmB[1], PALETTE.outline, 5);
  linePx(ctx, leftArmA[0], leftArmA[1] - 1, leftArmB[0], leftArmB[1] - 1, PALETTE.woodLight, 2);
  const rightArmA = at(-0.18, 0.32, 27);
  const rightArmB = at(0.08, 0.32, 25);
  linePx(ctx, rightArmA[0], rightArmA[1], rightArmB[0], rightArmB[1], PALETTE.outline, 5);
  linePx(ctx, rightArmA[0], rightArmA[1] - 1, rightArmB[0], rightArmB[1] - 1, PALETTE.woodMid, 2);
  const broken = at(0.14, 0.32, 24);
  px(ctx, broken[0] - 2, broken[1] - 2, PALETTE.woodLight, 4, 2);

  if (opts.variant === 'restraint') {
    const beltA = at(-0.2, -0.27, seatHeight + 9);
    const beltB = at(0.18, 0.27, seatHeight + 9);
    linePx(ctx, beltA[0], beltA[1], beltB[0], beltB[1], PALETTE.outline, 5);
    linePx(ctx, beltA[0], beltA[1] - 1, beltB[0], beltB[1] - 1, PALETTE.rustDark, 2);
    const wrist = at(0.02, -0.32, 27);
    px(ctx, wrist[0] - 4, wrist[1] - 3, PALETTE.outline, 9, 6);
    px(ctx, wrist[0] - 3, wrist[1] - 2, PALETTE.rustMid, 7, 3);
    px(ctx, wrist[0] - 1, wrist[1] - 1, PALETTE.stoneLight, 2, 1);
  } else {
    const cordTop = at(-0.12, -0.32, 25);
    const cordBottom = at(-0.06, -0.34, 12);
    linePx(ctx, cordTop[0], cordTop[1], cordBottom[0], cordBottom[1], PALETTE.rustDark, 1);
    for (let knot = 0; knot < 4; knot += 1) {
      px(ctx, cordBottom[0] + (knot & 1), cordBottom[1] - knot * 3, PALETTE.clothTan, 2, 2);
    }
  }
  if (rng() > 0.45) px(ctx, wornA[0] - 7, wornA[1], PALETTE.hostBone, 2, 1);
}

export function drawMortuaryWashingTable(ctx, cx, cy, seed, opts = {}) {
  const frame = isoFrame(cx, cy, opts.orient ?? 'se');
  const at = (a, b, h = 0) => frame.point(a, b, h);
  const rng = rngFrom(hash2D(seed + 317, seed * 13 + 83));
  const slabHeight = 27;

  drawShadowBlob(ctx, cx, cy + 7, 70, 26);

  for (const [a, b, lit] of [
    [-0.35, -0.21, true],
    [-0.35, 0.21, true],
    [0.35, -0.21, false],
    [0.35, 0.21, false]
  ]) {
    const foot = at(a, b, 0);
    const top = at(a, b, slabHeight);
    linePx(ctx, foot[0], foot[1], top[0], top[1], PALETTE.outline, 8);
    linePx(ctx, foot[0] - 1, foot[1], top[0] - 1, top[1], lit ? PALETTE.stoneMid : PALETTE.stoneDark, 5);
    linePx(ctx, foot[0] - 2, foot[1], top[0] - 2, top[1], lit ? PALETTE.stoneLight : PALETTE.stoneMid, 1);
  }

  const slab = orientedBox(ctx, frame, 0.96, 0.62, 9, {
    top: PALETTE.stoneLight,
    lit: PALETTE.stoneMid,
    shade: PALETTE.stoneDark,
    outline: PALETTE.outline
  }, slabHeight);
  linePx(ctx, slab.cap.left[0], slab.cap.left[1], slab.cap.top[0], slab.cap.top[1], PALETTE.stoneDust, 2);
  linePx(ctx, slab.cap.bottom[0], slab.cap.bottom[1], slab.cap.right[0], slab.cap.right[1], PALETTE.outline, 2);

  const channelStart = at(-0.36, 0, slabHeight + 10);
  const channelEnd = at(0.35, 0, slabHeight + 10);
  linePx(ctx, channelStart[0], channelStart[1], channelEnd[0], channelEnd[1], PALETTE.outline, 5);
  linePx(ctx, channelStart[0], channelStart[1] - 1, channelEnd[0], channelEnd[1] - 1, PALETTE.rustDark, 2);
  linePx(ctx, channelStart[0], channelStart[1] - 2, channelEnd[0], channelEnd[1] - 2, PALETTE.stoneDust, 1);
  const drain = at(0.28, 0, slabHeight + 11);
  px(ctx, drain[0] - 4, drain[1] - 3, PALETTE.outline, 9, 6);
  px(ctx, drain[0] - 3, drain[1] - 2, PALETTE.rustDark, 7, 4);
  px(ctx, drain[0] - 1, drain[1] - 1, PALETTE.void, 3, 2);

  const measureA = at(-0.3, -0.22, slabHeight + 10);
  const measureB = at(0.22, -0.22, slabHeight + 10);
  linePx(ctx, measureA[0], measureA[1], measureB[0], measureB[1], PALETTE.stoneDark, 1);
  for (let i = 0; i < 7; i += 1) {
    const mark = at(-0.3 + i * 0.085, -0.22, slabHeight + 10);
    px(ctx, mark[0], mark[1] - 1, i % 2 ? PALETTE.rustDark : PALETTE.outline, 1, i % 2 ? 2 : 3);
  }

  const foldedCloth = at(-0.22, 0.17, slabHeight + 11);
  px(ctx, foldedCloth[0] - 7, foldedCloth[1] - 5, PALETTE.outline, 14, 7);
  px(ctx, foldedCloth[0] - 6, foldedCloth[1] - 5, PALETTE.clothTan, 12, 5);
  px(ctx, foldedCloth[0] - 5, foldedCloth[1] - 4, PALETTE.hostBone, 7, 1);
  px(ctx, foldedCloth[0] + 2, foldedCloth[1] - 2, PALETTE.rustDark, 4, 1);

  for (let i = 0; i < 8; i += 1) {
    const chip = at((rng() - 0.5) * 0.72, (rng() - 0.5) * 0.42, slabHeight + 10);
    px(ctx, chip[0], chip[1], rng() < 0.55 ? PALETTE.stoneMid : PALETTE.stoneDust, 1 + (i & 1), 1);
  }
}

export function drawExaminerAssayCase(ctx, cx, cy, seed, opts = {}) {
  const frame = isoFrame(cx, cy, opts.orient ?? 'se');
  const at = (a, b, h = 0) => frame.point(a, b, h);
  const rng = rngFrom(hash2D(seed + 329, seed * 17 + 87));

  drawShadowBlob(ctx, cx, cy + 5, 48, 15);

  orientedBox(ctx, frame, 0.76, 0.42, 8, {
    top: PALETTE.stoneDark,
    lit: PALETTE.rustDark,
    shade: PALETTE.outline,
    outline: PALETTE.outline
  }, 2);
  const lid = orientedBox(ctx, frame, 0.8, 0.45, 4, {
    top: PALETTE.stoneMid,
    lit: PALETTE.stoneDark,
    shade: PALETTE.outline,
    outline: PALETTE.outline
  }, 10);

  linePx(ctx, lid.cap.left[0], lid.cap.left[1], lid.cap.top[0], lid.cap.top[1], PALETTE.stoneLight, 1);
  linePx(ctx, lid.cap.bottom[0], lid.cap.bottom[1], lid.cap.right[0], lid.cap.right[1], PALETTE.outline, 2);

  for (const a of [-0.24, 0.24]) {
    const near = at(a, -0.22, 15);
    const far = at(a, 0.22, 15);
    linePx(ctx, near[0], near[1], far[0], far[1], PALETTE.outline, 4);
    linePx(ctx, near[0], near[1] - 1, far[0], far[1] - 1, PALETTE.rustDark, 2);
  }

  const latch = at(0.39, 0, 9);
  px(ctx, latch[0] - 4, latch[1] - 4, PALETTE.outline, 9, 7);
  px(ctx, latch[0] - 3, latch[1] - 3, PALETTE.rustMid, 7, 4);
  px(ctx, latch[0] - 1, latch[1] - 2, PALETTE.stoneLight, 3, 2);
  px(ctx, latch[0], latch[1], PALETTE.void, 1, 2);

  const handleA = at(-0.14, 0.04, 16);
  const handleB = at(0.14, 0.04, 16);
  linePx(ctx, handleA[0], handleA[1] - 3, handleB[0], handleB[1] - 3, PALETTE.outline, 4);
  linePx(ctx, handleA[0], handleA[1] - 4, handleB[0], handleB[1] - 4, PALETTE.stoneDust, 1);
  px(ctx, handleA[0] - 2, handleA[1] - 3, PALETTE.outline, 4, 5);
  px(ctx, handleB[0] - 1, handleB[1] - 3, PALETTE.outline, 4, 5);

  const ruledA = at(-0.12, -0.12, 15);
  const ruledB = at(0.18, -0.12, 15);
  linePx(ctx, ruledA[0], ruledA[1], ruledB[0], ruledB[1], PALETTE.stoneDark, 1);
  for (let mark = 0; mark < 4; mark += 1) {
    const point = at(-0.1 + mark * 0.09, -0.12, 15);
    px(ctx, point[0], point[1] - 1, mark === 2 ? PALETTE.rustDark : PALETTE.stoneDust, 1, 2);
  }

  for (let chip = 0; chip < 4; chip += 1) {
    const point = at(-0.3 + rng() * 0.6, -0.16 + rng() * 0.3, 15);
    px(ctx, point[0], point[1], rng() < 0.6 ? PALETTE.stoneDark : PALETTE.rustDark, 1, 1);
  }
}

export function drawMortuaryDrain(ctx, cx, cy, seed) {
  const rng = rngFrom(hash2D(seed + 331, seed * 5 + 89));
  drawIsoDiamond(ctx, cx, cy + 1, 35, 16, PALETTE.outline);
  drawIsoDiamond(ctx, cx, cy, 31, 14, PALETTE.stoneDark);
  drawIsoDiamond(ctx, cx, cy - 1, 25, 11, PALETTE.void);
  for (let stripe = -2; stripe <= 2; stripe += 1) {
    linePx(ctx, cx - 11 + stripe * 3, cy + 3, cx + 1 + stripe * 3, cy - 4, PALETTE.outline, 2);
    linePx(ctx, cx - 10 + stripe * 3, cy + 2, cx + 2 + stripe * 3, cy - 5, stripe < 0 ? PALETTE.stoneLight : PALETTE.stoneMid, 1);
  }
  px(ctx, cx - 7, cy + 3, PALETTE.rustMid, 4, 1);
  px(ctx, cx + 5, cy - 3, PALETTE.rustDark, 3, 1);
  linePx(ctx, cx - 15, cy + 2, cx - 23, cy + 7, PALETTE.rustDark, 2);
  linePx(ctx, cx - 22, cy + 7, cx - 27, cy + 5, PALETTE.stoneDark, 1);
  for (let i = 0; i < 4; i += 1) {
    px(ctx, cx - 16 + Math.floor(rng() * 33), cy - 5 + Math.floor(rng() * 11), PALETTE.stoneDust, 1, 1);
  }
}

function brokenCircleGlyph(ctx, x, y) {
  const c = PALETTE.hostGold;
  linePx(ctx, x - 6, y - 3, x - 3, y - 6, PALETTE.outline, 3);
  linePx(ctx, x - 3, y - 6, x + 3, y - 6, PALETTE.outline, 3);
  linePx(ctx, x + 3, y - 6, x + 6, y - 2, PALETTE.outline, 3);
  linePx(ctx, x + 6, y + 1, x + 3, y + 5, PALETTE.outline, 3);
  linePx(ctx, x - 5, y + 3, x - 6, y - 1, PALETTE.outline, 3);
  linePx(ctx, x - 5, y - 3, x - 2, y - 5, c, 1);
  linePx(ctx, x - 2, y - 5, x + 3, y - 5, c, 1);
  linePx(ctx, x + 3, y - 5, x + 5, y - 2, c, 1);
  linePx(ctx, x + 5, y + 1, x + 3, y + 4, c, 1);
  linePx(ctx, x - 4, y + 3, x - 5, y - 1, c, 1);
  px(ctx, x - 1, y + 4, PALETTE.rustDark, 3, 2);
}

function openedRibsGlyph(ctx, x, y) {
  linePx(ctx, x, y - 7, x, y + 6, PALETTE.outline, 3);
  linePx(ctx, x, y - 6, x, y + 5, PALETTE.hostGold, 1);
  for (let row = 0; row < 3; row += 1) {
    const yy = y - 4 + row * 4;
    linePx(ctx, x - 1, yy, x - 7 + row, yy + 3, PALETTE.outline, 3);
    linePx(ctx, x + 1, yy, x + 7 - row, yy + 3, PALETTE.outline, 3);
    linePx(ctx, x - 1, yy - 1, x - 6 + row, yy + 2, PALETTE.hostGold, 1);
    linePx(ctx, x + 1, yy - 1, x + 6 - row, yy + 2, PALETTE.rustLight, 1);
  }
  px(ctx, x - 1, y + 1, PALETTE.void, 3, 5);
}

function bellMouthGlyph(ctx, x, y) {
  poly(ctx, PALETTE.outline, [
    [x - 4, y - 7], [x + 3, y - 7], [x + 4, y + 1], [x + 8, y + 5],
    [x + 7, y + 8], [x - 8, y + 8], [x - 9, y + 5], [x - 5, y + 1]
  ]);
  poly(ctx, PALETTE.rustMid, [
    [x - 3, y - 6], [x + 2, y - 6], [x + 3, y + 2], [x + 6, y + 5],
    [x + 5, y + 6], [x - 6, y + 6], [x - 7, y + 5], [x - 4, y + 2]
  ]);
  px(ctx, x - 3, y - 6, PALETTE.rustLight, 2, 9);
  px(ctx, x - 6, y + 5, PALETTE.hostGold, 11, 1);
  px(ctx, x - 1, y - 4, PALETTE.void, 3, 8);
  px(ctx, x, y + 3, PALETTE.hostGold, 2, 4);
}

export function drawMortuaryTagBoard(ctx, cx, cy, seed, opts = {}) {
  const face = fixtureFace(ctx, cx, cy, opts);
  const rng = rngFrom(hash2D(seed + 337, seed * 7 + 97));

  face.rect(0.05, 0.13, 0.95, 0.88, PALETTE.outline);
  face.rect(0.08, 0.16, 0.92, 0.84, PALETTE.woodDark);
  face.rect(0.11, 0.19, 0.89, 0.81, PALETTE.stoneDark);
  face.line(0.06, 0.13, 0.94, 0.13, PALETTE.woodLight, 2);
  face.line(0.08, 0.87, 0.92, 0.87, PALETTE.outline, 3);
  for (const u of [0.355, 0.645]) face.line(u, 0.2, u, 0.8, PALETTE.woodDark, 2);

  const anchors = [
    face.point(0.22, 0.52),
    face.point(0.5, 0.52),
    face.point(0.78, 0.52)
  ];
  for (const [index, u] of [0.22, 0.5, 0.78].entries()) {
    const x0 = u - 0.105;
    const x1 = u + 0.105;
    face.rect(x0, 0.32, x1, 0.74, PALETTE.outline);
    face.rect(x0 + 0.018, 0.34, x1 - 0.018, 0.71, PALETTE.rustDark);
    face.line(x0 + 0.025, 0.34, x1 - 0.025, 0.34, index === 1 ? PALETTE.rustLight : PALETTE.rustMid, 2);
    face.line(x1 - 0.025, 0.36, x1 - 0.025, 0.7, PALETTE.outline, 2);
    const notch = face.point(u, 0.69);
    px(ctx, notch[0] - 2, notch[1] - 1, PALETTE.outline, 5, 3);
    px(ctx, notch[0] - 1, notch[1] - 1, PALETTE.stoneDark, 3, 1);
  }
  brokenCircleGlyph(ctx, anchors[0][0], anchors[0][1]);
  openedRibsGlyph(ctx, anchors[1][0], anchors[1][1]);
  bellMouthGlyph(ctx, anchors[2][0], anchors[2][1]);

  for (const [index, anchor] of anchors.entries()) {
    const pin = face.point(0.22 + index * 0.28, 0.25);
    linePx(ctx, pin[0], pin[1], anchor[0], anchor[1] - 8, PALETTE.rustDark, 1);
    px(ctx, pin[0] - 2, pin[1] - 2, PALETTE.outline, 5, 4);
    px(ctx, pin[0] - 1, pin[1] - 1, index === 1 ? PALETTE.rustLight : PALETTE.hostGold, 3, 2);
  }
  for (let i = 0; i < 6; i += 1) {
    const speck = face.point(0.14 + rng() * 0.72, 0.22 + rng() * 0.54);
    px(ctx, speck[0], speck[1], rng() < 0.5 ? PALETTE.woodMid : PALETTE.rustDark, 1, 1);
  }
}

export function drawListeningApparatus(ctx, cx, cy, seed) {
  const rng = rngFrom(hash2D(seed + 347, seed * 17 + 101));
  drawShadowBlob(ctx, cx, cy + 7, 62, 22);

  const leftFoot = [cx - 24, cy + 2];
  const rightFoot = [cx + 24, cy + 1];
  const leftTop = [cx - 16, cy - 51];
  const rightTop = [cx + 17, cy - 49];
  linePx(ctx, leftFoot[0], leftFoot[1], leftTop[0], leftTop[1], PALETTE.outline, 7);
  linePx(ctx, rightFoot[0], rightFoot[1], rightTop[0], rightTop[1], PALETTE.outline, 7);
  linePx(ctx, leftFoot[0] - 1, leftFoot[1], leftTop[0] - 1, leftTop[1], PALETTE.rustMid, 3);
  linePx(ctx, rightFoot[0] - 1, rightFoot[1], rightTop[0] - 1, rightTop[1], PALETTE.rustDark, 3);
  linePx(ctx, leftTop[0], leftTop[1], rightTop[0], rightTop[1], PALETTE.outline, 8);
  linePx(ctx, leftTop[0], leftTop[1] - 2, rightTop[0], rightTop[1] - 2, PALETTE.rustMid, 2);
  px(ctx, leftFoot[0] - 7, leftFoot[1], PALETTE.outline, 15, 4);
  px(ctx, leftFoot[0] - 5, leftFoot[1] - 1, PALETTE.rustMid, 11, 2);
  px(ctx, rightFoot[0] - 6, rightFoot[1], PALETTE.outline, 13, 4);
  px(ctx, rightFoot[0] - 4, rightFoot[1] - 1, PALETTE.stoneDark, 9, 2);

  // A low receiving bed fixes the machine to the floor and gives the hanging
  // casting a destination. Without it the uprights read as loose scaffolding.
  drawIsoDiamond(ctx, cx, cy, 41, 16, PALETTE.outline);
  drawIsoDiamond(ctx, cx - 1, cy - 1, 35, 13, PALETTE.stoneDark);
  drawIsoDiamond(ctx, cx - 2, cy - 2, 27, 10, PALETTE.stoneMid);
  px(ctx, cx - 11, cy - 4, PALETTE.stoneLight, 9, 1);
  px(ctx, cx + 4, cy, PALETTE.rustDark, 11, 2);

  const crownX = cx + 1;
  px(ctx, crownX - 2, cy - 49, PALETTE.outline, 5, 25);
  px(ctx, crownX - 1, cy - 48, PALETTE.stoneMid, 2, 23);
  for (let link = 0; link < 4; link += 1) {
    px(ctx, crownX - 2 + (link & 1), cy - 45 + link * 5, PALETTE.stoneLight, 3, 2);
  }

  // Cast listening bell: shouldered crown, near-vertical waist, and a late
  // flare. The broken right plane stays dark while the upper-left edge carries
  // one long cold specular line.
  poly(ctx, PALETTE.outline, [
    [crownX - 7, cy - 27], [crownX + 6, cy - 27],
    [crownX + 8, cy - 23], [crownX + 6, cy - 10],
    [crownX + 11, cy - 5], [crownX + 10, cy - 1],
    [crownX - 11, cy - 1], [crownX - 11, cy - 5],
    [crownX - 6, cy - 10], [crownX - 5, cy - 23]
  ]);
  poly(ctx, PALETTE.stoneDark, [
    [crownX - 5, cy - 25], [crownX + 4, cy - 25],
    [crownX + 6, cy - 22], [crownX + 4, cy - 9],
    [crownX + 8, cy - 4], [crownX + 7, cy - 3],
    [crownX - 8, cy - 3], [crownX - 8, cy - 4],
    [crownX - 4, cy - 9], [crownX - 3, cy - 22]
  ]);
  poly(ctx, PALETTE.stoneMid, [
    [crownX - 5, cy - 25], [crownX, cy - 25],
    [crownX, cy - 5], [crownX - 8, cy - 4],
    [crownX - 4, cy - 9], [crownX - 3, cy - 22]
  ]);
  px(ctx, crownX - 4, cy - 24, PALETTE.stoneLight, 2, 17);
  px(ctx, crownX + 1, cy - 23, PALETTE.void, 4, 15);
  px(ctx, crownX - 8, cy - 5, PALETTE.stoneDust, 10, 2);
  px(ctx, crownX + 2, cy - 4, PALETTE.rustDark, 6, 2);
  px(ctx, crownX - 1, cy - 1, PALETTE.outline, 4, 5);
  px(ctx, crownX, cy, PALETTE.rustMid, 2, 3);

  // Offset pin scale and crank keep the apparatus from reading as an altar.
  px(ctx, cx + 19, cy - 43, PALETTE.outline, 12, 35);
  px(ctx, cx + 20, cy - 42, PALETTE.woodDark, 9, 32);
  px(ctx, cx + 21, cy - 41, PALETTE.woodMid, 3, 30);
  for (let mark = 0; mark < 6; mark += 1) {
    const yy = cy - 37 + mark * 5;
    px(ctx, cx + 18, yy, PALETTE.outline, 13, 3);
    px(ctx, cx + 19, yy, mark === 2 ? PALETTE.hostGold : PALETTE.rustLight, 9, 1);
  }
  // One clipped measurement slip is the examiner's human trace. Its two dark
  // rules stay readable without competing with the brass calibration marks.
  px(ctx, cx + 20, cy - 18, PALETTE.outline, 9, 8);
  px(ctx, cx + 21, cy - 18, PALETTE.clothTan, 7, 6);
  px(ctx, cx + 22, cy - 16, PALETTE.stoneDark, 5, 1);
  px(ctx, cx + 22, cy - 13, PALETTE.rustDark, 4, 1);
  linePx(ctx, cx + 18, cy - 29, cx + 7, cy - 18, PALETTE.outline, 2);
  linePx(ctx, cx + 19, cy - 29, cx + 8, cy - 18, PALETTE.rustMid, 1);
  px(ctx, cx - 27, cy - 27, PALETTE.outline, 11, 11);
  px(ctx, cx - 26, cy - 26, PALETTE.rustDark, 8, 8);
  px(ctx, cx - 24, cy - 24, PALETTE.stoneMid, 4, 4);
  linePx(ctx, cx - 22, cy - 22, cx - 32, cy - 16, PALETTE.outline, 3);
  linePx(ctx, cx - 22, cy - 23, cx - 31, cy - 17, PALETTE.rustLight, 1);

  // The geared crank drives a short striker into the bell's lit shoulder.
  // Showing that contact makes the machine's use legible in silhouette.
  linePx(ctx, cx - 23, cy - 22, cx - 8, cy - 17, PALETTE.outline, 5);
  linePx(ctx, cx - 22, cy - 23, cx - 7, cy - 18, PALETTE.rustMid, 2);
  px(ctx, cx - 10, cy - 21, PALETTE.outline, 8, 8);
  px(ctx, cx - 9, cy - 20, PALETTE.stoneMid, 6, 5);
  px(ctx, cx - 7, cy - 20, PALETTE.stoneLight, 2, 3);

  for (let i = 0; i < 5; i += 1) {
    px(ctx, cx - 19 + Math.floor(rng() * 38), cy - 45 + Math.floor(rng() * 37), PALETTE.stoneDark, 1, 1);
  }
}

export function drawListeningWire(ctx, cx, cy, seed) {
  const frame = isoFrame(cx, cy, 'se');
  const rng = rngFrom(hash2D(seed + 353, seed * 19 + 103));
  const path = [
    frame.point(-0.46, -0.12),
    frame.point(-0.15, -0.07),
    frame.point(0.14, -0.02),
    frame.point(0.46, 0.08)
  ];
  for (let i = 0; i < path.length - 1; i += 1) {
    linePx(ctx, path[i][0], path[i][1], path[i + 1][0], path[i + 1][1], PALETTE.outline, 2);
    linePx(ctx, path[i][0], path[i][1] - 1, path[i + 1][0], path[i + 1][1] - 1, i === 1 ? PALETTE.rustLight : PALETTE.rustMid, 1);
  }
  const returnPath = [
    frame.point(-0.44, 0.06),
    frame.point(-0.14, 0.1),
    frame.point(0.16, 0.14),
    frame.point(0.44, 0.19)
  ];
  for (let i = 0; i < returnPath.length - 1; i += 1) {
    linePx(ctx, returnPath[i][0], returnPath[i][1], returnPath[i + 1][0], returnPath[i + 1][1], PALETTE.stoneDark, 2);
    linePx(ctx, returnPath[i][0], returnPath[i][1] - 1, returnPath[i + 1][0], returnPath[i + 1][1] - 1, PALETTE.rustDark, 1);
  }
  for (const point of [path[0], path[2], path[3], returnPath[1], returnPath[3]]) {
    px(ctx, point[0] - 1, point[1] - 1, PALETTE.outline, 4, 3);
    px(ctx, point[0], point[1] - 1, rng() > 0.4 ? PALETTE.rustMid : PALETTE.rustLight, 2, 1);
  }
}

export function drawSealedListeningNiche(ctx, cx, cy, seed, opts = {}) {
  const opened = Boolean(opts.opened);
  const face = fixtureFace(ctx, cx, cy, opts);
  const rng = rngFrom(hash2D(seed + 359, seed * 23 + 107));
  const sill = face.point(0.5, 1);
  drawShadowBlob(ctx, sill[0], sill[1] + 3, 61, 20);

  if (!opened) {
    face.rect(0, 0, 1, 1, PALETTE.outline);
    face.rect(0.035, 0.035, 0.965, 0.965, PALETTE.stoneDark);
    face.rect(0.09, 0.08, 0.91, 0.93, PALETTE.outline);
    face.rect(0.13, 0.11, 0.87, 0.9, PALETTE.stoneMid);
    face.line(0.04, 0.03, 0.96, 0.03, PALETTE.stoneDust, 3);
    face.line(0.04, 0.97, 0.96, 0.97, PALETTE.outline, 4);
    face.line(0.1, 0.09, 0.1, 0.92, PALETTE.stoneLight, 2);
    face.line(0.9, 0.09, 0.9, 0.92, PALETTE.outline, 4);
    for (const v of [0.25, 0.5, 0.74]) {
      face.line(0.12, v, 0.88, v, PALETTE.outline, 4);
      face.line(0.16, v - 0.025, 0.84, v - 0.025, PALETTE.rustDark, 2);
      for (const u of [0.2, 0.8]) {
        const bolt = face.point(u, v - 0.04);
        px(ctx, bolt[0] - 2, bolt[1] - 2, PALETTE.outline, 5, 4);
        px(ctx, bolt[0] - 1, bolt[1] - 1, PALETTE.rustLight, 3, 2);
      }
    }
    const hatch = face.point(0.5, 0.43);
    px(ctx, hatch[0] - 10, hatch[1] - 5, PALETTE.outline, 21, 11);
    px(ctx, hatch[0] - 9, hatch[1] - 4, PALETTE.void, 19, 8);
    px(ctx, hatch[0] - 8, hatch[1] - 3, PALETTE.hostBlack, 17, 5);
    px(ctx, hatch[0] - 7, hatch[1] - 2, PALETTE.stoneDust, 6, 1);
    const seal = face.point(0.68, 0.62);
    px(ctx, seal[0] - 4, seal[1] - 5, PALETTE.outline, 9, 10);
    px(ctx, seal[0] - 3, seal[1] - 4, PALETTE.rustDark, 7, 8);
    px(ctx, seal[0] - 1, seal[1] - 2, PALETTE.hostGold, 3, 4);
    linePx(ctx, seal[0], seal[1] + 3, seal[0] - 7, seal[1] + 12, PALETTE.rustDark, 1);
  } else {
    // The centre stays transparent so the person in the niche remains visible.
    // Both seal leaves remain stacked behind the jambs, preserving the closed
    // state's physical mass instead of shrinking to an empty outline.
    face.rect(0, 0, 1, 0.12, PALETTE.outline);
    face.rect(0.03, 0.03, 0.97, 0.09, PALETTE.stoneDust);
    face.rect(0, 0.88, 1, 1, PALETTE.outline);
    face.rect(0.05, 0.9, 0.95, 0.96, PALETTE.stoneDark);
    face.rect(0, 0.08, 0.24, 0.92, PALETTE.outline);
    face.rect(0.04, 0.12, 0.2, 0.88, PALETTE.stoneMid);
    face.line(0.05, 0.12, 0.05, 0.88, PALETTE.stoneDust, 2);
    face.line(0.19, 0.13, 0.19, 0.87, PALETTE.stoneDark, 3);
    face.rect(0.76, 0.08, 1, 0.92, PALETTE.outline);
    face.rect(0.8, 0.12, 0.96, 0.88, PALETTE.stoneDark);
    face.line(0.81, 0.13, 0.81, 0.87, PALETTE.stoneMid, 2);
    face.line(0.95, 0.12, 0.95, 0.88, PALETTE.void, 2);
    for (const v of [0.26, 0.5, 0.74]) {
      face.line(0.04, v, 0.2, v, PALETTE.rustDark, 2);
      face.line(0.8, v, 0.96, v, PALETTE.outline, 2);
    }
    for (const [u, v] of [[0.08, 0.26], [0.92, 0.5], [0.08, 0.74], [0.92, 0.74]]) {
      const pin = face.point(u, v);
      px(ctx, pin[0] - 2, pin[1] - 2, PALETTE.outline, 5, 4);
      px(ctx, pin[0] - 1, pin[1] - 1, PALETTE.rustLight, 3, 2);
    }
    const tornSeal = face.point(0.83, 0.63);
    linePx(ctx, tornSeal[0], tornSeal[1], tornSeal[0] - 7, tornSeal[1] + 13, PALETTE.rustDark, 1);
    px(ctx, tornSeal[0] - 9, tornSeal[1] + 12, PALETTE.hostGold, 3, 2);
  }

  for (let i = 0; i < 5; i += 1) {
    const u = opened
      ? (rng() < 0.5 ? 0.06 + rng() * 0.13 : 0.81 + rng() * 0.13)
      : 0.17 + rng() * 0.66;
    const scratch = face.point(u, 0.14 + rng() * 0.68);
    px(ctx, scratch[0], scratch[1], rng() < 0.55 ? PALETTE.stoneDust : PALETTE.rustDark, 2, 1);
  }
}
