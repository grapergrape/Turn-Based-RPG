import assert from 'node:assert/strict';

import { Game } from '../src/core/Game.js';
import { Inventory } from '../src/core/Inventory.js';
import { Entity } from '../src/entities/Entity.js';
import { TRADE_BUTTONS } from '../src/ui/tradeLayout.js';

function mockCanvas() {
  return {
    width: 640,
    height: 480,
    style: {},
    addEventListener() {},
    getBoundingClientRect() { return { left: 0, top: 0, width: 640, height: 480 }; },
    getContext() { return mockCtx(); }
  };
}

function mockCtx() {
  return new Proxy({ imageSmoothingEnabled: false }, {
    get(target, prop) {
      if (prop in target) return target[prop];
      return () => {};
    },
    set(target, prop, value) {
      target[prop] = value;
      return true;
    }
  });
}

globalThis.window = { addEventListener() {} };
globalThis.document = { createElement: () => mockCanvas() };

const itemDefs = {
  ducat: { name: 'Ducat', type: 'currency', rarity: 'common', weight: 0, groundModel: 'chit', description: 'Stamped trade coin.' },
  'field-dressing': { name: 'Field Dressing', type: 'consumable', rarity: 'rare', weight: 0.2, groundModel: 'dressing', description: 'Sterile dressing.', use: { effect: 'heal', amount: 4 } },
  'tinned-beans': { name: 'Tinned Beans', type: 'food', rarity: 'common', weight: 0.3, groundModel: 'food', description: 'A dented tin.', use: { effect: 'heal', amount: 1 } },
  'censure-entry-roll': { name: 'Censure Entry Roll', type: 'tool', rarity: 'uncommon', weight: 0.3, groundModel: 'key', description: 'A lock tool roll.' },
  'tarnished-saint-token': { name: 'Tarnished Saint Token', type: 'trinket', rarity: 'uncommon', weight: 0.1, groundModel: 'token', equipment: { slot: 'trinket' }, description: 'A worn brass token.' },
  'choir-tally-strip': { name: 'Choir Tally Strip', type: 'evidence', rarity: 'common', weight: 0.1, groundModel: 'paper', description: 'A soot-marked tally.' },
  'relic-rounds': { name: 'Relic Rounds', type: 'ammo', rarity: 'common', weight: 0.024, groundModel: 'rounds', ammo: { family: 'sidearm-cartridge' }, description: 'Common pistol cartridges.' },
  'field-sidearm': {
    name: 'Field Sidearm',
    type: 'weapon',
    rarity: 'uncommon',
    weight: 1.1,
    groundModel: 'sidearm',
    equipment: { slot: 'weapon' },
    weapon: {
      weaponClass: 'ballistic-pistol',
      attacks: [
        { id: 'single-shot', name: 'Single Shot', mode: 'ranged', apCost: 4, damage: 5, range: 5, accuracyBonus: 0, ammoCost: 1 }
      ],
      magazine: { ammoFamily: 'sidearm-cartridge', capacity: 7, defaultLoaded: 7, reloadAp: 2 }
    },
    condition: { max: 100, default: 90 },
    description: 'A plain road pistol kept clean for sale.'
  }
};

function buildTradeGame({ actions, ducats = 4, playerHp = 10 }) {
  const game = new Game({
    canvas: mockCanvas(),
    levelPath: './data/levels/ash_chapel_breach.json',
    atlas: null,
    statusElement: null,
    bootOptions: { skipIntro: true }
  });
  const player = new Entity({
    id: 'mara-vey',
    name: 'Test Agent',
    type: 'player',
    stats: { hp: playerHp, maxHp: 14, actionPoints: 6 },
    attacks: [{ id: 'melee', name: 'Knife', apCost: 1, damage: 3, range: 1 }],
    position: { x: 1, y: 1 },
    progression: { level: 1, xp: 0, build: 'field-agent' }
  });
  const trader = new Entity({
    id: 'catacombs-survivor-hanne',
    name: 'Joanna Corvus',
    type: 'npc',
    stats: { hp: 6, maxHp: 6, actionPoints: 0 },
    position: { x: 2, y: 1 },
    trade: {
      title: "Joanna's Medic Pack",
      currency: 'ducat',
      stock: [
        { item: 'field-dressing', count: 1, price: 4 },
        { item: 'tinned-beans', count: 1, price: 1 },
        { item: 'field-sidearm', count: 1, price: 6 }
      ],
      buys: [
        { item: 'censure-entry-roll', price: 2, keep: 1 },
        { item: 'tarnished-saint-token', price: 1 }
      ]
    }
  });

  game.ready = true;
  game.anim = { tick: 0, bob: 0, flicker: 0, pulse: 0 };
  game.areaTitleTimer = 0;
  game.effects = [];
  game.speakingProps = [];
  game.player = player;
  game.enemies = [];
  game.npcs = [trader];
  game.groundItems = [];
  game.moving = null;
  game.pathQueue = [];
  game.pendingExploreTarget = null;
  game.mode = 'explore';
  game.uiScreen = 'trade';
  game.trade = { trader };
  game.tradeFocus = 'trader';
  game.tradeStockIndex = 0;
  game.tradePlayerIndex = 0;
  game.dialogue = null;
  game.log = [];
  game.inventory = new Inventory(itemDefs, { maxCarryWeight: 10 });
  if (ducats > 0) game.inventory.add('ducat', ducats);
  game.inventoryOrder = [];
  game.level = { id: 'test-level', name: 'Test Level', interactables: [], props: [], mood: null };
  game.questDefs = {};
  game.questStages = new Map();
  game.questReached = new Map();
  game.awardedQuestXp = new Set();
  game.appliedLevelEvents = new Set();
  game.clearedEncounters = new Set();
  game.input = {
    consume: () => actions.shift() ?? [],
    consumeClick: () => null
  };
  return { game, player, trader };
}

