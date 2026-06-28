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

export function drawCalcifiedGraveMarker(ctx, cx, cy, seed) {
  const rng = rngFrom(hash2D(seed + 191, seed * 3 + 23));
  const lean = Math.floor((rng() - 0.5) * 5);
  const bone = PALETTE.hostBone;
  const lo = PALETTE.stoneDark;
  const dust = PALETTE.stoneDust;
  const split = seed % 4 === 0;

  drawShadowBlob(ctx, cx, cy + 3, 28, 11);
  drawIsoDiamond(ctx, cx, cy, 25, 9, PALETTE.stoneDark);
  px(ctx, cx - 9 + lean, cy - 43, PALETTE.outline, 19, 44);
  px(ctx, cx - 8 + lean, cy - 42, bone, 15, 40);
  px(ctx, cx - 8 + lean, cy - 42, dust, 5, 36);
  px(ctx, cx + 5 + lean, cy - 38, lo, 3, 34);
  if (split) {
    linePx(ctx, cx + lean + 1, cy - 40, cx + lean - 2, cy - 4, PALETTE.void, 1);
    px(ctx, cx + lean + 3, cy - 30, PALETTE.stoneDark, 3, 2);
  }
  px(ctx, cx - 12 + lean, cy - 22, PALETTE.outline, 25, 5);
  px(ctx, cx - 11 + lean, cy - 21, dust, 22, 2);
  px(ctx, cx + 5 + lean, cy - 20, lo, 5, 2);

  // Bone niche in the marker face: a dark recess with one tiny sorted skull.
  px(ctx, cx - 5 + lean, cy - 38, PALETTE.outline, 11, 14);
  px(ctx, cx - 4 + lean, cy - 37, PALETTE.void, 9, 11);
  px(ctx, cx - 3 + lean, cy - 35, bone, 7, 5);
  px(ctx, cx - 2 + lean, cy - 33, PALETTE.void, 2, 2);
  px(ctx, cx + 2 + lean, cy - 33, PALETTE.void, 2, 2);
  px(ctx, cx - 3 + lean, cy - 28, dust, 7, 1);

  px(ctx, cx - 5 + lean, cy - 11, lo, 11, 2);
  for (let i = 0; i < 7; i += 1) {
    const x = cx - 7 + lean + Math.floor(rng() * 15);
    const y = cy - 36 + Math.floor(rng() * 31);
    px(ctx, x, y, rng() < 0.48 ? lo : dust, 1 + (i % 3 === 0 ? 1 : 0), 1);
  }
  for (let i = 0; i < 3; i += 1) {
    const bx = cx - 10 + i * 9 + Math.floor(rng() * 3);
    px(ctx, bx, cy - 3 + (i & 1), rng() < 0.5 ? bone : lo, 3, 1);
  }
  drawNoisePixels(ctx, cx - 15, cy - 6, 30, 12, [PALETTE.stoneDark, PALETTE.rustDark], 0.09, seed);
}
const GRAVE_BODY_VARIANTS = [
  'kneeling-fused-hands',
  'broken-halo',
  'rib-open-chest',
  'reaching-arm',
  'goat-skull',
  'thorned-back',
  'bell-jaw',
  'half-prayer-twist',
  'collapsed-shoulder',
  'buried-lower-body',
  'split-face'
];

function calcifiedSegment(ctx, x0, y0, x1, y1, color, thick = 1) {
  const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    px(ctx, Math.round(x0 + (x1 - x0) * t - Math.floor(thick / 2)), Math.round(y0 + (y1 - y0) - Math.floor(thick / 2)), color, thick, thick);
  }
}

function drawGraveHalo(ctx, cx, cy, seed, opts = {}) {
  const side = opts.side ?? 1;
  const broken = opts.broken ?? false;
  const bone = PALETTE.hostBone;
  const dust = PALETTE.stoneDust;
  for (let i = 0; i < 17; i += 1) {
    if (broken && i > 8 && i < 13) continue;
    const a = Math.PI * (0.08 + i * 0.052);
    const x = cx + Math.round(Math.cos(a) * 12);
    const y = cy - Math.round(Math.sin(a) * 9);
    px(ctx, x, y, i % 3 === 0 ? bone : dust, i % 4 === 0 ? 2 : 1, 1);
  }
  if (broken) {
    px(ctx, cx + side * 8, cy + 4, dust, 4, 1);
    px(ctx, cx + side * 11, cy + 6, PALETTE.stoneDark, 3, 1);
  }
}

