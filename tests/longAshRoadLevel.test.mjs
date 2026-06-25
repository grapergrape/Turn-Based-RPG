import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import { getSprite } from '../src/render/spriteCatalog.js';
import { Grid } from '../src/world/Grid.js';
import { isTargetInReach, resolveInteractionTargetAtCell } from '../src/world/InteractionTargeting.js';

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

function adjacentWalkable(grid, cell) {
  for (const offset of [
    { x: 0, y: 1 },
    { x: 0, y: -1 },
    { x: 1, y: 0 },
    { x: -1, y: 0 },
    { x: 1, y: 1 },
    { x: -1, y: 1 },
    { x: 1, y: -1 },
    { x: -1, y: -1 }
  ]) {
    const candidate = { x: cell.x + offset.x, y: cell.y + offset.y };
    if (grid.isWalkable(candidate.x, candidate.y)) return candidate;
  }
  return null;
}

function buildingComponents(level) {
  const seen = new Set();
  const components = [];
  const dirs = [
    { x: 1, y: 0 },
    { x: -1, y: 0 },
    { x: 0, y: 1 },
    { x: 0, y: -1 }
  ];
  for (let y = 0; y < level.height; y += 1) {
    for (let x = 0; x < level.width; x += 1) {
      if (level.tiles[y][x] !== 'B') continue;
      const startKey = `${x},${y}`;
      if (seen.has(startKey)) continue;
      const queue = [{ x, y }];
      seen.add(startKey);
      let count = 0;
      for (let index = 0; index < queue.length; index += 1) {
        const cell = queue[index];
        count += 1;
        for (const dir of dirs) {
          const next = { x: cell.x + dir.x, y: cell.y + dir.y };
          const key = `${next.x},${next.y}`;
          if (
            next.x < 0 ||
            next.y < 0 ||
            next.x >= level.width ||
            next.y >= level.height ||
            seen.has(key) ||
            level.tiles[next.y][next.x] !== 'B'
          ) {
            continue;
          }
          seen.add(key);
          queue.push(next);
        }
      }
      components.push(count);
    }
  }
  return components;
}

