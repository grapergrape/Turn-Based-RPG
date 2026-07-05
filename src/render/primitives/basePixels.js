// Reusable seeded pixel, isometric geometry, and surface-detail helpers.

import { PALETTE } from '../palette.js';
import { TILE_WIDTH, TILE_HEIGHT, WALL_HEIGHT } from '../renderConfig.js';

export function hash2D(x, y) {
  let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return (h ^ (h >>> 16)) >>> 0;
}

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

export function diamond(cx, cy, w, h) {
  const hw = w / 2;
  const hh = h / 2;
  return {
    top: [cx, cy - hh],
    right: [cx + hw, cy],
    bottom: [cx, cy + hh],
    left: [cx - hw, cy]
  };
}

export function poly(ctx, color, points) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i += 1) {
    ctx.lineTo(points[i][0], points[i][1]);
  }
  ctx.closePath();
  ctx.fill();
}

export function px(ctx, x, y, color, w = 1, h = 1) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), w, h);
}

export function linePx(ctx, x0, y0, x1, y1, color, size = 1) {
  const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    px(ctx, x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, color, size, size);
  }
}

export function mixPoint(a, b, t) {
  return [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t
  ];
}

export function faceTools(ctx, topLeft, topRight, bottomRight, bottomLeft) {
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

export function wallRunFace(ctx, cx, cy, opts = {}) {
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

export const ORIENTS = ['se', 'sw', 'nw', 'ne'];

export function normalizeOrient(orient) {
  return ORIENTS.includes(orient) ? orient : 'se';
}

export function isoFrame(cx, cy, orient) {
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

export function orientedBox(ctx, frame, lenA, lenB, height, colors, lift = 0) {
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

export function footprintExtent(lenA, lenB) {
  return {
    w: (lenA + lenB) * (TILE_WIDTH / 2),
    h: (lenA + lenB) * (TILE_HEIGHT / 2)
  };
}

export function drawPropLeg(ctx, p, height, color, outline = PALETTE.outline) {
  px(ctx, p[0] - 1, p[1] - height, outline, 4, height + 1);
  px(ctx, p[0], p[1] - height, color, 2, height);
}

export function drawIsoDiamond(ctx, cx, cy, w, h, color) {
  const d = diamond(cx, cy, w, h);
  poly(ctx, color, [d.top, d.right, d.bottom, d.left]);
}

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

export function drawShadowBlob(ctx, cx, cy, w, h) {
  ctx.save();
  ctx.globalAlpha = 0.32;
  drawIsoDiamond(ctx, cx, cy, w, h, PALETTE.void);
  ctx.globalAlpha = 0.18;
  drawIsoDiamond(ctx, cx, cy, w + 4, h + 2, PALETTE.void);
  ctx.restore();
}

export function drawDaylightCastShadow(ctx, cx, cy, opts = {}) {
  const alpha = Math.max(0, Math.min(1, opts.alpha ?? 0.16));
  if (alpha <= 0) return;

  const w = Math.max(6, Math.round(opts.width ?? 48));
  const h = Math.max(3, Math.round(opts.height ?? 16));
  const offsetX = Math.round(opts.offsetX ?? 12);
  const offsetY = Math.round(opts.offsetY ?? 6);
  const x = Math.round(cx + offsetX);
  const y = Math.round(cy + offsetY);

  ctx.save();
  ctx.globalAlpha = alpha * 0.6;
  drawIsoDiamond(ctx, x, y, w + 6, h + 2, PALETTE.void);
  ctx.globalAlpha = alpha;
  drawIsoDiamond(ctx, x + 1, y, w, h, PALETTE.void);
  ctx.globalAlpha = alpha * 0.38;
  drawIsoDiamond(ctx, x + 3, y + 1, Math.max(6, w - 12), Math.max(3, h - 5), PALETTE.void);
  ctx.restore();
}

export function drawPixelShadow(ctx, cx, cy, w, h) {
  drawShadowBlob(ctx, cx, cy, w, h);
}

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
  const rng = rngFrom(hash2D(seed + 17, seed * 7 + 29));
  for (let i = 0; i < 7; i += 1) {
    const x = cx - 24 + Math.floor(rng() * 49);
    const y = cy - 11 + Math.floor(rng() * 22);
    px(ctx, x, y, i % 3 === 0 ? PALETTE.rustMid : PALETTE.rustDark, 2, 1);
  }
}

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
  const rng = rngFrom(hash2D(seed + 211, seed * 5 + 37));
  ctx.save();
  ctx.globalAlpha = 0.48;
  drawIsoDiamond(ctx, cx, cy, 54, 24, PALETTE.void);
  ctx.globalAlpha = 0.28;
  drawIsoDiamond(ctx, cx + 2, cy + 1, 38, 17, PALETTE.rustDark);
  ctx.globalAlpha = 0.16;
  drawIsoDiamond(ctx, cx - 4, cy - 1, 24, 11, PALETTE.stoneDark);
  ctx.restore();
  for (let i = 0; i < 8; i += 1) {
    const x = cx - 22 + Math.floor(rng() * 45);
    const y = cy - 8 + Math.floor(rng() * 17);
    linePx(ctx, x, y, x + Math.floor((rng() - 0.5) * 13), y + Math.floor((rng() - 0.5) * 5), i % 3 === 0 ? PALETTE.rustDark : PALETTE.void, 1);
  }
  if ((seed & 1) === 0) px(ctx, cx + 9, cy - 3, PALETTE.ember, 2, 1);
  drawNoisePixels(ctx, cx - 23, cy - 10, 46, 20, [PALETTE.stoneDark, PALETTE.rustDark, PALETTE.void], 0.1, seed);
}

export function drawWaxStain(ctx, cx, cy, seed) {
  const rng = rngFrom(hash2D(seed + 223, seed * 7 + 41));
  ctx.save();
  ctx.globalAlpha = 0.72;
  drawIsoDiamond(ctx, cx - 2, cy, 38, 16, PALETTE.hostBone);
  ctx.globalAlpha = 0.42;
  drawIsoDiamond(ctx, cx + 9, cy + 3, 26, 11, PALETTE.stoneDust);
  ctx.globalAlpha = 0.3;
  drawIsoDiamond(ctx, cx - 13, cy + 3, 20, 8, PALETTE.clothTan);
  ctx.restore();
  for (let i = 0; i < 6; i += 1) {
    const x = cx - 16 + Math.floor(rng() * 33);
    const y = cy - 5 + Math.floor(rng() * 12);
    px(ctx, x, y, PALETTE.outline, 4, 1);
    px(ctx, x, y - 1, i % 2 ? PALETTE.hostBone : PALETTE.stoneDust, 3, 1);
  }
  for (const [dx, h] of [[-8, 6], [1, 9], [8, 5]]) {
    px(ctx, cx + dx - 2, cy - h - 2, PALETTE.outline, 5, h + 3);
    px(ctx, cx + dx - 1, cy - h - 1, PALETTE.hostBone, 3, h + 1);
    px(ctx, cx + dx, cy - h - 4, PALETTE.stoneDark, 1, 3);
  }
  drawNoisePixels(ctx, cx - 17, cy - 7, 34, 15, [PALETTE.hostBone, PALETTE.stoneDust, PALETTE.clothTan], 0.06, seed);
}

export function drawBloodStainDecal(ctx, cx, cy, seed) {
  const rng = rngFrom(hash2D(seed + 229, seed * 11 + 43));
  ctx.save();
  ctx.globalAlpha = 0.78;
  drawIsoDiamond(ctx, cx - 1, cy + 1, 50, 22, PALETTE.rustDark);
  ctx.globalAlpha = 0.58;
  drawIsoDiamond(ctx, cx + 3, cy, 32, 14, PALETTE.hostRed);
  ctx.globalAlpha = 0.42;
  drawIsoDiamond(ctx, cx - 10, cy + 3, 24, 10, PALETTE.hostBlack);
  ctx.restore();
  for (let i = 0; i < 10; i += 1) {
    const x = cx - 24 + Math.floor(rng() * 49);
    const y = cy - 9 + Math.floor(rng() * 19);
    px(ctx, x, y, i % 3 === 0 ? PALETTE.hostRed : PALETTE.rustDark, 1 + Math.floor(rng() * 3), 1);
  }
  if ((seed & 1) === 0) linePx(ctx, cx - 3, cy + 2, cx + 25, cy + 9, PALETTE.rustDark, 2);
}

export function drawRoadDustDecal(ctx, cx, cy, seed) {
  const rng = rngFrom(hash2D(seed + 233, seed * 13 + 47));
  ctx.save();
  ctx.globalAlpha = 0.42;
  drawIsoDiamond(ctx, cx, cy, 60, 25, PALETTE.stoneDust);
  ctx.globalAlpha = 0.2;
  drawIsoDiamond(ctx, cx - 5, cy + 1, 44, 18, PALETTE.stoneMid);
  ctx.restore();
  for (const offset of [-6, 7]) {
    linePx(ctx, cx - 26, cy + offset * 0.35, cx + 25, cy - 3 + offset * 0.35, PALETTE.stoneMid, 1);
    linePx(ctx, cx - 23, cy + 2 + offset * 0.25, cx + 21, cy - 1 + offset * 0.25, PALETTE.stoneDust, 1);
  }
  for (let i = 0; i < 7; i += 1) {
    const x = cx - 27 + Math.floor(rng() * 55);
    const y = cy - 9 + Math.floor(rng() * 18);
    const len = 8 + Math.floor(rng() * 17);
    linePx(ctx, x, y, x + len, y - 2 + Math.floor(rng() * 5), i % 2 ? PALETTE.stoneDust : PALETTE.stoneMid, 1);
  }
  drawNoisePixels(ctx, cx - 29, cy - 11, 58, 22, [PALETTE.stoneDust, PALETTE.stoneMid, PALETTE.rustDark], 0.075, seed);
}

export function drawGlassDebrisDecal(ctx, cx, cy, seed) {
  const rng = rngFrom(hash2D(seed + 239, seed * 17 + 53));
  ctx.save();
  ctx.globalAlpha = 0.2;
  drawIsoDiamond(ctx, cx, cy + 1, 50, 21, PALETTE.void);
  ctx.restore();
  for (let i = 0; i < 12; i += 1) {
    const x = cx - 24 + Math.floor(rng() * 49);
    const y = cy - 8 + Math.floor(rng() * 17);
    const w = 4 + Math.floor(rng() * 8);
    poly(ctx, PALETTE.outline, [
      [x - 1, y],
      [x + Math.floor(w * 0.45), y - 3],
      [x + w, y],
      [x + Math.floor(w * 0.35), y + 3]
    ]);
    poly(ctx, i % 2 ? PALETTE.stoneLight : PALETTE.hostBone, [
      [x, y],
      [x + Math.floor(w * 0.45), y - 2],
      [x + w - 1, y],
      [x + Math.floor(w * 0.35), y + 2]
    ]);
    if (i % 3 === 0) px(ctx, x + 1, y - 1, PALETTE.flash, 1, 1);
  }
  drawNoisePixels(ctx, cx - 24, cy - 9, 48, 18, [PALETTE.stoneDust, PALETTE.stoneDark], 0.035, seed);
}

export function drawDustDecal(ctx, cx, cy, seed) {
  const rng = rngFrom(hash2D(seed + 241, seed * 19 + 59));
  ctx.save();
  ctx.globalAlpha = 0.36;
  drawIsoDiamond(ctx, cx, cy, 52, 22, PALETTE.stoneDust);
  ctx.globalAlpha = 0.2;
  drawIsoDiamond(ctx, cx + 6, cy + 2, 32, 13, PALETTE.stoneMid);
  ctx.restore();
  for (let i = 0; i < 7; i += 1) {
    const x = cx - 21 + Math.floor(rng() * 43);
    const y = cy - 7 + Math.floor(rng() * 15);
    linePx(ctx, x, y, x + 6 + Math.floor(rng() * 11), y + Math.floor((rng() - 0.5) * 5), PALETTE.stoneDust, 1);
  }
  for (const [dx, dy, flip] of [[-10, -3, 1], [5, 3, -1]]) {
    px(ctx, cx + dx - 3, cy + dy - 2, PALETTE.stoneMid, 7, 3);
    px(ctx, cx + dx - 2, cy + dy - 1, PALETTE.stoneDust, 4, 1);
    px(ctx, cx + dx + flip * 2, cy + dy + 1, PALETTE.stoneDark, 3, 1);
  }
  drawNoisePixels(ctx, cx - 25, cy - 10, 50, 20, [PALETTE.stoneDust, PALETTE.stoneMid], 0.07, seed);
}

export function drawFloorCrackDecal(ctx, cx, cy, seed) {
  const rng = rngFrom(hash2D(seed + 251, seed * 23 + 61));
  let x = cx - 22 + Math.floor(rng() * 9);
  let y = cy - 2 + Math.floor((rng() - 0.5) * 7);
  for (let i = 0; i < 6; i += 1) {
    const nx = x + 7 + Math.floor(rng() * 8);
    const ny = y - 4 + Math.floor(rng() * 9);
    linePx(ctx, x, y, nx, ny, PALETTE.outline, 3);
    linePx(ctx, x, y, nx, ny, PALETTE.stoneDark, 1);
    if (i === 1 || i === 4) {
      const bx = Math.round((x + nx) / 2);
      const by = Math.round((y + ny) / 2);
      const branchDir = rng() < 0.5 ? -1 : 1;
      const branchX = bx + branchDir * (6 + Math.floor(rng() * 7));
      const branchY = by + Math.floor((rng() - 0.5) * 8);
      linePx(ctx, bx, by, branchX, branchY, PALETTE.outline, 2);
      linePx(ctx, bx, by, branchX - branchDir, branchY, PALETTE.stoneDark, 1);
    }
    if (i % 2 === 0) {
      px(ctx, Math.round((x + nx) / 2) - 1, Math.round((y + ny) / 2) - 1, PALETTE.stoneDust, 3, 1);
    }
    x = nx;
    y = ny;
  }
  drawRubbleCluster(ctx, cx + 9, cy + 2, seed + 29, 4);
}

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

export function drawRubbleCluster(ctx, cx, cy, seed, count = 5) {
  const rng = rngFrom(hash2D(seed + 91, seed * 7 + 3));
  for (let i = 0; i < count; i += 1) {
    const dx = Math.floor((rng() - 0.5) * (count > 6 ? 40 : 20));
    const dy = Math.floor((rng() - 0.5) * (count > 6 ? 18 : 10));
    const s = 2 + Math.floor(rng() * 3);
    const tone = rng();
    const top = tone < 0.5 ? PALETTE.stoneLight : PALETTE.stoneMid;
    px(ctx, cx + dx, cy + dy, PALETTE.stoneDark, s + 1, s + 1);
    px(ctx, cx + dx, cy + dy, top, s, s);
    if (s > 2) px(ctx, cx + dx + 1, cy + dy, PALETTE.stoneDust, Math.max(1, s - 2), 1);
  }
}

export function drawRubbleDecal(ctx, cx, cy, seed) {
  const rng = rngFrom(hash2D(seed + 257, seed * 29 + 67));
  ctx.save();
  ctx.globalAlpha = 0.2;
  drawIsoDiamond(ctx, cx, cy + 2, 55, 22, PALETTE.void);
  ctx.globalAlpha = 0.24;
  drawIsoDiamond(ctx, cx - 3, cy + 1, 43, 17, PALETTE.stoneDark);
  ctx.restore();
  for (const slab of [
    [-15, -2, 19, 9],
    [6, 3, 24, 10],
    [-2, -9, 17, 8]
  ]) {
    const dx = slab[0] + Math.floor((rng() - 0.5) * 5);
    const dy = slab[1] + Math.floor((rng() - 0.5) * 4);
    drawIsoDiamond(ctx, cx + dx, cy + dy + 1, slab[2] + 3, slab[3] + 2, PALETTE.outline);
    drawIsoDiamond(ctx, cx + dx, cy + dy, slab[2], slab[3], rng() < 0.35 ? PALETTE.stoneMid : PALETTE.stoneLight);
    px(ctx, cx + dx - 5, cy + dy - 2, PALETTE.stoneDust, 6, 1);
    px(ctx, cx + dx + 2, cy + dy + 2, PALETTE.stoneDark, 7, 1);
  }
  drawRubbleCluster(ctx, cx + 1, cy + 1, seed + 31, 9);
  drawNoisePixels(ctx, cx - 24, cy - 9, 48, 18, [PALETTE.stoneDust, PALETTE.stoneDark], 0.055, seed);
}

export function drawHostGrowth(ctx, cx, cy, seed, pulse = 0) {
  const rng = rngFrom(hash2D(seed + 41, seed * 11 + 9));
  // Ragged base mass: a wounded plate with a dark lower edge, not loose noise.
  for (let row = 0; row < 7; row += 1) {
    const w = 22 - Math.abs(row - 3) * 3 + ((seed >> row) & 1);
    const x = cx - Math.floor(w / 2) + Math.floor((rng() - 0.5) * 3);
    const y = cy - 4 + row;
    px(ctx, x - 1, y, PALETTE.outline, w + 2, 1);
    px(ctx, x, y, row < 2 ? PALETTE.hostBlack : row < 5 ? PALETTE.rustDark : PALETTE.hostBlack, w, 1);
    if (row === 2 || row === 4) px(ctx, x + 2, y, PALETTE.hostRed, Math.max(3, w - 7), 1);
  }

  // One controlled living wound in the plate.
  px(ctx, cx - 3, cy - 3, PALETTE.outline, 8, 5);
  px(ctx, cx - 2, cy - 2, PALETTE.hostRed, 6, 3);
  px(ctx, cx, cy - 2, pulse ? PALETTE.hostGlow : PALETTE.hostGold, 2, 2);
  if (pulse) px(ctx, cx + 1, cy - 3, PALETTE.flash, 1, 1);

  // Thin black-gold seams under the skin. Keep them sparse and directional.
  const veinEnds = [
    [cx - 12, cy - 7],
    [cx + 13, cy - 6],
    [cx - 10, cy + 4],
    [cx + 11, cy + 3]
  ];
  for (const [vx, vy] of veinEnds) {
    linePx(ctx, cx, cy - 1, vx, vy, PALETTE.hostBlack, 1);
    linePx(ctx, cx + (vx < cx ? -1 : 1), cy - 2, vx, vy - 1, PALETTE.hostGold, 1);
  }

  // Uneven bone thorns with dark sockets and a lit left edge.
  for (let i = 0; i < 5; i += 1) {
    const bx = cx - 10 + i * 5 + Math.floor((rng() - 0.5) * 4);
    const lean = i % 2 === 0 ? -1 : 1;
    const len = 5 + Math.floor(rng() * 7);
    linePx(ctx, bx, cy - 1, bx + lean * 2, cy - len, PALETTE.outline, 3);
    linePx(ctx, bx, cy - 2, bx + lean * 2, cy - len, i % 2 ? PALETTE.hostBone : PALETTE.stoneDust, 1);
    px(ctx, bx + lean * 2, cy - len - 1, PALETTE.hostBone, 1, 1);
  }

  // Small torn flesh tags at the lower edge.
  for (let i = 0; i < 4; i += 1) {
    const x = cx - 9 + i * 6 + Math.floor((rng() - 0.5) * 3);
    const endX = x + (i % 2 ? 4 : -3);
    const endY = cy + 7 + (i & 1);
    linePx(ctx, x, cy + 2, endX, endY, i % 2 ? PALETTE.rustDark : PALETTE.hostBlack, 1);
    px(ctx, endX, endY, PALETTE.hostGold, 1, 1);
  }
}
