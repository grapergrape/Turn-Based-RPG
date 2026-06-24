import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import {
  SECURITY_TOOL_ITEM,
  lockMethodStatus,
  lockMethodUsesSecurityTool,
  securityToolSurvives
} from '../src/world/LockSystem.js';
import { buildCharacterSheet } from '../src/core/Progression.js';
import { searchMethodStatus } from '../src/world/SearchSystem.js';

async function readJson(path) {
  return JSON.parse(await readFile(new URL(path, import.meta.url), 'utf8'));
}

function findObject(level, predicate, label) {
  const object = level.objects.find(predicate);
  assert.ok(object, `${label} exists`);
  return object;
}

function findChoice(node, label) {
  const choice = node.choices.find((candidate) => candidate.label === label);
  assert.ok(choice, `choice exists: ${label}`);
  return choice;
}

function hasItem(entries, item, count = 1) {
  return entries.some((entry) => entry.item === item && entry.count >= count);
}

function includesAll(values, expected) {
  return expected.every((value) => values.includes(value));
}

function levelOneRatings() {
  const sheet = buildCharacterSheet(mara);
  const fields = new Map(sheet.fields.map((field) => [field.id, field.value]));
  const primaries = new Map(sheet.primaries.map((primary) => [primary.id, primary.value]));
  return {
    fieldRating: (fieldId) => fields.get(fieldId) ?? 0,
    primaryRating: (primaryId) => primaries.get(primaryId) ?? 0
  };
}

const [
  mara,
  breach,
  cellar,
  bellRoom,
  barrelLadder,
  cellarLadder,
  bellStairs,
  bellRope,
  tomas,
  dalia,
  wardenOrders
] = await Promise.all([
  readJson('../data/actors/mara-vey.json'),
  readJson('../data/levels/ash_chapel_breach.json'),
  readJson('../data/levels/ash_chapel_cellar.json'),
  readJson('../data/levels/ash_chapel_bell_room.json'),
  readJson('../data/dialogue/ash-chapel-barrel-ladder.json'),
  readJson('../data/dialogue/ash-chapel-cellar-ladder.json'),
  readJson('../data/dialogue/ash-chapel-bell-stairs.json'),
  readJson('../data/dialogue/ash-chapel-bell-rope.json'),
  readJson('../data/dialogue/ash-chapel-catacombs-tomas.json'),
  readJson('../data/dialogue/ash-chapel-catacombs-dalia.json'),
  readJson('../data/dialogue/ash-chapel-warden-orders.json')
]);

{
  const startingRolls = mara.inventory.items.filter((entry) => entry.item === SECURITY_TOOL_ITEM);
  assert.equal(startingRolls.length, 1);
  assert.equal(startingRolls[0].count, 1);
}

{
  const safe = findObject(breach, (object) => object.id === 'warden-wall-safe', 'warden wall safe');
  const pickMethod = safe.interact.lock.methods.find((method) => method.id === 'pick-keyway');
  assert.ok(pickMethod);
  assert.equal(pickMethod.requiresItem, SECURITY_TOOL_ITEM);

  const status = lockMethodStatus(pickMethod, {
    inventory: { has: (itemId) => itemId === SECURITY_TOOL_ITEM },
    ...levelOneRatings()
  });

  assert.equal(status.available, true);
  assert.equal(status.success, true);
  assert.equal(lockMethodUsesSecurityTool(pickMethod, status), true);
  assert.equal(securityToolSurvives(status, 0.999), false);
}

