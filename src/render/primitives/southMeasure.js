// Reusable exterior blocks and working-town props for South Measure.
// The settlement is built from repaired intake infrastructure, freight scrap,
// old relief canvas, and a century of household patching.

import { PALETTE } from '../palette.js';
import { TILE_HEIGHT, TILE_WIDTH } from '../renderConfig.js';
import {
  diamond,
  drawIsoDiamond,
  drawIsoPrism,
  drawNoisePixels,
  drawRubbleCluster,
  faceTools,
  hash2D,
  isoFrame,
  linePx,
  mixPoint,
  nativeLinePx,
  nativePx,
  orientedBox,
  poly,
  px,
  rngFrom
} from './basePixels.js';

const BUILDING_STYLES = {
  rowhouse: {
    wallH: 36,
    wallLit: PALETTE.clayMid,
    wallShade: PALETTE.clayDark,
    trim: PALETTE.limeMid,
    roof: PALETTE.clothDark,
    roofShade: PALETTE.rustDark,
    roofLight: PALETTE.woodLight,
    detail: 'patchwork',
    roofFamily: 'tar'
  },
  'rowhouse-tar': {
    wallH: 36,
    wallLit: PALETTE.clayMid,
    wallShade: PALETTE.clayDark,
    trim: PALETTE.limeMid,
    roof: PALETTE.clothDark,
    roofShade: PALETTE.rustDark,
    roofLight: PALETTE.stoneDust,
    detail: 'patchwork',
    roofFamily: 'tar'
  },
  'rowhouse-timber': {
    wallH: 37,
    wallLit: PALETTE.woodLight,
    wallShade: PALETTE.woodDark,
    trim: PALETTE.rustLight,
    roof: PALETTE.woodDark,
    roofShade: PALETTE.outline,
    roofLight: PALETTE.woodLight,
    detail: 'patchwork',
    roofFamily: 'timber'
  },
  'rowhouse-sheet': {
    wallH: 35,
    wallLit: PALETTE.clayMid,
    wallShade: PALETTE.clayDark,
    trim: PALETTE.ironLight,
    roof: PALETTE.ironDark,
    roofShade: PALETTE.outline,
    roofLight: PALETTE.ironLight,
    detail: 'patchwork',
    roofFamily: 'sheet'
  },
  'rowhouse-lime': {
    wallH: 38,
    wallLit: PALETTE.limeMid,
    wallShade: PALETTE.limeDark,
    trim: PALETTE.limeLight,
    roof: PALETTE.ironMid,
    roofShade: PALETTE.ironDark,
    roofLight: PALETTE.ironLight,
    detail: 'patchwork',
    roofFamily: 'lime'
  },
  annex: {
    wallH: 48,
    wallLit: PALETTE.ironMid,
    wallShade: PALETTE.ironDark,
    trim: PALETTE.ironLight,
    roof: PALETTE.ironDark,
    roofShade: PALETTE.outline,
    roofLight: PALETTE.ironLight,
    detail: 'industrial'
  },
  clinic: {
    wallH: 40,
    wallLit: PALETTE.limeLight,
    wallShade: PALETTE.limeMid,
    trim: PALETTE.hostBone,
    roof: PALETTE.ironMid,
    roofShade: PALETTE.ironDark,
    roofLight: PALETTE.ironLight,
    detail: 'clinic'
  },
  freight: {
    wallH: 43,
    wallLit: PALETTE.clayMid,
    wallShade: PALETTE.clayDark,
    trim: PALETTE.clayLight,
    roof: PALETTE.ironDark,
    roofShade: PALETTE.outline,
    roofLight: PALETTE.ironLight,
    detail: 'freight'
  },
  hall: {
    wallH: 42,
    wallLit: PALETTE.limeMid,
    wallShade: PALETTE.limeDark,
    trim: PALETTE.limeLight,
    roof: PALETTE.ironMid,
    roofShade: PALETTE.ironDark,
    roofLight: PALETTE.ironLight,
    detail: 'hall'
  },
  booth: {
    wallH: 34,
    wallLit: PALETTE.limeMid,
    wallShade: PALETTE.limeDark,
    trim: PALETTE.limeLight,
    roof: PALETTE.ironDark,
    roofShade: PALETTE.outline,
    roofLight: PALETTE.ironLight,
    detail: 'booth'
  },
  burial: {
    wallH: 37,
    wallLit: PALETTE.clayDark,
    wallShade: PALETTE.woodDark,
    trim: PALETTE.clayMid,
    roof: PALETTE.ironDark,
    roofShade: PALETTE.outline,
    roofLight: PALETTE.ironMid,
    detail: 'burial'
  }
};

function buildingStyle(variant) {
  return BUILDING_STYLES[variant] ?? BUILDING_STYLES.rowhouse;
}

const SOUTH_MEASURE_ROOF_THICKNESS = 5;

export function southMeasureBuildingGeometry(cx, cy, wallH) {
  const roofLift = wallH + SOUTH_MEASURE_ROOF_THICKNESS;
  return {
    roofLift,
    base: diamond(cx, cy, TILE_WIDTH, TILE_HEIGHT),
    wallTop: diamond(cx, cy - wallH, TILE_WIDTH, TILE_HEIGHT),
    roof: diamond(cx, cy - roofLift, TILE_WIDTH, TILE_HEIGHT)
  };
}

function roofSurfacePoint(roof, u, v) {
  const back = mixPoint(roof.left, roof.top, u);
  const front = mixPoint(roof.bottom, roof.right, u);
  return mixPoint(back, front, v);
}

function drawBuildingRoofTexture(ctx, roof, formSeed, style) {
  const rng = rngFrom(hash2D(formSeed + 1709, formSeed * 7 + 1733));
  const lit = style.roofLight;
  const dark = style.roofShade;
  const family = style.roofFamily ?? style.detail;

  if (family === 'sheet' || ['clinic', 'hall', 'booth'].includes(style.detail)) {
    // Long folded seams and staggered fasteners make sheet roofs read as
    // worked metal instead of uninterrupted coloured diamonds.
    for (let index = 0; index < 4; index += 1) {
      const u = 0.13 + index * 0.24 + (rng() - 0.5) * 0.025;
      const a = roofSurfacePoint(roof, u, 0.07);
      const b = roofSurfacePoint(roof, u, 0.93);
      linePx(ctx, a[0], a[1], b[0], b[1], dark, 2);
      nativeLinePx(ctx, a[0] - 0.5, a[1] - 0.5, b[0] - 0.5, b[1] - 0.5, lit);
      for (const v of [0.26, 0.58, 0.84]) {
        const rivet = roofSurfacePoint(roof, u, v);
        nativePx(ctx, rivet[0] - 0.5, rivet[1] - 0.5, (index + Math.round(v * 10)) & 1 ? PALETTE.rustLight : PALETTE.ironLight);
      }
    }
    const patchU = 0.12 + rng() * 0.48;
    const patchV = 0.24 + rng() * 0.36;
    const patch = [
      roofSurfacePoint(roof, patchU, patchV),
      roofSurfacePoint(roof, patchU + 0.25, patchV + 0.015),
      roofSurfacePoint(roof, patchU + 0.23, patchV + 0.2),
      roofSurfacePoint(roof, patchU + 0.02, patchV + 0.18)
    ];
    poly(ctx, PALETTE.outline, patch);
    const inset = [
      roofSurfacePoint(roof, patchU + 0.035, patchV + 0.04),
      roofSurfacePoint(roof, patchU + 0.215, patchV + 0.05),
      roofSurfacePoint(roof, patchU + 0.195, patchV + 0.16),
      roofSurfacePoint(roof, patchU + 0.05, patchV + 0.145)
    ];
    poly(ctx, (formSeed & 1) ? PALETTE.ironMid : PALETTE.rustDark, inset);
    nativeLinePx(ctx, inset[0][0], inset[0][1] - 0.5, inset[1][0], inset[1][1] - 0.5, PALETTE.ironLight);
    return;
  }

  if (family === 'timber') {
    for (let index = 0; index < 5; index += 1) {
      const v = 0.1 + index * 0.19;
      const a = roofSurfacePoint(roof, 0.06, v);
      const b = roofSurfacePoint(roof, 0.94, v + (index & 1 ? 0.025 : -0.015));
      linePx(ctx, a[0], a[1], b[0], b[1], PALETTE.outline, 2);
      nativeLinePx(ctx, a[0] + 0.5, a[1] - 0.5, b[0] - 0.5, b[1] - 0.5, index < 2 ? PALETTE.woodLight : PALETTE.woodMid);
    }
    for (let index = 0; index < 3; index += 1) {
      const knot = roofSurfacePoint(roof, 0.2 + rng() * 0.62, 0.18 + rng() * 0.64);
      px(ctx, knot[0] - 2, knot[1] - 1, PALETTE.outline, 5, 3);
      nativePx(ctx, knot[0] - 0.5, knot[1] - 0.5, PALETTE.woodLight);
    }
    return;
  }

  if (family === 'tar') {
    for (let index = 0; index < 3; index += 1) {
      const v = 0.2 + index * 0.27 + (rng() - 0.5) * 0.04;
      const a = roofSurfacePoint(roof, 0.05, v);
      const b = roofSurfacePoint(roof, 0.95, v + 0.035);
      linePx(ctx, a[0], a[1], b[0], b[1], PALETTE.outline, 2);
      nativeLinePx(ctx, a[0] + 1.5, a[1] - 0.5, b[0] - 1.5, b[1] - 0.5, index === 0 ? PALETTE.stoneDust : PALETTE.woodMid);
    }
    for (let index = 0; index < 7; index += 1) {
      const grit = roofSurfacePoint(roof, 0.08 + rng() * 0.84, 0.08 + rng() * 0.84);
      nativePx(ctx, grit[0], grit[1], index % 3 ? PALETTE.stoneDark : PALETTE.stoneDust);
    }
    return;
  }

  if (family === 'lime' || style.detail === 'burial' || style.detail === 'freight') {
    for (let index = 0; index < 3; index += 1) {
      const a = roofSurfacePoint(roof, 0.12 + index * 0.13, 0.14 + index * 0.22);
      const m = roofSurfacePoint(roof, 0.45 + index * 0.08, 0.3 + index * 0.19);
      const b = roofSurfacePoint(roof, 0.78 + index * 0.04, 0.24 + index * 0.2);
      linePx(ctx, a[0], a[1], m[0], m[1], PALETTE.outline, 1);
      linePx(ctx, m[0], m[1], b[0], b[1], dark, 1);
      nativeLinePx(ctx, a[0] + 0.5, a[1] - 0.5, m[0], m[1] - 0.5, lit);
    }
  }
}

function drawBuildingMaterialTexture(face, formSeed, style, shaded) {
  const rng = rngFrom(hash2D(formSeed + 1753, formSeed * 11 + 1777));
  const highlight = shaded ? style.wallLit : style.trim;
  const shadow = shaded ? PALETTE.outline : style.wallShade;

  if (['clinic', 'hall', 'booth'].includes(style.detail)) {
    // Uneven limewashed masonry courses retain cold civic precision without
    // becoming a modern clean panel wall.
    for (const [index, v] of [0.18, 0.39, 0.61, 0.82].entries()) {
      face.line(0.02, v, 0.98, v + ((formSeed + index) & 1 ? 0.008 : -0.006), shadow, 1);
      if (index < 2) face.nativeLine(0.04, v - 0.012, 0.96, v - 0.006, highlight);
      const joint = 0.2 + (((formSeed >>> (index * 4)) & 15) / 15) * 0.58;
      face.line(joint, Math.max(0.04, v - 0.2), joint + 0.01, v, shadow, 1);
    }
    for (let index = 0; index < 3; index += 1) {
      const u = 0.08 + rng() * 0.82;
      const v = 0.15 + rng() * 0.7;
      face.nativeLine(u, v, Math.min(0.95, u + 0.08), v + 0.015, index ? PALETTE.limeDark : PALETTE.limeLight);
    }
    return;
  }

  if (style.detail === 'freight' || style.detail === 'burial') {
    for (let index = 0; index < 6; index += 1) {
      const u = 0.07 + index * 0.17 + (rng() - 0.5) * 0.025;
      face.line(u, 0.08, u + ((index & 1) ? 0.012 : -0.008), 0.94, PALETTE.outline, 1);
      if (index < 3) face.nativeLine(u + 0.012, 0.12, u + 0.018, 0.9, shaded ? PALETTE.clayDark : PALETTE.clayLight);
    }
    return;
  }

  if (style.detail === 'industrial') {
    for (const v of [0.2, 0.48, 0.76]) {
      face.line(0.03, v, 0.97, v + 0.01, PALETTE.outline, 2);
      face.nativeLine(0.05, v - 0.012, 0.95, v - 0.005, shaded ? PALETTE.ironDark : PALETTE.ironLight);
    }
    for (const u of [0.1, 0.42, 0.74, 0.92]) {
      face.nativeLine(u, 0.12, u, 0.88, (Math.round(u * 100) + formSeed) & 1 ? PALETTE.rustDark : PALETTE.ironLight);
    }
    return;
  }

  if (style.detail === 'patchwork') {
    for (let index = 0; index < 4; index += 1) {
      const u = 0.08 + rng() * 0.84;
      const v = 0.14 + rng() * 0.72;
      const length = 0.07 + rng() * 0.12;
      face.nativeLine(u, v, Math.min(0.96, u + length), v + (rng() - 0.5) * 0.025, index & 1 ? PALETTE.clayDark : PALETTE.clayLight);
    }
    const chipU = 0.11 + rng() * 0.56;
    const chipV = 0.38 + rng() * 0.34;
    face.rect(chipU, chipV, chipU + 0.18, chipV + 0.15, PALETTE.outline);
    face.rect(chipU + 0.025, chipV + 0.03, chipU + 0.155, chipV + 0.12, (formSeed & 1) ? PALETTE.woodDark : PALETTE.limeDark);
  }
}

function connectedEdgeMask(connected = {}) {
  return (connected.xMinus ? 1 : 0)
    | (connected.xPlus ? 2 : 0)
    | (connected.yMinus ? 4 : 0)
    | (connected.yPlus ? 8 : 0);
}

function buildingFormSeed(seed, connected = {}) {
  // The renderer's seed is the stable hash of the authored grid coordinates.
  // Do not fold cx/cy into this value: cached props draw first on a scratch
  // canvas, so those arguments describe the raster target rather than the map.
  return hash2D(
    seed + connectedEdgeMask(connected) * 71,
    seed * 5 + connectedEdgeMask(connected) * 193
  );
}

function drawRaisedRoofEdge(ctx, from, to, seed, colors, height = 5) {
  const rng = rngFrom(hash2D(seed + 613, seed * 5 + 29));
  const gap = 0.12 + rng() * 0.16;
  const split = 0.38 + rng() * 0.2;
  const spans = [[0.04, split - gap / 2], [split + gap / 2, 0.96]];
  for (const [start, end] of spans) {
    if (end - start < 0.12) continue;
    const a = mixPoint(from, to, start);
    const b = mixPoint(from, to, end);
    const rise = height + ((Math.floor(rng() * 3) - 1) * 2);
    const ah = [a[0], a[1] - rise];
    const bh = [b[0], b[1] - rise];
    poly(ctx, colors.face, [a, b, bh, ah]);
    linePx(ctx, a[0], a[1], b[0], b[1], colors.outline, 2);
    linePx(ctx, ah[0], ah[1], bh[0], bh[1], colors.outline, 3);
    linePx(ctx, ah[0] + 1, ah[1] - 1, bh[0] - 1, bh[1] - 1, colors.top, 1);
    linePx(ctx, a[0], a[1], ah[0], ah[1], colors.outline, 2);
    linePx(ctx, b[0], b[1], bh[0], bh[1], colors.outline, 2);
  }
}

function roofPanel(ctx, roof, points, style, highlight = true) {
  const polygon = points.map(([u, v]) => roofSurfacePoint(roof, u, v));
  poly(ctx, style.roof, polygon);
  for (let index = 0; index < polygon.length; index += 1) {
    const a = polygon[index];
    const b = polygon[(index + 1) % polygon.length];
    linePx(ctx, a[0], a[1], b[0], b[1], PALETTE.outline, 2);
  }
  if (highlight) {
    const a = polygon[0];
    const b = polygon[1];
    linePx(ctx, a[0], a[1] - 1, b[0], b[1] - 1, style.roofLight, 1);
  }
}

function drawIndustrialShellRoof(ctx, roof, formSeed, style) {
  const mode = formSeed & 3;
  const backCuts = [
    [[0.02, 0.02], [0.98, 0.02], [0.98, 0.2], [0.71, 0.27], [0.51, 0.18], [0.31, 0.29], [0.02, 0.22]],
    [[0.02, 0.02], [0.98, 0.02], [0.98, 0.28], [0.79, 0.2], [0.63, 0.34], [0.37, 0.22], [0.18, 0.31], [0.02, 0.23]],
    [[0.02, 0.02], [0.77, 0.02], [0.72, 0.22], [0.54, 0.17], [0.42, 0.31], [0.21, 0.2], [0.02, 0.27]],
    [[0.2, 0.02], [0.98, 0.02], [0.98, 0.24], [0.72, 0.19], [0.57, 0.32], [0.36, 0.2], [0.2, 0.29]]
  ];
  const sideCuts = [
    [[0.02, 0.2], [0.31, 0.29], [0.25, 0.5], [0.39, 0.64], [0.24, 0.82], [0.02, 0.94]],
    [[0.02, 0.22], [0.18, 0.31], [0.34, 0.48], [0.21, 0.65], [0.29, 0.82], [0.02, 0.98]],
    [[0.02, 0.25], [0.21, 0.2], [0.34, 0.42], [0.2, 0.58], [0.31, 0.77], [0.02, 0.91]],
    [[0.02, 0.02], [0.2, 0.02], [0.2, 0.29], [0.35, 0.48], [0.2, 0.67], [0.27, 0.87], [0.02, 0.98]]
  ];
  const frontCuts = [
    [[0.02, 0.94], [0.24, 0.82], [0.46, 0.73], [0.62, 0.84], [0.82, 0.7], [0.98, 0.78], [0.98, 0.98], [0.02, 0.98]],
    [[0.02, 0.98], [0.29, 0.82], [0.47, 0.88], [0.62, 0.72], [0.79, 0.85], [0.98, 0.76], [0.98, 0.98]],
    [[0.02, 0.91], [0.31, 0.77], [0.48, 0.83], [0.68, 0.69], [0.98, 0.81], [0.98, 0.98], [0.02, 0.98]],
    [[0.02, 0.98], [0.27, 0.87], [0.45, 0.74], [0.65, 0.86], [0.8, 0.7], [0.98, 0.77], [0.98, 0.98]]
  ];

  roofPanel(ctx, roof, backCuts[mode], style);
  if (mode !== 2) roofPanel(ctx, roof, sideCuts[mode], style, false);
  if (mode !== 3) roofPanel(ctx, roof, frontCuts[mode], style, false);

  // A surviving sheet on alternating bays makes the missing area jagged rather
  // than a neat, reusable square aperture.
  if ((formSeed >>> 3) & 1) {
    roofPanel(ctx, roof, [
      [0.75, 0.22], [0.98, 0.27], [0.98, 0.68], [0.83, 0.69], [0.7, 0.55], [0.79, 0.39]
    ], style, false);
  }
}

function drawBrokenRoofPerimeter(ctx, edge, seed, color) {
  const rng = rngFrom(hash2D(seed + 641, seed * 11 + 7));
  const gapStart = 0.32 + rng() * 0.2;
  const gapEnd = Math.min(0.82, gapStart + 0.16 + rng() * 0.12);
  const firstEnd = mixPoint(edge.from, edge.to, gapStart);
  const secondStart = mixPoint(edge.from, edge.to, gapEnd);
  linePx(ctx, edge.from[0], edge.from[1], firstEnd[0], firstEnd[1], color, 2);
  linePx(ctx, secondStart[0], secondStart[1], edge.to[0], edge.to[1], color, 2);
}

export function southMeasureRoofPerimeterEdges(roof, connected = {}) {
  return [
    { side: 'xMinus', from: roof.top, to: roof.left, lit: true },
    { side: 'yMinus', from: roof.top, to: roof.right, lit: true },
    { side: 'yPlus', from: roof.left, to: roof.bottom, lit: false },
    { side: 'xPlus', from: roof.bottom, to: roof.right, lit: false }
  ].filter((edge) => !connected[edge.side]);
}

