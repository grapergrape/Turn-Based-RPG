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

// Bone, corpse, martyr, and Host-body-horror primitives.

export function drawCorpseSilhouette(ctx, cx, cy, seed) {
  const rng = rngFrom(hash2D(seed + 29, seed * 7 + 11));
  drawShadowBlob(ctx, cx, cy + 3, 46, 18);
  // Dried blood pooled under the body.
  ctx.save();
  ctx.globalAlpha = 0.7;
  drawIsoDiamond(ctx, cx + 5, cy + 3, 30, 14, PALETTE.rustDark);
  ctx.restore();
  drawNoisePixels(ctx, cx - 4, cy - 1, 28, 13, [PALETTE.hostRed, PALETTE.rustDark], 0.08, seed);

  // A slumped, clearly human body lying along the tile.
  for (let row = 0; row < 8; row += 1) {
    const w = 30 - Math.abs(row - 3) * 3;
    const tone = row < 3 ? PALETTE.clothTan : row < 6 ? PALETTE.clothDark : PALETTE.stoneDark;
    px(ctx, cx - Math.floor(w / 2) - 5, cy - 6 + row, PALETTE.outline, w + 2, 1);
    px(ctx, cx - Math.floor(w / 2) - 4, cy - 6 + row, tone, w, 1);
    if (row === 2 || row === 5) px(ctx, cx - Math.floor(w / 2) - 1, cy - 6 + row, PALETTE.rustDark, Math.max(3, w - 8), 1);
  }
  px(ctx, cx - 20, cy - 6, PALETTE.outline, 2, 8);
  px(ctx, cx - 5, cy - 7, PALETTE.outline, 14, 2);
  px(ctx, cx - 4, cy - 8, PALETTE.clothTan, 8, 1);
  // Head + dark hair at one end, boots at the other.
  px(ctx, cx + 11, cy - 5, PALETTE.skinDark, 6, 5);
  px(ctx, cx + 11, cy - 5, PALETTE.skinMid, 5, 3);
  px(ctx, cx + 11, cy - 6, PALETTE.clothDark, 6, 2);
  px(ctx, cx - 19, cy - 1, PALETTE.stoneDark, 7, 3);
  px(ctx, cx - 20, cy - 2, PALETTE.outline, 10, 2);
  px(ctx, cx - 18, cy - 3, PALETTE.stoneDust, 5, 1);
  // A slack outflung arm and pale hand.
  linePx(ctx, cx - 2, cy - 2, cx - 12, cy - 9, PALETTE.outline, 3);
  linePx(ctx, cx - 2, cy - 2, cx - 11, cy - 9, PALETTE.clothDark, 1);
  px(ctx, cx - 14, cy - 10, PALETTE.skinDark, 3, 2);
  px(ctx, cx, cy + 1, PALETTE.clothDark, 8, 2);
  px(ctx, cx + 8, cy + 2, PALETTE.skinMid, 2, 2);
  px(ctx, cx + 5, cy - 1, PALETTE.hostRed, 5, 1);
  px(ctx, cx + 2, cy + 4, PALETTE.rustDark, 8, 1);
  for (let i = 0; i < 5; i += 1) {
    px(ctx, cx - 22 + Math.floor(rng() * 45), cy - 5 + Math.floor(rng() * 16), rng() < 0.5 ? PALETTE.rustDark : PALETTE.stoneDust, 1 + (i & 1), 1);
  }
  drawRubbleCluster(ctx, cx + 23, cy + 8, seed + 31, 2);
}

function boneStroke(ctx, x0, y0, x1, y1, color, size = 1) {
  const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    px(ctx, Math.round(x0 + (x1 - x0) * t), Math.round(y0 + (y1 - y0) * t), color, size, size);
  }
}

function drawOssuaryLongBone(ctx, x0, y0, x1, y1, compact = false) {
  const bone = PALETTE.hostBone;
  const hi = PALETTE.stoneDust;
  const knob = compact ? 3 : 5;
  const body = compact ? 1 : 2;

  boneStroke(ctx, x0, y0 + 1, x1, y1 + 1, PALETTE.outline, body + 1);
  boneStroke(ctx, x0, y0, x1, y1, bone, body);
  boneStroke(
    ctx,
    Math.round(x0 + (x1 - x0) * 0.22),
    Math.round(y0 + (y1 - y0) * 0.22),
    Math.round(x0 + (x1 - x0) * 0.56),
    Math.round(y0 + (y1 - y0) * 0.56),
    hi,
    1
  );

  const cap = (x, y) => {
    px(ctx, x - Math.floor(knob / 2), y - 1, PALETTE.outline, knob, compact ? 3 : 4);
    px(ctx, x - 1, y - 1, bone, 3, compact ? 3 : 4);
    px(ctx, x - Math.floor(knob / 2), y, bone, knob, 2);
    px(ctx, x - 1, y - 1, hi, 2, 1);
  };
  cap(Math.round(x0), Math.round(y0));
  cap(Math.round(x1), Math.round(y1));
}

function drawOssuarySkull(ctx, sx, sy, compact = false, flip = 1) {
  const bone = PALETTE.hostBone;
  const hi = PALETTE.stoneDust;
  const dark = PALETTE.void;
  if (compact) {
    px(ctx, sx - 3, sy - 4, PALETTE.outline, 7, 8);
    px(ctx, sx - 2, sy - 5, PALETTE.outline, 5, 1);
    px(ctx, sx - 2, sy - 4, bone, 5, 6);
    px(ctx, sx - 3, sy - 2, bone, 7, 3);
    px(ctx, sx - 2, sy - 4, hi, 2, 1);
    px(ctx, sx - 1, sy - 2, dark, 1, 2);
    px(ctx, sx + 2, sy - 2, dark, 1, 2);
    px(ctx, sx, sy + 1, dark, 1, 2);
    px(ctx, sx - flip, sy + 3, PALETTE.outline, 4, 1);
    px(ctx, sx - flip, sy + 4, bone, 3, 1);
    return;
  }

  px(ctx, sx - 5, sy - 6, PALETTE.outline, 11, 10);
  px(ctx, sx - 3, sy - 8, PALETTE.outline, 7, 3);
  px(ctx, sx - 4, sy - 6, bone, 9, 8);
  px(ctx, sx - 2, sy - 8, bone, 5, 3);
  px(ctx, sx - 3, sy - 7, hi, 4, 1);
  px(ctx, sx - 3, sy - 3, dark, 2, 3);
  px(ctx, sx + 2, sy - 3, dark, 2, 3);
  px(ctx, sx - 1, sy, PALETTE.stoneDark, 3, 2);
  px(ctx, sx - 3, sy + 3, PALETTE.outline, 7, 3);
  px(ctx, sx - 2, sy + 3, bone, 5, 2);
  px(ctx, sx - 1, sy + 4, dark, 1, 1);
  px(ctx, sx + 2, sy + 4, dark, 1, 1);
}

export function drawBonePile(ctx, cx, cy, seed) {
  drawShadowBlob(ctx, cx, cy + 4, 44, 17);
  const rng = rngFrom(hash2D(seed + 61, seed * 9 + 7));
  drawIsoDiamond(ctx, cx, cy + 5, 42, 16, PALETTE.outline);
  drawIsoDiamond(ctx, cx, cy + 4, 35, 13, PALETTE.stoneDark);
  for (let i = 0; i < 7; i += 1) {
    const x0 = cx + Math.floor((rng() - 0.5) * 28);
    const y0 = cy + Math.floor((rng() - 0.5) * 9);
    const len = 8 + Math.floor(rng() * 12);
    const lean = Math.floor(rng() * 5) - 2;
    drawOssuaryLongBone(ctx, x0, y0, x0 + len, y0 + lean, true);
  }
  drawOssuarySkull(ctx, cx - 4, cy - 5, false, rng() < 0.5 ? -1 : 1);
  drawOssuarySkull(ctx, cx + 9, cy + 1, true, 1);
  drawOssuarySkull(ctx, cx - 15, cy + 2, true, -1);
  for (let rib = 0; rib < 5; rib += 1) {
    const rx = cx - 14 + rib * 6 + Math.floor(rng() * 2);
    const ry = cy - 1 + Math.floor(rng() * 5);
    boneStroke(ctx, rx, ry - 4, rx + 2, ry + 2, PALETTE.hostBone, 1);
    px(ctx, rx + 2, ry + 2, PALETTE.outline, 2, 1);
  }
  for (const [x0, y0, x1, y1] of [
    [cx - 18, cy + 6, cx - 5, cy + 9],
    [cx + 2, cy + 8, cx + 18, cy + 4],
    [cx - 8, cy - 10, cx + 6, cy - 12]
  ]) {
    drawOssuaryLongBone(ctx, x0, y0, x1, y1, true);
  }
  px(ctx, cx + 14, cy - 6, PALETTE.outline, 8, 3);
  px(ctx, cx + 15, cy - 7, PALETTE.hostBone, 5, 2);
  px(ctx, cx + 17, cy - 7, PALETTE.void, 1, 1);
  drawNoisePixels(ctx, cx - 22, cy - 12, 44, 24, [PALETTE.stoneDust, PALETTE.rustDark, PALETTE.hostBone], 0.035, seed);
}

