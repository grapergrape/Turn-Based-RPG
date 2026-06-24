import { PRIMARY_ATTRIBUTES, normalizeProgression } from './Progression.js';
import { MARA_DEFAULT_APPEARANCE, normalizePlayerAppearance } from '../render/SpriteAtlas.js';

export const CHARACTER_NAME_MIN = 2;
export const CHARACTER_NAME_MAX = 18;
export const DEFAULT_CHARACTER_NAME = 'Mara Vey';
export const PRIMARY_ASSIGNMENT_BASE = 3;
export const PRIMARY_ASSIGNMENT_CAP = 7;
export const PRIMARY_ASSIGNMENT_POINTS = 14;
export const PRIMARY_ASSIGNMENT_FLAG = 'level-one-primaries-assigned';
export const BODY_FEATURE_MIN = 0;
export const BODY_FEATURE_MAX = 10;

export const CHARACTER_CUSTOMIZATION_FIELDS = Object.freeze([
  { id: 'name', label: 'Name', kind: 'name' },
  {
    id: 'genderModel',
    label: 'Gender Model',
    kind: 'option',
    options: Object.freeze([
      { id: 'female', label: 'Female' },
      { id: 'male', label: 'Male' },
      { id: 'androgynous', label: 'Androgynous' }
    ])
  },
  {
    id: 'skinTone',
    label: 'Skin Color',
    kind: 'option',
    options: Object.freeze([
      { id: 'light', label: 'Light' },
      { id: 'tan', label: 'Tan' },
      { id: 'brown', label: 'Brown' },
      { id: 'dark', label: 'Dark' }
    ])
  },
  {
    id: 'hairColor',
    label: 'Hair Color',
    kind: 'option',
    options: Object.freeze([
      { id: 'black', label: 'Black' },
      { id: 'brown', label: 'Brown' },
      { id: 'blond', label: 'Blond' },
      { id: 'grey', label: 'Grey' }
    ])
  },
  {
    id: 'hairStyle',
    label: 'Hair Style',
    kind: 'option',
    options: Object.freeze([
      { id: 'cropped', label: 'Cropped' },
      { id: 'loose', label: 'Loose' },
      { id: 'shaved', label: 'Shaved' },
      { id: 'hooded', label: 'Hooded' }
    ])
  },
  {
    id: 'facialHair',
    label: 'Facial Hair',
    kind: 'option',
    options: Object.freeze([
      { id: 'none', label: 'None' },
      { id: 'stubble', label: 'Stubble' },
      { id: 'beard', label: 'Beard' }
    ])
  },
  {
    id: 'bodyType',
    label: 'Body Type',
    kind: 'option',
    options: Object.freeze([
      { id: 'skinny', label: 'Skinny' },
      { id: 'medium', label: 'Medium' },
      { id: 'fat', label: 'Fat' },
      { id: 'buff', label: 'Buff' }
    ])
  },
  {
    id: 'breastSize',
    label: 'Breast Size',
    kind: 'range',
    min: BODY_FEATURE_MIN,
    max: BODY_FEATURE_MAX
  },
  {
    id: 'penisSize',
    label: 'Penis Size',
    kind: 'range',
    min: BODY_FEATURE_MIN,
    max: BODY_FEATURE_MAX
  }
]);

export function defaultCharacterCustomization() {
  return {
    name: DEFAULT_CHARACTER_NAME,
    appearance: normalizePlayerAppearance(MARA_DEFAULT_APPEARANCE)
  };
}

export function createCustomizationState(player = {}) {
  const defaults = defaultCharacterCustomization();
  const name = characterNameIsValid(player?.name) ? normalizeCharacterName(player.name) : defaults.name;
  const appearance = normalizePlayerAppearance(player?.appearance ?? defaults.appearance);
  return {
    selectedIndex: 0,
    name,
    appearance,
    error: ''
  };
}

export function moveCustomizationSelection(state, delta) {
  return {
    ...state,
    selectedIndex: clampIndex((state.selectedIndex ?? 0) + delta, CHARACTER_CUSTOMIZATION_FIELDS.length)
  };
}

export function changeCustomizationOption(state, delta) {
  const index = clampIndex(state.selectedIndex ?? 0, CHARACTER_CUSTOMIZATION_FIELDS.length);
  const field = CHARACTER_CUSTOMIZATION_FIELDS[index];
  if (!field || (field.kind !== 'option' && field.kind !== 'range')) return state;
  if (field.kind === 'range') {
    const appearance = { ...(state.appearance ?? {}) };
    const current = clampWhole(appearance[field.id], field.min ?? BODY_FEATURE_MIN, field.max ?? BODY_FEATURE_MAX);
    appearance[field.id] = clampWhole(current + delta, field.min ?? BODY_FEATURE_MIN, field.max ?? BODY_FEATURE_MAX);
    return {
      ...state,
      appearance: normalizePlayerAppearance(appearance)
    };
  }
  const current = state.appearance?.[field.id];
  const currentIndex = Math.max(0, field.options.findIndex((option) => option.id === current));
  const next = field.options[wrapIndex(currentIndex + delta, field.options.length)];
  const appearance = { ...(state.appearance ?? {}), [field.id]: next.id };
  if (field.id === 'genderModel') {
    delete appearance.bodyFrame;
    delete appearance.anatomy;
    delete appearance.breastSize;
    delete appearance.penisSize;
  }
  return {
    ...state,
    appearance: normalizePlayerAppearance(appearance)
  };
}

