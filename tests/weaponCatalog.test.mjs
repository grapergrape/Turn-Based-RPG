import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';

const dataRoot = new URL('../data/', import.meta.url);
const itemRoot = new URL('./items/', dataRoot);
const files = (await readdir(itemRoot)).filter((file) => file.endsWith('.json'));
const items = await Promise.all(files.map(async (file) => JSON.parse(await readFile(new URL(file, itemRoot), 'utf8'))));
const weapons = items.filter((item) => item.type === 'weapon' && item.catalogGroup);
const ammo = items.filter((item) => item.type === 'ammo' && item.ammo?.family);
const manifest = await json('../data/catalogs/weapons.json');

const expectedCounts = {
  'ballistic-long-gun': 20,
  'ballistic-pistol': 20,
  accelerator: 20,
  melee: 40
};
assert.equal(weapons.length, 100);
for (const [group, expected] of Object.entries(expectedCounts)) {
  assert.equal(weapons.filter((weapon) => weapon.catalogGroup === group).length, expected, group);
}
assert.equal(ammo.length, 9);
assert.equal(new Set(ammo.map((item) => item.ammo.family)).size, 9);
for (const item of ammo) {
  assert.equal(/[—]|--/.test(`${item.name} ${item.description}`), false, `${item.id} contains forbidden dash punctuation`);
}
assert.equal(new Set(weapons.map((weapon) => weapon.id)).size, 100);
assert.equal(new Set(weapons.map((weapon) => weapon.name)).size, 100);
assert.deepEqual(manifest.counts, {
  ballisticLongGuns: 20,
  ballisticPistols: 20,
  accelerators: 20,
  melee: 40,
  total: 100
});

const ammoByFamily = new Map(ammo.map((item) => [item.ammo.family, item]));
for (const weapon of weapons) {
  assert.equal(weapon.equipment.slot, 'weapon', `${weapon.id} uses a flexible ready slot`);
  assert(weapon.provenance?.era && weapon.provenance?.origin && weapon.provenance?.factions?.length, `${weapon.id} has provenance`);
  assert(Array.isArray(weapon.weapon?.attacks) && weapon.weapon.attacks.length > 0, `${weapon.id} has attack modes`);
  assert(weapon.weapon.roles?.includes(weapon.catalogGroup === 'melee' ? 'melee' : 'ranged'), `${weapon.id} has a semantic role`);
  if (weapon.catalogGroup === 'melee') {
    assert.equal(weapon.weapon.magazine, undefined, `${weapon.id} has no magazine`);
  } else {
    assert(ammoByFamily.has(weapon.weapon.magazine?.ammoFamily), `${weapon.id} resolves ammunition`);
  }
  const playerText = [weapon.name, weapon.description, ...weapon.weapon.attacks.map((attack) => attack.name)].join(' ');
  assert.equal(/[—]|--/.test(playerText), false, `${weapon.id} contains forbidden dash punctuation`);
}

const weaponModels = new Set(weapons.map((weapon) => weapon.groundModel));
assert.equal(weaponModels.size, 16, 'catalog reuses sixteen weapon silhouettes');
for (const model of [
  'sidearm', 'accelerator-sidearm', 'smg', 'carbine', 'rifle', 'shotgun',
  'support-gun', 'precision-rifle', 'accelerator-rifle', 'rail-rifle',
  'knife', 'sword', 'axe', 'blunt', 'pike', 'tool-weapon'
]) assert(weaponModels.has(model), `catalog uses ${model}`);

const acceleratorText = weapons
  .filter((weapon) => weapon.catalogGroup === 'accelerator')
  .map((weapon) => `${weapon.name} ${weapon.description}`)
  .join(' ');
assert.equal(/\b(laser|plasma|photon|ray gun)\b/i.test(acceleratorText), false);
assert(/armature/i.test(acceleratorText));

assert.equal(manifest.actOne.length, 20);
assert.equal(new Set(manifest.actOne).size, 20);
const mara = await json('../data/actors/mara-vey.json');
const maev = await json('../data/actors/censure-sutler-maev.json');
const kerr = await json('../data/actors/ash-road-south-kerr-sorn.json');
const camp = await json('../data/levels/censure_road_camp.json');
const cutthroat = await json('../data/enemies/red-tithe-cutthroat.json');
const chapter = await json('../data/levels/old_pilgrim_sealed_chapter.json');
const distributed = new Set([
  ...Object.values(mara.inventory.equipment),
  ...maev.trade.stock.map((entry) => entry.item),
  ...kerr.trade.stock.map((entry) => entry.item),
  ...camp.objects.flatMap((object) => object.interact?.loot?.map((entry) => entry.item) ?? []),
  ...cutthroat.loot.map((entry) => entry.item),
  ...chapter.objects.flatMap((object) => object.interact?.loot?.map((entry) => entry.item) ?? [])
]);
for (const id of manifest.actOne) assert(distributed.has(id), `Act I distributes ${id}`);

console.log('weaponCatalog: exact 100 item roster, nine ammo families, lore fields, silhouettes, and Act I distribution passed.');

async function json(path) {
  return JSON.parse(await readFile(new URL(path, import.meta.url), 'utf8'));
}
