import { PALETTE } from '../palette.js';
import {
  drawNoisePixels,
  hash2D,
  linePx,
  nativeLinePx,
  nativePx,
  px,
  rngFrom
} from './basePixels.js';

// Ash-road plants: dead growth, hard pixels, and no clean green.

const TREE_TONES = [
  PALETTE.stoneDark,
  PALETTE.woodDark,
  PALETTE.stoneMid,
  PALETTE.rustDark
];

const TREE_SHAPES = [
  {
    name: 'tall-ragged-crown',
    height: 67,
    lean: -3,
    trunk: 7,
    canopyY: -90,
    shadow: [50, 18],
    clumps: [
      [-18, -20, 27, 17],
      [5, -27, 31, 18],
      [25, -15, 25, 16],
      [-34, -5, 25, 16],
      [-10, -2, 39, 21],
      [18, 3, 33, 19],
      [-28, 17, 30, 16],
      [7, 21, 36, 17],
      [34, 15, 22, 14]
    ],
    branches: [
      [-6, -48, -30, -70, 3],
      [-1, -55, 17, -78, 2],
      [0, -38, 31, -51, 2]
    ]
  },
  {
    name: 'low-wind-bent-crown',
    height: 52,
    lean: 8,
    trunk: 6,
    canopyY: -64,
    shadow: [58, 17],
    clumps: [
      [-45, -8, 31, 16],
      [-25, -17, 35, 18],
      [-2, -13, 40, 19],
      [23, -5, 34, 17],
      [46, 2, 22, 13],
      [-34, 9, 34, 17],
      [-7, 11, 44, 19],
      [24, 16, 31, 15]
    ],
    branches: [
      [-4, -35, -34, -54, 3],
      [0, -42, 22, -58, 2],
      [4, -29, 44, -36, 2]
    ]
  },
  {
    name: 'split-fork',
    height: 60,
    lean: 1,
    trunk: 8,
    canopyY: -74,
    shadow: [52, 18],
    clumps: [
      [-37, -12, 30, 18],
      [-18, -24, 33, 19],
      [-34, 6, 34, 18],
      [-10, 8, 28, 16],
      [19, -23, 32, 18],
      [40, -10, 26, 16],
      [19, 7, 36, 18],
      [42, 11, 22, 14]
    ],
    branches: [
      [-2, -37, -24, -68, 4],
      [1, -39, 23, -69, 4],
      [-1, -28, -42, -38, 2],
      [3, -30, 45, -40, 2]
    ]
  },
  {
    name: 'sparse-dead-snag',
    height: 74,
    lean: -6,
    trunk: 6,
    canopyY: -83,
    shadow: [43, 15],
    clumps: [
      [-25, -9, 21, 13],
      [20, -19, 20, 12],
      [-5, 9, 23, 13],
      [28, 10, 17, 11]
    ],
    branches: [
      [-5, -62, -35, -89, 2],
      [-7, -49, -43, -56, 2],
      [-4, -39, 26, -57, 2],
      [-2, -27, 39, -31, 2],
      [-8, -69, 3, -99, 2]
    ],
    sparse: true
  },
  {
    name: 'broken-crown',
    height: 56,
    lean: 4,
    trunk: 7,
    canopyY: -70,
    shadow: [48, 16],
    clumps: [
      [-31, -15, 30, 17],
      [-8, -23, 34, 18],
      [20, -12, 26, 15],
      [-33, 4, 33, 18],
      [-4, 6, 37, 18],
      [25, 11, 24, 14],
      [-16, 22, 30, 15]
    ],
    branches: [
      [-3, -44, -25, -66, 3],
      [0, -50, 12, -82, 2],
      [2, -39, 34, -45, 3],
      [5, -55, 35, -72, 2]
    ],
    brokenTop: true
  }
];

function clumpShade(tone) {
  if (tone === PALETTE.stoneMid) return PALETTE.stoneDark;
  if (tone === PALETTE.woodDark) return PALETTE.hostBlack;
  if (tone === PALETTE.rustDark) return PALETTE.hostBlack;
  return PALETTE.stoneDark;
}

