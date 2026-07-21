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
  drawPropLeg,
  drawRubbleCluster,
  drawScorchMark,
  drawWarmLightPool,
  drawWaxStain,
  faceTools,
  footprintExtent,
  hash2D,
  isoFrame,
  linePx,
  mixPoint,
  nativeLinePx,
  nativePx,
  normalizeOrient,
  ORIENTS,
  orientedBox,
  poly,
  px,
  rngFrom,
  wallRunFace
} from './basePixels.js';

// Ground item pickup models.

const WEAPON_GROUND_MODELS = new Set([
  'sidearm', 'accelerator-sidearm', 'smg', 'carbine', 'rifle', 'shotgun',
  'support-gun', 'precision-rifle', 'accelerator-rifle', 'rail-rifle',
  'knife', 'sword', 'axe', 'blunt', 'pike', 'tool-weapon'
]);

export const GROUND_ITEM_MODEL_IDS = Object.freeze([
  'ball',
  'boots',
  'coat',
  'hood',
  'vest',
  'ribguard',
  'ring',
  'necklace',
  'key',
  'paper',
  'vial',
  'dressing',
  'food',
  'rounds',
  'sidearm',
  'accelerator-sidearm',
  'smg',
  'carbine',
  'rifle',
  'shotgun',
  'support-gun',
  'precision-rifle',
  'accelerator-rifle',
  'rail-rifle',
  'knife',
  'sword',
  'axe',
  'blunt',
  'pike',
  'tool-weapon',
  'chit',
  'shard',
  'token'
]);

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
  ctx.restore();

  drawLootBackplate(ctx, ix, iy, seed, backPlateColor(opts.model));
  if ((opts.count ?? 1) > 1) drawGroundItemModel(ctx, opts.model, ix + 5, iy + 2, seed + 17, true);
  drawGroundItemModel(ctx, opts.model, ix, iy, seed, false);
  ctx.restore();
}

function backPlateColor(model) {
  if (model === 'paper' || model === 'dressing' || model === 'shard') return PALETTE.stoneDark;
  if (model === 'boots' || model === 'coat' || model === 'hood' || model === 'vest' || WEAPON_GROUND_MODELS.has(model)) return PALETTE.woodDark;
  return PALETTE.clothDark;
}

function drawLootBackplate(ctx, cx, cy, seed, color) {
  const rng = rngFrom(seed + 41);
  const skew = Math.floor(rng() * 3) - 1;
  poly(ctx, PALETTE.void, [
    [cx - 23, cy - 4],
    [cx - 5 + skew, cy - 15],
    [cx + 24, cy - 5],
    [cx + 5 - skew, cy + 8]
  ]);
  poly(ctx, PALETTE.void, [
    [cx - 18, cy - 2],
    [cx - 2 + skew, cy - 9],
    [cx + 19, cy - 2],
    [cx + 4 - skew, cy + 6]
  ]);
  poly(ctx, PALETTE.outline, [
    [cx - 20, cy - 6],
    [cx - 3 + skew, cy - 14],
    [cx + 21, cy - 6],
    [cx + 4 - skew, cy + 5]
  ]);
  poly(ctx, PALETTE.stoneDark, [
    [cx - 18, cy - 6],
    [cx - 3 + skew, cy - 12],
    [cx + 18, cy - 6],
    [cx + 4 - skew, cy + 3]
  ]);
  poly(ctx, color, [
    [cx - 14, cy - 5],
    [cx - 2 + skew, cy - 10],
    [cx + 15, cy - 5],
    [cx + 2 - skew, cy + 1]
  ]);
  poly(ctx, PALETTE.outline, [
    [cx - 15, cy - 5],
    [cx - 2 + skew, cy - 11],
    [cx + 16, cy - 5],
    [cx + 2 - skew, cy + 2]
  ]);
  poly(ctx, color, [
    [cx - 12, cy - 5],
    [cx - 2 + skew, cy - 9],
    [cx + 13, cy - 5],
    [cx + 1 - skew, cy]
  ]);
  linePx(ctx, cx - 14, cy - 6, cx - 2 + skew, cy - 11, PALETTE.hostBone, 1);
  linePx(ctx, cx - 2 + skew, cy - 11, cx + 15, cy - 5, PALETTE.stoneDust, 1);
  linePx(ctx, cx - 13, cy - 4, cx + 2 - skew, cy + 1, PALETTE.void, 1);
  linePx(ctx, cx + 2 - skew, cy, cx + 15, cy - 5, PALETTE.void, 1);
  px(ctx, cx - 8, cy - 8, PALETTE.stoneDark, 9, 1);
  px(ctx, cx + 5, cy - 4, PALETTE.void, 6, 1);
  px(ctx, cx - 16, cy - 4, PALETTE.rustLight, 3, 2);
  px(ctx, cx + 13, cy - 6, PALETTE.rustDark, 3, 2);
  px(ctx, cx - 17, cy - 7, PALETTE.outline, 4, 3);
  px(ctx, cx - 16, cy - 7, PALETTE.rustLight, 2, 1);
  px(ctx, cx + 14, cy - 8, PALETTE.outline, 4, 3);
  px(ctx, cx + 15, cy - 8, PALETTE.rustDark, 2, 1);
  if (rng() < 0.65) px(ctx, cx - 1 + skew, cy - 12, PALETTE.hostGold, 2, 1);
}

function drawGroundItemModel(ctx, model = 'token', cx, cy, seed, back = false) {
  if (!back) drawModelContact(ctx, model, cx, cy);
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
    case 'ribguard':
      drawGroundRibguard(ctx, cx, cy, back);
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
    case 'sidearm':
      drawGroundSidearm(ctx, cx, cy, back);
      break;
    case 'accelerator-sidearm':
      drawGroundAcceleratorSidearm(ctx, cx, cy, back);
      break;
    case 'smg':
    case 'carbine':
    case 'rifle':
    case 'shotgun':
    case 'support-gun':
    case 'precision-rifle':
    case 'accelerator-rifle':
    case 'rail-rifle':
      drawGroundLongGun(ctx, model, cx, cy, back);
      break;
    case 'knife':
    case 'sword':
    case 'axe':
    case 'blunt':
    case 'tool-weapon':
      drawGroundMeleeWeapon(ctx, model, cx, cy, back);
      break;
    case 'pike':
      drawGroundPike(ctx, cx, cy, back);
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
  drawNativeGroundItemDetail(ctx, model, cx, cy, back);
}

