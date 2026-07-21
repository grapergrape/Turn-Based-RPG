import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';

import { Grid } from '../src/world/Grid.js';

const ROOT = new URL('../', import.meta.url);
const CARDINAL_DIRECTIONS = [
  { x: 1, y: 0 },
  { x: -1, y: 0 },
  { x: 0, y: 1 },
  { x: 0, y: -1 }
];
const OUTDOOR_LEVELS = new Set([
  'ash-road-south',
  'censure-road-camp',
  'long-ash-road-approach',
  'old-pilgrim-way'
]);
const GENERIC_OUTDOOR_KIT_LEVELS = new Set([
  'censure-road-camp',
  'long-ash-road-approach',
  'old-pilgrim-way'
]);

async function readJson(path) {
  return JSON.parse(await readFile(new URL(path, ROOT), 'utf8'));
}

function key(point) {
  return `${point.x},${point.y}`;
}

function reachableCells(level) {
  const grid = new Grid(level);
  for (const object of level.objects ?? []) {
    if (object.blocking) grid.addBlocked(object.x, object.y);
  }

  const start = level.spawns.player;
  assert.equal(grid.isWalkable(start.x, start.y), true, `${level.id} player start is walkable`);
  const seen = new Set([key(start)]);
  const queue = [start];
  for (let index = 0; index < queue.length; index += 1) {
    const cell = queue[index];
    for (const direction of CARDINAL_DIRECTIONS) {
      const next = { x: cell.x + direction.x, y: cell.y + direction.y };
      const nextKey = key(next);
      if (seen.has(nextKey) || !grid.isWalkable(next.x, next.y)) continue;
      seen.add(nextKey);
      queue.push(next);
    }
  }
  return seen;
}

function hasReachableInteractionCell(object, reachable) {
  if (!object.blocking && reachable.has(key(object))) return true;
  return CARDINAL_DIRECTIONS.some((direction) => reachable.has(`${object.x + direction.x},${object.y + direction.y}`));
}

function collectForbiddenDashStrings(value, path = '$', violations = []) {
  if (typeof value === 'string') {
    if (value.includes('—') || value.includes('--')) violations.push(path);
    return violations;
  }
  if (Array.isArray(value)) {
    value.forEach((entry, index) => collectForbiddenDashStrings(entry, `${path}[${index}]`, violations));
    return violations;
  }
  if (value && typeof value === 'object') {
    for (const [field, entry] of Object.entries(value)) {
      collectForbiddenDashStrings(entry, `${path}.${field}`, violations);
    }
  }
  return violations;
}

const levelFiles = (await readdir(new URL('data/levels/', ROOT)))
  .filter((file) => file.endsWith('.json'))
  .sort();
const itemFiles = (await readdir(new URL('data/items/', ROOT)))
  .filter((file) => file.endsWith('.json'))
  .sort();
const knownItemIds = new Set();
for (const file of itemFiles) knownItemIds.add((await readJson(`data/items/${file}`)).id);

assert.equal(levelFiles.length, 39, 'the complete current level set is covered by the RPG-detail audit');

const globalGroundItemIds = new Set();
let groundItemCount = 0;
let lootContainerCount = 0;

for (const file of levelFiles) {
  const level = await readJson(`data/levels/${file}`);
  const groundItems = level.groundItems ?? [];
  const objects = level.objects ?? [];
  const reachable = reachableCells(level);
  const objectCells = new Set(objects.map(key));
  const spawnCells = new Set([
    level.spawns.player,
    ...(level.spawns.npcs ?? []),
    ...(level.spawns.enemies ?? [])
  ].map(key));
  const transitionCells = new Set((level.levelTransitions ?? []).map(key));

  assert.ok(groundItems.length >= 1, `${file} has at least one authored loose ground item`);
  for (const item of groundItems) {
    assert.equal(typeof item.id, 'string', `${file} ground item has a stable id`);
    assert.equal(globalGroundItemIds.has(item.id), false, `${item.id} is globally unique`);
    globalGroundItemIds.add(item.id);
    assert.ok(knownItemIds.has(item.item), `${file} ${item.id} references a known item`);
    assert.equal(Number.isInteger(item.count), true, `${file} ${item.id} has an integer count`);
    assert.ok(item.count > 0, `${file} ${item.id} has a positive count`);
    assert.equal(level.legend[level.tiles[item.y][item.x]].walkable, true, `${file} ${item.id} sits on walkable terrain`);
    assert.equal(objectCells.has(key(item)), false, `${file} ${item.id} does not overlap an object`);
    assert.equal(spawnCells.has(key(item)), false, `${file} ${item.id} does not overlap an actor spawn`);
    assert.equal(transitionCells.has(key(item)), false, `${file} ${item.id} does not overlap a level transition`);
    assert.equal(reachable.has(key(item)), true, `${file} ${item.id} is reachable from the player start`);
    groundItemCount += 1;
  }

  const containers = objects.filter((object) => (
    object.interact?.type === 'container'
      && Array.isArray(object.interact.loot)
      && object.interact.loot.length > 0
  ));
  assert.ok(containers.length >= 1, `${file} has at least one loot-bearing container`);
  assert.ok(
    containers.some((object) => hasReachableInteractionCell(object, reachable)),
    `${file} has a reachable loot-bearing container`
  );
  lootContainerCount += containers.length;

  const dashViolations = collectForbiddenDashStrings(level);
  assert.deepEqual(dashViolations, [], `${file} player-facing level text avoids forbidden dash forms`);

  if (OUTDOOR_LEVELS.has(level.id)) {
    assert.ok(groundItems.length >= 4, `${file} distributes several loose items through the outdoor space`);
  }
  if (GENERIC_OUTDOOR_KIT_LEVELS.has(level.id)) {
    assert.ok(objects.filter((object) => object.kind === 'dead-grass-tuft').length >= 12, `${file} has authored dead-grass texture clusters`);
    assert.ok(objects.some((object) => object.kind === 'field-backpack'), `${file} has a field backpack`);
    assert.ok(objects.some((object) => object.kind === 'small-pouch'), `${file} has a small pouch`);
  }
}

assert.ok(groundItemCount >= 49, 'the current map set carries a substantial loose-loot pass');
assert.ok(lootContainerCount >= 50, 'the current map set retains a substantial container-loot pass');

console.log(`All-map RPG detail tests passed for ${levelFiles.length} levels, ${groundItemCount} ground items, and ${lootContainerCount} loot containers.`);
