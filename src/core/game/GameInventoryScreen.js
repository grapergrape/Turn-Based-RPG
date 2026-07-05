import { createGroundItem } from '../../world/GroundItems.js';
import { bakeHumanAppearance, bakePlayerCharacter, isHumanAppearance, spriteIdForHumanAppearance } from '../../render/SpriteAtlas.js';
import {
  inventoryActionAt,
  inventoryGearBox,
  inventoryGearAt,
  inventoryRepairActionAt,
  inventorySlotAt,
  inventorySlotBox,
  inventorySplitActionAt,
  inventorySplitAmountAt
} from '../../ui/inventoryLayout.js';
import { installGameMethods } from './installGameMethods.js';

class GameInventoryScreen {
  _handleInventoryScreen(actions, click = null) {
    this._syncInventoryOrder();
    this._clampInventorySelection();
    if (this.inventoryRepair) {
      this._handleInventoryRepair(actions, click);
      return;
    }
    if (this.inventorySplit) {
      this._handleInventorySplit(actions, click);
      return;
    }
    if (click) {
      this._handleInventoryClick(click);
      return;
    }
    for (const action of actions) {
      if (action === 'cancel' || action === 'inventory') {
        this._closeUiScreen();
        return;
      }
      if (action === 'restart') {
        this.boot();
        return;
      }
      if (action === 'debug') {
        this.debugGrid = !this.debugGrid;
        continue;
      }
      if (action === 'dressing') {
        this._log(this.inventory.useFieldDressing(this.player));
        this._syncInventoryOrder();
        this._clampInventorySelection();
        continue;
      }
      if (action === 'left' || action === 'right' || action === 'cycle') {
        this.inventoryFocus = this.inventoryFocus === 'gear' ? 'items' : 'gear';
        this.inventoryMoveIndex = null;
        this._clampInventorySelection();
        continue;
      }
      if (action === 'up' || action === 'down') {
        this.inventoryMoveIndex = null;
        this._moveInventorySelection(action === 'down' ? 1 : -1);
        continue;
      }
      if (action === 'melee' || this._isConfirmAction(action) || action === 'interact') {
        this.inventoryMoveIndex = null;
        if (this.inventoryFocus === 'gear') this._unequipSelectedGear();
        else this._equipSelectedInventoryItem();
        this._refreshPlayerAppearance();
        this._clampInventorySelection();
        continue;
      }
      if (action === 'sidearm') {
        this.inventoryMoveIndex = null;
        if (this.inventoryFocus === 'gear') this._unequipSelectedGear();
        else this._unequipSelectedInventoryItem();
        this._refreshPlayerAppearance();
        this._clampInventorySelection();
        continue;
      }
      if (action === 'choice3') {
        this.inventoryMoveIndex = null;
        this._dropSelectedInventoryItem();
        this._refreshPlayerAppearance();
        this._clampInventorySelection();
      }
    }
  }

  _handleInventoryClick(click) {
    const currentMenu = this._currentInventoryActionMenu();
    const action = inventoryActionAt(click, currentMenu);
    if (action) {
      this._handleInventoryAction(action);
      return;
    }

    if (click.button === 2) {
      this._openInventoryActionMenuAt(click);
      return;
    }

    const gearIndex = inventoryGearAt(click, this.inventory.equipmentEntries().length);
    if (gearIndex !== null) {
      this.inventoryFocus = 'gear';
      this.equipmentIndex = gearIndex;
      this.inventoryMoveIndex = null;
      this.inventoryActionMenu = null;
      this._clampInventorySelection();
      return;
    }

    const slotIndex = inventorySlotAt(click);
    if (slotIndex === null) return;
    if (click.shiftKey) {
      this._sortInventory();
      return;
    }

    const items = this._inventoryEntries();
    if (this.inventoryMoveIndex !== null) {
      this.inventoryActionMenu = null;
      this._moveInventoryOrder(this.inventoryMoveIndex, slotIndex);
      return;
    }

    const item = items[slotIndex] ?? null;
    this.inventoryFocus = 'items';
    if (!item) {
      this.inventoryMoveIndex = null;
      this.inventoryActionMenu = null;
      this._clampInventorySelection();
      return;
    }

    const wasSelected = this.inventoryIndex === slotIndex;
    this.inventoryIndex = slotIndex;
    if (click.ctrlKey) {
      this.inventoryActionMenu = null;
      this._openInventorySplit(item.id);
      return;
    }

    this.inventoryMoveIndex = wasSelected ? slotIndex : null;
    this.inventoryActionMenu = null;
    this._clampInventorySelection();
  }

