// Reusable isometric pixel-art primitives.
//
// Everything in the scene that is not an actor sprite is built from these:
// floor diamonds, volumetric prism/wall blocks, contact shadows, dithered
// grime, cracks, rubble, Host growth, and the hand-built props that dress the
// ruined chapel. Randomness is always SEEDED (hash2D) so the scene is stable
// frame to frame and never shimmers.

import { PALETTE } from './palette.js';
import { TILE_WIDTH, TILE_HEIGHT, WALL_HEIGHT } from './renderConfig.js';

// ---------------------------------------------------------------------------
// Seeded helpers
// ---------------------------------------------------------------------------

// Deterministic 2D integer hash -> unsigned 32-bit.
export function hash2D(x, y) {
  let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return (h ^ (h >>> 16)) >>> 0;
}

// Tiny seeded RNG (mulberry32). Returns a function producing floats in [0, 1).
export function rngFrom(seed) {
  let a = (seed | 0) >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------------------------------------------------------------------------
// Geometry helpers
// ---------------------------------------------------------------------------

function diamond(cx, cy, w, h) {
  const hw = w / 2;
  const hh = h / 2;
  return {
    top: [cx, cy - hh],
    right: [cx + hw, cy],
    bottom: [cx, cy + hh],
    left: [cx - hw, cy]
  };
}

function poly(ctx, color, points) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i += 1) {
    ctx.lineTo(points[i][0], points[i][1]);
  }
  ctx.closePath();
  ctx.fill();
}

function px(ctx, x, y, color, w = 1, h = 1) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), w, h);
}

function linePx(ctx, x0, y0, x1, y1, color, size = 1) {
  const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    px(ctx, x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, color, size, size);
  }
}

function mixPoint(a, b, t) {
  return [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t
  ];
}

function faceTools(ctx, topLeft, topRight, bottomRight, bottomLeft) {
  const point = (u, v) => {
    const top = mixPoint(topLeft, topRight, u);
    const bottom = mixPoint(bottomLeft, bottomRight, u);
    return mixPoint(top, bottom, v);
  };

  return {
    point,
    line(u0, v0, u1, v1, color, size = 1) {
      const a = point(u0, v0);
      const b = point(u1, v1);
      linePx(ctx, a[0], a[1], b[0], b[1], color, size);
    },
    rect(u0, v0, u1, v1, color) {
      poly(ctx, color, [
        point(u0, v0),
        point(u1, v0),
        point(u1, v1),
        point(u0, v1)
      ]);
    }
  };
}

// A slanted face spanning `span` wall blocks, used to mount a wall fixture (a
// door, a future barred gate) flush on the stone. In this fixed iso projection a
// wall runs along exactly one of two ground directions, and `plane` names which:
//   'se' -> wall runs along +y; faces slope up-right (the SE/NW pair).
//   'sw' -> wall runs along +x; faces slope up-left  (the SW/NE pair).
// `plane` therefore fixes the run direction too, so the result is ALWAYS a real
// slanted face (never a degenerate flat one). `side` then picks which of that
// wall's two parallel faces to mount on:
//   'near' (default) -> the camera-facing face (SE for 'se', SW for 'sw'); used
//                       when the fixture should read from the front of the wall.
//   'far'            -> the parallel face one tile-thickness back (NW for 'se',
//                       NE for 'sw'). For a doorway (a gap with no wall block to
//                       hide it) this far face is visible THROUGH the opening, so
//                       the door reads as mounted on the far/back side of the
//                       wall instead of the front. Solid walls hide their far
//                       face, so 'far' is only meaningful inside an opening.
function wallRunFace(ctx, cx, cy, opts = {}) {
  const plane = opts.plane === 'sw' ? 'sw' : 'se';
  const side = opts.side === 'far' ? 'far' : 'near';
  const span = Math.max(1, Math.floor(opts.span ?? 1));
  const tile = (index) => {
    const dx = plane === 'sw' ? index * TILE_WIDTH / 2 : -index * TILE_WIDTH / 2;
    const dy = index * TILE_HEIGHT / 2;
    const base = diamond(cx + dx, cy + dy, TILE_WIDTH, TILE_HEIGHT);
    const cap = diamond(cx + dx, cy + dy - WALL_HEIGHT, TILE_WIDTH, TILE_HEIGHT);
    return { base, cap };
  };
  const first = tile(0);
  const last = tile(span - 1);

  if (plane === 'sw') {
    if (side === 'far') {
      return faceTools(ctx, first.cap.top, last.cap.right, last.base.right, first.base.top);
    }
    return faceTools(ctx, first.cap.left, last.cap.bottom, last.base.bottom, first.base.left);
  }
  if (side === 'far') {
    return faceTools(ctx, last.cap.left, first.cap.top, first.base.top, last.base.left);
  }
  return faceTools(ctx, last.cap.bottom, first.cap.right, first.base.right, last.base.bottom);
}

// ---------------------------------------------------------------------------
// Orientation (reusable iso facings for free-standing props)
// ---------------------------------------------------------------------------
//
// A free-standing prop sits on a floor diamond, but its footprint long-axis and
// "front" can face any of the four isometric ground directions. One draw
// function can therefore be reused at any rotation: the same table runs along
// either diagonal, the same counter faces the room or the wall. Orientation is
// authored as `orient` on the level object and forwarded by the sprite catalog
// (see the `oriented()` helper there) as `opts.orient`.
//
// The four facings name the screen direction the prop's FRONT points:
//   'se' (default, front toward lower-right), 'sw', 'nw', 'ne'.
//
// Lighting stays correct in every facing because the box draws its two visible
// faces by SCREEN position: the lower-left face is always the lit ramp, the
// lower-right face the shade ramp, the cap the top. Rotating a prop therefore
// never moves the light off the upper-left, so a mirrored copy never looks
// lit from the wrong side.

export const ORIENTS = ['se', 'sw', 'nw', 'ne'];

export function normalizeOrient(orient) {
  return ORIENTS.includes(orient) ? orient : 'se';
}

// Local footprint frame for an oriented prop. `point(la, lb, h)` maps local
// footprint coords (tile units; la = long axis A, lb = depth axis B) raised
// h px to a screen point, rotated for the chosen facing. Each facing is a 90deg
// isometric rotation of the default basis, so a piece authored once renders at
// any of the four facings without re-drawing.
function isoFrame(cx, cy, orient) {
  const o = normalizeOrient(orient);
  const HW = TILE_WIDTH / 2;
  const HH = TILE_HEIGHT / 2;
  const basis = {
    se: [[HW, HH], [-HW, HH]],
    sw: [[-HW, HH], [-HW, -HH]],
    nw: [[-HW, -HH], [HW, -HH]],
    ne: [[HW, -HH], [HW, HH]]
  };
  const [ax, ay] = basis[o];
  return {
    orient: o,
    point: (la, lb, h = 0) => [
      Math.round(cx + la * ax[0] + lb * ay[0]),
      Math.round(cy + la * ax[1] + lb * ay[1] - h)
    ]
  };
}

// A raised rectangular box on an oriented footprint. lenA x lenB in tile units,
// raised `lift` px off the floor, with `height` px of body. Faces are colored by
// SCREEN position so light stays upper-left at every facing: the lower-left face
// uses `lit`, the lower-right face `shade`, the cap `top`. Returns the resolved
// base/cap screen corners so callers can add edge detail.
function orientedBox(ctx, frame, lenA, lenB, height, colors, lift = 0) {
  const ha = lenA / 2;
  const hb = lenB / 2;
  const corners = [
    frame.point(-ha, -hb, lift),
    frame.point(ha, -hb, lift),
    frame.point(ha, hb, lift),
    frame.point(-ha, hb, lift)
  ];
  let top = corners[0];
  let bottom = corners[0];
  let left = corners[0];
  let right = corners[0];
  for (const p of corners) {
    if (p[1] < top[1]) top = p;
    if (p[1] > bottom[1]) bottom = p;
    if (p[0] < left[0]) left = p;
    if (p[0] > right[0]) right = p;
  }
  const up = (p) => [p[0], p[1] - height];
  const capTop = up(top);
  const capBottom = up(bottom);
  const capLeft = up(left);
  const capRight = up(right);

  poly(ctx, colors.lit, [capLeft, capBottom, bottom, left]); // lower-left face
  poly(ctx, colors.shade, [capBottom, capRight, right, bottom]); // lower-right face
  poly(ctx, colors.top, [capTop, capRight, capBottom, capLeft]); // top cap

  if (colors.outline) {
    ctx.strokeStyle = colors.outline;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(capTop[0], capTop[1]);
    ctx.lineTo(capRight[0], capRight[1]);
    ctx.lineTo(right[0], right[1]);
    ctx.lineTo(bottom[0], bottom[1]);
    ctx.lineTo(left[0], left[1]);
    ctx.lineTo(capLeft[0], capLeft[1]);
    ctx.closePath();
    ctx.stroke();
  }

  return {
    base: { top, bottom, left, right },
    cap: { top: capTop, bottom: capBottom, left: capLeft, right: capRight }
  };
}

// Footprint screen extent (width, height) for a box, used to size the contact
// shadow. The extent is identical across facings (the basis is a pure rotation),
// so a centred shadow diamond covers every orientation.
function footprintExtent(lenA, lenB) {
  return {
    w: (lenA + lenB) * (TILE_WIDTH / 2),
    h: (lenA + lenB) * (TILE_HEIGHT / 2)
  };
}

// A single vertical wooden leg rising `height` px from a floor corner `p`.
function drawPropLeg(ctx, p, height, color, outline = PALETTE.outline) {
  px(ctx, p[0] - 1, p[1] - height, outline, 4, height + 1);
  px(ctx, p[0], p[1] - height, color, 2, height);
}

// ---------------------------------------------------------------------------
// Core volumes
// ---------------------------------------------------------------------------

// Flat floor diamond centred at (cx, cy).
export function drawIsoDiamond(ctx, cx, cy, w, h, color) {
  const d = diamond(cx, cy, w, h);
  poly(ctx, color, [d.top, d.right, d.bottom, d.left]);
}

// A raised box: top cap diamond plus two lit/shaded vertical faces. (cx, cy)
// is the centre of the base (floor) diamond; heightPx raises the cap.
export function drawIsoPrism(ctx, cx, cy, w, h, heightPx, colors) {
  const base = diamond(cx, cy, w, h);
  const cap = diamond(cx, cy - heightPx, w, h);

  // Left-front face (toward lower-left).
  poly(ctx, colors.left, [cap.left, cap.bottom, base.bottom, base.left]);
  // Right-front face (toward lower-right).
  poly(ctx, colors.right, [cap.bottom, cap.right, base.right, base.bottom]);
  // Top cap.
  poly(ctx, colors.top, [cap.top, cap.right, cap.bottom, cap.left]);

  if (colors.outline) {
    ctx.strokeStyle = colors.outline;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cap.top[0], cap.top[1]);
    ctx.lineTo(cap.right[0], cap.right[1]);
    ctx.lineTo(base.right[0], base.right[1]);
    ctx.lineTo(base.bottom[0], base.bottom[1]);
    ctx.lineTo(base.left[0], base.left[1]);
    ctx.lineTo(cap.left[0], cap.left[1]);
    ctx.closePath();
    ctx.stroke();
  }
}

// Soft-edged dark contact shadow (a squashed dark diamond) under props/actors.
export function drawShadowBlob(ctx, cx, cy, w, h) {
  ctx.save();
  ctx.globalAlpha = 0.32;
  drawIsoDiamond(ctx, cx, cy, w, h, PALETTE.void);
  ctx.globalAlpha = 0.18;
  drawIsoDiamond(ctx, cx, cy, w + 4, h + 2, PALETTE.void);
  ctx.restore();
}

export function drawPixelShadow(ctx, cx, cy, w, h) {
  drawShadowBlob(ctx, cx, cy, w, h);
}

// Hard-banded, baked-looking warm light. Kept very low alpha so it reads as
// stained floor illumination, not bloom.
export function drawWarmLightPool(ctx, cx, cy, seed = 0, flicker = 0) {
  ctx.save();
  ctx.globalAlpha = 0.1 + (flicker ? 0.03 : 0);
  drawIsoDiamond(ctx, cx, cy + 1, 78, 36, PALETTE.rustDark);
  ctx.globalAlpha = 0.08 + (flicker ? 0.03 : 0);
  drawIsoDiamond(ctx, cx, cy, 52, 24, PALETTE.rustMid);
  ctx.globalAlpha = 0.06 + (flicker ? 0.02 : 0);
  drawIsoDiamond(ctx, cx, cy - 1, 30, 14, PALETTE.hostGold);
  ctx.restore();
  drawNoisePixels(ctx, cx - 28, cy - 10, 56, 20, [PALETTE.rustDark, PALETTE.stoneDark], 0.02, seed);
}

// ---------------------------------------------------------------------------
// Surface detail
// ---------------------------------------------------------------------------

// Hard 2px-checker dither between two colours over a rect, jittered by seed.
export function drawDitherRect(ctx, x, y, w, h, colorA, colorB, seed = 0) {
  const ox = seed & 1;
  for (let j = 0; j < h; j += 1) {
    for (let i = 0; i < w; i += 1) {
      const on = ((i + j + ox) & 1) === 0;
      const color = on ? colorA : colorB;
      if (!color) continue;
      px(ctx, x + i, y + j, color);
    }
  }
}

// Scatter individual pixels of the given colours across a rect.
export function drawNoisePixels(ctx, x, y, w, h, colors, density, seed = 0) {
  const rng = rngFrom(hash2D(seed + x * 7, y * 13 + 1));
  const count = Math.max(1, Math.floor(w * h * density));
  for (let i = 0; i < count; i += 1) {
    const dx = Math.floor(rng() * w);
    const dy = Math.floor(rng() * h);
    const color = colors[Math.floor(rng() * colors.length)];
    px(ctx, x + dx, y + dy, color);
  }
}

// Localized floor dirt used near walls, furniture, and old traffic paths.
export function drawFloorGrime(ctx, cx, cy, seed, intensity = 1) {
  ctx.save();
  ctx.globalAlpha = 0.12 * intensity;
  drawIsoDiamond(ctx, cx, cy + 2, TILE_WIDTH - 10, TILE_HEIGHT - 6, PALETTE.stoneDark);
  ctx.globalAlpha = 0.08 * intensity;
  drawIsoDiamond(ctx, cx - 7, cy + 2, Math.floor(TILE_WIDTH * 0.45), Math.floor(TILE_HEIGHT * 0.5), PALETTE.rustDark);
  ctx.restore();
  drawNoisePixels(ctx, cx - 24, cy - 9, 48, 18, [PALETTE.stoneDark, PALETTE.rustDark], 0.025 * intensity, seed);
}

export function drawScorchMark(ctx, cx, cy, seed) {
  ctx.save();
  ctx.globalAlpha = 0.34;
  drawIsoDiamond(ctx, cx, cy, 42, 19, PALETTE.void);
  ctx.globalAlpha = 0.18;
  drawIsoDiamond(ctx, cx + 4, cy + 1, 30, 13, PALETTE.rustDark);
  ctx.restore();
  drawNoisePixels(ctx, cx - 18, cy - 8, 36, 16, [PALETTE.stoneDark, PALETTE.rustDark], 0.08, seed);
}

export function drawWaxStain(ctx, cx, cy, seed) {
  ctx.save();
  ctx.globalAlpha = 0.38;
  drawIsoDiamond(ctx, cx, cy, 24, 11, PALETTE.hostBone);
  ctx.globalAlpha = 0.2;
  drawIsoDiamond(ctx, cx + 7, cy + 2, 16, 7, PALETTE.stoneDust);
  ctx.restore();
  drawNoisePixels(ctx, cx - 12, cy - 5, 24, 10, [PALETTE.hostBone, PALETTE.stoneDust], 0.04, seed);
}

// A few short crack strokes radiating around a point.
export function drawCracks(ctx, cx, cy, seed, count = 3) {
  const rng = rngFrom(hash2D(seed + 17, seed * 3 + 5));
  ctx.fillStyle = PALETTE.stoneDark;
  for (let i = 0; i < count; i += 1) {
    let x = cx + Math.floor((rng() - 0.5) * 10);
    let y = cy + Math.floor((rng() - 0.5) * 6);
    const len = 2 + Math.floor(rng() * 4);
    const dirX = rng() < 0.5 ? 1 : -1;
    const dirY = rng() < 0.5 ? 1 : -1;
    for (let s = 0; s < len; s += 1) {
      px(ctx, x, y, PALETTE.stoneDark);
      if (rng() < 0.7) x += dirX;
      if (rng() < 0.4) y += dirY;
    }
  }
}

// A loose cluster of small rubble chunks (drawn flat on the floor).
export function drawRubbleCluster(ctx, cx, cy, seed, count = 5) {
  const rng = rngFrom(hash2D(seed + 91, seed * 7 + 3));
  for (let i = 0; i < count; i += 1) {
    const dx = Math.floor((rng() - 0.5) * 16);
    const dy = Math.floor((rng() - 0.5) * 8);
    const s = 1 + Math.floor(rng() * 2);
    const tone = rng();
    const top = tone < 0.5 ? PALETTE.stoneLight : PALETTE.stoneMid;
    px(ctx, cx + dx, cy + dy, PALETTE.stoneDark, s + 1, s + 1);
    px(ctx, cx + dx, cy + dy, top, s, s);
  }
}

// Black-gold Host tissue: pulsing thorned growth. `pulse` (0/1) shifts the
// glint so the altar feels alive without being neon.
export function drawHostGrowth(ctx, cx, cy, seed, pulse = 0) {
  const rng = rngFrom(hash2D(seed + 41, seed * 11 + 9));
  // Dark base mass (wider, wetter).
  for (let i = 0; i < 16; i += 1) {
    const dx = Math.floor((rng() - 0.5) * 18);
    const dy = Math.floor((rng() - 0.5) * 12);
    px(ctx, cx + dx, cy + dy, PALETTE.hostBlack, 2, 2);
  }
  // Red wet undertone.
  for (let i = 0; i < 10; i += 1) {
    const dx = Math.floor((rng() - 0.5) * 14);
    const dy = Math.floor((rng() - 0.5) * 9);
    px(ctx, cx + dx, cy + dy, PALETTE.hostRed, 2, 2);
  }
  // Black-gold veins.
  for (let i = 0; i < 6; i += 1) {
    const dx = Math.floor((rng() - 0.5) * 14);
    const dy = Math.floor((rng() - 0.5) * 8);
    px(ctx, cx + dx, cy + dy, PALETTE.hostGold, 1, 2);
  }
  // Bone thorns reaching up.
  for (let i = 0; i < 5; i += 1) {
    const bx = cx + Math.floor((rng() - 0.5) * 16);
    const len = 4 + Math.floor(rng() * 5);
    for (let s = 0; s < len; s += 1) {
      px(ctx, bx, cy - s, PALETTE.hostBone);
    }
    px(ctx, bx, cy - len, PALETTE.hostBone, 1, 1);
  }
  // Gold/red glints (the "pulse").
  const glints = pulse ? 6 : 3;
  for (let i = 0; i < glints; i += 1) {
    const dx = Math.floor((rng() - 0.5) * 14);
    const dy = Math.floor((rng() - 0.5) * 9);
    px(ctx, cx + dx, cy + dy, pulse ? PALETTE.hostGlow : PALETTE.hostGold);
  }
  if (pulse) {
    px(ctx, cx, cy - 2, PALETTE.flash);
  }
}

// ---------------------------------------------------------------------------
// Floor & walls
// ---------------------------------------------------------------------------

