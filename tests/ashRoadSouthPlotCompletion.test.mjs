import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';

import { meetsDialogueConditions } from '../src/core/DialogueConditions.js';
import { DialogueEffects } from '../src/core/DialogueEffects.js';
import { Inventory } from '../src/core/Inventory.js';
import { buildJournalState } from '../src/core/JournalState.js';
import { syncObjectFlagState } from '../src/world/ObjectFlagState.js';
import {
  SOUTH_MEASURE_CHARITY_FLAGS,
  SOUTH_MEASURE_GOVERNANCE_FLAGS,
  SOUTH_MEASURE_HIDDEN_ROLL_FLAGS,
  SOUTH_MEASURE_INTAKE_FLAGS,
  SOUTH_MEASURE_ITEM_IDS,
  SOUTH_MEASURE_LEDGER_FLAGS,
  SOUTH_MEASURE_NEL_FLAGS,
  SOUTH_MEASURE_QUEST_IDS,
  SOUTH_MEASURE_ROLL_FLAGS,
  SOUTH_MEASURE_TARN_FLAGS,
  SOUTH_MEASURE_WATER_PLAN_FLAGS,
  SOUTH_MEASURE_WATER_STATE_FLAGS
} from '../scripts/content/south-measure-state.mjs';

const ROOT = new URL('../', import.meta.url);
const HELPER_LEVEL_FILES = [
  'south_measure_intake_undercroft.json',
  'south_measure_relief_drain.json',
  'south_measure_relief_maintenance_annex.json',
  'south_measure_morrow_freight_house.json',
  'south_measure_compact_clinic.json',
  'south_measure_measure_hall.json',
  'south_measure_varo_house.json',
  'south_measure_hidden_rows.json',
  'south_measure_charity_cellar.json'
];
const SURFACE_QUEST_IDS = [...SOUTH_MEASURE_QUEST_IDS, 'carry-lucky-necklace'];

async function readJson(path) {
  return JSON.parse(await readFile(new URL(path, ROOT), 'utf8'));
}

function effectsInDialogue(dialogue) {
  return Object.values(dialogue.nodes).flatMap((node) => [
    node.effects,
    ...(node.choices ?? []).map((choice) => choice.effects)
  ]).filter(Boolean);
}

function questUpdates(effect) {
  return [].concat(effect?.questUpdate ?? []).filter(Boolean);
}

function setFlags(effect) {
  return [].concat(effect?.setFlag ?? []).filter(Boolean);
}

const surface = await readJson('data/levels/ash_road_south.json');
const helperLevels = await Promise.all(HELPER_LEVEL_FILES.map((name) => readJson(`data/levels/${name}`)));
const allDialogueIds = new Set([
  ...surface.dialogue,
  ...helperLevels.flatMap((level) => level.dialogue)
]);
const dialogues = new Map();
for (const id of allDialogueIds) dialogues.set(id, await readJson(`data/dialogue/${id}.json`));
const allEffects = [
  ...[...dialogues.values()].flatMap(effectsInDialogue),
  ...helperLevels.map((level) => level.onVictory).filter(Boolean)
];
const authoredFlags = new Set(allEffects.flatMap(setFlags));

assert.deepEqual(surface.quests, SURFACE_QUEST_IDS);
for (const level of helperLevels) assert.deepEqual(level.quests, SOUTH_MEASURE_QUEST_IDS, `${level.id} loads every South Measure quest`);

