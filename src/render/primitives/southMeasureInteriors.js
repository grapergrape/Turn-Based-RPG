// Shared interior architecture and working furniture for South Measure.
// Every mark is built on an isometric floor or wall plane so rotated props,
// connected runs, and wall fixtures keep their texture aligned.

import { PALETTE } from '../palette.js';
import { TILE_HEIGHT, TILE_WIDTH, WALL_HEIGHT } from '../renderConfig.js';
import {
  diamond,
  drawIsoDiamond,
  drawPropLeg,
  faceTools,
  footprintExtent,
  hash2D,
  isoFrame,
  linePx,
  mixPoint,
  nativeLinePx,
  nativePx,
  normalizeOrient,
  orientedBox,
  poly,
  px,
  rngFrom,
  wallRunFace
} from './basePixels.js';

const WALL_STYLES = {
  intake: {
    top: PALETTE.stoneLight,
    lit: PALETTE.stoneMid,
    shade: PALETTE.stoneDark,
    seam: PALETTE.stoneDark,
    trim: PALETTE.stoneDust,
    accent: PALETTE.clothBlueDark,
    material: 'masonry'
  },
  service: {
    top: PALETTE.stoneLight,
    lit: PALETTE.stoneMid,
    shade: PALETTE.stoneDark,
    seam: PALETTE.outline,
    trim: PALETTE.rustMid,
    accent: PALETTE.rustDark,
    material: 'service'
  },
  freight: {
    top: PALETTE.woodMid,
    lit: PALETTE.woodMid,
    shade: PALETTE.woodDark,
    seam: PALETTE.rustDark,
    trim: PALETTE.woodLight,
    accent: PALETTE.rustMid,
    material: 'timber'
  },
  domestic: {
    top: PALETTE.woodDark,
    lit: PALETTE.clothTan,
    shade: PALETTE.woodDark,
    seam: PALETTE.stoneDust,
    trim: PALETTE.woodLight,
    accent: PALETTE.clothRed,
    material: 'plaster'
  }
};

const DOOR_STYLES = {
  civil: { base: PALETTE.stoneMid, shade: PALETTE.stoneDark, trim: PALETTE.stoneDust, brace: PALETTE.rustMid },
  service: { base: PALETTE.rustMid, shade: PALETTE.rustDark, trim: PALETTE.rustLight, brace: PALETTE.stoneDust },
  freight: { base: PALETTE.woodMid, shade: PALETTE.woodDark, trim: PALETTE.woodLight, brace: PALETTE.rustMid },
  domestic: { base: PALETTE.woodMid, shade: PALETTE.woodDark, trim: PALETTE.clothTan, brace: PALETTE.rustDark },
  clinic: { base: PALETTE.clothTan, shade: PALETTE.stoneDust, trim: PALETTE.hostBone, brace: PALETTE.clothBlueDark }
};

function knownVariant(value, table, fallback) {
  return Object.hasOwn(table, value) ? value : fallback;
}

function floorQuad(ctx, frame, a0, a1, b0, b1, lift, color) {
  poly(ctx, color, [
    frame.point(a0, b0, lift),
    frame.point(a1, b0, lift),
    frame.point(a1, b1, lift),
    frame.point(a0, b1, lift)
  ]);
}

function floorLine(ctx, frame, a0, b0, a1, b1, lift, color, size = 1) {
  const start = frame.point(a0, b0, lift);
  const end = frame.point(a1, b1, lift);
  linePx(ctx, start[0], start[1], end[0], end[1], color, size);
}

function shiftedFrame(frame, a, b, lift = 0) {
  const point = frame.point(a, b, lift);
  return isoFrame(point[0], point[1], frame.orient);
}

export function southMeasureInteriorWallGeometry(cx, cy, heightPx = WALL_HEIGHT) {
  const height = heightPx ?? WALL_HEIGHT;
  return {
    height,
    base: diamond(cx, cy, TILE_WIDTH, TILE_HEIGHT),
    cap: diamond(cx, cy - height, TILE_WIDTH, TILE_HEIGHT)
  };
}

export function southMeasureInteriorWallPerimeterEdges(cap, connected = {}) {
  const edges = [];
  if (!connected.xMinus) edges.push({ side: 'xMinus', start: cap.left, end: cap.top });
  if (!connected.yMinus) edges.push({ side: 'yMinus', start: cap.top, end: cap.right });
  if (!connected.yPlus) edges.push({ side: 'yPlus', start: cap.left, end: cap.bottom });
  if (!connected.xPlus) edges.push({ side: 'xPlus', start: cap.bottom, end: cap.right });
  return edges;
}

export function southMeasureInteriorWallCapCourses(cap) {
  return [0.28, 0.66].map((t) => ({
    t,
    start: mixPoint(cap.left, cap.top, t),
    end: mixPoint(cap.bottom, cap.right, t)
  }));
}

function drawMasonryCourses(ctx, face, seed, style, shaded) {
  const seam = shaded ? PALETTE.outline : style.seam;
  const highlight = shaded ? PALETTE.stoneDark : style.trim;
  const courses = [0.18, 0.38, 0.59, 0.79];
  for (const v of courses) {
    face.line(0.02, v, 0.98, v, seam, 1);
    if (v === 0.18 || v === 0.59) face.line(0.04, v - 0.018, 0.94, v - 0.018, highlight, 1);
  }
  for (let row = 0; row < courses.length + 1; row += 1) {
    const v0 = row === 0 ? 0.02 : courses[row - 1];
    const v1 = row === courses.length ? 0.98 : courses[row];
    const offset = ((seed + row) & 1) ? 0.14 : 0;
    for (const u of [0.2 + offset, 0.52 + offset, 0.84 + offset]) {
      if (u >= 0.96) continue;
      face.line(u, v0 + 0.01, u, v1 - 0.01, seam, 1);
    }
  }
}

function drawNativeWallFaceMaterial(face, seed, style, shaded) {
  const light = shaded ? PALETTE.stoneDark : style.trim;
  const dark = shaded ? PALETTE.outline : style.seam;
  for (let i = 0; i < 4; i += 1) {
    const hash = hash2D(seed + i * 29, seed * 7 + i * 13);
    const u = 0.1 + ((hash & 255) / 255) * 0.78;
    const v = 0.13 + (((hash >>> 8) & 255) / 255) * 0.72;
    if (style.material === 'timber') {
      face.nativeLine(u, v, u + (((hash >>> 16) & 1) ? 0.014 : -0.014), Math.min(0.94, v + 0.14), i & 1 ? dark : light);
    } else if (style.material === 'service') {
      face.nativeLine(u, v, Math.min(0.94, u + 0.09), Math.max(0.06, v - 0.055), i & 1 ? PALETTE.rustDark : light);
    } else if (style.material === 'plaster') {
      face.nativeLine(u, v, u + 0.035, Math.min(0.94, v + 0.055), i & 1 ? PALETTE.stoneDark : light);
      face.nativeLine(u + 0.035, Math.min(0.94, v + 0.055), u + 0.08, Math.min(0.96, v + 0.04), dark);
    } else {
      face.nativeLine(u, v, Math.min(0.95, u + 0.085), v + (((hash >>> 16) & 1) ? 0.012 : -0.012), i & 1 ? dark : light);
    }
  }
}

function drawWallFaceDetail(ctx, face, seed, style, shaded = false) {
  const shadow = shaded ? PALETTE.outline : PALETTE.stoneDark;
  const light = shaded ? PALETTE.stoneDark : style.trim;

  if (style.material === 'masonry') {
    drawMasonryCourses(ctx, face, seed, style, shaded);
    face.rect(0.06, 0.86, 0.94, 0.98, shaded ? PALETTE.outline : PALETTE.stoneDark);
    face.line(0.08, 0.84, 0.92, 0.84, PALETTE.rustDark, 1);
    if (seed % 4 === 0) {
      face.line(0.22, 0.48, 0.42, 0.59, PALETTE.outline, 2);
      face.line(0.23, 0.46, 0.41, 0.57, light, 1);
    }
    drawNativeWallFaceMaterial(face, seed, style, shaded);
    return;
  }

  if (style.material === 'service') {
    for (const v of [0.2, 0.46, 0.72, 0.9]) face.line(0.03, v, 0.97, v, style.seam, v === 0.72 ? 2 : 1);
    for (const u of [0.15, 0.5, 0.84]) {
      face.line(u, 0.03, u, 0.97, shadow, 2);
      for (const v of [0.12, 0.58, 0.86]) {
        const rivet = face.point(u, v);
        px(ctx, rivet[0] - 1, rivet[1] - 1, PALETTE.outline, 3, 2);
        px(ctx, rivet[0], rivet[1] - 1, shaded ? PALETTE.rustDark : PALETTE.rustLight, 1, 1);
      }
    }
    face.line(0.08, 0.82, 0.92, 0.61, PALETTE.outline, 3);
    face.line(0.1, 0.79, 0.9, 0.59, style.accent, 1);
    drawNativeWallFaceMaterial(face, seed, style, shaded);
    return;
  }

  if (style.material === 'timber') {
    for (const u of [0.13, 0.3, 0.48, 0.66, 0.84]) {
      face.line(u, 0.03, u, 0.98, style.seam, 1);
      face.line(u + 0.02, 0.04, u + 0.02, 0.96, shaded ? PALETTE.outline : PALETTE.woodLight, 1);
    }
    for (const v of [0.25, 0.76]) face.line(0.03, v, 0.97, v, shadow, 2);
    face.line(0.08, 0.82, 0.91, 0.24, PALETTE.outline, 3);
    face.line(0.1, 0.79, 0.89, 0.23, style.accent, 1);
    drawNativeWallFaceMaterial(face, seed, style, shaded);
    return;
  }

  face.rect(0.03, 0.03, 0.97, 0.97, shaded ? PALETTE.woodDark : PALETTE.stoneDust);
  face.rect(0.08, 0.08, 0.92, 0.84, shaded ? PALETTE.stoneDark : PALETTE.clothTan);
  for (const u of [0.08, 0.5, 0.92]) face.line(u, 0.04, u, 0.97, shadow, 2);
  for (const v of [0.12, 0.86]) face.line(0.04, v, 0.96, v, light, 2);
  if ((seed & 1) === 0) {
    face.rect(0.18, 0.34, 0.4, 0.51, PALETTE.outline);
    face.rect(0.2, 0.36, 0.38, 0.49, PALETTE.stoneDust);
    face.line(0.2, 0.36, 0.38, 0.36, PALETTE.clothTan, 1);
  }
  face.line(0.12, 0.91, 0.88, 0.91, PALETTE.rustDark, 2);
  drawNativeWallFaceMaterial(face, seed, style, shaded);
}

export function drawSouthMeasureInteriorWallBlock(ctx, cx, cy, heightPx, seed, opts = {}) {
  const variant = knownVariant(opts.variant, WALL_STYLES, 'intake');
  const style = WALL_STYLES[variant];
  const connected = opts.connected ?? {};
  const geometry = southMeasureInteriorWallGeometry(cx, cy, heightPx ?? WALL_HEIGHT);
  const { base, cap } = geometry;


  if (!connected.yPlus) {
    poly(ctx, style.lit, [cap.left, cap.bottom, base.bottom, base.left]);
    drawWallFaceDetail(ctx, faceTools(ctx, cap.left, cap.bottom, base.bottom, base.left), seed + 17, style, false);
  }
  if (!connected.xPlus) {
    poly(ctx, style.shade, [cap.bottom, cap.right, base.right, base.bottom]);
    drawWallFaceDetail(ctx, faceTools(ctx, cap.bottom, cap.right, base.right, base.bottom), seed + 31, style, true);
  }

  poly(ctx, style.top, [cap.top, cap.right, cap.bottom, cap.left]);
  for (const course of southMeasureInteriorWallCapCourses(cap)) {
    linePx(ctx, course.start[0], course.start[1], course.end[0], course.end[1], course.t < 0.5 ? style.trim : style.seam, 1);
  }
  if (variant === 'service' || variant === 'freight') {
    const a = mixPoint(cap.top, cap.right, 0.42);
    const b = mixPoint(cap.left, cap.bottom, 0.42);
    linePx(ctx, a[0], a[1], b[0], b[1], style.accent, 1);
  }
  const capLight = mixPoint(cap.left, cap.top, 0.22 + (seed & 3) * 0.1);
  const capLightEnd = mixPoint(cap.left, cap.top, 0.4 + (seed & 3) * 0.08);
  nativeLinePx(ctx, capLight[0] + 0.5, capLight[1] - 0.5, capLightEnd[0] + 0.5, capLightEnd[1] - 0.5, style.trim);
  const capShade = mixPoint(cap.bottom, cap.right, 0.26 + ((seed >>> 2) & 3) * 0.08);
  const capShadeEnd = mixPoint(cap.bottom, cap.right, 0.44 + ((seed >>> 2) & 3) * 0.07);
  nativeLinePx(ctx, capShade[0] - 0.5, capShade[1] + 0.5, capShadeEnd[0] - 0.5, capShadeEnd[1] + 0.5, style.seam);

  for (const edge of southMeasureInteriorWallPerimeterEdges(cap, connected)) {
    const litEdge = edge.side === 'xMinus' || edge.side === 'yMinus';
    linePx(ctx, edge.start[0], edge.start[1], edge.end[0], edge.end[1], litEdge ? style.trim : PALETTE.outline, litEdge ? 1 : 2);
  }
}

export function drawSouthMeasureDoor(ctx, cx, cy, seed, opts = {}) {
  const aliases = { intake: 'civil', annex: 'service', hall: 'domestic', canvas: 'clinic' };
  const requested = aliases[opts.variant] ?? opts.variant;
  const variant = knownVariant(requested, DOOR_STYLES, 'civil');
  const style = DOOR_STYLES[variant];
  const wallPlane = opts.wallPlane === 'se' ? 'se' : 'sw';
  const wallSide = opts.wallSide === 'far' ? 'far' : 'near';
  const wall = wallRunFace(ctx, cx, cy, { plane: wallPlane, side: wallSide, span: 1 });
  const door = faceTools(ctx, wall.point(0.14, 0.13), wall.point(0.86, 0.13), wall.point(0.86, 0.99), wall.point(0.14, 0.99));
  const opened = Boolean(opts.opened);

  door.rect(0, 0, 1, 1, PALETTE.outline);
  door.rect(0.045, 0.045, 0.955, 0.98, PALETTE.stoneDark);
  if (opened) {
    door.rect(0.1, 0.09, 0.9, 0.94, PALETTE.void);
    door.rect(0.72, 0.1, 0.9, 0.93, style.shade);
    door.line(0.74, 0.12, 0.74, 0.91, style.trim, 2);
    door.line(0.76, 0.42, 0.89, 0.58, style.brace, 2);
  } else {
    door.rect(0.1, 0.09, 0.9, 0.94, style.base);
    door.rect(0.58, 0.09, 0.9, 0.94, style.shade);
    for (const u of [0.23, 0.42, 0.61, 0.8]) door.line(u, 0.11, u, 0.92, PALETTE.outline, 1);
    for (const v of [0.25, 0.64, 0.88]) {
      door.line(0.11, v, 0.89, v, PALETTE.outline, 3);
      door.line(0.14, v - 0.018, 0.86, v - 0.018, style.trim, 1);
    }
    door.line(0.13, 0.82, 0.87, 0.22, PALETTE.outline, 3);
    door.line(0.15, 0.79, 0.85, 0.22, style.brace, 1);
    if (variant === 'clinic') {
      door.rect(0.34, 0.32, 0.66, 0.57, PALETTE.outline);
      door.rect(0.38, 0.35, 0.62, 0.54, PALETTE.clothBlueDark);
      door.line(0.5, 0.37, 0.5, 0.52, PALETTE.stoneDust, 2);
      door.line(0.4, 0.445, 0.6, 0.445, PALETTE.stoneDust, 2);
    }
  }

  door.line(0.02, 0.03, 0.98, 0.03, style.trim, 2);
  door.line(0.02, 0.98, 0.98, 0.98, PALETTE.outline, 3);
  const pull = door.point(0.78, 0.56);
  px(ctx, pull[0] - 2, pull[1] - 2, PALETTE.outline, 5, 5);
  px(ctx, pull[0] - 1, pull[1] - 2, opts.locked ? PALETTE.rustDark : PALETTE.rustLight, 2, 2);
  if (opts.locked && !opened) {
    const lock = door.point(0.69, 0.7);
    px(ctx, lock[0] - 3, lock[1] - 2, PALETTE.outline, 7, 6);
    px(ctx, lock[0] - 2, lock[1] - 1, PALETTE.rustDark, 5, 4);
  }
  // Finer panel grain remains visible in every material and opened state.
  door.nativeLine(0.16, 0.18, opened ? 0.36 : 0.42, 0.18, style.trim);
  door.nativeLine(opened ? 0.76 : 0.55, 0.72, 0.86, 0.72, style.shade);
  door.nativeLine(0.18, 0.94, 0.42, 0.94, PALETTE.stoneDust);
}

