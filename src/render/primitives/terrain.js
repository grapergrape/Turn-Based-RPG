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

// Floor and wall primitives.

export const FLOOR_STYLE_IDS = [
  'stone',
  'ash-dirt',
  'ash-road',
  'road-shoulder',
  'wheat-field',
  'furrow-field',
  'forest-floor',
  'graveyard-earth',
  'farm-plank',
  'packed-earth',
  'cave-stone',
  'cave-river'
];

export function drawRuinedStoneFloorCell(ctx, cx, cy, gx, gy) {
  const seed = hash2D(gx, gy);
  const r = rngFrom(seed);
  // Coarse wear zone: cells in the same ~2x2 block share a base tone, so the
  // floor breaks into a few large stained areas instead of a fine checker.
  const zone = hash2D((gx >> 1) + 1, (gy >> 1) + 1);
  // Base tones are deliberately close in value (no bright full-tile dust).
  const base = zone % 6 === 0 ? PALETTE.stoneLight : PALETTE.stoneMid;
  drawIsoDiamond(ctx, cx, cy, TILE_WIDTH, TILE_HEIGHT, base);

  // A faint, off-centre pale scuff — a partial diamond, never the whole tile.
  if (r() < 0.5) {
    ctx.save();
    ctx.globalAlpha = 0.05 + r() * 0.05;
    drawIsoDiamond(
      ctx,
      cx + Math.floor((r() - 0.5) * 18),
      cy + Math.floor((r() - 0.5) * 8),
      26 + Math.floor(r() * 14),
      12 + Math.floor(r() * 7),
      PALETTE.stoneDust
    );
    ctx.restore();
  }
  // A faint darker stain of settled grime on a different subset of tiles.
  if (r() < 0.5) {
    ctx.save();
    ctx.globalAlpha = 0.1 + r() * 0.06;
    drawIsoDiamond(
      ctx,
      cx + Math.floor((r() - 0.5) * 16),
      cy + 2 + Math.floor((r() - 0.5) * 6),
      24 + Math.floor(r() * 16),
      11 + Math.floor(r() * 6),
      PALETTE.stoneDark
    );
    ctx.restore();
  }

  // Broken flag-joint: a faint dark line along ONE lower edge, so a stone-flag
  // grid is only implied, not stamped onto every tile as a hard outline.
  const d = diamond(cx, cy, TILE_WIDTH, TILE_HEIGHT);
  ctx.save();
  ctx.globalAlpha = 0.1;
  ctx.strokeStyle = PALETTE.stoneDark;
  ctx.lineWidth = 1;
  ctx.beginPath();
  if ((seed & 1) === 0) {
    ctx.moveTo(d.left[0] + 2, d.left[1]);
    ctx.lineTo(d.bottom[0], d.bottom[1] - 1);
  } else {
    ctx.moveTo(d.bottom[0], d.bottom[1] - 1);
    ctx.lineTo(d.right[0] - 2, d.right[1]);
  }
  ctx.stroke();
  ctx.restore();

  // Sparse grit; rare hairline cracks.
  drawNoisePixels(ctx, cx - 28, cy - 11, 56, 22, [PALETTE.stoneDark, PALETTE.stoneDust], 0.022, seed);
  if (seed % 7 === 0) drawCracks(ctx, cx + Math.floor((r() - 0.5) * 10), cy, seed, 2);
}

