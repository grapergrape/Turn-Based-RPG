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
  drawPropLeg,
  drawRubbleCluster,
  drawScorchMark,
  drawWarmLightPool,
  drawWaxStain,
  faceTools,
  footprintExtent,
  hash2D,
  isoFrame,
  linePx,
  mixPoint,
  nativeLinePx,
  nativePx,
  normalizeOrient,
  ORIENTS,
  orientedBox,
  poly,
  px,
  rngFrom,
  wallRunFace
} from './basePixels.js';

// Ritual markings, altar objects, and chapel ceremony props.

export function drawPrayerLectern(ctx, cx, cy, seed, opts = {}) {
  const defiled = Boolean(opts.defiled);
  const rng = rngFrom(hash2D(seed + 43, seed * 7 + 19));
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
  if (defiled && (seed & 1) === 0) px(ctx, cx + 9, cy - 48, PALETTE.hostRed, 4, 2);
  linePx(ctx, cx - 14, cy - 44, cx + 12, cy - 50, PALETTE.outline, 1);
  linePx(ctx, cx - 13, cy - 45, cx + 11, cy - 51, PALETTE.stoneDust, 1);
  px(ctx, cx - 13, cy - 47, PALETTE.outline, 9, 3);
  px(ctx, cx - 12, cy - 48, PALETTE.hostBone, 6, 1);
  px(ctx, cx + 4, cy - 45, PALETTE.outline, 8, 3);
  px(ctx, cx + 5, cy - 46, PALETTE.rustDark, 5, 1);
  linePx(ctx, cx - 11, cy - 31, cx - 21, cy - 4, PALETTE.outline, 2);
  linePx(ctx, cx - 10, cy - 31, cx - 20, cy - 5, PALETTE.woodDark, 1);
  linePx(ctx, cx + 10, cy - 31, cx + 20, cy - 4, PALETTE.outline, 2);
  linePx(ctx, cx + 9, cy - 31, cx + 19, cy - 5, PALETTE.woodDark, 1);
  px(ctx, cx - 15, cy - 3, PALETTE.outline, 31, 3);
  px(ctx, cx - 12, cy - 4, PALETTE.woodDark, 25, 1);
  for (let i = 0; i < 5; i += 1) {
    px(ctx, cx - 12 + Math.floor(rng() * 25), cy - 51 + Math.floor(rng() * 8), rng() < 0.5 ? PALETTE.stoneDark : PALETTE.rustDark, 1 + (i & 1), 1);
  }
  drawRubbleCluster(ctx, cx + 19, cy + 7, seed + 47, 2);
  if (defiled) {
    // The occupied Ash Chapel keeps its authored damage: the chained book is
    // gone, the chain hangs cut, and one torn page remains under the clasp.
    px(ctx, cx + 6, cy - 22, PALETTE.stoneLight, 1, 2);
    px(ctx, cx + 7, cy - 19, PALETTE.stoneLight, 1, 2);
    px(ctx, cx + 8, cy - 16, PALETTE.stoneDark, 1, 2);
    px(ctx, cx - 3, cy - 25, PALETTE.hostBone, 4, 2);
    px(ctx, cx - 2, cy - 24, PALETTE.stoneDust, 2, 1);
  } else {
    // Ordinary chapels retain the book and its complete chain. The pale page
    // block, dark cover, central gutter, and brass clasp survive at map scale.
    px(ctx, cx - 10, cy - 52, PALETTE.outline, 21, 6);
    px(ctx, cx - 9, cy - 53, PALETTE.woodDark, 19, 2);
    px(ctx, cx - 8, cy - 51, PALETTE.clothTan, 17, 3);
    px(ctx, cx, cy - 52, PALETTE.stoneDark, 1, 4);
    px(ctx, cx + 7, cy - 51, PALETTE.rustLight, 2, 2);
    for (const [dx, dy] of [[7, -46], [8, -42], [8, -38], [7, -34], [6, -30], [6, -26], [6, -22]]) {
      px(ctx, cx + dx, cy + dy, PALETTE.stoneLight, 2, 1);
      px(ctx, cx + dx + 1, cy + dy + 1, PALETTE.stoneDark, 1, 1);
    }
  }

  // Fine page rules, chain facets, and split timber are drawn at the native
  // resolution. They add construction detail without softening the silhouette.
  nativeLinePx(ctx, cx - 7.5, cy - 49.5, cx - 0.5, cy - 51.5, PALETTE.stoneDust);
  nativeLinePx(ctx, cx + 1.5, cy - 50.5, cx + 7.5, cy - 48.5, PALETTE.stoneMid);
  nativeLinePx(ctx, cx - 1.5, cy - 37.5, cx - 1.5, cy - 9.5, PALETTE.woodLight);
  nativeLinePx(ctx, cx - 18.5, cy - 4.5, cx - 6.5, cy - 4.5, PALETTE.woodMid);
  nativeLinePx(ctx, cx + 6.5, cy - 4.5, cx + 17.5, cy - 4.5, PALETTE.woodDark);
  if (defiled) {
    nativeLinePx(ctx, cx + 6.5, cy - 21.5, cx + 8.5, cy - 16.5, PALETTE.stoneDust);
    nativePx(ctx, cx - 1.5, cy - 23.5, PALETTE.hostBone);
  } else {
    nativeLinePx(ctx, cx + 6.5, cy - 45.5, cx + 6.5, cy - 22.5, PALETTE.rustLight);
    nativePx(ctx, cx + 7.5, cy - 49.5, PALETTE.stoneLight);
  }
}

