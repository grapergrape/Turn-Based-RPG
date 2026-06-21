import assert from 'node:assert/strict';

import { Grid } from '../src/world/Grid.js';
import {
  isOpenDoorObject,
  linkedObjects,
  openLinkedObjects,
  unlockLinkedObjects
} from '../src/world/DoorSystem.js';

const level = {
  id: 'door-test',
  name: 'Door Test',
  width: 4,
  height: 4,
  tileSize: 64,
  tiles: [
    '....',
    '....',
    '....',
    '....'
  ],
  legend: {
    '.': { kind: 'floor', walkable: true }
  }
};

const north = {
  kind: 'chapel-double-door',
  x: 1,
  y: 1,
  blocking: true,
  doorGroup: 'test-door',
  interact: { type: 'door' }
};
const south = {
  kind: 'chapel-double-door',
  x: 1,
  y: 2,
  blocking: true,
  doorGroup: 'test-door',
  interact: { type: 'door' }
};
const doors = [north, south];
const grid = new Grid(level);
grid.addBlocked(north.x, north.y);
grid.addBlocked(south.x, south.y);

assert.equal(grid.isWalkable(1, 1), false);
assert.equal(grid.isWalkable(1, 2), false);
assert.deepEqual(linkedObjects(north, doors), doors);

unlockLinkedObjects(north, doors);
assert.equal(north.unlocked, true);
assert.equal(south.unlocked, true);
assert.equal(north.opened, undefined);

openLinkedObjects(north, doors, { grid, now: 12 });
assert.equal(isOpenDoorObject(north), true);
assert.equal(isOpenDoorObject(south), true);
assert.equal(north.openedAt, 12);
assert.equal(south.openedAt, 12);
assert.equal(grid.isWalkable(1, 1), true);
assert.equal(grid.isWalkable(1, 2), true);
