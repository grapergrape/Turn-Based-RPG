import {
  DOOR_LEAVES,
  FIELD_RATING_IDS,
  FLOOR_STYLE_ID_SET,
  GROUND_ITEM_PICKUP_POLICIES,
  PATROL_MODE_IDS,
  PERCEPTION_FACING_IDS,
  PROP_ORIENTS,
  PRIMARY_ATTRIBUTE_IDS,
  SUSPICION_SEVERITY_IDS,
  WALL_PLANES,
  WALL_SIDES,
  errors,
  findPathToAdjacent,
  getSprite,
  Grid,
  referencedActorIds,
  referencedDialogueIds,
  referencedItemIds,
  relative,
  validateGridPoint,
  requireNumber,
  requireString,
  validateOptionalBoolean
} from './validationContext.mjs';
import { isStatefulInteractable } from '../../src/world/ObjectIdentity.js';
import { validateLoot } from './itemValidator.mjs';
import { validateActorAppearance, validateActorSpriteId } from './renderCatalogValidator.mjs';
import { validateDialogueConditions, validateDialogueEffects, validateDialogueReference } from './dialogueValidator.mjs';
import { validateBarkCollection, validateStringList } from './textRules.mjs';
import {
  NPC_ACTIVITY_MOTIONS,
  NPC_ACTIVITY_RESPONSES,
  NPC_ACTIVITY_SOUNDS
} from '../../src/world/NpcActivity.js';

const MAP_MARKER_KINDS = new Set(['quest', 'dialogue', 'exit', 'locked', 'search', 'danger', 'note']);
const MAP_MARKER_REVEALS = new Set(['explored', 'always']);
const COVER_VALUES = new Set(['none', 'light', 'hard']);
const PATROL_ACTIVITY_MIN_DURATION = 0.8;
const PATROL_ACTIVITY_MAX_DURATION = 12;
const NPC_ACTIVITY_MOTION_SET = new Set(NPC_ACTIVITY_MOTIONS);
const NPC_ACTIVITY_RESPONSE_SET = new Set(NPC_ACTIVITY_RESPONSES);
const NPC_ACTIVITY_SOUND_SET = new Set(NPC_ACTIVITY_SOUNDS);
const AMBIENT_BED_PROFILES = new Set([
  'receiving-canvas',
  'waterworks',
  'freight-yard',
  'rope-rows'
]);

function validateTiles(name, data) {
  if (!Array.isArray(data.tiles)) {
    errors.push(`${name}: tiles must be an array of strings.`);
    return;
  }

  if (data.tiles.length !== data.height) {
    errors.push(`${name}: tiles length ${data.tiles.length} does not match height ${data.height}.`);
  }

  for (let y = 0; y < data.tiles.length; y += 1) {
    const row = data.tiles[y];

    if (typeof row !== 'string') {
      errors.push(`${name}: tile row ${y} must be a string.`);
      continue;
    }

    if (row.length !== data.width) {
      errors.push(`${name}: tile row ${y} length ${row.length} does not match width ${data.width}.`);
    }

    for (const tileChar of row) {
      if (!data.legend || !Object.hasOwn(data.legend, tileChar)) {
        errors.push(`${name}: tile character "${tileChar}" is missing from legend.`);
      }
    }
  }
}

function inBounds(data, point) {
  return point && point.x >= 0 && point.y >= 0 && point.x < data.width && point.y < data.height;
}

export function validateMap(filePath, data) {
  const name = relative(filePath);
  requireString(name, data.id, 'id');
  requireString(name, data.name, 'name');
  requireNumber(name, data.width, 'width');
  requireNumber(name, data.height, 'height');
  requireNumber(name, data.tileSize, 'tileSize');
  validateTiles(name, data);
  validateLevelPerception(name, data);

  if (!data.spawns?.player) {
    errors.push(`${name}: missing spawns.player.`);
  }
}

