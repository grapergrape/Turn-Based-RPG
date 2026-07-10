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

  drawShadowBlob(ctx, cx, cy + 4, 34, 13);
  drawIsoDiamond(ctx, cx, cy + 1, 32, 12, PALETTE.outline);
  drawIsoDiamond(ctx, cx, cy, 25, 9, PALETTE.stoneDark);
  drawIsoDiamond(ctx, cx - 1, cy - 1, 18, 7, PALETTE.stoneDust);
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
  px(ctx, cx - 10 + lean, cy - 45, PALETTE.outline, 21, 4);
  px(ctx, cx - 8 + lean, cy - 46, bone, 15, 2);
  px(ctx, cx + 6 + lean, cy - 44, lo, 4, 2);

  // Bone niche in the marker face: a dark recess with one tiny sorted skull.
  px(ctx, cx - 5 + lean, cy - 38, PALETTE.outline, 11, 14);
  px(ctx, cx - 4 + lean, cy - 37, PALETTE.void, 9, 11);
  px(ctx, cx - 3 + lean, cy - 35, bone, 7, 5);
  px(ctx, cx - 2 + lean, cy - 33, PALETTE.void, 2, 2);
  px(ctx, cx + 2 + lean, cy - 33, PALETTE.void, 2, 2);
  px(ctx, cx - 3 + lean, cy - 28, dust, 7, 1);
  px(ctx, cx - 6 + lean, cy - 26, PALETTE.outline, 13, 3);
  px(ctx, cx - 5 + lean, cy - 27, bone, 9, 1);

  px(ctx, cx - 5 + lean, cy - 11, lo, 11, 2);
  linePx(ctx, cx - 6 + lean, cy - 18, cx + 6 + lean, cy - 8, PALETTE.outline, 1);
  linePx(ctx, cx - 5 + lean, cy - 19, cx + 5 + lean, cy - 9, dust, 1);
  linePx(ctx, cx + 5 + lean, cy - 39, cx - 4 + lean, cy - 14, PALETTE.outline, 1);
  linePx(ctx, cx + 4 + lean, cy - 39, cx - 5 + lean, cy - 15, lo, 1);
  for (let i = 0; i < 7; i += 1) {
    const x = cx - 7 + lean + Math.floor(rng() * 15);
    const y = cy - 36 + Math.floor(rng() * 31);
    px(ctx, x, y, rng() < 0.48 ? lo : dust, 1 + (i % 3 === 0 ? 1 : 0), 1);
  }
  for (let i = 0; i < 6; i += 1) {
    const bx = cx - 10 + i * 9 + Math.floor(rng() * 3);
    px(ctx, bx, cy - 3 + (i & 1), rng() < 0.5 ? bone : lo, 3, 1);
  }
  px(ctx, cx - 14 + lean, cy - 6, PALETTE.outline, 5, 3);
  px(ctx, cx - 13 + lean, cy - 7, bone, 3, 1);
  px(ctx, cx + 11 + lean, cy - 5, PALETTE.outline, 5, 3);
  px(ctx, cx + 12 + lean, cy - 6, lo, 3, 1);
  drawNoisePixels(ctx, cx - 15, cy - 6, 30, 12, [PALETTE.stoneDark, PALETTE.rustDark], 0.09, seed);
  // A tally scratched at the base: how many lie under this one marker. The
  // graveyard ran out of stones long before it ran out of dead.
  for (let t = 0; t < 5; t += 1) {
    px(ctx, cx - 6 + t * 2, cy - 6, PALETTE.stoneDust, 1, 3 + (t === 4 ? 1 : 0));
  }
  linePx(ctx, cx - 7, cy - 4, cx + 3, cy - 5, PALETTE.stoneDust, 1);

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

function graveSeg(ctx, x0, y0, x1, y1, color, thick = 1) {
  const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    px(
      ctx,
      Math.round(x0 + (x1 - x0) * t - thick / 2),
      Math.round(y0 + (y1 - y0) * t - thick / 2),
      color,
      thick,
      thick
    );
  }
}

// The grave swell the dead stand in. They were planted upright, not laid down,
// so the mound climbs their shins and the roots have crawled back over it.
function graveMound(ctx, cx, cy, seed, wide = false) {
  const rng = rngFrom(hash2D(seed + 311, seed * 7 + 83));
  const w = wide ? 46 : 36;
  const domeRows = wide ? 6 : 5;
  drawIsoDiamond(ctx, cx, cy + 1, w + 3, Math.round(w * 0.4) + 1, PALETTE.outline);
  drawIsoDiamond(ctx, cx, cy, w, Math.round(w * 0.37), PALETTE.stoneDark);
  for (let row = 0; row < domeRows; row += 1) {
    const rw = Math.round(w * 0.66) - row * (wide ? 5 : 4);
    if (rw < 7) break;
    const y = cy - 1 - row;
    px(ctx, cx - Math.floor(rw / 2) - 1, y, PALETTE.outline, rw + 2, 1);
    px(ctx, cx - Math.floor(rw / 2), y, row >= domeRows - 2 ? PALETTE.stoneMid : PALETTE.stoneDark, rw, 1);
    if (row >= domeRows - 2) px(ctx, cx - Math.floor(rw / 2), y, PALETTE.stoneDust, 2 + (row & 1), 1);
  }
  graveSeg(ctx, cx - Math.floor(w * 0.4), cy + 1, cx - 4, cy - 2, PALETTE.woodDark, 1);
  graveSeg(ctx, cx + 5, cy - 2, cx + Math.floor(w * 0.38), cy + 2, PALETTE.woodDark, 1);
  if (rng() < 0.6) graveSeg(ctx, cx + 2, cy - 3, cx + 9, cy - 5, PALETTE.rustDark, 1);
  drawNoisePixels(ctx, cx - Math.floor(w / 2), cy - 4, w, 8, [PALETTE.stoneDark, PALETTE.rustDark], 0.07, seed + 3);
  return cy - domeRows;
}