function drawNativeGroundItemDetail(ctx, model, cx, cy, back) {
  const metalLight = back ? PALETTE.rustLight : PALETTE.hostBone;
  const clothLight = back ? PALETTE.stoneMid : PALETTE.stoneDust;
  switch (model) {
    case 'ball':
      nativeLinePx(ctx, cx - 5.5, cy - 9.5, cx + 3.5, cy - 12.5, PALETTE.clothBlue);
      nativePx(ctx, cx + 2.5, cy - 13.5, PALETTE.hostBone);
      break;
    case 'boots':
      nativeLinePx(ctx, cx - 10.5, cy - 7.5, cx - 10.5, cy - 1.5, PALETTE.woodLight);
      nativeLinePx(ctx, cx + 4.5, cy - 6.5, cx + 4.5, cy - 0.5, PALETTE.rustLight);
      break;
    case 'coat':
      nativeLinePx(ctx, cx - 9.5, cy - 8.5, cx - 2.5, cy - 11.5, clothLight);
      nativeLinePx(ctx, cx + 2.5, cy - 8.5, cx + 8.5, cy - 6.5, PALETTE.clothTan);
      break;
    case 'hood':
      nativeLinePx(ctx, cx - 5.5, cy - 14.5, cx + 0.5, cy - 16.5, PALETTE.stoneMid);
      nativeLinePx(ctx, cx - 8.5, cy - 1.5, cx + 3.5, cy + 1.5, PALETTE.clothTan);
      break;
    case 'vest':
      nativeLinePx(ctx, cx - 8.5, cy - 8.5, cx - 3.5, cy - 10.5, PALETTE.rustLight);
      nativeLinePx(ctx, cx + 2.5, cy - 7.5, cx + 7.5, cy - 5.5, metalLight);
      break;
    case 'ribguard':
      nativeLinePx(ctx, cx - 5.5, cy - 7.5, cx - 5.5, cy + 1.5, metalLight);
      nativeLinePx(ctx, cx + 2.5, cy - 7.5, cx + 2.5, cy + 1.5, PALETTE.stoneDust);
      break;
    case 'ring':
      nativeLinePx(ctx, cx - 7.5, cy - 9.5, cx - 2.5, cy - 11.5, metalLight);
      nativePx(ctx, cx + 5.5, cy - 10.5, PALETTE.flash);
      break;
    case 'necklace':
      nativeLinePx(ctx, cx - 12.5, cy - 9.5, cx - 5.5, cy - 2.5, metalLight);
      nativeLinePx(ctx, cx + 5.5, cy - 2.5, cx + 12.5, cy - 9.5, metalLight);
      break;
    case 'key':
      nativeLinePx(ctx, cx - 2.5, cy - 5.5, cx + 11.5, cy - 5.5, metalLight);
      nativePx(ctx, cx + 17.5, cy - 10.5, PALETTE.hostBone);
      break;
    case 'paper':
      nativeLinePx(ctx, cx - 7.5, cy - 6.5, cx - 1.5, cy - 6.5, PALETTE.stoneMid);
      nativeLinePx(ctx, cx + 0.5, cy - 2.5, cx + 5.5, cy - 2.5, PALETTE.rustDark);
      break;
    case 'vial':
      nativeLinePx(ctx, cx - 3.5, cy - 10.5, cx - 3.5, cy - 5.5, PALETTE.stoneLight);
      nativeLinePx(ctx, cx - 2.5, cy - 4.5, cx + 2.5, cy - 4.5, PALETTE.clothBlue);
      break;
    case 'dressing':
      nativeLinePx(ctx, cx - 8.5, cy - 6.5, cx + 7.5, cy - 6.5, clothLight);
      nativeLinePx(ctx, cx - 8.5, cy - 2.5, cx + 7.5, cy - 2.5, PALETTE.clothTan);
      break;
    case 'food':
      nativeLinePx(ctx, cx - 4.5, cy - 11.5, cx + 3.5, cy - 11.5, PALETTE.hostBone);
      nativeLinePx(ctx, cx - 4.5, cy - 4.5, cx + 3.5, cy - 4.5, PALETTE.rustDark);
      break;
    case 'rounds':
      nativeLinePx(ctx, cx - 10.5, cy - 8.5, cx - 10.5, cy - 3.5, metalLight);
      nativeLinePx(ctx, cx + 9.5, cy - 8.5, cx + 9.5, cy - 3.5, PALETTE.hostGold);
      break;
    case 'sidearm':
      nativeLinePx(ctx, cx - 11.5, cy - 7.5, cx + 5.5, cy - 7.5, metalLight);
      nativeLinePx(ctx, cx - 4.5, cy - 1.5, cx - 3.5, cy + 4.5, PALETTE.rustLight);
      break;
    case 'accelerator-sidearm':
      nativeLinePx(ctx, cx - 12.5, cy - 7.5, cx + 8.5, cy - 7.5, metalLight);
      nativeLinePx(ctx, cx - 5.5, cy - 5.5, cx + 4.5, cy - 5.5, PALETTE.hostGold);
      break;
    case 'smg':
    case 'carbine':
    case 'rifle':
    case 'shotgun':
    case 'support-gun':
    case 'precision-rifle':
    case 'accelerator-rifle':
    case 'rail-rifle':
      nativeLinePx(ctx, cx - 17.5, cy + 0.5, cx + 17.5, cy - 10.5, metalLight);
      nativeLinePx(ctx, cx - 9.5, cy - 1.5, cx + 7.5, cy - 6.5, model.includes('accelerator') || model === 'rail-rifle' ? PALETTE.hostGold : PALETTE.rustLight);
      break;
    case 'knife':
    case 'sword':
    case 'axe':
    case 'blunt':
    case 'tool-weapon':
      nativeLinePx(ctx, cx - 15.5, cy + 1.5, cx + 12.5, cy - 11.5, model === 'knife' || model === 'sword' ? metalLight : PALETTE.woodLight);
      nativePx(ctx, cx + 10.5, cy - 11.5, metalLight);
      break;
    case 'pike':
      nativeLinePx(ctx, cx - 15.5, cy + 1.5, cx + 8.5, cy - 10.5, PALETTE.woodLight);
      nativeLinePx(ctx, cx + 12.5, cy - 13.5, cx + 18.5, cy - 15.5, metalLight);
      break;
    case 'chit':
      nativeLinePx(ctx, cx - 7.5, cy - 5.5, cx + 2.5, cy - 5.5, PALETTE.rustDark);
      nativePx(ctx, cx - 8.5, cy - 8.5, metalLight);
      break;
    case 'shard':
      nativeLinePx(ctx, cx - 5.5, cy - 1.5, cx + 5.5, cy - 8.5, PALETTE.stoneLight);
      nativePx(ctx, cx + 6.5, cy - 6.5, PALETTE.flash);
      break;
    case 'token':
    default:
      nativeLinePx(ctx, cx - 6.5, cy - 5.5, cx + 5.5, cy - 5.5, PALETTE.hostBone);
      nativeLinePx(ctx, cx - 0.5, cy - 9.5, cx - 0.5, cy + 0.5, metalLight);
      break;
  }
}