  _handleInventoryAction(action) {
    if (action === 'sort') {
      this.inventoryMoveIndex = null;
      this.inventoryActionMenu = null;
      this._sortInventory();
      return;
    }
    const menu = this._currentInventoryActionMenu();
    if (!menu) {
      this._log('Right click an item first.');
      return;
    }
    this._selectInventoryActionMenuTarget(menu);
    this.inventoryMoveIndex = null;
    if (action === 'use') {
      this._useSelectedInventoryItem();
      this.inventoryActionMenu = null;
      this._clampInventorySelection();
      return;
    }
    if (action === 'equip') {
      if (menu.canUnequip) {
        if (this.inventoryFocus === 'gear') this._unequipSelectedGear();
        else this._unequipSelectedInventoryItem();
      } else {
        this._equipSelectedInventoryItem();
      }
      this._refreshPlayerAppearance();
      this._clampInventorySelection();
      return;
    }
    if (action === 'remove') {
      if (this.inventoryFocus === 'gear') this._unequipSelectedGear();
      else this._unequipSelectedInventoryItem();
      this._refreshPlayerAppearance();
      this._clampInventorySelection();
      return;
    }
    if (action === 'repair') {
      this._openSelectedInventoryRepair();
      return;
    }
    if (action === 'drop') {
      this._dropSelectedInventoryItem();
      this._refreshPlayerAppearance();
      this.inventoryActionMenu = null;
      this._clampInventorySelection();
      return;
    }
    if (action === 'split') this._openSelectedInventorySplit();
  }

  _openInventoryActionMenuAt(click) {
    const gearIndex = inventoryGearAt(click, this.inventory.equipmentEntries().length);
    if (gearIndex !== null) {
      const slot = this.inventory.equipmentEntries()[gearIndex];
      this.inventoryFocus = 'gear';
      this.equipmentIndex = gearIndex;
      this.inventoryMoveIndex = null;
      this.inventoryActionMenu = slot?.itemId
        ? { focus: 'gear', slot: slot.slot, itemId: slot.id ?? slot.itemId, anchor: inventoryGearBox(gearIndex) }
        : null;
      this._clampInventorySelection();
      return;
    }

    const slotIndex = inventorySlotAt(click);
    const item = slotIndex !== null ? this._inventoryEntries()[slotIndex] : null;
    this.inventoryFocus = 'items';
    this.inventoryMoveIndex = null;
    if (item) {
      this.inventoryIndex = slotIndex;
      this.inventoryActionMenu = { focus: 'items', itemId: item.id, anchor: inventorySlotBox(slotIndex) };
    } else {
      this.inventoryActionMenu = null;
    }
    this._clampInventorySelection();
  }

  _currentInventoryActionMenu() {
    const menu = this.inventoryActionMenu;
    if (!menu?.itemId) return null;
    if (menu.focus === 'gear') {
      const slotIndex = this.inventory.equipmentEntries().findIndex((entry) =>
        entry.slot === menu.slot && (entry.id ?? entry.itemId) === menu.itemId
      );
      if (slotIndex < 0) {
        this.inventoryActionMenu = null;
        return null;
      }
      const slot = this.inventory.equipmentEntries()[slotIndex];
      return {
        ...menu,
        slotIndex,
        anchor: inventoryGearBox(slotIndex),
        item: slot,
        canEquip: false,
        canUse: false,
        canUnequip: true,
        canRepair: this.inventory.canRepair?.(menu.itemId) ?? false,
        canSplit: false
      };
    }

    const itemIndex = this._inventoryEntries().findIndex((entry) => entry.id === menu.itemId);
    if (itemIndex < 0) {
      this.inventoryActionMenu = null;
      return null;
    }
    const item = this._inventoryEntries()[itemIndex];
    return {
      ...menu,
      itemIndex,
      anchor: inventorySlotBox(itemIndex),
      item,
      canEquip: Boolean(item.equipmentSlot),
      canUse: Boolean(item.canUse),
      canUnequip: item.equippedCount > 0,
      canRepair: Boolean(item.canRepair),
      canSplit: item.count > 1
    };
  }

