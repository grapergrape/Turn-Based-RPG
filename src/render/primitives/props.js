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
  px(ctx, cx - 14, cy - 25, PALETTE.hostBone, 9, 1);
  px(ctx, cx - 11, cy - 28, PALETTE.hostBone, 2, 7);
  for (const dx of [-14, -7, 8, 15]) px(ctx, cx + dx, cy - 14, PALETTE.rustLight, 2, 2);
  drawNoisePixels(ctx, cx - 19, cy - 32, 40, 31, [PALETTE.rustDark, PALETTE.stoneDark], 0.045, seed);
}

export function drawFieldSatchel(ctx, cx, cy, seed) {
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
  ctx.strokeStyle = PALETTE.clothDark;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - 13, cy - 5);
  ctx.quadraticCurveTo(cx - 1, cy - 21, cx + 14, cy - 6);
  ctx.stroke();
  px(ctx, cx - 1, cy - 10, PALETTE.rustLight, 3, 3);
  px(ctx, cx - 8, cy - 7, PALETTE.stoneDust, 7, 1);
  px(ctx, cx + 6, cy - 3, PALETTE.clothDark, 5, 1);
}

export function drawBlueBall(ctx, cx, cy, seed) {
  drawShadowBlob(ctx, cx, cy + 2, 18, 7);
  px(ctx, cx - 5, cy - 8, PALETTE.outline, 11, 10);
  px(ctx, cx - 4, cy - 9, PALETTE.outline, 9, 12);
  px(ctx, cx - 4, cy - 8, PALETTE.clothBlueDark, 9, 10);
  px(ctx, cx - 3, cy - 9, PALETTE.clothBlue, 7, 2);
  px(ctx, cx - 4, cy - 5, PALETTE.clothBlue, 2, 4);
  px(ctx, cx + 3, cy - 4, PALETTE.void, 1, 4);
  px(ctx, cx - 1, cy - 8, PALETTE.hostBone, 2, 1);
  drawNoisePixels(ctx, cx - 7, cy - 9, 14, 12, [PALETTE.stoneDark, PALETTE.rustDark], 0.04, seed);
}

export function drawQuarantineSign(ctx, cx, cy, seed) {
  drawShadowBlob(ctx, cx, cy + 3, 26, 11);
  // Leaning post.
  ctx.strokeStyle = PALETTE.stoneDark;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cx + 2, cy);
  ctx.lineTo(cx - 4, cy - 38);
  ctx.stroke();
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

  // Three stubby, uneven candles drawn back-to-front. Heights/lit state are
  // seeded so each cluster is distinct but stable frame to frame.
  const candles = [
    { dx: -6, h: 8 + (seed % 4), lit: (seed & 1) === 0 },
    { dx: 1, h: 12 + (seed % 5), lit: true },
    { dx: 7, h: 7 + ((seed >> 2) % 3), lit: (seed & 4) === 0 }
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
    }
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
}

export function drawRubblePile(ctx, cx, cy, seed) {
  drawShadowBlob(ctx, cx, cy + 3, 40, 16);
  const rng = rngFrom(hash2D(seed + 51, seed * 8 + 4));
  // Stacked chunks for volume.
  for (let i = 0; i < 8; i += 1) {
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
  drawNoisePixels(ctx, cx - 22, cy - 4, 44, 14, [PALETTE.stoneDust, PALETTE.stoneDark], 0.05, seed);
}

export function drawRustedCrate(ctx, cx, cy, seed) {
  drawShadowBlob(ctx, cx, cy + 6, 44, 18);
  const left = [
    [cx - 22, cy - 17],
    [cx - 1, cy - 27],
    [cx - 1, cy - 1],
    [cx - 22, cy + 8]
  ];
  const right = [
    [cx - 1, cy - 27],
    [cx + 22, cy - 15],
    [cx + 22, cy + 9],
    [cx - 1, cy - 1]
  ];
  const top = [
    [cx - 22, cy - 17],
    [cx - 1, cy - 29],
    [cx + 22, cy - 15],
    [cx - 1, cy - 4]
  ];
  poly(ctx, PALETTE.outline, [
    [cx - 24, cy - 17],
    [cx - 1, cy - 31],
    [cx + 24, cy - 16],
    [cx + 24, cy + 10],
    [cx - 2, cy + 12],
    [cx - 24, cy + 9]
  ]);
  poly(ctx, PALETTE.woodMid, left);
  poly(ctx, PALETTE.woodDark, right);
  poly(ctx, PALETTE.woodLight, top);

  // Separate boards and nail straps.
  for (const off of [-12, -4, 4, 12]) {
    ctx.strokeStyle = PALETTE.woodDark;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx + off - 13, cy - 18 + Math.floor(off * 0.1));
    ctx.lineTo(cx + off + 10, cy - 5 + Math.floor(off * 0.1));
    ctx.stroke();
  }
  ctx.strokeStyle = PALETTE.rustDark;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cx - 19, cy - 9);
  ctx.lineTo(cx - 1, cy - 18);
  ctx.lineTo(cx + 19, cy - 7);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx - 15, cy + 3);
  ctx.lineTo(cx - 1, cy - 7);
  ctx.lineTo(cx + 17, cy + 3);
  ctx.stroke();
  px(ctx, cx - 15, cy - 14, PALETTE.clothTan, 8, 4);
  px(ctx, cx - 14, cy - 14, PALETTE.stoneDust, 5, 1);
  for (const dx of [-17, -4, 9, 19]) px(ctx, cx + dx, cy - 8, PALETTE.rustLight, 1, 1);
  drawNoisePixels(ctx, cx - 21, cy - 26, 43, 34, [PALETTE.rustDark, PALETTE.stoneDark], 0.035, seed);
}

export function drawPaperScraps(ctx, cx, cy, seed) {
  ctx.save();
  ctx.globalAlpha = 0.9;
  drawIsoDiamond(ctx, cx - 4, cy, 24, 11, PALETTE.clothTan);
  drawIsoDiamond(ctx, cx + 7, cy + 2, 18, 8, PALETTE.stoneDust);
  ctx.restore();
  px(ctx, cx - 11, cy - 3, PALETTE.rustDark, 11, 1);
  px(ctx, cx - 8, cy, PALETTE.rustDark, 8, 1);
  px(ctx, cx + 3, cy + 1, PALETTE.stoneDark, 9, 1);
  drawNoisePixels(ctx, cx - 14, cy - 5, 28, 11, [PALETTE.stoneDust, PALETTE.rustDark], 0.04, seed);
}