function drawGraveHead(ctx, x, y, variant, side) {
  const bone = PALETTE.hostBone;
  const dust = PALETTE.stoneDust;
  const shade = PALETTE.stoneDark;
  if (variant === 'goat-skull') {
    const rows = [[5, 0], [8, -1], [9, -1], [8, 0], [7, 1], [6, 1], [5, 2], [4, 3], [3, 4]];
    for (let i = 0; i < rows.length; i += 1) {
      const [w, off] = rows[i];
      const lx = x - Math.floor(w / 2) + off;
      px(ctx, lx - 1, y + i, PALETTE.outline, w + 2, 1);
      px(ctx, lx, y + i, i < 3 ? bone : dust, w, 1);
      px(ctx, lx, y + i, PALETTE.stoneLight, 1, 1);
    }
    px(ctx, x - 3, y + 4, PALETTE.void, 2, 3);
    px(ctx, x + 3, y + 3, PALETTE.void, 2, 3);
    px(ctx, x + side * 2, y + 8, PALETTE.void, 4, 2);
    calcifiedSegment(ctx, x - 4, y, x - 10, y - 7, PALETTE.outline, 2);
    calcifiedSegment(ctx, x - 4, y, x - 9, y - 7, bone, 1);
    calcifiedSegment(ctx, x + 5, y + 1, x + 9, y - 4, PALETTE.outline, 2);
    calcifiedSegment(ctx, x + 5, y + 1, x + 8, y - 4, dust, 1);
    px(ctx, x + 9, y - 4, shade, 2, 2);
    return;
  }

  const rows = variant === 'bell-jaw'
    ? [[5, 0], [7, -1], [8, 0], [7, 1], [8, 1], [10, 0], [9, 1], [7, 2]]
    : [[5, 0], [7, -1], [8, 0], [7, 0], [6, 1], [5, 1], [4, 2]];
  for (let i = 0; i < rows.length; i += 1) {
    const [w, off] = rows[i];
    const lx = x - Math.floor(w / 2) + off;
    px(ctx, lx - 1, y + i, PALETTE.outline, w + 2, 1);
    px(ctx, lx, y + i, i < 2 ? bone : dust, w, 1);
    px(ctx, lx, y + i, PALETTE.stoneLight, 1, 1);
  }
  px(ctx, x - 3, y + 3, PALETTE.void, 2, 2);
  px(ctx, x + 2, y + 3, PALETTE.void, 2, 2);
  if (variant === 'bell-jaw') {
    px(ctx, x - 4, y + 7, PALETTE.void, 9, 4);
    px(ctx, x - 5, y + 10, shade, 11, 1);
  } else if (variant === 'split-face') {
    px(ctx, x, y + 1, PALETTE.void, 1, 8);
    px(ctx, x + 1, y + 2, shade, 3, 5);
  } else {
    px(ctx, x + side, y + 6, PALETTE.void, 3, 2);
  }
}

function drawGraveRibCavity(ctx, cx, cy, side, wide = false) {
  const w = wide ? 12 : 9;
  const h = wide ? 13 : 10;
  px(ctx, cx - Math.floor(w / 2), cy, PALETTE.void, w, h);
  px(ctx, cx - Math.floor(w / 2) + 2, cy + 2, PALETTE.stoneDark, w - 4, h - 4);
  for (const s of [-1, 1]) {
    const baseX = cx + s * Math.floor(w / 2);
    for (let r = 0; r < 4; r += 1) {
      calcifiedSegment(ctx, baseX, cy + 2 + r * 2, baseX + s * (wide ? 7 - r : 5 - r), cy - 1 + r * 2, PALETTE.hostBone, 1);
    }
  }
  px(ctx, cx + side, cy - 1, PALETTE.stoneDark, 1, h + 1);
}

