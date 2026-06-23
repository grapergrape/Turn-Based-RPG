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

// Wall-mounted fixtures and doors.

export function drawChapelDoubleDoor(ctx, cx, cy, seed, opts = {}) {
  const opened = Boolean(opts.opened);
  const leaf = opts.leaf === 'south' ? 'south' : 'north';
  // wallPlane picks which iso wall direction the doorway sits on; wallRunFace
  // derives the run axis from it, so the door always mounts on a real slanted
  // face ('se' = up-right face, 'sw' = up-left face) and never goes flat.
  // wallSide picks which face of that wall the door hangs on: 'near' (default,
  // the camera-facing front) or 'far' (the back face, seen through the opening
  // so the door reads on the far/lobby side of the wall).
  const wallPlane = opts.wallPlane === 'sw' ? 'sw' : 'se';
  const wallSide = opts.wallSide === 'far' ? 'far' : 'near';
  const rawProgress = opened ? (typeof opts.progress === 'number' ? opts.progress : 1) : 0;
  const frame = opened ? Math.max(1, Math.min(4, Math.ceil(rawProgress * 4))) : 0;
  const rng = rngFrom(hash2D(seed + 41, seed * 3 + 17));
  const doorFace = wallRunFace(ctx, cx, cy, { plane: wallPlane, side: wallSide, span: 2 });
  const lerp = (a, b, t) => a + (b - a) * t;

  // When the door is recessed on the far face, the wall has visible thickness:
  // draw the stone reveal (the inner surfaces of the opening between the near
  // wall edge and the recessed door) so the wall reads as a deep doorway over
  // the door instead of leaving a see-through gap to the room behind.
  const nearFace = wallSide === 'far'
    ? wallRunFace(ctx, cx, cy, { plane: wallPlane, side: 'near', span: 2 })
    : null;
  const drawWallReveal = () => {
    if (!nearFace) return;
    const F = (u, v) => doorFace.point(u, v);
    const N = (u, v) => nearFace.point(u, v);
    const top = [F(0, 0), F(1, 0), N(1, 0), N(0, 0)];
    const left = [F(0, 1), F(0, 0), N(0, 0), N(0, 1)];
    const right = [F(1, 0), F(1, 1), N(1, 1), N(1, 0)];
    poly(ctx, PALETTE.stoneDark, right);
    poly(ctx, PALETTE.stoneDark, left);
    poly(ctx, PALETTE.stoneMid, top);
    // Crisp cut-stone lip on the near edge of the opening.
    const e = (a, b, color, size) => linePx(ctx, a[0], a[1], b[0], b[1], color, size);
    e(N(0, 0), N(1, 0), PALETTE.stoneLight, 1);
    e(N(1, 0), N(1, 1), PALETTE.outline, 2);
    e(N(0, 0), N(0, 1), PALETTE.outline, 2);
  };

  const drawBolt = (face, u, v, color = PALETTE.hostGold) => {
    const p = face.point(u, v);
    px(ctx, p[0] - 1, p[1] - 1, color, 2, 2);
  };

  const drawClosedDoor = (face) => {
    face.rect(0.0, 0.0, 1.0, 1.0, PALETTE.outline);
    face.rect(0.025, 0.035, 0.975, 0.965, PALETTE.stoneDark);
    face.rect(0.07, 0.065, 0.93, 0.935, PALETTE.outline);
    face.rect(0.105, 0.095, 0.895, 0.905, PALETTE.woodDark);
    face.rect(0.145, 0.13, 0.485, 0.875, PALETTE.woodMid);
    face.rect(0.515, 0.13, 0.855, 0.875, PALETTE.woodMid);

    face.line(0.02, 0.03, 0.98, 0.03, PALETTE.stoneDust, 3);
    face.line(0.02, 0.97, 0.98, 0.97, PALETTE.outline, 3);
    face.line(0.045, 0.06, 0.045, 0.94, PALETTE.stoneLight, 1);
    face.line(0.955, 0.06, 0.955, 0.94, PALETTE.outline, 3);
    face.line(0.13, 0.12, 0.87, 0.12, PALETTE.woodLight, 1);
    face.line(0.5, 0.105, 0.5, 0.905, PALETTE.outline, 4);
    face.line(0.482, 0.14, 0.482, 0.86, PALETTE.rustDark, 1);
    face.line(0.518, 0.14, 0.518, 0.86, PALETTE.rustLight, 1);

    for (const u of [0.23, 0.36, 0.64, 0.77]) {
      face.line(u, 0.15, u, 0.86, PALETTE.woodDark, 1);
    }
    for (const v of [0.26, 0.52, 0.74]) {
      face.line(0.12, v, 0.88, v, PALETTE.outline, 4);
      face.line(0.16, v - 0.02, 0.84, v - 0.02, PALETTE.rustDark, 2);
      face.line(0.2, v - 0.03, 0.8, v - 0.03, PALETTE.rustMid, 1);
      for (const u of [0.17, 0.38, 0.62, 0.83]) drawBolt(face, u, v - 0.045);
    }

    for (const hingeU of [0.12, 0.88]) {
      face.line(hingeU, 0.13, hingeU, 0.88, PALETTE.outline, 4);
      face.line(hingeU + (hingeU < 0.5 ? 0.035 : -0.035), 0.17, hingeU + (hingeU < 0.5 ? 0.035 : -0.035), 0.84, PALETTE.rustMid, 2);
      for (const v of [0.27, 0.52, 0.77]) {
        const p = face.point(hingeU, v);
        px(ctx, p[0] - 2, p[1] - 3, PALETTE.outline, 6, 7);
        px(ctx, p[0] - 1, p[1] - 2, PALETTE.rustDark, 4, 5);
        px(ctx, p[0], p[1] - 1, PALETTE.hostGold, 2, 2);
      }
    }

    const lock = face.point(0.535, 0.56);
    px(ctx, lock[0] - 7, lock[1] - 5, PALETTE.outline, 16, 10);
    px(ctx, lock[0] - 6, lock[1] - 4, PALETTE.rustDark, 14, 7);
    px(ctx, lock[0] - 1, lock[1] - 3, PALETTE.hostGold, 5, 3);
    px(ctx, lock[0], lock[1] + 2, PALETTE.void, 2, 3);

    for (let i = 0; i < 4; i += 1) {
      const scar = face.point(0.14 + rng() * 0.72, 0.16 + rng() * 0.66);
      px(ctx, scar[0], scar[1], rng() < 0.55 ? PALETTE.woodLight : PALETTE.rustDark, rng() < 0.45 ? 2 : 1, 1);
    }
  };

  if (!opened || frame === 0) {
    if (leaf === 'south') return;
    drawClosedDoor(doorFace);
    drawWallReveal();
    return;
  }

  if (leaf === 'south') return;

  const drawOpeningFrame = () => {
    const sill = doorFace.point(0.5, 1.0);
    drawShadowBlob(ctx, sill[0], sill[1], TILE_WIDTH * 0.9, TILE_HEIGHT * 0.75);
    doorFace.rect(0.0, 0.0, 1.0, 1.0, PALETTE.outline);
    doorFace.rect(0.05, 0.06, 0.95, 0.94, PALETTE.void);
    doorFace.rect(0.09, 0.11, 0.91, 0.89, PALETTE.hostBlack);
    doorFace.line(0.0, 0.0, 1.0, 0.0, PALETTE.stoneDust, 4);
    doorFace.line(0.0, 1.0, 1.0, 1.0, PALETTE.outline, 4);
    doorFace.line(0.04, 0.08, 0.04, 0.92, PALETTE.stoneDark, 5);
    doorFace.line(0.96, 0.08, 0.96, 0.92, PALETTE.stoneDark, 5);
  };

  const drawDoorWing = (side, swing) => {
    const left = side === 'left';
    const hingeU = left ? 0.12 : 0.88;
    const freeClosedU = left ? 0.49 : 0.51;
    const freeOpenU = left ? 0.235 : 0.765;
    const freeU = lerp(freeClosedU, freeOpenU, swing);
    const topV = lerp(0.13, 0.035, swing);
    const bottomV = lerp(0.88, 0.965, swing);
    const hingeTop = doorFace.point(hingeU, 0.13);
    const hingeBottom = doorFace.point(hingeU, 0.88);
    const freeTop = doorFace.point(freeU, topV);
    const freeBottom = doorFace.point(freeU, bottomV);
    const wing = left
      ? faceTools(ctx, hingeTop, freeTop, freeBottom, hingeBottom)
      : faceTools(ctx, freeTop, hingeTop, hingeBottom, freeBottom);
    const hingeLocal = left ? 0.08 : 0.92;
    const hingeBand = left ? 0.18 : 0.82;
    const latchU = left ? 0.82 : 0.18;

    wing.rect(0.0, 0.0, 1.0, 1.0, PALETTE.outline);
    wing.rect(0.055, 0.05, 0.945, 0.95, PALETTE.woodDark);
    wing.rect(0.13, 0.1, 0.87, 0.9, PALETTE.woodMid);
    wing.line(0.08, 0.08, 0.92, 0.08, PALETTE.woodLight, 1);
    wing.line(0.08, 0.92, 0.92, 0.92, PALETTE.outline, 2);
    wing.line(hingeLocal, 0.08, hingeLocal, 0.92, PALETTE.outline, 4);
    wing.line(hingeBand, 0.12, hingeBand, 0.88, PALETTE.rustMid, 2);

    for (const u of [0.33, 0.62]) {
      wing.line(u, 0.13, u, 0.87, PALETTE.woodDark, 1);
    }
    for (const v of [0.28, 0.55, 0.76]) {
      wing.line(0.08, v, 0.92, v, PALETTE.outline, 3);
      wing.line(0.15, v - 0.025, 0.85, v - 0.025, PALETTE.rustMid, 1);
      for (const u of [0.2, 0.78]) drawBolt(wing, u, v - 0.045);
    }

    for (const v of [0.26, 0.52, 0.78]) {
      const p = wing.point(hingeLocal, v);
      px(ctx, p[0] - 2, p[1] - 3, PALETTE.outline, 5, 6);
      px(ctx, p[0] - 1, p[1] - 2, PALETTE.rustDark, 3, 4);
    }

    const latch = wing.point(latchU, 0.56);
    px(ctx, latch[0] - 4, latch[1] - 3, PALETTE.outline, 8, 6);
    px(ctx, latch[0] - 3, latch[1] - 2, PALETTE.rustDark, 6, 4);
    px(ctx, latch[0], latch[1] - 1, PALETTE.hostGold, 2, 2);
  };

  const swing = [0, 0.28, 0.52, 0.76, 1][frame];
  drawOpeningFrame();
  drawDoorWing('left', swing);
  drawDoorWing('right', swing);
  drawWallReveal();
}

