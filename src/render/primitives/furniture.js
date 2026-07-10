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

// Furniture and settlement structure primitives.

export function drawBrokenPew(ctx, cx, cy, seed) {
  drawShadowBlob(ctx, cx, cy + 8, 68, 21);
  const rng = rngFrom(hash2D(seed + 13, seed * 9 + 1));

  // Long chapel bench seat: thin planks, not a solid block.
  const seatTop = [
    [cx - 34, cy - 4],
    [cx + 13, cy - 18],
    [cx + 33, cy - 9],
    [cx - 15, cy + 6]
  ];
  const seatFront = [
    [cx - 15, cy + 6],
    [cx + 33, cy - 9],
    [cx + 33, cy - 4],
    [cx - 15, cy + 12]
  ];
  poly(ctx, PALETTE.outline, [
    [seatTop[0][0] - 1, seatTop[0][1] + 1],
    [seatTop[1][0], seatTop[1][1] - 1],
    [seatTop[2][0] + 1, seatTop[2][1] + 1],
    [seatFront[2][0] + 1, seatFront[2][1] + 1],
    [seatFront[3][0] - 1, seatFront[3][1] + 1]
  ]);
  poly(ctx, PALETTE.woodMid, seatFront);
  poly(ctx, PALETTE.woodLight, seatTop);

  for (let i = 0; i < 4; i += 1) {
    const off = i * 9;
    const x0 = cx - 29 + off;
    const y0 = cy - 5 + Math.floor(off * 0.08);
    const x1 = cx + 3 + off;
    const y1 = cy - 16 + Math.floor(off * 0.08);
    linePx(ctx, x0, y0, x1, y1, PALETTE.outline, 2);
    linePx(ctx, x0 + 1, y0 - 1, x1 + 1, y1 - 1, i === 2 ? PALETTE.woodDark : PALETTE.woodMid, 1);
  }

  // Back rail and posts. The missing right rail makes the ruin read fast.
  px(ctx, cx - 30, cy - 29, PALETTE.outline, 5, 35);
  px(ctx, cx - 28, cy - 30, PALETTE.woodDark, 3, 33);
  px(ctx, cx + 17, cy - 42, PALETTE.outline, 5, 35);
  px(ctx, cx + 19, cy - 43, PALETTE.woodDark, 3, 31);
  linePx(ctx, cx - 28, cy - 29, cx + 18, cy - 41, PALETTE.outline, 5);
  linePx(ctx, cx - 27, cy - 30, cx + 17, cy - 41, PALETTE.woodLight, 2);
  linePx(ctx, cx - 26, cy - 20, cx + 8, cy - 29, PALETTE.outline, 3);
  linePx(ctx, cx - 25, cy - 21, cx + 7, cy - 30, PALETTE.woodMid, 1);
  linePx(ctx, cx - 31, cy - 18, cx + 26, cy - 8, PALETTE.outline, 1);
  linePx(ctx, cx - 28, cy - 19, cx + 23, cy - 9, PALETTE.woodDark, 1);
  px(ctx, cx - 33, cy - 13, PALETTE.outline, 9, 3);
  px(ctx, cx - 31, cy - 14, PALETTE.woodLight, 4, 1);
  px(ctx, cx + 18, cy - 11, PALETTE.outline, 8, 3);
  px(ctx, cx + 19, cy - 12, PALETTE.rustDark, 5, 1);

  // Thin legs and splinters.
  for (const leg of [[-24, 5], [-4, 0], [22, -8]]) {
    px(ctx, cx + leg[0], cy + leg[1], PALETTE.outline, 4, 12);
    px(ctx, cx + leg[0] + 1, cy + leg[1], PALETTE.woodDark, 2, 10);
  }
  for (let i = 0; i < 9; i += 1) {
    px(ctx, cx + 18 + Math.floor(rng() * 18), cy - 6 + Math.floor((rng() - 0.5) * 13), PALETTE.woodDark);
  }
  // What the congregation left: a hymn sheet still on the seat and a prayer
  // cord dropped where the rail broke.
  if ((seed & 1) === 0) {
    px(ctx, cx - 12, cy - 12, PALETTE.outline, 8, 6);
    px(ctx, cx - 11, cy - 11, PALETTE.hostBone, 6, 4);
    px(ctx, cx - 10, cy - 10, PALETTE.stoneDark, 4, 1); // a line of hymn text
    px(ctx, cx - 10, cy - 8, PALETTE.stoneDark, 3, 1);
  } else {
    px(ctx, cx + 12, cy + 2, PALETTE.clothTan, 5, 1);
    px(ctx, cx + 11, cy + 3, PALETTE.clothTan, 2, 1);
    px(ctx, cx + 16, cy + 3, PALETTE.clothTan, 2, 1);
    px(ctx, cx + 13, cy + 4, PALETTE.rustLight, 1, 1); // the cord's worn token
  }
  drawRubbleCluster(ctx, cx + 28, cy + 12, seed + 33, 2);
}

export function drawCanvasTent(ctx, cx, cy, seed) {
  const lean = (seed & 1) ? 2 : -2;
  const rng = rngFrom(hash2D(seed + 211, seed * 3 + 17));
  drawShadowBlob(ctx, cx, cy + 8, 72, 26);
  poly(ctx, PALETTE.outline, [
    [cx - 34, cy - 2],
    [cx - 4 + lean, cy - 31],
    [cx + 33, cy - 1],
    [cx + 27, cy + 13],
    [cx - 29, cy + 13]
  ]);
  poly(ctx, PALETTE.clothTan, [
    [cx - 31, cy - 1],
    [cx - 4 + lean, cy - 29],
    [cx - 1 + lean, cy + 9],
    [cx - 27, cy + 11]
  ]);
  poly(ctx, PALETTE.stoneDust, [
    [cx - 4 + lean, cy - 29],
    [cx + 30, cy - 1],
    [cx + 24, cy + 11],
    [cx - 1 + lean, cy + 9]
  ]);
  poly(ctx, PALETTE.void, [
    [cx - 5 + lean, cy - 5],
    [cx + 6 + lean, cy + 8],
    [cx - 12 + lean, cy + 8]
  ]);
  px(ctx, cx - 5 + lean, cy - 4, PALETTE.hostBlack, 11, 8);
  px(ctx, cx - 2 + lean, cy + 1, PALETTE.outline, 6, 1);
  linePx(ctx, cx - 4 + lean, cy - 29, cx - 2 + lean, cy + 11, PALETTE.outline, 3);
  linePx(ctx, cx - 3 + lean, cy - 28, cx - 1 + lean, cy + 10, PALETTE.woodMid, 1);
  linePx(ctx, cx - 24, cy + 1, cx + 27, cy + 1, PALETTE.outline, 1);
  linePx(ctx, cx - 22, cy, cx + 25, cy, PALETTE.rustDark, 1);
  linePx(ctx, cx - 18, cy - 12, cx + 14, cy + 3, PALETTE.outline, 1);
  linePx(ctx, cx - 16, cy - 13, cx + 12, cy + 2, PALETTE.stoneDust, 1);
  linePx(ctx, cx + 17, cy - 13, cx + 1, cy + 9, PALETTE.clothDark, 1);
  for (const rope of [
    [-27, 7, -40, 15],
    [25, 7, 39, 14],
    [-14, -13, -33, 3],
    [8, -11, 31, 2]
  ]) {
    linePx(ctx, cx + rope[0], cy + rope[1], cx + rope[2], cy + rope[3], PALETTE.outline, 2);
    linePx(ctx, cx + rope[0], cy + rope[1] - 1, cx + rope[2], cy + rope[3] - 1, PALETTE.rustDark, 1);
    px(ctx, cx + rope[2] - 1, cy + rope[3] - 1, PALETTE.outline, 5, 3);
    px(ctx, cx + rope[2], cy + rope[3] - 1, PALETTE.woodDark, 3, 1);
  }
  // A chalked billet tally beside the door: the quartermaster counts heads,
  // even now. Four strokes and a bar.
  for (let t = 0; t < 4; t += 1) px(ctx, cx + 9 + lean + t * 2, cy - 8, PALETTE.stoneLight, 1, 4);
  linePx(ctx, cx + 8 + lean, cy - 6, cx + 16 + lean, cy - 7, PALETTE.stoneLight, 1);
  for (const [dx, dy, w, h, color] of [
    [-24, -8, 11, 7, PALETTE.stoneDust],
    [12, -5, 9, 6, PALETTE.clothDark],
    [-6, 4, 12, 5, PALETTE.rustDark]
  ]) {
    px(ctx, cx + dx, cy + dy, PALETTE.outline, w + 2, h + 2);
    px(ctx, cx + dx + 1, cy + dy + 1, color, w, h);
    px(ctx, cx + dx + 1, cy + dy + 1, PALETTE.hostBone, Math.max(2, w - 3), 1);
  }
  for (const [dx, dy, w, color] of [
    [-19, -16, 12, PALETTE.hostBone],
    [4, -12, 15, PALETTE.clothDark],
    [-21, -1, 10, PALETTE.rustDark],
    [12, 1, 12, PALETTE.clothTan]
  ]) {
    px(ctx, cx + dx, cy + dy, PALETTE.outline, w + 2, 3);
    px(ctx, cx + dx + 1, cy + dy, color, w, 1);
  }
  linePx(ctx, cx - 24, cy + 11, cx + 24, cy + 11, PALETTE.outline, 2);
  linePx(ctx, cx - 22, cy + 10, cx + 22, cy + 10, PALETTE.rustDark, 1);
  for (let i = 0; i < 5; i += 1) {
    const x = cx - 24 + Math.floor(rng() * 49);
    const y = cy - 24 + Math.floor(rng() * 32);
    px(ctx, x, y, rng() < 0.5 ? PALETTE.stoneDark : PALETTE.rustDark, 2 + Math.floor(rng() * 4), 1);
  }
  drawRubbleCluster(ctx, cx - 36, cy + 18, seed + 217, 2);
  drawRubbleCluster(ctx, cx + 38, cy + 17, seed + 219, 2);
  drawNoisePixels(ctx, cx - 30, cy - 28, 60, 42, [PALETTE.stoneDark, PALETTE.rustDark], 0.032, seed);
}

