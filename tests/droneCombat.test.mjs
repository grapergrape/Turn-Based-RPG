import assert from 'node:assert/strict';

import { CombatSystem } from '../src/combat/CombatSystem.js';
import { chooseEnemyTarget } from '../src/combat/EnemyAI.js';
import { createCombatHazard, hazardAffectsActor, HAZARD_TYPES } from '../src/combat/CombatHazards.js';
import { TurnManager } from '../src/combat/TurnManager.js';
import { Game } from '../src/core/Game.js';
import { STEP_DURATION } from '../src/core/game/runtimeConstants.js';
import { gridToScreen } from '../src/render/isoMath.js';
import { StealthRuntime } from '../src/world/StealthRuntime.js';
import { Grid } from '../src/world/Grid.js';
import { SUSPICION_SEVERITY, SUSPICION_STATES } from '../src/world/PerceptionSystem.js';

const grid = new Grid({
  id: 'drone-combat-test',
  name: 'Drone Combat Test',
  width: 8,
  height: 8,
  tileSize: 64,
  tiles: Array.from({ length: 8 }, () => '.'.repeat(8)),
  legend: { '.': { walkable: true } }
});
const enemy = actor('enemy', 'Road Guard', 'enemy', 0, 0, 10, 10);
enemy.attacks = [{ id: 'carbine', apCost: 3, damage: 2, range: 4 }];
const player = actor('player', 'Test Agent', 'player', 2, 0, 10, 5);
const drone = actor('companion', 'Pip', 'player', 2, 1, 8, 4);
let actors = [enemy, player, drone];

assert.equal(chooseEnemyTarget(enemy, [player, drone], grid, actors), player, 'equal distance and health ratio prefer the player');
drone.hp = 2;
assert.equal(chooseEnemyTarget(enemy, [player, drone], grid, actors), drone, 'lower health ratio breaks an equal-distance tie');
player.position = { x: 1, y: 0 };
assert.equal(chooseEnemyTarget(enemy, [player, drone], grid, actors), player, 'nearest reachable target wins before health ratio');
drone.statuses = [{ id: 'taunting', duration: 1 }];
drone.position = { x: 3, y: 1 };
assert.equal(chooseEnemyTarget(enemy, [player, drone], grid, actors), drone, 'a nearby taunting attendant draws preference');

const turns = new TurnManager();
turns.begin([player, drone, enemy]);
assert.equal(turns.current(), player);
assert.equal(turns.endTurn(), drone);
assert.equal(turns.isPlayerTurn(), true);
drone.isDead = true;
assert.equal(turns.endTurn(), enemy, 'a disabled attendant is skipped without ending the encounter');
enemy.isDead = true;
assert.equal(turns.endTurn(), player);
assert.equal(turns.round, 2);

const droneMine = createCombatHazard({
  type: HAZARD_TYPES.TRIP_MINE,
  owner: drone,
  cell: { x: 4, y: 4 },
  damage: 1
});
drone.isDead = false;
enemy.isDead = false;
assert.equal(droneMine.ownerTeam, 'player');
assert.equal(hazardAffectsActor(droneMine, player), false);
assert.equal(hazardAffectsActor(droneMine, drone), false);
assert.equal(hazardAffectsActor(droneMine, enemy), true);

const combat = new CombatSystem();
enemy.isDead = true;
drone.isDead = true;
player.isDead = false;
assert.equal(combat.outcome(player, [enemy]), 'victory', 'an attendant shutdown does not cause defeat');