export function drawSouthMeasureServiceHatch(ctx, cx, cy, seed, opts = {}) {
  const frame = isoFrame(cx, cy, opts.orient);
  const variant = ['hatch', 'grate', 'ladder'].includes(opts.variant) ? opts.variant : 'hatch';
  const opened = Boolean(opts.opened);
  const shell = orientedBox(ctx, frame, 1.12, 0.72, 3, {
    top: PALETTE.rustDark,
    lit: PALETTE.stoneDark,
    shade: PALETTE.outline,
    outline: PALETTE.outline
  });
  linePx(ctx, shell.cap.left[0], shell.cap.left[1], shell.cap.top[0], shell.cap.top[1], PALETTE.rustLight, 1);
  floorQuad(ctx, frame, -0.46, 0.46, -0.25, 0.25, 4, opened ? PALETTE.void : PALETTE.stoneDark);

  if (variant === 'grate') {
    for (const b of [-0.2, -0.1, 0, 0.1, 0.2]) floorLine(ctx, frame, -0.44, b, 0.44, b, 5, PALETTE.rustMid, 2);
    for (const a of [-0.3, 0, 0.3]) floorLine(ctx, frame, a, -0.23, a, 0.23, 6, PALETTE.outline, 1);
  } else if (variant === 'ladder') {
    if (opened) {
      for (const a of [-0.32, -0.1, 0.12, 0.34]) floorLine(ctx, frame, a, -0.18, a, 0.18, 6, PALETTE.stoneDust, 2);
      floorLine(ctx, frame, -0.42, -0.2, 0.42, -0.2, 6, PALETTE.rustDark, 2);
      floorLine(ctx, frame, -0.42, 0.2, 0.42, 0.2, 6, PALETTE.rustLight, 2);
    } else {
      floorLine(ctx, frame, -0.32, -0.18, 0.32, -0.18, 6, PALETTE.rustLight, 2);
      floorLine(ctx, frame, -0.32, 0.18, 0.32, 0.18, 6, PALETTE.rustDark, 2);
      for (const a of [-0.22, 0, 0.22]) floorLine(ctx, frame, a, -0.18, a, 0.18, 7, PALETTE.stoneDust, 1);
    }
  } else {
    floorLine(ctx, frame, -0.42, -0.19, 0.42, -0.19, 5, PALETTE.stoneDust, 1);
    floorLine(ctx, frame, 0.32, -0.18, 0.32, 0.18, 6, PALETTE.outline, 3);
    floorLine(ctx, frame, -0.18, -0.12, 0.1, 0.12, 6, PALETTE.rustMid, 1);
  }
  const hatchWearA = frame.point(-0.36, -0.16, 5.5);
  const hatchWearB = frame.point(-0.08, -0.16, 5.5);
  nativeLinePx(ctx, hatchWearA[0], hatchWearA[1], hatchWearB[0], hatchWearB[1], PALETTE.rustLight);
  const hatchWearC = frame.point(0.1, 0.14, 5.5);
  const hatchWearD = frame.point(0.34, 0.14, 5.5);
  nativeLinePx(ctx, hatchWearC[0], hatchWearC[1], hatchWearD[0], hatchWearD[1], PALETTE.stoneDark);
}

const RUN_CONNECTION_KEYS = {
  se: ['xMinus', 'xPlus'],
  sw: ['yMinus', 'yPlus'],
  nw: ['xPlus', 'xMinus'],
  ne: ['yPlus', 'yMinus']
};

export function southMeasureRunGeometry(cx, cy, orient = 'se', lift = 0) {
  const normalized = normalizeOrient(orient);
  const frame = isoFrame(cx, cy, normalized);
  return {
    orient: normalized,
    start: frame.point(-0.5, 0, lift),
    end: frame.point(0.5, 0, lift),
    frame
  };
}

export function southMeasureRunConnections(orient = 'se', connected = {}) {
  const normalized = normalizeOrient(orient);
  const [startKey, endKey] = RUN_CONNECTION_KEYS[normalized];
  const links = connected ?? {};
  return {
    startKey,
    endKey,
    start: Boolean(links.start ?? links[startKey]),
    end: Boolean(links.end ?? links[endKey])
  };
}

function drawPipeCollar(ctx, point, color) {
  px(ctx, point[0] - 3, point[1] - 4, PALETTE.outline, 7, 8);
  px(ctx, point[0] - 2, point[1] - 3, PALETTE.rustDark, 5, 6);
  px(ctx, point[0] - 1, point[1] - 2, color, 3, 4);
  nativeLinePx(ctx, point[0] - 1.5, point[1] - 2.5, point[0] + 1.5, point[1] - 2.5, PALETTE.stoneDust);
}

function drawServicePipeStroke(ctx, start, end, color = PALETTE.rustMid) {
  linePx(ctx, start[0], start[1], end[0], end[1], PALETTE.outline, 8);
  linePx(ctx, start[0] + 1, start[1] + 1, end[0] + 1, end[1] + 1, PALETTE.rustDark, 6);
  linePx(ctx, start[0], start[1], end[0], end[1], color, 4);
  nativeLinePx(ctx, start[0] + 0.5, start[1] - 1.5, end[0] + 0.5, end[1] - 1.5, PALETTE.rustLight);
}

function drawFloorPipeSupport(ctx, frame, a, b, lift) {
  const foot = frame.point(a, b, 0);
  const saddle = frame.point(a, b, lift - 2);
  px(ctx, foot[0] - 5, foot[1] - 3, PALETTE.outline, 11, 5);
  px(ctx, foot[0] - 4, foot[1] - 2, PALETTE.stoneDark, 9, 3);
  linePx(ctx, foot[0], foot[1] - 2, saddle[0], saddle[1], PALETTE.outline, 5);
  linePx(ctx, foot[0], foot[1] - 3, saddle[0], saddle[1], PALETTE.rustDark, 2);
  px(ctx, saddle[0] - 5, saddle[1] - 2, PALETTE.outline, 11, 5);
  px(ctx, saddle[0] - 4, saddle[1] - 2, PALETTE.stoneMid, 9, 2);
  nativeLinePx(ctx, foot[0] - 0.5, foot[1] - 3.5, saddle[0] - 0.5, saddle[1] + 0.5, PALETTE.rustLight);
}

function drawMechanicalWheel(ctx, center, radius, color = PALETTE.rustLight) {
  const points = [
    [-0.45, -1], [0.45, -1], [1, -0.45], [1, 0.45],
    [0.45, 1], [-0.45, 1], [-1, 0.45], [-1, -0.45]
  ].map(([dx, dy]) => [
    Math.round(center[0] + dx * radius),
    Math.round(center[1] + dy * radius)
  ]);
  for (let index = 0; index < points.length; index += 1) {
    const start = points[index];
    const end = points[(index + 1) % points.length];
    linePx(ctx, start[0], start[1], end[0], end[1], PALETTE.outline, 3);
    nativeLinePx(ctx, start[0] + 0.5, start[1] - 0.5, end[0] + 0.5, end[1] - 0.5, index < 3 ? color : PALETTE.rustMid);
  }
  for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
    linePx(
      ctx,
      center[0],
      center[1],
      center[0] + Math.round(dx * (radius - 2)),
      center[1] + Math.round(dy * (radius - 2)),
      PALETTE.outline,
      2
    );
    linePx(
      ctx,
      center[0],
      center[1],
      center[0] + Math.round(dx * (radius - 3)),
      center[1] + Math.round(dy * (radius - 3)),
      color,
      1
    );
  }
  px(ctx, center[0] - 2, center[1] - 2, PALETTE.outline, 5, 5);
  nativePx(ctx, center[0] - 0.5, center[1] - 0.5, PALETTE.stoneDust);
  nativeLinePx(ctx, points[7][0] + 0.5, points[7][1] - 0.5, points[1][0] - 0.5, points[1][1] - 0.5, PALETTE.stoneDust);
}

function wallPipeConnectionState(opts, variant) {
  const links = opts.connected ?? {};
  const start = Boolean(links.start ?? links.xMinus ?? links.yMinus ?? false);
  const end = Boolean(links.end ?? (variant === 'elbow'
    ? (links.yMinus ?? links.xMinus)
    : (links.xPlus ?? links.yPlus)) ?? false);
  return { start, end };
}

function drawWallPipeStroke(wall, u0, v0, u1, v1) {
  wall.line(u0, v0, u1, v1, PALETTE.outline, 8);
  wall.line(u0, v0 + 0.018, u1, v1 + 0.018, PALETTE.rustDark, 6);
  wall.line(u0, v0 - 0.012, u1, v1 - 0.012, PALETTE.rustMid, 3);
  wall.nativeLine(u0 + 0.01, v0 - 0.028, u1 - 0.01, v1 - 0.028, PALETTE.rustLight);
}

function drawWallPipeBracket(ctx, wall, u, v) {
  const point = wall.point(u, v);
  px(ctx, point[0] - 5, point[1] - 5, PALETTE.outline, 11, 10);
  px(ctx, point[0] - 4, point[1] - 4, PALETTE.stoneDark, 9, 8);
  px(ctx, point[0] - 4, point[1] - 2, PALETTE.rustMid, 9, 4);
  nativeLinePx(ctx, point[0] - 3.5, point[1] - 3.5, point[0] + 2.5, point[1] - 3.5, PALETTE.rustLight);
}

function drawWallPipe(ctx, cx, cy, seed, opts) {
  const wall = wallRunFace(ctx, cx, cy, {
    plane: opts.wallPlane === 'se' ? 'se' : 'sw',
    side: opts.wallSide === 'far' ? 'far' : 'near',
    span: 1
  });
  const variant = ['straight', 'elbow', 'valve'].includes(opts.variant) ? opts.variant : 'straight';
  const connections = wallPipeConnectionState(opts, variant);
  if (variant === 'elbow') {
    drawWallPipeBracket(ctx, wall, 0.24, 0.66);
    drawWallPipeBracket(ctx, wall, 0.58, 0.34);
    drawWallPipeStroke(wall, 0, 0.66, 0.58, 0.66);
    drawWallPipeStroke(wall, 0.58, 0.66, 0.58, 0.01);
    drawPipeCollar(ctx, wall.point(0.58, 0.66), PALETTE.rustMid);
    if (!connections.start) drawPipeCollar(ctx, wall.point(0.01, 0.66), PALETTE.rustDark);
    if (!connections.end) drawPipeCollar(ctx, wall.point(0.58, 0.02), PALETTE.stoneDark);
  } else {
    for (const u of [0.24, 0.76]) drawWallPipeBracket(ctx, wall, u, 0.66);
    drawWallPipeStroke(wall, 0, 0.66, 1, 0.66);
    if (!connections.start) drawPipeCollar(ctx, wall.point(0.01, 0.66), PALETTE.rustDark);
    if (!connections.end) drawPipeCollar(ctx, wall.point(0.99, 0.66), PALETTE.rustDark);
  }
  if (variant === 'valve') {
    const hub = wall.point(0.53, 0.63);
    linePx(ctx, hub[0], hub[1], hub[0], hub[1] - 17, PALETTE.outline, 5);
    linePx(ctx, hub[0] - 1, hub[1] - 1, hub[0] - 1, hub[1] - 16, PALETTE.rustMid, 2);
    drawMechanicalWheel(ctx, [hub[0], hub[1] - 21], 8, PALETTE.rustLight);
  }
  const tag = wall.point(0.25 + (hash2D(seed, seed + 7) % 3) * 0.18, 0.76);
  px(ctx, tag[0] - 2, tag[1] - 2, PALETTE.stoneDust, 5, 2);
}

export function drawSouthMeasureServicePipeRun(ctx, cx, cy, seed, opts = {}) {
  if (opts.wallPlane === 'se' || opts.wallPlane === 'sw') {
    drawWallPipe(ctx, cx, cy, seed, opts);
    return;
  }
  const orient = normalizeOrient(opts.orient);
  const variant = ['straight', 'elbow', 'valve'].includes(opts.variant) ? opts.variant : 'straight';
  const frame = isoFrame(cx, cy, orient);
  const connections = southMeasureRunConnections(orient, opts.connected ?? {});
  const elbowEndKeys = { se: 'yPlus', sw: 'xMinus', nw: 'yMinus', ne: 'xPlus' };
  const links = opts.connected ?? {};
  const endConnected = variant === 'elbow'
    ? Boolean(links.end ?? links[elbowEndKeys[orient]] ?? false)
    : connections.end;
  const lift = 9;

  const start = frame.point(-0.5, 0, lift);
  const corner = frame.point(0, 0, lift);
  const end = variant === 'elbow'
    ? frame.point(0, 0.5, lift)
    : frame.point(0.5, 0, lift);
  if (variant === 'elbow') {
    drawFloorPipeSupport(ctx, frame, -0.28, 0, lift);
    drawFloorPipeSupport(ctx, frame, 0, 0.28, lift);
  } else {
    drawFloorPipeSupport(ctx, frame, -0.28, 0, lift);
    drawFloorPipeSupport(ctx, frame, 0.28, 0, lift);
  }
  const segments = variant === 'elbow' ? [[start, corner], [corner, end]] : [[start, end]];
  for (const [segmentStart, segmentEnd] of segments) {
    linePx(ctx, segmentStart[0], segmentStart[1], segmentEnd[0], segmentEnd[1], PALETTE.outline, 5);
    linePx(ctx, segmentStart[0], segmentStart[1] - 1, segmentEnd[0], segmentEnd[1] - 1, PALETTE.rustDark, 3);
    nativeLinePx(ctx, segmentStart[0] + 0.5, segmentStart[1] - 2.5, segmentEnd[0] - 0.5, segmentEnd[1] - 2.5, PALETTE.rustLight);
  }
  if (!connections.start) drawPipeCollar(ctx, start, PALETTE.rustDark);
  if (!endConnected) drawPipeCollar(ctx, end, variant === 'elbow' ? PALETTE.stoneDark : PALETTE.rustDark);
  if (variant === 'elbow') drawPipeCollar(ctx, corner, PALETTE.rustDark);

  if (variant === 'valve') {
    const hub = frame.point(0, 0, lift + 1);
    drawPipeCollar(ctx, hub, PALETTE.rustMid);
    linePx(ctx, hub[0], hub[1], hub[0], hub[1] - 12, PALETTE.outline, 3);
    nativeLinePx(ctx, hub[0] - 0.5, hub[1] - 1.5, hub[0] - 0.5, hub[1] - 11.5, PALETTE.rustMid);
    drawMechanicalWheel(ctx, [hub[0], hub[1] - 15], 6, PALETTE.rustLight);
  }
}

export function drawSouthMeasureUtilityRailing(ctx, cx, cy, seed, opts = {}) {
  const orient = normalizeOrient(opts.orient);
  const frame = isoFrame(cx, cy, orient);
  const connections = southMeasureRunConnections(orient, opts.connected ?? {});
  const variant = ['service', 'intake', 'civic', 'broken'].includes(opts.variant) ? opts.variant : 'service';
  const metal = variant === 'civic' ? PALETTE.stoneDust : variant === 'intake' ? PALETTE.rustLight : PALETTE.rustMid;
  const start = frame.point(-0.5, 0);
  const end = frame.point(0.5, 0);

  const drawPost = (point) => {
    px(ctx, point[0] - 2, point[1] - 28, PALETTE.outline, 5, 30);
    px(ctx, point[0] - 1, point[1] - 27, PALETTE.rustDark, 3, 27);
    px(ctx, point[0], point[1] - 27, metal, 1, 22);
    px(ctx, point[0] - 2, point[1] - 31, PALETTE.outline, 5, 4);
  };
  if (!connections.start) drawPost(start);
  drawPost(end);
  for (const height of variant === 'broken' ? [27] : [14, 27]) {
    linePx(ctx, start[0], start[1] - height, end[0], end[1] - height, PALETTE.outline, 4);
    linePx(ctx, start[0], start[1] - height - 1, end[0], end[1] - height - 1, metal, 1);
  }
  if (variant === 'broken') {
    const breakA = frame.point(0.05, 0);
    const breakB = frame.point(0.33, 0);
    linePx(ctx, breakA[0], breakA[1] - 14, breakB[0], breakB[1] - 4, PALETTE.rustDark, 2);
  }
  nativeLinePx(ctx, start[0] + 2.5, start[1] - 27.5, end[0] - 2.5, end[1] - 27.5, metal);
  if (variant !== 'broken') nativeLinePx(ctx, start[0] + 3.5, start[1] - 14.5, end[0] - 3.5, end[1] - 14.5, PALETTE.rustLight);
}

const BOARD_VARIANTS = [
  'diagram',
  'schedules',
  'schedule',
  'route',
  'blood-card',
  'memorial',
  'slate',
  'prayer-card',
  'prayer-cards',
  'private-list',
  'handprints',
  'schedule-bank',
  'crawl-marks'
];

