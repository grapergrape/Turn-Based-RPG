import { PALETTE } from '../palette.js';

import {
  CHOIR_STYLE,
  CUT_STYLE,
  drawChoirDetails,
  drawCutthroatDetails
} from './hostCreatures.js';
import { directionSide, px } from './spriteBake.js';



function drawSurvivorManDetails({ ctx, px, linePx, meta, pose, shoulderY, hipY, headY, torso }) {
  const side = directionSide(meta);
  const c = torso.bodyCx;
  // Rope belt, patched work coat, and a rolled sleeping cloth.
  linePx(ctx, c - 5, shoulderY + 5, c + 5, hipY - 5, PALETTE.rustDark);
  px(ctx, c - 6, hipY - 4, PALETTE.rustLight, 12, 2);
  px(ctx, c + side * 7, hipY - 14, PALETTE.clothTan, 5, 13);
  px(ctx, c + side * 7, hipY - 14, PALETTE.stoneDust, 5, 1);
  px(ctx, c - side * 8, shoulderY + 7, PALETTE.rustDark, 5, 4);
  px(ctx, c - side * 8, shoulderY + 7, PALETTE.rustLight, 4, 1);
  if (!meta.back) {
    px(ctx, c - 2, headY + 7 + (pose.bob ?? 0), PALETTE.skinDark, 4, 1);
  }
}

function drawSurvivorWomanDetails({ ctx, px, linePx, meta, pose, shoulderY, hipY, headY, torso }) {
  const side = directionSide(meta);
  const c = torso.bodyCx;
  // Shawl and apron layers make the figure read as a camp civilian, not militia.
  px(ctx, c - 8, shoulderY + 2, PALETTE.clothTan, 16, 3);
  linePx(ctx, c - 7, shoulderY + 4, c - 2, hipY + 2 + (pose.cloth ?? 0), PALETTE.clothTan);
  linePx(ctx, c + 7, shoulderY + 4, c + 2, hipY + 1, PALETTE.stoneDust);
  px(ctx, c - 5, hipY - 6, PALETTE.stoneMid, 10, 8);
  px(ctx, c - 4, hipY - 6, PALETTE.stoneDust, 7, 1);
  px(ctx, c + side * 7, hipY - 11, PALETTE.rustDark, 4, 8);
  px(ctx, c + side * 7, hipY - 11, PALETTE.rustLight, 3, 1);
  if (!meta.back) px(ctx, c + 2, headY + 8 + (pose.bob ?? 0), PALETTE.clothTan, 3, 1);
}

function drawSurvivorChildDetails({ ctx, px, linePx, meta, pose, shoulderY, hipY, headY, torso }) {
  const side = directionSide(meta);
  const c = torso.bodyCx;
  // Oversized coat hem, tiny satchel, and bare bright face.
  px(ctx, c - 6, hipY - 1, PALETTE.clothTan, 12, 3);
  px(ctx, c - 5, hipY + 1, PALETTE.stoneDust, 9, 1);
  linePx(ctx, c - side * 5, shoulderY + 4, c + side * 5, hipY - 3, PALETTE.rustDark);
  px(ctx, c + side * 6, hipY - 8, PALETTE.woodDark, 5, 5);
  px(ctx, c + side * 6, hipY - 8, PALETTE.woodLight, 4, 1);
  if (!meta.back) {
    px(ctx, c - 2, headY + 7 + (pose.bob ?? 0), PALETTE.skinLight, 4, 1);
  }
}

function drawCampStaff(ctx, linePx, x, topY, side, color = PALETTE.woodMid) {
  linePx(ctx, x, topY, x + side * 2, topY + 22, PALETTE.outline, 2);
  linePx(ctx, x, topY, x + side * 2, topY + 22, color, 1);
  px(ctx, x - 1, topY + 3, PALETTE.woodLight, 1, 7);
}

function drawCampBundle(ctx, px, x, y, tone = PALETTE.clothTan) {
  px(ctx, x - 3, y - 1, PALETTE.outline, 8, 13);
  px(ctx, x - 2, y, tone, 6, 11);
  px(ctx, x - 1, y, PALETTE.stoneDust, 4, 1);
  px(ctx, x - 3, y + 5, PALETTE.rustDark, 8, 1);
}

function drawCampJar(ctx, px, x, y) {
  px(ctx, x - 3, y, PALETTE.outline, 7, 9);
  px(ctx, x - 2, y - 1, PALETTE.stoneLight, 5, 2);
  px(ctx, x - 2, y + 1, PALETTE.stoneDust, 5, 7);
  px(ctx, x + 2, y + 2, PALETTE.stoneDark, 1, 6);
  px(ctx, x - 1, y + 1, PALETTE.hostBone, 1, 3);
}

function drawToolRoll(ctx, px, x, y) {
  px(ctx, x - 4, y - 1, PALETTE.outline, 10, 8);
  px(ctx, x - 3, y, PALETTE.clothDark, 8, 6);
  px(ctx, x - 2, y, PALETTE.stoneDust, 6, 1);
  px(ctx, x - 2, y + 2, PALETTE.rustLight, 1, 5);
  px(ctx, x + 1, y + 1, PALETTE.stoneLight, 1, 6);
  px(ctx, x + 4, y + 2, PALETTE.woodLight, 1, 4);
}

function drawCane(ctx, linePx, x, topY, side) {
  linePx(ctx, x, topY, x + side * 2, topY + 18, PALETTE.woodDark, 2);
  linePx(ctx, x, topY, x + side * 2, topY + 18, PALETTE.woodLight, 1);
  px(ctx, x - side * 2, topY, PALETTE.woodLight, 3, 1);
}

function drawShoulderPlate(ctx, px, x, y, side, color = PALETTE.stoneLight) {
  px(ctx, x - side * 2, y - 1, PALETTE.outline, 7, 6);
  px(ctx, x - side * 1, y, color, 5, 4);
  px(ctx, x - side * 1, y, PALETTE.stoneDust, 4, 1);
  px(ctx, x + side * 3, y + 2, PALETTE.stoneDark, 1, 3);
}

function drawSmallBook(ctx, px, x, y, color = PALETTE.woodMid) {
  px(ctx, x - 3, y - 1, PALETTE.outline, 8, 9);
  px(ctx, x - 2, y, color, 6, 7);
  px(ctx, x - 1, y, PALETTE.clothTan, 4, 1);
  px(ctx, x + 1, y + 1, PALETTE.rustDark, 1, 6);
  px(ctx, x - 1, y + 4, PALETTE.stoneDust, 4, 1);
}

