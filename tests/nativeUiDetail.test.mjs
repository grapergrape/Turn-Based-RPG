import assert from 'node:assert/strict';

import { UIRenderer } from '../src/render/UIRenderer.js';
import { PALETTE } from '../src/render/palette.js';
import {
  INTERNAL_HEIGHT,
  INTERNAL_WIDTH,
  LOGICAL_HEIGHT,
  LOGICAL_WIDTH,
  NATIVE_PIXEL,
  NATIVE_SCALE
} from '../src/render/renderConfig.js';
import { inventorySlotBox } from '../src/ui/inventoryLayout.js';

const paletteColors = new Set(Object.values(PALETTE));
const renderer = new UIRenderer(null);

function recordingContext() {
  const fills = [];
  let smoothing = false;
  let fillStyle = PALETTE.void;
  return {
    canvas: { width: INTERNAL_WIDTH, height: INTERNAL_HEIGHT },
    fills,
    drawImages: 0,
    fillTextCalls: 0,
    smoothingWrites: [],
    save() {},
    restore() {},
    fillRect(x, y, w, h) { fills.push({ x, y, w, h, color: fillStyle }); },
    drawImage() { this.drawImages += 1; },
    fillText() { this.fillTextCalls += 1; },
    strokeText() { throw new Error('UI must use the bitmap font, not browser text'); },
    set fillStyle(value) { fillStyle = value; },
    get fillStyle() { return fillStyle; },
    set imageSmoothingEnabled(value) {
      smoothing = Boolean(value);
      this.smoothingWrites.push(smoothing);
      if (smoothing) throw new Error('UI enabled image smoothing');
    },
    get imageSmoothingEnabled() { return smoothing; }
  };
}

function baseUi(overrides = {}) {
  return {
    screen: null,
    actorName: 'Test Agent',
    role: 'Cult-Breaker, Ashen Censure',
    mode: 'EXPLORE',
    sneakMode: false,
    hp: 14,
    maxHp: 14,
    ap: 6,
    maxAp: 6,
    statuses: [],
    actionName: 'Service Knife',
    actionChance: '74%',
    actionDamage: 'D4',
    target: 'Opened Penitent 12/12',
    inventoryItems: [],
    carryWeight: 3.4,
    maxCarryWeight: 18,
    controls: ['CLICK MOVE OR USE', 'WASD MOVE', 'I FIELD PACK'],
    log: ['SUCCESS: The latch gives.', 'FAILED: The ward holds.'],
    cursor: null,
    ...overrides
  };
}

function item(model, index = 0, overrides = {}) {
  const rarities = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
  return {
    id: `${model}-${index}`,
    name: `${model} sample ${index + 1}`,
    type: model,
    groundModel: model,
    count: index % 3 === 0 ? 3 : 1,
    equippedCount: index === 0 ? 1 : 0,
    rarity: rarities[index % rarities.length],
    rarityLabel: rarities[index % rarities.length],
    weight: 0.5 + index / 10,
    totalWeight: 1 + index / 5,
    description: 'A field item used to verify the complete hard-pixel icon set.',
    ...overrides
  };
}

const iconModels = [
  'dressing', 'food', 'rounds', 'sidearm', 'key', 'paper', 'vial', 'shard',
  'ball', 'boots', 'coat', 'hood', 'vest', 'ribguard', 'ring', 'necklace', 'unknown'
];
const allItems = iconModels.map((model, index) => item(model, index, {
  equipmentSlot: ['boots', 'armor', 'head', 'ring'].includes(model) ? model : undefined,
  condition: model === 'sidearm' ? 6 : undefined,
  conditionMax: model === 'sidearm' ? 10 : undefined,
  ammoName: model === 'sidearm' ? 'Relic Rounds' : undefined,
  loaded: model === 'sidearm' ? 3 : undefined,
  magazineCapacity: model === 'sidearm' ? 7 : undefined,
  reserveAmmo: model === 'sidearm' ? 12 : undefined,
  reloadAp: model === 'sidearm' ? 2 : undefined,
  attackModes: model === 'sidearm' ? [
    { name: 'Single Shot', damage: 5, baseDamage: 5, apCost: 4, range: 5, accuracyBonus: 0, ammoCost: 1 },
    { name: 'Quick Shot', damage: 4, baseDamage: 4, apCost: 3, range: 5, accuracyBonus: -10, ammoCost: 1 }
  ] : [],
  buildLabel: model === 'ribguard' ? 'Road Ghost' : undefined,
  wornSlots: model === 'ring' ? ['left', 'right'] : undefined
}));
const equipmentSlots = ['HEAD', 'ARMOR', 'BOOTS', 'WEAPON', 'RING I', 'RING II', 'TOKEN'].map((label, index) => ({
  label,
  name: index % 2 ? 'EMPTY' : allItems[index]?.name ?? 'FIELD ITEM',
  empty: index % 2 === 1,
  rarity: index % 2 ? 'common' : 'rare'
}));

