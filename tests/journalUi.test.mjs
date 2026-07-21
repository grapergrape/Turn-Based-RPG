import assert from 'node:assert/strict';

import { buildCharacterSheet } from '../src/core/Progression.js';
import {
  JOURNAL_SECTIONS,
  buildJournalState,
  buildJournalUpdateSnapshot,
  journalUpdatedSections,
  visibleJournalSections
} from '../src/core/JournalState.js';
import { installGameRuntimeState } from '../src/core/game/GameRuntimeState.js';
import {
  JOURNAL_NOTICE_DURATION,
  JOURNAL_NOTICE_POLL_INTERVAL
} from '../src/core/game/runtimeConstants.js';
import { UIRenderer } from '../src/render/UIRenderer.js';
import {
  JOURNAL_ARROW_BOXES,
  JOURNAL_TECHNIQUE_LIST,
  journalArrowAt,
  journalEvidenceWindow,
  journalTabAt,
  journalTabBoxes,
  journalTechniqueRowAt,
  journalTechniqueWindow
} from '../src/ui/journalLayout.js';
import {
  ledgerTextWidth,
  normalizeLedgerText
} from '../src/render/ui/JournalTypography.js';

function mockCtx() {
  return {
    canvas: { width: 640, height: 480 },
    imageSmoothingEnabled: false,
    save() {},
    restore() {},
    fillRect() {},
    drawImage() {},
    set fillStyle(value) { this._fillStyle = value; },
    get fillStyle() { return this._fillStyle; }
  };
}

const character = buildCharacterSheet({
  name: 'Test Agent',
  role: 'Cult-Breaker, Ashen Censure',
  progression: {
    primaries: {
      body: 5,
      agility: 6,
      eye: 6,
      intelligence: 4,
      religion: 5,
      voice: 4,
      nerve: 6
    },
    trace: 0,
    iconRisk: 'not-assessed',
    scarPoints: 0,
    scars: [
      {
        id: 'failed-quarantine',
        name: 'Failed Quarantine',
        rank: 1,
        modifiers: { containment: 5 },
        summary: 'You remember the wrong door.',
        cost: 'Rescue scenes press harder.'
      }
    ]
  }
});

const baseUi = {
  screen: 'journal',
  actorName: 'Test Agent',
  role: 'Cult-Breaker, Ashen Censure',
  mode: 'EXPLORE',
  hp: 14,
  maxHp: 14,
  ap: 6,
  maxAp: 6,
  inventoryItems: [],
  carryWeight: 0,
  maxCarryWeight: 10,
  controls: ['A/D Turn Page', 'J/Esc Close'],
  log: []
};

const renderer = new UIRenderer();
const denseTechniques = Array.from({ length: 26 }, (_, index) => ({
  id: `method-${String(index + 1).padStart(2, '0')}`,
  name: `Filed Method ${String(index + 1).padStart(2, '0')}`,
  type: index % 3 === 0 ? 'passive' : 'active',
  known: index < 3,
  canLearn: index === 25,
  summary: 'A controlled field procedure for breaking a hostile rite.',
  requirementText: index === 25 ? 'Nerve 6+' : 'No requirements',
  disabledReason: index === 25 ? '' : 'Requirements not met.'
}));

const map = {
  id: 'test-map',
  name: 'Test Map',
  width: 6,
  height: 4,
  exploredCount: 10,
  totalCells: 24,
  cells: Array.from({ length: 4 }, (_, y) =>
    Array.from({ length: 6 }, (_, x) => ({
      x,
      y,
      key: `${x},${y}`,
      explored: x < 4,
      hidden: x === 5,
      type: x === 0 ? 'wall' : x === 3 ? 'blocked' : 'floor'
    }))
  ).flat(),
  markers: [
    { id: 'player', kind: 'player', label: 'Test Agent', x: 1, y: 1, reveal: 'always' },
    { id: 'quest:test', kind: 'quest', label: 'Test Writ', x: 2, y: 1, reveal: 'explored' },
    { id: 'dialogue:test', kind: 'dialogue', label: 'Test Contact', x: 3, y: 2, reveal: 'explored' }
  ],
  player: { x: 1, y: 1 }
};

