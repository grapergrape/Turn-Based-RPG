import assert from 'node:assert/strict';

import { Grid } from '../src/world/Grid.js';
import { evaluateLineOfFire } from '../src/world/CoverSystem.js';

const level = {
  id: 'cover-test',
  name: 'Cover Test',
  width: 6,
  height: 4,
  tileSize: 64,
  tiles: [
    '......',
    '......',
    '......',
    '......'
  ],
  legend: {
    '.': { kind: 'floor', walkable: true }
  }
};

const attack = { id: 'sidearm', name: 'Sidearm', apCost: 4, damage: 5, range: 5 };

{
  const grid = new Grid(level);
  const props = [{ kind: 'rusted-crate', x: 2, y: 1, blocking: true }];
  grid.addBlocked(2, 1);
  const result = evaluateLineOfFire({
    grid,
    props,
    attacker: { position: { x: 0, y: 1 } },
    defender: { position: { x: 3, y: 1 } },
    attack
  });
  assert.equal(result.blocked, false);
  assert.equal(result.cover.level, 'hard');
  assert.equal(result.cover.tag, 'HARD COVER');
}

{
  const grid = new Grid(level);
  const props = [{ kind: 'rusted-crate', x: 2, y: 1, blocking: true }];
  grid.addBlocked(2, 1);
  const result = evaluateLineOfFire({
    grid,
    props,
    attacker: { position: { x: 0, y: 1 } },
    defender: { position: { x: 5, y: 1 } },
    attack
  });
  assert.equal(result.blocked, true);
  assert.equal(result.reason, 'No shot');
}

{
  const grid = new Grid(level);
  const props = [{ kind: 'broken-pew', x: 1, y: 1 }];
  const result = evaluateLineOfFire({
    grid,
    props,
    attacker: { position: { x: 0, y: 0 } },
    defender: { position: { x: 2, y: 1 } },
    attack
  });
  assert.equal(result.blocked, false);
  assert.equal(result.cover.level, 'light');
}

{
  const grid = new Grid(level);
  const result = evaluateLineOfFire({
    grid,
    props: [{ kind: 'chapel-double-door', x: 2, y: 1, blocking: true, opened: true, interact: { type: 'door' } }],
    attacker: { position: { x: 0, y: 1 } },
    defender: { position: { x: 3, y: 1 } },
    attack
  });
  assert.equal(result.blocked, false);
  assert.equal(result.cover.level, 'none');
}
