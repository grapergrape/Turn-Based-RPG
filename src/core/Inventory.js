// Inventory state: stack counts for ordinary items, individual entries for
// condition-bearing weapons, carry weight, and a fixed paper-doll equipment map.
// Item definitions remain data-driven.

import { itemRarityMeta } from './ItemRarity.js';
import { buildProfile } from './Progression.js';
import {
  attackAmmoCost,
  attackConditionWear,
  LEGACY_WEAPON_SLOTS,
  normalizeWeaponEquipmentSlot,
  READY_WEAPON_SLOTS,
  READY_WEAPON_SLOT_SET,
  weaponAttackDefinitions,
  weaponAttackRoles,
  weaponMagazineDefinition,
  weaponRuntimeAttackId
} from '../combat/WeaponRules.js';

export const EQUIPMENT_SLOTS = [
  { id: 'clothes', label: 'Clothes' },
  { id: 'armor', label: 'Armor' },
  { id: 'boots', label: 'Boots' },
  { id: 'helmet', label: 'Helmet' },
  { id: 'weapon1', label: 'Weapon 1' },
  { id: 'weapon2', label: 'Weapon 2' },
  { id: 'trinket', label: 'Trinket' },
  { id: 'ring1', label: 'Ring 1' },
  { id: 'ring2', label: 'Ring 2' }
];

const DEFAULT_MAX_CARRY_WEIGHT = 10;
const RING_SLOTS = new Set(['ring1', 'ring2']);
const WEAPON_SLOTS = new Set(READY_WEAPON_SLOTS);
const REPAIR_BASE = 15;
const REPAIR_ENGINEERING_DIVISOR = 10;
const REPAIR_EXACT_MATCH_BONUS = 10;

function cleanCount(count) {
  return Math.max(0, Math.floor(Number(count) || 0));
}

function cleanCondition(value, max) {
  const fallback = max;
  const raw = Number.isFinite(value) ? value : fallback;
  return Math.max(0, Math.min(max, Math.round(raw)));
}

export function conditionDamageMultiplier(condition, maxCondition = 100) {
  const max = Math.max(1, Math.floor(Number(maxCondition) || 100));
  const value = cleanCondition(condition, max);
  if (value <= 0) return 0;
  const percent = (value / max) * 100;
  if (percent <= 25) return 0.5;
  if (percent <= 50) return 0.75;
  if (percent <= 75) return 0.9;
  return 1;
}

export function conditionTier(condition, maxCondition = 100) {
  const max = Math.max(1, Math.floor(Number(maxCondition) || 100));
  const value = cleanCondition(condition, max);
  if (value <= 0) return { id: 'broken', label: 'Broken', multiplier: 0 };
  const percent = (value / max) * 100;
  if (percent <= 25) return { id: 'failing', label: 'Failing', multiplier: 0.5 };
  if (percent <= 50) return { id: 'worn', label: 'Worn', multiplier: 0.75 };
  if (percent <= 75) return { id: 'scarred', label: 'Scarred', multiplier: 0.9 };
  return { id: 'sound', label: 'Sound', multiplier: 1 };
}

export class Inventory {
  static formatWeight(value) {
    const rounded = Math.round((Number(value) || 0) * 10) / 10;
    return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
  }

  constructor(itemDefs = {}, options = {}) {
    this.itemDefs = itemDefs;
    this.counts = new Map();
    this.instances = new Map();
    this.nextInstanceId = 1;
    this.maxCarryWeight = Number.isFinite(options.maxCarryWeight)
      ? Math.max(0, options.maxCarryWeight)
      : DEFAULT_MAX_CARRY_WEIGHT;
    this.equipment = new Map(EQUIPMENT_SLOTS.map((slot) => [slot.id, null]));
  }

  add(itemId, count = 1, options = {}) {
    const amount = cleanCount(count);
    if (!itemId || amount <= 0) return { ok: false, reason: 'invalid' };

    const result = this.canAdd(itemId, amount);
    if (!options.ignoreCapacity && !result.ok) return result;

    if (this.isConditionItem(itemId)) {
      for (let i = 0; i < amount; i += 1) {
        this.#addInstance(itemId, options);
      }
      return { ...result, ok: true };
    }

    this.counts.set(itemId, this.stackCount(itemId) + amount);
    return { ...result, ok: true };
  }

  count(itemId) {
    if (this.instances.has(itemId)) return 1;
    let total = this.stackCount(itemId);
    for (const entry of this.instances.values()) {
      if (entry.itemId === itemId) total += 1;
    }
    return total;
  }

  stackCount(itemId) {
    return this.counts.get(itemId) ?? 0;
  }

