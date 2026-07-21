import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';

import { meetsDialogueConditions } from '../src/core/DialogueConditions.js';
import { resolveDevStart } from '../src/core/DevStart.js';
import { getSprite } from '../src/render/spriteCatalog.js';
import { Grid } from '../src/world/Grid.js';

const ROOT = new URL('../', import.meta.url);
const LEVEL_FILES = [
  'old_pilgrim_way.json',
  'old_pilgrim_hill_church.json',
  'old_pilgrim_closure_stair.json',
  'old_pilgrim_novitiate_quarters.json',
  'old_pilgrim_trial_galleries.json',
  'old_pilgrim_sealed_chapter.json'
];

async function readJson(path) {
  return JSON.parse(await readFile(new URL(path, ROOT), 'utf8'));
}

function objectById(level, id) {
  const object = level.objects.find((entry) => entry.id === id);
  assert.ok(object, `${level.id} contains ${id}`);
  return object;
}

function dialogueChoice(dialogue, predicate) {
  for (const node of Object.values(dialogue.nodes)) {
    const choice = (node.choices ?? []).find(predicate);
    if (choice) return choice;
  }
  return null;
}

function reachable(level, target, { openDoorGroup = null } = {}) {
  const grid = new Grid(level);
  for (const object of level.objects ?? []) {
    if (!object.blocking || object.doorGroup === openDoorGroup) continue;
    grid.addBlocked(object.x, object.y);
  }
  if (!grid.isWalkable(target.x, target.y)) return false;
  const start = level.spawns.player;
  const queue = [start];
  const seen = new Set([`${start.x},${start.y}`]);
  for (let index = 0; index < queue.length; index += 1) {
    const cell = queue[index];
    if (cell.x === target.x && cell.y === target.y) return true;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const next = { x: cell.x + dx, y: cell.y + dy };
      const key = `${next.x},${next.y}`;
      if (seen.has(key) || !grid.isWalkable(next.x, next.y)) continue;
      seen.add(key);
      queue.push(next);
    }
  }
  return false;
}

function state({ flags = [], questStages = {} } = {}) {
  return {
    flags: new Set(flags),
    questStages: new Map(Object.entries(questStages)),
    fieldRating: () => 100,
    itemCount: () => 0,
    traceValue: () => 0,
    hasScar: () => false
  };
}

const levels = new Map();
for (const file of LEVEL_FILES) {
  const level = await readJson(`data/levels/${file}`);
  levels.set(level.id, level);
}

const surface = levels.get('old-pilgrim-way');
const church = levels.get('old-pilgrim-hill-church');
const closure = levels.get('old-pilgrim-closure-stair');
const quarters = levels.get('old-pilgrim-novitiate-quarters');
const trials = levels.get('old-pilgrim-trial-galleries');
const chapter = levels.get('old-pilgrim-sealed-chapter');

for (const kind of [
  'pilgrim-road-shrine',
  'opened-pilgrim-remains',
  'pilgrim-cot',
  'pilgrim-memorial-tablet',
  'closure-control-panel',
  'pilgrim-trial-frame',
  'processional-pike-rack'
]) assert.ok(getSprite(kind), `${kind} is registered in the sprite catalog`);

assert.deepEqual(
  [...levels.values()].map((level) => [level.id, level.width, level.height]),
  [
    ['old-pilgrim-way', 120, 70],
    ['old-pilgrim-hill-church', 44, 32],
    ['old-pilgrim-closure-stair', 32, 48],
    ['old-pilgrim-novitiate-quarters', 48, 34],
    ['old-pilgrim-trial-galleries', 64, 48],
    ['old-pilgrim-sealed-chapter', 46, 36]
  ]
);

for (const level of levels.values()) {
  assert.deepEqual(level.quests, ['road-through-the-fields', 'the-buried-novitiate', 'names-below-the-hill']);
  assert.equal(level.spawns.player.actor, 'mara-vey');
}