export function drawSouthMeasureWallBoard(ctx, cx, cy, seed, opts = {}) {
  const variant = BOARD_VARIANTS.includes(opts.variant) ? opts.variant : 'diagram';
  const wall = wallRunFace(ctx, cx, cy, {
    plane: opts.wallPlane === 'se' ? 'se' : 'sw',
    side: opts.wallSide === 'far' ? 'far' : 'near',
    span: variant === 'schedule-bank' || variant === 'private-list' ? 2 : 1
  });
  const board = faceTools(ctx, wall.point(0.1, 0.18), wall.point(0.9, 0.18), wall.point(0.9, 0.72), wall.point(0.1, 0.72));
  const darkBoard = variant === 'slate' || variant === 'memorial' || variant === 'crawl-marks';
  board.rect(0, 0, 1, 1, PALETTE.outline);
  board.rect(0.035, 0.055, 0.965, 0.95, darkBoard ? PALETTE.clothDark : PALETTE.woodDark);
  board.line(0.04, 0.04, 0.96, 0.04, PALETTE.woodLight, 2);

  if (variant === 'diagram') {
    // A pump cross-section: inlet, square impeller housing, rotor, outlet riser,
    // and a small pressure gauge. Large mechanical masses survive gameplay zoom.
    board.line(0.07, 0.57, 0.34, 0.57, PALETTE.outline, 5);
    board.line(0.08, 0.54, 0.34, 0.54, PALETTE.clothBlue, 2);
    board.rect(0.31, 0.28, 0.65, 0.78, PALETTE.outline);
    board.rect(0.36, 0.34, 0.6, 0.72, PALETTE.stoneMid);
    const rotor = board.point(0.48, 0.53);
    px(ctx, rotor[0] - 4, rotor[1] - 4, PALETTE.outline, 9, 9);
    px(ctx, rotor[0] - 2, rotor[1] - 2, PALETTE.rustMid, 5, 5);
    linePx(ctx, rotor[0] - 5, rotor[1], rotor[0] + 5, rotor[1], PALETTE.rustLight, 2);
    linePx(ctx, rotor[0], rotor[1] - 5, rotor[0], rotor[1] + 5, PALETTE.rustLight, 2);
    px(ctx, rotor[0] - 1, rotor[1] - 1, PALETTE.hostBone, 3, 3);
    board.line(0.64, 0.43, 0.83, 0.43, PALETTE.outline, 5);
    board.line(0.82, 0.45, 0.82, 0.2, PALETTE.outline, 5);
    board.line(0.64, 0.4, 0.8, 0.4, PALETTE.clothBlue, 2);
    board.line(0.8, 0.4, 0.8, 0.19, PALETTE.clothBlue, 2);
    board.line(0.35, 0.79, 0.61, 0.79, PALETTE.rustLight, 2);
    const gauge = board.point(0.18, 0.3);
    px(ctx, gauge[0] - 4, gauge[1] - 3, PALETTE.outline, 9, 7);
    px(ctx, gauge[0] - 2, gauge[1] - 2, PALETTE.stoneDust, 5, 4);
    linePx(ctx, gauge[0], gauge[1] + 1, gauge[0] + 2, gauge[1] - 1, PALETTE.clothRed, 1);
    board.line(0.18, 0.38, 0.18, 0.5, PALETTE.rustMid, 2);
  } else if (variant === 'schedule-bank') {
    // A single framed work bank with joined columns, route bands, shift pins,
    // and docket pockets. Its two-cell width survives broad map views.
    board.rect(0.04, 0.1, 0.96, 0.86, PALETTE.outline);
    board.rect(0.065, 0.13, 0.935, 0.82, PALETTE.stoneDark);
    board.rect(0.08, 0.16, 0.92, 0.28, PALETTE.clothBlueDark);
    board.line(0.1, 0.19, 0.88, 0.19, PALETTE.clothBlue, 2);
    for (const u of [0.34, 0.62]) board.line(u, 0.29, u, 0.79, PALETTE.rustLight, 2);
    for (let column = 0; column < 3; column += 1) {
      const left = 0.1 + column * 0.28;
      for (let row = 0; row < 3; row += 1) {
        const top = 0.34 + row * 0.14;
        const paper = (column + row) % 2 ? PALETTE.clothTan : PALETTE.stoneDust;
        board.rect(left, top, left + 0.2, top + 0.1, PALETTE.outline);
        board.rect(left + 0.012, top + 0.018, left + 0.188, top + 0.085, paper);
        board.line(left + 0.03, top + 0.05, left + 0.15, top + 0.05, PALETTE.stoneDark, 1);
      }
    }
    board.line(0.11, 0.74, 0.88, 0.34, PALETTE.rustMid, 2);
    for (const [u, v] of [[0.18, 0.7], [0.48, 0.55], [0.78, 0.4]]) {
      const marker = board.point(u, v);
      px(ctx, marker[0] - 2, marker[1] - 2, PALETTE.outline, 5, 5);
      px(ctx, marker[0] - 1, marker[1] - 1, PALETTE.clothRed, 3, 3);
    }
  } else if (variant === 'private-list') {
    // Two joined folios, one water-route header, and a real hasp make this a
    // secured records bank rather than another pinned notice board.
    board.rect(0.05, 0.1, 0.95, 0.9, PALETTE.outline);
    board.rect(0.075, 0.135, 0.925, 0.86, PALETTE.clothTan);
    board.rect(0.1, 0.17, 0.9, 0.32, PALETTE.clothBlueDark);
    board.line(0.12, 0.22, 0.42, 0.22, PALETTE.clothBlue, 3);
    board.line(0.42, 0.22, 0.42, 0.27, PALETTE.clothBlue, 3);
    board.line(0.42, 0.27, 0.82, 0.27, PALETTE.clothBlue, 3);
    for (const [u, v] of [[0.18, 0.22], [0.42, 0.27], [0.68, 0.27], [0.82, 0.27]]) {
      const routeMark = board.point(u, v);
      px(ctx, routeMark[0] - 2, routeMark[1] - 2, PALETTE.outline, 5, 5);
      px(ctx, routeMark[0] - 1, routeMark[1] - 1, PALETTE.clothBlue, 3, 3);
    }
    board.line(0.5, 0.34, 0.5, 0.83, PALETTE.stoneDark, 2);
    for (const v of [0.42, 0.53, 0.64, 0.75]) {
      board.line(0.13, v, 0.42, v, PALETTE.stoneDark, 1);
      board.line(0.58, v, 0.86, v, PALETTE.stoneDark, 1);
    }
    for (const u of [0.16, 0.2, 0.24, 0.28]) board.line(u, 0.36, u, 0.4, PALETTE.clothBlueDark, 2);
    board.rect(0.2, 0.11, 0.26, 0.89, PALETTE.rustDark);
    board.rect(0.74, 0.11, 0.8, 0.89, PALETTE.rustDark);

    const hasp = board.point(0.5, 0.58);
    linePx(ctx, hasp[0] - 4, hasp[1] - 7, hasp[0] + 4, hasp[1] - 7, PALETTE.outline, 3);
    linePx(ctx, hasp[0] - 4, hasp[1] - 7, hasp[0] - 4, hasp[1] - 2, PALETTE.rustLight, 2);
    linePx(ctx, hasp[0] + 4, hasp[1] - 7, hasp[0] + 4, hasp[1] - 2, PALETTE.rustDark, 2);
    px(ctx, hasp[0] - 6, hasp[1] - 3, PALETTE.outline, 13, 10);
    px(ctx, hasp[0] - 4, hasp[1] - 1, PALETTE.rustMid, 9, 6);
    px(ctx, hasp[0], hasp[1], PALETTE.void, 2, 4);

    const seal = board.point(0.66, 0.72);
    px(ctx, seal[0] - 4, seal[1] - 4, PALETTE.outline, 9, 9);
    px(ctx, seal[0] - 3, seal[1] - 3, PALETTE.clothRed, 7, 7);
    px(ctx, seal[0] - 1, seal[1] - 1, PALETTE.rustLight, 3, 3);
  } else if (variant === 'prayer-cards') {
    const cards = [
      [0.08, 0.18, 0.26, 0.64],
      [0.24, 0.1, 0.43, 0.57],
      [0.42, 0.2, 0.61, 0.74],
      [0.6, 0.12, 0.78, 0.58],
      [0.74, 0.3, 0.92, 0.84]
    ];
    for (let i = 0; i < cards.length; i += 1) {
      const [u0, v0, u1, v1] = cards[i];
      board.rect(u0, v0, u1, v1, PALETTE.outline);
      board.rect(u0 + 0.025, v0 + 0.035, u1 - 0.025, v1 - 0.035, i & 1 ? PALETTE.stoneDust : PALETTE.clothTan);
      const mid = (u0 + u1) / 2;
      board.line(mid, v0 + 0.12, mid, v1 - 0.09, PALETTE.clothRed, 1);
      board.line(mid - 0.045, v0 + 0.25, mid + 0.045, v0 + 0.25, PALETTE.clothRed, 1);
      board.line(u0 + 0.04, v1 - 0.12, u1 - 0.04, v1 - 0.12, PALETTE.stoneDark, 1);
    }
  } else if (variant === 'route') {
    board.line(0.08, 0.78, 0.92, 0.22, PALETTE.stoneDust, 2);
    board.line(0.14, 0.26, 0.76, 0.72, PALETTE.rustMid, 1);
    for (const [u, v] of [[0.18, 0.7], [0.45, 0.48], [0.72, 0.35]]) {
      const p = board.point(u, v);
      px(ctx, p[0] - 1, p[1] - 1, PALETTE.clothRed, 3, 3);
    }
  } else if (variant === 'slate') {
    for (const v of [0.25, 0.47, 0.7]) board.line(0.12, v, 0.84 - v * 0.08, v - 0.04, PALETTE.stoneDust, 1);
    board.line(0.18, 0.84, 0.78, 0.18, PALETTE.clothTan, 1);
  } else if (variant === 'handprints') {
    for (const [index, [u, v]] of [[0.2, 0.64], [0.5, 0.38], [0.78, 0.66]].entries()) {
      const palm = board.point(u, v);
      const color = index === 1 ? PALETTE.hostBone : PALETTE.stoneDust;
      px(ctx, palm[0] - 3, palm[1] - 3, PALETTE.outline, 7, 7);
      px(ctx, palm[0] - 2, palm[1] - 3, color, 5, 5);
      for (let finger = -2; finger <= 2; finger += 1) {
        const baseX = palm[0] + finger * 2;
        const lift = 7 + ((finger + index + 5) % 3);
        linePx(ctx, baseX, palm[1] - 2, baseX + (finger < 0 ? -1 : finger > 0 ? 1 : 0), palm[1] - lift, PALETTE.outline, 3);
        linePx(ctx, baseX, palm[1] - 3, baseX + (finger < 0 ? -1 : finger > 0 ? 1 : 0), palm[1] - lift, color, 1);
      }
      linePx(ctx, palm[0] - 2, palm[1] + 2, palm[0] + (index === 1 ? 3 : -3), palm[1] + 9, PALETTE.outline, 3);
      linePx(ctx, palm[0] - 1, palm[1] + 2, palm[0] + (index === 1 ? 3 : -3), palm[1] + 8, color, 1);
    }
    board.line(0.08, 0.18, 0.92, 0.12, PALETTE.stoneDust, 1);
    board.line(0.14, 0.88, 0.86, 0.82, PALETTE.rustDark, 2);
  } else if (variant === 'crawl-marks') {
    // Low palms, finger trails, and one chalk direction mark are kept broad
    // enough to read as a child's route rather than generic wall scratches.
    for (const [index, [u, v]] of [[0.22, 0.66], [0.48, 0.53], [0.73, 0.68]].entries()) {
      const palm = board.point(u, v);
      const color = index === 1 ? PALETTE.hostBone : PALETTE.stoneDust;
      px(ctx, palm[0] - 4, palm[1] - 3, PALETTE.outline, 9, 8);
      px(ctx, palm[0] - 2, palm[1] - 2, color, 5, 5);
      for (let finger = -2; finger <= 2; finger += 1) {
        const fingerX = palm[0] + finger * 2;
        linePx(ctx, fingerX, palm[1] - 2, fingerX + (finger < 0 ? -1 : finger > 0 ? 1 : 0), palm[1] - 10, PALETTE.outline, 3);
        linePx(ctx, fingerX, palm[1] - 3, fingerX + (finger < 0 ? -1 : finger > 0 ? 1 : 0), palm[1] - 9, color, 1);
      }
      linePx(ctx, palm[0] - 1, palm[1] + 2, palm[0] + (index - 1) * 7, palm[1] + 10, PALETTE.outline, 3);
      linePx(ctx, palm[0], palm[1] + 2, palm[0] + (index - 1) * 7, palm[1] + 9, color, 1);
    }
    board.line(0.08, 0.25, 0.82, 0.18, PALETTE.clothTan, 2);
    board.line(0.73, 0.11, 0.88, 0.18, PALETTE.clothTan, 3);
    board.line(0.75, 0.26, 0.88, 0.18, PALETTE.clothTan, 3);
    board.line(0.1, 0.85, 0.9, 0.8, PALETTE.rustDark, 3);
  } else {
    const cards = variant === 'prayer-card' ? [[0.35, 0.2, 0.65, 0.82]] : [[0.1, 0.14, 0.34, 0.43], [0.4, 0.1, 0.67, 0.47], [0.7, 0.2, 0.9, 0.58], [0.18, 0.55, 0.48, 0.86], [0.54, 0.57, 0.84, 0.88]];
    for (let i = 0; i < cards.length; i += 1) {
      const [u0, v0, u1, v1] = cards[i];
      board.rect(u0, v0, u1, v1, PALETTE.outline);
      board.rect(u0 + 0.02, v0 + 0.03, u1 - 0.02, v1 - 0.03, i % 2 ? PALETTE.stoneDust : PALETTE.clothTan);
      board.line(u0 + 0.04, v0 + 0.12, u1 - 0.04, v0 + 0.12, PALETTE.stoneDark, 1);
      if (variant === 'blood-card' || variant === 'prayer-card') board.line(u1 - 0.08, v0 + 0.08, u1 - 0.04, v1 - 0.08, PALETTE.clothRed, 1);
    }
  }

  const pin = board.point(0.16 + (hash2D(seed + 3, seed + 9) % 4) * 0.21, 0.1);
  px(ctx, pin[0] - 1, pin[1] - 1, PALETTE.rustLight, 2, 2);
  board.nativeLine(0.1, 0.08, 0.36, 0.08, PALETTE.woodLight);
  board.nativeLine(0.62, 0.91, 0.88, 0.91, PALETTE.woodDark);
  board.nativeLine(0.18, 0.48, 0.32, 0.48, darkBoard ? PALETTE.stoneDust : PALETTE.clothTan);
}

const WORKTABLE_VARIANTS = [
  'records',
  'clinic',
  'cup-repair',
  'burned-label',
  'council',
  'route',
  'meeting',
  'school',
  'family-meal',
  'evidence-bench'
];

function drawDomesticTableBench(ctx, frame, b) {
  for (const a of [-0.68, 0.68]) drawPropLeg(ctx, frame.point(a, b), 8, PALETTE.woodDark);
  const bench = orientedBox(ctx, shiftedFrame(frame, 0, b, 8), 1.58, 0.22, 4, {
    top: PALETTE.woodMid,
    lit: PALETTE.woodMid,
    shade: PALETTE.woodDark,
    outline: PALETTE.outline
  });
  linePx(ctx, bench.cap.left[0], bench.cap.left[1], bench.cap.top[0], bench.cap.top[1], PALETTE.woodLight, 1);
}

