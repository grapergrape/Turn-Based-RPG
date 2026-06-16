// Breadth-first pathfinding on the logical grid (4-directional movement).
//
// Used by enemy AI to advance toward the player and by exploration step-moves.
// Collision uses the same Grid.isWalkable rule everywhere, plus a set of cells
// occupied by other actors. NPCs never path through walls, blocking props, or
// other actors, and never stop on the target's own tile.

const DIRS = [
  { x: 0, y: -1 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 0 },
  { x: 1, y: -1 }, { x: 1, y: 1 }, { x: -1, y: 1 }, { x: -1, y: -1 }
];

function key(x, y) {
  return `${x},${y}`;
}

function isFree(grid, x, y, occupied) {
  return grid.isWalkable(x, y) && !occupied.has(key(x, y));
}

// A diagonal step is only allowed when both orthogonally-adjacent cells are
// also free, so actors never clip through wall/prop corners.
function canStep(grid, fromX, fromY, dir, occupied) {
  const nx = fromX + dir.x;
  const ny = fromY + dir.y;
  if (!isFree(grid, nx, ny, occupied)) return false;
  if (dir.x !== 0 && dir.y !== 0) {
    if (!isFree(grid, fromX + dir.x, fromY, occupied)) return false;
    if (!isFree(grid, fromX, fromY + dir.y, occupied)) return false;
  }
  return true;
}

// Shortest path from start to goal (exclusive of start). Returns array of
// {x, y} steps, or null if unreachable. goal must itself be free.
export function findPath(grid, start, goal, occupied = new Set()) {
  if (!isFree(grid, goal.x, goal.y, occupied)) return null;
  return bfs(grid, start, occupied, (x, y) => x === goal.x && y === goal.y);
}

// Path to the nearest cell ADJACENT to `target` (so an attacker can stand next
// to the player and strike). Returns array of steps or null.
export function findPathToAdjacent(grid, start, target, occupied = new Set()) {
  const adjacent = (x, y) =>
    Math.max(Math.abs(x - target.x), Math.abs(y - target.y)) === 1;
  if (adjacent(start.x, start.y)) return [];
  return bfs(grid, start, occupied, adjacent);
}

function bfs(grid, start, occupied, isGoal) {
  const startKey = key(start.x, start.y);
  const cameFrom = new Map([[startKey, null]]);
  const queue = [start];
  let head = 0;

  while (head < queue.length) {
    const current = queue[head];
    head += 1;

    if (isGoal(current.x, current.y) && !(current.x === start.x && current.y === start.y)) {
      return reconstruct(cameFrom, current);
    }

    for (const dir of DIRS) {
      const nx = current.x + dir.x;
      const ny = current.y + dir.y;
      const nKey = key(nx, ny);
      if (cameFrom.has(nKey)) continue;
      if (!canStep(grid, current.x, current.y, dir, occupied)) continue;
      cameFrom.set(nKey, current);
      queue.push({ x: nx, y: ny });
    }
  }

  return null;
}

function reconstruct(cameFrom, end) {
  const path = [];
  let node = end;
  while (node) {
    const parent = cameFrom.get(key(node.x, node.y));
    if (parent === null || parent === undefined) break;
    path.push({ x: node.x, y: node.y });
    node = parent;
  }
  return path.reverse();
}

// All cells reachable from start within `budget` steps (for combat overlays).
// Returns a Set of "x,y" keys, excluding the start cell.
export function reachableCells(grid, start, budget, occupied = new Set()) {
  const result = new Set();
  const dist = new Map([[key(start.x, start.y), 0]]);
  const queue = [start];
  let head = 0;

  while (head < queue.length) {
    const current = queue[head];
    head += 1;
    const d = dist.get(key(current.x, current.y));
    if (d >= budget) continue;

    for (const dir of DIRS) {
      const nx = current.x + dir.x;
      const ny = current.y + dir.y;
      const nKey = key(nx, ny);
      if (dist.has(nKey)) continue;
      if (!canStep(grid, current.x, current.y, dir, occupied)) continue;
      dist.set(nKey, d + 1);
      result.add(nKey);
      queue.push({ x: nx, y: ny });
    }
  }

  return result;
}
