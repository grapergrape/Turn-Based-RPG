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
  },
  'burn-line': {
    id: 'burn-line',
    name: 'Burn Line',
    type: 'active',
    targets: ['tile', 'enemy']
  },
  'study-target': {
    id: 'study-target',
    name: 'Study Target',
    type: 'active',
    targets: ['enemy']
  },
  overwatch: {
    id: 'overwatch',
    name: 'Overwatch',
    type: 'active',
    targets: ['enemy', 'tile']
  },
  shove: {
    id: 'shove',
    name: 'Shove',
    type: 'active',
    targets: ['enemy']
  },
  'guard-break': {
    id: 'guard-break',
    name: 'Guard Break',
    type: 'active',
    targets: ['enemy']
  },
  stabilize: {
    id: 'stabilize',
    name: 'Stabilize',
    type: 'active',
    targets: ['self']
  },
  'field-stimulant': {
    id: 'field-stimulant',
    name: 'Field Stimulant',
    type: 'active',
    targets: ['self']
  },
  'field-measure': {
    id: 'field-measure',
    name: 'Field Measure',
    type: 'active',
    targets: ['self']
  },
  'name-the-error': {
    id: 'name-the-error',
    name: 'Name the Error',
    type: 'active',
    targets: ['enemy']
  },
  'stilling-litany': {
    id: 'stilling-litany',
    name: 'Stilling Litany',
    type: 'active',
    targets: ['enemy']
  },
  rally: {
    id: 'rally',
    name: 'Rally',
    type: 'active',
    targets: ['self']
  },
  feint: {
    id: 'feint',
    name: 'Feint',
    type: 'active',
    targets: ['enemy']
  },
  'fade-back': {
    id: 'fade-back',
    name: 'Fade Back',
    type: 'active',
    targets: ['tile']
  },
  'seal-tile': {
    id: 'seal-tile',
    name: 'Seal Tile',
    type: 'active',
    targets: ['tile', 'enemy']
  },
  'quarantine-line': {
    id: 'quarantine-line',
    name: 'Quarantine Line',
    type: 'active',
    targets: ['tile', 'enemy']
  },
  'wire-snare': {
    id: 'wire-snare',
    name: 'Wire Snare',
    type: 'active',
    targets: ['enemy']
  },
  'censure-spark': {
    id: 'censure-spark',
    name: 'Censure Spark',
    type: 'active',
    targets: ['enemy']
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

const adjacentHumanEnemy = {
  name: 'Ash Broker',
  type: 'enemy',
  faction: 'ash-cartel',
  tags: ['human'],
  position: { x: 1, y: 0 },
  isDead: false
};

const hostEnemy = {
  name: 'Host Penitent',
  type: 'enemy',
  faction: 'the-host',
  tags: ['host'],
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
  const player = makePlayer({ progression: { techniques: ['aimed-shot'] } });
  const actions = buildContextActionsForTarget({
    player,
    target: { type: 'combatant', actor: enemy, cell: enemy.position },
    enemies: [enemy],
    grid: openGrid,
    techniqueDefs,
    inventory,
    attackPreview: ({ aimedShot = false } = {}) => ({
      enabled: true,
      reason: '',
      chanceText: aimedShot ? '85%' : '70%',
      damageText: aimedShot ? 'D6' : 'D5',
      tags: aimedShot ? ['AIMED'] : ['RANGE']
    })
  });
  assert(actions.some((action) => action.id === 'attack:sidearm' && action.label === 'Sidearm 70% D5' && action.hint === 'RANGE'));
  assert(actions.some((action) => action.id === 'technique:aimed-shot' && action.label === 'Aimed Shot 85% D6' && action.hint === 'AIMED'));
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
  const player = makePlayer({ progression: { techniques: ['trip-mine', 'burn-line', 'overwatch', 'fade-back', 'seal-tile', 'quarantine-line'] } });
  const actions = buildContextActionsForTarget({
    player,
    target: { type: 'move', cell: { x: 1, y: 0 } },
    enemies: [enemy],
    grid: openGrid,
    techniqueDefs,
    inventory
  });
  assert(actions.some((action) => action.id === 'move' && action.enabled));
  assert(actions.some((action) => action.id === 'technique:trip-mine' && action.enabled && action.label === 'Trip Mine 3 AP'));
  assert(actions.some((action) => action.id === 'technique:burn-line' && action.enabled && action.label === 'Burn Line 3 AP'));
  assert(actions.some((action) => action.id === 'technique:overwatch' && action.enabled && action.label === 'Overwatch 2 AP'));
  assert(actions.some((action) => action.id === 'technique:fade-back' && action.enabled && action.label === 'Fade Back 2 AP'));
  assert(actions.some((action) => action.id === 'technique:seal-tile' && action.enabled && action.label === 'Seal Tile 2 AP'));
  assert(actions.some((action) => action.id === 'technique:quarantine-line' && action.enabled && action.label === 'Quarantine Line 3 AP'));
}

{
  const player = makePlayer({ progression: { techniques: ['study-target', 'overwatch'] } });
  const actions = buildContextActionsForTarget({
    player,
    target: { type: 'combatant', actor: enemy, cell: enemy.position },
    enemies: [enemy],
    grid: openGrid,
    techniqueDefs,
    inventory
  });
  assert(actions.some((action) => action.id === 'technique:study-target' && action.enabled && action.label === 'Study Target 2 AP'));
  assert(actions.some((action) => action.id === 'technique:overwatch' && action.enabled && action.attackId === 'sidearm'));
}

{
  const player = makePlayer({ progression: { techniques: ['stabilize', 'field-stimulant', 'field-measure', 'rally'] } });
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
  assert(actions.some((action) => action.id === 'technique:stabilize' && action.enabled && action.label === 'Stabilize 2 AP'));
  assert(actions.some((action) => action.id === 'technique:field-stimulant' && action.enabled && action.label === 'Field Stimulant 1 AP'));
  assert(actions.some((action) => action.id === 'technique:field-measure' && action.enabled && action.label === 'Field Measure 1 AP'));
  assert(actions.some((action) => action.id === 'technique:rally' && action.enabled && action.label === 'Rally 2 AP'));
}

{
  const player = makePlayer({ progression: { techniques: ['shove', 'guard-break', 'name-the-error', 'feint'] } });
  const actions = buildContextActionsForTarget({
    player,
    target: { type: 'combatant', actor: adjacentHumanEnemy, cell: adjacentHumanEnemy.position },
    enemies: [adjacentHumanEnemy],
    grid: openGrid,
    techniqueDefs,
    inventory
  });
  assert(actions.some((action) => action.id === 'technique:shove' && action.enabled && action.label === 'Shove 2 AP'));
  assert(actions.some((action) => action.id === 'technique:guard-break' && action.enabled && action.label === 'Guard Break 3 AP'));
  assert(actions.some((action) => action.id === 'technique:name-the-error' && action.enabled && action.label === 'Name the Error 2 AP'));
  assert(actions.some((action) => action.id === 'technique:feint' && action.enabled && action.label === 'Feint 2 AP'));
}

{
  const player = makePlayer({ progression: { techniques: ['name-the-error', 'feint'] } });
  const actions = buildContextActionsForTarget({
    player,
    target: { type: 'combatant', actor: enemy, cell: enemy.position },
    enemies: [enemy],
    grid: openGrid,
    techniqueDefs,
    inventory
  });
  assert(actions.some((action) => action.id === 'technique:name-the-error' && action.enabled === false && action.reason === 'No purchase'));
  assert(actions.some((action) => action.id === 'technique:feint' && action.enabled === false && action.reason === 'No purchase'));
}

{
  const player = makePlayer({ progression: { techniques: ['stilling-litany', 'wire-snare', 'censure-spark', 'burn-line', 'seal-tile', 'quarantine-line'] } });
  const actions = buildContextActionsForTarget({
    player,
    target: { type: 'combatant', actor: hostEnemy, cell: hostEnemy.position },
    enemies: [hostEnemy],
    grid: openGrid,
    occupied: new Set([`${hostEnemy.position.x},${hostEnemy.position.y}`]),
    techniqueDefs,
    inventory
  });
  assert(actions.some((action) => action.id === 'technique:stilling-litany' && action.enabled && action.label === 'Stilling Litany 2 AP'));
  assert(actions.some((action) => action.id === 'technique:wire-snare' && action.enabled && action.label === 'Wire Snare 2 AP'));
  assert(actions.some((action) => action.id === 'technique:censure-spark' && action.enabled && action.label === 'Censure Spark 2 AP'));
  assert(actions.some((action) => action.id === 'technique:burn-line' && action.enabled && action.cell === hostEnemy.position));
  assert(actions.some((action) => action.id === 'technique:seal-tile' && action.enabled && action.cell === hostEnemy.position));
  assert(actions.some((action) => action.id === 'technique:quarantine-line' && action.enabled && action.cell === hostEnemy.position));
}

{
  const player = makePlayer({ progression: { techniques: ['stilling-litany'] } });
  const actions = buildContextActionsForTarget({
    player,
    target: { type: 'combatant', actor: adjacentHumanEnemy, cell: adjacentHumanEnemy.position },
    enemies: [adjacentHumanEnemy],
    grid: openGrid,
    techniqueDefs,
    inventory
  });
  assert(actions.some((action) => action.id === 'technique:stilling-litany' && action.enabled === false && action.reason === 'No purchase'));
}
