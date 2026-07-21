import { PALETTE } from '../palette.js';
import {
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

function drawRaisedWheel(ctx, cx, cy, radius = 9) {
  const rows = [5, 7, 9, 11, 13, 15, 17, 17, 17, 15, 13, 11, 9, 7, 5];
  const top = cy - Math.floor(rows.length / 2);
  for (let row = 0; row < rows.length; row += 1) {
    const w = rows[row];
    const x = cx - Math.floor(w / 2);
    px(ctx, x, top + row, PALETTE.outline, w, 1);
    if (row > 1 && row < rows.length - 2 && w > 7) {
      px(ctx, x + 2, top + row, PALETTE.void, w - 4, 1);
    }
    const litRim = row < Math.floor(rows.length / 2) ? PALETTE.woodLight : PALETTE.woodMid;
    const shadeRim = row < Math.floor(rows.length / 2) ? PALETTE.woodMid : PALETTE.woodDark;
    px(ctx, x + 1, top + row, litRim, Math.min(2, Math.max(1, w - 2)), 1);
    px(ctx, x + Math.max(1, w - 3), top + row, shadeRim, Math.min(2, Math.max(1, w - 2)), 1);
  }
  linePx(ctx, cx - radius + 2, cy, cx + radius - 2, cy, PALETTE.woodMid, 1);
  linePx(ctx, cx, cy - radius + 2, cx, cy + radius - 2, PALETTE.woodDark, 1);
  linePx(ctx, cx - 6, cy - 5, cx + 6, cy + 5, PALETTE.woodMid, 1);
  linePx(ctx, cx + 6, cy - 5, cx - 6, cy + 5, PALETTE.woodDark, 1);
  px(ctx, cx - 3, cy - 3, PALETTE.outline, 7, 7);
  px(ctx, cx - 1, cy - 1, PALETTE.rustMid, 3, 3);
  px(ctx, cx - 1, cy - 1, PALETTE.rustLight, 1, 1);
}

function drawBrokenFlatWheel(ctx, cx, cy) {
  poly(ctx, PALETTE.outline, [
    [cx, cy - 5], [cx + 13, cy], [cx + 15, cy + 4], [cx + 2, cy + 7], [cx - 13, cy + 3], [cx - 12, cy]
  ]);
  poly(ctx, PALETTE.woodDark, [
    [cx, cy - 3], [cx + 10, cy], [cx + 11, cy + 2], [cx + 1, cy + 5], [cx - 10, cy + 2], [cx - 9, cy]
  ]);
  linePx(ctx, cx - 9, cy + 1, cx + 10, cy + 2, PALETTE.woodMid, 1);
  linePx(ctx, cx, cy - 2, cx + 1, cy + 5, PALETTE.woodLight, 1);
  px(ctx, cx - 2, cy, PALETTE.rustDark, 5, 4);
  linePx(ctx, cx + 9, cy - 2, cx + 16, cy - 6, PALETTE.hostBone, 1);
}

export function drawOverturnedFieldCart(ctx, cx, cy, seed, opts = {}) {
  const frame = isoFrame(cx, cy, opts.orient ?? 'sw');
  const rng = rngFrom(hash2D(seed + 307, seed * 7 + 19));

  // The bed is down on one edge. Its near rail points upward, which separates
  // this silhouette from the ordinary loaded cart used elsewhere on the road.
  const bed = orientedBox(ctx, frame, 0.72, 0.34, 6, {
    top: PALETTE.woodLight,
    lit: PALETTE.woodMid,
    shade: PALETTE.woodDark,
    outline: PALETTE.outline
  }, 2);
  for (const lb of [-0.13, 0.03, 0.17]) {
    const a = frame.point(-0.34, lb, 9);
    const b = frame.point(0.34, lb, 9);
    linePx(ctx, a[0], a[1], b[0], b[1], PALETTE.outline, 3);
    linePx(ctx, a[0], a[1] - 1, b[0], b[1] - 1, lb < 0 ? PALETTE.woodLight : PALETTE.woodDark, 1);
  }
  const railA = frame.point(-0.36, 0.2, 8);
  const railB = frame.point(0.34, 0.2, 27);
  linePx(ctx, railA[0], railA[1], railB[0], railB[1], PALETTE.outline, 4);
  linePx(ctx, railA[0], railA[1] - 1, railB[0], railB[1] - 1, PALETTE.woodMid, 2);
  for (const la of [-0.28, -0.04, 0.2]) {
    const low = frame.point(la, 0.2, 8 + Math.round((la + 0.28) * 21));
    const high = frame.point(la, 0.2, 17 + Math.round((la + 0.28) * 21));
    linePx(ctx, low[0], low[1], high[0], high[1], PALETTE.outline, 3);
    linePx(ctx, low[0], low[1], high[0], high[1], PALETTE.woodLight, 1);
  }

  const axleA = frame.point(-0.42, 0.19, 10);
  const axleB = frame.point(0.42, 0.19, 10);
  linePx(ctx, axleA[0], axleA[1], axleB[0], axleB[1], PALETTE.outline, 4);
  linePx(ctx, axleA[0], axleA[1] - 1, axleB[0], axleB[1] - 1, PALETTE.rustDark, 2);
  const raised = frame.point(0.36, 0.22, 16);
  drawRaisedWheel(ctx, raised[0], raised[1], 9);
  const flat = frame.point(-0.39, 0.25, 0);
  drawBrokenFlatWheel(ctx, flat[0], flat[1] + 2);

  const tongueA = frame.point(-0.38, -0.08, 5);
  const tongueB = frame.point(-0.86, -0.08, 1);
  linePx(ctx, tongueA[0], tongueA[1], tongueB[0], tongueB[1], PALETTE.outline, 5);
  linePx(ctx, tongueA[0], tongueA[1] - 1, tongueB[0], tongueB[1] - 1, PALETTE.woodMid, 2);
  px(ctx, tongueB[0] - 2, tongueB[1] - 2, PALETTE.rustDark, 5, 4);

  // A little charcoal remains in the tipped bed and beneath the axle.
  for (let i = 0; i < 8; i += 1) {
    const x = bed.cap.left[0] + 5 + Math.floor(rng() * 29);
    const y = bed.cap.top[1] + 4 + Math.floor(rng() * 10);
    px(ctx, x, y, i % 3 === 0 ? PALETTE.stoneMid : PALETTE.void, 2 + (i & 1), 1 + (i % 2));
  }
  for (let i = 0; i < 6; i += 1) {
    px(ctx, cx - 28 + Math.floor(rng() * 28), cy + 3 + Math.floor(rng() * 7), PALETTE.stoneDark, 2, 1);
  }
  nativeLinePx(ctx, bed.cap.left[0] + 1.5, bed.cap.left[1] - 0.5, bed.cap.top[0] - 1.5, bed.cap.top[1] + 0.5, PALETTE.woodLight);
  nativeLinePx(ctx, railA[0] + 0.5, railA[1] - 1.5, railB[0] - 0.5, railB[1] - 1.5, PALETTE.woodLight);
  nativeLinePx(ctx, axleA[0] + 0.5, axleA[1] - 1.5, axleB[0] - 0.5, axleB[1] - 1.5, PALETTE.rustMid);
  nativeLinePx(ctx, tongueA[0], tongueA[1] - 1.5, tongueB[0], tongueB[1] - 1.5, PALETTE.woodLight);
  nativeLinePx(ctx, raised[0] - 7.5, raised[1] - 0.5, raised[0] + 7.5, raised[1] - 0.5, PALETTE.woodLight);
  nativeLinePx(ctx, raised[0] - 0.5, raised[1] - 7.5, raised[0] - 0.5, raised[1] + 7.5, PALETTE.woodMid);
  nativeLinePx(ctx, flat[0] - 8.5, flat[1] + 2.5, flat[0] + 9.5, flat[1] + 3.5, PALETTE.woodMid);
  nativePx(ctx, raised[0] - 0.5, raised[1] - 0.5, PALETTE.rustLight);
}

export function drawStageIvCartLure(ctx, cx, cy, seed, opts = {}) {
  const frame = isoFrame(cx, cy, opts.orient ?? 'sw');
  const rng = rngFrom(hash2D(seed + 313, seed * 11 + 23));

  const boots = frame.point(0.37, -0.05, 1);
  const hips = frame.point(0.08, -0.02, 3);
  const shoulders = frame.point(-0.17, 0.01, 4);
  const head = frame.point(-0.35, 0.02, 4);

  // Legs remain narrow and jointed. The body is a prone adult, not a bundled
  // marker or a reduced chibi figure.
  linePx(ctx, hips[0], hips[1], boots[0] - 2, boots[1], PALETTE.outline, 7);
  linePx(ctx, hips[0], hips[1] - 1, boots[0] - 2, boots[1] - 1, PALETTE.stoneMid, 4);
  linePx(ctx, hips[0] + 1, hips[1] + 2, boots[0] + 3, boots[1] + 4, PALETTE.outline, 6);
  linePx(ctx, hips[0] + 1, hips[1] + 1, boots[0] + 3, boots[1] + 3, PALETTE.stoneDark, 3);
  px(ctx, boots[0] - 5, boots[1] - 2, PALETTE.void, 10, 5);
  px(ctx, boots[0] - 4, boots[1] - 3, PALETTE.woodMid, 7, 3);
  px(ctx, boots[0] + 1, boots[1] + 1, PALETTE.void, 9, 4);
  px(ctx, boots[0] + 2, boots[1], PALETTE.woodDark, 6, 3);

  linePx(ctx, hips[0], hips[1], shoulders[0], shoulders[1], PALETTE.outline, 15);
  linePx(ctx, hips[0], hips[1] - 2, shoulders[0], shoulders[1] - 2, PALETTE.stoneMid, 11);
  linePx(ctx, hips[0] - 1, hips[1] - 4, shoulders[0] - 1, shoulders[1] - 4, PALETTE.stoneDust, 3);
  linePx(ctx, hips[0] + 2, hips[1] + 2, shoulders[0] + 2, shoulders[1] + 2, PALETTE.woodDark, 3);
  px(ctx, hips[0] - 5, hips[1] - 5, PALETTE.rustDark, 10, 2);

  // A slack sleeve reaches toward the road. The other arm disappears under
  // the cart-side shoulder, helping the pose read as pinned at first glance.
  const elbow = frame.point(-0.12, 0.18, 1);
  const hand = frame.point(-0.02, 0.36, 0);
  linePx(ctx, shoulders[0], shoulders[1], elbow[0], elbow[1], PALETTE.outline, 7);
  linePx(ctx, shoulders[0], shoulders[1] - 1, elbow[0], elbow[1] - 1, PALETTE.stoneMid, 4);
  linePx(ctx, elbow[0], elbow[1], hand[0], hand[1], PALETTE.outline, 5);
  linePx(ctx, elbow[0], elbow[1] - 1, hand[0], hand[1] - 1, PALETTE.skinDark, 2);
  px(ctx, hand[0] - 2, hand[1] - 2, PALETTE.skinMid, 5, 4);
  px(ctx, hand[0] - 1, hand[1] - 2, PALETTE.skinLight, 2, 1);

  px(ctx, head[0] - 5, head[1] - 5, PALETTE.outline, 11, 10);
  px(ctx, head[0] - 4, head[1] - 4, PALETTE.skinDark, 9, 8);
  px(ctx, head[0] - 3, head[1] - 4, PALETTE.skinMid, 5, 3);
  px(ctx, head[0] - 5, head[1] - 7, PALETTE.stoneLight, 10, 5);
  px(ctx, head[0] - 3, head[1] - 7, PALETTE.stoneDust, 5, 2);
  px(ctx, head[0] + 1, head[1] - 1, PALETTE.void, 2, 1);
  px(ctx, head[0] + 3, head[1] + 2, PALETTE.hostGold, 1, 1);

  for (let i = 0; i < 5; i += 1) {
    const x = cx - 22 + Math.floor(rng() * 44);
    const y = cy + 1 + Math.floor(rng() * 8);
    px(ctx, x, y, i & 1 ? PALETTE.stoneDark : PALETTE.rustDark, 2, 1);
  }
  // Fine coat stitching, a face-plane highlight, boot seams, and separated
  // fingers reinforce the prone adult read at native 2x.
  nativeLinePx(ctx, shoulders[0] - 0.5, shoulders[1] - 3.5, hips[0] - 0.5, hips[1] - 3.5, PALETTE.stoneDust);
  nativeLinePx(ctx, boots[0] - 4.5, boots[1] - 3.5, boots[0] + 1.5, boots[1] - 2.5, PALETTE.woodLight);
  nativeLinePx(ctx, head[0] - 2.5, head[1] - 4.5, head[0] + 1.5, head[1] - 3.5, PALETTE.skinMid);
  for (const dx of [-1.5, -0.5, 0.5]) nativePx(ctx, hand[0] + dx, hand[1] - 2.5, PALETTE.skinLight);
}
