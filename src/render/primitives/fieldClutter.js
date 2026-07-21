import { PALETTE } from '../palette.js';
import {
  hash2D,
  linePx,
  nativeLinePx,
  nativePx,
  poly,
  px,
  rngFrom
} from './basePixels.js';

// Portable field caches and low roadside growth. These pieces share the same
// worn materials and small ground footprint, but remain separate catalog kinds
// so content can attach loot only where it belongs.

export function drawFieldBackpack(ctx, cx, cy, seed, opts = {}) {
  const rng = rngFrom(hash2D(seed + 311, seed * 7 + 43));
  const opened = Boolean(opts.opened);

  // Shoulder loops sit behind the pack and keep the silhouette distinct from
  // the flatter field satchel.
  linePx(ctx, cx - 11, cy - 19, cx - 15, cy - 34, PALETTE.outline, 3);
  linePx(ctx, cx - 15, cy - 34, cx - 4, cy - 39, PALETTE.outline, 3);
  linePx(ctx, cx - 10, cy - 20, cx - 13, cy - 33, PALETTE.clothDark, 1);
  linePx(ctx, cx - 13, cy - 33, cx - 4, cy - 37, PALETTE.stoneMid, 1);
  linePx(ctx, cx + 8, cy - 22, cx + 12, cy - 34, PALETTE.outline, 3);
  linePx(ctx, cx + 12, cy - 34, cx + 4, cy - 39, PALETTE.outline, 3);
  linePx(ctx, cx + 9, cy - 22, cx + 11, cy - 33, PALETTE.clothDark, 1);
  linePx(ctx, cx + 11, cy - 33, cx + 4, cy - 37, PALETTE.stoneDark, 1);

  // Tall canvas body. The left plane catches the upper-left light while the
  // right side falls into rust-dark shade.
  poly(ctx, PALETTE.outline, [
    [cx - 17, cy - 23],
    [cx - 5, cy - 32],
    [cx + 13, cy - 27],
    [cx + 18, cy - 8],
    [cx + 8, cy + 5],
    [cx - 13, cy + 2],
    [cx - 18, cy - 10]
  ]);
  poly(ctx, PALETTE.clothDark, [
    [cx - 14, cy - 21],
    [cx - 4, cy - 29],
    [cx + 11, cy - 25],
    [cx + 15, cy - 8],
    [cx + 6, cy + 2],
    [cx - 11, cy],
    [cx - 15, cy - 10]
  ]);
  poly(ctx, PALETTE.stoneMid, [
    [cx - 14, cy - 21],
    [cx - 4, cy - 29],
    [cx - 3, cy - 5],
    [cx - 11, cy],
    [cx - 15, cy - 10]
  ]);
  poly(ctx, PALETTE.rustDark, [
    [cx - 3, cy - 5],
    [cx + 11, cy - 25],
    [cx + 15, cy - 8],
    [cx + 6, cy + 2]
  ]);

  if (opened) {
    // The mouth stays tall and dark while the rain flap hangs down the front.
    // The pack keeps its original mass instead of collapsing into a tiny icon.
    poly(ctx, PALETTE.outline, [
      [cx - 14, cy - 22],
      [cx - 4, cy - 29],
      [cx + 12, cy - 25],
      [cx + 6, cy - 16],
      [cx - 9, cy - 14]
    ]);
    poly(ctx, PALETTE.void, [
      [cx - 10, cy - 22],
      [cx - 3, cy - 27],
      [cx + 8, cy - 24],
      [cx + 4, cy - 18],
      [cx - 7, cy - 16]
    ]);
    px(ctx, cx - 7, cy - 19, PALETTE.stoneDust, 8, 1);
    poly(ctx, PALETTE.outline, [
      [cx - 9, cy - 14],
      [cx + 5, cy - 17],
      [cx + 12, cy - 8],
      [cx + 2, cy - 1],
      [cx - 10, cy - 5]
    ]);
    poly(ctx, PALETTE.clothTan, [
      [cx - 6, cy - 13],
      [cx + 4, cy - 15],
      [cx + 9, cy - 8],
      [cx + 1, cy - 3],
      [cx - 7, cy - 6]
    ]);
    px(ctx, cx - 1, cy - 10, PALETTE.stoneDust, 5, 1);
    px(ctx, cx + 1, cy - 7, PALETTE.rustDark, 3, 3);
  } else {
    // Broad rain flap and off-center buckle make the closed state readable.
    poly(ctx, PALETTE.outline, [
      [cx - 14, cy - 23],
      [cx - 4, cy - 31],
      [cx + 12, cy - 26],
      [cx + 9, cy - 14],
      [cx - 9, cy - 11]
    ]);
    poly(ctx, PALETTE.clothTan, [
      [cx - 11, cy - 22],
      [cx - 3, cy - 28],
      [cx + 9, cy - 25],
      [cx + 6, cy - 16],
      [cx - 7, cy - 14]
    ]);
    linePx(ctx, cx - 9, cy - 21, cx + 7, cy - 24, PALETTE.stoneDust, 1);
    px(ctx, cx - 1, cy - 17, PALETTE.outline, 5, 6);
    px(ctx, cx, cy - 16, PALETTE.rustLight, 3, 3);
  }

  // One side pocket and a loose strap stop the pack reading as a clean box.
  poly(ctx, PALETTE.outline, [
    [cx - 16, cy - 9],
    [cx - 8, cy - 12],
    [cx - 5, cy - 4],
    [cx - 11, cy + 1],
    [cx - 17, cy - 2]
  ]);
  poly(ctx, PALETTE.woodMid, [
    [cx - 14, cy - 8],
    [cx - 9, cy - 10],
    [cx - 7, cy - 4],
    [cx - 11, cy - 1],
    [cx - 15, cy - 3]
  ]);
  px(ctx, cx - 12, cy - 8, PALETTE.woodLight, 4, 1);
  linePx(ctx, cx + 11, cy - 6, cx + 22, cy + 5, PALETTE.outline, 2);
  linePx(ctx, cx + 11, cy - 6, cx + 21, cy + 4, PALETTE.skinDark, 1);
  px(ctx, cx + 18, cy + 4, PALETTE.rustLight, 4, 1);

  for (let i = 0; i < 5; i += 1) {
    const x = cx - 9 + Math.floor(rng() * 20);
    const y = cy - 13 + Math.floor(rng() * 12);
    px(ctx, x, y, i % 2 ? PALETTE.stoneDark : PALETTE.rustDark, 1, 1);
  }

  // Half-logical-pixel seams preserve the coarse canvas silhouette while the
  // native backing store resolves stitching, strap wear, and buckle edges.
  nativeLinePx(ctx, cx - 12.5, cy - 19.5, cx - 10.5, cy - 3.5, PALETTE.stoneDust);
  nativeLinePx(ctx, cx + 10.5, cy - 22.5, cx + 13.5, cy - 9.5, PALETTE.rustMid);
  nativeLinePx(ctx, cx - 13.5, cy - 7.5, cx - 8.5, cy - 9.5, PALETTE.woodLight);
  nativeLinePx(ctx, cx + 12.5, cy - 5.5, cx + 20.5, cy + 3.5, PALETTE.skinMid);
  if (opened) {
    nativeLinePx(ctx, cx - 7.5, cy - 18.5, cx + 3.5, cy - 21.5, PALETTE.stoneMid);
    nativeLinePx(ctx, cx - 5.5, cy - 12.5, cx + 5.5, cy - 9.5, PALETTE.stoneDust);
    nativePx(ctx, cx + 0.5, cy - 7.5, PALETTE.rustLight);
  } else {
    nativeLinePx(ctx, cx - 8.5, cy - 20.5, cx + 7.5, cy - 23.5, PALETTE.hostBone);
    nativePx(ctx, cx - 0.5, cy - 15.5, PALETTE.stoneLight, 1, 0.5);
  }
}