function drawModelContact(ctx, model, cx, cy) {
  const wide = new Set(['key', 'rounds', ...WEAPON_GROUND_MODELS, 'coat', 'boots', 'necklace', 'dressing', 'food']);
  const w = wide.has(model) ? 31 : model === 'shard' ? 24 : 22;
  px(ctx, cx - Math.floor(w / 2), cy + 3, PALETTE.void, w, 2);
  px(ctx, cx - Math.floor(w / 2) + 3, cy + 2, PALETTE.outline, Math.max(8, w - 7), 1);
}

function drawGroundBall(ctx, cx, cy, back) {
  const blue = back ? PALETTE.clothBlueDark : PALETTE.clothBlue;
  px(ctx, cx - 8, cy - 15, PALETTE.outline, 17, 15);
  px(ctx, cx - 10, cy - 12, PALETTE.outline, 21, 10);
  px(ctx, cx - 7, cy - 14, blue, 15, 13);
  px(ctx, cx - 9, cy - 11, blue, 19, 8);
  px(ctx, cx - 4, cy - 15, back ? PALETTE.clothBlue : PALETTE.hostBone, 7, 2);
  px(ctx, cx + 6, cy - 8, PALETTE.void, 2, 6);
  px(ctx, cx - 5, cy - 5, PALETTE.clothBlueDark, 5, 3);
  px(ctx, cx - 2, cy - 11, PALETTE.stoneDark, 2, 6);
  linePx(ctx, cx - 7, cy - 8, cx + 5, cy - 12, PALETTE.outline, 1);
  linePx(ctx, cx - 6, cy - 9, cx + 4, cy - 12, PALETTE.stoneLight, 1);
  px(ctx, cx + 2, cy - 14, PALETTE.hostBone, 2, 1);
}

function drawGroundRing(ctx, cx, cy, back) {
  const metal = back ? PALETTE.rustLight : PALETTE.hostGold;
  const shade = back ? PALETTE.rustDark : PALETTE.rustMid;
  px(ctx, cx - 11, cy - 10, PALETTE.outline, 21, 14);
  px(ctx, cx - 8, cy - 13, PALETTE.outline, 16, 19);
  px(ctx, cx - 9, cy - 9, metal, 18, 12);
  px(ctx, cx - 6, cy - 11, metal, 12, 16);
  px(ctx, cx - 4, cy - 6, PALETTE.void, 9, 5);
  px(ctx, cx - 2, cy - 5, PALETTE.void, 5, 3);
  px(ctx, cx + 2, cy - 12, PALETTE.outline, 8, 7);
  px(ctx, cx + 3, cy - 11, metal, 6, 5);
  px(ctx, cx + 3, cy - 10, PALETTE.hostBone, 4, 1);
  px(ctx, cx + 7, cy - 7, shade, 2, 3);
  px(ctx, cx - 8, cy + 1, shade, 7, 2);
  px(ctx, cx - 8, cy - 10, PALETTE.hostBone, 5, 1);
  px(ctx, cx + 1, cy + 3, PALETTE.outline, 5, 1);
  px(ctx, cx - 9, cy - 3, PALETTE.rustDark, 3, 2);
  px(ctx, cx + 6, cy - 10, PALETTE.flash, 1, 1);
}

function drawGroundNecklace(ctx, cx, cy, back) {
  const metal = back ? PALETTE.rustLight : PALETTE.hostGold;
  linePx(ctx, cx - 15, cy - 11, cx - 4, cy - 1, PALETTE.outline, 3);
  linePx(ctx, cx + 15, cy - 11, cx + 3, cy - 1, PALETTE.outline, 3);
  linePx(ctx, cx - 14, cy - 11, cx - 4, cy - 2, metal, 1);
  linePx(ctx, cx + 14, cy - 11, cx + 3, cy - 2, metal, 1);
  for (const [dx, dy] of [[-11, -8], [-7, -5], [8, -5], [12, -8]]) {
    px(ctx, cx + dx, cy + dy, PALETTE.outline, 4, 3);
    px(ctx, cx + dx + 1, cy + dy, metal, 2, 1);
  }
  px(ctx, cx - 6, cy - 4, PALETTE.outline, 13, 13);
  px(ctx, cx - 5, cy - 3, metal, 11, 11);
  px(ctx, cx - 1, cy - 3, PALETTE.rustDark, 3, 10);
  px(ctx, cx - 4, cy, PALETTE.rustDark, 9, 2);
  px(ctx, cx - 4, cy - 3, PALETTE.hostBone, 5, 1);
  px(ctx, cx + 3, cy + 5, PALETTE.outline, 3, 2);
  px(ctx, cx - 1, cy + 1, PALETTE.outline, 3, 4);
  px(ctx, cx, cy + 1, PALETTE.hostBone, 1, 4);
  px(ctx, cx - 2, cy + 3, PALETTE.hostBone, 5, 1);
}

