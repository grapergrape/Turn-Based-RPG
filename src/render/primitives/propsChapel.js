import { PALETTE } from '../palette.js';
import { TILE_WIDTH, TILE_HEIGHT, WALL_HEIGHT } from '../renderConfig.js';
import {
  diamond,
  drawCracks,
  drawDitherRect,
  drawFloorGrime,
  drawHostGrowth,
  drawIsoDiamond,
  drawIsoPrism,
  drawNoisePixels,
  drawPixelShadow,
  drawPropLeg,
  drawRubbleCluster,
  drawScorchMark,
  drawShadowBlob,
  drawWarmLightPool,
  drawWaxStain,
  faceTools,
  footprintExtent,
  hash2D,
  isoFrame,
  linePx,
  mixPoint,
  normalizeOrient,
  ORIENTS,
  orientedBox,
  poly,
  px,
  rngFrom,
  wallRunFace
} from './basePixels.js';

// Portable props, chapel objects, and camp dressing.

export function drawRustedReliquary(ctx, cx, cy, seed) {
  const rng = rngFrom(hash2D(seed + 271, seed * 5 + 23));
  drawShadowBlob(ctx, cx, cy + 5, 43, 17);

  // Arched chapel chest: stepped lid, side face, front face.
  poly(ctx, PALETTE.outline, [
    [cx - 20, cy - 20],
    [cx - 13, cy - 31],
    [cx + 12, cy - 35],
    [cx + 22, cy - 25],
    [cx + 22, cy - 5],
    [cx + 4, cy + 7],
    [cx - 20, cy - 4]
  ]);
  poly(ctx, PALETTE.rustDark, [
    [cx + 4, cy - 15],
    [cx + 22, cy - 25],
    [cx + 22, cy - 6],
    [cx + 4, cy + 7]
  ]);
  poly(ctx, PALETTE.rustMid, [
    [cx - 20, cy - 20],
    [cx + 4, cy - 15],
    [cx + 4, cy + 7],
    [cx - 20, cy - 4]
  ]);
  poly(ctx, PALETTE.rustLight, [
    [cx - 16, cy - 25],
    [cx - 9, cy - 32],
    [cx + 10, cy - 35],
    [cx + 19, cy - 25],
    [cx + 4, cy - 15],
    [cx - 20, cy - 20]
  ]);

  px(ctx, cx - 15, cy - 18, PALETTE.hostGold, 33, 2);
  px(ctx, cx - 3, cy - 13, PALETTE.hostGold, 6, 8);
  px(ctx, cx - 1, cy - 10, PALETTE.outline, 2, 3);
  px(ctx, cx - 18, cy - 6, PALETTE.outline, 42, 3);
  px(ctx, cx - 16, cy - 7, PALETTE.rustLight, 15, 1);
  px(ctx, cx + 4, cy - 6, PALETTE.rustDark, 18, 1);
  linePx(ctx, cx - 15, cy - 22, cx + 17, cy - 26, PALETTE.outline, 1);
  linePx(ctx, cx - 13, cy - 23, cx + 15, cy - 27, PALETTE.rustDark, 1);
  px(ctx, cx - 14, cy - 25, PALETTE.hostBone, 9, 1);
  px(ctx, cx - 11, cy - 28, PALETTE.hostBone, 2, 7);
  for (const dx of [-14, -7, 8, 15]) {
    px(ctx, cx + dx - 1, cy - 15, PALETTE.outline, 4, 4);
    px(ctx, cx + dx, cy - 14, PALETTE.rustLight, 2, 2);
  }
  px(ctx, cx + 11, cy - 32, PALETTE.outline, 6, 3);
  px(ctx, cx + 12, cy - 33, PALETTE.hostBone, 3, 1);
  for (let i = 0; i < 5; i += 1) {
    const x = cx - 18 + Math.floor(rng() * 38);
    const y = cy - 28 + Math.floor(rng() * 24);
    px(ctx, x, y, rng() < 0.5 ? PALETTE.rustDark : PALETTE.stoneDark, 1 + (i % 2), 1);
  }
  drawRubbleCluster(ctx, cx + 20, cy + 8, seed + 273, 2);
  drawNoisePixels(ctx, cx - 19, cy - 32, 40, 31, [PALETTE.rustDark, PALETTE.stoneDark], 0.045, seed);
}

export function drawFieldSatchel(ctx, cx, cy, seed) {
  const rng = rngFrom(hash2D(seed + 281, seed * 3 + 37));
  drawShadowBlob(ctx, cx, cy + 3, 32, 12);
  poly(ctx, PALETTE.outline, [
    [cx - 15, cy - 7],
    [cx + 2, cy - 15],
    [cx + 16, cy - 7],
    [cx + 13, cy + 4],
    [cx - 6, cy + 9],
    [cx - 16, cy + 2]
  ]);
  poly(ctx, PALETTE.skinDark, [
    [cx - 13, cy - 6],
    [cx + 2, cy - 13],
    [cx + 14, cy - 6],
    [cx + 11, cy + 3],
    [cx - 6, cy + 7],
    [cx - 14, cy + 1]
  ]);
  poly(ctx, PALETTE.clothTan, [
    [cx - 10, cy - 9],
    [cx + 2, cy - 14],
    [cx + 11, cy - 9],
    [cx + 2, cy - 5]
  ]);
  linePx(ctx, cx - 13, cy - 5, cx - 5, cy - 14, PALETTE.outline, 2);
  linePx(ctx, cx - 5, cy - 14, cx + 4, cy - 16, PALETTE.outline, 2);
  linePx(ctx, cx + 4, cy - 16, cx + 14, cy - 6, PALETTE.outline, 2);
  linePx(ctx, cx - 12, cy - 6, cx - 4, cy - 15, PALETTE.clothDark, 1);
  linePx(ctx, cx - 4, cy - 15, cx + 4, cy - 15, PALETTE.clothDark, 1);
  linePx(ctx, cx + 4, cy - 15, cx + 13, cy - 7, PALETTE.clothDark, 1);
  px(ctx, cx - 1, cy - 10, PALETTE.rustLight, 3, 3);
  px(ctx, cx - 8, cy - 7, PALETTE.stoneDust, 7, 1);
  px(ctx, cx + 6, cy - 3, PALETTE.clothDark, 5, 1);
  px(ctx, cx - 14, cy + 1, PALETTE.outline, 8, 2);
  px(ctx, cx - 13, cy, PALETTE.rustDark, 5, 1);
  px(ctx, cx + 6, cy - 8, PALETTE.outline, 5, 4);
  px(ctx, cx + 7, cy - 8, PALETTE.clothTan, 3, 2);
  px(ctx, cx + 8, cy - 5, PALETTE.hostBone, 2, 1);
  for (let i = 0; i < 4; i += 1) {
    const x = cx - 11 + Math.floor(rng() * 23);
    const y = cy - 8 + Math.floor(rng() * 12);
    px(ctx, x, y, rng() < 0.5 ? PALETTE.rustDark : PALETTE.stoneDark, 1, 1);
  }
}

export function drawBlueBall(ctx, cx, cy, seed) {
  drawShadowBlob(ctx, cx, cy + 3, 22, 8);
  drawIsoDiamond(ctx, cx, cy + 2, 20, 8, PALETTE.outline);
  drawIsoDiamond(ctx, cx, cy + 1, 15, 6, PALETTE.stoneDark);
  px(ctx, cx - 6, cy - 8, PALETTE.outline, 13, 10);
  px(ctx, cx - 5, cy - 10, PALETTE.outline, 11, 13);
  px(ctx, cx - 4, cy - 11, PALETTE.outline, 9, 2);
  px(ctx, cx - 5, cy - 8, PALETTE.clothBlueDark, 11, 10);
  px(ctx, cx - 4, cy - 10, PALETTE.clothBlue, 9, 4);
  px(ctx, cx - 5, cy - 4, PALETTE.clothBlue, 3, 5);
  px(ctx, cx + 3, cy - 4, PALETTE.void, 2, 5);
  px(ctx, cx + 1, cy, PALETTE.void, 4, 1);
  linePx(ctx, cx - 5, cy - 7, cx + 4, cy - 2, PALETTE.outline, 1);
  linePx(ctx, cx - 4, cy - 8, cx + 3, cy - 3, PALETTE.clothBlue, 1);
  px(ctx, cx - 2, cy - 9, PALETTE.hostBone, 3, 1);
  px(ctx, cx - 3, cy - 8, PALETTE.stoneDust, 1, 1);
  px(ctx, cx + 5, cy - 1, PALETTE.rustDark, 2, 1);
  drawNoisePixels(ctx, cx - 8, cy - 10, 16, 13, [PALETTE.stoneDark, PALETTE.rustDark], 0.035, seed);
}