export function drawChapelWindow(ctx, cx, cy, seed = 0, opts = {}) {
  const dim = Boolean(opts.dim);
  const flicker = opts.flicker ?? 0;
  const light = dim ? PALETTE.hostGold : PALETTE.flash;
  const warm = dim ? PALETTE.rustMid : PALETTE.hostGold;
  const stone = PALETTE.stoneDark;
  const faceTop = (x) => (cy - 64) + (x - (cx - 32)) * 0.5; // top edge of the SW face
  const faceBot = (x) => cy + (x - (cx - 32)) * 0.5;        // bottom edge of the SW face
  const xL = cx - 26;
  const xR = cx - 7; // the opening, inset within the face

  ctx.save();
  // Cold light through the glass, arched at the top, following the face slope.
  for (let x = xL; x <= xR; x += 1) {
    const u = (x - xL) / (xR - xL);
    const arch = Math.round(Math.pow(Math.abs(u - 0.5) * 2, 1.7) * 8);
    const top = faceTop(x) + 10 + arch;
    const bot = faceBot(x) - 8;
    if (bot <= top) continue;
    ctx.globalAlpha = 0.72 + (flicker ? 0.05 : 0);
    ctx.fillStyle = light;
    ctx.fillRect(x, Math.round(top), 1, Math.round(bot - top));
    ctx.globalAlpha = 0.4;
    ctx.fillStyle = warm;
    ctx.fillRect(x, Math.round(top), 1, 2);
    ctx.fillRect(x, Math.round(bot) - 2, 1, 2);
  }
  ctx.globalAlpha = 1;

  if (!dim) {
    // Inverted-cross muntin: a vertical upright (verticals stay vertical on the
    // face) and a LOW crossbar that follows the face slope.
    const midX = Math.round((xL + xR) / 2);
    px(ctx, midX, Math.round(faceTop(midX) + 11), stone, 1, Math.max(1, Math.round(faceBot(midX) - 9 - (faceTop(midX) + 11))));
    for (let x = xL + 1; x <= xR - 1; x += 1) px(ctx, x, Math.round(faceBot(x) - 15), stone, 1, 2);
  } else {
    // Iron bars across the cellar vent, each following the face slope.
    for (let x = xL + 2; x <= xR - 1; x += 4) px(ctx, x, Math.round(faceTop(x) + 9), stone, 1, Math.max(1, Math.round(faceBot(x) - 8 - (faceTop(x) + 9))));
  }
  // A few broken, dark panes.
  const rng = rngFrom(hash2D(seed + 3, seed * 7 + 1));
  for (let i = 0; i < 5; i += 1) {
    const x = xL + 2 + Math.floor(rng() * (xR - xL - 4));
    px(ctx, x, Math.round(faceTop(x) + 12 + rng() * 12), PALETTE.void, 2, 2);
  }
  ctx.restore();

  // A faint cold spill onto the floor below the window, toward the room.
  ctx.save();
  for (let i = 0; i < 5; i += 1) {
    const t = i / 4;
    const hw = 7 + Math.round(t * 12);
    ctx.globalAlpha = (dim ? 0.02 : 0.04) * (1 - t * 0.6);
    ctx.fillStyle = warm;
    ctx.fillRect((cx - 17) - hw, cy + 4 + i * 5, hw * 2, 5);
  }
  ctx.restore();
}