// Calcified human head caught mid-scream: hollow uneven eye pits, a rust
// tear-stain from one socket, the mouth a frozen open void, the jaw slack and
// off line. `y` is the top of the skull.
function graveAgonyHead(ctx, x, y, seed, opts = {}) {
  const tilt = opts.tilt ?? 0;
  const jawDrop = opts.jawDrop ?? 3;
  const bell = Boolean(opts.bell);
  const split = Boolean(opts.split);
  const bone = PALETTE.hostBone;
  const rows = [6, 8, 8, 8, 7, 6];
  for (let i = 0; i < rows.length; i += 1) {
    const w = rows[i];
    const lx = x - Math.floor(w / 2) + Math.round(tilt * (1 - i / rows.length));
    px(ctx, lx - 1, y + i, PALETTE.outline, w + 2, 1);
    px(ctx, lx, y + i, bone, w, 1);
    if (i === 0) px(ctx, lx, y + i, PALETTE.stoneLight, 3, 1);
    px(ctx, lx + w - 2, y + i, PALETTE.stoneDust, 2, 1);
    px(ctx, lx + w - 1, y + i, PALETTE.stoneDark, 1, 1);
  }
  // Deep uneven sockets under a hard brow, one wider than the other.
  const ex = x + Math.round(tilt * 0.5);
  px(ctx, ex - 3, y + 1, PALETTE.stoneDark, 3, 1);
  px(ctx, ex + 1, y + 1, PALETTE.stoneDark, 3, 1);
  px(ctx, ex - 3, y + 2, PALETTE.void, 2, 2);
  px(ctx, ex + 1, y + 2, PALETTE.void, 3, 2);
  // A rust stain has wept from one socket down the chalk.
  px(ctx, ex + 2, y + 4, PALETTE.rustDark, 1, 3 + (seed % 2));
  if (bell) {
    // The jaw pulled down and out into a bell. Wind passes through; nothing rings.
    for (let r = 0; r < jawDrop; r += 1) {
      const w = 4 + r;
      px(ctx, x - Math.floor(w / 2) - 1, y + 6 + r, PALETTE.outline, w + 2, 1);
      px(ctx, x - Math.floor(w / 2), y + 6 + r, PALETTE.void, w, 1);
      px(ctx, x - Math.floor(w / 2), y + 6 + r, PALETTE.hostBone, 1, 1);
      px(ctx, x + Math.ceil(w / 2) - 1, y + 6 + r, PALETTE.stoneDark, 1, 1);
    }
    const rimW = 4 + jawDrop - 1;
    for (let t = 0; t <= rimW; t += 2) px(ctx, x - Math.floor(rimW / 2) + t, y + 5 + jawDrop, bone, 1, 2);
    px(ctx, x - Math.floor(rimW / 2) - 1, y + 7 + jawDrop, PALETTE.stoneDark, rimW + 2, 1);
  } else {
    // The scream: a black open mouth stretched too far down.
    px(ctx, x - 2, y + 5, PALETTE.void, 5, jawDrop + 1);
    px(ctx, x - 3, y + 5, PALETTE.stoneDark, 1, jawDrop);
    px(ctx, x + 3, y + 6, PALETTE.stoneDark, 1, jawDrop - 1);
    const cj = x - 1 + (seed % 3 === 0 ? -2 : 1);
    px(ctx, cj - 2, y + 6 + jawDrop, PALETTE.outline, 6, 2);
    px(ctx, cj - 1, y + 6 + jawDrop, PALETTE.stoneDust, 4, 1);
  }
  if (split) {
    const sx = x + ((seed & 1) ? 0 : -1);
    px(ctx, sx, y - 1, PALETTE.void, 2, 8 + jawDrop);
    for (let r = 0; r < 7; r += 1) {
      if ((r + seed) % 2 === 0) px(ctx, sx + 2, y + r, PALETTE.stoneDark, 2 + (r % 2), 1);
    }
  }
}

