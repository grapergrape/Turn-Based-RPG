import { PRIMARY_ATTRIBUTES, normalizeProgression } from './Progression.js';
import { PLAYER_DEFAULT_APPEARANCE, normalizePlayerAppearance } from '../render/SpriteAtlas.js';

export const CHARACTER_NAME_MIN = 2;
export const CHARACTER_NAME_MAX = 18;
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
      { id: 'pale', label: 'Pale' },
      { id: 'light', label: 'Light' },
      { id: 'tan', label: 'Tan' },
      { id: 'ruddy', label: 'Ruddy' },
      { id: 'brown', label: 'Brown' },
      { id: 'dark', label: 'Dark' }
    ])
  },
  {
    id: 'age',
    label: 'Age',
    kind: 'option',
    options: Object.freeze([
      { id: 'fresh', label: 'Fresh Faced' },
      { id: 'adult', label: 'Adult' },
      { id: 'weathered', label: 'Weathered' },
      { id: 'elder', label: 'Elder' }
    ])
  },
  {
    id: 'faceShape',
    label: 'Face Shape',
    kind: 'option',
    options: Object.freeze([
      { id: 'narrow', label: 'Narrow' },
      { id: 'oval', label: 'Oval' },
      { id: 'broad', label: 'Broad' },
      { id: 'long', label: 'Long' }
    ])
  },
  {
    id: 'faceMark',
    label: 'Face Mark',
    kind: 'option',
    options: Object.freeze([
      { id: 'none', label: 'None' },
      { id: 'split-brow', label: 'Split Brow' },
      { id: 'cheek-scar', label: 'Cheek Scar' },
      { id: 'burn-scar', label: 'Burn Scar' },
      { id: 'eye-patch', label: 'Eye Patch' }
    ])
  },
  {
    id: 'hairColor',
    label: 'Hair Color',
    kind: 'option',
    options: Object.freeze([
      { id: 'black', label: 'Black' },
      { id: 'brown', label: 'Brown' },
      { id: 'auburn', label: 'Auburn' },
      { id: 'blond', label: 'Blond' },
      { id: 'grey', label: 'Grey' },
      { id: 'white', label: 'White' }
    ])
  },
  {
    id: 'hairStyle',
    label: 'Hair Style',
    kind: 'option',
    options: Object.freeze([
      { id: 'cropped', label: 'Cropped' },
      { id: 'bobbed', label: 'Bobbed' },
      { id: 'loose', label: 'Loose' },
      { id: 'tied', label: 'Tied Back' },
      { id: 'braid', label: 'Braid' },
      { id: 'tonsure', label: 'Tonsure' },
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
      { id: 'moustache', label: 'Moustache' },
      { id: 'goatee', label: 'Goatee' },
      { id: 'short-beard', label: 'Short Beard' },
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
      { id: 'stocky', label: 'Stocky' },
      { id: 'fat', label: 'Fat' },
      { id: 'buff', label: 'Buff' }
    ])
  },
  {
    id: 'stature',
    label: 'Stature',
    kind: 'option',
    options: Object.freeze([
      { id: 'short', label: 'Short' },
      { id: 'average', label: 'Average' },
      { id: 'tall', label: 'Tall' }
    ])
  },
  {
    id: 'posture',
    label: 'Posture',
    kind: 'option',
    options: Object.freeze([
      { id: 'upright', label: 'Upright' },
      { id: 'guarded', label: 'Guarded' },
      { id: 'stooped', label: 'Stooped' }
    ])
  },
  {
    id: 'anatomy',
    label: 'Anatomy',
    kind: 'option',
    options: Object.freeze([
      { id: 'vulva', label: 'Vulva' },
      { id: 'penis', label: 'Penis' },
      { id: 'intersex', label: 'Both' },
      { id: 'smooth', label: 'None' }
    ])
  },
  {
    id: 'breastSize',
    label: 'Breast Scale',
    kind: 'range',
    min: BODY_FEATURE_MIN,
    max: BODY_FEATURE_MAX
  },
  {
    id: 'penisSize',
    label: 'Groin Scale',
    kind: 'range',
    min: BODY_FEATURE_MIN,
    max: BODY_FEATURE_MAX
  }
]);

export function defaultCharacterCustomization() {
  return {
    name: '',
    appearance: normalizePlayerAppearance(PLAYER_DEFAULT_APPEARANCE)
  };
}

export function createCustomizationState(player = {}) {
  const defaults = defaultCharacterCustomization();
  const appearance = normalizePlayerAppearance(player?.appearance ?? defaults.appearance);
  return {
    selectedIndex: 0,
    name: defaults.name,
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
    const next = clampWhole(current + delta, field.min ?? BODY_FEATURE_MIN, field.max ?? BODY_FEATURE_MAX);
    appearance[field.id] = next;
    if (field.id === 'penisSize' && next > 0 && appearance.anatomy !== 'penis' && appearance.anatomy !== 'intersex') {
      appearance.anatomy = 'penis';
    }
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
  // Picking a penis with the groin slider still at zero would show nothing;
  // start it at the middle of the scale so the change is visible at once.
  if (field.id === 'anatomy' && (next.id === 'penis' || next.id === 'intersex') && !(appearance.penisSize > 0)) {
    appearance.penisSize = 5;
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
  if (!characterNameIsValid(name)) {
    throw new Error(`Name must be ${CHARACTER_NAME_MIN} to ${CHARACTER_NAME_MAX} letters.`);
  }
  const appearance = normalizePlayerAppearance(state?.appearance);
  return {
    name,
    appearance: {
      genderModel: appearance.genderModel,
      bodyType: appearance.bodyType,
      stature: appearance.stature,
      posture: appearance.posture,
      skinTone: appearance.skinTone,
      age: appearance.age,
      faceShape: appearance.faceShape,
      faceMark: appearance.faceMark,
      hairColor: appearance.hairColor,
      hairStyle: appearance.hairStyle,
      facialHair: appearance.facialHair,
      anatomy: appearance.anatomy,
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