  has(itemId) {
    return this.count(itemId) > 0;
  }

  remove(itemId, count = 1) {
    const amount = cleanCount(count);
    if (!itemId || amount <= 0 || !this.has(itemId)) return false;

    if (this.instances.has(itemId)) {
      this.#removeInstance(itemId);
      return true;
    }

    if (this.isConditionItem(itemId)) {
      const keys = this.#instanceKeysFor(itemId).slice(0, amount);
      if (keys.length < amount) return false;
      for (const key of keys) this.#removeInstance(key);
      return true;
    }

    const next = Math.max(0, this.stackCount(itemId) - amount);
    if (next === 0) this.counts.delete(itemId);
    else this.counts.set(itemId, next);
    this.#trimStackEquipment(itemId);
    return true;
  }

  displayName(itemId) {
    const resolved = this.itemIdFor(itemId);
    return this.itemDefs[resolved]?.name ?? resolved ?? itemId;
  }

  itemWeight(itemId) {
    const value = this.itemDefs[this.itemIdFor(itemId)]?.weight;
    return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, value) : 0;
  }

  itemRarity(itemId) {
    return itemRarityMeta(this.itemDefs[this.itemIdFor(itemId)]?.rarity);
  }

  itemBuild(itemId) {
    const buildId = this.itemDefs[this.itemIdFor(itemId)]?.build;
    return buildId ? buildProfile(buildId) : null;
  }

  weightOf(itemId, count = 1) {
    return this.itemWeight(itemId) * cleanCount(count);
  }

  currentWeight() {
    let total = 0;
    for (const [itemId, count] of this.counts) {
      total += this.weightOf(itemId, count);
    }
    for (const entry of this.instances.values()) {
      total += this.itemWeight(entry.itemId);
    }
    return Math.round(total * 10) / 10;
  }

  canAdd(itemId, count = 1) {
    const amount = cleanCount(count);
    const current = this.currentWeight();
    const added = this.weightOf(itemId, amount);
    const projected = Math.round((current + added) * 10) / 10;
    const overBy = Math.max(0, Math.round((projected - this.maxCarryWeight) * 10) / 10);
    return {
      ok: projected <= this.maxCarryWeight + 0.0001,
      current,
      added,
      projected,
      overBy
    };
  }

  canAddLoot(lootEntries = []) {
    const current = this.currentWeight();
    let added = 0;
    for (const entry of lootEntries ?? []) {
      added += this.weightOf(entry.item, entry.count ?? 1);
    }
    const projected = Math.round((current + added) * 10) / 10;
    const overBy = Math.max(0, Math.round((projected - this.maxCarryWeight) * 10) / 10);
    return {
      ok: projected <= this.maxCarryWeight + 0.0001,
      current,
      added: Math.round(added * 10) / 10,
      projected,
      overBy
    };
  }

  remainingWeight() {
    return Math.max(0, Math.round((this.maxCarryWeight - this.currentWeight()) * 10) / 10);
  }

  equipmentSlotFor(itemId) {
    return normalizeWeaponEquipmentSlot(this.itemDefs[this.itemIdFor(itemId)]?.equipment?.slot);
  }

  canEquip(itemId) {
    const slot = this.equipmentSlotFor(itemId);
    return this.has(itemId) && Boolean(slot);
  }

  equip(itemId, preferredSlot = null) {
    const entryKey = this.#equipKeyFor(itemId, preferredSlot);
    const resolvedItemId = this.itemIdFor(entryKey ?? itemId);
    if (!entryKey && !this.has(itemId)) {
      return { ok: false, message: `${this.displayName(itemId)} is not in the pack.` };
    }

    const targetSlot = this.#resolveEquipSlot(entryKey ?? itemId, preferredSlot);
    if (!targetSlot) {
      return { ok: false, message: `${this.displayName(itemId)} cannot be equipped.` };
    }

    const equipValue = entryKey ?? itemId;
    if (this.equipment.get(targetSlot) === equipValue) {
      return { ok: true, message: `${this.displayName(equipValue)} is already equipped.` };
    }

    if (!this.instances.has(equipValue) && this.equippedCount(resolvedItemId) >= this.count(resolvedItemId)) {
      return { ok: false, message: `No spare ${this.displayName(resolvedItemId)} to equip.` };
    }

    if (this.instances.has(equipValue)) {
      for (const [slotId, value] of this.equipment) {
        if (slotId !== targetSlot && value === equipValue) this.equipment.set(slotId, null);
      }
    }
    this.equipment.set(targetSlot, equipValue);
    return {
      ok: true,
      message: `Equipped ${this.displayName(equipValue)}: ${this.slotLabel(targetSlot)}.`
    };
  }

  unequip(slotId) {
    if (!this.equipment.has(slotId)) {
      return { ok: false, message: 'No such gear slot.' };
    }
    const itemKey = this.equipment.get(slotId);
    if (!itemKey) return { ok: false, message: `${this.slotLabel(slotId)} is empty.` };
    this.equipment.set(slotId, null);
    return { ok: true, message: `Removed ${this.displayName(itemKey)}.` };
  }

  loadEquipment(equipment = {}) {
    const normalizedEquipment = { ...equipment };
    for (const [legacySlot, readySlot] of Object.entries(LEGACY_WEAPON_SLOTS)) {
      if (!normalizedEquipment[readySlot] && normalizedEquipment[legacySlot]) {
        normalizedEquipment[readySlot] = normalizedEquipment[legacySlot];
      }
    }
    for (const slot of EQUIPMENT_SLOTS) {
      const itemId = normalizedEquipment[slot.id];
      const entryKey = this.#equipKeyFor(itemId, slot.id);
      if (!entryKey && (!itemId || !this.has(itemId))) continue;
      const value = entryKey ?? itemId;
      if (!this.#slotAccepts(slot.id, value)) continue;
      if (!this.instances.has(value) && this.equippedCount(itemId) >= this.count(itemId)) continue;
      this.equipment.set(slot.id, value);
    }
  }

  equipmentSnapshot() {
    const snapshot = {};
    for (const [slotId, itemKey] of this.equipment) {
      if (itemKey) snapshot[slotId] = this.itemIdFor(itemKey);
    }
    return snapshot;
  }

  stateSnapshot() {
    return {
      counts: [...this.counts.entries()].map(([itemId, count]) => ({ item: itemId, count })),
      instances: [...this.instances.values()].map((entry) => ({ ...entry })),
      equipment: Object.fromEntries([...this.equipment.entries()].filter(([, value]) => value))
    };
  }

  loadState(snapshot = {}) {
    this.counts.clear();
    this.instances.clear();
    this.equipment = new Map(EQUIPMENT_SLOTS.map((slot) => [slot.id, null]));
    for (const entry of snapshot.counts ?? []) {
      if (entry?.item) this.add(entry.item, entry.count ?? 1, { ignoreCapacity: true });
    }
    for (const entry of snapshot.instances ?? []) {
      if (entry?.itemId) this.#addInstance(entry.itemId, {
        entryKey: entry.entryKey,
        condition: entry.condition,
        loaded: entry.loaded,
        ignoreCapacity: true
      });
    }
    const normalizedEquipment = { ...(snapshot.equipment ?? {}) };
    for (const [legacySlot, readySlot] of Object.entries(LEGACY_WEAPON_SLOTS)) {
      if (!normalizedEquipment[readySlot] && normalizedEquipment[legacySlot]) {
        normalizedEquipment[readySlot] = normalizedEquipment[legacySlot];
      }
    }
    for (const [slotId, value] of Object.entries(normalizedEquipment)) {
      const entryKey = this.#equipKeyFor(value, slotId);
      const equipValue = entryKey ?? value;
      if (!this.equipment.has(slotId) || !value || !this.has(equipValue) || !this.#slotAccepts(slotId, equipValue)) continue;
      if (this.instances.has(equipValue) || this.equippedCount(equipValue) < this.count(equipValue)) {
        this.equipment.set(slotId, equipValue);
      }
    }
  }

  equipmentEntries() {
    return EQUIPMENT_SLOTS.map((slot) => {
      const itemKey = this.equipment.get(slot.id);
      const itemId = this.itemIdFor(itemKey);
      const rarity = itemId ? this.itemRarity(itemId) : null;
      const build = itemId ? this.itemBuild(itemId) : null;
      const instance = itemKey ? this.instances.get(itemKey) : null;
      const condition = instance ? this.conditionState(itemKey) : null;
      const magazine = instance ? this.magazineState(itemKey) : null;
      const weaponDetails = itemId ? this.itemWeaponDetails(itemKey ?? itemId) : null;
      return {
        slot: slot.id,
        label: slot.label,
        id: itemKey,
        entryKey: instance?.entryKey ?? null,
        itemId,
        name: itemId ? this.displayName(itemId) : 'Empty',
        type: itemId ? this.itemDefs[itemId]?.type ?? 'item' : '',
        rarity: rarity?.id ?? null,
        rarityLabel: rarity?.label ?? '',
        rarityRank: rarity?.rank ?? 0,
        build: build?.id ?? null,
        buildLabel: build?.label ?? '',
        groundModel: itemId ? this.itemDefs[itemId]?.groundModel ?? null : null,
        description: itemId ? this.itemDefs[itemId]?.description ?? '' : '',
        weight: itemId ? this.itemWeight(itemId) : 0,
        equipmentSlot: itemId ? this.equipmentSlotFor(itemId) : null,
        condition: condition?.condition ?? null,
        conditionMax: condition?.max ?? null,
        conditionTier: condition?.tier.id ?? null,
        conditionLabel: condition?.tier.label ?? '',
        loaded: magazine?.loaded ?? null,
        magazineCapacity: magazine?.capacity ?? null,
        ammoFamily: magazine?.ammoFamily ?? null,
        ammoItemId: weaponDetails?.ammoItemId ?? null,
        ammoName: weaponDetails?.ammoName ?? '',
        reserveAmmo: magazine?.reserve ?? null,
        reloadAp: magazine?.reloadAp ?? null,
        attackModes: weaponDetails?.attackModes ?? [],
        canReload: magazine?.canReload ?? false,
        emptyWeapon: magazine?.empty ?? false,
        broken: condition?.tier.id === 'broken',
        empty: !itemId
      };
    });
  }

  slotLabel(slotId) {
    return EQUIPMENT_SLOTS.find((slot) => slot.id === slotId)?.label ?? slotId;
  }

  equippedCount(itemId) {
    if (this.instances.has(itemId)) {
      return [...this.equipment.values()].includes(itemId) ? 1 : 0;
    }
    const resolved = this.itemIdFor(itemId);
    let count = 0;
    for (const value of this.equipment.values()) {
      if (this.itemIdFor(value) === resolved) count += 1;
    }
    return count;
  }

  wornSlots(itemId) {
    const resolved = this.itemIdFor(itemId);
    return EQUIPMENT_SLOTS
      .filter((slot) => {
        const value = this.equipment.get(slot.id);
        if (this.instances.has(itemId)) return value === itemId;
        return this.itemIdFor(value) === resolved;
      })
      .map((slot) => slot.label);
  }

  isEquipped(itemId) {
    return this.equippedCount(itemId) > 0;
  }

  entries() {
    const entries = [...this.counts.entries()].map(([id, count]) => this.#entryFor(id, count));
    for (const instance of this.instances.values()) {
      entries.push(this.#entryFor(instance.entryKey, 1));
    }
    return entries;
  }

  canUse(itemId) {
    const itemDef = this.itemDefs[this.itemIdFor(itemId)] ?? {};
    return this.has(itemId) && (itemDef.type === 'food' || itemDef.use?.effect === 'heal');
  }

  useItem(actor, itemId) {
    if (!itemId || !this.has(itemId)) {
      return `${this.displayName(itemId)} is not in the pack.`;
    }
    const itemDef = this.itemDefs[this.itemIdFor(itemId)] ?? {};
    if (!this.canUse(itemId)) {
      return `${this.displayName(itemId)} cannot be used.`;
    }
    if (!actor || actor.hp >= actor.maxHp) {
      return 'No wounds need it.';
    }

    if (itemDef.type === 'food') {
      const healed = actor.heal(1);
      this.remove(itemId, 1);
      return `You eat ${this.displayName(itemId)}. +${healed} HP (${actor.hp}/${actor.maxHp}).`;
    }

    if (itemDef.use?.effect === 'heal') {
      const amount = Math.max(0, Math.floor(Number(itemDef.use.amount) || 0));
      if (amount <= 0) return `${this.displayName(itemId)} has no clear use.`;
      const healed = actor.heal(amount);
      this.remove(itemId, 1);
      return `You bind the wound. +${healed} HP (${actor.hp}/${actor.maxHp}).`;
    }

    return `${this.displayName(itemId)} cannot be used.`;
  }

  // Use a Field Dressing on `actor`: restores 4 HP, consumed, capped at maxHp.
  // Returns a log line describing what happened (or why it could not be used).
  useFieldDressing(actor) {
    if (!this.has('field-dressing')) return 'No field dressing in the pack.';
    return this.useItem(actor, 'field-dressing');
  }

  // Compact one-line summary for the status panel.
  summary() {
    const current = Inventory.formatWeight(this.currentWeight());
    const max = Inventory.formatWeight(this.maxCarryWeight);
    if (this.counts.size === 0 && this.instances.size === 0) return `Pack: empty (${current}/${max} kg)`;
    return `Pack: ${current}/${max} kg`;
  }

  itemIdFor(itemIdOrKey) {
    return this.instances.get(itemIdOrKey)?.itemId ?? itemIdOrKey;
  }

  isConditionItem(itemIdOrKey) {
    const itemId = this.itemIdFor(itemIdOrKey);
    const condition = this.itemDefs[itemId]?.condition;
    return Boolean(condition && Number.isFinite(condition.max) && condition.max > 0);
  }

  conditionState(entryKey) {
    const instance = this.instances.get(entryKey);
    if (!instance) return null;
    const max = this.conditionMax(instance.itemId);
    const condition = cleanCondition(instance.condition, max);
    return {
      entryKey,
      itemId: instance.itemId,
      condition,
      max,
      tier: conditionTier(condition, max)
    };
  }

  conditionMax(itemIdOrKey) {
    const itemId = this.itemIdFor(itemIdOrKey);
    const max = Math.floor(Number(this.itemDefs[itemId]?.condition?.max) || 100);
    return Math.max(1, max);
  }

  conditionDefault(itemIdOrKey) {
    const itemId = this.itemIdFor(itemIdOrKey);
    const max = this.conditionMax(itemId);
    return cleanCondition(this.itemDefs[itemId]?.condition?.default, max);
  }

  weaponClass(itemIdOrKey) {
    return this.itemDefs[this.itemIdFor(itemIdOrKey)]?.weapon?.weaponClass ?? null;
  }

  readyWeaponEntry(slotId) {
    if (!READY_WEAPON_SLOT_SET.has(slotId)) return null;
    return this.equipment.get(slotId) ?? null;
  }

  weaponSlotForEntry(entryKey) {
    for (const slotId of READY_WEAPON_SLOTS) {
      if (this.equipment.get(slotId) === entryKey) return slotId;
    }
    return null;
  }

  magazineState(entryKey) {
    const instance = this.instances.get(entryKey);
    if (!instance) return null;
    const definition = weaponMagazineDefinition(this.itemDefs[instance.itemId]);
    if (!definition) return null;
    const loaded = Math.max(0, Math.min(definition.capacity, cleanCount(instance.loaded)));
    const ammoItemId = this.ammoItemForFamily(definition.ammoFamily);
    const reserve = ammoItemId ? this.stackCount(ammoItemId) : 0;
    return {
      entryKey,
      itemId: instance.itemId,
      ammoItemId,
      ammoFamily: definition.ammoFamily,
      capacity: definition.capacity,
      loaded,
      reserve,
      reloadAp: definition.reloadAp,
      empty: loaded <= 0,
      full: loaded >= definition.capacity,
      canReload: loaded < definition.capacity && reserve > 0
    };
  }

  ammoItemForFamily(ammoFamily) {
    if (!ammoFamily) return null;
    for (const [itemId, itemDef] of Object.entries(this.itemDefs)) {
      if (itemDef?.type === 'ammo' && itemDef.ammo?.family === ammoFamily) return itemId;
    }
    return null;
  }

  reloadStateForAttack(attack) {
    return this.magazineState(attack?.weaponEntryKey);
  }

  reloadWeapon(entryKey) {
    const instance = this.instances.get(entryKey);
    const state = this.magazineState(entryKey);
    if (!instance || !state) return { ok: false, message: 'That weapon does not reload.' };
    if (state.full) return { ok: false, message: `${this.displayName(entryKey)} is already loaded.` };
    if (!state.ammoItemId || state.reserve <= 0) {
      return { ok: false, message: `No ${this.ammoFamilyLabel(state.ammoFamily)} in the pack.` };
    }
    const loaded = Math.min(state.capacity - state.loaded, state.reserve);
    if (loaded <= 0 || !this.remove(state.ammoItemId, loaded)) {
      return { ok: false, message: `No ${this.ammoFamilyLabel(state.ammoFamily)} in the pack.` };
    }
    instance.loaded = state.loaded + loaded;
    return {
      ok: true,
      entryKey,
      loaded,
      current: instance.loaded,
      capacity: state.capacity,
      reloadAp: state.reloadAp,
      message: `Reloaded ${this.displayName(entryKey)}. ${instance.loaded}/${state.capacity}.`
    };
  }

  ammoFamilyLabel(ammoFamily) {
    const itemId = this.ammoItemForFamily(ammoFamily);
    return itemId ? this.displayName(itemId) : String(ammoFamily ?? 'ammunition');
  }

  itemWeaponDetails(itemIdOrKey) {
    const itemId = this.itemIdFor(itemIdOrKey);
    const itemDef = this.itemDefs[itemId] ?? {};
    const definitions = weaponAttackDefinitions(itemDef);
    if (!definitions.length) return null;

    const magazine = weaponMagazineDefinition(itemDef);
    const ammoItemId = magazine ? this.ammoItemForFamily(magazine.ammoFamily) : null;
    const attacks = this.instances.has(itemIdOrKey)
      ? this.weaponAttacksForEntry(itemIdOrKey, this.weaponSlotForEntry(itemIdOrKey))
      : definitions;

    return {
      ammoFamily: magazine?.ammoFamily ?? null,
      ammoItemId,
      ammoName: magazine ? this.ammoFamilyLabel(magazine.ammoFamily) : '',
      magazineCapacity: magazine?.capacity ?? null,
      reloadAp: magazine?.reloadAp ?? null,
      attackModes: attacks.map((attack, index) => {
        const baseDamage = Math.max(0, Math.floor(Number(attack.baseDamage ?? attack.damage) || 0));
        const damage = Math.max(0, Math.floor(Number(attack.damage) || 0));
        return {
          id: attack.localId ?? attack.id ?? `attack-${index + 1}`,
          name: attack.name ?? `Attack ${index + 1}`,
          mode: attack.mode ?? null,
          damage,
          baseDamage,
          apCost: Math.max(0, Math.floor(Number(attack.apCost) || 0)),
          range: Math.max(0, Math.floor(Number(attack.range) || 0)),
          accuracyBonus: Number.isFinite(attack.accuracyBonus) ? Math.round(attack.accuracyBonus) : 0,
          ammoCost: magazine ? attackAmmoCost(attack) : 0,
          conditionWear: Math.max(0, attackConditionWear(attack)),
          requiresStationary: Boolean(attack.requiresStationary)
        };
      })
    };
  }

  consumeWeaponAttack(attack) {
    const entryKey = attack?.weaponEntryKey;
    const instance = this.instances.get(entryKey);
    if (!instance) return true;
    const state = this.magazineState(entryKey);
    if (!state) return true;
    const cost = attackAmmoCost(attack);
    if (state.loaded < cost) return false;
    instance.loaded = state.loaded - cost;
    return true;
  }

  repairCandidates(targetKey) {
    const target = this.instances.get(targetKey);
    const targetState = this.conditionState(targetKey);
    const targetClass = target ? this.weaponClass(target.itemId) : null;
    if (!target || !targetClass || !targetState || targetState.condition >= targetState.max) return [];
    return [...this.instances.values()]
      .filter((entry) => entry.entryKey !== targetKey && this.weaponClass(entry.itemId) === targetClass)
      .map((entry) => ({
        ...this.#entryFor(entry.entryKey, 1, { includeRepair: false }),
        exactMatch: entry.itemId === target.itemId
      }))
      .sort((a, b) => {
        if (a.exactMatch !== b.exactMatch) return a.exactMatch ? -1 : 1;
        if ((a.condition ?? 0) !== (b.condition ?? 0)) return (a.condition ?? 0) - (b.condition ?? 0);
        return a.name.localeCompare(b.name);
      });
  }

  canRepair(targetKey) {
    return this.repairCandidates(targetKey).length > 0;
  }

  repairWeapon(targetKey, donorKey, engineeringRating = 0) {
    const target = this.instances.get(targetKey);
    const donor = this.instances.get(donorKey);
    if (!target || !donor) return { ok: false, message: 'Select two weapons.' };
    if (targetKey === donorKey) return { ok: false, message: 'Select a second weapon.' };
    const targetClass = this.weaponClass(target.itemId);
    if (!targetClass || targetClass !== this.weaponClass(donor.itemId)) {
      return { ok: false, message: 'Those weapons do not match.' };
    }
    const state = this.conditionState(targetKey);
    if (!state || state.condition >= state.max) {
      return { ok: false, message: `${this.displayName(target.itemId)} is already sound.` };
    }
    const engineering = Math.max(0, Math.floor(Number(engineeringRating) || 0));
    const exactBonus = target.itemId === donor.itemId ? REPAIR_EXACT_MATCH_BONUS : 0;
    const restored = REPAIR_BASE + Math.floor(engineering / REPAIR_ENGINEERING_DIVISOR) + exactBonus;
    const before = state.condition;
    target.condition = Math.min(state.max, before + restored);
    this.#removeInstance(donorKey);
    const gained = target.condition - before;
    return {
      ok: true,
      targetKey,
      donorKey,
      restored: gained,
      message: `Repaired ${this.displayName(target.itemId)} by ${gained}.`
    };
  }

  weaponAttacks(fallbackAttacks = []) {
    const equippedAttacks = [];
    for (const slotId of WEAPON_SLOTS) {
      const entryKey = this.equipment.get(slotId);
      equippedAttacks.push(...this.weaponAttacksForEntry(entryKey, slotId));
    }

    const occupiedRoles = new Set(equippedAttacks.flatMap((attack) => attack.roles ?? []));
    const fallback = (fallbackAttacks ?? [])
      .filter((attack) => !occupiedRoles.has(attack.id))
      .map((attack) => ({ ...attack }));
    return [...fallback, ...equippedAttacks];
  }

  weaponAttack(entryKey) {
    return this.weaponAttacksForEntry(entryKey, this.weaponSlotForEntry(entryKey))[0] ?? null;
  }

  weaponAttacksForEntry(entryKey, slotId = null) {
    const instance = this.instances.get(entryKey);
    if (!instance) return [];
    const itemDef = this.itemDefs[instance.itemId] ?? {};
    const attacks = weaponAttackDefinitions(itemDef);
    if (!attacks.length) return [];
    const state = this.conditionState(entryKey);
    const multiplier = state?.tier.multiplier ?? 1;
    const magazine = this.magazineState(entryKey);
    return attacks.map((attack, index) => {
      const localId = attack.id ?? `attack-${index + 1}`;
      const baseDamage = Math.max(0, Math.floor(Number(attack.damage) || 0));
      const damage = multiplier <= 0 ? 0 : Math.max(1, Math.round(baseDamage * multiplier));
      const ammoCost = magazine ? attackAmmoCost(attack) : 0;
      return {
        ...attack,
        id: weaponRuntimeAttackId(entryKey, localId),
        localId,
        roles: weaponAttackRoles(itemDef, attack),
        damage,
        baseDamage,
        ammoCost,
        conditionWear: attackConditionWear(attack),
        weaponEntryKey: entryKey,
        weaponItemId: instance.itemId,
        weaponSlot: slotId,
        condition: state?.condition ?? null,
        conditionMax: state?.max ?? null,
        conditionTier: state?.tier.id ?? null,
        conditionLabel: state?.tier.label ?? '',
        loaded: magazine?.loaded ?? null,
        magazineCapacity: magazine?.capacity ?? null,
        ammoFamily: magazine?.ammoFamily ?? null,
        reserveAmmo: magazine?.reserve ?? null,
        reloadAp: magazine?.reloadAp ?? null,
        empty: Boolean(magazine && magazine.loaded < ammoCost),
        broken: multiplier <= 0
      };
    });
  }

  degradeWeaponAttack(attack, amount = null) {
    const entryKey = attack?.weaponEntryKey;
    const instance = this.instances.get(entryKey);
    if (!instance) return false;
    const wear = Number.isFinite(amount) ? amount : attackConditionWear(attack);
    instance.condition = Math.max(0, cleanCondition(instance.condition, this.conditionMax(instance.itemId)) - cleanCount(wear));
    return true;
  }

  #resolveEquipSlot(itemId, preferredSlot = null) {
    const itemSlot = this.equipmentSlotFor(itemId);
    if (!itemSlot) return null;
    if (itemSlot === 'weapon') {
      const preferred = LEGACY_WEAPON_SLOTS[preferredSlot] ?? preferredSlot;
      if (READY_WEAPON_SLOT_SET.has(preferred)) return preferred;
      for (const slotId of READY_WEAPON_SLOTS) {
        if (!this.equipment.get(slotId)) return slotId;
      }
      return 'weapon1';
    }
    if (itemSlot === 'ring') {
      if (preferredSlot && RING_SLOTS.has(preferredSlot)) return preferredSlot;
      for (const slotId of RING_SLOTS) {
        if (!this.equipment.get(slotId)) return slotId;
      }
      return 'ring1';
    }
    return this.equipment.has(itemSlot) ? itemSlot : null;
  }

  #slotAccepts(slotId, itemId) {
    const itemSlot = this.equipmentSlotFor(itemId);
    if (itemSlot === 'weapon') return READY_WEAPON_SLOT_SET.has(slotId);
    if (itemSlot === 'ring') return RING_SLOTS.has(slotId);
    return itemSlot === slotId;
  }

  #trimStackEquipment(itemId) {
    let allowed = this.stackCount(itemId);
    for (const slot of [...EQUIPMENT_SLOTS].reverse()) {
      if (this.equipment.get(slot.id) !== itemId) continue;
      if (allowed > 0) {
        allowed -= 1;
      } else {
        this.equipment.set(slot.id, null);
      }
    }
  }

  #entryFor(idOrKey, count, options = {}) {
    const itemId = this.itemIdFor(idOrKey);
    const instance = this.instances.get(idOrKey);
    const rarity = this.itemRarity(itemId);
    const build = this.itemBuild(itemId);
    const condition = instance ? this.conditionState(instance.entryKey) : null;
    const magazine = instance ? this.magazineState(instance.entryKey) : null;
    const weaponDetails = this.itemWeaponDetails(instance?.entryKey ?? itemId);
    return {
      id: instance?.entryKey ?? itemId,
      entryKey: instance?.entryKey ?? null,
      itemId,
      count,
      name: this.displayName(itemId),
      type: this.itemDefs[itemId]?.type ?? 'item',
      rarity: rarity.id,
      rarityLabel: rarity.label,
      rarityRank: rarity.rank,
      build: build?.id ?? null,
      buildLabel: build?.label ?? '',
      groundModel: this.itemDefs[itemId]?.groundModel ?? null,
      description: this.itemDefs[itemId]?.description ?? '',
      weight: this.itemWeight(itemId),
      totalWeight: this.weightOf(itemId, count),
      equipmentSlot: this.equipmentSlotFor(idOrKey),
      canEquip: this.canEquip(idOrKey),
      canUse: this.canUse(idOrKey),
      canRepair: instance && options.includeRepair !== false ? this.canRepair(instance.entryKey) : false,
      equippedCount: this.equippedCount(idOrKey),
      wornSlots: this.wornSlots(idOrKey),
      condition: condition?.condition ?? null,
      conditionMax: condition?.max ?? null,
      conditionTier: condition?.tier.id ?? null,
      conditionLabel: condition?.tier.label ?? '',
      loaded: magazine?.loaded ?? null,
      magazineCapacity: magazine?.capacity ?? null,
      ammoFamily: magazine?.ammoFamily ?? null,
      ammoItemId: weaponDetails?.ammoItemId ?? null,
      ammoName: weaponDetails?.ammoName ?? '',
      reserveAmmo: magazine?.reserve ?? null,
      reloadAp: magazine?.reloadAp ?? null,
      attackModes: weaponDetails?.attackModes ?? [],
      canReload: magazine?.canReload ?? false,
      emptyWeapon: magazine?.empty ?? false,
      broken: condition?.tier.id === 'broken',
      weaponClass: this.weaponClass(idOrKey)
    };
  }

  #addInstance(itemId, options = {}) {
    const max = this.conditionMax(itemId);
    const entryKey = this.#nextEntryKey(itemId, options.entryKey);
    const authoredDefault = this.conditionDefault(itemId);
    const magazine = weaponMagazineDefinition(this.itemDefs[itemId]);
    const entry = {
      entryKey,
      itemId,
      condition: cleanCondition(Number.isFinite(options.condition) ? options.condition : authoredDefault, max),
      ...(magazine ? {
        loaded: Math.max(0, Math.min(
          magazine.capacity,
          Number.isFinite(options.loaded) ? cleanCount(options.loaded) : magazine.defaultLoaded
        ))
      } : {})
    };
    this.instances.set(entryKey, entry);
    return entry;
  }

  #nextEntryKey(itemId, requested = null) {
    if (requested && !this.instances.has(requested)) return requested;
    let key = `${itemId}:${this.nextInstanceId}`;
    while (this.instances.has(key)) {
      this.nextInstanceId += 1;
      key = `${itemId}:${this.nextInstanceId}`;
    }
    this.nextInstanceId += 1;
    return key;
  }

  #removeInstance(entryKey) {
    this.instances.delete(entryKey);
    for (const [slotId, value] of this.equipment) {
      if (value === entryKey) this.equipment.set(slotId, null);
    }
  }

  #instanceKeysFor(itemId) {
    const equipped = new Set(this.equipment.values());
    return [...this.instances.values()]
      .filter((entry) => entry.itemId === itemId)
      .sort((a, b) => {
        const ae = equipped.has(a.entryKey) ? 1 : 0;
        const be = equipped.has(b.entryKey) ? 1 : 0;
        if (ae !== be) return ae - be;
        return a.entryKey.localeCompare(b.entryKey);
      })
      .map((entry) => entry.entryKey);
  }

  #equipKeyFor(itemIdOrKey, preferredSlot = null) {
    if (this.instances.has(itemIdOrKey)) return itemIdOrKey;
    if (!this.isConditionItem(itemIdOrKey)) return null;
    const targetSlot = this.#resolveEquipSlot(itemIdOrKey, preferredSlot);
    if (!targetSlot) return null;
    for (const entry of this.instances.values()) {
      if (entry.itemId !== itemIdOrKey) continue;
      if (!this.#slotAccepts(targetSlot, entry.entryKey)) continue;
      if (![...this.equipment.values()].includes(entry.entryKey)) return entry.entryKey;
    }
    return null;
  }
}
