import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';

async function readJson(path) {
  return JSON.parse(await readFile(new URL(`../${path}`, import.meta.url), 'utf8'));
}

function asArray(value) {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value : [value];
}

function objectById(level, id) {
  const object = (level.objects ?? []).find((entry) => entry.id === id);
  assert.ok(object, `${level.id} has object ${id}`);
  return object;
}

function methodById(object, source, id) {
  const method = object.interact?.[source]?.methods?.find((entry) => entry.id === id);
  assert.ok(method, `${object.id} has ${source} method ${id}`);
  return method;
}

function choiceEntries(dialogue, file) {
  const entries = [];
  for (const [nodeId, node] of Object.entries(dialogue.nodes ?? {})) {
    for (const [choiceIndex, choice] of (node.choices ?? []).entries()) {
      entries.push({ dialogue, file, nodeId, choiceIndex, choice });
    }
  }
  return entries;
}

function effectSetsFlag(effects, flag) {
  return asArray(effects?.setFlag).includes(flag);
}

function requiredFlags(conditions = {}) {
  return new Set([
    ...asArray(conditions.flag),
    ...asArray(conditions.flags),
    ...asArray(conditions.flagsAtLeast?.of)
  ]);
}

function collectLevelGates(level, file) {
  const gates = [];
  for (const object of level.objects ?? []) {
    for (const source of ['search', 'lock']) {
      for (const method of object.interact?.[source]?.methods ?? []) {
        if (method.field) {
          gates.push({ kind: 'field', rating: method.field, dc: method.dc, file, id: `${object.id}:${method.id}` });
        }
        if (method.primary) {
          gates.push({ kind: 'primary', rating: method.primary, dc: method.dc, file, id: `${object.id}:${method.id}` });
        }
      }
    }
  }
  return gates;
}

function collectDialogueGates(dialogue, file) {
  const gates = [];
  for (const { nodeId, choiceIndex, choice } of choiceEntries(dialogue, file)) {
    for (const [field, dc] of Object.entries(choice.conditions?.fieldRatings ?? {})) {
      gates.push({ kind: 'field', rating: field, dc, file, id: `${nodeId}:${choiceIndex}` });
    }
    for (const [primary, dc] of Object.entries(choice.conditions?.primaryRatings ?? {})) {
      gates.push({ kind: 'primary', rating: primary, dc, file, id: `${nodeId}:${choiceIndex}` });
    }
  }
  return gates;
}

function collectLevelSuccessFlags(level) {
  const flags = new Set();
  for (const object of level.objects ?? []) {
    for (const source of ['search', 'lock']) {
      for (const method of object.interact?.[source]?.methods ?? []) {
        for (const flag of asArray(method.success?.setFlag)) flags.add(flag);
      }
    }
  }
  return flags;
}

function collectDialogueSuccessFlags(entries) {
  const flags = new Set();
  for (const { choice } of entries) {
    for (const flag of asArray(choice.effects?.setFlag)) flags.add(flag);
  }
  return flags;
}

function collectStringViolations(value, path = '$', result = []) {
  if (typeof value === 'string') {
    if (value.includes('—') || value.includes('--')) result.push({ path, value });
    return result;
  }
  if (Array.isArray(value)) {
    value.forEach((entry, index) => collectStringViolations(entry, `${path}[${index}]`, result));
    return result;
  }
  if (value && typeof value === 'object') {
    for (const [key, entry] of Object.entries(value)) {
      collectStringViolations(entry, `${path}.${key}`, result);
    }
  }
  return result;
}

const LONG_LEVEL_FILE = 'data/levels/long_ash_road_approach.json';
const CAMP_LEVEL_FILE = 'data/levels/censure_road_camp.json';
const CAMP_TENT_FILES = [
  'data/levels/censure_road_odran_tent_interior.json',
  'data/levels/censure_road_writ_chapel_tent.json',
  'data/levels/censure_road_preceptor_tent.json',
  'data/levels/censure_road_quartermaster_tent.json',
  'data/levels/censure_road_supply_tent.json',
  'data/levels/censure_road_sutler_tent.json',
  'data/levels/censure_road_medic_tent.json',
  'data/levels/censure_road_quarters_tent.json'
];

