export const JOURNAL_MAP_REVEAL_RADIUS = 5;

export const MAP_MARKER_KINDS = Object.freeze([
  'player',
  'quest',
  'dialogue',
  'exit',
  'locked',
  'search',
  'danger',
  'note'
]);

export const MAP_MARKER_REVEALS = Object.freeze(['explored', 'always']);

const MARKER_PRIORITY = Object.freeze({
  player: 100,
  quest: 90,
  danger: 80,
  locked: 70,
  search: 60,
  exit: 50,
  dialogue: 40,
  note: 30
});

export function revealExploredMapCells({
  grid,
  origin,
  exploredCells = new Set(),
  hiddenTiles = new Set(),
  radius = JOURNAL_MAP_REVEAL_RADIUS
} = {}) {
  const next = new Set(exploredCells ?? []);
  if (!grid || !origin) return next;
  const cx = Math.round(origin.x);
  const cy = Math.round(origin.y);
  const r = Math.max(0, Math.floor(radius));
  for (let y = cy - r; y <= cy + r; y += 1) {
    for (let x = cx - r; x <= cx + r; x += 1) {
      if (!grid.isInside(x, y)) continue;
      if (Math.max(Math.abs(x - cx), Math.abs(y - cy)) > r) continue;
      const key = cellKey(x, y);
      if (hiddenTiles?.has?.(key)) continue;
      next.add(key);
    }
  }
  return next;
}

export function buildJournalMapState({
  grid,
  level = null,
  player = null,
  exploredCells = new Set(),
  hiddenTiles = new Set(),
  interactables = [],
  actors = [],
  combatTriggers = [],
  questDefs = {},
  isQuestUpdateActive = () => false,
  objectName = defaultSourceLabel,
  resolveEncounterId = (id) => id,
  encounterHasLiving = () => true
} = {}) {
  if (!grid) return null;

  const explored = exploredCells instanceof Set ? exploredCells : new Set(exploredCells ?? []);
  const hidden = hiddenTiles instanceof Set ? hiddenTiles : new Set(hiddenTiles ?? []);
  const cells = [];
  let exploredCount = 0;
  let totalCells = 0;

  for (let y = 0; y < grid.height; y += 1) {
    for (let x = 0; x < grid.width; x += 1) {
      const key = cellKey(x, y);
      const tile = grid.getTileDef(x, y);
      const hardHidden = hidden.has(key);
      const visible = explored.has(key) && !hardHidden;
      if (!hardHidden) totalCells += 1;
      if (visible) exploredCount += 1;
      cells.push({
        x,
        y,
        key,
        explored: visible,
        hidden: hardHidden,
        type: mapCellType(grid, tile, x, y, hardHidden)
      });
    }
  }

  const markers = [];
  if (player?.position && grid.isInside(player.position.x, player.position.y)) {
    addMapMarker(markers, {
      id: 'player',
      kind: 'player',
      label: player.name ?? 'You',
      x: player.position.x,
      y: player.position.y,
      reveal: 'always'
    }, player, { explored, hidden, objectName });
  }

  for (const object of interactables ?? []) {
    addMapMarker(
      markers,
      automaticObjectMarker(object, { isQuestUpdateActive, objectName, questDefs }),
      object,
      { explored, hidden, objectName }
    );
  }

  for (const actor of actors ?? []) {
    if (!actor || actor.removed || actor.isDead) continue;
    addMapMarker(
      markers,
      actor.dialogue ? {
        id: `dialogue:${actor.spawnId ?? actor.id ?? actor.name}`,
        kind: 'dialogue',
        label: actor.name ?? 'Contact',
        x: actor.position.x,
        y: actor.position.y
      } : null,
      actor,
      { explored, hidden, objectName }
    );
  }

  for (const trigger of combatTriggers ?? []) {
    const encounterId = resolveEncounterId(trigger.encounter ?? trigger.id);
    const active = encounterId && encounterHasLiving(encounterId);
    if (!active) continue;
    addMapMarker(
      markers,
      {
        id: `danger:${trigger.id ?? encounterId}`,
        kind: 'danger',
        label: trigger.name ?? 'Danger',
        x: trigger.x,
        y: trigger.y
      },
      trigger,
      { explored, hidden, objectName }
    );
  }

  markers.sort((a, b) =>
    (MARKER_PRIORITY[b.kind] ?? 0) - (MARKER_PRIORITY[a.kind] ?? 0) ||
    a.y - b.y ||
    a.x - b.x ||
    a.label.localeCompare(b.label)
  );

  return {
    id: level?.id ?? grid.id,
    name: level?.name ?? grid.name ?? 'Area Map',
    width: grid.width,
    height: grid.height,
    cells,
    markers,
    player: player?.position ? { x: player.position.x, y: player.position.y } : null,
    exploredCount,
    totalCells
  };
}

