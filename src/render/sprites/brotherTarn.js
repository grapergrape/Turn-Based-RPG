import { PALETTE } from '../palette.js';

import { bakeActor, directionSide } from './spriteBake.js';

function drawTread(ctx, px, x, y, w, h, phase) {
  px(ctx, x - 1, y - 1, PALETTE.outline, w + 2, h + 2);
  px(ctx, x, y, PALETTE.void, w, h);
  px(ctx, x + 1, y + 1, PALETTE.stoneDark, w - 2, h - 2);
  px(ctx, x + 1, y + 1, PALETTE.stoneLight, Math.max(2, w - 4), 1);
  for (let row = phase; row < h - 1; row += 4) {
    px(ctx, x, y + row, PALETTE.rustDark, w, 1);
    px(ctx, x + 1, y + row, PALETTE.rustMid, Math.max(2, w - 3), 1);
  }
}

function drawFailureCuts(ctx, px, linePx, x, y, side, back) {
  const ink = back ? PALETTE.stoneDust : PALETTE.hostBone;
  for (let row = 0; row < 4; row += 1) {
    const length = row === 1 ? 7 : row === 3 ? 4 : 6;
    linePx(ctx, x, y + row * 3, x + side * length, y + row * 3, PALETTE.outline, 2);
    linePx(ctx, x, y + row * 3, x + side * length, y + row * 3, ink, 1);
  }
}