export function drawRitualBowl(ctx, cx, cy, seed) {
  const rng = rngFrom(hash2D(seed + 149, seed * 5 + 11));
  drawIsoDiamond(ctx, cx + 1, cy + 3, 42, 18, PALETTE.outline);
  drawIsoDiamond(ctx, cx + 1, cy + 2, 36, 15, PALETTE.rustDark);
  for (const dx of [-13, 13]) {
    px(ctx, cx + dx - 3, cy - 2, PALETTE.outline, 7, 3);
    px(ctx, cx + dx - 2, cy - 3, PALETTE.hostBone, 5, 2);
    px(ctx, cx + dx - 1, cy - 3, PALETTE.stoneDust, 2, 1);
  }
  drawIsoPrism(ctx, cx, cy + 1, 32, 16, 7, {
    top: PALETTE.rustLight,
    left: PALETTE.rustMid,
    right: PALETTE.rustDark,
    outline: PALETTE.outline
  });
  drawIsoDiamond(ctx, cx, cy - 8, 23, 11, PALETTE.outline);
  drawIsoDiamond(ctx, cx, cy - 9, 20, 9, PALETTE.void);
  drawIsoDiamond(ctx, cx + 1, cy - 9, 13, 6, PALETTE.hostBlack);
  // What the quest log says is in them: strips of pale flesh laid to dry
  // across the rim, one hanging over the edge. Sacrament, not soup.
  px(ctx, cx - 8, cy - 13, PALETTE.skinMid, 6, 2);
  px(ctx, cx - 8, cy - 13, PALETTE.skinLight, 3, 1);
  px(ctx, cx + 1, cy - 12, PALETTE.skinMid, 7, 2);
  px(ctx, cx + 5, cy - 12, PALETTE.skinDark, 3, 1);
  px(ctx, cx + 6, cy - 10, PALETTE.skinMid, 2, 5); // the strip over the edge
  px(ctx, cx + 6, cy - 5, PALETTE.skinDark, 2, 1);
  px(ctx, cx - 2, cy - 10, PALETTE.hostRed, 4, 1); // wet beneath them
  px(ctx, cx - 1, cy - 11, PALETTE.hostGold, 1, 1); // one gold fleck: it is still His
  for (const dx of [-13, 12]) {
    px(ctx, cx + dx - 2, cy - 5, PALETTE.outline, 5, 9);
    px(ctx, cx + dx - 1, cy - 4, PALETTE.rustDark, 3, 7);
  }
  for (let i = 0; i < 4; i += 1) {
    px(ctx, cx - 14 + Math.floor(rng() * 29), cy - 12 + Math.floor(rng() * 9), rng() < 0.5 ? PALETTE.hostRed : PALETTE.rustDark, 2, 1);
  }
  drawNoisePixels(ctx, cx - 15, cy - 13, 30, 17, [PALETTE.rustDark, PALETTE.hostRed], 0.055, seed);

  nativeLinePx(ctx, cx - 10.5, cy - 12.5, cx - 1.5, cy - 8.5, PALETTE.rustLight);
  nativeLinePx(ctx, cx + 2.5, cy - 8.5, cx + 10.5, cy - 11.5, PALETTE.rustMid);
  nativeLinePx(ctx, cx - 7.5, cy - 12.5, cx - 2.5, cy - 11.5, PALETTE.skinLight);
  nativeLinePx(ctx, cx + 1.5, cy - 11.5, cx + 6.5, cy - 9.5, PALETTE.skinLight);
  nativeLinePx(ctx, cx + 6.5, cy - 9.5, cx + 6.5, cy - 5.5, PALETTE.skinDark);
  nativePx(ctx, cx - 0.5, cy - 10.5, PALETTE.hostGold);
}

