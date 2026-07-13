import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);

async function json(path) {
  return JSON.parse(await readFile(new URL(path, root), 'utf8'));
}

function flagsFrom(effects = {}) {
  return new Set([].concat(effects.setFlag ?? []));
}

function choice(node, label) {
  const found = node.choices.find((entry) => entry.label === label);
  assert.ok(found, `Missing choice: ${label}`);
  return found;
}

test('chapel quest and item records preserve the locked plan', async () => {
  const quest = await json('data/quests/those-who-heard-the-bell.json');
  assert.equal(quest.initialStage, 'investigate-chapels');
  assert.deepEqual(quest.stages.map((stage) => [stage.id, stage.xp ?? 0]), [
    ['investigate-chapels', 0],
    ['judge-vigil', 50],
    ['complete', 50]
  ]);

  const expectedItems = new Map([
    ['gravekeeper-brass-key', 0.1],
    ['book-of-kept-names', 0.2],
    ['mortuary-examination-docket', 0.2],
    ['mortuary-quieting-salt', 0.1],
    ['keepers-vigil-cord', 0.1],
    ['road-purgation-writ', 0],
    ['calibrated-listening-pin', 0.1]
  ]);
  for (const [id, weight] of expectedItems) {
    const item = await json(`data/items/${id}.json`);
    assert.equal(item.id, id);
    assert.equal(item.weight, weight);
  }
});

test('either document order joins the truth and advances the quest', async () => {
  const book = await json('data/dialogue/long-ash-book-of-kept-names.json');
  const docket = await json('data/dialogue/long-ash-mortuary-docket.json');
  const bookJoin = choice(book.nodes['entries-intact'], "Set Hessa's record beside the docket");
  const docketJoin = choice(docket.nodes.start, "Set the docket beside Hessa's names");

  for (const route of [bookJoin, docketJoin]) {
    assert.equal(flagsFrom(route.effects).has('heard-bell-truth-joined'), true);
    assert.deepEqual(route.effects.questUpdate, {
      quest: 'those-who-heard-the-bell',
      stage: 'judge-vigil',
      log: 'Quest updated: find Sava Rell and decide what remains.'
    });
  }
});

test('the listening test keeps the third strike and quiet routes distinct', async () => {
  const dialogue = await json('data/dialogue/long-ash-listening-test.json');
  const first = choice(dialogue.nodes['test-menu'], 'Strike the frame once');
  const second = choice(dialogue.nodes['test-menu'], 'Strike a second time');
  const third = choice(dialogue.nodes['test-menu'], 'Strike a third time');

  assert.deepEqual([...flagsFrom(first.effects)], ['heard-bell-test-first']);
  assert.deepEqual([...flagsFrom(second.effects)], ['heard-bell-test-second']);
  assert.deepEqual([...flagsFrom(third.effects)], [
    'heard-bell-test-third',
    'heard-bell-sava-thawing'
  ]);
  assert.equal(third.effects.startCombat, undefined);
  assert.equal(third.effects.openDoorGroup, undefined);

  for (const route of dialogue.nodes['quiet-menu'].choices.slice(0, 4)) {
    assert.equal(flagsFrom(route.effects).has('heard-bell-sava-quieted'), true);
    assert.equal(route.effects.startCombat, undefined);
  }
});

test('breaking a completed quieting requires a warning before Sava opens', async () => {
  const dialogue = await json('data/dialogue/long-ash-sava-niche.json');
  const warningRoute = choice(dialogue.nodes.quieted, 'Undo the quieting and open the niche');
  assert.equal(warningRoute.next, 'break-quiet-warning');
  assert.equal(warningRoute.effects, undefined);

  const confirm = choice(dialogue.nodes['break-quiet-warning'], 'Release the pins and face Sava');
  assert.equal(confirm.effects.openDoorGroup, 'sava-listening-niche');
  assert.equal(confirm.effects.startCombat, 'sava-listening-niche');
  assert.equal(flagsFrom(confirm.effects).has('heard-bell-sava-found'), true);
  assert.equal(flagsFrom(confirm.effects).has('heard-bell-sava-thawing'), true);
});