// One ruined stone-flag floor cell at grid (gx, gy). We avoid a chessboard by
// (1) keeping per-tile tone variation tiny and value-close, (2) letting
// neighbours share a tone through a coarse "wear zone" hash so light/dark reads
// as broad worn patches rather than alternating tiles, and (3) adding only
// partial, off-centre scuffs and grime instead of recolouring the whole diamond.
export function drawRuinedStoneFloorCell(ctx, cx, cy, gx, gy) {
  const seed = hash2D(gx, gy);
  const r = rngFrom(seed);
  // Coarse wear zone: cells in the same ~2x2 block share a base tone, so the
  // floor breaks into a few large stained areas instead of a fine checker.
  const zone = hash2D((gx >> 1) + 1, (gy >> 1) + 1);
  // Base tones are deliberately close in value (no bright full-tile dust).
  const base = zone % 6 === 0 ? PALETTE.stoneLight : PALETTE.stoneMid;
  drawIsoDiamond(ctx, cx, cy, TILE_WIDTH, TILE_HEIGHT, base);

  // A faint, off-centre pale scuff — a partial diamond, never the whole tile.
  if (r() < 0.5) {
    ctx.save();
    ctx.globalAlpha = 0.05 + r() * 0.05;
    drawIsoDiamond(
      ctx,
      cx + Math.floor((r() - 0.5) * 18),
      cy + Math.floor((r() - 0.5) * 8),
      26 + Math.floor(r() * 14),
      12 + Math.floor(r() * 7),
      PALETTE.stoneDust
    );
    ctx.restore();
  }
  // A faint darker stain of settled grime on a different subset of tiles.
  if (r() < 0.5) {
    ctx.save();
    ctx.globalAlpha = 0.1 + r() * 0.06;
    drawIsoDiamond(
      ctx,
      cx + Math.floor((r() - 0.5) * 16),
      cy + 2 + Math.floor((r() - 0.5) * 6),
      24 + Math.floor(r() * 16),
      11 + Math.floor(r() * 6),
      PALETTE.stoneDark
    );
    ctx.restore();
  }

  // Broken flag-joint: a faint dark line along ONE lower edge, so a stone-flag
  // grid is only implied, not stamped onto every tile as a hard outline.
  const d = diamond(cx, cy, TILE_WIDTH, TILE_HEIGHT);
  ctx.save();
  ctx.globalAlpha = 0.1;
  ctx.strokeStyle = PALETTE.stoneDark;
  ctx.lineWidth = 1;
  ctx.beginPath();
  if ((seed & 1) === 0) {
    ctx.moveTo(d.left[0] + 2, d.left[1]);
    ctx.lineTo(d.bottom[0], d.bottom[1] - 1);
  } else {
    ctx.moveTo(d.bottom[0], d.bottom[1] - 1);
    ctx.lineTo(d.right[0] - 2, d.right[1]);
  }
  ctx.stroke();
  ctx.restore();

  // Sparse grit; rare hairline cracks.
  drawNoisePixels(ctx, cx - 28, cy - 11, 56, 22, [PALETTE.stoneDark, PALETTE.stoneDust], 0.022, seed);
  if (seed % 7 === 0) drawCracks(ctx, cx + Math.floor((r() - 0.5) * 10), cy, seed, 2);
}

// Volumetric wall block occupying one tile, rising `heightPx`.
export function drawIsoWallBlock(ctx, cx, cy, heightPx, seed) {
  // Base contact shadow.
  drawShadowBlob(ctx, cx, cy + 2, TILE_WIDTH * 0.7, TILE_HEIGHT * 0.7);

  drawIsoPrism(ctx, cx, cy, TILE_WIDTH, TILE_HEIGHT, heightPx, {
    top: PALETTE.stoneLight,
    left: PALETTE.stoneMid,
    right: PALETTE.stoneDark,
    outline: PALETTE.outline
  });

  // Chipped edge pixels and cracks on the front faces.
  const rng = rngFrom(hash2D(seed + 3, seed * 5 + 7));
  for (let i = 0; i < 6; i += 1) {
    const fy = cy - Math.floor(rng() * heightPx);
    const fx = cx + Math.floor((rng() - 0.5) * TILE_WIDTH * 0.6);
    px(ctx, fx, fy, PALETTE.stoneDark);
    if (rng() < 0.4) px(ctx, fx, fy + 1, PALETTE.stoneDust);
  }
  // A little rubble heaped at the base sometimes.
  if ((seed & 3) === 0) {
    drawRubbleCluster(ctx, cx, cy + 4, seed, 4);
  }
}

// ---------------------------------------------------------------------------
// Props (each: shadow + volume + outline + detail)
// ---------------------------------------------------------------------------

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
    ctx.strokeStyle = i === 2 ? PALETTE.woodDark : PALETTE.woodMid;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - 29 + off, cy - 5 + Math.floor(off * 0.08));
    ctx.lineTo(cx + 3 + off, cy - 16 + Math.floor(off * 0.08));
    ctx.stroke();
  }

  // Back rail and posts. The missing right rail makes the ruin read fast.
  px(ctx, cx - 30, cy - 29, PALETTE.outline, 5, 35);
  px(ctx, cx - 28, cy - 30, PALETTE.woodDark, 3, 33);
  px(ctx, cx + 17, cy - 42, PALETTE.outline, 5, 35);
  px(ctx, cx + 19, cy - 43, PALETTE.woodDark, 3, 31);
  ctx.lineWidth = 5;
  ctx.strokeStyle = PALETTE.outline;
  ctx.beginPath();
  ctx.moveTo(cx - 28, cy - 29);
  ctx.lineTo(cx + 18, cy - 41);
  ctx.stroke();
  ctx.lineWidth = 3;
  ctx.strokeStyle = PALETTE.woodLight;
  ctx.beginPath();
  ctx.moveTo(cx - 27, cy - 30);
  ctx.lineTo(cx + 17, cy - 41);
  ctx.stroke();
  ctx.lineWidth = 3;
  ctx.strokeStyle = PALETTE.woodMid;
  ctx.beginPath();
  ctx.moveTo(cx - 26, cy - 20);
  ctx.lineTo(cx + 8, cy - 29);
  ctx.stroke();

  // Thin legs and splinters.
  for (const leg of [[-24, 5], [-4, 0], [22, -8]]) {
    px(ctx, cx + leg[0], cy + leg[1], PALETTE.outline, 4, 12);
    px(ctx, cx + leg[0] + 1, cy + leg[1], PALETTE.woodDark, 2, 10);
  }
  for (let i = 0; i < 9; i += 1) {
    px(ctx, cx + 18 + Math.floor(rng() * 18), cy - 6 + Math.floor((rng() - 0.5) * 13), PALETTE.woodDark);
  }
}

export function drawRustedReliquary(ctx, cx, cy, seed) {
  drawShadowBlob(ctx, cx, cy + 5, 43, 17);

  // Arched chapel chest: stepped lid, side face, front face.
  poly(ctx, PALETTE.outline, [
    [cx - 20, cy - 20],
    [cx - 13, cy - 31],
    [cx + 12, cy - 35],
    [cx + 22, cy - 25],
    [cx + 22, cy - 5],
    [cx + 4, cy + 7],
    [cx - 20, cy - 4]
  ]);
  poly(ctx, PALETTE.rustDark, [
    [cx + 4, cy - 15],
    [cx + 22, cy - 25],
    [cx + 22, cy - 6],
    [cx + 4, cy + 7]
  ]);
  poly(ctx, PALETTE.rustMid, [
    [cx - 20, cy - 20],
    [cx + 4, cy - 15],
    [cx + 4, cy + 7],
    [cx - 20, cy - 4]
  ]);
  poly(ctx, PALETTE.rustLight, [
    [cx - 16, cy - 25],
    [cx - 9, cy - 32],
    [cx + 10, cy - 35],
    [cx + 19, cy - 25],
    [cx + 4, cy - 15],
    [cx - 20, cy - 20]
  ]);

  px(ctx, cx - 15, cy - 18, PALETTE.hostGold, 33, 2);
  px(ctx, cx - 3, cy - 13, PALETTE.hostGold, 6, 8);
  px(ctx, cx - 1, cy - 10, PALETTE.outline, 2, 3);
  px(ctx, cx - 14, cy - 25, PALETTE.hostBone, 9, 1);
  px(ctx, cx - 11, cy - 28, PALETTE.hostBone, 2, 7);
  for (const dx of [-14, -7, 8, 15]) px(ctx, cx + dx, cy - 14, PALETTE.rustLight, 2, 2);
  drawNoisePixels(ctx, cx - 19, cy - 32, 40, 31, [PALETTE.rustDark, PALETTE.stoneDark], 0.045, seed);
}

export function drawFieldSatchel(ctx, cx, cy, seed) {
  drawShadowBlob(ctx, cx, cy + 3, 32, 12);
  poly(ctx, PALETTE.outline, [
    [cx - 15, cy - 7],
    [cx + 2, cy - 15],
    [cx + 16, cy - 7],
    [cx + 13, cy + 4],
    [cx - 6, cy + 9],
    [cx - 16, cy + 2]
  ]);
  poly(ctx, PALETTE.skinDark, [
    [cx - 13, cy - 6],
    [cx + 2, cy - 13],
    [cx + 14, cy - 6],
    [cx + 11, cy + 3],
    [cx - 6, cy + 7],
    [cx - 14, cy + 1]
  ]);
  poly(ctx, PALETTE.clothTan, [
    [cx - 10, cy - 9],
    [cx + 2, cy - 14],
    [cx + 11, cy - 9],
    [cx + 2, cy - 5]
  ]);
  ctx.strokeStyle = PALETTE.clothDark;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - 13, cy - 5);
  ctx.quadraticCurveTo(cx - 1, cy - 21, cx + 14, cy - 6);
  ctx.stroke();
  px(ctx, cx - 1, cy - 10, PALETTE.rustLight, 3, 3);
  px(ctx, cx - 8, cy - 7, PALETTE.stoneDust, 7, 1);
  px(ctx, cx + 6, cy - 3, PALETTE.clothDark, 5, 1);
}

export function drawBlueBall(ctx, cx, cy, seed) {
  drawShadowBlob(ctx, cx, cy + 2, 18, 7);
  px(ctx, cx - 5, cy - 8, PALETTE.outline, 11, 10);
  px(ctx, cx - 4, cy - 9, PALETTE.outline, 9, 12);
  px(ctx, cx - 4, cy - 8, PALETTE.clothBlueDark, 9, 10);
  px(ctx, cx - 3, cy - 9, PALETTE.clothBlue, 7, 2);
  px(ctx, cx - 4, cy - 5, PALETTE.clothBlue, 2, 4);
  px(ctx, cx + 3, cy - 4, PALETTE.void, 1, 4);
  px(ctx, cx - 1, cy - 8, PALETTE.hostBone, 2, 1);
  drawNoisePixels(ctx, cx - 7, cy - 9, 14, 12, [PALETTE.stoneDark, PALETTE.rustDark], 0.04, seed);
}

export function drawGroundItem(ctx, cx, cy, seed, opts = {}) {
  const drop = Math.max(0, Math.min(1, Number(opts.drop ?? 1)));
  const pickup = Math.max(0, Math.min(1, Number(opts.pickup ?? 0)));
  const rng = rngFrom(seed);
  const jitterX = Math.round((rng() - 0.5) * 6);
  const jitterY = Math.round((rng() - 0.5) * 3);
  const lift = Math.round((1 - drop) * 19) + Math.round(Math.sin(drop * Math.PI) * 3) + Math.round(pickup * 13);
  const ix = cx + jitterX;
  const iy = cy + jitterY - lift;
  const fade = Math.max(0, 1 - pickup * 0.85);

  ctx.save();
  ctx.globalAlpha *= fade;
  ctx.save();
  ctx.globalAlpha *= Math.max(0.18, drop) * Math.max(0.2, 1 - pickup);
  drawShadowBlob(ctx, cx + jitterX, cy + 3 + jitterY, 20, 8);
  ctx.restore();

  if ((opts.count ?? 1) > 1) drawGroundItemModel(ctx, opts.model, ix + 5, iy + 2, seed + 17, true);
  drawGroundItemModel(ctx, opts.model, ix, iy, seed, false);
  ctx.restore();
}

function drawGroundItemModel(ctx, model = 'token', cx, cy, seed, back = false) {
  switch (model) {
    case 'ball':
      drawGroundBall(ctx, cx, cy, back);
      break;
    case 'boots':
      drawGroundBoots(ctx, cx, cy, back);
      break;
    case 'coat':
      drawGroundCoat(ctx, cx, cy, back);
      break;
    case 'hood':
      drawGroundHood(ctx, cx, cy, back);
      break;
    case 'vest':
      drawGroundVest(ctx, cx, cy, back);
      break;
    case 'ring':
      drawGroundRing(ctx, cx, cy, back);
      break;
    case 'necklace':
      drawGroundNecklace(ctx, cx, cy, back);
      break;
    case 'key':
      drawGroundKey(ctx, cx, cy, back);
      break;
    case 'paper':
      drawGroundPaper(ctx, cx, cy, seed, back);
      break;
    case 'vial':
      drawGroundVial(ctx, cx, cy, back);
      break;
    case 'dressing':
      drawGroundDressing(ctx, cx, cy, back);
      break;
    case 'food':
      drawGroundFood(ctx, cx, cy, back);
      break;
    case 'rounds':
      drawGroundRounds(ctx, cx, cy, back);
      break;
    case 'chit':
      drawGroundChit(ctx, cx, cy, back);
      break;
    case 'shard':
      drawGroundShard(ctx, cx, cy, back);
      break;
    case 'token':
    default:
      drawGroundToken(ctx, cx, cy, back);
      break;
  }
}

function drawGroundBall(ctx, cx, cy, back) {
  const blue = back ? PALETTE.clothBlueDark : PALETTE.clothBlue;
  px(ctx, cx - 4, cy - 8, PALETTE.outline, 9, 8);
  px(ctx, cx - 3, cy - 9, PALETTE.outline, 7, 10);
  px(ctx, cx - 3, cy - 8, blue, 7, 8);
  px(ctx, cx - 1, cy - 9, back ? PALETTE.clothBlue : PALETTE.hostBone, 3, 1);
  px(ctx, cx + 3, cy - 4, PALETTE.void, 1, 3);
}

function drawGroundRing(ctx, cx, cy, back) {
  const metal = back ? PALETTE.rustLight : PALETTE.hostGold;
  px(ctx, cx - 4, cy - 6, PALETTE.outline, 8, 6);
  px(ctx, cx - 3, cy - 5, metal, 6, 4);
  px(ctx, cx - 1, cy - 4, PALETTE.void, 3, 2);
  px(ctx, cx - 3, cy - 6, PALETTE.hostBone, 2, 1);
}

function drawGroundNecklace(ctx, cx, cy, back) {
  const metal = back ? PALETTE.rustLight : PALETTE.hostGold;
  linePx(ctx, cx - 8, cy - 6, cx - 1, cy - 1, PALETTE.outline, 1);
  linePx(ctx, cx + 7, cy - 6, cx, cy - 1, PALETTE.outline, 1);
  linePx(ctx, cx - 7, cy - 5, cx - 1, cy, PALETTE.clothDark, 1);
  linePx(ctx, cx + 6, cy - 5, cx, cy, PALETTE.clothDark, 1);
  px(ctx, cx - 3, cy - 2, PALETTE.outline, 6, 6);
  px(ctx, cx - 2, cy - 1, metal, 4, 4);
}

function drawGroundKey(ctx, cx, cy, back) {
  const metal = back ? PALETTE.stoneDust : PALETTE.hostGold;
  px(ctx, cx - 8, cy - 5, PALETTE.outline, 7, 6);
  px(ctx, cx - 7, cy - 4, metal, 5, 4);
  px(ctx, cx - 5, cy - 3, PALETTE.void, 2, 2);
  px(ctx, cx - 1, cy - 3, PALETTE.outline, 12, 3);
  px(ctx, cx, cy - 2, metal, 10, 1);
  px(ctx, cx + 8, cy - 5, PALETTE.outline, 2, 3);
  px(ctx, cx + 10, cy - 5, PALETTE.outline, 2, 5);
}

function drawGroundVial(ctx, cx, cy, back) {
  const liquid = back ? PALETTE.clothBlueDark : PALETTE.clothBlue;
  px(ctx, cx - 3, cy - 11, PALETTE.outline, 7, 13);
  px(ctx, cx - 2, cy - 10, PALETTE.hostBone, 5, 10);
  px(ctx, cx - 2, cy - 5, liquid, 5, 5);
  px(ctx, cx - 1, cy - 13, PALETTE.stoneDust, 3, 3);
  px(ctx, cx + 2, cy - 9, PALETTE.void, 1, 7);
}

function drawGroundPaper(ctx, cx, cy, seed, back) {
  const rng = rngFrom(seed + 3);
  for (let i = 0; i < 3; i += 1) {
    const x = cx - 8 + Math.floor(rng() * 13);
    const y = cy - 7 + Math.floor(rng() * 8);
    px(ctx, x - 1, y - 1, PALETTE.outline, 7, 5);
    px(ctx, x, y, back ? PALETTE.stoneDust : PALETTE.hostBone, 5, 3);
    px(ctx, x + 1, y + 1, PALETTE.stoneMid, 3, 1);
  }
}

function drawGroundDressing(ctx, cx, cy, back) {
  const cloth = back ? PALETTE.stoneDust : PALETTE.hostBone;
  px(ctx, cx - 9, cy - 7, PALETTE.outline, 18, 8);
  px(ctx, cx - 8, cy - 6, cloth, 16, 6);
  px(ctx, cx - 1, cy - 7, PALETTE.clothTan, 2, 8);
  px(ctx, cx - 8, cy - 3, PALETTE.clothTan, 16, 1);
}

function drawGroundFood(ctx, cx, cy, back) {
  const tin = back ? PALETTE.stoneMid : PALETTE.stoneLight;
  const label = back ? PALETTE.rustDark : PALETTE.clothTan;
  px(ctx, cx - 7, cy - 10, PALETTE.outline, 14, 12);
  px(ctx, cx - 6, cy - 9, tin, 12, 10);
  px(ctx, cx - 6, cy - 9, PALETTE.hostBone, 10, 1);
  px(ctx, cx - 6, cy - 5, label, 12, 4);
  px(ctx, cx - 3, cy - 4, PALETTE.rustDark, 6, 1);
  px(ctx, cx + 4, cy - 8, PALETTE.stoneDark, 1, 8);
}

function drawGroundRounds(ctx, cx, cy, back) {
  const brass = back ? PALETTE.rustLight : PALETTE.hostGold;
  for (let i = 0; i < 4; i += 1) {
    const x = cx - 8 + i * 5;
    px(ctx, x - 1, cy - 8 + (i % 2), PALETTE.outline, 4, 9);
    px(ctx, x, cy - 7 + (i % 2), brass, 2, 6);
    px(ctx, x, cy - 2 + (i % 2), PALETTE.rustDark, 2, 2);
  }
}

function drawGroundChit(ctx, cx, cy, back) {
  const brass = back ? PALETTE.rustLight : PALETTE.hostGold;
  px(ctx, cx - 7, cy - 8, PALETTE.outline, 14, 10);
  px(ctx, cx - 6, cy - 7, brass, 12, 8);
  px(ctx, cx - 3, cy - 5, PALETTE.rustDark, 6, 1);
  px(ctx, cx - 2, cy - 2, PALETTE.rustDark, 4, 1);
}

function drawGroundToken(ctx, cx, cy, back) {
  const metal = back ? PALETTE.rustLight : PALETTE.hostGold;
  px(ctx, cx - 5, cy - 8, PALETTE.outline, 11, 10);
  px(ctx, cx - 4, cy - 9, PALETTE.outline, 9, 12);
  px(ctx, cx - 4, cy - 8, metal, 9, 10);
  px(ctx, cx - 1, cy - 6, PALETTE.rustDark, 3, 5);
  px(ctx, cx - 2, cy - 4, PALETTE.rustDark, 5, 1);
}

function drawGroundShard(ctx, cx, cy, back) {
  const metal = back ? PALETTE.stoneLight : PALETTE.hostBone;
  poly(ctx, PALETTE.outline, [
    [cx - 8, cy],
    [cx - 2, cy - 13],
    [cx + 8, cy - 4],
    [cx + 3, cy + 2]
  ]);
  poly(ctx, metal, [
    [cx - 6, cy - 1],
    [cx - 2, cy - 11],
    [cx + 6, cy - 4],
    [cx + 2, cy + 1]
  ]);
  px(ctx, cx - 1, cy - 8, PALETTE.hostBone, 3, 1);
}

function drawGroundCoat(ctx, cx, cy, back) {
  const cloth = back ? PALETTE.clothDark : PALETTE.clothBlueDark;
  poly(ctx, PALETTE.outline, [
    [cx - 13, cy - 8],
    [cx + 1, cy - 14],
    [cx + 14, cy - 7],
    [cx + 9, cy + 3],
    [cx - 7, cy + 7],
    [cx - 15, cy + 1]
  ]);
  poly(ctx, cloth, [
    [cx - 11, cy - 7],
    [cx + 1, cy - 12],
    [cx + 12, cy - 6],
    [cx + 8, cy + 2],
    [cx - 7, cy + 5],
    [cx - 13, cy]
  ]);
  px(ctx, cx - 1, cy - 11, PALETTE.clothTan, 2, 14);
  px(ctx, cx - 10, cy - 5, PALETTE.void, 4, 2);
  px(ctx, cx + 6, cy - 3, PALETTE.void, 4, 2);
}