function leafClump(ctx, x, y, w, h, tone, rim = null) {
  const width = Math.max(6, Math.round(w));
  const height = Math.max(5, Math.round(h));
  const top = Math.round(y - Math.floor(height / 2));
  const shade = clumpShade(tone);

  for (let row = 0; row < height; row += 3) {
    const centerPull = Math.abs(row - height / 2) / Math.max(1, height / 2);
    const inset = Math.floor(centerPull * width * 0.22);
    const rag = ((row * 5 + width * 3 + height) % 5) - 2;
    const span = Math.max(4, width - inset * 2 - (row % 4 === 0 ? 2 : 0));
    const left = Math.round(x - Math.floor(span / 2) + rag);
    const yy = top + row;
    const rowH = Math.min(3, height - row);

    px(ctx, left - 1, yy, PALETTE.outline, span + 2, rowH);
    px(ctx, left, yy, tone, span, rowH);
    if (row > height * 0.48) {
      px(ctx, left + Math.floor(span * 0.38), yy + rowH - 1, shade, Math.max(2, Math.floor(span * 0.48)), 1);
    }
    if (rim && row < height * 0.36) {
      px(ctx, left + 1, yy, rim, Math.max(2, Math.floor(span * 0.34)), 1);
    }
  }

  px(ctx, Math.round(x - width * 0.35), top + Math.floor(height * 0.55), PALETTE.outline, 3, 2);
  px(ctx, Math.round(x + width * 0.22), top + Math.floor(height * 0.25), shade, 3, 1);
  if (rim) px(ctx, Math.round(x - width * 0.18), top + 1, rim, 3, 1);

  // Ash-eaten gaps bitten out of the mass: dead foliage thins to holes rather
  // than staying a solid puff, and the deep shadow behind shows through.
  const gap = Math.max(2, Math.floor(width * 0.14));
  px(ctx, Math.round(x + width * 0.24), top + Math.floor(height * 0.42), PALETTE.hostBlack, gap, 2);
  px(ctx, Math.round(x - width * 0.44), top + Math.floor(height * 0.6), PALETTE.hostBlack, gap - 1, 2);
  px(ctx, Math.round(x + width * 0.05), top + Math.floor(height * 0.7), PALETTE.hostBlack, gap - 1, 1);

  // Native-resolution leaf edges keep the clump ragged without turning its
  // broad, readable mass into noise. These sit inside the upper-left light
  // and lower fold, so each half-logical mark remains attached to foliage.
  const lit = rim ?? (tone === PALETTE.woodDark ? PALETTE.woodMid : PALETTE.stoneDust);
  const litX = Math.round(x - width * 0.24) + 0.5;
  const litY = top + Math.max(1, Math.floor(height * 0.24)) + 0.5;
  nativeLinePx(ctx, litX, litY + 1, litX + 2.5, litY, lit);
  const foldX = Math.round(x + width * 0.15) + 0.5;
  const foldY = top + Math.max(2, Math.floor(height * 0.63)) + 0.5;
  nativeLinePx(ctx, foldX, foldY, foldX + 2, foldY + 0.5, shade);
  nativePx(ctx, Math.round(x - width * 0.42) + 0.5, top + Math.floor(height * 0.5) + 0.5, PALETTE.outline);
}

function jitter(rng, amount) {
  return Math.floor((rng() - 0.5) * amount);
}

function drawTrunk(ctx, cx, cy, shape, rng) {
  const lean = shape.lean + jitter(rng, 5);
  const topX = cx + lean;
  const topY = cy - shape.height;
  const trunkWidth = shape.trunk + Math.floor(rng() * 2);

  linePx(ctx, cx - 3, cy - 6, topX - 2, topY, PALETTE.outline, trunkWidth + 2);
  linePx(ctx, cx - 2, cy - 7, topX - 1, topY + 1, PALETTE.woodDark, trunkWidth);
  linePx(ctx, cx - 5, cy - 8, topX - 4, topY + 3, PALETTE.woodMid, 2);
  linePx(ctx, cx + 2, cy - 8, topX + 2, topY + 4, PALETTE.stoneDark, 2);

  const rootLean = lean > 0 ? 1 : -1;
  linePx(ctx, cx - 4, cy - 2, cx - 20 - Math.floor(rng() * 8), cy + 3 + Math.floor(rng() * 4), PALETTE.outline, 3);
  linePx(ctx, cx + 4, cy - 3, cx + 17 + Math.floor(rng() * 8), cy + 1 + Math.floor(rng() * 4), PALETTE.outline, 3);
  linePx(ctx, cx - 4, cy - 2, cx - 18 - Math.floor(rng() * 6), cy + 2 + Math.floor(rng() * 4), PALETTE.woodDark, 1);
  linePx(ctx, cx + 4, cy - 3, cx + 15 + Math.floor(rng() * 6), cy + rootLean + Math.floor(rng() * 3), PALETTE.woodMid, 1);
  if (rng() < 0.7) {
    linePx(ctx, cx, cy - 5, cx + jitter(rng, 18), cy + 7, PALETTE.stoneDark, 2);
  }

  for (const [x0, y0, x1, y1, width] of shape.branches) {
    const branchX0 = topX + x0 + jitter(rng, 4);
    const branchY0 = cy + y0 + jitter(rng, 4);
    const branchX1 = topX + x1 + jitter(rng, 6);
    const branchY1 = cy + y1 + jitter(rng, 6);
    linePx(ctx, branchX0, branchY0, branchX1, branchY1, PALETTE.outline, width + 1);
    linePx(ctx, branchX0, branchY0, branchX1, branchY1, width > 2 ? PALETTE.woodDark : PALETTE.stoneDark, width);
    if (width > 2) linePx(ctx, branchX0 - 1, branchY0, branchX1 - 1, branchY1, PALETTE.woodMid, 1);
  }

  const scarCount = 2 + Math.floor(rng() * 4);
  for (let i = 0; i < scarCount; i += 1) {
    const sy = cy - 19 - Math.floor(rng() * Math.max(16, shape.height - 20));
    const sx = cx + lean * 0.35 + jitter(rng, 8);
    px(ctx, sx, sy, PALETTE.stoneDust, 2, 7 + Math.floor(rng() * 5));
    if (i % 2 === 0) px(ctx, sx + 2, sy + 2, PALETTE.rustDark, 2, 5);
  }

  // Fine bark checks follow the trunk instead of floating beside it. At 2x
  // they are single backing pixels, small enough to break up the old broad
  // logical-pixel bands while preserving the established silhouette.
  for (let i = 0; i < 4; i += 1) {
    const t = 0.2 + i * 0.17;
    const sx = cx + (topX - cx) * t - 1.5 + (i & 1);
    const sy = cy + (topY - cy) * t + 0.5;
    nativeLinePx(
      ctx,
      sx,
      sy + 2,
      sx + (i & 1 ? 1 : -0.5),
      sy - 2.5,
      i === 0 ? PALETTE.woodLight : PALETTE.stoneDust
    );
  }

  if (shape.brokenTop) {
    linePx(ctx, topX - 1, topY + 7, topX + 4, topY - 14, PALETTE.outline, 3);
    linePx(ctx, topX - 1, topY + 7, topX + 3, topY - 12, PALETTE.stoneDark, 2);
    px(ctx, topX + 2, topY - 16, PALETTE.stoneDust, 3, 3);
  }

  return { topX, topY, lean };
}

