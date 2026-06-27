function exposeState(game, properties) {
  const state = {};
  for (const property of properties) {
    Object.defineProperty(state, property, {
      enumerable: true,
      get: () => game[property],
      set: (value) => {
        game[property] = value;
      }
    });
  }
  return state;
}

export function createLootSessionState(game) {
  return exposeState(game, [
    'dialogue',
    'grid',
    'inventory',
    'inventoryActionMenu',
    'inventorySplit',
    'loot',
    'lootIndex',
    'mode',
    'pendingLootAfterDialogue',
    'uiScreen'
  ]);
}

export function createTradeSessionState(game) {
  return exposeState(game, [
    'dialogue',
    'enemies',
    'inventory',
    'inventoryActionMenu',
    'inventorySplit',
    'loot',
    'npcs',
    'pendingLootAfterDialogue',
    'trade',
    'tradeFocus',
    'tradePlayerIndex',
    'tradeStockIndex',
    'uiScreen'
  ]);
}
