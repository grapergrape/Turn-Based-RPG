import { PALETTE } from '../palette.js';
import { TILE_WIDTH, TILE_HEIGHT, WALL_HEIGHT } from '../renderConfig.js';
import { drawChaffScatter } from './propsChapel.js';
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

export function drawFarmFence(ctx, cx, cy, seed, opts = {}) {
  const frame = isoFrame(cx, cy, opts.orient ?? 'se');
  const a = frame.point(-0.42, 0, 0);
  const b = frame.point(0.42, 0, 0);
  const posts = [a, b];
  drawShadowBlob(ctx, cx, cy + 2, 42, 10);
  for (const p of posts) {
    px(ctx, p[0] - 3, p[1] - 24, PALETTE.outline, 7, 27);
    px(ctx, p[0] - 2, p[1] - 23, PALETTE.woodDark, 5, 24);
    px(ctx, p[0] - 2, p[1] - 23, PALETTE.woodMid, 2, 21);
    px(ctx, p[0] - 2, p[1] - 28, PALETTE.outline, 7, 6);
    px(ctx, p[0] - 1, p[1] - 27, PALETTE.stoneDust, 5, 3);
  }
  for (const lift of [12, 20]) {
    linePx(ctx, a[0], a[1] - lift, b[0], b[1] - lift + ((seed + lift) & 1), PALETTE.outline, 5);
    linePx(ctx, a[0], a[1] - lift - 1, b[0], b[1] - lift - 1 + ((seed + lift) & 1), PALETTE.woodMid, 2);
    linePx(ctx, a[0], a[1] - lift + 1, b[0], b[1] - lift + 1 + ((seed + lift) & 1), PALETTE.woodDark, 1);
  }
  if ((seed & 3) === 0) {
    linePx(ctx, cx - 8, cy - 5, cx + 7, cy - 28, PALETTE.outline, 3);
    linePx(ctx, cx - 7, cy - 6, cx + 6, cy - 27, PALETTE.woodDark, 1);
  }
}
const FARM_VARIANTS = new Set(['farmhouse', 'barn', 'storage-shed', 'grain-shed', 'tool-shed']);

function normalizeFarmVariant(variant) {
  return FARM_VARIANTS.has(variant) ? variant : 'farmhouse';
}

const FARM_BUILDING_STYLES = {
  farmhouse: {
    wallH: 44,
    roofLift: 12,
    roofW: 14,
    roofH: 10,
    wallLit: PALETTE.woodMid,
    wallShade: PALETTE.woodDark,
    trim: PALETTE.woodLight,
    roof: PALETTE.rustMid,
    roofShade: PALETTE.rustDark,
    roofLight: PALETTE.rustLight
  },
  barn: {
    wallH: 50,
    roofLift: 15,
    roofW: 24,
    roofH: 14,
    wallLit: PALETTE.woodDark,
    wallShade: PALETTE.outline,
    trim: PALETTE.rustLight,
    roof: PALETTE.rustDark,
    roofShade: PALETTE.woodDark,
    roofLight: PALETTE.rustMid
  },
  'storage-shed': {
    wallH: 35,
    roofLift: 9,
    roofW: 8,
    roofH: 6,
    wallLit: PALETTE.woodMid,
    wallShade: PALETTE.stoneDark,
    trim: PALETTE.rustLight,
    roof: PALETTE.stoneDark,
    roofShade: PALETTE.outline,
    roofLight: PALETTE.rustMid
  },
  'grain-shed': {
    wallH: 39,
    roofLift: 13,
    roofW: 6,
    roofH: 16,
    wallLit: PALETTE.clothTan,
    wallShade: PALETTE.woodMid,
    trim: PALETTE.stoneDust,
    roof: PALETTE.woodDark,
    roofShade: PALETTE.outline,
    roofLight: PALETTE.woodMid
  },
  'tool-shed': {
    wallH: 37,
    roofLift: 8,
    roofW: 2,
    roofH: 4,
    wallLit: PALETTE.woodDark,
    wallShade: PALETTE.stoneDark,
    trim: PALETTE.rustDark,
    roof: PALETTE.rustDark,
    roofShade: PALETTE.outline,
    roofLight: PALETTE.rustMid
  }
};

function farmBuildingStyle(variant) {
  return FARM_BUILDING_STYLES[normalizeFarmVariant(variant)];
}

function drawFarmBuildingVariantMarks(ctx, cx, cy, seed, variant, connected, wallTop, base, roof, roofLift) {
  const faceFront = !connected.yPlus ? faceTools(ctx, wallTop.left, wallTop.bottom, base.bottom, base.left) : null;
  const faceSide = !connected.xPlus ? faceTools(ctx, wallTop.bottom, wallTop.right, base.right, base.bottom) : null;

  if (variant === 'farmhouse') {
    if (faceFront) {
      faceFront.rect(0.2, 0.28, 0.42, 0.5, PALETTE.outline);
      faceFront.rect(0.24, 0.31, 0.38, 0.47, PALETTE.void);
      faceFront.line(0.16, 0.3, 0.2, 0.51, PALETTE.woodLight, 1);
      faceFront.line(0.43, 0.3, 0.47, 0.51, PALETTE.woodDark, 1);
    }
    if (faceSide) {
      faceSide.rect(0.5, 0.3, 0.7, 0.5, PALETTE.outline);
      faceSide.rect(0.54, 0.33, 0.67, 0.47, PALETTE.void);
      faceSide.line(0.49, 0.31, 0.49, 0.5, PALETTE.woodMid, 1);
      faceSide.line(0.71, 0.31, 0.71, 0.5, PALETTE.woodDark, 1);
    }
    if (!connected.xMinus && !connected.yMinus) {
      px(ctx, cx - 7, cy - roofLift - 30, PALETTE.outline, 12, 19);
      px(ctx, cx - 5, cy - roofLift - 29, PALETTE.stoneDark, 8, 17);
      px(ctx, cx - 5, cy - roofLift - 29, PALETTE.stoneDust, 2, 15);
      px(ctx, cx - 8, cy - roofLift - 32, PALETTE.outline, 14, 4);
      px(ctx, cx - 6, cy - roofLift - 31, PALETTE.rustDark, 10, 2);
    }
    return;
  }

  if (variant === 'barn') {
    if (faceFront) {
      faceFront.rect(0.35, 0.18, 0.64, 0.38, PALETTE.outline);
      faceFront.rect(0.39, 0.22, 0.6, 0.34, PALETTE.void);
      faceFront.line(0.38, 0.28, 0.61, 0.28, PALETTE.rustLight, 1);
      faceFront.line(0.5, 0.21, 0.5, 0.35, PALETTE.rustDark, 1);
      faceFront.line(0.08, 0.82, 0.92, 0.82, PALETTE.outline, 2);
      faceFront.line(0.1, 0.79, 0.9, 0.79, PALETTE.rustMid, 1);
    }
    if (faceSide) faceSide.line(0.14, 0.2, 0.86, 0.64, PALETTE.rustDark, 1);
    return;
  }

  if (variant === 'storage-shed') {
    for (const face of [faceFront, faceSide].filter(Boolean)) {
      face.line(0.1, 0.25, 0.9, 0.25, PALETTE.outline, 2);
      face.line(0.1, 0.55, 0.9, 0.55, PALETTE.outline, 2);
      face.line(0.14, 0.2, 0.82, 0.78, PALETTE.rustDark, 1);
      face.line(0.82, 0.2, 0.14, 0.78, PALETTE.woodDark, 1);
    }
    return;
  }

  if (variant === 'grain-shed') {
    for (const face of [faceFront, faceSide].filter(Boolean)) {
      for (const u of [0.18, 0.28, 0.38, 0.48, 0.58, 0.68, 0.78, 0.88]) {
        face.line(u, 0.07, u, 0.95, PALETTE.woodDark, 1);
      }
      face.rect(0.52, 0.18, 0.75, 0.33, PALETTE.outline);
      face.rect(0.56, 0.2, 0.72, 0.3, PALETTE.void);
      face.line(0.05, 0.92, 0.96, 0.92, PALETTE.stoneDust, 2);
    }
    if (faceFront) {
      const chute = faceFront.point(0.68, 0.62);
      px(ctx, chute[0] - 4, chute[1] - 2, PALETTE.outline, 13, 7);
      px(ctx, chute[0] - 3, chute[1] - 1, PALETTE.woodDark, 10, 4);
    }
    return;
  }

  for (const face of [faceFront, faceSide].filter(Boolean)) {
    face.rect(0.2, 0.26, 0.48, 0.44, PALETTE.outline);
    face.rect(0.24, 0.29, 0.45, 0.41, PALETTE.stoneDark);
    face.line(0.15, 0.68, 0.42, 0.56, PALETTE.rustLight, 1);
    face.line(0.5, 0.7, 0.82, 0.5, PALETTE.rustDark, 1);
    face.line(0.36, 0.16, 0.7, 0.28, PALETTE.woodDark, 1);
  }
}