export function drawQuarantineSign(ctx, cx, cy, seed) {
  const rng = rngFrom(hash2D(seed + 131, seed * 5 + 17));
  drawShadowBlob(ctx, cx, cy + 3, 26, 11);
  // Leaning post.
  linePx(ctx, cx + 2, cy, cx - 4, cy - 38, PALETTE.outline, 4);
  linePx(ctx, cx + 1, cy - 1, cx - 5, cy - 38, PALETTE.stoneDark, 2);
  linePx(ctx, cx, cy - 2, cx - 6, cy - 37, PALETTE.woodMid, 1);
  px(ctx, cx - 8, cy - 5, PALETTE.outline, 17, 3);
  px(ctx, cx - 6, cy - 5, PALETTE.woodDark, 12, 1);
  // Cracked board.
  drawIsoPrism(ctx, cx - 4, cy - 42, 30, 8, 18, {
    top: PALETTE.clothTan,
    left: PALETTE.stoneDust,
    right: PALETTE.rustDark,
    outline: PALETTE.outline
  });
  // Faded warning marks + a split down the middle.
  px(ctx, cx - 11, cy - 54, PALETTE.hostRed, 4, 8);
  px(ctx, cx - 2, cy - 56, PALETTE.stoneDark, 2, 15);
  px(ctx, cx + 6, cy - 52, PALETTE.rustMid, 5, 4);
  px(ctx, cx - 15, cy - 50, PALETTE.outline, 5, 2);
  px(ctx, cx - 14, cy - 51, PALETTE.stoneDust, 3, 1);
  px(ctx, cx + 9, cy - 58, PALETTE.void, 4, 3);
  linePx(ctx, cx - 13, cy - 48, cx + 5, cy - 57, PALETTE.outline, 1);
  linePx(ctx, cx - 10, cy - 47, cx + 3, cy - 53, PALETTE.rustDark, 1);
  for (let i = 0; i < 4; i += 1) {
    const sx = cx - 17 + Math.floor(rng() * 31);
    const sy = cy - 57 + Math.floor(rng() * 18);
    px(ctx, sx, sy, rng() < 0.5 ? PALETTE.woodDark : PALETTE.stoneDark, 1, 1);
  }
  drawRubbleCluster(ctx, cx - 11, cy + 4, seed + 134, 2);
}

export function drawCandleCluster(ctx, cx, cy, seed, flicker = 0) {
  drawShadowBlob(ctx, cx, cy + 2, 24, 10);

  // Pooled, run-down wax on the stone the cluster has been burning on.
  ctx.save();
  ctx.globalAlpha = 0.5;
  drawIsoDiamond(ctx, cx, cy + 1, 22, 10, PALETTE.hostBone);
  ctx.globalAlpha = 0.32;
  drawIsoDiamond(ctx, cx + 2, cy + 2, 13, 6, PALETTE.stoneDust);
  ctx.restore();
  px(ctx, cx - 13, cy + 1, PALETTE.outline, 27, 3);
  px(ctx, cx - 11, cy, PALETTE.rustDark, 23, 2);
  px(ctx, cx - 10, cy, PALETTE.rustLight, 10, 1);
  px(ctx, cx + 5, cy + 1, PALETTE.hostGold, 2, 1);

  // Uneven candles drawn back-to-front. Heights and spent wicks are seeded so
  // each cluster is distinct but stable frame to frame.
  const candles = [
    { dx: -10, h: 6 + ((seed >> 1) % 3), lit: (seed & 2) === 0 },
    { dx: -5, h: 10 + (seed % 4), lit: (seed & 1) === 0 },
    { dx: 1, h: 14 + (seed % 5), lit: true },
    { dx: 7, h: 8 + ((seed >> 2) % 4), lit: (seed & 4) === 0 },
    { dx: 11, h: 5 + ((seed >> 3) % 3), lit: false }
  ];
  for (const cnd of candles) {
    const bx = cx + cnd.dx;
    const top = cy - cnd.h;
    // Tallow body: dark outline, bone wax, a lit left edge and a shaded right.
    px(ctx, bx - 2, top, PALETTE.skinDark, 5, cnd.h + 1); // base/outline column
    px(ctx, bx - 1, top, PALETTE.hostBone, 3, cnd.h); // wax body
    px(ctx, bx - 1, top, PALETTE.clothTan, 1, cnd.h); // lit left edge
    px(ctx, bx + 1, top, PALETTE.skinDark, 1, cnd.h); // shaded right edge
    // A frozen drip running down one side.
    if ((seed + cnd.dx) % 2 === 0) {
      px(ctx, bx + 1, top + Math.floor(cnd.h * 0.45), PALETTE.hostBone, 1, 4);
      px(ctx, bx + 1, top + Math.floor(cnd.h * 0.45) + 3, PALETTE.stoneDust, 2, 1);
    }
    if ((seed + cnd.h) % 3 === 0) px(ctx, bx - 2, cy - 1, PALETTE.hostBone, 3, 2);
    // Melted rim + a dark spent wick.
    px(ctx, bx - 2, top, PALETTE.stoneDust, 5, 1);
    px(ctx, bx, top - 2, PALETTE.stoneDark, 1, 2);
    // Flame: a small warm halo plus a two-pixel teardrop that brightens on the
    // flicker tick. Dead candles just show the blackened wick above.
    if (cnd.lit) {
      const fy = top - 4 - (flicker & 1);
      ctx.save();
      ctx.globalAlpha = 0.16 + (flicker ? 0.07 : 0);
      drawIsoDiamond(ctx, bx, top - 2, 16, 9, PALETTE.hostGold);
      ctx.restore();
      px(ctx, bx, fy + 2, PALETTE.ember, 1, 2);
      px(ctx, bx, fy, flicker ? PALETTE.flash : PALETTE.hostGold, 1, 2);
      if (flicker) px(ctx, bx, fy - 1, PALETTE.flash, 1, 1);
    }
  }
  px(ctx, cx - 15, cy + 4, PALETTE.stoneDark, 6, 1);
  px(ctx, cx + 9, cy + 4, PALETTE.stoneDark, 5, 1);
}

export function drawRubblePile(ctx, cx, cy, seed) {
  drawShadowBlob(ctx, cx, cy + 4, 46, 18);
  const rng = rngFrom(hash2D(seed + 51, seed * 8 + 4));
  drawIsoDiamond(ctx, cx, cy + 5, 48, 18, PALETTE.outline);
  drawIsoDiamond(ctx, cx, cy + 4, 40, 14, PALETTE.stoneDark);
  // Stacked chunks for volume.
  for (let i = 0; i < 12; i += 1) {
    const dx = Math.floor((rng() - 0.5) * 26);
    const dy = Math.floor((rng() - 0.5) * 11);
    const w = 9 + Math.floor(rng() * 9);
    drawIsoPrism(ctx, cx + dx, cy + dy, w, w * 0.5, 5 + Math.floor(rng() * 7), {
      top: PALETTE.stoneLight,
      left: PALETTE.stoneMid,
      right: PALETTE.stoneDark,
      outline: PALETTE.outline
    });
  }
  for (const slab of [
    { dx: -15, dy: 1, w: 18, h: 10, z: 6 },
    { dx: 8, dy: -3, w: 21, h: 11, z: 7 },
    { dx: 17, dy: 5, w: 13, h: 7, z: 4 }
  ]) {
    drawIsoPrism(ctx, cx + slab.dx, cy + slab.dy, slab.w, slab.h, slab.z, {
      top: PALETTE.stoneDust,
      left: PALETTE.stoneMid,
      right: PALETTE.stoneDark,
      outline: PALETTE.outline
    });
  }
  px(ctx, cx - 13, cy - 9, PALETTE.outline, 27, 3);
  px(ctx, cx - 11, cy - 10, PALETTE.stoneDust, 23, 1);
  px(ctx, cx - 2, cy - 17, PALETTE.hostBone, 7, 2);
  px(ctx, cx + 12, cy - 7, PALETTE.rustDark, 9, 1);
  linePx(ctx, cx - 18, cy - 3, cx - 6, cy - 9, PALETTE.outline, 1);
  linePx(ctx, cx + 2, cy - 12, cx + 17, cy - 6, PALETTE.outline, 1);
  linePx(ctx, cx + 3, cy - 13, cx + 15, cy - 7, PALETTE.stoneLight, 1);
  for (const [dx, dy] of [[-24, 5], [-19, -1], [23, 3], [16, 9], [-5, 8]]) {
    px(ctx, cx + dx - 1, cy + dy - 1, PALETTE.outline, 5, 3);
    px(ctx, cx + dx, cy + dy - 1, (dx + dy + seed) & 1 ? PALETTE.stoneDust : PALETTE.rustDark, 3, 1);
  }
  drawNoisePixels(ctx, cx - 24, cy - 9, 48, 19, [PALETTE.stoneDust, PALETTE.stoneDark, PALETTE.rustDark], 0.065, seed);
}

export function drawCaveStalagmite(ctx, cx, cy, seed) {
  const rng = rngFrom(hash2D(seed + 401, seed * 5 + 17));
  drawShadowBlob(ctx, cx, cy + 4, 38, 15);
  for (const spike of [
    { dx: -10, w: 13, h: 26 + (seed % 7) },
    { dx: 1, w: 17, h: 38 + ((seed >> 3) % 9) },
    { dx: 13, w: 10, h: 20 + ((seed >> 5) % 8) }
  ]) {
    const bx = cx + spike.dx + Math.floor((rng() - 0.5) * 4);
    const foot = cy + 2 + Math.floor(rng() * 4);
    const half = Math.floor(spike.w / 2);
    poly(ctx, PALETTE.outline, [
      [bx - half - 2, foot],
      [bx + 1, foot - spike.h - 3],
      [bx + half + 2, foot]
    ]);
    poly(ctx, PALETTE.stoneMid, [
      [bx - half, foot],
      [bx, foot - spike.h],
      [bx + half, foot]
    ]);
    poly(ctx, PALETTE.stoneLight, [
      [bx - half + 1, foot - 1],
      [bx - 1, foot - spike.h + 5],
      [bx + 1, foot - 1]
    ]);
    poly(ctx, PALETTE.stoneDark, [
      [bx + 1, foot - spike.h + 4],
      [bx + half, foot - 1],
      [bx + 2, foot - 1]
    ]);
    linePx(ctx, bx - half + 2, foot - 3, bx + half - 1, foot - 1, PALETTE.outline, 1);
    linePx(ctx, bx - half + 3, foot - 4, bx + half - 3, foot - 2, PALETTE.stoneDust, 1);
    linePx(ctx, bx + 2, foot - spike.h + 10, bx + 4, foot - 6, PALETTE.void, 1);
    if ((seed + spike.dx) % 2 === 0) linePx(ctx, bx - 2, foot - spike.h + 8, bx - 5, foot - 4, PALETTE.stoneDust, 1);
  }
  for (const [dx, dy, w] of [[-17, 3, 9], [-2, 6, 13], [17, 3, 8]]) {
    drawIsoDiamond(ctx, cx + dx, cy + dy, w, Math.max(4, Math.floor(w * 0.42)), PALETTE.outline);
    drawIsoDiamond(ctx, cx + dx, cy + dy - 1, Math.max(4, w - 3), Math.max(3, Math.floor(w * 0.32)), PALETTE.stoneDark);
  }
  drawNoisePixels(ctx, cx - 19, cy - 12, 38, 16, [PALETTE.stoneDust, PALETTE.stoneDark], 0.05, seed + 19);
}

