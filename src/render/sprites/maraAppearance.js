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
  coatHi: PALETTE.stoneDark,
  coat: PALETTE.clothDark,
  coatLo: PALETTE.clothDark,
  coatDk: PALETTE.stoneDark,
  coatTail: 5,
  pantsHi: PALETTE.stoneDark,
  pants: PALETTE.clothDark,
  pantsLo: PALETTE.stoneDark,
  pantsDk: PALETTE.stoneDark,
  skinHi: PALETTE.skinLight,
  skin: PALETTE.skinMid,
  skinLo: PALETTE.skinDark,
  skinDk: PALETTE.clothDark,
  hair: PALETTE.woodMid,
  hairHi: PALETTE.woodLight,
  hood: PALETTE.clothDark,
  hoodHi: PALETTE.stoneDark,
  belt: PALETTE.rustDark,
  weapon: PALETTE.stoneLight,
  bareFeet: true,
  fieldHarness: false,
  anatomy: 'vulva',
  anatomyVisible: false,
  hunch: 0,
  decorate: drawMaraDetails
};

export const MARA_DEFAULT_APPEARANCE = Object.freeze({
  genderModel: 'female',
  bodyType: 'medium',
  skinTone: 'tan',
  hairColor: 'brown',
  hairStyle: 'cropped',
  facialHair: 'none',
  bodyFrame: 'feminine',
  anatomy: 'vulva'
});

export const PLAYER_GENDER_MODEL_IDS = Object.freeze(['female', 'male', 'androgynous']);
export const PLAYER_BODY_TYPE_IDS = Object.freeze(['skinny', 'medium', 'fat', 'buff']);
export const PLAYER_SKIN_TONE_IDS = Object.freeze(['light', 'tan', 'brown', 'dark']);
export const PLAYER_HAIR_COLOR_IDS = Object.freeze(['black', 'brown', 'blond', 'grey']);
export const PLAYER_HAIR_STYLE_IDS = Object.freeze(['cropped', 'loose', 'shaved', 'hooded']);
export const PLAYER_FACIAL_HAIR_IDS = Object.freeze(['none', 'stubble', 'beard']);

const PLAYER_GENDER_MODELS = Object.freeze({
  female: Object.freeze({ bodyFrame: 'feminine', anatomy: 'vulva', shoulders: 15, waist: 9, torsoLength: 16, legLength: 24, legSize: 2, armSize: 2 }),
  male: Object.freeze({ bodyFrame: 'masculine', anatomy: 'penis', shoulders: 17, waist: 10, torsoLength: 17, legLength: 24, legSize: 2, armSize: 2 }),
  androgynous: Object.freeze({ bodyFrame: 'androgynous', anatomy: 'smooth', shoulders: 15, waist: 8, torsoLength: 16, legLength: 24, legSize: 2, armSize: 2 })
});

const MARA_BODY_FRAMES = Object.freeze({
  feminine: Object.freeze({ shoulders: 15, waist: 9, torsoLength: 16, legLength: 24, legSize: 2, armSize: 2 }),
  masculine: Object.freeze({ shoulders: 17, waist: 10, torsoLength: 17, legLength: 24, legSize: 2, armSize: 2 }),
  androgynous: Object.freeze({ shoulders: 15, waist: 8, torsoLength: 16, legLength: 24, legSize: 2, armSize: 2 })
});

const BODY_TYPE_OVERLAYS = Object.freeze({
  skinny: Object.freeze({ shoulders: -2, waist: -2, torsoLength: 0, legLength: 1, legSize: 1, armSize: 1, coatTailMin: 5 }),
  medium: Object.freeze({}),
  fat: Object.freeze({ shoulders: 1, waist: 4, torsoLength: 1, legLength: -2, legSize: 2, armSize: 2, coatTailMin: 8 }),
  buff: Object.freeze({ shoulders: 4, waist: 2, torsoLength: 1, legLength: 0, legSize: 2, armSize: 3, coatTailMin: 7 })
});

const SKIN_TONE_RAMPS = Object.freeze({
  light: Object.freeze({ hi: PALETTE.hostBone, mid: PALETTE.skinLight, lo: PALETTE.skinMid, dk: PALETTE.skinDark }),
  tan: Object.freeze({ hi: PALETTE.skinLight, mid: PALETTE.skinMid, lo: PALETTE.skinDark, dk: PALETTE.clothDark }),
  brown: Object.freeze({ hi: PALETTE.skinMid, mid: PALETTE.woodMid, lo: PALETTE.woodDark, dk: PALETTE.clothDark }),
  dark: Object.freeze({ hi: PALETTE.woodMid, mid: PALETTE.woodDark, lo: PALETTE.clothDark, dk: PALETTE.void })
});

