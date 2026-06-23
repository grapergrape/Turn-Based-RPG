import { syncObjectPassability } from '../world/DoorSystem.js';
import { SUSPICION_SEVERITY } from '../world/PerceptionSystem.js';

export function enemyHasLoot(enemy) {
  return Array.isArray(enemy?.loot) && enemy.loot.length > 0;
}

export function enemyHasUnclaimedLoot(enemy) {
  return enemyHasLoot(enemy) && !enemy.lootClaimed;
}

export class LootSession {
  constructor(game, callbacks = {}) {
    this.game = game;
    this.callbacks = callbacks;
  }

  objectShouldOpen(object) {
    const descriptor = object?.interact ?? {};
    if (descriptor.type !== 'container' && descriptor.type !== 'corpse') return false;
    if (descriptor.type === 'container' && descriptor.requiresItem && !this.game.inventory.has(descriptor.requiresItem)) {
      return false;
    }
    if (descriptor.type === 'container' && object.consumed) return false;
    if (descriptor.type === 'corpse' && object.looted) return false;
    return this.sourceHasItems({ sourceType: 'object', source: object });
  }

  objectShouldShowTextBeforeLoot(object) {
    if (!this.objectShouldOpen(object)) return false;
    const descriptor = object?.interact ?? {};
    return Boolean(descriptor.dialogue || [].concat(descriptor.log ?? []).some(Boolean));
  }

  openObjectTextBeforeLoot(object) {
    const descriptor = object?.interact ?? {};
    const logLines = [].concat(descriptor.log ?? []).filter(Boolean);
    for (const line of logLines) this.callbacks.log?.(line);

    this.game.pendingLootAfterDialogue = { sourceType: 'object', source: object };
    if (descriptor.dialogue) {
      this.callbacks.openDialogueById?.(descriptor.dialogue);
      if (this.game.uiScreen === 'dialogue') return true;
    }
    if (logLines.length) {
      this.callbacks.openDialogue?.(
        this.callbacks.objectName?.(object) ?? object?.name ?? 'Inspect',
        logLines,
        descriptor.type ?? 'inspect'
      );
      if (this.game.uiScreen === 'dialogue') return true;
    }
    this.game.pendingLootAfterDialogue = null;
    return false;
  }

  openObjectLootScreen(object, { log = true } = {}) {
    const descriptor = object?.interact ?? {};
    if (log) {
      for (const line of [].concat(descriptor.log ?? []).filter(Boolean)) this.callbacks.log?.(line);
    }
    if (descriptor.type === 'container') {
      this.callbacks.registerSuspiciousAction?.(SUSPICION_SEVERITY.LOW, 'opening-container');
    } else if (descriptor.type === 'corpse') {
      this.callbacks.registerSuspiciousAction?.(SUSPICION_SEVERITY.LOW, 'looting');
    }
    if (this.game.mode !== 'explore') return;
    this.open({
      title: this.callbacks.objectName?.(object) ?? object?.name ?? 'Loot',
      sourceType: 'object',
      source: object
    });
  }

  open({ title, sourceType, source }) {
    this.game.uiScreen = 'loot';
    this.game.dialogue = null;
    this.game.pendingLootAfterDialogue = null;
    this.game.inventoryActionMenu = null;
    this.game.inventorySplit = null;
    this.game.loot = {
      title: title ?? 'Loot',
      sourceType,
      source
    };
    this.game.lootIndex = 0;
  }

  sourceHasItems(loot) {
    return this.entriesForSource(loot).some((entry) => entry.count > 0);
  }

  entriesForSource(loot = this.game.loot) {
    if (!loot?.source) return [];
    if (loot.sourceType === 'enemy') return Array.isArray(loot.source.loot) && !loot.source.lootClaimed ? loot.source.loot : [];
    const descriptor = loot.source.interact ?? {};
    if (loot.sourceType === 'object') {
      if (descriptor.type === 'container' && loot.source.consumed) return [];
      if (descriptor.type === 'corpse' && loot.source.looted) return [];
      return Array.isArray(descriptor.loot) ? descriptor.loot : [];
    }
    return [];
  }