function swFaceTop(cx, cy, x) { return (cy - 64) + (x - (cx - 32)) * 0.5; }

function swFaceBot(cx, cy, x) { return cy + (x - (cx - 32)) * 0.5; }

function faceBand(ctx, cx, cy, xL, xR, topPad, botPad, color, w = 1) {
  for (let x = xL; x <= xR; x += w) {
    const t = swFaceTop(cx, cy, x) + topPad;
    const b = swFaceBot(cx, cy, x) - botPad;
    if (b > t) px(ctx, x, Math.round(t), color, w, Math.round(b - t));
  }
}

export function drawWallSafe(ctx, cx, cy, seed, opts = {}) {
  const opened = Boolean(opts.opened);
  const body = PALETTE.stoneDark;   // darker than the stoneMid wall -> reads
  const hi = PALETTE.stoneDust;     // lit top edge / bolts
  const bolt = PALETTE.stoneLight;
  const brass = PALETTE.hostGold;
  const xL = cx - 26;
  const xR = cx - 6;
  const topPad = 20;
  const botPad = 16;

  faceBand(ctx, cx, cy, xL - 2, xR + 2, topPad - 3, botPad - 3, PALETTE.outline); // dark recess frame
  for (let x = xL; x <= xR; x += 1) {
    const t = swFaceTop(cx, cy, x) + topPad;
    const b = swFaceBot(cx, cy, x) - botPad;
    if (b <= t) continue;
    px(ctx, x, Math.round(t), body, 1, Math.round(b - t));
    px(ctx, x, Math.round(t), hi, 1, 1); // lit top edge
    px(ctx, x, Math.round(b) - 1, PALETTE.void, 1, 1); // shaded bottom
  }
  // corner bolts
  for (const bx of [xL + 1, xR - 1]) {
    px(ctx, bx, Math.round(swFaceTop(cx, cy, bx) + topPad + 1), bolt, 2, 1);
    px(ctx, bx, Math.round(swFaceBot(cx, cy, bx) - botPad - 2), bolt, 2, 1);
  }
  const midX = Math.round((xL + xR) / 2);
  if (!opened) {
    const seamTop = Math.round(swFaceTop(cx, cy, midX) + topPad + 2);
    const seamBot = Math.round(swFaceBot(cx, cy, midX) - botPad - 2);
    px(ctx, midX, seamTop, PALETTE.void, 1, Math.max(1, seamBot - seamTop)); // door seam
    const ky = Math.round((swFaceTop(cx, cy, midX + 4) + swFaceBot(cx, cy, midX + 4)) / 2);
    px(ctx, midX + 3, ky - 3, brass, 5, 7); // keyhole plate
    px(ctx, midX + 5, ky - 1, PALETTE.void, 1, 3);
    px(ctx, xL + 4, Math.round(swFaceTop(cx, cy, xL + 4) + topPad + 5), brass, 1, 6); // sun-cross seal upright
    px(ctx, xL + 2, Math.round(swFaceTop(cx, cy, xL + 2) + topPad + 7), brass, 5, 1); // seal crossbar
  } else {
    faceBand(ctx, cx, cy, xL + 2, xR - 5, topPad + 2, botPad + 2, PALETTE.void); // empty black cavity
    for (let x = xR - 4; x <= xR; x += 1) { // door hanging open on its hinge
      const t = swFaceTop(cx, cy, x) + topPad + 1;
      const b = swFaceBot(cx, cy, x) - botPad - 1;
      if (b <= t) continue;
      px(ctx, x, Math.round(t), body, 1, Math.round(b - t));
      px(ctx, x, Math.round(t), hi, 1, 1);
    }
  }
  drawNoisePixels(ctx, xL, Math.round(swFaceTop(cx, cy, xL) + topPad), xR - xL, 14, [PALETTE.void, body], 0.05, seed);
}

