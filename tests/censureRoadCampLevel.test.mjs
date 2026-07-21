import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import { meetsDialogueConditions } from '../src/core/DialogueConditions.js';
import { DialogueEffects } from '../src/core/DialogueEffects.js';
import { Inventory } from '../src/core/Inventory.js';
import { getSprite } from '../src/render/spriteCatalog.js';
import { Grid } from '../src/world/Grid.js';
import { isTargetInReach, resolveInteractionTargetAtCell } from '../src/world/InteractionTargeting.js';
import { lockMethodStatus } from '../src/world/LockSystem.js';
import { searchMethodStatus } from '../src/world/SearchSystem.js';

async function readJson(path) {
  return JSON.parse(await readFile(new URL(path, import.meta.url), 'utf8'));
}

function addBlockingObjects(grid, objects) {
  for (const object of objects) {
    if (object.blocking) grid.addBlocked(object.x, object.y);
  }
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

function reachableInteractionApproach(level, grid, object, start) {
  const candidates = [
    { x: object.x, y: object.y },
    { x: object.x + 1, y: object.y },
    { x: object.x - 1, y: object.y },
    { x: object.x, y: object.y + 1 },
    { x: object.x, y: object.y - 1 },
    { x: object.x + 1, y: object.y + 1 },
    { x: object.x + 1, y: object.y - 1 },
    { x: object.x - 1, y: object.y + 1 },
    { x: object.x - 1, y: object.y - 1 }
  ].filter((cell) => grid.isWalkable(cell.x, cell.y));

  for (const candidate of candidates) {
    if (!pathExists(grid, start, candidate)) continue;
    const target = interactionTarget(level, grid, object, candidate);
    if (target?.type === 'object' && target.object.id === object.id && isTargetInReach({ position: candidate }, target)) {
      return candidate;
    }
  }
  return null;
}

function tileComponents(level, tileChar) {
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
      const key = `${x},${y}`;
      if (seen.has(key) || level.tiles[y][x] !== tileChar) continue;
      const cells = [];
      const queue = [{ x, y }];
      seen.add(key);
      for (let index = 0; index < queue.length; index += 1) {
        const cell = queue[index];
        cells.push(cell);
        for (const dir of dirs) {
          const next = { x: cell.x + dir.x, y: cell.y + dir.y };
          const nextKey = `${next.x},${next.y}`;
          if (
            seen.has(nextKey)
            || next.x < 0
            || next.y < 0
            || next.x >= level.width
            || next.y >= level.height
            || level.tiles[next.y][next.x] !== tileChar
          ) continue;
          seen.add(nextKey);
          queue.push(next);
        }
      }
      components.push(cells);
    }
  }
  return components;
}

function objectById(level, id) {
  const object = level.objects.find((entry) => entry.id === id);
  assert.ok(object, `${id} exists`);
  return object;
}

function searchMethodById(object, methodId) {
  const method = object.interact?.search?.methods?.find((entry) => entry.id === methodId);
  assert.ok(method, `${object.id} has Search method ${methodId}`);
  return method;
}

function lockMethodById(object, methodId) {
  const method = object.interact?.lock?.methods?.find((entry) => entry.id === methodId);
  assert.ok(method, `${object.id} has lock method ${methodId}`);
  return method;
}

function asArray(value) {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value : [value];
}

function assertOneShotDialogueHandoff(choice, sourceFlags, acknowledgedFlag) {
  assert.ok(choice, `${acknowledgedFlag} has a dialogue choice`);
  const requiredFlags = new Set([
    ...asArray(choice.conditions?.flag),
    ...asArray(choice.conditions?.flags)
  ]);
  for (const flag of sourceFlags) {
    assert.equal(requiredFlags.has(flag), true, `${acknowledgedFlag} requires ${flag}`);
  }
  assert.equal(asArray(choice.conditions?.flagsAbsent).includes(acknowledgedFlag), true);
  assert.equal(asArray(choice.effects?.setFlag).includes(acknowledgedFlag), true);
  assert.equal(meetsDialogueConditions(choice.conditions, { flags: new Set(sourceFlags) }), true);
  assert.equal(meetsDialogueConditions(choice.conditions, {
    flags: new Set([...sourceFlags, acknowledgedFlag])
  }), false);
}

function assertSearchBoundary(method, ratingId, dc, kind = 'field') {
  const context = {
    inventory: { has: () => true },
    fieldRating: (id) => (id === ratingId ? dc - 1 : 0),
    primaryRating: (id) => (id === ratingId ? dc - 1 : 0)
  };
  assert.equal(searchMethodStatus(method, context).success, false, `${method.id} fails at ${dc - 1}`);
  if (kind === 'primary') context.primaryRating = (id) => (id === ratingId ? dc : 0);
  else context.fieldRating = (id) => (id === ratingId ? dc : 0);
  assert.equal(searchMethodStatus(method, context).success, true, `${method.id} succeeds at ${dc}`);
}

function pointInAreas(point, areas = []) {
  return areas.some((area) => {
    const left = Math.min(area.x0, area.x1);
    const right = Math.max(area.x0, area.x1);
    const top = Math.min(area.y0, area.y1);
    const bottom = Math.max(area.y0, area.y1);
    return point.x >= left && point.x <= right && point.y >= top && point.y <= bottom;
  });
}

function tileAt(level, point) {
  return level.tiles[point.y]?.[point.x] ?? null;
}

function interactionTarget(level, grid, object, player, cell = object) {
  return resolveInteractionTargetAtCell({
    cell: { x: cell.x, y: cell.y },
    grid,
    player: { position: player },
    actors: [],
    enemies: [],
    interactables: level.objects.filter((entry) => entry.interact),
    mode: 'explore'
  });
}

function assertDeliberateTravelDialogue(dialogue, id, path, player) {
  assert.equal(dialogue.id, id, `${id} dialogue file has the matching ID`);
  const choices = dialogue.nodes?.start?.choices ?? [];
  assert.equal(choices.length, 2, `${id} offers travel or staying put`);

  const travelChoices = choices.filter((choice) => choice.effects?.loadLevel);
  assert.equal(travelChoices.length, 1, `${id} has exactly one travel choice`);
  assert.equal(travelChoices[0].close, true, `${id} closes after deliberate travel`);
  assert.equal(travelChoices[0].effects.loadLevel.path, path, `${id} loads the intended level`);
  assert.deepEqual(travelChoices[0].effects.loadLevel.player, player, `${id} uses the intended arrival point`);

  const stayChoices = choices.filter((choice) => !choice.effects?.loadLevel);
  assert.equal(stayChoices.length, 1, `${id} has exactly one non-travel choice`);
  assert.match(stayChoices[0].label, /^Stay\b/, `${id} names the non-travel choice clearly`);
  assert.equal(stayChoices[0].close, true, `${id} closes after staying put`);
}