export function drawSkeleton(ctx, cx, cy, seed, opts = {}) {
  const bone = PALETTE.hostBone;
  const hi = PALETTE.stoneDust;
  const dark = PALETTE.void;
  const rng = rngFrom(hash2D(seed + 23, seed * 7 + 3));
  const flip = rng() < 0.5 ? 1 : -1; // head left or right
  drawShadowBlob(ctx, cx, cy + 3, 30, 13);

  const hx = cx + flip * 9; // skull at one end
  const hy = cy - 1;
  // Spine running from the skull toward the pelvis.
  for (let i = 0; i < 9; i += 1) {
    px(ctx, Math.round(hx - flip * (3 + i * 1.5)), hy + 1 + (i % 2), bone, 2, 1);
  }
  // Ribcage: a few curved ribs off the upper spine.
  for (let r = 0; r < 4; r += 1) {
    const rx = Math.round(hx - flip * (4 + r * 2));
    boneStroke(ctx, rx, hy - 4, rx - flip * 2, hy - 1, bone, 1);
    boneStroke(ctx, rx, hy + 4, rx - flip * 2, hy + 1, bone, 1);
    px(ctx, rx - (flip > 0 ? 1 : 0), hy - 4, hi, 2, 1);
  }
  // Pelvis at the far end.
  const pelX = Math.round(hx - flip * 17);
  px(ctx, pelX - 3, hy - 1, PALETTE.outline, 8, 5);
  px(ctx, pelX - 2, hy - 1, bone, 6, 4);
  px(ctx, pelX, hy, dark, 2, 2);
  // Splayed limb long-bones.
  drawOssuaryLongBone(ctx, Math.round(hx - flip * 8), hy + 5, Math.round(hx - flip * 1), hy + 9, true);
  drawOssuaryLongBone(ctx, Math.round(hx - flip * 12), hy + 5, Math.round(hx - flip * 20), hy + 8, true);
  drawOssuaryLongBone(ctx, pelX - flip * 1, hy + 3, pelX - flip * 10, hy + 11, true);
  drawOssuaryLongBone(ctx, pelX + flip * 2, hy + 2, pelX + flip * 8, hy + 8, true);
  drawOssuarySkull(ctx, hx, hy - 1, false, flip);
  px(ctx, hx + flip * 5, hy - 6, PALETTE.outline, 5, 3);
  px(ctx, hx + flip * 5, hy - 7, PALETTE.stoneDust, 3, 1);
  for (let i = 0; i < 4; i += 1) {
    const fx = Math.round(hx - flip * (5 + i * 2));
    px(ctx, fx, hy + 10 + (i & 1), PALETTE.outline, 3, 2);
    px(ctx, fx + (flip > 0 ? 1 : 0), hy + 9 + (i & 1), bone, 1, 1);
  }
  for (let i = 0; i < 5; i += 1) {
    px(ctx, cx - 18 + Math.floor(rng() * 37), cy + 2 + Math.floor(rng() * 8), rng() < 0.5 ? PALETTE.hostBone : PALETTE.stoneDust, 2, 1);
  }
  drawRubbleCluster(ctx, cx + flip * 18, cy + 8, seed + 27, 2);
  drawNoisePixels(ctx, cx - 15, cy - 6, 30, 14, [PALETTE.stoneDust, PALETTE.rustDark], 0.03, seed);
}

export function drawBoneNiche(ctx, cx, cy, seed, opts = {}) {
  const stone = PALETTE.stoneMid;
  const lo = PALETTE.stoneDark;
  const dust = PALETTE.stoneDust;
  const bone = PALETTE.hostBone;
  const dark = PALETTE.void;
  const rng = rngFrom(hash2D(seed + 41, seed * 5 + 9));
  const w = 31;
  const h = 35;
  const top = cy - h + 4;
  const x = Math.round(cx - w / 2);

  drawShadowBlob(ctx, cx, cy + 4, 34, 14);
  px(ctx, x - 2, top - 2, PALETTE.outline, w + 4, h + 4);
  px(ctx, x - 1, top - 1, lo, w + 2, h + 2);
  px(ctx, x + 2, top + 4, dark, w - 4, h - 7); // deep recess
  px(ctx, x - 4, top - 5, PALETTE.outline, w + 8, 5); // heavy lintel
  px(ctx, x - 3, top - 5, stone, w + 6, 4);
  px(ctx, x - 3, top - 5, dust, w + 4, 1);
  px(ctx, x - 3, top - 1, PALETTE.outline, 4, h + 1); // left jamb
  px(ctx, x - 2, top, stone, 3, h);
  px(ctx, x + w - 1, top - 1, PALETTE.outline, 4, h + 1); // right jamb
  px(ctx, x + w, top, stone, 3, h);
  px(ctx, x, top + h - 3, PALETTE.outline, w + 2, 4);
  px(ctx, x + 1, top + h - 4, stone, w - 1, 3);
  px(ctx, x + 3, top + 2, PALETTE.outline, w - 6, 1);
  linePx(ctx, x + 1, top - 3, x + w - 5, top - 4, PALETTE.stoneDust, 1);
  linePx(ctx, x - 2, top + 7, x - 2, top + h - 5, PALETTE.stoneDust, 1);
  linePx(ctx, x + w + 1, top + 5, x + w + 1, top + h - 6, PALETTE.outline, 1);
  drawCracks(ctx, x + Math.floor(w / 2), top + 2, seed + 11, 2);

  // Three uneven shelves of skulls, femurs, ribs and gaps.
  for (let row = 0; row < 3; row += 1) {
    const ry = top + 8 + row * 8;
    px(ctx, x + 3, ry + 4, PALETTE.outline, w - 6, 2);
    px(ctx, x + 4, ry + 3, stone, w - 8, 2);
    px(ctx, x + 5, ry - 4, dark, w - 10, 5);

    const leftLean = Math.floor(rng() * 3) - 1;
    const rightLean = Math.floor(rng() * 3) - 1;
    if (row === 0) {
      drawOssuarySkull(ctx, x + 8, ry - 1, true, -1);
      drawOssuaryLongBone(ctx, x + 13, ry + 1, x + w - 7, ry + leftLean, true);
      drawOssuaryLongBone(ctx, x + 11, ry + 3, x + w - 10, ry + 4 + rightLean, true);
    } else if (row === 1) {
      drawOssuaryLongBone(ctx, x + 5, ry + 2, x + w - 7, ry - 1 + leftLean, true);
      drawOssuaryLongBone(ctx, x + 7, ry - 2, x + w - 9, ry + 3 + rightLean, true);
      for (let rib = 0; rib < 5; rib += 1) {
        const rx = x + 7 + rib * 4 + Math.floor(rng() * 2);
        boneStroke(ctx, rx, ry - 5, rx + 1, ry + 2, bone, 1);
        px(ctx, rx + 1, ry + 1, PALETTE.outline, 2, 1);
      }
    } else {
      drawOssuaryLongBone(ctx, x + 5, ry + 1, x + w - 12, ry + 2 + leftLean, true);
      drawOssuaryLongBone(ctx, x + 6, ry + 3, x + w - 14, ry + rightLean, true);
      drawOssuarySkull(ctx, x + w - 9, ry, true, 1);
      for (let rib = 0; rib < 3; rib += 1) {
        const rx = x + 7 + rib * 4 + Math.floor(rng() * 2);
        boneStroke(ctx, rx, ry - 4, rx + 2, ry + 1, bone, 1);
      }
    }
    px(ctx, x + 4, ry + 4, dust, 3, 1);
    px(ctx, x + w - 8, ry + 4, PALETTE.stoneDark, 4, 1);
  }
  // A few loose pale fragments catch the eye at the base.
  drawOssuaryLongBone(ctx, x + 5, cy - 1, x + 15, cy + 2, true);
  px(ctx, x + w - 7, cy - 2, bone, 4, 2);
  px(ctx, x + w - 8, cy - 3, PALETTE.outline, 6, 1);
  for (const [dx, dy] of [[4, h - 6], [w - 6, 5], [w - 4, h - 11]]) {
    px(ctx, x + dx - 1, top + dy - 1, PALETTE.outline, 5, 3);
    px(ctx, x + dx, top + dy - 1, dust, 2, 1);
  }
  drawNoisePixels(ctx, x, top, w, h, [lo, PALETTE.stoneDark, PALETTE.rustDark], 0.055, seed);
}

export function drawStoneTomb(ctx, cx, cy, seed, opts = {}) {
  const opened = Boolean(opts.opened);
  const rng = rngFrom(hash2D(seed + 197, seed * 5 + 37));
  const stone = PALETTE.stoneMid;
  const hi = PALETTE.stoneLight;
  const lo = PALETTE.stoneDark;
  const dust = PALETTE.stoneDust;
  const slide = opened ? 11 : 5;
  const ly = cy - 16; // top-cap height of the body

  drawShadowBlob(ctx, cx, cy + 5, 58, 20);
  drawIsoPrism(ctx, cx, cy, 48, 25, 18, { top: lo, left: stone, right: PALETTE.stoneDark, outline: PALETTE.outline });
  linePx(ctx, cx - 23, cy - 4, cx + 21, cy - 15, PALETTE.outline, 1);
  linePx(ctx, cx - 21, cy - 5, cx + 18, cy - 15, dust, 1);
  linePx(ctx, cx - 18, cy + 2, cx + 24, cy - 8, PALETTE.stoneDark, 1);
  for (const dx of [-19, 19]) {
    px(ctx, cx + dx - 4, cy - 24, PALETTE.outline, 9, 23);
    px(ctx, cx + dx - 3, cy - 23, dx < 0 ? PALETTE.stoneDust : PALETTE.stoneDark, 7, 20);
    px(ctx, cx + dx - 4, cy - 28, PALETTE.outline, 9, 5);
    px(ctx, cx + dx - 3, cy - 27, PALETTE.hostBone, 5, 2);
    px(ctx, cx + dx - 3, cy - 16, PALETTE.outline, 7, 2);
    px(ctx, cx + dx - 2, cy - 17, dx < 0 ? PALETTE.stoneLight : lo, 4, 1);
  }
  // The open cavity (lid dragged toward the lower-left).
  drawIsoDiamond(ctx, cx, ly, 41, 22, PALETTE.outline);
  drawIsoDiamond(ctx, cx, ly, 36, 20, PALETTE.void);
  drawIsoDiamond(ctx, cx + 2, ly, 28, 15, PALETTE.hostBlack);
  if (opened) {
    px(ctx, cx - 7, ly, PALETTE.hostBone, 14, 2); // long-bones
    px(ctx, cx - 4, ly - 3, PALETTE.outline, 8, 7); // skull
    px(ctx, cx - 3, ly - 3, PALETTE.hostBone, 6, 6);
    px(ctx, cx - 2, ly - 1, PALETTE.void, 2, 2);
    px(ctx, cx + 1, ly - 1, PALETTE.void, 2, 2);
    px(ctx, cx + 8, ly + 2, PALETTE.rustDark, 9, 1);
  }
  // The slid lid slab, sitting proud to one side.
  drawIsoDiamond(ctx, cx + slide, ly - 4, 48, 25, PALETTE.outline);
  drawIsoDiamond(ctx, cx + slide, ly - 5, 45, 23, stone);
  drawIsoDiamond(ctx, cx + slide - 1, ly - 6, 35, 18, hi);
  px(ctx, cx + slide - 24, ly - 7, PALETTE.outline, 8, 4);
  px(ctx, cx + slide - 23, ly - 8, lo, 5, 2);
  px(ctx, cx + slide + 15, ly - 12, PALETTE.outline, 7, 3);
  px(ctx, cx + slide + 16, ly - 12, dust, 4, 1);
  // A worn Remnant sun-cross carved on the lid.
  px(ctx, cx + slide - 1, ly - 13, PALETTE.outline, 4, 13);
  px(ctx, cx + slide, ly - 12, dust, 2, 11);
  px(ctx, cx + slide - 8, ly - 8, PALETTE.outline, 17, 4);
  px(ctx, cx + slide - 7, ly - 7, dust, 15, 2);
  linePx(ctx, cx + slide - 15, ly - 2, cx + slide + 16, ly - 12, PALETTE.stoneDark, 1);
  for (let i = 0; i < 5; i += 1) {
    const x = cx + slide - 17 + Math.floor(rng() * 35);
    const y = ly - 15 + Math.floor(rng() * 18);
    px(ctx, x, y, rng() < 0.55 ? PALETTE.stoneDark : PALETTE.hostBone, 1 + (i & 1), 1);
  }
  drawNoisePixels(ctx, cx - 24, cy - 22, 52, 28, [lo, PALETTE.stoneDark], 0.045, seed);
  drawNoisePixels(ctx, cx - 27, cy - 4, 55, 12, [PALETTE.stoneDark, PALETTE.rustDark, PALETTE.hostBone], 0.04, seed + 7);
}