export function drawFarmBuildingBlock(ctx, cx, cy, seed, opts = {}) {
  const connected = opts.connected ?? {};
  const variant = normalizeFarmVariant(opts.variant);
  const style = farmBuildingStyle(variant);
  const wallH = style.wallH;
  const roofLift = wallH + style.roofLift;
  const base = diamond(cx, cy, TILE_WIDTH, TILE_HEIGHT);
  const wallTop = diamond(cx, cy - wallH, TILE_WIDTH, TILE_HEIGHT);
  const roof = diamond(cx, cy - roofLift, TILE_WIDTH + style.roofW, TILE_HEIGHT + style.roofH);

  drawShadowBlob(ctx, cx, cy + 5, 66, 22);

  const drawFaceDetail = (face, salt) => {
    const h = hash2D(seed + salt, seed * 5 + salt);
    if (h % 7 === 0) {
      face.rect(0.34, 0.28, 0.78, 0.58, PALETTE.outline);
      face.rect(0.38, 0.31, 0.74, 0.55, PALETTE.woodDark);
      face.line(0.4, 0.33, 0.72, 0.33, PALETTE.woodMid, 1);
      face.line(0.4, 0.44, 0.72, 0.44, PALETTE.outline, 1);
      face.line(0.44, 0.32, 0.65, 0.55, PALETTE.woodLight, 1);
      face.line(0.66, 0.32, 0.45, 0.55, PALETTE.woodDark, 1);
      return;
    }
    if (h % 3 === 0) {
      face.rect(0.32, 0.28, 0.64, 0.5, PALETTE.outline);
      face.rect(0.37, 0.32, 0.59, 0.46, PALETTE.void);
      face.line(0.37, 0.33, 0.59, 0.33, PALETTE.stoneDust, 1);
      face.line(0.48, 0.33, 0.48, 0.46, PALETTE.woodDark, 1);
      return;
    }
    if (h % 5 === 0) {
      face.line(0.2, 0.2, 0.76, 0.76, PALETTE.outline, 2);
      face.line(0.22, 0.22, 0.74, 0.74, PALETTE.woodDark, 1);
    }
  };

  if (!connected.yPlus) {
    poly(ctx, style.wallLit, [wallTop.left, wallTop.bottom, base.bottom, base.left]);
    const face = faceTools(ctx, wallTop.left, wallTop.bottom, base.bottom, base.left);
    for (const u of [0.18, 0.36, 0.55, 0.74, 0.9]) face.line(u, 0.06, u, 0.97, style.wallShade, 1);
    face.line(0.04, 0.22, 0.94, 0.22, style.trim, 1);
    face.line(0.04, 0.52, 0.94, 0.52, style.wallShade, 1);
    face.line(0.04, 0.78, 0.94, 0.78, style.wallShade, 1);
    drawFaceDetail(face, 31);
  }

  if (!connected.xPlus) {
    poly(ctx, style.wallShade, [wallTop.bottom, wallTop.right, base.right, base.bottom]);
    const face = faceTools(ctx, wallTop.bottom, wallTop.right, base.right, base.bottom);
    for (const u of [0.2, 0.4, 0.6, 0.8]) face.line(u, 0.08, u, 0.96, PALETTE.stoneDark, 1);
    face.line(0.07, 0.24, 0.91, 0.24, style.trim, 1);
    face.line(0.07, 0.55, 0.91, 0.55, PALETTE.outline, 1);
    face.line(0.07, 0.8, 0.91, 0.8, PALETTE.outline, 1);
    drawFaceDetail(face, 43);
  }

  // Shared roof edges are omitted so connected cells read as one structure.
  poly(ctx, style.roof, [roof.top, roof.right, roof.bottom, roof.left]);

  const shadeA = mixPoint(roof.top, roof.right, 0.78);
  const shadeB = mixPoint(roof.bottom, roof.right, 0.78);
  const shadeC = mixPoint(roof.bottom, roof.left, 0.16);
  if (!connected.xPlus || !connected.yPlus) {
    poly(ctx, style.roofShade, [shadeA, roof.right, roof.bottom, shadeC]);
    linePx(ctx, shadeA[0], shadeA[1], shadeB[0], shadeB[1], style.wallShade, 1);
  }

  for (const t of [0.28, 0.5, 0.72]) {
    const a = mixPoint(roof.left, roof.top, t);
    const b = mixPoint(roof.bottom, roof.right, t);
    linePx(ctx, a[0], a[1], b[0], b[1], (seed + Math.floor(t * 100)) & 1 ? style.wallShade : style.roofLight, 1);
  }
  for (const t of [0.36, 0.64]) {
    const a = mixPoint(roof.top, roof.right, t);
    const b = mixPoint(roof.left, roof.bottom, t);
    linePx(ctx, a[0], a[1], b[0], b[1], style.roofShade, 1);
  }

  if (!connected.yMinus) {
    linePx(ctx, roof.top[0], roof.top[1], roof.left[0], roof.left[1], PALETTE.outline, 2);
    linePx(ctx, roof.top[0] - 1, roof.top[1], roof.left[0] - 1, roof.left[1], style.roofLight, 1);
  }
  if (!connected.xMinus) {
    linePx(ctx, roof.top[0], roof.top[1], roof.right[0], roof.right[1], PALETTE.outline, 2);
    linePx(ctx, roof.top[0] + 1, roof.top[1], roof.right[0] + 1, roof.right[1], style.roofLight, 1);
  }
  if (!connected.yPlus) {
    linePx(ctx, roof.left[0], roof.left[1], roof.bottom[0], roof.bottom[1], PALETTE.outline, 2);
    linePx(ctx, roof.left[0], roof.left[1] + 2, roof.bottom[0], roof.bottom[1] + 2, style.wallShade, 2);
  }
  if (!connected.xPlus) {
    linePx(ctx, roof.bottom[0], roof.bottom[1], roof.right[0], roof.right[1], PALETTE.outline, 2);
    linePx(ctx, roof.bottom[0], roof.bottom[1] + 2, roof.right[0], roof.right[1] + 2, style.wallShade, 2);
  }

  for (const off of [-22, -9, 5, 18]) {
    const jitter = ((seed + off) & 3) - 1;
    px(ctx, cx + off, cy - roofLift - 2 + jitter, style.roofLight, 5, 1);
    px(ctx, cx + off + 2, cy - roofLift + 7 + jitter, style.wallShade, 7, 1);
  }
  drawNoisePixels(ctx, cx - 33, cy - roofLift - 14, 66, 36, [style.roofShade, style.wallShade], 0.018, seed);
  drawFarmBuildingVariantMarks(ctx, cx, cy, seed, variant, connected, wallTop, base, roof, roofLift);
}