const level = await readJson('../data/levels/censure_road_camp.json');
const grid = new Grid(level);
addBlockingObjects(grid, level.objects ?? []);
const longAsh = await readJson('../data/levels/long_ash_road_approach.json');
const longAshGrid = new Grid(longAsh);
addBlockingObjects(longAshGrid, longAsh.objects ?? []);
const longAshToCamp = await readJson('../data/dialogue/long-ash-censure-road-camp-exit.json');
const campToLongAsh = await readJson('../data/dialogue/censure-road-camp-long-ash-road-exit.json');
const hallowfenGate = await readJson('../data/dialogue/censure-road-camp-hallowfen-gate.json');
const odranDialogue = await readJson('../data/dialogue/censure-road-camp-odran.json');
const odranWatch = await readJson('../data/dialogue/censure-road-odran-watch.json');
const pellDialogue = await readJson('../data/dialogue/censure-road-camp-pell.json');
const caldusDialogue = await readJson('../data/dialogue/censure-road-camp-caldus.json');
const runaDialogue = await readJson('../data/dialogue/censure-road-camp-runa.json');
const seraDialogue = await readJson('../data/dialogue/censure-road-camp-sera.json');
const hanneDialogue = await readJson('../data/dialogue/censure-road-camp-hanne.json');
const joricDialogue = await readJson('../data/dialogue/censure-road-camp-joric.json');
const malcoDialogue = await readJson('../data/dialogue/censure-road-camp-malco.json');
const brunaDialogue = await readJson('../data/dialogue/censure-road-camp-widow-bruna.json');
const maevActor = await readJson('../data/actors/censure-sutler-maev.json');
const maevDialogue = await readJson('../data/dialogue/censure-road-camp-maev.json');
const vossDialogue = await readJson('../data/dialogue/censure-road-camp-voss.json');
const confessionQuest = await readJson('../data/quests/censure-road-confession.json');
const absolutionChit = await readJson('../data/items/censure-absolution-chit.json');
const campRibguard = await readJson('../data/items/camp-issue-ribguard.json');
const choirHymnalFragment = await readJson('../data/items/choir-hymnal-fragment.json');
const choirTallyStrip = await readJson('../data/items/choir-tally-strip.json');
const tentSpecs = [
  {
    objectId: 'censure-road-odran-private-tent-flap',
    entryDialogueId: 'censure-road-odran-tent-entry',
    entryDialogueFile: '../data/dialogue/censure-road-odran-tent-entry.json',
    exitDialogueId: 'censure-road-odran-tent-exit',
    exitDialogueFile: '../data/dialogue/censure-road-odran-tent-exit.json',
    interiorPath: './data/levels/censure_road_odran_tent_interior.json',
    interiorFile: '../data/levels/censure_road_odran_tent_interior.json',
    returnPlayer: { x: 16, y: 19 },
    interiorPlayer: { x: 8, y: 7 },
    interiorExit: { x: 8, y: 8 },
    interiorFlap: { x: 8, y: 9 },
    approach: { x: 16, y: 19 },
    clickAreas: [{ x0: 14, y0: 14, x1: 17, y1: 18 }]
  },
  {
    objectId: 'censure-road-writ-chapel-flap',
    entryDialogueId: 'censure-road-writ-chapel-tent-entry',
    entryDialogueFile: '../data/dialogue/censure-road-writ-chapel-tent-entry.json',
    exitDialogueId: 'censure-road-writ-chapel-tent-exit',
    exitDialogueFile: '../data/dialogue/censure-road-writ-chapel-tent-exit.json',
    interiorPath: './data/levels/censure_road_writ_chapel_tent.json',
    interiorFile: '../data/levels/censure_road_writ_chapel_tent.json',
    returnPlayer: { x: 23, y: 17 },
    interiorPlayer: { x: 6, y: 7 },
    interiorExit: { x: 6, y: 8 },
    interiorFlap: { x: 6, y: 9 },
    approach: { x: 23, y: 17 },
    clickAreas: [{ x0: 20, y0: 12, x1: 26, y1: 16 }]
  },
  {
    objectId: 'censure-road-preceptor-tent-flap',
    entryDialogueId: 'censure-road-preceptor-tent-entry',
    entryDialogueFile: '../data/dialogue/censure-road-preceptor-tent-entry.json',
    exitDialogueId: 'censure-road-preceptor-tent-exit',
    exitDialogueFile: '../data/dialogue/censure-road-preceptor-tent-exit.json',
    interiorPath: './data/levels/censure_road_preceptor_tent.json',
    interiorFile: '../data/levels/censure_road_preceptor_tent.json',
    returnPlayer: { x: 47, y: 13 },
    interiorPlayer: { x: 6, y: 7 },
    interiorExit: { x: 6, y: 8 },
    interiorFlap: { x: 6, y: 9 },
    approach: { x: 47, y: 13 },
    clickAreas: [{ x0: 43, y0: 8, x1: 49, y1: 12 }]
  },
  {
    objectId: 'censure-road-quartermaster-tent-flap',
    entryDialogueId: 'censure-road-quartermaster-tent-entry',
    entryDialogueFile: '../data/dialogue/censure-road-quartermaster-tent-entry.json',
    exitDialogueId: 'censure-road-quartermaster-tent-exit',
    exitDialogueFile: '../data/dialogue/censure-road-quartermaster-tent-exit.json',
    interiorPath: './data/levels/censure_road_quartermaster_tent.json',
    interiorFile: '../data/levels/censure_road_quartermaster_tent.json',
    returnPlayer: { x: 28, y: 30 },
    interiorPlayer: { x: 6, y: 7 },
    interiorExit: { x: 6, y: 8 },
    interiorFlap: { x: 6, y: 9 },
    approach: { x: 28, y: 30 },
    clickAreas: [{ x0: 24, y0: 25, x1: 32, y1: 29 }]
  },
  {
    objectId: 'censure-road-supply-tent-flap',
    entryDialogueId: 'censure-road-supply-tent-entry',
    entryDialogueFile: '../data/dialogue/censure-road-supply-tent-entry.json',
    exitDialogueId: 'censure-road-supply-tent-exit',
    exitDialogueFile: '../data/dialogue/censure-road-supply-tent-exit.json',
    interiorPath: './data/levels/censure_road_supply_tent.json',
    interiorFile: '../data/levels/censure_road_supply_tent.json',
    returnPlayer: { x: 39, y: 36 },
    interiorPlayer: { x: 9, y: 7 },
    interiorExit: { x: 9, y: 8 },
    interiorFlap: { x: 9, y: 9 },
    approach: { x: 39, y: 36 },
    clickAreas: [
      { x0: 35, y0: 31, x1: 38, y1: 35 },
      { x0: 40, y0: 31, x1: 43, y1: 35 }
    ]
  },
  {
    objectId: 'censure-road-sutler-tent-flap',
    entryDialogueId: 'censure-road-sutler-tent-entry',
    entryDialogueFile: '../data/dialogue/censure-road-sutler-tent-entry.json',
    exitDialogueId: 'censure-road-sutler-tent-exit',
    exitDialogueFile: '../data/dialogue/censure-road-sutler-tent-exit.json',
    interiorPath: './data/levels/censure_road_sutler_tent.json',
    interiorFile: '../data/levels/censure_road_sutler_tent.json',
    returnPlayer: { x: 50, y: 37 },
    interiorPlayer: { x: 5, y: 7 },
    interiorExit: { x: 5, y: 8 },
    interiorFlap: { x: 5, y: 9 },
    approach: { x: 50, y: 37 },
    clickAreas: [{ x0: 48, y0: 32, x1: 53, y1: 36 }]
  },
  {
    objectId: 'censure-road-medic-tent-flap',
    entryDialogueId: 'censure-road-medic-tent-entry',
    entryDialogueFile: '../data/dialogue/censure-road-medic-tent-entry.json',
    exitDialogueId: 'censure-road-medic-tent-exit',
    exitDialogueFile: '../data/dialogue/censure-road-medic-tent-exit.json',
    interiorPath: './data/levels/censure_road_medic_tent.json',
    interiorFile: '../data/levels/censure_road_medic_tent.json',
    returnPlayer: { x: 60, y: 46 },
    interiorPlayer: { x: 2, y: 7 },
    interiorExit: { x: 1, y: 7 },
    interiorFlap: { x: 0, y: 7 },
    approach: { x: 60, y: 46 },
    clickAreas: [{ x0: 61, y0: 42, x1: 65, y1: 46 }]
  },
  {
    objectId: 'censure-road-quarters-tent-flap',
    entryDialogueId: 'censure-road-quarters-tent-entry',
    entryDialogueFile: '../data/dialogue/censure-road-quarters-tent-entry.json',
    exitDialogueId: 'censure-road-quarters-tent-exit',
    exitDialogueFile: '../data/dialogue/censure-road-quarters-tent-exit.json',
    interiorPath: './data/levels/censure_road_quarters_tent.json',
    interiorFile: '../data/levels/censure_road_quarters_tent.json',
    returnPlayer: { x: 16, y: 41 },
    interiorPlayer: { x: 6, y: 7 },
    interiorExit: { x: 6, y: 8 },
    interiorFlap: { x: 6, y: 9 },
    approach: { x: 16, y: 41 },
    clickAreas: [
      { x0: 11, y0: 31, x1: 13, y1: 34 },
      { x0: 15, y0: 31, x1: 17, y1: 34 },
      { x0: 19, y0: 31, x1: 21, y1: 34 },
      { x0: 11, y0: 37, x1: 13, y1: 40 },
      { x0: 15, y0: 37, x1: 17, y1: 40 },
      { x0: 19, y0: 37, x1: 21, y1: 40 }
    ]
  }
];

{
  assert.equal(level.id, 'censure-road-camp');
  assert.equal(level.name, 'Censure Road Camp');
  assert.equal(level.width, 70);
  assert.equal(level.height, 50);
  assert.equal(level.tiles.length, level.height);
  for (const [index, row] of level.tiles.entries()) {
    assert.equal(row.length, level.width, `camp row ${index} is ${level.width} cells`);
  }
  assert.deepEqual(level.spawns.player, { actor: 'mara-vey', x: 34, y: 46 });
  assert.equal(grid.isWalkable(level.spawns.player.x, level.spawns.player.y), true, 'camp spawn is walkable');
  assert.deepEqual(level.spawns.enemies, [], 'the road camp has no enemies in the demo pass');
  assert.deepEqual(level.quests, [
    'investigate-ash-chapel-cult',
    'calcified-brothers',
    'censure-road-confession'
  ]);
}