export function drawCaveStalactites(ctx, cx, cy, seed) {
  const rng = rngFrom(hash2D(seed + 409, seed * 7 + 23));
  const anchorY = cy - 58;
  px(ctx, cx - 28, anchorY - 5, PALETTE.outline, 56, 7);
  px(ctx, cx - 26, anchorY - 4, PALETTE.stoneDark, 52, 5);
  px(ctx, cx - 24, anchorY - 5, PALETTE.stoneMid, 18, 1);
  px(ctx, cx + 3, anchorY - 4, PALETTE.stoneDust, 19, 1);
  for (const [dx, w] of [[-25, 8], [-11, 15], [10, 12], [22, 7]]) {
    px(ctx, cx + dx, anchorY - 1, PALETTE.outline, w, 2);
    px(ctx, cx + dx + 1, anchorY - 2, PALETTE.stoneDust, Math.max(2, w - 3), 1);
  }
  for (const spike of [
    { dx: -18, w: 11, h: 24 + (seed % 9) },
    { dx: -5, w: 15, h: 36 + ((seed >> 2) % 10) },
    { dx: 11, w: 12, h: 28 + ((seed >> 5) % 11) },
    { dx: 23, w: 7, h: 18 + ((seed >> 7) % 8) }
  ]) {
    const x = cx + spike.dx + Math.floor((rng() - 0.5) * 3);
    const half = Math.floor(spike.w / 2);
    poly(ctx, PALETTE.outline, [
      [x - half - 1, anchorY],
      [x + half + 1, anchorY],
      [x, anchorY + spike.h + 3]
    ]);
    poly(ctx, PALETTE.stoneMid, [
      [x - half, anchorY],
      [x + half, anchorY],
      [x, anchorY + spike.h]
    ]);
    poly(ctx, PALETTE.stoneLight, [
      [x - half + 1, anchorY],
      [x - 1, anchorY + spike.h - 4],
      [x + 1, anchorY + 4]
    ]);
    poly(ctx, PALETTE.stoneDark, [
      [x + 1, anchorY + 2],
      [x + half, anchorY],
      [x, anchorY + spike.h]
    ]);
    linePx(ctx, x - half + 1, anchorY + 2, x - 1, anchorY + spike.h - 5, PALETTE.stoneDust, 1);
    linePx(ctx, x + 2, anchorY + 3, x + 1, anchorY + spike.h - 2, PALETTE.void, 1);
    if ((seed + spike.dx) % 3 === 0) px(ctx, x, anchorY + spike.h + 5, PALETTE.stoneDust, 1, 2);
  }
  for (let i = 0; i < 5; i += 1) {
    const x = cx - 24 + Math.floor(rng() * 49);
    const y = anchorY + 4 + Math.floor(rng() * 19);
    px(ctx, x, y, i % 2 ? PALETTE.stoneDust : PALETTE.stoneDark, 2, 1);
  }
}

export function drawCaveFlowstone(ctx, cx, cy, seed) {
  const rng = rngFrom(hash2D(seed + 419, seed * 11 + 31));
  ctx.save();
  ctx.globalAlpha = 0.88;
  for (let band = 0; band < 6; band += 1) {
    const y = cy - 8 + band * 4 + Math.floor(rng() * 3);
    const left = cx - 25 + Math.floor(rng() * 7);
    const right = cx + 22 - Math.floor(rng() * 7);
    const color = band % 2 === 0 ? PALETTE.stoneDust : PALETTE.stoneLight;
    linePx(ctx, left - 2, y + 2, right - 2, y + 2 + Math.floor(rng() * 3), PALETTE.outline, 1);
    linePx(ctx, left, y, right, y - 2 + Math.floor(rng() * 5), color, 1);
    if (band % 2 === 1) linePx(ctx, left + 5, y + 1, right - 6, y + 2, PALETTE.stoneDark, 1);
  }
  for (const [dx, dy, w] of [[-14, -1, 11], [4, 3, 15], [15, -5, 9]]) {
    drawIsoDiamond(ctx, cx + dx, cy + dy + 1, w + 4, 5, PALETTE.outline);
    drawIsoDiamond(ctx, cx + dx - 1, cy + dy, w, 3, PALETTE.hostBone);
    px(ctx, cx + dx - Math.floor(w / 2), cy + dy - 1, PALETTE.stoneDust, Math.max(3, Math.floor(w * 0.45)), 1);
  }
  for (let i = 0; i < 9; i += 1) {
    const x = cx - 22 + Math.floor(rng() * 45);
    const y = cy - 8 + Math.floor(rng() * 17);
    px(ctx, x, y, rng() < 0.5 ? PALETTE.hostBone : PALETTE.stoneDust, 1 + Math.floor(rng() * 3), 1);
  }
  ctx.restore();
}