function drawBrotherTarnDetails({ ctx, px, linePx, detailPx, detailLinePx, meta, pose, footY, hipY, shoulderY, headY, torso }) {
  const side = directionSide(meta);
  const c = torso.bodyCx;
  const motion = Math.abs(pose.legA ?? 0) + Math.abs(pose.legB ?? 0);
  const phase = motion > 2 ? 1 : 3;

  // A low, mismatched tread assembly replaces the legs. The left tread is
  // longer and carries more rust, keeping the machine visibly field-repaired.
  const treadY = hipY + 4;
  drawTread(ctx, px, c - 15, treadY, 11, Math.max(10, footY - treadY + 3), phase);
  drawTread(ctx, px, c + 4, treadY + 2, 12, Math.max(8, footY - treadY + 1), phase === 1 ? 3 : 1);
  px(ctx, c - 7, hipY + 1, PALETTE.outline, 16, 9);
  px(ctx, c - 6, hipY + 2, PALETTE.stoneDark, 14, 7);
  px(ctx, c - 5, hipY + 2, PALETTE.stoneLight, 10, 1);
  px(ctx, c - 1, hipY + 4, PALETTE.rustDark, 7, 3);

  // Overlapping breastplates make the upper body read as armored machinery,
  // with upper-left highlights and a darker lower-right edge.
  px(ctx, c - 12, shoulderY + 1, PALETTE.outline, 25, 22);
  px(ctx, c - 11, shoulderY + 2, PALETTE.stoneMid, 23, 20);
  px(ctx, c - 10, shoulderY + 2, PALETTE.stoneLight, 16, 2);
  px(ctx, c - 10, shoulderY + 4, PALETTE.stoneDark, 2, 15);
  px(ctx, c + 8, shoulderY + 6, PALETTE.void, 4, 15);
  linePx(ctx, c, shoulderY + 3, c - 2, hipY, PALETTE.rustMid, 2);
  px(ctx, c - 1, shoulderY + 5, PALETTE.rustLight, 1, 9);

  // The right service plate is open. Its exposed windings never mirror to the
  // other side, so Cassian keeps an asymmetric silhouette in every facing.
  const openX = c + (meta.back ? -8 : 4);
  px(ctx, openX - 1, shoulderY + 7, PALETTE.outline, 10, 12);
  px(ctx, openX, shoulderY + 8, PALETTE.void, 8, 10);
  px(ctx, openX + 1, shoulderY + 9, PALETTE.rustDark, 2, 8);
  px(ctx, openX + 4, shoulderY + 9, PALETTE.hostGold, 1, 7);
  px(ctx, openX + 6, shoulderY + 10, PALETTE.stoneLight, 1, 5);
  for (let row = 0; row < 3; row += 1) {
    px(ctx, openX + 2, shoulderY + 10 + row * 3, PALETTE.rustLight, 4, 1);
  }

  // Boxed vox head with one broken grille bar and a narrow inspection lens.
  px(ctx, c - 8, headY - 2, PALETTE.outline, 17, 13);
  px(ctx, c - 7, headY - 1, PALETTE.stoneDark, 15, 11);
  px(ctx, c - 6, headY - 1, PALETTE.stoneLight, 10, 2);
  px(ctx, c - 5, headY + 2, PALETTE.void, 11, 3);
  px(ctx, c - 4, headY + 2, PALETTE.hostGold, 3, 1);
  if (!meta.back) {
    for (let bar = 0; bar < 5; bar += 1) {
      if (bar === 3) continue;
      px(ctx, c - 5 + bar * 3, headY + 7, PALETTE.stoneDust, 1, 3);
    }
    px(ctx, c + 3, headY + 9, PALETTE.rustDark, 4, 1);
  } else {
    px(ctx, c - 4, headY + 7, PALETTE.rustMid, 9, 2);
    px(ctx, c - 3, headY + 7, PALETTE.rustLight, 5, 1);
  }

  // One fixed weapon mount. The opposite shoulder carries etched failure
  // names, visible as irregular pale cuts rather than decorative trim.
  const mountSide = meta.view === 'side' ? side : 1;
  const mountX = c + mountSide * 13;
  px(ctx, mountX - 3, shoulderY + 3, PALETTE.outline, 8, 8);
  px(ctx, mountX - 2, shoulderY + 4, PALETTE.stoneDark, 6, 6);
  px(ctx, mountX - 2, shoulderY + 4, PALETTE.stoneLight, 4, 1);
  linePx(ctx, mountX + mountSide * 2, shoulderY + 6, mountX + mountSide * 9, shoulderY + 8, PALETTE.outline, 4);
  linePx(ctx, mountX + mountSide * 2, shoulderY + 6, mountX + mountSide * 9, shoulderY + 8, PALETTE.stoneDust, 2);
  px(ctx, mountX + mountSide * 8, shoulderY + 7, PALETTE.void, 3, 2);
  drawFailureCuts(ctx, px, linePx, c - mountSide * 5, shoulderY + 5, -mountSide, meta.back);

  // Hydraulic hoses and a small oil weep tie the torso to the tread chassis.
  linePx(ctx, c - 7, shoulderY + 18, c - 10, hipY + 7, PALETTE.outline, 3);
  linePx(ctx, c - 7, shoulderY + 18, c - 10, hipY + 7, PALETTE.rustDark, 1);
  linePx(ctx, c + 6, shoulderY + 19, c + 9, hipY + 8, PALETTE.outline, 3);
  linePx(ctx, c + 6, shoulderY + 19, c + 9, hipY + 8, PALETTE.hostGold, 1);
  px(ctx, c - 13, footY + 1, PALETTE.void, 5, 1);
  px(ctx, c - 12, footY, PALETTE.rustDark, 2, 1);

  // One-native-pixel machining marks: tread teeth, plate scoring, and copper
  // winding facets. These follow the asymmetric repair work instead of adding
  // a clean decorative border around the machine.
  detailLinePx(ctx, c - 14.5, treadY + 1.5, c - 5.5, treadY + 1.5, PALETTE.stoneLight);
  detailLinePx(ctx, c + 4.5, treadY + 3.5, c + 14.5, treadY + 3.5, PALETTE.rustMid);
  detailLinePx(ctx, c - 9.5, shoulderY + 3.5, c + 5.5, shoulderY + 3.5, PALETTE.stoneLight);
  detailLinePx(ctx, openX + 1.5, shoulderY + 9.5, openX + 6.5, shoulderY + 15.5, PALETTE.rustLight);
  detailPx(ctx, openX + 4.5, shoulderY + 10.5, PALETTE.hostGold);
  detailLinePx(ctx, c - 4.5, headY + 2.5, c + 4.5, headY + 2.5, PALETTE.stoneDust);
}