const longAsh = await readJson(LONG_LEVEL_FILE);
const camp = await readJson(CAMP_LEVEL_FILE);
const tentEntries = await Promise.all(CAMP_TENT_FILES.map(async (file) => ({ file, level: await readJson(file) })));
const targetLevelEntries = [
  { file: LONG_LEVEL_FILE, level: longAsh },
  { file: CAMP_LEVEL_FILE, level: camp },
  ...tentEntries
];

const targetDialogueIds = new Set(targetLevelEntries.flatMap(({ level }) => level.dialogue ?? []));
const targetDialogueEntries = await Promise.all([...targetDialogueIds].sort().map(async (id) => {
  const file = `data/dialogue/${id}.json`;
  return { id, file, dialogue: await readJson(file) };
}));
const allChoiceEntries = targetDialogueEntries.flatMap(({ dialogue, file }) => choiceEntries(dialogue, file));

{
  const gates = [
    ...targetLevelEntries.flatMap(({ level, file }) => collectLevelGates(level, file)),
    ...targetDialogueEntries.flatMap(({ dialogue, file }) => collectDialogueGates(dialogue, file))
  ];
  assert.ok(gates.length >= 55, 'the combined road slice keeps a substantial set of build checks');

  const scarFields = new Set(['hostSigns', 'containment', 'purgationTools']);
  for (const gate of gates) {
    assert.equal(Number.isInteger(gate.dc), true, `${gate.file} ${gate.id} has an integer threshold`);
    assert.ok(gate.dc > 0, `${gate.file} ${gate.id} has a positive threshold`);
    if (gate.kind === 'primary') {
      assert.ok(gate.dc <= 7, `${gate.file} ${gate.id} is achievable at the creation primary cap`);
    } else {
      const creationMaximum = scarFields.has(gate.rating) ? 68 : 63;
      assert.ok(gate.dc <= creationMaximum, `${gate.file} ${gate.id} is achievable by a legal creation specialist`);
    }
  }

  const fieldDcs = new Set(gates.filter((gate) => gate.kind === 'field').map((gate) => gate.dc));
  for (const dc of [40, 45, 50, 55, 60, 63, 65]) {
    assert.ok(fieldDcs.has(dc), `the combined slice retains the planned ${dc} field tier`);
  }

  const fields = new Set(gates.filter((gate) => gate.kind === 'field').map((gate) => gate.rating));
  for (const field of [
    'command',
    'containment',
    'doctrine',
    'engineering',
    'firearms',
    'guile',
    'hostSigns',
    'medicine',
    'melee',
    'search',
    'security',
    'speech',
    'unarmed'
  ]) {
    assert.ok(fields.has(field), `the combined slice rewards ${field}`);
  }

  for (const primary of ['body', 'eye', 'nerve']) {
    assert.ok(
      gates.some((gate) => gate.kind === 'primary' && gate.rating === primary && gate.dc === 7),
      `the slice keeps an optional max-${primary} creation gate`
    );
  }
}

{
  assert.equal(tentEntries.length, 8, 'all eight camp tent interiors are in the aggregate review');
  for (const { file, level } of tentEntries) {
    const optionalInteractions = (level.objects ?? []).filter((object) => object.interact);
    assert.ok(optionalInteractions.length > 0, `${file} has an optional object interaction`);
    assert.ok(
      optionalInteractions.some((object) => object.interact?.search || object.interact?.lock || object.interact?.type === 'container'),
      `${file} has an optional discovery or loot interaction`
    );
  }
}

