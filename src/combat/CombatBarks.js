function cleanLines(value) {
  return [].concat(value ?? [])
    .filter((line) => typeof line === 'string' && line.trim() !== '');
}

function randomEntry(entries, random = Math.random) {
  if (!Array.isArray(entries) || entries.length === 0) return null;
  const roll = typeof random === 'function' ? random() : Math.random();
  const index = Math.max(0, Math.min(entries.length - 1, Math.floor(roll * entries.length)));
  return entries[index];
}

export function combatStartBarkLines({ level = null, trigger = null } = {}) {
  const triggerLines = cleanLines(trigger?.combatStartBarks);
  if (triggerLines.length > 0) return triggerLines;
  return cleanLines(level?.combatStartBarks);
}

export function chooseCombatStartBark({ combatants = [], lines = [], random = Math.random } = {}) {
  const speakers = combatants.filter((actor) => actor && !actor.isDead);
  const clean = cleanLines(lines);
  if (speakers.length === 0 || clean.length === 0) return null;
  return {
    speaker: randomEntry(speakers, random),
    line: randomEntry(clean, random)
  };
}