const time = {
  dateLabel: 'FIELD DAY 1, YEAR 130 AFTER DESCENT',
  timeLabel: '08:00',
  phaseLabel: 'MORNING'
};

assert.deepEqual(
  visibleJournalSections(),
  JOURNAL_SECTIONS.filter((section) => section !== 'DRONE')
);
assert.deepEqual(
  visibleJournalSections({ attendantAvailable: true }),
  JOURNAL_SECTIONS
);
assert.equal(buildJournalState({ drone: { recruited: false } }).sections.includes('DRONE'), false);
assert.equal(buildJournalState({ drone: { recruited: true } }).sections.includes('DRONE'), true);

for (let section = 0; section < JOURNAL_SECTIONS.length; section += 1) {
  renderer.draw(mockCtx(), {
    ...baseUi,
    journal: {
      section,
      sections: JOURNAL_SECTIONS,
      factionIndex: 0,
      primaryIndex: 0,
      time,
      map,
      quests: [],
      findings: [],
      factions: [],
      character,
      techniques: {
        activePoints: 1,
        passivePoints: 1,
        selectedIndex: section === JOURNAL_SECTIONS.indexOf('TECHNIQUES') ? 25 : 0,
        entries: denseTechniques
      }
    }
  });
}

renderer.draw(mockCtx(), {
  ...baseUi,
  journal: {
    section: 4,
    sections: JOURNAL_SECTIONS,
    turn: { from: 3, to: 4, direction: 1, progress: 0.5 },
    factionIndex: 0,
    time,
    map,
    quests: [],
    findings: [],
    factions: [],
    character,
    techniques: {
      activePoints: 0,
      passivePoints: 0,
      selectedIndex: 0,
      entries: []
    }
  }
});

assert.equal(journalArrowAt({
  x: JOURNAL_ARROW_BOXES.prev.x + 2,
  y: JOURNAL_ARROW_BOXES.prev.y + 2
}), 'prev');
assert.equal(journalArrowAt({
  x: JOURNAL_ARROW_BOXES.next.x + 2,
  y: JOURNAL_ARROW_BOXES.next.y + 2
}), 'next');
assert.equal(journalArrowAt({ x: 320, y: 200 }), null);

const tabBoxes = journalTabBoxes(JOURNAL_SECTIONS.length);
assert.equal(tabBoxes.length, JOURNAL_SECTIONS.length);
assert.deepEqual(journalTabBoxes(0), []);
assert.equal(journalTabAt({ x: tabBoxes[6].x + 2, y: tabBoxes[6].y + 2 }, JOURNAL_SECTIONS.length), 6);
assert.equal(journalTabAt({ x: 320, y: 200 }, JOURNAL_SECTIONS.length), null);

const firstTechniqueWindow = journalTechniqueWindow(denseTechniques, 0);
assert.equal(firstTechniqueWindow.start, 0);
assert.equal(firstTechniqueWindow.end, JOURNAL_TECHNIQUE_LIST.visibleRows);
assert.equal(firstTechniqueWindow.hasPrevious, false);
assert.equal(firstTechniqueWindow.hasNext, true);

const lastTechniqueWindow = journalTechniqueWindow(denseTechniques, 25);
assert.equal(lastTechniqueWindow.start, 12);
assert.equal(lastTechniqueWindow.end, 26);
assert.equal(lastTechniqueWindow.selectedRow, 13);
assert.equal(lastTechniqueWindow.hasPrevious, true);
assert.equal(lastTechniqueWindow.hasNext, false);
assert.equal(journalTechniqueRowAt({
  x: JOURNAL_TECHNIQUE_LIST.x + 3,
  y: JOURNAL_TECHNIQUE_LIST.y + 13 * JOURNAL_TECHNIQUE_LIST.rowHeight + 2
}, denseTechniques, 25), 25);
assert.equal(journalTechniqueRowAt({ x: 320, y: 200 }, denseTechniques, 25), null);

