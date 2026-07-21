// Shared normalization for data-driven weapon definitions and runtime attacks.
// Inventory owns weapon instances and ammunition. Combat and entities use these
// helpers to resolve stable semantic roles without knowing item data shapes.

export const READY_WEAPON_SLOTS = Object.freeze(['weapon1', 'weapon2']);
export const READY_WEAPON_SLOT_SET = new Set(READY_WEAPON_SLOTS);
export const LEGACY_WEAPON_SLOTS = Object.freeze({
  sidearm: 'weapon1',
  melee: 'weapon2'
});

export function normalizeWeaponEquipmentSlot(slot) {
  if (slot === 'weapon' || READY_WEAPON_SLOT_SET.has(slot)) return 'weapon';
  if (slot === 'sidearm' || slot === 'melee') return 'weapon';
  return slot ?? null;
}

export function weaponAttackDefinitions(itemDef = {}) {
  const weapon = itemDef.weapon ?? {};
  if (Array.isArray(weapon.attacks)) {
    return weapon.attacks.filter((attack) => attack && typeof attack === 'object' && !Array.isArray(attack));
  }
  return weapon.attack && typeof weapon.attack === 'object' && !Array.isArray(weapon.attack)
    ? [weapon.attack]
    : [];
}

export function weaponAttackRoles(itemDef = {}, attack = {}) {
  const roles = [];
  for (const value of [
    attack.id,
    ...(Array.isArray(itemDef.weapon?.roles) ? itemDef.weapon.roles : []),
    ...(Array.isArray(attack.roles) ? attack.roles : []),
    attack.role
  ]) {
    if (typeof value === 'string' && value.trim() && !roles.includes(value)) roles.push(value);
  }
  return roles;
}

export function attackHasRole(attack = {}, role) {
  if (typeof role !== 'string' || !role) return false;
  return attack.id === role || attack.localId === role || (attack.roles ?? []).includes(role);
}

export function resolveAttackReference(attacks = [], reference) {
  if (typeof reference !== 'string' || !reference) return null;
  return attacks.find((attack) => attack.id === reference)
    ?? attacks.find((attack) => attackHasRole(attack, reference))
    ?? null;
}

export function weaponMagazineDefinition(itemDef = {}) {
  const magazine = itemDef.weapon?.magazine;
  if (!magazine || typeof magazine !== 'object' || Array.isArray(magazine)) return null;
  const capacity = positiveWhole(magazine.capacity);
  const ammoFamily = typeof magazine.ammoFamily === 'string' && magazine.ammoFamily.trim()
    ? magazine.ammoFamily
    : null;
  if (!capacity || !ammoFamily) return null;
  return {
    ammoFamily,
    capacity,
    defaultLoaded: Math.min(capacity, nonNegativeWhole(magazine.defaultLoaded, capacity)),
    reloadAp: positiveWhole(magazine.reloadAp, 2)
  };
}

export function weaponRuntimeAttackId(entryKey, localId) {
  return `${entryKey}/${localId}`;
}

export function attackAmmoCost(attack = {}) {
  return Math.max(0, positiveWhole(attack.ammoCost, 1));
}

export function attackConditionWear(attack = {}) {
  return Math.max(0, positiveWhole(attack.conditionWear, 1));
}

function positiveWhole(value, fallback = 0) {
  return Number.isFinite(value) && value > 0 ? Math.max(1, Math.floor(value)) : fallback;
}

function nonNegativeWhole(value, fallback = 0) {
  return Number.isFinite(value) && value >= 0 ? Math.floor(value) : fallback;
}