export function drawSouthMeasureWorktable(ctx, cx, cy, seed, opts = {}) {
  const variant = WORKTABLE_VARIANTS.includes(opts.variant) ? opts.variant : 'records';
  const frame = isoFrame(cx, cy, opts.orient);
  const lenA = variant === 'meeting'
    ? 2.28
    : variant === 'family-meal'
      ? 2.12
      : variant === 'evidence-bench'
        ? 2.36
        : variant === 'route'
          ? 2.08
        : variant === 'council'
          ? 1.78
          : variant === 'school'
            ? 1.25
            : 1.58;
  const lenB = variant === 'family-meal'
    ? 1
    : variant === 'meeting'
      ? 0.92
      : variant === 'evidence-bench'
        ? 1.12
        : variant === 'route'
          ? 0.96
          : variant === 'council'
            ? 0.84
        : 0.72;
  const halfA = lenA / 2;
  const halfB = lenB / 2;
  const height = variant === 'school' ? 15 : 18;
  const ext = footprintExtent(lenA, lenB);
  if (variant === 'family-meal') {
    // Two low benches establish a domestic gathering at the same human scale
    // as the shared dining furniture elsewhere in the district.
    drawDomesticTableBench(ctx, frame, -0.68);
    drawDomesticTableBench(ctx, frame, 0.68);
  }
  for (const [a, b] of [[-halfA + 0.08, -halfB + 0.08], [halfA - 0.08, -halfB + 0.08], [halfA - 0.08, halfB - 0.08], [-halfA + 0.08, halfB - 0.08]]) {
    drawPropLeg(ctx, frame.point(a, b), height, variant === 'clinic' ? PALETTE.rustDark : PALETTE.woodDark);
  }
  const table = orientedBox(ctx, frame, lenA, lenB, 6, {
    top: variant === 'clinic' ? PALETTE.stoneDust : variant === 'evidence-bench' || variant === 'burned-label' ? PALETTE.woodDark : PALETTE.woodMid,
    lit: variant === 'clinic' ? PALETTE.stoneMid : PALETTE.woodMid,
    shade: variant === 'clinic' ? PALETTE.stoneDark : PALETTE.woodDark,
    outline: PALETTE.outline
  }, height - 6);
  linePx(ctx, table.cap.left[0], table.cap.left[1], table.cap.top[0], table.cap.top[1], variant === 'clinic' ? PALETTE.hostBone : PALETTE.woodLight, 1);

  if (variant === 'clinic') {
    floorQuad(ctx, frame, -0.48, 0.05, -0.22, 0.18, height + 1, PALETTE.clothTan);
    for (const a of [0.18, 0.34, 0.5]) floorLine(ctx, frame, a, -0.18, a, 0.18, height + 2, PALETTE.rustLight, 2);
    const vial = frame.point(0.62, -0.08, height + 8);
    px(ctx, vial[0] - 2, vial[1] - 5, PALETTE.outline, 5, 7);
    px(ctx, vial[0] - 1, vial[1] - 4, PALETTE.clothBlue, 3, 4);
  } else if (variant === 'cup-repair') {
    floorQuad(ctx, frame, -0.38, 0.3, -0.28, 0.27, height + 1, PALETTE.outline);
    floorQuad(ctx, frame, -0.34, 0.26, -0.24, 0.23, height + 2, PALETTE.clothDark);

    // Long pliers and a hooked pick frame the repair instead of reading as
    // three more papers on a records desk.
    floorLine(ctx, frame, -0.7, 0.24, -0.3, -0.18, height + 3, PALETTE.outline, 4);
    floorLine(ctx, frame, -0.69, 0.23, -0.3, -0.18, height + 4, PALETTE.rustLight, 1);
    floorLine(ctx, frame, -0.32, -0.18, -0.19, -0.26, height + 4, PALETTE.rustLight, 2);
    floorLine(ctx, frame, -0.31, -0.17, -0.18, -0.08, height + 4, PALETTE.rustLight, 2);
    floorLine(ctx, frame, 0.26, 0.25, 0.64, -0.08, height + 3, PALETTE.outline, 3);
    floorLine(ctx, frame, 0.27, 0.24, 0.63, -0.08, height + 4, PALETTE.stoneDust, 1);

    const cup = frame.point(-0.03, 0.01, height + 2);
    px(ctx, cup[0] + 3, cup[1] - 8, PALETTE.outline, 6, 7);
    px(ctx, cup[0] + 4, cup[1] - 7, PALETTE.stoneDust, 4, 5);
    px(ctx, cup[0] + 5, cup[1] - 6, PALETTE.void, 2, 3);
    px(ctx, cup[0] - 5, cup[1] - 9, PALETTE.outline, 11, 10);
    px(ctx, cup[0] - 4, cup[1] - 8, PALETTE.stoneDust, 8, 8);
    px(ctx, cup[0] - 4, cup[1] - 9, PALETTE.hostBone, 8, 2);
    linePx(ctx, cup[0] - 1, cup[1] - 8, cup[0] + 2, cup[1] - 4, PALETTE.rustDark, 2);
    linePx(ctx, cup[0] + 2, cup[1] - 4, cup[0], cup[1], PALETTE.rustLight, 1);
    px(ctx, cup[0] + 1, cup[1] - 9, PALETTE.void, 4, 3);

    const shard = frame.point(0.38, 0.17, height + 3);
    poly(ctx, PALETTE.outline, [[shard[0] - 5, shard[1] + 1], [shard[0] + 4, shard[1] - 3], [shard[0] + 2, shard[1] + 4]]);
    poly(ctx, PALETTE.hostBone, [[shard[0] - 3, shard[1]], [shard[0] + 2, shard[1] - 2], [shard[0] + 1, shard[1] + 2]]);
    const binding = frame.point(0.57, -0.19, height + 4);
    px(ctx, binding[0] - 3, binding[1] - 5, PALETTE.outline, 7, 7);
    px(ctx, binding[0] - 2, binding[1] - 4, PALETTE.rustMid, 5, 5);
    px(ctx, binding[0] - 1, binding[1] - 5, PALETTE.rustLight, 3, 2);
  } else if (variant === 'route') {
    // One broad linen-backed road map fills the dispatch surface. Blue water
    // lines, rust road legs, weighted route tokens, and a straightedge keep it
    // readable as planning work rather than another desk with loose papers.
    floorQuad(ctx, frame, -0.94, 0.94, -0.39, 0.39, height + 2, PALETTE.outline);
    floorQuad(ctx, frame, -0.89, 0.89, -0.34, 0.34, height + 3, PALETTE.clothTan);
    for (const [a0, b0, a1, b1] of [
      [-0.78, 0.24, -0.36, -0.14],
      [-0.36, -0.14, 0.02, 0.08],
      [0.02, 0.08, 0.42, -0.2],
      [0.42, -0.2, 0.78, 0.16]
    ]) {
      floorLine(ctx, frame, a0, b0, a1, b1, height + 4, PALETTE.outline, 5);
      floorLine(ctx, frame, a0, b0, a1, b1, height + 5, PALETTE.rustMid, 2);
    }
    for (const [a0, b0, a1, b1] of [
      [-0.72, -0.24, -0.28, 0.12],
      [-0.28, 0.12, 0.18, -0.06],
      [0.18, -0.06, 0.7, 0.26]
    ]) {
      floorLine(ctx, frame, a0, b0, a1, b1, height + 4, PALETTE.clothBlueDark, 4);
      floorLine(ctx, frame, a0, b0, a1, b1, height + 5, PALETTE.clothBlue, 1);
    }
    for (const [index, [a, b]] of [[-0.78, 0.24], [-0.36, -0.14], [0.02, 0.08], [0.42, -0.2], [0.78, 0.16]].entries()) {
      const token = frame.point(a, b, height + 7);
      px(ctx, token[0] - 4, token[1] - 4, PALETTE.outline, 9, 8);
      px(ctx, token[0] - 2, token[1] - 3, index === 2 ? PALETTE.clothRed : PALETTE.rustLight, 5, 5);
      nativePx(ctx, token[0] - 0.5, token[1] - 2.5, PALETTE.hostBone);
    }
    floorLine(ctx, frame, -0.82, -0.31, 0.58, -0.31, height + 6, PALETTE.outline, 5);
    floorLine(ctx, frame, -0.8, -0.31, 0.56, -0.31, height + 7, PALETTE.stoneDust, 2);
    for (const a of [-0.6, -0.3, 0, 0.3]) {
      floorLine(ctx, frame, a, -0.34, a, -0.27, height + 7, PALETTE.rustDark, 1);
    }
  } else if (variant === 'family-meal') {
    floorQuad(ctx, frame, -0.86, 0.86, -0.09, 0.09, height + 1, PALETTE.clothDark);
    for (const [index, [a, b]] of [[-0.72, -0.31], [0, -0.32], [0.72, -0.31], [-0.72, 0.31], [0, 0.32], [0.72, 0.31]].entries()) {
      floorQuad(ctx, frame, a - 0.16, a + 0.16, b - 0.12, b + 0.12, height + 2, PALETTE.outline);
      floorQuad(ctx, frame, a - 0.115, a + 0.115, b - 0.085, b + 0.085, height + 3, index & 1 ? PALETTE.clothTan : PALETTE.stoneDust);
      const bowl = frame.point(a, b, height + 4);
      px(ctx, bowl[0] - 3, bowl[1] - 2, PALETTE.outline, 7, 4);
      px(ctx, bowl[0] - 2, bowl[1] - 2, index & 1 ? PALETTE.stoneDust : PALETTE.clothTan, 5, 2);
      floorLine(ctx, frame, a + 0.19, b - 0.1, a + 0.19, b + 0.1, height + 3, PALETTE.rustLight, 2);
      const cup = frame.point(a - 0.19, b, height + 6);
      px(ctx, cup[0] - 2, cup[1] - 5, PALETTE.outline, 6, 6);
      px(ctx, cup[0] - 1, cup[1] - 4, PALETTE.stoneMid, 4, 4);
      px(ctx, cup[0] - 1, cup[1] - 5, PALETTE.stoneLight, 3, 1);
    }
    const pot = frame.point(0, 0, height + 3);
    px(ctx, pot[0] - 7, pot[1] - 8, PALETTE.outline, 15, 9);
    px(ctx, pot[0] - 6, pot[1] - 7, PALETTE.rustDark, 13, 7);
    px(ctx, pot[0] - 4, pot[1] - 9, PALETTE.rustMid, 9, 3);
    px(ctx, pot[0] - 1, pot[1] - 11, PALETTE.rustLight, 3, 3);
  } else if (variant === 'meeting') {
    // One bound tally ledger dominates the center. Repeated docket places face
    // inward around it, unlike the loose papers on the council work surface.
    floorQuad(ctx, frame, -0.58, 0.58, -0.2, 0.2, height + 2, PALETTE.outline);
    floorQuad(ctx, frame, -0.53, 0.53, -0.16, 0.16, height + 3, PALETTE.clothTan);
    floorLine(ctx, frame, 0, -0.16, 0, 0.16, height + 4, PALETTE.rustDark, 3);
    for (const a of [-0.4, -0.24, -0.08, 0.16, 0.32]) {
      floorLine(ctx, frame, a, -0.11, a + 0.08, -0.11, height + 4, PALETTE.clothBlueDark, 2);
      floorLine(ctx, frame, a, 0.05, a + 0.08, 0.05, height + 4, PALETTE.clothBlue, 1);
    }
    for (const [index, [a, b]] of [[-0.82, -0.34], [0, -0.35], [0.82, -0.34], [-0.82, 0.34], [0, 0.35], [0.82, 0.34]].entries()) {
      floorQuad(ctx, frame, a - 0.13, a + 0.13, b - 0.08, b + 0.08, height + 2, PALETTE.outline);
      floorQuad(ctx, frame, a - 0.09, a + 0.09, b - 0.05, b + 0.05, height + 3, index & 1 ? PALETTE.stoneDust : PALETTE.clothTan);
      floorLine(ctx, frame, a - 0.06, b, a + 0.06, b, height + 4, PALETTE.stoneDark, 1);
    }
    for (const a of [-0.72, 0.72]) {
      const weight = frame.point(a, 0, height + 6);
      px(ctx, weight[0] - 3, weight[1] - 4, PALETTE.outline, 7, 6);
      px(ctx, weight[0] - 2, weight[1] - 3, PALETTE.rustMid, 5, 4);
      px(ctx, weight[0] - 1, weight[1] - 3, PALETTE.rustLight, 2, 1);
    }
  } else if (variant === 'evidence-bench') {
    floorQuad(ctx, frame, -1.08, 1.06, -0.47, 0.47, height + 1, PALETTE.outline);
    floorQuad(ctx, frame, -1.03, 1.01, -0.42, 0.42, height + 2, PALETTE.clothDark);
    for (const [a, b, w] of [[-0.8, -0.24, 0.42], [-0.72, 0.18, 0.38], [-0.34, -0.06, 0.34], [-0.2, 0.29, 0.3]]) {
      floorQuad(ctx, frame, a - w / 2, a + w / 2, b - 0.11, b + 0.11, height + 3, PALETTE.outline);
      floorQuad(ctx, frame, a - w / 2 + 0.04, a + w / 2 - 0.05, b - 0.07, b + 0.07, height + 4, PALETTE.clothTan);
      floorLine(ctx, frame, a - w / 2 + 0.06, b, a + w / 2 - 0.07, b, height + 5, PALETTE.clothRed, 2);
      floorLine(ctx, frame, a + w / 2 - 0.09, b - 0.07, a + w / 2 - 0.03, b + 0.07, height + 5, PALETTE.rustDark, 2);
    }
    for (const [a0, b0, a1, b1] of [
      [-0.18, 0.38, 0.34, -0.34],
      [-0.05, -0.36, 0.39, 0.26]
    ]) {
      floorLine(ctx, frame, a0, b0, a1, b1, height + 4, PALETTE.outline, 5);
      floorLine(ctx, frame, a0, b0, a1, b1, height + 5, PALETTE.rustLight, 2);
    }
    const evidenceFrame = shiftedFrame(frame, 0.67, 0.02, height + 2);
    const evidence = orientedBox(ctx, evidenceFrame, 0.72, 0.62, 13, {
      top: PALETTE.stoneDark,
      lit: PALETTE.rustMid,
      shade: PALETTE.rustDark,
      outline: PALETTE.outline
    });
    linePx(ctx, evidence.cap.left[0], evidence.cap.left[1], evidence.cap.top[0], evidence.cap.top[1], PALETTE.rustLight, 1);
    linePx(ctx, evidence.cap.top[0], evidence.cap.top[1], evidence.cap.bottom[0], evidence.cap.bottom[1], PALETTE.clothRed, 2);
    floorQuad(ctx, evidenceFrame, -0.25, 0.25, -0.2, 0.2, 13.5, PALETTE.stoneDust);
    floorLine(ctx, evidenceFrame, -0.2, -0.12, 0.19, 0.12, 14.5, PALETTE.clothRed, 3);
    px(ctx, evidence.cap.right[0] - 5, evidence.cap.right[1] - 2, PALETTE.void, 9, 7);
    const bundleFrame = shiftedFrame(frame, 0.05, 0.28, height + 2);
    const bundle = orientedBox(ctx, bundleFrame, 0.48, 0.3, 9, {
      top: PALETTE.clothTan,
      lit: PALETTE.stoneDust,
      shade: PALETTE.woodDark,
      outline: PALETTE.outline
    });
    linePx(ctx, bundle.cap.top[0], bundle.cap.top[1], bundle.cap.bottom[0], bundle.cap.bottom[1], PALETTE.clothRed, 3);
  } else if (variant === 'burned-label') {
    // Sorted labels approach a scorched patch and a split ash tray. The trail
    // ties the damaged container to the work instead of reading as loose clutter.
    for (const [index, [a, b]] of [[-0.58, -0.2], [-0.34, 0.16], [-0.08, -0.13]].entries()) {
      floorQuad(ctx, frame, a - 0.18, a + 0.18, b - 0.1, b + 0.1, height + 2, PALETTE.outline);
      floorQuad(ctx, frame, a - 0.14, a + 0.12, b - 0.065, b + 0.065, height + 3, index & 1 ? PALETTE.stoneDust : PALETTE.clothTan);
      floorLine(ctx, frame, a - 0.11, b, a + 0.07, b, height + 4, PALETTE.rustDark, 2);
      floorQuad(ctx, frame, a + 0.07, a + 0.14, b - 0.07, b + 0.03, height + 4, PALETTE.clothDark);
    }
    poly(ctx, PALETTE.outline, [
      frame.point(0.04, -0.25, height + 2),
      frame.point(0.5, -0.18, height + 2),
      frame.point(0.57, 0.18, height + 2),
      frame.point(0.16, 0.28, height + 2),
      frame.point(-0.02, 0.05, height + 2)
    ]);
    poly(ctx, PALETTE.clothDark, [
      frame.point(0.09, -0.19, height + 3),
      frame.point(0.45, -0.13, height + 3),
      frame.point(0.49, 0.13, height + 3),
      frame.point(0.18, 0.21, height + 3),
      frame.point(0.04, 0.03, height + 3)
    ]);
    for (const [a, b] of [[0.04, 0.15], [0.17, 0.05], [0.29, -0.02]]) {
      const ash = frame.point(a, b, height + 5);
      px(ctx, ash[0] - 2, ash[1] - 1, PALETTE.stoneDark, 4, 2);
    }
    const ashTrayFrame = shiftedFrame(frame, 0.52, 0.03, height + 1);
    const ashTray = orientedBox(ctx, ashTrayFrame, 0.5, 0.42, 8, {
      top: PALETTE.outline,
      lit: PALETTE.rustDark,
      shade: PALETTE.clothDark,
      outline: PALETTE.outline
    });
    floorQuad(ctx, ashTrayFrame, -0.19, 0.19, -0.14, 0.14, 8.5, PALETTE.stoneDark);
    linePx(ctx, ashTray.cap.left[0], ashTray.cap.left[1], ashTray.cap.top[0], ashTray.cap.top[1], PALETTE.rustLight, 2);
    poly(ctx, PALETTE.void, [
      [ashTray.cap.right[0] - 6, ashTray.cap.right[1] - 1],
      [ashTray.cap.right[0] + 2, ashTray.cap.right[1] - 3],
      [ashTray.cap.right[0] + 1, ashTray.cap.right[1] + 5]
    ]);
  } else {
    const paperColor = variant === 'school' ? PALETTE.clothDark : PALETTE.clothTan;
    for (const [a, b, w] of [[-0.42, -0.13, 0.32], [0.02, 0.14, 0.4], [0.47, -0.08, 0.28]]) {
      if (Math.abs(a) + w > halfA) continue;
      floorQuad(ctx, frame, a - w / 2, a + w / 2, b - 0.12, b + 0.12, height + 2, PALETTE.outline);
      floorQuad(ctx, frame, a - w / 2 + 0.03, a + w / 2 - 0.03, b - 0.09, b + 0.09, height + 3, paperColor);
      floorLine(ctx, frame, a - w / 2 + 0.05, b, a + w / 2 - 0.05, b, height + 4, variant === 'council' ? PALETTE.clothRed : PALETTE.stoneDark, 1);
    }
  }
  if ((seed & 1) === 0 && variant !== 'clinic') floorLine(ctx, frame, -0.68, 0.27, -0.22, 0.27, height + 2, PALETTE.rustDark, 1);
  nativeLinePx(ctx, table.cap.left[0] + 1.5, table.cap.left[1] - 0.5, table.cap.top[0] - 1.5, table.cap.top[1] + 0.5, variant === 'clinic' ? PALETTE.hostBone : PALETTE.woodLight);
  const grainA = frame.point(-halfA + 0.08, 0.24, height + 0.5);
  const grainB = frame.point(halfA - 0.08, 0.24, height + 0.5);
  nativeLinePx(ctx, grainA[0], grainA[1], grainB[0], grainB[1], variant === 'clinic' ? PALETTE.stoneMid : PALETTE.woodDark);
  if (variant === 'clinic') {
    const paperA = frame.point(-0.44, -0.12, height + 2.5);
    const paperB = frame.point(-0.02, -0.12, height + 2.5);
    nativeLinePx(ctx, paperA[0], paperA[1], paperB[0], paperB[1], PALETTE.stoneDust);
    const vial = frame.point(0.62, -0.08, height + 8);
    nativeLinePx(ctx, vial[0] - 1.5, vial[1] - 3.5, vial[0] + 1.5, vial[1] - 3.5, PALETTE.clothBlue);
  } else if (variant === 'cup-repair') {
    const repairA = frame.point(-0.25, 0.2, height + 4.5);
    const repairB = frame.point(0.2, -0.2, height + 4.5);
    nativeLinePx(ctx, repairA[0], repairA[1], repairB[0], repairB[1], PALETTE.rustLight);
  } else if (variant === 'family-meal') {
    const runnerA = frame.point(-0.72, 0, height + 2.5);
    const runnerB = frame.point(0.72, 0, height + 2.5);
    nativeLinePx(ctx, runnerA[0], runnerA[1], runnerB[0], runnerB[1], PALETTE.clothTan);
  } else if (variant === 'meeting') {
    const ledgerA = frame.point(-0.48, -0.1, height + 4.5);
    const ledgerB = frame.point(0.48, -0.1, height + 4.5);
    nativeLinePx(ctx, ledgerA[0], ledgerA[1], ledgerB[0], ledgerB[1], PALETTE.clothBlue);
  } else if (variant === 'route') {
    const routeA = frame.point(-0.76, 0.22, height + 5.5);
    const routeB = frame.point(0.76, 0.15, height + 5.5);
    nativeLinePx(ctx, routeA[0], routeA[1], routeB[0], routeB[1], PALETTE.rustLight);
  } else if (variant === 'evidence-bench') {
    const toolA = frame.point(-0.17, 0.27, height + 5.5);
    const toolB = frame.point(0.2, -0.24, height + 5.5);
    nativeLinePx(ctx, toolA[0], toolA[1], toolB[0], toolB[1], PALETTE.rustLight);
  } else if (variant === 'burned-label') {
    const charA = frame.point(0.04, 0.15, height + 5.5);
    const charB = frame.point(0.4, -0.08, height + 5.5);
    nativeLinePx(ctx, charA[0], charA[1], charB[0], charB[1], PALETTE.stoneDark);
  } else {
    const ruleA = frame.point(-0.52, -0.1, height + 3.5);
    const ruleB = frame.point(-0.24, -0.1, height + 3.5);
    nativeLinePx(ctx, ruleA[0], ruleA[1], ruleB[0], ruleB[1], variant === 'council' ? PALETTE.clothRed : PALETTE.stoneDark);
  }
}

const STORAGE_VARIANTS = [
  'archive-shelf',
  'lime-records-chest',
  'medicine-shelf',
  'locked-cabinet',
  'current-records',
  'work-shelf',
  'school-tools',
  'burial-copies',
  'suspect-shelf',
  'clean-shelf'
];