const denseEvidence = Array.from({ length: 12 }, (_, index) =>
  `Evidence ${index + 1} records a specific field finding with enough detail to occupy several ledger lines during review.`
);
const firstEvidenceWindow = journalEvidenceWindow(denseEvidence, 0);
assert.equal(firstEvidenceWindow.start, 0);
assert.equal(firstEvidenceWindow.hasPrevious, false);
assert.equal(firstEvidenceWindow.hasNext, true);
const lastEvidenceWindow = journalEvidenceWindow(denseEvidence, Number.MAX_SAFE_INTEGER);
assert.ok(lastEvidenceWindow.start > 0);
assert.equal(lastEvidenceWindow.end, denseEvidence.length);
assert.equal(lastEvidenceWindow.hasPrevious, true);
assert.equal(lastEvidenceWindow.hasNext, false);
assert.equal(journalEvidenceWindow(denseEvidence, lastEvidenceWindow.start - 1).hasNext, true);

renderer.draw(mockCtx(), {
  ...baseUi,
  journal: {
    section: JOURNAL_SECTIONS.indexOf('NOTES'),
    sections: JOURNAL_SECTIONS,
    evidenceIndex: lastEvidenceWindow.start,
    findings: denseEvidence,
    quests: [],
    factions: [],
    character,
    techniques: { activePoints: 0, passivePoints: 0, selectedIndex: 0, entries: [] }
  }
});

assert.equal(normalizeLedgerText('censure file x 2'), 'CENSURE FILE X 2');
assert.equal(ledgerTextWidth('C-8'), 15);

const noticeQuestDefs = {
  test: {
    id: 'test',
    title: 'Test Writ',
    stages: [
      { id: 'active', task: 'Inspect the record.', description: 'The record remains unread.' },
      { id: 'evidence', task: 'Follow the new lead.', description: 'The record names a hidden witness.' }
    ],
    objectives: [
      { text: 'Read the record.', stage: 'evidence' }
    ]
  }
};
const noticeJournalNotes = [
  { id: 'witness-note', flag: 'found-witness-note', text: 'A witness left a name in the margin.' }
];
const noticeCodexDefs = [
  {
    id: 'witness-cell',
    name: 'Witness Cell',
    unlockedBy: { flag: 'identified-witness-cell' },
    summary: 'A hidden civic network.'
  }
];
const noticeBase = {
  questDefs: noticeQuestDefs,
  questStages: new Map([['test', 'active']]),
  questReached: new Map([['test', new Set(['active'])]]),
  journalNotes: noticeJournalNotes,
  codexDefs: noticeCodexDefs,
  flags: new Set()
};
const noticeBaseline = buildJournalUpdateSnapshot(noticeBase);

const questAdvanced = buildJournalUpdateSnapshot({
  ...noticeBase,
  questStages: new Map([['test', 'evidence']]),
  questReached: new Map([['test', new Set(['active', 'evidence'])]])
});
assert.deepEqual(journalUpdatedSections(noticeBaseline, questAdvanced), ['QUESTS', 'NOTES']);

const noteFound = buildJournalUpdateSnapshot({
  ...noticeBase,
  flags: new Set(['found-witness-note'])
});
assert.deepEqual(journalUpdatedSections(noticeBaseline, noteFound), ['NOTES']);

const factionFound = buildJournalUpdateSnapshot({
  ...noticeBase,
  flags: new Set(['identified-witness-cell'])
});
assert.deepEqual(journalUpdatedSections(noticeBaseline, factionFound), ['FACTIONS']);
assert.deepEqual(journalUpdatedSections(null, factionFound), []);

class JournalNoticeHarness {}
installGameRuntimeState(JournalNoticeHarness);

const noticeHarness = Object.assign(new JournalNoticeHarness(), {
  ...noticeBase,
  flags: new Set()
});
noticeHarness._resetJournalNoticeTracking();
assert.equal(noticeHarness.journalNotice, null, 'initial journal state must not announce itself');
noticeHarness.flags.add('found-witness-note');
noticeHarness._advanceJournalNotice(JOURNAL_NOTICE_POLL_INTERVAL);
assert.equal(noticeHarness.journalNotice?.title, 'JOURNAL UPDATED');
assert.equal(noticeHarness.journalNotice?.detail, 'NOTES');
noticeHarness._advanceJournalNotice(JOURNAL_NOTICE_DURATION + 0.01);
assert.equal(noticeHarness.journalNotice, null, 'journal notice expires after its display duration');
