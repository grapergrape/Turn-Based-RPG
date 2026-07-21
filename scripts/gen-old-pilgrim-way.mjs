import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { PALETTE } from '../src/render/palette.js';
import {
  OLD_PILGRIM_ACTORS,
  OLD_PILGRIM_DIALOGUES,
  OLD_PILGRIM_ENEMIES,
  OLD_PILGRIM_ITEMS,
  OLD_PILGRIM_QUEST_IDS,
  OLD_PILGRIM_QUESTS
} from './content/old-pilgrim-way-content.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DATA = resolve(ROOT, 'data');

function point(x, y) {
  return { x, y };
}

function indoorGrid(width, height) {
  return Array.from({ length: height }, (_, y) => Array.from({ length: width }, (_, x) => (
    x === 0 || y === 0 || x === width - 1 || y === height - 1 ? '#' : '.'
  )));
}

function outdoorGrid(width, height) {
  return Array.from({ length: height }, () => Array.from({ length: width }, () => '.'));
}

function hwall(grid, y, x0, x1, gaps = []) {
  for (let x = x0; x <= x1; x += 1) if (!gaps.includes(x)) grid[y][x] = '#';
}

function vwall(grid, x, y0, y1, gaps = []) {
  for (let y = y0; y <= y1; y += 1) if (!gaps.includes(y)) grid[y][x] = '#';
}

function fill(grid, x0, y0, x1, y1, value) {
  for (let y = y0; y <= y1; y += 1) {
    for (let x = x0; x <= x1; x += 1) grid[y][x] = value;
  }
}

function addObject(objects, kind, x, y, extra = {}) {
  objects.push({ kind, x, y, ...extra });
}

function addNote(objects, { id, kind, name, x, y, log, interact = {}, ...extra }) {
  addObject(objects, kind, x, y, {
    id,
    name,
    interact: { type: 'note', log, ...interact },
    ...extra
  });
}

function addContainer(objects, { id, kind = 'rusted-crate', name, x, y, log, loot, ...extra }) {
  addObject(objects, kind, x, y, {
    id,
    name,
    blocking: true,
    interact: { type: 'container', log, loot },
    ...extra
  });
}

function addDialogueObject(objects, { id, kind, name, x, y, dialogue, type = 'dialogue', ...extra }) {
  addObject(objects, kind, x, y, {
    id,
    name,
    interact: { type, dialogue },
    ...extra
  });
}

function levelRecord({
  id,
  name,
  intro,
  grid,
  legend,
  player,
  objects,
  groundItems,
  npcs = [],
  enemies = [],
  dialogue = [],
  mood,
  ...extra
}) {
  const referencedDialogue = [
    ...dialogue,
    ...npcs.map((spawn) => spawn.dialogue),
    ...enemies.map((spawn) => spawn.dialogue),
    ...objects.map((object) => object.interact?.dialogue),
    ...(extra.combatTriggers ?? []).map((trigger) => trigger.dialogue)
  ].filter(Boolean);
  return {
    id,
    name,
    intro,
    width: grid[0].length,
    height: grid.length,
    tileSize: 64,
    ...(mood ? { mood } : {}),
    quests: [...OLD_PILGRIM_QUEST_IDS],
    dialogue: [...new Set(referencedDialogue)],
    tiles: grid.map((row) => row.join('')),
    legend,
    spawns: {
      player: { actor: 'mara-vey', ...player },
      npcs,
      enemies
    },
    objects,
    groundItems,
    ...extra
  };
}

const indoorLegend = Object.freeze({
  '#': { kind: 'wall', walkable: false },
  '.': { kind: 'floor', floor: 'stone', walkable: true }
});