  _selectInventoryActionMenuTarget(menu) {
    if (menu.focus === 'gear') {
      this.inventoryFocus = 'gear';
      this.equipmentIndex = menu.slotIndex;
      return;
    }
    this.inventoryFocus = 'items';
    this.inventoryIndex = menu.itemIndex;
  }

  _handleInventorySplit(actions, click = null) {
    const split = this._currentInventorySplit();
    if (!split) return;

    if (click) {
      const action = inventorySplitActionAt(click);
      if (action === 'cancel') {
        this.inventorySplit = null;
        return;
      }
      if (this._isConfirmAction(action)) {
        this._confirmInventorySplitDrop();
        return;
      }
      if (action === 'minus') {
        this._adjustInventorySplit(-1);
        return;
      }
      if (action === 'plus') {
        this._adjustInventorySplit(1);
        return;
      }
      if (action === 'slider') {
        const amount = inventorySplitAmountAt(click, split.max);
        if (amount !== null) this.inventorySplit.amount = amount;
      }
      return;
    }

    for (const action of actions) {
      if (action === 'cancel' || action === 'inventory') {
        this.inventorySplit = null;
        return;
      }
      if (action === 'restart') {
        this.boot();
        return;
      }
      if (action === 'debug') {
        this.debugGrid = !this.debugGrid;
        continue;
      }
      if (action === 'left' || action === 'down') {
        this._adjustInventorySplit(-1);
        continue;
      }
      if (action === 'right' || action === 'up') {
        this._adjustInventorySplit(1);
        continue;
      }
      if (this._isConfirmAction(action) || action === 'interact' || action === 'choice3') {
        this._confirmInventorySplitDrop();
        return;
      }
    }
  }

  _handleInventoryRepair(actions, click = null) {
    const repair = this._currentInventoryRepair();
    if (!repair) return;

    if (click) {
      const action = inventoryRepairActionAt(click, repair.donors.length);
      if (action === 'cancel') {
        this.inventoryRepair = null;
        return;
      }
      if (action === 'confirm') {
        this._confirmInventoryRepair();
        return;
      }
      if (typeof action === 'string' && action.startsWith('donor:')) {
        this.inventoryRepair.index = Math.max(0, Math.min(repair.donors.length - 1, Number(action.slice(6)) || 0));
      }
      return;
    }

    for (const action of actions) {
      if (action === 'cancel' || action === 'inventory') {
        this.inventoryRepair = null;
        return;
      }
      if (action === 'restart') {
        this.boot();
        return;
      }
      if (action === 'debug') {
        this.debugGrid = !this.debugGrid;
        continue;
      }
      if (action === 'up') {
        this._moveInventoryRepairSelection(-1);
        continue;
      }
      if (action === 'down') {
        this._moveInventoryRepairSelection(1);
        continue;
      }
      if (this._isConfirmAction(action) || action === 'interact') {
        this._confirmInventoryRepair();
        return;
      }
    }
  }

  _openSelectedInventorySplit() {
    if (this.inventoryFocus === 'gear') {
      const slot = this.inventory.equipmentEntries()[this.equipmentIndex];
      if (!slot || !slot.itemId) {
        this._log(slot?.empty ? `${slot.label} is empty.` : 'No gear selected.');
        return;
      }
      this._openInventorySplit(slot.itemId);
      return;
    }

    const item = this._selectedInventoryItem();
    if (!item) {
      this._log('Pack is empty.');
      return;
    }
    this._openInventorySplit(item.id);
  }

