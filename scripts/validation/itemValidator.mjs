import {
  BUILD_PROFILE_IDS,
  ITEM_EQUIPMENT_SLOTS,
  ITEM_GROUND_MODELS,
  ITEM_RARITY_IDS,
  errors,
  referencedItemIds,
  relative,
  requireNumber,
  requireString,
  seenItemIds
} from './validationContext.mjs';

export function validateItem(filePath, data) {
  const name = relative(filePath);
  requireString(name, data.id, 'id');
  requireString(name, data.name, 'name');
  requireString(name, data.type, 'type');
  requireString(name, data.rarity, 'rarity');
  requireNumber(name, data.weight, 'weight');
  requireString(name, data.groundModel, 'groundModel');
  if (typeof data.rarity === 'string' && !ITEM_RARITY_IDS.has(data.rarity)) {
    errors.push(`${name}: rarity must be one of ${[...ITEM_RARITY_IDS].join(', ')}.`);
  }
  if (data.build !== undefined) {
    requireString(name, data.build, 'build');
    if (typeof data.build === 'string' && !BUILD_PROFILE_IDS.has(data.build)) {
      errors.push(`${name}: build must be one of ${[...BUILD_PROFILE_IDS].join(', ')}.`);
    }
  }
  if (typeof data.groundModel === 'string' && !ITEM_GROUND_MODELS.has(data.groundModel)) {
    errors.push(`${name}: groundModel must be one of ${[...ITEM_GROUND_MODELS].join(', ')}.`);
  }
  if (typeof data.weight === 'number' && data.weight < 0) {
    errors.push(`${name}: weight must be zero or greater.`);
  }
  if (data.equipment !== undefined) {
    if (!data.equipment || typeof data.equipment !== 'object') {
      errors.push(`${name}: equipment must be an object.`);
    } else if (!ITEM_EQUIPMENT_SLOTS.has(data.equipment.slot)) {
      errors.push(`${name}: equipment.slot must be one of ${[...ITEM_EQUIPMENT_SLOTS].join(', ')}.`);
    }
  }
  if (typeof data.id === 'string') seenItemIds.add(data.id);
}
export function validateLoot(name, loot, fieldName = 'loot') {
  if (loot === undefined) return;
  if (!Array.isArray(loot)) {
    errors.push(`${name}: ${fieldName} must be an array.`);
    return;
  }
  for (const entry of loot) {
    requireString(name, entry?.item, `${fieldName}[].item`);
    if (typeof entry?.item === 'string') referencedItemIds.add(entry.item);
    if (entry?.count !== undefined) {
      requireNumber(name, entry.count, `${fieldName}[].count`);
      if (typeof entry.count === 'number' && entry.count <= 0) {
        errors.push(`${name}: ${fieldName}[].count must be greater than zero.`);
      }
    }
  }
}
