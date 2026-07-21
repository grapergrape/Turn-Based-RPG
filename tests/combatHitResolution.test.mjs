import assert from 'node:assert/strict';

import { CombatSystem } from '../src/combat/CombatSystem.js';
import { Entity } from '../src/entities/Entity.js';

function actor(id, name, type, position) {
  return new Entity({
    id,
    name,
    type,
    stats: { hp: 10, maxHp: 10, actionPoints: 6 },
    attacks: [],
    position
  });
}

const attack = { id: 'sidearm', name: 'Sidearm', apCost: 4, damage: 5, range: 5 };

{
  const combat = new CombatSystem();
  const attacker = actor('mara-vey', 'Test Agent', 'player', { x: 0, y: 0 });
  const target = actor('target', 'Target', 'enemy', { x: 3, y: 0 });
  const result = combat.performAttack(attacker, target, attack, {
    chance: 68,
    roll: 91,
    hit: false,
    chanceTags: ['HARD COVER']
  });

  assert.equal(target.hp, 10);
  assert.equal(target.render.state, 'idle');
  assert.equal(attacker.ap, 2);
  assert.equal(result.effect.text, 'MISS');
  assert.equal(result.effect.type, 'miss');
  assert.equal(result.logs[0], "Test Agent's Sidearm missed. Chance 68%, roll 91. Hard cover.");
}

{
  const combat = new CombatSystem();
  const attacker = actor('mara-vey', 'Test Agent', 'player', { x: 0, y: 0 });
  const target = actor('target', 'Target', 'enemy', { x: 3, y: 0 });
  const result = combat.performAttack(attacker, target, attack, {
    chance: 95,
    roll: 1,
    hit: true,
    spendAp: false
  });

  assert.equal(target.hp, 5);
  assert.equal(target.render.state, 'hit');
  assert.equal(attacker.ap, 6);
  assert.equal(result.effect.text, '-5');
  assert.equal(result.logs[0], "Test Agent's Sidearm hit. Chance 95%, roll 1. 5 damage to Target.");
}

{
  const combat = new CombatSystem();
  const attacker = actor('mara-vey', 'Test Agent', 'player', { x: 0, y: 0 });
  const target = actor('target', 'Target', 'enemy', { x: 3, y: 0 });
  const result = combat.performAttack(attacker, target, attack, {
    chance: 95,
    roll: 1,
    hit: true,
    damage: 7,
    damageTags: ['SKILL +2'],
    spendAp: false
  });

  assert.equal(target.hp, 3);
  assert.equal(result.effect.text, '-7');
  assert.equal(result.logs[0], "Test Agent's Sidearm hit. Chance 95%, roll 1. Skill +2. 7 damage to Target.");
}