function drawGroundKey(ctx, cx, cy, back) {
  const metal = back ? PALETTE.stoneDust : PALETTE.hostGold;
  px(ctx, cx - 15, cy - 9, PALETTE.outline, 12, 10);
  px(ctx, cx - 14, cy - 8, metal, 10, 8);
  px(ctx, cx - 11, cy - 6, PALETTE.void, 4, 3);
  px(ctx, cx - 4, cy - 7, PALETTE.outline, 24, 7);
  px(ctx, cx - 3, cy - 6, metal, 22, 4);
  px(ctx, cx + 14, cy - 12, PALETTE.outline, 4, 8);
  px(ctx, cx + 18, cy - 12, PALETTE.outline, 4, 12);
  px(ctx, cx + 15, cy - 11, metal, 2, 6);
  px(ctx, cx + 19, cy - 11, metal, 2, 9);
  px(ctx, cx - 4, cy - 7, PALETTE.hostBone, 11, 1);
  px(ctx, cx + 6, cy - 3, PALETTE.rustDark, 7, 1);
  px(ctx, cx + 20, cy - 3, PALETTE.outline, 4, 2);
  px(ctx, cx + 20, cy - 3, metal, 3, 1);
  px(ctx, cx + 1, cy - 7, PALETTE.flash, 1, 1);
}

function drawGroundVial(ctx, cx, cy, back) {
  const liquid = back ? PALETTE.clothBlueDark : PALETTE.clothBlue;
  px(ctx, cx - 5, cy - 15, PALETTE.outline, 11, 4);
  px(ctx, cx - 7, cy - 12, PALETTE.outline, 15, 16);
  px(ctx, cx - 5, cy - 14, PALETTE.stoneDust, 9, 2);
  px(ctx, cx - 5, cy - 11, PALETTE.hostBone, 11, 13);
  px(ctx, cx - 5, cy - 5, liquid, 11, 7);
  px(ctx, cx - 3, cy - 10, PALETTE.stoneLight, 2, 5);
  px(ctx, cx + 4, cy - 9, PALETTE.void, 2, 10);
  px(ctx, cx - 4, cy - 6, PALETTE.clothBlueDark, 9, 1);
  px(ctx, cx - 3, cy - 4, PALETTE.clothBlue, 6, 1);
  px(ctx, cx + 1, cy - 13, PALETTE.rustDark, 4, 1);
}

function drawGroundPaper(ctx, cx, cy, seed, back) {
  const rng = rngFrom(seed + 3);
  for (let i = 0; i < 3; i += 1) {
    const x = cx - 12 + Math.floor(rng() * 19);
    const y = cy - 10 + Math.floor(rng() * 10);
    px(ctx, x - 1, y - 1, PALETTE.outline, 10, 7);
    px(ctx, x, y, back ? PALETTE.stoneDust : PALETTE.hostBone, 8, 5);
    px(ctx, x + 1, y + 1, PALETTE.stoneMid, 5, 1);
    px(ctx, x + 2, y + 3, PALETTE.rustDark, 4, 1);
    if (i === 1) px(ctx, x + 5, y, PALETTE.hostRed, 2, 1);
  }
  px(ctx, cx - 2, cy - 5, PALETTE.hostGold, 2, 1);
}

function drawGroundDressing(ctx, cx, cy, back) {
  const cloth = back ? PALETTE.stoneDust : PALETTE.hostBone;
  px(ctx, cx - 12, cy - 9, PALETTE.outline, 24, 11);
  px(ctx, cx - 10, cy - 8, cloth, 20, 9);
  px(ctx, cx - 2, cy - 9, PALETTE.clothTan, 4, 11);
  px(ctx, cx - 10, cy - 5, PALETTE.clothTan, 20, 2);
  px(ctx, cx - 8, cy - 7, PALETTE.stoneDust, 7, 1);
  px(ctx, cx + 3, cy - 3, PALETTE.stoneMid, 6, 1);
  px(ctx, cx - 11, cy - 1, PALETTE.outline, 5, 2);
  px(ctx, cx - 10, cy - 1, PALETTE.hostRed, 3, 1);
}

function drawGroundFood(ctx, cx, cy, back) {
  const tin = back ? PALETTE.stoneMid : PALETTE.stoneLight;
  const label = back ? PALETTE.rustDark : PALETTE.clothTan;
  px(ctx, cx - 9, cy - 13, PALETTE.outline, 18, 16);
  px(ctx, cx - 7, cy - 14, PALETTE.outline, 14, 18);
  px(ctx, cx - 7, cy - 12, tin, 14, 14);
  px(ctx, cx - 6, cy - 13, PALETTE.hostBone, 11, 2);
  px(ctx, cx - 7, cy - 6, label, 14, 5);
  px(ctx, cx - 4, cy - 4, PALETTE.rustDark, 8, 1);
  px(ctx, cx + 5, cy - 10, PALETTE.stoneDark, 2, 11);
  px(ctx, cx - 2, cy - 11, PALETTE.outline, 6, 2);
  px(ctx, cx - 1, cy - 11, PALETTE.stoneDust, 4, 1);
  px(ctx, cx - 6, cy + 1, PALETTE.void, 12, 1);
}

