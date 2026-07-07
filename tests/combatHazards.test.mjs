import assert from 'node:assert/strict';

import {
  HAZARD_TYPES,
  activeHazards,
  createCombatHazard,
  decrementHazardRounds,
  hazardAffectsActor,
  hazardAt,
  hazardOverlayTiles,
  hazardsAtCell
} from '../src/combat/CombatHazards.js';

const owner = { id: 'mara-vey', type: 'player' };
const enemy = { id: 'choir-feral', type: 'enemy', isDead: false, position: { x: 2, y: 2 } };
const player = { id: 'mara-vey', type: 'player', isDead: false, position: { x: 2, y: 2 } };

{
  const hazard = createCombatHazard({
    type: HAZARD_TYPES.TRIP_MINE,
    owner,
    cell: { x: 2, y: 2 },
    damage: 4,
    status: { id: 'snared', duration: 1 }
  });

  assert.equal(hazard.type, 'trip-mine');
  assert.equal(hazard.damage, 4);
  assert.equal(hazardAffectsActor(hazard, enemy), true);
  assert.equal(hazardAffectsActor(hazard, player), false);
  assert.equal(hazardAt([hazard], { x: 2, y: 2 }), hazard);
  assert.deepEqual(hazardsAtCell([hazard], { x: 2, y: 2 }), [hazard]);
}

{
  const hazard = createCombatHazard({
    type: HAZARD_TYPES.BURNING_GROUND,
    owner,
    cell: { x: 3, y: 2 },
    durationRounds: 2
  });
  assert.deepEqual(hazardOverlayTiles([hazard]), [{ key: '3,2', type: 'burning-ground' }]);
  assert.equal(decrementHazardRounds([hazard]).length, 1);
  assert.equal(hazard.durationRounds, 1);
  assert.equal(decrementHazardRounds([hazard]).length, 0);
  assert.deepEqual(activeHazards([hazard]), []);
}

{
  const sealed = createCombatHazard({
    type: HAZARD_TYPES.SEALED_TILE,
    owner,
    cell: { x: 4, y: 2 },
    status: { id: 'sealed', duration: 1 }
  });
  const line = createCombatHazard({
    type: HAZARD_TYPES.QUARANTINE_LINE,
    owner,
    cell: { x: 5, y: 2 },
    status: { id: 'suppressed', duration: 2 }
  });

  assert.equal(sealed.damage, 0);
  assert.equal(line.status.id, 'suppressed');
  assert.deepEqual(hazardOverlayTiles([sealed, line]), [
    { key: '4,2', type: 'sealed-tile' },
    { key: '5,2', type: 'quarantine-line' }
  ]);
}