function makeSurface() {
  const width = 120;
  const height = 70;
  const grid = outdoorGrid(width, height);
  const objects = [];

  fill(grid, 4, 7, 48, 57, 'w');
  fill(grid, 70, 24, 113, 59, 'f');
  fill(grid, 76, 3, 105, 21, 'g');
  fill(grid, 0, 0, 3, 69, 'd');
  fill(grid, 116, 0, 119, 69, 'd');

  for (let y = 0; y < height; y += 1) {
    grid[y][56] = 's';
    for (let x = 57; x <= 62; x += 1) grid[y][x] = 'r';
    grid[y][63] = 's';
  }
  for (let step = 0; step <= 26; step += 1) {
    const x = 62 + step;
    const y = 25 - Math.floor((step * 9) / 26);
    for (let dy = -2; dy <= 2; dy += 1) {
      if (grid[y + dy]?.[x] === undefined) continue;
      grid[y + dy][x] = Math.abs(dy) <= 1 ? 'r' : 's';
    }
  }
  fill(grid, 84, 6, 92, 13, 'V');

  addDialogueObject(objects, {
    id: 'old-pilgrim-south-road-post',
    kind: 'road-sign-post',
    name: 'South Measure Road',
    x: 60,
    y: 69,
    dialogue: 'old-pilgrim-south-road',
    type: 'secret-exit',
    blocking: true,
    interactionMarker: point(60, 68),
    mapMarker: { label: 'South Measure', kind: 'exit', reveal: 'always' }
  });
  addDialogueObject(objects, {
    id: 'old-pilgrim-north-road-post',
    kind: 'quarantine-sign',
    name: 'Quarantine Farms Road',
    x: 60,
    y: 0,
    dialogue: 'old-pilgrim-north-road',
    type: 'secret-exit',
    blocking: true,
    interactionMarker: point(60, 1),
    mapMarker: { label: 'Quarantine Farms', kind: 'exit', reveal: 'always' }
  });
  addDialogueObject(objects, {
    id: 'old-pilgrim-hill-church-door',
    kind: 'chapel-double-door',
    name: 'Hill Church',
    x: 88,
    y: 13,
    dialogue: 'old-pilgrim-hill-church-entry',
    type: 'secret-entrance',
    blocking: true,
    wallPlane: 'sw',
    interactionMarker: point(88, 14),
    mapMarker: { label: 'Hill Church', kind: 'exit' }
  });

  for (const [x, y] of [
    [59, 61], [59, 55], [60, 48], [59, 39], [61, 31], [66, 24],
    [72, 22], [78, 20], [83, 18], [87, 15]
  ]) addObject(objects, 'graveyard-path-stones', x, y);

  for (const [x, y, variant] of [
    [60, 58, 'road'], [60, 40, 'road'], [65, 25, 'branch'], [76, 20, 'branch'], [85, 16, 'hill']
  ]) addObject(objects, 'pilgrim-road-shrine', x, y, { blocking: true, variant });

  for (const [x, y] of [
    [55, 61], [64, 61], [55, 38], [64, 38], [53, 29], [66, 29],
    [73, 24], [80, 21], [86, 18]
  ]) addObject(objects, 'road-dust', x, y);

  for (const [x, y] of [
    [8, 11], [15, 16], [24, 9], [34, 18], [44, 12], [10, 47], [22, 55], [41, 51],
    [73, 29], [82, 27], [92, 31], [105, 25], [76, 52], [89, 55], [108, 47],
    [5, 64], [114, 64], [7, 3], [111, 5]
  ]) addObject(objects, 'ash-tree', x, y, { blocking: true });

  for (const [x, y] of [
    [12, 22], [18, 30], [27, 39], [37, 25], [45, 43], [7, 53],
    [72, 34], [75, 46], [83, 50], [91, 38], [99, 43], [110, 54],
    [51, 58], [66, 57], [68, 13], [77, 16], [96, 19], [103, 13]
  ]) addObject(objects, 'dead-grass-tuft', x, y);

  for (const [x, y] of [
    [11, 18], [17, 26], [25, 15], [33, 44], [42, 32], [46, 50],
    [73, 31], [80, 35], [87, 41], [96, 28], [104, 36], [109, 51]
  ]) addObject(objects, 'wheat-clump', x, y);

  for (const [x, y, orient] of [
    [39, 46, 'se'], [40, 46, 'se'], [41, 46, 'se'], [70, 31, 'sw'],
    [71, 31, 'sw'], [101, 38, 'se'], [102, 38, 'se'], [103, 38, 'se']
  ]) addObject(objects, 'farm-fence', x, y, { blocking: true, orient });

  for (const [kind, x, y, extra] of [
    ['wall-broken', 36, 48, { blocking: true }],
    ['wall-broken', 36, 49, { blocking: true }],
    ['rusted-barrel', 38, 50, { blocking: true }],
    ['camp-bedroll', 40, 49, { blocking: true, orient: 'se' }],
    ['rubble-pile', 35, 51, { blocking: true }],
    ['paper-scraps', 37, 47, {}]
  ]) addObject(objects, kind, x, y, extra);

  addObject(objects, 'canvas-tent', 49, 49, { blocking: true, orient: 'se' });
  addObject(objects, 'campfire', 52, 51, { blocking: true });
  addObject(objects, 'field-cart', 54, 53, { blocking: true, orient: 'sw' });
  addObject(objects, 'settlement-table', 51, 48, { blocking: true, orient: 'se' });
  addObject(objects, 'rusted-barrel', 48, 52, { blocking: true });
  addObject(objects, 'camp-bedroll', 50, 55, { blocking: true, orient: 'se' });
  addObject(objects, 'camp-bedroll', 56, 55, { blocking: true, orient: 'sw' });
  addObject(objects, 'overturned-field-cart', 79, 41, {
    id: 'old-pilgrim-field-cart-before-release',
    blocking: true,
    orient: 'se',
    hiddenWhenFlags: ['old-pilgrim-field-cart-flank']
  });
  addObject(objects, 'overturned-field-cart', 81, 42, {
    id: 'old-pilgrim-field-cart-after-release',
    blocking: true,
    orient: 'sw',
    visibleWhenFlags: ['old-pilgrim-field-cart-flank']
  });

  addObject(objects, 'clinic-bed', 46, 55, {
    blocking: true,
    orient: 'se',
    visibleWhenFlags: ['south-measure-compact']
  });
  addObject(objects, 'medicine-cart', 48, 56, {
    blocking: true,
    orient: 'se',
    visibleWhenFlags: ['south-measure-compact']
  });
  addObject(objects, 'sealed-storage-crate', 65, 53, {
    blocking: true,
    visibleWhenFlags: ['south-measure-morrow']
  });
  addObject(objects, 'field-cart', 67, 52, {
    blocking: true,
    orient: 'sw',
    visibleWhenFlags: ['south-measure-morrow']
  });
  addObject(objects, 'farm-workbench', 65, 56, {
    blocking: true,
    orient: 'sw',
    visibleWhenFlags: ['south-measure-resident']
  });
  addObject(objects, 'rusted-barrel', 67, 56, {
    blocking: true,
    visibleWhenFlags: ['south-measure-resident']
  });
  addObject(objects, 'canvas-tent', 45, 55, {
    blocking: true,
    orient: 'se',
    visibleWhenFlags: ['south-measure-sealed']
  });
  addObject(objects, 'camp-bedroll', 47, 57, {
    blocking: true,
    orient: 'se',
    visibleWhenFlags: ['south-measure-sealed']
  });
  addNote(objects, {
    id: 'old-pilgrim-procession-skeleton',
    kind: 'skeleton',
    name: 'Roadside Pilgrim',
    x: 68,
    y: 28,
    log: 'Old pilgrim cloth remains under the ribs. The body predates the fresh movement in the east field.'
  });
  addContainer(objects, {
    id: 'old-pilgrim-road-backpack',
    kind: 'field-backpack',
    name: 'Abandoned Road Pack',
    x: 42,
    y: 47,
    log: 'The shoulder strap was cut cleanly. A dressing and two ducats remain under the blanket roll.',
    loot: [
      { item: 'field-dressing', count: 1 },
      { item: 'ducat', count: 2 }
    ]
  });
  addContainer(objects, {
    id: 'old-pilgrim-procession-pouch',
    kind: 'small-pouch',
    name: 'Procession Pouch',
    x: 67,
    y: 33,
    log: 'A road token and one cartridge sit beneath a knot of rotten cord.',
    loot: [
      { item: 'tarnished-saint-token', count: 1 },
      { item: 'relic-rounds', count: 1 }
    ]
  });
  addNote(objects, {
    id: 'old-pilgrim-choir-lesson-slip',
    kind: 'paper-scraps',
    name: 'Northern Lesson Slip',
    x: 51,
    y: 47,
    log: 'A copied lesson tells rejected travelers to welcome the voice that knows their name before they speak it.',
    visibleWhenFlags: ['choir-influence-south-measure']
  });
  addNote(objects, {
    id: 'old-pilgrim-nel-south-measure-card',
    kind: 'paper-scraps',
    name: 'South Measure Lesson Card',
    x: 48,
    y: 50,
    log: 'Noa left one alphabet card under a cup: SCHOOL KEPT SOUTH FOR ONE SEASON.',
    visibleWhenFlags: ['nel-stays-one-season']
  });

  addNote(objects, {
    id: 'old-pilgrim-field-lessa',
    kind: 'corpse',
    name: 'Leah at the Mule Trace',
    x: 78,
    y: 44,
    log: 'Leah’s coat is torn at the back, but the body never opened. One hand still grips the mule trace she tried to cut.',
    visibleWhenFlags: ['old-pilgrim-fields-cleared']
  });
  addNote(objects, {
    id: 'old-pilgrim-field-venn',
    kind: 'corpse',
    name: 'Abner Beneath the Cart Rail',
    x: 80,
    y: 39,
    log: 'Abner died beneath the rail with Tobias’s red load pin in reach. The unopened knife at the belt carries a cartwright’s mark.',
    visibleWhenFlags: ['old-pilgrim-fields-cleared']
  });
  for (const [x, y, variant] of [
    [82, 39, 'runner'], [85, 37, 'bell'], [87, 42, 'cord'], [90, 39, 'runner'], [84, 44, 'runner']
  ]) addObject(objects, 'opened-pilgrim-remains', x, y, {
    blocking: false,
    variant,
    visibleWhenFlags: ['old-pilgrim-fields-cleared']
  });
  addContainer(objects, {
    id: 'old-pilgrim-field-team-pack',
    kind: 'field-backpack',
    name: 'Leah and Abner’s Road Pack',
    x: 77,
    y: 40,
    log: 'The pack was wedged under the dropped cart bed. Two cartridges and the team’s last sealed dressing survived.',
    loot: [
      { item: 'relic-rounds', count: 2 },
      { item: 'field-dressing', count: 1 }
    ],
    visibleWhenFlags: ['old-pilgrim-fields-cleared']
  });

  const npcs = [
    {
      actor: 'old-pilgrim-sister-calen', spawnId: 'old-pilgrim-sister-calen',
      x: 55, y: 50, facing: 'se', dialogue: 'old-pilgrim-sister-calen', talkRadius: 1,
      ambient: ['“Cups upright for the living. Mouth-down for the missing.”'],
      mapMarker: { label: 'Sister Thecla', kind: 'quest', reveal: 'always' }
    },
    {
      actor: 'old-pilgrim-father-noll', spawnId: 'old-pilgrim-father-noll',
      x: 50, y: 46, facing: 'se', dialogue: 'old-pilgrim-father-noll', talkRadius: 1,
      ambient: ['“An apse stair with no stair. That is either bad copying or good hiding.”'],
      conditions: { flagsAbsent: ['old-pilgrim-return-lift-open'] }
    },
    {
      actor: 'old-pilgrim-oren-bale', spawnId: 'old-pilgrim-oren-bale',
      x: 53, y: 53, facing: 'nw', dialogue: 'old-pilgrim-oren-bale', talkRadius: 1,
      ambient: ['Tobias checks the bandage without moving his shoulder.']
    },
    {
      actor: 'ash-road-south-evin-sael', spawnId: 'old-pilgrim-outcome-compact',
      x: 47, y: 52, facing: 'ne', dialogue: 'old-pilgrim-evin-sael', talkRadius: 1,
      conditions: { flag: 'south-measure-compact' }
    },
    {
      actor: 'ash-road-south-gatt-vire', spawnId: 'old-pilgrim-outcome-morrow',
      x: 64, y: 51, facing: 'nw', dialogue: 'old-pilgrim-gatt-vire', talkRadius: 1,
      conditions: { flag: 'south-measure-morrow' }
    },
    {
      actor: 'ash-road-south-perr-varo', spawnId: 'old-pilgrim-outcome-resident',
      x: 64, y: 54, facing: 'sw', dialogue: 'old-pilgrim-perr-varo', talkRadius: 1,
      conditions: { flag: 'south-measure-resident' }
    },
    {
      actor: 'ash-road-south-hara-doss', spawnId: 'old-pilgrim-outcome-sealed',
      x: 47, y: 54, facing: 'ne', dialogue: 'old-pilgrim-hara-doss', talkRadius: 1,
      conditions: { flag: 'south-measure-sealed' }
    },
    {
      actor: 'brother-tarn', spawnId: 'old-pilgrim-tarn-camp',
      x: 50, y: 53, facing: 'ne', dialogue: 'old-pilgrim-brother-tarn', talkRadius: 1,
      conditions: { flag: 'tarn-shared-road' }
    },
    {
      actor: 'brother-tarn', spawnId: 'old-pilgrim-tarn-scout',
      x: 82, y: 18, facing: 'ne', dialogue: 'old-pilgrim-brother-tarn', talkRadius: 1,
      conditions: { flag: 'tarn-independent-scout' }
    },
    {
      actor: 'ash-road-south-nel-varo', spawnId: 'old-pilgrim-nel-north',
      x: 65, y: 48, facing: 'ne', dialogue: 'old-pilgrim-nel-varo', talkRadius: 1,
      conditions: {
        flagsAtLeast: { count: 1, of: ['nel-school-alone', 'nel-family-review', 'nel-family-forged'] },
        flagsAbsent: ['nel-stays-one-season']
      }
    }
  ];

  const enemies = [
    ['old-pilgrim-cord-bearer', 82, 39, 'old-pilgrim-stage-iv-lead'],
    ['old-pilgrim-bell-throat', 85, 37, 'old-pilgrim-stage-iv-east'],
    ['old-pilgrim-procession-runner', 87, 42, 'old-pilgrim-stage-iv-south'],
    ['old-pilgrim-procession-runner', 90, 39, 'old-pilgrim-stage-iv-far'],
    ['old-pilgrim-procession-runner', 84, 44, 'old-pilgrim-stage-iv-rut']
  ].map(([id, x, y, spawnId], index) => ({
    id,
    spawnId,
    x,
    y,
    facing: index % 2 ? 'sw' : 'nw',
    encounter: 'old-pilgrim-field-opening',
    dormantUntilCombat: true,
    aggroRadius: 0,
    ...(index === 0 ? { loot: [{ item: 'relic-rounds', count: 1 }] } : {})
  }));

  return levelRecord({
    id: 'old-pilgrim-way',
    name: 'Old Pilgrim Way',
    intro: 'Old Pilgrim Way runs north through dead grain. A branch climbs toward a church whose bell has no rope.',
    grid,
    legend: {
      '.': { kind: 'floor', floor: 'ash-dirt', walkable: true },
      r: { kind: 'floor', floor: 'ash-road', walkable: true },
      s: { kind: 'floor', floor: 'road-shoulder', walkable: true },
      w: { kind: 'floor', floor: 'wheat-field', walkable: true },
      f: { kind: 'floor', floor: 'furrow-field', walkable: true },
      d: { kind: 'floor', floor: 'forest-floor', walkable: true },
      g: { kind: 'floor', floor: 'graveyard-earth', walkable: true },
      V: { kind: 'graveyard-vigil-chapel-block', walkable: false }
    },
    player: { x: 60, y: 67, facing: 'n' },
    objects,
    groundItems: [
      { id: 'old-pilgrim-loose-dressing', item: 'field-dressing', count: 1, x: 45, y: 49 },
      { id: 'old-pilgrim-loose-ducat', item: 'ducat', count: 1, x: 65, y: 30 },
      { id: 'old-pilgrim-loose-rounds', item: 'relic-rounds', count: 1, x: 77, y: 43 },
      { id: 'old-pilgrim-loose-token', item: 'tarnished-saint-token', count: 1, x: 89, y: 16 },
      { id: 'old-pilgrim-loose-scrap', item: 'penitent-gear-scrap', count: 1, x: 107, y: 40 }
    ],
    npcs,
    enemies,
    dialogue: ['old-pilgrim-field-opening'],
    mood: {
      floorShade: PALETTE.woodDark,
      floorShadeAlpha: 0.08,
      ambient: PALETTE.stoneDust,
      ambientAlpha: 0.04,
      vignette: 0.12,
      sun: {
        enabled: true,
        shadowOffsetX: 12,
        shadowOffsetY: 6,
        shadowAlpha: 0.12
      }
    },
    combatTriggers: [
      {
        id: 'old-pilgrim-field-trigger',
        encounter: 'old-pilgrim-field-opening',
        x: 78,
        y: 41,
        radius: 4,
        dialogue: 'old-pilgrim-field-opening',
        mapMarker: { label: 'Dead Furrows', kind: 'danger' }
      }
    ],
    combatIntro: [
      'Five bodies rise from separate furrows. Each one waits for the lead prayer cord to pull tight.'
    ],
    victoryLog: 'The last opened pilgrim folds into the dead grain. Nothing else answers from the field.',
    onVictory: {
      setFlag: ['old-pilgrim-fields-cleared', 'old-pilgrim-field-aftermath-ready'],
      questUpdate: {
        quest: 'road-through-the-fields',
        stage: 'report-field-attack',
        log: 'Five Stage IV pilgrims are dead in the east field. Sister Thecla needs the count.'
      }
    }
  });
}