function drawBandageSling(ctx, linePx, c, shoulderY, hipY, side) {
  linePx(ctx, c - side * 7, shoulderY + 4, c + side * 3, hipY - 4, PALETTE.hostBone, 1);
  px(ctx, c + side * 1, hipY - 5, PALETTE.hostBone, 7, 4);
  px(ctx, c + side * 2, hipY - 4, PALETTE.stoneDust, 5, 1);
}

function drawMedicineBag(ctx, px, x, y) {
  px(ctx, x - 4, y - 1, PALETTE.outline, 10, 12);
  px(ctx, x - 3, y, PALETTE.clothTan, 8, 10);
  px(ctx, x - 2, y, PALETTE.hostBone, 6, 1);
  px(ctx, x - 1, y + 3, PALETTE.clothRed, 2, 6);
  px(ctx, x - 3, y + 5, PALETTE.clothRed, 8, 2);
}

function drawMessageTube(ctx, linePx, x, y, side) {
  linePx(ctx, x, y, x + side * 4, y + 12, PALETTE.woodDark, 3);
  linePx(ctx, x, y, x + side * 4, y + 12, PALETTE.woodLight, 1);
  px(ctx, x + side * 3, y + 11, PALETTE.hostBone, 2, 2);
}

function drawRopeCoil(ctx, px, x, y) {
  px(ctx, x - 4, y - 1, PALETTE.outline, 10, 9);
  for (let row = 0; row < 7; row += 2) {
    px(ctx, x - 3, y + row, PALETTE.rustLight, 8, 1);
    px(ctx, x - 2, y + row + 1, PALETTE.rustDark, 6, 1);
  }
}

function drawCandleTray(ctx, px, linePx, c, y, side, count = 3) {
  linePx(ctx, c - side * 8, y + 5, c + side * 7, y + 7, PALETTE.stoneDark, 1);
  px(ctx, c - 8, y + 7, PALETTE.rustMid, 16, 2);
  for (let i = 0; i < count; i += 1) {
    const x = c - 5 + i * 5;
    px(ctx, x, y + 1, PALETTE.hostBone, 2, 6);
    px(ctx, x, y, PALETTE.ember, 1, 1);
    px(ctx, x + 1, y + 1, PALETTE.stoneDust, 1, 5);
  }
}

function drawChain(ctx, px, x, y, side, links = 5) {
  for (let i = 0; i < links; i += 1) {
    const lx = x + side * (i % 2);
    px(ctx, lx, y + i * 3, PALETTE.stoneLight, 3, 1);
    px(ctx, lx + 1, y + i * 3 + 1, PALETTE.stoneDark, 1, 2);
  }
}

function drawHumanModelExtras(args) {
  const { ctx, px, linePx, meta, pose, shoulderY, hipY, headY, torso, style } = args;
  const side = directionSide(meta);
  const c = torso.bodyCx;
  const bob = pose.bob ?? 0;
  const kits = Array.isArray(style.modelKits) ? style.modelKits : [];

  for (const kit of kits) {
    switch (kit) {
      case 'ledger':
        drawSmallBook(ctx, px, c + side * 9, hipY - 13, PALETTE.woodMid);
        break;
      case 'crate-pack':
        drawCampBundle(ctx, px, c + side * 9, hipY - 17, PALETTE.rustDark);
        drawCampBundle(ctx, px, c - side * 9, hipY - 10, PALETTE.clothTan);
        break;
      case 'cane':
        drawCane(ctx, linePx, c - side * 10, shoulderY + 8, -side);
        break;
      case 'tool-roll':
        drawToolRoll(ctx, px, c + side * 8, hipY - 12);
        break;
      case 'bandage-sling':
        drawBandageSling(ctx, linePx, c, shoulderY, hipY, side);
        break;
      case 'medicine-bag':
        drawMedicineBag(ctx, px, c + side * 9, hipY - 14);
        break;
      case 'water-jars':
        drawCampJar(ctx, px, c + side * 9, hipY - 13);
        drawCampJar(ctx, px, c - side * 9, hipY - 9);
        break;
      case 'message-tube':
        drawMessageTube(ctx, linePx, c + side * 8, shoulderY + 4, side);
        break;
      case 'long-apron':
        px(ctx, c - 5, shoulderY + 7, PALETTE.clothTan, 10, 15);
        px(ctx, c - 4, shoulderY + 7, PALETTE.hostBone, 7, 1);
        px(ctx, c - 3, hipY - 4, PALETTE.stoneDust, 7, 1);
        break;
      case 'prayer-cord':
        if (!meta.back) {
          linePx(ctx, c - 3, headY + 9 + bob, c + 2, hipY - 3, PALETTE.hostGold, 1);
          px(ctx, c + 1, hipY - 4, PALETTE.hostBone, 2, 3);
        }
        break;
      case 'scarred-face':
        if (!meta.back) linePx(ctx, c - 3, headY + 3 + bob, c + 2, headY + 6 + bob, PALETTE.rustDark, 1);
        break;
      case 'shoulder-plate':
        drawShoulderPlate(ctx, px, c - side * 10, shoulderY + 4, -side);
        break;
      case 'rope-coil':
        drawRopeCoil(ctx, px, c + side * 9, hipY - 12);
        break;
      case 'tally-tags':
        px(ctx, c - side * 9, shoulderY + 7, PALETTE.hostBone, 2, 5);
        px(ctx, c - side * 7, shoulderY + 9, PALETTE.stoneLight, 2, 5);
        px(ctx, c - side * 5, shoulderY + 8, PALETTE.hostGold, 2, 5);
        break;
      case 'child-token':
        if (!meta.back) px(ctx, c, headY + 10 + bob, PALETTE.hostGold, 2, 3);
        break;
      case 'candle-tray':
        if (!meta.back) drawCandleTray(ctx, px, linePx, c + side * 1, shoulderY + 8, side, 3);
        break;
      case 'throat-glass':
        if (!meta.back) {
          px(ctx, c - 3, headY + 8 + bob, PALETTE.hostRed, 7, 2);
          drawSmallBook(ctx, px, c + side * 8, hipY - 11, PALETTE.clothDark);
        }
        px(ctx, c - side * 9, hipY - 8, PALETTE.stoneLight, 4, 4);
        break;
      case 'sacrament-flesh':
        if (!meta.back) {
          px(ctx, c - side * 7, hipY - 8, PALETTE.hostBone, 5, 5);
          px(ctx, c - side * 6, hipY - 5, PALETTE.hostRed, 3, 2);
        }
        break;
      case 'bone-scroll':
        drawSmallBook(ctx, px, c + side * 9, hipY - 14, PALETTE.hostBone);
        px(ctx, c + side * 7, hipY - 9, PALETTE.hostGold, 5, 1);
        break;
      case 'veil':
        px(ctx, c - 5, headY + 1 + bob, PALETTE.clothDark, 10, 9);
        px(ctx, c - 4, headY + 2 + bob, PALETTE.stoneDark, 8, 1);
        px(ctx, c - 3, headY + 5 + bob, PALETTE.void, 6, 2);
        break;
      case 'chain':
        drawChain(ctx, px, c + side * 8, shoulderY + 6, side, 6);
        drawChain(ctx, px, c - side * 9, hipY - 13, -side, 4);
        break;
      case 'ash-mask':
        if (!meta.back) {
          px(ctx, c - 3, headY + 3 + bob, PALETTE.hostBone, 6, 4);
          px(ctx, c - 2, headY + 4 + bob, PALETTE.void, 4, 1);
        }
        break;
      case 'confessor-staff':
        drawCampStaff(ctx, linePx, c - side * 11, shoulderY + 4, -side, PALETTE.woodLight);
        px(ctx, c - side * 11, shoulderY + 2, PALETTE.hostBone, 3, 3);
        px(ctx, c - side * 11, shoulderY + 3, PALETTE.hostRed, 1, 1);
        break;
      case 'knife-belt':
        for (let i = 0; i < 3; i += 1) {
          const x = c - 3 + i * 3;
          linePx(ctx, x, hipY - 3, x + side * 2, hipY + 4, PALETTE.hostBone, 1);
        }
        break;
      case 'raider-cleaver':
        linePx(ctx, c + side * 8, shoulderY + 8, c + side * 10, hipY - 3, PALETTE.stoneLight, 2);
        px(ctx, c + side * 10, shoulderY + 9, PALETTE.hostBone, 4, 6);
        break;
      case 'thin-pack':
        px(ctx, c + side * 8, hipY - 18, PALETTE.outline, 5, 16);
        px(ctx, c + side * 8, hipY - 17, PALETTE.clothDark, 3, 14);
        px(ctx, c + side * 8, hipY - 17, PALETTE.stoneDust, 2, 1);
        break;
      default:
        break;
    }
  }
}