const level = await readJson('../data/levels/long_ash_road_approach.json');
const grid = new Grid(level);
addBlockingObjects(grid, level.objects ?? []);
const farmInteriors = [
  {
    key: 'farmhouse',
    level: await readJson('../data/levels/long_ash_farmhouse_interior.json'),
    exitDialogue: 'long-ash-farmhouse-exit',
    requiredKinds: ['farm-door', 'dining-table', 'dining-bench', 'kitchen-hearth', 'kitchen-counter', 'pantry-shelf', 'wash-tub']
  },
  {
    key: 'barn',
    level: await readJson('../data/levels/long_ash_barn_interior.json'),
    exitDialogue: 'long-ash-barn-exit',
    requiredKinds: ['farm-door', 'hay-rick', 'feed-trough', 'field-cart', 'field-plow', 'rusted-barrel']
  },
  {
    key: 'storage',
    level: await readJson('../data/levels/long_ash_storage_shed_interior.json'),
    exitDialogue: 'long-ash-storage-shed-exit',
    requiredKinds: ['farm-door', 'sealed-storage-crate', 'rusted-crate', 'rusted-barrel', 'pantry-shelf']
  },
  {
    key: 'grain',
    level: await readJson('../data/levels/long_ash_grain_shed_interior.json'),
    exitDialogue: 'long-ash-grain-shed-exit',
    requiredKinds: ['farm-door', 'hay-rick', 'feed-trough', 'woodpile', 'rusted-barrel']
  },
  {
    key: 'tool',
    level: await readJson('../data/levels/long_ash_tool_shed_interior.json'),
    exitDialogue: 'long-ash-tool-shed-exit',
    requiredKinds: ['farm-door', 'tool-rack', 'field-plow', 'field-harrow', 'wagon-wheel', 'rusted-crate']
  }
];
const farmExitDialogues = new Map([
  ['long-ash-farmhouse-exit', await readJson('../data/dialogue/long-ash-farmhouse-exit.json')],
  ['long-ash-barn-exit', await readJson('../data/dialogue/long-ash-barn-exit.json')],
  ['long-ash-storage-shed-exit', await readJson('../data/dialogue/long-ash-storage-shed-exit.json')],
  ['long-ash-grain-shed-exit', await readJson('../data/dialogue/long-ash-grain-shed-exit.json')],
  ['long-ash-tool-shed-exit', await readJson('../data/dialogue/long-ash-tool-shed-exit.json')]
]);

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
  const farmBuilding = getSprite('farm-building-block');
  assert.ok(farmBuilding, 'farm-building-block is registered');
  assert.equal(farmBuilding.block, true, 'farm-building-block is a tile block');
  assert.deepEqual(
    buildingComponents(level).sort((a, b) => a - b),
    [30, 30, 49, 72, 81],
    'farm compound keeps the five planned farmhouse, barn, and shed footprints'
  );
  assert.ok(level.objects.some((object) => object.kind === 'farm-fence' && inRange(object, farmRange)));
  assert.ok(level.objects.some((object) => object.kind === 'field-cart' && inRange(object, farmRange)));
  const farmDoor = getSprite('farm-door');
  assert.ok(farmDoor, 'farm-door is registered');
  assert.equal(farmDoor.category, 'structure');
  const expectedFarmDoors = [
    { id: 'farmhouse-door', x: 21, y: 51, wallPlane: 'sw', use: { x: 21, y: 52 }, dialogue: 'long-ash-farmhouse-door', returnDialogue: 'long-ash-farmhouse-exit', locked: false },
    { id: 'barn-door', x: 36, y: 50, wallPlane: 'sw', use: { x: 36, y: 51 }, dialogue: 'long-ash-barn-door', returnDialogue: 'long-ash-barn-exit', locked: false },
    { id: 'storage-shed-door', x: 25, y: 60, wallPlane: 'sw', use: { x: 25, y: 61 }, dialogue: 'long-ash-storage-shed-door', returnDialogue: 'long-ash-storage-shed-exit', locked: false },
    { id: 'grain-shed-door', x: 33, y: 60, wallPlane: 'sw', use: { x: 33, y: 61 }, dialogue: 'long-ash-grain-shed-door', returnDialogue: 'long-ash-grain-shed-exit', locked: false },
    { id: 'tool-shed-door', x: 20, y: 57, wallPlane: 'se', use: { x: 21, y: 57 }, dialogue: 'long-ash-tool-shed-door', returnDialogue: 'long-ash-tool-shed-exit', locked: true }
  ];
  const expectedDoorSnapshot = expectedFarmDoors.map(({ use, returnDialogue, ...door }) => door);
  assert.deepEqual(
    level.dialogue,
    expectedFarmDoors.map((door) => door.dialogue),
    'farm door dialogues are loaded with the road level'
  );
  const actualFarmDoors = level.objects
    .filter((object) => object.kind === 'farm-door' && inRange(object, farmRange))
    .map((object) => ({
      id: object.id,
      x: object.x,
      y: object.y,
      wallPlane: object.wallPlane,
      dialogue: object.interact?.dialogue,
      locked: Boolean(object.interact?.lock)
    }))
    .sort((a, b) => a.y - b.y || a.x - b.x || a.id.localeCompare(b.id));
  assert.deepEqual(
    actualFarmDoors,
    expectedDoorSnapshot.slice().sort((a, b) => a.y - b.y || a.x - b.x || a.id.localeCompare(b.id)),
    'farm buildings expose clickable doors with the tool shed locked'
  );
  assert.equal(
    level.objects
      .filter((object) => object.kind === 'farm-door' && inRange(object, farmRange))
      .every((object) => object.blocking === true && object.interact?.type === 'secret-entrance'),
    true,
    'farm exterior doors are blocking interactables that transition into interiors'
  );
  for (const expectedDoor of expectedFarmDoors) {
    const door = level.objects.find((object) => object.id === expectedDoor.id);
    assert.ok(door, `${expectedDoor.id} is placed`);
    assert.equal(level.tiles[door.y][door.x], 'B', `${door.id} is mounted on a farm building wall cell`);
    assert.equal(door.wallPlane, expectedDoor.wallPlane, `${door.id} defines its wall plane`);
    assert.equal(grid.isWalkable(expectedDoor.use.x, expectedDoor.use.y), true, `${door.id} has a walkable authored use tile`);
    assert.equal(
      Math.max(Math.abs(expectedDoor.use.x - door.x), Math.abs(expectedDoor.use.y - door.y)) <= 1,
      true,
      `${door.id} use tile is adjacent to the wall-mounted target`
    );
    const target = resolveInteractionTargetAtCell({
      cell: { x: door.x, y: door.y },
      grid,
      player: { position: expectedDoor.use },
      actors: [],
      enemies: [],
      interactables: level.objects.filter((object) => object.interact),
      mode: 'explore'
    });
    assert.equal(target.type, 'object', `${door.id} resolves as an object target`);
    assert.equal(target.object.id, door.id, `${door.id} is the resolved target`);
    assert.equal(isTargetInReach({ position: expectedDoor.use }, target), true, `${door.id} is clickable from its authored use tile`);
    const exitScene = farmExitDialogues.get(expectedDoor.returnDialogue);
    assert.ok(exitScene, `${door.id} has a return dialogue scene`);
    const returnChoice = exitScene.nodes.start.choices.find((choice) =>
      choice.effects?.loadLevel?.path === './data/levels/long_ash_road_approach.json'
    );
    assert.ok(returnChoice, `${door.id} return dialogue loads the farmyard`);
    assert.deepEqual(returnChoice.effects.loadLevel.player, expectedDoor.use, `${door.id} returns to its authored use tile`);
  }
  const expectedFarmMachinery = [
    { kind: 'water-pump', x: 15, y: 52, orient: null, blocking: true },
    { kind: 'wagon-wheel', x: 26, y: 52, orient: null, blocking: true },
    { kind: 'feed-trough', x: 18, y: 53, orient: 'se', blocking: true },
    { kind: 'field-plow', x: 23, y: 52, orient: 'sw', blocking: true },
    { kind: 'field-harrow', x: 26, y: 50, orient: 'sw', blocking: true },
    { kind: 'tool-rack', x: 34, y: 53, orient: null, blocking: true },
    { kind: 'woodpile', x: 29, y: 57, orient: null, blocking: true },
    { kind: 'field-plow', x: 21, y: 59, orient: 'se', blocking: true },
    { kind: 'field-harrow', x: 30, y: 55, orient: 'sw', blocking: true },
    { kind: 'feed-trough', x: 22, y: 59, orient: 'sw', blocking: true }
  ];
  const machineryKinds = new Set(expectedFarmMachinery.map((object) => object.kind));
  const actualFarmMachinery = level.objects
    .filter((object) => machineryKinds.has(object.kind) && inRange(object, farmRange))
    .map((object) => ({
      kind: object.kind,
      x: object.x,
      y: object.y,
      orient: object.orient ?? null,
      blocking: object.blocking === true
    }))
    .sort((a, b) => a.y - b.y || a.x - b.x || a.kind.localeCompare(b.kind));
  const sortedExpectedFarmMachinery = expectedFarmMachinery
    .slice()
    .sort((a, b) => a.y - b.y || a.x - b.x || a.kind.localeCompare(b.kind));
  assert.deepEqual(actualFarmMachinery, sortedExpectedFarmMachinery, 'farm yard machinery matches the planning map layout');
  for (const kind of machineryKinds) {
    assert.ok(getSprite(kind), `${kind} is registered`);
  }
  const farmVictim = getSprite('farm-cross-victim');
  assert.ok(farmVictim, 'farm-cross-victim is registered');
  assert.equal(farmVictim.category, 'gore');
  const expectedFarmVictims = [
    { x: 27, y: 51, member: 'father', blocking: true },
    { x: 29, y: 51, member: 'mother', blocking: true },
    { x: 31, y: 51, member: 'grandparent', blocking: true },
    { x: 33, y: 51, member: 'older-child', blocking: true },
    { x: 35, y: 51, member: 'younger-child', blocking: true }
  ];
  const actualFarmVictims = level.objects
    .filter((object) => object.kind === 'farm-cross-victim')
    .map((object) => ({
      x: object.x,
      y: object.y,
      member: object.member,
      blocking: object.blocking === true
    }))
    .sort((a, b) => a.y - b.y || a.x - b.x || a.member.localeCompare(b.member));
  assert.deepEqual(actualFarmVictims, expectedFarmVictims, 'farm cult scene has five crucified family victims');
  assert.deepEqual(
    actualFarmVictims.map((object) => object.y),
    [51, 51, 51, 51, 51],
    'farm family victims stand together on one row'
  );
  assert.deepEqual(
    actualFarmVictims.map((object) => object.x),
    [27, 29, 31, 33, 35],
    'farm family victims have exactly one open tile between each cross'
  );
  assert.equal(
    actualFarmVictims.every((object) => inRange(object, farmRange)),
    true,
    'farm family victims stay inside the farm fence'
  );
  assert.equal(
    actualFarmVictims.every((object) => level.tiles[object.y][object.x] !== 'B'),
    true,
    'farm family victims stay out of building footprints'
  );
  assert.equal(
    actualFarmVictims.every((object) => !grid.isWalkable(object.x, object.y)),
    true,
    'farm family victim crosses block their occupied tiles'
  );
  assert.ok(
    level.objects.some((object) => object.kind === 'blood-sigil' && inRange(object, farmRange)),
    'cult blood sigils are placed inside the farm murder scene'
  );
  assert.ok(level.tiles.slice(farmRange.y0, farmRange.y1 + 1).some((row) =>
    row.slice(farmRange.x0, farmRange.x1 + 1).includes('B')
  ));
  const graveBody = getSprite('calcified-grave-body');
  assert.ok(graveBody, 'calcified-grave-body is registered');
  assert.equal(graveBody.category, 'creature');
  const graveBodies = level.objects.filter((object) => object.kind === 'calcified-grave-body');
  assert.equal(graveBodies.length, 11, 'graveyard has eleven calcified bodies');
  assert.equal(level.objects.filter((object) => object.kind === 'calcified-grave-marker').length, 0, 'placeholder grave markers are retired');
  assert.equal(graveBodies.every((object) => inRange(object, graveyardRange)), true, 'calcified bodies stay inside the graveyard');
  assert.equal(graveBodies.every((object) => object.blocking === true), true, 'calcified bodies block their occupied tiles');
  assert.equal(
    graveBodies.every((object) => typeof object.name === 'string' && object.name.trim() !== ''),
    true,
    'each calcified body has a readable name'
  );
  assert.equal(
    new Set(graveBodies.map((object) => object.name)).size,
    graveBodies.length,
    'grave names are unique'
  );
  assert.equal(
    new Set(graveBodies.map((object) => object.variant)).size,
    graveBodies.length,
    'grave art variants are unique'
  );
  assert.equal(
    graveBodies.every((object) => object.interact?.type === 'note' && typeof object.interact.log === 'string' && object.interact.log.trim() !== ''),
    true,
    'each calcified body is inspectable'
  );
  assert.equal(graveBodies.every((object) => !['r', 's'].includes(level.tiles[object.y][object.x])), true, 'grave bodies stay off road tiles');
  for (const body of graveBodies) {
    const playerCell = adjacentWalkable(grid, body);
    assert.ok(playerCell, `${body.name} has a walkable adjacent use tile`);
    const target = resolveInteractionTargetAtCell({
      cell: { x: body.x, y: body.y },
      grid,
      player: { position: playerCell },
      actors: [],
      enemies: [],
      interactables: level.objects.filter((object) => object.interact),
      mode: 'explore'
    });
    assert.equal(target.type, 'object', `${body.name} resolves as an object target`);
    assert.equal(target.object.id, body.id, `${body.name} is the resolved target`);
    assert.equal(isTargetInReach({ position: playerCell }, target), true, `${body.name} is clickable from an adjacent tile`);
  }
  const ringGraves = graveBodies.filter((object) =>
    (object.interact?.search?.methods ?? []).some((method) =>
      (method.success?.inventory?.add ?? []).some((entry) => entry.item === 'mourning-ring')
    )
  );
  assert.equal(ringGraves.length, 1, 'one grave has Search-gated loot');
  assert.equal(ringGraves[0].name, 'Ilyen Marr');
  assert.equal(ringGraves[0].interact.loot, undefined, 'Ilyen Marr has no normal loot array');
  const search = ringGraves[0].interact.search;
  assert.equal(search.methods.length, 1);
  const ringMethod = search.methods[0];
  assert.equal(ringMethod.id, 'read-disturbed-ash');
  assert.equal(ringMethod.label, 'Read the disturbed ash');
  assert.equal(ringMethod.field, 'search');
  assert.equal(ringMethod.dc, 40);
  assert.equal(ringMethod.success?.setFlag, 'looted-ilyen-marr-grave');
  assert.deepEqual(ringMethod.success?.inventory?.add, [{ item: 'mourning-ring', count: 1 }]);
  assert.ok(level.objects.some((object) => object.kind === 'dead-cultist' && inRange(object, killRange)));
  assert.ok(level.objects.some((object) => object.kind.startsWith('dead-host-wolf-') && inRange(object, killRange)));
}

