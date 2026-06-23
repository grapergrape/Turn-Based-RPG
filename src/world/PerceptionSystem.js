const DEFAULT_VISION_RADIUS = 6;
const DEFAULT_CONE_DEGREES = 110;

export const SUSPICION_SEVERITY = Object.freeze({
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high'
});

export const SUSPICION_BASE_DC = Object.freeze({
  [SUSPICION_SEVERITY.LOW]: 50,
  [SUSPICION_SEVERITY.MEDIUM]: 60,
  [SUSPICION_SEVERITY.HIGH]: 75
});

export const SUSPICION_HEARING_RADIUS = Object.freeze({
  [SUSPICION_SEVERITY.LOW]: 3,
  [SUSPICION_SEVERITY.MEDIUM]: 5,
  [SUSPICION_SEVERITY.HIGH]: 10
});

export const SUSPICION_STATES = Object.freeze({
  CALM: 'calm',
  WATCHING: 'watching',
  INVESTIGATING: 'investigating',
  ALERTED: 'alerted'
});

export const PERCEPTION_FACINGS = Object.freeze(['e', 'se', 's', 'sw', 'w', 'nw', 'n', 'ne']);
export const PATROL_MODES = Object.freeze(['loop', 'pingpong', 'once']);

const FACING_VECTORS = Object.freeze({
  e: { x: 1, y: 0 },
  se: { x: 1, y: 1 },
  s: { x: 0, y: 1 },
  sw: { x: -1, y: 1 },
  w: { x: -1, y: 0 },
  nw: { x: -1, y: -1 },
  n: { x: 0, y: -1 },
  ne: { x: 1, y: -1 }
});

const STATE_RANK = Object.freeze({
  [SUSPICION_STATES.CALM]: 0,
  [SUSPICION_STATES.WATCHING]: 1,
  [SUSPICION_STATES.INVESTIGATING]: 2,
  [SUSPICION_STATES.ALERTED]: 3
});

export function tileDistance(a, b) {
  return Math.max(Math.abs((a?.x ?? 0) - (b?.x ?? 0)), Math.abs((a?.y ?? 0) - (b?.y ?? 0)));
}

export function normalizePerception(observer = {}, defaults = {}) {
  const authored = observer.perception && typeof observer.perception === 'object'
    ? observer.perception
    : {};
  return {
    visionRadius: positiveNumber(
      authored.visionRadius,
      positiveNumber(observer.visionRadius, positiveNumber(defaults.visionRadius, DEFAULT_VISION_RADIUS))
    ),
    coneDegrees: clampNumber(
      authored.coneDegrees,
      1,
      360,
      clampNumber(defaults.coneDegrees, 1, 360, DEFAULT_CONE_DEGREES)
    ),
    hearingRadius: normalizeHearingRadius(authored.hearingRadius, defaults.hearingRadius),
    dcBonus: finiteNumber(authored.dcBonus, finiteNumber(defaults.dcBonus, 0)),
    ratingBonus: finiteNumber(authored.ratingBonus, 0)
  };
}

export function canSeeActor(observer, target, { grid, hiddenTiles = null, defaults = {} } = {}) {
  const observerPoint = pointFor(observer);
  const targetPoint = pointFor(target);
  if (!observerPoint || !targetPoint) return { canSee: false, reason: 'missing-point' };
  if (isHidden(observerPoint, hiddenTiles) || isHidden(targetPoint, hiddenTiles)) {
    return { canSee: false, reason: 'hidden' };
  }

  const perception = normalizePerception(observer, defaults);
  const distance = tileDistance(observerPoint, targetPoint);
  if (distance > perception.visionRadius) return { canSee: false, reason: 'range', distance, perception };
  if (!isInsideFacingCone(observer, targetPoint, perception.coneDegrees)) {
    return { canSee: false, reason: 'cone', distance, perception };
  }
  if (!hasLineOfSight(observerPoint, targetPoint, { grid })) {
    return { canSee: false, reason: 'blocked', distance, perception };
  }
  return { canSee: true, reason: 'seen', distance, perception };
}

