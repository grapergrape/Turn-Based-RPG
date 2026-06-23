import { PALETTE } from '../palette.js';

import { bakeActor, directionSide } from './spriteBake.js';



function drawLeatherVest(ctx, px, c, shoulderY, hipY, meta, torso, vest) {
  const top = shoulderY + 3;
  const bot = hipY - 1;
  const span = Math.max(1, bot - top);
  const topW = Math.max(5, torso.shoulderW - 4);
  const botW = Math.max(5, torso.waistW);
  for (let y = top; y <= bot; y += 1) {
    const t = (y - top) / span;
    const w = Math.max(4, Math.round(topW + (botW - topW) * t));
    const x = c - Math.floor(w / 2);
    px(ctx, x, y, vest.mid, w, 1);
    px(ctx, x, y, vest.hi);
    px(ctx, x + w - 1, y, vest.lo);
  }
  // Shoulder straps anchoring the vest.
  px(ctx, c - Math.floor(torso.shoulderW / 2) + 1, shoulderY + 2, vest.lo, 3, 5);
  px(ctx, c + Math.floor(torso.shoulderW / 2) - 3, shoulderY + 2, vest.lo, 3, 5);
  if (meta.back) {
    px(ctx, c - 1, top, vest.lo, 2, span); // back seam
    return;
  }
  // Two thin iron plates across the chest, plus a laced front seam.
  px(ctx, c - 4, top + 3, vest.plate, 9, 2);
  px(ctx, c - 4, top + 3, vest.hi, 9, 1);
  px(ctx, c - 3, top + 7, vest.plate, 7, 2);
  px(ctx, c, top + 1, vest.lo, 1, span - 2);
}

function drawMaraDetails({ ctx, px, linePx, meta, pose, shoulderY, hipY, headY, torso, style }) {
  const side = directionSide(meta);
  const bob = pose.bob ?? 0;
  const c = torso.bodyCx;

  // Equipped body armor sits under the harness/pouches drawn below.
  if (style.vest) drawLeatherVest(ctx, px, c, shoulderY, hipY, meta, torso, style.vest);

  if (style.fieldHarness) {
    // Low scarf at the neck, not a face-wide red band.
    px(ctx, c - 3, headY + 8 + bob, PALETTE.clothDark, 5, 1);
    px(ctx, c + 1, headY + 9 + bob, PALETTE.clothRed, 2, 1);

    // Harness, belt pouches, and a small sidearm break the coat silhouette.
    const strapSide = meta.back ? -1 : 1;
    linePx(ctx, c - strapSide * 6, shoulderY + 3, c + strapSide * 5, hipY - 3, PALETTE.clothDark);
    px(ctx, c - 4, hipY - 2, PALETTE.rustLight, 2, 1);
    px(ctx, c + 2, hipY - 2, PALETTE.rustLight, 2, 1);

    const packX = c + (meta.side || strapSide) * 7;
    px(ctx, packX - 2, hipY - 12, PALETTE.skinDark, 7, 10);
    px(ctx, packX - 1, hipY - 12, PALETTE.clothTan, 4, 1);
    px(ctx, packX + (side > 0 ? 3 : -2), hipY - 8, PALETTE.stoneDark, 2, 6);

    const holsterX = c - (meta.side || -1) * 9;
    px(ctx, holsterX, hipY - 8, PALETTE.rustDark, 3, 8);
    px(ctx, holsterX + 1, hipY - 8, PALETTE.rustLight, 1, 3);
  }

  // Equipped trinket: a saint-token on a short chain at the sternum.
  if (style.pendant && !meta.back) {
    px(ctx, c, headY + 10 + bob, style.pendant, 1, 4);
    px(ctx, c - 1, headY + 13 + bob, style.pendant, 3, 3);
    px(ctx, c, headY + 14 + bob, PALETTE.rustDark, 1, 1);
  }
}