export function drawCalcifiedGraveBody(ctx, cx, cy, seed, opts = {}) {
  const variant = GRAVE_BODY_VARIANTS.includes(opts.variant) ? opts.variant : GRAVE_BODY_VARIANTS[seed % GRAVE_BODY_VARIANTS.length];
  const variantIndex = GRAVE_BODY_VARIANTS.indexOf(variant);
  const rng = rngFrom(hash2D(seed + 227, seed * 5 + 41));
  const side = (seed & 1) ? 1 : -1;
  const lean = Math.round((rng() - 0.5) * 5) + (variant === 'collapsed-shoulder' ? -side * 3 : 0);
  const bone = PALETTE.hostBone;
  const dust = PALETTE.stoneDust;
  const shade = PALETTE.stoneDark;
  const deadVein = PALETTE.stoneDark;
  const cut = PALETTE.rustDark;
  const buried = variant === 'buried-lower-body';

  const footY = cy - 1;
  const hipY = buried ? cy - 16 : cy - 20;
  const chestY = hipY - 15;
  const shoulderY = chestY - 10 + (variant === 'collapsed-shoulder' ? 3 : 0);
  const headY = shoulderY - 12;

  drawShadowBlob(ctx, cx, cy + 3, 31, 12);
  ctx.save();
  ctx.globalAlpha = 0.66;
  drawIsoDiamond(ctx, cx, cy + 1, buried ? 38 : 28, buried ? 15 : 10, PALETTE.stoneDark);
  ctx.restore();
  drawIsoDiamond(ctx, cx + side, cy - 1, buried ? 35 : 31, buried ? 13 : 11, PALETTE.outline);
  drawIsoDiamond(ctx, cx + side, cy - 2, buried ? 31 : 27, buried ? 11 : 9, PALETTE.stoneDark);
  px(ctx, cx - 13, cy - 8, PALETTE.stoneDust, 10, 1);
  px(ctx, cx + 3, cy - 7, PALETTE.hostBone, 7, 1);
  px(ctx, cx - 2 + side, cy - 5, PALETTE.rustDark, 8, 1);
  drawNoisePixels(ctx, cx - 18, cy - 5, 36, 11, [PALETTE.stoneDark, PALETTE.rustDark], 0.08, seed);

  if (!buried) {
    const kneeY = Math.round((hipY + footY) / 2) + (variant === 'kneeling-fused-hands' ? 2 : 0);
    calcifiedSegment(ctx, cx + lean - 4, hipY, cx - 8 - side, kneeY, PALETTE.outline, 4);
    calcifiedSegment(ctx, cx + lean - 4, hipY, cx - 8 - side, kneeY, dust, 2);
    calcifiedSegment(ctx, cx - 8 - side, kneeY, cx - 5, footY - 2, shade, 2);
    calcifiedSegment(ctx, cx + lean + 4, hipY + 1, cx + 7 + side, kneeY + 1, PALETTE.outline, 4);
    calcifiedSegment(ctx, cx + lean + 4, hipY + 1, cx + 7 + side, kneeY + 1, dust, 2);
    calcifiedSegment(ctx, cx + 7 + side, kneeY + 1, cx + 5, footY - 1, shade, 2);
    px(ctx, cx - 8, footY - 2, shade, 7, 2);
    px(ctx, cx + 3, footY - 1, shade, 7, 2);
  } else {
    for (let row = 0; row < 7; row += 1) {
      const w = 27 - row * 2;
      px(ctx, cx - Math.floor(w / 2), cy - 11 + row, row < 2 ? PALETTE.stoneDust : PALETTE.stoneDark, w, 1);
    }
  }

  // Torso: offset rows make each body read as a person frozen mid-turn.
  for (let y = shoulderY; y <= hipY; y += 1) {
    const t = (y - shoulderY) / Math.max(1, hipY - shoulderY);
    const baseW = variant === 'collapsed-shoulder' && y < chestY ? 9 : 12;
    const w = Math.max(5, Math.round(baseW - t * 4 + (variant === 'thorned-back' ? 1 : 0)));
    const drift = Math.round(lean * (1 - t) + side * Math.sin(t * Math.PI) * (variant === 'half-prayer-twist' ? 5 : 3));
    const lx = cx - Math.floor(w / 2) + drift;
    px(ctx, lx - 1, y, PALETTE.outline, w + 2, 1);
    px(ctx, lx, y, y < chestY ? bone : dust, w, 1);
    px(ctx, lx, y, PALETTE.stoneLight, 1, 1);
    px(ctx, lx + w - 1, y, deadVein, 1, 1);
    if ((y + variantIndex) % 6 === 0) px(ctx, lx + 2, y, shade, Math.max(2, w - 5), 1);
  }

  const headX = cx + lean + side * (variant === 'reaching-arm' ? 3 : 1);
  if (variant === 'broken-halo') drawGraveHalo(ctx, headX, headY + 8, seed, { side, broken: true });
  if (variant === 'kneeling-fused-hands') drawGraveHalo(ctx, headX, headY + 8, seed, { side, broken: false });
  drawGraveHead(ctx, headX, headY, variant, side);

  // Variant motifs.
  if (variant === 'rib-open-chest') {
    drawGraveRibCavity(ctx, cx + lean, chestY - 1, side, true);
  } else if (variant === 'split-face') {
    drawGraveRibCavity(ctx, cx + lean - side, chestY + 1, side, false);
  } else {
    px(ctx, cx + lean - 3, chestY + 2, PALETTE.void, 7, 8);
    px(ctx, cx + lean - 1, chestY + 3, shade, 3, 5);
  }

  if (variant === 'kneeling-fused-hands' || variant === 'half-prayer-twist') {
    const handY = chestY + (variant === 'half-prayer-twist' ? 5 : 2);
    px(ctx, cx + lean - 3, handY, bone, 6, 7);
    px(ctx, cx + lean, handY + 1, PALETTE.void, 1, 6);
    if (variant === 'half-prayer-twist') calcifiedSegment(ctx, cx + lean + 4, shoulderY + 2, cx + lean + side * 9, chestY + 11, dust, 2);
  } else if (variant === 'reaching-arm') {
    calcifiedSegment(ctx, cx + lean + side * 5, shoulderY + 2, cx + side * 19, chestY + 1, PALETTE.outline, 4);
    calcifiedSegment(ctx, cx + lean + side * 5, shoulderY + 2, cx + side * 19, chestY + 1, dust, 2);
    px(ctx, cx + side * 20 - 1, chestY, bone, 4, 3);
    calcifiedSegment(ctx, cx + lean - side * 4, shoulderY + 3, cx + lean - side * 5, chestY + 10, shade, 2);
  } else {
    calcifiedSegment(ctx, cx + lean - 5, shoulderY + 2, cx + lean - 9, chestY + 8, dust, 2);
    calcifiedSegment(ctx, cx + lean + 5, shoulderY + 2, cx + lean + 7, chestY + 8, dust, 2);
  }

  if (variant === 'thorned-back') {
    for (let i = 0; i < 5; i += 1) {
      const bx = cx + lean - 8 + i * 4;
      calcifiedSegment(ctx, bx, shoulderY + 4, bx + (i % 2 ? side : -side) * (3 + (i % 3)), shoulderY - 4 - (i % 2), bone, 1);
      px(ctx, bx + (i % 2 ? side : -side) * 4, shoulderY - 6 - (i % 2), PALETTE.outline, 1, 1);
    }
  }
  if (variant === 'collapsed-shoulder') {
    px(ctx, cx + lean - side * 8, shoulderY + 1, shade, 8, 4);
    calcifiedSegment(ctx, cx + lean - side * 6, shoulderY + 4, cx + lean - side * 13, chestY + 11, dust, 2);
  }
  if (variant === 'buried-lower-body') {
    for (let i = 0; i < 5; i += 1) px(ctx, cx - 16 + i * 7, cy - 8 + (i % 2), dust, 3, 1);
    calcifiedSegment(ctx, cx + lean + 4, chestY + 7, cx + lean + side * 11, cy - 10, shade, 2);
  }

  // Dead seams and old cuts. No glow: the Stilling left this hard and drained.
  calcifiedSegment(ctx, cx + lean - side * 2, shoulderY + 5, cx + lean - side * 4, hipY - 2, deadVein, 1);
  if (variantIndex % 2 === 0) px(ctx, cx + lean - 5, chestY + 10, cut, 9, 1);
  if (variantIndex % 3 === 0) px(ctx, cx + lean + 2, hipY - 4, PALETTE.hostBlack, 2, 2);
  drawNoisePixels(ctx, cx - 12, cy - 4, 24, 9, [cut, shade], 0.06, seed + variantIndex);
}

