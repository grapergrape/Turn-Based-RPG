import { buildCharacterSheet } from './Progression.js';
import { buildTechniqueSheet } from './TechniqueSystem.js';

export const JOURNAL_SECTIONS = ['QUESTS', 'NOTES', 'FACTIONS', 'CHARACTER', 'SCARS', 'TECHNIQUES'];
export const JOURNAL_TURN_DURATION = 0.46;

export function buildJournalState({
  section = 0,
  turn = null,
  factionIndex = 0,
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
  techniqueIndex = 0
} = {}) {
  const character = buildCharacterSheet(player);
  const techniques = buildTechniqueSheet(player?.progression, techniqueDefs, techniqueContext);
  return {
    section,
    sections: JOURNAL_SECTIONS,
    turn: journalTurnState(turn),
    factionIndex,
    quests: journalQuests({ questDefs, questStages, questReached }),
    findings: journalFindings({ questDefs, questReached, journalNotes, flags }),
    factions: journalFactions({ codexDefs, flags, questReached }),
    character,
    primaryIndex,
    techniques: {
      activePoints: character.activeTechniquePoints ?? 0,
      passivePoints: character.passiveTechniquePoints ?? 0,
      selectedIndex: techniqueIndex,
      entries: techniques
    }
  };
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

function journalQuests({ questDefs, questStages, questReached }) {
  const quests = [];
  for (const quest of Object.values(questDefs)) {
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

function journalFindings({ questDefs, questReached, journalNotes, flags }) {
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