const expectedMainStages = [
  'reach-water-court', 'inspect-throttled-flow', 'hear-terms', 'trace-buried-pulse',
  'resolve-intake-clerk', 'choose-water-plan', 'decide-pump-control',
  'decide-roll-custody', 'settle-nel', 'settle-tarn',
  'north-gate-assembly', 'depart-north', 'complete'
];
const mainQuest = await readJson('data/quests/names-for-the-gate.json');
assert.deepEqual(mainQuest.stages.map((stage) => stage.id), expectedMainStages);
for (const id of SOUTH_MEASURE_QUEST_IDS) {
  const quest = await readJson(`data/quests/${id}.json`);
  assert.equal(quest.id, id);
  assert.equal(quest.stages.at(-1).id, 'complete', `${id} has a terminal stage`);
  assert.ok(allEffects.some((effect) => questUpdates(effect).some((update) => update.quest === id && update.stage === 'complete')), `${id} has an implemented completion effect`);
}
const neriQuest = await readJson('data/quests/lesson-under-the-wrap.json');
assert.deepEqual(neriQuest.unlockedBy, { flag: 'neri-investigation-started' });
const hiddenQuestJournal = buildJournalState({
  questDefs: { [neriQuest.id]: neriQuest },
  questStages: new Map([[neriQuest.id, neriQuest.initialStage]]),
  questReached: new Map([[neriQuest.id, new Set([neriQuest.initialStage])]]),
  flags: new Set(),
  player: {}
});
assert.equal(hiddenQuestJournal.quests.length, 0, 'the Choir investigation stays out of the journal before discovery');
const revealedQuestJournal = buildJournalState({
  questDefs: { [neriQuest.id]: neriQuest },
  questStages: new Map([[neriQuest.id, 'gather-evidence']]),
  questReached: new Map([[neriQuest.id, new Set([neriQuest.initialStage, 'gather-evidence'])]]),
  flags: new Set(['neri-investigation-started']),
  player: {}
});
assert.equal(revealedQuestJournal.quests[0]?.title, neriQuest.title, 'the Choir investigation appears after the first clue');

const outcomeGroups = {
  waterPlan: SOUTH_MEASURE_WATER_PLAN_FLAGS,
  waterState: SOUTH_MEASURE_WATER_STATE_FLAGS,
  governance: SOUTH_MEASURE_GOVERNANCE_FLAGS,
  roll: SOUTH_MEASURE_ROLL_FLAGS,
  nel: SOUTH_MEASURE_NEL_FLAGS,
  charity: SOUTH_MEASURE_CHARITY_FLAGS,
  hidden: SOUTH_MEASURE_HIDDEN_ROLL_FLAGS,
  ledger: SOUTH_MEASURE_LEDGER_FLAGS,
  tarn: SOUTH_MEASURE_TARN_FLAGS,
  intake: SOUTH_MEASURE_INTAKE_FLAGS
};
for (const [name, group] of Object.entries(outcomeGroups)) {
  for (const flag of group) assert.ok(authoredFlags.has(flag), `${name} outcome ${flag} is implemented`);
  for (const effect of allEffects) {
    assert.ok(setFlags(effect).filter((flag) => group.includes(flag)).length <= 1, `${name} outcomes remain mutually exclusive per decision`);
  }
}
for (const effect of allEffects) {
  if (setFlags(effect).some((flag) => SOUTH_MEASURE_INTAKE_FLAGS.includes(flag))) {
    assert.ok(setFlags(effect).includes('intake-clerk-resolved'), 'every terminal Intake Clerk fate sets the shared resolution flag');
  }
  if (setFlags(effect).some((flag) => [
    'neri-copy-hand-found',
    'neri-suppressant-diversion-found',
    'neri-recruit-list-found',
    'neri-host-sign-seen'
  ].includes(flag))) {
    assert.ok(setFlags(effect).includes('neri-investigation-started'), 'every Salome clue reveals the hidden investigation');
  }
}
for (const [id, dialogue] of dialogues) {
  if (id === 'south-measure-hall-ressa-venn') continue;
  for (const effect of effectsInDialogue(dialogue)) {
    assert.equal(
      setFlags(effect).some((flag) => SOUTH_MEASURE_ROLL_FLAGS.includes(flag)),
      false,
      `${id} does not decide final household-roll custody before the hall vote`
    );
  }
}

const itemFiles = await readdir(new URL('data/items/', ROOT));
const itemDefs = {};
for (const file of itemFiles.filter((name) => name.endsWith('.json'))) {
  const item = await readJson(`data/items/${file}`);
  itemDefs[item.id] = item;
}
for (const itemId of Object.values(SOUTH_MEASURE_ITEM_IDS)) {
  assert.ok(itemDefs[itemId], `${itemId} has a physical item record`);
  assert.equal(itemDefs[itemId].type, 'quest');
}
for (const removedItemId of [
  'south-measure-annex-brace',
  'south-measure-compact-coil',
  'south-measure-intake-coupling',
  'south-measure-morrow-governor'
]) assert.equal(itemDefs[removedItemId], undefined, `${removedItemId} is not retained as obsolete quest inventory`);

