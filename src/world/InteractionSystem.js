// Exploration interactions: looting containers and touching the corrupted
// altar. The system is intentionally small; it resolves which interactable is
// in reach, applies its data-defined effect to the inventory, and reports log
// lines plus whether the action should start combat. It does not know what a
// "reliquary" means beyond the data attached to the object.

import { Inventory } from '../core/Inventory.js';

function inReach(actor, object) {
  const dx = Math.abs(actor.x - object.x);
  const dy = Math.abs(actor.y - object.y);
  return Math.max(dx, dy) <= 1; // on the tile or any of the 8 neighbours
}

export class InteractionSystem {
  constructor(interactables) {
    // Objects with an `interact` descriptor, e.g. containers and the altar.
    this.interactables = interactables ?? [];
  }

  // The nearest unconsumed interactable on or beside the actor, if any.
  findInReach(actor) {
    let best = null;
    let bestDist = Infinity;
    for (const object of this.interactables) {
      if (object.consumed) continue;
      if (!inReach(actor, object)) continue;
      const dist = Math.abs(actor.x - object.x) + Math.abs(actor.y - object.y);
      if (dist < bestDist) {
        best = object;
        bestDist = dist;
      }
    }
    return best;
  }

  // Apply an interaction. Returns data effects for Game to present and apply.
  interact(object, inventory) {
    const descriptor = object.interact ?? {};
    const logs = [];
    let triggersCombat = false;
    const pushLog = (value) => {
      for (const line of [].concat(value ?? [])) {
        if (line) logs.push(line);
      }
    };

    if (descriptor.type === 'container') {
      const carry = inventory.canAddLoot(descriptor.loot ?? []);
      if (!carry.ok) {
        const current = Inventory.formatWeight(carry.current);
        const max = Inventory.formatWeight(inventory.maxCarryWeight);
        const over = Inventory.formatWeight(carry.overBy);
        logs.push(`Too much to carry. Pack ${current}/${max} kg.`);
        logs.push(`Need ${over} kg free.`);
        return {
          logs,
          triggersCombat,
          combatEncounter: descriptor.encounter ?? null,
          dialogueId: descriptor.dialogue ?? null,
          questUpdate: descriptor.questUpdate ?? null
        };
      }

      for (const entry of descriptor.loot ?? []) {
        inventory.add(entry.item, entry.count ?? 1);
      }
      object.consumed = true;
      object.opened = true;
      pushLog(descriptor.log);
      const summary = (descriptor.loot ?? [])
        .map((entry) => `${entry.count ?? 1}x ${inventory.displayName(entry.item)}`)
        .join(', ');
      if (summary) logs.push(`Recovered: ${summary}.`);
    } else if (descriptor.type === 'altar') {
      pushLog(descriptor.log);
      object.touched = true;
      triggersCombat = Boolean(descriptor.triggersCombat);
    } else {
      pushLog(descriptor.log);
    }

    return {
      logs,
      triggersCombat,
      combatEncounter: descriptor.encounter ?? null,
      dialogueId: descriptor.dialogue ?? null,
      questUpdate: descriptor.questUpdate ?? null
    };
  }
}