function mapCellType(grid, tile, x, y, hidden) {
  if (hidden) return 'secret';
  if (!tile) return 'void';
  if (!tile.walkable) return 'wall';
  return grid.isBlockedProp?.(x, y) ? 'blocked' : 'floor';
}

function automaticObjectMarker(object, { isQuestUpdateActive, objectName, questDefs }) {
  if (!object || object.consumed || object.removed) return null;
  const interact = object.interact ?? null;
  if (!interact && !object.mapMarker) return null;
  const label = objectName(object);

  if (interact?.questUpdate && isQuestUpdateActive(interact.questUpdate)) {
    return {
      id: `quest:${objectStateId(object)}`,
      kind: 'quest',
      label: questDefs?.[interact.questUpdate.quest]?.title ?? label,
      x: object.x,
      y: object.y
    };
  }
  if (interact?.search) return baseObjectMarker(object, 'search', label);
  if (interact?.lock) return baseObjectMarker(object, 'locked', label);
  if (['door', 'secret-entrance', 'secret-exit'].includes(interact?.type)) {
    return baseObjectMarker(object, 'exit', label);
  }
  if (interact?.dialogue) return baseObjectMarker(object, 'dialogue', label);
  if (interact?.type === 'note') return baseObjectMarker(object, 'note', label);
  return null;
}

function baseObjectMarker(object, kind, label) {
  return {
    id: `${kind}:${objectStateId(object)}`,
    kind,
    label,
    x: object.x,
    y: object.y
  };
}

function addMapMarker(markers, fallback, source, { explored, hidden, objectName }) {
  const authored = normalizeAuthoredMapMarker(source?.mapMarker);
  if (authored?.hidden) return;
  if (!fallback && !authored) return;

  const x = Number(fallback?.x ?? source?.position?.x ?? source?.x);
  const y = Number(fallback?.y ?? source?.position?.y ?? source?.y);
  if (!Number.isFinite(x) || !Number.isFinite(y)) return;
  const gx = Math.round(x);
  const gy = Math.round(y);
  const key = cellKey(gx, gy);
  if (hidden.has(key)) return;

  const reveal = authored?.reveal ?? fallback?.reveal ?? 'explored';
  if (reveal !== 'always' && !explored.has(key)) return;

  const kind = MAP_MARKER_KINDS.includes(authored?.kind)
    ? authored.kind
    : MAP_MARKER_KINDS.includes(fallback?.kind)
      ? fallback.kind
      : 'note';
  const label = cleanLabel(authored?.label ?? fallback?.label ?? objectName(source));
  markers.push({
    id: String(fallback?.id ?? source?.id ?? `${kind}:${key}`),
    kind,
    label,
    x: gx,
    y: gy,
    reveal
  });
}

function normalizeAuthoredMapMarker(value) {
  if (value === false) return { hidden: true };
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return {
    kind: MAP_MARKER_KINDS.includes(value.kind) ? value.kind : null,
    label: typeof value.label === 'string' && value.label.trim() !== '' ? value.label.trim() : null,
    reveal: MAP_MARKER_REVEALS.includes(value.reveal) ? value.reveal : null
  };
}

function cleanLabel(value) {
  const label = String(value ?? '').trim();
  return label || 'Mark';
}

function defaultSourceLabel(source) {
  if (!source) return 'Mark';
  if (source.name) return source.name;
  if (source.title) return source.title;
  if (source.kind) return titleFromId(source.kind);
  if (source.id) return titleFromId(source.id);
  return 'Mark';
}

function titleFromId(value) {
  return String(value)
    .split(/[-_]/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function objectStateId(object) {
  return object?.id ?? `${object?.kind ?? 'object'}:${object?.x ?? 0},${object?.y ?? 0}`;
}

function cellKey(x, y) {
  return `${x},${y}`;
}