{
  for (const tile of ['u', 'v', 'l', 't']) {
    assert.equal(level.legend[tile].floor, 'forest-floor', `${tile} renders as dark undergrowth floor`);
    assert.equal(level.legend[tile].walkable, false, `${tile} blocks movement`);
    assert.equal(getSprite(level.legend[tile].kind)?.category, 'plant', `${tile} uses a plant blocker`);
  }
  assert.equal(level.legend.r.floor, 'ash-road');
  assert.equal(level.legend.s.floor, 'road-shoulder');
  assert.equal(level.legend['.'].floor, 'packed-earth');
  assert.equal(level.legend.m.floor, 'mud-track');
  assert.equal(level.legend.g.floor, 'ash-gravel');
  assert.equal(level.legend.p.floor, 'worn-canvas');
  for (const tile of ['m', 'g', 'p']) {
    assert.equal(level.legend[tile].kind, 'floor', `${tile} remains a floor tile`);
    assert.equal(level.legend[tile].walkable, true, `${tile} remains walkable`);
  }
  const floorCounts = Object.fromEntries(Object.keys(level.legend).map((tile) => [tile, 0]));
  for (const row of level.tiles) {
    for (const tile of row) floorCounts[tile] = (floorCounts[tile] ?? 0) + 1;
  }
  assert.ok(floorCounts.g >= 240, 'camp has ash-gravel work-ground texture');
  assert.ok(floorCounts.m >= 200, 'camp has muddy traffic and drill-yard texture');
  assert.ok(floorCounts.p >= 30, 'camp has worn-canvas floor mats at tent mouths');
  const pathTiles = new Set(['m', 'g', 'p', 'r', 's']);
  for (const [label, point] of [
    ['south spine', { x: 34, y: 46 }],
    ['bell lane', { x: 33, y: 18 }],
    ['north camp spine', { x: 34, y: 20 }],
    ['preceptor spur', { x: 47, y: 14 }],
    ['training ground lane', { x: 54, y: 27 }],
    ['quartermaster lane', { x: 30, y: 31 }],
    ['supply lane', { x: 39, y: 36 }],
    ['sutler lane', { x: 50, y: 37 }],
    ['quarters lane', { x: 16, y: 41 }],
    ['evidence lane', { x: 58, y: 41 }],
    ['medic lane', { x: 60, y: 46 }]
  ]) {
    assert.equal(pathTiles.has(tileAt(level, point)), true, `${label} is marked by a visible path tile`);
    assert.equal(grid.isWalkable(point.x, point.y), true, `${label} remains walkable`);
  }
  for (const point of [
    { x: 0, y: 0 },
    { x: 69, y: 0 },
    { x: 0, y: 49 },
    { x: 69, y: 49 },
    { x: 8, y: 8 },
    { x: 68, y: 46 }
  ]) {
    assert.equal(grid.isWalkable(point.x, point.y), false, `undergrowth blocks ${point.x},${point.y}`);
  }
  assert.equal(grid.isWalkable(34, 48), true, 'south road remains walkable to the return gate');
  assert.equal(grid.isWalkable(66, 16), true, 'east road reaches the sealed gate approach');
  assert.equal(grid.isWalkable(67, 16), false, 'sealed Hallowfen gate blocks the east road');
  assert.equal(pathExists(grid, level.spawns.player, { x: 34, y: 48 }), true, 'spawn reaches the Long Ash return gate');
  assert.equal(pathExists(grid, level.spawns.player, { x: 66, y: 16 }), true, 'spawn reaches the Hallowfen gate approach');
}

{
  const npcs = level.spawns.npcs;
  const expected = [
    'censure-father-odran',
    'censure-preceptor-voss',
    'censure-quartermaster-runa',
    'censure-sutler-maev',
    'censure-brother-caldus',
    'censure-bell-clerk-sera',
    'censure-writ-runner-pell',
    'censure-novice-ivarn',
    'censure-sister-hanne',
    'censure-ash-porter-joric',
    'censure-evidence-keeper-malco',
    'censure-tether-guard-elian',
    'censure-widow-bruna'
  ];
  assert.equal(npcs.length, 13, 'the camp keeps exactly thirteen people');
  assert.deepEqual(npcs.map((npc) => npc.actor), expected);
  assert.equal(new Set(npcs.map((npc) => npc.actor)).size, 13, 'camp NPC actors are unique');
  for (const npc of npcs) {
    assert.equal(level.dialogue.includes(npc.dialogue), true, `${npc.dialogue} is loaded by the camp`);
    assert.equal(grid.isWalkable(npc.x, npc.y), true, `${npc.actor} stands on walkable ground`);
    assert.equal(pathExists(grid, level.spawns.player, { x: npc.x, y: npc.y }), true, `${npc.actor} is reachable from spawn`);
    assert.equal(Array.isArray(npc.ambient) && npc.ambient.length > 0, true, `${npc.actor} has an ambient line`);
  }
}

{
  const requiredSites = [
    'censure-road-writ-chapel-flap',
    'censure-road-odran-private-tent-flap',
    'censure-road-confession-screen',
    'censure-road-bell-mast',
    'censure-road-preceptor-tent-flap',
    'censure-road-drill-yard-chalk',
    'censure-road-sword-yard-dummy-west',
    'censure-road-sword-yard-dummy-east',
    'censure-road-shooting-range-target-left',
    'censure-road-shooting-range-target-center',
    'censure-road-shooting-range-target-right',
    'censure-road-quartermaster-table',
    'censure-road-supply-tent-flap',
    'censure-road-sutler-tent-flap',
    'censure-road-sutler-cart',
    'censure-road-evidence-shed-door',
    'censure-road-medic-tent-flap',
    'censure-road-quarters-tent-flap',
    'censure-road-writ-board',
    'censure-road-tether-line',
    'censure-road-ash-latrines',
    'censure-road-water-barrel-45'
  ];
  for (const id of requiredSites) objectById(level, id);
  assert.ok(level.objects.filter((object) => object.kind === 'farm-fence' && object.blocking).length >= 180, 'camp walls are fenced around the playable area');
  const tentTiles = level.tiles.join('').split('').filter((tile) => tile === 'C').length;
  assert.ok(tentTiles >= 250, 'camp uses mapped multi-cell tents for work and quarters');
  assert.equal(level.legend.C.kind, 'canvas-tent-building-block');
  assert.equal(getSprite(level.legend.C.kind)?.block, true, 'camp tent bodies are connected render blocks');
  assert.equal(level.objects.filter((object) => object.kind === 'canvas-tent-flap').length, tentSpecs.length);
  assert.equal(objectById(level, 'censure-road-evidence-shed-door').variant, 'storage-shed');
  assert.equal(level.legend.S.kind, 'storage-shed-building-block', 'evidence shed uses the existing storage shed block');
  assert.ok(tileComponents(level, 'C').length >= 10, 'camp tents are arranged as separate chapel, command, supply, trade, medical, and quarters footprints');
  for (const [label, point] of [
    ['first bay lane', { x: 14, y: 38 }],
    ['second bay lane', { x: 18, y: 38 }],
    ['row walk lane', { x: 16, y: 35 }]
  ]) {
    assert.notEqual(tileAt(level, point), 'C', `cult-breaker quarters keep a ${label} between tents`);
    assert.equal(grid.isWalkable(point.x, point.y), true, `cult-breaker quarters ${label} is walkable`);
  }
  assert.notEqual(level.tiles[34][39], 'C', 'supply tents keep a work lane between the two supply bays');
  assert.equal(grid.isWalkable(39, 34), true, 'supply tent work lane is walkable');
  assert.ok(level.objects.filter((object) => object.id?.startsWith('censure-road-drill-yard-rope-')).length >= 6, 'drill yard has rope and stake detail');
  assert.ok(level.objects.filter((object) => object.id?.startsWith('censure-road-drill-yard-chalk')).length >= 4, 'drill yard has readable chalk marks');
  assert.equal(getSprite('training-dummy')?.category, 'furniture', 'training dummies are cataloged as furniture');
  assert.equal(getSprite('devil-target')?.category, 'structure', 'shooting range targets are cataloged as structures');
  for (const kind of ['trampled-mud', 'practice-scars', 'spent-casings']) {
    assert.equal(getSprite(kind)?.flat, true, `${kind} renders as a flat ground texture`);
  }
  assert.ok(level.objects.filter((object) => object.kind === 'trampled-mud').length >= 20, 'training spaces have trampled ground texture');
  assert.ok(level.objects.filter((object) => object.kind === 'practice-scars').length >= 6, 'sword yard has cut and chalk ground marks');
  assert.ok(level.objects.filter((object) => object.kind === 'spent-casings').length >= 6, 'shooting range has spent casing detail');
  assert.equal(level.objects.filter((object) => object.kind === 'training-dummy').length, 2, 'sword yard has two training dummies');
  assert.equal(level.objects.filter((object) => object.kind === 'devil-target').length, 3, 'shooting range has three devil targets');
  const swordDummy = objectById(level, 'censure-road-sword-yard-dummy-west');
  assert.equal(swordDummy.interact?.type, 'note', 'sword yard dummy is inspectable');
  assert.equal(swordDummy.mapMarker?.label, 'Sword Yard');
  const rangeTarget = objectById(level, 'censure-road-shooting-range-target-center');
  assert.equal(rangeTarget.interact?.type, 'note', 'center devil target is inspectable');
  assert.equal(rangeTarget.mapMarker?.label, 'Shooting Range');
  assert.equal(pathExists(grid, level.spawns.player, { x: 54, y: 27 }), true, 'spawn reaches the shooting range firing line');
}

