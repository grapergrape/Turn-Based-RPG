import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import {
  ASH_ROAD_SOUTH_CAST,
  ASH_ROAD_SOUTH_DISTRICTS,
  ASH_ROAD_SOUTH_HELPER_ANCHORS
} from '../scripts/content/ash-road-south-cast.mjs';
import { ASH_ROAD_SOUTH_NPC_ROUTINES } from '../scripts/content/ash-road-south-routines.mjs';
import { Grid } from '../src/world/Grid.js';

async function readJson(relativePath) {
  return JSON.parse(await readFile(new URL(relativePath, import.meta.url), 'utf8'));
}

function key(x, y) {
  return `${x},${y}`;
}

function pathExists(grid, start, target) {
  if (!grid.isWalkable(start.x, start.y) || !grid.isWalkable(target.x, target.y)) return false;
  const queue = [start];
  const seen = new Set([key(start.x, start.y)]);
  for (let index = 0; index < queue.length; index += 1) {
    const cell = queue[index];
    if (cell.x === target.x && cell.y === target.y) return true;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const next = { x: cell.x + dx, y: cell.y + dy };
      const nextKey = key(next.x, next.y);
      if (seen.has(nextKey) || !grid.isWalkable(next.x, next.y)) continue;
      seen.add(nextKey);
      queue.push(next);
    }
  }
  return false;
}

function allEffects(dialogue) {
  const effects = [];
  for (const node of Object.values(dialogue.nodes ?? {})) {
    if (node.effects) effects.push(node.effects);
    for (const choice of node.choices ?? []) {
      if (choice.effects) effects.push(choice.effects);
    }
  }
  return effects;
}

const level = await readJson('../data/levels/ash_road_south.json');
const quest = await readJson('../data/quests/names-for-the-gate.json');
const spawns = level.spawns.npcs;
const actorIds = spawns.map((spawn) => spawn.actor);

assert.equal(ASH_ROAD_SOUTH_CAST.length, 81);
assert.equal(spawns.length, 81);
assert.equal(new Set(actorIds).size, 81, 'every resident has one stable actor id');
assert.equal(new Set(ASH_ROAD_SOUTH_CAST.map((person) => person.name)).size, 81, 'all residents have unique names');
assert.equal(spawns.filter((spawn) => spawn.dialogue).length, 31);
assert.equal(spawns.filter((spawn) => !spawn.dialogue).length, 50);
assert.equal(spawns.filter((spawn) => spawn.patrol).length, 24);
assert.equal(spawns.filter((spawn) => spawn.mapMarker).length, 9);
assert.equal(Object.keys(ASH_ROAD_SOUTH_NPC_ROUTINES).length, 15);

