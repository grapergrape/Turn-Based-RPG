// Data-driven fieldcraft locks for interactable world objects. This module
// resolves lock methods without knowing what the locked object means in lore.

function lines(value) {
  return [].concat(value ?? []).filter((line) => typeof line === 'string' && line.trim() !== '');
}

function numeric(value, fallback) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

export function objectLock(object) {
  const lock = object?.interact?.lock;
  return lock && typeof lock === 'object' && !Array.isArray(lock) ? lock : null;
}

export function isObjectLocked(object) {
  return Boolean(objectLock(object)) && !object?.unlocked && !object?.opened && !object?.consumed;
}

export function lockTitle(lock, fallback = 'Locked') {
  return typeof lock?.title === 'string' && lock.title.trim() !== ''
    ? lock.title
    : fallback;
}

export function lockLines(lock, fallback = 'It is locked.') {
  const authored = lines(lock?.lines ?? lock?.lockedLines);
  return authored.length ? authored : [fallback];
}

export function lockMethods(lock) {
  return Array.isArray(lock?.methods)
    ? lock.methods.filter((method) => method && typeof method === 'object' && !Array.isArray(method))
    : [];
}

export function lockMethodById(lock, methodId) {
  return lockMethods(lock).find((method) => method.id === methodId) ?? null;
}

export function lockMethodStatus(method, { inventory, fieldRating, primaryRating } = {}) {
  if (!method) {
    return { available: false, reason: 'missing-method', check: null, success: false };
  }

  const requiredItem = typeof method.requiresItem === 'string' ? method.requiresItem : null;
  if (requiredItem && !inventory?.has(requiredItem)) {
    return {
      available: false,
      reason: 'missing-item',
      requiredItem,
      check: null,
      success: false
    };
  }

  let check = null;
  if (typeof method.field === 'string') {
    const rating = numeric(fieldRating?.(method.field), Number.NEGATIVE_INFINITY);
    const dc = numeric(method.dc, 0);
    check = { kind: 'field', id: method.field, rating, dc, success: rating >= dc };
  } else if (typeof method.primary === 'string') {
    const rating = numeric(primaryRating?.(method.primary), Number.NEGATIVE_INFINITY);
    const dc = numeric(method.dc, 0);
    check = { kind: 'primary', id: method.primary, rating, dc, success: rating >= dc };
  }

  return {
    available: true,
    reason: null,
    requiredItem,
    check,
    success: check ? check.success : true
  };
}

export function resolveLockMethod(method, context = {}) {
  const status = lockMethodStatus(method, context);
  if (!status.available) {
    const itemName = status.requiredItem && context.itemName
      ? context.itemName(status.requiredItem)
      : status.requiredItem;
    const fallback = itemName ? `You need ${itemName}.` : 'That will not work.';
    return {
      outcome: 'unavailable',
      success: false,
      unlocked: false,
      openOnSuccess: false,
      logs: lines(method?.unavailableLog).length ? lines(method.unavailableLog) : [fallback],
      effects: null,
      status
    };
  }

  const success = status.success;
  return {
    outcome: success ? 'success' : 'failure',
    success,
    unlocked: success && method.unlocks !== false,
    openOnSuccess: success && method.openOnSuccess !== false,
    logs: lines(success ? method.successLog : method.failLog),
    effects: success ? method.success : method.failure,
    status
  };
}
