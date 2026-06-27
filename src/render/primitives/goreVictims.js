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

function victimRamp(hi, mid, lo, dk = lo) {
  return { hi, mid, lo, dk };
}

function drawVictimTaperedSpan(ctx, cx, y, topW, bottomW, h, colors, lean = 0, phase = 0) {
  const span = Math.max(1, h - 1);
  for (let row = 0; row < h; row += 1) {
    const t = row / span;
    const w = Math.max(3, Math.round(topW + (bottomW - topW) * t));
    const bx = cx + Math.round(lean * (t - 0.35));
    const x = bx - Math.floor(w / 2);
    const yRow = y + row;
    const tone = row < 2 ? colors.hi : row > h - 4 ? colors.lo : colors.mid;
    px(ctx, x - 1, yRow, PALETTE.outline, w + 2, 1);
    px(ctx, x, yRow, tone, w, 1);
    px(ctx, x, yRow, colors.hi, 1, 1);
    px(ctx, x + w - 1, yRow, colors.lo, 1, 1);
    if (w > 6 && row > 2 && row < h - 2 && ((row + phase) % 5 === 0)) {
      px(ctx, x + 2, yRow, colors.dk, Math.max(1, w - 5), 1);
    }
  }
}

function drawVictimJointedLimb(ctx, points, colors, size = 2, far = false) {
  const main = far ? colors.lo : colors.mid;
  const hi = far ? colors.mid : colors.hi;
  for (let i = 0; i < points.length - 1; i += 1) {
    const a = points[i];
    const b = points[i + 1];
    linePx(ctx, a.x, a.y, b.x, b.y, PALETTE.outline, size + 2);
    linePx(ctx, a.x, a.y, b.x, b.y, main, size);
    if (size > 1) linePx(ctx, a.x, a.y - 1, b.x, b.y - 1, hi, 1);
  }
  for (let i = 1; i < points.length - 1; i += 1) {
    const p = points[i];
    px(ctx, p.x - 1, p.y - 1, PALETTE.outline, 3, 3);
    px(ctx, p.x - 1, p.y - 1, main, 2, 2);
    px(ctx, p.x - 1, p.y - 1, hi, 1, 1);
  }
}

function drawVictimBoot(ctx, x, y, side, colors, far = false) {
  const w = far ? 5 : 6;
  const x0 = x - Math.floor(w / 2) + side;
  px(ctx, x0 - 1, y - 3, PALETTE.outline, w + 2, 4);
  px(ctx, x0, y - 2, far ? colors.lo : colors.mid, w, 2);
  px(ctx, x0, y - 3, colors.hi, Math.max(2, w - 2), 1);
  px(ctx, x0 + w - 1, y - 1, colors.dk, 1, 2);
}

function drawVictimHandAndNail(ctx, wrist, skin, blood, darkBlood) {
  px(ctx, wrist.x - 2, wrist.y - 3, PALETTE.stoneDust, 4, 2);
  px(ctx, wrist.x - 1, wrist.y - 1, PALETTE.stoneLight, 2, 3);
  px(ctx, wrist.x - 2, wrist.y + 1, darkBlood, 4, 1);
  px(ctx, wrist.x - 1, wrist.y + 2, blood, 2, 1);
  px(ctx, wrist.x - 1, wrist.y + 3, skin.mid, 3, 3);
  px(ctx, wrist.x - 1, wrist.y + 3, skin.hi, 1, 1);
}