const objectCells = new Set(level.objects.map((object) => key(object.x, object.y)));
const objectsById = new Map(level.objects.filter((object) => object.id).map((object) => [object.id, object]));
const spawnCells = new Set();
for (const [index, spawn] of spawns.entries()) {
  const person = ASH_ROAD_SOUTH_CAST[index];
  assert.equal(spawn.actor, person.id, `${person.name} keeps census order in the generated level`);
  assert.equal(spawnCells.has(key(spawn.x, spawn.y)), false, `${person.name} has a unique spawn cell`);
  spawnCells.add(key(spawn.x, spawn.y));
  assert.equal(objectCells.has(key(spawn.x, spawn.y)), false, `${person.name} does not overlap a surface object`);
  assert.equal(level.legend[level.tiles[spawn.y][spawn.x]].walkable, true, `${person.name} starts on walkable terrain`);
  assert.equal(spawn.ambient.length, 3, `${person.name} has routine, pressure, and personal barks`);
  assert.equal(spawn.ambient.every((line) => typeof line === 'string' && line.trim().length > 0), true);

  const bounds = ASH_ROAD_SOUTH_DISTRICTS[person.district];
  assert.ok(spawn.x >= bounds.x0 && spawn.x <= bounds.x1, `${person.name} remains in ${person.district}`);
  assert.ok(spawn.y >= bounds.y0 && spawn.y <= bounds.y1, `${person.name} remains in ${person.district}`);

  for (const anchor of ASH_ROAD_SOUTH_HELPER_ANCHORS) {
    assert.ok(
      Math.abs(spawn.x - anchor.x) + Math.abs(spawn.y - anchor.y) > 1,
      `${person.name} leaves the future helper anchor at ${anchor.x},${anchor.y} clear`
    );
  }

  if (!spawn.patrol) continue;
  assert.equal(spawn.patrol.mode, 'loop');
  const routine = ASH_ROAD_SOUTH_NPC_ROUTINES[person.id];
  assert.deepEqual(spawn.patrol.delay, routine ? { min: 2.4, max: 4.8 } : { min: 4, max: 9 });
  assert.ok(spawn.patrol.path.length >= 2, `${person.name} has a useful patrol loop`);
  const activityPoints = spawn.patrol.path.filter((point) => point.activity);
  if (routine) {
    assert.deepEqual(
      activityPoints.map((point) => point.activity),
      routine,
      `${person.name} keeps the authored object-linked routine`
    );
  } else {
    assert.equal(activityPoints.length, 0, `${person.name} keeps the district fallback patrol`);
  }
  for (const point of spawn.patrol.path) {
    assert.ok(point.x >= bounds.x0 && point.x <= bounds.x1, `${person.name} patrol x remains in district`);
    assert.ok(point.y >= bounds.y0 && point.y <= bounds.y1, `${person.name} patrol y remains in district`);
    assert.equal(level.legend[level.tiles[point.y][point.x]].walkable, true, `${person.name} patrol uses walkable terrain`);
    assert.equal(objectCells.has(key(point.x, point.y)), false, `${person.name} patrol avoids objects`);
    if (point.activity) {
      const target = objectsById.get(point.activity.target);
      assert.ok(target, `${person.name} activity target exists`);
      assert.equal(
        Math.max(Math.abs(point.x - target.x), Math.abs(point.y - target.y)),
        1,
        `${person.name} works from an adjacent tile`
      );
      assert.ok(point.activity.duration >= 0.8 && point.activity.duration <= 12);
    }
    for (const anchor of ASH_ROAD_SOUTH_HELPER_ANCHORS) {
      assert.ok(
        Math.abs(point.x - anchor.x) + Math.abs(point.y - anchor.y) > 1,
        `${person.name} patrol leaves helper anchor ${anchor.x},${anchor.y} clear`
      );
    }
  }
}

assert.equal(spawnCells.has(key(level.spawns.player.x, level.spawns.player.y)), false, 'no resident overlaps the player');

const actors = new Map();
for (const person of ASH_ROAD_SOUTH_CAST) {
  const actor = await readJson(`../data/actors/${person.id}.json`);
  actors.set(person.id, actor);
  assert.equal(actor.id, person.id);
  assert.equal(actor.name, person.name);
  assert.equal(actor.role, person.role);
  assert.equal(actor.type, 'npc');
  assert.equal(actor.tags.includes(person.talk ? 'talkable' : 'ambient-only'), true);
}

const ordinaryActors = [...actors.values()].filter((actor) => actor.id !== 'brother-tarn');
assert.equal(ordinaryActors.length, 80);
assert.equal(ordinaryActors.every((actor) => actor.appearance), true, 'ordinary residents use composite human appearances');
assert.equal(new Set(ordinaryActors.map((actor) => JSON.stringify(actor.appearance))).size, 24, 'the cast reuses 24 readable human composites');
assert.equal(actors.get('brother-tarn').appearance, undefined, 'Cassian uses his fixed atlas actor');

