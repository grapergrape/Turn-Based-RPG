// Reusable isometric pixel-art primitives.
//
// Everything in the scene that is not an actor sprite is built from these:
// floor diamonds, volumetric prism/wall blocks, contact shadows, dithered
// grime, cracks, rubble, Host growth, and the hand-built props that dress the
// ruined chapel. Randomness is always SEEDED (hash2D) so the scene is stable
// frame to frame and never shimmers.

import { PALETTE } from './palette.js';
import { TILE_WIDTH, TILE_HEIGHT } from './renderConfig.js';

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
  drawShadowBlob(ctx, cx, cy + 8, 54, 20);
  drawIsoPrism(ctx, cx, cy + 1, 48, 24, 16, {
    top: PALETTE.rustLight,
    left: PALETTE.rustMid,
    right: PALETTE.rustDark,
    outline: PALETTE.outline
  });
  px(ctx, cx - 18, cy - 15, PALETTE.stoneDark, 37, 4);
  px(ctx, cx - 14, cy - 26, PALETTE.rustDark, 29, 15);
  px(ctx, cx - 11, cy - 27, PALETTE.rustLight, 21, 3);
  px(ctx, cx + 3, cy - 13, PALETTE.void, 10, 7);
  px(ctx, cx - 2, cy - 19, PALETTE.hostGold, 5, 5);
  drawNoisePixels(ctx, cx - 18, cy - 27, 36, 20, [PALETTE.rustDark, PALETTE.stoneDark], 0.07, seed);
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
export function drawBonePile(ctx, cx, cy, seed) {
  drawShadowBlob(ctx, cx, cy + 3, 38, 15);
  const rng = rngFrom(hash2D(seed + 61, seed * 9 + 7));
  for (let i = 0; i < 9; i += 1) {
    const x0 = cx + Math.floor((rng() - 0.5) * 28);
    const y0 = cy + Math.floor((rng() - 0.5) * 9);
    const len = 6 + Math.floor(rng() * 10);
    px(ctx, x0, y0, PALETTE.outline, len + 2, 3);
    px(ctx, x0 + 1, y0, PALETTE.hostBone, len, 2);
    px(ctx, x0 + 1, y0, PALETTE.stoneDust, Math.floor(len / 2), 1);
    px(ctx, x0, y0 - 1, PALETTE.hostBone, 2, 4);
    px(ctx, x0 + len, y0 - 1, PALETTE.hostBone, 2, 4);
  }
  // A skull resting near the top of the heap.
  const sx = cx - 2;
  const sy = cy - 9;
  px(ctx, sx - 4, sy, PALETTE.outline, 10, 9);
  px(ctx, sx - 3, sy, PALETTE.hostBone, 8, 8);
  px(ctx, sx - 2, sy + 2, PALETTE.void, 2, 2);
  px(ctx, sx + 1, sy + 2, PALETTE.void, 2, 2);
  px(ctx, sx - 1, sy + 5, PALETTE.stoneDark, 4, 3);
  drawNoisePixels(ctx, cx - 20, cy - 11, 40, 22, [PALETTE.stoneDust, PALETTE.rustDark], 0.03, seed);
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

// The light source behind the cross. In the chapel it is a tall pointed-arch
// window whose tracery forms an inverted cross; in the cellar it is a cold
// barred vent. Both spill a hard mandorla of light around the figure.
function drawMartyrLight(ctx, cx, headCy, armY, cy, dim, flicker) {
  const bright = dim ? PALETTE.hostGold : PALETTE.flash;
  const warm = dim ? PALETTE.rustMid : PALETTE.hostGold;
  ctx.save();

  if (!dim) {
    const wTop = headCy - 30;   // arch apex
    const wSpring = headCy - 10; // where the straight jambs begin
    const wSill = armY + 24;    // base of the window
    const wHalf = 22;
    // Stone reveal around the opening.
    for (let y = wTop - 2; y <= wSill + 2; y += 1) {
      const t = (y - (wTop - 2)) / (wSpring - (wTop - 2));
      const half = y < wSpring ? Math.round(Math.min(1, t) * (wHalf + 2)) : wHalf + 2;
      px(ctx, cx - half, y, PALETTE.stoneDark, half * 2, 1);
    }
    // Bright panes (the source). Kept a touch dimmer than before so the figure
    // in front reads as a monster, not a pure black cut-out.
    for (let y = wTop; y <= wSill; y += 1) {
      const t = (y - wTop) / (wSpring - wTop);
      const half = y < wSpring ? Math.max(0, Math.round(t * wHalf)) : wHalf;
      if (half <= 0) continue;
      ctx.globalAlpha = 0.64 + (flicker ? 0.05 : 0);
      ctx.fillStyle = bright;
      ctx.fillRect(cx - half, y, half * 2, 1);
      ctx.globalAlpha = 0.42;
      ctx.fillStyle = warm;
      px(ctx, cx - half, y, 2, 1);
      px(ctx, cx + half - 1, y, 2, 1);
    }
    ctx.globalAlpha = 1;
    // Inverted-cross tracery: long upright, crossbar set LOW.
    px(ctx, cx - 1, wTop + 2, PALETTE.stoneDark, 2, wSill - wTop - 2);
    px(ctx, cx - wHalf, wSpring + 5, PALETTE.stoneDark, wHalf * 2, 1);
    const hy = wSpring + Math.round((wSill - wSpring) * 0.66);
    px(ctx, cx - wHalf, hy, PALETTE.stoneDark, wHalf * 2, 2);
  } else {
    const gw = 20, gh = 16, gx = cx - gw / 2, gy = headCy - 4;
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = bright;
    ctx.fillRect(gx, gy, gw, gh);
    ctx.globalAlpha = 1;
    for (let i = 0; i < 4; i += 1) px(ctx, gx + 3 + i * 5, gy, PALETTE.stoneDark, 1, gh);
    px(ctx, gx, gy, PALETTE.stoneDark, gw, 1);
    px(ctx, gx, gy + gh - 1, PALETTE.stoneDark, gw, 1);
  }

  // Light spilling forward + a mandorla so the figure reads as a silhouette.
  const glowY = headCy + 16;
  for (let i = 0; i < 9; i += 1) {
    const t = i / 8;
    const halfW = 8 + Math.round(t * 42);
    ctx.globalAlpha = (dim ? 0.04 : 0.085) * (1 - t * 0.7) + (flicker ? 0.01 : 0);
    ctx.fillStyle = warm;
    ctx.fillRect(cx - halfW, glowY + i * 9, halfW * 2, 9);
  }
  for (let row = -10; row <= 10; row += 1) {
    const halfW = 26 - Math.round(Math.abs(row) * 2.2);
    if (halfW <= 0) continue;
    ctx.globalAlpha = (dim ? 0.06 : 0.13) * (1 - Math.abs(row) / 12) + (flicker ? 0.012 : 0);
    ctx.fillStyle = warm;
    ctx.fillRect(cx - halfW, glowY + row * 5, halfW * 2, 5);
  }
  ctx.restore();
}

// A Host-opened victim hammered to a chapel cross, backlit by a window so the
// carved body reads as a black silhouette ringed in light: thorn-crown driven
// into the skull, ribs splayed open like chapel doors over a glowing wound,
// hands nailed with too many fingers. The Choir cuts sacrament from him while
// he still half-lives. opts: { pulse, flicker, killed, dim }
export function drawCrossMartyr(ctx, cx, cy, seed, opts = {}) {
  const pulse = opts.pulse ?? 0;
  const flicker = opts.flicker ?? 0;
  const killed = Boolean(opts.killed);
  const dim = Boolean(opts.dim);

  const flesh = PALETTE.hostBlack;
  const rim = dim ? PALETTE.hostGold : PALETTE.hostBone;
  const topY = cy - 112;
  const armY = cy - 76; // crossbeam
  const headCy = armY - 14; // head centre, above the beam
  const footY = cy - 4;
  const beamHalf = 33;

  drawShadowBlob(ctx, cx, cy + 3, 46, 18);

  if (!killed) drawMartyrLight(ctx, cx, headCy, armY, cy, dim, flicker);

  // --- Cross timber (in front of the window) ------------------------------
  px(ctx, cx - 5, topY, PALETTE.outline, 11, footY - topY + 2);
  px(ctx, cx - 4, topY, PALETTE.woodDark, 9, footY - topY);
  px(ctx, cx - 4, topY, PALETTE.woodMid, 3, footY - topY);
  px(ctx, cx - beamHalf, armY - 3, PALETTE.outline, beamHalf * 2 + 2, 9);
  px(ctx, cx - beamHalf + 1, armY - 2, PALETTE.woodDark, beamHalf * 2 - 1, 7);
  px(ctx, cx - beamHalf + 1, armY - 2, PALETTE.woodMid, beamHalf * 2 - 1, 2);
  px(ctx, cx - beamHalf + 7, armY + 6, PALETTE.hostRed, 9, 1);
  px(ctx, cx + beamHalf - 16, armY + 6, PALETTE.hostRed, 7, 1);

  // --- Arms wrenched out along the beam, bone-rimmed, too many fingers -----
  const leftArmY = armY + 2 + (pulse ? 1 : 0);
  const rightArmY = armY;
  px(ctx, cx - beamHalf + 2, leftArmY, flesh, beamHalf - 3, 5); // left arm
  px(ctx, cx + 2, rightArmY + 1, flesh, beamHalf - 3, 5); // right arm
  px(ctx, cx - beamHalf + 2, leftArmY, rim, beamHalf - 3, 1); // lit bone edge
  px(ctx, cx + 2, rightArmY + 1, rim, beamHalf - 3, 1);
  px(ctx, cx - beamHalf + 4, leftArmY + 3, PALETTE.hostGold, beamHalf - 7, 1); // gold vein
  px(ctx, cx + 4, rightArmY + 3, PALETTE.hostGold, beamHalf - 7, 1);
  for (const s of [-1, 1]) {
    const hx = cx + s * (beamHalf - 1);
    const wristY = s < 0 ? leftArmY : rightArmY + 1;
    px(ctx, hx - 1, wristY - 2, PALETTE.stoneLight, 3, 4); // nail spike
    px(ctx, hx - 1, wristY + 1, PALETTE.hostRed, 3, 2); // wrist wound
    for (let f = 0; f < 6; f += 1) px(ctx, hx + s * (f - 2), wristY + 5, rim, 1, 3 + ((f + s) & 1));
  }

  // --- Big broken bone halo (clearly a Host icon, not a man) --------------
  if (!killed) {
    for (let n = 0; n < 22; n += 1) {
      if (n === 6 || n === 7 || n === 15 || n === 16) continue;
      const a = Math.PI * (0.02 + n * 0.046);
      const hx = cx + Math.round(Math.cos(a) * 19);
      const hy = headCy - 1 - Math.round(Math.sin(a) * 16);
      px(ctx, hx, hy, rim, n % 3 === 0 ? 2 : 1, 1);
      if (n === 2 || n === 11 || n === 19) px(ctx, hx, hy + 1, PALETTE.hostGold, 1, 2);
    }
    px(ctx, cx - 24, headCy + 5, PALETTE.hostBone, 2, 1);
    px(ctx, cx - 27, headCy + 8, PALETTE.hostGold, 2, 1);
    px(ctx, cx - 30, headCy + 11, PALETTE.hostBone, 2, 1);
  }

  // --- Torso: a big ribcage splayed open over a glowing black-gold wound ---
  const tTop = armY + 5;
  const tBot = armY + 47;
  for (let row = 0; row <= tBot - tTop; row += 1) {
    const w = 20 - Math.floor(row / 5);
    px(ctx, cx - Math.floor(w / 2), tTop + row, flesh, w, 1);
  }
  px(ctx, cx - 10, tTop, rim, 1, 30); // lit bone edges, both sides
  px(ctx, cx + 9, tTop, PALETTE.hostGold, 1, 28);
  px(ctx, cx - 13, tTop + 7, rim, 1, 19);
  px(ctx, cx + 12, tTop + 12, PALETTE.hostGold, 1, 16);
  px(ctx, cx - 5, tTop + 4, PALETTE.void, 10, 18); // open chest cavity
  for (let r = 0; r < 7; r += 1) {
    const ry = tTop + 3 + r * 3;
    const sp = 5 + r;
    px(ctx, cx - 5 - sp, ry + (r > 3 ? 1 : 0), rim, sp, 1); // left rib door
    px(ctx, cx + 5, ry - (r % 2), rim, sp, 1); // right rib door
    px(ctx, cx - 5 - sp, ry, PALETTE.hostGold, 1, 1);
    px(ctx, cx + 4 + sp, ry, PALETTE.hostGold, 1, 1);
  }
  if (!killed) {
    const glow = pulse ? PALETTE.hostGlow : PALETTE.hostGold;
    px(ctx, cx - 3, tTop + 7, PALETTE.hostRed, 7, 11);
    px(ctx, cx - 2, tTop + 9, glow, 5, 7);
    px(ctx, cx - 1, tTop + 11, PALETTE.flash, 3, 3);
  } else {
    px(ctx, cx - 3, tTop + 9, PALETTE.rustDark, 7, 6);
  }
  // a second screaming mouth low in the ribs, bone teeth
  const my = tBot - 6;
  px(ctx, cx - 5, my, PALETTE.void, 11, 4);
  for (let t = 0; t < 6; t += 1) px(ctx, cx - 5 + t * 2, my, rim, 1, 4);
  // black-gold veins + hanging carved sacrament + exposed bone
  px(ctx, cx - 9, tTop + 22, PALETTE.hostGold, 1, 12);
  px(ctx, cx + 8, tTop + 20, PALETTE.hostGold, 1, 14);
  px(ctx, cx + 9, tTop + 12, PALETTE.hostRed, 2, 10); // hanging strip
  px(ctx, cx - 10, tTop + 16, PALETTE.hostRed, 2, 8);
  px(ctx, cx + 6, tTop + 26, PALETTE.hostBone, 2, 5);

  // --- Nailed legs to the foot-spike --------------------------------------
  const lTop = tBot + 1;
  for (let row = 0; row < footY - lTop; row += 1) {
    const w = 11 - Math.floor(row / 5);
    px(ctx, cx - Math.floor(w / 2), lTop + row, flesh, w, 1);
  }
  px(ctx, cx - 5, lTop, rim, 1, footY - lTop); // lit edge
  px(ctx, cx + 1, lTop + 2, PALETTE.hostGold, 1, 14); // vein
  px(ctx, cx - 2, footY - 2, PALETTE.stoneLight, 4, 2); // foot spike
  px(ctx, cx - 2, footY - 1, PALETTE.hostRed, 3, 2);

  // --- Monstrous Host head: a bright bone skull, hollow eyes, maw, horns ---
  const hy = headCy - 7 + (killed ? 4 : 0);
  const skullLean = killed ? 2 : pulse;
  px(ctx, cx - 7 + skullLean, hy - 1, PALETTE.outline, 14, 15);
  px(ctx, cx - 6 + skullLean, hy, PALETTE.hostBone, 11, 13);
  px(ctx, cx - 6 + skullLean, hy, PALETTE.hostGold, 10, 1); // cracked crown
  px(ctx, cx - 2 + skullLean, hy + 1, PALETTE.hostBlack, 1, 5); // brow split
  px(ctx, cx - 5 + skullLean, hy + 4, PALETTE.void, 3, 4); // eye sockets
  px(ctx, cx + 2 + skullLean, hy + 5, PALETTE.void, 3, 2);
  px(ctx, cx - 8 + skullLean, hy - 5, PALETTE.hostBone, 2, 5); // long horn
  px(ctx, cx + 5 + skullLean, hy - 3, PALETTE.hostBone, 2, 3); // broken horn
  if (!killed) {
    px(ctx, cx - 4 + skullLean, hy + 5, PALETTE.hostGold, 1, 1);
    px(ctx, cx + 3 + skullLean, hy + 6, PALETTE.hostGold, 1, 1);
    px(ctx, cx + skullLean, hy, pulse ? PALETTE.flash : PALETTE.hostGlow, 1, 1); // third eye
    px(ctx, cx - 6 + skullLean, hy + 9, PALETTE.void, 12, 4); // screaming maw
    for (let t = 0; t < 7; t += 1) px(ctx, cx - 5 + skullLean + t * 2, hy + 9, PALETTE.hostBone, 1, 4);
    px(ctx, cx - 4 + skullLean, hy + 7, PALETTE.hostGold, 1, 7); // black-gold weeping
    px(ctx, cx + 4 + skullLean, hy + 8, PALETTE.hostGold, 1, 5);
  } else {
    px(ctx, cx - 3 + skullLean, hy + 10, PALETTE.hostBlack, 7, 1);
  }

  // --- Blood running to the sacrament bowl at the foot --------------------
  px(ctx, cx, lTop + 16, PALETTE.hostRed, 1, 10);
  drawIsoDiamond(ctx, cx + 2, cy + 1, 18, 9, PALETTE.rustDark);
  px(ctx, cx - 3, cy, PALETTE.hostRed, 10, 2);
}

// The Choir's "larder": the next victim, bound upright to a post and kept
// alive while the first is eaten. NOT crucified and NOT yet opened -- early
// Host only (sick pallor, a few black-gold veins, a bud of bone), gagged and
// roped. opts: { pulse, flicker, killed, dim }
export function drawBoundVictim(ctx, cx, cy, seed, opts = {}) {
  const pulse = opts.pulse ?? 0;
  const flicker = opts.flicker ?? 0;
  const killed = Boolean(opts.killed);
  const dim = Boolean(opts.dim);
  const topY = cy - 56;
  const footY = cy - 4;

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

  // The post + a short bar near the top to lash the wrists to.
  px(ctx, cx - 2, topY, PALETTE.outline, 6, footY - topY + 2);
  px(ctx, cx - 1, topY, PALETTE.woodDark, 4, footY - topY);
  px(ctx, cx - 1, topY, PALETTE.woodMid, 2, footY - topY);
  px(ctx, cx - 10, topY + 6, PALETTE.outline, 21, 4);
  px(ctx, cx - 9, topY + 7, PALETTE.woodDark, 19, 2);
  px(ctx, cx - 9, topY + 7, PALETTE.woodMid, 19, 1);

  // Wrists wrenched up to the bar and roped.
  px(ctx, cx - 9, topY + 9, PALETTE.skinDark, 4, 2);
  px(ctx, cx + 6, topY + 9, PALETTE.skinDark, 4, 2);
  px(ctx, cx - 11, topY + 7, PALETTE.clothTan, 4, 2);
  px(ctx, cx + 8, topY + 7, PALETTE.clothTan, 4, 2);

  // Head, lolling forward, gagged.
  const hy = topY + 11 + (killed ? 3 : 0);
  px(ctx, cx - 4, hy, PALETTE.outline, 9, 9);
  px(ctx, cx - 3, hy, PALETTE.skinMid, 7, 8);
  px(ctx, cx - 3, hy, PALETTE.skinDark, 7, 2);
  if (!killed) {
    px(ctx, cx - 2, hy + 3, PALETTE.void, 1, 1); // hollow eyes
    px(ctx, cx + 1, hy + 3, PALETTE.void, 1, 1);
    px(ctx, cx - 2, hy + 5, PALETTE.clothDark, 5, 2); // a gag
    px(ctx, cx, hy, PALETTE.hostBone, 2, 1); // a first bud of bone at the temple
  } else {
    px(ctx, cx - 3, hy + 6, PALETTE.skinDark, 7, 1);
  }
  px(ctx, cx - 3, hy + 8, PALETTE.clothTan, 7, 1); // a roped collar to the post

  // Torso, sagging in a torn shift -- whole, NOT opened.
  const tTop = hy + 9;
  const tBot = footY - 12;
  for (let row = 0; row <= tBot - tTop; row += 1) {
    const w = 11 - Math.floor(row / 6);
    px(ctx, cx - Math.floor(w / 2), tTop + row, PALETTE.clothDark, w, 1);
  }
  px(ctx, cx - 5, tTop, PALETTE.skinDark, 1, tBot - tTop); // a sliver of pale skin
  // Early black-gold creeping up, and a small forming wound (a bud, not a cavity).
  px(ctx, cx - 1, tTop + 1, PALETTE.hostGold, 1, 8);
  px(ctx, cx + 2, tTop + 4, PALETTE.hostGold, 1, 6);
  if (!killed) px(ctx, cx, tTop + 5, pulse ? PALETTE.hostGlow : PALETTE.hostGold, 1, 2);
  px(ctx, cx - 5, tBot - 2, PALETTE.clothTan, 11, 1); // rope around the waist to the post

  // Legs, slack and bound.
  const lTop = tBot + 1;
  for (let row = 0; row < footY - lTop; row += 1) {
    const w = 6 - Math.floor(row / 5);
    px(ctx, cx - Math.floor(w / 2), lTop + row, PALETTE.clothDark, w, 1);
  }
  px(ctx, cx - 4, footY - 2, PALETTE.stoneDark, 9, 2); // bound ankles
  // Old blood at the base from being held a while -- but no carving gore.
  drawNoisePixels(ctx, cx - 8, cy - 3, 16, 8, [PALETTE.hostRed, PALETTE.rustDark], 0.05, seed);
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