const yara = dialogues.get('south-measure-clinic-yara-quell');
const compactRoutes = yara.nodes.acquire.choices.filter((choice) => setFlags(choice.effects).includes('south-measure-plan-monitored-flow'));
assert.equal(compactRoutes.length, 4, 'monitored full flow has agreement, doctrine, speech, and command routes');
for (const route of compactRoutes) assert.equal(route.effects.inventory, undefined, 'Compact monitoring does not create a component item');

const daro = dialogues.get('south-measure-freight-daro-mett');
const morrowRoutes = daro.nodes.acquire.choices.filter((choice) => setFlags(choice.effects).includes('south-measure-plan-morrow-import'));
assert.equal(morrowRoutes.length, 4, 'Morrow water has contract, exchange, purchase, and command routes');
for (const route of morrowRoutes) assert.equal(route.effects.inventory?.add, undefined, 'Morrow water does not create a component item');

const nel = dialogues.get('south-measure-undercroft-nel-varo');
const residentPlan = nel.nodes.start.choices.find((choice) => setFlags(choice.effects).includes('south-measure-plan-isolated-loop'));
assert.equal(residentPlan.conditions.flag, 'south-measure-water-decision-open');
assert.deepEqual(residentPlan.conditions.flags, ['south-measure-isolation-route-known', 'intake-clerk-resolved']);
assert.deepEqual(residentPlan.conditions.flagsAtLeast.of, [
  'intake-clerk-contained',
  'intake-clerk-tarn-sealed',
  'intake-clerk-compact',
  'intake-clerk-killed',
  'intake-clerk-resealed'
]);
assert.equal(residentPlan.effects.inventory, undefined, 'the isolated loop is an operating decision, not recovered hardware');

const hall = dialogues.get('south-measure-hall-ressa-venn');
for (const [planFlag, stateFlag] of [
  ['south-measure-plan-monitored-flow', 'south-measure-water-full'],
  ['south-measure-plan-morrow-import', 'south-measure-water-rationed'],
  ['south-measure-plan-isolated-loop', 'south-measure-water-reduced'],
  ['south-measure-plan-feed-closed', 'south-measure-water-emergency']
]) {
  const operate = hall.nodes.operate.choices.find((choice) => choice.conditions?.flag === planFlag);
  assert.ok(operate, `${planFlag} has a council operating action`);
  assert.ok(setFlags(operate.effects).includes(stateFlag), `${planFlag} produces ${stateFlag}`);
  assert.equal(operate.effects.questUpdate.stage, 'decide-pump-control');
}
assert.ok(hall.nodes.start.choices.some((choice) => setFlags(choice.effects).includes('south-measure-plan-feed-closed')), 'emergency closure remains a complete independent plan');
assert.equal(JSON.stringify([yara, daro, nel, hall]).includes('south-measure-intake-coupling'), false, 'the main water graph contains no component hunt');

for (const nodeId of ['review', 'operate', 'pump', 'pump-compact', 'pump-morrow', 'pump-resident', 'pump-sealed', 'roll-consent', 'roll', 'roll-other', 'nel', 'tarn', 'assembly', 'assembly-defaults']) {
  assert.ok(hall.nodes[nodeId], `Measure Hall implements ${nodeId}`);
}
for (const label of ['Close the assembly with Salome’s case resolved', 'Close the assembly with no further accusation']) {
  const choice = hall.nodes.assembly.choices.find((entry) => entry.label === label);
  assert.ok(JSON.stringify(choice.conditions).includes('intake-clerk-resolved'), `${label} requires a resolved Intake Clerk`);
}

