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

// Floor and wall primitives.

export const FLOOR_STYLE_IDS = [
  'stone',
  'ash-dirt',
  'ash-road',
  'road-shoulder',
  'wheat-field',
  'furrow-field',
  'forest-floor',
  'graveyard-earth',
  'farm-plank',
  'packed-earth',
  'mud-track',
  'ash-gravel',
  'worn-canvas',
  'cave-stone',
  'cave-river'
];

function drawFloorEdgeWear(ctx, cx, cy, seed, light = PALETTE.stoneDust, dark = PALETTE.stoneDark) {
  const d = diamond(cx, cy, TILE_WIDTH - 6, TILE_HEIGHT - 3);
  ctx.save();
  ctx.globalAlpha = 0.32;
  if ((seed & 1) === 0) {
    linePx(ctx, d.left[0] + 2, d.left[1], d.top[0], d.top[1] + 2, light, 1);
    linePx(ctx, d.bottom[0], d.bottom[1] - 2, d.right[0] - 2, d.right[1], dark, 1);
  } else {
    linePx(ctx, d.top[0], d.top[1] + 2, d.right[0] - 2, d.right[1], light, 1);
    linePx(ctx, d.left[0] + 2, d.left[1], d.bottom[0], d.bottom[1] - 2, dark, 1);
  }
  ctx.restore();
}

function drawAshBoneFlecks(ctx, cx, cy, seed, count = 7) {
  const rng = rngFrom(hash2D(seed + 31, seed * 7 + 17));
  for (let i = 0; i < count; i += 1) {
    const x = cx - 24 + Math.floor(rng() * 49);
    const y = cy - 9 + Math.floor(rng() * 18);
    const color = i % 4 === 0 ? PALETTE.hostBone : i % 3 === 0 ? PALETTE.stoneDust : PALETTE.rustDark;
    px(ctx, x, y, PALETTE.outline, 2 + (i & 1), 1);
    px(ctx, x, y - 1, color, 1 + (i & 1), 1);
  }
}

function drawPairedFootprints(ctx, cx, cy, seed, color = PALETTE.stoneDark) {
  const rng = rngFrom(hash2D(seed + 47, seed * 11 + 23));
  const baseX = cx - 18 + Math.floor(rng() * 12);
  const baseY = cy - 4 + Math.floor(rng() * 7);
  for (let step = 0; step < 3; step += 1) {
    const x = baseX + step * 13;
    const y = baseY - step * 3;
    px(ctx, x, y, PALETTE.outline, 5, 2);
    px(ctx, x + 1, y, color, 3, 1);
    px(ctx, x + 5, y + 3, PALETTE.outline, 5, 2);
    px(ctx, x + 6, y + 3, color, 3, 1);
  }
}

function drawRootThreads(ctx, cx, cy, seed) {
  const rng = rngFrom(hash2D(seed + 53, seed * 13 + 29));
  for (let i = 0; i < 4; i += 1) {
    const startX = cx - 29 + Math.floor(rng() * 14);
    const startY = cy - 2 + Math.floor((rng() - 0.5) * 9);
    const midX = startX + 18 + Math.floor(rng() * 12);
    const midY = startY - 5 + Math.floor(rng() * 11);
    const endX = midX + 12 + Math.floor(rng() * 14);
    const endY = midY - 4 + Math.floor(rng() * 9);
    linePx(ctx, startX, startY, midX, midY, PALETTE.outline, 2);
    linePx(ctx, midX, midY, endX, endY, PALETTE.outline, 2);
    linePx(ctx, startX, startY, midX, midY, i % 2 ? PALETTE.woodDark : PALETTE.hostBlack, 1);
    linePx(ctx, midX, midY, endX, endY, i % 2 ? PALETTE.rustDark : PALETTE.woodDark, 1);
    if (i % 2 === 0) linePx(ctx, startX + 1, startY - 1, midX + 1, midY - 1, PALETTE.stoneMid, 1);
    if (i === 1 || i === 3) linePx(ctx, midX, midY, midX - 6, midY + 5, PALETTE.hostBlack, 1);
  }
}

function drawGroundScratchMarks(ctx, cx, cy, seed, color = PALETTE.stoneDust, count = 3) {
  const rng = rngFrom(hash2D(seed + 67, seed * 17 + 31));
  for (let i = 0; i < count; i += 1) {
    const x = cx - 20 + Math.floor(rng() * 41);
    const y = cy - 7 + Math.floor(rng() * 15);
    const len = 5 + Math.floor(rng() * 8);
    linePx(ctx, x, y, x + len, y - 2 + Math.floor(rng() * 4), PALETTE.outline, 1);
    linePx(ctx, x + 1, y - 1, x + len - 1, y - 2 + Math.floor(rng() * 3), color, 1);
    if (i % 2 === 0) {
      linePx(ctx, x + 2, y - 4, x + 2, y + 3, PALETTE.outline, 1);
      linePx(ctx, x + 3, y - 3, x + 3, y + 2, color, 1);
    }
  }
}

function drawFloorChipRun(ctx, cx, cy, seed, light = PALETTE.stoneDust, dark = PALETTE.stoneDark) {
  const rng = rngFrom(hash2D(seed + 89, seed * 19 + 43));
  const d = diamond(cx, cy, TILE_WIDTH - 12, TILE_HEIGHT - 6);
  for (let i = 0; i < 3; i += 1) {
    const t = 0.18 + i * 0.29 + (rng() - 0.5) * 0.05;
    const edge = (seed + i) & 3;
    const p = edge === 0
      ? mixPoint(d.left, d.top, t)
      : edge === 1
        ? mixPoint(d.top, d.right, t)
        : edge === 2
          ? mixPoint(d.left, d.bottom, t)
          : mixPoint(d.bottom, d.right, t);
    px(ctx, p[0] - 1, p[1] - 1, PALETTE.outline, 4, 3);
    px(ctx, p[0], p[1] - 1, light, 2, 1);
    px(ctx, p[0] + 1, p[1], dark, 2, 1);
  }
}

function drawFloorTallyScratches(ctx, cx, cy, seed, color = PALETTE.stoneDust) {
  const rng = rngFrom(hash2D(seed + 101, seed * 23 + 5));
  const x = cx - 16 + Math.floor(rng() * 31);
  const y = cy - 8 + Math.floor(rng() * 15);
  for (let i = 0; i < 4; i += 1) {
    linePx(ctx, x + i * 3, y + 2, x + i * 3 + 2, y - 5, PALETTE.outline, 1);
    linePx(ctx, x + i * 3 + 1, y + 1, x + i * 3 + 2, y - 4, color, 1);
  }
  linePx(ctx, x - 1, y - 1, x + 13, y - 4, PALETTE.outline, 1);
  linePx(ctx, x, y - 2, x + 12, y - 5, color, 1);
}