export function drawCrackedColumn(ctx, cx, cy, seed) {
  drawShadowBlob(ctx, cx, cy + 5, 36, 15);
  drawIsoPrism(ctx, cx, cy, 34, 20, 9, {
    top: PALETTE.stoneLight,
    left: PALETTE.stoneMid,
    right: PALETTE.stoneDark,
    outline: PALETTE.outline
  });

  // Square shaft assembled from pixel bands to avoid a smooth cylinder.
  const shaftX = cx - 8;
  const shaftTop = cy - 58;
  px(ctx, shaftX, shaftTop, PALETTE.stoneDark, 17, 51);
  px(ctx, shaftX + 1, shaftTop, PALETTE.stoneMid, 14, 51);
  px(ctx, shaftX + 1, shaftTop, PALETTE.stoneDust, 3, 49);
  px(ctx, shaftX + 13, shaftTop + 2, PALETTE.stoneDark, 2, 47);
  drawNoisePixels(ctx, shaftX + 1, shaftTop + 2, 15, 47, [PALETTE.stoneDark, PALETTE.stoneDust], 0.035, seed);
  drawCracks(ctx, cx - 1, cy - 31, seed, 4);

  drawIsoPrism(ctx, cx, cy - 57, 28, 14, 8, {
    top: PALETTE.stoneDust,
    left: PALETTE.stoneMid,
    right: PALETTE.stoneDark,
    outline: PALETTE.outline
  });
  if ((seed & 1) === 0) {
    px(ctx, cx + 6, cy - 53, PALETTE.void, 7, 5);
    px(ctx, cx + 5, cy - 52, PALETTE.stoneDark, 5, 4);
  }
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
  drawIsoPrism(ctx, cx, cy, 30, 16, 12, { top: dust, left: stone, right: lo, outline: PALETTE.outline });
  const plinthTop = cy - 12;
  const shoulderY = plinthTop - 34; // top of the shoulders (the head is struck off above)

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
  px(ctx, cx + 12, cy - 3, PALETTE.void, 3, 2);
  drawNoisePixels(ctx, cx - 10, shoulderY, 20, plinthTop - shoulderY, [lo, stone], 0.04, seed);
}

export function drawChapelFont(ctx, cx, cy, seed, opts = {}) {
  const dim = Boolean(opts.dim);
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
  px(ctx, cx - 2, cy - 13, lo, 1, 11);
  drawNoisePixels(ctx, cx - 13, by - 5, 27, 16, [lo, dust], 0.04, seed);
}

export function drawQuarantineBarricade(ctx, cx, cy, seed) {
  drawShadowBlob(ctx, cx, cy + 5, 52, 18);
  const rng = rngFrom(hash2D(seed + 67, seed * 5 + 11));
  for (let i = 0; i < 3; i += 1) {
    const dy = i * 5;
    drawIsoPrism(ctx, cx, cy - 5 + dy, 50, 9, 7, {
      top: i === 1 ? PALETTE.rustMid : PALETTE.woodLight,
      left: PALETTE.woodMid,
      right: PALETTE.woodDark,
      outline: PALETTE.outline
    });
  }
  px(ctx, cx - 20, cy - 25, PALETTE.stoneDark, 4, 26);
  px(ctx, cx + 17, cy - 24, PALETTE.stoneDark, 4, 25);
  for (let i = 0; i < 5; i += 1) {
    const sx = cx - 18 + i * 9;
    const mark = rng() < 0.5 ? PALETTE.clothTan : PALETTE.hostRed;
    px(ctx, sx, cy - 17, mark, 5, 2);
  }
}

export function drawCampfire(ctx, cx, cy, seed, flicker = 0) {
  drawWarmLightPool(ctx, cx, cy, seed, flicker);
  drawShadowBlob(ctx, cx, cy + 4, 42, 16);
  const rng = rngFrom(hash2D(seed + 73, seed * 3 + 19));
  for (let i = 0; i < 5; i += 1) {
    const dx = -14 + i * 7 + Math.floor((rng() - 0.5) * 3);
    drawIsoPrism(ctx, cx + dx, cy + 3, 16, 6, 5, {
      top: PALETTE.woodLight,
      left: PALETTE.woodMid,
      right: PALETTE.woodDark,
      outline: PALETTE.outline
    });
  }
  const flame = flicker ? PALETTE.flash : PALETTE.ember;
  px(ctx, cx - 3, cy - 10, PALETTE.rustDark, 9, 13);
  px(ctx, cx - 2, cy - 13, flame, 5, 12);
  px(ctx, cx, cy - 16, PALETTE.hostGold, 3, 7);
  if (flicker) px(ctx, cx + 3, cy - 17, PALETTE.flash, 2, 3);
  drawNoisePixels(ctx, cx - 22, cy - 8, 44, 16, [PALETTE.stoneDark, PALETTE.rustDark], 0.08, seed);
}

export function drawChapelBanner(ctx, cx, cy, seed) {
  drawShadowBlob(ctx, cx, cy + 5, 28, 12);
  px(ctx, cx - 2, cy - 62, PALETTE.stoneDark, 4, 62);
  px(ctx, cx - 1, cy - 62, PALETTE.stoneDust, 1, 58);
  const phase = seed & 1;
  px(ctx, cx + 2, cy - 58, PALETTE.clothDark, 21, 43);
  px(ctx, cx + 3, cy - 58, PALETTE.clothRed, 17, 36);
  drawDitherRect(ctx, cx + 5, cy - 52, 12, 26, PALETTE.hostRed, null, phase);
  // An inverted cross stitched in bone-thread: upright with a low crossbar.
  px(ctx, cx + 10, cy - 53, PALETTE.hostBone, 2, 24);
  px(ctx, cx + 6, cy - 37, PALETTE.hostBone, 10, 2);
  px(ctx, cx + 3, cy - 22, PALETTE.void, 7, 7);
  px(ctx, cx + 13, cy - 18, PALETTE.void, 6, 5);
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
  linePx(ctx, cx - 28, cy - 60, cx + 24, cy - 15, PALETTE.outline, 4);
  linePx(ctx, cx - 27, cy - 60, cx + 22, cy - 16, PALETTE.woodDark, 2);

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

  // Jagged crack, missing clapper, and wooden wedge jammed under the crown.
  linePx(ctx, cx + 5, cy - 49, cx - 1, cy - 39, PALETTE.void, 2);
  linePx(ctx, cx - 1, cy - 39, cx + 8, cy - 31, PALETTE.void, 2);
  linePx(ctx, cx + 8, cy - 31, cx + 2, cy - 22, PALETTE.void, 2);
  px(ctx, cx + 1, cy - 40, PALETTE.hostGold, 2, 1);
  px(ctx, cx - 11, cy - 60, PALETTE.woodDark, 22, 5);
  px(ctx, cx - 9, cy - 59, PALETTE.woodMid, 17, 2);
  px(ctx, cx - 4, cy - 24, PALETTE.outline, 9, 5);
  px(ctx, cx - 2, cy - 23, PALETTE.rustDark, 5, 3);

  for (let i = 0; i < 11; i += 1) {
    px(ctx, cx - 28 + Math.floor(rng() * 56), cy - 52 + Math.floor(rng() * 36), rng() < 0.5 ? PALETTE.rustDark : PALETTE.stoneDark, 1, 1);
  }
  drawNoisePixels(ctx, cx - 30, cy - 56, 60, 39, [PALETTE.rustDark, PALETTE.stoneDark], 0.045, seed);
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

  const ropeX = cx + sway;
  const ropeTop = cy - 84;
  const ropeBot = cy - 14;
  px(ctx, ropeX - 2, ropeTop, PALETTE.woodDark, 5, ropeBot - ropeTop);
  px(ctx, ropeX - 1, ropeTop + 1, PALETTE.clothTan, 1, ropeBot - ropeTop - 5);
  for (let y = ropeTop + 5, i = 0; y < ropeBot - 2; y += 8, i += 1) {
    px(ctx, ropeX - 3, y, PALETTE.woodMid, 2, 3);
    px(ctx, ropeX + 2 + (i % 2), y + 3, PALETTE.woodMid, 2, 3);
  }

  if (repaired) {
    px(ctx, ropeX - 5, cy - 19, PALETTE.outline, 11, 8);
    px(ctx, ropeX - 4, cy - 18, PALETTE.woodDark, 9, 5);
    px(ctx, ropeX - 2, cy - 17, PALETTE.clothTan, 4, 3);
    px(ctx, ropeX - 7, cy - 9, PALETTE.outline, 15, 5);
    px(ctx, ropeX - 5, cy - 8, PALETTE.clothTan, 10, 2);
    px(ctx, ropeX + 3, cy - 83, PALETTE.hostGold, 4, 3);
  } else {
    px(ctx, ropeX - 7, cy - 20, PALETTE.outline, 13, 7);
    px(ctx, ropeX - 5, cy - 19, PALETTE.woodDark, 9, 4);
    for (const fray of [-6, -2, 3, 6]) {
      linePx(ctx, ropeX + fray, cy - 14, ropeX + fray + Math.sign(fray || 1) * 4, cy - 7, PALETTE.clothTan, 1);
      px(ctx, ropeX + fray, cy - 14, PALETTE.woodDark, 1, 5);
    }
    px(ctx, ropeX - 10, cy - 87, PALETTE.woodDark, 21, 4);
    px(ctx, ropeX - 8, cy - 86, PALETTE.woodMid, 15, 1);
  }
  drawNoisePixels(ctx, cx - 14, cy - 21, 28, 19, [PALETTE.stoneDark, PALETTE.woodDark], 0.05, seed);
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
  ctx.globalAlpha = 0.4;
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
  ctx.restore();
}