function drawGroundRounds(ctx, cx, cy, back) {
  const brass = back ? PALETTE.rustLight : PALETTE.hostGold;
  px(ctx, cx - 14, cy - 7, PALETTE.outline, 29, 5);
  px(ctx, cx - 13, cy - 6, PALETTE.rustDark, 27, 3);
  for (let i = 0; i < 5; i += 1) {
    const x = cx - 11 + i * 5;
    const y = cy - 10 + (i % 2);
    px(ctx, x - 1, y - 1, PALETTE.outline, 5, 12);
    px(ctx, x, y, brass, 3, 8);
    px(ctx, x, y + 7, PALETTE.rustDark, 3, 3);
    px(ctx, x, y, PALETTE.hostBone, 2, 1);
  }
  px(ctx, cx - 11, cy - 3, PALETTE.woodLight, 23, 1);
}

function drawGroundSidearm(ctx, cx, cy, back) {
  const metal = back ? PALETTE.stoneMid : PALETTE.stoneLight;
  const grip = back ? PALETTE.woodDark : PALETTE.rustDark;
  px(ctx, cx - 16, cy - 9, PALETTE.outline, 27, 8);
  px(ctx, cx - 14, cy - 8, metal, 23, 5);
  px(ctx, cx + 7, cy - 6, PALETTE.outline, 8, 4);
  px(ctx, cx + 8, cy - 5, metal, 6, 2);
  px(ctx, cx - 7, cy - 4, PALETTE.outline, 9, 12);
  px(ctx, cx - 5, cy - 3, grip, 6, 10);
  px(ctx, cx - 9, cy - 2, PALETTE.outline, 8, 4);
  px(ctx, cx - 8, cy - 1, PALETTE.void, 5, 2);
  px(ctx, cx - 12, cy - 10, PALETTE.hostBone, 9, 1);
  px(ctx, cx + 2, cy - 8, PALETTE.stoneDust, 6, 1);
  px(ctx, cx - 4, cy + 5, PALETTE.void, 5, 2);
  px(ctx, cx - 13, cy - 4, PALETTE.rustLight, 4, 1);
}

function drawGroundAcceleratorSidearm(ctx, cx, cy, back) {
  const metal = back ? PALETTE.stoneMid : PALETTE.stoneLight;
  const coil = back ? PALETTE.rustDark : PALETTE.hostGold;
  px(ctx, cx - 17, cy - 10, PALETTE.outline, 30, 9);
  px(ctx, cx - 15, cy - 9, metal, 25, 6);
  px(ctx, cx + 8, cy - 7, PALETTE.outline, 9, 4);
  px(ctx, cx + 9, cy - 6, metal, 7, 2);
  for (let x = cx - 10; x <= cx + 4; x += 4) px(ctx, x, cy - 9, coil, 2, 5);
  px(ctx, cx - 7, cy - 4, PALETTE.outline, 9, 12);
  px(ctx, cx - 5, cy - 3, PALETTE.woodDark, 6, 10);
  px(ctx, cx - 10, cy - 1, PALETTE.outline, 8, 3);
  px(ctx, cx - 9, cy, PALETTE.void, 5, 1);
  px(ctx, cx - 13, cy - 10, PALETTE.hostBone, 7, 1);
}

function drawGroundLongGun(ctx, model, cx, cy, back) {
  const metal = back ? PALETTE.stoneMid : PALETTE.stoneLight;
  const metalDark = back ? PALETTE.stoneDark : PALETTE.stoneMid;
  const wood = back ? PALETTE.woodDark : PALETTE.woodLight;
  const compact = model === 'smg' || model === 'carbine';
  const heavy = model === 'support-gun';
  const accelerator = model === 'accelerator-rifle' || model === 'rail-rifle';
  const rearX = cx - (compact ? 15 : 20);
  const frontX = cx + (compact ? 17 : 21);
  linePx(ctx, rearX, cy + 2, frontX, cy - 11, PALETTE.outline, heavy ? 7 : 6);
  linePx(ctx, rearX + 1, cy + 1, frontX - 1, cy - 11, accelerator ? metalDark : metal, heavy ? 5 : 4);
  linePx(ctx, cx - 8, cy - 1, frontX + 3, cy - 12, PALETTE.outline, 3);
  linePx(ctx, cx - 7, cy - 2, frontX + 3, cy - 13, model === 'shotgun' ? PALETTE.rustLight : metal, 1);
  poly(ctx, PALETTE.outline, [
    [rearX - 3, cy + 1], [rearX + 8, cy - 3], [rearX + 5, cy + 5], [rearX - 5, cy + 6]
  ]);
  poly(ctx, wood, [
    [rearX - 2, cy + 1], [rearX + 6, cy - 2], [rearX + 4, cy + 3], [rearX - 3, cy + 4]
  ]);
  if (model === 'shotgun') {
    linePx(ctx, cx - 1, cy - 5, frontX + 2, cy - 13, PALETTE.rustDark, 2);
    linePx(ctx, cx, cy - 6, frontX + 2, cy - 14, metal, 1);
  } else if (model === 'precision-rifle') {
    px(ctx, cx - 3, cy - 11, PALETTE.outline, 16, 5);
    px(ctx, cx - 1, cy - 10, metal, 12, 2);
    px(ctx, cx + 10, cy - 11, PALETTE.hostBone, 2, 1);
  } else if (heavy) {
    px(ctx, cx - 1, cy - 2, PALETTE.outline, 11, 10);
    px(ctx, cx + 1, cy - 1, PALETTE.rustDark, 7, 7);
    px(ctx, cx + 2, cy, PALETTE.rustLight, 5, 1);
    linePx(ctx, cx + 8, cy - 2, cx + 12, cy + 5, PALETTE.outline, 2);
  } else {
    poly(ctx, PALETTE.outline, [[cx - 1, cy - 2], [cx + 6, cy - 4], [cx + 4, cy + 5], [cx, cy + 4]]);
    poly(ctx, accelerator ? PALETTE.rustDark : PALETTE.stoneDark, [[cx, cy - 1], [cx + 4, cy - 3], [cx + 3, cy + 3], [cx + 1, cy + 3]]);
  }
  if (accelerator) {
    for (let i = 0; i < 4; i += 1) {
      const x = cx - 8 + i * 5;
      px(ctx, x, cy - 7 - Math.floor(i / 2), PALETTE.hostGold, 2, 4);
    }
    if (model === 'rail-rifle') linePx(ctx, cx - 8, cy - 9, frontX, cy - 15, PALETTE.hostBone, 1);
  }
  px(ctx, rearX + 2, cy, PALETTE.hostBone, 5, 1);
}