export function drawWallStash(ctx, cx, cy, seed, opts = {}) {
  const opened = Boolean(opts.opened);
  const xL = cx - 25;
  const xR = cx - 7;
  const topPad = 24;
  const botPad = 18;
  const off = opened ? -6 : -3; // the stone sits proud of the face; pried further when looted

  faceBand(ctx, cx, cy, xL, xR, topPad, botPad, PALETTE.void); // the dark niche behind
  // cast shadow of the proud stone, on the face just left of it
  faceBand(ctx, cx, cy, xL + off, xL + off + 1, topPad + 1, botPad + 1, PALETTE.outline);
  for (let x = xL + 1; x <= xR - 1; x += 1) {
    const t = swFaceTop(cx, cy, x) + topPad + 1;
    const b = swFaceBot(cx, cy, x) - botPad - 1;
    if (b <= t) continue;
    px(ctx, x + off, Math.round(t), PALETTE.outline, 1, Math.round(b - t)); // edge
    px(ctx, x + off, Math.round(t) + 1, PALETTE.stoneLight, 1, Math.max(1, Math.round(b - t) - 2)); // lit stone
    px(ctx, x + off, Math.round(t) + 1, PALETTE.stoneDust, 1, 1); // top highlight
    px(ctx, x + off, Math.round(b) - 1, PALETTE.stoneDark, 1, 1); // shaded bottom
  }
  if (!opened) {
    const gy = Math.round((swFaceTop(cx, cy, xR - 1) + swFaceBot(cx, cy, xR - 1)) / 2);
    px(ctx, xR - 1, gy, PALETTE.hostGold, 2, 1); // a pale gleam from the dark gap
  }
  drawNoisePixels(ctx, xL, Math.round(swFaceTop(cx, cy, xL) + topPad), xR - xL, 12, [PALETTE.stoneDark, PALETTE.stoneDust], 0.05, seed);
}

