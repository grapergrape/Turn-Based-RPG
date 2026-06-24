import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  BUILD_PROFILES,
  ENEMY_COMPLEXITIES,
  FIELD_RATINGS,
  LEVEL_CAP,
  PRIMARY_ATTRIBUTES,
  TRACE_STAGES
} from '../../src/core/Progression.js';
import {
  HUMAN_ACCENT_IDS,
  HUMAN_BODY_IDS,
  HUMAN_GEAR_IDS,
  HUMAN_OUTFIT_IDS,
  PLAYER_BODY_TYPE_IDS,
  PLAYER_FACIAL_HAIR_IDS,
  PLAYER_GENDER_MODEL_IDS,
  PLAYER_HAIR_COLOR_IDS,
  PLAYER_HAIR_STYLE_IDS,
  PLAYER_SKIN_TONE_IDS,
  SPRITE_ATLAS_IDS
} from '../../src/render/SpriteAtlas.js';
import { getSprite } from '../../src/render/spriteCatalog.js';
import { FLOOR_STYLE_IDS } from '../../src/render/primitives/terrain.js';
import { Grid } from '../../src/world/Grid.js';
import { findPathToAdjacent } from '../../src/world/Pathfinder.js';
import {
  PATROL_MODES,
  PERCEPTION_FACINGS,
  SUSPICION_SEVERITY
} from '../../src/world/PerceptionSystem.js';
import { TECHNIQUE_TYPES } from '../../src/core/TechniqueSystem.js';

export const root = process.cwd();
export const dataRoot = join(root, 'data');
export const errors = [];

// NOTE: DECAL_KINDS below is a curated scene-density heuristic (ground clutter
// to keep rooms from looking bare), NOT the renderer's flat-decal set. The
// authoritative list of renderable kinds and which are flat lives in the sprite
// catalog (src/render/spriteCatalog.js); kind validity is checked against it.

// Content this slice (Ash Chapel Breach) must contain.
export const MAIN_LEVEL_ID = 'ash-chapel-breach';
export const CELLAR_LEVEL_ID = 'ash-chapel-cellar';
export const REQUIRED_MAIN_ENEMY_IDS = [
  'choir-flesh-eater',
  'choir-candle-bearer',
  'choir-throat-singer',
  'host-touched-penitent'
];
export const REQUIRED_INTERACTABLE_KINDS = ['rusted-reliquary', 'field-satchel', 'damaged-altar', 'rusted-barrel'];
export const REQUIRED_ITEM_IDS = [
  'ducat',
  'relic-rounds',
  'field-dressing',
  'tarnished-saint-token',
  'road-warden-chit',
  'choir-hymnal-fragment'
];
export const REQUIRED_QUEST_IDS = ['investigate-ash-chapel-cult'];
export const REQUIRED_DIALOGUE_IDS = [
  'ash-chapel-altar-rite',
  'ash-chapel-barrel-ladder',
  'ash-chapel-cellar-corpse',
  'ash-chapel-cellar-ladder',
  'ash-chapel-cult-ledger'
];
export const DECAL_KINDS = new Set([
  'rubble-pile', 'rubble-decal', 'floor-crack', 'blood-stain', 'glass-debris', 'dust', 'road-dust'
]);
export const ITEM_EQUIPMENT_SLOTS = new Set(['clothes', 'armor', 'boots', 'helmet', 'trinket', 'ring']);
export const ITEM_GROUND_MODELS = new Set([
  'ball', 'boots', 'coat', 'hood', 'vest', 'ring', 'necklace', 'key',
  'token', 'chit', 'paper', 'vial', 'dressing', 'rounds', 'shard', 'food'
]);
export const GROUND_ITEM_PICKUP_POLICIES = new Set(['player', 'any']);
export const DOOR_LEAVES = new Set(['north', 'south']);
export const WALL_PLANES = new Set(['sw', 'se']);
export const WALL_SIDES = new Set(['near', 'far']); // Which face of an opening a wall fixture mounts on.
// Iso facings for orientation-aware props (mirrors ORIENTS in PixelPrimitives.js).
export const PROP_ORIENTS = new Set(['se', 'sw', 'nw', 'ne']);
export const FLOOR_STYLE_ID_SET = new Set(FLOOR_STYLE_IDS);
export const PERCEPTION_FACING_IDS = new Set(PERCEPTION_FACINGS);
export const PATROL_MODE_IDS = new Set(PATROL_MODES);
export const SUSPICION_SEVERITY_IDS = new Set(Object.values(SUSPICION_SEVERITY));
export const ACTOR_EQUIPMENT_SLOTS = new Set(['clothes', 'armor', 'boots', 'helmet', 'trinket', 'ring1', 'ring2']);
export const ACTOR_BODY_FRAMES = new Set(['feminine', 'masculine', 'androgynous']);
export const ACTOR_ANATOMY = new Set(['vulva', 'penis', 'smooth', 'intersex']);
export const ACTOR_SPRITE_IDS = new Set(SPRITE_ATLAS_IDS);
export const PLAYER_GENDER_MODEL_ID_SET = new Set(PLAYER_GENDER_MODEL_IDS);
export const PLAYER_BODY_TYPE_ID_SET = new Set(PLAYER_BODY_TYPE_IDS);
export const PLAYER_SKIN_TONE_ID_SET = new Set(PLAYER_SKIN_TONE_IDS);
export const PLAYER_HAIR_COLOR_ID_SET = new Set(PLAYER_HAIR_COLOR_IDS);
export const PLAYER_HAIR_STYLE_ID_SET = new Set(PLAYER_HAIR_STYLE_IDS);
export const PLAYER_FACIAL_HAIR_ID_SET = new Set(PLAYER_FACIAL_HAIR_IDS);
export const HUMAN_BODY_ID_SET = new Set(HUMAN_BODY_IDS);
export const HUMAN_OUTFIT_ID_SET = new Set(HUMAN_OUTFIT_IDS);
export const HUMAN_GEAR_ID_SET = new Set(HUMAN_GEAR_IDS);
export const HUMAN_ACCENT_ID_SET = new Set(HUMAN_ACCENT_IDS);
export const PRIMARY_ATTRIBUTE_IDS = new Set(PRIMARY_ATTRIBUTES.map((primary) => primary.id));
export const FIELD_RATING_IDS = new Set(FIELD_RATINGS.map((field) => field.id));
export const TRACE_STAGE_VALUES = new Set(TRACE_STAGES.map((stage) => stage.value));
export const BUILD_PROFILE_IDS = new Set(BUILD_PROFILES.map((profile) => profile.id));
export const ENEMY_COMPLEXITY_IDS = new Set(ENEMY_COMPLEXITIES.map((profile) => profile.id));
export const TECHNIQUE_TYPE_IDS = new Set(TECHNIQUE_TYPES);
export const TECHNIQUE_TARGET_IDS = new Set(['enemy', 'self', 'tile', 'object']);

