import { PALETTE } from '../palette.js';

import { directionSide } from './spriteBake.js';



export function drawCutthroatDetails({ ctx, px, linePx, detailPx, detailLinePx, meta, pose, shoulderY, hipY, headY, torso }) {
  const side = directionSide(meta);
  const c = torso.bodyCx;
  const redSide = meta.back ? -1 : 1;

  // Mask slit and stained clerical stole. The figure is still human, but the
  // clothes read as scavenged ritual gear rather than clean raider armor.
  px(ctx, c - 3, headY + 4, PALETTE.void, 5, 1);
  linePx(ctx, c - redSide * 5, shoulderY + 2, c + redSide * 4, hipY + 2 + (pose.cloth ?? 0), PALETTE.clothRed);
  linePx(ctx, c - redSide * 4, shoulderY + 2, c + redSide * 5, hipY, PALETTE.hostRed);

  px(ctx, c - 10, shoulderY + 4, PALETTE.rustMid, 5, 5);
  px(ctx, c - 10, shoulderY + 4, PALETTE.rustLight, 4, 1);
  px(ctx, c + 6, hipY - 8, PALETTE.clothDark, 4, 9);
  px(ctx, c + 7, hipY - 6, PALETTE.skinDark, 2, 3);

  const knifeX = c + side * 9;
  linePx(ctx, knifeX, shoulderY + 9, knifeX + side * 2, hipY - 4, PALETTE.hostBone);
  px(ctx, knifeX, shoulderY + 9, PALETTE.stoneLight, 1, 8);
  px(ctx, c - 1, hipY - 4, PALETTE.hostBone, 2, 2);
  detailLinePx(ctx, c - redSide * 4.5, shoulderY + 2.5, c + redSide * 4.5, hipY + 0.5, PALETTE.clothRed);
  detailLinePx(ctx, knifeX + side * 0.5, shoulderY + 9.5, knifeX + side * 2.5, hipY - 4.5, PALETTE.stoneLight);
  detailPx(ctx, c - 0.5, hipY - 3.5, PALETTE.hostBone);
}