export function validateLevel(filePath, data) {
  const name = relative(filePath);
  requireString(name, data.id, 'id');
  requireString(name, data.name, 'name');
  requireString(name, data.intro, 'intro');
  requireNumber(name, data.width, 'width');
  requireNumber(name, data.height, 'height');
  requireNumber(name, data.tileSize, 'tileSize');
  validateTiles(name, data);
  validateBarkCollection(name, data.combatStartBarks, 'combatStartBarks');

  const player = data.spawns?.player;
  if (!player) {
    errors.push(`${name}: missing spawns.player.`);
  } else if (!inBounds(data, player)) {
    errors.push(`${name}: player start (${player.x}, ${player.y}) is out of bounds.`);
  }

  const enemies = data.spawns?.enemies ?? [];
  const npcs = data.spawns?.npcs ?? [];
  const levelDialogue = new Set();
  if (data.dialogue !== undefined) {
    if (!Array.isArray(data.dialogue)) {
      errors.push(`${name}: dialogue must be an array.`);
    } else {
      for (const id of data.dialogue) {
        requireString(name, id, 'dialogue[]');
        if (typeof id === 'string') {
          levelDialogue.add(id);
          referencedDialogueIds.add(id);
        }
      }
    }
  }
  for (const point of enemies) {
    if (!inBounds(data, point)) {
      errors.push(`${name}: enemy spawn (${point.x}, ${point.y}) is out of bounds.`);
    }
    validateActorSpriteId(name, point.spriteId, 'spawns.enemies[].spriteId');
    validateActorAppearance(name, point.appearance, 'spawns.enemies[].appearance');
    validateOptionalBoolean(name, point.dormantUntilCombat, 'spawns.enemies[].dormantUntilCombat');
    validateDialogueConditions(name, point.conditions, 'spawns.enemies[].conditions');
    if (point.dialogue !== undefined) {
      validateDialogueReference(name, point.dialogue, 'spawns.enemies[].dialogue');
      if (typeof point.dialogue === 'string' && !levelDialogue.has(point.dialogue)) {
        errors.push(`${name}: enemy dialogue "${point.dialogue}" must also be listed in level dialogue.`);
      }
    }
    if (point.dialogueTriggerRadius !== undefined) {
      requireNumber(name, point.dialogueTriggerRadius, 'spawns.enemies[].dialogueTriggerRadius');
    }
    if (point.talkRadius !== undefined) {
      requireNumber(name, point.talkRadius, 'spawns.enemies[].talkRadius');
    }
    validateSpawnPerception(name, data, point, 'spawns.enemies[]');
    validateSpawnPatrol(name, data, point, 'spawns.enemies[]');
    validateLoot(name, point.loot, 'spawns.enemies[].loot');
    validateSpawnWeapons(name, point.weapons, 'spawns.enemies[].weapons');
    validateMapMarker(name, point.mapMarker, 'spawns.enemies[].mapMarker');
  }
  for (const point of npcs) {
    if (!inBounds(data, point)) {
      errors.push(`${name}: npc spawn (${point.x}, ${point.y}) is out of bounds.`);
    }
    const actorId = point.actor ?? point.id;
    requireString(name, actorId, 'spawns.npcs[].actor');
    if (typeof actorId === 'string') referencedActorIds.add(actorId);
    validateActorSpriteId(name, point.spriteId, 'spawns.npcs[].spriteId');
    validateActorAppearance(name, point.appearance, 'spawns.npcs[].appearance');
    validateDialogueConditions(name, point.conditions, 'spawns.npcs[].conditions');
    if (point.dialogue !== undefined) {
      validateDialogueReference(name, point.dialogue, 'spawns.npcs[].dialogue');
      if (typeof point.dialogue === 'string' && !levelDialogue.has(point.dialogue)) {
        errors.push(`${name}: npc dialogue "${point.dialogue}" must also be listed in level dialogue.`);
      }
    }
    if (point.dialogueTriggerRadius !== undefined) {
      requireNumber(name, point.dialogueTriggerRadius, 'spawns.npcs[].dialogueTriggerRadius');
    }
    if (point.talkRadius !== undefined) {
      requireNumber(name, point.talkRadius, 'spawns.npcs[].talkRadius');
    }
    validateSpawnPatrol(name, data, point, 'spawns.npcs[]');
    validateMapMarker(name, point.mapMarker, 'spawns.npcs[].mapMarker');
  }

  const objects = Array.isArray(data.objects) ? data.objects : [];
  validateObjectIds(name, objects);
  for (const [objectIndex, object] of objects.entries()) {
    if (object.x !== undefined || object.y !== undefined) {
      if (!inBounds(data, object)) {
        errors.push(`${name}: object ${object.kind ?? 'unknown'} at (${object.x}, ${object.y}) is out of bounds.`);
      }
    }
    if (typeof object.kind === 'string' && !getSprite(object.kind)) {
      errors.push(`${name}: object kind "${object.kind}" at (${object.x}, ${object.y}) is not registered in the sprite catalog.`);
    }
    if (object.orient !== undefined && !PROP_ORIENTS.has(object.orient)) {
      errors.push(`${name}: object ${object.kind ?? 'unknown'} orient "${object.orient}" must be one of ${[...PROP_ORIENTS].join(', ')}.`);
    }
    validateWallMountedObject(name, data, object);
    validateStringList(name, object.hiddenWhenFlags, 'objects[].hiddenWhenFlags');
    validateStringList(name, object.visibleWhenFlags, 'objects[].visibleWhenFlags');
    validateStringList(name, object.disabledWhenFlags, 'objects[].disabledWhenFlags');
    validateStringList(name, object.closedWhenFlags, 'objects[].closedWhenFlags');
    validateDialogueReference(name, object.interact?.dialogue, 'objects[].interact.dialogue');
    validateDialogueReference(name, object.interact?.lockedDialogue, 'objects[].interact.lockedDialogue');
    validateInteractionLogVariants(name, object.interact?.logVariants, `objects[${objectIndex}].interact.logVariants`);
    validateLoot(name, object.interact?.loot);
    validateLock(name, object.interact?.lock, 'objects[].interact.lock');
    validateSearch(name, object.interact?.search, 'objects[].interact.search');
    validateDoorObject(name, object);
    validateMapMarker(name, object.mapMarker, 'objects[].mapMarker');
    validateCoverValue(name, object.cover, `object ${object.kind ?? 'unknown'} cover`);
    validateClickAreas(name, data, object, `objects[${objectIndex}]`);
    if (object.interactionMarker !== undefined) {
      validateGridPoint(name, object.interactionMarker, `objects[${objectIndex}].interactionMarker`);
      if (!inBounds(data, object.interactionMarker)) {
        errors.push(`${name}: objects[${objectIndex}].interactionMarker must stay inside the level bounds.`);
      }
    }
  }
  validateLevelTransitions(name, data, objects);
  validateCombatTriggers(name, data, levelDialogue);
  validateHiddenRegions(name, data, objects);
  validatePatrolReachability(name, data, [
    ...enemies.map((spawn) => ({ spawn, label: `enemy "${spawn.id}"` })),
    ...npcs.map((spawn) => ({ spawn, label: `npc "${spawn.actor ?? spawn.id}"` }))
  ], objects);
  validateTableaux(name, data, npcs, objects);
  validateSoundscape(name, data);
  if (data.groundItems !== undefined) {
    if (!Array.isArray(data.groundItems)) {
      errors.push(`${name}: groundItems must be an array.`);
    } else {
      const grid = new Grid(data);
      for (const item of data.groundItems) {
        if (!inBounds(data, item)) {
          errors.push(`${name}: ground item ${item?.item ?? 'unknown'} at (${item?.x}, ${item?.y}) is out of bounds.`);
        } else if (!grid.isWalkable(item.x, item.y)) {
          errors.push(`${name}: ground item ${item.item ?? 'unknown'} at (${item.x}, ${item.y}) must be on a walkable tile.`);
        }
        requireString(name, item?.item, 'groundItems[].item');
        if (typeof item?.item === 'string') referencedItemIds.add(item.item);
        if (item?.count !== undefined) {
          requireNumber(name, item.count, 'groundItems[].count');
          if (typeof item.count === 'number' && item.count <= 0) {
            errors.push(`${name}: groundItems[].count must be greater than zero.`);
          }
        }
        if (item?.pickupPolicy !== undefined && !GROUND_ITEM_PICKUP_POLICIES.has(item.pickupPolicy)) {
          errors.push(`${name}: groundItems[].pickupPolicy must be one of ${[...GROUND_ITEM_PICKUP_POLICIES].join(', ')}.`);
        }
      }
    }
  }

  // Every non-walkable legend block must be a renderable kind in the catalog.
  for (const [tileChar, def] of Object.entries(data.legend ?? {})) {
    if (def && def.walkable === false && !getSprite(def.kind)) {
      errors.push(`${name}: legend "${tileChar}" kind "${def.kind}" is not a renderable block in the sprite catalog.`);
    }
    if (def?.floor !== undefined) {
      if (typeof def.floor !== 'string' || def.floor.trim() === '') {
        errors.push(`${name}: legend "${tileChar}" floor must be a non-empty string.`);
      } else if (!FLOOR_STYLE_ID_SET.has(def.floor)) {
        errors.push(`${name}: legend "${tileChar}" floor "${def.floor}" must be one of ${[...FLOOR_STYLE_ID_SET].join(', ')}.`);
      }
    }
    validateCoverValue(name, def?.cover, `legend "${tileChar}" cover`);
  }

  validateTalkableNpcReachability(name, data, npcs, objects);
}

function validateSpawnWeapons(name, weapons, fieldName) {
  if (weapons === undefined) return;
  if (!Array.isArray(weapons) || weapons.length === 0) {
    errors.push(`${name}: ${fieldName} must be a non-empty array when provided.`);
    return;
  }
  for (const [index, entry] of weapons.entries()) {
    requireString(name, entry?.item, `${fieldName}[${index}].item`);
    if (typeof entry?.item === 'string') referencedItemIds.add(entry.item);
    for (const key of ['loaded', 'reserve']) {
      if (entry?.[key] === undefined) continue;
      requireNumber(name, entry[key], `${fieldName}[${index}].${key}`);
      if (typeof entry[key] === 'number' && (!Number.isInteger(entry[key]) || entry[key] < 0)) {
        errors.push(`${name}: ${fieldName}[${index}].${key} must be a zero or greater integer.`);
      }
    }
  }
}

