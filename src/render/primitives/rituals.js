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

// Ritual markings, altar objects, and chapel ceremony props.

export function drawPrayerLectern(ctx, cx, cy, seed) {
  drawShadowBlob(ctx, cx, cy + 5, 34, 14);
  drawIsoPrism(ctx, cx, cy, 32, 18, 12, {
    top: PALETTE.woodLight,
    left: PALETTE.woodMid,
    right: PALETTE.woodDark,
    outline: PALETTE.outline
  });
  px(ctx, cx - 3, cy - 39, PALETTE.woodDark, 7, 33);
  px(ctx, cx - 2, cy - 39, PALETTE.woodMid, 4, 30);
  drawIsoPrism(ctx, cx, cy - 42, 38, 18, 8, {
    top: PALETTE.clothTan,
    left: PALETTE.stoneDust,
    right: PALETTE.rustDark,
    outline: PALETTE.outline
  });
  px(ctx, cx - 10, cy - 52, PALETTE.rustDark, 20, 1);
  px(ctx, cx - 7, cy - 49, PALETTE.stoneDark, 14, 1);
  if ((seed & 1) === 0) px(ctx, cx + 9, cy - 48, PALETTE.hostRed, 4, 2);
}

export function drawRitualBowl(ctx, cx, cy, seed) {
  drawShadowBlob(ctx, cx, cy + 3, 26, 10);
  drawIsoPrism(ctx, cx, cy, 25, 13, 6, {
    top: PALETTE.rustLight,
    left: PALETTE.rustMid,
    right: PALETTE.rustDark,
    outline: PALETTE.outline
  });
  drawIsoDiamond(ctx, cx, cy - 7, 17, 8, PALETTE.void);
  px(ctx, cx - 5, cy - 10, PALETTE.hostBone, 4, 1);
  px(ctx, cx + 1, cy - 9, PALETTE.hostBone, 5, 1);
  px(ctx, cx - 1, cy - 8, PALETTE.hostGold, 2, 2);
  drawNoisePixels(ctx, cx - 11, cy - 10, 22, 12, [PALETTE.rustDark, PALETTE.hostRed], 0.04, seed);
}

export function drawDamagedAltar(ctx, cx, cy, seed, pulse = 0) {
  drawShadowBlob(ctx, cx, cy + 7, 78, 28);
  // Stone base block.
  drawIsoPrism(ctx, cx, cy, 64, 32, 36, {
    top: PALETTE.stoneLight,
    left: PALETTE.stoneMid,
    right: PALETTE.stoneDark,
    outline: PALETTE.outline
  });
  // Top slab overhang.
  drawIsoPrism(ctx, cx, cy - 36, 72, 34, 9, {
    top: PALETTE.stoneDust,
    left: PALETTE.stoneMid,
    right: PALETTE.stoneDark,
    outline: PALETTE.outline
  });
  // Cracks across the front face + a missing corner.
  drawCracks(ctx, cx - 10, cy - 14, seed, 4);
  ctx.save();
  ctx.globalAlpha = 0.7;
  drawIsoDiamond(ctx, cx + 24, cy - 32, 18, 11, PALETTE.stoneDark);
  ctx.restore();
  // Torn chapel cloth draped over the slab.
  px(ctx, cx - 22, cy - 44, PALETTE.clothRed, 16, 5);
  px(ctx, cx - 18, cy - 40, PALETTE.clothDark, 10, 3);
  // Host tissue splitting it from below.
  drawHostGrowth(ctx, cx, cy + 4, seed + 7, pulse);
  drawHostGrowth(ctx, cx - 18, cy - 4, seed + 19, pulse);
  drawHostGrowth(ctx, cx + 16, cy - 2, seed + 31, pulse);
}