export function drawDamagedAltar(ctx, cx, cy, seed, pulse = 0) {
  const rng = rngFrom(hash2D(seed + 181, seed * 11 + 23));
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
  px(ctx, cx - 32, cy - 35, PALETTE.outline, 16, 2);
  px(ctx, cx - 29, cy - 36, PALETTE.stoneDust, 9, 1);
  px(ctx, cx + 20, cy - 34, PALETTE.void, 11, 3);
  px(ctx, cx + 21, cy - 36, PALETTE.stoneDark, 7, 1);
  // Cracks across the front face + a missing corner.
  drawCracks(ctx, cx - 10, cy - 14, seed, 4);
  linePx(ctx, cx - 25, cy - 21, cx - 4, cy - 10, PALETTE.outline, 1);
  linePx(ctx, cx + 6, cy - 20, cx + 25, cy - 9, PALETTE.stoneDark, 1);
  px(ctx, cx - 31, cy - 14, PALETTE.outline, 12, 2);
  px(ctx, cx - 29, cy - 15, PALETTE.stoneDust, 7, 1);
  ctx.save();
  ctx.globalAlpha = 0.7;
  drawIsoDiamond(ctx, cx + 24, cy - 32, 18, 11, PALETTE.stoneDark);
  ctx.restore();
  // Torn chapel cloth draped over the slab.
  px(ctx, cx - 22, cy - 44, PALETTE.clothRed, 16, 5);
  px(ctx, cx - 18, cy - 40, PALETTE.clothDark, 10, 3);
  px(ctx, cx - 23, cy - 39, PALETTE.outline, 5, 8);
  px(ctx, cx - 21, cy - 39, PALETTE.clothRed, 2, 6);
  linePx(ctx, cx - 18, cy - 44, cx - 7, cy - 39, PALETTE.rustDark, 1);
  px(ctx, cx + 12, cy - 42, PALETTE.outline, 12, 3);
  px(ctx, cx + 14, cy - 43, PALETTE.hostBone, 7, 1);
  px(ctx, cx + 17, cy - 41, pulse ? PALETTE.hostGlow : PALETTE.hostGold, 2, 1);
  for (let i = 0; i < 6; i += 1) {
    const sx = cx - 28 + Math.floor(rng() * 57);
    const sy = cy - 35 + Math.floor(rng() * 13);
    px(ctx, sx, sy, rng() < 0.5 ? PALETTE.stoneDark : PALETTE.rustDark, 1, 1);
  }
  // The working edge: knife grooves worn into the slab lip where the same
  // cuts land day after day, and the soak line down the front face beneath
  // them. The altar is a butcher's table that still remembers being holy.
  for (const gx of [-8, -3, 2, 6]) {
    px(ctx, cx + gx, cy - 37, PALETTE.stoneDark, 2, 1);
    px(ctx, cx + gx, cy - 36, PALETTE.void, 1, 1);
  }
  px(ctx, cx - 6, cy - 35, PALETTE.rustDark, 12, 2); // the stained lip
  px(ctx, cx - 3, cy - 33, PALETTE.rustDark, 2, 9); // soak line down the face
  px(ctx, cx - 2, cy - 24, PALETTE.hostRed, 2, 3);
  px(ctx, cx + 3, cy - 33, PALETTE.rustDark, 1, 6); // a second, older run

  // Host tissue splitting it from below.
  drawHostGrowth(ctx, cx, cy + 4, seed + 7, pulse);
  drawHostGrowth(ctx, cx - 18, cy - 4, seed + 19, pulse);
  drawHostGrowth(ctx, cx + 16, cy - 2, seed + 31, pulse);
  linePx(ctx, cx - 11, cy - 6, cx - 28, cy + 3, PALETTE.hostBlack, 2);
  linePx(ctx, cx - 10, cy - 7, cx - 26, cy + 2, PALETTE.hostGold, 1);
  linePx(ctx, cx + 9, cy - 6, cx + 29, cy + 2, PALETTE.hostBlack, 2);
  linePx(ctx, cx + 10, cy - 7, cx + 27, cy + 1, PALETTE.hostGold, 1);

  // Native knife scoring crosses the worn working edge; finer black-gold
  // capillaries remain under the split stone rather than becoming gore spray.
  for (const gx of [-7.5, -2.5, 2.5, 6.5]) {
    nativeLinePx(ctx, cx + gx, cy - 39.5, cx + gx + 2, cy - 36.5, PALETTE.stoneDark);
  }
  nativeLinePx(ctx, cx - 9.5, cy - 5.5, cx - 20.5, cy + 0.5, PALETTE.hostBlack);
  nativeLinePx(ctx, cx - 8.5, cy - 6.5, cx - 19.5, cy - 0.5, PALETTE.hostGold);
  nativePx(ctx, cx + 16.5, cy - 41.5, pulse ? PALETTE.hostGlow : PALETTE.hostGold);
  drawRubbleCluster(ctx, cx + 31, cy + 9, seed + 185, 3);
}

