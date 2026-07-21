import { isPassableWhenOpen } from './DoorSystem.js';

function matchesAnyFlag(rule, flags) {
  return [].concat(rule ?? []).some((flag) =>
    typeof flag === 'string' && flags?.has?.(flag)
  );
}

// Apply authored, run-global flag rules to a loaded object. The derived fields
// are runtime-only. They keep render, targeting, and map systems in agreement
// without teaching those systems the meaning of a story flag.
export function syncObjectFlagState(object, flags, { grid = null } = {}) {
  if (!object || typeof object !== 'object') return false;
  let changed = false;

  const waitsForVisibleFlag = Array.isArray(object.visibleWhenFlags) && object.visibleWhenFlags.length > 0;
  const hiddenByFlag = matchesAnyFlag(object.hiddenWhenFlags, flags) ||
    (waitsForVisibleFlag && !matchesAnyFlag(object.visibleWhenFlags, flags));
  if (Boolean(object.hiddenByFlag) !== hiddenByFlag) {
    object.hiddenByFlag = hiddenByFlag;
    if (object.blocking && !(object.opened && isPassableWhenOpen(object))) {
      if (hiddenByFlag) grid?.removeBlocked?.(object.x, object.y);
      else grid?.addBlocked?.(object.x, object.y);
    }
    changed = true;
  }

  const disabledByFlag = matchesAnyFlag(object.disabledWhenFlags, flags);
  if (Boolean(object.disabledByFlag) !== disabledByFlag) {
    object.disabledByFlag = disabledByFlag;
    changed = true;
  }

  const closedByFlag = matchesAnyFlag(object.closedWhenFlags, flags);
  if (Boolean(object.closedByFlag) !== closedByFlag) {
    object.closedByFlag = closedByFlag;
    changed = true;
  }
  if (closedByFlag && object.opened) {
    object.opened = false;
    object.openedAt = null;
    if (object.blocking && isPassableWhenOpen(object)) {
      grid?.addBlocked?.(object.x, object.y);
    }
    changed = true;
  }

  return changed;
}