export function visionConeCells(observer, { grid, hiddenTiles = null, defaults = {} } = {}) {
  const observerPoint = pointFor(observer);
  if (!observerPoint || !grid?.isInside?.(observerPoint.x, observerPoint.y)) return [];
  if (isHidden(observerPoint, hiddenTiles)) return [];

  const perception = normalizePerception(observer, defaults);
  const radius = Math.ceil(perception.visionRadius);
  const cells = [];
  for (let y = observerPoint.y - radius; y <= observerPoint.y + radius; y += 1) {
    for (let x = observerPoint.x - radius; x <= observerPoint.x + radius; x += 1) {
      if (x === observerPoint.x && y === observerPoint.y) continue;
      if (!grid.isInside(x, y)) continue;
      const targetPoint = { x, y };
      if (isHidden(targetPoint, hiddenTiles)) continue;
      const distance = tileDistance(observerPoint, targetPoint);
      if (distance > perception.visionRadius) continue;
      if (!isInsideFacingCone(observer, targetPoint, perception.coneDegrees)) continue;
      if (!hasLineOfSight(observerPoint, targetPoint, { grid })) continue;
      cells.push({ x, y, key: `${x},${y}`, distance });
    }
  }
  cells.sort((a, b) => a.distance - b.distance || a.y - b.y || a.x - b.x);
  return cells;
}

export function noticeSuspiciousAction(observer, target, { severity = SUSPICION_SEVERITY.LOW, grid, hiddenTiles = null, defaults = {} } = {}) {
  const sight = canSeeActor(observer, target, { grid, hiddenTiles, defaults });
  if (sight.canSee) return { noticed: true, reason: 'seen', ...sight };

  const observerPoint = pointFor(observer);
  const targetPoint = pointFor(target);
  if (!observerPoint || !targetPoint) return { noticed: false, reason: 'missing-point' };
  if (isHidden(observerPoint, hiddenTiles) || isHidden(targetPoint, hiddenTiles)) {
    return { noticed: false, reason: 'hidden' };
  }

  const perception = normalizePerception(observer, defaults);
  const distance = tileDistance(observerPoint, targetPoint);
  const hearingRadius = hearingRadiusFor(perception, severity);
  if (distance <= hearingRadius) {
    return { noticed: true, reason: 'heard', distance, perception };
  }
  return { noticed: false, reason: sight.reason ?? 'unnoticed', distance, perception };
}

export function hasLineOfSight(from, to, { grid, blocksSight = null } = {}) {
  const cells = cellsOnLine(from.x, from.y, to.x, to.y);
  for (let i = 1; i < cells.length - 1; i += 1) {
    const cell = cells[i];
    const blocked = typeof blocksSight === 'function'
      ? blocksSight(cell.x, cell.y)
      : !grid?.isWalkable?.(cell.x, cell.y);
    if (blocked) return false;
  }
  return true;
}

export function cellsOnLine(x0, y0, x1, y1) {
  const cells = [];
  let x = Math.round(x0);
  let y = Math.round(y0);
  const endX = Math.round(x1);
  const endY = Math.round(y1);
  const dx = Math.abs(endX - x);
  const dy = Math.abs(endY - y);
  const sx = x < endX ? 1 : -1;
  const sy = y < endY ? 1 : -1;
  let err = dx - dy;

  while (true) {
    cells.push({ x, y });
    if (x === endX && y === endY) break;
    const e2 = err * 2;
    if (e2 > -dy) {
      err -= dy;
      x += sx;
    }
    if (e2 < dx) {
      err += dx;
      y += sy;
    }
  }
  return cells;
}

export function isInsideFacingCone(observer, targetPoint, coneDegrees = DEFAULT_CONE_DEGREES) {
  if (coneDegrees >= 360) return true;
  const observerPoint = pointFor(observer);
  if (!observerPoint || !targetPoint) return false;
  const dx = targetPoint.x - observerPoint.x;
  const dy = targetPoint.y - observerPoint.y;
  if (dx === 0 && dy === 0) return true;

  const targetVector = normalizeVector({ x: dx - dy, y: dx + dy });
  const facingVector = normalizeVector(FACING_VECTORS[observer.facing] ?? FACING_VECTORS.se);
  const dot = targetVector.x * facingVector.x + targetVector.y * facingVector.y;
  return dot >= Math.cos((coneDegrees * Math.PI / 180) / 2);
}