export function drawFarmFence(ctx, cx, cy, seed, opts = {}) {
  const frame = isoFrame(cx, cy, opts.orient ?? 'se');
  const a = frame.point(-0.42, 0, 0);
  const b = frame.point(0.42, 0, 0);
  const posts = [a, b];
  drawShadowBlob(ctx, cx, cy + 2, 42, 10);
  for (const p of posts) {
    px(ctx, p[0] - 3, p[1] - 24, PALETTE.outline, 7, 27);
    px(ctx, p[0] - 2, p[1] - 23, PALETTE.woodDark, 5, 24);
    px(ctx, p[0] - 2, p[1] - 23, PALETTE.woodMid, 2, 21);
    px(ctx, p[0] - 2, p[1] - 28, PALETTE.outline, 7, 6);
    px(ctx, p[0] - 1, p[1] - 27, PALETTE.stoneDust, 5, 3);
  }
  for (const lift of [12, 20]) {
    linePx(ctx, a[0], a[1] - lift, b[0], b[1] - lift + ((seed + lift) & 1), PALETTE.outline, 5);
    linePx(ctx, a[0], a[1] - lift - 1, b[0], b[1] - lift - 1 + ((seed + lift) & 1), PALETTE.woodMid, 2);
    linePx(ctx, a[0], a[1] - lift + 1, b[0], b[1] - lift + 1 + ((seed + lift) & 1), PALETTE.woodDark, 1);
  }
  if ((seed & 3) === 0) {
    linePx(ctx, cx - 8, cy - 5, cx + 7, cy - 28, PALETTE.outline, 3);
    linePx(ctx, cx - 7, cy - 6, cx + 6, cy - 27, PALETTE.woodDark, 1);
  }
}

export function drawFarmBuildingBlock(ctx, cx, cy, seed, opts = {}) {
  const connected = opts.connected ?? {};
  const wallH = 44;
  const roofLift = wallH + 12;
  const base = diamond(cx, cy, TILE_WIDTH, TILE_HEIGHT);
  const wallTop = diamond(cx, cy - wallH, TILE_WIDTH, TILE_HEIGHT);
  const roof = diamond(cx, cy - roofLift, TILE_WIDTH + 14, TILE_HEIGHT + 10);
  const roofCenter = [cx, cy - roofLift];

  drawShadowBlob(ctx, cx, cy + 5, 66, 22);

  const drawFaceDetail = (face, salt) => {
    const h = hash2D(seed + salt, seed * 5 + salt);
    if (h % 7 === 0) {
      face.rect(0.34, 0.28, 0.78, 0.58, PALETTE.outline);
      face.rect(0.38, 0.31, 0.74, 0.55, PALETTE.woodDark);
      face.line(0.4, 0.33, 0.72, 0.33, PALETTE.woodMid, 1);
      face.line(0.4, 0.44, 0.72, 0.44, PALETTE.outline, 1);
      face.line(0.44, 0.32, 0.65, 0.55, PALETTE.woodLight, 1);
      face.line(0.66, 0.32, 0.45, 0.55, PALETTE.woodDark, 1);
      return;
    }
    if (h % 3 === 0) {
      face.rect(0.32, 0.28, 0.64, 0.5, PALETTE.outline);
      face.rect(0.37, 0.32, 0.59, 0.46, PALETTE.void);
      face.line(0.37, 0.33, 0.59, 0.33, PALETTE.stoneDust, 1);
      face.line(0.48, 0.33, 0.48, 0.46, PALETTE.woodDark, 1);
      return;
    }
    if (h % 5 === 0) {
      face.line(0.2, 0.2, 0.76, 0.76, PALETTE.outline, 2);
      face.line(0.22, 0.22, 0.74, 0.74, PALETTE.woodDark, 1);
    }
  };

  if (!connected.yPlus) {
    poly(ctx, PALETTE.woodMid, [wallTop.left, wallTop.bottom, base.bottom, base.left]);
    const face = faceTools(ctx, wallTop.left, wallTop.bottom, base.bottom, base.left);
    for (const u of [0.18, 0.36, 0.55, 0.74, 0.9]) face.line(u, 0.06, u, 0.97, PALETTE.woodDark, 1);
    face.line(0.04, 0.22, 0.94, 0.22, PALETTE.woodLight, 1);
    face.line(0.04, 0.52, 0.94, 0.52, PALETTE.woodDark, 1);
    face.line(0.04, 0.78, 0.94, 0.78, PALETTE.woodDark, 1);
    drawFaceDetail(face, 31);
  }

  if (!connected.xPlus) {
    poly(ctx, PALETTE.woodDark, [wallTop.bottom, wallTop.right, base.right, base.bottom]);
    const face = faceTools(ctx, wallTop.bottom, wallTop.right, base.right, base.bottom);
    for (const u of [0.2, 0.4, 0.6, 0.8]) face.line(u, 0.08, u, 0.96, PALETTE.stoneDark, 1);
    face.line(0.07, 0.24, 0.91, 0.24, PALETTE.woodMid, 1);
    face.line(0.07, 0.55, 0.91, 0.55, PALETTE.outline, 1);
    face.line(0.07, 0.8, 0.91, 0.8, PALETTE.outline, 1);
    drawFaceDetail(face, 43);
  }

  // Shared roof edges are omitted so connected `B` cells read as one farmhouse
  // or barn footprint. The roof is mostly a single hard-pixel surface; the
  // exposed eaves and sparse shingle bands carry the form without making a grid.
  poly(ctx, PALETTE.rustMid, [roof.top, roof.right, roof.bottom, roof.left]);

  const shadeA = mixPoint(roof.top, roof.right, 0.78);
  const shadeB = mixPoint(roof.bottom, roof.right, 0.78);
  const shadeC = mixPoint(roof.bottom, roof.left, 0.16);
  if (!connected.xPlus || !connected.yPlus) {
    poly(ctx, PALETTE.rustDark, [shadeA, roof.right, roof.bottom, shadeC]);
    linePx(ctx, shadeA[0], shadeA[1], shadeB[0], shadeB[1], PALETTE.woodDark, 1);
  }

  for (const t of [0.28, 0.5, 0.72]) {
    const a = mixPoint(roof.left, roof.top, t);
    const b = mixPoint(roof.bottom, roof.right, t);
    linePx(ctx, a[0], a[1], b[0], b[1], (seed + Math.floor(t * 100)) & 1 ? PALETTE.woodDark : PALETTE.rustLight, 1);
  }
  for (const t of [0.36, 0.64]) {
    const a = mixPoint(roof.top, roof.right, t);
    const b = mixPoint(roof.left, roof.bottom, t);
    linePx(ctx, a[0], a[1], b[0], b[1], PALETTE.rustDark, 1);
  }

  if (!connected.yMinus) {
    linePx(ctx, roof.top[0], roof.top[1], roof.left[0], roof.left[1], PALETTE.outline, 2);
    linePx(ctx, roof.top[0] - 1, roof.top[1], roof.left[0] - 1, roof.left[1], PALETTE.rustLight, 1);
  }
  if (!connected.xMinus) {
    linePx(ctx, roof.top[0], roof.top[1], roof.right[0], roof.right[1], PALETTE.outline, 2);
    linePx(ctx, roof.top[0] + 1, roof.top[1], roof.right[0] + 1, roof.right[1], PALETTE.rustLight, 1);
  }
  if (!connected.yPlus) {
    linePx(ctx, roof.left[0], roof.left[1], roof.bottom[0], roof.bottom[1], PALETTE.outline, 2);
    linePx(ctx, roof.left[0], roof.left[1] + 2, roof.bottom[0], roof.bottom[1] + 2, PALETTE.woodDark, 2);
  }
  if (!connected.xPlus) {
    linePx(ctx, roof.bottom[0], roof.bottom[1], roof.right[0], roof.right[1], PALETTE.outline, 2);
    linePx(ctx, roof.bottom[0], roof.bottom[1] + 2, roof.right[0], roof.right[1] + 2, PALETTE.woodDark, 2);
  }

  for (const off of [-22, -9, 5, 18]) {
    const jitter = ((seed + off) & 3) - 1;
    px(ctx, cx + off, cy - roofLift - 2 + jitter, PALETTE.rustLight, 5, 1);
    px(ctx, cx + off + 2, cy - roofLift + 7 + jitter, PALETTE.woodDark, 7, 1);
  }
  drawNoisePixels(ctx, cx - 33, cy - roofLift - 14, 66, 36, [PALETTE.rustDark, PALETTE.woodDark], 0.018, seed);

  if (!connected.xMinus && !connected.yMinus && (seed % 3) === 0) {
    px(ctx, cx - 7, cy - roofLift - 30, PALETTE.outline, 12, 19);
    px(ctx, cx - 5, cy - roofLift - 29, PALETTE.stoneDark, 8, 17);
    px(ctx, cx - 5, cy - roofLift - 29, PALETTE.stoneDust, 2, 15);
    px(ctx, cx - 8, cy - roofLift - 32, PALETTE.outline, 14, 4);
    px(ctx, cx - 6, cy - roofLift - 31, PALETTE.rustDark, 10, 2);
  }
}