function validateCoverValue(name, value, fieldName) {
  if (value === undefined) return;
  if (typeof value !== 'string' || !COVER_VALUES.has(value)) {
    errors.push(`${name}: ${fieldName} must be one of ${[...COVER_VALUES].join(', ')}.`);
  }
}

function validateLevelTransitions(name, data, objects) {
  if (data.levelTransitions === undefined) return;
  if (!Array.isArray(data.levelTransitions)) {
    errors.push(`${name}: levelTransitions must be an array.`);
    return;
  }

  const grid = new Grid(data);
  for (const object of objects) {
    if (object.blocking && inBounds(data, object)) grid.addBlocked(object.x, object.y);
  }
  const ids = new Set();
  for (const [index, transition] of data.levelTransitions.entries()) {
    const fieldName = `levelTransitions[${index}]`;
    if (!transition || typeof transition !== 'object' || Array.isArray(transition)) {
      errors.push(`${name}: ${fieldName} must be an object.`);
      continue;
    }
    requireString(name, transition.id, `${fieldName}.id`);
    if (typeof transition.id === 'string') {
      if (ids.has(transition.id)) errors.push(`${name}: ${fieldName}.id "${transition.id}" is duplicated.`);
      ids.add(transition.id);
    }
    validateGridPoint(name, transition, fieldName);
    validateDialogueConditions(name, transition.conditions, `${fieldName}.conditions`);
    if (inBounds(data, transition) && !grid.isWalkable(transition.x, transition.y)) {
      errors.push(`${name}: ${fieldName} (${transition.x}, ${transition.y}) must be on a walkable tile.`);
    }
    validateClickAreas(name, data, transition, fieldName);

    const loadLevel = transition.loadLevel;
    if (!loadLevel || typeof loadLevel !== 'object' || Array.isArray(loadLevel)) {
      errors.push(`${name}: ${fieldName}.loadLevel must be an object.`);
      continue;
    }
    requireString(name, loadLevel.path, `${fieldName}.loadLevel.path`);
    validateGridPoint(name, loadLevel.player, `${fieldName}.loadLevel.player`);
    if (loadLevel.player?.facing !== undefined) {
      requireString(name, loadLevel.player.facing, `${fieldName}.loadLevel.player.facing`);
      if (typeof loadLevel.player.facing === 'string' && !PERCEPTION_FACING_IDS.has(loadLevel.player.facing)) {
        errors.push(`${name}: ${fieldName}.loadLevel.player.facing must be one of ${[...PERCEPTION_FACING_IDS].join(', ')}.`);
      }
    }
  }
}

function validateClickAreas(name, data, source, fieldName) {
  if (source.clickAreas === undefined) return;
  if (!Array.isArray(source.clickAreas)) {
    errors.push(`${name}: ${fieldName}.clickAreas must be an array.`);
    return;
  }
  for (const [index, area] of source.clickAreas.entries()) {
    const areaName = `${fieldName}.clickAreas[${index}]`;
    if (!area || typeof area !== 'object' || Array.isArray(area)) {
      errors.push(`${name}: ${areaName} must be an object.`);
      continue;
    }
    for (const key of ['x0', 'y0', 'x1', 'y1']) {
      requireNumber(name, area[key], `${areaName}.${key}`);
      if (typeof area[key] === 'number' && !Number.isInteger(area[key])) {
        errors.push(`${name}: ${areaName}.${key} must be an integer.`);
      }
    }
    if (!['x0', 'y0', 'x1', 'y1'].every((key) => typeof area[key] === 'number')) continue;
    const left = Math.min(area.x0, area.x1);
    const right = Math.max(area.x0, area.x1);
    const top = Math.min(area.y0, area.y1);
    const bottom = Math.max(area.y0, area.y1);
    if (left < 0 || top < 0 || right >= data.width || bottom >= data.height) {
      errors.push(`${name}: ${areaName} must stay inside the level bounds.`);
    }
  }
}

function validateCombatTriggers(name, data, levelDialogue) {
  if (data.combatTrigger !== undefined) {
    validateMapMarker(name, data.combatTrigger?.mapMarker, 'combatTrigger.mapMarker');
  }
  if (data.combatTriggers === undefined) return;
  if (!Array.isArray(data.combatTriggers)) {
    errors.push(`${name}: combatTriggers must be an array.`);
    return;
  }
  data.combatTriggers.forEach((trigger, index) => {
    const fieldName = `combatTriggers[${index}]`;
    if (!trigger || typeof trigger !== 'object' || Array.isArray(trigger)) {
      errors.push(`${name}: ${fieldName} must be an object.`);
      return;
    }
    requireString(name, trigger.id, `${fieldName}.id`);
    requireString(name, trigger.encounter, `${fieldName}.encounter`);
    validateGridPoint(name, trigger, fieldName);
    if (!inBounds(data, trigger)) {
      errors.push(`${name}: ${fieldName} (${trigger.x}, ${trigger.y}) must stay inside the level bounds.`);
    }
    if (trigger.radius !== undefined) requireNumber(name, trigger.radius, `${fieldName}.radius`);
    validateOptionalBoolean(name, trigger.forceCombat, `${fieldName}.forceCombat`);
    validateBarkCollection(name, trigger.intro, `${fieldName}.intro`);
    validateMapMarker(name, trigger.mapMarker, `${fieldName}.mapMarker`);
    if (trigger.dialogue !== undefined) {
      validateDialogueReference(name, trigger.dialogue, `${fieldName}.dialogue`);
      if (typeof trigger.dialogue === 'string' && !levelDialogue.has(trigger.dialogue)) {
        errors.push(`${name}: combat trigger dialogue "${trigger.dialogue}" must also be listed in level dialogue.`);
      }
    }
  });
}

function validateMapMarker(name, marker, fieldName) {
  if (marker === undefined || marker === false) return;
  if (!marker || typeof marker !== 'object' || Array.isArray(marker)) {
    errors.push(`${name}: ${fieldName} must be false or an object.`);
    return;
  }
  if (marker.label !== undefined) requireString(name, marker.label, `${fieldName}.label`);
  if (marker.kind !== undefined) {
    requireString(name, marker.kind, `${fieldName}.kind`);
    if (typeof marker.kind === 'string' && !MAP_MARKER_KINDS.has(marker.kind)) {
      errors.push(`${name}: ${fieldName}.kind must be one of ${[...MAP_MARKER_KINDS].join(', ')}.`);
    }
  }
  if (marker.reveal !== undefined) {
    requireString(name, marker.reveal, `${fieldName}.reveal`);
    if (typeof marker.reveal === 'string' && !MAP_MARKER_REVEALS.has(marker.reveal)) {
      errors.push(`${name}: ${fieldName}.reveal must be one of ${[...MAP_MARKER_REVEALS].join(', ')}.`);
    }
  }
  validateDialogueConditions(name, marker.conditions, `${fieldName}.conditions`);
}

function validateObjectIds(name, objects) {
  const seen = new Set();
  for (const [index, object] of objects.entries()) {
    if (object.id === undefined) {
      if (isStatefulInteractable(object)) {
        errors.push(`${name}: stateful object ${object.kind ?? 'unknown'} at (${object.x}, ${object.y}) must define a stable id.`);
      }
      continue;
    }
    requireString(name, object.id, `objects[${index}].id`);
    if (typeof object.id !== 'string') continue;
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(object.id)) {
      errors.push(`${name}: objects[${index}].id "${object.id}" must be kebab-case.`);
    }
    if (seen.has(object.id)) {
      errors.push(`${name}: object id "${object.id}" is duplicated.`);
    }
    seen.add(object.id);
  }
}

