import {

  ACTOR_ANATOMY,

  ACTOR_BODY_FRAMES,

  ACTOR_EQUIPMENT_SLOTS,

  ACTOR_SPRITE_IDS,

  BUILD_PROFILE_IDS,

  ENEMY_COMPLEXITY_IDS,

  FIELD_RATING_IDS,

  HUMAN_ACCENT_ID_SET,

  HUMAN_BODY_ID_SET,

  HUMAN_GEAR_ID_SET,

  HUMAN_OUTFIT_ID_SET,

  LEVEL_CAP,

  PLAYER_BODY_TYPE_ID_SET,

  PLAYER_FACIAL_HAIR_ID_SET,

  PLAYER_GENDER_MODEL_ID_SET,

  PLAYER_HAIR_COLOR_ID_SET,

  PLAYER_HAIR_STYLE_ID_SET,

  PLAYER_SKIN_TONE_ID_SET,

  PRIMARY_ATTRIBUTES,

  PRIMARY_ATTRIBUTE_IDS,

  TRACE_STAGE_VALUES,

  errors,

  referencedItemIds,

  referencedTechniqueIds,

  relative,

  requireNumber,

  requireString,

  seenActorIds,

  validateXpNumber

} from './validationContext.mjs';

import { validateLoot } from './itemValidator.mjs';



export function validateActor(filePath, data) {
  const name = relative(filePath);
  requireString(name, data.id, 'id');
  requireString(name, data.name, 'name');
  requireString(name, data.type, 'type');
  if (typeof data.id === 'string') seenActorIds.add(data.id);
  validateActorSpriteId(name, data.spriteId, 'spriteId');
  validateStats(name, data.stats);
  validateActorAppearance(name, data.appearance);
  validateActorTrade(name, data.trade);
  validateActorInventory(name, data.inventory);
  validateActorProgression(name, data.progression);
}

export function validateEnemy(filePath, data) {
  const name = relative(filePath);
  requireString(name, data.id, 'id');
  requireString(name, data.name, 'name');
  requireString(name, data.type, 'type');
  requireString(name, data.faction, 'faction');
  validateActorSpriteId(name, data.spriteId, 'spriteId');
  validateStats(name, data.stats);
  validateLoot(name, data.loot);
  validateActorAppearance(name, data.appearance);
  validateActorTrade(name, data.trade);
  validateActorProgression(name, data.progression);

  if (data.faction === 'the-host') {
    const tags = Array.isArray(data.tags) ? data.tags : [];
    if (!tags.includes('host') || !tags.includes('vale-imprint')) {
      errors.push(`${name}: Host enemies must include tags "host" and "vale-imprint".`);
    }
  }
}