export function drawDeadCultist(ctx, cx, cy, seed) {
  const rng = rngFrom(hash2D(seed + 151, seed * 5 + 9));
  const flip = (seed & 1) ? 1 : -1;
  const slump = Math.floor(rng() * 3) - 1;
  drawShadowBlob(ctx, cx, cy + 4, 50, 19);
  ctx.save();
  ctx.globalAlpha = 0.84;
  drawIsoDiamond(ctx, cx + flip * 2, cy + 3, 41, 18, PALETTE.rustDark);
  ctx.restore();
  drawNoisePixels(ctx, cx - 26, cy - 8, 54, 25, [PALETTE.hostRed, PALETTE.rustDark, PALETTE.void], 0.08, seed);

  const headX = cx + flip * (16 + slump);
  const headY = cy - 10 + slump;
  const bootX = cx - flip * 18;

  // Crumpled Choir body: cowl, robe, stole, knife, and belt all mirror the
  // living cultist silhouette instead of a generic cloth lump.
  for (let row = 0; row < 13; row += 1) {
    const spread = row < 7 ? row : 12 - row;
    const w = 20 + spread * 3;
    const drag = flip * Math.floor(row * 0.35) - slump;
    const x = cx - Math.floor(w / 2) + drag;
    const y = cy - 11 + row;
    const tone = row < 3 ? PALETTE.clothRed : row < 9 ? PALETTE.clothDark : PALETTE.rustDark;
    px(ctx, x - 1, y, PALETTE.outline, w + 2, 1);
    px(ctx, x, y, tone, w, 1);
    if (row < 8) px(ctx, x + 2, y, row % 2 ? PALETTE.rustMid : PALETTE.clothRed, 2, 1);
    if (row === 4 || row === 8) px(ctx, x + w - 5, y, PALETTE.hostGold, 2, 1);
  }

  // Hooded head with a dark face slit and slack jaw.
  px(ctx, headX - 5, headY - 2, PALETTE.outline, 12, 10);
  px(ctx, headX - 4, headY - 1, PALETTE.clothDark, 10, 4);
  px(ctx, headX - 3, headY + 2, PALETTE.skinDark, 7, 5);
  px(ctx, headX - 3, headY + 2, PALETTE.void, 6, 2);
  px(ctx, headX + flip * 1, headY + 6, PALETTE.hostRed, 4, 1);
  px(ctx, headX - flip * 2, headY, PALETTE.hostBone, 1, 1);

  // Stained stole crossing the torso, plus a small sacrament strip at the throat.
  linePx(ctx, cx - flip * 8, cy - 10, cx + flip * 3, cy + 3, PALETTE.clothRed, 2);
  linePx(ctx, cx - flip * 5, cy - 10, cx + flip * 7, cy + 2, PALETTE.hostRed, 1);
  px(ctx, cx + flip * 5, cy - 4, PALETTE.hostGold, 1, 4);
  px(ctx, cx - 9, cy - 1, PALETTE.rustMid, 18, 1);

  // Outflung arms and real hands; the posture stays human and small.
  linePx(ctx, cx + flip * 2, cy - 4, cx + flip * 20, cy + 2, PALETTE.outline, 4);
  linePx(ctx, cx + flip * 2, cy - 4, cx + flip * 20, cy + 2, PALETTE.clothDark, 2);
  px(ctx, cx + flip * 21, cy + 2, PALETTE.skinMid, 3, 2);
  linePx(ctx, cx - flip * 2, cy - 3, cx - flip * 12, cy + 8, PALETTE.outline, 4);
  linePx(ctx, cx - flip * 2, cy - 3, cx - flip * 12, cy + 8, PALETTE.rustDark, 2);
  px(ctx, cx - flip * 12, cy + 8, PALETTE.skinDark, 2, 2);

  // Boots, hooked rite knife, and small belt gear.
  px(ctx, bootX - flip * 2, cy - 1, PALETTE.outline, 10, 4);
  px(ctx, bootX - flip * 1, cy, PALETTE.stoneDark, 7, 2);
  px(ctx, bootX - flip * 4, cy + 4, PALETTE.outline, 8, 4);
  px(ctx, bootX - flip * 3, cy + 5, PALETTE.stoneDark, 6, 2);
  linePx(ctx, cx - flip * 13, cy + 5, cx - flip * 3, cy + 8, PALETTE.hostBone, 1);
  px(ctx, cx - flip * 14, cy + 5, PALETTE.stoneLight, 1, 2);
  px(ctx, cx + flip * 9, cy - 1, PALETTE.rustMid, 4, 4);
  px(ctx, cx + flip * 9, cy - 1, PALETTE.hostGold, 4, 1);

  for (let i = 0; i < 7; i += 1) {
    px(ctx, cx - 17 + Math.floor(rng() * 35), cy - 5 + Math.floor(rng() * 14), PALETTE.hostRed, 1, 1);
  }
}