function drawVictimHead(ctx, cx, y, member, seed, blood, bloodDark) {
  const headH = member.headHeight;
  const headW = member.headWidth ?? Math.max(6, Math.round(member.shoulders * 0.56));
  const tilt = member.headTilt ?? 0;
  const skin = member.skin;
  const hair = member.hair;
  const span = Math.max(1, headH - 1);

  for (let row = 0; row < headH; row += 1) {
    const t = row / span;
    const rowLean = Math.round(tilt * (t - 0.35));
    const w = row < 2 ? headW - 2 : row > headH - 3 ? headW - 1 : headW;
    const x = cx + rowLean - Math.floor(w / 2);
    const bowedFace = row >= Math.floor(headH * 0.42) && row <= headH - 3;
    const tone = row < 5 ? hair.mid : bowedFace ? skin.dk : row > headH - 3 ? skin.lo : skin.mid;
    px(ctx, x - 1, y + row, PALETTE.outline, w + 2, 1);
    px(ctx, x, y + row, tone, w, 1);
    px(ctx, x, y + row, row < 2 ? hair.hi : skin.hi, 1, 1);
    px(ctx, x + w - 1, y + row, row < 2 ? hair.dk : skin.dk, 1, 1);
  }

  // The faces hang forward after death: hair and brow shadow hide the eyes.
  px(ctx, cx - Math.floor(headW / 2), y - 1, PALETTE.outline, headW, 1);
  px(ctx, cx - Math.floor(headW / 2) + 1, y - 1, hair.hi, Math.max(2, headW - 2), 1);
  px(ctx, cx - Math.floor(headW / 2) - 1, y + 3, PALETTE.outline, headW + 2, 1);
  px(ctx, cx - Math.floor(headW / 2), y + 2, hair.dk, headW, 4);
  px(ctx, cx - Math.floor(headW / 2) + 1, y + 5, PALETTE.void, Math.max(3, headW - 2), 3);
  px(ctx, cx - 2 + Math.round(tilt * 0.35), y + headH - 2, skin.lo, 4, 1);
  px(ctx, cx - 1 + Math.round(tilt * 0.45), y + headH - 1, bloodDark, 3, 1);
  px(ctx, cx + Math.round(tilt * 0.45), y + headH, (seed & 1) === 0 ? bloodDark : blood, 1, 4);
}

