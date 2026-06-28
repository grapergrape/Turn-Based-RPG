export class TradeSession {
  constructor(state, callbacks = {}) {
    this.state = state;
    this.callbacks = callbacks;
  }

  open(targetId) {
    const trader = this.findActor(targetId);
    if (!trader?.trade) {
      this.callbacks.log?.('No trade stock.');
      return false;
    }

    this.state.uiScreen = 'trade';
    this.state.dialogue = null;
    this.state.pendingLootAfterDialogue = null;
    this.state.inventoryActionMenu = null;
    this.state.inventorySplit = null;
    this.state.loot = null;
    this.state.trade = { trader };
    this.state.tradeFocus = 'trader';
    this.state.tradeStockIndex = 0;
    this.state.tradePlayerIndex = 0;
    this.clampSelection();
    return true;
  }

  findActor(targetId) {
    const id = typeof targetId === 'string'
      ? targetId
      : targetId?.actor ?? targetId?.id ?? targetId?.spawnId;
    if (!id) return null;
    return [...(this.state.npcs ?? []), ...(this.state.enemies ?? [])].find((actor) =>
      actor.id === id || actor.spawnId === id
    ) ?? null;
  }

  stockEntries() {
    const stock = this.state.trade?.trader?.trade?.stock ?? [];
    const currency = this.currency();
    const ducats = this.state.inventory.count(currency);
    return stock
      .map((entry, rawIndex) => {
        const itemId = entry?.item;
        if (!itemId) return null;
        const count = Math.max(0, Math.floor(Number(entry.count ?? 1) || 0));
        const price = Math.max(0, Math.floor(Number(entry.price) || 0));
        const carry = this.state.inventory.canAdd(itemId, 1);
        const canAfford = ducats >= price;
        const itemDef = this.state.inventory.itemDefs[itemId] ?? {};
        const rarity = this.state.inventory.itemRarity(itemId);
        const build = this.state.inventory.itemBuild(itemId);
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
          name: this.state.inventory.displayName(itemId),
          type: itemDef.type ?? 'item',
          rarity: rarity.id,
          rarityLabel: rarity.label,
          rarityRank: rarity.rank,
          build: build?.id ?? null,
          buildLabel: build?.label ?? '',
          groundModel: itemDef.groundModel ?? null,
          description: itemDef.description ?? '',
          weight: this.state.inventory.itemWeight(itemId),
          totalWeight: this.state.inventory.weightOf(itemId, Math.max(1, count)),
          canEquip: Boolean(itemDef.equipment?.slot),
          equipmentSlot: itemDef.equipment?.slot ?? null,
          canUse: this.state.inventory.canUse(itemId)
        };
      })
      .filter(Boolean);
  }

  playerEntries() {
    return this.callbacks.inventoryEntries?.() ?? [];
  }

  currency() {
    return this.state.trade?.trader?.trade?.currency ?? 'ducat';
  }

  clampSelection() {
    const stockEntries = this.stockEntries();
    const playerEntries = this.playerEntries();
    this.state.tradeStockIndex = stockEntries.length
      ? Math.max(0, Math.min(stockEntries.length - 1, this.state.tradeStockIndex ?? 0))
      : 0;
    this.state.tradePlayerIndex = playerEntries.length
      ? Math.max(0, Math.min(playerEntries.length - 1, this.state.tradePlayerIndex ?? 0))
      : 0;
    if (this.state.tradeFocus !== 'player') this.state.tradeFocus = 'trader';
  }

  moveSelection(delta) {
    const entries = this.state.tradeFocus === 'player'
      ? this.playerEntries()
      : this.stockEntries();
    if (!entries.length) return;
    if (this.state.tradeFocus === 'player') {
      this.state.tradePlayerIndex = Math.max(0, Math.min(entries.length - 1, (this.state.tradePlayerIndex ?? 0) + delta));
    } else {
      this.state.tradeStockIndex = Math.max(0, Math.min(entries.length - 1, (this.state.tradeStockIndex ?? 0) + delta));
    }
  }

  buyStatus(entry) {
    if (!entry) return { ok: false, hint: 'NO STOCK' };
    if (entry.count <= 0) return { ok: false, hint: 'SOLD OUT' };
    const currency = this.currency();
    if (this.state.inventory.count(currency) < entry.price) {
      return { ok: false, hint: `NEED ${entry.price} DUCATS` };
    }
    const carry = this.state.inventory.canAdd(entry.itemId, 1);
    if (!carry.ok) return { ok: false, hint: 'PACK TOO HEAVY', carry };
    return { ok: true, hint: 'E BUY: TAKE 1' };
  }

  buySelectedItem() {
    const entry = this.stockEntries()[this.state.tradeStockIndex ?? 0];
    const status = this.buyStatus(entry);
    if (!status.ok) {
      if (status.carry) this.callbacks.logCarryFailure?.(status.carry);
      else this.callbacks.log?.(status.hint);
      return false;
    }

    const currency = this.currency();
    if (entry.price > 0 && !this.state.inventory.remove(currency, entry.price)) {
      this.callbacks.log?.(`Need ${entry.price} ducats.`);
      return false;
    }

    const result = this.state.inventory.add(entry.itemId, 1);
    if (!result.ok) {
      if (entry.price > 0) this.state.inventory.add(currency, entry.price, { ignoreCapacity: true });
      this.callbacks.logCarryFailure?.(result);
      return false;
    }

    const raw = this.state.trade?.trader?.trade?.stock?.[entry.rawIndex];
    if (raw) raw.count = Math.max(0, Math.floor(Number(raw.count ?? 1) || 0) - 1);
    this.callbacks.syncInventoryOrder?.();
    this.clampSelection();
    this.callbacks.log?.(`Bought: ${entry.name} for ${entry.price} ducats.`);
    return true;
  }

  buildUi() {
    const stockEntries = this.stockEntries();
    const playerEntries = this.playerEntries();
    const selected = stockEntries[this.state.tradeStockIndex ?? 0] ?? null;
    const status = this.buyStatus(selected);
    return {
      title: this.state.trade?.trader?.trade?.title ?? 'Trade',
      traderName: this.state.trade?.trader?.name ?? 'Trader',
      traderItems: stockEntries,
      playerItems: playerEntries,
      stockIndex: this.state.tradeStockIndex ?? 0,
      playerIndex: this.state.tradePlayerIndex ?? 0,
      focus: this.state.tradeFocus ?? 'trader',
      ducats: this.state.inventory.count(this.currency()),
      canBuy: status.ok,
      buyHint: status.hint
    };
  }
}