function drawFarmWallDoor(ctx, cx, cy, seed, opts = {}) {
  const locked = Boolean(opts.locked);
  const unlocked = Boolean(opts.unlocked || opts.revealed);
  const wallPlane = opts.wallPlane === 'se' ? 'se' : 'sw';
  const wallFace = wallRunFace(ctx, cx, cy, { plane: wallPlane, side: 'near', span: 1 });
  const u0 = 0.18;
  const u1 = 0.82;
  const v0 = 0.32;
  const v1 = 0.985;
  const face = faceTools(
    ctx,
    wallFace.point(u0, v0),
    wallFace.point(u1, v0),
    wallFace.point(u1, v1),
    wallFace.point(u0, v1)
  );

  face.rect(0, 0, 1, 1, PALETTE.outline);
  face.rect(0.045, 0.045, 0.955, 0.97, PALETTE.void);
  face.rect(0.09, 0.08, 0.91, 0.94, PALETTE.woodDark);
  face.rect(0.14, 0.1, 0.86, 0.91, PALETTE.woodMid);
  face.rect(0.58, 0.1, 0.86, 0.91, PALETTE.woodDark);
  face.line(0.04, 0.035, 0.96, 0.035, PALETTE.woodLight, 2);
  face.line(0.04, 0.97, 0.96, 0.97, PALETTE.outline, 3);
  face.line(0.06, 0.07, 0.06, 0.94, PALETTE.woodLight, 1);
  face.line(0.94, 0.07, 0.94, 0.94, PALETTE.outline, 2);

  for (const u of [0.27, 0.43, 0.59, 0.75]) {
    face.line(u, 0.12, u, 0.89, PALETTE.outline, 1);
    face.line(u + 0.025, 0.13, u + 0.025, 0.88, PALETTE.woodDark, 1);
  }
  for (const v of [0.28, 0.62]) {
    face.line(0.1, v, 0.9, v, PALETTE.outline, 3);
    face.line(0.14, v - 0.02, 0.86, v - 0.02, PALETTE.woodLight, 1);
    face.line(0.14, v + 0.03, 0.86, v + 0.03, PALETTE.woodDark, 1);
  }
  face.line(0.13, 0.19, 0.87, 0.48, PALETTE.outline, 3);
  face.line(0.16, 0.2, 0.84, 0.47, PALETTE.woodDark, 1);
  face.line(0.87, 0.54, 0.13, 0.82, PALETTE.outline, 3);
  face.line(0.84, 0.55, 0.16, 0.81, PALETTE.woodDark, 1);

  const pull = face.point(0.78, 0.54);
  px(ctx, pull[0] - 4, pull[1] - 3, PALETTE.outline, 8, 6);
  px(ctx, pull[0] - 3, pull[1] - 2, locked && !unlocked ? PALETTE.rustDark : PALETTE.rustLight, 6, 4);
  px(ctx, pull[0], pull[1] - 1, PALETTE.hostGold, 2, 2);

  if (locked && !unlocked) {
    face.line(0.59, 0.56, 0.89, 0.56, PALETTE.outline, 3);
    face.line(0.6, 0.54, 0.88, 0.54, PALETTE.stoneDust, 1);
    const lock = face.point(0.72, 0.66);
    px(ctx, lock[0] - 6, lock[1] - 4, PALETTE.outline, 12, 9);
    px(ctx, lock[0] - 4, lock[1] - 3, PALETTE.rustDark, 8, 6);
    px(ctx, lock[0] - 1, lock[1] - 2, PALETTE.rustLight, 3, 2);
  } else if (unlocked) {
    face.line(0.9, 0.16, 0.9, 0.87, PALETTE.void, 2);
    face.line(0.87, 0.19, 0.87, 0.84, PALETTE.stoneDark, 1);
  }

  const sillA = wallFace.point(u0 - 0.08, 1);
  const sillB = wallFace.point(u1 + 0.08, 1);
  linePx(ctx, sillA[0], sillA[1], sillB[0], sillB[1], PALETTE.outline, 3);
  linePx(ctx, sillA[0], sillA[1] - 1, sillB[0], sillB[1] - 1, PALETTE.stoneDark, 1);
  drawNoisePixels(ctx, Math.min(sillA[0], sillB[0]) - 3, Math.min(sillA[1], sillB[1]) - 47, Math.abs(sillB[0] - sillA[0]) + 6, 48, [PALETTE.woodDark, PALETTE.rustDark], 0.018, seed);
}