function drawFloorStoryMarks(ctx, cx, cy, gx, gy, style) {
  const seed = hash2D(gx + 701, gy + 719);
  const rng = rngFrom(seed);
  const d = diamond(cx, cy, TILE_WIDTH - 10, TILE_HEIGHT - 5);
  // Chips on every tile read as wallpaper; less than half the tiles carry
  // them so the quiet ground lets the marked tiles speak.
  if (!['ash-dirt', 'wheat-field', 'furrow-field', 'mud-track', 'worn-canvas', 'cave-river'].includes(style) && (seed % 20) < 9) {
    drawFloorChipRun(ctx, cx, cy, seed, PALETTE.stoneDust, PALETTE.stoneDark);
  }

  switch (style) {
    case 'stone': {
      // A crack is damage, not texture. Only a quarter of tiles carry one
      // (decorrelated from the chip run above so marks spread out instead of
      // clumping on the same tiles), and most are hairline - only the odd flag
      // has split wide enough to catch light in the break.
      if (seed % 4 !== 0) break;
      const wide = seed % 3 === 0;
      const a = mixPoint(d.left, d.bottom, 0.3 + rng() * 0.22);
      const b = mixPoint(d.top, d.right, 0.54 + rng() * 0.2);
      linePx(ctx, a[0], a[1], b[0], b[1], PALETTE.outline, wide ? 2 : 1);
      if (wide) linePx(ctx, a[0] + 1, a[1] - 1, b[0] + 1, b[1] - 1, PALETTE.stoneDust, 1);
      break;
    }
    case 'ash-dirt': {
      if ((seed % 20) >= 11) break;
      for (const off of [-5, 5]) {
        linePx(ctx, cx - 19, cy + off * 0.35, cx + 16, cy - 3 + off * 0.35, PALETTE.outline, 1);
        linePx(ctx, cx - 16, cy - 1 + off * 0.35, cx + 13, cy - 4 + off * 0.35, PALETTE.stoneMid, 1);
      }
      px(ctx, cx + 12, cy - 3, PALETTE.outline, 8, 2);
      px(ctx, cx + 13, cy - 4, PALETTE.hostBone, 5, 1);
      px(ctx, cx + 17, cy - 1, PALETTE.rustDark, 3, 1);
      break;
    }
    case 'ash-road': {
      for (const t of [0.28, 0.68]) {
        const a = mixPoint(d.left, d.top, t);
        const b = mixPoint(d.bottom, d.right, Math.min(0.9, t + 0.16));
        linePx(ctx, a[0], a[1] + 1, b[0], b[1] + 1, PALETTE.outline, 2);
        linePx(ctx, a[0] + 1, a[1], b[0] + 1, b[1], PALETTE.stoneDust, 1);
      }
      px(ctx, cx - 4, cy - 11, PALETTE.outline, 9, 4);
      px(ctx, cx - 3, cy - 11, PALETTE.stoneLight, 6, 2);
      px(ctx, cx - 1, cy - 10, PALETTE.rustDark, 2, 1);
      break;
    }
    case 'road-shoulder': {
      if ((seed % 20) >= 7) break; // loose stones gather in spots, not everywhere
      const a = mixPoint(d.left, d.top, 0.18);
      const b = mixPoint(d.left, d.bottom, 0.78);
      linePx(ctx, a[0], a[1], b[0], b[1], PALETTE.outline, 1);
      for (let i = 0; i < 3; i += 1) {
        const x = cx - 20 + Math.floor(rng() * 22);
        const y = cy - 8 + Math.floor(rng() * 15);
        px(ctx, x, y, PALETTE.outline, 3, 2);
        px(ctx, x + 1, y - 1, i % 2 ? PALETTE.stoneLight : PALETTE.rustDark, 1, 1);
      }
      break;
    }
    case 'wheat-field': {
      for (let i = 0; i < 4; i += 1) {
        const x = cx - 18 + i * 11 + Math.floor(rng() * 3);
        const y = cy - 2 + Math.floor(rng() * 8);
        linePx(ctx, x, y, x + 2, y - 10 - Math.floor(rng() * 3), PALETTE.outline, 1);
        linePx(ctx, x + 1, y - 1, x + 2, y - 9, i % 2 ? PALETTE.clothTan : PALETTE.woodLight, 1);
        px(ctx, x, y - 12, PALETTE.hostGold, 2, 1);
      }
      break;
    }
    case 'furrow-field': {
      for (const t of [0.2, 0.42, 0.64, 0.84]) {
        const a = mixPoint(d.left, d.bottom, t);
        const b = mixPoint(d.top, d.right, Math.min(0.92, t + 0.12));
        linePx(ctx, a[0], a[1] + 1, b[0], b[1] + 1, PALETTE.outline, 2);
        linePx(ctx, a[0] + 1, a[1], b[0] + 1, b[1], t === 0.42 ? PALETTE.rustDark : PALETTE.woodDark, 1);
      }
      px(ctx, cx + 10, cy - 5, PALETTE.outline, 8, 2);
      px(ctx, cx + 11, cy - 6, PALETTE.hostGold, 5, 1);
      break;
    }
    case 'forest-floor': {
      if ((seed % 20) >= 10) break;
      drawRootThreads(ctx, cx, cy, seed + 19);
      px(ctx, cx - 5, cy - 4, PALETTE.outline, 11, 6);
      px(ctx, cx - 4, cy - 5, PALETTE.woodDark, 8, 4);
      px(ctx, cx - 2, cy - 5, PALETTE.stoneDust, 3, 1);
      px(ctx, cx + 4, cy - 2, PALETTE.hostGold, 2, 1);
      break;
    }
    case 'graveyard-earth': {
      const topA = mixPoint(d.left, d.top, 0.34);
      const topB = mixPoint(d.top, d.right, 0.64);
      const botA = mixPoint(d.left, d.bottom, 0.36);
      const botB = mixPoint(d.bottom, d.right, 0.66);
      // Burial seams read as cold packed edges, not glowing marks: keep them
      // one step above the soil, never bone-white. Most tiles carry a seam so
      // the plot grid is implied, but a few are undisturbed.
      if (seed % 5 !== 0) {
        linePx(ctx, topA[0], topA[1], topB[0], topB[1], PALETTE.stoneDust, 1);
        linePx(ctx, botA[0], botA[1], botB[0], botB[1], PALETTE.outline, 1);
      }
      // A scratched grave-count is a specific act on a specific plot, not a
      // texture on every patch of earth.
      if (seed % 7 === 0) drawFloorTallyScratches(ctx, cx, cy, seed + 11, PALETTE.stoneDust);
      break;
    }
    case 'farm-plank': {
      for (const t of [0.16, 0.5, 0.84]) {
        const a = mixPoint(d.left, d.top, t);
        const b = mixPoint(d.bottom, d.right, t);
        px(ctx, Math.round((a[0] + b[0]) / 2) - 1, Math.round((a[1] + b[1]) / 2) - 1, PALETTE.outline, 4, 3);
        px(ctx, Math.round((a[0] + b[0]) / 2), Math.round((a[1] + b[1]) / 2) - 1, PALETTE.rustLight, 1, 1);
      }
      linePx(ctx, cx - 17, cy + 3, cx + 12, cy - 8, PALETTE.outline, 1);
      linePx(ctx, cx - 15, cy + 2, cx + 10, cy - 9, PALETTE.woodLight, 1);
      break;
    }
    case 'packed-earth': {
      if ((seed % 20) >= 5) break; // tent-stake holes are events, not wallpaper
      for (const [dx, dy] of [[-14, -3], [4, -6], [15, 1]]) {
        px(ctx, cx + dx - 2, cy + dy - 2, PALETTE.outline, 6, 5);
        px(ctx, cx + dx - 1, cy + dy - 1, PALETTE.rustDark, 4, 3);
        px(ctx, cx + dx, cy + dy - 2, PALETTE.clothTan, 2, 1);
      }
      break;
    }
    case 'mud-track': {
      if ((seed % 20) >= 8) break; // the base cell already carries the ruts
      for (const t of [0.34, 0.58]) {
        const a = mixPoint(d.left, d.top, t);
        const b = mixPoint(d.bottom, d.right, Math.min(0.9, t + 0.18));
        linePx(ctx, a[0], a[1] + 2, b[0], b[1] + 2, PALETTE.outline, 3);
        linePx(ctx, a[0] + 1, a[1] + 1, b[0] + 1, b[1] + 1, PALETTE.rustDark, 1);
        linePx(ctx, a[0] + 2, a[1], b[0] + 2, b[1], PALETTE.woodMid, 1);
      }
      break;
    }
    case 'ash-gravel': {
      // The base cell already carries the gravel; marks here are sparse events,
      // not another dozen chips. A drag where something heavy was hauled over
      // it, or a set of boot scuffs.
      if (seed % 4 !== 0) break;
      if (seed % 8 === 0) drawPairedFootprints(ctx, cx, cy, seed + 5, PALETTE.stoneDark);
      else drawGroundScratchMarks(ctx, cx, cy, seed + 13, PALETTE.stoneDust, 2);
      break;
    }
    case 'worn-canvas': {
      for (const t of [0.27, 0.7]) {
        const a = mixPoint(d.left, d.top, t);
        const b = mixPoint(d.bottom, d.right, t);
        for (let i = 0; i < 3; i += 1) {
          const x = Math.round(a[0] + (b[0] - a[0]) * (0.28 + i * 0.22));
          const y = Math.round(a[1] + (b[1] - a[1]) * (0.28 + i * 0.22));
          px(ctx, x - 1, y - 1, PALETTE.outline, 2, 2);
          px(ctx, x, y - 1, PALETTE.clothTan, 1, 1);
        }
      }
      px(ctx, cx - 10, cy - 8, PALETTE.outline, 14, 6);
      px(ctx, cx - 8, cy - 7, PALETTE.clothTan, 10, 3);
      px(ctx, cx - 6, cy - 5, PALETTE.rustDark, 7, 1);
      break;
    }
    case 'cave-stone': {
      // The base rock already fractures; marks here are the occasional damp
      // seep or dropped bone-fleck, not more cracks stacked on the same tiles.
      if (seed % 4 !== 0) break;
      if (seed % 3 === 0) {
        // A dark damp seep pooled in a low spot.
        ctx.save();
        ctx.globalAlpha = 0.16;
        drawIsoDiamond(ctx, cx + 4, cy + 2, 20, 9, PALETTE.void);
        ctx.restore();
        px(ctx, cx + 2, cy - 1, PALETTE.stoneLight, 3, 1); // one wet glint
      } else {
        drawAshBoneFlecks(ctx, cx, cy, seed + 23, 3);
      }
      break;
    }
    case 'cave-river': {
      for (const t of [0.32, 0.66]) {
        const a = mixPoint(d.left, d.top, t);
        const b = mixPoint(d.bottom, d.right, Math.min(0.9, t + 0.1));
        linePx(ctx, a[0], a[1], b[0], b[1], t < 0.5 ? PALETTE.stoneDust : PALETTE.clothBlueDark, 1);
      }
      for (const [dx, dy] of [[-23, 5], [19, -7], [7, 8]]) {
        px(ctx, cx + dx - 1, cy + dy - 1, PALETTE.outline, 5, 3);
        px(ctx, cx + dx, cy + dy - 1, PALETTE.stoneDust, 3, 1);
      }
      break;
    }
    default:
      break;
  }
}

export function drawRuinedStoneFloorCell(ctx, cx, cy, gx, gy) {
  const seed = hash2D(gx, gy);
  const r = rngFrom(seed);
  // Irregular flagstones: tiles are grouped into multi-tile slabs (2 wide,
  // 2 tall, staggered like brick courses every other row) so the floor is not a
  // rigid one-tile grid. Slab membership is a pure function of the coordinates,
  // so a tile and its neighbour always agree on whether the edge between them
  // is a joint. A whole slab shares one base tone.
  const slabId = (x, y) => hash2D(Math.floor((x + (Math.floor(y / 2) & 1)) / 2) + 1, (y >> 1) + 1);
  const my = slabId(gx, gy);
  const jNW = slabId(gx - 1, gy) !== my; // up-left edge sits on a slab boundary
  const jNE = slabId(gx, gy - 1) !== my; // up-right edge
  const jSW = slabId(gx, gy + 1) !== my; // down-left edge
  const jSE = slabId(gx + 1, gy) !== my; // down-right edge
  const zone = hash2D((gx >> 1) + 1, (gy >> 1) + 1);
  const base = my % 6 === 0 ? PALETTE.stoneLight : my % 5 === 0 ? PALETTE.stoneDark : PALETTE.stoneMid;
  drawIsoDiamond(ctx, cx, cy, TILE_WIDTH, TILE_HEIGHT, base);

  // Fitted-flag bevel, drawn ONLY on slab boundaries: the lit lip on the two
  // upper edges, shadow on the two lower edges. Interior tiles of a slab draw
  // no joint, so adjacent tiles read as one large laid stone with light raking
  // across it - bevelled masonry, not a stamped grid.
  const d = diamond(cx, cy, TILE_WIDTH, TILE_HEIGHT);
  ctx.save();
  ctx.globalAlpha = 0.14;
  if (jNW) linePx(ctx, d.left[0] + 1, d.left[1], d.top[0], d.top[1] + 1, PALETTE.stoneDust, 1);
  if (jNE) linePx(ctx, d.top[0], d.top[1] + 1, d.right[0] - 1, d.right[1], PALETTE.stoneDust, 1);
  ctx.globalAlpha = 0.24;
  if (jSW) linePx(ctx, d.left[0] + 1, d.left[1], d.bottom[0], d.bottom[1] - 1, PALETTE.outline, 1);
  if (jSE) linePx(ctx, d.bottom[0], d.bottom[1] - 1, d.right[0] - 1, d.right[1], PALETTE.outline, 1);
  ctx.restore();

  // Zone-scale bloom: whole wear-zones occasionally darken under one broad
  // soot/damp stain that spans several tiles, giving the floor big soft shapes
  // instead of only per-tile spots.
  if (zone % 7 === 0) {
    ctx.save();
    ctx.globalAlpha = 0.12;
    drawIsoDiamond(ctx, cx, cy, TILE_WIDTH + 6, TILE_HEIGHT + 3, PALETTE.void);
    ctx.restore();
  }

  // Traffic-worn polish: whole slabs on the old walking lines have been buffed
  // smooth by generations of feet and catch a soft sheen toward the light. Two
  // faint layers so it reads as polish, not paint; keyed to the slab so a whole
  // stone glows rather than a single tile - the lived-in read that separates a
  // grand floor from a merely tidy one.
  if (my % 5 === 0) {
    ctx.save();
    ctx.globalAlpha = 0.06;
    drawIsoDiamond(ctx, cx - 3, cy - 1, TILE_WIDTH - 14, TILE_HEIGHT - 7, PALETTE.stoneLight);
    ctx.globalAlpha = 0.05;
    drawIsoDiamond(ctx, cx - 5, cy - 2, TILE_WIDTH - 26, TILE_HEIGHT - 13, PALETTE.stoneDust);
    ctx.restore();
  }

  const slab = diamond(cx, cy, TILE_WIDTH - 10, TILE_HEIGHT - 5);
  if ((seed & 3) !== 1) {
    const splitA = mixPoint(slab.left, slab.top, 0.28 + r() * 0.08);
    const splitB = mixPoint(slab.bottom, slab.right, 0.64 + r() * 0.12);
    linePx(ctx, splitA[0], splitA[1], splitB[0], splitB[1], PALETTE.outline, 1);
    linePx(ctx, splitA[0] + 1, splitA[1] - 1, splitB[0] + 1, splitB[1] - 1, PALETTE.stoneDust, 1);
  }
  if (seed % 5 === 0) {
    drawRubbleCluster(ctx, cx + Math.floor((r() - 0.5) * 18), cy + Math.floor((r() - 0.5) * 8), seed + 97, 4);
  }

  // A flagstone that has broken away entirely, rare enough to read as an event:
  // a shallow recess of dirt and rubble where the chapel floor gave out. Most
  // tiles stay whole, so the missing flag draws the eye instead of becoming
  // texture. The lit upper lip and dark far rim seat it below the floor plane.
  if (seed % 13 === 4) {
    const rx = cx + Math.floor((r() - 0.5) * 8);
    const ry = cy + Math.floor((r() - 0.5) * 4);
    const rw = 22 + Math.floor(r() * 10);
    const rh = 10 + Math.floor(r() * 4);
    drawIsoDiamond(ctx, rx, ry + 1, rw + 4, rh + 3, PALETTE.outline); // broken rim in shadow
    drawIsoDiamond(ctx, rx, ry, rw, rh, PALETTE.woodDark); // exposed packed dirt below
    drawNoisePixels(ctx, rx - Math.floor(rw / 2) + 3, ry - Math.floor(rh / 2) + 1, rw - 6, rh - 2, [PALETTE.rustDark, PALETTE.stoneDark], 0.16, seed + 3);
    drawRubbleCluster(ctx, rx + Math.floor((r() - 0.5) * 8), ry + 1, seed + 41, 2);
    const lip = diamond(rx, ry, rw, rh);
    linePx(ctx, lip.left[0], lip.left[1], lip.top[0], lip.top[1], PALETTE.stoneLight, 1); // lit break edge
    linePx(ctx, lip.bottom[0], lip.bottom[1], lip.right[0], lip.right[1], PALETTE.stoneDark, 1);
  }

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

  // Sparse grit; rare hairline cracks.
  drawNoisePixels(ctx, cx - 28, cy - 11, 56, 22, [PALETTE.stoneDark, PALETTE.stoneDust], 0.022, seed);
  if (seed % 7 === 0) drawCracks(ctx, cx + Math.floor((r() - 0.5) * 10), cy, seed, 2);
}

