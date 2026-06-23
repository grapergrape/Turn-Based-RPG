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

// Ground item pickup models.

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
