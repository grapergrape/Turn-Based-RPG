// Data-driven door state helpers. Door objects stay authored in level JSON,
// while this module keeps linked leaves, open state, and grid passability in one
// small world-system boundary.

export function isDoorObject(object) {
  return object?.interact?.type === 'door';
}

export function isOpenDoorObject(object) {
  return isDoorObject(object) && Boolean(object.opened);
}

export function isPassableWhenOpen(object) {
  return Boolean(object?.passableWhenOpen) || isDoorObject(object);
}

export function objectGroupId(object) {
  const group = object?.doorGroup ?? object?.interact?.doorGroup;
  return typeof group === 'string' && group.trim() !== '' ? group : null;
}

export function linkedObjects(object, objects = []) {
  const group = objectGroupId(object);
  if (!group) return object ? [object] : [];
  return objects.filter((candidate) => objectGroupId(candidate) === group);
}

export function syncObjectPassability(object, grid) {
  if (!object?.opened || !isPassableWhenOpen(object)) return;
  grid?.removeBlocked?.(object.x, object.y);
}

export function unlockLinkedObjects(object, objects = []) {
  const members = linkedObjects(object, objects);
  for (const member of members) member.unlocked = true;
  return members;
}

export function openLinkedObjects(object, objects = [], { grid = null, now = null } = {}) {
  const members = unlockLinkedObjects(object, objects);
  for (const member of members) {
    member.opened = true;
    if (member.openedAt == null) member.openedAt = now;
    syncObjectPassability(member, grid);
  }
  return members;
}
