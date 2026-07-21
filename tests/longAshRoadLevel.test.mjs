import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import { meetsDialogueConditions } from '../src/core/DialogueConditions.js';
import { buildJournalUpdateSnapshot, journalUpdatedSections } from '../src/core/JournalState.js';
import { getSprite } from '../src/render/spriteCatalog.js';
import { Grid } from '../src/world/Grid.js';
import { isTargetInReach, resolveInteractionTargetAtCell } from '../src/world/InteractionTargeting.js';
import { syncObjectFlagState } from '../src/world/ObjectFlagState.js';

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

function hasReachableAdjacentCell(grid, start, cell) {
  return [
    { x: 0, y: 1 },
    { x: 0, y: -1 },
    { x: 1, y: 0 },
    { x: -1, y: 0 },
    { x: 1, y: 1 },
    { x: -1, y: 1 },
    { x: 1, y: -1 },
    { x: -1, y: -1 }
  ].some((offset) => {
    const target = { x: cell.x + offset.x, y: cell.y + offset.y };
    return grid.isWalkable(target.x, target.y) && pathExists(grid, start, target);
  });
}

function visibleChoiceLabels(node, state = {}) {
  return (node.choices ?? [])
    .filter((choice) => meetsDialogueConditions(choice.conditions, state))
    .map((choice) => choice.label);
}