const FARM_DOOR_STYLES = {
  farmhouse: {
    u0: 0.28,
    u1: 0.72,
    v0: 0.36,
    floorWidth: 34,
    floorHeight: 57,
    base: PALETTE.woodMid,
    shade: PALETTE.woodDark,
    trim: PALETTE.woodLight,
    metal: PALETTE.rustLight
  },
  barn: {
    u0: 0.07,
    u1: 0.93,
    v0: 0.24,
    floorWidth: 54,
    floorHeight: 67,
    base: PALETTE.woodDark,
    shade: PALETTE.outline,
    trim: PALETTE.rustMid,
    metal: PALETTE.rustLight
  },
  'storage-shed': {
    u0: 0.22,
    u1: 0.78,
    v0: 0.38,
    floorWidth: 36,
    floorHeight: 51,
    base: PALETTE.woodMid,
    shade: PALETTE.stoneDark,
    trim: PALETTE.rustLight,
    metal: PALETTE.hostGold
  },
  'grain-shed': {
    u0: 0.2,
    u1: 0.8,
    v0: 0.34,
    floorWidth: 37,
    floorHeight: 55,
    base: PALETTE.clothTan,
    shade: PALETTE.woodMid,
    trim: PALETTE.stoneDust,
    metal: PALETTE.rustLight
  },
  'tool-shed': {
    u0: 0.31,
    u1: 0.69,
    v0: 0.4,
    floorWidth: 30,
    floorHeight: 52,
    base: PALETTE.woodDark,
    shade: PALETTE.stoneDark,
    trim: PALETTE.rustDark,
    metal: PALETTE.rustLight
  }
};

function farmDoorStyle(variant) {
  return FARM_DOOR_STYLES[normalizeFarmVariant(variant)];
}