export function drawGraveyardWall(ctx, cx, cy, seed, opts = {}) {
  const frame = isoFrame(cx, cy, opts.orient ?? 'se');
  const rng = rngFrom(hash2D(seed + 211, seed * 5 + 17));
  const len = 0.84 + (rng() > 0.58 ? 0.08 : 0);
  const chipped = rng() > 0.52;

  drawShadowBlob(ctx, cx, cy + 4, 57, 13);
  const box = orientedBox(ctx, frame, len, 0.18, 12, {
    top: chipped ? PALETTE.stoneMid : PALETTE.stoneLight,
    lit: PALETTE.stoneMid,
    shade: PALETTE.stoneDark,
    outline: PALETTE.outline
  });

  // Two separate cap stones with a broken seam, so the wall reads as graveyard
  // masonry rather than a plain fence rail.
  const capA = mixPoint(box.cap.left, box.cap.top, 0.42);
  const capB = mixPoint(box.cap.bottom, box.cap.right, 0.58);
  const capMid = mixPoint(capA, capB, 0.5);
  linePx(ctx, capA[0], capA[1], capMid[0] - 2, capMid[1] - 1, PALETTE.stoneDust, 1);
  linePx(ctx, capMid[0] + 2, capMid[1] + 1, capB[0], capB[1], PALETTE.stoneDust, 1);
  px(ctx, capMid[0] - 1, capMid[1] - 2, PALETTE.outline, 2, 4);
  if (chipped) {
    px(ctx, capMid[0] + 3, capMid[1] - 5, PALETTE.outline, 5, 3);
    px(ctx, capMid[0] + 4, capMid[1] - 5, PALETTE.stoneDark, 3, 2);
  }
  px(ctx, capMid[0] - 10, capMid[1] - 4, PALETTE.outline, 5, 3);
  px(ctx, capMid[0] - 9, capMid[1] - 5, PALETTE.hostBone, 3, 1);
  for (const t of [0.2, 0.5, 0.78]) {
    const a = mixPoint(box.cap.left, box.cap.top, t);
    const b = mixPoint(box.cap.bottom, box.cap.right, t + (t === 0.5 ? 0.06 : 0));
    linePx(ctx, a[0], a[1] + 2, b[0], b[1] + 1, t === 0.5 ? PALETTE.outline : PALETTE.stoneDark, 1);
  }

  const endA = frame.point(-len / 2, 0, 0);
  const endB = frame.point(len / 2, 0, 0);
  for (const [index, p] of [endA, endB].entries()) {
    const lift = index === 0 ? 1 : 0;
    px(ctx, p[0] - 5, p[1] - 18 - lift, PALETTE.outline, 11, 18 + lift);
    px(ctx, p[0] - 4, p[1] - 17 - lift, index === 0 ? PALETTE.stoneMid : PALETTE.stoneDark, 9, 15 + lift);
    px(ctx, p[0] - 4, p[1] - 19 - lift, PALETTE.hostBone, 9, 3);
    px(ctx, p[0] - 3, p[1] - 18 - lift, PALETTE.stoneDust, 4, 1);
    if ((seed + index) % 3 === 0) {
      px(ctx, p[0] + 2, p[1] - 10, PALETTE.outline, 2, 6);
      px(ctx, p[0] + 2, p[1] - 9, PALETTE.stoneLight, 1, 2);
    }
    if (index === 0) {
      px(ctx, p[0] - 1, p[1] - 28, PALETTE.outline, 3, 11);
      px(ctx, p[0], p[1] - 27, PALETTE.hostBone, 1, 9);
    }
    px(ctx, p[0] - 5, p[1] - 2, PALETTE.outline, 11, 3);
    px(ctx, p[0] - 3, p[1] - 3, index === 0 ? PALETTE.stoneDust : PALETTE.stoneDark, 6, 1);
  }

  for (let i = 0; i < 7; i += 1) {
    const t = 0.08 + i * 0.14 + rng() * 0.03;
    const p = mixPoint(box.cap.left, box.cap.right, t);
    const tone = i % 3 === 0 ? PALETTE.hostBone : i % 2 ? PALETTE.stoneDust : PALETTE.stoneDark;
    px(ctx, p[0] - 1, p[1] - 2 + (i % 2), tone, 2 + (i & 1), 1);
    if (i % 4 === 0) px(ctx, p[0] + 1, p[1] + 4, PALETTE.outline, 1, 5);
  }
  drawNoisePixels(ctx, cx - 26, cy - 15, 52, 19, [PALETTE.stoneDark, PALETTE.rustDark, PALETTE.stoneDust], 0.045, seed);
  drawRubbleCluster(ctx, cx + (seed & 1 ? 18 : -18), cy + 6, seed + 13, 2);
}

export function drawCalcifiedGravePlot(ctx, cx, cy, seed, opts = {}) {
  const frame = isoFrame(cx, cy, opts.orient ?? 'se');
  const rng = rngFrom(hash2D(seed + 223, seed * 3 + 31));
  const cracked = (seed % 5) === 0;
  const sunken = (seed % 4) === 1;
  const openAsh = (seed % 6) === 2;

  drawShadowBlob(ctx, cx, cy + 4, 50, 16);
  orientedBox(ctx, frame, 0.82, 0.52, sunken ? 3 : 5, {
    top: sunken ? PALETTE.stoneDark : PALETTE.stoneMid,
    lit: PALETTE.stoneDust,
    shade: PALETTE.stoneDark,
    outline: PALETTE.outline
  });

  const rim = [
    frame.point(-0.37, -0.22, 6),
    frame.point(0.37, -0.22, 6),
    frame.point(0.37, 0.22, 6),
    frame.point(-0.37, 0.22, 6)
  ];
  poly(ctx, PALETTE.outline, rim);
  const inset = [
    frame.point(-0.32, -0.18, 7),
    frame.point(0.31, -0.17, 7),
    frame.point(0.32, 0.18, 7),
    frame.point(-0.31, 0.18, 7)
  ];
  poly(ctx, PALETTE.stoneDark, inset);
  const fill = [
    frame.point(-0.26, -0.13, 8),
    frame.point(0.25, -0.12, 8),
    frame.point(0.26, 0.13, 8),
    frame.point(-0.25, 0.13, 8)
  ];
  poly(ctx, openAsh ? PALETTE.stoneDark : seed & 1 ? PALETTE.stoneMid : PALETTE.stoneLight, fill);

  const upperLipA = frame.point(-0.31, -0.18, 9);
  const upperLipB = frame.point(0.31, -0.17, 9);
  linePx(ctx, upperLipA[0], upperLipA[1], upperLipB[0], upperLipB[1], PALETTE.hostBone, 1);
  const lowerLipA = frame.point(-0.28, 0.16, 7);
  const lowerLipB = frame.point(0.28, 0.15, 7);
  linePx(ctx, lowerLipA[0], lowerLipA[1], lowerLipB[0], lowerLipB[1], PALETTE.stoneDark, 1);
  for (const t of [-0.22, 0, 0.22]) {
    const a = frame.point(t - 0.05, -0.16, 10);
    const b = frame.point(t + 0.05, 0.16, 10);
    linePx(ctx, a[0], a[1], b[0], b[1], PALETTE.outline, 2);
    linePx(ctx, a[0] + 1, a[1] - 1, b[0] + 1, b[1] - 1, t === 0 ? PALETTE.hostBone : PALETTE.stoneDust, 1);
  }
  const skull = frame.point(-0.21, -0.02, 12);
  px(ctx, skull[0] - 4, skull[1] - 4, PALETTE.outline, 9, 7);
  px(ctx, skull[0] - 3, skull[1] - 4, PALETTE.hostBone, 7, 5);
  px(ctx, skull[0] - 2, skull[1] - 2, PALETTE.void, 2, 2);
  px(ctx, skull[0] + 2, skull[1] - 2, PALETTE.void, 2, 2);
  px(ctx, skull[0] - 3, skull[1] + 1, PALETTE.outline, 7, 2);
  px(ctx, skull[0] - 2, skull[1] + 1, PALETTE.hostBone, 5, 1);
  const ribsA = frame.point(-0.03, -0.02, 12);
  for (let i = 0; i < 4; i += 1) {
    const left = frame.point(-0.02 - i * 0.025, -0.05 + i * 0.03, 12);
    const right = frame.point(0.16 - i * 0.025, 0.01 + i * 0.03, 12);
    linePx(ctx, left[0], left[1], right[0], right[1], PALETTE.hostBone, 1);
  }
  px(ctx, ribsA[0] - 1, ribsA[1] - 3, PALETTE.void, 4, 8);
  const hand = frame.point(0.22, 0.1, 12);
  px(ctx, hand[0] - 2, hand[1] - 1, PALETTE.outline, 6, 3);
  px(ctx, hand[0] - 1, hand[1] - 1, PALETTE.hostBone, 4, 1);

  if (cracked) {
    const a = frame.point(-0.22, -0.06, 9);
    const b = frame.point(0.2, 0.09, 9);
    linePx(ctx, a[0], a[1], b[0], b[1], PALETTE.outline, 1);
    linePx(ctx, a[0] + 3, a[1] - 1, b[0] - 2, b[1] - 2, PALETTE.stoneDark, 1);
  }
  if (openAsh) {
    const seamA = frame.point(-0.2, -0.03, 10);
    const seamB = frame.point(0.22, 0.03, 10);
    linePx(ctx, seamA[0], seamA[1], seamB[0], seamB[1], PALETTE.void, 2);
    linePx(ctx, seamA[0] + 2, seamA[1] - 1, seamB[0] - 1, seamB[1] - 2, PALETTE.stoneDark, 1);
  }
  for (let i = 0; i < 8; i += 1) {
    const p = frame.point(-0.35 + rng() * 0.7, -0.21 + rng() * 0.42, 9);
    const tone = rng() < 0.5 ? PALETTE.hostBone : rng() < 0.65 ? PALETTE.rustDark : PALETTE.stoneDust;
    px(ctx, p[0], p[1], tone, 1 + (i & 1), 1);
  }
  for (let r = 0; r < 2; r += 1) {
    const a = frame.point(-0.38 + rng() * 0.2, -0.1 + rng() * 0.2, 7);
    const b = frame.point(-0.24 + rng() * 0.18, 0.12 + rng() * 0.1, 7);
    linePx(ctx, a[0], a[1], b[0], b[1], PALETTE.woodDark, 1);
  }
  drawNoisePixels(ctx, cx - 23, cy - 9, 46, 16, [PALETTE.stoneDark, PALETTE.rustDark], 0.055, seed + 17);
  drawRubbleCluster(ctx, cx - 20, cy + 7, seed + 33, 2);
}

