import { buildCharacterSheet } from './Progression.js';
import { buildTechniqueSheet } from './TechniqueSystem.js';

export const JOURNAL_SECTIONS = ['QUESTS', 'MAP', 'NOTES', 'FACTIONS', 'CHARACTER', 'SCARS', 'TECHNIQUES', 'DRONE'];
export const JOURNAL_TURN_DURATION = 0.46;
export const JOURNAL_UPDATE_SECTIONS = ['QUESTS', 'NOTES', 'FACTIONS'];

export function visibleJournalSections({ attendantAvailable = false } = {}) {
  return JOURNAL_SECTIONS.filter((section) => section !== 'DRONE' || attendantAvailable);
}

function mergeDefinitions(collections, identityFor) {
  const merged = [];
  const seen = new Set();
  for (const collection of collections) {
    for (const definition of Array.isArray(collection) ? collection : []) {
      const identity = identityFor(definition);
      if (seen.has(identity)) continue;
      seen.add(identity);
      merged.push(definition);
    }
  }
  return merged;
}

function journalNoteIdentity(note) {
  if (typeof note?.id === 'string' && note.id.trim() !== '') return `id:${note.id}`;
  const questStages = note?.questStage && typeof note.questStage === 'object'
    ? Object.entries(note.questStage).sort(([left], [right]) => left.localeCompare(right))
    : [];
  return JSON.stringify(['note', note?.flag ?? null, questStages, note?.text ?? '']);
}

function codexIdentity(entry) {
  if (typeof entry?.id === 'string' && entry.id.trim() !== '') return `id:${entry.id}`;
  if (typeof entry?.name === 'string' && entry.name.trim() !== '') return `name:${entry.name}`;
  return `entry:${JSON.stringify(entry)}`;
}

export function mergeJournalNotes(...collections) {
  return mergeDefinitions(collections, journalNoteIdentity);
}

export function mergeCodexDefinitions(...collections) {
  return mergeDefinitions(collections, codexIdentity);
}

export function buildJournalState({
  section = 0,
  turn = null,
  factionIndex = 0,
  evidenceIndex = 0,
  questDefs = {},
  questStages = new Map(),
  questReached = new Map(),
  journalNotes = [],
  codexDefs = [],
  flags = new Set(),
  player = null,
  techniqueDefs = {},
  techniqueContext = {},
  primaryIndex = 0,
  techniqueIndex = 0,
  time = null,
  map = null,
  drone = null
} = {}) {
  const character = buildCharacterSheet(player ?? {});
  const techniques = buildTechniqueSheet(player?.progression, techniqueDefs, techniqueContext);
  const sections = visibleJournalSections({ attendantAvailable: Boolean(drone?.recruited) });
  const findings = buildJournalFindings({ questDefs, questReached, journalNotes, flags });
  return {
    section: Math.max(0, Math.min(sections.length - 1, Math.floor(Number(section) || 0))),
    sections,
    turn: journalTurnState(turn),
    factionIndex,
    evidenceIndex: Math.max(0, Math.floor(Number(evidenceIndex) || 0)),
    time,
    quests: journalQuests({ questDefs, questStages, questReached, flags }),
    map,
    findings,
    factions: journalFactions({ codexDefs, flags, questReached }),
    character,
    primaryIndex,
    techniques: {
      activePoints: character.activeTechniquePoints ?? 0,
      passivePoints: character.passiveTechniquePoints ?? 0,
      selectedIndex: techniqueIndex,
      entries: techniques
    },
    drone
  };
}