export function drawInfectedCaveEntrance(ctx, cx, cy, seed) {
  const rng = rngFrom(hash2D(seed + 131, seed * 5 + 29));
  const top = cy - 154;
  const base = cy + 8;
  const height = base - top;

  drawShadowBlob(ctx, cx, cy + 13, 238, 50);
  drawIsoDiamond(ctx, cx, cy + 14, 214, 58, PALETTE.outline);
  drawIsoDiamond(ctx, cx, cy + 10, 196, 49, PALETTE.stoneDark);

  // A broad cliff face grown out of the forest floor. The scanline bands keep
  // the silhouette hard-pixel and oversized without needing a separate asset.
  for (let row = 0; row <= height; row += 1) {
    const t = row / height;
    const jag = ((hash2D(seed + row * 3, seed + row * 11) >>> 0) % 9) - 4;
    const shelf = row % 31 === 4 ? -5 : row % 23 === 0 ? 4 : 0;
    const half = Math.max(22, Math.round(23 + Math.sin(t * Math.PI * 0.92) * 72 + t * 47 + jag + shelf));
    const y = top + row;
    const leftW = Math.max(10, Math.floor(half * 0.34));
    const midW = Math.max(15, Math.floor(half * 0.43));
    const rightW = Math.max(1, half * 2 - leftW - midW);
    const lit = row < 31 ? PALETTE.stoneLight : row < 79 ? PALETTE.stoneDust : PALETTE.stoneMid;
    const mid = row < 46 ? PALETTE.stoneDust : row < 118 ? PALETTE.stoneMid : PALETTE.stoneDark;

    px(ctx, cx - half - 4, y, PALETTE.outline, half * 2 + 8, 1);
    px(ctx, cx - half, y, lit, leftW, 1);
    px(ctx, cx - half + leftW, y, mid, midW, 1);
    px(ctx, cx - half + leftW + midW, y, PALETTE.stoneDark, rightW, 1);

    if (row % 29 === 8) {
      px(ctx, cx - half + 10, y, PALETTE.outline, Math.max(14, Math.floor(half * 0.62)), 1);
      px(ctx, cx - half + 14, y + 1, PALETTE.stoneDark, Math.max(10, Math.floor(half * 0.44)), 1);
    }
  }

  for (const slab of [
    {
      a: [[-126, -11], [-102, -67], [-53, -50], [-44, 2], [-92, 21], [-129, 7]],
      b: [[-115, -9], [-98, -52], [-58, -39], [-51, -1], [-92, 13], [-117, 3]],
      c: [[-115, -9], [-98, -52], [-74, -45], [-96, -20]],
      d: [[-74, -45], [-58, -39], [-51, -1], [-92, 13], [-96, -20]]
    },
    {
      a: [[126, -9], [101, -73], [54, -52], [43, 4], [94, 22], [130, 6]],
      b: [[116, -7], [99, -55], [61, -40], [52, 0], [94, 14], [118, 2]],
      c: [[99, -55], [82, -49], [61, -40], [89, -21]],
      d: [[89, -21], [61, -40], [52, 0], [94, 14], [118, 2]]
    }
  ]) {
    poly(ctx, PALETTE.outline, slab.a.map(([x, y]) => [cx + x, cy + y]));
    poly(ctx, PALETTE.stoneMid, slab.b.map(([x, y]) => [cx + x, cy + y]));
    poly(ctx, PALETTE.stoneDust, slab.c.map(([x, y]) => [cx + x, cy + y]));
    poly(ctx, PALETTE.stoneDark, slab.d.map(([x, y]) => [cx + x, cy + y]));
  }

  drawNoisePixels(ctx, cx - 112, top + 9, 224, 151, [PALETTE.stoneDark, PALETTE.stoneDust, PALETTE.woodDark], 0.028, seed);

  // The mouth is the visual priority: a tall black arch with a heavy rock lip.
  const mouthTop = cy - 116;
  const mouthHeight = 126;
  for (let row = 0; row <= mouthHeight; row += 1) {
    const t = row / mouthHeight;
    const arch = Math.sin(t * Math.PI);
    const half = Math.round(13 + arch * 58 + t * 38 + (row > 96 ? (row - 96) * 0.45 : 0));
    const y = mouthTop + row;
    const rim = row < 13 ? 6 : row < 34 ? 8 : 11;
    const inner = Math.max(4, half - rim);
    const innerColor = row < 12 ? PALETTE.hostBlack : row < 37 ? PALETTE.void : PALETTE.outline;

    px(ctx, cx - half - 7, y, PALETTE.outline, half * 2 + 14, 1);
    px(ctx, cx - half - 3, y, row < 32 ? PALETTE.stoneDark : PALETTE.outline, half * 2 + 6, 1);
    px(ctx, cx - inner, y, innerColor, inner * 2, 1);
    if (row > 45 && row < 109 && row % 13 === 5) {
      px(ctx, cx - inner + 9, y, PALETTE.hostBlack, Math.max(18, Math.floor(inner * 0.86)), 1);
    }
  }

  for (const crack of [
    [[-58, -132], [-67, -105], [-61, -82], [-76, -57]],
    [[-27, -144], [-36, -116], [-32, -93], [-44, -70]],
    [[32, -138], [24, -111], [35, -91], [29, -65]],
    [[74, -119], [62, -96], [70, -73], [60, -48]]
  ]) {
    for (let i = 0; i < crack.length - 1; i += 1) {
      const a = crack[i];
      const b = crack[i + 1];
      linePx(ctx, cx + a[0], cy + a[1], cx + b[0], cy + b[1], PALETTE.outline, 2);
      linePx(ctx, cx + a[0], cy + a[1], cx + b[0], cy + b[1], PALETTE.stoneDark, 1);
    }
  }
  for (const vein of [
    [[-71, -111], [-53, -91], [-57, -63]],
    [[-36, -121], [-18, -97], [-21, -71]],
    [[42, -115], [29, -91], [38, -62]],
    [[79, -96], [61, -74], [66, -42]]
  ]) {
    for (let i = 0; i < vein.length - 1; i += 1) {
      const a = vein[i];
      const b = vein[i + 1];
      linePx(ctx, cx + a[0], cy + a[1], cx + b[0], cy + b[1], PALETTE.hostBlack, 2);
      linePx(ctx, cx + a[0], cy + a[1] - 1, cx + b[0], cy + b[1] - 1, PALETTE.hostGold, 1);
    }
  }

  for (const root of [
    [[-117, -72], [-99, -52], [-106, -27]],
    [[-91, -94], [-82, -69], [-86, -42]],
    [[93, -91], [81, -65], [88, -34]],
    [[118, -65], [103, -44], [111, -17]]
  ]) {
    for (let i = 0; i < root.length - 1; i += 1) {
      const a = root[i];
      const b = root[i + 1];
      linePx(ctx, cx + a[0], cy + a[1], cx + b[0], cy + b[1], PALETTE.outline, 3);
      linePx(ctx, cx + a[0], cy + a[1], cx + b[0], cy + b[1], PALETTE.woodDark, 1);
    }
  }

  for (const dx of [-47, -31, -14, 18, 39, 57]) {
    linePx(ctx, cx + dx, cy - 45, cx + dx - 6, cy - 10, PALETTE.hostBlack, 1);
  }
  for (const [dx, h] of [[-39, 14], [-23, 9], [-7, 17], [14, 12], [31, 19], [49, 10]]) {
    px(ctx, cx + dx - 3, cy - 26, PALETTE.outline, 7, h + 3);
    px(ctx, cx + dx - 2, cy - 25, PALETTE.hostBone, 5, h);
    px(ctx, cx + dx + 2, cy - 23, PALETTE.stoneDark, 2, Math.max(4, h - 3));
  }
  px(ctx, cx - 43, cy - 6, PALETTE.hostRed, 12, 2);
  px(ctx, cx + 24, cy - 9, PALETTE.hostRed, 9, 2);
  px(ctx, cx - 5, cy - 18, PALETTE.hostGold, 3, 1);
  if (seed & 1) px(ctx, cx + 13, cy - 23, PALETTE.hostGold, 2, 2);
  drawHostGrowth(ctx, cx - 83, cy - 14, seed + 271, 0);
  drawHostGrowth(ctx, cx + 88, cy - 12, seed + 277, 0);

  for (let i = 0; i < 24; i += 1) {
    const chipX = cx - 104 + Math.floor(rng() * 208);
    const chipY = cy - 7 + Math.floor(rng() * 21);
    px(ctx, chipX, chipY, rng() < 0.58 ? PALETTE.stoneDust : PALETTE.stoneDark, 2 + Math.floor(rng() * 3), 1);
  }
  drawRubbleCluster(ctx, cx - 72, cy + 16, seed + 281, 4);
  drawRubbleCluster(ctx, cx + 75, cy + 17, seed + 283, 4);
}

export function drawRustedCrate(ctx, cx, cy, seed) {
  const rng = rngFrom(hash2D(seed + 31, seed * 7 + 5));
  drawShadowBlob(ctx, cx, cy + 7, 58, 17);

  const top = [
    [cx - 31, cy - 13],
    [cx - 6, cy - 25],
    [cx + 31, cy - 12],
    [cx + 5, cy + 3]
  ];
  const front = [
    [cx - 31, cy - 13],
    [cx + 5, cy + 3],
    [cx + 4, cy + 12],
    [cx - 31, cy - 2]
  ];
  const right = [
    [cx + 5, cy + 3],
    [cx + 31, cy - 12],
    [cx + 30, cy - 2],
    [cx + 4, cy + 12]
  ];
  poly(ctx, PALETTE.outline, [
    [cx - 33, cy - 13],
    [cx - 6, cy - 27],
    [cx + 33, cy - 13],
    [cx + 32, cy - 1],
    [cx + 5, cy + 14],
    [cx - 33, cy - 1]
  ]);
  poly(ctx, PALETTE.woodMid, front);
  poly(ctx, PALETTE.woodDark, right);
  poly(ctx, PALETTE.woodLight, top);

  for (const [x0, y0, x1, y1] of [
    [-25, -13, -1, -24],
    [-16, -8, 10, -21],
    [-7, -4, 20, -17],
    [3, 0, 28, -11]
  ]) {
    linePx(ctx, cx + x0, cy + y0, cx + x1, cy + y1, PALETTE.woodDark, 1);
  }
  linePx(ctx, cx - 30, cy - 12, cx + 4, cy + 3, PALETTE.woodMid, 1);
  linePx(ctx, cx - 27, cy - 6, cx + 4, cy + 8, PALETTE.woodDark, 1);
  linePx(ctx, cx + 8, cy + 3, cx + 29, cy - 8, PALETTE.outline, 1);
  linePx(ctx, cx + 12, cy + 7, cx + 29, cy - 2, PALETTE.rustDark, 1);

  for (const [x0, y0, x1, y1] of [
    [-23, -8, -7, -16],
    [12, -3, 27, -10]
  ]) {
    linePx(ctx, cx + x0, cy + y0, cx + x1, cy + y1, PALETTE.rustDark, 3);
    linePx(ctx, cx + x0 + 1, cy + y0 - 1, cx + x1 + 1, cy + y1 - 1, PALETTE.rustLight, 1);
  }
  linePx(ctx, cx - 24, cy - 16, cx + 17, cy + 2, PALETTE.outline, 1);
  linePx(ctx, cx - 22, cy - 17, cx + 15, cy + 1, PALETTE.woodDark, 1);
  linePx(ctx, cx - 2, cy - 25, cx + 29, cy - 12, PALETTE.outline, 1);
  linePx(ctx, cx, cy - 26, cx + 27, cy - 13, PALETTE.woodLight, 1);

  poly(ctx, PALETTE.outline, [
    [cx - 18, cy - 3],
    [cx - 11, cy - 1],
    [cx - 13, cy + 3],
    [cx - 20, cy + 1]
  ]);
  px(ctx, cx - 16, cy - 2, PALETTE.void, 4, 2);
  px(ctx, cx - 29, cy - 14, PALETTE.woodLight, 12, 2);
  px(ctx, cx - 15, cy - 17, PALETTE.clothTan, 8, 4);
  px(ctx, cx - 14, cy - 17, PALETTE.stoneDust, 5, 1);
  for (const [dx, dy, tone] of [
    [-28, -10, PALETTE.rustLight],
    [-19, 2, PALETTE.woodLight],
    [5, 5, PALETTE.rustDark],
    [25, -7, PALETTE.hostBone]
  ]) {
    px(ctx, cx + dx, cy + dy, PALETTE.outline, 5, 3);
    px(ctx, cx + dx + 1, cy + dy - 1, tone, 2, 1);
  }

  for (let i = 0; i < 16; i += 1) {
    const x = cx - 28 + Math.floor(rng() * 56);
    const y = cy - 19 + Math.floor(rng() * 27);
    px(ctx, x, y, rng() < 0.55 ? PALETTE.rustDark : PALETTE.stoneDark, 1 + Math.floor(rng() * 2), 1);
  }
  for (const dx of [-24, -9, 7, 21]) px(ctx, cx + dx, cy - 8, PALETTE.rustLight, 1, 1);
  drawRubbleCluster(ctx, cx + 26, cy + 13, seed + 37, 2);
  drawNoisePixels(ctx, cx - 31, cy - 23, 62, 34, [PALETTE.rustDark, PALETTE.stoneDark], 0.03, seed);
}