export function drawCanvasTentBlock(ctx, cx, cy, seed, opts = {}) {
  const connected = opts.connected ?? {};
  const interior = Boolean(opts.interior);

  if (interior) {
    const base = diamond(cx, cy, TILE_WIDTH, TILE_HEIGHT);
    const upper = diamond(cx, cy - 39, TILE_WIDTH - 24, TILE_HEIGHT - 12);
    const ridge = diamond(cx, cy - 51, TILE_WIDTH - 42, TILE_HEIGHT - 18);
    drawShadowBlob(ctx, cx, cy + 5, 68, 22);

    const drawInteriorPanel = (points, lit, sideSeed) => {
      const face = faceTools(ctx, points[0], points[1], points[2], points[3]);
      const mid = lit ? PALETTE.clothTan : PALETTE.stoneDust;
      const hi = lit ? PALETTE.hostBone : PALETTE.clothTan;
      const lo = lit ? PALETTE.woodDark : PALETTE.outline;
      const seam = lit ? PALETTE.stoneDust : PALETTE.stoneDark;

      face.rect(0, 0, 1, 1, PALETTE.outline);
      face.rect(0.03, 0.03, 0.97, 0.98, mid);
      face.rect(0.06, 0.05, 0.94, 0.18, hi);
      face.rect(0.06, 0.72, 0.94, 0.97, lo);

      face.line(0.08, 0.13, 0.92, 0.13, hi, 1);
      face.line(0.08, 0.9, 0.92, 0.9, PALETTE.rustDark, 2);
      face.line(0.5, 0.05, 0.5, 0.96, PALETTE.woodDark, 2);
      face.line(0.5, 0.07, 0.13, 0.92, seam, 1);
      face.line(0.5, 0.07, 0.87, 0.92, lit ? PALETTE.clothDark : PALETTE.outline, 1);
      face.line(0.07, 0.26, 0.94, 0.3, lit ? PALETTE.stoneDust : PALETTE.stoneDark, 1);
      face.line(0.08, 0.58, 0.92, 0.55, lit ? PALETTE.clothDark : PALETTE.outline, 1);

      for (const u of [0.22, 0.38, 0.64, 0.8]) {
        const drift = ((sideSeed + Math.floor(u * 100)) & 1) ? 0.03 : -0.02;
        face.line(u, 0.16, Math.max(0.1, Math.min(0.9, u + drift)), 0.88, seam, 1);
      }
      for (const u of [0.16, 0.28, 0.42, 0.58, 0.72, 0.86]) {
        for (const v of [0.18, 0.9]) {
          const p = face.point(u, v);
          px(ctx, p[0] - 1, p[1], PALETTE.outline, 2, 1);
          px(ctx, p[0], p[1] - 1, lit ? PALETTE.hostBone : PALETTE.clothTan, 1, 1);
        }
      }
      for (const v of [0.38, 0.68]) {
        const p = face.point(0.5, v);
        px(ctx, p[0] - 2, p[1] - 1, PALETTE.outline, 5, 3);
        px(ctx, p[0] - 1, p[1] - 1, lit ? PALETTE.rustDark : PALETTE.woodDark, 3, 1);
      }

      if ((hash2D(sideSeed + 9, seed + 17) % 3) !== 0) {
        const patchU = (hash2D(sideSeed + 23, seed + 29) % 3) * 0.16 + 0.24;
        face.rect(patchU, 0.36, patchU + 0.18, 0.49, PALETTE.outline);
        face.rect(patchU + 0.02, 0.38, patchU + 0.16, 0.47, lit ? PALETTE.stoneDust : PALETTE.clothDark);
        face.line(patchU, 0.36, patchU + 0.18, 0.36, hi, 1);
        face.line(patchU + 0.18, 0.36, patchU + 0.18, 0.49, PALETTE.rustDark, 1);
      }
      if ((hash2D(sideSeed + 37, seed + 41) & 1) === 0) {
        face.rect(0.68, 0.2, 0.84, 0.32, PALETTE.outline);
        face.rect(0.7, 0.22, 0.82, 0.3, lit ? PALETTE.clothTan : PALETTE.stoneDark);
        face.line(0.7, 0.29, 0.82, 0.29, PALETTE.rustDark, 1);
      }
    };

    if (!connected.yPlus) {
      drawInteriorPanel([upper.left, upper.bottom, base.bottom, base.left], true, seed + 1);
      linePx(ctx, upper.left[0], upper.left[1], upper.bottom[0], upper.bottom[1], PALETTE.outline, 2);
      linePx(ctx, upper.left[0] + 1, upper.left[1] - 1, upper.bottom[0] + 1, upper.bottom[1] - 1, PALETTE.hostBone, 1);
    }

    if (!connected.xPlus) {
      drawInteriorPanel([upper.bottom, upper.right, base.right, base.bottom], false, seed + 5);
      linePx(ctx, upper.bottom[0], upper.bottom[1], upper.right[0], upper.right[1], PALETTE.outline, 2);
      linePx(ctx, upper.bottom[0], upper.bottom[1] - 1, upper.right[0], upper.right[1] - 1, PALETTE.stoneDark, 1);
    }

    if (!connected.yMinus) {
      poly(ctx, PALETTE.outline, [ridge.top, ridge.left, upper.left, upper.top]);
      poly(ctx, PALETTE.clothTan, [
        mixPoint(ridge.top, ridge.left, 0.08),
        ridge.left,
        upper.left,
        mixPoint(upper.top, upper.left, 0.2)
      ]);
      linePx(ctx, ridge.top[0], ridge.top[1], ridge.left[0], ridge.left[1], PALETTE.hostBone, 1);
      linePx(ctx, ridge.left[0], ridge.left[1], upper.left[0], upper.left[1], PALETTE.stoneDust, 1);
    }

    if (!connected.xMinus) {
      poly(ctx, PALETTE.outline, [ridge.top, ridge.right, upper.right, upper.top]);
      poly(ctx, PALETTE.stoneDust, [
        ridge.top,
        mixPoint(ridge.top, ridge.right, 0.92),
        mixPoint(upper.top, upper.right, 0.86),
        upper.top
      ]);
      linePx(ctx, ridge.top[0], ridge.top[1], ridge.right[0], ridge.right[1], PALETTE.clothTan, 1);
      linePx(ctx, ridge.right[0], ridge.right[1], upper.right[0], upper.right[1], PALETTE.stoneDark, 1);
    }

    const drawPole = (p, h = 34) => {
      px(ctx, p[0] - 2, p[1] - h, PALETTE.outline, 5, h + 3);
      px(ctx, p[0] - 1, p[1] - h + 1, PALETTE.woodDark, 3, h);
      px(ctx, p[0], p[1] - h + 2, PALETTE.woodMid, 1, h - 3);
    };
    if (!connected.yPlus && !connected.xMinus) drawPole(base.left, 33);
    if (!connected.yPlus && !connected.xPlus) drawPole(base.bottom, 36);
    if (!connected.xPlus && !connected.yMinus) drawPole(base.right, 31);

    for (const [a, b] of [
      [upper.left, base.left],
      [upper.bottom, base.bottom],
      [upper.right, base.right]
    ]) {
      if ((hash2D(seed + a[0], seed + b[1]) % 4) !== 0) {
        linePx(ctx, a[0], a[1], b[0], b[1], PALETTE.rustDark, 1);
      }
    }

    for (const [x, y, side] of [
      [base.left[0], base.left[1], -1],
      [base.bottom[0], base.bottom[1], 1],
      [base.right[0], base.right[1], 1]
    ]) {
      px(ctx, x - 3, y - 2, PALETTE.outline, 7, 4);
      px(ctx, x - 2, y - 2, PALETTE.woodDark, 5, 2);
      linePx(ctx, x, y - 3, x + side * 14, y + 2, PALETTE.outline, 2);
      linePx(ctx, x, y - 4, x + side * 12, y + 1, PALETTE.rustDark, 1);
    }
    linePx(ctx, base.left[0] + 4, base.left[1] + 1, base.bottom[0] - 4, base.bottom[1] - 1, PALETTE.outline, 2);
    linePx(ctx, base.left[0] + 6, base.left[1], base.bottom[0] - 6, base.bottom[1] - 2, PALETTE.rustDark, 1);

    drawNoisePixels(ctx, cx - 34, cy - 58, 68, 58, [PALETTE.clothDark, PALETTE.rustDark, PALETTE.stoneDark], 0.018, seed);
    return;
  }

  const wallH = interior ? 28 : 32;
  const roofLift = interior ? wallH + 4 : wallH + 16;
  const roofW = interior ? 4 : 22;
  const roofH = interior ? 4 : 14;
  const base = diamond(cx, cy, TILE_WIDTH, TILE_HEIGHT);
  const wallTop = diamond(cx, cy - wallH, TILE_WIDTH, TILE_HEIGHT);
  const roof = diamond(cx, cy - roofLift, TILE_WIDTH + roofW, TILE_HEIGHT + roofH);

  drawShadowBlob(ctx, cx, cy + 5, 68, 22);

  // Weathered Censure field canvas: ash-grey with dark repairs, never bright.
  // Ramp: clothTan (worn hi) / stoneDust (mid) / stoneLight (lo) / clothDark (dk).
  const drawCanvasFace = (face, lit, faceSeed) => {
    const mid = lit ? PALETTE.stoneDust : PALETTE.stoneLight;
    const hi = lit ? PALETTE.clothTan : PALETTE.stoneDust;
    const lo = lit ? PALETTE.stoneLight : PALETTE.clothDark;
    const dk = lit ? PALETTE.clothDark : PALETTE.outline;

    face.rect(0, 0, 1, 1, PALETTE.outline);
    face.rect(0.025, 0.025, 0.975, 0.985, mid);
    // Eave shadow band under the roof overhang.
    face.rect(0.025, 0.025, 0.975, 0.13, lo);
    face.line(0.04, 0.13, 0.96, 0.13, dk, 1);
    // One worn highlight where rain has bleached the weave.
    face.line(0.08, 0.19, 0.9, 0.18, hi, 1);
    // Mud-splashed skirt where boots and runoff hit the canvas.
    face.rect(0.025, 0.82, 0.975, 0.985, lo);
    face.line(0.04, 0.82, 0.96, 0.81, PALETTE.stoneDark, 1);
    face.line(0.06, 0.9, 0.94, 0.9, PALETTE.rustDark, 1);
    // Panel seams sag off-true; each face leans its own way.
    for (const u of [0.26, 0.5, 0.74]) {
      const sag = (((hash2D(seed + Math.floor(u * 100), faceSeed + 5) % 3) - 1)) * 0.03;
      face.line(u, 0.06, u + sag, 0.94, lo, 1);
    }
    // Horizontal slack creases where the guy lines pull.
    face.line(0.08, 0.44, 0.5, 0.48, dk, 1);
    face.line(0.5, 0.48, 0.92, 0.45, lo, 1);
    face.line(0.1, 0.66, 0.88, 0.68, PALETTE.stoneDark, 1);
    // Seeded lash points along the seam line.
    for (const [u, v] of [[0.16, 0.3], [0.62, 0.36], [0.84, 0.58]]) {
      if ((hash2D(seed + Math.floor(u * 90), faceSeed + 11) % 3) === 0) continue;
      const p = face.point(u, v);
      px(ctx, p[0] - 1, p[1] - 1, PALETTE.outline, 3, 2);
      px(ctx, p[0], p[1] - 2, lit ? PALETTE.clothTan : PALETTE.stoneDust, 1, 1);
    }
    // Seeded dark repair patch, stitched at the top edge.
    if ((hash2D(seed + 41, faceSeed + 17) % 3) !== 2) {
      const patchU = ((hash2D(seed + 53, faceSeed + 23) % 3) * 0.17) + 0.22;
      const patchV = 0.3 + ((hash2D(seed + 61, faceSeed + 29) % 2) * 0.2);
      face.rect(patchU - 0.012, patchV - 0.015, patchU + 0.2, patchV + 0.17, PALETTE.outline);
      face.rect(patchU, patchV, patchU + 0.19, patchV + 0.15, (hash2D(seed + 67, faceSeed) & 1) ? dk : PALETTE.rustDark);
      face.line(patchU, patchV, patchU + 0.19, patchV, hi, 1);
    }
    // Faded Censure cross stenciled on some lit faces: the office marks its rows.
    if (lit && (hash2D(seed + 71, faceSeed + 31) % 4) === 0) {
      const p = face.point(0.5, 0.56);
      px(ctx, p[0] - 1, p[1] - 6, PALETTE.outline, 4, 13);
      px(ctx, p[0] - 4, p[1] - 3, PALETTE.outline, 10, 4);
      px(ctx, p[0], p[1] - 5, PALETTE.hostBone, 2, 11);
      px(ctx, p[0] - 3, p[1] - 2, PALETTE.hostBone, 8, 2);
      px(ctx, p[0], p[1] + 3, PALETTE.stoneDust, 2, 3);
    }
    // Ash grime worked into the weave, heaviest near the ground.
    const a = face.point(0.05, 0.62);
    const b = face.point(0.95, 0.98);
    drawNoisePixels(
      ctx,
      Math.min(a[0], b[0]),
      Math.min(a[1], b[1]),
      Math.abs(b[0] - a[0]),
      Math.max(6, Math.abs(b[1] - a[1])),
      [PALETTE.stoneDark, PALETTE.rustDark, PALETTE.clothDark],
      0.06,
      seed + faceSeed
    );
  };

  if (!connected.yPlus) {
    poly(ctx, PALETTE.outline, [wallTop.left, wallTop.bottom, base.bottom, base.left]);
    drawCanvasFace(faceTools(ctx, wallTop.left, wallTop.bottom, base.bottom, base.left), true, 3);
  }

  if (!connected.xPlus) {
    poly(ctx, PALETTE.outline, [wallTop.bottom, wallTop.right, base.right, base.bottom]);
    drawCanvasFace(faceTools(ctx, wallTop.bottom, wallTop.right, base.right, base.bottom), false, 7);
  }

  if (!interior) {
    const interiorCell = connected.xMinus && connected.xPlus && connected.yMinus && connected.yPlus;
    // Roof canvas: mid ash-grey, pitched darker toward the exposed SE eaves.
    poly(ctx, PALETTE.stoneDust, [roof.top, roof.left, roof.bottom, roof.right]);
    if (!connected.xPlus || !connected.yPlus) {
      poly(ctx, PALETTE.stoneLight, [
        mixPoint(roof.top, roof.right, 0.55),
        roof.right,
        roof.bottom,
        mixPoint(roof.bottom, roof.left, 0.3),
        mixPoint(roof.top, roof.left, 0.55),
        [cx, cy - roofLift]
      ]);
      poly(ctx, PALETTE.clothDark, [
        mixPoint(roof.right, roof.bottom, 0.15),
        roof.bottom,
        mixPoint(roof.bottom, roof.left, 0.18),
        mixPoint(roof.bottom, roof.left, 0.14),
        mixPoint(roof.right, roof.bottom, 0.12)
      ]);
    }

    if (!interiorCell) {
      // Canvas seams running down the pitch, with seeded sag.
      for (const t of [0.3, 0.58]) {
        const a = mixPoint(roof.left, roof.top, t);
        const b = mixPoint(roof.bottom, roof.right, t);
        const dip = ((hash2D(seed + Math.floor(t * 100), 91) % 3) - 1);
        const m = mixPoint(a, b, 0.5);
        linePx(ctx, a[0], a[1], m[0], m[1] + dip, t < 0.5 ? PALETTE.stoneLight : PALETTE.clothDark, 1);
        linePx(ctx, m[0], m[1] + dip, b[0], b[1], t < 0.5 ? PALETTE.stoneLight : PALETTE.clothDark, 1);
      }
      for (const t of [0.46, 0.72]) {
        const a = mixPoint(roof.top, roof.right, t);
        const b = mixPoint(roof.left, roof.bottom, t);
        linePx(ctx, a[0], a[1], b[0], b[1], PALETTE.stoneLight, 1);
      }
      // Rain stain bleeding from a seam toward the low eave.
      if ((hash2D(seed + 87, 13) % 3) !== 0) {
        const from = mixPoint(roof.top, roof.bottom, 0.35 + ((hash2D(seed + 97, 17) % 3) * 0.12));
        const to = mixPoint(roof.bottom, (hash2D(seed + 99, 19) & 1) ? roof.right : roof.left, 0.3);
        linePx(ctx, from[0], from[1], to[0], to[1], PALETTE.rustDark, 1);
      }
      // Seeded roof patches: dark tarred squares, one lit stitch edge.
      for (const [tu, tv, salt] of [[0.34, 0.3, 43], [0.62, 0.62, 47], [0.3, 0.68, 53]]) {
        if ((hash2D(seed + salt, salt * 3 + 1) % 3) !== 0) continue;
        const top = mixPoint(mixPoint(roof.top, roof.right, tu), mixPoint(roof.left, roof.bottom, tu), tv);
        px(ctx, top[0] - 6, top[1] - 3, PALETTE.outline, 13, 7);
        px(ctx, top[0] - 5, top[1] - 2, (salt & 1) ? PALETTE.clothDark : PALETTE.rustDark, 11, 5);
        px(ctx, top[0] - 5, top[1] - 3, PALETTE.stoneDust, 8, 1);
      }
    }
    if (!connected.yMinus) {
      linePx(ctx, roof.top[0], roof.top[1], roof.left[0], roof.left[1], PALETTE.outline, 2);
      linePx(ctx, roof.top[0] - 1, roof.top[1], roof.left[0] - 1, roof.left[1], PALETTE.clothTan, 1);
    }
    if (!connected.xMinus) {
      linePx(ctx, roof.top[0], roof.top[1], roof.right[0], roof.right[1], PALETTE.outline, 2);
      linePx(ctx, roof.top[0] + 1, roof.top[1], roof.right[0] + 1, roof.right[1], PALETTE.clothTan, 1);
    }
    if (!connected.yPlus) {
      linePx(ctx, roof.left[0], roof.left[1] + 1, roof.bottom[0], roof.bottom[1] + 1, PALETTE.outline, 2);
      linePx(ctx, roof.left[0], roof.left[1], roof.bottom[0], roof.bottom[1], PALETTE.clothDark, 1);
    }
    if (!connected.xPlus) {
      linePx(ctx, roof.bottom[0], roof.bottom[1] + 1, roof.right[0], roof.right[1] + 1, PALETTE.outline, 2);
      linePx(ctx, roof.bottom[0], roof.bottom[1], roof.right[0], roof.right[1], PALETTE.clothDark, 1);
    }
    // Sparse seeded wear ticks instead of a mechanical grid.
    for (const [ox, oy] of [[-21, -5], [-7, 4], [13, -1], [24, 6], [2, -7]]) {
      if ((hash2D(seed + ox, seed + oy) % 4) === 0) {
        px(ctx, cx + ox, cy - roofLift + oy, PALETTE.stoneLight, 3, 1);
      }
    }
    // Guy ropes only off exposed roof corners, and some have snapped.
    const corners = [
      [!connected.yPlus && !connected.xMinus, roof.left, -1, 61],
      [!connected.yPlus && !connected.xPlus, roof.bottom, 1, 63],
      [!connected.xPlus && !connected.yMinus, roof.right, 1, 69]
    ];
    for (const [exposed, corner, sx, salt] of corners) {
      if (!exposed || (hash2D(seed + salt, salt) % 3) === 0) continue;
      const gx = corner[0] + sx * 13;
      const gy = corner[1] + 16;
      linePx(ctx, corner[0], corner[1], gx, gy, PALETTE.outline, 2);
      linePx(ctx, corner[0], corner[1] - 1, gx, gy - 1, PALETTE.rustDark, 1);
      px(ctx, gx - 2, gy - 1, PALETTE.outline, 5, 3);
      px(ctx, gx - 1, gy - 2, PALETTE.woodDark, 3, 1);
    }
    // Settled ash over the whole roof plane.
    drawNoisePixels(
      ctx,
      cx - 40,
      cy - roofLift - 20,
      80,
      42,
      [PALETTE.stoneLight, PALETTE.stoneDark, PALETTE.clothDark],
      interiorCell ? 0.02 : 0.03,
      seed
    );
  }

  if (!connected.yPlus && !connected.xMinus) {
    px(ctx, cx - 31, cy - 14, PALETTE.outline, 4, 20);
    px(ctx, cx - 30, cy - 13, PALETTE.woodDark, 2, 17);
    px(ctx, cx - 33, cy + 4, PALETTE.outline, 8, 4);
    px(ctx, cx - 31, cy + 3, PALETTE.woodMid, 4, 2);
  }
  if (!connected.xPlus && !connected.yPlus) {
    px(ctx, cx + 28, cy - 13, PALETTE.outline, 4, 19);
    px(ctx, cx + 29, cy - 12, PALETTE.woodDark, 2, 16);
    px(ctx, cx + 27, cy + 4, PALETTE.outline, 8, 4);
    px(ctx, cx + 29, cy + 3, PALETTE.woodMid, 4, 2);
  }
  if (!interior) {
    drawRubbleCluster(ctx, cx - 26, cy + 8, seed + 283, 2);
    drawRubbleCluster(ctx, cx + 25, cy + 7, seed + 287, 2);
  }
}