function validateTalkableNpcReachability(name, data, npcs, objects) {
  const player = data.spawns?.player;
  if (!player || !inBounds(data, player)) return;
  if (!Array.isArray(data.tiles) || !data.legend) return;

  const talkableNpcs = npcs.filter((npc) => typeof npc.dialogue === 'string' && inBounds(data, npc));
  if (talkableNpcs.length === 0) return;

  const grid = new Grid(data);
  for (const object of objects) {
    if (object.blocking && inBounds(data, object)) {
      grid.addBlocked(object.x, object.y);
    }
  }

  for (const target of talkableNpcs) {
    const actorId = target.actor ?? target.id ?? 'unknown';
    if (!grid.isWalkable(target.x, target.y)) {
      errors.push(`${name}: talkable npc "${actorId}" at (${target.x}, ${target.y}) must stand on a walkable cell.`);
      continue;
    }

    const occupied = new Set();
    for (const blocker of npcs) {
      if (!inBounds(data, blocker)) continue;
      if (!conditionsCanCoexist(target.conditions, blocker.conditions)) continue;
      occupied.add(cellKey(blocker.x, blocker.y));
    }

    const path = findPathToAdjacent(grid, player, target, occupied);
    if (path === null) {
      errors.push(`${name}: talkable npc "${actorId}" at (${target.x}, ${target.y}) has no reachable adjacent talk tile from player start.`);
    }
  }
}

function validateLevelPerception(name, data) {
  if (data.enemyVisionRadius !== undefined) {
    requireNumber(name, data.enemyVisionRadius, 'enemyVisionRadius');
    if (typeof data.enemyVisionRadius === 'number' && data.enemyVisionRadius <= 0) {
      errors.push(`${name}: enemyVisionRadius must be greater than zero.`);
    }
  }
  if (data.enemyVisionCone !== undefined) {
    requireNumber(name, data.enemyVisionCone, 'enemyVisionCone');
    validateDegrees(name, data.enemyVisionCone, 'enemyVisionCone');
  }
  validateHearingRadius(name, data.enemyHearingRadius, 'enemyHearingRadius');
}

function validateSpawnPerception(name, data, spawn, fieldName) {
  if (spawn.facing !== undefined) {
    requireString(name, spawn.facing, `${fieldName}.facing`);
    if (typeof spawn.facing === 'string' && !PERCEPTION_FACING_IDS.has(spawn.facing)) {
      errors.push(`${name}: ${fieldName}.facing must be one of ${[...PERCEPTION_FACING_IDS].join(', ')}.`);
    }
  }
  if (spawn.perception === undefined) return;
  const perception = spawn.perception;
  if (!perception || typeof perception !== 'object' || Array.isArray(perception)) {
    errors.push(`${name}: ${fieldName}.perception must be an object.`);
    return;
  }
  if (perception.visionRadius !== undefined) {
    requireNumber(name, perception.visionRadius, `${fieldName}.perception.visionRadius`);
    if (typeof perception.visionRadius === 'number' && perception.visionRadius <= 0) {
      errors.push(`${name}: ${fieldName}.perception.visionRadius must be greater than zero.`);
    }
  }
  if (perception.coneDegrees !== undefined) {
    requireNumber(name, perception.coneDegrees, `${fieldName}.perception.coneDegrees`);
    validateDegrees(name, perception.coneDegrees, `${fieldName}.perception.coneDegrees`);
  }
  if (perception.dcBonus !== undefined) {
    requireNumber(name, perception.dcBonus, `${fieldName}.perception.dcBonus`);
  }
  if (perception.ratingBonus !== undefined) {
    requireNumber(name, perception.ratingBonus, `${fieldName}.perception.ratingBonus`);
  }
  validateHearingRadius(name, perception.hearingRadius, `${fieldName}.perception.hearingRadius`);
}

function validateSpawnPatrol(name, data, spawn, fieldName) {
  if (spawn.patrol === undefined) return;
  const patrol = Array.isArray(spawn.patrol) ? { path: spawn.patrol } : spawn.patrol;
  if (!patrol || typeof patrol !== 'object' || Array.isArray(patrol)) {
    errors.push(`${name}: ${fieldName}.patrol must be an object or path array.`);
    return;
  }
  if (patrol.mode !== undefined) {
    requireString(name, patrol.mode, `${fieldName}.patrol.mode`);
    if (typeof patrol.mode === 'string' && !PATROL_MODE_IDS.has(patrol.mode)) {
      errors.push(`${name}: ${fieldName}.patrol.mode must be one of ${[...PATROL_MODE_IDS].join(', ')}.`);
    }
  }
  if (patrol.delay !== undefined) {
    validatePatrolDelay(name, patrol.delay, `${fieldName}.patrol.delay`);
  }
  if (patrol.startDelay !== undefined) {
    requireNumber(name, patrol.startDelay, `${fieldName}.patrol.startDelay`);
    if (typeof patrol.startDelay === 'number' && patrol.startDelay < 0) {
      errors.push(`${name}: ${fieldName}.patrol.startDelay must be zero or greater.`);
    }
  }
  if (patrol.timer !== undefined) {
    requireNumber(name, patrol.timer, `${fieldName}.patrol.timer`);
    if (typeof patrol.timer === 'number' && patrol.timer < 0) {
      errors.push(`${name}: ${fieldName}.patrol.timer must be zero or greater.`);
    }
  }
  validateOptionalBoolean(name, patrol.removeOnComplete, `${fieldName}.patrol.removeOnComplete`);
  validateOptionalBoolean(name, patrol.remove, `${fieldName}.patrol.remove`);
  validateOptionalBoolean(name, patrol.hideOnComplete, `${fieldName}.patrol.hideOnComplete`);
  validateDialogueEffects(name, patrol.onComplete ?? patrol.complete ?? patrol.arrival, `${fieldName}.patrol.onComplete`);
  if (!Array.isArray(patrol.path) || patrol.path.length < 2) {
    errors.push(`${name}: ${fieldName}.patrol.path must contain at least two points.`);
    return;
  }
  for (const [index, point] of patrol.path.entries()) {
    if (!inBounds(data, point)) {
      errors.push(`${name}: ${fieldName}.patrol.path[${index}] (${point?.x}, ${point?.y}) is out of bounds.`);
    }
    validatePatrolActivity(name, point?.activity, `${fieldName}.patrol.path[${index}].activity`);
  }
}