export function drawWallStairDoor(ctx, cx, cy, seed) {
  const xL = cx - 30;
  const xR = cx + 2;
  const topPad = 7;
  const botPad = 3;

  // A cut-through stair mouth set into the wall. Darker than the wall block,
  // framed with lit cut-stone so the entrance reads at map scale.
  faceBand(ctx, cx, cy, xL - 3, xR + 3, topPad - 3, botPad - 2, PALETTE.outline);
  faceBand(ctx, cx, cy, xL, xR, topPad, botPad, PALETTE.void);
  faceBand(ctx, cx, cy, xL - 1, xL + 3, topPad - 1, botPad + 2, PALETTE.stoneMid);
  faceBand(ctx, cx, cy, xL + 3, xL + 7, topPad + 1, botPad + 4, PALETTE.stoneLight);
  faceBand(ctx, cx, cy, xR - 7, xR - 3, topPad + 1, botPad + 4, PALETTE.stoneDark);
  faceBand(ctx, cx, cy, xR - 3, xR + 1, topPad - 1, botPad + 2, PALETTE.stoneDark);

  // Lintel and old latch plate.
  for (let x = xL - 2; x <= xR + 2; x += 1) {
    const y = Math.round(swFaceTop(cx, cy, x) + topPad - 2);
    px(ctx, x, y, PALETTE.stoneDust, 1, 3);
  }
  const latchX = xR - 8;
  const latchY = Math.round((swFaceTop(cx, cy, latchX) + swFaceBot(cx, cy, latchX)) / 2);
  px(ctx, latchX - 1, latchY - 4, PALETTE.outline, 5, 8);
  px(ctx, latchX, latchY - 3, PALETTE.rustDark, 3, 6);
  px(ctx, latchX + 1, latchY - 1, PALETTE.hostGold, 2, 1);

  // Visible stair treads vanishing upward into black.
  for (let i = 0; i < 4; i += 1) {
    const left = xL + 6 + i * 2;
    const right = xR - 7 - i * 2;
    if (right <= left) continue;
    for (let x = left; x <= right; x += 1) {
      const y = Math.round(swFaceBot(cx, cy, x) - botPad - 4 - i * 5);
      px(ctx, x, y, i < 2 ? PALETTE.stoneMid : PALETTE.stoneDark, 1, 2);
    }
  }
  for (let x = xL + 5; x <= xR - 5; x += 1) {
    const y = Math.round(swFaceBot(cx, cy, x) - botPad + 1);
    px(ctx, x, y, x % 2 ? PALETTE.stoneMid : PALETTE.stoneDust, 1, 2);
  }
  drawNoisePixels(ctx, xL, Math.round(swFaceTop(cx, cy, xL) + topPad), xR - xL, 31, [PALETTE.void, PALETTE.stoneDark], 0.05, seed);
}