{
  const followedPlayer = actor('player', 'Test Agent', 'player', 3, 1, 10, 10);
  followedPlayer.pendingSuspicionSeverity = SUSPICION_SEVERITY.MEDIUM;
  const companion = actor('companion', 'Pip', 'player', 1, 1, 8, 8);
  const context = Object.assign(Object.create(Game.prototype), {
    mode: 'explore',
    player: followedPlayer,
    companions: [companion],
    companionFollowMotion: null,
    grid,
    moving: null,
    _isCellHidden: () => false,
    _isOccupied(x, y) {
      return [followedPlayer, companion].some((subject) => subject.x === x && subject.y === y);
    }
  });
  const visibleStart = gridToScreen(companion.x, companion.y);

  assert.equal(context._syncCompanionFollow(), true);
  assert.deepEqual(companion.position, { x: 2, y: 1 }, 'the attendant chooses the nearest open follow cell');
  assert.deepEqual(companion.pxOffset, { x: -32, y: -16 });
  assert.deepEqual(
    {
      x: gridToScreen(companion.x, companion.y).x + companion.pxOffset.x,
      y: gridToScreen(companion.x, companion.y).y + companion.pxOffset.y
    },
    visibleStart,
    'changing the logical cell preserves the attendant visual position'
  );
  assert.equal(companion.render.state, 'walk');
  assert.equal(companion.render.frameIndex, 0);

  assert.equal(context._advanceCompanionFollow(STEP_DURATION / 2), true);
  assert.deepEqual(companion.pxOffset, { x: -16, y: -8 });
  assert.equal(companion.render.frameIndex, 4);

  assert.equal(context._advanceCompanionFollow(STEP_DURATION / 2), false);
  assert.deepEqual(companion.pxOffset, { x: 0, y: 0 });
  assert.equal(companion.render.state, 'idle');
  assert.equal(context.companionFollowMotion, null);

  followedPlayer.moveTo(1, 1);
  companion.moveTo(2, 1);
  const swapVisualStart = gridToScreen(companion.x, companion.y);
  assert.equal(context._makeWayForFriendlyCompanion(followedPlayer, 2, 1), true);
  followedPlayer.moveTo(2, 1);
  assert.deepEqual(companion.position, { x: 1, y: 1 });
  assert.deepEqual(companion.pxOffset, { x: 32, y: 16 });
  assert.deepEqual(
    {
      x: gridToScreen(companion.x, companion.y).x + companion.pxOffset.x,
      y: gridToScreen(companion.x, companion.y).y + companion.pxOffset.y
    },
    swapVisualStart,
    'the attendant also animates when making way for the player'
  );
  assert.equal(context._advanceCompanionFollow(STEP_DURATION), false);
  assert.deepEqual(companion.pxOffset, { x: 0, y: 0 });
}

{
  const companion = actor('companion', 'Pip', 'player', 1, 1, 8, 8);
  const signals = [];
  const context = {
    companionRun: { upgrades: [] },
    droneCombatState: {
      combatSignalPlayed: false,
      pendingAp: new Map(),
      cooldowns: new Map()
    },
    turnManager: { round: 1 },
    _emitCompanionSignal: (subject, signalId) => signals.push([subject.name, signalId]),
    _pulseRelayPylons() {},
    _fireArcSentries() {}
  };
  Game.prototype._onDroneTurnStarted.call(context, companion);
  Game.prototype._onDroneTurnStarted.call(context, companion);
  assert.deepEqual(signals, [['Pip', 'combat']], 'the attendant gives one nonverbal readiness signal per encounter');
}

{
  const companion = actor('companion', 'Pip', 'player', 1, 1, 11, 5);
  const context = {
    companionRun: { upgrades: ['core-redundant-core'] },
    droneCombatState: { redundantCoreSpent: false },
    _pushEffect() {},
    _log() {}
  };
  const protectedHit = Game.prototype._protectCompanionFromLethal.call(context, companion, 5);
  assert.equal(protectedHit, true);
  assert.equal(companion.hp, 5, 'lethal protection leaves damage adjustment to the attack resolver');
  assert.equal(companion.statuses.some((status) => status.id === 'braced'), true);
  assert.equal(Game.prototype._protectCompanionFromLethal.call(context, companion, 5), false, 'redundant core is once per encounter');
}