export function drawFarmDoor(ctx, cx, cy, seed, opts = {}) {
  if (opts.wallPlane === 'se' || opts.wallPlane === 'sw') {
    drawFarmWallDoor(ctx, cx, cy, seed, opts);
    return;
  }

  const locked = Boolean(opts.locked);
  const unlocked = Boolean(opts.unlocked || opts.revealed);
  const lean = (seed & 1) ? 1 : -1;
  const left = cx - 18 + lean;
  const right = cx + 17 + lean;
  const top = cy - 63;
  const bottom = cy + 2;

  drawShadowBlob(ctx, cx, cy + 4, 42, 14);
  drawIsoDiamond(ctx, cx, cy + 2, 36, 12, PALETTE.outline);
  drawIsoDiamond(ctx, cx, cy, 31, 9, PALETTE.stoneDark);

  px(ctx, left - 3, top - 3, PALETTE.outline, right - left + 6, bottom - top + 7);
  px(ctx, left, top, PALETTE.woodMid, right - left + 1, bottom - top + 1);
  px(ctx, cx + 1 + lean, top, PALETTE.woodDark, right - cx - lean, bottom - top + 1);
  px(ctx, left + 2, top + 2, PALETTE.woodLight, 4, bottom - top - 2);

  for (const x of [left + 8, left + 16, left + 24]) {
    px(ctx, x, top + 3, PALETTE.outline, 2, bottom - top - 4);
    px(ctx, x + 1, top + 4, PALETTE.woodDark, 1, bottom - top - 6);
  }
  for (const y of [top + 16, top + 40]) {
    px(ctx, left - 1, y, PALETTE.outline, right - left + 3, 4);
    px(ctx, left + 1, y + 1, PALETTE.woodDark, right - left - 1, 1);
    px(ctx, left + 1, y + 2, PALETTE.woodLight, Math.max(4, right - left - 16), 1);
  }
  linePx(ctx, left + 2, top + 10, right - 4, top + 29, PALETTE.outline, 3);
  linePx(ctx, left + 4, top + 11, right - 6, top + 28, PALETTE.woodDark, 1);
  linePx(ctx, right - 4, top + 34, left + 4, top + 55, PALETTE.outline, 3);
  linePx(ctx, right - 6, top + 35, left + 6, top + 54, PALETTE.woodDark, 1);

  for (const y of [top + 12, top + 47]) {
    px(ctx, left - 6, y, PALETTE.outline, 8, 7);
    px(ctx, left - 5, y + 1, PALETTE.rustDark, 5, 4);
  }

  px(ctx, right - 9, top + 35, PALETTE.outline, 9, 8);
  px(ctx, right - 8, top + 36, locked && !unlocked ? PALETTE.rustDark : PALETTE.rustLight, 6, 5);
  px(ctx, right - 6, top + 38, PALETTE.hostGold, 2, 2);
  if (locked && !unlocked) {
    linePx(ctx, right - 14, top + 38, right - 3, top + 38, PALETTE.outline, 3);
    linePx(ctx, right - 13, top + 37, right - 4, top + 37, PALETTE.stoneDust, 1);
    px(ctx, right - 12, top + 41, PALETTE.outline, 16, 11);
    px(ctx, right - 10, top + 42, PALETTE.rustDark, 12, 7);
    px(ctx, right - 7, top + 43, PALETTE.rustLight, 4, 2);
  } else if (unlocked) {
    px(ctx, right - 5, top + 42, PALETTE.void, 2, 13);
    px(ctx, right - 3, top + 43, PALETTE.stoneDark, 2, 11);
  }

  drawNoisePixels(ctx, left, top, right - left, bottom - top, [PALETTE.woodDark, PALETTE.rustDark], 0.025, seed);
}

function drawFarmWheel(ctx, cx, cy, radius = 7, opts = {}) {
  const rows = radius >= 9
    ? [
      [-9, 7], [-8, 11], [-7, 15], [-6, 17], [-5, 19], [-4, 21], [-3, 21],
      [-2, 21], [-1, 21], [0, 21], [1, 21], [2, 21], [3, 19], [4, 17],
      [5, 15], [6, 11], [7, 7], [8, 5]
    ]
    : radius >= 7
    ? [
      [-7, 5], [-6, 9], [-5, 13], [-4, 15], [-3, 17], [-2, 17], [-1, 17],
      [0, 17], [1, 17], [2, 15], [3, 15], [4, 13], [5, 9], [6, 5]
    ]
    : [
      [-5, 4], [-4, 8], [-3, 11], [-2, 13], [-1, 13],
      [0, 13], [1, 11], [2, 11], [3, 8], [4, 4]
    ];
  const rim = opts.rim ?? PALETTE.rustDark;
  const lit = opts.lit ?? PALETTE.rustLight;
  const shade = opts.shade ?? PALETTE.woodDark;
  const hub = opts.hub ?? PALETTE.woodMid;

  for (const [dy, w] of rows) {
    const left = cx - Math.floor(w / 2);
    px(ctx, left, cy + dy, PALETTE.outline, w, 1);
    if (w > 5) {
      const fill = dy < -3 ? lit : dy > 2 ? shade : rim;
      px(ctx, left + 1, cy + dy, fill, w - 2, 1);
    }
  }

  const spoke = Math.max(4, radius - 2);
  for (const [sx, sy] of [[-spoke, -spoke + 1], [spoke, -spoke + 1], [-spoke, spoke - 1], [spoke, spoke - 1]]) {
    linePx(ctx, cx, cy, cx + sx, cy + sy, PALETTE.outline, 2);
    linePx(ctx, cx, cy, cx + sx, cy + sy, hub, 1);
  }
  px(ctx, cx - 4, cy - 4, PALETTE.outline, 8, 8);
  px(ctx, cx - 2, cy - 2, hub, 4, 4);
  px(ctx, cx - 1, cy - 1, PALETTE.void, 2, 2);
}

