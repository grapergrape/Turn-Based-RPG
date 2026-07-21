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

// Bone, corpse, martyr, and Host-body-horror primitives.

export function drawCorpseSilhouette(ctx, cx, cy, seed) {
  const rng = rngFrom(hash2D(seed + 29, seed * 7 + 11));
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
  // Head + dark hair at one end, boots at the other. The face keeps one lit
  // row so the near end reads as a head, not a log butt.
  px(ctx, cx + 11, cy - 5, PALETTE.skinDark, 6, 5);
  px(ctx, cx + 11, cy - 5, PALETTE.skinMid, 5, 3);
  px(ctx, cx + 12, cy - 4, PALETTE.skinLight, 3, 1); // lit cheekbone
  px(ctx, cx + 13, cy - 2, PALETTE.void, 2, 1); // slack open mouth
  px(ctx, cx + 11, cy - 6, PALETTE.clothDark, 6, 2);
  // Two legs, not one trunk: a dark seam splits them, one shin lies bent.
  px(ctx, cx - 14, cy - 1, PALETTE.void, 9, 1);
  px(ctx, cx - 16, cy + 1, PALETTE.clothDark, 6, 2);
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
  // The satchel spilled where it was dropped: a loaf of bread in the dust,
  // still whole. They were carrying it home.
  px(ctx, cx - 24, cy + 5, PALETTE.outline, 7, 4);
  px(ctx, cx - 23, cy + 5, PALETTE.skinDark, 5, 2); // the satchel flap
  px(ctx, cx - 18, cy + 8, PALETTE.outline, 6, 3);
  px(ctx, cx - 17, cy + 8, PALETTE.clothTan, 4, 2); // the loaf
  px(ctx, cx - 16, cy + 8, PALETTE.hostBone, 2, 1); // its floured top

  // Fine material cues stay human-scale: coat stitching, separated fingers,
  // hair strands, and two shallow scores across the dropped loaf.
  nativeLinePx(ctx, cx - 5.5, cy - 6.5, cx + 6.5, cy - 5.5, PALETTE.stoneDust);
  nativeLinePx(ctx, cx + 11.5, cy - 6.5, cx + 15.5, cy - 5.5, PALETTE.void);
  for (const dy of [-0.5, 0.5, 1.5]) nativePx(ctx, cx + 8.5, cy + dy, PALETTE.skinLight);
  nativeLinePx(ctx, cx - 16.5, cy + 7.5, cx - 15.5, cy + 9.5, PALETTE.skinDark);
  nativeLinePx(ctx, cx - 14.5, cy + 7.5, cx - 13.5, cy + 9.5, PALETTE.skinDark);

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
  // The ossuary heap has to read as a mounded pile of human remains: a raised
  // dark mass first, then a few large bones the eye can name (skull, femur,
  // rib arc) with black gaps between them. Never an even scatter of white.
  const rng = rngFrom(hash2D(seed + 61, seed * 9 + 7));

  // Raised mound: stacked rows, dark at the base, ashen on the lit crown.
  for (let row = 0; row < 14; row += 1) {
    const t = row / 13;
    const half = Math.round(24 * (1 - t * t * 0.82));
    const y = cy + 6 - row;
    px(ctx, cx - half - 1, y, PALETTE.outline, half * 2 + 2, 1);
    const tone = row < 3 ? PALETTE.stoneDark : row < 7 ? PALETTE.stoneMid : PALETTE.stoneDust;
    px(ctx, cx - half, y, tone, half * 2, 1);
    px(ctx, cx + Math.floor(half * 0.2), y, row < 3 ? PALETTE.void : PALETTE.stoneDark, Math.ceil(half * 0.8), 1);
    if (row >= 5 && row % 2 === 0) px(ctx, cx - half + 3 + row, y, PALETTE.hostBone, 3, 1); // bone ends in the ash
  }
  // Black gaps where bones sit loose in the heap.
  px(ctx, cx - 12, cy - 1, PALETTE.void, 5, 3);
  px(ctx, cx + 4, cy + 2, PALETTE.void, 6, 2);
  px(ctx, cx - 2, cy - 4, PALETTE.void, 4, 2);

  // A femur laid across the crown, thick enough to name.
  drawOssuaryLongBone(ctx, cx - 14, cy - 5, cx + 2, cy - 8, true);
  // A second long bone jutting out of the flank, butt end buried.
  drawOssuaryLongBone(ctx, cx + 5, cy - 2, cx + 17, cy + 3, true);
  // Rib arc standing proud of the heap.
  boneStroke(ctx, cx - 5, cy - 9, cx + 1, cy - 13, PALETTE.hostBone, 2);
  boneStroke(ctx, cx + 1, cy - 13, cx + 6, cy - 9, PALETTE.hostBone, 1);
  px(ctx, cx, cy - 14, PALETTE.stoneDust, 2, 1);

  // One skull facing out at the base, one half-buried in the crown.
  drawOssuarySkull(ctx, cx - 9, cy + 2, false, 1);
  px(ctx, cx + 9, cy - 6, PALETTE.outline, 8, 6);
  px(ctx, cx + 10, cy - 6, PALETTE.hostBone, 6, 4); // buried braincase
  px(ctx, cx + 11, cy - 4, PALETTE.void, 2, 2); // one socket above the ash
  px(ctx, cx + 9, cy - 2, PALETTE.stoneDark, 8, 2); // ash swallowing the jaw

  // Dried blood and rope scraps: this heap was butchery, not burial.
  px(ctx, cx - 4, cy + 4, PALETTE.rustDark, 8, 2);
  px(ctx, cx + 12, cy + 6, PALETTE.rustDark, 4, 1);
  px(ctx, cx - 16, cy + 3, PALETTE.clothTan, 4, 1); // cut cord
  px(ctx, cx - 14, cy + 4, PALETTE.clothTan, 2, 1);
  drawNoisePixels(ctx, cx - 18, cy - 8, 36, 16, [PALETTE.stoneDust, PALETTE.rustDark], 0.03, seed);
  nativeLinePx(ctx, cx - 12.5, cy - 5.5, cx - 4.5, cy - 7.5, PALETTE.stoneLight);
  nativeLinePx(ctx, cx + 5.5, cy - 1.5, cx + 13.5, cy + 1.5, PALETTE.hostBone);
  nativePx(ctx, cx + 10.5, cy - 5.5, PALETTE.stoneDust);
}