export function drawCalcifiedHeadstone(ctx, cx, cy, seed) {
  const rng = rngFrom(hash2D(seed + 239, seed * 7 + 5));
  const variant = seed % 4;
  const lean = Math.floor((rng() - 0.5) * 5);
  const h = variant === 2 ? 18 + Math.floor(rng() * 5) : 27 + Math.floor(rng() * 9);
  const w = variant === 2 ? 23 + Math.floor(rng() * 6) : 15 + Math.floor(rng() * 5);
  const top = cy - h - 5;
  const left = cx - Math.floor(w / 2) + lean;

  drawShadowBlob(ctx, cx, cy + 3, variant === 2 ? 32 : 24, 9);
  if (variant === 1) {
    const stemX = cx + lean;
    px(ctx, stemX - 4, top + 7, PALETTE.outline, 9, h + 6);
    px(ctx, stemX - 3, top + 8, PALETTE.hostBone, 4, h + 2);
    px(ctx, stemX + 1, top + 8, PALETTE.stoneMid, 3, h + 1);
    px(ctx, stemX + 3, top + 12, PALETTE.stoneDark, 1, h - 3);
    px(ctx, stemX - 10, top + 18, PALETTE.outline, 21, 6);
    px(ctx, stemX - 9, top + 19, PALETTE.stoneDust, 12, 3);
    px(ctx, stemX + 3, top + 19, PALETTE.stoneDark, 7, 3);
    if (seed % 3 === 0) {
      px(ctx, stemX + 5, top + 15, PALETTE.outline, 5, 4);
      px(ctx, stemX + 6, top + 15, PALETTE.stoneDark, 3, 2);
    }
  } else if (variant === 2) {
    drawIsoPrism(ctx, cx + lean, cy - 2, w, 13, 8, {
      top: PALETTE.stoneMid,
      left: PALETTE.stoneDust,
      right: PALETTE.stoneDark,
      outline: PALETTE.outline
    });
    px(ctx, left + 3, cy - 15, PALETTE.stoneLight, Math.max(4, w - 8), 1);
    px(ctx, left + 5, cy - 12, PALETTE.outline, Math.max(4, w - 10), 1);
    px(ctx, left + 7, cy - 9, PALETTE.stoneDark, Math.max(4, w - 14), 1);
  } else if (variant === 3) {
    const split = cx + lean + (seed & 1 ? 1 : -1);
    for (let row = 0; row < h + 2; row += 1) {
      const y = top + 6 + row;
      const taper = row < 5 ? Math.max(0, 2 - Math.floor(row / 2)) : 0;
      const leftW = Math.max(4, Math.floor(w * 0.48) - taper);
      const rightW = Math.max(4, Math.floor(w * 0.48) - (row % 3 === 0 ? 1 : 0));
      px(ctx, split - leftW - 2, y, PALETTE.outline, leftW + 2, 1);
      px(ctx, split + 1, y + (row > 4 ? 1 : 0), PALETTE.outline, rightW + 2, 1);
      px(ctx, split - leftW - 1, y, row < 3 ? PALETTE.hostBone : PALETTE.stoneDust, Math.ceil(leftW * 0.62), 1);
      px(ctx, split - Math.floor(leftW * 0.35), y, PALETTE.stoneMid, Math.floor(leftW * 0.35), 1);
      px(ctx, split + 2, y + (row > 4 ? 1 : 0), PALETTE.stoneMid, Math.ceil(rightW * 0.54), 1);
      px(ctx, split + 2 + Math.ceil(rightW * 0.54), y + (row > 4 ? 1 : 0), PALETTE.stoneDark, Math.max(1, rightW - Math.ceil(rightW * 0.54)), 1);
    }
    linePx(ctx, split, top + 8, split - 2, cy - 4, PALETTE.void, 1);
  } else {
    px(ctx, left - 2, top + 5, PALETTE.outline, w + 4, h + 6);
    for (let row = 0; row < h + 4; row += 1) {
      const y = top + 5 + row;
      const taper = row < 6 ? Math.max(0, 3 - Math.floor(row / 2)) : 0;
      const lx = left + taper;
      const ww = Math.max(5, w - taper * 2);
      px(ctx, lx - 1, y, PALETTE.outline, ww + 2, 1);
      px(ctx, lx, y, row < 4 ? PALETTE.hostBone : PALETTE.stoneDust, Math.ceil(ww * 0.45), 1);
      px(ctx, lx + Math.ceil(ww * 0.45), y, PALETTE.stoneMid, Math.floor(ww * 0.35), 1);
      px(ctx, lx + Math.ceil(ww * 0.8), y, PALETTE.stoneDark, Math.max(1, ww - Math.ceil(ww * 0.8)), 1);
    }
  }
  px(ctx, left - 2, cy - 3, PALETTE.outline, w + 4, 5);
  px(ctx, left, cy - 2, PALETTE.stoneDark, w, 2);
  px(ctx, left - 3, cy - 4, PALETTE.stoneDust, Math.max(5, Math.floor(w * 0.45)), 1);
  px(ctx, left + Math.floor(w * 0.55), cy - 1, PALETTE.outline, Math.max(4, Math.floor(w * 0.35)), 1);

  const crossX = cx + lean;
  if (variant !== 1 && variant !== 2) {
    px(ctx, crossX - 1, top + 12, PALETTE.outline, 3, 13);
    px(ctx, crossX - 5, top + 17, PALETTE.outline, 11, 3);
    px(ctx, crossX, top + 13, PALETTE.stoneLight, 1, 11);
    px(ctx, crossX - 4, top + 18, PALETTE.stoneLight, 9, 1);
  }
  if (variant === 1) {
    px(ctx, crossX - 1, top + 10, PALETTE.outline, 3, 15);
    px(ctx, crossX, top + 11, PALETTE.hostBone, 1, 12);
    px(ctx, crossX - 5, top + 18, PALETTE.outline, 11, 3);
    px(ctx, crossX - 4, top + 19, PALETTE.stoneLight, 8, 1);
  }
  linePx(ctx, left + 1, top + Math.floor(h * 0.48), left + w - 2, top + Math.floor(h * 0.58), PALETTE.outline, 1);
  linePx(ctx, left + 2, top + Math.floor(h * 0.48) - 1, left + w - 3, top + Math.floor(h * 0.58) - 1, PALETTE.stoneDark, 1);
  for (let i = 0; i < 6; i += 1) {
    const x = left + 2 + Math.floor(rng() * Math.max(1, w - 4));
    const y = top + 7 + Math.floor(rng() * Math.max(1, h - 4));
    px(ctx, x, y, rng() < 0.55 ? PALETTE.stoneDark : PALETTE.hostBone, 1, 1);
  }
  for (const [dx, dy] of [[-10, -1], [9, 1], [0, 3]]) {
    px(ctx, cx + dx - 1, cy + dy - 1, PALETTE.outline, 4, 2);
    px(ctx, cx + dx, cy + dy - 2, rng() < 0.5 ? PALETTE.hostBone : PALETTE.rustDark, 2, 1);
  }
  drawNoisePixels(ctx, cx - 12, cy - 3, 24, 8, [PALETTE.stoneDark, PALETTE.rustDark], 0.06, seed);
}

