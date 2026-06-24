import assert from 'node:assert/strict';

import { buildContextActionsForTarget } from '../src/core/ContextActions.js';

const techniqueDefs = {
  'aimed-shot': {
    id: 'aimed-shot',
    name: 'Aimed Shot',
    type: 'active',
    targets: ['enemy']
  },
  'trip-mine': {
    id: 'trip-mine',
    name: 'Trip Mine',
    type: 'active',
    targets: ['tile']
  }
};

const openGrid = {
  isWalkable(x, y) {
    return x >= 0 && y >= 0 && x < 10 && y < 10;
  }
};

function makePlayer(overrides = {}) {
  const player = {
    position: { x: 0, y: 0 },
    ap: 6,
    hp: 5,
    maxHp: 10,
    moveCost: 1,
    attacks: [
      { id: 'melee', name: 'Censure Knife', apCost: 3, damage: 3, range: 1 },
      { id: 'sidearm', name: 'Sidearm', apCost: 4, damage: 5, range: 5 }
    ],
    progression: { techniques: [] },
    getAttack(id) {
      return this.attacks.find((attack) => attack.id === id) ?? null;
    },
    ...overrides
  };
  return player;
}

const enemy = {
  name: 'Choir Feral',
  type: 'enemy',
  position: { x: 2, y: 0 },
  isDead: false
};

const inventory = {
  has(itemId) {
    return itemId === 'field-dressing';
  }
};

{
  const player = makePlayer({ progression: { techniques: ['aimed-shot'] } });
  const actions = buildContextActionsForTarget({
    player,
    target: { type: 'combatant', actor: enemy, cell: enemy.position },
    enemies: [enemy],
    grid: openGrid,
    techniqueDefs,
    inventory
  });
  assert(actions.some((action) => action.id === 'attack:sidearm' && action.enabled));
  assert(actions.some((action) => action.id === 'attack:melee' && action.enabled === false && action.reason === 'Out of range'));
  assert(actions.some((action) => action.id === 'technique:aimed-shot' && action.enabled));
}

{
  const player = makePlayer({
    attacks: [{ id: 'melee', name: 'Censure Knife', apCost: 3, damage: 3, range: 1 }],
    progression: { techniques: ['aimed-shot'] }
  });
  const actions = buildContextActionsForTarget({
    player,
    target: { type: 'combatant', actor: enemy, cell: enemy.position },
    enemies: [enemy],
    grid: openGrid,
    techniqueDefs,
    inventory
  });
  assert(actions.some((action) => action.id === 'technique:aimed-shot' && action.enabled === false && action.reason === 'Requires firearm'));
}

{
  const player = makePlayer({ progression: { techniques: [] } });
  const actions = buildContextActionsForTarget({
    player,
    target: { type: 'combatant', actor: enemy, cell: enemy.position },
    enemies: [enemy],
    grid: openGrid,
    techniqueDefs,
    inventory
  });
  assert.equal(actions.some((action) => action.id === 'technique:aimed-shot'), false);
}

{
  const player = makePlayer({ progression: { techniques: ['trip-mine'] } });
  const actions = buildContextActionsForTarget({
    player,
    target: { type: 'move', cell: { x: 1, y: 0 } },
    enemies: [enemy],
    grid: openGrid,
    techniqueDefs,
    inventory
  });
  assert(actions.some((action) => action.id === 'move' && action.enabled));
  assert(actions.some((action) => action.id === 'technique:trip-mine' && action.enabled === false && action.reason === 'Not ready yet'));
}

{
  const player = makePlayer();
  const actions = buildContextActionsForTarget({
    player,
    target: { type: 'self', actor: player, cell: player.position },
    enemies: [enemy],
    grid: openGrid,
    techniqueDefs,
    inventory
  });
  assert(actions.some((action) => action.id === 'reload' && action.enabled === false));
  assert(actions.some((action) => action.id === 'bind-wounds' && action.enabled));
}