export function drawLooseFlagstone(ctx, cx, cy, seed) {
  drawShadowBlob(ctx, cx, cy + 3, 34, 14);
  // The cavity under the lifted stone.
  drawIsoDiamond(ctx, cx + 4, cy + 2, 30, 15, PALETTE.void);
  drawIsoDiamond(ctx, cx + 5, cy + 3, 22, 10, PALETTE.hostBlack);
  // The slab, tilted up on its inner edge.
  poly(ctx, PALETTE.outline, [[cx - 20, cy - 2], [cx - 2, cy - 12], [cx + 16, cy - 6], [cx - 2, cy + 4]]);
  poly(ctx, PALETTE.stoneMid, [[cx - 18, cy - 2], [cx - 3, cy - 10], [cx + 13, cy - 5], [cx - 3, cy + 3]]);
  poly(ctx, PALETTE.stoneLight, [[cx - 18, cy - 2], [cx - 3, cy - 10], [cx - 1, cy - 9], [cx - 16, cy - 1]]);
  px(ctx, cx - 2, cy - 11, PALETTE.stoneDust, 3, 1);
  // A pale gleam from whatever waits in the dark.
  px(ctx, cx + 8, cy + 2, PALETTE.hostGold, 2, 1);
  px(ctx, cx + 6, cy + 4, PALETTE.hostBone, 1, 1);
  drawNoisePixels(ctx, cx - 18, cy - 10, 34, 18, [PALETTE.stoneDark, PALETTE.stoneDust], 0.05, seed);
}

export function drawChalkDrawing(ctx, cx, cy, seed) {
  ctx.save();
  ctx.globalAlpha = 0.72;
  const chalk = PALETTE.hostBone;
  // Ringed planet (a pixel ellipse).
  for (let a = 0; a < 30; a += 1) {
    const t = (a / 30) * Math.PI * 2;
    px(ctx, cx - 8 + Math.round(Math.cos(t) * 6), cy - 5 + Math.round(Math.sin(t) * 4), chalk);
  }
  // The ring slashing across it.
  for (let i = -8; i <= 6; i += 1) px(ctx, cx - 8 + i, cy - 5 - Math.round(i * 0.3), chalk);
  // The bore shaft dropping below the world.
  px(ctx, cx - 8, cy, chalk, 1, 8);
  px(ctx, cx - 10, cy + 8, chalk, 5, 1);
  // A small stick figure looking up at it.
  px(ctx, cx + 10, cy - 4, chalk, 1, 1);
  px(ctx, cx + 10, cy - 2, chalk, 1, 5);
  px(ctx, cx + 8, cy - 1, chalk, 5, 1);
  px(ctx, cx + 8, cy + 3, chalk, 1, 2);
  px(ctx, cx + 12, cy + 3, chalk, 1, 2);
  ctx.restore();
  drawNoisePixels(ctx, cx - 18, cy - 12, 36, 22, [PALETTE.stoneDust], 0.03, seed);
}

export function drawMachineOil(ctx, cx, cy, seed) {
  ctx.save();
  ctx.globalAlpha = 0.5;
  drawIsoDiamond(ctx, cx, cy, 38, 17, PALETTE.void);
  ctx.globalAlpha = 0.3;
  drawIsoDiamond(ctx, cx + 5, cy + 1, 24, 11, PALETTE.hostBlack);
  ctx.restore();
  for (let i = 0; i < 4; i += 1) {
    px(ctx, cx - 12 + i * 7, cy - 2 + Math.floor(i * 0.6), PALETTE.stoneDark, 4, 2);
  }
  // A shed brass rivet catching what little light there is.
  px(ctx, cx + 9, cy + 2, PALETTE.outline, 4, 3);
  px(ctx, cx + 10, cy + 2, PALETTE.rustLight, 2, 2);
  px(ctx, cx + 10, cy + 2, PALETTE.hostGold, 1, 1);
  drawNoisePixels(ctx, cx - 18, cy - 8, 36, 16, [PALETTE.rustDark, PALETTE.hostBlack], 0.05, seed);
}