export function drawSkeleton(ctx, cx, cy, seed, opts = {}) {
  const bone = PALETTE.hostBone;
  const hi = PALETTE.stoneDust;
  const dark = PALETTE.void;
  const rng = rngFrom(hash2D(seed + 23, seed * 7 + 3));
  const flip = rng() < 0.5 ? 1 : -1; // head left or right

  // The ground keeps the story: a dark decay stain and the rags of whatever
  // they died in bind the bones into one body instead of loose white marks.
  drawIsoDiamond(ctx, cx, cy + 3, 36, 13, PALETTE.stoneDark);
  px(ctx, cx - flip * 6, cy + 2, PALETTE.rustDark, 9, 3); // old decay bloom
  px(ctx, cx - flip * 14, cy - 1, PALETTE.clothDark, 8, 4); // rotted coat rag
  px(ctx, cx - flip * 13, cy - 1, PALETTE.stoneDark, 5, 1);

  // Seed-driven pose so 191 placements do not read as one stamp: the spine
  // length, rib count, how far the limbs are flung, and how disturbed the body
  // is all vary. `jit` is a small deterministic wobble.
  const jit = (n) => Math.floor((rng() - 0.5) * n);
  const spread = 1 + rng() * 0.5; // some bodies more disarticulated than others
  const hx = cx + flip * (8 + Math.floor(rng() * 3)); // skull at one end
  const hy = cy - 1 + jit(2);
  // Spine running from the skull toward the pelvis, drifting as it goes.
  const vert = 8 + Math.floor(rng() * 3);
  for (let i = 0; i < vert; i += 1) {
    px(ctx, Math.round(hx - flip * (3 + i * 1.5 * spread)), hy + 1 + (i % 2) + (i > 5 ? jit(2) : 0), bone, 2, 1);
  }
  // Ribcage: a few curved ribs off the upper spine (count and splay vary).
  const ribs = 3 + Math.floor(rng() * 3);
  for (let r = 0; r < ribs; r += 1) {
    const rx = Math.round(hx - flip * (4 + r * 2 * spread));
    const ry = hy + jit(2);
    boneStroke(ctx, rx, ry - 4, rx - flip * 2, ry - 1, bone, 1);
    boneStroke(ctx, rx, ry + 4, rx - flip * 2, ry + 1, bone, 1);
    px(ctx, rx - (flip > 0 ? 1 : 0), ry - 4, hi, 2, 1);
  }
  // Pelvis at the far end.
  const pelX = Math.round(hx - flip * (15 + Math.floor(rng() * 5)));
  const pelY = hy + jit(2);
  px(ctx, pelX - 3, pelY - 1, PALETTE.outline, 8, 5);
  px(ctx, pelX - 2, pelY - 1, bone, 6, 4);
  px(ctx, pelX, pelY, dark, 2, 2);
  // Splayed limb long-bones, each flung at a slightly different angle.
  drawOssuaryLongBone(ctx, Math.round(hx - flip * 8), hy + 5, Math.round(hx - flip * (1 + jit(4))), hy + 9 + jit(3), true);
  drawOssuaryLongBone(ctx, Math.round(hx - flip * 12), hy + 5, Math.round(hx - flip * (20 + jit(5))), hy + 8 + jit(3), true);
  drawOssuaryLongBone(ctx, pelX - flip * 1, pelY + 3, pelX - flip * (10 + jit(4)), pelY + 11 + jit(3), true);
  drawOssuaryLongBone(ctx, pelX + flip * 2, pelY + 2, pelX + flip * (8 + jit(4)), pelY + 8 + jit(3), true);
  drawOssuarySkull(ctx, hx, hy - 1, false, flip);
  px(ctx, hx + flip * 5, hy - 6, PALETTE.outline, 5, 3);
  px(ctx, hx + flip * 5, hy - 7, PALETTE.stoneDust, 3, 1);
  for (let i = 0; i < 4; i += 1) {
    const fx = Math.round(hx - flip * (5 + i * 2));
    px(ctx, fx, hy + 10 + (i & 1), PALETTE.outline, 3, 2);
    px(ctx, fx + (flip > 0 ? 1 : 0), hy + 9 + (i & 1), bone, 1, 1);
  }
  drawRubbleCluster(ctx, cx + flip * 18, cy + 8, seed + 27, 2);
  drawNoisePixels(ctx, cx - 15, cy - 6, 30, 14, [PALETTE.stoneDust, PALETTE.rustDark], 0.02, seed);
  // Scavengers have dragged a long-bone clear of some bodies; the gap where it
  // used to lie still reads.
  if (rng() < 0.4) {
    const dragX = cx - flip * (22 + Math.floor(rng() * 8));
    const dragY = cy + 4 + jit(6);
    drawOssuaryLongBone(ctx, dragX, dragY, dragX - flip * 7, dragY + 2 + jit(3), true);
  }
  // Some died crawling: one hand ahead of the skull, fingers dug in, and the
  // furrows still point the way. Others simply fell.
  if (rng() < 0.6) {
    const reach = flip * (14 + Math.floor(rng() * 5));
    px(ctx, cx + reach, cy - 2, PALETTE.hostBone, 2, 1);
    px(ctx, cx + reach + flip * 2, cy - 1, PALETTE.hostBone, 1, 1);
    px(ctx, cx + reach + flip * 3, cy, PALETTE.hostBone, 1, 1);
    px(ctx, cx + reach, cy, PALETTE.stoneDark, 3, 1); // the furrows they left
  }


  // Cortical highlights, teeth, and finger bones are one physical pixel wide.
  // Their placement follows this body's generated pose instead of floating as
  // generic noise around the silhouette.
  nativeLinePx(ctx, hx - flip * 4.5, hy + 1.5, pelX + flip * 1.5, pelY + 0.5, PALETTE.stoneDust);
  nativeLinePx(ctx, pelX - flip * 0.5, pelY + 3.5, pelX - flip * 8.5, pelY + 10.5, PALETTE.hostBone);
  for (let tooth = -1; tooth <= 1; tooth += 1) {
    nativePx(ctx, hx + flip * (tooth * 0.5), hy + 3.5, PALETTE.hostBone);
  }
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
  // In one niche in four the Choir has been: the middle shelf rearranged
  // into a deliberate radiant of femurs around a skull, one gold pin pressed
  // into its brow. They do not desecrate the dead; they reorganize them.
  if (seed % 4 === 0) {
    const mcx = x + Math.floor(w / 2);
    const mcy = top + 16;
    px(ctx, mcx - 8, mcy - 4, dark, 16, 8); // clear the shelf behind
    for (const [dx, dy] of [[-7, -3], [7, -3], [-8, 2], [8, 2]]) {
      linePx(ctx, mcx, mcy, mcx + dx, mcy + dy, PALETTE.hostBone, 1);
    }
    px(ctx, mcx - 2, mcy - 3, PALETTE.outline, 5, 6);
    px(ctx, mcx - 1, mcy - 2, PALETTE.hostBone, 3, 4);
    px(ctx, mcx, mcy, dark, 1, 1); // one socket
    px(ctx, mcx, mcy - 2, PALETTE.hostGold, 1, 1); // the pin in the brow
  }

  nativeLinePx(ctx, x + 1.5, top - 3.5, x + 10.5, top - 4.5, PALETTE.stoneLight);
  nativeLinePx(ctx, x + 4.5, top + 11.5, x + 11.5, top + 11.5, PALETTE.hostBone);
  nativeLinePx(ctx, x + w - 9.5, top + 19.5, x + w - 4.5, top + 19.5, PALETTE.stoneDust);

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
  // Scratch marks climbing the inside rim of the cavity, in sets of four.
  // The lid was not moved from the outside.
  for (let s = 0; s < 4; s += 1) {
    px(ctx, cx - 9 + s * 3, ly + 5 - (s % 2), PALETTE.stoneDust, 1, 3);
  }
  px(ctx, cx + 6, ly + 4, PALETTE.stoneDust, 1, 3);
  px(ctx, cx + 8, ly + 5, PALETTE.stoneDust, 1, 2);

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

  // Faint tool passes survive inside the lid's broad carved planes. They add
  // native-scale stone texture without softening the hard slab silhouette.
  nativeLinePx(ctx, cx + slide - 13.5, ly - 10.5, cx + slide - 5.5, ly - 13.5, PALETTE.stoneLight);
  nativeLinePx(ctx, cx + slide + 5.5, ly - 6.5, cx + slide + 14.5, ly - 9.5, PALETTE.stoneDark);
  nativeLinePx(ctx, cx - 17.5, cy - 12.5, cx - 10.5, cy - 14.5, PALETTE.stoneDust);
}

export function drawGraveyardWall(ctx, cx, cy, seed, opts = {}) {
  const frame = isoFrame(cx, cy, opts.orient ?? 'se');
  const rng = rngFrom(hash2D(seed + 211, seed * 5 + 17));
  const len = 0.84 + (rng() > 0.58 ? 0.08 : 0);
  const chipped = rng() > 0.52;

  // Waist-high consecrated masonry: enough mass and cap light that the wall
  // reads as a wall from gameplay distance, not as scattered kerb stones.
  const box = orientedBox(ctx, frame, len, 0.26, 17, {
    top: chipped ? PALETTE.stoneMid : PALETTE.stoneLight,
    lit: PALETTE.stoneMid,
    shade: PALETTE.stoneDark,
    outline: PALETTE.outline
  });
  // Block courses along the lit face.
  for (const t of [-0.28, 0, 0.28]) {
    const a = frame.point(t, 0.13, 4);
    const b = frame.point(t, 0.13, 13);
    linePx(ctx, a[0], a[1], b[0], b[1], PALETTE.stoneDark, 1);
  }
  const courseA = frame.point(-len / 2 + 0.06, 0.13, 8);
  const courseB = frame.point(len / 2 - 0.06, 0.13, 8);
  linePx(ctx, courseA[0], courseA[1], courseB[0], courseB[1], PALETTE.stoneDark, 1);

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

  // Half-pixel seams and cap scratches follow the actual oriented masonry.
  const nativeCapA = mixPoint(box.cap.left, box.cap.top, 0.18);
  const nativeCapB = mixPoint(box.cap.left, box.cap.top, 0.58);
  nativeLinePx(ctx, nativeCapA[0], nativeCapA[1] + 0.5, nativeCapB[0], nativeCapB[1] + 0.5, PALETTE.stoneLight);
  const nativeFaceA = frame.point(-0.18, 0.13, 6);
  const nativeFaceB = frame.point(0.18, 0.13, 9);
  nativeLinePx(ctx, nativeFaceA[0], nativeFaceA[1], nativeFaceB[0], nativeFaceB[1], PALETTE.stoneDark);
}

const GRAVEYARD_CHAPEL_STYLES = {
  mortuary: {
    wallH: 52,
    roofRise: 28,
    bellHeight: 23,
    wallLit: PALETTE.stoneMid,
    wallShade: PALETTE.stoneDark,
    trim: PALETTE.stoneDust,
    roof: PALETTE.woodDark,
    roofShade: PALETTE.outline,
    roofLight: PALETTE.stoneMid
  },
  vigil: {
    wallH: 48,
    roofRise: 25,
    bellHeight: 18,
    wallLit: PALETTE.stoneMid,
    wallShade: PALETTE.stoneDark,
    trim: PALETTE.stoneDust,
    roof: PALETTE.stoneDark,
    roofShade: PALETTE.outline,
    roofLight: PALETTE.stoneMid
  }
};