{
  const ratings = levelOneRatings();
  const inventory = { has: (itemId) => itemId === SECURITY_TOOL_ITEM };
  const lockObjects = [
    findObject(breach, (object) => object.id === 'warden-wall-safe', 'warden wall safe'),
    findObject(breach, (object) => object.id === 'east-watch-double-door-north', 'east watch north door'),
    findObject(breach, (object) => object.id === 'east-watch-double-door-south', 'east watch south door')
  ];
  for (const object of lockObjects) {
    for (const method of object.interact.lock.methods.filter((entry) => entry.dc !== undefined)) {
      const status = lockMethodStatus(method, { inventory, ...ratings });
      assert.equal(status.available, true, `${object.name} ${method.id} is available`);
      assert.equal(status.success, true, `${object.name} ${method.id} passes at level 1 baseline`);
    }
  }

  const searchObjects = [
    findObject(breach, (object) => object.name === 'Split Barrel', 'split barrel'),
    findObject(breach, (object) => object.name === 'Dead Settlement Guard', 'dead settlement guard'),
    findObject(breach, (object) => object.name === 'Oil and Tread', 'oil and tread'),
    findObject(cellar, (object) => object.name === 'Warden Cache', 'warden cache')
  ];
  for (const object of searchObjects) {
    for (const method of object.interact.search.methods) {
      const status = searchMethodStatus(method, { inventory, ...ratings });
      assert.equal(status.available, true, `${object.name} ${method.id} is available`);
      assert.equal(status.success, true, `${object.name} ${method.id} passes at level 1 baseline`);
    }
  }
}

{
  const markedGuard = findObject(
    breach,
    (object) => object.name === 'Marked Settlement Guard',
    'marked settlement guard corpse'
  );
  assert.ok(hasItem(markedGuard.interact.loot, SECURITY_TOOL_ITEM));

  const deadGuard = findObject(
    breach,
    (object) => object.name === 'Dead Settlement Guard',
    'dead settlement guard corpse'
  );
  const bootSeam = deadGuard.interact.search.methods.find((method) => method.id === 'check-boot-seam');
  assert.ok(bootSeam);
  assert.ok(hasItem(bootSeam.success.inventory.add, SECURITY_TOOL_ITEM));
}

{
  const barrel = findObject(
    breach,
    (object) => object.interact?.dialogue === 'ash-chapel-barrel-ladder',
    'barrel ladder in chapel'
  );
  assert.equal(barrel.interact.dialogue, 'ash-chapel-barrel-ladder');

  const descend = findChoice(barrelLadder.nodes.start, 'Descend');
  assert.equal(descend.effects.loadLevel.path, './data/levels/ash_chapel_cellar.json');
  assert.deepEqual(descend.effects.loadLevel.player, { x: 12, y: 13 });

  const cellarExit = findObject(
    cellar,
    (object) => object.interact?.dialogue === 'ash-chapel-cellar-ladder',
    'cellar ladder exit'
  );
  assert.equal(cellarExit.interact.dialogue, 'ash-chapel-cellar-ladder');

  const climbUp = findChoice(cellarLadder.nodes.start, 'Climb Up');
  assert.equal(climbUp.effects.loadLevel.path, './data/levels/ash_chapel_breach.json');
  assert.deepEqual(climbUp.effects.loadLevel.player, { x: 36, y: 13 });
}

{
  const bellStairChoice = findChoice(bellStairs.nodes.start, 'Climb to the bell room');
  assert.equal(bellStairChoice.effects.loadLevel.path, './data/levels/ash_chapel_bell_room.json');
  assert.deepEqual(bellStairChoice.effects.loadLevel.player, { x: 7, y: 8 });
}

{
  const namedRepair = bellRope.nodes['not-repaired'];
  assert.equal(namedRepair.conditions.flag, 'tomas-bell-repair-known');
  assert.ok(namedRepair.lines.join(' ').includes('Tomas Vek'));

  const unknownRepair = bellRope.nodes['not-repaired-unknown'];
  assert.equal(unknownRepair.lines.join(' ').includes('Tomas'), false);
}

{
  const voices = dalia.nodes.voices;
  assert.equal(voices.effects.setFlag, 'dalia-heard-choir-name');
  assert.ok(voices.lines.join(' ').includes('Choir of the Open Wound'));

  const orders = wardenOrders.nodes.start;
  assert.equal(orders.effects.setFlag, 'read-gate-mother-order');
  assert.ok(orders.lines.join(' ').includes("GATE MOTHER'S GENERAL ORDER"));
  assert.ok(orders.lines.join(' ').includes('Choir of the Open Wound'));

  assert.ok(breach.journalNotes.some((note) =>
    note.flag === 'dalia-heard-choir-name'
    && note.text.includes('Dalia Mor')
    && note.text.includes('Choir of the Open Wound')
  ));
  assert.ok(breach.journalNotes.some((note) =>
    note.flag === 'read-gate-mother-order'
    && note.text.includes('Hallowfen road went silent')
  ));
}

