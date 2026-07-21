// Reusable furniture for the Long Ash farm interiors. These pieces describe
// ordinary work and domestic storage, while the level data decides who owned
// them and where they belong.

import { PALETTE } from '../palette.js';
import {
  drawIsoDiamond,
  drawPropLeg,
  faceTools,
  footprintExtent,
  hash2D,
  isoFrame,
  linePx,
  nativeLinePx,
  nativePx,
  orientedBox,
  poly,
  px,
  rngFrom
} from './basePixels.js';

export function drawFarmBed(ctx, cx, cy, seed, opts = {}) {
  const frame = isoFrame(cx, cy, opts.orient);
  const rng = rngFrom(hash2D(seed + 17, seed * 7 + 5));
  const lenA = 1.62;
  const lenB = 0.78;
  const ha = lenA / 2;
  const hb = lenB / 2;
  const frameH = 7;
  const mattressH = 6;
  const topH = frameH + mattressH;
  const ext = footprintExtent(lenA, lenB);

  const corners = [
    frame.point(-ha + 0.06, -hb + 0.06),
    frame.point(ha - 0.06, -hb + 0.06),
    frame.point(ha - 0.06, hb - 0.06),
    frame.point(-ha + 0.06, hb - 0.06)
  ].sort((a, b) => a[1] - b[1]);
  for (const corner of corners) drawPropLeg(ctx, corner, 8, PALETTE.woodDark);

  // A narrow timber frame with a thick straw mattress. The cap is kept pale
  // enough to read against the farmhouse floor, but the lower faces remain
  // dirty and heavy.
  const bedFrame = orientedBox(ctx, frame, lenA, lenB, frameH, {
    top: PALETTE.woodMid,
    lit: PALETTE.woodMid,
    shade: PALETTE.woodDark,
    outline: PALETTE.outline
  });
  linePx(ctx, bedFrame.cap.left[0], bedFrame.cap.left[1], bedFrame.cap.top[0], bedFrame.cap.top[1], PALETTE.woodLight, 1);
  const mattress = orientedBox(ctx, frame, lenA - 0.12, lenB - 0.14, mattressH, {
    top: PALETTE.clothTan,
    lit: PALETTE.stoneDust,
    shade: PALETTE.stoneMid,
    outline: PALETTE.outline
  }, frameH);
  linePx(ctx, mattress.cap.left[0], mattress.cap.left[1], mattress.cap.top[0], mattress.cap.top[1], PALETTE.hostBone, 1);

  // A dark patched quilt covers the foot half. It follows the authored facing
  // so a row of beds keeps one believable head and foot direction.
  const quilt = [
    frame.point(0.02, -hb + 0.08, topH + 1),
    frame.point(ha - 0.08, -hb + 0.08, topH + 1),
    frame.point(ha - 0.08, hb - 0.08, topH + 1),
    frame.point(0.02, hb - 0.08, topH + 1)
  ];
  poly(ctx, PALETTE.outline, quilt.map(([x, y]) => [x, y + 1]));
  poly(ctx, PALETTE.clothDark, quilt);
  const quiltBandA = frame.point(0.2, -hb + 0.08, topH + 2);
  const quiltBandB = frame.point(0.2, hb - 0.08, topH + 2);
  linePx(ctx, quiltBandA[0], quiltBandA[1], quiltBandB[0], quiltBandB[1], PALETTE.rustDark, 2);
  if ((seed & 1) === 0) {
    const patch = [
      frame.point(0.42, -0.18, topH + 2),
      frame.point(0.6, -0.18, topH + 2),
      frame.point(0.6, 0.02, topH + 2),
      frame.point(0.42, 0.02, topH + 2)
    ];
    poly(ctx, PALETTE.rustMid, patch);
    const stitchA = frame.point(0.43, -0.16, topH + 3);
    const stitchB = frame.point(0.59, 0, topH + 3);
    linePx(ctx, stitchA[0], stitchA[1], stitchB[0], stitchB[1], PALETTE.clothTan, 1);
  }

  // A compressed pillow and the crease where the same head rested nightly.
  const pillow = [
    frame.point(-0.68, -0.25, topH + 2),
    frame.point(-0.35, -0.25, topH + 2),
    frame.point(-0.35, 0.25, topH + 2),
    frame.point(-0.68, 0.25, topH + 2)
  ];
  poly(ctx, PALETTE.outline, pillow.map(([x, y]) => [x, y + 1]));
  poly(ctx, PALETTE.stoneDust, pillow);
  const creaseA = frame.point(-0.52, -0.2, topH + 3);
  const creaseB = frame.point(-0.52, 0.2, topH + 3);
  linePx(ctx, creaseA[0], creaseA[1], creaseB[0], creaseB[1], PALETTE.stoneMid, 1);

  // Tall head posts and cross rails give the low bed a clear silhouette.
  const headPosts = [frame.point(-ha + 0.03, -hb + 0.02), frame.point(-ha + 0.03, hb - 0.02)];
  for (const post of headPosts) {
    px(ctx, post[0] - 2, post[1] - 30, PALETTE.outline, 5, 31);
    px(ctx, post[0] - 1, post[1] - 29, PALETTE.woodDark, 3, 29);
    px(ctx, post[0] - 1, post[1] - 29, PALETTE.woodLight, 1, 24);
    px(ctx, post[0] - 2, post[1] - 33, PALETTE.outline, 5, 4);
    px(ctx, post[0] - 1, post[1] - 32, PALETTE.stoneDust, 3, 2);
  }
  for (const lift of [21, 28]) {
    linePx(ctx, headPosts[0][0], headPosts[0][1] - lift, headPosts[1][0], headPosts[1][1] - lift, PALETTE.outline, 4);
    linePx(ctx, headPosts[0][0], headPosts[0][1] - lift - 1, headPosts[1][0], headPosts[1][1] - lift - 1, PALETTE.woodMid, 1);
  }

  // Slippers left beside the bed keep the prop domestic at map scale.
  const side = frame.point(0.24, hb + 0.18);
  const jitter = rng() < 0.5 ? -1 : 1;
  px(ctx, side[0] - 5, side[1] + 1, PALETTE.outline, 7, 3);
  px(ctx, side[0] - 4, side[1], PALETTE.rustDark, 5, 2);
  px(ctx, side[0] + 3 + jitter, side[1] + 2, PALETTE.outline, 7, 3);
  px(ctx, side[0] + 4 + jitter, side[1] + 1, PALETTE.woodDark, 5, 2);

  nativeLinePx(ctx, mattress.cap.left[0] + 1.5, mattress.cap.left[1] - 0.5, mattress.cap.top[0] - 1.5, mattress.cap.top[1] + 0.5, PALETTE.hostBone);
  const mattressSeamA = frame.point(-ha + 0.08, hb - 0.09, topH);
  const mattressSeamB = frame.point(ha - 0.08, hb - 0.09, topH);
  nativeLinePx(ctx, mattressSeamA[0], mattressSeamA[1], mattressSeamB[0], mattressSeamB[1], PALETTE.stoneDust);
  nativeLinePx(ctx, quiltBandA[0] - 0.5, quiltBandA[1], quiltBandB[0] - 0.5, quiltBandB[1], PALETTE.rustMid);
  nativeLinePx(ctx, creaseA[0] - 0.5, creaseA[1], creaseB[0] - 0.5, creaseB[1], PALETTE.stoneDust);
  for (const post of headPosts) nativeLinePx(ctx, post[0] - 0.5, post[1] - 28.5, post[0] - 0.5, post[1] - 5.5, PALETTE.woodLight);
  nativePx(ctx, side[0] - 2.5, side[1] + 0.5, PALETTE.rustMid);
}