export function drawHostDetails({ ctx, px, linePx, detailPx, detailLinePx, meta, pose, shoulderY, hipY, headY, footY, torso }) {
  const c = torso.bodyCx;
  const pulse = pose.bob ? 1 : 0;
  const half = Math.max(6, Math.floor(torso.shoulderW / 2));
  const side = directionSide(meta);
  const openSide = meta.view === 'side' ? side : 1;
  const brokenSide = -openSide;

  // Broken aureole: one side still forms a false holy ring, the other has
  // dropped into splinters behind the skull.
  for (let n = 0; n < 22; n += 1) {
    if (n === 4 || n === 5 || n === 11 || n === 15 || n === 16) continue;
    const a = Math.PI * (0.02 + n * 0.046);
    const bend = Math.cos(a) < 0 ? -3 : 1;
    const hx = c + Math.round(Math.cos(a) * (16 + bend));
    const hy = headY + 4 - Math.round(Math.sin(a) * (13 + (n % 2))) + (pulse && n % 5 === 0 ? 1 : 0);
    px(ctx, hx, hy, PALETTE.hostBone, n % 3 === 0 ? 2 : 1, 1);
  }
  for (let i = 0; i < 5; i += 1) {
    const sx = c + brokenSide * (15 + i);
    const sy = headY + 4 + i * 3;
    px(ctx, sx, sy, i % 2 ? PALETTE.hostGold : PALETTE.hostBone, 2, 1);
  }

  if (meta.back) {
    // From behind: a ridge of bone-thorns erupting up the spine.
    for (let i = 0; i < 7; i += 1) {
      const ty = shoulderY + 2 + i * 3;
      linePx(ctx, c, ty, c, ty - (4 + (i % 2) * 3), PALETTE.hostBone, 1);
      px(ctx, c - 1, ty, PALETTE.hostBone, 3, 1);
    }
    px(ctx, c - half, shoulderY + 5, PALETTE.hostGold, half * 2, 1);
  } else {
    // The chest is pried open unevenly, like failed chapel doors around a
    // black-gold wound. One side hangs lower, which keeps the silhouette human
    // enough to be ugly instead of decorative.
    const cavTop = shoulderY + 5;
    const cavH = Math.max(8, hipY - cavTop - 1);
    px(ctx, c - 5, cavTop, PALETTE.void, 10, cavH + 2);
    px(ctx, c - 3, cavTop + 1, PALETTE.hostBlack, 7, cavH);
    for (let r = 0; r < 5; r += 1) {
      const ry = cavTop + 1 + r * 3;
      const sp = 4 + r;
      px(ctx, c - 4 - sp, ry + (r > 2 ? 1 : 0), PALETTE.hostBone, sp, 1);
      px(ctx, c + 4, ry - (r % 2), PALETTE.hostBone, sp + 1, 1);
      px(ctx, c - 4 - sp, ry + 1, PALETTE.hostGold, 1, 1);
      px(ctx, c + 3 + sp, ry, PALETTE.hostGold, 1, 1);
    }
    const wy = cavTop + 3;
    px(ctx, c - 3, wy, PALETTE.hostRed, 7, 7);
    px(ctx, c - 2, wy + 1, pulse ? PALETTE.hostGlow : PALETTE.hostGold, 4, 5);
    px(ctx, c, wy + 2, pulse ? PALETTE.flash : PALETTE.hostBone, 1, 2);
    // a second screaming mouth low in the ribs, bone teeth
    const my = cavTop + cavH - 3;
    px(ctx, c - 5, my, PALETTE.void, 11, 4);
    for (let t = 0; t < 6; t += 1) px(ctx, c - 5 + t * 2, my, PALETTE.hostBone, 1, 4);
    // black-gold veins radiating from the wound
    linePx(ctx, c, wy + 2, c - half - 1, shoulderY + 2, PALETTE.hostGold);
    linePx(ctx, c, wy + 2, c + half + 1, shoulderY + 3, PALETTE.hostGold);
    linePx(ctx, c, wy + 4, c - 5, hipY + 2, PALETTE.hostGold);
    linePx(ctx, c, wy + 4, c + 5, hipY + 1, PALETTE.hostGold);
    // hanging viscera dripping from the cavity
    px(ctx, c - 2, hipY, PALETTE.hostRed, 2, 5);
    px(ctx, c + 2, hipY, PALETTE.hostRed, 1, 4);
  }

  // Shoulder thorns are not paired cleanly: one side becomes a crown, the other
  // a snapped rack of bone.
  linePx(ctx, c - half, shoulderY + 1, c - half - 7, shoulderY - 7, PALETTE.hostBone, 1);
  linePx(ctx, c - half + 1, shoulderY, c - half - 2, shoulderY - 10, PALETTE.hostBone, 1);
  linePx(ctx, c + half, shoulderY + 1, c + half + 8, shoulderY - 4, PALETTE.hostBone, 1);
  linePx(ctx, c + half - 1, shoulderY, c + half + 2, shoulderY - 9, PALETTE.hostBone, 1);
  px(ctx, c + openSide * (half + 7), shoulderY - 4, PALETTE.hostGold, 1, 3);

  // One prayer-arm is fused across the wound. The other drags low enough that
  // the fingers scrape the floor, giving the creature a penitent, broken gait.
  const dragHandY = footY - 7 + pulse;
  const foldHandY = hipY - 1;
  const dragX = c + openSide * (half + 4);
  const foldX = c + brokenSide * 3;
  linePx(ctx, c + openSide * (half - 1), shoulderY + 4, dragX, dragHandY, PALETTE.hostBone, 2);
  linePx(ctx, c + brokenSide * (half - 1), shoulderY + 5, foldX, foldHandY, PALETTE.hostBone, 2);
  px(ctx, foldX - 2, foldHandY - 2, PALETTE.hostBone, 5, 7);
  px(ctx, foldX - 1, foldHandY, PALETTE.hostBlack, 3, 3);
  for (let f = 0; f < 6; f += 1) {
    px(ctx, dragX + (f - 2), dragHandY, PALETTE.hostBone, 1, 4 + (f % 3));
  }

  // Kneeling mass: cover the clean humanoid legs with wet vestment-flesh, then
  // expose bent shin-bone and a low wound so the body reads as forced down.
  const robeTop = hipY - 2;
  const robeRows = footY - robeTop + 2;
  for (let row = 0; row < robeRows; row += 1) {
    const swell = row < 8 ? row : 8 - Math.max(0, row - 14);
    const taper = Math.max(0, row - 10);
    const w = Math.max(11, half * 2 + 2 + Math.max(0, swell) - Math.floor(taper * 1.8));
    const drag = row > 7 ? Math.floor((row - 7) * 0.35) * openSide : 0;
    const rag = (row % 4) - 1;
    const x = c - Math.floor(w / 2) + drag + rag;
    px(ctx, x, robeTop + row, PALETTE.hostBlack, w, 1);
    if (row % 5 === 2) px(ctx, x + 2, robeTop + row, PALETTE.hostRed, Math.max(3, w - 7), 1);
    if (row % 7 === 0) px(ctx, x + w - 4, robeTop + row, PALETTE.hostGold, 2, 1);
  }
  px(ctx, c - half - 5, footY - 12, PALETTE.hostBone, 10, 3);
  px(ctx, c + half - 4, footY - 8, PALETTE.hostBone, 11, 3);
  linePx(ctx, c - half - 1, footY - 10, c - 3, footY - 4, PALETTE.hostBone, 1);
  linePx(ctx, c + half + 4, footY - 8, c + 5, footY - 3, PALETTE.hostBone, 1);
  px(ctx, c - half - 1, footY - 4, PALETTE.hostGold, half + 3, 1);
  px(ctx, c + 2, footY - 3, PALETTE.hostGold, half - 1, 1);
  px(ctx, c - half + 2, footY - 2, PALETTE.hostRed, half + 1, 2);
  px(ctx, c + 3, footY - 1, PALETTE.hostRed, half - 2, 1);
  detailLinePx(ctx, c - half + 0.5, shoulderY + 0.5, c - half - 6.5, shoulderY - 6.5, PALETTE.hostBone);
  detailLinePx(ctx, c + half - 0.5, shoulderY + 0.5, c + half + 7.5, shoulderY - 3.5, PALETTE.stoneDust);
  detailLinePx(ctx, c + openSide * 1.5, shoulderY + 5.5, c + openSide * 3.5, hipY - 1.5, PALETTE.hostGold);
  detailLinePx(ctx, dragX - 1.5, dragHandY + 0.5, dragX + 2.5, dragHandY + 3.5, PALETTE.hostBone);
  detailPx(ctx, c + openSide * 2.5, footY - 2.5, PALETTE.hostGold);
}