function drawOutdoorFloorCell(ctx, cx, cy, gx, gy, colors, detail = {}) {
  const seed = hash2D(gx + 17, gy + 29);
  const r = rngFrom(seed);
  const zone = hash2D((gx >> 1) + 5, (gy >> 1) + 7);
  const base = zone % (detail.altModulo ?? 5) === 0 ? colors.alt : colors.base;
  drawIsoDiamond(ctx, cx, cy, TILE_WIDTH, TILE_HEIGHT, base);

  if (detail.patch !== false && r() < (detail.patchRate ?? 0.55)) {
    ctx.save();
    ctx.globalAlpha = detail.patchAlpha ?? 0.16;
    drawIsoDiamond(
      ctx,
      cx + Math.floor((r() - 0.5) * 16),
      cy + Math.floor((r() - 0.5) * 8),
      24 + Math.floor(r() * 20),
      10 + Math.floor(r() * 8),
      r() < 0.45 ? colors.hi : colors.lo
    );
    ctx.restore();
  }

  if (detail.rows) {
    const phase = (gx + gy + (seed & 3)) % detail.rowStep;
    if (phase === 0) {
      ctx.save();
      ctx.globalAlpha = detail.rowAlpha ?? 0.42;
      ctx.strokeStyle = colors.row ?? colors.lo;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx - 27, cy - 2);
      ctx.lineTo(cx, cy + 12);
      ctx.lineTo(cx + 27, cy - 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  if (detail.stalks) {
    for (let i = 0; i < 5; i += 1) {
      if (r() > 0.62) continue;
      const sx = cx - 18 + Math.floor(r() * 36);
      const sy = cy - 7 + Math.floor(r() * 13);
      const h = 3 + Math.floor(r() * 5);
      px(ctx, sx, sy - h, colors.stalk ?? colors.hi, 1, h);
      if (r() < 0.45) px(ctx, sx + 1, sy - h + 1, colors.lo, 1, Math.max(1, h - 2));
    }
  }

  if (detail.leafLitter) {
    drawNoisePixels(ctx, cx - 29, cy - 12, 58, 24, [colors.lo, colors.hi, PALETTE.rustDark], 0.055, seed);
  } else {
    drawNoisePixels(ctx, cx - 29, cy - 12, 58, 24, [colors.lo, colors.hi], detail.noise ?? 0.035, seed);
  }

  if (detail.ashDrifts) {
    const ashColor = detail.ashColor ?? colors.hi;
    ctx.save();
    ctx.globalAlpha = 0.58;
    for (const t of [0.2, 0.48, 0.76]) {
      linePx(ctx, cx - 25 + Math.floor(r() * 5), cy - 8 + Math.floor(t * 19), cx + 24 - Math.floor(r() * 5), cy - 10 + Math.floor(t * 19), ashColor, t === 0.48 ? 2 : 1);
    }
    ctx.restore();
    for (const t of [0.31, 0.62]) {
      linePx(ctx, cx - 27, cy - 8 + Math.round(t * 17), cx + 22, cy - 10 + Math.round(t * 17), PALETTE.outline, 1);
      linePx(ctx, cx - 23, cy - 9 + Math.round(t * 17), cx + 18, cy - 11 + Math.round(t * 17), PALETTE.stoneMid, 1);
    }
    drawAshBoneFlecks(ctx, cx, cy, seed, 9);
    drawGroundScratchMarks(ctx, cx, cy, seed + 71, PALETTE.stoneDust, 2);
  }

  if (detail.footTraffic) {
    drawPairedFootprints(ctx, cx, cy, seed, colors.lo);
  }

  if (detail.roots) {
    drawRootThreads(ctx, cx, cy, seed);
    drawAshBoneFlecks(ctx, cx, cy, seed + 17, 8);
    drawGroundScratchMarks(ctx, cx, cy, seed + 83, PALETTE.rustDark, 3);
    for (let i = 0; i < 3; i += 1) {
      const x = cx - 22 + Math.floor(r() * 45);
      const y = cy - 8 + Math.floor(r() * 17);
      px(ctx, x, y, PALETTE.outline, 5, 2);
      px(ctx, x + 1, y - 1, i % 2 ? PALETTE.woodMid : PALETTE.stoneDust, 3, 1);
    }
  }

  if (seed % (detail.crackEvery ?? 13) === 0) {
    drawCracks(ctx, cx + Math.floor((r() - 0.5) * 14), cy + Math.floor((r() - 0.5) * 5), seed, 2);
  }
  drawFloorEdgeWear(ctx, cx, cy, seed, colors.hi, colors.lo);
}

function drawRoadSurfaceCell(ctx, cx, cy, gx, gy) {
  const seed = hash2D(gx + 71, gy + 113);
  const r = rngFrom(seed);
  drawIsoDiamond(ctx, cx, cy, TILE_WIDTH, TILE_HEIGHT, PALETTE.stoneMid);

  ctx.save();
  ctx.globalAlpha = 0.055;
  drawIsoDiamond(ctx, cx, cy - 1, TILE_WIDTH - 14, TILE_HEIGHT - 7, PALETTE.stoneLight);
  ctx.globalAlpha = 0.07;
  drawIsoDiamond(ctx, cx + Math.floor((r() - 0.5) * 10), cy + Math.floor((r() - 0.5) * 5), 22, 10, r() < 0.5 ? PALETTE.stoneDust : PALETTE.stoneDark);
  ctx.restore();

  const d = diamond(cx, cy, TILE_WIDTH, TILE_HEIGHT);
  if ((gx + gy + (seed & 3)) % 3 !== 0) {
    ctx.save();
    ctx.globalAlpha = 0.16;
    ctx.strokeStyle = PALETTE.stoneDark;
    ctx.lineWidth = 1;
    ctx.beginPath();
    if ((gx + gy + (seed & 1)) % 4 === 0) {
      ctx.moveTo(d.left[0] + 10, d.left[1] + 1);
      ctx.lineTo(d.bottom[0], d.bottom[1] - 5);
      ctx.lineTo(d.right[0] - 10, d.right[1] + 1);
    } else {
      ctx.moveTo(d.top[0], d.top[1] + 5);
      ctx.lineTo(d.bottom[0], d.bottom[1] - 5);
    }
    ctx.stroke();
    ctx.restore();
  }

  if (seed % 9 === 0) drawCracks(ctx, cx + Math.floor((r() - 0.5) * 16), cy, seed, 2);
  if (r() < 0.42) {
    px(ctx, cx - 21 + Math.floor(r() * 42), cy - 4 + Math.floor(r() * 8), PALETTE.rustDark, 8 + Math.floor(r() * 12), 1);
  }
  for (const offset of [-5, 6]) {
    linePx(ctx, cx - 26, cy + offset * 0.35, cx + 25, cy - 2 + offset * 0.35, PALETTE.stoneDark, 1);
    linePx(ctx, cx - 22, cy + 1 + offset * 0.25, cx + 20, cy - 1 + offset * 0.25, PALETTE.stoneDust, 1);
  }
  drawAshBoneFlecks(ctx, cx, cy, seed + 23, 4);
  drawFloorEdgeWear(ctx, cx, cy, seed, PALETTE.stoneDust, PALETTE.stoneDark);
  drawNoisePixels(ctx, cx - 29, cy - 12, 58, 24, [PALETTE.stoneDark, PALETTE.stoneDust, PALETTE.rustDark], 0.028, seed);
}

function drawRoadShoulderCell(ctx, cx, cy, gx, gy) {
  const seed = hash2D(gx + 137, gy + 149);
  const r = rngFrom(seed);

  drawIsoDiamond(ctx, cx, cy, TILE_WIDTH, TILE_HEIGHT, PALETTE.woodDark);
  drawNoisePixels(ctx, cx - 30, cy - 12, 60, 24, [PALETTE.rustDark, PALETTE.stoneDark], 0.04, seed);

  ctx.save();
  ctx.globalAlpha = 0.9;
  drawIsoDiamond(ctx, cx, cy - 1, TILE_WIDTH - 10, TILE_HEIGHT - 5, (seed & 1) ? PALETTE.stoneDark : PALETTE.stoneMid);
  ctx.globalAlpha = 0.2;
  drawIsoDiamond(ctx, cx + Math.floor((r() - 0.5) * 9), cy - 2 + Math.floor((r() - 0.5) * 4), TILE_WIDTH - 24, TILE_HEIGHT - 12, PALETTE.stoneDust);
  ctx.restore();

  const d = diamond(cx, cy, TILE_WIDTH - 8, TILE_HEIGHT - 4);
  ctx.save();
  ctx.globalAlpha = 0.28;
  ctx.strokeStyle = PALETTE.stoneDust;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(d.left[0] + 2, d.left[1]);
  ctx.lineTo(d.top[0], d.top[1] + 1);
  ctx.lineTo(d.right[0] - 2, d.right[1]);
  ctx.stroke();
  ctx.globalAlpha = 0.42;
  ctx.strokeStyle = PALETTE.stoneDark;
  ctx.beginPath();
  ctx.moveTo(d.left[0] + 3, d.left[1] + 2);
  ctx.lineTo(d.bottom[0], d.bottom[1] - 2);
  ctx.lineTo(d.right[0] - 3, d.right[1] + 2);
  ctx.stroke();
  ctx.restore();

  if (r() < 0.45) {
    px(ctx, cx - 18 + Math.floor(r() * 36), cy - 4 + Math.floor(r() * 8), PALETTE.stoneDark, 8 + Math.floor(r() * 9), 1);
  }
  drawPairedFootprints(ctx, cx, cy, seed + 41, PALETTE.stoneDark);
  drawAshBoneFlecks(ctx, cx, cy, seed + 43, 5);
  drawFloorEdgeWear(ctx, cx, cy, seed, PALETTE.stoneDust, PALETTE.outline);
}

function drawFarmPlankFloorCell(ctx, cx, cy, gx, gy) {
  const seed = hash2D(gx + 211, gy + 223);
  const r = rngFrom(seed);
  const zone = hash2D((gx >> 1) + 17, (gy >> 1) + 23);
  const base = zone % 5 === 0 ? PALETTE.woodMid : PALETTE.woodDark;
  drawIsoDiamond(ctx, cx, cy, TILE_WIDTH, TILE_HEIGHT, base);

  const d = diamond(cx, cy, TILE_WIDTH, TILE_HEIGHT);
  const seamColor = zone % 3 === 0 ? PALETTE.outline : PALETTE.rustDark;
  for (const t of [0.24, 0.49, 0.74]) {
    const wobble = ((seed >> Math.floor(t * 11)) & 1) ? 1 : 0;
    const a = mixPoint(d.left, d.top, t);
    const b = mixPoint(d.bottom, d.right, t);
    linePx(ctx, a[0], a[1] + wobble, b[0], b[1] + wobble, seamColor, 1);
    linePx(ctx, a[0] + 1, a[1] + wobble - 1, b[0] + 1, b[1] + wobble - 1, PALETTE.woodLight, 1);
  }

  if ((seed & 3) !== 0) {
    const t = 0.26 + r() * 0.48;
    const a = mixPoint(d.left, d.bottom, t);
    const b = mixPoint(d.top, d.right, t + (r() - 0.5) * 0.1);
    linePx(ctx, a[0], a[1], b[0], b[1], PALETTE.woodMid, 1);
  }

  if (r() < 0.46) {
    drawIsoDiamond(
      ctx,
      cx + Math.floor((r() - 0.5) * 18),
      cy + Math.floor((r() - 0.5) * 8),
      14 + Math.floor(r() * 12),
      6 + Math.floor(r() * 5),
      r() < 0.45 ? PALETTE.stoneDark : PALETTE.rustDark
    );
  }

  for (let i = 0; i < 5; i += 1) {
    if (r() > 0.62) continue;
    const x = cx - 23 + Math.floor(r() * 46);
    const y = cy - 8 + Math.floor(r() * 16);
    px(ctx, x, y, r() < 0.5 ? PALETTE.woodLight : PALETTE.stoneDark, 1 + Math.floor(r() * 3), 1);
  }
  for (const t of [0.2, 0.48, 0.76]) {
    const a = mixPoint(d.left, d.bottom, t);
    const b = mixPoint(d.top, d.right, Math.min(0.9, t + 0.18));
    linePx(ctx, a[0], a[1], b[0], b[1], t === 0.48 ? PALETTE.outline : PALETTE.woodLight, 1);
  }
  for (const t of [0.18, 0.52, 0.86]) {
    const p = mixPoint(d.left, d.top, t);
    const q = mixPoint(d.bottom, d.right, t);
    const x = Math.round((p[0] + q[0]) / 2);
    const y = Math.round((p[1] + q[1]) / 2);
    px(ctx, x - 1, y - 1, PALETTE.outline, 3, 3);
    px(ctx, x, y - 1, PALETTE.rustLight, 1, 1);
    px(ctx, x + 10, y + 4, PALETTE.outline, 2, 2);
    px(ctx, x + 10, y + 3, PALETTE.woodLight, 1, 1);
  }
  drawGroundScratchMarks(ctx, cx, cy, seed + 97, PALETTE.woodLight, 2);
  drawFloorEdgeWear(ctx, cx, cy, seed, PALETTE.woodLight, PALETTE.outline);
  drawNoisePixels(ctx, cx - 29, cy - 12, 58, 24, [PALETTE.woodDark, PALETTE.stoneDark, PALETTE.rustDark], 0.026, seed);
}

function drawPackedEarthFloorCell(ctx, cx, cy, gx, gy) {
  const seed = hash2D(gx + 251, gy + 263);
  const r = rngFrom(seed);
  const zone = hash2D((gx >> 1) + 29, (gy >> 1) + 31);
  const base = zone % 4 === 0 ? PALETTE.stoneDark : PALETTE.woodDark;
  drawIsoDiamond(ctx, cx, cy, TILE_WIDTH, TILE_HEIGHT, base);

  // Zone-scale bloom: broad damp/trodden-dark patches spanning several tiles,
  // for the same atmospheric depth as the chapel stone floor.
  if (zone % 6 === 0) {
    ctx.save();
    ctx.globalAlpha = 0.13;
    drawIsoDiamond(ctx, cx, cy, TILE_WIDTH + 6, TILE_HEIGHT + 3, PALETTE.void);
    ctx.restore();
  }

  if (r() < 0.62) {
    drawIsoDiamond(
      ctx,
      cx + Math.floor((r() - 0.5) * 18),
      cy + Math.floor((r() - 0.5) * 8),
      20 + Math.floor(r() * 18),
      9 + Math.floor(r() * 7),
      r() < 0.5 ? PALETTE.rustDark : PALETTE.stoneMid
    );
  }

  // Marks are events on a fraction of tiles, not stamped on every one, so the
  // packed earth reads as quiet trodden ground with the odd trace on it rather
  // than a scribbled mess. Each trace fires on a decorrelated subset so they
  // spread across the floor instead of clumping.
  if (seed % 3 === 0) drawPairedFootprints(ctx, cx, cy, seed + 13, PALETTE.woodMid);
  if (seed % 4 === 1) {
    const d = diamond(cx, cy, TILE_WIDTH - 12, TILE_HEIGHT - 6);
    for (const t of [0.3, 0.62]) {
      const a = mixPoint(d.left, d.bottom, t);
      const b = mixPoint(d.top, d.right, Math.min(0.9, t + 0.16));
      linePx(ctx, a[0], a[1], b[0], b[1], PALETTE.outline, 1);
      linePx(ctx, a[0] + 1, a[1] - 1, b[0] + 1, b[1] - 1, PALETTE.woodMid, 1);
    }
  }
  if (seed % 5 === 2) {
    for (let i = 0; i < 3; i += 1) {
      const x = cx - 16 + Math.floor(r() * 33);
      const y = cy - 6 + Math.floor(r() * 13);
      px(ctx, x - 1, y - 1, PALETTE.outline, 4, 3);
      px(ctx, x, y, i % 2 ? PALETTE.rustDark : PALETTE.stoneMid, 2, 2);
    }
  }
  if (seed % 6 === 3) drawAshBoneFlecks(ctx, cx, cy, seed + 19, 4);
  drawFloorEdgeWear(ctx, cx, cy, seed, PALETTE.stoneMid, PALETTE.woodDark);

  drawNoisePixels(ctx, cx - 29, cy - 12, 58, 24, [PALETTE.rustDark, PALETTE.stoneDark, PALETTE.woodMid], 0.04, seed);
  if (seed % 17 === 0) drawCracks(ctx, cx + Math.floor((r() - 0.5) * 14), cy + Math.floor((r() - 0.5) * 5), seed, 2);
}

function drawMudTrackFloorCell(ctx, cx, cy, gx, gy) {
  const seed = hash2D(gx + 421, gy + 431);
  const r = rngFrom(seed);
  const zone = hash2D((gx >> 1) + 53, (gy >> 1) + 59);
  const base = zone % 3 === 0 ? PALETTE.woodDark : PALETTE.stoneDark;
  drawIsoDiamond(ctx, cx, cy, TILE_WIDTH, TILE_HEIGHT, base);

  ctx.save();
  ctx.globalAlpha = 0.22;
  drawIsoDiamond(
    ctx,
    cx + Math.floor((r() - 0.5) * 12),
    cy + Math.floor((r() - 0.5) * 6),
    44 + Math.floor(r() * 10),
    18 + Math.floor(r() * 5),
    PALETTE.rustDark
  );
  ctx.globalAlpha = 0.12;
  drawIsoDiamond(
    ctx,
    cx + Math.floor((r() - 0.5) * 16),
    cy - 1 + Math.floor((r() - 0.5) * 6),
    28 + Math.floor(r() * 12),
    12 + Math.floor(r() * 5),
    PALETTE.stoneMid
  );
  ctx.restore();

  const d = diamond(cx, cy, TILE_WIDTH - 10, TILE_HEIGHT - 5);
  // The dark rut stays continuous tile to tile; the pale wet glint on its lip
  // only catches on some tiles, or the whole field turns to scratch noise.
  for (const t of [0.3, 0.56]) {
    const wobble = Math.floor(r() * 3) - 1;
    const a = mixPoint(d.left, d.top, t);
    const b = mixPoint(d.bottom, d.right, Math.min(0.86, t + 0.18));
    linePx(ctx, a[0], a[1] + wobble, b[0], b[1] + wobble, PALETTE.outline, 1);
    if ((seed + Math.round(t * 10)) % 3 === 0) {
      linePx(ctx, a[0] + 1, a[1] + wobble - 1, b[0] + 1, b[1] + wobble - 1, PALETTE.woodMid, 1);
    }
  }

  for (let i = 0; i < 5; i += 1) {
    if (r() > 0.68) continue;
    const x = cx - 20 + Math.floor(r() * 40);
    const y = cy - 7 + Math.floor(r() * 15);
    px(ctx, x, y, PALETTE.outline, 3, 1);
    px(ctx, x + 4, y + 2, PALETTE.rustDark, 3, 1);
  }

  drawNoisePixels(ctx, cx - 29, cy - 12, 58, 24, [PALETTE.rustDark, PALETTE.woodMid, PALETTE.stoneMid], 0.04, seed);
  if (seed % 19 === 0) drawCracks(ctx, cx + Math.floor((r() - 0.5) * 12), cy + Math.floor((r() - 0.5) * 5), seed, 2);
}

function drawAshGravelFloorCell(ctx, cx, cy, gx, gy) {
  const seed = hash2D(gx + 439, gy + 443);
  const r = rngFrom(seed);
  const zone = hash2D((gx >> 1) + 61, (gy >> 1) + 67);
  const base = zone % 4 === 0 ? PALETTE.stoneDark : PALETTE.stoneMid;
  drawIsoDiamond(ctx, cx, cy, TILE_WIDTH, TILE_HEIGHT, base);

  ctx.save();
  ctx.globalAlpha = 0.08;
  drawIsoDiamond(
    ctx,
    cx + Math.floor((r() - 0.5) * 14),
    cy + Math.floor((r() - 0.5) * 7),
    36 + Math.floor(r() * 14),
    15 + Math.floor(r() * 6),
    PALETTE.stoneLight
  );
  ctx.globalAlpha = 0.1;
  drawIsoDiamond(
    ctx,
    cx + Math.floor((r() - 0.5) * 18),
    cy + 2 + Math.floor((r() - 0.5) * 7),
    20 + Math.floor(r() * 16),
    9 + Math.floor(r() * 5),
    PALETTE.rustDark
  );
  ctx.restore();

  for (let i = 0; i < 9; i += 1) {
    if (r() > 0.76) continue;
    const x = cx - 24 + Math.floor(r() * 48);
    const y = cy - 9 + Math.floor(r() * 18);
    const s = 1 + Math.floor(r() * 2);
    px(ctx, x, y, PALETTE.outline, s + 1, s + 1);
    px(ctx, x, y, r() < 0.58 ? PALETTE.stoneDust : PALETTE.stoneLight, s, s);
  }

  if ((seed & 3) === 0) {
    const d = diamond(cx, cy, TILE_WIDTH - 12, TILE_HEIGHT - 6);
    const a = mixPoint(d.left, d.bottom, 0.18 + r() * 0.18);
    const b = mixPoint(d.top, d.right, 0.58 + r() * 0.26);
    linePx(ctx, a[0], a[1], b[0], b[1], PALETTE.stoneDust, 1);
  }

  drawNoisePixels(ctx, cx - 29, cy - 12, 58, 24, [PALETTE.stoneDark, PALETTE.stoneDust, PALETTE.rustDark], 0.05, seed);
}

function drawWornCanvasFloorCell(ctx, cx, cy, gx, gy) {
  const seed = hash2D(gx + 457, gy + 461);
  const r = rngFrom(seed);
  const zone = hash2D((gx >> 1) + 71, (gy >> 1) + 73);
  const base = zone % 5 === 0 ? PALETTE.woodMid : zone % 3 === 0 ? PALETTE.woodDark : PALETTE.clothDark;
  drawIsoDiamond(ctx, cx, cy, TILE_WIDTH, TILE_HEIGHT, base);

  const panel = diamond(cx, cy, TILE_WIDTH - 8, TILE_HEIGHT - 4);
  const inner = diamond(cx, cy, TILE_WIDTH - 18, TILE_HEIGHT - 9);
  const lit = [
    mixPoint(panel.left, panel.top, 0.08),
    mixPoint(panel.top, panel.right, 0.18),
    mixPoint(inner.top, inner.right, 0.2),
    mixPoint(inner.left, inner.top, 0.16)
  ];
  const shade = [
    mixPoint(inner.left, inner.bottom, 0.2),
    mixPoint(inner.bottom, inner.right, 0.18),
    mixPoint(panel.bottom, panel.right, 0.18),
    mixPoint(panel.left, panel.bottom, 0.12)
  ];
  poly(ctx, PALETTE.woodLight, lit);
  poly(ctx, PALETTE.rustDark, shade);

  const d = diamond(cx, cy, TILE_WIDTH - 8, TILE_HEIGHT - 4);
  for (const t of [0.2, 0.4, 0.6, 0.8]) {
    const a = mixPoint(d.left, d.top, t);
    const b = mixPoint(d.bottom, d.right, t);
    const color = t === 0.4 || t === 0.8 ? PALETTE.stoneDust : PALETTE.woodDark;
    linePx(ctx, a[0], a[1], b[0], b[1], color, 1);
    if ((seed + Math.floor(t * 100)) % 3 === 0) {
      linePx(ctx, a[0] + 1, a[1], b[0] + 1, b[1], PALETTE.outline, 1);
    }
  }
  for (const t of [0.28, 0.58]) {
    const a = mixPoint(d.left, d.bottom, t);
    const b = mixPoint(d.top, d.right, Math.min(0.9, t + 0.18));
    linePx(ctx, a[0], a[1], b[0], b[1], t < 0.5 ? PALETTE.woodMid : PALETTE.rustDark, 1);
  }

  for (const t of [0.24, 0.5, 0.76]) {
    for (let i = 0; i < 3; i += 1) {
      const a = mixPoint(d.left, d.top, Math.max(0.08, t - 0.025 + i * 0.025));
      const b = mixPoint(d.bottom, d.right, Math.max(0.08, t - 0.02 + i * 0.025));
      const sx = Math.round((a[0] + b[0]) / 2) - 1;
      const sy = Math.round((a[1] + b[1]) / 2) - 1;
      px(ctx, sx, sy, i === 1 ? PALETTE.hostBone : PALETTE.outline, 2, 1);
    }
  }

  for (const t of [0.13, 0.87]) {
    const a = mixPoint(d.left, d.top, t);
    const b = mixPoint(d.bottom, d.right, t);
    linePx(ctx, a[0], a[1], b[0], b[1], PALETTE.outline, 2);
    linePx(ctx, a[0] + 1, a[1], b[0] + 1, b[1], PALETTE.clothTan, 1);
  }
  for (const t of [0.31, 0.69]) {
    const p = mixPoint(d.left, d.bottom, t);
    px(ctx, p[0] - 2, p[1] - 1, PALETTE.outline, 5, 3);
    px(ctx, p[0] - 1, p[1] - 1, PALETTE.hostBone, 3, 1);
  }

  for (let i = 0; i < 7; i += 1) {
    const x = cx - 22 + Math.floor(r() * 44);
    const y = cy - 8 + Math.floor(r() * 16);
    const w = 3 + Math.floor(r() * 8);
    const color = r() < 0.5 ? PALETTE.clothTan : r() < 0.78 ? PALETTE.rustDark : PALETTE.stoneDust;
    px(ctx, x, y, PALETTE.outline, w + 1, 1);
    px(ctx, x + 1, y, color, Math.max(1, w - 1), 1);
  }

  if ((seed % 5) === 0) {
    const a = mixPoint(d.left, d.bottom, 0.2 + r() * 0.2);
    const b = mixPoint(d.top, d.right, 0.55 + r() * 0.22);
    linePx(ctx, a[0], a[1], b[0], b[1], PALETTE.outline, 2);
    linePx(ctx, a[0] + 1, a[1] - 1, b[0] + 1, b[1] - 1, PALETTE.clothTan, 1);
  }

  drawNoisePixels(ctx, cx - 28, cy - 11, 56, 22, [PALETTE.woodDark, PALETTE.rustDark, PALETTE.stoneDust, PALETTE.clothTan], 0.052, seed);
}

function drawCaveStoneFloorCell(ctx, cx, cy, gx, gy) {
  const seed = hash2D(gx + 331, gy + 347);
  const r = rngFrom(seed);
  const zone = hash2D((gx >> 1) + 43, (gy >> 1) + 47);
  const base = zone % 4 === 0 ? PALETTE.stoneMid : PALETTE.stoneDark;
  drawIsoDiamond(ctx, cx, cy, TILE_WIDTH, TILE_HEIGHT, base);

  // Zone-scale damp bloom: whole patches of the cave floor darken under one
  // broad wet shadow spanning several tiles, matching the atmospheric depth of
  // the chapel stone floor instead of only per-tile spots.
  if (zone % 6 === 0) {
    ctx.save();
    ctx.globalAlpha = 0.14;
    drawIsoDiamond(ctx, cx, cy, TILE_WIDTH + 6, TILE_HEIGHT + 3, PALETTE.void);
    ctx.restore();
  }

  if (r() < 0.7) {
    drawIsoDiamond(
      ctx,
      cx + Math.floor((r() - 0.5) * 18),
      cy + Math.floor((r() - 0.5) * 8),
      18 + Math.floor(r() * 22),
      8 + Math.floor(r() * 8),
      r() < 0.45 ? PALETTE.stoneLight : PALETTE.stoneDark
    );
  }

  const d = diamond(cx, cy, TILE_WIDTH - 8, TILE_HEIGHT - 4);
  for (const t of [0.18, 0.48, 0.76]) {
    if (((seed + Math.floor(t * 100)) % 3) === 0) continue;
    const a = mixPoint(d.left, d.bottom, t);
    const b = mixPoint(d.top, d.right, Math.max(0.12, Math.min(0.88, t + (r() - 0.5) * 0.18)));
    linePx(ctx, a[0], a[1], b[0], b[1], r() < 0.55 ? PALETTE.outline : PALETTE.stoneDust, 1);
  }

  drawNoisePixels(ctx, cx - 29, cy - 12, 58, 24, [PALETTE.outline, PALETTE.stoneDust, PALETTE.rustDark], 0.038, seed);
  if (seed % 9 === 0) drawCracks(ctx, cx + Math.floor((r() - 0.5) * 14), cy + Math.floor((r() - 0.5) * 5), seed, 3);
}

function drawCaveRiverFloorCell(ctx, cx, cy, gx, gy) {
  const seed = hash2D(gx + 353, gy + 359);
  const r = rngFrom(seed);
  drawIsoDiamond(ctx, cx, cy, TILE_WIDTH, TILE_HEIGHT, PALETTE.outline);
  drawIsoDiamond(ctx, cx, cy, TILE_WIDTH - 4, TILE_HEIGHT - 2, PALETTE.clothBlueDark);
  drawIsoDiamond(ctx, cx + 1, cy - 1, TILE_WIDTH - 18, TILE_HEIGHT - 9, PALETTE.stoneDark);
  drawIsoDiamond(ctx, cx - 1, cy, TILE_WIDTH - 25, TILE_HEIGHT - 12, PALETTE.clothBlue);

  // Water in a lightless cave: near-black blue with a few dim current lines.
  // Bright banding makes the river shout over every prop standing in it.
  const d = diamond(cx, cy, TILE_WIDTH - 8, TILE_HEIGHT - 4);
  for (let i = 0; i < 4; i += 1) {
    const t = (i + 1) / 5;
    const wobble = Math.floor(r() * 5) - 2;
    const a = mixPoint(d.left, d.top, Math.max(0.08, t - 0.1));
    const b = mixPoint(d.bottom, d.right, Math.min(0.92, t + 0.1));
    const color = i % 3 === 0 ? PALETTE.stoneDust : PALETTE.clothBlue;
    linePx(ctx, a[0] + wobble, a[1] + 1, b[0] + wobble, b[1] - 1, color, 1);
  }

  for (let i = 0; i < 6; i += 1) {
    const x = cx - 25 + Math.floor(r() * 51);
    const y = cy - 10 + Math.floor(r() * 20);
    const color = r() < 0.25 ? PALETTE.hostBone : PALETTE.stoneDust;
    px(ctx, x, y, color, 1 + Math.floor(r() * 2), 1);
  }

  if ((gx + gy) % 2 === 0) {
    linePx(ctx, cx - 29, cy + 4, cx - 12, cy + 12, PALETTE.void, 1);
    linePx(ctx, cx + 12, cy - 12, cx + 29, cy - 4, PALETTE.stoneLight, 1);
  }
}

function drawGraveyardEarthCell(ctx, cx, cy, gx, gy) {
  const seed = hash2D(gx + 281, gy + 307);
  const r = rngFrom(seed);
  const zone = hash2D((gx >> 1) + 37, (gy >> 1) + 41);
  const base = zone % 5 === 0 ? PALETTE.stoneMid : PALETTE.stoneDark;
  drawIsoDiamond(ctx, cx, cy, TILE_WIDTH, TILE_HEIGHT, base);

  ctx.save();
  ctx.globalAlpha = 0.12;
  drawIsoDiamond(
    ctx,
    cx + Math.floor((r() - 0.5) * 14),
    cy + Math.floor((r() - 0.5) * 7),
    26 + Math.floor(r() * 18),
    11 + Math.floor(r() * 7),
    r() < 0.48 ? PALETTE.stoneDust : PALETTE.rustDark
  );
  ctx.globalAlpha = 0.05;
  drawIsoDiamond(
    ctx,
    cx + Math.floor((r() - 0.5) * 18),
    cy + Math.floor((r() - 0.5) * 8),
    18 + Math.floor(r() * 14),
    8 + Math.floor(r() * 5),
    PALETTE.hostBone
  );
  ctx.restore();

  // Faint rectangular burial seams, broken enough to avoid a stamped grid.
  if ((gx + gy + (seed & 3)) % 4 === 0) {
    const d = diamond(cx, cy, TILE_WIDTH - 12, TILE_HEIGHT - 6);
    const topA = mixPoint(d.left, d.top, 0.34);
    const topB = mixPoint(d.top, d.right, 0.66);
    const botA = mixPoint(d.left, d.bottom, 0.36);
    const botB = mixPoint(d.bottom, d.right, 0.64);
    ctx.save();
    ctx.globalAlpha = 0.36;
    linePx(ctx, topA[0], topA[1], topB[0], topB[1], PALETTE.stoneDust, 1);
    linePx(ctx, botA[0], botA[1], botB[0], botB[1], PALETTE.stoneDark, 1);
    if (seed % 8 === 0) linePx(ctx, topA[0] + 2, topA[1] + 2, botA[0] + 2, botA[1] - 1, PALETTE.rustDark, 1);
    ctx.restore();
  }

  if (seed % 6 === 0) {
    const x = cx - 22 + Math.floor(r() * 44);
    const y = cy - 7 + Math.floor(r() * 14);
    linePx(ctx, x, y, x + 5 + Math.floor(r() * 9), y - 2 + Math.floor(r() * 4), PALETTE.woodDark, 1);
  }

  drawNoisePixels(ctx, cx - 29, cy - 12, 58, 24, [PALETTE.stoneDark, PALETTE.stoneDust, PALETTE.rustDark], 0.03, seed);
  if (seed % 13 === 0) drawCracks(ctx, cx + Math.floor((r() - 0.5) * 14), cy + Math.floor((r() - 0.5) * 5), seed, 2);
}

export function drawStyledFloorCell(ctx, cx, cy, gx, gy, style = 'stone') {
  switch (style) {
    case 'ash-dirt':
      drawOutdoorFloorCell(ctx, cx, cy, gx, gy, {
        base: PALETTE.woodDark,
        alt: PALETTE.stoneDark,
        hi: PALETTE.stoneDust,
        lo: PALETTE.rustDark
      }, { noise: 0.04, patchAlpha: 0.2, crackEvery: 11, ashDrifts: true, ashColor: PALETTE.stoneDust });
      drawFloorStoryMarks(ctx, cx, cy, gx, gy, 'ash-dirt');
      return;
    case 'ash-road':
      drawRoadSurfaceCell(ctx, cx, cy, gx, gy);
      drawFloorStoryMarks(ctx, cx, cy, gx, gy, 'ash-road');
      return;
    case 'road-shoulder':
      drawRoadShoulderCell(ctx, cx, cy, gx, gy);
      drawFloorStoryMarks(ctx, cx, cy, gx, gy, 'road-shoulder');
      return;
    case 'wheat-field':
      // A dead field under ashfall: pale grey-straw ground, not saturated
      // gold. The only gold left is the odd Host-touched grain head drawn by
      // the story marks.
      drawOutdoorFloorCell(ctx, cx, cy, gx, gy, {
        base: PALETTE.stoneDust,
        alt: PALETTE.woodLight,
        hi: PALETTE.clothTan,
        lo: PALETTE.woodDark,
        row: PALETTE.woodDark,
        stalk: PALETTE.clothTan
      }, { noise: 0.028, rows: true, rowStep: 3, rowAlpha: 0.18, stalks: true, patchRate: 0.22, patchAlpha: 0.07, altModulo: 8, crackEvery: 23 });
      drawFloorStoryMarks(ctx, cx, cy, gx, gy, 'wheat-field');
      return;
    case 'furrow-field':
      drawOutdoorFloorCell(ctx, cx, cy, gx, gy, {
        base: PALETTE.woodMid,
        alt: PALETTE.woodDark,
        hi: PALETTE.clothTan,
        lo: PALETTE.woodDark,
        row: PALETTE.rustDark,
        stalk: PALETTE.hostGold
      }, { noise: 0.032, rows: true, rowStep: 2, rowAlpha: 0.26, stalks: true, patchRate: 0.28, patchAlpha: 0.08, crackEvery: 19 });
      drawFloorStoryMarks(ctx, cx, cy, gx, gy, 'furrow-field');
      return;
    case 'forest-floor':
      drawOutdoorFloorCell(ctx, cx, cy, gx, gy, {
        base: PALETTE.stoneDark,
        alt: PALETTE.woodDark,
        hi: PALETTE.stoneDust,
        lo: PALETTE.woodDark
      }, { noise: 0.05, patchAlpha: 0.15, leafLitter: true, roots: true, crackEvery: 15 });
      drawFloorStoryMarks(ctx, cx, cy, gx, gy, 'forest-floor');
      return;
    case 'graveyard-earth':
      drawGraveyardEarthCell(ctx, cx, cy, gx, gy);
      drawFloorStoryMarks(ctx, cx, cy, gx, gy, 'graveyard-earth');
      return;
    case 'farm-plank':
      drawFarmPlankFloorCell(ctx, cx, cy, gx, gy);
      drawFloorStoryMarks(ctx, cx, cy, gx, gy, 'farm-plank');
      return;
    case 'packed-earth':
      drawPackedEarthFloorCell(ctx, cx, cy, gx, gy);
      drawFloorStoryMarks(ctx, cx, cy, gx, gy, 'packed-earth');
      return;
    case 'mud-track':
      drawMudTrackFloorCell(ctx, cx, cy, gx, gy);
      drawFloorStoryMarks(ctx, cx, cy, gx, gy, 'mud-track');
      return;
    case 'ash-gravel':
      drawAshGravelFloorCell(ctx, cx, cy, gx, gy);
      drawFloorStoryMarks(ctx, cx, cy, gx, gy, 'ash-gravel');
      return;
    case 'worn-canvas':
      drawWornCanvasFloorCell(ctx, cx, cy, gx, gy);
      drawFloorStoryMarks(ctx, cx, cy, gx, gy, 'worn-canvas');
      return;
    case 'cave-stone':
      drawCaveStoneFloorCell(ctx, cx, cy, gx, gy);
      drawFloorStoryMarks(ctx, cx, cy, gx, gy, 'cave-stone');
      return;
    case 'cave-river':
      drawCaveRiverFloorCell(ctx, cx, cy, gx, gy);
      drawFloorStoryMarks(ctx, cx, cy, gx, gy, 'cave-river');
      return;
    case 'stone':
    default:
      drawRuinedStoneFloorCell(ctx, cx, cy, gx, gy);
      drawFloorStoryMarks(ctx, cx, cy, gx, gy, 'stone');
  }
}

const FARM_INTERIOR_WALL_STYLES = {
  farmhouse: {
    height: 52,
    top: PALETTE.woodMid,
    lit: PALETTE.clothTan,
    shade: PALETTE.woodDark,
    seam: PALETTE.woodDark,
    trim: PALETTE.woodLight,
    grime: PALETTE.rustDark
  },
  barn: {
    height: 58,
    top: PALETTE.woodDark,
    lit: PALETTE.woodMid,
    shade: PALETTE.outline,
    seam: PALETTE.outline,
    trim: PALETTE.rustMid,
    grime: PALETTE.stoneDark
  },
  shed: {
    height: 46,
    top: PALETTE.rustDark,
    lit: PALETTE.woodDark,
    shade: PALETTE.stoneDark,
    seam: PALETTE.outline,
    trim: PALETTE.rustLight,
    grime: PALETTE.rustDark
  }
};

function drawFarmWallFaceDetail(ctx, face, seed, style, variant, shaded = false) {
  const seam = shaded ? PALETTE.outline : style.seam;
  const trim = shaded ? PALETTE.woodDark : style.trim;
  const grain = shaded ? PALETTE.stoneDark : PALETTE.woodDark;
  const scar = shaded ? PALETTE.outline : PALETTE.rustDark;
  const nail = shaded ? PALETTE.void : PALETTE.rustDark;

  const nailHeads = (uValues, vValues, color = nail) => {
    for (const u of uValues) {
      for (const v of vValues) {
        const p = face.point(u, v);
        px(ctx, p[0] - 1, p[1], PALETTE.outline, 2, 1);
        px(ctx, p[0], p[1] - 1, color, 1, 1);
      }
    }
  };

  if (variant === 'farmhouse') {
    for (const u of [0.16, 0.38, 0.62, 0.84]) face.line(u, 0.04, u, 0.98, seam, 1);
    for (const v of [0.18, 0.42, 0.76]) {
      face.line(0.05, v, 0.94, v + (((seed + Math.floor(v * 100)) & 1) ? 0.02 : -0.015), v === 0.18 ? trim : grain, v === 0.76 ? 2 : 1);
    }
    for (const u of [0.15, 0.85]) {
      face.line(u, 0.05, u, 0.96, PALETTE.outline, 2);
      face.line(u + 0.015, 0.06, u + 0.015, 0.92, shaded ? PALETTE.woodDark : PALETTE.woodLight, 1);
    }
    face.line(0.07, 0.66, 0.93, 0.64, shaded ? PALETTE.outline : PALETTE.woodDark, 2);
    face.line(0.08, 0.64, 0.9, 0.62, shaded ? PALETTE.stoneDark : PALETTE.clothTan, 1);
    face.line(0.1, 0.11, 0.9, 0.11, PALETTE.hostBone, 1);
    face.line(0.1, 0.9, 0.9, 0.9, PALETTE.outline, 1);
    face.rect(0.24, 0.2, 0.36, 0.31, shaded ? PALETTE.woodDark : PALETTE.stoneDust);
    face.line(0.24, 0.2, 0.36, 0.2, shaded ? PALETTE.stoneDark : PALETTE.hostBone, 1);
    face.rect(0.68, 0.52, 0.82, 0.66, PALETTE.outline);
    face.rect(0.7, 0.54, 0.8, 0.64, shaded ? PALETTE.stoneDark : PALETTE.clothTan);
    if ((seed & 1) === 0) {
      face.rect(0.16, 0.32, 0.46, 0.61, PALETTE.outline);
      face.rect(0.18, 0.34, 0.44, 0.58, PALETTE.stoneDust);
      face.line(0.18, 0.34, 0.44, 0.34, PALETTE.clothTan, 1);
      face.line(0.2, 0.57, 0.44, 0.57, PALETTE.stoneDark, 1);
    }
    if (seed % 3 === 0) {
      face.line(0.55, 0.42, 0.82, 0.5, scar, 2);
      face.line(0.56, 0.4, 0.8, 0.49, PALETTE.woodLight, 1);
    }
    if (seed % 5 === 0) {
      face.rect(0.58, 0.24, 0.74, 0.36, PALETTE.outline);
      face.rect(0.61, 0.27, 0.71, 0.34, PALETTE.void);
      face.line(0.66, 0.27, 0.66, 0.34, PALETTE.woodDark, 1);
    }
    nailHeads([0.16, 0.38, 0.62, 0.84], [0.2, 0.78]);
    return;
  }

  if (variant === 'barn') {
    for (const u of [0.1, 0.22, 0.34, 0.46, 0.6, 0.74, 0.88]) {
      face.line(u, 0.05, u + (((seed + Math.floor(u * 100)) & 1) ? 0.02 : -0.01), 0.98, seam, 1);
    }
    for (const v of [0.28, 0.56, 0.82]) {
      face.line(0.04, v, 0.96, v, v === 0.28 ? trim : PALETTE.woodDark, 2);
    }
    face.line(0.08, 0.13, 0.92, 0.16, PALETTE.outline, 2);
    face.line(0.1, 0.12, 0.9, 0.15, PALETTE.rustMid, 1);
    face.line(0.06, 0.92, 0.96, 0.88, PALETTE.outline, 2);
    face.line(0.1, 0.23, 0.9, 0.79, PALETTE.outline, 2);
    face.line(0.12, 0.24, 0.88, 0.78, PALETTE.rustDark, 1);
    face.line(0.9, 0.23, 0.1, 0.79, PALETTE.outline, 2);
    face.line(0.88, 0.24, 0.12, 0.78, PALETTE.woodMid, 1);
    face.rect(0.18, 0.62, 0.3, 0.8, PALETTE.outline);
    face.rect(0.2, 0.64, 0.28, 0.78, shaded ? PALETTE.void : PALETTE.woodDark);
    face.rect(0.68, 0.34, 0.8, 0.48, PALETTE.outline);
    face.rect(0.7, 0.36, 0.78, 0.46, shaded ? PALETTE.stoneDark : PALETTE.rustDark);
    if ((seed & 3) === 1) {
      face.rect(0.38, 0.2, 0.62, 0.36, PALETTE.outline);
      face.rect(0.42, 0.23, 0.58, 0.33, PALETTE.void);
    }
    nailHeads([0.12, 0.46, 0.88], [0.3, 0.56, 0.82], shaded ? PALETTE.stoneDark : PALETTE.rustLight);
    return;
  }

  for (const u of [0.18, 0.35, 0.57, 0.79]) face.line(u, 0.08, u, 0.96, seam, 1);
  face.line(0.1, 0.12, 0.88, 0.1, PALETTE.outline, 2);
  face.line(0.08, 0.26, 0.9, 0.22, trim, 1);
  face.line(0.08, 0.58, 0.9, 0.62, PALETTE.outline, 1);
  face.line(0.2, 0.72, 0.86, 0.4, PALETTE.outline, 2);
  face.line(0.22, 0.7, 0.84, 0.41, PALETTE.woodDark, 1);
  face.line(0.1, 0.84, 0.88, 0.84, PALETTE.rustDark, 2);
  face.rect(0.16, 0.38, 0.3, 0.52, PALETTE.outline);
  face.rect(0.18, 0.4, 0.28, 0.5, shaded ? PALETTE.stoneDark : PALETTE.rustDark);
  face.line(0.24, 0.15, 0.68, 0.23, shaded ? PALETTE.outline : PALETTE.rustLight, 1);
  face.line(0.67, 0.78, 0.9, 0.68, PALETTE.outline, 2);
  face.line(0.68, 0.76, 0.88, 0.67, shaded ? PALETTE.stoneDark : PALETTE.woodLight, 1);
  if ((seed & 1) === 0) {
    face.rect(0.5, 0.18, 0.8, 0.36, PALETTE.outline);
    face.rect(0.52, 0.2, 0.78, 0.34, PALETTE.rustDark);
    face.line(0.52, 0.2, 0.78, 0.2, PALETTE.rustLight, 1);
    face.line(0.57, 0.21, 0.57, 0.33, PALETTE.void, 1);
  }
  nailHeads([0.18, 0.57, 0.79], [0.28, 0.58, 0.86], shaded ? PALETTE.void : PALETTE.rustLight);
}

// Weather individual blocks a shade off the base fill so a wall face reads as
// many fitted stones, not one flat plane. Painted before the course/seam lines
// so those still sit crisply on top. Kept to close tones and ~35% of blocks so
// it is a texture of age, not a checkerboard.
function drawStoneBlockTones(ctx, face, seed, shaded = false) {
  const lighter = shaded ? PALETTE.stoneMid : PALETTE.stoneLight;
  const darker = shaded ? PALETTE.outline : PALETTE.stoneDark;
  const us = [0, 0.16, 0.34, 0.51, 0.69, 0.86, 1];
  const vs = [0, 0.2, 0.38, 0.57, 0.75, 0.9, 1];
  for (let c = 0; c < us.length - 1; c += 1) {
    for (let row = 0; row < vs.length - 1; row += 1) {
      const k = (seed + c * 17 + row * 31) & 7;
      if (k >= 3) continue; // most blocks keep the base tone
      face.rect(us[c] + 0.012, vs[row] + 0.012, us[c + 1] - 0.012, vs[row + 1] - 0.012, k === 0 ? lighter : darker);
    }
  }
}

function drawBrokenStoneCourse(ctx, face, seed, shaded = false) {
  const course = shaded ? PALETTE.outline : PALETTE.stoneDark;
  const highlight = shaded ? PALETTE.stoneMid : PALETTE.stoneDust;
  const chip = shaded ? PALETTE.void : PALETTE.stoneLight;
  for (const v of [0.2, 0.38, 0.57, 0.75, 0.9]) {
    const wobble = ((seed + Math.floor(v * 100)) & 1) ? 0.025 : -0.018;
    face.line(0.03, v, 0.97, Math.max(0.05, Math.min(0.96, v + wobble)), course, 1);
    if (v === 0.2 || v === 0.57) face.line(0.05, v - 0.02, 0.9, v + wobble - 0.02, highlight, 1);
  }
  const offset = (seed & 1) ? 0.08 : 0;
  for (const u of [0.16, 0.34, 0.51, 0.69, 0.86]) {
    const top = ((Math.floor((u + offset) * 10) + seed) & 1) ? 0.18 : 0.38;
    face.line(u, top, u + (((seed + Math.floor(u * 91)) & 1) ? 0.035 : -0.025), Math.min(0.94, top + 0.28), course, 1);
  }
  if ((seed & 3) !== 2) {
    face.line(0.22, 0.28, 0.46, 0.42, PALETTE.outline, 2);
    face.line(0.23, 0.27, 0.45, 0.41, highlight, 1);
    face.line(0.63, 0.62, 0.82, 0.53, PALETTE.outline, 2);
    face.line(0.64, 0.6, 0.8, 0.52, shaded ? PALETTE.stoneDark : PALETTE.rustDark, 1);
  }
  if (seed % 5 === 0) {
    face.rect(0.12, 0.62, 0.22, 0.72, PALETTE.outline);
    face.rect(0.14, 0.64, 0.2, 0.7, chip);
  }
}

function drawStoneCapWear(ctx, cap, seed, broken = false) {
  const rng = rngFrom(hash2D(seed + 613, seed * 17 + 5));
  const edges = [
    [cap.left, cap.top],
    [cap.top, cap.right],
    [cap.left, cap.bottom],
    [cap.bottom, cap.right]
  ];
  for (let i = 0; i < (broken ? 8 : 5); i += 1) {
    const [a, b] = edges[(seed + i) & 3];
    const t = 0.12 + rng() * 0.76;
    const p = mixPoint(a, b, t);
    const w = broken ? 4 + Math.floor(rng() * 5) : 2 + Math.floor(rng() * 4);
    px(ctx, p[0] - 1, p[1] - 1, PALETTE.outline, w + 1, 3);
    px(ctx, p[0], p[1] - 2, i % 2 ? PALETTE.stoneDust : PALETTE.stoneDark, Math.max(1, w - 1), 1);
    if (broken && i % 3 === 0) px(ctx, p[0] + 1, p[1], PALETTE.void, Math.max(2, w - 2), 1);
  }

  const t0 = 0.22 + rng() * 0.16;
  const a = mixPoint(cap.left, cap.top, t0);
  const b = mixPoint(cap.bottom, cap.right, Math.min(0.9, t0 + 0.28));
  linePx(ctx, a[0], a[1], b[0], b[1], PALETTE.outline, 1);
  linePx(ctx, a[0] + 1, a[1] - 1, b[0] + 1, b[1] - 1, broken ? PALETTE.rustDark : PALETTE.stoneDust, 1);
}

function drawWallBaseScuffs(ctx, cx, cy, seed, colors = [PALETTE.stoneDark, PALETTE.rustDark]) {
  const rng = rngFrom(hash2D(seed + 641, seed * 19 + 7));
  for (let i = 0; i < 7; i += 1) {
    const x = cx - 29 + Math.floor(rng() * 58);
    const y = cy - 6 + Math.floor(rng() * 15);
    const w = 3 + Math.floor(rng() * 7);
    px(ctx, x, y, PALETTE.outline, w, 2);
    px(ctx, x + 1, y - 1, colors[i % colors.length], Math.max(1, w - 2), 1);
  }
}

export function drawFarmInteriorWallBlock(ctx, cx, cy, heightPx, seed, opts = {}) {
  const variant = FARM_INTERIOR_WALL_STYLES[opts.variant] ? opts.variant : 'shed';
  const connected = opts.connected ?? {};
  const style = FARM_INTERIOR_WALL_STYLES[variant];
  const wallH = heightPx ?? style.height;
  const base = diamond(cx, cy, TILE_WIDTH, TILE_HEIGHT);
  const cap = diamond(cx, cy - wallH, TILE_WIDTH, TILE_HEIGHT);

  drawShadowBlob(ctx, cx, cy + 2, TILE_WIDTH * 0.64, TILE_HEIGHT * 0.58);

  if (!connected.yPlus) {
    poly(ctx, style.lit, [cap.left, cap.bottom, base.bottom, base.left]);
    const face = faceTools(ctx, cap.left, cap.bottom, base.bottom, base.left);
    drawFarmWallFaceDetail(ctx, face, seed + 17, style, variant, false);
  }

  if (!connected.xPlus) {
    poly(ctx, style.shade, [cap.bottom, cap.right, base.right, base.bottom]);
    const face = faceTools(ctx, cap.bottom, cap.right, base.right, base.bottom);
    drawFarmWallFaceDetail(ctx, face, seed + 31, style, variant, true);
  }

  poly(ctx, style.top, [cap.top, cap.right, cap.bottom, cap.left]);

  linePx(ctx, cap.left[0], cap.left[1], cap.top[0], cap.top[1], style.trim, 1);
  if (!connected.xPlus) linePx(ctx, cap.top[0], cap.top[1], cap.right[0], cap.right[1], PALETTE.woodDark, 1);
  if (!connected.yPlus) linePx(ctx, cap.left[0], cap.left[1], cap.bottom[0], cap.bottom[1], PALETTE.outline, 1);
  drawStoneCapWear(ctx, cap, seed + 71, false);

  for (const t of [0.26, 0.52, 0.78]) {
    if (((seed + Math.floor(t * 100)) & 1) === 0) continue;
    const a = mixPoint(cap.left, cap.top, t);
    const b = mixPoint(cap.bottom, cap.right, t);
    linePx(ctx, a[0], a[1], b[0], b[1], variant === 'farmhouse' ? PALETTE.woodDark : PALETTE.outline, 1);
  }

  if ((seed & 3) === 0) {
    drawNoisePixels(ctx, cx - 24, cy - wallH + 12, 48, Math.max(12, wallH - 10), [style.grime, PALETTE.stoneDark], 0.018, seed);
  }
  drawWallBaseScuffs(ctx, cx, cy, seed + 83, [style.grime, PALETTE.woodDark, PALETTE.stoneDark]);
}

export function drawIsoWallBlock(ctx, cx, cy, heightPx, seed) {
  const wallH = heightPx ?? WALL_HEIGHT;
  const base = diamond(cx, cy, TILE_WIDTH, TILE_HEIGHT);
  const cap = diamond(cx, cy - wallH, TILE_WIDTH, TILE_HEIGHT);
  const rng = rngFrom(hash2D(seed + 3, seed * 5 + 7));

  drawShadowBlob(ctx, cx, cy + 2, TILE_WIDTH * 0.7, TILE_HEIGHT * 0.7);

  poly(ctx, PALETTE.outline, [
    [cap.top[0], cap.top[1] - 1],
    [cap.right[0] + 1, cap.right[1]],
    [base.right[0] + 1, base.right[1] + 1],
    [base.bottom[0], base.bottom[1] + 2],
    [base.left[0] - 1, base.left[1] + 1],
    [cap.left[0] - 1, cap.left[1]]
  ]);
  poly(ctx, PALETTE.stoneMid, [cap.left, cap.bottom, base.bottom, base.left]);
  poly(ctx, PALETTE.stoneDark, [cap.bottom, cap.right, base.right, base.bottom]);

  const leftFace = faceTools(ctx, cap.left, cap.bottom, base.bottom, base.left);
  const rightFace = faceTools(ctx, cap.bottom, cap.right, base.right, base.bottom);
  drawStoneBlockTones(ctx, leftFace, seed + 11, false);
  drawStoneBlockTones(ctx, rightFace, seed + 29, true);
  drawBrokenStoneCourse(ctx, leftFace, seed + 11, false);
  drawBrokenStoneCourse(ctx, rightFace, seed + 29, true);

  poly(ctx, PALETTE.stoneLight, [cap.top, cap.right, cap.bottom, cap.left]);
  poly(ctx, PALETTE.stoneDust, [
    mixPoint(cap.left, cap.top, 0.12),
    mixPoint(cap.top, cap.right, 0.72),
    mixPoint(cap.bottom, cap.right, 0.24),
    mixPoint(cap.left, cap.bottom, 0.8)
  ]);

  for (const t of [0.22, 0.48, 0.73]) {
    const a = mixPoint(cap.left, cap.top, t);
    const b = mixPoint(cap.bottom, cap.right, t + (((seed + Math.floor(t * 100)) & 1) ? 0.03 : -0.03));
    linePx(ctx, a[0], a[1], b[0], b[1], t === 0.48 ? PALETTE.stoneDark : PALETTE.stoneDust, 1);
  }
  for (const t of [0.28, 0.62]) {
    const a = mixPoint(cap.top, cap.right, t);
    const b = mixPoint(cap.left, cap.bottom, Math.min(0.9, t + 0.1));
    linePx(ctx, a[0], a[1], b[0], b[1], PALETTE.outline, 1);
  }
  drawStoneCapWear(ctx, cap, seed + 43, wallH < WALL_HEIGHT * 0.7);
  linePx(ctx, cap.left[0], cap.left[1], cap.top[0], cap.top[1], PALETTE.stoneDust, 1);
  linePx(ctx, cap.top[0], cap.top[1], cap.right[0], cap.right[1], PALETTE.outline, 1);
  linePx(ctx, cap.left[0], cap.left[1], cap.bottom[0], cap.bottom[1], PALETTE.outline, 2);
  linePx(ctx, cap.bottom[0], cap.bottom[1], cap.right[0], cap.right[1], PALETTE.outline, 2);

  for (let i = 0; i < 11; i += 1) {
    const fy = cy - Math.floor(rng() * Math.max(8, wallH));
    const fx = cx + Math.floor((rng() - 0.5) * TILE_WIDTH * 0.72);
    const w = 1 + Math.floor(rng() * 4);
    px(ctx, fx, fy, rng() < 0.54 ? PALETTE.stoneDark : PALETTE.outline, w, 1);
    if (rng() < 0.55) px(ctx, fx + 1, fy - 1, PALETTE.stoneDust, Math.max(1, w - 1), 1);
  }
  if (wallH < WALL_HEIGHT * 0.7) {
    poly(ctx, PALETTE.outline, [
      mixPoint(cap.left, cap.top, 0.08),
      mixPoint(cap.left, cap.top, 0.3),
      mixPoint(cap.left, cap.bottom, 0.3),
      mixPoint(cap.left, cap.bottom, 0.1)
    ]);
    poly(ctx, PALETTE.stoneDark, [
      mixPoint(cap.top, cap.right, 0.62),
      mixPoint(cap.top, cap.right, 0.86),
      mixPoint(cap.bottom, cap.right, 0.78),
      mixPoint(cap.bottom, cap.right, 0.56)
    ]);
    for (const [ox, oy] of [[-24, -2], [-15, 3], [12, 2], [22, -1]]) {
      drawRubbleCluster(ctx, cx + ox, cy + oy, seed + ox * 13 + oy, 3);
    }
    linePx(ctx, cap.left[0] + 4, cap.left[1] + 2, cap.bottom[0] - 3, cap.bottom[1] - 1, PALETTE.rustDark, 1);
  } else if ((seed & 3) === 0) {
    drawRubbleCluster(ctx, cx, cy + 4, seed, 4);
  }
  drawWallBaseScuffs(ctx, cx, cy, seed + 59);
}

export function drawCaveWallBlock(ctx, cx, cy, heightPx, seed, opts = {}) {
  const wallH = heightPx ?? WALL_HEIGHT;
  const connected = opts.connected ?? {};
  const base = diamond(cx, cy, TILE_WIDTH, TILE_HEIGHT);
  const cap = diamond(cx, cy - wallH, TILE_WIDTH, TILE_HEIGHT);
  const rng = rngFrom(hash2D(seed + 379, seed * 3 + 11));

  drawShadowBlob(ctx, cx, cy + 3, TILE_WIDTH * 0.74, TILE_HEIGHT * 0.74);

  if (!connected.yPlus) {
    poly(ctx, PALETTE.stoneMid, [cap.left, cap.bottom, base.bottom, base.left]);
    const face = faceTools(ctx, cap.left, cap.bottom, base.bottom, base.left);
    for (const u of [0.12, 0.27, 0.43, 0.61, 0.78, 0.9]) {
      const lean = ((seed + Math.floor(u * 100)) & 1) ? 0.05 : -0.04;
      face.line(u, 0.02, Math.max(0.04, Math.min(0.96, u + lean)), 0.96, PALETTE.outline, 1);
    }
    for (const u of [0.2, 0.52, 0.84]) {
      face.line(u, 0.08, Math.max(0.05, u - 0.1), 0.42, PALETTE.stoneDust, 1);
      face.line(Math.max(0.05, u - 0.1), 0.42, Math.min(0.96, u + 0.08), 0.74, PALETTE.outline, 2);
    }
    for (const v of [0.22, 0.47, 0.71]) {
      face.line(0.05, v, 0.94, v + (rng() - 0.5) * 0.08, v < 0.5 ? PALETTE.stoneDust : PALETTE.stoneDark, 1);
    }
    face.line(0.18, 0.82, 0.48, 0.58, PALETTE.outline, 2);
    face.line(0.2, 0.8, 0.46, 0.57, PALETTE.stoneDust, 1);
    face.rect(0.62, 0.34, 0.76, 0.42, PALETTE.outline);
    face.rect(0.64, 0.35, 0.74, 0.4, PALETTE.void);
    face.rect(0.28, 0.18, 0.4, 0.27, PALETTE.outline);
    face.rect(0.3, 0.2, 0.38, 0.25, PALETTE.stoneLight);
  }

  if (!connected.xPlus) {
    poly(ctx, PALETTE.stoneDark, [cap.bottom, cap.right, base.right, base.bottom]);
    const face = faceTools(ctx, cap.bottom, cap.right, base.right, base.bottom);
    for (const u of [0.16, 0.36, 0.58, 0.82]) {
      face.line(u, 0.05, Math.max(0.04, Math.min(0.96, u - 0.06)), 0.98, PALETTE.outline, 1);
    }
    for (const v of [0.32, 0.65]) face.line(0.06, v, 0.92, v - 0.04, PALETTE.void, 1);
    face.line(0.2, 0.24, 0.78, 0.7, PALETTE.outline, 2);
    face.line(0.22, 0.24, 0.76, 0.69, PALETTE.stoneDark, 1);
    face.rect(0.32, 0.72, 0.48, 0.82, PALETTE.void);
    face.line(0.72, 0.12, 0.58, 0.92, PALETTE.void, 2);
    face.line(0.74, 0.14, 0.6, 0.88, PALETTE.stoneDark, 1);
    face.rect(0.58, 0.42, 0.74, 0.52, PALETTE.outline);
    face.rect(0.61, 0.44, 0.71, 0.5, PALETTE.void);
  }

  poly(ctx, PALETTE.stoneLight, [cap.top, cap.right, cap.bottom, cap.left]);
  poly(ctx, PALETTE.stoneDust, [
    mixPoint(cap.left, cap.top, 0.12),
    mixPoint(cap.top, cap.right, 0.84),
    mixPoint(cap.bottom, cap.right, 0.22),
    mixPoint(cap.left, cap.bottom, 0.78)
  ]);
  drawStoneCapWear(ctx, cap, seed + 397, false);

  linePx(ctx, cap.left[0], cap.left[1], cap.top[0], cap.top[1], PALETTE.stoneDust, 1);
  linePx(ctx, cap.top[0], cap.top[1], cap.right[0], cap.right[1], PALETTE.outline, 1);
  if (!connected.yPlus) linePx(ctx, cap.left[0], cap.left[1], cap.bottom[0], cap.bottom[1], PALETTE.outline, 1);
  if (!connected.xPlus) linePx(ctx, cap.bottom[0], cap.bottom[1], cap.right[0], cap.right[1], PALETTE.outline, 1);

  for (let i = 0; i < 10; i += 1) {
    const fx = cx - 26 + Math.floor(rng() * 52);
    const fy = cy - wallH + 8 + Math.floor(rng() * Math.max(8, wallH - 12));
    px(ctx, fx, fy, rng() < 0.55 ? PALETTE.stoneDust : PALETTE.void, 2 + Math.floor(rng() * 6), 1);
    if (rng() < 0.45) px(ctx, fx + 1, fy + 1, PALETTE.stoneDark, 2, 1);
  }
  if ((seed & 3) === 0) drawRubbleCluster(ctx, cx, cy + 5, seed + 383, 5);
  drawWallBaseScuffs(ctx, cx, cy + 1, seed + 401, [PALETTE.void, PALETTE.stoneDark, PALETTE.stoneDust]);
}