{
  const askRepairs = findChoice(tomas.nodes.start, 'Ask about bell repairs');
  assert.equal(askRepairs.conditions.flag, 'ash-chapel-cult-broken');
  assert.equal(askRepairs.effects.setFlag, 'tomas-bell-repair-known');
  assert.equal(askRepairs.effects.questUpdate.stage, 'bell-hand-known');

  const comeFix = findChoice(tomas.nodes['bell-repair-before'], 'Come fix it now');
  assert.equal(includesAll(comeFix.conditions.flags, ['ash-chapel-cult-broken', 'survivors-returning-chapel']), true);
  assert.equal(
    includesAll(comeFix.conditions.flagsAbsent, [
      'ash-chapel-bell-repaired',
      'tomas-heading-to-bell',
      'tomas-at-bell'
    ]),
    true
  );
  assert.equal(comeFix.effects.setFlag, 'tomas-bell-repair-known');
  assert.equal(comeFix.next, 'send-to-bell');

  const bringTomas = findChoice(tomas.nodes['send-to-bell'], 'Bring him to the bell');
  assert.equal(bringTomas.effects.setFlag, 'tomas-heading-to-bell');
  assert.equal(bringTomas.effects.moveActor.target, 'speaker');
  assert.equal(bringTomas.effects.moveActor.removeOnComplete, true);
  assert.equal(bringTomas.effects.moveActor.onComplete.setFlag, 'tomas-reached-bell-stair');

  const movingTomas = bellRoom.spawns.npcs.find((npc) => npc.conditions?.flags?.includes('tomas-heading-to-bell'));
  assert.ok(movingTomas);
  assert.equal(movingTomas.patrol.onComplete.setFlag, 'tomas-at-bell');

  const bellRopeObject = findObject(bellRoom, (object) => object.kind === 'bell-rope', 'bell rope object');
  const repairMethod = bellRopeObject.interact.lock.methods.find((method) => method.id === 'tomas-repairs-bell');
  assert.ok(repairMethod);
  assert.equal(repairMethod.conditions.flag, 'tomas-at-bell');
  assert.equal(includesAll(repairMethod.success.setFlag, ['ash-chapel-bell-repaired', 'tomas-fixed-bell']), true);
}

{
  const ready = bellRope.nodes.ready;
  assert.equal(
    includesAll(ready.conditions.flags, [
      'ash-chapel-bell-repaired',
      'survivors-returning-chapel',
      'ash-chapel-cult-broken'
    ]),
    true
  );

  const ringBell = findChoice(ready, 'Yes. Ring the bell');
  assert.equal(ringBell.effects.setFlag, 'ash-chapel-bell-rung');
  assert.equal(ringBell.effects.questUpdate.stage, 'hallowfen-checkpoints');
  assert.equal(ringBell.effects.showBriefing.title, 'ACT I: THE HALLOWFEN');
  assert.ok(ringBell.effects.showBriefing.pages.length >= 2);
  assert.ok(ringBell.effects.showBriefing.conditionalPages.length >= 1);
  assert.equal(ringBell.effects.showBriefing.afterBriefing.openScreen, 'primary-assignment');
  assert.equal(ringBell.effects.showBriefing.afterBriefing.loadLevel.path, './data/levels/long_ash_road_approach.json');
  assert.deepEqual(ringBell.effects.showBriefing.afterBriefing.loadLevel.player, { x: 142, y: 68 });
}

{
  assert.ok(mara.attacks.some((attack) => attack.id === 'melee' && attack.range === 1));
  assert.ok(breach.spawns.enemies.filter((enemy) => enemy.encounter).length >= 3);
  assert.ok(breach.combatTriggers.some((trigger) => trigger.encounter && trigger.intro.length > 0));
  assert.ok(breach.combatStartBarks.length > 0);
}

{
  const medicineCrate = findObject(
    breach,
    (object) => object.name === 'Compact Medicine Crate',
    'compact medicine crate'
  );
  assert.equal(medicineCrate.interact.type, 'container');
  assert.equal(medicineCrate.interact.dialogue, 'ash-chapel-medicine-crate');
  assert.ok(medicineCrate.interact.loot.length > 0);
}