export function drawHumanModelDetails(args) {
  const { style } = args;
  if (style.modelBase === 'choir') {
    drawChoirDetails(args);
  } else if (style.modelBase === 'cutthroat') {
    drawCutthroatDetails(args);
  } else {
    drawSurvivorVariantDetails(args);
  }
  drawHumanModelExtras(args);
}

function drawSurvivorVariantDetails(args) {
  const { ctx, px, linePx, meta, pose, shoulderY, hipY, headY, torso, style } = args;
  const side = directionSide(meta);
  const c = torso.bodyCx;
  const bob = pose.bob ?? 0;

  switch (style.campBase) {
    case 'shawl':
      drawSurvivorWomanDetails(args);
      break;
    case 'child':
      drawSurvivorChildDetails(args);
      break;
    default:
      drawSurvivorManDetails(args);
      break;
  }

  switch (style.campKit) {
    case 'matron':
      px(ctx, c - 6, shoulderY + 1, PALETTE.hostBone, 12, 1);
      px(ctx, c - 7, shoulderY + 3, PALETTE.clothDark, 14, 2);
      drawCampStaff(ctx, linePx, c - side * 10, shoulderY + 6, -side, PALETTE.woodLight);
      if (!meta.back) px(ctx, c - 1, headY + 8 + bob, PALETTE.hostGold, 2, 1);
      break;
    case 'quartermaster':
      drawCampBundle(ctx, px, c + side * 9, hipY - 15, PALETTE.clothTan);
      px(ctx, c - side * 8, hipY - 11, PALETTE.woodMid, 6, 8);
      px(ctx, c - side * 8, hipY - 11, PALETTE.hostBone, 5, 1);
      if (!meta.back) {
        px(ctx, c - 4, shoulderY + 8, PALETTE.clothBlueDark, 8, 4);
        px(ctx, c - 3, shoulderY + 8, PALETTE.clothBlue, 5, 1);
      }
      break;
    case 'settler':
      drawCampStaff(ctx, linePx, c + side * 11, shoulderY + 5, side, PALETTE.woodMid);
      px(ctx, c - side * 9, hipY - 8, PALETTE.rustMid, 5, 5);
      px(ctx, c - side * 9, hipY - 8, PALETTE.rustLight, 3, 1);
      break;
    case 'runner':
      linePx(ctx, c - side * 6, shoulderY + 4, c + side * 6, hipY - 2, PALETTE.clothBlueDark);
      px(ctx, c + side * 8, hipY - 10, PALETTE.woodDark, 6, 8);
      px(ctx, c + side * 8, hipY - 10, PALETTE.woodLight, 4, 1);
      px(ctx, c - side * 9, shoulderY + 7, PALETTE.stoneLight, 4, 2);
      break;
    case 'cook':
      px(ctx, c - 5, shoulderY + 8, PALETTE.clothTan, 10, 13);
      px(ctx, c - 4, shoulderY + 8, PALETTE.hostBone, 7, 1);
      px(ctx, c + side * 8, hipY - 7, PALETTE.stoneDark, 6, 5);
      px(ctx, c + side * 9, hipY - 8, PALETTE.stoneLight, 4, 1);
      linePx(ctx, c - side * 8, shoulderY + 9, c - side * 9, hipY - 3, PALETTE.woodLight);
      break;
    case 'mender':
      drawToolRoll(ctx, px, c + side * 8, hipY - 12);
      linePx(ctx, c - side * 6, shoulderY + 5, c + side * 5, hipY - 2, PALETTE.rustLight);
      px(ctx, c - side * 9, hipY - 4, PALETTE.stoneLight, 5, 2);
      break;
    case 'water':
      drawCampJar(ctx, px, c + side * 9, hipY - 13);
      drawCampJar(ctx, px, c - side * 8, hipY - 9);
      linePx(ctx, c - side * 6, shoulderY + 5, c + side * 8, hipY - 4, PALETTE.clothDark);
      break;
    case 'chapel-hand':
      drawCampBundle(ctx, px, c + side * 8, hipY - 13, PALETTE.stoneDust);
      px(ctx, c - side * 9, shoulderY + 8, PALETTE.rustDark, 5, 5);
      px(ctx, c - side * 9, shoulderY + 8, PALETTE.rustLight, 3, 1);
      px(ctx, c - 4, hipY - 3, PALETTE.hostBone, 8, 1);
      break;
    case 'nurse':
      px(ctx, c - 7, shoulderY + 3, PALETTE.stoneDust, 14, 2);
      px(ctx, c + side * 8, hipY - 13, PALETTE.clothTan, 7, 10);
      px(ctx, c + side * 9, hipY - 11, PALETTE.hostBone, 5, 1);
      px(ctx, c + side * 10, hipY - 13, PALETTE.clothRed, 2, 7);
      px(ctx, c + side * 8, hipY - 10, PALETTE.clothRed, 6, 2);
      break;
    case 'blue-child':
      px(ctx, c + side * 7, hipY - 8, PALETTE.clothBlueDark, 5, 5);
      px(ctx, c + side * 7, hipY - 8, PALETTE.clothBlue, 4, 1);
      if (!meta.back) px(ctx, c - 2, shoulderY + 8, PALETTE.clothBlue, 4, 3);
      break;
    case 'chalk-child':
      px(ctx, c - side * 7, hipY - 8, PALETTE.clothTan, 5, 5);
      px(ctx, c - side * 6, hipY - 8, PALETTE.hostBone, 3, 1);
      if (!meta.back) {
        px(ctx, c + 3, hipY - 4, PALETTE.hostBone, 1, 4);
        px(ctx, c + 2, hipY - 1, PALETTE.stoneDust, 3, 1);
      }
      break;
    default:
      break;
  }
}