function drawGroundHood(ctx, cx, cy, back) {
  const cloth = back ? PALETTE.clothDark : PALETTE.clothBlueDark;
  px(ctx, cx - 8, cy - 11, PALETTE.outline, 17, 13);
  px(ctx, cx - 6, cy - 12, PALETTE.outline, 13, 15);
  px(ctx, cx - 6, cy - 10, cloth, 13, 11);
  px(ctx, cx - 3, cy - 8, PALETTE.void, 7, 4);
  px(ctx, cx - 2, cy - 11, PALETTE.clothTan, 5, 1);
}

function drawGroundVest(ctx, cx, cy, back) {
  const leather = back ? PALETTE.woodDark : PALETTE.rustDark;
  poly(ctx, PALETTE.outline, [
    [cx - 11, cy - 10],
    [cx + 1, cy - 13],
    [cx + 12, cy - 8],
    [cx + 8, cy + 3],
    [cx - 7, cy + 5],
    [cx - 12, cy - 1]
  ]);
  poly(ctx, leather, [
    [cx - 9, cy - 9],
    [cx + 1, cy - 11],
    [cx + 10, cy - 7],
    [cx + 7, cy + 2],
    [cx - 6, cy + 3],
    [cx - 10, cy - 1]
  ]);
  px(ctx, cx - 2, cy - 9, PALETTE.stoneDark, 4, 12);
  px(ctx, cx - 8, cy - 5, PALETTE.rustLight, 4, 1);
  px(ctx, cx + 4, cy - 4, PALETTE.rustLight, 4, 1);
}

function drawGroundBoots(ctx, cx, cy, back) {
  const leather = back ? PALETTE.woodDark : PALETTE.rustDark;
  px(ctx, cx - 10, cy - 8, PALETTE.outline, 8, 13);
  px(ctx, cx + 1, cy - 7, PALETTE.outline, 9, 12);
  px(ctx, cx - 9, cy - 7, leather, 6, 10);
  px(ctx, cx + 2, cy - 6, leather, 7, 9);
  px(ctx, cx - 11, cy + 2, PALETTE.outline, 10, 4);
  px(ctx, cx + 1, cy + 1, PALETTE.outline, 11, 4);
  px(ctx, cx - 10, cy + 2, PALETTE.rustLight, 7, 2);
  px(ctx, cx + 2, cy + 1, PALETTE.rustLight, 8, 2);
}

export function drawCorpseSilhouette(ctx, cx, cy, seed) {
  drawShadowBlob(ctx, cx, cy + 3, 46, 18);
  // Dried blood pooled under the body.
  ctx.save();
  ctx.globalAlpha = 0.7;
  drawIsoDiamond(ctx, cx + 5, cy + 3, 30, 14, PALETTE.rustDark);
  ctx.restore();
  drawNoisePixels(ctx, cx - 4, cy - 1, 28, 13, [PALETTE.hostRed, PALETTE.rustDark], 0.08, seed);

  // A slumped, clearly human body lying along the tile.
  for (let row = 0; row < 8; row += 1) {
    const w = 30 - Math.abs(row - 3) * 3;
    const tone = row < 3 ? PALETTE.clothTan : row < 6 ? PALETTE.clothDark : PALETTE.stoneDark;
    px(ctx, cx - Math.floor(w / 2) - 4, cy - 6 + row, tone, w, 1);
  }
  px(ctx, cx - 20, cy - 6, PALETTE.outline, 2, 8);
  // Head + dark hair at one end, boots at the other.
  px(ctx, cx + 11, cy - 5, PALETTE.skinDark, 6, 5);
  px(ctx, cx + 11, cy - 5, PALETTE.skinMid, 5, 3);
  px(ctx, cx + 11, cy - 6, PALETTE.clothDark, 6, 2);
  px(ctx, cx - 19, cy - 1, PALETTE.stoneDark, 7, 3);
  // A slack outflung arm and pale hand.
  px(ctx, cx, cy + 1, PALETTE.clothDark, 8, 2);
  px(ctx, cx + 8, cy + 2, PALETTE.skinMid, 2, 2);
}

export function drawQuarantineSign(ctx, cx, cy, seed) {
  drawShadowBlob(ctx, cx, cy + 3, 26, 11);
  // Leaning post.
  ctx.strokeStyle = PALETTE.stoneDark;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cx + 2, cy);
  ctx.lineTo(cx - 4, cy - 38);
  ctx.stroke();
  // Cracked board.
  drawIsoPrism(ctx, cx - 4, cy - 42, 30, 8, 18, {
    top: PALETTE.clothTan,
    left: PALETTE.stoneDust,
    right: PALETTE.rustDark,
    outline: PALETTE.outline
  });
  // Faded warning marks + a split down the middle.
  px(ctx, cx - 11, cy - 54, PALETTE.hostRed, 4, 8);
  px(ctx, cx - 2, cy - 56, PALETTE.stoneDark, 2, 15);
  px(ctx, cx + 6, cy - 52, PALETTE.rustMid, 5, 4);
}

export function drawCandleCluster(ctx, cx, cy, seed, flicker = 0) {
  drawShadowBlob(ctx, cx, cy + 2, 24, 10);

  // Pooled, run-down wax on the stone the cluster has been burning on.
  ctx.save();
  ctx.globalAlpha = 0.5;
  drawIsoDiamond(ctx, cx, cy + 1, 22, 10, PALETTE.hostBone);
  ctx.globalAlpha = 0.32;
  drawIsoDiamond(ctx, cx + 2, cy + 2, 13, 6, PALETTE.stoneDust);
  ctx.restore();

  // Three stubby, uneven candles drawn back-to-front. Heights/lit state are
  // seeded so each cluster is distinct but stable frame to frame.
  const candles = [
    { dx: -6, h: 8 + (seed % 4), lit: (seed & 1) === 0 },
    { dx: 1, h: 12 + (seed % 5), lit: true },
    { dx: 7, h: 7 + ((seed >> 2) % 3), lit: (seed & 4) === 0 }
  ];
  for (const cnd of candles) {
    const bx = cx + cnd.dx;
    const top = cy - cnd.h;
    // Tallow body: dark outline, bone wax, a lit left edge and a shaded right.
    px(ctx, bx - 2, top, PALETTE.skinDark, 5, cnd.h + 1); // base/outline column
    px(ctx, bx - 1, top, PALETTE.hostBone, 3, cnd.h); // wax body
    px(ctx, bx - 1, top, PALETTE.clothTan, 1, cnd.h); // lit left edge
    px(ctx, bx + 1, top, PALETTE.skinDark, 1, cnd.h); // shaded right edge
    // A frozen drip running down one side.
    if ((seed + cnd.dx) % 2 === 0) {
      px(ctx, bx + 1, top + Math.floor(cnd.h * 0.45), PALETTE.hostBone, 1, 4);
    }
    // Melted rim + a dark spent wick.
    px(ctx, bx - 2, top, PALETTE.stoneDust, 5, 1);
    px(ctx, bx, top - 2, PALETTE.stoneDark, 1, 2);
    // Flame: a small warm halo plus a two-pixel teardrop that brightens on the
    // flicker tick. Dead candles just show the blackened wick above.
    if (cnd.lit) {
      const fy = top - 4 - (flicker & 1);
      ctx.save();
      ctx.globalAlpha = 0.16 + (flicker ? 0.07 : 0);
      drawIsoDiamond(ctx, bx, top - 2, 16, 9, PALETTE.hostGold);
      ctx.restore();
      px(ctx, bx, fy + 2, PALETTE.ember, 1, 2);
      px(ctx, bx, fy, flicker ? PALETTE.flash : PALETTE.hostGold, 1, 2);
      if (flicker) px(ctx, bx, fy - 1, PALETTE.flash, 1, 1);
    }
  }
}

export function drawRubblePile(ctx, cx, cy, seed) {
  drawShadowBlob(ctx, cx, cy + 3, 40, 16);
  const rng = rngFrom(hash2D(seed + 51, seed * 8 + 4));
  // Stacked chunks for volume.
  for (let i = 0; i < 8; i += 1) {
    const dx = Math.floor((rng() - 0.5) * 26);
    const dy = Math.floor((rng() - 0.5) * 11);
    const w = 9 + Math.floor(rng() * 9);
    drawIsoPrism(ctx, cx + dx, cy + dy, w, w * 0.5, 5 + Math.floor(rng() * 7), {
      top: PALETTE.stoneLight,
      left: PALETTE.stoneMid,
      right: PALETTE.stoneDark,
      outline: PALETTE.outline
    });
  }
  drawNoisePixels(ctx, cx - 22, cy - 4, 44, 14, [PALETTE.stoneDust, PALETTE.stoneDark], 0.05, seed);
}

export function drawRustedCrate(ctx, cx, cy, seed) {
  drawShadowBlob(ctx, cx, cy + 6, 44, 18);
  const left = [
    [cx - 22, cy - 17],
    [cx - 1, cy - 27],
    [cx - 1, cy - 1],
    [cx - 22, cy + 8]
  ];
  const right = [
    [cx - 1, cy - 27],
    [cx + 22, cy - 15],
    [cx + 22, cy + 9],
    [cx - 1, cy - 1]
  ];
  const top = [
    [cx - 22, cy - 17],
    [cx - 1, cy - 29],
    [cx + 22, cy - 15],
    [cx - 1, cy - 4]
  ];
  poly(ctx, PALETTE.outline, [
    [cx - 24, cy - 17],
    [cx - 1, cy - 31],
    [cx + 24, cy - 16],
    [cx + 24, cy + 10],
    [cx - 2, cy + 12],
    [cx - 24, cy + 9]
  ]);
  poly(ctx, PALETTE.woodMid, left);
  poly(ctx, PALETTE.woodDark, right);
  poly(ctx, PALETTE.woodLight, top);

  // Separate boards and nail straps.
  for (const off of [-12, -4, 4, 12]) {
    ctx.strokeStyle = PALETTE.woodDark;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx + off - 13, cy - 18 + Math.floor(off * 0.1));
    ctx.lineTo(cx + off + 10, cy - 5 + Math.floor(off * 0.1));
    ctx.stroke();
  }
  ctx.strokeStyle = PALETTE.rustDark;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cx - 19, cy - 9);
  ctx.lineTo(cx - 1, cy - 18);
  ctx.lineTo(cx + 19, cy - 7);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx - 15, cy + 3);
  ctx.lineTo(cx - 1, cy - 7);
  ctx.lineTo(cx + 17, cy + 3);
  ctx.stroke();
  px(ctx, cx - 15, cy - 14, PALETTE.clothTan, 8, 4);
  px(ctx, cx - 14, cy - 14, PALETTE.stoneDust, 5, 1);
  for (const dx of [-17, -4, 9, 19]) px(ctx, cx + dx, cy - 8, PALETTE.rustLight, 1, 1);
  drawNoisePixels(ctx, cx - 21, cy - 26, 43, 34, [PALETTE.rustDark, PALETTE.stoneDark], 0.035, seed);
}

export function drawCanvasTent(ctx, cx, cy, seed) {
  const lean = (seed & 1) ? 2 : -2;
  drawShadowBlob(ctx, cx, cy + 8, 62, 24);
  poly(ctx, PALETTE.outline, [
    [cx - 31, cy - 2],
    [cx - 4 + lean, cy - 31],
    [cx + 30, cy - 1],
    [cx + 24, cy + 12],
    [cx - 26, cy + 12]
  ]);
  poly(ctx, PALETTE.clothTan, [
    [cx - 28, cy - 1],
    [cx - 4 + lean, cy - 29],
    [cx - 1 + lean, cy + 9],
    [cx - 26, cy + 10]
  ]);
  poly(ctx, PALETTE.stoneDust, [
    [cx - 4 + lean, cy - 29],
    [cx + 27, cy - 1],
    [cx + 22, cy + 10],
    [cx - 1 + lean, cy + 9]
  ]);
  poly(ctx, PALETTE.void, [
    [cx - 5 + lean, cy - 5],
    [cx + 6 + lean, cy + 8],
    [cx - 12 + lean, cy + 8]
  ]);
  linePx(ctx, cx - 4 + lean, cy - 29, cx - 2 + lean, cy + 11, PALETTE.woodMid, 2);
  linePx(ctx, cx - 25, cy + 7, cx - 34, cy + 13, PALETTE.rustDark);
  linePx(ctx, cx + 23, cy + 7, cx + 32, cy + 12, PALETTE.rustDark);
  px(ctx, cx - 14, cy - 14, PALETTE.hostBone, 9, 1);
  px(ctx, cx + 5, cy - 11, PALETTE.clothDark, 11, 1);
  drawNoisePixels(ctx, cx - 26, cy - 27, 52, 38, [PALETTE.stoneDark, PALETTE.rustDark], 0.028, seed);
}

export function drawCampBedroll(ctx, cx, cy, seed) {
  drawShadowBlob(ctx, cx, cy + 4, 38, 13);
  const flip = (seed & 1) ? -1 : 1;
  poly(ctx, PALETTE.outline, [
    [cx - 19 * flip, cy - 6],
    [cx - 1 * flip, cy - 14],
    [cx + 18 * flip, cy - 6],
    [cx + 12 * flip, cy + 5],
    [cx - 12 * flip, cy + 6]
  ]);
  poly(ctx, PALETTE.clothDark, [
    [cx - 17 * flip, cy - 5],
    [cx - 1 * flip, cy - 12],
    [cx + 16 * flip, cy - 5],
    [cx + 10 * flip, cy + 4],
    [cx - 11 * flip, cy + 5]
  ]);
  poly(ctx, PALETTE.stoneDust, [
    [cx - 13 * flip, cy - 7],
    [cx - 1 * flip, cy - 12],
    [cx + 12 * flip, cy - 7],
    [cx - 1 * flip, cy - 3]
  ]);
  px(ctx, cx - 14, cy, PALETTE.rustDark, 28, 2);
  px(ctx, cx - 8, cy - 8, PALETTE.clothTan, 15, 1);
  px(ctx, cx + 9 * flip, cy - 4, PALETTE.hostBone, 5, 1);
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
    ctx.strokeStyle = off === 8 ? PALETTE.woodDark : PALETTE.stoneDark;
    ctx.lineWidth = off === 8 ? 2 : 1;
    ctx.beginPath();
    ctx.moveTo(cx - 27 + off, cy - 12 + Math.floor(off * 0.06));
    ctx.lineTo(cx + 2 + off, cy - 25 + Math.floor(off * 0.06));
    ctx.stroke();
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
  px(ctx, cx - 14, cy - 18, PALETTE.void, 5, 1);
  px(ctx, cx + 6, cy - 16, PALETTE.stoneDark, 5, 1);
  px(ctx, cx - 1, cy - 17, PALETTE.hostBone, 2, 2);
  for (let i = 0; i < 12; i += 1) {
    const color = rng() < 0.4 ? PALETTE.stoneDark : PALETTE.woodDark;
    px(ctx, cx - 28 + Math.floor(rng() * 55), cy - 20 + Math.floor(rng() * 18), color);
  }
}

export function drawLowStool(ctx, cx, cy, seed) {
  const lean = (seed & 1) ? 2 : -2;
  drawShadowBlob(ctx, cx, cy + 4, 25, 10);
  const top = [
    [cx - 13 + lean, cy - 7],
    [cx - 2 + lean, cy - 13],
    [cx + 13 + lean, cy - 7],
    [cx + 2 + lean, cy]
  ];
  poly(ctx, PALETTE.outline, [
    [cx - 15 + lean, cy - 7],
    [cx - 2 + lean, cy - 15],
    [cx + 15 + lean, cy - 7],
    [cx + 2 + lean, cy + 2]
  ]);
  poly(ctx, PALETTE.woodMid, top);
  poly(ctx, PALETTE.woodDark, [
    [cx - 11 + lean, cy - 5],
    [cx + 2 + lean, cy],
    [cx + 13 + lean, cy - 7],
    [cx + 12 + lean, cy - 4],
    [cx + 2 + lean, cy + 4],
    [cx - 11 + lean, cy - 1]
  ]);
  px(ctx, cx - 7 + lean, cy - 10, PALETTE.woodLight, 10, 1);
  for (const leg of [[-9, -1], [0, 4], [9, -2]]) {
    px(ctx, cx + leg[0] + lean, cy + leg[1], PALETTE.outline, 3, 9);
    px(ctx, cx + leg[0] + 1 + lean, cy + leg[1], PALETTE.woodDark, 1, 8);
  }
  px(ctx, cx + 8 + lean, cy - 8, PALETTE.outline, 4, 2);
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

  drawIsoDiamond(ctx, cx + 16, cy - 15, 16, 8, PALETTE.outline);
  drawIsoDiamond(ctx, cx + 16, cy - 16, 13, 6, PALETTE.rustDark);
  px(ctx, cx + 10, cy - 18, PALETTE.stoneDark, 12, 1);
  linePx(ctx, cx + 10, cy - 21, cx + 4, cy - 18, PALETTE.rustDark);
  linePx(ctx, cx + 23, cy - 19, cx + 28, cy - 16, PALETTE.rustDark);

  for (let i = 0; i < 9; i += 1) {
    const x = cx - 24 + Math.floor(rng() * 48);
    const y = cy - 24 + Math.floor(rng() * 25);
    px(ctx, x, y, rng() < 0.5 ? PALETTE.stoneDark : PALETTE.rustDark);
  }
  drawNoisePixels(ctx, cx - 25, cy - 22, 50, 24, [PALETTE.stoneDark, PALETTE.rustDark], 0.06, seed);
}

export function drawPantryShelf(ctx, cx, cy, seed) {
  drawShadowBlob(ctx, cx, cy + 7, 43, 17);
  const lean = (seed & 1) ? 2 : -2;
  linePx(ctx, cx - 21 + lean, cy - 55, cx - 24 + lean, cy + 1, PALETTE.outline, 4);
  linePx(ctx, cx + 19 + lean, cy - 53, cx + 17 + lean, cy + 2, PALETTE.outline, 4);
  linePx(ctx, cx - 20 + lean, cy - 54, cx - 23 + lean, cy, PALETTE.woodDark, 2);
  linePx(ctx, cx + 20 + lean, cy - 52, cx + 18 + lean, cy + 1, PALETTE.woodDark, 2);

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
  drawNoisePixels(ctx, cx - 22, cy - 52, 43, 49, [PALETTE.woodDark, PALETTE.stoneDark], 0.045, seed);
}

export function drawWashTub(ctx, cx, cy, seed) {
  drawShadowBlob(ctx, cx, cy + 6, 43, 15);
  const shift = (seed & 1) ? 1 : -1;
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
  px(ctx, cx - 19 + shift, cy - 7, PALETTE.rustDark, 35, 2);
  px(ctx, cx - 11 + shift, cy - 20, PALETTE.clothTan, 11, 5);
  px(ctx, cx + 2 + shift, cy - 18, PALETTE.stoneDust, 9, 3);
  px(ctx, cx + 16 + shift, cy - 11, PALETTE.outline, 5, 2);
  drawNoisePixels(ctx, cx - 21, cy - 18, 42, 22, [PALETTE.woodDark, PALETTE.stoneDark], 0.055, seed);
}

// A long refectory dining table. Orientation-aware: the same plank top runs
// along either isometric diagonal and the tableware rotates with it. Pair it
// with drawDiningBench / drawLowStool on its long sides.
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

  // Knife scars and grime, kept sparse so it reads as use, not noise.
  for (let i = 0; i < 4; i += 1) {
    const p = frame.point(-ha + rng() * lenA, -hb + rng() * lenB, setTop);
    px(ctx, p[0], p[1], rng() < 0.5 ? PALETTE.woodDark : PALETTE.woodLight, rng() < 0.4 ? 2 : 1, 1);
  }
}

// A long backless dining bench. Sits on a table's long side; orientation-aware
// so it matches whichever diagonal the table runs along.
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

  // A worn seat scuff and a couple of grain lines along the plank.
  const a0 = frame.point(-ha + 0.1, 0, legH + slabT);
  const a1 = frame.point(ha - 0.1, 0, legH + slabT);
  linePx(ctx, a0[0], a0[1], a1[0], a1[1], PALETTE.woodDark, 1);
  for (let i = 0; i < 3; i += 1) {
    const p = frame.point(-ha + rng() * lenA, -hb + rng() * lenB, legH + slabT);
    px(ctx, p[0], p[1], PALETTE.woodLight, 1, 1);
  }
}

