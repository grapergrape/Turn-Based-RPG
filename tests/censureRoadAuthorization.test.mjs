import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import { meetsDialogueConditions } from '../src/core/DialogueConditions.js';

async function readJson(path) {
  return JSON.parse(await readFile(new URL(path, import.meta.url), 'utf8'));
}

function choice(node, label) {
  const found = node.choices.find((entry) => entry.label === label);
  assert.ok(found, `${label} choice exists`);
  return found;
}

function effectFlags(entry) {
  return new Set([].concat(entry.effects?.setFlag ?? []));
}

function fieldState(ratings, flags = []) {
  return {
    flags: new Set(flags),
    fieldRating: (field) => ratings[field] ?? 0
  };
}

const voss = await readJson('../data/dialogue/censure-road-camp-voss.json');
const gate = await readJson('../data/dialogue/censure-road-camp-hallowfen-gate.json');
const odran = await readJson('../data/dialogue/censure-road-camp-odran.json');
const confession = await readJson('../data/quests/censure-road-confession.json');

{
  const travel = choice(gate.nodes.start, "Take Aquila's slate to South Measure");
  assert.equal(travel.conditions.flag, 'censure-road-voss-route-cleared');
  assert.equal(travel.effects.loadLevel.path, './data/levels/ash_road_south.json');
  assert.deepEqual(travel.effects.loadLevel.player, { x: 65, y: 77, facing: 'ne' });
}

{
  const perfect = choice(voss.nodes['report-q30'], 'Certified under road seal');
  assert.deepEqual(
    [...effectFlags(perfect)].sort(),
    ['censure-road-voss-report-perfect', 'censure-road-voss-route-cleared']
  );
  for (let question = 1; question <= 30; question += 1) {
    assert.ok(voss.nodes[`report-q${String(question).padStart(2, '0')}`], `Form C-17 question ${question} remains`);
  }
}

{
  const routes = voss.nodes['route-clearance'];
  const doctrine = choice(routes, 'Invoke the failed-bell mandate');
  assert.equal(doctrine.conditions.fieldRatings.doctrine, 45);
  assert.equal(meetsDialogueConditions(doctrine.conditions, fieldState({ doctrine: 44 })), false);
  assert.equal(meetsDialogueConditions(doctrine.conditions, fieldState({ doctrine: 45 })), true);
  assert.equal(effectFlags(doctrine).has('censure-road-voss-route-cleared'), true);

  const evidence = choice(routes, 'Lay out three matched road findings');
  const roadFlags = [
    'long-ash-cart-sabotage-proved',
    'long-ash-kill-site-wounds-read',
    'long-ash-kill-site-no-opening-found',
    'long-ash-old-bell-peal-rule-read',
    'long-ash-route-post-peal-rule-found'
  ];
  assert.equal(evidence.conditions.fieldRatings.search, 45);
  assert.deepEqual(evidence.conditions.flagsAtLeast, { count: 3, of: roadFlags });
  assert.equal(meetsDialogueConditions(evidence.conditions, fieldState({ search: 45 }, roadFlags.slice(0, 2))), false);
  assert.equal(meetsDialogueConditions(evidence.conditions, fieldState({ search: 44 }, roadFlags.slice(0, 3))), false);
  assert.equal(meetsDialogueConditions(evidence.conditions, fieldState({ search: 45 }, roadFlags.slice(0, 3))), true);

  const reports = choice(routes, 'Submit three profession reports');
  assert.equal(reports.conditions.flagsAtLeast.count, 3);
  assert.deepEqual(reports.conditions.flagsAtLeast.of, [
    'censure-road-report-sera-bell',
    'censure-road-report-hanne-medical',
    'censure-road-report-joric-route',
    'censure-road-report-malco-containment',
    'censure-road-report-pell-writ',
    'censure-road-report-runa-stock'
  ]);
  assert.equal(meetsDialogueConditions(reports.conditions, fieldState({}, reports.conditions.flagsAtLeast.of.slice(0, 2))), false);
  assert.equal(meetsDialogueConditions(reports.conditions, fieldState({}, reports.conditions.flagsAtLeast.of.slice(0, 3))), true);

  const command = choice(voss.nodes['route-field-options'], 'Require an operational ruling');
  assert.equal(command.conditions.fieldRatings.command, 55);
  assert.equal(meetsDialogueConditions(command.conditions, fieldState({ command: 54 })), false);
  assert.equal(meetsDialogueConditions(command.conditions, fieldState({ command: 55 })), true);

  const plain = choice(voss.nodes['route-field-options'], 'Give the plain field account');
  assert.equal(plain.conditions, undefined);
  const sign = choice(voss.nodes['route-field-account'], 'Sign the field account');
  assert.equal(sign.conditions.fieldRatings, undefined);
  assert.equal(effectFlags(sign).has('censure-road-voss-route-cleared'), true);
  assert.equal(effectFlags(sign).has('censure-road-voss-route-field-account'), true);
}