export const SURVIVOR_MAN_STYLE = {
  shoulders: 15,
  waist: 9,
  torsoLength: 16,
  legLength: 23,
  headHeight: 9,
  legSize: 2,
  armSize: 2,
  coatTail: 5,
  coatHi: PALETTE.stoneDust,
  coat: PALETTE.stoneMid,
  coatLo: PALETTE.stoneDark,
  coatDk: PALETTE.void,
  pantsHi: PALETTE.stoneLight,
  pants: PALETTE.clothDark,
  pantsLo: PALETTE.stoneDark,
  pantsDk: PALETTE.void,
  boot: PALETTE.rustDark,
  bootHi: PALETTE.rustMid,
  bootLo: PALETTE.void,
  skinHi: PALETTE.skinLight,
  skin: PALETTE.skinMid,
  skinLo: PALETTE.skinDark,
  skinDk: PALETTE.clothDark,
  hair: PALETTE.woodDark,
  hairHi: PALETTE.woodLight,
  hood: PALETTE.clothDark,
  hoodHi: PALETTE.stoneDark,
  belt: PALETTE.rustDark,
  weapon: PALETTE.stoneLight,
  hunch: 1,
  decorate: drawSurvivorManDetails
};

export const SURVIVOR_WOMAN_STYLE = {
  ...SURVIVOR_MAN_STYLE,
  shoulders: 13,
  waist: 8,
  torsoLength: 17,
  coatTail: 8,
  coatHi: PALETTE.clothTan,
  coat: PALETTE.stoneDust,
  coatLo: PALETTE.stoneMid,
  pantsHi: PALETTE.stoneDust,
  pants: PALETTE.stoneDark,
  hair: PALETTE.woodMid,
  hairHi: PALETTE.woodLight,
  decorate: drawSurvivorWomanDetails
};

export const SURVIVOR_CHILD_STYLE = {
  ...SURVIVOR_MAN_STYLE,
  shoulders: 11,
  waist: 7,
  torsoLength: 13,
  legLength: 17,
  headHeight: 9,
  legSize: 1,
  armSize: 1,
  coatTail: 5,
  coatHi: PALETTE.clothTan,
  coat: PALETTE.stoneMid,
  coatLo: PALETTE.stoneDark,
  boot: PALETTE.rustDark,
  bootHi: PALETTE.rustMid,
  skinHi: PALETTE.skinLight,
  skin: PALETTE.skinMid,
  hunch: 0,
  decorate: drawSurvivorChildDetails
};