{
  const handoffManifest = [
    {
      sourceFlag: 'censure-road-preceptor-route-order-found',
      dialogueId: 'censure-road-camp-voss',
      acknowledgedFlag: 'censure-road-voss-preceptor-order-reported'
    },
    {
      sourceFlag: 'censure-road-preceptor-route-correction-read',
      dialogueId: 'censure-road-camp-voss',
      acknowledgedFlag: 'censure-road-voss-preceptor-correction-reported'
    },
    {
      sourceFlag: 'censure-road-supply-relief-bundle-found',
      dialogueId: 'censure-road-camp-runa',
      acknowledgedFlag: 'censure-road-runa-relief-bundle-reported'
    },
    {
      sourceFlag: 'censure-road-supply-false-stock-mark-found',
      dialogueId: 'censure-road-camp-runa',
      acknowledgedFlag: 'censure-road-runa-stock-mark-reported'
    },
    {
      sourceFlag: 'censure-road-medic-safe-packet-found',
      dialogueId: 'censure-road-camp-hanne',
      acknowledgedFlag: 'censure-road-hanne-safe-packet-reported'
    },
    {
      sourceFlag: 'censure-road-medic-packet-marked-for-malco',
      dialogueId: 'censure-road-camp-malco',
      acknowledgedFlag: 'censure-road-malco-medic-packet-reported'
    },
    {
      sourceFlag: 'censure-road-quarters-coat-cache-found',
      dialogueId: 'censure-road-camp-caldus',
      acknowledgedFlag: 'censure-road-caldus-coat-cache-reported'
    },
    {
      sourceFlag: 'censure-road-sutler-dropped-tally-found',
      dialogueId: 'censure-road-camp-maev',
      acknowledgedFlag: 'censure-road-maev-dropped-tally-reported'
    },
    {
      sourceFlag: 'censure-road-sutler-false-price-mark-found',
      dialogueId: 'censure-road-camp-maev',
      acknowledgedFlag: 'censure-road-maev-price-mark-reported'
    },
    {
      sourceFlag: 'censure-road-writ-chapel-peal-clause-found',
      dialogueId: 'censure-road-camp-sera',
      acknowledgedFlag: 'censure-road-sera-chapel-clause-reported'
    },
    {
      sourceFlag: 'odran-late-visit-suspected',
      dialogueId: 'censure-road-camp-voss',
      acknowledgedFlag: 'censure-road-voss-odran-chest-reported'
    },
    {
      sourceFlag: 'censure-road-odran-chest-linen-found',
      dialogueId: 'censure-road-camp-voss',
      acknowledgedFlag: 'censure-road-voss-odran-chest-reported'
    }
  ];
  const interiorSuccessFlags = new Set(targetLevelEntries.flatMap(({ level }) =>
    [...collectLevelSuccessFlags(level)]
  ));

  assert.equal(
    new Set(handoffManifest.map(({ sourceFlag }) => sourceFlag)).size,
    handoffManifest.length,
    'each promised interior finding appears once in the handoff manifest'
  );
  assert.equal(
    new Set(handoffManifest.map(({ acknowledgedFlag }) => acknowledgedFlag)).size,
    11,
    'the interior findings resolve through eleven one-shot NPC acknowledgments'
  );

  for (const { sourceFlag, dialogueId, acknowledgedFlag } of handoffManifest) {
    assert.ok(interiorSuccessFlags.has(sourceFlag), `${sourceFlag} is produced by a road-slice interior interaction`);
    const consumers = allChoiceEntries.filter(({ dialogue, choice }) =>
      dialogue.id === dialogueId
      && requiredFlags(choice.conditions).has(sourceFlag)
      && effectSetsFlag(choice.effects, acknowledgedFlag)
    );
    assert.equal(consumers.length, 1, `${sourceFlag} reaches ${dialogueId} exactly once`);
    assert.ok(
      asArray(consumers[0].choice.conditions?.flagsAbsent).includes(acknowledgedFlag),
      `${dialogueId} consumes ${sourceFlag} through a one-shot acknowledgment`
    );
  }
}

