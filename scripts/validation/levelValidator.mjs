import {

  CELLAR_LEVEL_ID,

  DECAL_KINDS,

  DOOR_LEAVES,

  FIELD_RATING_IDS,

  FLOOR_STYLE_ID_SET,

  GROUND_ITEM_PICKUP_POLICIES,

  MAIN_LEVEL_ID,

  PATROL_MODE_IDS,

  PERCEPTION_FACING_IDS,

  PROP_ORIENTS,

  PRIMARY_ATTRIBUTE_IDS,

  REQUIRED_INTERACTABLE_KINDS,

  REQUIRED_MAIN_ENEMY_IDS,

  REQUIRED_QUEST_IDS,

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

  requireNumber,

  requireString,

  validateOptionalBoolean

} from './validationContext.mjs';

import { validateLoot } from './itemValidator.mjs';

import { validateActorAppearance, validateActorSpriteId } from './renderCatalogValidator.mjs';

import { validateDialogueConditions, validateDialogueEffects, validateDialogueReference } from './dialogueValidator.mjs';

import { validateBarkCollection, validateStringList } from './textRules.mjs';



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
  }

  for (const id of REQUIRED_QUEST_IDS) {
    if (!Array.isArray(data.quests) || !data.quests.includes(id)) {
      errors.push(`${name}: required quest "${id}" is missing from quests.`);
    }
  }
  const objects = Array.isArray(data.objects) ? data.objects : [];
  for (const object of objects) {
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
    validateDialogueReference(name, object.interact?.dialogue, 'objects[].interact.dialogue');
    validateDialogueReference(name, object.interact?.lockedDialogue, 'objects[].interact.lockedDialogue');
    validateLoot(name, object.interact?.loot);
    validateLock(name, object.interact?.lock, 'objects[].interact.lock');
    validateSearch(name, object.interact?.search, 'objects[].interact.search');
    validateDoorObject(name, object);
  }
  validateHiddenRegions(name, data, objects);
  validatePatrolReachability(name, data, [
    ...enemies.map((spawn) => ({ spawn, label: `enemy "${spawn.id}"` })),
    ...npcs.map((spawn) => ({ spawn, label: `npc "${spawn.actor ?? spawn.id}"` }))
  ], objects);
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
  }

  validateTalkableNpcReachability(name, data, npcs, objects);

  if (data.id === MAIN_LEVEL_ID) validateAshChapelMain(name, data, enemies, objects);
  if (data.id === CELLAR_LEVEL_ID) validateAshChapelCellar(name, data, objects);
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
  for (const { spawn, label } of patrollers) {
    const patrol = Array.isArray(spawn.patrol) ? { path: spawn.patrol } : spawn.patrol;
    for (const [index, point] of (patrol?.path ?? []).entries()) {
      if (!inBounds(data, point)) continue;
      if (!grid.isWalkable(point.x, point.y)) {
        errors.push(`${name}: ${label} patrol.path[${index}] (${point.x}, ${point.y}) must be walkable.`);
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

function validateAshChapelMain(name, data, enemies, objects) {
  const enemyIds = enemies.map((spawn) => spawn.id);
  if (enemies.length < 6) {
    errors.push(`${name}: expected at least 6 spread enemies, found ${enemies.length}.`);
  }
  for (const id of REQUIRED_MAIN_ENEMY_IDS) {
    if (!enemyIds.includes(id)) {
      errors.push(`${name}: required enemy "${id}" is missing from spawns.`);
    }
  }

  const encounterIds = new Set(enemies.map((spawn) => spawn.encounter).filter(Boolean));
  if (encounterIds.size < 3) {
    errors.push(`${name}: expected at least 3 enemy encounter groups, found ${encounterIds.size}.`);
  }
  for (const spawn of enemies) {
    if (!spawn.encounter) {
      errors.push(`${name}: enemy "${spawn.id}" must define an encounter id.`);
    }
  }

  if (!Array.isArray(data.combatTriggers) || data.combatTriggers.length < 3) {
    errors.push(`${name}: combatTriggers must define at least 3 spread trigger zones.`);
  } else {
    for (const trigger of data.combatTriggers) {
      if (!trigger.encounter) errors.push(`${name}: combat trigger at (${trigger.x}, ${trigger.y}) must define encounter.`);
      if (!Array.isArray(trigger.intro) || trigger.intro.length === 0) {
        errors.push(`${name}: combat trigger "${trigger.id ?? trigger.encounter}" must define intro lines.`);
      }
      validateBarkCollection(name, trigger.combatStartBarks, `combatTriggers.${trigger.id ?? trigger.encounter ?? 'unknown'}.combatStartBarks`);
    }
  }

  const requiredMainDialogue = [
    'ash-chapel-altar-rite',
    'ash-chapel-barrel-ladder',
    'ash-chapel-cult-ledger'
  ];
  for (const id of requiredMainDialogue) {
    if (!Array.isArray(data.dialogue) || !data.dialogue.includes(id)) {
      errors.push(`${name}: required main dialogue "${id}" is missing from dialogue.`);
    }
  }

  const kinds = objects.map((object) => object.kind);
  for (const kind of REQUIRED_INTERACTABLE_KINDS) {
    if (!kinds.includes(kind)) {
      errors.push(`${name}: required interactable "${kind}" is missing.`);
    }
  }
  for (const object of objects) {
    if (object.kind !== 'rusted-barrel' && REQUIRED_INTERACTABLE_KINDS.includes(object.kind) && !object.interact) {
      errors.push(`${name}: "${object.kind}" must define an interact descriptor.`);
    }
  }

  const pews = kinds.filter((kind) => kind === 'broken-pew').length;
  if (pews < 10) {
    errors.push(`${name}: expected at least 10 broken pews, found ${pews}.`);
  }

  const decals = kinds.filter((kind) => DECAL_KINDS.has(kind)).length;
  if (decals < 12) {
    errors.push(`${name}: expected at least 12 rubble/decal objects, found ${decals}.`);
  }

  const hasCampfire = objects.some((object) => object.kind === 'campfire');
  if (!hasCampfire) {
    errors.push(`${name}: expected a campfire prop for the cultist camp.`);
  }

  const hasAmbient = enemies.some((spawn) => Array.isArray(spawn.ambient) && spawn.ambient.length > 0);
  if (!hasAmbient) {
    errors.push(`${name}: expected at least one enemy spawn with ambient lines.`);
  }

  const hasSecretEntrance = objects.some((object) =>
    object.kind === 'rusted-barrel' && object.interact?.type === 'secret-entrance' && object.interact?.dialogue
  );
  if (!hasSecretEntrance) {
    errors.push(`${name}: expected a rusted-barrel secret entrance with dialogue.`);
  }

  const hasCultLedger = objects.some((object) =>
    object.kind === 'paper-scraps' && object.name === 'Cult Ledger' && object.interact?.dialogue === 'ash-chapel-cult-ledger'
  );
  if (!hasCultLedger) {
    errors.push(`${name}: expected a Cult Ledger paper-scraps object with dialogue.`);
  }

  if (!Array.isArray(data.combatIntro) || data.combatIntro.length === 0) {
    errors.push(`${name}: combatIntro must contain at least one fallback line.`);
  }
  if (!data.onVictory?.questUpdate) {
    errors.push(`${name}: onVictory.questUpdate is required for this slice.`);
  }
  validateDialogueEffects(name, data.onVictory, 'onVictory');
}

function validateAshChapelCellar(name, data, objects) {
  const requiredCellarDialogue = [
    'ash-chapel-cellar-corpse',
    'ash-chapel-cellar-ladder'
  ];
  for (const id of requiredCellarDialogue) {
    if (!Array.isArray(data.dialogue) || !data.dialogue.includes(id)) {
      errors.push(`${name}: required cellar dialogue "${id}" is missing from dialogue.`);
    }
  }

  const hasSecretExit = objects.some((object) =>
    object.kind === 'rusted-barrel' && object.interact?.type === 'secret-exit' && object.interact?.dialogue
  );
  if (!hasSecretExit) {
    errors.push(`${name}: expected a secret-exit ladder with dialogue.`);
  }

  const hasSecretCorpseLoot = objects.some((object) =>
    object.kind === 'corpse' && object.name === 'Dead Road Warden' && Array.isArray(object.interact?.loot)
  );
  if (!hasSecretCorpseLoot) {
    errors.push(`${name}: expected the secret area Dead Road Warden corpse to contain loot.`);
  }

  const lootEntries = objects.flatMap((object) => object.interact?.loot ?? []);
  if (lootEntries.length < 6) {
    errors.push(`${name}: expected richer secret-area loot, found ${lootEntries.length} loot entries.`);
  }
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
  if (object.wallPlane !== undefined && !WALL_PLANES.has(object.wallPlane)) {
    errors.push(`${name}: objects[].wallPlane must be one of ${[...WALL_PLANES].join(', ')}.`);
  }
  if (object.wallSide !== undefined && !WALL_SIDES.has(object.wallSide)) {
    errors.push(`${name}: objects[].wallSide must be one of ${[...WALL_SIDES].join(', ')}.`);
  }
  if (object.kind === 'chapel-double-door' && !object.doorLeaf) {
    errors.push(`${name}: chapel-double-door objects must define doorLeaf.`);
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
