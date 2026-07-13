// Directional, animated, lo-fi isometric actor sprite facade.

import { bakeActor } from './sprites/spriteBake.js';
import { bakeMara, MARA_DEFAULT_EQUIPMENT } from './sprites/maraAppearance.js';
import { CUT_STYLE, CHOIR_STYLE, PEN_STYLE } from './sprites/hostCreatures.js';
import { SAVA_RELL_STYLE } from './sprites/savaRell.js';
import {
  HUMAN_MODEL_DEFS,
  HUMAN_MODEL_IDS,
  SURVIVOR_CHILD_STYLE,
  SURVIVOR_MAN_STYLE,
  SURVIVOR_VARIANTS,
  SURVIVOR_WOMAN_STYLE
} from './sprites/humanModels.js';
import { bakeHostWolf, drawHostWolfMaw, drawHostWolfRibsplit, drawHostWolfSpider } from './sprites/hostWolfCreatures.js';
import { bakeHostRat, drawSixLeggedRat, drawTendrilWalkerRat, drawThroatMawRat } from './sprites/ratCreatures.js';

export { SPRITE_POSE_FRAME_COUNTS, getFrame } from './sprites/spriteBake.js';
export {
  MARA_DEFAULT_APPEARANCE,
  PLAYER_AGE_IDS,
  PLAYER_BODY_TYPE_IDS,
  PLAYER_FACE_MARK_IDS,
  PLAYER_FACE_SHAPE_IDS,
  PLAYER_FACIAL_HAIR_IDS,
  PLAYER_GENDER_MODEL_IDS,
  PLAYER_HAIR_COLOR_IDS,
  PLAYER_HAIR_STYLE_IDS,
  PLAYER_POSTURE_IDS,
  PLAYER_SKIN_TONE_IDS,
  PLAYER_STATURE_IDS,
  bakeMara,
  bakePlayerCharacter,
  deriveMaraStyle,
  derivePlayerStyle,
  normalizePlayerAppearance
} from './sprites/maraAppearance.js';
export {
  HUMAN_ACCENT_IDS,
  HUMAN_BODY_IDS,
  HUMAN_GEAR_IDS,
  HUMAN_OUTFIT_IDS,
  bakeHumanAppearance,
  deriveHumanAppearanceStyle,
  isHumanAppearance,
  spriteIdForHumanAppearance
} from './sprites/humanAppearance.js';
export { HUMAN_MODEL_IDS, HUMAN_MODEL_SUMMARY } from './sprites/humanModels.js';

const BASE_SPRITE_ATLAS_IDS = Object.freeze([
  'player',
  'mara-vey',
  'settlement-man',
  'settlement-woman',
  'settlement-child',
  'settlement-selka',
  'settlement-mirel',
  'settlement-oren',
  'settlement-tomas',
  'settlement-runa',
  'settlement-istra',
  'settlement-nessa',
  'settlement-dalia',
  'settlement-hanne',
  'settlement-corin',
  'settlement-eda',
  'choir-cultist',
  'red-tithe-cutthroat',
  'host-penitent-bastion',
  'host-touched-penitent',
  'host-sava-rell',
  'host-rat-sixlegs',
  'host-rat-throat-maw',
  'host-rat-tendril-walker',
  'host-wolf-spider',
  'host-wolf-maw',
  'host-wolf-ribsplit'
]);

export const SPRITE_ATLAS_IDS = Object.freeze([...BASE_SPRITE_ATLAS_IDS, ...HUMAN_MODEL_IDS]);

export function buildSpriteAtlas() {
  const atlas = {
    'player': bakeMara(MARA_DEFAULT_EQUIPMENT, {}),
    'mara-vey': bakeMara(MARA_DEFAULT_EQUIPMENT, {}),
    'settlement-man': bakeActor(42, 62, SURVIVOR_MAN_STYLE),
    'settlement-woman': bakeActor(42, 62, SURVIVOR_WOMAN_STYLE),
    'settlement-child': bakeActor(36, 50, SURVIVOR_CHILD_STYLE),
    'settlement-selka': bakeActor(42, 62, SURVIVOR_VARIANTS.selka),
    'settlement-mirel': bakeActor(42, 62, SURVIVOR_VARIANTS.mirel),
    'settlement-oren': bakeActor(42, 62, SURVIVOR_VARIANTS.oren),
    'settlement-tomas': bakeActor(42, 62, SURVIVOR_VARIANTS.tomas),
    'settlement-runa': bakeActor(42, 62, SURVIVOR_VARIANTS.runa),
    'settlement-istra': bakeActor(42, 62, SURVIVOR_VARIANTS.istra),
    'settlement-nessa': bakeActor(42, 62, SURVIVOR_VARIANTS.nessa),
    'settlement-dalia': bakeActor(42, 62, SURVIVOR_VARIANTS.dalia),
    'settlement-hanne': bakeActor(42, 62, SURVIVOR_VARIANTS.hanne),
    'settlement-corin': bakeActor(36, 50, SURVIVOR_VARIANTS.corin),
    'settlement-eda': bakeActor(36, 50, SURVIVOR_VARIANTS.eda),
    'choir-cultist': bakeActor(44, 64, CHOIR_STYLE),
    'red-tithe-cutthroat': bakeActor(44, 64, CUT_STYLE),
    'host-penitent-bastion': bakeActor(64, 92, PEN_STYLE),
    'host-touched-penitent': bakeActor(64, 92, PEN_STYLE),
    'host-sava-rell': bakeActor(46, 68, SAVA_RELL_STYLE),
    'host-rat-sixlegs': bakeHostRat('sixlegs', drawSixLeggedRat),
    'host-rat-throat-maw': bakeHostRat('maw', drawThroatMawRat),
    'host-rat-tendril-walker': bakeHostRat('tendril', drawTendrilWalkerRat),
    'host-wolf-spider': bakeHostWolf('spider', drawHostWolfSpider),
    'host-wolf-maw': bakeHostWolf('maw', drawHostWolfMaw),
    'host-wolf-ribsplit': bakeHostWolf('ribsplit', drawHostWolfRibsplit)
  };

  for (const model of HUMAN_MODEL_DEFS) {
    atlas[model.id] = bakeActor(model.width, model.height, model.style);
  }

  return atlas;
}