// Fully opened head, gone all the way to the goat skull before the Stilling
// caught it: long dropping muzzle, hanging jaw, one curled horn, one stump.
function graveGoatSkull(ctx, x, y, side) {
  const bone = PALETTE.hostBone;
  const cran = [6, 8, 8, 7];
  for (let i = 0; i < cran.length; i += 1) {
    const w = cran[i];
    const lx = x - Math.floor(w / 2);
    px(ctx, lx - 1, y + i, PALETTE.outline, w + 2, 1);
    px(ctx, lx, y + i, bone, w, 1);
    if (i === 0) px(ctx, lx, y, PALETTE.stoneLight, 2, 1);
    px(ctx, lx + w - 1, y + i, PALETTE.stoneDark, 1, 1);
  }
  px(ctx, x - 3, y + 2, PALETTE.void, 2, 2);
  px(ctx, x + 2, y + 1, PALETTE.void, 2, 3);
  const muzzle = [[5, 1], [4, 1], [4, 2], [3, 2], [3, 3]];
  for (let i = 0; i < muzzle.length; i += 1) {
    const [w, off] = muzzle[i];
    const lx = x - Math.floor(w / 2) + side * off;
    px(ctx, lx - 1, y + 4 + i, PALETTE.outline, w + 2, 1);
    px(ctx, lx, y + 4 + i, i < 3 ? bone : PALETTE.stoneDust, w, 1);
  }
  px(ctx, x + side * 3, y + 8, PALETTE.void, 2, 1);
  px(ctx, x + side, y + 5, PALETTE.stoneDark, 1, 3);
  px(ctx, x + side * 2 - 2, y + 10, PALETTE.void, 5, 3);
  for (let t = 0; t < 3; t += 1) px(ctx, x + side * 2 - 2 + t * 2, y + 10, bone, 1, 1);
  px(ctx, x + side * 2 - 3, y + 13, PALETTE.outline, 6, 2);
  px(ctx, x + side * 2 - 2, y + 13, PALETTE.stoneDust, 4, 1);
  // Ram horn hugging the skull, curling back and down, ridged; the other
  // snapped to a jagged stub at the root.
  const curl = [[-4, 0], [-6, 1], [-7, 3], [-7, 5], [-6, 7], [-4, 8]];
  for (const [dx, dy] of curl) px(ctx, x + dx - 1, y + dy - 1, PALETTE.outline, 3, 3);
  for (let i = 0; i < curl.length; i += 1) {
    px(ctx, x + curl[i][0], y + curl[i][1], i % 3 === 2 ? PALETTE.stoneDust : bone, 2, 2);
  }
  px(ctx, x - 5, y + 2, PALETTE.stoneDark, 1, 1);
  px(ctx, x - 6, y + 5, PALETTE.stoneDark, 1, 1);
  px(ctx, x + 4, y - 1, PALETTE.outline, 3, 3);
  px(ctx, x + 4, y - 1, bone, 2, 2);
  px(ctx, x + 6, y - 2, PALETTE.stoneDark, 2, 2);
}

// A ring of bone grown out of the skull, snapped away on one side. It sits
// tight behind the head, not floating over it.
function graveBrokenHalo(ctx, x, y) {
  for (let i = 0; i < 16; i += 1) {
    if (i > 9 && i < 13) continue;
    const a = Math.PI * (-0.12 + i * 0.078);
    const hx = x + Math.round(Math.cos(a) * 8);
    const hy = y - Math.round(Math.sin(a) * 7);
    px(ctx, hx - 1, hy - 1, PALETTE.outline, 3, 3);
  }
  for (let i = 0; i < 16; i += 1) {
    if (i > 9 && i < 13) continue;
    const a = Math.PI * (-0.12 + i * 0.078);
    const hx = x + Math.round(Math.cos(a) * 8);
    const hy = y - Math.round(Math.sin(a) * 7);
    px(ctx, hx, hy, i % 3 === 0 ? PALETTE.stoneDust : PALETTE.hostBone, i % 4 === 0 ? 2 : 1, i % 4 === 0 ? 2 : 1);
  }
  // The snapped root, a jag of bone where the ring tore off.
  px(ctx, x - 9, y + 2, PALETTE.outline, 3, 4);
  px(ctx, x - 8, y + 2, PALETTE.hostBone, 1, 2);
}

// Ribcage split down the sternum and butterflied open. Dead form: the cavity
// is dry stone and the wound in it is sunken rust, no glow.
function graveRibWings(ctx, cx, cyTop) {
  const cavW = 8;
  const cavH = 11;
  const left = cx - Math.floor(cavW / 2);
  px(ctx, left - 1, cyTop - 1, PALETTE.stoneDark, cavW + 2, cavH + 2);
  px(ctx, left, cyTop, PALETTE.void, cavW, cavH);
  px(ctx, left + 1, cyTop + 2, PALETTE.stoneDark, cavW - 2, cavH - 5);
  for (let v = 0; v < 4; v += 1) px(ctx, cx - 1, cyTop + 1 + v * 3, PALETTE.hostBone, 2, 2);
  px(ctx, cx + 1, cyTop + cavH - 3, PALETTE.rustDark, 2, 2);
  for (const s of [-1, 1]) {
    const baseX = s < 0 ? left : left + cavW - 1;
    for (let i = 0; i < 4; i += 1) {
      const ry = cyTop + 1 + i * 3;
      const reach = 9 - Math.abs(i - 1) * 2;
      for (let k = 0; k <= reach; k += 1) {
        const t = k / reach;
        const xx = baseX + s * k;
        const yy = Math.round(ry + (i - 1.5) * 2.6 * t - Math.sin(t * Math.PI) * 2.6);
        px(ctx, xx, yy + 1, PALETTE.void, 1, 1);
        px(ctx, xx, yy, PALETTE.hostBone, 1, 2);
      }
    }
    px(ctx, left - 1 + (s < 0 ? 0 : cavW), cyTop - 1, PALETTE.hostBone, 2, 2);
  }
}