function validatePatrolActivity(name, activity, fieldName) {
  if (activity === undefined) return;
  if (!activity || typeof activity !== 'object' || Array.isArray(activity)) {
    errors.push(`${name}: ${fieldName} must be an object.`);
    return;
  }
  requireString(name, activity.target, `${fieldName}.target`);
  requireNumber(name, activity.duration, `${fieldName}.duration`);
  if (typeof activity.duration === 'number' &&
    (activity.duration < PATROL_ACTIVITY_MIN_DURATION || activity.duration > PATROL_ACTIVITY_MAX_DURATION)) {
    errors.push(
      `${name}: ${fieldName}.duration must be between ${PATROL_ACTIVITY_MIN_DURATION} and ${PATROL_ACTIVITY_MAX_DURATION} seconds.`
    );
  }
  if (activity.motion !== undefined) {
    requireString(name, activity.motion, `${fieldName}.motion`);
    if (typeof activity.motion === 'string' && !NPC_ACTIVITY_MOTION_SET.has(activity.motion)) {
      errors.push(`${name}: ${fieldName}.motion must be one of ${NPC_ACTIVITY_MOTIONS.join(', ')}.`);
    }
  }
  if (activity.response !== undefined) {
    requireString(name, activity.response, `${fieldName}.response`);
    if (typeof activity.response === 'string' && !NPC_ACTIVITY_RESPONSE_SET.has(activity.response)) {
      errors.push(`${name}: ${fieldName}.response must be one of ${NPC_ACTIVITY_RESPONSES.join(', ')}.`);
    }
  }
  if (activity.sound !== undefined) {
    requireString(name, activity.sound, `${fieldName}.sound`);
    if (typeof activity.sound === 'string' && !NPC_ACTIVITY_SOUND_SET.has(activity.sound)) {
      errors.push(`${name}: ${fieldName}.sound must be one of ${NPC_ACTIVITY_SOUNDS.join(', ')}.`);
    }
  }
}

function validateInteractionLogVariants(name, variants, fieldName) {
  if (variants === undefined) return;
  if (!Array.isArray(variants) || variants.length === 0) {
    errors.push(`${name}: ${fieldName} must be a non-empty array.`);
    return;
  }
  for (const [index, variant] of variants.entries()) {
    const variantName = `${fieldName}[${index}]`;
    if (!variant || typeof variant !== 'object' || Array.isArray(variant)) {
      errors.push(`${name}: ${variantName} must be an object.`);
      continue;
    }
    validateDialogueConditions(name, variant.conditions, `${variantName}.conditions`);
    if (variant.conditions === undefined) {
      errors.push(`${name}: ${variantName}.conditions is required.`);
    }
    validateStringList(name, variant.log, `${variantName}.log`);
    if (variant.log === undefined) {
      errors.push(`${name}: ${variantName}.log is required.`);
    }
  }
}

function validateTableaux(name, data, npcs, objects) {
  if (data.tableaux === undefined) return;
  if (!Array.isArray(data.tableaux)) {
    errors.push(`${name}: tableaux must be an array.`);
    return;
  }

  const ids = new Set();
  const actorIds = new Set(npcs.map((npc) => npc.actor ?? npc.id).filter((id) => typeof id === 'string'));
  const objectsById = new Map(objects.filter((object) => typeof object.id === 'string').map((object) => [object.id, object]));
  const grid = new Grid(data);
  for (const object of objects) {
    if (object.blocking && inBounds(data, object)) grid.addBlocked(object.x, object.y);
  }

  for (const [tableauIndex, tableau] of data.tableaux.entries()) {
    const tableauName = `tableaux[${tableauIndex}]`;
    if (!tableau || typeof tableau !== 'object' || Array.isArray(tableau)) {
      errors.push(`${name}: ${tableauName} must be an object.`);
      continue;
    }
    requireString(name, tableau.id, `${tableauName}.id`);
    if (typeof tableau.id === 'string') {
      if (ids.has(tableau.id)) errors.push(`${name}: ${tableauName}.id "${tableau.id}" is duplicated.`);
      ids.add(tableau.id);
    }
    validateGridPoint(name, tableau.center, `${tableauName}.center`);
    if (!inBounds(data, tableau.center)) {
      errors.push(`${name}: ${tableauName}.center must stay inside the level bounds.`);
    }
    requireNumber(name, tableau.activationRadius, `${tableauName}.activationRadius`);
    if (typeof tableau.activationRadius === 'number' && tableau.activationRadius <= 0) {
      errors.push(`${name}: ${tableauName}.activationRadius must be greater than zero.`);
    }
    if (tableau.startDelay !== undefined) {
      requireNumber(name, tableau.startDelay, `${tableauName}.startDelay`);
      if (typeof tableau.startDelay === 'number' && tableau.startDelay < 0) {
        errors.push(`${name}: ${tableauName}.startDelay must be zero or greater.`);
      }
    }
    validatePatrolDelay(name, tableau.cooldown, `${tableauName}.cooldown`);

    if (!Array.isArray(tableau.participants) || tableau.participants.length < 2) {
      errors.push(`${name}: ${tableauName}.participants must contain at least two actors.`);
      continue;
    }
    const participants = new Set();
    const reservedSlots = new Set();
    for (const [participantIndex, participant] of tableau.participants.entries()) {
      const participantName = `${tableauName}.participants[${participantIndex}]`;
      if (!participant || typeof participant !== 'object' || Array.isArray(participant)) {
        errors.push(`${name}: ${participantName} must be an object.`);
        continue;
      }
      requireString(name, participant.actor, `${participantName}.actor`);
      if (typeof participant.actor === 'string') {
        if (!actorIds.has(participant.actor)) {
          errors.push(`${name}: ${participantName}.actor "${participant.actor}" is not an NPC spawn.`);
        }
        if (participants.has(participant.actor)) {
          errors.push(`${name}: ${participantName}.actor "${participant.actor}" is duplicated in the tableau.`);
        }
        participants.add(participant.actor);
      }
      validateGridPoint(name, participant.slot, `${participantName}.slot`);
      if (!inBounds(data, participant.slot)) {
        errors.push(`${name}: ${participantName}.slot must stay inside the level bounds.`);
      } else if (!grid.isWalkable(participant.slot.x, participant.slot.y)) {
        errors.push(`${name}: ${participantName}.slot (${participant.slot.x}, ${participant.slot.y}) must be clear and walkable.`);
      } else {
        const key = cellKey(participant.slot.x, participant.slot.y);
        if (reservedSlots.has(key)) errors.push(`${name}: ${participantName}.slot (${key}) is duplicated in the tableau.`);
        reservedSlots.add(key);
      }
      if (participant.delay !== undefined) {
        requireNumber(name, participant.delay, `${participantName}.delay`);
        if (typeof participant.delay === 'number' && participant.delay < 0) {
          errors.push(`${name}: ${participantName}.delay must be zero or greater.`);
        }
      }
      validatePatrolActivity(name, participant.activity, `${participantName}.activity`);
      const targetId = participant.activity?.target;
      const target = typeof targetId === 'string' ? objectsById.get(targetId) : null;
      if (typeof targetId === 'string' && !target) {
        errors.push(`${name}: ${participantName}.activity target "${targetId}" does not exist.`);
      } else if (target && inBounds(data, participant.slot)) {
        const distance = Math.max(
          Math.abs(participant.slot.x - target.x),
          Math.abs(participant.slot.y - target.y)
        );
        if (distance !== 1) {
          errors.push(`${name}: ${participantName}.slot must be adjacent to activity target "${targetId}".`);
        }
      }
    }

    if (tableau.barks !== undefined && !Array.isArray(tableau.barks)) {
      errors.push(`${name}: ${tableauName}.barks must be an array.`);
    } else {
      for (const [barkIndex, bark] of (tableau.barks ?? []).entries()) {
        const barkName = `${tableauName}.barks[${barkIndex}]`;
        if (!bark || typeof bark !== 'object' || Array.isArray(bark)) {
          errors.push(`${name}: ${barkName} must be an object.`);
          continue;
        }
        requireNumber(name, bark.at, `${barkName}.at`);
        if (typeof bark.at === 'number' && bark.at < 0) errors.push(`${name}: ${barkName}.at must be zero or greater.`);
        requireString(name, bark.actor, `${barkName}.actor`);
        if (typeof bark.actor === 'string' && !participants.has(bark.actor)) {
          errors.push(`${name}: ${barkName}.actor "${bark.actor}" is not a participant.`);
        }
        requireString(name, bark.text, `${barkName}.text`);
      }
    }
  }
}

