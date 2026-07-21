import { isRangedAttack } from './AttackMode.js';

export const HIT_CHANCE_MIN = 10;
export const HIT_CHANCE_MAX = 95;
export const HIT_CHANCE_BASE = 70;

const COVER_PENALTIES = Object.freeze({
  none: 0,
  light: -15,
  hard: -30
});

export function attackFieldFor(attack = {}) {
  if (typeof attack.accuracyField === 'string' && attack.accuracyField.trim() !== '') {
    return attack.accuracyField;
  }
  return isRangedAttack(attack) ? 'firearms' : 'melee';
}

export function defenseFieldsFor(attack = {}) {
  if (typeof attack.defenseField === 'string' && attack.defenseField.trim() !== '') {
    return [attack.defenseField];
  }
  return isRangedAttack(attack) ? ['stealth'] : ['melee', 'unarmed'];
}

export function calculateHitChance({
  attackerRating = 0,
  defenderRating = 0,
  attack = {},
  distance = 1,
  cover = 'none',
  attackerHpRatio = 1,
  modifiers = []
} = {}) {
  const parts = [
    { id: 'base', label: 'BASE', value: HIT_CHANCE_BASE }
  ];

  const skillDelta = Math.round((finiteNumber(attackerRating) - finiteNumber(defenderRating)) / 2);
  if (skillDelta !== 0) parts.push({ id: 'skill', label: 'SKILL', value: skillDelta });

  if (isRangedAttack(attack)) {
    const rangePenalty = -4 * Math.max(0, Math.round(finiteNumber(distance, 1)) - 1);
    if (rangePenalty !== 0) parts.push({ id: 'range', label: 'RANGE', value: rangePenalty });
  }

  const coverLevel = normalizeCover(cover);
  const coverPenalty = COVER_PENALTIES[coverLevel] ?? 0;
  if (coverPenalty !== 0) {
    parts.push({ id: 'cover', label: coverLevel === 'hard' ? 'HARD COVER' : 'LIGHT COVER', value: coverPenalty });
  }

  const hpRatio = finiteNumber(attackerHpRatio, 1);
  if (hpRatio > 0 && hpRatio <= 0.25) {
    parts.push({ id: 'wounded', label: 'WOUNDED', value: -20 });
  } else if (hpRatio > 0 && hpRatio <= 0.5) {
    parts.push({ id: 'wounded', label: 'WOUNDED', value: -10 });
  }

  for (const modifier of modifiers) {
    const value = finiteNumber(modifier?.value, 0);
    if (value === 0) continue;
    parts.push({
      id: typeof modifier?.id === 'string' ? modifier.id : 'modifier',
      label: compactLabel(modifier?.label ?? modifier?.id ?? 'MOD'),
      value
    });
  }

  const rawChance = parts.reduce((total, part) => total + part.value, 0);
  const chance = clamp(Math.round(rawChance), HIT_CHANCE_MIN, HIT_CHANCE_MAX);
  const tags = parts
    .filter((part) => part.id !== 'base' && part.value !== 0)
    .map((part) => part.label);

  return { chance, rawChance, min: HIT_CHANCE_MIN, max: HIT_CHANCE_MAX, tags, parts };
}

export function rollHit(chance, random = Math.random) {
  const roll = clamp(Math.floor(clamp(finiteNumber(random(), 0), 0, 0.999999) * 100) + 1, 1, 100);
  return { roll, hit: roll <= clamp(Math.round(finiteNumber(chance, 0)), 0, 100) };
}

export function formatChance(chance) {
  return `${clamp(Math.round(finiteNumber(chance, 0)), 0, 100)}%`;
}

function normalizeCover(cover) {
  if (typeof cover === 'string') {
    const value = cover.toLowerCase();
    if (value === 'light' || value === 'hard') return value;
  }
  if (typeof cover?.level === 'string') return normalizeCover(cover.level);
  return 'none';
}

function compactLabel(value) {
  return String(value).trim().toUpperCase().replace(/\s+/g, ' ');
}

function finiteNumber(value, fallback = 0) {
  return Number.isFinite(value) ? value : fallback;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
