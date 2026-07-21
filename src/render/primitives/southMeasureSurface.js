// Surface-only architecture and street furniture for Ash Road South.
// These pieces describe South Measure's civil waterworks, freight economy,
// century-old household lanes, and organized receiving edge. They deliberately
// do not borrow the portable military-camp kit used at Censure Road Camp.

import { PALETTE } from '../palette.js';
import { TILE_HEIGHT, TILE_WIDTH } from '../renderConfig.js';
import {
  diamond,
  drawIsoDiamond,
  drawIsoPrism,
  drawNoisePixels,
  hash2D,
  isoFrame,
  linePx,
  nativeLinePx,
  nativePx,
  orientedBox,
  poly,
  px,
  rngFrom
} from './basePixels.js';

const WORK_RESPONSE_ANCHORS = Object.freeze({
  'south-measure-notice-board': { x: 0, y: -45 },
  'south-measure-return-stall': { x: 0, y: -27 },
  'south-measure-repair-rack': { x: 0, y: -22 },
  'public-tap-stand': { x: -13, y: -25 },
  'wash-wall': { x: 0, y: -18 },
  'south-measure-settling-vat': { x: 0, y: -21 },
  'fixed-hoist': { x: 0, y: -39 },
  'freight-scale': { x: 0, y: -19 },
  'south-measure-hand-pump': { x: -25, y: -18 },
  'south-measure-water-vessels': { x: 0, y: -15 },
  'laundry-line': { x: 0, y: -35 },
  'south-measure-sample-burner': { x: 0, y: -20 }
});

// Flat handled matter unique to South Measure. These small records, grit
// piles, fasteners, and service stains sit around real work nodes rather than
// borrowing the generic road and camp decal kit.
export function drawSouthMeasureTallyScraps(ctx, cx, cy, seed) {
  const rng = rngFrom(hash2D(seed + 317, seed * 3 + 29));
  const marks = [
    { x: -12, y: -2, w: 11, h: 7 },
    { x: 1, y: 2, w: 9, h: 6 },
    { x: -3, y: -8, w: 7, h: 5 }
  ];
  for (const [index, mark] of marks.entries()) {
    const shift = Math.floor(rng() * 3) - 1;
    px(ctx, cx + mark.x + shift + 1, cy + mark.y + 2, PALETTE.outline, mark.w, mark.h);
    px(ctx, cx + mark.x + shift, cy + mark.y, PALETTE.limeLight, mark.w, mark.h);
    px(ctx, cx + mark.x + shift + 1, cy + mark.y + 1, PALETTE.stoneDust, mark.w - 2, 1);
    linePx(
      ctx,
      cx + mark.x + shift + 2,
      cy + mark.y + 3,
      cx + mark.x + shift + mark.w - 2,
      cy + mark.y + 3 + (index & 1),
      PALETTE.clayDark,
      1
    );
  }
  linePx(ctx, cx - 14, cy + 7, cx + 10, cy + 10, PALETTE.outline, 2);
  nativeLinePx(ctx, cx - 13.5, cy + 6.5, cx + 9.5, cy + 9.5, PALETTE.clothBlueDark);
  nativePx(ctx, cx + 11.5, cy + 9.5, PALETTE.clayLight);
}

export function drawSouthMeasureWorkGrit(ctx, cx, cy, seed) {
  const rng = rngFrom(hash2D(seed + 353, seed * 5 + 41));
  linePx(ctx, cx - 17, cy + 5, cx + 16, cy - 3, PALETTE.ironDark, 2);
  nativeLinePx(ctx, cx - 15.5, cy + 4.5, cx + 14.5, cy - 2.5, PALETTE.ironLight);
  for (let index = 0; index < 16; index += 1) {
    const x = cx - 20 + Math.floor(rng() * 41);
    const y = cy - 8 + Math.floor(rng() * 18);
    const size = rng() > 0.76 ? 2 : 1;
    px(ctx, x + 1, y + 1, PALETTE.outline, size + 1, size);
    px(ctx, x, y, index % 4 === 0 ? PALETTE.clayLight : PALETTE.limeDark, size, size);
  }
  px(ctx, cx + 6, cy + 6, PALETTE.outline, 6, 3);
  px(ctx, cx + 7, cy + 6, PALETTE.ironMid, 4, 1);
}

export function drawSouthMeasureServiceStain(ctx, cx, cy, seed, opts = {}) {
  const rng = rngFrom(hash2D(seed + 389, seed * 7 + 53));
  const colors = opts.variant === 'mineral'
    ? [PALETTE.clothBlueDark, PALETTE.ironMid, PALETTE.limeLight]
    : opts.variant === 'lye'
      ? [PALETTE.limeDark, PALETTE.limeMid, PALETTE.stoneDust]
      : [PALETTE.outline, PALETTE.ironDark, PALETTE.clayDark];
  const bands = [22, 17, 12, 7];
  for (const [index, width] of bands.entries()) {
    const y = cy - 4 + index * 3;
    const offset = Math.floor(rng() * 5) - 2;
    px(ctx, cx - Math.floor(width / 2) + offset, y, colors[Math.min(index, colors.length - 1)], width, 2);
  }
  for (let index = 0; index < 12; index += 1) {
    const x = cx - 16 + Math.floor(rng() * 33);
    const y = cy - 9 + Math.floor(rng() * 21);
    nativePx(ctx, x + 0.5, y + 0.5, colors[index % colors.length]);
  }
  linePx(ctx, cx - 9, cy - 7, cx + 12, cy + 7, colors[1], 1);
}

// A live, hard-pixel response attached to an existing work prop. The base prop
// remains cacheable; only this small state layer changes while an NPC works.
export function drawSouthMeasureWorkResponse(ctx, cx, cy, seed, opts = {}) {
  const activity = opts.activity;
  if (!activity || activity.response === 'none') return;
  const anchor = WORK_RESPONSE_ANCHORS[opts.kind] ?? { x: 0, y: -20 };
  const orientSign = opts.orient === 'sw' || opts.orient === 'nw' ? -1 : 1;
  const phase = Math.max(0, Math.floor(activity.frame ?? 0));
  const x = cx + anchor.x * orientSign;
  const y = cy + anchor.y;

  if (activity.response === 'paper') {
    const twitch = phase & 1 ? 1 : 0;
    px(ctx, x - 6, y - 4 - twitch, PALETTE.outline, 13, 9);
    px(ctx, x - 5, y - 4 - twitch, PALETTE.stoneDust, 11, 7);
    linePx(ctx, x - 3, y - 2 - twitch, x + 3, y - 1 - twitch, PALETTE.woodDark, 1);
    linePx(ctx, x - 2, y + 1 - twitch, x + 4, y + 2 - twitch, PALETTE.rustDark, 1);
    nativePx(ctx, x + 4.5, y - 2.5 - twitch, PALETTE.stoneLight);
    return;
  }

  if (activity.response === 'water') {
    const drop = phase % 4;
    linePx(ctx, x, y, x + orientSign * 2, y + 5 + drop, PALETTE.clothBlueDark, 2);
    nativeLinePx(ctx, x - 0.5, y + 0.5, x + orientSign * 1.5, y + 4.5 + drop, PALETTE.clothBlue);
    px(ctx, x - 4 + orientSign * drop, y + 9 + drop, PALETTE.clothBlueDark, 3, 2);
    return;
  }

  if (activity.response === 'tools') {
    const shift = [0, 2, 4, 3, 1, 0][phase % 6];
    linePx(ctx, x - orientSign * 5, y + 3, x + orientSign * (5 + shift), y - 3, PALETTE.outline, 3);
    linePx(ctx, x - orientSign * 4, y + 2, x + orientSign * (4 + shift), y - 4, PALETTE.ironLight, 1);
    px(ctx, x + orientSign * (4 + shift), y - 6, PALETTE.rustLight, 3, 3);
    return;
  }

  if (activity.response === 'hoist') {
    const travel = [0, 2, 5, 8, 7, 4, 1, 0][phase % 8];
    linePx(ctx, x, y - 8, x, y + 5 + travel, PALETTE.outline, 3);
    nativeLinePx(ctx, x - 0.5, y - 7.5, x - 0.5, y + 4.5 + travel, PALETTE.ironLight);
    linePx(ctx, x, y + 4 + travel, x + orientSign * 5, y + 8 + travel, PALETTE.ironMid, 2);
    return;
  }

  if (activity.response === 'scale') {
    const swing = [-4, -2, 1, 4, 2, 0, -2, -3][phase % 8];
    px(ctx, x - 7, y - 7, PALETTE.outline, 15, 10);
    px(ctx, x - 6, y - 6, PALETTE.limeDark, 13, 8);
    linePx(ctx, x, y + 1, x + swing, y - 5, PALETTE.rustLight, 2);
    nativePx(ctx, x - 0.5, y + 0.5, PALETTE.hostGold);
    return;
  }

  if (activity.response === 'load') {
    const settle = phase % 4 === 2 ? -2 : 0;
    px(ctx, x - 8 + settle, y - 5, PALETTE.outline, 17, 10);
    px(ctx, x - 7 + settle, y - 5, PALETTE.woodMid, 15, 8);
    px(ctx, x - 6 + settle, y - 4, PALETTE.woodLight, 12, 1);
    linePx(ctx, x - 2 + settle, y - 5, x + 2 + settle, y + 3, PALETTE.rustDark, 2);
    return;
  }

  if (activity.response === 'cloth') {
    const lift = phase & 1 ? -2 : 1;
    poly(ctx, PALETTE.outline, [
      [x - 8, y - 4], [x + 7, y - 3 + lift], [x + 5, y + 6 + lift], [x - 7, y + 5]
    ]);
    poly(ctx, (seed + phase) & 1 ? PALETTE.clothTan : PALETTE.clothBlueDark, [
      [x - 6, y - 3], [x + 5, y - 2 + lift], [x + 3, y + 4 + lift], [x - 5, y + 3]
    ]);
    nativeLinePx(ctx, x - 4.5, y - 2.5, x + 3.5, y - 1.5 + lift, PALETTE.stoneDust);
    return;
  }

  if (activity.response === 'flame') {
    const high = phase & 1;
    px(ctx, x - 3, y - 4 - high * 3, PALETTE.rustDark, 7, 8 + high * 3);
    px(ctx, x - 2, y - 3 - high * 3, PALETTE.ember, 5, 6 + high * 2);
    px(ctx, x, y - 2 - high * 3, PALETTE.flash, 2, 3 + high);
  }
}

export function drawSouthMeasureBermBlock(ctx, cx, cy, seed, opts = {}) {
  const connected = opts.connected ?? {};
  const rng = rngFrom(hash2D(seed + 701, seed * 5 + 13));
  const exposesLeftFace = !connected.yPlus;
  const exposesRightFace = !connected.xPlus;

  // Connected cells form one retired intake embankment. Only exposed faces
  // receive a wall and outline, removing the old grid of identical prisms that
  // made the outskirts look like square blocks bolted together.
  const cap = diamond(cx, cy - 17, TILE_WIDTH, TILE_HEIGHT);
  const base = diamond(cx, cy + 2, TILE_WIDTH, TILE_HEIGHT);
  if (exposesLeftFace) {
    poly(ctx, PALETTE.outline, [cap.left, cap.bottom, base.bottom, base.left]);
    poly(ctx, PALETTE.clayDark, [
      [cap.left[0] + 2, cap.left[1] + 1], [cap.bottom[0], cap.bottom[1] + 2],
      [base.bottom[0], base.bottom[1] - 2], [base.left[0] + 2, base.left[1] - 1]
    ]);
  }
  if (exposesRightFace) {
    poly(ctx, PALETTE.outline, [cap.bottom, cap.right, base.right, base.bottom]);
    poly(ctx, PALETTE.ironDark, [
      [cap.bottom[0], cap.bottom[1] + 2], [cap.right[0] - 2, cap.right[1] + 1],
      [base.right[0] - 2, base.right[1] - 1], [base.bottom[0], base.bottom[1] - 2]
    ]);
  }

  drawIsoDiamond(ctx, cx, cy - 17, TILE_WIDTH, TILE_HEIGHT, PALETTE.limeDark);

  // Quiet aggregate repairs cross the cap without tracing its logical cell.
  if (seed % 11 === 0) {
    const patchX = cx - 12 + Math.floor(rng() * 25);
    const patchY = cy - 20 + Math.floor(rng() * 8);
    const patchW = 14 + Math.floor(rng() * 14);
    drawIsoDiamond(ctx, patchX, patchY, patchW, 5 + (seed & 3), seed & 4 ? PALETTE.stoneDark : PALETTE.clayDark);
    nativeLinePx(ctx, patchX - patchW / 4 + 0.5, patchY - 1.5, patchX + 0.5, patchY - 3.5, seed & 4 ? PALETTE.limeMid : PALETTE.clayMid);
  }

  if (!connected.xMinus) linePx(ctx, cap.left[0] + 1, cap.left[1] - 1, cap.top[0], cap.top[1] + 1, PALETTE.limeLight, 1);
  if (!connected.yMinus) linePx(ctx, cap.top[0], cap.top[1] + 1, cap.right[0] - 1, cap.right[1] - 1, PALETTE.limeMid, 1);
  if (exposesLeftFace) linePx(ctx, cap.left[0], cap.left[1], cap.bottom[0], cap.bottom[1], PALETTE.clayMid, 2);
  if (exposesRightFace) linePx(ctx, cap.bottom[0], cap.bottom[1], cap.right[0], cap.right[1], PALETTE.outline, 2);

  // Broken intake pipe mouths make the perimeter read as retired drainage
  // infrastructure rather than a generic forest wall.
  if (seed % 7 === 0 && exposesLeftFace) {
    drawIsoDiamond(ctx, cx - 12, cy - 2, 26, 10, PALETTE.outline);
    drawIsoDiamond(ctx, cx - 12, cy - 3, 19, 7, PALETTE.ironMid);
    drawIsoDiamond(ctx, cx - 13, cy - 4, 13, 4, PALETTE.void);
    nativeLinePx(ctx, cx - 18.5, cy - 5.5, cx - 12.5, cy - 7.5, PALETTE.ironLight);
    if ((seed & 1) === 0) nativeLinePx(ctx, cx - 15.5, cy - 2.5, cx - 8.5, cy - 0.5, PALETTE.clothBlueDark);
  }

  for (let i = 0; i < 6; i += 1) {
    const gritY = cy - 26 + Math.floor(rng() * 17);
    const halfSpan = Math.max(4, Math.floor((TILE_WIDTH / 2 - 5) * (1 - Math.abs(gritY - (cy - 17)) / (TILE_HEIGHT / 2))));
    const gritX = cx - halfSpan + Math.floor(rng() * Math.max(1, halfSpan * 2));
    const color = i % 3 === 0 ? PALETTE.limeMid : i % 3 === 1 ? PALETTE.clayMid : PALETTE.ironMid;
    nativePx(ctx, gritX + 0.5, gritY + 0.5, color, i & 1 ? 1.5 : 1, 1);
  }
  nativePx(ctx, cx - 13.5 + (seed & 7), cy - 20.5 + ((seed >>> 3) & 3), PALETTE.limeMid);

  if (seed % 17 === 0) {
    const startX = cx - 18 + Math.floor(rng() * 8);
    const startY = cy - 17 + Math.floor(rng() * 5);
    const middleX = startX + 11 + Math.floor(rng() * 7);
    const middleY = startY - 4 + Math.floor(rng() * 8);
    const endX = middleX + 8 + Math.floor(rng() * 6);
    const endY = middleY - 2 + Math.floor(rng() * 6);
    nativeLinePx(ctx, startX + 0.5, startY + 0.5, middleX + 0.5, middleY + 0.5, PALETTE.ironDark);
    nativeLinePx(ctx, middleX + 0.5, middleY + 0.5, endX + 0.5, endY + 0.5, PALETTE.clayDark);
    nativePx(ctx, startX + 1.5, startY - 0.5, PALETTE.limeMid);
  }

  // Sparse broken reinforcement emerges only on the outside face. Unequal
  // height and angle keep the skyline from reverting to a fence of spikes.
  if (seed % 19 === 0 && (exposesLeftFace || exposesRightFace)) {
    const rootX = cx + (exposesLeftFace ? -19 : 18);
    const rootY = cy - 6;
    const lean = seed & 1 ? -5 : 4;
    linePx(ctx, rootX, rootY, rootX + lean, rootY - 23, PALETTE.outline, 5);
    nativeLinePx(ctx, rootX - 0.5, rootY - 1.5, rootX + lean - 0.5, rootY - 21.5, PALETTE.ironLight);
    linePx(ctx, rootX + lean - 4, rootY - 19, rootX + lean + 5, rootY - 22, PALETTE.clayMid, 2);
  }
}