function makeHillChurch() {
  const grid = indoorGrid(44, 32);
  const objects = [];
  hwall(grid, 9, 1, 42, [21, 22]);
  vwall(grid, 11, 1, 30, [6, 7, 20, 21, 26]);
  vwall(grid, 32, 1, 30, [6, 7, 20, 21, 26]);
  hwall(grid, 20, 1, 10, [5]);
  hwall(grid, 20, 33, 42, [37]);
  hwall(grid, 26, 1, 10, [7]);
  hwall(grid, 26, 33, 42, [38]);

  addDialogueObject(objects, {
    id: 'old-pilgrim-church-public-door',
    kind: 'chapel-double-door',
    name: 'Public Church Doors',
    x: 22,
    y: 31,
    dialogue: 'old-pilgrim-hill-church-exit',
    type: 'secret-exit',
    blocking: true,
    wallPlane: 'sw',
    interactionMarker: point(22, 30),
    mapMarker: { label: 'Old Pilgrim Way', kind: 'exit', reveal: 'always' }
  });

  const deskClueEffects = {
    setFlag: 'old-pilgrim-apse-clue-ledger',
    log: 'The foundation inventory reserves depth beneath the apse for a closure office omitted from the public plan.'
  };
  addObject(objects, 'prayer-lectern', 36, 5, {
    id: 'old-pilgrim-closure-desk',
    name: 'Closure Desk',
    blocking: true,
    interact: {
      type: 'note',
      log: 'A foundation inventory is cut into the desk edge. One apse measurement was corrected twice.',
      search: {
        id: 'old-pilgrim-closure-plan-search',
        title: 'Closure Desk',
        lines: ['The corrected apse depth exceeds the public stair and sacristy together.'],
        useLabel: 'Study the foundation inventory',
        methods: [
          {
            id: 'old-pilgrim-read-closure-doctrine',
            label: 'Read the closure office notation',
            field: 'doctrine',
            dc: 27,
            successLog: 'The mark assigns a pressure stair to the novitiate below the apse.',
            failLog: 'The office marks give rank and supply counts, but no clear route.',
            success: deskClueEffects
          },
          {
            id: 'old-pilgrim-measure-apse-foundation',
            label: 'Rebuild the apse measurements',
            field: 'search',
            dc: 27,
            successLog: 'The missing depth forms a second foundation level beneath the altar.',
            failLog: 'The corrected figures will not settle into one plan.',
            success: deskClueEffects
          },
          {
            id: 'old-pilgrim-match-noll-copy',
            label: 'Match Father Noah’s copied line',
            conditions: { flag: 'old-pilgrim-father-plan-hint' },
            dc: 0,
            successLog: 'The copied inner-key line fits the omitted foundation level.',
            failLog: 'The copy does not align with the surviving figures.',
            success: deskClueEffects
          }
        ]
      }
    },
    mapMarker: { label: 'Closure Desk', kind: 'search' }
  });

  addObject(objects, 'loose-flagstone', 20, 4, {
    id: 'old-pilgrim-apse-foundation-seam',
    name: 'Apse Foundation Seam',
    interact: {
      type: 'note',
      log: 'The public floor meets a deeper stone face beneath the apse.',
      search: {
        id: 'old-pilgrim-apse-foundation-search',
        title: 'Apse Foundation',
        lines: ['Plaster hides a vertical joint wider than any settling crack.'],
        methods: [
          {
            id: 'old-pilgrim-trace-foundation-seam',
            label: 'Trace the hidden joint',
            field: 'search',
            dc: 30,
            successLog: 'The joint outlines a door faced with altar stone.',
            failLog: 'The cracked plaster breaks the joint into several possible lines.',
            success: {
              setFlag: 'old-pilgrim-apse-clue-foundation',
              log: 'The apse foundation contains a concealed door-width joint.'
            }
          },
          {
            id: 'old-pilgrim-read-pressure-mortar',
            label: 'Read the pressure mortar',
            field: 'engineering',
            dc: 30,
            successLog: 'Flexible mortar isolates one slab from the surrounding foundation.',
            failLog: 'Age and damp hide the original mortar courses.',
            success: {
              setFlag: 'old-pilgrim-apse-clue-foundation',
              log: 'The apse slab was built to move independently of the church floor.'
            }
          }
        ]
      }
    },
    mapMarker: { label: 'Apse Foundation', kind: 'search' }
  });

  addObject(objects, 'bell-rope', 38, 6, {
    id: 'old-pilgrim-bell-conduit',
    name: 'Severed Bell Conduit',
    blocking: true,
    interact: {
      type: 'note',
      log: 'The bell cable enters the floor instead of climbing directly to the roof.',
      search: {
        id: 'old-pilgrim-bell-conduit-search',
        title: 'Bell Conduit',
        lines: ['Two cables share the chase: the bell line and another that descends beneath the apse.'],
        methods: [
          {
            id: 'old-pilgrim-follow-bell-conduit',
            label: 'Follow the second cable',
            field: 'engineering',
            dc: 27,
            successLog: 'The second cable runs toward a buried pressure release.',
            failLog: 'The two cable paths cross behind the wall and disappear.',
            success: {
              setFlag: ['old-pilgrim-apse-clue-bell', 'old-pilgrim-bell-cable-known']
            }
          },
          {
            id: 'old-pilgrim-read-bell-wear',
            label: 'Read the cable wear',
            field: 'search',
            dc: 30,
            successLog: 'One cable rang the bell. The cleaner cable was pulled only during closure drills.',
            failLog: 'Rust has blurred the wear on both cables.',
            success: {
              setFlag: ['old-pilgrim-apse-clue-bell', 'old-pilgrim-bell-cable-known']
            }
          }
        ]
      }
    },
    mapMarker: { label: 'Bell Conduit', kind: 'search' }
  });

  const apseRelease = (methodFlag) => ({
    setFlag: ['old-pilgrim-apse-release-found', methodFlag],
    questUpdate: {
      quest: 'the-buried-novitiate',
      stage: 'enter-buried-novitiate',
      log: 'The concealed apse door opens onto a sealed closure stair.'
    },
    loadLevel: {
      path: './data/levels/old_pilgrim_closure_stair.json',
      player: { x: 15, y: 3, facing: 's' }
    }
  });
  addObject(objects, 'wall-stair-door', 22, 0, {
    id: 'old-pilgrim-concealed-apse-door',
    name: 'Concealed Apse Door',
    blocking: true,
    passableWhenOpen: true,
    wallPlane: 'sw',
    visibleWhenFlags: ['old-pilgrim-closure-plan-read'],
    interactionMarker: point(22, 1),
    interact: {
      type: 'secret-entrance',
      log: 'The apse stone draws inward around a pressure-rated stair.',
      lock: {
        id: 'old-pilgrim-apse-release-lock',
        title: 'Apse Closure Release',
        lines: ['Two retaining teeth sit behind the altar plinth. Neither belongs to the public church.'],
        methods: [
          {
            id: 'old-pilgrim-release-apse-engineering',
            label: 'Balance the retaining teeth',
            field: 'engineering',
            dc: 27,
            successLog: 'Both teeth lift under equal load. The apse stone withdraws.',
            failLog: 'One tooth rises while the other bites deeper.',
            success: apseRelease('old-pilgrim-apse-opened-engineering')
          },
          {
            id: 'old-pilgrim-release-apse-security',
            label: 'Walk the concealed release pins',
            field: 'security',
            dc: 27,
            requiresSecurityTool: false,
            successLog: 'The pins turn in opposite order. The apse stone withdraws.',
            failLog: 'The final pin stays loaded behind the stone.',
            success: apseRelease('old-pilgrim-apse-opened-security')
          }
        ]
      }
    },
    mapMarker: { label: 'Buried Apse Door', kind: 'locked' }
  });

  addDialogueObject(objects, {
    id: 'old-pilgrim-raised-apse',
    kind: 'damaged-altar',
    name: 'Raised Apse',
    x: 22,
    y: 5,
    dialogue: 'old-pilgrim-apse-synthesis',
    blocking: true,
    mapMarker: { label: 'Raised Apse', kind: 'search' }
  });
  addObject(objects, 'prayer-lectern', 19, 7, { blocking: true });
  addObject(objects, 'chapel-font', 24, 12, { blocking: true });
  for (const [x, y, orient] of [
    [16, 14, 'se'], [26, 14, 'sw'], [16, 18, 'se'], [26, 18, 'sw'],
    [16, 22, 'se'], [26, 22, 'sw'], [16, 26, 'se'], [26, 26, 'sw']
  ]) addObject(objects, 'broken-pew', x, y, { blocking: true, orient });
  for (const [x, y, orient] of [[5, 12, 'se'], [8, 16, 'sw'], [5, 23, 'se'], [8, 29, 'sw']]) {
    addObject(objects, 'pilgrim-cot', x, y, { blocking: true, orient, variant: 'hospice' });
  }
  addObject(objects, 'dining-table', 37, 15, { blocking: true, orient: 'se' });
  addObject(objects, 'dining-bench', 39, 16, { blocking: true, orient: 'se' });
  addObject(objects, 'pantry-shelf', 40, 23, { blocking: true });
  addObject(objects, 'farm-prep-table', 35, 28, { blocking: true, orient: 'sw' });
  addObject(objects, 'vigil-candle-rack', 7, 4, { blocking: true });
  addObject(objects, 'mortuary-washing-table', 5, 17, { blocking: true, orient: 'se' });
  addObject(objects, 'rusted-barrel', 9, 24, { blocking: true });
  addObject(objects, 'paper-scraps', 35, 18);
  addObject(objects, 'wax-stain', 22, 9);
  addNote(objects, {
    id: 'old-pilgrim-public-hospice-roll',
    kind: 'pilgrim-memorial-tablet',
    name: 'Road Hospice Board',
    x: 10,
    y: 15,
    log: 'The board sorts cots by illness and distance walked. Pilgrims unable to pay were given the west wall and morning work.',
    blocking: true,
    variant: 'hospice-board'
  });
  addNote(objects, {
    id: 'old-pilgrim-public-road-register',
    kind: 'paper-scraps',
    name: 'Last Public Road Register',
    x: 37,
    y: 18,
    log: 'The last public page records sixty-one people sent below during the regional alarm. No page records their return.'
  });
  addNote(objects, {
    id: 'old-pilgrim-return-lift-landing',
    kind: 'stone-stairwell',
    name: 'Opened Bell Lift',
    x: 37,
    y: 8,
    log: 'The narrow lift now stands level with the bell stair. Its cable drops into the buried chapter.',
    blocking: true,
    visibleWhenFlags: ['old-pilgrim-return-lift-open']
  });
  addContainer(objects, {
    id: 'old-pilgrim-church-hospice-chest',
    kind: 'rusted-crate',
    name: 'Hospice Linen Chest',
    x: 4,
    y: 27,
    log: 'Mice took the linen. A sealed dressing and three old ducats remain under the false bottom.',
    loot: [
      { item: 'field-dressing', count: 1 },
      { item: 'ducat', count: 3 }
    ]
  });

  addObject(objects, 'pilgrim-memorial-tablet', 19, 5, {
    id: 'old-pilgrim-public-name-memorial',
    blocking: true,
    variant: 'memorial',
    visibleWhenFlags: ['old-pilgrim-names-memorial']
  });
  addObject(objects, 'pilgrim-memorial-tablet', 36, 15, {
    id: 'old-pilgrim-road-book-copy',
    blocking: true,
    variant: 'road-book',
    visibleWhenFlags: ['old-pilgrim-names-road-copy']
  });
  addObject(objects, 'pilgrim-memorial-tablet', 37, 7, {
    id: 'old-pilgrim-sealed-name-casket',
    blocking: true,
    variant: 'sealed',
    visibleWhenFlags: ['old-pilgrim-names-sealed']
  });

  const npcs = [
    {
      actor: 'old-pilgrim-father-noll',
      spawnId: 'old-pilgrim-father-noll-below',
      x: 20,
      y: 7,
      facing: 'ne',
      dialogue: 'old-pilgrim-father-noll-below',
      talkRadius: 1,
      conditions: { flag: 'old-pilgrim-return-lift-open' },
      ambient: ['“Sixty-one names. The count was the easy part.”'],
      mapMarker: { label: 'Father Noah', kind: 'quest' }
    }
  ];

  return levelRecord({
    id: 'old-pilgrim-hill-church',
    name: 'Hill Church',
    intro: 'The Hill Church smells of wet plaster and old linen. Nothing has lived in the public rooms for years.',
    grid,
    legend: indoorLegend,
    player: { x: 22, y: 29, facing: 'n' },
    objects,
    npcs,
    groundItems: [
      { id: 'old-pilgrim-church-loose-token', item: 'tarnished-saint-token', count: 1, x: 8, y: 8 }
    ],
    mood: {
      floorShade: PALETTE.stoneDark,
      floorShadeAlpha: 0.18,
      ambient: PALETTE.clothBlueDark,
      ambientAlpha: 0.08,
      vignette: 0.2
    }
  });
}