export function drawPaperScraps(ctx, cx, cy, seed) {
  const rng = rngFrom(hash2D(seed + 431, seed * 13 + 37));
  ctx.save();
  ctx.globalAlpha = 0.9;
  const scraps = [
    [-11, -3, 20, 9, PALETTE.clothTan],
    [7, 2, 18, 8, PALETTE.stoneDust],
    [-1, 5, 14, 6, PALETTE.hostBone],
    [13, -5, 11, 5, PALETTE.clothTan]
  ];
  for (const [dx, dy, w, h, fill] of scraps) {
    const ox = dx + Math.floor((rng() - 0.5) * 3);
    const oy = dy + Math.floor((rng() - 0.5) * 2);
    drawIsoDiamond(ctx, cx + ox, cy + oy + 1, w + 4, h + 2, PALETTE.outline);
    drawIsoDiamond(ctx, cx + ox, cy + oy, w, h, fill);
    px(ctx, cx + ox - Math.floor(w * 0.28), cy + oy - 2, PALETTE.hostBone, Math.max(2, Math.floor(w * 0.32)), 1);
    px(ctx, cx + ox + Math.floor(w * 0.12), cy + oy + 2, PALETTE.stoneDark, Math.max(2, Math.floor(w * 0.32)), 1);
  }
  ctx.restore();
  px(ctx, cx - 11, cy - 3, PALETTE.rustDark, 11, 1);
  px(ctx, cx - 8, cy, PALETTE.rustDark, 8, 1);
  px(ctx, cx + 3, cy + 1, PALETTE.stoneDark, 9, 1);
  px(ctx, cx + 9, cy - 4, PALETTE.clothRed, 4, 2);
  px(ctx, cx + 10, cy - 5, PALETTE.rustLight, 2, 1);
  for (let i = 0; i < 5; i += 1) {
    const x = cx - 18 + Math.floor(rng() * 37);
    const y = cy - 7 + Math.floor(rng() * 15);
    linePx(ctx, x, y, x + 4 + Math.floor(rng() * 5), y + Math.floor(rng() * 3) - 1, PALETTE.stoneDark, 1);
  }
  drawNoisePixels(ctx, cx - 19, cy - 8, 38, 17, [PALETTE.stoneDust, PALETTE.rustDark], 0.055, seed);
}

export function drawChaffScatter(ctx, cx, cy, seed) {
  const rng = rngFrom(hash2D(seed + 59, seed * 7 + 13));
  ctx.save();
  ctx.globalAlpha = 0.88;
  for (const [dx, dy, w] of [[-17, -3, 17], [3, 2, 23], [14, -5, 12]]) {
    linePx(ctx, cx + dx, cy + dy + 1, cx + dx + w, cy + dy + Math.floor(w * 0.08), PALETTE.woodDark, 1);
    linePx(ctx, cx + dx + 1, cy + dy, cx + dx + w - 2, cy + dy - 1, PALETTE.clothTan, 1);
  }
  for (let i = 0; i < 26; i += 1) {
    const x = cx - 23 + Math.floor(rng() * 47);
    const y = cy - 8 + Math.floor(rng() * 17);
    const len = 2 + Math.floor(rng() * 5);
    const col = rng() < 0.42 ? PALETTE.clothTan : rng() < 0.7 ? PALETTE.woodLight : PALETTE.hostGold;
    if (rng() < 0.55) {
      linePx(ctx, x, y, x + len, y + Math.floor(rng() * 3) - 1, col, 1);
    } else {
      px(ctx, x, y, col, len, 1);
    }
  }
  for (let i = 0; i < 4; i += 1) {
    const x = cx - 19 + Math.floor(rng() * 39);
    const y = cy - 7 + Math.floor(rng() * 14);
    px(ctx, x, y, PALETTE.outline, 5, 2);
    px(ctx, x + 1, y, PALETTE.hostGold, 3, 1);
  }
  drawNoisePixels(ctx, cx - 24, cy - 8, 48, 16, [PALETTE.stoneDust, PALETTE.woodDark], 0.03, seed + 31);
  ctx.restore();
}

export function drawCrackedColumn(ctx, cx, cy, seed) {
  const rng = rngFrom(hash2D(seed + 179, seed * 7 + 13));
  drawShadowBlob(ctx, cx, cy + 6, 45, 17);
  drawIsoPrism(ctx, cx, cy + 1, 42, 24, 11, {
    top: PALETTE.stoneLight,
    left: PALETTE.stoneMid,
    right: PALETTE.stoneDark,
    outline: PALETTE.outline
  });

  // Square shaft assembled from pixel bands to avoid a smooth cylinder.
  const shaftX = cx - 10;
  const shaftTop = cy - 66;
  px(ctx, shaftX - 1, shaftTop - 1, PALETTE.outline, 22, 62);
  px(ctx, shaftX, shaftTop, PALETTE.stoneDark, 20, 59);
  px(ctx, shaftX + 1, shaftTop, PALETTE.stoneMid, 16, 59);
  px(ctx, shaftX + 1, shaftTop, PALETTE.stoneDust, 4, 55);
  px(ctx, shaftX + 15, shaftTop + 3, PALETTE.stoneDark, 3, 53);
  for (const y of [shaftTop + 12, shaftTop + 29, shaftTop + 46]) {
    px(ctx, shaftX - 2, y, PALETTE.outline, 24, 3);
    px(ctx, shaftX, y - 1, PALETTE.stoneDust, 10, 1);
    px(ctx, shaftX + 12, y, PALETTE.stoneDark, 8, 1);
  }
  for (const y of [shaftTop + 7, shaftTop + 21, shaftTop + 39, shaftTop + 55]) {
    px(ctx, shaftX - 3, y, PALETTE.outline, 5, 4);
    px(ctx, shaftX - 2, y, PALETTE.stoneLight, 3, 1);
    px(ctx, shaftX + 17, y + 2, PALETTE.outline, 5, 3);
    px(ctx, shaftX + 18, y + 2, PALETTE.stoneDark, 3, 1);
  }
  drawNoisePixels(ctx, shaftX + 1, shaftTop + 2, 19, 58, [PALETTE.stoneDark, PALETTE.stoneDust], 0.045, seed);
  drawCracks(ctx, cx - 2, cy - 38, seed, 5);
  linePx(ctx, cx + 6, cy - 61, cx - 5, cy - 24, PALETTE.outline, 2);
  linePx(ctx, cx + 6, cy - 61, cx - 5, cy - 24, PALETTE.stoneDark, 1);
  linePx(ctx, cx - 6, cy - 58, cx + 2, cy - 45, PALETTE.outline, 1);
  linePx(ctx, cx - 5, cy - 57, cx + 1, cy - 46, PALETTE.stoneLight, 1);
  linePx(ctx, cx + 8, cy - 33, cx + 2, cy - 17, PALETTE.outline, 2);
  linePx(ctx, cx + 8, cy - 34, cx + 3, cy - 19, PALETTE.stoneDark, 1);

  drawIsoPrism(ctx, cx, cy - 66, 34, 17, 9, {
    top: PALETTE.stoneDust,
    left: PALETTE.stoneMid,
    right: PALETTE.stoneDark,
    outline: PALETTE.outline
  });
  if ((seed & 1) === 0) {
    px(ctx, cx + 8, cy - 60, PALETTE.void, 8, 6);
    px(ctx, cx + 7, cy - 59, PALETTE.stoneDark, 6, 4);
  }
  px(ctx, cx - 17, cy - 68, PALETTE.outline, 6, 4);
  px(ctx, cx - 16, cy - 68, PALETTE.stoneDark, 4, 2);
  px(ctx, cx + 10, cy - 72, PALETTE.outline, 5, 3);
  px(ctx, cx + 11, cy - 72, PALETTE.hostBone, 2, 1);
  for (let i = 0; i < 7; i += 1) {
    const x = cx - 15 + Math.floor(rng() * 31);
    px(ctx, x, cy + 1 + Math.floor(rng() * 7), PALETTE.hostBone, 3, 1);
  }
  drawRubbleCluster(ctx, cx - 18, cy + 8, seed + 91, 3);
}