const undercroft = helperLevels.find((level) => level.id === 'south-measure-intake-undercroft');
const releasedClerk = undercroft.spawns.enemies.find((spawn) => spawn.id === 'south-measure-intake-clerk');
assert.equal(releasedClerk.conditions.flag, 'intake-clerk-forced-open');
assert.equal(releasedClerk.encounter, 'intake-clerk-release');
assert.equal(undercroft.combatTriggers[0].forceCombat, true);
assert.ok(setFlags(undercroft.onVictory).includes('intake-clerk-killed'));
assert.ok(setFlags(undercroft.onVictory).includes('intake-clerk-resolved'));
const clerkRecord = await readJson('data/enemies/south-measure-intake-clerk.json');
assert.equal(clerkRecord.spriteId, 'south-measure-intake-clerk');
assert.ok(clerkRecord.stats.actionPoints > 0);
assert.ok(clerkRecord.attacks.length >= 2);

const restrictedConnectors = new Map([
  ['south-measure-civil-stair-surface', 'south-measure-civil-access'],
  ['south-measure-collapsed-culvert-surface', 'drain-access-cleared'],
  ['south-measure-annex-main-door-surface', 'south-measure-annex-access'],
  ['south-measure-freight-rear-door-surface', 'morrow-freight-rear-access'],
  ['south-measure-hidden-rows-drying-frame-surface', 'hidden-rows-access'],
  ['south-measure-charity-trapdoor-surface', 'charity-cellar-access']
]);
for (const [id, flag] of restrictedConnectors) {
  const dialogue = dialogues.get(id);
  const travel = dialogue.nodes.start.choices.find((choice) => choice.effects?.loadLevel);
  assert.ok(travel.conditions, `${id} does not open unconditionally`);
  assert.ok(JSON.stringify(travel.conditions).includes(flag), `${id} honors ${flag}`);
  assert.ok(dialogue.nodes.start.choices.some((choice) => choice.effects?.loadLevel && choice !== travel), `${id} has an alternate checked route`);
}
for (const id of [
  'south-measure-freight-main-door-surface',
  'south-measure-clinic-main-door-surface',
  'south-measure-hall-main-door-surface',
  'south-measure-varo-door-surface'
]) {
  const travel = dialogues.get(id).nodes.start.choices.find((choice) => choice.effects?.loadLevel);
  assert.equal(travel.conditions, undefined, `${id} remains a public entrance`);
}

const outcomeProps = surface.objects.filter((object) => object.visibleWhenFlags?.some((flag) => SOUTH_MEASURE_GOVERNANCE_FLAGS.includes(flag)));
assert.ok(outcomeProps.length >= SOUTH_MEASURE_GOVERNANCE_FLAGS.length, 'each governance result has physical surface dressing');
for (const flag of SOUTH_MEASURE_GOVERNANCE_FLAGS) {
  assert.ok(outcomeProps.some((object) => object.visibleWhenFlags.includes(flag)), `${flag} changes the surface`);
}
const openNorthRoad = surface.objects.find((object) => object.id === 'ash-road-south-open-north-road');
assert.deepEqual(openNorthRoad.visibleWhenFlags, ['south-measure-north-lane-open']);
const departure = dialogues.get('ash-road-south-north-departure');
const crossNorth = departure.nodes.start.choices.find((choice) => choice.effects?.showBriefing);
assert.equal(crossNorth.effects.questUpdate.stage, 'complete');
assert.equal(crossNorth.effects.setFlag, 'departed-south-measure');

{
  const calls = [];
  const prop = { x: 4, y: 7, blocking: true, visibleWhenFlags: ['south-measure-resident'] };
  const grid = {
    addBlocked: (x, y) => calls.push(`add:${x},${y}`),
    removeBlocked: (x, y) => calls.push(`remove:${x},${y}`)
  };
  syncObjectFlagState(prop, new Set(), { grid });
  assert.equal(prop.hiddenByFlag, true);
  syncObjectFlagState(prop, new Set(['south-measure-resident']), { grid });
  assert.equal(prop.hiddenByFlag, false);
  assert.deepEqual(calls, ['remove:4,7', 'add:4,7']);
}

