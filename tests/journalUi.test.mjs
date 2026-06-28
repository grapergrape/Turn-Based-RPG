import assert from 'node:assert/strict';

import { buildCharacterSheet } from '../src/core/Progression.js';
import { JOURNAL_SECTIONS } from '../src/core/JournalState.js';
import { UIRenderer } from '../src/render/UIRenderer.js';
import { JOURNAL_ARROW_BOXES, journalArrowAt } from '../src/ui/journalLayout.js';

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
  name: 'Mara Vey',
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
  actorName: 'Mara Vey',
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
    { id: 'player', kind: 'player', label: 'Mara Vey', x: 1, y: 1, reveal: 'always' },
    { id: 'quest:test', kind: 'quest', label: 'Test Writ', x: 2, y: 1, reveal: 'explored' },
    { id: 'dialogue:test', kind: 'dialogue', label: 'Test Contact', x: 3, y: 2, reveal: 'explored' }
  ],
  player: { x: 1, y: 1 }
};

for (let section = 0; section < JOURNAL_SECTIONS.length; section += 1) {
  renderer.draw(mockCtx(), {
    ...baseUi,
    journal: {
      section,
      sections: JOURNAL_SECTIONS,
      factionIndex: 0,
      primaryIndex: 0,
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
}

renderer.draw(mockCtx(), {
  ...baseUi,
  journal: {
    section: 4,
    sections: JOURNAL_SECTIONS,
    turn: { from: 3, to: 4, direction: 1, progress: 0.5 },
    factionIndex: 0,
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