function makeClosureStair() {
  const grid = indoorGrid(32, 48);
  const objects = [];
  vwall(grid, 9, 1, 46, [7, 8, 18, 19, 29, 30, 40, 41]);
  vwall(grid, 22, 1, 46, [7, 8, 18, 19, 29, 30, 40, 41]);
  hwall(grid, 12, 1, 8, [5]);
  hwall(grid, 24, 1, 8, [4]);
  hwall(grid, 35, 1, 8, [6]);
  hwall(grid, 12, 23, 30, [27]);
  hwall(grid, 24, 23, 30, [26]);
  hwall(grid, 35, 23, 30, [28]);

  addDialogueObject(objects, {
    id: 'old-pilgrim-closure-upper-stair',
    kind: 'wall-stair-door',
    name: 'Apse Stair',
    x: 15,
    y: 0,
    dialogue: 'old-pilgrim-closure-to-church',
    type: 'secret-exit',
    blocking: true,
    wallPlane: 'sw',
    interactionMarker: point(15, 1),
    mapMarker: { label: 'Hill Church', kind: 'exit', reveal: 'always' }
  });

  addDialogueObject(objects, {
    id: 'old-pilgrim-closure-duty-register',
    kind: 'closure-control-panel',
    name: 'Closure Duty Register',
    x: 18,
    y: 5,
    dialogue: 'old-pilgrim-closure-register',
    blocking: true,
    variant: 'register',
    mapMarker: { label: 'Duty Register', kind: 'quest' }
  });
  addDialogueObject(objects, {
    id: 'old-pilgrim-outer-manual-release',
    kind: 'closure-control-panel',
    name: 'Manual Release Wheel',
    x: 12,
    y: 6,
    dialogue: 'old-pilgrim-manual-release',
    blocking: true,
    variant: 'wheel',
    mapMarker: { label: 'Manual Release', kind: 'search' }
  });

  const innerDoorSuccess = (routeFlag) => ({
    setFlag: ['old-pilgrim-inner-pressure-open', routeFlag],
    questUpdate: {
      quest: 'the-buried-novitiate',
      stage: 'read-water-tally',
      log: 'The inner pressure door opens onto the novitiate quarters.'
    },
    loadLevel: {
      path: './data/levels/old_pilgrim_novitiate_quarters.json',
      player: { x: 24, y: 31, facing: 'n' }
    }
  });
  addObject(objects, 'wall-stair-door', 15, 47, {
    id: 'old-pilgrim-inner-pressure-door',
    name: 'Inner Pressure Door',
    blocking: true,
    passableWhenOpen: true,
    wallPlane: 'sw',
    interactionMarker: point(15, 46),
    interact: {
      type: 'secret-entrance',
      log: 'The inner pressure door withdraws into a deep stone pocket.',
      lock: {
        id: 'old-pilgrim-inner-pressure-lock',
        title: 'Inner Pressure Door',
        lines: ['A short keyway sits between two manual release ports. Scratches crowd the ports, not the keyway.'],
        methods: [
          {
            id: 'old-pilgrim-use-service-key',
            label: 'Use the Novitiate Service Key',
            requiresItem: 'old-pilgrim-service-key',
            successLog: 'The short key turns. Both pressure bolts withdraw in sequence.',
            success: innerDoorSuccess('old-pilgrim-inner-opened-key')
          },
          {
            id: 'old-pilgrim-release-inner-engineering',
            label: 'Equalize the manual releases',
            field: 'engineering',
            dc: 32,
            successLog: 'Both release ports take weight together. The pressure bolts withdraw.',
            failLog: 'One bolt withdraws and drives the other deeper.',
            success: innerDoorSuccess('old-pilgrim-inner-opened-engineering')
          },
          {
            id: 'old-pilgrim-release-inner-security',
            label: 'Walk the pressure keyway',
            field: 'security',
            dc: 32,
            requiresSecurityTool: false,
            successLog: 'The keyway gives up both bolt orders. The pressure door opens.',
            failLog: 'The second bolt resets before the first clears.',
            success: innerDoorSuccess('old-pilgrim-inner-opened-security')
          }
        ]
      }
    },
    mapMarker: { label: 'Inner Pressure Door', kind: 'locked' }
  });

  for (const [x, y, variant] of [
    [15, 5, 'upper'], [15, 10, 'upper'], [15, 15, 'middle'], [15, 20, 'middle'],
    [15, 25, 'middle'], [15, 30, 'lower'], [15, 35, 'lower'], [15, 40, 'lower']
  ]) addObject(objects, 'stone-stairwell', x, y, { blocking: true, orient: y % 10 ? 'se' : 'sw', variant });

  addObject(objects, 'mortuary-washing-table', 4, 7, { blocking: true, orient: 'se' });
  addObject(objects, 'mortuary-washing-table', 27, 7, { blocking: true, orient: 'sw' });
  addObject(objects, 'pantry-shelf', 5, 18, { blocking: true, orient: 'se' });
  addObject(objects, 'pantry-shelf', 26, 18, { blocking: true, orient: 'sw' });
  addObject(objects, 'settling-tank', 5, 29, { blocking: true, orient: 'se' });
  addObject(objects, 'water-pump', 27, 29, { blocking: true });
  addObject(objects, 'rubble-pile', 5, 40, { blocking: true });
  addObject(objects, 'wall-broken', 0, 40, { blocking: true });
  addObject(objects, 'tool-rack', 27, 40, { blocking: true });
  addObject(objects, 'machine-oil', 12, 7);
  addObject(objects, 'rubble-decal', 7, 41);
  addObject(objects, 'floor-crack', 6, 42);
  addObject(objects, 'paper-scraps', 25, 21);

  const bodies = [
    ['outer-wheel-nun', 'Nun at the Outer Wheel', 11, 7, 'A rotted veil lies under the skull. Both hands rest toward the manual wheel, which never moved after closure.'],
    ['upper-landing-priest', 'Priest on the Upper Landing', 18, 9, 'A priest died with the public stair in sight. His finger bones point toward the sealed apse above.'],
    ['wash-room-pilgrim', 'Pilgrim in the Wash Room', 4, 9, 'The pilgrim curled beneath a dry basin with an empty cup inside the coat.'],
    ['locker-novice', 'Novice at the Lockers', 7, 18, 'A novice reached the service lockers. The key ring was dragged from one hand after death.'],
    ['bell-cable-sister', 'Sister Below the Bell Cable', 25, 20, 'Bell cord is wound around the wrist bones. The cable was pulled until the upper fibers parted.'],
    ['tank-pilgrim', 'Pilgrim at the Emergency Tank', 7, 30, 'The tank tap rests between the ribs. Lime marks show that it was dry before this pilgrim reached it.'],
    ['breach-priest', 'Priest at the Failed Breach', 6, 41, 'A masonry hammer lies beside the arm. The wall lost one handspan before the tools stopped.'],
    ['inner-door-sister', 'Sister at the Inner Door', 18, 44, 'The sister died facing the quarters, not the surface. A service prayer is scratched beside the inner keyway.']
  ];
  for (const [suffix, name, x, y, log] of bodies) {
    addNote(objects, {
      id: `old-pilgrim-closure-${suffix}`,
      kind: 'skeleton',
      name,
      x,
      y,
      log
    });
  }

  addContainer(objects, {
    id: 'old-pilgrim-closure-service-locker',
    kind: 'sealed-storage-crate',
    name: 'Closure Service Locker',
    x: 5,
    y: 17,
    log: 'The locker seal failed along one hinge. A gear plate and old field coin remain inside.',
    loot: [
      { item: 'penitent-gear-scrap', count: 1 },
      { item: 'ducat', count: 2 }
    ]
  });
  addObject(objects, 'closure-control-panel', 8, 29, {
    id: 'old-pilgrim-empty-emergency-tank',
    name: 'Emergency Tank Gauge',
    blocking: true,
    variant: 'gauge',
    wallPlane: 'se',
    interact: {
      type: 'note',
      log: 'The gauge was marked empty on the second day. A later hand added: MAIN CISTERN BELOW.',
      search: {
        id: 'old-pilgrim-emergency-gauge-search',
        title: 'Emergency Tank Gauge',
        lines: ['The indicator stopped at empty, but dated scratch marks continue beneath it.'],
        methods: [
          {
            id: 'old-pilgrim-read-emergency-gauge',
            label: 'Read the dated scratches',
            field: 'search',
            dc: 25,
            successLog: 'The stair reserve ran dry during the second night. Later cups came up from the main cistern below.',
            failLog: 'Several hands cut over the dates until the order is unclear.',
            success: { setFlag: 'old-pilgrim-empty-tank-known', xp: 4 }
          },
          {
            id: 'old-pilgrim-test-emergency-feed',
            label: 'Trace the emergency feed',
            field: 'engineering',
            dc: 27,
            successLog: 'The feed valve is sound. The small tank was simply exhausted before the main line failed.',
            failLog: 'Scale hides where the emergency feed joined the lower line.',
            success: { setFlag: 'old-pilgrim-empty-tank-known', xp: 4 }
          }
        ]
      }
    },
    mapMarker: { label: 'Emergency Tank', kind: 'search' }
  });

  return levelRecord({
    id: 'old-pilgrim-closure-stair',
    name: 'Closure Stair',
    intro: 'The pressure stair drops below the church in long, dry flights. The people caught here died facing both doors.',
    grid,
    legend: indoorLegend,
    player: { x: 15, y: 3, facing: 's' },
    objects,
    groundItems: [
      { id: 'old-pilgrim-loose-service-key', item: 'old-pilgrim-service-key', count: 1, x: 7, y: 17 }
    ],
    mood: {
      floorShade: PALETTE.outline,
      floorShadeAlpha: 0.28,
      ambient: PALETTE.clothBlueDark,
      ambientAlpha: 0.17,
      vignette: 0.32
    }
  });
}