export function drawGraveyardTombSlab(ctx, cx, cy, seed, opts = {}) {
  const frame = isoFrame(cx, cy, opts.orient ?? 'se');
  const rng = rngFrom(hash2D(seed + 251, seed * 7 + 43));
  const cracked = seed % 3 === 0;

  drawShadowBlob(ctx, cx, cy + 5, 58, 19);
  const base = orientedBox(ctx, frame, 0.9, 0.52, 12, {
    top: PALETTE.stoneMid,
    lit: PALETTE.stoneDust,
    shade: PALETTE.stoneDark,
    outline: PALETTE.outline
  });

  const lid = [
    frame.point(-0.38, -0.2, 15),
    frame.point(0.38, -0.2, 15),
    frame.point(0.36, 0.19, 15),
    frame.point(-0.36, 0.19, 15)
  ];
  poly(ctx, PALETTE.outline, lid);
  const top = [
    frame.point(-0.32, -0.15, 16),
    frame.point(0.31, -0.15, 16),
    frame.point(0.3, 0.14, 16),
    frame.point(-0.31, 0.14, 16)
  ];
  poly(ctx, PALETTE.stoneLight, top);
  const shade = [
    frame.point(-0.08, -0.12, 17),
    frame.point(0.31, -0.15, 17),
    frame.point(0.3, 0.14, 17),
    frame.point(-0.02, 0.12, 17)
  ];
  poly(ctx, PALETTE.stoneMid, shade);
  const chipA = frame.point(-0.35, -0.16, 18);
  const chipB = frame.point(0.33, 0.12, 18);
  px(ctx, chipA[0] - 2, chipA[1] - 2, PALETTE.outline, 7, 4);
  px(ctx, chipA[0] - 1, chipA[1] - 3, PALETTE.stoneDark, 4, 2);
  px(ctx, chipB[0] - 1, chipB[1] - 1, PALETTE.outline, 6, 3);
  px(ctx, chipB[0], chipB[1] - 2, PALETTE.hostBone, 3, 1);

  const crossA = frame.point(-0.16, 0, 18);
  const crossB = frame.point(0.16, 0, 18);
  const crossC = frame.point(0, -0.11, 18);
  const crossD = frame.point(0, 0.1, 18);
  linePx(ctx, crossA[0], crossA[1], crossB[0], crossB[1], PALETTE.stoneDust, 1);
  linePx(ctx, crossC[0], crossC[1], crossD[0], crossD[1], PALETTE.stoneDust, 1);
  const effigyHead = frame.point(-0.2, -0.04, 19);
  const effigyFeet = frame.point(0.18, 0.08, 19);
  px(ctx, effigyHead[0] - 3, effigyHead[1] - 3, PALETTE.outline, 7, 6);
  px(ctx, effigyHead[0] - 2, effigyHead[1] - 2, PALETTE.stoneDust, 5, 4);
  linePx(ctx, effigyHead[0] + 1, effigyHead[1] + 3, effigyFeet[0], effigyFeet[1], PALETTE.outline, 3);
  linePx(ctx, effigyHead[0] + 1, effigyHead[1] + 2, effigyFeet[0], effigyFeet[1] - 1, PALETTE.stoneDust, 1);
  const handA = frame.point(-0.02, 0.01, 20);
  px(ctx, handA[0] - 2, handA[1] - 1, PALETTE.hostBone, 5, 2);
  if (cracked) {
    const a = frame.point(-0.29, -0.1, 19);
    const b = frame.point(0.2, 0.1, 19);
    linePx(ctx, a[0], a[1], b[0], b[1], PALETTE.outline, 1);
    px(ctx, b[0] + 1, b[1], PALETTE.stoneDark, 3, 1);
  }
  const prayerA = frame.point(-0.06, -0.02, 20);
  const prayerB = frame.point(0.06, 0.02, 20);
  linePx(ctx, prayerA[0], prayerA[1], prayerB[0], prayerB[1], PALETTE.outline, 2);
  linePx(ctx, prayerA[0], prayerA[1] - 1, prayerB[0], prayerB[1] - 1, PALETTE.hostBone, 1);

  for (let i = 0; i < 7; i += 1) {
    const p = frame.point(-0.43 + rng() * 0.86, -0.24 + rng() * 0.48, 15 + (i % 2));
    px(ctx, p[0], p[1], rng() < 0.55 ? PALETTE.hostBone : PALETTE.stoneDark, 1 + (i & 1), 1);
  }
  const footA = mixPoint(base.base.left, base.base.bottom, 0.44);
  const footB = mixPoint(base.base.bottom, base.base.right, 0.5);
  linePx(ctx, footA[0], footA[1] - 1, footB[0], footB[1] - 1, PALETTE.stoneDark, 1);
  drawNoisePixels(ctx, cx - 26, cy - 9, 52, 18, [PALETTE.stoneDark, PALETTE.rustDark], 0.045, seed);
  drawRubbleCluster(ctx, cx + 24, cy + 4, seed + 57, 2);
}

export function drawGraveyardCatacombMouth(ctx, cx, cy, seed, opts = {}) {
  const frame = isoFrame(cx, cy, opts.orient ?? 'se');
  const rng = rngFrom(hash2D(seed + 263, seed * 11 + 47));

  drawShadowBlob(ctx, cx, cy + 6, 66, 21);
  orientedBox(ctx, frame, 1, 0.62, 5, {
    top: PALETTE.stoneMid,
    lit: PALETTE.stoneDust,
    shade: PALETTE.stoneDark,
    outline: PALETTE.outline
  });

  const mouthOuter = [
    frame.point(-0.38, -0.23, 8),
    frame.point(0.38, -0.23, 8),
    frame.point(0.31, 0.2, 8),
    frame.point(-0.31, 0.2, 8)
  ];
  poly(ctx, PALETTE.outline, mouthOuter);
  const jambL = frame.point(-0.42, -0.2, 12);
  const jambR = frame.point(0.42, -0.2, 12);
  px(ctx, jambL[0] - 5, jambL[1] - 28, PALETTE.outline, 10, 34);
  px(ctx, jambL[0] - 4, jambL[1] - 27, PALETTE.stoneMid, 7, 30);
  px(ctx, jambR[0] - 4, jambR[1] - 26, PALETTE.outline, 10, 33);
  px(ctx, jambR[0] - 3, jambR[1] - 25, PALETTE.stoneDark, 7, 29);
  px(ctx, jambL[0] - 6, jambL[1] - 30, PALETTE.stoneDust, 6, 2);
  px(ctx, jambR[0] + 1, jambR[1] - 22, PALETTE.outline, 6, 5);
  px(ctx, jambR[0] + 2, jambR[1] - 22, PALETTE.stoneDark, 3, 3);
  for (let i = 0; i < 13; i += 1) {
    const a = Math.PI * (0.08 + i * 0.065);
    const x = cx + Math.round(Math.cos(a) * 36);
    const y = cy - 25 - Math.round(Math.sin(a) * 22);
    px(ctx, x - 1, y - 1, PALETTE.outline, 4, 3);
    px(ctx, x, y - 1, i % 3 === 0 ? PALETTE.hostBone : PALETTE.stoneDust, 2, 1);
  }
  const mouth = [
    frame.point(-0.29, -0.16, 9),
    frame.point(0.29, -0.16, 9),
    frame.point(0.22, 0.13, 9),
    frame.point(-0.22, 0.13, 9)
  ];
  poly(ctx, PALETTE.void, mouth);
  const throat = [
    frame.point(-0.2, -0.09, 10),
    frame.point(0.2, -0.09, 10),
    frame.point(0.15, 0.08, 10),
    frame.point(-0.15, 0.08, 10)
  ];
  poly(ctx, PALETTE.hostBlack, throat);
  const thresholdA = frame.point(-0.3, 0.16, 12);
  const thresholdB = frame.point(0.3, 0.16, 12);
  linePx(ctx, thresholdA[0], thresholdA[1], thresholdB[0], thresholdB[1], PALETTE.outline, 3);
  linePx(ctx, thresholdA[0] + 1, thresholdA[1] - 1, thresholdB[0] - 1, thresholdB[1] - 1, PALETTE.hostBone, 1);
  const boneA = frame.point(-0.16, 0.23, 13);
  const boneB = frame.point(0.12, 0.31, 13);
  linePx(ctx, boneA[0], boneA[1], boneB[0], boneB[1], PALETTE.outline, 2);
  linePx(ctx, boneA[0], boneA[1] - 1, boneB[0], boneB[1] - 1, PALETTE.hostBone, 1);

  for (let step = 0; step < 4; step += 1) {
    const lb = -0.08 + step * 0.07;
    const a = frame.point(-0.23 + step * 0.03, lb, 11);
    const b = frame.point(0.23 - step * 0.03, lb, 11);
    linePx(ctx, a[0], a[1], b[0], b[1], step === 0 ? PALETTE.stoneLight : PALETTE.stoneDark, 1);
  }
  for (const t of [-0.18, 0, 0.18]) {
    const a = frame.point(t - 0.06, 0.2, 12);
    const b = frame.point(t + 0.04, 0.34, 12);
    linePx(ctx, a[0], a[1], b[0], b[1], PALETTE.outline, 2);
    linePx(ctx, a[0] + 1, a[1] - 1, b[0] + 1, b[1] - 1, PALETTE.stoneMid, 1);
  }

  const rear = frame.point(0, -0.27, 0);
  const rearFrame = isoFrame(rear[0], rear[1], frame.orient);
  orientedBox(ctx, rearFrame, 0.82, 0.16, 18, {
    top: PALETTE.stoneLight,
    lit: PALETTE.stoneMid,
    shade: PALETTE.stoneDark,
    outline: PALETTE.outline
  });
  const lintelA = rearFrame.point(-0.36, 0, 20);
  const lintelB = rearFrame.point(0.36, 0, 20);
  linePx(ctx, lintelA[0], lintelA[1], lintelB[0], lintelB[1], PALETTE.hostBone, 1);
  const seal = rearFrame.point(0, 0.05, 12);
  px(ctx, seal[0] - 7, seal[1] - 7, PALETTE.outline, 15, 11);
  px(ctx, seal[0] - 6, seal[1] - 6, PALETTE.stoneDark, 13, 9);
  px(ctx, seal[0] - 5, seal[1] - 5, PALETTE.void, 11, 6);
  px(ctx, seal[0] - 1, seal[1] - 5, PALETTE.hostBone, 3, 5);
  px(ctx, seal[0] - 5, seal[1] - 3, PALETTE.hostBone, 11, 2);

  for (let i = 0; i < 8; i += 1) {
    const p = frame.point(-0.48 + rng() * 0.96, -0.28 + rng() * 0.58, 7);
    px(ctx, p[0], p[1], rng() < 0.5 ? PALETTE.hostBone : PALETTE.stoneDark, 1 + (i & 1), 1);
  }
  drawNoisePixels(ctx, cx - 30, cy - 12, 60, 23, [PALETTE.stoneDark, PALETTE.rustDark], 0.055, seed);
  drawRubbleCluster(ctx, cx - 31, cy + 7, seed + 71, 3);
}

