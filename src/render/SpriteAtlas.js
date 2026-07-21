// Directional, animated, lo-fi isometric actor sprite facade.

import { bakeActor } from './sprites/spriteBake.js';
import { bakePlayerCharacter, PLAYER_DEFAULT_EQUIPMENT } from './sprites/playerAppearance.js';
import { CUT_STYLE, CHOIR_STYLE, PEN_STYLE } from './sprites/hostCreatures.js';
import { SAVA_RELL_STYLE } from './sprites/savaRell.js';
import { FALSE_CATECHIST_STYLE } from './sprites/falseCatechist.js';
import { INTAKE_CLERK_STYLE } from './sprites/intakeClerk.js';
import { bakeBrotherTarn } from './sprites/brotherTarn.js';
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
import {
  STAGE_IV_LURE_STYLE,
  STAGE_IV_RUNNER_ASH_STYLE,
  STAGE_IV_RUNNER_ROAD_STYLE
} from './sprites/stageIvActors.js';
import { bakeUtilityDrone } from './sprites/utilityDrone.js';

export { SPRITE_POSE_FRAME_COUNTS, getFrame } from './sprites/spriteBake.js';
export {
  PLAYER_DEFAULT_APPEARANCE,
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
  bakePlayerCharacter,
  derivePlayerStyle,
  normalizePlayerAppearance
} from './sprites/playerAppearance.js';
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
  'south-measure-false-catechist',
  'south-measure-intake-clerk',
  'brother-tarn',
  'host-rat-sixlegs',
  'host-rat-throat-maw',
  'host-rat-tendril-walker',
  'host-wolf-spider',
  'host-wolf-maw',
  'host-wolf-ribsplit',
  'stage-iv-lure',
  'stage-iv-runner-ash',
  'stage-iv-runner-road',
  'utility-drone-mark-i',
  'utility-drone-mark-i-core',
  'utility-drone-mark-i-energy',
  'utility-drone-mark-i-bulwark',
  'utility-drone-mark-i-medical',
  'utility-drone-mark-i-veil',
  'utility-drone-mark-i-fieldworks'
]);

export const SPRITE_ATLAS_IDS = Object.freeze([...BASE_SPRITE_ATLAS_IDS, ...HUMAN_MODEL_IDS]);

export function buildSpriteAtlas() {
  const atlas = {
    'player': bakePlayerCharacter(PLAYER_DEFAULT_EQUIPMENT, {}),
    // Legacy atlas key retained for existing levels and save data.
    'mara-vey': bakePlayerCharacter(PLAYER_DEFAULT_EQUIPMENT, {}),
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
    'south-measure-false-catechist': bakeActor(44, 64, FALSE_CATECHIST_STYLE),
    'south-measure-intake-clerk': bakeActor(48, 68, INTAKE_CLERK_STYLE),
    'brother-tarn': bakeBrotherTarn(),
    'host-rat-sixlegs': bakeHostRat('sixlegs', drawSixLeggedRat),
    'host-rat-throat-maw': bakeHostRat('maw', drawThroatMawRat),
    'host-rat-tendril-walker': bakeHostRat('tendril', drawTendrilWalkerRat),
    'host-wolf-spider': bakeHostWolf('spider', drawHostWolfSpider),
    'host-wolf-maw': bakeHostWolf('maw', drawHostWolfMaw),
    'host-wolf-ribsplit': bakeHostWolf('ribsplit', drawHostWolfRibsplit),
    'stage-iv-lure': bakeActor(46, 66, STAGE_IV_LURE_STYLE),
    'stage-iv-runner-ash': bakeActor(48, 68, STAGE_IV_RUNNER_ASH_STYLE),
    'stage-iv-runner-road': bakeActor(48, 68, STAGE_IV_RUNNER_ROAD_STYLE),
    'utility-drone-mark-i': bakeUtilityDrone(),
    'utility-drone-mark-i-core': bakeUtilityDrone('core'),
    'utility-drone-mark-i-energy': bakeUtilityDrone('energy'),
    'utility-drone-mark-i-bulwark': bakeUtilityDrone('bulwark'),
    'utility-drone-mark-i-medical': bakeUtilityDrone('medical'),
    'utility-drone-mark-i-veil': bakeUtilityDrone('veil'),
    'utility-drone-mark-i-fieldworks': bakeUtilityDrone('fieldworks')
  };

  for (const model of HUMAN_MODEL_DEFS) {
    atlas[model.id] = bakeActor(model.width, model.height, model.style);
  }

  return atlas;
}