export function drawCanvasTentFlap(ctx, cx, cy, seed, opts = {}) {
  const wallPlane = opts.wallPlane === 'se' ? 'se' : 'sw';
  const locked = Boolean(opts.locked);
  const unlocked = Boolean(opts.unlocked || opts.revealed);
  const wallFace = wallRunFace(ctx, cx, cy, { plane: wallPlane, side: 'near', span: 1 });
  const u0 = 0.18;
  const u1 = 0.82;
  const v0 = 0.22;
  const v1 = 0.99;
  const face = faceTools(
    ctx,
    wallFace.point(u0, v0),
    wallFace.point(u1, v0),
    wallFace.point(u1, v1),
    wallFace.point(u0, v1)
  );

  face.rect(0, 0, 1, 1, PALETTE.outline);
  face.rect(0.04, 0.04, 0.96, 0.98, PALETTE.stoneDust);
  face.line(0.06, 0.05, 0.06, 0.94, PALETTE.clothTan, 1);
  face.line(0.94, 0.05, 0.94, 0.94, PALETTE.clothDark, 1);
  face.line(0.08, 0.12, 0.92, 0.12, PALETTE.stoneLight, 1);
  face.line(0.08, 0.84, 0.92, 0.84, PALETTE.rustDark, 2);
  face.line(0.18, 0.1, 0.2, 0.88, PALETTE.stoneLight, 1);
  face.line(0.8, 0.1, 0.78, 0.88, PALETTE.clothDark, 1);
  face.line(0.28, 0.18, 0.32, 0.82, PALETTE.rustDark, 1);
  face.line(0.68, 0.18, 0.64, 0.82, PALETTE.stoneLight, 1);
  for (const u of [0.18, 0.34, 0.66, 0.82]) {
    face.rect(u - 0.025, 0.14, u + 0.025, 0.2, PALETTE.outline);
    face.rect(u - 0.012, 0.15, u + 0.012, 0.18, PALETTE.clothTan);
  }
  for (const [u, v, w, h, color] of [
    [0.18, 0.34, 0.2, 0.16, PALETTE.stoneLight],
    [0.68, 0.42, 0.16, 0.14, PALETTE.rustDark],
    [0.34, 0.68, 0.18, 0.12, PALETTE.clothDark]
  ]) {
    face.rect(u - 0.01, v - 0.01, u + w + 0.01, v + h + 0.01, PALETTE.outline);
    face.rect(u, v, u + w, v + h, color);
    face.line(u + 0.02, v + 0.02, u + w - 0.02, v + 0.02, PALETTE.clothTan, 1);
  }

  const top = face.point(0.5, 0.13);
  const left = face.point(0.18, 0.96);
  const right = face.point(0.82, 0.96);
  const mid = face.point(0.5, 0.96);
  poly(ctx, PALETTE.outline, [top, right, mid]);
  poly(ctx, PALETTE.stoneLight, [
    face.point(0.52, 0.18),
    face.point(0.79, 0.91),
    face.point(0.53, 0.9)
  ]);
  poly(ctx, PALETTE.outline, [top, mid, left]);
  poly(ctx, PALETTE.stoneDust, [
    face.point(0.48, 0.18),
    face.point(0.47, 0.9),
    face.point(0.21, 0.91)
  ]);
  linePx(ctx, top[0], top[1], mid[0], mid[1], unlocked ? PALETTE.void : PALETTE.clothDark, 2);
  linePx(ctx, top[0] - 4, top[1] + 5, left[0] + 4, left[1] - 8, PALETTE.clothTan, 1);
  linePx(ctx, top[0] + 4, top[1] + 5, right[0] - 4, right[1] - 8, PALETTE.clothDark, 1);
  // Painted Censure cross over the lintel: the office marks every working mouth.
  px(ctx, top[0] - 1, top[1] - 12, PALETTE.outline, 4, 10);
  px(ctx, top[0] - 4, top[1] - 10, PALETTE.outline, 10, 4);
  px(ctx, top[0], top[1] - 11, PALETTE.hostBone, 2, 8);
  px(ctx, top[0] - 3, top[1] - 9, PALETTE.hostBone, 8, 2);
  for (const t of [0.24, 0.38, 0.62, 0.76]) {
    const p = face.point(t, 0.31);
    const q = face.point(t + (t < 0.5 ? -0.04 : 0.04), 0.38);
    linePx(ctx, p[0], p[1], q[0], q[1], PALETTE.outline, 2);
    linePx(ctx, p[0], p[1], q[0], q[1], PALETTE.woodDark, 1);
  }
  if (unlocked) {
    poly(ctx, PALETTE.void, [
      face.point(0.45, 0.38),
      face.point(0.56, 0.38),
      face.point(0.59, 0.96),
      face.point(0.42, 0.96)
    ]);
    linePx(ctx, mid[0] - 1, mid[1] - 9, mid[0] + 5, mid[1] - 2, PALETTE.hostBone, 1);
  }

  if (locked && !unlocked) {
    face.line(0.16, 0.58, 0.84, 0.58, PALETTE.outline, 3);
    face.line(0.18, 0.55, 0.82, 0.55, PALETTE.rustMid, 1);
    const wax = face.point(0.5, 0.61);
    px(ctx, wax[0] - 4, wax[1] - 3, PALETTE.outline, 8, 7);
    px(ctx, wax[0] - 2, wax[1] - 2, PALETTE.clothRed, 4, 4);
    px(ctx, wax[0] - 1, wax[1] - 1, PALETTE.hostGold, 2, 2);
  }

  const sillA = wallFace.point(u0 - 0.06, 1);
  const sillB = wallFace.point(u1 + 0.06, 1);
  linePx(ctx, sillA[0], sillA[1], sillB[0], sillB[1], PALETTE.outline, 3);
  linePx(ctx, sillA[0], sillA[1] - 1, sillB[0], sillB[1] - 1, PALETTE.stoneDark, 1);
  linePx(ctx, sillA[0] + 4, sillA[1] + 3, sillA[0] - 8, sillA[1] + 8, PALETTE.outline, 2);
  linePx(ctx, sillA[0] + 4, sillA[1] + 2, sillA[0] - 6, sillA[1] + 7, PALETTE.woodDark, 1);
  linePx(ctx, sillB[0] - 4, sillB[1] + 3, sillB[0] + 8, sillB[1] + 8, PALETTE.outline, 2);
  linePx(ctx, sillB[0] - 4, sillB[1] + 2, sillB[0] + 6, sillB[1] + 7, PALETTE.rustDark, 1);
  for (const t of [0.18, 0.5, 0.82]) {
    const p = face.point(t, 0.92);
    px(ctx, p[0] - 1, p[1] - 1, PALETTE.outline, 4, 3);
    px(ctx, p[0], p[1] - 1, PALETTE.woodDark, 2, 1);
  }
  drawNoisePixels(ctx, Math.min(sillA[0], sillB[0]) - 4, Math.min(sillA[1], sillB[1]) - 42, Math.abs(sillB[0] - sillA[0]) + 8, 45, [PALETTE.clothDark, PALETTE.rustDark], 0.018, seed);
  // A ward painted small on the flap in red: a barred cross. Whoever sleeps
  // here trusts the paint more than the canvas.
  px(ctx, cx + 3, cy - 26, PALETTE.hostRed, 1, 5);
  px(ctx, cx + 1, cy - 24, PALETTE.hostRed, 5, 1);
  linePx(ctx, cx, cy - 21, cx + 6, cy - 27, PALETTE.rustMid, 1);

}

export function drawCampBedroll(ctx, cx, cy, seed) {
  drawShadowBlob(ctx, cx, cy + 5, 50, 16);
  const flip = (seed & 1) ? -1 : 1;
  const rng = rngFrom(hash2D(seed + 181, seed * 7 + 19));
  poly(ctx, PALETTE.outline, [
    [cx - 25 * flip, cy - 7],
    [cx - 4 * flip, cy - 18],
    [cx + 25 * flip, cy - 8],
    [cx + 18 * flip, cy + 8],
    [cx - 16 * flip, cy + 9]
  ]);
  poly(ctx, PALETTE.clothDark, [
    [cx - 22 * flip, cy - 6],
    [cx - 4 * flip, cy - 16],
    [cx + 22 * flip, cy - 7],
    [cx + 16 * flip, cy + 6],
    [cx - 15 * flip, cy + 7]
  ]);
  poly(ctx, PALETTE.stoneDust, [
    [cx - 17 * flip, cy - 9],
    [cx - 3 * flip, cy - 16],
    [cx + 17 * flip, cy - 9],
    [cx - 2 * flip, cy - 3]
  ]);
  px(ctx, cx - 19, cy + 1, PALETTE.rustDark, 38, 3);
  px(ctx, cx - 15, cy - 10, PALETTE.clothTan, 25, 1);
  px(ctx, cx - 12, cy - 5, PALETTE.outline, 8, 2);
  px(ctx, cx - 11, cy - 5, PALETTE.rustLight, 6, 1);
  px(ctx, cx + 11 * flip, cy - 6, PALETTE.hostBone, 8, 1);
  px(ctx, cx + 14 * flip, cy + 3, PALETTE.woodDark, 7, 2);
  px(ctx, cx - 5 * flip, cy - 15, PALETTE.outline, 12, 3);
  px(ctx, cx - 3 * flip, cy - 15, PALETTE.clothTan, 7, 1);
  px(ctx, cx + 4 * flip, cy - 12, PALETTE.stoneDark, 11, 2);
  px(ctx, cx + 5 * flip, cy - 13, PALETTE.hostBone, 7, 1);
  // What they kept by their head: a folded spare shirt and the saint token
  // they touched before sleep.
  px(ctx, cx + 18 * flip, cy - 10, PALETTE.outline, 8, 5);
  px(ctx, cx + 19 * flip, cy - 10, PALETTE.stoneDust, 6, 3);
  px(ctx, cx + 19 * flip, cy - 10, PALETTE.hostBone, 3, 1);
  px(ctx, cx + 21 * flip, cy - 4, PALETTE.hostGold, 2, 1); // the token
  px(ctx, cx + 22 * flip, cy - 5, PALETTE.flash, 1, 1);
  for (const t of [-14, 3, 17]) {
    linePx(ctx, cx + t * flip, cy - 10, cx + (t + 6) * flip, cy + 5, PALETTE.outline, 2);
    linePx(ctx, cx + t * flip, cy - 9, cx + (t + 6) * flip, cy + 4, PALETTE.rustDark, 1);
    px(ctx, cx + (t + 3) * flip - 2, cy - 2, PALETTE.outline, 5, 3);
    px(ctx, cx + (t + 3) * flip - 1, cy - 3, PALETTE.rustLight, 2, 1);
  }
  px(ctx, cx - 23 * flip, cy - 5, PALETTE.outline, 8, 9);
  px(ctx, cx - 21 * flip, cy - 4, PALETTE.clothTan, 5, 7);
  px(ctx, cx - 19 * flip, cy - 3, PALETTE.stoneDust, 2, 2);
  px(ctx, cx + 18 * flip, cy - 8, PALETTE.outline, 10, 8);
  px(ctx, cx + 17 * flip, cy - 7, PALETTE.clothDark, 8, 6);
  px(ctx, cx + 18 * flip, cy - 6, PALETTE.stoneDark, 5, 1);
  for (let i = 0; i < 6; i += 1) {
    const x = cx - 19 + Math.floor(rng() * 38);
    const y = cy - 11 + Math.floor(rng() * 15);
    px(ctx, x, y, rng() < 0.5 ? PALETTE.stoneDark : PALETTE.clothTan, 1 + (i & 1), 1);
  }
  drawRubbleCluster(ctx, cx + 25 * flip, cy + 9, seed + 189, 2);
}