function drawAshCanopy(ctx, cx, cy, seed, shape, rng, top) {
  const canopyY = cy + shape.canopyY + jitter(rng, 6);
  const canopyLean = Math.floor(top.lean * 0.9);
  for (let i = 0; i < shape.clumps.length; i += 1) {
    const [dx, dy, w, h] = shape.clumps[i];
    const tone = TREE_TONES[(i + seed + shape.height) % TREE_TONES.length];
    const rim = (i + seed) % (shape.sparse ? 2 : 3) === 0 ? PALETTE.stoneDust : null;
    const width = Math.max(12, w + jitter(rng, shape.sparse ? 8 : 10));
    const height = Math.max(8, h + jitter(rng, shape.sparse ? 6 : 8));
    leafClump(
      ctx,
      cx + canopyLean + dx + jitter(rng, 8),
      canopyY + dy + jitter(rng, 7),
      width,
      height,
      tone,
      rim
    );
  }

  const flecks = shape.sparse ? 10 : 18;
  const spreadW = shape.sparse ? 76 : 102;
  const spreadH = shape.sparse ? 78 : 62;
  for (let i = 0; i < flecks; i += 1) {
    const x = cx + canopyLean - Math.floor(spreadW / 2) + Math.floor(rng() * spreadW);
    const y = canopyY - 28 + Math.floor(rng() * spreadH);
    const tone = rng() < 0.62 ? PALETTE.hostBlack : PALETTE.rustDark;
    px(ctx, x, y, tone, 2 + Math.floor(rng() * 3), 1 + Math.floor(rng() * 2));
  }
  drawNoisePixels(ctx, cx + canopyLean - 48, canopyY - 26, 96, 62, [PALETTE.hostBlack, PALETTE.woodDark], shape.sparse ? 0.015 : 0.026, seed);
  const hanging = shape.sparse ? 3 : 5;
  for (let i = 0; i < hanging; i += 1) {
    const x = cx + canopyLean - 34 + Math.floor(rng() * 69);
    const y = canopyY + 3 + Math.floor(rng() * 22);
    const len = 9 + Math.floor(rng() * 13);
    const bend = -3 + Math.floor(rng() * 7);
    linePx(ctx, x, y, x + bend, y + len, PALETTE.outline, 2);
    linePx(ctx, x, y, x + bend, y + len - 1, i % 2 ? PALETTE.woodDark : PALETTE.stoneDark, 1);
  }
  for (let i = 0; i < 3; i += 1) {
    const x = cx + canopyLean - 28 + Math.floor(rng() * 57);
    const y = canopyY - 10 + Math.floor(rng() * 38);
    px(ctx, x, y, PALETTE.hostGold, 1, 1);
  }
}

export function drawAshTree(ctx, cx, cy, seed) {
  const rng = rngFrom(hash2D(seed + 101, seed * 3 + 17));
  const shape = TREE_SHAPES[seed % TREE_SHAPES.length];
  const top = drawTrunk(ctx, cx, cy, shape, rng);
  drawAshCanopy(ctx, cx, cy, seed, shape, rng, top);
  // One tree in six is a wayside shrine: a small plank nailed at chest
  // height with a cord-wrapped token. The road prays to what it passes.
  if (seed % 6 === 1) {
    px(ctx, cx - 7, cy - 26, PALETTE.outline, 9, 6);
    px(ctx, cx - 6, cy - 25, PALETTE.woodLight, 7, 4); // the plank
    px(ctx, cx - 4, cy - 24, PALETTE.stoneDark, 4, 1); // scratched line of prayer
    px(ctx, cx - 3, cy - 22, PALETTE.hostGold, 2, 1); // the token
    px(ctx, cx - 2, cy - 20, PALETTE.clothTan, 1, 3); // its cord tail
  }

}