export function drawMeasureBoundaryFence(ctx, cx, cy, seed, opts = {}) {
  const frame = isoFrame(cx, cy, opts.orient ?? 'se');
  const rng = rngFrom(hash2D(seed + 719, seed * 7 + 17));
  const left = frame.point(-0.48, 0, 0);
  const right = frame.point(0.48, 0, 0);
  const posts = [left, right].map((foot, index) => ({
    foot,
    top: [
      foot[0] + (index === 0 ? -2 : 2) + Math.floor(rng() * 3) - 1,
      foot[1] - 45 + Math.floor(rng() * 4)
    ]
  }));
  for (const [index, post] of posts.entries()) {
    drawIsoPrism(ctx, post.foot[0], post.foot[1] + 1, 12, 7, 8, {
      top: PALETTE.stoneDust,
      left: PALETTE.stoneMid,
      right: PALETTE.stoneDark,
      outline: PALETTE.outline
    });
    linePx(ctx, post.foot[0], post.foot[1] - 4, post.top[0], post.top[1], PALETTE.outline, 7);
    linePx(ctx, post.foot[0] - 1, post.foot[1] - 6, post.top[0] - 1, post.top[1] + 2, index ? PALETTE.rustDark : PALETTE.rustMid, 3);
    nativeLinePx(ctx, post.foot[0] - 1.5, post.foot[1] - 8.5, post.top[0] - 1.5, post.top[1] + 4.5, PALETTE.rustLight);
    linePx(ctx, post.top[0] - 4, post.top[1], post.top[0] + 4, post.top[1], PALETTE.outline, 4);
    linePx(ctx, post.top[0] - 2, post.top[1] - 1, post.top[0] + 2, post.top[1] - 1, PALETTE.stoneDust, 1);
  }

  // The perimeter was assembled from retired intake hardware. Periodic
  // braces and punched depth plates keep long runs from reading as one cloned
  // wire-fence sprite while preserving a continuous civic boundary.
  if ((seed & 3) === 1) {
    const braceFoot = frame.point(seed & 8 ? -0.3 : 0.3, 0.22, 0);
    const braceTop = seed & 8 ? posts[0].top : posts[1].top;
    linePx(ctx, braceFoot[0], braceFoot[1], braceTop[0], braceTop[1] + 19, PALETTE.outline, 6);
    linePx(ctx, braceFoot[0] - 1, braceFoot[1] - 2, braceTop[0] - 1, braceTop[1] + 20, PALETTE.ironMid, 2);
    nativeLinePx(ctx, braceFoot[0] - 1.5, braceFoot[1] - 3.5, braceTop[0] - 1.5, braceTop[1] + 19.5, PALETTE.ironLight);
  }
  if (seed % 11 === 0) {
    const gauge = frame.point(-0.43, 0, 28);
    poly(ctx, PALETTE.outline, [
      [gauge[0] - 8, gauge[1] - 13], [gauge[0] + 5, gauge[1] - 11],
      [gauge[0] + 6, gauge[1] + 13], [gauge[0] - 7, gauge[1] + 11]
    ]);
    poly(ctx, PALETTE.limeMid, [
      [gauge[0] - 5, gauge[1] - 10], [gauge[0] + 2, gauge[1] - 9],
      [gauge[0] + 3, gauge[1] + 10], [gauge[0] - 4, gauge[1] + 8]
    ]);
    for (const lift of [-6, -1, 4]) {
      linePx(ctx, gauge[0] - 3, gauge[1] + lift, gauge[0] + 1, gauge[1] + lift, PALETTE.stoneDust, 1);
    }
    px(ctx, gauge[0] - 3, gauge[1] + 7, PALETTE.clothBlueMid, 5, 2);
  }

  // Three sagging cable runs make a boundary rather than a row of identical
  // clamp bars. Seeded missing wire and crooked droppers break repeated runs.
  for (const [index, lift] of [14, 27, 39].entries()) {
    if (index === 1 && seed % 7 === 0) continue;
    const a = [posts[0].foot[0], posts[0].foot[1] - lift];
    const b = [posts[1].foot[0], posts[1].foot[1] - lift + (index === 2 ? -1 : 1)];
    const mid = [
      Math.round((a[0] + b[0]) / 2),
      Math.round((a[1] + b[1]) / 2) + 3 + ((seed + index) & 1)
    ];
    linePx(ctx, a[0], a[1], mid[0], mid[1], PALETTE.outline, 3);
    linePx(ctx, mid[0], mid[1], b[0], b[1], PALETTE.outline, 3);
    nativeLinePx(ctx, a[0] + 1.5, a[1] - 1.5, mid[0], mid[1] - 1.5, index === 2 ? PALETTE.stoneDust : PALETTE.rustLight);
    nativeLinePx(ctx, mid[0], mid[1] - 1.5, b[0] - 1.5, b[1] - 1.5, index === 2 ? PALETTE.stoneDust : PALETTE.rustLight);
  }

  for (const [index, t] of [0.28, 0.61].entries()) {
    if ((seed + index) % 5 === 0) continue;
    const lowerA = frame.point(-0.48 + 0.96 * t, 0, 0);
    const topY = Math.round(posts[0].foot[1] - 37 + (posts[1].foot[1] - posts[0].foot[1]) * t);
    const bottomY = Math.round(posts[0].foot[1] - 15 + (posts[1].foot[1] - posts[0].foot[1]) * t);
    linePx(ctx, lowerA[0] + (index ? 1 : -1), topY, lowerA[0], bottomY, PALETTE.outline, 2);
    nativeLinePx(ctx, lowerA[0] + 0.5, topY + 1.5, lowerA[0] + 0.5, bottomY - 1.5, PALETTE.rustMid);
  }

  if (seed % 3 === 0) {
    const tag = frame.point(0.17, 0, 29);
    linePx(ctx, tag[0], tag[1] - 6, tag[0] + 2, tag[1], PALETTE.outline, 2);
    poly(ctx, PALETTE.outline, [
      [tag[0] - 4, tag[1]], [tag[0] + 6, tag[1] + 1],
      [tag[0] + 5, tag[1] + 11], [tag[0] - 3, tag[1] + 9]
    ]);
    poly(ctx, PALETTE.clothTan, [
      [tag[0] - 2, tag[1] + 2], [tag[0] + 4, tag[1] + 3],
      [tag[0] + 3, tag[1] + 9], [tag[0] - 1, tag[1] + 7]
    ]);
    nativeLinePx(ctx, tag[0] - 0.5, tag[1] + 4.5, tag[0] + 2.5, tag[1] + 5.5, PALETTE.stoneDark);
  }
}

export function drawSouthMeasureReceivingShelter(ctx, cx, cy, seed, opts = {}) {
  const frame = isoFrame(cx, cy, opts.orient ?? 'se');
  const sideA = frame.point(0, 0.42, 0);
  const sideB = frame.point(0, -0.42, 0);
  const nearLb = sideA[1] > sideB[1] ? 0.42 : -0.42;
  const farLb = -nearLb;

  // A ragged back curtain gives shelter without sealing the piece into a box.
  const curtain = [
    frame.point(-0.56, farLb * 0.82, 55), frame.point(0.56, farLb * 0.82, 55),
    frame.point(0.55, farLb * 0.82, 12), frame.point(0.35, farLb * 0.82, 8),
    frame.point(0.13, farLb * 0.82, 13), frame.point(-0.08, farLb * 0.82, 9),
    frame.point(-0.31, farLb * 0.82, 14), frame.point(-0.56, farLb * 0.82, 10)
  ];
  poly(ctx, PALETTE.outline, curtain);
  const curtainInner = [
    frame.point(-0.51, farLb * 0.81, 52), frame.point(0.51, farLb * 0.81, 52),
    frame.point(0.5, farLb * 0.81, 15), frame.point(0.34, farLb * 0.81, 11),
    frame.point(0.13, farLb * 0.81, 16), frame.point(-0.08, farLb * 0.81, 12),
    frame.point(-0.3, farLb * 0.81, 17), frame.point(-0.51, farLb * 0.81, 13)
  ];
  poly(ctx, seed & 1 ? PALETTE.clothDark : PALETTE.woodDark, curtainInner);
  for (const t of [-0.31, -0.04, 0.25]) {
    const a = frame.point(t, farLb * 0.8, 49);
    const b = frame.point(t + ((seed + Math.round(t * 10)) & 1 ? 0.03 : -0.02), farLb * 0.8, 15);
    nativeLinePx(ctx, a[0], a[1], b[0], b[1], t < 0 ? PALETTE.clothTan : PALETTE.rustDark);
  }
  const patch = frame.point(seed & 1 ? -0.25 : 0.26, farLb * 0.83, 31);
  poly(ctx, PALETTE.outline, [
    [patch[0] - 8, patch[1] - 6], [patch[0] + 8, patch[1] - 7],
    [patch[0] + 7, patch[1] + 5], [patch[0] - 7, patch[1] + 6]
  ]);
  poly(ctx, seed & 2 ? PALETTE.clothRed : PALETTE.clothTan, [
    [patch[0] - 6, patch[1] - 4], [patch[0] + 6, patch[1] - 5],
    [patch[0] + 5, patch[1] + 3], [patch[0] - 5, patch[1] + 4]
  ]);

  const postSpecs = [
    [-0.62, farLb * 0.86, 64], [0.62, farLb * 0.86, 64],
    [seed & 1 ? -0.62 : 0.62, nearLb * 0.86, 52]
  ];
  for (const [index, [la, lb, height]] of postSpecs.entries()) {
    const foot = frame.point(la, lb, 0);
    const top = frame.point(la + (index === 2 ? (seed & 2 ? 0.04 : -0.04) : 0), lb, height);
    linePx(ctx, foot[0], foot[1], top[0], top[1], PALETTE.outline, 7);
    linePx(ctx, foot[0] - 1, foot[1] - 2, top[0] - 1, top[1] + 1, index === 1 ? PALETTE.rustDark : PALETTE.woodMid, 3);
    nativeLinePx(ctx, foot[0] - 1.5, foot[1] - 5.5, top[0] - 1.5, top[1] + 3.5, index === 1 ? PALETTE.rustMid : PALETTE.woodLight);
  }

  // A real waiting bench with daylight under it replaces the old solid counter.
  const benchCenter = frame.point(0, nearLb * 0.18, 0);
  const benchFrame = isoFrame(benchCenter[0], benchCenter[1], opts.orient ?? 'se');
  const bench = orientedBox(ctx, benchFrame, 1.03, 0.24, 4, {
    top: PALETTE.woodLight,
    lit: PALETTE.woodMid,
    shade: PALETTE.woodDark,
    outline: PALETTE.outline
  }, 17);
  for (const la of [-0.4, 0.4]) {
    const foot = frame.point(la, nearLb * 0.18, 0);
    const seat = frame.point(la, nearLb * 0.18, 17);
    linePx(ctx, foot[0], foot[1], seat[0], seat[1], PALETTE.outline, 5);
    linePx(ctx, foot[0] - 1, foot[1] - 1, seat[0] - 1, seat[1] + 1, PALETTE.woodDark, 2);
  }
  for (const height of [30, 40]) {
    const a = frame.point(-0.47, farLb * 0.28, height);
    const b = frame.point(0.47, farLb * 0.28, height);
    linePx(ctx, a[0], a[1], b[0], b[1], PALETTE.outline, 5);
    linePx(ctx, a[0] + 1, a[1] - 2, b[0] - 1, b[1] - 2, height > 35 ? PALETTE.woodLight : PALETTE.woodMid, 2);
  }

  const farLeft = frame.point(-0.76, farLb, 66);
  const farRight = frame.point(0.76, farLb, 66);
  const nearRight = frame.point(0.76, nearLb, 53);
  const nearNotchA = frame.point(0.2, nearLb, 51);
  const nearNotchB = frame.point(0.04, nearLb, 54);
  const nearLeft = frame.point(-0.76, nearLb, 53);
  poly(ctx, PALETTE.outline, [farLeft, farRight, nearRight, nearNotchA, nearNotchB, nearLeft]);
  poly(ctx, PALETTE.rustDark, [
    frame.point(-0.71, farLb * 0.92, 66), frame.point(0.71, farLb * 0.92, 66),
    frame.point(0.7, nearLb * 0.92, 55), frame.point(0.19, nearLb * 0.92, 53),
    frame.point(0.04, nearLb * 0.92, 56), frame.point(-0.7, nearLb * 0.92, 55)
  ]);
  for (const t of [-0.47, -0.18, 0.12, 0.43]) {
    const a = frame.point(t, farLb * 0.9, 67);
    const b = frame.point(t, nearLb * 0.9, 55);
    linePx(ctx, a[0], a[1], b[0], b[1], t < 0 ? PALETTE.rustLight : PALETTE.outline, 2);
  }

  const tally = frame.point(-0.48, nearLb * 0.84, 37);
  poly(ctx, PALETTE.outline, [
    [tally[0] - 7, tally[1] - 9], [tally[0] + 7, tally[1] - 8],
    [tally[0] + 6, tally[1] + 5], [tally[0] - 6, tally[1] + 6]
  ]);
  poly(ctx, PALETTE.stoneMid, [
    [tally[0] - 5, tally[1] - 7], [tally[0] + 5, tally[1] - 6],
    [tally[0] + 4, tally[1] + 3], [tally[0] - 4, tally[1] + 4]
  ]);
  for (let row = 0; row < 3; row += 1) nativeLinePx(ctx, tally[0] - 3.5, tally[1] - 4.5 + row * 3, tally[0] + 2.5 - row, tally[1] - 4.5 + row * 3, PALETTE.clothTan);
  nativeLinePx(ctx, bench.cap.left[0] + 1.5, bench.cap.left[1] - 0.5, bench.cap.top[0] - 1.5, bench.cap.top[1] + 0.5, PALETTE.woodLight);
}

export function drawSouthMeasureCharityCanopy(ctx, cx, cy, seed, opts = {}) {
  const orient = opts.orient ?? 'se';
  const frame = isoFrame(cx, cy, orient);
  const sideA = frame.point(0, 0.4, 0);
  const sideB = frame.point(0, -0.4, 0);
  const nearLb = sideA[1] > sideB[1] ? 0.4 : -0.4;
  const farLb = -nearLb;

  const postSpecs = [
    [-0.72, farLb, 66], [0.72, farLb, 66],
    [-0.72, nearLb, 58], [0.72, nearLb, 58]
  ];
  const drawPost = ([la, lb, height], lit) => {
    const foot = frame.point(la, lb, 0);
    const top = frame.point(la, lb, height);
    linePx(ctx, foot[0], foot[1], top[0], top[1], PALETTE.outline, 6);
    linePx(ctx, foot[0] - 1, foot[1] - 2, top[0] - 1, top[1] + 2, PALETTE.woodDark, 2);
    if (lit) nativeLinePx(ctx, foot[0] - 1.5, foot[1] - 4.5, top[0] - 1.5, top[1] + 3.5, PALETTE.woodLight);
    drawIsoDiamond(ctx, foot[0], foot[1] + 2, 13, 6, PALETTE.outline);
    drawIsoDiamond(ctx, foot[0] - 1, foot[1] + 1, 8, 3, PALETTE.stoneMid);
  };

  // Rear posts and a single short privacy curtain establish the frame while
  // leaving most of the shelter visibly open.
  drawPost(postSpecs[0], true);
  drawPost(postSpecs[1], false);
  poly(ctx, PALETTE.outline, [
    frame.point(-0.66, farLb, 55), frame.point(-0.18, farLb, 55),
    frame.point(-0.2, farLb, 25), frame.point(-0.65, farLb, 22)
  ]);
  poly(ctx, seed & 1 ? PALETTE.clothTan : PALETTE.stoneDust, [
    frame.point(-0.62, farLb, 52), frame.point(-0.22, farLb, 52),
    frame.point(-0.24, farLb, 28), frame.point(-0.61, farLb, 25)
  ]);
  const curtainSeamA = frame.point(-0.43, farLb, 50);
  const curtainSeamB = frame.point(-0.45, farLb, 27);
  nativeLinePx(ctx, curtainSeamA[0], curtainSeamA[1], curtainSeamB[0], curtainSeamB[1], PALETTE.clothDark);

  // A narrow cot has daylight beneath it and remains clearly separate from
  // the canopy structure.
  const cotAnchor = frame.point(-0.18, 0.04, 0);
  const cotFrame = isoFrame(cotAnchor[0], cotAnchor[1], orient);
  const cot = orientedBox(ctx, cotFrame, 0.88, 0.31, 5, {
    top: PALETTE.clothTan,
    lit: PALETTE.stoneDust,
    shade: PALETTE.clothDark,
    outline: PALETTE.outline
  }, 11);
  for (const [la, lb] of [[-0.38, -0.11], [0.38, -0.11], [-0.38, 0.11], [0.38, 0.11]]) {
    const top = cotFrame.point(la, lb, 11);
    const foot = cotFrame.point(la, lb, 0);
    linePx(ctx, top[0], top[1], foot[0], foot[1], PALETTE.outline, 3);
    nativeLinePx(ctx, top[0] - 0.5, top[1] + 0.5, foot[0] - 0.5, foot[1] - 1.5, PALETTE.woodMid);
  }
  const pillow = frame.point(-0.47, 0.03, 18);
  drawIsoDiamond(ctx, pillow[0], pillow[1], 20, 8, PALETTE.outline);
  drawIsoDiamond(ctx, pillow[0] - 1, pillow[1] - 1, 15, 5, PALETTE.hostBone);
  nativeLinePx(ctx, cot.cap.left[0] + 1.5, cot.cap.left[1] - 0.5, cot.cap.top[0] - 1.5, cot.cap.top[1] + 0.5, PALETTE.hostBone);

  // Offset wash bowl on a three-legged stand keeps the treatment bay legible.
  const basin = frame.point(0.5, 0.08, 23);
  for (const [dx, dy] of [[-8, 17], [7, 18], [0, 21]]) {
    linePx(ctx, basin[0], basin[1] + 1, basin[0] + dx, basin[1] + dy, PALETTE.outline, 3);
    nativeLinePx(ctx, basin[0] - 0.5, basin[1] + 2.5, basin[0] + dx - 0.5, basin[1] + dy - 1.5, PALETTE.rustMid);
  }
  drawIsoDiamond(ctx, basin[0], basin[1], 32, 12, PALETTE.outline);
  drawIsoDiamond(ctx, basin[0] - 1, basin[1] - 1, 25, 8, PALETTE.clothBlueDark);
  nativeLinePx(ctx, basin[0] - 9.5, basin[1] - 3.5, basin[0] - 2.5, basin[1] - 5.5, PALETTE.clothBlue);

  // Near posts remain slender, so the cot and bowl do not merge into a chair.
  drawPost(postSpecs[2], true);
  drawPost(postSpecs[3], false);

  // One broad patched roof is the canopy's dominant read. A torn notch and
  // shed slope keep it handmade without reducing it to clamped rectangles.
  const roofOuter = [
    frame.point(-0.79, farLb - 0.04, 69), frame.point(0.79, farLb - 0.04, 69),
    frame.point(0.79, nearLb + 0.04, 59), frame.point(0.24, nearLb + 0.04, 59),
    frame.point(0.17, nearLb + 0.04, 54), frame.point(0.08, nearLb + 0.04, 59),
    frame.point(-0.79, nearLb + 0.04, 59)
  ];
  poly(ctx, PALETTE.outline, roofOuter);
  poly(ctx, seed & 1 ? PALETTE.clothTan : PALETTE.rustDark, [
    frame.point(-0.73, farLb, 68), frame.point(0.73, farLb, 68),
    frame.point(0.72, nearLb, 60), frame.point(0.25, nearLb, 60),
    frame.point(0.17, nearLb, 56), frame.point(0.09, nearLb, 60),
    frame.point(-0.72, nearLb, 60)
  ]);
  for (const la of [-0.5, -0.16, 0.47]) {
    const far = frame.point(la, farLb * 0.92, 69);
    const near = frame.point(la, nearLb * 0.92, 60);
    linePx(ctx, far[0], far[1], near[0], near[1], PALETTE.outline, 2);
    nativeLinePx(ctx, far[0] - 0.5, far[1] + 0.5, near[0] - 0.5, near[1] + 0.5, la < 0 ? PALETTE.rustLight : PALETTE.clothDark);
  }
  poly(ctx, PALETTE.outline, [
    frame.point(-0.4, -0.02, 69), frame.point(-0.03, -0.02, 67),
    frame.point(-0.02, 0.2, 63), frame.point(-0.38, 0.19, 65)
  ]);
  poly(ctx, PALETTE.clothRed, [
    frame.point(-0.36, 0, 69), frame.point(-0.06, 0, 67),
    frame.point(-0.06, 0.16, 64), frame.point(-0.34, 0.15, 66)
  ]);

  // A soft header bag hangs from one corner and feeds the bowl by hose.
  const bagTop = frame.point(0.57, nearLb, 58);
  linePx(ctx, bagTop[0], bagTop[1], bagTop[0] - 1, bagTop[1] + 9, PALETTE.outline, 2);
  poly(ctx, PALETTE.outline, [
    [bagTop[0] - 7, bagTop[1] + 8], [bagTop[0] + 6, bagTop[1] + 8],
    [bagTop[0] + 9, bagTop[1] + 15], [bagTop[0] + 6, bagTop[1] + 27],
    [bagTop[0], bagTop[1] + 31], [bagTop[0] - 7, bagTop[1] + 26],
    [bagTop[0] - 9, bagTop[1] + 15]
  ]);
  poly(ctx, PALETTE.clothBlue, [
    [bagTop[0] - 4, bagTop[1] + 11], [bagTop[0] + 4, bagTop[1] + 11],
    [bagTop[0] + 6, bagTop[1] + 16], [bagTop[0] + 4, bagTop[1] + 24],
    [bagTop[0], bagTop[1] + 27], [bagTop[0] - 4, bagTop[1] + 23],
    [bagTop[0] - 6, bagTop[1] + 16]
  ]);
  nativeLinePx(ctx, bagTop[0] - 3.5, bagTop[1] + 12.5, bagTop[0] - 3.5, bagTop[1] + 21.5, PALETTE.stoneDust);
  const hoseStart = [bagTop[0] + 2, bagTop[1] + 29];
  const hoseMid = frame.point(0.6, nearLb * 0.7, 25);
  linePx(ctx, hoseStart[0], hoseStart[1], hoseMid[0], hoseMid[1], PALETTE.outline, 4);
  linePx(ctx, hoseMid[0], hoseMid[1], basin[0] + 7, basin[1] - 3, PALETTE.outline, 4);
  nativeLinePx(ctx, hoseStart[0] - 0.5, hoseStart[1] + 0.5, hoseMid[0] - 0.5, hoseMid[1] - 0.5, PALETTE.clothBlueDark);

  // Bandage rolls rest on one open rear rail rather than a solid cabinet.
  const shelfA = frame.point(-0.25, farLb, 36);
  const shelfB = frame.point(0.18, farLb, 36);
  linePx(ctx, shelfA[0], shelfA[1], shelfB[0], shelfB[1], PALETTE.outline, 5);
  linePx(ctx, shelfA[0] + 1, shelfA[1] - 1, shelfB[0] - 1, shelfB[1] - 1, PALETTE.woodLight, 1);
  for (const [index, la] of [-0.16, -0.01, 0.13].entries()) {
    const roll = frame.point(la, farLb, 40);
    px(ctx, roll[0] - 4, roll[1] - 4, PALETTE.outline, 9, 6);
    px(ctx, roll[0] - 3, roll[1] - 4, index === 1 ? PALETTE.clothRed : PALETTE.hostBone, 7, 4);
    nativePx(ctx, roll[0] - 0.5, roll[1] - 3.5, PALETTE.stoneMid);
  }

  const drainA = frame.point(0.47, 0.13, 1);
  const drainB = frame.point(0.83, 0.25, 0);
  linePx(ctx, drainA[0], drainA[1], drainB[0], drainB[1], PALETTE.outline, 7);
  linePx(ctx, drainA[0] - 1, drainA[1] - 2, drainB[0] - 1, drainB[1] - 2, PALETTE.clothBlueDark, 3);
}

