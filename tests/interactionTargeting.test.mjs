import assert from 'node:assert/strict';

import {
  isTargetInReach,
  resolveInteractionTargetAtCell
} from '../src/world/InteractionTargeting.js';

function grid({ blocked = [] } = {}) {
  const blockedCells = new Set(blocked);
  return {
    isInside: (x, y) => x >= 0 && y >= 0 && x < 8 && y < 8,
    isWalkable: (x, y) => !blockedCells.has(`${x},${y}`)
  };
}

const player = { name: 'Mara Vey', x: 2, y: 2, position: { x: 2, y: 2 } };

{
  const npc = { name: 'Selka', x: 4, y: 2, position: { x: 4, y: 2 }, dialogue: 'selka', dialogueRepeat: true };
  const object = { kind: 'paper-scraps', x: 3, y: 2, interact: { type: 'note' } };
  const target = resolveInteractionTargetAtCell({
    cell: { x: 3, y: 2 },
    grid: grid(),
    player,
    actors: [player, npc],
    interactables: [object]
  });
  assert.equal(target.type, 'object');
  assert.equal(target.object, object);
}

{
  const npc = { name: 'Selka', x: 3, y: 2, position: { x: 3, y: 2 }, dialogue: 'selka', dialogueRepeat: true };
  const object = { kind: 'paper-scraps', x: 3, y: 2, interact: { type: 'note' } };
  const target = resolveInteractionTargetAtCell({
    cell: { x: 3, y: 2 },
    grid: grid(),
    player,
    actors: [player, npc],
    interactables: [object]
  });
  assert.equal(target.type, 'talk');
  assert.equal(target.actor, npc);
}

{
  const object = { kind: 'rusted-reliquary', x: 3, y: 3, consumed: true, interact: { type: 'container' } };
  const target = resolveInteractionTargetAtCell({
    cell: { x: 3, y: 3 },
    grid: grid(),
    player,
    actors: [player],
    interactables: [object]
  });
  assert.equal(target.type, 'move');
}

{
  const object = { kind: 'chapel-double-door', x: 3, y: 3, opened: true, interact: { type: 'door' } };
  const target = resolveInteractionTargetAtCell({
    cell: { x: 3, y: 3 },
    grid: grid(),
    player,
    actors: [player],
    interactables: [object]
  });
  assert.equal(target.type, 'move');
}

{
  const corpse = { name: 'Host-Touched Penitent', x: 2, y: 3, position: { x: 2, y: 3 }, isDead: true, inspect: 'penitent-corpse' };
  const target = resolveInteractionTargetAtCell({
    cell: { x: 2, y: 3 },
    grid: grid(),
    player,
    actors: [player],
    enemies: [corpse]
  });
  assert.equal(target.type, 'corpse');
  assert.equal(isTargetInReach(player, target), true);
}

{
  const corpse = {
    name: 'Choir Cutthroat',
    x: 2,
    y: 3,
    position: { x: 2, y: 3 },
    isDead: true,
    loot: [{ item: 'ducat', count: 1 }]
  };
  const target = resolveInteractionTargetAtCell({
    cell: { x: 2, y: 3 },
    grid: grid(),
    player,
    actors: [player],
    enemies: [corpse]
  });
  assert.equal(target.type, 'corpse');
  assert.equal(target.enemy, corpse);
}

{
  const target = resolveInteractionTargetAtCell({
    cell: { x: 9, y: 9 },
    grid: grid(),
    player,
    actors: [player]
  });
  assert.equal(target.type, 'out-of-bounds');
}

{
  const target = resolveInteractionTargetAtCell({
    cell: { x: 5, y: 5 },
    grid: grid({ blocked: ['5,5'] }),
    player,
    actors: [player]
  });
  assert.equal(target.type, 'blocked');
}

{
  const hiddenObject = { kind: 'paper-scraps', x: 4, y: 4, interact: { type: 'note' } };
  const target = resolveInteractionTargetAtCell({
    cell: { x: 4, y: 4 },
    grid: grid(),
    player,
    actors: [player],
    interactables: [hiddenObject],
    hiddenTiles: new Set(['4,4'])
  });
  assert.equal(target.type, 'blocked');
}