function makeNovitiateQuarters() {
  const grid = indoorGrid(48, 34);
  const objects = [];
  hwall(grid, 9, 1, 46, [23, 24]);
  hwall(grid, 22, 1, 46, [10, 11, 23, 24, 36, 37]);
  vwall(grid, 12, 1, 21, [5, 6, 15, 16]);
  vwall(grid, 35, 1, 21, [5, 6, 15, 16]);
  vwall(grid, 20, 10, 32, [16, 17, 27, 28]);
  vwall(grid, 27, 10, 32, [16, 17, 27, 28]);

  addDialogueObject(objects, {
    id: 'old-pilgrim-quarters-south-door',
    kind: 'wall-stair-door',
    name: 'Closure Stair Door',
    x: 24,
    y: 33,
    dialogue: 'old-pilgrim-quarters-to-closure',
    type: 'secret-exit',
    blocking: true,
    wallPlane: 'sw',
    interactionMarker: point(24, 32),
    mapMarker: { label: 'Closure Stair', kind: 'exit', reveal: 'always' }
  });
  addDialogueObject(objects, {
    id: 'old-pilgrim-quarters-trial-passage',
    kind: 'wall-stair-door',
    name: 'Profession Passage',
    x: 24,
    y: 0,
    dialogue: 'old-pilgrim-quarters-to-trials',
    type: 'secret-exit',
    blocking: true,
    wallPlane: 'sw',
    interactionMarker: point(24, 1),
    visibleWhenFlags: ['old-pilgrim-trial-route-open'],
    mapMarker: { label: 'Trial Galleries', kind: 'exit' }
  });

  for (const [x, y, orient] of [
    [3, 3, 'se'], [7, 3, 'sw'], [3, 7, 'se'], [8, 7, 'sw'],
    [15, 3, 'se'], [19, 3, 'sw'], [28, 3, 'se'], [32, 3, 'sw'],
    [38, 3, 'se'], [43, 3, 'sw'], [39, 7, 'se'], [44, 7, 'sw']
  ]) addObject(objects, 'pilgrim-cot', x, y, {
    blocking: true,
    orient,
    variant: x < 12 ? 'novice' : x > 35 ? 'sister' : 'priest'
  });
  addObject(objects, 'dining-table', 8, 15, { blocking: true, orient: 'se' });
  addObject(objects, 'dining-bench', 10, 16, { blocking: true, orient: 'se' });
  addObject(objects, 'dining-table', 39, 15, { blocking: true, orient: 'sw' });
  addObject(objects, 'dining-bench', 37, 16, { blocking: true, orient: 'sw' });
  addObject(objects, 'pantry-shelf', 4, 25, {
    id: 'old-pilgrim-stripped-pantry-shelf',
    name: 'Stripped Pantry Shelf',
    blocking: true,
    interact: {
      type: 'note',
      log: 'Every peg and leather hinge was cut from the shelf. Even the glue was scraped away.',
      search: {
        id: 'old-pilgrim-pantry-search',
        title: 'Stripped Pantry',
        lines: ['Knife marks divide the shelf fittings into equal shares.'],
        methods: [
          {
            id: 'old-pilgrim-read-pantry-shares',
            label: 'Read the division marks',
            field: 'search',
            dc: 25,
            successLog: 'The congregation rationed leather and glue after the food stores emptied.',
            failLog: 'The cuts are too crowded to separate repairs from rationing.',
            success: { setFlag: 'old-pilgrim-pantry-stripped-known', xp: 4 }
          },
          {
            id: 'old-pilgrim-read-starvation-practice',
            label: 'Read the starvation measures',
            field: 'medicine',
            dc: 27,
            successLog: 'The cuts are deliberate portions of boiled leather, not desperate bites.',
            failLog: 'Time has erased the residue that would show how the fittings were used.',
            success: { setFlag: 'old-pilgrim-pantry-stripped-known', xp: 4 }
          }
        ]
      }
    },
    mapMarker: { label: 'Stripped Pantry', kind: 'search' }
  });
  addObject(objects, 'pantry-shelf', 8, 28, { blocking: true });
  addDialogueObject(objects, {
    id: 'old-pilgrim-novitiate-pump',
    kind: 'water-pump',
    name: 'Novitiate Pump',
    x: 32,
    y: 27,
    dialogue: 'old-pilgrim-quarters-pump',
    blocking: true,
    mapMarker: { label: 'Dead Pump', kind: 'search' }
  });
  addDialogueObject(objects, {
    id: 'old-pilgrim-dry-cistern',
    kind: 'settling-tank',
    name: 'Dry Cistern',
    x: 39,
    y: 27,
    dialogue: 'old-pilgrim-quarters-cistern',
    blocking: true,
    orient: 'sw',
    mapMarker: { label: 'Dry Cistern', kind: 'search' }
  });
  addObject(objects, 'prayer-lectern', 23, 14, { blocking: true });
  addObject(objects, 'vigil-candle-rack', 24, 19, { blocking: true });
  addObject(objects, 'wall-stash', 47, 27, { blocking: true, wallPlane: 'se' });
  addObject(objects, 'chalk-drawing', 6, 6);
  addObject(objects, 'paper-scraps', 17, 7);
  addObject(objects, 'wax-stain', 23, 18);
  addObject(objects, 'ritual-bowl', 9, 14, { blocking: true });
  addObject(objects, 'ritual-bowl', 38, 14, { blocking: true });

  addDialogueObject(objects, {
    id: 'old-pilgrim-novitiate-sleeping-roll',
    kind: 'pilgrim-memorial-tablet',
    name: 'Novitiate Sleeping Roll',
    x: 16,
    y: 27,
    dialogue: 'old-pilgrim-quarters-roll',
    blocking: true,
    variant: 'record',
    mapMarker: { label: 'Sleeping Roll', kind: 'quest' }
  });

  addDialogueObject(objects, {
    id: 'old-pilgrim-last-water-tally',
    kind: 'closure-control-panel',
    name: 'Last Water Tally',
    x: 35,
    y: 27,
    dialogue: 'old-pilgrim-water-tally',
    type: 'dialogue',
    blocking: true,
    variant: 'tally',
    wallPlane: 'se',
    mapMarker: { label: 'Last Water Tally', kind: 'quest' }
  });

  const bodies = [
    ['candidate-one', 'Novice in the Candidate Dormitory', 5, 5, 'The novice died under a shared blanket. A cup was placed beside each hand.'],
    ['candidate-two', 'Novice Beside the Dormitory Door', 10, 7, 'The door is open. The novice had nowhere farther to go.'],
    ['sister-cell-one', 'Nun in the East Cell', 40, 5, 'A prayer cord crosses the finger bones. The knots stop at the ninth day.'],
    ['sister-cell-two', 'Nun at the Refectory Bench', 37, 17, 'A wooden spoon was shaved along both edges. No food stain remains in the bowl.'],
    ['priest-cell-one', 'Priest in the West Cell', 16, 5, 'The priest used a folded office robe as a pillow. The pockets are empty.'],
    ['priest-cell-two', 'Priest at the Common Table', 10, 14, 'Four tally cuts mark the table beside the ribs. A fifth cut was started.'],
    ['pantry-sister', 'Sister in the Stripped Pantry', 6, 27, 'Shelf pegs and leather ties were chewed down to their hard ends. Glue scraps lie between the teeth.'],
    ['pump-novice', 'Novice at the Dead Pump', 30, 28, 'Both arm bones lie beneath the pump handle. The leather piston was cut out and boiled.'],
    ['cistern-pilgrim-one', 'Pilgrim at the Dry Cistern', 40, 29, 'The skull rests against the tank seam. No damp mark survives beneath it.'],
    ['cistern-pilgrim-two', 'Pilgrim Beneath the Gauge', 43, 25, 'A fingernail scratched the final empty mark lower than the gauge could travel.'],
    ['prayer-cell-sister', 'Nun in the Prayer Cell', 23, 18, 'The nun died sitting upright. The wall prayer ends with the names of the remaining children.'],
    ['north-passage-priest', 'Priest at the Profession Passage', 24, 3, 'The priest faced the trial door with a service plate held against the chest.']
  ];
  for (const [suffix, name, x, y, log] of bodies) {
    addNote(objects, {
      id: `old-pilgrim-quarters-${suffix}`,
      kind: 'skeleton',
      name,
      x,
      y,
      log
    });
  }

  addContainer(objects, {
    id: 'old-pilgrim-quarters-record-chest',
    kind: 'rusted-crate',
    name: 'Novitiate Record Chest',
    x: 18,
    y: 27,
    log: 'The chest holds wax tablets and a saint token. A small purse was left unopened by the trapped congregation.',
    loot: [
      { item: 'tarnished-saint-token', count: 1 },
      { item: 'ducat', count: 3 }
    ]
  });

  return levelRecord({
    id: 'old-pilgrim-novitiate-quarters',
    name: 'Novitiate Quarters',
    intro: 'Beds and prayer cells hold the congregation where thirst stopped them. The bodies are old, but every door remains shut.',
    grid,
    legend: indoorLegend,
    player: { x: 24, y: 31, facing: 'n' },
    objects,
    groundItems: [
      { id: 'old-pilgrim-quarters-loose-token', item: 'tarnished-saint-token', count: 1, x: 21, y: 13 }
    ],
    mood: {
      floorShade: PALETTE.outline,
      floorShadeAlpha: 0.3,
      ambient: PALETTE.clothBlueDark,
      ambientAlpha: 0.18,
      vignette: 0.35
    }
  });
}