function graveyardChapelStyle(variant) {
  return GRAVEYARD_CHAPEL_STYLES[variant] ?? GRAVEYARD_CHAPEL_STYLES.mortuary;
}

function chapelLift(point, amount) {
  return [point[0], point[1] - amount];
}

function drawGraveyardChapelFace(ctx, face, style, seed, opts = {}) {
  // Course lines and narrow buttresses keep the masonry from becoming a flat
  // slab at gameplay scale. The upper-left side stays visibly lighter.
  for (const v of [0.16, 0.38, 0.63, 0.84]) {
    face.line(0.04, v, 0.96, v, PALETTE.stoneDark, 1);
  }
  const bands = [[0.05, 0.16], [0.16, 0.38], [0.38, 0.63], [0.63, 0.84], [0.84, 0.97]];
  for (let row = 0; row < bands.length; row += 1) {
    const [v0, v1] = bands[row];
    const offset = ((seed + row) & 1) ? 0.08 : -0.02;
    for (const u of [0.24 + offset, 0.57 + offset, 0.84 + offset]) {
      if (u <= 0.08 || u >= 0.92) continue;
      face.line(u, v0 + 0.015, u, v1 - 0.015, row === 0 && u < 0.4 ? PALETTE.stoneDust : PALETTE.stoneDark, 1);
    }
  }
  const buttresses = [];
  if (opts.leftEdge !== false) buttresses.push([0.06, 0.14]);
  if (opts.rightEdge !== false) buttresses.push([0.86, 0.94]);
  for (const [u0, u1] of buttresses) {
    face.rect(u0, 0.12, u1, 0.98, PALETTE.outline);
    face.rect(u0 + 0.025, 0.15, u1 - 0.02, 0.94, style.wallShade);
    face.line(u0 + 0.03, 0.16, u0 + 0.03, 0.93, style.trim, 1);
  }

  if (opts.doorHalf === 'left' || opts.doorHalf === 'right') {
    const left = opts.doorHalf === 'left';
    const shoulder = left ? 0.61 : 0.39;
    const seam = left ? 1 : 0;
    const outline = left
      ? [face.point(shoulder, 0.36), face.point(seam, 0.04), face.point(seam, 1), face.point(shoulder, 1)]
      : [face.point(seam, 0.04), face.point(shoulder, 0.36), face.point(shoulder, 1), face.point(seam, 1)];
    const recess = left
      ? [face.point(0.66, 0.39), face.point(seam, 0.09), face.point(seam, 0.98), face.point(0.66, 0.98)]
      : [face.point(seam, 0.09), face.point(0.34, 0.39), face.point(0.34, 0.98), face.point(seam, 0.98)];
    const leaf = left
      ? [face.point(0.69, 0.42), face.point(seam, 0.13), face.point(seam, 0.96), face.point(0.69, 0.96)]
      : [face.point(seam, 0.13), face.point(0.31, 0.42), face.point(0.31, 0.96), face.point(seam, 0.96)];
    poly(ctx, PALETTE.outline, outline);
    poly(ctx, PALETTE.void, recess);
    poly(ctx, PALETTE.woodDark, leaf);

    const outer = left ? 0.69 : 0.31;
    face.line(outer, 0.44, seam, 0.15, left ? style.trim : PALETTE.stoneDark, 1);
    for (const v of [0.67, 0.84]) {
      face.line(left ? 0.7 : 0.03, v, left ? 0.97 : 0.3, v, PALETTE.rustDark, 1);
    }
    face.line(left ? 0.83 : 0.08, 0.42, left ? 0.83 : 0.08, 0.94, PALETTE.outline, 1);
    const handle = face.point(left ? 0.91 : 0.09, 0.73);
    px(ctx, handle[0] - 1, handle[1] - 1, PALETTE.rustLight, 2, 2);
    face.line(left ? 0.58 : 0, 0.96, left ? 1 : 0.42, 0.96, style.trim, 2);
    return;
  }

  // One centered lancet per side bay. It is a deep blind opening rather than a
  // light source, with a pale upper-left jamb and a dark lower-right jamb.
  if (opts.window === false) return;
  face.rect(0.34, 0.34, 0.66, 0.69, PALETTE.outline);
  face.rect(0.39, 0.38, 0.61, 0.68, PALETTE.void);
  face.line(0.34, 0.35, 0.5, 0.17, PALETTE.outline, 2);
  face.line(0.5, 0.17, 0.66, 0.35, PALETTE.outline, 2);
  face.line(0.38, 0.36, 0.5, 0.21, style.trim, 1);
  face.line(0.5, 0.21, 0.62, 0.36, PALETTE.stoneDark, 1);
  face.line(0.5, 0.31, 0.5, 0.67, PALETTE.stoneDark, 1);
  face.line(0.37, 0.71, 0.63, 0.71, PALETTE.stoneDust, 2);
}

function drawNativeGraveyardChapelFace(face, seed, style, shaded) {
  const light = shaded ? PALETTE.stoneDark : style.trim;
  const dark = shaded ? PALETTE.outline : PALETTE.stoneDark;
  for (let i = 0; i < 5; i += 1) {
    const hash = hash2D(seed + i * 41, seed * 13 + i * 23);
    const u = 0.1 + ((hash & 255) / 255) * 0.79;
    const v = 0.13 + (((hash >>> 8) & 255) / 255) * 0.75;
    face.nativeLine(u, v, Math.min(0.95, u + 0.075), v + (((hash >>> 16) & 1) ? 0.012 : -0.012), i & 1 ? dark : light);
  }
}

function drawChapelGableOculus(ctx, center, style, variant) {
  const radius = variant === 'vigil' ? 4 : 5;
  const outer = [
    [center[0], center[1] - radius],
    [center[0] + radius, center[1] - 1],
    [center[0] + radius - 1, center[1] + radius],
    [center[0] - radius + 1, center[1] + radius],
    [center[0] - radius, center[1] - 1]
  ];
  poly(ctx, PALETTE.outline, outer);
  px(ctx, center[0] - radius + 2, center[1] - radius + 2, style.trim, radius * 2 - 3, 2);
  px(ctx, center[0] - radius + 2, center[1], PALETTE.void, radius * 2 - 3, radius - 1);
  px(ctx, center[0] - 1, center[1] - radius + 2, PALETTE.stoneDark, 2, radius * 2 - 2);
  px(ctx, center[0] - radius + 2, center[1], PALETTE.stoneDark, radius * 2 - 3, 1);
}

function drawChapelBellCot(ctx, ridge, style, variant, seed) {
  const compact = variant === 'vigil';
  const height = style.bellHeight;
  const half = compact ? 9 : 11;
  const pierW = compact ? 3 : 4;
  const innerHalf = half - pierW - 1;
  const roofPeak = compact ? 5 : 7;

  // The cot is an extension of the front gable wall. Its local horizontal
  // axis therefore follows the same 2:1 isometric wall run, instead of using
  // screen-horizontal rectangles that read as floating crossbars.
  const point = (along, up) => [
    ridge[0] + along,
    ridge[1] + 3 + along * 0.5 - up
  ];

  // A shallow stone saddle straddles the ridge and lands on the supporting
  // wall plane below. Both long edges keep the facade's projected slope.
  poly(ctx, PALETTE.outline, [
    point(-half - 2, 6),
    point(half + 2, 6),
    point(half + 2, 0),
    point(-half - 2, 0)
  ]);
  poly(ctx, style.wallShade, [
    point(-half, 5),
    point(half, 5),
    point(half, 2),
    point(-half, 2)
  ]);
  linePx(ctx, ...point(-half + 1, 6), ...point(half - 1, 6), style.trim, 1);

  const pierTop = height - 6;
  // Deep pointed opening first, then the two piers that frame it. The left
  // pier catches the upper-left light while the right pier stays shaded.
  poly(ctx, PALETTE.void, [
    point(-innerHalf, 6),
    point(-innerHalf, pierTop - 2),
    point(0, height - 1),
    point(innerHalf, pierTop - 2),
    point(innerHalf, 6)
  ]);
  poly(ctx, PALETTE.outline, [
    point(-half - 1, 5),
    point(-innerHalf + 1, 5),
    point(-innerHalf + 1, pierTop),
    point(-half - 1, pierTop)
  ]);
  poly(ctx, style.wallLit, [
    point(-half, 6),
    point(-innerHalf, 6),
    point(-innerHalf, pierTop - 1),
    point(-half, pierTop - 1)
  ]);
  poly(ctx, PALETTE.outline, [
    point(innerHalf - 1, 5),
    point(half + 1, 5),
    point(half + 1, pierTop),
    point(innerHalf - 1, pierTop)
  ]);
  poly(ctx, style.wallShade, [
    point(innerHalf, 6),
    point(half, 6),
    point(half, pierTop - 1),
    point(innerHalf, pierTop - 1)
  ]);
  linePx(ctx, ...point(-half + 1, 7), ...point(-half + 1, pierTop - 2), style.trim, 1);

  // A small cast bell hangs inside the opening. Rust is metal weathering here,
  // not ritual color, and the bright pixels stay to one hard specular edge.
  const bell = point(0, 10);
  px(ctx, bell[0] - 3, bell[1] - 5, PALETTE.rustDark, 7, 5);
  px(ctx, bell[0] - 2, bell[1] - 6, PALETTE.rustMid, 5, 2);
  px(ctx, bell[0] - 3, bell[1], PALETTE.outline, 7, 2);
  px(ctx, bell[0] - 2, bell[1], PALETTE.rustLight, 4, 1);
  px(ctx, bell[0], bell[1] + 2, PALETTE.rustLight, 1, 2);

  // The little gable roof shares the wall plane too. Its eaves and both stone
  // courses are projected from the same point helper as the piers and saddle.
  poly(ctx, PALETTE.outline, [
    point(-half - 2, pierTop - 1),
    point(0, height + roofPeak),
    point(half + 2, pierTop - 1),
    point(half + 1, pierTop - 4),
    point(0, height + roofPeak - 3),
    point(-half - 1, pierTop - 4)
  ]);
  linePx(ctx, ...point(-half, pierTop), ...point(0, height + roofPeak - 1), style.roofLight, 1);
  linePx(ctx, ...point(0, height + roofPeak - 1), ...point(half, pierTop), style.roofShade, 1);
  linePx(ctx, ...point(-half + 2, pierTop - 3), ...point(half - 2, pierTop - 3), PALETTE.stoneDark, 1);
  if ((seed & 1) === 0) {
    const chip = point(half - 2, pierTop - 2);
    px(ctx, chip[0] - 1, chip[1] - 1, PALETTE.stoneDust, 3, 2);
  }
}