export function drawBloodSigil(ctx, cx, cy, seed) {
  const blood = PALETTE.hostRed;
  const dark = PALETTE.rustDark;
  ctx.save();
  ctx.globalAlpha = 0.82;
  for (let n = 0; n < 26; n += 1) {
    const a = (Math.PI * 2 * n) / 26;
    px(ctx, cx + Math.round(Math.cos(a) * 14), cy + Math.round(Math.sin(a) * 7), n % 2 ? blood : dark);
  }
  px(ctx, cx, cy - 7, blood, 1, 16); // upright
  px(ctx, cx - 4, cy + 4, blood, 9, 1); // crossbar set low => inverted
  ctx.restore();
  drawNoisePixels(ctx, cx - 15, cy - 9, 30, 18, [blood, dark], 0.05, seed);
}

export function drawRitualCircle(ctx, cx, cy, seed) {
  const blood = PALETTE.hostRed;
  const dark = PALETTE.rustDark;
  ctx.save();
  ctx.globalAlpha = 0.34;
  drawIsoDiamond(ctx, cx, cy, 70, 35, PALETTE.void);
  ctx.globalAlpha = 0.85;
  for (let n = 0; n < 52; n += 1) {
    const a = (Math.PI * 2 * n) / 52;
    px(ctx, cx + Math.round(Math.cos(a) * 31), cy + Math.round(Math.sin(a) * 15), blood);
    px(ctx, cx + Math.round(Math.cos(a) * 24), cy + Math.round(Math.sin(a) * 12), n % 2 ? dark : blood);
  }
  px(ctx, cx, cy - 12, blood, 2, 26); // upright
  px(ctx, cx - 8, cy + 8, blood, 18, 2); // low crossbar => inverted
  for (const [dx, dy] of [[0, -15], [0, 15], [31, 0], [-31, 0]]) px(ctx, cx + dx, cy + dy, PALETTE.hostBone, 2, 2);
  ctx.restore();
  drawNoisePixels(ctx, cx - 33, cy - 17, 66, 34, [dark, PALETTE.stoneDark], 0.04, seed);
}

export function drawChoirPentagram(ctx, cx, cy, seed) {
  const blood = PALETTE.hostRed;
  const dark = PALETTE.rustDark;
  const gold = PALETTE.hostGold;
  const R = 15;
  const wy = cy - 31; // lift onto the wall behind the cell

  // Rough paint backing so the star sits on a smear, not clean stone.
  ctx.save();
  ctx.globalAlpha = 0.5;
  drawNoisePixels(ctx, cx - R - 4, wy - R - 4, (R + 4) * 2, (R + 4) * 2, [dark, PALETTE.stoneDark], 0.07, seed);
  ctx.restore();

  // The enclosing ring.
  ctx.save();
  ctx.globalAlpha = 0.92;
  for (let n = 0; n < 44; n += 1) {
    const a = (Math.PI * 2 * n) / 44;
    px(ctx, cx + Math.round(Math.cos(a) * (R + 2)), wy + Math.round(Math.sin(a) * (R + 2)), n % 6 === 0 ? gold : blood);
  }

  // Point-down five-point star: pentagon vertices joined every other one.
  const pts = [];
  for (let k = 0; k < 5; k += 1) {
    const a = Math.PI / 2 + (Math.PI * 2 * k) / 5; // a vertex points straight down
    pts.push([cx + Math.cos(a) * R, wy + Math.sin(a) * R]);
  }
  const order = [0, 2, 4, 1, 3, 0];
  ctx.strokeStyle = blood;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(pts[order[0]][0], pts[order[0]][1]);
  for (let i = 1; i < order.length; i += 1) ctx.lineTo(pts[order[i]][0], pts[order[i]][1]);
  ctx.stroke();
  ctx.restore();

  // Black-gold bleed at the points and the heart of the star.
  for (const [px0, py0] of pts) px(ctx, Math.round(px0), Math.round(py0), gold, 2, 2);
  px(ctx, cx, wy, gold, 2, 2);

  // Paint running down the wall in thin drips.
  const rng = rngFrom(hash2D(seed + 5, seed * 3 + 2));
  for (let i = 0; i < 5; i += 1) {
    const dx = Math.round((rng() - 0.5) * R * 2);
    const dl = 3 + Math.floor(rng() * 11);
    px(ctx, cx + dx, wy + R, i % 2 ? blood : dark, 1, dl);
  }
}
