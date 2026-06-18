// Inventory state: item-id -> count, carry weight, and a fixed paper-doll
// equipment map. Item definitions remain data-driven.

export const EQUIPMENT_SLOTS = [
  { id: 'clothes', label: 'Clothes' },
  { id: 'armor', label: 'Armor' },
  { id: 'boots', label: 'Boots' },
  { id: 'helmet', label: 'Helmet' },
  { id: 'trinket', label: 'Trinket' },
  { id: 'ring1', label: 'Ring 1' },
  { id: 'ring2', label: 'Ring 2' }
];

const DEFAULT_MAX_CARRY_WEIGHT = 10;
const RING_SLOTS = new Set(['ring1', 'ring2']);

function cleanCount(count) {
  return Math.max(0, Math.floor(Number(count) || 0));
}

export class Inventory {
  static formatWeight(value) {
    const rounded = Math.round((Number(value) || 0) * 10) / 10;
    return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
  }

  constructor(itemDefs = {}, options = {}) {
    this.itemDefs = itemDefs;
    this.counts = new Map();
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

    this.counts.set(itemId, this.count(itemId) + amount);
    return { ...result, ok: true };
  }

  count(itemId) {
    return this.counts.get(itemId) ?? 0;
  }

  has(itemId) {
    return this.count(itemId) > 0;
  }

  remove(itemId, count = 1) {
    const amount = cleanCount(count);
    if (!itemId || amount <= 0 || !this.has(itemId)) return false;

    const next = Math.max(0, this.count(itemId) - amount);
    if (next === 0) this.counts.delete(itemId);
    else this.counts.set(itemId, next);
    this.#trimEquipment(itemId);
    return true;
  }

  displayName(itemId) {
    return this.itemDefs[itemId]?.name ?? itemId;
  }

  itemWeight(itemId) {
    const value = this.itemDefs[itemId]?.weight;
    return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, value) : 0;
  }

  weightOf(itemId, count = 1) {
    return this.itemWeight(itemId) * cleanCount(count);
  }

  currentWeight() {
    let total = 0;
    for (const [itemId, count] of this.counts) {
      total += this.weightOf(itemId, count);
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
    return this.itemDefs[itemId]?.equipment?.slot ?? null;
  }

  canEquip(itemId) {
    const slot = this.equipmentSlotFor(itemId);
    return this.has(itemId) && Boolean(slot);
  }

  equip(itemId, preferredSlot = null) {
    if (!this.has(itemId)) {
      return { ok: false, message: `${this.displayName(itemId)} is not in the pack.` };
    }

    const targetSlot = this.#resolveEquipSlot(itemId, preferredSlot);
    if (!targetSlot) {
      return { ok: false, message: `${this.displayName(itemId)} cannot be worn.` };
    }

    if (this.equipment.get(targetSlot) === itemId) {
      return { ok: true, message: `${this.displayName(itemId)} is already worn.` };
    }

    if (this.equippedCount(itemId) >= this.count(itemId)) {
      return { ok: false, message: `No spare ${this.displayName(itemId)} to wear.` };
    }

    this.equipment.set(targetSlot, itemId);
    return {
      ok: true,
      message: `Equipped ${this.displayName(itemId)}: ${this.slotLabel(targetSlot)}.`
    };
  }

  unequip(slotId) {
    if (!this.equipment.has(slotId)) {
      return { ok: false, message: 'No such gear slot.' };
    }
    const itemId = this.equipment.get(slotId);
    if (!itemId) return { ok: false, message: `${this.slotLabel(slotId)} is empty.` };
    this.equipment.set(slotId, null);
    return { ok: true, message: `Removed ${this.displayName(itemId)}.` };
  }

  loadEquipment(equipment = {}) {
    for (const slot of EQUIPMENT_SLOTS) {
      const itemId = equipment[slot.id];
      if (!itemId || !this.has(itemId) || !this.#slotAccepts(slot.id, itemId)) continue;
      if (this.equippedCount(itemId) >= this.count(itemId)) continue;
      this.equipment.set(slot.id, itemId);
    }
  }

  equipmentSnapshot() {
    const snapshot = {};
    for (const [slotId, itemId] of this.equipment) {
      if (itemId) snapshot[slotId] = itemId;
    }
    return snapshot;
  }

  equipmentEntries() {
    return EQUIPMENT_SLOTS.map((slot) => {
      const itemId = this.equipment.get(slot.id);
      return {
        slot: slot.id,
        label: slot.label,
        itemId,
        name: itemId ? this.displayName(itemId) : 'Empty',
        type: itemId ? this.itemDefs[itemId]?.type ?? 'item' : '',
        description: itemId ? this.itemDefs[itemId]?.description ?? '' : '',
        weight: itemId ? this.itemWeight(itemId) : 0,
        equipmentSlot: itemId ? this.equipmentSlotFor(itemId) : null,
        empty: !itemId
      };
    });
  }

  slotLabel(slotId) {
    return EQUIPMENT_SLOTS.find((slot) => slot.id === slotId)?.label ?? slotId;
  }

  equippedCount(itemId) {
    let count = 0;
    for (const value of this.equipment.values()) {
      if (value === itemId) count += 1;
    }
    return count;
  }

  wornSlots(itemId) {
    return EQUIPMENT_SLOTS
      .filter((slot) => this.equipment.get(slot.id) === itemId)
      .map((slot) => slot.label);
  }

  isEquipped(itemId) {
    return this.equippedCount(itemId) > 0;
  }

  entries() {
    return [...this.counts.entries()].map(([id, count]) => ({
      id,
      count,
      name: this.displayName(id),
      type: this.itemDefs[id]?.type ?? 'item',
      description: this.itemDefs[id]?.description ?? '',
      weight: this.itemWeight(id),
      totalWeight: this.weightOf(id, count),
      equipmentSlot: this.equipmentSlotFor(id),
      canEquip: this.canEquip(id),
      equippedCount: this.equippedCount(id),
      wornSlots: this.wornSlots(id)
    }));
  }

  // Use a Field Dressing on `actor`: restores 4 HP, consumed, capped at maxHp.
  // Returns a log line describing what happened (or why it could not be used).
  useFieldDressing(actor) {
    if (!this.has('field-dressing')) {
      return 'No field dressing in the pack.';
    }
    if (actor.hp >= actor.maxHp) {
      return 'No wounds to dress.';
    }
    const healed = actor.heal(4);
    this.remove('field-dressing', 1);
    return `You bind the wound. +${healed} HP (${actor.hp}/${actor.maxHp}).`;
  }

  // Compact one-line summary for the status panel.
  summary() {
    const current = Inventory.formatWeight(this.currentWeight());
    const max = Inventory.formatWeight(this.maxCarryWeight);
    if (this.counts.size === 0) return `Pack: empty (${current}/${max} kg)`;
    return `Pack: ${current}/${max} kg`;
  }

  #resolveEquipSlot(itemId, preferredSlot = null) {
    const itemSlot = this.equipmentSlotFor(itemId);
    if (!itemSlot) return null;
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
    if (itemSlot === 'ring') return RING_SLOTS.has(slotId);
    return itemSlot === slotId;
  }

  #trimEquipment(itemId) {
    let allowed = this.count(itemId);
    for (const slot of [...EQUIPMENT_SLOTS].reverse()) {
      if (this.equipment.get(slot.id) !== itemId) continue;
      if (allowed > 0) {
        allowed -= 1;
      } else {
        this.equipment.set(slot.id, null);
      }
    }
  }
}
