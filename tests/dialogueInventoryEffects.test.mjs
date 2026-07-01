import assert from 'node:assert/strict';

import { meetsDialogueConditions } from '../src/core/DialogueConditions.js';
import { DialogueEffects } from '../src/core/DialogueEffects.js';
import { Inventory } from '../src/core/Inventory.js';

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
  }
};

function buildRuntime(ducats) {
  const logs = [];
  let questUpdate = null;
  const game = {
    flags: new Set(),
    clock: { yearAfterDescent: 130, fieldDay: 1, minuteOfDay: 480, minuteCarry: 0 },
    inventory: new Inventory(itemDefs, { maxCarryWeight: 10 })
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

  assert.equal(didTransition, false);
  assert.equal(game.inventory.count('ducat'), 4);
  assert.equal(game.inventory.count('censure-absolution-chit'), 0);
  assert.equal(game.flags.has('paid-confession'), false);
  assert.equal(questUpdate(), null);
  assert.deepEqual(logs, ['Missing fifth ducat.']);
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