function drawSouthMeasureOpenRack(ctx, cx, cy, seed, frame, variant) {
  const school = variant === 'school-tools';
  const lenA = school ? 1.5 : 1.64;
  const lenB = 0.48;
  const halfA = lenA / 2;
  const halfB = lenB / 2;
  const rackHeight = school ? 39 : 37;
  const ext = footprintExtent(lenA, lenB);

  // Open posts and crossed rear braces leave daylight between the shelves.
  const rearLow = frame.point(-halfA + 0.05, -halfB + 0.03, 5);
  const rearHigh = frame.point(halfA - 0.05, -halfB + 0.03, rackHeight - 3);
  const rearLowOther = frame.point(halfA - 0.05, -halfB + 0.03, 5);
  const rearHighOther = frame.point(-halfA + 0.05, -halfB + 0.03, rackHeight - 3);
  linePx(ctx, rearLow[0], rearLow[1], rearHigh[0], rearHigh[1], PALETTE.outline, 4);
  linePx(ctx, rearLow[0], rearLow[1] - 1, rearHigh[0], rearHigh[1] - 1, PALETTE.rustDark, 1);
  linePx(ctx, rearLowOther[0], rearLowOther[1], rearHighOther[0], rearHighOther[1], PALETTE.outline, 4);
  linePx(ctx, rearLowOther[0], rearLowOther[1] - 1, rearHighOther[0], rearHighOther[1] - 1, PALETTE.woodLight, 1);
  for (const [a, b] of [
    [-halfA + 0.04, -halfB + 0.03],
    [halfA - 0.04, -halfB + 0.03],
    [halfA - 0.04, halfB - 0.03],
    [-halfA + 0.04, halfB - 0.03]
  ]) drawPropLeg(ctx, frame.point(a, b), rackHeight, school ? PALETTE.woodDark : PALETTE.rustDark);

  for (const lift of [4, 17, 30]) {
    const shelf = orientedBox(ctx, frame, lenA, lenB, 4, {
      top: PALETTE.woodMid,
      lit: PALETTE.woodMid,
      shade: PALETTE.woodDark,
      outline: PALETTE.outline
    }, lift);
    linePx(ctx, shelf.cap.left[0], shelf.cap.left[1], shelf.cap.top[0], shelf.cap.top[1], PALETTE.woodLight, 1);
  }

  if (school) {
    // Upright slates and lesson cards sit against the open back. Their broad
    // geometry survives native scale while the empty bays remain visible.
    const slateFace = faceTools(
      ctx,
      frame.point(-0.65, -0.16, 37),
      frame.point(0.04, -0.16, 37),
      frame.point(0.04, -0.16, 22),
      frame.point(-0.65, -0.16, 22)
    );
    slateFace.rect(0, 0, 1, 1, PALETTE.outline);
    slateFace.rect(0.06, 0.08, 0.94, 0.91, PALETTE.clothDark);
    slateFace.line(0.13, 0.27, 0.84, 0.27, PALETTE.clothBlue, 2);
    slateFace.line(0.18, 0.72, 0.47, 0.4, PALETTE.stoneDust, 2);
    slateFace.line(0.47, 0.4, 0.78, 0.74, PALETTE.stoneDust, 2);

    const lessonFace = faceTools(
      ctx,
      frame.point(0.12, -0.16, 36),
      frame.point(0.64, -0.16, 36),
      frame.point(0.64, -0.16, 23),
      frame.point(0.12, -0.16, 23)
    );
    lessonFace.rect(0, 0, 1, 1, PALETTE.outline);
    lessonFace.rect(0.07, 0.08, 0.93, 0.91, PALETTE.clothTan);
    for (const v of [0.28, 0.48, 0.68]) lessonFace.line(0.16, v, 0.8, v, PALETTE.clothBlueDark, 1);

    floorLine(ctx, frame, -0.52, 0.09, -0.05, -0.15, 23, PALETTE.outline, 5);
    floorLine(ctx, frame, -0.51, 0.08, -0.05, -0.15, 24, PALETTE.clothTan, 2);
    floorLine(ctx, frame, -0.05, -0.15, 0.31, 0.13, 23, PALETTE.outline, 5);
    floorLine(ctx, frame, -0.05, -0.14, 0.3, 0.13, 24, PALETTE.clothTan, 2);
    floorLine(ctx, frame, 0.3, 0.13, -0.52, 0.09, 23, PALETTE.outline, 5);
    floorLine(ctx, frame, 0.29, 0.12, -0.51, 0.09, 24, PALETTE.clothTan, 2);
    floorLine(ctx, frame, 0.31, -0.12, 0.66, 0.12, 23, PALETTE.rustLight, 3);
    for (const a of [-0.5, -0.18, 0.18, 0.5]) {
      floorQuad(ctx, frame, a - 0.12, a + 0.12, -0.13, 0.13, 9, PALETTE.outline);
      floorQuad(ctx, frame, a - 0.09, a + 0.09, -0.09, 0.09, 10, a < 0 ? PALETTE.clothTan : PALETTE.stoneDust);
    }
  } else {
    // Bins, pipe stock, hand tools, and couplings fill the bays without ever
    // closing the rack into a freight-crate silhouette.
    for (const [index, a] of [-0.5, 0, 0.5].entries()) {
      const bin = orientedBox(ctx, shiftedFrame(frame, a, 0, 8), 0.34, 0.3, 7, {
        top: index === 1 ? PALETTE.stoneMid : PALETTE.rustMid,
        lit: PALETTE.rustMid,
        shade: PALETTE.rustDark,
        outline: PALETTE.outline
      });
      linePx(ctx, bin.cap.left[0], bin.cap.left[1], bin.cap.top[0], bin.cap.top[1], PALETTE.rustLight, 1);
    }
    for (const b of [-0.13, 0, 0.13]) {
      floorLine(ctx, frame, -0.61, b, 0.2, b, 22, PALETTE.outline, 5);
      floorLine(ctx, frame, -0.59, b, 0.18, b, 23, PALETTE.rustLight, 2);
    }
    for (const a of [0.34, 0.48, 0.62]) {
      const coupling = frame.point(a, 0.03, 25);
      px(ctx, coupling[0] - 4, coupling[1] - 4, PALETTE.outline, 9, 8);
      px(ctx, coupling[0] - 2, coupling[1] - 3, PALETTE.stoneMid, 5, 6);
      px(ctx, coupling[0] - 1, coupling[1] - 2, PALETTE.void, 3, 4);
      nativePx(ctx, coupling[0] - 2.5, coupling[1] - 3.5, PALETTE.rustLight);
    }
    const toolStart = frame.point(-0.56, -0.12, 36);
    const toolEnd = frame.point(-0.3, 0.11, 24);
    linePx(ctx, toolStart[0], toolStart[1], toolEnd[0], toolEnd[1], PALETTE.outline, 5);
    linePx(ctx, toolStart[0], toolStart[1] - 1, toolEnd[0], toolEnd[1] - 1, PALETTE.rustLight, 2);
    const jawA = frame.point(-0.63, -0.08, 37);
    const jawB = frame.point(-0.49, -0.16, 36);
    linePx(ctx, jawA[0], jawA[1], toolStart[0], toolStart[1], PALETTE.rustLight, 3);
    linePx(ctx, jawB[0], jawB[1], toolStart[0], toolStart[1], PALETTE.rustLight, 3);
    for (const a of [-0.04, 0.21, 0.46, 0.65]) {
      const stock = frame.point(a, 0, 36);
      px(ctx, stock[0] - 3, stock[1] - 5, PALETTE.outline, 7, 7);
      px(ctx, stock[0] - 2, stock[1] - 4, a < 0.3 ? PALETTE.rustMid : PALETTE.stoneMid, 5, 5);
      px(ctx, stock[0] - 1, stock[1] - 4, PALETTE.rustLight, 2, 1);
    }
  }

  nativeLinePx(ctx, rearLowOther[0] + 0.5, rearLowOther[1] - 1.5, rearHighOther[0] + 0.5, rearHighOther[1] - 1.5, PALETTE.woodLight);
  void seed;
}

export function drawSouthMeasureStorage(ctx, cx, cy, seed, opts = {}) {
  const variant = STORAGE_VARIANTS.includes(opts.variant) ? opts.variant : 'archive-shelf';
  const frame = isoFrame(cx, cy, opts.orient);
  if (variant === 'work-shelf' || variant === 'school-tools') {
    drawSouthMeasureOpenRack(ctx, cx, cy, seed, frame, variant);
    return;
  }
  const chest = variant === 'lime-records-chest';
  const controlled = variant === 'suspect-shelf';
  const publicMemory = variant === 'burial-copies';
  const closedCabinet = variant === 'locked-cabinet' || controlled;
  const cleanShelf = variant === 'clean-shelf';
  const wideShelf = publicMemory || cleanShelf;
  const height = chest
    ? 23
    : controlled
      ? 50
      : variant === 'locked-cabinet'
        ? 48
        : publicMemory
          ? 46
          : cleanShelf
            ? 45
            : 43;
  const lenA = chest
    ? 1.25
    : cleanShelf
      ? 1.64
      : publicMemory
        ? 1.52
        : controlled
          ? 1.14
          : 1.08;
  const lenB = chest ? 0.78 : controlled ? 0.62 : wideShelf ? 0.54 : 0.58;
  const ext = footprintExtent(lenA, lenB);
  const box = orientedBox(ctx, frame, lenA, lenB, height, {
    top: chest || cleanShelf || controlled ? PALETTE.stoneDust : PALETTE.woodMid,
    lit: chest ? PALETTE.clothTan : cleanShelf || controlled ? PALETTE.stoneMid : PALETTE.woodMid,
    shade: chest ? PALETTE.stoneMid : cleanShelf || controlled ? PALETTE.stoneDark : PALETTE.woodDark,
    outline: PALETTE.outline
  });
  const lit = faceTools(ctx, box.cap.left, box.cap.bottom, box.base.bottom, box.base.left);
  const shade = faceTools(ctx, box.cap.bottom, box.cap.right, box.base.right, box.base.bottom);

  if (chest) {
    for (const face of [lit, shade]) {
      face.line(0.04, 0.2, 0.96, 0.2, PALETTE.hostBone, 2);
      face.line(0.04, 0.73, 0.96, 0.73, PALETTE.stoneDark, 2);
      face.line(0.12, 0.18, 0.88, 0.8, PALETTE.rustDark, 2);
    }
    floorQuad(ctx, frame, -0.22, 0.22, -0.18, 0.18, height + 2, PALETTE.outline);
    floorQuad(ctx, frame, -0.18, 0.18, -0.14, 0.14, height + 3, PALETTE.clothTan);
  } else if (closedCabinet) {
    for (const face of [lit, shade]) {
      face.rect(0.05, 0.05, 0.95, 0.96, PALETTE.outline);
      face.rect(0.1, 0.09, 0.9, 0.92, controlled ? PALETTE.clothDark : PALETTE.rustDark);
      face.line(0.5, 0.1, 0.5, 0.91, PALETTE.outline, 3);
      if (controlled) {
        face.rect(0.15, 0.25, 0.85, 0.48, PALETTE.outline);
        face.rect(0.2, 0.29, 0.8, 0.44, PALETTE.clothRed);
        face.line(0.25, 0.35, 0.75, 0.35, PALETTE.hostBone, 1);
        for (const v of [0.59, 0.76]) {
          face.line(0.13, v, 0.87, v, PALETTE.outline, 2);
          face.line(0.16, v - 0.025, 0.84, v - 0.025, PALETTE.stoneDust, 1);
        }
        face.line(0.18, 0.16, 0.82, 0.86, PALETTE.rustMid, 2);
        face.line(0.82, 0.16, 0.18, 0.86, PALETTE.rustDark, 2);
      } else {
        for (const v of [0.22, 0.76]) {
          face.line(0.12, v, 0.88, v, PALETTE.stoneDark, 2);
          face.line(0.14, v - 0.02, 0.86, v - 0.02, PALETTE.rustLight, 1);
        }
        face.rect(0.2, 0.31, 0.42, 0.45, PALETTE.outline);
        face.rect(0.23, 0.34, 0.39, 0.42, PALETTE.stoneDust);
      }
    }
  } else {
    for (const [face, shaded] of [[lit, false], [shade, true]]) {
      face.rect(0.05, 0.06, 0.95, 0.95, PALETTE.outline);
      face.rect(0.09, 0.09, 0.91, 0.92, variant === 'medicine-shelf' || cleanShelf ? PALETTE.stoneDark : PALETTE.woodDark);
      for (const v of [0.31, 0.57, 0.82]) {
        face.line(0.08, v, 0.92, v, PALETTE.outline, 3);
        face.line(0.1, v - 0.018, 0.9, v - 0.018, shaded ? PALETTE.rustDark : cleanShelf ? PALETTE.stoneDust : PALETTE.woodLight, 1);
      }
    }

    if (publicMemory) {
      for (const [face, shaded] of [[lit, false], [shade, true]]) {
        const paper = shaded ? PALETTE.stoneMid : PALETTE.hostBone;
        const paperShade = shaded ? PALETTE.stoneDark : PALETTE.clothTan;
        for (let row = 0; row < 3; row += 1) {
          for (let column = 0; column < 4; column += 1) {
            const u = 0.12 + column * 0.2;
            const v = 0.13 + row * 0.25;
            face.rect(u, v, u + 0.15, v + 0.13, PALETTE.outline);
            face.rect(u + 0.02, v + 0.02, u + 0.13, v + 0.11, (column + row) & 1 ? paper : paperShade);
            face.line(u + 0.055, v + 0.02, u + 0.055, v + 0.11, PALETTE.clothDark, 2);
            face.line(u + 0.09, v + 0.04, u + 0.12, v + 0.04, PALETTE.rustDark, 1);
          }
        }
        face.rect(0.4, 0.84, 0.6, 0.94, PALETTE.outline);
        face.rect(0.43, 0.86, 0.57, 0.92, PALETTE.clothRed);
        face.line(0.48, 0.87, 0.52, 0.91, PALETTE.hostBone, 1);
        face.line(0.52, 0.87, 0.48, 0.91, PALETTE.hostBone, 1);
      }
    } else if (cleanShelf) {
      for (const face of [lit, shade]) {
        for (const u of [0.14, 0.38, 0.62]) {
          face.rect(u, 0.13, u + 0.18, 0.26, PALETTE.outline);
          face.rect(u + 0.02, 0.15, u + 0.16, 0.24, PALETTE.clothTan);
          face.rect(u + 0.07, 0.17, u + 0.11, 0.23, PALETTE.stoneDark);
        }
        for (let i = 0; i < 5; i += 1) {
          const u = 0.13 + i * 0.15;
          face.rect(u, 0.37, u + 0.09, 0.54, PALETTE.outline);
          face.rect(u + 0.02, 0.4, u + 0.07, 0.52, i & 1 ? PALETTE.clothBlue : PALETTE.stoneDust);
          face.line(u + 0.02, 0.39, u + 0.07, 0.39, PALETTE.hostBone, 1);
        }
        for (const [u, color] of [[0.13, PALETTE.rustMid], [0.38, PALETTE.stoneDust], [0.64, PALETTE.rustLight]]) {
          face.rect(u, 0.65, u + 0.19, 0.79, PALETTE.outline);
          face.rect(u + 0.02, 0.68, u + 0.17, 0.77, color);
          face.line(u + 0.04, 0.72, u + 0.15, 0.72, PALETTE.clothTan, 1);
        }
        for (const u of [0.18, 0.32, 0.72, 0.82]) face.rect(u, 0.85, u + 0.07, 0.91, PALETTE.hostBone);
      }
    } else {
      const rng = rngFrom(hash2D(seed + 101, seed * 7 + 13));
      for (const face of [lit, shade]) {
        for (let row = 0; row < 3; row += 1) {
          for (let i = 0; i < 4; i += 1) {
            const u = 0.13 + i * 0.2 + rng() * 0.04;
            const v = 0.18 + row * 0.25;
            const color = variant === 'medicine-shelf'
              ? (i % 2 ? PALETTE.clothBlueDark : PALETTE.clothTan)
              : variant === 'current-records'
                ? (i === row ? PALETTE.clothBlue : i % 2 ? PALETTE.stoneDust : PALETTE.clothTan)
                : (i % 2 ? PALETTE.stoneDust : PALETTE.clothTan);
            face.rect(u, v, u + 0.1, v + 0.09, color);
            face.line(u, v, u + 0.1, v, PALETTE.hostBone, 1);
            if (variant === 'current-records' && i === row) face.line(u + 0.02, v + 0.04, u + 0.08, v + 0.04, PALETTE.clothBlueDark, 1);
          }
        }
      }
    }
  }

  if (closedCabinet || opts.locked) {
    const lock = lit.point(0.55, 0.52);
    px(ctx, lock[0] - 3, lock[1] - 2, PALETTE.outline, 7, 6);
    px(ctx, lock[0] - 2, lock[1] - 1, PALETTE.rustLight, 5, 4);
    px(ctx, lock[0], lock[1], PALETTE.void, 1, 2);
  }
  nativeLinePx(
    ctx,
    box.cap.left[0] + 1.5,
    box.cap.left[1] - 0.5,
    box.cap.top[0] - 1.5,
    box.cap.top[1] + 0.5,
    chest ? PALETTE.hostBone : cleanShelf || controlled ? PALETTE.stoneLight : PALETTE.woodLight
  );
  if (chest) {
    lit.nativeLine(0.08, 0.19, 0.92, 0.19, PALETTE.hostBone);
    shade.nativeLine(0.08, 0.72, 0.92, 0.72, PALETTE.stoneDark);
    const labelA = frame.point(-0.17, -0.1, height + 3.5);
    const labelB = frame.point(0.17, -0.1, height + 3.5);
    nativeLinePx(ctx, labelA[0], labelA[1], labelB[0], labelB[1], PALETTE.stoneDark);
  } else if (closedCabinet) {
    lit.nativeLine(0.12, 0.2, 0.44, 0.2, controlled ? PALETTE.clothRed : PALETTE.rustLight);
    shade.nativeLine(0.56, 0.76, 0.86, 0.76, controlled ? PALETTE.stoneDust : PALETTE.rustDark);
  } else {
    lit.nativeLine(0.12, 0.3, 0.88, 0.3, cleanShelf ? PALETTE.stoneDust : PALETTE.woodLight);
    shade.nativeLine(0.12, 0.56, 0.88, 0.56, PALETTE.rustDark);
    if (variant === 'medicine-shelf') lit.nativeLine(0.16, 0.19, 0.26, 0.19, PALETTE.clothBlue);
    if (variant === 'current-records') lit.nativeLine(0.36, 0.44, 0.46, 0.44, PALETTE.clothBlue);
    if (publicMemory) lit.nativeLine(0.12, 0.16, 0.86, 0.16, PALETTE.hostBone);
    if (cleanShelf) lit.nativeLine(0.13, 0.39, 0.82, 0.39, PALETTE.hostBone);
  }
  if (closedCabinet || opts.locked) {
    const lock = lit.point(0.55, 0.52);
    nativePx(ctx, lock[0] - 0.5, lock[1] - 0.5, PALETTE.stoneLight);
  }
}

