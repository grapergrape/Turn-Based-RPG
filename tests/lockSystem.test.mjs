import assert from 'node:assert/strict';

import {
  isObjectLocked,
  lockMethodStatus,
  resolveLockMethod
} from '../src/world/LockSystem.js';

function inventory(items = []) {
  const set = new Set(items);
  return {
    has: (itemId) => set.has(itemId)
  };
}

{
  const object = { interact: { lock: { methods: [] } } };
  assert.equal(isObjectLocked(object), true);
  object.unlocked = true;
  assert.equal(isObjectLocked(object), false);
  object.unlocked = false;
  object.consumed = true;
  assert.equal(isObjectLocked(object), false);
}

{
  const method = { id: 'pick', field: 'security', dc: 50 };
  const status = lockMethodStatus(method, {
    inventory: inventory(),
    fieldRating: () => 50
  });
  assert.equal(status.available, true);
  assert.equal(status.success, true);
  assert.deepEqual(status.check, { kind: 'field', id: 'security', rating: 50, dc: 50, success: true });
}

{
  const method = {
    id: 'pry',
    primary: 'body',
    dc: 7,
    failLog: 'The hinge holds.'
  };
  const result = resolveLockMethod(method, {
    inventory: inventory(),
    primaryRating: () => 5
  });
  assert.equal(result.outcome, 'failure');
  assert.equal(result.unlocked, false);
  assert.deepEqual(result.logs, ['The hinge holds.']);
}

{
  const method = {
    id: 'key',
    requiresItem: 'warden-safe-key',
    successLog: 'The key turns.'
  };
  const missing = resolveLockMethod(method, {
    inventory: inventory(),
    itemName: () => "Warden's Iron Key"
  });
  assert.equal(missing.outcome, 'unavailable');
  assert.deepEqual(missing.logs, ["You need Warden's Iron Key."]);

  const present = resolveLockMethod(method, {
    inventory: inventory(['warden-safe-key'])
  });
  assert.equal(present.outcome, 'success');
  assert.equal(present.unlocked, true);
  assert.equal(present.openOnSuccess, true);
}

{
  const method = {
    id: 'inspect',
    field: 'doctrine',
    dc: 40,
    unlocks: false,
    successLog: 'The seal tells you enough.'
  };
  const result = resolveLockMethod(method, {
    inventory: inventory(),
    fieldRating: () => 50
  });
  assert.equal(result.outcome, 'success');
  assert.equal(result.unlocked, false);
  assert.deepEqual(result.logs, ['The seal tells you enough.']);
}