const MARA_BODY = {
  shoulders: 15,
  waist: 9,
  torsoLength: 16,
  legLength: 24,
  headHeight: 9,
  legSize: 2,
  armSize: 2,
  coatHi: PALETTE.skinLight,
  coat: PALETTE.skinMid,
  coatLo: PALETTE.skinDark,
  coatDk: PALETTE.clothDark,
  coatTail: 0,
  pantsHi: PALETTE.skinLight,
  pants: PALETTE.skinMid,
  pantsLo: PALETTE.skinDark,
  pantsDk: PALETTE.clothDark,
  skinHi: PALETTE.skinLight,
  skin: PALETTE.skinMid,
  skinLo: PALETTE.skinDark,
  skinDk: PALETTE.clothDark,
  hair: PALETTE.woodMid,
  hairHi: PALETTE.woodLight,
  hood: PALETTE.clothDark,
  hoodHi: PALETTE.stoneDark,
  belt: null,
  weapon: PALETTE.stoneLight,
  bareFeet: true,
  fieldHarness: false,
  anatomy: 'vulva',
  anatomyVisible: true,
  hunch: 0,
  decorate: drawMaraDetails
};

export const MARA_DEFAULT_APPEARANCE = Object.freeze({
  bodyFrame: 'feminine',
  anatomy: 'vulva'
});

const MARA_BODY_FRAMES = Object.freeze({
  feminine: Object.freeze({ shoulders: 15, waist: 9, torsoLength: 16, legLength: 24, legSize: 2, armSize: 2 }),
  masculine: Object.freeze({ shoulders: 17, waist: 10, torsoLength: 17, legLength: 24, legSize: 2, armSize: 2 }),
  androgynous: Object.freeze({ shoulders: 15, waist: 8, torsoLength: 16, legLength: 24, legSize: 2, armSize: 2 })
});

const MARA_ITEM_VISUALS = {
  'censure-field-coat': {
    coat: 'stoneDust',
    coatHi: 'hostBone',
    coatLo: 'stoneMid',
    coatDk: 'skinDark',
    coatTail: 7,
    pants: 'clothDark',
    pantsHi: 'stoneDust',
    pantsLo: 'stoneDark',
    pantsDk: 'void',
    belt: 'rustDark',
    fieldHarness: true
  },
  'scarred-leather-vest': { vest: { mid: 'rustMid', hi: 'rustLight', lo: 'rustDark', plate: 'stoneLight' } },
  'ash-road-boots': { boot: 'rustDark', bootHi: 'rustMid', bootLo: 'stoneDark' },
  'censure-hood': { hood: 'clothDark', hoodHi: 'stoneDark' },
  'tarnished-saint-token': { pendant: 'hostGold' },
  'iron-vow-ring': { ring: 'stoneLight' },
  'mourning-ring': { ring: 'clothDark' }
};

export const MARA_DEFAULT_EQUIPMENT = {
  clothes: 'censure-field-coat',
  armor: 'scarred-leather-vest',
  boots: 'ash-road-boots',
  helmet: 'censure-hood',
  trinket: 'tarnished-saint-token',
  ring1: 'iron-vow-ring',
  ring2: 'mourning-ring'
};

const MARA_ANATOMY_IDS = new Set(['vulva', 'penis', 'smooth', 'intersex']);

function pal(ref, fallback) {
  if (ref == null) return fallback;
  if (typeof ref === 'string') return PALETTE[ref] ?? ref;
  return fallback;
}

function resolveVest(vest) {
  if (!vest) return null;
  return {
    mid: pal(vest.mid, PALETTE.rustMid),
    hi: pal(vest.hi, PALETTE.rustLight),
    lo: pal(vest.lo, PALETTE.rustDark),
    plate: pal(vest.plate, PALETTE.stoneLight)
  };
}

function normalizeMaraAppearance(appearance = {}) {
  const bodyFrame = typeof appearance.bodyFrame === 'string' && MARA_BODY_FRAMES[appearance.bodyFrame]
    ? appearance.bodyFrame
    : MARA_DEFAULT_APPEARANCE.bodyFrame;
  const anatomy = typeof appearance.anatomy === 'string' && MARA_ANATOMY_IDS.has(appearance.anatomy)
    ? appearance.anatomy
    : MARA_DEFAULT_APPEARANCE.anatomy;
  return { bodyFrame, anatomy };
}