{
  for (const spec of farmInteriors) {
    const interior = spec.level;
    const interiorGrid = new Grid(interior);
    addBlockingObjects(interiorGrid, interior.objects ?? []);
    assert.equal(interior.tileSize, 64, `${spec.key} interior uses the standard tile size`);
    assert.ok(interior.quests.includes('investigate-ash-chapel-cult'), `${spec.key} interior keeps the Act I quest context`);
    assert.ok(interior.dialogue.includes(spec.exitDialogue), `${spec.key} interior lists its exit dialogue`);
    assert.equal(interiorGrid.isWalkable(interior.spawns.player.x, interior.spawns.player.y), true, `${spec.key} spawn is walkable`);

    const exit = interior.objects.find((object) => object.kind === 'farm-door' && object.interact?.dialogue === spec.exitDialogue);
    assert.ok(exit, `${spec.key} interior has a clickable exit door`);
    assert.equal(exit.blocking, true, `${spec.key} exit door blocks its tile`);
    assert.equal(exit.wallPlane ?? null, null, `${spec.key} interior keeps the legacy floor-door render mode`);
    assert.equal(interior.tiles[exit.y][exit.x], '.', `${spec.key} interior exit door remains on a floor tile`);
    assert.equal(exit.interact?.type, 'secret-exit', `${spec.key} exit door returns to the farmyard`);
    assert.equal(
      Math.max(Math.abs(interior.spawns.player.x - exit.x), Math.abs(interior.spawns.player.y - exit.y)) <= 1,
      true,
      `${spec.key} spawn starts within reach of its exit door`
    );

    const kinds = new Set((interior.objects ?? []).map((object) => object.kind));
    for (const kind of spec.requiredKinds) {
      assert.ok(kinds.has(kind), `${spec.key} interior contains ${kind}`);
      assert.ok(getSprite(kind), `${kind} is registered for ${spec.key} interior`);
    }
  }
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