export function drawSouthMeasureArrivalHearth(ctx, cx, cy, seed, flicker = 0) {
  const pulse = Math.round(Math.max(-1, Math.min(1, flicker)) * 2);

  // Separate stones form a low communal fire ring. The gaps and uneven sizes
  // keep it from reading as another equipment crate.
  drawIsoDiamond(ctx, cx, cy + 1, 49, 20, PALETTE.outline);
  drawIsoDiamond(ctx, cx, cy, 39, 15, PALETTE.stoneDark);
  drawIsoDiamond(ctx, cx - 1, cy - 1, 29, 10, PALETTE.void);
  for (const [index, [dx, dy, w]] of [
    [-19, 0, 12], [-13, -6, 13], [-2, -9, 14], [11, -6, 13],
    [19, 0, 12], [12, 6, 14], [0, 8, 15], [-13, 6, 13]
  ].entries()) {
    drawIsoDiamond(ctx, cx + dx, cy + dy, w, 6, PALETTE.outline);
    drawIsoDiamond(ctx, cx + dx - 1, cy + dy - 1, w - 4, 3, index < 4 ? PALETTE.stoneDust : PALETTE.stoneMid);
    if (index === (seed & 7)) nativePx(ctx, cx + dx - 1.5, cy + dy - 1.5, PALETTE.stoneLight);
  }
  linePx(ctx, cx - 13, cy + 1, cx + 13, cy - 7, PALETTE.outline, 6);
  linePx(ctx, cx - 11, cy - 1, cx + 11, cy - 8, PALETTE.woodMid, 3);
  linePx(ctx, cx - 11, cy - 8, cx + 12, cy + 1, PALETTE.outline, 6);
  linePx(ctx, cx - 9, cy - 9, cx + 10, cy - 1, PALETTE.rustLight, 2);
  poly(ctx, PALETTE.rustDark, [
    [cx - 8, cy - 7], [cx - 4, cy - 20 - pulse], [cx, cy - 14],
    [cx + 4, cy - 25 - pulse], [cx + 9, cy - 7]
  ]);
  poly(ctx, PALETTE.ember, [
    [cx - 5, cy - 8], [cx - 2, cy - 17 - pulse], [cx + 1, cy - 13],
    [cx + 4, cy - 20 - pulse], [cx + 6, cy - 8]
  ]);
  poly(ctx, PALETTE.hostGold, [
    [cx - 2, cy - 9], [cx, cy - 15 - pulse], [cx + 3, cy - 9]
  ]);

  // A crooked cooking tripod and a hanging kettle explain why these fires
  // stand in a numbered arrival row.
  const apex = [cx + 1, cy - 58];
  const feet = [[cx - 25, cy + 5], [cx + 24, cy + 5], [cx + 12, cy - 10]];
  for (const [index, foot] of feet.entries()) {
    linePx(ctx, foot[0], foot[1], apex[0] + (index === 2 ? 2 : 0), apex[1] + (index === 1 ? 2 : 0), PALETTE.outline, 5);
    linePx(ctx, foot[0] + (index === 0 ? 1 : -1), foot[1] - 2, apex[0] + (index === 2 ? 1 : -1), apex[1] + 3, index === 0 ? PALETTE.rustLight : PALETTE.rustDark, 2);
  }
  linePx(ctx, apex[0] - 5, apex[1], apex[0] + 6, apex[1], PALETTE.outline, 4);
  linePx(ctx, apex[0], apex[1] + 3, apex[0], cy - 34, PALETTE.outline, 2);
  nativeLinePx(ctx, apex[0] + 0.5, apex[1] + 4.5, apex[0] + 0.5, cy - 34.5, PALETTE.rustLight);
  poly(ctx, PALETTE.outline, [
    [cx - 9, cy - 34], [cx + 9, cy - 34], [cx + 11, cy - 29],
    [cx + 8, cy - 19], [cx + 4, cy - 16], [cx - 5, cy - 16],
    [cx - 9, cy - 20], [cx - 11, cy - 29]
  ]);
  poly(ctx, PALETTE.ironDark, [
    [cx - 7, cy - 32], [cx + 7, cy - 32], [cx + 8, cy - 28],
    [cx + 6, cy - 20], [cx + 3, cy - 18], [cx - 4, cy - 18],
    [cx - 7, cy - 21], [cx - 8, cy - 28]
  ]);
  px(ctx, cx - 6, cy - 30, PALETTE.stoneDust, 3, 9);
  drawIsoDiamond(ctx, cx, cy - 34, 18, 6, PALETTE.outline);
  drawIsoDiamond(ctx, cx - 1, cy - 35, 13, 3, PALETTE.stoneMid);
  nativePx(ctx, cx - 1.5, cy - 14.5 - pulse, PALETTE.hostBone);
}

export function drawSouthMeasureSleepingPallet(ctx, cx, cy, seed, opts = {}) {
  const frame = isoFrame(cx, cy, opts.orient ?? 'se');
  for (const la of [-0.4, 0.4]) {
    for (const lb of [-0.17, 0.17]) {
      const foot = frame.point(la, lb, 1);
      drawIsoPrism(ctx, foot[0], foot[1], 9, 5, 5, {
        top: PALETTE.stoneDust,
        left: PALETTE.stoneMid,
        right: PALETTE.stoneDark,
        outline: PALETTE.outline
      });
    }
  }
  orientedBox(ctx, frame, 0.91, 0.42, 8, {
    top: seed & 1 ? PALETTE.clothDark : PALETTE.woodMid,
    lit: PALETTE.clothTan,
    shade: PALETTE.woodDark,
    outline: PALETTE.outline
  }, 5);
  for (const la of [-0.28, -0.05, 0.18, 0.39]) {
    const a = frame.point(la, -0.17, 15);
    const b = frame.point(la, 0.17, 15);
    linePx(ctx, a[0], a[1], b[0], b[1], la < 0 ? PALETTE.stoneDust : PALETTE.rustDark, 1);
  }
  const pillow = frame.point(-0.31, 0, 17);
  drawIsoDiamond(ctx, pillow[0], pillow[1], 20, 8, PALETTE.outline);
  drawIsoDiamond(ctx, pillow[0] - 1, pillow[1] - 1, 16, 6, PALETTE.hostBone);
  const token = frame.point(0.28, 0.09, 17);
  px(ctx, token[0] - 3, token[1] - 2, PALETTE.outline, 7, 5);
  px(ctx, token[0] - 2, token[1] - 2, PALETTE.clothRed, 5, 3);
  nativePx(ctx, pillow[0] - 4.5, pillow[1] - 1.5, PALETTE.stoneLight);
}

export function drawSouthMeasureHandPump(ctx, cx, cy, seed) {
  if ((seed & 3) !== 0) {
    // Mineral-dark spill beneath the spout ties the pump to years of use. Its
    // broken outline and tiny blue remnant keep it from reading as a glow.
    poly(ctx, PALETTE.limeDark, [
      [cx - 45, cy - 2], [cx - 36, cy - 9], [cx - 20, cy - 7],
      [cx - 11, cy - 1], [cx - 19, cy + 6], [cx - 36, cy + 5]
    ]);
    poly(ctx, PALETTE.ironDark, [
      [cx - 39, cy - 2], [cx - 33, cy - 6], [cx - 22, cy - 5],
      [cx - 16, cy - 1], [cx - 22, cy + 3], [cx - 34, cy + 2]
    ]);
    nativeLinePx(ctx, cx - 34.5, cy - 4.5, cx - 24.5, cy - 4.5, PALETTE.clothBlue);
  }
  drawIsoPrism(ctx, cx, cy + 2, 34, 16, 8, {
    top: PALETTE.limeLight,
    left: PALETTE.limeMid,
    right: PALETTE.limeDark,
    outline: PALETTE.outline
  });

  // A cast pump body with shoulders and a narrow neck replaces the old tall
  // box. The handle, pivot, and falling spout own the silhouette.
  poly(ctx, PALETTE.outline, [
    [cx - 6, cy - 55], [cx + 6, cy - 55],
    [cx + 10, cy - 49], [cx + 11, cy - 20],
    [cx + 8, cy - 9], [cx + 5, cy - 6],
    [cx - 7, cy - 6], [cx - 10, cy - 10],
    [cx - 11, cy - 20], [cx - 10, cy - 49]
  ]);
  poly(ctx, PALETTE.ironMid, [
    [cx - 5, cy - 52], [cx + 5, cy - 52],
    [cx + 7, cy - 47], [cx + 8, cy - 21],
    [cx + 5, cy - 10], [cx - 5, cy - 10],
    [cx - 7, cy - 21], [cx - 7, cy - 47]
  ]);
  linePx(ctx, cx - 7, cy - 46, cx - 7, cy - 14, PALETTE.ironLight, 3);
  linePx(ctx, cx + 6, cy - 44, cx + 6, cy - 15, PALETTE.ironDark, 3);
  drawIsoDiamond(ctx, cx, cy - 55, 17, 7, PALETTE.outline);
  drawIsoDiamond(ctx, cx - 1, cy - 56, 12, 4, PALETTE.stoneDust);
  for (const bandY of [cy - 44, cy - 17]) {
    linePx(ctx, cx - 10, bandY, cx + 10, bandY, PALETTE.outline, 3);
    linePx(ctx, cx - 8, bandY - 2, cx + 8, bandY - 2, PALETTE.clayLight, 1);
  }

  const pivot = [cx + 1, cy - 48];
  poly(ctx, PALETTE.outline, [
    [pivot[0] - 6, pivot[1] - 5], [pivot[0] + 6, pivot[1] - 5],
    [pivot[0] + 8, pivot[1]], [pivot[0] + 6, pivot[1] + 6],
    [pivot[0] - 6, pivot[1] + 6], [pivot[0] - 8, pivot[1]]
  ]);
  px(ctx, pivot[0] - 3, pivot[1] - 2, PALETTE.stoneDark, 7, 7);
  nativePx(ctx, pivot[0] - 0.5, pivot[1] - 0.5, PALETTE.ironLight);
  const handleEnd = [cx + 31, cy - 67];
  linePx(ctx, pivot[0], pivot[1] - 2, handleEnd[0], handleEnd[1], PALETTE.outline, 4);
  linePx(ctx, pivot[0] + 1, pivot[1] - 4, handleEnd[0] - 1, handleEnd[1] - 1, PALETTE.clayLight, 2);
  linePx(ctx, handleEnd[0] - 4, handleEnd[1] - 2, handleEnd[0] + 8, handleEnd[1] + 7, PALETTE.outline, 5);
  linePx(ctx, handleEnd[0] - 2, handleEnd[1] - 3, handleEnd[0] + 7, handleEnd[1] + 4, PALETTE.woodLight, 2);

  const spoutRoot = [cx - 7, cy - 36];
  const spoutElbow = [cx - 22, cy - 28];
  const spoutMouth = [cx - 27, cy - 18];
  linePx(ctx, spoutRoot[0], spoutRoot[1], spoutElbow[0], spoutElbow[1], PALETTE.outline, 6);
  linePx(ctx, spoutRoot[0] - 1, spoutRoot[1] - 2, spoutElbow[0] - 1, spoutElbow[1] - 2, PALETTE.stoneDust, 3);
  linePx(ctx, spoutElbow[0], spoutElbow[1], spoutMouth[0], spoutMouth[1], PALETTE.outline, 5);
  linePx(ctx, spoutElbow[0] - 1, spoutElbow[1] - 1, spoutMouth[0] - 1, spoutMouth[1] - 1, PALETTE.ironLight, 2);
  drawIsoDiamond(ctx, spoutMouth[0], spoutMouth[1], 10, 5, PALETTE.outline);
  drawIsoDiamond(ctx, spoutMouth[0], spoutMouth[1], 6, 3, PALETTE.void);
  px(ctx, spoutMouth[0] - 1, spoutMouth[1] + 4, PALETTE.clothBlue, 3, 4 + (seed & 1));

  // The buried relief union stays small and low. It supports the pump instead
  // of becoming a second, chair-sized valve glyph.
  linePx(ctx, cx + 7, cy - 13, cx + 24, cy - 7, PALETTE.outline, 5);
  linePx(ctx, cx + 8, cy - 14, cx + 23, cy - 9, PALETTE.ironMid, 2);
  nativeLinePx(ctx, cx + 9.5, cy - 15.5, cx + 21.5, cy - 11.5, PALETTE.ironLight);
  px(ctx, cx + 20, cy - 15, PALETTE.outline, 7, 12);
  px(ctx, cx + 22, cy - 14, PALETTE.ironDark, 3, 9);

  const plate = [cx - 1, cy - 31];
  poly(ctx, PALETTE.outline, [
    [plate[0] - 5, plate[1] - 7], [plate[0] + 5, plate[1] - 6],
    [plate[0] + 4, plate[1] + 7], [plate[0] - 5, plate[1] + 6]
  ]);
  poly(ctx, PALETTE.stoneDark, [
    [plate[0] - 3, plate[1] - 5], [plate[0] + 3, plate[1] - 4],
    [plate[0] + 2, plate[1] + 5], [plate[0] - 3, plate[1] + 4]
  ]);
  for (let row = 0; row < 3; row += 1) nativeLinePx(ctx, plate[0] - 1.5, plate[1] - 2.5 + row * 3, plate[0] + 1.5, plate[1] - 2.5 + row * 3, row === ((seed >>> 1) % 3) ? PALETTE.hostGold : PALETTE.ironLight);

  // A battered catch bucket closes the spout-to-ground relationship. It also
  // gives the pump an immediate human scale in the crowded yard.
  linePx(ctx, cx - 35, cy - 9, cx - 29, cy - 18, PALETTE.outline, 2);
  linePx(ctx, cx - 29, cy - 18, cx - 21, cy - 9, PALETTE.outline, 2);
  nativeLinePx(ctx, cx - 34.5, cy - 9.5, cx - 28.5, cy - 17.5, PALETTE.rustLight);
  poly(ctx, PALETTE.outline, [
    [cx - 37, cy - 10], [cx - 19, cy - 10],
    [cx - 22, cy + 2], [cx - 33, cy + 2]
  ]);
  poly(ctx, PALETTE.stoneDark, [
    [cx - 34, cy - 8], [cx - 22, cy - 8],
    [cx - 24, cy], [cx - 31, cy]
  ]);
  linePx(ctx, cx - 34, cy - 6, cx - 32, cy, PALETTE.stoneDust, 2);
  drawIsoDiamond(ctx, cx - 28, cy - 10, 18, 7, PALETTE.outline);
  drawIsoDiamond(ctx, cx - 28, cy - 10, 13, 4, PALETTE.clothBlueDark);
  nativeLinePx(ctx, cx - 32.5, cy - 11.5, cx - 26.5, cy - 10.5, PALETTE.clothBlue);
  nativeLinePx(ctx, cx - 5.5, cy - 50.5, cx - 5.5, cy - 16.5, PALETTE.ironLight);
}