const FARM_CROSS_VICTIM_MEMBERS = {
  father: {
    shoulders: 15,
    waist: 9,
    torsoLength: 16,
    legLength: 24,
    headHeight: 9,
    armSize: 2,
    legSize: 2,
    coatTail: 5,
    lean: -1,
    headTilt: -1,
    headDrop: 5,
    coat: victimRamp(PALETTE.stoneDark, PALETTE.clothDark, PALETTE.stoneDark, PALETTE.void),
    pants: victimRamp(PALETTE.stoneMid, PALETTE.stoneDark, PALETTE.clothDark, PALETTE.void),
    skin: victimRamp(PALETTE.skinLight, PALETTE.skinMid, PALETTE.skinDark, PALETTE.clothDark),
    hair: victimRamp(PALETTE.woodLight, PALETTE.woodDark, PALETTE.clothDark, PALETTE.void),
    boot: victimRamp(PALETTE.rustMid, PALETTE.rustDark, PALETTE.void, PALETTE.void),
    belt: PALETTE.rustDark,
    accent: PALETTE.rustLight
  },
  mother: {
    shoulders: 13,
    waist: 8,
    torsoLength: 17,
    legLength: 23,
    headHeight: 9,
    armSize: 2,
    legSize: 2,
    coatTail: 9,
    skirt: true,
    lean: 1,
    headTilt: 1,
    headDrop: 6,
    coat: victimRamp(PALETTE.hostBone, PALETTE.clothTan, PALETTE.stoneDust, PALETTE.stoneMid),
    pants: victimRamp(PALETTE.stoneMid, PALETTE.clothDark, PALETTE.stoneDark, PALETTE.void),
    skin: victimRamp(PALETTE.hostBone, PALETTE.skinLight, PALETTE.skinMid, PALETTE.skinDark),
    hair: victimRamp(PALETTE.rustLight, PALETTE.rustMid, PALETTE.rustDark, PALETTE.clothDark),
    boot: victimRamp(PALETTE.rustMid, PALETTE.rustDark, PALETTE.void, PALETTE.void),
    belt: PALETTE.clothRed,
    accent: PALETTE.clothRed
  },
  grandparent: {
    shoulders: 14,
    waist: 8,
    torsoLength: 16,
    legLength: 22,
    headHeight: 9,
    armSize: 2,
    legSize: 2,
    coatTail: 6,
    hunch: 2,
    lean: -2,
    headTilt: -2,
    headDrop: 6,
    coat: victimRamp(PALETTE.hostBone, PALETTE.stoneDust, PALETTE.stoneMid, PALETTE.stoneDark),
    pants: victimRamp(PALETTE.stoneMid, PALETTE.stoneDark, PALETTE.clothDark, PALETTE.void),
    skin: victimRamp(PALETTE.hostBone, PALETTE.skinLight, PALETTE.skinMid, PALETTE.skinDark),
    hair: victimRamp(PALETTE.hostBone, PALETTE.stoneDust, PALETTE.stoneMid, PALETTE.stoneDark),
    boot: victimRamp(PALETTE.rustMid, PALETTE.rustDark, PALETTE.void, PALETTE.void),
    belt: PALETTE.clothTan,
    accent: PALETTE.clothTan
  },
  'older-child': {
    shoulders: 11,
    waist: 7,
    torsoLength: 14,
    legLength: 19,
    headHeight: 9,
    headWidth: 7,
    armSize: 1,
    legSize: 1,
    coatTail: 5,
    lean: 1,
    headTilt: 1,
    headDrop: 5,
    coat: victimRamp(PALETTE.clothBlue, PALETTE.clothBlueDark, PALETTE.clothDark, PALETTE.void),
    pants: victimRamp(PALETTE.stoneMid, PALETTE.clothDark, PALETTE.stoneDark, PALETTE.void),
    skin: victimRamp(PALETTE.skinLight, PALETTE.skinMid, PALETTE.skinDark, PALETTE.clothDark),
    hair: victimRamp(PALETTE.woodLight, PALETTE.woodDark, PALETTE.clothDark, PALETTE.void),
    boot: victimRamp(PALETTE.rustMid, PALETTE.rustDark, PALETTE.void, PALETTE.void),
    belt: PALETTE.rustDark,
    accent: PALETTE.clothTan
  },
  'younger-child': {
    shoulders: 10,
    waist: 7,
    torsoLength: 13,
    legLength: 17,
    headHeight: 9,
    headWidth: 7,
    armSize: 1,
    legSize: 1,
    coatTail: 7,
    skirt: true,
    lean: 0,
    headTilt: 0,
    headDrop: 5,
    coat: victimRamp(PALETTE.hostBone, PALETTE.clothTan, PALETTE.stoneDust, PALETTE.stoneMid),
    pants: victimRamp(PALETTE.clothBlue, PALETTE.clothBlueDark, PALETTE.clothDark, PALETTE.void),
    skin: victimRamp(PALETTE.hostBone, PALETTE.skinLight, PALETTE.skinMid, PALETTE.skinDark),
    hair: victimRamp(PALETTE.rustLight, PALETTE.rustDark, PALETTE.clothDark, PALETTE.void),
    boot: victimRamp(PALETTE.rustMid, PALETTE.rustDark, PALETTE.void, PALETTE.void),
    belt: PALETTE.clothBlue,
    accent: PALETTE.clothBlue
  }
};