  currentEntries() {
    return this.entriesForSource()
      .map((entry, rawIndex) => {
        const itemId = entry.item;
        const count = Math.max(0, Math.floor(Number(entry.count ?? 1) || 0));
        if (!itemId || count <= 0) return null;
        const itemDef = this.game.inventory.itemDefs[itemId] ?? {};
        return {
          rawIndex,
          id: itemId,
          itemId,
          count,
          name: this.game.inventory.displayName(itemId),
          type: itemDef.type ?? 'item',
          groundModel: itemDef.groundModel ?? null,
          description: itemDef.description ?? '',
          weight: this.game.inventory.itemWeight(itemId),
          totalWeight: this.game.inventory.weightOf(itemId, count),
          canEquip: Boolean(itemDef.equipment?.slot),
          equipmentSlot: itemDef.equipment?.slot ?? null
        };
      })
      .filter(Boolean);
  }

  takeMarked() {
    const entries = this.currentEntries();
    const entry = entries[this.game.lootIndex ?? 0];
    if (!entry) {
      this.finalizeIfEmpty();
      return;
    }
    this.takeEntry(entry.rawIndex, entry.count);
  }

  takeAll() {
    const entries = this.currentEntries();
    if (!entries.length) {
      this.finalizeIfEmpty();
      return;
    }
    const carry = this.game.inventory.canAddLoot(entries.map((entry) => ({ item: entry.itemId, count: entry.count })));
    if (!carry.ok) {
      this.callbacks.logCarryFailure?.(carry);
      return;
    }
    const summary = entries.map((entry) => `${entry.count}x ${entry.name}`).join(', ');
    for (const entry of entries) {
      this.game.inventory.add(entry.itemId, entry.count);
      this.setEntryCount(entry.rawIndex, 0);
    }
    this.callbacks.syncInventoryOrder?.();
    if (summary) this.callbacks.log?.(`Recovered: ${summary}.`);
    this.callbacks.registerSuspiciousAction?.(SUSPICION_SEVERITY.LOW, 'looting');
    if (this.game.mode !== 'explore') return;
    this.finalizeIfEmpty();
  }

  takeEntry(rawIndex, count) {
    const rawEntries = this.entriesForSource();
    const raw = rawEntries[rawIndex];
    if (!raw?.item) return false;
    const amount = Math.max(1, Math.min(Math.floor(Number(count) || 1), Math.floor(Number(raw.count ?? 1) || 1)));
    const carry = this.game.inventory.canAdd(raw.item, amount);
    if (!carry.ok) {
      this.callbacks.logCarryFailure?.(carry);
      return false;
    }
    const result = this.game.inventory.add(raw.item, amount);
    if (!result.ok) {
      this.callbacks.log?.(`No room for ${this.game.inventory.displayName(raw.item)}.`);
      return false;
    }
    this.setEntryCount(rawIndex, Math.max(0, (raw.count ?? 1) - amount));
    this.callbacks.syncInventoryOrder?.();
    this.callbacks.log?.(`Recovered: ${amount}x ${this.game.inventory.displayName(raw.item)}.`);
    this.callbacks.registerSuspiciousAction?.(SUSPICION_SEVERITY.LOW, 'looting');
    if (this.game.mode !== 'explore') return true;
    this.finalizeIfEmpty();
    return true;
  }

  setEntryCount(rawIndex, count) {
    const rawEntries = this.entriesForSource();
    const raw = rawEntries[rawIndex];
    if (!raw) return;
    raw.count = Math.max(0, Math.floor(Number(count) || 0));
  }

  finalizeIfEmpty() {
    if (!this.game.loot) return false;
    const entries = this.currentEntries();
    if (entries.length) {
      this.game.lootIndex = Math.max(0, Math.min(entries.length - 1, this.game.lootIndex ?? 0));
      return false;
    }

    const { sourceType, source } = this.game.loot;
    this.game.loot = null;
    this.game.lootIndex = 0;
    this.game.uiScreen = null;

    if (sourceType === 'enemy' && source) {
      source.lootClaimed = true;
      if (source.inspect) this.callbacks.openDialogueById?.(source.inspect);
      return true;
    }
    if (sourceType === 'object' && source) {
      const descriptor = source.interact ?? {};
      source.opened = true;
      if (descriptor.type === 'container') {
        source.consumed = true;
        syncObjectPassability(source, this.game.grid);
      } else if (descriptor.type === 'corpse') {
        source.looted = true;
      }
      if (descriptor.questUpdate) this.callbacks.applyQuestUpdate?.(descriptor.questUpdate);
      if (descriptor.dialogue && !source.dialogueShownBeforeLoot) this.callbacks.openDialogueById?.(descriptor.dialogue);
      return true;
    }
    return true;
  }
}