export function drawAshTreeStump(ctx, cx, cy, seed) {
  const rng = rngFrom(hash2D(seed + 37, seed * 5 + 9));
  for (const root of [
    [-16, 0, -33, 9, PALETTE.outline, 3],
    [15, -1, 31, 7, PALETTE.outline, 3],
    [-3, 1, -9, 15, PALETTE.outline, 2],
    [5, 0, 22, 14, PALETTE.outline, 2]
  ]) {
    linePx(ctx, cx + root[0], cy + root[1], cx + root[2], cy + root[3], root[4], root[5]);
  }
  px(ctx, cx - 13, cy - 25, PALETTE.outline, 27, 29);
  px(ctx, cx - 11, cy - 24, PALETTE.woodDark, 22, 27);
  px(ctx, cx - 10, cy - 24, PALETTE.woodMid, 6, 23);
  px(ctx, cx + 7, cy - 20, PALETTE.stoneDark, 4, 21);
  const topY = cy - 26;
  px(ctx, cx - 12, topY - 2, PALETTE.outline, 25, 10);
  px(ctx, cx - 10, topY - 1, PALETTE.woodMid, 21, 7);
  px(ctx, cx - 8, topY + 1, PALETTE.stoneDark, 16, 2);
  px(ctx, cx - 5, topY + 3, PALETTE.rustDark, 10, 1);
  px(ctx, cx - 2, topY, PALETTE.rustDark, 3, 7);
  // The heartwood weeps a thin black-gold seam where the saw went through:
  // even the trees on this road carry the Imprint.
  px(ctx, cx - 1, topY + 1, PALETTE.hostBlack, 1, 4);
  px(ctx, cx, topY + 2, PALETTE.hostGold, 1, 2);
  px(ctx, cx, topY + 8, PALETTE.hostGold, 1, 1); // one drop run down the bark
  px(ctx, cx - 7, topY, PALETTE.woodDark, 14, 1);
  px(ctx, cx - 5, topY + 2, PALETTE.woodDark, 10, 1);
  px(ctx, cx - 3, topY + 4, PALETTE.outline, 6, 1);
  linePx(ctx, cx - 1, topY - 2, cx - 7, topY + 4, PALETTE.outline, 1);
  linePx(ctx, cx, topY - 1, cx + 5, topY + 4, PALETTE.rustDark, 1);
  px(ctx, cx - 11, topY - 4, PALETTE.outline, 5, 4);
  px(ctx, cx + 7, topY - 5, PALETTE.outline, 5, 5);
  px(ctx, cx - 10, topY - 3, PALETTE.stoneDust, 3, 2);
  px(ctx, cx + 8, topY - 4, PALETTE.woodLight, 3, 3);
  linePx(ctx, cx - 7, topY - 5, cx - 10, topY - 13, PALETTE.outline, 2);
  linePx(ctx, cx - 7, topY - 5, cx - 9, topY - 12, PALETTE.stoneDark, 1);
  linePx(ctx, cx + 9, topY - 5, cx + 14, topY - 15, PALETTE.outline, 2);
  linePx(ctx, cx + 9, topY - 5, cx + 13, topY - 14, PALETTE.woodDark, 1);
  px(ctx, cx - 6, topY + 1, PALETTE.woodDark, 13, 1);
  px(ctx, cx - 4, topY + 3, PALETTE.woodDark, 9, 1);
  px(ctx, cx - 2, topY + 5, PALETTE.outline, 5, 1);
  for (let i = 0; i < 5; i += 1) {
    const sx = cx - 8 + Math.floor(rng() * 17);
    const sy = topY - 3 + Math.floor(rng() * 6);
    px(ctx, sx, sy, i % 2 ? PALETTE.stoneDust : PALETTE.outline, 2, 2);
  }
  for (const root of [
    [-11, -2, -27, 7, PALETTE.woodDark],
    [10, -3, 24, 5, PALETTE.stoneDark],
    [-2, 0, -5, 12, PALETTE.rustDark],
    [4, -1, 18, 12, PALETTE.woodMid]
  ]) {
    linePx(ctx, cx + root[0], cy + root[1], cx + root[2], cy + root[3], PALETTE.outline, 3);
    linePx(ctx, cx + root[0], cy + root[1], cx + root[2], cy + root[3], root[4], 1);
  }
  for (let i = 0; i < 4; i += 1) {
    const bx = cx - 10 + Math.floor(rng() * 19);
    linePx(ctx, bx, cy - 20, bx + jitter(rng, 6), cy - 4, PALETTE.outline, 2);
    linePx(ctx, bx, cy - 20, bx + jitter(rng, 6), cy - 4, i % 2 ? PALETTE.stoneDark : PALETTE.rustDark, 1);
  }
  // Half-pixel growth-ring cuts and bark fibres give the sawn face a finer
  // material read without widening the stump.
  nativeLinePx(ctx, cx - 8.5, topY + 1.5, cx - 4.5, topY + 0.5, PALETTE.woodLight);
  nativeLinePx(ctx, cx + 3.5, topY + 4.5, cx + 7.5, topY + 2.5, PALETTE.woodDark);
  nativeLinePx(ctx, cx - 6.5, cy - 19.5, cx - 5.5, cy - 10.5, PALETTE.stoneDust);
  nativePx(ctx, cx + 1.5, topY + 5.5, PALETTE.hostGold);
  // A road-prayer charm: two twigs lashed into a crooked cross, planted in
  // the dirt against the stump. Never a clean floating mark.
  px(ctx, cx + 15, cy + 3, PALETTE.void, 4, 1); // contact shadow
  px(ctx, cx + 15, cy - 8, PALETTE.outline, 3, 11);
  px(ctx, cx + 16, cy - 8, PALETTE.woodLight, 1, 10);
  px(ctx, cx + 12, cy - 5, PALETTE.outline, 8, 2);
  px(ctx, cx + 13, cy - 5, PALETTE.woodLight, 6, 1); // crossarm sits skewed
  px(ctx, cx + 15, cy - 5, PALETTE.clothTan, 2, 2); // the lash knot
  px(ctx, cx - 7, cy - 14, PALETTE.hostGold, 2, 2);
  px(ctx, cx + 9, cy - 8, PALETTE.hostBlack, 3, 2);
}