function wolfBody(ctx, cx, cy, seed, opts = {}) {
  const rng = rngFrom(hash2D(seed + 43, seed * 11 + 5));
  const flip = opts.flip ?? ((seed & 1) ? 1 : -1);
  const lift = opts.lift ?? 0;
  drawShadowBlob(ctx, cx, cy + 4, 62, 21);
  ctx.save();
  ctx.globalAlpha = 0.82;
  drawIsoDiamond(ctx, cx + flip * 2, cy + 5, 48, 20, PALETTE.rustDark);
  ctx.restore();
  drawNoisePixels(ctx, cx - 25, cy - 5, 51, 19, [PALETTE.hostBlack, PALETTE.rustDark], 0.05, seed);

  // Fallen wolf torso: long animal spine, low hips, black Host hide, and a
  // still-readable canine body under the infection.
  for (let row = 0; row < 15; row += 1) {
    const core = row < 8 ? row : 14 - row;
    const w = 25 + core * 4;
    const x = cx - Math.floor(w / 2) - flip * 3 + (row > 9 ? flip * 2 : 0);
    const y = cy - 14 + row - lift;
    const tone = row < 4 ? PALETTE.stoneMid : row < 11 ? PALETTE.hostBlack : PALETTE.void;
    px(ctx, x - 1, y, PALETTE.outline, w + 2, 1);
    px(ctx, x, y, tone, w, 1);
    if (row < 5) px(ctx, x + 2, y, PALETTE.stoneDust, 3, 1);
    if (row > 4 && row < 11 && row % 3 === 0) px(ctx, x + 7, y, PALETTE.hostGold, Math.max(2, w - 18), 1);
    if (row === 6 || row === 9) px(ctx, x + w - 7, y, PALETTE.hostBone, 4, 1);
  }

  // Four original wolf legs, broken and slack under the body.
  const legRoots = [-18, -8, 8, 18];
  for (let i = 0; i < legRoots.length; i += 1) {
    const leg = legRoots[i];
    const kneeX = cx + leg + flip * (2 + Math.floor(rng() * 4));
    const kneeY = cy - 3 + (i % 2) - lift;
    const pawX = kneeX + flip * (5 + Math.floor(rng() * 6));
    const pawY = cy + 9 + (i % 2);
    linePx(ctx, cx + leg, cy - 7 - lift, kneeX, kneeY, PALETTE.outline, 4);
    linePx(ctx, kneeX, kneeY, pawX, pawY, PALETTE.outline, 3);
    linePx(ctx, cx + leg, cy - 7 - lift, kneeX, kneeY, i < 2 ? PALETTE.stoneDark : PALETTE.hostBlack, 2);
    linePx(ctx, kneeX, kneeY, pawX, pawY, PALETTE.stoneDark, 1);
    px(ctx, pawX - 1, pawY, PALETTE.hostBone, 4, 1);
  }

  // Torn tail and two limp tendrils. The dead body has no glow.
  linePx(ctx, cx - flip * 24, cy - 10 - lift, cx - flip * 41, cy - 17 - lift, PALETTE.outline, 4);
  linePx(ctx, cx - flip * 24, cy - 10 - lift, cx - flip * 40, cy - 17 - lift, PALETTE.hostBlack, 2);
  px(ctx, cx - flip * 42, cy - 19 - lift, PALETTE.hostBone, 2, 2);
  for (let i = 0; i < 2; i += 1) {
    const rootX = cx - flip * (6 + i * 7);
    const rootY = cy - 10 + i * 2 - lift;
    const tipX = rootX - flip * (13 + i * 5);
    const tipY = cy + 5 + i * 3;
    linePx(ctx, rootX, rootY, tipX, tipY, PALETTE.outline, 3);
    linePx(ctx, rootX, rootY, tipX, tipY, i ? PALETTE.hostRed : PALETTE.hostBlack, 1);
    px(ctx, tipX, tipY, PALETTE.hostGold, 1, 1);
  }

  return {
    flip,
    rng,
    headX: cx + flip * 22,
    headY: cy - 17 - lift,
    chestX: cx + flip * 2,
    chestY: cy - 13 - lift
  };
}