assert.deepEqual(surface.spawns.player, { actor: 'mara-vey', x: 60, y: 67, facing: 'n' });
assert.equal(surface.spawns.enemies.length, 5);
assert.deepEqual(
  [...new Set(surface.spawns.enemies.map((spawn) => spawn.id))].sort(),
  ['old-pilgrim-bell-throat', 'old-pilgrim-cord-bearer', 'old-pilgrim-procession-runner']
);
assert.equal(surface.spawns.enemies.every((spawn) => spawn.encounter === 'old-pilgrim-field-opening'), true);
assert.equal(surface.spawns.enemies.every((spawn) => spawn.dormantUntilCombat), true);
assert.equal(surface.combatTriggers.length, 1);
assert.equal(surface.combatTriggers[0].dialogue, 'old-pilgrim-field-opening');
assert.ok(surface.onVictory.setFlag.includes('old-pilgrim-fields-cleared'));
assert.equal(surface.onVictory.questUpdate.stage, 'report-field-attack');
assert.equal(surface.objects.filter((object) => object.kind === 'pilgrim-road-shrine').length, 5, 'the long road has a procession landmark chain');
assert.equal(surface.objects.filter((object) => object.kind === 'opened-pilgrim-remains').length, 5, 'victory leaves role-specific Stage IV remains');
assert.ok(surface.objects.filter((object) => object.visibleWhenFlags?.includes('old-pilgrim-fields-cleared')).length >= 8, 'field victory exposes bodies, remains, and salvage');

for (const [flag, kind] of [
  ['south-measure-compact', 'clinic-bed'],
  ['south-measure-morrow', 'sealed-storage-crate'],
  ['south-measure-resident', 'farm-workbench'],
  ['south-measure-sealed', 'canvas-tent']
]) {
  assert.ok(surface.objects.some((object) => object.kind === kind && object.visibleWhenFlags?.includes(flag)), `${flag} changes the camp dressing`);
}

for (const [flag, actor] of [
  ['south-measure-compact', 'ash-road-south-evin-sael'],
  ['south-measure-morrow', 'ash-road-south-gatt-vire'],
  ['south-measure-resident', 'ash-road-south-perr-varo'],
  ['south-measure-sealed', 'ash-road-south-hara-doss']
]) {
  assert.ok(surface.spawns.npcs.some((spawn) => spawn.actor === actor && spawn.conditions?.flag === flag), `${flag} carries forward through ${actor}`);
}
assert.ok(surface.spawns.npcs.some((spawn) => spawn.actor === 'brother-tarn' && spawn.conditions?.flag === 'tarn-shared-road'));
assert.ok(surface.spawns.npcs.some((spawn) => spawn.actor === 'brother-tarn' && spawn.conditions?.flag === 'tarn-independent-scout'));
const nel = surface.spawns.npcs.find((spawn) => spawn.actor === 'ash-road-south-nel-varo');
assert.equal(nel.conditions.flagsAtLeast.count, 1);
assert.deepEqual(nel.conditions.flagsAbsent, ['nel-stays-one-season']);
assert.deepEqual(objectById(surface, 'old-pilgrim-choir-lesson-slip').visibleWhenFlags, ['choir-influence-south-measure']);

const orenDialogue = await readJson('data/dialogue/old-pilgrim-oren-bale.json');
const treatOren = dialogueChoice(orenDialogue, (choice) => [].concat(choice.effects?.setFlag ?? []).includes('old-pilgrim-oren-treated'));
assert.ok(treatOren, 'Medicine can stabilize Tobias');
assert.equal(treatOren.conditions.items['field-dressing'], 1);
assert.ok(treatOren.effects.inventory.remove.some((entry) => entry.item === 'field-dressing'));
assert.ok([].concat(treatOren.effects.setFlag).includes('old-pilgrim-cart-release-known'));

const fieldOpening = await readJson('data/dialogue/old-pilgrim-field-opening.json');
const informedShot = dialogueChoice(fieldOpening, (choice) => choice.effects?.startCombat?.openingAttack?.guaranteedHit);
const cartFlank = dialogueChoice(fieldOpening, (choice) => choice.effects?.teleport && choice.effects?.startCombat);
const directFight = dialogueChoice(fieldOpening, (choice) => choice.effects?.startCombat && !choice.effects?.teleport && !choice.effects?.startCombat?.openingAttack);
assert.ok(informedShot, 'field signs grant an informed opening shot');
assert.ok(cartFlank, 'Tobias’s cart detail grants a relocated flank');
assert.equal(cartFlank.conditions, undefined, 'the cart execution follows its gated setup node');
assert.ok(directFight, 'the encounter retains a direct approach');
assert.deepEqual(objectById(surface, 'old-pilgrim-field-cart-after-release').visibleWhenFlags, ['old-pilgrim-field-cart-flank']);
assert.deepEqual(objectById(surface, 'old-pilgrim-field-team-pack').visibleWhenFlags, ['old-pilgrim-fields-cleared']);

