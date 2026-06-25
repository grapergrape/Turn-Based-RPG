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
  'forest-floor'
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
    case 'stone':
    default:
      drawRuinedStoneFloorCell(ctx, cx, cy, gx, gy);
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