function drawBuildingRoofIdentity(ctx, roof, seed, style, connected, formSeed) {
  const cornerCell = !connected.xMinus && !connected.yMinus;

  if (style.detail === 'patchwork') {
    const rng = rngFrom(formSeed);
    const familyOffset = { tar: 0, timber: 3, sheet: 7, lime: 11 }[style.roofFamily] ?? 0;
    const repair = (formSeed + familyOffset) % 13;
    const u0 = 0.08 + rng() * 0.28;
    const v0 = 0.12 + rng() * 0.22;
    if (repair === 0 || repair === 3) {
      const width = repair === 0 ? 0.48 : 0.28;
      const depth = repair === 0 ? 0.34 : 0.46;
      const panel = [
        roofSurfacePoint(roof, u0, v0),
        roofSurfacePoint(roof, Math.min(0.94, u0 + width), v0 + 0.03),
        roofSurfacePoint(roof, Math.min(0.94, u0 + width - 0.04), Math.min(0.91, v0 + depth)),
        roofSurfacePoint(roof, u0 + 0.02, Math.min(0.91, v0 + depth - 0.04))
      ];
      poly(ctx, PALETTE.outline, panel);
      const inset = [
        roofSurfacePoint(roof, u0 + 0.04, v0 + 0.05),
        roofSurfacePoint(roof, Math.min(0.9, u0 + width - 0.04), v0 + 0.07),
        roofSurfacePoint(roof, Math.min(0.88, u0 + width - 0.08), Math.min(0.87, v0 + depth - 0.04)),
        roofSurfacePoint(roof, u0 + 0.06, Math.min(0.87, v0 + depth - 0.08))
      ];
      poly(ctx, repair === 0 ? PALETTE.rustMid : PALETTE.woodMid, inset);
      const seamCount = repair === 0 ? 3 : 2;
      for (let index = 1; index <= seamCount; index += 1) {
        const t = index / (seamCount + 1);
        const a = mixPoint(inset[0], inset[1], t);
        const b = mixPoint(inset[3], inset[2], t);
        linePx(ctx, a[0], a[1], b[0], b[1], index & 1 ? PALETTE.rustLight : PALETTE.outline, 1);
      }
    } else if (repair === 1) {
      const stitchA = roofSurfacePoint(roof, 0.11 + rng() * 0.16, 0.2 + rng() * 0.16);
      const stitchB = roofSurfacePoint(roof, 0.72 + rng() * 0.16, 0.58 + rng() * 0.18);
      linePx(ctx, stitchA[0], stitchA[1], stitchB[0], stitchB[1], PALETTE.outline, 2);
      linePx(ctx, stitchA[0] + 1, stitchA[1] - 1, stitchB[0] + 1, stitchB[1] - 1, PALETTE.stoneDust, 1);
      for (const t of [0.18, 0.42, 0.67, 0.86]) {
        const p = mixPoint(stitchA, stitchB, t);
        px(ctx, p[0] - 1, p[1] - 2, PALETTE.rustLight, 3, 3);
      }
    } else if (repair === 2) {
      for (let index = 0; index < 3; index += 1) {
        const a = roofSurfacePoint(roof, 0.14 + index * 0.13, 0.24 + index * 0.1);
        const b = roofSurfacePoint(roof, 0.46 + index * 0.12, 0.3 + index * 0.1);
        linePx(ctx, a[0], a[1], b[0], b[1], PALETTE.outline, 4);
        linePx(ctx, a[0], a[1] - 1, b[0], b[1] - 1, index === 1 ? PALETTE.woodLight : PALETTE.woodMid, 2);
      }
    }

    // Party walls remain visible inside connected housing runs. Their broken,
    // raised caps split a long run into believable households without changing
    // any collision cells.
    const partyColors = { face: PALETTE.woodDark, top: PALETTE.stoneDust, outline: PALETTE.outline };
    if (connected.xMinus && ((formSeed >>> 4) & 15) === 0) {
      drawRaisedRoofEdge(ctx, roof.top, roof.left, formSeed + 17, partyColors, 5 + ((formSeed >>> 8) & 3));
    }
    if (connected.yMinus && ((formSeed >>> 6) & 15) === 1) {
      drawRaisedRoofEdge(ctx, roof.top, roof.right, formSeed + 31, partyColors, 4 + ((formSeed >>> 10) & 3));
    }

    if (!connected.yPlus) {
      linePx(ctx, roof.left[0], roof.left[1] + 2, roof.bottom[0], roof.bottom[1] + 2, PALETTE.outline, 3);
      linePx(ctx, roof.left[0] + 1, roof.left[1] + 1, roof.bottom[0] - 1, roof.bottom[1] + 1, PALETTE.stoneDust, 1);
    }
    const exposed = !connected.xMinus || !connected.xPlus || !connected.yMinus || !connected.yPlus;
    if (cornerCell || (exposed && ((formSeed >>> 12) & 15) === 1)) {
      const flueU = 0.18 + ((formSeed >>> 14) & 255) / 255 * 0.62;
      const flueV = 0.16 + ((formSeed >>> 22) & 63) / 63 * 0.48;
      const pipe = roofSurfacePoint(roof, flueU, flueV);
      const flueH = 12 + ((formSeed >>> 5) & 7);
      const flueW = ((formSeed >>> 3) & 1) ? 7 : 5;
      px(ctx, pipe[0] - Math.floor(flueW / 2), pipe[1] - flueH, PALETTE.outline, flueW, flueH + 2);
      px(ctx, pipe[0] - Math.floor(flueW / 2) + 1, pipe[1] - flueH + 1, PALETTE.rustDark, Math.max(2, flueW - 3), flueH - 1);
      px(ctx, pipe[0] - Math.floor(flueW / 2) - 1, pipe[1] - flueH - 3, PALETTE.outline, flueW + 2, 4);
      px(ctx, pipe[0] - Math.floor(flueW / 2), pipe[1] - flueH - 4, (formSeed & 1) ? PALETTE.stoneDust : PALETTE.rustLight, flueW, 2);
    }

    // One component-level rooftop fixture identifies how each household run
    // has been kept alive. The map assigns one roof family to an entire
    // authored footprint, so these read as separate homes instead of a vent
    // and repair decal stamped independently onto every logical tile.
    if (cornerCell && style.roofFamily === 'timber') {
      const railA0 = roofSurfacePoint(roof, 0.18, 0.28);
      const railA1 = roofSurfacePoint(roof, 0.76, 0.35);
      const railB0 = roofSurfacePoint(roof, 0.2, 0.62);
      const railB1 = roofSurfacePoint(roof, 0.78, 0.69);
      for (const [a, b] of [[railA0, railA1], [railB0, railB1]]) {
        linePx(ctx, a[0], a[1] - 4, b[0], b[1] - 4, PALETTE.outline, 4);
        linePx(ctx, a[0] + 1, a[1] - 5, b[0] - 1, b[1] - 5, PALETTE.woodLight, 1);
      }
      for (const u of [0.28, 0.44, 0.6, 0.72]) {
        const a = roofSurfacePoint(roof, u, 0.22);
        const b = roofSurfacePoint(roof, u, 0.75);
        linePx(ctx, a[0], a[1] - 5, b[0], b[1] - 5, PALETTE.rustDark, 2);
      }
    } else if (cornerCell && style.roofFamily === 'sheet') {
      const pan = roofSurfacePoint(roof, 0.34, 0.48);
      drawIsoDiamond(ctx, pan[0], pan[1] - 3, 30, 12, PALETTE.outline);
      drawIsoDiamond(ctx, pan[0] - 1, pan[1] - 4, 24, 8, PALETTE.clothBlueDark);
      nativeLinePx(ctx, pan[0] - 7.5, pan[1] - 6.5, pan[0] + 5.5, pan[1] - 9.5, PALETTE.clothBlue);
    } else if (cornerCell && style.roofFamily === 'lime') {
      const datum = roofSurfacePoint(roof, 0.34, 0.48);
      drawIsoPrism(ctx, datum[0], datum[1] - 2, 22, 11, 9, {
        top: PALETTE.hostBone,
        left: PALETTE.stoneLight,
        right: PALETTE.stoneDark,
        outline: PALETTE.outline
      });
      px(ctx, datum[0] - 2, datum[1] - 26, PALETTE.outline, 5, 17);
      px(ctx, datum[0], datum[1] - 25, PALETTE.rustMid, 2, 14);
    } else if (cornerCell && style.roofFamily === 'tar') {
      const seamA = roofSurfacePoint(roof, 0.12, 0.7);
      const seamB = roofSurfacePoint(roof, 0.83, 0.22);
      linePx(ctx, seamA[0], seamA[1], seamB[0], seamB[1], PALETTE.outline, 3);
      for (const t of [0.18, 0.38, 0.58, 0.78]) {
        const stitch = mixPoint(seamA, seamB, t);
        px(ctx, stitch[0] - 1, stitch[1] - 2, PALETTE.clothTan, 3, 3);
      }
      const householdMode = (formSeed >>> 8) & 3;
      if (householdMode === 0) {
        // A low drying horse belongs to one roof, never stamped per tile.
        const railA = roofSurfacePoint(roof, 0.18, 0.3);
        const railB = roofSurfacePoint(roof, 0.74, 0.38);
        linePx(ctx, railA[0], railA[1] - 7, railB[0], railB[1] - 7, PALETTE.outline, 4);
        linePx(ctx, railA[0] + 1, railA[1] - 8, railB[0] - 1, railB[1] - 8, PALETTE.woodLight, 1);
        for (const [t, color, drop] of [[0.3, PALETTE.clothTan, 9], [0.57, PALETTE.clothBlueDark, 12], [0.8, PALETTE.rustDark, 7]]) {
          const peg = mixPoint(railA, railB, t);
          px(ctx, peg[0] - 3, peg[1] - 6, PALETTE.outline, 7, drop + 2);
          px(ctx, peg[0] - 2, peg[1] - 5, color, 5, drop - 1);
        }
      } else if (householdMode === 1) {
        // Rain catch and downpipe tie the dwelling to South Measure's water
        // economy while keeping the fixture visibly domestic in scale.
        const catchment = roofSurfacePoint(roof, 0.32, 0.46);
        drawIsoDiamond(ctx, catchment[0], catchment[1] - 3, 28, 12, PALETTE.outline);
        drawIsoDiamond(ctx, catchment[0] - 1, catchment[1] - 4, 22, 8, PALETTE.clothBlueDark);
        nativeLinePx(ctx, catchment[0] - 7.5, catchment[1] - 6.5, catchment[0] + 5.5, catchment[1] - 9.5, PALETTE.clothBlue);
        const pipeTop = roofSurfacePoint(roof, 0.77, 0.42);
        const pipeBottom = [pipeTop[0] + 2, pipeTop[1] + 24];
        linePx(ctx, pipeTop[0], pipeTop[1], pipeBottom[0], pipeBottom[1], PALETTE.outline, 5);
        linePx(ctx, pipeTop[0] - 1, pipeTop[1], pipeBottom[0] - 1, pipeBottom[1] - 1, PALETTE.rustLight, 1);
      } else if (householdMode === 2) {
        // A patched smoke hood and short fuel cradle break the flat warehouse
        // cap without growing beyond human household scale.
        const hood = roofSurfacePoint(roof, 0.3, 0.38);
        drawIsoPrism(ctx, hood[0], hood[1] - 2, 22, 11, 10, {
          top: PALETTE.stoneDust,
          left: PALETTE.rustMid,
          right: PALETTE.rustDark,
          outline: PALETTE.outline
        });
        const cradleA = roofSurfacePoint(roof, 0.51, 0.63);
        const cradleB = roofSurfacePoint(roof, 0.85, 0.55);
        for (let index = 0; index < 3; index += 1) {
          linePx(ctx, cradleA[0] + index * 3, cradleA[1] - index * 2, cradleB[0] + index * 2, cradleB[1] - index * 2, PALETTE.outline, 4);
          linePx(ctx, cradleA[0] + index * 3, cradleA[1] - index * 2 - 1, cradleB[0] + index * 2, cradleB[1] - index * 2 - 1, PALETTE.woodLight, 1);
        }
      } else {
        const hatch = [
          roofSurfacePoint(roof, 0.18, 0.21),
          roofSurfacePoint(roof, 0.57, 0.26),
          roofSurfacePoint(roof, 0.53, 0.59),
          roofSurfacePoint(roof, 0.15, 0.54)
        ];
        poly(ctx, PALETTE.outline, hatch);
        const hatchInset = [
          roofSurfacePoint(roof, 0.22, 0.26),
          roofSurfacePoint(roof, 0.52, 0.3),
          roofSurfacePoint(roof, 0.48, 0.53),
          roofSurfacePoint(roof, 0.2, 0.49)
        ];
        poly(ctx, PALETTE.stoneMid, hatchInset);
        linePx(ctx, hatchInset[0][0], hatchInset[0][1], hatchInset[2][0], hatchInset[2][1], PALETTE.rustLight, 2);
        const bucket = roofSurfacePoint(roof, 0.74, 0.58);
        px(ctx, bucket[0] - 5, bucket[1] - 8, PALETTE.outline, 11, 9);
        px(ctx, bucket[0] - 3, bucket[1] - 8, PALETTE.clothBlueDark, 7, 6);
        linePx(ctx, bucket[0] - 5, bucket[1] - 8, bucket[0] + 5, bucket[1] - 8, PALETTE.stoneDust, 1);
      }
    }

    // Large connected footprints receive a few complete household roof kits,
    // not dozens of tiny pseudo-vents. Edge kits establish separate residents
    // while rare interior kits break a warehouse-sized cap into lived roofs.
    const interiorCell = connected.xMinus && connected.xPlus && connected.yMinus && connected.yPlus;
    const ownsEdgeKit = !cornerCell && (
      (!connected.yMinus && ((formSeed >>> 3) & 7) === 2)
      || (!connected.xMinus && ((formSeed >>> 5) & 7) === 5)
    );
    const ownsInteriorKit = interiorCell && (formSeed % 23 === 7);
    if (ownsEdgeKit || ownsInteriorKit) {
      const kit = roofSurfacePoint(roof, 0.34 + ((formSeed >>> 9) & 3) * 0.07, 0.45);
      const kitColors = style.roofFamily === 'lime'
        ? { top: PALETTE.hostBone, left: PALETTE.stoneLight, right: PALETTE.stoneDark }
        : style.roofFamily === 'sheet'
          ? { top: PALETTE.rustLight, left: PALETTE.rustMid, right: PALETTE.rustDark }
          : { top: PALETTE.woodLight, left: PALETTE.woodMid, right: PALETTE.woodDark };
      drawIsoPrism(ctx, kit[0], kit[1] - 1, 28, 14, 12 + ((formSeed >>> 11) & 3), {
        ...kitColors,
        outline: PALETTE.outline
      });
      const rackA = roofSurfacePoint(roof, 0.12, 0.72);
      const rackB = roofSurfacePoint(roof, 0.78, 0.68);
      linePx(ctx, rackA[0], rackA[1] - 5, rackB[0], rackB[1] - 5, PALETTE.outline, 4);
      linePx(ctx, rackA[0] + 1, rackA[1] - 6, rackB[0] - 1, rackB[1] - 6, style.roofLight, 1);
      const cloth = mixPoint(rackA, rackB, 0.62);
      px(ctx, cloth[0] - 4, cloth[1] - 4, PALETTE.outline, 9, 10);
      px(ctx, cloth[0] - 3, cloth[1] - 3, (formSeed & 1) ? PALETTE.clothBlueDark : PALETTE.clothTan, 7, 7);
    }
    return;
  }

  if (style.detail === 'industrial') {
    // These members bridge actual transparent roof voids. A full set of ribs
    // over a painted cap read as a warehouse; two crooked trusses over missing
    // sheet metal read as an inherited shell that can no longer keep weather out.
    const trussShift = ((formSeed >>> 4) & 7) / 100;
    const trussMode = (formSeed >>> 7) & 3;
    const trussPositions = trussMode === 0
      ? []
      : trussMode === 1
        ? [0.5 + trussShift]
        : [0.34 + trussShift, 0.67 - trussShift];
    for (const u of trussPositions) {
      const a = roofSurfacePoint(roof, u, 0.16);
      const b = roofSurfacePoint(roof, u, 0.84);
      const middle = roofSurfacePoint(roof, u + (((formSeed >>> 8) & 1) ? 0.08 : -0.08), 0.5);
      linePx(ctx, a[0], a[1], b[0], b[1], PALETTE.outline, 4);
      linePx(ctx, a[0] - 1, a[1] - 1, b[0] - 1, b[1] - 1, PALETTE.rustLight, 1);
      linePx(ctx, a[0], a[1], middle[0], middle[1], PALETTE.rustDark, 2);
      linePx(ctx, middle[0], middle[1], b[0], b[1], PALETTE.rustDark, 2);
    }
    if (trussMode !== 0) {
      const torn = roofSurfacePoint(roof, 0.56, 0.33);
      linePx(ctx, torn[0], torn[1], torn[0] + ((formSeed & 1) ? 9 : -9), torn[1] + 12, PALETTE.outline, 3);
      linePx(ctx, torn[0], torn[1] - 1, torn[0] + ((formSeed & 1) ? 8 : -8), torn[1] + 10, PALETTE.stoneDust, 1);
    }
    if (cornerCell) {
      // The annex owns one exhaust comb. Three mismatched risers joined to a
      // common manifold give the maintenance precinct a cold mechanical crown
      // without repeating a chimney on every logical roof cell.
      const plinth = roofSurfacePoint(roof, 0.43, 0.52);
      drawIsoPrism(ctx, plinth[0], plinth[1], 47, 21, 9, {
        top: PALETTE.ironLight,
        left: PALETTE.ironMid,
        right: PALETTE.ironDark,
        outline: PALETTE.outline
      });
      const risers = [
        [plinth[0] - 14, plinth[1] - 12, 35],
        [plinth[0], plinth[1] - 16, 49],
        [plinth[0] + 15, plinth[1] - 10, 29]
      ];
      for (const [index, [x, footY, height]] of risers.entries()) {
        px(ctx, x - 4, footY - height, PALETTE.outline, 9, height + 2);
        px(ctx, x - 2, footY - height + 2, index === 1 ? PALETTE.ironMid : PALETTE.ironDark, 5, height - 2);
        nativeLinePx(ctx, x - 1.5, footY - height + 2.5, x - 1.5, footY - 2.5, PALETTE.ironLight);
        px(ctx, x - 6, footY - height - 4, PALETTE.outline, 13, 6);
        px(ctx, x - 4, footY - height - 5, index === 1 ? PALETTE.clayLight : PALETTE.limeLight, 9, 3);
      }
      linePx(ctx, risers[0][0], risers[0][1] - 12, risers[2][0], risers[2][1] - 12, PALETTE.outline, 7);
      linePx(ctx, risers[0][0] + 1, risers[0][1] - 14, risers[2][0] - 1, risers[2][1] - 14, PALETTE.clayMid, 3);
      for (const x of [plinth[0] - 8, plinth[0] + 7]) nativePx(ctx, x + 0.5, plinth[1] - 25.5, PALETTE.clayLight);
    }
    return;
  }

  if (style.detail === 'clinic') {
    const clinicalEdge = { face: PALETTE.clothBlueDark, top: PALETTE.hostBone, outline: PALETTE.outline };
    for (const edge of southMeasureRoofPerimeterEdges(roof, connected)) {
      drawRaisedRoofEdge(ctx, edge.from, edge.to, formSeed + edge.side.length * 23, clinicalEdge, edge.lit ? 5 : 4);
    }

    if (cornerCell) {
      const base = roofSurfacePoint(roof, 0.56, 0.58);

      // A broad, low air-handling lantern gives the clinic a medical skyline
      // while preserving the pale Compact roof field beneath it.
      drawIsoPrism(ctx, base[0], base[1] + 2, 72, 32, 16, {
        top: PALETTE.clothTan,
        left: PALETTE.stoneLight,
        right: PALETTE.stoneDust,
        outline: PALETTE.outline
      });
      drawIsoPrism(ctx, base[0] - 1, base[1] - 13, 62, 26, 15, {
        top: PALETTE.hostBone,
        left: PALETTE.clothBlue,
        right: PALETTE.clothBlueDark,
        outline: PALETTE.outline
      });

      // Paired louver banks identify controlled ventilation. The pale upper
      // edges retain the project's upper-left light direction.
      for (let index = 0; index < 4; index += 1) {
        const drop = index * 3;
        linePx(ctx, base[0] - 27, base[1] - 25 + drop, base[0] - 5, base[1] - 14 + drop, PALETTE.outline, 3);
        linePx(ctx, base[0] - 26, base[1] - 26 + drop, base[0] - 6, base[1] - 16 + drop, PALETTE.hostBone, 1);
        linePx(ctx, base[0] + 4, base[1] - 14 + drop, base[0] + 26, base[1] - 25 + drop, PALETTE.outline, 3);
        linePx(ctx, base[0] + 5, base[1] - 16 + drop, base[0] + 25, base[1] - 26 + drop, PALETTE.clothBlue, 1);
      }

      // A short punched index slab replaces the old flat cross. Its stacked
      // marks read as intake accounting rather than a religious roof symbol.
      const indexX = base[0] + 18;
      const indexTop = base[1] - 65;
      const indexBottom = base[1] - 28;
      px(ctx, indexX - 5, indexTop, PALETTE.outline, 11, indexBottom - indexTop + 2);
      px(ctx, indexX - 3, indexTop + 2, PALETTE.stoneLight, 7, indexBottom - indexTop - 2);
      px(ctx, indexX - 2, indexTop + 3, PALETTE.hostBone, 3, indexBottom - indexTop - 5);
      drawIsoDiamond(ctx, indexX, indexTop - 2, 17, 8, PALETTE.outline);
      drawIsoDiamond(ctx, indexX - 1, indexTop - 3, 11, 5, PALETTE.hostBone);
      for (const [drop, width, color] of [
        [8, 7, PALETTE.clothBlue],
        [17, 11, PALETTE.clothBlueDark],
        [26, 7, PALETTE.rustLight]
      ]) {
        px(ctx, indexX - 3, indexTop + drop, PALETTE.outline, width + 3, 5);
        px(ctx, indexX - 2, indexTop + drop + 1, color, width, 2);
        nativePx(ctx, indexX + width - 2.5, indexTop + drop + 1.5, PALETTE.hostBone);
      }
    }
    return;
  }

  if (style.detail === 'freight') {
    for (const v of [0.22, 0.48, 0.74]) {
      const a = roofSurfacePoint(roof, 0.06, v);
      const b = roofSurfacePoint(roof, 0.94, v);
      linePx(ctx, a[0], a[1], b[0], b[1], PALETTE.outline, 2);
      linePx(ctx, a[0], a[1] - 1, b[0], b[1] - 1, PALETTE.woodLight, 1);
    }
    if (!connected.xPlus && seed % 3 === 0) {
      const armA = roofSurfacePoint(roof, 0.76, 0.3);
      const armB = [armA[0] + 20, armA[1] - 9];
      linePx(ctx, armA[0], armA[1], armB[0], armB[1], PALETTE.outline, 5);
      linePx(ctx, armA[0], armA[1] - 1, armB[0] - 1, armB[1] - 1, PALETTE.rustLight, 2);
      linePx(ctx, armB[0], armB[1], armB[0], armB[1] + 18, PALETTE.outline, 2);
    }
    if (cornerCell) {
      // A single roof scale and lifting arm establish the freight precinct's
      // silhouette. It is deliberately lower and broader than the annex comb.
      const base = roofSurfacePoint(roof, 0.38, 0.53);
      drawIsoPrism(ctx, base[0], base[1], 44, 20, 9, {
        top: PALETTE.clayLight,
        left: PALETTE.clayMid,
        right: PALETTE.clayDark,
        outline: PALETTE.outline
      });
      linePx(ctx, base[0] - 13, base[1] - 9, base[0] - 9, base[1] - 49, PALETTE.outline, 7);
      linePx(ctx, base[0] - 11, base[1] - 11, base[0] - 7, base[1] - 47, PALETTE.ironLight, 2);
      linePx(ctx, base[0] - 9, base[1] - 48, base[0] + 27, base[1] - 35, PALETTE.outline, 7);
      linePx(ctx, base[0] - 7, base[1] - 50, base[0] + 25, base[1] - 38, PALETTE.clayLight, 2);
      linePx(ctx, base[0] + 25, base[1] - 37, base[0] + 25, base[1] - 17, PALETTE.outline, 3);
      drawIsoPrism(ctx, base[0] + 25, base[1] - 12, 17, 9, 12, {
        top: PALETTE.ironLight,
        left: PALETTE.ironMid,
        right: PALETTE.ironDark,
        outline: PALETTE.outline
      });
      const dial = [base[0] - 1, base[1] - 29];
      poly(ctx, PALETTE.outline, [
        [dial[0] - 7, dial[1] - 4], [dial[0] - 4, dial[1] - 7],
        [dial[0] + 4, dial[1] - 7], [dial[0] + 7, dial[1] - 4],
        [dial[0] + 7, dial[1] + 4], [dial[0] + 4, dial[1] + 7],
        [dial[0] - 4, dial[1] + 7], [dial[0] - 7, dial[1] + 4]
      ]);
      px(ctx, dial[0] - 4, dial[1] - 4, PALETTE.limeLight, 9, 9);
      linePx(ctx, dial[0], dial[1], dial[0] + 4, dial[1] - 3, PALETTE.clayDark, 2);
    }
    return;
  }

  if (style.detail === 'hall') {
    // A stepped footprint can expose more than one local back corner. The
    // stable coordinate seed elects one of those corners so the public mast
    // remains a building anchor rather than another repeated roof fixture.
    const ownsCivicAnchor = cornerCell && (
      (!connected.xPlus && !connected.yPlus)
      || (seed & 1) === 1
    );
    const civicColors = { face: PALETTE.clothBlueDark, top: PALETTE.stoneDust, outline: PALETTE.outline };
    for (const edge of southMeasureRoofPerimeterEdges(roof, connected)) {
      drawRaisedRoofEdge(ctx, edge.from, edge.to, formSeed + edge.side.length * 19, civicColors, edge.lit ? 9 : 7);
    }
    if (ownsCivicAnchor) {
      const base = roofSurfacePoint(roof, 0.55, 0.56);

      // The hall's counted-clinic inheritance is structural: a stepped,
      // ventilated clerestory with a cold header, not a painted roof symbol.
      drawIsoPrism(ctx, base[0], base[1] + 2, 62, 30, 19, {
        top: PALETTE.stoneDust,
        left: PALETTE.stoneLight,
        right: PALETTE.stoneDark,
        outline: PALETTE.outline
      });
      drawIsoPrism(ctx, base[0] - 1, base[1] - 17, 50, 24, 18, {
        top: PALETTE.hostBone,
        left: PALETTE.clothBlue,
        right: PALETTE.clothBlueDark,
        outline: PALETTE.outline
      });

      // Paired face louvers preserve upper-left lighting while making the
      // raised volume read as working ventilation at gameplay scale.
      for (let index = 0; index < 3; index += 1) {
        const drop = index * 4;
        linePx(ctx, base[0] - 21, base[1] - 29 + drop, base[0] - 5, base[1] - 21 + drop, PALETTE.outline, 3);
        linePx(ctx, base[0] - 20, base[1] - 30 + drop, base[0] - 5, base[1] - 23 + drop, PALETTE.stoneDust, 1);
        linePx(ctx, base[0] + 4, base[1] - 21 + drop, base[0] + 20, base[1] - 29 + drop, PALETTE.outline, 3);
        linePx(ctx, base[0] + 5, base[1] - 23 + drop, base[0] + 19, base[1] - 30 + drop, PALETTE.clothBlue, 1);
      }

      // A compact cold-header cap separates the public index mast from the
      // ventilator. The mast's plates all project to one side, avoiding a
      // cross or gallows silhouette.
      drawIsoPrism(ctx, base[0] - 1, base[1] - 36, 34, 16, 11, {
        top: PALETTE.hostBone,
        left: PALETTE.stoneDust,
        right: PALETTE.clothBlueDark,
        outline: PALETTE.outline
      });
      const mastTop = base[1] - 91;
      const mastBottom = base[1] - 47;
      px(ctx, base[0] - 3, mastTop, PALETTE.outline, 7, mastBottom - mastTop + 2);
      px(ctx, base[0] - 1, mastTop + 1, PALETTE.clothBlue, 2, mastBottom - mastTop - 1);
      drawIsoDiamond(ctx, base[0] - 1, mastTop - 2, 17, 8, PALETTE.outline);
      drawIsoDiamond(ctx, base[0] - 2, mastTop - 3, 11, 5, PALETTE.hostBone);
      for (const [drop, length, color] of [
        [9, 19, PALETTE.hostBone],
        [19, 15, PALETTE.clothTan],
        [29, 11, PALETTE.rustLight]
      ]) {
        const y = mastTop + drop;
        linePx(ctx, base[0] + 1, y, base[0] + length, y - 3, PALETTE.outline, 4);
        linePx(ctx, base[0] + 2, y - 1, base[0] + length - 1, y - 4, color, 1);
        px(ctx, base[0] + length - 2, y - 4, PALETTE.outline, 6, 7);
        px(ctx, base[0] + length - 1, y - 3, color, 4, 4);
      }
    }
    return;
  }

  if (style.detail === 'booth') {
    const boothEdge = { face: PALETTE.ironDark, top: PALETTE.limeLight, outline: PALETTE.outline };
    for (const edge of southMeasureRoofPerimeterEdges(roof, connected)) {
      drawRaisedRoofEdge(ctx, edge.from, edge.to, formSeed + edge.side.length * 13, boothEdge, edge.lit ? 6 : 4);
    }
    if (cornerCell) {
      // The admission booth carries a compact three-disc lane signal. It is a
      // horizontal counting device, not a cross, banner, or generic signpost.
      const base = roofSurfacePoint(roof, 0.52, 0.53);
      drawIsoPrism(ctx, base[0], base[1], 42, 19, 8, {
        top: PALETTE.limeLight,
        left: PALETTE.limeMid,
        right: PALETTE.limeDark,
        outline: PALETTE.outline
      });
      px(ctx, base[0] - 3, base[1] - 48, PALETTE.outline, 7, 42);
      px(ctx, base[0] - 1, base[1] - 47, PALETTE.ironMid, 3, 39);
      linePx(ctx, base[0], base[1] - 45, base[0] + 34, base[1] - 37, PALETTE.outline, 7);
      linePx(ctx, base[0] + 1, base[1] - 47, base[0] + 32, base[1] - 40, PALETTE.ironLight, 2);
      for (const [index, t] of [0.28, 0.58, 0.86].entries()) {
        const discX = Math.round(base[0] + 34 * t);
        const discY = Math.round(base[1] - 45 + 8 * t);
        drawIsoDiamond(ctx, discX, discY + 7, 13, 7, PALETTE.outline);
        drawIsoDiamond(ctx, discX - 1, discY + 6, 8, 4, index === 0 ? PALETTE.clothBlue : index === 1 ? PALETTE.clothTan : PALETTE.clothRed);
        linePx(ctx, discX, discY, discX, discY + 4, PALETTE.outline, 2);
      }
    }
    return;
  }

  if (style.detail === 'burial' && cornerCell) {
    // A patched roof lane, handling rail and single crooked vent make the
    // service shed asymmetric. No religious silhouette is used here.
    const patch = [
      roofSurfacePoint(roof, 0.08, 0.14),
      roofSurfacePoint(roof, 0.63, 0.2),
      roofSurfacePoint(roof, 0.59, 0.52),
      roofSurfacePoint(roof, 0.12, 0.58)
    ];
    poly(ctx, PALETTE.outline, patch);
    const inset = [
      roofSurfacePoint(roof, 0.13, 0.19),
      roofSurfacePoint(roof, 0.57, 0.24),
      roofSurfacePoint(roof, 0.53, 0.47),
      roofSurfacePoint(roof, 0.17, 0.52)
    ];
    poly(ctx, PALETTE.rustMid, inset);
    for (const t of [0.25, 0.52, 0.78]) {
      const a = mixPoint(inset[0], inset[1], t);
      const b = mixPoint(inset[3], inset[2], t);
      linePx(ctx, a[0], a[1], b[0], b[1], t === 0.52 ? PALETTE.rustLight : PALETTE.outline, 1);
    }
    if (cornerCell) {
      const vent = roofSurfacePoint(roof, 0.75, 0.56);
      px(ctx, vent[0] - 4, vent[1] - 19, PALETTE.outline, 9, 21);
      px(ctx, vent[0] - 2, vent[1] - 18, PALETTE.stoneDark, 5, 17);
      linePx(ctx, vent[0] - 7, vent[1] - 20, vent[0] + 6, vent[1] - 23, PALETTE.outline, 4);
      linePx(ctx, vent[0] - 5, vent[1] - 22, vent[0] + 4, vent[1] - 24, PALETTE.stoneDust, 1);
    }
  }
}