export function drawChoirDetails({ ctx, px, linePx, detailPx, detailLinePx, meta, pose, shoulderY, hipY, headY, torso }) {
  const side = directionSide(meta);
  const c = torso.bodyCx;
  const redSide = meta.back ? -1 : 1;

  // Stained clerical stole down the front of the robe.
  linePx(ctx, c - redSide * 5, shoulderY + 2, c + redSide * 4, hipY + 2 + (pose.cloth ?? 0), PALETTE.clothRed);
  linePx(ctx, c - redSide * 4, shoulderY + 3, c + redSide * 5, hipY, PALETTE.hostRed);

  if (!meta.back) {
    // A blood-blackened mouth and chin below the cowl: they eat the opened flesh.
    px(ctx, c - 2, headY + 6, PALETTE.hostRed, 5, 2);
    px(ctx, c - 1, headY + 8, PALETTE.hostRed, 3, 1);
    // First black-gold creeping at the throat — they are slowly opening too.
    px(ctx, c, headY + 9, PALETTE.hostGold, 1, 3);
    // A held strip of pale sacrament-flesh, dripping.
    const hx = c + side * 6;
    px(ctx, hx - 1, hipY - 6, PALETTE.hostBone, 3, 5);
    px(ctx, hx, hipY - 1, PALETTE.hostRed, 1, 3);
    // Blood-soaked hands.
    px(ctx, c - side * 7, hipY - 3, PALETTE.hostRed, 3, 2);
    px(ctx, hx - 1, hipY - 2, PALETTE.hostRed, 3, 1);
  }

  // A hooked bone rite-knife at the hip and a small censer on the belt.
  const knifeX = c + side * 8;
  linePx(ctx, knifeX, shoulderY + 9, knifeX + side * 2, hipY - 3, PALETTE.hostBone);
  px(ctx, knifeX + side * 2, hipY - 3, PALETTE.hostBone, 2, 2);
  px(ctx, c - 9, shoulderY + 5, PALETTE.rustMid, 4, 5);
  px(ctx, c - 9, shoulderY + 5, PALETTE.hostGold, 4, 1);
  detailLinePx(ctx, c - redSide * 4.5, shoulderY + 2.5, c + redSide * 4.5, hipY + 0.5, PALETTE.clothRed);
  detailLinePx(ctx, knifeX + side * 0.5, shoulderY + 9.5, knifeX + side * 2.5, hipY - 3.5, PALETTE.hostBone);
  if (!meta.back) {
    detailPx(ctx, c - 0.5, headY + 6.5, PALETTE.hostRed);
    detailPx(ctx, c + side * 6.5, hipY - 5.5, PALETTE.hostBone);
  }
}