function drawSouthMeasureCask(ctx, point, spec = {}) {
  const width = spec.width ?? 24;
  const height = spec.height ?? 31;
  const half = Math.floor(width / 2);
  const top = point[1] - height;
  const light = spec.light ?? PALETTE.woodLight;
  const mid = spec.mid ?? PALETTE.woodMid;
  const shade = spec.shade ?? PALETTE.woodDark;
  for (let row = 0; row <= height; row += 1) {
    const edge = row < 5 ? 5 - row : row > height - 5 ? row - (height - 5) : 0;
    const rowHalf = Math.max(6, half - Math.ceil(edge * 0.7));
    const y = top + row;
    px(ctx, point[0] - rowHalf - 2, y, PALETTE.outline, rowHalf * 2 + 4, 1);
    px(ctx, point[0] - rowHalf, y, mid, rowHalf, 1);
    px(ctx, point[0], y, shade, rowHalf, 1);
    if (row > 2 && row < height - 3) nativePx(ctx, point[0] - rowHalf + 1.5, y + 0.5, light);
  }
  for (const y of [top + 8, point[1] - 8]) {
    linePx(ctx, point[0] - half, y, point[0] + half, y, PALETTE.outline, 4);
    nativeLinePx(ctx, point[0] - half + 1.5, y - 1.5, point[0] + half - 1.5, y - 1.5, PALETTE.rustLight);
  }
  drawIsoDiamond(ctx, point[0], top, Math.max(13, width - 5), 6, PALETTE.outline);
  drawIsoDiamond(ctx, point[0] - 1, top - 1, Math.max(9, width - 10), 3, shade);
  nativePx(ctx, point[0] - 2.5, top - 0.5, PALETTE.stoneDust);
}

function drawSouthMeasureLiddedJar(ctx, point, spec = {}) {
  const width = spec.width ?? 20;
  const height = spec.height ?? 29;
  const half = Math.floor(width / 2);
  const top = point[1] - height;
  poly(ctx, PALETTE.outline, [
    [point[0] - 5, top], [point[0] + 5, top],
    [point[0] + 7, top + 5], [point[0] + half, top + 10],
    [point[0] + half - 1, point[1] - 5], [point[0] + half - 5, point[1]],
    [point[0] - half + 5, point[1]], [point[0] - half, point[1] - 5],
    [point[0] - half + 1, top + 10], [point[0] - 7, top + 5]
  ]);
  poly(ctx, spec.mid ?? PALETTE.limeMid, [
    [point[0] - 4, top + 2], [point[0] + 4, top + 2],
    [point[0] + 5, top + 6], [point[0] + half - 3, top + 11],
    [point[0] + half - 3, point[1] - 6], [point[0] + half - 6, point[1] - 2],
    [point[0] - half + 6, point[1] - 2], [point[0] - half + 3, point[1] - 6],
    [point[0] - half + 4, top + 11], [point[0] - 5, top + 6]
  ]);
  linePx(ctx, point[0] - half + 4, top + 11, point[0] - half + 5, point[1] - 6, spec.light ?? PALETTE.limeLight, 2);
  linePx(ctx, point[0] + half - 5, top + 11, point[0] + half - 5, point[1] - 6, spec.shade ?? PALETTE.limeDark, 2);
  linePx(ctx, point[0] - half + 2, top + 15, point[0] + half - 2, top + 15, PALETTE.outline, 4);
  nativeLinePx(ctx, point[0] - half + 4.5, top + 13.5, point[0] + half - 4.5, top + 13.5, PALETTE.clothTan);
  drawIsoDiamond(ctx, point[0], top, 15, 6, PALETTE.outline);
  drawIsoDiamond(ctx, point[0] - 1, top - 1, 10, 3, spec.lid ?? PALETTE.hostBone);
}

export function drawSouthMeasureWaterVessels(ctx, cx, cy, seed, opts = {}) {
  const frame = isoFrame(cx, cy, opts.orient ?? 'se');
  const variant = opts.variant ?? 'household';
  if (variant === 'trough') {
    const shell = orientedBox(ctx, frame, 1.18, 0.55, 13, {
      top: PALETTE.limeLight,
      lit: PALETTE.limeMid,
      shade: PALETTE.limeDark,
      outline: PALETTE.outline
    });
    poly(ctx, PALETTE.outline, [
      frame.point(-0.48, -0.18, 14), frame.point(0.48, -0.18, 14),
      frame.point(0.48, 0.18, 14), frame.point(-0.48, 0.18, 14)
    ]);
    poly(ctx, PALETTE.clothBlueDark, [
      frame.point(-0.4, -0.11, 15), frame.point(0.4, -0.11, 15),
      frame.point(0.4, 0.11, 15), frame.point(-0.4, 0.11, 15)
    ]);
    const glintA = frame.point(-0.32, -0.07, 15.5);
    const glintB = frame.point(0.12, -0.07, 15.5);
    nativeLinePx(ctx, glintA[0], glintA[1], glintB[0], glintB[1], PALETTE.clothBlue);

    const riserFoot = frame.point(-0.48, -0.2, 10);
    const riserTop = frame.point(-0.48, -0.2, 38);
    const spout = frame.point(-0.31, -0.2, 31);
    linePx(ctx, riserFoot[0], riserFoot[1], riserTop[0], riserTop[1], PALETTE.outline, 8);
    linePx(ctx, riserFoot[0] - 1, riserFoot[1] - 1, riserTop[0] - 1, riserTop[1] + 1, PALETTE.clothBlueDark, 4);
    linePx(ctx, riserTop[0], riserTop[1], spout[0], spout[1], PALETTE.outline, 7);
    linePx(ctx, riserTop[0] - 1, riserTop[1] - 1, spout[0] - 1, spout[1] - 1, PALETTE.clothBlue, 3);
    px(ctx, spout[0] - 2, spout[1], PALETTE.outline, 5, 10);
    px(ctx, spout[0], spout[1] + 1, PALETTE.rustLight, 2, 7);
    linePx(ctx, riserTop[0] - 5, riserTop[1] + 5, riserTop[0] + 5, riserTop[1] + 5, PALETTE.outline, 3);

    const tether = frame.point(0.5, 0.22, 5);
    linePx(ctx, tether[0], tether[1] - 9, tether[0] + 12, tether[1] + 3, PALETTE.outline, 2);
    nativeLinePx(ctx, tether[0] + 0.5, tether[1] - 8.5, tether[0] + 11.5, tether[1] + 2.5, PALETTE.rustLight);
    const cup = [tether[0] + 15, tether[1] + 4];
    poly(ctx, PALETTE.outline, [
      [cup[0] - 6, cup[1] - 9], [cup[0] + 6, cup[1] - 9],
      [cup[0] + 4, cup[1]], [cup[0] - 4, cup[1]]
    ]);
    poly(ctx, PALETTE.rustDark, [
      [cup[0] - 4, cup[1] - 7], [cup[0] + 4, cup[1] - 7],
      [cup[0] + 2, cup[1] - 2], [cup[0] - 2, cup[1] - 2]
    ]);
    nativeLinePx(ctx, shell.cap.left[0] + 1.5, shell.cap.left[1] - 0.5, shell.cap.top[0] - 1.5, shell.cap.top[1] + 0.5, PALETTE.stoneLight);
    return;
  }

  if (variant === 'freight') {
    const skid = orientedBox(ctx, frame, 1.12, 0.58, 5, {
      top: PALETTE.woodMid,
      lit: PALETTE.woodLight,
      shade: PALETTE.woodDark,
      outline: PALETTE.outline
    });
    drawSouthMeasureCask(ctx, frame.point(-0.28, 0.04, 7), {
      width: 25, height: 34, light: PALETTE.ironLight,
      mid: PALETTE.ironMid, shade: PALETTE.ironDark
    });
    drawSouthMeasureCask(ctx, frame.point(0.27, -0.04, 7), {
      width: 27, height: 30, light: PALETTE.clayLight,
      mid: PALETTE.clayMid, shade: PALETTE.clayDark
    });
    const hoseA = frame.point(-0.14, 0.27, 18);
    const hoseB = frame.point(0.36, 0.3, 6);
    linePx(ctx, hoseA[0], hoseA[1], hoseB[0], hoseB[1], PALETTE.outline, 4);
    nativeLinePx(ctx, hoseA[0] + 0.5, hoseA[1] - 1.5, hoseB[0] - 0.5, hoseB[1] - 1.5, PALETTE.clothBlueDark);
    nativeLinePx(ctx, skid.cap.left[0] + 1.5, skid.cap.left[1] - 0.5, skid.cap.top[0] - 1.5, skid.cap.top[1] + 0.5, PALETTE.woodLight);
    return;
  }

  if (variant === 'clinic') {
    const tray = orientedBox(ctx, frame, 0.9, 0.46, 5, {
      top: PALETTE.limeLight,
      lit: PALETTE.limeMid,
      shade: PALETTE.limeDark,
      outline: PALETTE.outline
    });
    drawSouthMeasureLiddedJar(ctx, frame.point(-0.25, 0.06, 6), {
      width: 21, height: 31, mid: PALETTE.stoneMid,
      light: PALETTE.stoneLight, shade: PALETTE.stoneDark,
      lid: PALETTE.hostBone
    });
    drawSouthMeasureLiddedJar(ctx, frame.point(0.2, -0.08, 6), {
      width: 19, height: 27, mid: PALETTE.limeMid,
      light: PALETTE.limeLight, shade: PALETTE.limeDark,
      lid: PALETTE.clothTan
    });
    const basin = frame.point(0.31, 0.22, 7);
    drawIsoDiamond(ctx, basin[0], basin[1], 24, 9, PALETTE.outline);
    drawIsoDiamond(ctx, basin[0] - 1, basin[1] - 1, 18, 6, PALETTE.stoneDust);
    drawIsoDiamond(ctx, basin[0] - 1, basin[1] - 2, 11, 3, PALETTE.clothBlueDark);
    const seal = frame.point(-0.02, 0.24, 12);
    px(ctx, seal[0] - 4, seal[1] - 3, PALETTE.outline, 9, 7);
    px(ctx, seal[0] - 2, seal[1] - 2, PALETTE.clothRed, 5, 4);
    nativePx(ctx, seal[0] - 0.5, seal[1] - 1.5, PALETTE.hostBone);
    nativeLinePx(ctx, tray.cap.left[0] + 1.5, tray.cap.left[1] - 0.5, tray.cap.top[0] - 1.5, tray.cap.top[1] + 0.5, PALETTE.limeLight);
    return;
  }

  // Household vessels remain hand-carried and mismatched: a handled crock,
  // a low bucket, and a repaired family jar rather than three industrial cans.
  const crock = frame.point(-0.32, 0.16, 0);
  poly(ctx, PALETTE.outline, [
    [crock[0] - 8, crock[1]], [crock[0] - 10, crock[1] - 20],
    [crock[0] - 5, crock[1] - 28], [crock[0] + 5, crock[1] - 28],
    [crock[0] + 10, crock[1] - 20], [crock[0] + 8, crock[1]]
  ]);
  poly(ctx, PALETTE.clayMid, [
    [crock[0] - 6, crock[1] - 2], [crock[0] - 8, crock[1] - 19],
    [crock[0] - 4, crock[1] - 26], [crock[0] + 4, crock[1] - 26],
    [crock[0] + 8, crock[1] - 19], [crock[0] + 6, crock[1] - 2]
  ]);
  px(ctx, crock[0] - 5, crock[1] - 24, PALETTE.clayLight, 3, 18);
  px(ctx, crock[0] + 4, crock[1] - 21, PALETTE.clayDark, 3, 17);
  linePx(ctx, crock[0] - 8, crock[1] - 21, crock[0] - 16, crock[1] - 18, PALETTE.outline, 3);
  linePx(ctx, crock[0] - 16, crock[1] - 18, crock[0] - 12, crock[1] - 7, PALETTE.outline, 3);
  linePx(ctx, crock[0] - 7, crock[1] - 22, crock[0] - 14, crock[1] - 18, PALETTE.rustLight, 1);
  drawIsoDiamond(ctx, crock[0], crock[1] - 28, 13, 5, PALETTE.outline);
  drawIsoDiamond(ctx, crock[0] - 1, crock[1] - 29, 8, 3, PALETTE.clothBlueDark);

  const bucket = frame.point(0.08, 0.08, 0);
  poly(ctx, PALETTE.outline, [
    [bucket[0] - 11, bucket[1] - 19], [bucket[0] + 11, bucket[1] - 19],
    [bucket[0] + 8, bucket[1]], [bucket[0] - 8, bucket[1]]
  ]);
  poly(ctx, PALETTE.ironMid, [
    [bucket[0] - 8, bucket[1] - 17], [bucket[0] + 8, bucket[1] - 17],
    [bucket[0] + 6, bucket[1] - 2], [bucket[0] - 6, bucket[1] - 2]
  ]);
  drawIsoDiamond(ctx, bucket[0], bucket[1] - 19, 23, 8, PALETTE.outline);
  drawIsoDiamond(ctx, bucket[0] - 1, bucket[1] - 20, 17, 5, PALETTE.clothBlueDark);
  linePx(ctx, bucket[0] - 9, bucket[1] - 16, bucket[0], bucket[1] - 30, PALETTE.outline, 2);
  linePx(ctx, bucket[0], bucket[1] - 30, bucket[0] + 9, bucket[1] - 16, PALETTE.outline, 2);
  nativeLinePx(ctx, bucket[0] - 7.5, bucket[1] - 15.5, bucket[0] - 0.5, bucket[1] - 27.5, PALETTE.ironLight);

  const jar = frame.point(0.32, -0.16, 0);
  poly(ctx, PALETTE.outline, [
    [jar[0] - 5, jar[1] - 29], [jar[0] + 5, jar[1] - 29],
    [jar[0] + 7, jar[1] - 25], [jar[0] + 11, jar[1] - 20],
    [jar[0] + 10, jar[1] - 5], [jar[0] + 6, jar[1]],
    [jar[0] - 7, jar[1]], [jar[0] - 11, jar[1] - 5],
    [jar[0] - 10, jar[1] - 20], [jar[0] - 7, jar[1] - 25]
  ]);
  poly(ctx, PALETTE.limeMid, [
    [jar[0] - 4, jar[1] - 27], [jar[0] + 4, jar[1] - 27],
    [jar[0] + 5, jar[1] - 23], [jar[0] + 8, jar[1] - 19],
    [jar[0] + 7, jar[1] - 6], [jar[0] + 4, jar[1] - 2],
    [jar[0] - 5, jar[1] - 2], [jar[0] - 8, jar[1] - 6],
    [jar[0] - 7, jar[1] - 19], [jar[0] - 5, jar[1] - 23]
  ]);
  linePx(ctx, jar[0] - 7, jar[1] - 21, jar[0] - 6, jar[1] - 6, PALETTE.limeLight, 3);
  linePx(ctx, jar[0] + 6, jar[1] - 19, jar[0] + 6, jar[1] - 6, PALETTE.limeDark, 3);
  linePx(ctx, jar[0] - 10, jar[1] - 15, jar[0] + 9, jar[1] - 15, PALETTE.outline, 5);
  linePx(ctx, jar[0] - 8, jar[1] - 17, jar[0] + 7, jar[1] - 17, PALETTE.clothTan, 2);
  drawIsoDiamond(ctx, jar[0], jar[1] - 29, 13, 5, PALETTE.outline);
  drawIsoDiamond(ctx, jar[0] - 1, jar[1] - 30, 8, 3, PALETTE.woodDark);
  nativePx(ctx, jar[0] - 4.5, jar[1] - 23.5, PALETTE.limeLight);
}