export function drawGraveyardRemnantCross(ctx, cx, cy, seed) {
  const rng = rngFrom(hash2D(seed + 271, seed * 13 + 53));
  const lean = Math.floor((rng() - 0.5) * 3);

  drawShadowBlob(ctx, cx, cy + 5, 42, 15);
  drawIsoPrism(ctx, cx, cy, 36, 18, 8, {
    top: PALETTE.stoneMid,
    left: PALETTE.stoneDust,
    right: PALETTE.stoneDark,
    outline: PALETTE.outline
  });
  drawIsoPrism(ctx, cx + lean, cy - 8, 26, 13, 7, {
    top: PALETTE.stoneLight,
    left: PALETTE.stoneMid,
    right: PALETTE.stoneDark,
    outline: PALETTE.outline
  });

  const stemX = cx + lean;
  px(ctx, stemX - 6, cy - 68, PALETTE.outline, 13, 61);
  px(ctx, stemX - 5, cy - 67, PALETTE.hostBone, 5, 57);
  px(ctx, stemX, cy - 67, PALETTE.stoneDust, 3, 57);
  px(ctx, stemX + 3, cy - 64, PALETTE.stoneDark, 3, 54);
  px(ctx, stemX - 18, cy - 52, PALETTE.outline, 37, 9);
  px(ctx, stemX - 17, cy - 51, PALETTE.hostBone, 15, 6);
  px(ctx, stemX - 2, cy - 51, PALETTE.stoneDust, 12, 6);
  px(ctx, stemX + 10, cy - 49, PALETTE.stoneDark, 7, 5);
  px(ctx, stemX - 18, cy - 45, PALETTE.outline, 9, 4);
  px(ctx, stemX - 17, cy - 46, PALETTE.stoneDark, 6, 2);
  px(ctx, stemX + 13, cy - 56, PALETTE.outline, 7, 4);
  px(ctx, stemX + 14, cy - 56, PALETTE.hostBone, 4, 1);

  // Remnant sun-cross ring, broken and pixel-built.
  for (let i = 0; i < 22; i += 1) {
    if (i > 13 && i < 17) continue;
    const a = (Math.PI * 2 * i) / 22;
    const x = stemX + Math.round(Math.cos(a) * 12);
    const y = cy - 48 + Math.round(Math.sin(a) * 7);
    px(ctx, x, y, i % 3 === 0 ? PALETTE.hostBone : PALETTE.stoneDust, i % 5 === 0 ? 2 : 1, 1);
  }

  px(ctx, stemX - 4, cy - 23, PALETTE.stoneDark, 9, 2);
  px(ctx, stemX - 3, cy - 18, PALETTE.outline, 8, 3);
  px(ctx, stemX - 2, cy - 18, PALETTE.rustDark, 5, 1);
  linePx(ctx, stemX + 4, cy - 62, stemX - 3, cy - 31, PALETTE.outline, 1);
  linePx(ctx, stemX + 3, cy - 61, stemX - 4, cy - 32, PALETTE.stoneDark, 1);
  px(ctx, stemX - 9, cy - 36, PALETTE.outline, 5, 4);
  px(ctx, stemX - 8, cy - 36, PALETTE.hostBone, 3, 1);
  for (let i = 0; i < 8; i += 1) {
    const x = stemX - 7 + Math.floor(rng() * 15);
    const y = cy - 61 + Math.floor(rng() * 47);
    px(ctx, x, y, rng() < 0.5 ? PALETTE.stoneDark : PALETTE.stoneLight, 1, 1);
  }
  drawNoisePixels(ctx, cx - 20, cy - 10, 40, 14, [PALETTE.stoneDark, PALETTE.rustDark], 0.055, seed);
  drawRubbleCluster(ctx, cx + 17, cy + 5, seed + 89, 2);
}

export function drawGraveyardPackedAsh(ctx, cx, cy, seed) {
  const rng = rngFrom(hash2D(seed + 277, seed * 7 + 61));
  ctx.save();
  ctx.globalAlpha = 0.24;
  drawIsoDiamond(ctx, cx, cy, 52, 23, PALETTE.stoneDark);
  ctx.globalAlpha = 0.13;
  drawIsoDiamond(ctx, cx + Math.floor((rng() - 0.5) * 8), cy + Math.floor((rng() - 0.5) * 4), 39, 16, PALETTE.stoneDust);
  ctx.restore();
  const d = diamond(cx, cy, 50, 22);
  linePx(ctx, d.left[0] + 5, d.left[1] + 1, d.top[0], d.top[1] + 4, PALETTE.stoneDust, 1);
  linePx(ctx, d.bottom[0], d.bottom[1] - 3, d.right[0] - 5, d.right[1] + 1, PALETTE.stoneDark, 1);
  for (let i = 0; i < 6; i += 1) {
    const x = cx - 23 + Math.floor(rng() * 47);
    const y = cy - 9 + Math.floor(rng() * 18);
    px(ctx, x, y, rng() < 0.55 ? PALETTE.hostBone : PALETTE.rustDark, 1 + (i & 1), 1);
  }
  for (const t of [0.2, 0.5, 0.78]) {
    const a = mixPoint(d.left, d.top, t);
    const b = mixPoint(d.bottom, d.right, t);
    linePx(ctx, a[0], a[1], b[0], b[1], t === 0.5 ? PALETTE.outline : PALETTE.stoneDark, 1);
  }
  for (let i = 0; i < 5; i += 1) {
    const x = cx - 17 + Math.floor(rng() * 35);
    const y = cy - 7 + Math.floor(rng() * 14);
    px(ctx, x, y, PALETTE.outline, 4, 1);
    px(ctx, x + 1, y - 1, rng() < 0.5 ? PALETTE.hostBone : PALETTE.stoneDust, 2, 1);
  }
}

export function drawGraveyardPathStones(ctx, cx, cy, seed) {
  const rng = rngFrom(hash2D(seed + 281, seed * 5 + 67));
  const stones = [
    { x: -14, y: -3, w: 21, h: 9 },
    { x: 5, y: 2, w: 24, h: 10 },
    { x: -2, y: -10, w: 18, h: 8 }
  ];
  for (const stone of stones) {
    const dx = stone.x + Math.floor((rng() - 0.5) * 4);
    const dy = stone.y + Math.floor((rng() - 0.5) * 3);
    drawIsoDiamond(ctx, cx + dx, cy + dy + 1, stone.w + 2, stone.h + 2, PALETTE.outline);
    drawIsoDiamond(ctx, cx + dx, cy + dy, stone.w, stone.h, rng() < 0.45 ? PALETTE.stoneLight : PALETTE.stoneMid);
    px(ctx, cx + dx - 6, cy + dy - 2, PALETTE.stoneDust, 6, 1);
    if (rng() < 0.45) px(ctx, cx + dx + 3, cy + dy + 2, PALETTE.stoneDark, 7, 1);
  }
  drawNoisePixels(ctx, cx - 23, cy - 10, 46, 20, [PALETTE.stoneDust, PALETTE.stoneDark], 0.035, seed);
}

export function drawGraveyardRootSeam(ctx, cx, cy, seed) {
  const rng = rngFrom(hash2D(seed + 283, seed * 11 + 71));
  ctx.save();
  ctx.globalAlpha = 0.35;
  drawIsoDiamond(ctx, cx + 1, cy + 1, 51, 19, PALETTE.stoneDark);
  ctx.restore();
  for (let i = 0; i < 4; i += 1) {
    const x = cx - 24 + Math.floor(rng() * 48);
    const y = cy - 8 + Math.floor(rng() * 16);
    const midX = x + 6 + Math.floor(rng() * 8);
    const endX = midX + 5 + Math.floor(rng() * 9);
    const midY = y - 4 + Math.floor(rng() * 8);
    const endY = midY - 3 + Math.floor(rng() * 7);
    linePx(ctx, x, y, midX, midY, PALETTE.outline, 2);
    linePx(ctx, midX, midY, endX, endY, PALETTE.outline, 2);
    linePx(ctx, x, y, midX, midY, PALETTE.woodDark, 1);
    linePx(ctx, midX, midY, endX, endY, i % 2 ? PALETTE.rustDark : PALETTE.woodMid, 1);
    if (i % 2 === 0) linePx(ctx, midX, midY, midX - 5, midY + 4, PALETTE.woodDark, 1);
    if (i === 1) px(ctx, midX + 2, midY - 2, PALETTE.hostBone, 2, 1);
  }
}

export function drawGraveyardPrayerScratch(ctx, cx, cy, seed) {
  const rng = rngFrom(hash2D(seed + 293, seed * 3 + 79));
  const x = cx + Math.floor((rng() - 0.5) * 10);
  const y = cy + Math.floor((rng() - 0.5) * 5);
  ctx.save();
  ctx.globalAlpha = 0.72;
  linePx(ctx, x + 1, y - 8, x + 1, y + 7, PALETTE.outline, 1);
  linePx(ctx, x - 8, y, x + 8, y, PALETTE.outline, 1);
  linePx(ctx, x - 5, y + 5, x + 5, y + 5, PALETTE.outline, 1);
  linePx(ctx, x, y - 8, x, y + 7, PALETTE.hostBone, 1);
  linePx(ctx, x - 8, y - 1, x + 8, y - 1, PALETTE.hostBone, 1);
  linePx(ctx, x - 5, y + 4, x + 5, y + 4, PALETTE.stoneDust, 1);
  for (const [dx, dy, len] of [[-12, -5, 8], [9, -6, 7], [-9, 6, 6], [8, 5, 5]]) {
    linePx(ctx, x + dx, y + dy, x + dx + len, y + dy + (dx < 0 ? 2 : -2), PALETTE.outline, 1);
    linePx(ctx, x + dx + 1, y + dy, x + dx + len - 1, y + dy + (dx < 0 ? 1 : -1), PALETTE.stoneDust, 1);
  }
  for (let i = 0; i < 16; i += 1) {
    if (i % 5 === 0) continue;
    const a = (Math.PI * 2 * i) / 16;
    px(ctx, x + Math.round(Math.cos(a) * 11), y - 1 + Math.round(Math.sin(a) * 6), PALETTE.stoneDust, 1, 1);
  }
  ctx.restore();
  drawNoisePixels(ctx, cx - 18, cy - 9, 36, 18, [PALETTE.stoneDust, PALETTE.stoneDark], 0.05, seed);
}