export function validateActorAppearance(name, appearance, fieldName = 'appearance') {
  if (appearance === undefined) return;
  if (!appearance || typeof appearance !== 'object' || Array.isArray(appearance)) {
    errors.push(`${name}: ${fieldName} must be an object.`);
    return;
  }
  if (appearance.bodyFrame !== undefined) {
    requireString(name, appearance.bodyFrame, `${fieldName}.bodyFrame`);
    if (typeof appearance.bodyFrame === 'string' && !ACTOR_BODY_FRAMES.has(appearance.bodyFrame)) {
      errors.push(`${name}: ${fieldName}.bodyFrame must be one of ${[...ACTOR_BODY_FRAMES].join(', ')}.`);
    }
  }
  if (appearance.anatomy !== undefined) {
    requireString(name, appearance.anatomy, `${fieldName}.anatomy`);
    if (typeof appearance.anatomy === 'string' && !ACTOR_ANATOMY.has(appearance.anatomy)) {
      errors.push(`${name}: ${fieldName}.anatomy must be one of ${[...ACTOR_ANATOMY].join(', ')}.`);
    }
  }
  if (appearance.genderModel !== undefined) {
    requireString(name, appearance.genderModel, `${fieldName}.genderModel`);
    if (typeof appearance.genderModel === 'string' && !PLAYER_GENDER_MODEL_ID_SET.has(appearance.genderModel)) {
      errors.push(`${name}: ${fieldName}.genderModel must be one of ${[...PLAYER_GENDER_MODEL_ID_SET].join(', ')}.`);
    }
  }
  if (appearance.bodyType !== undefined) {
    requireString(name, appearance.bodyType, `${fieldName}.bodyType`);
    if (typeof appearance.bodyType === 'string' && !PLAYER_BODY_TYPE_ID_SET.has(appearance.bodyType)) {
      errors.push(`${name}: ${fieldName}.bodyType must be one of ${[...PLAYER_BODY_TYPE_ID_SET].join(', ')}.`);
    }
  }
  if (appearance.skinTone !== undefined) {
    requireString(name, appearance.skinTone, `${fieldName}.skinTone`);
    if (typeof appearance.skinTone === 'string' && !PLAYER_SKIN_TONE_ID_SET.has(appearance.skinTone)) {
      errors.push(`${name}: ${fieldName}.skinTone must be one of ${[...PLAYER_SKIN_TONE_ID_SET].join(', ')}.`);
    }
  }
  if (appearance.hairColor !== undefined) {
    requireString(name, appearance.hairColor, `${fieldName}.hairColor`);
    if (typeof appearance.hairColor === 'string' && !PLAYER_HAIR_COLOR_ID_SET.has(appearance.hairColor)) {
      errors.push(`${name}: ${fieldName}.hairColor must be one of ${[...PLAYER_HAIR_COLOR_ID_SET].join(', ')}.`);
    }
  }
  if (appearance.hairStyle !== undefined) {
    requireString(name, appearance.hairStyle, `${fieldName}.hairStyle`);
    if (typeof appearance.hairStyle === 'string' && !PLAYER_HAIR_STYLE_ID_SET.has(appearance.hairStyle)) {
      errors.push(`${name}: ${fieldName}.hairStyle must be one of ${[...PLAYER_HAIR_STYLE_ID_SET].join(', ')}.`);
    }
  }
  if (appearance.facialHair !== undefined) {
    requireString(name, appearance.facialHair, `${fieldName}.facialHair`);
    if (typeof appearance.facialHair === 'string' && !PLAYER_FACIAL_HAIR_ID_SET.has(appearance.facialHair)) {
      errors.push(`${name}: ${fieldName}.facialHair must be one of ${[...PLAYER_FACIAL_HAIR_ID_SET].join(', ')}.`);
    }
  }
  if (appearance.body !== undefined) {
    requireString(name, appearance.body, `${fieldName}.body`);
    if (typeof appearance.body === 'string' && !HUMAN_BODY_ID_SET.has(appearance.body)) {
      errors.push(`${name}: ${fieldName}.body must be one of ${[...HUMAN_BODY_ID_SET].join(', ')}.`);
    }
  }
  if (appearance.outfit !== undefined) {
    requireString(name, appearance.outfit, `${fieldName}.outfit`);
    if (typeof appearance.outfit === 'string' && !HUMAN_OUTFIT_ID_SET.has(appearance.outfit)) {
      errors.push(`${name}: ${fieldName}.outfit must be one of ${[...HUMAN_OUTFIT_ID_SET].join(', ')}.`);
    }
  }
  if (appearance.accent !== undefined) {
    requireString(name, appearance.accent, `${fieldName}.accent`);
    if (typeof appearance.accent === 'string' && !HUMAN_ACCENT_ID_SET.has(appearance.accent)) {
      errors.push(`${name}: ${fieldName}.accent must be one of ${[...HUMAN_ACCENT_ID_SET].join(', ')}.`);
    }
  }
  if (appearance.gear !== undefined) {
    if (!Array.isArray(appearance.gear)) {
      errors.push(`${name}: ${fieldName}.gear must be an array.`);
    } else {
      const seenGear = new Set();
      for (const [index, gearId] of appearance.gear.entries()) {
        requireString(name, gearId, `${fieldName}.gear[${index}]`);
        if (typeof gearId !== 'string') continue;
        if (!HUMAN_GEAR_ID_SET.has(gearId)) {
          errors.push(`${name}: ${fieldName}.gear[${index}] must be one of ${[...HUMAN_GEAR_ID_SET].join(', ')}.`);
        } else if (seenGear.has(gearId)) {
          errors.push(`${name}: ${fieldName}.gear contains duplicate "${gearId}".`);
        }
        seenGear.add(gearId);
      }
    }
  }
}

