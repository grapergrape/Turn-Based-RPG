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

function drawPlayerDetails({ ctx, px, linePx, detailPx, detailLinePx, meta, pose, shoulderY, hipY, headY, torso, style }) {
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

  if (style.fieldHarness) {
    const strapSide = meta.back ? -1 : 1;
    detailLinePx(ctx, c - strapSide * 5.5, shoulderY + 3.5, c + strapSide * 4.5, hipY - 3.5, PALETTE.rustLight);
    detailPx(ctx, c - 3.5, hipY - 1.5, PALETTE.stoneLight);
    detailPx(ctx, c + 2.5, hipY - 1.5, PALETTE.stoneLight);
  }
  if (style.vest) {
    detailLinePx(ctx, c - 3.5, shoulderY + 3.5, c + 3.5, shoulderY + 3.5, style.vest.hi);
    detailLinePx(ctx, c - 2.5, shoulderY + 7.5, c + 2.5, shoulderY + 7.5, style.vest.lo);
  }
  if (style.pendant && !meta.back) detailPx(ctx, c + 0.5, headY + 13.5 + bob, PALETTE.hostBone);
}

const PLAYER_BODY = {
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
  decorate: drawPlayerDetails
};

export const PLAYER_DEFAULT_APPEARANCE = Object.freeze({
  genderModel: 'female',
  bodyType: 'medium',
  stature: 'average',
  posture: 'upright',
  skinTone: 'tan',
  age: 'adult',
  faceShape: 'oval',
  faceMark: 'none',
  hairColor: 'brown',
  hairStyle: 'cropped',
  facialHair: 'none',
  bodyFrame: 'feminine',
  anatomy: 'vulva',
  breastSize: 5,
  penisSize: 0
});

export const PLAYER_GENDER_MODEL_IDS = Object.freeze(['female', 'male', 'androgynous']);
export const PLAYER_BODY_TYPE_IDS = Object.freeze(['skinny', 'medium', 'stocky', 'fat', 'buff']);
export const PLAYER_STATURE_IDS = Object.freeze(['short', 'average', 'tall']);
export const PLAYER_POSTURE_IDS = Object.freeze(['upright', 'guarded', 'stooped']);
export const PLAYER_SKIN_TONE_IDS = Object.freeze(['pale', 'light', 'tan', 'ruddy', 'brown', 'dark']);
export const PLAYER_AGE_IDS = Object.freeze(['fresh', 'adult', 'weathered', 'elder']);
export const PLAYER_FACE_SHAPE_IDS = Object.freeze(['narrow', 'oval', 'broad', 'long']);
export const PLAYER_FACE_MARK_IDS = Object.freeze(['none', 'split-brow', 'cheek-scar', 'burn-scar', 'eye-patch']);
export const PLAYER_HAIR_COLOR_IDS = Object.freeze(['black', 'brown', 'auburn', 'blond', 'grey', 'white']);
export const PLAYER_HAIR_STYLE_IDS = Object.freeze(['cropped', 'bobbed', 'loose', 'tied', 'braid', 'tonsure', 'shaved', 'hooded']);
export const PLAYER_FACIAL_HAIR_IDS = Object.freeze(['none', 'stubble', 'moustache', 'goatee', 'short-beard', 'beard']);

const PLAYER_GENDER_MODELS = Object.freeze({
  female: Object.freeze({ bodyFrame: 'feminine', anatomy: 'vulva', breastSize: 5, penisSize: 0, shoulders: 14, waist: 8, hipFlare: 3, torsoLength: 16, legLength: 24, legSize: 2, armSize: 2 }),
  male: Object.freeze({ bodyFrame: 'masculine', anatomy: 'penis', breastSize: 1, penisSize: 5, shoulders: 18, waist: 11, hipFlare: 0, torsoLength: 17, legLength: 24, legSize: 2, armSize: 3 }),
  androgynous: Object.freeze({ bodyFrame: 'androgynous', anatomy: 'smooth', breastSize: 2, penisSize: 0, shoulders: 15, waist: 9, hipFlare: 1, torsoLength: 16, legLength: 24, legSize: 2, armSize: 2 })
});

// Silhouette per frame: feminine narrows the shoulders and flares the hips,
// masculine broadens the shoulders and thickens the arms, androgynous sits
// between both. These must stay in step with PLAYER_GENDER_MODELS above.
const PLAYER_BODY_FRAMES = Object.freeze({
  feminine: Object.freeze({ shoulders: 14, waist: 8, hipFlare: 3, torsoLength: 16, legLength: 24, legSize: 2, armSize: 2 }),
  masculine: Object.freeze({ shoulders: 18, waist: 11, hipFlare: 0, torsoLength: 17, legLength: 24, legSize: 2, armSize: 3 }),
  androgynous: Object.freeze({ shoulders: 15, waist: 9, hipFlare: 1, torsoLength: 16, legLength: 24, legSize: 2, armSize: 2 })
});