function drawFarmWallDoor(ctx, cx, cy, seed, opts = {}) {
  const locked = Boolean(opts.locked);
  const unlocked = Boolean(opts.unlocked || opts.revealed);
  const variant = normalizeFarmVariant(opts.variant);
  const style = farmDoorStyle(variant);
  const wallPlane = opts.wallPlane === 'se' ? 'se' : 'sw';
  const wallFace = wallRunFace(ctx, cx, cy, { plane: wallPlane, side: 'near', span: 1 });
  const u0 = style.u0;
  const u1 = style.u1;
  const v0 = style.v0;
  const v1 = 0.985;
  const face = faceTools(
    ctx,
    wallFace.point(u0, v0),
    wallFace.point(u1, v0),
    wallFace.point(u1, v1),
    wallFace.point(u0, v1)
  );

  face.rect(0, 0, 1, 1, PALETTE.outline);
  face.rect(0.045, 0.045, 0.955, 0.97, PALETTE.void);
  face.rect(0.09, 0.08, 0.91, 0.94, style.shade);
  face.rect(0.14, 0.1, 0.86, 0.91, style.base);
  face.rect(0.58, 0.1, 0.86, 0.91, style.shade);
  face.line(0.04, 0.035, 0.96, 0.035, style.trim, 2);
  face.line(0.04, 0.97, 0.96, 0.97, PALETTE.outline, 3);
  face.line(0.06, 0.07, 0.06, 0.94, style.trim, 1);
  face.line(0.94, 0.07, 0.94, 0.94, PALETTE.outline, 2);

  const plankLines = variant === 'grain-shed'
    ? [0.18, 0.29, 0.4, 0.51, 0.62, 0.73, 0.84]
    : variant === 'tool-shed'
    ? [0.35, 0.53, 0.7]
    : [0.27, 0.43, 0.59, 0.75];
  for (const u of plankLines) {
    face.line(u, 0.12, u, 0.89, PALETTE.outline, 1);
    face.line(u + 0.025, 0.13, u + 0.025, 0.88, style.shade, 1);
  }
  for (const v of variant === 'barn' ? [0.24, 0.48, 0.72] : [0.28, 0.62]) {
    face.line(0.1, v, 0.9, v, PALETTE.outline, 3);
    face.line(0.14, v - 0.02, 0.86, v - 0.02, style.trim, 1);
    face.line(0.14, v + 0.03, 0.86, v + 0.03, style.shade, 1);
  }

  if (variant === 'barn') {
    face.line(0.5, 0.11, 0.5, 0.91, PALETTE.outline, 3);
    face.line(0.12, 0.17, 0.48, 0.42, PALETTE.outline, 3);
    face.line(0.15, 0.18, 0.46, 0.41, style.trim, 1);
    face.line(0.88, 0.17, 0.52, 0.42, PALETTE.outline, 3);
    face.line(0.85, 0.18, 0.54, 0.41, style.trim, 1);
    face.line(0.12, 0.83, 0.48, 0.58, PALETTE.outline, 3);
    face.line(0.88, 0.83, 0.52, 0.58, PALETTE.outline, 3);
    face.line(0.04, 0.02, 0.96, 0.02, PALETTE.rustLight, 2);
  } else if (variant === 'farmhouse') {
    face.rect(0.2, 0.18, 0.8, 0.86, PALETTE.outline);
    face.rect(0.24, 0.22, 0.76, 0.82, style.base);
    face.line(0.5, 0.22, 0.5, 0.82, style.shade, 1);
    face.line(0.27, 0.5, 0.73, 0.5, PALETTE.outline, 1);
    face.rect(0.32, 0.28, 0.45, 0.42, PALETTE.void);
    face.rect(0.55, 0.28, 0.68, 0.42, PALETTE.void);
  } else if (variant === 'storage-shed') {
    face.line(0.14, 0.18, 0.86, 0.77, PALETTE.outline, 2);
    face.line(0.84, 0.18, 0.16, 0.77, PALETTE.outline, 2);
    face.line(0.15, 0.24, 0.85, 0.24, style.trim, 1);
    face.line(0.15, 0.72, 0.85, 0.72, style.shade, 1);
  } else if (variant === 'grain-shed') {
    face.rect(0.55, 0.16, 0.74, 0.29, PALETTE.outline);
    face.rect(0.58, 0.18, 0.71, 0.27, PALETTE.void);
    face.line(0.56, 0.62, 0.76, 0.57, PALETTE.outline, 2);
    face.line(0.58, 0.6, 0.74, 0.56, style.shade, 1);
  } else {
    face.line(0.18, 0.2, 0.44, 0.32, PALETTE.rustLight, 1);
    face.line(0.26, 0.7, 0.58, 0.54, PALETTE.rustDark, 1);
    face.line(0.12, 0.84, 0.34, 0.76, PALETTE.stoneDust, 1);
  }

  const pullPoint = variant === 'storage-shed' ? [0.5, 0.56] : variant === 'barn' ? [0.49, 0.55] : [0.78, 0.54];
  const pull = face.point(pullPoint[0], pullPoint[1]);
  if (variant === 'storage-shed') {
    px(ctx, pull[0] - 5, pull[1] - 5, PALETTE.outline, 10, 10);
    px(ctx, pull[0] - 3, pull[1] - 3, style.metal, 6, 6);
    px(ctx, pull[0] - 1, pull[1] - 1, PALETTE.void, 3, 3);
  } else {
    px(ctx, pull[0] - 4, pull[1] - 3, PALETTE.outline, 8, 6);
    px(ctx, pull[0] - 3, pull[1] - 2, locked && !unlocked ? PALETTE.rustDark : style.metal, 6, 4);
    px(ctx, pull[0], pull[1] - 1, PALETTE.hostGold, 2, 2);
  }

  if (locked && !unlocked) {
    face.line(0.59, 0.56, 0.89, 0.56, PALETTE.outline, 3);
    face.line(0.6, 0.54, 0.88, 0.54, PALETTE.stoneDust, 1);
    const lock = face.point(0.72, 0.66);
    px(ctx, lock[0] - 6, lock[1] - 4, PALETTE.outline, 12, 9);
    px(ctx, lock[0] - 4, lock[1] - 3, PALETTE.rustDark, 8, 6);
    px(ctx, lock[0] - 1, lock[1] - 2, PALETTE.rustLight, 3, 2);
  } else if (unlocked) {
    face.line(0.9, 0.16, 0.9, 0.87, PALETTE.void, 2);
    face.line(0.87, 0.19, 0.87, 0.84, PALETTE.stoneDark, 1);
  }

  const sillA = wallFace.point(u0 - 0.08, 1);
  const sillB = wallFace.point(u1 + 0.08, 1);
  linePx(ctx, sillA[0], sillA[1], sillB[0], sillB[1], PALETTE.outline, 3);
  linePx(ctx, sillA[0], sillA[1] - 1, sillB[0], sillB[1] - 1, PALETTE.stoneDark, 1);
  if (variant === 'grain-shed' || variant === 'barn') {
    drawChaffScatter(ctx, cx, Math.max(sillA[1], sillB[1]) + 2, seed + 19);
  }
  drawNoisePixels(ctx, Math.min(sillA[0], sillB[0]) - 3, Math.min(sillA[1], sillB[1]) - 47, Math.abs(sillB[0] - sillA[0]) + 6, 48, [style.shade, PALETTE.rustDark], 0.018, seed);
}

export function drawFarmDoor(ctx, cx, cy, seed, opts = {}) {
  if (opts.wallPlane === 'se' || opts.wallPlane === 'sw') {
    drawFarmWallDoor(ctx, cx, cy, seed, opts);
    return;
  }

  const locked = Boolean(opts.locked);
  const unlocked = Boolean(opts.unlocked || opts.revealed);
  const variant = normalizeFarmVariant(opts.variant);
  const style = farmDoorStyle(variant);
  const lean = (seed & 1) ? 1 : -1;
  const left = cx - Math.floor(style.floorWidth / 2) + lean;
  const right = cx + Math.floor(style.floorWidth / 2) + lean;
  const top = cy - style.floorHeight;
  const bottom = cy + 2;

  drawShadowBlob(ctx, cx, cy + 4, variant === 'barn' ? 56 : 42, 14);
  drawIsoDiamond(ctx, cx, cy + 2, style.floorWidth + 3, 12, PALETTE.outline);
  drawIsoDiamond(ctx, cx, cy, style.floorWidth - 2, 9, PALETTE.stoneDark);

  px(ctx, left - 3, top - 3, PALETTE.outline, right - left + 6, bottom - top + 7);
  px(ctx, left, top, style.base, right - left + 1, bottom - top + 1);
  px(ctx, cx + 1 + lean, top, style.shade, right - cx - lean, bottom - top + 1);
  px(ctx, left + 2, top + 2, style.trim, 4, bottom - top - 2);

  const verticals = variant === 'barn'
    ? [left + 9, left + 18, cx + lean, right - 18, right - 9]
    : variant === 'grain-shed'
    ? [left + 6, left + 12, left + 18, right - 12, right - 6]
    : [left + 8, cx + lean, right - 8];
  for (const x of verticals) {
    px(ctx, x, top + 3, PALETTE.outline, 2, bottom - top - 4);
    px(ctx, x + 1, top + 4, style.shade, 1, bottom - top - 6);
  }
  for (const y of variant === 'barn' ? [top + 15, top + 34, top + 52] : [top + 16, top + Math.max(34, style.floorHeight - 17)]) {
    px(ctx, left - 1, y, PALETTE.outline, right - left + 3, 4);
    px(ctx, left + 1, y + 1, style.shade, right - left - 1, 1);
    px(ctx, left + 1, y + 2, style.trim, Math.max(4, right - left - 16), 1);
  }
  if (variant === 'barn') {
    linePx(ctx, left + 4, top + 12, cx - 3, top + 31, PALETTE.outline, 3);
    linePx(ctx, right - 4, top + 12, cx + 3, top + 31, PALETTE.outline, 3);
    linePx(ctx, left + 4, top + 56, cx - 3, top + 38, PALETTE.outline, 3);
    linePx(ctx, right - 4, top + 56, cx + 3, top + 38, PALETTE.outline, 3);
    px(ctx, left - 5, top - 7, PALETTE.outline, right - left + 10, 5);
    px(ctx, left - 2, top - 6, PALETTE.rustLight, right - left + 4, 2);
  } else if (variant === 'storage-shed') {
    linePx(ctx, left + 3, top + 11, right - 4, top + 45, PALETTE.outline, 2);
    linePx(ctx, right - 4, top + 12, left + 4, top + 45, PALETTE.outline, 2);
  } else if (variant === 'grain-shed') {
    px(ctx, right - 14, top + 10, PALETTE.outline, 9, 7);
    px(ctx, right - 12, top + 12, PALETTE.void, 5, 3);
    drawChaffScatter(ctx, cx, cy + 5, seed + 23);
  } else if (variant === 'tool-shed') {
    linePx(ctx, left + 7, top + 14, right - 8, top + 22, PALETTE.rustLight, 1);
    linePx(ctx, left + 4, top + 42, right - 5, top + 32, PALETTE.rustDark, 1);
    linePx(ctx, left + 11, top + 50, right - 9, top + 44, PALETTE.stoneDust, 1);
  } else {
    px(ctx, left + 8, top + 14, PALETTE.outline, 8, 10);
    px(ctx, left + 10, top + 16, PALETTE.void, 4, 6);
    px(ctx, right - 17, top + 14, PALETTE.outline, 8, 10);
    px(ctx, right - 15, top + 16, PALETTE.void, 4, 6);
  }

  for (const y of [top + 12, top + 47]) {
    px(ctx, left - 6, y, PALETTE.outline, 8, 7);
    px(ctx, left - 5, y + 1, style.trim, 5, 4);
  }

  const pullX = variant === 'storage-shed' ? cx + lean : right - 9;
  const pullY = variant === 'storage-shed' ? top + 31 : top + Math.min(35, style.floorHeight - 19);
  if (variant === 'storage-shed') {
    px(ctx, pullX - 5, pullY - 5, PALETTE.outline, 10, 10);
    px(ctx, pullX - 3, pullY - 3, style.metal, 6, 6);
    px(ctx, pullX - 1, pullY - 1, PALETTE.void, 3, 3);
  } else {
    px(ctx, pullX, pullY, PALETTE.outline, 9, 8);
    px(ctx, pullX + 1, pullY + 1, locked && !unlocked ? PALETTE.rustDark : style.metal, 6, 5);
    px(ctx, pullX + 3, pullY + 3, PALETTE.hostGold, 2, 2);
  }
  if (locked && !unlocked) {
    linePx(ctx, right - 14, top + 38, right - 3, top + 38, PALETTE.outline, 3);
    linePx(ctx, right - 13, top + 37, right - 4, top + 37, PALETTE.stoneDust, 1);
    px(ctx, right - 12, top + 41, PALETTE.outline, 16, 11);
    px(ctx, right - 10, top + 42, PALETTE.rustDark, 12, 7);
    px(ctx, right - 7, top + 43, PALETTE.rustLight, 4, 2);
  } else if (unlocked) {
    px(ctx, right - 5, top + 42, PALETTE.void, 2, 13);
    px(ctx, right - 3, top + 43, PALETTE.stoneDark, 2, 11);
  }

  drawNoisePixels(ctx, left, top, right - left, bottom - top, [style.shade, PALETTE.rustDark], 0.025, seed);
}