export function drawSouthMeasureNoticeBoard(ctx, cx, cy, seed, opts = {}) {
  const frame = isoFrame(cx, cy, opts.orient ?? 'se');
  const variant = opts.variant ?? 'public';
  const left = frame.point(-0.34, 0, 0);
  const right = frame.point(0.34, 0, 0);
  for (const [index, p] of [left, right].entries()) {
    drawIsoPrism(ctx, p[0], p[1] + 1, 11, 6, 6, {
      top: PALETTE.limeLight,
      left: PALETTE.limeMid,
      right: PALETTE.limeDark,
      outline: PALETTE.outline
    });
    px(ctx, p[0] - 3, p[1] - 58, PALETTE.outline, 7, 61);
    px(ctx, p[0] - 1, p[1] - 57, index ? PALETTE.ironDark : PALETTE.ironMid, 3, 57);
    nativeLinePx(ctx, p[0] - 0.5, p[1] - 55.5, p[0] - 0.5, p[1] - 5.5, index ? PALETTE.ironMid : PALETTE.ironLight);
  }
  const center = frame.point(0, 0, 46);
  if (variant === 'census') {
    const outer = [
      [center[0] - 28, center[1] - 18], [center[0] - 20, center[1] - 27],
      [center[0] + 18, center[1] - 27], [center[0] + 27, center[1] - 19],
      [center[0] + 26, center[1] + 19], [center[0] + 17, center[1] + 23],
      [center[0] - 25, center[1] + 20]
    ];
    poly(ctx, PALETTE.outline, outer);
    poly(ctx, PALETTE.limeDark, [
      [center[0] - 24, center[1] - 17], [center[0] - 18, center[1] - 23],
      [center[0] + 16, center[1] - 23], [center[0] + 23, center[1] - 17],
      [center[0] + 22, center[1] + 16], [center[0] + 15, center[1] + 19],
      [center[0] - 21, center[1] + 17]
    ]);
    const hood = [
      [center[0] - 32, center[1] - 24], [center[0] - 5, center[1] - 36],
      [center[0] + 31, center[1] - 24], [center[0] + 27, center[1] - 18],
      [center[0] - 28, center[1] - 18]
    ];
    poly(ctx, PALETTE.outline, hood);
    poly(ctx, PALETTE.clayDark, [
      [center[0] - 27, center[1] - 24], [center[0] - 4, center[1] - 33],
      [center[0] + 27, center[1] - 23], [center[0] + 24, center[1] - 20],
      [center[0] - 25, center[1] - 20]
    ]);
    linePx(ctx, center[0] - 24, center[1] - 24, center[0] - 4, center[1] - 32, PALETTE.clayLight, 2);

    const header = [
      [center[0] - 18, center[1] - 18], [center[0] + 15, center[1] - 18],
      [center[0] + 13, center[1] - 10], [center[0] - 17, center[1] - 10]
    ];
    poly(ctx, PALETTE.woodDark, header);
    nativeLinePx(ctx, center[0] - 14.5, center[1] - 16.5, center[0] + 9.5, center[1] - 16.5, PALETTE.woodLight);
    nativeLinePx(ctx, center[0] - 11.5, center[1] - 13.5, center[0] + 5.5, center[1] - 13.5, PALETTE.rustLight);

    // Household counts hang as punched tags. Their uneven lengths make the
    // board a physical register rather than an oversized calculator display.
    const railY = center[1] - 5;
    linePx(ctx, center[0] - 19, railY, center[0] + 16, railY, PALETTE.outline, 4);
    nativeLinePx(ctx, center[0] - 17.5, railY - 1.5, center[0] + 14.5, railY - 1.5, PALETTE.rustLight);
    for (let column = 0; column < 5; column += 1) {
      const x = center[0] - 15 + column * 8;
      const count = 1 + ((seed >> (column * 2)) & 3);
      linePx(ctx, x, railY + 1, x + (column & 1 ? 1 : -1), railY + 5 + count * 5, PALETTE.outline, 2);
      for (let item = 0; item < count; item += 1) {
        const tagY = railY + 5 + item * 5;
        poly(ctx, PALETTE.outline, [
          [x - 3, tagY], [x + 3, tagY + 1], [x + 2, tagY + 6], [x - 2, tagY + 5]
        ]);
        poly(ctx, column === 2 ? PALETTE.hostGold : item & 1 ? PALETTE.clothTan : PALETTE.stoneDust, [
          [x - 1, tagY + 2], [x + 1, tagY + 2], [x + 1, tagY + 4], [x - 1, tagY + 4]
        ]);
      }
    }

    const stripX = center[0] + 18;
    poly(ctx, PALETTE.outline, [
      [stripX - 5, center[1] - 7], [stripX + 6, center[1] - 6],
      [stripX + 5, center[1] + 16], [stripX + 1, center[1] + 20],
      [stripX - 5, center[1] + 16]
    ]);
    poly(ctx, PALETTE.clothTan, [
      [stripX - 3, center[1] - 5], [stripX + 4, center[1] - 4],
      [stripX + 3, center[1] + 14], [stripX, center[1] + 17],
      [stripX - 3, center[1] + 14]
    ]);
    for (const y of [0, 5, 10]) nativeLinePx(ctx, stripX - 1.5, center[1] + y, stripX + 2.5, center[1] + y, PALETTE.stoneDark);
    linePx(ctx, left[0], left[1] - 34, center[0] - 22, center[1] + 17, PALETTE.outline, 4);
    linePx(ctx, right[0], right[1] - 34, center[0] + 21, center[1] + 16, PALETTE.outline, 4);
    return;
  }

  if (variant === 'sealed') {
    px(ctx, center[0] - 26, center[1] - 21, PALETTE.outline, 53, 42);
    px(ctx, center[0] - 24, center[1] - 19, PALETTE.rustDark, 49, 38);
    px(ctx, center[0] - 22, center[1] - 17, PALETTE.stoneDark, 45, 34);
    for (const y of [-12, -3, 6]) {
      px(ctx, center[0] - 21, center[1] + y, PALETTE.outline, 43, 7);
      px(ctx, center[0] - 19, center[1] + y - 1, PALETTE.rustMid, 39, 3);
      px(ctx, center[0] - 17, center[1] + y - 2, PALETTE.rustLight, 12, 1);
    }
    linePx(ctx, center[0] - 22, center[1] - 17, center[0] + 21, center[1] + 16, PALETTE.outline, 7);
    linePx(ctx, center[0] - 20, center[1] - 18, center[0] + 20, center[1] + 13, PALETTE.stoneDust, 2);
    linePx(ctx, center[0] + 20, center[1] - 17, center[0] - 21, center[1] + 16, PALETTE.outline, 7);
    linePx(ctx, center[0] + 18, center[1] - 17, center[0] - 19, center[1] + 12, PALETTE.rustLight, 2);
    px(ctx, center[0] - 8, center[1] - 8, PALETTE.outline, 17, 18);
    px(ctx, center[0] - 6, center[1] - 6, PALETTE.clothRed, 13, 14);
    drawIsoDiamond(ctx, center[0], center[1] - 6, 12, 5, PALETTE.hostGold);
    nativePx(ctx, center[0] - 0.5, center[1] - 5.5, PALETTE.hostBone);
    return;
  }

  px(ctx, center[0] - 24, center[1] - 20, PALETTE.outline, 49, 39);
  px(ctx, center[0] - 22, center[1] - 18, PALETTE.clayDark, 45, 35);
  for (let y = -13; y <= 12; y += 8) {
    px(ctx, center[0] - 19, center[1] + y, PALETTE.clayMid, 39, 4);
    px(ctx, center[0] - 17, center[1] + y - 1, PALETTE.clayLight, 35, 1);
  }
  const papers = [
    [-15, -15, PALETTE.clothTan], [2, -10, PALETTE.stoneDust], [-8, 2, PALETTE.clothRed], [10, 6, PALETTE.clothTan]
  ];
  for (const [dx, dy, color] of papers) {
    px(ctx, center[0] + dx, center[1] + dy, PALETTE.outline, 11, 9);
    px(ctx, center[0] + dx + 1, center[1] + dy + 1, color, 9, 6);
    px(ctx, center[0] + dx + 3, center[1] + dy + 3, PALETTE.stoneDark, 5, 1);
  }
  nativePx(ctx, center[0] - 13.5, center[1] - 13.5, PALETTE.hostGold);
}

export function drawSouthMeasurePipeGantry(ctx, cx, cy, seed, opts = {}) {
  const frame = isoFrame(cx, cy, opts.orient ?? 'se');
  const left = frame.point(-0.57, 0, 0);
  const right = frame.point(0.57, 0, 0);
  const leftTop = frame.point(-0.57, 0, 64);
  const rightTop = frame.point(0.57, 0, 64);

  for (const [index, p] of [left, right].entries()) {
    drawIsoPrism(ctx, p[0], p[1] + 1, 14, 8, 8, {
      top: PALETTE.limeLight,
      left: PALETTE.limeMid,
      right: PALETTE.limeDark,
      outline: PALETTE.outline
    });
    const top = index === 0 ? leftTop : rightTop;
    linePx(ctx, p[0], p[1] - 7, top[0], top[1] + 4, PALETTE.outline, 8);
    linePx(ctx, p[0] - 1, p[1] - 9, top[0] - 1, top[1] + 5, PALETTE.ironMid, 4);
    nativeLinePx(ctx, p[0] - 2.5, p[1] - 11.5, top[0] - 2.5, top[1] + 7.5, index === 0 ? PALETTE.ironLight : PALETTE.limeLight);
    for (const lift of [18, 47]) {
      const collar = frame.point(index === 0 ? -0.57 : 0.57, 0, lift);
      linePx(ctx, collar[0] - 5, collar[1], collar[0] + 5, collar[1], PALETTE.outline, 4);
      linePx(ctx, collar[0] - 4, collar[1] - 2, collar[0] + 4, collar[1] - 2, PALETTE.clayLight, 2);
    }
  }

  // One continuous relief main rises, crosses overhead, and drops again. The
  // inverted-U silhouette is pipework, not a warning gate or painted plank.
  linePx(ctx, leftTop[0], leftTop[1] + 4, rightTop[0], rightTop[1] + 4, PALETTE.outline, 8);
  linePx(ctx, leftTop[0] + 1, leftTop[1] + 1, rightTop[0] - 1, rightTop[1] + 1, PALETTE.ironMid, 4);
  nativeLinePx(ctx, leftTop[0] + 4.5, leftTop[1] - 0.5, rightTop[0] - 4.5, rightTop[1] - 0.5, PALETTE.ironLight);
  for (const t of [-0.35, 0.35]) {
    const collar = frame.point(t, 0, 64);
    linePx(ctx, collar[0] - 3, collar[1] - 6, collar[0] + 3, collar[1] + 6, PALETTE.outline, 6);
    nativeLinePx(ctx, collar[0] - 1.5, collar[1] - 4.5, collar[0] + 1.5, collar[1] + 4.5, PALETTE.limeLight);
  }

  // A thinner rust return line runs below the main and terminates at a drain.
  const returnLeft = frame.point(-0.43, 0, 38);
  const returnRight = frame.point(0.35, 0, 38);
  linePx(ctx, returnLeft[0], returnLeft[1], returnRight[0], returnRight[1], PALETTE.outline, 5);
  linePx(ctx, returnLeft[0] + 1, returnLeft[1] - 1, returnRight[0] - 1, returnRight[1] - 1, PALETTE.clayMid, 2);
  nativeLinePx(ctx, returnLeft[0] + 2.5, returnLeft[1] - 3.5, returnRight[0] - 2.5, returnRight[1] - 3.5, PALETTE.clayLight);
  const down = frame.point(0.35, 0, 13);
  linePx(ctx, returnRight[0], returnRight[1], down[0], down[1], PALETTE.outline, 5);
  linePx(ctx, returnRight[0] - 1, returnRight[1] + 1, down[0] - 1, down[1] - 1, PALETTE.clayDark, 2);
  drawIsoDiamond(ctx, down[0], down[1] + 3, 23, 9, PALETTE.outline);
  drawIsoDiamond(ctx, down[0] - 1, down[1] + 2, 17, 5, PALETTE.stoneDark);

  const valve = frame.point(-0.57, 0.06, 34);
  drawIsoDiamond(ctx, valve[0], valve[1], 15, 7, PALETTE.outline);
  drawIsoDiamond(ctx, valve[0] - 1, valve[1] - 1, 10, 4, PALETTE.rustDark);
  linePx(ctx, valve[0] - 3, valve[1] - 4, valve[0] + 5, valve[1] - 9, PALETTE.outline, 3);
  nativeLinePx(ctx, valve[0] - 2.5, valve[1] - 5.5, valve[0] + 4.5, valve[1] - 9.5, PALETTE.rustLight);
}

export function drawSouthMeasureQueueRail(ctx, cx, cy, seed, opts = {}) {
  const frame = isoFrame(cx, cy, opts.orient ?? 'se');
  const mode = (seed >>> 2) & 3;

  // One authored unit is one side of a queue, not a complete cage. Parallel
  // runs in the level data form the lanes. Four seeded repair states vary
  // post height, rope survival and bracing without breaking the lane rhythm.
  const feet = [frame.point(-0.7, 0, 0), frame.point(0.7, 0, 0)];
  const tops = [];
  for (const [index, foot] of feet.entries()) {
    drawIsoPrism(ctx, foot[0], foot[1] + 1, 10, 6, 6, {
      top: PALETTE.limeLight,
      left: PALETTE.limeMid,
      right: PALETTE.limeDark,
      outline: PALETTE.outline
    });
    const crooked = ((seed + index) & 1) ? 1 : -1;
    const height = 33 + ((seed >>> (index * 3)) & 5) + (mode === 3 && index === 0 ? 5 : 0);
    const top = [foot[0] + crooked, foot[1] - height];
    linePx(ctx, foot[0], foot[1] - 4, top[0], top[1], PALETTE.outline, 5);
    linePx(ctx, foot[0] - 1, foot[1] - 5, top[0] - 1, top[1] + 2, index ? PALETTE.ironDark : PALETTE.ironMid, 2);
    nativeLinePx(ctx, foot[0] - 1.5, foot[1] - 6.5, top[0] - 1.5, top[1] + 3.5, PALETTE.ironLight);
    px(ctx, top[0] - 3, top[1] - 3, PALETTE.outline, 7, 5);
    px(ctx, top[0] - 1, top[1] - 4, index ? PALETTE.ironMid : PALETTE.limeLight, 3, 3);
    tops.push(top);
  }

  const ropeDrops = mode === 1 ? [[0, 10]] : [[0, 9], [1, 21]];
  for (const [ropeIndex, drop] of ropeDrops) {
    const a = [tops[0][0], tops[0][1] + drop];
    const b = [tops[1][0], tops[1][1] + drop + ((seed + ropeIndex) & 1)];
    const mid = [
      Math.round((a[0] + b[0]) / 2),
      Math.round((a[1] + b[1]) / 2) + 4 + ropeIndex
    ];
    linePx(ctx, a[0], a[1], mid[0], mid[1], PALETTE.outline, 3);
    linePx(ctx, mid[0], mid[1], b[0], b[1], PALETTE.outline, 3);
    nativeLinePx(ctx, a[0] + 0.5, a[1] - 0.5, mid[0] + 0.5, mid[1] - 0.5, ropeIndex ? PALETTE.clayMid : PALETTE.clayLight);
    nativeLinePx(ctx, mid[0] + 0.5, mid[1] - 0.5, b[0] + 0.5, b[1] - 0.5, ropeIndex ? PALETTE.clayDark : PALETTE.clayMid);

    if (mode === 1 && ropeIndex === 0) {
      // A tied cloth splice marks the missing lower run.
      poly(ctx, PALETTE.outline, [
        [mid[0] - 4, mid[1] - 2], [mid[0] + 5, mid[1] - 1],
        [mid[0] + 3, mid[1] + 9], [mid[0] - 1, mid[1] + 6],
        [mid[0] - 5, mid[1] + 10]
      ]);
      poly(ctx, PALETTE.clothTan, [
        [mid[0] - 2, mid[1]], [mid[0] + 3, mid[1] + 1],
        [mid[0] + 1, mid[1] + 6], [mid[0], mid[1] + 4],
        [mid[0] - 3, mid[1] + 7]
      ]);
    }
  }

  if (mode === 2) {
    const braceFoot = frame.point(-0.34, 0.18, 0);
    linePx(ctx, braceFoot[0], braceFoot[1], tops[0][0], tops[0][1] + 14, PALETTE.outline, 5);
    nativeLinePx(ctx, braceFoot[0] - 0.5, braceFoot[1] - 1.5, tops[0][0] - 0.5, tops[0][1] + 13.5, PALETTE.ironLight);
  }

  // Only some segments bear a tally plate, preventing a repeated blue badge
  // from becoming the dominant pattern across the screening yard.
  if ((seed & 7) === 0) {
    const tally = frame.point(0.17, 0, 21);
    px(ctx, tally[0] - 5, tally[1] - 5, PALETTE.outline, 11, 11);
    px(ctx, tally[0] - 3, tally[1] - 4, PALETTE.limeMid, 7, 7);
    for (let row = 0; row < 2; row += 1) px(ctx, tally[0] - 2, tally[1] - 2 + row * 3, row ? PALETTE.clothBlue : PALETTE.limeLight, 5 - row, 1);
  }
  nativePx(ctx, feet[0][0] - 0.5, feet[0][1] - 29.5, PALETTE.limeLight);
}