for (const target of [
  objectById(surface, 'old-pilgrim-south-road-post').interactionMarker,
  objectById(surface, 'old-pilgrim-north-road-post').interactionMarker,
  objectById(surface, 'old-pilgrim-hill-church-door').interactionMarker,
  surface.combatTriggers[0]
]) {
  assert.equal(reachable(surface, target), true, `surface route reaches ${target.x},${target.y}`);
}

const departure = await readJson('data/dialogue/ash-road-south-north-departure.json');
const depart = dialogueChoice(departure, (choice) => choice.effects?.loadLevel?.path === './data/levels/old_pilgrim_way.json');
assert.ok(depart, 'South Measure departure loads Old Pilgrim Way');
assert.deepEqual(depart.effects.loadLevel.player, { x: 60, y: 67, facing: 'n' });

const connectorExpectations = [
  [surface, 'old-pilgrim-hill-church-door', 'old-pilgrim-hill-church-entry', './data/levels/old_pilgrim_hill_church.json'],
  [church, 'old-pilgrim-church-public-door', 'old-pilgrim-hill-church-exit', './data/levels/old_pilgrim_way.json'],
  [closure, 'old-pilgrim-closure-upper-stair', 'old-pilgrim-closure-to-church', './data/levels/old_pilgrim_hill_church.json'],
  [quarters, 'old-pilgrim-quarters-south-door', 'old-pilgrim-quarters-to-closure', './data/levels/old_pilgrim_closure_stair.json'],
  [quarters, 'old-pilgrim-quarters-trial-passage', 'old-pilgrim-quarters-to-trials', './data/levels/old_pilgrim_trial_galleries.json'],
  [trials, 'old-pilgrim-trials-south-stair', 'old-pilgrim-trials-to-quarters', './data/levels/old_pilgrim_novitiate_quarters.json'],
  [chapter, 'old-pilgrim-chapter-south-door', 'old-pilgrim-chapter-to-trials', './data/levels/old_pilgrim_trial_galleries.json']
];
for (const [level, objectId, dialogueId, path] of connectorExpectations) {
  const object = objectById(level, objectId);
  assert.equal(object.interact.dialogue, dialogueId);
  const dialogue = await readJson(`data/dialogue/${dialogueId}.json`);
  assert.ok(dialogueChoice(dialogue, (choice) => choice.effects?.loadLevel?.path === path), `${dialogueId} loads ${path}`);
}

const closureDesk = objectById(church, 'old-pilgrim-closure-desk');
const planMethods = closureDesk.interact.search.methods;
assert.ok(planMethods.some((method) => method.field === 'doctrine'));
assert.ok(planMethods.some((method) => method.field === 'search'));
for (const method of planMethods.slice(0, 2)) {
  assert.ok([].concat(method.success.setFlag).includes('old-pilgrim-apse-clue-ledger'));
}
const foundation = objectById(church, 'old-pilgrim-apse-foundation-seam');
assert.ok(foundation.interact.search.methods.some((method) => [].concat(method.success.setFlag).includes('old-pilgrim-apse-clue-foundation')));
const bellConduit = objectById(church, 'old-pilgrim-bell-conduit');
assert.ok(bellConduit.interact.search.methods.some((method) => [].concat(method.success.setFlag).includes('old-pilgrim-apse-clue-bell')));
const apseSynthesis = await readJson('data/dialogue/old-pilgrim-apse-synthesis.json');
const proveApse = dialogueChoice(apseSynthesis, (choice) => [].concat(choice.effects?.setFlag ?? []).includes('old-pilgrim-buried-novitiate-found'));
assert.equal(proveApse.conditions.flagsAtLeast.count, 2);
assert.equal(meetsDialogueConditions(proveApse.conditions, state({ flags: ['old-pilgrim-apse-clue-ledger'] })), false);
assert.equal(meetsDialogueConditions(proveApse.conditions, state({ flags: ['old-pilgrim-apse-clue-ledger', 'old-pilgrim-apse-clue-foundation'] })), true);
const apseDoor = objectById(church, 'old-pilgrim-concealed-apse-door');
assert.deepEqual(apseDoor.visibleWhenFlags, ['old-pilgrim-closure-plan-read']);
assert.deepEqual(apseDoor.interactionMarker, { x: 22, y: 1 });
assert.ok(apseDoor.interact.lock.methods.some((method) => method.field === 'engineering'));
assert.ok(apseDoor.interact.lock.methods.some((method) => method.field === 'security'));
for (const method of apseDoor.interact.lock.methods) {
  assert.equal(method.success.loadLevel.path, './data/levels/old_pilgrim_closure_stair.json');
}
assert.equal(reachable(church, { x: closureDesk.x - 1, y: closureDesk.y }), true);
assert.equal(reachable(church, apseDoor.interactionMarker), true);
assert.equal(church.objects.filter((object) => object.kind === 'pilgrim-cot').length, 4, 'public hospice uses institutional cots');
assert.ok(church.spawns.npcs.some((spawn) => spawn.dialogue === 'old-pilgrim-father-noll-below' && spawn.conditions?.flag === 'old-pilgrim-return-lift-open'));

