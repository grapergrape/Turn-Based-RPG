import assert from 'node:assert/strict';

import { buildCharacterSheet } from '../src/core/Progression.js';
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

for (let section = 0; section < 5; section += 1) {
  renderer.draw(mockCtx(), {
    ...baseUi,
    journal: {
      section,
      sections: ['QUESTS', 'NOTES', 'FACTIONS', 'CHARACTER', 'SCARS'],
      factionIndex: 0,
      quests: [],
      findings: [],
      factions: [],
      character
    }
  });
}

renderer.draw(mockCtx(), {
  ...baseUi,
  journal: {
    section: 4,
    sections: ['QUESTS', 'NOTES', 'FACTIONS', 'CHARACTER', 'SCARS'],
    turn: { from: 3, to: 4, direction: 1, progress: 0.5 },
    factionIndex: 0,
    quests: [],
    findings: [],
    factions: [],
    character
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