export const CUT_STYLE = {
  shoulders: 16,
  waist: 9,
  torsoLength: 17,
  legLength: 23,
  headHeight: 9,
  legSize: 2,
  armSize: 2,
  coatTail: 8,
  coatHi: PALETTE.stoneDust,
  coat: PALETTE.stoneMid,
  coatLo: PALETTE.stoneDark,
  coatDk: PALETTE.void,
  pantsHi: PALETTE.stoneMid,
  pants: PALETTE.stoneDark,
  pantsLo: PALETTE.void,
  pantsDk: PALETTE.void,
  boot: PALETTE.rustDark,
  bootHi: PALETTE.rustMid,
  bootLo: PALETTE.void,
  skinHi: PALETTE.skinMid,
  skin: PALETTE.skinDark,
  skinLo: PALETTE.clothDark,
  skinDk: PALETTE.void,
  hair: PALETTE.clothDark,
  hairHi: PALETTE.rustDark,
  hood: PALETTE.clothDark,
  hoodHi: PALETTE.rustDark,
  belt: PALETTE.rustDark,
  weapon: PALETTE.hostBone,
  hunch: 2,
  maskedHead: true,
  decorate: drawCutthroatDetails
};

export const CHOIR_STYLE = {
  ...CUT_STYLE,
  coatHi: PALETTE.hostBone,
  coat: PALETTE.clothRed,
  coatLo: PALETTE.rustDark,
  pantsHi: PALETTE.stoneDust,
  pants: PALETTE.clothDark,
  hood: PALETTE.clothDark,
  hoodHi: PALETTE.hostBone,
  belt: PALETTE.hostGold,
  skinHi: PALETTE.skinLight,
  skin: PALETTE.skinMid,
  skinLo: PALETTE.skinDark,
  weapon: PALETTE.hostBone,
  hunch: 3,
  decorate: drawChoirDetails
};

export const PEN_STYLE = {
  shoulders: 24,
  waist: 11,
  torsoLength: 25,
  legLength: 22,
  headHeight: 11,
  legSize: 3,
  armSize: 3,
  coatTail: 13,
  coatHi: PALETTE.hostGold,
  coat: PALETTE.hostBlack,
  coatLo: PALETTE.void,
  coatDk: PALETTE.void,
  pantsHi: PALETTE.hostGold,
  pants: PALETTE.hostBlack,
  pantsLo: PALETTE.void,
  pantsDk: PALETTE.void,
  boot: PALETTE.hostBlack,
  bootHi: PALETTE.hostRed,
  bootLo: PALETTE.void,
  skinHi: PALETTE.hostBone,
  skin: PALETTE.hostBone,
  skinLo: PALETTE.hostGold,
  skinDk: PALETTE.hostBlack,
  hair: PALETTE.hostBlack,
  hairHi: PALETTE.hostGold,
  hood: PALETTE.hostBlack,
  hoodHi: PALETTE.hostGold,
  belt: PALETTE.hostRed,
  weapon: PALETTE.hostBone,
  hunch: 11,
  hostHead: true,
  decorate: drawHostDetails
};