{
  const exteriorSearchGates = [
    ['censure-road-writ-board', 'find-erased-road-name', 'search', 40, 'field'],
    ['censure-road-writ-board', 'test-forged-board-correction', 'guile', 50, 'field'],
    ['censure-road-bell-mast', 'read-bell-rope-splice', 'engineering', 40, 'field'],
    ['censure-road-bell-mast', 'restore-bell-peal-rule', 'doctrine', 45, 'field'],
    ['censure-road-shooting-range-target-center', 'read-useful-shot-pattern', 'firearms', 45, 'field'],
    ['censure-road-shooting-range-target-center', 'spot-hidden-clerk-mark', 'eye', 7, 'primary'],
    ['censure-road-quartermaster-table', 'find-ledger-weight-mismatch', 'search', 45, 'field'],
    ['censure-road-medic-field-kit', 'identify-reused-dressing', 'medicine', 45, 'field'],
    ['censure-road-medic-field-kit', 'identify-isolated-host-stain', 'hostSigns', 60, 'field'],
    ['censure-road-evidence-shed-door', 'classify-low-risk-sack', 'containment', 50, 'field'],
    ['censure-road-evidence-shed-door', 'find-active-evidence-packet', 'hostSigns', 60, 'field'],
    ['censure-road-evidence-shed-door', 'steady-sounding-sack', 'nerve', 7, 'primary'],
    ['censure-road-quarters-kit-19-41', 'open-quarters-false-bottom', 'search', 45, 'field'],
    ['censure-road-latrine-contraband-barrel', 'find-dry-contraband-wrap', 'search', 40, 'field']
  ];
  for (const [objectId, methodId, ratingId, dc, kind] of exteriorSearchGates) {
    const object = objectById(level, objectId);
    const method = searchMethodById(object, methodId);
    assert.equal(method[kind], ratingId, `${methodId} uses ${ratingId}`);
    assert.equal(method.dc, dc, `${methodId} keeps its planned threshold`);
    assertSearchBoundary(method, ratingId, dc, kind);
  }

  const rangeEye = searchMethodById(
    objectById(level, 'censure-road-shooting-range-target-center'),
    'spot-hidden-clerk-mark'
  );
  assert.deepEqual(rangeEye.success.inventory.add, [{ item: 'relic-rounds', count: 1 }]);
  assert.equal(rangeEye.success.setFlag, 'censure-road-range-clerk-mark-found');

  const drillSatchel = objectById(level, 'censure-road-drill-yard-satchel');
  assert.deepEqual(drillSatchel.interact.loot, [
    { item: 'relic-rounds', count: 2 },
    { item: 'field-dressing', count: 1 },
    { item: 'ash-road-knife', count: 1 }
  ]);
  const drillClaim = lockMethodById(drillSatchel, 'claim-earned-drill-issue');
  assert.deepEqual(drillClaim.conditions.flags, [
    'censure-road-drill-close-complete',
    'censure-road-drill-range-complete'
  ]);
  assert.equal(meetsDialogueConditions(drillClaim.conditions, {
    flags: new Set(['censure-road-drill-close-complete'])
  }), false, 'one completed drill does not open the issue satchel');
  assert.equal(meetsDialogueConditions(drillClaim.conditions, {
    flags: new Set(['censure-road-drill-close-complete', 'censure-road-drill-range-complete'])
  }), true, 'both completed drills open the issue satchel');

  const issueCrate = objectById(level, 'censure-road-quartermaster-sealed-storage-crate-31-30');
  assert.deepEqual(issueCrate.interact.loot, [
    { item: 'tinned-beans', count: 1 },
    { item: 'field-dressing', count: 1 },
    { item: 'relic-rounds', count: 1 },
    { item: 'ducat', count: 3 },
    { item: 'parish-ward-pistol', count: 1 }
  ]);
  const issueClaim = lockMethodById(issueCrate, 'claim-authorized-field-issue');
  assert.equal(meetsDialogueConditions(issueClaim.conditions, {
    flags: new Set(['censure-road-field-issue-authorized'])
  }), true);
  assert.equal(meetsDialogueConditions(issueClaim.conditions, {
    flags: new Set(['censure-road-field-issue-authorized', 'censure-road-field-issue-claimed'])
  }), false, 'the lawful issue can be claimed only once across both crate locations');

  const bandBarrel = objectById(level, 'censure-road-supply-rusted-barrel-44-35');
  const bandMethod = lockMethodById(bandBarrel, 'lift-collapsed-band');
  assert.equal(bandMethod.primary, 'body');
  assert.equal(bandMethod.dc, 7);
  assert.equal(lockMethodStatus(bandMethod, { primaryRating: () => 6 }).success, false);
  assert.equal(lockMethodStatus(bandMethod, { primaryRating: () => 7 }).success, true);
  assert.deepEqual(bandBarrel.interact.loot, [
    { item: 'penitent-gear-scrap', count: 1 },
    { item: 'tinned-beans', count: 1 }
  ]);

  const quartersCache = searchMethodById(
    objectById(level, 'censure-road-quarters-kit-19-41'),
    'open-quarters-false-bottom'
  );
  assert.deepEqual(quartersCache.success.inventory.add, [
    { item: 'ducat', count: 3 },
    { item: 'road-warden-chit', count: 1 },
    { item: 'tarnished-saint-token', count: 1 }
  ]);
  const latrineCache = searchMethodById(
    objectById(level, 'censure-road-latrine-contraband-barrel'),
    'find-dry-contraband-wrap'
  );
  assert.deepEqual(latrineCache.success.inventory.add, [
    { item: 'ducat', count: 2 },
    { item: 'penitent-gear-scrap', count: 1 }
  ]);

  const journalFlags = new Set((level.journalNotes ?? []).map((note) => note.flag));
  for (const flag of [
    'censure-road-writ-board-erasure-found',
    'censure-road-writ-board-forgery-found',
    'censure-road-bell-splice-found',
    'censure-road-bell-peal-found',
    'censure-road-range-clerk-mark-found',
    'censure-road-ledger-weight-mismatch-found',
    'censure-road-medic-reused-dressing-found',
    'censure-road-medic-host-stain-found',
    'censure-road-evidence-low-risk-classified',
    'censure-road-evidence-active-packet-found',
    'censure-road-evidence-sack-counted',
    'censure-road-quarters-false-bottom-found',
    'censure-road-report-sera-bell',
    'censure-road-report-hanne-medical',
    'censure-road-report-joric-route',
    'censure-road-report-malco-containment',
    'censure-road-report-pell-writ',
    'censure-road-report-runa-stock',
    'censure-road-preceptor-route-order-found',
    'censure-road-preceptor-route-correction-read',
    'censure-road-supply-relief-bundle-found',
    'censure-road-supply-false-stock-mark-found',
    'censure-road-medic-safe-packet-found',
    'censure-road-medic-packet-marked-for-malco',
    'censure-road-quarters-coat-cache-found',
    'censure-road-sutler-dropped-tally-found',
    'censure-road-sutler-false-price-mark-found',
    'censure-road-writ-chapel-peal-clause-found'
  ]) {
    assert.equal(journalFlags.has(flag), true, `${flag} has a camp journal finding`);
  }
}