function isFarmBuildingTile(level, x, y) {
  const tile = level.tiles[y]?.[x];
  const kind = level.legend?.[tile]?.kind;
  return typeof kind === 'string' && kind.endsWith('building-block');
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
      if (!isFarmBuildingTile(level, x, y)) continue;
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
            !isFarmBuildingTile(level, next.x, next.y)
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

const FARM_BUILDING_SPECS = [
  { tile: 'H', kind: 'farmhouse-building-block', x0: 17, x1: 25, y0: 43, y1: 51, count: 81 },
  { tile: 'B', kind: 'barn-building-block', x0: 28, x1: 36, y0: 43, y1: 50, count: 72 },
  { tile: 'T', kind: 'tool-shed-building-block', x0: 14, x1: 20, y0: 54, y1: 60, count: 49 },
  { tile: 'S', kind: 'storage-shed-building-block', x0: 23, x1: 28, y0: 56, y1: 60, count: 30 },
  { tile: 'G', kind: 'grain-shed-building-block', x0: 31, x1: 36, y0: 56, y1: 60, count: 30 }
];

const GRAVEYARD_CHAPEL_SPECS = [
  { tile: 'V', kind: 'graveyard-vigil-chapel-block', x0: 130, x1: 131, y0: 45, y1: 46, count: 4 },
  { tile: 'M', kind: 'graveyard-mortuary-chapel-block', x0: 141, x1: 142, y0: 44, y1: 46, count: 6 }
];

function buildingCells(level, kind) {
  const cells = [];
  for (let y = 0; y < level.height; y += 1) {
    for (let x = 0; x < level.width; x += 1) {
      const tile = level.tiles[y]?.[x];
      if (level.legend?.[tile]?.kind === kind) cells.push({ x, y });
    }
  }
  return cells;
}

function expectedFootprintCells(spec) {
  const cells = [];
  for (let y = spec.y0; y <= spec.y1; y += 1) {
    for (let x = spec.x0; x <= spec.x1; x += 1) {
      cells.push({ x, y });
    }
  }
  return cells;
}

const level = await readJson('../data/levels/long_ash_road_approach.json');
const grid = new Grid(level);
addBlockingObjects(grid, level.objects ?? []);
const caveLevel = await readJson('../data/levels/long_ash_infected_cave.json');
const caveGrid = new Grid(caveLevel);
addBlockingObjects(caveGrid, caveLevel.objects ?? []);
const crossroadBrotherDialogue = await readJson('../data/dialogue/long-ash-crossroad-brother.json');
const fieldBrotherDialogue = await readJson('../data/dialogue/long-ash-field-brother.json');
const carterDialogue = await readJson('../data/dialogue/long-ash-carter-edda-farr.json');
const carterActor = await readJson('../data/actors/long-ash-carter-edda-farr.json');
const eddaQuest = await readJson('../data/quests/edda-farrs-account.json');
const stageIvAmbushDialogue = await readJson('../data/dialogue/long-ash-stage-iv-cart-ambush.json');
const stageIvLure = await readJson('../data/enemies/stage-iv-lure.json');
const stageIvRunner = await readJson('../data/enemies/stage-iv-runner.json');
const caveEntranceDialogue = await readJson('../data/dialogue/long-ash-infected-cave-entrance.json');
const caveExitDialogue = await readJson('../data/dialogue/long-ash-infected-cave-exit.json');
const pilgrimRibguard = await readJson('../data/items/pilgrim-ribguard.json');
const farmInteriors = [
  {
    key: 'farmhouse',
    level: await readJson('../data/levels/long_ash_farmhouse_interior.json'),
    exitDialogue: 'long-ash-farmhouse-exit',
    doorVariant: 'farmhouse',
    doorWallPlane: 'sw',
    wallKind: 'farmhouse-interior-wall',
    floorStyle: 'farm-plank',
    requiredKinds: ['farm-door', 'farm-bed', 'dining-table', 'dining-bench', 'farm-kitchen-hearth', 'farm-prep-table', 'kitchen-counter', 'pantry-shelf', 'grain-sack-stack', 'wash-tub'],
    dressingKinds: ['wax-stain', 'paper-scraps'],
    minBlocking: 15,
    minPerimeterBlocking: 11,
    aisleTarget: { x: 9, y: 3 }
  },
  {
    key: 'barn',
    level: await readJson('../data/levels/long_ash_barn_interior.json'),
    exitDialogue: 'long-ash-barn-exit',
    doorVariant: 'barn',
    doorWallPlane: 'sw',
    wallKind: 'barn-interior-wall',
    floorStyle: 'packed-earth',
    requiredKinds: ['farm-door', 'hay-rick', 'feed-trough', 'stable-divider', 'grain-sack-stack', 'field-cart', 'field-plow', 'field-harrow', 'farm-workbench', 'tool-rack', 'rusted-barrel'],
    dressingKinds: ['chaff-scatter'],
    minBlocking: 23,
    minPerimeterBlocking: 18,
    aisleTarget: { x: 8, y: 3 }
  },
  {
    key: 'storage',
    level: await readJson('../data/levels/long_ash_storage_shed_interior.json'),
    exitDialogue: 'long-ash-storage-shed-exit',
    doorVariant: 'storage-shed',
    doorWallPlane: 'sw',
    wallKind: 'shed-interior-wall',
    floorStyle: 'packed-earth',
    requiredKinds: ['farm-door', 'sealed-storage-crate', 'rusted-crate', 'rusted-barrel', 'pantry-shelf', 'grain-sack-stack'],
    dressingKinds: ['paper-scraps', 'cobweb'],
    minBlocking: 12,
    minPerimeterBlocking: 10,
    aisleTarget: { x: 6, y: 3 }
  },
  {
    key: 'grain',
    level: await readJson('../data/levels/long_ash_grain_shed_interior.json'),
    exitDialogue: 'long-ash-grain-shed-exit',
    doorVariant: 'grain-shed',
    doorWallPlane: 'sw',
    wallKind: 'shed-interior-wall',
    floorStyle: 'packed-earth',
    requiredKinds: ['farm-door', 'grain-bin', 'grain-sack-stack', 'farm-prep-table', 'rusted-barrel'],
    dressingKinds: ['chaff-scatter'],
    minBlocking: 11,
    minPerimeterBlocking: 10,
    aisleTarget: { x: 6, y: 3 }
  },
  {
    key: 'tool',
    level: await readJson('../data/levels/long_ash_tool_shed_interior.json'),
    exitDialogue: 'long-ash-tool-shed-exit',
    doorVariant: 'tool-shed',
    doorWallPlane: 'sw',
    wallKind: 'shed-interior-wall',
    floorStyle: 'packed-earth',
    requiredKinds: ['farm-door', 'tool-rack', 'farm-workbench', 'field-plow', 'field-harrow', 'wagon-wheel', 'woodpile', 'rusted-crate'],
    dressingKinds: ['machine-oil', 'floor-crack'],
    floorCrackMin: 2,
    minBlocking: 11,
    minPerimeterBlocking: 9,
    aisleTarget: { x: 6, y: 3 }
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
  assert.deepEqual(level.mood, {
    floorShade: '#15130e',
    floorShadeAlpha: 0.02,
    ambient: '#b8aa83',
    ambientAlpha: 0.09,
    vignette: 0.24,
    sun: {
      enabled: true,
      shadowOffsetX: 12,
      shadowOffsetY: 6,
      shadowAlpha: 0.12
    }
  }, 'Long Ash Road keeps the brighter midday outdoor lighting profile');
}

{
  const spawn = level.spawns.player;
  assert.deepEqual(spawn, { actor: 'mara-vey', x: 142, y: 68 });
  assert.equal(level.spawns.npcs.length, 1, 'Deborah Carbo is the only living road NPC');
  assert.deepEqual(level.spawns.npcs[0], {
    actor: 'long-ash-carter-edda-farr',
    x: 118,
    y: 47,
    facing: 'sw',
    dialogue: 'long-ash-carter-edda-farr',
    ambient: ['The dry sacks went north. The wet one stayed honest.'],
    mapMarker: { label: 'Deborah Carbo', kind: 'dialogue', reveal: 'explored' }
  });
  assert.equal(pathExists(grid, spawn, { x: 118, y: 47 }), true, 'start reaches Deborah Carbo at the capital spur');
  assert.equal(grid.isWalkable(spawn.x, spawn.y), true);
  assert.equal(pathExists(grid, spawn, { x: 113, y: 32 }), true, 'start reaches the forest crossroad use tile');
  assert.equal(pathExists(grid, spawn, { x: 116, y: 4 }), true, 'start reaches the north road edge');
}

{
  assert.equal(carterActor.id, 'long-ash-carter-edda-farr');
  assert.equal(carterActor.name, 'Deborah Carbo');
  assert.equal(carterActor.faction, 'ash-road-traders');
  assert.deepEqual(carterActor.appearance, {
    body: 'average',
    outfit: 'settlement-work-coat',
    gear: ['bandage-sling'],
    accent: 'bare-brown'
  });

  const carterGates = [
    { next: 'road-account', field: 'speech', dc: 40, flag: 'long-ash-carter-road-account-heard' },
    { next: 'wheel-crush', field: 'medicine', dc: 45, flag: 'long-ash-carter-wheel-crush-read' },
    { next: 'office-wax', field: 'guile', dc: 55, flag: 'long-ash-carter-cart-knot-revealed' }
  ];
  for (const expected of carterGates) {
    const choice = carterDialogue.nodes['road-topics'].choices.find((entry) => entry.next === expected.next);
    assert.ok(choice, `Deborah offers ${expected.next}`);
    assert.deepEqual(choice.conditions.fieldRatings, { [expected.field]: expected.dc });
    assert.deepEqual(choice.conditions.flagsAbsent, [expected.flag]);
    assert.equal(choice.effects.setFlag, expected.flag);
    assert.equal(
      meetsDialogueConditions(choice.conditions, {
        fieldRating: (field) => (field === expected.field ? expected.dc - 1 : 100)
      }),
      false,
      `${expected.next} is hidden one point below its threshold`
    );
    assert.equal(
      meetsDialogueConditions(choice.conditions, {
        fieldRating: (field) => (field === expected.field ? expected.dc : 100)
      }),
      true,
      `${expected.next} is available at its threshold`
    );
  }
  assert.ok(
    carterDialogue.nodes['road-topics'].choices.some((choice) => choice.next === 'charcoal' && !choice.conditions),
    'Deborah keeps an ordinary no-stat conversation route'
  );

  assert.deepEqual(carterDialogue.nodes.start.conditions, {
    questStages: { 'edda-farrs-account': 'disputed-count' }
  }, 'Deborah resumes the disputed count if the conversation is interrupted');
  assert.equal(carterDialogue.nodes.start.else, 'ordinary-start');

  const taskChoice = carterDialogue.nodes['stolen-account'].choices.find((choice) => choice.next === 'task-accepted');
  assert.equal(taskChoice.effects.setFlag, 'long-ash-edda-purse-tasked');
  assert.deepEqual(taskChoice.effects.questUpdate, {
    quest: 'edda-farrs-account',
    stage: 'find-purse',
    log: 'Deborah asked you to recover a flat purse with twenty ducats from her stolen charcoal cart.'
  });

  const returnChoice = carterDialogue.nodes['ordinary-start'].choices.find((choice) => choice.next === 'start');
  assert.deepEqual(returnChoice.conditions, {
    questStages: { 'edda-farrs-account': 'return-purse' },
    items: { ducat: 20 }
  });
  assert.deepEqual(returnChoice.effects.inventory.remove, [
    { item: 'ducat', count: 20, failLog: 'The flat purse no longer holds twenty ducats.' }
  ]);
  assert.equal(returnChoice.effects.inventory.requireAll, true);
  assert.equal(returnChoice.effects.questUpdate.stage, 'disputed-count');

  const settlementChoices = carterDialogue.nodes.start.choices;
  const payFive = settlementChoices.find((choice) => choice.next === 'paid-five');
  const refuseFive = settlementChoices.find((choice) => choice.next === 'refused-five');
  const threaten = settlementChoices.find((choice) => choice.next === 'threatened');
  assert.deepEqual(payFive.conditions, { items: { ducat: 5 } });
  assert.deepEqual(payFive.effects.inventory.remove, [
    { item: 'ducat', count: 5, failLog: 'Deborah waits for five more ducats.' }
  ]);
  assert.equal(payFive.effects.questUpdate.stage, 'complete');
  assert.equal(refuseFive.effects.setFlag, 'long-ash-edda-refused-five');
  assert.equal(refuseFive.effects.questUpdate.stage, 'complete');
  assert.equal(threaten.tone, 'danger');
  assert.equal(threaten.effects.setFlag, 'long-ash-edda-threatened-over-count');
  assert.equal(threaten.effects.questUpdate.stage, 'complete');
  assert.match(carterDialogue.nodes['paid-five'].lines.join(' '), /pray for your generous soul/i);
  assert.match(carterDialogue.nodes.threatened.lines.join(' '), /Censure arithmetic/);

  assert.equal(eddaQuest.id, 'edda-farrs-account');
  assert.equal(eddaQuest.initialStage, 'speak-to-edda');
  assert.deepEqual(
    eddaQuest.stages.map((stage) => stage.id),
    ['speak-to-edda', 'find-purse', 'return-purse', 'disputed-count', 'complete']
  );
  assert.equal(eddaQuest.stages.find((stage) => stage.id === 'complete')?.xp, 20);

  const eddaJournalBase = {
    questDefs: { [eddaQuest.id]: eddaQuest },
    questStages: new Map([[eddaQuest.id, 'speak-to-edda']]),
    questReached: new Map([[eddaQuest.id, new Set(['speak-to-edda'])]]),
    journalNotes: level.journalNotes,
    flags: new Set()
  };
  const beforeTask = buildJournalUpdateSnapshot(eddaJournalBase);
  const afterTask = buildJournalUpdateSnapshot({
    ...eddaJournalBase,
    questStages: new Map([[eddaQuest.id, 'find-purse']]),
    questReached: new Map([[eddaQuest.id, new Set(['speak-to-edda', 'find-purse'])]])
  });
  assert.deepEqual(
    journalUpdatedSections(beforeTask, afterTask),
    ['QUESTS', 'NOTES'],
    'accepting Deborah\'s task produces the live journal update notice'
  );
  const afterSparedAccount = buildJournalUpdateSnapshot({
    ...eddaJournalBase,
    flags: new Set(['long-ash-edda-spared-account-heard'])
  });
  assert.deepEqual(
    journalUpdatedSections(beforeTask, afterSparedAccount),
    ['NOTES'],
    'learning why Deborah survived produces a journal finding notice'
  );

  const wheel = level.objects.find((object) => object.id === 'long-ash-edda-detached-wheel');
  const sacks = level.objects.find((object) => object.id === 'long-ash-edda-charcoal-sacks');
  assert.deepEqual(
    { kind: wheel?.kind, x: wheel?.x, y: wheel?.y, blocking: wheel?.blocking },
    { kind: 'wagon-wheel', x: 120, y: 48, blocking: true },
    'Deborah stands beside the detached wheel left by the thieves'
  );
  assert.deepEqual(
    { kind: sacks?.kind, x: sacks?.x, y: sacks?.y, blocking: sacks?.blocking },
    { kind: 'grain-sack-stack', x: 121, y: 49, blocking: true },
    'the cart has a separate stack of charcoal sacks'
  );
  assert.equal(pathExists(grid, level.spawns.player, { x: 118, y: 47 }), true, 'the relocated carter keeps a clear talk lane');
  const journalFlags = new Set(level.journalNotes.map((note) => note.flag));
  for (const { flag } of carterGates) assert.ok(journalFlags.has(flag), `${flag} unlocks a journal finding`);
  assert.ok(journalFlags.has('long-ash-edda-spared-account-heard'));
  assert.ok(journalFlags.has('long-ash-stage-iv-cart-recognized'));
}

{
  const ashTree = getSprite('ash-tree');
  assert.ok(ashTree);
  assert.equal(ashTree.category, 'plant');
  assert.equal(ashTree.canopyRadius, 2);
  assert.ok(ashTree.canopyAlpha > 0 && ashTree.canopyAlpha < 1);
  for (const kind of ['ash-tree-stump', 'fallen-ash-log', 'ash-sapling', 'scrub-bush']) {
    const sprite = getSprite(kind);
    assert.ok(sprite, `${kind} is registered`);
    assert.equal(sprite.category, 'plant', `${kind} is a plant`);
  }

  const forestCounts = level.objects.reduce((counts, object) => {
    counts.set(object.kind, (counts.get(object.kind) ?? 0) + 1);
    return counts;
  }, new Map());
  assert.ok((forestCounts.get('ash-tree') ?? 0) >= 250, 'forest keeps a strong ash-tree canopy presence');
  assert.ok((forestCounts.get('ash-tree-stump') ?? 0) >= 40, 'forest includes stump silhouettes');
  assert.ok((forestCounts.get('fallen-ash-log') ?? 0) >= 40, 'forest includes fallen log silhouettes');
  assert.ok((forestCounts.get('ash-sapling') ?? 0) >= 30, 'forest includes saplings');

  const saplings = level.objects.filter((object) => object.kind === 'ash-sapling');
  assert.equal(saplings.every((object) => !object.blocking), true, 'ash saplings do not block movement');
  assert.equal(
    saplings.every((object) => level.tiles[object.y][object.x] === 'd'),
    true,
    'ash saplings stay on forest floor tiles'
  );
  assert.ok(
    saplings.some((object) => grid.isWalkable(object.x, object.y)),
    'player can walk through sapling cells'
  );
  assert.ok(
    level.objects.some((object) => object.kind === 'fallen-ash-log' && object.blocking),
    'fallen logs are used as grounded forest blockers'
  );

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

  const edrin = level.objects.find((object) => object.id === 'long-ash-field-brother');
  assert.ok(edrin, 'Eleazar Carbo is placed in the wheat field');
  assert.equal(
    wheatObjects.some((object) =>
      Math.abs(object.x - edrin.x) <= 2 && Math.abs(object.y - edrin.y) <= 2
    ),
    false,
    'Eleazar has enough open ground around him to read against the wheat models'
  );
  for (let y = edrin.y - 1; y <= edrin.y + 1; y += 1) {
    for (let x = edrin.x - 1; x <= edrin.x + 1; x += 1) {
      assert.equal(level.tiles[y][x], 'f', 'Eleazar stands inside a darker trampled field patch');
    }
  }
}

{
  const farmRange = { x0: 12, x1: 37, y0: 42, y1: 61 };
  const graveyardRange = { x0: 126, x1: 148, y0: 47, y1: 59 };
  const killRange = { x0: 95, x1: 106, y0: 31, y1: 37 };
  const caveRange = { x0: 80, x1: 100, y0: 4, y1: 17 };
  for (const { kind } of FARM_BUILDING_SPECS) {
    const farmBuilding = getSprite(kind);
    assert.ok(farmBuilding, `${kind} is registered`);
    assert.equal(farmBuilding.block, true, `${kind} is a tile block`);
    assert.equal(farmBuilding.category, 'structure', `${kind} is a structure`);
  }
  for (const spec of FARM_BUILDING_SPECS) {
    assert.equal(level.legend?.[spec.tile]?.kind, spec.kind, `${spec.tile} maps to ${spec.kind}`);
    assert.equal(level.legend?.[spec.tile]?.walkable, false, `${spec.kind} blocks movement through its tile`);
    assert.deepEqual(
      buildingCells(level, spec.kind),
      expectedFootprintCells(spec),
      `${spec.kind} uses its exact planned footprint`
    );
    assert.equal(buildingCells(level, spec.kind).length, spec.count, `${spec.kind} has its planned tile count`);
  }
  assert.equal(
    Object.values(level.legend).some((entry) => entry.kind === 'farm-building-block'),
    false,
    'generic farm-building-block is not used by the road legend'
  );
  assert.equal(
    level.objects.some((object) => object.kind === 'farm-building-block'),
    false,
    'generic farm-building-block has no generated road objects'
  );
  assert.deepEqual(
    buildingComponents(level).sort((a, b) => a - b),
    [30, 30, 49, 72, 81],
    'farm compound keeps the five planned farmhouse, barn, and shed footprints'
  );
  const chaffScatter = getSprite('chaff-scatter');
  assert.ok(chaffScatter, 'chaff-scatter is registered');
  assert.equal(chaffScatter.category, 'decal');
  assert.equal(chaffScatter.flat, true, 'chaff-scatter is a flat decal');
  assert.ok(level.objects.some((object) => object.kind === 'farm-fence' && inRange(object, farmRange)));
  assert.ok(level.objects.some((object) => object.kind === 'field-cart' && inRange(object, farmRange)));
  const farmDoor = getSprite('farm-door');
  assert.ok(farmDoor, 'farm-door is registered');
  assert.equal(farmDoor.category, 'structure');
  const expectedFarmDoors = [
    { id: 'farmhouse-door', x: 21, y: 51, tile: 'H', variant: 'farmhouse', wallPlane: 'sw', use: { x: 21, y: 52 }, dialogue: 'long-ash-farmhouse-door', returnDialogue: 'long-ash-farmhouse-exit', locked: false },
    { id: 'barn-door', x: 36, y: 50, tile: 'B', variant: 'barn', wallPlane: 'sw', use: { x: 36, y: 51 }, dialogue: 'long-ash-barn-door', returnDialogue: 'long-ash-barn-exit', locked: false },
    { id: 'storage-shed-door', x: 25, y: 60, tile: 'S', variant: 'storage-shed', wallPlane: 'sw', use: { x: 25, y: 61 }, dialogue: 'long-ash-storage-shed-door', returnDialogue: 'long-ash-storage-shed-exit', locked: false },
    { id: 'grain-shed-door', x: 33, y: 60, tile: 'G', variant: 'grain-shed', wallPlane: 'sw', use: { x: 33, y: 61 }, dialogue: 'long-ash-grain-shed-door', returnDialogue: 'long-ash-grain-shed-exit', locked: false },
    { id: 'tool-shed-door', x: 20, y: 57, tile: 'T', variant: 'tool-shed', wallPlane: 'se', use: { x: 21, y: 57 }, dialogue: 'long-ash-tool-shed-door', returnDialogue: 'long-ash-tool-shed-exit', locked: true }
  ];
  const expectedDoorSnapshot = expectedFarmDoors.map(({ use, returnDialogue, tile, ...door }) => door);
  assert.deepEqual(
    level.dialogue,
    [
      'long-ash-carter-edda-farr',
      'long-ash-stage-iv-cart-ambush',
      ...expectedFarmDoors.map((door) => door.dialogue),
      'long-ash-infected-cave-entrance',
      'long-ash-wolf-cultist-evidence',
      'long-ash-censure-road-camp-exit',
      'long-ash-crossroad-brother',
      'long-ash-field-brother',
      'long-ash-vigil-chapel-entry',
      'long-ash-mortuary-chapel-entry',
      'long-ash-listening-shortcut-return'
    ],
    'carter, farm door, cave entrance, camp exit, and calcified brother dialogues are loaded with the road level'
  );
  assert.ok(level.quests.includes('calcified-brothers'), 'Long Ash Road loads the calcified brothers quest');
  assert.ok(level.quests.includes('edda-farrs-account'), 'Long Ash Road loads Deborah Carbo\'s side quest');
  const fieldReportNode = fieldBrotherDialogue.nodes['report-check'];
  assert.equal(
    meetsDialogueConditions(fieldReportNode.conditions, {
      flags: new Set(),
      questStages: new Map([['calcified-brothers', 'family-known']])
    }),
    true,
    'Eleazar can report on the farm family even if the player found the victims before meeting him'
  );
  assert.deepEqual(
    fieldReportNode.effects,
    { setFlag: 'long-ash-field-brother-met' },
    'reporting the family state marks Eleazar as met without regressing the quest'
  );
  assert.equal(
    fieldReportNode.lines.some((line) => line.includes('Eleazar Carbo')),
    true,
    'family-first Eleazar report introduces him before asking for the answer'
  );
  for (const nodeId of ['first', 'first-mentioned', 'first-unknown']) {
    assert.equal(
      fieldBrotherDialogue.nodes[nodeId].lines.some((line) => line.includes('scare birds off Carbo grain')),
      true,
      `${nodeId} names Eleazar's scarecrow job on first contact`
    );
    assert.equal(
      fieldBrotherDialogue.nodes[nodeId].lines.some((line) => line.includes('my first law will make birds illegal')),
      true,
      `${nodeId} keeps Eleazar's king-and-birds line on first contact`
    );
  }
  assert.equal(
    fieldBrotherDialogue.nodes.field.lines.some((line) => line.includes('keep the birds off Carbo wheat')),
    true,
    'Eleazar explains the field job when asked why he is there'
  );
  assert.equal(
    crossroadBrotherDialogue.nodes.kind.choices.some((choice) => choice.label === 'Ask about his brother'),
    false,
    'Gideon does not expose a brother prompt before naming a brother'
  );
  const garronFarmPrompt = crossroadBrotherDialogue.nodes.kind.choices.find(
    (choice) => choice.label === 'Ask why he points to the farm'
  );
  assert.ok(garronFarmPrompt, 'Gideon offers a visible farm prompt before naming Eleazar');
  assert.equal(
    garronFarmPrompt.next,
    'history',
    'the farm prompt explains Gideon\'s fixed Stilling posture before discussing the Choir'
  );
  assert.equal(
    crossroadBrotherDialogue.nodes.history.lines.some((line) => line.includes('not bent a finger since')),
    true,
    'Gideon states that he cannot move his fixed arms'
  );
  assert.equal(
    [
      ...crossroadBrotherDialogue.nodes.choir.lines,
      ...crossroadBrotherDialogue.nodes.task.lines,
      ...crossroadBrotherDialogue.nodes.coins.lines
    ].some((line) => /\bI point(?:ed)?\b/i.test(line)),
    false,
    'Gideon never claims to reposition his arms for travelers or the Choir'
  );
  assert.equal(
    crossroadBrotherDialogue.nodes.task.choices.some((choice) => choice.label === 'Call it Stage IV'),
    true,
    'the player can frame Eleazar through a Censure infection-stage read'
  );
  assert.equal(
    crossroadBrotherDialogue.nodes.task.choices.some((choice) => choice.label === 'Is Eleazar Stage IV?'),
    false,
    'Gideon no longer receives a glossary-style Stage IV prompt'
  );
  assert.equal(
    crossroadBrotherDialogue.nodes['edrin-stage'].lines.some((line) => line.includes('Censure read')),
    true,
    "infection-stage language is carried by the player's field assessment"
  );
  assert.equal(
    crossroadBrotherDialogue.nodes['edrin-stage'].lines.some((line) => line.includes('Stage IV means')),
    false,
    'Gideon does not explain infection stages like a system glossary'
  );
  assert.deepEqual(
    visibleChoiceLabels(crossroadBrotherDialogue.nodes['paid-check'], {
      flags: new Set(['long-ash-crossroad-brother-paid'])
    }),
    ['Ask if he trusts the Choir', 'Ask about the coins', 'Leave Gideon to the road'],
    'Gideon remembers when the Eleazar job has already been taken'
  );
  const freshEdrinChoices = visibleChoiceLabels(fieldBrotherDialogue.nodes['first-unknown'], {
    flags: new Set()
  });
  assert.equal(freshEdrinChoices.includes('Gideon sent me'), false, 'player cannot claim Gideon sent them before meeting Gideon');
  assert.equal(freshEdrinChoices.includes('Ask who Gideon is'), true, 'Eleazar supports the field-first discovery order');
  assert.deepEqual(
    visibleChoiceLabels(fieldBrotherDialogue.nodes['first-mentioned'], {
      flags: new Set(['long-ash-crossroad-edrin-named'])
    }).slice(0, 1),
    ['Gideon mentioned you'],
    'Eleazar distinguishes Gideon mentioning him from Gideon sending the player'
  );
  assert.equal(
    visibleChoiceLabels(fieldBrotherDialogue.nodes.choir, {
      flags: new Set()
    }).includes('Gideon doubts them'),
    false,
    'Eleazar cannot cite Gideon doubt before the player hears it'
  );
  assert.equal(
    visibleChoiceLabels(fieldBrotherDialogue.nodes.choir, {
      flags: new Set(['long-ash-crossroad-choir-doubt-known'])
    }).includes('Gideon doubts them'),
    true,
    'Eleazar can cite Gideon doubt after the player hears it'
  );
  const actualFarmDoors = level.objects
    .filter((object) => object.kind === 'farm-door' && inRange(object, farmRange))
    .map((object) => ({
      id: object.id,
      x: object.x,
      y: object.y,
      variant: object.variant,
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
    assert.equal(level.tiles[door.y][door.x], expectedDoor.tile, `${door.id} sits on the expected building tile`);
    assert.equal(door.variant, expectedDoor.variant, `${door.id} uses the expected farm-door variant`);
    assert.deepEqual(door.mapMarker, { label: door.name, kind: 'exit' }, `${door.id} has an explored structural map marker`);
    assert.equal(isFarmBuildingTile(level, door.x, door.y), true, `${door.id} is mounted on a farm building wall cell`);
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
    { kind: 'wagon-wheel', x: 25, y: 52, orient: null, blocking: true },
    { kind: 'feed-trough', x: 18, y: 53, orient: 'se', blocking: true },
    { kind: 'field-plow', x: 23, y: 52, orient: 'sw', blocking: true },
    { kind: 'field-harrow', x: 27, y: 53, orient: 'sw', blocking: true },
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
    actualFarmVictims.every((object) => !isFarmBuildingTile(level, object.x, object.y)),
    true,
    'farm family victims stay out of building footprints'
  );
  assert.equal(
    actualFarmVictims.every((object) => !grid.isWalkable(object.x, object.y)),
    true,
    'farm family victim crosses block their occupied tiles'
  );
  assert.equal(
    level.objects
      .filter((object) => object.kind === 'farm-cross-victim')
      .every((object) =>
        object.id?.startsWith('long-ash-farm-victim-') &&
        object.interact?.type === 'note' &&
        object.interact?.questUpdate?.quest === 'calcified-brothers' &&
        object.interact?.questUpdate?.stage === 'family-known'
      ),
    true,
    'farm family victims are inspectable and advance Eleazar report state'
  );
  assert.ok(
    level.objects.some((object) => object.kind === 'blood-sigil' && inRange(object, farmRange)),
    'cult blood sigils are placed inside the farm murder scene'
  );
  assert.ok(level.tiles.slice(farmRange.y0, farmRange.y1 + 1).some((row) =>
    [...row.slice(farmRange.x0, farmRange.x1 + 1)].some((tile) => level.legend?.[tile]?.kind?.endsWith('building-block'))
  ));
  for (const spec of GRAVEYARD_CHAPEL_SPECS) {
    const chapel = getSprite(spec.kind);
    assert.ok(chapel, `${spec.kind} is registered`);
    assert.equal(chapel.category, 'structure', `${spec.kind} is a structure`);
    assert.equal(chapel.block, true, `${spec.kind} is a tile block`);
    assert.equal(chapel.cover, 'hard', `${spec.kind} provides hard cover`);
    assert.equal(level.legend?.[spec.tile]?.kind, spec.kind, `${spec.tile} maps to ${spec.kind}`);
    assert.equal(level.legend?.[spec.tile]?.walkable, false, `${spec.kind} blocks movement through its footprint`);
    assert.deepEqual(
      buildingCells(level, spec.kind),
      expectedFootprintCells(spec),
      `${spec.kind} keeps its planned north-wall footprint`
    );
    assert.equal(buildingCells(level, spec.kind).length, spec.count, `${spec.kind} has its planned tile count`);
    assert.equal(
      buildingCells(level, spec.kind).every((cell) => grid.isWalkable(cell.x, cell.y) === false),
      true,
      `${spec.kind} is impassable across the visible chapel`
    );
    for (let x = spec.x0; x <= spec.x1; x += 1) {
      assert.equal(
        level.objects.some((object) => object.kind === 'graveyard-wall' && object.x === x && object.y === graveyardRange.y0),
        false,
        `${spec.kind} door aligns with an opening in the north cemetery wall`
      );
      for (let y = graveyardRange.y0; y <= graveyardRange.y0 + 1; y += 1) {
        assert.equal(level.tiles[y][x], 's', `${spec.kind} has a stone entrance apron at ${x},${y}`);
        assert.equal(grid.isWalkable(x, y), true, `${spec.kind} entrance apron ${x},${y} is walkable`);
      }
    }
  }
  for (const [kind, category] of [
    ['graveyard-wall', 'structure'],
    ['calcified-grave-plot', 'structure'],
    ['calcified-headstone', 'structure']
  ]) {
    const sprite = getSprite(kind);
    assert.ok(sprite, `${kind} is registered`);
    assert.equal(sprite.category, category, `${kind} is a ${category}`);
  }
  const graveyardObjects = level.objects.filter((object) => inRange(object, graveyardRange));
  const graveyardWalls = graveyardObjects.filter((object) => object.kind === 'graveyard-wall');
  const graveyardPlots = graveyardObjects.filter((object) => object.kind === 'calcified-grave-plot');
  const graveyardHeadstones = graveyardObjects.filter((object) => object.kind === 'calcified-headstone');
  const attendantShrine = graveyardObjects.find((object) => object.id === 'long-ash-censure-attendant-shrine');
  assert.ok(attendantShrine, 'the attendant shrine stands outside the graveyard chapels');
  assert.deepEqual(attendantShrine.interactionMarker, { x: 136, y: 49 });
  assert.deepEqual(attendantShrine.activationCell, { x: 137, y: 48 });
  assert.equal(pathExists(grid, level.spawns.player, attendantShrine.interactionMarker), true, 'the road start reaches the shrine use tile');
  assert.equal(grid.isWalkable(attendantShrine.activationCell.x, attendantShrine.activationCell.y), true, 'the attendant unfolds onto a clear tile');
  assert.ok(graveyardWalls.length >= 60, 'expanded graveyard has a full low perimeter wall');
  assert.ok(graveyardPlots.length >= 24, 'expanded graveyard has dense repeated grave plots');
  assert.ok(graveyardHeadstones.length >= 12, 'plots without a standing body keep a broken headstone stump');
  const graveMarkerCells = new Set(
    graveyardObjects
      .filter((object) => object.kind === 'calcified-headstone' || object.kind === 'calcified-grave-body')
      .map((object) => `${object.x},${object.y}`)
  );
  assert.equal(
    graveyardPlots.every((object) => graveMarkerCells.has(`${object.x},${object.y - 1}`)),
    true,
    'every plot is marked at its head by a calcified body or a broken headstone'
  );
  assert.equal(graveyardWalls.every((object) => object.blocking === true), true, 'graveyard wall blocks its perimeter cells');
  assert.equal(graveyardHeadstones.every((object) => object.blocking === true), true, 'headstones block their occupied cells');
  assert.equal(graveyardPlots.every((object) => !object.blocking), true, 'grave plots are visual slabs, not path blockers');
  assert.equal(graveyardPlots.every((object) => ['se', 'sw'].includes(object.orient)), true, 'grave plots use authored isometric orientation');
  assert.equal(level.objects.filter((object) => object.kind === 'farm-fence' && inRange(object, graveyardRange)).length, 0, 'old farm-fence graveyard boundary is retired');
  for (const aisle of [
    { x: 126, y: 56 },
    { x: 127, y: 56 },
    { x: 142, y: 56 },
    { x: 146, y: 56 },
    { x: 130, y: 50 },
    { x: 130, y: 54 },
    { x: 130, y: 58 }
  ]) {
    assert.equal(grid.isWalkable(aisle.x, aisle.y), true, `graveyard aisle ${aisle.x},${aisle.y} is walkable`);
    assert.equal(pathExists(grid, level.spawns.player, aisle), true, `start reaches graveyard aisle ${aisle.x},${aisle.y}`);
  }
  assert.ok(
    level.objects.filter((object) => object.kind === 'candle-cluster' && inRange(object, graveyardRange)).length >= 3,
    'graveyard includes candle offerings'
  );
  assert.ok(
    level.objects.filter((object) => object.kind === 'rubble-decal' && inRange(object, graveyardRange)).length >= 5,
    'graveyard includes broken stone debris'
  );
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
  assert.equal(ringGraves[0].name, 'Jeremiah Fullo');
  assert.equal(ringGraves[0].interact.loot, undefined, 'Jeremiah Fullo has no normal loot array');
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
  const killSiteEvidence = level.objects.filter((object) =>
    inRange(object, killRange) &&
    (object.kind === 'dead-cultist' || object.kind.startsWith('dead-host-wolf-'))
  );
  assert.equal(killSiteEvidence.length, 8, 'kill site keeps five cultists and three dead Host wolves');
  assert.equal(
    killSiteEvidence.every((object) =>
      object.interact?.type === 'note' &&
      object.interact?.dialogue === 'long-ash-wolf-cultist-evidence' &&
      typeof object.interact?.log === 'string' &&
      object.interact.log.trim() !== ''
    ),
    true,
    'kill site bodies stay inspectable after regenerating the road'
  );

  const crossroadSprite = getSprite('calcified-crossroad-brother');
  assert.ok(crossroadSprite, 'calcified-crossroad-brother is registered');
  assert.equal(crossroadSprite.category, 'creature');
  const fieldSprite = getSprite('calcified-scarecrow-brother');
  assert.ok(fieldSprite, 'calcified-scarecrow-brother is registered');
  assert.equal(fieldSprite.category, 'creature');

  const crossroadBrother = level.objects.find((object) => object.id === 'long-ash-crossroad-brother');
  assert.ok(crossroadBrother, 'crossroad brother is placed');
  assert.equal(crossroadBrother.kind, 'calcified-crossroad-brother');
  assert.equal(crossroadBrother.name, 'Gideon Carbo');
  assert.equal(crossroadBrother.x, 113);
  assert.equal(crossroadBrother.y, 31);
  assert.equal(crossroadBrother.blocking, true);
  assert.equal(crossroadBrother.interact?.dialogue, 'long-ash-crossroad-brother');
  assert.equal(crossroadBrother.interact?.type, 'note');
  assert.ok(crossroadBrother.interact?.log.includes('Hallowfen'));
  assert.equal(level.tiles[crossroadBrother.y][crossroadBrother.x], 'r', 'crossroad brother stands on the road fork');
  assert.equal(grid.isWalkable(crossroadBrother.x, crossroadBrother.y), false, 'crossroad brother blocks only his signpost cell');
  assert.equal(pathExists(grid, level.spawns.player, { x: 113, y: 32 }), true, 'start reaches the crossroad brother use tile');
  const crossroadTarget = resolveInteractionTargetAtCell({
    cell: { x: crossroadBrother.x, y: crossroadBrother.y },
    grid,
    player: { position: { x: 113, y: 32 } },
    actors: [],
    enemies: [],
    interactables: level.objects.filter((object) => object.interact),
    mode: 'explore'
  });
  assert.equal(crossroadTarget.type, 'object', 'crossroad brother resolves as an object target');
  assert.equal(crossroadTarget.object.id, crossroadBrother.id);
  assert.equal(isTargetInReach({ position: { x: 113, y: 32 } }, crossroadTarget), true, 'crossroad brother is clickable from the road');

  const fieldBrother = level.objects.find((object) => object.id === 'long-ash-field-brother');
  assert.ok(fieldBrother, 'field brother is placed');
  assert.equal(fieldBrother.kind, 'calcified-scarecrow-brother');
  assert.equal(fieldBrother.name, 'Eleazar Carbo');
  assert.equal(fieldBrother.x, 50);
  assert.equal(fieldBrother.y, 35);
  assert.equal(fieldBrother.blocking, true);
  assert.equal(fieldBrother.interact?.dialogue, 'long-ash-field-brother');
  assert.equal(fieldBrother.interact?.type, 'note');
  assert.equal(level.tiles[fieldBrother.y][fieldBrother.x], 'f', 'field brother stands on trampled ground within the wheat');
  assert.equal(grid.isWalkable(fieldBrother.x, fieldBrother.y), false, 'field brother blocks his scarecrow cell');
  assert.equal(pathExists(grid, level.spawns.player, { x: 50, y: 36 }), true, 'start reaches the field brother use tile');
  const fieldTarget = resolveInteractionTargetAtCell({
    cell: { x: fieldBrother.x, y: fieldBrother.y },
    grid,
    player: { position: { x: 50, y: 36 } },
    actors: [],
    enemies: [],
    interactables: level.objects.filter((object) => object.interact),
    mode: 'explore'
  });
  assert.equal(fieldTarget.type, 'object', 'field brother resolves as an object target');
  assert.equal(fieldTarget.object.id, fieldBrother.id);
  assert.equal(isTargetInReach({ position: { x: 50, y: 36 } }, fieldTarget), true, 'field brother is clickable from the wheat');

  const stash = level.objects.find((object) => object.id === 'long-ash-holt-forest-stash');
  assert.ok(stash, 'Carbo forest stash is placed');
  assert.equal(stash.kind, 'field-satchel');
  assert.equal(stash.name, 'Old Carbo Stash');
  assert.equal(stash.x, 83);
  assert.equal(stash.y, 31);
  assert.equal(level.tiles[stash.y][stash.x], 'd', 'Carbo stash sits on forest floor');
  assert.equal(grid.isWalkable(stash.x, stash.y), true, 'Carbo stash keeps its forest tile walkable');
  assert.equal(pathExists(grid, level.spawns.player, { x: stash.x, y: stash.y }), true, 'start reaches the Carbo stash');
  assert.equal(stash.interact?.type, 'container');
  assert.deepEqual(stash.interact?.loot, [
    { item: 'ducat', count: 12 },
    { item: 'road-warden-chit', count: 1 },
    { item: 'tarnished-saint-token', count: 1 }
  ]);
  const stashTarget = resolveInteractionTargetAtCell({
    cell: { x: stash.x, y: stash.y },
    grid,
    player: { position: { x: 83, y: 32 } },
    actors: [],
    enemies: [],
    interactables: level.objects.filter((object) => object.interact),
    mode: 'explore'
  });
  assert.equal(stashTarget.type, 'object', 'Carbo stash resolves before movement on its walkable tile');
  assert.equal(stashTarget.object.id, stash.id);
  assert.equal(isTargetInReach({ position: { x: 83, y: 32 } }, stashTarget), true, 'Carbo stash is reachable from an adjacent forest tile');

  const expectedRoadSigns = [
    {
      id: 'long-ash-start-sign',
      name: 'Ash Chapel Sign',
      x: 141,
      y: 67,
      use: { x: 142, y: 68 },
      log: 'The plank points back toward Ash Chapel. Fresh boot cuts in the dust all lead north.'
    },
    {
      id: 'long-ash-remnant-spur-sign',
      name: 'Remnant Spur Sign',
      x: 117,
      y: 55,
      use: { x: 117, y: 56 },
      type: 'note',
      log: 'The old waypost points down the Remnant capital road. The bell nail is empty.'
    },
    {
      id: 'long-ash-censure-camp-sign',
      name: 'Censure Camp Sign',
      x: 116,
      y: 5,
      use: { x: 116, y: 6 },
      type: 'secret-entrance',
      dialogue: 'long-ash-censure-road-camp-exit',
      log: 'The board points toward the Censure road camp. Dark undergrowth crowds the way north.',
      mapMarker: { label: 'Censure Road Camp', kind: 'exit', reveal: 'always' }
    }
  ];
  const roadSignSprite = getSprite('road-sign-post');
  assert.ok(roadSignSprite, 'road-sign-post is registered');
  assert.equal(roadSignSprite.category, 'structure');
  for (const expected of expectedRoadSigns) {
    const sign = level.objects.find((object) => object.id === expected.id);
    assert.ok(sign, `${expected.id} is placed`);
    assert.equal(sign.kind, 'road-sign-post');
    assert.equal(sign.name, expected.name);
    assert.equal(sign.x, expected.x);
    assert.equal(sign.y, expected.y);
    assert.equal(sign.blocking, undefined, `${expected.id} stays non-blocking on the road`);
    assert.equal(sign.interact?.type, expected.type ?? 'note');
    if (expected.dialogue) assert.equal(sign.interact?.dialogue, expected.dialogue);
    assert.equal(sign.interact?.log, expected.log);
    if (expected.mapMarker) assert.deepEqual(sign.mapMarker, expected.mapMarker);
    assert.equal(level.tiles[sign.y][sign.x], 'r', `${expected.id} sits on the ash road`);
    assert.equal(grid.isWalkable(expected.use.x, expected.use.y), true, `${expected.id} has a walkable use tile`);
    const signTarget = resolveInteractionTargetAtCell({
      cell: { x: sign.x, y: sign.y },
      grid,
      player: { position: expected.use },
      actors: [],
      enemies: [],
      interactables: level.objects.filter((object) => object.interact),
      mode: 'explore'
    });
    assert.equal(signTarget.type, 'object', `${expected.id} resolves as an object target`);
    assert.equal(signTarget.object.id, sign.id);
    assert.equal(isTargetInReach({ position: expected.use }, signTarget), true, `${expected.id} is inspectable from its road tile`);
  }

  for (const kind of ['broken-bell', 'candle-cluster', 'wax-stain', 'rubble-decal']) {
    assert.ok(getSprite(kind), `${kind} is registered for the old bell marker scene`);
  }
  const oldBell = level.objects.find((object) => object.id === 'long-ash-old-bell-marker');
  assert.ok(oldBell, 'old bell marker is placed');
  assert.equal(oldBell.kind, 'broken-bell');
  assert.equal(oldBell.name, 'Old Bell Marker');
  assert.equal(oldBell.x, 121);
  assert.equal(oldBell.y, 63);
  assert.equal(oldBell.blocking, true);
  assert.equal(oldBell.interact?.type, 'note');
  assert.equal(
    oldBell.interact?.log,
    'The field bell has been split through the mouth. Someone took the clapper and scratched the road office mark from the yoke.'
  );
  assert.equal(level.tiles[oldBell.y][oldBell.x], 's', 'old bell marker sits on the road shoulder');
  assert.equal(grid.isWalkable(oldBell.x, oldBell.y), false, 'old bell marker blocks only its occupied tile');
  assert.equal(pathExists(grid, level.spawns.player, { x: 121, y: 62 }), true, 'start reaches the old bell marker use tile');
  const oldBellTarget = resolveInteractionTargetAtCell({
    cell: { x: oldBell.x, y: oldBell.y },
    grid,
    player: { position: { x: 121, y: 62 } },
    actors: [],
    enemies: [],
    interactables: level.objects.filter((object) => object.interact),
    mode: 'explore'
  });
  assert.equal(oldBellTarget.type, 'object', 'old bell marker resolves as an object target');
  assert.equal(oldBellTarget.object.id, oldBell.id);
  assert.equal(isTargetInReach({ position: { x: 121, y: 62 } }, oldBellTarget), true, 'old bell marker is inspectable from the road');
  for (const id of ['long-ash-old-bell-candles', 'long-ash-old-bell-wax', 'long-ash-old-bell-rubble']) {
    assert.ok(level.objects.some((object) => object.id === id), `${id} dresses the old bell marker`);
  }

  const strippedCart = level.objects.find((object) => object.id === 'long-ash-stripped-cart');
  assert.ok(strippedCart, 'stripped cart is placed');
  assert.equal(strippedCart.kind, 'field-cart');
  assert.equal(strippedCart.name, 'Stripped Cart');
  assert.equal(strippedCart.x, 104);
  assert.equal(strippedCart.y, 50);
  assert.equal(strippedCart.orient, 'nw');
  assert.equal(strippedCart.blocking, true);
  assert.equal(strippedCart.interact?.type, 'note');
  assert.equal(strippedCart.interact?.log, 'The cart was dragged sideways and stripped clean. Red thread is caught on the left wheel.');
  assert.equal(level.tiles[strippedCart.y][strippedCart.x], 'r', 'stripped cart sits on the ash road');
  assert.equal(pathExists(grid, level.spawns.player, { x: 104, y: 51 }), true, 'start reaches the stripped cart use tile');
  const cartTarget = resolveInteractionTargetAtCell({
    cell: { x: strippedCart.x, y: strippedCart.y },
    grid,
    player: { position: { x: 104, y: 51 } },
    actors: [],
    enemies: [],
    interactables: level.objects.filter((object) => object.interact),
    mode: 'explore'
  });
  assert.equal(cartTarget.type, 'object', 'stripped cart resolves as an object target');
  assert.equal(cartTarget.object.id, strippedCart.id);
  assert.equal(isTargetInReach({ position: { x: 104, y: 51 } }, cartTarget), true, 'stripped cart is inspectable from the road');

  const cartSatchel = level.objects.find((object) => object.id === 'long-ash-cart-satchel');
  assert.ok(cartSatchel, 'cart satchel is placed');
  assert.equal(cartSatchel.kind, 'field-satchel');
  assert.equal(cartSatchel.name, 'Cart Satchel');
  assert.equal(cartSatchel.x, 107);
  assert.equal(cartSatchel.y, 52);
  assert.equal(cartSatchel.interact?.type, 'container');
  assert.equal(cartSatchel.interact?.log, 'A small satchel is tied under the cart bed. The cultists missed the knot.');
  assert.deepEqual(cartSatchel.interact?.loot, [
    { item: 'ducat', count: 6 },
    { item: 'field-dressing', count: 1 }
  ]);
  assert.equal(pathExists(grid, level.spawns.player, { x: cartSatchel.x, y: cartSatchel.y }), true, 'start reaches the cart satchel');
  const cartSatchelTarget = resolveInteractionTargetAtCell({
    cell: { x: cartSatchel.x, y: cartSatchel.y },
    grid,
    player: { position: { x: 107, y: 53 } },
    actors: [],
    enemies: [],
    interactables: level.objects.filter((object) => object.interact),
    mode: 'explore'
  });
  assert.equal(cartSatchelTarget.type, 'object', 'cart satchel resolves before movement on its walkable tile');
  assert.equal(cartSatchelTarget.object.id, cartSatchel.id);
  assert.equal(isTargetInReach({ position: { x: 107, y: 53 } }, cartSatchelTarget), true, 'cart satchel is reachable from an adjacent road tile');
  for (const id of ['long-ash-stripped-cart-dust', 'long-ash-stripped-cart-rubble', 'long-ash-cart-drag-dust']) {
    assert.ok(level.objects.some((object) => object.id === id), `${id} dresses the stripped cart scene`);
  }

  const caveSprite = getSprite('infected-cave-entrance');
  assert.ok(caveSprite, 'infected-cave-entrance is registered');
  assert.equal(caveSprite.category, 'structure');
  const cave = level.objects.find((object) => object.id === 'infected-cave-entrance');
  assert.ok(cave, 'infected cave entrance is placed');
  assert.equal(cave.kind, 'infected-cave-entrance');
  assert.equal(cave.name, 'Infected Cave');
  assert.equal(cave.x, 90);
  assert.equal(cave.y, 10);
  assert.equal(cave.blocking, true);
  assert.equal(cave.interact?.type, 'secret-entrance');
  assert.equal(cave.interact?.dialogue, 'long-ash-infected-cave-entrance');
  assert.deepEqual(cave.mapMarker, { label: 'Infected Cave', kind: 'danger' });
  assert.ok(level.dialogue.includes('long-ash-infected-cave-entrance'));
  assert.equal(caveEntranceDialogue.nodes.start.choices[0].effects.loadLevel.path, './data/levels/long_ash_infected_cave.json');
  assert.deepEqual(caveEntranceDialogue.nodes.start.choices[0].effects.loadLevel.player, { x: 12, y: 15 });
  assert.equal(level.tiles[cave.y][cave.x], 'd', 'infected cave sits on forest floor');
  assert.equal(inRange(cave, caveRange), true, 'infected cave stays inside the authored forest clearing');
  assert.equal(grid.isWalkable(cave.x, cave.y), false, 'infected cave mouth blocks its occupied tile');
  assert.equal(pathExists(grid, level.spawns.player, { x: 90, y: 11 }), true, 'start reaches the infected cave threshold');
  const outsideWolves = level.spawns.enemies.filter((enemy) => enemy.encounter === 'infected-cave-mouth');
  assert.equal(outsideWolves.length, 3, 'infected cave has three outside Host wolves');
  assert.deepEqual(outsideWolves.map((enemy) => enemy.id).sort(), ['host-wolf-maw', 'host-wolf-ribsplit', 'host-wolf-spider']);
  for (const wolf of outsideWolves) {
    assert.equal(inRange(wolf, caveRange), true, `${wolf.spawnId} stays near the cave mouth`);
    assert.equal(grid.isWalkable(wolf.x, wolf.y), true, `${wolf.spawnId} starts on walkable ground`);
    assert.equal(pathExists(grid, level.spawns.player, { x: wolf.x, y: wolf.y }), true, `${wolf.spawnId} is reachable from start`);
  }
  const mouthTrigger = level.combatTriggers.find((trigger) => trigger.id === 'infected-cave-mouth-trigger');
  assert.ok(mouthTrigger, 'infected cave mouth has a combat trigger');
  assert.equal(mouthTrigger.encounter, 'infected-cave-mouth');
  assert.equal(mouthTrigger.forceCombat, true);
  assert.equal(mouthTrigger.radius, 3);
  assert.ok(
    level.objects.filter((object) =>
      object.kind === 'rubble-pile' && object.blocking === true && inRange(object, caveRange)
    ).length >= 6,
    'infected cave has blocking rock piles around the mouth'
  );
  const caveTarget = resolveInteractionTargetAtCell({
    cell: { x: cave.x, y: cave.y },
    grid,
    player: { position: { x: 90, y: 11 } },
    actors: [],
    enemies: [],
    interactables: level.objects.filter((object) => object.interact),
    mode: 'explore'
  });
  assert.equal(caveTarget.type, 'object', 'infected cave resolves as an inspectable object');
  assert.equal(caveTarget.object.id, cave.id);
  assert.equal(isTargetInReach({ position: { x: 90, y: 11 } }, caveTarget), true, 'infected cave is inspectable from the threshold');
}

{
  const encounterId = 'long-ash-stage-iv-cart-ambush';
  const ambushEnemies = level.spawns.enemies.filter((enemy) => enemy.encounter === encounterId);
  assert.equal(ambushEnemies.length, 5, 'the cart ambush has one speaking Stage IV and four runners');
  assert.equal(ambushEnemies.every((enemy) => enemy.dormantUntilCombat === true), true, 'ambushers remain dormant until the trap is sprung');

  const lure = ambushEnemies.find((enemy) => enemy.spawnId === 'long-ash-stage-iv-lure');
  assert.deepEqual(
    { id: lure?.id, x: lure?.x, y: lure?.y, facing: lure?.facing },
    { id: 'stage-iv-lure', x: 76, y: 35, facing: 'se' },
    'the speaking Stage IV replaces the prone lure prop when combat starts'
  );
  const runners = ambushEnemies.filter((enemy) => enemy.id === 'stage-iv-runner');
  assert.deepEqual(
    runners.map(({ x, y, spriteId }) => ({ x, y, spriteId })),
    [
      { x: 74, y: 31, spriteId: 'stage-iv-runner-ash' },
      { x: 77, y: 30, spriteId: 'stage-iv-runner-road' },
      { x: 70, y: 35, spriteId: 'stage-iv-runner-road' },
      { x: 82, y: 39, spriteId: 'stage-iv-runner-ash' }
    ]
  );
  assert.equal(runners.every((runner) => grid.isWalkable(runner.x, runner.y)), true, 'all four runners emerge onto walkable cells');
  assert.equal(pathExists(grid, level.spawns.player, { x: 77, y: 36 }), true, 'the forced close-help position remains reachable');

  assert.equal(stageIvLure.name, 'Stage IV');
  assert.equal(stageIvLure.stats.hp, 9);
  assert.deepEqual(stageIvLure.attacks[0], {
    id: 'prayer-grip', name: 'Prayer Grip', apCost: 3, damage: 2, range: 1
  });
  assert.equal(stageIvLure.tags.includes('deceptive'), true, 'the lure is a conscious deceptive Stage IV');
  assert.equal(stageIvRunner.name, 'Stage IV Runner');
  assert.equal(stageIvRunner.stats.hp, 4);
  assert.equal(stageIvRunner.stats.actionPoints, 7);
  assert.deepEqual(stageIvRunner.attacks[0], {
    id: 'rushing-rake', name: 'Rushing Rake', apCost: 4, damage: 2, range: 1
  });

  const trapCart = level.objects.find((object) => object.id === 'long-ash-stage-iv-overturned-cart');
  const proneLure = level.objects.find((object) => object.id === 'long-ash-stage-iv-cart-lure');
  const eddaPurse = level.objects.find((object) => object.id === 'long-ash-edda-flat-purse');
  assert.deepEqual(
    { kind: trapCart?.kind, name: trapCart?.name, x: trapCart?.x, y: trapCart?.y, blocking: trapCart?.blocking },
    { kind: 'overturned-field-cart', name: 'Overturned Charcoal Cart', x: 77, y: 35, blocking: true }
  );
  assert.deepEqual(
    { kind: proneLure?.kind, x: proneLure?.x, y: proneLure?.y, hiddenWhenFlags: proneLure?.hiddenWhenFlags },
    {
      kind: 'stage-iv-cart-lure',
      x: 76,
      y: 35,
      hiddenWhenFlags: ['long-ash-stage-iv-cart-ambush-sprung']
    }
  );
  assert.equal(getSprite('overturned-field-cart')?.cover, 'hard');
  assert.equal(getSprite('stage-iv-cart-lure')?.category, 'creature');
  assert.deepEqual(
    {
      kind: eddaPurse?.kind,
      x: eddaPurse?.x,
      y: eddaPurse?.y,
      visibleWhenFlags: eddaPurse?.visibleWhenFlags,
      loot: eddaPurse?.interact?.loot,
      questUpdate: eddaPurse?.interact?.questUpdate
    },
    {
      kind: 'field-satchel',
      x: 78,
      y: 36,
      visibleWhenFlags: ['long-ash-stage-iv-cart-ambush-sprung'],
      loot: [{ item: 'ducat', count: 20 }],
      questUpdate: {
        quest: 'edda-farrs-account',
        stage: 'return-purse',
        log: 'Deborah\'s flat purse held twenty ducats, exactly the count she gave.'
      }
    },
    'Deborah\'s twenty-ducat purse appears beneath the stolen cart once the trap is sprung'
  );
  const hiddenPurse = structuredClone(eddaPurse);
  syncObjectFlagState(hiddenPurse, new Set());
  assert.equal(hiddenPurse.hiddenByFlag, true, 'the purse stays concealed while the lure covers the cart bed');
  syncObjectFlagState(hiddenPurse, new Set(['long-ash-stage-iv-cart-ambush-sprung']));
  assert.equal(hiddenPurse.hiddenByFlag, false, 'springing the ambush reveals Deborah\'s purse');

  const trigger = level.combatTriggers.find((entry) => entry.id === 'long-ash-stage-iv-cart-ambush-trigger');
  assert.deepEqual(
    { encounter: trigger?.encounter, x: trigger?.x, y: trigger?.y, radius: trigger?.radius, dialogue: trigger?.dialogue },
    { encounter: encounterId, x: 76, y: 35, radius: 5, dialogue: 'long-ash-stage-iv-cart-ambush' }
  );
  assert.equal(trigger.forceCombat, undefined, 'proximity opens the trap dialogue instead of starting combat directly');
  assert.match(trigger.intro.join(' '), /red cloth/, 'the ambushers retain the cult band\'s stolen clothing');

  const eddaCartRead = stageIvAmbushDialogue.nodes.start.choices.find((entry) => entry.next === 'edda-cart-read');
  assert.deepEqual(eddaCartRead.conditions, { flag: 'long-ash-edda-purse-tasked' });
  assert.equal(eddaCartRead.effects.setFlag, 'long-ash-stage-iv-cart-recognized');
  assert.match(stageIvAmbushDialogue.nodes['edda-cart-read'].lines.join(' '), /White cord/);
  assert.deepEqual(stageIvAmbushDialogue.nodes['edda-cart-read'].choices[0].effects.startCombat.openingAttack, {
    target: 'long-ash-stage-iv-lure',
    attackId: 'sidearm',
    guaranteedHit: true,
    spendAp: false,
    failureLog: 'The sidearm is not ready. The old woman rises.'
  });

  const gateManifest = [
    { next: 'guile-read', field: 'guile', dc: 45 },
    { next: 'medicine-read', field: 'medicine', dc: 45 },
    { next: 'host-signs-read', field: 'hostSigns', dc: 50 }
  ];
  for (const expected of gateManifest) {
    const choice = stageIvAmbushDialogue.nodes.start.choices.find((entry) => entry.next === expected.next);
    assert.deepEqual(choice?.conditions?.fieldRatings, { [expected.field]: expected.dc });
    assert.equal(
      meetsDialogueConditions(choice.conditions, {
        fieldRating: (field) => (field === expected.field ? expected.dc - 1 : 100)
      }),
      false,
      `${expected.next} stays hidden one point below its threshold`
    );
    assert.equal(
      meetsDialogueConditions(choice.conditions, {
        fieldRating: (field) => (field === expected.field ? expected.dc : 100)
      }),
      true,
      `${expected.next} appears at its threshold`
    );

    const fireChoice = stageIvAmbushDialogue.nodes[expected.next].choices[0];
    assert.equal(fireChoice.label, 'Draw the sidearm');
    assert.deepEqual(fireChoice.effects.startCombat.openingAttack, {
      target: 'long-ash-stage-iv-lure',
      attackId: 'sidearm',
      guaranteedHit: true,
      spendAp: false,
      failureLog: 'The sidearm is not ready. The old woman rises.'
    });
  }
  const closeHelp = stageIvAmbushDialogue.nodes['close-help'].choices[0].effects;
  assert.deepEqual(closeHelp.teleport, { x: 77, y: 36, facing: 'nw' });
  assert.deepEqual(closeHelp.startCombat, { encounter: encounterId });
}

{
  assert.equal(caveLevel.id, 'long-ash-infected-cave');
  assert.equal(caveLevel.name, 'Long Ash Infected Cave');
  assert.equal(caveLevel.width, 24);
  assert.equal(caveLevel.height, 18);
  assert.equal(caveLevel.tiles.length, caveLevel.height);
  for (const [index, row] of caveLevel.tiles.entries()) {
    assert.equal(row.length, caveLevel.width, `cave row ${index} is ${caveLevel.width} cells`);
  }
  assert.equal(caveLevel.legend['#']?.kind, 'cave-wall');
  assert.equal(caveLevel.legend['.']?.floor, 'cave-stone');
  assert.equal(caveLevel.legend['~']?.floor, 'cave-river');
  assert.equal(caveGrid.isWalkable(caveLevel.spawns.player.x, caveLevel.spawns.player.y), true, 'cave spawn is walkable');
  assert.equal(pathExists(caveGrid, caveLevel.spawns.player, { x: 20, y: 8 }), true, 'cave chest is reachable from spawn');

  const caveExit = caveLevel.objects.find((object) => object.id === 'infected-cave-exit-mouth');
  assert.ok(caveExit, 'cave has a return mouth');
  assert.equal(caveExit.interact?.type, 'secret-exit');
  assert.equal(caveExit.interact?.dialogue, 'long-ash-infected-cave-exit');
  const caveExitTarget = resolveInteractionTargetAtCell({
    cell: { x: caveExit.x, y: caveExit.y },
    grid: caveGrid,
    player: { position: caveLevel.spawns.player },
    actors: [],
    enemies: [],
    interactables: caveLevel.objects.filter((object) => object.interact),
    mode: 'explore'
  });
  assert.equal(caveExitTarget.type, 'object', 'cave exit resolves as an object target');
  assert.equal(isTargetInReach({ position: caveLevel.spawns.player }, caveExitTarget), true, 'cave exit starts in reach');
  assert.equal(caveExitDialogue.nodes.start.choices[0].effects.loadLevel.path, './data/levels/long_ash_road_approach.json');
  assert.deepEqual(caveExitDialogue.nodes.start.choices[0].effects.loadLevel.player, { x: 90, y: 11 });

  const insideWolves = caveLevel.spawns.enemies.filter((enemy) => enemy.encounter === 'infected-cave-den');
  assert.equal(insideWolves.length, 4, 'infected cave has four inside Host wolves');
  assert.deepEqual(insideWolves.map((enemy) => enemy.id).sort(), [
    'host-wolf-maw',
    'host-wolf-ribsplit',
    'host-wolf-spider',
    'host-wolf-spider'
  ]);
  for (const wolf of insideWolves) {
    assert.equal(caveGrid.isWalkable(wolf.x, wolf.y), true, `${wolf.spawnId} starts on walkable cave ground`);
    assert.equal(pathExists(caveGrid, caveLevel.spawns.player, { x: wolf.x, y: wolf.y }), true, `${wolf.spawnId} is reachable from cave spawn`);
  }
  const denTrigger = caveLevel.combatTriggers.find((trigger) => trigger.id === 'infected-cave-den-trigger');
  assert.ok(denTrigger, 'infected cave den has a combat trigger');
  assert.equal(denTrigger.encounter, 'infected-cave-den');
  assert.equal(denTrigger.forceCombat, true);
  assert.equal(denTrigger.radius, 3);

  const caveKinds = new Set(caveLevel.objects.map((object) => object.kind));
  for (const kind of ['cave-stalagmite', 'cave-stalactites', 'cave-flowstone', 'host-growth']) {
    assert.ok(caveKinds.has(kind), `cave contains ${kind}`);
    assert.ok(getSprite(kind), `${kind} is registered`);
  }
  const caveTag = caveLevel.objects.find((object) => object.id === 'infected-cave-censure-tag');
  assert.ok(caveTag, 'cave has a Censure warning tag near the entry');
  assert.equal(caveTag.kind, 'paper-scraps');
  assert.equal(caveTag.interact?.type, 'note');
  assert.equal(caveTag.interact.log.includes('Burn the teeth'), true);
  assert.ok(getSprite('cave-wall'), 'cave-wall is registered');
  assert.ok(caveLevel.tiles.some((row) => row.includes('~')), 'cave has river floor tiles');

  const chest = caveLevel.objects.find((object) => object.id === 'infected-cave-dry-shelf-chest');
  assert.ok(chest, 'cave chest is placed');
  assert.equal(chest.kind, 'rusted-reliquary');
  assert.equal(chest.name, 'Cave Chest');
  assert.equal(chest.interact?.type, 'container');
  assert.deepEqual(chest.interact?.loot, [
    { item: 'ducat', count: 60 },
    { item: 'field-dressing', count: 1 },
    { item: 'pilgrim-ribguard', count: 1 }
  ]);
  assert.equal(pilgrimRibguard.rarity, 'epic');
  assert.equal(pilgrimRibguard.build, 'road-ghost');
  assert.equal(pilgrimRibguard.groundModel, 'ribguard');
  assert.equal(pilgrimRibguard.equipment?.slot, 'armor');
}

{
  for (const spec of farmInteriors) {
    const interior = spec.level;
    const interiorGrid = new Grid(interior);
    addBlockingObjects(interiorGrid, interior.objects ?? []);
    assert.equal(interior.tileSize, 64, `${spec.key} interior uses the standard tile size`);
    assert.ok(interior.quests.includes('investigate-ash-chapel-cult'), `${spec.key} interior keeps the Act I quest context`);
    assert.ok(interior.dialogue.includes(spec.exitDialogue), `${spec.key} interior lists its exit dialogue`);
    assert.equal(interior.legend['#']?.kind, spec.wallKind, `${spec.key} interior uses its farm wall kind`);
    assert.equal(interior.legend['.']?.floor, spec.floorStyle, `${spec.key} interior uses its farm floor style`);
    assert.ok(getSprite(spec.wallKind), `${spec.wallKind} is registered for ${spec.key} interior`);
    assert.equal(interiorGrid.isWalkable(interior.spawns.player.x, interior.spawns.player.y), true, `${spec.key} spawn is walkable`);

    const exit = interior.objects.find((object) => object.kind === 'farm-door' && object.interact?.dialogue === spec.exitDialogue);
    assert.ok(exit, `${spec.key} interior has a clickable exit door`);
    assert.equal(exit.blocking, true, `${spec.key} exit door blocks its tile`);
    assert.equal(exit.wallPlane, spec.doorWallPlane, `${spec.key} interior exit follows its angled boundary wall`);
    assert.equal(exit.variant, spec.doorVariant, `${spec.key} interior exit door uses the matching farm-door variant`);
    const exitTile = interior.legend[interior.tiles[exit.y][exit.x]];
    assert.equal(exitTile?.kind, spec.wallKind, `${spec.key} interior exit is mounted on its farm wall block`);
    assert.equal(exitTile?.walkable, false, `${spec.key} interior exit occupies a wall cell rather than floating on the floor`);
    assert.equal(exit.y, interior.height - 1, `${spec.key} interior exit is mounted in the south boundary wall`);
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
    for (const kind of spec.dressingKinds) {
      assert.ok(kinds.has(kind), `${spec.key} interior contains ${kind} dressing`);
      assert.ok(getSprite(kind), `${kind} is registered for ${spec.key} interior dressing`);
    }
    const blockingObjects = (interior.objects ?? []).filter((object) => object.blocking);
    const blockingCells = new Set(blockingObjects.map((object) => `${object.x},${object.y}`));
    assert.equal(blockingCells.size, blockingObjects.length, `${spec.key} interior does not stack blocking furniture on one cell`);
    assert.ok(blockingObjects.length >= spec.minBlocking, `${spec.key} interior has enough functional furniture to fill the building`);
    const perimeterBlocking = blockingObjects.filter((object) => (
      object.x <= 3 ||
      object.x >= interior.width - 4 ||
      object.y <= 3 ||
      object.y >= interior.height - 4
    ));
    assert.ok(
      perimeterBlocking.length >= spec.minPerimeterBlocking,
      `${spec.key} interior groups storage and work furniture along room edges`
    );
    assert.equal(
      pathExists(interiorGrid, interior.spawns.player, spec.aisleTarget),
      true,
      `${spec.key} interior keeps a clear aisle from the entrance into the room`
    );
    for (const object of (interior.objects ?? []).filter((entry) => entry.interact)) {
      assert.equal(
        hasReachableAdjacentCell(interiorGrid, interior.spawns.player, object),
        true,
        `${spec.key} interactable ${object.id ?? object.kind} remains reachable around the denser furniture`
      );
    }
    if (spec.floorCrackMin) {
      assert.ok(
        (interior.objects ?? []).filter((object) => object.kind === 'floor-crack').length >= spec.floorCrackMin,
        `${spec.key} interior keeps its added floor crack dressing`
      );
    }
  }
  const barnInterior = farmInteriors.find((spec) => spec.key === 'barn').level;
  const grainInterior = farmInteriors.find((spec) => spec.key === 'grain').level;
  const storageInterior = farmInteriors.find((spec) => spec.key === 'storage').level;
  const toolInterior = farmInteriors.find((spec) => spec.key === 'tool').level;
  assert.ok(barnInterior.objects.some((object) => object.kind === 'chaff-scatter'), 'barn interior uses chaff-scatter');
  const draggedHarness = barnInterior.objects.find((object) => object.id === 'barn-dragged-harness');
  assert.ok(draggedHarness, 'barn has a dragged harness clue');
  assert.equal(draggedHarness.interact?.type, 'note');
  assert.equal(draggedHarness.interact.log.includes('black-gold'), true);
  const rationTally = storageInterior.objects.find((object) => object.id === 'storage-shed-ration-tally');
  assert.ok(rationTally, 'storage shed has a ration-control note');
  assert.equal(rationTally.interact?.type, 'note');
  assert.equal(rationTally.interact.log.includes('last bell'), true);
  assert.ok(grainInterior.objects.some((object) => object.kind === 'chaff-scatter'), 'grain shed interior uses chaff-scatter');
  const feedNote = grainInterior.objects.find((object) => object.id === 'grain-shed-feed-note');
  assert.ok(feedNote, 'grain shed has a wolf-feeding note');
  assert.equal(feedNote.interact?.type, 'note');
  assert.equal(feedNote.interact.log.includes('little wolf'), true);
  const toolCrate = toolInterior.objects.find((object) => object.id === 'tool-shed-rusted-crate');
  assert.ok(toolCrate.interact?.search, 'tool shed crate has a search payoff');
  assert.equal(toolCrate.interact.search.methods[0].field, 'search');
  assert.deepEqual(toolCrate.interact.search.methods[0].success.inventory.add, [
    { item: 'relic-rounds', count: 1 }
  ]);
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

{
  const gateManifest = [
    { object: 'long-ash-holt-water-pump', source: 'search', method: 'strip-pump-collar', field: 'engineering', dc: 40, flag: 'long-ash-pump-sabotage-found' },
    { object: 'long-ash-holt-farm-cart', source: 'search', method: 'count-drag-marks', field: 'search', dc: 45, flag: 'long-ash-farm-cart-drag-read' },
    { object: 'long-ash-farm-victim-father', source: 'search', method: 'read-holt-death-order', field: 'medicine', dc: 40, flag: 'long-ash-holt-death-order-read' },
    { object: 'long-ash-farm-victim-father', source: 'search', method: 'read-erased-defense', field: 'hostSigns', dc: 60, flag: 'long-ash-holt-erased-defense-read' },
    { object: 'long-ash-holt-tool-rack', source: 'search', method: 'straighten-coffer-hinge', field: 'security', dc: 50, flag: 'long-ash-tool-coffer-opened' },
    { object: 'long-ash-holt-tool-rack', source: 'search', method: 'tear-coffer-hinge', primary: 'body', dc: 7, flag: 'long-ash-tool-coffer-opened' },
    { object: 'long-ash-stripped-cart', source: 'search', method: 'find-hidden-axle-cord', field: 'search', dc: 40, flag: 'long-ash-cart-axle-cord-found' },
    { object: 'long-ash-stripped-cart', source: 'search', method: 'reconstruct-cart-break', field: 'engineering', dc: 55, flag: 'long-ash-cart-sabotage-proved' },
    { object: 'long-ash-kill-cultist-stable', source: 'search', method: 'separate-kill-site-wounds', field: 'medicine', dc: 45, flag: 'long-ash-kill-site-wounds-read' },
    { object: 'long-ash-kill-cultist-stable', source: 'search', method: 'test-for-fresh-opening', field: 'hostSigns', dc: 60, flag: 'long-ash-kill-site-no-opening-found' },
    { object: 'long-ash-kill-wolf-ribsplit', source: 'search', method: 'read-staged-prayer-knots', field: 'doctrine', dc: 50, flag: 'long-ash-wolf-prayer-knots-found' },
    { object: 'long-ash-old-bell-marker', source: 'search', method: 'read-clapper-removal', field: 'engineering', dc: 45, flag: 'long-ash-old-bell-clapper-removed' },
    { object: 'long-ash-old-bell-marker', source: 'search', method: 'read-erased-peal-rule', field: 'doctrine', dc: 50, flag: 'long-ash-old-bell-peal-rule-read' },
    { object: 'long-ash-bell-cache-stones', source: 'search', method: 'trace-bell-cache-stones', field: 'search', dc: 55, flag: 'long-ash-bell-cache-found' },
    { object: 'grave-eren-voss', source: 'search', method: 'compare-grave-calcification', field: 'medicine', dc: 45, flag: 'long-ash-grave-order-read' },
    { object: 'grave-eren-voss', source: 'search', method: 'audit-grave-handling', field: 'containment', dc: 60, flag: 'long-ash-grave-burial-error-found' },
    { object: 'grave-eren-voss', source: 'search', method: 'read-grave-response-pattern', field: 'hostSigns', dc: 65, flag: 'long-ash-grave-response-pattern-found' },
    { object: 'long-ash-warden-cart-crate', source: 'lock', method: 'recover-warden-route-strip', field: 'search', dc: 45, flag: 'long-ash-warden-route-strip-found' },
    { object: 'long-ash-north-route-post', source: 'search', method: 'restore-route-peal-rule', field: 'doctrine', dc: 45, flag: 'long-ash-route-post-peal-rule-found' },
    { object: 'long-ash-dry-stave-barrel', source: 'lock', method: 'find-dry-inner-stave', field: 'search', dc: 40, flag: 'long-ash-dry-stave-cache-found' },
    { object: 'long-ash-forest-cache-stump', source: 'search', method: 'follow-erased-cache-signs', field: 'search', dc: 63, flag: 'long-ash-forest-cache-found' },
    { object: 'long-ash-holt-forest-stash', source: 'lock', method: 'read-holt-stash-knot', field: 'search', dc: 40, flag: 'long-ash-holt-stash-knot-read' }
  ];

  const ids = (level.objects ?? []).map((object) => object.id).filter(Boolean);
  assert.equal(new Set(ids).size, ids.length, 'Long Ash authored object ids remain unique');

  const ordinaryMaximum = 63;
  const scarFieldMaximum = 68;
  const primaryMaximum = 7;
  const gateDcs = new Set();
  const gateFields = new Set();
  for (const expected of gateManifest) {
    const object = level.objects.find((entry) => entry.id === expected.object);
    assert.ok(object, `${expected.object} is placed`);
    assert.ok(getSprite(object.kind), `${expected.object} uses registered ${object.kind} art`);
    assert.equal(
      hasReachableAdjacentCell(grid, level.spawns.player, object),
      true,
      `${expected.object} has a reachable use cell`
    );
    const source = object.interact?.[expected.source];
    assert.ok(source, `${expected.object} exposes ${expected.source} methods`);
    const method = source.methods.find((entry) => entry.id === expected.method);
    assert.ok(method, `${expected.object} keeps stable method ${expected.method}`);
    assert.equal(method.field, expected.field, `${expected.method} uses the planned field`);
    assert.equal(method.primary, expected.primary, `${expected.method} uses the planned primary`);
    assert.equal(method.dc, expected.dc, `${expected.method} keeps its calibrated threshold`);
    assert.equal([].concat(method.success?.setFlag ?? []).includes(expected.flag), true, `${expected.method} records ${expected.flag}`);
    if (method.primary) {
      assert.ok(method.dc <= primaryMaximum, `${expected.method} is achievable at the primary creation cap`);
    } else {
      const maximum = ['hostSigns', 'containment', 'purgationTools'].includes(method.field)
        ? scarFieldMaximum
        : ordinaryMaximum;
      assert.ok(method.dc <= maximum, `${expected.method} is achievable by a legal starting specialist`);
      gateDcs.add(method.dc);
      gateFields.add(method.field);
    }
  }
  assert.deepEqual([...gateDcs].sort((a, b) => a - b), [40, 45, 50, 55, 60, 63, 65], 'road checks span easy through creation-cap thresholds');
  assert.deepEqual([...gateFields].sort(), ['containment', 'doctrine', 'engineering', 'hostSigns', 'medicine', 'search', 'security'], 'road checks reward seven distinct fields');
  assert.equal(
    gateManifest.filter((entry) => entry.primary === 'body' && entry.dc === 7).length,
    1,
    'one optional gate requires a maxed Body primary'
  );

  const journalFlags = new Set((level.journalNotes ?? []).map((note) => note.flag));
  for (const flag of new Set(gateManifest.map((entry) => entry.flag))) {
    assert.ok(journalFlags.has(flag), `${flag} unlocks a journal finding`);
  }
  assert.equal(journalFlags.size, level.journalNotes.length, 'Long Ash journal finding flags are unique');
}

{
  const lootManifest = new Map([
    ['long-ash-warden-cart-crate', [
      { item: 'ducat', count: 4 },
      { item: 'tinned-beans', count: 1 },
      { item: 'relic-rounds', count: 1 }
    ]],
    ['long-ash-kill-site-satchel', [
      { item: 'ducat', count: 2 },
      { item: 'road-warden-chit', count: 1 }
    ]],
    ['long-ash-bell-side-satchel', [
      { item: 'ducat', count: 4 },
      { item: 'censure-entry-roll', count: 1 },
      { item: 'road-warden-chit', count: 1 }
    ]],
    ['long-ash-dry-stave-barrel', [
      { item: 'tinned-beans', count: 1 },
      { item: 'field-dressing', count: 1 }
    ]],
    ['long-ash-forest-specialist-cache', [
      { item: 'ducat', count: 8 },
      { item: 'relic-rounds', count: 2 },
      { item: 'tarnished-saint-token', count: 1 }
    ]],
    ['long-ash-holt-forest-stash', [
      { item: 'ducat', count: 12 },
      { item: 'road-warden-chit', count: 1 },
      { item: 'tarnished-saint-token', count: 1 }
    ]]
  ]);
  for (const [objectId, expectedLoot] of lootManifest) {
    const object = level.objects.find((entry) => entry.id === objectId);
    assert.equal(object?.interact?.type, 'container', `${objectId} is a deterministic container`);
    assert.deepEqual(object.interact.loot, expectedLoot, `${objectId} keeps its modest authored reward`);
  }

  const toolRack = level.objects.find((object) => object.id === 'long-ash-holt-tool-rack');
  const cofferMethods = toolRack.interact.search.methods;
  for (const method of cofferMethods) {
    assert.deepEqual(method.success.inventory.add, [
      { item: 'field-dressing', count: 1 },
      { item: 'penitent-gear-scrap', count: 2 }
    ], `${method.id} opens the same tool-coffer reward`);
    assert.equal(method.conditions.notFlag, 'long-ash-tool-coffer-opened', `${method.id} cannot duplicate the shared reward`);
  }
  assert.equal(
    [].concat(cofferMethods.find((method) => method.id === 'tear-coffer-hinge').success.setFlag).includes('long-ash-tool-coffer-forced'),
    true,
    'the Body route records its loud forced result'
  );
}

{
  const stash = level.objects.find((object) => object.id === 'long-ash-holt-forest-stash');
  assert.deepEqual(stash.visibleWhenFlags, [
    'long-ash-field-family-truth',
    'long-ash-field-family-lie'
  ], 'Eleazar outcome flags reveal the old Carbo stash');
  const hiddenStash = structuredClone(stash);
  syncObjectFlagState(hiddenStash, new Set());
  assert.equal(hiddenStash.hiddenByFlag, true, 'the Carbo stash is concealed before Eleazar gives its location');
  syncObjectFlagState(hiddenStash, new Set(['long-ash-field-family-truth']));
  assert.equal(hiddenStash.hiddenByFlag, false, 'truthful news reveals the Carbo stash');
  syncObjectFlagState(hiddenStash, new Set(['long-ash-field-family-lie']));
  assert.equal(hiddenStash.hiddenByFlag, false, 'kind news also reveals the Carbo stash');

  const killSiteSatchel = level.objects.find((object) => object.id === 'long-ash-kill-site-satchel');
  const hiddenSatchel = structuredClone(killSiteSatchel);
  syncObjectFlagState(hiddenSatchel, new Set());
  assert.equal(hiddenSatchel.hiddenByFlag, true, 'the discarded satchel is concealed before the casualty trail is read');
  syncObjectFlagState(hiddenSatchel, new Set(['long-ash-kill-site-wounds-read']));
  assert.equal(hiddenSatchel.hiddenByFlag, false, 'Medicine evidence reveals the discarded satchel');

  const bellSatchel = structuredClone(level.objects.find((object) => object.id === 'long-ash-bell-side-satchel'));
  syncObjectFlagState(bellSatchel, new Set());
  assert.equal(bellSatchel.hiddenByFlag, true, 'the bell satchel is concealed below the shoulder stones');
  syncObjectFlagState(bellSatchel, new Set(['long-ash-bell-cache-found']));
  assert.equal(bellSatchel.hiddenByFlag, false, 'the Search 55 result reveals the bell satchel');

  const forestSatchel = structuredClone(level.objects.find((object) => object.id === 'long-ash-forest-specialist-cache'));
  syncObjectFlagState(forestSatchel, new Set());
  assert.equal(forestSatchel.hiddenByFlag, true, 'the specialist cache is concealed before the placement signs are read');
  syncObjectFlagState(forestSatchel, new Set(['long-ash-forest-cache-found']));
  assert.equal(forestSatchel.hiddenByFlag, false, 'the Search 63 result reveals the specialist cache');
}

{
  const corpseIds = [
    'long-ash-kill-cultist-west',
    'long-ash-kill-cultist-south',
    'long-ash-kill-cultist-stable',
    'long-ash-kill-cultist-east',
    'long-ash-kill-cultist-center',
    'long-ash-kill-wolf-spider',
    'long-ash-kill-wolf-maw',
    'long-ash-kill-wolf-ribsplit',
    'long-ash-farm-victim-father',
    'long-ash-farm-victim-mother',
    'long-ash-farm-victim-grandparent',
    'long-ash-farm-victim-older-child',
    'long-ash-farm-victim-younger-child'
  ];
  const corpseLogs = corpseIds.map((id) => {
    const object = level.objects.find((entry) => entry.id === id);
    assert.ok(object, `${id} has a stable authored id`);
    return object.interact?.log;
  });
  assert.equal(corpseLogs.every((log) => typeof log === 'string' && log.length > 20), true, 'every road corpse has a useful inspection line');
  assert.equal(new Set(corpseLogs).size, corpseLogs.length, 'cultists, wolves, and Holts no longer repeat one corpse account');

  assert.equal(pathExists(grid, level.spawns.player, { x: 116, y: 0 }), true, 'new content keeps the Censure road exit reachable');
  assert.equal(pathExists(grid, level.spawns.player, { x: 24, y: 42 }), true, 'new content keeps the Carbo farm gate reachable');
  assert.equal(pathExists(grid, level.spawns.player, { x: 127, y: 56 }), true, 'new content keeps the graveyard gate reachable');
}