export function drawScrubBush(ctx, cx, cy, seed) {
  const rng = rngFrom(hash2D(seed + 11, seed * 7 + 3));
  px(ctx, cx - 19, cy - 9, PALETTE.outline, 38, 10);
  px(ctx, cx - 17, cy - 10, PALETTE.woodDark, 34, 8);
  px(ctx, cx - 12, cy - 12, PALETTE.rustDark, 23, 5);
  for (const mound of [
    [-24, -8, 18, 9, PALETTE.stoneDark],
    [-11, -14, 24, 12, PALETTE.woodDark],
    [8, -12, 22, 11, PALETTE.rustDark],
    [21, -7, 14, 8, PALETTE.stoneMid]
  ]) {
    leafClump(ctx, cx + mound[0] + Math.floor(mound[2] / 2), cy + mound[1] + Math.floor(mound[3] / 2), mound[2], mound[3], mound[4], mound[4] === PALETTE.stoneMid ? PALETTE.stoneDust : null);
  }
  for (let i = 0; i < 15; i += 1) {
    const dx = -18 + Math.floor(rng() * 37);
    const dy = -5 + Math.floor(rng() * 10);
    const h = 10 + Math.floor(rng() * 15);
    const tone = i % 3 === 0 ? PALETTE.stoneMid : i % 3 === 1 ? PALETTE.woodDark : PALETTE.rustDark;
    linePx(ctx, cx + dx, cy + dy, cx + dx + Math.floor((rng() - 0.5) * 8), cy + dy - h, PALETTE.outline, 2);
    linePx(ctx, cx + dx, cy + dy, cx + dx + Math.floor((rng() - 0.5) * 8), cy + dy - h, tone, 1);
  }
  for (let i = 0; i < 10; i += 1) {
    px(ctx, cx - 16 + Math.floor(rng() * 33), cy - 18 + Math.floor(rng() * 17), PALETTE.stoneDust, 2 + (i & 1), 1);
  }
  linePx(ctx, cx - 20, cy - 2, cx - 34, cy + 5, PALETTE.outline, 2);
  linePx(ctx, cx - 19, cy - 2, cx - 32, cy + 4, PALETTE.woodDark, 1);
  linePx(ctx, cx + 18, cy - 3, cx + 33, cy + 3, PALETTE.outline, 2);
  linePx(ctx, cx + 17, cy - 4, cx + 31, cy + 2, PALETTE.rustDark, 1);
  for (const [dx, dy] of [[-17, -14], [13, -18], [3, -6]]) {
    px(ctx, cx + dx, cy + dy, PALETTE.hostBlack, 3, 1);
    px(ctx, cx + dx + 1, cy + dy - 1, PALETTE.hostGold, 1, 1);
  }
  // A scrap of coat wool snagged on a stalk: someone pushed through here
  // rather than go around, and left part of themselves behind.
  px(ctx, cx + 12, cy - 14, PALETTE.clothDark, 3, 2);
  px(ctx, cx + 13, cy - 12, PALETTE.clothDark, 1, 2);
  px(ctx, cx + 12, cy - 14, PALETTE.stoneDark, 1, 1);
  // Lashed twig cross leaning into the bush, left by someone on the road.
  px(ctx, cx - 14, cy + 2, PALETTE.void, 4, 1);
  px(ctx, cx - 14, cy - 8, PALETTE.outline, 3, 10);
  px(ctx, cx - 13, cy - 8, PALETTE.woodLight, 1, 9);
  px(ctx, cx - 17, cy - 5, PALETTE.outline, 8, 2);
  px(ctx, cx - 16, cy - 5, PALETTE.woodLight, 6, 1);
  px(ctx, cx - 14, cy - 5, PALETTE.clothTan, 2, 2);
}

