import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import {
  SOUTH_MEASURE_AMBIENT_LINE_COUNT,
  SOUTH_MEASURE_INTERACTIVE_PLACEMENT_COUNT,
  SOUTH_MEASURE_LOGICAL_PLACEMENT_COUNT,
  SOUTH_MEASURE_NEW_CAST
} from '../scripts/content/south-measure-population.mjs';
import {
  SOUTH_MEASURE_CHARACTER_DIALOGUE_IDS,
  SOUTH_MEASURE_NERI_CLUE_FLAGS,
  SOUTH_MEASURE_NERI_TERMINAL_FLAGS,
  SOUTH_MEASURE_OBJECT_DIALOGUE_IDS
} from '../scripts/content/south-measure-dialogues.mjs';

const ROOT = new URL('../', import.meta.url);
const LEVEL_PATHS = [
  'data/levels/south_measure_intake_undercroft.json',
  'data/levels/south_measure_relief_drain.json',
  'data/levels/south_measure_relief_maintenance_annex.json',
  'data/levels/south_measure_morrow_freight_house.json',
  'data/levels/south_measure_compact_clinic.json',
  'data/levels/south_measure_measure_hall.json',
  'data/levels/south_measure_varo_house.json',
  'data/levels/south_measure_hidden_rows.json',
  'data/levels/south_measure_charity_cellar.json'
];

async function readJson(path) {
  return JSON.parse(await readFile(new URL(path, ROOT), 'utf8'));
}

function allChoices(dialogue) {
  return Object.values(dialogue.nodes).flatMap((node) => node.choices ?? []);
}

function reachableWithPopulation(level) {
  const blocked = new Set(
    level.objects.filter((object) => object.blocking).map((object) => `${object.x},${object.y}`)
  );
  for (const spawn of [...level.spawns.npcs, ...level.spawns.enemies]) blocked.add(`${spawn.x},${spawn.y}`);
  const walkable = (x, y) => (
    x >= 0 && y >= 0 && x < level.width && y < level.height &&
    level.legend[level.tiles[y][x]]?.walkable === true && !blocked.has(`${x},${y}`)
  );
  const start = level.spawns.player;
  const seen = new Set([`${start.x},${start.y}`]);
  const queue = [start];
  for (let index = 0; index < queue.length; index += 1) {
    const cell = queue[index];
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const x = cell.x + dx;
      const y = cell.y + dy;
      const key = `${x},${y}`;
      if (seen.has(key) || !walkable(x, y)) continue;
      seen.add(key);
      queue.push({ x, y });
    }
  }
  return seen;
}

const levels = await Promise.all(LEVEL_PATHS.map(readJson));
const surface = await readJson('data/levels/ash_road_south.json');
const quest = await readJson('data/quests/names-for-the-gate.json');
const actors = levels.flatMap((level) => level.spawns.npcs ?? []);
const enemies = levels.flatMap((level) => level.spawns.enemies ?? []);
const clerk = levels
  .flatMap((level) => level.objects ?? [])
  .find((object) => object.id === 'undercroft-intake-clerk');

assert.equal(actors.length, 70, 'helper maps have seventy walking NPC placements');
assert.equal(enemies.length, 2, 'helper maps have the conditional Intake Clerk and revealed-Salome encounters');
assert.ok(clerk, 'the fixed Intake Clerk character is present');
assert.equal(actors.length + 1, SOUTH_MEASURE_LOGICAL_PLACEMENT_COUNT);
assert.equal(
  actors.filter((spawn) => spawn.dialogue).length + 1,
  SOUTH_MEASURE_INTERACTIVE_PLACEMENT_COUNT,
  'forty NPCs and Junia are interactable'
);
assert.equal(
  actors.reduce((count, spawn) => count + spawn.ambient.length, 0) + clerk.ambient.length,
  SOUTH_MEASURE_AMBIENT_LINE_COUNT,
  'every logical placement has three walking barks'
);
for (const spawn of actors) assert.equal(spawn.ambient.length, 3, `${spawn.spawnId} has three barks`);
assert.equal(clerk.ambient.length, 3, 'Junia has three fixed-prop barks');

