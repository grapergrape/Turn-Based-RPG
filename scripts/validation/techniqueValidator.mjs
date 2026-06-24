import {
  ACTOR_EQUIPMENT_SLOTS,
  FIELD_RATING_IDS,
  PRIMARY_ATTRIBUTE_IDS,
  TECHNIQUE_TARGET_IDS,
  TECHNIQUE_TYPE_IDS,
  errors,
  referencedItemIds,
  referencedTechniqueIds,
  relative,
  requireNumber,
  requireString,
  seenTechniqueIds
} from './validationContext.mjs';

const REQUIREMENT_KEYS = new Set([
  'primaries',
  'fieldRatings',
  'anyFieldRatings',
  'items',
  'equipmentSlots',
  'scars'
]);

export function validateTechnique(filePath, data) {
  const name = relative(filePath);
  if (name.endsWith('index.json')) {
    validateTechniqueIndex(name, data);
    return;
  }

  requireString(name, data.id, 'id');
  requireString(name, data.name, 'name');
  requireString(name, data.type, 'type');
  requireString(name, data.summary, 'summary');
  if (typeof data.id === 'string') {
    if (seenTechniqueIds.has(data.id)) errors.push(`${name}: duplicate technique id "${data.id}".`);
    seenTechniqueIds.add(data.id);
  }
  if (typeof data.type === 'string' && !TECHNIQUE_TYPE_IDS.has(data.type)) {
    errors.push(`${name}: type must be one of ${[...TECHNIQUE_TYPE_IDS].join(', ')}.`);
  }
  validateTargets(name, data.targets);
  validateRequirements(name, data.requirements);
}

function validateTechniqueIndex(name, data) {
  if (!Array.isArray(data.ids)) {
    errors.push(`${name}: ids must be an array.`);
    return;
  }
  const seen = new Set();
  for (const [index, id] of data.ids.entries()) {
    requireString(name, id, `ids[${index}]`);
    if (typeof id !== 'string') continue;
    if (seen.has(id)) errors.push(`${name}: ids contains duplicate "${id}".`);
    seen.add(id);
    referencedTechniqueIds.add(id);
  }
}

function validateTargets(name, targets) {
  if (targets === undefined) return;
  if (!Array.isArray(targets)) {
    errors.push(`${name}: targets must be an array.`);
    return;
  }
  for (const [index, target] of targets.entries()) {
    requireString(name, target, `targets[${index}]`);
    if (typeof target === 'string' && !TECHNIQUE_TARGET_IDS.has(target)) {
      errors.push(`${name}: targets[${index}] must be one of ${[...TECHNIQUE_TARGET_IDS].join(', ')}.`);
    }
  }
}

function validateRequirements(name, requirements) {
  if (!requirements || typeof requirements !== 'object' || Array.isArray(requirements)) {
    errors.push(`${name}: requirements must be an object.`);
    return;
  }
  for (const key of Object.keys(requirements)) {
    if (!REQUIREMENT_KEYS.has(key)) errors.push(`${name}: requirements has unknown key "${key}".`);
  }
  validatePrimaryRequirements(name, requirements.primaries, 'requirements.primaries');
  validateFieldRequirements(name, requirements.fieldRatings, 'requirements.fieldRatings');
  validateFieldRequirements(name, requirements.anyFieldRatings, 'requirements.anyFieldRatings');
  validateStringArray(name, requirements.items, 'requirements.items', (itemId) => referencedItemIds.add(itemId));
  validateStringArray(name, requirements.scars, 'requirements.scars');
  validateStringArray(name, requirements.equipmentSlots, 'requirements.equipmentSlots', (slot) => {
    if (!ACTOR_EQUIPMENT_SLOTS.has(slot)) {
      errors.push(`${name}: requirements.equipmentSlots has unknown slot "${slot}".`);
    }
  });
}

function validatePrimaryRequirements(name, requirements, fieldName) {
  if (requirements === undefined) return;
  if (!requirements || typeof requirements !== 'object' || Array.isArray(requirements)) {
    errors.push(`${name}: ${fieldName} must be an object.`);
    return;
  }
  for (const [primaryId, value] of Object.entries(requirements)) {
    if (!PRIMARY_ATTRIBUTE_IDS.has(primaryId)) errors.push(`${name}: ${fieldName} has unknown primary "${primaryId}".`);
    requireNumber(name, value, `${fieldName}.${primaryId}`);
    if (typeof value === 'number' && (!Number.isInteger(value) || value < 1 || value > 10)) {
      errors.push(`${name}: ${fieldName}.${primaryId} must be an integer from 1 to 10.`);
    }
  }
}

function validateFieldRequirements(name, requirements, fieldName) {
  if (requirements === undefined) return;
  if (!requirements || typeof requirements !== 'object' || Array.isArray(requirements)) {
    errors.push(`${name}: ${fieldName} must be an object.`);
    return;
  }
  for (const [fieldId, value] of Object.entries(requirements)) {
    if (!FIELD_RATING_IDS.has(fieldId)) errors.push(`${name}: ${fieldName} has unknown field rating "${fieldId}".`);
    requireNumber(name, value, `${fieldName}.${fieldId}`);
    if (typeof value === 'number' && (!Number.isInteger(value) || value < 1 || value > 100)) {
      errors.push(`${name}: ${fieldName}.${fieldId} must be an integer from 1 to 100.`);
    }
  }
}

function validateStringArray(name, values, fieldName, onValue = null) {
  if (values === undefined) return;
  if (!Array.isArray(values)) {
    errors.push(`${name}: ${fieldName} must be an array.`);
    return;
  }
  const seen = new Set();
  for (const [index, value] of values.entries()) {
    requireString(name, value, `${fieldName}[${index}]`);
    if (typeof value !== 'string') continue;
    if (seen.has(value)) errors.push(`${name}: ${fieldName} contains duplicate "${value}".`);
    seen.add(value);
    if (onValue) onValue(value);
  }
}