export function validateActorSpriteId(name, spriteId, fieldName) {
  if (spriteId === undefined) return;
  requireString(name, spriteId, fieldName);
  if (typeof spriteId === 'string' && !ACTOR_SPRITE_IDS.has(spriteId)) {
    errors.push(`${name}: ${fieldName} "${spriteId}" is not registered in the sprite atlas.`);
  }
}

function validateActorTrade(name, trade) {
  if (trade === undefined) return;
  if (!trade || typeof trade !== 'object' || Array.isArray(trade)) {
    errors.push(`${name}: trade must be an object.`);
    return;
  }
  if (trade.title !== undefined) requireString(name, trade.title, 'trade.title');
  if (trade.currency !== undefined) {
    requireString(name, trade.currency, 'trade.currency');
    if (typeof trade.currency === 'string') referencedItemIds.add(trade.currency);
  }
  if (!Array.isArray(trade.stock) || trade.stock.length === 0) {
    errors.push(`${name}: trade.stock must be a non-empty array.`);
    return;
  }
  for (const [index, entry] of trade.stock.entries()) {
    requireString(name, entry?.item, `trade.stock[${index}].item`);
    if (typeof entry?.item === 'string') referencedItemIds.add(entry.item);
    requireNumber(name, entry?.price, `trade.stock[${index}].price`);
    if (typeof entry?.price === 'number' && entry.price < 0) {
      errors.push(`${name}: trade.stock[${index}].price must be zero or greater.`);
    }
    if (entry?.count !== undefined) {
      requireNumber(name, entry.count, `trade.stock[${index}].count`);
      if (typeof entry.count === 'number' && entry.count <= 0) {
        errors.push(`${name}: trade.stock[${index}].count must be greater than zero.`);
      }
    }
  }
}

function validateActorInventory(name, inventory) {
  if (inventory === undefined) return;
  if (!inventory || typeof inventory !== 'object') {
    errors.push(`${name}: inventory must be an object.`);
    return;
  }

  if (inventory.maxCarryWeight !== undefined) {
    requireNumber(name, inventory.maxCarryWeight, 'inventory.maxCarryWeight');
    if (typeof inventory.maxCarryWeight === 'number' && inventory.maxCarryWeight < 0) {
      errors.push(`${name}: inventory.maxCarryWeight must be zero or greater.`);
    }
  }

  if (inventory.items !== undefined) {
    if (!Array.isArray(inventory.items)) {
      errors.push(`${name}: inventory.items must be an array.`);
    } else {
      validateLoot(name, inventory.items, 'inventory.items');
    }
  }

  if (inventory.equipment !== undefined) {
    if (!inventory.equipment || typeof inventory.equipment !== 'object' || Array.isArray(inventory.equipment)) {
      errors.push(`${name}: inventory.equipment must be an object.`);
    } else {
      for (const [slot, itemId] of Object.entries(inventory.equipment)) {
        if (!ACTOR_EQUIPMENT_SLOTS.has(slot)) {
          errors.push(`${name}: inventory.equipment slot "${slot}" is not valid.`);
        }
        requireString(name, itemId, `inventory.equipment.${slot}`);
        if (typeof itemId === 'string') referencedItemIds.add(itemId);
      }
    }
  }
}