function validateSoundscape(name, data) {
  const soundscape = data.soundscape;
  if (soundscape === undefined) return;
  if (!soundscape || typeof soundscape !== 'object' || Array.isArray(soundscape)) {
    errors.push(`${name}: soundscape must be an object.`);
    return;
  }
  requireNumber(name, soundscape.maxDistance, 'soundscape.maxDistance');
  if (typeof soundscape.maxDistance === 'number' && soundscape.maxDistance <= 0) {
    errors.push(`${name}: soundscape.maxDistance must be greater than zero.`);
  }
  requireNumber(name, soundscape.maxOneShots, 'soundscape.maxOneShots');
  if (typeof soundscape.maxOneShots === 'number' &&
    (!Number.isInteger(soundscape.maxOneShots) || soundscape.maxOneShots < 1 || soundscape.maxOneShots > 8)) {
    errors.push(`${name}: soundscape.maxOneShots must be an integer from 1 to 8.`);
  }

  if (!Array.isArray(soundscape.activityCues)) {
    errors.push(`${name}: soundscape.activityCues must be an array.`);
  } else {
    const cues = new Set();
    for (const [index, cue] of soundscape.activityCues.entries()) {
      requireString(name, cue, `soundscape.activityCues[${index}]`);
      if (typeof cue !== 'string') continue;
      if (!NPC_ACTIVITY_SOUND_SET.has(cue)) {
        errors.push(`${name}: soundscape.activityCues[${index}] "${cue}" is not a known activity sound.`);
      }
      if (cues.has(cue)) errors.push(`${name}: soundscape.activityCues[${index}] "${cue}" is duplicated.`);
      cues.add(cue);
    }
  }

  if (!Array.isArray(soundscape.ambientBeds) || soundscape.ambientBeds.length === 0) {
    errors.push(`${name}: soundscape.ambientBeds must be a non-empty array.`);
    return;
  }
  const bedIds = new Set();
  for (const [index, bed] of soundscape.ambientBeds.entries()) {
    const bedName = `soundscape.ambientBeds[${index}]`;
    if (!bed || typeof bed !== 'object' || Array.isArray(bed)) {
      errors.push(`${name}: ${bedName} must be an object.`);
      continue;
    }
    requireString(name, bed.id, `${bedName}.id`);
    if (typeof bed.id === 'string') {
      if (bedIds.has(bed.id)) errors.push(`${name}: ${bedName}.id "${bed.id}" is duplicated.`);
      bedIds.add(bed.id);
    }
    requireString(name, bed.profile, `${bedName}.profile`);
    if (typeof bed.profile === 'string' && !AMBIENT_BED_PROFILES.has(bed.profile)) {
      errors.push(`${name}: ${bedName}.profile must be one of ${[...AMBIENT_BED_PROFILES].join(', ')}.`);
    }
    if (!bed.bounds || typeof bed.bounds !== 'object' || Array.isArray(bed.bounds)) {
      errors.push(`${name}: ${bedName}.bounds must be an object.`);
    } else {
      for (const key of ['x0', 'y0', 'x1', 'y1']) {
        requireNumber(name, bed.bounds[key], `${bedName}.bounds.${key}`);
      }
      if (['x0', 'y0', 'x1', 'y1'].every((key) => Number.isFinite(bed.bounds[key]))) {
        if (bed.bounds.x0 < 0 || bed.bounds.y0 < 0 || bed.bounds.x1 >= data.width || bed.bounds.y1 >= data.height ||
          bed.bounds.x0 > bed.bounds.x1 || bed.bounds.y0 > bed.bounds.y1) {
          errors.push(`${name}: ${bedName}.bounds must be ordered and stay inside the level.`);
        }
      }
    }
    requireNumber(name, bed.gain, `${bedName}.gain`);
    if (typeof bed.gain === 'number' && (bed.gain < 0 || bed.gain > 1)) {
      errors.push(`${name}: ${bedName}.gain must be from 0 to 1.`);
    }
  }
}

function validatePatrolDelay(name, delay, fieldName) {
  if (typeof delay === 'number') {
    if (delay <= 0) errors.push(`${name}: ${fieldName} must be greater than zero.`);
    return;
  }
  if (Array.isArray(delay)) {
    if (delay.length < 2) {
      errors.push(`${name}: ${fieldName} range must contain min and max.`);
      return;
    }
    for (const [index, value] of delay.entries()) {
      requireNumber(name, value, `${fieldName}[${index}]`);
      if (typeof value === 'number' && value <= 0) {
        errors.push(`${name}: ${fieldName}[${index}] must be greater than zero.`);
      }
    }
    return;
  }
  if (delay && typeof delay === 'object') {
    const min = delay.min ?? delay.low;
    const max = delay.max ?? delay.high;
    requireNumber(name, min, `${fieldName}.min`);
    requireNumber(name, max, `${fieldName}.max`);
    if (typeof min === 'number' && min <= 0) errors.push(`${name}: ${fieldName}.min must be greater than zero.`);
    if (typeof max === 'number' && max <= 0) errors.push(`${name}: ${fieldName}.max must be greater than zero.`);
    return;
  }
  errors.push(`${name}: ${fieldName} must be a number, range array, or range object.`);
}

function validatePatrolReachability(name, data, actors, objects) {
  const patrollers = actors.filter((entry) => entry.spawn.patrol !== undefined);
  if (patrollers.length === 0) return;
  const grid = new Grid(data);
  for (const object of objects) {
    if (object.blocking && inBounds(data, object)) grid.addBlocked(object.x, object.y);
  }
  const objectsById = new Map(objects.filter((object) => typeof object.id === 'string').map((object) => [object.id, object]));
  for (const { spawn, label } of patrollers) {
    const patrol = Array.isArray(spawn.patrol) ? { path: spawn.patrol } : spawn.patrol;
    for (const [index, point] of (patrol?.path ?? []).entries()) {
      if (!inBounds(data, point)) continue;
      if (!grid.isWalkable(point.x, point.y)) {
        errors.push(`${name}: ${label} patrol.path[${index}] (${point.x}, ${point.y}) must be walkable.`);
      }
      const targetId = point.activity?.target;
      if (typeof targetId !== 'string') continue;
      const target = objectsById.get(targetId);
      if (!target) {
        errors.push(`${name}: ${label} patrol.path[${index}] activity target "${targetId}" does not exist.`);
        continue;
      }
      const distance = Math.max(Math.abs(point.x - target.x), Math.abs(point.y - target.y));
      if (distance !== 1) {
        errors.push(`${name}: ${label} patrol.path[${index}] must be adjacent to activity target "${targetId}".`);
      }
    }
  }
}