export const SURVIVOR_VARIANTS = {
  selka: {
    ...SURVIVOR_WOMAN_STYLE,
    campBase: 'shawl',
    campKit: 'matron',
    coatHi: PALETTE.hostBone,
    coat: PALETTE.clothTan,
    coatLo: PALETTE.stoneDust,
    hair: PALETTE.stoneDark,
    hairHi: PALETTE.stoneDust,
    bareHead: true,
    decorate: drawSurvivorVariantDetails
  },
  mirel: {
    ...SURVIVOR_WOMAN_STYLE,
    campBase: 'shawl',
    campKit: 'quartermaster',
    coatHi: PALETTE.stoneDust,
    coat: PALETTE.stoneMid,
    coatLo: PALETTE.clothDark,
    hair: PALETTE.woodDark,
    hairHi: PALETTE.woodMid,
    bareHead: true,
    decorate: drawSurvivorVariantDetails
  },
  oren: {
    ...SURVIVOR_MAN_STYLE,
    campKit: 'settler',
    shoulders: 16,
    waist: 10,
    coatHi: PALETTE.stoneLight,
    coat: PALETTE.clothDark,
    coatLo: PALETTE.void,
    pants: PALETTE.stoneDark,
    hair: PALETTE.woodMid,
    hairHi: PALETTE.woodLight,
    bareHead: true,
    decorate: drawSurvivorVariantDetails
  },
  tomas: {
    ...SURVIVOR_MAN_STYLE,
    campKit: 'runner',
    shoulders: 14,
    waist: 8,
    legLength: 24,
    coatHi: PALETTE.stoneDust,
    coat: PALETTE.stoneLight,
    coatLo: PALETTE.stoneDark,
    pants: PALETTE.clothBlueDark,
    hood: PALETTE.clothDark,
    hoodHi: PALETTE.stoneDust,
    decorate: drawSurvivorVariantDetails
  },
  runa: {
    ...SURVIVOR_WOMAN_STYLE,
    campBase: 'shawl',
    campKit: 'cook',
    coatHi: PALETTE.clothTan,
    coat: PALETTE.rustDark,
    coatLo: PALETTE.clothDark,
    hair: PALETTE.woodMid,
    hairHi: PALETTE.clothTan,
    bareHead: true,
    decorate: drawSurvivorVariantDetails
  },
  istra: {
    ...SURVIVOR_WOMAN_STYLE,
    campBase: 'shawl',
    campKit: 'mender',
    shoulders: 14,
    coatHi: PALETTE.stoneLight,
    coat: PALETTE.stoneMid,
    coatLo: PALETTE.clothDark,
    pants: PALETTE.clothDark,
    hood: PALETTE.stoneDark,
    hoodHi: PALETTE.stoneDust,
    decorate: drawSurvivorVariantDetails
  },
  nessa: {
    ...SURVIVOR_WOMAN_STYLE,
    campBase: 'shawl',
    campKit: 'water',
    coatHi: PALETTE.clothBlue,
    coat: PALETTE.clothBlueDark,
    coatLo: PALETTE.void,
    pantsHi: PALETTE.stoneLight,
    pants: PALETTE.stoneMid,
    hair: PALETTE.woodDark,
    hairHi: PALETTE.woodMid,
    bareHead: true,
    decorate: drawSurvivorVariantDetails
  },
  dalia: {
    ...SURVIVOR_WOMAN_STYLE,
    campBase: 'shawl',
    campKit: 'chapel-hand',
    coatHi: PALETTE.stoneDust,
    coat: PALETTE.clothDark,
    coatLo: PALETTE.void,
    pants: PALETTE.stoneDark,
    hair: PALETTE.woodLight,
    hairHi: PALETTE.clothTan,
    bareHead: true,
    decorate: drawSurvivorVariantDetails
  },
  hanne: {
    ...SURVIVOR_WOMAN_STYLE,
    campBase: 'shawl',
    campKit: 'nurse',
    coatHi: PALETTE.hostBone,
    coat: PALETTE.stoneDust,
    coatLo: PALETTE.stoneDark,
    hood: PALETTE.clothTan,
    hoodHi: PALETTE.hostBone,
    decorate: drawSurvivorVariantDetails
  },
  corin: {
    ...SURVIVOR_CHILD_STYLE,
    campBase: 'child',
    campKit: 'blue-child',
    coatHi: PALETTE.stoneLight,
    coat: PALETTE.clothBlueDark,
    coatLo: PALETTE.void,
    hair: PALETTE.woodLight,
    hairHi: PALETTE.clothTan,
    bareHead: true,
    decorate: drawSurvivorVariantDetails
  },
  eda: {
    ...SURVIVOR_CHILD_STYLE,
    campBase: 'child',
    campKit: 'chalk-child',
    coatHi: PALETTE.clothTan,
    coat: PALETTE.stoneMid,
    coatLo: PALETTE.clothDark,
    hair: PALETTE.woodDark,
    hairHi: PALETTE.woodMid,
    bareHead: true,
    decorate: drawSurvivorVariantDetails
  }
};

function humanModel(id, description, width, height, style) {
  return Object.freeze({
    id,
    description,
    width,
    height,
    style: Object.freeze(style)
  });
}