function drawSack(ctx, x, baseY, width, height, seed) {
  const maxHalf = Math.max(5, Math.floor(width / 2));
  for (let row = 0; row < height; row += 1) {
    const bodyT = Math.max(0, (row - 3) / Math.max(1, height - 4));
    const half = row < 3
      ? 2 + row
      : Math.max(4, Math.round(maxHalf - Math.abs(bodyT - 0.55) * 2.5));
    const y = baseY - height + row;
    px(ctx, x - half - 1, y, PALETTE.outline, half * 2 + 2, 1);
    px(ctx, x - half, y, PALETTE.clothTan, half, 1);
    px(ctx, x, y, row > height * 0.72 ? PALETTE.woodDark : PALETTE.stoneDust, half, 1);
    if (row > 4 && row % 4 === 0) px(ctx, x - half + 2, y, PALETTE.hostBone, Math.max(1, Math.floor(half * 0.35)), 1);
  }
  px(ctx, x - 3, baseY - height - 2, PALETTE.outline, 7, 3);
  px(ctx, x - 2, baseY - height - 2, PALETTE.stoneDust, 5, 2);
  px(ctx, x - 4, baseY - height + 1, PALETTE.rustDark, 9, 1);
  linePx(ctx, x, baseY - height + 4, x + ((seed & 1) ? 2 : -2), baseY - 4, PALETTE.stoneMid, 1);
  if (seed % 3 === 0) {
    px(ctx, x - 4, baseY - Math.floor(height * 0.55), PALETTE.rustDark, 8, 2);
    px(ctx, x - 2, baseY - Math.floor(height * 0.55) - 1, PALETTE.clothTan, 4, 1);
  }
}

