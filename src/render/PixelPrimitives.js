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

// One ruined stone floor cell. `variant` (0..5) picks a tone/detail mix.
// Seams are deliberately faint so the floor never reads as a chessboard.
export function drawRuinedStoneFloorCell(ctx, cx, cy, variant, seed) {
  // Low-contrast dirty concrete: mostly mid-tone with subtle lighter/darker
  // patches, so the floor reads as one worn surface, not a chessboard.
  const tones = [
    PALETTE.stoneMid,
    PALETTE.stoneMid,
    PALETTE.stoneDust,
    PALETTE.stoneMid,
    PALETTE.stoneLight,
    PALETTE.stoneMid
  ];
  drawIsoDiamond(ctx, cx, cy, TILE_WIDTH, TILE_HEIGHT, tones[variant % tones.length]);

  // Very subtle top-left lighting band.
  ctx.save();
  ctx.globalAlpha = 0.07;
  const d = diamond(cx, cy, TILE_WIDTH, TILE_HEIGHT);
  poly(ctx, PALETTE.stoneDust, [d.top, d.right, [cx, cy], d.left]);
  ctx.restore();

  // Faint broken seam along two edges.
  ctx.save();
  ctx.globalAlpha = 0.12;
  ctx.strokeStyle = PALETTE.stoneDark;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(d.top[0], d.top[1] + 1);
  ctx.lineTo(d.right[0] - 1, d.right[1]);
  ctx.lineTo(d.bottom[0], d.bottom[1] - 1);
  ctx.stroke();
  ctx.restore();

  // Scattered dirt/grit across the (large) tile.
  drawNoisePixels(ctx, cx - 30, cy - 12, 60, 24, [PALETTE.stoneDark, PALETTE.stoneDust], 0.03, seed);
  if (variant === 3) {
    drawCracks(ctx, cx, cy, seed, 2);
  }
  if (variant === 4) {
    ctx.save();
    ctx.globalAlpha = 0.4;
    drawIsoDiamond(ctx, cx + 14, cy + 4, 16, 9, PALETTE.stoneDark);
    ctx.restore();
  }
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
  const wood = {
    top: PALETTE.woodLight,
    left: PALETTE.woodMid,
    right: PALETTE.woodDark,
    outline: PALETTE.outline
  };
  drawShadowBlob(ctx, cx, cy + 7, 64, 22);

  // Legs under the seat.
  px(ctx, cx - 22, cy + 2, PALETTE.woodDark, 3, 11);
  px(ctx, cx + 18, cy + 2, PALETTE.woodDark, 3, 11);

  // Long, low seat plank.
  drawIsoPrism(ctx, cx, cy - 4, 60, 26, 7, wood);
  // Plank grain on the seat top.
  px(ctx, cx - 22, cy - 16, PALETTE.woodMid, 44, 2);
  px(ctx, cx - 16, cy - 12, PALETTE.woodDark, 32, 1);

  // Tall thin backrest along the rear long edge.
  drawIsoPrism(ctx, cx - 16, cy - 10, 46, 11, 24, wood);

  // Broken end: missing chunk + splinters.
  ctx.save();
  ctx.globalAlpha = 0.85;
  drawIsoDiamond(ctx, cx + 23, cy - 5, 16, 10, PALETTE.void);
  ctx.restore();
  const rng = rngFrom(hash2D(seed + 13, seed * 9 + 1));
  for (let i = 0; i < 7; i += 1) {
    px(ctx, cx + 14 + Math.floor(rng() * 18), cy + Math.floor((rng() - 0.5) * 12), PALETTE.woodDark);
  }
}

export function drawRustedReliquary(ctx, cx, cy, seed) {
  drawShadowBlob(ctx, cx, cy + 4, 38, 16);
  drawIsoPrism(ctx, cx, cy, 34, 18, 26, {
    top: PALETTE.rustLight,
    left: PALETTE.rustMid,
    right: PALETTE.rustDark,
    outline: PALETTE.outline
  });
  // Brass lock plate + rivets on the front face.
  px(ctx, cx - 2, cy - 14, PALETTE.hostGold, 5, 7);
  px(ctx, cx, cy - 12, PALETTE.stoneDark, 2, 2);
  px(ctx, cx - 13, cy - 17, PALETTE.rustLight, 2, 2);
  px(ctx, cx + 11, cy - 17, PALETTE.rustLight, 2, 2);
  // Rust streaks.
  drawNoisePixels(ctx, cx - 15, cy - 22, 30, 22, [PALETTE.rustDark, PALETTE.stoneDark], 0.05, seed);
}