{
  const { game, trader } = buildTradeGame({ actions: [['interact'], ['down', 'interact']], ducats: 5 });

  const stock = game._tradeStockEntries();
  assert.equal(stock.find((entry) => entry.id === 'field-dressing').rarity, 'rare');
  assert.equal(stock.find((entry) => entry.id === 'field-dressing').rarityLabel, 'Rare');
  assert.equal(stock.find((entry) => entry.id === 'field-sidearm').ammoName, 'Relic Rounds');
  assert.equal(stock.find((entry) => entry.id === 'field-sidearm').magazineCapacity, 7);
  assert.deepEqual(stock.find((entry) => entry.id === 'field-sidearm').attackModes, [{
    id: 'single-shot',
    name: 'Single Shot',
    mode: 'ranged',
    damage: 5,
    baseDamage: 5,
    apCost: 4,
    range: 5,
    accuracyBonus: 0,
    ammoCost: 1,
    conditionWear: 1,
    requiresStationary: false
  }]);

  game.update(0);
  assert.equal(game.inventory.count('ducat'), 1);
  assert.equal(game.inventory.count('field-dressing'), 1);
  assert.equal(trader.trade.stock[0].count, 0);
  assert.equal(game.uiScreen, 'trade');

  game.update(0);
  assert.equal(game.inventory.count('ducat'), 0);
  assert.equal(game.inventory.count('tinned-beans'), 1);
  assert.equal(trader.trade.stock[1].count, 0);
}

{
  const { game, trader } = buildTradeGame({ actions: [['interact']], ducats: 0 });

  game.update(0);
  assert.equal(game.inventory.count('field-dressing'), 0);
  assert.equal(trader.trade.stock[0].count, 1);
  assert.equal(game.log.at(-1), 'NEED 4 DUCATS');
}

{
  const { game } = buildTradeGame({ actions: [['interact'], ['interact']], ducats: 0 });
  game.inventory.add('censure-entry-roll', 2);
  game.inventoryOrder = ['censure-entry-roll'];
  game.tradeFocus = 'player';

  const entry = game._tradePlayerEntries()[0];
  assert.equal(entry.sellPrice, 2);
  assert.equal(entry.sellable, true);
  assert.equal(entry.sellHint, 'E SELL: GIVE 1');

  game.update(0);
  assert.equal(game.inventory.count('censure-entry-roll'), 1);
  assert.equal(game.inventory.count('ducat'), 2);
  assert.equal(game.log.at(-1), 'Sold: Censure Entry Roll for 2 ducats.');

  game.update(0);
  assert.equal(game.inventory.count('censure-entry-roll'), 1);
  assert.equal(game.inventory.count('ducat'), 2);
  assert.equal(game.log.at(-1), 'KEEP 1 IN PACK');
}

{
  const { game } = buildTradeGame({ actions: [], ducats: 0 });
  game.inventory.add('tarnished-saint-token', 2);
  game.inventory.equip('tarnished-saint-token');
  game.inventoryOrder = ['tarnished-saint-token'];
  game.tradeFocus = 'player';

  const click = { x: TRADE_BUTTONS.buy.x + 1, y: TRADE_BUTTONS.buy.y + 1 };
  game._handleTradeScreen([], click);
  assert.equal(game.inventory.count('tarnished-saint-token'), 1);
  assert.equal(game.inventory.count('ducat'), 1);
  assert.equal(game.inventory.isEquipped('tarnished-saint-token'), true);

  game._handleTradeScreen([], click);
  assert.equal(game.inventory.count('tarnished-saint-token'), 1);
  assert.equal(game.inventory.count('ducat'), 1);
  assert.equal(game.log.at(-1), 'ITEM EQUIPPED');
}

{
  const { game } = buildTradeGame({ actions: [['interact']], ducats: 0 });
  game.inventory.add('choir-tally-strip', 1);
  game.inventoryOrder = ['choir-tally-strip'];
  game.tradeFocus = 'player';

  game.update(0);
  assert.equal(game.inventory.count('choir-tally-strip'), 1);
  assert.equal(game.inventory.count('ducat'), 0);
  assert.equal(game.log.at(-1), 'NOT ACCEPTED HERE');
}

{
  const { game, player } = buildTradeGame({ actions: [], ducats: 0, playerHp: 9 });
  game.inventory.add('tinned-beans', 1);

  const message = game.inventory.useItem(player, 'tinned-beans');
  assert.equal(player.hp, 10);
  assert.equal(game.inventory.count('tinned-beans'), 0);
  assert.match(message, /1 HP/);
}
