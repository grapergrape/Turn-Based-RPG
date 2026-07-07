import assert from 'node:assert/strict';

import {
  applyStatus,
  getStatus,
  hasStatus,
  removeStatus,
  tickActorStatuses,
  visibleStatuses
} from '../src/combat/StatusEffects.js';

function actor(overrides = {}) {
  return {
    id: 'test-actor',
    name: 'Test Actor',
    hp: 8,
    maxHp: 8,
    isDead: false,
    position: { x: 1, y: 1 },
    render: { state: 'idle', timer: 0 },
    takeDamage(amount) {
      this.hp = Math.max(0, this.hp - amount);
      this.isDead = this.hp === 0;
      return this.isDead;
    },
    ...overrides
  };
}

{
  const target = actor();
  applyStatus(target, {
    id: 'studied',
    duration: 2,
    sourceId: 'mara-vey',
    data: { hitBonus: 15, damageBonus: 1 }
  });
  applyStatus(target, {
    id: 'studied',
    duration: 4,
    sourceId: 'mara-vey',
    data: { hitBonus: 20 }
  });

  const status = getStatus(target, 'studied');
  assert.equal(status.remainingTurns, 4);
  assert.equal(status.stacks, 1);
  assert.equal(status.data.hitBonus, 20);
  assert.equal(status.data.damageBonus, 1);
  assert.deepEqual(visibleStatuses(target).map((entry) => entry.label), ['Studied']);
}

{
  const target = actor({ hp: 5, maxHp: 5 });
  applyStatus(target, { id: 'burning', duration: 2, power: 2 });
  const effects = [];
  const logs = tickActorStatuses(target, { effect: (effect) => effects.push(effect) });

  assert.equal(target.hp, 3);
  assert.equal(hasStatus(target, 'burning'), true);
  assert.equal(getStatus(target, 'burning').remainingTurns, 1);
  assert.deepEqual(logs, ['Test Actor burns for 2.']);
  assert.equal(effects[0].text, '-2');
}

{
  const target = actor({ hp: 1, maxHp: 1 });
  applyStatus(target, { id: 'burning', duration: 1, power: 3 });
  const logs = tickActorStatuses(target);

  assert.equal(target.isDead, true);
  assert.equal(hasStatus(target, 'burning'), false);
  assert.deepEqual(logs, ['Test Actor burns for 3.', 'Test Actor falls.']);
}

{
  const target = actor();
  applyStatus(target, { id: 'snared', duration: 1 });
  assert.equal(removeStatus(target, 'snared'), true);
  assert.equal(hasStatus(target, 'snared'), false);
}

{
  const target = actor();
  applyStatus(target, { id: 'low-step-spent', duration: 1 });
  applyStatus(target, { id: 'riposte-spent', duration: 1 });
  applyStatus(target, { id: 'rallied', duration: 2 });
  applyStatus(target, { id: 'prepared', duration: 2 });

  assert.deepEqual(visibleStatuses(target).map((entry) => entry.id), ['rallied', 'prepared']);
}