export function drawLooseFlagstone(ctx, cx, cy, seed) {
  const rng = rngFrom(hash2D(seed + 157, seed * 7 + 19));
  // The cavity under the lifted stone.
  drawIsoDiamond(ctx, cx + 5, cy + 3, 46, 20, PALETTE.outline);
  drawIsoDiamond(ctx, cx + 4, cy + 3, 36, 16, PALETTE.void);
  drawIsoDiamond(ctx, cx + 5, cy + 4, 26, 11, PALETTE.hostBlack);
  drawIsoDiamond(ctx, cx - 3, cy + 6, 18, 7, PALETTE.stoneDark);
  // The slab, tilted up on its inner edge.
  poly(ctx, PALETTE.outline, [[cx - 28, cy - 2], [cx - 5, cy - 17], [cx + 21, cy - 8], [cx - 3, cy + 8]]);
  poly(ctx, PALETTE.stoneMid, [[cx - 24, cy - 2], [cx - 5, cy - 14], [cx + 17, cy - 7], [cx - 3, cy + 5]]);
  poly(ctx, PALETTE.stoneLight, [[cx - 24, cy - 2], [cx - 5, cy - 14], [cx - 1, cy - 13], [cx - 21, cy - 1]]);
  poly(ctx, PALETTE.stoneDark, [[cx - 2, cy - 12], [cx + 17, cy - 7], [cx - 3, cy + 5], [cx - 1, cy - 1]]);
  px(ctx, cx - 7, cy - 15, PALETTE.stoneDust, 8, 1);
  px(ctx, cx + 10, cy - 8, PALETTE.outline, 7, 2);
  px(ctx, cx + 11, cy - 9, PALETTE.stoneDust, 4, 1);
  linePx(ctx, cx - 20, cy, cx + 13, cy - 7, PALETTE.stoneDark, 1);
  linePx(ctx, cx - 19, cy - 1, cx + 9, cy - 7, PALETTE.stoneDust, 1);
  linePx(ctx, cx - 10, cy - 9, cx + 8, cy + 1, PALETTE.outline, 1);
  linePx(ctx, cx - 8, cy - 10, cx + 6, cy, PALETTE.rustDark, 1);
  for (const [dx, dy] of [[-20, 4], [-12, -2], [18, -3], [11, 6]]) {
    px(ctx, cx + dx - 1, cy + dy - 1, PALETTE.outline, 5, 3);
    px(ctx, cx + dx, cy + dy - 1, rng() < 0.5 ? PALETTE.stoneDust : PALETTE.rustDark, 3, 1);
  }
  // A pale gleam from whatever waits in the dark.
  px(ctx, cx + 8, cy + 2, PALETTE.hostGold, 3, 1);
  px(ctx, cx + 6, cy + 4, PALETTE.hostBone, 2, 1);
  px(ctx, cx + 11, cy + 5, PALETTE.void, 3, 1);
  for (let i = 0; i < 9; i += 1) {
    const x = cx - 23 + Math.floor(rng() * 47);
    const y = cy - 10 + Math.floor(rng() * 20);
    px(ctx, x, y, rng() < 0.55 ? PALETTE.stoneDust : PALETTE.rustDark, 1 + (i & 1), 1);
  }
  drawNoisePixels(ctx, cx - 24, cy - 13, 48, 24, [PALETTE.stoneDark, PALETTE.stoneDust, PALETTE.rustDark], 0.06, seed);
  // The pry bar that lifted it, left leaning across the slab edge. Whoever
  // hid something here meant to come back.
  linePx(ctx, cx - 14, cy - 12, cx - 2, cy + 2, PALETTE.outline, 2);
  linePx(ctx, cx - 13, cy - 12, cx - 2, cy + 1, PALETTE.stoneLight, 1);
  px(ctx, cx - 15, cy - 14, PALETTE.stoneLight, 3, 2); // the flattened tip

  nativeLinePx(ctx, cx - 20.5, cy - 1.5, cx - 8.5, cy - 5.5, PALETTE.stoneLight);
  nativeLinePx(ctx, cx + 1.5, cy - 10.5, cx + 11.5, cy - 7.5, PALETTE.stoneDark);
  nativePx(ctx, cx - 12.5, cy - 12.5, PALETTE.stoneLight);

}

