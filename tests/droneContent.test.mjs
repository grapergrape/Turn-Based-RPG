import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import { SPRITE_ATLAS_IDS } from '../src/render/SpriteAtlas.js';
import { CATEGORY, SPRITE_CATALOG } from '../src/render/spriteCatalog.js';
import { bakeUtilityDrone } from '../src/render/sprites/utilityDrone.js';

const ROOT = new URL('../', import.meta.url);
const readText = (path) => readFile(new URL(path, ROOT), 'utf8');
const readJson = async (path) => JSON.parse(await readText(path));

const [index, definition, serviceParts, road, rendererSource, runtimeSource, spriteSource] = await Promise.all([
  readJson('./data/companions/index.json'),
  readJson('./data/companions/utility-drone-mark-i.json'),
  readJson('./data/items/drone-service-parts.json'),
  readJson('./data/levels/long_ash_road_approach.json'),
  readText('./src/render/ui/DroneRenderer.js'),
  readText('./src/core/game/GameDroneRuntime.js'),
  readText('./src/render/sprites/utilityDrone.js')
]);

assert.deepEqual(index.ids, ['utility-drone-mark-i']);
assert.equal(definition.type, 'companion');
assert.equal(definition.team, 'player');
assert.equal(definition.control, 'player');
assert.equal(definition.communication.mode, 'nonverbal');
assert.deepEqual(Object.keys(definition.communication.signals), ['registered', 'combat', 'disabled', 'reboot']);
assert.deepEqual(Object.values(definition.communication.signals), ['Prrt?', 'Tik. Tik.', 'Krrt.', 'Vrrip.']);
assert.equal(definition.stats.hp, 8);
assert.equal(definition.stats.actionPoints, 5);
assert.deepEqual(definition.attacks[0], {
  id: 'arc-pin',
  name: 'Arc Pin',
  apCost: 3,
  damage: 2,
  range: 4,
  mode: 'ranged',
  accuracyField: 'engineering',
  damageField: 'engineering',
  tags: ['energy']
});
assert.equal(definition.branches.flatMap((branch) => branch.nodes).length, 48);

assert.equal(serviceParts.id, 'drone-service-parts');
assert.equal(serviceParts.rarity, 'rare');
assert.equal(serviceParts.weight, 0);

const shrine = road.objects.find((object) => object.id === 'long-ash-censure-attendant-shrine');
assert.ok(shrine, 'Long Ash graveyard has the attendant shrine outside the chapels');
assert.equal(shrine.kind, 'censure-attendant-shrine');
assert.deepEqual({ x: shrine.x, y: shrine.y }, { x: 136, y: 48 });
assert.deepEqual(shrine.interactionMarker, { x: 136, y: 49 });
assert.deepEqual(shrine.activationCell, { x: 137, y: 48 });
assert.equal(shrine.blocking, true);
assert.equal(shrine.interact.type, 'drone-shrine');

const expectedCaches = new Map([
  ['south_measure_intake_undercroft.json', ['undercroft-rejected-issue-crate', 2]],
  ['south_measure_relief_maintenance_annex.json', ['annex-condemned-parts-crate', 2]],
  ['south_measure_morrow_freight_house.json', ['freight-written-off-road-crate', 2]],
  ['south_measure_compact_clinic.json', ['clinic-censure-field-satchel', 1]],
  ['south_measure_hidden_rows.json', ['hidden-rows-free-clinic-satchel', 1]]
]);
let cachedParts = 0;
for (const [filename, [containerId, expectedCount]] of expectedCaches) {
  const level = await readJson(`./data/levels/${filename}`);
  const container = level.objects.find((object) => object.id === containerId);
  assert.ok(container, `${filename} contains ${containerId}`);
  const entry = container.interact.loot.find((loot) => loot.item === 'drone-service-parts');
  assert.equal(entry?.count, expectedCount, `${containerId} has its planned service-part count`);
  cachedParts += entry.count;
}
assert.equal(cachedParts, 8);
assert.match(runtimeSource, /inventory\.add\(DRONE_SERVICE_ITEM_ID, 2,/);
assert.equal(cachedParts + 2, 10, 'the run contains ten authored service parts including shrine issue');

for (const [kind, category] of [
  ['censure-attendant-shrine', CATEGORY.STRUCTURE],
  ['drone-sensor-stake', CATEGORY.PROP],
  ['drone-folding-screen', CATEGORY.STRUCTURE],
  ['drone-snare-pod', CATEGORY.PROP],
  ['drone-arc-sentry', CATEGORY.STRUCTURE],
  ['drone-relay-pylon', CATEGORY.STRUCTURE],
  ['drone-med-station', CATEGORY.FURNITURE]
]) {
  assert.equal(SPRITE_CATALOG[kind]?.category, category, `${kind} is registered once in the expected catalog category`);
}

const droneAtlasIds = SPRITE_ATLAS_IDS.filter((id) => id.includes('drone'));
assert.equal(droneAtlasIds.length, 7);
assert.equal(droneAtlasIds.every((id) => id.startsWith('utility-drone-mark-i')), true);
assert.equal(SPRITE_ATLAS_IDS.some((id) => id.includes('dominion') || id.includes('palatine')), false);

for (const attachment of [null, 'core', 'energy', 'bulwark', 'medical', 'veil', 'fieldworks']) {
  const sprite = bakeUtilityDrone(attachment);
  assert.equal(sprite.airborne, true, `${attachment ?? 'base'} model is explicitly airborne`);
  assert.ok(sprite.shadowScale < 0.6, `${attachment ?? 'base'} model uses a separated flight shadow`);
  assert.ok(sprite.shadowHeightRatio < 0.42, `${attachment ?? 'base'} model uses a narrow flight shadow`);
}
assert.equal(/PALETTE\.ui/.test(spriteSource), false, 'the world-space attendant model does not use UI palette colors');

for (const text of [
  'PRE-BLOOM FIELD ATTENDANT SHRINE',
  'AGENT OF CENSURE IDENTIFIED.',
  'WHERE IS YOUR ATTENDANT?',
  'I was not issued one.'
]) assert.ok(rendererSource.includes(text), `ritual UI contains ${text}`);
for (const text of [
  'Dominion Siege Drone Mark X',
  'Palatine Combat Drone Mark VI',
  'Utility Drone Mark I'
]) assert.ok(runtimeSource.includes(text), `ritual catalogue contains ${text}`);
for (const text of [
  'ACTIVATION FAILED. THIS SITE HAS NO SIEGE CRADLE.',
  'ACTIVATION FAILED. REMOTE CRADLE EMPTY.'
]) assert.ok(runtimeSource.includes(text), `ritual runtime contains ${text}`);

for (const [path, text] of [
  ['utility drone definition', JSON.stringify(definition)],
  ['service part definition', JSON.stringify(serviceParts)],
  ['ritual renderer', rendererSource],
  ['ritual runtime', runtimeSource]
]) {
  assert.equal(/[—]|--/.test(text), false, `${path} contains no em or doubled dash`);
}

console.log('droneContent: shrine ritual, model troll, 48 nodes, ten service parts, and render registrations passed.');
