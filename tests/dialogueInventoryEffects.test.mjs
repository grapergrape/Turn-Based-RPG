import assert from 'node:assert/strict';

import { meetsDialogueConditions } from '../src/core/DialogueConditions.js';
import { DialogueEffects } from '../src/core/DialogueEffects.js';
import { Game } from '../src/core/Game.js';
import { Inventory } from '../src/core/Inventory.js';
import { searchMethodCompleted } from '../src/world/SearchSystem.js';

const itemDefs = {
  ducat: {
    id: 'ducat',
    name: 'Ducat',
    type: 'currency',
    rarity: 'common',
    weight: 0,
    groundModel: 'chit',
    description: 'Stamped trade coin.'
  },
  'censure-absolution-chit': {
    id: 'censure-absolution-chit',
    name: 'Censure Absolution Chit',
    type: 'trinket',
    rarity: 'common',
    weight: 0,
    groundModel: 'chit',
    description: 'Stamped absolution proof.'
  },
  'packed-ledger': {
    id: 'packed-ledger',
    name: 'Packed Ledger',
    type: 'evidence',
    rarity: 'common',
    weight: 0.5,
    groundModel: 'paper',
    description: 'A heavy test ledger.'
  },
  'kept-record': {
    id: 'kept-record',
    name: 'Kept Record',
    type: 'evidence',
    rarity: 'common',
    weight: 0.2,
    groundModel: 'paper',
    description: 'A test record.'
  }
};

function buildRuntime(ducats, { maxCarryWeight = 10 } = {}) {
  const logs = [];
  let questUpdate = null;
  const game = {
    flags: new Set(),
    clock: { yearAfterDescent: 130, fieldDay: 1, minuteOfDay: 480, minuteCarry: 0 },
    inventory: new Inventory(itemDefs, { maxCarryWeight })
  };
  if (ducats > 0) game.inventory.add('ducat', ducats);
  const effects = new DialogueEffects(game, {
    log: (line) => logs.push(line),
    applyQuestUpdate: (update) => {
      questUpdate = update;
    },
    syncInventoryOrder() {},
    clampInventorySelection() {}
  });
  return { game, effects, logs, questUpdate: () => questUpdate };
}

function buildSearchRuntime({ maxCarryWeight = 10 } = {}) {
  const logs = [];
  const transitions = [];
  const openedSearches = [];
  let awardedXp = 0;
  const game = Object.create(Game.prototype);
  Object.assign(game, {
    flags: new Set(),
    inventory: new Inventory(itemDefs, { maxCarryWeight }),
    _fieldRating: () => 100,
    _primaryRating: () => 7,
    _log: (line) => logs.push(line),
    _openSearchDialogue: (object, lines) => openedSearches.push({ object, lines }),
    _closeUiScreen() {}
  });
  game.dialogueEffects = new DialogueEffects(game, {
    log: (line) => logs.push(line),
    awardPlayerExperience: (amount) => {
      awardedXp += amount;
    },
    transitionLevel: (effect) => transitions.push(effect),
    syncFlagConditionalObjects() {},
    syncInventoryOrder() {},
    clampInventorySelection() {}
  });
  return {
    game,
    logs,
    transitions,
    openedSearches,
    awardedXp: () => awardedXp
  };
}

{
  const evidence = { flagsAtLeast: { count: 2, of: ['copy', 'stock', 'list', 'sign'] } };
  assert.equal(meetsDialogueConditions(evidence, { flags: new Set(['copy']) }), false);
  assert.equal(meetsDialogueConditions(evidence, { flags: new Set(['copy', 'sign']) }), true);
  assert.equal(meetsDialogueConditions(evidence, { flags: new Set(['stock', 'list', 'sign']) }), true);
}

{
  assert.equal(meetsDialogueConditions(
    { items: { ducat: 5 } },
    { itemCount: (id) => (id === 'ducat' ? 5 : 0) }
  ), true);
  assert.equal(meetsDialogueConditions(
    { items: { ducat: 6 } },
    { itemCount: (id) => (id === 'ducat' ? 5 : 0) }
  ), false);
  assert.equal(meetsDialogueConditions(
    { items: { ducat: 1 }, itemsMax: { ducat: 4 } },
    { itemCount: (id) => (id === 'ducat' ? 4 : 0) }
  ), true);
  assert.equal(meetsDialogueConditions(
    { itemsMax: { ducat: 0 } },
    { itemCount: (id) => (id === 'ducat' ? 1 : 0) }
  ), false);
}