const questStages = new Map();
const quests = new Map();
for (const id of SOUTH_MEASURE_QUEST_IDS) {
  const quest = await readJson(`data/quests/${id}.json`);
  quests.set(id, quest);
  questStages.set(id, quest.initialStage);
}
const playState = {
  flags: new Set(),
  clock: { yearAfterDescent: 130, fieldDay: 1, minuteOfDay: 480, minuteCarry: 0 },
  inventory: new Inventory(itemDefs, { maxCarryWeight: 100 }),
  mode: 'explore'
};
const transitionTargets = [];
const applyQuestUpdate = (update) => {
  const quest = quests.get(update.quest);
  assert.ok(quest, `playthrough knows quest ${update.quest}`);
  const current = quest.stages.findIndex((stage) => stage.id === questStages.get(update.quest));
  const next = quest.stages.findIndex((stage) => stage.id === update.stage);
  assert.ok(next >= 0, `${update.quest} knows stage ${update.stage}`);
  if (next >= current) questStages.set(update.quest, update.stage);
};
const conditionState = () => ({
  flags: playState.flags,
  questStages,
  fieldRating: () => 100,
  itemCount: (id) => playState.inventory.count(id),
  traceValue: () => 0,
  hasScar: () => false
});
const runtime = new DialogueEffects(playState, {
  applyQuestUpdate,
  meetsConditions: (conditions) => meetsDialogueConditions(conditions, conditionState()),
  transitionLevel: (target) => transitionTargets.push(target),
  closeUiScreen() {},
  syncFlagConditionalObjects() {},
  syncInventoryOrder() {},
  clampInventorySelection() {},
  log() {}
});

function makeBranchHarness({ flags = [], mainStage = 'choose-water-plan', items = [] } = {}) {
  const stages = new Map();
  for (const [id, quest] of quests) stages.set(id, id === 'names-for-the-gate' ? mainStage : quest.initialStage);
  const state = {
    flags: new Set(flags),
    clock: { yearAfterDescent: 130, fieldDay: 1, minuteOfDay: 480, minuteCarry: 0 },
    inventory: new Inventory(itemDefs, { maxCarryWeight: 100 }),
    mode: 'explore'
  };
  for (const [item, count] of items) state.inventory.add(item, count);
  const conditions = () => ({
    flags: state.flags,
    questStages: stages,
    fieldRating: () => 100,
    itemCount: (id) => state.inventory.count(id),
    traceValue: () => 0,
    hasScar: () => false
  });
  const effects = new DialogueEffects(state, {
    applyQuestUpdate(update) {
      const quest = quests.get(update.quest);
      const current = quest.stages.findIndex((stage) => stage.id === stages.get(update.quest));
      const next = quest.stages.findIndex((stage) => stage.id === update.stage);
      if (next >= current) stages.set(update.quest, update.stage);
    },
    meetsConditions: (spec) => meetsDialogueConditions(spec, conditions()),
    syncFlagConditionalObjects() {},
    syncInventoryOrder() {},
    clampInventorySelection() {},
    log() {}
  });
  return {
    state,
    stages,
    available: (choice) => meetsDialogueConditions(choice.conditions, conditions()),
    apply(choice, message = choice.label) {
      assert.equal(meetsDialogueConditions(choice.conditions, conditions()), true, `${message} is available`);
      effects.apply(choice.effects);
    }
  };
}

{
  const branch = makeBranchHarness({ flags: ['south-measure-water-decision-open', 'intake-clerk-resolved'] });
  const morrowAgreement = daro.nodes.acquire.choices.find((choice) => choice.label === 'Sign the Morrow water contract');
  branch.apply(morrowAgreement);
  assert.ok(branch.state.flags.has('south-measure-plan-morrow-import'));
  const cancelCisterns = hall.nodes.review.choices.find((choice) => choice.label === 'Cancel the Morrow cistern plan');
  branch.apply(cancelCisterns);
  assert.equal(branch.state.flags.has('south-measure-plan-morrow-import'), false);
  assert.equal(branch.state.flags.has('morrow-water-contract'), false);

  const negotiateCompact = yara.nodes.start.choices.find((choice) => choice.label === 'Negotiate monitored full flow');
  assert.equal(branch.available(negotiateCompact), true, 'a cancelled plan reopens another water route without moving the journal backward');
  const compactAgreement = yara.nodes.acquire.choices.find((choice) => choice.label === 'Accept the full Compact census agreement');
  branch.apply(compactAgreement);
  const openFullFlow = hall.nodes.operate.choices.find((choice) => choice.label === 'Open monitored full flow');
  branch.apply(openFullFlow);
  assert.ok(branch.state.flags.has('south-measure-water-full'));
  const breakCompactTerms = hall.nodes['pump-morrow'].choices.find((choice) => choice.label === 'Break Aurelia’s census terms and choose Morrow service');
  branch.apply(breakCompactTerms);
  assert.ok(branch.state.flags.has('south-measure-morrow'));
  assert.ok(branch.state.flags.has('compact-monitoring-terms-breached'));
}

