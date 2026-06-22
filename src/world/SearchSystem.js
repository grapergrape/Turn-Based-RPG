// Data-driven exploration checks for evidence, hidden loot, and route hints.
// Search resolves checks only. Game owns UI, effects, and character ratings.

const DEFAULT_SEARCH_FIELD = 'search';

function lines(value) {
  return [].concat(value ?? []).filter((line) => typeof line === 'string' && line.trim() !== '');
}

function numeric(value, fallback) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function methodCheck(method, { fieldRating, primaryRating } = {}) {
  if (typeof method?.primary === 'string') {
    const rating = numeric(primaryRating?.(method.primary), Number.NEGATIVE_INFINITY);
    const dc = numeric(method.dc, 0);
    return { kind: 'primary', id: method.primary, rating, dc, success: rating >= dc };
  }

  const fieldId = typeof method?.field === 'string' ? method.field : DEFAULT_SEARCH_FIELD;
  const rating = numeric(fieldRating?.(fieldId), Number.NEGATIVE_INFINITY);
  const dc = numeric(method?.dc, 0);
  return { kind: 'field', id: fieldId, rating, dc, success: rating >= dc };
}

function completedSet(object) {
  if (!object) return new Set();
  if (object.searchCompleted instanceof Set) return object.searchCompleted;
  const authored = Array.isArray(object.searchCompleted) ? object.searchCompleted : [];
  object.searchCompleted = new Set(authored.filter((id) => typeof id === 'string'));
  return object.searchCompleted;
}

export function objectSearch(object) {
  const search = object?.interact?.search;
  return search && typeof search === 'object' && !Array.isArray(search) ? search : null;
}

export function searchTitle(search, fallback = 'Search') {
  return typeof search?.title === 'string' && search.title.trim() !== ''
    ? search.title
    : fallback;
}

export function searchLines(search, fallback = 'You take a closer look.') {
  const authored = lines(search?.lines);
  return authored.length ? authored : [fallback];
}

export function searchMethods(search) {
  return Array.isArray(search?.methods)
    ? search.methods.filter((method) => method && typeof method === 'object' && !Array.isArray(method))
    : [];
}

export function searchMethodById(search, methodId) {
  return searchMethods(search).find((method) => method.id === methodId) ?? null;
}

export function searchMethodCompleted(object, method) {
  if (!method || method.repeat === true) return false;
  return completedSet(object).has(method.id);
}

export function completeSearchMethod(object, method) {
  if (!object || !method?.id || method.repeat === true) return false;
  completedSet(object).add(method.id);
  return true;
}

export function searchCompletedIds(object) {
  return [...completedSet(object)];
}

export function restoreSearchCompleted(object, ids = []) {
  if (!object) return;
  object.searchCompleted = new Set([].concat(ids ?? []).filter((id) => typeof id === 'string'));
}

export function searchMethodStatus(method, { inventory, fieldRating, primaryRating } = {}) {
  if (!method) {
    return { available: false, reason: 'missing-method', requiredItem: null, check: null, success: false };
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

  const check = methodCheck(method, { fieldRating, primaryRating });
  return {
    available: true,
    reason: null,
    requiredItem,
    check,
    success: check.success
  };
}

export function resolveSearchMethod(method, context = {}) {
  const status = searchMethodStatus(method, context);
  if (!status.available) {
    const itemName = status.requiredItem && context.itemName
      ? context.itemName(status.requiredItem)
      : status.requiredItem;
    const fallback = itemName ? `You need ${itemName}.` : 'That search will not work.';
    return {
      outcome: 'unavailable',
      success: false,
      completed: false,
      logs: lines(method?.unavailableLog).length ? lines(method.unavailableLog) : [fallback],
      effects: null,
      status
    };
  }

  const success = status.success;
  return {
    outcome: success ? 'success' : 'failure',
    success,
    completed: success && method?.repeat !== true,
    logs: lines(success ? method.successLog : method.failLog),
    effects: success ? method.success : method.failure,
    status
  };
}