// A kitchen work counter: a stone base under a scarred wood worktop, with a
// little prep clutter. Orientation-aware so a run of counters can wrap a wall.
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
  px(ctx, base.cap.bottom[0] - 9, base.cap.bottom[1] + 6, PALETTE.stoneDust, 3, 1);

  // Wood worktop, slightly overhanging the base.
  const top = orientedBox(ctx, frame, lenA + 0.12, lenB + 0.12, topT, {
    top: PALETTE.woodMid,
    lit: PALETTE.woodMid,
    shade: PALETTE.woodDark,
    outline: PALETTE.outline
  }, baseH);
  linePx(ctx, top.cap.left[0], top.cap.left[1], top.cap.top[0], top.cap.top[1], PALETTE.woodLight, 1);

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

  drawNoisePixels(ctx, cx - 18, cy - workTop, 36, workTop + 6, [PALETTE.stoneDark, PALETTE.woodDark], 0.03, seed);
  if (rng() < 0.5) px(ctx, top.cap.top[0] - 4, top.cap.top[1] - 1, PALETTE.hostBone, 2, 1);
}

export function drawSealedStorageCrate(ctx, cx, cy, seed) {
  drawRustedCrate(ctx, cx, cy, seed);
  px(ctx, cx - 18, cy - 2, PALETTE.outline, 36, 4);
  px(ctx, cx - 17, cy - 1, PALETTE.stoneDark, 34, 2);
  px(ctx, cx - 5, cy - 14, PALETTE.outline, 11, 10);
  px(ctx, cx - 4, cy - 13, PALETTE.rustDark, 9, 8);
  px(ctx, cx - 1, cy - 12, PALETTE.rustLight, 3, 2);
  for (const dx of [-12, -4, 4, 12]) {
    px(ctx, cx + dx, cy - 18, PALETTE.hostBone, 2, 1);
  }
}

export function drawRustedBarrel(ctx, cx, cy, seed, opts = {}) {
  drawShadowBlob(ctx, cx, cy + 6, 34, 15);

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
  drawNoisePixels(ctx, cx - 16, cy - 25, 32, 28, [PALETTE.rustDark, PALETTE.stoneDark], 0.06, seed);

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
  }
}

export function drawStoneStairwell(ctx, cx, cy, seed) {
  const rng = rngFrom(hash2D(seed + 59, seed * 7 + 13));
  drawShadowBlob(ctx, cx, cy + 10, 72, 26);

  const topY = cy - 15;
  const ovalHalf = (rx, ry, dy) => Math.max(0, Math.round(rx * Math.sqrt(Math.max(0, 1 - (dy * dy) / (ry * ry)))));

  // Dropped stone skirt under the round stair-head. It gives the opening weight
  // without turning it back into a rectangular block.
  for (let dy = 3; dy <= 20; dy += 1) {
    const half = ovalHalf(35, 16, dy - 3);
    if (half < 4) continue;
    const y = topY + dy;
    px(ctx, cx - half - 2, y, PALETTE.outline, half * 2 + 4, 1);
    px(ctx, cx - half, y, PALETTE.stoneMid, half, 1);
    px(ctx, cx, y, PALETTE.stoneDark, half, 1);
    if (dy % 5 === 0) px(ctx, cx - half + 5, y, PALETTE.stoneDust, 4, 1);
  }

  // Stepped oval rim: a broken masonry ring around the stair void.
  for (let dy = -15; dy <= 15; dy += 1) {
    const half = ovalHalf(37, 15, dy);
    if (half < 4) continue;
    const y = topY + dy;
    const leftTone = dy < -6 ? PALETTE.stoneDust : dy < 4 ? PALETTE.stoneMid : PALETTE.stoneLight;
    const rightTone = dy < 0 ? PALETTE.stoneMid : PALETTE.stoneDark;
    px(ctx, cx - half - 2, y, PALETTE.outline, half * 2 + 4, 1);
    px(ctx, cx - half, y, leftTone, half, 1);
    px(ctx, cx, y, rightTone, half, 1);
  }
  for (let dy = -10; dy <= 12; dy += 1) {
    const half = ovalHalf(26, 11, dy);
    if (half < 3) continue;
    const y = topY + dy;
    px(ctx, cx - half - 2, y, PALETTE.outline, half * 2 + 4, 1);
    px(ctx, cx - half, y, PALETTE.void, half * 2, 1);
    if (dy < -5) px(ctx, cx - half, y, PALETTE.stoneDark, Math.max(4, Math.floor(half * 0.45)), 1);
  }

  // Curving treads, bright near the entry and fading into the stairwell.
  for (let i = 0; i < 8; i += 1) {
    const y = topY - 7 + i * 4;
    const w = 41 - i * 4;
    const lean = i < 4 ? i * 2 : 8 - i;
    const tone = i < 2 ? PALETTE.stoneDust : i < 5 ? PALETTE.stoneMid : PALETTE.stoneDark;
    linePx(ctx, cx - Math.floor(w / 2) + lean, y + 1, cx + Math.floor(w / 2) - lean, y - 3, PALETTE.outline, 2);
    linePx(ctx, cx - Math.floor(w / 2) + lean + 2, y, cx + Math.floor(w / 2) - lean - 2, y - 3, tone, 1);
  }
  linePx(ctx, cx + 9, topY - 8, cx - 5, topY + 12, PALETTE.outline, 2);
  linePx(ctx, cx + 8, topY - 9, cx - 6, topY + 11, PALETTE.rustMid, 1);

  const rail = (points, color, size = 1) => {
    for (let i = 1; i < points.length; i += 1) {
      linePx(ctx, points[i - 1][0], points[i - 1][1], points[i][0], points[i][1], color, size);
    }
  };
  const shifted = (points, y) => points.map((point) => [point[0], point[1] + y]);
  const post = (x, baseY, height, lit = false) => {
    px(ctx, x - 2, baseY - height, PALETTE.outline, 5, height + 3);
    px(ctx, x - 1, baseY - height + 1, PALETTE.rustDark, 3, height);
    px(ctx, x, baseY - height + 1, lit ? PALETTE.stoneLight : PALETTE.rustMid, 1, height - 2);
    px(ctx, x - 4, baseY + 1, PALETTE.outline, 9, 3);
    px(ctx, x - 3, baseY + 1, PALETTE.rustDark, 7, 1);
  };

  const backArc = [
    [cx - 34, topY - 25],
    [cx - 24, topY - 33],
    [cx - 8, topY - 37],
    [cx + 9, topY - 37],
    [cx + 25, topY - 33],
    [cx + 34, topY - 25]
  ];
  const leftArc = [
    [cx - 34, topY - 25],
    [cx - 38, topY - 14],
    [cx - 35, topY - 2],
    [cx - 25, topY + 6]
  ];
  const rightArc = [
    [cx + 34, topY - 25],
    [cx + 38, topY - 14],
    [cx + 35, topY - 2],
    [cx + 25, topY + 6]
  ];

  rail(shifted(backArc, 12), PALETTE.outline, 2);
  rail(shifted(backArc, 12), PALETTE.rustDark, 1);
  rail(shifted(leftArc, 11), PALETTE.outline, 2);
  rail(shifted(leftArc, 11), PALETTE.rustDark, 1);
  rail(shifted(rightArc, 11), PALETTE.outline, 2);
  rail(shifted(rightArc, 11), PALETTE.rustDark, 1);

  for (const spec of [
    [cx - 31, topY - 1, 31, true],
    [cx - 10, topY - 12, 27, true],
    [cx + 11, topY - 12, 27, false],
    [cx + 31, topY - 1, 31, false],
    [cx - 24, topY + 15, 42, true],
    [cx + 24, topY + 15, 42, false]
  ]) post(spec[0], spec[1], spec[2], spec[3]);

  rail(backArc, PALETTE.outline, 3);
  rail(backArc, PALETTE.rustDark, 2);
  rail(backArc.slice(0, 4), PALETTE.stoneLight, 1);
  rail(leftArc, PALETTE.outline, 3);
  rail(leftArc, PALETTE.rustDark, 2);
  rail(leftArc.slice(0, 3), PALETTE.stoneLight, 1);
  rail(rightArc, PALETTE.outline, 3);
  rail(rightArc, PALETTE.rustDark, 2);
  rail(rightArc, PALETTE.rustMid, 1);

  // Short entry rails sell the spiral route down through the gap.
  linePx(ctx, cx - 10, topY + 5, cx - 1, topY + 17, PALETTE.outline, 3);
  linePx(ctx, cx - 9, topY + 5, cx, topY + 16, PALETTE.rustMid, 1);
  linePx(ctx, cx + 11, topY + 5, cx + 2, topY + 17, PALETTE.outline, 3);
  linePx(ctx, cx + 10, topY + 5, cx + 1, topY + 16, PALETTE.rustDark, 1);

  drawNoisePixels(ctx, cx - 34, topY - 13, 68, 35, [PALETTE.stoneDark, PALETTE.stoneDust], 0.045, seed);
  for (let i = 0; i < 5; i += 1) {
    px(ctx, cx - 26 + Math.floor(rng() * 52), topY - 10 + Math.floor(rng() * 24), PALETTE.void, 1, 1);
  }
}

export function drawPaperScraps(ctx, cx, cy, seed) {
  ctx.save();
  ctx.globalAlpha = 0.9;
  drawIsoDiamond(ctx, cx - 4, cy, 24, 11, PALETTE.clothTan);
  drawIsoDiamond(ctx, cx + 7, cy + 2, 18, 8, PALETTE.stoneDust);
  ctx.restore();
  px(ctx, cx - 11, cy - 3, PALETTE.rustDark, 11, 1);
  px(ctx, cx - 8, cy, PALETTE.rustDark, 8, 1);
  px(ctx, cx + 3, cy + 1, PALETTE.stoneDark, 9, 1);
  drawNoisePixels(ctx, cx - 14, cy - 5, 28, 11, [PALETTE.stoneDust, PALETTE.rustDark], 0.04, seed);
}

export function drawCrackedColumn(ctx, cx, cy, seed) {
  drawShadowBlob(ctx, cx, cy + 5, 36, 15);
  drawIsoPrism(ctx, cx, cy, 34, 20, 9, {
    top: PALETTE.stoneLight,
    left: PALETTE.stoneMid,
    right: PALETTE.stoneDark,
    outline: PALETTE.outline
  });

  // Square shaft assembled from pixel bands to avoid a smooth cylinder.
  const shaftX = cx - 8;
  const shaftTop = cy - 58;
  px(ctx, shaftX, shaftTop, PALETTE.stoneDark, 17, 51);
  px(ctx, shaftX + 1, shaftTop, PALETTE.stoneMid, 14, 51);
  px(ctx, shaftX + 1, shaftTop, PALETTE.stoneDust, 3, 49);
  px(ctx, shaftX + 13, shaftTop + 2, PALETTE.stoneDark, 2, 47);
  drawNoisePixels(ctx, shaftX + 1, shaftTop + 2, 15, 47, [PALETTE.stoneDark, PALETTE.stoneDust], 0.035, seed);
  drawCracks(ctx, cx - 1, cy - 31, seed, 4);

  drawIsoPrism(ctx, cx, cy - 57, 28, 14, 8, {
    top: PALETTE.stoneDust,
    left: PALETTE.stoneMid,
    right: PALETTE.stoneDark,
    outline: PALETTE.outline
  });
  if ((seed & 1) === 0) {
    px(ctx, cx + 6, cy - 53, PALETTE.void, 7, 5);
    px(ctx, cx + 5, cy - 52, PALETTE.stoneDark, 5, 4);
  }
}

// A chapel saint carved in stone on a plinth, hands fused in prayer. The Choir
// struck its head off and daubed a wound-star on its breast: original chapel art,
// later defaced. `dim` gives the colder cellar stone.
export function drawSaintStatue(ctx, cx, cy, seed, opts = {}) {
  const dim = Boolean(opts.dim);
  const stone = PALETTE.stoneMid;
  const hi = dim ? PALETTE.stoneMid : PALETTE.stoneLight;
  const lo = PALETTE.stoneDark;
  const dust = PALETTE.stoneDust;
  const wet = PALETTE.hostRed;
  const rng = rngFrom(hash2D(seed + 11, seed * 3 + 5));

  drawShadowBlob(ctx, cx, cy + 4, 36, 16);
  // Plinth.
  drawIsoPrism(ctx, cx, cy, 30, 16, 12, { top: dust, left: stone, right: lo, outline: PALETTE.outline });
  const plinthTop = cy - 12;
  const shoulderY = plinthTop - 34; // top of the shoulders (the head is struck off above)

  // Robe: a figure tapering from broad shoulders to a wide hem, lit upper-left.
  for (let yy = 0; yy < plinthTop - shoulderY; yy += 1) {
    const t = yy / (plinthTop - shoulderY);
    const w = Math.round(15 + t * 5); // 15 at the shoulders -> 20 at the hem
    const ox = cx - Math.floor(w / 2);
    px(ctx, ox, shoulderY + yy, stone, w, 1);
    px(ctx, ox, shoulderY + yy, hi, 1, 1); // lit left edge
    px(ctx, ox + w - 1, shoulderY + yy, lo, 1, 1); // shaded right edge
  }
  // Robe folds, draped from the shoulders.
  px(ctx, cx - 4, shoulderY + 8, lo, 1, plinthTop - shoulderY - 9);
  px(ctx, cx + 3, shoulderY + 6, lo, 1, plinthTop - shoulderY - 7);
  px(ctx, cx - 1, shoulderY + 14, lo, 1, plinthTop - shoulderY - 16);
  // An empty hood/cowl where the head was: a dark hollow, broken at the rim.
  px(ctx, cx - 4, shoulderY - 6, stone, 9, 7); // cowl shell
  px(ctx, cx - 4, shoulderY - 6, hi, 1, 7);
  px(ctx, cx + 4, shoulderY - 6, lo, 1, 7);
  px(ctx, cx - 2, shoulderY - 5, PALETTE.void, 5, 6); // hollow interior (no head)
  px(ctx, cx - 3, shoulderY - 7, lo, 3, 2); // jagged struck rim
  px(ctx, cx + 1, shoulderY - 7, dust, 3, 1);
  for (let i = 0; i < 3; i += 1) px(ctx, cx - 8 + i * 7, shoulderY - 8 + Math.floor(rng() * 3), dust, 1, 1); // chips
  // Hands fused in prayer at the breast: a lit vertical bump with a centre seam.
  px(ctx, cx - 2, shoulderY + 6, dust, 4, 7);
  px(ctx, cx - 2, shoulderY + 6, hi, 1, 7);
  px(ctx, cx, shoulderY + 6, lo, 1, 7); // seam between the palms
  // Defacement: a point-down wound-star daubed on the breast in red.
  px(ctx, cx - 3, shoulderY + 15, wet, 7, 1);
  px(ctx, cx - 2, shoulderY + 16, wet, 5, 1);
  px(ctx, cx - 1, shoulderY + 17, wet, 3, 1);
  px(ctx, cx, shoulderY + 18, wet, 1, 1);
  px(ctx, cx - 3, shoulderY + 15, wet, 1, 4);
  px(ctx, cx + 3, shoulderY + 15, wet, 1, 4);
  // Asymmetry: a crack down the robe and a chipped plinth corner.
  px(ctx, cx + 5, plinthTop - 12, lo, 1, 11);
  px(ctx, cx + 12, cy - 3, PALETTE.void, 3, 2);
  drawNoisePixels(ctx, cx - 10, shoulderY, 20, plinthTop - shoulderY, [lo, stone], 0.04, seed);
}

// A chapel holy-water font: a stone basin on a pedestal, the water long gone to
// dried blood. A threshold artefact, cracked and chipped. `dim` for the cellar.
export function drawChapelFont(ctx, cx, cy, seed, opts = {}) {
  const dim = Boolean(opts.dim);
  const stone = PALETTE.stoneMid;
  const hi = dim ? PALETTE.stoneMid : PALETTE.stoneLight;
  const lo = PALETTE.stoneDark;
  const dust = PALETTE.stoneDust;

  drawShadowBlob(ctx, cx, cy + 3, 28, 13);
  // Pedestal.
  drawIsoPrism(ctx, cx, cy, 14, 8, 15, { top: stone, left: lo, right: PALETTE.void, outline: PALETTE.outline });
  const by = cy - 15; // basin rim height
  // Basin.
  drawIsoDiamond(ctx, cx, by + 1, 28, 14, PALETTE.outline);
  drawIsoDiamond(ctx, cx, by, 27, 13, lo);
  drawIsoDiamond(ctx, cx, by - 1, 27, 13, stone);
  drawIsoDiamond(ctx, cx - 1, by - 2, 24, 11, hi); // lit upper-left rim
  drawIsoDiamond(ctx, cx, by - 1, 18, 9, lo); // inner basin
  drawIsoDiamond(ctx, cx, by - 1, 13, 6, PALETTE.rustDark); // dried blood, not holy water
  drawIsoDiamond(ctx, cx, by - 1, 7, 3, PALETTE.hostRed);
  // Chipped rim and a crack down the pedestal.
  px(ctx, cx + 11, by, PALETTE.void, 3, 2);
  px(ctx, cx - 2, cy - 13, lo, 1, 11);
  drawNoisePixels(ctx, cx - 13, by - 5, 27, 16, [lo, dust], 0.04, seed);
}

export function drawQuarantineBarricade(ctx, cx, cy, seed) {
  drawShadowBlob(ctx, cx, cy + 5, 52, 18);
  const rng = rngFrom(hash2D(seed + 67, seed * 5 + 11));
  for (let i = 0; i < 3; i += 1) {
    const dy = i * 5;
    drawIsoPrism(ctx, cx, cy - 5 + dy, 50, 9, 7, {
      top: i === 1 ? PALETTE.rustMid : PALETTE.woodLight,
      left: PALETTE.woodMid,
      right: PALETTE.woodDark,
      outline: PALETTE.outline
    });
  }
  px(ctx, cx - 20, cy - 25, PALETTE.stoneDark, 4, 26);
  px(ctx, cx + 17, cy - 24, PALETTE.stoneDark, 4, 25);
  for (let i = 0; i < 5; i += 1) {
    const sx = cx - 18 + i * 9;
    const mark = rng() < 0.5 ? PALETTE.clothTan : PALETTE.hostRed;
    px(ctx, sx, cy - 17, mark, 5, 2);
  }
}

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

export function drawCampfire(ctx, cx, cy, seed, flicker = 0) {
  drawWarmLightPool(ctx, cx, cy, seed, flicker);
  drawShadowBlob(ctx, cx, cy + 4, 42, 16);
  const rng = rngFrom(hash2D(seed + 73, seed * 3 + 19));
  for (let i = 0; i < 5; i += 1) {
    const dx = -14 + i * 7 + Math.floor((rng() - 0.5) * 3);
    drawIsoPrism(ctx, cx + dx, cy + 3, 16, 6, 5, {
      top: PALETTE.woodLight,
      left: PALETTE.woodMid,
      right: PALETTE.woodDark,
      outline: PALETTE.outline
    });
  }
  const flame = flicker ? PALETTE.flash : PALETTE.ember;
  px(ctx, cx - 3, cy - 10, PALETTE.rustDark, 9, 13);
  px(ctx, cx - 2, cy - 13, flame, 5, 12);
  px(ctx, cx, cy - 16, PALETTE.hostGold, 3, 7);
  if (flicker) px(ctx, cx + 3, cy - 17, PALETTE.flash, 2, 3);
  drawNoisePixels(ctx, cx - 22, cy - 8, 44, 16, [PALETTE.stoneDark, PALETTE.rustDark], 0.08, seed);
}

export function drawChapelBanner(ctx, cx, cy, seed) {
  drawShadowBlob(ctx, cx, cy + 5, 28, 12);
  px(ctx, cx - 2, cy - 62, PALETTE.stoneDark, 4, 62);
  px(ctx, cx - 1, cy - 62, PALETTE.stoneDust, 1, 58);
  const phase = seed & 1;
  px(ctx, cx + 2, cy - 58, PALETTE.clothDark, 21, 43);
  px(ctx, cx + 3, cy - 58, PALETTE.clothRed, 17, 36);
  drawDitherRect(ctx, cx + 5, cy - 52, 12, 26, PALETTE.hostRed, null, phase);
  // An inverted cross stitched in bone-thread: upright with a low crossbar.
  px(ctx, cx + 10, cy - 53, PALETTE.hostBone, 2, 24);
  px(ctx, cx + 6, cy - 37, PALETTE.hostBone, 10, 2);
  px(ctx, cx + 3, cy - 22, PALETTE.void, 7, 7);
  px(ctx, cx + 13, cy - 18, PALETTE.void, 6, 5);
  drawNoisePixels(ctx, cx + 4, cy - 56, 17, 34, [PALETTE.rustDark, PALETTE.clothDark], 0.04, seed);
}