const journalSections = ['QUESTS', 'MAP', 'NOTES', 'FACTIONS', 'CHARACTER', 'SCARS', 'TECHNIQUES', 'DRONE'];
const journalCharacter = {
  name: 'Test Agent',
  role: 'Cult-Breaker, Ashen Censure',
  level: 4,
  build: { label: 'Road Ghost' },
  xp: { current: 82, nextLevelXp: 120, intoLevel: 42, needed: 80, atCap: false },
  primaryPoints: 2,
  activeTechniquePoints: 1,
  passiveTechniquePoints: 2,
  scarPoints: 1,
  trace: { label: 'WATCHED' },
  iconRisk: { label: 'ELEVATED' },
  primaries: ['Body', 'Agility', 'Eye', 'Intelligence', 'Religion', 'Voice', 'Nerve'].map((label, index) => ({
    id: label.toLowerCase(), label, value: 4 + (index % 4)
  })),
  fields: Array.from({ length: 12 }, (_, index) => ({
    id: `field${index}`,
    label: `Field ${index + 1}`,
    value: 28 + index * 5
  })),
  topFields: [{ id: 'field2' }, { id: 'field8' }],
  scars: Array.from({ length: 4 }, (_, index) => ({
    name: `Scar Record ${index + 1}`,
    rank: index + 1,
    summary: 'A remembered failure alters the next field decision.',
    cost: 'The related test presses harder.',
    modifiers: { [`field${index}`]: index % 2 ? -5 : 5 }
  }))
};
const journalMap = {
  name: 'Native Detail Test District',
  width: 8,
  height: 6,
  exploredCount: 37,
  totalCells: 48,
  cells: Array.from({ length: 48 }, (_, index) => ({
    x: index % 8,
    y: Math.floor(index / 8),
    explored: index % 7 !== 0,
    hidden: index === 5,
    type: ['floor', 'wall', 'blocked', 'secret', 'void'][index % 5]
  })),
  markers: ['player', 'quest', 'dialogue', 'exit', 'locked', 'search', 'danger', 'note'].map((kind, index) => ({
    kind,
    label: `${kind} marker`,
    x: index % 8,
    y: index % 6
  }))
};
const journalFactions = [
  ...Array.from({ length: 20 }, (_, index) => ({
    name: `Filed Cell ${String(index + 1).padStart(2, '0')}`,
    known: true,
    kind: index % 2 ? 'Civic Order' : 'Host Cult',
    summary: 'A faction record with uncertain loyalties and a documented reach.',
    facts: Array.from({ length: 4 }, (__, fact) => `Verified fact ${fact + 1} for this record.`)
  })),
  { name: 'Redacted Cell', known: false }
];
const journalTechniques = Array.from({ length: 22 }, (_, index) => ({
  id: `method-${index + 1}`,
  name: `Filed Method ${String(index + 1).padStart(2, '0')}`,
  type: index % 3 === 0 ? 'passive' : 'active',
  targets: index % 2 ? ['enemy', 'tile'] : [],
  known: index < 4,
  canLearn: index === 14,
  summary: 'A controlled field procedure with a measurable tactical effect.',
  requirementText: index === 14 ? 'Nerve 6 or higher' : 'Requirements not met',
  disabledReason: 'Training record is incomplete.'
}));
const journalDroneNodes = Array.from({ length: 8 }, (_, index) => ({
  id: `core-node-${index + 1}`,
  name: ['Reinforced Shell', 'Service Cell', 'Fine Servos', 'Recovery Loop', 'Shared Telemetry', 'Reserve Charge', 'Redundant Core', 'Command Bus'][index],
  tier: index < 2 ? 1 : index < 4 ? 2 : index < 6 ? 3 : index === 6 ? 4 : 5,
  pointCost: [1, 1, 2, 2, 3, 3, 4, 5][index],
  partCost: [0, 0, 0, 0, 1, 1, 2, 3][index],
  requires: index < 2 ? [] : index < 4 ? [`core-node-${index - 1}`] : index < 6 ? ['core-node-3', 'core-node-4'] : index === 6 ? ['core-node-5', 'core-node-6'] : ['core-node-7'],
  description: 'A tested service modification changes the attendant in the field.',
  purchased: index < 3,
  unlocked: index === 3,
  reason: index < 3 ? 'Installed.' : index === 3 ? '' : 'Install the linked upgrades first.',
  rating: 73,
  threshold: [27, 27, 40, 40, 55, 55, 70, 85][index]
}));
const journalBase = {
  sections: journalSections,
  section: 0,
  time: { dateLabel: 'FIELD DAY 8', timeLabel: '19:40' },
  quests: [{
    title: 'Verify Native Detail',
    task: 'Inspect every interface state.',
    note: 'The verification pass must include all pages and modal branches.',
    complete: false,
    objectives: [
      { text: 'Inspect the active objective.', active: true },
      { text: 'Confirm the completed mark.', done: true },
      { text: 'Record the unresolved lead.', lead: true },
      { text: 'Leave one objective pending.' }
    ]
  }, {
    title: 'Closed Test Writ',
    complete: true,
    objectives: [{ text: 'This writ is complete.', done: true }]
  }],
  map: journalMap,
  findings: Array.from({ length: 22 }, (_, index) => `Evidence ${index + 1}: a distinct record line used to fill both ledger pages.`),
  factions: journalFactions,
  factionIndex: 19,
  character: journalCharacter,
  primaryIndex: 4,
  techniques: {
    entries: journalTechniques,
    selectedIndex: 14,
    activePoints: 2,
    passivePoints: 1
  },
  drone: {
    recruited: true,
    name: 'Pip',
    model: 'Utility Drone Mark I',
    hp: 8,
    maxHp: 11,
    points: 6,
    parts: 3,
    branchIndex: 0,
    nodeIndex: 3,
    confirmNodeId: 'core-node-4',
    branches: ['Core', 'Energy', 'Bulwark', 'Medical', 'Veil', 'Fieldworks'].map((name, index) => ({
      id: name.toLowerCase(), name, rating: 73 - index * 3, installed: index === 0 ? 3 : index % 2
    })),
    nodes: journalDroneNodes
  }
};

