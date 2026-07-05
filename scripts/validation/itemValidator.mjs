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
  if (data.condition !== undefined) validateCondition(name, data.condition);
  if (data.type === 'weapon') validateWeapon(name, data);
  if (typeof data.id === 'string') seenItemIds.add(data.id);
}

function validateCondition(name, condition) {
  if (!condition || typeof condition !== 'object' || Array.isArray(condition)) {
    errors.push(`${name}: condition must be an object.`);
    return;
  }
  requireNumber(name, condition.max, 'condition.max');
  requireNumber(name, condition.default, 'condition.default');
  if (typeof condition.max === 'number' && (!Number.isInteger(condition.max) || condition.max <= 0)) {
    errors.push(`${name}: condition.max must be a positive integer.`);
  }
  if (typeof condition.default === 'number' && (!Number.isInteger(condition.default) || condition.default < 0)) {
    errors.push(`${name}: condition.default must be a zero or greater integer.`);
  }
  if (
    typeof condition.max === 'number' &&
    typeof condition.default === 'number' &&
    condition.default > condition.max
  ) {
    errors.push(`${name}: condition.default must be less than or equal to condition.max.`);
  }
}

function validateWeapon(name, data) {
  if (!data.equipment || !['sidearm', 'melee'].includes(data.equipment.slot)) {
    errors.push(`${name}: weapon equipment.slot must be sidearm or melee.`);
  }
  if (!data.condition) {
    errors.push(`${name}: weapon items must define condition.`);
  }
  const weapon = data.weapon;
  if (!weapon || typeof weapon !== 'object' || Array.isArray(weapon)) {
    errors.push(`${name}: weapon must be an object.`);
    return;
  }
  requireString(name, weapon.weaponClass, 'weapon.weaponClass');
  if (!weapon.attack || typeof weapon.attack !== 'object' || Array.isArray(weapon.attack)) {
    errors.push(`${name}: weapon.attack must be an object.`);
    return;
  }
  requireString(name, weapon.attack.id, 'weapon.attack.id');
  requireString(name, weapon.attack.name, 'weapon.attack.name');
  requireNumber(name, weapon.attack.apCost, 'weapon.attack.apCost');
  requireNumber(name, weapon.attack.damage, 'weapon.attack.damage');
  requireNumber(name, weapon.attack.range, 'weapon.attack.range');
  for (const field of ['apCost', 'damage', 'range']) {
    const value = weapon.attack[field];
    if (typeof value === 'number' && (!Number.isInteger(value) || value < 0)) {
      errors.push(`${name}: weapon.attack.${field} must be a zero or greater integer.`);
    }
  }
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