export function drawBrokenBell(ctx, cx, cy, seed) {
  const rng = rngFrom(hash2D(seed + 23, seed * 5 + 3));
  drawShadowBlob(ctx, cx, cy + 8, 72, 25);

  // Heavy keeper frame. The upper beam makes the bell read as hanging in a
  // tower room, while the skewed brace sells cult sabotage rather than age.
  px(ctx, cx - 31, cy - 66, PALETTE.outline, 9, 70);
  px(ctx, cx + 22, cy - 66, PALETTE.outline, 9, 70);
  px(ctx, cx - 29, cy - 65, PALETTE.woodDark, 5, 67);
  px(ctx, cx + 24, cy - 65, PALETTE.woodDark, 5, 67);
  px(ctx, cx - 28, cy - 64, PALETTE.woodMid, 2, 64);
  px(ctx, cx + 25, cy - 64, PALETTE.woodMid, 2, 64);
  px(ctx, cx - 35, cy - 72, PALETTE.outline, 71, 9);
  px(ctx, cx - 33, cy - 70, PALETTE.woodDark, 67, 5);
  px(ctx, cx - 31, cy - 70, PALETTE.woodLight, 28, 1);
  linePx(ctx, cx - 28, cy - 60, cx + 24, cy - 15, PALETTE.outline, 4);
  linePx(ctx, cx - 27, cy - 60, cx + 22, cy - 16, PALETTE.woodDark, 2);

  // Crown and hanger, with the cut pin socket called out in brass.
  px(ctx, cx - 9, cy - 66, PALETTE.outline, 19, 10);
  px(ctx, cx - 7, cy - 65, PALETTE.rustDark, 15, 7);
  px(ctx, cx - 5, cy - 64, PALETTE.rustLight, 6, 2);
  px(ctx, cx + 6, cy - 62, PALETTE.hostGold, 4, 3);
  px(ctx, cx + 9, cy - 61, PALETTE.void, 5, 2);

  // Bell body: stepped rows, wider at the mouth, lit on the upper-left.
  for (let row = 0; row < 36; row += 1) {
    const t = row / 35;
    const half = Math.round(12 + t * 19 + (row > 27 ? 3 : 0));
    const y = cy - 55 + row;
    px(ctx, cx - half - 1, y, PALETTE.outline, half * 2 + 2, 1);
    px(ctx, cx - half, y, row < 5 ? PALETTE.rustLight : PALETTE.rustMid, half, 1);
    px(ctx, cx, y, row < 6 ? PALETTE.rustMid : PALETTE.rustDark, half, 1);
    if (row % 7 === 1) px(ctx, cx - half + 4, y, PALETTE.rustLight, 4, 1);
  }
  px(ctx, cx - 32, cy - 18, PALETTE.outline, 65, 6);
  px(ctx, cx - 29, cy - 17, PALETTE.rustLight, 24, 2);
  px(ctx, cx - 3, cy - 17, PALETTE.rustDark, 31, 2);
  px(ctx, cx - 13, cy - 16, PALETTE.void, 27, 3);

  // Jagged crack, missing clapper, and wooden wedge jammed under the crown.
  linePx(ctx, cx + 5, cy - 49, cx - 1, cy - 39, PALETTE.void, 2);
  linePx(ctx, cx - 1, cy - 39, cx + 8, cy - 31, PALETTE.void, 2);
  linePx(ctx, cx + 8, cy - 31, cx + 2, cy - 22, PALETTE.void, 2);
  px(ctx, cx + 1, cy - 40, PALETTE.hostGold, 2, 1);
  px(ctx, cx - 11, cy - 60, PALETTE.woodDark, 22, 5);
  px(ctx, cx - 9, cy - 59, PALETTE.woodMid, 17, 2);
  px(ctx, cx - 4, cy - 24, PALETTE.outline, 9, 5);
  px(ctx, cx - 2, cy - 23, PALETTE.rustDark, 5, 3);

  for (let i = 0; i < 11; i += 1) {
    px(ctx, cx - 28 + Math.floor(rng() * 56), cy - 52 + Math.floor(rng() * 36), rng() < 0.5 ? PALETTE.rustDark : PALETTE.stoneDark, 1, 1);
  }
  drawNoisePixels(ctx, cx - 30, cy - 56, 60, 39, [PALETTE.rustDark, PALETTE.stoneDark], 0.045, seed);
}

export function drawBellRope(ctx, cx, cy, seed, opts = {}) {
  const repaired = Boolean(opts.repaired);
  const sway = repaired ? 0 : ((seed & 1) ? 1 : -1);
  drawShadowBlob(ctx, cx, cy + 4, repaired ? 18 : 23, 8);

  // Pulley bracket and grooved wheel.
  px(ctx, cx - 15, cy - 91, PALETTE.outline, 31, 7);
  px(ctx, cx - 12, cy - 90, PALETTE.stoneDark, 25, 4);
  px(ctx, cx - 6, cy - 95, PALETTE.outline, 13, 12);
  px(ctx, cx - 4, cy - 93, PALETTE.rustDark, 9, 8);
  px(ctx, cx - 2, cy - 91, PALETTE.rustLight, 5, 2);
  px(ctx, cx, cy - 90, PALETTE.void, 2, 2);

  const ropeX = cx + sway;
  const ropeTop = cy - 84;
  const ropeBot = cy - 14;
  px(ctx, ropeX - 2, ropeTop, PALETTE.woodDark, 5, ropeBot - ropeTop);
  px(ctx, ropeX - 1, ropeTop + 1, PALETTE.clothTan, 1, ropeBot - ropeTop - 5);
  for (let y = ropeTop + 5, i = 0; y < ropeBot - 2; y += 8, i += 1) {
    px(ctx, ropeX - 3, y, PALETTE.woodMid, 2, 3);
    px(ctx, ropeX + 2 + (i % 2), y + 3, PALETTE.woodMid, 2, 3);
  }

  if (repaired) {
    px(ctx, ropeX - 5, cy - 19, PALETTE.outline, 11, 8);
    px(ctx, ropeX - 4, cy - 18, PALETTE.woodDark, 9, 5);
    px(ctx, ropeX - 2, cy - 17, PALETTE.clothTan, 4, 3);
    px(ctx, ropeX - 7, cy - 9, PALETTE.outline, 15, 5);
    px(ctx, ropeX - 5, cy - 8, PALETTE.clothTan, 10, 2);
    px(ctx, ropeX + 3, cy - 83, PALETTE.hostGold, 4, 3);
  } else {
    px(ctx, ropeX - 7, cy - 20, PALETTE.outline, 13, 7);
    px(ctx, ropeX - 5, cy - 19, PALETTE.woodDark, 9, 4);
    for (const fray of [-6, -2, 3, 6]) {
      linePx(ctx, ropeX + fray, cy - 14, ropeX + fray + Math.sign(fray || 1) * 4, cy - 7, PALETTE.clothTan, 1);
      px(ctx, ropeX + fray, cy - 14, PALETTE.woodDark, 1, 5);
    }
    px(ctx, ropeX - 10, cy - 87, PALETTE.woodDark, 21, 4);
    px(ctx, ropeX - 8, cy - 86, PALETTE.woodMid, 15, 1);
  }
  drawNoisePixels(ctx, cx - 14, cy - 21, 28, 19, [PALETTE.stoneDark, PALETTE.woodDark], 0.05, seed);
}

export function drawPrayerLectern(ctx, cx, cy, seed) {
  drawShadowBlob(ctx, cx, cy + 5, 34, 14);
  drawIsoPrism(ctx, cx, cy, 32, 18, 12, {
    top: PALETTE.woodLight,
    left: PALETTE.woodMid,
    right: PALETTE.woodDark,
    outline: PALETTE.outline
  });
  px(ctx, cx - 3, cy - 39, PALETTE.woodDark, 7, 33);
  px(ctx, cx - 2, cy - 39, PALETTE.woodMid, 4, 30);
  drawIsoPrism(ctx, cx, cy - 42, 38, 18, 8, {
    top: PALETTE.clothTan,
    left: PALETTE.stoneDust,
    right: PALETTE.rustDark,
    outline: PALETTE.outline
  });
  px(ctx, cx - 10, cy - 52, PALETTE.rustDark, 20, 1);
  px(ctx, cx - 7, cy - 49, PALETTE.stoneDark, 14, 1);
  if ((seed & 1) === 0) px(ctx, cx + 9, cy - 48, PALETTE.hostRed, 4, 2);
}

export function drawRitualBowl(ctx, cx, cy, seed) {
  drawShadowBlob(ctx, cx, cy + 3, 26, 10);
  drawIsoPrism(ctx, cx, cy, 25, 13, 6, {
    top: PALETTE.rustLight,
    left: PALETTE.rustMid,
    right: PALETTE.rustDark,
    outline: PALETTE.outline
  });
  drawIsoDiamond(ctx, cx, cy - 7, 17, 8, PALETTE.void);
  px(ctx, cx - 5, cy - 10, PALETTE.hostBone, 4, 1);
  px(ctx, cx + 1, cy - 9, PALETTE.hostBone, 5, 1);
  px(ctx, cx - 1, cy - 8, PALETTE.hostGold, 2, 2);
  drawNoisePixels(ctx, cx - 11, cy - 10, 22, 12, [PALETTE.rustDark, PALETTE.hostRed], 0.04, seed);
}

// The corrupted altar: cracked stone slab split open by Host tissue beneath.
export function drawDamagedAltar(ctx, cx, cy, seed, pulse = 0) {
  drawShadowBlob(ctx, cx, cy + 7, 78, 28);
  // Stone base block.
  drawIsoPrism(ctx, cx, cy, 64, 32, 36, {
    top: PALETTE.stoneLight,
    left: PALETTE.stoneMid,
    right: PALETTE.stoneDark,
    outline: PALETTE.outline
  });
  // Top slab overhang.
  drawIsoPrism(ctx, cx, cy - 36, 72, 34, 9, {
    top: PALETTE.stoneDust,
    left: PALETTE.stoneMid,
    right: PALETTE.stoneDark,
    outline: PALETTE.outline
  });
  // Cracks across the front face + a missing corner.
  drawCracks(ctx, cx - 10, cy - 14, seed, 4);
  ctx.save();
  ctx.globalAlpha = 0.7;
  drawIsoDiamond(ctx, cx + 24, cy - 32, 18, 11, PALETTE.stoneDark);
  ctx.restore();
  // Torn chapel cloth draped over the slab.
  px(ctx, cx - 22, cy - 44, PALETTE.clothRed, 16, 5);
  px(ctx, cx - 18, cy - 40, PALETTE.clothDark, 10, 3);
  // Host tissue splitting it from below.
  drawHostGrowth(ctx, cx, cy + 4, seed + 7, pulse);
  drawHostGrowth(ctx, cx - 18, cy - 4, seed + 19, pulse);
  drawHostGrowth(ctx, cx + 16, cy - 2, seed + 31, pulse);
}

// ---------------------------------------------------------------------------
// Secret / lore props
// ---------------------------------------------------------------------------

// A pried-up floor flag tilted off a dark cavity — a hidden cache.
export function drawLooseFlagstone(ctx, cx, cy, seed) {
  drawShadowBlob(ctx, cx, cy + 3, 34, 14);
  // The cavity under the lifted stone.
  drawIsoDiamond(ctx, cx + 4, cy + 2, 30, 15, PALETTE.void);
  drawIsoDiamond(ctx, cx + 5, cy + 3, 22, 10, PALETTE.hostBlack);
  // The slab, tilted up on its inner edge.
  poly(ctx, PALETTE.outline, [[cx - 20, cy - 2], [cx - 2, cy - 12], [cx + 16, cy - 6], [cx - 2, cy + 4]]);
  poly(ctx, PALETTE.stoneMid, [[cx - 18, cy - 2], [cx - 3, cy - 10], [cx + 13, cy - 5], [cx - 3, cy + 3]]);
  poly(ctx, PALETTE.stoneLight, [[cx - 18, cy - 2], [cx - 3, cy - 10], [cx - 1, cy - 9], [cx - 16, cy - 1]]);
  px(ctx, cx - 2, cy - 11, PALETTE.stoneDust, 3, 1);
  // A pale gleam from whatever waits in the dark.
  px(ctx, cx + 8, cy + 2, PALETTE.hostGold, 2, 1);
  px(ctx, cx + 6, cy + 4, PALETTE.hostBone, 1, 1);
  drawNoisePixels(ctx, cx - 18, cy - 10, 34, 18, [PALETTE.stoneDark, PALETTE.stoneDust], 0.05, seed);
}

// A low ossuary heap: stacked saint-bone, the kind chapels kept in their
// cellars long before the Host gave bone a new meaning.
function boneStroke(ctx, x0, y0, x1, y1, color, size = 1) {
  const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    px(ctx, Math.round(x0 + (x1 - x0) * t), Math.round(y0 + (y1 - y0) * t), color, size, size);
  }
}

function drawOssuaryLongBone(ctx, x0, y0, x1, y1, compact = false) {
  const bone = PALETTE.hostBone;
  const hi = PALETTE.stoneDust;
  const knob = compact ? 3 : 5;
  const body = compact ? 1 : 2;

  boneStroke(ctx, x0, y0 + 1, x1, y1 + 1, PALETTE.outline, body + 1);
  boneStroke(ctx, x0, y0, x1, y1, bone, body);
  boneStroke(
    ctx,
    Math.round(x0 + (x1 - x0) * 0.22),
    Math.round(y0 + (y1 - y0) * 0.22),
    Math.round(x0 + (x1 - x0) * 0.56),
    Math.round(y0 + (y1 - y0) * 0.56),
    hi,
    1
  );

  const cap = (x, y) => {
    px(ctx, x - Math.floor(knob / 2), y - 1, PALETTE.outline, knob, compact ? 3 : 4);
    px(ctx, x - 1, y - 1, bone, 3, compact ? 3 : 4);
    px(ctx, x - Math.floor(knob / 2), y, bone, knob, 2);
    px(ctx, x - 1, y - 1, hi, 2, 1);
  };
  cap(Math.round(x0), Math.round(y0));
  cap(Math.round(x1), Math.round(y1));
}

function drawOssuarySkull(ctx, sx, sy, compact = false, flip = 1) {
  const bone = PALETTE.hostBone;
  const hi = PALETTE.stoneDust;
  const dark = PALETTE.void;
  if (compact) {
    px(ctx, sx - 3, sy - 4, PALETTE.outline, 7, 8);
    px(ctx, sx - 2, sy - 5, PALETTE.outline, 5, 1);
    px(ctx, sx - 2, sy - 4, bone, 5, 6);
    px(ctx, sx - 3, sy - 2, bone, 7, 3);
    px(ctx, sx - 2, sy - 4, hi, 2, 1);
    px(ctx, sx - 1, sy - 2, dark, 1, 2);
    px(ctx, sx + 2, sy - 2, dark, 1, 2);
    px(ctx, sx, sy + 1, dark, 1, 2);
    px(ctx, sx - flip, sy + 3, PALETTE.outline, 4, 1);
    px(ctx, sx - flip, sy + 4, bone, 3, 1);
    return;
  }

  px(ctx, sx - 5, sy - 6, PALETTE.outline, 11, 10);
  px(ctx, sx - 3, sy - 8, PALETTE.outline, 7, 3);
  px(ctx, sx - 4, sy - 6, bone, 9, 8);
  px(ctx, sx - 2, sy - 8, bone, 5, 3);
  px(ctx, sx - 3, sy - 7, hi, 4, 1);
  px(ctx, sx - 3, sy - 3, dark, 2, 3);
  px(ctx, sx + 2, sy - 3, dark, 2, 3);
  px(ctx, sx - 1, sy, PALETTE.stoneDark, 3, 2);
  px(ctx, sx - 3, sy + 3, PALETTE.outline, 7, 3);
  px(ctx, sx - 2, sy + 3, bone, 5, 2);
  px(ctx, sx - 1, sy + 4, dark, 1, 1);
  px(ctx, sx + 2, sy + 4, dark, 1, 1);
}

export function drawBonePile(ctx, cx, cy, seed) {
  drawShadowBlob(ctx, cx, cy + 3, 38, 15);
  const rng = rngFrom(hash2D(seed + 61, seed * 9 + 7));
  for (let i = 0; i < 7; i += 1) {
    const x0 = cx + Math.floor((rng() - 0.5) * 28);
    const y0 = cy + Math.floor((rng() - 0.5) * 9);
    const len = 8 + Math.floor(rng() * 12);
    const lean = Math.floor(rng() * 5) - 2;
    drawOssuaryLongBone(ctx, x0, y0, x0 + len, y0 + lean, true);
  }
  drawOssuarySkull(ctx, cx - 4, cy - 5, false, rng() < 0.5 ? -1 : 1);
  drawOssuarySkull(ctx, cx + 9, cy + 1, true, 1);
  for (let rib = 0; rib < 5; rib += 1) {
    const rx = cx - 14 + rib * 6 + Math.floor(rng() * 2);
    const ry = cy - 1 + Math.floor(rng() * 5);
    boneStroke(ctx, rx, ry - 4, rx + 2, ry + 2, PALETTE.hostBone, 1);
    px(ctx, rx + 2, ry + 2, PALETTE.outline, 2, 1);
  }
  drawNoisePixels(ctx, cx - 20, cy - 11, 40, 22, [PALETTE.stoneDust, PALETTE.rustDark], 0.03, seed);
}

// A single human skeleton fallen on the stone, years dead: a socketed skull, a
// curved ribcage, a spine, splayed limb-bones. Seed picks which side the head
// lolls to, so a row of them never repeats.
export function drawSkeleton(ctx, cx, cy, seed, opts = {}) {
  const bone = PALETTE.hostBone;
  const hi = PALETTE.stoneDust;
  const dark = PALETTE.void;
  const rng = rngFrom(hash2D(seed + 23, seed * 7 + 3));
  const flip = rng() < 0.5 ? 1 : -1; // head left or right
  drawShadowBlob(ctx, cx, cy + 3, 30, 13);

  const hx = cx + flip * 9; // skull at one end
  const hy = cy - 1;
  // Spine running from the skull toward the pelvis.
  for (let i = 0; i < 9; i += 1) {
    px(ctx, Math.round(hx - flip * (3 + i * 1.5)), hy + 1 + (i % 2), bone, 2, 1);
  }
  // Ribcage: a few curved ribs off the upper spine.
  for (let r = 0; r < 4; r += 1) {
    const rx = Math.round(hx - flip * (4 + r * 2));
    boneStroke(ctx, rx, hy - 4, rx - flip * 2, hy - 1, bone, 1);
    boneStroke(ctx, rx, hy + 4, rx - flip * 2, hy + 1, bone, 1);
    px(ctx, rx - (flip > 0 ? 1 : 0), hy - 4, hi, 2, 1);
  }
  // Pelvis at the far end.
  const pelX = Math.round(hx - flip * 17);
  px(ctx, pelX - 3, hy - 1, PALETTE.outline, 8, 5);
  px(ctx, pelX - 2, hy - 1, bone, 6, 4);
  px(ctx, pelX, hy, dark, 2, 2);
  // Splayed limb long-bones.
  drawOssuaryLongBone(ctx, Math.round(hx - flip * 8), hy + 5, Math.round(hx - flip * 1), hy + 9, true);
  drawOssuaryLongBone(ctx, Math.round(hx - flip * 12), hy + 5, Math.round(hx - flip * 20), hy + 8, true);
  drawOssuaryLongBone(ctx, pelX - flip * 1, hy + 3, pelX - flip * 10, hy + 11, true);
  drawOssuaryLongBone(ctx, pelX + flip * 2, hy + 2, pelX + flip * 8, hy + 8, true);
  drawOssuarySkull(ctx, hx, hy - 1, false, flip);
  drawNoisePixels(ctx, cx - 15, cy - 6, 30, 14, [PALETTE.stoneDust, PALETTE.rustDark], 0.03, seed);
}

