import { PALETTE } from '../palette.js';
import {
  drawNoisePixels,
  drawShadowBlob,
  hash2D,
  linePx,
  px,
  rngFrom
} from './basePixels.js';

// Ash-road plants: dead growth, hard pixels, and no clean green.

function leafClump(ctx, x, y, w, h, tone, rim = null) {
  px(ctx, x - Math.floor(w / 2), y - Math.floor(h / 2), PALETTE.outline, w, h);
  px(ctx, x - Math.floor(w / 2) + 1, y - Math.floor(h / 2) + 1, tone, Math.max(1, w - 2), Math.max(1, h - 2));
  if (rim) {
    px(ctx, x - Math.floor(w / 2) + 2, y - Math.floor(h / 2) + 1, rim, Math.max(1, Math.floor(w * 0.38)), 1);
    px(ctx, x - Math.floor(w / 2) + 1, y - Math.floor(h / 2) + 2, rim, 1, Math.max(1, Math.floor(h * 0.42)));
  }
}

export function drawAshTree(ctx, cx, cy, seed) {
  const rng = rngFrom(hash2D(seed + 101, seed * 3 + 17));
  const lean = (seed & 1) ? 2 : -2;

  drawShadowBlob(ctx, cx, cy + 5, 50, 18);

  // Twisted trunk and roots. The authored object blocks only this tile.
  linePx(ctx, cx - 3, cy - 6, cx + lean - 5, cy - 55, PALETTE.outline, 8);
  linePx(ctx, cx - 2, cy - 7, cx + lean - 4, cy - 54, PALETTE.woodDark, 5);
  linePx(ctx, cx - 4, cy - 8, cx + lean - 6, cy - 51, PALETTE.woodMid, 1);
  linePx(ctx, cx + 2, cy - 7, cx + lean, cy - 49, PALETTE.stoneDark, 2);
  linePx(ctx, cx - 5, cy - 2, cx - 20, cy + 4, PALETTE.outline, 3);
  linePx(ctx, cx + 3, cy - 3, cx + 18, cy + 2, PALETTE.outline, 3);
  linePx(ctx, cx - 4, cy - 2, cx - 18, cy + 3, PALETTE.woodDark, 1);
  linePx(ctx, cx + 4, cy - 3, cx + 16, cy + 1, PALETTE.woodMid, 1);
  px(ctx, cx + lean - 5, cy - 45, PALETTE.stoneDust, 2, 11);
  px(ctx, cx + lean - 1, cy - 36, PALETTE.rustDark, 2, 8);

  const canopyY = cy - 72;
  const tones = [PALETTE.stoneDark, PALETTE.woodDark, PALETTE.stoneMid, PALETTE.rustDark];
  const clumps = [
    [-35, -1, 28, 18],
    [-18, -14, 32, 20],
    [4, -21, 35, 22],
    [29, -10, 31, 20],
    [-7, 2, 42, 23],
    [18, 5, 36, 21],
    [-47, 14, 21, 14],
    [44, 13, 22, 16],
    [-25, 17, 34, 19],
    [6, 20, 39, 18],
    [31, 24, 24, 15]
  ];

  for (let i = 0; i < clumps.length; i += 1) {
    const [dx, dy, w, h] = clumps[i];
    const tone = tones[(i + seed) % tones.length];
    const rim = (i + seed) % 3 === 0 ? PALETTE.stoneDust : null;
    leafClump(
      ctx,
      cx + dx + Math.floor((rng() - 0.5) * 4),
      canopyY + dy + Math.floor((rng() - 0.5) * 4),
      w,
      h,
      tone,
      rim
    );
  }

  for (let i = 0; i < 16; i += 1) {
    const x = cx - 48 + Math.floor(rng() * 96);
    const y = canopyY - 25 + Math.floor(rng() * 54);
    const tone = rng() < 0.6 ? PALETTE.hostBlack : PALETTE.rustDark;
    px(ctx, x, y, tone, 2 + Math.floor(rng() * 3), 1 + Math.floor(rng() * 2));
  }
  drawNoisePixels(ctx, cx - 47, canopyY - 23, 94, 58, [PALETTE.hostBlack, PALETTE.woodDark], 0.025, seed);
}