export function drawSettlementTable(ctx, cx, cy, seed) {
  drawShadowBlob(ctx, cx, cy + 8, 66, 22);
  const rng = rngFrom(hash2D(seed + 67, seed * 5 + 3));
  const top = [
    [cx - 34, cy - 12],
    [cx - 6, cy - 26],
    [cx + 31, cy - 12],
    [cx + 3, cy + 4]
  ];
  const front = [
    [cx - 27, cy - 5],
    [cx + 3, cy + 4],
    [cx + 31, cy - 12],
    [cx + 29, cy - 6],
    [cx + 2, cy + 10],
    [cx - 28, cy - 1]
  ];

  poly(ctx, PALETTE.outline, [
    [cx - 36, cy - 12],
    [cx - 7, cy - 28],
    [cx + 34, cy - 13],
    [cx + 31, cy - 5],
    [cx + 2, cy + 12],
    [cx - 30, cy]
  ]);
  poly(ctx, PALETTE.woodDark, front);
  poly(ctx, PALETTE.woodMid, top);
  poly(ctx, PALETTE.woodLight, [
    [cx - 31, cy - 13],
    [cx - 6, cy - 25],
    [cx + 2, cy - 22],
    [cx - 22, cy - 9]
  ]);

  for (const off of [-23, -13, -3, 8, 19]) {
    const x0 = cx - 27 + off;
    const y0 = cy - 12 + Math.floor(off * 0.06);
    const x1 = cx + 2 + off;
    const y1 = cy - 25 + Math.floor(off * 0.06);
    linePx(ctx, x0, y0, x1, y1, PALETTE.outline, off === 8 ? 2 : 1);
    linePx(ctx, x0 + 1, y0 - 1, x1 + 1, y1 - 1, off === 8 ? PALETTE.woodDark : PALETTE.stoneDark, 1);
  }

  // Broken far corner and trestle legs make the table feel repaired, not cute.
  px(ctx, cx + 21, cy - 15, PALETTE.outline, 8, 3);
  px(ctx, cx + 22, cy - 14, PALETTE.woodDark, 5, 2);
  for (const leg of [[-24, -3], [-7, 4], [18, -7]]) {
    px(ctx, cx + leg[0], cy + leg[1], PALETTE.outline, 4, 15);
    px(ctx, cx + leg[0] + 1, cy + leg[1], PALETTE.woodDark, 2, 13);
  }
  linePx(ctx, cx - 21, cy + 6, cx + 17, cy - 6, PALETTE.outline, 2);
  linePx(ctx, cx - 20, cy + 5, cx + 16, cy - 7, PALETTE.woodDark, 1);

  // Household evidence kept tiny so it reads as mess, not icons.
  drawIsoDiamond(ctx, cx - 13, cy - 16, 10, 5, PALETTE.stoneDust);
  drawIsoDiamond(ctx, cx + 8, cy - 14, 8, 4, PALETTE.rustDark);
  drawIsoDiamond(ctx, cx + 18, cy - 9, 9, 5, PALETTE.outline);
  drawIsoDiamond(ctx, cx + 18, cy - 10, 6, 3, PALETTE.clothTan);
  px(ctx, cx - 14, cy - 18, PALETTE.void, 5, 1);
  px(ctx, cx + 6, cy - 16, PALETTE.stoneDark, 5, 1);
  px(ctx, cx - 1, cy - 17, PALETTE.hostBone, 2, 2);
  px(ctx, cx - 25, cy - 15, PALETTE.outline, 9, 3);
  px(ctx, cx - 24, cy - 16, PALETTE.rustDark, 6, 1);
  linePx(ctx, cx - 18, cy - 10, cx + 17, cy - 20, PALETTE.outline, 1);
  linePx(ctx, cx - 17, cy - 11, cx + 15, cy - 20, PALETTE.woodDark, 1);
  for (const [x, y] of [[-24, -6], [-9, -12], [11, -17], [24, -9]]) {
    px(ctx, cx + x, cy + y, PALETTE.outline, 3, 3);
    px(ctx, cx + x + 1, cy + y, PALETTE.rustLight, 1, 1);
  }
  for (let i = 0; i < 12; i += 1) {
    const color = rng() < 0.4 ? PALETTE.stoneDark : PALETTE.woodDark;
    px(ctx, cx - 28 + Math.floor(rng() * 55), cy - 20 + Math.floor(rng() * 18), color);
  }
  drawRubbleCluster(ctx, cx + 28, cy + 12, seed + 71, 2);
  // Writ papers weighted with a river stone against the wind through camp,
  // and an ink pot gone dry with the nib still in it: the paperwork of the
  // end of the world continues on schedule.
  px(ctx, cx + 4, cy - 20, PALETTE.hostBone, 6, 4); // the writ stack
  px(ctx, cx + 5, cy - 19, PALETTE.stoneDark, 3, 1); // a line of script
  px(ctx, cx + 6, cy - 22, PALETTE.stoneMid, 3, 2); // the river stone
  px(ctx, cx - 8, cy - 21, PALETTE.outline, 3, 3);
  px(ctx, cx - 7, cy - 21, PALETTE.hostBlack, 1, 2); // the dry ink pot
  px(ctx, cx - 6, cy - 23, PALETTE.stoneLight, 1, 2); // the nib

}

export function drawLowStool(ctx, cx, cy, seed) {
  const lean = (seed & 1) ? 2 : -2;
  const rng = rngFrom(hash2D(seed + 229, seed * 13 + 31));
  drawShadowBlob(ctx, cx, cy + 5, 34, 13);
  const top = [
    [cx - 18 + lean, cy - 9],
    [cx - 3 + lean, cy - 17],
    [cx + 18 + lean, cy - 9],
    [cx + 3 + lean, cy + 1]
  ];
  poly(ctx, PALETTE.outline, [
    [cx - 20 + lean, cy - 9],
    [cx - 3 + lean, cy - 19],
    [cx + 20 + lean, cy - 9],
    [cx + 3 + lean, cy + 3]
  ]);
  poly(ctx, PALETTE.woodMid, top);
  poly(ctx, PALETTE.woodDark, [
    [cx - 16 + lean, cy - 6],
    [cx + 3 + lean, cy + 1],
    [cx + 18 + lean, cy - 9],
    [cx + 16 + lean, cy - 5],
    [cx + 3 + lean, cy + 6],
    [cx - 16 + lean, cy]
  ]);
  px(ctx, cx - 10 + lean, cy - 13, PALETTE.woodLight, 16, 1);
  px(ctx, cx - 3 + lean, cy - 15, PALETTE.stoneDust, 7, 1);
  linePx(ctx, cx - 13 + lean, cy - 8, cx + 7 + lean, cy - 16, PALETTE.woodDark, 1);
  linePx(ctx, cx - 8 + lean, cy - 4, cx + 14 + lean, cy - 12, PALETTE.woodDark, 1);
  px(ctx, cx - 16 + lean, cy - 9, PALETTE.outline, 6, 2);
  px(ctx, cx - 15 + lean, cy - 10, PALETTE.woodLight, 3, 1);
  px(ctx, cx + 9 + lean, cy - 13, PALETTE.outline, 5, 2);
  px(ctx, cx + 10 + lean, cy - 14, PALETTE.rustDark, 3, 1);
  for (const leg of [[-13, 0], [-2, 5], [12, -1]]) {
    px(ctx, cx + leg[0] + lean, cy + leg[1], PALETTE.outline, 4, 13);
    px(ctx, cx + leg[0] + 1 + lean, cy + leg[1], PALETTE.woodDark, 2, 11);
  }
  px(ctx, cx + 13 + lean, cy + 7, PALETTE.outline, 5, 3);
  px(ctx, cx + 14 + lean, cy + 7, PALETTE.woodDark, 3, 1);
  // Someone sat here whittling: curls of shaving under the seat edge, and on
  // some stools the tin cup they never came back for.
  px(ctx, cx - 15 + lean, cy + 8, PALETTE.woodLight, 3, 1);
  px(ctx, cx - 12 + lean, cy + 9, PALETTE.woodLight, 2, 1);
  if ((seed & 3) === 1) {
    px(ctx, cx + 2 + lean, cy - 16, PALETTE.outline, 5, 5);
    px(ctx, cx + 3 + lean, cy - 15, PALETTE.stoneMid, 3, 3);
    px(ctx, cx + 3 + lean, cy - 16, PALETTE.stoneLight, 2, 1);
  }
  linePx(ctx, cx - 13 + lean, cy + 5, cx + 13 + lean, cy - 3, PALETTE.outline, 2);
  linePx(ctx, cx - 12 + lean, cy + 4, cx + 12 + lean, cy - 4, PALETTE.woodDark, 1);
  px(ctx, cx + 11 + lean, cy - 11, PALETTE.outline, 5, 3);
  px(ctx, cx + 12 + lean, cy - 11, PALETTE.rustLight, 3, 1);
  for (let i = 0; i < 4; i += 1) {
    const x = cx - 11 + lean + Math.floor(rng() * 22);
    const y = cy - 13 + Math.floor(rng() * 8);
    px(ctx, x, y, i % 2 ? PALETTE.woodLight : PALETTE.stoneDark, 2, 1);
  }
  drawRubbleCluster(ctx, cx - 16 + lean, cy + 9, seed + 235, 2);
}

export function drawKitchenHearth(ctx, cx, cy, seed) {
  drawShadowBlob(ctx, cx, cy + 8, 64, 22);
  const rng = rngFrom(hash2D(seed + 83, seed * 7 + 9));
  drawIsoPrism(ctx, cx, cy + 2, 60, 28, 15, {
    top: PALETTE.stoneMid,
    left: PALETTE.stoneDark,
    right: PALETTE.void,
    outline: PALETTE.outline
  });
  poly(ctx, PALETTE.outline, [
    [cx - 28, cy - 17],
    [cx - 5, cy - 29],
    [cx + 27, cy - 17],
    [cx + 24, cy - 8],
    [cx - 4, cy + 6],
    [cx - 28, cy - 5]
  ]);
  poly(ctx, PALETTE.stoneDark, [
    [cx - 25, cy - 16],
    [cx - 5, cy - 27],
    [cx + 24, cy - 16],
    [cx - 4, cy - 2]
  ]);
  poly(ctx, PALETTE.stoneMid, [
    [cx - 23, cy - 18],
    [cx - 5, cy - 27],
    [cx + 2, cy - 24],
    [cx - 16, cy - 14]
  ]);

  // Off-center oven mouth and ash bed. Avoids the face-like symmetry.
  poly(ctx, PALETTE.outline, [
    [cx - 16, cy - 13],
    [cx - 4, cy - 19],
    [cx + 10, cy - 14],
    [cx + 9, cy - 5],
    [cx - 7, cy],
    [cx - 17, cy - 5]
  ]);
  poly(ctx, PALETTE.void, [
    [cx - 13, cy - 12],
    [cx - 4, cy - 17],
    [cx + 7, cy - 13],
    [cx + 7, cy - 6],
    [cx - 6, cy - 2],
    [cx - 14, cy - 6]
  ]);
  px(ctx, cx - 11, cy - 5, PALETTE.rustDark, 17, 3);
  px(ctx, cx - 3, cy - 8, PALETTE.stoneDark, 6, 2);
  // Banked embers in the ash bed: a hearth with no fire read is a black box.
  px(ctx, cx - 8, cy - 6, PALETTE.rustMid, 4, 1);
  px(ctx, cx - 7, cy - 6, PALETTE.hostGold, 2, 1);
  px(ctx, cx - 1, cy - 5, PALETTE.hostGold, 1, 1);
  px(ctx, cx + 2, cy - 6, PALETTE.rustMid, 2, 1);
  px(ctx, cx - 4, cy - 4, PALETTE.hostGlow, 1, 1); // one live coal
  px(ctx, cx - 18, cy - 15, PALETTE.stoneDust, 7, 1);
  px(ctx, cx + 7, cy - 16, PALETTE.stoneDust, 5, 1);
  px(ctx, cx - 12, cy - 2, PALETTE.outline, 9, 2);
  px(ctx, cx - 10, cy - 3, PALETTE.rustDark, 5, 1);
  // Soot licked up the breast above the mouth.
  px(ctx, cx - 6, cy - 22, PALETTE.hostBlack, 8, 3);
  px(ctx, cx - 3, cy - 24, PALETTE.hostBlack, 4, 2);

  drawIsoDiamond(ctx, cx + 16, cy - 15, 16, 8, PALETTE.outline);
  drawIsoDiamond(ctx, cx + 16, cy - 16, 13, 6, PALETTE.rustDark);
  px(ctx, cx + 10, cy - 18, PALETTE.stoneDark, 12, 1);
  linePx(ctx, cx + 10, cy - 21, cx + 4, cy - 18, PALETTE.rustDark);
  linePx(ctx, cx + 23, cy - 19, cx + 28, cy - 16, PALETTE.rustDark);
  linePx(ctx, cx - 25, cy - 11, cx - 5, cy + 1, PALETTE.outline, 1);
  linePx(ctx, cx - 24, cy - 12, cx - 6, cy, PALETTE.stoneDust, 1);
  linePx(ctx, cx + 4, cy - 25, cx + 19, cy - 18, PALETTE.stoneDark, 1);

  for (let i = 0; i < 9; i += 1) {
    const x = cx - 24 + Math.floor(rng() * 48);
    const y = cy - 24 + Math.floor(rng() * 25);
    px(ctx, x, y, rng() < 0.5 ? PALETTE.stoneDark : PALETTE.rustDark);
  }
  for (const [dx, dy] of [[-25, -18], [-17, -7], [22, -11], [12, 0]]) {
    px(ctx, cx + dx, cy + dy, PALETTE.outline, 4, 2);
    px(ctx, cx + dx + 1, cy + dy - 1, rng() < 0.5 ? PALETTE.stoneDust : PALETTE.rustDark, 2, 1);
  }
  drawRubbleCluster(ctx, cx + 27, cy + 11, seed + 91, 2);
  drawNoisePixels(ctx, cx - 25, cy - 22, 50, 24, [PALETTE.stoneDark, PALETTE.rustDark], 0.06, seed);
  // A small pot still hangs over the embers with the spoon standing in it:
  // supper was on when everything stopped, and nobody took it off the heat.
  px(ctx, cx - 2, cy - 18, PALETTE.stoneDark, 1, 4); // the hook chain
  px(ctx, cx - 5, cy - 14, PALETTE.outline, 7, 5);
  px(ctx, cx - 4, cy - 13, PALETTE.stoneDark, 5, 3); // the pot
  px(ctx, cx - 3, cy - 13, PALETTE.stoneMid, 2, 1); // its lit rim
  px(ctx, cx + 1, cy - 17, PALETTE.woodLight, 1, 4); // the spoon, standing

}