function drawGroundMeleeWeapon(ctx, model, cx, cy, back) {
  const metal = back ? PALETTE.stoneMid : PALETTE.stoneLight;
  const wood = back ? PALETTE.woodDark : PALETTE.woodLight;
  const short = model === 'knife';
  const startX = cx - (short ? 11 : 18);
  const startY = cy + (short ? 1 : 4);
  const endX = cx + (short ? 12 : 17);
  const endY = cy - (short ? 10 : 14);
  if (model === 'knife' || model === 'sword') {
    linePx(ctx, startX, startY, endX, endY, PALETTE.outline, short ? 5 : 6);
    linePx(ctx, startX + 1, startY - 1, endX - 1, endY + 1, metal, short ? 3 : 4);
    linePx(ctx, startX + 2, startY - 2, endX - 2, endY, PALETTE.hostBone, 1);
    linePx(ctx, startX - 3, startY - 2, startX + 4, startY + 3, PALETTE.rustDark, 3);
    px(ctx, startX - 5, startY + 1, PALETTE.outline, 7, 5);
    return;
  }
  linePx(ctx, startX, startY, endX - 2, endY + 2, PALETTE.outline, 5);
  linePx(ctx, startX, startY - 1, endX - 2, endY + 1, wood, 3);
  if (model === 'axe') {
    poly(ctx, PALETTE.outline, [[endX - 5, endY - 2], [endX + 5, endY - 5], [endX + 2, endY + 4], [endX - 5, endY + 5]]);
    poly(ctx, metal, [[endX - 3, endY - 1], [endX + 3, endY - 3], [endX + 1, endY + 2], [endX - 3, endY + 3]]);
  } else if (model === 'blunt') {
    px(ctx, endX - 5, endY - 4, PALETTE.outline, 12, 9);
    px(ctx, endX - 3, endY - 3, metal, 8, 6);
    px(ctx, endX - 2, endY - 3, PALETTE.hostBone, 5, 1);
  } else {
    poly(ctx, PALETTE.outline, [[endX - 7, endY - 4], [endX + 6, endY - 3], [endX + 4, endY + 2], [endX - 5, endY + 3]]);
    linePx(ctx, endX - 5, endY - 2, endX + 4, endY - 1, metal, 2);
    px(ctx, startX - 3, startY, PALETTE.outline, 8, 5);
  }
}

function drawGroundPike(ctx, cx, cy, back) {
  const shaft = back ? PALETTE.woodDark : PALETTE.woodLight;
  const metal = back ? PALETTE.stoneMid : PALETTE.stoneLight;
  linePx(ctx, cx - 18, cy + 4, cx + 14, cy - 12, PALETTE.outline, 5);
  linePx(ctx, cx - 18, cy + 3, cx + 14, cy - 13, shaft, 3);
  linePx(ctx, cx - 14, cy, cx + 11, cy - 13, PALETTE.clothTan, 1);
  poly(ctx, PALETTE.outline, [
    [cx + 10, cy - 15],
    [cx + 22, cy - 18],
    [cx + 16, cy - 8],
    [cx + 11, cy - 10]
  ]);
  poly(ctx, metal, [
    [cx + 12, cy - 14],
    [cx + 19, cy - 16],
    [cx + 15, cy - 10],
    [cx + 12, cy - 11]
  ]);
  linePx(ctx, cx + 13, cy - 14, cx + 18, cy - 16, PALETTE.hostBone, 1);
  px(ctx, cx - 21, cy + 3, PALETTE.outline, 6, 6);
  px(ctx, cx - 20, cy + 3, PALETTE.rustDark, 4, 4);
  px(ctx, cx - 17, cy - 1, PALETTE.hostGold, 3, 3);
}

function drawGroundRibguard(ctx, cx, cy, back) {
  const bone = back ? PALETTE.stoneDust : PALETTE.hostBone;
  const shade = back ? PALETTE.stoneDark : PALETTE.stoneMid;
  const strap = back ? PALETTE.woodDark : PALETTE.rustDark;
  px(ctx, cx - 9, cy - 9, PALETTE.outline, 18, 16);
  px(ctx, cx - 7, cy - 10, PALETTE.outline, 14, 18);
  px(ctx, cx - 7, cy - 8, strap, 14, 13);
  px(ctx, cx - 6, cy - 9, bone, 5, 15);
  px(ctx, cx + 1, cy - 9, bone, 5, 15);
  px(ctx, cx - 5, cy - 6, shade, 3, 1);
  px(ctx, cx + 2, cy - 6, shade, 3, 1);
  px(ctx, cx - 6, cy - 2, shade, 4, 1);
  px(ctx, cx + 1, cy - 2, shade, 4, 1);
  px(ctx, cx - 6, cy + 2, shade, 3, 1);
  px(ctx, cx + 2, cy + 2, shade, 3, 1);
  px(ctx, cx - 1, cy - 8, PALETTE.outline, 2, 15);
  px(ctx, cx - 8, cy - 4, strap, 3, 3);
  px(ctx, cx + 5, cy - 1, strap, 3, 3);
  px(ctx, cx - 5, cy - 8, back ? PALETTE.stoneLight : PALETTE.hostBone, 3, 1);
  px(ctx, cx - 1, cy - 7, PALETTE.hostGold, 1, 11);
  px(ctx, cx - 9, cy + 5, PALETTE.outline, 18, 1);
}