function validateHearingRadius(name, value, fieldName) {
  if (value === undefined) return;
  if (typeof value === 'number') {
    if (!Number.isFinite(value) || value <= 0) errors.push(`${name}: ${fieldName} must be greater than zero.`);
    return;
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    errors.push(`${name}: ${fieldName} must be a number or severity object.`);
    return;
  }
  for (const [severity, radius] of Object.entries(value)) {
    if (!SUSPICION_SEVERITY_IDS.has(severity)) {
      errors.push(`${name}: ${fieldName}.${severity} must be one of ${[...SUSPICION_SEVERITY_IDS].join(', ')}.`);
      continue;
    }
    requireNumber(name, radius, `${fieldName}.${severity}`);
    if (typeof radius === 'number' && radius <= 0) {
      errors.push(`${name}: ${fieldName}.${severity} must be greater than zero.`);
    }
  }
}

function validateDegrees(name, value, fieldName) {
  if (typeof value === 'number' && (value <= 0 || value > 360)) {
    errors.push(`${name}: ${fieldName} must be greater than zero and no more than 360.`);
  }
}

function conditionsCanCoexist(a, b) {
  const aRequired = conditionRequiredFlags(a);
  const bRequired = conditionRequiredFlags(b);
  const aAbsent = conditionAbsentFlags(a);
  const bAbsent = conditionAbsentFlags(b);

  for (const flag of aRequired) {
    if (bAbsent.has(flag)) return false;
  }
  for (const flag of bRequired) {
    if (aAbsent.has(flag)) return false;
  }

  const aQuestStages = a?.questStages ?? {};
  const bQuestStages = b?.questStages ?? {};
  for (const [questId, stage] of Object.entries(aQuestStages)) {
    if (Object.hasOwn(bQuestStages, questId) && bQuestStages[questId] !== stage) return false;
  }
  return true;
}

function conditionRequiredFlags(conditions) {
  return new Set(flagValues(conditions?.flag).concat(flagValues(conditions?.flags)));
}

function conditionAbsentFlags(conditions) {
  return new Set(flagValues(conditions?.notFlag).concat(flagValues(conditions?.flagsAbsent)));
}

function flagValues(value) {
  return [].concat(value ?? []).filter((flag) => typeof flag === 'string');
}

function cellKey(x, y) {
  return `${x},${y}`;
}


function validateLock(name, lock, fieldName) {
  if (lock === undefined) return;
  if (!lock || typeof lock !== 'object' || Array.isArray(lock)) {
    errors.push(`${name}: ${fieldName} must be an object.`);
    return;
  }

  if (lock.id !== undefined) requireString(name, lock.id, `${fieldName}.id`);
  if (lock.title !== undefined) requireString(name, lock.title, `${fieldName}.title`);
  validateStringList(name, lock.lines, `${fieldName}.lines`);
  validateStringList(name, lock.lockedLines, `${fieldName}.lockedLines`);

  if (!Array.isArray(lock.methods) || lock.methods.length === 0 || lock.methods.length > 4) {
    errors.push(`${name}: ${fieldName}.methods must contain 1 to 4 methods.`);
    return;
  }

  const methodIds = new Set();
  for (const [index, method] of lock.methods.entries()) {
    const methodName = `${fieldName}.methods[${index}]`;
    if (!method || typeof method !== 'object' || Array.isArray(method)) {
      errors.push(`${name}: ${methodName} must be an object.`);
      continue;
    }

    requireString(name, method.id, `${methodName}.id`);
    if (typeof method.id === 'string') {
      if (methodIds.has(method.id)) errors.push(`${name}: ${methodName}.id "${method.id}" is duplicated.`);
      methodIds.add(method.id);
    }
    requireString(name, method.label, `${methodName}.label`);
    validateDialogueConditions(name, method.conditions, `${methodName}.conditions`);

    if (method.requiresItem !== undefined) {
      requireString(name, method.requiresItem, `${methodName}.requiresItem`);
      if (typeof method.requiresItem === 'string') referencedItemIds.add(method.requiresItem);
    }
    validateOptionalBoolean(name, method.requiresSecurityTool, `${methodName}.requiresSecurityTool`);
    if (method.requiresSecurityTool !== undefined && method.field !== 'security') {
      errors.push(`${name}: ${methodName}.requiresSecurityTool is only valid for Security methods.`);
    }

    const hasField = method.field !== undefined;
    const hasPrimary = method.primary !== undefined;
    if (hasField && hasPrimary) {
      errors.push(`${name}: ${methodName} must use either field or primary, not both.`);
    }
    if (hasField) {
      requireString(name, method.field, `${methodName}.field`);
      if (typeof method.field === 'string' && !FIELD_RATING_IDS.has(method.field)) {
        errors.push(`${name}: ${methodName}.field has unknown field rating "${method.field}".`);
      }
      validateLockDc(name, method.dc, `${methodName}.dc`, 0, 100);
    } else if (hasPrimary) {
      requireString(name, method.primary, `${methodName}.primary`);
      if (typeof method.primary === 'string' && !PRIMARY_ATTRIBUTE_IDS.has(method.primary)) {
        errors.push(`${name}: ${methodName}.primary has unknown primary "${method.primary}".`);
      }
      validateLockDc(name, method.dc, `${methodName}.dc`, 0, 10);
    } else if (method.dc !== undefined) {
      errors.push(`${name}: ${methodName}.dc requires field or primary.`);
    }

    validateStringList(name, method.successLog, `${methodName}.successLog`);
    validateStringList(name, method.failLog, `${methodName}.failLog`);
    validateStringList(name, method.unavailableLog, `${methodName}.unavailableLog`);
    validateOptionalBoolean(name, method.unlocks, `${methodName}.unlocks`);
    validateOptionalBoolean(name, method.openOnSuccess, `${methodName}.openOnSuccess`);
    validateDialogueEffects(name, method.success, `${methodName}.success`);
    validateDialogueEffects(name, method.failure, `${methodName}.failure`);
  }
}