export const HUMAN_MODEL_DEFS = Object.freeze([
  humanModel('human-road-matron-heavy', 'Heavyset settlement matron with a layered shawl, pale shoulder cloth, staff, and ledger pouch.', 46, 62, {
    ...SURVIVOR_WOMAN_STYLE,
    modelBase: 'survivor',
    campBase: 'shawl',
    campKit: 'matron',
    modelKits: ['ledger'],
    shoulders: 18,
    waist: 14,
    torsoLength: 17,
    legLength: 21,
    coatHi: PALETTE.hostBone,
    coat: PALETTE.clothTan,
    coatLo: PALETTE.stoneDust,
    pants: PALETTE.stoneDark,
    hair: PALETTE.stoneDark,
    hairHi: PALETTE.stoneDust,
    bareHead: true,
    decorate: drawHumanModelDetails
  }),
  humanModel('human-buff-hauler', 'Broad ash-road hauler with thick arms, crate bundle, rope belt, and work boots.', 48, 64, {
    ...SURVIVOR_MAN_STYLE,
    modelBase: 'survivor',
    campKit: 'settler',
    modelKits: ['crate-pack'],
    shoulders: 22,
    waist: 14,
    torsoLength: 18,
    legLength: 22,
    armSize: 3,
    coatHi: PALETTE.stoneLight,
    coat: PALETTE.stoneDark,
    coatLo: PALETTE.void,
    pants: PALETTE.clothDark,
    hair: PALETTE.woodDark,
    hairHi: PALETTE.woodMid,
    bareHead: true,
    decorate: drawHumanModelDetails
  }),
  humanModel('human-fat-trader', 'Round road trader with a tan coat, small ledger, belly pouch, and careful stance.', 46, 62, {
    ...SURVIVOR_MAN_STYLE,
    modelBase: 'survivor',
    campKit: 'quartermaster',
    modelKits: ['ledger', 'tally-tags'],
    shoulders: 18,
    waist: 15,
    torsoLength: 18,
    legLength: 20,
    coatHi: PALETTE.clothTan,
    coat: PALETTE.stoneDust,
    coatLo: PALETTE.stoneMid,
    pants: PALETTE.rustDark,
    hair: PALETTE.woodMid,
    hairHi: PALETTE.woodLight,
    bareHead: true,
    decorate: drawHumanModelDetails
  }),
  humanModel('human-old-widow', 'Stooped elderly widow in a dark shawl with a cane, pale scarf, and narrow face.', 42, 60, {
    ...SURVIVOR_WOMAN_STYLE,
    modelBase: 'survivor',
    campBase: 'shawl',
    modelKits: ['cane', 'prayer-cord'],
    shoulders: 12,
    waist: 8,
    torsoLength: 17,
    legLength: 20,
    hunch: 5,
    coatHi: PALETTE.stoneDust,
    coat: PALETTE.clothDark,
    coatLo: PALETTE.void,
    pants: PALETTE.stoneDark,
    hair: PALETTE.stoneDust,
    hairHi: PALETTE.hostBone,
    bareHead: true,
    decorate: drawHumanModelDetails
  }),
  humanModel('human-old-tinker', 'Elderly tinker with a bent back, tool roll, patched coat, and short walking cane.', 42, 60, {
    ...SURVIVOR_MAN_STYLE,
    modelBase: 'survivor',
    campKit: 'mender',
    modelKits: ['tool-roll', 'cane'],
    shoulders: 13,
    waist: 8,
    torsoLength: 16,
    legLength: 21,
    hunch: 6,
    coatHi: PALETTE.stoneDust,
    coat: PALETTE.stoneMid,
    coatLo: PALETTE.clothDark,
    pants: PALETTE.stoneDark,
    hair: PALETTE.stoneDust,
    hairHi: PALETTE.hostBone,
    bareHead: true,
    decorate: drawHumanModelDetails
  }),
  humanModel('human-field-nurse-compact', 'Compact field nurse with a pale hood, red medicine cross, and side satchel.', 42, 62, {
    ...SURVIVOR_WOMAN_STYLE,
    modelBase: 'survivor',
    campBase: 'shawl',
    campKit: 'nurse',
    modelKits: ['medicine-bag'],
    shoulders: 13,
    waist: 8,
    coatHi: PALETTE.hostBone,
    coat: PALETTE.stoneDust,
    coatLo: PALETTE.stoneDark,
    hood: PALETTE.clothTan,
    hoodHi: PALETTE.hostBone,
    decorate: drawHumanModelDetails
  }),
  humanModel('human-water-carrier-blue', 'Water carrier with blue cloth, two stone jars, and a dark waist strap.', 42, 62, {
    ...SURVIVOR_WOMAN_STYLE,
    modelBase: 'survivor',
    campBase: 'shawl',
    campKit: 'water',
    modelKits: ['water-jars'],
    shoulders: 14,
    waist: 9,
    coatHi: PALETTE.clothBlue,
    coat: PALETTE.clothBlueDark,
    coatLo: PALETTE.void,
    pants: PALETTE.stoneMid,
    hair: PALETTE.woodDark,
    hairHi: PALETTE.woodMid,
    bareHead: true,
    decorate: drawHumanModelDetails
  }),
  humanModel('human-wall-runner-lean', 'Lean wall runner with long legs, blue sash, message tube, and light pack.', 40, 64, {
    ...SURVIVOR_MAN_STYLE,
    modelBase: 'survivor',
    campKit: 'runner',
    modelKits: ['message-tube', 'thin-pack'],
    shoulders: 13,
    waist: 7,
    torsoLength: 16,
    legLength: 25,
    coatHi: PALETTE.stoneDust,
    coat: PALETTE.stoneLight,
    coatLo: PALETTE.stoneDark,
    pants: PALETTE.clothBlueDark,
    hood: PALETTE.clothDark,
    hoodHi: PALETTE.stoneDust,
    decorate: drawHumanModelDetails
  }),
  humanModel('human-bandaged-teen', 'Small adolescent survivor with a bandaged sling, too-large coat, and thin legs.', 38, 56, {
    ...SURVIVOR_CHILD_STYLE,
    modelBase: 'survivor',
    campBase: 'child',
    modelKits: ['bandage-sling'],
    shoulders: 12,
    waist: 7,
    torsoLength: 14,
    legLength: 19,
    coatHi: PALETTE.stoneDust,
    coat: PALETTE.stoneMid,
    coatLo: PALETTE.clothDark,
    hair: PALETTE.woodMid,
    hairHi: PALETTE.woodLight,
    bareHead: true,
    decorate: drawHumanModelDetails
  }),
  humanModel('human-road-child-blue', 'Child in a dark blue patched coat with a tiny satchel and bright face.', 36, 50, {
    ...SURVIVOR_CHILD_STYLE,
    modelBase: 'survivor',
    campBase: 'child',
    campKit: 'blue-child',
    modelKits: ['child-token'],
    coatHi: PALETTE.stoneLight,
    coat: PALETTE.clothBlueDark,
    coatLo: PALETTE.void,
    hair: PALETTE.woodLight,
    hairHi: PALETTE.clothTan,
    bareHead: true,
    decorate: drawHumanModelDetails
  }),
  humanModel('human-chalk-child', 'Child with a chalk pouch, tan sleeves, and a small talisman at the neck.', 36, 50, {
    ...SURVIVOR_CHILD_STYLE,
    modelBase: 'survivor',
    campBase: 'child',
    campKit: 'chalk-child',
    modelKits: ['child-token'],
    coatHi: PALETTE.clothTan,
    coat: PALETTE.stoneMid,
    coatLo: PALETTE.clothDark,
    hair: PALETTE.woodDark,
    hairHi: PALETTE.woodMid,
    bareHead: true,
    decorate: drawHumanModelDetails
  }),
  humanModel('human-ash-scout-hooded', 'Hooded ash scout with a staff, thin pack, bedroll, and narrow road stance.', 42, 62, {
    ...SURVIVOR_MAN_STYLE,
    modelBase: 'survivor',
    campKit: 'settler',
    modelKits: ['thin-pack'],
    shoulders: 14,
    waist: 8,
    torsoLength: 16,
    legLength: 24,
    coatHi: PALETTE.stoneDust,
    coat: PALETTE.clothDark,
    coatLo: PALETTE.void,
    pants: PALETTE.stoneDark,
    hood: PALETTE.clothDark,
    hoodHi: PALETTE.stoneDust,
    decorate: drawHumanModelDetails
  }),
  humanModel('human-broad-warden', 'Broad settlement guard with shoulder plate, scarred brow, and heavy dark coat.', 48, 64, {
    ...SURVIVOR_MAN_STYLE,
    modelBase: 'survivor',
    campKit: 'settler',
    modelKits: ['shoulder-plate', 'scarred-face'],
    shoulders: 21,
    waist: 12,
    torsoLength: 18,
    legLength: 23,
    armSize: 3,
    coatHi: PALETTE.stoneLight,
    coat: PALETTE.clothDark,
    coatLo: PALETTE.void,
    pants: PALETTE.stoneDark,
    hair: PALETTE.woodDark,
    hairHi: PALETTE.woodMid,
    bareHead: true,
    decorate: drawHumanModelDetails
  }),
  humanModel('human-hollow-refugee', 'Gaunt refugee with sunken shoulders, oversized coat, thin pack, and bare head.', 38, 62, {
    ...SURVIVOR_MAN_STYLE,
    modelBase: 'survivor',
    campKit: 'chapel-hand',
    modelKits: ['thin-pack'],
    shoulders: 12,
    waist: 7,
    torsoLength: 17,
    legLength: 24,
    hunch: 3,
    coatHi: PALETTE.stoneDust,
    coat: PALETTE.stoneMid,
    coatLo: PALETTE.void,
    pants: PALETTE.clothDark,
    hair: PALETTE.stoneDark,
    hairHi: PALETTE.stoneDust,
    bareHead: true,
    decorate: drawHumanModelDetails
  }),
  humanModel('human-cook-apron', 'Camp cook with a long apron, dark pot hook, and stocky working stance.', 44, 62, {
    ...SURVIVOR_WOMAN_STYLE,
    modelBase: 'survivor',
    campBase: 'shawl',
    campKit: 'cook',
    modelKits: ['long-apron'],
    shoulders: 15,
    waist: 11,
    coatHi: PALETTE.clothTan,
    coat: PALETTE.rustDark,
    coatLo: PALETTE.clothDark,
    hair: PALETTE.woodMid,
    hairHi: PALETTE.clothTan,
    bareHead: true,
    decorate: drawHumanModelDetails
  }),
  humanModel('human-prayer-keeper', 'Chapel keeper with a dark coat, prayer cord, bundled cloth, and careful posture.', 42, 62, {
    ...SURVIVOR_WOMAN_STYLE,
    modelBase: 'survivor',
    campBase: 'shawl',
    campKit: 'chapel-hand',
    modelKits: ['prayer-cord'],
    shoulders: 13,
    waist: 8,
    coatHi: PALETTE.stoneDust,
    coat: PALETTE.clothDark,
    coatLo: PALETTE.void,
    pants: PALETTE.stoneDark,
    hair: PALETTE.woodLight,
    hairHi: PALETTE.clothTan,
    bareHead: true,
    decorate: drawHumanModelDetails
  }),
  humanModel('human-seamstress-quartermaster', 'Seamstress quartermaster with roll bundle, ledger, blue chest cloth, and pinned tools.', 42, 62, {
    ...SURVIVOR_WOMAN_STYLE,
    modelBase: 'survivor',
    campBase: 'shawl',
    campKit: 'quartermaster',
    modelKits: ['ledger', 'tool-roll'],
    coatHi: PALETTE.stoneDust,
    coat: PALETTE.stoneMid,
    coatLo: PALETTE.clothDark,
    hair: PALETTE.woodDark,
    hairHi: PALETTE.woodMid,
    bareHead: true,
    decorate: drawHumanModelDetails
  }),
  humanModel('human-scarred-veteran', 'Scarred veteran settler with shoulder plate, rope belt, and a guarded stance.', 44, 62, {
    ...SURVIVOR_MAN_STYLE,
    modelBase: 'survivor',
    campKit: 'settler',
    modelKits: ['shoulder-plate', 'scarred-face', 'rope-coil'],
    shoulders: 18,
    waist: 10,
    coatHi: PALETTE.stoneLight,
    coat: PALETTE.stoneMid,
    coatLo: PALETTE.stoneDark,
    pants: PALETTE.clothDark,
    hair: PALETTE.woodMid,
    hairHi: PALETTE.woodLight,
    bareHead: true,
    decorate: drawHumanModelDetails
  }),
  humanModel('human-lame-grandfather', 'Lame grandfather with a high hunch, grey hair, cane, and patched dark trousers.', 40, 60, {
    ...SURVIVOR_MAN_STYLE,
    modelBase: 'survivor',
    campKit: 'mender',
    modelKits: ['cane'],
    shoulders: 12,
    waist: 8,
    torsoLength: 16,
    legLength: 20,
    hunch: 7,
    coatHi: PALETTE.stoneDust,
    coat: PALETTE.stoneMid,
    coatLo: PALETTE.clothDark,
    pants: PALETTE.stoneDark,
    hair: PALETTE.stoneDust,
    hairHi: PALETTE.hostBone,
    bareHead: true,
    decorate: drawHumanModelDetails
  }),
  humanModel('human-shawl-grandmother', 'Small grandmother in a pale shawl with jars, prayer cord, and bent shoulders.', 40, 60, {
    ...SURVIVOR_WOMAN_STYLE,
    modelBase: 'survivor',
    campBase: 'shawl',
    modelKits: ['water-jars', 'prayer-cord'],
    shoulders: 11,
    waist: 8,
    torsoLength: 16,
    legLength: 20,
    hunch: 5,
    coatHi: PALETTE.hostBone,
    coat: PALETTE.clothTan,
    coatLo: PALETTE.stoneDust,
    hair: PALETTE.stoneDust,
    hairHi: PALETTE.hostBone,
    bareHead: true,
    decorate: drawHumanModelDetails
  }),
  humanModel('choir-candle-novice', 'Young Choir candle novice with a low tray, wax-lit sleeves, and masked cowl.', 44, 64, {
    ...CHOIR_STYLE,
    modelBase: 'choir',
    modelKits: ['candle-tray'],
    shoulders: 13,
    waist: 8,
    torsoLength: 17,
    legLength: 23,
    coatHi: PALETTE.hostBone,
    coat: PALETTE.clothRed,
    coatLo: PALETTE.rustDark,
    hoodHi: PALETTE.hostBone,
    decorate: drawHumanModelDetails
  }),
  humanModel('choir-throat-singer-lean', 'Lean Choir throat-singer with a dark neck strip, relic glass pouch, and narrow robe.', 42, 64, {
    ...CHOIR_STYLE,
    modelBase: 'choir',
    modelKits: ['throat-glass', 'thin-pack'],
    shoulders: 12,
    waist: 7,
    torsoLength: 18,
    legLength: 24,
    hunch: 4,
    coatHi: PALETTE.stoneDust,
    coat: PALETTE.clothDark,
    coatLo: PALETTE.void,
    hood: PALETTE.clothDark,
    hoodHi: PALETTE.stoneDust,
    decorate: drawHumanModelDetails
  }),
  humanModel('choir-flesh-eater-bloated', 'Bloated Choir flesh-eater with a swollen robe, sacrament bundle, and red-stained hands.', 48, 64, {
    ...CHOIR_STYLE,
    modelBase: 'choir',
    modelKits: ['sacrament-flesh'],
    shoulders: 20,
    waist: 14,
    torsoLength: 18,
    legLength: 21,
    coatHi: PALETTE.clothTan,
    coat: PALETTE.clothRed,
    coatLo: PALETTE.hostRed,
    pants: PALETTE.clothDark,
    hunch: 5,
    decorate: drawHumanModelDetails
  }),
  humanModel('choir-bone-lector', 'Choir bone lector with pale scroll plates, tally tags, and a formal red stole.', 44, 64, {
    ...CHOIR_STYLE,
    modelBase: 'choir',
    modelKits: ['bone-scroll', 'tally-tags'],
    shoulders: 15,
    waist: 9,
    coatHi: PALETTE.hostBone,
    coat: PALETTE.stoneDust,
    coatLo: PALETTE.rustDark,
    hood: PALETTE.clothDark,
    hoodHi: PALETTE.hostBone,
    decorate: drawHumanModelDetails
  }),
  humanModel('choir-veiled-mother', 'Veiled Choir mother with a dark face cloth, red robe, prayer cord, and hidden knife.', 44, 64, {
    ...CHOIR_STYLE,
    modelBase: 'choir',
    modelKits: ['veil', 'prayer-cord'],
    shoulders: 16,
    waist: 10,
    coatHi: PALETTE.stoneDust,
    coat: PALETTE.clothRed,
    coatLo: PALETTE.rustDark,
    hood: PALETTE.clothDark,
    hoodHi: PALETTE.stoneDust,
    decorate: drawHumanModelDetails
  }),
  humanModel('choir-chain-bearer', 'Choir chain-bearer with dragging links, rope coil, and heavy ritual sleeves.', 46, 64, {
    ...CHOIR_STYLE,
    modelBase: 'choir',
    modelKits: ['chain', 'rope-coil'],
    shoulders: 18,
    waist: 11,
    torsoLength: 18,
    legLength: 22,
    coatHi: PALETTE.stoneDust,
    coat: PALETTE.clothDark,
    coatLo: PALETTE.void,
    hoodHi: PALETTE.hostBone,
    decorate: drawHumanModelDetails
  }),
  humanModel('choir-ash-penitent', 'Ash-masked Choir penitent with a pale face plate, tight robe, and bowed posture.', 42, 64, {
    ...CHOIR_STYLE,
    modelBase: 'choir',
    modelKits: ['ash-mask', 'prayer-cord'],
    shoulders: 13,
    waist: 8,
    torsoLength: 18,
    legLength: 23,
    hunch: 7,
    coatHi: PALETTE.stoneDust,
    coat: PALETTE.stoneMid,
    coatLo: PALETTE.clothDark,
    hood: PALETTE.clothDark,
    hoodHi: PALETTE.hostBone,
    decorate: drawHumanModelDetails
  }),
  humanModel('choir-broad-guard', 'Broad Choir guard with armored shoulder, red stole, and heavier ritual knife.', 48, 64, {
    ...CHOIR_STYLE,
    modelBase: 'choir',
    modelKits: ['shoulder-plate', 'knife-belt'],
    shoulders: 21,
    waist: 12,
    armSize: 3,
    coatHi: PALETTE.hostBone,
    coat: PALETTE.clothRed,
    coatLo: PALETTE.rustDark,
    hoodHi: PALETTE.hostBone,
    decorate: drawHumanModelDetails
  }),
  humanModel('choir-old-confessor', 'Old Choir confessor with a staff, bone charm, grey hood edge, and bent ritual robe.', 44, 64, {
    ...CHOIR_STYLE,
    modelBase: 'choir',
    modelKits: ['confessor-staff', 'bone-scroll'],
    shoulders: 14,
    waist: 9,
    legLength: 21,
    hunch: 8,
    coatHi: PALETTE.hostBone,
    coat: PALETTE.clothDark,
    coatLo: PALETTE.void,
    hood: PALETTE.clothDark,
    hoodHi: PALETTE.stoneDust,
    decorate: drawHumanModelDetails
  }),
  humanModel('choir-scarlet-knife', 'Scarlet-robed knife cultist with triple blades, black cowl, and quick side stance.', 44, 64, {
    ...CHOIR_STYLE,
    modelBase: 'choir',
    modelKits: ['knife-belt'],
    shoulders: 15,
    waist: 8,
    legLength: 24,
    coatHi: PALETTE.clothTan,
    coat: PALETTE.clothRed,
    coatLo: PALETTE.hostRed,
    hood: PALETTE.clothDark,
    hoodHi: PALETTE.rustDark,
    decorate: drawHumanModelDetails
  }),
  humanModel('red-tithe-buff-raider', 'Buff Red Tithe raider with a cleaver, shoulder plate, dark leathers, and red scarf.', 48, 64, {
    ...CUT_STYLE,
    modelBase: 'cutthroat',
    modelKits: ['shoulder-plate', 'raider-cleaver'],
    shoulders: 21,
    waist: 12,
    armSize: 3,
    coatHi: PALETTE.rustLight,
    coat: PALETTE.rustMid,
    coatLo: PALETTE.rustDark,
    pants: PALETTE.clothDark,
    hood: PALETTE.clothDark,
    hoodHi: PALETTE.rustMid,
    decorate: drawHumanModelDetails
  }),
  humanModel('red-tithe-starved-runner', 'Starved Red Tithe runner with thin limbs, relic sack, and long hooked knife.', 40, 64, {
    ...CUT_STYLE,
    modelBase: 'cutthroat',
    modelKits: ['thin-pack', 'knife-belt'],
    shoulders: 12,
    waist: 7,
    torsoLength: 17,
    legLength: 25,
    hunch: 4,
    coatHi: PALETTE.stoneDust,
    coat: PALETTE.clothDark,
    coatLo: PALETTE.void,
    hood: PALETTE.clothDark,
    hoodHi: PALETTE.stoneDark,
    decorate: drawHumanModelDetails
  }),
  humanModel('red-tithe-sawbones', 'Red Tithe sawbones with tool roll, blood-dark apron, and a narrow hood.', 44, 64, {
    ...CUT_STYLE,
    modelBase: 'cutthroat',
    modelKits: ['tool-roll', 'long-apron'],
    shoulders: 15,
    waist: 9,
    coatHi: PALETTE.stoneDust,
    coat: PALETTE.rustDark,
    coatLo: PALETTE.clothDark,
    pants: PALETTE.stoneDark,
    hood: PALETTE.clothDark,
    hoodHi: PALETTE.stoneDust,
    decorate: drawHumanModelDetails
  }),
  humanModel('red-tithe-hook-carrier', 'Red Tithe hook carrier with rope coil, chain links, and a heavy scavenger pack.', 46, 64, {
    ...CUT_STYLE,
    modelBase: 'cutthroat',
    modelKits: ['rope-coil', 'chain', 'crate-pack'],
    shoulders: 18,
    waist: 11,
    coatHi: PALETTE.rustLight,
    coat: PALETTE.stoneMid,
    coatLo: PALETTE.void,
    pants: PALETTE.clothDark,
    hood: PALETTE.clothDark,
    hoodHi: PALETTE.rustDark,
    decorate: drawHumanModelDetails
  })
]);

export const HUMAN_MODEL_SUMMARY = Object.freeze(
  HUMAN_MODEL_DEFS.map(({ id, description }) => Object.freeze({ id, description }))
);

export const HUMAN_MODEL_IDS = Object.freeze(HUMAN_MODEL_DEFS.map(({ id }) => id));