function drawDeadWolfSkull(ctx, hx, hy, flip, opts = {}) {
  const openJaw = opts.openJaw ?? false;
  const halo = opts.halo ?? false;

  // Goat-wolf skull: long muzzle, deep socket, asymmetrical horns.
  px(ctx, hx - 7, hy - 5, PALETTE.outline, 15, 10);
  px(ctx, hx - 6, hy - 4, PALETTE.hostBone, 12, 8);
  px(ctx, hx + flip * 3, hy - 2, PALETTE.void, 3, 3);
  px(ctx, hx + flip * 5, hy + 1, PALETTE.hostBlack, 7, 3);
  px(ctx, hx + flip * 8, hy + 2, PALETTE.hostBone, 5, 2);
  px(ctx, hx + flip * 10, hy + 4, PALETTE.hostBlack, 4, 1);
  if (openJaw) {
    px(ctx, hx + flip * 5, hy + 5, PALETTE.outline, 10, 4);
    px(ctx, hx + flip * 5, hy + 5, PALETTE.void, 8, 3);
    for (let t = 0; t < 4; t += 1) px(ctx, hx + flip * (5 + t * 2), hy + 4, PALETTE.hostBone, 1, 3);
  }

  linePx(ctx, hx - flip * 4, hy - 6, hx - flip * 11, hy - 14, PALETTE.outline, 3);
  linePx(ctx, hx - flip * 4, hy - 6, hx - flip * 10, hy - 13, PALETTE.hostBone, 1);
  px(ctx, hx - flip * 8, hy - 10, PALETTE.stoneDust, 2, 1);
  px(ctx, hx - flip * 11, hy - 13, PALETTE.hostBone, 2, 1);
  linePx(ctx, hx + flip * 3, hy - 6, hx + flip * 8, hy - 9, PALETTE.outline, 3);
  linePx(ctx, hx + flip * 3, hy - 6, hx + flip * 7, hy - 8, PALETTE.hostBone, 1);
  px(ctx, hx + flip * 8, hy - 8, PALETTE.outline, 2, 1);
  px(ctx, hx + flip * 1, hy, PALETTE.hostGold, 1, 1);

  if (halo) {
    for (let h = 0; h < 7; h += 1) {
      const dx = -11 + h * 4;
      if (h === 2 || h === 5) continue;
      px(ctx, hx + dx, hy - 12 - (h % 2), h === 4 ? PALETTE.hostGold : PALETTE.hostBone, 2, 1);
    }
  }
}

