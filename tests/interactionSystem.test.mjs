import assert from 'node:assert/strict';

import { Inventory } from '../src/core/Inventory.js';
import { InteractionSystem } from '../src/world/InteractionSystem.js';

function inventory(maxCarryWeight = 1) {
  return new Inventory({
    ducat: { name: 'Ducat', weight: 0 },
    'field-dressing': { name: 'Field Dressing', weight: 0.2 },
    'penitent-gear-scrap': { name: 'Penitent Gear Scrap', weight: 0.3 }
  }, { maxCarryWeight });
}

{
  const object = {
    kind: 'corpse',
    name: 'Marked Settlement Guard',
    interact: {
      type: 'corpse',
      log: 'A settlement guard lies in the blood.',
      loot: [
        { item: 'ducat', count: 2 },
        { item: 'field-dressing', count: 1 }
      ]
    }
  };
  const pack = inventory();
  const result = new InteractionSystem([object]).interact(object, pack);

  assert.equal(pack.count('ducat'), 2);
  assert.equal(pack.count('field-dressing'), 1);
  assert.equal(object.looted, true);
  assert.equal(object.consumed, undefined);
  assert.ok(result.logs.includes('Recovered: 2x Ducat, 1x Field Dressing.'));
}

{
  const object = {
    kind: 'corpse',
    name: 'Dead Guard',
    looted: true,
    interact: {
      type: 'corpse',
      loot: [{ item: 'ducat', count: 3 }]
    }
  };
  const pack = inventory();
  const result = new InteractionSystem([object]).interact(object, pack);

  assert.equal(pack.count('ducat'), 0);
  assert.deepEqual(result.logs, ['Nothing useful remains.']);
}

{
  const object = {
    kind: 'corpse',
    name: 'Host-Touched Penitent',
    interact: {
      type: 'corpse',
      loot: [{ item: 'penitent-gear-scrap', count: 1 }]
    }
  };
  const pack = inventory(0.1);
  const result = new InteractionSystem([object]).interact(object, pack);

  assert.equal(pack.count('penitent-gear-scrap'), 0);
  assert.equal(object.looted, undefined);
  assert.ok(result.logs.includes('Too much to carry. Pack 0/0.1 kg.'));
}

{
  const object = {
    kind: 'notice-board',
    interact: {
      type: 'note',
      log: 'The old issue marks remain.',
      logVariants: [
        { conditions: { flag: 'water-rationed' }, log: 'Every second issue mark carries a bell time.' },
        { conditions: { flag: 'water-full' }, log: 'Both issue rows carry a full cup mark.' }
      ]
    }
  };
  const flags = new Set(['water-full']);
  const system = new InteractionSystem([object], {
    meetsConditions: (conditions) => flags.has(conditions.flag)
  });

  assert.deepEqual(system.interact(object, inventory()).logs, ['Both issue rows carry a full cup mark.']);
  flags.clear();
  assert.deepEqual(system.interact(object, inventory()).logs, ['The old issue marks remain.']);
  assert.deepEqual(
    new InteractionSystem([object]).interact(object, inventory()).logs,
    ['The old issue marks remain.'],
    'conditioned text never leaks through when no condition evaluator is available'
  );
}