// The player-facing journal is assembled from several independent pieces of
// run state. Keep a compact picture of only the sections that investigation
// can change so the game can announce discoveries without coupling every
// interaction, dialogue effect, and quest update to the UI.
export function buildJournalUpdateSnapshot({
  questDefs = {},
  questStages = new Map(),
  questReached = new Map(),
  journalNotes = [],
  codexDefs = [],
  flags = new Set()
} = {}) {
  const context = { questDefs, questStages, questReached, journalNotes, codexDefs, flags };
  return {
    QUESTS: JSON.stringify(journalQuests(context)),
    NOTES: JSON.stringify(buildJournalFindings(context)),
    FACTIONS: JSON.stringify(journalFactions(context).filter((entry) => entry.known))
  };
}

export function journalUpdatedSections(previous, current) {
  if (!previous || !current) return [];
  return JOURNAL_UPDATE_SECTIONS.filter((section) => previous[section] !== current[section]);
}

export function journalTurnState(turn) {
  if (!turn) return null;
  const duration = turn.duration || JOURNAL_TURN_DURATION;
  return {
    from: turn.from,
    to: turn.to,
    direction: turn.direction,
    progress: Math.max(0, Math.min(1, turn.age / duration))
  };
}

export function journalConditionMet(spec, { flags = new Set(), questReached = new Map() } = {}) {
  if (!spec) return true;
  if (spec.flag && flags.has(spec.flag)) return true;
  if (spec.questStage) {
    for (const [questId, stageId] of Object.entries(spec.questStage)) {
      if ((questReached.get(questId) ?? new Set()).has(stageId)) return true;
    }
  }
  if (!spec.flag && !spec.questStage) return true;
  return false;
}

function journalQuests({ questDefs, questStages, questReached, flags }) {
  const quests = [];
  for (const quest of Object.values(questDefs)) {
    if (quest.unlockedBy && !journalConditionMet(quest.unlockedBy, { flags, questReached })) continue;
    const stages = quest.stages ?? [];
    const reached = questReached.get(quest.id) ?? new Set();
    const currentStage = questStages.get(quest.id);
    const isComplete = reached.has('complete') || currentStage === 'complete';
    let bestIdx = -1;
    stages.forEach((stage, i) => { if (reached.has(stage.id)) bestIdx = Math.max(bestIdx, i); });
    const headStage = stages[bestIdx] ?? stages.find((stage) => stage.id === currentStage) ?? stages[0] ?? null;
    const objectives = (quest.objectives ?? [])
      .filter((obj) => !obj.reveal || reached.has(obj.reveal))
      .map((obj) => {
        if (obj.lead) return { text: obj.text, done: false, active: false, lead: true };
        const done = isComplete || (obj.stage ? reached.has(obj.stage) : false);
        return { text: obj.text, done, active: false, lead: false };
      });
    const firstOpen = objectives.find((obj) => !obj.lead && !obj.done);
    if (firstOpen) {
      firstOpen.active = true;
    } else {
      const lead = objectives.find((obj) => obj.lead);
      if (lead) lead.active = true;
    }
    quests.push({
      title: quest.title ?? quest.id,
      task: headStage?.task ?? null,
      note: headStage?.description ?? '',
      complete: isComplete,
      objectives
    });
  }
  return quests;
}

export function buildJournalFindings({
  questDefs = {},
  questReached = new Map(),
  journalNotes = [],
  flags = new Set()
} = {}) {
  const findings = [];
  for (const quest of Object.values(questDefs)) {
    const reached = questReached.get(quest.id) ?? new Set();
    for (const stage of quest.stages ?? []) {
      if (reached.has(stage.id) && stage.description) findings.push(stage.description);
    }
  }
  for (const note of journalNotes ?? []) {
    if (note.text && journalConditionMet(note, { flags, questReached })) findings.push(note.text);
  }
  return findings;
}

function journalFactions({ codexDefs, flags, questReached }) {
  return (codexDefs ?? []).map((entry) => ({
    name: entry.name,
    kind: entry.kind ?? '',
    summary: entry.summary ?? '',
    facts: entry.facts ?? [],
    known: !entry.unlockedBy || journalConditionMet(entry.unlockedBy, { flags, questReached })
  }));
}