{
  const meleeRoute = caldusDialogue.nodes.start.choices.find((choice) => choice.next === 'baton-line');
  const unarmedRoute = caldusDialogue.nodes.start.choices.find((choice) => choice.next === 'empty-hand-line');
  assert.deepEqual(meleeRoute.conditions.fieldRatings, { melee: 40 });
  assert.deepEqual(unarmedRoute.conditions.fieldRatings, { unarmed: 40 });
  assert.equal(meleeRoute.effects.setFlag, 'censure-road-drill-close-complete');
  assert.equal(unarmedRoute.effects.setFlag, 'censure-road-drill-close-complete');
  assert.equal(meetsDialogueConditions(meleeRoute.conditions, {
    flags: new Set(),
    fieldRating: (id) => (id === 'melee' ? 39 : 0)
  }), false);
  assert.equal(meetsDialogueConditions(meleeRoute.conditions, {
    flags: new Set(),
    fieldRating: (id) => (id === 'melee' ? 40 : 0)
  }), true);

  const commandIssue = runaDialogue.nodes.start.choices.find((choice) => choice.next === 'issue-command');
  const forgedIssue = runaDialogue.nodes.start.choices.find((choice) => choice.next === 'issue-forged');
  assert.deepEqual(commandIssue.conditions.fieldRatings, { command: 50 });
  assert.deepEqual(forgedIssue.conditions.fieldRatings, { guile: 60 });
  assert.deepEqual(commandIssue.effects.setFlag, [
    'censure-road-field-issue-authorized',
    'censure-road-field-issue-commanded'
  ]);
  assert.deepEqual(forgedIssue.effects.setFlag, [
    'censure-road-field-issue-authorized',
    'censure-road-field-issue-forged'
  ]);
  const runaReport = runaDialogue.nodes.writ.choices.find((choice) => choice.next === 'weight-mismatch');
  assert.equal(runaReport.effects.setFlag, 'censure-road-report-runa-stock');

  const seraReport = seraDialogue.nodes.start.choices.find((choice) => choice.next === 'joined-peals');
  assert.deepEqual(seraReport.conditions.flags, [
    'censure-road-bell-peal-found',
    'long-ash-old-bell-peal-rule-read'
  ]);
  assert.deepEqual(seraReport.conditions.fieldRatings, { doctrine: 45 });
  assert.equal(seraReport.effects.setFlag, 'censure-road-report-sera-bell');

  const hanneReport = hanneDialogue.nodes.start.choices.find((choice) => choice.next === 'road-casualties');
  assert.equal(hanneReport.conditions.flag, 'long-ash-kill-site-wounds-read');
  assert.deepEqual(hanneReport.conditions.fieldRatings, { medicine: 45 });
  assert.equal(hanneReport.effects.setFlag, 'censure-road-report-hanne-medical');
  assert.deepEqual(hanneReport.effects.inventory.add, [{ item: 'field-dressing', count: 1 }]);
  const hanneCarterReport = hanneDialogue.nodes.start.choices.find((choice) => choice.next === 'carter-crush');
  assert.equal(hanneCarterReport.conditions.flag, 'long-ash-carter-wheel-crush-read');
  assert.deepEqual(hanneCarterReport.conditions.fieldRatings, { medicine: 45 });
  assert.deepEqual(hanneCarterReport.conditions.flagsAbsent, ['censure-road-report-hanne-medical']);
  assert.equal(hanneCarterReport.effects.setFlag, 'censure-road-report-hanne-medical');
  assert.deepEqual(hanneCarterReport.effects.inventory.add, [{ item: 'field-dressing', count: 1 }]);

  const joricReport = joricDialogue.nodes.start.choices.find((choice) => choice.next === 'cart-sequence');
  assert.equal(joricReport.conditions.flag, 'long-ash-cart-sabotage-proved');
  assert.deepEqual(joricReport.conditions.fieldRatings, { engineering: 45 });
  assert.equal(joricReport.effects.setFlag, 'censure-road-report-joric-route');
  assert.deepEqual(joricReport.effects.inventory.add, [{ item: 'ducat', count: 2 }]);

  const malcoReport = malcoDialogue.nodes.start.choices.find((choice) => choice.next === 'road-class');
  assert.equal(malcoReport.conditions.flag, 'long-ash-kill-site-no-opening-found');
  assert.deepEqual(malcoReport.conditions.fieldRatings, { containment: 50 });
  assert.equal(malcoReport.effects.setFlag, 'censure-road-report-malco-containment');

  const pellReport = pellDialogue.nodes.start.choices.find((choice) => choice.next === 'cut-name');
  assert.equal(pellReport.conditions.flag, 'censure-road-writ-board-erasure-found');
  assert.deepEqual(pellReport.conditions.fieldRatings, { guile: 45 });
  assert.equal(pellReport.effects.setFlag, 'censure-road-report-pell-writ');

  assertOneShotDialogueHandoff(
    vossDialogue.nodes.supplies.choices.find((choice) => choice.next === 'preceptor-order'),
    ['censure-road-preceptor-route-order-found'],
    'censure-road-voss-preceptor-order-reported'
  );
  assertOneShotDialogueHandoff(
    vossDialogue.nodes.supplies.choices.find((choice) => choice.next === 'preceptor-correction'),
    ['censure-road-preceptor-route-correction-read'],
    'censure-road-voss-preceptor-correction-reported'
  );
  assertOneShotDialogueHandoff(
    vossDialogue.nodes.supplies.choices.find((choice) => choice.next === 'odran-chest'),
    ['odran-late-visit-suspected', 'censure-road-odran-chest-linen-found'],
    'censure-road-voss-odran-chest-reported'
  );
  assertOneShotDialogueHandoff(
    runaDialogue.nodes.writ.choices.find((choice) => choice.next === 'relief-bundle'),
    ['censure-road-supply-relief-bundle-found'],
    'censure-road-runa-relief-bundle-reported'
  );
  assertOneShotDialogueHandoff(
    runaDialogue.nodes.writ.choices.find((choice) => choice.next === 'stock-mark'),
    ['censure-road-supply-false-stock-mark-found'],
    'censure-road-runa-stock-mark-reported'
  );
  assertOneShotDialogueHandoff(
    hanneDialogue.nodes.stores.choices.find((choice) => choice.next === 'safe-packet'),
    ['censure-road-medic-safe-packet-found'],
    'censure-road-hanne-safe-packet-reported'
  );
  assertOneShotDialogueHandoff(
    malcoDialogue.nodes.start.choices.find((choice) => choice.next === 'medic-packet'),
    ['censure-road-medic-packet-marked-for-malco'],
    'censure-road-malco-medic-packet-reported'
  );
  assertOneShotDialogueHandoff(
    caldusDialogue.nodes.start.choices.find((choice) => choice.next === 'coat-cache'),
    ['censure-road-quarters-coat-cache-found'],
    'censure-road-caldus-coat-cache-reported'
  );
  assertOneShotDialogueHandoff(
    maevDialogue.nodes['back-room'].choices.find((choice) => choice.next === 'dropped-tally'),
    ['censure-road-sutler-dropped-tally-found'],
    'censure-road-maev-dropped-tally-reported'
  );
  assertOneShotDialogueHandoff(
    maevDialogue.nodes['back-room'].choices.find((choice) => choice.next === 'price-mark'),
    ['censure-road-sutler-false-price-mark-found'],
    'censure-road-maev-price-mark-reported'
  );
  assertOneShotDialogueHandoff(
    seraDialogue.nodes.start.choices.find((choice) => choice.next === 'chapel-clause'),
    ['censure-road-writ-chapel-peal-clause-found'],
    'censure-road-sera-chapel-clause-reported'
  );
}

{
  for (const object of level.objects.filter((entry) => entry.interact)) {
    const approach = reachableInteractionApproach(level, grid, object, level.spawns.player);
    assert.ok(approach, `${object.id ?? object.kind} has a reachable interaction approach`);
  }
}

{
  const privateTent = objectById(level, 'censure-road-odran-private-tent-flap');
  assert.deepEqual(privateTent.interact, {
    type: 'secret-entrance',
    dialogue: 'censure-road-odran-tent-entry'
  }, "Augustine's tent asks for confirmation before entry");
  assert.equal(privateTent.mapMarker?.kind, 'exit');

  const odranInterior = await readJson('../data/levels/censure_road_odran_tent_interior.json');
  const odranGrid = new Grid(odranInterior);
  addBlockingObjects(odranGrid, odranInterior.objects ?? []);
  const chest = objectById(odranInterior, 'odran-tent-travel-chest');
  const evidenceMethod = chest.interact.search.methods[0];
  assert.equal(evidenceMethod.field, 'search');
  assert.equal(evidenceMethod.dc, 45);
  assert.equal(searchMethodStatus(evidenceMethod, {
    inventory: { has: () => true },
    fieldRating: () => 44
  }).success, false);
  assert.equal(searchMethodStatus(evidenceMethod, {
    inventory: { has: () => true },
    fieldRating: () => 45
  }).success, true);
  assert.deepEqual(evidenceMethod.success.setFlag, [
    'odran-late-visit-suspected',
    'censure-road-odran-chest-linen-found'
  ]);
}

