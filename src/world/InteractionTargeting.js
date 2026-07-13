import { isOpenDoorObject } from './DoorSystem.js';

function sameCell(subject, cell) {
  return subject?.x === cell?.x && subject?.y === cell?.y;
}

function cellInRect(cell, rect) {
  if (!cell || !rect || typeof rect !== 'object') return false;
  const left = Math.min(rect.x0, rect.x1);
  const right = Math.max(rect.x0, rect.x1);
  const top = Math.min(rect.y0, rect.y1);
  const bottom = Math.max(rect.y0, rect.y1);
  return cell.x >= left && cell.x <= right && cell.y >= top && cell.y <= bottom;
}

function matchesClickArea(subject, cell) {
  return Array.isArray(subject?.clickAreas) && subject.clickAreas.some((area) => cellInRect(cell, area));
}

function chebyshev(a, b) {
  return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
}

function canTalk(actor) {
  return Boolean(actor?.dialogue) && !(actor.dialogueSeen && !actor.dialogueRepeat);
}

function canSearchCorpse(enemy) {
  return Boolean(enemy?.isDead && (enemy.inspect || (Array.isArray(enemy.loot) && enemy.loot.length > 0)));
}

function isHostileActor(actor, enemies) {
  return actor?.type === 'enemy' || enemies.includes(actor);
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
    if (isHostileActor(actor, enemies)) return { type: 'hostile', actor, cell };
    return { type: 'actor', actor, cell };
  }

  const corpse = enemies.find((enemy) => canSearchCorpse(enemy) && sameCell(enemy, cell)) ?? null;
  if (corpse) return { type: 'corpse', enemy: corpse, cell };

  const object = interactables.find((entry) =>
    !entry.consumed && !isOpenDoorObject(entry) && sameCell(entry, cell)
  ) ?? null;
  if (object) return { type: 'object', object, cell };

  const footprintObject = interactables.find((entry) =>
    !entry.consumed && !isOpenDoorObject(entry) && matchesClickArea(entry, cell)
  ) ?? null;
  if (footprintObject) {
    return {
      type: 'object',
      object: footprintObject,
      cell: { x: footprintObject.x, y: footprintObject.y },
      sourceCell: cell
    };
  }

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