test('every completed judgment sets exactly one outcome flag', async () => {
  const dialogue = await json('data/dialogue/long-ash-heard-bell-judgment.json');
  assert.deepEqual(dialogue.nodes.start.conditions.flags, [
    'heard-bell-truth-joined',
    'heard-bell-sava-found'
  ]);
  const outcomeFlags = [
    'heard-bell-resolved-vigil',
    'heard-bell-resolved-censure',
    'heard-bell-resolved-evidence'
  ];
  const finalChoices = [
    choice(dialogue.nodes.living, 'Keep the vigil and restore the names'),
    choice(dialogue.nodes.living, 'Take both records as evidence'),
    choice(dialogue.nodes.killed, 'Keep the vigil and restore the names'),
    choice(dialogue.nodes.killed, 'File censure on the graveyard'),
    choice(dialogue.nodes.killed, 'Take both records as evidence')
  ];

  for (const route of finalChoices) {
    const flags = flagsFrom(route.effects);
    assert.equal(flags.has('heard-bell-resolved'), true);
    assert.equal(outcomeFlags.filter((flag) => flags.has(flag)).length, 1);
    assert.equal(route.effects.questUpdate.stage, 'complete');
  }

  const livingVigil = choice(dialogue.nodes.living, 'Keep the vigil and restore the names');
  assert.equal(flagsFrom(livingVigil.effects).has('heard-bell-sava-quieted'), true);
  assert.equal(flagsFrom(livingVigil.effects).has('heard-bell-sava-resealed'), true);

  const liveCensure = choice(dialogue.nodes.living, 'Perform censure and destroy Sava');
  assert.equal(flagsFrom(liveCensure.effects).has('heard-bell-resolved'), false);
  assert.equal(liveCensure.effects.openDoorGroup, 'sava-listening-niche');
  assert.equal(liveCensure.effects.startCombat, 'sava-listening-niche');

  for (const nodeId of ['living', 'killed']) {
    const evidence = choice(dialogue.nodes[nodeId], 'Take both records as evidence');
    assert.deepEqual(evidence.effects.inventory.add, [
      { item: 'book-of-kept-names', count: 1 },
      { item: 'mortuary-examination-docket', count: 1 }
    ]);
  }
});

test('the reachable censure reward is acknowledged and claim-gated', async () => {
  const voss = await json('data/dialogue/censure-road-camp-voss.json');
  const maev = await json('data/dialogue/censure-road-camp-maev.json');
  const acknowledge = choice(voss.nodes['heard-bell-censure-report'], 'Leave the report with Voss');
  assert.equal(acknowledge.effects.setFlag, 'heard-bell-censure-report-acknowledged');

  const rewardEntry = choice(maev.nodes.start, 'Collect the graveyard censure bundle');
  assert.deepEqual(rewardEntry.conditions.flags, [
    'heard-bell-resolved-censure',
    'heard-bell-censure-report-filed',
    'heard-bell-censure-report-acknowledged'
  ]);
  assert.deepEqual(rewardEntry.conditions.flagsAbsent, ['heard-bell-censure-reward-claimed']);

  const reward = choice(maev.nodes['heard-bell-censure-reward'], 'Take the censure bundle');
  assert.equal(reward.effects.setFlag, 'heard-bell-censure-reward-claimed');
  assert.deepEqual(reward.effects.inventory.add, [
    { item: 'road-purgation-writ', count: 1 },
    { item: 'relic-rounds', count: 3 },
    { item: 'field-dressing', count: 1 },
    { item: 'ducat', count: 10 }
  ]);
});

test('the graveyard mouth only returns to an opened vault shortcut', async () => {
  const dialogue = await json('data/dialogue/long-ash-listening-shortcut-return.json');
  assert.equal(dialogue.nodes.start.conditions.flag, 'heard-bell-catacomb-mouth-opened');
  assert.equal(dialogue.nodes.start.else, 'sealed');
  const enter = choice(dialogue.nodes.start, 'Crawl into the Listening Vault');
  assert.deepEqual(enter.effects.loadLevel, {
    path: './data/levels/long_ash_listening_vault.json',
    player: { x: 11, y: 10 }
  });
  assert.equal(dialogue.nodes.sealed.choices[0].effects, undefined);
});

test('new chapel player text contains no doubled or em dash', async () => {
  const paths = [
    'data/quests/those-who-heard-the-bell.json',
    'data/items/gravekeeper-brass-key.json',
    'data/items/book-of-kept-names.json',
    'data/items/mortuary-examination-docket.json',
    'data/items/mortuary-quieting-salt.json',
    'data/items/keepers-vigil-cord.json',
    'data/items/road-purgation-writ.json',
    'data/items/calibrated-listening-pin.json',
    'data/dialogue/long-ash-vigil-chapel-entry.json',
    'data/dialogue/long-ash-vigil-chapel-exit.json',
    'data/dialogue/long-ash-vigil-panel.json',
    'data/dialogue/long-ash-book-of-kept-names.json',
    'data/dialogue/long-ash-vigil-name-rack.json',
    'data/dialogue/long-ash-mortuary-chapel-entry.json',
    'data/dialogue/long-ash-mortuary-chapel-exit.json',
    'data/dialogue/long-ash-mortuary-tags.json',
    'data/dialogue/long-ash-mortuary-stair.json',
    'data/dialogue/long-ash-mortuary-docket.json',
    'data/dialogue/long-ash-listening-test.json',
    'data/dialogue/long-ash-sava-niche.json',
    'data/dialogue/long-ash-heard-bell-judgment.json',
    'data/dialogue/long-ash-vigil-dusk-watch.json',
    'data/dialogue/long-ash-listening-shortcut.json',
    'data/dialogue/long-ash-listening-shortcut-return.json'
  ];
  for (const path of paths) {
    const text = await readFile(new URL(path, root), 'utf8');
    assert.equal(text.includes(String.fromCodePoint(0x2014)), false, `${path} contains an em dash`);
    assert.equal(text.includes(String.fromCodePoint(45, 45)), false, `${path} contains a doubled hyphen`);
  }
});