const HAIR_COLOR_RAMPS = Object.freeze({
  black: Object.freeze({ mid: PALETTE.clothDark, hi: PALETTE.stoneDark }),
  brown: Object.freeze({ mid: PALETTE.woodMid, hi: PALETTE.woodLight }),
  blond: Object.freeze({ mid: PALETTE.clothTan, hi: PALETTE.hostBone }),
  grey: Object.freeze({ mid: PALETTE.stoneMid, hi: PALETTE.stoneDust })
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
const PLAYER_GENDER_MODEL_ID_SET = new Set(PLAYER_GENDER_MODEL_IDS);
const PLAYER_BODY_TYPE_ID_SET = new Set(PLAYER_BODY_TYPE_IDS);
const PLAYER_SKIN_TONE_ID_SET = new Set(PLAYER_SKIN_TONE_IDS);
const PLAYER_HAIR_COLOR_ID_SET = new Set(PLAYER_HAIR_COLOR_IDS);
const PLAYER_HAIR_STYLE_ID_SET = new Set(PLAYER_HAIR_STYLE_IDS);
const PLAYER_FACIAL_HAIR_ID_SET = new Set(PLAYER_FACIAL_HAIR_IDS);

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

function genderModelForBodyFrame(bodyFrame) {
  if (bodyFrame === 'masculine') return 'male';
  if (bodyFrame === 'androgynous') return 'androgynous';
  return 'female';
}

export function normalizePlayerAppearance(appearance = {}) {
  const genderModel = typeof appearance?.genderModel === 'string' && PLAYER_GENDER_MODEL_ID_SET.has(appearance.genderModel)
    ? appearance.genderModel
    : genderModelForBodyFrame(appearance?.bodyFrame);
  const model = PLAYER_GENDER_MODELS[genderModel] ?? PLAYER_GENDER_MODELS.female;
  const bodyType = typeof appearance?.bodyType === 'string' && PLAYER_BODY_TYPE_ID_SET.has(appearance.bodyType)
    ? appearance.bodyType
    : MARA_DEFAULT_APPEARANCE.bodyType;
  const skinTone = typeof appearance?.skinTone === 'string' && PLAYER_SKIN_TONE_ID_SET.has(appearance.skinTone)
    ? appearance.skinTone
    : MARA_DEFAULT_APPEARANCE.skinTone;
  const hairColor = typeof appearance?.hairColor === 'string' && PLAYER_HAIR_COLOR_ID_SET.has(appearance.hairColor)
    ? appearance.hairColor
    : MARA_DEFAULT_APPEARANCE.hairColor;
  const hairStyle = typeof appearance?.hairStyle === 'string' && PLAYER_HAIR_STYLE_ID_SET.has(appearance.hairStyle)
    ? appearance.hairStyle
    : MARA_DEFAULT_APPEARANCE.hairStyle;
  const facialHair = typeof appearance?.facialHair === 'string' && PLAYER_FACIAL_HAIR_ID_SET.has(appearance.facialHair)
    ? appearance.facialHair
    : MARA_DEFAULT_APPEARANCE.facialHair;
  const bodyFrame = typeof appearance?.bodyFrame === 'string' && MARA_BODY_FRAMES[appearance.bodyFrame]
    ? appearance.bodyFrame
    : model.bodyFrame;
  const anatomy = typeof appearance?.anatomy === 'string' && MARA_ANATOMY_IDS.has(appearance.anatomy)
    ? appearance.anatomy
    : model.anatomy;
  return { genderModel, bodyType, skinTone, hairColor, hairStyle, facialHair, bodyFrame, anatomy };
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
  const normalizedAppearance = normalizePlayerAppearance(appearance);
  const model = PLAYER_GENDER_MODELS[normalizedAppearance.genderModel] ?? PLAYER_GENDER_MODELS.female;
  Object.assign(style, model);
  applyBodyType(style, normalizedAppearance.bodyType);
  applySkinTone(style, normalizedAppearance.skinTone);
  applyHair(style, normalizedAppearance.hairColor, normalizedAppearance.hairStyle, normalizedAppearance.facialHair);
  Object.assign(style, MARA_BODY_FRAMES[normalizedAppearance.bodyFrame]);
  applyBodyType(style, normalizedAppearance.bodyType);
  style.bodyFrame = normalizedAppearance.bodyFrame;
  style.genderModel = normalizedAppearance.genderModel;
  style.bodyType = normalizedAppearance.bodyType;
  style.skinTone = normalizedAppearance.skinTone;
  style.hairColor = normalizedAppearance.hairColor;
  style.hairStyle = normalizedAppearance.hairStyle;
  style.facialHair = normalizedAppearance.facialHair;
  style.anatomy = normalizedAppearance.anatomy;
  style.anatomyVisible = false;

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
  const overlay = BODY_TYPE_OVERLAYS[normalizedAppearance.bodyType] ?? BODY_TYPE_OVERLAYS.medium;
  if (overlay.coatTailMin) style.coatTail = Math.max(style.coatTail ?? 0, overlay.coatTailMin);

  return style;
}

function applyBodyType(style, bodyType) {
  const overlay = BODY_TYPE_OVERLAYS[bodyType] ?? BODY_TYPE_OVERLAYS.medium;
  for (const key of ['shoulders', 'waist', 'torsoLength', 'legLength']) {
    if (typeof overlay[key] === 'number') style[key] = Math.max(1, style[key] + overlay[key]);
  }
  if (typeof overlay.legSize === 'number') style.legSize = Math.max(1, overlay.legSize);
  if (typeof overlay.armSize === 'number') style.armSize = Math.max(1, overlay.armSize);
}

function applySkinTone(style, skinTone) {
  const skin = SKIN_TONE_RAMPS[skinTone] ?? SKIN_TONE_RAMPS.tan;
  style.skinHi = skin.hi;
  style.skin = skin.mid;
  style.skinLo = skin.lo;
  style.skinDk = skin.dk;
}

function applyHair(style, hairColor, hairStyle, facialHair) {
  const hair = HAIR_COLOR_RAMPS[hairColor] ?? HAIR_COLOR_RAMPS.brown;
  style.hair = hair.mid;
  style.hairHi = hair.hi;
  style.hairStyle = hairStyle;
  style.facialHair = facialHair;
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

export function derivePlayerStyle(equipment = {}, itemDefs = {}, appearance = {}) {
  return deriveMaraStyle(equipment, itemDefs, appearance);
}

export function bakePlayerCharacter(equipment = MARA_DEFAULT_EQUIPMENT, itemDefs = {}, appearance = MARA_DEFAULT_APPEARANCE) {
  return bakeMara(equipment, itemDefs, appearance);
}