function drawChapelButtress(ctx, foot, style, height, seed, lit = true) {
  drawIsoPrism(ctx, foot[0], foot[1], 16, 8, 5, {
    left: lit ? style.wallLit : style.wallShade,
    right: PALETTE.stoneDark,
    top: style.trim,
    outline: PALETTE.outline
  });
  drawIsoPrism(ctx, foot[0], foot[1] - 4, 11, 6, height, {
    left: lit ? style.wallLit : PALETTE.stoneDark,
    right: style.wallShade,
    top: PALETTE.stoneDust,
    outline: PALETTE.outline
  });
  px(ctx, foot[0] - 4, foot[1] - height - 7, style.trim, 5, 1);
  if ((seed & 3) === 0) px(ctx, foot[0] + 1, foot[1] - Math.floor(height * 0.55), PALETTE.outline, 2, 5);
}

// Connected cemetery chapel tiles. The two authored variants share a cold
// masonry body, steep slate roof, pointed recesses, and one broken bell-cot.
// They are full tile blocks so their walkability matches the visible footprint.
export function drawGraveyardChapelBlock(ctx, cx, cy, seed, opts = {}) {
  const connected = opts.connected ?? {};
  const style = graveyardChapelStyle(opts.variant);
  const rng = rngFrom(hash2D(seed + 307, seed * 11 + 83));
  const base = diamond(cx, cy, TILE_WIDTH, TILE_HEIGHT);
  const wallTop = diamond(cx, cy - style.wallH, TILE_WIDTH, TILE_HEIGHT);


  if (!connected.yPlus) {
    poly(ctx, style.wallLit, [wallTop.left, wallTop.bottom, base.bottom, base.left]);
    const face = faceTools(ctx, wallTop.left, wallTop.bottom, base.bottom, base.left);
    drawGraveyardChapelFace(ctx, face, style, seed, {
      doorHalf: !connected.xMinus ? 'left' : !connected.xPlus ? 'right' : null,
      leftEdge: !connected.xMinus,
      rightEdge: !connected.xPlus,
      window: false
    });
    drawNativeGraveyardChapelFace(face, seed + 79, style, false);
    face.line(0.03, 0.04, 0.97, 0.04, style.trim, 2);

    // The end wall rises into the roof instead of stopping at a flat cap. A
    // two-cell-wide footprint contributes one half-gable from each front cell.
    if (!connected.xMinus) {
      const ridge = chapelLift(wallTop.bottom, style.roofRise);
      poly(ctx, style.wallLit, [wallTop.left, ridge, wallTop.bottom]);
      linePx(ctx, wallTop.left[0], wallTop.left[1], ridge[0], ridge[1], style.trim, 2);
    }
    if (!connected.xPlus) {
      const ridge = chapelLift(wallTop.left, style.roofRise);
      poly(ctx, style.wallShade, [wallTop.left, ridge, wallTop.bottom]);
      linePx(ctx, ridge[0], ridge[1], wallTop.bottom[0], wallTop.bottom[1], PALETTE.stoneDark, 2);
      const oculus = mixPoint(ridge, wallTop.left, 0.58);
      drawChapelGableOculus(ctx, oculus, style, opts.variant);
    }
  }
  if (!connected.xPlus) {
    poly(ctx, style.wallShade, [wallTop.bottom, wallTop.right, base.right, base.bottom]);
    const face = faceTools(ctx, wallTop.bottom, wallTop.right, base.right, base.bottom);
    drawGraveyardChapelFace(ctx, face, style, seed + 19, {
      leftEdge: !connected.yPlus,
      rightEdge: !connected.yMinus,
      window: true
    });
    drawNativeGraveyardChapelFace(face, seed + 97, style, true);
    face.line(0.04, 0.04, 0.96, 0.04, PALETTE.stoneDark, 2);
  }

  // The roof now has two true slopes. The left cell rises from its outer wall
  // to the shared centreline, and the right cell falls from that same ridge to
  // its outer wall. Every eave point is derived from wallTop, so roof and walls
  // cannot drift apart as the footprint changes.
  const leftSlope = !connected.xMinus;
  const plane = leftSlope
    ? [wallTop.top, chapelLift(wallTop.right, style.roofRise), chapelLift(wallTop.bottom, style.roofRise), wallTop.left]
    : [chapelLift(wallTop.top, style.roofRise), wallTop.right, wallTop.bottom, chapelLift(wallTop.left, style.roofRise)];
  poly(ctx, leftSlope ? style.roof : style.roofShade, plane);

  // Slate courses run parallel to the eave and ridge. Short staggered joints
  // cross only one course at a time, avoiding the old roof-wide checker grid.
  for (const t of [0.18, 0.36, 0.54, 0.72, 0.88]) {
    const back = mixPoint(plane[0], plane[1], t);
    const front = mixPoint(plane[3], plane[2], t);
    linePx(ctx, back[0], back[1], front[0], front[1], leftSlope && t < 0.55 ? style.roofLight : PALETTE.stoneDark, 1);
  }
  const roofPoint = (slope, depth) => {
    const back = mixPoint(plane[0], plane[1], slope);
    const front = mixPoint(plane[3], plane[2], slope);
    return mixPoint(back, front, depth);
  };
  const courseStops = [0.08, 0.18, 0.36, 0.54, 0.72, 0.88];
  for (let course = 0; course < courseStops.length - 1; course += 1) {
    const depth = 0.24 + (((seed + course * 3) & 3) * 0.17);
    const a = roofPoint(courseStops[course], depth);
    const b = roofPoint(courseStops[course + 1], depth);
    linePx(ctx, a[0], a[1], b[0], b[1], style.roofShade, 1);
  }
  const fineSlateA = roofPoint(0.26 + (seed & 3) * 0.06, 0.34);
  const fineSlateB = roofPoint(0.38 + (seed & 3) * 0.055, 0.34);
  nativeLinePx(ctx, fineSlateA[0] + 0.5, fineSlateA[1] - 0.5, fineSlateB[0] + 0.5, fineSlateB[1] - 0.5, style.roofLight);
  const fineSlateC = roofPoint(0.6, 0.58 + ((seed >>> 2) & 3) * 0.06);
  const fineSlateD = roofPoint(0.74, 0.58 + ((seed >>> 2) & 3) * 0.06);
  nativeLinePx(ctx, fineSlateC[0] - 0.5, fineSlateC[1] + 0.5, fineSlateD[0] - 0.5, fineSlateD[1] + 0.5, style.roofShade);
  if (leftSlope) {
    linePx(ctx, plane[1][0], plane[1][1], plane[2][0], plane[2][1], PALETTE.outline, 2);
    linePx(ctx, plane[1][0] - 1, plane[1][1] - 1, plane[2][0] - 1, plane[2][1] - 1, style.roofLight, 1);
    for (const t of [0.22, 0.5, 0.78]) {
      const cap = mixPoint(plane[1], plane[2], t);
      px(ctx, cap[0] - 2, cap[1] - 2, style.roofLight, 4, 1);
      px(ctx, cap[0] - 1, cap[1], PALETTE.stoneDark, 4, 1);
    }
  }
  if ((!connected.xMinus && leftSlope) || (!connected.xPlus && !leftSlope)) {
    linePx(ctx, plane[0][0], plane[0][1], plane[3][0], plane[3][1], PALETTE.outline, 2);
  }
  if (!connected.yPlus) {
    linePx(ctx, plane[3][0], plane[3][1], plane[2][0], plane[2][1], PALETTE.outline, 2);
  }
  if ((seed & 3) === 1) {
    const missing = roofPoint(0.42, 0.62);
    px(ctx, missing[0] - 3, missing[1] - 1, PALETTE.outline, 6, 3);
    px(ctx, missing[0] - 2, missing[1] - 1, PALETTE.stoneDark, 3, 1);
  }

  // A continuous sill keeps the façade and long wall on one architectural
  // base line. It is drawn in face coordinates, not as a screen-horizontal bar.
  if (!connected.yPlus) {
    const front = faceTools(ctx, wallTop.left, wallTop.bottom, base.bottom, base.left);
    front.line(0.02, 0.9, 0.98, 0.9, PALETTE.outline, 3);
    front.line(0.04, 0.86, 0.96, 0.86, style.trim, 1);
  }
  if (!connected.xPlus) {
    const side = faceTools(ctx, wallTop.bottom, wallTop.right, base.right, base.bottom);
    side.line(0.02, 0.9, 0.98, 0.9, PALETTE.outline, 3);
    side.line(0.04, 0.86, 0.96, 0.86, PALETTE.stoneDark, 1);
  }

  // The front-right cell draws last within this footprint, so the ridge-mounted
  // bell cot remains in front of both roof slopes and cannot float behind them.
  if (!connected.xPlus && !connected.yPlus) {
    const ridgeFront = chapelLift(wallTop.left, style.roofRise);
    drawChapelBellCot(ctx, ridgeFront, style, opts.variant, seed);
  }

  const buttressH = Math.round(style.wallH * 0.72);
  if (!connected.xMinus && !connected.yPlus) {
    drawChapelButtress(ctx, base.left, style, buttressH, seed + 17, true);
  }
  if (!connected.xPlus && !connected.yPlus) {
    drawChapelButtress(ctx, base.bottom, style, buttressH + 1, seed + 23, false);
  }
  if (!connected.xPlus && !connected.yMinus) {
    drawChapelButtress(ctx, base.right, style, buttressH - 2, seed + 29, false);
  }

  if (!connected.yPlus || !connected.xPlus) {
    const edge = !connected.yPlus ? base.bottom : base.right;
    px(ctx, edge[0] - 7, edge[1] - 2, PALETTE.stoneDust, 13, 2);
    if (rng() < 0.68) drawRubbleCluster(ctx, cx + (seed & 1 ? 24 : -23), cy + 7, seed + 313, 2);
  }
}

