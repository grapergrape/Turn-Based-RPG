import assert from 'node:assert/strict';

import { CombatSystem } from '../src/combat/CombatSystem.js';
import { TurnManager } from '../src/combat/TurnManager.js';
import { DialogueEffects } from '../src/core/DialogueEffects.js';
import { Game } from '../src/core/Game.js';
import { Entity } from '../src/entities/Entity.js';
import { Grid } from '../src/world/Grid.js';

function actor({ id, name, type = 'enemy', position, hp, ap, attacks, tags = [] }) {
  return new Entity({
    id,
    name,
    type,
    position,
    stats: { hp, maxHp: hp, actionPoints: ap, moveCost: 1 },
    attacks,
    tags,
    progression: type === 'player' ? { level: 1, build: 'field-agent' } : null
  });
}

function buildCombatRuntime() {
  const level = {
    id: 'stage-iv-ambush-runtime',
    width: 14,
    height: 10,
    tiles: Array.from({ length: 10 }, () => '.'.repeat(14)),
    legend: { '.': { kind: 'floor', walkable: true } },
    props: [
      { kind: 'overturned-field-cart', x: 7, y: 5, blocking: true, cover: 'hard' }
    ],
    combatTriggers: [
      {
        id: 'stage-iv-cart-trigger',
        encounter: 'stage-iv-cart-ambush',
        x: 6,
        y: 5,
        radius: 5,
        dialogue: 'stage-iv-cart-dialogue',
        intro: ['The runners break from cover.']
      }
    ]
  };
  const grid = new Grid(level);
  grid.addBlocked(7, 5);

  const player = actor({
    id: 'mara-vey',
    name: 'Test Agent',
    type: 'player',
    position: { x: 10, y: 5 },
    hp: 14,
    ap: 6,
    attacks: [
      { id: 'melee', name: 'Knife', apCost: 3, damage: 3, range: 1 },
      { id: 'sidearm', name: 'Sidearm', apCost: 4, damage: 5, range: 5 }
    ]
  });
  const lure = actor({
    id: 'stage-iv-lure',
    name: 'Stage IV',
    position: { x: 6, y: 5 },
    hp: 9,
    ap: 5,
    attacks: [{ id: 'prayer-grip', name: 'Prayer Grip', apCost: 3, damage: 2, range: 1 }]
  });
  lure.spawnId = 'stage-iv-lure-spawn';
  lure.encounter = 'stage-iv-cart-ambush';
  lure.dormant = true;
  lure.aggro = [];

  const runnerPositions = [
    { x: 4, y: 2 },
    { x: 7, y: 2 },
    { x: 2, y: 5 },
    { x: 11, y: 8 }
  ];
  const runners = runnerPositions.map((position, index) => {
    const runner = actor({
      id: 'stage-iv-runner',
      name: 'Stage IV Runner',
      position,
      hp: 4,
      ap: 7,
      attacks: [{ id: 'rushing-rake', name: 'Rushing Rake', apCost: 4, damage: 2, range: 1 }],
      tags: ['runner']
    });
    runner.spawnId = `stage-iv-runner-${index + 1}`;
    runner.encounter = 'stage-iv-cart-ambush';
    runner.dormant = true;
    runner.aggro = [];
    return runner;
  });

  let weaponWear = 0;
  const game = Object.create(Game.prototype);
  Object.assign(game, {
    player,
    enemies: [lure, ...runners],
    npcs: [],
    level,
    grid,
    hiddenTiles: new Set(),
    combat: new CombatSystem(),
    turnManager: new TurnManager(),
    inventory: {
      weaponAttacks: (baseAttacks) => baseAttacks.map((attack) => ({ ...attack })),
      degradeWeaponAttack: (_attack, amount) => {
        weaponWear += amount;
        return false;
      }
    },
    mode: 'explore',
    activeEncounter: null,
    pathQueue: [{ x: 9, y: 5 }],
    pendingExploreTarget: { x: 9, y: 5 },
    preCombatTarget: lure,
    selectedAttackId: 'melee',
    effects: [],
    log: [],
    clearedEncounters: new Set(),
    appliedLevelEvents: new Set(),
    flags: new Set(),
    inventoryOrder: [],
    combatHazards: [],
    enemyActions: null,
    enemyActor: null
  });
  return { game, lure, runners, weaponWear: () => weaponWear };
}