function drawFarmWheel(ctx, cx, cy, radius = 7, opts = {}) {
  const rows = radius >= 9
    ? [
      [-9, 7], [-8, 11], [-7, 15], [-6, 17], [-5, 19], [-4, 21], [-3, 21],
      [-2, 21], [-1, 21], [0, 21], [1, 21], [2, 21], [3, 19], [4, 17],
      [5, 15], [6, 11], [7, 7], [8, 5]
    ]
    : radius >= 7
    ? [
      [-7, 5], [-6, 9], [-5, 13], [-4, 15], [-3, 17], [-2, 17], [-1, 17],
      [0, 17], [1, 17], [2, 15], [3, 15], [4, 13], [5, 9], [6, 5]
    ]
    : [
      [-5, 4], [-4, 8], [-3, 11], [-2, 13], [-1, 13],
      [0, 13], [1, 11], [2, 11], [3, 8], [4, 4]
    ];
  const rim = opts.rim ?? PALETTE.rustDark;
  const lit = opts.lit ?? PALETTE.rustLight;
  const shade = opts.shade ?? PALETTE.woodDark;
  const hub = opts.hub ?? PALETTE.woodMid;

  for (const [dy, w] of rows) {
    const left = cx - Math.floor(w / 2);
    px(ctx, left, cy + dy, PALETTE.outline, w, 1);
    if (w > 5) {
      const fill = dy < -3 ? lit : dy > 2 ? shade : rim;
      px(ctx, left + 1, cy + dy, fill, w - 2, 1);
    }
  }

  const spoke = Math.max(4, radius - 2);
  for (const [sx, sy] of [[-spoke, -spoke + 1], [spoke, -spoke + 1], [-spoke, spoke - 1], [spoke, spoke - 1]]) {
    linePx(ctx, cx, cy, cx + sx, cy + sy, PALETTE.outline, 2);
    linePx(ctx, cx, cy, cx + sx, cy + sy, hub, 1);
  }
  px(ctx, cx - 4, cy - 4, PALETTE.outline, 8, 8);
  px(ctx, cx - 2, cy - 2, hub, 4, 4);
  px(ctx, cx - 1, cy - 1, PALETTE.void, 2, 2);
}

export function drawFieldCart(ctx, cx, cy, seed, opts = {}) {
  const frame = isoFrame(cx, cy, opts.orient ?? 'se');
  drawShadowBlob(ctx, cx, cy + 5, 54, 18);
  const box = orientedBox(ctx, frame, 0.68, 0.36, 12, {
    top: PALETTE.woodLight,
    lit: PALETTE.woodMid,
    shade: PALETTE.woodDark,
    outline: PALETTE.outline
  });
  for (const lb of [-0.18, 0.02, 0.2]) {
    const a = frame.point(-0.34, lb, 18);
    const b = frame.point(0.34, lb, 18);
    linePx(ctx, a[0], a[1], b[0], b[1], PALETTE.outline, 2);
    linePx(ctx, a[0], a[1] - 1, b[0], b[1] - 1, lb < 0 ? PALETTE.woodLight : PALETTE.woodDark, 1);
  }
  for (const la of [-0.27, 0, 0.27]) {
    const top = frame.point(la, -0.2, 22);
    const bot = frame.point(la, 0.2, 11);
    linePx(ctx, top[0], top[1], bot[0], bot[1], PALETTE.outline, 2);
    linePx(ctx, top[0], top[1], bot[0], bot[1], PALETTE.woodMid, 1);
  }
  const leftWheel = frame.point(-0.34, 0.24, 1);
  const rightWheel = frame.point(0.34, 0.24, 1);
  const axleA = frame.point(-0.45, 0.24, 7);
  const axleB = frame.point(0.45, 0.24, 7);
  linePx(ctx, axleA[0], axleA[1], axleB[0], axleB[1], PALETTE.outline, 4);
  linePx(ctx, axleA[0], axleA[1] - 1, axleB[0], axleB[1] - 1, PALETTE.woodDark, 2);
  drawFarmWheel(ctx, leftWheel[0], leftWheel[1] - 2, 8);
  drawFarmWheel(ctx, rightWheel[0], rightWheel[1] - 2, 8);
  const tongueA = frame.point(0.42, -0.12, 8);
  const tongueB = frame.point(0.78, -0.12, 2);
  linePx(ctx, tongueA[0], tongueA[1], tongueB[0], tongueB[1], PALETTE.outline, 4);
  linePx(ctx, tongueA[0], tongueA[1], tongueB[0], tongueB[1], PALETTE.woodMid, 2);
  const towRing = frame.point(0.84, -0.12, 2);
  drawFarmWheel(ctx, towRing[0], towRing[1], 5, {
    rim: PALETTE.woodDark,
    lit: PALETTE.woodMid,
    shade: PALETTE.outline,
    hub: PALETTE.rustDark
  });
  px(ctx, box.cap.left[0] + 2, box.cap.left[1] - 1, PALETTE.stoneDust, 18, 2);
  drawNoisePixels(ctx, cx - 22, cy - 18, 44, 26, [PALETTE.rustDark, PALETTE.stoneDark], 0.035, seed);
}

