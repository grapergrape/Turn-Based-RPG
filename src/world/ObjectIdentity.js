export function objectStateKey(object) {
  const id = object?.id;
  return typeof id === 'string' && id.trim() !== '' ? id : null;
}

export function isStatefulInteractable(object) {
  if (!object || typeof object !== 'object') return false;
  const interact = object.interact;
  if (!interact || typeof interact !== 'object' || Array.isArray(interact)) return false;
  return Boolean(
    interact.type ||
      interact.lock ||
      interact.search ||
      interact.dialogue ||
      interact.lockedDialogue ||
      interact.questUpdate ||
      (Array.isArray(interact.loot) && interact.loot.length > 0) ||
      object.blocking ||
      object.doorGroup ||
      object.passableWhenOpen !== undefined
  );
}