export function drawFieldCart(ctx, cx, cy, seed, opts = {}) {
  const frame = isoFrame(cx, cy, opts.orient ?? 'se');
  drawShadowBlob(ctx, cx, cy + 5, 54, 18);
  const box = orientedBox(ctx, frame, 0.68, 0.36, 12, {
    top: PALETTE.woodLight,
    lit: PALETTE.woodMid,
    shade: PALETTE.woodDark,
    outline: PALETTE.outline
  });
  for (const lb of [-0.18, 0.02, 0.2]) {
    const a = frame.point(-0.34, lb, 18);
    const b = frame.point(0.34, lb, 18);
    linePx(ctx, a[0], a[1], b[0], b[1], PALETTE.outline, 2);
    linePx(ctx, a[0], a[1] - 1, b[0], b[1] - 1, lb < 0 ? PALETTE.woodLight : PALETTE.woodDark, 1);
  }
  for (const la of [-0.27, 0, 0.27]) {
    const top = frame.point(la, -0.2, 22);
    const bot = frame.point(la, 0.2, 11);
    linePx(ctx, top[0], top[1], bot[0], bot[1], PALETTE.outline, 2);
    linePx(ctx, top[0], top[1], bot[0], bot[1], PALETTE.woodMid, 1);
  }
  const leftWheel = frame.point(-0.34, 0.24, 1);
  const rightWheel = frame.point(0.34, 0.24, 1);
  const axleA = frame.point(-0.45, 0.24, 7);
  const axleB = frame.point(0.45, 0.24, 7);
  linePx(ctx, axleA[0], axleA[1], axleB[0], axleB[1], PALETTE.outline, 4);
  linePx(ctx, axleA[0], axleA[1] - 1, axleB[0], axleB[1] - 1, PALETTE.woodDark, 2);
  drawFarmWheel(ctx, leftWheel[0], leftWheel[1] - 2, 8);
  drawFarmWheel(ctx, rightWheel[0], rightWheel[1] - 2, 8);
  const tongueA = frame.point(0.42, -0.12, 8);
  const tongueB = frame.point(0.78, -0.12, 2);
  linePx(ctx, tongueA[0], tongueA[1], tongueB[0], tongueB[1], PALETTE.outline, 4);
  linePx(ctx, tongueA[0], tongueA[1], tongueB[0], tongueB[1], PALETTE.woodMid, 2);
  const towRing = frame.point(0.84, -0.12, 2);
  drawFarmWheel(ctx, towRing[0], towRing[1], 5, {
    rim: PALETTE.woodDark,
    lit: PALETTE.woodMid,
    shade: PALETTE.outline,
    hub: PALETTE.rustDark
  });
  px(ctx, box.cap.left[0] + 2, box.cap.left[1] - 1, PALETTE.stoneDust, 18, 2);
  drawNoisePixels(ctx, cx - 22, cy - 18, 44, 26, [PALETTE.rustDark, PALETTE.stoneDark], 0.035, seed);
}

export function drawHayRick(ctx, cx, cy, seed) {
  const rng = rngFrom(hash2D(seed + 83, seed * 5 + 21));
  drawShadowBlob(ctx, cx, cy + 4, 42, 15);
  for (let row = 0; row < 18; row += 1) {
    const t = row / 17;
    const half = Math.round(7 + Math.sin(t * Math.PI) * 16);
    const y = cy - 18 + row;
    px(ctx, cx - half - 1, y, PALETTE.outline, half * 2 + 2, 1);
    px(ctx, cx - half, y, row < 4 ? PALETTE.hostBone : PALETTE.clothTan, half, 1);
    px(ctx, cx, y, row < 5 ? PALETTE.clothTan : PALETTE.hostGold, half, 1);
    if (row % 4 === 0) px(ctx, cx - half + 3, y, PALETTE.woodDark, Math.max(3, half * 2 - 6), 1);
  }
  for (let i = 0; i < 10; i += 1) {
    const x = cx - 18 + Math.floor(rng() * 37);
    const y = cy - 17 + Math.floor(rng() * 19);
    px(ctx, x, y, rng() < 0.5 ? PALETTE.woodDark : PALETTE.stoneDust, 2, 1);
  }
}

export function drawFieldPlow(ctx, cx, cy, seed, opts = {}) {
  const frame = isoFrame(cx, cy, opts.orient ?? 'se');
  drawShadowBlob(ctx, cx, cy + 4, 54, 16);
  const beamA = frame.point(-0.48, -0.02, 8);
  const beamB = frame.point(0.48, -0.02, 5);
  linePx(ctx, beamA[0], beamA[1], beamB[0], beamB[1], PALETTE.outline, 4);
  linePx(ctx, beamA[0], beamA[1] - 1, beamB[0], beamB[1] - 1, PALETTE.woodMid, 2);
  const braceA = frame.point(-0.22, -0.16, 14);
  const braceB = frame.point(0.18, 0.12, 5);
  linePx(ctx, braceA[0], braceA[1], braceB[0], braceB[1], PALETTE.outline, 3);
  linePx(ctx, braceA[0], braceA[1] - 1, braceB[0], braceB[1] - 1, PALETTE.woodDark, 1);

  const handleL = frame.point(-0.62, -0.19, 31);
  const handleR = frame.point(-0.58, 0.16, 27);
  for (const handle of [handleL, handleR]) {
    linePx(ctx, beamA[0], beamA[1], handle[0], handle[1], PALETTE.outline, 3);
    linePx(ctx, beamA[0], beamA[1] - 1, handle[0], handle[1], PALETTE.woodDark, 1);
    px(ctx, handle[0] - 5, handle[1] - 2, PALETTE.woodLight, 11, 2);
  }

  const blade = frame.point(0.18, 0.12, 4);
  poly(ctx, PALETTE.outline, [
    [blade[0] - 15, blade[1] - 6],
    [blade[0] + 14, blade[1] - 2],
    [blade[0] + 5, blade[1] + 12],
    [blade[0] - 12, blade[1] + 10]
  ]);
  poly(ctx, PALETTE.rustLight, [
    [blade[0] - 12, blade[1] - 4],
    [blade[0] + 9, blade[1] - 1],
    [blade[0] + 2, blade[1] + 5],
    [blade[0] - 10, blade[1] + 6]
  ]);
  poly(ctx, PALETTE.rustDark, [
    [blade[0] + 2, blade[1] + 4],
    [blade[0] + 10, blade[1] - 1],
    [blade[0] + 4, blade[1] + 10],
    [blade[0] - 4, blade[1] + 8]
  ]);
  linePx(ctx, blade[0] - 10, blade[1] - 4, blade[0] + 8, blade[1] - 1, PALETTE.stoneDust, 1);

  const wheel = frame.point(0.42, 0.12, 3);
  const axle = frame.point(0.28, 0.06, 7);
  linePx(ctx, axle[0], axle[1], wheel[0], wheel[1] - 1, PALETTE.outline, 3);
  linePx(ctx, axle[0], axle[1] - 1, wheel[0], wheel[1] - 2, PALETTE.rustDark, 1);
  drawFarmWheel(ctx, wheel[0], wheel[1] - 3, 7, {
    rim: PALETTE.rustDark,
    lit: PALETTE.stoneDust,
    shade: PALETTE.woodDark,
    hub: PALETTE.rustLight
  });
  const cutterTop = frame.point(0.03, -0.1, 19);
  const cutterBot = frame.point(0.08, -0.02, 3);
  linePx(ctx, cutterTop[0], cutterTop[1], cutterBot[0], cutterBot[1], PALETTE.outline, 3);
  linePx(ctx, cutterTop[0], cutterTop[1], cutterBot[0], cutterBot[1], PALETTE.rustLight, 1);
  drawNoisePixels(ctx, cx - 22, cy - 18, 44, 24, [PALETTE.rustDark, PALETTE.stoneDark], 0.04, seed);
}