export function drawSouthMeasureCustodyRest(ctx, cx, cy, seed, opts = {}) {
  const frame = isoFrame(cx, cy, opts.orient);

  // A scuffed rectangular footprint and four mounting scars make the missing
  // bench legible as an absence. Only the iron end brackets remain above it.
  for (const [a0, b0, a1, b1] of [
    [-0.72, -0.31, 0.72, -0.31],
    [0.72, -0.31, 0.72, 0.31],
    [0.72, 0.31, -0.72, 0.31],
    [-0.72, 0.31, -0.72, -0.31]
  ]) floorLine(ctx, frame, a0, b0, a1, b1, 1, PALETTE.stoneDust, 3);
  for (const a of [-0.48, 0.48]) {
    floorLine(ctx, frame, a - 0.12, -0.18, a + 0.12, 0.18, 2, PALETTE.rustDark, 3);
    floorLine(ctx, frame, a + 0.12, -0.18, a - 0.12, 0.18, 2, PALETTE.rustLight, 1);
    const bracketFrame = shiftedFrame(frame, a, 0, 2);
    orientedBox(ctx, bracketFrame, 0.15, 0.22, 7, {
      top: PALETTE.stoneMid,
      lit: PALETTE.rustMid,
      shade: PALETTE.rustDark,
      outline: PALETTE.outline
    });
  }
  floorLine(ctx, frame, -0.35, 0, 0.32, 0, 2, PALETTE.woodDark, 2);
  floorLine(ctx, frame, -0.18, -0.13, 0.18, 0.13, 2, PALETTE.clothTan, 1);
  const emptyMark = frame.point(0, 0, 3);
  px(ctx, emptyMark[0] - 2, emptyMark[1] - 2, PALETTE.outline, 5, 5);
  px(ctx, emptyMark[0] - 1, emptyMark[1] - 1, PALETTE.clothRed, 3, 3);
  nativeLinePx(ctx, emptyMark[0] - 18.5, emptyMark[1] - 8.5, emptyMark[0] + 18.5, emptyMark[1] + 8.5, PALETTE.stoneDust);
  nativePx(ctx, emptyMark[0] - 0.5, emptyMark[1] - 0.5, PALETTE.hostBone);
}

export function drawSouthMeasureMeshCagePanel(ctx, cx, cy, seed, opts = {}) {
  const orient = normalizeOrient(opts.orient);
  const frame = isoFrame(cx, cy, orient);
  const connections = southMeasureRunConnections(orient, opts.connected ?? {});
  const variant = ['parts', 'ledger', 'bonded'].includes(opts.variant) ? opts.variant : 'parts';
  const metal = variant === 'ledger' ? PALETTE.stoneDust : variant === 'bonded' ? PALETTE.rustLight : PALETTE.rustMid;
  const start = frame.point(-0.5, 0);
  const end = frame.point(0.5, 0);
  const topStart = [start[0], start[1] - 39];
  const topEnd = [end[0], end[1] - 39];
  const face = faceTools(ctx, topStart, topEnd, end, start);
  face.line(0, 0.04, 1, 0.04, PALETTE.outline, 4);
  face.line(0, 0.06, 1, 0.06, metal, 1);
  face.line(0, 0.94, 1, 0.94, PALETTE.outline, 4);
  for (const u of [0.12, 0.34, 0.56, 0.78]) {
    face.line(u, 0.12, Math.min(0.98, u + 0.28), 0.9, PALETTE.rustDark, 1);
    face.line(Math.min(0.98, u + 0.28), 0.12, u, 0.9, PALETTE.stoneDark, 1);
  }
  const drawPost = (point) => {
    px(ctx, point[0] - 2, point[1] - 42, PALETTE.outline, 5, 44);
    px(ctx, point[0] - 1, point[1] - 41, PALETTE.rustDark, 3, 41);
    px(ctx, point[0], point[1] - 40, metal, 1, 34);
  };
  if (!connections.start) drawPost(start);
  drawPost(end);
  if (variant === 'bonded') {
    const plate = face.point(0.52, 0.56);
    px(ctx, plate[0] - 4, plate[1] - 3, PALETTE.outline, 9, 7);
    px(ctx, plate[0] - 3, plate[1] - 2, PALETTE.stoneDust, 7, 5);
  }
  // The finer second wire gauge makes the cage read as woven mesh at native
  // resolution while preserving the heavy structural diagonals.
  face.nativeLine(0.08, 0.22, 0.36, 0.86, metal);
  face.nativeLine(0.64, 0.14, 0.92, 0.78, PALETTE.rustDark);
  face.nativeLine(0.12, 0.72, 0.38, 0.18, PALETTE.stoneDark);
  void seed;
}

const MACHINE_VARIANTS = ['generator', 'cooling-jacket', 'lathe', 'press', 'pump-jig', 'cold-coil'];

function drawMachineFaceBands(ctx, box, color) {
  const lit = faceTools(ctx, box.cap.left, box.cap.bottom, box.base.bottom, box.base.left);
  const shade = faceTools(ctx, box.cap.bottom, box.cap.right, box.base.right, box.base.bottom);
  for (const face of [lit, shade]) {
    for (const v of [0.24, 0.52, 0.78]) face.line(0.06, v, 0.94, v, PALETTE.outline, 2);
    for (const u of [0.18, 0.5, 0.82]) face.line(u, 0.08, u, 0.92, color, 1);
  }
}

function drawReliefMachinePlinth(ctx, frame) {
  const base = orientedBox(ctx, frame, 1.48, 0.88, 6, {
    top: PALETTE.stoneDark,
    lit: PALETTE.rustDark,
    shade: PALETTE.outline,
    outline: PALETTE.outline
  });
  linePx(ctx, base.cap.left[0], base.cap.left[1], base.cap.top[0], base.cap.top[1], PALETTE.rustLight, 1);
  for (const [a, b] of [[-0.57, -0.29], [0.57, -0.29], [-0.57, 0.29], [0.57, 0.29]]) {
    const bolt = frame.point(a, b, 7);
    px(ctx, bolt[0] - 2, bolt[1] - 2, PALETTE.outline, 4, 4);
    nativePx(ctx, bolt[0] - 0.5, bolt[1] - 1.5, PALETTE.stoneDust);
  }
  return base;
}

function drawMachineShaft(ctx, start, end, color = PALETTE.stoneMid, size = 5) {
  linePx(ctx, start[0], start[1], end[0], end[1], PALETTE.outline, size + 3);
  linePx(ctx, start[0] + 1, start[1] + 1, end[0] + 1, end[1] + 1, PALETTE.rustDark, size + 1);
  linePx(ctx, start[0], start[1], end[0], end[1], color, size);
  nativeLinePx(ctx, start[0] + 0.5, start[1] - 1.5, end[0] + 0.5, end[1] - 1.5, PALETTE.stoneDust);
}

function drawMachineColumn(ctx, point, height, color = PALETTE.rustMid) {
  px(ctx, point[0] - 4, point[1] - height, PALETTE.outline, 9, height + 2);
  px(ctx, point[0] - 3, point[1] - height + 1, PALETTE.rustDark, 7, height);
  px(ctx, point[0] - 2, point[1] - height + 1, color, 3, height - 2);
  px(ctx, point[0] - 5, point[1] - 3, PALETTE.outline, 11, 5);
  px(ctx, point[0] - 4, point[1] - 2, PALETTE.stoneDark, 9, 3);
  nativeLinePx(ctx, point[0] - 1.5, point[1] - height + 1.5, point[0] - 1.5, point[1] - 5.5, PALETTE.rustLight);
}

function drawMachineDrum(ctx, anchor, width, height, colors = {}) {
  const half = Math.floor(width / 2);
  const top = anchor[1] - height;
  const lit = colors.lit ?? PALETTE.rustMid;
  const mid = colors.mid ?? PALETTE.stoneMid;
  const shade = colors.shade ?? PALETTE.rustDark;
  const trim = colors.trim ?? PALETTE.stoneDust;
  const outer = [
    [anchor[0] - half + 4, top],
    [anchor[0] + half - 4, top],
    [anchor[0] + half, top + 5],
    [anchor[0] + half, anchor[1] - 4],
    [anchor[0] + half - 4, anchor[1]],
    [anchor[0] - half + 4, anchor[1]],
    [anchor[0] - half, anchor[1] - 4],
    [anchor[0] - half, top + 5]
  ];
  poly(ctx, PALETTE.outline, outer);
  poly(ctx, mid, [
    [anchor[0] - half + 4, top + 2],
    [anchor[0] + half - 5, top + 2],
    [anchor[0] + half - 2, top + 6],
    [anchor[0] + half - 2, anchor[1] - 5],
    [anchor[0] + half - 5, anchor[1] - 2],
    [anchor[0] - half + 4, anchor[1] - 2],
    [anchor[0] - half + 2, anchor[1] - 5],
    [anchor[0] - half + 2, top + 6]
  ]);
  poly(ctx, lit, [
    [anchor[0] - half + 2, top + 6],
    [anchor[0] - 1, top + 3],
    [anchor[0] - 1, anchor[1] - 2],
    [anchor[0] - half + 4, anchor[1] - 2],
    [anchor[0] - half + 2, anchor[1] - 5]
  ]);
  poly(ctx, shade, [
    [anchor[0] + 1, top + 3],
    [anchor[0] + half - 2, top + 6],
    [anchor[0] + half - 2, anchor[1] - 5],
    [anchor[0] + half - 5, anchor[1] - 2],
    [anchor[0] + 1, anchor[1] - 2]
  ]);
  for (const y of [top + Math.round(height * 0.28), top + Math.round(height * 0.72)]) {
    linePx(ctx, anchor[0] - half, y, anchor[0] + half, y, PALETTE.outline, 4);
    linePx(ctx, anchor[0] - half + 1, y - 1, anchor[0] + half - 1, y - 1, trim, 1);
  }
  nativeLinePx(ctx, anchor[0] - half + 4.5, top + 1.5, anchor[0] + 1.5, top + 1.5, trim);
  return { top, bottom: anchor[1], left: anchor[0] - half, right: anchor[0] + half };
}

function drawMachineBearing(ctx, frame, a, b, lift, height = 14) {
  const bearingFrame = shiftedFrame(frame, a, b, lift);
  const bearing = orientedBox(ctx, bearingFrame, 0.24, 0.42, height, {
    top: PALETTE.stoneDust,
    lit: PALETTE.rustMid,
    shade: PALETTE.rustDark,
    outline: PALETTE.outline
  });
  const center = bearingFrame.point(0, 0, height - 5);
  px(ctx, center[0] - 3, center[1] - 3, PALETTE.outline, 7, 7);
  px(ctx, center[0] - 1, center[1] - 2, PALETTE.stoneMid, 3, 4);
  nativeLinePx(ctx, bearing.cap.left[0] + 0.5, bearing.cap.left[1] - 0.5, bearing.cap.top[0] - 0.5, bearing.cap.top[1] + 0.5, PALETTE.stoneDust);
}

function drawGeneratorMachine(ctx, frame) {
  const shaftStart = frame.point(-0.62, 0, 23);
  const shaftEnd = frame.point(0.62, 0, 23);
  drawMachineShaft(ctx, shaftStart, shaftEnd, PALETTE.stoneMid, 4);
  drawMachineBearing(ctx, frame, -0.46, 0, 6, 14);
  drawMachineBearing(ctx, frame, 0.47, 0, 6, 14);

  const motorAnchor = frame.point(0.18, -0.03, 7);
  drawMachineDrum(ctx, motorAnchor, 28, 28, {
    lit: PALETTE.rustMid,
    mid: PALETTE.stoneMid,
    shade: PALETTE.rustDark,
    trim: PALETTE.stoneDust
  });
  const terminalFrame = shiftedFrame(frame, 0.2, -0.18, 34);
  orientedBox(ctx, terminalFrame, 0.3, 0.24, 7, {
    top: PALETTE.stoneDust,
    lit: PALETTE.rustMid,
    shade: PALETTE.rustDark,
    outline: PALETTE.outline
  });

  const flywheel = frame.point(-0.4, 0.32, 25);
  const pulley = frame.point(0.18, 0.32, 25);
  linePx(ctx, flywheel[0], flywheel[1] - 11, pulley[0], pulley[1] - 5, PALETTE.outline, 4);
  linePx(ctx, flywheel[0], flywheel[1] + 11, pulley[0], pulley[1] + 5, PALETTE.outline, 4);
  linePx(ctx, flywheel[0], flywheel[1] - 10, pulley[0], pulley[1] - 4, PALETTE.rustDark, 2);
  linePx(ctx, flywheel[0], flywheel[1] + 10, pulley[0], pulley[1] + 4, PALETTE.rustDark, 2);
  drawMechanicalWheel(ctx, flywheel, 9, PALETTE.rustLight);
  drawMechanicalWheel(ctx, pulley, 4, PALETTE.stoneDust);
}

function drawCoolingMachine(ctx, frame) {
  const left = frame.point(-0.62, 0, 18);
  const right = frame.point(0.62, 0, 18);
  drawMachineShaft(ctx, left, right, PALETTE.clothBlueDark, 5);
  const drumAnchor = frame.point(0, 0, 7);
  drawMachineDrum(ctx, drumAnchor, 25, 42, {
    lit: PALETTE.stoneDust,
    mid: PALETTE.stoneMid,
    shade: PALETTE.rustDark,
    trim: PALETTE.clothBlueDark
  });
  const cap = frame.point(0, 0, 50);
  px(ctx, cap[0] - 4, cap[1] - 5, PALETTE.outline, 9, 7);
  px(ctx, cap[0] - 2, cap[1] - 4, PALETTE.stoneDust, 5, 4);
  const valve = frame.point(0.27, 0.34, 30);
  drawMechanicalWheel(ctx, valve, 5, PALETTE.stoneDust);
  const returnPipe = frame.point(0.48, 0.1, 10);
  drawServicePipeStroke(ctx, [valve[0], valve[1] + 7], returnPipe, PALETTE.clothBlueDark);
}

function drawLatheMachine(ctx, frame) {
  const railFrame = shiftedFrame(frame, 0, 0, 6);
  const rail = orientedBox(ctx, railFrame, 1.28, 0.34, 7, {
    top: PALETTE.stoneMid,
    lit: PALETTE.rustDark,
    shade: PALETTE.outline,
    outline: PALETTE.outline
  });
  linePx(ctx, rail.cap.left[0], rail.cap.left[1], rail.cap.top[0], rail.cap.top[1], PALETTE.stoneDust, 1);
  const headFrame = shiftedFrame(frame, -0.46, 0, 13);
  orientedBox(ctx, headFrame, 0.32, 0.58, 27, {
    top: PALETTE.stoneDust,
    lit: PALETTE.rustMid,
    shade: PALETTE.rustDark,
    outline: PALETTE.outline
  });
  const tailFrame = shiftedFrame(frame, 0.47, 0, 13);
  orientedBox(ctx, tailFrame, 0.26, 0.5, 19, {
    top: PALETTE.stoneDust,
    lit: PALETTE.stoneMid,
    shade: PALETTE.rustDark,
    outline: PALETTE.outline
  });
  const stockStart = frame.point(-0.32, 0, 31);
  const stockEnd = frame.point(0.42, 0, 31);
  drawMachineShaft(ctx, stockStart, stockEnd, PALETTE.stoneDust, 3);
  const chuck = frame.point(-0.34, 0.28, 31);
  drawMechanicalWheel(ctx, chuck, 8, PALETTE.rustLight);
  const carriageFrame = shiftedFrame(frame, 0.03, 0.12, 13);
  orientedBox(ctx, carriageFrame, 0.28, 0.5, 11, {
    top: PALETTE.rustLight,
    lit: PALETTE.rustMid,
    shade: PALETTE.rustDark,
    outline: PALETTE.outline
  });
  const handwheel = frame.point(0.48, 0.28, 19);
  drawMechanicalWheel(ctx, handwheel, 6, PALETTE.stoneDust);
}

function drawPressMachine(ctx, frame) {
  const left = frame.point(-0.42, 0, 6);
  const right = frame.point(0.42, 0, 6);
  drawMachineColumn(ctx, left, 42, PALETTE.rustMid);
  drawMachineColumn(ctx, right, 42, PALETTE.rustMid);
  const topLeft = frame.point(-0.46, 0, 49);
  const topRight = frame.point(0.46, 0, 49);
  drawMachineShaft(ctx, topLeft, topRight, PALETTE.rustMid, 7);
  const ramTop = frame.point(0, 0, 48);
  const ramBottom = frame.point(0, 0, 21);
  linePx(ctx, ramTop[0], ramTop[1], ramBottom[0], ramBottom[1], PALETTE.outline, 8);
  linePx(ctx, ramTop[0] - 1, ramTop[1] + 1, ramBottom[0] - 1, ramBottom[1], PALETTE.stoneDust, 4);
  const bedLeft = frame.point(-0.31, -0.18, 17);
  const bedRight = frame.point(0.31, 0.18, 17);
  drawMachineShaft(ctx, bedLeft, bedRight, PALETTE.stoneMid, 7);
  const wheel = frame.point(0.43, 0.3, 39);
  drawMechanicalWheel(ctx, wheel, 7, PALETTE.rustLight);
  linePx(ctx, wheel[0] + 5, wheel[1] + 5, wheel[0] + 12, wheel[1] + 15, PALETTE.outline, 4);
  linePx(ctx, wheel[0] + 5, wheel[1] + 4, wheel[0] + 11, wheel[1] + 14, PALETTE.rustMid, 2);
}

