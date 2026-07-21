export const ATTACK_MODES = Object.freeze(['melee', 'ranged']);

export function attackModeFor(attack = {}) {
  if (ATTACK_MODES.includes(attack.mode)) return attack.mode;
  return Number(attack.range) > 1 ? 'ranged' : 'melee';
}

export function isMeleeAttack(attack = {}) {
  return attackModeFor(attack) === 'melee';
}

export function isRangedAttack(attack = {}) {
  return attackModeFor(attack) === 'ranged';
}