export function drawFallenAshLog(ctx, cx, cy, seed) {
  const rng = rngFrom(hash2D(seed + 83, seed * 13 + 29));
  const leftLean = seed % 2 === 0 ? -1 : 1;
  const x0 = cx - 27 + jitter(rng, 6);
  const y0 = cy + 3 + leftLean * 3 + jitter(rng, 4);
  const x1 = cx + 28 + jitter(rng, 6);
  const y1 = cy - 4 - leftLean * 3 + jitter(rng, 4);

  linePx(ctx, x0, y0, x1, y1, PALETTE.outline, 10);
  linePx(ctx, x0, y0 - 1, x1, y1 - 1, PALETTE.woodDark, 7);
  linePx(ctx, x0 - 1, y0 - 3, x1 - 1, y1 - 3, PALETTE.woodMid, 2);
  linePx(ctx, x0 + 2, y0 + 2, x1 + 2, y1 + 2, PALETTE.stoneDark, 2);
  px(ctx, cx - 8, cy - 6, PALETTE.outline, 16, 6);
  px(ctx, cx - 6, cy - 5, PALETTE.hostBlack, 12, 3);
  px(ctx, cx - 4, cy - 5, PALETTE.rustDark, 5, 1);
  for (let i = 0; i < 6; i += 1) {
    const t = 0.08 + i * 0.16;
    const bx = Math.round(x0 + (x1 - x0) * t);
    const by = Math.round(y0 + (y1 - y0) * t);
    linePx(ctx, bx - 2, by - 6, bx + 1, by + 4, PALETTE.outline, 2);
    linePx(ctx, bx - 2, by - 5, bx + 1, by + 3, i % 2 ? PALETTE.rustDark : PALETTE.stoneDark, 1);
  }

  for (let i = 0; i < 4; i += 1) {
    const t = 0.16 + i * 0.22 + rng() * 0.04;
    const bx = x0 + (x1 - x0) * t;
    const by = y0 + (y1 - y0) * t;
    const branch = i % 2 === 0 ? -1 : 1;
    linePx(ctx, bx, by, bx + branch * (8 + Math.floor(rng() * 8)), by - 7 - Math.floor(rng() * 5), PALETTE.outline, 3);
    linePx(ctx, bx, by, bx + branch * (7 + Math.floor(rng() * 7)), by - 6 - Math.floor(rng() * 5), PALETTE.stoneDark, 1);
  }

  px(ctx, x0 - 7, y0 - 5, PALETTE.outline, 11, 10);
  px(ctx, x0 - 5, y0 - 4, PALETTE.woodMid, 8, 7);
  px(ctx, x0 - 3, y0 - 3, PALETTE.rustDark, 4, 4);
  px(ctx, x0 - 2, y0 - 2, PALETTE.woodDark, 2, 2);
  px(ctx, x0 - 4, y0 - 5, PALETTE.stoneDust, 5, 1);
  px(ctx, x0 - 4, y0 + 1, PALETTE.woodDark, 5, 1);
  px(ctx, x1 - 2, y1 - 5, PALETTE.outline, 11, 10);
  px(ctx, x1, y1 - 4, PALETTE.woodMid, 7, 7);
  px(ctx, x1 + 2, y1 - 3, PALETTE.stoneDark, 3, 4);
  px(ctx, x1 + 3, y1 - 2, PALETTE.hostBlack, 2, 2);
  px(ctx, x1 + 1, y1 - 5, PALETTE.stoneDust, 5, 1);
  px(ctx, x1 + 1, y1 + 1, PALETTE.woodDark, 5, 1);

  for (let i = 0; i < 7; i += 1) {
    px(ctx, cx - 26 + Math.floor(rng() * 53), cy - 11 + Math.floor(rng() * 16), i % 2 ? PALETTE.stoneDust : PALETTE.hostBlack, 2, 1);
  }
  // Long grain follows the log axis. The bright upper-left fibre and the dark
  // lower split are both one native pixel wide.
  const grain = (t, offset) => [
    x0 + (x1 - x0) * t + 0.5,
    y0 + (y1 - y0) * t + offset + 0.5
  ];
  const grainA = grain(0.18, -2);
  const grainB = grain(0.48, -2);
  const splitA = grain(0.56, 1);
  const splitB = grain(0.84, 1);
  nativeLinePx(ctx, grainA[0], grainA[1], grainB[0], grainB[1], PALETTE.woodLight);
  nativeLinePx(ctx, splitA[0], splitA[1], splitB[0], splitB[1], PALETTE.hostBlack);
  for (const thorn of [
    [-18, -5, -31, -20],
    [6, -7, 15, -22],
    [22, -4, 36, -16]
  ]) {
    linePx(ctx, cx + thorn[0], cy + thorn[1], cx + thorn[2], cy + thorn[3], PALETTE.outline, 3);
    linePx(ctx, cx + thorn[0], cy + thorn[1], cx + thorn[2], cy + thorn[3], PALETTE.stoneDark, 1);
  }
  // Crooked twig cross wedged against the log.
  px(ctx, cx - 17, cy + 4, PALETTE.void, 4, 1);
  px(ctx, cx - 17, cy - 6, PALETTE.outline, 3, 10);
  px(ctx, cx - 16, cy - 6, PALETTE.woodLight, 1, 9);
  px(ctx, cx - 20, cy - 3, PALETTE.outline, 8, 2);
  px(ctx, cx - 19, cy - 3, PALETTE.woodLight, 6, 1);
  px(ctx, cx - 17, cy - 3, PALETTE.clothTan, 2, 2);
  px(ctx, cx + 9, cy - 10, PALETTE.hostGold, 2, 1);
  px(ctx, cx - 15, cy - 1, PALETTE.rustDark, 7, 1);
  // The sawn end face: growth rings and the same thin black-gold seep the
  // stumps carry. Whoever cut this log left it where it dropped.
  px(ctx, x1 - 3, y1 - 6, PALETTE.outline, 8, 10);
  px(ctx, x1 - 2, y1 - 5, PALETTE.woodMid, 6, 8);
  px(ctx, x1 - 1, y1 - 4, PALETTE.woodDark, 4, 6);
  px(ctx, x1, y1 - 3, PALETTE.rustDark, 2, 4);
  px(ctx, x1, y1 - 2, PALETTE.hostGold, 1, 2);
  px(ctx, x1 + 1, y1 + 1, PALETTE.hostBlack, 1, 1);
  nativeLinePx(ctx, x1 - 1.5, y1 - 4.5, x1 + 1, y1 - 2.5, PALETTE.woodLight);
  nativePx(ctx, x1 + 1.5, y1 - 1.5, PALETTE.hostGold);

}