export function drawDeadHostWolfSpider(ctx, cx, cy, seed) {
  const { flip, rng, headX, headY } = wolfBody(ctx, cx, cy, seed, {});
  drawDeadWolfSkull(ctx, headX, headY, flip, { halo: true });

  // Spidering Host limbs erupted from the shoulders, then folded under after
  // death. Every pair is uneven so the body does not read as a clean insect.
  for (let i = 0; i < 6; i += 1) {
    const side = i < 3 ? -1 : 1;
    const baseX = cx + flip * 1 + side * (6 + (i % 3) * 5);
    const baseY = cy - 14 + (i % 3);
    const kneeX = baseX + side * (13 + Math.floor(rng() * 8));
    const kneeY = baseY - 10 - Math.floor(rng() * 7);
    const tipX = kneeX + side * (8 + Math.floor(rng() * 8));
    const tipY = kneeY + 15 + Math.floor(rng() * 8);
    linePx(ctx, baseX, baseY, kneeX, kneeY, PALETTE.outline, 3);
    linePx(ctx, kneeX, kneeY, tipX, tipY, PALETTE.outline, 3);
    linePx(ctx, baseX, baseY, kneeX, kneeY, i % 2 ? PALETTE.hostBone : PALETTE.hostRed, 1);
    linePx(ctx, kneeX, kneeY, tipX, tipY, i % 2 ? PALETTE.stoneDust : PALETTE.hostGold, 1);
    px(ctx, tipX, tipY, PALETTE.void, 2, 2);
  }
  px(ctx, cx - 3, cy - 11, PALETTE.hostRed, 7, 5);
  px(ctx, cx - 1, cy - 10, PALETTE.hostGold, 1, 5);
  drawNoisePixels(ctx, cx - 29, cy - 13, 60, 26, [PALETTE.hostRed, PALETTE.rustDark], 0.08, seed);
}