{
  const occupiedCampCells = new Map(
    (level.spawns.npcs ?? []).map((npc) => [`${npc.x},${npc.y}`, npc.actor])
  );
  for (const spec of tentSpecs) {
    const flap = objectById(level, spec.objectId);
    assert.equal(flap.kind, 'canvas-tent-flap', `${spec.objectId} uses the tent flap art`);
    assert.deepEqual(flap.interact, {
      type: 'secret-entrance',
      dialogue: spec.entryDialogueId
    }, `${spec.objectId} opens a deliberate entry dialogue`);
    assert.equal(flap.blocking, undefined, `${spec.objectId} does not add prop collision`);
    assert.deepEqual(flap.clickAreas, spec.clickAreas, `${spec.objectId} owns its tent click footprint`);
    assert.deepEqual(flap.interactionMarker, spec.approach, `${spec.objectId} marks its reachable tent mouth`);
    assert.equal(pointInAreas(flap, flap.clickAreas), true, `${spec.objectId} click footprint covers the visible flap`);
    assert.equal(level.dialogue.includes(spec.entryDialogueId), true, `${spec.objectId} registers its entry dialogue`);
    assert.equal(grid.isWalkable(flap.x, flap.y), false, `${spec.objectId} visible flap tile remains tent body`);
    assert.equal(grid.isWalkable(spec.approach.x, spec.approach.y), true, `${spec.objectId} interaction approach is walkable`);
    assert.equal(occupiedCampCells.has(`${spec.approach.x},${spec.approach.y}`), false, `${spec.objectId} interaction approach is not occupied by an NPC`);
    assert.equal(pathExists(grid, level.spawns.player, spec.approach), true, `${spec.objectId} interaction approach is reachable from camp spawn`);
    assert.deepEqual(
      (level.levelTransitions ?? []).filter((transition) => transition.loadLevel?.path === spec.interiorPath),
      [],
      `${spec.objectId} cannot bypass confirmation by walking onto the tent mouth`
    );

    const flapTarget = interactionTarget(level, grid, flap, level.spawns.player, flap);
    assert.equal(flapTarget?.type, 'object', `${spec.objectId} visible flap resolves as an object`);
    assert.equal(flapTarget?.object?.id, spec.objectId, `${spec.objectId} visible flap targets the matching entrance`);
    for (const area of spec.clickAreas) {
      const clickCell = {
        x: Math.floor((area.x0 + area.x1) / 2),
        y: Math.floor((area.y0 + area.y1) / 2)
      };
      const footprintTarget = interactionTarget(level, grid, flap, level.spawns.player, clickCell);
      assert.equal(footprintTarget?.type, 'object', `${spec.objectId} tent footprint resolves as an object`);
      assert.equal(footprintTarget?.object?.id, spec.objectId, `${spec.objectId} tent footprint targets the matching entrance`);
    }

    const entryDialogue = await readJson(spec.entryDialogueFile);
    assertDeliberateTravelDialogue(entryDialogue, spec.entryDialogueId, spec.interiorPath, spec.interiorPlayer);

    const interior = await readJson(spec.interiorFile);
    const interiorGrid = new Grid(interior);
    addBlockingObjects(interiorGrid, interior.objects ?? []);
    assert.equal(interior.legend['#'].kind, 'canvas-tent-interior-wall', `${interior.id} uses canvas interior walls`);
    assert.equal(interior.legend['.'].floor, 'worn-canvas', `${interior.id} uses visible worn-canvas floor tiles`);
    assert.ok(interior.mood.floorShadeAlpha <= 0.14, `${interior.id} floor shade leaves the canvas floor readable`);
    assert.ok(interior.mood.ambientAlpha <= 0.08, `${interior.id} ambient wash leaves the canvas floor readable`);
    assert.deepEqual(interior.spawns.player, { actor: 'mara-vey', ...spec.interiorPlayer }, `${interior.id} authored spawn matches the exterior entry`);
    assert.equal(interiorGrid.isWalkable(interior.spawns.player.x, interior.spawns.player.y), true, `${interior.id} player start is walkable`);
    for (const object of interior.objects.filter((entry) => entry.interact)) {
      const approach = reachableInteractionApproach(interior, interiorGrid, object, interior.spawns.player);
      assert.ok(approach, `${interior.id} ${object.id ?? object.kind} has a reachable interaction approach`);
    }
    const exitFlap = interior.objects.find((object) => object.kind === 'canvas-tent-flap');
    assert.ok(exitFlap, `${interior.id} keeps visible tent flap art`);
    assert.deepEqual({ x: exitFlap.x, y: exitFlap.y }, spec.interiorFlap, `${interior.id} wall flap sits on the authored wall cell`);
    assert.deepEqual(exitFlap.interact, {
      type: 'secret-exit',
      dialogue: spec.exitDialogueId
    }, `${interior.id} opens a deliberate exit dialogue`);
    assert.equal(exitFlap.blocking, undefined, `${interior.id} exit flap does not block movement`);
    assert.deepEqual(exitFlap.clickAreas, [{
      x0: spec.interiorFlap.x,
      y0: spec.interiorFlap.y,
      x1: spec.interiorFlap.x,
      y1: spec.interiorFlap.y
    }], `${interior.id} makes the visible flap clickable as an exit`);
    assert.deepEqual(exitFlap.interactionMarker, spec.interiorExit, `${interior.id} marks its reachable exit approach`);
    assert.equal(pointInAreas(exitFlap, exitFlap.clickAreas), true, `${interior.id} visible flap is clickable as an exit`);
    assert.equal(interior.dialogue.includes(spec.exitDialogueId), true, `${interior.id} registers its exit dialogue`);
    assert.equal(interiorGrid.isWalkable(spec.interiorExit.x, spec.interiorExit.y), true, `${interior.id} former walk-out tile remains walkable`);
    assert.equal(interiorGrid.isWalkable(exitFlap.x, exitFlap.y), false, `${interior.id} exit flap is mounted on a wall tile, not floating on the floor`);
    assert.equal(pathExists(interiorGrid, interior.spawns.player, spec.interiorExit), true, `${interior.id} exit approach is reachable from spawn`);
    assert.deepEqual(
      (interior.levelTransitions ?? []).filter((transition) =>
        transition.loadLevel?.path === './data/levels/censure_road_camp.json'
      ),
      [],
      `${interior.id} cannot bypass confirmation by walking onto the exit approach`
    );

    const exitTarget = interactionTarget(interior, interiorGrid, exitFlap, interior.spawns.player, exitFlap);
    assert.equal(exitTarget?.type, 'object', `${interior.id} visible flap resolves as an object`);
    assert.equal(exitTarget?.object?.id, exitFlap.id, `${interior.id} visible flap targets the matching exit`);

    const exitDialogue = await readJson(spec.exitDialogueFile);
    assertDeliberateTravelDialogue(
      exitDialogue,
      spec.exitDialogueId,
      './data/levels/censure_road_camp.json',
      spec.returnPlayer
    );
    assert.equal(grid.isWalkable(spec.returnPlayer.x, spec.returnPlayer.y), true, `${interior.id} return point is walkable`);
  }
}

{
  const interiorSkillSpecs = [
    {
      file: '../data/levels/censure_road_preceptor_tent.json',
      objectId: 'preceptor-tent-file-crate',
      methods: [
        ['find-corrected-route-order', 'search', 55],
        ['explain-route-correction', 'doctrine', 55]
      ]
    },
    {
      file: '../data/levels/censure_road_supply_tent.json',
      objectId: 'supply-tent-food-crate',
      methods: [['find-misplaced-relief-bundle', 'search', 45]]
    },
    {
      file: '../data/levels/censure_road_supply_tent.json',
      objectId: 'supply-tent-ammo-crate',
      methods: [['identify-false-stock-mark', 'guile', 55]]
    },
    {
      file: '../data/levels/censure_road_medic_tent.json',
      objectId: 'medic-tent-supply-crate',
      methods: [
        ['recover-safe-dressing', 'medicine', 45],
        ['mark-packet-for-malco', 'hostSigns', 60]
      ]
    },
    {
      file: '../data/levels/censure_road_quarters_tent.json',
      objectId: 'quarters-tent-coat-barrel',
      methods: [['follow-false-bottom-clue', 'search', 45]]
    },
    {
      file: '../data/levels/censure_road_sutler_tent.json',
      objectId: 'sutler-tent-satchel',
      methods: [['find-dropped-sutler-tally', 'search', 40]]
    },
    {
      file: '../data/levels/censure_road_sutler_tent.json',
      objectId: 'sutler-tent-bargain-crate',
      methods: [['catch-altered-price-mark', 'guile', 55]]
    },
    {
      file: '../data/levels/censure_road_writ_chapel_tent.json',
      objectId: 'writ-chapel-lectern',
      methods: [['reconstruct-missing-peal-clause', 'doctrine', 45]]
    }
  ];

  for (const spec of interiorSkillSpecs) {
    const interior = await readJson(spec.file);
    const object = objectById(interior, spec.objectId);
    assert.ok(object.interact?.search, `${interior.id} ${spec.objectId} is no longer inert`);
    for (const [methodId, field, dc] of spec.methods) {
      const method = searchMethodById(object, methodId);
      assert.equal(method.field, field);
      assert.equal(method.dc, dc);
      assertSearchBoundary(method, field, dc);
    }
    assert.ok((interior.journalNotes ?? []).length > 0, `${interior.id} records its successful findings`);
  }

  const preceptor = await readJson('../data/levels/censure_road_preceptor_tent.json');
  const doctrineMethod = searchMethodById(
    objectById(preceptor, 'preceptor-tent-file-crate'),
    'explain-route-correction'
  );
  assert.equal(meetsDialogueConditions(doctrineMethod.conditions, { flags: new Set() }), false);
  assert.equal(meetsDialogueConditions(doctrineMethod.conditions, {
    flags: new Set(['censure-road-preceptor-route-order-found'])
  }), true, 'the doctrinal reading follows the physical file discovery');

  const quartermaster = await readJson('../data/levels/censure_road_quartermaster_tent.json');
  const interiorIssue = objectById(quartermaster, 'quartermaster-tent-sealed-crate');
  assert.deepEqual(interiorIssue.interact.loot, [
    { item: 'tinned-beans', count: 1 },
    { item: 'field-dressing', count: 1 },
    { item: 'relic-rounds', count: 1 },
    { item: 'ducat', count: 3 },
    { item: 'parish-ward-pistol', count: 1 }
  ]);
  const interiorClaim = lockMethodById(interiorIssue, 'claim-authorized-field-issue');
  assert.deepEqual(interiorClaim.conditions, {
    flag: 'censure-road-field-issue-authorized',
    flagsAbsent: ['censure-road-field-issue-claimed']
  });

  const supply = await readJson('../data/levels/censure_road_supply_tent.json');
  const relief = searchMethodById(objectById(supply, 'supply-tent-food-crate'), 'find-misplaced-relief-bundle');
  assert.deepEqual(relief.success.inventory.add, [
    { item: 'tinned-beans', count: 1 },
    { item: 'field-dressing', count: 1 }
  ]);

  const medic = await readJson('../data/levels/censure_road_medic_tent.json');
  const safePacket = searchMethodById(objectById(medic, 'medic-tent-supply-crate'), 'recover-safe-dressing');
  assert.deepEqual(safePacket.success.inventory.add, [{ item: 'field-dressing', count: 1 }]);

  const quarters = await readJson('../data/levels/censure_road_quarters_tent.json');
  const coatCache = searchMethodById(objectById(quarters, 'quarters-tent-coat-barrel'), 'follow-false-bottom-clue');
  assert.equal(coatCache.conditions.flag, 'censure-road-quarters-false-bottom-found');
  assert.deepEqual(coatCache.success.inventory.add, [{ item: 'ducat', count: 1 }]);
}