  _openInventorySplit(itemId) {
    const item = this._inventoryEntries().find((entry) => entry.id === itemId);
    if (!item) return;
    if (item.count <= 1) {
      this._log('Only one item in stack.');
      return;
    }
    this.inventorySplit = {
      itemId,
      amount: Math.min(item.count, Math.max(1, Math.ceil(item.count / 2)))
    };
    this.inventoryMoveIndex = null;
  }

  _currentInventorySplit() {
    if (!this.inventorySplit?.itemId) {
      this.inventorySplit = null;
      return null;
    }
    const item = this._inventoryEntries().find((entry) => entry.id === this.inventorySplit.itemId);
    if (!item || item.count <= 1) {
      this.inventorySplit = null;
      return null;
    }
    const max = item.count;
    const amount = Math.max(1, Math.min(max, Math.floor(Number(this.inventorySplit.amount) || 1)));
    this.inventorySplit.amount = amount;
    return { ...this.inventorySplit, amount, max, item };
  }

  _adjustInventorySplit(delta) {
    const split = this._currentInventorySplit();
    if (!split) return;
    this.inventorySplit.amount = Math.max(1, Math.min(split.max, split.amount + delta));
  }

  _confirmInventorySplitDrop() {
    const split = this._currentInventorySplit();
    if (!split) return;
    const amount = Math.max(1, Math.min(split.max, split.amount));
    if (this._dropItemFromInventory(split.itemId, { count: amount })) {
      this.inventorySplit = null;
      this._refreshPlayerAppearance();
      this._clampInventorySelection();
    }
  }

  _openSelectedInventoryRepair() {
    const item = this.inventoryFocus === 'gear'
      ? this.inventory.equipmentEntries()[this.equipmentIndex]
      : this._selectedInventoryItem();
    const key = item?.id ?? item?.entryKey ?? item?.itemId;
    this._openInventoryRepair(key);
  }

  _openInventoryRepair(itemKey) {
    const donors = this.inventory.repairCandidates?.(itemKey) ?? [];
    if (!donors.length) {
      this._log('No matching weapon for repair.');
      return;
    }
    this.inventoryRepair = { targetKey: itemKey, index: 0 };
    this.inventoryActionMenu = null;
    this.inventoryMoveIndex = null;
  }

  _currentInventoryRepair() {
    if (!this.inventoryRepair?.targetKey) {
      this.inventoryRepair = null;
      return null;
    }
    const target = this._entryForKey(this.inventoryRepair.targetKey);
    const donors = this.inventory.repairCandidates?.(this.inventoryRepair.targetKey) ?? [];
    if (!target || !donors.length) {
      this.inventoryRepair = null;
      return null;
    }
    const index = Math.max(0, Math.min(donors.length - 1, Math.floor(Number(this.inventoryRepair.index) || 0)));
    this.inventoryRepair.index = index;
    return { ...this.inventoryRepair, target, donors, index };
  }

  _moveInventoryRepairSelection(delta) {
    const repair = this._currentInventoryRepair();
    if (!repair) return;
    this.inventoryRepair.index = Math.max(0, Math.min(repair.donors.length - 1, repair.index + delta));
  }

  _confirmInventoryRepair() {
    const repair = this._currentInventoryRepair();
    if (!repair) return;
    const donor = repair.donors[repair.index];
    const result = this.inventory.repairWeapon(
      repair.targetKey,
      donor.entryKey ?? donor.id,
      this._fieldRating?.('engineering') ?? 0
    );
    this._log(result.message);
    this._refreshPlayerAttacks?.();
    this._syncInventoryOrder();
    this._clampInventorySelection();
    this.inventoryRepair = result.ok && this.inventory.canRepair?.(repair.targetKey)
      ? { targetKey: repair.targetKey, index: 0 }
      : null;
  }