export function drawFieldSatchel(ctx, cx, cy, seed) {
  drawShadowBlob(ctx, cx, cy + 2, 28, 12);
  drawIsoPrism(ctx, cx, cy, 26, 14, 13, {
    top: PALETTE.clothTan,
    left: PALETTE.skinDark,
    right: PALETTE.clothDark,
    outline: PALETTE.outline
  });
  // Strap arc + buckle.
  ctx.strokeStyle = PALETTE.clothDark;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - 11, cy - 7);
  ctx.quadraticCurveTo(cx, cy - 19, cx + 11, cy - 7);
  ctx.stroke();
  px(ctx, cx - 1, cy - 9, PALETTE.rustLight, 2, 2);
  // Dusty highlight.
  px(ctx, cx - 8, cy - 11, PALETTE.stoneDust, 2, 2);
}

export function drawCorpseSilhouette(ctx, cx, cy, seed) {
  drawShadowBlob(ctx, cx, cy + 2, 46, 18);
  // Body lying flat.
  ctx.save();
  ctx.globalAlpha = 0.95;
  drawIsoDiamond(ctx, cx, cy, 44, 20, PALETTE.clothDark);
  ctx.restore();
  // Torn coat highlight + pale hand.
  px(ctx, cx - 11, cy - 2, PALETTE.clothTan, 7, 3);
  px(ctx, cx + 15, cy + 1, PALETTE.skinMid, 4, 3);
  // Dried blood.
  drawNoisePixels(ctx, cx + 7, cy - 6, 18, 14, [PALETTE.hostRed, PALETTE.rustDark], 0.06, seed);
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
  drawShadowBlob(ctx, cx, cy + 2, 22, 9);
  const rng = rngFrom(hash2D(seed + 29, seed * 6 + 2));
  for (let i = 0; i < 4; i += 1) {
    const dx = Math.floor((rng() - 0.5) * 20);
    const hgt = 8 + Math.floor(rng() * 8);
    // Wax stub.
    px(ctx, cx + dx, cy - hgt, PALETTE.hostBone, 3, hgt);
    px(ctx, cx + dx, cy - hgt, PALETTE.stoneDust, 1, hgt);
    // Most candles are dead; one or two gutter weakly.
    if (i === 1 || i === 2) {
      const fy = cy - hgt - 2 - (flicker & 1);
      px(ctx, cx + dx, fy, flicker ? PALETTE.ember : PALETTE.hostGold, 2, 2);
      if (flicker) px(ctx, cx + dx, fy - 2, PALETTE.flash);
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
  drawShadowBlob(ctx, cx, cy + 5, 40, 17);
  drawIsoPrism(ctx, cx, cy, 38, 22, 24, {
    top: PALETTE.woodLight,
    left: PALETTE.woodMid,
    right: PALETTE.woodDark,
    outline: PALETTE.outline
  });

  // Iron bands, chipped labels, and rivets.
  px(ctx, cx - 18, cy - 15, PALETTE.rustDark, 36, 2);
  px(ctx, cx - 5, cy - 28, PALETTE.rustDark, 3, 24);
  px(ctx, cx + 7, cy - 28, PALETTE.rustDark, 3, 24);
  px(ctx, cx - 13, cy - 18, PALETTE.clothTan, 8, 4);
  px(ctx, cx - 12, cy - 18, PALETTE.stoneDust, 5, 1);
  for (const dx of [-15, -4, 8, 16]) px(ctx, cx + dx, cy - 17, PALETTE.rustLight, 1, 1);
  drawNoisePixels(ctx, cx - 18, cy - 27, 36, 23, [PALETTE.rustDark, PALETTE.stoneDark], 0.04, seed);
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