export function drawGrainSackStack(ctx, cx, cy, seed) {
  const rng = rngFrom(hash2D(seed + 29, seed * 11 + 3));
  const sacks = [
    { dx: -15, dy: -3, w: 17, h: 17 },
    { dx: 9, dy: -5, w: 18, h: 19 },
    { dx: -3, dy: 5, w: 20, h: 21 },
    { dx: 18, dy: 6, w: 16, h: 17 },
    { dx: -23, dy: 7, w: 15, h: 16 }
  ];
  const count = 4 + (seed % 3 === 0 ? 1 : 0);
  for (const [index, sack] of sacks.slice(0, count).sort((a, b) => a.dy - b.dy).entries()) {
    drawSack(ctx, cx + sack.dx, cy + sack.dy, sack.w, sack.h, seed + index * 13);
  }

  // A small spill joins the stack to the floor. The grains stay dull and
  // sparse, never a bright gold patch.
  const spillX = cx - 7 + Math.floor(rng() * 14);
  drawIsoDiamond(ctx, spillX, cy + 9, 22, 8, PALETTE.woodDark);
  for (let i = 0; i < 12; i += 1) {
    px(ctx, spillX - 9 + Math.floor(rng() * 19), cy + 6 + Math.floor(rng() * 7), i % 3 === 0 ? PALETTE.clothTan : PALETTE.stoneDust, 1, 1);
  }
  for (const [index, sack] of sacks.slice(0, count).entries()) {
    const sx = cx + sack.dx;
    const top = cy + sack.dy - sack.h;
    nativeLinePx(ctx, sx - 3.5, top + 2.5, sx + 3.5, top + 2.5, PALETTE.hostBone);
    nativeLinePx(ctx, sx - 4.5, top + 5.5, sx + ((seed + index * 13) & 1 ? 1.5 : -1.5), cy + sack.dy - 4.5, PALETTE.stoneDust);
  }
  nativeLinePx(ctx, spillX - 7.5, cy + 7.5, spillX + 7.5, cy + 7.5, PALETTE.clothTan);
  nativePx(ctx, spillX - 2.5, cy + 9.5, PALETTE.stoneDust);
}

