import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import { attackModeFor, isMeleeAttack, isRangedAttack } from '../src/combat/AttackMode.js';
import { CombatSystem } from '../src/combat/CombatSystem.js';
import { damageFieldFor } from '../src/combat/DamageScaling.js';
import { attackFieldFor, calculateHitChance, defenseFieldsFor } from '../src/combat/HitChance.js';
import { Grid } from '../src/world/Grid.js';
import { evaluateLineOfFire } from '../src/world/CoverSystem.js';

const pikeItem = JSON.parse(await readFile(new URL('../data/items/processional-pike.json', import.meta.url), 'utf8'));
const pike = pikeItem.weapon.attacks.find((attack) => attack.id === 'reach-strike');

assert.equal(pike.range, 2);
assert.equal(pike.mode, 'melee');
assert.equal(attackModeFor(pike), 'melee');
assert.equal(isMeleeAttack(pike), true);
assert.equal(isRangedAttack(pike), false);
assert.equal(attackModeFor({ range: 2 }), 'ranged', 'legacy attacks retain range-based classification');
assert.equal(attackFieldFor(pike), 'melee');
assert.deepEqual(defenseFieldsFor(pike), ['melee', 'unarmed']);
assert.equal(damageFieldFor(pike), 'melee');

const chance = calculateHitChance({
  attackerRating: 40,
  defenderRating: 40,
  attack: pike,
  distance: 2
});
assert.equal(chance.parts.some((part) => part.id === 'range'), false, 'reach melee has no firearm range penalty');

const level = {
  id: 'pike-reach-test',
  name: 'Pike Reach Test',
  width: 4,
  height: 3,
  tileSize: 64,
  tiles: ['....', '....', '....'],
  legend: { '.': { kind: 'floor', walkable: true } }
};
const attacker = { position: { x: 0, y: 1 } };
const defender = { position: { x: 2, y: 1 } };

{
  const grid = new Grid(level);
  const result = evaluateLineOfFire({ grid, props: [], attacker, defender, attack: pike });
  assert.equal(result.blocked, false);
  assert.equal(result.cover.level, 'none');
}

{
  const grid = new Grid(level);
  grid.addBlocked(1, 1);
  const result = evaluateLineOfFire({
    grid,
    props: [{ kind: 'wall', x: 1, y: 1, blocking: true }],
    attacker,
    defender,
    attack: pike
  });
  assert.equal(result.blocked, true);
  assert.equal(result.reason, 'No reach');
}

{
  const combat = new CombatSystem();
  const source = { name: 'Test Agent', ap: 6, render: {} };
  const target = {
    name: 'Target',
    position: { x: 2, y: 1 },
    render: {},
    takeDamage: () => false
  };
  const result = combat.performAttack(source, target, pike, { hit: true });
  assert.equal(result.effect.type, 'slash', 'reach melee uses a melee impact effect');
}

console.log('Explicit attack modes preserve two-cell melee reach without firearm behavior.');
