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
    px(ctx, cx - Math.floor(w / 2) - 4, cy - 6 + row, tone, w, 1);
  }
  px(ctx, cx - 20, cy - 6, PALETTE.outline, 2, 8);
  // Head + dark hair at one end, boots at the other.
  px(ctx, cx + 11, cy - 5, PALETTE.skinDark, 6, 5);
  px(ctx, cx + 11, cy - 5, PALETTE.skinMid, 5, 3);
  px(ctx, cx + 11, cy - 6, PALETTE.clothDark, 6, 2);
  px(ctx, cx - 19, cy - 1, PALETTE.stoneDark, 7, 3);
  // A slack outflung arm and pale hand.
  px(ctx, cx, cy + 1, PALETTE.clothDark, 8, 2);
  px(ctx, cx + 8, cy + 2, PALETTE.skinMid, 2, 2);
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
  drawShadowBlob(ctx, cx, cy + 3, 38, 15);
  const rng = rngFrom(hash2D(seed + 61, seed * 9 + 7));
  for (let i = 0; i < 7; i += 1) {
    const x0 = cx + Math.floor((rng() - 0.5) * 28);
    const y0 = cy + Math.floor((rng() - 0.5) * 9);
    const len = 8 + Math.floor(rng() * 12);
    const lean = Math.floor(rng() * 5) - 2;
    drawOssuaryLongBone(ctx, x0, y0, x0 + len, y0 + lean, true);
  }
  drawOssuarySkull(ctx, cx - 4, cy - 5, false, rng() < 0.5 ? -1 : 1);
  drawOssuarySkull(ctx, cx + 9, cy + 1, true, 1);
  for (let rib = 0; rib < 5; rib += 1) {
    const rx = cx - 14 + rib * 6 + Math.floor(rng() * 2);
    const ry = cy - 1 + Math.floor(rng() * 5);
    boneStroke(ctx, rx, ry - 4, rx + 2, ry + 2, PALETTE.hostBone, 1);
    px(ctx, rx + 2, ry + 2, PALETTE.outline, 2, 1);
  }
  drawNoisePixels(ctx, cx - 20, cy - 11, 40, 22, [PALETTE.stoneDust, PALETTE.rustDark], 0.03, seed);
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
  drawNoisePixels(ctx, cx - 15, cy - 6, 30, 14, [PALETTE.stoneDust, PALETTE.rustDark], 0.03, seed);
}

export function drawBoneNiche(ctx, cx, cy, seed, opts = {}) {
  const stone = PALETTE.stoneMid;
  const lo = PALETTE.stoneDark;
  const dust = PALETTE.stoneDust;
  const bone = PALETTE.hostBone;
  const dark = PALETTE.void;
  const rng = rngFrom(hash2D(seed + 41, seed * 5 + 9));
  const w = 28;
  const h = 32;
  const top = cy - h + 4;
  const x = Math.round(cx - w / 2);

  drawShadowBlob(ctx, cx, cy + 3, 30, 13);
  px(ctx, x - 2, top - 2, PALETTE.outline, w + 4, h + 4);
  px(ctx, x - 1, top - 1, lo, w + 2, h + 2);
  px(ctx, x + 2, top + 4, dark, w - 4, h - 7); // deep recess
  px(ctx, x - 2, top - 3, stone, w + 4, 4); // lintel
  px(ctx, x - 2, top - 3, dust, w + 4, 1);
  px(ctx, x - 2, top, stone, 3, h); // left jamb
  px(ctx, x + w - 1, top, stone, 3, h); // right jamb
  px(ctx, x + 1, top + h - 3, stone, w - 2, 3);
  px(ctx, x + 3, top + 2, PALETTE.outline, w - 6, 1);

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
  }
  // A few loose pale fragments catch the eye at the base.
  drawOssuaryLongBone(ctx, x + 5, cy - 1, x + 15, cy + 2, true);
  px(ctx, x + w - 7, cy - 2, bone, 4, 2);
  px(ctx, x + w - 8, cy - 3, PALETTE.outline, 6, 1);
  drawNoisePixels(ctx, x, top, w, h, [lo, PALETTE.stoneDark], 0.05, seed);
}