export function drawPantryShelf(ctx, cx, cy, seed) {
  drawShadowBlob(ctx, cx, cy + 7, 43, 17);
  const lean = (seed & 1) ? 2 : -2;
  const rng = rngFrom(hash2D(seed + 97, seed * 11 + 5));
  linePx(ctx, cx - 21 + lean, cy - 55, cx - 24 + lean, cy + 1, PALETTE.outline, 4);
  linePx(ctx, cx + 19 + lean, cy - 53, cx + 17 + lean, cy + 2, PALETTE.outline, 4);
  linePx(ctx, cx - 20 + lean, cy - 54, cx - 23 + lean, cy, PALETTE.woodDark, 2);
  linePx(ctx, cx + 20 + lean, cy - 52, cx + 18 + lean, cy + 1, PALETTE.woodDark, 2);
  linePx(ctx, cx - 22 + lean, cy - 47, cx + 16 + lean, cy - 5, PALETTE.outline, 2);
  linePx(ctx, cx - 21 + lean, cy - 47, cx + 15 + lean, cy - 5, PALETTE.woodDark, 1);
  linePx(ctx, cx + 19 + lean, cy - 45, cx - 20 + lean, cy - 9, PALETTE.outline, 1);

  for (const shelf of [
    [-46, 42],
    [-32, 36],
    [-17, 43]
  ]) {
    drawIsoPrism(ctx, cx + lean, cy + shelf[0], shelf[1], 10, 4, {
      top: PALETTE.woodMid,
      left: PALETTE.woodDark,
      right: PALETTE.stoneDark,
      outline: PALETTE.outline
    });
  }

  // Irregular sacks and jars, subdued to avoid toy-like eyes.
  for (const item of [
    [-15, -48, PALETTE.rustDark, 6, 7],
    [-5, -48, PALETTE.stoneDust, 5, 5],
    [8, -46, PALETTE.clothTan, 7, 4],
    [-13, -34, PALETTE.clothDark, 8, 6],
    [2, -32, PALETTE.rustMid, 5, 5],
    [12, -20, PALETTE.stoneDark, 7, 4],
    [-4, -18, PALETTE.clothTan, 9, 3]
  ]) {
    px(ctx, cx + item[0] + lean, cy + item[1], PALETTE.outline, item[3] + 2, item[4] + 1);
    px(ctx, cx + item[0] + 1 + lean, cy + item[1], item[2], item[3], item[4]);
    if (item[2] !== PALETTE.stoneDark) px(ctx, cx + item[0] + 2 + lean, cy + item[1], PALETTE.stoneDust, 2, 1);
  }
  px(ctx, cx + 12 + lean, cy - 35, PALETTE.outline, 9, 2);
  px(ctx, cx + 12 + lean, cy - 34, PALETTE.woodDark, 7, 1);
  px(ctx, cx - 18 + lean, cy - 21, PALETTE.outline, 8, 3);
  px(ctx, cx - 17 + lean, cy - 22, PALETTE.hostBone, 5, 1);
  px(ctx, cx + 2 + lean, cy - 43, PALETTE.outline, 7, 3);
  px(ctx, cx + 3 + lean, cy - 44, PALETTE.rustLight, 4, 1);
  for (const [dx, dy] of [[-19, -40], [16, -39], [-15, -25], [13, -14]]) {
    px(ctx, cx + dx + lean, cy + dy, PALETTE.outline, 3, 3);
    px(ctx, cx + dx + 1 + lean, cy + dy, PALETTE.rustLight, 1, 1);
  }
  for (let i = 0; i < 5; i += 1) {
    px(ctx, cx - 18 + lean + Math.floor(rng() * 36), cy - 52 + Math.floor(rng() * 44), rng() < 0.5 ? PALETTE.woodDark : PALETTE.stoneDark, 1, 1);
  }
  drawRubbleCluster(ctx, cx + 18 + lean, cy + 7, seed + 101, 2);
  drawNoisePixels(ctx, cx - 22, cy - 52, 43, 49, [PALETTE.woodDark, PALETTE.stoneDark], 0.045, seed);
  // One jar lies tipped and licked clean, and a thin trail of droppings runs
  // along the bottom shelf: the shortage arrived before the cult did.
  px(ctx, cx - 2, cy - 6, PALETTE.outline, 6, 4);
  px(ctx, cx - 1, cy - 5, PALETTE.stoneMid, 4, 2); // the tipped jar
  px(ctx, cx + 3, cy - 4, PALETTE.void, 2, 1); // its empty mouth
  for (let d = 0; d < 4; d += 1) px(ctx, cx - 10 + d * 4, cy - 2, PALETTE.hostBlack, 1, 1);

}

export function drawWashTub(ctx, cx, cy, seed) {
  drawShadowBlob(ctx, cx, cy + 6, 43, 15);
  const shift = (seed & 1) ? 1 : -1;
  const rng = rngFrom(hash2D(seed + 193, seed * 17 + 5));
  const rim = [
    [cx - 22 + shift, cy - 12],
    [cx - 3 + shift, cy - 20],
    [cx + 22 + shift, cy - 11],
    [cx + 3 + shift, cy - 2]
  ];
  poly(ctx, PALETTE.outline, [
    [cx - 24 + shift, cy - 12],
    [cx - 3 + shift, cy - 22],
    [cx + 24 + shift, cy - 12],
    [cx + 4 + shift, cy],
    [cx - 22 + shift, cy - 1]
  ]);
  poly(ctx, PALETTE.woodMid, [
    [cx - 22 + shift, cy - 11],
    [cx + 3 + shift, cy - 2],
    [cx + 22 + shift, cy - 11],
    [cx + 21 + shift, cy - 6],
    [cx + 3 + shift, cy + 5],
    [cx - 21 + shift, cy - 3]
  ]);
  poly(ctx, PALETTE.woodDark, [
    [cx + 3 + shift, cy - 2],
    [cx + 22 + shift, cy - 11],
    [cx + 21 + shift, cy - 6],
    [cx + 3 + shift, cy + 5]
  ]);
  poly(ctx, PALETTE.stoneDark, rim);
  drawIsoDiamond(ctx, cx + shift, cy - 11, 35, 14, PALETTE.stoneDark);
  drawIsoDiamond(ctx, cx - 1 + shift, cy - 12, 25, 9, PALETTE.stoneMid);
  drawIsoDiamond(ctx, cx - 2 + shift, cy - 13, 19, 6, PALETTE.stoneLight);
  // The water remembers the wash: a faint red bloom where blood came out of
  // someone's coat, and the scrub ring it left on the staves.
  drawIsoDiamond(ctx, cx + 4 + shift, cy - 12, 9, 4, PALETTE.rustDark);
  px(ctx, cx + 3 + shift, cy - 13, PALETTE.hostRed, 3, 1);
  px(ctx, cx - 19 + shift, cy - 7, PALETTE.rustDark, 35, 2);
  px(ctx, cx - 20 + shift, cy - 3, PALETTE.outline, 36, 2);
  px(ctx, cx - 18 + shift, cy - 2, PALETTE.rustDark, 31, 1);
  px(ctx, cx - 17 + shift, cy + 2, PALETTE.outline, 32, 2);
  px(ctx, cx - 15 + shift, cy + 1, PALETTE.woodDark, 27, 1);
  px(ctx, cx - 11 + shift, cy - 20, PALETTE.clothTan, 11, 5);
  px(ctx, cx + 2 + shift, cy - 18, PALETTE.stoneDust, 9, 3);
  px(ctx, cx - 7 + shift, cy - 19, PALETTE.outline, 9, 2);
  px(ctx, cx - 6 + shift, cy - 20, PALETTE.hostBone, 6, 1);
  px(ctx, cx + 16 + shift, cy - 11, PALETTE.outline, 5, 2);
  px(ctx, cx - 24 + shift, cy - 12, PALETTE.outline, 5, 7);
  px(ctx, cx - 23 + shift, cy - 11, PALETTE.stoneDark, 3, 5);
  px(ctx, cx + 20 + shift, cy - 12, PALETTE.outline, 5, 7);
  px(ctx, cx + 21 + shift, cy - 11, PALETTE.stoneDark, 3, 5);
  for (const dx of [-17, -8, 3, 13]) {
    linePx(ctx, cx + dx + shift, cy - 6, cx + dx + 3 + shift, cy + 3, PALETTE.outline, 1);
    linePx(ctx, cx + dx + shift, cy - 7, cx + dx + 3 + shift, cy + 2, PALETTE.woodDark, 1);
  }
  px(ctx, cx - 7 + shift, cy - 15, PALETTE.hostBone, 5, 1);
  px(ctx, cx + 4 + shift, cy - 15, PALETTE.hostBone, 4, 1);
  for (let i = 0; i < 5; i += 1) {
    const x = cx - 17 + shift + Math.floor(rng() * 34);
    const y = cy - 13 + Math.floor(rng() * 13);
    px(ctx, x, y, rng() < 0.5 ? PALETTE.stoneDust : PALETTE.woodDark, 2, 1);
  }
  drawRubbleCluster(ctx, cx - 24 + shift, cy + 8, seed + 197, 2);
  drawNoisePixels(ctx, cx - 21, cy - 18, 42, 22, [PALETTE.woodDark, PALETTE.stoneDark], 0.055, seed);
  // A mirror shard propped against the rim, catching what light there is:
  // somebody still shaves. Standards are standards.
  px(ctx, cx + 18 + shift, cy - 16, PALETTE.outline, 4, 6);
  px(ctx, cx + 19 + shift, cy - 15, PALETTE.stoneLight, 2, 4); // the shard
  px(ctx, cx + 19 + shift, cy - 15, PALETTE.hostBone, 1, 1); // its catch of light

}

