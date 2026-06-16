// Simple inventory: item-id -> count, plus the item definitions needed for
// display and use. Kept as an explicit module rather than scattered globals.

export class Inventory {
  constructor(itemDefs = {}) {
    this.itemDefs = itemDefs;
    this.counts = new Map();
  }

  add(itemId, count = 1) {
    this.counts.set(itemId, (this.counts.get(itemId) ?? 0) + count);
  }

  count(itemId) {
    return this.counts.get(itemId) ?? 0;
  }

  has(itemId) {
    return this.count(itemId) > 0;
  }

  remove(itemId, count = 1) {
    const next = Math.max(0, this.count(itemId) - count);
    if (next === 0) this.counts.delete(itemId);
    else this.counts.set(itemId, next);
  }

  displayName(itemId) {
    return this.itemDefs[itemId]?.name ?? itemId;
  }

  entries() {
    return [...this.counts.entries()].map(([id, count]) => ({
      id,
      count,
      name: this.displayName(id),
      type: this.itemDefs[id]?.type ?? 'item',
      description: this.itemDefs[id]?.description ?? ''
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
    if (this.counts.size === 0) return 'Pack: empty';
    const parts = [];
    for (const [id, count] of this.counts) {
      parts.push(`${count}x ${this.displayName(id)}`);
    }
    return `Pack: ${parts.join(', ')}`;
  }
}