export function drawSaintStatue(ctx, cx, cy, seed, opts = {}) {
  const dim = Boolean(opts.dim);
  const stone = PALETTE.stoneMid;
  const hi = dim ? PALETTE.stoneMid : PALETTE.stoneLight;
  const lo = PALETTE.stoneDark;
  const dust = PALETTE.stoneDust;
  const wet = PALETTE.hostRed;
  const rng = rngFrom(hash2D(seed + 11, seed * 3 + 5));

  drawShadowBlob(ctx, cx, cy + 4, 36, 16);
  // Plinth.
  drawIsoPrism(ctx, cx, cy, 38, 19, 13, { top: dust, left: stone, right: lo, outline: PALETTE.outline });
  drawIsoPrism(ctx, cx, cy - 12, 30, 15, 5, { top: hi, left: stone, right: lo, outline: PALETTE.outline });
  const plinthTop = cy - 12;
  const shoulderY = plinthTop - 34; // top of the shoulders (the head is struck off above)
  px(ctx, cx - 19, cy - 5, PALETTE.outline, 6, 4);
  px(ctx, cx - 18, cy - 6, PALETTE.stoneDust, 4, 1);
  px(ctx, cx + 12, cy - 17, PALETTE.outline, 8, 4);
  px(ctx, cx + 13, cy - 17, lo, 5, 2);
  linePx(ctx, cx - 14, cy - 12, cx + 12, cy - 18, PALETTE.stoneDark, 1);
  linePx(ctx, cx - 12, cy - 14, cx + 9, cy - 19, dust, 1);

  // Robe: a figure tapering from broad shoulders to a wide hem, lit upper-left.
  for (let yy = 0; yy < plinthTop - shoulderY; yy += 1) {
    const t = yy / (plinthTop - shoulderY);
    const w = Math.round(15 + t * 5); // 15 at the shoulders -> 20 at the hem
    const ox = cx - Math.floor(w / 2);
    px(ctx, ox, shoulderY + yy, stone, w, 1);
    px(ctx, ox, shoulderY + yy, hi, 1, 1); // lit left edge
    px(ctx, ox + w - 1, shoulderY + yy, lo, 1, 1); // shaded right edge
  }
  // Robe folds, draped from the shoulders.
  px(ctx, cx - 4, shoulderY + 8, lo, 1, plinthTop - shoulderY - 9);
  px(ctx, cx + 3, shoulderY + 6, lo, 1, plinthTop - shoulderY - 7);
  px(ctx, cx - 1, shoulderY + 14, lo, 1, plinthTop - shoulderY - 16);
  // An empty hood/cowl where the head was: a dark hollow, broken at the rim.
  px(ctx, cx - 4, shoulderY - 6, stone, 9, 7); // cowl shell
  px(ctx, cx - 4, shoulderY - 6, hi, 1, 7);
  px(ctx, cx + 4, shoulderY - 6, lo, 1, 7);
  px(ctx, cx - 2, shoulderY - 5, PALETTE.void, 5, 6); // hollow interior (no head)
  px(ctx, cx - 3, shoulderY - 7, lo, 3, 2); // jagged struck rim
  px(ctx, cx + 1, shoulderY - 7, dust, 3, 1);
  for (let i = 0; i < 3; i += 1) px(ctx, cx - 8 + i * 7, shoulderY - 8 + Math.floor(rng() * 3), dust, 1, 1); // chips
  for (let i = 0; i < 17; i += 1) {
    if (i > 9 && i < 13) continue;
    const a = Math.PI * (0.08 + i * 0.052);
    const x = cx + Math.round(Math.cos(a) * 13);
    const y = shoulderY - 2 - Math.round(Math.sin(a) * 9);
    px(ctx, x, y, i % 3 === 0 ? PALETTE.hostBone : dust, i % 4 === 0 ? 2 : 1, 1);
  }
  px(ctx, cx + 12, shoulderY - 5, PALETTE.outline, 4, 2);
  px(ctx, cx + 13, shoulderY - 4, dust, 3, 1);
  px(ctx, cx - 14, shoulderY + 5, PALETTE.outline, 5, 2);
  px(ctx, cx - 13, shoulderY + 4, PALETTE.hostBone, 3, 1);
  // Hands fused in prayer at the breast: a lit vertical bump with a centre seam.
  px(ctx, cx - 2, shoulderY + 6, dust, 4, 7);
  px(ctx, cx - 2, shoulderY + 6, hi, 1, 7);
  px(ctx, cx, shoulderY + 6, lo, 1, 7); // seam between the palms
  // Defacement: a point-down wound-star daubed on the breast in red.
  px(ctx, cx - 3, shoulderY + 15, wet, 7, 1);
  px(ctx, cx - 2, shoulderY + 16, wet, 5, 1);
  px(ctx, cx - 1, shoulderY + 17, wet, 3, 1);
  px(ctx, cx, shoulderY + 18, wet, 1, 1);
  px(ctx, cx - 3, shoulderY + 15, wet, 1, 4);
  px(ctx, cx + 3, shoulderY + 15, wet, 1, 4);
  // Asymmetry: a crack down the robe and a chipped plinth corner.
  px(ctx, cx + 5, plinthTop - 12, lo, 1, 11);
  px(ctx, cx + 14, cy - 4, PALETTE.void, 4, 3);
  linePx(ctx, cx - 8, shoulderY + 3, cx - 15, shoulderY + 19, PALETTE.outline, 3);
  linePx(ctx, cx - 7, shoulderY + 4, cx - 14, shoulderY + 18, stone, 1);
  linePx(ctx, cx + 8, shoulderY + 5, cx + 14, shoulderY + 21, PALETTE.outline, 2);
  linePx(ctx, cx + 8, shoulderY + 5, cx + 14, shoulderY + 21, lo, 1);
  linePx(ctx, cx - 5, shoulderY + 24, cx + 6, plinthTop - 2, PALETTE.outline, 1);
  linePx(ctx, cx - 4, shoulderY + 24, cx + 5, plinthTop - 3, dust, 1);
  for (const [dx, dy] of [[-13, 1], [13, 2], [-6, 6], [10, 7]]) {
    px(ctx, cx + dx - 1, cy + dy - 1, PALETTE.outline, 4, 3);
    px(ctx, cx + dx, cy + dy - 1, rng() < 0.5 ? PALETTE.hostBone : lo, 2, 1);
  }
  drawNoisePixels(ctx, cx - 10, shoulderY, 20, plinthTop - shoulderY, [lo, stone], 0.04, seed);
}

export function drawChapelFont(ctx, cx, cy, seed, opts = {}) {
  const dim = Boolean(opts.dim);
  const rng = rngFrom(hash2D(seed + 97, seed * 13 + 23));
  const stone = PALETTE.stoneMid;
  const hi = dim ? PALETTE.stoneMid : PALETTE.stoneLight;
  const lo = PALETTE.stoneDark;
  const dust = PALETTE.stoneDust;

  drawShadowBlob(ctx, cx, cy + 3, 28, 13);
  // Pedestal.
  drawIsoPrism(ctx, cx, cy, 14, 8, 15, { top: stone, left: lo, right: PALETTE.void, outline: PALETTE.outline });
  const by = cy - 15; // basin rim height
  // Basin.
  drawIsoDiamond(ctx, cx, by + 1, 28, 14, PALETTE.outline);
  drawIsoDiamond(ctx, cx, by, 27, 13, lo);
  drawIsoDiamond(ctx, cx, by - 1, 27, 13, stone);
  drawIsoDiamond(ctx, cx - 1, by - 2, 24, 11, hi); // lit upper-left rim
  drawIsoDiamond(ctx, cx, by - 1, 18, 9, lo); // inner basin
  drawIsoDiamond(ctx, cx, by - 1, 13, 6, PALETTE.rustDark); // dried blood, not holy water
  drawIsoDiamond(ctx, cx, by - 1, 7, 3, PALETTE.hostRed);
  // Chipped rim and a crack down the pedestal.
  px(ctx, cx + 11, by, PALETTE.void, 3, 2);
  px(ctx, cx - 13, by - 2, PALETTE.outline, 6, 2);
  px(ctx, cx - 12, by - 3, dust, 3, 1);
  px(ctx, cx + 7, by - 5, PALETTE.outline, 5, 2);
  px(ctx, cx + 8, by - 6, hi, 2, 1);
  px(ctx, cx - 2, cy - 13, lo, 1, 11);
  px(ctx, cx - 8, cy - 3, PALETTE.outline, 17, 4);
  px(ctx, cx - 6, cy - 4, stone, 13, 2);
  linePx(ctx, cx + 2, by + 2, cx + 8, cy - 5, PALETTE.outline, 1);
  linePx(ctx, cx + 3, by + 1, cx + 9, cy - 5, PALETTE.hostRed, 1);
  for (let i = 0; i < 4; i += 1) {
    px(ctx, cx - 11 + Math.floor(rng() * 22), by - 4 + Math.floor(rng() * 9), rng() < 0.5 ? lo : dust, 1, 1);
  }
  drawRubbleCluster(ctx, cx + 15, cy + 6, seed + 103, 2);
  drawNoisePixels(ctx, cx - 13, by - 5, 27, 16, [lo, dust], 0.04, seed);
}

export function drawQuarantineBarricade(ctx, cx, cy, seed) {
  drawShadowBlob(ctx, cx, cy + 6, 66, 22);
  const rng = rngFrom(hash2D(seed + 67, seed * 5 + 11));
  for (let i = 0; i < 4; i += 1) {
    const dy = i * 5;
    drawIsoPrism(ctx, cx + (i === 3 ? -4 : 0), cy - 11 + dy, i === 3 ? 42 : 58, 9, 7, {
      top: i === 1 ? PALETTE.rustMid : PALETTE.woodLight,
      left: PALETTE.woodMid,
      right: PALETTE.woodDark,
      outline: PALETTE.outline
    });
    px(ctx, cx - 27 + i * 3, cy - 12 + dy, PALETTE.outline, 8, 1);
    px(ctx, cx + 16 - i * 2, cy - 7 + dy, PALETTE.woodDark, 9, 1);
    if (i === 2) px(ctx, cx - 7, cy - 10 + dy, PALETTE.void, 7, 2);
  }
  for (const [dx, h] of [[-28, 31], [-12, 25], [18, 32], [30, 24]]) {
    px(ctx, cx + dx - 2, cy - h, PALETTE.outline, 6, h + 2);
    px(ctx, cx + dx - 1, cy - h + 1, PALETTE.stoneDark, 3, h);
    px(ctx, cx + dx - 1, cy - h + 1, PALETTE.woodMid, 1, Math.max(5, h - 4));
    px(ctx, cx + dx - 3, cy - h - 2, PALETTE.outline, 8, 3);
    px(ctx, cx + dx - 2, cy - h - 3, PALETTE.woodLight, 5, 1);
  }
  for (let i = 0; i < 7; i += 1) {
    const sx = cx - 27 + i * 9;
    const mark = rng() < 0.5 ? PALETTE.clothTan : PALETTE.hostRed;
    px(ctx, sx, cy - 23 + (i & 1), PALETTE.outline, 6, 3);
    px(ctx, sx + 1, cy - 23 + (i & 1), mark, 4, 1);
  }
  linePx(ctx, cx - 27, cy - 28, cx + 26, cy - 4, PALETTE.outline, 3);
  linePx(ctx, cx - 26, cy - 29, cx + 25, cy - 5, PALETTE.rustDark, 1);
  linePx(ctx, cx - 23, cy - 10, cx + 19, cy - 30, PALETTE.outline, 2);
  linePx(ctx, cx - 21, cy - 11, cx + 18, cy - 29, PALETTE.woodDark, 1);
  for (let i = 0; i < 5; i += 1) {
    const sx = cx - 31 + Math.floor(rng() * 65);
    const sy = cy + 3 + Math.floor(rng() * 8);
    px(ctx, sx, sy, PALETTE.outline, 2, 1);
    px(ctx, sx, sy - 1, rng() < 0.5 ? PALETTE.woodDark : PALETTE.stoneDust, 1, 1);
  }
  drawRubbleCluster(ctx, cx + 24, cy + 10, seed + 177, 2);
}

