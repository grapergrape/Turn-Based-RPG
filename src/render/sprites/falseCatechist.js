import { PALETTE } from '../palette.js';

import { directionSide } from './spriteBake.js';

function drawFalseCatechistDetails({ ctx, px, linePx, detailPx, detailLinePx, meta, pose, shoulderY, hipY, headY, torso }) {
  const c = torso.bodyCx;
  const side = directionSide(meta);
  const openSide = meta.view === 'front' ? 1 : side;
  const attack = pose.attack ?? 0;
  const pulse = pose.bob ? 1 : 0;

  // Salome keeps the plain teacher's wrap and a chalk card at her belt. The
  // costume remains ordinary enough that the opening reads as something hidden
  // inside a known person.
  px(ctx, c - 7, shoulderY + 7, PALETTE.woodDark, 14, 3);
  px(ctx, c - 6, shoulderY + 7, PALETTE.clothTan, 9, 1);
  px(ctx, c + openSide * 6, hipY - 6, PALETTE.stoneDark, 5, 7);
  px(ctx, c + openSide * 6, hipY - 6, PALETTE.stoneDust, 4, 1);
  px(ctx, c + openSide * 7, hipY - 4, PALETTE.hostBone, 2, 3);

  if (meta.back && meta.view !== 'side') {
    // From behind the change is still subdermal: a thin black-gold line curls
    // under one shoulder and stops before it can become a symmetrical emblem.
    linePx(ctx, c - 1, shoulderY + 4, c + openSide * 4, hipY - 2, PALETTE.hostBlack, 2);
    linePx(ctx, c, shoulderY + 4, c + openSide * 4, hipY - 2, PALETTE.hostGold);
    px(ctx, c + openSide * 5, shoulderY + 8, PALETTE.skinDark, 3, 5);
    px(ctx, c + openSide * 6, shoulderY + 9, PALETTE.hostBone, 2, 3);
    detailLinePx(ctx, c - 0.5, shoulderY + 4.5, c + openSide * 4.5, hipY - 2.5, PALETTE.hostGold);
    detailPx(ctx, c + openSide * 6.5, shoulderY + 9.5, PALETTE.hostBone);
    return;
  }

  const mouthX = c + (meta.view === 'side' ? openSide : 1);
  const mouthTop = shoulderY + 5;
  const mouthHeight = Math.max(8, hipY - mouthTop - 1);
  const mouthWidth = attack >= 7 ? 5 : meta.view === 'side' ? 3 : 4;
  const cavityX = mouthX - Math.floor(mouthWidth / 2);

  // The sternum has opened into a narrow speaking wound. It never grows wide
  // enough to erase the human chest or read as the broad rib doors of a mature
  // Host form.
  px(ctx, cavityX - 1, mouthTop, PALETTE.hostBlack, mouthWidth + 2, mouthHeight);
  px(ctx, cavityX, mouthTop + 1, PALETTE.void, mouthWidth, mouthHeight - 2);
  px(ctx, cavityX + (openSide > 0 ? 0 : mouthWidth - 1), mouthTop + 1, PALETTE.hostRed, 1, mouthHeight - 2);
  for (let tooth = 0; tooth < 4; tooth += 1) {
    const y = mouthTop + 2 + tooth * 2;
    const x = cavityX + ((tooth + pulse) & 1 ? mouthWidth - 1 : 0);
    px(ctx, x, y, PALETTE.hostBone, Math.min(2, mouthWidth), 1);
  }
  px(ctx, mouthX, mouthTop + mouthHeight - 3, PALETTE.hostGold, 1, 2);

  // One rib edge lifts through the wrap. The opposite side stays held under
  // cloth, keeping the opening visibly incomplete and asymmetric.
  for (let rib = 0; rib < 3; rib += 1) {
    const y = mouthTop + 2 + rib * 3;
    const reach = 4 + rib + Math.floor(attack / 5);
    linePx(ctx, mouthX + openSide, y, mouthX + openSide * reach, y - 1 - (rib & 1), PALETTE.stoneDark, 2);
    linePx(ctx, mouthX + openSide, y - 1, mouthX + openSide * (reach - 1), y - 2 - (rib & 1), PALETTE.hostBone);
  }
  px(ctx, c - openSide * 5, shoulderY + 8, PALETTE.woodDark, 4, 9);

  // Her left hand is beginning to fuse into a prayer grip over the mouth. The
  // fingers can still be counted and the other hand remains human.
  const handX = c - openSide * 2;
  const handY = hipY - 5 - Math.floor(attack / 5);
  linePx(ctx, c - openSide * 7, shoulderY + 5, handX, handY, PALETTE.skinDark, 3);
  linePx(ctx, c - openSide * 7, shoulderY + 4, handX, handY - 1, PALETTE.skinMid, 2);
  px(ctx, handX - 2, handY - 2, PALETTE.skinDark, 5, 5);
  px(ctx, handX - 1, handY - 3, PALETTE.skinMid, 3, 4);
  for (let finger = 0; finger < 4; finger += 1) {
    const fingerX = handX - 2 + finger;
    const fingerTop = handY - 5 - (finger === 1 ? 1 : 0);
    linePx(ctx, handX, handY - 1, fingerX, fingerTop, finger >= 2 ? PALETTE.hostBone : PALETTE.skinMid);
  }

  // Sparse veins stay under the skin and converge on the speaking seam. There
  // is no dripping tissue and no light cast beyond the body.
  linePx(ctx, mouthX, mouthTop + 2, c - openSide * 4, shoulderY + 1, PALETTE.hostGold);
  linePx(ctx, mouthX, mouthTop + 5, c + openSide * 5, hipY + 1, PALETTE.hostGold);
  linePx(ctx, mouthX, mouthTop + 4, c, headY + 9, PALETTE.hostBlack, 2);
  linePx(ctx, mouthX, mouthTop + 4, c, headY + 9, PALETTE.hostGold);

  // The second voice has only begun to shape a throat mouth. At normal scale it
  // reads as a dark extra line that moves when the sternum mouth speaks.
  const throatY = headY + 9;
  px(ctx, c - 2, throatY, PALETTE.hostBlack, 5, 2);
  px(ctx, c - 1 + pulse, throatY, PALETTE.hostBone, 1, 1);
  detailLinePx(ctx, cavityX + 0.5, mouthTop + 1.5, cavityX + 0.5, mouthTop + mouthHeight - 2.5, PALETTE.hostRed);
  detailLinePx(ctx, mouthX + openSide * 0.5, mouthTop + 2.5, mouthX + openSide * 6.5, mouthTop + 0.5, PALETTE.hostBone);
  detailLinePx(ctx, c - openSide * 4.5, shoulderY + 5.5, handX - 0.5, handY - 1.5, PALETTE.skinLight);
  detailPx(ctx, c - 0.5 + pulse, throatY + 0.5, PALETTE.hostBone);
}