const innerDoor = objectById(closure, 'old-pilgrim-inner-pressure-door');
assert.ok(innerDoor.interact.lock.methods.some((method) => method.requiresItem === 'old-pilgrim-service-key'));
assert.ok(innerDoor.interact.lock.methods.some((method) => method.field === 'engineering'));
assert.ok(innerDoor.interact.lock.methods.some((method) => method.field === 'security'));
assert.ok(closure.groundItems.some((item) => item.item === 'old-pilgrim-service-key'));
assert.equal(reachable(closure, innerDoor.interactionMarker), true);
assert.equal(objectById(closure, 'old-pilgrim-closure-duty-register').interact.dialogue, 'old-pilgrim-closure-register');
assert.equal(objectById(closure, 'old-pilgrim-outer-manual-release').interact.dialogue, 'old-pilgrim-manual-release');
const emergencyGauge = objectById(closure, 'old-pilgrim-empty-emergency-tank');
assert.ok(emergencyGauge.interact.search.methods.every((method) => [].concat(method.success.setFlag).includes('old-pilgrim-empty-tank-known')));

const closureRegister = await readJson('data/dialogue/old-pilgrim-closure-register.json');
const copyClosureRoll = dialogueChoice(closureRegister, (choice) => [].concat(choice.effects?.setFlag ?? []).includes('old-pilgrim-name-roll-closure'));
assert.equal(copyClosureRoll.effects.questUpdate.quest, 'names-below-the-hill');
assert.equal(copyClosureRoll.effects.questUpdate.stage, 'find-quarters-roll');

const waterTally = objectById(quarters, 'old-pilgrim-last-water-tally');
assert.equal(reachable(quarters, { x: waterTally.x - 1, y: waterTally.y }), true);
assert.equal(reachable(quarters, objectById(quarters, 'old-pilgrim-quarters-trial-passage').interactionMarker), true);
assert.equal(quarters.objects.filter((object) => object.kind === 'pilgrim-cot').length, 12);
assert.equal(objectById(quarters, 'old-pilgrim-novitiate-pump').interact.dialogue, 'old-pilgrim-quarters-pump');
assert.equal(objectById(quarters, 'old-pilgrim-dry-cistern').interact.dialogue, 'old-pilgrim-quarters-cistern');
assert.equal(objectById(quarters, 'old-pilgrim-novitiate-sleeping-roll').interact.dialogue, 'old-pilgrim-quarters-roll');
const waterDialogue = await readJson('data/dialogue/old-pilgrim-water-tally.json');
const reconstructWater = dialogueChoice(waterDialogue, (choice) => [].concat(choice.effects?.setFlag ?? []).includes('old-pilgrim-water-failure-understood'));
assert.equal(reconstructWater.conditions.flagsAtLeast.count, 2);
assert.equal(meetsDialogueConditions(reconstructWater.conditions, state({ flags: ['old-pilgrim-water-pump-known'] })), false);
assert.equal(meetsDialogueConditions(reconstructWater.conditions, state({ flags: ['old-pilgrim-water-pump-known', 'old-pilgrim-water-cistern-known'] })), true);

