import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import {
  actorWeaponReloadState,
  consumeActorWeaponAttack,
  hydrateActorWeaponLoadout,
  reloadActorWeapon
} from '../src/combat/ActorWeaponLoadout.js';
import { Inventory } from '../src/core/Inventory.js';
import { Entity } from '../src/entities/Entity.js';

const ids = [
  'censure-sidearm',
  'censure-knife',
  'penitent-coil-sidearm',
  'relic-rounds',
  'compact-armature-ammo'
];
const itemDefs = Object.fromEntries(await Promise.all(ids.map(async (id) => [
  id,
  JSON.parse(await readFile(new URL(`../data/items/${id}.json`, import.meta.url), 'utf8'))
])));

{
  const inventory = new Inventory(itemDefs, { maxCarryWeight: 100 });
  inventory.add('censure-sidearm', 1, { condition: 92, loaded: 2 });
  inventory.add('censure-knife', 1, { condition: 94 });
  inventory.add('relic-rounds', 5);
  assert.equal(inventory.equip('censure-sidearm', 'weapon1').ok, true);
  assert.equal(inventory.equip('censure-knife', 'weapon2').ok, true);

  const sidearmEntry = inventory.entries().find((entry) => entry.itemId === 'censure-sidearm');
  assert.equal(sidearmEntry.ammoItemId, 'relic-rounds');
  assert.equal(sidearmEntry.ammoName, 'Relic Rounds');
  assert.equal(sidearmEntry.attackModes.length, 2);
  assert.deepEqual(
    sidearmEntry.attackModes.map(({ name, damage, apCost, range, accuracyBonus, ammoCost }) => (
      { name, damage, apCost, range, accuracyBonus, ammoCost }
    )),
    [
      { name: 'Single Shot', damage: 5, apCost: 4, range: 5, accuracyBonus: 0, ammoCost: 1 },
      { name: 'Quick Shot', damage: 4, apCost: 3, range: 5, accuracyBonus: -10, ammoCost: 1 }
    ]
  );
  assert.equal(
    inventory.equipmentEntries().find((entry) => entry.slot === 'weapon1').ammoName,
    'Relic Rounds'
  );

  const attacks = inventory.weaponAttacks([
    { id: 'melee', name: 'Unarmed', mode: 'melee', apCost: 3, damage: 1, range: 1 }
  ]);
  assert.equal(attacks.length, 4, 'equipped melee role suppresses the unarmed fallback');
  assert.equal(new Set(attacks.map((attack) => attack.id)).size, attacks.length, 'every mode has a unique runtime id');
  assert.equal(attacks.filter((attack) => attack.weaponSlot === 'weapon1').length, 2);
  assert.equal(attacks.filter((attack) => attack.weaponSlot === 'weapon2').length, 2);

  const actor = new Entity({
    id: 'tester',
    name: 'Tester',
    type: 'player',
    stats: { hp: 10, maxHp: 10, actionPoints: 6 },
    attacks,
    position: { x: 0, y: 0 }
  });
  actor.attacks = attacks;
  assert(actor.getAttack('sidearm')?.roles.includes('sidearm'));
  assert(actor.getAttack('melee')?.roles.includes('melee'));

  let shot = actor.getAttack('sidearm');
  assert.equal(shot.loaded, 2);
  assert.equal(inventory.consumeWeaponAttack(shot), true);
  shot = inventory.weaponAttacks([]).find((attack) => attack.localId === 'single-shot');
  assert.equal(shot.loaded, 1);
  assert.equal(inventory.consumeWeaponAttack(shot), true);
  shot = inventory.weaponAttacks([]).find((attack) => attack.localId === 'single-shot');
  assert.equal(shot.empty, true);
  assert.equal(inventory.consumeWeaponAttack(shot), false);

  const reloadState = inventory.reloadStateForAttack(shot);
  assert.equal(reloadState.reloadAp, 2);
  assert.equal(reloadState.reserve, 5);
  const reload = inventory.reloadWeapon(reloadState.entryKey);
  assert.equal(reload.ok, true);
  assert.equal(reload.current, 5);
  assert.equal(inventory.count('relic-rounds'), 0);

  const snapshot = inventory.stateSnapshot();
  const restored = new Inventory(itemDefs, { maxCarryWeight: 100 });
  restored.loadState(snapshot);
  assert.equal(restored.magazineState(snapshot.equipment.weapon1).loaded, 5);
  assert.equal(restored.readyWeaponEntry('weapon1'), snapshot.equipment.weapon1);
  assert.equal(restored.readyWeaponEntry('weapon2'), snapshot.equipment.weapon2);
}

{
  const inventory = new Inventory(itemDefs, { maxCarryWeight: 100 });
  inventory.add('censure-sidearm', 2, { loaded: 7 });
  const copies = inventory.entries().filter((entry) => entry.itemId === 'censure-sidearm');
  inventory.equip(copies[0].id, 'weapon1');
  inventory.equip(copies[1].id, 'weapon2');
  const runtimeIds = inventory.weaponAttacks([]).map((attack) => attack.id);
  assert.equal(new Set(runtimeIds).size, runtimeIds.length, 'two copies retain distinct attack namespaces');
}

{
  const inventory = new Inventory(itemDefs, { maxCarryWeight: 100 });
  inventory.add('penitent-coil-sidearm', 1, { condition: 80, loaded: 6 });
  inventory.equip('penitent-coil-sidearm', 'weapon1');
  const overcharge = inventory.weaponAttacks([]).find((attack) => attack.localId === 'overcharge');
  assert.equal(overcharge.ammoCost, 2);
  assert.equal(overcharge.conditionWear, 4);
  assert.equal(inventory.consumeWeaponAttack(overcharge), true);
  inventory.degradeWeaponAttack(overcharge);
  assert.equal(inventory.magazineState(overcharge.weaponEntryKey).loaded, 4);
  assert.equal(inventory.conditionState(overcharge.weaponEntryKey).condition, 76);
}

{
  const enemy = new Entity({
    id: 'armed-test',
    name: 'Armed Test',
    type: 'enemy',
    stats: { hp: 8, maxHp: 8, actionPoints: 6 },
    attacks: [],
    position: { x: 1, y: 1 }
  });
  const [attack] = hydrateActorWeaponLoadout(enemy, [
    { item: 'censure-sidearm', loaded: 1, reserve: 3 }
  ], itemDefs);
  assert.equal(attack.loaded, 1);
  assert.equal(consumeActorWeaponAttack(enemy, attack), true);
  assert.equal(attack.empty, true);
  assert.equal(actorWeaponReloadState(enemy, attack).canReload, true);
  const reload = reloadActorWeapon(enemy, attack);
  assert.equal(reload.ok, true);
  assert.equal(attack.loaded, 3);
  assert.equal(attack.reserveAmmo, 0);
  assert.equal(attack.empty, false);
}

console.log('weaponSystem: ready slots, modes, condition, magazines, reloads, snapshots, and enemy references passed.');
