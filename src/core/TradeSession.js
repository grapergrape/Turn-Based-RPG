export class TradeSession {
  constructor(game, callbacks = {}) {
    this.game = game;
    this.callbacks = callbacks;
  }

  open(targetId) {
    const trader = this.findActor(targetId);
    if (!trader?.trade) {
      this.callbacks.log?.('No trade stock.');
      return false;
    }

    this.game.uiScreen = 'trade';
    this.game.dialogue = null;
    this.game.pendingLootAfterDialogue = null;
    this.game.inventoryActionMenu = null;
    this.game.inventorySplit = null;
    this.game.loot = null;
    this.game.trade = { trader };
    this.game.tradeFocus = 'trader';
    this.game.tradeStockIndex = 0;
    this.game.tradePlayerIndex = 0;
    this.clampSelection();
    return true;
  }

  findActor(targetId) {
    const id = typeof targetId === 'string'
      ? targetId
      : targetId?.actor ?? targetId?.id ?? targetId?.spawnId;
    if (!id) return null;
    return [...(this.game.npcs ?? []), ...(this.game.enemies ?? [])].find((actor) =>
      actor.id === id || actor.spawnId === id
    ) ?? null;
  }

  stockEntries() {
    const stock = this.game.trade?.trader?.trade?.stock ?? [];
    const currency = this.currency();
    const ducats = this.game.inventory.count(currency);
    return stock
      .map((entry, rawIndex) => {
        const itemId = entry?.item;
        if (!itemId) return null;
        const count = Math.max(0, Math.floor(Number(entry.count ?? 1) || 0));
        const price = Math.max(0, Math.floor(Number(entry.price) || 0));
        const carry = this.game.inventory.canAdd(itemId, 1);
        const canAfford = ducats >= price;
        const itemDef = this.game.inventory.itemDefs[itemId] ?? {};
        return {
          rawIndex,
          id: itemId,
          itemId,
          count,
          price,
          affordable: count > 0 && canAfford && carry.ok,
          buyHint: count <= 0
            ? 'SOLD OUT'
            : (!canAfford ? `NEED ${price} DUCATS` : (!carry.ok ? 'PACK TOO HEAVY' : 'E BUY: TAKE 1')),
          name: this.game.inventory.displayName(itemId),
          type: itemDef.type ?? 'item',
          groundModel: itemDef.groundModel ?? null,
          description: itemDef.description ?? '',
          weight: this.game.inventory.itemWeight(itemId),
          totalWeight: this.game.inventory.weightOf(itemId, Math.max(1, count)),
          canEquip: Boolean(itemDef.equipment?.slot),
          equipmentSlot: itemDef.equipment?.slot ?? null,
          canUse: this.game.inventory.canUse(itemId)
        };
      })
      .filter(Boolean);
  }

  playerEntries() {
    return this.callbacks.inventoryEntries?.() ?? [];
  }

  currency() {
    return this.game.trade?.trader?.trade?.currency ?? 'ducat';
  }

  clampSelection() {
    const stockEntries = this.stockEntries();
    const playerEntries = this.playerEntries();
    this.game.tradeStockIndex = stockEntries.length
      ? Math.max(0, Math.min(stockEntries.length - 1, this.game.tradeStockIndex ?? 0))
      : 0;
    this.game.tradePlayerIndex = playerEntries.length
      ? Math.max(0, Math.min(playerEntries.length - 1, this.game.tradePlayerIndex ?? 0))
      : 0;
    if (this.game.tradeFocus !== 'player') this.game.tradeFocus = 'trader';
  }

  moveSelection(delta) {
    const entries = this.game.tradeFocus === 'player'
      ? this.playerEntries()
      : this.stockEntries();
    if (!entries.length) return;
    if (this.game.tradeFocus === 'player') {
      this.game.tradePlayerIndex = Math.max(0, Math.min(entries.length - 1, (this.game.tradePlayerIndex ?? 0) + delta));
    } else {
      this.game.tradeStockIndex = Math.max(0, Math.min(entries.length - 1, (this.game.tradeStockIndex ?? 0) + delta));
    }
  }

  buyStatus(entry) {
    if (!entry) return { ok: false, hint: 'NO STOCK' };
    if (entry.count <= 0) return { ok: false, hint: 'SOLD OUT' };
    const currency = this.currency();
    if (this.game.inventory.count(currency) < entry.price) {
      return { ok: false, hint: `NEED ${entry.price} DUCATS` };
    }
    const carry = this.game.inventory.canAdd(entry.itemId, 1);
    if (!carry.ok) return { ok: false, hint: 'PACK TOO HEAVY', carry };
    return { ok: true, hint: 'E BUY: TAKE 1' };
  }

  buySelectedItem() {
    const entry = this.stockEntries()[this.game.tradeStockIndex ?? 0];
    const status = this.buyStatus(entry);
    if (!status.ok) {
      if (status.carry) this.callbacks.logCarryFailure?.(status.carry);
      else this.callbacks.log?.(status.hint);
      return false;
    }

    const currency = this.currency();
    if (entry.price > 0 && !this.game.inventory.remove(currency, entry.price)) {
      this.callbacks.log?.(`Need ${entry.price} ducats.`);
      return false;
    }

    const result = this.game.inventory.add(entry.itemId, 1);
    if (!result.ok) {
      if (entry.price > 0) this.game.inventory.add(currency, entry.price, { ignoreCapacity: true });
      this.callbacks.logCarryFailure?.(result);
      return false;
    }

    const raw = this.game.trade?.trader?.trade?.stock?.[entry.rawIndex];
    if (raw) raw.count = Math.max(0, Math.floor(Number(raw.count ?? 1) || 0) - 1);
    this.callbacks.syncInventoryOrder?.();
    this.clampSelection();
    this.callbacks.log?.(`Bought: ${entry.name} for ${entry.price} ducats.`);
    return true;
  }

  buildUi() {
    const stockEntries = this.stockEntries();
    const playerEntries = this.playerEntries();
    const selected = stockEntries[this.game.tradeStockIndex ?? 0] ?? null;
    const status = this.buyStatus(selected);
    return {
      title: this.game.trade?.trader?.trade?.title ?? 'Trade',
      traderName: this.game.trade?.trader?.name ?? 'Trader',
      traderItems: stockEntries,
      playerItems: playerEntries,
      stockIndex: this.game.tradeStockIndex ?? 0,
      playerIndex: this.game.tradePlayerIndex ?? 0,
      focus: this.game.tradeFocus ?? 'trader',
      ducats: this.game.inventory.count(this.currency()),
      canBuy: status.ok,
      buyHint: status.hint
    };
  }
}