{
  const branch = makeBranchHarness({ flags: ['south-measure-water-decision-open', 'intake-clerk-resolved'] });
  const closeFeedPlan = hall.nodes.start.choices.find((choice) => choice.label === 'Choose emergency feed closure');
  branch.apply(closeFeedPlan);
  const closeFeed = hall.nodes.operate.choices.find((choice) => choice.label === 'Close the buried feed');
  branch.apply(closeFeed);
  const sealPump = hall.nodes['pump-sealed'].choices.find((choice) => choice.label === 'Close the feed and seal outside access');
  branch.apply(sealPump);
  assert.ok(branch.state.flags.has('south-measure-plan-feed-closed'));
  assert.ok(branch.state.flags.has('south-measure-water-emergency'));
  assert.ok(branch.state.flags.has('south-measure-sealed'));
}

{
  const branch = makeBranchHarness({
    flags: ['heard-yara-quell-terms', 'south-measure-isolation-route-known']
  });
  const compactClerk = dialogues.get('south-measure-undercroft-ona-veyl').nodes.custody.choices.find((choice) => choice.label === 'Release Junia to Compact custody');
  branch.apply(compactClerk);
  assert.ok(branch.state.flags.has('intake-clerk-resolved'));
  const rollDialogue = dialogues.get('south-measure-undercroft-original-roll');
  const challengeClaim = rollDialogue.nodes.start.choices.find((choice) => choice.label === 'Challenge the Compact claim and carry the roll');
  branch.apply(challengeClaim);
  assert.ok(branch.state.flags.has('compact-roll-claim-challenged'));
  assert.equal(branch.state.inventory.count(SOUTH_MEASURE_ITEM_IDS.originalRoll), 1);
  assert.equal(branch.available(residentPlan), true, 'Compact removal can still leave the buried feed available for resident isolation');
  branch.apply(residentPlan);
  assert.ok(branch.state.flags.has('south-measure-plan-isolated-loop'));
}

{
  const branch = makeBranchHarness({ flags: ['tarn-water-help-requested', 'tarn-shared-road-proposed'] });
  const tarnSeal = dialogues.get('south-measure-undercroft-ona-veyl').nodes.preserve.choices.find((choice) => choice.label === 'Let Cassian seal the answering signal');
  branch.apply(tarnSeal);
  const sharedRoad = hall.nodes.tarn.choices.find((choice) => choice.label === 'Take the shared road north with Cassian');
  const campWatch = hall.nodes.tarn.choices.find((choice) => choice.label === 'Keep Cassian on South Measure watch');
  assert.equal(branch.available(sharedRoad), false, 'spending Cassian’s full seal keeps him from leaving immediately');
  assert.equal(branch.available(campWatch), true);
}

async function choose(dialogueId, nodeId, label) {
  const dialogue = dialogues.get(dialogueId) ?? await readJson(`data/dialogue/${dialogueId}.json`);
  dialogues.set(dialogueId, dialogue);
  const node = dialogue.nodes[nodeId];
  assert.ok(node, `${dialogueId} has node ${nodeId}`);
  if (node.effects) runtime.apply(node.effects);
  const choice = (node.choices ?? []).find((entry) => entry.label === label);
  assert.ok(choice, `${dialogueId}:${nodeId} has choice ${label}`);
  assert.equal(meetsDialogueConditions(choice.conditions, conditionState()), true, `${label} is available in the representative playthrough`);
  runtime.apply(choice.effects);
  if (choice.next && dialogue.nodes[choice.next]?.effects) runtime.apply(dialogue.nodes[choice.next].effects);
  return choice.next;
}