// A stone wall niche packed with the dead: an arched recess, jambs and lintel,
// stacked rows of long-bones with skulls perched on them. The ossuary signature
// of a catacomb. Placed against a wall.
export function drawBoneNiche(ctx, cx, cy, seed, opts = {}) {
  const stone = PALETTE.stoneMid;
  const lo = PALETTE.stoneDark;
  const dust = PALETTE.stoneDust;
  const bone = PALETTE.hostBone;
  const dark = PALETTE.void;
  const rng = rngFrom(hash2D(seed + 41, seed * 5 + 9));
  const w = 28;
  const h = 32;
  const top = cy - h + 4;
  const x = Math.round(cx - w / 2);

  drawShadowBlob(ctx, cx, cy + 3, 30, 13);
  px(ctx, x - 2, top - 2, PALETTE.outline, w + 4, h + 4);
  px(ctx, x - 1, top - 1, lo, w + 2, h + 2);
  px(ctx, x + 2, top + 4, dark, w - 4, h - 7); // deep recess
  px(ctx, x - 2, top - 3, stone, w + 4, 4); // lintel
  px(ctx, x - 2, top - 3, dust, w + 4, 1);
  px(ctx, x - 2, top, stone, 3, h); // left jamb
  px(ctx, x + w - 1, top, stone, 3, h); // right jamb
  px(ctx, x + 1, top + h - 3, stone, w - 2, 3);
  px(ctx, x + 3, top + 2, PALETTE.outline, w - 6, 1);

  // Three uneven shelves of skulls, femurs, ribs and gaps.
  for (let row = 0; row < 3; row += 1) {
    const ry = top + 8 + row * 8;
    px(ctx, x + 3, ry + 4, PALETTE.outline, w - 6, 2);
    px(ctx, x + 4, ry + 3, stone, w - 8, 2);
    px(ctx, x + 5, ry - 4, dark, w - 10, 5);

    const leftLean = Math.floor(rng() * 3) - 1;
    const rightLean = Math.floor(rng() * 3) - 1;
    if (row === 0) {
      drawOssuarySkull(ctx, x + 8, ry - 1, true, -1);
      drawOssuaryLongBone(ctx, x + 13, ry + 1, x + w - 7, ry + leftLean, true);
      drawOssuaryLongBone(ctx, x + 11, ry + 3, x + w - 10, ry + 4 + rightLean, true);
    } else if (row === 1) {
      drawOssuaryLongBone(ctx, x + 5, ry + 2, x + w - 7, ry - 1 + leftLean, true);
      drawOssuaryLongBone(ctx, x + 7, ry - 2, x + w - 9, ry + 3 + rightLean, true);
      for (let rib = 0; rib < 5; rib += 1) {
        const rx = x + 7 + rib * 4 + Math.floor(rng() * 2);
        boneStroke(ctx, rx, ry - 5, rx + 1, ry + 2, bone, 1);
        px(ctx, rx + 1, ry + 1, PALETTE.outline, 2, 1);
      }
    } else {
      drawOssuaryLongBone(ctx, x + 5, ry + 1, x + w - 12, ry + 2 + leftLean, true);
      drawOssuaryLongBone(ctx, x + 6, ry + 3, x + w - 14, ry + rightLean, true);
      drawOssuarySkull(ctx, x + w - 9, ry, true, 1);
      for (let rib = 0; rib < 3; rib += 1) {
        const rx = x + 7 + rib * 4 + Math.floor(rng() * 2);
        boneStroke(ctx, rx, ry - 4, rx + 2, ry + 1, bone, 1);
      }
    }
  }
  // A few loose pale fragments catch the eye at the base.
  drawOssuaryLongBone(ctx, x + 5, cy - 1, x + 15, cy + 2, true);
  px(ctx, x + w - 7, cy - 2, bone, 4, 2);
  px(ctx, x + w - 8, cy - 3, PALETTE.outline, 6, 1);
  drawNoisePixels(ctx, x, top, w, h, [lo, PALETTE.stoneDark], 0.05, seed);
}

// A stone sarcophagus, its lid dragged askew off a black cavity. `opened` slides
// the lid further and shows the bones inside. A burial worth opening.
export function drawStoneTomb(ctx, cx, cy, seed, opts = {}) {
  const opened = Boolean(opts.opened);
  const stone = PALETTE.stoneMid;
  const hi = PALETTE.stoneLight;
  const lo = PALETTE.stoneDark;
  const dust = PALETTE.stoneDust;
  const slide = opened ? 11 : 5;
  const ly = cy - 16; // top-cap height of the body

  drawShadowBlob(ctx, cx, cy + 4, 46, 18);
  drawIsoPrism(ctx, cx, cy, 40, 22, 16, { top: lo, left: stone, right: PALETTE.stoneDark, outline: PALETTE.outline });
  // The open cavity (lid dragged toward the lower-left).
  drawIsoDiamond(ctx, cx, ly, 36, 20, PALETTE.void);
  drawIsoDiamond(ctx, cx + 2, ly, 28, 15, PALETTE.hostBlack);
  if (opened) {
    px(ctx, cx - 7, ly, PALETTE.hostBone, 14, 2); // long-bones
    px(ctx, cx - 4, ly - 3, PALETTE.outline, 8, 7); // skull
    px(ctx, cx - 3, ly - 3, PALETTE.hostBone, 6, 6);
    px(ctx, cx - 2, ly - 1, PALETTE.void, 2, 2);
    px(ctx, cx + 1, ly - 1, PALETTE.void, 2, 2);
  }
  // The slid lid slab, sitting proud to one side.
  drawIsoDiamond(ctx, cx + slide, ly - 4, 40, 22, PALETTE.outline);
  drawIsoDiamond(ctx, cx + slide, ly - 5, 38, 21, stone);
  drawIsoDiamond(ctx, cx + slide - 1, ly - 6, 30, 16, hi);
  // A worn Remnant sun-cross carved on the lid.
  px(ctx, cx + slide - 1, ly - 11, dust, 2, 9);
  px(ctx, cx + slide - 5, ly - 7, dust, 10, 2);
  drawNoisePixels(ctx, cx - 20, cy - 18, 42, 22, [lo, PALETTE.stoneDark], 0.04, seed);
}

// A spider web strung into a corner: pale spokes fanning from an anchor with a
// couple of catenary rings. A flat decal, seed picks which corner it clings to.
export function drawCobweb(ctx, cx, cy, seed) {
  const rng = rngFrom(hash2D(seed + 91, seed * 3 + 5));
  const col = PALETTE.stoneDust;
  const line = (x0, y0, x1, y1) => {
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
    for (let i = 0; i <= n; i += 1) {
      const t = i / n;
      px(ctx, Math.round(x0 + (x1 - x0) * t), Math.round(y0 + (y1 - y0) * t), col, 1, 1);
    }
  };
  const sx = rng() < 0.5 ? -1 : 1;
  const sy = rng() < 0.5 ? -1 : 1;
  const ax = cx + sx * 18; // anchor in one corner of the tile
  const ay = cy + sy * 9;
  ctx.save();
  ctx.globalAlpha = 0.4;
  const base = Math.atan2(-sy, -sx); // fan toward the tile centre
  const tips = [];
  for (let i = 0; i < 5; i += 1) {
    const a = base + (i - 2) * 0.34;
    const r = 15 + (i % 2) * 4;
    const tx = ax + Math.cos(a) * r;
    const ty = ay + Math.sin(a) * r * 0.5; // squash to the iso floor
    tips.push([tx, ty]);
    line(ax, ay, tx, ty); // spoke
  }
  for (let i = 0; i < tips.length - 1; i += 1) {
    for (const f of [0.5, 0.82]) { // two rings
      line(ax + (tips[i][0] - ax) * f, ay + (tips[i][1] - ay) * f,
        ax + (tips[i + 1][0] - ax) * f, ay + (tips[i + 1][1] - ay) * f);
    }
  }
  ctx.restore();
}

// --- Flat lore decals (baked into the floor) -------------------------------

// A child's chalk drawing: a ringed world over a long shaft, the way Bloom-era
// children draw an Europa and a bore they have never seen.
export function drawChalkDrawing(ctx, cx, cy, seed) {
  ctx.save();
  ctx.globalAlpha = 0.72;
  const chalk = PALETTE.hostBone;
  // Ringed planet (a pixel ellipse).
  for (let a = 0; a < 30; a += 1) {
    const t = (a / 30) * Math.PI * 2;
    px(ctx, cx - 8 + Math.round(Math.cos(t) * 6), cy - 5 + Math.round(Math.sin(t) * 4), chalk);
  }
  // The ring slashing across it.
  for (let i = -8; i <= 6; i += 1) px(ctx, cx - 8 + i, cy - 5 - Math.round(i * 0.3), chalk);
  // The bore shaft dropping below the world.
  px(ctx, cx - 8, cy, chalk, 1, 8);
  px(ctx, cx - 10, cy + 8, chalk, 5, 1);
  // A small stick figure looking up at it.
  px(ctx, cx + 10, cy - 4, chalk, 1, 1);
  px(ctx, cx + 10, cy - 2, chalk, 1, 5);
  px(ctx, cx + 8, cy - 1, chalk, 5, 1);
  px(ctx, cx + 8, cy + 3, chalk, 1, 2);
  px(ctx, cx + 12, cy + 3, chalk, 1, 2);
  ctx.restore();
  drawNoisePixels(ctx, cx - 18, cy - 12, 36, 22, [PALETTE.stoneDust], 0.03, seed);
}

// A black oil smear with tread bars and a shed brass rivet — something
// armoured and mechanical stood here recently.
export function drawMachineOil(ctx, cx, cy, seed) {
  ctx.save();
  ctx.globalAlpha = 0.5;
  drawIsoDiamond(ctx, cx, cy, 38, 17, PALETTE.void);
  ctx.globalAlpha = 0.3;
  drawIsoDiamond(ctx, cx + 5, cy + 1, 24, 11, PALETTE.hostBlack);
  ctx.restore();
  for (let i = 0; i < 4; i += 1) {
    px(ctx, cx - 12 + i * 7, cy - 2 + Math.floor(i * 0.6), PALETTE.stoneDark, 4, 2);
  }
  // A shed brass rivet catching what little light there is.
  px(ctx, cx + 9, cy + 2, PALETTE.outline, 4, 3);
  px(ctx, cx + 10, cy + 2, PALETTE.rustLight, 2, 2);
  px(ctx, cx + 10, cy + 2, PALETTE.hostGold, 1, 1);
  drawNoisePixels(ctx, cx - 18, cy - 8, 36, 16, [PALETTE.rustDark, PALETTE.hostBlack], 0.05, seed);
}

// An arched chapel window CUT INTO A WALL BLOCK, lying on the block's iso face so
// it follows the wall plane instead of standing flat. This is TERRAIN: it is the
// render for a `wall-window` tile. opts.dim => a cold barred cellar vent.
//
// It is drawn on the nave-facing (left-front, SW) face of a 64px wall block. That
// face spans columns x in [cx-32, cx]; its top and bottom edges both slope down to
// the right at the iso 2:1 angle (+0.5 per pixel), so the window slants with them.
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

// A cut-down victim crumpled dead on the ground: a slumped MAN, his chest still
// butterflied open over a few collapsed rib-bones, the head opened into a lolled
// goat skull with one curling horn, a limp arm flung out. The black-gold is spent
// to a single drained vein. `settle` (0..1) fades the blood pool in as he lands.
function drawFallenSaint(ctx, cx, cy, seed, settle = 1) {
  const flesh = PALETTE.skinDark;
  const fleshHi = PALETTE.skinMid;
  const bone = PALETTE.hostBone;
  const gold = PALETTE.hostGold;
  const wet = PALETTE.hostRed;

  ctx.save();
  ctx.globalAlpha = 0.85 * Math.max(0.15, settle);
  drawIsoDiamond(ctx, cx + 1, cy + 5, 32, 15, PALETTE.rustDark);
  ctx.restore();
  if (settle > 0.4) drawNoisePixels(ctx, cx - 16, cy - 1, 34, 12, [wet, PALETTE.rustDark], 0.12, seed);

  // Slumped body lying along the tile, head to the right. Human, smaller.
  for (let row = 0; row < 9; row += 1) {
    const w = 22 - Math.abs(row - 4) * 2;
    px(ctx, cx - Math.floor(w / 2) - 2, cy - 6 + row, flesh, w, 1);
  }
  px(ctx, cx - 14, cy - 5, PALETTE.void, 2, 9);
  px(ctx, cx - 13, cy - 5, fleshHi, 1, 8); // lit edge along the spine

  // Chest still butterflied open: a dead cavity and collapsed splayed rib-bones.
  px(ctx, cx - 5, cy - 3, PALETTE.void, 9, 6);
  px(ctx, cx - 4, cy - 2, PALETTE.rustDark, 7, 4);
  for (let r = 0; r < 4; r += 1) {
    px(ctx, cx - 6 - r, cy - 4 + r * 2, bone, 5 + r, 1); // left wing of ribs
    px(ctx, cx + 3, cy - 4 + r * 2, bone, 4 + r, 1); // right wing
  }
  px(ctx, cx - 1, cy - 5, gold, 1, 9); // one drained black-gold vein

  // The belly maw, slack open, a few bone teeth.
  px(ctx, cx - 3, cy + 3, PALETTE.void, 7, 2);
  for (let t = 0; t < 4; t += 1) px(ctx, cx - 3 + t * 2, cy + 3, bone, 1, 1);

  // A limp human arm flung out to the left.
  px(ctx, cx - 12, cy + 2, flesh, 8, 2);
  px(ctx, cx - 12, cy + 2, fleshHi, 8, 1);
  for (let f = 0; f < 4; f += 1) px(ctx, cx - 13 - f, cy + 2, bone, 1, 1 + (f & 1));

  // Goat skull lolled on its side, jaw clenched, one curling horn.
  const hx = cx + 12;
  const hy = cy - 6;
  px(ctx, hx - 4, hy, PALETTE.outline, 11, 9);
  px(ctx, hx - 3, hy, bone, 9, 7);
  px(ctx, hx - 1, hy + 2, PALETTE.void, 2, 2);
  px(ctx, hx + 3, hy + 2, PALETTE.void, 2, 2);
  px(ctx, hx + 1, hy + 5, PALETTE.hostBlack, 5, 1); // clenched jaw
  px(ctx, hx + 4, hy + 1, bone, 4, 1); // muzzle bridge
  const horn = [[5, -1], [7, -2], [9, 0], [10, 3], [9, 5], [7, 7]];
  for (const [dx, dy] of horn) px(ctx, hx + dx - 1, hy + dy - 1, PALETTE.outline, 3, 3);
  for (let i = 0; i < horn.length; i += 1) px(ctx, hx + horn[i][0], hy + horn[i][1], bone, 2, 2);
  px(ctx, hx - 4, hy - 2, bone, 2, 2); // snapped horn stub
  px(ctx, hx - 6, hy - 3, PALETTE.hostBlack, 2, 1);
}