export function drawCampfire(ctx, cx, cy, seed, flicker = 0) {
  drawWarmLightPool(ctx, cx, cy, seed, flicker);
  drawShadowBlob(ctx, cx, cy + 4, 42, 16);
  const rng = rngFrom(hash2D(seed + 73, seed * 3 + 19));
  for (let i = 0; i < 8; i += 1) {
    const a = (Math.PI * 2 * i) / 8;
    const sx = cx + Math.round(Math.cos(a) * 21);
    const sy = cy + 3 + Math.round(Math.sin(a) * 8);
    px(ctx, sx - 3, sy - 1, PALETTE.outline, 7, 4);
    px(ctx, sx - 2, sy - 2, i % 2 ? PALETTE.stoneDust : PALETTE.stoneLight, 4, 2);
    px(ctx, sx - 1, sy + 1, PALETTE.stoneDark, 4, 1);
  }
  const logs = [
    [-18, 4, 18, -3, PALETTE.woodMid],
    [16, 5, -13, -4, PALETTE.woodDark],
    [-8, 8, 20, 2, PALETTE.woodMid],
    [7, 8, -21, 1, PALETTE.woodDark]
  ];
  for (const [x0, y0, x1, y1, tone] of logs) {
    linePx(ctx, cx + x0, cy + y0, cx + x1, cy + y1, PALETTE.outline, 4);
    linePx(ctx, cx + x0, cy + y0 - 1, cx + x1, cy + y1 - 1, tone, 2);
    linePx(ctx, cx + x0, cy + y0 - 2, cx + x1, cy + y1 - 2, PALETTE.woodLight, 1);
  }
  px(ctx, cx - 12, cy - 2, PALETTE.outline, 25, 9);
  px(ctx, cx - 10, cy - 2, PALETTE.rustDark, 21, 6);
  px(ctx, cx - 7, cy, PALETTE.hostRed, 15, 4);

  const flame = flicker ? PALETTE.flash : PALETTE.ember;
  px(ctx, cx - 7, cy - 12, PALETTE.outline, 15, 16);
  px(ctx, cx - 5, cy - 11, PALETTE.rustDark, 11, 14);
  px(ctx, cx - 3, cy - 15, flame, 7, 15);
  px(ctx, cx, cy - 19, PALETTE.hostGold, 3, 10);
  px(ctx, cx - 5, cy - 8, PALETTE.hostRed, 3, 8);
  if (flicker) {
    px(ctx, cx + 3, cy - 20, PALETTE.flash, 2, 4);
    px(ctx, cx - 1, cy - 17, PALETTE.flash, 1, 3);
  }
  for (let i = 0; i < 5; i += 1) {
    const sx = cx - 18 + Math.floor(rng() * 37);
    const sy = cy - 6 + Math.floor(rng() * 12);
    px(ctx, sx, sy, i % 2 ? PALETTE.hostGold : PALETTE.ember, 1 + (i === 0 ? 1 : 0), 1);
  }
  drawNoisePixels(ctx, cx - 22, cy - 8, 44, 16, [PALETTE.stoneDark, PALETTE.rustDark], 0.08, seed);
}

export function drawChapelBanner(ctx, cx, cy, seed) {
  const rng = rngFrom(hash2D(seed + 149, seed * 5 + 31));
  drawShadowBlob(ctx, cx, cy + 5, 28, 12);
  px(ctx, cx - 2, cy - 62, PALETTE.stoneDark, 4, 62);
  px(ctx, cx - 1, cy - 62, PALETTE.stoneDust, 1, 58);
  px(ctx, cx - 7, cy - 65, PALETTE.outline, 31, 5);
  px(ctx, cx - 5, cy - 64, PALETTE.woodDark, 27, 2);
  for (const dx of [-4, 8, 20]) {
    px(ctx, cx + dx, cy - 65, PALETTE.outline, 3, 7);
    px(ctx, cx + dx + 1, cy - 64, PALETTE.rustLight, 1, 4);
  }
  const phase = seed & 1;
  px(ctx, cx + 2, cy - 58, PALETTE.clothDark, 21, 43);
  px(ctx, cx + 3, cy - 58, PALETTE.clothRed, 17, 36);
  drawDitherRect(ctx, cx + 5, cy - 52, 12, 26, PALETTE.hostRed, null, phase);
  // An inverted cross stitched in bone-thread: upright with a low crossbar.
  px(ctx, cx + 10, cy - 53, PALETTE.hostBone, 2, 24);
  px(ctx, cx + 6, cy - 37, PALETTE.hostBone, 10, 2);
  px(ctx, cx + 3, cy - 22, PALETTE.void, 7, 7);
  px(ctx, cx + 13, cy - 18, PALETTE.void, 6, 5);
  px(ctx, cx + 2, cy - 15, PALETTE.outline, 19, 3);
  px(ctx, cx + 4, cy - 16, PALETTE.clothDark, 6, 1);
  px(ctx, cx + 14, cy - 15, PALETTE.clothRed, 5, 1);
  linePx(ctx, cx + 3, cy - 55, cx + 22, cy - 51, PALETTE.clothDark, 1);
  linePx(ctx, cx + 3, cy - 30, cx + 21, cy - 25, PALETTE.outline, 1);
  linePx(ctx, cx + 4, cy - 31, cx + 20, cy - 26, PALETTE.rustDark, 1);
  for (let i = 0; i < 5; i += 1) {
    const x = cx + 5 + Math.floor(rng() * 15);
    const y = cy - 55 + Math.floor(rng() * 35);
    px(ctx, x, y, rng() < 0.5 ? PALETTE.hostBone : PALETTE.clothDark, 1 + (i & 1), 1);
  }
  drawRubbleCluster(ctx, cx + 13, cy + 8, seed + 151, 2);
  drawNoisePixels(ctx, cx + 4, cy - 56, 17, 34, [PALETTE.rustDark, PALETTE.clothDark], 0.04, seed);
}

