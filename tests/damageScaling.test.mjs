import assert from 'node:assert/strict';

import {
  calculateAttackDamage,
  damageFieldFor,
  formatDamage
} from '../src/combat/DamageScaling.js';

{
  const result = calculateAttackDamage({
    baseDamage: 3,
    attackerRating: 27
  });
  assert.equal(result.damage, 3);
  assert.equal(result.skillBonus, 0);
  assert.deepEqual(result.tags, []);
}

{
  const result = calculateAttackDamage({
    baseDamage: 5,
    attackerRating: 76
  });
  assert.equal(result.damage, 7);
  assert.equal(result.skillBonus, 2);
  assert.deepEqual(result.tags, ['SKILL +2']);
}

{
  const result = calculateAttackDamage({
    baseDamage: 5,
    damageMultiplier: 1.5,
    attackerRating: 95
  });
  assert.equal(result.damage, 11);
  assert.equal(result.baseDamage, 8);
  assert.equal(result.skillBonus, 3);
}

{
  assert.equal(calculateAttackDamage({ baseDamage: 5, attackerRating: 500 }).damage, 9);
  assert.equal(formatDamage(7), 'D7');
}

{
  assert.equal(damageFieldFor({ range: 5 }), 'firearms');
  assert.equal(damageFieldFor({ range: 1 }), 'melee');
  assert.equal(damageFieldFor({ range: 5, accuracyField: 'arcWeapons' }), 'arcWeapons');
  assert.equal(damageFieldFor({ range: 5, damageField: 'heavyWeapons' }), 'heavyWeapons');
}
