import assert from 'node:assert/strict';

import {
  completeSearchMethod,
  objectSearch,
  resolveSearchMethod,
  restoreSearchCompleted,
  searchCompletedIds,
  searchMethodCompleted,
  searchMethodStatus
} from '../src/world/SearchSystem.js';

function inventory(items = []) {
  const set = new Set(items);
  return {
    has: (itemId) => set.has(itemId)
  };
}

{
  const object = {
    interact: {
      search: {
        methods: [{ id: 'ash-read', label: 'Read the ash', dc: 40 }]
      }
    }
  };
  assert.equal(objectSearch(object), object.interact.search);
}

{
  const method = {
    id: 'ash-read',
    label: 'Read the ash',
    dc: 40,
    successLog: 'The ash reads clean.'
  };
  const status = searchMethodStatus(method, {
    inventory: inventory(),
    fieldRating: (fieldId) => fieldId === 'search' ? 47 : 0
  });
  assert.equal(status.available, true);
  assert.equal(status.success, true);
  assert.deepEqual(status.check, { kind: 'field', id: 'search', rating: 47, dc: 40, success: true });

  const result = resolveSearchMethod(method, {
    inventory: inventory(),
    fieldRating: () => 47
  });
  assert.equal(result.outcome, 'success');
  assert.equal(result.completed, true);
  assert.deepEqual(result.logs, ['SUCCESS: The ash reads clean.']);
}

{
  const method = {
    id: 'lift-slab',
    label: 'Lift the slab',
    primary: 'body',
    dc: 7,
    failLog: 'The slab holds.'
  };
  const result = resolveSearchMethod(method, {
    inventory: inventory(),
    primaryRating: () => 5
  });
  assert.equal(result.outcome, 'failure');
  assert.equal(result.completed, false);
  assert.deepEqual(result.logs, ['FAILED: The slab holds.']);
}

{
  const method = {
    id: 'powder-lock',
    label: 'Dust the lock',
    requiresItem: 'ash-powder',
    dc: 25
  };
  const result = resolveSearchMethod(method, {
    inventory: inventory(),
    itemName: () => 'Ash Powder'
  });
  assert.equal(result.outcome, 'unavailable');
  assert.deepEqual(result.logs, ['You need Ash Powder.']);
}

{
  const object = {};
  const method = { id: 'false-bottom', label: 'Check the false bottom', dc: 40 };
  assert.equal(searchMethodCompleted(object, method), false);
  assert.equal(completeSearchMethod(object, method), true);
  assert.equal(searchMethodCompleted(object, method), true);
  assert.deepEqual(searchCompletedIds(object), ['false-bottom']);

  const restored = {};
  restoreSearchCompleted(restored, ['false-bottom']);
  assert.equal(searchMethodCompleted(restored, method), true);
}