export function drawSouthMeasureReturnStall(ctx, cx, cy, seed, opts = {}) {
  const frame = isoFrame(cx, cy, opts.orient ?? 'se');
  const variant = opts.variant ?? 'returns';
  if (variant === 'returns') {
    const sideA = frame.point(0, 0.3, 0);
    const sideB = frame.point(0, -0.3, 0);
    const nearLb = sideA[1] > sideB[1] ? 0.3 : -0.3;
    const farLb = -nearLb;

    // An open trestle register with a hanging balance. Daylight under the
    // counter and the suspended pans make its job readable at gameplay scale.
    const top = orientedBox(ctx, frame, 1.08, 0.46, 4, {
      top: PALETTE.woodLight,
      lit: PALETTE.woodMid,
      shade: PALETTE.woodDark,
      outline: PALETTE.outline
    }, 24);
    for (const [la, lb, splay] of [
      [-0.43, -0.16, -5], [0.43, -0.16, 5],
      [-0.43, 0.16, -7], [0.43, 0.16, 7]
    ]) {
      const topLeg = frame.point(la, lb, 24);
      const foot = frame.point(la, lb, 0);
      linePx(ctx, topLeg[0], topLeg[1], foot[0] + splay, foot[1], PALETTE.outline, 6);
      linePx(ctx, topLeg[0] - 1, topLeg[1] + 1, foot[0] + splay - 1, foot[1] - 2, la < 0 ? PALETTE.woodMid : PALETTE.woodDark, 2);
    }
    const braceA = frame.point(-0.42, nearLb * 0.55, 13);
    const braceB = frame.point(0.42, nearLb * 0.55, 13);
    linePx(ctx, braceA[0], braceA[1], braceB[0], braceB[1], PALETTE.outline, 5);
    linePx(ctx, braceA[0] + 1, braceA[1] - 1, braceB[0] - 1, braceB[1] - 1, PALETTE.woodLight, 1);

    const mastFoot = frame.point(0, farLb * 0.62, 25);
    const mastTop = frame.point(0, farLb * 0.62, 63);
    linePx(ctx, mastFoot[0], mastFoot[1], mastTop[0], mastTop[1], PALETTE.outline, 7);
    linePx(ctx, mastFoot[0] - 1, mastFoot[1] - 1, mastTop[0] - 1, mastTop[1] + 2, PALETTE.rustMid, 3);
    const beamA = frame.point(-0.48, farLb * 0.62, 57);
    const beamB = frame.point(0.48, farLb * 0.62, 57);
    linePx(ctx, beamA[0], beamA[1], beamB[0], beamB[1], PALETTE.outline, 7);
    linePx(ctx, beamA[0] + 1, beamA[1] - 2, beamB[0] - 1, beamB[1] - 2, PALETTE.rustLight, 2);
    poly(ctx, PALETTE.outline, [
      [mastTop[0], mastTop[1] - 2], [mastTop[0] + 7, mastTop[1] + 9],
      [mastTop[0] - 7, mastTop[1] + 9]
    ]);
    poly(ctx, PALETTE.stoneDust, [
      [mastTop[0], mastTop[1] + 1], [mastTop[0] + 4, mastTop[1] + 7],
      [mastTop[0] - 4, mastTop[1] + 7]
    ]);

    for (const [index, beam] of [beamA, beamB].entries()) {
      const panCenter = frame.point(index === 0 ? -0.48 : 0.48, nearLb * 0.15, 34 + (index === (seed & 1) ? 2 : 0));
      linePx(ctx, beam[0], beam[1] + 2, panCenter[0] - 8, panCenter[1] - 4, PALETTE.outline, 2);
      linePx(ctx, beam[0], beam[1] + 2, panCenter[0] + 8, panCenter[1] - 4, PALETTE.outline, 2);
      nativeLinePx(ctx, beam[0] + 0.5, beam[1] + 3.5, panCenter[0] - 7.5, panCenter[1] - 4.5, PALETTE.rustLight);
      drawIsoDiamond(ctx, panCenter[0], panCenter[1], 25, 9, PALETTE.outline);
      drawIsoDiamond(ctx, panCenter[0] - 1, panCenter[1] - 1, 19, 5, index === 0 ? PALETTE.stoneDust : PALETTE.rustMid);
    }

    const book = frame.point(-0.12, nearLb * 0.1, 31);
    poly(ctx, PALETTE.outline, [
      [book[0] - 17, book[1]], [book[0] - 2, book[1] - 5],
      [book[0], book[1] + 1], [book[0] + 16, book[1] - 4],
      [book[0] + 15, book[1] + 6], [book[0], book[1] + 10],
      [book[0] - 16, book[1] + 6]
    ]);
    poly(ctx, PALETTE.clothTan, [
      [book[0] - 14, book[1] + 1], [book[0] - 2, book[1] - 3],
      [book[0], book[1] + 3], [book[0] + 13, book[1] - 2],
      [book[0] + 12, book[1] + 4], [book[0], book[1] + 8],
      [book[0] - 13, book[1] + 4]
    ]);
    for (const side of [-1, 1]) {
      nativeLinePx(ctx, book[0] + side * 3.5, book[1] + 1.5, book[0] + side * 10.5, book[1] + 2.5, PALETTE.stoneDark);
    }

    const sack = frame.point(-0.3, nearLb * 0.68, 0);
    poly(ctx, PALETTE.outline, [
      [sack[0] - 3, sack[1] - 25], [sack[0] + 4, sack[1] - 25],
      [sack[0] + 9, sack[1] - 19], [sack[0] + 10, sack[1] - 5],
      [sack[0] + 6, sack[1]], [sack[0] - 7, sack[1]],
      [sack[0] - 11, sack[1] - 5], [sack[0] - 9, sack[1] - 19]
    ]);
    poly(ctx, PALETTE.clothDark, [
      [sack[0] - 2, sack[1] - 22], [sack[0] + 3, sack[1] - 22],
      [sack[0] + 7, sack[1] - 17], [sack[0] + 7, sack[1] - 6],
      [sack[0] + 4, sack[1] - 2], [sack[0] - 5, sack[1] - 2],
      [sack[0] - 8, sack[1] - 6], [sack[0] - 7, sack[1] - 17]
    ]);
    px(ctx, sack[0] - 5, sack[1] - 27, PALETTE.outline, 11, 5);
    px(ctx, sack[0] - 3, sack[1] - 27, PALETTE.rustLight, 7, 2);
    nativeLinePx(ctx, top.cap.left[0] + 1.5, top.cap.left[1] - 0.5, top.cap.top[0] - 1.5, top.cap.top[1] + 0.5, PALETTE.woodLight);
    return;
  }
  const counter = orientedBox(ctx, frame, 1.02, 0.4, 22, {
    top: PALETTE.woodLight,
    lit: PALETTE.woodMid,
    shade: PALETTE.woodDark,
    outline: PALETTE.outline
  }, 12);
  if (variant === 'bonded') {
    const posts = [
      frame.point(-0.5, -0.25, 0), frame.point(0.5, -0.25, 0),
      frame.point(-0.5, 0.29, 0), frame.point(0.5, 0.29, 0)
    ];
    for (const [index, post] of posts.entries()) {
      px(ctx, post[0] - 3, post[1] - 70, PALETTE.outline, 7, 73);
      px(ctx, post[0] - 1, post[1] - 69, index & 1 ? PALETTE.rustDark : PALETTE.rustMid, 3, 69);
    }
    const roof = [
      frame.point(-0.6, -0.34, 74), frame.point(0.6, -0.34, 74),
      frame.point(0.6, 0.37, 70), frame.point(-0.6, 0.37, 70)
    ];
    poly(ctx, PALETTE.outline, roof);
    poly(ctx, PALETTE.rustDark, [
      frame.point(-0.55, -0.29, 75), frame.point(0.55, -0.29, 75),
      frame.point(0.55, 0.32, 71), frame.point(-0.55, 0.32, 71)
    ]);
    for (const t of [-0.32, 0, 0.32]) {
      const a = frame.point(t, -0.28, 75);
      const b = frame.point(t, 0.31, 71);
      linePx(ctx, a[0], a[1], b[0], b[1], t < 0 ? PALETTE.rustLight : PALETTE.outline, 2);
    }
  } else {
    const rearLeft = frame.point(-0.48, -0.23, 0);
    const rearRight = frame.point(0.48, -0.23, 0);
    for (const [index, post] of [rearLeft, rearRight].entries()) {
      px(ctx, post[0] - 3, post[1] - 49, PALETTE.outline, 7, 52);
      px(ctx, post[0] - 1, post[1] - 48, index ? PALETTE.woodDark : PALETTE.woodMid, 3, 48);
    }
    const ridge = frame.point(-0.12, -0.25, 58);
    const farLeft = frame.point(-0.7, -0.33, 47);
    const farRight = frame.point(0.61, -0.33, 47);
    const nearLeft = frame.point(-0.74, 0.35, 40);
    const nearRight = frame.point(0.65, 0.35, 40);
    poly(ctx, PALETTE.outline, [farLeft, ridge, nearRight, nearLeft]);
    poly(ctx, PALETTE.clothTan, [
      [farLeft[0] + 2, farLeft[1] + 1], [ridge[0], ridge[1] + 2],
      [nearRight[0] - 2, nearRight[1] - 1], [nearLeft[0] + 2, nearLeft[1] - 1]
    ]);
    poly(ctx, PALETTE.outline, [ridge, farRight, nearRight]);
    poly(ctx, PALETTE.stoneDust, [
      [ridge[0] + 1, ridge[1] + 2], [farRight[0] - 2, farRight[1] + 1],
      [nearRight[0] - 2, nearRight[1] - 1]
    ]);
    linePx(ctx, farLeft[0] + 3, farLeft[1], nearRight[0] - 3, nearRight[1] - 2, PALETTE.rustDark, 1);
  }
  if (variant === 'bonded') {
    const hatchLeft = frame.point(-0.43, 0.12, 55);
    const hatchRight = frame.point(0.43, 0.12, 55);
    const hatchLowLeft = frame.point(-0.43, 0.12, 28);
    const hatchLowRight = frame.point(0.43, 0.12, 28);
    poly(ctx, PALETTE.outline, [hatchLeft, hatchRight, hatchLowRight, hatchLowLeft]);
    const insetTopLeft = frame.point(-0.39, 0.12, 52);
    const insetTopRight = frame.point(0.39, 0.12, 52);
    const insetLowRight = frame.point(0.39, 0.12, 31);
    const insetLowLeft = frame.point(-0.39, 0.12, 31);
    poly(ctx, PALETTE.void, [insetTopLeft, insetTopRight, insetLowRight, insetLowLeft]);
    for (const t of [-0.3, -0.1, 0.1, 0.3]) {
      const top = frame.point(t, 0.12, 53);
      const bottom = frame.point(t, 0.12, 30);
      linePx(ctx, top[0], top[1], bottom[0], bottom[1], PALETTE.outline, 5);
      linePx(ctx, top[0] - 1, top[1], bottom[0] - 1, bottom[1], t < 0 ? PALETTE.rustLight : PALETTE.rustMid, 1);
    }
    linePx(ctx, hatchLeft[0], hatchLeft[1] + 9, hatchRight[0], hatchRight[1] + 9, PALETTE.outline, 6);
    linePx(ctx, hatchLeft[0] + 2, hatchLeft[1] + 7, hatchRight[0] - 2, hatchRight[1] + 7, PALETTE.stoneDust, 2);
    const lock = frame.point(0.03, 0.14, 35);
    px(ctx, lock[0] - 6, lock[1] - 7, PALETTE.outline, 13, 15);
    px(ctx, lock[0] - 4, lock[1] - 5, PALETTE.rustLight, 9, 11);
    px(ctx, lock[0] - 1, lock[1] - 2, PALETTE.void, 3, 7);
    px(ctx, lock[0] + 7, lock[1] - 4, PALETTE.outline, 9, 10);
    px(ctx, lock[0] + 9, lock[1] - 3, PALETTE.clothRed, 5, 7);
    nativePx(ctx, lock[0] + 10.5, lock[1] - 1.5, PALETTE.hostGold);
  } else if (variant === 'pump-keys') {
    const rackLeft = frame.point(-0.4, -0.02, 49);
    const rackRight = frame.point(0.4, -0.02, 49);
    linePx(ctx, rackLeft[0], rackLeft[1], rackRight[0], rackRight[1], PALETTE.outline, 7);
    linePx(ctx, rackLeft[0] + 1, rackLeft[1] - 1, rackRight[0] - 1, rackRight[1] - 1, PALETTE.rustLight, 2);
    for (let index = 0; index < 5; index += 1) {
      const t = 0.1 + index * 0.2;
      const hook = [
        Math.round(rackLeft[0] + (rackRight[0] - rackLeft[0]) * t),
        Math.round(rackLeft[1] + (rackRight[1] - rackLeft[1]) * t)
      ];
      const length = 13 + (index % 3) * 5;
      linePx(ctx, hook[0], hook[1], hook[0] + (index & 1 ? 2 : -2), hook[1] + length, PALETTE.outline, 4);
      linePx(ctx, hook[0] + 1, hook[1] + 1, hook[0] + (index & 1 ? 3 : -1), hook[1] + length - 1, index & 1 ? PALETTE.stoneDust : PALETTE.rustMid, 1);
      const ringX = hook[0] + (index & 1 ? 2 : -2);
      const ringY = hook[1] + length + 3;
      px(ctx, ringX - 4, ringY - 4, PALETTE.outline, 9, 9);
      px(ctx, ringX - 2, ringY - 2, PALETTE.void, 5, 5);
      px(ctx, ringX + (index & 1 ? 4 : -6), ringY + 1, PALETTE.hostGold, 3, 3);
    }
    const wheel = frame.point(-0.43, 0.2, 29);
    px(ctx, wheel[0] - 10, wheel[1] - 10, PALETTE.outline, 21, 21);
    px(ctx, wheel[0] - 7, wheel[1] - 7, PALETTE.clothBlueDark, 15, 15);
    px(ctx, wheel[0] - 4, wheel[1] - 4, PALETTE.void, 9, 9);
    linePx(ctx, wheel[0] - 8, wheel[1], wheel[0] + 8, wheel[1], PALETTE.clothBlue, 2);
    linePx(ctx, wheel[0], wheel[1] - 8, wheel[0], wheel[1] + 8, PALETTE.clothBlue, 2);
    px(ctx, wheel[0] - 2, wheel[1] - 2, PALETTE.hostGold, 5, 5);
  } else {
    const scale = frame.point(0.17, 0.08, 42);
    linePx(ctx, scale[0], scale[1] - 10, scale[0], scale[1] + 6, PALETTE.outline, 2);
    linePx(ctx, scale[0] - 12, scale[1] - 9, scale[0] + 12, scale[1] - 9, PALETTE.rustLight, 2);
    for (const side of [-1, 1]) {
      linePx(ctx, scale[0] + side * 10, scale[1] - 8, scale[0] + side * 10, scale[1] + 2, PALETTE.outline, 1);
      drawIsoDiamond(ctx, scale[0] + side * 10, scale[1] + 4, 13, 5, PALETTE.stoneDust);
    }
  }

  nativeLinePx(ctx, counter.cap.left[0] + 2.5, counter.cap.left[1] - 1.5, counter.cap.top[0] - 2.5, counter.cap.top[1] + 0.5, PALETTE.woodLight);
}

export function drawSouthMeasureRepairRack(ctx, cx, cy, seed, opts = {}) {
  const frame = isoFrame(cx, cy, opts.orient ?? 'se');
  const rng = rngFrom(hash2D(seed + 733, seed * 7 + 23));

  // Two triangular end frames and a ridge beam create a proper sawbuck rack.
  // The open center is deliberate daylight, not another filled rectangle.
  const ends = [-0.42, 0.42].map((la) => ({
    la,
    footA: frame.point(la, -0.3, 0),
    footB: frame.point(la, 0.3, 0),
    apex: frame.point(la, 0, 53)
  }));
  for (const [index, end] of ends.entries()) {
    for (const foot of [end.footA, end.footB]) {
      linePx(ctx, foot[0], foot[1], end.apex[0], end.apex[1], PALETTE.outline, 7);
      linePx(ctx, foot[0] + (foot[0] < end.apex[0] ? 1 : -1), foot[1] - 2, end.apex[0], end.apex[1] + 3, index ? PALETTE.woodDark : PALETTE.woodMid, 3);
    }
    const braceA = frame.point(end.la, -0.23, 21);
    const braceB = frame.point(end.la, 0.23, 21);
    linePx(ctx, braceA[0], braceA[1], braceB[0], braceB[1], PALETTE.outline, 5);
    linePx(ctx, braceA[0], braceA[1] - 1, braceB[0], braceB[1] - 1, PALETTE.woodLight, 1);
  }
  const ridgeA = ends[0].apex;
  const ridgeB = ends[1].apex;
  linePx(ctx, ridgeA[0], ridgeA[1], ridgeB[0], ridgeB[1], PALETTE.outline, 8);
  linePx(ctx, ridgeA[0] + 1, ridgeA[1] - 2, ridgeB[0] - 1, ridgeB[1] - 2, PALETTE.woodMid, 3);
  nativeLinePx(ctx, ridgeA[0] + 2.5, ridgeA[1] - 3.5, ridgeB[0] - 2.5, ridgeB[1] - 3.5, PALETTE.woodLight);

  const toolSpecs = [
    { la: -0.25, length: 37, side: -1, kind: 'spade' },
    { la: -0.02, length: 29, side: 1, kind: 'hammer' },
    { la: 0.23, length: 41, side: -1, kind: 'pick' }
  ];
  for (const [index, tool] of toolSpecs.entries()) {
    const hook = frame.point(tool.la, 0, 48);
    const end = [hook[0] + tool.side * (4 + index), hook[1] + tool.length];
    linePx(ctx, hook[0], hook[1], end[0], end[1], PALETTE.outline, 4);
    linePx(ctx, hook[0] + 1, hook[1] + 1, end[0] + 1, end[1] - 1, index === 1 ? PALETTE.woodLight : PALETTE.rustLight, 1);
    if (tool.kind === 'spade') {
      poly(ctx, PALETTE.outline, [
        [end[0] - 6, end[1] - 1], [end[0] + 5, end[1] - 1],
        [end[0] + 4, end[1] + 7], [end[0], end[1] + 11],
        [end[0] - 5, end[1] + 7]
      ]);
      poly(ctx, PALETTE.stoneMid, [
        [end[0] - 4, end[1] + 1], [end[0] + 3, end[1] + 1],
        [end[0] + 2, end[1] + 6], [end[0], end[1] + 8],
        [end[0] - 3, end[1] + 6]
      ]);
    } else if (tool.kind === 'hammer') {
      linePx(ctx, end[0] - 8, end[1], end[0] + 8, end[1] - 2, PALETTE.outline, 6);
      linePx(ctx, end[0] - 6, end[1] - 2, end[0] + 6, end[1] - 3, PALETTE.stoneDust, 2);
    } else {
      linePx(ctx, end[0] - 10, end[1] + 2, end[0] + 10, end[1] - 2, PALETTE.outline, 5);
      linePx(ctx, end[0] - 8, end[1], end[0] + 8, end[1] - 3, PALETTE.rustLight, 1);
    }
  }

  // A hose coil leans against one trestle. Build it as an open loop so it
  // cannot collapse into the old square target glyph.
  const coil = frame.point(0.31, 0.22, 19);
  for (const [dx, dy] of [
    [-8, -5], [-4, -9], [2, -10], [7, -7], [9, -2],
    [7, 4], [2, 8], [-4, 7], [-8, 3], [-10, -1]
  ]) {
    px(ctx, coil[0] + dx - 2, coil[1] + dy - 2, PALETTE.outline, 5, 5);
    nativePx(ctx, coil[0] + dx - 0.5, coil[1] + dy - 1.5, PALETTE.rustLight);
  }
  linePx(ctx, coil[0] + 8, coil[1] + 4, coil[0] + 17, coil[1] + 10, PALETTE.outline, 4);
  linePx(ctx, coil[0] + 8, coil[1] + 3, coil[0] + 16, coil[1] + 9, PALETTE.clothBlueDark, 1);
  if (rng() > 0.5) nativePx(ctx, coil[0] - 5.5, coil[1] - 6.5, PALETTE.stoneDust);
}