{
  const southExit = objectById(level, 'censure-road-long-ash-gate');
  assert.equal(southExit.interact?.type, 'secret-exit');
  assert.equal(southExit.interact?.dialogue, 'censure-road-camp-long-ash-road-exit');
  const target = interactionTarget(level, grid, southExit, { x: 34, y: 47 });
  assert.equal(target.type, 'object', 'south road exit resolves as an object target');
  assert.equal(target.object.id, southExit.id);
  assert.equal(isTargetInReach({ position: { x: 34, y: 47 } }, target), true, 'south road exit is reachable from the gate');
  const returnChoice = campToLongAsh.nodes.start.choices.find((choice) =>
    choice.effects?.loadLevel?.path === './data/levels/long_ash_road_approach.json'
  );
  assert.ok(returnChoice, 'camp return dialogue loads Long Ash Road');
  assert.deepEqual(returnChoice.effects.loadLevel.player, { x: 116, y: 4 });
}

{
  const eastGate = objectById(level, 'censure-road-hallowfen-gate-16');
  assert.equal(eastGate.interact?.type, 'note');
  assert.equal(eastGate.interact?.dialogue, 'censure-road-camp-hallowfen-gate');
  const target = interactionTarget(level, grid, eastGate, { x: 66, y: 16 });
  assert.equal(target.type, 'object', 'Hallowfen gate resolves as an object target');
  assert.equal(target.object.id, eastGate.id);
  assert.equal(isTargetInReach({ position: { x: 66, y: 16 } }, target), true, 'Hallowfen gate is inspectable from the road');
  const southMeasureChoice = hallowfenGate.nodes.start.choices.find((choice) =>
    choice.effects?.loadLevel?.path === './data/levels/ash_road_south.json'
  );
  assert.ok(southMeasureChoice, 'Hallowfen checkpoint exit can load Ash Road South');
  assert.equal(southMeasureChoice.conditions?.flag, 'censure-road-voss-route-cleared');
  assert.equal(meetsDialogueConditions(southMeasureChoice.conditions, { flags: new Set() }), false);
  assert.equal(meetsDialogueConditions(southMeasureChoice.conditions, {
    flags: new Set(['censure-road-voss-route-cleared'])
  }), true);
  assert.deepEqual(southMeasureChoice.effects.loadLevel.player, { x: 65, y: 77, facing: 'ne' });
}

{
  assert.deepEqual(maevActor.trade.stock.map((entry) => entry.item), [
    'field-dressing',
    'tinned-beans',
    'relic-rounds',
    'censure-entry-roll',
    'camp-issue-ribguard',
    'ash-road-boots',
    'ash-road-carbine',
    'cinder-watch-submachine-gun',
    'pilgrim-break-shotgun',
    'iron-vow-revolver',
    'censer-sabre',
    'pilgrim-mace',
    'penitent-coil-sidearm',
    'vesper-armature-pistol',
    'compact-cartridge-ammo',
    'heavy-sidearm-cartridge-ammo',
    'intermediate-cartridge-ammo',
    'shot-shell-ammo',
    'compact-armature-ammo'
  ]);
  assert.equal(campRibguard.equipment.slot, 'armor');
  assert.equal(campRibguard.groundModel, 'ribguard');
  const tradeChoice = maevDialogue.nodes.start.choices.find((choice) => choice.effects?.trade);
  assert.ok(tradeChoice, 'Judith dialogue has a trade choice');
  assert.equal(tradeChoice.effects.trade, 'censure-sutler-maev');
}

{
  const evidenceState = (counts = {}, flags = []) => ({
    flags: new Set(flags),
    itemCount: (itemId) => counts[itemId] ?? 0
  });
  assert.equal(meetsDialogueConditions(vossDialogue.nodes.start.conditions, evidenceState({
    'choir-tally-strip': 1
  })), true, 'Aquila notices the Ash Chapel tally strip');
  assert.equal(meetsDialogueConditions(vossDialogue.nodes.start.conditions, evidenceState({
    'choir-tally-strip': 1
  }, ['ash-chapel-evidence-delivered'])), false, 'Aquila cannot award the evidence handoff twice');
  assert.equal(meetsDialogueConditions(vossDialogue.nodes['ash-chapel-evidence-hymnal-check'].conditions, evidenceState({
    'choir-hymnal-fragment': 1
  })), true, 'Aquila also notices hymnal evidence without the tally strip');

  const allEvidenceChoice = vossDialogue.nodes.start.choices.find((choice) => choice.next === 'ash-chapel-evidence-received');
  assert.ok(allEvidenceChoice, 'Aquila accepts all carried Ash Chapel evidence');
  assert.deepEqual(allEvidenceChoice.effects.inventory.remove, [
    { item: 'choir-tally-strip', count: 1 },
    { item: 'choir-hymnal-fragment', count: 3 }
  ]);
  assert.equal(allEvidenceChoice.effects.setFlag, 'ash-chapel-evidence-delivered');
  assert.equal(allEvidenceChoice.effects.xp, 25);

  const evidenceGame = {
    flags: new Set(),
    inventory: new Inventory({
      [choirHymnalFragment.id]: choirHymnalFragment,
      [choirTallyStrip.id]: choirTallyStrip
    })
  };
  evidenceGame.inventory.add('choir-hymnal-fragment', 3);
  evidenceGame.inventory.add('choir-tally-strip', 1);
  let evidenceXp = 0;
  const evidenceEffects = new DialogueEffects(evidenceGame, {
    awardPlayerExperience: (amount) => { evidenceXp += amount; },
    syncFlagConditionalObjects() {},
    syncInventoryOrder() {},
    clampInventorySelection() {}
  });
  evidenceEffects.apply(allEvidenceChoice.effects);
  assert.equal(evidenceGame.inventory.count('choir-hymnal-fragment'), 0, 'Aquila takes every carried hymnal fragment');
  assert.equal(evidenceGame.inventory.count('choir-tally-strip'), 0, 'Aquila takes the tally strip');
  assert.equal(evidenceGame.flags.has('ash-chapel-evidence-delivered'), true);
  assert.equal(evidenceXp, 25, 'Aquila grants one field-credit XP award');

  const hymnalChoice = vossDialogue.nodes['ash-chapel-evidence-hymnal-check'].choices.find((choice) =>
    choice.next === 'ash-chapel-evidence-received'
  );
  assert.deepEqual(hymnalChoice.effects.inventory.remove, [
    { item: 'choir-hymnal-fragment', count: 3 }
  ]);

  const clearanceChoice = vossDialogue.nodes.main.choices.find((choice) => choice.next === 'route-clearance');
  assert.ok(clearanceChoice, 'Aquila opens the Hallowfen route-clearance paths');
  const reportChoice = vossDialogue.nodes['route-clearance'].choices.find((choice) => choice.next === 'report-briefing');
  assert.ok(reportChoice, 'route clearance retains the patient Form C-17 path');

  const reportNodes = Object.keys(vossDialogue.nodes)
    .filter((nodeId) => /^report-q\d\d$/.test(nodeId))
    .sort();
  assert.equal(reportNodes.length, 30, 'Aquila report has thirty questions');

  for (const nodeId of reportNodes) {
    const choices = vossDialogue.nodes[nodeId].choices;
    assert.equal(choices.length, 4, `${nodeId} has three answers plus the circle-one shortcut`);
    const shortcut = choices[3];
    assert.equal(shortcut.label, 'Circle answer 1 on every remaining line');
    assert.equal(shortcut.effects.setFlag, 'censure-road-voss-report-circled');
    assert.equal(shortcut.next, 'report-circled');
  }

  assert.equal(vossDialogue.nodes['report-q01'].choices[0].next, 'report-q02');
  assert.deepEqual(vossDialogue.nodes['report-q30'].choices[0].effects.setFlag, [
    'censure-road-voss-route-cleared',
    'censure-road-voss-report-perfect'
  ]);

  const rewardChoice = maevDialogue.nodes.start.choices.find((choice) => choice.next === 'voss-report-reward');
  assert.ok(rewardChoice, 'Judith can pay out Aquila report gear');
  assert.equal(meetsDialogueConditions(rewardChoice.conditions, {
    flags: new Set(['censure-road-voss-report-perfect'])
  }), true);
  assert.equal(meetsDialogueConditions(rewardChoice.conditions, {
    flags: new Set(['censure-road-voss-report-perfect', 'censure-road-voss-report-rewarded'])
  }), false);
  assert.deepEqual(maevDialogue.nodes['voss-report-reward'].choices[0].effects.inventory.add, [
    { item: 'camp-issue-ribguard', count: 1 },
    { item: 'field-dressing', count: 1 },
    { item: 'relic-rounds', count: 2 }
  ]);
}