export function drawDiningTable(ctx, cx, cy, seed, opts = {}) {
  const frame = isoFrame(cx, cy, opts.orient);
  const rng = rngFrom(hash2D(seed + 71, seed * 5 + 13));
  const lenA = 1.9;
  const lenB = 0.92;
  const legH = 13;
  const slabT = 5;
  const ext = footprintExtent(lenA, lenB);
  drawShadowBlob(ctx, cx, cy + 5, ext.w * 0.82, ext.h * 0.82);

  const ha = lenA / 2;
  const hb = lenB / 2;
  const legCorners = [
    frame.point(-ha + 0.06, -hb + 0.12),
    frame.point(ha - 0.06, -hb + 0.12),
    frame.point(ha - 0.06, hb - 0.12),
    frame.point(-ha + 0.06, hb - 0.12)
  ].sort((a, b) => a[1] - b[1]);
  // Trestle stretcher between the leg pairs, low to the ground.
  const sA = frame.point(-ha + 0.1, 0, 3);
  const sB = frame.point(ha - 0.1, 0, 3);
  linePx(ctx, sA[0], sA[1], sB[0], sB[1], PALETTE.outline, 3);
  linePx(ctx, sA[0], sA[1] - 1, sB[0], sB[1] - 1, PALETTE.woodDark, 1);
  for (const c of legCorners) drawPropLeg(ctx, c, legH, PALETTE.woodDark);

  const box = orientedBox(ctx, frame, lenA, lenB, slabT, {
    top: PALETTE.woodMid,
    lit: PALETTE.woodMid,
    shade: PALETTE.woodDark,
    outline: PALETTE.outline
  }, legH);

  // Plank seams along the long axis.
  for (let i = 1; i < 4; i += 1) {
    const lb = -hb + (i / 4) * (2 * hb);
    const a0 = frame.point(-ha + 0.06, lb, legH + slabT);
    const a1 = frame.point(ha - 0.06, lb, legH + slabT);
    linePx(ctx, a0[0], a0[1], a1[0], a1[1], PALETTE.woodDark, 1);
  }
  // Lit upper-left edge of the plank top.
  linePx(ctx, box.cap.left[0], box.cap.left[1], box.cap.top[0], box.cap.top[1], PALETTE.woodLight, 1);
  linePx(ctx, box.cap.top[0], box.cap.top[1], box.cap.right[0], box.cap.right[1], PALETTE.woodLight, 1);
  linePx(ctx, box.cap.left[0], box.cap.left[1] + 3, box.cap.bottom[0], box.cap.bottom[1] + 2, PALETTE.outline, 1);
  linePx(ctx, box.cap.bottom[0], box.cap.bottom[1] + 2, box.cap.right[0], box.cap.right[1] + 2, PALETTE.woodDark, 1);

  // Tableware in local coords so it follows the facing. Bowls, a tin cup, bread.
  const setTop = legH + slabT;
  for (const [la, lb] of [[-0.58, -0.1], [-0.05, 0.12], [0.5, -0.08]]) {
    const p = frame.point(la, lb, setTop);
    drawIsoDiamond(ctx, p[0], p[1], 9, 5, PALETTE.outline);
    drawIsoDiamond(ctx, p[0], p[1] - 1, 7, 4, PALETTE.stoneDust);
    px(ctx, p[0] - 1, p[1] - 2, PALETTE.stoneMid, 2, 1);
  }
  const cup = frame.point(0.18, -0.22, setTop);
  px(ctx, cup[0] - 2, cup[1] - 5, PALETTE.outline, 5, 6);
  px(ctx, cup[0] - 1, cup[1] - 4, PALETTE.stoneMid, 3, 4);
  px(ctx, cup[0] - 1, cup[1] - 5, PALETTE.stoneLight, 2, 1);
  const bread = frame.point(-0.32, 0.16, setTop);
  px(ctx, bread[0] - 3, bread[1] - 3, PALETTE.rustDark, 7, 4);
  px(ctx, bread[0] - 2, bread[1] - 4, PALETTE.clothTan, 4, 2);
  const rag = frame.point(0.66, 0.18, setTop);
  px(ctx, rag[0] - 4, rag[1] - 2, PALETTE.outline, 9, 4);
  px(ctx, rag[0] - 3, rag[1] - 3, PALETTE.clothDark, 6, 2);
  for (const [la, lb] of [[-0.78, -0.32], [0.78, -0.29], [-0.74, 0.3], [0.72, 0.3]]) {
    const p = frame.point(la, lb, setTop);
    px(ctx, p[0] - 1, p[1] - 1, PALETTE.outline, 3, 3);
    px(ctx, p[0], p[1] - 1, PALETTE.rustLight, 1, 1);
  }
  const braceA = frame.point(-ha + 0.13, hb - 0.08, 6);
  const braceB = frame.point(ha - 0.14, -hb + 0.08, 6);
  linePx(ctx, braceA[0], braceA[1], braceB[0], braceB[1], PALETTE.outline, 2);
  linePx(ctx, braceA[0], braceA[1] - 1, braceB[0], braceB[1] - 1, PALETTE.woodDark, 1);

  // Knife scars and grime, kept sparse so it reads as use, not noise.
  for (let i = 0; i < 4; i += 1) {
    const p = frame.point(-ha + rng() * lenA, -hb + rng() * lenB, setTop);
    px(ctx, p[0], p[1], rng() < 0.5 ? PALETTE.woodDark : PALETTE.woodLight, rng() < 0.4 ? 2 : 1, 1);
  }
  const tableDebris = frame.point(0.82, 0.42);
  drawRubbleCluster(ctx, tableDebris[0], tableDebris[1] + 4, seed + 79, 2);
  // Bowls at every place and one on the floor below a shoved-back gap: the
  // meal was set for a crowd that stood up all at once.
  const placeA = frame.point(-0.5, -0.2, setTop);
  const placeB = frame.point(0.45, 0.18, setTop);
  for (const p of [placeA, placeB]) {
    px(ctx, p[0] - 2, p[1] - 1, PALETTE.outline, 5, 3);
    px(ctx, p[0] - 1, p[1] - 1, PALETTE.stoneDust, 3, 2);
  }
  const dropped = frame.point(0.62, 0.4, 0);
  px(ctx, dropped[0] - 2, dropped[1] + 2, PALETTE.outline, 5, 3);
  px(ctx, dropped[0] - 1, dropped[1] + 2, PALETTE.stoneMid, 3, 2); // on its rim

}

export function drawDiningBench(ctx, cx, cy, seed, opts = {}) {
  const frame = isoFrame(cx, cy, opts.orient);
  const rng = rngFrom(hash2D(seed + 29, seed * 3 + 7));
  const lenA = 1.7;
  const lenB = 0.34;
  const legH = 8;
  const slabT = 3;
  const ext = footprintExtent(lenA, lenB);
  drawShadowBlob(ctx, cx, cy + 3, ext.w * 0.78, ext.h * 0.92);

  const ha = lenA / 2;
  const hb = lenB / 2;
  const legCorners = [
    frame.point(-ha + 0.08, 0),
    frame.point(ha - 0.08, 0)
  ].sort((a, b) => a[1] - b[1]);
  for (const c of legCorners) drawPropLeg(ctx, c, legH, PALETTE.woodDark);

  const box = orientedBox(ctx, frame, lenA, lenB, slabT, {
    top: PALETTE.woodMid,
    lit: PALETTE.woodMid,
    shade: PALETTE.woodDark,
    outline: PALETTE.outline
  }, legH);
  linePx(ctx, box.cap.left[0], box.cap.left[1], box.cap.top[0], box.cap.top[1], PALETTE.woodLight, 1);
  linePx(ctx, box.cap.bottom[0], box.cap.bottom[1] + 1, box.cap.right[0], box.cap.right[1] + 1, PALETTE.woodDark, 1);

  // A worn seat scuff and a couple of grain lines along the plank.
  const a0 = frame.point(-ha + 0.1, 0, legH + slabT);
  const a1 = frame.point(ha - 0.1, 0, legH + slabT);
  linePx(ctx, a0[0], a0[1], a1[0], a1[1], PALETTE.woodDark, 1);
  const braceA = frame.point(-ha + 0.16, 0, 4);
  const braceB = frame.point(ha - 0.16, 0, 4);
  linePx(ctx, braceA[0], braceA[1] + 1, braceB[0], braceB[1] + 1, PALETTE.outline, 2);
  linePx(ctx, braceA[0], braceA[1], braceB[0], braceB[1], PALETTE.woodDark, 1);
  for (const la of [-0.68, 0.68]) {
    const p = frame.point(la, -0.08, legH + slabT);
    px(ctx, p[0] - 1, p[1] - 1, PALETTE.outline, 3, 3);
    px(ctx, p[0], p[1] - 1, PALETTE.rustLight, 1, 1);
  }
  for (let i = 0; i < 3; i += 1) {
    const p = frame.point(-ha + rng() * lenA, -hb + rng() * lenB, legH + slabT);
    px(ctx, p[0], p[1], PALETTE.woodLight, 1, 1);
  }
  // A child's chalk game scratched on one bench end, half rubbed out.
  if (seed % 4 === 2) {
    const chalk = frame.point(ha - 0.22, 0, legH + slabT);
    px(ctx, chalk[0] - 2, chalk[1] - 1, PALETTE.stoneDust, 2, 1);
    px(ctx, chalk[0] + 1, chalk[1] - 2, PALETTE.stoneDust, 1, 2);
    px(ctx, chalk[0] - 1, chalk[1] + 1, PALETTE.stoneDust, 1, 1);
  }
  const benchDebris = frame.point(-0.78, 0.24);
  drawRubbleCluster(ctx, benchDebris[0], benchDebris[1] + 3, seed + 37, 2);
  // Two sets of initials carved into the seat edge with a plus between
  // them, older than everything else in the room. Somebody was young here.
  const carve = frame.point(-0.5, 0.1, legH + slabT);
  px(ctx, carve[0], carve[1], PALETTE.woodLight, 2, 2);
  px(ctx, carve[0] + 3, carve[1] + 1, PALETTE.woodLight, 1, 1); // the plus
  px(ctx, carve[0] + 5, carve[1], PALETTE.woodLight, 2, 2);

}

export function drawKitchenCounter(ctx, cx, cy, seed, opts = {}) {
  const frame = isoFrame(cx, cy, opts.orient);
  const rng = rngFrom(hash2D(seed + 53, seed * 7 + 5));
  const lenA = 1.42;
  const lenB = 0.82;
  const baseH = 16;
  const topT = 4;
  const ext = footprintExtent(lenA, lenB);
  drawShadowBlob(ctx, cx, cy + 6, ext.w * 0.86, ext.h * 0.86);

  // Stone base.
  const base = orientedBox(ctx, frame, lenA, lenB, baseH, {
    top: PALETTE.stoneDark,
    lit: PALETTE.stoneMid,
    shade: PALETTE.stoneDark,
    outline: PALETTE.outline
  });
  // Drawer / panel seams on the lit lower-left face.
  const seam = (t) => {
    const a = [
      base.cap.left[0] + (base.cap.bottom[0] - base.cap.left[0]) * t,
      base.cap.left[1] + (base.cap.bottom[1] - base.cap.left[1]) * t
    ];
    const b = [
      base.base.left[0] + (base.base.bottom[0] - base.base.left[0]) * t,
      base.base.left[1] + (base.base.bottom[1] - base.base.left[1]) * t
    ];
    linePx(ctx, a[0], a[1] + 2, b[0], b[1] - 2, PALETTE.void, 1);
  };
  seam(0.5);
  seam(0.24);
  seam(0.76);
  px(ctx, base.cap.bottom[0] - 9, base.cap.bottom[1] + 6, PALETTE.stoneDust, 3, 1);
  for (const t of [0.28, 0.52, 0.78]) {
    const p = [
      base.cap.left[0] + (base.cap.bottom[0] - base.cap.left[0]) * t,
      base.cap.left[1] + (base.cap.bottom[1] - base.cap.left[1]) * t + 8
    ];
    px(ctx, p[0] - 1, p[1], PALETTE.outline, 4, 2);
    px(ctx, p[0], p[1] - 1, PALETTE.rustLight, 2, 1);
  }

  // Wood worktop, slightly overhanging the base.
  const top = orientedBox(ctx, frame, lenA + 0.12, lenB + 0.12, topT, {
    top: PALETTE.woodMid,
    lit: PALETTE.woodMid,
    shade: PALETTE.woodDark,
    outline: PALETTE.outline
  }, baseH);
  linePx(ctx, top.cap.left[0], top.cap.left[1], top.cap.top[0], top.cap.top[1], PALETTE.woodLight, 1);
  linePx(ctx, top.cap.bottom[0], top.cap.bottom[1] + 1, top.cap.right[0], top.cap.right[1] + 1, PALETTE.woodDark, 1);

  // Prep clutter on the worktop, placed in local coords.
  const workTop = baseH + topT;
  const board = frame.point(-0.28, 0.04, workTop);
  drawIsoDiamond(ctx, board[0], board[1], 16, 8, PALETTE.outline);
  drawIsoDiamond(ctx, board[0], board[1] - 1, 13, 6, PALETTE.woodLight);
  for (let i = 0; i < 4; i += 1) {
    px(ctx, board[0] - 5 + i * 3, board[1] - 1, PALETTE.rustDark, 1, 1);
  }
  // A knife laid across the board.
  const k0 = frame.point(-0.44, -0.06, workTop);
  const k1 = frame.point(-0.1, 0.12, workTop);
  linePx(ctx, k0[0], k0[1], k1[0], k1[1], PALETTE.stoneLight, 1);
  px(ctx, k0[0] - 1, k0[1], PALETTE.woodDark, 2, 2);
  // A clay jar and a bowl.
  const jar = frame.point(0.4, -0.1, workTop);
  px(ctx, jar[0] - 3, jar[1] - 8, PALETTE.outline, 7, 9);
  px(ctx, jar[0] - 2, jar[1] - 7, PALETTE.rustMid, 5, 7);
  px(ctx, jar[0] - 1, jar[1] - 6, PALETTE.rustLight, 2, 2);
  const bowl = frame.point(0.22, 0.16, workTop);
  drawIsoDiamond(ctx, bowl[0], bowl[1], 9, 5, PALETTE.outline);
  drawIsoDiamond(ctx, bowl[0], bowl[1] - 1, 6, 3, PALETTE.stoneDust);
  const jarCap = frame.point(0.47, -0.22, workTop);
  px(ctx, jarCap[0] - 2, jarCap[1] - 5, PALETTE.outline, 5, 2);
  px(ctx, jarCap[0] - 1, jarCap[1] - 6, PALETTE.hostBone, 3, 1);
  const cloth = frame.point(-0.55, 0.18, workTop);
  px(ctx, cloth[0] - 4, cloth[1] - 2, PALETTE.outline, 9, 4);
  px(ctx, cloth[0] - 3, cloth[1] - 3, PALETTE.clothTan, 6, 2);

  drawNoisePixels(ctx, cx - 18, cy - workTop, 36, workTop + 6, [PALETTE.stoneDark, PALETTE.woodDark], 0.03, seed);
  if (rng() < 0.5) px(ctx, top.cap.top[0] - 4, top.cap.top[1] - 1, PALETTE.hostBone, 2, 1);
  const counterDebris = frame.point(0.62, 0.44);
  drawRubbleCluster(ctx, counterDebris[0], counterDebris[1] + 4, seed + 61, 2);
  // A floured handprint on the counter edge, fingers spread: the last touch
  // before whatever made them stop touching things.
  const hand = frame.point(-0.3, 0.14, workTop ?? 16);
  px(ctx, hand[0] - 2, hand[1] - 1, PALETTE.stoneDust, 5, 3); // the palm
  for (let f = 0; f < 4; f += 1) px(ctx, hand[0] - 2 + f * 2, hand[1] - 3, PALETTE.stoneDust, 1, 2);

}

