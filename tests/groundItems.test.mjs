import assert from 'node:assert/strict';

import {
  GROUND_ITEM_KIND,
  GROUND_ITEM_PICKUP_POLICY,
  canActorPickupGroundItem,
  createGroundItem,
  hydrateGroundItem,
  isGroundItemPickupComplete,
  serializeGroundItem
} from '../src/world/GroundItems.js';
import { resolveInteractionTargetAtCell } from '../src/world/InteractionTargeting.js';

function grid() {
  return {
    isInside: (x, y) => x >= 0 && y >= 0 && x < 8 && y < 8,
    isWalkable: () => true
  };
}

{
  const item = createGroundItem({
    id: 'drop-1',
    itemId: 'field-dressing',
    itemDef: { name: 'Field Dressing', groundModel: 'dressing' },
    count: 1,
    x: 3,
    y: 4,
    tick: 12
  });

  assert.equal(item.kind, GROUND_ITEM_KIND);
  assert.equal(item.name, 'Field Dressing');
  assert.equal(item.model, 'dressing');
  assert.equal(item.interact.type, 'ground-item');
  assert.equal(item.pickupPolicy, GROUND_ITEM_PICKUP_POLICY.PLAYER);
}

{
  const item = createGroundItem({
    id: 'drop-2',
    itemId: 'relic-rounds',
    itemDef: { name: 'Relic Rounds', groundModel: 'rounds' },
    count: 2,
    x: 3,
    y: 4
  });
  const player = { type: 'player' };
  const npc = { type: 'npc' };

  assert.equal(canActorPickupGroundItem(player, item), true);
  assert.equal(canActorPickupGroundItem(npc, item), false);
  item.pickupPolicy = GROUND_ITEM_PICKUP_POLICY.ANY;
  assert.equal(canActorPickupGroundItem(npc, item), true);
}

{
  const item = createGroundItem({
    id: 'drop-3',
    itemId: 'field-dressing',
    itemDef: { name: 'Field Dressing', groundModel: 'dressing' },
    count: 1,
    x: 3,
    y: 4,
    tick: 1
  });
  const snapshot = serializeGroundItem(item);
  const hydrated = hydrateGroundItem(snapshot);

  assert.equal(hydrated.kind, GROUND_ITEM_KIND);
  assert.equal(hydrated.itemId, 'field-dressing');
  assert.equal(hydrated.interact.type, 'ground-item');
  assert.equal(hydrated.consumed, false);
}

{
  const item = createGroundItem({
    id: 'drop-4',
    itemId: 'field-dressing',
    itemDef: { name: 'Field Dressing', groundModel: 'dressing' },
    count: 1,
    x: 3,
    y: 4,
    tick: 1
  });
  item.consumed = true;
  item.pickupStart = 10;

  assert.equal(isGroundItemPickupComplete(item, 10.1), false);
  assert.equal(isGroundItemPickupComplete(item, 10.5), true);
  assert.equal(serializeGroundItem(item), null);
}

{
  const player = { type: 'player', x: 2, y: 2, position: { x: 2, y: 2 } };
  const item = createGroundItem({
    id: 'drop-5',
    itemId: 'field-dressing',
    itemDef: { name: 'Field Dressing', groundModel: 'dressing' },
    count: 1,
    x: 3,
    y: 2
  });
  const target = resolveInteractionTargetAtCell({
    cell: { x: 3, y: 2 },
    grid: grid(),
    player,
    actors: [player],
    interactables: [item]
  });

  assert.equal(target.type, 'object');
  assert.equal(target.object, item);
}

{
  const player = { type: 'player', x: 2, y: 2, position: { x: 2, y: 2 } };
  const item = createGroundItem({
    id: 'drop-6',
    itemId: 'field-dressing',
    itemDef: { name: 'Field Dressing', groundModel: 'dressing' },
    count: 1,
    x: 2,
    y: 2
  });
  const target = resolveInteractionTargetAtCell({
    cell: { x: 2, y: 2 },
    grid: grid(),
    player,
    actors: [player],
    interactables: [item],
    mode: 'explore'
  });

  assert.equal(target.type, 'object');
  assert.equal(target.object, item);
}
