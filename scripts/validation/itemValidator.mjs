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

const ATTACK_MODES = new Set(['melee', 'ranged']);
const WEAPON_CATALOG_GROUPS = new Set(['ballistic-long-gun', 'ballistic-pistol', 'accelerator', 'melee']);
const EXPECTED_WEAPON_COUNTS = Object.freeze({
  'ballistic-long-gun': 20,
  'ballistic-pistol': 20,
  accelerator: 20,
  melee: 40
});
const weaponCatalogCounts = new Map();
const weaponMagazineFamilies = new Map();
const ammunitionFamilies = new Map();

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
  if (data.type === 'ammo') validateAmmunition(name, data);
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
  if (!data.equipment || !['weapon', 'sidearm', 'melee'].includes(data.equipment.slot)) {
    errors.push(`${name}: weapon equipment.slot must be weapon.`);
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
  if (weapon.roles !== undefined) validateStringArray(name, weapon.roles, 'weapon.roles');
  if (weapon.handedness !== undefined && !['one', 'two'].includes(weapon.handedness)) {
    errors.push(`${name}: weapon.handedness must be one or two.`);
  }
  const attacks = Array.isArray(weapon.attacks)
    ? weapon.attacks
    : weapon.attack && typeof weapon.attack === 'object' && !Array.isArray(weapon.attack)
      ? [weapon.attack]
      : [];
  if (attacks.length === 0) {
    errors.push(`${name}: weapon.attacks must contain at least one attack.`);
    return;
  }
  const attackIds = new Set();
  for (const [index, attack] of attacks.entries()) {
    const field = `weapon.attacks[${index}]`;
    if (!attack || typeof attack !== 'object' || Array.isArray(attack)) {
      errors.push(`${name}: ${field} must be an object.`);
      continue;
    }
    requireString(name, attack.id, `${field}.id`);
    requireString(name, attack.name, `${field}.name`);
    requireNumber(name, attack.apCost, `${field}.apCost`);
    requireNumber(name, attack.damage, `${field}.damage`);
    requireNumber(name, attack.range, `${field}.range`);
    if (typeof attack.id === 'string') {
      if (attackIds.has(attack.id)) errors.push(`${name}: ${field}.id must be unique within the weapon.`);
      attackIds.add(attack.id);
    }
    if (attack.mode !== undefined) {
      requireString(name, attack.mode, `${field}.mode`);
      if (typeof attack.mode === 'string' && !ATTACK_MODES.has(attack.mode)) {
        errors.push(`${name}: ${field}.mode must be one of ${[...ATTACK_MODES].join(', ')}.`);
      }
    }
    for (const numberField of ['apCost', 'damage', 'range', 'ammoCost', 'conditionWear']) {
      const value = attack[numberField];
      if (value !== undefined && (typeof value !== 'number' || !Number.isInteger(value) || value < 0)) {
        errors.push(`${name}: ${field}.${numberField} must be a zero or greater integer.`);
      }
    }
    if (attack.accuracyBonus !== undefined && (typeof attack.accuracyBonus !== 'number' || !Number.isInteger(attack.accuracyBonus))) {
      errors.push(`${name}: ${field}.accuracyBonus must be an integer.`);
    }
    if (attack.requiresStationary !== undefined && typeof attack.requiresStationary !== 'boolean') {
      errors.push(`${name}: ${field}.requiresStationary must be a boolean.`);
    }
  }

  if (weapon.magazine !== undefined) validateMagazine(name, data, weapon.magazine);
  if (data.catalogGroup !== undefined) {
    requireString(name, data.catalogGroup, 'catalogGroup');
    if (!WEAPON_CATALOG_GROUPS.has(data.catalogGroup)) {
      errors.push(`${name}: catalogGroup must be one of ${[...WEAPON_CATALOG_GROUPS].join(', ')}.`);
    } else {
      weaponCatalogCounts.set(data.catalogGroup, (weaponCatalogCounts.get(data.catalogGroup) ?? 0) + 1);
      if (data.catalogGroup === 'melee' && weapon.magazine) errors.push(`${name}: melee catalog weapons cannot define a magazine.`);
      if (data.catalogGroup !== 'melee' && !weapon.magazine) errors.push(`${name}: ranged catalog weapons must define a magazine.`);
    }
    requireString(name, data.subtype, 'subtype');
    validateProvenance(name, data.provenance);
  }
}

