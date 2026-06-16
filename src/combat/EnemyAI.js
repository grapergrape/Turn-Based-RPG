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
export function planTurn(enemy, player, grid, actors) {
  const actions = [];
  const attack = enemy.attacks[0];
  if (!attack || player.isDead) return actions;

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
    actions.push({ type: 'attack' });
    ap -= attack.apCost;
  }

  return actions;
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