const cases = [];
function addDrawCase(name, ui) {
  cases.push({ name, draw: (ctx) => renderer.draw(ctx, ui) });
}
function addDirectCase(name, draw) {
  cases.push({ name, draw });
}

addDrawCase('hud explore', baseUi());
addDrawCase('hud explore statuses and sneak', baseUi({
  sneakMode: true,
  statuses: [{ label: 'Bleeding', stacks: 2 }, { label: 'Marked', stacks: 1 }],
  nearbyActionText: 'E OPEN CENSURE GATE',
  carryWeight: undefined,
  maxCarryWeight: undefined,
  inventoryItems: [{ count: 1 }]
}));
addDrawCase('hud combat low health', baseUi({
  mode: 'COMBAT', hp: 3, ap: 2, statuses: [{ label: 'Burning', stacks: 3 }]
}));
addDrawCase('hud combat blocked action', baseUi({
  mode: 'COMBAT', actionChance: '', actionDamage: '', actionReason: 'OUT OF RANGE', statuses: []
}));
addDrawCase('hud combat ability tray targeting', baseUi({
  mode: 'COMBAT',
  combatAbilityTray: {
    anchor: { x: 320, y: 190 },
    page: 0,
    selectedAbilityId: 'technique:trip-mine',
    prompt: 'TRIP MINE: SELECT TILE',
    entries: [
      { id: 'technique:aimed-shot', name: 'Aimed Shot', detail: '4 AP ENEMY', enabled: true },
      { id: 'technique:stabilize', name: 'Stabilize', detail: 'NO NEED', enabled: false },
      { id: 'technique:trip-mine', name: 'Trip Mine', detail: '3 AP TILE', enabled: true },
      { id: 'technique:burn-line', name: 'Burn Line', detail: '3 AP ENEMY/TILE', enabled: true },
      { id: 'technique:rally', name: 'Rally', detail: '2 AP SELF', enabled: true }
    ]
  },
  cursor: { x: 320, y: 240, state: 'ui' }
}));
addDrawCase('area title hover context menu', baseUi({
  areaTitle: { text: 'South Measure', ttl: 4, duration: 5 },
  hoverText: 'Inspect the sealed reliquary',
  contextActionMenu: {
    anchor: { x: 590, y: 330 },
    actions: [
      { id: 'inspect', label: 'Inspect', hint: 'Read the field marks' },
      { id: 'open', label: 'Open', enabled: false, reason: 'Censure seal required' },
      { id: 'leave', label: 'Leave' }
    ]
  },
  cursor: { x: 300, y: 210, state: 'inspect' }
}));
addDrawCase('journal update notice', baseUi({
  journalNotice: {
    title: 'JOURNAL UPDATED',
    detail: 'QUESTS / NOTES',
    ttl: 2.8,
    duration: 3.4
  }
}));
for (const state of ['move', 'inspect', 'talk', 'use', 'loot', 'attack', 'blocked', 'unknown']) {
  addDrawCase(`cursor ${state}`, baseUi({ cursor: { x: 300, y: 210, state } }));
}