function drawBuildingFace(ctx, face, seed, style, side, formSeed, connected = {}) {
  face.line(0.04, 0.14, 0.95, 0.14, style.trim, 1);
  face.line(0.04, 0.9, 0.95, 0.9, PALETTE.outline, 2);

  if (style.detail === 'patchwork') {
    const rng = rngFrom(hash2D(formSeed + side * 97, seed * 3 + side));
    // Every dwelling gets one unmistakable entry face. The other exposed face
    // carries a household-specific repair or window grouping. This avoids the
    // old evenly stamped sequence of vents and doors across a connected run.
    const entrySide = 1 + ((formSeed >>> 3) & 1);
    const facade = side === entrySide ? 0 : 1 + ((formSeed >>> (side + 5)) % 3);
    const studPositions = facade === 0
      ? [0.12, 0.43, 0.86]
      : facade === 1
        ? [0.18, 0.64, 0.9]
        : facade === 2
          ? [0.11, 0.33, 0.79]
          : [0.2, 0.51, 0.88];
    for (const [index, nominal] of studPositions.entries()) {
      const u = Math.max(0.08, Math.min(0.92, nominal + (rng() - 0.5) * 0.07));
      const start = 0.16 + (index === 1 ? 0.08 : 0);
      face.line(u, start, u + ((index & 1) ? 0.02 : -0.015), 0.88, index === 1 ? PALETTE.rustDark : PALETTE.woodDark, index === 1 ? 2 : 1);
    }

    if (facade === 0) {
      const doorLeft = 0.18 + rng() * 0.08;
      face.rect(doorLeft, 0.3, doorLeft + 0.35, 0.9, PALETTE.outline);
      face.rect(doorLeft + 0.04, 0.34, doorLeft + 0.31, 0.87, PALETTE.woodDark);
      face.line(doorLeft + 0.07, 0.45, doorLeft + 0.28, 0.45, PALETTE.woodLight, 1);
      face.line(doorLeft + 0.07, 0.62, doorLeft + 0.28, 0.62, PALETTE.rustMid, 1);
      face.rect(doorLeft + 0.23, 0.67, doorLeft + 0.27, 0.72, PALETTE.hostBone);
      // Crooked rain hood and a worn stone step make this an inhabited entry,
      // rather than another sealed industrial panel.
      face.line(doorLeft - 0.04, 0.29, doorLeft + 0.4, 0.27, PALETTE.outline, 4);
      face.line(doorLeft - 0.02, 0.27, doorLeft + 0.38, 0.25, PALETTE.rustLight, 1);
      face.rect(doorLeft - 0.03, 0.87, doorLeft + 0.39, 0.94, PALETTE.outline);
      face.rect(doorLeft, 0.87, doorLeft + 0.36, 0.91, PALETTE.stoneDust);
      const narrowWindow = 0.69 + rng() * 0.06;
      face.rect(narrowWindow, 0.37, narrowWindow + 0.18, 0.61, PALETTE.outline);
      face.rect(narrowWindow + 0.035, 0.405, narrowWindow + 0.145, 0.57, PALETTE.clothBlueDark);
      face.line(narrowWindow + 0.09, 0.41, narrowWindow + 0.09, 0.57, PALETTE.clothTan, 1);
    } else if (facade === 1) {
      const windowLeft = 0.12 + rng() * 0.08;
      face.rect(windowLeft, 0.27, windowLeft + 0.43, 0.62, PALETTE.outline);
      face.rect(windowLeft + 0.04, 0.31, windowLeft + 0.39, 0.58, PALETTE.clothBlueDark);
      face.line(windowLeft + 0.21, 0.31, windowLeft + 0.21, 0.58, PALETTE.stoneDust, 1);
      face.line(windowLeft + 0.05, 0.48, windowLeft + 0.38, 0.48, PALETTE.woodLight, 1);
      // A shallow water shelf carries unlike household vessels.
      face.line(0.59, 0.73, 0.9, 0.69, PALETTE.outline, 4);
      face.line(0.6, 0.7, 0.88, 0.67, PALETTE.woodLight, 1);
      for (const [u, h, color] of [[0.65, 0.12, PALETTE.clothBlueDark], [0.78, 0.17, PALETTE.rustMid], [0.87, 0.1, PALETTE.stoneDust]]) {
        face.rect(u - 0.035, 0.69 - h, u + 0.035, 0.7, PALETTE.outline);
        face.rect(u - 0.018, 0.71 - h, u + 0.018, 0.68, color);
      }
    } else if (facade === 2) {
      const repairLeft = 0.08 + rng() * 0.08;
      face.rect(repairLeft, 0.22, repairLeft + 0.58, 0.76, PALETTE.outline);
      face.rect(repairLeft + 0.035, 0.26, repairLeft + 0.545, 0.72, (formSeed & 1) ? PALETTE.rustDark : PALETTE.stoneMid);
      for (const v of [0.34, 0.49, 0.64]) {
        const inset = v === 0.49 ? 0.09 : 0.05;
        face.line(repairLeft + inset, v, repairLeft + 0.51, v + 0.025, v === 0.49 ? PALETTE.rustLight : PALETTE.woodDark, v === 0.49 ? 2 : 1);
      }
      face.line(repairLeft + 0.06, 0.7, repairLeft + 0.5, 0.28, PALETTE.woodLight, 2);
      face.rect(0.75, 0.39, 0.9, 0.58, PALETTE.outline);
      face.rect(0.785, 0.425, 0.865, 0.545, PALETTE.void);
      face.line(0.72, 0.8, 0.91, 0.8, PALETTE.clothTan, 2);
    } else {
      const leftWidth = 0.24 + rng() * 0.07;
      face.rect(0.08, 0.3, 0.08 + leftWidth, 0.6, PALETTE.outline);
      face.rect(0.12, 0.34, 0.08 + leftWidth - 0.04, 0.56, PALETTE.clothBlueDark);
      face.rect(0.53, 0.24, 0.88, 0.67, PALETTE.outline);
      face.rect(0.57, 0.28, 0.84, 0.63, PALETTE.stoneDark);
      face.line(0.59, 0.3, 0.82, 0.61, PALETTE.woodMid, 2);
      face.line(0.82, 0.3, 0.59, 0.61, PALETTE.rustLight, 1);
      // Short washing line, deliberately off-level and confined to this home.
      face.line(0.15, 0.73, 0.77, 0.8, PALETTE.outline, 2);
      face.rect(0.31, 0.73, 0.43, 0.86, PALETTE.clothTan);
      face.rect(0.55, 0.76, 0.67, 0.89, PALETTE.clothBlueDark);
    }
    return;
  }

  if (style.detail === 'industrial') {
    const panelMode = (formSeed >>> (side + 1)) % 3;
    const breachSide = ((formSeed >>> side) & 1) ? 0.56 : 0.18;
    for (const v of [0.3, 0.52, 0.74]) face.line(0.05, v, 0.94, v, PALETTE.stoneDark, 1);
    for (const u of [0.12, 0.46, 0.86]) {
      face.rect(u - 0.05, 0.18, u + 0.05, 0.88, PALETTE.outline);
      face.rect(u - 0.025, 0.2, u + 0.025, 0.86, PALETTE.rustDark);
    }
    if (panelMode === 0) {
      face.rect(breachSide, 0.25, breachSide + 0.27, 0.86, PALETTE.outline);
      face.rect(breachSide + 0.035, 0.29, breachSide + 0.235, 0.84, PALETTE.void);
      face.line(breachSide + 0.02, 0.27, breachSide + 0.24, 0.83, PALETTE.rustLight, 2);
      face.line(breachSide + 0.23, 0.31, breachSide + 0.05, 0.62, PALETTE.rustDark, 2);
    } else if (panelMode === 1) {
      const bayLeft = breachSide > 0.5 ? 0.49 : 0.15;
      face.rect(bayLeft, 0.34, bayLeft + 0.35, 0.87, PALETTE.outline);
      face.rect(bayLeft + 0.035, 0.38, bayLeft + 0.315, 0.84, PALETTE.void);
      face.line(bayLeft + 0.04, 0.39, bayLeft + 0.31, 0.83, PALETTE.rustDark, 2);
      face.line(bayLeft + 0.3, 0.39, bayLeft + 0.05, 0.83, PALETTE.rustLight, 2);
      face.line(bayLeft + 0.02, 0.58, bayLeft + 0.33, 0.58, PALETTE.stoneDust, 1);
    } else {
      const plateLeft = breachSide > 0.5 ? 0.54 : 0.19;
      face.rect(plateLeft, 0.29, plateLeft + 0.3, 0.69, PALETTE.outline);
      face.rect(plateLeft + 0.035, 0.33, plateLeft + 0.265, 0.65, PALETTE.stoneDark);
      for (const v of [0.39, 0.49, 0.59]) face.line(plateLeft + 0.05, v, plateLeft + 0.25, v + 0.015, PALETTE.rustMid, 1);
      face.line(plateLeft + 0.07, 0.63, plateLeft + 0.24, 0.35, PALETTE.rustLight, 2);
    }
    return;
  }

  if (style.detail === 'clinic') {
    // The cold header is continuous across exposed bays. Unequal punch marks
    // give the pale frontage a counting identity at map scale.
    face.rect(0.04, 0.19, 0.96, 0.36, PALETTE.outline);
    face.rect(0.065, 0.22, 0.935, 0.325, PALETTE.clothBlueDark);
    face.line(0.07, 0.215, 0.93, 0.215, PALETTE.hostBone, 1);
    for (const u of [0.17, 0.31, 0.53, 0.79, 0.88]) {
      face.line(u, 0.235, u, u === 0.53 ? 0.315 : 0.29, u === 0.79 ? PALETTE.clothTan : PALETTE.hostBone, 1);
    }
    for (const u of [0.14, 0.5, 0.86]) face.line(u, 0.38, u, 0.89, PALETTE.clothDark, 1);
    face.rect(0.3, 0.43, 0.7, 0.7, PALETTE.outline);
    face.rect(0.34, 0.47, 0.66, 0.66, PALETTE.clothBlueDark);
    face.line(0.5, 0.47, 0.5, 0.66, PALETTE.hostBone, 1);
    return;
  }

  if (style.detail === 'freight') {
    for (const u of [0.12, 0.28, 0.44, 0.6, 0.76, 0.92]) face.line(u, 0.16, u, 0.88, PALETTE.woodDark, 1);
    face.line(0.08, 0.78, 0.9, 0.26, PALETTE.outline, 3);
    face.line(0.1, 0.76, 0.88, 0.27, PALETTE.woodLight, 1);
    face.rect(0.67, 0.62, 0.87, 0.82, PALETTE.outline);
    face.rect(0.71, 0.65, 0.83, 0.78, PALETTE.void);
    return;
  }

  if (style.detail === 'hall') {
    // A cold public header runs continuously around the exposed perimeter.
    // Punched count marks bind the large footprint to Compact clinic craft.
    face.rect(0.04, 0.2, 0.96, 0.35, PALETTE.outline);
    face.rect(0.065, 0.225, 0.935, 0.32, PALETTE.clothBlueDark);
    face.line(0.07, 0.22, 0.93, 0.22, PALETTE.stoneDust, 1);
    for (const u of [0.18, 0.36, 0.58, 0.79]) {
      face.line(u, 0.24, u, 0.305, u === 0.58 ? PALETTE.clothTan : PALETTE.hostBone, 1);
    }
    face.line(0.06, 0.72, 0.94, 0.72, PALETTE.stoneDark, 2);
    for (const u of [0.08, 0.5, 0.92]) {
      face.rect(u - 0.055, 0.15, u + 0.055, 0.91, PALETTE.outline);
      face.rect(u - 0.025, 0.18, u + 0.025, 0.88, u < 0.5 ? PALETTE.stoneLight : PALETTE.woodDark);
    }
    const openingShift = ((formSeed >>> side) & 1) ? 0.03 : -0.03;
    for (const u of [0.27 + openingShift, 0.73 + openingShift]) {
      face.rect(u - 0.1, 0.39, u + 0.1, 0.7, PALETTE.outline);
      face.rect(u - 0.065, 0.43, u + 0.065, 0.67, PALETTE.woodDark);
      face.line(u - 0.03, 0.45, u - 0.03, 0.65, PALETTE.clothBlue, 1);
      face.line(u + 0.035, 0.45, u + 0.035, 0.65, PALETTE.hostBone, 1);
    }
    face.line(0.16, 0.8, 0.84, 0.8, PALETTE.clothRed, 2);
    face.line(0.22, 0.84, 0.78, 0.84, PALETTE.rustLight, 1);
    return;
  }

  if (style.detail === 'burial') {
    const ownsDoor = side === 1 && !connected.xMinus;
    const ownsRack = side === 2 && !connected.yMinus;
    if (ownsDoor) {
      // The broad tool door is the shed's primary read at gameplay scale.
      // Its offset slide rail and exposed dark opening keep it from becoming
      // another sealed block face.
      face.line(0.07, 0.22, 0.92, 0.22, PALETTE.outline, 5);
      face.line(0.09, 0.19, 0.88, 0.19, PALETTE.rustLight, 2);
      face.rect(0.12, 0.28, 0.68, 0.91, PALETTE.outline);
      face.rect(0.16, 0.32, 0.64, 0.88, PALETTE.void);
      face.rect(0.38, 0.31, 0.75, 0.88, PALETTE.outline);
      face.rect(0.42, 0.35, 0.71, 0.85, PALETTE.woodDark);
      for (const v of [0.44, 0.57, 0.7]) face.line(0.44, v, 0.69, v + 0.015, PALETTE.woodLight, 1);
      face.line(0.43, 0.82, 0.69, 0.37, PALETTE.rustMid, 2);
      face.rect(0.62, 0.6, 0.67, 0.66, PALETTE.hostBone);
      // Door rollers and a worn handling sill.
      for (const u of [0.42, 0.68]) {
        face.rect(u - 0.035, 0.18, u + 0.035, 0.27, PALETTE.outline);
        face.rect(u - 0.015, 0.19, u + 0.015, 0.24, PALETTE.rustLight);
      }
      face.line(0.08, 0.91, 0.8, 0.91, PALETTE.stoneDust, 3);
    } else if (ownsRack) {
      // An open handling rack: long tools and hooks are intentionally unlike
      // the repeating crossed braces that made the old shed look fortified.
      face.line(0.1, 0.29, 0.9, 0.29, PALETTE.outline, 5);
      face.line(0.12, 0.26, 0.88, 0.26, PALETTE.rustLight, 2);
      for (const [u, length, color] of [[0.2, 0.48, PALETTE.woodLight], [0.4, 0.6, PALETTE.rustMid], [0.63, 0.5, PALETTE.woodMid]]) {
        face.line(u, 0.31, u - 0.035, length + 0.3, PALETTE.outline, 4);
        face.line(u - 0.01, 0.32, u - 0.045, length + 0.28, color, 1);
      }
      for (const u of [0.77, 0.88]) {
        face.line(u, 0.31, u, 0.51, PALETTE.outline, 3);
        face.line(u, 0.51, u - 0.07, 0.6, PALETTE.rustLight, 3);
        face.line(u - 0.07, 0.6, u - 0.12, 0.54, PALETTE.outline, 2);
      }
      face.rect(0.09, 0.81, 0.46, 0.91, PALETTE.outline);
      face.rect(0.13, 0.8, 0.42, 0.87, PALETTE.stoneDark);
    } else {
      // Remaining connected bays are unequal plank and sheet repairs. A long
      // rail continues the work frontage without repeating the tool door.
      const split = 0.34 + (((formSeed >>> side) & 7) / 30);
      face.rect(0.08, 0.24, split, 0.86, PALETTE.outline);
      face.rect(0.115, 0.28, split - 0.035, 0.82, (formSeed & 1) ? PALETTE.woodDark : PALETTE.stoneDark);
      face.rect(split + 0.045, 0.19, 0.91, 0.88, PALETTE.outline);
      face.rect(split + 0.08, 0.23, 0.875, 0.84, (formSeed & 2) ? PALETTE.rustDark : PALETTE.woodDark);
      face.line(0.06, 0.31, 0.94, 0.31, PALETTE.outline, 5);
      face.line(0.08, 0.28, 0.91, 0.28, PALETTE.rustLight, 1);
      if ((formSeed >>> 4) & 1) face.line(split + 0.1, 0.78, 0.84, 0.27, PALETTE.woodLight, 2);
    }
    return;
  }

  face.rect(0.22, 0.3, 0.78, 0.7, PALETTE.outline);
  face.rect(0.26, 0.34, 0.74, 0.66, PALETTE.void);
  for (const u of [0.38, 0.5, 0.62]) face.line(u, 0.35, u, 0.66, PALETTE.rustDark, 1);
}

function drawNativeBuildingFace(face, seed, style, shaded) {
  const light = shaded ? PALETTE.stoneDark : style.trim;
  const dark = shaded ? PALETTE.outline : style.wallShade;
  for (let i = 0; i < 4; i += 1) {
    const hash = hash2D(seed + i * 37, seed * 11 + i * 19);
    const u = 0.09 + ((hash & 255) / 255) * 0.82;
    const v = 0.17 + (((hash >>> 8) & 255) / 255) * 0.65;
    if (style.detail === 'industrial' || style.detail === 'booth') {
      face.nativeLine(u, v, Math.min(0.95, u + 0.09), v + (((hash >>> 16) & 1) ? 0.018 : -0.018), i & 1 ? PALETTE.rustDark : light);
    } else if (style.detail === 'clinic' || style.detail === 'hall') {
      face.nativeLine(u, v, Math.min(0.95, u + 0.075), v + 0.01, i & 1 ? dark : light);
    } else {
      face.nativeLine(u, v, u + (((hash >>> 16) & 1) ? 0.014 : -0.014), Math.min(0.95, v + 0.14), i & 1 ? dark : light);
    }
  }
}

function drawHouseholdEdgeAttachment(ctx, face, formSeed, shaded, force = false) {
  const sampledMode = formSeed % 9;
  if (!force && sampledMode > 3) return;
  const mode = force ? ((formSeed >>> 4) & 3) : sampledMode;
  const rng = rngFrom(hash2D(formSeed + 653, formSeed * 3 + 41));
  const left = 0.08 + rng() * 0.12;
  const right = 0.76 + rng() * 0.14;

  if (mode === 0) {
    const a = face.point(left, 0.55);
    const b = face.point(right, 0.55);
    const c = [b[0] + 2, b[1] + 8];
    const d = [a[0] - 2, a[1] + 10];
    poly(ctx, PALETTE.outline, [a, b, c, d]);
    poly(ctx, shaded ? PALETTE.rustDark : PALETTE.clothTan, [
      [a[0] + 1, a[1] + 1], [b[0] - 1, b[1] + 1],
      [c[0] - 2, c[1] - 2], [d[0] + 2, d[1] - 2]
    ]);
    for (const t of [0.25, 0.5, 0.75]) {
      const top = mixPoint(a, b, t);
      const lip = mixPoint(d, c, t);
      linePx(ctx, top[0], top[1] + 1, lip[0], lip[1] - 1, shaded ? PALETTE.outline : PALETTE.rustLight, 1);
    }
    px(ctx, d[0] - 2, d[1], PALETTE.outline, 4, 13);
    px(ctx, d[0], d[1], PALETTE.woodMid, 1, 11);
    px(ctx, c[0] - 2, c[1], PALETTE.outline, 4, 13);
    px(ctx, c[0] - 1, c[1], PALETTE.woodDark, 1, 11);
    return;
  }

  if (mode === 3) {
    // A crooked family storage rack projects beyond the wall. Its unlike pots,
    // folded cloth and hanging pan read as daily use at detached scale.
    const topA = face.point(left, 0.5);
    const topB = face.point(right, 0.5);
    const lowA = face.point(left, 0.86);
    const lowB = face.point(right, 0.86);
    for (const [a, b] of [[topA, topB], [lowA, lowB]]) {
      linePx(ctx, a[0], a[1], b[0], b[1], PALETTE.outline, 5);
      linePx(ctx, a[0] + 1, a[1] - 1, b[0] - 1, b[1] - 1, shaded ? PALETTE.woodDark : PALETTE.woodLight, 1);
    }
    linePx(ctx, topA[0], topA[1], lowA[0] - 3, lowA[1] + 8, PALETTE.outline, 4);
    linePx(ctx, topB[0], topB[1], lowB[0] + 3, lowB[1] + 7, PALETTE.outline, 4);
    const shelfColors = [PALETTE.clothBlueDark, PALETTE.rustMid, PALETTE.stoneDust];
    for (let index = 0; index < 3; index += 1) {
      const item = mixPoint(lowA, lowB, 0.22 + index * 0.29);
      const width = index === 1 ? 9 : 7;
      px(ctx, item[0] - Math.floor(width / 2), item[1] - 9 - index * 2, PALETTE.outline, width, 10 + index * 2);
      px(ctx, item[0] - Math.floor(width / 2) + 1, item[1] - 8 - index * 2, shelfColors[index], width - 2, 7 + index * 2);
    }
    return;
  }

  // A shallow household lean-to changes the exposed footprint and roofline,
  // but its open posts leave the authored building cell as the only collision.
  const wallA = face.point(left, 0.64);
  const wallB = face.point(right, 0.64);
  const outerA = [wallA[0] - 7 - mode * 2, wallA[1] + 15 + (formSeed & 3)];
  const outerB = [wallB[0] + 5, wallB[1] + 13 + ((formSeed >>> 2) & 3)];
  poly(ctx, PALETTE.outline, [wallA, wallB, outerB, outerA]);
  poly(ctx, shaded ? PALETTE.woodDark : (mode === 1 ? PALETTE.rustMid : PALETTE.stoneDust), [
    [wallA[0] + 1, wallA[1] + 1], [wallB[0] - 1, wallB[1] + 1],
    [outerB[0] - 2, outerB[1] - 2], [outerA[0] + 2, outerA[1] - 2]
  ]);
  const seamCount = mode === 1 ? 4 : 3;
  for (let index = 1; index < seamCount; index += 1) {
    const t = index / seamCount;
    const top = mixPoint(wallA, wallB, t);
    const lip = mixPoint(outerA, outerB, t);
    linePx(ctx, top[0], top[1] + 1, lip[0], lip[1] - 1, index & 1 ? PALETTE.rustLight : PALETTE.outline, 1);
  }
  const footA = face.point(left, 0.98);
  const footB = face.point(right, 0.98);
  linePx(ctx, outerA[0], outerA[1] - 1, footA[0] - 4, footA[1] + 3, PALETTE.outline, 4);
  linePx(ctx, outerA[0] + 1, outerA[1] - 1, footA[0] - 3, footA[1] + 1, shaded ? PALETTE.woodDark : PALETTE.woodLight, 1);
  linePx(ctx, outerB[0], outerB[1] - 1, footB[0] + 3, footB[1] + 2, PALETTE.outline, 4);
  linePx(ctx, outerB[0] - 1, outerB[1] - 1, footB[0] + 2, footB[1], PALETTE.woodDark, 1);
  const brace = mixPoint(outerA, outerB, 0.63);
  linePx(ctx, brace[0], brace[1], brace[0] - 8, brace[1] + 11, PALETTE.rustDark, 2);
}

function drawBurialShedHandcart(ctx, base, wallTop, formSeed, connected = {}) {
  // One cart belongs beside the primary door of a connected shed footprint.
  // It projects into the open yard, so it gets its own contact shadow.
  if (connected.yPlus || connected.xMinus) return;
  const anchor = mixPoint(base.left, base.bottom, 0.52);
  const shift = ((formSeed >>> 7) & 3) - 1;
  const cartCx = anchor[0] - 7 + shift;
  const cartCy = anchor[1] + 13;

  // A projecting handling beam carries two unequal lowering hooks above the
  // door. This is visible even when the connected shed is framed at map scale.
  const wallRail = mixPoint(wallTop.left, wallTop.bottom, 0.42);
  const railOuter = [wallRail[0] - 36, wallRail[1] + 11];
  linePx(ctx, wallRail[0] + 6, wallRail[1] - 2, railOuter[0], railOuter[1], PALETTE.outline, 8);
  linePx(ctx, wallRail[0] + 4, wallRail[1] - 4, railOuter[0] + 2, railOuter[1] - 2, PALETTE.rustLight, 2);
  for (const [t, drop] of [[0.36, 18], [0.76, 27]]) {
    const hookTop = mixPoint(wallRail, railOuter, t);
    linePx(ctx, hookTop[0], hookTop[1], hookTop[0] - 2, hookTop[1] + drop, PALETTE.outline, 3);
    linePx(ctx, hookTop[0] - 2, hookTop[1] + drop, hookTop[0] + 5, hookTop[1] + drop + 5, PALETTE.rustLight, 3);
    linePx(ctx, hookTop[0] + 5, hookTop[1] + drop + 5, hookTop[0] + 9, hookTop[1] + drop, PALETTE.outline, 2);
  }

  const tray = [
    [cartCx - 28, cartCy - 10],
    [cartCx + 5, cartCy - 2],
    [cartCx + 19, cartCy + 9],
    [cartCx - 15, cartCy + 2]
  ];
  poly(ctx, PALETTE.outline, tray);
  poly(ctx, PALETTE.woodMid, [
    [cartCx - 24, cartCy - 8],
    [cartCx + 3, cartCy - 1],
    [cartCx + 14, cartCy + 6],
    [cartCx - 12, cartCy + 1]
  ]);
  linePx(ctx, cartCx - 23, cartCy - 8, cartCx + 13, cartCy + 5, PALETTE.woodLight, 2);
  linePx(ctx, cartCx - 15, cartCy - 5, cartCx + 17, cartCy + 7, PALETTE.rustLight, 2);

  for (const wheel of [[cartCx - 20, cartCy + 3], [cartCx + 13, cartCy + 10]]) {
    drawIsoDiamond(ctx, wheel[0], wheel[1], 16, 9, PALETTE.outline);
    drawIsoDiamond(ctx, wheel[0], wheel[1] - 1, 9, 5, PALETTE.rustMid);
    nativePx(ctx, wheel[0] - 0.5, wheel[1] - 1.5, PALETTE.stoneDust);
  }

  // Paired handles and a hooked lowering strap state how the cart is used.
  for (const offset of [-4, 5]) {
    linePx(ctx, cartCx + 12 + offset, cartCy + 3, cartCx + 38 + offset, cartCy - 8, PALETTE.outline, 5);
    linePx(ctx, cartCx + 13 + offset, cartCy + 1, cartCx + 37 + offset, cartCy - 9, PALETTE.woodLight, 2);
  }
  linePx(ctx, cartCx - 3, cartCy - 5, cartCx - 5, cartCy - 20, PALETTE.outline, 3);
  linePx(ctx, cartCx - 5, cartCy - 20, cartCx + 2, cartCy - 24, PALETTE.rustLight, 2);
  linePx(ctx, cartCx + 2, cartCy - 24, cartCx + 5, cartCy - 19, PALETTE.outline, 2);
}

