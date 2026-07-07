export const HAZARD_TYPES = Object.freeze({
  TRIP_MINE: 'trip-mine',
  BURNING_GROUND: 'burning-ground',
  SEALED_TILE: 'sealed-tile',
  QUARANTINE_LINE: 'quarantine-line'
});

export function createCombatHazard({
  id,
  type,
  owner = null,
  cell,
  damage = 0,
  durationRounds = 1,
  status = null
} = {}) {
  if (!cell || typeof type !== 'string') return null;
  return {
    id: id ?? `${type}:${cell.x},${cell.y}`,
    type,
    ownerId: owner?.id ?? null,
    ownerType: owner?.type ?? null,
    x: cell.x,
    y: cell.y,
    damage: Math.max(0, Math.round(Number(damage) || 0)),
    durationRounds: Math.max(1, Math.round(Number(durationRounds) || 1)),
    status: status ? { ...status } : null,
    spent: false
  };
}

export function hazardKey(hazard) {
  return `${hazard?.x},${hazard?.y}`;
}

export function hazardAt(hazards = [], cell, type = null) {
  if (!cell) return null;
  return hazards.find((hazard) =>
    !hazard.spent &&
    hazard.x === cell.x &&
    hazard.y === cell.y &&
    (type === null || hazard.type === type)
  ) ?? null;
}

export function activeHazards(hazards = []) {
  return hazards.filter((hazard) => !hazard.spent && hazard.durationRounds > 0);
}

export function hazardsAtCell(hazards = [], cell) {
  if (!cell) return [];
  return activeHazards(hazards).filter((hazard) => hazard.x === cell.x && hazard.y === cell.y);
}

export function hazardAffectsActor(hazard, actor) {
  if (!hazard || hazard.spent || !actor || actor.isDead) return false;
  if (hazard.ownerId && actor.id === hazard.ownerId) return false;
  if (hazard.ownerType === 'player') return actor.type === 'enemy';
  if (hazard.ownerType === 'enemy') return actor.type === 'player';
  return true;
}

export function decrementHazardRounds(hazards = []) {
  for (const hazard of hazards) {
    if (hazard.spent) continue;
    hazard.durationRounds = Math.max(0, (hazard.durationRounds ?? 0) - 1);
  }
  return activeHazards(hazards);
}

export function hazardOverlayTiles(hazards = []) {
  return activeHazards(hazards).map((hazard) => ({
    key: hazardKey(hazard),
    type: hazard.type
  }));
}