export function drawStoneTomb(ctx, cx, cy, seed, opts = {}) {
  const opened = Boolean(opts.opened);
  const stone = PALETTE.stoneMid;
  const hi = PALETTE.stoneLight;
  const lo = PALETTE.stoneDark;
  const dust = PALETTE.stoneDust;
  const slide = opened ? 11 : 5;
  const ly = cy - 16; // top-cap height of the body

  drawShadowBlob(ctx, cx, cy + 4, 46, 18);
  drawIsoPrism(ctx, cx, cy, 40, 22, 16, { top: lo, left: stone, right: PALETTE.stoneDark, outline: PALETTE.outline });
  // The open cavity (lid dragged toward the lower-left).
  drawIsoDiamond(ctx, cx, ly, 36, 20, PALETTE.void);
  drawIsoDiamond(ctx, cx + 2, ly, 28, 15, PALETTE.hostBlack);
  if (opened) {
    px(ctx, cx - 7, ly, PALETTE.hostBone, 14, 2); // long-bones
    px(ctx, cx - 4, ly - 3, PALETTE.outline, 8, 7); // skull
    px(ctx, cx - 3, ly - 3, PALETTE.hostBone, 6, 6);
    px(ctx, cx - 2, ly - 1, PALETTE.void, 2, 2);
    px(ctx, cx + 1, ly - 1, PALETTE.void, 2, 2);
  }
  // The slid lid slab, sitting proud to one side.
  drawIsoDiamond(ctx, cx + slide, ly - 4, 40, 22, PALETTE.outline);
  drawIsoDiamond(ctx, cx + slide, ly - 5, 38, 21, stone);
  drawIsoDiamond(ctx, cx + slide - 1, ly - 6, 30, 16, hi);
  // A worn Remnant sun-cross carved on the lid.
  px(ctx, cx + slide - 1, ly - 11, dust, 2, 9);
  px(ctx, cx + slide - 5, ly - 7, dust, 10, 2);
  drawNoisePixels(ctx, cx - 20, cy - 18, 42, 22, [lo, PALETTE.stoneDark], 0.04, seed);
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

export function drawBoundVictim(ctx, cx, cy, seed, opts = {}) {
  const rng = rngFrom(hash2D(seed + 129, seed * 5 + 31));
  const pulse = opts.pulse ?? 0;
  const flicker = opts.flicker ?? 0;
  const killed = Boolean(opts.killed);
  const dim = Boolean(opts.dim);
  const side = (seed & 1) ? 1 : -1;
  const lean = side * (1 + Math.floor(rng() * 2));
  const topY = cy - 58;
  const footY = cy - 4;
  const barY = topY + 7;
  const shoulderY = topY + 20 + (killed ? 2 : 0);
  const chestY = shoulderY + 5;
  const hipY = footY - 19;
  const kneeY = footY - 10;
  const headX = cx + lean + side;
  const headY = topY + 11 + (killed ? 3 : 0);

  const limb = (x0, y0, x1, y1, mid, hi = null) => {
    linePx(ctx, x0, y0, x1, y1, PALETTE.outline, 3);
    linePx(ctx, x0, y0, x1, y1, mid, 2);
    if (hi) linePx(ctx, x0, y0, x1, y1 - 1, hi, 1);
  };

  drawShadowBlob(ctx, cx, cy + 2, 28, 12);

  // A thin, cold seep of light (a grate, not a window) while it still lives.
  if (!killed) {
    ctx.save();
    for (let row = -5; row <= 5; row += 1) {
      const halfW = 14 - Math.abs(row) * 2;
      if (halfW <= 0) continue;
      ctx.globalAlpha = (dim ? 0.05 : 0.1) * (1 - Math.abs(row) / 7) + (flicker ? 0.01 : 0);
      ctx.fillStyle = PALETTE.rustMid;
      ctx.fillRect(cx - halfW, cy - 30 + row * 4, halfW * 2, 4);
    }
    ctx.restore();
  }

  // Post and wrist bar, rough enough to read as a lash-up, not a clean sign.
  px(ctx, cx - 3, topY - 1, PALETTE.outline, 7, footY - topY + 4);
  px(ctx, cx - 2, topY, PALETTE.woodDark, 5, footY - topY + 1);
  px(ctx, cx - 1, topY, PALETTE.woodMid, 2, footY - topY);
  px(ctx, cx + 2, topY + 4, PALETTE.woodLight, 1, 19);
  px(ctx, cx - 13, barY - 1, PALETTE.outline, 28, 5);
  px(ctx, cx - 12, barY, PALETTE.woodDark, 26, 3);
  px(ctx, cx - 11, barY, PALETTE.woodMid, 22, 1);
  px(ctx, cx - 7, barY + 3, PALETTE.woodLight, 4, 1);
  px(ctx, cx + 8, barY + 3, PALETTE.woodLight, 3, 1);

  const leftWrist = { x: cx - 10, y: barY + 4 };
  const rightWrist = { x: cx + 9, y: barY + 3 };
  const leftElbow = { x: cx + lean - 7, y: shoulderY - 5 };
  const rightElbow = { x: cx + lean + 8, y: shoulderY - 7 };
  const leftShoulder = { x: cx + lean - 5, y: shoulderY };
  const rightShoulder = { x: cx + lean + 6, y: shoulderY - 1 };

  // Arms are pulled high but bent at the joints, with swollen hands at the rope.
  limb(leftWrist.x, leftWrist.y, leftElbow.x, leftElbow.y, PALETTE.skinDark, PALETTE.skinMid);
  limb(leftElbow.x, leftElbow.y, leftShoulder.x, leftShoulder.y, PALETTE.skinMid, PALETTE.skinLight);
  limb(rightWrist.x, rightWrist.y, rightElbow.x, rightElbow.y, PALETTE.skinDark, PALETTE.skinMid);
  limb(rightElbow.x, rightElbow.y, rightShoulder.x, rightShoulder.y, PALETTE.skinMid, PALETTE.skinLight);
  for (const w of [leftWrist, rightWrist]) {
    px(ctx, w.x - 2, w.y - 1, PALETTE.clothTan, 6, 2);
    px(ctx, w.x - 1, w.y + 1, PALETTE.rustDark, 4, 1);
    px(ctx, w.x + (w === leftWrist ? -2 : 2), w.y + 2, PALETTE.skinDark, 2, 2);
  }

  // Bowed, gagged human head. No readable eyes or smile at this scale.
  const headRows = [
    [3, 1, PALETTE.skinDark],
    [6, 0, PALETTE.skinMid],
    [8, 0, PALETTE.skinMid],
    [8, 1, PALETTE.skinMid],
    [7, 1, PALETTE.skinDark],
    [5, 2, PALETTE.skinDark],
    [3, 2, PALETTE.skinMid]
  ];
  for (let row = 0; row < headRows.length; row += 1) {
    const [w, off, color] = headRows[row];
    const x = headX - Math.floor(w / 2) + off;
    const y = headY + row;
    px(ctx, x - 1, y, PALETTE.outline, w + 2, 1);
    px(ctx, x, y, color, w, 1);
    if (row < 4) px(ctx, x, y, PALETTE.skinLight, 1, 1);
  }
  px(ctx, headX - 4, headY + 2, PALETTE.hostBlack, 7, 1); // shadowed brow, not cartoon eyes
  px(ctx, headX - 3, headY + 5, PALETTE.clothDark, 8, 2); // gag strap
  px(ctx, headX - 2, headY + 5, PALETTE.clothTan, 5, 1);
  px(ctx, headX + side * 4, headY + 1, PALETTE.hostBone, 2, 2); // first temple bone bud
  px(ctx, headX + side * 6, headY, PALETTE.outline, 1, 2);
  if (killed) px(ctx, headX - 3, headY + 6, PALETTE.void, 6, 1);

  // Collar and throat tie pull the head back into the post.
  px(ctx, cx + lean - 5, shoulderY - 4, PALETTE.clothTan, 11, 2);
  linePx(ctx, cx + lean + side * 2, shoulderY - 3, cx + side * 6, topY + 19, PALETTE.rustDark, 1);
  px(ctx, cx + side * 6 - 1, topY + 18, PALETTE.stoneDark, 3, 2);

  // A slumped, torn body. The rows drift so the silhouette stops reading as a box.
  for (let y = shoulderY; y <= hipY; y += 1) {
    const t = (y - shoulderY) / Math.max(1, hipY - shoulderY);
    const w = Math.round(13 - t * 4);
    const drift = Math.round(lean * (1 - t) + side * Math.sin(t * Math.PI) * 2);
    const lx = cx + drift - Math.floor(w / 2);
    const tone = y < chestY + 2 ? PALETTE.skinMid : y < hipY - 3 ? PALETTE.clothDark : PALETTE.stoneDark;
    px(ctx, lx - 1, y, PALETTE.outline, w + 2, 1);
    px(ctx, lx, y, tone, w, 1);
    px(ctx, lx, y, y < chestY + 5 ? PALETTE.skinLight : PALETTE.clothTan, 1, 1);
    px(ctx, lx + w - 1, y, y < chestY + 5 ? PALETTE.skinDark : PALETTE.void, 1, 1);
    if (y === chestY + 7 || y === hipY - 3) px(ctx, lx - 1, y, PALETTE.clothTan, w + 2, 1);
  }

  // Torn-open shirt edge, early black-gold seams, and one small living wound.
  linePx(ctx, cx + lean - 2, chestY - 1, cx + lean - 4, hipY - 6, PALETTE.hostBlack, 1);
  linePx(ctx, cx + lean - 1, chestY, cx + lean - 3, hipY - 7, PALETTE.hostGold, 1);
  linePx(ctx, cx + lean + 3, chestY + 3, cx + lean + 1, hipY - 8, PALETTE.hostGold, 1);
  px(ctx, cx + lean - 1, chestY + 6, killed ? PALETTE.hostBlack : (pulse ? PALETTE.hostGlow : PALETTE.hostGold), 2, 2);
  px(ctx, cx + lean + side * 6, shoulderY + 1, PALETTE.hostBone, 2, 3);
  px(ctx, cx + lean + side * 8, shoulderY, PALETTE.outline, 1, 2);
  px(ctx, cx + lean - side * 5, chestY + 2, PALETTE.rustDark, 5, 1);
  px(ctx, cx + lean + side * 2, chestY + 9, PALETTE.hostRed, 2, 1);

  // Slack legs, still human and thin, with one knee folding inward.
  const leftHip = { x: cx + lean - 3, y: hipY };
  const rightHip = { x: cx + lean + 4, y: hipY - 1 };
  const leftKnee = { x: cx + lean - 5 - side, y: kneeY };
  const rightKnee = { x: cx + lean + 3 + side, y: kneeY - 1 };
  const leftAnkle = { x: cx - 4, y: footY - 2 };
  const rightAnkle = { x: cx + 5, y: footY - 3 };
  limb(leftHip.x, leftHip.y, leftKnee.x, leftKnee.y, PALETTE.clothDark, PALETTE.stoneMid);
  limb(leftKnee.x, leftKnee.y, leftAnkle.x, leftAnkle.y, PALETTE.clothDark);
  limb(rightHip.x, rightHip.y, rightKnee.x, rightKnee.y, PALETTE.clothDark, PALETTE.stoneMid);
  limb(rightKnee.x, rightKnee.y, rightAnkle.x, rightAnkle.y, PALETTE.clothDark);
  px(ctx, leftAnkle.x - 2, leftAnkle.y, PALETTE.stoneDark, 5, 2);
  px(ctx, rightAnkle.x - 2, rightAnkle.y, PALETTE.stoneDark, 6, 2);
  px(ctx, cx - 5, footY - 4, PALETTE.clothTan, 12, 1);
  px(ctx, cx - 3, footY - 3, PALETTE.rustDark, 8, 1);

  // Old blood and Host seep at the base from being held here, not carved open.
  drawIsoDiamond(ctx, cx + 1, cy + 1, 18, 8, PALETTE.rustDark);
  drawNoisePixels(ctx, cx - 10, cy - 4, 22, 9, [PALETTE.hostRed, PALETTE.rustDark, PALETTE.hostBlack], 0.06, seed);
  px(ctx, cx + lean - 1, footY, PALETTE.hostGold, 2, 1);
}

export function drawCalcifiedPenitent(ctx, cx, cy, seed) {
  const rng = rngFrom(hash2D(seed + 91, seed * 7 + 13));
  const tilt = Math.round((rng() - 0.5) * 5); // the head and torso loll to one side
  const side = (seed & 1) ? 1 : -1;
  const bone = PALETTE.hostBone;   // calcified pale flesh
  const boneLo = PALETTE.stoneDust;
  const boneDk = PALETTE.stoneDark;
  const grey = PALETTE.stoneLight;
  const vein = PALETTE.stoneDark;  // black-gold gone dead and grey
  const cut = PALETTE.rustDark;    // old dried wounds
  const cutWet = PALETTE.hostRed;
  const iron = PALETTE.stoneDark;
  const ironHi = PALETTE.stoneLight;

  const footY = cy - 2;
  const hipY = cy - 18;
  const chestY = cy - 34;
  const shoulderY = cy - 43;
  const headY = cy - 54;
  const ringY = cy - 60;   // iron rings in the wall

  const seg = (x0, y0, x1, y1, color, thick = 1) => {
    const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
    for (let i = 0; i <= steps; i += 1) {
      const t = i / steps;
      px(ctx, Math.round(x0 + (x1 - x0) * t - Math.floor(thick / 2)), Math.round(y0 + (y1 - y0) * t), color, thick, 1);
    }
  };

  drawShadowBlob(ctx, cx, cy + 2, 26, 11);

  // Uneven wall rings and chains. They hold the body up, but not cleanly.
  for (const s of [-1, 1]) {
    const rx = cx + s * (11 + ((seed >> (s > 0 ? 2 : 4)) & 1));
    const ry = ringY + (s === side ? -2 : 2);
    for (const [dx, dy] of [[-2, 0], [-1, -2], [1, -2], [2, 0], [1, 2], [-1, 2]]) {
      px(ctx, rx + dx, ry + dy, iron);
    }
    const ax = cx + tilt + s * (4 + (s === side ? 2 : 0));
    const ay = shoulderY + (s === side ? -2 : 3);
    for (let i = 0; i <= 6; i += 1) {
      const t = i / 5;
      const x = Math.round(rx + (ax - rx) * t);
      const y = Math.round(ry + 2 + (ay - ry - 2) * t);
      px(ctx, x, y, i % 2 ? ironHi : iron, 2, 1 + (i & 1));
    }
    px(ctx, ax - 1, ay - 1, iron, 4, 2); // manacle buried in calcified flesh
    seg(ax, ay, cx + tilt + s * 6, chestY - 2, boneLo, 2);
    seg(ax + s, ay, cx + tilt + s * 5, chestY - 2, bone, 1);
  }

  // Broken halo behind the bowed skull, snapped open on one side.
  const haloCx = cx + tilt + side * 2;
  for (let n = 0; n < 15; n += 1) {
    if ((side > 0 && n > 8 && n < 12) || (side < 0 && n > 3 && n < 7)) continue;
    const a = Math.PI * (0.15 + n * 0.055);
    const hx = haloCx + Math.round(Math.cos(a) * (10 + (n % 2)));
    const hy = headY + 6 - Math.round(Math.sin(a) * 8);
    px(ctx, hx, hy, n % 3 === 0 ? bone : boneLo, n % 4 === 0 ? 2 : 1, 1);
  }

  // Long bowed skull, not a clean square face. The lower jaw hangs crooked and
  // the sockets read as holes, not eyes or a smile.
  const skullX = cx + tilt + side * 2;
  const skullY = headY + 3;
  const skullRows = [
    [3, 0], [6, -1], [8, -1], [7, 0], [6, 1], [5, 1], [4, 2], [3, 3], [2, 4]
  ];
  for (let row = 0; row < skullRows.length; row += 1) {
    const [w, off] = skullRows[row];
    const x = skullX - Math.floor(w / 2) + off;
    const y = skullY + row;
    px(ctx, x - 1, y, PALETTE.outline, w + 2, 1);
    px(ctx, x, y, row < 3 ? bone : boneLo, w, 1);
    px(ctx, x, y, grey, 1, 1);
  }
  px(ctx, skullX - 3, skullY + 4, PALETTE.void, 2, 3);
  px(ctx, skullX + 2, skullY + 3, PALETTE.void, 2, 3);
  px(ctx, skullX + side, skullY + 7, PALETTE.void, 3, 3); // broken open jaw
  px(ctx, skullX + side * 2, skullY + 9, boneLo, 3, 1);
  px(ctx, skullX - side * 5, skullY + 1, bone, 2, 2); // snapped horn/halo stub
  px(ctx, skullX - side * 7, skullY, PALETTE.outline, 2, 1);

  // Iron collar and throat chain, cutting the neck line instead of forming a face.
  px(ctx, cx - 5 + tilt, shoulderY - 1, iron, 11, 2);
  px(ctx, cx - 5 + tilt, shoulderY - 1, ironHi, 7, 1);
  seg(cx + tilt, shoulderY, cx + tilt - side * 8, ringY + 1, iron, 1);

  // One continuous but twisted hanging body from shoulders to hips. The offset
  // rows and dark side edge break the old tidy gray-man silhouette.
  for (let y = shoulderY; y <= hipY; y += 1) {
    const t = (y - shoulderY) / Math.max(1, hipY - shoulderY);
    const w = Math.round(12 - t * 4);
    const drift = Math.round(tilt * (1 - t) + side * Math.sin(t * Math.PI) * 3);
    const lx = cx - Math.floor(w / 2) + drift;
    px(ctx, lx, y, boneLo, w, 1);
    px(ctx, lx, y, bone, 1, 1);
    px(ctx, lx + w - 1, y, vein, 1, 1);
    if (y % 5 === 0) px(ctx, lx + 2, y, boneDk, Math.max(2, w - 5), 1);
  }

  // Ribcage cracked open and frozen shut around a dead cavity. No glow.
  const cavX = cx + tilt - 3 + side;
  const cavY = chestY - 1;
  px(ctx, cavX, cavY, PALETTE.void, 8, 12);
  px(ctx, cavX + 1, cavY + 2, vein, 5, 7);
  for (const s of [-1, 1]) {
    const baseX = s < 0 ? cavX : cavX + 7;
    for (let r = 0; r < 4; r += 1) {
      const y = cavY + 1 + r * 3;
      const len = 5 - (r === 3 ? 1 : 0);
      seg(baseX, y, baseX + s * len, y + (r - 1), bone, 1);
    }
  }
  px(ctx, cavX + 3, cavY - 1, boneDk, 1, 13); // split sternum, drained dark

  // Fused prayer-hands caught at the wound, with one side cracked away.
  const handY = cavY + 8;
  px(ctx, cx + tilt - 2, handY, bone, 5, 6);
  px(ctx, cx + tilt, handY + 1, PALETTE.void, 1, 5);
  px(ctx, cx + tilt + side * 3, handY + 2, boneDk, 2, 3);

  // Dried cuts and snapped thorns, uneven so the row never reads as dolls.
  const cuts = 2 + (rng() < 0.5 ? 1 : 0);
  for (let i = 0; i < cuts; i += 1) {
    const gy = chestY - 3 + Math.floor(rng() * Math.max(1, hipY - chestY + 8));
    const gx = cx - 6 + tilt + Math.floor(rng() * 8);
    px(ctx, gx, gy, i % 2 ? cutWet : cut, 6 + Math.floor(rng() * 5), 1);
  }
  for (let i = 0; i < 3; i += 1) {
    const bx = cx - 6 + tilt + i * 5;
    const hh = 2 + ((seed + i) & 2);
    seg(bx, shoulderY + 2, bx + (i === 1 ? -side : side) * 2, shoulderY - hh, bone, 1);
  }

  // Legs are folded and partly fused into a hanging calcified skirt, with one
  // ankle dragged sideways by iron.
  const kneeY = hipY + 8;
  seg(cx + tilt - 3, hipY, cx - 8 + side, kneeY, boneLo, 4);
  seg(cx + tilt + 3, hipY + 1, cx + 7 + side * 2, kneeY + 2, boneLo, 3);
  seg(cx - 8 + side, kneeY, cx - 4, footY - 2, boneDk, 2);
  seg(cx + 7 + side * 2, kneeY + 2, cx + 5, footY - 1, boneDk, 2);
  px(ctx, cx - 8, footY - 2, iron, 5, 2);
  px(ctx, cx + 3, footY - 1, iron, 6, 2);
  seg(cx - 6, footY - 2, cx - 13, footY - 5, iron, 1);

  // Blood pooled and gone dark beneath.
  drawNoisePixels(ctx, cx - 10, cy - 3, 20, 8, [cut, PALETTE.stoneDark], 0.07, seed);
}

export function drawCultVictim(ctx, cx, cy, seed) {
  const blood = PALETTE.hostRed;
  const dark = PALETTE.rustDark;
  const rng = rngFrom(hash2D(seed + 17, seed * 3 + 5));

  drawShadowBlob(ctx, cx, cy + 4, 52, 21);

  // A wide, half-dried pool with a drag smear and thrown spatter around it.
  ctx.save();
  ctx.globalAlpha = 0.85;
  drawIsoDiamond(ctx, cx + 2, cy + 4, 46, 21, dark);
  ctx.globalAlpha = 0.62;
  drawIsoDiamond(ctx, cx + 4, cy + 4, 30, 14, blood);
  ctx.restore();
  for (let i = 0; i < 11; i += 1) px(ctx, cx - 22 - i, cy + 4 + ((i * 7) % 5) - 2, i % 2 ? dark : blood, 2, 1); // drag smear
  drawNoisePixels(ctx, cx - 26, cy - 6, 56, 26, [blood, dark], 0.11, seed);
  for (let i = 0; i < 16; i += 1) {
    const a = rng() * Math.PI * 2;
    const r = 13 + rng() * 17;
    px(ctx, cx + Math.round(Math.cos(a) * r), cy + Math.round(Math.sin(a) * r * 0.5), blood);
  }

  // Body on its back: dark traveller's coat, slack limbs.
  for (let row = 0; row < 9; row += 1) {
    const w = 28 - Math.abs(row - 4) * 3;
    const tone = row < 2 ? PALETTE.stoneMid : row < 7 ? PALETTE.clothDark : PALETTE.stoneDark;
    px(ctx, cx - Math.floor(w / 2) - 3, cy - 6 + row, tone, w, 1);
  }
  px(ctx, cx - 18, cy - 6, PALETTE.outline, 2, 9);
  px(ctx, cx - 20, cy - 1, PALETTE.stoneDark, 8, 4); // boots
  px(ctx, cx - 9, cy + 4, PALETTE.clothDark, 9, 2);  // outflung arm
  px(ctx, cx - 1, cy + 5, PALETTE.skinMid, 3, 2);    // pale hand

  // Slack, pale head at the right end, jaw fallen open.
  px(ctx, cx + 10, cy - 5, PALETTE.outline, 8, 8);
  px(ctx, cx + 11, cy - 4, PALETTE.skinMid, 6, 6);
  px(ctx, cx + 11, cy - 4, PALETTE.skinDark, 6, 1);
  px(ctx, cx + 11, cy - 5, PALETTE.clothDark, 6, 1); // hair
  px(ctx, cx + 13, cy - 1, PALETTE.void, 2, 2);      // open mouth

  // Silver cross at the throat: a chain and an upright cross, a cold glint.
  const nx = cx + 8;
  const ny = cy + 1;
  px(ctx, nx - 3, ny - 2, PALETTE.stoneDust, 7, 1);
  px(ctx, nx, ny - 1, PALETTE.hostBone, 1, 5);
  px(ctx, nx - 1, ny + 1, PALETTE.hostBone, 3, 1); // crossbar high => upright
  px(ctx, nx, ny - 1, PALETTE.flash, 1, 1);

  // Chest cut bare and carved with a point-down (inverted) five-line star.
  const pcx = cx + 1;
  const pcy = cy - 1;
  const R = 6;
  px(ctx, pcx - 6, pcy - 5, PALETTE.skinMid, 13, 10);
  px(ctx, pcx - 6, pcy - 5, PALETTE.skinDark, 13, 1);
  const pts = [];
  for (let k = 0; k < 5; k += 1) {
    const a = Math.PI / 2 + (Math.PI * 2 * k) / 5; // a vertex points down
    pts.push([pcx + Math.cos(a) * R, pcy + Math.sin(a) * R * 0.8]);
  }
  const order = [0, 2, 4, 1, 3, 0];
  ctx.strokeStyle = blood;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(pts[order[0]][0], pts[order[0]][1]);
  for (let i = 1; i < order.length; i += 1) ctx.lineTo(pts[order[i]][0], pts[order[i]][1]);
  ctx.stroke();
  // carved scratch-lines beneath the star (the words, read on inspection)
  for (let i = 0; i < 2; i += 1) px(ctx, pcx - 5, pcy + 6 + i, blood, 11 - i * 2, 1);
  // stab punctures across the belly
  for (let i = 0; i < 4; i += 1) {
    const sxp = cx - 8 + i * 4;
    px(ctx, sxp, cy + 1 + (i % 2), PALETTE.void, 2, 1);
    px(ctx, sxp, cy + 1 + (i % 2), blood, 1, 1);
  }
}

export function drawCalcifiedGraveMarker(ctx, cx, cy, seed) {
  const rng = rngFrom(hash2D(seed + 191, seed * 3 + 23));
  const lean = Math.floor((rng() - 0.5) * 5);
  const bone = PALETTE.hostBone;
  const lo = PALETTE.stoneDark;
  const dust = PALETTE.stoneDust;

  drawShadowBlob(ctx, cx, cy + 3, 24, 10);
  px(ctx, cx - 8 + lean, cy - 42, PALETTE.outline, 17, 43);
  px(ctx, cx - 7 + lean, cy - 41, bone, 14, 41);
  px(ctx, cx - 7 + lean, cy - 41, dust, 4, 36);
  px(ctx, cx + 5 + lean, cy - 37, lo, 2, 34);
  px(ctx, cx - 10 + lean, cy - 21, PALETTE.outline, 21, 4);
  px(ctx, cx - 9 + lean, cy - 20, dust, 19, 2);
  px(ctx, cx - 3 + lean, cy - 39, PALETTE.void, 7, 3);
  px(ctx, cx - 2 + lean, cy - 36, lo, 5, 15);
  px(ctx, cx - 4 + lean, cy - 10, lo, 9, 2);
  for (let i = 0; i < 5; i += 1) {
    const x = cx - 6 + lean + Math.floor(rng() * 13);
    const y = cy - 35 + Math.floor(rng() * 29);
    px(ctx, x, y, rng() < 0.5 ? lo : dust, 1, 1);
  }
  drawNoisePixels(ctx, cx - 13, cy - 5, 26, 10, [PALETTE.stoneDark, PALETTE.rustDark], 0.08, seed);
}

export function drawDeadCultist(ctx, cx, cy, seed) {
  const rng = rngFrom(hash2D(seed + 151, seed * 5 + 9));
  const flip = (seed & 1) ? 1 : -1;
  drawShadowBlob(ctx, cx, cy + 4, 46, 18);
  ctx.save();
  ctx.globalAlpha = 0.78;
  drawIsoDiamond(ctx, cx + flip * 3, cy + 3, 36, 16, PALETTE.rustDark);
  ctx.restore();
  drawNoisePixels(ctx, cx - 23, cy - 6, 47, 23, [PALETTE.hostRed, PALETTE.rustDark], 0.09, seed);

  // Robed human body, crumpled and smaller than the wolf corpses nearby.
  for (let row = 0; row < 10; row += 1) {
    const w = 25 - Math.abs(row - 5) * 2;
    const x = cx - Math.floor(w / 2) + flip * Math.floor(row * 0.4);
    const y = cy - 8 + row;
    px(ctx, x - 1, y, PALETTE.outline, w + 2, 1);
    px(ctx, x, y, row < 3 ? PALETTE.clothRed : PALETTE.clothDark, w, 1);
    if (row < 7) px(ctx, x, y, PALETTE.rustMid, 1, 1);
  }
  px(ctx, cx + flip * 13 - 3, cy - 8, PALETTE.outline, 8, 8);
  px(ctx, cx + flip * 13 - 2, cy - 7, PALETTE.skinDark, 6, 6);
  px(ctx, cx + flip * 13 - 2, cy - 8, PALETTE.clothDark, 6, 2);
  px(ctx, cx - flip * 17, cy - 2, PALETTE.stoneDark, 8, 3);
  px(ctx, cx - 2, cy + 4, PALETTE.hostBone, 2, 5);
  px(ctx, cx - 5, cy + 6, PALETTE.hostBone, 8, 1);
  for (let i = 0; i < 5; i += 1) {
    px(ctx, cx - 14 + Math.floor(rng() * 29), cy - 4 + Math.floor(rng() * 10), PALETTE.hostRed, 1, 1);
  }
}

function wolfBody(ctx, cx, cy, seed, opts = {}) {
  const rng = rngFrom(hash2D(seed + 43, seed * 11 + 5));
  const flip = opts.flip ?? ((seed & 1) ? 1 : -1);
  drawShadowBlob(ctx, cx, cy + 4, 54, 19);
  ctx.save();
  ctx.globalAlpha = 0.78;
  drawIsoDiamond(ctx, cx + 2, cy + 4, 42, 18, PALETTE.rustDark);
  ctx.restore();

  // Fallen wolf torso, long and low, with Host-black hide and bone-lit ribs.
  for (let row = 0; row < 12; row += 1) {
    const w = 35 - Math.abs(row - 5) * 3;
    const x = cx - Math.floor(w / 2) - flip * 3;
    const y = cy - 11 + row;
    px(ctx, x - 1, y, PALETTE.outline, w + 2, 1);
    px(ctx, x, y, row < 4 ? PALETTE.stoneDark : PALETTE.hostBlack, w, 1);
    if (row < 5) px(ctx, x, y, PALETTE.stoneMid, 2, 1);
    if (row > 5) px(ctx, x + w - 2, y, PALETTE.void, 2, 1);
  }
  // Legs and torn tail.
  for (const leg of [-13, -4, 8, 16]) {
    linePx(ctx, cx + leg, cy - 2, cx + leg + flip * (4 + Math.floor(rng() * 5)), cy + 9, PALETTE.outline, 4);
    linePx(ctx, cx + leg, cy - 2, cx + leg + flip * (4 + Math.floor(rng() * 5)), cy + 9, PALETTE.stoneDark, 2);
    px(ctx, cx + leg + flip * 5, cy + 8, PALETTE.hostBone, 4, 1);
  }
  linePx(ctx, cx - flip * 21, cy - 7, cx - flip * 35, cy - 13, PALETTE.outline, 4);
  linePx(ctx, cx - flip * 21, cy - 7, cx - flip * 34, cy - 13, PALETTE.hostBlack, 2);
  px(ctx, cx - flip * 36, cy - 15, PALETTE.hostBone, 2, 2);

  return { flip, rng };
}

export function drawDeadHostWolfSpider(ctx, cx, cy, seed) {
  const { flip, rng } = wolfBody(ctx, cx, cy, seed, {});
  const shoulderX = cx + flip * 16;
  const shoulderY = cy - 12;

  // Wolf skull, split by a small broken halo.
  px(ctx, shoulderX - 5, shoulderY - 5, PALETTE.outline, 14, 10);
  px(ctx, shoulderX - 4, shoulderY - 4, PALETTE.hostBone, 11, 8);
  px(ctx, shoulderX + flip * 4, shoulderY - 1, PALETTE.void, 5, 2);
  px(ctx, shoulderX + flip * 7, shoulderY + 2, PALETTE.hostBlack, 6, 2);
  px(ctx, shoulderX - flip * 7, shoulderY - 8, PALETTE.hostBone, 4, 2);
  for (let h = 0; h < 5; h += 1) px(ctx, shoulderX - 9 + h * 4, shoulderY - 10 - (h % 2), h === 3 ? PALETTE.hostGold : PALETTE.hostBone, 2, 1);

  // Spidering Host limbs erupted from the shoulders, dead and folded under.
  for (let i = 0; i < 6; i += 1) {
    const side = i < 3 ? -1 : 1;
    const baseX = cx - 4 + side * (5 + (i % 3) * 5);
    const baseY = cy - 11 + (i % 3);
    const kneeX = baseX + side * (13 + Math.floor(rng() * 6));
    const kneeY = baseY - 8 - Math.floor(rng() * 7);
    const tipX = kneeX + side * (10 + Math.floor(rng() * 6));
    const tipY = kneeY + 13 + Math.floor(rng() * 6);
    linePx(ctx, baseX, baseY, kneeX, kneeY, PALETTE.outline, 3);
    linePx(ctx, kneeX, kneeY, tipX, tipY, PALETTE.outline, 3);
    linePx(ctx, baseX, baseY, kneeX, kneeY, PALETTE.hostBone, 1);
    linePx(ctx, kneeX, kneeY, tipX, tipY, PALETTE.stoneDust, 1);
    px(ctx, tipX, tipY, PALETTE.void, 2, 2);
  }
  px(ctx, cx - 2, cy - 9, PALETTE.hostGold, 1, 8);
  drawNoisePixels(ctx, cx - 26, cy - 11, 56, 23, [PALETTE.hostRed, PALETTE.rustDark], 0.08, seed);
}

export function drawDeadHostWolfMaw(ctx, cx, cy, seed) {
  const { flip } = wolfBody(ctx, cx, cy, seed, {});
  const hx = cx + flip * 18;
  const hy = cy - 12;

  // Head opened into a hellish mouth. It is dead, so the throat is black, not lit.
  px(ctx, hx - 7, hy - 7, PALETTE.outline, 17, 13);
  px(ctx, hx - 5, hy - 6, PALETTE.stoneDark, 13, 5);
  px(ctx, hx - 6, hy - 1, PALETTE.hostBlack, 16, 7);
  px(ctx, hx - 4, hy, PALETTE.void, 13, 5);
  for (let t = 0; t < 7; t += 1) {
    const tx = hx - 5 + t * 2;
    px(ctx, tx, hy - 1, PALETTE.hostBone, 1, 3);
    if (t < 6) px(ctx, tx + 1, hy + 4, PALETTE.hostBone, 1, 2);
  }
  px(ctx, hx + flip * 8, hy - 4, PALETTE.hostBone, 5, 2);
  px(ctx, hx + flip * 12, hy - 2, PALETTE.outline, 4, 2);
  px(ctx, hx - flip * 9, hy - 10, PALETTE.hostBone, 2, 8);
  px(ctx, hx - flip * 11, hy - 11, PALETTE.outline, 2, 5);

  // Prayer-fused forelegs caught against the opened throat.
  linePx(ctx, cx + flip * 2, cy - 7, hx - flip * 2, hy + 5, PALETTE.outline, 4);
  linePx(ctx, cx + flip * 2, cy - 7, hx - flip * 2, hy + 5, PALETTE.stoneDark, 2);
  linePx(ctx, cx + flip * 5, cy - 3, hx - flip * 1, hy + 7, PALETTE.outline, 4);
  linePx(ctx, cx + flip * 5, cy - 3, hx - flip * 1, hy + 7, PALETTE.hostBone, 1);
  px(ctx, hx - flip * 3, hy + 7, PALETTE.hostGold, 1, 2);
  drawNoisePixels(ctx, cx - 24, cy - 9, 52, 23, [PALETTE.hostRed, PALETTE.rustDark, PALETTE.hostBlack], 0.09, seed);
}

export function drawDeadHostWolfRibsplit(ctx, cx, cy, seed) {
  const { flip } = wolfBody(ctx, cx, cy, seed, {});
  const chestX = cx + 2;
  const chestY = cy - 10;

  // Butterflied ribcage in the torso, readable as a Host sacrament gone animal.
  px(ctx, chestX - 7, chestY - 1, PALETTE.void, 15, 9);
  px(ctx, chestX - 5, chestY, PALETTE.hostBlack, 11, 7);
  for (let r = 0; r < 5; r += 1) {
    linePx(ctx, chestX - 2, chestY + r * 2, chestX - 15 - r, chestY - 5 + r, PALETTE.outline, 2);
    linePx(ctx, chestX + 2, chestY + r * 2, chestX + 14 + r, chestY - 4 + r, PALETTE.outline, 2);
    linePx(ctx, chestX - 2, chestY + r * 2, chestX - 14 - r, chestY - 5 + r, PALETTE.hostBone, 1);
    linePx(ctx, chestX + 2, chestY + r * 2, chestX + 13 + r, chestY - 4 + r, PALETTE.stoneDust, 1);
  }
  px(ctx, chestX, chestY - 2, PALETTE.hostGold, 1, 12);
  px(ctx, chestX + 2, chestY + 3, PALETTE.rustDark, 2, 3);

  // A cracked goat-like wolf skull, one horn intact and one snapped.
  const hx = cx + flip * 19;
  const hy = cy - 13;
  px(ctx, hx - 5, hy - 5, PALETTE.outline, 13, 10);
  px(ctx, hx - 4, hy - 4, PALETTE.hostBone, 10, 8);
  px(ctx, hx + flip * 2, hy - 1, PALETTE.void, 3, 2);
  px(ctx, hx + flip * 5, hy + 3, PALETTE.hostBlack, 6, 1);
  linePx(ctx, hx - flip * 4, hy - 6, hx - flip * 11, hy - 13, PALETTE.outline, 3);
  linePx(ctx, hx - flip * 4, hy - 6, hx - flip * 10, hy - 12, PALETTE.hostBone, 1);
  px(ctx, hx + flip * 6, hy - 8, PALETTE.hostBone, 3, 2);
  px(ctx, hx + flip * 8, hy - 8, PALETTE.outline, 2, 1);
  drawNoisePixels(ctx, cx - 27, cy - 11, 56, 24, [PALETTE.hostRed, PALETTE.rustDark], 0.07, seed);
}