const expectedByMap = new Map([
  ['south-measure-intake-undercroft', [4, 4]],
  ['south-measure-relief-drain', [3, 1]],
  ['south-measure-relief-maintenance-annex', [8, 3]],
  ['south-measure-morrow-freight-house', [9, 5]],
  ['south-measure-compact-clinic', [12, 7]],
  ['south-measure-measure-hall', [14, 7]],
  ['south-measure-varo-house', [3, 3]],
  ['south-measure-hidden-rows', [12, 6]],
  ['south-measure-charity-cellar', [5, 4]]
]);
for (const level of levels) {
  const [population, interactive] = expectedByMap.get(level.id);
  assert.equal(level.spawns.npcs.length, population, `${level.id} population is locked`);
  assert.equal(level.spawns.npcs.filter((spawn) => spawn.dialogue).length, interactive, `${level.id} conversations are locked`);
  const reachable = reachableWithPopulation(level);
  for (const object of level.objects.filter((entry) => entry.interact)) {
    assert.ok(
      reachable.has(`${object.interactionMarker.x},${object.interactionMarker.y}`),
      `${level.id}:${object.id} remains reachable around the full population`
    );
  }
  for (const spawn of level.spawns.npcs.filter((entry) => entry.dialogue)) {
    assert.ok(
      [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => reachable.has(`${spawn.x + dx},${spawn.y + dy}`)),
      `${level.id}:${spawn.actor} has a reachable talk tile around the full population`
    );
  }
}

assert.equal(SOUTH_MEASURE_NEW_CAST.length, 27, 'twenty-seven new living identities are authored');
assert.equal(new Set(SOUTH_MEASURE_NEW_CAST.map((person) => person.id)).size, 27);
for (const person of SOUTH_MEASURE_NEW_CAST) {
  const actor = await readJson(`data/actors/${person.id}.json`);
  assert.equal(actor.name, person.name);
  assert.equal(actor.role, person.role);
  assert.ok(actor.tags.includes('south-measure-interior'));
}

const intakeRecord = await readJson('data/enemies/south-measure-intake-clerk.json');
const neriEnemyRecord = await readJson('data/enemies/south-measure-false-catechist.json');
assert.equal(intakeRecord.name, 'Junia Lector, the Intake Clerk');
assert.equal(intakeRecord.spriteId, 'south-measure-intake-clerk');
assert.ok(intakeRecord.tags.includes('vale-imprint'));
assert.equal(neriEnemyRecord.spriteId, 'south-measure-false-catechist');
assert.ok(neriEnemyRecord.tags.includes('early-stage-three'));

const surfaceIds = new Set(surface.spawns.npcs.map((spawn) => spawn.actor));
const livingIds = new Set([...surfaceIds, ...actors.map((spawn) => spawn.actor)]);
assert.equal(surfaceIds.size, 81);
assert.equal(livingIds.size, 108, 'eighty-one surface identities plus twenty-seven new living identities');
assert.equal(livingIds.size + 1, 109, 'Junia brings the full Ash Road South census to one hundred nine');
const talkableIds = new Set([
  ...surface.spawns.npcs.filter((spawn) => spawn.dialogue).map((spawn) => spawn.actor),
  ...actors.filter((spawn) => spawn.dialogue).map((spawn) => spawn.actor),
  'south-measure-intake-clerk'
]);
assert.equal(talkableIds.size, 48, 'forty-eight unique identities are interactable somewhere');
assert.equal(109 - talkableIds.size, 61, 'sixty-one identities remain ambient-only');

assert.equal(SOUTH_MEASURE_CHARACTER_DIALOGUE_IDS.length, 41);
assert.equal(new Set(SOUTH_MEASURE_CHARACTER_DIALOGUE_IDS).size, 41);
const loadedDialogueIds = new Set(levels.flatMap((level) => level.dialogue));
for (const id of [...SOUTH_MEASURE_CHARACTER_DIALOGUE_IDS, ...SOUTH_MEASURE_OBJECT_DIALOGUE_IDS]) {
  assert.ok(loadedDialogueIds.has(id), `${id} is loaded by a helper map`);
  const dialogue = await readJson(`data/dialogue/${id}.json`);
  assert.equal(dialogue.id, id);
}

assert.deepEqual(quest.stages.map((stage) => stage.id), [
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
]);
const helperDialogues = await Promise.all(
  SOUTH_MEASURE_CHARACTER_DIALOGUE_IDS.map((id) => readJson(`data/dialogue/${id}.json`))
);
const helperQuestStages = new Set(
  helperDialogues.flatMap((dialogue) => allChoices(dialogue))
    .flatMap((choice) => [].concat(choice.effects?.questUpdate ?? []).map((update) => update.stage))
    .filter(Boolean)
);
for (const stage of [
  'resolve-intake-clerk', 'choose-water-plan', 'decide-pump-control',
  'decide-roll-custody', 'settle-nel', 'settle-tarn',
  'north-gate-assembly', 'depart-north'
]) {
  assert.ok(helperQuestStages.has(stage), `helper conversations advance ${stage}`);
}

const clinic = levels.find((level) => level.id === 'south-measure-compact-clinic');
const beds = clinic.objects.filter((object) => object.kind === 'clinic-bed');
const wardBeds = beds.filter((bed) => bed.id !== 'compact-clinic-isolation-room');
assert.equal(wardBeds.length, 6, 'the main ward has six beds');
assert.equal(wardBeds.filter((bed) => bed.variant === 'used').length, 4, 'four ward beds are occupied');
assert.equal(wardBeds.filter((bed) => bed.variant === 'clean').length, 2, 'two ward beds remain open');
assert.equal(beds.length, 7, 'the clinic also has one separate isolation bed');