export function drawFieldHarrow(ctx, cx, cy, seed, opts = {}) {
  const frame = isoFrame(cx, cy, opts.orient ?? 'se');
  drawShadowBlob(ctx, cx, cy + 4, 58, 17);
  const ha = 0.5;
  const hb = 0.28;
  const corners = [
    frame.point(-ha, -hb, 8),
    frame.point(ha, -hb, 8),
    frame.point(ha, hb, 8),
    frame.point(-ha, hb, 8)
  ];
  for (let i = 0; i < corners.length; i += 1) {
    const a = corners[i];
    const b = corners[(i + 1) % corners.length];
    linePx(ctx, a[0], a[1], b[0], b[1], PALETTE.outline, 3);
    linePx(ctx, a[0], a[1] - 1, b[0], b[1] - 1, PALETTE.woodMid, 1);
  }
  linePx(ctx, corners[0][0], corners[0][1], corners[2][0], corners[2][1], PALETTE.outline, 3);
  linePx(ctx, corners[0][0], corners[0][1] - 1, corners[2][0], corners[2][1] - 1, PALETTE.woodDark, 1);
  linePx(ctx, corners[1][0], corners[1][1], corners[3][0], corners[3][1], PALETTE.outline, 3);
  linePx(ctx, corners[1][0], corners[1][1] - 1, corners[3][0], corners[3][1] - 1, PALETTE.woodDark, 1);
  for (const la of [-0.3, -0.1, 0.1, 0.3]) {
    const a = frame.point(la, -hb, 9);
    const b = frame.point(la, hb, 9);
    linePx(ctx, a[0], a[1], b[0], b[1], PALETTE.woodDark, 2);
  }
  for (const lb of [-0.12, 0.08, 0.24]) {
    const a = frame.point(-ha, lb, 10);
    const b = frame.point(ha, lb, 10);
    linePx(ctx, a[0], a[1], b[0], b[1], PALETTE.woodDark, 2);
  }
  for (const lb of [-0.14, 0.06, 0.22]) {
    for (const la of [-0.36, -0.12, 0.12, 0.36]) {
      const p = frame.point(la, lb, 7);
      px(ctx, p[0] - 2, p[1] - 1, PALETTE.outline, 4, 11);
      px(ctx, p[0] - 1, p[1], PALETTE.rustMid, 2, 8);
      px(ctx, p[0], p[1] + 7, PALETTE.rustDark, 2, 3);
    }
  }
  const tongueA = frame.point(0.5, 0, 8);
  const tongueB = frame.point(0.8, 0, 4);
  linePx(ctx, tongueA[0], tongueA[1], tongueB[0], tongueB[1], PALETTE.outline, 3);
  linePx(ctx, tongueA[0], tongueA[1] - 1, tongueB[0], tongueB[1] - 1, PALETTE.woodDark, 1);
  const wheelA = frame.point(-0.45, 0.3, 3);
  const wheelB = frame.point(0.45, 0.3, 3);
  drawFarmWheel(ctx, wheelA[0], wheelA[1] - 3, 7, {
    rim: PALETTE.rustDark,
    lit: PALETTE.rustLight,
    shade: PALETTE.woodDark,
    hub: PALETTE.rustLight
  });
  drawFarmWheel(ctx, wheelB[0], wheelB[1] - 3, 7, {
    rim: PALETTE.rustDark,
    lit: PALETTE.rustLight,
    shade: PALETTE.woodDark,
    hub: PALETTE.rustLight
  });
}

export function drawWagonWheel(ctx, cx, cy, seed) {
  drawShadowBlob(ctx, cx, cy + 4, 32, 12);
  const lean = (seed & 1) ? 1 : -1;
  linePx(ctx, cx - 9 * lean, cy - 2, cx + 8 * lean, cy - 31, PALETTE.outline, 3);
  linePx(ctx, cx - 8 * lean, cy - 3, cx + 7 * lean, cy - 30, PALETTE.woodDark, 1);
  drawFarmWheel(ctx, cx, cy - 18, 9, {
    rim: PALETTE.woodDark,
    lit: PALETTE.woodLight,
    shade: PALETTE.rustDark,
    hub: PALETTE.rustLight
  });
  px(ctx, cx - 12, cy - 7, PALETTE.outline, 25, 4);
  px(ctx, cx - 10, cy - 8, PALETTE.woodMid, 21, 2);
}

export function drawFeedTrough(ctx, cx, cy, seed, opts = {}) {
  const frame = isoFrame(cx, cy, opts.orient ?? 'se');
  drawShadowBlob(ctx, cx, cy + 4, 42, 13);
  const box = orientedBox(ctx, frame, 0.82, 0.3, 10, {
    top: PALETTE.woodDark,
    lit: PALETTE.woodMid,
    shade: PALETTE.woodDark,
    outline: PALETTE.outline
  });
  const left = frame.point(-0.33, 0, 11);
  const right = frame.point(0.33, 0, 11);
  linePx(ctx, left[0], left[1], right[0], right[1], PALETTE.void, 5);
  linePx(ctx, left[0], left[1] - 1, right[0], right[1] - 1, PALETTE.stoneDark, 2);
  for (const la of [-0.34, 0.34]) {
    for (const lb of [-0.1, 0.1]) {
      drawPropLeg(ctx, frame.point(la, lb, 1), 8, PALETTE.woodDark);
    }
  }
  for (const la of [-0.28, -0.08, 0.1, 0.29]) {
    const feed = frame.point(la, 0, 13);
    px(ctx, feed[0] - 2, feed[1] - 1, PALETTE.clothTan, 5, 1);
    px(ctx, feed[0] - 1, feed[1], PALETTE.hostGold, 3, 1);
  }
  const braceA = frame.point(-0.39, 0.16, 5);
  const braceB = frame.point(0.39, 0.16, 5);
  linePx(ctx, braceA[0], braceA[1], braceB[0], braceB[1], PALETTE.outline, 2);
  linePx(ctx, braceA[0], braceA[1] - 1, braceB[0], braceB[1] - 1, PALETTE.woodDark, 1);
  px(ctx, box.cap.left[0] + 3, box.cap.left[1], PALETTE.woodLight, 10, 1);
  drawNoisePixels(ctx, cx - 18, cy - 14, 36, 20, [PALETTE.woodDark, PALETTE.stoneDark], 0.035, seed);
}

export function drawWaterPump(ctx, cx, cy, seed) {
  drawShadowBlob(ctx, cx, cy + 4, 26, 11);
  drawIsoPrism(ctx, cx, cy + 2, 24, 11, 5, {
    top: PALETTE.stoneMid,
    left: PALETTE.stoneDark,
    right: PALETTE.void,
    outline: PALETTE.outline
  });
  px(ctx, cx - 5, cy - 39, PALETTE.outline, 11, 40);
  px(ctx, cx - 3, cy - 38, PALETTE.rustDark, 7, 37);
  px(ctx, cx - 2, cy - 37, PALETTE.rustLight, 2, 32);
  px(ctx, cx - 8, cy - 44, PALETTE.outline, 17, 8);
  px(ctx, cx - 6, cy - 43, PALETTE.rustDark, 13, 5);
  linePx(ctx, cx + 4, cy - 31, cx + 22, cy - 34, PALETTE.outline, 4);
  linePx(ctx, cx + 4, cy - 32, cx + 20, cy - 35, PALETTE.rustLight, 2);
  px(ctx, cx + 19, cy - 33, PALETTE.outline, 5, 8);
  drawFarmWheel(ctx, cx + 13, cy - 24, 5, {
    rim: PALETTE.rustDark,
    lit: PALETTE.rustLight,
    shade: PALETTE.stoneDark,
    hub: PALETTE.stoneDust
  });
  linePx(ctx, cx + 5, cy - 25, cx + 13, cy - 24, PALETTE.outline, 2);
  linePx(ctx, cx + 5, cy - 26, cx + 13, cy - 25, PALETTE.rustLight, 1);
  px(ctx, cx - 12, cy - 41, PALETTE.outline, 24, 3);
  px(ctx, cx - 10, cy - 42, PALETTE.stoneDark, 20, 1);
  linePx(ctx, cx - 8, cy - 29, cx - 24, cy - 20, PALETTE.outline, 3);
  linePx(ctx, cx - 8, cy - 30, cx - 23, cy - 21, PALETTE.woodDark, 1);
  px(ctx, cx - 5, cy - 17, PALETTE.stoneDust, 3, 2);
  px(ctx, cx + 3, cy - 17, PALETTE.stoneDust, 3, 2);
  drawNoisePixels(ctx, cx - 10, cy - 39, 20, 40, [PALETTE.rustDark, PALETTE.stoneDark], 0.035, seed);
}

