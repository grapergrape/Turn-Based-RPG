// Enemy turn planning.
//
// Plans a turn as a sequence of discrete actions (steps toward the player, then
// attacks) that the game loop plays out with animation. The plan is computed
// against the current board: the player does not move during an enemy turn, so
// a precomputed path stays valid. NPCs path around walls, props, and other
// actors, never onto the player's tile.

import { findPathToAdjacent } from '../world/Pathfinder.js';
import { chebyshev } from './CombatSystem.js';

// Build the set of occupied cells (all actors except `self`). The player's tile
// counts as occupied so attackers stop adjacent to it.
function occupiedExcept(self, actors) {
  const set = new Set();
  for (const actor of actors) {
    if (actor === self || actor.isDead) continue;
    set.add(`${actor.position.x},${actor.position.y}`);
  }
  return set;
}

// Returns an ordered list of actions:
//   { type: 'move', to: {x, y} }
//   { type: 'attack' }
export function planTurn(enemy, opponents, grid, actors) {
  const actions = [];
  const attack = enemy.attacks[0];
  const targets = Array.isArray(opponents) ? opponents : [opponents];
  const player = chooseEnemyTarget(enemy, targets, grid, actors, attack);
  if (!attack || !player || player.isDead) return actions;

  const occupied = occupiedExcept(enemy, actors);
  let ap = enemy.ap;
  const sim = { x: enemy.position.x, y: enemy.position.y };

  // Close the distance.
  if (chebyshev(sim, player.position) > attack.range) {
    const path = findPathToAdjacent(grid, sim, player.position, occupied);
    if (path) {
      for (const step of path) {
        if (ap < enemy.moveCost) break;
        // Keep enough AP to attack once we arrive, if we are about to be in range.
        if (chebyshev(step, player.position) <= attack.range && ap - enemy.moveCost < attack.apCost) {
          // Moving here would strand us with no attack; only worth it if we
          // are not yet in range at all.
          if (chebyshev(sim, player.position) <= attack.range) break;
        }
        actions.push({ type: 'move', to: { x: step.x, y: step.y } });
        ap -= enemy.moveCost;
        sim.x = step.x;
        sim.y = step.y;
        if (chebyshev(sim, player.position) <= attack.range) break;
      }
    }
  }

  // Attack while in range and AP remains.
  while (chebyshev(sim, player.position) <= attack.range && ap >= attack.apCost) {
    actions.push({ type: 'attack', target: player });
    ap -= attack.apCost;
  }

  return actions;
}

export function chooseEnemyTarget(enemy, opponents, grid, actors, attack = enemy?.attacks?.[0]) {
  const living = (opponents ?? []).filter((actor) => actor && !actor.isDead && actor.team !== 'enemy');
  if (!enemy || !attack || living.length === 0) return null;
  const occupied = occupiedExcept(enemy, actors);
  const candidates = living.map((actor) => {
    const distance = chebyshev(enemy.position, actor.position);
    const path = distance <= attack.range
      ? []
      : findPathToAdjacent(grid, enemy.position, actor.position, occupied);
    const reachable = distance <= attack.range || Boolean(path);
    const reachDistance = distance <= attack.range ? distance : path?.length ?? Number.POSITIVE_INFINITY;
    const hpRatio = actor.maxHp > 0 ? actor.hp / actor.maxHp : 1;
    const taunting = actor.statuses?.some((status) => status.id === 'taunting') && distance <= 3;
    return { actor, reachable, reachDistance, hpRatio, taunting };
  }).filter((entry) => entry.reachable);
  if (candidates.length === 0) return null;
  const hasTaunt = candidates.some((entry) => entry.taunting);
  return candidates
    .filter((entry) => !hasTaunt || entry.taunting)
    .sort((left, right) =>
      left.reachDistance - right.reachDistance ||
      left.hpRatio - right.hpRatio ||
      Number(right.actor.type === 'player') - Number(left.actor.type === 'player')
    )[0]?.actor ?? null;
}

// Optional Host-flavoured barks for the Penitent.
const PENITENT_LINES = [
  'The Penitent rasps a broken prayer.',
  "The Penitent's thorned hands unfold.",
  'The Host-touched thing drags one knee across the chapel stone.'
];

export function flavorLine(enemy, round) {
  if (enemy.id !== 'host-touched-penitent') return null;
  if (round % 2 !== 0) return null;
  return PENITENT_LINES[(round / 2) % PENITENT_LINES.length | 0];
}
