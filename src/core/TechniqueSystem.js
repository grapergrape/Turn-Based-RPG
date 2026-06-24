import {
  FIELD_RATINGS,
  PRIMARY_ATTRIBUTES,
  calculateFieldRating,
  normalizeProgression
} from './Progression.js';

export const TECHNIQUE_TYPES = Object.freeze(['active', 'passive']);

export function techniqueList(definitions = {}) {
  return Object.values(definitions)
    .filter((definition) => definition && typeof definition.id === 'string')
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function techniqueById(definitions = {}, techniqueId) {
  return definitions?.[techniqueId] ?? null;
}

export function isTechniqueKnown(progression = {}, techniqueId) {
  return normalizeProgression(progression).techniques.includes(techniqueId);
}

export function buildTechniqueSheet(progression = {}, definitions = {}, context = {}) {
  const sheet = normalizeProgression(progression);
  return techniqueList(definitions).map((definition) => {
    const state = techniqueLearnState(sheet, definition, context);
    return {
      ...definition,
      ...state,
      requirementText: techniqueRequirementText(definition)
    };
  });
}

export function techniqueLearnState(progression = {}, definition = {}, context = {}) {
  const sheet = normalizeProgression(progression);
  const known = sheet.techniques.includes(definition.id);
  const requirementState = evaluateTechniqueRequirements(sheet, definition.requirements, context);
  const pointKey = definition.type === 'active' ? 'activeTechniquePoints' : 'passiveTechniquePoints';
  const pointLabel = definition.type === 'active' ? 'active technique point' : 'passive technique point';
  const affordable = (sheet[pointKey] ?? 0) > 0;
  let disabledReason = '';
  if (known) disabledReason = 'Known';
  else if (!requirementState.met) disabledReason = requirementState.reasons[0] ?? 'Requirements not met.';
  else if (!affordable) disabledReason = `Need 1 ${pointLabel}.`;

  return {
    known,
    requirementsMet: requirementState.met,
    requirementReasons: requirementState.reasons,
    affordable,
    canLearn: !known && requirementState.met && affordable,
    pointKey,
    disabledReason
  };
}

export function learnTechnique(progression = {}, techniqueId, definitions = {}, context = {}) {
  const definition = techniqueById(definitions, techniqueId);
  const base = progression && typeof progression === 'object' && !Array.isArray(progression)
    ? JSON.parse(JSON.stringify(progression))
    : {};
  if (!definition) return { ok: false, reason: 'Unknown technique.', progression: base };

  const sheet = normalizeProgression(base);
  const state = techniqueLearnState(sheet, definition, context);
  if (!state.canLearn) return { ok: false, reason: state.disabledReason, progression: base };

  const techniques = [...sheet.techniques, definition.id];
  base.techniques = techniques;
  base.activeTechniquePoints = sheet.activeTechniquePoints;
  base.passiveTechniquePoints = sheet.passiveTechniquePoints;
  base[state.pointKey] = Math.max(0, base[state.pointKey] - 1);
  return { ok: true, reason: '', progression: base };
}

export function evaluateTechniqueRequirements(progression = {}, requirements = {}, context = {}) {
  const reasons = [];
  const sheet = normalizeProgression(progression);

  for (const [primaryId, minimum] of Object.entries(requirements?.primaries ?? {})) {
    const value = sheet.primaries[primaryId] ?? 0;
    if (value < minimum) reasons.push(`${primaryLabel(primaryId)} ${minimum}+ required.`);
  }

  for (const [fieldId, minimum] of Object.entries(requirements?.fieldRatings ?? {})) {
    const value = fieldRating(sheet, fieldId);
    if (value < minimum) reasons.push(`${fieldLabel(fieldId)} ${minimum}+ required.`);
  }

  const anyFieldRatings = Object.entries(requirements?.anyFieldRatings ?? {});
  if (anyFieldRatings.length > 0) {
    const met = anyFieldRatings.some(([fieldId, minimum]) => fieldRating(sheet, fieldId) >= minimum);
    if (!met) {
      const labels = anyFieldRatings.map(([fieldId, minimum]) => `${fieldLabel(fieldId)} ${minimum}+`);
      reasons.push(`${labels.join(' or ')} required.`);
    }
  }

  const itemIds = new Set(context.itemIds ?? []);
  for (const itemId of requirements?.items ?? []) {
    if (!itemIds.has(itemId)) reasons.push(`Requires ${itemId}.`);
  }

  const equipment = context.equipment ?? {};
  for (const slot of requirements?.equipmentSlots ?? []) {
    if (!equipment[slot]) reasons.push(`Requires equipped ${slot}.`);
  }

  const scars = new Set(sheet.scars.map((scar) => scar.id));
  const scarTags = new Set(sheet.scars.flatMap((scar) => scar.tags ?? []));
  for (const scarId of requirements?.scars ?? []) {
    if (!scars.has(scarId) && !scarTags.has(scarId)) reasons.push(`Requires ${scarId}.`);
  }

  return { met: reasons.length === 0, reasons };
}

export function techniqueRequirementText(definition = {}) {
  const requirements = definition.requirements ?? {};
  const parts = [];
  for (const [primaryId, minimum] of Object.entries(requirements.primaries ?? {})) {
    parts.push(`${primaryLabel(primaryId)} ${minimum}+`);
  }
  for (const [fieldId, minimum] of Object.entries(requirements.fieldRatings ?? {})) {
    parts.push(`${fieldLabel(fieldId)} ${minimum}+`);
  }
  const anyFieldRatings = Object.entries(requirements.anyFieldRatings ?? {});
  if (anyFieldRatings.length > 0) {
    parts.push(anyFieldRatings.map(([fieldId, minimum]) => `${fieldLabel(fieldId)} ${minimum}+`).join(' or '));
  }
  for (const slot of requirements.equipmentSlots ?? []) parts.push(`Equipped ${slot}`);
  for (const itemId of requirements.items ?? []) parts.push(`Item ${itemId}`);
  for (const scarId of requirements.scars ?? []) parts.push(`Scar ${scarId}`);
  return parts.length > 0 ? parts.join(', ') : 'No requirements';
}

function fieldRating(progression, fieldId) {
  const field = FIELD_RATINGS.find((entry) => entry.id === fieldId);
  return field ? calculateFieldRating(progression, field) : 0;
}

function fieldLabel(fieldId) {
  return FIELD_RATINGS.find((field) => field.id === fieldId)?.label ?? fieldId;
}

function primaryLabel(primaryId) {
  return PRIMARY_ATTRIBUTES.find((primary) => primary.id === primaryId)?.label ?? primaryId;
}