export function drawChalkDrawing(ctx, cx, cy, seed) {
  const rng = rngFrom(hash2D(seed + 307, seed * 5 + 83));
  ctx.save();
  ctx.globalAlpha = 0.88;
  const chalk = PALETTE.hostBone;
  const shadow = PALETTE.outline;
  for (let a = 0; a < 30; a += 1) {
    const t = (a / 30) * Math.PI * 2;
    px(ctx, cx - 7 + Math.round(Math.cos(t) * 6), cy - 4 + Math.round(Math.sin(t) * 4), shadow);
  }
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
  // Two small stick figures looking up at it, the smaller one holding the
  // taller one's hand. Micah and Ruth drew themselves watching the world.
  px(ctx, cx + 10, cy - 4, chalk, 1, 1);
  px(ctx, cx + 10, cy - 2, chalk, 1, 5);
  px(ctx, cx + 8, cy - 1, chalk, 5, 1);
  px(ctx, cx + 8, cy + 3, chalk, 1, 2);
  px(ctx, cx + 12, cy + 3, chalk, 1, 2);
  px(ctx, cx + 16, cy - 2, chalk, 1, 1); // the smaller one
  px(ctx, cx + 16, cy, chalk, 1, 4);
  px(ctx, cx + 13, cy + 1, chalk, 4, 1); // held hand meets the taller arm
  px(ctx, cx + 15, cy + 4, chalk, 1, 1);
  px(ctx, cx + 17, cy + 4, chalk, 1, 1);
  px(ctx, cx + 15, cy + 5, PALETTE.outline, 7, 2);
  px(ctx, cx + 16, cy + 4, PALETTE.hostBone, 5, 1);
  for (let i = 0; i < 6; i += 1) {
    const x = cx - 20 + Math.floor(rng() * 41);
    const y = cy - 10 + Math.floor(rng() * 20);
    linePx(ctx, x, y, x + 3 + Math.floor(rng() * 5), y + Math.floor(rng() * 3) - 1, i % 2 ? PALETTE.stoneDust : PALETTE.hostBone, 1);
  }
  ctx.restore();
  drawNoisePixels(ctx, cx - 20, cy - 13, 40, 24, [PALETTE.stoneDust, PALETTE.stoneDark], 0.04, seed);
  // Broken chalk edges keep the drawing made by small hands: a fine orbit,
  // the joined hands, and loose powder around the shaft.
  nativeLinePx(ctx, cx - 16.5, cy - 7.5, cx - 2.5, cy - 3.5, PALETTE.stoneDust);
  nativeLinePx(ctx, cx + 9.5, cy + 0.5, cx + 15.5, cy + 1.5, PALETTE.hostBone);
  nativeLinePx(ctx, cx - 8.5, cy + 0.5, cx - 8.5, cy + 7.5, PALETTE.stoneDust);
  nativePx(ctx, cx - 10.5, cy + 8.5, PALETTE.hostBone);
}