// A Host-opened victim hammered to a chapel cross and still half-alive. He is
// still, plainly, a MAN: human-skinned, human-limbed, smaller than the beam he
// hangs from. The horror is what has grown through him: his ribcage cracked down
// the sternum and butterflied wide open like two wings of bone over a wet cavity,
// dark tendrils worked out of the opening, a toothed maw split into his belly,
// and his head opened all the way into a goat skull with one curling ram horn.
// Black-gold runs in thin veins under the skin, not in floods. The Choir cuts
// sacrament from him while he lives. opts: { pulse, flicker, killed, dim }
export function drawCrossMartyr(ctx, cx, cy, seed, opts = {}) {
  const pulse = opts.pulse ?? 0;
  const flicker = opts.flicker ?? 0;
  const dim = Boolean(opts.dim);
  // `released` = cut down from the cross: the body falls and dies on the ground,
  // animated by `fall` (0 = just released, 1 = landed). `dead` = killed but left
  // hanging on the cross (an older sacrament). Plain `killed` implies released.
  const released = Boolean(opts.released);
  const fall = released ? Math.max(0, Math.min(1, opts.fall ?? 1)) : 0;
  const dead = Boolean(opts.dead) || (Boolean(opts.killed) && !released);
  const killed = dead; // the on-cross body code reads `killed` as "dead, still hanging"

  const alivePulse = !dead && pulse ? 1 : 0;
  const deadSag = dead ? 8 : 0;
  const headDrop = dead ? 13 : 0;
  const flesh = dead ? PALETTE.stoneDust : PALETTE.skinMid; // human-sized even after the Host opens him
  const fleshHi = dead ? PALETTE.hostBone : PALETTE.skinLight;
  const fleshSh = dead ? PALETTE.stoneDark : PALETTE.skinDark;
  const wet = dead ? PALETTE.rustDark : PALETTE.hostRed;
  const dark = dead ? PALETTE.stoneDark : PALETTE.hostBlack;
  const rim = dead ? PALETTE.stoneDust : (dim ? PALETTE.hostGold : PALETTE.hostBone);
  const bone = rim;
  const gold = dead ? PALETTE.stoneDark : PALETTE.hostGold;
  const topY = cy - 88;
  const armY = cy - 60; // crossbeam / nailed wrists
  const footY = cy - 2;
  const beamHalf = 23;
  const shY = armY + 8 + deadSag; // shoulders
  const lean = dead ? 8 : 2 + alivePulse; // dead hangs still; living lolls with the pulse

  // Thick stepped line, for the sagging limbs.
  const seg = (x0, y0, x1, y1, color, thick) => {
    const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
    for (let i = 0; i <= steps; i += 1) {
      const t = i / steps;
      px(ctx, Math.round(x0 + (x1 - x0) * t - thick / 2), Math.round(y0 + (y1 - y0) * t), color, thick, 1);
    }
  };

  // A wet Host tendril worked out of the opening: tapers as it curls, a lit rust
  // edge so it reads against the dark, a faint gold tip.
  const tendril = (x0, y0, dir, len, baseW, rise) => {
    let x = x0;
    let y = y0;
    let vy = -rise;
    const tendrilBase = dead ? PALETTE.stoneDark : PALETTE.rustDark;
    const tendrilEdge = dead ? PALETTE.stoneDust : PALETTE.rustMid;
    for (let i = 0; i < len; i += 1) {
      const t = i / len;
      const w = Math.max(1, Math.round(baseW * (1 - t * 0.6)));
      px(ctx, Math.round(x - w / 2), Math.round(y), tendrilBase, w, 1);
      px(ctx, Math.round(x - w / 2), Math.round(y), tendrilEdge, 1, 1); // lit edge
      x += dir * (1 - t * 0.25);
      y += vy;
      vy += 0.38;
    }
    px(ctx, Math.round(x), Math.round(y), gold, 1, 1);
  };

  drawShadowBlob(ctx, cx, cy + 3, 40, 16);

  // --- Cross timber + beam, a little blood down the grain -----------------
  px(ctx, cx - 4, topY, PALETTE.outline, 9, footY - topY + 2);
  px(ctx, cx - 3, topY, PALETTE.woodDark, 7, footY - topY);
  px(ctx, cx - 3, topY, PALETTE.woodMid, 2, footY - topY);
  px(ctx, cx - beamHalf, armY - 3, PALETTE.outline, beamHalf * 2 + 2, 8);
  px(ctx, cx - beamHalf + 1, armY - 2, PALETTE.woodDark, beamHalf * 2 - 1, 6);
  px(ctx, cx - beamHalf + 1, armY - 2, PALETTE.woodMid, beamHalf * 2 - 1, 2);
  px(ctx, cx - beamHalf + 5, armY + 5, wet, 2, 9); // blood from the left nail
  px(ctx, cx + beamHalf - 6, armY + 5, wet, 2, 7); // from the right nail
  px(ctx, cx, armY + 30, wet, 2, footY - armY - 30); // down the post from the wound

  // --- Cut down: the cross hangs empty (torn nails, blood) and the body has
  //     dropped off it to crumple and die on the ground below ---------------
  if (released) {
    px(ctx, cx - beamHalf + 1, armY - 1, PALETTE.stoneLight, 2, 3); // wrist nails left in the beam
    px(ctx, cx + beamHalf - 3, armY - 1, PALETTE.stoneLight, 2, 3);
    px(ctx, cx - beamHalf + 1, armY + 2, wet, 3, 2); // torn-flesh smears
    px(ctx, cx + beamHalf - 4, armY + 2, wet, 3, 2);
    const dropY = Math.round(footY - (1 - fall) * 40); // falls from the beam to the floor
    drawFallenSaint(ctx, cx + 2, dropY, seed, fall);
    return;
  }

  // --- Broken bone halo behind the skull, splintered away on one side -----
  if (!killed) {
    for (let n = 0; n < 20; n += 1) {
      if (n > 10 && n < 15) continue; // the shattered arc
      const a = Math.PI * (0.06 + n * 0.05);
      const hx = cx + lean + Math.round(Math.cos(a) * (13 + (n % 3)));
      const hy = (armY - 12) - Math.round(Math.sin(a) * 12);
      px(ctx, hx, hy, n % 4 === 0 ? gold : rim, n % 5 === 0 ? 2 : 1, 1);
    }
    for (let i = 0; i < 3; i += 1) px(ctx, cx + 13 + i * 2, armY - 10 + i * 4, i % 2 ? gold : rim, 2, 1); // falling splinters
  }

  // --- Arms: human, wrists nailed at the beam ends, weight dragging them down
  //     and inward to the shoulders -----------------------------------------
  const wL = { x: cx - beamHalf + 2, y: armY + 1 };
  const wR = { x: cx + beamHalf - 3, y: armY + 1 };
  const shL = { x: cx - 8 + lean, y: shY + 2 };
  const shR = { x: cx + 9 + lean, y: shY + 1 };
  seg(wL.x, wL.y, cx - 15 + lean, armY + 8, flesh, 4);
  seg(cx - 15 + lean, armY + 8, shL.x, shL.y, flesh, 5);
  seg(wR.x, wR.y, cx + 15 + lean, armY + 7, flesh, 4);
  seg(cx + 15 + lean, armY + 7, shR.x, shR.y, flesh, 5);
  seg(wL.x, wL.y - 1, shL.x, shL.y - 1, fleshHi, 1); // lit edge
  seg(wR.x, wR.y - 1, shR.x, shR.y - 1, fleshHi, 1);
  seg(wL.x, wL.y + 2, shL.x, shL.y + 2, fleshSh, 1); // shaded underside
  seg(wR.x, wR.y + 2, shR.x, shR.y + 2, fleshSh, 1);
  px(ctx, shL.x - 1, shL.y - 1, gold, 1, 3); // one thin black-gold vein per arm
  px(ctx, shR.x, shR.y - 1, gold, 1, 3);

  // nailed wrists + slack human hands
  for (const s of [-1, 1]) {
    const w = s < 0 ? wL : wR;
    px(ctx, w.x - 1, w.y - 3, PALETTE.stoneDust, 3, 2); // hammered nail head
    px(ctx, w.x - 1, w.y - 1, PALETTE.stoneLight, 2, 3); // spike
    px(ctx, w.x - 1, w.y + 1, wet, 3, 2); // wound
    px(ctx, w.x - 1 + (s < 0 ? -1 : 1), w.y + 3, flesh, 3, 3); // palm
    for (let f = 0; f < 3; f += 1) px(ctx, w.x + s * f - 1, w.y + 6, flesh, 1, 2); // a few slack fingers
  }

  // --- Torso: a solid human chest and belly, tapering to the waist --------
  const tTop = shY + 1;
  const hipY = armY + 33;
  for (let row = 0; row <= hipY - tTop; row += 1) {
    const t = row / (hipY - tTop);
    const w = Math.round(19 - t * 5);
    const ox = cx - Math.floor(w / 2) + Math.round(lean * (0.3 + t * 0.4));
    px(ctx, ox, tTop + row, flesh, w, 1);
    px(ctx, ox, tTop + row, fleshSh, 1, 1); // shaded left edge
    px(ctx, ox + 1, tTop + row, fleshHi, 1, 1); // lit highlight just inside
    px(ctx, ox + w - 1, tTop + row, fleshSh, 1, 1); // shaded right edge
  }

  // --- The ribcage cracked down the sternum and butterflied WIDE OPEN: two
  //     symmetric wings of bone spread from a wet central cavity ------------
  const spineX = cx + lean;
  const cavX = spineX - 4;
  const cavTop = tTop + 2;
  const cavW = 8;
  const cavH = 16;
  px(ctx, cavX, cavTop, PALETTE.void, cavW, cavH); // open cavity down the middle
  px(ctx, cavX + 1, cavTop + 1, PALETTE.rustDark, cavW - 2, cavH - 2); // wet inside
  for (const s of [-1, 1]) {
    const baseX = s < 0 ? cavX : cavX + cavW - 1;
    for (let i = 0; i < 4; i += 1) {
      const ry = cavTop + 2 + i * 4;
      const reach = 8 - Math.abs(i - 1) - (i === 3 ? 1 : 0); // middle ribs longest
      const liftv = (i - 1.5) * 3; // fans up at the top, down at the bottom
      for (let k = 0; k <= reach; k += 1) {
        const tt = k / reach;
        const x = baseX + s * k;
        const y = Math.round(ry + liftv * tt - Math.sin(tt * Math.PI) * 2.4);
        px(ctx, x, y + 2, PALETTE.void, 1, 1); // shadow under the rib
        px(ctx, x, y, bone, 1, 2); // bold 2px rib
      }
    }
  }
  // split sternum down the centre, holding the two wings apart
  px(ctx, spineX - 1, cavTop, bone, 1, 4);
  px(ctx, spineX - 1, cavTop, fleshSh, 1, 1);

  // The single wound deep in the cavity (moderate: a wet core, a small glow)
  if (!killed) {
    const glow = pulse ? PALETTE.hostGlow : gold;
    px(ctx, cavX + 2, cavTop + 5, wet, 4, 6);
    px(ctx, cavX + 3, cavTop + 7, glow, 2, 3);
    if (pulse) px(ctx, cavX + 3, cavTop + 8, PALETTE.flash, 1, 1); // burning core
  } else {
    px(ctx, cavX + 2, cavTop + 6, PALETTE.rustDark, 4, 5);
  }

  // Tendrils worked out of the opening: two curl out and up over the rib-wings,
  // and one drops down out of the belly toward the floor.
  tendril(cavX + 1, cavTop + 3, -1, 11, 3, 2.4);
  tendril(cavX + cavW - 1, cavTop + 4, 1, 11, 3, 2.2);
  if (!killed) tendril(spineX, cavTop + cavH - 1, -1, 9, 2, -0.6);

  // --- A toothed maw split open in the belly ------------------------------
  const mawX = cx - 6 + lean;
  const mawY = armY + 27;
  px(ctx, mawX, mawY, PALETTE.void, 13, 5);
  px(ctx, mawX + 1, mawY + 1, dark, 11, 3);
  for (let t = 0; t < 6; t += 1) px(ctx, mawX + 1 + t * 2, mawY, rim, 1, 2 + (t & 1)); // upper teeth
  for (let t = 0; t < 5; t += 1) px(ctx, mawX + 2 + t * 2, mawY + 4, rim, 1, 1 + ((t + 1) & 1)); // lower teeth
  px(ctx, mawX + 5, mawY + 2, wet, 3, 1); // wet gum
  if (!killed) px(ctx, mawX + 6, mawY + 2, gold, 1, 1);

  // --- Legs: human, nailed together at one foot-spike, knees buckled aside -
  const kneeX = cx + lean - 4;
  const kneeY = hipY + 9 + (dead ? 2 : 0);
  const footX = cx + 1;
  seg(cx - 2 + lean, hipY, kneeX, kneeY, flesh, 7); // thighs
  seg(kneeX, kneeY, footX, footY - 2, flesh, 5); // shins
  seg(cx - 2 + lean, hipY, kneeX, kneeY, fleshHi, 1);
  px(ctx, kneeX - 1, kneeY, gold, 1, 3); // a thin vein at the knee
  px(ctx, footX - 2, footY - 4, PALETTE.stoneDust, 3, 2); // foot nail head
  px(ctx, footX - 2, footY - 3, PALETTE.stoneLight, 4, 2); // spike
  px(ctx, footX - 2, footY - 1, wet, 4, 2);

  // --- Goat skull: the head opened all the way, jaw torn open, one curling
  //     ram horn and the other snapped to a jagged spike --------------------
  const gx = cx + lean;
  const gy = armY - 17 + headDrop;
  px(ctx, cx - 2 + lean, shY - 4, flesh, 5, 6); // a short human neck below it
  px(ctx, cx - 2 + lean, shY - 4, fleshHi, 1, 6);
  px(ctx, gx - 5, gy, PALETTE.outline, 11, 9); // cranium
  px(ctx, gx - 4, gy, PALETTE.hostBone, 9, 8);
  px(ctx, gx - 4, gy, rim, 5, 1); // lit crown
  px(ctx, gx - 4, gy + 3, PALETTE.hostBlack, 10, 1); // brow ridge
  px(ctx, gx - 3, gy + 4, PALETTE.void, 3, 3); // deep sockets
  px(ctx, gx + 2, gy + 4, PALETTE.void, 3, 3);
  // muzzle dropping and leaning aside
  for (let r = 0; r < 8; r += 1) {
    const w = 6 - Math.floor(r / 3);
    const ox = gx - Math.floor(w / 2) + Math.round(r * 0.2);
    px(ctx, ox, gy + 7 + r, PALETTE.hostBone, w, 1);
    px(ctx, ox, gy + 7 + r, rim, 1, 1);
  }
  px(ctx, gx, gy + 9, PALETTE.hostBlack, 1, 6); // muzzle seam
  px(ctx, gx - 1, gy + 13, PALETTE.void, 2, 2); // nostril
  // horns: left a curling ram horn, right a snapped jagged spike
  const leftHorn = [[-4, -1], [-6, -3], [-8, -5], [-10, -3], [-10, 0], [-9, 3], [-7, 5]];
  const rightHorn = [[4, -2], [5, -4], [6, -7]];
  for (const [dx, dy] of leftHorn) px(ctx, gx + dx - 1, gy + dy - 1, PALETTE.outline, 3, 3);
  for (const [dx, dy] of rightHorn) px(ctx, gx + dx - 1, gy + dy - 1, PALETTE.outline, 3, 3);
  for (let i = 0; i < leftHorn.length; i += 1) px(ctx, gx + leftHorn[i][0], gy + leftHorn[i][1], PALETTE.hostBone, 2, 2);
  for (let i = 0; i < rightHorn.length; i += 1) px(ctx, gx + rightHorn[i][0], gy + rightHorn[i][1], PALETTE.hostBone, 2, 2);
  px(ctx, gx + 6, gy - 7, PALETTE.hostBlack, 2, 2); // snapped tip

  if (!killed) {
    px(ctx, gx - 2, gy + 5, pulse ? PALETTE.flash : PALETTE.hostGlow, 2, 1); // a small light in the sockets
    px(ctx, gx + 3, gy + 5, gold, 2, 1);
    // jaw torn open: a black maw ringed in bone teeth, a little light in the throat
    px(ctx, gx - 4, gy + 15, PALETTE.void, 11, 5);
    for (let t = 0; t < 5; t += 1) px(ctx, gx - 4 + t * 2, gy + 15, rim, 1, 2 + (t & 1));
    for (let t = 0; t < 4; t += 1) px(ctx, gx - 3 + t * 2, gy + 19, rim, 1, 2);
    px(ctx, gx - 1, gy + 16, pulse ? PALETTE.flash : gold, 2, 2);
  } else {
    px(ctx, gx - 3, gy + 15, PALETTE.hostBlack, 8, 1); // a clenched, dead jaw
  }

  // --- A little blood pooled and spattered at the foot --------------------
  drawIsoDiamond(ctx, cx + 2, cy + 2, 22, 11, PALETTE.rustDark);
  drawNoisePixels(ctx, cx - 11, cy - 3, 24, 11, [wet, PALETTE.rustDark], 0.1, seed);
  px(ctx, cx - 2, footY, wet, 6, 2);
}

// The Choir's "larder": the next victim, bound upright to a post and kept
// alive while the first is eaten. NOT crucified and NOT yet opened -- early
// Host only (sick pallor, a few black-gold veins, a bud of bone), gagged and
// roped. opts: { pulse, flicker, killed, dim }
export function drawBoundVictim(ctx, cx, cy, seed, opts = {}) {
  const rng = rngFrom(hash2D(seed + 129, seed * 5 + 31));
  const pulse = opts.pulse ?? 0;
  const flicker = opts.flicker ?? 0;
  const killed = Boolean(opts.killed);
  const dim = Boolean(opts.dim);
  const side = (seed & 1) ? 1 : -1;
  const lean = side * (1 + Math.floor(rng() * 2));
  const topY = cy - 58;
  const footY = cy - 4;
  const barY = topY + 7;
  const shoulderY = topY + 20 + (killed ? 2 : 0);
  const chestY = shoulderY + 5;
  const hipY = footY - 19;
  const kneeY = footY - 10;
  const headX = cx + lean + side;
  const headY = topY + 11 + (killed ? 3 : 0);

  const limb = (x0, y0, x1, y1, mid, hi = null) => {
    linePx(ctx, x0, y0, x1, y1, PALETTE.outline, 3);
    linePx(ctx, x0, y0, x1, y1, mid, 2);
    if (hi) linePx(ctx, x0, y0, x1, y1 - 1, hi, 1);
  };

  drawShadowBlob(ctx, cx, cy + 2, 28, 12);

  // A thin, cold seep of light (a grate, not a window) while it still lives.
  if (!killed) {
    ctx.save();
    for (let row = -5; row <= 5; row += 1) {
      const halfW = 14 - Math.abs(row) * 2;
      if (halfW <= 0) continue;
      ctx.globalAlpha = (dim ? 0.05 : 0.1) * (1 - Math.abs(row) / 7) + (flicker ? 0.01 : 0);
      ctx.fillStyle = PALETTE.rustMid;
      ctx.fillRect(cx - halfW, cy - 30 + row * 4, halfW * 2, 4);
    }
    ctx.restore();
  }

  // Post and wrist bar, rough enough to read as a lash-up, not a clean sign.
  px(ctx, cx - 3, topY - 1, PALETTE.outline, 7, footY - topY + 4);
  px(ctx, cx - 2, topY, PALETTE.woodDark, 5, footY - topY + 1);
  px(ctx, cx - 1, topY, PALETTE.woodMid, 2, footY - topY);
  px(ctx, cx + 2, topY + 4, PALETTE.woodLight, 1, 19);
  px(ctx, cx - 13, barY - 1, PALETTE.outline, 28, 5);
  px(ctx, cx - 12, barY, PALETTE.woodDark, 26, 3);
  px(ctx, cx - 11, barY, PALETTE.woodMid, 22, 1);
  px(ctx, cx - 7, barY + 3, PALETTE.woodLight, 4, 1);
  px(ctx, cx + 8, barY + 3, PALETTE.woodLight, 3, 1);

  const leftWrist = { x: cx - 10, y: barY + 4 };
  const rightWrist = { x: cx + 9, y: barY + 3 };
  const leftElbow = { x: cx + lean - 7, y: shoulderY - 5 };
  const rightElbow = { x: cx + lean + 8, y: shoulderY - 7 };
  const leftShoulder = { x: cx + lean - 5, y: shoulderY };
  const rightShoulder = { x: cx + lean + 6, y: shoulderY - 1 };

  // Arms are pulled high but bent at the joints, with swollen hands at the rope.
  limb(leftWrist.x, leftWrist.y, leftElbow.x, leftElbow.y, PALETTE.skinDark, PALETTE.skinMid);
  limb(leftElbow.x, leftElbow.y, leftShoulder.x, leftShoulder.y, PALETTE.skinMid, PALETTE.skinLight);
  limb(rightWrist.x, rightWrist.y, rightElbow.x, rightElbow.y, PALETTE.skinDark, PALETTE.skinMid);
  limb(rightElbow.x, rightElbow.y, rightShoulder.x, rightShoulder.y, PALETTE.skinMid, PALETTE.skinLight);
  for (const w of [leftWrist, rightWrist]) {
    px(ctx, w.x - 2, w.y - 1, PALETTE.clothTan, 6, 2);
    px(ctx, w.x - 1, w.y + 1, PALETTE.rustDark, 4, 1);
    px(ctx, w.x + (w === leftWrist ? -2 : 2), w.y + 2, PALETTE.skinDark, 2, 2);
  }

  // Bowed, gagged human head. No readable eyes or smile at this scale.
  const headRows = [
    [3, 1, PALETTE.skinDark],
    [6, 0, PALETTE.skinMid],
    [8, 0, PALETTE.skinMid],
    [8, 1, PALETTE.skinMid],
    [7, 1, PALETTE.skinDark],
    [5, 2, PALETTE.skinDark],
    [3, 2, PALETTE.skinMid]
  ];
  for (let row = 0; row < headRows.length; row += 1) {
    const [w, off, color] = headRows[row];
    const x = headX - Math.floor(w / 2) + off;
    const y = headY + row;
    px(ctx, x - 1, y, PALETTE.outline, w + 2, 1);
    px(ctx, x, y, color, w, 1);
    if (row < 4) px(ctx, x, y, PALETTE.skinLight, 1, 1);
  }
  px(ctx, headX - 4, headY + 2, PALETTE.hostBlack, 7, 1); // shadowed brow, not cartoon eyes
  px(ctx, headX - 3, headY + 5, PALETTE.clothDark, 8, 2); // gag strap
  px(ctx, headX - 2, headY + 5, PALETTE.clothTan, 5, 1);
  px(ctx, headX + side * 4, headY + 1, PALETTE.hostBone, 2, 2); // first temple bone bud
  px(ctx, headX + side * 6, headY, PALETTE.outline, 1, 2);
  if (killed) px(ctx, headX - 3, headY + 6, PALETTE.void, 6, 1);

  // Collar and throat tie pull the head back into the post.
  px(ctx, cx + lean - 5, shoulderY - 4, PALETTE.clothTan, 11, 2);
  linePx(ctx, cx + lean + side * 2, shoulderY - 3, cx + side * 6, topY + 19, PALETTE.rustDark, 1);
  px(ctx, cx + side * 6 - 1, topY + 18, PALETTE.stoneDark, 3, 2);

  // A slumped, torn body. The rows drift so the silhouette stops reading as a box.
  for (let y = shoulderY; y <= hipY; y += 1) {
    const t = (y - shoulderY) / Math.max(1, hipY - shoulderY);
    const w = Math.round(13 - t * 4);
    const drift = Math.round(lean * (1 - t) + side * Math.sin(t * Math.PI) * 2);
    const lx = cx + drift - Math.floor(w / 2);
    const tone = y < chestY + 2 ? PALETTE.skinMid : y < hipY - 3 ? PALETTE.clothDark : PALETTE.stoneDark;
    px(ctx, lx - 1, y, PALETTE.outline, w + 2, 1);
    px(ctx, lx, y, tone, w, 1);
    px(ctx, lx, y, y < chestY + 5 ? PALETTE.skinLight : PALETTE.clothTan, 1, 1);
    px(ctx, lx + w - 1, y, y < chestY + 5 ? PALETTE.skinDark : PALETTE.void, 1, 1);
    if (y === chestY + 7 || y === hipY - 3) px(ctx, lx - 1, y, PALETTE.clothTan, w + 2, 1);
  }

  // Torn-open shirt edge, early black-gold seams, and one small living wound.
  linePx(ctx, cx + lean - 2, chestY - 1, cx + lean - 4, hipY - 6, PALETTE.hostBlack, 1);
  linePx(ctx, cx + lean - 1, chestY, cx + lean - 3, hipY - 7, PALETTE.hostGold, 1);
  linePx(ctx, cx + lean + 3, chestY + 3, cx + lean + 1, hipY - 8, PALETTE.hostGold, 1);
  px(ctx, cx + lean - 1, chestY + 6, killed ? PALETTE.hostBlack : (pulse ? PALETTE.hostGlow : PALETTE.hostGold), 2, 2);
  px(ctx, cx + lean + side * 6, shoulderY + 1, PALETTE.hostBone, 2, 3);
  px(ctx, cx + lean + side * 8, shoulderY, PALETTE.outline, 1, 2);
  px(ctx, cx + lean - side * 5, chestY + 2, PALETTE.rustDark, 5, 1);
  px(ctx, cx + lean + side * 2, chestY + 9, PALETTE.hostRed, 2, 1);

  // Slack legs, still human and thin, with one knee folding inward.
  const leftHip = { x: cx + lean - 3, y: hipY };
  const rightHip = { x: cx + lean + 4, y: hipY - 1 };
  const leftKnee = { x: cx + lean - 5 - side, y: kneeY };
  const rightKnee = { x: cx + lean + 3 + side, y: kneeY - 1 };
  const leftAnkle = { x: cx - 4, y: footY - 2 };
  const rightAnkle = { x: cx + 5, y: footY - 3 };
  limb(leftHip.x, leftHip.y, leftKnee.x, leftKnee.y, PALETTE.clothDark, PALETTE.stoneMid);
  limb(leftKnee.x, leftKnee.y, leftAnkle.x, leftAnkle.y, PALETTE.clothDark);
  limb(rightHip.x, rightHip.y, rightKnee.x, rightKnee.y, PALETTE.clothDark, PALETTE.stoneMid);
  limb(rightKnee.x, rightKnee.y, rightAnkle.x, rightAnkle.y, PALETTE.clothDark);
  px(ctx, leftAnkle.x - 2, leftAnkle.y, PALETTE.stoneDark, 5, 2);
  px(ctx, rightAnkle.x - 2, rightAnkle.y, PALETTE.stoneDark, 6, 2);
  px(ctx, cx - 5, footY - 4, PALETTE.clothTan, 12, 1);
  px(ctx, cx - 3, footY - 3, PALETTE.rustDark, 8, 1);

  // Old blood and Host seep at the base from being held here, not carved open.
  drawIsoDiamond(ctx, cx + 1, cy + 1, 18, 8, PALETTE.rustDark);
  drawNoisePixels(ctx, cx - 10, cy - 4, 22, 9, [PALETTE.hostRed, PALETTE.rustDark, PALETTE.hostBlack], 0.06, seed);
  px(ctx, cx + lean - 1, footY, PALETTE.hostGold, 2, 1);
}

