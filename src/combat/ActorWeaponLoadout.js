import {
  attackAmmoCost,
  weaponAttackDefinitions,
  weaponAttackRoles,
  weaponMagazineDefinition,
  weaponRuntimeAttackId
} from './WeaponRules.js';

export function hydrateActorWeaponLoadout(actor, loadout = [], itemDefs = {}) {
  if (!actor || !Array.isArray(loadout) || loadout.length === 0) return [];
  const states = [];
  const attacks = [];
  for (const [index, entry] of loadout.entries()) {
    const itemDef = itemDefs[entry?.item];
    if (!itemDef || itemDef.type !== 'weapon') continue;
    const magazine = weaponMagazineDefinition(itemDef);
    const state = {
      itemId: itemDef.id,
      index,
      magazine,
      loaded: magazine
        ? clampCount(entry.loaded, magazine.capacity, magazine.defaultLoaded)
        : null,
      reserve: magazine ? nonNegativeCount(entry.reserve) : 0,
      attacks: []
    };
    for (const [attackIndex, definition] of weaponAttackDefinitions(itemDef).entries()) {
      const localId = definition.id ?? `attack-${attackIndex + 1}`;
      const ammoCost = magazine ? attackAmmoCost(definition) : 0;
      const attack = {
        ...definition,
        id: weaponRuntimeAttackId(`actor:${actor.spawnId ?? actor.id}:${index}`, localId),
        localId,
        roles: weaponAttackRoles(itemDef, definition),
        ammoCost,
        weaponItemId: itemDef.id,
        actorWeaponIndex: index,
        reloadAp: magazine?.reloadAp ?? null,
        loaded: state.loaded,
        magazineCapacity: magazine?.capacity ?? null,
        reserveAmmo: state.reserve,
        empty: Boolean(magazine && state.loaded < ammoCost)
      };
      state.attacks.push(attack);
      attacks.push(attack);
    }
    states.push(state);
  }
  if (attacks.length === 0) return [];
  actor.weaponStates = states;
  actor.attacks = [...attacks, ...(actor.baseAttacks ?? []).map((attack) => ({ ...attack }))];
  return attacks;
}

export function actorWeaponReloadState(actor, attack = actor?.attacks?.[0]) {
  const state = actor?.weaponStates?.find((entry) => entry.index === attack?.actorWeaponIndex);
  if (!state?.magazine) return null;
  return {
    state,
    reloadAp: state.magazine.reloadAp,
    loaded: state.loaded,
    capacity: state.magazine.capacity,
    reserve: state.reserve,
    full: state.loaded >= state.magazine.capacity,
    canReload: state.loaded < state.magazine.capacity && state.reserve > 0
  };
}

export function reloadActorWeapon(actor, attack = actor?.attacks?.[0]) {
  const reload = actorWeaponReloadState(actor, attack);
  if (!reload?.canReload) return { ok: false, reloadAp: reload?.reloadAp ?? 0, loaded: 0 };
  const count = Math.min(reload.capacity - reload.loaded, reload.reserve);
  reload.state.loaded += count;
  reload.state.reserve -= count;
  refreshStateAttacks(reload.state);
  return { ok: true, reloadAp: reload.reloadAp, loaded: count, current: reload.state.loaded };
}

export function consumeActorWeaponAttack(actor, attack) {
  const state = actor?.weaponStates?.find((entry) => entry.index === attack?.actorWeaponIndex);
  if (!state?.magazine) return true;
  const cost = attackAmmoCost(attack);
  if (state.loaded < cost) return false;
  state.loaded -= cost;
  refreshStateAttacks(state);
  return true;
}

function refreshStateAttacks(state) {
  for (const attack of state.attacks) {
    attack.loaded = state.loaded;
    attack.reserveAmmo = state.reserve;
    attack.empty = state.loaded < attackAmmoCost(attack);
  }
}

function nonNegativeCount(value) {
  return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
}

function clampCount(value, max, fallback) {
  const count = Number.isFinite(value) ? nonNegativeCount(value) : fallback;
  return Math.max(0, Math.min(max, count));
}
