export function meetsDialogueConditions(conditions, state = {}) {
  if (!conditions) return true;

  const flags = state.flags ?? new Set();
  const questStages = state.questStages ?? new Map();
  const hasScar = state.hasScar ?? (() => false);
  const fieldRating = state.fieldRating ?? (() => Number.NEGATIVE_INFINITY);
  const traceValue = state.traceValue ?? (() => 0);

  for (const flag of [].concat(conditions.flag ?? [], conditions.flags ?? [])) {
    if (!flags.has(flag)) return false;
  }
  for (const flag of [].concat(conditions.notFlag ?? [], conditions.flagsAbsent ?? [])) {
    if (flags.has(flag)) return false;
  }
  for (const [questId, stage] of Object.entries(conditions.questStages ?? {})) {
    if (questStages.get(questId) !== stage) return false;
  }
  for (const scarId of [].concat(conditions.scar ?? [], conditions.scars ?? [])) {
    if (!hasScar(scarId)) return false;
  }
  for (const scarId of [].concat(conditions.notScar ?? [], conditions.scarsAbsent ?? [])) {
    if (hasScar(scarId)) return false;
  }
  for (const [scarId, rank] of Object.entries(conditions.scarRanks ?? {})) {
    if (!hasScar(scarId, rank)) return false;
  }
  for (const [fieldId, minimum] of Object.entries(conditions.fieldRatings ?? {})) {
    if (typeof minimum !== 'number' || fieldRating(fieldId) < minimum) return false;
  }
  if (conditions.traceMin !== undefined && traceValue() < conditions.traceMin) return false;
  if (conditions.traceMax !== undefined && traceValue() > conditions.traceMax) return false;
  return true;
}