export function drawGrainBin(ctx, cx, cy, seed, opts = {}) {
  const frame = isoFrame(cx, cy, opts.orient);
  const rng = rngFrom(hash2D(seed + 41, seed * 13 + 7));
  const lenA = 1.28;
  const lenB = 0.82;
  const ha = lenA / 2;
  const hb = lenB / 2;
  const binH = 25;
  const ext = footprintExtent(lenA, lenB);

  const box = orientedBox(ctx, frame, lenA, lenB, binH, {
    top: PALETTE.woodMid,
    lit: PALETTE.woodMid,
    shade: PALETTE.woodDark,
    outline: PALETTE.outline
  });
  const litFace = faceTools(ctx, box.cap.left, box.cap.bottom, box.base.bottom, box.base.left);
  const shadeFace = faceTools(ctx, box.cap.bottom, box.cap.right, box.base.right, box.base.bottom);
  for (const u of [0.25, 0.5, 0.75]) {
    litFace.line(u, 0.08, u, 0.94, PALETTE.woodDark, 1);
    shadeFace.line(u, 0.08, u, 0.94, PALETTE.outline, 1);
  }
  litFace.line(0.04, 0.42, 0.96, 0.42, PALETTE.woodLight, 2);
  shadeFace.line(0.04, 0.42, 0.96, 0.42, PALETTE.rustDark, 2);
  litFace.line(0.08, 0.82, 0.92, 0.82, PALETTE.rustDark, 1);
  shadeFace.line(0.08, 0.82, 0.92, 0.82, PALETTE.outline, 1);

  // The open mouth and dull grain surface make this a bin, not a sealed crate.
  const mouth = [
    frame.point(-ha + 0.08, -hb + 0.08, binH + 1),
    frame.point(ha - 0.08, -hb + 0.08, binH + 1),
    frame.point(ha - 0.08, hb - 0.08, binH + 1),
    frame.point(-ha + 0.08, hb - 0.08, binH + 1)
  ];
  poly(ctx, PALETTE.outline, mouth);
  const grain = [
    frame.point(-ha + 0.16, -hb + 0.16, binH + 2),
    frame.point(ha - 0.16, -hb + 0.16, binH + 2),
    frame.point(ha - 0.16, hb - 0.16, binH + 2),
    frame.point(-ha + 0.16, hb - 0.16, binH + 2)
  ];
  poly(ctx, PALETTE.clothTan, grain);
  for (let i = 0; i < 10; i += 1) {
    const p = frame.point(-ha + 0.2 + rng() * (lenA - 0.4), -hb + 0.18 + rng() * (lenB - 0.36), binH + 3);
    px(ctx, p[0], p[1], i % 3 === 0 ? PALETTE.hostBone : PALETTE.stoneDust, 1, 1);
  }

  // A wooden scoop lies across the top. Its broad cup explains how the bin is
  // used from a distance.
  const handleA = frame.point(-0.36, -0.05, binH + 5);
  const handleB = frame.point(0.3, 0.12, binH + 5);
  linePx(ctx, handleA[0], handleA[1], handleB[0], handleB[1], PALETTE.outline, 3);
  linePx(ctx, handleA[0], handleA[1] - 1, handleB[0], handleB[1] - 1, PALETTE.woodLight, 1);
  const scoop = frame.point(0.4, 0.16, binH + 5);
  drawIsoDiamond(ctx, scoop[0], scoop[1], 12, 6, PALETTE.outline);
  drawIsoDiamond(ctx, scoop[0], scoop[1] - 1, 9, 4, PALETTE.woodMid);

  const spill = frame.point(ha + 0.18, 0.18);
  for (let i = 0; i < 7; i += 1) {
    px(ctx, spill[0] - 4 + Math.floor(rng() * 9), spill[1] + Math.floor(rng() * 5), i % 2 ? PALETTE.stoneDust : PALETTE.clothTan, 1, 1);
  }
  litFace.nativeLine(0.06, 0.18, 0.94, 0.18, PALETTE.woodLight);
  litFace.nativeLine(0.08, 0.62, 0.92, 0.62, PALETTE.woodMid);
  shadeFace.nativeLine(0.08, 0.62, 0.92, 0.62, PALETTE.rustDark);
  const grainLineA = frame.point(-ha + 0.18, -0.12, binH + 2.5);
  const grainLineB = frame.point(ha - 0.18, -0.12, binH + 2.5);
  nativeLinePx(ctx, grainLineA[0], grainLineA[1], grainLineB[0], grainLineB[1], PALETTE.stoneDust);
  nativeLinePx(ctx, handleA[0], handleA[1] - 1.5, handleB[0], handleB[1] - 1.5, PALETTE.woodLight);
  nativePx(ctx, scoop[0] - 2.5, scoop[1] - 1.5, PALETTE.woodLight);
}