{
  const itemFiles = (await readdir(new URL('../data/items/', import.meta.url)))
    .filter((file) => file.endsWith('.json'));
  const itemIds = new Set();
  for (const file of itemFiles) itemIds.add((await readJson(`data/items/${file}`)).id);

  const longContainers = (longAsh.objects ?? []).filter((object) => object.interact?.type === 'container');
  const campContainers = [camp, ...tentEntries.map(({ level }) => level)]
    .flatMap((level) => (level.objects ?? []).filter((object) => object.interact?.type === 'container'));
  assert.ok(longContainers.length >= 7, 'Long Ash keeps at least seven authored main-map containers');
  assert.ok(campContainers.length >= 4, 'the camp package keeps at least four authored containers');
  assert.ok(
    longContainers.reduce((sum, object) => sum + object.interact.loot.length, 0) >= 18,
    'Long Ash keeps at least eighteen deterministic loot stacks'
  );
  assert.ok(
    campContainers.reduce((sum, object) => sum + object.interact.loot.length, 0) >= 12,
    'the camp package keeps at least twelve deterministic loot stacks'
  );

  const containers = [...longContainers, ...campContainers];
  const containerIds = containers.map((object) => object.id);
  assert.equal(containerIds.every(Boolean), true, 'every road-slice container has a stable id');
  assert.equal(new Set(containerIds).size, containerIds.length, 'road-slice container ids are globally unique');
  for (const container of containers) {
    assert.ok(container.interact.loot.length > 0, `${container.id} contains authored loot`);
    const seenItems = new Set();
    for (const stack of container.interact.loot) {
      assert.equal(typeof stack.item, 'string', `${container.id} loot has an item id`);
      assert.ok(itemIds.has(stack.item), `${container.id} references existing item ${stack.item}`);
      assert.equal(Number.isInteger(stack.count) && stack.count > 0, true, `${container.id} ${stack.item} has a positive integer count`);
      assert.equal(seenItems.has(stack.item), false, `${container.id} does not split ${stack.item} into duplicate stacks`);
      seenItems.add(stack.item);
    }
  }

  const exteriorIssue = objectById(camp, 'censure-road-quartermaster-sealed-storage-crate-31-30');
  const quartermasterTent = tentEntries.find(({ level }) => level.id === 'censure-road-quartermaster-tent')?.level;
  assert.ok(quartermasterTent, 'the quartermaster tent is loaded');
  const interiorIssue = objectById(quartermasterTent, 'quartermaster-tent-sealed-crate');
  assert.deepEqual(interiorIssue.interact.loot, exteriorIssue.interact.loot, 'both issue locations expose the same single claim');
  for (const issue of [exteriorIssue, interiorIssue]) {
    const claim = methodById(issue, 'lock', 'claim-authorized-field-issue');
    assert.equal(claim.conditions.flag, 'censure-road-field-issue-authorized');
    assert.ok(claim.conditions.flagsAbsent.includes('censure-road-field-issue-claimed'));
    assert.ok(effectSetsFlag(claim.success, 'censure-road-field-issue-claimed'));
  }

  const toolCoffer = objectById(longAsh, 'long-ash-holt-tool-rack');
  const cofferRoutes = toolCoffer.interact.search.methods.filter((method) =>
    effectSetsFlag(method.success, 'long-ash-tool-coffer-opened')
  );
  assert.equal(cofferRoutes.length, 2, 'the Carbo tool coffer keeps two alternative opening routes');
  assert.deepEqual(cofferRoutes[1].success.inventory.add, cofferRoutes[0].success.inventory.add);
  for (const route of cofferRoutes) {
    assert.equal(route.conditions.notFlag, 'long-ash-tool-coffer-opened', `${route.id} cannot duplicate the shared coffer reward`);
  }
}