{
  const { game, effects, logs, questUpdate } = buildRuntime(4);
  const didTransition = effects.apply({
    setFlag: 'paid-confession',
    inventory: {
      requireAll: true,
      remove: [
        { item: 'ducat', count: 5, failLog: 'Missing fifth ducat.' }
      ],
      add: [
        { item: 'censure-absolution-chit', count: 1 }
      ]
    },
    questUpdate: { quest: 'censure-road-confession', stage: 'absolved-with-ducats' },
    log: 'Payment accepted.'
  });

  assert.equal(didTransition, true);
  assert.equal(game.inventory.count('ducat'), 4);
  assert.equal(game.inventory.count('censure-absolution-chit'), 0);
  assert.equal(game.flags.has('paid-confession'), false);
  assert.equal(questUpdate(), null);
  assert.deepEqual(logs, ['Missing fifth ducat.']);
}

{
  const { game, effects, logs, questUpdate } = buildRuntime(0, { maxCarryWeight: 0.5 });
  game.inventory.add('packed-ledger', 1);
  const handled = effects.apply({
    setFlag: 'records-carried',
    inventory: {
      add: [
        { item: 'kept-record', count: 2 }
      ]
    },
    questUpdate: { quest: 'test-records', stage: 'complete' },
    log: 'The records leave the wall.'
  });

  assert.equal(handled, true);
  assert.equal(game.inventory.count('packed-ledger'), 1);
  assert.equal(game.inventory.count('kept-record'), 0);
  assert.equal(game.flags.has('records-carried'), false);
  assert.equal(questUpdate(), null);
  assert.deepEqual(logs, [
    'Too much to carry. Pack 0.5/0.5 kg.',
    'Need 0.4 kg free.'
  ]);
}

{
  const { game, effects } = buildRuntime(0, { maxCarryWeight: 0.5 });
  game.inventory.add('packed-ledger', 1);
  effects.apply({
    setFlag: 'records-exchanged',
    inventory: {
      requireAll: true,
      remove: [
        { item: 'packed-ledger', count: 1 }
      ],
      add: [
        { item: 'kept-record', count: 2 }
      ]
    }
  });

  assert.equal(game.inventory.count('packed-ledger'), 0);
  assert.equal(game.inventory.count('kept-record'), 2);
  assert.equal(game.flags.has('records-exchanged'), true);
}

{
  const calls = [];
  const game = {
    flags: new Set(),
    clock: { yearAfterDescent: 130, fieldDay: 1, minuteOfDay: 480, minuteCarry: 0 },
    inventory: new Inventory(itemDefs, { maxCarryWeight: 10 })
  };
  const effects = new DialogueEffects(game, {
    syncFlagConditionalObjects: () => calls.push('sync'),
    openDoorGroup: (groupId) => calls.push(`open:${groupId}`),
    closeUiScreen: () => calls.push('close'),
    startCombat: (encounterId) => calls.push(`combat:${encounterId}`)
  });

  assert.equal(effects.apply({
    setFlag: 'sava-opened',
    openDoorGroup: 'sava-listening-niche',
    startCombat: 'sava-listening-niche'
  }), true);
  assert.deepEqual(calls, [
    'sync',
    'open:sava-listening-niche',
    'close',
    'combat:sava-listening-niche'
  ]);
}

{
  const { game, effects, questUpdate } = buildRuntime(5);
  effects.apply({
    setFlag: 'paid-confession',
    inventory: {
      requireAll: true,
      remove: [
        { item: 'ducat', count: 5, failLog: 'Missing fifth ducat.' }
      ],
      add: [
        { item: 'censure-absolution-chit', count: 1 }
      ]
    },
    questUpdate: { quest: 'censure-road-confession', stage: 'absolved-with-ducats' },
    log: 'Payment accepted.'
  });

  assert.equal(game.inventory.count('ducat'), 0);
  assert.equal(game.inventory.count('censure-absolution-chit'), 1);
  assert.equal(game.flags.has('paid-confession'), true);
  assert.deepEqual(questUpdate(), { quest: 'censure-road-confession', stage: 'absolved-with-ducats' });
}

{
  const updates = [];
  const game = {
    flags: new Set(),
    clock: { yearAfterDescent: 130, fieldDay: 1, minuteOfDay: 480, minuteCarry: 0 },
    inventory: new Inventory(itemDefs, { maxCarryWeight: 10 })
  };
  const effects = new DialogueEffects(game, {
    applyQuestUpdate: (update) => updates.push(update)
  });
  effects.apply({
    questUpdate: [
      { quest: 'household-of-one', stage: 'complete' },
      { quest: 'names-for-the-gate', stage: 'settle-tarn' }
    ]
  });
  assert.deepEqual(updates, [
    { quest: 'household-of-one', stage: 'complete' },
    { quest: 'names-for-the-gate', stage: 'settle-tarn' }
  ]);
}