export function drawDeadHostWolfMaw(ctx, cx, cy, seed) {
  const { flip, rng, headX, headY } = wolfBody(ctx, cx, cy, seed, {});
  const hx = headX;
  const hy = headY;

  // Head opened into a dead chapel-mouth. The throat is black, with bone teeth
  // and a slack goat-wolf skull frame, not a bright living wound.
  px(ctx, hx - 9, hy - 8, PALETTE.outline, 21, 16);
  px(ctx, hx - 7, hy - 7, PALETTE.hostBone, 16, 6);
  px(ctx, hx - 8, hy - 2, PALETTE.hostBlack, 20, 9);
  px(ctx, hx - 6, hy - 1, PALETTE.void, 16, 7);
  for (let t = 0; t < 9; t += 1) {
    const tx = hx - 6 + t * 2;
    px(ctx, tx, hy - 2 + (t % 2), PALETTE.hostBone, 1, 4);
    if (t < 8) px(ctx, tx + 1, hy + 5 - (t % 2), PALETTE.hostBone, 1, 3);
  }
  linePx(ctx, hx - flip * 5, hy - 9, hx - flip * 13, hy - 16, PALETTE.outline, 3);
  linePx(ctx, hx - flip * 5, hy - 9, hx - flip * 12, hy - 15, PALETTE.hostBone, 1);
  px(ctx, hx + flip * 5, hy - 9, PALETTE.hostBone, 4, 2);
  px(ctx, hx + flip * 7, hy - 9, PALETTE.outline, 2, 1);

  // Prayer-fused forelegs caught against the opened throat.
  linePx(ctx, cx + flip * 1, cy - 8, hx - flip * 5, hy + 6, PALETTE.outline, 4);
  linePx(ctx, cx + flip * 1, cy - 8, hx - flip * 5, hy + 6, PALETTE.stoneDark, 2);
  linePx(ctx, cx + flip * 6, cy - 4, hx - flip * 1, hy + 8, PALETTE.outline, 4);
  linePx(ctx, cx + flip * 6, cy - 4, hx - flip * 1, hy + 8, PALETTE.hostBone, 1);
  px(ctx, hx - flip * 3, hy + 8, PALETTE.hostGold, 1, 2);
  for (let i = 0; i < 4; i += 1) {
    const tx = hx - flip * (1 + i * 3);
    linePx(ctx, tx, hy + 6, tx - flip * (6 + i), hy + 12 + i, i % 2 ? PALETTE.hostRed : PALETTE.hostBlack, 1);
    px(ctx, tx - flip * (7 + i), hy + 12 + i, PALETTE.hostGold, 1, 1);
  }
  drawNoisePixels(ctx, cx - 27, cy - 12, 58, 26, [PALETTE.hostRed, PALETTE.rustDark, PALETTE.hostBlack], 0.09, seed);
}

export function drawDeadHostWolfRibsplit(ctx, cx, cy, seed) {
  const { flip, chestX, chestY, headX, headY } = wolfBody(ctx, cx, cy, seed, {});

  // Butterflied ribcage in the torso, readable as a Host sacrament gone animal.
  px(ctx, chestX - 8, chestY - 2, PALETTE.void, 17, 10);
  px(ctx, chestX - 6, chestY - 1, PALETTE.hostBlack, 13, 8);
  for (let r = 0; r < 6; r += 1) {
    linePx(ctx, chestX - 2, chestY + r * 2, chestX - 17 - r, chestY - 7 + r, PALETTE.outline, 2);
    linePx(ctx, chestX + 2, chestY + r * 2, chestX + 16 + r, chestY - 5 + r, PALETTE.outline, 2);
    linePx(ctx, chestX - 2, chestY + r * 2, chestX - 16 - r, chestY - 7 + r, PALETTE.hostBone, 1);
    linePx(ctx, chestX + 2, chestY + r * 2, chestX + 15 + r, chestY - 5 + r, PALETTE.stoneDust, 1);
    if (r % 2 === 0) px(ctx, chestX - 13 - r, chestY - 4 + r, PALETTE.hostGold, 1, 1);
  }
  px(ctx, chestX, chestY - 3, PALETTE.hostGold, 1, 13);
  px(ctx, chestX + 2, chestY + 4, PALETTE.rustDark, 3, 3);
  linePx(ctx, chestX + flip * 4, chestY + 4, cx - flip * 15, cy + 8, PALETTE.hostRed, 1);

  drawDeadWolfSkull(ctx, headX, headY, flip, { halo: true, openJaw: true });
  drawNoisePixels(ctx, cx - 30, cy - 13, 62, 27, [PALETTE.hostRed, PALETTE.rustDark], 0.07, seed);
}