function drawGroundChit(ctx, cx, cy, back) {
  const brass = back ? PALETTE.rustLight : PALETTE.hostGold;
  poly(ctx, PALETTE.outline, [
    [cx - 12, cy - 11],
    [cx + 11, cy - 11],
    [cx + 11, cy + 2],
    [cx + 6, cy + 6],
    [cx - 12, cy + 6]
  ]);
  poly(ctx, brass, [
    [cx - 10, cy - 9],
    [cx + 9, cy - 9],
    [cx + 9, cy + 1],
    [cx + 5, cy + 4],
    [cx - 10, cy + 4]
  ]);
  px(ctx, cx - 7, cy - 6, PALETTE.rustDark, 11, 1);
  px(ctx, cx - 7, cy - 2, PALETTE.rustDark, 8, 1);
  px(ctx, cx + 5, cy - 7, PALETTE.void, 3, 3);
  px(ctx, cx - 9, cy - 9, PALETTE.hostBone, 6, 1);
  px(ctx, cx - 10, cy + 3, PALETTE.rustDark, 9, 1);
  px(ctx, cx + 8, cy, PALETTE.outline, 2, 5);
  px(ctx, cx - 2, cy - 8, PALETTE.hostBone, 3, 1);
  px(ctx, cx - 10, cy - 9, PALETTE.outline, 4, 4);
  px(ctx, cx - 9, cy - 8, PALETTE.void, 2, 2);
  px(ctx, cx + 6, cy + 2, PALETTE.rustDark, 4, 1);
}

function drawGroundToken(ctx, cx, cy, back) {
  const metal = back ? PALETTE.rustLight : PALETTE.hostGold;
  px(ctx, cx - 10, cy - 12, PALETTE.outline, 20, 16);
  px(ctx, cx - 12, cy - 9, PALETTE.outline, 24, 10);
  px(ctx, cx - 9, cy - 11, metal, 18, 14);
  px(ctx, cx - 11, cy - 8, metal, 22, 8);
  px(ctx, cx - 3, cy - 9, PALETTE.rustDark, 6, 11);
  px(ctx, cx - 7, cy - 6, PALETTE.rustDark, 14, 2);
  px(ctx, cx - 8, cy - 10, PALETTE.hostBone, 7, 1);
  px(ctx, cx + 5, cy - 4, PALETTE.rustMid, 2, 5);
  px(ctx, cx - 5, cy - 1, PALETTE.outline, 10, 1);
  px(ctx, cx - 1, cy - 12, PALETTE.hostBone, 3, 1);
  px(ctx, cx - 2, cy - 8, PALETTE.outline, 5, 9);
  px(ctx, cx - 1, cy - 7, PALETTE.hostBone, 3, 7);
  px(ctx, cx - 4, cy - 4, PALETTE.hostBone, 9, 2);
}

function drawGroundShard(ctx, cx, cy, back) {
  const metal = back ? PALETTE.stoneLight : PALETTE.hostBone;
  poly(ctx, PALETTE.outline, [
    [cx - 11, cy + 1],
    [cx - 3, cy - 17],
    [cx + 12, cy - 5],
    [cx + 4, cy + 5]
  ]);
  poly(ctx, metal, [
    [cx - 8, cy],
    [cx - 3, cy - 14],
    [cx + 9, cy - 5],
    [cx + 3, cy + 3]
  ]);
  px(ctx, cx - 2, cy - 11, PALETTE.stoneLight, 5, 1);
  px(ctx, cx + 4, cy - 4, PALETTE.stoneMid, 3, 5);
  linePx(ctx, cx - 5, cy - 1, cx + 6, cy - 8, PALETTE.outline, 1);
  linePx(ctx, cx - 4, cy - 2, cx + 5, cy - 8, PALETTE.stoneDust, 1);
  px(ctx, cx + 7, cy - 6, PALETTE.flash, 1, 1);
}

function drawGroundCoat(ctx, cx, cy, back) {
  // A dropped censure field coat matches the coat the player wears: ash-pale
  // wool, not blue guide-cloth.
  const cloth = back ? PALETTE.stoneMid : PALETTE.stoneDust;
  const hi = back ? PALETTE.stoneDust : PALETTE.hostBone;
  poly(ctx, PALETTE.outline, [
    [cx - 16, cy - 10],
    [cx, cy - 17],
    [cx + 17, cy - 9],
    [cx + 12, cy + 5],
    [cx - 7, cy + 10],
    [cx - 18, cy + 2]
  ]);
  poly(ctx, cloth, [
    [cx - 13, cy - 9],
    [cx, cy - 15],
    [cx + 14, cy - 8],
    [cx + 10, cy + 3],
    [cx - 7, cy + 7],
    [cx - 15, cy + 1]
  ]);
  px(ctx, cx - 1, cy - 14, PALETTE.clothTan, 3, 20);
  px(ctx, cx - 12, cy - 7, PALETTE.void, 5, 3);
  px(ctx, cx + 7, cy - 5, PALETTE.void, 5, 3);
  px(ctx, cx - 10, cy - 10, hi, 10, 1);
  px(ctx, cx + 2, cy - 9, hi, 8, 1);
  px(ctx, cx - 9, cy + 5, PALETTE.stoneDark, 7, 1);
  px(ctx, cx + 4, cy + 3, PALETTE.void, 5, 1);
  px(ctx, cx - 13, cy - 2, PALETTE.clothTan, 5, 1);
  px(ctx, cx + 8, cy - 1, PALETTE.clothTan, 4, 1);
  px(ctx, cx - 2, cy + 2, PALETTE.outline, 2, 5);
  px(ctx, cx - 11, cy - 4, PALETTE.stoneDark, 3, 8);
  px(ctx, cx + 11, cy - 3, PALETTE.stoneDark, 2, 7);
  px(ctx, cx + 1, cy - 8, PALETTE.hostBone, 2, 1);
}