  _inventoryEntries() {
    const entries = this.inventory?.entries() ?? [];
    this._syncInventoryOrder(entries);
    const byId = new Map(entries.map((entry) => [entry.id, entry]));
    return (this.inventoryOrder ?? []).map((id) => byId.get(id)).filter(Boolean);
  }

  _selectedInventoryItem() {
    return this._inventoryEntries()[this.inventoryIndex] ?? null;
  }

  _entryForKey(key) {
    return this._inventoryEntries().find((entry) => entry.id === key)
      ?? this.inventory.equipmentEntries().find((entry) => (entry.id ?? entry.itemId) === key)
      ?? null;
  }

  _inventoryFingerprint() {
    return (this.inventory?.entries() ?? [])
      .map((entry) => `${entry.id}:${entry.count}:${entry.condition ?? ''}`)
      .sort()
      .join('|');
  }

  _syncInventoryOrder(entries = null) {
    const current = entries ?? this.inventory?.entries() ?? [];
    const present = new Set(current.map((entry) => entry.id));
    const next = [];
    for (const itemId of this.inventoryOrder ?? []) {
      if (present.has(itemId) && !next.includes(itemId)) next.push(itemId);
    }
    for (const entry of current) {
      if (!next.includes(entry.id)) next.push(entry.id);
    }
    this.inventoryOrder = next;
    if (this.inventoryMoveIndex !== null && this.inventoryMoveIndex >= next.length) {
      this.inventoryMoveIndex = null;
    }
  }

  _sortInventory() {
    const rank = {
      currency: 0,
      consumable: 1,
      ammo: 2,
      weapon: 2,
      tool: 3,
      key: 3,
      quest: 4,
      evidence: 4,
      clothes: 5,
      armor: 5,
      boots: 5,
      helmet: 5,
      ring: 5,
      trinket: 5,
      salvage: 6,
      contraband: 7
    };
    this.inventoryOrder = this.inventory.entries()
      .sort((a, b) => {
        const ar = rank[a.type] ?? 9;
        const br = rank[b.type] ?? 9;
        if (ar !== br) return ar - br;
        return a.name.localeCompare(b.name);
      })
      .map((entry) => entry.id);
    this.inventoryMoveIndex = null;
    this._clampInventorySelection();
    this._log('Pack sorted.');
  }

  _moveInventoryOrder(fromIndex, targetIndex) {
    this._syncInventoryOrder();
    const order = [...(this.inventoryOrder ?? [])];
    if (fromIndex < 0 || fromIndex >= order.length) {
      this.inventoryMoveIndex = null;
      return;
    }
    const [itemId] = order.splice(fromIndex, 1);
    const insertAt = Math.max(0, Math.min(targetIndex, order.length));
    order.splice(insertAt, 0, itemId);
    this.inventoryOrder = order;
    this.inventoryFocus = 'items';
    this.inventoryIndex = insertAt;
    this.inventoryMoveIndex = null;
    this._clampInventorySelection();
  }

  _moveInventorySelection(delta) {
    if (this.inventoryFocus === 'gear') {
      const slots = this.inventory.equipmentEntries();
      this.equipmentIndex = Math.max(0, Math.min(slots.length - 1, this.equipmentIndex + delta));
      return;
    }
    const items = this._inventoryEntries();
    this.inventoryIndex = Math.max(0, Math.min(items.length - 1, this.inventoryIndex + delta));
  }

  _equipSelectedInventoryItem() {
    const item = this._selectedInventoryItem();
    if (!item) {
      this._log('Pack is empty.');
      return;
    }
    if (item.canUse && !item.equipmentSlot) {
      this._useSelectedInventoryItem();
      return;
    }
    const result = this.inventory.equip(item.id);
    this._log(result.message);
    this._refreshPlayerAttacks?.();
  }

  _useSelectedInventoryItem() {
    const item = this._selectedInventoryItem();
    if (!item) {
      this._log('Pack is empty.');
      return;
    }
    this._log(this.inventory.useItem(this.player, item.id));
    this._syncInventoryOrder();
    this._clampInventorySelection();
  }