{
  const calls = [];
  const openingAttack = {
    target: 'stage-iv-lure-spawn',
    attackId: 'sidearm',
    guaranteedHit: true,
    spendAp: false,
    failureLog: 'The sidearm is not ready.'
  };
  const game = { flags: new Set() };
  const effects = new DialogueEffects(game, {
    syncFlagConditionalObjects: () => calls.push('sync'),
    closeUiScreen: () => calls.push('close'),
    startCombat: (encounter, options) => calls.push({ encounter, options })
  });
  effects.apply({
    setFlag: 'stage-iv-cart-sprung',
    startCombat: {
      encounter: 'stage-iv-cart-ambush',
      openingAttack
    }
  });

  assert.equal(game.flags.has('stage-iv-cart-sprung'), true);
  assert.deepEqual(calls, [
    'sync',
    'close',
    {
      encounter: 'stage-iv-cart-ambush',
      options: { fromAltar: false, openingAttack }
    }
  ]);
  assert.notEqual(calls[2].options.openingAttack, openingAttack, 'dialogue effects clone the authored opening attack');
}

{
  const { game } = buildCombatRuntime();
  let openedDialogue = null;
  game._openDialogueById = (dialogueId) => {
    openedDialogue = dialogueId;
  };

  assert.deepEqual(game.actors, [game.player], 'dormant ambushers are absent from exploration actors');
  assert.deepEqual(game._livingEnemies(), [], 'dormant ambushers cannot be targeted before the trap');
  game._checkCombatProximity();
  assert.equal(openedDialogue, 'stage-iv-cart-dialogue');
  assert.equal(game.level.combatTriggers[0].dialogueSeen, true);
  assert.deepEqual(game.pathQueue, []);
  assert.equal(game.pendingExploreTarget, null);
  assert.equal(game.preCombatTarget, null);
  assert.equal(game.mode, 'explore', 'the proximity trigger waits for the mandatory dialogue choice');
  assert.equal(game.enemies.every((enemy) => enemy.dormant), true);
}

{
  const { game, lure, runners, weaponWear } = buildCombatRuntime();
  const apBefore = game.player.ap;
  game._startCombat('stage-iv-cart-ambush', {
    openingAttack: {
      target: 'stage-iv-lure-spawn',
      attackId: 'sidearm',
      guaranteedHit: true,
      spendAp: false,
      failureLog: 'The sidearm is not ready.'
    }
  });

  assert.equal(game.mode, 'combat');
  assert.equal(game.activeEncounter, 'stage-iv-cart-ambush');
  assert.equal(game.enemies.every((enemy) => !enemy.dormant), true, 'combat wakes every dormant enemy in the encounter');
  assert.equal(game.actors.length, 6, 'the player and all five Stage IVs enter the actor list');
  assert.equal(game.turnManager.order.length, 6);
  assert.equal(game.turnManager.current(), game.player, 'the free shot does not consume the player turn');
  assert.equal(game.player.ap, apBefore, 'the guaranteed opening shot spends no AP');
  assert.equal(lure.hp, 4, 'the sidearm deals its normal five damage to the nine-HP lure');
  assert.equal(lure.isDead, false);
  assert.equal(runners.every((runner) => runner.hp === 4), true);
  assert.equal(weaponWear(), 1, 'the free shot still wears the equipped sidearm');
  assert.equal(game.effects.at(-1)?.text, '-5');
  assert.equal(game.log.some((line) => line.includes('5 damage to Stage IV.')), true);

  game.moving = { actor: runners[0] };
  assert.equal(game._stepDurationForState('walk'), 0.38, 'runner-tagged enemies use the combat sprint cadence');
}

{
  const { game, lure, weaponWear } = buildCombatRuntime();
  game.player.baseAttacks = game.player.baseAttacks.filter((attack) => attack.id !== 'sidearm');
  game.player.attacks = game.player.attacks.filter((attack) => attack.id !== 'sidearm');
  game._startCombat('stage-iv-cart-ambush', {
    openingAttack: {
      target: 'stage-iv-lure-spawn',
      attackId: 'sidearm',
      guaranteedHit: true,
      spendAp: false,
      failureLog: 'The sidearm is not ready. The old woman rises.'
    }
  });

  assert.equal(game.mode, 'combat', 'a missing sidearm never prevents the encounter');
  assert.equal(game.selectedAttackId, 'melee', 'the normal available attack remains selected');
  assert.equal(lure.hp, 9);
  assert.equal(weaponWear(), 0);
  assert.equal(game.log.includes('The sidearm is not ready. The old woman rises.'), true);
}