{
  const vossEntry = targetDialogueEntries.find(({ id }) => id === 'censure-road-camp-voss');
  assert.ok(vossEntry, 'the camp dialogue package includes Preceptor Aquila');
  const voss = vossEntry.dialogue;
  const routeChoices = voss.nodes['route-clearance'].choices;
  const longSuccessFlags = new Set([
    ...collectLevelSuccessFlags(longAsh),
    ...collectDialogueSuccessFlags(allChoiceEntries.filter(({ file }) => file.includes('/long-ash-')))
  ]);

  const evidenceRoute = routeChoices.find((choice) => choice.conditions?.flagsAtLeast?.of?.some((flag) => flag.startsWith('long-ash-')));
  assert.ok(evidenceRoute, 'Aquila accepts a matched Long Ash evidence route');
  assert.equal(evidenceRoute.conditions.flagsAtLeast.count, 3);
  assert.ok(evidenceRoute.conditions.flagsAtLeast.of.length >= 5, 'Aquila can match several distinct road findings');
  assert.equal(evidenceRoute.conditions.fieldRatings.search, 45);
  for (const flag of evidenceRoute.conditions.flagsAtLeast.of) {
    assert.ok(longSuccessFlags.has(flag), `Aquila evidence requirement ${flag} can be produced on Long Ash Road`);
  }
  assert.ok(effectSetsFlag(evidenceRoute.effects, 'censure-road-voss-route-cleared'));

  const reportRoute = routeChoices.find((choice) => choice.conditions?.flagsAtLeast?.of?.every((flag) => flag.startsWith('censure-road-report-')));
  assert.ok(reportRoute, 'Aquila accepts a joined profession-report route');
  assert.equal(reportRoute.conditions.flagsAtLeast.count, 3);
  assert.equal(reportRoute.conditions.flagsAtLeast.of.length, 6);
  assert.ok(effectSetsFlag(reportRoute.effects, 'censure-road-voss-route-cleared'));

  const nonVossChoices = allChoiceEntries.filter(({ file }) => file !== vossEntry.file);
  const campSuccessFlags = collectDialogueSuccessFlags(nonVossChoices);
  for (const flag of reportRoute.conditions.flagsAtLeast.of) {
    assert.ok(campSuccessFlags.has(flag), `camp dialogue can produce Aquila report ${flag}`);
  }

  const longFedReports = new Set();
  for (const entry of nonVossChoices) {
    const reports = asArray(entry.choice.effects?.setFlag).filter((flag) => flag.startsWith('censure-road-report-'));
    if (reports.length === 0) continue;
    const needsLongFinding = [...requiredFlags(entry.choice.conditions)].some((flag) => longSuccessFlags.has(flag));
    if (needsLongFinding) reports.forEach((flag) => longFedReports.add(flag));
  }
  for (const flag of [
    'censure-road-report-sera-bell',
    'censure-road-report-hanne-medical',
    'censure-road-report-joric-route',
    'censure-road-report-malco-containment'
  ]) {
    assert.ok(longFedReports.has(flag), `${flag} is earned by carrying Long Ash evidence to a camp profession`);
  }
}

{
  const voss = targetDialogueEntries.find(({ id }) => id === 'censure-road-camp-voss')?.dialogue;
  const maev = targetDialogueEntries.find(({ id }) => id === 'censure-road-camp-maev')?.dialogue;
  const hallowfenGate = targetDialogueEntries.find(({ id }) => id === 'censure-road-camp-hallowfen-gate')?.dialogue;
  assert.ok(voss && maev && hallowfenGate, 'route clearance, bonus issue, and travel dialogues are loaded');

  const travelChoice = choiceEntries(hallowfenGate, 'hallowfen-gate').find(({ choice }) =>
    choice.effects?.loadLevel?.path === './data/levels/ash_road_south.json'
  )?.choice;
  assert.ok(travelChoice, 'the Hallowfen gate retains onward travel');
  assert.equal(travelChoice.conditions.flag, 'censure-road-voss-route-cleared');
  assert.equal(JSON.stringify(travelChoice.conditions).includes('censure-road-voss-report-perfect'), false);

  const perfectChoice = voss.nodes['report-q30'].choices.find((choice) =>
    effectSetsFlag(choice.effects, 'censure-road-voss-report-perfect')
  );
  assert.ok(perfectChoice, 'a perfect Form C-17 finish records the bonus outcome');
  assert.ok(effectSetsFlag(perfectChoice.effects, 'censure-road-voss-route-cleared'));

  const nonPerfectClearanceChoices = choiceEntries(voss, 'voss').filter(({ choice }) =>
    effectSetsFlag(choice.effects, 'censure-road-voss-route-cleared')
    && !effectSetsFlag(choice.effects, 'censure-road-voss-report-perfect')
  );
  assert.ok(nonPerfectClearanceChoices.length >= 5, 'several non-perfect routes can authorize critical travel');
  assert.ok(
    nonPerfectClearanceChoices.some(({ choice }) => Object.keys(choice.conditions?.fieldRatings ?? {}).length > 0),
    'at least one non-perfect clearance route rewards a field build'
  );
  assert.ok(
    nonPerfectClearanceChoices.some(({ choice }) => Object.keys(choice.conditions?.fieldRatings ?? {}).length === 0),
    'at least one non-perfect clearance route requires no field rating'
  );

  const bonusChoice = choiceEntries(maev, 'maev').find(({ choice }) =>
    requiredFlags(choice.conditions).has('censure-road-voss-report-perfect')
  )?.choice;
  assert.ok(bonusChoice, 'the perfect result unlocks Judith\'s optional issue bundle');
  const bonusNode = maev.nodes[bonusChoice.next];
  assert.ok(
    bonusNode.choices.some((choice) => (choice.effects?.inventory?.add ?? []).length > 0),
    'the perfect route pays a tangible bonus'
  );
}