export function drawSouthMeasureBuildingBlock(ctx, cx, cy, seed, opts = {}) {
  const connected = opts.connected ?? {};
  const style = buildingStyle(opts.variant);
  const wallH = style.wallH;
  const { base, wallTop, roof } = southMeasureBuildingGeometry(cx, cy, wallH);
  const formSeed = buildingFormSeed(seed, connected);
  const rng = rngFrom(hash2D(formSeed + 503, seed * 7 + 41));
  const isolated = !connected.xMinus && !connected.xPlus && !connected.yMinus && !connected.yPlus;


  if (!connected.yPlus) {
    poly(ctx, style.wallLit, [wallTop.left, wallTop.bottom, base.bottom, base.left]);
    const face = faceTools(ctx, wallTop.left, wallTop.bottom, base.bottom, base.left);
    drawBuildingMaterialTexture(face, formSeed, style, false);
    drawBuildingFace(ctx, face, seed, style, 1, formSeed, connected);
    drawNativeBuildingFace(face, seed + 59, style, false);
    if (style.detail === 'patchwork') drawHouseholdEdgeAttachment(ctx, face, formSeed, false, isolated);
  }
  if (!connected.xPlus) {
    poly(ctx, style.wallShade, [wallTop.bottom, wallTop.right, base.right, base.bottom]);
    const face = faceTools(ctx, wallTop.bottom, wallTop.right, base.right, base.bottom);
    drawBuildingMaterialTexture(face, formSeed + 11, style, true);
    drawBuildingFace(ctx, face, seed + 11, style, 2, formSeed + 11, connected);
    drawNativeBuildingFace(face, seed + 71, style, true);
    if (style.detail === 'patchwork') drawHouseholdEdgeAttachment(ctx, face, formSeed + 11, true);
  }

  // The roof uses the same 64 by 32 diamond as the wall cap. Connected cells
  // therefore share exact endpoints instead of overlapping by four pixels.
  // A separate fascia supplies the shallow eave without shifting the surface
  // away from the wall footprint.
  if (!connected.yPlus) {
    poly(ctx, style.wallShade, [roof.left, roof.bottom, wallTop.bottom, wallTop.left]);
    linePx(ctx, wallTop.left[0], wallTop.left[1], wallTop.bottom[0], wallTop.bottom[1], PALETTE.outline, 1);
  }
  if (!connected.xPlus) {
    poly(ctx, style.roofShade, [roof.bottom, roof.right, wallTop.right, wallTop.bottom]);
    linePx(ctx, wallTop.bottom[0], wallTop.bottom[1], wallTop.right[0], wallTop.right[1], PALETTE.outline, 1);
  }

  if (style.detail === 'industrial') {
    drawIndustrialShellRoof(ctx, roof, formSeed, style);
  } else {
    const patchworkFills = {
      tar: [PALETTE.clothDark, PALETTE.clothDark, PALETTE.stoneDark, PALETTE.woodDark],
      timber: [PALETTE.woodDark, PALETTE.woodDark, PALETTE.woodMid, PALETTE.stoneDark],
      sheet: [PALETTE.rustDark, PALETTE.rustDark, PALETTE.woodDark, PALETTE.rustMid],
      lime: [PALETTE.stoneMid, PALETTE.stoneMid, PALETTE.stoneDark, PALETTE.stoneDust]
    };
    const roofFill = style.detail === 'patchwork'
      ? (patchworkFills[style.roofFamily] ?? patchworkFills.tar)[(formSeed >>> 10) & 3]
      : style.roof;
    poly(ctx, roofFill, [roof.top, roof.right, roof.bottom, roof.left]);
  }
  if (style.detail !== 'industrial') drawBuildingRoofTexture(ctx, roof, formSeed, style);
  if (style.detail === 'patchwork') {
    const courseCount = (formSeed >>> 2) & 1;
    for (let index = 0; index < courseCount; index += 1) {
      const t = 0.24 + index * 0.36 + ((formSeed >>> (index * 4 + 7)) & 7) / 80;
      const a = mixPoint(roof.left, roof.top, t);
      const b = mixPoint(roof.bottom, roof.right, Math.min(0.92, t + ((formSeed & 1) ? 0.04 : -0.035)));
      linePx(ctx, a[0], a[1], b[0], b[1], index === 0 ? style.roofLight : PALETTE.outline, 1);
    }
  } else if (style.detail === 'clinic') {
    // A few sealed service ledgers replace the old roof-wide course stamp.
    if (((formSeed >>> 4) % 13) === 4) {
      const panel = roofSurfacePoint(roof, 0.46, 0.48);
      drawIsoDiamond(ctx, panel[0], panel[1] + 1, 22, 9, PALETTE.outline);
      drawIsoDiamond(ctx, panel[0] - 1, panel[1] - 1, 17, 6, PALETTE.clothTan);
      nativeLinePx(ctx, panel[0] - 5.5, panel[1] - 2.5, panel[0] + 4.5, panel[1] - 4.5, PALETTE.hostBone);
      nativePx(ctx, panel[0] + 4.5, panel[1] - 0.5, PALETTE.clothBlueDark);
    }
  } else if (style.detail === 'hall') {
    // Sparse roof ledgers replace the old three-course stamp. The darker
    // roof remains a single civic field beneath the clerestory.
    if (((formSeed >>> 5) % 11) === 3) {
      const ledgerA = roofSurfacePoint(roof, 0.18, 0.28);
      const ledgerB = roofSurfacePoint(roof, 0.76, 0.34);
      linePx(ctx, ledgerA[0], ledgerA[1], ledgerB[0], ledgerB[1], PALETTE.outline, 2);
      nativeLinePx(ctx, ledgerA[0] + 1.5, ledgerA[1] - 1.5, ledgerB[0] - 1.5, ledgerB[1] - 1.5, PALETTE.stoneDust);
    }
  } else if (style.detail !== 'industrial') {
    for (const t of [0.25, 0.5, 0.75]) {
      const a = mixPoint(roof.left, roof.top, t);
      const b = mixPoint(roof.bottom, roof.right, t);
      linePx(ctx, a[0], a[1], b[0], b[1], t === 0.25 ? style.roofLight : PALETTE.outline, 1);
    }
  }
  for (const edge of southMeasureRoofPerimeterEdges(roof, connected)) {
    const color = edge.lit ? style.roofLight : PALETTE.outline;
    if (style.detail === 'industrial') drawBrokenRoofPerimeter(ctx, edge, formSeed + edge.side.length * 23, color);
    else linePx(ctx, edge.from[0], edge.from[1], edge.to[0], edge.to[1], color, 2);
  }

  drawBuildingRoofIdentity(ctx, roof, seed, style, connected, formSeed);
  if (style.detail === 'burial') drawBurialShedHandcart(ctx, base, wallTop, formSeed, connected);

  if ((seed & 3) === 1 && !['clinic', 'industrial', 'hall', 'patchwork', 'burial'].includes(style.detail)) {
    const u0 = 0.14 + rng() * 0.3;
    const v0 = 0.18 + rng() * 0.24;
    const u1 = u0 + 0.25;
    const v1 = v0 + 0.26;
    const patch = [
      roofSurfacePoint(roof, u0, v0),
      roofSurfacePoint(roof, u1, v0),
      roofSurfacePoint(roof, u1, v1),
      roofSurfacePoint(roof, u0, v1)
    ];
    poly(ctx, PALETTE.outline, patch);
    const inset = [
      roofSurfacePoint(roof, u0 + 0.035, v0 + 0.045),
      roofSurfacePoint(roof, u1 - 0.035, v0 + 0.045),
      roofSurfacePoint(roof, u1 - 0.035, v1 - 0.045),
      roofSurfacePoint(roof, u0 + 0.035, v1 - 0.045)
    ];
    poly(ctx, style.trim, inset);
    linePx(ctx, inset[0][0], inset[0][1], inset[2][0], inset[2][1], PALETTE.rustDark, 1);
  }
  const roofFleckCount = style.detail === 'industrial' ? 0 : style.detail === 'patchwork' ? 2 : style.detail === 'hall' ? 2 : 7;
  for (let i = 0; i < roofFleckCount; i += 1) {
    const fleck = roofSurfacePoint(roof, 0.08 + rng() * 0.84, 0.08 + rng() * 0.84);
    px(ctx, fleck[0], fleck[1], i % 2 ? style.roofLight : PALETTE.outline, 2, 1);
  }
  const roofThreadV = style.detail === 'industrial' ? 0.1 : 0.32;
  const roofThreadA = roofSurfacePoint(roof, 0.18 + (seed & 3) * 0.08, roofThreadV);
  const roofThreadB = roofSurfacePoint(roof, 0.36 + (seed & 3) * 0.07, roofThreadV);
  nativeLinePx(ctx, roofThreadA[0] + 0.5, roofThreadA[1] - 0.5, roofThreadB[0] + 0.5, roofThreadB[1] - 0.5, style.roofLight);
  const roofThreadV2 = style.detail === 'industrial' ? 0.91 : 0.58 + ((seed >>> 2) & 3) * 0.06;
  const roofThreadC = roofSurfacePoint(roof, 0.56, roofThreadV2);
  const roofThreadD = roofSurfacePoint(roof, 0.73, roofThreadV2);
  nativeLinePx(ctx, roofThreadC[0] - 0.5, roofThreadC[1] + 0.5, roofThreadD[0] - 0.5, roofThreadD[1] + 0.5, style.roofShade);
}

export function drawSouthMeasureCondenser(ctx, cx, cy, seed) {
  const rng = rngFrom(hash2D(seed + 521, seed * 11 + 17));
  drawIsoPrism(ctx, cx, cy + 5, 150, 57, 14, {
    top: PALETTE.limeLight,
    left: PALETTE.limeMid,
    right: PALETTE.limeDark,
    outline: PALETTE.outline
  });

  // The civic landmark is a rounded condensing drum with an offset fin bank,
  // drip manifold, ladder, and one service downpipe. The asymmetric working
  // anatomy replaces the old armoured-chest silhouette.
  const bodyTop = cy - 123;
  const bodyBottom = cy - 10;

  // Radiator fins rise behind the drum and break the crown into a comb.
  for (let index = 0; index < 8; index += 1) {
    const x = cx + 18 + index * 7;
    const top = bodyTop - 31 + Math.abs(3 - index) * 2;
    const bottom = bodyTop + 34 + (index & 1) * 3;
    px(ctx, x - 2, top, PALETTE.outline, 6, bottom - top);
    px(ctx, x, top + 2, index < 3 ? PALETTE.ironLight : PALETTE.ironDark, 2, bottom - top - 4);
    if (index < 2) nativeLinePx(ctx, x + 0.5, top + 3.5, x + 0.5, bottom - 4.5, PALETTE.limeLight);
  }
  linePx(ctx, cx + 14, bodyTop - 22, cx + 70, bodyTop - 22, PALETTE.outline, 7);
  linePx(ctx, cx + 16, bodyTop - 24, cx + 68, bodyTop - 24, PALETTE.ironLight, 2);
  linePx(ctx, cx + 17, bodyTop + 23, cx + 71, bodyTop + 23, PALETTE.outline, 8);
  linePx(ctx, cx + 19, bodyTop + 21, cx + 69, bodyTop + 21, PALETTE.ironMid, 3);

  // Row-built width changes make a true cylinder with a curved shoulder and
  // belly while preserving hard native pixels.
  const bodyHeight = bodyBottom - bodyTop;
  for (let row = 0; row <= bodyHeight; row += 1) {
    const normalized = Math.abs((row / bodyHeight) * 2 - 1);
    const halfWidth = 53 - Math.round(normalized * normalized * 21);
    const y = bodyTop + row;
    px(ctx, cx - halfWidth, y, PALETTE.outline, halfWidth * 2 + 1, 1);
    if (halfWidth > 4) {
      const inner = halfWidth - 3;
      px(ctx, cx - inner, y, PALETTE.ironMid, inner, 1);
      px(ctx, cx, y, PALETTE.ironDark, inner + 1, 1);
      const lightWidth = Math.max(4, Math.floor(inner * 0.28));
      px(ctx, cx - inner + 2, y, PALETTE.ironLight, lightWidth, 1);
    }
  }

  // A stepped oval cap closes the vessel without putting a square roof on it.
  for (let dy = -8; dy <= 8; dy += 1) {
    const curve = Math.sqrt(Math.max(0, 1 - (dy * dy) / 64));
    const half = Math.max(6, Math.floor(37 * curve));
    const y = bodyTop + dy;
    px(ctx, cx - half - 2, y, PALETTE.outline, half * 2 + 4, 1);
    px(ctx, cx - half, y, dy < 0 ? PALETTE.ironLight : PALETTE.ironMid, half, 1);
    px(ctx, cx, y, dy < 1 ? PALETTE.ironMid : PALETTE.ironDark, half, 1);
  }
  nativeLinePx(ctx, cx - 25.5, bodyTop - 4.5, cx - 7.5, bodyTop - 7.5, PALETTE.hostBone);

  // One narrow strengthening collar hugs the widest point of the drum.
  const collarY = bodyTop + 68;
  px(ctx, cx - 56, collarY, PALETTE.outline, 113, 5);
  px(ctx, cx - 53, collarY + 1, PALETTE.clayMid, 106, 2);
  px(ctx, cx - 49, collarY + 1, PALETTE.clayLight, 22, 1);

  // A second interrupted plate seam and its rivets explain how the drum was
  // assembled. The gap around the return pipe keeps it from becoming a stripe.
  const lowerSeamY = bodyTop + 101;
  linePx(ctx, cx - 42, lowerSeamY, cx + 12, lowerSeamY, PALETTE.ironDark, 2);
  linePx(ctx, cx - 40, lowerSeamY - 1, cx + 10, lowerSeamY - 1, PALETTE.ironLight, 1);
  for (const x of [cx - 35, cx - 21, cx - 7, cx + 7]) {
    nativePx(ctx, x + 0.5, lowerSeamY - 1.5, PALETTE.clayLight);
  }

  // A small service vent stands left of the fin bank.
  px(ctx, cx - 31, bodyTop - 28, PALETTE.outline, 12, 32);
  px(ctx, cx - 28, bodyTop - 27, PALETTE.ironMid, 6, 28);
  nativeLinePx(ctx, cx - 26.5, bodyTop - 25.5, cx - 26.5, bodyTop - 3.5, PALETTE.ironLight);
  px(ctx, cx - 37, bodyTop - 32, PALETTE.outline, 24, 7);
  px(ctx, cx - 34, bodyTop - 33, PALETTE.limeLight, 18, 4);

  // Condensate descends through a crooked exposed return instead of drawer-like
  // horizontal coils across the face.
  linePx(ctx, cx + 19, bodyTop + 24, cx + 19, bodyTop + 52, PALETTE.outline, 6);
  linePx(ctx, cx + 19, bodyTop + 52, cx + 31, bodyTop + 60, PALETTE.outline, 6);
  linePx(ctx, cx + 31, bodyTop + 60, cx + 31, bodyTop + 94, PALETTE.outline, 6);
  nativeLinePx(ctx, cx + 17.5, bodyTop + 25.5, cx + 17.5, bodyTop + 50.5, PALETTE.ironLight);
  nativeLinePx(ctx, cx + 19.5, bodyTop + 50.5, cx + 30.5, bodyTop + 57.5, PALETTE.clayMid);
  nativeLinePx(ctx, cx + 29.5, bodyTop + 61.5, cx + 29.5, bodyTop + 92.5, PALETTE.ironLight);
  for (const y of [bodyTop + 33, bodyTop + 82]) {
    px(ctx, cx + 13, y, PALETTE.outline, 13, 5);
    px(ctx, cx + 15, y - 1, PALETTE.ironLight, 9, 2);
  }

  // Round inspection gauge and needle, never a central chest latch.
  const gaugeX = cx - 15;
  const gaugeY = bodyTop + 88;
  poly(ctx, PALETTE.outline, [
    [gaugeX - 10, gaugeY - 6], [gaugeX - 6, gaugeY - 10], [gaugeX + 6, gaugeY - 10],
    [gaugeX + 10, gaugeY - 6], [gaugeX + 10, gaugeY + 6], [gaugeX + 6, gaugeY + 10],
    [gaugeX - 6, gaugeY + 10], [gaugeX - 10, gaugeY + 6]
  ]);
  poly(ctx, PALETTE.hostBone, [
    [gaugeX - 6, gaugeY - 4], [gaugeX - 4, gaugeY - 7], [gaugeX + 4, gaugeY - 7],
    [gaugeX + 7, gaugeY - 4], [gaugeX + 7, gaugeY + 4], [gaugeX + 4, gaugeY + 7],
    [gaugeX - 4, gaugeY + 7], [gaugeX - 7, gaugeY + 4]
  ]);
  linePx(ctx, gaugeX, gaugeY, gaugeX + 4, gaugeY - 5, PALETTE.hostRed, 2);
  px(ctx, gaugeX - 1, gaugeY - 1, PALETTE.outline, 3, 3);

  // Offset downpipe empties into an open collection bowl at the foundation.
  const pipeX = cx + 73;
  linePx(ctx, cx + 50, bodyTop + 31, pipeX, bodyTop + 42, PALETTE.outline, 10);
  linePx(ctx, cx + 50, bodyTop + 28, pipeX - 2, bodyTop + 39, PALETTE.rustLight, 3);
  px(ctx, pipeX - 6, bodyTop + 38, PALETTE.outline, 13, 109);
  px(ctx, pipeX - 3, bodyTop + 41, PALETTE.ironDark, 7, 103);
  nativeLinePx(ctx, pipeX - 1.5, bodyTop + 42.5, pipeX - 1.5, bodyTop + 136.5, PALETTE.ironLight);
  px(ctx, pipeX - 11, bodyTop + 79, PALETTE.outline, 23, 7);
  px(ctx, pipeX - 8, bodyTop + 78, PALETTE.clayLight, 17, 3);
  drawIsoDiamond(ctx, cx + 50, cy - 1, 48, 17, PALETTE.outline);
  drawIsoDiamond(ctx, cx + 49, cy - 2, 39, 12, PALETTE.clothBlueDark);
  linePx(ctx, pipeX, cy - 2, cx + 59, cy - 5, PALETTE.outline, 7);
  nativeLinePx(ctx, pipeX - 1.5, cy - 4.5, cx + 59.5, cy - 7.5, PALETTE.clothBlue);

  // Narrow ladder on the opposite side further breaks the symmetry.
  linePx(ctx, cx - 62, cy - 4, cx - 55, bodyTop + 17, PALETTE.outline, 5);
  linePx(ctx, cx - 50, cy - 7, cx - 43, bodyTop + 20, PALETTE.outline, 5);
  nativeLinePx(ctx, cx - 63.5, cy - 6.5, cx - 56.5, bodyTop + 19.5, PALETTE.rustLight);
  for (let rung = 0; rung < 7; rung += 1) {
    const t = (rung + 1) / 8;
    const ax = Math.round(cx - 62 + 7 * t);
    const ay = Math.round(cy - 4 + (bodyTop + 21 - cy) * t);
    const bx = Math.round(cx - 50 + 7 * t);
    const by = Math.round(cy - 7 + (bodyTop + 24 - cy) * t);
    linePx(ctx, ax, ay, bx, by, PALETTE.outline, 3);
    nativeLinePx(ctx, ax + 0.5, ay - 0.5, bx + 0.5, by - 0.5, PALETTE.rustMid);
  }

  for (let i = 0; i < 14; i += 1) {
    const x = cx - 43 + Math.floor(rng() * 86);
    const y = bodyTop + 14 + Math.floor(rng() * 94);
    px(ctx, x, y, i % 4 === 0 ? PALETTE.clayLight : PALETTE.ironDark, 2, 1);
  }
  drawRubbleCluster(ctx, cx - 76, cy + 12, seed + 527, 4);
}

export function drawSouthMeasureSettlingVat(ctx, cx, cy, seed) {
  const rng = rngFrom(hash2D(seed + 541, seed * 5 + 23));

  // A deep open cylinder replaces the former square table. Stepped raster
  // ovals form the lip and water surface; the visible wall reaches the ground.
  const rimY = cy - 34;
  const bottomY = cy + 6;
  for (let row = 0; row <= bottomY - rimY; row += 1) {
    const bottomCurve = row > 33 ? (row - 33) * 2 : 0;
    const half = 52 - Math.min(10, bottomCurve);
    const y = rimY + row;
    px(ctx, cx - half - 2, y, PALETTE.outline, half * 2 + 4, 1);
    px(ctx, cx - half, y, PALETTE.ironMid, half, 1);
    px(ctx, cx, y, PALETTE.ironDark, half, 1);
    if (row % 7 === 2) px(ctx, cx - half + 4, y, PALETTE.ironLight, 13, 1);
  }

  // Broad rusted oval rim.
  for (let dy = -13; dy <= 13; dy += 1) {
    const curve = Math.sqrt(Math.max(0, 1 - (dy * dy) / 169));
    const half = Math.max(7, Math.floor(55 * curve));
    const y = rimY + dy;
    px(ctx, cx - half - 2, y, PALETTE.outline, half * 2 + 4, 1);
    px(ctx, cx - half, y, dy < 0 ? PALETTE.clayLight : PALETTE.clayMid, half, 1);
    px(ctx, cx, y, dy < 1 ? PALETTE.clayMid : PALETTE.clayDark, half, 1);
  }
  // Inner water oval leaves an unbroken heavy rim around its edge.
  for (let dy = -8; dy <= 8; dy += 1) {
    const curve = Math.sqrt(Math.max(0, 1 - (dy * dy) / 64));
    const half = Math.max(5, Math.floor(43 * curve));
    const y = rimY - 1 + dy;
    px(ctx, cx - half, y, PALETTE.outline, half * 2 + 1, 1);
    px(ctx, cx - half + 2, y, dy < 0 ? PALETTE.clothBlue : PALETTE.clothBlueDark, half * 2 - 3, 1);
  }

  // A single low rake arm spans the open water and turns on a round hub.
  linePx(ctx, cx - 31, rimY + 2, cx + 30, rimY - 9, PALETTE.outline, 5);
  nativeLinePx(ctx, cx - 28.5, rimY, cx + 27.5, rimY - 10, PALETTE.clayLight);
  for (const t of [0.18, 0.42, 0.68, 0.86]) {
    const x = Math.round(cx - 31 + t * 61);
    const y = Math.round(rimY + 2 - t * 11);
    linePx(ctx, x, y, x + 1, y + 5, PALETTE.outline, 2);
  }
  poly(ctx, PALETTE.outline, [
    [cx - 8, rimY - 6], [cx - 4, rimY - 10], [cx + 5, rimY - 10],
    [cx + 8, rimY - 6], [cx + 8, rimY], [cx + 4, rimY + 3],
    [cx - 5, rimY + 3], [cx - 8, rimY]
  ]);
  poly(ctx, PALETTE.stoneDust, [
    [cx - 4, rimY - 5], [cx - 2, rimY - 7], [cx + 3, rimY - 7],
    [cx + 5, rimY - 4], [cx + 4, rimY], [cx - 3, rimY], [cx - 5, rimY - 3]
  ]);

  // One short inlet bends over the rear-left lip, avoiding the old headboard.
  px(ctx, cx - 46, rimY - 25, PALETTE.outline, 8, 25);
  px(ctx, cx - 43, rimY - 23, PALETTE.ironMid, 3, 22);
  nativeLinePx(ctx, cx - 41.5, rimY - 21.5, cx - 41.5, rimY - 2.5, PALETTE.ironLight);
  linePx(ctx, cx - 42, rimY - 22, cx - 28, rimY - 16, PALETTE.outline, 8);
  linePx(ctx, cx - 41, rimY - 24, cx - 28, rimY - 18, PALETTE.ironLight, 2);
  linePx(ctx, cx - 28, rimY - 17, cx - 28, rimY - 8, PALETTE.outline, 6);
  nativeLinePx(ctx, cx - 29.5, rimY - 15.5, cx - 29.5, rimY - 8.5, PALETTE.clothBlue);

  // Overflow exits low on the shaded wall.
  px(ctx, cx + 45, rimY + 16, PALETTE.outline, 9, 20);
  px(ctx, cx + 48, rimY + 18, PALETTE.ironDark, 4, 16);
  linePx(ctx, cx + 50, rimY + 32, cx + 61, rimY + 38, PALETTE.outline, 7);
  nativeLinePx(ctx, cx + 50.5, rimY + 29.5, cx + 59.5, rimY + 34.5, PALETTE.stoneDust);

  // A short ladder clings to the front wall rather than standing as furniture.
  linePx(ctx, cx - 23, rimY + 13, cx - 20, bottomY + 10, PALETTE.outline, 4);
  linePx(ctx, cx - 10, rimY + 16, cx - 7, bottomY + 13, PALETTE.outline, 4);
  for (let rung = 0; rung < 3; rung += 1) {
    const y = rimY + 22 + rung * 10;
    linePx(ctx, cx - 22 + rung, y, cx - 9 + rung, y + 3, PALETTE.outline, 3);
    nativeLinePx(ctx, cx - 20.5 + rung, y - 0.5, cx - 9.5 + rung, y + 1.5, PALETTE.rustLight);
  }
  for (let i = 0; i < 8; i += 1) {
    px(ctx, cx - 42 + Math.floor(rng() * 84), rimY + 21 + Math.floor(rng() * 15), i % 3 ? PALETTE.clayDark : PALETTE.clayLight, 2, 1);
  }
  nativeLinePx(ctx, cx - 31.5, rimY - 5.5, cx - 11.5, rimY - 9.5, PALETTE.clothBlue);
}

