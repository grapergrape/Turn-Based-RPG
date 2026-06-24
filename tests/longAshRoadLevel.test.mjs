import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import { getSprite } from '../src/render/spriteCatalog.js';
import { Grid } from '../src/world/Grid.js';

async function readJson(path) {
  return JSON.parse(await readFile(new URL(path, import.meta.url), 'utf8'));
}

function addBlockingObjects(grid, objects) {
  for (const object of objects) {
    if (object.blocking) grid.addBlocked(object.x, object.y);
  }
}

function inRange(object, range) {
  return (
    object.x >= range.x0 &&
    object.x <= range.x1 &&
    object.y >= range.y0 &&
    object.y <= range.y1
  );
}

function pathExists(grid, start, target) {
  assert.equal(grid.isWalkable(start.x, start.y), true, 'path start is walkable');
  assert.equal(grid.isWalkable(target.x, target.y), true, `path target ${target.x},${target.y} is walkable`);
  const seen = new Set([`${start.x},${start.y}`]);
  const queue = [start];
  const dirs = [
    { x: 1, y: 0 },
    { x: -1, y: 0 },
    { x: 0, y: 1 },
    { x: 0, y: -1 }
  ];
  for (let index = 0; index < queue.length; index += 1) {
    const cell = queue[index];
    if (cell.x === target.x && cell.y === target.y) return true;
    for (const dir of dirs) {
      const next = { x: cell.x + dir.x, y: cell.y + dir.y };
      const key = `${next.x},${next.y}`;
      if (seen.has(key) || !grid.isWalkable(next.x, next.y)) continue;
      seen.add(key);
      queue.push(next);
    }
  }
  return false;
}

const level = await readJson('../data/levels/long_ash_road_approach.json');
const grid = new Grid(level);
addBlockingObjects(grid, level.objects ?? []);

{
  assert.equal(level.id, 'long-ash-road-approach');
  assert.equal(level.name, 'Long Ash Road Approach');
  assert.equal(level.width, 160);
  assert.equal(level.height, 70);
  assert.equal(level.tiles.length, 70);
  for (const [index, row] of level.tiles.entries()) {
    assert.equal(row.length, 160, `row ${index} is 160 cells`);
  }
}

{
  const spawn = level.spawns.player;
  assert.deepEqual(spawn, { actor: 'mara-vey', x: 142, y: 68 });
  assert.equal(grid.isWalkable(spawn.x, spawn.y), true);
  assert.equal(pathExists(grid, spawn, { x: 113, y: 31 }), true, 'start reaches the forest crossroad');
  assert.equal(pathExists(grid, spawn, { x: 116, y: 4 }), true, 'start reaches the north road edge');
}

{
  const ashTree = getSprite('ash-tree');
  assert.ok(ashTree);
  assert.equal(ashTree.category, 'plant');
  assert.equal(ashTree.canopyRadius, 2);
  assert.ok(ashTree.canopyAlpha > 0 && ashTree.canopyAlpha < 1);

  const tree = level.objects.find((object) => {
    if (object.kind !== 'ash-tree') return false;
    const adjacent = [
      { x: object.x + 1, y: object.y },
      { x: object.x - 1, y: object.y },
      { x: object.x, y: object.y + 1 },
      { x: object.x, y: object.y - 1 }
    ];
    return adjacent.some((cell) => grid.isWalkable(cell.x, cell.y));
  });
  assert.ok(tree, 'at least one tree has a walkable canopy-adjacent cell');
  assert.equal(grid.isBlockedProp(tree.x, tree.y), true, 'tree trunk tile is blocked by the authored object');
  assert.equal(grid.isWalkable(tree.x, tree.y), false, 'tree trunk tile cannot be walked onto');
  assert.equal(
    [
      { x: tree.x + 1, y: tree.y },
      { x: tree.x - 1, y: tree.y },
      { x: tree.x, y: tree.y + 1 },
      { x: tree.x, y: tree.y - 1 }
    ].some((cell) => grid.isWalkable(cell.x, cell.y)),
    true,
    'adjacent canopy-covered cells can remain walkable'
  );
}

{
  const wheat = getSprite('wheat-clump');
  assert.ok(wheat, 'wheat-clump is registered');
  assert.equal(wheat.category, 'plant');
  assert.equal(wheat.canopyRadius, 1);
  assert.ok(wheat.canopyAlpha > 0 && wheat.canopyAlpha < 1);

  const wheatObjects = level.objects.filter((object) => object.kind === 'wheat-clump');
  assert.ok(wheatObjects.length >= 250, 'farm fields contain waist-high wheat models');
  assert.equal(wheatObjects.every((object) => !object.blocking), true, 'wheat clumps never block movement');
  assert.equal(
    wheatObjects.every((object) => ['w', 'f'].includes(level.tiles[object.y][object.x])),
    true,
    'wheat clumps stay on wheat and furrow field tiles'
  );
  assert.ok(
    wheatObjects.some((object) => grid.isWalkable(object.x, object.y)),
    'player can walk through wheat clump cells'
  );
}

{
  const farmRange = { x0: 12, x1: 37, y0: 42, y1: 61 };
  const graveyardRange = { x0: 127, x1: 140, y0: 52, y1: 59 };
  const killRange = { x0: 95, x1: 106, y0: 31, y1: 37 };
  assert.ok(level.objects.some((object) => object.kind === 'farm-fence' && inRange(object, farmRange)));
  assert.ok(level.objects.some((object) => object.kind === 'field-cart' && inRange(object, farmRange)));
  assert.ok(level.tiles.slice(farmRange.y0, farmRange.y1 + 1).some((row) =>
    row.slice(farmRange.x0, farmRange.x1 + 1).includes('B')
  ));
  const graveMarkers = level.objects.filter((object) => object.kind === 'calcified-grave-marker');
  assert.ok(graveMarkers.some((object) => inRange(object, graveyardRange)));
  assert.equal(graveMarkers.every((object) => !['r', 's'].includes(level.tiles[object.y][object.x])), true);
  assert.ok(level.objects.some((object) => object.kind === 'dead-cultist' && inRange(object, killRange)));
  assert.ok(level.objects.some((object) => object.kind.startsWith('dead-host-wolf-') && inRange(object, killRange)));
}

{
  for (const kind of ['dead-host-wolf-spider', 'dead-host-wolf-maw', 'dead-host-wolf-ribsplit']) {
    assert.ok(getSprite(kind), `${kind} is registered`);
    assert.ok(level.objects.some((object) => object.kind === kind), `${kind} is placed`);
  }
}

{
  const isExit = (x, y) =>
    (y === 0 && x >= 113 && x <= 119) ||
    (y === level.height - 1 && x >= 138 && x <= 146);
  for (let x = 0; x < level.width; x += 1) {
    if (!isExit(x, 0)) assert.equal(grid.isWalkable(x, 0), false, `top edge ${x},0 is blocked`);
    if (!isExit(x, level.height - 1)) {
      assert.equal(grid.isWalkable(x, level.height - 1), false, `bottom edge ${x},${level.height - 1} is blocked`);
    }
  }
  for (let y = 1; y < level.height - 1; y += 1) {
    assert.equal(grid.isWalkable(0, y), false, `left edge 0,${y} is blocked`);
    assert.equal(grid.isWalkable(level.width - 1, y), false, `right edge ${level.width - 1},${y} is blocked`);
  }
}
