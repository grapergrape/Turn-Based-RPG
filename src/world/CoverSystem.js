import { cellsOnLine } from './PerceptionSystem.js';
import { isPassableWhenOpen } from './DoorSystem.js';
import { getSprite } from '../render/spriteCatalog.js';

export const COVER_LEVELS = Object.freeze(['none', 'light', 'hard']);

const COVER_RANK = Object.freeze({
  none: 0,
  light: 1,
  hard: 2
});

export function normalizeCover(value) {
  if (typeof value === 'string') {
    const normalized = value.toLowerCase();
    if (COVER_RANK[normalized] !== undefined) return normalized;
  }
  return 'none';
}

export function coverLabel(level) {
  switch (normalizeCover(level)) {
    case 'light':
      return 'Light cover';
    case 'hard':
      return 'Hard cover';
    default:
      return '';
  }
}

export function compactCoverLabel(level) {
  switch (normalizeCover(level)) {
    case 'light':
      return 'LIGHT COVER';
    case 'hard':
      return 'HARD COVER';
    default:
      return '';
  }
}

export function objectCoverLevel(object = null) {
  if (!object || object.consumed) return 'none';
  if (object.opened && isPassableWhenOpen(object)) return 'none';
  if (object.cover !== undefined) return normalizeCover(object.cover);
  return normalizeCover(getSprite(object.kind)?.cover);
}

export function cellCover({ grid = null, props = [], x, y } = {}) {
  const levels = [];
  const tile = grid?.getTileDef?.(x, y);
  if (tile) {
    levels.push(normalizeCover(tile.cover ?? getSprite(tile.kind)?.cover));
  }
  for (const object of objectsAt(props, x, y)) {
    levels.push(objectCoverLevel(object));
  }
  return strongestCover(levels);
}

export function evaluateLineOfFire({
  grid = null,
  props = [],
  attacker = null,
  defender = null,
  attack = null,
  hiddenTiles = null
} = {}) {
  const from = pointFor(attacker);
  const to = pointFor(defender);
  if (!grid || !from || !to || !attack) {
    return { blocked: false, reason: '', cover: { level: 'none', label: '' } };
  }
  if (attack.range <= 1) {
    return { blocked: false, reason: '', cover: { level: 'none', label: '' } };
  }

  const candidates = targetCoverCandidates(grid, from, to);
  const candidateKeys = new Set(candidates.map((cell) => key(cell.x, cell.y)));
  const coverLevels = [];
  const cells = cellsOnLine(from.x, from.y, to.x, to.y);

  for (let i = 1; i < cells.length - 1; i += 1) {
    const cell = cells[i];
    const isCandidate = candidateKeys.has(key(cell.x, cell.y));
    if (isHidden(cell, hiddenTiles) && !isCandidate) {
      return { blocked: true, reason: 'No shot', cover: { level: 'none', label: '' } };
    }

    const blocked = cellBlocksShot(grid, props, cell.x, cell.y);
    if (!blocked) continue;

    if (isCandidate) {
      const level = cellCover({ grid, props, x: cell.x, y: cell.y });
      if (level === 'none') {
        return { blocked: true, reason: 'No shot', cover: { level: 'none', label: '' } };
      }
      coverLevels.push(level);
      continue;
    }

    return { blocked: true, reason: 'No shot', cover: { level: 'none', label: '' } };
  }

  for (const cell of candidates) {
    if (isHidden(cell, hiddenTiles)) continue;
    coverLevels.push(cellCover({ grid, props, x: cell.x, y: cell.y }));
  }

  const level = strongestCover(coverLevels);
  return {
    blocked: false,
    reason: '',
    cover: { level, label: coverLabel(level), tag: compactCoverLabel(level) }
  };
}

function targetCoverCandidates(grid, from, to) {
  const dx = Math.sign(from.x - to.x);
  const dy = Math.sign(from.y - to.y);
  const raw = [
    { x: to.x + dx, y: to.y + dy },
    { x: to.x + dx, y: to.y },
    { x: to.x, y: to.y + dy }
  ];
  const seen = new Set();
  const cells = [];
  for (const cell of raw) {
    if (!cell || (cell.x === to.x && cell.y === to.y) || (cell.x === from.x && cell.y === from.y)) continue;
    if (!grid?.isInside?.(cell.x, cell.y)) continue;
    const cellKey = key(cell.x, cell.y);
    if (seen.has(cellKey)) continue;
    seen.add(cellKey);
    cells.push(cell);
  }
  return cells;
}

function cellBlocksShot(grid, props, x, y) {
  if (!grid?.isInside?.(x, y)) return true;
  if (!grid.isWalkable(x, y)) return true;
  return objectsAt(props, x, y).some((object) => objectBlocksShot(object));
}

function objectBlocksShot(object) {
  if (!object || object.consumed) return false;
  if (object.opened && isPassableWhenOpen(object)) return false;
  return Boolean(object.blocking || getSprite(object.kind)?.block);
}

function objectsAt(props, x, y) {
  return (props ?? []).filter((object) => object?.x === x && object?.y === y);
}

function strongestCover(levels) {
  let best = 'none';
  for (const level of levels) {
    const normalized = normalizeCover(level);
    if ((COVER_RANK[normalized] ?? 0) > COVER_RANK[best]) best = normalized;
  }
  return best;
}

function pointFor(actor) {
  if (actor?.position) return actor.position;
  if (Number.isFinite(actor?.x) && Number.isFinite(actor?.y)) return actor;
  return null;
}

function isHidden(cell, hiddenTiles) {
  if (!hiddenTiles) return false;
  return hiddenTiles.has?.(key(cell.x, cell.y)) ?? false;
}

function key(x, y) {
  return `${x},${y}`;
}