export function drawAshTreeStump(ctx, cx, cy, seed) {
  const rng = rngFrom(hash2D(seed + 37, seed * 5 + 9));
  drawShadowBlob(ctx, cx, cy + 4, 34, 13);
  px(ctx, cx - 11, cy - 22, PALETTE.outline, 23, 25);
  px(ctx, cx - 9, cy - 21, PALETTE.woodDark, 18, 23);
  px(ctx, cx - 8, cy - 21, PALETTE.woodMid, 5, 20);
  px(ctx, cx + 6, cy - 18, PALETTE.stoneDark, 3, 18);
  const topY = cy - 26;
  px(ctx, cx - 9, topY, PALETTE.outline, 19, 8);
  px(ctx, cx - 7, topY + 1, PALETTE.woodMid, 15, 5);
  px(ctx, cx - 6, topY + 2, PALETTE.stoneDark, 12, 2);
  px(ctx, cx - 2, topY + 1, PALETTE.rustDark, 2, 5);
  for (let i = 0; i < 5; i += 1) {
    const sx = cx - 8 + Math.floor(rng() * 17);
    const sy = topY - 3 + Math.floor(rng() * 6);
    px(ctx, sx, sy, i % 2 ? PALETTE.stoneDust : PALETTE.outline, 2, 2);
  }
  linePx(ctx, cx - 9, cy - 3, cx - 21, cy + 5, PALETTE.woodDark, 2);
  linePx(ctx, cx + 8, cy - 4, cx + 19, cy + 3, PALETTE.stoneDark, 2);
}

export function drawScrubBush(ctx, cx, cy, seed) {
  const rng = rngFrom(hash2D(seed + 11, seed * 7 + 3));
  drawShadowBlob(ctx, cx, cy + 3, 28, 10);
  for (let i = 0; i < 9; i += 1) {
    const dx = -13 + Math.floor(rng() * 27);
    const dy = -8 + Math.floor(rng() * 12);
    const h = 7 + Math.floor(rng() * 9);
    const tone = i % 3 === 0 ? PALETTE.stoneMid : i % 3 === 1 ? PALETTE.woodDark : PALETTE.rustDark;
    linePx(ctx, cx + dx, cy + dy, cx + dx + Math.floor((rng() - 0.5) * 8), cy + dy - h, PALETTE.outline, 2);
    linePx(ctx, cx + dx, cy + dy, cx + dx + Math.floor((rng() - 0.5) * 8), cy + dy - h, tone, 1);
  }
  for (let i = 0; i < 6; i += 1) {
    px(ctx, cx - 11 + Math.floor(rng() * 23), cy - 12 + Math.floor(rng() * 10), PALETTE.stoneDust, 2, 1);
  }
}

export function drawWheatClump(ctx, cx, cy, seed, opts = {}) {
  const rng = rngFrom(hash2D(seed + 59, seed * 11 + 23));
  const full = opts.density !== 'thin';
  const count = full ? 20 : 12;
  const heightBase = full ? 23 : 18;

  drawShadowBlob(ctx, cx, cy + 4, full ? 42 : 32, full ? 12 : 9);

  for (let i = 0; i < count; i += 1) {
    const baseX = cx - 24 + Math.floor(rng() * 49);
    const baseY = cy - 6 + Math.floor(rng() * 13);
    const h = heightBase - 5 + Math.floor(rng() * 8);
    const lean = -5 + Math.floor(rng() * 11);
    const tipX = baseX + Math.floor(lean * 0.8);
    const tipY = baseY - h;
    const mid = i % 4 === 0 ? PALETTE.clothTan : i % 4 === 1 ? PALETTE.woodLight : PALETTE.stoneDust;
    const shade = i % 3 === 0 ? PALETTE.woodDark : PALETTE.woodMid;

    linePx(ctx, baseX, baseY, tipX, tipY, PALETTE.outline, 2);
    linePx(ctx, baseX, baseY, tipX, tipY, shade, 1);
    if (i % 2 === 0) linePx(ctx, baseX, baseY - 4, tipX, tipY + 2, mid, 1);

    const headW = full ? 3 : 2;
    px(ctx, tipX - 1, tipY - 3, PALETTE.outline, headW + 1, 5);
    px(ctx, tipX, tipY - 2, mid, headW, 3);
    if (i % 5 === 0) px(ctx, tipX + 1, tipY - 4, PALETTE.hostBone, 1, 1);
  }

  for (let i = 0; i < (full ? 14 : 8); i += 1) {
    const x = cx - 22 + Math.floor(rng() * 45);
    const y = cy - 4 + Math.floor(rng() * 11);
    const w = 3 + Math.floor(rng() * 6);
    px(ctx, x, y, i % 2 ? PALETTE.woodDark : PALETTE.rustDark, w, 1);
  }
}