{
  const watcher = actor('enemy', 'Relief Watcher', 'enemy', 5, 5, 8, 8);
  watcher.tags = ['human'];
  watcher.suspicionState = SUSPICION_STATES.CALM;
  const companion = actor('companion', 'Pip', 'player', 2, 2, 8, 8);
  const messages = [];
  const context = {
    mode: 'explore',
    companionRun: { upgrades: ['veil-ghost-light'] },
    enemies: [watcher],
    grid,
    _activeCompanion: () => companion,
    _isCellHidden: () => false,
    _isHumanLike: () => true,
    _pushEffect() {},
    _log: (message) => messages.push(message)
  };
  assert.equal(Game.prototype._projectDroneGhostLightExplore.call(context, { x: 4, y: 4 }), true);
  assert.equal(watcher.suspicionState, SUSPICION_STATES.INVESTIGATING);
  assert.deepEqual(watcher.investigationTarget, { x: 4, y: 4 });
  assert.equal(messages.length, 1);
}

{
  const companion = actor('companion', 'Pip', 'player', 1, 1, 8, 8);
  const watcher = actor('enemy', 'Gate Watcher', 'enemy', 2, 1, 8, 8);
  watcher.encounter = 'gate-watch';
  const context = {
    mode: 'explore',
    companionRun: { upgrades: ['veil-vanishing-circuit'], vanishingSpentEncounters: [] },
    _activeCompanion: () => companion,
    _resolveEncounterId: (id) => id,
    _pushEffect() {},
    _log() {}
  };
  assert.equal(Game.prototype._consumeDroneDetectionDeferral.call(context, { enemy: watcher, nextState: SUSPICION_STATES.ALERTED }), true);
  assert.deepEqual(context.companionRun.vanishingSpentEncounters, ['gate-watch']);
  assert.equal(Game.prototype._consumeDroneDetectionDeferral.call(context, { enemy: watcher, nextState: SUSPICION_STATES.ALERTED }), false);
}

{
  const watcher = actor('enemy', 'Patrol Clerk', 'enemy', 1, 1, 8, 8);
  watcher.facing = 'se';
  watcher.suspicionState = SUSPICION_STATES.CALM;
  watcher.aggroRadius = 5;
  const observedPlayer = actor('player', 'Test Agent', 'player', 2, 2, 10, 10);
  let deferred = 0;
  let combatStarts = 0;
  const game = {
    mode: 'explore',
    player: observedPlayer,
    enemies: [watcher],
    grid,
    hiddenTiles: new Set(),
    clearedEncounters: new Set(),
    level: {}
  };
  const stealth = new StealthRuntime(game, {
    resolveEncounterId: (id) => id,
    isCellHidden: () => false,
    fieldRating: () => 0,
    enemyPerceptionRating: () => 0,
    faceToward() {},
    deferDetection: ({ nextState }) => {
      if (nextState !== SUSPICION_STATES.ALERTED) return false;
      deferred += 1;
      return true;
    },
    log() {},
    closeUiScreen() {},
    startCombat() { combatStarts += 1; }
  });
  const originalRandom = Math.random;
  Math.random = () => 0.999;
  try {
    stealth.registerSuspiciousAction(SUSPICION_SEVERITY.HIGH, 'movement', { requireSight: true });
  } finally {
    Math.random = originalRandom;
  }
  assert.equal(deferred, 1);
  assert.equal(watcher.suspicionState, SUSPICION_STATES.INVESTIGATING);
  assert.equal(combatStarts, 0);
}

console.log('droneCombat: team turns, target priorities, hazards, shutdown, veil tools, and lethal protection passed.');

function actor(type, name, team, x, y, maxHp, hp) {
  return {
    id: `${type}-${name.toLowerCase().replaceAll(' ', '-')}`,
    type,
    name,
    team,
    control: type === 'companion' ? 'player' : type === 'player' ? 'player' : null,
    position: { x, y },
    maxHp,
    hp,
    maxAp: 5,
    ap: 5,
    moveCost: 1,
    statuses: [],
    isDead: false,
    facing: 'se',
    pxOffset: { x: 0, y: 0 },
    render: { state: 'idle', frameIndex: 0, timer: 0 },
    get x() { return this.position.x; },
    get y() { return this.position.y; },
    moveTo(nextX, nextY) {
      this.position.x = nextX;
      this.position.y = nextY;
    },
    resetAp() { this.ap = this.maxAp; }
  };
}