addDrawCase('character customization scrolled', baseUi({
  screen: 'character-customization',
  characterCreation: {
    name: 'Test Agent',
    canConfirm: true,
    rows: Array.from({ length: 15 }, (_, index) => ({
      label: `Option ${index + 1}`,
      value: index === 7 ? 'Test Agent' : index,
      kind: index === 4 ? 'range' : index === 7 ? 'name' : 'choice',
      min: 0,
      max: 10,
      selected: index === 7
    }))
  },
  cursor: { x: 560, y: 350, state: 'move' }
}));
addDrawCase('character customization invalid', baseUi({
  screen: 'character-customization',
  characterCreation: {
    name: '', canConfirm: false, error: 'NAME REQUIRED',
    rows: [{ label: 'Name', value: '', kind: 'name', selected: true }]
  }
}));
addDrawCase('primary assignment ready', baseUi({
  screen: 'primary-assignment',
  primaryAssignment: {
    canConfirm: true,
    pointsRemaining: 0,
    rows: journalCharacter.primaries.map((row, index) => ({ ...row, selected: index === 3 }))
  }
}));
addDrawCase('primary assignment pending', baseUi({
  screen: 'primary-assignment',
  primaryAssignment: {
    canConfirm: false,
    pointsRemaining: 8,
    rows: journalCharacter.primaries.map((row, index) => ({ ...row, selected: index === 0 }))
  }
}));

addDrawCase('inventory all icon models', baseUi({
  screen: 'inventory', inventoryItems: allItems, inventoryIndex: 8,
  inventoryMoveIndex: 8, inventoryFocus: 'items', equipmentSlots, ducats: 37
}));
addDrawCase('inventory weapon details', baseUi({
  screen: 'inventory', inventoryItems: allItems, inventoryIndex: 3,
  inventoryFocus: 'items', equipmentSlots, ducats: 37
}));
addDrawCase('inventory gear and action menu', baseUi({
  screen: 'inventory', inventoryItems: allItems, inventoryFocus: 'gear', equipmentIndex: 2,
  equipmentSlots, inventoryActionMenu: {
    anchor: inventorySlotBox(0), canUse: true, canEquip: true, canRepair: true, canSplit: true
  }
}));
addDrawCase('inventory split minimum', baseUi({
  screen: 'inventory', inventoryItems: allItems, equipmentSlots,
  inventorySplit: { item: allItems[0], amount: 1, max: 12 }
}));
addDrawCase('inventory split maximum', baseUi({
  screen: 'inventory', inventoryItems: allItems, equipmentSlots,
  inventorySplit: { item: allItems[0], amount: 12, max: 12 }
}));
addDrawCase('inventory repair donors', baseUi({
  screen: 'inventory', inventoryItems: allItems, equipmentSlots,
  inventoryRepair: {
    target: { name: 'Service Sidearm', condition: 3, conditionMax: 10 },
    index: 1,
    donors: [
      { name: 'Matched Sidearm', condition: 8, conditionMax: 10, exactMatch: true },
      { name: 'Field Sidearm', condition: 5, conditionMax: 10, exactMatch: false }
    ]
  }
}));
addDrawCase('inventory repair empty', baseUi({
  screen: 'inventory', inventoryItems: [], equipmentSlots,
  inventoryRepair: { target: { name: 'Service Sidearm' }, donors: [] }
}));