export function drawMachineOil(ctx, cx, cy, seed) {
  const rng = rngFrom(hash2D(seed + 311, seed * 7 + 89));
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
  for (const [dx, dy, w] of [[-16, -5, 13], [4, -3, 16], [-3, 5, 11]]) {
    linePx(ctx, cx + dx, cy + dy, cx + dx + w, cy + dy + Math.floor(rng() * 4) - 1, PALETTE.outline, 1);
    linePx(ctx, cx + dx + 2, cy + dy, cx + dx + w - 3, cy + dy - 1, PALETTE.stoneDark, 1);
  }
  for (let i = 0; i < 5; i += 1) {
    const x = cx - 17 + Math.floor(rng() * 35);
    const y = cy - 7 + Math.floor(rng() * 15);
    px(ctx, x, y, i % 2 ? PALETTE.hostBlack : PALETTE.rustDark, 2, 1);
  }
  drawNoisePixels(ctx, cx - 18, cy - 8, 36, 16, [PALETTE.rustDark, PALETTE.hostBlack], 0.05, seed);
  // Thin reflected edges trace the oil film around the black core. They stay
  // sparse and palette-bound rather than simulating a smooth glossy gradient.
  nativeLinePx(ctx, cx - 15.5, cy - 5.5, cx - 3.5, cy - 6.5, PALETTE.rustLight);
  nativeLinePx(ctx, cx + 4.5, cy + 5.5, cx + 14.5, cy + 2.5, PALETTE.stoneDark);
  nativePx(ctx, cx + 10.5, cy + 1.5, PALETTE.hostGold);
}