function drawOutdoorFloorCell(ctx, cx, cy, gx, gy, colors, detail = {}) {
  const seed = hash2D(gx + 17, gy + 29);
  const r = rngFrom(seed);
  const zone = hash2D((gx >> 1) + 5, (gy >> 1) + 7);
  const base = zone % (detail.altModulo ?? 5) === 0 ? colors.alt : colors.base;
  drawIsoDiamond(ctx, cx, cy, TILE_WIDTH, TILE_HEIGHT, base);

  if (detail.patch !== false && r() < (detail.patchRate ?? 0.55)) {
    ctx.save();
    ctx.globalAlpha = detail.patchAlpha ?? 0.16;
    drawIsoDiamond(
      ctx,
      cx + Math.floor((r() - 0.5) * 16),
      cy + Math.floor((r() - 0.5) * 8),
      24 + Math.floor(r() * 20),
      10 + Math.floor(r() * 8),
      r() < 0.45 ? colors.hi : colors.lo
    );
    ctx.restore();
  }

  if (detail.rows) {
    const phase = (gx + gy + (seed & 3)) % detail.rowStep;
    if (phase === 0) {
      ctx.save();
      ctx.globalAlpha = detail.rowAlpha ?? 0.42;
      ctx.strokeStyle = colors.row ?? colors.lo;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx - 27, cy - 2);
      ctx.lineTo(cx, cy + 12);
      ctx.lineTo(cx + 27, cy - 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  if (detail.stalks) {
    for (let i = 0; i < 5; i += 1) {
      if (r() > 0.62) continue;
      const sx = cx - 18 + Math.floor(r() * 36);
      const sy = cy - 7 + Math.floor(r() * 13);
      const h = 3 + Math.floor(r() * 5);
      px(ctx, sx, sy - h, colors.stalk ?? colors.hi, 1, h);
      if (r() < 0.45) px(ctx, sx + 1, sy - h + 1, colors.lo, 1, Math.max(1, h - 2));
    }
  }

  if (detail.leafLitter) {
    drawNoisePixels(ctx, cx - 29, cy - 12, 58, 24, [colors.lo, colors.hi, PALETTE.rustDark], 0.055, seed);
  } else {
    drawNoisePixels(ctx, cx - 29, cy - 12, 58, 24, [colors.lo, colors.hi], detail.noise ?? 0.035, seed);
  }

  if (seed % (detail.crackEvery ?? 13) === 0) {
    drawCracks(ctx, cx + Math.floor((r() - 0.5) * 14), cy + Math.floor((r() - 0.5) * 5), seed, 2);
  }
}

function drawRoadSurfaceCell(ctx, cx, cy, gx, gy) {
  const seed = hash2D(gx + 71, gy + 113);
  const r = rngFrom(seed);
  drawIsoDiamond(ctx, cx, cy, TILE_WIDTH, TILE_HEIGHT, PALETTE.stoneMid);

  ctx.save();
  ctx.globalAlpha = 0.055;
  drawIsoDiamond(ctx, cx, cy - 1, TILE_WIDTH - 14, TILE_HEIGHT - 7, PALETTE.stoneLight);
  ctx.globalAlpha = 0.07;
  drawIsoDiamond(ctx, cx + Math.floor((r() - 0.5) * 10), cy + Math.floor((r() - 0.5) * 5), 22, 10, r() < 0.5 ? PALETTE.stoneDust : PALETTE.stoneDark);
  ctx.restore();

  const d = diamond(cx, cy, TILE_WIDTH, TILE_HEIGHT);
  if ((gx + gy + (seed & 3)) % 3 !== 0) {
    ctx.save();
    ctx.globalAlpha = 0.16;
    ctx.strokeStyle = PALETTE.stoneDark;
    ctx.lineWidth = 1;
    ctx.beginPath();
    if ((gx + gy + (seed & 1)) % 4 === 0) {
      ctx.moveTo(d.left[0] + 10, d.left[1] + 1);
      ctx.lineTo(d.bottom[0], d.bottom[1] - 5);
      ctx.lineTo(d.right[0] - 10, d.right[1] + 1);
    } else {
      ctx.moveTo(d.top[0], d.top[1] + 5);
      ctx.lineTo(d.bottom[0], d.bottom[1] - 5);
    }
    ctx.stroke();
    ctx.restore();
  }

  if (seed % 9 === 0) drawCracks(ctx, cx + Math.floor((r() - 0.5) * 16), cy, seed, 2);
  if (r() < 0.42) {
    px(ctx, cx - 21 + Math.floor(r() * 42), cy - 4 + Math.floor(r() * 8), PALETTE.rustDark, 8 + Math.floor(r() * 12), 1);
  }
  drawNoisePixels(ctx, cx - 29, cy - 12, 58, 24, [PALETTE.stoneDark, PALETTE.stoneDust, PALETTE.rustDark], 0.028, seed);
}

function drawRoadShoulderCell(ctx, cx, cy, gx, gy) {
  const seed = hash2D(gx + 137, gy + 149);
  const r = rngFrom(seed);

  drawIsoDiamond(ctx, cx, cy, TILE_WIDTH, TILE_HEIGHT, PALETTE.woodDark);
  drawNoisePixels(ctx, cx - 30, cy - 12, 60, 24, [PALETTE.rustDark, PALETTE.stoneDark], 0.04, seed);

  ctx.save();
  ctx.globalAlpha = 0.9;
  drawIsoDiamond(ctx, cx, cy - 1, TILE_WIDTH - 10, TILE_HEIGHT - 5, (seed & 1) ? PALETTE.stoneDark : PALETTE.stoneMid);
  ctx.globalAlpha = 0.2;
  drawIsoDiamond(ctx, cx + Math.floor((r() - 0.5) * 9), cy - 2 + Math.floor((r() - 0.5) * 4), TILE_WIDTH - 24, TILE_HEIGHT - 12, PALETTE.stoneDust);
  ctx.restore();

  const d = diamond(cx, cy, TILE_WIDTH - 8, TILE_HEIGHT - 4);
  ctx.save();
  ctx.globalAlpha = 0.28;
  ctx.strokeStyle = PALETTE.stoneDust;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(d.left[0] + 2, d.left[1]);
  ctx.lineTo(d.top[0], d.top[1] + 1);
  ctx.lineTo(d.right[0] - 2, d.right[1]);
  ctx.stroke();
  ctx.globalAlpha = 0.42;
  ctx.strokeStyle = PALETTE.stoneDark;
  ctx.beginPath();
  ctx.moveTo(d.left[0] + 3, d.left[1] + 2);
  ctx.lineTo(d.bottom[0], d.bottom[1] - 2);
  ctx.lineTo(d.right[0] - 3, d.right[1] + 2);
  ctx.stroke();
  ctx.restore();

  if (r() < 0.45) {
    px(ctx, cx - 18 + Math.floor(r() * 36), cy - 4 + Math.floor(r() * 8), PALETTE.stoneDark, 8 + Math.floor(r() * 9), 1);
  }
}

function drawFarmPlankFloorCell(ctx, cx, cy, gx, gy) {
  const seed = hash2D(gx + 211, gy + 223);
  const r = rngFrom(seed);
  const zone = hash2D((gx >> 1) + 17, (gy >> 1) + 23);
  const base = zone % 5 === 0 ? PALETTE.woodMid : PALETTE.woodDark;
  drawIsoDiamond(ctx, cx, cy, TILE_WIDTH, TILE_HEIGHT, base);

  const d = diamond(cx, cy, TILE_WIDTH, TILE_HEIGHT);
  const seamColor = zone % 3 === 0 ? PALETTE.outline : PALETTE.rustDark;
  for (const t of [0.24, 0.49, 0.74]) {
    const wobble = ((seed >> Math.floor(t * 11)) & 1) ? 1 : 0;
    const a = mixPoint(d.left, d.top, t);
    const b = mixPoint(d.bottom, d.right, t);
    linePx(ctx, a[0], a[1] + wobble, b[0], b[1] + wobble, seamColor, 1);
  }

  if ((seed & 3) !== 0) {
    const t = 0.26 + r() * 0.48;
    const a = mixPoint(d.left, d.bottom, t);
    const b = mixPoint(d.top, d.right, t + (r() - 0.5) * 0.1);
    linePx(ctx, a[0], a[1], b[0], b[1], PALETTE.woodMid, 1);
  }

  if (r() < 0.46) {
    drawIsoDiamond(
      ctx,
      cx + Math.floor((r() - 0.5) * 18),
      cy + Math.floor((r() - 0.5) * 8),
      14 + Math.floor(r() * 12),
      6 + Math.floor(r() * 5),
      r() < 0.45 ? PALETTE.stoneDark : PALETTE.rustDark
    );
  }

  for (let i = 0; i < 5; i += 1) {
    if (r() > 0.62) continue;
    const x = cx - 23 + Math.floor(r() * 46);
    const y = cy - 8 + Math.floor(r() * 16);
    px(ctx, x, y, r() < 0.5 ? PALETTE.woodLight : PALETTE.stoneDark, 1 + Math.floor(r() * 3), 1);
  }
  drawNoisePixels(ctx, cx - 29, cy - 12, 58, 24, [PALETTE.woodDark, PALETTE.stoneDark, PALETTE.rustDark], 0.026, seed);
}

function drawPackedEarthFloorCell(ctx, cx, cy, gx, gy) {
  const seed = hash2D(gx + 251, gy + 263);
  const r = rngFrom(seed);
  const zone = hash2D((gx >> 1) + 29, (gy >> 1) + 31);
  const base = zone % 4 === 0 ? PALETTE.stoneDark : PALETTE.woodDark;
  drawIsoDiamond(ctx, cx, cy, TILE_WIDTH, TILE_HEIGHT, base);

  if (r() < 0.62) {
    drawIsoDiamond(
      ctx,
      cx + Math.floor((r() - 0.5) * 18),
      cy + Math.floor((r() - 0.5) * 8),
      20 + Math.floor(r() * 18),
      9 + Math.floor(r() * 7),
      r() < 0.5 ? PALETTE.rustDark : PALETTE.stoneMid
    );
  }

  if ((seed % 5) === 0) {
    const d = diamond(cx, cy, TILE_WIDTH - 12, TILE_HEIGHT - 6);
    const a = mixPoint(d.left, d.top, 0.2 + r() * 0.25);
    const b = mixPoint(d.bottom, d.right, 0.64 + r() * 0.22);
    linePx(ctx, a[0], a[1], b[0], b[1], PALETTE.woodMid, 2);
    linePx(ctx, a[0] + 1, a[1] - 1, b[0] + 1, b[1] - 1, PALETTE.woodLight, 1);
  }

  for (let i = 0; i < 7; i += 1) {
    if (r() > 0.72) continue;
    const x = cx - 22 + Math.floor(r() * 44);
    const y = cy - 8 + Math.floor(r() * 16);
    linePx(ctx, x, y, x + 2 + Math.floor(r() * 6), y - 1 + Math.floor(r() * 3), r() < 0.6 ? PALETTE.clothTan : PALETTE.woodMid, 1);
  }

  drawNoisePixels(ctx, cx - 29, cy - 12, 58, 24, [PALETTE.rustDark, PALETTE.stoneDark, PALETTE.woodMid], 0.044, seed);
  if (seed % 17 === 0) drawCracks(ctx, cx + Math.floor((r() - 0.5) * 14), cy + Math.floor((r() - 0.5) * 5), seed, 2);
}

function drawCaveStoneFloorCell(ctx, cx, cy, gx, gy) {
  const seed = hash2D(gx + 331, gy + 347);
  const r = rngFrom(seed);
  const zone = hash2D((gx >> 1) + 43, (gy >> 1) + 47);
  const base = zone % 4 === 0 ? PALETTE.stoneMid : PALETTE.stoneDark;
  drawIsoDiamond(ctx, cx, cy, TILE_WIDTH, TILE_HEIGHT, base);

  if (r() < 0.7) {
    drawIsoDiamond(
      ctx,
      cx + Math.floor((r() - 0.5) * 18),
      cy + Math.floor((r() - 0.5) * 8),
      18 + Math.floor(r() * 22),
      8 + Math.floor(r() * 8),
      r() < 0.45 ? PALETTE.stoneLight : PALETTE.stoneDark
    );
  }

  const d = diamond(cx, cy, TILE_WIDTH - 8, TILE_HEIGHT - 4);
  for (const t of [0.18, 0.48, 0.76]) {
    if (((seed + Math.floor(t * 100)) % 3) === 0) continue;
    const a = mixPoint(d.left, d.bottom, t);
    const b = mixPoint(d.top, d.right, Math.max(0.12, Math.min(0.88, t + (r() - 0.5) * 0.18)));
    linePx(ctx, a[0], a[1], b[0], b[1], r() < 0.55 ? PALETTE.outline : PALETTE.stoneDust, 1);
  }

  drawNoisePixels(ctx, cx - 29, cy - 12, 58, 24, [PALETTE.outline, PALETTE.stoneDust, PALETTE.rustDark], 0.038, seed);
  if (seed % 9 === 0) drawCracks(ctx, cx + Math.floor((r() - 0.5) * 14), cy + Math.floor((r() - 0.5) * 5), seed, 3);
}

function drawCaveRiverFloorCell(ctx, cx, cy, gx, gy) {
  const seed = hash2D(gx + 353, gy + 359);
  const r = rngFrom(seed);
  drawIsoDiamond(ctx, cx, cy, TILE_WIDTH, TILE_HEIGHT, PALETTE.outline);
  drawIsoDiamond(ctx, cx, cy, TILE_WIDTH - 4, TILE_HEIGHT - 2, PALETTE.clothBlueDark);
  drawIsoDiamond(ctx, cx + 1, cy - 1, TILE_WIDTH - 18, TILE_HEIGHT - 9, PALETTE.stoneDark);
  drawIsoDiamond(ctx, cx - 1, cy, TILE_WIDTH - 25, TILE_HEIGHT - 12, PALETTE.clothBlue);

  const d = diamond(cx, cy, TILE_WIDTH - 8, TILE_HEIGHT - 4);
  for (let i = 0; i < 7; i += 1) {
    const t = (i + 1) / 8;
    const wobble = Math.floor(r() * 5) - 2;
    const a = mixPoint(d.left, d.top, Math.max(0.08, t - 0.1));
    const b = mixPoint(d.bottom, d.right, Math.min(0.92, t + 0.1));
    const color = i % 3 === 0 ? PALETTE.hostBone : i % 2 === 0 ? PALETTE.clothBlue : PALETTE.stoneDust;
    linePx(ctx, a[0] + wobble, a[1] + 1, b[0] + wobble, b[1] - 1, color, i % 3 === 0 ? 1 : 2);
  }

  for (let i = 0; i < 13; i += 1) {
    const x = cx - 25 + Math.floor(r() * 51);
    const y = cy - 10 + Math.floor(r() * 20);
    const color = r() < 0.52 ? PALETTE.hostBone : PALETTE.stoneDust;
    px(ctx, x, y, color, 1 + Math.floor(r() * 4), 1);
  }

  if ((gx + gy) % 2 === 0) {
    linePx(ctx, cx - 29, cy + 4, cx - 12, cy + 12, PALETTE.void, 1);
    linePx(ctx, cx + 12, cy - 12, cx + 29, cy - 4, PALETTE.stoneLight, 1);
  }
}

function drawGraveyardEarthCell(ctx, cx, cy, gx, gy) {
  const seed = hash2D(gx + 281, gy + 307);
  const r = rngFrom(seed);
  const zone = hash2D((gx >> 1) + 37, (gy >> 1) + 41);
  const base = zone % 5 === 0 ? PALETTE.stoneMid : PALETTE.stoneDark;
  drawIsoDiamond(ctx, cx, cy, TILE_WIDTH, TILE_HEIGHT, base);

  ctx.save();
  ctx.globalAlpha = 0.12;
  drawIsoDiamond(
    ctx,
    cx + Math.floor((r() - 0.5) * 14),
    cy + Math.floor((r() - 0.5) * 7),
    26 + Math.floor(r() * 18),
    11 + Math.floor(r() * 7),
    r() < 0.48 ? PALETTE.stoneDust : PALETTE.rustDark
  );
  ctx.globalAlpha = 0.05;
  drawIsoDiamond(
    ctx,
    cx + Math.floor((r() - 0.5) * 18),
    cy + Math.floor((r() - 0.5) * 8),
    18 + Math.floor(r() * 14),
    8 + Math.floor(r() * 5),
    PALETTE.hostBone
  );
  ctx.restore();

  // Faint rectangular burial seams, broken enough to avoid a stamped grid.
  if ((gx + gy + (seed & 3)) % 4 === 0) {
    const d = diamond(cx, cy, TILE_WIDTH - 12, TILE_HEIGHT - 6);
    const topA = mixPoint(d.left, d.top, 0.34);
    const topB = mixPoint(d.top, d.right, 0.66);
    const botA = mixPoint(d.left, d.bottom, 0.36);
    const botB = mixPoint(d.bottom, d.right, 0.64);
    ctx.save();
    ctx.globalAlpha = 0.36;
    linePx(ctx, topA[0], topA[1], topB[0], topB[1], PALETTE.stoneDust, 1);
    linePx(ctx, botA[0], botA[1], botB[0], botB[1], PALETTE.stoneDark, 1);
    if (seed % 8 === 0) linePx(ctx, topA[0] + 2, topA[1] + 2, botA[0] + 2, botA[1] - 1, PALETTE.rustDark, 1);
    ctx.restore();
  }

  if (seed % 6 === 0) {
    const x = cx - 22 + Math.floor(r() * 44);
    const y = cy - 7 + Math.floor(r() * 14);
    linePx(ctx, x, y, x + 5 + Math.floor(r() * 9), y - 2 + Math.floor(r() * 4), PALETTE.woodDark, 1);
  }

  drawNoisePixels(ctx, cx - 29, cy - 12, 58, 24, [PALETTE.stoneDark, PALETTE.stoneDust, PALETTE.rustDark], 0.03, seed);
  if (seed % 13 === 0) drawCracks(ctx, cx + Math.floor((r() - 0.5) * 14), cy + Math.floor((r() - 0.5) * 5), seed, 2);
}

export function drawStyledFloorCell(ctx, cx, cy, gx, gy, style = 'stone') {
  switch (style) {
    case 'ash-dirt':
      drawOutdoorFloorCell(ctx, cx, cy, gx, gy, {
        base: PALETTE.woodDark,
        alt: PALETTE.stoneDark,
        hi: PALETTE.woodMid,
        lo: PALETTE.rustDark
      }, { noise: 0.04, patchAlpha: 0.12, crackEvery: 11 });
      return;
    case 'ash-road':
      drawRoadSurfaceCell(ctx, cx, cy, gx, gy);
      return;
    case 'road-shoulder':
      drawRoadShoulderCell(ctx, cx, cy, gx, gy);
      return;
    case 'wheat-field':
      drawOutdoorFloorCell(ctx, cx, cy, gx, gy, {
        base: PALETTE.hostGold,
        alt: PALETTE.woodLight,
        hi: PALETTE.clothTan,
        lo: PALETTE.woodDark,
        row: PALETTE.woodDark,
        stalk: PALETTE.clothTan
      }, { noise: 0.022, rows: true, rowStep: 3, rowAlpha: 0.13, stalks: true, patchRate: 0.18, patchAlpha: 0.05, altModulo: 8, crackEvery: 23 });
      return;
    case 'furrow-field':
      drawOutdoorFloorCell(ctx, cx, cy, gx, gy, {
        base: PALETTE.woodMid,
        alt: PALETTE.woodDark,
        hi: PALETTE.clothTan,
        lo: PALETTE.woodDark,
        row: PALETTE.rustDark,
        stalk: PALETTE.hostGold
      }, { noise: 0.032, rows: true, rowStep: 2, rowAlpha: 0.26, stalks: true, patchRate: 0.28, patchAlpha: 0.08, crackEvery: 19 });
      return;
    case 'forest-floor':
      drawOutdoorFloorCell(ctx, cx, cy, gx, gy, {
        base: PALETTE.stoneDark,
        alt: PALETTE.woodDark,
        hi: PALETTE.stoneMid,
        lo: PALETTE.hostBlack
      }, { noise: 0.05, patchAlpha: 0.1, leafLitter: true, crackEvery: 15 });
      return;
    case 'graveyard-earth':
      drawGraveyardEarthCell(ctx, cx, cy, gx, gy);
      return;
    case 'farm-plank':
      drawFarmPlankFloorCell(ctx, cx, cy, gx, gy);
      return;
    case 'packed-earth':
      drawPackedEarthFloorCell(ctx, cx, cy, gx, gy);
      return;
    case 'cave-stone':
      drawCaveStoneFloorCell(ctx, cx, cy, gx, gy);
      return;
    case 'cave-river':
      drawCaveRiverFloorCell(ctx, cx, cy, gx, gy);
      return;
    case 'stone':
    default:
      drawRuinedStoneFloorCell(ctx, cx, cy, gx, gy);
  }
}

const FARM_INTERIOR_WALL_STYLES = {
  farmhouse: {
    height: 52,
    top: PALETTE.woodMid,
    lit: PALETTE.clothTan,
    shade: PALETTE.woodDark,
    seam: PALETTE.woodDark,
    trim: PALETTE.woodLight,
    grime: PALETTE.rustDark
  },
  barn: {
    height: 58,
    top: PALETTE.woodDark,
    lit: PALETTE.woodMid,
    shade: PALETTE.outline,
    seam: PALETTE.outline,
    trim: PALETTE.rustMid,
    grime: PALETTE.stoneDark
  },
  shed: {
    height: 46,
    top: PALETTE.rustDark,
    lit: PALETTE.woodDark,
    shade: PALETTE.stoneDark,
    seam: PALETTE.outline,
    trim: PALETTE.rustLight,
    grime: PALETTE.rustDark
  }
};

function drawFarmWallFaceDetail(ctx, face, seed, style, variant, shaded = false) {
  const seam = shaded ? PALETTE.outline : style.seam;
  const trim = shaded ? PALETTE.woodDark : style.trim;

  if (variant === 'farmhouse') {
    for (const u of [0.16, 0.38, 0.62, 0.84]) face.line(u, 0.04, u, 0.98, seam, 1);
    face.line(0.05, 0.2, 0.94, 0.2, trim, 1);
    face.line(0.08, 0.76, 0.92, 0.76, PALETTE.woodDark, 2);
    if ((seed & 1) === 0) {
      face.rect(0.18, 0.34, 0.44, 0.58, PALETTE.stoneDust);
      face.line(0.18, 0.34, 0.44, 0.34, PALETTE.clothTan, 1);
    }
    if (seed % 3 === 0) face.line(0.55, 0.42, 0.82, 0.5, PALETTE.rustDark, 1);
    return;
  }

  if (variant === 'barn') {
    for (const u of [0.1, 0.22, 0.34, 0.46, 0.6, 0.74, 0.88]) {
      face.line(u, 0.05, u + (((seed + Math.floor(u * 100)) & 1) ? 0.02 : -0.01), 0.98, seam, 1);
    }
    for (const v of [0.28, 0.56, 0.82]) {
      face.line(0.04, v, 0.96, v, v === 0.28 ? trim : PALETTE.woodDark, 2);
    }
    if ((seed & 3) === 1) face.line(0.22, 0.2, 0.78, 0.72, PALETTE.rustDark, 1);
    return;
  }

  for (const u of [0.18, 0.35, 0.57, 0.79]) face.line(u, 0.08, u, 0.96, seam, 1);
  face.line(0.08, 0.26, 0.9, 0.22, trim, 1);
  face.line(0.08, 0.58, 0.9, 0.62, PALETTE.outline, 1);
  face.line(0.2, 0.72, 0.86, 0.4, PALETTE.woodDark, 1);
  if ((seed & 1) === 0) {
    face.rect(0.52, 0.2, 0.78, 0.34, PALETTE.rustDark);
    face.line(0.52, 0.2, 0.78, 0.2, PALETTE.rustLight, 1);
  }
}

export function drawFarmInteriorWallBlock(ctx, cx, cy, heightPx, seed, opts = {}) {
  const variant = FARM_INTERIOR_WALL_STYLES[opts.variant] ? opts.variant : 'shed';
  const connected = opts.connected ?? {};
  const style = FARM_INTERIOR_WALL_STYLES[variant];
  const wallH = heightPx ?? style.height;
  const base = diamond(cx, cy, TILE_WIDTH, TILE_HEIGHT);
  const cap = diamond(cx, cy - wallH, TILE_WIDTH, TILE_HEIGHT);

  drawShadowBlob(ctx, cx, cy + 2, TILE_WIDTH * 0.64, TILE_HEIGHT * 0.58);

  if (!connected.yPlus) {
    poly(ctx, style.lit, [cap.left, cap.bottom, base.bottom, base.left]);
    const face = faceTools(ctx, cap.left, cap.bottom, base.bottom, base.left);
    drawFarmWallFaceDetail(ctx, face, seed + 17, style, variant, false);
  }

  if (!connected.xPlus) {
    poly(ctx, style.shade, [cap.bottom, cap.right, base.right, base.bottom]);
    const face = faceTools(ctx, cap.bottom, cap.right, base.right, base.bottom);
    drawFarmWallFaceDetail(ctx, face, seed + 31, style, variant, true);
  }

  poly(ctx, style.top, [cap.top, cap.right, cap.bottom, cap.left]);

  linePx(ctx, cap.left[0], cap.left[1], cap.top[0], cap.top[1], style.trim, 1);
  if (!connected.xPlus) linePx(ctx, cap.top[0], cap.top[1], cap.right[0], cap.right[1], PALETTE.woodDark, 1);
  if (!connected.yPlus) linePx(ctx, cap.left[0], cap.left[1], cap.bottom[0], cap.bottom[1], PALETTE.outline, 1);

  for (const t of [0.26, 0.52, 0.78]) {
    if (((seed + Math.floor(t * 100)) & 1) === 0) continue;
    const a = mixPoint(cap.left, cap.top, t);
    const b = mixPoint(cap.bottom, cap.right, t);
    linePx(ctx, a[0], a[1], b[0], b[1], variant === 'farmhouse' ? PALETTE.woodDark : PALETTE.outline, 1);
  }

  if ((seed & 3) === 0) {
    drawNoisePixels(ctx, cx - 24, cy - wallH + 12, 48, Math.max(12, wallH - 10), [style.grime, PALETTE.stoneDark], 0.018, seed);
  }
}

export function drawIsoWallBlock(ctx, cx, cy, heightPx, seed) {
  // Base contact shadow.
  drawShadowBlob(ctx, cx, cy + 2, TILE_WIDTH * 0.7, TILE_HEIGHT * 0.7);

  drawIsoPrism(ctx, cx, cy, TILE_WIDTH, TILE_HEIGHT, heightPx, {
    top: PALETTE.stoneLight,
    left: PALETTE.stoneMid,
    right: PALETTE.stoneDark,
    outline: PALETTE.outline
  });

  // Chipped edge pixels and cracks on the front faces.
  const rng = rngFrom(hash2D(seed + 3, seed * 5 + 7));
  for (let i = 0; i < 6; i += 1) {
    const fy = cy - Math.floor(rng() * heightPx);
    const fx = cx + Math.floor((rng() - 0.5) * TILE_WIDTH * 0.6);
    px(ctx, fx, fy, PALETTE.stoneDark);
    if (rng() < 0.4) px(ctx, fx, fy + 1, PALETTE.stoneDust);
  }
  // A little rubble heaped at the base sometimes.
  if ((seed & 3) === 0) {
    drawRubbleCluster(ctx, cx, cy + 4, seed, 4);
  }
}

export function drawCaveWallBlock(ctx, cx, cy, heightPx, seed, opts = {}) {
  const wallH = heightPx ?? WALL_HEIGHT;
  const connected = opts.connected ?? {};
  const base = diamond(cx, cy, TILE_WIDTH, TILE_HEIGHT);
  const cap = diamond(cx, cy - wallH, TILE_WIDTH, TILE_HEIGHT);
  const rng = rngFrom(hash2D(seed + 379, seed * 3 + 11));

  drawShadowBlob(ctx, cx, cy + 3, TILE_WIDTH * 0.74, TILE_HEIGHT * 0.74);

  if (!connected.yPlus) {
    poly(ctx, PALETTE.stoneMid, [cap.left, cap.bottom, base.bottom, base.left]);
    const face = faceTools(ctx, cap.left, cap.bottom, base.bottom, base.left);
    for (const u of [0.12, 0.27, 0.43, 0.61, 0.78, 0.9]) {
      const lean = ((seed + Math.floor(u * 100)) & 1) ? 0.05 : -0.04;
      face.line(u, 0.02, Math.max(0.04, Math.min(0.96, u + lean)), 0.96, PALETTE.outline, 1);
    }
    for (const v of [0.22, 0.47, 0.71]) {
      face.line(0.05, v, 0.94, v + (rng() - 0.5) * 0.08, v < 0.5 ? PALETTE.stoneDust : PALETTE.stoneDark, 1);
    }
  }

  if (!connected.xPlus) {
    poly(ctx, PALETTE.stoneDark, [cap.bottom, cap.right, base.right, base.bottom]);
    const face = faceTools(ctx, cap.bottom, cap.right, base.right, base.bottom);
    for (const u of [0.16, 0.36, 0.58, 0.82]) {
      face.line(u, 0.05, Math.max(0.04, Math.min(0.96, u - 0.06)), 0.98, PALETTE.outline, 1);
    }
    for (const v of [0.32, 0.65]) face.line(0.06, v, 0.92, v - 0.04, PALETTE.void, 1);
  }

  poly(ctx, PALETTE.stoneLight, [cap.top, cap.right, cap.bottom, cap.left]);
  poly(ctx, PALETTE.stoneDust, [
    mixPoint(cap.left, cap.top, 0.12),
    mixPoint(cap.top, cap.right, 0.84),
    mixPoint(cap.bottom, cap.right, 0.22),
    mixPoint(cap.left, cap.bottom, 0.78)
  ]);

  linePx(ctx, cap.left[0], cap.left[1], cap.top[0], cap.top[1], PALETTE.stoneDust, 1);
  linePx(ctx, cap.top[0], cap.top[1], cap.right[0], cap.right[1], PALETTE.outline, 1);
  if (!connected.yPlus) linePx(ctx, cap.left[0], cap.left[1], cap.bottom[0], cap.bottom[1], PALETTE.outline, 1);
  if (!connected.xPlus) linePx(ctx, cap.bottom[0], cap.bottom[1], cap.right[0], cap.right[1], PALETTE.outline, 1);

  for (let i = 0; i < 6; i += 1) {
    const fx = cx - 26 + Math.floor(rng() * 52);
    const fy = cy - wallH + 8 + Math.floor(rng() * Math.max(8, wallH - 12));
    px(ctx, fx, fy, rng() < 0.55 ? PALETTE.stoneDust : PALETTE.void, 2 + Math.floor(rng() * 4), 1);
  }
  if ((seed & 3) === 0) drawRubbleCluster(ctx, cx, cy + 5, seed + 383, 5);
}