function validateActorProgression(name, progression) {
  if (progression === undefined) return;
  if (!progression || typeof progression !== 'object' || Array.isArray(progression)) {
    errors.push(`${name}: progression must be an object.`);
    return;
  }

  if (progression.level !== undefined) {
    requireNumber(name, progression.level, 'progression.level');
    const hasCap = Number.isInteger(LEVEL_CAP) && LEVEL_CAP >= 1;
    if (typeof progression.level === 'number' && (!Number.isInteger(progression.level) || progression.level < 1)) {
      errors.push(`${name}: progression.level must be an integer 1 or greater.`);
    } else if (hasCap && typeof progression.level === 'number' && progression.level > LEVEL_CAP) {
      errors.push(`${name}: progression.level must be an integer from 1 to ${LEVEL_CAP}.`);
    }
  }
  if (progression.xp !== undefined) {
    requireNumber(name, progression.xp, 'progression.xp');
    if (typeof progression.xp === 'number' && (!Number.isInteger(progression.xp) || progression.xp < 0)) {
      errors.push(`${name}: progression.xp must be a zero or greater integer.`);
    }
  }
  if (progression.xpReward !== undefined) {
    requireNumber(name, progression.xpReward, 'progression.xpReward');
    if (typeof progression.xpReward === 'number' && (!Number.isInteger(progression.xpReward) || progression.xpReward < 0)) {
      errors.push(`${name}: progression.xpReward must be a zero or greater integer.`);
    }
  }
  if (progression.primaryPoints !== undefined) {
    requireNumber(name, progression.primaryPoints, 'progression.primaryPoints');
    if (typeof progression.primaryPoints === 'number' && (!Number.isInteger(progression.primaryPoints) || progression.primaryPoints < 0)) {
      errors.push(`${name}: progression.primaryPoints must be a zero or greater integer.`);
    }
  }
  if (progression.activeTechniquePoints !== undefined) {
    requireNumber(name, progression.activeTechniquePoints, 'progression.activeTechniquePoints');
    if (typeof progression.activeTechniquePoints === 'number' && (!Number.isInteger(progression.activeTechniquePoints) || progression.activeTechniquePoints < 0)) {
      errors.push(`${name}: progression.activeTechniquePoints must be a zero or greater integer.`);
    }
  }
  if (progression.passiveTechniquePoints !== undefined) {
    requireNumber(name, progression.passiveTechniquePoints, 'progression.passiveTechniquePoints');
    if (typeof progression.passiveTechniquePoints === 'number' && (!Number.isInteger(progression.passiveTechniquePoints) || progression.passiveTechniquePoints < 0)) {
      errors.push(`${name}: progression.passiveTechniquePoints must be a zero or greater integer.`);
    }
  }
  if (progression.techniques !== undefined) {
    if (!Array.isArray(progression.techniques)) {
      errors.push(`${name}: progression.techniques must be an array.`);
    } else {
      const seen = new Set();
      for (const [index, techniqueId] of progression.techniques.entries()) {
        requireString(name, techniqueId, `progression.techniques[${index}]`);
        if (typeof techniqueId !== 'string') continue;
        if (seen.has(techniqueId)) errors.push(`${name}: progression.techniques contains duplicate "${techniqueId}".`);
        seen.add(techniqueId);
        referencedTechniqueIds.add(techniqueId);
      }
    }
  }
  if (progression.build !== undefined) {
    requireString(name, progression.build, 'progression.build');
    if (typeof progression.build === 'string' && !BUILD_PROFILE_IDS.has(progression.build)) {
      errors.push(`${name}: progression.build must match a defined build profile.`);
    }
  }
  if (progression.complexity !== undefined) {
    requireString(name, progression.complexity, 'progression.complexity');
    if (typeof progression.complexity === 'string' && !ENEMY_COMPLEXITY_IDS.has(progression.complexity)) {
      errors.push(`${name}: progression.complexity must match a defined enemy complexity.`);
    }
  }

  if (progression.primaries !== undefined) {
    if (!progression.primaries || typeof progression.primaries !== 'object' || Array.isArray(progression.primaries)) {
      errors.push(`${name}: progression.primaries must be an object.`);
    } else {
      validatePrimaryMap(name, progression.primaries, 'progression.primaries');
    }
  }

  if (progression.basePrimaries !== undefined) {
    if (!progression.basePrimaries || typeof progression.basePrimaries !== 'object' || Array.isArray(progression.basePrimaries)) {
      errors.push(`${name}: progression.basePrimaries must be an object.`);
    } else {
      validatePrimaryMap(name, progression.basePrimaries, 'progression.basePrimaries');
    }
  }

  if (progression.primaryBonuses !== undefined) {
    if (!progression.primaryBonuses || typeof progression.primaryBonuses !== 'object' || Array.isArray(progression.primaryBonuses)) {
      errors.push(`${name}: progression.primaryBonuses must be an object.`);
    } else {
      validatePrimaryMap(name, progression.primaryBonuses, 'progression.primaryBonuses', { allowMissing: true, min: -10, max: 10 });
    }
  }

  if (progression.trace !== undefined) {
    requireNumber(name, progression.trace, 'progression.trace');
    if (typeof progression.trace === 'number' && (!Number.isInteger(progression.trace) || !TRACE_STAGE_VALUES.has(progression.trace))) {
      errors.push(`${name}: progression.trace must match a defined Trace stage.`);
    }
  }
  if (progression.iconRisk !== undefined) requireString(name, progression.iconRisk, 'progression.iconRisk');
  if (progression.scarPoints !== undefined) {
    requireNumber(name, progression.scarPoints, 'progression.scarPoints');
    if (typeof progression.scarPoints === 'number' && (!Number.isInteger(progression.scarPoints) || progression.scarPoints < 0)) {
      errors.push(`${name}: progression.scarPoints must be a zero or greater integer.`);
    }
  }
  validateFieldModifiers(name, progression.fieldModifiers, 'progression.fieldModifiers');

  if (progression.scars !== undefined) {
    if (!Array.isArray(progression.scars)) {
      errors.push(`${name}: progression.scars must be an array.`);
    } else {
      for (const [index, scar] of progression.scars.entries()) {
        const fieldName = `progression.scars[${index}]`;
        if (!scar || typeof scar !== 'object' || Array.isArray(scar)) {
          errors.push(`${name}: ${fieldName} must be an object.`);
          continue;
        }
        requireString(name, scar.id, `${fieldName}.id`);
        requireString(name, scar.name, `${fieldName}.name`);
        requireNumber(name, scar.rank, `${fieldName}.rank`);
        if (typeof scar.rank === 'number' && (!Number.isInteger(scar.rank) || scar.rank < 1 || scar.rank > 5)) {
          errors.push(`${name}: ${fieldName}.rank must be an integer from 1 to 5.`);
        }
        if (scar.branch !== undefined && scar.branch !== null) requireString(name, scar.branch, `${fieldName}.branch`);
        if (scar.summary !== undefined) requireString(name, scar.summary, `${fieldName}.summary`);
        if (scar.cost !== undefined) requireString(name, scar.cost, `${fieldName}.cost`);
        if (scar.tags !== undefined) {
          if (!Array.isArray(scar.tags)) {
            errors.push(`${name}: ${fieldName}.tags must be an array.`);
          } else {
            for (const tag of scar.tags) requireString(name, tag, `${fieldName}.tags[]`);
          }
        }
        validateFieldModifiers(name, scar.modifiers, `${fieldName}.modifiers`);
      }
    }
  }
}

