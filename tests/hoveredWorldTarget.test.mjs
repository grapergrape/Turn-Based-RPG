import assert from 'node:assert/strict';

import { installGameRenderState } from '../src/core/game/GameRenderState.js';

class HoverFixture {}
installGameRenderState(HoverFixture);

function fixture() {
  const game = new HoverFixture();
  Object.assign(game, {
    ready: true,
    moving: false,
    uiScreen: null,
    mode: 'explore',
    input: { mouse: { x: 120, y: 80 } },
    _interactionHighlightCellFromPoint: () => null,
    _hoverCell: () => ({ x: 4, y: 5 }),
    _currentTarget: () => null,
    _nearbyExploreActionTarget: () => null,
    _objectActionInfo: () => ({ state: 'inspect' }),
    _targetActionInfo: () => ({ state: 'talk' })
  });
  return game;
}

{
  const game = fixture();
  const object = {
    id: 'stable-pump',
    kind: 'south-measure-hand-pump',
    x: 4,
    y: 5,
    interactionMarker: { x: 3, y: 5 }
  };
  game._interactionTargetAtCell = () => ({ type: 'object', object, cell: { x: 4, y: 5 } });
  game._objectActionInfo = () => ({ state: 'use' });
  assert.deepEqual(game._hoveredWorldTarget(), {
    type: 'object',
    identity: 'stable-pump',
    kind: 'south-measure-hand-pump',
    action: 'use',
    anchor: { x: 4, y: 5 },
    interactionCell: { x: 3, y: 5 }
  });
}

{
  const game = fixture();
  const actor = { spawnId: 'guard-spawn', id: 'guard', x: 4, y: 5, position: { x: 4, y: 5 } };
  game._interactionTargetAtCell = () => ({ type: 'talk', actor, cell: { x: 4, y: 5 } });
  assert.deepEqual(game._hoveredWorldTarget(), {
    type: 'actor',
    identity: 'guard-spawn',
    action: 'talk',
    anchor: { x: 4, y: 5 },
    interactionCell: { x: 4, y: 5 }
  });
}

{
  const game = fixture();
  const enemy = { id: 'hostile', x: 6, y: 5, position: { x: 6, y: 5 } };
  game.mode = 'combat';
  game._interactionTargetAtCell = () => ({ type: 'combatant', actor: enemy, cell: enemy.position });
  assert.equal(game._hoveredWorldTarget().action, 'attack');
}

{
  const game = fixture();
  const object = { kind: 'rusted-reliquary', x: 2, y: 3 };
  game.input.mouse = null;
  game._nearbyExploreActionTarget = () => ({ type: 'object', object, cell: { x: 2, y: 3 } });
  game._objectActionInfo = () => ({ state: 'loot' });
  assert.equal(game._hoveredWorldTarget().identity, 'rusted-reliquary:2,3');
  assert.equal(game._hoveredWorldTarget().action, 'loot');
}

for (const blocked of [
  { ready: false },
  { moving: true },
  { uiScreen: 'inventory' }
]) {
  const game = fixture();
  Object.assign(game, blocked);
  assert.equal(game._hoveredWorldTarget(), null);
}

console.log('hoveredWorldTarget: object, use-cell, actor, combat, keyboard, and blocked-state contracts passed.');