export function drawAshSapling(ctx, cx, cy, seed) {
  const rng = rngFrom(hash2D(seed + 97, seed * 17 + 31));
  const lean = seed % 2 === 0 ? -3 : 3;
  const height = 36 + Math.floor(rng() * 18);
  linePx(ctx, cx, cy - 4, cx + lean, cy - height, PALETTE.outline, 4);
  linePx(ctx, cx - 1, cy - 5, cx + lean - 1, cy - height + 1, PALETTE.woodDark, 2);
  linePx(ctx, cx + 1, cy - 7, cx + lean + 1, cy - height + 3, PALETTE.woodMid, 1);
  for (const branch of [
    [-1, -14, -15, -31],
    [1, -20, 15, -38],
    [-1, -27, -10, -48],
    [1, -31, 18, -45]
  ]) {
    const bx = cx + branch[2] + Math.floor(rng() * 5);
    const by = cy + branch[3] - Math.floor(rng() * 4);
    linePx(ctx, cx + branch[0], cy + branch[1], bx, by, PALETTE.outline, 2);
    linePx(ctx, cx + branch[0], cy + branch[1], bx, by, PALETTE.stoneDark, 1);
  }
  // A fuller ragged crown: seven clumps so the sapling reads as a young dead
  // tree instead of a bare switch with lint on it.
  for (let i = 0; i < 7; i += 1) {
    const tone = i === 0 ? PALETTE.stoneMid : i === 1 ? PALETTE.rustDark : PALETTE.woodDark;
    leafClump(ctx, cx + lean + jitter(rng, 26), cy - height + 2 + i * 5 + jitter(rng, 7), 16 + Math.floor(rng() * 10), 9 + Math.floor(rng() * 6), tone, i % 2 === 1 ? PALETTE.stoneDust : null);
  }
  linePx(ctx, cx - 3, cy - 4, cx - 16, cy + 4, PALETTE.outline, 2);
  linePx(ctx, cx - 2, cy - 4, cx - 14, cy + 3, PALETTE.woodDark, 1);
  linePx(ctx, cx + 2, cy - 4, cx + 15, cy + 3, PALETTE.outline, 2);
  linePx(ctx, cx + 1, cy - 4, cx + 13, cy + 2, PALETTE.stoneDark, 1);
  px(ctx, cx - 4, cy - 2, PALETTE.outline, 9, 4);
  px(ctx, cx - 2, cy - 3, PALETTE.rustDark, 5, 2);
  px(ctx, cx + lean - 7, cy - height + 15, PALETTE.hostBlack, 3, 1);
  px(ctx, cx + lean + 6, cy - height + 26, PALETTE.hostGold, 2, 1);
  // A prayer charm tied to the trunk with a cord, not a mark in the sky.
  const charmY = cy - Math.floor(height * 0.45);
  px(ctx, cx - 2, charmY - 4, PALETTE.outline, 2, 8);
  px(ctx, cx - 1, charmY - 4, PALETTE.woodLight, 1, 7);
  px(ctx, cx - 4, charmY - 2, PALETTE.outline, 6, 2);
  px(ctx, cx - 3, charmY - 2, PALETTE.woodLight, 4, 1);
  px(ctx, cx - 2, charmY - 2, PALETTE.clothTan, 2, 2); // cord wrap at the joint
  px(ctx, cx - 3, charmY + 4, PALETTE.clothTan, 1, 1); // cord tail
}