function drawGroundHood(ctx, cx, cy, back) {
  // Matches the worn censure hood: smoke-dark cloth.
  const cloth = back ? PALETTE.void : PALETTE.clothDark;
  const hi = back ? PALETTE.stoneDark : PALETTE.stoneMid;
  poly(ctx, PALETTE.outline, [
    [cx - 14, cy - 5],
    [cx - 8, cy - 17],
    [cx + 2, cy - 20],
    [cx + 14, cy - 10],
    [cx + 11, cy + 7],
    [cx - 12, cy + 5]
  ]);
  poly(ctx, cloth, [
    [cx - 11, cy - 5],
    [cx - 6, cy - 15],
    [cx + 1, cy - 17],
    [cx + 11, cy - 9],
    [cx + 8, cy + 4],
    [cx - 9, cy + 3]
  ]);
  px(ctx, cx - 7, cy - 11, PALETTE.outline, 15, 9);
  px(ctx, cx - 5, cy - 10, PALETTE.void, 11, 6);
  px(ctx, cx - 3, cy - 9, PALETTE.clothDark, 7, 3);
  px(ctx, cx - 5, cy - 15, PALETTE.clothTan, 8, 1);
  px(ctx, cx - 9, cy - 8, hi, 3, 8);
  px(ctx, cx + 6, cy - 7, PALETTE.void, 2, 12);
  px(ctx, cx - 8, cy + 2, PALETTE.stoneDark, 12, 1);
  px(ctx, cx + 3, cy + 4, PALETTE.outline, 6, 2);
  px(ctx, cx - 3, cy - 7, PALETTE.void, 7, 2);
  px(ctx, cx - 9, cy - 2, PALETTE.clothTan, 5, 1);
  px(ctx, cx + 6, cy + 1, PALETTE.clothTan, 4, 1);
}

function drawGroundVest(ctx, cx, cy, back) {
  const leather = back ? PALETTE.woodDark : PALETTE.rustDark;
  const plate = back ? PALETTE.stoneMid : PALETTE.stoneLight;
  poly(ctx, PALETTE.outline, [
    [cx - 14, cy - 12],
    [cx + 1, cy - 16],
    [cx + 15, cy - 10],
    [cx + 10, cy + 6],
    [cx - 8, cy + 9],
    [cx - 15, cy]
  ]);
  poly(ctx, leather, [
    [cx - 11, cy - 10],
    [cx + 1, cy - 13],
    [cx + 12, cy - 8],
    [cx + 8, cy + 4],
    [cx - 7, cy + 6],
    [cx - 12, cy - 1]
  ]);
  px(ctx, cx - 2, cy - 11, PALETTE.stoneDark, 5, 17);
  px(ctx, cx - 9, cy - 6, PALETTE.rustLight, 6, 2);
  px(ctx, cx + 4, cy - 5, PALETTE.rustLight, 6, 2);
  px(ctx, cx - 7, cy - 2, plate, 5, 2);
  px(ctx, cx + 3, cy - 1, plate, 5, 2);
  px(ctx, cx - 9, cy + 4, PALETTE.void, 5, 1);
  px(ctx, cx - 11, cy - 8, PALETTE.outline, 4, 12);
  px(ctx, cx + 8, cy - 7, PALETTE.outline, 3, 10);
  px(ctx, cx - 10, cy - 7, PALETTE.woodLight, 2, 9);
  px(ctx, cx + 8, cy - 6, PALETTE.woodLight, 1, 7);
  px(ctx, cx - 1, cy + 3, PALETTE.hostBone, 3, 1);
  px(ctx, cx - 4, cy - 8, plate, 3, 6);
  px(ctx, cx + 3, cy - 7, plate, 3, 6);
  px(ctx, cx + 1, cy - 10, PALETTE.hostBone, 2, 1);
}

function drawGroundBoots(ctx, cx, cy, back) {
  const leather = back ? PALETTE.woodDark : PALETTE.rustDark;
  px(ctx, cx - 13, cy - 11, PALETTE.outline, 10, 16);
  px(ctx, cx + 1, cy - 10, PALETTE.outline, 11, 15);
  px(ctx, cx - 11, cy - 10, leather, 7, 13);
  px(ctx, cx + 3, cy - 9, leather, 8, 12);
  px(ctx, cx - 15, cy + 1, PALETTE.outline, 14, 6);
  px(ctx, cx, cy, PALETTE.outline, 15, 6);
  px(ctx, cx - 13, cy + 1, PALETTE.rustLight, 10, 3);
  px(ctx, cx + 2, cy, PALETTE.rustLight, 11, 3);
  px(ctx, cx - 9, cy - 9, PALETTE.woodLight, 3, 1);
  px(ctx, cx + 5, cy - 8, PALETTE.woodLight, 3, 1);
  px(ctx, cx - 14, cy + 4, PALETTE.void, 9, 1);
  px(ctx, cx + 5, cy + 3, PALETTE.void, 8, 1);
  px(ctx, cx - 8, cy - 6, PALETTE.outline, 1, 8);
  px(ctx, cx + 7, cy - 5, PALETTE.outline, 1, 7);
  px(ctx, cx - 12, cy - 3, PALETTE.woodLight, 6, 1);
  px(ctx, cx + 3, cy - 2, PALETTE.woodLight, 7, 1);
  px(ctx, cx - 2, cy + 5, PALETTE.outline, 7, 1);
  px(ctx, cx - 8, cy - 7, PALETTE.rustLight, 3, 1);
  px(ctx, cx + 6, cy - 6, PALETTE.rustLight, 3, 1);
  px(ctx, cx - 7, cy - 4, PALETTE.outline, 3, 1);
  px(ctx, cx + 6, cy - 3, PALETTE.outline, 3, 1);
}