function drawPumpJigMachine(ctx, frame) {
  for (const a of [-0.34, 0.34]) {
    const anchor = frame.point(a, 0, 7);
    drawMachineDrum(ctx, anchor, 16, 30, {
      lit: PALETTE.rustMid,
      mid: PALETTE.stoneMid,
      shade: PALETTE.rustDark,
      trim: PALETTE.stoneDust
    });
    const rodTop = frame.point(a, 0, 44);
    const rodBottom = frame.point(a, 0, 31);
    drawMachineShaft(ctx, rodTop, rodBottom, PALETTE.stoneDust, 2);
  }
  const manifoldLeft = frame.point(-0.56, 0, 39);
  const manifoldRight = frame.point(0.56, 0, 39);
  drawMachineShaft(ctx, manifoldLeft, manifoldRight, PALETTE.rustMid, 5);
  const inlet = frame.point(-0.62, 0, 16);
  const firstPump = frame.point(-0.34, 0, 16);
  const secondPump = frame.point(0.34, 0, 16);
  const outlet = frame.point(0.62, 0, 16);
  drawServicePipeStroke(ctx, inlet, firstPump);
  drawServicePipeStroke(ctx, secondPump, outlet);
  const crank = frame.point(0, 0.34, 27);
  drawIsoDiamond(ctx, crank[0], crank[1], 11, 5, PALETTE.outline);
  drawIsoDiamond(ctx, crank[0] - 1, crank[1] - 1, 7, 3, PALETTE.rustMid);
  linePx(ctx, crank[0] + 2, crank[1] - 2, crank[0] + 12, crank[1] - 10, PALETTE.outline, 3);
  nativeLinePx(ctx, crank[0] + 2.5, crank[1] - 3.5, crank[0] + 11.5, crank[1] - 10.5, PALETTE.rustLight);
  px(ctx, crank[0] + 10, crank[1] - 13, PALETTE.outline, 5, 6);
  nativePx(ctx, crank[0] + 11.5, crank[1] - 11.5, PALETTE.woodLight);
}

function drawColdCoilMachine(ctx, frame) {
  const left = frame.point(-0.47, 0, 6);
  const right = frame.point(0.47, 0, 6);
  drawMachineColumn(ctx, left, 39, PALETTE.stoneMid);
  drawMachineColumn(ctx, right, 39, PALETTE.stoneMid);
  const topLeft = frame.point(-0.47, 0, 45);
  const topRight = frame.point(0.47, 0, 45);
  const bottomRight = frame.point(0.47, 0, 12);
  const bottomLeft = frame.point(-0.47, 0, 12);
  const coil = faceTools(ctx, topLeft, topRight, bottomRight, bottomLeft);
  coil.line(0, 0, 1, 0, PALETTE.outline, 6);
  coil.line(0, 1, 1, 1, PALETTE.outline, 6);
  const turns = [
    [0.08, 0.16, 0.9, 0.16], [0.9, 0.16, 0.9, 0.34],
    [0.9, 0.34, 0.1, 0.34], [0.1, 0.34, 0.1, 0.52],
    [0.1, 0.52, 0.9, 0.52], [0.9, 0.52, 0.9, 0.7],
    [0.9, 0.7, 0.1, 0.7], [0.1, 0.7, 0.1, 0.86],
    [0.1, 0.86, 0.9, 0.86]
  ];
  for (const [u0, v0, u1, v1] of turns) {
    coil.line(u0, v0, u1, v1, PALETTE.outline, 6);
    coil.line(u0, v0 - 0.015, u1, v1 - 0.015, PALETTE.clothBlueDark, 3);
  }
  coil.nativeLine(0.1, 0.13, 0.72, 0.13, PALETTE.clothBlue);
  coil.nativeLine(0.12, 0.49, 0.74, 0.49, PALETTE.clothBlue);
  const inlet = frame.point(-0.64, 0, 13);
  const outlet = frame.point(0.64, 0, 13);
  drawServicePipeStroke(ctx, inlet, bottomLeft, PALETTE.clothBlueDark);
  drawServicePipeStroke(ctx, bottomRight, outlet, PALETTE.clothBlueDark);
}

export function drawSouthMeasureReliefMachine(ctx, cx, cy, seed, opts = {}) {
  const variant = MACHINE_VARIANTS.includes(opts.variant) ? opts.variant : 'generator';
  const frame = isoFrame(cx, cy, opts.orient);
  const ext = footprintExtent(1.48, 0.88);
  drawReliefMachinePlinth(ctx, frame);

  if (variant === 'generator') drawGeneratorMachine(ctx, frame);
  else if (variant === 'cooling-jacket') drawCoolingMachine(ctx, frame);
  else if (variant === 'lathe') drawLatheMachine(ctx, frame);
  else if (variant === 'press') drawPressMachine(ctx, frame);
  else if (variant === 'pump-jig') drawPumpJigMachine(ctx, frame);
  else drawColdCoilMachine(ctx, frame);

  const plate = frame.point(-0.53, 0.31, 9);
  px(ctx, plate[0] - 3, plate[1] - 4, PALETTE.outline, 7, 6);
  px(ctx, plate[0] - 2, plate[1] - 3, (seed & 1) ? PALETTE.stoneDust : PALETTE.clothTan, 5, 3);
  const machineWearA = frame.point(-0.58, -0.3, 7.5);
  const machineWearB = frame.point(-0.16, -0.3, 7.5);
  nativeLinePx(ctx, machineWearA[0], machineWearA[1], machineWearB[0], machineWearB[1], PALETTE.rustLight);
  const machineWearC = frame.point(0.16, 0.31, 6.5);
  const machineWearD = frame.point(0.57, 0.31, 6.5);
  nativeLinePx(ctx, machineWearC[0], machineWearC[1], machineWearD[0], machineWearD[1], PALETTE.rustDark);
}

export function drawSouthMeasureIntakePumpAssembly(ctx, cx, cy, seed, opts = {}) {
  const frame = isoFrame(cx, cy, opts.orient);
  const variant = ['coupled', 'bypassed', 'failed'].includes(opts.variant) ? opts.variant : 'coupled';
  const ext = footprintExtent(1.82, 1.0);
  orientedBox(ctx, frame, 1.82, 1, 8, {
    top: PALETTE.stoneMid,
    lit: PALETTE.rustDark,
    shade: PALETTE.outline,
    outline: PALETTE.outline
  });
  const bodyFrame = shiftedFrame(frame, 0, 0, 8);
  const body = orientedBox(ctx, bodyFrame, 0.92, 0.76, 31, {
    top: PALETTE.stoneDust,
    lit: PALETTE.rustMid,
    shade: PALETTE.rustDark,
    outline: PALETTE.outline
  });
  drawMachineFaceBands(ctx, body, PALETTE.rustLight);

  floorLine(ctx, frame, -0.9, 0, 0.9, 0, 23, PALETTE.outline, 7);
  floorLine(ctx, frame, -0.88, 0, 0.88, 0, 24, variant === 'failed' ? PALETTE.stoneDark : PALETTE.rustMid, 4);
  for (const a of [-0.68, 0.68]) {
    const coupling = shiftedFrame(frame, a, 0, 16);
    orientedBox(ctx, coupling, 0.28, 0.72, 18, { top: PALETTE.stoneDust, lit: PALETTE.rustMid, shade: PALETTE.rustDark, outline: PALETTE.outline });
  }

  const wheelAnchor = frame.point(0.08, 0.52, 30);
  const wheelY = wheelAnchor[1] - 5;
  for (const [dx, dy] of [[-12, 0], [-8, -9], [0, -13], [9, -8], [12, 0], [8, 9], [0, 13], [-9, 8]]) {
    linePx(ctx, wheelAnchor[0], wheelY, wheelAnchor[0] + dx, wheelY + dy, PALETTE.outline, 3);
    linePx(ctx, wheelAnchor[0], wheelY, wheelAnchor[0] + Math.round(dx * 0.85), wheelY + Math.round(dy * 0.85), PALETTE.rustLight, 1);
  }
  px(ctx, wheelAnchor[0] - 3, wheelY - 3, PALETTE.outline, 7, 7);
  px(ctx, wheelAnchor[0] - 1, wheelY - 2, PALETTE.stoneDust, 3, 4);

  const consoleFrame = shiftedFrame(frame, -0.43, -0.42, 8);
  const consoleBox = orientedBox(ctx, consoleFrame, 0.42, 0.36, 25, {
    top: PALETTE.stoneDark,
    lit: PALETTE.rustMid,
    shade: PALETTE.rustDark,
    outline: PALETTE.outline
  });
  const consoleFace = faceTools(ctx, consoleBox.cap.left, consoleBox.cap.bottom, consoleBox.base.bottom, consoleBox.base.left);
  for (const [u, v, color] of [[0.28, 0.28, PALETTE.stoneDust], [0.7, 0.3, PALETTE.rustLight], [0.48, 0.62, variant === 'bypassed' ? PALETTE.clothBlue : PALETTE.stoneDark]]) {
    const p = consoleFace.point(u, v);
    px(ctx, p[0] - 1, p[1] - 1, PALETTE.outline, 4, 3);
    px(ctx, p[0], p[1] - 1, color, 2, 1);
  }
  if (variant === 'failed') floorLine(ctx, frame, -0.12, -0.46, 0.42, -0.38, 10, PALETTE.outline, 2);
  const pumpWearA = frame.point(-0.72, -0.34, 24.5);
  const pumpWearB = frame.point(-0.28, -0.34, 24.5);
  nativeLinePx(ctx, pumpWearA[0], pumpWearA[1], pumpWearB[0], pumpWearB[1], PALETTE.rustLight);
  const pumpWearC = frame.point(0.24, 0.34, 23.5);
  const pumpWearD = frame.point(0.7, 0.34, 23.5);
  nativeLinePx(ctx, pumpWearC[0], pumpWearC[1], pumpWearD[0], pumpWearD[1], variant === 'failed' ? PALETTE.stoneDark : PALETTE.rustDark);
  consoleFace.nativeLine(0.18, 0.18, 0.76, 0.18, PALETTE.rustLight);
  void seed;
}

export function drawSouthMeasureFreightScale(ctx, cx, cy, seed, opts = {}) {
  const frame = isoFrame(cx, cy, opts.orient);
  const variant = opts.variant === 'claim' ? 'claim' : 'cargo';
  const cargo = variant === 'cargo';
  const lenA = cargo ? 2.72 : 1.38;
  const lenB = cargo ? 1.42 : 0.96;
  const halfA = lenA / 2;
  const halfB = lenB / 2;
  const ext = footprintExtent(lenA, lenB);
  const platform = orientedBox(ctx, frame, lenA, lenB, cargo ? 8 : 5, {
    top: PALETTE.stoneMid,
    lit: PALETTE.rustMid,
    shade: PALETTE.rustDark,
    outline: PALETTE.outline
  });
  const deckTicks = cargo ? [-1.08, -0.54, 0, 0.54, 1.08] : [-0.36, 0, 0.36];
  for (const t of deckTicks) floorLine(ctx, frame, t, -halfB + 0.08, t, halfB - 0.08, cargo ? 9 : 6, PALETTE.stoneDust, 1);
  if (cargo) {
    for (const b of [-halfB + 0.1, halfB - 0.1]) {
      floorLine(ctx, frame, -halfA + 0.1, b, halfA - 0.1, b, 10, PALETTE.outline, 5);
      floorLine(ctx, frame, -halfA + 0.12, b, halfA - 0.12, b, 11, PALETTE.rustLight, 1);
    }
    for (const a of [-1.12, 1.12]) {
      for (const b of [-0.5, 0.5]) {
        const bolt = frame.point(a, b, 11);
        px(ctx, bolt[0] - 3, bolt[1] - 3, PALETTE.outline, 7, 6);
        px(ctx, bolt[0] - 1, bolt[1] - 2, PALETTE.rustLight, 3, 3);
      }
    }
  }
  linePx(ctx, platform.cap.left[0], platform.cap.left[1], platform.cap.top[0], platform.cap.top[1], PALETTE.rustLight, 1);

  const post = frame.point(-halfA + 0.24, -halfB + 0.18);
  px(ctx, post[0] - 3, post[1] - 43, PALETTE.outline, 7, 45);
  px(ctx, post[0] - 2, post[1] - 42, PALETTE.rustDark, 5, 42);
  px(ctx, post[0] - 1, post[1] - 41, PALETTE.rustMid, 2, 35);
  const dialY = post[1] - 45;
  px(ctx, post[0] - 10, dialY - 8, PALETTE.outline, 21, 17);
  px(ctx, post[0] - 8, dialY - 6, PALETTE.stoneDust, 17, 13);
  px(ctx, post[0] - 6, dialY - 4, PALETTE.clothTan, 13, 9);
  linePx(ctx, post[0], dialY + 1, post[0] + ((seed & 1) ? 5 : -4), dialY - 3, PALETTE.clothRed, 1);
  px(ctx, post[0] - 1, dialY, PALETTE.outline, 3, 3);
  if (variant === 'claim') floorQuad(ctx, frame, 0.18, 0.54, -0.2, 0.16, 7, PALETTE.clothRed);
  if (cargo) {
    // The far tower and exposed balance beam turn the broad deck into a
    // weighbridge. A suspended sliding weight makes its function legible even
    // when the floor-level platform is partly occluded at gameplay zoom.
    const farPost = frame.point(halfA - 0.24, -halfB + 0.18);
    px(ctx, farPost[0] - 3, farPost[1] - 43, PALETTE.outline, 7, 45);
    px(ctx, farPost[0] - 2, farPost[1] - 42, PALETTE.rustDark, 5, 42);
    px(ctx, farPost[0] - 1, farPost[1] - 41, PALETTE.rustMid, 2, 35);
    linePx(ctx, post[0], post[1] - 39, farPost[0], farPost[1] - 39, PALETTE.outline, 8);
    linePx(ctx, post[0] + 1, post[1] - 41, farPost[0] - 1, farPost[1] - 41, PALETTE.rustLight, 2);
    const weight = mixPoint([post[0], post[1] - 39], [farPost[0], farPost[1] - 39], 0.62);
    px(ctx, weight[0] - 5, weight[1] - 4, PALETTE.outline, 11, 9);
    px(ctx, weight[0] - 3, weight[1] - 3, PALETTE.stoneDust, 7, 5);
    linePx(ctx, weight[0], weight[1] + 3, weight[0], weight[1] + 15, PALETTE.outline, 4);
    linePx(ctx, weight[0] - 1, weight[1] + 3, weight[0] - 1, weight[1] + 14, PALETTE.rustLight, 1);
    px(ctx, weight[0] - 4, weight[1] + 13, PALETTE.outline, 9, 8);
    px(ctx, weight[0] - 2, weight[1] + 14, PALETTE.rustMid, 5, 5);
    nativeLinePx(ctx, farPost[0] - 0.5, farPost[1] - 40.5, farPost[0] - 0.5, farPost[1] - 5.5, PALETTE.rustLight);
    nativeLinePx(ctx, post[0] + 4.5, post[1] - 40.5, farPost[0] - 4.5, farPost[1] - 40.5, PALETTE.hostBone);
  }
  nativeLinePx(ctx, platform.cap.left[0] + 1.5, platform.cap.left[1] - 0.5, platform.cap.top[0] - 1.5, platform.cap.top[1] + 0.5, PALETTE.rustLight);
  for (const t of deckTicks) {
    const ruleA = frame.point(t, -halfB + 0.1, cargo ? 9.5 : 6.5);
    const ruleB = frame.point(t, halfB - 0.1, cargo ? 9.5 : 6.5);
    nativeLinePx(ctx, ruleA[0], ruleA[1], ruleB[0], ruleB[1], PALETTE.stoneDust);
  }
  nativeLinePx(ctx, post[0] - 0.5, post[1] - 40.5, post[0] - 0.5, post[1] - 5.5, PALETTE.rustLight);
  nativeLinePx(ctx, post[0] - 6.5, dialY - 3.5, post[0] + 6.5, dialY - 3.5, PALETTE.hostBone);
  nativeLinePx(ctx, post[0], dialY + 0.5, post[0] + ((seed & 1) ? 4.5 : -3.5), dialY - 2.5, PALETTE.clothRed);
  if (variant === 'claim') {
    const claimA = frame.point(0.22, -0.14, 7.5);
    const claimB = frame.point(0.5, -0.14, 7.5);
    nativeLinePx(ctx, claimA[0], claimA[1], claimB[0], claimB[1], PALETTE.clothTan);
  }
}