{
  const calls = [];
  const { game, effects } = buildRuntime(0);
  game.flags.add('uninstalled-coil');
  effects.callbacks.syncFlagConditionalObjects = () => calls.push('sync');
  effects.apply({
    clearFlag: 'uninstalled-coil',
    setFlag: 'coil-returned'
  });
  assert.equal(game.flags.has('uninstalled-coil'), false);
  assert.equal(game.flags.has('coil-returned'), true);
  assert.deepEqual(calls, ['sync']);
}

{
  const { game, logs, openedSearches, awardedXp } = buildSearchRuntime({ maxCarryWeight: 0.5 });
  game.inventory.add('packed-ledger', 1);
  const method = {
    id: 'recover-kept-record',
    field: 'search',
    dc: 40,
    successLog: 'The record comes free.',
    success: {
      setFlag: 'kept-record-recovered',
      xp: 7,
      inventory: { add: [{ item: 'kept-record', count: 1 }] }
    }
  };
  const object = { interact: { search: { methods: [method] } } };

  game._chooseSearchOption({ object, methodId: method.id });

  assert.equal(searchMethodCompleted(object, method), false, 'a full pack does not consume the Search method');
  assert.equal(game.flags.has('kept-record-recovered'), false);
  assert.equal(awardedXp(), 0);
  assert.equal(game.inventory.count('kept-record'), 0);
  assert.equal(openedSearches.length, 0, 'the current Search dialogue remains open for a retry');
  assert.deepEqual(logs, [
    'Too much to carry. Pack 0.5/0.5 kg.',
    'Need 0.2 kg free.'
  ]);

  game.inventory.remove('packed-ledger', 1);
  game._chooseSearchOption({ object, methodId: method.id });

  assert.equal(searchMethodCompleted(object, method), true, 'the same Search method completes after room is made');
  assert.equal(game.flags.has('kept-record-recovered'), true);
  assert.equal(awardedXp(), 7);
  assert.equal(game.inventory.count('kept-record'), 1);
  assert.equal(openedSearches.length, 1);
}

{
  const { game, awardedXp } = buildSearchRuntime();
  game.inventory.add('ducat', 1);
  const method = {
    id: 'exchange-two-ducats',
    field: 'search',
    dc: 40,
    success: {
      setFlag: 'search-exchange-complete',
      xp: 3,
      inventory: {
        requireAll: true,
        remove: [{ item: 'ducat', count: 2, failLog: 'Two ducats are required.' }],
        add: [{ item: 'censure-absolution-chit', count: 1 }]
      }
    }
  };
  const object = { interact: { search: { methods: [method] } } };

  game._chooseSearchOption({ object, methodId: method.id });

  assert.equal(searchMethodCompleted(object, method), false, 'a missing requireAll item leaves Search retryable');
  assert.equal(game.flags.has('search-exchange-complete'), false);
  assert.equal(awardedXp(), 0);
  assert.equal(game.inventory.count('ducat'), 1);
  assert.equal(game.inventory.count('censure-absolution-chit'), 0);

  game.inventory.add('ducat', 1);
  game._chooseSearchOption({ object, methodId: method.id });

  assert.equal(searchMethodCompleted(object, method), true);
  assert.equal(game.flags.has('search-exchange-complete'), true);
  assert.equal(awardedXp(), 3);
  assert.equal(game.inventory.count('ducat'), 0);
  assert.equal(game.inventory.count('censure-absolution-chit'), 1);
}

{
  const { game, transitions, openedSearches } = buildSearchRuntime();
  const loadLevel = { path: './data/levels/test_interior.json', player: { x: 2, y: 3 } };
  const method = {
    id: 'take-stair',
    field: 'search',
    dc: 40,
    success: { loadLevel }
  };
  const object = { interact: { search: { methods: [method] } } };

  game._chooseSearchOption({ object, methodId: method.id });

  assert.equal(searchMethodCompleted(object, method), true, 'a successful transition Search still completes');
  assert.deepEqual(transitions, [loadLevel]);
  assert.equal(openedSearches.length, 0);
}

{
  const { game, effects } = buildRuntime(0);
  effects.apply({ clock: { advanceToMinuteOfDay: 23 * 60 } });
  assert.equal(game.clock.fieldDay, 1);
  assert.equal(game.clock.minuteOfDay, 23 * 60);

  effects.apply({ clock: { nextDay: true, minuteOfDay: 8 * 60 } });
  assert.equal(game.clock.fieldDay, 2);
  assert.equal(game.clock.minuteOfDay, 8 * 60);

  effects.apply({ clock: { advanceToMinuteOfDay: 7 * 60 } });
  assert.equal(game.clock.fieldDay, 3);
  assert.equal(game.clock.minuteOfDay, 7 * 60);
}
