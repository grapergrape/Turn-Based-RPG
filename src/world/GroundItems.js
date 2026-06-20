export const GROUND_ITEM_KIND = 'ground-item';
export const GROUND_ITEM_DEFAULT_MODEL = 'token';
export const GROUND_ITEM_PICKUP_POLICY = {
  PLAYER: 'player',
  ANY: 'any'
};

const DEFAULT_DROP_DURATION = 0.38;
const DEFAULT_PICKUP_DURATION = 0.24;

function cleanCount(count) {
  return Math.max(0, Math.floor(Number(count) || 0));
}

export function createGroundItem({
  id,
  itemId,
  itemDef = {},
  count = 1,
  x,
  y,
  tick = 0,
  source = 'player',
  pickupPolicy = GROUND_ITEM_PICKUP_POLICY.PLAYER
}) {
  const amount = cleanCount(count);
  if (!id || !itemId || amount <= 0 || !Number.isFinite(x) || !Number.isFinite(y)) return null;
  return {
    id,
    kind: GROUND_ITEM_KIND,
    itemId,
    name: itemDef.name ?? itemId,
    model: itemDef.groundModel ?? GROUND_ITEM_DEFAULT_MODEL,
    count: amount,
    x,
    y,
    blocking: false,
    consumed: false,
    source,
    pickupPolicy,
    interact: { type: 'ground-item' },
    droppedAt: tick,
    pickupStart: null,
    dropDuration: DEFAULT_DROP_DURATION,
    pickupDuration: DEFAULT_PICKUP_DURATION
  };
}

export function serializeGroundItem(item) {
  if (!item || item.consumed) return null;
  return {
    id: item.id,
    kind: GROUND_ITEM_KIND,
    itemId: item.itemId,
    name: item.name,
    model: item.model ?? GROUND_ITEM_DEFAULT_MODEL,
    count: cleanCount(item.count),
    x: item.x,
    y: item.y,
    source: item.source ?? 'player',
    pickupPolicy: item.pickupPolicy ?? GROUND_ITEM_PICKUP_POLICY.PLAYER,
    droppedAt: null,
    dropDuration: item.dropDuration ?? DEFAULT_DROP_DURATION,
    pickupDuration: item.pickupDuration ?? DEFAULT_PICKUP_DURATION
  };
}

export function hydrateGroundItem(snapshot) {
  if (!snapshot?.itemId || !Number.isFinite(snapshot.x) || !Number.isFinite(snapshot.y)) return null;
  return {
    ...snapshot,
    id: snapshot.id ?? `ground-${snapshot.itemId}-${snapshot.x}-${snapshot.y}`,
    kind: GROUND_ITEM_KIND,
    count: cleanCount(snapshot.count) || 1,
    name: snapshot.name ?? snapshot.itemId,
    model: snapshot.model ?? GROUND_ITEM_DEFAULT_MODEL,
    blocking: false,
    consumed: false,
    pickupStart: null,
    droppedAt: snapshot.droppedAt ?? null,
    pickupPolicy: snapshot.pickupPolicy ?? GROUND_ITEM_PICKUP_POLICY.PLAYER,
    interact: { type: 'ground-item' },
    dropDuration: snapshot.dropDuration ?? DEFAULT_DROP_DURATION,
    pickupDuration: snapshot.pickupDuration ?? DEFAULT_PICKUP_DURATION
  };
}

export function canActorPickupGroundItem(actor, item) {
  if (!actor || !item || item.consumed) return false;
  if (actor.type === 'player') return true;
  return item.pickupPolicy === GROUND_ITEM_PICKUP_POLICY.ANY || item.canNpcPickup === true;
}

export function isGroundItemPickupComplete(item, tick) {
  if (!item?.consumed || item.pickupStart == null) return false;
  return (tick - item.pickupStart) >= (item.pickupDuration ?? DEFAULT_PICKUP_DURATION);
}