function genericVisualForSlot(slot) {
  switch (slot) {
    case 'clothes': return {
      coat: 'stoneDust',
      coatHi: 'hostBone',
      coatLo: 'stoneMid',
      coatDk: 'skinDark',
      coatTail: 6,
      pants: 'clothDark',
      pantsHi: 'stoneDust',
      pantsLo: 'stoneDark',
      pantsDk: 'void',
      belt: 'rustDark',
      fieldHarness: true
    };
    case 'armor': return { vest: { mid: 'rustMid', hi: 'rustLight', lo: 'rustDark', plate: 'stoneLight' } };
    case 'boots': return { boot: 'rustDark', bootHi: 'rustMid', bootLo: 'stoneDark' };
    case 'helmet': return { hood: 'clothDark', hoodHi: 'stoneDark' };
    case 'trinket': return { pendant: 'hostGold' };
    default: return {};
  }
}

function composeMaraStyle(visuals, appearance = {}) {
  const style = { ...MARA_BODY };
  const normalizedAppearance = normalizeMaraAppearance(appearance);
  Object.assign(style, MARA_BODY_FRAMES[normalizedAppearance.bodyFrame]);
  style.bodyFrame = normalizedAppearance.bodyFrame;
  style.anatomy = normalizedAppearance.anatomy;
  style.anatomyVisible = true;

  const clothes = visuals.clothes;
  if (clothes) {
    style.coat = pal(clothes.coat, PALETTE.stoneDust);
    style.coatHi = pal(clothes.coatHi, style.coat);
    style.coatLo = pal(clothes.coatLo, style.coat);
    style.coatDk = pal(clothes.coatDk, style.coatLo);
    style.coatTail = clothes.coatTail ?? 0;
    style.pants = pal(clothes.pants, PALETTE.clothDark);
    style.pantsHi = pal(clothes.pantsHi, PALETTE.stoneDust);
    style.pantsLo = pal(clothes.pantsLo, PALETTE.stoneDark);
    style.pantsDk = pal(clothes.pantsDk, PALETTE.void);
    style.belt = pal(clothes.belt, PALETTE.rustDark);
    style.fieldHarness = clothes.fieldHarness !== false;
    style.anatomyVisible = false;
  }

  style.vest = visuals.armor ? resolveVest(visuals.armor.vest ?? visuals.armor) : null;
  if (style.vest && !style.belt) style.belt = PALETTE.rustDark;
  if (style.vest) style.fieldHarness = true;

  if (visuals.boots) {
    style.boot = pal(visuals.boots.boot, PALETTE.rustDark);
    style.bootHi = pal(visuals.boots.bootHi, PALETTE.rustMid);
    style.bootLo = pal(visuals.boots.bootLo, PALETTE.stoneDark);
    style.bareFeet = false;
  }

  if (visuals.helmet) {
    style.hood = pal(visuals.helmet.hood, PALETTE.clothDark);
    style.hoodHi = pal(visuals.helmet.hoodHi, PALETTE.stoneDark);
    style.bareHead = false;
  } else {
    style.bareHead = true;
  }

  style.pendant = visuals.trinket ? pal(visuals.trinket.pendant, PALETTE.hostGold) : null;

  return style;
}

export function deriveMaraStyle(equipment = {}, itemDefs = {}, appearance = {}) {
  const visuals = {};
  for (const [slot, itemId] of Object.entries(equipment)) {
    if (!itemId) continue;
    const baseSlot = slot === 'ring1' || slot === 'ring2' ? 'ring' : slot;
    visuals[baseSlot] =
      itemDefs?.[itemId]?.visual ?? MARA_ITEM_VISUALS[itemId] ?? genericVisualForSlot(baseSlot);
  }
  return composeMaraStyle(visuals, appearance);
}

export function bakeMara(equipment = MARA_DEFAULT_EQUIPMENT, itemDefs = {}, appearance = MARA_DEFAULT_APPEARANCE) {
  return bakeActor(42, 62, deriveMaraStyle(equipment, itemDefs, appearance));
}