export function drawSouthMeasureSettlingTank(ctx, cx, cy, seed) {
  const rng = rngFrom(hash2D(seed + 541, seed * 5 + 23));
  drawIsoPrism(ctx, cx, cy + 3, 66, 27, 8, {
    top: PALETTE.limeLight,
    left: PALETTE.limeMid,
    right: PALETTE.limeDark,
    outline: PALETTE.outline
  });

  const rimY = cy - 34;
  const bottomY = cy + 1;
  for (let row = 0; row <= bottomY - rimY; row += 1) {
    const taper = Math.max(0, row - 28);
    const half = 30 - Math.min(5, taper);
    const y = rimY + row;
    px(ctx, cx - half - 2, y, PALETTE.outline, half * 2 + 4, 1);
    px(ctx, cx - half, y, PALETTE.ironMid, half, 1);
    px(ctx, cx, y, PALETTE.ironDark, half, 1);
    if (row < 28) px(ctx, cx - half + 2, y, PALETTE.ironLight, 6, 1);
  }
  for (const bandY of [rimY + 12, rimY + 27]) {
    px(ctx, cx - 32, bandY, PALETTE.outline, 65, 4);
    px(ctx, cx - 29, bandY, PALETTE.clayMid, 58, 2);
    px(ctx, cx - 27, bandY, PALETTE.clayLight, 14, 1);
  }
  for (let dy = -8; dy <= 8; dy += 1) {
    const curve = Math.sqrt(Math.max(0, 1 - (dy * dy) / 64));
    const half = Math.max(5, Math.floor(32 * curve));
    const y = rimY + dy;
    px(ctx, cx - half - 2, y, PALETTE.outline, half * 2 + 4, 1);
    px(ctx, cx - half, y, dy < 0 ? PALETTE.clayLight : PALETTE.clayMid, half * 2, 1);
  }
  for (let dy = -5; dy <= 5; dy += 1) {
    const curve = Math.sqrt(Math.max(0, 1 - (dy * dy) / 25));
    const half = Math.max(4, Math.floor(25 * curve));
    const y = rimY + dy;
    px(ctx, cx - half, y, PALETTE.clothBlueDark, half * 2, 1);
    if (dy < -1) px(ctx, cx - half + 3, y, PALETTE.clothBlue, Math.max(3, half - 6), 1);
  }

  // A low overflow elbow and punched level gauge make this a working vessel,
  // not a generic open crate.
  linePx(ctx, cx + 28, rimY + 14, cx + 42, rimY + 20, PALETTE.outline, 8);
  linePx(ctx, cx + 29, rimY + 12, cx + 41, rimY + 17, PALETTE.ironLight, 2);
  px(ctx, cx + 38, rimY + 17, PALETTE.outline, 9, 25);
  px(ctx, cx + 41, rimY + 18, PALETTE.ironDark, 4, 22);
  px(ctx, cx - 9, rimY + 14, PALETTE.outline, 11, 18);
  px(ctx, cx - 7, rimY + 15, PALETTE.limeLight, 7, 15);
  for (const lift of [3, 7, 11]) px(ctx, cx - 6, rimY + 15 + lift, PALETTE.ironDark, 4 + (lift === 7 ? 2 : 0), 1);

  for (let i = 0; i < 5; i += 1) {
    px(ctx, cx - 22 + Math.floor(rng() * 44), rimY + 17 + Math.floor(rng() * 14), i & 1 ? PALETTE.clayDark : PALETTE.ironLight, 2, 1);
  }
  nativeLinePx(ctx, cx - 17.5, rimY - 3.5, cx - 4.5, rimY - 6.5, PALETTE.clothBlue);
}

export function drawSouthMeasureTapStand(ctx, cx, cy, seed, opts = {}) {
  const frame = isoFrame(cx, cy, opts.orient ?? 'se');
  const sideA = frame.point(0, 0.35, 0);
  const sideB = frame.point(0, -0.35, 0);
  const nearLb = sideA[1] > sideB[1] ? 0.35 : -0.35;
  const farLb = -nearLb;

  // A stone wash trough anchors the pipework to the ground and makes the use
  // of the stand legible before any faucet detail is read.
  const basin = orientedBox(ctx, frame, 0.95, 0.56, 12, {
    top: PALETTE.stoneDust,
    lit: PALETTE.stoneMid,
    shade: PALETTE.stoneDark,
    outline: PALETTE.outline
  });
  poly(ctx, PALETTE.outline, [
    frame.point(-0.37, -0.18, 13), frame.point(0.37, -0.18, 13),
    frame.point(0.37, 0.18, 13), frame.point(-0.37, 0.18, 13)
  ]);
  poly(ctx, PALETTE.clothBlueDark, [
    frame.point(-0.3, -0.12, 14), frame.point(0.3, -0.12, 14),
    frame.point(0.3, 0.12, 14), frame.point(-0.3, 0.12, 14)
  ]);
  const waterGlintA = frame.point(-0.23, -0.08, 14.5);
  const waterGlintB = frame.point(0.12, -0.08, 14.5);
  nativeLinePx(ctx, waterGlintA[0], waterGlintA[1], waterGlintB[0], waterGlintB[1], PALETTE.clothBlue);

  const mastFoot = frame.point(-0.4, farLb * 0.72, 10);
  const mastElbow = frame.point(-0.4, farLb * 0.72, 38);
  const mastTop = frame.point(-0.29, farLb * 0.72, 47);
  linePx(ctx, mastFoot[0], mastFoot[1], mastElbow[0], mastElbow[1], PALETTE.outline, 6);
  linePx(ctx, mastFoot[0] - 1, mastFoot[1] - 1, mastElbow[0] - 1, mastElbow[1] + 1, PALETTE.ironMid, 3);
  nativeLinePx(ctx, mastFoot[0] - 1.5, mastFoot[1] - 2.5, mastElbow[0] - 1.5, mastElbow[1] + 0.5, PALETTE.ironLight);
  linePx(ctx, mastElbow[0], mastElbow[1], mastTop[0], mastTop[1], PALETTE.outline, 5);
  linePx(ctx, mastElbow[0] - 1, mastElbow[1] - 1, mastTop[0] - 1, mastTop[1] - 1, PALETTE.ironMid, 2);

  const manifoldA = frame.point(-0.28, farLb * 0.72, 42);
  const manifoldB = frame.point(0.47, farLb * 0.72, 42);
  linePx(ctx, manifoldA[0], manifoldA[1], manifoldB[0], manifoldB[1], PALETTE.outline, 6);
  linePx(ctx, manifoldA[0] + 1, manifoldA[1] - 1, manifoldB[0] - 1, manifoldB[1] - 1, PALETTE.ironMid, 3);
  nativeLinePx(ctx, manifoldA[0] + 2.5, manifoldA[1] - 2.5, manifoldB[0] - 2.5, manifoldB[1] - 2.5, PALETTE.ironLight);

  for (const [index, t] of [0.12, 0.5, 0.86].entries()) {
    const x = Math.round(manifoldA[0] + (manifoldB[0] - manifoldA[0]) * t);
    const y = Math.round(manifoldA[1] + (manifoldB[1] - manifoldA[1]) * t);
    const drop = 12 + (index === 1 ? 3 : 0);
    linePx(ctx, x, y + 2, x, y + drop, PALETTE.outline, 4);
    linePx(ctx, x - 1, y + 2, x - 1, y + drop - 1, PALETTE.rustLight, 1);
    linePx(ctx, x, y + drop, x + (nearLb > 0 ? -7 : 7), y + drop + 3, PALETTE.outline, 3);
    linePx(ctx, x, y + drop - 1, x + (nearLb > 0 ? -6 : 6), y + drop + 1, PALETTE.stoneDust, 1);
    linePx(ctx, x - 5, y + 5, x + 5, y + 5, PALETTE.outline, 3);
    nativePx(ctx, x - 0.5, y + 4.5, index === (seed % 3) ? PALETTE.hostGold : PALETTE.rustLight);
  }

  const gauge = frame.point(-0.39, nearLb * 0.04, 35);
  px(ctx, gauge[0] - 5, gauge[1] - 7, PALETTE.outline, 11, 14);
  px(ctx, gauge[0] - 3, gauge[1] - 5, PALETTE.stoneDust, 7, 10);
  px(ctx, gauge[0] - 2, gauge[1] - 3, PALETTE.stoneDark, 5, 6);
  linePx(ctx, gauge[0], gauge[1] + 1, gauge[0] + 2, gauge[1] - 3, PALETTE.rustLight, 1);
  nativePx(ctx, gauge[0] - 1.5, gauge[1] - 3.5, PALETTE.hostBone);

  const bucket = frame.point(0.28, nearLb * 0.58, 0);
  poly(ctx, PALETTE.outline, [
    [bucket[0] - 8, bucket[1] - 15], [bucket[0] + 8, bucket[1] - 15],
    [bucket[0] + 6, bucket[1]], [bucket[0] - 6, bucket[1]]
  ]);
  poly(ctx, PALETTE.rustDark, [
    [bucket[0] - 6, bucket[1] - 13], [bucket[0] + 6, bucket[1] - 13],
    [bucket[0] + 4, bucket[1] - 2], [bucket[0] - 4, bucket[1] - 2]
  ]);
  drawIsoDiamond(ctx, bucket[0], bucket[1] - 15, 18, 6, PALETTE.outline);
  drawIsoDiamond(ctx, bucket[0] - 1, bucket[1] - 16, 13, 3, PALETTE.clothBlueDark);
  nativeLinePx(ctx, basin.cap.left[0] + 1.5, basin.cap.left[1] - 0.5, basin.cap.top[0] - 1.5, basin.cap.top[1] + 0.5, PALETTE.stoneLight);
}

function drawScreeningThresholdChannel(ctx, frame) {
  orientedBox(ctx, frame, 0.86, 0.56, 5, {
    top: PALETTE.stoneMid,
    lit: PALETTE.stoneDust,
    shade: PALETTE.stoneDark,
    outline: PALETTE.outline
  }, 1);
  poly(ctx, PALETTE.clothBlueDark, [
    frame.point(-0.3, -0.36, 7),
    frame.point(0.3, -0.36, 7),
    frame.point(0.3, 0.36, 7),
    frame.point(-0.3, 0.36, 7)
  ]);
  poly(ctx, PALETTE.clothBlue, [
    frame.point(-0.21, -0.29, 7.5),
    frame.point(0.21, -0.29, 7.5),
    frame.point(0.21, 0.29, 7.5),
    frame.point(-0.21, 0.29, 7.5)
  ]);
  for (const lb of [-0.25, -0.08, 0.09, 0.26]) {
    const countA = frame.point(-0.29, lb, 8);
    const countB = frame.point(0.29, lb, 8);
    linePx(ctx, countA[0], countA[1], countB[0], countB[1], PALETTE.hostBone, 2);
    nativeLinePx(ctx, countA[0] + 0.5, countA[1] - 0.5, countB[0] - 0.5, countB[1] - 0.5, PALETTE.stoneDust);
  }
  const counter = frame.point(-0.45, -0.3, 9);
  px(ctx, counter[0] - 5, counter[1] - 6, PALETTE.outline, 11, 9);
  px(ctx, counter[0] - 3, counter[1] - 5, PALETTE.clothBlueDark, 7, 5);
  for (const offset of [-2, 1, 4]) {
    nativePx(ctx, counter[0] + offset, counter[1] - 3, PALETTE.hostBone);
  }
}

function drawScreeningRecordsRack(ctx, frame) {
  const mount = frame.point(-0.42, 0, 42);
  const board = frame.point(-0.67, -0.02, 38);
  linePx(ctx, mount[0], mount[1], board[0], board[1] - 7, PALETTE.outline, 5);
  linePx(ctx, mount[0], mount[1] - 1, board[0], board[1] - 8, PALETTE.rustLight, 2);
  px(ctx, board[0] - 17, board[1] - 15, PALETTE.outline, 35, 29);
  px(ctx, board[0] - 15, board[1] - 13, PALETTE.clothTan, 31, 25);
  px(ctx, board[0] - 15, board[1] - 13, PALETTE.clothBlueDark, 31, 5);
  px(ctx, board[0] - 13, board[1] - 11, PALETTE.clothBlue, 13, 2);
  for (const y of [-5, 1, 7]) {
    px(ctx, board[0] - 12, board[1] + y, PALETTE.stoneDark, 24, 2);
    nativeLinePx(ctx, board[0] - 10.5, board[1] + y - 0.5, board[0] + 8.5, board[1] + y - 0.5, PALETTE.stoneDust);
  }
  for (const y of [-7, -1, 5, 11]) {
    px(ctx, board[0] + 14, board[1] + y, PALETTE.outline, 8, 4);
    px(ctx, board[0] + 15, board[1] + y, y === -7 ? PALETTE.clothBlue : PALETTE.rustMid, 5, 2);
  }
  for (const x of [-10, -4, 2]) {
    nativePx(ctx, board[0] + x, board[1] + 10, PALETTE.rustDark, 1, 2);
  }
}

function drawScreeningInspectionRig(ctx, frame) {
  const base = frame.point(0.64, 0.04, 0);
  const armEnd = frame.point(0.02, 0, 45);
  px(ctx, base[0] - 5, base[1] - 58, PALETTE.outline, 11, 62);
  px(ctx, base[0] - 3, base[1] - 56, PALETTE.stoneMid, 7, 57);
  px(ctx, base[0] - 2, base[1] - 55, PALETTE.stoneDust, 2, 53);
  for (let y = 8; y <= 48; y += 8) {
    const tickWidth = y % 16 === 0 ? 8 : 5;
    px(ctx, base[0] - tickWidth - 3, base[1] - y, PALETTE.hostBone, tickWidth, 2);
  }
  const mastTop = [base[0], base[1] - 51];
  linePx(ctx, mastTop[0], mastTop[1], armEnd[0], armEnd[1], PALETTE.outline, 7);
  linePx(ctx, mastTop[0] - 1, mastTop[1] - 1, armEnd[0], armEnd[1] - 1, PALETTE.clothBlue, 3);
  px(ctx, armEnd[0] - 5, armEnd[1] - 5, PALETTE.outline, 11, 10);
  px(ctx, armEnd[0] - 3, armEnd[1] - 3, PALETTE.clothBlueDark, 7, 6);
  const sample = frame.point(0.02, 0, 14);
  linePx(ctx, armEnd[0], armEnd[1] + 4, sample[0], sample[1] - 5, PALETTE.outline, 3);
  nativeLinePx(ctx, armEnd[0] - 0.5, armEnd[1] + 4.5, sample[0] - 0.5, sample[1] - 5.5, PALETTE.hostBone);
  drawIsoPrism(ctx, sample[0], sample[1], 19, 9, 6, {
    top: PALETTE.clothBlue,
    left: PALETTE.stoneDust,
    right: PALETTE.clothBlueDark,
    outline: PALETTE.outline
  });
  nativePx(ctx, sample[0] - 2.5, sample[1] - 6.5, PALETTE.hostBone, 5, 1);
}

function drawScreeningWeighingFixture(ctx, frame) {
  const dial = frame.point(0, 0, 72);
  poly(ctx, PALETTE.outline, [
    [dial[0] - 9, dial[1] - 14], [dial[0] + 9, dial[1] - 14],
    [dial[0] + 14, dial[1] - 9], [dial[0] + 14, dial[1] + 9],
    [dial[0] + 9, dial[1] + 14], [dial[0] - 9, dial[1] + 14],
    [dial[0] - 14, dial[1] + 9], [dial[0] - 14, dial[1] - 9]
  ]);
  poly(ctx, PALETTE.clothTan, [
    [dial[0] - 7, dial[1] - 11], [dial[0] + 7, dial[1] - 11],
    [dial[0] + 11, dial[1] - 7], [dial[0] + 11, dial[1] + 7],
    [dial[0] + 7, dial[1] + 11], [dial[0] - 7, dial[1] + 11],
    [dial[0] - 11, dial[1] + 7], [dial[0] - 11, dial[1] - 7]
  ]);
  for (const [dx, dy] of [[-7, -5], [-3, -8], [3, -8], [7, -5]]) {
    px(ctx, dial[0] + dx - 1, dial[1] + dy - 1, PALETTE.stoneDark, 3, 3);
  }
  linePx(ctx, dial[0], dial[1] + 2, dial[0] + 7, dial[1] - 5, PALETTE.rustDark, 3);
  nativePx(ctx, dial[0] - 1, dial[1] + 1, PALETTE.outline, 3, 3);
  const pan = frame.point(0, 0, 15);
  const cordLeft = frame.point(-0.18, 0, 43);
  const cordRight = frame.point(0.18, 0, 43);
  linePx(ctx, cordLeft[0], cordLeft[1], pan[0] - 10, pan[1] - 6, PALETTE.outline, 2);
  linePx(ctx, cordRight[0], cordRight[1], pan[0] + 10, pan[1] - 6, PALETTE.outline, 2);
  nativeLinePx(ctx, cordLeft[0] + 0.5, cordLeft[1], pan[0] - 9.5, pan[1] - 6, PALETTE.rustLight);
  drawIsoPrism(ctx, pan[0], pan[1], 31, 12, 5, {
    top: PALETTE.stoneDust,
    left: PALETTE.rustMid,
    right: PALETTE.rustDark,
    outline: PALETTE.outline
  });
  px(ctx, pan[0] + 10, pan[1] - 8, PALETTE.outline, 7, 10);
  px(ctx, pan[0] + 12, pan[1] - 7, PALETTE.clothRed, 3, 7);
}

export function drawSouthMeasureScreeningFrame(ctx, cx, cy, seed, opts = {}) {
  const frame = isoFrame(cx, cy, opts.orient ?? 'se');
  const lean = (seed & 1) ? 1 : -1;
  const variant = opts.variant ?? 'intact';
  const functional = ['records', 'threshold', 'inspection', 'weighing'].includes(variant);
  const broken = opts.damaged || variant === 'broken-baskets';
  const stationFootprint = functional && !broken;

  if (broken) {
    // A torn basket line: bent uprights, a fallen crossbar, and two crushed
    // mesh trays caught in the channel. This must not resemble a usable gate.
    const left = frame.point(-0.48, 0, 0);
    const right = frame.point(0.48, 0, 0);
    const leftTop = [left[0] - 7, left[1] - 47];
    const rightTop = [right[0] + 8, right[1] - 31];
    linePx(ctx, left[0], left[1], leftTop[0], leftTop[1], PALETTE.outline, 8);
    linePx(ctx, left[0] + 1, left[1] - 1, leftTop[0] + 1, leftTop[1] + 1, PALETTE.rustLight, 3);
    linePx(ctx, right[0], right[1], rightTop[0], rightTop[1], PALETTE.outline, 8);
    linePx(ctx, right[0] - 1, right[1] - 1, rightTop[0] - 1, rightTop[1] + 1, PALETTE.rustDark, 3);
    linePx(ctx, leftTop[0], leftTop[1], right[0] + 3, right[1] - 18, PALETTE.outline, 7);
    linePx(ctx, leftTop[0] + 1, leftTop[1] - 1, right[0] + 2, right[1] - 19, PALETTE.stoneDust, 2);

    for (const [a, b, skew] of [[-0.3, -0.12, -1], [0.18, 0.3, 1]]) {
      const basket = frame.point(a, b, 2);
      poly(ctx, PALETTE.outline, [
        [basket[0] - 16, basket[1] - 14], [basket[0] + 13, basket[1] - 9 + skew * 2],
        [basket[0] + 10, basket[1] + 8], [basket[0] - 13, basket[1] + 5]
      ]);
      poly(ctx, PALETTE.rustDark, [
        [basket[0] - 13, basket[1] - 11], [basket[0] + 10, basket[1] - 7 + skew * 2],
        [basket[0] + 7, basket[1] + 5], [basket[0] - 10, basket[1] + 3]
      ]);
      for (const offset of [-8, 0, 8]) {
        linePx(ctx, basket[0] + offset, basket[1] - 9, basket[0] + offset - skew * 4, basket[1] + 4, PALETTE.stoneDust, 2);
      }
      linePx(ctx, basket[0] - 11, basket[1] - 4, basket[0] + 9, basket[1] - 1, PALETTE.rustLight, 2);
    }
    const tornMesh = frame.point(0.1, 0, 27);
    for (const [dx, dy] of [[-15, -7], [-8, 4], [0, -4], [8, 6], [15, -2]]) {
      linePx(ctx, tornMesh[0] + dx, tornMesh[1] - 9, tornMesh[0] + dx + lean * 5, tornMesh[1] + dy, PALETTE.outline, 3);
      nativeLinePx(ctx, tornMesh[0] + dx + 0.5, tornMesh[1] - 8.5, tornMesh[0] + dx + lean * 4.5, tornMesh[1] + dy - 0.5, PALETTE.rustLight);
    }
    linePx(ctx, left[0] - 19, left[1] + 2, right[0] + 19, right[1] + 2, PALETTE.clothBlueDark, 3);
    drawRubbleCluster(ctx, right[0] + 12, right[1] + 5, seed + 541, 2);
    nativeLinePx(ctx, leftTop[0] + 1.5, leftTop[1] + 1.5, right[0] + 0.5, right[1] - 18.5, PALETTE.stoneDust);
    return;
  }

  if (variant === 'threshold') {
    drawScreeningThresholdChannel(ctx, frame);
  }

  // One removable trash rack between two anchored uprights. The previous
  // four long side rails made each station resemble gym equipment or an
  // airport checkpoint, especially when seventeen were repeated together.
  const left = frame.point(-0.42, 0, 0);
  const right = frame.point(0.42, 0, 0);
  for (const [index, p] of [left, right].entries()) {
    drawIsoPrism(ctx, p[0], p[1] + 1, 12, 7, 7, {
      top: PALETTE.limeLight,
      left: PALETTE.limeMid,
      right: PALETTE.limeDark,
      outline: PALETTE.outline
    });
    const top = [p[0] + lean * index, p[1] - 48];
    linePx(ctx, p[0], p[1] - 4, top[0], top[1], PALETTE.outline, 6);
    linePx(ctx, p[0] - 1, p[1] - 5, top[0] - 1, top[1] + 2, index ? PALETTE.ironDark : PALETTE.ironMid, 3);
    nativeLinePx(ctx, p[0] - 1.5, p[1] - 7.5, top[0] - 1.5, top[1] + 3.5, PALETTE.ironLight);
  }
  const topLeft = frame.point(-0.42, 0, 48);
  const topRight = frame.point(0.42, 0, 48);
  linePx(ctx, topLeft[0], topLeft[1], topRight[0], topRight[1], PALETTE.outline, 6);
  linePx(ctx, topLeft[0] + 1, topLeft[1] - 1, topRight[0] - 1, topRight[1] - 1, PALETTE.ironMid, 3);
  nativeLinePx(ctx, topLeft[0] + 2.5, topLeft[1] - 2.5, topRight[0] - 2.5, topRight[1] - 2.5, PALETTE.ironLight);

  const rackTopLeft = frame.point(-0.34, 0, 38);
  const rackTopRight = frame.point(0.34, 0, 38);
  const rackBottomRight = frame.point(0.34, 0, 11);
  const rackBottomLeft = frame.point(-0.34, 0, 11);
  const rack = faceTools(ctx, rackTopLeft, rackTopRight, rackBottomRight, rackBottomLeft);
  rack.line(0, 0, 1, 0, PALETTE.outline, 5);
  rack.line(0, 1, 1, 1, PALETTE.outline, 5);
  rack.line(0, 0, 0, 1, PALETTE.outline, 4);
  rack.line(1, 0, 1, 1, PALETTE.outline, 4);
  for (const u of [0.12, 0.3, 0.48, 0.66, 0.84]) {
    rack.line(u, 0.08, Math.min(0.96, u + 0.12), 0.93, PALETTE.rustDark, 2);
    rack.nativeLine(u + 0.015, 0.08, Math.min(0.97, u + 0.135), 0.9, u < 0.5 ? PALETTE.rustLight : PALETTE.stoneDark);
  }
  rack.line(0.04, 0.55, 0.96, 0.55, PALETTE.ironMid, 2);

  const catchFrame = isoFrame(cx, cy + 1, opts.orient ?? 'se');
  orientedBox(ctx, catchFrame, 0.76, 0.38, 4, {
    top: PALETTE.stoneMid,
    lit: PALETTE.limeMid,
    shade: PALETTE.limeDark,
    outline: PALETTE.outline
  });
  const wetA = frame.point(-0.23, -0.1, 6);
  const wetB = frame.point(0.23, 0.1, 6);
  nativeLinePx(ctx, wetA[0], wetA[1], wetB[0], wetB[1], PALETTE.clothBlueDark);

  const slate = frame.point(0.27, 0, 44);
  px(ctx, slate[0] - 5, slate[1] - 4, PALETTE.outline, 11, 9);
  px(ctx, slate[0] - 3, slate[1] - 3, PALETTE.stoneMid, 7, 6);
  nativeLinePx(ctx, slate[0] - 1.5, slate[1] - 1.5, slate[0] + 2.5, slate[1] - 1.5, PALETTE.clothTan);

  if (variant === 'records') {
    drawScreeningRecordsRack(ctx, frame);
  } else if (variant === 'inspection') {
    drawScreeningInspectionRig(ctx, frame);
  } else if (variant === 'weighing') {
    drawScreeningWeighingFixture(ctx, frame);
  }
}