export function drawSouthMeasureWaterLesson(ctx, cx, cy, seed, opts = {}) {
  const frame = isoFrame(cx, cy, opts.orient ?? 'se');
  const wear = hash2D(seed + 751, seed * 11 + 29);

  // The lesson is one waist-low demonstration board on open trestles. Its
  // three mounted vessels and connecting channel stay visually attached.
  const boardOuter = [
    frame.point(-0.67, -0.3, 29), frame.point(0.67, -0.3, 29),
    frame.point(0.67, 0.3, 21), frame.point(-0.67, 0.3, 21)
  ];
  poly(ctx, PALETTE.outline, boardOuter);
  poly(ctx, PALETTE.stoneMid, [
    frame.point(-0.62, -0.25, 29), frame.point(0.62, -0.25, 29),
    frame.point(0.62, 0.25, 22), frame.point(-0.62, 0.25, 22)
  ]);
  const frontLeft = frame.point(-0.67, 0.3, 21);
  const frontRight = frame.point(0.67, 0.3, 21);
  const frontLeftLow = frame.point(-0.67, 0.3, 16);
  const frontRightLow = frame.point(0.67, 0.3, 16);
  poly(ctx, PALETTE.outline, [frontLeft, frontRight, frontRightLow, frontLeftLow]);
  poly(ctx, PALETTE.rustDark, [
    frame.point(-0.62, 0.3, 20), frame.point(0.62, 0.3, 20),
    frame.point(0.62, 0.3, 17), frame.point(-0.62, 0.3, 17)
  ]);

  // Splayed A-frame legs leave daylight beneath the board.
  for (const la of [-0.48, 0.48]) {
    const brace = frame.point(la, 0, 20);
    const footA = frame.point(la - 0.09, -0.25, 0);
    const footB = frame.point(la + 0.09, 0.25, 0);
    linePx(ctx, brace[0], brace[1], footA[0], footA[1], PALETTE.outline, 5);
    linePx(ctx, brace[0], brace[1], footB[0], footB[1], PALETTE.outline, 5);
    nativeLinePx(ctx, brace[0] - 0.5, brace[1] + 1.5, footA[0] - 0.5, footA[1] - 1.5, PALETTE.woodLight);
    const crossA = frame.point(la - 0.08, -0.18, 8);
    const crossB = frame.point(la + 0.08, 0.18, 8);
    linePx(ctx, crossA[0], crossA[1], crossB[0], crossB[1], PALETTE.outline, 3);
  }

  const boardHeight = (lb) => Math.round(25 - lb * 13);
  const stations = [-0.45, 0, 0.45].map((la) => frame.point(la, 0, boardHeight(0)));

  // A single blue pipe links all three mounted stages.
  const pipeA = frame.point(-0.34, 0.05, boardHeight(0.05) + 2);
  const pipeB = frame.point(0.34, 0.05, boardHeight(0.05) + 2);
  linePx(ctx, pipeA[0], pipeA[1], pipeB[0], pipeB[1], PALETTE.outline, 7);
  linePx(ctx, pipeA[0] + 1, pipeA[1] - 1, pipeB[0] - 1, pipeB[1] - 1, PALETTE.clothBlueDark, 3);
  nativeLinePx(ctx, pipeA[0] + 1.5, pipeA[1] - 2.5, pipeB[0] - 1.5, pipeB[1] - 2.5, PALETTE.clothBlue);

  // Dirty intake grate.
  drawIsoDiamond(ctx, stations[0][0], stations[0][1], 24, 10, PALETTE.outline);
  drawIsoDiamond(ctx, stations[0][0] - 1, stations[0][1] - 1, 19, 7, PALETTE.rustDark);
  for (const offset of [-5, 0, 5]) {
    linePx(ctx, stations[0][0] + offset - 3, stations[0][1] - 3, stations[0][0] + offset + 3, stations[0][1] + 1, PALETTE.stoneDust, 1);
  }

  // Settling bowl, visibly deeper than the other stages.
  drawIsoDiamond(ctx, stations[1][0], stations[1][1], 31, 13, PALETTE.outline);
  drawIsoDiamond(ctx, stations[1][0] - 1, stations[1][1] - 1, 26, 10, PALETTE.stoneDust);
  drawIsoDiamond(ctx, stations[1][0] - 1, stations[1][1] - 2, 18, 6, PALETTE.clothBlueDark);
  px(ctx, stations[1][0] - 2, stations[1][1], PALETTE.outline, 5, 8);
  px(ctx, stations[1][0] - 1, stations[1][1] + 1, PALETTE.rustMid, 2, 6);

  // Clean-water jar rises from its retaining ring.
  drawIsoDiamond(ctx, stations[2][0], stations[2][1] + 1, 24, 10, PALETTE.outline);
  drawIsoDiamond(ctx, stations[2][0] - 1, stations[2][1], 18, 7, PALETTE.stoneDust);
  poly(ctx, PALETTE.outline, [
    [stations[2][0] - 7, stations[2][1] - 2], [stations[2][0] - 5, stations[2][1] - 14],
    [stations[2][0] + 5, stations[2][1] - 14], [stations[2][0] + 8, stations[2][1] - 2]
  ]);
  poly(ctx, PALETTE.clothBlue, [
    [stations[2][0] - 4, stations[2][1] - 3], [stations[2][0] - 3, stations[2][1] - 11],
    [stations[2][0] + 3, stations[2][1] - 11], [stations[2][0] + 5, stations[2][1] - 3]
  ]);
  px(ctx, stations[2][0] - 6, stations[2][1] - 17, PALETTE.outline, 13, 5);
  px(ctx, stations[2][0] - 4, stations[2][1] - 17, PALETTE.hostBone, 9, 2);

  // Punched stage plates are fixed to the board's near edge.
  for (let index = 0; index < 3; index += 1) {
    const plate = frame.point(-0.45 + index * 0.45, 0.24, boardHeight(0.24) + 1);
    px(ctx, plate[0] - 5, plate[1] - 3, PALETTE.outline, 11, 7);
    px(ctx, plate[0] - 3, plate[1] - 2, index === 1 ? PALETTE.hostGold : PALETTE.rustLight, 7, 4);
    for (let punch = 0; punch <= index; punch += 1) nativePx(ctx, plate[0] - index + punch * 2 - 0.5, plate[1] - 1.5, PALETTE.void);
  }

  // A small scratched palm and a hanging pointer retain the human teaching
  // trace without scattering boot glyphs across the paving.
  const palm = frame.point(0.25, 0.19, boardHeight(0.19) + 2);
  px(ctx, palm[0] - 2, palm[1] - 2, PALETTE.rustLight, 5, 4);
  for (const finger of [-3, -1, 1, 3]) px(ctx, palm[0] + finger, palm[1] - 6 - (finger === -1 ? 1 : 0), PALETTE.rustLight, 1, 5);
  const pointerTop = frame.point(-0.62, 0.29, 17);
  const pointerEnd = frame.point(-0.72, 0.35, 1);
  linePx(ctx, pointerTop[0], pointerTop[1], pointerEnd[0], pointerEnd[1], PALETTE.outline, 3);
  nativeLinePx(ctx, pointerTop[0] - 0.5, pointerTop[1] + 0.5, pointerEnd[0] - 0.5, pointerEnd[1] - 1.5, PALETTE.woodLight);
  if (wear & 1) nativePx(ctx, frontLeft[0] + 5.5, frontLeft[1] - 1.5, PALETTE.stoneDust);
}

export function drawSouthMeasureBrassHookMemorial(ctx, cx, cy, seed) {
  const frame = isoFrame(cx, cy, 'se');
  const rng = rngFrom(hash2D(seed + 769, seed * 13 + 31));
  drawIsoPrism(ctx, cx, cy + 2, 66, 27, 10, {
    top: PALETTE.stoneLight,
    left: PALETTE.stoneMid,
    right: PALETTE.stoneDark,
    outline: PALETTE.outline
  });

  // A single crooked brass hook is the memorial's unmistakable silhouette.
  // It rises from one stone socket and carries burial tags beneath its curve.
  const foot = frame.point(-0.17, 0, 10);
  const hook = [
    [foot[0], foot[1]], [foot[0] - 3, foot[1] - 43],
    [foot[0] + 1, foot[1] - 61], [foot[0] + 12, foot[1] - 74],
    [foot[0] + 27, foot[1] - 79], [foot[0] + 40, foot[1] - 75],
    [foot[0] + 48, foot[1] - 64], [foot[0] + 46, foot[1] - 52],
    [foot[0] + 37, foot[1] - 45], [foot[0] + 28, foot[1] - 47]
  ];
  for (let index = 0; index < hook.length - 1; index += 1) {
    const a = hook[index];
    const b = hook[index + 1];
    linePx(ctx, a[0], a[1], b[0], b[1], PALETTE.outline, 10);
    linePx(ctx, a[0] - 1, a[1] - 2, b[0] - 1, b[1] - 2, index < 5 ? PALETTE.rustLight : PALETTE.rustMid, 4);
    if (index < 4) nativeLinePx(ctx, a[0] - 1.5, a[1] - 3.5, b[0] - 1.5, b[1] - 3.5, PALETTE.hostGold);
  }

  // Three unequal tag cords hang under the curve, with room between them.
  const tagAnchors = [hook[4], hook[5], hook[7]];
  for (const [index, anchor] of tagAnchors.entries()) {
    const drop = 12 + index * 5 + (seed & 1);
    const sway = index === 1 ? 2 : -1;
    linePx(ctx, anchor[0], anchor[1] + 3, anchor[0] + sway, anchor[1] + drop, PALETTE.outline, 3);
    nativeLinePx(ctx, anchor[0] - 0.5, anchor[1] + 4.5, anchor[0] + sway - 0.5, anchor[1] + drop - 1.5, PALETTE.rustLight);
    const tagX = anchor[0] + sway;
    const tagY = anchor[1] + drop + 3;
    poly(ctx, PALETTE.outline, [
      [tagX - 5, tagY - 4], [tagX + 5, tagY - 3],
      [tagX + 4, tagY + 6], [tagX - 4, tagY + 6]
    ]);
    poly(ctx, index === 1 ? PALETTE.clothRed : PALETTE.clothTan, [
      [tagX - 3, tagY - 2], [tagX + 3, tagY - 1],
      [tagX + 2, tagY + 4], [tagX - 2, tagY + 4]
    ]);
    nativePx(ctx, tagX - 0.5, tagY - 0.5, PALETTE.stoneDark);
  }

  // A bowed chain and tied prayer strip mark the shaft as commemorative, not
  // a lifting tool.
  const chainA = hook[2];
  const chainB = hook[8];
  const chainMid = [Math.round((chainA[0] + chainB[0]) / 2), Math.round((chainA[1] + chainB[1]) / 2) + 15];
  linePx(ctx, chainA[0], chainA[1], chainMid[0], chainMid[1], PALETTE.outline, 2);
  linePx(ctx, chainMid[0], chainMid[1], chainB[0], chainB[1], PALETTE.outline, 2);
  for (let t = 0.12; t < 0.95; t += 0.13) {
    const leftHalf = t < 0.5;
    const local = leftHalf ? t * 2 : (t - 0.5) * 2;
    const a = leftHalf ? chainA : chainMid;
    const b = leftHalf ? chainMid : chainB;
    nativePx(ctx, a[0] + (b[0] - a[0]) * local + 0.5, a[1] + (b[1] - a[1]) * local - 0.5, t < 0.5 ? PALETTE.rustLight : PALETTE.stoneDust);
  }
  const stripY = foot[1] - 36;
  poly(ctx, PALETTE.outline, [
    [foot[0] - 8, stripY - 5], [foot[0] + 6, stripY - 3],
    [foot[0] + 10, stripY + 6], [foot[0] + 3, stripY + 13],
    [foot[0] - 1, stripY + 6], [foot[0] - 8, stripY + 5]
  ]);
  poly(ctx, PALETTE.clothRed, [
    [foot[0] - 5, stripY - 2], [foot[0] + 4, stripY],
    [foot[0] + 6, stripY + 5], [foot[0] + 2, stripY + 9],
    [foot[0], stripY + 4], [foot[0] - 5, stripY + 3]
  ]);

  // Recessed ledger plaque and one votive cup ground the memorial's use.
  const plaque = frame.point(0.03, 0.12, 12);
  drawIsoDiamond(ctx, plaque[0], plaque[1], 38, 13, PALETTE.outline);
  drawIsoDiamond(ctx, plaque[0] - 1, plaque[1] - 1, 31, 9, PALETTE.stoneDark);
  for (let row = 0; row < 3; row += 1) px(ctx, plaque[0] - 10, plaque[1] - 4 + row * 3, PALETTE.rustLight, 18 - row * 4, 1);
  const cup = frame.point(0.42, 0.22, 3);
  poly(ctx, PALETTE.outline, [
    [cup[0] - 6, cup[1] - 9], [cup[0] + 6, cup[1] - 9],
    [cup[0] + 4, cup[1] + 1], [cup[0] - 4, cup[1] + 1]
  ]);
  poly(ctx, PALETTE.rustMid, [
    [cup[0] - 3, cup[1] - 6], [cup[0] + 3, cup[1] - 6],
    [cup[0] + 2, cup[1] - 1], [cup[0] - 2, cup[1] - 1]
  ]);
  nativePx(ctx, cup[0] - 1.5, cup[1] - 7.5, PALETTE.hostBone);

  for (let i = 0; i < 3; i += 1) {
    const token = frame.point(-0.34 + rng() * 0.68, 0.36, 1);
    px(ctx, token[0] - 2, token[1] - 2, PALETTE.outline, 5, 4);
    px(ctx, token[0] - 1, token[1] - 2, i === 1 ? PALETTE.clothRed : PALETTE.clothTan, 3, 2);
  }
}

export function drawSouthMeasureSampleBurner(ctx, cx, cy, seed) {
  drawIsoPrism(ctx, cx - 2, cy + 3, 62, 25, 12, {
    top: PALETTE.stoneLight,
    left: PALETTE.stoneMid,
    right: PALETTE.stoneDark,
    outline: PALETTE.outline
  });

  // A high offset retort and stack separate this clinical disposal burner
  // from a wash bench before any surface detail is read.
  px(ctx, cx + 17, cy - 91, PALETTE.outline, 15, 64);
  px(ctx, cx + 20, cy - 89, PALETTE.rustDark, 9, 59);
  px(ctx, cx + 21, cy - 88, PALETTE.rustLight, 3, 54);
  px(ctx, cx + 14, cy - 96, PALETTE.outline, 21, 8);
  px(ctx, cx + 17, cy - 98, PALETTE.stoneDust, 15, 5);
  px(ctx, cx + 20, cy - 96, PALETTE.stoneLight, 7, 2);

  poly(ctx, PALETTE.outline, [
    [cx + 8, cy - 74], [cx + 20, cy - 80], [cx + 34, cy - 73],
    [cx + 31, cy - 54], [cx + 24, cy - 47], [cx + 14, cy - 53]
  ]);
  poly(ctx, PALETTE.rustMid, [
    [cx + 11, cy - 72], [cx + 21, cy - 77], [cx + 30, cy - 71],
    [cx + 28, cy - 56], [cx + 23, cy - 51], [cx + 17, cy - 55]
  ]);
  linePx(ctx, cx + 13, cy - 71, cx + 27, cy - 68, PALETTE.rustLight, 2);
  px(ctx, cx + 14, cy - 63, PALETTE.outline, 18, 5);
  px(ctx, cx + 16, cy - 64, PALETTE.stoneDust, 14, 2);

  drawIsoPrism(ctx, cx - 7, cy - 4, 46, 22, 53, {
    top: PALETTE.stoneDust,
    left: PALETTE.rustMid,
    right: PALETTE.rustDark,
    outline: PALETTE.outline
  });

  // Deep shielding surrounds the orange disposal chamber. The flame reads as
  // contained equipment rather than a burner sitting on a work surface.
  px(ctx, cx - 26, cy - 49, PALETTE.outline, 38, 42);
  px(ctx, cx - 23, cy - 47, PALETTE.stoneDark, 32, 37);
  px(ctx, cx - 19, cy - 42, PALETTE.outline, 24, 27);
  px(ctx, cx - 16, cy - 39, PALETTE.void, 18, 21);
  px(ctx, cx - 15, cy - 32, PALETTE.rustDark, 16, 13);
  px(ctx, cx - 13, cy - 29, PALETTE.ember, 12, 10);
  px(ctx, cx - 10, cy - 31, PALETTE.hostGold, 6, 10);
  px(ctx, cx - 8, cy - 34, PALETTE.hostBone, 2, 5);
  px(ctx, cx - 24, cy - 51, PALETTE.stoneLight, 12, 4);
  px(ctx, cx - 9, cy - 51, PALETTE.stoneMid, 20, 4);
  px(ctx, cx - 28, cy - 45, PALETTE.outline, 7, 31);
  px(ctx, cx - 26, cy - 43, PALETTE.stoneMid, 3, 27);
  px(ctx, cx + 7, cy - 45, PALETTE.outline, 7, 31);
  px(ctx, cx + 8, cy - 43, PALETTE.rustDark, 3, 27);
  for (const hingeY of [cy - 40, cy - 21]) {
    px(ctx, cx + 9, hingeY, PALETTE.outline, 8, 7);
    px(ctx, cx + 10, hingeY + 1, PALETTE.hostGold, 5, 4);
  }

  // The left chute accepts sealed samples; the small blue bowl is a quench,
  // deliberately secondary to the hot chamber and tall exhaust hardware.
  poly(ctx, PALETTE.outline, [
    [cx - 37, cy - 45], [cx - 24, cy - 40],
    [cx - 24, cy - 29], [cx - 35, cy - 33]
  ]);
  poly(ctx, PALETTE.stoneMid, [
    [cx - 34, cy - 42], [cx - 26, cy - 39],
    [cx - 26, cy - 33], [cx - 33, cy - 36]
  ]);
  px(ctx, cx - 36, cy - 47, PALETTE.outline, 13, 6);
  px(ctx, cx - 33, cy - 48, PALETTE.clothRed, 7, 3);

  const quenchX = cx + 25;
  const quenchY = cy - 7;
  drawIsoDiamond(ctx, quenchX, quenchY, 25, 9, PALETTE.outline);
  drawIsoDiamond(ctx, quenchX - 1, quenchY - 1, 19, 5, PALETTE.clothBlueDark);
  linePx(ctx, cx + 9, cy - 16, quenchX - 5, quenchY - 5, PALETTE.outline, 6);
  linePx(ctx, cx + 10, cy - 18, quenchX - 5, quenchY - 7, PALETTE.clothBlue, 2);
  px(ctx, quenchX + 7, quenchY - 12, PALETTE.outline, 7, 12);
  px(ctx, quenchX + 9, quenchY - 11, PALETTE.stoneDust, 3, 9);

  px(ctx, cx - 24, cy - 9, PALETTE.outline, 17, 12);
  px(ctx, cx - 22, cy - 8, PALETTE.stoneDust, 13, 9);
  for (let row = 0; row < 3; row += 1) px(ctx, cx - 20, cy - 6 + row * 3, row === ((seed >>> 1) % 3) ? PALETTE.clothRed : PALETTE.stoneDark, 8 - row, 1);
  nativePx(ctx, cx - 9.5, cy - 28.5, PALETTE.hostBone);
}

