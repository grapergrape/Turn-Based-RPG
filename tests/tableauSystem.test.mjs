import assert from 'node:assert/strict';

import { Grid } from '../src/world/Grid.js';
import { TableauSystem } from '../src/world/TableauSystem.js';

const map = {
  id: 'tableau-runtime-test',
  name: 'Tableau Runtime Test',
  width: 8,
  height: 5,
  tileSize: 64,
  tiles: Array(5).fill('.'.repeat(8)),
  legend: { '.': { kind: 'floor', walkable: true } }
};

function actor(id, y) {
  return {
    id,
    spawnId: id,
    position: { x: 1, y },
    facing: 'se',
    render: { state: 'idle', frameIndex: 0, timer: 0 },
    speech: null,
    isDead: false,
    removed: false,
    dormant: false
  };
}

const actors = [actor('worker-a', 1), actor('worker-b', 2), actor('worker-c', 3)];
const game = {
  mode: 'explore',
  uiScreen: null,
  player: { position: { x: 4, y: 2 } },
  npcs: actors,
  enemies: [],
  get actors() { return [...this.npcs, ...this.enemies]; },
  grid: new Grid(map)
};
const started = new Set();
const finished = new Set();
const progress = new Map();
let system = null;

system = new TableauSystem(game, {
  occupiedSet(activeActor) {
    const cells = new Set(
      actors
        .filter((candidate) => candidate !== activeActor)
        .map((candidate) => `${candidate.position.x},${candidate.position.y}`)
    );
    system.addReservedCells(cells, activeActor);
    return cells;
  },
  tryStep(activeActor, delta) {
    const x = activeActor.position.x + delta.x;
    const y = activeActor.position.y + delta.y;
    if (!game.grid.isWalkable(x, y)) return false;
    if (actors.some((candidate) => candidate !== activeActor && candidate.position.x === x && candidate.position.y === y)) {
      return false;
    }
    activeActor.position = { x, y };
    return true;
  },
  isActorMoving: () => false,
  startActivity(activeActor) {
    started.add(activeActor.id);
    return true;
  },
  updateActivity(activeActor, _activity, value) {
    progress.set(activeActor.id, Math.max(progress.get(activeActor.id) ?? 0, value));
  },
  finishActivity(activeActor) {
    finished.add(activeActor.id);
  },
  cancelMovement() {},
  cancelPatrolActivity() {}
});

system.setTableaux([{
  id: 'three-worker-handoff',
  center: { x: 4, y: 2 },
  activationRadius: 10,
  startDelay: 0,
  cooldown: { min: 30, max: 30 },
  participants: actors.map((entry, index) => ({
    actor: entry.id,
    slot: { x: 4, y: index + 1 },
    delay: index * 0.2,
    activity: { target: 'test-load', duration: 0.8, motion: 'lift', response: 'load' }
  })),
  barks: [{ at: 0.2, actor: 'worker-b', text: 'Ready.' }]
}]);

for (let tick = 0; tick < 80 && system.states[0].cycle === 0; tick += 1) {
  system.advanceExplore(0.5);
}

assert.equal(system.states[0].cycle, 1, 'the three-person scene gathers, performs, and returns');
assert.equal(system.states[0].active, null);
assert.equal(system.states[0].timer, 30, 'the finished scene enters its deterministic cooldown');
assert.deepEqual([...started].sort(), actors.map((entry) => entry.id).sort());
assert.deepEqual([...finished].sort(), actors.map((entry) => entry.id).sort());
assert.equal([...progress.values()].every((value) => value === 1), true, 'all work motions reach their final frame');
assert.equal(system.reservations.size, 0, 'all work cells are released after the scene');
for (const [index, entry] of actors.entries()) {
  assert.deepEqual(entry.position, { x: 1, y: index + 1 }, `${entry.id} returns to its authored home`);
  assert.equal(entry.tableauReservation, null);
  assert.equal(entry.render.state, 'idle');
}

system.states[0].timer = 0;
system.advanceExplore(0);
assert.ok(system.states[0].active, 'a second scene can reserve its participants');
game.uiScreen = 'inventory';
system.advanceExplore(0.1);
assert.equal(system.states[0].active, null, 'opening a blocking screen cancels the gathering safely');
assert.equal(system.reservations.size, 0);
assert.equal(actors.every((entry) => entry.tableauReservation === null), true);

console.log('tableauSystem: gather, staggered work, return, cooldown, and interruption passed.');