export function drawSouthMeasureFixedHoist(ctx, cx, cy, seed) {
  for (const side of [-1, 1]) {
    linePx(ctx, cx + side * 36, cy + 2, cx + side * 25, cy - 72, PALETTE.outline, 9);
    linePx(ctx, cx + side * 35, cy, cx + side * 24, cy - 71, side < 0 ? PALETTE.rustLight : PALETTE.rustDark, 4);
    linePx(ctx, cx + side * 35, cy - 2, cx + side * 25, cy - 57, PALETTE.stoneDust, 1);
    linePx(ctx, cx + side * 35, cy - 4, cx + side * 5, cy - 58, PALETTE.outline, 5);
    linePx(ctx, cx + side * 34, cy - 5, cx + side * 5, cy - 59, PALETTE.rustMid, 2);
  }
  // The shared bridge and end stops are deliberately wider than the feet so
  // the silhouette reads as lifting equipment, not two timber trestles.
  linePx(ctx, cx - 31, cy - 71, cx + 32, cy - 71, PALETTE.outline, 12);
  linePx(ctx, cx - 30, cy - 74, cx + 31, cy - 74, PALETTE.stoneDust, 4);
  linePx(ctx, cx - 28, cy - 68, cx + 29, cy - 68, PALETTE.rustDark, 3);
  for (const side of [-1, 1]) {
    px(ctx, cx + side * 31 - 3, cy - 79, PALETTE.outline, 7, 15);
    px(ctx, cx + side * 31 - 1, cy - 77, PALETTE.rustLight, 3, 10);
  }

  const trolleyX = cx + 7;
  px(ctx, trolleyX - 10, cy - 73, PALETTE.outline, 21, 16);
  px(ctx, trolleyX - 8, cy - 72, PALETTE.rustMid, 17, 12);
  px(ctx, trolleyX - 6, cy - 70, PALETTE.stoneDust, 13, 4);
  for (const side of [-1, 1]) {
    px(ctx, trolleyX + side * 6 - 3, cy - 79, PALETTE.outline, 7, 7);
    px(ctx, trolleyX + side * 6 - 1, cy - 77, PALETTE.rustLight, 3, 3);
  }

  // Large pulley and segmented chain remain visible under the dark annex wash.
  px(ctx, trolleyX - 9, cy - 61, PALETTE.outline, 19, 18);
  px(ctx, trolleyX - 6, cy - 58, PALETTE.rustDark, 13, 12);
  px(ctx, trolleyX - 3, cy - 55, PALETTE.void, 7, 6);
  linePx(ctx, trolleyX - 7, cy - 52, trolleyX + 7, cy - 52, PALETTE.rustLight, 2);
  linePx(ctx, trolleyX, cy - 59, trolleyX, cy - 46, PALETTE.stoneDust, 2);
  for (let y = cy - 43; y <= cy - 18; y += 5) {
    px(ctx, trolleyX - 3 + ((y / 5) & 1), y, PALETTE.outline, 7, 5);
    px(ctx, trolleyX - 1 + ((y / 5) & 1), y + 1, PALETTE.rustLight, 3, 2);
  }
  linePx(ctx, trolleyX, cy - 17, trolleyX + 8, cy - 11, PALETTE.outline, 4);
  linePx(ctx, trolleyX + 8, cy - 11, trolleyX + 3, cy - 5, PALETTE.outline, 4);
  linePx(ctx, trolleyX + 1, cy - 17, trolleyX + 8, cy - 12, PALETTE.stoneDust, 1);

  // A condemned bearing block hangs just clear of the floor.
  drawIsoPrism(ctx, cx + 7, cy + 1, 38, 21, 17, {
    top: PALETTE.stoneDust,
    left: PALETTE.rustMid,
    right: PALETTE.rustDark,
    outline: PALETTE.outline
  });
  px(ctx, cx + 1, cy - 10, PALETTE.outline, 13, 7);
  px(ctx, cx + 3, cy - 9, PALETTE.clothRed, 9, 3);
  drawRubbleCluster(ctx, cx + 37, cy + 7, seed + 557, 2);
  nativeLinePx(ctx, cx - 26.5, cy - 74.5, cx + 26.5, cy - 74.5, PALETTE.stoneDust);
  nativeLinePx(ctx, cx - 33.5, cy - 7.5, cx - 25.5, cy - 57.5, PALETTE.rustLight);
  nativeLinePx(ctx, trolleyX + 0.5, cy - 41.5, trolleyX + 0.5, cy - 23.5, PALETTE.rustLight);
}

function drawWagonWheel(ctx, x, y, seed, opts = {}) {
  const rim = opts.far ? PALETTE.woodDark : PALETTE.rustDark;
  const lit = opts.far ? PALETTE.woodMid : PALETTE.rustLight;
  const spoke = opts.far ? PALETTE.woodDark : PALETTE.woodMid;
  const rows = [
    [-10, 7], [-9, 13], [-8, 17], [-7, 19], [-6, 21],
    [-5, 23], [-4, 23], [-3, 25], [-2, 25], [-1, 25],
    [0, 25], [1, 25], [2, 25], [3, 23], [4, 23],
    [5, 21], [6, 21], [7, 17], [8, 13], [9, 7]
  ];
  for (const [dy, width] of rows) {
    const left = Math.round(x - width / 2);
    px(ctx, left, y + dy, PALETTE.outline, width, 1);
    if (width > 9) px(ctx, left + 2, y + dy, dy < -3 ? lit : rim, width - 4, 1);
  }

  const openRows = [
    [-5, 7], [-4, 11], [-3, 13], [-2, 15], [-1, 15],
    [0, 15], [1, 15], [2, 13], [3, 11], [4, 7]
  ];
  for (const [dy, width] of openRows) {
    px(ctx, Math.round(x - width / 2), y + dy, PALETTE.void, width, 1);
  }

  for (const [dx, dy] of [[-8, -6], [8, -6], [-8, 6], [8, 6]]) {
    linePx(ctx, x, y, x + dx, y + dy, PALETTE.outline, 3);
    linePx(ctx, x, y - 1, x + dx, y + dy - 1, spoke, 1);
  }
  linePx(ctx, x - 10, y, x + 10, y, PALETTE.outline, 3);
  linePx(ctx, x - 9, y - 1, x + 9, y - 1, spoke, 1);
  px(ctx, x - 4, y - 4, PALETTE.outline, 9, 9);
  px(ctx, x - 2, y - 2, opts.far ? PALETTE.woodMid : PALETTE.rustLight, 5, 5);
  px(ctx, x - 1, y - 1, PALETTE.void, 3, 3);
  if (seed & 1) nativePx(ctx, x - 8.5, y - 6.5, PALETTE.stoneDust);
}

function drawWagonSack(ctx, point, width, height, colors, seed) {
  const x = point[0];
  const y = point[1];
  const half = Math.floor(width / 2);
  poly(ctx, PALETTE.outline, [
    [x - 2, y - height - 3], [x + 3, y - height - 3],
    [x + 5, y - height + 1], [x + half - 2, y - height + 5],
    [x + half, y - Math.floor(height * 0.55)], [x + half - 2, y - 3],
    [x + half - 6, y], [x - half + 5, y],
    [x - half, y - 4], [x - half - 1, y - Math.floor(height * 0.55)],
    [x - half + 3, y - height + 5], [x - 4, y - height + 1]
  ]);
  poly(ctx, colors.mid, [
    [x - 1, y - height - 1], [x + 2, y - height - 1],
    [x + 3, y - height + 3], [x + half - 4, y - height + 7],
    [x + half - 2, y - Math.floor(height * 0.55)], [x + half - 4, y - 4],
    [x + half - 7, y - 2], [x - half + 6, y - 2],
    [x - half + 2, y - 5], [x - half + 1, y - Math.floor(height * 0.55)],
    [x - half + 5, y - height + 7], [x - 2, y - height + 3]
  ]);
  linePx(ctx, x - half + 3, y - height + 8, x - half + 5, y - 6, colors.hi, 2);
  linePx(ctx, x + half - 5, y - height + 8, x + half - 4, y - 6, colors.lo, 2);
  linePx(ctx, x - half + 4, y - 7, x + half - 5, y - 5, colors.lo, 1);
  px(ctx, x - 4, y - height - 5, PALETTE.outline, 9, 4);
  px(ctx, x - 2, y - height - 5, colors.lo, 5, 2);
  if (seed & 1) nativeLinePx(ctx, x - half + 4.5, y - height + 8.5, x - 0.5, y - height + 4.5, colors.hi);
}

function drawSouthMeasureMedicineTrolley(ctx, cx, cy, seed, opts = {}) {
  const frame = isoFrame(cx, cy, opts.orient ?? 'se');
  const sideA = frame.point(0, 0.3, 0);
  const sideB = frame.point(0, -0.3, 0);
  const nearLb = sideA[1] > sideB[1] ? 0.3 : -0.3;
  const farLb = -nearLb;

  const drawTrolleyWheel = (point, radius, lit) => {
    const x = point[0];
    const y = point[1];
    for (let dy = -radius; dy <= radius; dy += 1) {
      const half = Math.max(2, Math.floor(Math.sqrt(Math.max(0, radius * radius - dy * dy))));
      px(ctx, x - half - 1, y + dy, PALETTE.outline, half * 2 + 3, 1);
      if (half > 2) px(ctx, x - half + 1, y + dy, dy < 0 ? lit : PALETTE.rustDark, half * 2 - 1, 1);
    }
    poly(ctx, PALETTE.rustDark, [
      [x, y - Math.max(2, radius - 2)], [x + Math.max(2, radius - 2), y],
      [x, y + Math.max(2, radius - 2)], [x - Math.max(2, radius - 2), y]
    ]);
    px(ctx, x - 2, y - 2, PALETTE.outline, 5, 5);
    px(ctx, x - 1, y - 1, PALETTE.void, 3, 3);
    nativePx(ctx, x - radius + 1.5, y - 2.5, PALETTE.rustLight);
  };

  // Far wheels and both axles are laid down before the open chassis.
  for (const la of [-0.42, 0.42]) {
    drawTrolleyWheel(frame.point(la, farLb, 7), 4, PALETTE.rustDark);
    const axleA = frame.point(la, farLb, 8);
    const axleB = frame.point(la, nearLb, 8);
    linePx(ctx, axleA[0], axleA[1], axleB[0], axleB[1], PALETTE.outline, 4);
    nativeLinePx(ctx, axleA[0] + 0.5, axleA[1] - 0.5, axleB[0] + 0.5, axleB[1] - 0.5, PALETTE.rustMid);
  }

  const lower = orientedBox(ctx, frame, 0.92, 0.44, 3, {
    top: PALETTE.clothBlueDark,
    lit: PALETTE.rustMid,
    shade: PALETTE.outline,
    outline: PALETTE.outline
  }, 13);
  const top = orientedBox(ctx, frame, 1.04, 0.48, 4, {
    top: PALETTE.stoneDust,
    lit: PALETTE.stoneMid,
    shade: PALETTE.clothDark,
    outline: PALETTE.outline
  }, 30);

  // Four slim uprights leave open air between two genuinely shallow trays.
  for (const [la, lb] of [[-0.43, -0.18], [0.43, -0.18], [-0.43, 0.18], [0.43, 0.18]]) {
    const low = frame.point(la, lb, 15);
    const high = frame.point(la, lb, 30);
    linePx(ctx, low[0], low[1], high[0], high[1], PALETTE.outline, 3);
    nativeLinePx(ctx, low[0] - 0.5, low[1] - 1.5, high[0] - 0.5, high[1] + 0.5, PALETTE.stoneMid);
  }

  // Two large near-side iron wheels make the cart anatomy unmistakable.
  for (const la of [-0.42, 0.42]) {
    drawTrolleyWheel(frame.point(la, nearLb, 8), 7, PALETTE.ironMid);
  }

  // A raised push bar extends beyond the short end of the trolley.
  const handleLowA = frame.point(-0.49, -0.2, 29);
  const handleLowB = frame.point(-0.49, 0.2, 29);
  const handleHighA = frame.point(-0.68, -0.2, 44);
  const handleHighB = frame.point(-0.68, 0.2, 44);
  linePx(ctx, handleLowA[0], handleLowA[1], handleHighA[0], handleHighA[1], PALETTE.outline, 4);
  linePx(ctx, handleLowB[0], handleLowB[1], handleHighB[0], handleHighB[1], PALETTE.outline, 4);
  linePx(ctx, handleHighA[0], handleHighA[1], handleHighB[0], handleHighB[1], PALETTE.outline, 5);
  nativeLinePx(ctx, handleHighA[0] + 0.5, handleHighA[1] - 1.5, handleHighB[0] + 0.5, handleHighB[1] - 1.5, PALETTE.stoneDust);

  // Wrapped dressings, an enamel basin, and one medicine bottle sit on the
  // top tray. The load is small enough that the wheeled frame stays legible.
  const bandage = frame.point(-0.2, -0.03, 36);
  px(ctx, bandage[0] - 7, bandage[1] - 5, PALETTE.outline, 15, 8);
  px(ctx, bandage[0] - 5, bandage[1] - 5, PALETTE.hostBone, 11, 5);
  linePx(ctx, bandage[0], bandage[1] - 5, bandage[0], bandage[1], PALETTE.clothRed, 2);
  const basin = frame.point(0.14, 0.02, 36);
  drawIsoDiamond(ctx, basin[0], basin[1], 20, 8, PALETTE.outline);
  drawIsoDiamond(ctx, basin[0] - 1, basin[1] - 1, 15, 5, PALETTE.clothBlue);
  const bottle = frame.point(0.31, -0.08, 35);
  px(ctx, bottle[0] - 2, bottle[1] - 12, PALETTE.outline, 5, 13);
  px(ctx, bottle[0] - 1, bottle[1] - 10, seed & 1 ? PALETTE.hostGold : PALETTE.clothRed, 3, 9);
  px(ctx, bottle[0], bottle[1] - 10, PALETTE.stoneLight, 1, 3);

  // A soft dressing satchel hangs from the near rail instead of filling it.
  const satchel = frame.point(0.02, nearLb, 19);
  poly(ctx, PALETTE.outline, [
    [satchel[0] - 7, satchel[1] - 6], [satchel[0] + 6, satchel[1] - 5],
    [satchel[0] + 8, satchel[1] + 7], [satchel[0], satchel[1] + 10],
    [satchel[0] - 8, satchel[1] + 6]
  ]);
  poly(ctx, PALETTE.clothDark, [
    [satchel[0] - 5, satchel[1] - 4], [satchel[0] + 4, satchel[1] - 3],
    [satchel[0] + 5, satchel[1] + 5], [satchel[0], satchel[1] + 7],
    [satchel[0] - 5, satchel[1] + 4]
  ]);
  px(ctx, satchel[0] - 3, satchel[1] - 1, PALETTE.clothRed, 6, 3);
  nativePx(ctx, satchel[0] - 0.5, satchel[1] - 0.5, PALETTE.hostBone);
  nativeLinePx(ctx, top.cap.left[0] + 1.5, top.cap.left[1] - 0.5, top.cap.top[0] - 1.5, top.cap.top[1] + 0.5, PALETTE.stoneLight);
  nativeLinePx(ctx, lower.cap.left[0] + 1.5, lower.cap.left[1] - 0.5, lower.cap.top[0] - 1.5, lower.cap.top[1] + 0.5, PALETTE.clothBlue);
}

export function drawSouthMeasureFreightWagon(ctx, cx, cy, seed, opts = {}) {
  const frame = isoFrame(cx, cy, opts.orient ?? 'se');
  const measureMedicine = opts.variant === 'measure-medicine';
  if (measureMedicine) {
    drawSouthMeasureMedicineTrolley(ctx, cx, cy, seed, opts);
    return;
  }
  const medicine = opts.variant === 'medicine';
  const sideA = frame.point(0, 0.38, 0);
  const sideB = frame.point(0, -0.38, 0);
  const nearLb = sideA[1] > sideB[1] ? 0.38 : -0.38;
  const farLb = -nearLb;

  // Twin shafts, a cross yoke, and two visible axles establish a real chassis
  // before the bed is added. Nothing here is a wheel icon floating beside a box.
  for (const lb of [-0.16, 0.16]) {
    const shaftA = frame.point(0.48, lb, 15);
    const shaftB = frame.point(1.24, lb, 2);
    linePx(ctx, shaftA[0], shaftA[1], shaftB[0], shaftB[1], PALETTE.outline, 6);
    linePx(ctx, shaftA[0], shaftA[1] - 2, shaftB[0], shaftB[1] - 2, PALETTE.woodMid, 2);
    nativeLinePx(ctx, shaftA[0] + 1.5, shaftA[1] - 3.5, shaftB[0] - 1.5, shaftB[1] - 3.5, PALETTE.woodLight);
  }
  const yokeA = frame.point(1.2, -0.19, 3);
  const yokeB = frame.point(1.2, 0.19, 3);
  linePx(ctx, yokeA[0], yokeA[1], yokeB[0], yokeB[1], PALETTE.outline, 7);
  linePx(ctx, yokeA[0] + 1, yokeA[1] - 2, yokeB[0] - 1, yokeB[1] - 2, PALETTE.rustLight, 2);

  const axlePoints = [-0.43, 0.43].map((la) => ({
    la,
    far: frame.point(la, farLb, 10),
    near: frame.point(la, nearLb, 10)
  }));
  for (const axle of axlePoints) {
    linePx(ctx, axle.far[0], axle.far[1], axle.near[0], axle.near[1], PALETTE.outline, 7);
    linePx(ctx, axle.far[0], axle.far[1] - 2, axle.near[0], axle.near[1] - 2, PALETTE.rustMid, 3);
    drawWagonWheel(ctx, axle.far[0], axle.far[1], seed + Math.round(axle.la * 10), { far: true });
  }
  for (const lb of [farLb * 0.78, nearLb * 0.78]) {
    const railA = frame.point(-0.54, lb, 15);
    const railB = frame.point(0.57, lb, 15);
    linePx(ctx, railA[0], railA[1], railB[0], railB[1], PALETTE.outline, 7);
    linePx(ctx, railA[0] + 1, railA[1] - 2, railB[0] - 1, railB[1] - 2, lb === farLb * 0.78 ? PALETTE.woodDark : PALETTE.woodMid, 3);
  }

  const bed = orientedBox(ctx, frame, 1.18, 0.64, 5, {
    top: medicine ? PALETTE.stoneDust : PALETTE.woodMid,
    lit: medicine ? PALETTE.stoneMid : PALETTE.woodLight,
    shade: medicine ? PALETTE.clothDark : PALETTE.woodDark,
    outline: PALETTE.outline
  }, 18);
  for (const la of [-0.4, -0.14, 0.13, 0.4]) {
    const plankA = frame.point(la, -0.28, 24);
    const plankB = frame.point(la, 0.28, 24);
    linePx(ctx, plankA[0], plankA[1], plankB[0], plankB[1], la < 0 ? PALETTE.woodLight : PALETTE.woodDark, 1);
  }

  const drawSideRail = (lb, far = false) => {
    const baseA = frame.point(-0.55, lb, 22);
    const baseB = frame.point(0.55, lb, 22);
    const topA = frame.point(-0.55, lb, far ? 38 : 42);
    const topB = frame.point(0.55, lb, far ? 38 : 42);
    for (const [index, la] of [-0.55, -0.19, 0.2, 0.55].entries()) {
      const foot = frame.point(la, lb, 21);
      const top = frame.point(la + ((seed + index) % 3 === 0 ? 0.025 : 0), lb, far ? 39 : 43);
      linePx(ctx, foot[0], foot[1], top[0], top[1], PALETTE.outline, 4);
      linePx(ctx, foot[0] - 1, foot[1] - 1, top[0] - 1, top[1] + 1, far ? PALETTE.woodDark : PALETTE.woodMid, 1);
    }
    linePx(ctx, baseA[0], baseA[1] - 7, baseB[0], baseB[1] - 7, PALETTE.outline, 5);
    linePx(ctx, baseA[0] + 1, baseA[1] - 9, baseB[0] - 1, baseB[1] - 9, far ? PALETTE.woodDark : PALETTE.woodLight, 2);
    linePx(ctx, topA[0], topA[1], topB[0], topB[1], PALETTE.outline, 5);
    linePx(ctx, topA[0] + 1, topA[1] - 2, topB[0] - 1, topB[1] - 2, far ? PALETTE.woodMid : PALETTE.rustLight, 2);
  };

  drawSideRail(farLb * 0.82, true);
  if (medicine) {
    const cotA = frame.point(-0.36, 0, 25);
    const cotB = frame.point(0.34, 0, 25);
    linePx(ctx, cotA[0], cotA[1], cotB[0], cotB[1], PALETTE.outline, 11);
    linePx(ctx, cotA[0] + 1, cotA[1] - 3, cotB[0] - 1, cotB[1] - 3, PALETTE.clothTan, 6);
    const pillow = frame.point(-0.35, -0.02, 32);
    drawIsoDiamond(ctx, pillow[0], pillow[1], 18, 7, PALETTE.outline);
    drawIsoDiamond(ctx, pillow[0] - 1, pillow[1] - 1, 14, 4, PALETTE.hostBone);
    const rack = frame.point(0.3, farLb * 0.6, 48);
    linePx(ctx, rack[0], rack[1], rack[0], rack[1] + 24, PALETTE.outline, 4);
    linePx(ctx, rack[0] - 1, rack[1] + 1, rack[0] - 1, rack[1] + 22, PALETTE.rustLight, 1);
    px(ctx, rack[0] - 5, rack[1] - 5, PALETTE.outline, 11, 8);
    px(ctx, rack[0] - 3, rack[1] - 4, PALETTE.clothRed, 7, 5);

    // A bowed, patched rain hood follows the wagon instead of turning it into
    // another rectangular kiosk.
    const hoodFarLeft = frame.point(-0.55, farLb * 0.72, 58);
    const hoodFarRight = frame.point(0.55, farLb * 0.72, 58);
    const hoodNearLeft = frame.point(-0.55, nearLb * 0.72, 53);
    const hoodNearRight = frame.point(0.55, nearLb * 0.72, 53);
    const ridgeLeft = frame.point(-0.55, 0, 65);
    const ridgeRight = frame.point(0.55, 0, 65);
    for (const la of [-0.5, 0.5]) {
      const footFar = frame.point(la, farLb * 0.72, 23);
      const topFar = frame.point(la, farLb * 0.72, 58);
      const footNear = frame.point(la, nearLb * 0.72, 23);
      const topNear = frame.point(la, nearLb * 0.72, 53);
      linePx(ctx, footFar[0], footFar[1], topFar[0], topFar[1], PALETTE.outline, 4);
      linePx(ctx, footNear[0], footNear[1], topNear[0], topNear[1], PALETTE.outline, 4);
      nativeLinePx(ctx, footNear[0] - 0.5, footNear[1] - 1.5, topNear[0] - 0.5, topNear[1] + 1.5, PALETTE.rustLight);
    }
    poly(ctx, PALETTE.outline, [hoodFarLeft, ridgeLeft, ridgeRight, hoodFarRight]);
    poly(ctx, PALETTE.clothTan, [
      [hoodFarLeft[0] + 2, hoodFarLeft[1] + 2], [ridgeLeft[0], ridgeLeft[1] + 2],
      [ridgeRight[0], ridgeRight[1] + 2], [hoodFarRight[0] - 2, hoodFarRight[1] + 2]
    ]);
    poly(ctx, PALETTE.outline, [ridgeLeft, hoodNearLeft, hoodNearRight, ridgeRight]);
    poly(ctx, PALETTE.stoneDust, [
      [ridgeLeft[0] + 1, ridgeLeft[1] + 2], [hoodNearLeft[0] + 2, hoodNearLeft[1]],
      [hoodNearRight[0] - 2, hoodNearRight[1]], [ridgeRight[0] - 1, ridgeRight[1] + 2]
    ]);
    const patch = frame.point(0.08, nearLb * 0.73, 56);
    px(ctx, patch[0] - 6, patch[1] - 4, PALETTE.outline, 13, 9);
    px(ctx, patch[0] - 5, patch[1] - 3, PALETTE.clothBlueDark, 11, 7);
    nativeLinePx(ctx, patch[0] - 3.5, patch[1] - 1.5, patch[0] + 3.5, patch[1] + 1.5, PALETTE.clothBlue);
  } else {
    drawWagonSack(ctx, frame.point(-0.28, -0.08, 25), 22, 30, {
      hi: PALETTE.hostBone,
      mid: PALETTE.clothTan,
      lo: PALETTE.woodDark
    }, seed);
    drawWagonSack(ctx, frame.point(0.04, 0.07, 25), 25, 35, {
      hi: PALETTE.stoneDust,
      mid: PALETTE.rustMid,
      lo: PALETTE.rustDark
    }, seed + 1);
    drawWagonSack(ctx, frame.point(0.31, -0.06, 25), 20, 26, {
      hi: PALETTE.stoneLight,
      mid: PALETTE.stoneMid,
      lo: PALETTE.stoneDark
    }, seed + 2);
    const rollA = frame.point(-0.47, nearLb * 0.45, 34);
    const rollB = frame.point(0.4, nearLb * 0.45, 34);
    linePx(ctx, rollA[0], rollA[1], rollB[0], rollB[1], PALETTE.outline, 10);
    linePx(ctx, rollA[0] + 1, rollA[1] - 3, rollB[0] - 1, rollB[1] - 3, PALETTE.clothBlueDark, 5);
    nativeLinePx(ctx, rollA[0] + 2.5, rollA[1] - 4.5, rollB[0] - 2.5, rollB[1] - 4.5, PALETTE.clothBlue);
    for (const t of [0.22, 0.76]) {
      const tieX = Math.round(rollA[0] + (rollB[0] - rollA[0]) * t);
      const tieY = Math.round(rollA[1] + (rollB[1] - rollA[1]) * t);
      px(ctx, tieX - 2, tieY - 6, PALETTE.rustLight, 4, 10);
    }
  }

  for (const axle of axlePoints) {
    drawWagonWheel(ctx, axle.near[0], axle.near[1], seed + Math.round(axle.la * 10));
    linePx(ctx, axle.near[0] - 3, axle.near[1] - 1, axle.near[0] + 4, axle.near[1] - 1, PALETTE.outline, 5);
    px(ctx, axle.near[0] - 1, axle.near[1] - 2, PALETTE.rustLight, 4, 3);
  }
  drawSideRail(nearLb * 0.82, false);
  const brakeTop = frame.point(-0.08, nearLb * 0.9, 46);
  const brakeBottom = frame.point(-0.16, nearLb * 0.9, 19);
  linePx(ctx, brakeTop[0], brakeTop[1], brakeBottom[0], brakeBottom[1], PALETTE.outline, 4);
  linePx(ctx, brakeTop[0] - 1, brakeTop[1] + 1, brakeBottom[0] - 1, brakeBottom[1] - 1, PALETTE.rustLight, 1);
  px(ctx, brakeTop[0] - 5, brakeTop[1] - 4, PALETTE.outline, 11, 5);
  px(ctx, brakeTop[0] - 3, brakeTop[1] - 4, PALETTE.woodLight, 7, 2);
  nativeLinePx(ctx, bed.cap.left[0] + 1.5, bed.cap.left[1] - 0.5, bed.cap.top[0] - 1.5, bed.cap.top[1] + 0.5, medicine ? PALETTE.stoneLight : PALETTE.woodLight);
}