export function drawBloodSigil(ctx, cx, cy, seed) {
  const blood = PALETTE.hostRed;
  const dark = PALETTE.rustDark;
  const rng = rngFrom(hash2D(seed + 23, seed * 13 + 5));
  ctx.save();
  ctx.globalAlpha = 0.95;
  drawIsoDiamond(ctx, cx + 1, cy + 1, 52, 23, PALETTE.outline);
  drawIsoDiamond(ctx, cx + 1, cy + 1, 46, 19, PALETTE.hostBlack);
  // hostRed on hostBlack is nearly invisible; every ritual stroke carries a
  // rust edge so the sigil reads at gameplay zoom.
  for (let n = 0; n < 34; n += 1) {
    const a = (Math.PI * 2 * n) / 34;
    px(ctx, cx + Math.round(Math.cos(a) * 17), cy + Math.round(Math.sin(a) * 8), n % 2 ? PALETTE.rustMid : dark, n % 5 === 0 ? 2 : 1, 1);
  }
  for (let n = 0; n < 18; n += 1) {
    const a = (Math.PI * 2 * n) / 18;
    px(ctx, cx + Math.round(Math.cos(a) * 9), cy + Math.round(Math.sin(a) * 4), n % 3 === 0 ? PALETTE.hostGold : dark, 1, 1);
  }
  px(ctx, cx - 1, cy - 9, PALETTE.outline, 4, 20);
  px(ctx, cx, cy - 8, blood, 2, 18); // upright
  px(ctx, cx, cy - 8, PALETTE.rustMid, 1, 17); // lit wet edge
  px(ctx, cx - 7, cy + 4, PALETTE.outline, 16, 4);
  px(ctx, cx - 6, cy + 5, blood, 14, 2); // crossbar set low => inverted
  px(ctx, cx - 6, cy + 5, PALETTE.rustMid, 13, 1);
  px(ctx, cx - 13, cy - 2, dark, 26, 1);
  px(ctx, cx - 9, cy + 9, dark, 18, 1);
  linePx(ctx, cx - 16, cy - 5, cx + 15, cy + 7, PALETTE.outline, 2);
  linePx(ctx, cx - 15, cy - 5, cx + 14, cy + 6, dark, 1);
  for (let i = 0; i < 5; i += 1) {
    const x = cx - 18 + Math.floor(rng() * 37);
    const y = cy - 8 + Math.floor(rng() * 17);
    px(ctx, x, y, i % 2 ? blood : dark, 3, 1);
    if (i === 2) px(ctx, x + 1, y - 1, PALETTE.hostGold, 1, 1);
  }
  for (const [dx, dy] of [[-18, 0], [18, 0], [0, -9], [0, 10]]) {
    px(ctx, cx + dx - 2, cy + dy - 1, PALETTE.outline, 5, 3);
    px(ctx, cx + dx - 1, cy + dy - 1, PALETTE.hostBone, 3, 2);
  }
  ctx.restore();
  drawNoisePixels(ctx, cx - 18, cy - 10, 36, 20, [blood, dark], 0.065, seed);

  // Fine dragged edges and separated droplets keep the mark hand-painted at
  // native 2x instead of merely doubling the broad logical strokes.
  nativeLinePx(ctx, cx - 14.5, cy - 5.5, cx + 13.5, cy + 5.5, PALETTE.rustMid);
  nativeLinePx(ctx, cx - 0.5, cy - 7.5, cx - 0.5, cy + 8.5, PALETTE.hostRed);
  nativePx(ctx, cx - 17.5, cy + 4.5, PALETTE.hostRed);
  nativePx(ctx, cx + 16.5, cy - 3.5, PALETTE.hostGold);
}