export function applyCustomizationText(state, textEvents = []) {
  let name = String(state.name ?? '');
  for (const event of textEvents) {
    if (event?.type === 'backspace') {
      name = name.slice(0, -1);
      continue;
    }
    if (event?.type !== 'char') continue;
    const value = String(event.value ?? '');
    if (!/^[A-Za-z ']+$/.test(value)) continue;
    if (name.length + value.length > CHARACTER_NAME_MAX) continue;
    name += value;
  }
  const normalized = normalizeCharacterName(name);
  return {
    ...state,
    name,
    error: characterNameIsValid(normalized) ? '' : `Name must be ${CHARACTER_NAME_MIN} to ${CHARACTER_NAME_MAX} letters.`
  };
}

export function customizationCanConfirm(state) {
  return characterNameIsValid(normalizeCharacterName(state?.name));
}

export function customizationResult(state) {
  const name = normalizeCharacterName(state?.name);
  const appearance = normalizePlayerAppearance(state?.appearance);
  return {
    name: characterNameIsValid(name) ? name : DEFAULT_CHARACTER_NAME,
    appearance: {
      genderModel: appearance.genderModel,
      bodyType: appearance.bodyType,
      skinTone: appearance.skinTone,
      hairColor: appearance.hairColor,
      hairStyle: appearance.hairStyle,
      facialHair: appearance.facialHair,
      breastSize: appearance.breastSize,
      penisSize: appearance.penisSize
    }
  };
}

export function currentCustomizationRows(state) {
  const appearance = normalizePlayerAppearance(state?.appearance);
  return CHARACTER_CUSTOMIZATION_FIELDS.map((field, index) => ({
    ...field,
    selected: index === (state?.selectedIndex ?? 0),
    value: customizationRowValue(field, state, appearance)
  }));
}

function customizationRowValue(field, state, appearance) {
  if (field.kind === 'name') return String(state?.name ?? '');
  if (field.kind === 'range') return clampWhole(appearance[field.id], field.min ?? BODY_FEATURE_MIN, field.max ?? BODY_FEATURE_MAX);
  return optionLabel(field, appearance[field.id]);
}

export function normalizeCharacterName(name) {
  return String(name ?? '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function characterNameIsValid(name) {
  const normalized = normalizeCharacterName(name);
  return normalized.length >= CHARACTER_NAME_MIN
    && normalized.length <= CHARACTER_NAME_MAX
    && /^[A-Za-z][A-Za-z ']*$/.test(normalized);
}

export function createPrimaryAssignmentState(player = {}) {
  const progression = normalizeProgression(player?.progression);
  const values = {};
  for (const primary of PRIMARY_ATTRIBUTES) {
    values[primary.id] = PRIMARY_ASSIGNMENT_BASE;
  }
  return {
    selectedIndex: 0,
    values,
    pointsTotal: PRIMARY_ASSIGNMENT_POINTS,
    pointsRemaining: PRIMARY_ASSIGNMENT_POINTS,
    previewProgression: progression
  };
}

export function movePrimaryAssignmentSelection(state, delta) {
  return {
    ...state,
    selectedIndex: clampIndex((state.selectedIndex ?? 0) + delta, PRIMARY_ATTRIBUTES.length)
  };
}

export function changePrimaryAssignmentValue(state, delta) {
  const index = clampIndex(state.selectedIndex ?? 0, PRIMARY_ATTRIBUTES.length);
  const primary = PRIMARY_ATTRIBUTES[index];
  if (!primary) return state;
  const values = { ...(state.values ?? {}) };
  const current = clampWhole(values[primary.id], PRIMARY_ASSIGNMENT_BASE, PRIMARY_ASSIGNMENT_CAP);
  let next = current;
  if (delta > 0 && state.pointsRemaining > 0 && current < PRIMARY_ASSIGNMENT_CAP) next += 1;
  if (delta < 0 && current > PRIMARY_ASSIGNMENT_BASE) next -= 1;
  values[primary.id] = next;
  return withPrimaryAssignmentTotals({ ...state, values });
}

export function primaryAssignmentCanConfirm(state) {
  return (state?.pointsRemaining ?? PRIMARY_ASSIGNMENT_POINTS) === 0;
}

export function primaryAssignmentResult(state) {
  const values = {};
  for (const primary of PRIMARY_ATTRIBUTES) {
    values[primary.id] = clampWhole(
      state?.values?.[primary.id],
      PRIMARY_ASSIGNMENT_BASE,
      PRIMARY_ASSIGNMENT_CAP
    );
  }
  return values;
}

export function primaryAssignmentRows(state) {
  const values = primaryAssignmentResult(state);
  return PRIMARY_ATTRIBUTES.map((primary, index) => ({
    ...primary,
    value: values[primary.id],
    selected: index === (state?.selectedIndex ?? 0)
  }));
}

function withPrimaryAssignmentTotals(state) {
  let spent = 0;
  for (const primary of PRIMARY_ATTRIBUTES) {
    const value = clampWhole(state.values?.[primary.id], PRIMARY_ASSIGNMENT_BASE, PRIMARY_ASSIGNMENT_CAP);
    spent += Math.max(0, value - PRIMARY_ASSIGNMENT_BASE);
  }
  return {
    ...state,
    pointsRemaining: Math.max(0, PRIMARY_ASSIGNMENT_POINTS - spent)
  };
}

function optionLabel(field, value) {
  return field.options.find((option) => option.id === value)?.label ?? String(value ?? '');
}

function clampIndex(value, length) {
  if (length <= 0) return 0;
  return Math.max(0, Math.min(length - 1, Math.round(value)));
}

function wrapIndex(value, length) {
  if (length <= 0) return 0;
  return ((value % length) + length) % length;
}

function clampWhole(value, min, max) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, Math.round(value)));
}