export function drawSouthMeasureGrainCage(ctx, cx, cy, seed, opts = {}) {
  const frame = isoFrame(cx, cy, opts.orient ?? 'se');

  // A low slatted freight crib contains recognisable tied sacks. The former
  // tall bars made every grain store read as a little jail or a cot.
  const pallet = orientedBox(ctx, frame, 1.02, 0.66, 7, {
    top: PALETTE.woodMid,
    lit: PALETTE.woodLight,
    shade: PALETTE.woodDark,
    outline: PALETTE.outline
  });
  const sackSpecs = [
    { la: -0.25, lb: 0.04, width: 24, height: 28, mid: PALETTE.clothTan, hi: PALETTE.hostBone },
    { la: 0.03, lb: -0.12, width: 27, height: 34, mid: PALETTE.stoneDust, hi: PALETTE.stoneLight },
    { la: 0.29, lb: 0.08, width: 22, height: 26, mid: PALETTE.clothTan, hi: PALETTE.stoneDust }
  ];
  for (const [index, sack] of sackSpecs.entries()) {
    const base = frame.point(sack.la, sack.lb, 8);
    const half = Math.floor(sack.width / 2);
    const top = base[1] - sack.height;
    poly(ctx, PALETTE.outline, [
      [base[0] - 3, top - 3], [base[0] + 3, top - 3],
      [base[0] + 6, top + 2], [base[0] + half, top + 8],
      [base[0] + half - 1, base[1] - 4], [base[0] + half - 5, base[1]],
      [base[0] - half + 5, base[1]], [base[0] - half, base[1] - 5],
      [base[0] - half + 1, top + 8], [base[0] - 6, top + 2]
    ]);
    poly(ctx, sack.mid, [
      [base[0] - 2, top - 1], [base[0] + 2, top - 1],
      [base[0] + 4, top + 4], [base[0] + half - 3, top + 9],
      [base[0] + half - 3, base[1] - 5], [base[0] + half - 6, base[1] - 2],
      [base[0] - half + 6, base[1] - 2], [base[0] - half + 3, base[1] - 6],
      [base[0] - half + 4, top + 9], [base[0] - 4, top + 4]
    ]);
    linePx(ctx, base[0] - half + 4, top + 9, base[0] - half + 5, base[1] - 6, sack.hi, 2);
    linePx(ctx, base[0] - 4, top + 4, base[0] + 4, top + 4, PALETTE.rustDark, 2);
    px(ctx, base[0] - 4, top - 5, PALETTE.outline, 9, 4);
    px(ctx, base[0] - 2, top - 5, index === 1 ? PALETTE.clothRed : PALETTE.woodDark, 5, 2);
  }

  const frontA = frame.point(-0.5, 0.32, 8);
  const frontB = frame.point(0.5, 0.32, 8);
  for (const lift of [8, 22]) {
    const a = frame.point(-0.5, 0.32, lift + 8);
    const b = frame.point(0.5, 0.32, lift + 8);
    linePx(ctx, a[0], a[1], b[0], b[1], PALETTE.outline, 5);
    linePx(ctx, a[0] + 1, a[1] - 1, b[0] - 1, b[1] - 1, PALETTE.woodMid, 2);
  }
  for (const point of [frontA, frontB]) {
    linePx(ctx, point[0], point[1], point[0], point[1] - 30, PALETTE.outline, 5);
    nativeLinePx(ctx, point[0] - 0.5, point[1] - 2.5, point[0] - 0.5, point[1] - 27.5, PALETTE.woodLight);
  }
  if (opts.variant === 'bonded') {
    const tag = frame.point(0.12, 0.34, 24);
    px(ctx, tag[0] - 5, tag[1] - 4, PALETTE.outline, 11, 9);
    px(ctx, tag[0] - 3, tag[1] - 3, PALETTE.clothRed, 7, 6);
    nativePx(ctx, tag[0] - 0.5, tag[1] - 1.5, PALETTE.hostBone);
  }
  nativeLinePx(ctx, pallet.cap.left[0] + 1.5, pallet.cap.left[1] - 0.5, pallet.cap.top[0] - 1.5, pallet.cap.top[1] + 0.5, PALETTE.woodLight);
}

export function drawSouthMeasureLaundryLine(ctx, cx, cy, seed, opts = {}) {
  const frame = isoFrame(cx, cy, opts.orient ?? 'se');
  if (opts.variant === 'entry-screen') {
    // Hidden Rows uses one oversized household drying rack as a soft secret
    // door. Broad, recognisable garments hide the wall fixture while the prop
    // itself remains nonblocking in level data.
    const a = frame.point(-0.7, 0, 0);
    const b = frame.point(0.7, 0, 0);
    const topA = [a[0], a[1] - 50];
    const topB = [b[0], b[1] - 49];
    const hangPoint = (t, drop = 0) => {
      const point = mixPoint(topA, topB, t);
      return [point[0], point[1] + drop];
    };

    for (const [point, light] of [[a, PALETTE.woodLight], [b, PALETTE.rustMid]]) {
      px(ctx, point[0] - 3, point[1] - 53, PALETTE.outline, 7, 56);
      px(ctx, point[0] - 2, point[1] - 52, PALETTE.woodDark, 5, 53);
      px(ctx, point[0] - 1, point[1] - 51, PALETTE.woodMid, 3, 49);
      nativeLinePx(ctx, point[0] - 0.5, point[1] - 50.5, point[0] - 0.5, point[1] - 6.5, light);
    }
    linePx(ctx, topA[0], topA[1], topB[0], topB[1], PALETTE.outline, 4);
    nativeLinePx(ctx, topA[0] + 2.5, topA[1] - 1.5, topB[0] - 2.5, topB[1] - 1.5, PALETTE.hostBone);

    // A patched sheet supplies the masking mass. Its uneven hem and visible
    // fold lines keep it household cloth instead of a clean clinic curtain.
    poly(ctx, PALETTE.outline, [
      hangPoint(0.03, 2), hangPoint(0.49, 2), hangPoint(0.49, 31),
      hangPoint(0.39, 34), hangPoint(0.29, 31), hangPoint(0.18, 35),
      hangPoint(0.08, 32), hangPoint(0.03, 30)
    ]);
    poly(ctx, PALETTE.clothTan, [
      hangPoint(0.055, 4), hangPoint(0.465, 4), hangPoint(0.465, 29),
      hangPoint(0.385, 31), hangPoint(0.29, 28), hangPoint(0.185, 32),
      hangPoint(0.09, 29), hangPoint(0.055, 28)
    ]);
    const sheetTopA = hangPoint(0.07, 5);
    const sheetTopB = hangPoint(0.45, 5);
    linePx(ctx, sheetTopA[0], sheetTopA[1], sheetTopB[0], sheetTopB[1], PALETTE.hostBone, 1);
    for (const t of [0.15, 0.29, 0.41]) {
      const foldTop = hangPoint(t, 6);
      const foldBottom = hangPoint(t + ((seed + Math.floor(t * 100)) & 1 ? 0.025 : -0.02), 28);
      linePx(ctx, foldTop[0], foldTop[1], foldBottom[0], foldBottom[1], t < 0.3 ? PALETTE.stoneDust : PALETTE.woodDark, 1);
    }
    const patch = hangPoint(0.17, 15);
    px(ctx, patch[0] - 6, patch[1] - 4, PALETTE.outline, 13, 10);
    px(ctx, patch[0] - 5, patch[1] - 3, PALETTE.clothRed, 11, 8);
    nativeLinePx(ctx, patch[0] - 3.5, patch[1] - 1.5, patch[0] + 3.5, patch[1] + 2.5, PALETTE.rustLight);

    // A blue work shirt breaks the sheet silhouette with named sleeves.
    const shirtLeft = hangPoint(0.5, 4);
    const shirtRight = hangPoint(0.72, 4);
    const shirtMid = hangPoint(0.61, 4);
    poly(ctx, PALETTE.outline, [
      [shirtLeft[0], shirtLeft[1]], [shirtMid[0] - 3, shirtMid[1]],
      [shirtRight[0], shirtRight[1]], [shirtRight[0] + 7, shirtRight[1] + 8],
      [shirtRight[0] + 3, shirtRight[1] + 13], hangPoint(0.69, 25),
      hangPoint(0.53, 25), [shirtLeft[0] - 3, shirtLeft[1] + 13],
      [shirtLeft[0] - 7, shirtLeft[1] + 8]
    ]);
    poly(ctx, PALETTE.clothBlueDark, [
      [shirtLeft[0] + 1, shirtLeft[1] + 2], [shirtMid[0] - 2, shirtMid[1] + 2],
      [shirtRight[0] - 1, shirtRight[1] + 2], [shirtRight[0] + 5, shirtRight[1] + 8],
      [shirtRight[0] + 2, shirtRight[1] + 10], hangPoint(0.675, 23),
      hangPoint(0.545, 23), [shirtLeft[0] - 2, shirtLeft[1] + 10],
      [shirtLeft[0] - 5, shirtLeft[1] + 8]
    ]);
    nativeLinePx(ctx, shirtLeft[0] + 1.5, shirtLeft[1] + 2.5, shirtRight[0] - 1.5, shirtRight[1] + 2.5, PALETTE.clothBlue);
    nativeLinePx(ctx, shirtMid[0] - 0.5, shirtMid[1] + 5.5, shirtMid[0] - 0.5, shirtMid[1] + 20.5, PALETTE.stoneDust);

    // Separated trouser legs are deliberately readable through the remaining
    // gaps, so the screen cannot be mistaken for flags or warning placards.
    const waistA = hangPoint(0.74, 4);
    const waistB = hangPoint(0.97, 4);
    linePx(ctx, waistA[0], waistA[1], waistB[0], waistB[1], PALETTE.outline, 7);
    linePx(ctx, waistA[0] + 1, waistA[1] - 1, waistB[0] - 1, waistB[1] - 1, PALETTE.rustLight, 2);
    for (const [t0, t1, drop] of [[0.75, 0.845, 31], [0.87, 0.965, 28]]) {
      poly(ctx, PALETTE.outline, [hangPoint(t0, 6), hangPoint(t1, 6), hangPoint(t1, drop), hangPoint(t0, drop + 2)]);
      poly(ctx, PALETTE.clothRed, [hangPoint(t0 + 0.015, 8), hangPoint(t1 - 0.015, 8), hangPoint(t1 - 0.015, drop - 2), hangPoint(t0 + 0.015, drop)]);
      const creaseA = hangPoint((t0 + t1) / 2, 9);
      const creaseB = hangPoint((t0 + t1) / 2, drop - 3);
      nativeLinePx(ctx, creaseA[0], creaseA[1], creaseB[0], creaseB[1], PALETTE.rustDark);
    }

    for (const t of [0.04, 0.48, 0.51, 0.71, 0.75, 0.96]) {
      const peg = hangPoint(t, 0);
      px(ctx, peg[0] - 1, peg[1] - 1, PALETTE.outline, 3, 4);
      px(ctx, peg[0], peg[1], PALETTE.hostBone, 1, 2);
    }
    return;
  }

  const a = frame.point(-0.42, 0, 0);
  const b = frame.point(0.42, 0, 0);
  for (const p of [a, b]) {
    px(ctx, p[0] - 2, p[1] - 45, PALETTE.outline, 5, 48);
    px(ctx, p[0], p[1] - 44, PALETTE.woodMid, 2, 45);
  }
  linePx(ctx, a[0], a[1] - 40, b[0], b[1] - 39, PALETTE.clothTan, 1);
  // Three recognisable garments replace the old row of signal-like squares.
  const shirt = frame.point(-0.23, 0, 39);
  poly(ctx, PALETTE.outline, [
    [shirt[0] - 5, shirt[1]], [shirt[0] + 5, shirt[1]],
    [shirt[0] + 10, shirt[1] + 5], [shirt[0] + 7, shirt[1] + 10],
    [shirt[0] + 4, shirt[1] + 8], [shirt[0] + 4, shirt[1] + 17],
    [shirt[0] - 4, shirt[1] + 17], [shirt[0] - 4, shirt[1] + 8],
    [shirt[0] - 7, shirt[1] + 10], [shirt[0] - 10, shirt[1] + 5]
  ]);
  poly(ctx, PALETTE.clothBlueDark, [
    [shirt[0] - 4, shirt[1] + 2], [shirt[0] + 4, shirt[1] + 2],
    [shirt[0] + 8, shirt[1] + 5], [shirt[0] + 6, shirt[1] + 7],
    [shirt[0] + 3, shirt[1] + 6], [shirt[0] + 3, shirt[1] + 15],
    [shirt[0] - 3, shirt[1] + 15], [shirt[0] - 3, shirt[1] + 6],
    [shirt[0] - 6, shirt[1] + 7], [shirt[0] - 8, shirt[1] + 5]
  ]);
  nativeLinePx(ctx, shirt[0] - 3.5, shirt[1] + 2.5, shirt[0] + 3.5, shirt[1] + 2.5, PALETTE.clothBlue);

  const towel = frame.point(0.01, 0, 39);
  poly(ctx, PALETTE.outline, [
    [towel[0] - 6, towel[1]], [towel[0] + 7, towel[1]],
    [towel[0] + 6, towel[1] + 19], [towel[0] + 2, towel[1] + 17],
    [towel[0] - 2, towel[1] + 20], [towel[0] - 6, towel[1] + 18]
  ]);
  poly(ctx, seed & 1 ? PALETTE.clothTan : PALETTE.stoneDust, [
    [towel[0] - 4, towel[1] + 2], [towel[0] + 5, towel[1] + 2],
    [towel[0] + 4, towel[1] + 16], [towel[0] + 1, towel[1] + 14],
    [towel[0] - 2, towel[1] + 17], [towel[0] - 4, towel[1] + 16]
  ]);
  nativeLinePx(ctx, towel[0] - 2.5, towel[1] + 3.5, towel[0] - 2.5, towel[1] + 14.5, PALETTE.hostBone);

  const trousers = frame.point(0.25, 0, 39);
  px(ctx, trousers[0] - 7, trousers[1], PALETTE.outline, 15, 6);
  px(ctx, trousers[0] - 5, trousers[1] + 2, PALETTE.clothRed, 11, 3);
  for (const side of [-1, 1]) {
    const x = trousers[0] + side * 3;
    poly(ctx, PALETTE.outline, [
      [x - 3, trousers[1] + 4], [x + 3, trousers[1] + 4],
      [x + 2, trousers[1] + 20], [x - 3, trousers[1] + 20]
    ]);
    poly(ctx, PALETTE.clothRed, [
      [x - 1, trousers[1] + 6], [x + 1, trousers[1] + 6],
      [x + 1, trousers[1] + 18], [x - 1, trousers[1] + 18]
    ]);
  }
  for (const p of [shirt, towel, trousers]) nativePx(ctx, p[0] - 0.5, p[1] - 0.5, PALETTE.hostBone);
  nativeLinePx(ctx, a[0] + 0.5, a[1] - 39.5, b[0] - 0.5, b[1] - 38.5, PALETTE.hostBone);
  for (const p of [a, b]) nativeLinePx(ctx, p[0] + 0.5, p[1] - 43.5, p[0] + 0.5, p[1] - 3.5, PALETTE.woodLight);
}

export function drawSouthMeasureSharedOven(ctx, cx, cy, seed) {
  drawIsoPrism(ctx, cx, cy + 3, 53, 25, 10, {
    top: PALETTE.stoneLight,
    left: PALETTE.stoneMid,
    right: PALETTE.stoneDark,
    outline: PALETTE.outline
  });
  // Broad masonry dome with a true arched mouth. The old square aperture and
  // thin chimney made this read as a kiosk with a lit display.
  const domeTop = cy - 47;
  const domeBottom = cy - 8;
  for (let y = domeTop; y <= domeBottom; y += 1) {
    const t = (y - domeTop) / (domeBottom - domeTop);
    const half = Math.max(5, Math.round(6 + Math.sin(Math.min(1, t) * Math.PI * 0.58) * 22));
    px(ctx, cx - half - 2, y, PALETTE.outline, half * 2 + 4, 1);
    px(ctx, cx - half, y, y < cy - 31 ? PALETTE.stoneLight : PALETTE.stoneMid, half, 1);
    px(ctx, cx, y, PALETTE.stoneDark, half, 1);
  }
  for (let dy = 0; dy < 25; dy += 1) {
    const archHalf = dy < 8 ? Math.floor(Math.sqrt(Math.max(0, 64 - (7 - dy) ** 2)) * 1.5) : 12;
    const y = cy - 31 + dy;
    px(ctx, cx - archHalf - 2, y, PALETTE.outline, archHalf * 2 + 4, 1);
    px(ctx, cx - archHalf, y, PALETTE.void, archHalf * 2, 1);
  }
  px(ctx, cx - 9, cy - 10, PALETTE.rustDark, 19, 3);
  px(ctx, cx - 5, cy - 12, PALETTE.ember, 11, 3);
  px(ctx, cx - 1, cy - 13, PALETTE.hostGold, 4, 2);
  px(ctx, cx + 11, cy - 60, PALETTE.outline, 13, 22);
  px(ctx, cx + 14, cy - 59, PALETTE.stoneDark, 7, 20);
  px(ctx, cx + 14, cy - 59, PALETTE.stoneDust, 2, 16);
  drawNoisePixels(ctx, cx - 23, cy - 48, 46, 38, [PALETTE.stoneDark, PALETTE.rustDark], 0.04, seed);
  linePx(ctx, cx - 28, cy + 1, cx - 43, cy + 11, PALETTE.outline, 4);
  linePx(ctx, cx - 27, cy, cx - 42, cy + 10, PALETTE.woodLight, 1);
  drawIsoDiamond(ctx, cx - 45, cy + 12, 16, 6, PALETTE.outline);
  drawIsoDiamond(ctx, cx - 45, cy + 11, 12, 4, PALETTE.woodMid);
  nativeLinePx(ctx, cx - 18.5, domeTop + 17.5, cx - 4.5, domeTop + 10.5, PALETTE.stoneDust);
}

export function drawSouthMeasureWashWall(ctx, cx, cy, seed, opts = {}) {
  const frame = isoFrame(cx, cy, opts.orient ?? 'se');

  // The district wash point is a vertical sanitation spine: tiled backing,
  // header cistern, three downpipes and a shared drain trough. Its silhouette
  // must remain legible before the small tap details are read.
  orientedBox(ctx, frame, 0.96, 0.18, 56, {
    top: PALETTE.hostBone,
    lit: PALETTE.stoneLight,
    shade: PALETTE.stoneDark,
    outline: PALETTE.outline
  });

  const crownFrame = isoFrame(cx, cy - 48, opts.orient ?? 'se');
  const crown = orientedBox(ctx, crownFrame, 0.88, 0.25, 14, {
    top: PALETTE.stoneDust,
    lit: PALETTE.stoneLight,
    shade: PALETTE.rustDark,
    outline: PALETTE.outline
  });
  linePx(ctx, crown.cap.left[0], crown.cap.left[1], crown.cap.top[0], crown.cap.top[1], PALETTE.hostBone, 2);

  const headerA = frame.point(-0.38, 0.12, 45);
  const headerB = frame.point(0.38, 0.12, 45);
  linePx(ctx, headerA[0], headerA[1], headerB[0], headerB[1], PALETTE.outline, 7);
  linePx(ctx, headerA[0], headerA[1] - 1, headerB[0], headerB[1] - 1, PALETTE.rustMid, 3);

  for (const [index, t] of [-0.3, 0, 0.3].entries()) {
    const pipeTop = frame.point(t, 0.12, 45);
    const pipeBottom = frame.point(t, 0.12, 19 + (index & 1) * 2);
    linePx(ctx, pipeTop[0], pipeTop[1], pipeBottom[0], pipeBottom[1], PALETTE.outline, 6);
    linePx(ctx, pipeTop[0] - 1, pipeTop[1], pipeBottom[0] - 1, pipeBottom[1], index === 2 ? PALETTE.rustDark : PALETTE.rustLight, 2);
    const spout = [pipeBottom[0] + (index === 1 ? 0 : index === 0 ? -4 : 4), pipeBottom[1] + 7];
    linePx(ctx, pipeBottom[0], pipeBottom[1], spout[0], spout[1], PALETTE.outline, 4);
    linePx(ctx, pipeBottom[0], pipeBottom[1] - 1, spout[0], spout[1] - 1, PALETTE.stoneDust, 1);
    linePx(ctx, pipeBottom[0] - 4, pipeBottom[1] - 4, pipeBottom[0] + 4, pipeBottom[1] + 1, PALETTE.outline, 2);
    linePx(ctx, pipeBottom[0] - 2, pipeBottom[1] - 4, pipeBottom[0] + 2, pipeBottom[1], PALETTE.hostBone, 1);
    nativeLinePx(ctx, pipeTop[0] - 0.5, pipeTop[1] + 0.5, pipeBottom[0] - 0.5, pipeBottom[1] - 0.5, PALETTE.rustLight);
  }

  const basinBox = orientedBox(ctx, frame, 0.98, 0.42, 13, {
    top: PALETTE.stoneDust,
    lit: PALETTE.stoneMid,
    shade: PALETTE.stoneDark,
    outline: PALETTE.outline
  }, 3);
  const basin = frame.point(0, 0, 17);
  drawIsoDiamond(ctx, basin[0], basin[1], 50, 15, PALETTE.outline);
  drawIsoDiamond(ctx, basin[0] - 1, basin[1] - 1, 43, 11, PALETTE.clothBlueDark);
  linePx(ctx, basinBox.cap.left[0], basinBox.cap.left[1], basinBox.cap.bottom[0], basinBox.cap.bottom[1], PALETTE.hostBone, 1);

  const drain = frame.point(0.42, 0.2, 5);
  px(ctx, drain[0] - 4, drain[1] - 4, PALETTE.outline, 9, 9);
  px(ctx, drain[0] - 2, drain[1] - 3, PALETTE.rustDark, 5, 6);
  for (let y = 0; y < 3; y += 1) linePx(ctx, drain[0] - 2, drain[1] - 2 + y * 2, drain[0] + 2, drain[1] - 2 + y * 2, PALETTE.stoneDust, 1);

  const wallLeft = frame.point(-0.42, 0, 55.5);
  const wallRight = frame.point(0.42, 0, 55.5);
  nativeLinePx(ctx, wallLeft[0], wallLeft[1], wallRight[0], wallRight[1], PALETTE.stoneDust);
  for (const z of [27.5, 36.5]) {
    const tileA = frame.point(-0.42, 0.01, z);
    const tileB = frame.point(0.42, 0.01, z);
    nativeLinePx(ctx, tileA[0], tileA[1], tileB[0], tileB[1], z < 30 ? PALETTE.stoneMid : PALETTE.hostBone);
  }
  nativeLinePx(ctx, basin[0] - 18.5, basin[1] - 0.5, basin[0] - 4.5, basin[1] - 4.5, PALETTE.clothBlue);
  nativeLinePx(ctx, basin[0] + 4.5, basin[1] - 4.5, basin[0] + 18.5, basin[1] - 0.5, PALETTE.clothBlueDark);
  nativePx(ctx, drain[0] - 0.5, drain[1] - 2.5, PALETTE.hostBone);
}