assert.equal(clerk.interact.dialogue, 'south-measure-undercroft-ona-veyl');
assert.equal(clerk.state, 'dormant');
const onaDialogue = await readJson('data/dialogue/south-measure-undercroft-ona-veyl.json');
assert.ok(JSON.stringify(onaDialogue).includes('Junia Lector'));
for (const outcome of [
  'intake-clerk-contained',
  'intake-clerk-tarn-sealed',
  'intake-clerk-compact',
  'intake-clerk-killed',
  'intake-clerk-burned',
  'intake-clerk-resealed'
]) assert.ok(JSON.stringify([onaDialogue, levels]).includes(outcome), `Junia supports ${outcome}`);

const undercroft = levels.find((level) => level.id === 'south-measure-intake-undercroft');
const releasedClerk = undercroft.spawns.enemies.find((spawn) => spawn.id === 'south-measure-intake-clerk');
assert.equal(releasedClerk.conditions.flag, 'intake-clerk-forced-open');
assert.equal(releasedClerk.encounter, 'intake-clerk-release');
assert.deepEqual(undercroft.onVictory.setFlag, [
  'intake-clerk-killed',
  'intake-clerk-resolved',
  'intake-roll-damaged',
  'south-measure-water-decision-open',
  'south-measure-north-pulse-traced'
]);

const cellar = levels.find((level) => level.id === 'south-measure-charity-cellar');
const normalNeri = cellar.spawns.npcs.find((spawn) => spawn.actor === 'ash-road-south-neri-vaun');
const revealedNeri = cellar.spawns.enemies[0];
assert.ok(normalNeri.conditions.flagsAbsent.includes('neri-agent-exposed'));
assert.equal(revealedNeri.conditions.flag, 'neri-agent-exposed');
assert.equal(normalNeri.characterSlot, revealedNeri.characterSlot, 'normal and revealed Salome occupy one logical placement');
assert.deepEqual({ x: normalNeri.x, y: normalNeri.y }, { x: revealedNeri.x, y: revealedNeri.y });
assert.equal(revealedNeri.encounter, 'south-measure-false-catechist');
assert.deepEqual(cellar.onVictory.setFlag, ['neri-agent-killed', 'neri-agent-resolved']);

const neriDialogue = await readJson('data/dialogue/south-measure-cellar-neri-vaun.json');
const assemblyDialogue = await readJson('data/dialogue/south-measure-hall-ressa-venn.json');
const evidenceChoice = allChoices(neriDialogue).find((choice) => choice.label === 'Lay out the evidence against her');
assert.equal(evidenceChoice.conditions.flagsAtLeast.count, 2);
assert.deepEqual(evidenceChoice.conditions.flagsAtLeast.of, SOUTH_MEASURE_NERI_CLUE_FLAGS);
const neriText = JSON.stringify(neriDialogue);
for (const outcome of SOUTH_MEASURE_NERI_TERMINAL_FLAGS) {
  assert.ok(
    neriText.includes(outcome) || JSON.stringify(cellar).includes(outcome) || JSON.stringify(assemblyDialogue).includes(outcome),
    `Salome supports terminal outcome ${outcome}`
  );
}
for (const flag of ['pate-open-wound-convert', 'jori-choir-courier', 'jalen-choir-transfer']) {
  assert.ok(neriText.includes(flag), `${flag} is attached to an active-influence outcome`);
}
const merenDialogue = await readJson('data/dialogue/south-measure-cellar-meren-heth.json');
for (const label of ['Detain Matthias for the resident council', 'Bar Matthias from the charity route']) {
  const choice = allChoices(merenDialogue).find((entry) => entry.label === label);
  assert.ok(choice, `${label} is implemented`);
  assert.equal([].concat(choice.effects.setFlag).includes('neri-agent-resolved'), false, 'Matthias custody does not resolve Salome');
}
for (const unrelated of ['iven', 'seli', 'cora']) {
  assert.equal(neriText.includes(`${unrelated}-choir`), false, `${unrelated} is not mislabeled as a cult convert`);
}

const authoredText = JSON.stringify([
  levels,
  SOUTH_MEASURE_NEW_CAST,
  helperDialogues
]);
assert.equal(authoredText.includes('—'), false, 'helper-map player text has no em dash');
assert.equal(authoredText.includes('--'), false, 'helper-map player text has no doubled dash');

console.log('southMeasurePopulation: 109 identities, 71 helper placements, 41 conversations, 213 barks, and Salome evidence outcomes valid.');