export function drawSmallPouch(ctx, cx, cy, seed, opts = {}) {
  const rng = rngFrom(hash2D(seed + 337, seed * 11 + 47));
  const opened = Boolean(opts.opened);

  // The cord lies on the ground rather than floating around the neck.
  linePx(ctx, cx - 7, cy - 4, cx - 18, cy + 3, PALETTE.outline, 2);
  linePx(ctx, cx - 7, cy - 4, cx - 17, cy + 2, PALETTE.rustLight, 1);
  linePx(ctx, cx - 17, cy + 2, cx - 10, cy + 6, PALETTE.clothTan, 1);

  poly(ctx, PALETTE.outline, [
    [cx - 11, cy - 8],
    [cx - 6, cy - 14],
    [cx + 6, cy - 14],
    [cx + 12, cy - 7],
    [cx + 10, cy + 2],
    [cx + 2, cy + 7],
    [cx - 10, cy + 4],
    [cx - 13, cy - 2]
  ]);
  poly(ctx, PALETTE.skinDark, [
    [cx - 9, cy - 7],
    [cx - 5, cy - 12],
    [cx + 5, cy - 12],
    [cx + 10, cy - 6],
    [cx + 8, cy + 1],
    [cx + 1, cy + 5],
    [cx - 8, cy + 2],
    [cx - 11, cy - 2]
  ]);
  poly(ctx, PALETTE.rustMid, [
    [cx - 9, cy - 7],
    [cx - 5, cy - 12],
    [cx - 4, cy + 1],
    [cx - 8, cy + 2],
    [cx - 11, cy - 2]
  ]);
  poly(ctx, PALETTE.rustDark, [
    [cx - 4, cy + 1],
    [cx + 5, cy - 12],
    [cx + 10, cy - 6],
    [cx + 8, cy + 1],
    [cx + 1, cy + 5]
  ]);

  if (opened) {
    // A loosened diamond rim exposes the empty pouch, with the drawstring
    // fallen to one side.
    poly(ctx, PALETTE.outline, [
      [cx - 9, cy - 8],
      [cx, cy - 14],
      [cx + 10, cy - 8],
      [cx + 1, cy - 3]
    ]);
    poly(ctx, PALETTE.void, [
      [cx - 6, cy - 8],
      [cx, cy - 12],
      [cx + 7, cy - 8],
      [cx + 1, cy - 5]
    ]);
    px(ctx, cx - 5, cy - 8, PALETTE.rustLight, 6, 1);
    linePx(ctx, cx + 7, cy - 7, cx + 16, cy + 1, PALETTE.outline, 2);
    linePx(ctx, cx + 7, cy - 7, cx + 15, cy, PALETTE.clothTan, 1);
  } else {
    px(ctx, cx - 7, cy - 12, PALETTE.outline, 15, 4);
    px(ctx, cx - 5, cy - 11, PALETTE.clothTan, 11, 2);
    px(ctx, cx - 1, cy - 10, PALETTE.rustLight, 3, 4);
    px(ctx, cx, cy - 7, PALETTE.hostBone, 1, 2);
  }

  linePx(ctx, cx - 7, cy - 1, cx + 7, cy + 2, PALETTE.woodDark, 1);
  px(ctx, cx - 7, cy - 3, PALETTE.rustLight, 5, 1);
  for (let i = 0; i < 3; i += 1) {
    const x = cx - 7 + Math.floor(rng() * 15);
    const y = cy - 5 + Math.floor(rng() * 8);
    px(ctx, x, y, i === 0 ? PALETTE.stoneDark : PALETTE.rustDark, 1, 1);
  }
  nativeLinePx(ctx, cx - 7.5, cy - 6.5, cx + 2.5, cy - 4.5, PALETTE.rustLight);
  nativeLinePx(ctx, cx - 4.5, cy + 0.5, cx + 4.5, cy + 2.5, PALETTE.woodDark);
  nativePx(ctx, cx + 5.5, cy - 9.5, PALETTE.clothTan);
}