// A Host victim who calcified standing in the Stilling and was left planted as
// the tombstone of their own grave. Human silhouette first: the horror is that
// the person is still readable, and still, faintly, in there.
export function drawCalcifiedGraveBody(ctx, cx, cy, seed, opts = {}) {
  const variant = GRAVE_BODY_VARIANTS.includes(opts.variant) ? opts.variant : GRAVE_BODY_VARIANTS[seed % GRAVE_BODY_VARIANTS.length];
  const rng = rngFrom(hash2D(seed + 227, seed * 5 + 41));
  const side = (seed & 1) ? 1 : -1;
  const bone = PALETTE.hostBone;
  const dust = PALETTE.stoneDust;
  const shade = PALETTE.stoneDark;
  const out = PALETTE.outline;

  const kneeling = variant === 'kneeling-fused-hands';
  const waistDeep = variant === 'buried-lower-body';
  const hunch = variant === 'thorned-back';
  const collapsed = variant === 'collapsed-shoulder';
  const reaching = variant === 'reaching-arm';
  const twistArm = variant === 'half-prayer-twist';

  drawShadowBlob(ctx, cx, cy + 3, waistDeep ? 42 : 34, 13);
  const moundTop = graveMound(ctx, cx, cy, seed, waistDeep);

  // Skeleton heights. Standing dead are buried to the shin, kneelers to the
  // thigh, and Vel Sarec's kind to the waist.
  let hipY;
  let shoulderY;
  if (waistDeep) {
    hipY = moundTop + 2;
    shoulderY = hipY - 17;
  } else if (kneeling) {
    hipY = moundTop - 4;
    shoulderY = hipY - 15;
  } else {
    hipY = moundTop - 10;
    shoulderY = hipY - 17 + (hunch ? 3 : 0);
  }
  const leanX = Math.round((rng() - 0.5) * 3) + (collapsed ? -side : 0);
  const twist = twistArm ? 4 : 2;

  // A warden's stake or a wired rust tag names the grave; the body is the stone.
  if (seed % 3 !== 0) {
    const sx = cx - side * 14;
    px(ctx, sx - 1, cy - 12, out, 4, 13);
    px(ctx, sx, cy - 11, PALETTE.woodDark, 2, 11);
    px(ctx, sx, cy - 11, PALETTE.woodMid, 1, 4);
    for (let m = 0; m < 3; m += 1) px(ctx, sx - 1 + m, cy - 9 + m * 2, bone, 1, 1);
  }

  // Legs emerging from the swell, ash collared at the shin.
  if (!waistDeep && !kneeling) {
    for (const s of [-1, 1]) {
      const legX = cx + leanX + s * 3 - 1;
      px(ctx, legX - 1, hipY, out, 5, moundTop - hipY + 2);
      px(ctx, legX, hipY, s < 0 ? bone : dust, 3, moundTop - hipY + 1);
      px(ctx, legX + 2, hipY, shade, 1, moundTop - hipY + 1);
      px(ctx, legX - 1, moundTop - 1, shade, 5, 2);
    }
    px(ctx, cx + leanX, hipY + 3, shade, 1, moundTop - hipY - 4);
  } else if (kneeling) {
    for (const s of [-1, 1]) {
      graveSeg(ctx, cx + leanX + s * 3, hipY, cx + leanX + s * 6, moundTop + 1, out, 4);
      graveSeg(ctx, cx + leanX + s * 3, hipY, cx + leanX + s * 6, moundTop + 1, s < 0 ? bone : dust, 2);
      px(ctx, cx + leanX + s * 6 - 2, moundTop, shade, 5, 2);
    }
  }

  // Torso: one calcified mass with vertical form shading, lit upper-left.
  const tH = Math.max(1, hipY - shoulderY);
  for (let y = shoulderY; y <= hipY; y += 1) {
    const t = (y - shoulderY) / tH;
    let w = Math.round(14 - 5 * t + (t > 0.8 ? 2 : 0));
    let dx = Math.round(leanX * (1 - t) + side * Math.sin(t * Math.PI) * twist * 0.5);
    if (hunch) dx += Math.round(side * (1 - t) * 3);
    if (collapsed && y < shoulderY + 4) {
      const bite = shoulderY + 4 - y;
      w -= bite;
      dx += side * Math.ceil(bite / 2);
    }
    const lx = cx + dx - Math.floor(w / 2);
    px(ctx, lx - 1, y, out, w + 2, 1);
    px(ctx, lx, y, bone, w, 1);
    px(ctx, lx + w - 3, y, dust, 3, 1);
    px(ctx, lx + w - 1, y, shade, 1, 1);
    if ((y + seed) % 3 === 0) px(ctx, lx, y, PALETTE.stoneLight, 1, 1);
    if ((y * 3 + seed) % 11 === 0) px(ctx, lx + 2, y, shade, Math.max(2, w - 6), 1);
  }
  if (waistDeep) {
    px(ctx, cx + leanX - 8, hipY + 1, out, 17, 2);
    px(ctx, cx + leanX - 7, hipY + 1, shade, 15, 1);
  }

  // Chest: the opened place. Ribs butterflied for Toma Kest; everyone else
  // keeps a sunken drained wound pit, off center, no glow.
  if (variant === 'rib-open-chest') {
    graveRibWings(ctx, cx + leanX, shoulderY + 3);
  } else if (!kneeling && !twistArm) {
    const wx = cx + leanX + side * 2;
    px(ctx, wx - 2, shoulderY + 5, shade, 5, 7);
    px(ctx, wx - 1, shoulderY + 6, PALETTE.void, 3, 5);
    px(ctx, wx, shoulderY + 9, PALETTE.rustDark, 1, 2);
  }

  // Arms.
  const armDrop = hipY + 2;
  if (kneeling) {
    const hx = cx + leanX;
    for (const s of [-1, 1]) {
      graveSeg(ctx, hx + s * 6, shoulderY + 2, hx + s * 2, shoulderY + 5, out, 4);
      graveSeg(ctx, hx + s * 6, shoulderY + 2, hx + s * 2, shoulderY + 5, s < 0 ? bone : dust, 2);
    }
    // Both hands fused into one bone mass under the chin, a seam down the palms.
    px(ctx, hx - 3, shoulderY - 3, out, 8, 10);
    px(ctx, hx - 2, shoulderY - 2, bone, 6, 8);
    px(ctx, hx, shoulderY - 2, PALETTE.void, 1, 7);
    for (let f = 0; f < 3; f += 1) px(ctx, hx - 2 + f * 2, shoulderY + 5, shade, 1, 1);
  } else if (reaching) {
    // One whole arm frozen reaching for the fence, fingers splayed.
    const sx0 = cx + leanX + side * 6;
    const ex = sx0 + side * 7;
    const ey = shoulderY + 1;
    const wx = sx0 + side * 15;
    const wy = shoulderY + 5;
    graveSeg(ctx, sx0, shoulderY + 2, ex, ey, out, 4);
    graveSeg(ctx, ex, ey, wx, wy, out, 3);
    graveSeg(ctx, sx0, shoulderY + 2, ex, ey, bone, 2);
    graveSeg(ctx, ex, ey, wx, wy, dust, 2);
    for (let f = 0; f < 3; f += 1) {
      graveSeg(ctx, wx + side, wy - 1 + f, wx + side * (4 - (f & 1)), wy - 2 + f * 2, bone, 1);
    }
    // The other folded hard into the chest.
    graveSeg(ctx, cx + leanX - side * 6, shoulderY + 3, cx + leanX - side, shoulderY + 8, out, 4);
    graveSeg(ctx, cx + leanX - side * 6, shoulderY + 3, cx + leanX - side, shoulderY + 8, dust, 2);
    px(ctx, cx + leanX - side - 1, shoulderY + 8, bone, 3, 3);
  } else if (twistArm) {
    // One palm sealed flat to the chest.
    const hx = cx + leanX + side;
    graveSeg(ctx, cx + leanX - side * 6, shoulderY + 2, hx - 1, shoulderY + 7, out, 4);
    graveSeg(ctx, cx + leanX - side * 6, shoulderY + 2, hx - 1, shoulderY + 7, bone, 2);
    px(ctx, hx - 2, shoulderY + 6, out, 6, 7);
    px(ctx, hx - 1, shoulderY + 7, bone, 4, 5);
    for (let f = 0; f < 3; f += 1) px(ctx, hx - 1 + f, shoulderY + 8 + f, shade, 1, 1);
    // The other elbow cracked backward, the forearm bent the wrong way.
    const bx = cx + leanX + side * 7;
    graveSeg(ctx, bx, shoulderY + 2, bx + side * 4, shoulderY + 9, out, 4);
    graveSeg(ctx, bx, shoulderY + 2, bx + side * 4, shoulderY + 9, dust, 2);
    graveSeg(ctx, bx + side * 4, shoulderY + 9, bx + side * 8, shoulderY + 3, out, 3);
    graveSeg(ctx, bx + side * 4, shoulderY + 9, bx + side * 8, shoulderY + 3, dust, 1);
    px(ctx, bx + side * 4 - 1, shoulderY + 8, PALETTE.rustDark, 3, 2);
  } else {
    for (const s of [-1, 1]) {
      const far = s === 1;
      const tone = far ? dust : bone;
      const drop = collapsed && s === side ? 6 : 0;
      const sx0 = cx + leanX + s * 7;
      const sy0 = shoulderY + 2 + (collapsed && s === side ? 4 : 0);
      const ex = sx0 + s * 2;
      const ey = Math.round((sy0 + armDrop) / 2);
      const wx = cx + leanX + s * 6;
      const wy = armDrop + drop;
      graveSeg(ctx, sx0, sy0, ex, ey, out, 4);
      graveSeg(ctx, ex, ey, wx, wy, out, 3);
      graveSeg(ctx, sx0, sy0, ex, ey, tone, 2);
      graveSeg(ctx, ex, ey, wx, wy, tone, 1);
      px(ctx, wx - 1, wy + 1, tone, 2, 3);
      px(ctx, wx - 1, wy + 3, shade, 2, 1);
    }
  }

  // Snapped bone thorns through the back, frozen where they broke skin.
  if (hunch) {
    for (let i = 0; i < 5; i += 1) {
      const bx = cx + leanX - 7 + i * 3;
      const by = shoulderY + 1 + (i % 2);
      const len = 6 + ((i * 7 + seed) % 5);
      const tipX = bx - side * (2 + (i % 3));
      graveSeg(ctx, bx, by, tipX, by - len, out, 3);
      graveSeg(ctx, bx, by, tipX, by - len, i % 2 ? dust : bone, 1);
      px(ctx, tipX - 1, by - len - 1, shade, 3, 2);
    }
  }

  // Head.
  const headShift = collapsed ? -side * 2 : hunch ? side * 3 : Math.round(leanX * 0.6);
  const headX = cx + leanX + headShift;
  const headTop = shoulderY - 13 + (hunch ? 3 : 0) + (kneeling ? 2 : 0);
  px(ctx, headX - 2, headTop + 9, out, 5, Math.max(2, shoulderY - headTop - 8));
  px(ctx, headX - 1, headTop + 10, bone, 3, Math.max(1, shoulderY - headTop - 9));
  if (variant === 'broken-halo') {
    graveBrokenHalo(ctx, headX, headTop + 5);
    for (let c = 0; c < 3; c += 1) {
      px(ctx, cx - 6 + c * 5 + (seed % 3), cy - 2 - (c & 1), out, 3, 2);
      px(ctx, cx - 6 + c * 5 + (seed % 3), cy - 3 - (c & 1), c % 2 ? bone : dust, 2, 1);
    }
  }
  if (variant === 'goat-skull') {
    graveGoatSkull(ctx, headX, headTop, side);
  } else {
    graveAgonyHead(ctx, headX, headTop, seed, {
      tilt: kneeling ? side : collapsed ? -side * 2 : Math.round((rng() - 0.5) * 4),
      jawDrop: variant === 'bell-jaw' ? 7 : 2 + (seed % 3),
      bell: variant === 'bell-jaw',
      split: variant === 'split-face'
    });
  }

  // Dead veins climbing out of the grave, drained to grey. One old rust cut.
  for (let v = 0; v < 2; v += 1) {
    const vx = cx + leanX + (v ? side * 3 : -side * 2);
    graveSeg(ctx, vx, moundTop - 1, vx + (v ? 2 : -3), hipY + 2, shade, 1);
  }
  if (seed % 2 === 0) px(ctx, cx + leanX - 4, hipY - 3, PALETTE.rustDark, 7, 1);

  // A wired rust tag at the chest where a name would go.
  if (seed % 3 === 0) {
    const tx = cx + leanX - side * 3;
    linePx(ctx, tx - 3, shoulderY + 1, tx + 4, shoulderY + 2, PALETTE.rustDark, 1);
    px(ctx, tx - 1, shoulderY + 3, out, 5, 5);
    px(ctx, tx, shoulderY + 4, PALETTE.rustMid, 3, 3);
    px(ctx, tx, shoulderY + 4, PALETTE.rustLight, 2, 1);
  }

  // Bone chips shed at the base.
  for (let i = 0; i < 4; i += 1) {
    const bx = cx - 12 + Math.floor(rng() * 25);
    const by = cy - 1 + (i & 1);
    px(ctx, bx, by, out, 3, 2);
    px(ctx, bx, by - 1, i % 2 ? bone : dust, 2, 1);
  }
  drawNoisePixels(ctx, cx - 16, cy - 5, 32, 9, [shade, PALETTE.rustDark], 0.06, seed + 9);
  // A candle stub at the head, burned down to a wax coin: someone sat with
  // this one until the light went out.
  px(ctx, cx + 10, cy - 2, PALETTE.hostBone, 3, 2);
  px(ctx, cx + 11, cy - 3, PALETTE.rustDark, 1, 1); // the dead wick
  px(ctx, cx + 9, cy, PALETTE.stoneDust, 5, 1); // the wax coin

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
  px(ctx, cx - flip * 2, cy - 8, PALETTE.outline, 12, 2);
  px(ctx, cx - flip * 1, cy - 9, PALETTE.clothRed, 8, 1);
  px(ctx, cx + flip * 1, cy + 4, PALETTE.outline, 16, 2);
  px(ctx, cx + flip * 2, cy + 3, PALETTE.rustDark, 12, 1);

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
  px(ctx, cx - flip * 18, cy + 8, PALETTE.outline, 8, 3);
  px(ctx, cx - flip * 17, cy + 7, PALETTE.clothRed, 5, 1);
  px(ctx, cx + flip * 14, cy + 5, PALETTE.outline, 5, 3);
  px(ctx, cx + flip * 15, cy + 4, PALETTE.hostBone, 2, 1);
  for (const [dx, dy] of [[-14, -7], [-5, -9], [7, -3], [16, 1]]) {
    px(ctx, cx + flip * dx, cy + dy, PALETTE.outline, 3, 3);
    px(ctx, cx + flip * dx, cy + dy - 1, rng() < 0.5 ? PALETTE.hostGold : PALETTE.rustMid, 1, 1);
  }

  for (let i = 0; i < 7; i += 1) {
    px(ctx, cx - 17 + Math.floor(rng() * 35), cy - 5 + Math.floor(rng() * 14), PALETTE.hostRed, 1, 1);
  }
  drawRubbleCluster(ctx, cx + flip * 22, cy + 8, seed + 157, 2);
  // Their own carving knife still in the curled hand, and beneath it the
  // sigil they never finished: three lines of a five-line star. Whatever
  // interrupted the rite did not wait for the geometry.
  px(ctx, cx + 12, cy + 2, PALETTE.stoneLight, 4, 1); // the blade in hand
  px(ctx, cx + 15, cy + 1, PALETTE.woodDark, 2, 2);
  linePx(ctx, cx + 6, cy + 7, cx + 12, cy + 5, PALETTE.hostRed, 1);
  linePx(ctx, cx + 12, cy + 5, cx + 9, cy + 9, PALETTE.hostRed, 1);
  linePx(ctx, cx + 9, cy + 9, cx + 14, cy + 8, PALETTE.rustMid, 1); // the third, fainter line

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

export function drawHostVeinSeam(ctx, cx, cy, seed) {
  const rng = rngFrom(hash2D(seed + 701, seed * 13 + 19));
  const branchCount = 4 + (seed % 3);
  const rootX = cx - 16 + Math.floor(rng() * 9);
  const rootY = cy + Math.floor(rng() * 5) - 2;

  for (let branch = 0; branch < branchCount; branch += 1) {
    const dir = branch % 2 === 0 ? 1 : -1;
    let x = rootX + Math.floor(rng() * 14);
    let y = rootY + Math.floor(rng() * 5) - 2;
    const segments = 3 + Math.floor(rng() * 3);
    for (let step = 0; step < segments; step += 1) {
      const nx = x + dir * (8 + Math.floor(rng() * 9)) + Math.floor(rng() * 5) - 2;
      const ny = y - 5 + Math.floor(rng() * 12);
      linePx(ctx, x, y, nx, ny, PALETTE.void, 2);
      linePx(ctx, x, y, nx, ny, PALETTE.hostBlack, 1);
      if ((step + branch) % 2 === 0) {
        const midX = Math.round((x + nx) / 2);
        const midY = Math.round((y + ny) / 2);
        const glintX = Math.round(x + (nx - x) * 0.62);
        const glintY = Math.round(y + (ny - y) * 0.62);
        linePx(ctx, midX, midY, glintX, glintY, PALETTE.hostGold, 1);
        px(ctx, midX, midY, PALETTE.hostGold, 1, 1);
      }
      x = nx;
      y = ny;
    }
  }

  for (let speck = 0; speck < 9; speck += 1) {
    const x = cx - 22 + Math.floor(rng() * 45);
    const y = cy - 8 + Math.floor(rng() * 17);
    px(ctx, x, y, speck % 3 === 0 ? PALETTE.hostGold : PALETTE.hostBlack, 1, 1);
  }
}

export function drawHostWolfRemains(ctx, cx, cy, seed) {
  const rng = rngFrom(hash2D(seed + 733, seed * 17 + 29));
  const flip = (seed & 1) ? 1 : -1;
  drawShadowBlob(ctx, cx, cy + 5, 48, 17);
  ctx.save();
  ctx.globalAlpha = 0.82;
  drawIsoDiamond(ctx, cx + flip * 2, cy + 5, 41, 16, PALETTE.rustDark);
  ctx.restore();
  drawNoisePixels(ctx, cx - 24, cy - 9, 49, 21, [PALETTE.hostBlack, PALETTE.rustDark, PALETTE.hostRed], 0.08, seed);

  for (let row = 0; row < 10; row += 1) {
    const core = row < 5 ? row : 9 - row;
    const w = 19 + core * 5;
    const x = cx - Math.floor(w / 2) - flip * 5 + (row > 6 ? flip * 3 : 0);
    const y = cy - 11 + row;
    const tone = row < 3 ? PALETTE.stoneMid : row < 7 ? PALETTE.hostBlack : PALETTE.void;
    px(ctx, x - 1, y, PALETTE.outline, w + 2, 1);
    px(ctx, x, y, tone, w, 1);
    if (row < 4) px(ctx, x + 2, y, PALETTE.stoneDust, 3, 1);
    if (row === 5 || row === 7) px(ctx, x + 7, y, PALETTE.hostGold, Math.max(2, w - 16), 1);
  }

  const chestX = cx - flip * 4;
  const chestY = cy - 9;
  px(ctx, chestX - 7, chestY - 1, PALETTE.void, 15, 8);
  px(ctx, chestX - 5, chestY, PALETTE.hostBlack, 11, 6);
  for (let rib = 0; rib < 5; rib += 1) {
    linePx(ctx, chestX - 1, chestY + rib * 2, chestX - flip * (12 + rib), chestY - 6 + rib, PALETTE.outline, 2);
    linePx(ctx, chestX - 1, chestY + rib * 2, chestX - flip * (11 + rib), chestY - 6 + rib, rib % 2 ? PALETTE.stoneDust : PALETTE.hostBone, 1);
  }
  px(ctx, chestX + flip * 2, chestY - 1, PALETTE.hostGold, 1, 9);

  const headX = cx + flip * 17;
  const headY = cy - 15;
  drawDeadWolfSkull(ctx, headX, headY, flip, { openJaw: true, halo: true });

  for (let chip = 0; chip < 6; chip += 1) {
    const chipX = cx - 18 + Math.floor(rng() * 36);
    const chipY = cy - 2 + Math.floor(rng() * 16);
    px(ctx, chipX, chipY, chip % 2 ? PALETTE.stoneDust : PALETTE.hostBone, chip % 3 === 0 ? 2 : 1, 1);
  }

  for (let i = 0; i < 3; i += 1) {
    const baseX = chestX - flip * (4 + i * 3);
    const baseY = chestY + 5 + i;
    const tipX = baseX - flip * (11 + Math.floor(rng() * 8));
    const tipY = cy + 8 + Math.floor(rng() * 6);
    linePx(ctx, baseX, baseY, tipX, tipY, i % 2 ? PALETTE.hostRed : PALETTE.hostBlack, 1);
    px(ctx, tipX, tipY, PALETTE.hostGold, 1, 1);
  }

  linePx(ctx, cx - flip * 7, cy - 5, cx - flip * 21, cy + 7, PALETTE.outline, 3);
  linePx(ctx, cx - flip * 7, cy - 5, cx - flip * 21, cy + 7, PALETTE.stoneDark, 1);
  px(ctx, cx - flip * 22, cy + 7, PALETTE.hostBone, 3, 1);
  // A censure chalk ring drawn around the remains with a cleared-tally
  // beside it: inspected, counted, and left where it fell. Policy.
  for (let a = 0; a < 14; a += 1) {
    const t = (a / 14) * Math.PI * 2;
    if (a % 3 === 0) continue; // the ring is drawn tired, in dashes
    px(ctx, cx + Math.round(Math.cos(t) * 20), cy + 3 + Math.round(Math.sin(t) * 9), PALETTE.stoneLight, 1, 1);
  }
  px(ctx, cx + 21, cy - 6, PALETTE.stoneLight, 1, 3);
  px(ctx, cx + 23, cy - 6, PALETTE.stoneLight, 1, 3);

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
  // A snapped spear still standing in the ribs, its broken half in the dirt
  // an arm's reach away: someone stood their ground here and, for once, won.
  linePx(ctx, cx + 4, cy - 14, cx + 7, cy - 24, PALETTE.woodDark, 2); // the standing half
  px(ctx, cx + 6, cy - 26, PALETTE.stoneLight, 2, 3); // its head
  linePx(ctx, cx - 16, cy + 8, cx - 8, cy + 10, PALETTE.woodDark, 1); // the broken half
  px(ctx, cx - 17, cy + 8, PALETTE.woodLight, 2, 1); // raw break

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
  // A fence stake wedged upright between the jaws: whoever killed it did
  // not trust the mouth to stay shut, and wedged it open instead.
  linePx(ctx, cx + 8, cy - 4, cx + 10, cy - 14, PALETTE.woodDark, 2);
  px(ctx, cx + 9, cy - 16, PALETTE.woodLight, 2, 2); // the splintered top
  px(ctx, cx + 7, cy - 3, PALETTE.stoneDark, 4, 1); // where it bites the jaw

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
  // Salt thrown over the carcass in a pale scatter, densest at the split:
  // the Remnant's ritual disposal, done by the book even out here.
  for (let s = 0; s < 9; s += 1) {
    px(ctx, cx - 10 + ((s * 7) % 21), cy - 4 + ((s * 5) % 9), PALETTE.hostBone, 1, 1);
  }
  px(ctx, cx - 2, cy - 2, PALETTE.hostBone, 3, 1); // the dense line at the split

}