const expectedMarkerLabels = [
  'Aurelia Priscian', 'Brother Cassian', 'Cyrus Longinus', 'Darius Secundus', 'Joanna Medicus',
  'Noa Faber', 'Perpetua Felix', 'Susanna Fontana', 'Thecla Galenus'
];
assert.deepEqual(
  spawns.filter((spawn) => spawn.mapMarker).map((spawn) => spawn.mapMarker.label).sort(),
  expectedMarkerLabels
);

const expectedTrade = {
  'ash-road-south-kerr-sorn': [
    ['tinned-beans', 6, 2], ['relic-rounds', 5, 3], ['field-dressing', 2, 5],
    ['censure-entry-roll', 1, 8], ['camp-issue-ribguard', 1, 11], ['ash-road-boots', 1, 7],
    ['remnant-service-rifle', 1, 34], ['chapel-breaching-axe', 1, 14], ['trench-shovel', 1, 8],
    ['penitent-engine-carbine', 1, 65], ['confessor-rail-rifle', 1, 95], ['bastion-spike-driver', 1, 110],
    ['full-rifle-cartridge-ammo', 30, 2], ['linked-heavy-cartridge-ammo', 12, 4], ['long-armature-ammo', 8, 6]
  ],
  'ash-road-south-pera-koss': [
    ['tinned-beans', 3, 1], ['field-dressing', 1, 4], ['tarnished-saint-token', 1, 3],
    ['road-warden-chit', 1, 4], ['ash-road-boots', 1, 6]
  ],
  'ash-road-south-tessa-bair': [
    ['field-dressing', 4, 3], ['compact-suppressant', 1, 14]
  ]
};
const traders = [...actors.values()].filter((actor) => actor.trade);
assert.equal(traders.length, 3);
for (const trader of traders) {
  assert.deepEqual(
    trader.trade.stock.map((entry) => [entry.item, entry.count, entry.price]),
    expectedTrade[trader.id],
    `${trader.name} has the planned stock and prices`
  );
}

const talkSpawns = spawns.filter((spawn) => spawn.dialogue);
const dialogues = [];
for (const spawn of talkSpawns) {
  assert.equal(level.dialogue.includes(spawn.dialogue), true, `${spawn.actor} dialogue is loaded by the level`);
  const dialogue = await readJson(`../data/dialogue/${spawn.dialogue}.json`);
  dialogues.push(dialogue);
  assert.equal(dialogue.id, spawn.dialogue);
  assert.ok(dialogue.nodes.start, `${dialogue.title} has a start node`);
  for (const [nodeId, node] of Object.entries(dialogue.nodes)) {
    assert.ok(node.lines?.length > 0, `${dialogue.title}:${nodeId} has authored lines`);
    if (node.choices) {
      assert.ok(node.choices.length >= 1 && node.choices.length <= 5, `${dialogue.title}:${nodeId} fits the dialogue controller`);
    }
  }
}

const principalIds = new Set([
  'ash-road-south-ressa-venn', 'ash-road-south-nel-varo', 'ash-road-south-daro-mett',
  'ash-road-south-yara-quell', 'ash-road-south-iven-roa', 'ash-road-south-brother-tarn'
]);
for (const dialogue of dialogues) {
  const nodeCount = Object.keys(dialogue.nodes).length;
  if (principalIds.has(dialogue.id)) {
    assert.ok(nodeCount >= 8 && nodeCount <= 24, `${dialogue.title} has full principal coverage`);
  } else {
    assert.ok(nodeCount >= 2 && nodeCount <= 5, `${dialogue.title} has a focused secondary conversation`);
  }
}

const dialogueById = new Map(dialogues.map((dialogue) => [dialogue.id, dialogue]));
const jarikDialogue = dialogueById.get('ash-road-south-jarik-ardent');
assert.deepEqual(jarikDialogue.nodes.seeking.conditions.items, { 'mirels-lucky-necklace': 1 });
const jarikHandoff = jarikDialogue.nodes.seeking.choices
  .find((choice) => choice.effects?.questUpdate?.stage === 'complete');
