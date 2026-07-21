import { PALETTE } from '../palette.js';

import { directionSide } from './spriteBake.js';

function drawIntakeClerkDetails({ ctx, px, linePx, detailPx, detailLinePx, meta, pose, shoulderY, hipY, headY, footY, torso }) {
  const c = torso.bodyCx;
  const side = directionSide(meta);
  const openSide = meta.view === 'front' ? -1 : side;
  const pulse = pose.bob ? 1 : 0;
  const attack = pose.attack ?? 0;

  // A relief-office collar, one surviving brass tab, and a strip of blue clerk
  // cloth keep Junia legible as a particular worker rather than a generic form.
  px(ctx, c - 6, shoulderY + 2, PALETTE.clothTan, 12, 2);
  px(ctx, c - 5, shoulderY + 3, PALETTE.clothBlueDark, 10, 2);
  px(ctx, c - openSide * 5, shoulderY + 4, PALETTE.hostGold, 3, 3);
  px(ctx, c - openSide * 4, shoulderY + 4, PALETTE.stoneDust, 1, 1);

  // Pieces of the iron wicket remain fixed through one shoulder and hip. The
  // frame is crooked in every facing and drags below the coat on only one side.
  const frameSide = -openSide;
  const frameX = c + frameSide * 9;
  linePx(ctx, frameX, shoulderY - 2, frameX + frameSide * 2, hipY + 10, PALETTE.outline, 3);
  linePx(ctx, frameX, shoulderY - 2, frameX + frameSide * 2, hipY + 10, PALETTE.rustDark, 2);
  linePx(ctx, frameX - frameSide * 4, shoulderY + 4, frameX + frameSide * 4, shoulderY + 1, PALETTE.rustMid, 2);
  linePx(ctx, frameX - frameSide * 3, hipY + 2, frameX + frameSide * 5, hipY + 5, PALETTE.rustDark, 2);
  px(ctx, frameX + frameSide, hipY + 9, PALETTE.rustLight, 2, 2);

  if (meta.back && meta.view !== 'side') {
    // From behind, the body remains mostly coat and human spine. A thin
    // black-gold seam bends toward the shoulder pinned by the wicket.
    linePx(ctx, c, shoulderY + 3, c + openSide * 3, hipY - 1, PALETTE.hostBlack, 2);
    linePx(ctx, c, shoulderY + 3, c + openSide * 3, hipY - 1, PALETTE.hostGold);
    for (let rib = 0; rib < 3; rib += 1) {
      const y = shoulderY + 7 + rib * 3;
      linePx(ctx, c + openSide * 2, y, c + openSide * (5 + rib), y - 1, PALETTE.hostBone);
    }
    px(ctx, c + frameSide * 4, hipY + 2, PALETTE.clothBlue, 2, 7);
    detailLinePx(ctx, frameX + 0.5, shoulderY - 1.5, frameX + frameSide * 2.5, hipY + 9.5, PALETTE.rustLight);
    detailLinePx(ctx, c + 0.5, shoulderY + 3.5, c + openSide * 3.5, hipY - 1.5, PALETTE.hostGold);
    return;
  }

  // Junia's opened side contains several small speaking mouths between lifted
  // ribs. The opposite half of the torso stays closed beneath the clerk coat.
  const cavityX = c + openSide * 2 - (openSide < 0 ? 4 : 0);
  const cavityY = shoulderY + 6;
  const cavityH = Math.max(9, hipY - cavityY);
  px(ctx, cavityX - 1, cavityY, PALETTE.hostBlack, 6, cavityH);
  px(ctx, cavityX, cavityY + 1, PALETTE.void, 4, cavityH - 2);
  px(ctx, cavityX + (openSide < 0 ? 3 : 0), cavityY + 1, PALETTE.hostRed, 1, cavityH - 2);
  for (let rib = 0; rib < 3; rib += 1) {
    const y = cavityY + 2 + rib * 3;
    const rootX = c + openSide;
    const endX = c + openSide * (6 + rib);
    linePx(ctx, rootX, y + 1, endX, y - (rib & 1), PALETTE.stoneDark, 2);
    linePx(ctx, rootX, y, endX - openSide, y - 1 - (rib & 1), PALETTE.hostBone);
    px(ctx, cavityX + 1, y, PALETTE.hostBone, 2, 1);
  }
  px(ctx, cavityX + 1 + pulse, cavityY + cavityH - 3, PALETTE.hostGold, 1, 2);

  // Both hands have fused around the old wrist-bone stamp. The attack frame
  // drives that compact shape forward instead of growing a new weapon.
  const reach = attack >= 7 ? 6 : attack >= 2 ? 3 : 0;
  const palmX = c + side * reach;
  const palmY = hipY - 7 - Math.floor(reach / 3);
  linePx(ctx, c - 7, shoulderY + 6, palmX - 2, palmY, PALETTE.skinDark, 3);
  linePx(ctx, c + 7, shoulderY + 6, palmX + 2, palmY, PALETTE.stoneDark, 3);
  linePx(ctx, c - 6, shoulderY + 5, palmX - 1, palmY - 1, PALETTE.skinMid, 2);
  linePx(ctx, c + 6, shoulderY + 5, palmX + 1, palmY - 1, PALETTE.hostBone, 2);
  px(ctx, palmX - 3, palmY - 3, PALETTE.stoneDark, 7, 6);
  px(ctx, palmX - 2, palmY - 4, PALETTE.hostBone, 5, 6);
  px(ctx, palmX - 1, palmY - 5, PALETTE.skinMid, 3, 3);
  const stampX = palmX + side * (attack >= 7 ? 5 : 3);
  linePx(ctx, palmX, palmY - 1, stampX, palmY - 3, PALETTE.hostBone, 2);
  px(ctx, stampX - 2, palmY - 5, PALETTE.rustDark, 5, 4);
  px(ctx, stampX - 1, palmY - 5, PALETTE.rustLight, 3, 1);

  // One shin still takes weight. The other drags under a strip of denial-desk
  // wood, spoiling a clean standing silhouette without making the body huge.
  const dragX = c + openSide * 5;
  linePx(ctx, dragX, hipY + 5, dragX + openSide * 4, footY - 2, PALETTE.stoneDark, 3);
  linePx(ctx, dragX, hipY + 4, dragX + openSide * 3, footY - 3, PALETTE.hostBone, 2);
  linePx(ctx, c + frameSide * 3, hipY + 7, c + frameSide * 8, footY - 5, PALETTE.woodDark, 3);
  linePx(ctx, c + frameSide * 3, hipY + 6, c + frameSide * 7, footY - 6, PALETTE.woodMid, 2);

  // Sparse veins remain under the skin and converge on the opened ribs.
  linePx(ctx, c + openSide, cavityY + 3, c + openSide * 5, shoulderY + 1, PALETTE.hostGold);
  linePx(ctx, c + openSide, cavityY + 5, c - openSide * 3, hipY + 2, PALETTE.hostBlack, 2);
  linePx(ctx, c + openSide, cavityY + 5, c - openSide * 3, hipY + 2, PALETTE.hostGold);

  // A second mouth has formed at the throat, but the original face remains
  // recognizably human above it.
  px(ctx, c - 2, headY + 9, PALETTE.hostBlack, 5, 2);
  px(ctx, c - 1 + pulse, headY + 9, PALETTE.hostBone, 2, 1);
  detailLinePx(ctx, frameX + 0.5, shoulderY - 1.5, frameX + frameSide * 2.5, hipY + 9.5, PALETTE.rustLight);
  detailLinePx(ctx, cavityX + 0.5, cavityY + 1.5, cavityX + 0.5, cavityY + cavityH - 2.5, PALETTE.hostRed);
  detailLinePx(ctx, palmX - 1.5, palmY - 2.5, stampX - 0.5, palmY - 3.5, PALETTE.hostBone);
  detailPx(ctx, stampX - 0.5, palmY - 4.5, PALETTE.rustLight);
  detailPx(ctx, c - 0.5 + pulse, headY + 9.5, PALETTE.hostBone);
}

export const INTAKE_CLERK_STYLE = Object.freeze({
  shoulders: 15,
  waist: 9,
  torsoLength: 18,
  legLength: 21,
  headHeight: 9,
  legSize: 2,
  armSize: 2,
  coatTail: 9,
  coatHi: PALETTE.clothBlue,
  coat: PALETTE.clothBlueDark,
  coatLo: PALETTE.clothDark,
  coatDk: PALETTE.outline,
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
  hunch: 4,
  bareHead: true,
  hairStyle: 'bobbed',
  hostCorpse: true,
  deadWound: PALETTE.hostBlack,
  decorate: drawIntakeClerkDetails
});