// legSize/armSize are deltas on top of the gender frame's limb thickness,
// so a buff male stays thicker-armed than a buff female.
const BODY_TYPE_OVERLAYS = Object.freeze({
  skinny: Object.freeze({ shoulders: -2, waist: -2, torsoLength: 0, legLength: 1, legSize: -1, armSize: -1, coatTailMin: 5 }),
  medium: Object.freeze({}),
  stocky: Object.freeze({ shoulders: 2, waist: 2, torsoLength: 0, legLength: -1, legSize: 0, armSize: 1, coatTailMin: 7 }),
  fat: Object.freeze({ shoulders: 1, waist: 4, torsoLength: 1, legLength: -2, legSize: 0, armSize: 0, coatTailMin: 8 }),
  buff: Object.freeze({ shoulders: 4, waist: 2, torsoLength: 1, legLength: 0, legSize: 0, armSize: 1, coatTailMin: 7 })
});

const STATURE_OVERLAYS = Object.freeze({
  short: Object.freeze({ torsoLength: -1, legLength: -3 }),
  average: Object.freeze({}),
  tall: Object.freeze({ torsoLength: 1, legLength: 3 })
});

const POSTURE_STYLES = Object.freeze({
  upright: Object.freeze({ hunch: 0, postureLean: 0, postureCompression: 0 }),
  guarded: Object.freeze({ hunch: 2, postureLean: 1, postureCompression: 1 }),
  stooped: Object.freeze({ hunch: 4, postureLean: 3, postureCompression: 3 })
});

const SKIN_TONE_RAMPS = Object.freeze({
  pale: Object.freeze({ hi: PALETTE.hostBone, mid: PALETTE.skinLight, lo: PALETTE.stoneDust, dk: PALETTE.skinDark }),
  light: Object.freeze({ hi: PALETTE.hostBone, mid: PALETTE.skinLight, lo: PALETTE.skinMid, dk: PALETTE.skinDark }),
  tan: Object.freeze({ hi: PALETTE.skinLight, mid: PALETTE.skinMid, lo: PALETTE.skinDark, dk: PALETTE.clothDark }),
  ruddy: Object.freeze({ hi: PALETTE.skinLight, mid: PALETTE.rustLight, lo: PALETTE.rustMid, dk: PALETTE.rustDark }),
  brown: Object.freeze({ hi: PALETTE.skinMid, mid: PALETTE.skinDark, lo: PALETTE.woodMid, dk: PALETTE.woodDark }),
  dark: Object.freeze({ hi: PALETTE.skinDark, mid: PALETTE.woodMid, lo: PALETTE.woodDark, dk: PALETTE.void })
});

const HAIR_COLOR_RAMPS = Object.freeze({
  black: Object.freeze({ mid: PALETTE.clothDark, hi: PALETTE.stoneDark }),
  brown: Object.freeze({ mid: PALETTE.woodMid, hi: PALETTE.woodLight }),
  auburn: Object.freeze({ mid: PALETTE.rustMid, hi: PALETTE.rustLight }),
  blond: Object.freeze({ mid: PALETTE.clothTan, hi: PALETTE.hostBone }),
  grey: Object.freeze({ mid: PALETTE.stoneMid, hi: PALETTE.stoneDust }),
  white: Object.freeze({ mid: PALETTE.stoneDust, hi: PALETTE.hostBone })
});

const PLAYER_ITEM_VISUALS = {
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

export const PLAYER_DEFAULT_EQUIPMENT = {
  clothes: 'censure-field-coat',
  armor: 'scarred-leather-vest',
  boots: 'ash-road-boots',
  helmet: 'censure-hood',
  trinket: 'tarnished-saint-token',
  ring1: 'iron-vow-ring',
  ring2: 'mourning-ring'
};

const PLAYER_ANATOMY_IDS = new Set(['vulva', 'penis', 'smooth', 'intersex']);
const PLAYER_GENDER_MODEL_ID_SET = new Set(PLAYER_GENDER_MODEL_IDS);
const PLAYER_BODY_TYPE_ID_SET = new Set(PLAYER_BODY_TYPE_IDS);
const PLAYER_STATURE_ID_SET = new Set(PLAYER_STATURE_IDS);
const PLAYER_POSTURE_ID_SET = new Set(PLAYER_POSTURE_IDS);
const PLAYER_SKIN_TONE_ID_SET = new Set(PLAYER_SKIN_TONE_IDS);
const PLAYER_AGE_ID_SET = new Set(PLAYER_AGE_IDS);
const PLAYER_FACE_SHAPE_ID_SET = new Set(PLAYER_FACE_SHAPE_IDS);
const PLAYER_FACE_MARK_ID_SET = new Set(PLAYER_FACE_MARK_IDS);
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

function clampBodyFeatureSize(value, fallback) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  return Math.max(0, Math.min(10, Math.round(value)));
}