const trialFlags = [
  'old-pilgrim-trial-quiet',
  'old-pilgrim-trial-service',
  'old-pilgrim-trial-burden',
  'old-pilgrim-trial-mercy'
];
for (const id of ['quiet', 'service', 'burden', 'mercy']) {
  const dialogue = await readJson(`data/dialogue/old-pilgrim-trial-${id}.json`);
  const text = JSON.stringify(dialogue);
  assert.ok(text.includes(`old-pilgrim-trial-${id}`));
  assert.ok(text.includes(`old-pilgrim-trial-${id}-broken`), `${id} has a physical fallback`);
  assert.ok(text.includes(`old-pilgrim-trial-${id}-kept`), `${id} rewards a skilled route`);
  assert.ok(trials.objects.some((object) => object.id === `old-pilgrim-${id}-trial-kept-state` && object.visibleWhenFlags?.includes(`old-pilgrim-trial-${id}-kept`)), `${id} has an intact physical state`);
  assert.ok(trials.objects.some((object) => object.id === `old-pilgrim-${id}-trial-broken-state` && object.visibleWhenFlags?.includes(`old-pilgrim-trial-${id}-broken`)), `${id} has a broken physical state`);
}
assert.ok(JSON.stringify(await readJson('data/dialogue/old-pilgrim-trial-quiet.json')).includes('old-pilgrim-bell-cable-known'));
assert.ok(JSON.stringify(await readJson('data/dialogue/old-pilgrim-trial-burden.json')).includes('old-pilgrim-breach-brace-known'));
assert.ok(JSON.stringify(await readJson('data/dialogue/old-pilgrim-trial-mercy.json')).includes('old-pilgrim-quarters-sick-list-known'));
assert.equal(objectById(trials, 'old-pilgrim-candidate-roll').interact.dialogue, 'old-pilgrim-trial-roll');
const profession = await readJson('data/dialogue/old-pilgrim-final-profession.json');
const intactProfession = dialogueChoice(profession, (choice) => choice.effects?.setFlag === 'old-pilgrim-profession-intact');
const forcedProfession = dialogueChoice(profession, (choice) => choice.effects?.setFlag === 'old-pilgrim-profession-forced');
const keptFlags = trialFlags.map((flag) => `${flag}-kept`);
assert.equal(intactProfession.conditions.flagsAtLeast.count, 4);
assert.equal(meetsDialogueConditions(intactProfession.conditions, state({ flags: keptFlags })), true);
assert.equal(meetsDialogueConditions(intactProfession.conditions, state({ flags: keptFlags.slice(0, 3) })), false);
assert.equal(meetsDialogueConditions(forcedProfession.conditions, state({
  flags: [...trialFlags, 'old-pilgrim-trial-quiet-broken']
})), true);
assert.equal(meetsDialogueConditions(forcedProfession.conditions, state({ flags: trialFlags })), false);

const bodyCounts = new Map([
  [closure.id, 8],
  [quarters.id, 12],
  [chapter.id, 10]
]);
for (const level of [closure, quarters, trials, chapter]) {
  assert.deepEqual(level.spawns.enemies, [], `${level.id} has no underground combat`);
  assert.equal(level.objects.some((object) => ['host-growth', 'host-vein-seam', 'corpse', 'bone-pile'].includes(object.kind)), false, `${level.id} has no Host matter, fresh corpse, or butchered bone heap`);
  if (bodyCounts.has(level.id)) {
    assert.ok(level.objects.filter((object) => object.kind === 'skeleton').length >= bodyCounts.get(level.id), `${level.id} carries its trapped dead`);
  }
}
assert.equal(church.objects.some((object) => object.kind === 'skeleton'), false, 'public church remains body-free');

const armoryRelease = objectById(chapter, 'old-pilgrim-oath-armory-release');
assert.equal(armoryRelease.interact.lock.methods[0].success.openDoorGroup, 'old-pilgrim-oath-armory');
const pikeRack = objectById(chapter, 'old-pilgrim-processional-pike-rack');
assert.equal(pikeRack.kind, 'processional-pike-rack');
assert.deepEqual(pikeRack.interact.loot, [{ item: 'processional-pike', count: 1 }]);
assert.equal(pikeRack.interact.questUpdate.stage, 'return-to-light');
assert.equal(chapter.objects.some((object) => object.kind === 'skeleton' && object.x >= 34 && object.y <= 16), false, 'the separately sealed armory contains no body');
assert.equal(reachable(chapter, { x: 40, y: 11 }, { openDoorGroup: 'old-pilgrim-oath-armory' }), true, 'opened armory reaches the pike rack');
const chapterIntake = objectById(chapter, 'old-pilgrim-chapter-intake-control');
assert.ok(chapterIntake.interact.search.methods.some((method) => [].concat(method.success.setFlag).includes('old-pilgrim-water-failure-understood')));
assert.ok(chapter.objects.some((object) => object.id === 'old-pilgrim-armory-aid-chest' && object.visibleWhenFlags?.includes('old-pilgrim-oath-armory-open')));
assert.ok(chapter.objects.some((object) => object.id === 'old-pilgrim-chapter-unsent-clearance'));
assert.ok(chapter.objects.some((object) => object.id === 'old-pilgrim-chapter-last-office'));