function drawFallenSaint(ctx, cx, cy, seed, settle = 1) {
  const flesh = PALETTE.skinDark;
  const fleshHi = PALETTE.skinMid;
  const bone = PALETTE.hostBone;
  const gold = PALETTE.hostGold;
  const wet = PALETTE.hostRed;

  ctx.save();
  ctx.globalAlpha = 0.85 * Math.max(0.15, settle);
  drawIsoDiamond(ctx, cx + 1, cy + 5, 32, 15, PALETTE.rustDark);
  ctx.restore();
  if (settle > 0.4) drawNoisePixels(ctx, cx - 16, cy - 1, 34, 12, [wet, PALETTE.rustDark], 0.12, seed);

  // Slumped body lying along the tile, head to the right. Human, smaller.
  for (let row = 0; row < 9; row += 1) {
    const w = 22 - Math.abs(row - 4) * 2;
    px(ctx, cx - Math.floor(w / 2) - 2, cy - 6 + row, flesh, w, 1);
  }
  px(ctx, cx - 14, cy - 5, PALETTE.void, 2, 9);
  px(ctx, cx - 13, cy - 5, fleshHi, 1, 8); // lit edge along the spine

  // Chest still butterflied open: a dead cavity and collapsed splayed rib-bones.
  px(ctx, cx - 5, cy - 3, PALETTE.void, 9, 6);
  px(ctx, cx - 4, cy - 2, PALETTE.rustDark, 7, 4);
  for (let r = 0; r < 4; r += 1) {
    px(ctx, cx - 6 - r, cy - 4 + r * 2, bone, 5 + r, 1); // left wing of ribs
    px(ctx, cx + 3, cy - 4 + r * 2, bone, 4 + r, 1); // right wing
  }
  px(ctx, cx - 1, cy - 5, gold, 1, 9); // one drained black-gold vein

  // The belly maw, slack open, a few bone teeth.
  px(ctx, cx - 3, cy + 3, PALETTE.void, 7, 2);
  for (let t = 0; t < 4; t += 1) px(ctx, cx - 3 + t * 2, cy + 3, bone, 1, 1);

  // A limp human arm flung out to the left.
  px(ctx, cx - 12, cy + 2, flesh, 8, 2);
  px(ctx, cx - 12, cy + 2, fleshHi, 8, 1);
  for (let f = 0; f < 4; f += 1) px(ctx, cx - 13 - f, cy + 2, bone, 1, 1 + (f & 1));

  // Goat skull lolled on its side, jaw clenched, one curling horn.
  const hx = cx + 12;
  const hy = cy - 6;
  px(ctx, hx - 4, hy, PALETTE.outline, 11, 9);
  px(ctx, hx - 3, hy, bone, 9, 7);
  px(ctx, hx - 1, hy + 2, PALETTE.void, 2, 2);
  px(ctx, hx + 3, hy + 2, PALETTE.void, 2, 2);
  px(ctx, hx + 1, hy + 5, PALETTE.hostBlack, 5, 1); // clenched jaw
  px(ctx, hx + 4, hy + 1, bone, 4, 1); // muzzle bridge
  const horn = [[5, -1], [7, -2], [9, 0], [10, 3], [9, 5], [7, 7]];
  for (const [dx, dy] of horn) px(ctx, hx + dx - 1, hy + dy - 1, PALETTE.outline, 3, 3);
  for (let i = 0; i < horn.length; i += 1) px(ctx, hx + horn[i][0], hy + horn[i][1], bone, 2, 2);
  px(ctx, hx - 4, hy - 2, bone, 2, 2); // snapped horn stub
  px(ctx, hx - 6, hy - 3, PALETTE.hostBlack, 2, 1);
}

