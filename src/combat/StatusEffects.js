export const STATUS_DEFINITIONS = Object.freeze({
  studied: Object.freeze({
    id: 'studied',
    label: 'Studied',
    defaultDuration: 3,
    maxStacks: 1
  }),
  burning: Object.freeze({
    id: 'burning',
    label: 'Burning',
    defaultDuration: 2,
    maxStacks: 3,
    tickDamage: 2
  }),
  snared: Object.freeze({
    id: 'snared',
    label: 'Snared',
    defaultDuration: 1,
    maxStacks: 1
  }),
  overwatch: Object.freeze({
    id: 'overwatch',
    label: 'Overwatch',
    defaultDuration: 1,
    maxStacks: 1
  }),
  'guard-broken': Object.freeze({
    id: 'guard-broken',
    label: 'Broken Guard',
    defaultDuration: 2,
    maxStacks: 1
  }),
  'off-balance': Object.freeze({
    id: 'off-balance',
    label: 'Off Balance',
    defaultDuration: 2,
    maxStacks: 1
  }),
  rattled: Object.freeze({
    id: 'rattled',
    label: 'Rattled',
    defaultDuration: 2,
    maxStacks: 1
  }),
  suppressed: Object.freeze({
    id: 'suppressed',
    label: 'Suppressed',
    defaultDuration: 2,
    maxStacks: 1
  }),
  rallied: Object.freeze({
    id: 'rallied',
    label: 'Rallied',
    defaultDuration: 2,
    maxStacks: 1
  }),
  braced: Object.freeze({
    id: 'braced',
    label: 'Braced',
    defaultDuration: 2,
    maxStacks: 1
  }),
  prepared: Object.freeze({
    id: 'prepared',
    label: 'Prepared',
    defaultDuration: 2,
    maxStacks: 1
  }),
  faded: Object.freeze({
    id: 'faded',
    label: 'Faded',
    defaultDuration: 2,
    maxStacks: 1
  }),
  fatigued: Object.freeze({
    id: 'fatigued',
    label: 'Fatigued',
    defaultDuration: 3,
    maxStacks: 1
  }),
  stimmed: Object.freeze({
    id: 'stimmed',
    label: 'Stimmed',
    defaultDuration: 99,
    maxStacks: 1
  }),
  sealed: Object.freeze({
    id: 'sealed',
    label: 'Sealed',
    defaultDuration: 1,
    maxStacks: 1
  }),
  'low-step-spent': Object.freeze({
    id: 'low-step-spent',
    label: 'Low Step Spent',
    defaultDuration: 1,
    maxStacks: 1,
    hidden: true
  }),
  'riposte-spent': Object.freeze({
    id: 'riposte-spent',
    label: 'Riposte Spent',
    defaultDuration: 1,
    maxStacks: 1,
    hidden: true
  })
});

export function statusDefinition(statusId) {
  return STATUS_DEFINITIONS[statusId] ?? null;
}

export function ensureStatusList(actor) {
  if (!actor) return [];
  if (!Array.isArray(actor.statuses)) actor.statuses = [];
  return actor.statuses;
}

export function applyStatus(actor, spec = {}) {
  const id = typeof spec.id === 'string' ? spec.id : '';
  const definition = statusDefinition(id);
  if (!actor || !definition) return null;

  const statuses = ensureStatusList(actor);
  const existing = statuses.find((status) => status.id === id);
  const maxStacks = finiteWhole(spec.maxStacks, definition.maxStacks ?? 1);
  const duration = finiteWhole(spec.duration, definition.defaultDuration ?? 1);
  const stacks = Math.max(1, Math.min(maxStacks, finiteWhole(spec.stacks, 1)));
  const data = spec.data && typeof spec.data === 'object' && !Array.isArray(spec.data)
    ? { ...spec.data }
    : {};

  if (existing) {
    existing.remainingTurns = Math.max(existing.remainingTurns ?? 0, duration);
    existing.stacks = Math.min(maxStacks, (existing.stacks ?? 1) + stacks);
    existing.power = Math.max(existing.power ?? 0, finiteWhole(spec.power, 0));
    existing.sourceId = spec.sourceId ?? existing.sourceId ?? null;
    existing.sourceName = spec.sourceName ?? existing.sourceName ?? null;
    existing.data = { ...(existing.data ?? {}), ...data };
    return existing;
  }

  const status = {
    id,
    label: definition.label,
    remainingTurns: duration,
    stacks,
    power: finiteWhole(spec.power, 0),
    sourceId: spec.sourceId ?? null,
    sourceName: spec.sourceName ?? null,
    data
  };
  statuses.push(status);
  return status;
}

export function getStatus(actor, statusId) {
  return ensureStatusList(actor).find((status) => status.id === statusId) ?? null;
}

export function hasStatus(actor, statusId) {
  return Boolean(getStatus(actor, statusId));
}

export function removeStatus(actor, statusId) {
  const statuses = ensureStatusList(actor);
  const before = statuses.length;
  actor.statuses = statuses.filter((status) => status.id !== statusId);
  return actor.statuses.length !== before;
}

export function clearStatuses(actor) {
  if (actor) actor.statuses = [];
}

export function visibleStatuses(actor) {
  return ensureStatusList(actor)
    .filter((status) => {
      const definition = statusDefinition(status.id);
      return definition && !definition.hidden;
    })
    .map((status) => ({
      id: status.id,
      label: status.label ?? statusDefinition(status.id)?.label ?? status.id,
      stacks: status.stacks ?? 1,
      remainingTurns: status.remainingTurns ?? 0
    }));
}

export function tickActorStatuses(actor, callbacks = {}) {
  if (!actor || actor.isDead) return [];
  const logs = [];
  for (const status of [...ensureStatusList(actor)]) {
    if (status.id === 'burning') {
      const definition = statusDefinition(status.id);
      const damage = Math.max(1, finiteWhole(status.power, definition?.tickDamage ?? 1));
      const killed = callbacks.damageActor
        ? callbacks.damageActor(actor, damage, status)
        : actor.takeDamage(damage);
      callbacks.effect?.({
        type: 'spark',
        x: actor.position.x,
        y: actor.position.y,
        text: `-${damage}`
      });
      logs.push(`${actor.name} burns for ${damage}.`);
      if (killed) logs.push(`${actor.name} falls.`);
    }

    status.remainingTurns = Math.max(0, (status.remainingTurns ?? 0) - 1);
    if (status.remainingTurns <= 0) removeStatus(actor, status.id);
    if (actor.isDead) break;
  }
  return logs;
}

function finiteWhole(value, fallback) {
  return Number.isFinite(value) ? Math.max(0, Math.round(value)) : fallback;
}
