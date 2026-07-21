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
    this.state.inventoryRepair = null;
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
        const weaponDetails = this.state.inventory.itemWeaponDetails(itemId);
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
          magazineCapacity: weaponDetails?.magazineCapacity ?? null,
          ammoFamily: weaponDetails?.ammoFamily ?? null,
          ammoItemId: weaponDetails?.ammoItemId ?? null,
          ammoName: weaponDetails?.ammoName ?? '',
          reloadAp: weaponDetails?.reloadAp ?? null,
          attackModes: weaponDetails?.attackModes ?? [],
          canEquip: Boolean(itemDef.equipment?.slot),
          equipmentSlot: itemDef.equipment?.slot ?? null,
          canUse: this.state.inventory.canUse(itemId)
        };
      })
      .filter(Boolean);
  }

  playerEntries() {
    return (this.callbacks.inventoryEntries?.() ?? []).map((entry) => {
      const offer = this.sellOffer(entry.itemId);
      const status = this.sellStatus(entry, offer);
      return {
        ...entry,
        sellPrice: offer?.price ?? null,
        sellKeep: offer?.keep ?? 0,
        sellable: status.ok,
        sellHint: status.hint
      };
    });
  }

  currency() {
    return this.state.trade?.trader?.trade?.currency ?? 'ducat';
  }

  sellOffer(itemId) {
    if (!itemId) return null;
    const raw = (this.state.trade?.trader?.trade?.buys ?? []).find((entry) => entry?.item === itemId);
    if (!raw) return null;
    return {
      itemId,
      price: Math.max(0, Math.floor(Number(raw.price) || 0)),
      keep: Math.max(0, Math.floor(Number(raw.keep) || 0))
    };
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

  sellStatus(entry, offer = this.sellOffer(entry?.itemId)) {
    if (!entry) return { ok: false, hint: 'NO PACK ITEM' };
    if (!offer || offer.price <= 0) return { ok: false, hint: 'NOT ACCEPTED HERE' };
    if (entry.itemId === this.currency()) return { ok: false, hint: 'KEEP YOUR DUCATS' };

    const selectedEquipped = Boolean(entry.entryKey) && Number(entry.equippedCount) > 0;
    if (selectedEquipped) return { ok: false, hint: 'ITEM EQUIPPED' };

    const count = Math.max(0, Math.floor(Number(
      this.state.inventory.count?.(entry.itemId) ?? entry.count
    ) || 0));
    const equipped = Math.max(0, Math.floor(Number(
      this.state.inventory.equippedCount?.(entry.itemId) ?? entry.equippedCount
    ) || 0));
    const reserved = Math.max(equipped, offer.keep);
    if (count <= reserved) {
      if (equipped >= count && equipped > 0) return { ok: false, hint: 'ITEM EQUIPPED' };
      return { ok: false, hint: `KEEP ${offer.keep} IN PACK` };
    }
    return { ok: true, hint: 'E SELL: GIVE 1', offer };
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
    const currencyLabel = entry.price === 1 ? 'ducat' : 'ducats';
    this.callbacks.log?.(`Bought: ${entry.name} for ${entry.price} ${currencyLabel}.`);
    return true;
  }

  sellSelectedItem() {
    const entry = this.playerEntries()[this.state.tradePlayerIndex ?? 0];
    const status = this.sellStatus(entry);
    if (!status.ok) {
      this.callbacks.log?.(status.hint);
      return false;
    }

    const itemKey = entry.entryKey ?? entry.itemId;
    if (!this.state.inventory.remove(itemKey, 1)) {
      this.callbacks.log?.('ITEM NOT IN PACK');
      return false;
    }

    const currency = this.currency();
    const payment = this.state.inventory.add(currency, status.offer.price, { ignoreCapacity: true });
    if (!payment.ok) {
      this.state.inventory.add(entry.itemId, 1, {
        condition: entry.condition,
        loaded: entry.loaded,
        entryKey: entry.entryKey,
        ignoreCapacity: true
      });
      this.callbacks.log?.('TRADE COULD NOT BE COMPLETED');
      return false;
    }

    this.callbacks.syncInventoryOrder?.();
    this.clampSelection();
    const currencyLabel = status.offer.price === 1 ? 'ducat' : 'ducats';
    this.callbacks.log?.(`Sold: ${entry.name} for ${status.offer.price} ${currencyLabel}.`);
    return true;
  }

  buildUi() {
    const stockEntries = this.stockEntries();
    const playerEntries = this.playerEntries();
    const selectedStock = stockEntries[this.state.tradeStockIndex ?? 0] ?? null;
    const selectedPlayer = playerEntries[this.state.tradePlayerIndex ?? 0] ?? null;
    const buyStatus = this.buyStatus(selectedStock);
    const sellStatus = this.sellStatus(selectedPlayer);
    return {
      title: this.state.trade?.trader?.trade?.title ?? 'Trade',
      traderName: this.state.trade?.trader?.name ?? 'Trader',
      traderItems: stockEntries,
      playerItems: playerEntries,
      stockIndex: this.state.tradeStockIndex ?? 0,
      playerIndex: this.state.tradePlayerIndex ?? 0,
      focus: this.state.tradeFocus ?? 'trader',
      ducats: this.state.inventory.count(this.currency()),
      canBuy: buyStatus.ok,
      buyHint: buyStatus.hint,
      canSell: sellStatus.ok,
      sellHint: sellStatus.hint
    };
  }
}