export function drawToolRack(ctx, cx, cy, seed) {
  drawShadowBlob(ctx, cx, cy + 4, 34, 12);
  px(ctx, cx - 15, cy - 42, PALETTE.outline, 5, 45);
  px(ctx, cx + 12, cy - 40, PALETTE.outline, 5, 43);
  px(ctx, cx - 14, cy - 41, PALETTE.woodDark, 3, 42);
  px(ctx, cx + 13, cy - 39, PALETTE.woodDark, 3, 40);
  linePx(ctx, cx - 17, cy - 36, cx + 16, cy - 34, PALETTE.outline, 4);
  linePx(ctx, cx - 16, cy - 37, cx + 15, cy - 35, PALETTE.woodMid, 2);
  for (const spec of [
    [-9, PALETTE.rustLight, 18],
    [-2, PALETTE.stoneDust, 22],
    [6, PALETTE.rustLight, 16]
  ]) {
    px(ctx, cx + spec[0], cy - 34, PALETTE.outline, 3, spec[2]);
    px(ctx, cx + spec[0] + 1, cy - 33, spec[1], 1, spec[2] - 1);
  }
  px(ctx, cx - 12, cy - 14, PALETTE.rustLight, 8, 2);
  px(ctx, cx - 4, cy - 11, PALETTE.stoneDust, 10, 2);
  px(ctx, cx + 4, cy - 16, PALETTE.rustLight, 8, 2);
  drawNoisePixels(ctx, cx - 17, cy - 39, 34, 38, [PALETTE.woodDark, PALETTE.stoneDark], 0.035, seed);
}

export function drawWoodpile(ctx, cx, cy, seed) {
  const rng = rngFrom(hash2D(seed + 97, seed * 11 + 3));
  drawShadowBlob(ctx, cx, cy + 4, 46, 15);
  for (let row = 0; row < 4; row += 1) {
    const count = row % 2 === 0 ? 4 : 3;
    for (let i = 0; i < count; i += 1) {
      const x = cx - 20 + i * 13 + (row % 2) * 6;
      const y = cy - 5 - row * 6 + Math.floor((rng() - 0.5) * 2);
      px(ctx, x - 2, y - 4, PALETTE.outline, 15, 8);
      px(ctx, x, y - 3, PALETTE.woodMid, 11, 6);
      px(ctx, x, y - 3, PALETTE.woodLight, 3, 2);
      px(ctx, x + 8, y - 2, PALETTE.woodDark, 3, 4);
      px(ctx, x + 10, y - 1, PALETTE.outline, 1, 2);
    }
  }
  linePx(ctx, cx - 24, cy - 1, cx - 15, cy - 29, PALETTE.outline, 3);
  linePx(ctx, cx + 22, cy - 1, cx + 13, cy - 28, PALETTE.outline, 3);
  linePx(ctx, cx - 23, cy - 2, cx - 15, cy - 28, PALETTE.woodDark, 1);
  linePx(ctx, cx + 21, cy - 2, cx + 14, cy - 27, PALETTE.woodDark, 1);
}

export function drawRoadSignPost(ctx, cx, cy, seed) {
  const side = (seed & 1) ? 1 : -1;
  const topY = cy - 48;
  const midY = cy - 39;
  const botY = cy - 30;
  const rootX = cx + side * 5;
  const shoulderX = cx + side * 36;
  const tipX = cx + side * 48;
  const innerRoot = rootX + side * 2;
  const innerShoulder = shoulderX - side * 3;
  const innerTip = tipX - side * 4;

  drawShadowBlob(ctx, cx, cy + 4, 34, 11);

  // Split timber post with a lit left edge and a darker buried foot.
  px(ctx, cx - 5, cy - 52, PALETTE.outline, 11, 57);
  px(ctx, cx - 3, cy - 50, PALETTE.woodDark, 7, 53);
  px(ctx, cx - 2, cy - 49, PALETTE.woodMid, 3, 48);
  px(ctx, cx + 2, cy - 48, PALETTE.woodDark, 2, 48);
  px(ctx, cx - 6, cy + 1, PALETTE.outline, 13, 5);
  px(ctx, cx - 3, cy + 2, PALETTE.stoneDark, 7, 2);
  linePx(ctx, cx + 1, cy - 47, cx + 1, cy - 4, PALETTE.outline, 1);
  linePx(ctx, cx - 2, cy - 40, cx + 1, cy - 44, PALETTE.woodLight, 1);
  linePx(ctx, cx - 1, cy - 19, cx + 2, cy - 25, PALETTE.woodLight, 1);

  // Direction plank: an arrow-shaped board instead of an unreadable rectangle.
  poly(ctx, PALETTE.outline, [
    [rootX, topY],
    [shoulderX, topY],
    [tipX, midY],
    [shoulderX, botY],
    [rootX, botY]
  ]);
  poly(ctx, PALETTE.woodDark, [
    [innerRoot, topY + 2],
    [innerShoulder, topY + 2],
    [innerTip, midY],
    [innerShoulder, botY - 2],
    [innerRoot, botY - 2]
  ]);
  poly(ctx, PALETTE.woodMid, [
    [innerRoot, topY + 2],
    [innerShoulder, topY + 2],
    [innerTip - side * 2, midY - 1],
    [innerShoulder, midY - 1],
    [innerRoot, midY - 1]
  ]);
  linePx(ctx, innerRoot, topY + 4, innerShoulder, topY + 4, PALETTE.woodLight, 1);
  linePx(ctx, innerRoot, midY + 2, innerShoulder, midY + 2, PALETTE.outline, 1);
  linePx(ctx, innerRoot, botY - 3, innerShoulder, botY - 3, PALETTE.woodDark, 1);
  for (const off of [10, 22]) {
    const x = cx + side * off;
    px(ctx, x - 1, midY - 1, PALETTE.outline, 3, 3);
    px(ctx, x, midY, PALETTE.rustLight, 1, 1);
  }
  linePx(ctx, cx + side * 6, cy - 31, cx + side * 20, cy - 24, PALETTE.outline, 3);
  linePx(ctx, cx + side * 7, cy - 32, cx + side * 19, cy - 25, PALETTE.woodDark, 1);
  drawNoisePixels(ctx, Math.min(rootX, tipX), topY + 2, Math.abs(tipX - rootX), 16, [PALETTE.woodDark, PALETTE.stoneDark], 0.03, seed);
}
