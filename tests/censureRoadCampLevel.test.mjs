import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import { meetsDialogueConditions } from '../src/core/DialogueConditions.js';
import { getSprite } from '../src/render/spriteCatalog.js';
import { Grid } from '../src/world/Grid.js';
import { isTargetInReach, resolveInteractionTargetAtCell } from '../src/world/InteractionTargeting.js';
import { SECURITY_TOOL_ITEM, lockMethodStatus } from '../src/world/LockSystem.js';
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

function objectById(level, id) {
  const object = level.objects.find((entry) => entry.id === id);
  assert.ok(object, `${id} exists`);
  return object;
}

function interactionTarget(level, grid, object, player) {
  return resolveInteractionTargetAtCell({
    cell: { x: object.x, y: object.y },
    grid,
    player: { position: player },
    actors: [],
    enemies: [],
    interactables: level.objects.filter((entry) => entry.interact),
    mode: 'explore'
  });
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
const brunaDialogue = await readJson('../data/dialogue/censure-road-camp-widow-bruna.json');
const maevActor = await readJson('../data/actors/censure-sutler-maev.json');
const maevDialogue = await readJson('../data/dialogue/censure-road-camp-maev.json');
const confessionQuest = await readJson('../data/quests/censure-road-confession.json');
const absolutionChit = await readJson('../data/items/censure-absolution-chit.json');
const campRibguard = await readJson('../data/items/camp-issue-ribguard.json');

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
    'censure-road-writ-chapel-west',
    'censure-road-odran-private-tent',
    'censure-road-confession-screen',
    'censure-road-bell-mast',
    'censure-road-preceptor-tent',
    'censure-road-drill-yard-chalk',
    'censure-road-quartermaster-table',
    'censure-road-supply-tent-38-32',
    'censure-road-sutler-cart',
    'censure-road-evidence-shed-door',
    'censure-road-medic-tent',
    'censure-road-cult-breaker-tent-13-36',
    'censure-road-writ-board',
    'censure-road-tether-line',
    'censure-road-ash-latrines',
    'censure-road-water-barrel-45'
  ];
  for (const id of requiredSites) objectById(level, id);
  assert.ok(level.objects.filter((object) => object.kind === 'farm-fence' && object.blocking).length >= 180, 'camp walls are fenced around the playable area');
  assert.ok(level.objects.filter((object) => object.kind === 'canvas-tent' && object.blocking).length >= 10, 'camp uses tents for work and quarters');
  assert.equal(objectById(level, 'censure-road-evidence-shed-door').variant, 'storage-shed');
  assert.equal(level.legend.S.kind, 'storage-shed-building-block', 'evidence shed uses the existing storage shed block');
}

{
  const privateTent = objectById(level, 'censure-road-odran-private-tent');
  assert.equal(privateTent.interact?.type, 'note');
  assert.equal(privateTent.interact?.lock?.methods?.[0]?.field, 'security');
  assert.equal(privateTent.interact.lock.methods[0].dc, 55);
  const lockMethod = privateTent.interact.lock.methods[0];
  assert.deepEqual(
    lockMethodStatus(lockMethod, {
      inventory: { has: () => false },
      fieldRating: () => 80
    }).requiredItem,
    SECURITY_TOOL_ITEM,
    'Odran tent Security method still requires an entry roll'
  );
  assert.equal(lockMethodStatus(lockMethod, {
    inventory: { has: (itemId) => itemId === SECURITY_TOOL_ITEM },
    fieldRating: () => 54
  }).success, false);
  assert.equal(lockMethodStatus(lockMethod, {
    inventory: { has: (itemId) => itemId === SECURITY_TOOL_ITEM },
    fieldRating: () => 55
  }).success, true);

  const evidenceMethod = privateTent.interact.search.methods[0];
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
  assert.equal(evidenceMethod.success.setFlag, 'odran-late-visit-suspected');
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
  assert.equal(
    hallowfenGate.nodes.start.choices.some((choice) => choice.effects?.loadLevel),
    false,
    'Hallowfen checkpoint exit is present but not unlocked in this demo map'
  );
}