function makeTrialGalleries() {
  const grid = indoorGrid(64, 48);
  const objects = [];
  hwall(grid, 10, 1, 62, [15, 16, 31, 32, 47, 48]);
  hwall(grid, 37, 1, 62, [15, 16, 31, 32, 47, 48]);
  vwall(grid, 20, 11, 36, [23, 24]);
  vwall(grid, 43, 11, 36, [23, 24]);
  hwall(grid, 23, 1, 19, [10, 11]);
  hwall(grid, 23, 44, 62, [52, 53]);

  addDialogueObject(objects, {
    id: 'old-pilgrim-trials-south-stair',
    kind: 'wall-stair-door',
    name: 'Candidate Stair',
    x: 32,
    y: 47,
    dialogue: 'old-pilgrim-trials-to-quarters',
    type: 'secret-exit',
    blocking: true,
    wallPlane: 'sw',
    interactionMarker: point(32, 46),
    mapMarker: { label: 'Novitiate Quarters', kind: 'exit', reveal: 'always' }
  });
  addDialogueObject(objects, {
    id: 'old-pilgrim-final-profession-door',
    kind: 'chapel-double-door',
    name: 'Final Profession Door',
    x: 32,
    y: 0,
    dialogue: 'old-pilgrim-final-profession',
    type: 'secret-exit',
    blocking: true,
    wallPlane: 'sw',
    interactionMarker: point(32, 1),
    mapMarker: { label: 'Final Profession', kind: 'quest' }
  });

  addDialogueObject(objects, {
    id: 'old-pilgrim-quiet-threshold',
    kind: 'pilgrim-trial-frame',
    name: 'Quiet Threshold',
    x: 10,
    y: 17,
    dialogue: 'old-pilgrim-trial-quiet',
    blocking: true,
    variant: 'quiet',
    state: 'idle',
    hiddenWhenFlags: ['old-pilgrim-trial-quiet'],
    mapMarker: { label: 'Quiet Threshold', kind: 'quest' }
  });
  addDialogueObject(objects, {
    id: 'old-pilgrim-service-trial',
    kind: 'pilgrim-trial-frame',
    name: 'Trial of Service',
    x: 53,
    y: 17,
    dialogue: 'old-pilgrim-trial-service',
    blocking: true,
    variant: 'service',
    state: 'idle',
    hiddenWhenFlags: ['old-pilgrim-trial-service'],
    mapMarker: { label: 'Trial of Service', kind: 'quest' }
  });
  addDialogueObject(objects, {
    id: 'old-pilgrim-burden-trial',
    kind: 'pilgrim-trial-frame',
    name: 'Burden Gallery',
    x: 10,
    y: 30,
    dialogue: 'old-pilgrim-trial-burden',
    blocking: true,
    variant: 'burden',
    state: 'idle',
    hiddenWhenFlags: ['old-pilgrim-trial-burden'],
    mapMarker: { label: 'Burden Gallery', kind: 'quest' }
  });
  addDialogueObject(objects, {
    id: 'old-pilgrim-mercy-trial',
    kind: 'pilgrim-trial-frame',
    name: 'Trial of Mercy',
    x: 53,
    y: 30,
    dialogue: 'old-pilgrim-trial-mercy',
    blocking: true,
    variant: 'mercy',
    state: 'idle',
    hiddenWhenFlags: ['old-pilgrim-trial-mercy'],
    mapMarker: { label: 'Trial of Mercy', kind: 'quest' }
  });

  for (const [id, x, y] of [
    ['quiet', 10, 17], ['service', 53, 17], ['burden', 10, 30], ['mercy', 53, 30]
  ]) {
    addObject(objects, 'pilgrim-trial-frame', x, y, {
      id: `old-pilgrim-${id}-trial-kept-state`,
      blocking: true,
      variant: id,
      state: 'kept',
      visibleWhenFlags: [`old-pilgrim-trial-${id}-kept`]
    });
    addObject(objects, 'pilgrim-trial-frame', x, y, {
      id: `old-pilgrim-${id}-trial-broken-state`,
      blocking: true,
      variant: id,
      state: 'broken',
      visibleWhenFlags: [`old-pilgrim-trial-${id}-broken`]
    });
  }

  addObject(objects, 'pilgrim-trial-frame', 32, 5, {
    id: 'old-pilgrim-profession-console-idle',
    blocking: true,
    variant: 'profession',
    state: 'idle',
    hiddenWhenFlags: ['old-pilgrim-profession-intact', 'old-pilgrim-profession-forced']
  });
  addObject(objects, 'pilgrim-trial-frame', 32, 5, {
    id: 'old-pilgrim-profession-console-intact',
    blocking: true,
    variant: 'profession',
    state: 'kept',
    visibleWhenFlags: ['old-pilgrim-profession-intact']
  });
  addObject(objects, 'pilgrim-trial-frame', 32, 5, {
    id: 'old-pilgrim-profession-console-forced',
    blocking: true,
    variant: 'profession',
    state: 'broken',
    visibleWhenFlags: ['old-pilgrim-profession-forced']
  });

  for (const [x, y] of [[7, 15], [13, 19]]) {
    addObject(objects, 'vigil-candle-rack', x, y, { blocking: true });
  }
  for (const [x, y] of [[6, 17], [8, 17], [12, 17], [14, 17]]) {
    addObject(objects, 'listening-wire', x, y);
  }
  for (const [x, y] of [[48, 15], [57, 15], [48, 20], [57, 20]]) {
    addObject(objects, 'mortuary-washing-table', x, y, { blocking: true, orient: x < 53 ? 'se' : 'sw' });
  }
  addObject(objects, 'tool-rack', 7, 30, { blocking: true });
  addObject(objects, 'tool-rack', 14, 30, { blocking: true });
  addObject(objects, 'cracked-column', 8, 27, { blocking: true });
  addObject(objects, 'cracked-column', 14, 34, { blocking: true });
  addObject(objects, 'prayer-lectern', 48, 28, { blocking: true });
  addObject(objects, 'prayer-lectern', 58, 32, { blocking: true });
  addObject(objects, 'chapel-font', 31, 14, { blocking: true });
  addObject(objects, 'chapel-font', 33, 34, { blocking: true });
  addObject(objects, 'machine-oil', 52, 19);
  addObject(objects, 'rubble-decal', 11, 32);
  addObject(objects, 'wax-stain', 50, 29);
  for (const [x, y] of [[25, 18], [38, 18], [25, 29], [38, 29]]) {
    addObject(objects, 'graveyard-path-stones', x, y);
  }
  for (const [x, y, orient] of [
    [24, 13, 'se'], [39, 13, 'sw'], [24, 34, 'se'], [39, 34, 'sw'],
    [20, 42, 'se'], [43, 42, 'sw']
  ]) addObject(objects, 'dining-bench', x, y, { blocking: true, orient });
  for (const [x, y] of [[23, 16], [40, 16], [23, 31], [40, 31]]) {
    addObject(objects, 'cracked-column', x, y, { blocking: true });
  }
  for (const [x, y] of [[31, 20], [32, 23], [31, 26], [32, 32], [27, 39], [36, 39]]) {
    addObject(objects, 'graveyard-path-stones', x, y);
  }
  for (const [id, x, y, name, log] of [
    ['quiet-rubric', 17, 13, 'Quiet Rubric', 'The candidate lost marks for each cup disturbed, even if the sentry arm never struck.'],
    ['service-rubric', 59, 13, 'Service Rubric', 'The plate grades water delivered to others. Washing one’s own hands earned no mark.'],
    ['burden-rubric', 17, 34, 'Burden Rubric', 'The frame could be raised by strength. Full marks required leaving both counterweights usable for the next candidate.'],
    ['mercy-rubric', 59, 34, 'Mercy Rubric', 'The cases changed each season. Candidates had to name the person most likely to die without immediate aid.']
  ]) addNote(objects, {
    id: `old-pilgrim-${id}`,
    kind: 'pilgrim-memorial-tablet',
    name,
    x,
    y,
    log,
    blocking: true,
    variant: 'record'
  });
  addObject(objects, 'pilgrim-cot', 47, 27, { blocking: true, orient: 'se', variant: 'novice' });
  addObject(objects, 'pilgrim-cot', 58, 27, { blocking: true, orient: 'sw', variant: 'priest' });

  addNote(objects, {
    id: 'old-pilgrim-trials-candidate-skeleton',
    kind: 'skeleton',
    name: 'Candidate at the Central Font',
    x: 29,
    y: 25,
    log: 'The novice carried a cup from the quarters and died before choosing a trial wing.'
  });

  addDialogueObject(objects, {
    id: 'old-pilgrim-candidate-roll',
    kind: 'pilgrim-memorial-tablet',
    name: 'Candidate Roll',
    x: 27,
    y: 41,
    dialogue: 'old-pilgrim-trial-roll',
    blocking: true,
    variant: 'record',
    mapMarker: { label: 'Candidate Roll', kind: 'quest' }
  });
  addNote(objects, {
    id: 'old-pilgrim-trials-priest-skeleton',
    kind: 'skeleton',
    name: 'Priest at Final Profession',
    x: 34,
    y: 5,
    log: 'The priest reached the profession studs. None were raised while the buried congregation still lived.'
  });
  addNote(objects, {
    id: 'old-pilgrim-trials-sister-skeleton',
    kind: 'skeleton',
    name: 'Sister Beside the Service Gallery',
    x: 46,
    y: 24,
    log: 'A valve diagram rests under the hand bones. The final correction marks the center basin dry.'
  });

  addContainer(objects, {
    id: 'old-pilgrim-trials-candidate-chest',
    kind: 'sealed-storage-crate',
    name: 'Candidate Effects Chest',
    x: 24,
    y: 41,
    log: 'The chest holds two saint tokens and a purse returned by no candidate.',
    loot: [
      { item: 'tarnished-saint-token', count: 2 },
      { item: 'ducat', count: 2 }
    ]
  });
  for (const [id, x, y, flag, loot] of [
    ['quiet', 4, 18, 'old-pilgrim-trial-quiet-kept', [{ item: 'ducat', count: 2 }]],
    ['service', 59, 18, 'old-pilgrim-trial-service-kept', [{ item: 'field-dressing', count: 1 }]],
    ['burden', 4, 31, 'old-pilgrim-trial-burden-kept', [{ item: 'tarnished-saint-token', count: 1 }]],
    ['mercy', 59, 31, 'old-pilgrim-trial-mercy-kept', [{ item: 'field-dressing', count: 1 }]]
  ]) {
    addContainer(objects, {
      id: `old-pilgrim-${id}-trial-cache`,
      kind: 'field-satchel',
      name: `${id[0].toUpperCase()}${id.slice(1)} Trial Cache`,
      x,
      y,
      log: 'The intact trial releases a small candidate issue packet.',
      loot,
      visibleWhenFlags: [flag]
    });
  }

  return levelRecord({
    id: 'old-pilgrim-trial-galleries',
    name: 'Trial Galleries',
    intro: 'Four practical galleries surround the candidate hall. Their brass linkages still lead to the sealed chapter door.',
    grid,
    legend: indoorLegend,
    player: { x: 32, y: 45, facing: 'n' },
    objects,
    groundItems: [
      { id: 'old-pilgrim-trials-loose-token', item: 'tarnished-saint-token', count: 1, x: 31, y: 40 }
    ],
    mood: {
      floorShade: PALETTE.outline,
      floorShadeAlpha: 0.25,
      ambient: PALETTE.clothBlueDark,
      ambientAlpha: 0.14,
      vignette: 0.3
    }
  });
}