export function drawCalcifiedGravePlot(ctx, cx, cy, seed, opts = {}) {
  const frame = isoFrame(cx, cy, opts.orient ?? 'se');
  const rng = rngFrom(hash2D(seed + 223, seed * 3 + 31));
  const cracked = (seed % 5) === 0;
  const sunken = (seed % 4) === 1;
  const openAsh = (seed % 6) === 2;

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

  // The plot is a hollow no one was ever lowered into: the dead stand at its
  // head as their own markers. Inside is settled ash, a few dropped offerings.
  const hollow = [
    frame.point(-0.22, -0.1, 9),
    frame.point(0.21, -0.09, 9),
    frame.point(0.22, 0.1, 9),
    frame.point(-0.21, 0.1, 9)
  ];
  poly(ctx, PALETTE.void, hollow);
  const ashFill = [
    frame.point(-0.18, -0.06, 10),
    frame.point(0.17, -0.06, 10),
    frame.point(0.18, 0.07, 10),
    frame.point(-0.17, 0.07, 10)
  ];
  poly(ctx, PALETTE.stoneDark, ashFill);
  const drift = frame.point(-0.08, -0.01, 11);
  px(ctx, drift[0] - 3, drift[1], PALETTE.stoneDust, 7, 1);
  px(ctx, drift[0] + 5, drift[1] + 2, PALETTE.stoneDust, 3, 1);
  const token = frame.point(0.1, 0.02, 11);
  px(ctx, token[0] - 1, token[1] - 1, PALETTE.outline, 3, 3);
  px(ctx, token[0], token[1] - 1, seed % 2 ? PALETTE.rustMid : PALETTE.hostBone, 1, 1);
  const chip = frame.point(-0.14, 0.04, 11);
  px(ctx, chip[0], chip[1], PALETTE.hostBone, 2, 1);

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
  // One plot in five has split open from beneath, the calcified shell
  // petals bent outward and the hollow dark inside. They do not all stay.
  if (seed % 5 === 3) {
    px(ctx, cx - 4, cy - 3, PALETTE.void, 9, 5);
    px(ctx, cx - 5, cy - 4, PALETTE.hostBone, 3, 2); // a bent-out petal
    px(ctx, cx + 4, cy - 2, PALETTE.hostBone, 3, 2);
    px(ctx, cx - 2, cy + 1, PALETTE.stoneDust, 2, 1);
    px(ctx, cx + 1, cy - 3, PALETTE.hostBlack, 3, 2); // the hollow
  }

  // Calcified mineral striations sit on the rim and settled fill. Their small
  // scale distinguishes grown shell from ordinary cut graveyard stone.
  const mineralA = frame.point(-0.27, -0.13, 8.5);
  const mineralB = frame.point(0.04, -0.12, 8.5);
  nativeLinePx(ctx, mineralA[0], mineralA[1], mineralB[0], mineralB[1], PALETTE.hostBone);
  const ashA = frame.point(-0.12, 0, 10.5);
  const ashB = frame.point(0.09, 0.03, 10.5);
  nativeLinePx(ctx, ashA[0], ashA[1], ashB[0], ashB[1], PALETTE.stoneDust);

}