function validateMagazine(name, data, magazine) {
  if (!magazine || typeof magazine !== 'object' || Array.isArray(magazine)) {
    errors.push(`${name}: weapon.magazine must be an object.`);
    return;
  }
  requireString(name, magazine.ammoFamily, 'weapon.magazine.ammoFamily');
  for (const field of ['capacity', 'defaultLoaded', 'reloadAp']) {
    requireNumber(name, magazine[field], `weapon.magazine.${field}`);
    if (typeof magazine[field] === 'number' && (!Number.isInteger(magazine[field]) || magazine[field] < 0)) {
      errors.push(`${name}: weapon.magazine.${field} must be a zero or greater integer.`);
    }
  }
  if (typeof magazine.capacity === 'number' && magazine.capacity <= 0) {
    errors.push(`${name}: weapon.magazine.capacity must be greater than zero.`);
  }
  if (typeof magazine.reloadAp === 'number' && magazine.reloadAp <= 0) {
    errors.push(`${name}: weapon.magazine.reloadAp must be greater than zero.`);
  }
  if (typeof magazine.defaultLoaded === 'number' && typeof magazine.capacity === 'number' && magazine.defaultLoaded > magazine.capacity) {
    errors.push(`${name}: weapon.magazine.defaultLoaded cannot exceed capacity.`);
  }
  if (typeof magazine.ammoFamily === 'string') weaponMagazineFamilies.set(magazine.ammoFamily, data.id);
}

function validateAmmunition(name, data) {
  if (!data.ammo || typeof data.ammo !== 'object' || Array.isArray(data.ammo)) {
    errors.push(`${name}: ammo items must define ammo.family.`);
    return;
  }
  requireString(name, data.ammo.family, 'ammo.family');
  if (typeof data.ammo.family === 'string') {
    const previous = ammunitionFamilies.get(data.ammo.family);
    if (previous) errors.push(`${name}: ammo.family duplicates item "${previous}".`);
    ammunitionFamilies.set(data.ammo.family, data.id);
  }
}

function validateProvenance(name, provenance) {
  if (!provenance || typeof provenance !== 'object' || Array.isArray(provenance)) {
    errors.push(`${name}: catalog weapons must define provenance.`);
    return;
  }
  requireString(name, provenance.era, 'provenance.era');
  requireString(name, provenance.origin, 'provenance.origin');
  validateStringArray(name, provenance.factions, 'provenance.factions');
}

function validateStringArray(name, values, field) {
  if (!Array.isArray(values) || values.length === 0 || values.some((value) => typeof value !== 'string' || !value.trim())) {
    errors.push(`${name}: ${field} must be a non-empty string array.`);
  }
}

export function validateWeaponCatalog() {
  for (const [group, expected] of Object.entries(EXPECTED_WEAPON_COUNTS)) {
    const actual = weaponCatalogCounts.get(group) ?? 0;
    if (actual !== expected) errors.push(`data/items: weapon catalog group "${group}" must contain ${expected} items, found ${actual}.`);
  }
  const total = [...weaponCatalogCounts.values()].reduce((sum, count) => sum + count, 0);
  if (total !== 100) errors.push(`data/items: weapon catalog must contain exactly 100 weapons, found ${total}.`);
  if (ammunitionFamilies.size !== 9) errors.push(`data/items: weapon catalog must define exactly 9 ammunition families, found ${ammunitionFamilies.size}.`);
  for (const [family, weaponId] of weaponMagazineFamilies) {
    if (!ammunitionFamilies.has(family)) errors.push(`data/items: weapon "${weaponId}" uses missing ammunition family "${family}".`);
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