export function drawHayRick(ctx, cx, cy, seed) {
  const rng = rngFrom(hash2D(seed + 83, seed * 5 + 21));
  drawShadowBlob(ctx, cx, cy + 4, 42, 15);
  for (let row = 0; row < 18; row += 1) {
    const t = row / 17;
    const half = Math.round(7 + Math.sin(t * Math.PI) * 16);
    const y = cy - 18 + row;
    px(ctx, cx - half - 1, y, PALETTE.outline, half * 2 + 2, 1);
    px(ctx, cx - half, y, row < 4 ? PALETTE.hostBone : PALETTE.clothTan, half, 1);
    px(ctx, cx, y, row < 5 ? PALETTE.clothTan : PALETTE.hostGold, half, 1);
    if (row % 4 === 0) px(ctx, cx - half + 3, y, PALETTE.woodDark, Math.max(3, half * 2 - 6), 1);
  }
  for (let i = 0; i < 10; i += 1) {
    const x = cx - 18 + Math.floor(rng() * 37);
    const y = cy - 17 + Math.floor(rng() * 19);
    px(ctx, x, y, rng() < 0.5 ? PALETTE.woodDark : PALETTE.stoneDust, 2, 1);
  }
}

export function drawFieldPlow(ctx, cx, cy, seed, opts = {}) {
  const frame = isoFrame(cx, cy, opts.orient ?? 'se');
  drawShadowBlob(ctx, cx, cy + 4, 54, 16);
  const beamA = frame.point(-0.48, -0.02, 8);
  const beamB = frame.point(0.48, -0.02, 5);
  linePx(ctx, beamA[0], beamA[1], beamB[0], beamB[1], PALETTE.outline, 4);
  linePx(ctx, beamA[0], beamA[1] - 1, beamB[0], beamB[1] - 1, PALETTE.woodMid, 2);
  const braceA = frame.point(-0.22, -0.16, 14);
  const braceB = frame.point(0.18, 0.12, 5);
  linePx(ctx, braceA[0], braceA[1], braceB[0], braceB[1], PALETTE.outline, 3);
  linePx(ctx, braceA[0], braceA[1] - 1, braceB[0], braceB[1] - 1, PALETTE.woodDark, 1);

  const handleL = frame.point(-0.62, -0.19, 31);
  const handleR = frame.point(-0.58, 0.16, 27);
  for (const handle of [handleL, handleR]) {
    linePx(ctx, beamA[0], beamA[1], handle[0], handle[1], PALETTE.outline, 3);
    linePx(ctx, beamA[0], beamA[1] - 1, handle[0], handle[1], PALETTE.woodDark, 1);
    px(ctx, handle[0] - 5, handle[1] - 2, PALETTE.woodLight, 11, 2);
  }

  const blade = frame.point(0.18, 0.12, 4);
  poly(ctx, PALETTE.outline, [
    [blade[0] - 15, blade[1] - 6],
    [blade[0] + 14, blade[1] - 2],
    [blade[0] + 5, blade[1] + 12],
    [blade[0] - 12, blade[1] + 10]
  ]);
  poly(ctx, PALETTE.rustLight, [
    [blade[0] - 12, blade[1] - 4],
    [blade[0] + 9, blade[1] - 1],
    [blade[0] + 2, blade[1] + 5],
    [blade[0] - 10, blade[1] + 6]
  ]);
  poly(ctx, PALETTE.rustDark, [
    [blade[0] + 2, blade[1] + 4],
    [blade[0] + 10, blade[1] - 1],
    [blade[0] + 4, blade[1] + 10],
    [blade[0] - 4, blade[1] + 8]
  ]);
  linePx(ctx, blade[0] - 10, blade[1] - 4, blade[0] + 8, blade[1] - 1, PALETTE.stoneDust, 1);

  const wheel = frame.point(0.42, 0.12, 3);
  const axle = frame.point(0.28, 0.06, 7);
  linePx(ctx, axle[0], axle[1], wheel[0], wheel[1] - 1, PALETTE.outline, 3);
  linePx(ctx, axle[0], axle[1] - 1, wheel[0], wheel[1] - 2, PALETTE.rustDark, 1);
  drawFarmWheel(ctx, wheel[0], wheel[1] - 3, 7, {
    rim: PALETTE.rustDark,
    lit: PALETTE.stoneDust,
    shade: PALETTE.woodDark,
    hub: PALETTE.rustLight
  });
  const cutterTop = frame.point(0.03, -0.1, 19);
  const cutterBot = frame.point(0.08, -0.02, 3);
  linePx(ctx, cutterTop[0], cutterTop[1], cutterBot[0], cutterBot[1], PALETTE.outline, 3);
  linePx(ctx, cutterTop[0], cutterTop[1], cutterBot[0], cutterBot[1], PALETTE.rustLight, 1);
  drawNoisePixels(ctx, cx - 22, cy - 18, 44, 24, [PALETTE.rustDark, PALETTE.stoneDark], 0.04, seed);
}