export function drawRitualCircle(ctx, cx, cy, seed) {
  const blood = PALETTE.hostRed;
  const dark = PALETTE.rustDark;
  const rng = rngFrom(hash2D(seed + 47, seed * 17 + 9));
  ctx.save();
  ctx.globalAlpha = 0.5;
  drawIsoDiamond(ctx, cx, cy, 70, 35, PALETTE.void);
  ctx.globalAlpha = 0.98;
  for (let n = 0; n < 52; n += 1) {
    const a = (Math.PI * 2 * n) / 52;
    px(ctx, cx + Math.round(Math.cos(a) * 31), cy + Math.round(Math.sin(a) * 15), n % 6 === 0 ? PALETTE.hostGold : blood, n % 4 === 0 ? 2 : 1, 1);
    px(ctx, cx + Math.round(Math.cos(a) * 24), cy + Math.round(Math.sin(a) * 12), n % 2 ? dark : blood, n % 5 === 0 ? 2 : 1, 1);
  }
  for (const [x0, y0, x1, y1] of [
    [-28, -10, 28, 10],
    [-28, 10, 28, -10],
    [0, -15, 0, 15],
    [-31, 0, 31, 0]
  ]) {
    linePx(ctx, cx + x0, cy + y0, cx + x1, cy + y1, PALETTE.outline, 2);
    linePx(ctx, cx + x0, cy + y0 - 1, cx + x1, cy + y1 - 1, dark, 1);
  }
  px(ctx, cx - 1, cy - 14, PALETTE.outline, 5, 30);
  px(ctx, cx, cy - 13, blood, 3, 28); // upright
  px(ctx, cx, cy - 13, PALETTE.rustMid, 1, 27); // wet lit edge
  px(ctx, cx - 10, cy + 7, PALETTE.outline, 22, 5);
  px(ctx, cx - 9, cy + 8, blood, 20, 3); // low crossbar => inverted
  px(ctx, cx - 9, cy + 8, PALETTE.rustMid, 19, 1);
  for (const [dx, dy] of [[0, -15], [0, 15], [31, 0], [-31, 0], [22, -10], [-22, 10]]) px(ctx, cx + dx, cy + dy, PALETTE.hostBone, 3, 2);
  for (const [dx, dy] of [[0, -15], [0, 15], [31, 0], [-31, 0]]) {
    px(ctx, cx + dx - 2, cy + dy - 1, PALETTE.outline, 6, 4);
    px(ctx, cx + dx - 1, cy + dy - 1, PALETTE.hostBone, 4, 2);
    px(ctx, cx + dx, cy + dy - 2, PALETTE.stoneDust, 2, 1);
  }
  for (let i = 0; i < 7; i += 1) {
    const x = cx - 30 + Math.floor(rng() * 61);
    const y = cy - 14 + Math.floor(rng() * 29);
    px(ctx, x, y, i % 2 ? dark : blood, 4, 1);
    if (i % 3 === 0) px(ctx, x + 1, y - 1, PALETTE.hostGold, 1, 1);
  }
  ctx.restore();
  drawNoisePixels(ctx, cx - 35, cy - 18, 70, 36, [dark, PALETTE.stoneDark, blood], 0.052, seed);

  // The outer ring has a thin, irregular wet edge. Short segments preserve
  // the broken hand-drawn character and avoid a mathematically clean ellipse.
  for (const [x0, y0, x1, y1, color] of [
    [-27.5, -7.5, -16.5, -13.5, PALETTE.rustMid],
    [-8.5, -15.5, 5.5, -15.5, PALETTE.hostRed],
    [14.5, -13.5, 26.5, -7.5, PALETTE.rustMid],
    [28.5, 6.5, 17.5, 12.5, PALETTE.hostRed],
    [-16.5, 12.5, -28.5, 6.5, PALETTE.rustDark]
  ]) nativeLinePx(ctx, cx + x0, cy + y0, cx + x1, cy + y1, color);
  nativePx(ctx, cx + 30.5, cy - 0.5, PALETTE.hostGold);
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
    pts.push([cx + Math.round(Math.cos(a) * R), wy + Math.round(Math.sin(a) * R)]);
  }
  const order = [0, 2, 4, 1, 3, 0];
  for (let i = 1; i < order.length; i += 1) {
    const [x0, y0] = pts[order[i - 1]];
    const [x1, y1] = pts[order[i]];
    linePx(ctx, x0, y0, x1, y1, PALETTE.outline, 3);
    linePx(ctx, x0, y0 - 1, x1, y1 - 1, i % 2 ? dark : blood, 1);
    linePx(ctx, x0, y0, x1, y1, blood, 1);
  }
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


  // Scraped stone peeks through one side of each painted stroke, while the
  // longest drips taper to a single native pixel.
  for (let i = 1; i < order.length; i += 1) {
    const [x0, y0] = pts[order[i - 1]];
    const [x1, y1] = pts[order[i]];
    nativeLinePx(ctx, x0 + 0.5, y0 - 0.5, x1 + 0.5, y1 - 0.5, i % 2 ? PALETTE.rustMid : PALETTE.hostRed);
  }
  nativePx(ctx, cx - 10.5, wy + R + 7.5, blood);
  nativePx(ctx, cx + 7.5, wy + R + 10.5, dark);
}