function drawBrotherTarnDeath({ ctx, w, h, frame, px, linePx, detailPx, detailLinePx }) {
  const groundY = h - 7;
  const fall = Math.min(1, frame / 5);
  const turn = Math.round(fall * 12);
  const c = Math.floor(w / 2);
  const y = groundY - 28 + Math.round(fall * 18);

  if (frame > 2) {
    px(ctx, c - 19, groundY + 3, PALETTE.void, 39, 3);
    px(ctx, c - 14, groundY + 2, PALETTE.rustDark, 25, 1);
  }
  px(ctx, c - 17 + turn, y, PALETTE.outline, 30, 19);
  px(ctx, c - 16 + turn, y + 1, PALETTE.stoneDark, 28, 17);
  px(ctx, c - 15 + turn, y + 1, PALETTE.stoneLight, 18, 2);
  px(ctx, c - 13 + turn, y + 5, PALETTE.void, 12, 8);
  px(ctx, c - 11 + turn, y + 6, PALETTE.rustMid, 2, 6);
  px(ctx, c - 6 + turn, y + 6, PALETTE.hostGold, 1, 5);
  drawTread(ctx, px, c - 20, groundY - 6, 18, 8, frame % 4);
  drawTread(ctx, px, c + 3, groundY - 4, 16, 7, (frame + 2) % 4);
  px(ctx, c + 9 + turn, y - 2, PALETTE.outline, 12, 10);
  px(ctx, c + 10 + turn, y - 1, PALETTE.stoneMid, 10, 8);
  px(ctx, c + 11 + turn, y, PALETTE.stoneLight, 6, 1);
  linePx(ctx, c + 10, y + 5, c + 23, y + 9, PALETTE.stoneDust, 2);
  detailLinePx(ctx, c - 14.5 + turn, y + 1.5, c + 7.5 + turn, y + 1.5, PALETTE.stoneLight);
  detailLinePx(ctx, c - 18.5, groundY - 4.5, c - 3.5, groundY - 4.5, PALETTE.rustMid);
  detailLinePx(ctx, c + 4.5, groundY - 2.5, c + 17.5, groundY - 2.5, PALETTE.stoneDark);
  detailPx(ctx, c - 5.5 + turn, y + 6.5, PALETTE.hostGold);
}

export const BROTHER_TARN_STYLE = Object.freeze({
  shoulders: 21,
  waist: 13,
  torsoLength: 22,
  legLength: 19,
  headHeight: 10,
  legSize: 3,
  armSize: 3,
  coatTail: 7,
  coatHi: PALETTE.stoneLight,
  coat: PALETTE.stoneMid,
  coatLo: PALETTE.stoneDark,
  coatDk: PALETTE.void,
  pantsHi: PALETTE.stoneLight,
  pants: PALETTE.stoneDark,
  pantsLo: PALETTE.void,
  pantsDk: PALETTE.void,
  boot: PALETTE.stoneDark,
  bootHi: PALETTE.rustMid,
  bootLo: PALETTE.void,
  skinHi: PALETTE.stoneLight,
  skin: PALETTE.stoneMid,
  skinLo: PALETTE.stoneDark,
  skinDk: PALETTE.void,
  hair: PALETTE.stoneDark,
  hairHi: PALETTE.stoneLight,
  hood: PALETTE.stoneDark,
  hoodHi: PALETTE.stoneLight,
  belt: PALETTE.rustDark,
  weapon: PALETTE.stoneDust,
  maskedHead: true,
  hunch: 4,
  decorate: drawBrotherTarnDetails,
  drawDeath: drawBrotherTarnDeath
});

export function bakeBrotherTarn() {
  return bakeActor(58, 78, BROTHER_TARN_STYLE);
}