export function drawFieldHarrow(ctx, cx, cy, seed, opts = {}) {
  const frame = isoFrame(cx, cy, opts.orient ?? 'se');
  drawShadowBlob(ctx, cx, cy + 4, 58, 17);
  const ha = 0.5;
  const hb = 0.28;
  const corners = [
    frame.point(-ha, -hb, 8),
    frame.point(ha, -hb, 8),
    frame.point(ha, hb, 8),
    frame.point(-ha, hb, 8)
  ];
  for (let i = 0; i < corners.length; i += 1) {
    const a = corners[i];
    const b = corners[(i + 1) % corners.length];
    linePx(ctx, a[0], a[1], b[0], b[1], PALETTE.outline, 3);
    linePx(ctx, a[0], a[1] - 1, b[0], b[1] - 1, PALETTE.woodMid, 1);
  }
  linePx(ctx, corners[0][0], corners[0][1], corners[2][0], corners[2][1], PALETTE.outline, 3);
  linePx(ctx, corners[0][0], corners[0][1] - 1, corners[2][0], corners[2][1] - 1, PALETTE.woodDark, 1);
  linePx(ctx, corners[1][0], corners[1][1], corners[3][0], corners[3][1], PALETTE.outline, 3);
  linePx(ctx, corners[1][0], corners[1][1] - 1, corners[3][0], corners[3][1] - 1, PALETTE.woodDark, 1);
  for (const la of [-0.3, -0.1, 0.1, 0.3]) {
    const a = frame.point(la, -hb, 9);
    const b = frame.point(la, hb, 9);
    linePx(ctx, a[0], a[1], b[0], b[1], PALETTE.woodDark, 2);
  }
  for (const lb of [-0.12, 0.08, 0.24]) {
    const a = frame.point(-ha, lb, 10);
    const b = frame.point(ha, lb, 10);
    linePx(ctx, a[0], a[1], b[0], b[1], PALETTE.woodDark, 2);
  }
  for (const lb of [-0.14, 0.06, 0.22]) {
    for (const la of [-0.36, -0.12, 0.12, 0.36]) {
      const p = frame.point(la, lb, 7);
      px(ctx, p[0] - 2, p[1] - 1, PALETTE.outline, 4, 11);
      px(ctx, p[0] - 1, p[1], PALETTE.rustMid, 2, 8);
      px(ctx, p[0], p[1] + 7, PALETTE.rustDark, 2, 3);
    }
  }
  const tongueA = frame.point(0.5, 0, 8);
  const tongueB = frame.point(0.8, 0, 4);
  linePx(ctx, tongueA[0], tongueA[1], tongueB[0], tongueB[1], PALETTE.outline, 3);
  linePx(ctx, tongueA[0], tongueA[1] - 1, tongueB[0], tongueB[1] - 1, PALETTE.woodDark, 1);
  const wheelA = frame.point(-0.45, 0.3, 3);
  const wheelB = frame.point(0.45, 0.3, 3);
  drawFarmWheel(ctx, wheelA[0], wheelA[1] - 3, 7, {
    rim: PALETTE.rustDark,
    lit: PALETTE.rustLight,
    shade: PALETTE.woodDark,
    hub: PALETTE.rustLight
  });
  drawFarmWheel(ctx, wheelB[0], wheelB[1] - 3, 7, {
    rim: PALETTE.rustDark,
    lit: PALETTE.rustLight,
    shade: PALETTE.woodDark,
    hub: PALETTE.rustLight
  });
}

export function drawWagonWheel(ctx, cx, cy, seed) {
  drawShadowBlob(ctx, cx, cy + 4, 32, 12);
  const lean = (seed & 1) ? 1 : -1;
  linePx(ctx, cx - 9 * lean, cy - 2, cx + 8 * lean, cy - 31, PALETTE.outline, 3);
  linePx(ctx, cx - 8 * lean, cy - 3, cx + 7 * lean, cy - 30, PALETTE.woodDark, 1);
  drawFarmWheel(ctx, cx, cy - 18, 9, {
    rim: PALETTE.woodDark,
    lit: PALETTE.woodLight,
    shade: PALETTE.rustDark,
    hub: PALETTE.rustLight
  });
  px(ctx, cx - 12, cy - 7, PALETTE.outline, 25, 4);
  px(ctx, cx - 10, cy - 8, PALETTE.woodMid, 21, 2);
}

export function drawFeedTrough(ctx, cx, cy, seed, opts = {}) {
  const frame = isoFrame(cx, cy, opts.orient ?? 'se');
  drawShadowBlob(ctx, cx, cy + 4, 42, 13);
  const box = orientedBox(ctx, frame, 0.82, 0.3, 10, {
    top: PALETTE.woodDark,
    lit: PALETTE.woodMid,
    shade: PALETTE.woodDark,
    outline: PALETTE.outline
  });
  const left = frame.point(-0.33, 0, 11);
  const right = frame.point(0.33, 0, 11);
  linePx(ctx, left[0], left[1], right[0], right[1], PALETTE.void, 5);
  linePx(ctx, left[0], left[1] - 1, right[0], right[1] - 1, PALETTE.stoneDark, 2);
  for (const la of [-0.34, 0.34]) {
    for (const lb of [-0.1, 0.1]) {
      drawPropLeg(ctx, frame.point(la, lb, 1), 8, PALETTE.woodDark);
    }
  }
  for (const la of [-0.28, -0.08, 0.1, 0.29]) {
    const feed = frame.point(la, 0, 13);
    px(ctx, feed[0] - 2, feed[1] - 1, PALETTE.clothTan, 5, 1);
    px(ctx, feed[0] - 1, feed[1], PALETTE.hostGold, 3, 1);
  }
  const braceA = frame.point(-0.39, 0.16, 5);
  const braceB = frame.point(0.39, 0.16, 5);
  linePx(ctx, braceA[0], braceA[1], braceB[0], braceB[1], PALETTE.outline, 2);
  linePx(ctx, braceA[0], braceA[1] - 1, braceB[0], braceB[1] - 1, PALETTE.woodDark, 1);
  px(ctx, box.cap.left[0] + 3, box.cap.left[1], PALETTE.woodLight, 10, 1);
  drawNoisePixels(ctx, cx - 18, cy - 14, 36, 20, [PALETTE.woodDark, PALETTE.stoneDark], 0.035, seed);
}

export function drawWaterPump(ctx, cx, cy, seed) {
  drawShadowBlob(ctx, cx, cy + 4, 26, 11);
  drawIsoPrism(ctx, cx, cy + 2, 24, 11, 5, {
    top: PALETTE.stoneMid,
    left: PALETTE.stoneDark,
    right: PALETTE.void,
    outline: PALETTE.outline
  });
  px(ctx, cx - 5, cy - 39, PALETTE.outline, 11, 40);
  px(ctx, cx - 3, cy - 38, PALETTE.rustDark, 7, 37);
  px(ctx, cx - 2, cy - 37, PALETTE.rustLight, 2, 32);
  px(ctx, cx - 8, cy - 44, PALETTE.outline, 17, 8);
  px(ctx, cx - 6, cy - 43, PALETTE.rustDark, 13, 5);
  linePx(ctx, cx + 4, cy - 31, cx + 22, cy - 34, PALETTE.outline, 4);
  linePx(ctx, cx + 4, cy - 32, cx + 20, cy - 35, PALETTE.rustLight, 2);
  px(ctx, cx + 19, cy - 33, PALETTE.outline, 5, 8);
  drawFarmWheel(ctx, cx + 13, cy - 24, 5, {
    rim: PALETTE.rustDark,
    lit: PALETTE.rustLight,
    shade: PALETTE.stoneDark,
    hub: PALETTE.stoneDust
  });
  linePx(ctx, cx + 5, cy - 25, cx + 13, cy - 24, PALETTE.outline, 2);
  linePx(ctx, cx + 5, cy - 26, cx + 13, cy - 25, PALETTE.rustLight, 1);
  px(ctx, cx - 12, cy - 41, PALETTE.outline, 24, 3);
  px(ctx, cx - 10, cy - 42, PALETTE.stoneDark, 20, 1);
  linePx(ctx, cx - 8, cy - 29, cx - 24, cy - 20, PALETTE.outline, 3);
  linePx(ctx, cx - 8, cy - 30, cx - 23, cy - 21, PALETTE.woodDark, 1);
  px(ctx, cx - 5, cy - 17, PALETTE.stoneDust, 3, 2);
  px(ctx, cx + 3, cy - 17, PALETTE.stoneDust, 3, 2);
  drawNoisePixels(ctx, cx - 10, cy - 39, 20, 40, [PALETTE.rustDark, PALETTE.stoneDark], 0.035, seed);
}