export function drawFarmPrepTable(ctx, cx, cy, seed, opts = {}) {
  const frame = isoFrame(cx, cy, opts.orient);
  const rng = rngFrom(hash2D(seed + 109, seed * 7 + 23));
  const lenA = 1.48;
  const lenB = 0.68;
  const legH = 11;
  const slabT = 4;
  const ext = footprintExtent(lenA, lenB);
  const ha = lenA / 2;
  const hb = lenB / 2;
  drawShadowBlob(ctx, cx, cy + 5, ext.w * 0.82, ext.h * 0.86);

  const legs = [
    frame.point(-ha + 0.07, -hb + 0.08),
    frame.point(ha - 0.07, -hb + 0.08),
    frame.point(ha - 0.07, hb - 0.08),
    frame.point(-ha + 0.07, hb - 0.08)
  ].sort((a, b) => a[1] - b[1]);
  for (const p of legs) drawPropLeg(ctx, p, legH, PALETTE.woodDark);

  const shelfA = frame.point(-ha + 0.08, 0, 4);
  const shelfB = frame.point(ha - 0.1, 0, 4);
  linePx(ctx, shelfA[0], shelfA[1], shelfB[0], shelfB[1], PALETTE.outline, 3);
  linePx(ctx, shelfA[0], shelfA[1] - 1, shelfB[0], shelfB[1] - 1, PALETTE.woodMid, 1);

  const box = orientedBox(ctx, frame, lenA, lenB, slabT, {
    top: PALETTE.woodMid,
    lit: PALETTE.woodMid,
    shade: PALETTE.woodDark,
    outline: PALETTE.outline
  }, legH);
  linePx(ctx, box.cap.left[0], box.cap.left[1], box.cap.top[0], box.cap.top[1], PALETTE.woodLight, 1);
  for (let i = 1; i < 3; i += 1) {
    const lb = -hb + (i / 3) * (2 * hb);
    const a0 = frame.point(-ha + 0.06, lb, legH + slabT);
    const a1 = frame.point(ha - 0.06, lb, legH + slabT);
    linePx(ctx, a0[0], a0[1], a1[0], a1[1], PALETTE.woodDark, 1);
  }

  const topH = legH + slabT;
  const board = frame.point(-0.2, 0.02, topH);
  drawIsoDiamond(ctx, board[0], board[1], 18, 8, PALETTE.outline);
  drawIsoDiamond(ctx, board[0], board[1] - 1, 15, 6, PALETTE.woodLight);
  for (let i = 0; i < 4; i += 1) px(ctx, board[0] - 6 + i * 4, board[1] - 1, PALETTE.rustDark, 1, 1);

  const bowl = frame.point(0.36, -0.1, topH);
  drawIsoDiamond(ctx, bowl[0], bowl[1], 12, 6, PALETTE.outline);
  drawIsoDiamond(ctx, bowl[0], bowl[1] - 1, 9, 4, PALETTE.stoneDust);
  px(ctx, bowl[0] - 3, bowl[1] - 3, PALETTE.stoneMid, 6, 1);

  const sack = frame.point(0.44, 0.16, topH);
  px(ctx, sack[0] - 5, sack[1] - 8, PALETTE.outline, 10, 9);
  px(ctx, sack[0] - 4, sack[1] - 7, PALETTE.clothTan, 8, 7);
  px(ctx, sack[0] - 3, sack[1] - 7, PALETTE.stoneDust, 2, 2);
  px(ctx, sack[0] - 2, sack[1] - 2, PALETTE.rustDark, 5, 1);

  const knifeA = frame.point(-0.42, -0.12, topH);
  const knifeB = frame.point(-0.08, 0.08, topH);
  linePx(ctx, knifeA[0], knifeA[1], knifeB[0], knifeB[1], PALETTE.stoneLight, 1);
  px(ctx, knifeA[0] - 1, knifeA[1], PALETTE.woodDark, 2, 2);
  const hookA = frame.point(-0.58, 0.28, 7);
  const hookB = frame.point(-0.36, 0.28, 7);
  linePx(ctx, hookA[0], hookA[1], hookB[0], hookB[1], PALETTE.outline, 2);
  px(ctx, hookB[0] - 1, hookB[1] + 1, PALETTE.rustLight, 3, 4);
  const nail = frame.point(0.62, -0.28, topH);
  px(ctx, nail[0] - 1, nail[1] - 1, PALETTE.outline, 3, 3);
  px(ctx, nail[0], nail[1] - 1, PALETTE.rustLight, 1, 1);

  for (let i = 0; i < 5; i += 1) {
    const p = frame.point(-ha + rng() * lenA, -hb + rng() * lenB, topH);
    px(ctx, p[0], p[1], rng() < 0.5 ? PALETTE.woodLight : PALETTE.woodDark, rng() < 0.35 ? 2 : 1, 1);
  }
  const prepDebris = frame.point(0.62, 0.38);
  drawRubbleCluster(ctx, prepDebris[0], prepDebris[1] + 4, seed + 113, 2);
  // The knife stands mid-chop in a split root: the meal nobody finished
  // making is still waiting to be finished.
  const chop = frame.point(0.1, -0.1, legH + slabT);
  px(ctx, chop[0] - 3, chop[1] - 1, PALETTE.clothTan, 6, 3); // the split root
  px(ctx, chop[0] - 1, chop[1], PALETTE.void, 1, 2); // the cut
  px(ctx, chop[0], chop[1] - 5, PALETTE.stoneLight, 1, 5); // the blade, standing
  px(ctx, chop[0] - 1, chop[1] - 7, PALETTE.woodDark, 3, 2); // its grip

}

export function drawFarmKitchenHearth(ctx, cx, cy, seed) {
  const rng = rngFrom(hash2D(seed + 127, seed * 11 + 41));
  drawShadowBlob(ctx, cx, cy + 8, 60, 22);

  drawIsoPrism(ctx, cx, cy + 2, 58, 26, 11, {
    top: PALETTE.clothTan,
    left: PALETTE.woodMid,
    right: PALETTE.woodDark,
    outline: PALETTE.outline
  });

  poly(ctx, PALETTE.outline, [
    [cx - 26, cy - 16],
    [cx - 4, cy - 28],
    [cx + 26, cy - 16],
    [cx + 25, cy - 9],
    [cx - 4, cy + 6],
    [cx - 27, cy - 5]
  ]);
  poly(ctx, PALETTE.clothTan, [
    [cx - 23, cy - 16],
    [cx - 4, cy - 26],
    [cx + 22, cy - 16],
    [cx - 4, cy - 4]
  ]);
  poly(ctx, PALETTE.woodMid, [
    [cx - 23, cy - 16],
    [cx - 4, cy - 4],
    [cx - 26, cy - 6]
  ]);
  poly(ctx, PALETTE.woodDark, [
    [cx - 4, cy - 4],
    [cx + 22, cy - 16],
    [cx + 23, cy - 10]
  ]);

  poly(ctx, PALETTE.outline, [
    [cx - 12, cy - 13],
    [cx - 3, cy - 18],
    [cx + 9, cy - 14],
    [cx + 8, cy - 7],
    [cx - 5, cy - 2],
    [cx - 13, cy - 6]
  ]);
  poly(ctx, PALETTE.void, [
    [cx - 10, cy - 12],
    [cx - 3, cy - 16],
    [cx + 6, cy - 13],
    [cx + 6, cy - 8],
    [cx - 5, cy - 4],
    [cx - 11, cy - 7]
  ]);
  // Banked embers so the farm hearth reads as recently lived-with.
  px(ctx, cx - 6, cy - 7, PALETTE.rustMid, 4, 1);
  px(ctx, cx - 5, cy - 7, PALETTE.hostGold, 2, 1);
  px(ctx, cx + 1, cy - 8, PALETTE.hostGold, 1, 1);
  px(ctx, cx - 2, cy - 6, PALETTE.hostGlow, 1, 1);

  linePx(ctx, cx - 24, cy - 18, cx + 24, cy - 17, PALETTE.woodDark, 3);
  linePx(ctx, cx - 23, cy - 19, cx + 23, cy - 18, PALETTE.woodLight, 1);
  px(ctx, cx + 12, cy - 21, PALETTE.outline, 8, 7);
  px(ctx, cx + 13, cy - 20, PALETTE.rustDark, 6, 5);
  px(ctx, cx + 14, cy - 21, PALETTE.rustLight, 3, 1);
  linePx(ctx, cx + 13, cy - 24, cx + 7, cy - 20, PALETTE.rustDark, 1);
  linePx(ctx, cx + 20, cy - 24, cx + 27, cy - 20, PALETTE.rustDark, 1);
  px(ctx, cx - 20, cy - 15, PALETTE.outline, 8, 2);
  px(ctx, cx - 18, cy - 16, PALETTE.clothTan, 5, 1);
  px(ctx, cx + 16, cy - 11, PALETTE.outline, 7, 2);
  px(ctx, cx + 17, cy - 12, PALETTE.rustDark, 4, 1);
  linePx(ctx, cx - 21, cy - 10, cx - 5, cy - 2, PALETTE.outline, 1);
  linePx(ctx, cx - 20, cy - 11, cx - 6, cy - 3, PALETTE.woodDark, 1);
  linePx(ctx, cx + 4, cy - 26, cx + 19, cy - 17, PALETTE.outline, 1);
  linePx(ctx, cx + 5, cy - 26, cx + 18, cy - 18, PALETTE.stoneDust, 1);

  for (let i = 0; i < 8; i += 1) {
    const x = cx - 24 + Math.floor(rng() * 48);
    const y = cy - 23 + Math.floor(rng() * 22);
    px(ctx, x, y, rng() < 0.5 ? PALETTE.rustDark : PALETTE.stoneDark);
  }
  for (const [dx, dy] of [[-23, -17], [-11, -7], [21, -12], [12, 0]]) {
    px(ctx, cx + dx, cy + dy, PALETTE.outline, 4, 2);
    px(ctx, cx + dx + 1, cy + dy - 1, rng() < 0.5 ? PALETTE.clothTan : PALETTE.rustDark, 2, 1);
  }
  drawRubbleCluster(ctx, cx + 25, cy + 11, seed + 131, 2);
  drawNoisePixels(ctx, cx - 24, cy - 22, 48, 26, [PALETTE.rustDark, PALETTE.woodDark, PALETTE.stoneDark], 0.045, seed);
}

export function drawSealedStorageCrate(ctx, cx, cy, seed) {
  const rng = rngFrom(hash2D(seed + 47, seed * 5 + 11));
  drawShadowBlob(ctx, cx, cy + 8, 66, 18);

  const top = [
    [cx - 34, cy - 14],
    [cx - 8, cy - 27],
    [cx + 34, cy - 13],
    [cx + 8, cy + 4]
  ];
  const front = [
    [cx - 34, cy - 14],
    [cx + 8, cy + 4],
    [cx + 8, cy + 13],
    [cx - 34, cy - 2]
  ];
  const right = [
    [cx + 8, cy + 4],
    [cx + 34, cy - 13],
    [cx + 33, cy - 3],
    [cx + 8, cy + 13]
  ];
  poly(ctx, PALETTE.outline, [
    [cx - 36, cy - 14],
    [cx - 8, cy - 29],
    [cx + 36, cy - 14],
    [cx + 35, cy - 1],
    [cx + 9, cy + 15],
    [cx - 36, cy - 1]
  ]);
  poly(ctx, PALETTE.woodDark, front);
  poly(ctx, PALETTE.stoneDark, right);
  poly(ctx, PALETTE.woodMid, top);

  poly(ctx, PALETTE.clothTan, [
    [cx - 26, cy - 14],
    [cx - 6, cy - 23],
    [cx + 24, cy - 13],
    [cx + 5, cy - 2],
    [cx - 9, cy - 5]
  ]);
  poly(ctx, PALETTE.stoneDust, [
    [cx - 25, cy - 14],
    [cx - 6, cy - 22],
    [cx - 1, cy - 20],
    [cx - 20, cy - 11]
  ]);
  linePx(ctx, cx - 30, cy - 13, cx + 7, cy + 4, PALETTE.woodLight, 1);
  linePx(ctx, cx - 29, cy - 6, cx + 7, cy + 8, PALETTE.woodMid, 1);
  linePx(ctx, cx + 11, cy + 4, cx + 32, cy - 9, PALETTE.outline, 1);
  linePx(ctx, cx + 13, cy + 8, cx + 32, cy - 3, PALETTE.rustDark, 1);

  for (const [x0, y0, x1, y1] of [
    [-23, -10, -2, -21],
    [10, -3, 30, -12]
  ]) {
    linePx(ctx, cx + x0, cy + y0, cx + x1, cy + y1, PALETTE.rustDark, 3);
    linePx(ctx, cx + x0 + 1, cy + y0 - 1, cx + x1 + 1, cy + y1 - 1, PALETTE.rustLight, 1);
  }
  linePx(ctx, cx - 29, cy - 14, cx + 10, cy + 4, PALETTE.outline, 1);
  linePx(ctx, cx - 26, cy - 15, cx + 8, cy + 3, PALETTE.woodDark, 1);
  linePx(ctx, cx - 8, cy - 24, cx + 28, cy - 12, PALETTE.outline, 1);
  linePx(ctx, cx - 6, cy - 25, cx + 26, cy - 13, PALETTE.stoneDust, 1);
  linePx(ctx, cx - 22, cy - 9, cx - 21, cy + 2, PALETTE.rustDark, 3);
  linePx(ctx, cx + 11, cy - 2, cx + 11, cy + 9, PALETTE.rustDark, 3);

  px(ctx, cx - 6, cy - 1, PALETTE.outline, 13, 9);
  px(ctx, cx - 5, cy, PALETTE.rustDark, 11, 7);
  px(ctx, cx - 1, cy + 1, PALETTE.rustLight, 4, 2);
  px(ctx, cx + 2, cy + 3, PALETTE.void, 2, 2);
  px(ctx, cx - 17, cy - 17, PALETTE.hostBone, 5, 2);
  px(ctx, cx + 18, cy - 16, PALETTE.hostBone, 5, 2);
  px(ctx, cx - 7, cy - 5, PALETTE.clothDark, 2, 1);
  px(ctx, cx + 5, cy - 9, PALETTE.clothDark, 3, 1);
  for (const [dx, dy, tone] of [
    [-32, -10, PALETTE.rustLight],
    [-18, 0, PALETTE.woodLight],
    [6, 6, PALETTE.rustDark],
    [27, -7, PALETTE.hostBone]
  ]) {
    px(ctx, cx + dx, cy + dy, PALETTE.outline, 5, 3);
    px(ctx, cx + dx + 1, cy + dy - 1, tone, 2, 1);
  }

  // Sealed means SEALED: a stencilled requisition mark on the front board and
  // a red wax blob pressed over the hasp cord.
  px(ctx, cx - 20, cy - 6, PALETTE.hostBlack, 7, 5); // stencil field
  px(ctx, cx - 18, cy - 5, PALETTE.stoneDust, 1, 3); // stencil cross
  px(ctx, cx - 19, cy - 4, PALETTE.stoneDust, 3, 1);
  px(ctx, cx + 1, cy + 5, PALETTE.hostRed, 3, 2); // wax seal on the hasp
  px(ctx, cx + 2, cy + 5, PALETTE.rustMid, 1, 1);
  px(ctx, cx - 2, cy + 6, PALETTE.clothTan, 3, 1); // the sealed cord tail

  for (let i = 0; i < 12; i += 1) {
    const x = cx - 30 + Math.floor(rng() * 58);
    const y = cy - 21 + Math.floor(rng() * 28);
    px(ctx, x, y, rng() < 0.45 ? PALETTE.woodDark : PALETTE.rustDark, 1 + Math.floor(rng() * 2), 1);
  }
  drawRubbleCluster(ctx, cx + 31, cy + 14, seed + 53, 2);
  drawNoisePixels(ctx, cx - 31, cy - 23, 62, 34, [PALETTE.woodDark, PALETTE.rustDark, PALETTE.stoneDark], 0.026, seed);
}