export function drawFarmWorkbench(ctx, cx, cy, seed, opts = {}) {
  const frame = isoFrame(cx, cy, opts.orient);
  const rng = rngFrom(hash2D(seed + 53, seed * 17 + 11));
  const lenA = 1.55;
  const lenB = 0.68;
  const ha = lenA / 2;
  const hb = lenB / 2;
  const legH = 16;
  const slabH = 5;
  const topH = legH + slabH;
  const ext = footprintExtent(lenA, lenB);

  // Peg rail first so the bench body naturally occludes its lower posts.
  const backA = frame.point(-ha + 0.08, -hb + 0.04);
  const backB = frame.point(ha - 0.08, -hb + 0.04);
  for (const post of [backA, backB]) {
    px(ctx, post[0] - 2, post[1] - 43, PALETTE.outline, 5, 44);
    px(ctx, post[0] - 1, post[1] - 42, PALETTE.woodDark, 3, 42);
    px(ctx, post[0] - 1, post[1] - 42, PALETTE.woodMid, 1, 36);
  }
  for (const lift of [31, 40]) {
    linePx(ctx, backA[0], backA[1] - lift, backB[0], backB[1] - lift, PALETTE.outline, 4);
    linePx(ctx, backA[0], backA[1] - lift - 1, backB[0], backB[1] - lift - 1, PALETTE.woodMid, 1);
  }
  for (const [la, drop, tone] of [[-0.45, 9, PALETTE.rustLight], [0, 13, PALETTE.stoneLight], [0.45, 7, PALETTE.rustMid]]) {
    const hook = frame.point(la, -hb + 0.04, 38);
    px(ctx, hook[0] - 1, hook[1] - 1, PALETTE.outline, 3, 3);
    linePx(ctx, hook[0], hook[1] + 1, hook[0] + ((la > 0) ? 2 : -1), hook[1] + drop, PALETTE.outline, 3);
    linePx(ctx, hook[0], hook[1] + 1, hook[0] + ((la > 0) ? 2 : -1), hook[1] + drop, tone, 1);
  }

  const legs = [
    frame.point(-ha + 0.08, -hb + 0.08),
    frame.point(ha - 0.08, -hb + 0.08),
    frame.point(ha - 0.08, hb - 0.08),
    frame.point(-ha + 0.08, hb - 0.08)
  ].sort((a, b) => a[1] - b[1]);
  for (const leg of legs) drawPropLeg(ctx, leg, legH, PALETTE.woodDark);

  const lowerShelf = orientedBox(ctx, frame, lenA - 0.18, lenB - 0.16, 3, {
    top: PALETTE.woodDark,
    lit: PALETTE.woodMid,
    shade: PALETTE.outline,
    outline: PALETTE.outline
  }, 5);
  linePx(ctx, lowerShelf.cap.left[0], lowerShelf.cap.left[1], lowerShelf.cap.top[0], lowerShelf.cap.top[1], PALETTE.woodMid, 1);
  const top = orientedBox(ctx, frame, lenA, lenB, slabH, {
    top: PALETTE.woodMid,
    lit: PALETTE.woodMid,
    shade: PALETTE.woodDark,
    outline: PALETTE.outline
  }, legH);
  linePx(ctx, top.cap.left[0], top.cap.left[1], top.cap.top[0], top.cap.top[1], PALETTE.woodLight, 1);
  linePx(ctx, top.cap.top[0], top.cap.top[1], top.cap.right[0], top.cap.right[1], PALETTE.woodLight, 1);

  // A fixed vise anchors the silhouette at one end.
  const viseCenter = frame.point(0.52, 0.05, topH + 1);
  const viseFrame = isoFrame(viseCenter[0], viseCenter[1], opts.orient);
  orientedBox(ctx, viseFrame, 0.3, 0.38, 7, {
    top: PALETTE.rustMid,
    lit: PALETTE.rustLight,
    shade: PALETTE.rustDark,
    outline: PALETTE.outline
  });
  const jawA = frame.point(0.41, -0.18, topH + 8);
  const jawB = frame.point(0.64, -0.18, topH + 8);
  linePx(ctx, jawA[0], jawA[1], jawB[0], jawB[1], PALETTE.stoneLight, 2);
  const screw = frame.point(0.68, 0.08, topH + 3);
  linePx(ctx, screw[0] - 5, screw[1], screw[0] + 5, screw[1], PALETTE.outline, 3);
  linePx(ctx, screw[0] - 4, screw[1] - 1, screw[0] + 4, screw[1] - 1, PALETTE.rustLight, 1);

  // Hammer, saw, and loose nails make the bench's use legible without labels.
  const hammerA = frame.point(-0.55, -0.12, topH + 2);
  const hammerB = frame.point(-0.1, 0.1, topH + 2);
  linePx(ctx, hammerA[0], hammerA[1], hammerB[0], hammerB[1], PALETTE.woodLight, 2);
  px(ctx, hammerA[0] - 4, hammerA[1] - 2, PALETTE.outline, 9, 4);
  px(ctx, hammerA[0] - 3, hammerA[1] - 2, PALETTE.stoneLight, 7, 2);
  const sawA = frame.point(-0.34, 0.18, topH + 3);
  const sawB = frame.point(0.22, -0.12, topH + 3);
  linePx(ctx, sawA[0], sawA[1], sawB[0], sawB[1], PALETTE.outline, 3);
  linePx(ctx, sawA[0], sawA[1] - 1, sawB[0], sawB[1] - 1, PALETTE.stoneLight, 1);
  for (let i = 1; i < 5; i += 1) {
    const t = i / 5;
    px(ctx, sawA[0] + (sawB[0] - sawA[0]) * t, sawA[1] + (sawB[1] - sawA[1]) * t + 1, PALETTE.outline, 1, 2);
  }
  for (let i = 0; i < 6; i += 1) {
    const nail = frame.point(-0.18 + rng() * 0.35, -0.18 + rng() * 0.24, topH + 3);
    px(ctx, nail[0], nail[1], i % 2 ? PALETTE.rustLight : PALETTE.stoneLight, 2, 1);
  }

  // One worn glove was set on the lower shelf rather than dropped at random.
  const glove = frame.point(-0.35, 0.12, 9);
  px(ctx, glove[0] - 4, glove[1] - 3, PALETTE.outline, 9, 5);
  px(ctx, glove[0] - 3, glove[1] - 3, PALETTE.clothTan, 6, 3);
  px(ctx, glove[0] + 3, glove[1] - 5, PALETTE.clothTan, 2, 3);
  for (const post of [backA, backB]) nativeLinePx(ctx, post[0] - 0.5, post[1] - 41.5, post[0] - 0.5, post[1] - 6.5, PALETTE.woodLight);
  nativeLinePx(ctx, top.cap.left[0] + 1.5, top.cap.left[1] - 0.5, top.cap.top[0] - 1.5, top.cap.top[1] + 0.5, PALETTE.woodLight);
  nativeLinePx(ctx, jawA[0], jawA[1] - 0.5, jawB[0], jawB[1] - 0.5, PALETTE.hostBone);
  nativeLinePx(ctx, screw[0] - 3.5, screw[1] - 1.5, screw[0] + 3.5, screw[1] - 1.5, PALETTE.rustLight);
  nativeLinePx(ctx, hammerA[0], hammerA[1] - 0.5, hammerB[0], hammerB[1] - 0.5, PALETTE.woodLight);
  nativeLinePx(ctx, sawA[0], sawA[1] - 1.5, sawB[0], sawB[1] - 1.5, PALETTE.stoneLight);
  nativeLinePx(ctx, glove[0] - 2.5, glove[1] - 2.5, glove[0] + 2.5, glove[1] - 2.5, PALETTE.stoneDust);
}