export function drawSouthMeasureDrainReeds(ctx, cx, cy, seed) {
  const rng = rngFrom(hash2D(seed + 787, seed * 17 + 37));
  const prevailingLean = (seed & 1) ? -1 : 1;

  // A single wet root mat makes repeated tufts read as one drainage margin.
  poly(ctx, PALETTE.outline, [
    [cx - 21, cy + 1], [cx - 10, cy - 4], [cx + 7, cy - 3],
    [cx + 21, cy + 2], [cx + 13, cy + 7], [cx - 12, cy + 7]
  ]);
  poly(ctx, PALETTE.stoneDark, [
    [cx - 17, cy + 1], [cx - 8, cy - 2], [cx + 7, cy - 1],
    [cx + 17, cy + 2], [cx + 10, cy + 5], [cx - 11, cy + 5]
  ]);
  linePx(ctx, cx - 15, cy + 2, cx - 2, cy - 1, PALETTE.clothBlueDark, 2);
  linePx(ctx, cx + 3, cy + 1, cx + 15, cy + 3, PALETTE.clothBlue, 1);

  const stalks = [];
  const stalkCount = 8 + ((seed >>> 3) & 3);
  for (let i = 0; i < stalkCount; i += 1) {
    const x = cx - 20 + Math.floor(rng() * 41);
    const y = cy - 1 + Math.floor(rng() * 7);
    const height = 19 + Math.floor(rng() * 29);
    const lean = prevailingLean * (1 + Math.floor(rng() * 6));
    stalks.push({ x, y, height, lean, head: i % 2 === 0 });
  }
  stalks.sort((a, b) => a.y - b.y);
  for (const [index, stalk] of stalks.entries()) {
    const tipX = stalk.x + stalk.lean;
    const tipY = stalk.y - stalk.height;
    linePx(ctx, stalk.x, stalk.y, tipX, tipY, PALETTE.outline, 2);
    nativeLinePx(ctx, stalk.x + 0.5, stalk.y - 1.5, tipX + 0.5, tipY + 1.5, index % 4 === 0 ? PALETTE.limeMid : PALETTE.clayLight);
    if (stalk.head) {
      // Long tapered seed heads replace the former square pom-poms.
      const side = prevailingLean;
      linePx(ctx, tipX, tipY + 1, tipX + side * 3, tipY - 7, PALETTE.outline, 3);
      linePx(ctx, tipX + side, tipY, tipX + side * 2, tipY - 6, index & 2 ? PALETTE.clayDark : PALETTE.woodMid, 1);
      nativePx(ctx, tipX + side * 2 + 0.5, tipY - 5.5, PALETTE.clayLight);
    }
  }

  // A snapped reed lies across the wet base and breaks the repeated skyline.
  linePx(ctx, cx - prevailingLean * 2, cy - 2, cx + prevailingLean * 17, cy + 4, PALETTE.outline, 3);
  nativeLinePx(ctx, cx - prevailingLean * 1.5, cy - 2.5, cx + prevailingLean * 15.5, cy + 2.5, PALETTE.woodMid);
  nativePx(ctx, cx - 3.5, cy + 1.5, PALETTE.stoneDust);
}

export function southMeasureTumbleweedPose(seed, opts = {}) {
  const tick = Number.isFinite(opts.tick) ? opts.tick : 0;
  const phase = Number.isFinite(opts.phase) ? opts.phase : ((seed >>> 12) % 120) / 10;
  const period = 15 + ((seed >>> 3) % 11);
  const gustDuration = 3.4 + ((seed >>> 8) % 5) * 0.3;
  const elapsed = Math.max(0, tick + phase);
  const cycle = Math.floor(elapsed / period);
  const local = elapsed - cycle * period;
  const gusting = local < gustDuration;
  const progress = gusting ? local / gustDuration : 1;
  const laneAxis = opts.direction === -1 ? -1 : 1;
  const cycleDirection = ((cycle + (seed >>> 5)) & 1) === 0 ? laneAxis : -laneAxis;
  const halfTravel = 48 + ((seed >>> 10) % 18);
  const laneOffset = cycleDirection * halfTravel * (progress * 2 - 1);
  const laneSlope = (seed & 4) === 0 ? 0.13 : -0.1;
  const rollFrame = gusting ? (Math.floor(local * 10) + (seed & 7)) & 7 : seed & 7;
  const hopPattern = [0, 2, 5, 8, 6, 3, 1, 0];
  const hop = gusting ? hopPattern[rollFrame] : 0;
  return {
    offsetX: Math.round(laneOffset),
    offsetY: Math.round(laneOffset * laneSlope),
    rollFrame,
    hop,
    gusting
  };
}

export function drawSouthMeasureTumbleweed(ctx, cx, cy, seed, opts = {}) {
  const pose = southMeasureTumbleweedPose(seed, opts);
  const rollFrame = Number.isInteger(opts.rollFrame) ? opts.rollFrame & 7 : pose.rollFrame;
  const hop = Number.isFinite(opts.hop) ? opts.hop : pose.hop;
  const groundX = opts.fixed ? Math.round(cx) : Math.round(cx + pose.offsetX);
  const groundY = opts.fixed ? Math.round(cy) : Math.round(cy + pose.offsetY);
  const weedX = groundX;
  const weedY = groundY - 17 - hop;


  // The eight discrete transforms make a real rolling silhouette without
  // canvas rotation, antialiasing, or interpolated pixels.
  const diagonal = Math.SQRT1_2;
  const cos = [1, diagonal, 0, -diagonal, -1, -diagonal, 0, diagonal][rollFrame];
  const sin = [0, diagonal, 1, diagonal, 0, -diagonal, -1, -diagonal][rollFrame];
  const rng = rngFrom(hash2D(seed + 827, seed * 23 + 47));
  const baseNodes = [
    [-15, -2], [-11, -10], [-3, -16], [7, -14], [15, -6],
    [16, 4], [9, 12], [1, 15], [-9, 12], [-15, 6]
  ];
  const nodes = baseNodes.map(([x, y], index) => [
    x + (index % 3 === 0 ? Math.floor(rng() * 3) - 1 : 0),
    y + (index % 2 === 0 ? Math.floor(rng() * 3) - 1 : 0)
  ]);
  const innerNodes = [
    [-9, -3], [-5, -10], [3, -9], [9, -2],
    [7, 7], [-1, 10], [-8, 5]
  ];
  const rotate = ([x, y]) => [
    weedX + Math.round(x * cos - y * sin),
    weedY + Math.round(x * sin + y * cos)
  ];
  const segments = [
    // Broken outer arcs avoid a clean wheel rim.
    [nodes[0], nodes[1]], [nodes[1], nodes[2]],
    [nodes[3], nodes[4]], [nodes[4], nodes[5]],
    [nodes[6], nodes[7]], [nodes[8], nodes[9]], [nodes[9], nodes[0]],
    // Crooked connections form a tangled inner cage instead of radial spokes.
    [nodes[0], innerNodes[0]], [nodes[1], innerNodes[1]],
    [nodes[2], innerNodes[2]], [nodes[3], innerNodes[2]],
    [nodes[4], innerNodes[3]], [nodes[5], innerNodes[4]],
    [nodes[6], innerNodes[4]], [nodes[7], innerNodes[5]],
    [nodes[8], innerNodes[6]], [nodes[9], innerNodes[6]],
    [innerNodes[0], innerNodes[1]], [innerNodes[1], innerNodes[3]],
    [innerNodes[1], innerNodes[5]], [innerNodes[2], innerNodes[3]],
    [innerNodes[2], innerNodes[6]], [innerNodes[3], innerNodes[4]],
    [innerNodes[4], innerNodes[5]], [innerNodes[5], innerNodes[6]],
    [innerNodes[6], innerNodes[0]],
    // Loose, snapped growth breaks the round silhouette.
    [nodes[0], [-21, -6]], [nodes[1], [-16, -15]],
    [nodes[3], [10, -21]], [nodes[4], [22, -9]],
    [nodes[6], [16, 16]], [nodes[8], [-13, 19]], [nodes[9], [-22, 10]]
  ];

  for (const [from, to] of segments) {
    const a = rotate(from);
    const b = rotate(to);
    linePx(ctx, a[0], a[1], b[0], b[1], PALETTE.outline, 2);
  }
  for (const [index, [from, to]] of segments.entries()) {
    const a = rotate(from);
    const b = rotate(to);
    const midpointX = (from[0] + to[0]) / 2;
    const midpointY = (from[1] + to[1]) / 2;
    const color = midpointX + midpointY < -4
      ? PALETTE.clayLight
      : index % 3 === 0 ? PALETTE.woodLight : index % 2 === 0 ? PALETTE.clayMid : PALETTE.woodMid;
    nativeLinePx(ctx, a[0] + 0.5, a[1] + 0.5, b[0] + 0.5, b[1] + 0.5, color);
  }

  // One long fork and an off-center knot keep the spin readable even at the
  // weed's most circular frames.
  const forkBase = rotate(nodes[2]);
  const forkTip = rotate([-6, -22]);
  const forkSide = rotate([1, -20]);
  linePx(ctx, forkBase[0], forkBase[1], forkTip[0], forkTip[1], PALETTE.outline, 2);
  linePx(ctx, forkTip[0], forkTip[1], forkSide[0], forkSide[1], PALETTE.outline, 2);
  nativeLinePx(ctx, forkBase[0] + 0.5, forkBase[1] + 0.5, forkTip[0] + 0.5, forkTip[1] + 0.5, PALETTE.clayLight);
  nativeLinePx(ctx, forkTip[0] + 0.5, forkTip[1] + 0.5, forkSide[0] + 0.5, forkSide[1] + 0.5, PALETTE.woodLight);

  const knotOutline = [[-6, 1], [-3, -3], [1, -2], [3, 2], [0, 5], [-4, 4]].map(rotate);
  const knotFill = [[-4, 1], [-2, -1], [0, -1], [1, 2], [-1, 3], [-3, 3]].map(rotate);
  poly(ctx, PALETTE.outline, knotOutline);
  poly(ctx, PALETTE.clayDark, knotFill);
  const knotLight = rotate([-3, 0]);
  nativePx(ctx, knotLight[0] + 0.5, knotLight[1] + 0.5, PALETTE.clayLight);
}

export function drawSouthMeasureServicePack(ctx, cx, cy, seed, opts = {}) {
  const opened = Boolean(opts.opened);
  const rng = rngFrom(hash2D(seed + 809, seed * 19 + 41));

  // Loose shoulder straps sit behind the load. Their bent runs keep the pack
  // from reading as a rigid case or a tiny chair.
  linePx(ctx, cx - 11, cy - 20, cx - 18, cy - 31, PALETTE.outline, 3);
  linePx(ctx, cx - 18, cy - 31, cx - 8, cy - 38, PALETTE.outline, 3);
  nativeLinePx(ctx, cx - 10.5, cy - 20.5, cx - 16.5, cy - 30.5, PALETTE.stoneMid);
  linePx(ctx, cx + 8, cy - 22, cx + 15, cy - 32, PALETTE.outline, 3);
  linePx(ctx, cx + 15, cy - 32, cx + 6, cy - 38, PALETTE.outline, 3);
  nativeLinePx(ctx, cx + 8.5, cy - 22.5, cx + 13.5, cy - 31.5, PALETTE.rustMid);

  // The waxed canvas body has a shouldered top, soft sides, and a sagging
  // lower seam. Separate light and shade planes describe its stuffed volume.
  poly(ctx, PALETTE.outline, [
    [cx - 17, cy - 25], [cx - 8, cy - 34], [cx + 7, cy - 33],
    [cx + 16, cy - 25], [cx + 19, cy - 7], [cx + 11, cy + 4],
    [cx + 1, cy + 8], [cx - 13, cy + 4], [cx - 19, cy - 7]
  ]);
  poly(ctx, PALETTE.clothDark, [
    [cx - 14, cy - 24], [cx - 7, cy - 31], [cx + 6, cy - 30],
    [cx + 13, cy - 23], [cx + 16, cy - 8], [cx + 9, cy + 1],
    [cx, cy + 5], [cx - 11, cy + 1], [cx - 16, cy - 8]
  ]);
  poly(ctx, PALETTE.stoneMid, [
    [cx - 14, cy - 24], [cx - 7, cy - 31], [cx - 2, cy - 29],
    [cx - 3, cy + 3], [cx - 11, cy + 1], [cx - 16, cy - 8]
  ]);
  poly(ctx, PALETTE.rustDark, [
    [cx - 2, cy - 29], [cx + 6, cy - 30], [cx + 13, cy - 23],
    [cx + 16, cy - 8], [cx + 9, cy + 1], [cx - 3, cy + 3]
  ]);

  if (opened) {
    // The dark mouth stays attached to the soft body. The flap drops forward
    // and exposes wrapped dressings and a short handled tool.
    poly(ctx, PALETTE.outline, [
      [cx - 14, cy - 24], [cx - 6, cy - 32], [cx + 8, cy - 30],
      [cx + 13, cy - 23], [cx + 5, cy - 17], [cx - 8, cy - 18]
    ]);
    poly(ctx, PALETTE.void, [
      [cx - 10, cy - 24], [cx - 5, cy - 29], [cx + 6, cy - 27],
      [cx + 9, cy - 23], [cx + 3, cy - 20], [cx - 7, cy - 20]
    ]);
    px(ctx, cx - 6, cy - 24, PALETTE.hostBone, 10, 3);
    px(ctx, cx + 3, cy - 25, PALETTE.clothBlue, 5, 4);
    linePx(ctx, cx + 6, cy - 25, cx + 13, cy - 37, PALETTE.outline, 3);
    linePx(ctx, cx + 6, cy - 25, cx + 12, cy - 36, PALETTE.rustLight, 1);
    poly(ctx, PALETTE.outline, [
      [cx - 10, cy - 18], [cx + 6, cy - 20], [cx + 13, cy - 10],
      [cx + 3, cy - 4], [cx - 10, cy - 7]
    ]);
    poly(ctx, PALETTE.clothTan, [
      [cx - 7, cy - 16], [cx + 5, cy - 18], [cx + 10, cy - 11],
      [cx + 2, cy - 7], [cx - 7, cy - 9]
    ]);
  } else {
    // A broad rain flap follows the stuffed body instead of forming a second
    // box. Twin straps terminate at small, uneven buckles.
    poly(ctx, PALETTE.outline, [
      [cx - 14, cy - 25], [cx - 7, cy - 32], [cx + 7, cy - 30],
      [cx + 14, cy - 23], [cx + 10, cy - 12], [cx - 9, cy - 11]
    ]);
    poly(ctx, PALETTE.clothTan, [
      [cx - 11, cy - 24], [cx - 6, cy - 29], [cx + 5, cy - 27],
      [cx + 11, cy - 22], [cx + 7, cy - 15], [cx - 7, cy - 14]
    ]);
    nativeLinePx(ctx, cx - 9.5, cy - 23.5, cx + 7.5, cy - 25.5, PALETTE.stoneDust);
    for (const x of [cx - 5, cx + 5]) {
      linePx(ctx, x, cy - 25, x - 1, cy - 8, PALETTE.outline, 3);
      linePx(ctx, x - 1, cy - 24, x - 2, cy - 10, PALETTE.rustLight, 1);
      px(ctx, x - 4, cy - 11, PALETTE.outline, 7, 6);
      px(ctx, x - 2, cy - 10, PALETTE.hostGold, 3, 3);
    }
  }

  // A tied blanket roll gives the load a familiar pack silhouette before the
  // smaller drainage fittings are read.
  px(ctx, cx - 14, cy - 38, PALETTE.outline, 29, 9);
  px(ctx, cx - 12, cy - 37, PALETTE.clothTan, 25, 6);
  px(ctx, cx - 10, cy - 37, PALETTE.stoneDust, 8, 2);
  for (const x of [cx - 7, cx + 7]) {
    px(ctx, x - 1, cy - 39, PALETTE.outline, 3, 10);
    nativePx(ctx, x - 0.5, cy - 37.5, PALETTE.rustLight);
  }

  // A patched side pocket and an oval coil identify drainage-service gear
  // without overwhelming the pack's silhouette.
  poly(ctx, PALETTE.outline, [
    [cx - 18, cy - 12], [cx - 10, cy - 15], [cx - 6, cy - 8],
    [cx - 10, cy], [cx - 18, cy - 3]
  ]);
  poly(ctx, PALETTE.woodMid, [
    [cx - 15, cy - 11], [cx - 11, cy - 12], [cx - 9, cy - 8],
    [cx - 11, cy - 3], [cx - 15, cy - 5]
  ]);
  nativeLinePx(ctx, cx - 14.5, cy - 10.5, cx - 10.5, cy - 11.5, PALETTE.woodLight);

  poly(ctx, PALETTE.outline, [
    [cx + 10, cy - 14], [cx + 15, cy - 18], [cx + 21, cy - 16],
    [cx + 24, cy - 10], [cx + 21, cy - 4], [cx + 15, cy - 3],
    [cx + 10, cy - 7]
  ]);
  poly(ctx, PALETTE.clothBlueDark, [
    [cx + 13, cy - 13], [cx + 16, cy - 15], [cx + 19, cy - 14],
    [cx + 21, cy - 10], [cx + 19, cy - 6], [cx + 16, cy - 6],
    [cx + 13, cy - 8]
  ]);
  px(ctx, cx + 15, cy - 12, PALETTE.void, 5, 5);
  nativePx(ctx, cx + 14.5, cy - 14.5, PALETTE.clothBlue);
  linePx(ctx, cx + 10, cy - 10, cx + 21, cy - 3, PALETTE.outline, 2);
  nativeLinePx(ctx, cx + 10.5, cy - 10.5, cx + 20.5, cy - 3.5, PALETTE.rustLight);

  for (let i = 0; i < 4; i += 1) {
    const x = cx - 8 + Math.floor(rng() * 17);
    const y = cy - 6 + Math.floor(rng() * 9);
    nativePx(ctx, x + 0.5, y + 0.5, i === 0 ? PALETTE.stoneDust : PALETTE.rustDark);
  }
  nativeLinePx(ctx, cx - 12.5, cy - 5.5, cx + 7.5, cy + 0.5, PALETTE.stoneDark);
}