addDrawCase('loot full', baseUi({
  screen: 'loot', loot: { title: 'Reliquary Cache', entries: allItems.slice(0, 6), index: 3 }
}));
addDrawCase('loot empty', baseUi({ screen: 'loot', loot: { title: 'Empty Cache', entries: [], index: 0 } }));

const traderItems = [
  item('dressing', 0, { price: 3, affordable: true, count: 2 }),
  item('food', 1, { price: 5, affordable: false, count: 1 }),
  item('rounds', 2, { price: 8, affordable: false, count: 0 }),
  { ...allItems[3], price: 28, affordable: false, count: 1 }
];
const playerItems = [
  item('paper', 3, { sellPrice: 1, sellable: true, count: 2 }),
  item('key', 4, { sellPrice: undefined, sellable: false, count: 1 })
];
addDrawCase('trade stock affordable', baseUi({
  screen: 'trade', trade: {
    title: 'Field Exchange', traderName: 'Joanna', traderItems, playerItems,
    stockIndex: 0, playerIndex: 0, focus: 'trader', ducats: 9, canBuy: true, canSell: false
  }
}));
addDrawCase('trade stock blocked', baseUi({
  screen: 'trade', trade: {
    traderName: 'Joanna', traderItems, playerItems,
    stockIndex: 1, playerIndex: 0, focus: 'trader', ducats: 1, canBuy: false,
    buyHint: 'NOT ENOUGH DUCATS'
  }
}));
addDrawCase('trade stock sold', baseUi({
  screen: 'trade', trade: {
    traderName: 'Joanna', traderItems, playerItems,
    stockIndex: 2, playerIndex: 0, focus: 'trader', ducats: 20, canBuy: false
  }
}));
addDrawCase('trade weapon details', baseUi({
  screen: 'trade', trade: {
    traderName: 'Joanna', traderItems, playerItems,
    stockIndex: 3, playerIndex: 0, focus: 'trader', ducats: 20, canBuy: false,
    buyHint: 'NEED 28 DUCATS'
  }
}));
addDrawCase('trade player accepted', baseUi({
  screen: 'trade', trade: {
    traderName: 'Joanna', traderItems, playerItems,
    stockIndex: 0, playerIndex: 0, focus: 'player', ducats: 9, canBuy: false, canSell: true
  }
}));
addDrawCase('trade player rejected', baseUi({
  screen: 'trade', trade: {
    traderName: 'Joanna', traderItems, playerItems,
    stockIndex: 0, playerIndex: 1, focus: 'player', ducats: 9, canBuy: false, canSell: false,
    sellHint: 'NOT ACCEPTED HERE'
  }
}));
addDrawCase('trade empty', baseUi({
  screen: 'trade', trade: { traderName: 'Joanna', traderItems: [], playerItems: [], focus: 'trader' }
}));