export function drawDeadGrassTuft(ctx, cx, cy, seed) {
  const rng = rngFrom(hash2D(seed + 359, seed * 13 + 53));

  // Each tuft shares one prevailing lean so a run of placements reads as
  // weather-beaten grass instead of unrelated needle noise.
  const wind = (rng() < 0.35 ? -1 : 1) * (3 + Math.floor(rng() * 3));
  const clusters = [-13, -1, 12];
  let blade = 0;
  for (const cluster of clusters) {
    const count = cluster === -1 ? 6 : 5;
    for (let i = 0; i < count; i += 1) {
      const baseX = cx + cluster - 5 + Math.floor(rng() * 11);
      const baseY = cy - 2 + Math.floor(rng() * 7);
      const height = 11 + Math.floor(rng() * 15);
      const lean = wind + Math.floor(rng() * 5) - 2;
      const tipX = baseX + lean;
      const tipY = baseY - height;
      const mid = blade % 4 === 0
        ? PALETTE.stoneDust
        : blade % 3 === 0
          ? PALETTE.rustDark
          : PALETTE.woodMid;

      if (blade % 6 === 5) {
        // A snapped blade bends back toward the dirt.
        const bendX = baseX + Math.round(lean * 0.55);
        const bendY = baseY - Math.round(height * 0.62);
        linePx(ctx, baseX, baseY, bendX, bendY, PALETTE.outline, 2);
        linePx(ctx, baseX, baseY, bendX, bendY, PALETTE.woodDark, 1);
        linePx(ctx, bendX, bendY, bendX - 5, bendY + 5, PALETTE.rustDark, 1);
        nativePx(ctx, bendX + 0.5, bendY + 0.5, PALETTE.stoneDust);
      } else {
        linePx(ctx, baseX, baseY, tipX, tipY, PALETTE.outline, 2);
        linePx(ctx, baseX, baseY, tipX, tipY, mid, 1);
        if (blade % 4 === 0) {
          linePx(ctx, baseX - 1, baseY - 2, tipX - 1, tipY + 3, PALETTE.clothTan, 1);
          nativeLinePx(ctx, baseX - 0.5, baseY - 2.5, tipX - 0.5, tipY + 3.5, PALETTE.stoneDust);
        }
      }
      blade += 1;
    }
  }

  // Matted blades stitch the three crowns to the ground plane.
  for (const [dx, len, tone] of [
    [-19, 14, PALETTE.woodDark],
    [-6, 17, PALETTE.rustDark],
    [8, 13, PALETTE.stoneDark]
  ]) {
    linePx(ctx, cx + dx, cy + 1, cx + dx + len, cy + 5, PALETTE.outline, 2);
    linePx(ctx, cx + dx + 1, cy + 1, cx + dx + len, cy + 4, tone, 1);
  }
  px(ctx, cx - 17, cy + 2, PALETTE.rustDark, 34, 2);
  px(ctx, cx - 13, cy + 1, PALETTE.woodLight, 10, 1);
  px(ctx, cx + 2, cy + 2, PALETTE.stoneDark, 12, 1);
  nativeLinePx(ctx, cx - 11.5, cy + 1.5, cx - 5.5, cy + 2.5, PALETTE.clothTan);
  nativeLinePx(ctx, cx + 3.5, cy + 2.5, cx + 10.5, cy + 3.5, PALETTE.woodDark);
}
