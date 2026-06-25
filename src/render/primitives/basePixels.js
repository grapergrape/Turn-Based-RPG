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
    const dx = Math.floor((rng() - 0.5) * 16);
    const dy = Math.floor((rng() - 0.5) * 8);
    const s = 1 + Math.floor(rng() * 2);
    const tone = rng();
    const top = tone < 0.5 ? PALETTE.stoneLight : PALETTE.stoneMid;
    px(ctx, cx + dx, cy + dy, PALETTE.stoneDark, s + 1, s + 1);
    px(ctx, cx + dx, cy + dy, top, s, s);
  }
}

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