addDrawCase('dialogue long scrolled choices', baseUi({
  screen: 'dialogue',
  dialogue: {
    title: 'FIELD INTERVIEW',
    lines: Array.from({ length: 18 }, (_, index) => `Paragraph ${index + 1} records a separate statement for scrolling.`),
    scroll: 5,
    options: ['1. Commit', '2. Fight', '3. Leave', '4. Continue', 'Unnumbered response'],
    choices: [
      { effects: { questUpdate: { quest: 'test' } }, close: true },
      { effects: { startCombat: 'test' }, close: true },
      { close: true },
      { next: 'next' },
      { tone: 'normal' }
    ]
  }
}));
addDrawCase('dialogue default response', baseUi({
  screen: 'dialogue', dialogue: { title: 'INSPECT', lines: ['One short inspection record.'] }
}));

for (const phase of ['recognition', 'catalogue', 'failure', 'activation', 'naming']) {
  addDrawCase(`drone shrine ${phase}`, baseUi({
    screen: 'drone-shrine',
    droneShrine: {
      phase,
      message: phase === 'failure'
        ? 'ACTIVATION FAILED. REMOTE CRADLE EMPTY.'
        : phase === 'activation' ? 'LOCAL CRADLE ANSWERS. FIELD ATTENDANT READY.' : '',
      name: phase === 'naming' ? 'Pip' : '',
      nameValidation: { valid: phase === 'naming' },
      models: [
        { id: 'dominion-siege-mark-x', name: 'Dominion Siege Drone Mark X', selected: false, failed: true },
        { id: 'palatine-combat-mark-vi', name: 'Palatine Combat Drone Mark VI', selected: false, failed: true },
        { id: 'utility-drone-mark-i', name: 'Utility Drone Mark I', selected: true, failed: false }
      ]
    }
  }));
}

for (let section = 0; section < journalSections.length; section += 1) {
  addDrawCase(`journal ${journalSections[section].toLowerCase()}`, baseUi({
    screen: 'journal', journal: { ...journalBase, section }
  }));
}
for (const direction of [-1, 1]) {
  for (const progress of [0.2, 0.5, 0.8]) {
    addDrawCase(`journal turn ${direction} ${progress}`, baseUi({
      screen: 'journal',
      journal: {
        ...journalBase,
        section: 1,
        turn: { from: 0, direction, progress }
      }
    }));
  }
}

const saveOptions = [
  { id: 'continue', label: 'CONTINUE', detail: 'OPEN THE NEWEST SOUND RECORD', enabled: true },
  { id: 'new-run', label: 'NEW RUN', detail: 'REPLACES THE STORED RUN', enabled: true },
  { id: 'load-saves', label: 'LOAD SAVES', detail: 'VIEW MANUAL AND RECOVERY RECORDS', enabled: true },
  { id: 'import-save', label: 'IMPORT SAVE', detail: 'READ A JSON BACKUP FILE', enabled: true }
];
addDrawCase('save title', baseUi({
  screen: 'title',
  save: { screen: 'title', gameVersion: '0.1.0', selected: 0, options: saveOptions }
}));
addDrawCase('save pause', baseUi({
  screen: 'pause',
  save: {
    screen: 'pause', selected: 3,
    options: [
      { label: 'RESUME', detail: 'RETURN TO THE FIELD', enabled: true },
      { label: 'SAVE RUN', detail: 'WRITE THE MANUAL RECORD', enabled: true },
      { label: 'LOAD SAVES', detail: 'OPEN A STORED CHECKPOINT', enabled: true },
      { label: 'EXPORT SAVE', detail: 'WRITE THE NEWEST SOUND RECORD', enabled: true },
      { label: 'RETURN TO TITLE', detail: 'LEAVE THE CURRENT FIELD', enabled: true }
    ]
  }
}));
addDrawCase('save records and failures', baseUi({
  screen: 'saves',
  save: {
    screen: 'saves', selected: 1, message: 'SAVE STORAGE COULD NOT BE READ.', messageKind: 'error',
    rows: [
      { label: 'MANUAL SAVE', status: 'valid', playerName: 'Test Agent', playerLevel: 4, location: 'South Measure', fieldTime: 'DAY 8 19:40', savedAt: '18 JUL 21:04' },
      { label: 'AUTOSAVE I', status: 'valid', playerName: 'Test Agent', playerLevel: 4, location: 'Ash Road South', fieldTime: 'DAY 8 18:52', savedAt: '18 JUL 20:59', versionWarning: true, savedGameVersion: '0.0.9' },
      { label: 'AUTOSAVE II', status: 'incompatible', reason: 'Save was written by a newer save format.' },
      { label: 'AUTOSAVE III', status: 'corrupt', reason: 'Save checksum does not match its contents.' }
    ]
  }
}));
addDrawCase('save confirmation', baseUi({
  screen: 'confirm',
  save: {
    screen: 'confirm', selected: 1,
    confirmText: 'Load this checkpoint? Field progress after it will be lost.',
    options: [{ label: 'CONFIRM', enabled: true }, { label: 'GO BACK', enabled: true }]
  }
}));