assert.deepEqual(jarikHandoff.conditions.items, { 'mirels-lucky-necklace': 1 });
assert.equal(jarikHandoff.effects.inventory.requireAll, true, 'Jeremiah handoff is atomic');
assert.deepEqual(jarikHandoff.effects.inventory.remove, [
  { item: 'mirels-lucky-necklace', count: 1 }
]);
assert.deepEqual(jarikHandoff.effects.inventory.add, [
  { item: 'road-warden-chit', count: 1 }
]);
assert.equal(jarikHandoff.effects.setFlag, 'jarik-necklace-returned');
assert.equal(jarikHandoff.effects.questUpdate.quest, 'carry-lucky-necklace');
assert.deepEqual(jarikHandoff.effects.actorSpeech, {
  target: 'speaker',
  lines: [
    'My papers were rolled inside the blanket, and my purse is still under the kettle.',
    'So nobody robbed me. The freight clerk even found my Hallowfen seal.',
    'Priscilla will never call this chance.'
  ],
  initialDelay: 0.2,
  interval: 0.6,
  ttl: 3.6
});
assert.equal(jarikDialogue.nodes.start.conditions.questStages['carry-lucky-necklace'], 'complete');
assert.equal(JSON.stringify(jarikDialogue.nodes.start).includes('road-warden-chit'), false, 'Jeremiah cannot repeat the reward');

const mirelDialogue = await readJson('../data/dialogue/ash-chapel-catacombs-mirel.json');
assert.equal(mirelDialogue.nodes.start.conditions.questStages['carry-lucky-necklace'], 'complete');
assert.equal(mirelDialogue.nodes.start.else, 'pending');
assert.equal(mirelDialogue.nodes.pending.conditions.questStages['carry-lucky-necklace'], 'charm-received');
assert.equal(mirelDialogue.nodes.pending.else, 'offer');
assert.equal(
  JSON.stringify(mirelDialogue.nodes.start).includes('mirels-lucky-necklace'),
  false,
  'Priscilla cannot grant another necklace after Jeremiah receives it'
);

const ressaStart = dialogueById.get('ash-road-south-ressa-venn').nodes.start;
const ressaOpening = ressaStart.choices.find((choice) => choice.effects?.questUpdate?.stage === 'inspect-throttled-flow');
assert.equal(ressaOpening.effects.setFlag, 'met-ressa-venn', 'Susanna begins the surface quest sequence');
const nelInspection = dialogueById.get('ash-road-south-nel-varo').nodes.start.choices
  .find((choice) => choice.effects?.questUpdate?.stage === 'hear-terms');
assert.equal(nelInspection.conditions.flag, 'met-ressa-venn', 'Noa advances the quest after Susanna begins it');
const ressaReturn = ressaStart.choices.find((choice) => choice.effects?.questUpdate?.stage === 'trace-buried-pulse');
assert.deepEqual(
  ressaReturn.conditions.flags,
  [
    'met-ressa-venn',
    'inspected-south-measure-flow',
    'heard-yara-quell-terms',
    'heard-daro-mett-terms',
    'heard-tarn-hallowfen-signal',
    'resident-isolation-requested'
  ],
  'Susanna advances only after the inspection and every surface position are known'
);

assert.equal(quest.initialStage, 'reach-water-court');
assert.deepEqual(
  quest.stages.map((stage) => stage.id),
  [
    'reach-water-court',
    'inspect-throttled-flow',
    'hear-terms',
    'trace-buried-pulse',
    'resolve-intake-clerk',
    'choose-water-plan',
    'decide-pump-control',
    'decide-roll-custody',
    'settle-nel',
    'settle-tarn',
    'north-gate-assembly',
    'depart-north',
    'complete'
  ]
);
assert.equal(quest.stages.some((stage) => stage.id === 'complete'), true, 'helper-map quest continuation has a completion stage');