export function drawSouthMeasureClinicBed(ctx, cx, cy, seed, opts = {}) {
  const frame = isoFrame(cx, cy, opts.orient);
  const variant = ['clean', 'used', 'isolation'].includes(opts.variant) ? opts.variant : 'used';
  const lenA = 1.56;
  const lenB = 0.72;
  const halfA = lenA / 2;
  const halfB = lenB / 2;
  const ext = footprintExtent(lenA, lenB);
  orientedBox(ctx, frame, lenA, lenB, 6, { top: PALETTE.rustDark, lit: PALETTE.stoneDark, shade: PALETTE.outline, outline: PALETTE.outline });
  orientedBox(ctx, frame, lenA - 0.12, lenB - 0.12, 7, {
    top: variant === 'isolation' ? PALETTE.stoneDust : PALETTE.clothTan,
    lit: PALETTE.stoneDust,
    shade: PALETTE.stoneMid,
    outline: PALETTE.outline
  }, 6);
  floorQuad(ctx, frame, -halfA + 0.1, -0.32, -halfB + 0.1, halfB - 0.1, 14, PALETTE.stoneDust);
  floorQuad(ctx, frame, 0.02, halfA - 0.08, -halfB + 0.07, halfB - 0.07, 14, variant === 'clean' ? PALETTE.clothBlueDark : PALETTE.clothDark);
  if (variant === 'used') floorLine(ctx, frame, 0.18, -0.3, 0.38, 0.28, 15, PALETTE.rustDark, 1);

  for (const a of [-halfA + 0.03, halfA - 0.03]) {
    const posts = [frame.point(a, -halfB + 0.03), frame.point(a, halfB - 0.03)];
    for (const post of posts) {
      px(ctx, post[0] - 2, post[1] - 24, PALETTE.outline, 5, 25);
      px(ctx, post[0] - 1, post[1] - 23, PALETTE.rustMid, 3, 22);
      px(ctx, post[0], post[1] - 22, PALETTE.stoneDust, 1, 17);
    }
    for (const lift of [16, 23]) linePx(ctx, posts[0][0], posts[0][1] - lift, posts[1][0], posts[1][1] - lift, PALETTE.outline, 3);
  }
  const mattressA = frame.point(-halfA + 0.1, -halfB + 0.1, 14.5);
  const mattressB = frame.point(halfA - 0.1, -halfB + 0.1, 14.5);
  nativeLinePx(ctx, mattressA[0], mattressA[1], mattressB[0], mattressB[1], variant === 'isolation' ? PALETTE.stoneDust : PALETTE.hostBone);
  const coverA = frame.point(0.06, -halfB + 0.09, 14.5);
  const coverB = frame.point(halfA - 0.1, -halfB + 0.09, 14.5);
  nativeLinePx(ctx, coverA[0], coverA[1], coverB[0], coverB[1], variant === 'clean' ? PALETTE.clothBlue : PALETTE.stoneDust);
  const pillowA = frame.point(-halfA + 0.14, -0.18, 14.5);
  const pillowB = frame.point(-0.36, -0.18, 14.5);
  nativeLinePx(ctx, pillowA[0], pillowA[1], pillowB[0], pillowB[1], PALETTE.hostBone);
  if (variant === 'used') {
    const stainA = frame.point(0.18, -0.29, 15.5);
    const stainB = frame.point(0.38, 0.27, 15.5);
    nativeLinePx(ctx, stainA[0], stainA[1], stainB[0], stainB[1], PALETTE.rustMid);
  }
  for (const a of [-halfA + 0.03, halfA - 0.03]) {
    for (const b of [-halfB + 0.03, halfB - 0.03]) {
      const post = frame.point(a, b);
      nativeLinePx(ctx, post[0] + 0.5, post[1] - 22.5, post[0] + 0.5, post[1] - 4.5, PALETTE.stoneDust);
    }
  }
  void seed;
}

export function drawSouthMeasureClothPartition(ctx, cx, cy, seed, opts = {}) {
  const orient = normalizeOrient(opts.orient);
  const frame = isoFrame(cx, cy, orient);
  const connections = southMeasureRunConnections(orient, opts.connected ?? {});
  const variant = ['clinic', 'domestic', 'isolation'].includes(opts.variant) ? opts.variant : 'clinic';
  if (variant === 'domestic') {
    const start = frame.point(-0.5, 0);
    const end = frame.point(0.5, 0);
    const railStart = [start[0], start[1] - 34];
    const railEnd = [end[0], end[1] - 34];
    const groundPoint = (t, lift) => {
      const point = mixPoint(start, end, t);
      return [point[0], point[1] - lift];
    };
    const railPoint = (t, drop = 0) => {
      const point = mixPoint(railStart, railEnd, t);
      return [point[0], point[1] + drop];
    };
    const drawPanel = (t0, t1, phase) => {
      const span = t1 - t0;
      const t25 = t0 + span * 0.25;
      const t50 = t0 + span * 0.5;
      const t75 = t0 + span * 0.75;
      poly(ctx, PALETTE.outline, [
        railPoint(t0),
        railPoint(t1),
        groundPoint(t1, 11 + phase),
        groundPoint(t75, 7 + phase),
        groundPoint(t50, 10 - phase),
        groundPoint(t25, 7 - phase),
        groundPoint(t0, 11 - phase)
      ]);
      poly(ctx, PALETTE.clothTan, [
        railPoint(t0 + 0.015, 2),
        railPoint(t1 - 0.015, 2),
        groundPoint(t1 - 0.015, 13 + phase),
        groundPoint(t75, 9 + phase),
        groundPoint(t50, 12 - phase),
        groundPoint(t25, 9 - phase),
        groundPoint(t0 + 0.015, 13 - phase)
      ]);
      const topEdgeStart = railPoint(t0 + 0.025, 3);
      const topEdgeEnd = railPoint(t1 - 0.025, 3);
      linePx(ctx, topEdgeStart[0], topEdgeStart[1], topEdgeEnd[0], topEdgeEnd[1], PALETTE.hostBone, 1);
      for (const t of [t25, t50, t75]) {
        const top = railPoint(t, 4);
        const bottom = groundPoint(t, t === t50 ? 13 - phase : 10 + phase);
        linePx(ctx, top[0], top[1], bottom[0], bottom[1], t < t50 ? PALETTE.stoneDust : PALETTE.woodDark, 1);
      }
    };

    drawPanel(0.05, 0.43, (seed & 1) ? 1 : 0);
    drawPanel(0.57, 0.95, (seed & 1) ? 0 : 1);
    linePx(ctx, railStart[0], railStart[1], railEnd[0], railEnd[1], PALETTE.outline, 5);
    linePx(ctx, railStart[0], railStart[1] - 1, railEnd[0], railEnd[1] - 1, PALETTE.woodLight, 2);
    for (const t of [0.08, 0.2, 0.32, 0.68, 0.8, 0.92]) {
      const tie = railPoint(t, 1);
      px(ctx, tie[0] - 1, tie[1] - 1, PALETTE.rustMid, 3, 3);
    }
    const drawDomesticPost = (point, light) => {
      px(ctx, point[0] - 2, point[1] - 37, PALETTE.outline, 5, 39);
      px(ctx, point[0] - 1, point[1] - 36, PALETTE.woodDark, 3, 36);
      px(ctx, point[0], point[1] - 35, light, 1, 29);
    };
    if (!connections.start) drawDomesticPost(start, PALETTE.woodLight);
    drawDomesticPost(end, PALETTE.rustMid);
    nativeLinePx(ctx, railStart[0] + 2.5, railStart[1] - 1.5, railEnd[0] - 2.5, railEnd[1] - 1.5, PALETTE.woodLight);
    return;
  }
  const cloth = variant === 'domestic' ? PALETTE.clothTan : variant === 'isolation' ? PALETTE.clothBlueDark : PALETTE.stoneDust;
  const highlight = variant === 'isolation' ? PALETTE.clothBlue : PALETTE.clothTan;
  const start = frame.point(-0.5, 0);
  const end = frame.point(0.5, 0);
  const topStart = [start[0], start[1] - 43];
  const topEnd = [end[0], end[1] - 43];
  const curtain = faceTools(ctx, topStart, topEnd, end, start);
  curtain.rect(0.04, 0.07, 0.96, 0.91, PALETTE.outline);
  curtain.rect(0.07, 0.09, 0.93, 0.88, cloth);
  curtain.line(0.08, 0.1, 0.92, 0.1, highlight, 1);
  curtain.line(0.08, 0.86, 0.92, 0.86, PALETTE.rustDark, 2);
  for (const u of [0.2, 0.38, 0.56, 0.74]) {
    const drift = ((seed + Math.floor(u * 100)) & 1) ? 0.025 : -0.02;
    curtain.line(u, 0.12, u + drift, 0.84, u < 0.5 ? PALETTE.stoneDust : PALETTE.woodDark, 1);
  }
  if ((seed & 1) === 0) {
    curtain.rect(0.6, 0.36, 0.79, 0.5, PALETTE.outline);
    curtain.rect(0.63, 0.39, 0.76, 0.47, highlight);
  }
  const drawPost = (point) => {
    px(ctx, point[0] - 2, point[1] - 46, PALETTE.outline, 5, 48);
    px(ctx, point[0] - 1, point[1] - 45, PALETTE.woodDark, 3, 45);
    px(ctx, point[0], point[1] - 44, PALETTE.rustMid, 1, 38);
  };
  if (!connections.start) drawPost(start);
  drawPost(end);
  curtain.nativeLine(0.1, 0.13, 0.36, 0.14, highlight);
  curtain.nativeLine(0.58, 0.47, 0.88, 0.46, variant === 'isolation' ? PALETTE.clothBlue : PALETTE.stoneDust);
  curtain.nativeLine(0.22, 0.72, 0.48, 0.74, PALETTE.woodDark);
  for (const u of [0.2, 0.38, 0.56, 0.74]) {
    const p = curtain.point(u, 0.11);
    nativePx(ctx, p[0] - 0.5, p[1] - 0.5, PALETTE.hostBone);
  }
  if (!connections.start) nativeLinePx(ctx, start[0] + 0.5, start[1] - 43.5, start[0] + 0.5, start[1] - 4.5, PALETTE.rustLight);
  nativeLinePx(ctx, end[0] + 0.5, end[1] - 43.5, end[0] + 0.5, end[1] - 4.5, PALETTE.rustMid);
}

function drawBrokenHalo(ctx, x, y, seed) {
  const segments = [
    [-9, -5, -5, -10],
    [-3, -12, 3, -13],
    [6, -11, 10, -6],
    [11, -2, 9, 3],
    [-10, 2, -12, -1]
  ];
  for (let i = 0; i < segments.length; i += 1) {
    if (((seed + i) % 5) === 2) continue;
    const [x0, y0, x1, y1] = segments[i];
    linePx(ctx, x + x0, y + y0, x + x1, y + y1, PALETTE.outline, 3);
    linePx(ctx, x + x0, y + y0 - 1, x + x1, y + y1 - 1, PALETTE.hostBone, 1);
  }
}

export function drawSouthMeasureIntakeClerkWicket(ctx, cx, cy, seed, opts = {}) {
  const state = ['dormant', 'stirring', 'opened'].includes(opts.state)
    ? opts.state
    : ['dormant', 'stirring', 'opened'].includes(opts.variant)
      ? opts.variant
      : (opts.opened ? 'opened' : 'dormant');
  const wall = wallRunFace(ctx, cx, cy, {
    plane: opts.wallPlane === 'se' ? 'se' : 'sw',
    side: opts.wallSide === 'far' ? 'far' : 'near',
    span: 1
  });
  const wicket = faceTools(ctx, wall.point(0.06, 0.16), wall.point(0.94, 0.16), wall.point(0.94, 0.88), wall.point(0.06, 0.88));
  wicket.rect(0, 0, 1, 1, PALETTE.outline);
  wicket.rect(0.035, 0.04, 0.965, 0.95, PALETTE.woodDark);
  wicket.rect(0.09, 0.1, 0.91, 0.78, PALETTE.void);
  wicket.line(0.04, 0.04, 0.96, 0.04, PALETTE.stoneDust, 2);
  for (const u of [0.14, 0.31, 0.69, 0.86]) {
    wicket.line(u, 0.08, u, 0.8, PALETTE.outline, 4);
    wicket.line(u + 0.012, 0.1, u + 0.012, 0.77, PALETTE.rustMid, 1);
  }
  wicket.rect(0.02, 0.76, 0.98, 0.96, PALETTE.outline);
  wicket.rect(0.04, 0.78, 0.96, 0.91, PALETTE.woodMid);
  wicket.line(0.05, 0.78, 0.95, 0.78, PALETTE.woodLight, 2);

  const anchor = wicket.point(0.5, 0.79);
  const lean = (seed & 1) ? 1 : -1;
  const headX = anchor[0] + lean * 2;
  const headY = anchor[1] - 34;
  drawBrokenHalo(ctx, headX, headY - 4, seed);

  // The clerk remains a small human figure inside the wicket. The coat and
  // shoulders establish the person before the opened ribs and prayer hands.
  poly(ctx, PALETTE.outline, [
    [anchor[0] - 3, anchor[1] - 29],
    [anchor[0] - 9, anchor[1] - 25],
    [anchor[0] - 7, anchor[1]],
    [anchor[0] + 7, anchor[1]],
    [anchor[0] + 8, anchor[1] - 22],
    [anchor[0] + 4, anchor[1] - 27]
  ]);
  poly(ctx, PALETTE.clothDark, [
    [anchor[0] - 3, anchor[1] - 27],
    [anchor[0] - 7, anchor[1] - 24],
    [anchor[0] - 5, anchor[1] - 2],
    [anchor[0] + 5, anchor[1] - 2],
    [anchor[0] + 6, anchor[1] - 21],
    [anchor[0] + 3, anchor[1] - 25]
  ]);
  poly(ctx, PALETTE.woodDark, [
    [anchor[0] - 3, anchor[1] - 26],
    [anchor[0] - 6, anchor[1] - 23],
    [anchor[0] - 4, anchor[1] - 3],
    [anchor[0], anchor[1] - 3],
    [anchor[0], anchor[1] - 25]
  ]);
  poly(ctx, PALETTE.rustDark, [
    [anchor[0] + 1, anchor[1] - 24],
    [anchor[0] + 5, anchor[1] - 20],
    [anchor[0] + 4, anchor[1] - 3],
    [anchor[0] + 1, anchor[1] - 3]
  ]);
  poly(ctx, PALETTE.outline, [
    [headX - 3, headY - 7],
    [headX + 4, headY - 6],
    [headX + 6, headY - 2],
    [headX + 4, headY + 6],
    [headX - 3, headY + 6],
    [headX - 5, headY + 2],
    [headX - 5, headY - 4]
  ]);
  poly(ctx, PALETTE.skinDark, [
    [headX - 2, headY - 5],
    [headX + 3, headY - 4],
    [headX + 4, headY - 1],
    [headX + 3, headY + 4],
    [headX - 2, headY + 4],
    [headX - 3, headY + 1],
    [headX - 3, headY - 3]
  ]);
  poly(ctx, PALETTE.skinMid, [
    [headX - 2, headY - 4],
    [headX + 1, headY - 3],
    [headX + 1, headY + 2],
    [headX - 2, headY + 3]
  ]);
  px(ctx, headX + lean * 2, headY - 1, PALETTE.hostBone, 2, 4);
  px(ctx, headX - 2, headY, PALETTE.void, 1, 2);
  px(ctx, headX + 1, headY + 3, PALETTE.rustDark, 2, 1);

  // One butterflied sternum opening. Bone carries the silhouette, with a
  // single small wound and thin black-gold seams kept under the coat line.
  const sternumX = anchor[0] + lean;
  const sternumY = anchor[1] - 18;
  px(ctx, sternumX - 2, sternumY - 5, PALETTE.hostRed, 5, 11);
  px(ctx, sternumX - 1, sternumY - 3, state === 'opened' ? PALETTE.rustLight : PALETTE.rustDark, 3, 6);
  for (let rib = 0; rib < 3; rib += 1) {
    const y = sternumY - 5 + rib * 5;
    linePx(ctx, sternumX - 1, y, sternumX - 7 - rib, y - 3 + rib, PALETTE.outline, 3);
    linePx(ctx, sternumX, y - 1, sternumX - 6 - rib, y - 4 + rib, PALETTE.hostBone, 1);
    linePx(ctx, sternumX + 1, y, sternumX + 6 + rib, y - 2 - rib, PALETTE.outline, 3);
    linePx(ctx, sternumX + 1, y - 1, sternumX + 5 + rib, y - 3 - rib, PALETTE.hostBone, 1);
  }
  linePx(ctx, sternumX, sternumY - 4, anchor[0] - 5, anchor[1] - 27, PALETTE.hostBlack, 1);
  linePx(ctx, sternumX + 1, sternumY - 4, anchor[0] - 4, anchor[1] - 27, PALETTE.hostGold, 1);

  const handY = anchor[1] - 9;
  linePx(ctx, anchor[0] - 7, anchor[1] - 18, anchor[0] - 2, handY, PALETTE.outline, 4);
  linePx(ctx, anchor[0] + 7, anchor[1] - 16, anchor[0] + 1, handY, PALETTE.outline, 4);
  poly(ctx, PALETTE.outline, [
    [anchor[0] - 3, handY - 4],
    [anchor[0], handY - 8],
    [anchor[0] + 3, handY - 4],
    [anchor[0] + 3, handY + 4],
    [anchor[0], handY + 6],
    [anchor[0] - 3, handY + 3]
  ]);
  poly(ctx, PALETTE.skinMid, [
    [anchor[0] - 2, handY - 3],
    [anchor[0], handY - 6],
    [anchor[0] + 2, handY - 3],
    [anchor[0] + 2, handY + 3],
    [anchor[0], handY + 4],
    [anchor[0] - 2, handY + 2]
  ]);
  for (const offset of [-2, 0, 2]) linePx(ctx, anchor[0] + offset, handY - 7, anchor[0] + offset, handY + 1, PALETTE.hostBone, 1);
  if (state === 'stirring' || state === 'opened') {
    px(ctx, headX - 2, headY, PALETTE.hostGold, 1, 1);
    linePx(ctx, sternumX + 1, sternumY, anchor[0] + 5, anchor[1] - 4, PALETTE.hostGold, 1);
  }
  // Wicket grain, rib cortex, prayer-finger seams, and a tiny state-aware eye
  // light resolve at one physical pixel without enlarging the human clerk.
  nativeLinePx(ctx, anchor[0] - 6.5, anchor[1] - 24.5, anchor[0] - 4.5, anchor[1] - 4.5, PALETTE.woodLight);
  nativeLinePx(ctx, sternumX - 0.5, sternumY - 4.5, sternumX - 6.5, sternumY - 7.5, PALETTE.hostBone);
  nativeLinePx(ctx, sternumX + 1.5, sternumY - 3.5, sternumX + 6.5, sternumY - 6.5, PALETTE.stoneDust);
  nativeLinePx(ctx, anchor[0] - 0.5, handY - 6.5, anchor[0] - 0.5, handY + 2.5, PALETTE.hostBone);
  nativePx(ctx, headX - 2.5, headY - 0.5, state === 'dormant' ? PALETTE.stoneDark : PALETTE.hostGold);
}
