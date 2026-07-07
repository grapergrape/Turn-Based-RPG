export const DAMAGE_SKILL_BASELINE = 35;
export const DAMAGE_SKILL_STEP = 20;
export const DAMAGE_SKILL_BONUS_CAP = 4;

export function damageFieldFor(attack = {}) {
  if (typeof attack.damageField === 'string' && attack.damageField.trim() !== '') {
    return attack.damageField;
  }
  if (typeof attack.accuracyField === 'string' && attack.accuracyField.trim() !== '') {
    return attack.accuracyField;
  }
  return attack.range > 1 ? 'firearms' : 'melee';
}

export function calculateAttackDamage({
  baseDamage = 0,
  damageMultiplier = 1,
  attackerRating = 0,
  bonusCap = DAMAGE_SKILL_BONUS_CAP
} = {}) {
  const base = Math.max(0, Math.round(finiteNumber(baseDamage) * finiteNumber(damageMultiplier, 1)));
  const skillBonus = Math.min(
    Math.max(0, Math.floor((finiteNumber(attackerRating) - DAMAGE_SKILL_BASELINE) / DAMAGE_SKILL_STEP)),
    Math.max(0, Math.floor(finiteNumber(bonusCap, DAMAGE_SKILL_BONUS_CAP)))
  );
  const damage = base + skillBonus;
  const tags = skillBonus > 0 ? [`SKILL +${skillBonus}`] : [];
  return { damage, baseDamage: base, skillBonus, tags };
}

export function formatDamage(damage) {
  return `D${Math.max(0, Math.round(finiteNumber(damage)))}`;
}

function finiteNumber(value, fallback = 0) {
  return Number.isFinite(value) ? value : fallback;
}