export function suspicionDc(severity = SUSPICION_SEVERITY.LOW, { observerRating = 0, perception = null } = {}) {
  const base = SUSPICION_BASE_DC[severity] ?? SUSPICION_BASE_DC[SUSPICION_SEVERITY.LOW];
  const statBonus = Math.round((finiteNumber(observerRating, 0) - 50) / 5);
  const authoredBonus = finiteNumber(perception?.dcBonus, 0);
  return clampNumber(base + statBonus + authoredBonus, 1, 100, base);
}

export function resolveStealthCheck({
  severity = SUSPICION_SEVERITY.LOW,
  stealthRating = 0,
  observerRating = 0,
  perception = null,
  roll = Math.random()
} = {}) {
  const dc = suspicionDc(severity, { observerRating, perception });
  const chance = clampNumber(Math.round(50 + finiteNumber(stealthRating, 0) - dc), 5, 95, 5);
  const rollValue = clampNumber(Math.floor(clampNumber(roll, 0, 0.999999, 0) * 100) + 1, 1, 100, 1);
  return {
    severity,
    dc,
    chance,
    roll: rollValue,
    success: rollValue <= chance
  };
}

export function nextSuspicionState({ severity = SUSPICION_SEVERITY.LOW, success = false, currentState = SUSPICION_STATES.CALM } = {}) {
  const current = validSuspicionState(currentState);
  if (current === SUSPICION_STATES.ALERTED) return current;
  if (success) return current;
  if (severity === SUSPICION_SEVERITY.HIGH) return SUSPICION_STATES.ALERTED;
  if (current === SUSPICION_STATES.INVESTIGATING) return SUSPICION_STATES.ALERTED;
  if (severity === SUSPICION_SEVERITY.MEDIUM) return SUSPICION_STATES.INVESTIGATING;
  if (current === SUSPICION_STATES.WATCHING) return SUSPICION_STATES.INVESTIGATING;
  return SUSPICION_STATES.WATCHING;
}

export function suspicionStateRank(state) {
  return STATE_RANK[validSuspicionState(state)];
}

function hearingRadiusFor(perception, severity) {
  const authored = perception?.hearingRadius;
  if (authored && typeof authored === 'object' && !Array.isArray(authored)) {
    return positiveNumber(authored[severity], SUSPICION_HEARING_RADIUS[severity] ?? SUSPICION_HEARING_RADIUS.low);
  }
  return positiveNumber(authored, SUSPICION_HEARING_RADIUS[severity] ?? SUSPICION_HEARING_RADIUS.low);
}

function normalizeHearingRadius(authored, fallback) {
  if (authored && typeof authored === 'object' && !Array.isArray(authored)) {
    return {
      low: positiveNumber(authored.low, positiveNumber(fallback?.low, SUSPICION_HEARING_RADIUS.low)),
      medium: positiveNumber(authored.medium, positiveNumber(fallback?.medium, SUSPICION_HEARING_RADIUS.medium)),
      high: positiveNumber(authored.high, positiveNumber(fallback?.high, SUSPICION_HEARING_RADIUS.high))
    };
  }
  return positiveNumber(authored, fallback ?? null);
}

function validSuspicionState(state) {
  return Object.hasOwn(STATE_RANK, state) ? state : SUSPICION_STATES.CALM;
}

function pointFor(entity) {
  if (!entity) return null;
  const source = entity.position ?? entity;
  if (typeof source.x !== 'number' || typeof source.y !== 'number') return null;
  return { x: source.x, y: source.y };
}

function isHidden(point, hiddenTiles) {
  return Boolean(hiddenTiles?.has?.(`${point.x},${point.y}`));
}

function normalizeVector(vector) {
  const length = Math.hypot(vector.x, vector.y);
  if (length <= 0) return { x: 0, y: 0 };
  return { x: vector.x / length, y: vector.y / length };
}

function positiveNumber(value, fallback) {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) return value;
  return fallback;
}

function finiteNumber(value, fallback) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function clampNumber(value, min, max, fallback) {
  const base = finiteNumber(value, fallback);
  return Math.max(min, Math.min(max, base));
}