// Not cut stone. These graves were marked the same way as the rest: the
// calcified dead stood at the head of their own plots. The wardens broke these
// ones past waking, so what is left is a shattered human stump.
export function drawCalcifiedHeadstone(ctx, cx, cy, seed) {
  const rng = rngFrom(hash2D(seed + 239, seed * 7 + 5));
  const variant = seed % 4;
  const lean = Math.floor((rng() - 0.5) * 5);
  const bone = PALETTE.hostBone;
  const dust = PALETTE.stoneDust;
  const shade = PALETTE.stoneDark;
  const out = PALETTE.outline;

  // The low swell of the grave-planting under every stump.
  drawIsoDiamond(ctx, cx, cy + 1, 30, 12, out);
  drawIsoDiamond(ctx, cx, cy, 27, 10, shade);
  px(ctx, cx - 8, cy - 4, dust, 6, 1);

  const jagTop = (x, y, w) => {
    // A snapped-off break line: uneven teeth of stone where the body sheared.
    for (let t = 0; t < w; t += 2) {
      const spike = 1 + ((t * 5 + seed) % 3);
      px(ctx, x + t, y - spike, out, 2, spike + 1);
      px(ctx, x + t, y - spike + 1, t % 4 === 0 ? bone : dust, 1, spike);
    }
    px(ctx, x, y + 1, shade, w, 1);
  };

  if (variant === 0) {
    // Broken at the waist: hips and legs still planted, the trunk gone.
    const hipY = cy - 14;
    for (const s of [-1, 1]) {
      const legX = cx + lean + s * 3 - 1;
      px(ctx, legX - 1, hipY + 4, out, 5, 10);
      px(ctx, legX, hipY + 4, s < 0 ? bone : dust, 3, 9);
      px(ctx, legX + 2, hipY + 4, shade, 1, 9);
    }
    px(ctx, cx + lean - 5, hipY, out, 12, 5);
    px(ctx, cx + lean - 4, hipY + 1, bone, 6, 4);
    px(ctx, cx + lean + 2, hipY + 1, dust, 4, 4);
    jagTop(cx + lean - 4, hipY, 10);
    // The felled torso toppled beside the legs, face down in the ash.
    px(ctx, cx + lean - 14, cy - 4, out, 12, 6);
    px(ctx, cx + lean - 13, cy - 5, dust, 10, 5);
    px(ctx, cx + lean - 13, cy - 5, bone, 4, 2);
    px(ctx, cx + lean - 6, cy - 2, shade, 3, 2);
  } else if (variant === 1) {
    // Broken at the chest: waist up to a sheared ribline, one arm still raised.
    const baseY = cy - 8;
    for (let row = 0; row < 12; row += 1) {
      const w = 10 - Math.floor(row / 4);
      const lx = cx + lean - Math.floor(w / 2);
      px(ctx, lx - 1, baseY - row, out, w + 2, 1);
      px(ctx, lx, baseY - row, bone, w, 1);
      px(ctx, lx + w - 2, baseY - row, shade, 2, 1);
    }
    jagTop(cx + lean - 5, baseY - 11, 10);
    // Two rib ends stand proud of the break.
    px(ctx, cx + lean - 3, baseY - 15, out, 2, 5);
    px(ctx, cx + lean - 3, baseY - 14, bone, 1, 4);
    px(ctx, cx + lean + 2, baseY - 13, out, 2, 3);
    px(ctx, cx + lean + 2, baseY - 13, dust, 1, 3);
    // The arm, snapped at the wrist.
    linePx(ctx, cx + lean + 4, baseY - 9, cx + lean + 9, baseY - 16, out, 4);
    linePx(ctx, cx + lean + 4, baseY - 9, cx + lean + 9, baseY - 16, dust, 2);
    px(ctx, cx + lean + 8, baseY - 18, shade, 3, 2);
  } else if (variant === 2) {
    // Felled whole: the body lies where the hammer left it, in two pieces.
    px(ctx, cx - 12 + lean, cy - 8, out, 15, 7);
    px(ctx, cx - 11 + lean, cy - 9, bone, 12, 6);
    px(ctx, cx - 11 + lean, cy - 9, PALETTE.stoneLight, 5, 1);
    px(ctx, cx - 2 + lean, cy - 5, shade, 3, 3);
    px(ctx, cx + 4 + lean, cy - 6, out, 11, 6);
    px(ctx, cx + 5 + lean, cy - 7, dust, 9, 5);
    px(ctx, cx + 11 + lean, cy - 4, shade, 3, 2);
    // A calcified head rolled clear, sockets up.
    px(ctx, cx + 9 + lean, cy - 13, out, 7, 6);
    px(ctx, cx + 10 + lean, cy - 13, bone, 5, 5);
    px(ctx, cx + 11 + lean, cy - 11, PALETTE.void, 1, 2);
    px(ctx, cx + 13 + lean, cy - 11, PALETTE.void, 2, 2);
  } else {
    // Broken at the knee: only shins left standing, the rest dragged away.
    for (const s of [-1, 1]) {
      const legX = cx + lean + s * 3 - 1;
      const h = 8 + (s < 0 ? 3 : 0);
      px(ctx, legX - 1, cy - h, out, 5, h + 1);
      px(ctx, legX, cy - h + 1, s < 0 ? bone : dust, 3, h - 1);
      px(ctx, legX + 2, cy - h + 1, shade, 1, h - 1);
      jagTop(legX - 1, cy - h, 4);
    }
    // Drag furrows where the trunk was hauled off.
    linePx(ctx, cx + lean + 6, cy - 1, cx + lean + 15, cy + 4, shade, 1);
    linePx(ctx, cx + lean + 8, cy - 3, cx + lean + 16, cy + 1, shade, 1);
    px(ctx, cx + lean + 12, cy + 1, bone, 2, 1);
  }

  // Chips of the broken dead scattered at the base.
  for (const [dx, dy] of [[-10, -1], [9, 1], [0, 3]]) {
    px(ctx, cx + dx - 1, cy + dy - 1, out, 4, 2);
    px(ctx, cx + dx, cy + dy - 2, rng() < 0.5 ? bone : PALETTE.rustDark, 2, 1);
  }
  drawNoisePixels(ctx, cx - 12, cy - 3, 24, 8, [shade, PALETTE.rustDark], 0.06, seed);
  // A ring on a cord hung over the broken form: someone knew which of the
  // calcified this one used to be.
  px(ctx, cx + lean + 4, cy - 10, PALETTE.clothTan, 1, 4); // the cord
  px(ctx, cx + lean + 3, cy - 6, PALETTE.hostGold, 3, 2); // the ring
  px(ctx, cx + lean + 4, cy - 5, PALETTE.void, 1, 1); // its hollow

  // Hairline fractures expose the chalky lamination of the calcified body.
  nativeLinePx(ctx, cx + lean - 2.5, cy - 12.5, cx + lean + 0.5, cy - 7.5, bone);
  nativeLinePx(ctx, cx + lean + 2.5, cy - 9.5, cx + lean + 4.5, cy - 5.5, shade);
  nativePx(ctx, cx - 7.5, cy - 1.5, dust);

}

export function drawGraveyardTombSlab(ctx, cx, cy, seed, opts = {}) {
  const frame = isoFrame(cx, cy, opts.orient ?? 'se');
  const rng = rngFrom(hash2D(seed + 251, seed * 7 + 43));
  const cracked = seed % 3 === 0;

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
  // Someone still visits: a wilted twig cross and a single chit coin left
  // on the slab. The dead here have not been forgotten, only outnumbered.
  const offering = frame.point(-0.12, -0.02, 16);
  px(ctx, offering[0], offering[1] - 4, PALETTE.woodLight, 1, 5);
  px(ctx, offering[0] - 1, offering[1] - 3, PALETTE.woodLight, 3, 1);
  px(ctx, offering[0], offering[1] - 3, PALETTE.clothTan, 1, 1);
  const coin = frame.point(0.14, 0.06, 16);
  px(ctx, coin[0], coin[1], PALETTE.hostGold, 2, 1);
  px(ctx, coin[0], coin[1] - 1, PALETTE.rustLight, 1, 1);

  // Shallow carving lines contour the effigy and the slab's dressed edge.
  const nativeEffigyA = frame.point(-0.17, -0.02, 19.5);
  const nativeEffigyB = frame.point(0.13, 0.07, 19.5);
  nativeLinePx(ctx, nativeEffigyA[0], nativeEffigyA[1], nativeEffigyB[0], nativeEffigyB[1], PALETTE.stoneLight);
  const nativeEdgeA = frame.point(-0.3, -0.14, 16.5);
  const nativeEdgeB = frame.point(0.02, -0.14, 16.5);
  nativeLinePx(ctx, nativeEdgeA[0], nativeEdgeA[1], nativeEdgeB[0], nativeEdgeB[1], PALETTE.stoneDust);

}

export function drawGraveyardCatacombMouth(ctx, cx, cy, seed, opts = {}) {
  const frame = isoFrame(cx, cy, opts.orient ?? 'se');
  const rng = rngFrom(hash2D(seed + 263, seed * 11 + 47));

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
  // A hand-worn groove on the descent lip and a candle stub dropped just
  // inside the dark: the survivors went down this way, more than once.
  px(ctx, cx - 6, cy - 2, PALETTE.stoneLight, 5, 1);
  px(ctx, cx - 5, cy - 1, PALETTE.stoneDust, 3, 1);
  px(ctx, cx + 4, cy + 3, PALETTE.hostBone, 2, 2); // the stub
  px(ctx, cx + 4, cy + 2, PALETTE.rustDark, 1, 1); // its dead wick

  // Fine jamb tooling and worn tread polish reinforce the depth of the cut
  // entrance while keeping the throat itself absolute black.
  nativeLinePx(ctx, jambL[0] - 1.5, jambL[1] - 24.5, jambL[0] - 1.5, jambL[1] - 10.5, PALETTE.stoneLight);
  nativeLinePx(ctx, jambR[0] + 0.5, jambR[1] - 20.5, jambR[0] + 0.5, jambR[1] - 7.5, PALETTE.stoneDark);
  nativeLinePx(ctx, thresholdA[0] + 3.5, thresholdA[1] - 1.5, thresholdB[0] - 5.5, thresholdB[1] - 1.5, PALETTE.stoneDust);

}

