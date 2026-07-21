import assert from 'node:assert/strict';

import { CombatSystem } from '../src/combat/CombatSystem.js';
import { Inventory } from '../src/core/Inventory.js';
import { Entity } from '../src/entities/Entity.js';

const itemDefs = {
  'field-dressing': {
    name: 'Field Dressing',
    type: 'consumable',
    rarity: 'common',
    weight: 0.2,
    groundModel: 'dressing',
    description: 'A sealed dressing.'
  },
  'censure-sidearm': {
    name: 'Censure Sidearm',
    type: 'weapon',
    rarity: 'common',
    weight: 1.1,
    groundModel: 'sidearm',
    equipment: { slot: 'sidearm' },
    weapon: {
      weaponClass: 'pistol',
      attack: { id: 'sidearm', name: 'Sidearm', apCost: 4, damage: 5, range: 5 }
    },
    condition: { max: 100, default: 80 },
    description: 'A service pistol.'
  },
  'market-pistol': {
    name: 'Market Pistol',
    type: 'weapon',
    rarity: 'common',
    weight: 1,
    groundModel: 'sidearm',
    equipment: { slot: 'sidearm' },
    weapon: {
      weaponClass: 'pistol',
      attack: { id: 'sidearm', name: 'Sidearm', apCost: 4, damage: 4, range: 4 }
    },
    condition: { max: 100, default: 60 },
    description: 'A short pistol.'
  },
  'censure-knife': {
    name: 'Censure Knife',
    type: 'weapon',
    rarity: 'common',
    weight: 0.4,
    groundModel: 'key',
    equipment: { slot: 'melee' },
    weapon: {
      weaponClass: 'knife',
      attack: { id: 'melee', name: 'Censure Knife', apCost: 3, damage: 3, range: 1 }
    },
    condition: { max: 100, default: 100 },
    description: 'A field knife.'
  }
};

{
  const inventory = new Inventory(itemDefs);
  inventory.add('field-dressing', 2);
  inventory.add('censure-sidearm', 2, { condition: 30 });

  const entries = inventory.entries();
  assert.equal(entries.filter((entry) => entry.itemId === 'censure-sidearm').length, 2);
  assert.equal(entries.find((entry) => entry.itemId === 'field-dressing').count, 2);
  assert.equal(inventory.count('censure-sidearm'), 2);
}

{
  const inventory = new Inventory(itemDefs);
  inventory.add('censure-sidearm', 1, { condition: 20 });
  inventory.add('market-pistol', 1, { condition: 50 });
  inventory.add('censure-knife', 1, { condition: 100 });
  const target = inventory.entries().find((entry) => entry.itemId === 'censure-sidearm');
  const donor = inventory.entries().find((entry) => entry.itemId === 'market-pistol');
  const knife = inventory.entries().find((entry) => entry.itemId === 'censure-knife');

  assert.equal(inventory.repairCandidates(target.id).some((entry) => entry.id === donor.id), true);
  assert.equal(inventory.repairCandidates(target.id).some((entry) => entry.id === knife.id), false);

  const result = inventory.repairWeapon(target.id, donor.id, 35);
  assert.equal(result.ok, true);
  assert.equal(result.restored, 18);
  assert.equal(inventory.conditionState(target.id).condition, 38);
  assert.equal(inventory.count('market-pistol'), 0);
}

{
  const inventory = new Inventory(itemDefs);
  inventory.add('censure-sidearm', 2, { condition: 20 });
  const [target, donor] = inventory.entries().filter((entry) => entry.itemId === 'censure-sidearm');
  const result = inventory.repairWeapon(target.id, donor.id, 35);
  assert.equal(result.ok, true);
  assert.equal(result.restored, 28);
  assert.equal(inventory.conditionState(target.id).condition, 48);
}

{
  const inventory = new Inventory(itemDefs);
  inventory.add('censure-sidearm', 1, { condition: 40 });
  inventory.equip('censure-sidearm');
  const fallback = [{ id: 'melee', name: 'Knife', apCost: 3, damage: 3, range: 1 }];
  const sidearm = inventory.weaponAttacks(fallback).find((attack) => attack.roles?.includes('sidearm'));
  assert.equal(sidearm.damage, 4);
  assert.equal(sidearm.conditionTier, 'worn');

  const attacker = new Entity({
    id: 'mara-vey',
    name: 'Test Agent',
    type: 'player',
    stats: { hp: 10, maxHp: 10, actionPoints: 6 },
    attacks: fallback,
    position: { x: 1, y: 1 }
  });
  const target = new Entity({
    id: 'target',
    name: 'Target',
    type: 'enemy',
    stats: { hp: 10, maxHp: 10, actionPoints: 0 },
    attacks: [],
    position: { x: 2, y: 1 }
  });
  const combat = new CombatSystem();
  combat.performAttack(attacker, target, sidearm, { spendAp: false });
  inventory.degradeWeaponAttack(sidearm, 1);
  assert.equal(inventory.conditionState(sidearm.weaponEntryKey).condition, 39);
  assert.equal(target.hp, 6);
}

{
  const inventory = new Inventory(itemDefs);
  inventory.add('censure-sidearm', 1, { condition: 0 });
  inventory.equip('censure-sidearm');
  const sidearm = inventory.weaponAttacks([]).find((attack) => attack.roles?.includes('sidearm'));
  assert.equal(sidearm.broken, true);
  assert.equal(sidearm.damage, 0);
}