const allowedSurfaceFlags = new Set([
  'met-ressa-venn',
  'inspected-south-measure-flow',
  'heard-yara-quell-terms',
  'heard-daro-mett-terms',
  'heard-tarn-hallowfen-signal',
  'heard-arrival-water-claim',
  'heard-charity-fever-pattern',
  'heard-chain-road-losses',
  'heard-return-shelf-separation',
  'heard-varo-family-wishes',
  'heard-hidden-household-consent',
  'heard-compact-applicant-motives',
  'heard-annex-bypass-route',
  'heard-grave-name-practice',
  'heard-north-paper-rules',
  'tarn-water-help-requested',
  'compact-treatment-requested',
  'morrow-ledger-audit-requested',
  'resident-isolation-requested',
  'charity-cellar-access',
  'hidden-rows-access',
  'morrow-freight-rear-access',
  'south-measure-annex-access',
  'south-measure-civil-access',
  'south-measure-helper-routes-open',
  'tarn-shared-road-proposed',
  'jarik-necklace-returned'
]);
const authoredFlags = new Set();
for (const dialogue of dialogues) {
  for (const effects of allEffects(dialogue)) {
    for (const flag of [].concat(effects.setFlag ?? [])) authoredFlags.add(flag);
    for (const update of [].concat(effects.questUpdate ?? [])) {
      assert.ok([
        'names-for-the-gate', 'household-of-one', 'debt-that-drinks',
        'charity-cot', 'lesson-under-the-wrap', 'carry-lucky-necklace'
      ].includes(update.quest));
      assert.ok([
        'inspect-throttled-flow', 'hear-terms', 'trace-buried-pulse', 'review-record',
        'audit-ledger', 'trace-doses', 'gather-evidence', 'complete'
      ].includes(update.stage));
    }
  }
}
assert.deepEqual([...authoredFlags].sort(), [...allowedSurfaceFlags].sort(), 'surface dialogue sets only the planned inquiry flags');

const routeGrid = new Grid(level);
for (const object of level.objects) {
  if (object.blocking) routeGrid.addBlocked(object.x, object.y);
}
for (const spawn of spawns) routeGrid.addBlocked(spawn.x, spawn.y);
for (const target of [
  { x: 64, y: 63 }, { x: 64, y: 58 }, { x: 64, y: 43 }, { x: 65, y: 2 },
  { x: 24, y: 54 }, { x: 39, y: 28 }, { x: 88, y: 66 }, { x: 115, y: 52 }, { x: 101, y: 29 },
  { x: 64, y: 37 }, { x: 119, y: 73 }, { x: 31, y: 55 }, { x: 20, y: 25 },
  { x: 18, y: 27 }, { x: 30, y: 48 }, { x: 37, y: 50 }, { x: 98, y: 34 },
  { x: 94, y: 52 }, { x: 113, y: 48 }, { x: 125, y: 58 }, { x: 112, y: 16 },
  { x: 96, y: 72 }
]) {
  assert.equal(pathExists(routeGrid, level.spawns.player, target), true, `population leaves route to ${target.x},${target.y} open`);
}

const baseGrid = new Grid(level);
for (const object of level.objects) {
  if (object.blocking) baseGrid.addBlocked(object.x, object.y);
}
for (const spawn of spawns.filter((entry) => entry.patrol)) {
  for (const waypoint of spawn.patrol.path) {
    assert.equal(pathExists(baseGrid, spawn, waypoint), true, `${spawn.actor} can reach patrol waypoint ${waypoint.x},${waypoint.y}`);
  }
}

const authoredText = JSON.stringify([level, quest, [...actors.values()], dialogues]);
assert.equal(level.dialogue.includes('ash-road-south-north-departure'), true, 'surface population loads the northward handoff');
assert.equal(authoredText.includes('—'), false, 'Ash Road South cast text contains no em dash');
assert.equal(authoredText.includes('--'), false, 'Ash Road South cast text contains no doubled dash');

console.log('ashRoadSouthPopulation: 81 named NPCs, 31 conversations, 24 patrols, 9 markers, and 3 traders valid.');