export function drawBrokenBell(ctx, cx, cy, seed) {
  const rng = rngFrom(hash2D(seed + 23, seed * 5 + 3));
  drawShadowBlob(ctx, cx, cy + 8, 72, 25);

  // Heavy keeper frame. The upper beam makes the bell read as hanging in a
  // tower room, while the skewed brace sells cult sabotage rather than age.
  px(ctx, cx - 31, cy - 66, PALETTE.outline, 9, 70);
  px(ctx, cx + 22, cy - 66, PALETTE.outline, 9, 70);
  px(ctx, cx - 29, cy - 65, PALETTE.woodDark, 5, 67);
  px(ctx, cx + 24, cy - 65, PALETTE.woodDark, 5, 67);
  px(ctx, cx - 28, cy - 64, PALETTE.woodMid, 2, 64);
  px(ctx, cx + 25, cy - 64, PALETTE.woodMid, 2, 64);
  px(ctx, cx - 35, cy - 72, PALETTE.outline, 71, 9);
  px(ctx, cx - 33, cy - 70, PALETTE.woodDark, 67, 5);
  px(ctx, cx - 31, cy - 70, PALETTE.woodLight, 28, 1);
  for (const dx of [-28, -10, 11, 29]) {
    px(ctx, cx + dx - 2, cy - 72, PALETTE.outline, 5, 9);
    px(ctx, cx + dx - 1, cy - 70, PALETTE.rustDark, 3, 5);
    px(ctx, cx + dx, cy - 69, PALETTE.hostGold, 1, 2);
  }
  linePx(ctx, cx - 28, cy - 60, cx + 24, cy - 15, PALETTE.outline, 4);
  linePx(ctx, cx - 27, cy - 60, cx + 22, cy - 16, PALETTE.woodDark, 2);
  linePx(ctx, cx + 27, cy - 60, cx - 25, cy - 18, PALETTE.outline, 2);
  linePx(ctx, cx + 26, cy - 60, cx - 24, cy - 19, PALETTE.woodMid, 1);

  // Crown and hanger, with the cut pin socket called out in brass.
  px(ctx, cx - 9, cy - 66, PALETTE.outline, 19, 10);
  px(ctx, cx - 7, cy - 65, PALETTE.rustDark, 15, 7);
  px(ctx, cx - 5, cy - 64, PALETTE.rustLight, 6, 2);
  px(ctx, cx + 6, cy - 62, PALETTE.hostGold, 4, 3);
  px(ctx, cx + 9, cy - 61, PALETTE.void, 5, 2);

  // Bell body: stepped rows, wider at the mouth, lit on the upper-left.
  for (let row = 0; row < 36; row += 1) {
    const t = row / 35;
    const half = Math.round(12 + t * 19 + (row > 27 ? 3 : 0));
    const y = cy - 55 + row;
    px(ctx, cx - half - 1, y, PALETTE.outline, half * 2 + 2, 1);
    px(ctx, cx - half, y, row < 5 ? PALETTE.rustLight : PALETTE.rustMid, half, 1);
    px(ctx, cx, y, row < 6 ? PALETTE.rustMid : PALETTE.rustDark, half, 1);
    if (row % 7 === 1) px(ctx, cx - half + 4, y, PALETTE.rustLight, 4, 1);
  }
  px(ctx, cx - 32, cy - 18, PALETTE.outline, 65, 6);
  px(ctx, cx - 29, cy - 17, PALETTE.rustLight, 24, 2);
  px(ctx, cx - 3, cy - 17, PALETTE.rustDark, 31, 2);
  px(ctx, cx - 13, cy - 16, PALETTE.void, 27, 3);
  px(ctx, cx - 27, cy - 20, PALETTE.void, 8, 3);
  px(ctx, cx + 18, cy - 18, PALETTE.outline, 10, 3);
  px(ctx, cx + 19, cy - 19, PALETTE.rustMid, 6, 1);

  // Jagged crack, missing clapper, and wooden wedge jammed under the crown.
  linePx(ctx, cx + 5, cy - 49, cx - 1, cy - 39, PALETTE.void, 2);
  linePx(ctx, cx - 1, cy - 39, cx + 8, cy - 31, PALETTE.void, 2);
  linePx(ctx, cx + 8, cy - 31, cx + 2, cy - 22, PALETTE.void, 2);
  linePx(ctx, cx - 12, cy - 47, cx - 18, cy - 34, PALETTE.rustDark, 1);
  linePx(ctx, cx + 14, cy - 42, cx + 20, cy - 30, PALETTE.outline, 1);
  px(ctx, cx + 1, cy - 40, PALETTE.hostGold, 2, 1);
  px(ctx, cx - 11, cy - 60, PALETTE.woodDark, 22, 5);
  px(ctx, cx - 9, cy - 59, PALETTE.woodMid, 17, 2);
  px(ctx, cx - 4, cy - 24, PALETTE.outline, 9, 5);
  px(ctx, cx - 2, cy - 23, PALETTE.rustDark, 5, 3);
  px(ctx, cx + 11, cy - 58, PALETTE.outline, 6, 4);
  px(ctx, cx + 12, cy - 57, PALETTE.rustDark, 4, 2);

  for (let i = 0; i < 11; i += 1) {
    px(ctx, cx - 28 + Math.floor(rng() * 56), cy - 52 + Math.floor(rng() * 36), rng() < 0.5 ? PALETTE.rustDark : PALETTE.stoneDark, 1, 1);
  }
  drawNoisePixels(ctx, cx - 30, cy - 56, 60, 39, [PALETTE.rustDark, PALETTE.stoneDark], 0.045, seed);
  drawRubbleCluster(ctx, cx + 29, cy + 9, seed + 241, 2);
}

export function drawBellRope(ctx, cx, cy, seed, opts = {}) {
  const repaired = Boolean(opts.repaired);
  const sway = repaired ? 0 : ((seed & 1) ? 1 : -1);
  drawShadowBlob(ctx, cx, cy + 4, repaired ? 18 : 23, 8);

  // Pulley bracket and grooved wheel.
  px(ctx, cx - 15, cy - 91, PALETTE.outline, 31, 7);
  px(ctx, cx - 12, cy - 90, PALETTE.stoneDark, 25, 4);
  px(ctx, cx - 6, cy - 95, PALETTE.outline, 13, 12);
  px(ctx, cx - 4, cy - 93, PALETTE.rustDark, 9, 8);
  px(ctx, cx - 2, cy - 91, PALETTE.rustLight, 5, 2);
  px(ctx, cx, cy - 90, PALETTE.void, 2, 2);
  px(ctx, cx - 17, cy - 88, PALETTE.outline, 4, 10);
  px(ctx, cx + 14, cy - 88, PALETTE.outline, 4, 10);
  px(ctx, cx - 16, cy - 87, PALETTE.woodDark, 2, 8);
  px(ctx, cx + 15, cy - 87, PALETTE.woodDark, 2, 8);

  const ropeX = cx + sway;
  const ropeTop = cy - 84;
  const ropeBot = cy - 14;
  px(ctx, ropeX - 2, ropeTop, PALETTE.woodDark, 5, ropeBot - ropeTop);
  px(ctx, ropeX - 1, ropeTop + 1, PALETTE.clothTan, 1, ropeBot - ropeTop - 5);
  for (let y = ropeTop + 5, i = 0; y < ropeBot - 2; y += 8, i += 1) {
    px(ctx, ropeX - 3, y, PALETTE.woodMid, 2, 3);
    px(ctx, ropeX + 2 + (i % 2), y + 3, PALETTE.woodMid, 2, 3);
    if (i % 3 === 1) px(ctx, ropeX - 1, y + 2, PALETTE.outline, 3, 1);
  }

  if (repaired) {
    px(ctx, ropeX - 5, cy - 19, PALETTE.outline, 11, 8);
    px(ctx, ropeX - 4, cy - 18, PALETTE.woodDark, 9, 5);
    px(ctx, ropeX - 2, cy - 17, PALETTE.clothTan, 4, 3);
    px(ctx, ropeX - 7, cy - 9, PALETTE.outline, 15, 5);
    px(ctx, ropeX - 5, cy - 8, PALETTE.clothTan, 10, 2);
    px(ctx, ropeX + 3, cy - 83, PALETTE.hostGold, 4, 3);
    px(ctx, ropeX - 3, cy - 20, PALETTE.hostGold, 5, 2);
    linePx(ctx, ropeX - 6, cy - 15, ropeX + 5, cy - 9, PALETTE.woodMid, 1);
  } else {
    px(ctx, ropeX - 7, cy - 20, PALETTE.outline, 13, 7);
    px(ctx, ropeX - 5, cy - 19, PALETTE.woodDark, 9, 4);
    for (const fray of [-6, -2, 3, 6]) {
      linePx(ctx, ropeX + fray, cy - 14, ropeX + fray + Math.sign(fray || 1) * 4, cy - 7, PALETTE.clothTan, 1);
      px(ctx, ropeX + fray, cy - 14, PALETTE.woodDark, 1, 5);
    }
    for (const fray of [-8, 8]) {
      linePx(ctx, ropeX + fray, cy - 18, ropeX + fray + Math.sign(fray) * 5, cy - 24, PALETTE.woodDark, 1);
      px(ctx, ropeX + fray, cy - 19, PALETTE.clothTan, 1, 4);
    }
    px(ctx, ropeX - 10, cy - 87, PALETTE.woodDark, 21, 4);
    px(ctx, ropeX - 8, cy - 86, PALETTE.woodMid, 15, 1);
  }
  drawNoisePixels(ctx, cx - 14, cy - 21, 28, 19, [PALETTE.stoneDark, PALETTE.woodDark], 0.05, seed);
  drawRubbleCluster(ctx, cx + 13, cy + 5, seed + 251, 2);
}

export function drawCobweb(ctx, cx, cy, seed) {
  const rng = rngFrom(hash2D(seed + 91, seed * 3 + 5));
  const col = PALETTE.stoneDust;
  const line = (x0, y0, x1, y1) => {
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
    for (let i = 0; i <= n; i += 1) {
      const t = i / n;
      px(ctx, Math.round(x0 + (x1 - x0) * t), Math.round(y0 + (y1 - y0) * t), col, 1, 1);
    }
  };
  const sx = rng() < 0.5 ? -1 : 1;
  const sy = rng() < 0.5 ? -1 : 1;
  const ax = cx + sx * 18; // anchor in one corner of the tile
  const ay = cy + sy * 9;
  ctx.save();
  ctx.globalAlpha = 0.62;
  const base = Math.atan2(-sy, -sx); // fan toward the tile centre
  const tips = [];
  for (let i = 0; i < 5; i += 1) {
    const a = base + (i - 2) * 0.34;
    const r = 15 + (i % 2) * 4;
    const tx = ax + Math.cos(a) * r;
    const ty = ay + Math.sin(a) * r * 0.5; // squash to the iso floor
    tips.push([tx, ty]);
    line(ax, ay, tx, ty); // spoke
  }
  for (let i = 0; i < tips.length - 1; i += 1) {
    for (const f of [0.5, 0.82]) { // two rings
      line(ax + (tips[i][0] - ax) * f, ay + (tips[i][1] - ay) * f,
        ax + (tips[i + 1][0] - ax) * f, ay + (tips[i + 1][1] - ay) * f);
    }
  }
  for (let i = 0; i < 7; i += 1) {
    const t = rng();
    const p = tips[Math.floor(rng() * tips.length)];
    px(ctx, ax + (p[0] - ax) * t, ay + (p[1] - ay) * t, i % 2 ? PALETTE.hostBone : PALETTE.stoneDust, 1, 1);
  }
  ctx.restore();
  drawNoisePixels(ctx, cx - 21, cy - 10, 42, 20, [PALETTE.stoneDark, PALETTE.stoneDust], 0.025, seed + 97);
  ctx.save();
  ctx.globalAlpha = 0.5;
  px(ctx, ax - sx * 2, ay - sy * 1, PALETTE.outline, 4, 2);
  px(ctx, ax - sx * 1, ay - sy * 1, PALETTE.hostBone, 2, 1);
  ctx.restore();
}