function validateSearch(name, search, fieldName) {
  if (search === undefined) return;
  if (!search || typeof search !== 'object' || Array.isArray(search)) {
    errors.push(`${name}: ${fieldName} must be an object.`);
    return;
  }

  if (search.id !== undefined) requireString(name, search.id, `${fieldName}.id`);
  if (search.title !== undefined) requireString(name, search.title, `${fieldName}.title`);
  if (search.useLabel !== undefined) requireString(name, search.useLabel, `${fieldName}.useLabel`);
  if (search.leaveLabel !== undefined) requireString(name, search.leaveLabel, `${fieldName}.leaveLabel`);
  validateStringList(name, search.lines, `${fieldName}.lines`);

  if (!Array.isArray(search.methods) || search.methods.length === 0 || search.methods.length > 3) {
    errors.push(`${name}: ${fieldName}.methods must contain 1 to 3 methods.`);
    return;
  }

  const methodIds = new Set();
  for (const [index, method] of search.methods.entries()) {
    const methodName = `${fieldName}.methods[${index}]`;
    if (!method || typeof method !== 'object' || Array.isArray(method)) {
      errors.push(`${name}: ${methodName} must be an object.`);
      continue;
    }

    requireString(name, method.id, `${methodName}.id`);
    if (typeof method.id === 'string') {
      if (methodIds.has(method.id)) errors.push(`${name}: ${methodName}.id "${method.id}" is duplicated.`);
      methodIds.add(method.id);
    }
    requireString(name, method.label, `${methodName}.label`);
    validateDialogueConditions(name, method.conditions, `${methodName}.conditions`);

    if (method.requiresItem !== undefined) {
      requireString(name, method.requiresItem, `${methodName}.requiresItem`);
      if (typeof method.requiresItem === 'string') referencedItemIds.add(method.requiresItem);
    }

    const hasField = method.field !== undefined;
    const hasPrimary = method.primary !== undefined;
    if (hasField && hasPrimary) {
      errors.push(`${name}: ${methodName} must use either field or primary, not both.`);
    }
    if (hasField) {
      requireString(name, method.field, `${methodName}.field`);
      if (typeof method.field === 'string' && !FIELD_RATING_IDS.has(method.field)) {
        errors.push(`${name}: ${methodName}.field has unknown field rating "${method.field}".`);
      }
      validateLockDc(name, method.dc, `${methodName}.dc`, 0, 100);
    } else if (hasPrimary) {
      requireString(name, method.primary, `${methodName}.primary`);
      if (typeof method.primary === 'string' && !PRIMARY_ATTRIBUTE_IDS.has(method.primary)) {
        errors.push(`${name}: ${methodName}.primary has unknown primary "${method.primary}".`);
      }
      validateLockDc(name, method.dc, `${methodName}.dc`, 0, 10);
    } else {
      validateLockDc(name, method.dc, `${methodName}.dc`, 0, 100);
    }

    validateStringList(name, method.successLog, `${methodName}.successLog`);
    validateStringList(name, method.failLog, `${methodName}.failLog`);
    validateStringList(name, method.unavailableLog, `${methodName}.unavailableLog`);
    validateOptionalBoolean(name, method.repeat, `${methodName}.repeat`);
    validateDialogueEffects(name, method.success, `${methodName}.success`);
    validateDialogueEffects(name, method.failure, `${methodName}.failure`);
  }
}

function validateDoorObject(name, object) {
  if (object?.interact?.type !== 'door') return;
  if (object.blocking !== true) {
    errors.push(`${name}: door object "${object.id ?? object.name ?? object.kind}" must be blocking while shut.`);
  }
  if (object.doorGroup !== undefined) requireString(name, object.doorGroup, 'objects[].doorGroup');
  if (object.interact.doorGroup !== undefined) requireString(name, object.interact.doorGroup, 'objects[].interact.doorGroup');
  if (object.passableWhenOpen !== undefined) validateOptionalBoolean(name, object.passableWhenOpen, 'objects[].passableWhenOpen');
  if (object.doorLeaf !== undefined && !DOOR_LEAVES.has(object.doorLeaf)) {
    errors.push(`${name}: objects[].doorLeaf must be one of ${[...DOOR_LEAVES].join(', ')}.`);
  }
  if (object.kind === 'chapel-double-door' && !object.doorLeaf) {
    errors.push(`${name}: chapel-double-door objects must define doorLeaf.`);
  }
}

function validateWallMountedObject(name, data, object) {
  if (object.wallPlane !== undefined && !WALL_PLANES.has(object.wallPlane)) {
    errors.push(`${name}: objects[].wallPlane must be one of ${[...WALL_PLANES].join(', ')}.`);
  }
  if (object.wallSide !== undefined && !WALL_SIDES.has(object.wallSide)) {
    errors.push(`${name}: objects[].wallSide must be one of ${[...WALL_SIDES].join(', ')}.`);
  }
  if (object.kind !== 'farm-door') return;
  if (object.wallPlane === undefined) {
    errors.push(`${name}: farm-door "${object.id ?? 'unnamed'}" must define wallPlane.`);
  }
  const tileChar = data.tiles?.[object.y]?.[object.x];
  const tileDef = data.legend?.[tileChar];
  if (!tileDef || tileDef.walkable !== false) {
    errors.push(`${name}: farm-door "${object.id ?? 'unnamed'}" must be placed on a non-walkable wall cell.`);
  }
}

function validateHiddenRegions(name, data, objects) {
  if (data.hiddenRegions === undefined) return;
  if (!Array.isArray(data.hiddenRegions)) {
    errors.push(`${name}: hiddenRegions must be an array.`);
    return;
  }

  const doorGroups = new Set(
    objects
      .map((object) => object.doorGroup ?? object.interact?.doorGroup)
      .filter((group) => typeof group === 'string' && group.trim() !== '')
  );
  const regionIds = new Set();

  for (const [index, region] of data.hiddenRegions.entries()) {
    const fieldName = `hiddenRegions[${index}]`;
    if (!region || typeof region !== 'object' || Array.isArray(region)) {
      errors.push(`${name}: ${fieldName} must be an object.`);
      continue;
    }

    requireString(name, region.id, `${fieldName}.id`);
    if (typeof region.id === 'string') {
      if (regionIds.has(region.id)) errors.push(`${name}: ${fieldName}.id "${region.id}" is duplicated.`);
      regionIds.add(region.id);
    }
    requireString(name, region.doorGroup, `${fieldName}.doorGroup`);
    if (typeof region.doorGroup === 'string' && !doorGroups.has(region.doorGroup)) {
      errors.push(`${name}: ${fieldName}.doorGroup "${region.doorGroup}" does not match any door object.`);
    }

    validateHiddenRegionInteger(name, region.x, `${fieldName}.x`);
    validateHiddenRegionInteger(name, region.y, `${fieldName}.y`);
    validateHiddenRegionInteger(name, region.width, `${fieldName}.width`, { positive: true });
    validateHiddenRegionInteger(name, region.height, `${fieldName}.height`, { positive: true });

    if (
      Number.isInteger(region.x) &&
      Number.isInteger(region.y) &&
      Number.isInteger(region.width) &&
      Number.isInteger(region.height) &&
      (region.x < 0 ||
        region.y < 0 ||
        region.width <= 0 ||
        region.height <= 0 ||
        region.x + region.width > data.width ||
        region.y + region.height > data.height)
    ) {
      errors.push(`${name}: ${fieldName} rectangle must stay inside the level bounds.`);
    }
  }
}

function validateHiddenRegionInteger(name, value, fieldName, { positive = false } = {}) {
  requireNumber(name, value, fieldName);
  if (typeof value !== 'number' || !Number.isInteger(value)) {
    errors.push(`${name}: ${fieldName} must be an integer.`);
    return;
  }
  if (positive && value <= 0) errors.push(`${name}: ${fieldName} must be greater than zero.`);
}

function validateLockDc(name, value, fieldName, min, max) {
  requireNumber(name, value, fieldName);
  if (typeof value === 'number' && (!Number.isInteger(value) || value < min || value > max)) {
    errors.push(`${name}: ${fieldName} must be an integer from ${min} to ${max}.`);
  }
}
