import assert from 'node:assert/strict';

import { PALETTE } from '../src/render/palette.js';
import { UIRenderer } from '../src/render/UIRenderer.js';
import { drawDialogue } from '../src/render/ui/DialogueRenderer.js';
import { drawHud } from '../src/render/ui/HudRenderer.js';
import { DIALOGUE_BOX, buildDialogueLayout } from '../src/ui/dialogueLayout.js';

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

const renderer = new UIRenderer();

renderer.draw(mockCtx(), {
  screen: null,
  levelName: 'Ash Chapel Breach',
  actorName: 'Mara Vey',
  role: 'Cult-Breaker, Ashen Censure',
  mode: 'EXPLORE',
  sneakMode: false,
  hp: 14,
  maxHp: 14,
  ap: 6,
  maxAp: 6,
  action: 'Service Knife',
  target: '-',
  inventoryItems: [],
  carryWeight: 0,
  maxCarryWeight: 10,
  controls: ['Click Move/Use', 'WASD Move'],
  log: [
    'The chapel air tastes of old ash.',
    'Quest updated: ring the upper bell.'
  ],
  cursor: null
});

const decisionLayout = buildDialogueLayout({
  lines: ['One record remains.', 'Choose what follows.'],
  options: [
    '1. Keep the vigil',
    '2. Open the niche',
    '3. Leave for now'
  ],
  choices: [
    { effects: { questUpdate: { quest: 'test', stage: 'complete' } }, close: true },
    { effects: { startCombat: 'test-encounter' }, close: true },
    { close: true }
  ]
});
assert.deepEqual(decisionLayout.optionDetails.map((option) => option.tone), [
  'commit',
  'danger',
  'quiet'
]);

const renderedChoiceColors = new Map();
drawDialogue(mockCtx(), {
  dialogue: {
    title: 'TEST',
    lines: ['Choose.'],
    options: ['1. Leave for now'],
    choices: [{ close: true }]
  }
}, {
  screenBackdrop() {},
  window() {},
  inset() {},
  outcomeText() {},
  scrollArrow() {},
  rect() {},
  text(_ctx, value, _x, _y, color) { renderedChoiceColors.set(value, color); },
  atlas: null
});
assert.equal(renderedChoiceColors.get('LEAVE FOR NOW'), PALETTE.uiGood);
assert.ok(decisionLayout.box.h < DIALOGUE_BOX.h, 'short dialogue should not reserve the full-height modal');
assert.equal(decisionLayout.box.y + decisionLayout.box.h, DIALOGUE_BOX.y + DIALOGUE_BOX.h);

const navigationLayout = buildDialogueLayout({
  lines: ['The stair is clear.'],
  options: ['1. Descend', '2. Trade', '3. Search the latch'],
  choices: [
    { effects: { loadLevel: { level: 'test', x: 1, y: 1 } }, close: true },
    { effects: { trade: 'test-trader' }, close: true },
    { tone: 'danger', effects: { setFlag: 'searched-dangerous-latch' }, close: true }
  ]
});
assert.deepEqual(navigationLayout.optionDetails.map((option) => option.tone), [
  'normal',
  'normal',
  'danger'
]);

const longLayout = buildDialogueLayout({
  lines: Array.from({ length: 16 }, (_, index) => `Record line ${index + 1}.`),
  options: ['1. One', '2. Two', '3. Three', '4. Four', '5. Five'],
  choices: Array.from({ length: 5 }, () => ({}))
});
assert.equal(longLayout.box.h, DIALOGUE_BOX.h);
assert.ok(longLayout.maxScroll > 0);
assert.equal(longLayout.optionDetails.length, 5);

const combatText = [];
drawHud(mockCtx(), {
  actorName: 'Mara Vey',
  mode: 'COMBAT',
  hp: 11,
  maxHp: 14,
  ap: 5,
  maxAp: 6,
  statuses: [{ label: 'Bleeding', stacks: 1 }],
  actionName: 'Censure Knife',
  actionChance: '70%',
  actionDamage: 'D3',
  actionReason: '',
  target: 'Sava Rell 20/20',
  controls: [],
  log: []
}, {
  panelTexture() {},
  window() {},
  text(_ctx, value) { combatText.push(value); },
  outcomeText() {},
  wrap: (value) => [value],
  clip: (value) => value,
  bar() {},
  apPips() {},
  rect() {},
  formatWeight: (value) => String(value)
});
assert.ok(combatText.includes('FX Bleeding'));
assert.ok(combatText.includes('70% D3'), 'status effects must not hide attack odds and damage');
assert.ok(combatText.includes('> Sava Rell 20/20'));