addDirectCase('briefing first page', (ctx) => renderer.drawBriefing(ctx, {
  title: 'FIELD WRIT', pageIndex: 0, pageCount: 2,
  page: ['First briefing paragraph.', 'Second briefing paragraph.'],
  nextPrompt: 'ENTER CONTINUE', skipPrompt: 'ESC SKIP'
}));
addDirectCase('briefing final page', (ctx) => renderer.drawBriefing(ctx, {
  title: 'FIELD WRIT', pageIndex: 1, pageCount: 2,
  page: ['The final briefing page.'], lastPrompt: 'ENTER BEGIN', skipPrompt: ''
}));
for (const progress of [0, 0.5, 1]) {
  addDirectCase(`loading ${progress}`, (ctx) => renderer.drawLoading(ctx, {
    progress, message: 'Loading native detail audit', detail: progress === 0.5 ? 'Midpoint verification' : ''
  }));
}

let totalFills = 0;
let totalNativeFills = 0;
for (const entry of cases) {
  const ctx = recordingContext();
  entry.draw(ctx);
  assert.equal(ctx.canvas.width, LOGICAL_WIDTH * NATIVE_SCALE, `${entry.name}: backing width`);
  assert.equal(ctx.canvas.height, LOGICAL_HEIGHT * NATIVE_SCALE, `${entry.name}: backing height`);
  assert.equal(ctx.fillTextCalls, 0, `${entry.name}: browser text call`);
  assert.ok(!ctx.smoothingWrites.includes(true), `${entry.name}: smoothing enabled`);
  assert.ok(ctx.fills.length > 0, `${entry.name}: drew no hard rectangles`);

  const nativeFills = ctx.fills.filter(({ x, y, w, h }) => [x, y, w, h].some((value) => !Number.isInteger(value)));
  assert.ok(nativeFills.length >= 4, `${entry.name}: expected native half-pixel detail`);
  for (const call of nativeFills) {
    for (const [field, value] of Object.entries({ x: call.x, y: call.y, w: call.w, h: call.h })) {
      assert.ok(Number.isFinite(value), `${entry.name}: non-finite ${field}`);
      assert.equal(value / NATIVE_PIXEL, Math.round(value / NATIVE_PIXEL), `${entry.name}: ${field} missed native grid`);
    }
    assert.ok(call.w >= NATIVE_PIXEL && call.h >= NATIVE_PIXEL, `${entry.name}: sub-native detail`);
    assert.ok(paletteColors.has(call.color), `${entry.name}: native detail used non-palette color ${call.color}`);
  }

  for (const call of ctx.fills) {
    assert.ok(call.w > 0 && call.h > 0, `${entry.name}: non-positive rectangle`);
    assert.ok(call.x >= -0.001 && call.y >= -0.001, `${entry.name}: draw escaped top or left edge ${JSON.stringify(call)}`);
    assert.ok(call.x + call.w <= LOGICAL_WIDTH + 0.001, `${entry.name}: draw escaped right edge ${JSON.stringify(call)}`);
    assert.ok(call.y + call.h <= LOGICAL_HEIGHT + 0.001, `${entry.name}: draw escaped bottom edge ${JSON.stringify(call)}`);
  }

  totalFills += ctx.fills.length;
  totalNativeFills += nativeFills.length;
}

assert.ok(totalNativeFills > cases.length * 20, 'UI matrix should exercise substantial native detail');
console.log(
  `nativeUiDetail: ${cases.length} UI states, ${totalFills} hard-pixel fills, `
  + `${totalNativeFills} native half-pixel fills passed sizing, bounds, palette, and font audits.`
);