export function drawFarmCrossVictim(ctx, cx, cy, seed, opts = {}) {
  const member = FARM_CROSS_VICTIM_MEMBERS[opts.member] ?? FARM_CROSS_VICTIM_MEMBERS.father;
  const rng = rngFrom(hash2D(seed + 257, seed * 7 + 19));
  const jitter = Math.round((rng() - 0.5) * 2);
  const lean = member.lean + jitter;
  const stature = Math.max(0.68, member.legLength / 24);
  const footY = cy - 4;
  const hipY = footY - member.legLength;
  const shoulderY = hipY - member.torsoLength + Math.floor((member.hunch ?? 0) * 0.55);
  const headY = shoulderY - member.headHeight + Math.floor((member.hunch ?? 0) * 0.25);
  const barY = shoulderY - Math.round(5 * stature);
  const topY = headY - Math.round(14 * stature);
  const beamHalf = Math.max(15, Math.round(member.shoulders * 1.45 + 4));
  const postW = Math.max(5, Math.round(6 * stature));
  const blood = PALETTE.hostRed;
  const darkBlood = PALETTE.rustDark;

  drawShadowBlob(ctx, cx, cy + 4, Math.round(32 * stature), Math.round(13 * stature));
  ctx.save();
  ctx.globalAlpha = 0.86;
  drawIsoDiamond(ctx, cx + 1, cy + 3, Math.round(32 * stature), Math.round(14 * stature), darkBlood);
  ctx.globalAlpha = 0.62;
  drawIsoDiamond(ctx, cx - 2, cy + 2, Math.round(20 * stature), Math.round(9 * stature), blood);
  ctx.globalAlpha = 0.5;
  drawIsoDiamond(ctx, cx + 5, cy + 6, Math.round(15 * stature), Math.round(6 * stature), darkBlood);
  ctx.restore();
  drawNoisePixels(ctx, cx - 18, cy - 9, 36, 17, [blood, darkBlood], 0.075, seed);

  // Rough farm timber, assembled by the cult from fence rails and shed planks.
  px(ctx, cx - Math.floor(postW / 2) - 1, topY - 1, PALETTE.outline, postW + 2, footY - topY + 5);
  px(ctx, cx - Math.floor(postW / 2), topY, PALETTE.woodDark, postW, footY - topY + 3);
  px(ctx, cx - Math.floor(postW / 2), topY, PALETTE.woodMid, Math.max(2, Math.round(postW * 0.35)), footY - topY + 1);
  px(ctx, cx + Math.floor(postW / 2) - 1, topY + 7, PALETTE.woodLight, 1, Math.round(28 * stature));
  px(ctx, cx - beamHalf - 1, barY - 3, PALETTE.outline, beamHalf * 2 + 3, Math.max(6, Math.round(8 * stature)));
  px(ctx, cx - beamHalf, barY - 2, PALETTE.woodDark, beamHalf * 2 + 1, Math.max(4, Math.round(6 * stature)));
  px(ctx, cx - beamHalf + 2, barY - 2, PALETTE.woodMid, beamHalf * 2 - 3, 2);
  px(ctx, cx - beamHalf + 4, barY + 3, darkBlood, 2, Math.round(6 * stature));
  px(ctx, cx + beamHalf - 5, barY + 2, darkBlood, 2, Math.round(6 * stature));
  px(ctx, cx - 1, shoulderY + 5, darkBlood, 2, footY - shoulderY - 5);

  // Wrists are nailed wide to the beam, with the dead weight pulling the arms down.
  const wristL = { x: cx - beamHalf + 2, y: barY + 2 };
  const wristR = { x: cx + beamHalf - 3, y: barY + 2 };
  const shoulderHalf = Math.floor(member.shoulders / 2);
  const shL = { x: cx - shoulderHalf + lean, y: shoulderY + 3 };
  const shR = { x: cx + shoulderHalf + lean, y: shoulderY + 3 };
  const elbowL = {
    x: Math.round((wristL.x + shL.x) / 2) - 1,
    y: barY + Math.round(8 * stature)
  };
  const elbowR = {
    x: Math.round((wristR.x + shR.x) / 2) + 1,
    y: barY + Math.round(8 * stature)
  };
  drawVictimJointedLimb(ctx, [wristL, elbowL, shL], member.coat, member.armSize, true);
  drawVictimJointedLimb(ctx, [wristR, elbowR, shR], member.coat, member.armSize, false);
  drawVictimHandAndNail(ctx, wristL, member.skin, blood, darkBlood);
  drawVictimHandAndNail(ctx, wristR, member.skin, blood, darkBlood);

  const neckX = cx + lean;
  const neckY = shoulderY - 5;
  px(ctx, neckX - 2, neckY - 2, PALETTE.outline, 5, Math.max(5, Math.round(6 * stature)));
  px(ctx, neckX - 1, neckY - 1, member.skin.mid, 3, 5);
  px(ctx, neckX - 2, neckY - 2, member.skin.hi, 1, 5);

  // The throat cut stays small and dark so the actor silhouette remains readable.
  px(ctx, neckX - 5, neckY + 1, darkBlood, 10, 2);
  px(ctx, neckX - 3, neckY + 1, blood, 6, 1);
  px(ctx, neckX - 1, neckY + 3, darkBlood, 2, 9);
  px(ctx, neckX + 2, neckY + 5, blood, 1, 7);

  const legSpread = Math.max(3, Math.round(member.shoulders * 0.32));
  const kneeY = hipY + Math.round(member.legLength * 0.5);
  const farLeg = [
    { x: cx + lean - legSpread, y: hipY },
    { x: cx + lean - legSpread - 1, y: kneeY },
    { x: cx - 3, y: footY - 1 }
  ];
  const nearLeg = [
    { x: cx + lean + legSpread, y: hipY },
    { x: cx + lean + legSpread + 1, y: kneeY + 1 },
    { x: cx + 3, y: footY }
  ];
  drawVictimJointedLimb(ctx, farLeg, member.pants, member.legSize, true);
  drawVictimBoot(ctx, farLeg[2].x, farLeg[2].y, -1, member.boot, true);
  drawVictimJointedLimb(ctx, nearLeg, member.pants, member.legSize, false);
  drawVictimBoot(ctx, nearLeg[2].x, nearLeg[2].y, 1, member.boot, false);

  // Torso clothing varies by family member so the five bodies read as a household.
  const torsoTop = shoulderY - 1;
  const torsoH = Math.max(12, hipY - torsoTop + 1);
  drawVictimTaperedSpan(ctx, cx + lean, torsoTop, member.shoulders, member.waist, torsoH, member.coat, lean, seed % 5);
  px(ctx, cx + lean - Math.floor(member.shoulders / 2) + 1, shoulderY + 2, member.accent, 2, Math.max(6, torsoH - 4));
  linePx(ctx, cx + lean - 5, shoulderY + 4, cx + lean + 4, hipY - 3, member.belt, 1);
  px(ctx, cx + lean - Math.floor(member.waist / 2) - 1, hipY - 2, PALETTE.outline, member.waist + 2, 3);
  px(ctx, cx + lean - Math.floor(member.waist / 2), hipY - 2, member.belt, member.waist, 1);

  const tailH = member.coatTail ?? 0;
  for (let row = 0; row < tailH; row += 1) {
    const widen = member.skirt ? row : Math.floor(row * 0.45);
    const w = Math.max(member.waist + 1, member.waist + widen);
    const x = cx + lean - Math.floor(w / 2);
    const y = hipY + row - 1;
    px(ctx, x - 1, y, PALETTE.outline, w + 2, 1);
    px(ctx, x, y, row < 2 ? member.coat.mid : member.coat.lo, w, 1);
    px(ctx, x, y, member.coat.hi, 1, 1);
    if (row % 3 === 1) px(ctx, x + w - 2, y, member.coat.dk, 1, 1);
  }

  // Ordinary human head, sized and shaded like the actor sprites.
  drawVictimHead(ctx, cx + lean, headY + (member.headDrop ?? 3), member, seed, blood, darkBlood);
  // Foreground wound pass: all five are dead from opened throats, not living captives.
  px(ctx, neckX - 6, neckY + 2, PALETTE.outline, 12, 1);
  px(ctx, neckX - 5, neckY + 2, darkBlood, 10, 2);
  px(ctx, neckX - 3, neckY + 2, blood, 6, 1);
  px(ctx, neckX - 1, neckY + 4, darkBlood, 2, 9);
  px(ctx, neckX + 2, neckY + 6, blood, 1, 7);
  px(ctx, cx - 5, footY - 4, PALETTE.outline, 11, 4);
  px(ctx, cx - 4, footY - 3, PALETTE.stoneDust, 8, 2);
  px(ctx, cx - 2, footY - 1, PALETTE.stoneLight, 5, 2);
  px(ctx, cx - 7, footY - 1, darkBlood, 14, 3);
  px(ctx, cx - 4, footY, blood, 8, 2);
  px(ctx, cx - 1, footY + 2, darkBlood, 3, 3);

  // Cult sign cut into the lower post, small but legible beside the blood sigils.
  const markY = cy - Math.round(18 * stature);
  px(ctx, cx, markY - 5, darkBlood, 1, 10);
  px(ctx, cx - 3, markY + 2, darkBlood, 7, 1);
  px(ctx, cx - 1, markY + 6, darkBlood, 3, 1);
}

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