export function drawStableDivider(ctx, cx, cy, seed, opts = {}) {
  const frame = isoFrame(cx, cy, opts.orient);
  const rng = rngFrom(hash2D(seed + 67, seed * 19 + 13));
  const a = frame.point(-0.5, 0);
  const b = frame.point(0.5, 0);

  // A solid kickboard keeps hooves out of the aisle. Rails above it keep the
  // divider readable and let adjacent pieces form a continuous stall run.
  const kick = orientedBox(ctx, frame, 1.04, 0.14, 14, {
    top: PALETTE.woodMid,
    lit: PALETTE.woodMid,
    shade: PALETTE.woodDark,
    outline: PALETTE.outline
  });
  linePx(ctx, kick.cap.left[0], kick.cap.left[1], kick.cap.top[0], kick.cap.top[1], PALETTE.woodLight, 1);
  for (const post of [a, b]) {
    px(ctx, post[0] - 3, post[1] - 38, PALETTE.outline, 7, 41);
    px(ctx, post[0] - 2, post[1] - 37, PALETTE.woodDark, 5, 38);
    px(ctx, post[0] - 2, post[1] - 37, PALETTE.woodMid, 2, 34);
    px(ctx, post[0] - 3, post[1] - 42, PALETTE.outline, 7, 5);
    px(ctx, post[0] - 2, post[1] - 41, PALETTE.stoneDust, 5, 3);
  }
  for (const lift of [23, 33]) {
    linePx(ctx, a[0], a[1] - lift, b[0], b[1] - lift, PALETTE.outline, 5);
    linePx(ctx, a[0], a[1] - lift - 1, b[0], b[1] - lift - 1, PALETTE.woodMid, 2);
    linePx(ctx, a[0], a[1] - lift + 1, b[0], b[1] - lift + 1, PALETTE.woodDark, 1);
  }

  // A halter loop hangs from one post. It is squared off in hard pixels and
  // physically tied to the rail, never a floating icon.
  const hitch = (seed & 1) ? a : b;
  const side = hitch === a ? 1 : -1;
  px(ctx, hitch[0] + side, hitch[1] - 29, PALETTE.rustLight, 2, 2);
  linePx(ctx, hitch[0] + side * 2, hitch[1] - 27, hitch[0] + side * 8, hitch[1] - 19, PALETTE.rustDark, 1);
  linePx(ctx, hitch[0] + side * 8, hitch[1] - 19, hitch[0] + side * 5, hitch[1] - 12, PALETTE.rustDark, 1);
  linePx(ctx, hitch[0] + side * 5, hitch[1] - 12, hitch[0] + side, hitch[1] - 18, PALETTE.rustDark, 1);

  for (let i = 0; i < 8; i += 1) {
    const p = frame.point(-0.45 + rng() * 0.9, 0.06 + rng() * 0.18);
    px(ctx, p[0], p[1] + 1, i % 3 === 0 ? PALETTE.clothTan : PALETTE.stoneDust, 2 + (i & 1), 1);
  }
  nativeLinePx(ctx, kick.cap.left[0] + 1.5, kick.cap.left[1] - 0.5, kick.cap.top[0] - 1.5, kick.cap.top[1] + 0.5, PALETTE.woodLight);
  for (const post of [a, b]) nativeLinePx(ctx, post[0] - 0.5, post[1] - 36.5, post[0] - 0.5, post[1] - 5.5, PALETTE.woodLight);
  for (const lift of [23.5, 33.5]) nativeLinePx(ctx, a[0] + 0.5, a[1] - lift, b[0] - 0.5, b[1] - lift, PALETTE.woodLight);
  nativeLinePx(ctx, hitch[0] + side * 2.5, hitch[1] - 26.5, hitch[0] + side * 7.5, hitch[1] - 19.5, PALETTE.rustMid);
  nativePx(ctx, hitch[0] + side * 1.5, hitch[1] - 28.5, PALETTE.rustLight);
}