function validatePrimaryMap(name, primaries, fieldName, { allowMissing = false, min = 0, max = 10 } = {}) {
  for (const key of Object.keys(primaries)) {
    if (!PRIMARY_ATTRIBUTE_IDS.has(key)) {
      errors.push(`${name}: ${fieldName} has unknown primary "${key}".`);
    }
  }
  for (const primary of PRIMARY_ATTRIBUTES) {
    if (primaries[primary.id] === undefined && allowMissing) continue;
    requireNumber(name, primaries[primary.id], `${fieldName}.${primary.id}`);
    const value = primaries[primary.id];
    if (typeof value === 'number' && (!Number.isInteger(value) || value < min || value > max)) {
      errors.push(`${name}: ${fieldName}.${primary.id} must be an integer from ${min} to ${max}.`);
    }
  }
}

function validateFieldModifiers(name, modifiers, fieldName) {
  if (modifiers === undefined) return;
  if (!modifiers || typeof modifiers !== 'object' || Array.isArray(modifiers)) {
    errors.push(`${name}: ${fieldName} must be an object.`);
    return;
  }
  for (const [fieldId, value] of Object.entries(modifiers)) {
    if (!FIELD_RATING_IDS.has(fieldId)) {
      errors.push(`${name}: ${fieldName} has unknown field rating "${fieldId}".`);
    }
    requireNumber(name, value, `${fieldName}.${fieldId}`);
  }
}

function validateStats(name, stats) {
  if (!stats || typeof stats !== 'object') {
    errors.push(`${name}: missing stats object.`);
    return;
  }

  requireNumber(name, stats.hp, 'stats.hp');
  requireNumber(name, stats.maxHp, 'stats.maxHp');
}