export const seenItemIds = new Set();
export const seenActorIds = new Set();
export const seenQuestIds = new Set();
export const seenDialogueIds = new Set();
export const seenTechniqueIds = new Set();
export const referencedItemIds = new Set();
export const referencedActorIds = new Set();
export const referencedDialogueIds = new Set();
export const referencedTechniqueIds = new Set();

export function matchDir(filePath, dir) {
  return filePath.includes(`/${dir}/`) || filePath.includes(`\\${dir}\\`);
}

export async function checkRenderConfig() {
  const configUrl = pathToFileURL(join(root, 'src', 'render', 'renderConfig.js'));
  try {
    const { RENDER_CONFIG } = await import(configUrl.href);
    const expect = (key, value) => {
      if (RENDER_CONFIG[key] !== value) {
        errors.push(`renderConfig: ${key} must be ${JSON.stringify(value)} (got ${JSON.stringify(RENDER_CONFIG[key])}).`);
      }
    };
    expect('INTERNAL_WIDTH', 640);
    expect('INTERNAL_HEIGHT', 480);
    expect('VIEWPORT_HEIGHT', 384);
    expect('TILE_WIDTH', 64);
    expect('TILE_HEIGHT', 32);
    expect('WALL_HEIGHT', 64);
    expect('DEBUG_GRID_DEFAULT', false);
  } catch (error) {
    errors.push(`renderConfig could not be loaded: ${error.message}`);
  }
}

export async function findJsonFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const results = [];

  for (const entry of entries) {
    const fullPath = join(directory, entry.name);

    if (entry.isDirectory()) {
      results.push(...await findJsonFiles(fullPath));
      continue;
    }

    if (entry.isFile() && entry.name.endsWith('.json')) {
      results.push(fullPath);
    }
  }

  return results;
}

export async function readJson(filePath) {
  try {
    const text = await readFile(filePath, 'utf8');
    return JSON.parse(text);
  } catch (error) {
    errors.push(`${relative(filePath)} is invalid JSON: ${error.message}`);
    return null;
  }
}

export function validateXpNumber(name, value, fieldName) {
  if (value === undefined) return;
  requireNumber(name, value, fieldName);
  if (typeof value === 'number' && (!Number.isInteger(value) || value < 0)) {
    errors.push(`${name}: ${fieldName} must be a zero or greater integer.`);
  }
}

export function validateOptionalBoolean(name, value, fieldName) {
  if (value !== undefined && typeof value !== 'boolean') {
    errors.push(`${name}: ${fieldName} must be a boolean.`);
  }
}

export function validateGridPoint(name, point, fieldName) {
  if (!point || typeof point !== 'object' || Array.isArray(point)) {
    errors.push(`${name}: ${fieldName} must be an object with x and y.`);
    return;
  }
  requireNumber(name, point.x, `${fieldName}.x`);
  requireNumber(name, point.y, `${fieldName}.y`);
  if (typeof point.x === 'number' && !Number.isInteger(point.x)) {
    errors.push(`${name}: ${fieldName}.x must be an integer.`);
  }
  if (typeof point.y === 'number' && !Number.isInteger(point.y)) {
    errors.push(`${name}: ${fieldName}.y must be an integer.`);
  }
}

export function requireString(fileName, value, fieldName) {
  if (typeof value !== 'string' || value.trim() === '') {
    errors.push(`${fileName}: ${fieldName} must be a non-empty string.`);
  }
}

export function requireNumber(fileName, value, fieldName) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    errors.push(`${fileName}: ${fieldName} must be a number.`);
  }
}

export function relative(filePath) {
  return filePath.replace(`${root}/`, '').replace(`${root}\\`, '');
}

export { getSprite, Grid, findPathToAdjacent };
export {
  BUILD_PROFILES,
  ENEMY_COMPLEXITIES,
  FIELD_RATINGS,
  LEVEL_CAP,
  PRIMARY_ATTRIBUTES,
  TRACE_STAGES
};