await choose('ash-road-south-ressa-venn', 'start', 'Ask what the water court needs');
await choose('ash-road-south-nel-varo', 'start', 'Inspect the throttled flow with her');
await choose('ash-road-south-yara-quell', 'start', 'Hear the Compact terms');
await choose('ash-road-south-daro-mett', 'start', 'Hear the Chain contract');
await choose('ash-road-south-brother-tarn', 'start', 'Ask what he hears beneath the condenser');
await choose('ash-road-south-brother-tarn', 'signal', 'Propose a shared road to Hallowfen');
await choose('ash-road-south-ressa-venn', 'water-roll', 'Offer to trace a resident isolation route');
await choose('ash-road-south-ressa-venn', 'start', 'Report that every offer is known');
await choose('south-measure-annex-holl-varek', 'start', 'Mark the relief return for Noa');
await choose('south-measure-undercroft-ressa-venn', 'start', 'Record the buried pulse on the council board');
await choose('south-measure-undercroft-ona-veyl', 'start', 'Read the roll beside the wicket');
await choose('south-measure-undercroft-ona-veyl', 'prepare', 'Set the restraint frame to Susanna’s intake count');
await choose('south-measure-undercroft-ona-veyl', 'preserve', 'Contain Junia after the preparation');
await choose('south-measure-undercroft-original-roll', 'start', 'Carry the original roll to the council');
await choose('south-measure-undercroft-nel-varo', 'start', 'Choose the isolated resident loop');
await choose('south-measure-rows-ari-veck', 'names', 'Keep the hidden names private');
await choose('south-measure-hall-ressa-venn', 'start', 'Commit the chosen water plan');
await choose('south-measure-hall-ressa-venn', 'operate', 'Open the isolated resident loop');
await choose('south-measure-hall-ressa-venn', 'pump', 'Leave the pump under resident control');
await choose('south-measure-hall-ressa-venn', 'pump-resident', 'Confirm resident control');
await choose('south-measure-hall-ressa-venn', 'roll', 'Keep the original under resident custody');
await choose('south-measure-hall-ressa-venn', 'nel', 'Demand a formal family review');
await choose('south-measure-hall-ressa-venn', 'tarn', 'Take the shared road north with Cassian');
await choose('south-measure-hall-ressa-venn', 'assembly-defaults', 'Return the Morrow ledger untouched');
await choose('south-measure-hall-ressa-venn', 'assembly-defaults', 'Place charity stock with the resident council');
await choose('south-measure-hall-ressa-venn', 'assembly', 'Close the assembly with no further accusation');
await choose('ash-road-south-north-departure', 'start', 'Cross the north chain');

for (const id of SOUTH_MEASURE_QUEST_IDS) assert.equal(questStages.get(id), 'complete', `${id} completes in the representative playthrough`);
for (const flag of [
  'south-measure-plan-isolated-loop', 'south-measure-water-reduced',
  'intake-clerk-contained', 'intake-clerk-resolved', 'south-measure-resident',
  'measure-roll-resident', 'hidden-roll-private', 'nel-family-review',
  'tarn-shared-road', 'morrow-ledger-untouched', 'charity-council',
  'neri-agent-unseen', 'south-measure-north-lane-open', 'departed-south-measure'
]) assert.ok(playState.flags.has(flag), `representative playthrough records ${flag}`);
assert.equal(playState.inventory.count(SOUTH_MEASURE_ITEM_IDS.originalRoll), 0);
assert.equal(playState.inventory.count(SOUTH_MEASURE_ITEM_IDS.certifiedAbstract), 1);
assert.equal(transitionTargets.at(-1)?.path, './data/levels/ash_road_south.json', 'assembly reloads the reactive surface');

const playerText = JSON.stringify([
  [...dialogues.values()], helperLevels, mainQuest,
  ...Object.values(SOUTH_MEASURE_ITEM_IDS).map((id) => itemDefs[id])
]);
assert.equal(playerText.includes('—'), false, 'South Measure player text contains no em dash');
assert.equal(playerText.includes('--'), false, 'South Measure player text contains no doubled dash');

console.log('Ash Road South full plot contract and representative playthrough passed.');