{
  const startRoute = choice(odran.nodes['start-open'], 'Seek road absolution');
  assert.equal(startRoute.next, 'absolution-routes');
  const routes = odran.nodes['absolution-routes'];
  const full = choice(routes, 'Give the full road confession');
  assert.equal(full.conditions, undefined);
  assert.equal(full.next, 'confession-begin');

  const routeSpecs = [
    {
      label: 'Invoke service under writ',
      field: 'doctrine',
      dc: 45,
      routeFlag: 'odran-confession-doctrine-route',
      stage: 'absolved-by-doctrine'
    },
    {
      label: 'Trade him a clean field account',
      field: 'speech',
      dc: 45,
      routeFlag: 'odran-confession-speech-route',
      stage: 'absolved-by-account'
    },
    {
      label: 'Bury the fee in a dead-letter line',
      field: 'guile',
      dc: 55,
      routeFlag: 'odran-confession-guile-route',
      stage: 'absolved-by-false-record'
    }
  ];

  for (const spec of routeSpecs) {
    const route = choice(routes, spec.label);
    assert.equal(route.conditions.fieldRatings[spec.field], spec.dc);
    assert.equal(meetsDialogueConditions(route.conditions, fieldState({ [spec.field]: spec.dc - 1 })), false);
    assert.equal(meetsDialogueConditions(route.conditions, fieldState({ [spec.field]: spec.dc })), true);
    assert.equal(effectFlags(route).has('censure-road-confession-absolved'), true);
    assert.equal(effectFlags(route).has(spec.routeFlag), true);
    assert.deepEqual(route.effects.inventory.add, [{ item: 'censure-absolution-chit', count: 1 }]);
    assert.deepEqual(route.effects.questUpdate, { quest: 'censure-road-confession', stage: spec.stage });
    assert.equal(meetsDialogueConditions(
      route.conditions,
      fieldState({ [spec.field]: spec.dc }, ['censure-road-confession-absolved'])
    ), false);
  }

  const guile = choice(routes, 'Bury the fee in a dead-letter line');
  assert.equal(effectFlags(guile).has('odran-confession-false-record-risk'), true);

  const prayerRoute = choice(odran.nodes['price-low'], 'Pray five times');
  assert.deepEqual(prayerRoute.conditions, { itemsMax: { ducat: 0 } });
  assert.equal(effectFlags(prayerRoute).has('censure-road-confession-absolved'), true);
  assert.deepEqual(prayerRoute.effects.inventory.add, [{ item: 'censure-absolution-chit', count: 1 }]);
}

{
  const expectedStages = new Map([
    ['absolved-by-doctrine', { xp: 15, phrase: 'field canon' }],
    ['absolved-by-account', { xp: 15, phrase: 'field account' }],
    ['absolved-by-false-record', { xp: 10, phrase: 'dead-letter' }]
  ]);
  for (const [id, expected] of expectedStages) {
    const stage = confession.stages.find((entry) => entry.id === id);
    assert.ok(stage, `${id} quest stage exists`);
    assert.equal(stage.xp, expected.xp);
    assert.equal(stage.description.includes(expected.phrase), true);
    assert.equal(confession.objectives.some((entry) => entry.stage === id), true);
  }
}

for (const path of [
  '../data/dialogue/censure-road-camp-voss.json',
  '../data/dialogue/censure-road-camp-odran.json',
  '../data/dialogue/censure-road-camp-hallowfen-gate.json',
  '../data/quests/censure-road-confession.json'
]) {
  const source = await readFile(new URL(path, import.meta.url), 'utf8');
  assert.equal(source.includes('—'), false, `${path} has no em dash`);
  assert.equal(source.includes('--'), false, `${path} has no double hyphen`);
}