const pike = await readJson('data/items/processional-pike.json');
assert.equal(pike.equipment.slot, 'weapon');
assert.equal(pike.catalogGroup, 'melee');
assert.equal(pike.weapon.attacks[0].mode, 'melee');
assert.equal(pike.weapon.attacks[0].range, 2);
assert(pike.weapon.roles.includes('reach'));
assert.equal(pike.groundModel, 'pike');

const lift = await readJson('data/dialogue/old-pilgrim-return-lift.json');
const liftChoice = dialogueChoice(lift, (choice) => choice.effects?.loadLevel?.path === './data/levels/old_pilgrim_hill_church.json');
assert.equal(meetsDialogueConditions(liftChoice.conditions, state({
  questStages: { 'the-buried-novitiate': 'return-to-light' }
})), true);
assert.equal(liftChoice.effects.questUpdate.stage, 'complete');
assert.deepEqual(liftChoice.effects.loadLevel.player, { x: 38, y: 8, facing: 's' });
assert.equal(
  church.objects.some((object) => object.blocking && object.x === 38 && object.y === 8),
  false,
  'the return lift places the player beside its blocking landing'
);

const namesQuest = await readJson('data/quests/names-below-the-hill.json');
assert.deepEqual(namesQuest.stages.map((stage) => stage.id), [
  'find-closure-roll',
  'find-quarters-roll',
  'find-trial-roll',
  'find-chapter-roll',
  'decide-names',
  'complete'
]);
for (const [object, dialogue] of [
  [objectById(closure, 'old-pilgrim-closure-duty-register'), 'old-pilgrim-closure-register'],
  [objectById(quarters, 'old-pilgrim-novitiate-sleeping-roll'), 'old-pilgrim-quarters-roll'],
  [objectById(trials, 'old-pilgrim-candidate-roll'), 'old-pilgrim-trial-roll'],
  [objectById(chapter, 'old-pilgrim-chapter-closure-record'), 'old-pilgrim-final-water-record']
]) assert.equal(object.interact.dialogue, dialogue);

const nollBelow = await readJson('data/dialogue/old-pilgrim-father-noll-below.json');
for (const disposition of ['old-pilgrim-names-memorial', 'old-pilgrim-names-road-copy', 'old-pilgrim-names-sealed']) {
  const choice = dialogueChoice(nollBelow, (entry) => [].concat(entry.effects?.setFlag ?? []).includes(disposition));
  assert.ok(choice, `${disposition} is a return-state choice`);
  assert.equal(choice.effects.questUpdate.stage, 'complete');
  assert.ok(church.objects.some((object) => object.visibleWhenFlags?.includes(disposition)), `${disposition} changes the church dressing`);
}

const oldDialogueFiles = (await readdir(new URL('data/dialogue/', ROOT))).filter((file) => file.startsWith('old-pilgrim-'));
const oldActorFiles = (await readdir(new URL('data/actors/', ROOT))).filter((file) => file.startsWith('old-pilgrim-'));
const authoredRecords = [
  ...levels.values(),
  ...(await Promise.all(oldDialogueFiles.map((file) => readJson(`data/dialogue/${file}`)))),
  ...(await Promise.all(oldActorFiles.map((file) => readJson(`data/actors/${file}`)))),
  await readJson('data/items/processional-pike.json'),
  await readJson('data/items/old-pilgrim-service-key.json'),
  await readJson('data/quests/road-through-the-fields.json'),
  await readJson('data/quests/the-buried-novitiate.json'),
  await readJson('data/quests/names-below-the-hill.json'),
  await readJson('data/enemies/old-pilgrim-procession-runner.json'),
  await readJson('data/enemies/old-pilgrim-bell-throat.json'),
  await readJson('data/enemies/old-pilgrim-cord-bearer.json')
];
const authoredText = JSON.stringify(authoredRecords);
assert.equal(authoredText.includes('—'), false);
assert.equal(authoredText.includes('--'), false);
assert.equal(/warden/i.test(authoredText), false, 'Old Pilgrim Way uses priests, nuns, novices, and pilgrims, never wardens');

for (const alias of ['pilgrim', 'old-pilgrim', 'old-pilgrim-way', 'old_pilgrim_way']) {
  assert.equal(resolveDevStart(new URL(`http://localhost:4173/?level=${alias}`)).levelPath, './data/levels/old_pilgrim_way.json');
}

console.log('Old Pilgrim Way surface, outcome continuity, buried route, trials, dead, and pike contract passed.');