  _unequipSelectedInventoryItem() {
    const item = this._selectedInventoryItem();
    if (!item) {
      this._log('Pack is empty.');
      return;
    }
    const slot = this.inventory.equipmentEntries().find((entry) => (entry.id ?? entry.itemId) === item.id);
    if (!slot) {
      this._log('That item is not equipped.');
      return;
    }
    this._log(this.inventory.unequip(slot.slot).message);
    this._refreshPlayerAttacks?.();
  }

  _unequipSelectedGear() {
    const slot = this.inventory.equipmentEntries()[this.equipmentIndex];
    if (!slot) return;
    this._log(this.inventory.unequip(slot.slot).message);
    this._refreshPlayerAttacks?.();
  }

  _dropSelectedInventoryItem() {
    if (this.inventoryFocus === 'gear') {
      const slot = this.inventory.equipmentEntries()[this.equipmentIndex];
      if (!slot || !slot.itemId) {
        this._log(slot?.empty ? `${slot.label} is empty.` : 'No gear selected.');
        return;
      }
      this._dropItemFromInventory(slot.id ?? slot.itemId, { slot: slot.slot });
      return;
    }

    const item = this._selectedInventoryItem();
    if (!item) {
      this._log('Pack is empty.');
      return;
    }
    this._dropItemFromInventory(item.id);
  }

  _dropItemFromInventory(itemKey, options = {}) {
    const itemId = this.inventory.itemIdFor?.(itemKey) ?? itemKey;
    const itemDef = this.inventory.itemDefs[itemId] ?? {};
    const name = this.inventory.displayName(itemKey);
    const amount = options.slot ? 1 : Math.max(1, Math.floor(Number(options.count) || 1));
    const condition = this.inventory.conditionState?.(itemKey)?.condition ?? null;
    const count = Math.min(amount, this.inventory.count(itemKey));
    if (options.slot) {
      const result = this.inventory.unequip(options.slot);
      if (!result.ok) {
        this._log(result.message);
        return false;
      }
    }
    if (count <= 0 || !this.inventory.remove(itemKey, count)) {
      this._log(`${name} is not in the pack.`);
      return false;
    }

    this.groundItemSeq += 1;
    const groundItem = createGroundItem({
      id: `${this.level?.id ?? 'level'}-drop-${this.groundItemSeq}`,
      itemId,
      itemDef,
      count,
      condition,
      x: this.player.x,
      y: this.player.y,
      tick: this.anim.tick,
      source: 'player'
    });
    if (!groundItem) {
      this.inventory.add(itemId, count, { ignoreCapacity: true, condition });
      this._log(`Could not drop ${name}.`);
      return false;
    }

    this.groundItems.push(groundItem);
    this._syncInventoryOrder();
    this._refreshPlayerAttacks?.();
    this._log(count === 1 ? `Dropped: ${name}.` : `Dropped: ${count}x ${name}.`);
    return true;
  }

  _refreshActorAppearances(actors) {
    if (!this.atlas) return;
    for (const actor of actors ?? []) {
      if (!isHumanAppearance(actor?.appearance)) continue;
      const spriteId = spriteIdForHumanAppearance(actor.appearance);
      actor.spriteId = spriteId;
      if (!this.atlas[spriteId]) this.atlas[spriteId] = bakeHumanAppearance(actor.appearance);
    }
  }

  // Re-bake the player sprite from the current equipment and appearance. The
  // atlas entry is replaced in place so the world renderer and paper doll match.
  _refreshPlayerAppearance() {
    if (!this.atlas || this.player?.spriteId !== 'mara-vey') return;
    this.atlas[this.player.spriteId] = bakePlayerCharacter(
      this.inventory.equipmentSnapshot(),
      this.inventory.itemDefs,
      this.player.appearance ?? null
    );
  }
}

export function installGameInventoryScreen(GameClass) {
  installGameMethods(GameClass, GameInventoryScreen);
}