export const FALSE_CATECHIST_STYLE = Object.freeze({
  shoulders: 15,
  waist: 9,
  torsoLength: 17,
  legLength: 23,
  headHeight: 9,
  legSize: 2,
  armSize: 2,
  coatTail: 8,
  coatHi: PALETTE.clothTan,
  coat: PALETTE.clothDark,
  coatLo: PALETTE.outline,
  coatDk: PALETTE.void,
  pantsHi: PALETTE.stoneMid,
  pants: PALETTE.stoneDark,
  pantsLo: PALETTE.outline,
  pantsDk: PALETTE.void,
  boot: PALETTE.rustDark,
  bootHi: PALETTE.rustMid,
  bootLo: PALETTE.void,
  skinHi: PALETTE.skinLight,
  skin: PALETTE.skinMid,
  skinLo: PALETTE.skinDark,
  skinDk: PALETTE.outline,
  hair: PALETTE.clothDark,
  hairHi: PALETTE.rustDark,
  hood: PALETTE.clothDark,
  hoodHi: PALETTE.clothTan,
  belt: PALETTE.rustDark,
  weapon: null,
  hunch: 2,
  bareHead: true,
  hairStyle: 'tied',
  hostCorpse: true,
  deadWound: PALETTE.hostBlack,
  decorate: drawFalseCatechistDetails
});