export function drawRustedBarrel(ctx, cx, cy, seed, opts = {}) {
  drawShadowBlob(ctx, cx, cy + 6, 34, 15);
  const rng = rngFrom(hash2D(seed + 173, seed * 17 + 3));

  // Rasterized cylinder: stepped oval caps and row-width changes avoid a box.
  for (let row = 0; row < 29; row += 1) {
    const y = cy - 23 + row;
    const topCurve = row < 5 ? 5 - row : 0;
    const bottomCurve = row > 23 ? row - 23 : 0;
    const inset = Math.max(topCurve, bottomCurve);
    const half = 17 - inset;
    px(ctx, cx - half - 2, y, PALETTE.outline, half * 2 + 4, 1);
    px(ctx, cx - half, y, PALETTE.rustMid, half, 1);
    px(ctx, cx, y, PALETTE.rustDark, half, 1);
    if (row % 5 === 1) px(ctx, cx - half + 3, y, PALETTE.rustLight, 3, 1);
  }

  px(ctx, cx - 10, cy - 30, PALETTE.outline, 21, 2);
  px(ctx, cx - 16, cy - 28, PALETTE.outline, 33, 5);
  px(ctx, cx - 18, cy - 25, PALETTE.outline, 37, 4);
  px(ctx, cx - 9, cy - 30, PALETTE.rustLight, 19, 2);
  px(ctx, cx - 15, cy - 27, PALETTE.rustMid, 31, 4);
  px(ctx, cx - 17, cy - 24, PALETTE.rustDark, 35, 2);
  px(ctx, cx - 10, cy - 26, PALETTE.void, 18, 3);
  px(ctx, cx - 7, cy - 27, PALETTE.rustDark, 11, 2);

  px(ctx, cx - 15, cy - 19, PALETTE.stoneDark, 31, 3);
  px(ctx, cx - 14, cy - 8, PALETTE.stoneDark, 29, 3);
  px(ctx, cx - 10, cy + 1, PALETTE.stoneDark, 21, 2);
  px(ctx, cx - 11, cy - 18, PALETTE.rustLight, 2, 17);
  px(ctx, cx + 8, cy - 18, PALETTE.outline, 2, 18);
  px(ctx, cx + 3, cy - 27, PALETTE.hostGold, 3, 2);
  px(ctx, cx - 17, cy - 16, PALETTE.outline, 5, 2);
  px(ctx, cx - 16, cy - 17, PALETTE.rustLight, 3, 1);
  px(ctx, cx + 11, cy - 4, PALETTE.outline, 5, 2);
  px(ctx, cx + 12, cy - 5, PALETTE.stoneDust, 3, 1);
  for (const [dx, dy] of [[-12, -24], [12, -21], [-7, -5], [5, 2]]) {
    px(ctx, cx + dx, cy + dy, PALETTE.outline, 3, 3);
    px(ctx, cx + dx + 1, cy + dy, rng() < 0.5 ? PALETTE.rustLight : PALETTE.stoneDark, 1, 1);
  }
  drawNoisePixels(ctx, cx - 16, cy - 25, 32, 28, [PALETTE.rustDark, PALETTE.stoneDark], 0.06, seed);
  drawRubbleCluster(ctx, cx + 18, cy + 8, seed + 179, 2);

  // Secret entrance/exit barrels carry a timber ladder rising out of the open
  // top, so the way between floors is unmistakable rather than just another keg.
  if (opts.ladder) {
    const top = cy - 58;
    const bot = cy - 24;
    const lx = cx - 6;
    const rx = cx + 4;
    px(ctx, lx - 1, top, PALETTE.outline, 3, bot - top);
    px(ctx, rx - 1, top, PALETTE.outline, 3, bot - top);
    px(ctx, lx, top, PALETTE.woodMid, 2, bot - top);
    px(ctx, rx, top, PALETTE.woodMid, 2, bot - top);
    px(ctx, lx, top, PALETTE.woodLight, 1, bot - top);
    for (let ry = top + 3; ry < bot; ry += 7) {
      px(ctx, lx, ry, PALETTE.outline, rx - lx + 2, 3);
      px(ctx, lx + 1, ry + 1, PALETTE.woodLight, rx - lx, 1);
    }
    px(ctx, lx - 4, top - 3, PALETTE.outline, 15, 4);
    px(ctx, lx - 2, top - 4, PALETTE.woodMid, 11, 2);
  }
  // A rain line inside the rim and a shared tin cup on the lid: the camp
  // drinks from this one, rust and all.
  px(ctx, cx - 6, cy - 25, PALETTE.stoneDark, 12, 1);
  px(ctx, cx + 3, cy - 30, PALETTE.outline, 5, 5);
  px(ctx, cx + 4, cy - 29, PALETTE.stoneMid, 3, 3);
  px(ctx, cx + 4, cy - 30, PALETTE.stoneLight, 2, 1);

}

export function drawStoneStairwell(ctx, cx, cy, seed) {
  // A narrow stair cut through the chapel wall: a squat masonry portal with
  // worn treads climbing into the dark. It must read as "stairs you can take
  // through this wall" from gameplay distance, in both directions.
  const rng = rngFrom(hash2D(seed + 59, seed * 7 + 13));
  drawShadowBlob(ctx, cx, cy + 6, 58, 20);

  const baseY = cy + 6; // floor line at the portal mouth
  const jambH = 46; // masonry surround height
  const innerW = 24; // dark passage width

  // Worn landing slab at the foot, the stone the log talks about.
  drawIsoDiamond(ctx, cx + 2, baseY + 2, 40, 15, PALETTE.outline);
  drawIsoDiamond(ctx, cx + 2, baseY + 1, 34, 12, PALETTE.stoneMid);
  drawIsoDiamond(ctx, cx + 6, baseY + 2, 16, 6, PALETTE.stoneDust); // foot-polished centre
  px(ctx, cx - 8, baseY + 3, PALETTE.stoneDark, 7, 1); // slab seam
  px(ctx, cx + 9, baseY - 1, PALETTE.stoneDark, 5, 1);

  // Masonry surround: two block jambs and a heavy lintel, chipped.
  const jamb = (jx, lit) => {
    px(ctx, jx - 1, baseY - jambH, PALETTE.outline, 9, jambH);
    px(ctx, jx, baseY - jambH + 1, lit ? PALETTE.stoneMid : PALETTE.stoneDark, 7, jambH - 2);
    for (let b = 1; b < 6; b += 1) {
      const by = baseY - jambH + 2 + b * 7 + (b % 2);
      px(ctx, jx, by, PALETTE.outline, 7, 1); // block courses
      if (b % 2 === 0) px(ctx, jx + (lit ? 1 : 4), by - 3, lit ? PALETTE.stoneDust : PALETTE.stoneMid, 2, 2);
    }
    px(ctx, jx + (lit ? 0 : 5), baseY - 8, PALETTE.void, 2, 3); // chipped base
  };
  jamb(cx - Math.floor(innerW / 2) - 8, true);
  jamb(cx + Math.floor(innerW / 2) + 1, false);
  px(ctx, cx - Math.floor(innerW / 2) - 10, baseY - jambH - 5, PALETTE.outline, innerW + 20, 7); // lintel
  px(ctx, cx - Math.floor(innerW / 2) - 9, baseY - jambH - 4, PALETTE.stoneMid, innerW + 18, 4);
  px(ctx, cx - Math.floor(innerW / 2) - 9, baseY - jambH - 4, PALETTE.stoneDust, 12, 1); // lit top edge
  px(ctx, cx + 4, baseY - jambH - 2, PALETTE.void, 5, 2); // broken lintel bite
  px(ctx, cx - 2, baseY - jambH + 2, PALETTE.stoneDark, 10, 1); // soot line under the lintel

  // The passage void behind the treads.
  px(ctx, cx - Math.floor(innerW / 2), baseY - jambH + 3, PALETTE.void, innerW, jambH - 3);

  // Treads climbing into the dark: wide and lit at the mouth, narrower and
  // darker with height until the black swallows them.
  for (let i = 0; i < 6; i += 1) {
    const w = innerW - i * 3;
    const y = baseY - 2 - i * 7;
    const x = cx - Math.floor(w / 2) + Math.round(i * 1.2); // drift right: the stair bends into the wall
    const top = i < 2 ? PALETTE.stoneDust : i < 4 ? PALETTE.stoneMid : PALETTE.stoneDark;
    px(ctx, x - 1, y - 2, PALETTE.outline, w + 2, 5);
    px(ctx, x, y - 2, top, w, 2); // tread top catches the light
    px(ctx, x, y, i < 4 ? PALETTE.stoneDark : PALETTE.void, w, 2); // riser in shadow
    if (i === 1) px(ctx, x + 3, y - 2, PALETTE.stoneLight, 4, 1); // one foot-worn tread
    if (i === 2) px(ctx, x + w - 4, y - 1, PALETTE.void, 3, 1); // a broken tread corner
  }

  // Rope rail pinned to the lit jamb, sagging between iron pins.
  const railX = cx - Math.floor(innerW / 2) - 4;
  linePx(ctx, railX, baseY - 12, railX + 4, baseY - 26, PALETTE.rustDark, 1);
  linePx(ctx, railX + 4, baseY - 26, railX + 7, baseY - 38, PALETTE.rustMid, 1);
  px(ctx, railX - 1, baseY - 12, PALETTE.stoneLight, 2, 1); // iron pins
  px(ctx, railX + 3, baseY - 26, PALETTE.stoneLight, 2, 1);
  px(ctx, railX + 6, baseY - 38, PALETTE.stoneLight, 2, 1);

  // Ash footprints climbing the lower treads: someone went up, recently,
  // and did not sweep behind themselves.
  px(ctx, cx - 4, baseY - 3, PALETTE.stoneDust, 3, 2);
  px(ctx, cx + 2, baseY - 4, PALETTE.stoneDust, 3, 2);
  px(ctx, cx - 1, baseY - 10, PALETTE.stoneDust, 3, 1);
  // A censure chalk tally on the lit jamb: the sweeps this passage has seen.
  px(ctx, cx - Math.floor(innerW / 2) - 6, baseY - 32, PALETTE.stoneLight, 1, 4);
  px(ctx, cx - Math.floor(innerW / 2) - 4, baseY - 32, PALETTE.stoneLight, 1, 4);
  px(ctx, cx - Math.floor(innerW / 2) - 7, baseY - 30, PALETTE.stoneLight, 5, 1);

  // Rubble and grit where the wall was cut.
  drawRubbleCluster(ctx, cx + Math.floor(innerW / 2) + 8, baseY + 1, seed + 91, 2);
  drawNoisePixels(ctx, cx - 20, baseY - 4, 40, 8, [PALETTE.stoneDust, PALETTE.stoneDark], 0.05, seed);
  // Over the climbing footprints, a second set coming DOWN - longer stride,
  // heavier, dragging at the heel. Someone went up. Something came down.
  px(ctx, cx - 8, baseY - 6, PALETTE.stoneDark, 4, 2);
  px(ctx, cx + 1, baseY - 1, PALETTE.stoneDark, 4, 2);
  px(ctx, cx + 3, baseY + 1, PALETTE.stoneDark, 5, 1); // the heel drag

}