export function drawWheatClump(ctx, cx, cy, seed, opts = {}) {
  const rng = rngFrom(hash2D(seed + 59, seed * 11 + 23));
  const full = opts.density !== 'thin';
  const count = full ? 20 : 12;
  const heightBase = full ? 23 : 18;


  // The whole clump shares one prevailing wind lean; dead grain combed the
  // same way is what makes a field read as weather-beaten instead of random.
  const wind = 2 + Math.floor(rng() * 4) * (rng() < 0.3 ? -1 : 1);
  for (let i = 0; i < count; i += 1) {
    const baseX = cx - 24 + Math.floor(rng() * 49);
    const baseY = cy - 6 + Math.floor(rng() * 13);
    const h = heightBase - 5 + Math.floor(rng() * 8);
    const lean = wind + Math.floor(rng() * 4) - 1;
    const tipX = baseX + Math.floor(lean * 0.8);
    const tipY = baseY - h;
    const mid = i % 4 === 0 ? PALETTE.clothTan : i % 4 === 1 ? PALETTE.woodLight : PALETTE.stoneDust;
    const shade = i % 3 === 0 ? PALETTE.woodDark : PALETTE.woodMid;

    if (i % 6 === 5) {
      // A snapped stalk: broken at two-thirds height, the head hanging.
      const bendY = baseY - Math.floor(h * 0.62);
      linePx(ctx, baseX, baseY, baseX + Math.floor(lean * 0.4), bendY, PALETTE.outline, 2);
      linePx(ctx, baseX, baseY, baseX + Math.floor(lean * 0.4), bendY, shade, 1);
      linePx(ctx, baseX + Math.floor(lean * 0.4), bendY, baseX + Math.floor(lean * 0.4) + 4, bendY + 4, shade, 1);
      const hgx = baseX + Math.floor(lean * 0.4) + 3;
      px(ctx, hgx, bendY + 3, PALETTE.outline, 2, 4); // the head hangs, drooping to a point
      px(ctx, hgx, bendY + 4, mid, 1, 3);
      px(ctx, hgx + 1, bendY + 6, shade, 1, 1);
      nativePx(ctx, baseX + Math.floor(lean * 0.4) + 0.5, bendY + 0.5, PALETTE.stoneDust);
      continue;
    }

    linePx(ctx, baseX, baseY, tipX, tipY, PALETTE.outline, 2);
    linePx(ctx, baseX, baseY, tipX, tipY, shade, 1);
    if (i % 2 === 0) linePx(ctx, baseX, baseY - 4, tipX, tipY + 2, mid, 1);
    if (i % 4 === 0) {
      nativeLinePx(ctx, baseX + 0.5, baseY - 2.5, tipX + 0.5, tipY + 3.5, mid);
    }

    // A heavy dead grain head: a narrow bristled spindle that noses over with
    // the wind and tapers to a point, not a square block. Fine awns splay off
    // the crown so a field of them reads as wheat rather than matchsticks.
    const nod = Math.sign(lean) || 1;
    const hx = tipX + nod; // the weight of the head carries it past the stalk tip
    px(ctx, hx - 1, tipY - 1, PALETTE.outline, 3, 6); // spindle silhouette
    px(ctx, hx, tipY, mid, 1, 4); // grain core, fuller toward the base
    px(ctx, hx - nod, tipY + 1, mid, 1, 3);
    px(ctx, hx, tipY - 2, shade, 1, 1); // shaded, tapering crown
    px(ctx, hx + nod, tipY - 1, i % 5 === 0 ? PALETTE.hostGold : mid, 1, 1); // awn
    px(ctx, hx - nod, tipY, shade, 1, 1); // awn on the lee side
    if (i % 3 === 0) {
      nativeLinePx(ctx, hx + 0.5, tipY + 0.5, hx + nod * 3.5, tipY - 1.5, mid);
      nativeLinePx(ctx, hx - 0.5, tipY + 1.5, hx - nod * 2.5, tipY + 0.5, shade);
    }
    if (i % 5 === 0) px(ctx, hx, tipY - 4, PALETTE.hostGold, 1, 2); // Host-touched grain
  }

  for (const band of [
    [-20, -7, 17],
    [-2, -9, 21],
    [12, -6, 18]
  ]) {
    linePx(ctx, cx + band[0], cy + band[1], cx + band[0] + band[2], cy + band[1] + 4, PALETTE.outline, 2);
    linePx(ctx, cx + band[0] + 1, cy + band[1], cx + band[0] + band[2], cy + band[1] + 3, PALETTE.rustDark, 1);
  }
  for (let i = 0; i < (full ? 14 : 8); i += 1) {
    const x = cx - 22 + Math.floor(rng() * 45);
    const y = cy - 4 + Math.floor(rng() * 11);
    const w = 3 + Math.floor(rng() * 6);
    px(ctx, x, y, i % 2 ? PALETTE.woodDark : PALETTE.rustDark, w, 1);
  }
  px(ctx, cx - 23, cy + 1, PALETTE.outline, full ? 46 : 34, 2);
  px(ctx, cx - 20, cy, PALETTE.rustDark, full ? 40 : 28, 1);
  for (let i = 0; i < (full ? 8 : 5); i += 1) {
    const x = cx - 20 + Math.floor(rng() * 41);
    const y = cy - 24 + Math.floor(rng() * 12);
    px(ctx, x, y, i % 2 ? PALETTE.hostBone : PALETTE.clothTan, 1, 2);
  }
  px(ctx, cx - 8, cy - 27, PALETTE.hostBlack, 2, 2);
  px(ctx, cx + 9, cy - 23, PALETTE.hostGold, 1, 1);
}