export function drawCrossMartyr(ctx, cx, cy, seed, opts = {}) {
  const pulse = opts.pulse ?? 0;
  const flicker = opts.flicker ?? 0;
  const dim = Boolean(opts.dim);
  // `released` = cut down from the cross: the body falls and dies on the ground,
  // animated by `fall` (0 = just released, 1 = landed). `dead` = killed but left
  // hanging on the cross (an older sacrament). Plain `killed` implies released.
  const released = Boolean(opts.released);
  const fall = released ? Math.max(0, Math.min(1, opts.fall ?? 1)) : 0;
  const dead = Boolean(opts.dead) || (Boolean(opts.killed) && !released);
  const killed = dead; // the on-cross body code reads `killed` as "dead, still hanging"

  const alivePulse = !dead && pulse ? 1 : 0;
  const deadSag = dead ? 8 : 0;
  const headDrop = dead ? 13 : 0;
  const flesh = dead ? PALETTE.stoneDust : PALETTE.skinMid; // human-sized even after the Host opens him
  const fleshHi = dead ? PALETTE.hostBone : PALETTE.skinLight;
  const fleshSh = dead ? PALETTE.stoneDark : PALETTE.skinDark;
  const wet = dead ? PALETTE.rustDark : PALETTE.hostRed;
  const dark = dead ? PALETTE.stoneDark : PALETTE.hostBlack;
  const rim = dead ? PALETTE.stoneDust : (dim ? PALETTE.hostGold : PALETTE.hostBone);
  const bone = rim;
  const gold = dead ? PALETTE.stoneDark : PALETTE.hostGold;
  const topY = cy - 88;
  const armY = cy - 60; // crossbeam / nailed wrists
  const footY = cy - 2;
  const beamHalf = 23;
  const shY = armY + 8 + deadSag; // shoulders
  const lean = dead ? 8 : 2 + alivePulse; // dead hangs still; living lolls with the pulse

  // Thick stepped line, for the sagging limbs.
  const seg = (x0, y0, x1, y1, color, thick) => {
    const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
    for (let i = 0; i <= steps; i += 1) {
      const t = i / steps;
      px(ctx, Math.round(x0 + (x1 - x0) * t - thick / 2), Math.round(y0 + (y1 - y0) * t), color, thick, 1);
    }
  };

  // A wet Host tendril worked out of the opening: tapers as it curls, a lit rust
  // edge so it reads against the dark, a faint gold tip.
  const tendril = (x0, y0, dir, len, baseW, rise) => {
    let x = x0;
    let y = y0;
    let vy = -rise;
    const tendrilBase = dead ? PALETTE.stoneDark : PALETTE.rustDark;
    const tendrilEdge = dead ? PALETTE.stoneDust : PALETTE.rustMid;
    for (let i = 0; i < len; i += 1) {
      const t = i / len;
      const w = Math.max(1, Math.round(baseW * (1 - t * 0.6)));
      px(ctx, Math.round(x - w / 2), Math.round(y), tendrilBase, w, 1);
      px(ctx, Math.round(x - w / 2), Math.round(y), tendrilEdge, 1, 1); // lit edge
      x += dir * (1 - t * 0.25);
      y += vy;
      vy += 0.38;
    }
    px(ctx, Math.round(x), Math.round(y), gold, 1, 1);
  };

  drawShadowBlob(ctx, cx, cy + 3, 40, 16);

  // --- Cross timber + beam, a little blood down the grain -----------------
  px(ctx, cx - 4, topY, PALETTE.outline, 9, footY - topY + 2);
  px(ctx, cx - 3, topY, PALETTE.woodDark, 7, footY - topY);
  px(ctx, cx - 3, topY, PALETTE.woodMid, 2, footY - topY);
  px(ctx, cx - beamHalf, armY - 3, PALETTE.outline, beamHalf * 2 + 2, 8);
  px(ctx, cx - beamHalf + 1, armY - 2, PALETTE.woodDark, beamHalf * 2 - 1, 6);
  px(ctx, cx - beamHalf + 1, armY - 2, PALETTE.woodMid, beamHalf * 2 - 1, 2);
  px(ctx, cx - beamHalf + 5, armY + 5, wet, 2, 9); // blood from the left nail
  px(ctx, cx + beamHalf - 6, armY + 5, wet, 2, 7); // from the right nail
  px(ctx, cx, armY + 30, wet, 2, footY - armY - 30); // down the post from the wound

  // --- Cut down: the cross hangs empty (torn nails, blood) and the body has
  //     dropped off it to crumple and die on the ground below ---------------
  if (released) {
    px(ctx, cx - beamHalf + 1, armY - 1, PALETTE.stoneLight, 2, 3); // wrist nails left in the beam
    px(ctx, cx + beamHalf - 3, armY - 1, PALETTE.stoneLight, 2, 3);
    px(ctx, cx - beamHalf + 1, armY + 2, wet, 3, 2); // torn-flesh smears
    px(ctx, cx + beamHalf - 4, armY + 2, wet, 3, 2);
    const dropY = Math.round(footY - (1 - fall) * 40); // falls from the beam to the floor
    drawFallenSaint(ctx, cx + 2, dropY, seed, fall);
    return;
  }

  // --- Broken bone halo behind the skull, splintered away on one side -----
  if (!killed) {
    for (let n = 0; n < 20; n += 1) {
      if (n > 10 && n < 15) continue; // the shattered arc
      const a = Math.PI * (0.06 + n * 0.05);
      const hx = cx + lean + Math.round(Math.cos(a) * (13 + (n % 3)));
      const hy = (armY - 12) - Math.round(Math.sin(a) * 12);
      px(ctx, hx, hy, n % 4 === 0 ? gold : rim, n % 5 === 0 ? 2 : 1, 1);
    }
    for (let i = 0; i < 3; i += 1) px(ctx, cx + 13 + i * 2, armY - 10 + i * 4, i % 2 ? gold : rim, 2, 1); // falling splinters
  }

  // --- Arms: human, wrists nailed at the beam ends, weight dragging them down
  //     and inward to the shoulders -----------------------------------------
  const wL = { x: cx - beamHalf + 2, y: armY + 1 };
  const wR = { x: cx + beamHalf - 3, y: armY + 1 };
  const shL = { x: cx - 8 + lean, y: shY + 2 };
  const shR = { x: cx + 9 + lean, y: shY + 1 };
  seg(wL.x, wL.y, cx - 15 + lean, armY + 8, flesh, 4);
  seg(cx - 15 + lean, armY + 8, shL.x, shL.y, flesh, 5);
  seg(wR.x, wR.y, cx + 15 + lean, armY + 7, flesh, 4);
  seg(cx + 15 + lean, armY + 7, shR.x, shR.y, flesh, 5);
  seg(wL.x, wL.y - 1, shL.x, shL.y - 1, fleshHi, 1); // lit edge
  seg(wR.x, wR.y - 1, shR.x, shR.y - 1, fleshHi, 1);
  seg(wL.x, wL.y + 2, shL.x, shL.y + 2, fleshSh, 1); // shaded underside
  seg(wR.x, wR.y + 2, shR.x, shR.y + 2, fleshSh, 1);
  px(ctx, shL.x - 1, shL.y - 1, gold, 1, 3); // one thin black-gold vein per arm
  px(ctx, shR.x, shR.y - 1, gold, 1, 3);

  // nailed wrists + slack human hands
  for (const s of [-1, 1]) {
    const w = s < 0 ? wL : wR;
    px(ctx, w.x - 1, w.y - 3, PALETTE.stoneDust, 3, 2); // hammered nail head
    px(ctx, w.x - 1, w.y - 1, PALETTE.stoneLight, 2, 3); // spike
    px(ctx, w.x - 1, w.y + 1, wet, 3, 2); // wound
    px(ctx, w.x - 1 + (s < 0 ? -1 : 1), w.y + 3, flesh, 3, 3); // palm
    for (let f = 0; f < 3; f += 1) px(ctx, w.x + s * f - 1, w.y + 6, flesh, 1, 2); // a few slack fingers
  }

  // --- Torso: a solid human chest and belly, tapering to the waist --------
  const tTop = shY + 1;
  const hipY = armY + 33;
  for (let row = 0; row <= hipY - tTop; row += 1) {
    const t = row / (hipY - tTop);
    const w = Math.round(19 - t * 5);
    const ox = cx - Math.floor(w / 2) + Math.round(lean * (0.3 + t * 0.4));
    px(ctx, ox, tTop + row, flesh, w, 1);
    px(ctx, ox, tTop + row, fleshSh, 1, 1); // shaded left edge
    px(ctx, ox + 1, tTop + row, fleshHi, 1, 1); // lit highlight just inside
    px(ctx, ox + w - 1, tTop + row, fleshSh, 1, 1); // shaded right edge
  }

  // --- The ribcage cracked down the sternum and butterflied WIDE OPEN: two
  //     symmetric wings of bone spread from a wet central cavity ------------
  const spineX = cx + lean;
  const cavX = spineX - 4;
  const cavTop = tTop + 2;
  const cavW = 8;
  const cavH = 16;
  px(ctx, cavX, cavTop, PALETTE.void, cavW, cavH); // open cavity down the middle
  px(ctx, cavX + 1, cavTop + 1, PALETTE.rustDark, cavW - 2, cavH - 2); // wet inside
  for (const s of [-1, 1]) {
    const baseX = s < 0 ? cavX : cavX + cavW - 1;
    for (let i = 0; i < 4; i += 1) {
      const ry = cavTop + 2 + i * 4;
      const reach = 8 - Math.abs(i - 1) - (i === 3 ? 1 : 0); // middle ribs longest
      const liftv = (i - 1.5) * 3; // fans up at the top, down at the bottom
      for (let k = 0; k <= reach; k += 1) {
        const tt = k / reach;
        const x = baseX + s * k;
        const y = Math.round(ry + liftv * tt - Math.sin(tt * Math.PI) * 2.4);
        px(ctx, x, y + 2, PALETTE.void, 1, 1); // shadow under the rib
        px(ctx, x, y, bone, 1, 2); // bold 2px rib
      }
    }
  }
  // split sternum down the centre, holding the two wings apart
  px(ctx, spineX - 1, cavTop, bone, 1, 4);
  px(ctx, spineX - 1, cavTop, fleshSh, 1, 1);

  // The single wound deep in the cavity (moderate: a wet core, a small glow)
  if (!killed) {
    const glow = pulse ? PALETTE.hostGlow : gold;
    px(ctx, cavX + 2, cavTop + 5, wet, 4, 6);
    px(ctx, cavX + 3, cavTop + 7, glow, 2, 3);
    if (pulse) px(ctx, cavX + 3, cavTop + 8, PALETTE.flash, 1, 1); // burning core
  } else {
    px(ctx, cavX + 2, cavTop + 6, PALETTE.rustDark, 4, 5);
  }

  // Tendrils worked out of the opening: two curl out and up over the rib-wings,
  // and one drops down out of the belly toward the floor.
  tendril(cavX + 1, cavTop + 3, -1, 11, 3, 2.4);
  tendril(cavX + cavW - 1, cavTop + 4, 1, 11, 3, 2.2);
  if (!killed) tendril(spineX, cavTop + cavH - 1, -1, 9, 2, -0.6);

  // --- A toothed maw split open in the belly ------------------------------
  const mawX = cx - 6 + lean;
  const mawY = armY + 27;
  px(ctx, mawX, mawY, PALETTE.void, 13, 5);
  px(ctx, mawX + 1, mawY + 1, dark, 11, 3);
  for (let t = 0; t < 6; t += 1) px(ctx, mawX + 1 + t * 2, mawY, rim, 1, 2 + (t & 1)); // upper teeth
  for (let t = 0; t < 5; t += 1) px(ctx, mawX + 2 + t * 2, mawY + 4, rim, 1, 1 + ((t + 1) & 1)); // lower teeth
  px(ctx, mawX + 5, mawY + 2, wet, 3, 1); // wet gum
  if (!killed) px(ctx, mawX + 6, mawY + 2, gold, 1, 1);

  // --- Legs: human, nailed together at one foot-spike, knees buckled aside -
  const kneeX = cx + lean - 4;
  const kneeY = hipY + 9 + (dead ? 2 : 0);
  const footX = cx + 1;
  seg(cx - 2 + lean, hipY, kneeX, kneeY, flesh, 7); // thighs
  seg(kneeX, kneeY, footX, footY - 2, flesh, 5); // shins
  seg(cx - 2 + lean, hipY, kneeX, kneeY, fleshHi, 1);
  px(ctx, kneeX - 1, kneeY, gold, 1, 3); // a thin vein at the knee
  px(ctx, footX - 2, footY - 4, PALETTE.stoneDust, 3, 2); // foot nail head
  px(ctx, footX - 2, footY - 3, PALETTE.stoneLight, 4, 2); // spike
  px(ctx, footX - 2, footY - 1, wet, 4, 2);

  // --- Goat skull: the head opened all the way, jaw torn open, one curling
  //     ram horn and the other snapped to a jagged spike --------------------
  const gx = cx + lean;
  const gy = armY - 17 + headDrop;
  px(ctx, cx - 2 + lean, shY - 4, flesh, 5, 6); // a short human neck below it
  px(ctx, cx - 2 + lean, shY - 4, fleshHi, 1, 6);
  px(ctx, gx - 5, gy, PALETTE.outline, 11, 9); // cranium
  px(ctx, gx - 4, gy, PALETTE.hostBone, 9, 8);
  px(ctx, gx - 4, gy, rim, 5, 1); // lit crown
  px(ctx, gx - 4, gy + 3, PALETTE.hostBlack, 10, 1); // brow ridge
  px(ctx, gx - 3, gy + 4, PALETTE.void, 3, 3); // deep sockets
  px(ctx, gx + 2, gy + 4, PALETTE.void, 3, 3);
  // muzzle dropping and leaning aside
  for (let r = 0; r < 8; r += 1) {
    const w = 6 - Math.floor(r / 3);
    const ox = gx - Math.floor(w / 2) + Math.round(r * 0.2);
    px(ctx, ox, gy + 7 + r, PALETTE.hostBone, w, 1);
    px(ctx, ox, gy + 7 + r, rim, 1, 1);
  }
  px(ctx, gx, gy + 9, PALETTE.hostBlack, 1, 6); // muzzle seam
  px(ctx, gx - 1, gy + 13, PALETTE.void, 2, 2); // nostril
  // horns: left a curling ram horn, right a snapped jagged spike
  const leftHorn = [[-4, -1], [-6, -3], [-8, -5], [-10, -3], [-10, 0], [-9, 3], [-7, 5]];
  const rightHorn = [[4, -2], [5, -4], [6, -7]];
  for (const [dx, dy] of leftHorn) px(ctx, gx + dx - 1, gy + dy - 1, PALETTE.outline, 3, 3);
  for (const [dx, dy] of rightHorn) px(ctx, gx + dx - 1, gy + dy - 1, PALETTE.outline, 3, 3);
  for (let i = 0; i < leftHorn.length; i += 1) px(ctx, gx + leftHorn[i][0], gy + leftHorn[i][1], PALETTE.hostBone, 2, 2);
  for (let i = 0; i < rightHorn.length; i += 1) px(ctx, gx + rightHorn[i][0], gy + rightHorn[i][1], PALETTE.hostBone, 2, 2);
  px(ctx, gx + 6, gy - 7, PALETTE.hostBlack, 2, 2); // snapped tip

  if (!killed) {
    px(ctx, gx - 2, gy + 5, pulse ? PALETTE.flash : PALETTE.hostGlow, 2, 1); // a small light in the sockets
    px(ctx, gx + 3, gy + 5, gold, 2, 1);
    // jaw torn open: a black maw ringed in bone teeth, a little light in the throat
    px(ctx, gx - 4, gy + 15, PALETTE.void, 11, 5);
    for (let t = 0; t < 5; t += 1) px(ctx, gx - 4 + t * 2, gy + 15, rim, 1, 2 + (t & 1));
    for (let t = 0; t < 4; t += 1) px(ctx, gx - 3 + t * 2, gy + 19, rim, 1, 2);
    px(ctx, gx - 1, gy + 16, pulse ? PALETTE.flash : gold, 2, 2);
  } else {
    px(ctx, gx - 3, gy + 15, PALETTE.hostBlack, 8, 1); // a clenched, dead jaw
  }

  // --- A little blood pooled and spattered at the foot --------------------
  drawIsoDiamond(ctx, cx + 2, cy + 2, 22, 11, PALETTE.rustDark);
  drawNoisePixels(ctx, cx - 11, cy - 3, 24, 11, [wet, PALETTE.rustDark], 0.1, seed);
  px(ctx, cx - 2, footY, wet, 6, 2);
}