export function drawGraveyardRemnantCross(ctx, cx, cy, seed) {
  const rng = rngFrom(hash2D(seed + 271, seed * 13 + 53));
  const lean = Math.floor((rng() - 0.5) * 3);

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
  // Generations of prayer cords tied up the shaft, the oldest gone grey,
  // the newest still holding its color. People keep coming back.
  px(ctx, cx - 3, cy - 30, PALETTE.clothTan, 6, 1);
  px(ctx, cx - 3, cy - 26, PALETTE.stoneDust, 6, 1);
  px(ctx, cx - 3, cy - 22, PALETTE.stoneMid, 6, 1);
  px(ctx, cx - 3, cy - 18, PALETTE.rustMid, 6, 1); // the newest cord
  px(ctx, cx + 3, cy - 17, PALETTE.rustMid, 1, 3); // its tail

  // Chalky half-pixel cracks follow the shaft and broken cross arm.
  nativeLinePx(ctx, stemX - 3.5, cy - 63.5, stemX - 2.5, cy - 53.5, PALETTE.stoneLight);
  nativeLinePx(ctx, stemX + 1.5, cy - 42.5, stemX + 0.5, cy - 29.5, PALETTE.stoneDark);
  nativeLinePx(ctx, stemX - 14.5, cy - 49.5, stemX - 7.5, cy - 49.5, PALETTE.hostBone);

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
  nativeLinePx(ctx, cx - 21.5, cy - 5.5, cx - 7.5, cy - 9.5, PALETTE.stoneDust);
  nativeLinePx(ctx, cx + 3.5, cy + 8.5, cx + 20.5, cy + 3.5, PALETTE.stoneDark);
  for (const [dx, dy] of [[-16.5, 1.5], [1.5, -5.5], [17.5, -0.5]]) {
    nativePx(ctx, cx + dx, cy + dy, PALETTE.hostBone);
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
    nativeLinePx(ctx, cx + dx - 5.5, cy + dy - 2.5, cx + dx + 1.5, cy + dy - 2.5, PALETTE.stoneLight);
    nativeLinePx(ctx, cx + dx + 0.5, cy + dy - 0.5, cx + dx + 4.5, cy + dy + 2.5, PALETTE.stoneDark);
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
  nativeLinePx(ctx, cx - 21.5, cy - 5.5, cx - 7.5, cy - 1.5, PALETTE.woodMid);
  nativeLinePx(ctx, cx - 3.5, cy + 5.5, cx + 12.5, cy - 2.5, PALETTE.woodDark);
  nativeLinePx(ctx, cx + 10.5, cy - 2.5, cx + 21.5, cy + 1.5, PALETTE.rustDark);
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
  // The scored glyph has a pale freshly cut lip beside its darker groove,
  // plus a few hairline plea marks that are legible only at native 2x.
  nativeLinePx(ctx, x - 0.5, y - 7.5, x - 0.5, y + 6.5, PALETTE.hostBone);
  nativeLinePx(ctx, x - 7.5, y - 1.5, x + 7.5, y - 1.5, PALETTE.stoneDust);
  nativeLinePx(ctx, x - 11.5, y + 5.5, x - 5.5, y + 7.5, PALETTE.stoneDust);
  nativePx(ctx, x + 10.5, y - 5.5, PALETTE.hostBone);
}

function drawFallenSaint(ctx, cx, cy, seed, settle = 1) {
  // The Opened Saint cut off the cross. He was a man-sized opened body while
  // he hung; he stays man-sized crumpled on the stone. Mass first, bone
  // accents second, so it reads as a fallen body and never as a bone icon.
  const flesh = PALETTE.skinDark;
  const fleshHi = PALETTE.skinMid;
  const coat = PALETTE.clothDark;
  const bone = PALETTE.hostBone;
  const gold = PALETTE.hostGold;
  const wet = PALETTE.hostRed;
  const pool = PALETTE.rustDark;

  // Blood pool, widest under the chest, with a drag smear back toward the
  // post where he tore off the spikes.
  ctx.save();
  ctx.globalAlpha = 0.9 * Math.max(0.15, settle);
  drawIsoDiamond(ctx, cx - 2, cy + 4, 46, 18, pool);
  drawIsoDiamond(ctx, cx + 2, cy + 3, 26, 10, wet);
  px(ctx, cx - 4, cy - 10, pool, 5, 10); // smear down from the post
  ctx.restore();
  if (settle > 0.4) drawNoisePixels(ctx, cx - 20, cy - 2, 42, 14, [wet, pool], 0.1, seed);

  // Torn spikes flung beside him.
  px(ctx, cx - 19, cy + 6, PALETTE.stoneLight, 4, 1);
  px(ctx, cx - 16, cy + 6, wet, 2, 1);
  px(ctx, cx + 15, cy + 9, PALETTE.stoneLight, 3, 1);

  // Legs first (furthest under everything): bent at the knee, still in the
  // scraps of a settlement guard's coat.
  const seg = (x0, y0, x1, y1, color, thick) => {
    const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
    for (let i = 0; i <= steps; i += 1) {
      const t = i / steps;
      px(ctx, Math.round(x0 + (x1 - x0) * t - thick / 2), Math.round(y0 + (y1 - y0) * t), color, thick, 1);
    }
  };
  seg(cx - 14, cy + 1, cx - 22, cy + 6, coat, 4); // thigh folded left
  seg(cx - 22, cy + 6, cx - 17, cy + 10, flesh, 3); // shin doubling back
  px(ctx, cx - 17, cy + 10, PALETTE.void, 4, 2); // bare foot in shadow
  seg(cx - 13, cy + 3, cx - 6, cy + 9, coat, 3); // other leg half under him
  px(ctx, cx - 6, cy + 9, flesh, 3, 2);

  // Torso mass lying diagonally, hips left, shoulders right. Two tones of
  // drained flesh with coat scraps still belted across the hip.
  for (let row = 0; row < 10; row += 1) {
    const w = 30 - Math.abs(row - 4) * 3;
    // Light from the upper-left: the upper flank keeps a lit band so the
    // flesh mass reads against the pool instead of sinking into it.
    const tone = row < 3 ? fleshHi : flesh;
    px(ctx, cx - Math.floor(w / 2) + Math.round(row * 0.6) - 4, cy - 7 + row, tone, w, 1);
  }
  px(ctx, cx - 16, cy - 2, coat, 9, 5); // coat scraps at the hip
  px(ctx, cx - 15, cy - 2, PALETTE.stoneDark, 7, 1);
  px(ctx, cx - 12, cy - 3, PALETTE.rustDark, 2, 6); // the old belt
  seg(cx - 8, cy - 7, cx + 6, cy - 8, fleshHi, 1); // lit line along the upper flank

  // The butterflied chest, fallen on its side: the near rib wing still fans
  // upward, the far wing is crushed beneath the body. Asymmetry is the point.
  px(ctx, cx - 3, cy - 6, PALETTE.void, 12, 8); // the opened cavity
  px(ctx, cx - 2, cy - 5, PALETTE.hostBlack, 10, 6);
  px(ctx, cx - 1, cy - 4, pool, 8, 4); // wet dead interior
  for (let r = 0; r < 4; r += 1) {
    // Near wing: ribs fanning up and back, leaning away from the skull so
    // the two bone masses stay separate reads.
    const rx = cx + r * 2;
    boneStroke(ctx, rx, cy - 5, rx - 2 + (r % 2), cy - 10 - r, bone, 1);
    px(ctx, rx - 2 + (r % 2), cy - 10 - r, PALETTE.stoneDust, 1, 1);
  }
  px(ctx, cx - 4, cy - 6, bone, 2, 6); // far wing: two crushed stubs
  px(ctx, cx - 5, cy - 1, bone, 2, 2);
  px(ctx, cx + 2, cy - 3, gold, 1, 2); // the pin light dying in the cavity
  px(ctx, cx + 2, cy - 1, PALETTE.hostBlack, 1, 1);

  // The belly maw, slack open against the ground, teeth loose in the pool.
  px(ctx, cx - 6, cy + 2, PALETTE.void, 9, 3);
  for (let t = 0; t < 4; t += 1) px(ctx, cx - 5 + t * 2, cy + 2, bone, 1, 2 - (t & 1));
  px(ctx, cx - 8, cy + 5, bone, 1, 1); // a shed tooth

  // Two Host tendrils out of the cavity, limp on the stone.
  seg(cx + 6, cy - 3, cx + 14, cy + 2, pool, 2);
  seg(cx + 14, cy + 2, cx + 19, cy + 1, PALETTE.rustMid, 1);
  px(ctx, cx + 19, cy + 1, gold, 1, 1);
  seg(cx + 3, cy + 1, cx + 8, cy + 6, pool, 2);
  px(ctx, cx + 8, cy + 6, PALETTE.rustMid, 1, 1);

  // Arms: one flung back toward the post, nail wound dark in the palm; the
  // other pinned under the torso, only the hand showing at the hip.
  seg(cx - 2, cy - 8, cx - 13, cy - 12, flesh, 3);
  px(ctx, cx - 15, cy - 13, fleshHi, 3, 2); // open hand
  px(ctx, cx - 14, cy - 13, PALETTE.void, 1, 1); // spike wound
  px(ctx, cx - 10, cy + 4, fleshHi, 3, 2); // trapped hand at the hip
  px(ctx, cx - 9, cy + 4, PALETTE.void, 1, 1);

  // Goat skull, man-scaled, cheek to the stone: the near horn still curls,
  // the far horn is the old snapped stub. The jaw is half-buried in the pool.
  const hx = cx + 17;
  const hy = cy - 7;
  px(ctx, hx - 5, hy - 1, PALETTE.outline, 13, 9);
  px(ctx, hx - 4, hy - 1, bone, 11, 7);
  px(ctx, hx - 4, hy - 1, PALETTE.stoneDust, 6, 1); // lit brow
  px(ctx, hx - 1, hy + 1, PALETTE.void, 2, 3); // eye socket toward the sky
  px(ctx, hx + 4, hy + 2, PALETTE.void, 3, 2); // muzzle hollow
  px(ctx, hx - 4, hy + 5, pool, 11, 2); // jaw sunk in blood
  px(ctx, hx + 2, hy + 4, PALETTE.hostBlack, 5, 1); // clenched tooth line
  const horn = [[6, -3], [8, -5], [10, -4], [11, -1], [10, 2]];
  for (const [dx, dy] of horn) px(ctx, hx + dx - 1, hy + dy - 1, PALETTE.outline, 3, 3);
  for (const [dx, dy] of horn) px(ctx, hx + dx, hy + dy, bone, 2, 2);
  px(ctx, hx - 6, hy - 3, bone, 2, 2); // snapped horn stub
  px(ctx, hx - 7, hy - 4, PALETTE.hostBlack, 2, 1);
  // Thin black-gold veins still under the skin of the neck.
  px(ctx, hx - 7, hy + 3, gold, 1, 2);
  px(ctx, hx - 8, hy + 5, PALETTE.hostBlack, 1, 1);
  // The carving knife dropped where the cutter stood, and one sacrament
  // bowl overturned beside it: when the Saint came down, they ran.
  px(ctx, cx - 22, cy + 6, PALETTE.stoneLight, 5, 1); // the dropped blade
  px(ctx, cx - 24, cy + 7, PALETTE.woodDark, 2, 1); // its grip
  px(ctx, cx - 18, cy + 10, PALETTE.outline, 7, 3);
  px(ctx, cx - 17, cy + 10, PALETTE.rustMid, 5, 2); // the overturned bowl
  px(ctx, cx - 15, cy + 12, PALETTE.skinMid, 3, 1); // what spilled from it

  // The landed state keeps rib striations, horn lamination, cloth stitching,
  // and a final black-gold capillary at one physical pixel.
  nativeLinePx(ctx, cx - 14.5, cy - 2.5, cx - 7.5, cy - 1.5, PALETTE.stoneDust);
  nativeLinePx(ctx, cx - 0.5, cy - 5.5, cx + 3.5, cy - 10.5, PALETTE.hostBone);
  nativeLinePx(ctx, hx + 5.5, hy - 3.5, hx + 9.5, hy - 4.5, PALETTE.stoneDust);
  nativeLinePx(ctx, hx - 7.5, hy + 2.5, hx - 8.5, hy + 5.5, PALETTE.hostGold);
  nativePx(ctx, cx - 14.5, cy - 13.5, PALETTE.skinLight);

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

  // Cross grain and nail glints are shared by the living, dead, and released
  // branches, guaranteeing a native redraw even when the body has fallen.
  nativeLinePx(ctx, cx - 2.5, topY + 2.5, cx - 1.5, footY - 5.5, PALETTE.woodLight);
  nativeLinePx(ctx, cx - beamHalf + 2.5, armY - 1.5, cx + beamHalf - 3.5, armY - 0.5, PALETTE.woodMid);
  nativePx(ctx, cx - beamHalf + 2.5, armY - 0.5, PALETTE.stoneLight);
  nativePx(ctx, cx + beamHalf - 3.5, armY - 0.5, PALETTE.stoneLight);

  // --- Cut down: the cross hangs empty (torn nails, blood) and the body has
  //     dropped off it to crumple and die on the ground below ---------------
  if (released) {
    px(ctx, cx - beamHalf + 1, armY - 1, PALETTE.stoneLight, 2, 3); // wrist nails left in the beam
    px(ctx, cx + beamHalf - 3, armY - 1, PALETTE.stoneLight, 2, 3);
    px(ctx, cx - beamHalf + 1, armY + 2, wet, 3, 2); // torn-flesh smears
    px(ctx, cx + beamHalf - 4, armY + 2, wet, 3, 2);
    const dropY = Math.round(footY - (1 - fall) * 40); // falls from the beam to the floor
    // He pitched forward off the beam, so the body lies clear of the post.
    drawFallenSaint(ctx, cx + 9, dropY + 5, seed, fall);
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
  const cavX = spineX - 5;
  const cavTop = tTop + 1;
  const cavW = 10;
  const cavH = 18;
  px(ctx, cavX - 1, cavTop - 1, fleshSh, cavW + 2, cavH + 2); // bruised torn lip of the opening
  px(ctx, cavX, cavTop, PALETTE.void, cavW, cavH); // open cavity down the middle
  px(ctx, cavX + 1, cavTop + 1, PALETTE.rustDark, cavW - 2, cavH - 2); // wet inside
  px(ctx, cavX + 2, cavTop + 4, dark, cavW - 4, cavH - 8); // deeper dark behind the blood
  // The spine laid bare at the back of the cavity: pale vertebra knuckles with
  // dark gaps between them, so the opening reads as a body emptied to the bone.
  for (let v = 0; v < 5; v += 1) {
    px(ctx, spineX - 1, cavTop + 2 + v * 3, bone, 2, 2);
  }
  for (const s of [-1, 1]) {
    const baseX = s < 0 ? cavX : cavX + cavW - 1;
    for (let i = 0; i < 5; i += 1) {
      const ry = cavTop + 1 + i * 4;
      const reach = 12 - Math.abs(i - 2) * 2; // middle ribs longest
      const liftv = (i - 2) * (i < 2 ? 3.4 : 2.4); // sweeps high at the top, settles low
      for (let k = 0; k <= reach; k += 1) {
        const tt = k / reach;
        const x = baseX + s * k;
        const y = Math.round(ry + liftv * tt - Math.sin(tt * Math.PI) * 3.2);
        px(ctx, x, y + 2, PALETTE.void, 1, 1); // shadow under the rib
        px(ctx, x, y, bone, 1, 2); // bold 2px rib
        if (k === 3 || k === 7) px(ctx, x, y, PALETTE.stoneDust, 1, 1); // ridge notch
      }
      // hooked bone tip, lifted like a wing feather
      px(ctx, baseX + s * (reach + 1), Math.round(ry + liftv) - 2, bone, 1, 2);
    }
  }
  // the split sternum halves, peeled apart to either side of the opening
  px(ctx, cavX - 1, cavTop - 1, bone, 3, 2);
  px(ctx, cavX + cavW - 2, cavTop - 1, bone, 3, 2);
  px(ctx, spineX, cavTop - 1, fleshSh, 1, 1);
  // blood run out of the cavity and down the belly
  px(ctx, spineX - 3, cavTop + cavH, wet, 1, 4);
  px(ctx, spineX + 2, cavTop + cavH, PALETTE.rustDark, 1, 6);

  // The single wound deep in the cavity (moderate: a wet core, a small glow)
  if (!killed) {
    const glow = pulse ? PALETTE.hostGlow : gold;
    px(ctx, cavX + 3, cavTop + 6, wet, 5, 7);
    px(ctx, cavX + 4, cavTop + 8, glow, 2, 3);
    if (pulse) px(ctx, cavX + 4, cavTop + 9, PALETTE.flash, 1, 1); // burning core
    // thin gold seams crawl from the wound up under the chest skin
    px(ctx, cavX - 2, cavTop + 4, gold, 1, 1);
    px(ctx, cavX + cavW + 1, cavTop + 7, gold, 1, 1);
  } else {
    px(ctx, cavX + 3, cavTop + 7, PALETTE.rustDark, 5, 6);
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

  // The cult has been cutting from him: parallel carve strips down the near
  // thigh, the newest still wet, taken slice by slice while the pin light
  // keeps him alive through all of it.
  if (!dead) {
    seg(cx + lean - 3, hipY + 3, kneeX + 2, kneeY - 4, PALETTE.rustDark, 1);
    seg(cx + lean, hipY + 4, kneeX + 4, kneeY - 3, wet, 1);
    px(ctx, kneeX + 4, kneeY - 2, PALETTE.rustMid, 1, 1); // the wet lip of the newest cut
    px(ctx, kneeX + 3, kneeY, wet, 1, 4); // a drip finding its way down the shin
    // The gold pin light in the cavity touches the post behind him.
    px(ctx, cx + 3, armY + 20, alivePulse ? PALETTE.hostGlow : gold, 1, 3);
    px(ctx, cx + 3, armY + 23, PALETTE.hostBlack, 1, 1);
  }

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
  nativeLinePx(ctx, cavX - 0.5, cavTop + 0.5, cavX - 6.5, cavTop + 5.5, rim);
  nativeLinePx(ctx, cavX + cavW - 0.5, cavTop + 1.5, cavX + cavW + 5.5, cavTop + 6.5, bone);
  nativeLinePx(ctx, gx - 3.5, gy - 0.5, gx + 3.5, gy - 0.5, PALETTE.stoneDust);
  nativeLinePx(ctx, gx - 0.5, gy + 8.5, gx + 0.5, gy + 13.5, PALETTE.hostBlack);
  nativePx(ctx, kneeX + 0.5, kneeY - 0.5, gold);
}
