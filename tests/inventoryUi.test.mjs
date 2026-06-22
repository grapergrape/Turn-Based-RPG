import assert from 'node:assert/strict';

import { Inventory } from '../src/core/Inventory.js';
import { UIRenderer } from '../src/render/UIRenderer.js';
import {
  INVENTORY_ACTION_BOXES,
  INVENTORY_SPLIT_BOX,
  inventoryActionAt,
  inventoryActionBox,
  inventoryGearAt,
  inventorySlotAt,
  inventorySlotBox,
  inventorySplitActionAt,
  inventorySplitAmountAt
} from '../src/ui/inventoryLayout.js';
import {
  TRADE_BUTTONS,
  tradeActionAt,
  tradePlayerIndexAt,
  tradePlayerRowBox,
  tradeTraderIndexAt,
  tradeTraderRowBox
} from '../src/ui/tradeLayout.js';

function mockCtx() {
  return {
    canvas: { width: 640, height: 480 },
    imageSmoothingEnabled: false,
    save() {},
    restore() {},
    fillRect() {},
    drawImage() {},
    set fillStyle(value) { this._fillStyle = value; },
    get fillStyle() { return this._fillStyle; }
  };
}

const itemDefs = {
  ducat: {
    name: 'Ducat',
    type: 'currency',
    weight: 0,
    groundModel: 'chit',
    description: 'Stamped trade coin.'
  },
  'field-dressing': {
    name: 'Field Dressing',
    type: 'consumable',
    weight: 0.2,
    groundModel: 'dressing',
    description: 'A sealed sterile dressing.'
  },
  'tinned-beans': {
    name: 'Tinned Beans',
    type: 'food',
    weight: 0.3,
    groundModel: 'food',
    description: 'A dented tin.'
  },
  'ash-road-boots': {
    name: 'Ash Road Boots',
    type: 'boots',
    weight: 1.2,
    groundModel: 'boots',
    equipment: { slot: 'boots' },
    description: 'Heavy travel boots.'
  }
};

const inventory = new Inventory(itemDefs);
inventory.add('ducat', 12);
inventory.add('field-dressing', 3);
inventory.add('ash-road-boots', 1);
inventory.equip('ash-road-boots');

const entries = inventory.entries();
assert.equal(entries.find((entry) => entry.id === 'ducat').groundModel, 'chit');

const firstSlot = inventorySlotBox(0);
assert.equal(inventorySlotAt({ x: firstSlot.x + 2, y: firstSlot.y + 2 }), 0);
assert.equal(inventorySlotAt({ x: 1, y: 1 }), null);
assert.equal(inventoryGearAt({ x: 448, y: 73 }, 7), 0);
const actionMenu = { anchor: firstSlot, canSplit: true };
const splitBox = inventoryActionBox('split', firstSlot, actionMenu);
assert.equal(inventoryActionAt({
  x: splitBox.x + 1,
  y: splitBox.y + 1
}, actionMenu), 'split');
assert.equal(inventoryActionAt({
  x: splitBox.x + 1,
  y: splitBox.y + 1
}, false), null);
assert.equal(inventoryActionAt({
  x: INVENTORY_ACTION_BOXES.sort.x + 1,
  y: INVENTORY_ACTION_BOXES.sort.y + 1
}, false), 'sort');
assert.equal(inventorySplitActionAt({
  x: INVENTORY_SPLIT_BOX.confirm.x + 1,
  y: INVENTORY_SPLIT_BOX.confirm.y + 1
}), 'confirm');
assert.equal(inventorySplitAmountAt({
  x: INVENTORY_SPLIT_BOX.slider.x + INVENTORY_SPLIT_BOX.slider.w - 1,
  y: INVENTORY_SPLIT_BOX.slider.y + 4
}, 12), 12);
assert.equal(tradeTraderIndexAt({
  x: tradeTraderRowBox(1).x + 1,
  y: tradeTraderRowBox(1).y + 1
}, 2), 1);
assert.equal(tradePlayerIndexAt({
  x: tradePlayerRowBox(0).x + 1,
  y: tradePlayerRowBox(0).y + 1
}, 1), 0);
assert.equal(tradeActionAt({
  x: TRADE_BUTTONS.buy.x + 1,
  y: TRADE_BUTTONS.buy.y + 1
}), 'buy');

const renderer = new UIRenderer();
renderer.draw(mockCtx(), {
  screen: 'inventory',
  actorName: 'Mara Vey',
  role: 'Cult-Breaker, Ashen Censure',
  mode: 'EXPLORE',
  hp: 14,
  maxHp: 14,
  ap: 6,
  maxAp: 6,
  inventoryItems: entries,
  inventoryIndex: 1,
  inventoryFocus: 'items',
  inventoryMoveIndex: 1,
  inventoryActionMenu: {
    anchor: firstSlot,
    item: entries.find((entry) => entry.id === 'ash-road-boots'),
    canUnequip: true,
    canSplit: false
  },
  inventorySplit: {
    itemId: 'ducat',
    amount: 4,
    max: 12,
    item: entries.find((entry) => entry.id === 'ducat')
  },
  ducats: 12,
  equipmentSlots: inventory.equipmentEntries(),
  equipmentIndex: 2,
  figureSpriteId: 'mara-vey',
  carryWeight: inventory.currentWeight(),
  maxCarryWeight: inventory.maxCarryWeight,
  controls: ['Click Select'],
  log: []
});

renderer.draw(mockCtx(), {
  screen: 'trade',
  actorName: 'Mara Vey',
  role: 'Cult-Breaker, Ashen Censure',
  mode: 'EXPLORE',
  hp: 14,
  maxHp: 14,
  ap: 6,
  maxAp: 6,
  inventoryItems: entries,
  carryWeight: inventory.currentWeight(),
  maxCarryWeight: inventory.maxCarryWeight,
  controls: ['E Buy', 'Esc Close'],
  trade: {
    title: "Hanne's Medic Pack",
    traderName: 'Hanne Rovik',
    traderItems: [
      { ...entries.find((entry) => entry.id === 'field-dressing'), count: 1, price: 4, affordable: true },
      {
        id: 'tinned-beans',
        itemId: 'tinned-beans',
        name: 'Tinned Beans',
        type: 'food',
        groundModel: 'food',
        description: 'A dented tin.',
        count: 1,
        price: 1,
        affordable: true,
        weight: 0.3,
        totalWeight: 0.3
      }
    ],
    playerItems: entries,
    stockIndex: 0,
    playerIndex: 0,
    focus: 'trader',
    ducats: 12,
    canBuy: true,
    buyHint: 'E BUY: TAKE 1'
  },
  log: []
});

renderer.draw(mockCtx(), {
  screen: 'loot',
  actorName: 'Mara Vey',
  role: 'Cult-Breaker, Ashen Censure',
  mode: 'EXPLORE',
  hp: 14,
  maxHp: 14,
  ap: 6,
  maxAp: 6,
  inventoryItems: entries,
  carryWeight: inventory.currentWeight(),
  maxCarryWeight: inventory.maxCarryWeight,
  controls: ['E Pick Item', 'A Pick All', 'Space Leave'],
  loot: {
    title: 'Dead Guard',
    index: 0,
    entries: [
      entries.find((entry) => entry.id === 'ducat'),
      entries.find((entry) => entry.id === 'field-dressing')
    ]
  },
  log: []
});
