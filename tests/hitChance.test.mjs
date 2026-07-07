import assert from 'node:assert/strict';

import {
  attackFieldFor,
  calculateHitChance,
  defenseFieldsFor,
  rollHit
} from '../src/combat/HitChance.js';

{
  const result = calculateHitChance({
    attackerRating: 27,
    defenderRating: 27,
    attack: { range: 1 },
    distance: 1
  });
  assert.equal(result.chance, 70);
  assert.deepEqual(result.tags, []);
}

{
  const result = calculateHitChance({
    attackerRating: 70,
    defenderRating: 30,
    attack: { range: 5 },
    distance: 4,
    cover: 'hard'
  });
  assert.equal(result.chance, 48);
  assert.deepEqual(result.tags, ['SKILL', 'RANGE', 'HARD COVER']);
}

{
  assert.equal(calculateHitChance({ modifiers: [{ label: 'BAD', value: -500 }] }).chance, 10);
  assert.equal(calculateHitChance({ modifiers: [{ label: 'GOOD', value: 500 }] }).chance, 95);
}

{
  assert.deepEqual(rollHit(70, () => 0.69), { roll: 70, hit: true });
  assert.deepEqual(rollHit(70, () => 0.7), { roll: 71, hit: false });
}

{
  assert.equal(attackFieldFor({ range: 5 }), 'firearms');
  assert.equal(attackFieldFor({ range: 1 }), 'melee');
  assert.equal(attackFieldFor({ range: 5, accuracyField: 'arcWeapons' }), 'arcWeapons');
  assert.deepEqual(defenseFieldsFor({ range: 5 }), ['stealth']);
  assert.deepEqual(defenseFieldsFor({ range: 1 }), ['melee', 'unarmed']);
}
