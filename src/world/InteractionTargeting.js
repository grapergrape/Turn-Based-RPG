import { isOpenDoorObject } from './DoorSystem.js';

function sameCell(subject, cell) {
  return subject?.x === cell?.x && subject?.y === cell?.y;
}

function chebyshev(a, b) {
  return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
}

function canTalk(actor) {
  return Boolean(actor?.dialogue) && !(actor.dialogueSeen && !actor.dialogueRepeat);
}

function groundItemAt(interactables, cell) {
  return interactables.find((entry) =>
    !entry.consumed && entry.interact?.type === 'ground-item' && sameCell(entry, cell)
  ) ?? null;
}

export function resolveInteractionTargetAtCell({
  cell,
  grid,
  player,
  actors = [],
  enemies = [],
  interactables = [],
  hiddenTiles = null,
  mode = 'explore'
}) {
  if (!cell || !grid?.isInside(cell.x, cell.y)) {
    return { type: 'out-of-bounds', cell };
  }
  if (hiddenTiles?.has?.(`${cell.x},${cell.y}`) && !sameCell(player, cell)) {
    return { type: 'blocked', cell };
  }

  const footItem = mode !== 'combat' && sameCell(player, cell)
    ? groundItemAt(interactables, cell)
    : null;
  if (footItem) return { type: 'object', object: footItem, cell };

  const actor = actors.find((entry) => !entry.isDead && sameCell(entry, cell)) ?? null;
  if (actor) {
    if (actor === player) return { type: 'self', actor, cell };
    if (mode === 'combat') return { type: 'combatant', actor, cell };
    if (canTalk(actor)) return { type: 'talk', actor, cell };
    return { type: 'actor', actor, cell };
  }

  const corpse = enemies.find((enemy) => enemy.isDead && enemy.inspect && sameCell(enemy, cell)) ?? null;
  if (corpse) return { type: 'corpse', enemy: corpse, cell };

  const object = interactables.find((entry) =>
    !entry.consumed && !isOpenDoorObject(entry) && sameCell(entry, cell)
  ) ?? null;
  if (object) return { type: 'object', object, cell };

  if (grid.isWalkable(cell.x, cell.y)) return { type: 'move', cell };
  return { type: 'blocked', cell };
}

export function isActionTarget(target) {
  return target?.type === 'talk' || target?.type === 'corpse' || target?.type === 'object';
}

export function isTargetInReach(player, target) {
  if (!player || !isActionTarget(target)) return false;
  const reach = target.type === 'talk' ? target.actor?.talkRadius ?? 1 : 1;
  return chebyshev(player.position, target.cell) <= reach;
}