export function drawSouthMeasureGravePlot(ctx, cx, cy, seed, opts = {}) {
  const frame = isoFrame(cx, cy, opts.orient ?? 'se');
  const family = (seed >>> 0) & 3;
  const rng = rngFrom(hash2D(seed + 571, seed * 13 + 9));

  // A broad, ragged patch of turned soil is the primary silhouette. The mound
  // is deliberately low and wide, with shovel cuts across it, so it cannot be
  // mistaken for a plank bed, sled, or piece of street furniture.
  const scar = [
    [-0.91, -0.22, 1], [-0.63, -0.4, 1], [-0.08, -0.47, 1],
    [0.53, -0.37, 1], [0.91, -0.08, 1], [0.79, 0.27, 1],
    [0.26, 0.43, 1], [-0.42, 0.39, 1], [-0.9, 0.13, 1]
  ];
  poly(ctx, PALETTE.ironDark, scar.map((p) => frame.point(...p)));
  poly(ctx, [PALETTE.clayDark, PALETTE.woodDark, PALETTE.clayDark, PALETTE.limeDark][family], scar.map(([la, lb]) => frame.point(la * 0.91, lb * 0.84, 2)));

  const mound = [
    [-0.66, -0.18, 3], [-0.42, -0.33, 4], [0.08, -0.36, 5],
    [0.57, -0.22, 4], [0.73, 0.03, 3], [0.43, 0.27, 4],
    [-0.08, 0.34, 5], [-0.57, 0.2, 4]
  ];
  poly(ctx, [PALETTE.clayMid, PALETTE.clayDark, PALETTE.woodDark, PALETTE.limeDark][family], mound.map((p) => frame.point(...p)));

  // Broken clods replace the former continuous light cap. The centre stays
  // visibly earthen and flat under the map wash instead of becoming a hull.
  for (const [la, lb, len, color] of [
    [-0.48, -0.1, 7, PALETTE.rustMid], [-0.31, 0.13, 4, PALETTE.stoneMid],
    [-0.13, -0.17, 6, PALETTE.woodMid], [0.04, 0.12, 5, PALETTE.rustDark],
    [0.21, -0.12, 8, PALETTE.rustMid], [0.42, 0.09, 4, PALETTE.stoneDust]
  ]) {
    const a = frame.point(la, lb, 5);
    const b = frame.point(la + len / 100, lb, 5);
    linePx(ctx, a[0], a[1], b[0], b[1], color, 1);
  }
  for (const [la, lb, dx, dy, color] of [
    [-0.34, 0.18, 6, -2, PALETTE.rustDark],
    [-0.08, -0.08, 4, 1, PALETTE.stoneDust],
    [0.18, 0.17, 7, -1, PALETTE.rustLight],
    [0.43, -0.08, 4, 1, PALETTE.stoneMid]
  ]) {
    const nick = frame.point(la, lb, 6);
    linePx(ctx, nick[0], nick[1], nick[0] + dx, nick[1] + dy, color, 1);
  }
  for (const [la, lb, size] of [[0.68, -0.16, 8], [0.61, 0.21, 6], [-0.16, 0.35, 5]]) {
    const clod = frame.point(la, lb, 3);
    drawIsoDiamond(ctx, clod[0], clod[1], size, Math.max(3, size - 4), PALETTE.stoneDark);
    nativePx(ctx, clod[0] - 0.5, clod[1] - 1.5, PALETTE.stoneDust);
  }

  let tagAnchor;
  const head = frame.point(-0.78, -0.02, 2);
  if (family === 0) {
    // A split timber headboard, visibly rooted beyond the mound.
    poly(ctx, PALETTE.outline, [
      [head[0] - 8, head[1] + 3], [head[0] - 8, head[1] - 28],
      [head[0] - 3, head[1] - 35], [head[0] + 7, head[1] - 31],
      [head[0] + 8, head[1] + 3]
    ]);
    poly(ctx, PALETTE.woodMid, [
      [head[0] - 5, head[1]], [head[0] - 5, head[1] - 26],
      [head[0] - 2, head[1] - 31], [head[0] + 4, head[1] - 29],
      [head[0] + 5, head[1]]
    ]);
    linePx(ctx, head[0], head[1] - 29, head[0] - 1, head[1] - 5, PALETTE.woodLight, 1);
    linePx(ctx, head[0] - 10, head[1] - 24, head[0] + 10, head[1] - 22, PALETTE.outline, 5);
    linePx(ctx, head[0] - 8, head[1] - 25, head[0] + 8, head[1] - 23, PALETTE.woodLight, 1);
    linePx(ctx, head[0] - 4, head[1] - 25, head[0] + 4, head[1] - 22, PALETTE.outline, 2);
    tagAnchor = [head[0], head[1] - 18];
  } else if (family === 1) {
    // A shouldered stone stele with a chipped upper-left corner.
    poly(ctx, PALETTE.outline, [
      [head[0] - 10, head[1] + 3], [head[0] - 9, head[1] - 22],
      [head[0] - 4, head[1] - 29], [head[0] + 5, head[1] - 30],
      [head[0] + 10, head[1] - 23], [head[0] + 9, head[1] + 3]
    ]);
    poly(ctx, PALETTE.stoneMid, [
      [head[0] - 7, head[1]], [head[0] - 6, head[1] - 20],
      [head[0] - 2, head[1] - 26], [head[0] + 3, head[1] - 27],
      [head[0] + 7, head[1] - 21], [head[0] + 6, head[1]]
    ]);
    linePx(ctx, head[0] - 5, head[1] - 24, head[0] + 3, head[1] - 26, PALETTE.stoneDust, 2);
    tagAnchor = [head[0], head[1] - 15];
  } else if (family === 2) {
    // Paired tally pegs and one bowed household cord.
    const pegs = [frame.point(-0.79, -0.18, 2), frame.point(-0.79, 0.18, 2)];
    const tops = [];
    for (const [index, peg] of pegs.entries()) {
      const height = index ? 25 : 34;
      linePx(ctx, peg[0], peg[1], peg[0] + (index ? 1 : -1), peg[1] - height, PALETTE.outline, 6);
      linePx(ctx, peg[0] - 1, peg[1] - 2, peg[0] + (index ? 0 : -2), peg[1] - height + 2, index ? PALETTE.rustDark : PALETTE.rustMid, 2);
      tops.push([peg[0] + (index ? 1 : -1), peg[1] - height + 3]);
    }
    const sag = [Math.round((tops[0][0] + tops[1][0]) / 2), Math.round((tops[0][1] + tops[1][1]) / 2) + 5];
    linePx(ctx, tops[0][0], tops[0][1], sag[0], sag[1], PALETTE.outline, 2);
    linePx(ctx, sag[0], sag[1], tops[1][0], tops[1][1], PALETTE.rustLight, 2);
    tagAnchor = [sag[0], sag[1] + 7];
  } else {
    // A crooked iron hook survives as the household's grave marker.
    drawIsoDiamond(ctx, head[0], head[1] + 2, 19, 8, PALETTE.outline);
    drawIsoDiamond(ctx, head[0] - 1, head[1] + 1, 13, 5, PALETTE.stoneMid);
    const hook = [
      [head[0], head[1] - 1], [head[0] + 4, head[1] - 31],
      [head[0] + 11, head[1] - 38], [head[0] + 19, head[1] - 35],
      [head[0] + 20, head[1] - 28], [head[0] + 15, head[1] - 24]
    ];
    for (let index = 0; index < hook.length - 1; index += 1) {
      linePx(ctx, hook[index][0], hook[index][1], hook[index + 1][0], hook[index + 1][1], PALETTE.outline, 6);
      nativeLinePx(ctx, hook[index][0] - 0.5, hook[index][1] - 1.5, hook[index + 1][0] - 0.5, hook[index + 1][1] - 1.5, index < 2 ? PALETTE.rustLight : PALETTE.rustMid);
    }
    tagAnchor = [head[0] + 15, head[1] - 18];
  }

  // Every marker carries the same small punched civic record plate.
  px(ctx, tagAnchor[0] - 6, tagAnchor[1] - 5, PALETTE.outline, 13, 10);
  px(ctx, tagAnchor[0] - 4, tagAnchor[1] - 4, family & 1 ? PALETTE.clothTan : PALETTE.stoneDust, 9, 7);
  for (let punch = 0; punch < 2 + family; punch += 1) {
    nativePx(ctx, tagAnchor[0] - 3.5 + (punch % 3) * 3, tagAnchor[1] - 2.5 + Math.floor(punch / 3) * 2, PALETTE.stoneDark);
  }
  nativePx(ctx, tagAnchor[0] + 4.5, tagAnchor[1] - 3.5, PALETTE.hostGold);

  // One small household object at the foot of each plot distinguishes care
  // from civic recordkeeping. The four families use different physical forms
  // and stay low enough that the grave mound remains the primary silhouette.
  const offering = frame.point(0.62, 0.18, 7);
  if (family === 0) {
    poly(ctx, PALETTE.outline, [
      [offering[0] - 5, offering[1] - 8], [offering[0] + 5, offering[1] - 8],
      [offering[0] + 4, offering[1]], [offering[0] - 4, offering[1]]
    ]);
    poly(ctx, PALETTE.clayMid, [
      [offering[0] - 3, offering[1] - 6], [offering[0] + 3, offering[1] - 6],
      [offering[0] + 2, offering[1] - 2], [offering[0] - 2, offering[1] - 2]
    ]);
    nativePx(ctx, offering[0] - 1.5, offering[1] - 5.5, PALETTE.clayLight);
  } else if (family === 1) {
    drawIsoDiamond(ctx, offering[0], offering[1], 18, 7, PALETTE.outline);
    drawIsoDiamond(ctx, offering[0] - 1, offering[1] - 1, 13, 4, PALETTE.clothBlueDark);
    nativeLinePx(ctx, offering[0] - 4.5, offering[1] - 2.5, offering[0] + 2.5, offering[1] - 3.5, PALETTE.clothBlue);
  } else if (family === 2) {
    poly(ctx, PALETTE.outline, [
      [offering[0] - 8, offering[1] - 7], [offering[0] + 7, offering[1] - 5],
      [offering[0] + 5, offering[1] + 2], [offering[0] - 7, offering[1] + 1]
    ]);
    poly(ctx, PALETTE.clothTan, [
      [offering[0] - 5, offering[1] - 5], [offering[0] + 4, offering[1] - 3],
      [offering[0] + 3, offering[1]], [offering[0] - 4, offering[1] - 1]
    ]);
    linePx(ctx, offering[0] - 2, offering[1] - 5, offering[0] + 1, offering[1], PALETTE.clayDark, 1);
  } else {
    for (const [dx, dy, size] of [[-6, 0, 7], [1, -3, 9], [7, 2, 6]]) {
      drawIsoDiamond(ctx, offering[0] + dx, offering[1] + dy, size, Math.max(3, size - 4), PALETTE.outline);
      nativePx(ctx, offering[0] + dx - 0.5, offering[1] + dy - 1.5, dx < 0 ? PALETTE.limeMid : PALETTE.ironLight);
    }
  }

  for (let index = 0; index < 6; index += 1) {
    const p = frame.point(-0.5 + rng() * 1.05, -0.26 + rng() * 0.52, 6 + (index & 1));
    px(ctx, p[0], p[1], index % 3 ? PALETTE.rustDark : PALETTE.stoneDust, 2 + (index & 1), 1);
  }
}

export function drawSouthMeasureGraveFamilyRail(ctx, cx, cy, seed, opts = {}) {
  const frame = isoFrame(cx, cy, opts.orient ?? 'se');
  const rng = rngFrom(hash2D(seed + 593, seed * 17 + 43));
  const left = frame.point(-0.55, 0, 0);
  const right = frame.point(0.55, 0, 0);
  for (const [index, point] of [left, right].entries()) {
    drawIsoPrism(ctx, point[0], point[1] + 1, 14, 8, 10, {
      top: PALETTE.stoneDust,
      left: PALETTE.stoneMid,
      right: PALETTE.stoneDark,
      outline: PALETTE.outline
    });
    const height = 27 + ((seed >>> (index * 4)) & 7);
    px(ctx, point[0] - 3, point[1] - height, PALETTE.outline, 7, height + 2);
    px(ctx, point[0] - 1, point[1] - height + 1, index ? PALETTE.woodDark : PALETTE.woodMid, 3, height - 1);
  }
  const cordLeft = [left[0], left[1] - 27];
  const cordRight = [right[0], right[1] - 29];
  const cordMiddle = [Math.round((left[0] + right[0]) / 2), Math.round((left[1] + right[1]) / 2) - 20];
  linePx(ctx, cordLeft[0], cordLeft[1], cordMiddle[0], cordMiddle[1], PALETTE.outline, 3);
  linePx(ctx, cordMiddle[0], cordMiddle[1], cordRight[0], cordRight[1], PALETTE.outline, 3);
  nativeLinePx(ctx, cordLeft[0] + 1.5, cordLeft[1] - 0.5, cordMiddle[0], cordMiddle[1] - 0.5, PALETTE.rustLight);

  const tagCount = 3 + (seed & 3);
  for (let index = 0; index < tagCount; index += 1) {
    const t = (index + 1) / (tagCount + 1);
    const anchor = t < 0.5
      ? mixPoint(cordLeft, cordMiddle, t * 2)
      : mixPoint(cordMiddle, cordRight, (t - 0.5) * 2);
    const drop = 5 + Math.floor(rng() * 8);
    linePx(ctx, anchor[0], anchor[1], anchor[0], anchor[1] + drop, PALETTE.rustDark, 2);
    const width = 7 + (index & 1) * 3;
    px(ctx, anchor[0] - Math.floor(width / 2), anchor[1] + drop - 1, PALETTE.outline, width, 8);
    px(ctx, anchor[0] - Math.floor(width / 2) + 1, anchor[1] + drop, index & 1 ? PALETTE.clothTan : PALETTE.stoneDust, width - 2, 5);
    for (let punch = 0; punch <= (index % 3); punch += 1) {
      nativePx(ctx, anchor[0] - 2.5 + punch * 2, anchor[1] + drop + 1.5, PALETTE.rustDark);
    }
  }
  nativePx(ctx, left[0] + 0.5, left[1] - 24.5, PALETTE.stoneDust);
}

export function drawSouthMeasureCharityCot(ctx, cx, cy, seed, opts = {}) {
  const frame = isoFrame(cx, cy, opts.orient ?? 'se');
  const mattress = orientedBox(ctx, frame, 1.08, 0.42, 7, {
    top: PALETTE.clothTan,
    lit: PALETTE.stoneDust,
    shade: PALETTE.clothDark,
    outline: PALETTE.outline
  }, 8);
  for (const la of [-0.5, 0.5]) {
    for (const lb of [-0.16, 0.16]) {
      const p = frame.point(la, lb, 6);
      linePx(ctx, p[0], p[1], p[0], p[1] + 8, PALETTE.outline, 3);
      nativeLinePx(ctx, p[0] - 0.5, p[1] + 0.5, p[0] - 0.5, p[1] + 6.5, PALETTE.rustLight);
    }
  }
  const pillow = frame.point(-0.38, 0, 17);
  drawIsoDiamond(ctx, pillow[0], pillow[1], 24, 9, PALETTE.outline);
  drawIsoDiamond(ctx, pillow[0] - 1, pillow[1] - 1, 19, 6, PALETTE.hostBone);
  const blanketA = frame.point(0.1, -0.18, 16);
  const blanketB = frame.point(0.49, -0.18, 16);
  const blanketC = frame.point(0.49, 0.18, 16);
  const blanketD = frame.point(0.1, 0.18, 16);
  poly(ctx, PALETTE.outline, [blanketA, blanketB, blanketC, blanketD]);
  poly(ctx, seed & 1 ? PALETTE.clothRed : PALETTE.clothDark, [
    frame.point(0.13, -0.15, 17), frame.point(0.46, -0.15, 17),
    frame.point(0.46, 0.15, 17), frame.point(0.13, 0.15, 17)
  ]);
  const headLeft = frame.point(-0.52, -0.19, 8);
  const headRight = frame.point(-0.52, 0.19, 8);
  for (const point of [headLeft, headRight]) {
    linePx(ctx, point[0], point[1], point[0], point[1] - 25, PALETTE.outline, 4);
    nativeLinePx(ctx, point[0] - 0.5, point[1] - 1.5, point[0] - 0.5, point[1] - 22.5, PALETTE.rustLight);
  }
  linePx(ctx, headLeft[0], headLeft[1] - 22, headRight[0], headRight[1] - 22, PALETTE.outline, 4);
  linePx(ctx, headLeft[0], headLeft[1] - 12, headRight[0], headRight[1] - 12, PALETTE.rustMid, 2);
  nativeLinePx(ctx, mattress.cap.left[0] + 1.5, mattress.cap.left[1] - 0.5, mattress.cap.top[0] - 1.5, mattress.cap.top[1] + 0.5, PALETTE.hostBone);
}

export function drawSouthMeasureCollapsedCulvert(ctx, cx, cy, seed) {
  const rng = rngFrom(hash2D(seed + 587, seed * 7 + 31));
  drawIsoPrism(ctx, cx, cy + 5, 64, 27, 8, {
    top: PALETTE.stoneMid,
    left: PALETTE.stoneDark,
    right: PALETTE.outline,
    outline: PALETTE.outline
  });
  px(ctx, cx - 28, cy - 35, PALETTE.outline, 57, 42);
  for (let row = 0; row < 34; row += 1) {
    const inset = Math.floor(Math.abs(16 - row) * 0.45);
    px(ctx, cx - 26 + inset, cy - 33 + row, row < 6 ? PALETTE.stoneDust : PALETTE.stoneMid, 52 - inset * 2, 1);
  }
  px(ctx, cx - 18, cy - 24, PALETTE.outline, 37, 31);
  px(ctx, cx - 15, cy - 21, PALETTE.void, 31, 28);
  px(ctx, cx - 13, cy - 18, PALETTE.stoneDark, 27, 24);
  for (let i = 0; i < 14; i += 1) {
    const x = cx - 31 + Math.floor(rng() * 63);
    const y = cy - 12 + Math.floor(rng() * 23);
    px(ctx, x - 1, y - 2, PALETTE.outline, 5, 4);
    px(ctx, x, y - 3, i % 3 ? PALETTE.stoneDust : PALETTE.rustDark, 3, 2);
  }
  linePx(ctx, cx - 15, cy - 15, cx + 16, cy + 4, PALETTE.woodDark, 4);
  drawRubbleCluster(ctx, cx + 29, cy + 8, seed + 593, 4);
  // Fine aggregate seams stay on the surviving arch and threshold stones.
  nativeLinePx(ctx, cx - 21.5, cy - 30.5, cx - 10.5, cy - 33.5, PALETTE.stoneLight);
  nativeLinePx(ctx, cx + 14.5, cy - 25.5, cx + 22.5, cy - 19.5, PALETTE.stoneDark);
  nativeLinePx(ctx, cx - 10.5, cy - 2.5, cx + 3.5, cy + 1.5, PALETTE.stoneDust);
}

export function drawSouthMeasureChainGate(ctx, cx, cy, seed, opts = {}) {
  const frame = isoFrame(cx, cy, opts.orient ?? 'se');
  const north = opts.variant === 'north';
  const rng = rngFrom(hash2D(seed + 631, seed * 23 + 29));
  const a = frame.point(-2.65, 0, 0);
  const b = frame.point(2.65, 0, 0);

  // Unequal, shouldered intake pylons make the road threshold legible from
  // across the map. Their limewash, iron cores and depth plates repeat the
  // settlement's three dominant material families at landmark scale.
  const pylons = [
    { p: a, height: north ? 78 : 87, wide: 29, gauge: true },
    { p: b, height: north ? 88 : 72, wide: 25, gauge: false }
  ];
  for (const [index, pylon] of pylons.entries()) {
    const { p, height, wide } = pylon;
    drawIsoPrism(ctx, p[0], p[1] + 2, wide + 10, 17, 11, {
      top: PALETTE.limeLight,
      left: PALETTE.limeMid,
      right: PALETTE.limeDark,
      outline: PALETTE.outline
    });
    poly(ctx, PALETTE.outline, [
      [p[0] - Math.floor(wide / 2), p[1] - 7],
      [p[0] - Math.floor(wide / 2) + 2, p[1] - height + 12],
      [p[0] - 8, p[1] - height],
      [p[0] + 7, p[1] - height + (index ? 3 : 0)],
      [p[0] + Math.floor(wide / 2), p[1] - height + 14],
      [p[0] + Math.floor(wide / 2), p[1] - 7]
    ]);
    poly(ctx, index ? PALETTE.limeDark : PALETTE.limeMid, [
      [p[0] - Math.floor(wide / 2) + 4, p[1] - 9],
      [p[0] - Math.floor(wide / 2) + 6, p[1] - height + 14],
      [p[0] - 6, p[1] - height + 4],
      [p[0] + 4, p[1] - height + 6 + (index ? 3 : 0)],
      [p[0] + Math.floor(wide / 2) - 3, p[1] - height + 16],
      [p[0] + Math.floor(wide / 2) - 3, p[1] - 9]
    ]);
    poly(ctx, PALETTE.ironDark, [
      [p[0] + 3, p[1] - 10], [p[0] + Math.floor(wide / 2) - 4, p[1] - 14],
      [p[0] + Math.floor(wide / 2) - 4, p[1] - height + 18],
      [p[0] + 4, p[1] - height + 9]
    ]);
    linePx(ctx, p[0] - Math.floor(wide / 2) + 6, p[1] - 13, p[0] - 5, p[1] - height + 8, PALETTE.limeLight, 2);
    linePx(ctx, p[0] + 5, p[1] - 14, p[0] + Math.floor(wide / 2) - 6, p[1] - height + 20, PALETTE.ironMid, 2);

    // Chipped wash exposes clay repair courses beneath the surviving face.
    for (let chip = 0; chip < 4; chip += 1) {
      const chipY = p[1] - 22 - Math.floor(rng() * Math.max(18, height - 33));
      const chipX = p[0] - Math.floor(wide / 2) + 5 + Math.floor(rng() * Math.max(4, wide - 12));
      px(ctx, chipX, chipY, PALETTE.clayDark, 3 + (chip & 1), 2);
      nativePx(ctx, chipX, chipY - 1.5, PALETTE.clayLight);
    }
    px(ctx, p[0] - 10, p[1] - height - 3, PALETTE.outline, 21, 8);
    px(ctx, p[0] - 8, p[1] - height - 4, PALETTE.ironMid, 17, 5);
    px(ctx, p[0] - 7, p[1] - height - 4, PALETTE.ironLight, 11, 1);

    const plateY = p[1] - Math.round(height * 0.58);
    px(ctx, p[0] - 7, plateY - 12, PALETTE.outline, 14, 27);
    px(ctx, p[0] - 5, plateY - 10, PALETTE.stoneDust, 10, 23);
    for (const lift of [-7, -2, 3, 8]) {
      px(ctx, p[0] - 4, plateY + lift, PALETTE.stoneDark, lift === 8 ? 7 : 4 + ((lift + index) & 2), 1);
    }
    px(ctx, p[0] - 4, plateY + (north ? 5 : 1), PALETTE.clothBlueMid, 8, 2);
  }

  // The western pylon carries the surviving lift wheel and stone
  // counterweight. This mechanical imbalance is the gate's primary profile.
  const wheelPylon = north ? b : a;
  const wheelHeight = north ? 88 : 87;
  const wheel = [wheelPylon[0] + (north ? -22 : 23), wheelPylon[1] - wheelHeight + 19];
  poly(ctx, PALETTE.outline, [
    [wheel[0] - 11, wheel[1] - 5], [wheel[0] - 5, wheel[1] - 11],
    [wheel[0] + 5, wheel[1] - 11], [wheel[0] + 11, wheel[1] - 5],
    [wheel[0] + 11, wheel[1] + 5], [wheel[0] + 5, wheel[1] + 11],
    [wheel[0] - 5, wheel[1] + 11], [wheel[0] - 11, wheel[1] + 5]
  ]);
  poly(ctx, PALETTE.ironMid, [
    [wheel[0] - 7, wheel[1] - 3], [wheel[0] - 3, wheel[1] - 7],
    [wheel[0] + 3, wheel[1] - 7], [wheel[0] + 7, wheel[1] - 3],
    [wheel[0] + 7, wheel[1] + 3], [wheel[0] + 3, wheel[1] + 7],
    [wheel[0] - 3, wheel[1] + 7], [wheel[0] - 7, wheel[1] + 3]
  ]);
  px(ctx, wheel[0] - 3, wheel[1] - 3, PALETTE.outline, 7, 7);
  nativePx(ctx, wheel[0] - 1.5, wheel[1] - 2.5, PALETTE.ironLight, 3, 2);
  const weightX = wheel[0] + (north ? -1 : 1);
  linePx(ctx, weightX, wheel[1] + 9, weightX + (north ? -3 : 3), wheel[1] + 33, PALETTE.outline, 3);
  nativeLinePx(ctx, weightX - 0.5, wheel[1] + 10.5, weightX + (north ? -3.5 : 2.5), wheel[1] + 31.5, PALETTE.rustLight);
  drawIsoPrism(ctx, weightX + (north ? -3 : 3), wheel[1] + 38, 17, 9, 18, {
    top: PALETTE.stoneDust,
    left: PALETTE.stoneMid,
    right: PALETTE.stoneDark,
    outline: PALETTE.outline
  });

  const chain = [
    [a[0], a[1] - 49],
    frame.point(-1.35, 0, 33),
    frame.point(0, 0, 24),
    frame.point(1.35, 0, 31),
    [b[0], b[1] - 45]
  ];
  for (let index = 0; index < chain.length - 1; index += 1) {
    linePx(ctx, chain[index][0], chain[index][1], chain[index + 1][0], chain[index + 1][1], PALETTE.outline, 5);
    linePx(ctx, chain[index][0], chain[index][1] - 1, chain[index + 1][0], chain[index + 1][1] - 1, PALETTE.rustLight, 2);
  }
  for (const t of [-2.2, -1.65, -1.1, -0.55, 0, 0.55, 1.1, 1.65, 2.2]) {
    const h = 24 + Math.round(Math.abs(t) * 8.3) + (t > 0 ? -2 : 1);
    const p = frame.point(t, 0, h);
    px(ctx, p[0] - 2, p[1] - 2, PALETTE.outline, 5, 5);
    px(ctx, p[0] - 1, p[1] - 1, PALETTE.rustMid, 3, 3);
  }
  const board = frame.point(0, 0, 55);
  poly(ctx, PALETTE.outline, [
    [board[0] - 18, board[1] - 9], [board[0] + 15, board[1] - 7],
    [board[0] + 18, board[1] + 8], [board[0] - 15, board[1] + 10]
  ]);
  poly(ctx, north ? PALETTE.ironDark : PALETTE.clayDark, [
    [board[0] - 15, board[1] - 6], [board[0] + 12, board[1] - 4],
    [board[0] + 14, board[1] + 5], [board[0] - 12, board[1] + 7]
  ]);
  px(ctx, board[0] - 10, board[1] - 2, north ? PALETTE.clothRed : PALETTE.clothTan, 19, 2);
  px(ctx, board[0] - 7, board[1] + 2, PALETTE.ironLight, 14, 1);
  nativePx(ctx, board[0] - 13.5, board[1] - 4.5, PALETTE.hostGold);
  nativePx(ctx, board[0] + 11.5, board[1] + 3.5, PALETTE.hostGold);
  // Fine chain highlights follow the long sag rather than forming detached
  // sparkles, and the notice board retains one material scratch per variant.
  nativeLinePx(ctx, chain[1][0], chain[1][1] - 1.5, chain[2][0], chain[2][1] - 1.5, PALETTE.rustLight);
  nativeLinePx(ctx, chain[2][0], chain[2][1] - 1.5, chain[3][0], chain[3][1] - 1.5, PALETTE.rustLight);
  nativeLinePx(ctx, board[0] - 9.5, board[1] - 3.5, board[0] + 6.5, board[1] - 2.5, north ? PALETTE.stoneDust : PALETTE.clayLight);
}