export function normalizePlayerAppearance(appearance = {}) {
  const genderModel = typeof appearance?.genderModel === 'string' && PLAYER_GENDER_MODEL_ID_SET.has(appearance.genderModel)
    ? appearance.genderModel
    : genderModelForBodyFrame(appearance?.bodyFrame);
  const model = PLAYER_GENDER_MODELS[genderModel] ?? PLAYER_GENDER_MODELS.female;
  const bodyType = typeof appearance?.bodyType === 'string' && PLAYER_BODY_TYPE_ID_SET.has(appearance.bodyType)
    ? appearance.bodyType
    : PLAYER_DEFAULT_APPEARANCE.bodyType;
  const stature = typeof appearance?.stature === 'string' && PLAYER_STATURE_ID_SET.has(appearance.stature)
    ? appearance.stature
    : PLAYER_DEFAULT_APPEARANCE.stature;
  const posture = typeof appearance?.posture === 'string' && PLAYER_POSTURE_ID_SET.has(appearance.posture)
    ? appearance.posture
    : PLAYER_DEFAULT_APPEARANCE.posture;
  const skinTone = typeof appearance?.skinTone === 'string' && PLAYER_SKIN_TONE_ID_SET.has(appearance.skinTone)
    ? appearance.skinTone
    : PLAYER_DEFAULT_APPEARANCE.skinTone;
  const age = typeof appearance?.age === 'string' && PLAYER_AGE_ID_SET.has(appearance.age)
    ? appearance.age
    : PLAYER_DEFAULT_APPEARANCE.age;
  const faceShape = typeof appearance?.faceShape === 'string' && PLAYER_FACE_SHAPE_ID_SET.has(appearance.faceShape)
    ? appearance.faceShape
    : PLAYER_DEFAULT_APPEARANCE.faceShape;
  const faceMark = typeof appearance?.faceMark === 'string' && PLAYER_FACE_MARK_ID_SET.has(appearance.faceMark)
    ? appearance.faceMark
    : PLAYER_DEFAULT_APPEARANCE.faceMark;
  const hairColor = typeof appearance?.hairColor === 'string' && PLAYER_HAIR_COLOR_ID_SET.has(appearance.hairColor)
    ? appearance.hairColor
    : PLAYER_DEFAULT_APPEARANCE.hairColor;
  const hairStyle = typeof appearance?.hairStyle === 'string' && PLAYER_HAIR_STYLE_ID_SET.has(appearance.hairStyle)
    ? appearance.hairStyle
    : PLAYER_DEFAULT_APPEARANCE.hairStyle;
  const facialHair = typeof appearance?.facialHair === 'string' && PLAYER_FACIAL_HAIR_ID_SET.has(appearance.facialHair)
    ? appearance.facialHair
    : PLAYER_DEFAULT_APPEARANCE.facialHair;
  const bodyFrame = typeof appearance?.bodyFrame === 'string' && PLAYER_BODY_FRAMES[appearance.bodyFrame]
    ? appearance.bodyFrame
    : model.bodyFrame;
  const anatomy = typeof appearance?.anatomy === 'string' && PLAYER_ANATOMY_IDS.has(appearance.anatomy)
    ? appearance.anatomy
    : model.anatomy;
  const breastSize = clampBodyFeatureSize(appearance?.breastSize, model.breastSize ?? PLAYER_DEFAULT_APPEARANCE.breastSize);
  const penisSize = clampBodyFeatureSize(appearance?.penisSize, model.penisSize ?? PLAYER_DEFAULT_APPEARANCE.penisSize);
  return {
    genderModel,
    bodyType,
    stature,
    posture,
    skinTone,
    age,
    faceShape,
    faceMark,
    hairColor,
    hairStyle,
    facialHair,
    bodyFrame,
    anatomy,
    breastSize,
    penisSize
  };
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

function composePlayerStyle(visuals, appearance = {}) {
  const style = { ...PLAYER_BODY };
  const normalizedAppearance = normalizePlayerAppearance(appearance);
  const model = PLAYER_GENDER_MODELS[normalizedAppearance.genderModel] ?? PLAYER_GENDER_MODELS.female;
  Object.assign(style, model);
  applyBodyType(style, normalizedAppearance.bodyType);
  applySkinTone(style, normalizedAppearance.skinTone);
  applyHair(style, normalizedAppearance.hairColor, normalizedAppearance.hairStyle, normalizedAppearance.facialHair);
  Object.assign(style, PLAYER_BODY_FRAMES[normalizedAppearance.bodyFrame]);
  applyBodyType(style, normalizedAppearance.bodyType);
  applyStature(style, normalizedAppearance.stature);
  applyPosture(style, normalizedAppearance.posture);
  applyFace(style, normalizedAppearance.faceShape, normalizedAppearance.faceMark, normalizedAppearance.age);
  style.bodyFrame = normalizedAppearance.bodyFrame;
  style.genderModel = normalizedAppearance.genderModel;
  style.bodyType = normalizedAppearance.bodyType;
  style.stature = normalizedAppearance.stature;
  style.posture = normalizedAppearance.posture;
  style.skinTone = normalizedAppearance.skinTone;
  style.age = normalizedAppearance.age;
  style.faceShape = normalizedAppearance.faceShape;
  style.faceMark = normalizedAppearance.faceMark;
  style.hairColor = normalizedAppearance.hairColor;
  style.hairStyle = normalizedAppearance.hairStyle;
  style.facialHair = normalizedAppearance.facialHair;
  style.anatomy = normalizedAppearance.anatomy;
  style.breastSize = normalizedAppearance.breastSize;
  style.penisSize = normalizedAppearance.penisSize;
  style.anatomyVisible = !visuals.clothes;

  const clothes = visuals.clothes;
  if (!clothes) {
    style.coatHi = style.skinHi;
    style.coat = style.skin;
    style.coatLo = style.skinLo;
    style.coatDk = style.skinDk;
    style.pantsHi = style.skinHi;
    style.pants = style.skin;
    style.pantsLo = style.skinLo;
    style.pantsDk = style.skinDk;
    style.coatTail = 0;
    style.belt = null;
    style.fieldHarness = false;
  } else {
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
  if (clothes && overlay.coatTailMin) style.coatTail = Math.max(style.coatTail ?? 0, overlay.coatTailMin);

  return style;
}

function applyBodyType(style, bodyType) {
  const overlay = BODY_TYPE_OVERLAYS[bodyType] ?? BODY_TYPE_OVERLAYS.medium;
  for (const key of ['shoulders', 'waist', 'torsoLength', 'legLength']) {
    if (typeof overlay[key] === 'number') style[key] = Math.max(1, style[key] + overlay[key]);
  }
  if (typeof overlay.legSize === 'number') style.legSize = Math.max(1, (style.legSize ?? 2) + overlay.legSize);
  if (typeof overlay.armSize === 'number') style.armSize = Math.max(1, (style.armSize ?? 2) + overlay.armSize);
}

function applyStature(style, stature) {
  const overlay = STATURE_OVERLAYS[stature] ?? STATURE_OVERLAYS.average;
  for (const key of ['torsoLength', 'legLength']) {
    if (typeof overlay[key] === 'number') style[key] = Math.max(1, style[key] + overlay[key]);
  }
}

function applyPosture(style, posture) {
  Object.assign(style, POSTURE_STYLES[posture] ?? POSTURE_STYLES.upright);
}

function applyFace(style, faceShape, faceMark, age) {
  style.faceShape = faceShape;
  style.faceMark = faceMark;
  style.age = age;
  style.headHeight = faceShape === 'long' ? 10 : 9;
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

export function derivePlayerStyle(equipment = {}, itemDefs = {}, appearance = {}) {
  const visuals = {};
  for (const [slot, itemId] of Object.entries(equipment)) {
    if (!itemId) continue;
    if (slot === 'activeWeapon') continue;
    const baseSlot = slot === 'ring1' || slot === 'ring2' ? 'ring' : slot;
    visuals[baseSlot] =
      itemDefs?.[itemId]?.visual ?? PLAYER_ITEM_VISUALS[itemId] ?? genericVisualForSlot(baseSlot);
  }
  const style = composePlayerStyle(visuals, appearance);
  const activeWeapon = equipment.activeWeapon ? itemDefs?.[equipment.activeWeapon] : null;
  style.weaponProfile = activeWeapon?.groundModel ?? 'knife';
  return style;
}

export function bakePlayerCharacter(
  equipment = PLAYER_DEFAULT_EQUIPMENT,
  itemDefs = {},
  appearance = PLAYER_DEFAULT_APPEARANCE
) {
  return bakeActor(42, 62, derivePlayerStyle(equipment, itemDefs, appearance));
}