{
  const rumorChoice = pellDialogue.nodes.start.choices.find((choice) => choice.next === 'last-bell');
  assert.ok(rumorChoice, 'Philip can seed the optional Augustine rumor');
  assert.equal(rumorChoice.effects.setFlag, 'odran-late-visit-suspected');
  assert.equal(meetsDialogueConditions(rumorChoice.conditions, { flags: new Set() }), true);
  assert.equal(meetsDialogueConditions(rumorChoice.conditions, {
    flags: new Set(['odran-late-visit-suspected'])
  }), false);

  const watchChoice = odranWatch.nodes.start.choices.find((choice) => choice.effects?.showBriefing);
  assert.ok(watchChoice, 'confession screen can start the late watch');
  assert.equal(watchChoice.effects.setFlag, 'odran-late-visit-seen');
  assert.deepEqual(watchChoice.effects.clock, { advanceToMinuteOfDay: 1380 });
  assert.deepEqual(watchChoice.effects.showBriefing.afterBriefing.clock, {
    nextDay: true,
    minuteOfDay: 480
  });
  assert.equal(meetsDialogueConditions(watchChoice.conditions, {
    flags: new Set(['odran-late-visit-suspected'])
  }), true);
  assert.equal(meetsDialogueConditions(watchChoice.conditions, {
    flags: new Set(['odran-late-visit-suspected', 'odran-late-visit-seen'])
  }), false);

  const brunaOdranChoice = brunaDialogue.nodes.start.choices.find((choice) => choice.next === 'odran');
  assert.ok(brunaOdranChoice, 'Naomi has a post-observation Augustine branch');
  assert.equal(meetsDialogueConditions(brunaOdranChoice.conditions, {
    flags: new Set(['odran-late-visit-seen'])
  }), true);
  assert.equal(meetsDialogueConditions(brunaOdranChoice.conditions, {
    flags: new Set(['odran-late-visit-seen', 'odran-late-visit-resolved'])
  }), false);
  assert.equal(brunaDialogue.nodes.odran.choices[0].effects.setFlag, 'odran-widow-heard');
}

{
  assert.equal(confessionQuest.initialStage, 'seek-confession');
  assert.equal(confessionQuest.stages.some((stage) => stage.id === 'absolved-with-ducats' && stage.xp === 15), true);
  assert.equal(confessionQuest.stages.some((stage) => stage.id === 'absolved-after-lying' && stage.xp === 10), true);
  assert.equal(absolutionChit.equipment.slot, 'trinket');
  assert.equal(absolutionChit.groundModel, 'chit');

  assert.equal(odranDialogue.nodes.start.conditions.flag, 'censure-road-confession-absolved');
  assert.equal(odranDialogue.nodes.start.else, 'start-open');
  assert.equal(odranDialogue.nodes['chapel-cult-broken'].conditions.flag, 'ash-chapel-cult-broken');
  assert.equal(odranDialogue.nodes['chapel-martyr-ended'].conditions.flag, 'nave-cross-martyr-ended');
  assert.equal(odranDialogue.nodes['road-family-lie'].conditions.flag, 'long-ash-field-family-lie');
  assert.equal(odranDialogue.nodes['road-family-truth'].conditions.flag, 'long-ash-field-family-truth');
  assert.equal(odranDialogue.nodes['road-wolves-evidence'].conditions.flag, 'long-ash-wolves-avenged-family');
  const confrontationChoice = odranDialogue.nodes.start.choices.find((choice) => choice.next === 'late-visit-confront-widow');
  assert.ok(confrontationChoice, 'Augustine can be confronted after the late visit is observed');
  assert.equal(meetsDialogueConditions(confrontationChoice.conditions, {
    flags: new Set(['odran-late-visit-seen'])
  }), true);
  assert.equal(meetsDialogueConditions(confrontationChoice.conditions, {
    flags: new Set(['odran-late-visit-seen', 'odran-late-visit-resolved'])
  }), false);

  const settleChoice = odranDialogue.nodes['record-summary'].choices.find((choice) => choice.next === 'price');
  assert.ok(settleChoice, 'Augustine confession reaches the payment screen');
  assert.deepEqual(settleChoice.effects.questUpdate, {
    quest: 'censure-road-confession',
    stage: 'record-read'
  });

  const payChoice = odranDialogue.nodes.price.choices.find((choice) => choice.label === 'Pay 5 ducats');
  assert.ok(payChoice, 'Augustine has a normal five ducat payment option');
  assert.equal(meetsDialogueConditions(payChoice.conditions, { itemCount: (id) => (id === 'ducat' ? 5 : 0) }), true);
  assert.equal(meetsDialogueConditions(payChoice.conditions, { itemCount: (id) => (id === 'ducat' ? 4 : 0) }), false);
  assert.equal(payChoice.effects.inventory.requireAll, true);
  assert.deepEqual(payChoice.effects.inventory.remove, [
    { item: 'ducat', count: 5, failLog: 'Father Augustine waits for the fifth ducat that is not there.' }
  ]);
  assert.deepEqual(payChoice.effects.inventory.add, [
    { item: 'censure-absolution-chit', count: 1 }
  ]);
  assert.deepEqual(payChoice.effects.setFlag, ['censure-road-confession-absolved', 'odran-confession-paid-5']);
  assert.deepEqual(payChoice.effects.questUpdate, {
    quest: 'censure-road-confession',
    stage: 'absolved-with-ducats'
  });

  const noCoinPrayer = odranDialogue.nodes['price-low'].choices.find((choice) => choice.label === 'Pray five times');
  assert.ok(noCoinPrayer, 'Augustine has a no-money prayer route');
  assert.equal(meetsDialogueConditions(noCoinPrayer.conditions, { itemCount: (id) => (id === 'ducat' ? 0 : 0) }), true);
  assert.equal(meetsDialogueConditions(noCoinPrayer.conditions, { itemCount: (id) => (id === 'ducat' ? 1 : 0) }), false);

  const lieChoice = odranDialogue.nodes.price.choices.find((choice) => choice.label === 'Lie that your purse is empty');
  assert.ok(lieChoice, 'Augustine has a lying route');
  assert.equal(lieChoice.next, 'lie-caught-rich');
  assert.equal(meetsDialogueConditions(lieChoice.conditions, { itemCount: (id) => (id === 'ducat' ? 1 : 0) }), true);
  assert.equal(meetsDialogueConditions(lieChoice.conditions, { itemCount: (id) => (id === 'ducat' ? 0 : 0) }), false);

  const lieTax = odranDialogue.nodes['lie-caught-rich'].choices.find((choice) => choice.label === 'Pay 6 ducats');
  assert.ok(lieTax, 'Augustine charges a six ducat lie tax when the player can pay it');
  assert.deepEqual(lieTax.effects.questUpdate, {
    quest: 'censure-road-confession',
    stage: 'absolved-after-lying'
  });
  assert.deepEqual(lieTax.effects.setFlag, ['censure-road-confession-absolved', 'odran-confession-paid-6']);

  assert.equal(odranDialogue.nodes['late-visit-refund-6'].else, 'late-visit-refund-5');
  assert.equal(odranDialogue.nodes['late-visit-refund-5'].choices[0].effects.inventory.add[0].count, 5);
  assert.equal(odranDialogue.nodes['late-visit-refund-1'].choices[0].effects.inventory.add[0].count, 1);
  assert.equal(odranDialogue.nodes['late-visit-refund-none'].choices[0].next, 'late-visit-blackmail');
  const blackmail = odranDialogue.nodes['late-visit-blackmail'].choices.find((choice) => choice.label === 'Take 8 ducats');
  assert.ok(blackmail, 'Augustine blackmail route pays silence money');
  assert.deepEqual(blackmail.effects.setFlag, ['odran-late-visit-resolved', 'odran-silence-money-taken']);
  assert.deepEqual(blackmail.effects.inventory.add, [{ item: 'ducat', count: 8 }]);
  const askBruna = odranDialogue.nodes['late-visit-confront'].choices.find((choice) => choice.label === 'Ask Naomi first');
  assert.ok(askBruna, 'Augustine confrontation can defer to Naomi');
  assert.equal(askBruna.effects.setFlag, 'odran-ask-widow-first');
}

{
  const sign = objectById(longAsh, 'long-ash-censure-camp-sign');
  assert.equal(sign.interact?.type, 'secret-entrance');
  assert.equal(sign.interact?.dialogue, 'long-ash-censure-road-camp-exit');
  assert.equal(sign.mapMarker?.kind, 'exit');
  assert.equal(pathExists(longAshGrid, longAsh.spawns.player, { x: 116, y: 4 }), true, 'Long Ash start reaches the camp approach');
  const target = interactionTarget(longAsh, longAshGrid, sign, { x: 116, y: 4 });
  assert.equal(target.type, 'object', 'Long Ash camp sign resolves as an object target');
  assert.equal(target.object.id, sign.id);
  assert.equal(isTargetInReach({ position: { x: 116, y: 4 } }, target), true, 'camp sign is reachable from the north road');
  const enterChoice = longAshToCamp.nodes.start.choices.find((choice) =>
    choice.effects?.loadLevel?.path === './data/levels/censure_road_camp.json'
  );
  assert.ok(enterChoice, 'Long Ash camp dialogue loads Censure Road Camp');
  assert.deepEqual(enterChoice.effects.loadLevel.player, { x: 34, y: 46 });
}