{
  const odran = targetDialogueEntries.find(({ id }) => id === 'censure-road-camp-odran')?.dialogue;
  assert.ok(odran, 'the camp dialogue package includes Father Augustine');
  const routeChoices = odran.nodes['absolution-routes'].choices;
  const fullConfession = routeChoices.find((choice) => choice.next === 'confession-begin');
  assert.ok(fullConfession, 'Augustine retains the full no-stat confession route');
  assert.equal(fullConfession.conditions?.fieldRatings, undefined);

  const directRoutes = routeChoices.filter((choice) => effectSetsFlag(choice.effects, 'censure-road-confession-absolved'));
  assert.equal(directRoutes.length, 3, 'Augustine has three distinct field-based short absolution routes');
  const directRatings = directRoutes.flatMap((choice) => Object.entries(choice.conditions.fieldRatings));
  assert.deepEqual(directRatings.sort(([a], [b]) => a.localeCompare(b)), [
    ['doctrine', 45],
    ['guile', 55],
    ['speech', 45]
  ]);
  const questStages = new Set();
  for (const choice of directRoutes) {
    assert.ok(
      choice.effects.inventory.add.some((stack) => stack.item === 'censure-absolution-chit' && stack.count === 1),
      `${choice.label} grants the required absolution chit`
    );
    assert.equal(choice.effects.questUpdate.quest, 'censure-road-confession');
    questStages.add(choice.effects.questUpdate.stage);
  }
  assert.equal(questStages.size, directRoutes.length, 'each short absolution route records its own outcome stage');
}

{
  const copyEntries = [...targetLevelEntries.map(({ file, level }) => ({ file, value: level }))];
  for (const entry of targetDialogueEntries) copyEntries.push({ file: entry.file, value: entry.dialogue });
  copyEntries.push({
    file: 'data/quests/censure-road-confession.json',
    value: await readJson('data/quests/censure-road-confession.json')
  });

  const actorIds = new Set(targetLevelEntries.flatMap(({ level }) =>
    (level.spawns?.npcs ?? []).map((spawn) => spawn.actor)
  ));
  for (const actorId of [...actorIds].sort()) {
    const file = `data/actors/${actorId}.json`;
    copyEntries.push({ file, value: await readJson(file) });
  }

  const violations = copyEntries.flatMap(({ file, value }) =>
    collectStringViolations(value).map((violation) => ({ file, ...violation }))
  );
  assert.deepEqual(
    violations,
    [],
    `target player-facing copy contains a prohibited em dash or double hyphen:\n${violations.map(({ file, path }) => `${file} ${path}`).join('\n')}`
  );
}

console.log('Road RPG aggregate regression passed: legal gates, tent interactions, loot, cross-map routes, and target copy.');