export function drawToolRack(ctx, cx, cy, seed) {
  drawShadowBlob(ctx, cx, cy + 4, 34, 12);
  px(ctx, cx - 15, cy - 42, PALETTE.outline, 5, 45);
  px(ctx, cx + 12, cy - 40, PALETTE.outline, 5, 43);
  px(ctx, cx - 14, cy - 41, PALETTE.woodDark, 3, 42);
  px(ctx, cx + 13, cy - 39, PALETTE.woodDark, 3, 40);
  linePx(ctx, cx - 17, cy - 36, cx + 16, cy - 34, PALETTE.outline, 4);
  linePx(ctx, cx - 16, cy - 37, cx + 15, cy - 35, PALETTE.woodMid, 2);
  for (const spec of [
    [-9, PALETTE.rustLight, 18],
    [-2, PALETTE.stoneDust, 22],
    [6, PALETTE.rustLight, 16]
  ]) {
    px(ctx, cx + spec[0], cy - 34, PALETTE.outline, 3, spec[2]);
    px(ctx, cx + spec[0] + 1, cy - 33, spec[1], 1, spec[2] - 1);
  }
  px(ctx, cx - 12, cy - 14, PALETTE.rustLight, 8, 2);
  px(ctx, cx - 4, cy - 11, PALETTE.stoneDust, 10, 2);
  px(ctx, cx + 4, cy - 16, PALETTE.rustLight, 8, 2);
  drawNoisePixels(ctx, cx - 17, cy - 39, 34, 38, [PALETTE.woodDark, PALETTE.stoneDark], 0.035, seed);
}

export function drawWoodpile(ctx, cx, cy, seed) {
  const rng = rngFrom(hash2D(seed + 97, seed * 11 + 3));
  drawShadowBlob(ctx, cx, cy + 4, 46, 15);
  for (let row = 0; row < 4; row += 1) {
    const count = row % 2 === 0 ? 4 : 3;
    for (let i = 0; i < count; i += 1) {
      const x = cx - 20 + i * 13 + (row % 2) * 6;
      const y = cy - 5 - row * 6 + Math.floor((rng() - 0.5) * 2);
      px(ctx, x - 2, y - 4, PALETTE.outline, 15, 8);
      px(ctx, x, y - 3, PALETTE.woodMid, 11, 6);
      px(ctx, x, y - 3, PALETTE.woodLight, 3, 2);
      px(ctx, x + 8, y - 2, PALETTE.woodDark, 3, 4);
      px(ctx, x + 10, y - 1, PALETTE.outline, 1, 2);
    }
  }
  linePx(ctx, cx - 24, cy - 1, cx - 15, cy - 29, PALETTE.outline, 3);
  linePx(ctx, cx + 22, cy - 1, cx + 13, cy - 28, PALETTE.outline, 3);
  linePx(ctx, cx - 23, cy - 2, cx - 15, cy - 28, PALETTE.woodDark, 1);
  linePx(ctx, cx + 21, cy - 2, cx + 14, cy - 27, PALETTE.woodDark, 1);
}

export function drawRoadSignPost(ctx, cx, cy, seed) {
  const side = (seed & 1) ? 1 : -1;
  const topY = cy - 48;
  const midY = cy - 39;
  const botY = cy - 30;
  const rootX = cx + side * 5;
  const shoulderX = cx + side * 36;
  const tipX = cx + side * 48;
  const innerRoot = rootX + side * 2;
  const innerShoulder = shoulderX - side * 3;
  const innerTip = tipX - side * 4;

  drawShadowBlob(ctx, cx, cy + 4, 34, 11);

  // Split timber post with a lit left edge and a darker buried foot.
  px(ctx, cx - 5, cy - 52, PALETTE.outline, 11, 57);
  px(ctx, cx - 3, cy - 50, PALETTE.woodDark, 7, 53);
  px(ctx, cx - 2, cy - 49, PALETTE.woodMid, 3, 48);
  px(ctx, cx + 2, cy - 48, PALETTE.woodDark, 2, 48);
  px(ctx, cx - 6, cy + 1, PALETTE.outline, 13, 5);
  px(ctx, cx - 3, cy + 2, PALETTE.stoneDark, 7, 2);
  linePx(ctx, cx + 1, cy - 47, cx + 1, cy - 4, PALETTE.outline, 1);
  linePx(ctx, cx - 2, cy - 40, cx + 1, cy - 44, PALETTE.woodLight, 1);
  linePx(ctx, cx - 1, cy - 19, cx + 2, cy - 25, PALETTE.woodLight, 1);

  // Direction plank: an arrow-shaped board instead of an unreadable rectangle.
  poly(ctx, PALETTE.outline, [
    [rootX, topY],
    [shoulderX, topY],
    [tipX, midY],
    [shoulderX, botY],
    [rootX, botY]
  ]);
  poly(ctx, PALETTE.woodDark, [
    [innerRoot, topY + 2],
    [innerShoulder, topY + 2],
    [innerTip, midY],
    [innerShoulder, botY - 2],
    [innerRoot, botY - 2]
  ]);
  poly(ctx, PALETTE.woodMid, [
    [innerRoot, topY + 2],
    [innerShoulder, topY + 2],
    [innerTip - side * 2, midY - 1],
    [innerShoulder, midY - 1],
    [innerRoot, midY - 1]
  ]);
  linePx(ctx, innerRoot, topY + 4, innerShoulder, topY + 4, PALETTE.woodLight, 1);
  linePx(ctx, innerRoot, midY + 2, innerShoulder, midY + 2, PALETTE.outline, 1);
  linePx(ctx, innerRoot, botY - 3, innerShoulder, botY - 3, PALETTE.woodDark, 1);
  for (const off of [10, 22]) {
    const x = cx + side * off;
    px(ctx, x - 1, midY - 1, PALETTE.outline, 3, 3);
    px(ctx, x, midY, PALETTE.rustLight, 1, 1);
  }
  linePx(ctx, cx + side * 6, cy - 31, cx + side * 20, cy - 24, PALETTE.outline, 3);
  linePx(ctx, cx + side * 7, cy - 32, cx + side * 19, cy - 25, PALETTE.woodDark, 1);
  drawNoisePixels(ctx, Math.min(rootX, tipX), topY + 2, Math.abs(tipX - rootX), 16, [PALETTE.woodDark, PALETTE.stoneDark], 0.03, seed);
}