function makeSealedChapter() {
  const grid = indoorGrid(46, 36);
  const objects = [];
  hwall(grid, 10, 1, 44, [22, 23, 34]);
  hwall(grid, 25, 1, 44, [10, 11, 22, 23, 38, 39]);
  vwall(grid, 12, 1, 24, [6, 7, 17, 18]);
  vwall(grid, 33, 1, 34, [8, 9, 17, 18, 29, 30]);
  hwall(grid, 17, 34, 44, [39, 40]);

  addDialogueObject(objects, {
    id: 'old-pilgrim-chapter-south-door',
    kind: 'chapel-double-door',
    name: 'Profession Door',
    x: 23,
    y: 35,
    dialogue: 'old-pilgrim-chapter-to-trials',
    type: 'secret-exit',
    blocking: true,
    wallPlane: 'sw',
    interactionMarker: point(23, 34),
    mapMarker: { label: 'Trial Galleries', kind: 'exit', reveal: 'always' }
  });
  addDialogueObject(objects, {
    id: 'old-pilgrim-chapter-return-lift',
    kind: 'stone-stairwell',
    name: 'Chapter Return Lift',
    x: 45,
    y: 18,
    dialogue: 'old-pilgrim-return-lift',
    type: 'secret-exit',
    blocking: true,
    orient: 'sw',
    interactionMarker: point(44, 18),
    mapMarker: { label: 'Return Lift', kind: 'exit' }
  });
  addDialogueObject(objects, {
    id: 'old-pilgrim-chapter-closure-record',
    kind: 'closure-control-panel',
    name: 'Chapter Closure Record',
    x: 11,
    y: 7,
    dialogue: 'old-pilgrim-final-water-record',
    type: 'dialogue',
    blocking: true,
    variant: 'chapter-record',
    wallPlane: 'se',
    mapMarker: { label: 'Closure Record', kind: 'note' }
  });

  const armoryFlags = [
    'old-pilgrim-trial-quiet',
    'old-pilgrim-trial-service',
    'old-pilgrim-trial-burden',
    'old-pilgrim-trial-mercy'
  ];
  addObject(objects, 'wall-stash', 33, 7, {
    id: 'old-pilgrim-oath-armory-release',
    name: 'Oath Armory Release',
    blocking: true,
    wallPlane: 'se',
    interactionMarker: point(32, 7),
    interact: {
      type: 'door',
      log: 'The four profession studs draw both armory leaves into the wall.',
      lock: {
        id: 'old-pilgrim-oath-armory-lock',
        title: 'Oath Armory',
        lines: ['Four profession studs surround a dry, unworn release bar.'],
        methods: [
          {
            id: 'old-pilgrim-open-oath-armory',
            label: 'Set the four profession studs',
            conditions: { flagsAtLeast: { count: 4, of: armoryFlags } },
            successLog: 'The studs take their trial states. Both armory leaves withdraw.',
            success: {
              setFlag: 'old-pilgrim-oath-armory-open',
              openDoorGroup: 'old-pilgrim-oath-armory'
            }
          }
        ]
      }
    },
    mapMarker: { label: 'Oath Armory', kind: 'locked' }
  });
  for (const [y, leaf] of [[8, 'north'], [9, 'south']]) {
    addObject(objects, 'chapel-double-door', 33, y, {
      id: `old-pilgrim-oath-armory-door-${leaf}`,
      name: 'Oath Armory Doors',
      blocking: true,
      passableWhenOpen: true,
      doorGroup: 'old-pilgrim-oath-armory',
      doorLeaf: leaf,
      wallPlane: 'se',
      wallSide: 'far'
    });
  }

  addObject(objects, 'damaged-altar', 22, 7, { blocking: true });
  addObject(objects, 'prayer-lectern', 19, 12, { blocking: true });
  addObject(objects, 'vigil-candle-rack', 25, 12, { blocking: true });
  addObject(objects, 'dining-table', 20, 20, { blocking: true, orient: 'se' });
  addObject(objects, 'dining-bench', 23, 21, { blocking: true, orient: 'se' });
  addObject(objects, 'pantry-shelf', 5, 15, { blocking: true, orient: 'se' });
  addObject(objects, 'pantry-shelf', 8, 20, { blocking: true, orient: 'sw' });
  addObject(objects, 'water-pump', 6, 29, {
    id: 'old-pilgrim-chapter-intake-control',
    name: 'Chapter Intake Control',
    blocking: true,
    interact: {
      type: 'note',
      log: 'The intake wheel is bent against its open stop. The line beyond it remains dry.',
      search: {
        id: 'old-pilgrim-chapter-intake-search',
        title: 'Chapter Intake',
        lines: ['A second closure tooth sits behind the water wheel. It moved when the outer air seal engaged.'],
        methods: [
          {
            id: 'old-pilgrim-rebuild-intake-failure',
            label: 'Rebuild the closure sequence',
            field: 'engineering',
            dc: 32,
            successLog: 'The regional alarm isolated the hill intake with the outer air. The finite chapter cistern was never replenished.',
            failLog: 'The bent wheel hides which stop moved first.',
            success: {
              setFlag: ['old-pilgrim-chapter-intake-known', 'old-pilgrim-water-failure-understood'],
              xp: 8,
              log: 'The pressure system kept contaminated outside water from entering. It also gave the sealed congregation only five days of stored water.'
            }
          },
          {
            id: 'old-pilgrim-match-intake-tallies',
            label: 'Match the wheel to the water tallies',
            field: 'search',
            dc: 32,
            conditions: { flag: 'old-pilgrim-water-tally-read' },
            successLog: 'The wheel stopped at closure. The dated rings show only the stored cistern falling afterward.',
            failLog: 'The tally dates and wheel marks will not align from this angle.',
            success: {
              setFlag: ['old-pilgrim-chapter-intake-known', 'old-pilgrim-water-failure-understood'],
              xp: 8
            }
          }
        ]
      }
    },
    mapMarker: { label: 'Intake Control', kind: 'search' }
  });
  addObject(objects, 'settling-tank', 12, 30, { blocking: true, orient: 'se' });
  addObject(objects, 'tool-rack', 39, 13, { blocking: true });
  addObject(objects, 'wall-safe', 45, 6, { blocking: true, wallPlane: 'se' });
  addObject(objects, 'chapel-banner', 40, 4, { blocking: true });
  addObject(objects, 'paper-scraps', 7, 17);
  addObject(objects, 'paper-scraps', 21, 19);
  addObject(objects, 'wax-stain', 22, 8);
  addObject(objects, 'machine-oil', 7, 30);
  addObject(objects, 'pilgrim-memorial-tablet', 30, 12, {
    id: 'old-pilgrim-intact-profession-mark',
    blocking: true,
    variant: 'profession-kept',
    visibleWhenFlags: ['old-pilgrim-profession-intact']
  });
  addObject(objects, 'pilgrim-memorial-tablet', 30, 12, {
    id: 'old-pilgrim-forced-profession-mark',
    blocking: true,
    variant: 'profession-forced',
    visibleWhenFlags: ['old-pilgrim-profession-forced']
  });

  addNote(objects, {
    id: 'old-pilgrim-chapter-unsent-clearance',
    kind: 'paper-scraps',
    name: 'Unsent Clearance Request',
    x: 10,
    y: 18,
    log: 'Six copies ask the outside office to test the air and restore the local release. The bell conduit carried no reply.'
  });
  addNote(objects, {
    id: 'old-pilgrim-chapter-last-office',
    kind: 'pilgrim-memorial-tablet',
    name: 'Last Chapter Office',
    x: 24,
    y: 18,
    log: 'The last office abandons the usual responses. Seven hands signed beneath one instruction: KEEP THE OUTER DOOR SHUT.',
    blocking: true,
    variant: 'last-office'
  });

  const bodies = [
    ['chapter-priest-one', 'Priest in the Chapter Circle', 18, 18, 'The priest died seated against the chapter table. Seven names are cut into the tabletop beside him.'],
    ['chapter-priest-two', 'Priest Beside the Lower Altar', 20, 8, 'The office stole lies across both forearms. Its last repair used thread pulled from a blanket.'],
    ['chapter-sister-one', 'Nun at the Closure Record', 9, 8, 'The nun’s hand rests below the final refused release. The writing tool split under her fingers.'],
    ['chapter-sister-two', 'Nun at the Cistern Control', 8, 29, 'The control wheel was turned until its stop bent. The feed beyond it was already dry.'],
    ['chapter-novice-one', 'Novice Beneath the Chapter Bench', 24, 22, 'A novice curled beneath the bench with two empty cups and a child’s shoe.'],
    ['chapter-novice-two', 'Novice in the Record Room', 6, 18, 'The novice sorted the remaining names by day of death. The last seven have no dates.'],
    ['chapter-pilgrim-one', 'Pilgrim at the Lower Chapel', 26, 8, 'The pilgrim died facing the altar. No black-gold stain marks the bones or cloth.'],
    ['chapter-pilgrim-two', 'Pilgrim Beside the Return Lift', 41, 19, 'The lift release was struck with a stone until the stone broke. The cage never descended.'],
    ['chapter-pilgrim-three', 'Pilgrim at the Reliquary Store', 28, 29, 'Empty reliquary boxes were opened for wood shavings. None held food or water.'],
    ['chapter-last-sister', 'Last Sister at the Table', 22, 18, 'Seven cups stand around the sister’s bones. Each cup is turned mouth-down.']
  ];
  for (const [suffix, name, x, y, log] of bodies) {
    addNote(objects, {
      id: `old-pilgrim-${suffix}`,
      kind: 'skeleton',
      name,
      x,
      y,
      log
    });
  }

  addContainer(objects, {
    id: 'old-pilgrim-chapter-reliquary-store',
    kind: 'sealed-storage-crate',
    name: 'Reliquary Store',
    x: 28,
    y: 30,
    log: 'Most boxes were broken for fuel or shavings. One sealed compartment still holds a token purse.',
    loot: [
      { item: 'tarnished-saint-token', count: 1 },
      { item: 'ducat', count: 4 }
    ]
  });
  addContainer(objects, {
    id: 'old-pilgrim-armory-aid-chest',
    kind: 'sealed-storage-crate',
    name: 'Road Guard Aid Chest',
    x: 42,
    y: 7,
    log: 'The armory kept road-guard dressings and cartridges dry while the congregation died outside its sealed leaves.',
    loot: [
      { item: 'field-dressing', count: 2 },
      { item: 'relic-rounds', count: 2 }
    ],
    visibleWhenFlags: ['old-pilgrim-oath-armory-open']
  });
  addObject(objects, 'processional-pike-rack', 40, 10, {
    id: 'old-pilgrim-processional-pike-rack',
    name: 'Processional Pike Rack',
    blocking: true,
    interact: {
      type: 'container',
      log: 'The pike’s road roll first names boars and wheel thieves; a later hand added opened travelers. The bearer walked ahead of the procession to hold danger beyond arm’s reach.',
      loot: [{ item: 'processional-pike', count: 1 }],
      questUpdate: {
        quest: 'the-buried-novitiate',
        stage: 'return-to-light',
        log: 'The Processional Pike is free of its rack. Its weight releases the chapter return lift.'
      }
    },
    mapMarker: { label: 'Processional Pike', kind: 'quest' }
  });

  return levelRecord({
    id: 'old-pilgrim-sealed-chapter',
    name: 'Sealed Chapter',
    intro: 'The chapter seal opens on tables and empty cups beside the last congregation. The Oath Armory doors remain untouched.',
    grid,
    legend: indoorLegend,
    player: { x: 23, y: 33, facing: 'n' },
    objects,
    groundItems: [
      { id: 'old-pilgrim-chapter-loose-token', item: 'tarnished-saint-token', count: 1, x: 15, y: 28 }
    ],
    mood: {
      floorShade: PALETTE.outline,
      floorShadeAlpha: 0.33,
      ambient: PALETTE.clothBlueDark,
      ambientAlpha: 0.2,
      vignette: 0.38
    }
  });
}

async function writeJson(relativePath, value) {
  const target = resolve(DATA, relativePath);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

async function writeRecords(directory, records, filenameFor = (id) => id) {
  for (const record of records) await writeJson(`${directory}/${filenameFor(record.id)}.json`, record);
}

const levels = [
  makeSurface(),
  makeHillChurch(),
  makeClosureStair(),
  makeNovitiateQuarters(),
  makeTrialGalleries(),
  makeSealedChapter()
];

await Promise.all([
  writeRecords('actors', OLD_PILGRIM_ACTORS),
  writeRecords('dialogue', OLD_PILGRIM_DIALOGUES),
  writeRecords('enemies', OLD_PILGRIM_ENEMIES),
  writeRecords('items', OLD_PILGRIM_ITEMS),
  writeRecords('quests', OLD_PILGRIM_QUESTS),
  writeRecords('levels', levels, (id) => id.replaceAll('-', '_'))
]);

console.log(`Generated ${levels.length} Old Pilgrim Way levels and supporting content.`);