{
  assert.deepEqual(maevActor.trade.stock.map((entry) => entry.item), [
    'field-dressing',
    'tinned-beans',
    'relic-rounds',
    'censure-entry-roll',
    'camp-issue-ribguard',
    'ash-road-boots'
  ]);
  assert.equal(campRibguard.equipment.slot, 'armor');
  assert.equal(campRibguard.groundModel, 'ribguard');
  const tradeChoice = maevDialogue.nodes.start.choices.find((choice) => choice.effects?.trade);
  assert.ok(tradeChoice, 'Maev dialogue has a trade choice');
  assert.equal(tradeChoice.effects.trade, 'censure-sutler-maev');
}

{
  const rumorChoice = pellDialogue.nodes.start.choices.find((choice) => choice.next === 'last-bell');
  assert.ok(rumorChoice, 'Pell can seed the optional Odran rumor');
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
  assert.ok(brunaOdranChoice, 'Bruna has a post-observation Odran branch');
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
  assert.ok(confrontationChoice, 'Odran can be confronted after the late visit is observed');
  assert.equal(meetsDialogueConditions(confrontationChoice.conditions, {
    flags: new Set(['odran-late-visit-seen'])
  }), true);
  assert.equal(meetsDialogueConditions(confrontationChoice.conditions, {
    flags: new Set(['odran-late-visit-seen', 'odran-late-visit-resolved'])
  }), false);

  const settleChoice = odranDialogue.nodes['record-summary'].choices.find((choice) => choice.next === 'price');
  assert.ok(settleChoice, 'Odran confession reaches the payment screen');
  assert.deepEqual(settleChoice.effects.questUpdate, {
    quest: 'censure-road-confession',
    stage: 'record-read'
  });

  const payChoice = odranDialogue.nodes.price.choices.find((choice) => choice.label === 'Pay 5 ducats');
  assert.ok(payChoice, 'Odran has a normal five ducat payment option');
  assert.equal(meetsDialogueConditions(payChoice.conditions, { itemCount: (id) => (id === 'ducat' ? 5 : 0) }), true);
  assert.equal(meetsDialogueConditions(payChoice.conditions, { itemCount: (id) => (id === 'ducat' ? 4 : 0) }), false);
  assert.equal(payChoice.effects.inventory.requireAll, true);
  assert.deepEqual(payChoice.effects.inventory.remove, [
    { item: 'ducat', count: 5, failLog: 'Father Odran waits for the fifth ducat that is not there.' }
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
  assert.ok(noCoinPrayer, 'Odran has a no-money prayer route');
  assert.equal(meetsDialogueConditions(noCoinPrayer.conditions, { itemCount: (id) => (id === 'ducat' ? 0 : 0) }), true);
  assert.equal(meetsDialogueConditions(noCoinPrayer.conditions, { itemCount: (id) => (id === 'ducat' ? 1 : 0) }), false);

  const lieChoice = odranDialogue.nodes.price.choices.find((choice) => choice.label === 'Lie that your purse is empty');
  assert.ok(lieChoice, 'Odran has a lying route');
  assert.equal(lieChoice.next, 'lie-caught-rich');
  assert.equal(meetsDialogueConditions(lieChoice.conditions, { itemCount: (id) => (id === 'ducat' ? 1 : 0) }), true);
  assert.equal(meetsDialogueConditions(lieChoice.conditions, { itemCount: (id) => (id === 'ducat' ? 0 : 0) }), false);

  const lieTax = odranDialogue.nodes['lie-caught-rich'].choices.find((choice) => choice.label === 'Pay 6 ducats');
  assert.ok(lieTax, 'Odran charges a six ducat lie tax when the player can pay it');
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
  assert.ok(blackmail, 'Odran blackmail route pays silence money');
  assert.deepEqual(blackmail.effects.setFlag, ['odran-late-visit-resolved', 'odran-silence-money-taken']);
  assert.deepEqual(blackmail.effects.inventory.add, [{ item: 'ducat', count: 8 }]);
  const askBruna = odranDialogue.nodes['late-visit-confront'].choices.find((choice) => choice.label === 'Ask Bruna first');
  assert.ok(askBruna, 'Odran confrontation can defer to Bruna');
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