// A Choir blood-sigil daubed on the floor: an inverted cross in a rough ring.
export function drawBloodSigil(ctx, cx, cy, seed) {
  const blood = PALETTE.hostRed;
  const dark = PALETTE.rustDark;
  ctx.save();
  ctx.globalAlpha = 0.82;
  for (let n = 0; n < 26; n += 1) {
    const a = (Math.PI * 2 * n) / 26;
    px(ctx, cx + Math.round(Math.cos(a) * 14), cy + Math.round(Math.sin(a) * 7), n % 2 ? blood : dark);
  }
  px(ctx, cx, cy - 7, blood, 1, 16); // upright
  px(ctx, cx - 4, cy + 4, blood, 9, 1); // crossbar set low => inverted
  ctx.restore();
  drawNoisePixels(ctx, cx - 15, cy - 9, 30, 18, [blood, dark], 0.05, seed);
}

// A large ground rite-circle: a double blood ring around an inverted cross,
// bone markers at the cardinal points. The Choir's working floor.
export function drawRitualCircle(ctx, cx, cy, seed) {
  const blood = PALETTE.hostRed;
  const dark = PALETTE.rustDark;
  ctx.save();
  ctx.globalAlpha = 0.34;
  drawIsoDiamond(ctx, cx, cy, 70, 35, PALETTE.void);
  ctx.globalAlpha = 0.85;
  for (let n = 0; n < 52; n += 1) {
    const a = (Math.PI * 2 * n) / 52;
    px(ctx, cx + Math.round(Math.cos(a) * 31), cy + Math.round(Math.sin(a) * 15), blood);
    px(ctx, cx + Math.round(Math.cos(a) * 24), cy + Math.round(Math.sin(a) * 12), n % 2 ? dark : blood);
  }
  px(ctx, cx, cy - 12, blood, 2, 26); // upright
  px(ctx, cx - 8, cy + 8, blood, 18, 2); // low crossbar => inverted
  for (const [dx, dy] of [[0, -15], [0, 15], [31, 0], [-31, 0]]) px(ctx, cx + dx, cy + dy, PALETTE.hostBone, 2, 2);
  ctx.restore();
  drawNoisePixels(ctx, cx - 33, cy - 17, 66, 34, [dark, PALETTE.stoneDark], 0.04, seed);
}

// A Choir wound-star scrawled on the wall: a point-down (inverted) pentagram in
// a rough painted ring, daubed in blood and weeping a little black-gold where it
// has bitten into the stone. Drawn upright on the wall plane, so place it on a
// wall-adjacent cell. The Choir paint these over the old prayer-marks they find.
export function drawChoirPentagram(ctx, cx, cy, seed) {
  const blood = PALETTE.hostRed;
  const dark = PALETTE.rustDark;
  const gold = PALETTE.hostGold;
  const R = 15;
  const wy = cy - 31; // lift onto the wall behind the cell

  // Rough paint backing so the star sits on a smear, not clean stone.
  ctx.save();
  ctx.globalAlpha = 0.5;
  drawNoisePixels(ctx, cx - R - 4, wy - R - 4, (R + 4) * 2, (R + 4) * 2, [dark, PALETTE.stoneDark], 0.07, seed);
  ctx.restore();

  // The enclosing ring.
  ctx.save();
  ctx.globalAlpha = 0.92;
  for (let n = 0; n < 44; n += 1) {
    const a = (Math.PI * 2 * n) / 44;
    px(ctx, cx + Math.round(Math.cos(a) * (R + 2)), wy + Math.round(Math.sin(a) * (R + 2)), n % 6 === 0 ? gold : blood);
  }

  // Point-down five-point star: pentagon vertices joined every other one.
  const pts = [];
  for (let k = 0; k < 5; k += 1) {
    const a = Math.PI / 2 + (Math.PI * 2 * k) / 5; // a vertex points straight down
    pts.push([cx + Math.cos(a) * R, wy + Math.sin(a) * R]);
  }
  const order = [0, 2, 4, 1, 3, 0];
  ctx.strokeStyle = blood;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(pts[order[0]][0], pts[order[0]][1]);
  for (let i = 1; i < order.length; i += 1) ctx.lineTo(pts[order[i]][0], pts[order[i]][1]);
  ctx.stroke();
  ctx.restore();

  // Black-gold bleed at the points and the heart of the star.
  for (const [px0, py0] of pts) px(ctx, Math.round(px0), Math.round(py0), gold, 2, 2);
  px(ctx, cx, wy, gold, 2, 2);

  // Paint running down the wall in thin drips.
  const rng = rngFrom(hash2D(seed + 5, seed * 3 + 2));
  for (let i = 0; i < 5; i += 1) {
    const dx = Math.round((rng() - 0.5) * R * 2);
    const dl = 3 + Math.floor(rng() * 11);
    px(ctx, cx + dx, wy + R, i % 2 ? blood : dark, 1, dl);
  }
}

// A Bloom-era prisoner who calcified in their chains while the chapel forced
// them to pray. The Host had started its work (snapped bone-thorns, a broken
// halo, hands fused in prayer, a dead sunken wound), then the Stilling froze it
// pale and grey. Beaten and cut before the end, still collared to the wall.
export function drawCalcifiedPenitent(ctx, cx, cy, seed) {
  const rng = rngFrom(hash2D(seed + 91, seed * 7 + 13));
  const tilt = Math.round((rng() - 0.5) * 5); // the head and torso loll to one side
  const side = (seed & 1) ? 1 : -1;
  const bone = PALETTE.hostBone;   // calcified pale flesh
  const boneLo = PALETTE.stoneDust;
  const boneDk = PALETTE.stoneDark;
  const grey = PALETTE.stoneLight;
  const vein = PALETTE.stoneDark;  // black-gold gone dead and grey
  const cut = PALETTE.rustDark;    // old dried wounds
  const cutWet = PALETTE.hostRed;
  const iron = PALETTE.stoneDark;
  const ironHi = PALETTE.stoneLight;

  const footY = cy - 2;
  const hipY = cy - 18;
  const chestY = cy - 34;
  const shoulderY = cy - 43;
  const headY = cy - 54;
  const ringY = cy - 60;   // iron rings in the wall

  const seg = (x0, y0, x1, y1, color, thick = 1) => {
    const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
    for (let i = 0; i <= steps; i += 1) {
      const t = i / steps;
      px(ctx, Math.round(x0 + (x1 - x0) * t - Math.floor(thick / 2)), Math.round(y0 + (y1 - y0) * t), color, thick, 1);
    }
  };

  drawShadowBlob(ctx, cx, cy + 2, 26, 11);

  // Uneven wall rings and chains. They hold the body up, but not cleanly.
  for (const s of [-1, 1]) {
    const rx = cx + s * (11 + ((seed >> (s > 0 ? 2 : 4)) & 1));
    const ry = ringY + (s === side ? -2 : 2);
    for (const [dx, dy] of [[-2, 0], [-1, -2], [1, -2], [2, 0], [1, 2], [-1, 2]]) {
      px(ctx, rx + dx, ry + dy, iron);
    }
    const ax = cx + tilt + s * (4 + (s === side ? 2 : 0));
    const ay = shoulderY + (s === side ? -2 : 3);
    for (let i = 0; i <= 6; i += 1) {
      const t = i / 5;
      const x = Math.round(rx + (ax - rx) * t);
      const y = Math.round(ry + 2 + (ay - ry - 2) * t);
      px(ctx, x, y, i % 2 ? ironHi : iron, 2, 1 + (i & 1));
    }
    px(ctx, ax - 1, ay - 1, iron, 4, 2); // manacle buried in calcified flesh
    seg(ax, ay, cx + tilt + s * 6, chestY - 2, boneLo, 2);
    seg(ax + s, ay, cx + tilt + s * 5, chestY - 2, bone, 1);
  }

  // Broken halo behind the bowed skull, snapped open on one side.
  const haloCx = cx + tilt + side * 2;
  for (let n = 0; n < 15; n += 1) {
    if ((side > 0 && n > 8 && n < 12) || (side < 0 && n > 3 && n < 7)) continue;
    const a = Math.PI * (0.15 + n * 0.055);
    const hx = haloCx + Math.round(Math.cos(a) * (10 + (n % 2)));
    const hy = headY + 6 - Math.round(Math.sin(a) * 8);
    px(ctx, hx, hy, n % 3 === 0 ? bone : boneLo, n % 4 === 0 ? 2 : 1, 1);
  }

  // Long bowed skull, not a clean square face. The lower jaw hangs crooked and
  // the sockets read as holes, not eyes or a smile.
  const skullX = cx + tilt + side * 2;
  const skullY = headY + 3;
  const skullRows = [
    [3, 0], [6, -1], [8, -1], [7, 0], [6, 1], [5, 1], [4, 2], [3, 3], [2, 4]
  ];
  for (let row = 0; row < skullRows.length; row += 1) {
    const [w, off] = skullRows[row];
    const x = skullX - Math.floor(w / 2) + off;
    const y = skullY + row;
    px(ctx, x - 1, y, PALETTE.outline, w + 2, 1);
    px(ctx, x, y, row < 3 ? bone : boneLo, w, 1);
    px(ctx, x, y, grey, 1, 1);
  }
  px(ctx, skullX - 3, skullY + 4, PALETTE.void, 2, 3);
  px(ctx, skullX + 2, skullY + 3, PALETTE.void, 2, 3);
  px(ctx, skullX + side, skullY + 7, PALETTE.void, 3, 3); // broken open jaw
  px(ctx, skullX + side * 2, skullY + 9, boneLo, 3, 1);
  px(ctx, skullX - side * 5, skullY + 1, bone, 2, 2); // snapped horn/halo stub
  px(ctx, skullX - side * 7, skullY, PALETTE.outline, 2, 1);

  // Iron collar and throat chain, cutting the neck line instead of forming a face.
  px(ctx, cx - 5 + tilt, shoulderY - 1, iron, 11, 2);
  px(ctx, cx - 5 + tilt, shoulderY - 1, ironHi, 7, 1);
  seg(cx + tilt, shoulderY, cx + tilt - side * 8, ringY + 1, iron, 1);

  // One continuous but twisted hanging body from shoulders to hips. The offset
  // rows and dark side edge break the old tidy gray-man silhouette.
  for (let y = shoulderY; y <= hipY; y += 1) {
    const t = (y - shoulderY) / Math.max(1, hipY - shoulderY);
    const w = Math.round(12 - t * 4);
    const drift = Math.round(tilt * (1 - t) + side * Math.sin(t * Math.PI) * 3);
    const lx = cx - Math.floor(w / 2) + drift;
    px(ctx, lx, y, boneLo, w, 1);
    px(ctx, lx, y, bone, 1, 1);
    px(ctx, lx + w - 1, y, vein, 1, 1);
    if (y % 5 === 0) px(ctx, lx + 2, y, boneDk, Math.max(2, w - 5), 1);
  }

  // Ribcage cracked open and frozen shut around a dead cavity. No glow.
  const cavX = cx + tilt - 3 + side;
  const cavY = chestY - 1;
  px(ctx, cavX, cavY, PALETTE.void, 8, 12);
  px(ctx, cavX + 1, cavY + 2, vein, 5, 7);
  for (const s of [-1, 1]) {
    const baseX = s < 0 ? cavX : cavX + 7;
    for (let r = 0; r < 4; r += 1) {
      const y = cavY + 1 + r * 3;
      const len = 5 - (r === 3 ? 1 : 0);
      seg(baseX, y, baseX + s * len, y + (r - 1), bone, 1);
    }
  }
  px(ctx, cavX + 3, cavY - 1, boneDk, 1, 13); // split sternum, drained dark

  // Fused prayer-hands caught at the wound, with one side cracked away.
  const handY = cavY + 8;
  px(ctx, cx + tilt - 2, handY, bone, 5, 6);
  px(ctx, cx + tilt, handY + 1, PALETTE.void, 1, 5);
  px(ctx, cx + tilt + side * 3, handY + 2, boneDk, 2, 3);

  // Dried cuts and snapped thorns, uneven so the row never reads as dolls.
  const cuts = 2 + (rng() < 0.5 ? 1 : 0);
  for (let i = 0; i < cuts; i += 1) {
    const gy = chestY - 3 + Math.floor(rng() * Math.max(1, hipY - chestY + 8));
    const gx = cx - 6 + tilt + Math.floor(rng() * 8);
    px(ctx, gx, gy, i % 2 ? cutWet : cut, 6 + Math.floor(rng() * 5), 1);
  }
  for (let i = 0; i < 3; i += 1) {
    const bx = cx - 6 + tilt + i * 5;
    const hh = 2 + ((seed + i) & 2);
    seg(bx, shoulderY + 2, bx + (i === 1 ? -side : side) * 2, shoulderY - hh, bone, 1);
  }

  // Legs are folded and partly fused into a hanging calcified skirt, with one
  // ankle dragged sideways by iron.
  const kneeY = hipY + 8;
  seg(cx + tilt - 3, hipY, cx - 8 + side, kneeY, boneLo, 4);
  seg(cx + tilt + 3, hipY + 1, cx + 7 + side * 2, kneeY + 2, boneLo, 3);
  seg(cx - 8 + side, kneeY, cx - 4, footY - 2, boneDk, 2);
  seg(cx + 7 + side * 2, kneeY + 2, cx + 5, footY - 1, boneDk, 2);
  px(ctx, cx - 8, footY - 2, iron, 5, 2);
  px(ctx, cx + 3, footY - 1, iron, 6, 2);
  seg(cx - 6, footY - 2, cx - 13, footY - 5, iron, 1);

  // Blood pooled and gone dark beneath.
  drawNoisePixels(ctx, cx - 10, cy - 3, 20, 8, [cut, PALETTE.stoneDark], 0.07, seed);
}

// The warden's iron strongbox, set into the wall behind the hung saint. A brass
// keyhole plate and a stamped Remnant sun-cross seal. opts.opened swings the
// door wide on an empty cavity once it has been looted.
// ---------------------------------------------------------------------------
// Wall fixtures (a feature set INTO the SW face of a wall block)
// ---------------------------------------------------------------------------
//
// A wall fixture is always drawn AFTER drawIsoWallBlock at the same (cx, cy),
// so it reads as part of the wall, not a prop standing in front of it (see
// `wall-window`, `wall-safe`, `wall-stash` in spriteCatalog.js). The visible
// SW face of a full-height (WALL_HEIGHT) block runs from the left corner
// (cx - 32, top cy-64 / bottom cy) to the bottom corner (cx, top cy-48 /
// bottom cy+16). These helpers give that face's sloped top and bottom edge at
// a given column x, so a fixture sits flush on the angled stone.
function swFaceTop(cx, cy, x) { return (cy - 64) + (x - (cx - 32)) * 0.5; }
function swFaceBot(cx, cy, x) { return cy + (x - (cx - 32)) * 0.5; }

// Draws a face-aligned filled band between two y-offsets from the face edges,
// as 1px vertical columns following the slope. `pad` = [topPad, botPad].
function faceBand(ctx, cx, cy, xL, xR, topPad, botPad, color, w = 1) {
  for (let x = xL; x <= xR; x += w) {
    const t = swFaceTop(cx, cy, x) + topPad;
    const b = swFaceBot(cx, cy, x) - botPad;
    if (b > t) px(ctx, x, Math.round(t), color, w, Math.round(b - t));
  }
}

// An iron strongbox set into the wall. It must read against the stoneMid wall
// face, so the body is darker (stoneDark) with a hard dark recess frame, a lit
// top edge, corner bolts, and a brass keyhole + small Remnant sun-cross seal.
// When looted: a black cavity with the door swung aside.
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

// A loose stone pried out of the wall, hiding a small cache. The niche is a dark
// recess; the stone is LIGHTER than the wall and pushed proud (with a cast
// shadow on the pried side), so it reads. Pried further out, gleam gone, once
// looted.
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

// A Remnant believer the Choir knifed and marked: on his back in a wide blood
// pool, coat cut open over a point-down star carved into the bare chest, stab
// wounds, and a silver cross still at his throat (an upright cross they left
// because it was never the point). The carved words are read on inspection.
export function drawCultVictim(ctx, cx, cy, seed) {
  const blood = PALETTE.hostRed;
  const dark = PALETTE.rustDark;
  const rng = rngFrom(hash2D(seed + 17, seed * 3 + 5));

  drawShadowBlob(ctx, cx, cy + 4, 52, 21);

  // A wide, half-dried pool with a drag smear and thrown spatter around it.
  ctx.save();
  ctx.globalAlpha = 0.85;
  drawIsoDiamond(ctx, cx + 2, cy + 4, 46, 21, dark);
  ctx.globalAlpha = 0.62;
  drawIsoDiamond(ctx, cx + 4, cy + 4, 30, 14, blood);
  ctx.restore();
  for (let i = 0; i < 11; i += 1) px(ctx, cx - 22 - i, cy + 4 + ((i * 7) % 5) - 2, i % 2 ? dark : blood, 2, 1); // drag smear
  drawNoisePixels(ctx, cx - 26, cy - 6, 56, 26, [blood, dark], 0.11, seed);
  for (let i = 0; i < 16; i += 1) {
    const a = rng() * Math.PI * 2;
    const r = 13 + rng() * 17;
    px(ctx, cx + Math.round(Math.cos(a) * r), cy + Math.round(Math.sin(a) * r * 0.5), blood);
  }

  // Body on its back: dark traveller's coat, slack limbs.
  for (let row = 0; row < 9; row += 1) {
    const w = 28 - Math.abs(row - 4) * 3;
    const tone = row < 2 ? PALETTE.stoneMid : row < 7 ? PALETTE.clothDark : PALETTE.stoneDark;
    px(ctx, cx - Math.floor(w / 2) - 3, cy - 6 + row, tone, w, 1);
  }
  px(ctx, cx - 18, cy - 6, PALETTE.outline, 2, 9);
  px(ctx, cx - 20, cy - 1, PALETTE.stoneDark, 8, 4); // boots
  px(ctx, cx - 9, cy + 4, PALETTE.clothDark, 9, 2);  // outflung arm
  px(ctx, cx - 1, cy + 5, PALETTE.skinMid, 3, 2);    // pale hand

  // Slack, pale head at the right end, jaw fallen open.
  px(ctx, cx + 10, cy - 5, PALETTE.outline, 8, 8);
  px(ctx, cx + 11, cy - 4, PALETTE.skinMid, 6, 6);
  px(ctx, cx + 11, cy - 4, PALETTE.skinDark, 6, 1);
  px(ctx, cx + 11, cy - 5, PALETTE.clothDark, 6, 1); // hair
  px(ctx, cx + 13, cy - 1, PALETTE.void, 2, 2);      // open mouth

  // Silver cross at the throat: a chain and an upright cross, a cold glint.
  const nx = cx + 8;
  const ny = cy + 1;
  px(ctx, nx - 3, ny - 2, PALETTE.stoneDust, 7, 1);
  px(ctx, nx, ny - 1, PALETTE.hostBone, 1, 5);
  px(ctx, nx - 1, ny + 1, PALETTE.hostBone, 3, 1); // crossbar high => upright
  px(ctx, nx, ny - 1, PALETTE.flash, 1, 1);

  // Chest cut bare and carved with a point-down (inverted) five-line star.
  const pcx = cx + 1;
  const pcy = cy - 1;
  const R = 6;
  px(ctx, pcx - 6, pcy - 5, PALETTE.skinMid, 13, 10);
  px(ctx, pcx - 6, pcy - 5, PALETTE.skinDark, 13, 1);
  const pts = [];
  for (let k = 0; k < 5; k += 1) {
    const a = Math.PI / 2 + (Math.PI * 2 * k) / 5; // a vertex points down
    pts.push([pcx + Math.cos(a) * R, pcy + Math.sin(a) * R * 0.8]);
  }
  const order = [0, 2, 4, 1, 3, 0];
  ctx.strokeStyle = blood;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(pts[order[0]][0], pts[order[0]][1]);
  for (let i = 1; i < order.length; i += 1) ctx.lineTo(pts[order[i]][0], pts[order[i]][1]);
  ctx.stroke();
  // carved scratch-lines beneath the star (the words, read on inspection)
  for (let i = 0; i < 2; i += 1) px(ctx, pcx - 5, pcy + 6 + i, blood, 11 - i * 2, 1);
  // stab punctures across the belly
  for (let i = 0; i < 4; i += 1) {
    const sxp = cx - 8 + i * 4;
    px(ctx, sxp, cy + 1 + (i % 2), PALETTE.void, 2, 1);
    px(ctx, sxp, cy + 1 + (i % 2), blood, 1, 1);
  }
}
