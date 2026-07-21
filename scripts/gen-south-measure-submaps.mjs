import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SOUTH_MEASURE_SUBMAP_CONTENT as COPY } from './content/south-measure-submap-content.mjs';
import {
  SOUTH_MEASURE_INTAKE_CLERK_AMBIENT,
  SOUTH_MEASURE_NERI_REVEALED_SPAWN,
  SOUTH_MEASURE_PLACEMENTS
} from './content/south-measure-population.mjs';
import {
  SOUTH_MEASURE_CHARACTER_DIALOGUE_IDS,
  SOUTH_MEASURE_OBJECT_DIALOGUE_IDS
} from './content/south-measure-dialogues.mjs';
import {
  SOUTH_MEASURE_INTAKE_FLAGS,
  SOUTH_MEASURE_QUEST_IDS
} from './content/south-measure-state.mjs';
import { PALETTE } from '../src/render/palette.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const LEVEL_DIR = resolve(ROOT, 'data/levels');
const DIALOGUE_DIR = resolve(ROOT, 'data/dialogue');
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const OPENED_STATE_CONTAINER_KINDS = new Set([
  'field-satchel',
  'rusted-crate',
  'sealed-storage-crate'
]);
const SOUTH_MEASURE_LOOT_ITEMS = new Set([
  'ducat',
  'drone-service-parts',
  'field-dressing',
  'penitent-gear-scrap',
  'relic-rounds',
  'tinned-beans'
]);

function grid(width, height, wall = '#', floor = '.') {
  return Array.from({ length: height }, (_, y) => Array.from({ length: width }, (_, x) => (
    x === 0 || y === 0 || x === width - 1 || y === height - 1 ? wall : floor
  )));
}

function hwall(g, y, x0, x1, gaps = []) {
  for (let x = x0; x <= x1; x += 1) if (!gaps.includes(x)) g[y][x] = '#';
}

function vwall(g, x, y0, y1, gaps = []) {
  for (let y = y0; y <= y1; y += 1) if (!gaps.includes(y)) g[y][x] = '#';
}

function point(x, y) { return { x, y }; }
function key(x, y) { return `${x},${y}`; }

function builder({ id, width, height, wallKind, floor = 'stone', mood, player }) {
  const copy = COPY[id];
  if (!copy) throw new Error(`Missing copy packet for ${id}`);
  const g = grid(width, height);
  const objects = [];
  const groundItems = [];
  const occupiedObjectCells = new Set();
  const connectorChecks = [];
  const inspectableIds = new Set();

  function add(kind, x, y, extra = {}) {
    const cell = key(x, y);
    if (occupiedObjectCells.has(cell)) throw new Error(`${id}: attempted object overlap at ${cell}`);
    objects.push({ kind, x, y, ...extra });
    occupiedObjectCells.add(cell);
  }

  function decorate(kind, x, y, extra = {}) {
    if (occupiedObjectCells.has(key(x, y))) return false;
    add(kind, x, y, extra);
    return true;
  }

  function groundItem(itemId, item, count, x, y) {
    groundItems.push({ id: itemId, item, count, x, y });
  }

  function lootContainer({ id: objectId, name, kind, x, y, orient, log, loot }) {
    add(kind, x, y, {
      id: objectId,
      name,
      blocking: true,
      ...(orient ? { orient } : {}),
      interact: { type: 'container', log, loot }
    });
  }

  function inspect(copyId, kind, x, y, extra = {}) {
    const text = copy.inspectables[copyId];
    if (!text) throw new Error(`${id}: missing inspectable copy ${copyId}`);
    inspectableIds.add(copyId);
    const { mapMarker, ...visible } = text;
    const { dialogue, ambient, ...objectExtra } = extra;
    add(kind, x, y, {
      id: copyId,
      ...objectExtra,
      name: visible.name,
      ...(ambient ? { ambient } : {}),
      interact: dialogue
        ? { type: 'dialogue', dialogue }
        : { type: 'note', log: visible.log },
      ...(mapMarker ? { mapMarker } : {})
    });
  }

  function connector({ id: objectId, dialogue, copyKey, x, y, marker, kind = 'south-measure-door', extra = {} }) {
    const connectorCopy = copy.connectors[copyKey];
    if (!connectorCopy) throw new Error(`${id}: missing connector copy ${copyKey}`);
    add(kind, x, y, {
      id: objectId,
      name: connectorCopy.title,
      blocking: true,
      ...extra,
      interactionMarker: marker,
      mapMarker: { label: connectorCopy.title, kind: 'exit' },
      interact: { type: 'secret-exit', dialogue }
    });
    connectorChecks.push({ objectId, x, y, marker });
  }

  function finish(dialogue) {
    const missing = Object.keys(copy.inspectables).filter((entry) => !inspectableIds.has(entry));
    if (missing.length) throw new Error(`${id}: unplaced inspectables: ${missing.join(', ')}`);
    const tiles = g.map((row) => row.join(''));
    const legend = {
      '#': { kind: wallKind, walkable: false },
      '.': { kind: 'floor', floor, walkable: true }
    };
    if (tiles.some((row) => row.includes('x'))) legend.x = { kind: 'floor', floor: 'relief-channel-x', walkable: true };
    if (tiles.some((row) => row.includes('y'))) legend.y = { kind: 'floor', floor: 'relief-channel-y', walkable: true };
    if (tiles.some((row) => row.includes('+'))) legend['+'] = { kind: 'floor', floor: 'relief-channel-junction', walkable: true };
    if (tiles.some((row) => row.includes('s'))) legend.s = { kind: 'floor', floor: 'south-measure-slab', walkable: true };
    if (tiles.some((row) => row.includes('b'))) legend.b = { kind: 'floor', floor: 'south-measure-yard', walkable: true };
    const population = buildPopulationSpawns(id, g, objects, groundItems, player);
    const populationDialogue = [
      ...population.npcs.map((spawn) => spawn.dialogue).filter(Boolean),
      ...population.enemies.map((spawn) => spawn.dialogue).filter(Boolean),
      ...objects.map((object) => object.interact?.dialogue).filter(Boolean)
    ];
    if (id === 'south-measure-intake-undercroft') populationDialogue.push('south-measure-undercroft-ona-veyl');
    const level = {
      id,
      name: copy.name,
      intro: copy.intro,
      width,
      height,
      tileSize: 64,
      mood,
      quests: [...SOUTH_MEASURE_QUEST_IDS],
      dialogue: [...new Set([...dialogue, ...populationDialogue])],
      tiles,
      legend,
      spawns: { player: { actor: 'mara-vey', ...player }, ...population },
      objects,
      groundItems
    };
    if (id === 'south-measure-charity-cellar') {
      level.combatIntro = [
        'Salome’s chest wrap parts around a narrow mouth. Her second voice finishes the confession before the first voice can stop it.'
      ];
      level.victoryLog = 'The second voice goes quiet inside Salome’s opened chest.';
      level.onVictory = {
        setFlag: ['neri-agent-killed', 'neri-agent-resolved'],
        questUpdate: {
          quest: 'lesson-under-the-wrap', stage: 'complete',
          log: 'Salome dies after the False Catechist is exposed. Her lesson route ends in the cellar.'
        }
      };
    }
    if (id === 'south-measure-intake-undercroft') {
      level.combatTriggers = [{
        id: 'intake-clerk-release-trigger', encounter: 'intake-clerk-release',
        x: 30, y: 13, radius: 4, forceCombat: true,
        intro: [
          'The wicket bolts leave the wall with pieces of desk and bone still joined to them.',
          'Junia crawls on fused forearms. Every rib mouth issues the same final denial.'
        ]
      }];
      level.victoryLog = 'Junia’s stamp falls from her fused hands. The denial sequence ends without approving a single household.';
      level.onVictory = {
        setFlag: [
          'intake-clerk-killed', 'intake-clerk-resolved', 'intake-roll-damaged',
          'south-measure-water-decision-open', 'south-measure-north-pulse-traced'
        ],
        questUpdate: {
          quest: 'names-for-the-gate', stage: 'choose-water-plan',
          log: 'Junia is dead. South Measure can choose how to move water.'
        }
      };
    }
    return {
      level,
      connectorChecks
    };
  }

  return { g, add, decorate, groundItem, lootContainer, inspect, connector, finish };
}

function buildPopulationSpawns(levelId, g, objects, groundItems, player) {
  const specs = SOUTH_MEASURE_PLACEMENTS[levelId] ?? [];
  const reserved = new Set(objects.map((object) => key(object.x, object.y)));
  for (const groundItem of groundItems) reserved.add(key(groundItem.x, groundItem.y));
  reserved.add(key(player.x, player.y));
  for (const object of objects) {
    if (object.interactionMarker) {
      reserved.add(key(object.interactionMarker.x, object.interactionMarker.y));
      continue;
    }
    if (!object.interact) continue;
    for (const [dx, dy] of DIRS) {
      const x = object.x + dx;
      const y = object.y + dy;
      if (g[y]?.[x] && g[y][x] !== '#') reserved.add(key(x, y));
    }
  }
  const candidates = [];
  for (let y = 1; y < g.length - 1; y += 1) {
    for (let x = 1; x < g[y].length - 1; x += 1) {
      if (g[y][x] !== '#') candidates.push({ x, y });
    }
  }
  const npcs = specs.map((spec, index) => {
    const cell = candidates
      .filter((candidate) => !reserved.has(key(candidate.x, candidate.y)))
      .sort((a, b) => (
        Math.abs(a.x - spec.preferred.x) + Math.abs(a.y - spec.preferred.y) -
        Math.abs(b.x - spec.preferred.x) - Math.abs(b.y - spec.preferred.y) ||
        a.y - b.y || a.x - b.x
      ))[0];
    if (!cell) throw new Error(`${levelId}: no placement cell for ${spec.name}`);
    reserved.add(key(cell.x, cell.y));
    return {
      actor: spec.actor,
      spawnId: `${spec.characterSlot}-${index}`,
      characterSlot: spec.characterSlot,
      ...cell,
      facing: spec.facing,
      ambient: [...spec.ambient],
      ...(spec.dialogue ? { dialogue: spec.dialogue, talkRadius: 1 } : {}),
      ...(spec.conditions ? { conditions: spec.conditions } : {}),
      ...(spec.patrol ? { patrol: spec.patrol } : {}),
      ...(spec.mapMarker ? { mapMarker: spec.mapMarker } : {})
    };
  });
  const enemies = [];
  if (levelId === 'south-measure-intake-undercroft') {
    const cell = candidates
      .filter((candidate) => !reserved.has(key(candidate.x, candidate.y)))
      .sort((a, b) => (
        Math.abs(a.x - 30) + Math.abs(a.y - 13) -
        Math.abs(b.x - 30) - Math.abs(b.y - 13) || a.y - b.y || a.x - b.x
      ))[0];
    if (!cell) throw new Error('Intake undercroft has no release cell for Junia Lector.');
    reserved.add(key(cell.x, cell.y));
    enemies.push({
      id: 'south-measure-intake-clerk', spawnId: 'intake-clerk-released',
      characterSlot: 'intake-clerk-released', ...cell, facing: 'sw',
      encounter: 'intake-clerk-release', aggroRadius: 4,
      conditions: { flag: 'intake-clerk-forced-open', flagsAbsent: SOUTH_MEASURE_INTAKE_FLAGS },
      ambient: ['The stamp clicks against stone. "Mercy allocation remains empty."'],
      aggro: ['Household denied. Remain outside.']
    });
  }
  if (levelId === 'south-measure-charity-cellar') {
    const neri = npcs.find((spawn) => spawn.characterSlot === 'cellar-neri-vaun');
    if (!neri) throw new Error('Charity cellar is missing Salome Naso.');
    enemies.push({
      id: SOUTH_MEASURE_NERI_REVEALED_SPAWN.id,
      spawnId: 'cellar-neri-vaun-revealed',
      characterSlot: SOUTH_MEASURE_NERI_REVEALED_SPAWN.characterSlot,
      x: neri.x,
      y: neri.y,
      facing: SOUTH_MEASURE_NERI_REVEALED_SPAWN.facing,
      encounter: SOUTH_MEASURE_NERI_REVEALED_SPAWN.encounter,
      dialogue: SOUTH_MEASURE_NERI_REVEALED_SPAWN.dialogue,
      dialogueRepeat: true,
      talkRadius: SOUTH_MEASURE_NERI_REVEALED_SPAWN.talkRadius,
      conditions: SOUTH_MEASURE_NERI_REVEALED_SPAWN.conditions,
      ambient: [...SOUTH_MEASURE_NERI_REVEALED_SPAWN.ambient],
      aggro: [...SOUTH_MEASURE_NERI_REVEALED_SPAWN.aggro]
    });
  }
  return { npcs, enemies };
}

function wallBoard(b, copyId, x, y, variant, wallPlane, extra = {}) {
  b.inspect(copyId, 'south-measure-wall-board', x, y, {
    blocking: true, variant, wallPlane, ...extra
  });
}

function furniture(b, copyId, kind, x, y, variant, orient = 'se', extra = {}) {
  b.inspect(copyId, kind, x, y, {
    blocking: true, variant, orient, ...extra
  });
}

function makeUndercroft() {
  const b = builder({
    id: 'south-measure-intake-undercroft', width: 58, height: 42,
    wallKind: 'south-measure-intake-wall', floor: 'south-measure-slab',
    mood: { floorShade: PALETTE.outline, floorShadeAlpha: 0.27, ambient: PALETTE.clothBlueDark, ambientAlpha: 0.16, vignette: 0.3 },
    player: { x: 29, y: 39, facing: 'ne' }
  });
  vwall(b.g, 19, 1, 40, [26, 27]);
  hwall(b.g, 18, 1, 18, [10]);
  vwall(b.g, 42, 1, 40, [14, 15, 30, 31]);
  hwall(b.g, 11, 20, 41, [29]);
  hwall(b.g, 29, 20, 41, [27, 28, 38, 39]);
  for (let y = 2; y <= 39; y += 1) {
    for (let x = 49; x <= 53; x += 1) b.g[y][x] = 'y';
  }
  for (let x = 43; x <= 56; x += 1) b.g[15][x] = 'x';
  b.g[15][49] = '+';
  for (const [x, y] of [[49, 7], [50, 7], [51, 7], [52, 22], [53, 22], [49, 33], [50, 33]]) b.g[y][x] = '.';

  b.connector({ id: 'undercroft-civil-stair', dialogue: 'south-measure-civil-stair-undercroft', copyKey: 'south-measure-civil-stair', x: 29, y: 41, marker: point(29, 40), extra: { variant: 'civil', wallPlane: 'sw' } });
  b.connector({ id: 'undercroft-drain-valve', dialogue: 'south-measure-drain-undercroft-valve-undercroft', copyKey: 'south-measure-drain-valve', x: 57, y: 15, marker: point(56, 15), extra: { variant: 'service', wallPlane: 'se' } });

  furniture(b, 'undercroft-records-landing-rails', 'utility-railing', 27, 35, 'civic', 'se');
  wallBoard(b, 'undercroft-brass-number-hooks', 22, 41, 'schedule', 'sw');
  wallBoard(b, 'undercroft-lime-handprints', 25, 41, 'handprints', 'sw');
  wallBoard(b, 'undercroft-examination-order', 33, 41, 'schedules', 'sw');
  furniture(b, 'undercroft-restraint-drain', 'service-hatch', 8, 25, 'grate', 'se');
  furniture(b, 'undercroft-privacy-screens', 'cloth-partition', 13, 27, 'clinic', 'se');
  furniture(b, 'undercroft-filter-cabinet', 'south-measure-storage', 5, 31, 'medicine-shelf', 'sw');
  b.inspect('undercroft-records-vault-door', 'south-measure-door', 9, 18, { blocking: true, variant: 'civil', wallPlane: 'sw' });
  wallBoard(b, 'undercroft-compact-copy-marks', 36, 41, 'blood-card', 'sw');
  furniture(b, 'undercroft-original-household-roll', 'south-measure-storage', 6, 8, 'lime-records-chest', 'se', {
    dialogue: 'south-measure-undercroft-original-roll'
  });
  furniture(b, 'undercroft-isolation-manifold', 'intake-pump-assembly', 32, 20, 'coupled', 'se');
  furniture(b, 'undercroft-settling-feed-controls', 'relief-machine', 39, 18, 'pump-jig', 'sw');
  furniture(b, 'undercroft-pump-work-platform', 'south-measure-pipe-gantry', 27, 22, undefined, 'se');
  furniture(b, 'undercroft-pipe-vein', 'service-pipe-run', 47, 9, 'straight', 'sw');
  b.inspect('undercroft-intake-clerk', 'intake-clerk-wicket', 30, 11, {
    blocking: true,
    state: 'dormant',
    wallPlane: 'sw',
    hiddenWhenFlags: ['intake-clerk-forced-open', 'intake-clerk-burned'],
    disabledWhenFlags: SOUTH_MEASURE_INTAKE_FLAGS,
    dialogue: 'south-measure-undercroft-ona-veyl',
    ambient: [...SOUTH_MEASURE_INTAKE_CLERK_AMBIENT]
  });
  b.inspect('undercroft-return-passage', 'south-measure-door', 19, 13, { blocking: true, variant: 'civil', wallPlane: 'se', locked: true });
  b.add('south-measure-door', 19, 12, { blocking: true, variant: 'civil', wallPlane: 'se', locked: true });
  b.lootContainer({
    id: 'undercroft-rejected-issue-crate',
    name: 'Rejected Issue Crate',
    kind: 'sealed-storage-crate',
    x: 4,
    y: 4,
    orient: 'se',
    log: 'The intake clerk marked the crate REJECTED. Its broken seal exposes sound supplies set aside for salvage.',
    loot: [
      { item: 'field-dressing', count: 1 },
      { item: 'ducat', count: 2 },
      { item: 'drone-service-parts', count: 2 }
    ]
  });
  b.groundItem('undercroft-loose-ducat', 'ducat', 1, 5, 4);
  for (const [x, y, variant, orient] of [
    [12, 6, 'lime-records-chest', 'sw'],
    [15, 14, 'archive-shelf', 'se'], [24, 5, 'archive-shelf', 'sw'],
    [37, 5, 'medicine-shelf', 'sw']
  ]) b.add('south-measure-storage', x, y, { blocking: true, variant, orient });
  for (const [x, y] of [[13, 23], [13, 31]]) b.add('cloth-partition', x, y, { blocking: true, variant: 'clinic', orient: 'se' });
  b.add('utility-railing', 35, 35, { blocking: true, variant: 'civic', orient: 'se' });
  for (const [x, y, wallPlane] of [[57, 6, 'se'], [57, 25, 'se'], [57, 34, 'se'], [42, 7, 'se'], [42, 22, 'se'], [42, 35, 'se']]) {
    b.add('service-pipe-run', x, y, { blocking: false, variant: y === 22 ? 'valve' : 'straight', wallPlane });
  }

  // The northwest vault is a packed municipal archive, not an empty stone room.
  for (const [x, y, variant, orient] of [
    [3, 3, 'lime-records-chest', 'se'], [8, 3, 'archive-shelf', 'sw'],
    [13, 3, 'archive-shelf', 'se'], [17, 4, 'current-records', 'sw'],
    [3, 8, 'archive-shelf', 'se'], [10, 9, 'lime-records-chest', 'sw'],
    [16, 9, 'archive-shelf', 'se'], [3, 13, 'current-records', 'sw'],
    [8, 14, 'archive-shelf', 'se'], [17, 15, 'lime-records-chest', 'sw']
  ]) b.decorate('south-measure-storage', x, y, { blocking: true, variant, orient });
  for (const [x, y, variant] of [[6, 3, 'ledger'], [11, 7, 'ledger'], [16, 12, 'parts']]) {
    b.decorate('mesh-cage-panel', x, y, { blocking: true, variant, orient: 'se' });
  }
  for (const [x, y] of [[5, 6], [12, 11], [5, 15], [14, 16]]) b.decorate('paper-scraps', x, y);

  // A sealed clerk booth and its queue dominate the north-center landing.
  for (const [x, y, orient] of [[22, 8, 'se'], [26, 8, 'sw'], [34, 8, 'se'], [38, 8, 'sw']]) {
    b.decorate('intake-screening-frame', x, y, { blocking: true, orient });
  }
  for (const x of [22, 25, 28, 32, 35, 38, 41]) {
    b.decorate('mesh-cage-panel', x, 10, { blocking: false, variant: 'ledger', orient: 'se' });
  }
  for (const [x, y] of [[23, 13], [27, 13], [34, 13], [38, 13]]) {
    b.decorate('utility-railing', x, y, { blocking: false, variant: 'civic', orient: 'se' });
  }
  b.decorate('south-measure-worktable', 25, 5, { blocking: true, variant: 'records', orient: 'se' });
  b.decorate('south-measure-worktable', 34, 5, { blocking: true, variant: 'records', orient: 'sw' });
  b.decorate('south-measure-notice-board', 30, 2, { blocking: false, orient: 'se' });

  // One concentrated intake wall preserves the civil processing sequence at
  // gameplay scale: number issue, physical marking, examination, and copying.
  b.decorate('south-measure-brass-hook-memorial', 24, 38, { blocking: true });
  for (const [x, variant] of [[20, 'schedule'], [27, 'handprints'], [31, 'schedules'], [38, 'blood-card']]) {
    b.decorate('south-measure-wall-board', x, 41, { blocking: true, variant, wallPlane: 'sw' });
  }

  // Close-spaced machine banks feed one continuous grated pipe gallery instead
  // of reading as isolated plinths scattered across the eastern floor.
  for (const [x, y, variant, orient] of [
    [22, 15, 'generator', 'se'], [25, 15, 'press', 'sw'], [28, 15, 'lathe', 'se'],
    [35, 16, 'pump-jig', 'sw'], [38, 16, 'generator', 'se'],
    [22, 25, 'cooling-jacket', 'se'], [25, 25, 'generator', 'sw'], [28, 25, 'press', 'se'],
    [35, 25, 'press', 'se'], [38, 25, 'lathe', 'sw']
  ]) b.decorate('relief-machine', x, y, { blocking: true, variant, orient });
  for (let x = 27; x <= 35; x += 1) {
    const connected = { xMinus: x > 27, xPlus: x < 35 };
    b.decorate('service-pipe-run', x, 21, { blocking: false, variant: 'straight', orient: 'se', connected });
    b.decorate('utility-railing', x, 23, { blocking: false, variant: 'service', orient: 'se', connected });
  }
  for (let x = 29; x <= 33; x += 1) {
    b.decorate('service-hatch', x, 22, { blocking: true, variant: 'grate', orient: x % 2 ? 'se' : 'nw' });
  }
  b.decorate('south-measure-pipe-gantry', 35, 22, { blocking: true, orient: 'se' });
  b.decorate('south-measure-repair-rack', 25, 19, { blocking: true, orient: 'se' });
  b.decorate('south-measure-repair-rack', 38, 20, { blocking: true, orient: 'sw' });
  for (const [x, y, variant, wallPlane] of [
    [20, 16, 'straight', 'se'], [20, 23, 'elbow', 'se'], [20, 34, 'valve', 'se'],
    [42, 4, 'straight', 'se'], [42, 12, 'elbow', 'se'], [42, 18, 'valve', 'se'],
    [42, 28, 'straight', 'se'], [42, 39, 'elbow', 'se'], [57, 12, 'valve', 'se'],
    [57, 19, 'elbow', 'se'], [57, 29, 'straight', 'se'], [57, 38, 'valve', 'se']
  ]) b.decorate('service-pipe-run', x, y, { blocking: false, variant, wallPlane });
  for (let y = 3; y <= 39; y += 3) {
    b.decorate('utility-railing', 47, y, { blocking: false, variant: y % 6 ? 'service' : 'broken', orient: 'se' });
  }
  for (const [x, y] of [[25, 18], [30, 19], [37, 20], [24, 27], [33, 27], [39, 23], [50, 7], [52, 23], [49, 34]]) {
    b.decorate('machine-oil', x, y);
  }
  b.decorate('south-measure-pipe-gantry', 45, 20, { blocking: true, orient: 'se' });
  b.decorate('intake-pump-assembly', 52, 31, { blocking: true, variant: 'coupled', orient: 'sw' });
  for (const [x, y] of [[50, 6], [52, 8], [50, 21], [53, 23], [49, 32], [51, 34]]) {
    b.decorate('south-measure-drain-reeds', x, y, { blocking: false });
  }
  for (const [x, y] of [[49, 8], [51, 9], [52, 20], [50, 23], [53, 32], [50, 35]]) b.decorate('rubble-decal', x, y);

  // Examination screens, drains, and supply stations compress the southwest rooms.
  for (const [x, y, variant, orient] of [
    [5, 22, 'used', 'se'], [11, 22, 'isolation', 'sw'], [5, 28, 'used', 'se'],
    [16, 31, 'clean', 'sw'], [10, 35, 'used', 'se']
  ]) b.decorate('clinic-bed', x, y, { blocking: true, variant, orient });
  for (const [x, y, orient] of [[3, 20, 'se'], [9, 20, 'sw'], [16, 22, 'se'], [3, 34, 'se'], [14, 36, 'sw']]) {
    b.decorate('cloth-partition', x, y, { blocking: true, variant: 'clinic', orient });
  }
  for (const [x, y, kind] of [[3, 25, 'medicine-cart'], [16, 26, 'wash-wall'], [6, 37, 'south-measure-medicine-cart']]) {
    b.decorate(kind, x, y, { blocking: true, orient: 'se' });
  }
  for (const [x, y] of [[23, 34], [26, 37], [32, 37], [38, 34]]) {
    b.decorate('utility-railing', x, y, { blocking: false, variant: 'civic', orient: 'se' });
  }
  for (const [x, y] of [[4, 24], [15, 25], [7, 33], [17, 38], [25, 32], [36, 32], [44, 40]]) {
    b.decorate('rubble-decal', x, y);
  }
  return b.finish(['south-measure-civil-stair-undercroft', 'south-measure-drain-undercroft-valve-undercroft']);
}

function makeDrain() {
  const b = builder({
    id: 'south-measure-relief-drain', width: 44, height: 20,
    wallKind: 'south-measure-service-wall', floor: 'stone',
    mood: { floorShade: PALETTE.outline, floorShadeAlpha: 0.3, ambient: PALETTE.clothBlueDark, ambientAlpha: 0.2, vignette: 0.34 },
    player: { x: 41, y: 15, facing: 'nw' }
  });
  // Carve three northern service pockets out of the rock above the raised walk.
  for (let y = 1; y <= 8; y += 1) {
    for (let x = 1; x <= 42; x += 1) b.g[y][x] = '#';
  }
  for (const [x0, y0, x1, y1] of [[8, 1, 16, 8], [18, 1, 24, 8], [28, 2, 36, 8]]) {
    for (let y = y0; y <= y1; y += 1) {
      for (let x = x0; x <= x1; x += 1) b.g[y][x] = '.';
    }
  }
  for (let y = 13; y <= 16; y += 1) {
    for (let x = 2; x <= 41; x += 1) b.g[y][x] = 'x';
  }
  for (let y = 11; y <= 16; y += 1) b.g[y][40] = 'y';
  for (let y = 13; y <= 17; y += 1) b.g[y][10] = 'y';
  for (let y = 13; y <= 16; y += 1) {
    b.g[y][10] = '+';
    b.g[y][40] = '+';
  }
  for (const [x, y] of [[6, 13], [7, 13], [20, 13], [21, 13], [22, 13], [34, 13], [35, 13]]) b.g[y][x] = '.';

  b.connector({ id: 'drain-collapsed-culvert', dialogue: 'south-measure-collapsed-culvert-drain', copyKey: 'south-measure-collapsed-culvert', x: 43, y: 15, marker: point(42, 15), extra: { variant: 'service', wallPlane: 'se' } });
  b.connector({ id: 'drain-repair-trench', dialogue: 'south-measure-repair-trench-drain', copyKey: 'south-measure-morrow-trench', x: 20, y: 0, marker: point(20, 1), extra: { variant: 'service', wallPlane: 'sw' } });
  b.connector({ id: 'drain-annex-service-hatch', dialogue: 'south-measure-annex-service-hatch-drain', copyKey: 'south-measure-annex-service-hatch', x: 0, y: 16, marker: point(1, 16), extra: { variant: 'service', wallPlane: 'se' } });
  b.connector({ id: 'drain-undercroft-valve', dialogue: 'south-measure-drain-undercroft-valve-drain', copyKey: 'south-measure-drain-valve', x: 12, y: 0, marker: point(12, 1), extra: { variant: 'service', wallPlane: 'sw' } });
  b.connector({ id: 'drain-annex-floor-hatch', dialogue: 'south-measure-annex-drain-hatch-drain', copyKey: 'south-measure-annex-drain-hatch', x: 4, y: 12, marker: point(4, 13), kind: 'service-hatch', extra: { variant: 'ladder', orient: 'se', opened: true } });

  furniture(b, 'relief-drain-raised-walk', 'utility-railing', 31, 10, 'service', 'se');
  b.inspect('relief-drain-polluted-flow', 'south-measure-drain-reeds', 26, 13, { blocking: false });
  furniture(b, 'relief-drain-broken-filter-baskets', 'intake-screening-frame', 35, 15, 'broken-baskets', 'sw', { damaged: true });
  furniture(b, 'relief-drain-jammed-isolation-wheel', 'intake-pump-assembly', 12, 5, 'failed', 'se');
  furniture(b, 'relief-drain-waiting-alcove', 'farm-bed', 32, 4, undefined, 'sw');
  wallBoard(b, 'relief-drain-childrens-crawl-marks', 37, 8, 'crawl-marks', 'se');
  wallBoard(b, 'relief-drain-trench-work-signs', 22, 0, 'schedules', 'sw');
  b.lootContainer({
    id: 'drain-flooded-repair-crate',
    name: 'Flooded Repair Crate',
    kind: 'rusted-crate',
    x: 29,
    y: 15,
    orient: 'sw',
    log: 'Floodwater carried this repair crate into the filter baskets. Most of the kit has rotted into the boards.',
    loot: [
      { item: 'penitent-gear-scrap', count: 1 },
      { item: 'ducat', count: 1 }
    ]
  });
  b.groundItem('drain-loose-gear-scrap', 'penitent-gear-scrap', 1, 30, 15);

  // The broad polluted run is bracketed by a continuous raised maintenance walk.
  for (let x = 2; x <= 41; x += 1) {
    b.decorate('utility-railing', x, 10, { blocking: false, orient: 'se', variant: x % 8 ? 'service' : 'broken' });
  }
  for (const [x, y, variant, orient] of [
    [10, 9, 'grate', 'sw'], [20, 9, 'ladder', 'se'],
    [30, 9, 'grate', 'sw'], [40, 9, 'ladder', 'se']
  ]) b.decorate('service-hatch', x, y, { blocking: true, variant, orient, opened: variant === 'ladder' });
  for (const [x, y] of [[8, 15], [14, 13], [18, 16], [23, 12], [28, 15], [36, 13], [39, 16]]) {
    b.decorate('rubble-decal', x, y);
  }
  for (const [x, y] of [[7, 13], [16, 15], [25, 14], [31, 12], [38, 15]]) {
    b.decorate('south-measure-drain-reeds', x, y, { blocking: false });
  }

  // One heavy wheel body, two subordinate machines, an overhead gantry, and
  // a continuous floor pipe make this a single valve installation.
  for (const [x, y, variant, orient] of [
    [9, 3, 'pump-jig', 'se'], [15, 3, 'generator', 'sw']
  ]) b.decorate('relief-machine', x, y, { blocking: true, variant, orient });
  for (const [x, y, variant, wallPlane] of [
    [2, 0, 'straight', 'sw'], [7, 0, 'elbow', 'sw'], [16, 0, 'valve', 'sw'],
    [25, 0, 'straight', 'sw'], [31, 0, 'elbow', 'sw'], [38, 0, 'valve', 'sw'],
    [43, 4, 'straight', 'se'], [43, 8, 'elbow', 'se'], [43, 18, 'valve', 'se'],
    [0, 4, 'straight', 'se'], [0, 9, 'elbow', 'se']
  ]) b.decorate('service-pipe-run', x, y, { blocking: false, variant, wallPlane });
  b.decorate('south-measure-pipe-gantry', 13, 2, { blocking: true, orient: 'se' });
  for (let x = 9; x <= 15; x += 1) {
    b.decorate('service-pipe-run', x, 7, {
      blocking: false,
      variant: x === 12 ? 'valve' : 'straight',
      orient: 'se'
    });
  }
  b.decorate('south-measure-pipe-gantry', 27, 9, { blocking: true, orient: 'sw' });

  // The annex hatch has one open ladder, a continuous pipe collar, and a
  // gantry landing. Removing the duplicate hatch keeps the connection unique.
  for (let x = 2; x <= 8; x += 1) {
    b.decorate('service-pipe-run', x, 11, {
      blocking: false,
      variant: x === 6 ? 'valve' : 'straight',
      orient: 'se'
    });
  }
  b.decorate('south-measure-pipe-gantry', 7, 12, { blocking: true, orient: 'se' });

  // The Morrow branch is a worked trench with a ladder plate, paired rails,
  // tools, schedule surface, and staged repair stock. It no longer reads as
  // two unrelated machines in another empty rock pocket.
  b.decorate('service-hatch', 20, 2, { blocking: false, variant: 'ladder', orient: 'sw', opened: true });
  b.decorate('south-measure-pipe-gantry', 20, 4, { blocking: true, orient: 'sw' });
  b.decorate('south-measure-repair-rack', 19, 5, { blocking: true, orient: 'se' });
  b.decorate('south-measure-worktable', 22, 5, { blocking: true, variant: 'records', orient: 'sw' });
  b.decorate('tool-rack', 19, 7, { blocking: true });
  b.decorate('sealed-storage-crate', 23, 7, { blocking: true, orient: 'sw' });
  for (const y of [2, 4, 6]) {
    b.decorate('utility-railing', 18, y, { blocking: false, variant: 'service', orient: 'sw' });
    b.decorate('utility-railing', 24, y, { blocking: false, variant: 'service', orient: 'sw' });
  }
  b.decorate('machine-oil', 21, 6);
  b.decorate('paper-scraps', 22, 7);

  // Bedding, laundry, water, and a cook point make the waiting niche visibly
  // inhabited. The damaged frames below form one failed filtration line.
  b.decorate('farm-bed', 35, 5, { blocking: true, orient: 'se' });
  b.decorate('laundry-line', 29, 3, { blocking: true, orient: 'se' });
  b.decorate('south-measure-water-vessels', 29, 6, { blocking: true, orient: 'sw' });
  b.decorate('low-stool', 34, 3, { blocking: true });
  b.decorate('shared-oven', 35, 7, { blocking: true, orient: 'sw' });
  b.decorate('candle-cluster', 33, 6, { blocking: false });
  b.decorate('south-measure-storage', 30, 7, { blocking: true, variant: 'work-shelf', orient: 'se' });
  for (const [x, y, orient] of [[33, 14, 'se'], [37, 16, 'sw']]) {
    b.decorate('intake-screening-frame', x, y, { blocking: true, variant: 'broken-baskets', orient, damaged: true });
  }
  b.decorate('south-measure-repair-rack', 31, 16, { blocking: true, orient: 'sw', damaged: true });
  b.decorate('service-pipe-run', 31, 15, { blocking: false, variant: 'broken', orient: 'se', damaged: true });
  for (const [x, y] of [[30, 16], [38, 15], [40, 17], [42, 17]]) b.decorate('rubble-pile', x, y, { blocking: true });
  b.decorate('collapsed-culvert', 39, 13, { blocking: true, orient: 'se' });
  b.decorate('rubble-decal', 42, 15);
  b.decorate('rubble-decal', 40, 16);
  b.decorate('service-pipe-run', 43, 14, { blocking: false, variant: 'broken', wallPlane: 'se' });
  b.decorate('service-pipe-run', 43, 16, { blocking: false, variant: 'broken', wallPlane: 'se' });
  for (const [x, y] of [[11, 12], [18, 13], [24, 16], [32, 15], [39, 12]]) b.decorate('machine-oil', x, y);
  return b.finish([
    'south-measure-collapsed-culvert-drain', 'south-measure-repair-trench-drain',
    'south-measure-annex-service-hatch-drain', 'south-measure-drain-undercroft-valve-drain',
    'south-measure-annex-drain-hatch-drain'
  ]);
}

function makeAnnex() {
  const b = builder({
    id: 'south-measure-relief-maintenance-annex', width: 40, height: 26,
    wallKind: 'south-measure-service-wall', floor: 'south-measure-slab',
    mood: { floorShade: PALETTE.stoneDark, floorShadeAlpha: 0.16, ambient: PALETTE.woodDark, ambientAlpha: 0.11, vignette: 0.25 },
    player: { x: 19, y: 23, facing: 'ne' }
  });
  hwall(b.g, 18, 1, 10, [3, 4]);
  hwall(b.g, 18, 30, 38, [34, 35]);
  hwall(b.g, 8, 1, 10, [5, 6]);
  hwall(b.g, 8, 30, 38, [34, 35]);
  vwall(b.g, 10, 1, 17, [4, 5, 13, 14]);
  vwall(b.g, 30, 1, 24, [4, 5, 9, 10, 13, 14, 17, 18, 21, 22]);

  // Fire and a partial roof fall broke the east partition into two short teeth.
  // Dirty clinker and concentrated scorch isolate the fire footprint from the
  // quiet civic slabs used by the working annex.
  b.g[8][33] = 'b';
  b.g[8][36] = 'b';
  for (const [x, y] of [[32, 9], [33, 9], [32, 10], [37, 9], [37, 10], [38, 10]]) b.g[y][x] = '#';
  for (const [y, x0, x1] of [
    [9, 31, 38], [10, 31, 38], [11, 31, 38], [12, 32, 38], [13, 31, 37],
    [14, 31, 38], [15, 32, 38], [16, 31, 38], [17, 33, 38]
  ]) {
    for (let x = x0; x <= x1; x += 1) if (b.g[y][x] !== '#') b.g[y][x] = 'b';
  }
  b.connector({ id: 'annex-main-door', dialogue: 'south-measure-annex-main-door-annex', copyKey: 'south-measure-annex-main-door', x: 19, y: 25, marker: point(19, 24), extra: { variant: 'service', wallPlane: 'sw' } });
  b.connector({ id: 'annex-floor-hatch', dialogue: 'south-measure-annex-drain-hatch-annex', copyKey: 'south-measure-annex-drain-hatch', x: 3, y: 19, marker: point(4, 19), kind: 'service-hatch', extra: { variant: 'ladder', orient: 'se', opened: true } });

  furniture(b, 'relief-annex-claim-desk', 'south-measure-worktable', 15, 22, 'records', 'se');
  furniture(b, 'relief-annex-dead-hoist', 'fixed-hoist', 25, 21, undefined, 'se');
  furniture(b, 'relief-annex-machine-floor', 'intake-pump-assembly', 18, 13, 'coupled', 'se');
  furniture(b, 'relief-annex-parts-cage', 'mesh-cage-panel', 18, 7, 'parts', 'se');
  furniture(b, 'relief-annex-bypass-schedule', 'south-measure-worktable', 24, 5, 'records', 'sw');
  furniture(b, 'relief-annex-cooling-jacket', 'relief-machine', 5, 12, 'cooling-jacket', 'sw');
  wallBoard(b, 'relief-annex-relief-schedules', 30, 15, 'schedule-bank', 'se');
  b.inspect('relief-annex-burned-rear-bay', 'collapsed-culvert', 35, 11, { blocking: true });
  b.add('relief-machine', 5, 15, { blocking: true, variant: 'generator', orient: 'sw' });
  b.lootContainer({
    id: 'annex-condemned-parts-crate',
    name: 'Condemned Parts Crate',
    kind: 'sealed-storage-crate',
    x: 8,
    y: 5,
    orient: 'sw',
    log: 'A relief clerk scored the seal twice and wrote SCRAP across the lid.',
    loot: [
      { item: 'penitent-gear-scrap', count: 2 },
      { item: 'drone-service-parts', count: 2 }
    ]
  });
  b.groundItem('annex-loose-gear-scrap', 'penitent-gear-scrap', 1, 9, 5);
  for (const [x, y, variant, orient] of [[2, 5, 'archive-shelf', 'se'], [35, 22, 'archive-shelf', 'sw']]) {
    b.add('south-measure-storage', x, y, { blocking: true, variant, orient, damaged: x === 35 });
  }
  b.add('freight-scale', 10, 22, { blocking: true, variant: 'claim', orient: 'sw' });
  b.add('service-pipe-run', 10, 11, { blocking: false, variant: 'valve', wallPlane: 'se' });
  b.add('service-pipe-run', 30, 11, { blocking: false, variant: 'straight', wallPlane: 'se' });

  // Dense back and front mesh runs make the parts store one secured room. A
  // three-cell front opening preserves access to the schedule bench inside.
  for (let x = 11; x <= 29; x += 1) {
    b.decorate('mesh-cage-panel', x, 2, { blocking: true, variant: 'parts', orient: 'se' });
    if (x < 19 || x > 21) b.decorate('mesh-cage-panel', x, 7, { blocking: true, variant: 'parts', orient: 'se' });
  }
  for (let y = 3; y <= 6; y += 1) {
    b.decorate('mesh-cage-panel', 11, y, { blocking: true, variant: 'parts', orient: 'sw' });
    b.decorate('mesh-cage-panel', 29, y, { blocking: true, variant: 'parts', orient: 'sw' });
  }
  for (const [x, y, variant, orient] of [
    [13, 5, 'archive-shelf', 'se'], [18, 6, 'locked-cabinet', 'sw'],
    [22, 6, 'archive-shelf', 'se'], [27, 5, 'current-records', 'sw']
  ]) b.decorate('south-measure-storage', x, y, { blocking: true, variant, orient });

  // Eight varied machine systems flank one continuous service trunk. The
  // shared pipe and overhead gantries bind the masses into a repair floor.
  for (const [kind, x, y, variant, orient] of [
    ['relief-machine', 13, 10, 'lathe', 'se'],
    ['intake-pump-assembly', 19, 10, 'coupled', 'sw'],
    ['relief-machine', 25, 10, 'press', 'se'],
    ['intake-pump-assembly', 13, 15, 'bypassed', 'se'],
    ['relief-machine', 19, 16, 'generator', 'sw'],
    ['intake-pump-assembly', 24, 15, 'coupled', 'sw'],
    ['relief-machine', 28, 16, 'pump-jig', 'se']
  ]) b.decorate(kind, x, y, { blocking: true, variant, orient });
  for (let x = 11; x <= 29; x += 1) {
    b.decorate('service-pipe-run', x, 12, {
      blocking: false,
      variant: x === 17 || x === 23 ? 'valve' : 'straight',
      orient: 'se'
    });
  }
  for (const [x, y, orient] of [[14, 13, 'se'], [21, 14, 'sw'], [27, 13, 'se']]) {
    b.decorate('south-measure-repair-rack', x, y, { blocking: true, orient });
  }
  for (const x of [12, 17, 22, 27]) {
    b.decorate('service-hatch', x, 17, { blocking: true, variant: 'grate', orient: x % 2 ? 'sw' : 'se' });
  }
  b.decorate('south-measure-pipe-gantry', 16, 11, { blocking: true, orient: 'se' });
  b.decorate('south-measure-pipe-gantry', 25, 14, { blocking: true, orient: 'sw' });
  for (const [x, y] of [[13, 11], [18, 15], [23, 16], [27, 15]]) b.decorate('machine-oil', x, y);
  for (const [x, y, variant, wallPlane] of [
    [10, 3, 'straight', 'se'], [10, 7, 'elbow', 'se'], [10, 15, 'valve', 'se'],
    [30, 3, 'straight', 'se'], [30, 7, 'elbow', 'se'], [30, 16, 'valve', 'se']
  ]) b.decorate('service-pipe-run', x, y, { blocking: false, variant, wallPlane });

  // The western cooling bay is one coupled system with service stock around it.
  for (const [x, y, variant, orient] of [
    [3, 10, 'generator', 'se'], [7, 10, 'cooling-jacket', 'sw'],
    [3, 14, 'pump-jig', 'se'], [8, 15, 'generator', 'sw']
  ]) b.decorate('relief-machine', x, y, { blocking: true, variant, orient });
  b.decorate('intake-pump-assembly', 7, 12, { blocking: true, variant: 'coupled', orient: 'se' });
  b.decorate('south-measure-pipe-gantry', 9, 9, { blocking: true, orient: 'sw' });
  for (const [x, y] of [[2, 12], [4, 16], [7, 17]]) b.decorate('rusted-barrel', x, y, { blocking: true });

  // Loading hardware and claim stock compress the public south bay into a working dock.
  b.decorate('freight-wagon', 29, 22, { blocking: true, orient: 'sw' });
  for (const [x, y, orient] of [[6, 22, 'se'], [8, 20, 'sw'], [12, 20, 'se'], [31, 20, 'sw']]) {
    b.decorate('sealed-storage-crate', x, y, { blocking: true, orient });
  }
  for (const [x, y] of [[13, 23], [17, 23], [22, 23], [26, 23], [32, 23]]) {
    b.decorate('utility-railing', x, y, { blocking: false, variant: 'service', orient: 'se' });
  }

  // The drain hatch belongs to a coupled service landing below the cooling
  // room. Grates, a gantry, pipework, rails, and stock make the vertical link
  // visible while leaving the arrival cell at 4,19 clear.
  for (const x of [1, 2, 5, 6, 7, 8, 9]) {
    b.decorate('service-pipe-run', x, 18, { blocking: false, variant: x % 3 ? 'straight' : 'valve', wallPlane: 'sw' });
  }
  b.decorate('service-hatch', 2, 20, { blocking: true, variant: 'grate', orient: 'se' });
  b.decorate('service-hatch', 5, 20, { blocking: true, variant: 'grate', orient: 'sw' });
  b.decorate('south-measure-pipe-gantry', 6, 20, { blocking: true, orient: 'se' });
  b.decorate('intake-pump-assembly', 8, 20, { blocking: true, variant: 'coupled', orient: 'sw' });
  for (let x = 1; x <= 9; x += 1) {
    b.decorate('utility-railing', x, 21, { blocking: false, variant: 'service', orient: 'se' });
  }
  b.decorate('tool-rack', 2, 22, { blocking: true });
  b.decorate('rusted-barrel', 8, 22, { blocking: true });

  // The east fire bay is one asymmetric wreck: collapsed masonry, a tipped
  // cart, damaged machinery, and only a few concentrated stone heaps.
  b.decorate('overturned-field-cart', 34, 14, { blocking: true, orient: 'sw' });
  b.decorate('relief-machine', 37, 15, { blocking: true, variant: 'generator', orient: 'se', damaged: true });
  b.decorate('south-measure-repair-rack', 31, 13, { blocking: true, orient: 'sw', damaged: true });
  b.decorate('sealed-storage-crate', 33, 17, { blocking: true, orient: 'se', damaged: true });
  for (const [x, y] of [[32, 12], [38, 13], [36, 17]]) b.decorate('rubble-pile', x, y, { blocking: true });
  for (const [x, y] of [[31, 15], [38, 16]]) b.decorate('rusted-barrel', x, y, { blocking: true, damaged: true });
  for (const [x, y] of [[34, 9], [36, 10], [31, 11], [37, 12], [33, 14], [35, 15], [38, 17]]) {
    b.decorate('scorch-mark', x, y);
  }
  for (const [x, y] of [[31, 10], [38, 9], [34, 12], [32, 16], [37, 16]]) b.decorate('rubble-decal', x, y);

  // One broad schedules bank belongs to a nearby records bench and surviving
  // file cabinet instead of floating as repeated plaques on a bare wall.
  b.decorate('south-measure-worktable', 35, 18, { blocking: true, variant: 'records', orient: 'sw' });
  b.decorate('south-measure-storage', 38, 18, { blocking: true, variant: 'current-records', orient: 'sw' });
  for (const [x, y] of [[32, 18], [34, 18], [37, 18]]) b.decorate('paper-scraps', x, y);

  // A worn T-shaped route joins the public door, machine aisle, and loading
  // edge. Other slab fields remain quiet work clearances.
  for (let x = 11; x <= 29; x += 1) b.decorate('road-dust', x, 19);
  for (let y = 9; y <= 18; y += 1) {
    b.decorate('road-dust', 20, y);
    b.decorate('road-dust', 21, y);
  }
  return b.finish(['south-measure-annex-main-door-annex', 'south-measure-annex-drain-hatch-annex']);
}

function makeFreight() {
  const b = builder({
    id: 'south-measure-morrow-freight-house', width: 36, height: 22,
    wallKind: 'south-measure-freight-wall', floor: 'farm-plank',
    mood: { floorShade: PALETTE.woodDark, floorShadeAlpha: 0.18, ambient: PALETTE.rustDark, ambientAlpha: 0.1, vignette: 0.2 },
    player: { x: 2, y: 13, facing: 'se' }
  });
  hwall(b.g, 7, 1, 34, [6, 7, 17, 18, 29, 30]);
  vwall(b.g, 10, 8, 20, [12, 13, 17, 18]);
  vwall(b.g, 24, 8, 20, [12, 13, 18, 19]);
  b.connector({ id: 'freight-main-door', dialogue: 'south-measure-freight-main-door-freight', copyKey: 'south-measure-freight-main-door', x: 0, y: 13, marker: point(1, 13), extra: { variant: 'freight', wallPlane: 'se' } });
  b.connector({ id: 'freight-rear-door', dialogue: 'south-measure-freight-rear-door-freight', copyKey: 'south-measure-freight-rear-door', x: 29, y: 21, marker: point(29, 20), extra: { variant: 'freight', wallPlane: 'sw' } });

  furniture(b, 'morrow-public-office', 'south-measure-return-stall', 4, 13, 'returns', 'sw');
  furniture(b, 'morrow-freight-scale', 'freight-scale', 7, 17, 'cargo', 'se');
  furniture(b, 'morrow-route-table', 'south-measure-worktable', 17, 12, 'route', 'se');
  wallBoard(b, 'morrow-convoy-loss-board', 14, 7, 'route', 'sw');
  wallBoard(b, 'morrow-medicine-run-board', 22, 7, 'schedules', 'sw');
  furniture(b, 'morrow-ledger-cage', 'mesh-cage-panel', 16, 6, 'ledger', 'se', {
    connected: { xMinus: true, xPlus: false }
  });
  furniture(b, 'morrow-pump-ledger', 'south-measure-storage', 18, 3, 'archive-shelf', 'sw', {
    dialogue: 'south-measure-freight-pump-ledger'
  });
  furniture(b, 'morrow-household-surety-folios', 'south-measure-storage', 21, 4, 'archive-shelf', 'sw');
  furniture(b, 'morrow-bonded-store', 'mesh-cage-panel', 29, 6, 'bonded', 'se', {
    connected: { xMinus: true, xPlus: false }
  });
  wallBoard(b, 'morrow-guard-memorial-tags', 0, 4, 'memorial', 'se');
  furniture(b, 'morrow-guard-bunks', 'farm-bed', 5, 4, undefined, 'se');
  b.add('farm-bed', 3, 4, { blocking: true, orient: 'se' });
  furniture(b, 'morrow-guard-mess', 'south-measure-worktable', 7, 10, 'cup-repair', 'sw');
  b.lootContainer({
    id: 'freight-written-off-road-crate',
    name: 'Written-Off Road Crate',
    kind: 'sealed-storage-crate',
    x: 31,
    y: 12,
    orient: 'sw',
    log: 'The Morrow seal is cut through. A red tally marks the load as road loss, cleared for recovery.',
    loot: [
      { item: 'relic-rounds', count: 2 },
      { item: 'tinned-beans', count: 1 },
      { item: 'drone-service-parts', count: 2 }
    ]
  });
  b.groundItem('freight-loose-ducat', 'ducat', 1, 32, 12);

  // Guard bunks and mess gear occupy the northwest room as a lived-in watch post.
  for (const [x, y, orient] of [[2, 2, 'se'], [7, 2, 'sw'], [7, 5, 'se']]) {
    b.decorate('farm-bed', x, y, { blocking: true, orient });
  }
  b.decorate('pantry-shelf', 2, 5, { blocking: true });
  b.decorate('shared-oven', 3, 9, { blocking: true });
  b.decorate('dining-table', 6, 9, { blocking: true, orient: 'se' });
  b.decorate('dining-bench', 6, 11, { blocking: true, orient: 'sw' });
  for (const [x, y] of [[4, 3], [8, 4], [3, 11], [8, 13]]) b.decorate('low-stool', x, y, { blocking: true });
  b.decorate('tool-rack', 9, 3, { blocking: true });
  b.decorate('paper-scraps', 8, 10);

  // The ledger cage is a continuous secured room with one deliberate two-cell
  // entry. The bonded store has its own closed front and side boundary, then a
  // dense cargo mass directly behind the mesh instead of isolated sample props.
  for (let x = 11; x <= 23; x += 1) {
    b.decorate('mesh-cage-panel', x, 2, {
      blocking: true,
      variant: 'ledger',
      orient: 'se',
      connected: { xMinus: x > 11, xPlus: x < 23 }
    });
  }
  for (const [start, end] of [[11, 15], [19, 23]]) {
    for (let x = start; x <= end; x += 1) {
      b.decorate('mesh-cage-panel', x, 6, {
        blocking: true,
        variant: 'ledger',
        orient: 'se',
        connected: { xMinus: x > start, xPlus: x < end || (end === 15 && x === 15) }
      });
    }
  }
  for (const x of [11, 23]) {
    for (let y = 3; y <= 5; y += 1) {
      b.decorate('mesh-cage-panel', x, y, {
        blocking: true,
        variant: 'ledger',
        orient: 'sw',
        connected: { yMinus: y > 3, yPlus: y < 5 }
      });
    }
  }

  for (const [start, end] of [[25, 28], [31, 34]]) {
    for (let x = start; x <= end; x += 1) {
      b.decorate('mesh-cage-panel', x, 6, {
        blocking: true,
        variant: 'bonded',
        orient: 'se',
        connected: { xMinus: x > start, xPlus: x < end || (end === 28 && x === 28) }
      });
    }
  }
  for (let y = 2; y <= 5; y += 1) {
    b.decorate('mesh-cage-panel', 25, y, {
      blocking: true,
      variant: 'bonded',
      orient: 'sw',
      connected: { yMinus: y > 2, yPlus: y < 5 }
    });
  }
  for (const [x, y, kind, orient] of [
    [26, 2, 'sealed-storage-crate', 'se'], [28, 2, 'grain-sack-stack', 'sw'],
    [30, 2, 'sealed-storage-crate', 'se'], [32, 2, 'grain-cage', 'sw'],
    [34, 2, 'grain-sack-stack', 'se'], [27, 3, 'grain-sack-stack', 'se'],
    [29, 3, 'sealed-storage-crate', 'sw'], [31, 3, 'rusted-crate', 'se'],
    [33, 3, 'grain-cage', 'sw'], [26, 4, 'sealed-storage-crate', 'sw'],
    [28, 4, 'grain-sack-stack', 'se'], [30, 4, 'grain-cage', 'sw'],
    [32, 4, 'sealed-storage-crate', 'se'], [34, 4, 'grain-sack-stack', 'sw'],
    [27, 5, 'rusted-crate', 'se'], [29, 5, 'grain-sack-stack', 'sw'],
    [31, 5, 'sealed-storage-crate', 'se'], [33, 5, 'grain-cage', 'sw']
  ]) b.decorate(kind, x, y, { blocking: true, orient });
  for (const [x, y, variant, orient] of [
    [12, 4, 'archive-shelf', 'se'], [14, 5, 'current-records', 'sw'],
    [20, 5, 'archive-shelf', 'se'], [22, 3, 'locked-cabinet', 'sw']
  ]) b.decorate('south-measure-storage', x, y, { blocking: true, variant, orient });

  // Public weighing and route negotiation share one dense central working floor.
  b.decorate('freight-wagon', 18, 17, { blocking: true, orient: 'se' });
  for (const [x, y, variant, orient] of [
    [15, 12, 'route', 'se'], [19, 12, 'route', 'se']
  ]) b.decorate('south-measure-worktable', x, y, { blocking: true, variant, orient });
  b.decorate('sealed-storage-crate', 16, 17, { blocking: true, orient: 'se' });
  b.decorate('sealed-storage-crate', 20, 17, { blocking: true, orient: 'sw' });
  for (const [x, y] of [[12, 10], [16, 10], [20, 10], [23, 14], [14, 18], [22, 19]]) {
    b.decorate('low-stool', x, y, { blocking: true });
  }
  for (const [x, y, orient] of [[27, 11, 'se'], [29, 14, 'sw'], [33, 16, 'se'], [27, 18, 'sw'], [33, 19, 'se']]) {
    b.decorate('sealed-storage-crate', x, y, { blocking: true, orient });
  }
  b.decorate('south-measure-notice-board', 11, 7, { blocking: false, orient: 'se' });
  b.decorate('south-measure-notice-board', 25, 7, { blocking: false, orient: 'sw' });
  for (const [x, y] of [[11, 14], [16, 14], [20, 15], [25, 10], [30, 10], [34, 14], [25, 20]]) b.decorate('paper-scraps', x, y);
  // A two-stage worn route crosses both internal partitions at their authored
  // gaps, drops past the weighbridge, and then turns toward the rear hoist.
  // Repetition in parallel cells makes the traffic hierarchy survive the busy
  // plank texture at broad composition scale.
  for (const y of [12, 13]) {
    for (let x = 1; x <= 34; x += 1) {
      const reservedDetail = y === 12 && (x === 4 || x === 32);
      if (b.g[y][x] !== '#' && !reservedDetail) b.decorate('road-dust', x, y);
    }
  }
  for (const x of [8, 9]) {
    for (let y = 13; y <= 18; y += 1) {
      if (b.g[y][x] !== '#') b.decorate('road-dust', x, y);
    }
  }
  for (let x = 7; x <= 34; x += 1) {
    if (b.g[18][x] !== '#' && ![29, 31, 34].includes(x)) b.decorate('road-dust', x, 18);
  }
  for (const x of [28, 29, 30]) {
    for (let y = 13; y <= 20; y += 1) {
      const reservedLoadingCell = x === 29 && (y === 18 || y === 19);
      if (b.g[y][x] !== '#' && !reservedLoadingCell) b.decorate('road-dust', x, y);
    }
  }

  // A canopy counter, queue rail, and posted terms compress the public office
  // into the main threshold instead of leaving one loose desk in the hall.
  b.decorate('south-measure-queue-rail', 3, 15, { blocking: false, orient: 'sw' });
  b.decorate('south-measure-notice-board', 2, 11, { blocking: false, orient: 'se' });
  b.decorate('low-stool', 6, 13, { blocking: true });
  b.decorate('paper-scraps', 4, 12);

  // Hoist, wagon, loading plate, staged stock, and dust funnel the freight run
  // into the otherwise narrow rear wall door.
  b.decorate('fixed-hoist', 29, 18, { blocking: true, orient: 'se' });
  b.decorate('freight-wagon', 31, 18, { blocking: true, orient: 'sw' });
  b.decorate('sealed-storage-crate', 34, 18, { blocking: true, orient: 'sw' });
  b.decorate('service-hatch', 29, 19, { blocking: false, variant: 'grate', orient: 'se' });
  for (const x of [26, 32]) b.decorate('utility-railing', x, 20, { blocking: false, variant: 'service', orient: 'se' });
  for (const [x, y] of [[28, 17], [30, 17], [29, 19], [29, 20]]) b.decorate('road-dust', x, y);
  return b.finish(['south-measure-freight-main-door-freight', 'south-measure-freight-rear-door-freight']);
}

function makeClinic() {
  const b = builder({
    id: 'south-measure-compact-clinic', width: 36, height: 24,
    wallKind: 'canvas-tent-interior-wall', floor: 'worn-canvas',
    mood: { floorShade: PALETTE.clothBlueDark, floorShadeAlpha: 0.18, ambient: PALETTE.outline, ambientAlpha: 0.12, vignette: 0.19 },
    player: { x: 18, y: 21, facing: 'ne' }
  });
  b.connector({ id: 'clinic-main-door', dialogue: 'south-measure-clinic-main-door-clinic', copyKey: 'south-measure-clinic-main-door', x: 18, y: 23, marker: point(18, 22), extra: { variant: 'clinic', wallPlane: 'sw' } });

  furniture(b, 'compact-clinic-triage-desk', 'south-measure-worktable', 17, 21, 'clinic', 'se');
  furniture(b, 'compact-clinic-six-bed-ward', 'clinic-bed', 13, 10, 'used', 'se');
  for (const [x, y, state] of [[17, 10, 'used'], [21, 10, 'clean'], [13, 15, 'used'], [17, 15, 'clean'], [21, 15, 'used']]) b.add('clinic-bed', x, y, { blocking: true, variant: state, orient: 'se' });
  b.inspect('compact-clinic-applicant-lane', 'south-measure-queue-rail', 29, 14, {
    blocking: false,
    orient: 'sw'
  });
  furniture(b, 'compact-clinic-placement-archive', 'south-measure-storage', 29, 3, 'archive-shelf', 'sw');
  wallBoard(b, 'compact-clinic-blood-card-station', 35, 10, 'blood-card', 'se');
  furniture(b, 'compact-clinic-cold-service-bay', 'mesh-cage-panel', 8, 4, 'parts', 'se');
  furniture(b, 'compact-clinic-flow-monitor', 'relief-machine', 5, 3, 'cold-coil', 'sw');
  furniture(b, 'compact-clinic-backup-cell', 'south-measure-storage', 13, 3, 'locked-cabinet', 'se');
  furniture(b, 'compact-clinic-isolation-room', 'clinic-bed', 5, 11, 'isolation', 'se');
  furniture(b, 'compact-clinic-staff-wash', 'wash-wall', 20, 3, undefined, 'sw');
  b.lootContainer({
    id: 'clinic-censure-field-satchel',
    name: 'Censure Field Satchel',
    kind: 'field-satchel',
    x: 12,
    y: 4,
    orient: 'se',
    log: 'A blue cord marks this satchel for Censure field use.',
    loot: [
      { item: 'field-dressing', count: 1 },
      { item: 'tinned-beans', count: 1 },
      { item: 'drone-service-parts', count: 1 }
    ]
  });
  b.groundItem('clinic-loose-field-dressing', 'field-dressing', 1, 12, 3);

  // The south triage station opens directly into one continuous queue. Its
  // east turn terminates at a records table beneath the archive wall.
  b.decorate('south-measure-worktable', 12, 21, { blocking: true, variant: 'clinic', orient: 'se' });
  b.decorate('south-measure-worktable', 22, 21, { blocking: true, variant: 'clinic', orient: 'sw' });
  b.decorate('south-measure-medicine-cart', 8, 21, { blocking: true, orient: 'se' });
  b.decorate('south-measure-medicine-cart', 27, 21, { blocking: true, orient: 'sw' });
  for (const [x, y] of [[10, 22], [15, 20], [20, 20], [25, 22]]) b.decorate('low-stool', x, y, { blocking: true });
  for (let x = 23; x <= 28; x += 1) {
    b.add('south-measure-queue-rail', x, 20, { blocking: false, orient: 'se' });
  }
  for (let y = 6; y <= 20; y += 1) {
    if (y === 14) continue;
    b.add('south-measure-queue-rail', 29, y, { blocking: false, orient: 'sw' });
  }

  // Every bed has nearby working equipment, dressing stock, and a clear circulation lane.
  for (const [x, y, orient] of [
    [11, 9, 'se'], [15, 12, 'sw'], [19, 9, 'se'], [23, 12, 'sw'],
    [11, 16, 'se'], [19, 17, 'sw']
  ]) b.decorate('south-measure-medicine-cart', x, y, { blocking: true, orient });
  for (const [x, y, variant, orient] of [
    [11, 13, 'medicine-shelf', 'se'], [15, 17, 'medicine-shelf', 'sw'],
    [19, 13, 'locked-cabinet', 'se'], [23, 17, 'medicine-shelf', 'sw']
  ]) b.decorate('south-measure-storage', x, y, { blocking: true, variant, orient });
  for (const [x, y] of [[12, 8], [16, 12], [20, 8], [24, 14], [12, 17], [24, 17]]) b.decorate('paper-scraps', x, y);

  // Applicant stools sit inside the rail and a connected screen run keeps the
  // lane legible as one process instead of a scatter of isolated cubicles.
  for (const [x, y] of [[30, 9], [31, 12], [30, 17]]) b.decorate('low-stool', x, y, { blocking: true });
  b.decorate('south-measure-notice-board', 35, 14, { blocking: false, orient: 'se' });
  const applicantScreenYs = new Set([8, 9, 10, 11, 13, 14, 15, 16, 17]);
  for (const y of applicantScreenYs) {
    b.add('cloth-partition', 33, y, {
      blocking: true,
      variant: 'clinic',
      orient: 'sw',
      connected: {
        yMinus: applicantScreenYs.has(y - 1),
        yPlus: applicantScreenYs.has(y + 1)
      }
    });
  }

  // Five close-spaced record units form one archive wall. The handling table
  // is the visible queue endpoint rather than another loose cabinet.
  for (const [x, variant, orient] of [
    [25, 'current-records', 'sw'], [27, 'archive-shelf', 'se'],
    [31, 'current-records', 'sw'], [33, 'archive-shelf', 'se']
  ]) b.add('south-measure-storage', x, 3, { blocking: true, variant, orient });
  b.add('south-measure-worktable', 29, 5, { blocking: true, variant: 'records', orient: 'sw' });
  b.add('south-measure-notice-board', 33, 5, { blocking: false, variant: 'census', orient: 'se' });

  // Cold service is one coupled utility system. A U-shaped pipe run joins the
  // monitor and backup cell through a grate, gantry, and repair rack.
  b.decorate('relief-machine', 3, 4, { blocking: true, variant: 'cold-coil', orient: 'se' });
  b.decorate('mesh-cage-panel', 6, 2, { blocking: true, variant: 'parts', orient: 'sw' });
  b.add('south-measure-pipe-gantry', 9, 3, { blocking: true, orient: 'se' });
  b.add('service-hatch', 9, 4, { blocking: false, variant: 'grate', orient: 'se' });
  b.add('south-measure-repair-rack', 11, 3, { blocking: true, orient: 'sw' });
  b.add('service-pipe-run', 5, 4, {
    blocking: false, variant: 'straight', orient: 'sw', connected: { yPlus: true }
  });
  b.add('service-pipe-run', 13, 4, {
    blocking: false, variant: 'straight', orient: 'sw', connected: { yPlus: true }
  });
  for (let x = 5; x <= 13; x += 1) {
    if (x === 5) {
      b.add('service-pipe-run', x, 5, {
        blocking: false, variant: 'elbow', orient: 'nw', connected: { xPlus: true, yMinus: true }
      });
      continue;
    }
    if (x === 13) {
      b.add('service-pipe-run', x, 5, {
        blocking: false, variant: 'elbow', orient: 'sw', connected: { xMinus: true, yMinus: true }
      });
      continue;
    }
    b.add('service-pipe-run', x, 5, {
      blocking: false,
      variant: x === 9 ? 'valve' : 'straight',
      orient: 'se',
      connected: { xMinus: true, xPlus: true }
    });
  }

  // Isolation uses two connected screen lengths with one deliberate doorway.
  const isolationScreenYs = new Set([9, 10, 11, 13, 14, 15]);
  for (const y of isolationScreenYs) {
    b.add('cloth-partition', 8, y, {
      blocking: true,
      variant: 'isolation',
      orient: 'sw',
      connected: {
        yMinus: isolationScreenYs.has(y - 1),
        yPlus: isolationScreenYs.has(y + 1)
      }
    });
  }
  b.decorate('south-measure-storage', 3, 13, { blocking: true, variant: 'medicine-shelf', orient: 'se' });
  b.decorate('candle-cluster', 2, 10, { blocking: false });

  // Staff wash repeats the sanitation grammar across two stations: wall
  // basins, tubs, drying lines, floor drains, and wet boot marks.
  b.decorate('farm-bed', 16, 3, { blocking: true, orient: 'se' });
  b.add('wash-wall', 23, 3, { blocking: true, orient: 'sw' });
  b.add('south-measure-water-vessels', 24, 3, { blocking: true, orient: 'se' });
  for (const x of [20, 23]) b.add('mortuary-drain', x, 4, { blocking: false });
  for (const x of [19, 21, 22, 24]) b.add('trampled-mud', x, 4, { blocking: false });
  for (const x of [19, 22]) b.add('wash-tub', x, 5, { blocking: true });
  for (const x of [20, 23]) b.add('laundry-line', x, 6, { blocking: true, orient: 'se' });

  // The field satchel belongs to a conspicuous ready-use pocket, bracketed by
  // medicine stock and a small dressing surface rather than lying by itself.
  b.decorate('south-measure-storage', 10, 2, { blocking: true, variant: 'medicine-shelf', orient: 'se' });
  b.decorate('south-measure-medicine-cart', 10, 4, { blocking: true, orient: 'se' });
  b.decorate('south-measure-worktable', 14, 4, { blocking: true, variant: 'clinic', orient: 'sw' });
  b.decorate('paper-scraps', 14, 2);
  b.decorate('paper-scraps', 11, 6);

  // Three connected screen runs divide functions without scattering isolated
  // fragments through the open canvas shell.
  for (let x = 9; x <= 14; x += 1) {
    b.add('cloth-partition', x, 19, {
      blocking: true,
      variant: 'clinic',
      orient: 'se',
      connected: { xMinus: x > 9, xPlus: x < 14 }
    });
  }

  // Full-cell wear bands make the entry spine and both crossings durable at
  // broad scale. Furnishings interrupt the wear naturally at occupied cells.
  for (let y = 3; y <= 22; y += 1) b.decorate('road-dust', 18, y);
  for (let x = 3; x <= 28; x += 1) b.decorate('road-dust', x, 7);
  for (let x = 3; x <= 28; x += 1) b.decorate('road-dust', x, 18);
  return b.finish(['south-measure-clinic-main-door-clinic']);
}

function makeHall() {
  const b = builder({
    id: 'south-measure-measure-hall', width: 34, height: 22,
    wallKind: 'south-measure-domestic-wall', floor: 'farm-plank',
    mood: { floorShade: PALETTE.woodDark, floorShadeAlpha: 0.15, ambient: PALETTE.rustDark, ambientAlpha: 0.1, vignette: 0.18 },
    player: { x: 17, y: 19, facing: 'ne' }
  });
  hwall(b.g, 6, 1, 32, [5, 6, 16, 17, 27, 28]);
  vwall(b.g, 26, 1, 12, [9, 10]);
  b.connector({ id: 'hall-main-door', dialogue: 'south-measure-hall-main-door-hall', copyKey: 'south-measure-hall-main-door', x: 17, y: 21, marker: point(17, 20), extra: { variant: 'domestic', wallPlane: 'sw' } });

  furniture(b, 'measure-hall-slate-school', 'south-measure-worktable', 17, 17, 'school', 'se');
  furniture(b, 'measure-hall-council-table', 'south-measure-worktable', 17, 9, 'council', 'se');
  furniture(b, 'measure-hall-kitchen', 'south-measure-worktable', 4, 10, 'cup-repair', 'sw');
  furniture(b, 'measure-hall-current-water-roll', 'south-measure-storage', 29, 9, 'current-records', 'sw');
  furniture(b, 'measure-hall-burial-copies', 'south-measure-storage', 22, 4, 'burial-copies', 'sw');
  furniture(b, 'measure-hall-canvas-loft', 'stone-stairwell', 10, 4, 'cellar-flight', 'se');
  b.lootContainer({
    id: 'hall-storm-issue-crate',
    name: 'Storm Issue Crate',
    kind: 'sealed-storage-crate',
    x: 14,
    y: 4,
    orient: 'se',
    log: 'The hall clerk broke the seal and chalked PUBLIC ISSUE across the lid.',
    loot: [
      { item: 'tinned-beans', count: 1 },
      { item: 'ducat', count: 2 }
    ]
  });
  b.groundItem('hall-loose-tinned-beans', 'tinned-beans', 1, 15, 4);
  b.inspect('measure-hall-painted-strip', 'south-measure-wall-board', 16, 0, {
    blocking: true,
    variant: 'slate',
    wallPlane: 'sw'
  });
  b.inspect('measure-hall-empty-custody-rest', 'south-measure-custody-rest', 20, 11, { blocking: false, orient: 'sw' });
  furniture(b, 'measure-hall-storm-room', 'clinic-bed', 30, 3, 'used', 'se');
  b.add('shared-oven', 2, 10, { blocking: true });

  // The hall's identity is one broad civic floor filled with repeated school desks.
  for (const [x, y, orient] of [
    [10, 15, 'se'], [14, 15, 'sw'], [18, 15, 'se'], [22, 15, 'sw'],
    [10, 18, 'sw'], [14, 18, 'se'], [20, 18, 'sw'], [24, 18, 'se']
  ]) b.decorate('south-measure-worktable', x, y, { blocking: true, variant: 'school', orient });
  for (const [x, y] of [
    [9, 16], [12, 16], [15, 16], [19, 16], [22, 16], [25, 16],
    [9, 19], [12, 19], [15, 19], [20, 19], [23, 19], [26, 19]
  ]) b.decorate('low-stool', x, y, { blocking: true });
  for (const [index, [x, y]] of [[11, 14], [17, 14], [21, 14], [12, 17], [18, 18], [25, 17]].entries()) {
    b.decorate(index % 2 === 0 ? 'south-measure-water-lesson' : 'chalk-drawing', x, y);
  }

  // A long council table anchors the rear of the open room.
  for (const [x, y, orient] of [[13, 9, 'se'], [15, 9, 'se'], [19, 9, 'se'], [21, 9, 'se']]) {
    b.decorate('south-measure-worktable', x, y, { blocking: true, variant: 'council', orient });
  }
  for (const [x, y, orient] of [[13, 11, 'se'], [15, 11, 'se'], [17, 11, 'se']]) {
    b.decorate('dining-bench', x, y, { blocking: true, orient });
  }
  b.decorate('south-measure-notice-board', 18, 7, { blocking: false, orient: 'se' });
  b.decorate('paper-scraps', 14, 10);
  b.decorate('paper-scraps', 19, 10);

  // Kitchen remains a compact lived-in mass beside the open civic floor.
  b.decorate('south-measure-worktable', 4, 8, { blocking: true, variant: 'cup-repair', orient: 'se' });
  b.decorate('pantry-shelf', 7, 8, { blocking: true });
  b.decorate('wash-wall', 6, 12, { blocking: true, orient: 'sw' });
  b.decorate('south-measure-water-vessels', 2, 13, { blocking: true });
  b.decorate('dining-table', 4, 14, { blocking: true, orient: 'se' });
  b.decorate('dining-bench', 6, 15, { blocking: true, orient: 'sw' });

  // The current water roll is maintained at one working surface with vessels,
  // repeated live records, and a public census board.
  b.add('south-measure-storage', 29, 7, { blocking: true, variant: 'current-records', orient: 'se' });
  b.add('south-measure-storage', 31, 7, { blocking: true, variant: 'current-records', orient: 'sw' });
  b.add('south-measure-worktable', 31, 10, { blocking: true, variant: 'records', orient: 'sw' });
  b.add('south-measure-notice-board', 32, 9, { blocking: false, variant: 'census', orient: 'sw' });
  b.add('south-measure-water-vessels', 29, 11, { blocking: true, orient: 'se' });
  b.add('south-measure-water-vessels', 32, 12, { blocking: true, orient: 'sw' });
  b.add('paper-scraps', 30, 8);

  // The loft is reached by a visible rising flight. Connected canvas panels,
  // drying cloth, and rolled bed canvas establish its destination without the
  // fixed industrial hoist that previously dominated this corner.
  const loftCanvasXs = new Set([7, 8, 9, 10, 11, 12]);
  for (const x of loftCanvasXs) {
    b.add('cloth-partition', x, 2, {
      blocking: true,
      variant: 'domestic',
      orient: 'se',
      connected: { xMinus: loftCanvasXs.has(x - 1), xPlus: loftCanvasXs.has(x + 1) }
    });
  }
  b.add('laundry-line', 7, 4, { blocking: true, orient: 'se' });
  b.add('laundry-line', 13, 3, { blocking: true, orient: 'sw' });
  b.add('camp-bedroll', 8, 3, { blocking: false });
  b.add('camp-bedroll', 11, 3, { blocking: false });
  b.add('utility-railing', 12, 4, { blocking: false, variant: 'civic', orient: 'se' });

  // Burial copies form one public-memory shelf with candles and a handling
  // table directly below the memorial board.
  b.decorate('south-measure-storage', 20, 4, { blocking: true, variant: 'burial-copies', orient: 'sw' });
  b.decorate('south-measure-storage', 24, 4, { blocking: true, variant: 'burial-copies', orient: 'se' });
  b.decorate('south-measure-wall-board', 22, 0, { blocking: false, variant: 'memorial', wallPlane: 'sw' });
  b.add('south-measure-worktable', 22, 5, { blocking: true, variant: 'records', orient: 'se' });
  b.decorate('candle-cluster', 20, 5, { blocking: false });
  b.decorate('candle-cluster', 24, 5, { blocking: false });

  // Six adjacent slate panels turn the painted strip into one continuous wall
  // register rather than a single floor-screen token.
  for (const x of [13, 14, 15, 17, 18, 19]) {
    b.add('south-measure-wall-board', x, 0, { blocking: true, variant: 'slate', wallPlane: 'sw' });
  }

  // The storm corner remains visibly provisioned but leaves the wall opening clear.
  b.decorate('charity-cot', 31, 5, { blocking: true, orient: 'se' });
  for (const [x, y] of [[2, 8], [7, 10], [11, 5]]) b.decorate('candle-cluster', x, y, { blocking: false });

  // The removed custody bench keeps a clear footprint. Low drain and wall
  // scars supply restraint and absence cues without filling the reserved space.
  b.add('mortuary-drain', 20, 12, { blocking: false });
  b.add('south-measure-wall-board', 20, 6, { blocking: false, variant: 'crawl-marks', wallPlane: 'sw' });
  b.add('utility-railing', 18, 10, { blocking: false, variant: 'broken', orient: 'sw' });
  b.add('utility-railing', 24, 12, { blocking: false, variant: 'broken', orient: 'se' });

  // One continuous dust graph links the door, school, council, kitchen, and
  // east service roll. Exact full-cell runs make circulation visible at scale.
  for (let y = 4; y <= 20; y += 1) b.decorate('road-dust', 16, y);
  b.decorate('road-dust', 17, 20);
  for (let x = 3; x <= 27; x += 1) b.decorate('road-dust', x, 13);
  for (let y = 10; y <= 12; y += 1) b.decorate('road-dust', 3, y);
  for (let y = 7; y <= 12; y += 1) b.decorate('road-dust', 27, y);
  return b.finish(['south-measure-hall-main-door-hall']);
}

function makeVaro() {
  const b = builder({
    id: 'south-measure-varo-house', width: 22, height: 16,
    wallKind: 'south-measure-domestic-wall', floor: 'south-measure-row',
    mood: { floorShade: PALETTE.woodDark, floorShadeAlpha: 0.13, ambient: PALETTE.rustDark, ambientAlpha: 0.08, vignette: 0.15 },
    player: { x: 2, y: 10, facing: 'se' }
  });
  b.connector({ id: 'varo-main-door', dialogue: 'south-measure-varo-door-varo', copyKey: 'south-measure-varo-main-door', x: 0, y: 10, marker: point(1, 10), extra: { variant: 'domestic', wallPlane: 'se' } });

  furniture(b, 'varo-house-pump-bench', 'farm-workbench', 4, 10, undefined, 'sw');
  wallBoard(b, 'varo-house-diagram-wall', 0, 7, 'diagram', 'se');
  furniture(b, 'varo-house-cup-repair-table', 'south-measure-worktable', 9, 6, 'cup-repair', 'se');
  furniture(b, 'varo-house-family-table', 'south-measure-worktable', 10, 12, 'family-meal', 'se');
  b.inspect('varo-house-sleeping-partitions', 'cloth-partition', 15, 3, { blocking: true, variant: 'domestic', orient: 'se' });
  b.add('farm-bed', 18, 5, { blocking: true, orient: 'se' });
  b.add('farm-bed', 18, 12, { blocking: true, orient: 'sw' });
  furniture(b, 'varo-house-rear-work-shelf', 'south-measure-storage', 8, 2, 'work-shelf', 'se');
  furniture(b, 'varo-house-school-tools', 'south-measure-storage', 14, 2, 'school-tools', 'sw');
  b.lootContainer({
    id: 'varo-censure-repair-satchel',
    name: 'Censure Repair Satchel',
    kind: 'field-satchel',
    x: 13,
    y: 5,
    orient: 'sw',
    log: 'A household tag reads FOR CENSURE USE. The strap is looped shut, not locked.',
    loot: [{ item: 'penitent-gear-scrap', count: 1 }]
  });
  b.groundItem('varo-loose-tinned-beans', 'tinned-beans', 1, 4, 14);

  // A nearly continuous rear shelf compresses the whole household toward the
  // common room. Tools, school pieces, pantry stock, and repair scraps share
  // one long working silhouette instead of isolated cabinets.
  for (const [x, variant, orient] of [
    [3, 'work-shelf', 'se'], [5, 'work-shelf', 'sw'], [11, 'work-shelf', 'se'],
    [17, 'work-shelf', 'sw']
  ]) b.decorate('south-measure-storage', x, 2, { blocking: true, variant, orient });
  b.decorate('pantry-shelf', 20, 2, { blocking: true });
  b.decorate('tool-rack', 16, 2, { blocking: true });
  b.decorate('chalk-drawing', 13, 4);
  b.decorate('south-measure-water-lesson', 14, 4);
  b.decorate('low-stool', 16, 5, { blocking: true });

  // The entrance is visibly a pump workshop. The diagram band touches the
  // bench, while the pump, tools, water, oil, and repair rack close the bay.
  b.decorate('south-measure-wall-board', 0, 8, { blocking: true, variant: 'diagram', wallPlane: 'se' });
  b.decorate('south-measure-hand-pump', 2, 12, { blocking: true });
  b.decorate('south-measure-repair-rack', 6, 12, { blocking: true, orient: 'sw' });
  b.decorate('tool-rack', 2, 8, { blocking: true });
  b.decorate('rusted-barrel', 6, 9, { blocking: true });
  b.decorate('south-measure-water-vessels', 2, 14, { blocking: true });
  b.decorate('low-stool', 6, 11, { blocking: true });
  b.decorate('tool-rack', 7, 10, { blocking: true });
  b.decorate('south-measure-water-vessels', 7, 13, { blocking: true });
  b.decorate('machine-oil', 5, 11);
  b.decorate('machine-oil', 4, 13);
  b.decorate('paper-scraps', 3, 11);

  // Cup repair has its own active tool cluster and remains distinct from the
  // larger family meal surface.
  b.decorate('shared-oven', 2, 4, { blocking: true });
  b.decorate('pantry-shelf', 5, 4, { blocking: true });
  b.decorate('wash-tub', 2, 6, { blocking: true });
  b.decorate('south-measure-repair-rack', 7, 5, { blocking: true, orient: 'se' });
  b.decorate('tool-rack', 11, 5, { blocking: true });
  b.decorate('dining-bench', 6, 7, { blocking: true, orient: 'se' });
  b.decorate('low-stool', 8, 8, { blocking: true });
  b.decorate('low-stool', 11, 7, { blocking: true });
  b.decorate('south-measure-water-vessels', 6, 6, { blocking: true });
  b.decorate('candle-cluster', 10, 5, { blocking: false });

  // Two short L-shaped curtain runs imply sleeping pockets without building a
  // bright interior wall maze. Their open ends expose both beds and routes.
  for (const x of [16, 17, 18]) {
    b.decorate('cloth-partition', x, 3, { blocking: true, variant: 'domestic', orient: 'se' });
    b.decorate('cloth-partition', x, 9, { blocking: true, variant: 'domestic', orient: 'se' });
  }
  b.decorate('cloth-partition', 15, 9, { blocking: true, variant: 'domestic', orient: 'se' });
  for (const y of [4, 5, 10, 11]) {
    b.decorate('cloth-partition', 15, y, { blocking: true, variant: 'domestic', orient: 'sw' });
  }
  b.decorate('low-stool', 20, 6, { blocking: true });
  b.decorate('low-stool', 20, 13, { blocking: true });
  b.decorate('candle-cluster', 19, 4, { blocking: false });
  b.decorate('candle-cluster', 19, 11, { blocking: false });
  b.decorate('south-measure-water-vessels', 18, 7, { blocking: true });
  b.decorate('laundry-line', 18, 14, { blocking: true, orient: 'sw' });

  // Four seats and visible place-setting debris make the meal table the
  // common-room anchor rather than another workbench.
  b.decorate('dining-bench', 8, 14, { blocking: true, orient: 'se' });
  b.decorate('dining-bench', 12, 14, { blocking: true, orient: 'sw' });
  b.decorate('low-stool', 8, 11, { blocking: true });
  b.decorate('low-stool', 12, 11, { blocking: true });
  b.decorate('south-measure-water-vessels', 14, 13, { blocking: true });
  b.decorate('paper-scraps', 10, 13);

  // A small household study surface fills the former dead centre without
  // competing with the large meal table or the entrance repair bench.
  b.decorate('dining-table', 13, 8, { blocking: true, orient: 'se' });
  b.decorate('low-stool', 12, 8, { blocking: true });
  b.decorate('low-stool', 14, 8, { blocking: true });
  b.decorate('chalk-drawing', 13, 9);

  // Continuous boot wear joins the door, repair bay, family floor, study, and
  // the two sleeping openings. Objects interrupt it naturally at work points.
  for (let x = 1; x <= 14; x += 1) b.decorate('road-dust', x, 10);
  for (let y = 4; y <= 14; y += 1) b.decorate('road-dust', 10, y);
  for (let x = 10; x <= 20; x += 1) b.decorate('road-dust', x, 7);
  return b.finish(['south-measure-varo-door-varo']);
}

function makeHiddenRows() {
  const b = builder({
    id: 'south-measure-hidden-rows', width: 30, height: 18,
    wallKind: 'south-measure-domestic-wall', floor: 'south-measure-row',
    mood: { floorShade: PALETTE.clothDark, floorShadeAlpha: 0.23, ambient: PALETTE.clothBlueDark, ambientAlpha: 0.14, vignette: 0.25 },
    player: { x: 2, y: 6, facing: 'se' }
  });
  // Three household rooms sit above one uninterrupted shared lane. Only the
  // household backs use full-height walls; treatment and meeting boundaries
  // below the lane are cloth and furniture, avoiding the old cubicle maze.
  hwall(b.g, 9, 1, 25, [5, 14, 23]);
  vwall(b.g, 10, 1, 8, [7, 8]);
  vwall(b.g, 19, 1, 8, [7, 8]);
  b.connector({ id: 'hidden-rows-drying-frame', dialogue: 'south-measure-hidden-rows-drying-frame-rows', copyKey: 'south-measure-hidden-wash-wall', x: 0, y: 6, marker: point(1, 6), extra: { variant: 'domestic', wallPlane: 'se' } });
  b.connector({ id: 'hidden-rows-grave-passage-exit', dialogue: 'south-measure-hidden-rows-grave-passage-rows', copyKey: 'south-measure-hidden-grave-door', x: 24, y: 0, marker: point(24, 1), extra: { variant: 'domestic', wallPlane: 'sw' } });

  furniture(b, 'hidden-rows-first-household-room', 'farm-bed', 5, 4, undefined, 'se');
  furniture(b, 'hidden-rows-second-household-room', 'farm-bed', 14, 4, undefined, 'sw');
  furniture(b, 'hidden-rows-third-household-room', 'farm-bed', 22, 4, undefined, 'se');
  b.inspect('hidden-rows-concealed-water-branch', 'service-pipe-run', 4, 9, { blocking: false, variant: 'valve', wallPlane: 'sw' });
  b.inspect('hidden-rows-shared-cooking-flue', 'service-pipe-run', 19, 9, {
    blocking: false,
    variant: 'elbow',
    wallPlane: 'sw',
    connected: { xMinus: true, yMinus: true }
  });
  furniture(b, 'hidden-rows-treatment-room', 'clinic-bed', 5, 14, 'used', 'se');
  furniture(b, 'hidden-rows-meeting-table', 'south-measure-worktable', 15, 14, 'meeting', 'se');
  wallBoard(b, 'hidden-rows-private-water-list', 16, 17, 'private-list', 'sw');
  b.inspect('hidden-rows-grave-passage', 'utility-railing', 26, 4, { blocking: true, variant: 'broken', orient: 'sw' });
  b.lootContainer({
    id: 'hidden-rows-free-clinic-satchel',
    name: 'Free Clinic Satchel',
    kind: 'field-satchel',
    x: 8,
    y: 15,
    orient: 'sw',
    log: 'A cloth tag reads FREE CLINIC. TAKE WHAT THE FEVER NEEDS.',
    loot: [
      { item: 'field-dressing', count: 1 },
      { item: 'tinned-beans', count: 1 },
      { item: 'drone-service-parts', count: 1 }
    ]
  });
  b.groundItem('hidden-rows-loose-tinned-beans', 'tinned-beans', 1, 17, 8);

  // A dense drying-frame screen conceals the west entry without replacing it
  // with exposed machinery. The large nonblocking rack stands directly in
  // front of the door while preserving the use cell at 1,6.
  for (const [x, y, orient] of [[2, 3, 'se'], [4, 2, 'sw'], [7, 2, 'se'], [8, 5, 'sw'], [2, 7, 'se']]) {
    b.decorate('laundry-line', x, y, { blocking: true, orient });
  }
  b.decorate('laundry-line', 1, 5, { blocking: false, orient: 'sw' });
  b.decorate('laundry-line', 1, 7, { blocking: false, orient: 'se', variant: 'entry-screen' });
  b.decorate('wash-wall', 3, 8, { blocking: true, orient: 'se' });
  b.decorate('wash-tub', 3, 3, { blocking: true });
  b.decorate('south-measure-water-vessels', 8, 8, { blocking: true });

  // Three differently furnished households sit in sequence above the lane.
  for (const [x, y, kind, extra] of [
    [8, 3, 'shared-oven', { blocking: true }], [4, 7, 'dining-table', { blocking: true, orient: 'se' }],
    [7, 7, 'dining-bench', { blocking: true, orient: 'sw' }], [8, 6, 'pantry-shelf', { blocking: true }],
    [2, 8, 'low-stool', { blocking: true }], [7, 3, 'south-measure-water-vessels', { blocking: true }],

    [12, 2, 'south-measure-storage', { blocking: true, variant: 'work-shelf', orient: 'se' }],
    [13, 7, 'south-measure-worktable', { blocking: true, variant: 'cup-repair', orient: 'sw' }],
    [17, 7, 'south-measure-repair-rack', { blocking: true, orient: 'se' }],
    [17, 3, 'tool-rack', { blocking: true }], [12, 6, 'low-stool', { blocking: true }],
    [17, 5, 'south-measure-water-vessels', { blocking: true }],

    [21, 2, 'wash-tub', { blocking: true }], [23, 7, 'dining-table', { blocking: true, orient: 'se' }],
    [21, 8, 'dining-bench', { blocking: true, orient: 'sw' }], [23, 3, 'pantry-shelf', { blocking: true }],
    [24, 6, 'south-measure-water-vessels', { blocking: true }]
  ]) b.decorate(kind, x, y, extra);
  b.add('shared-oven', 20, 10, { blocking: true });
  for (const [x, y] of [[3, 6], [8, 4], [12, 5], [17, 6], [21, 5], [24, 7]]) b.decorate('candle-cluster', x, y, { blocking: false });
  for (const [x, y] of [[5, 8], [15, 7], [22, 8]]) b.decorate('paper-scraps', x, y);

  // The concealed branch is a long wall-mounted pipe shared by every room,
  // with one valve per household threshold. The cooking flue rises as a
  // separate vertical service run beside the communal oven.
  const waterBreaks = new Set([5, 14, 19, 23]);
  for (let x = 2; x <= 24; x += 1) {
    if (waterBreaks.has(x)) continue;
    const segmentStart = x === 2 || waterBreaks.has(x - 1);
    const segmentEnd = x === 24 || waterBreaks.has(x + 1);
    b.decorate('service-pipe-run', x, 9, {
      blocking: false,
      variant: [4, 13, 22].includes(x) ? 'valve' : 'straight',
      wallPlane: 'sw',
      orient: 'se',
      connected: { xMinus: !segmentStart, xPlus: !segmentEnd }
    });
  }
  for (const y of [2, 3, 4, 5, 6]) {
    b.decorate('service-pipe-run', 19, y, {
      blocking: false, variant: y === 3 ? 'valve' : 'straight', wallPlane: 'se', orient: 'sw'
    });
  }
  for (const x of [6, 15, 24]) b.decorate('south-measure-hand-pump', x, 10, { blocking: true });

  // Treatment uses a soft screen with one clear opening. The meeting room has
  // a paired table, seating, and a secured private list against the rear wall.
  for (const x of [1, 2, 3, 4, 6, 7, 8, 9]) {
    b.decorate('cloth-partition', x, 12, { blocking: true, variant: 'clinic', orient: 'se' });
  }
  b.decorate('south-measure-worktable', 2, 15, { blocking: true, variant: 'clinic', orient: 'sw' });
  b.decorate('south-measure-medicine-cart', 7, 15, { blocking: true, orient: 'se' });
  b.decorate('south-measure-storage', 9, 14, { blocking: true, variant: 'medicine-shelf', orient: 'sw' });
  b.decorate('wash-wall', 2, 14, { blocking: true, orient: 'se' });
  b.decorate('candle-cluster', 4, 13, { blocking: false });

  b.decorate('dining-bench', 13, 16, { blocking: true, orient: 'se' });
  b.decorate('dining-bench', 18, 16, { blocking: true, orient: 'sw' });
  b.decorate('low-stool', 12, 14, { blocking: true });
  b.decorate('low-stool', 19, 14, { blocking: true });
  b.decorate('south-measure-storage', 20, 15, { blocking: true, variant: 'locked-cabinet', orient: 'sw' });
  b.decorate('paper-scraps', 15, 15);

  // A long rail compresses the grave route against the east wall. Rubble and
  // the turn from the north door make the passage directional at a glance.
  for (const y of [2, 3, 5, 6, 7, 8, 11, 12, 13, 14, 15, 16]) {
    b.decorate('utility-railing', 26, y, { blocking: true, variant: y % 3 ? 'service' : 'broken', orient: 'sw' });
  }
  b.decorate('utility-railing', 25, 2, { blocking: true, variant: 'service', orient: 'se' });
  for (const [x, y] of [[28, 3], [27, 6], [28, 12], [27, 15]]) b.decorate('rubble-decal', x, y);
  b.decorate('rubble-pile', 28, 8, { blocking: true });

  // One strong longitudinal wear band follows the row, with short branches to
  // treatment, meeting, and the grave-passage turn.
  for (let x = 1; x <= 25; x += 1) b.decorate('road-dust', x, 11);
  for (let y = 10; y <= 16; y += 1) b.decorate('road-dust', 5, y);
  for (let y = 11; y <= 16; y += 1) b.decorate('road-dust', 15, y);
  for (let y = 2; y <= 11; y += 1) b.decorate('road-dust', 24, y);
  return b.finish(['south-measure-hidden-rows-drying-frame-rows', 'south-measure-hidden-rows-grave-passage-rows']);
}

function makeCellar() {
  const b = builder({
    id: 'south-measure-charity-cellar', width: 22, height: 16,
    wallKind: 'south-measure-intake-wall', floor: 'south-measure-slab',
    mood: { floorShade: PALETTE.outline, floorShadeAlpha: 0.3, ambient: PALETTE.clothBlueDark, ambientAlpha: 0.19, vignette: 0.33 },
    player: { x: 18, y: 13, facing: 'nw' }
  });
  // A low rear crawl occupies the northwest strip and rejoins the reserve at
  // one narrow opening. The patient bay uses cloth rather than a masonry room.
  hwall(b.g, 5, 1, 5, [5]);
  b.connector({ id: 'charity-cellar-stair', dialogue: 'south-measure-charity-trapdoor-cellar', copyKey: 'south-measure-charity-trapdoor', x: 21, y: 13, marker: point(20, 13), extra: { variant: 'civil', wallPlane: 'se' } });

  furniture(b, 'charity-cellar-clean-supply-shelves', 'south-measure-storage', 10, 3, 'clean-shelf', 'se');
  furniture(b, 'charity-cellar-suspect-cabinet', 'south-measure-storage', 3, 7, 'suspect-shelf', 'sw', {
    dialogue: 'south-measure-cellar-suspect-cabinet'
  });
  wallBoard(b, 'charity-cellar-prayer-cards', 0, 9, 'prayer-cards', 'se');
  furniture(b, 'charity-cellar-burned-crate-labels', 'south-measure-worktable', 9, 11, 'burned-label', 'se', {
    dialogue: 'south-measure-cellar-burned-labels'
  });
  furniture(b, 'charity-cellar-work-table', 'south-measure-worktable', 12, 11, 'evidence-bench', 'se', {
    dialogue: 'south-measure-cellar-recruit-sheet'
  });
  furniture(b, 'charity-cellar-screened-patient-cot', 'charity-cot', 18, 6, undefined, 'se');
  b.inspect('charity-cellar-collapsed-grate', 'collapsed-culvert', 0, 3, { blocking: true, orient: 'se' });
  b.lootContainer({
    id: 'cellar-spoiled-relief-crate',
    name: 'Spoiled Relief Crate',
    kind: 'sealed-storage-crate',
    x: 5,
    y: 8,
    orient: 'se',
    log: 'Mildew took the top layer. A chalk cross marks the dry packets for field salvage.',
    loot: [
      { item: 'field-dressing', count: 1 },
      { item: 'tinned-beans', count: 1 }
    ]
  });
  b.groundItem('cellar-loose-field-dressing', 'field-dressing', 1, 4, 6);

  // Five wide open units form one continuous clean-medicine wall. A close
  // second shelf and trolley rank gives the reserve a compact aisle silhouette.
  for (const x of [6, 8, 12, 14]) {
    b.decorate('south-measure-storage', x, 3, { blocking: true, variant: 'clean-shelf', orient: x % 4 ? 'sw' : 'se' });
  }
  for (const [x, orient] of [[6, 'se'], [8, 'sw'], [12, 'se'], [14, 'sw']]) {
    b.decorate('south-measure-storage', x, 6, { blocking: true, variant: 'medicine-shelf', orient });
  }
  for (const [x, orient] of [[7, 'se'], [9, 'sw'], [13, 'se'], [15, 'sw']]) {
    b.decorate('south-measure-medicine-cart', x, 7, { blocking: true, orient });
  }
  b.add('south-measure-storage', 16, 11, { blocking: true, variant: 'medicine-shelf', orient: 'se' });
  b.add('south-measure-storage', 19, 11, { blocking: true, variant: 'medicine-shelf', orient: 'sw' });
  b.add('south-measure-medicine-cart', 16, 13, { blocking: true, orient: 'se' });

  // Low reserve stock closes the oversized south and side clearances while the
  // two-cell stair lane at x17/x18 remains untouched. Mixed shelf and trolley
  // heights keep the mass readable instead of becoming another solid wall.
  for (const [x, y, kind, orient] of [
    [2, 12, 'south-measure-storage', 'se'], [4, 12, 'south-measure-medicine-cart', 'sw'],
    [2, 14, 'south-measure-medicine-cart', 'se'], [4, 14, 'south-measure-storage', 'sw'],
    [7, 14, 'south-measure-storage', 'se'], [10, 14, 'south-measure-medicine-cart', 'sw'],
    [13, 14, 'south-measure-storage', 'se'], [15, 10, 'south-measure-storage', 'sw'],
    [15, 12, 'south-measure-medicine-cart', 'se'], [15, 14, 'south-measure-storage', 'sw']
  ]) {
    b.decorate(kind, x, y, {
      blocking: true,
      orient,
      ...(kind === 'south-measure-storage' ? { variant: 'medicine-shelf' } : {})
    });
  }

  // The suspect cabinet pair, spoiled crate, prayer cards, and scorched labels
  // form one controlled evidence pocket apart from the clean reserve.
  b.decorate('south-measure-storage', 3, 9, { blocking: true, variant: 'suspect-shelf', orient: 'se' });
  b.decorate('south-measure-wall-board', 0, 7, { blocking: true, variant: 'prayer-cards', wallPlane: 'se' });
  b.decorate('rusted-crate', 5, 6, { blocking: true, orient: 'sw' });
  b.decorate('utility-railing', 6, 8, { blocking: true, variant: 'service', orient: 'sw' });
  b.decorate('south-measure-medicine-cart', 5, 10, { blocking: true, orient: 'se' });
  b.decorate('paper-scraps', 4, 7);
  b.decorate('scorch-mark', 4, 9);

  // The oversized evidence surface, damaged containers, and tool rack form one
  // dominant investigation mass. Supporting clutter stays close to the bench.
  b.decorate('tool-rack', 7, 11, { blocking: true });
  b.decorate('sealed-storage-crate', 8, 13, { blocking: true, orient: 'se' });
  b.decorate('rusted-crate', 11, 13, { blocking: true, orient: 'sw' });
  b.decorate('low-stool', 6, 13, { blocking: true });
  b.decorate('low-stool', 14, 13, { blocking: true });
  for (const [x, y] of [[8, 10], [10, 12], [13, 10], [14, 12]]) b.decorate('paper-scraps', x, y);
  b.decorate('scorch-mark', 8, 12);
  b.decorate('scorch-mark', 13, 12);

  // Connected curtains make a complete patient niche with one open end.
  for (let x = 16; x <= 20; x += 1) {
    if (x === 18) continue;
    b.decorate('cloth-partition', x, 3, { blocking: true, variant: 'clinic', orient: 'se' });
  }
  for (const y of [4, 5, 6, 7, 8]) {
    b.decorate('cloth-partition', 16, y, { blocking: true, variant: 'clinic', orient: 'sw' });
  }
  b.decorate('south-measure-medicine-cart', 20, 8, { blocking: true, orient: 'se' });
  b.decorate('wash-wall', 20, 5, { blocking: true, orient: 'sw' });
  b.decorate('candle-cluster', 19, 4, { blocking: false });

  // A full five-tread flight, flanking rails, and worn landing make the east
  // threshold read as a cellar stair rather than an ordinary exterior door.
  b.decorate('stone-stairwell', 19, 13, { blocking: false, variant: 'cellar-flight', orient: 'se' });
  b.decorate('utility-railing', 20, 12, { blocking: false, variant: 'service', orient: 'se' });
  b.decorate('utility-railing', 20, 14, { blocking: false, variant: 'service', orient: 'se' });

  // Rubble narrows the low crawl to the collapsed grate without creating a
  // second exit. One open cell at the east end keeps the inspectable reachable.
  b.decorate('rubble-pile', 2, 2, { blocking: true });
  b.decorate('rubble-pile', 2, 4, { blocking: true });
  b.decorate('rubble-decal', 1, 3);
  b.decorate('rubble-decal', 3, 3);
  b.decorate('rubble-decal', 4, 2);
  b.decorate('rubble-decal', 4, 4);
  b.decorate('service-pipe-run', 0, 4, { blocking: false, variant: 'broken', wallPlane: 'se' });

  // Shelf-aisle wear forms a legible handling route from the stair to the
  // clean run, evidence bench, suspect stock, and screened cot.
  for (let y = 8; y <= 13; y += 1) {
    b.decorate('road-dust', 17, y);
    b.decorate('road-dust', 18, y);
  }
  for (let x = 5; x <= 19; x += 1) b.decorate('road-dust', x, 9);
  for (let y = 4; y <= 9; y += 1) b.decorate('road-dust', 10, y);
  for (let x = 9; x <= 18; x += 1) b.decorate('road-dust', x, 12);
  return b.finish(['south-measure-charity-trapdoor-cellar']);
}

const LEVELS = [
  makeUndercroft(), makeDrain(), makeAnnex(), makeFreight(), makeClinic(),
  makeHall(), makeVaro(), makeHiddenRows(), makeCellar()
];

const LEVEL_PATHS = Object.fromEntries(LEVELS.map(({ level }) => [level.id, `./data/levels/${level.id.replaceAll('-', '_')}.json`]));

const CONNECTORS = [
  surface('civil-stair', 'undercroft', 'south-measure-intake-undercroft', 'south-measure-civil-stair', point(29, 39), 'ne', point(64, 37), 'sw'),
  surface('collapsed-culvert', 'drain', 'south-measure-relief-drain', 'south-measure-collapsed-culvert', point(41, 15), 'nw', point(119, 73), 'nw'),
  surface('repair-trench', 'drain', 'south-measure-relief-drain', 'south-measure-morrow-trench', point(20, 2), 'sw', point(31, 55), 'sw'),
  surface('annex-service-hatch', 'drain', 'south-measure-relief-drain', 'south-measure-annex-service-hatch', point(2, 16), 'se', point(20, 25), 'sw'),
  surface('annex-main-door', 'annex', 'south-measure-relief-maintenance-annex', 'south-measure-annex-main-door', point(19, 23), 'ne', point(18, 27), 'sw'),
  surface('freight-main-door', 'freight', 'south-measure-morrow-freight-house', 'south-measure-freight-main-door', point(2, 13), 'se', point(30, 48), 'nw'),
  surface('freight-rear-door', 'freight', 'south-measure-morrow-freight-house', 'south-measure-freight-rear-door', point(29, 19), 'ne', point(37, 50), 'sw'),
  surface('clinic-main-door', 'clinic', 'south-measure-compact-clinic', 'south-measure-clinic-main-door', point(18, 21), 'ne', point(98, 34), 'sw'),
  surface('hall-main-door', 'hall', 'south-measure-measure-hall', 'south-measure-hall-main-door', point(17, 19), 'ne', point(94, 52), 'sw'),
  surface('varo-door', 'varo', 'south-measure-varo-house', 'south-measure-varo-main-door', point(2, 10), 'se', point(113, 48), 'nw'),
  surface('hidden-rows-drying-frame', 'rows', 'south-measure-hidden-rows', 'south-measure-hidden-wash-wall', point(2, 6), 'se', point(125, 58), 'se'),
  surface('hidden-rows-grave-passage', 'rows', 'south-measure-hidden-rows', 'south-measure-hidden-grave-door', point(24, 2), 'sw', point(112, 16), 'ne'),
  surface('charity-trapdoor', 'cellar', 'south-measure-charity-cellar', 'south-measure-charity-trapdoor', point(18, 13), 'nw', point(96, 72), 'se'),
  internal('drain-undercroft-valve', 'drain', 'south-measure-relief-drain', 'south-measure-drain-valve', point(12, 2), 'sw', 'undercroft', 'south-measure-intake-undercroft', 'south-measure-drain-valve', point(55, 15), 'nw'),
  internal('annex-drain-hatch', 'annex', 'south-measure-relief-maintenance-annex', 'south-measure-annex-drain-hatch', point(4, 19), 'se', 'drain', 'south-measure-relief-drain', 'south-measure-annex-drain-hatch', point(4, 13), 'sw')
];

function surface(connectorKey, side, levelId, copyKey, arrival, facing, surfaceArrival, surfaceFacing) {
  return {
    endpoints: [
      { id: `south-measure-${connectorKey}-surface`, copyLevel: levelId, copyKey, reverse: true, target: { path: LEVEL_PATHS[levelId], player: { ...arrival, facing } } },
      { id: `south-measure-${connectorKey}-${side}`, copyLevel: levelId, copyKey, reverse: false, target: { path: './data/levels/ash_road_south.json', player: { ...surfaceArrival, facing: surfaceFacing } } }
    ]
  };
}

function internal(connectorKey, sideA, levelA, copyA, arrivalA, facingA, sideB, levelB, copyB, arrivalB, facingB) {
  return {
    endpoints: [
      { id: `south-measure-${connectorKey}-${sideA}`, copyLevel: levelA, copyKey: copyA, reverse: false, target: { path: LEVEL_PATHS[levelB], player: { ...arrivalB, facing: facingB } } },
      { id: `south-measure-${connectorKey}-${sideB}`, copyLevel: levelB, copyKey: copyB, reverse: false, target: { path: LEVEL_PATHS[levelA], player: { ...arrivalA, facing: facingA } } }
    ]
  };
}

const CONNECTOR_ACCESS = Object.freeze({
  'south-measure-civil-stair-surface': {
    conditions: { flag: 'south-measure-civil-access' },
    routes: [
      { label: 'Work the civil lock', conditions: { fieldRatings: { security: 30 } }, setFlag: ['south-measure-civil-access', 'south-measure-entry-forced'], log: 'The old civil lock gives without breaking.' },
      { label: 'Use the Censure entry roll', conditions: { items: { 'censure-entry-roll': 1 } }, setFlag: ['south-measure-civil-access', 'south-measure-entry-forced'], log: 'The Censure tools lift the admission-office lock.' }
    ]
  },
  'south-measure-collapsed-culvert-surface': {
    conditions: { flag: 'drain-access-cleared' },
    routes: [
      { label: 'Brace the loose channel stones', conditions: { fieldRatings: { engineering: 30 } }, setFlag: 'drain-access-cleared', log: 'The culvert stones hold long enough to pass.' },
      { label: 'Find a body-wide path through the fall', conditions: { fieldRatings: { search: 30 } }, setFlag: 'drain-access-cleared', log: 'A dry seam leads through the collapsed culvert.' }
    ]
  },
  'south-measure-repair-trench-surface': {
    conditions: { flagsAtLeast: { count: 1, of: ['drain-access-cleared', 'morrow-freight-rear-access'] } },
    routes: [
      { label: 'Lower yourself past the broken shoring', conditions: { fieldRatings: { engineering: 30 } }, setFlag: 'drain-access-cleared', log: 'The trench shoring takes your weight.' }
    ]
  },
  'south-measure-annex-service-hatch-surface': {
    conditions: { flag: 'south-measure-annex-access' },
    routes: [
      { label: 'Lift the seized service latch', conditions: { fieldRatings: { engineering: 30 } }, setFlag: ['south-measure-annex-access', 'south-measure-annex-forced'], log: 'The service latch rises with a low metal complaint.' }
    ]
  },
  'south-measure-annex-main-door-surface': {
    conditions: { flag: 'south-measure-annex-access' },
    routes: [
      { label: 'Open the relief lock', conditions: { items: { 'censure-entry-roll': 1 } }, setFlag: ['south-measure-annex-access', 'south-measure-annex-forced'], log: 'The relief lock yields to the Censure tools.' }
    ]
  },
  'south-measure-freight-rear-door-surface': {
    conditions: { flag: 'morrow-freight-rear-access' },
    routes: [
      { label: 'Slip the bonded rear lock', conditions: { fieldRatings: { security: 35 } }, setFlag: ['morrow-freight-rear-access', 'morrow-rear-forced'], log: 'The bonded rear lock opens without its seal.' },
      { label: 'Use the Censure entry roll', conditions: { items: { 'censure-entry-roll': 1 } }, setFlag: ['morrow-freight-rear-access', 'morrow-rear-forced'], log: 'The Censure hooks draw the rear bolt.' }
    ]
  },
  'south-measure-hidden-rows-drying-frame-surface': {
    conditions: { flag: 'hidden-rows-access' },
    routes: [
      { label: 'Pass behind the wash cloth unseen', conditions: { fieldRatings: { stealth: 35 } }, setFlag: ['hidden-rows-access', 'hidden-rows-entry-forced'], log: 'The drying cloth settles before anyone turns.' },
      { label: 'Find the concealed door catch', conditions: { fieldRatings: { security: 35 } }, setFlag: ['hidden-rows-access', 'hidden-rows-entry-forced'], log: 'The concealed catch gives under one finger.' }
    ]
  },
  'south-measure-hidden-rows-grave-passage-surface': {
    conditions: { flag: 'hidden-rows-access' },
    routes: [
      { label: 'Follow the unmarked grave path', conditions: { fieldRatings: { search: 35 } }, setFlag: ['hidden-rows-access', 'hidden-rows-entry-forced'], log: 'The grave markers leave a narrow path to the hidden door.' },
      { label: 'Cross the strip without drawing notice', conditions: { fieldRatings: { stealth: 35 } }, setFlag: ['hidden-rows-access', 'hidden-rows-entry-forced'], log: 'No head turns before the hidden door closes.' }
    ]
  },
  'south-measure-charity-trapdoor-surface': {
    conditions: { flag: 'charity-cellar-access' },
    routes: [
      { label: 'Trace the stock route beneath the cots', conditions: { fieldRatings: { medicine: 30 } }, setFlag: 'charity-cellar-access', log: 'Dose marks lead to the charity trapdoor.' },
      { label: 'Find the cot-board key hollow', conditions: { fieldRatings: { search: 35 } }, setFlag: ['charity-cellar-access', 'charity-cellar-forced'], log: 'The cellar key rests behind the cot-side board.' }
    ]
  },
  'south-measure-drain-undercroft-valve-drain': {
    conditions: { flagsAtLeast: { count: 1, of: ['south-measure-civil-access', 'hidden-water-branch-known', 'drain-undercroft-open'] } },
    routes: [
      { label: 'Free the return valve', conditions: { fieldRatings: { engineering: 35 } }, setFlag: 'drain-undercroft-open', log: 'The return valve turns through a century of scale.' }
    ]
  },
  'south-measure-drain-undercroft-valve-undercroft': {
    conditions: { flagsAtLeast: { count: 1, of: ['south-measure-civil-access', 'hidden-water-branch-known', 'drain-undercroft-open'] } },
    routes: [
      { label: 'Free the return valve', conditions: { fieldRatings: { engineering: 35 } }, setFlag: 'drain-undercroft-open', log: 'The return valve opens toward the relief drain.' }
    ]
  },
  'south-measure-annex-drain-hatch-annex': {
    conditions: { flagsAtLeast: { count: 1, of: ['south-measure-annex-access', 'drain-access-cleared', 'annex-drain-open'] } },
    routes: [
      { label: 'Unseat the floor hatch', conditions: { fieldRatings: { engineering: 30 } }, setFlag: 'annex-drain-open', log: 'The floor hatch lifts clear of its warped frame.' }
    ]
  },
  'south-measure-annex-drain-hatch-drain': {
    conditions: { flagsAtLeast: { count: 1, of: ['south-measure-annex-access', 'drain-access-cleared', 'annex-drain-open'] } },
    routes: [
      { label: 'Release the hatch from below', conditions: { fieldRatings: { engineering: 30 } }, setFlag: 'annex-drain-open', log: 'The hatch rises into the annex floor.' }
    ]
  }
});

function connectorTravelEffects(endpoint, packet, reverse, extra = {}) {
  return {
    ...(extra.setFlag ? { setFlag: extra.setFlag } : {}),
    log: extra.log ?? (reverse ? packet.reverseTravelLog : packet.travelLog),
    loadLevel: endpoint.target
  };
}

function dialogue(endpoint) {
  const packet = COPY[endpoint.copyLevel].connectors[endpoint.copyKey];
  if (!packet) throw new Error(`${endpoint.id}: missing connector copy ${endpoint.copyKey}`);
  const reverse = endpoint.reverse;
  const access = CONNECTOR_ACCESS[endpoint.id];
  const travelChoice = {
    label: reverse ? packet.reverseTravelLabel : packet.travelLabel,
    ...(access?.conditions ? { conditions: access.conditions } : {}),
    effects: connectorTravelEffects(endpoint, packet, reverse),
    close: true
  };
  const routeChoices = (access?.routes ?? []).map((route) => ({
    label: route.label,
    conditions: route.conditions,
    effects: connectorTravelEffects(endpoint, packet, reverse, route),
    close: true,
    tone: route.tone ?? 'commit'
  }));
  return {
    id: endpoint.id,
    title: packet.title,
    nodes: {
      start: {
        lines: [reverse ? packet.reverseEntryLine : packet.entryLine],
        choices: [
          travelChoice,
          ...routeChoices,
          {
            label: reverse ? packet.reverseStayLabel : packet.stayLabel,
            effects: { log: reverse ? packet.reverseStayLog : packet.stayLog },
            close: true,
            tone: 'quiet'
          }
        ]
      }
    }
  };
}

function walkable(level, x, y, blocked) {
  if (x < 0 || y < 0 || x >= level.width || y >= level.height) return false;
  return level.legend[level.tiles[y][x]]?.walkable === true && !blocked.has(key(x, y));
}

function reachable(level) {
  const blocked = new Set(level.objects.filter((o) => o.blocking).map((o) => key(o.x, o.y)));
  const start = level.spawns.player;
  if (!walkable(level, start.x, start.y, blocked)) throw new Error(`${level.id}: player start is blocked`);
  const seen = new Set([key(start.x, start.y)]);
  const queue = [[start.x, start.y]];
  for (let i = 0; i < queue.length; i += 1) {
    const [x, y] = queue[i];
    for (const [dx, dy] of DIRS) {
      const nx = x + dx;
      const ny = y + dy;
      const k = key(nx, ny);
      if (!seen.has(k) && walkable(level, nx, ny, blocked)) {
        seen.add(k);
        queue.push([nx, ny]);
      }
    }
  }
  return { blocked, seen };
}

function attachInspectableMarkers(level, seen, blocked) {
  for (const object of level.objects) {
    if (!object.interact || object.interactionMarker) continue;
    const approach = DIRS
      .map(([dx, dy]) => point(object.x + dx, object.y + dy))
      .find((p) => seen.has(key(p.x, p.y)) && walkable(level, p.x, p.y, blocked));
    if (!approach) throw new Error(`${level.id}: ${object.id} has no reachable cardinal approach`);
    object.interactionMarker = approach;
  }
}

function assertLevel(entry) {
  const { level, connectorChecks } = entry;
  if (level.tiles.length !== level.height || level.tiles.some((row) => row.length !== level.width)) throw new Error(`${level.id}: tile dimensions changed`);
  const objectCells = new Map();
  const lootContainers = [];
  for (const object of level.objects) {
    if (object.x < 0 || object.y < 0 || object.x >= level.width || object.y >= level.height) throw new Error(`${level.id}: out-of-bounds object ${object.id ?? object.kind}`);
    const k = key(object.x, object.y);
    if (objectCells.has(k)) throw new Error(`${level.id}: object overlap at ${k}: ${objectCells.get(k)} and ${object.id ?? object.kind}`);
    objectCells.set(k, object.id ?? object.kind);
    if (object.interact?.type !== 'container') {
      if (object.interact?.loot !== undefined) throw new Error(`${level.id}: ${object.id ?? object.kind} has loot without a container interaction`);
      continue;
    }
    lootContainers.push(object);
    if (!object.id || !object.name) throw new Error(`${level.id}: loot container at ${k} needs an id and name`);
    if (!object.blocking) throw new Error(`${level.id}: loot container ${object.id} must block its occupied cell`);
    if (!OPENED_STATE_CONTAINER_KINDS.has(object.kind)) throw new Error(`${level.id}: ${object.id} lacks opened-state container art`);
    if (typeof object.interact.log !== 'string' || !object.interact.log.trim()) throw new Error(`${level.id}: ${object.id} needs a container log`);
    if (!Array.isArray(object.interact.loot) || object.interact.loot.length === 0) throw new Error(`${level.id}: ${object.id} has no loot`);
    for (const loot of object.interact.loot) {
      if (!SOUTH_MEASURE_LOOT_ITEMS.has(loot.item)) throw new Error(`${level.id}: ${object.id} uses unsupported loot ${loot.item}`);
      if (!Number.isInteger(loot.count) || loot.count < 1) throw new Error(`${level.id}: ${object.id} has an invalid ${loot.item} count`);
    }
  }
  if (lootContainers.length === 0) throw new Error(`${level.id}: helper map needs a contextual loot container`);
  if (!Array.isArray(level.groundItems) || level.groundItems.length === 0) throw new Error(`${level.id}: helper map needs a ground item`);
  const { blocked, seen } = reachable(level);
  const actorCells = new Map();
  for (const spawn of [...level.spawns.npcs, ...level.spawns.enemies]) {
    const spawnKey = key(spawn.x, spawn.y);
    if (!seen.has(spawnKey) || blocked.has(spawnKey)) {
      throw new Error(`${level.id}: actor ${spawn.actor ?? spawn.id} is not on reachable open floor at ${spawnKey}`);
    }
    const previous = actorCells.get(spawnKey);
    if (previous && previous.characterSlot !== spawn.characterSlot) {
      throw new Error(`${level.id}: actor overlap at ${spawnKey}`);
    }
    actorCells.set(spawnKey, spawn);
  }
  const groundItemCells = new Set();
  for (const groundItem of level.groundItems) {
    const groundKey = key(groundItem.x, groundItem.y);
    if (typeof groundItem.id !== 'string' || !groundItem.id.trim()) throw new Error(`${level.id}: ground item ${groundItem.item} needs a stable id`);
    if (!SOUTH_MEASURE_LOOT_ITEMS.has(groundItem.item)) throw new Error(`${level.id}: unsupported ground item ${groundItem.item}`);
    if (!Number.isInteger(groundItem.count) || groundItem.count < 1) throw new Error(`${level.id}: invalid ${groundItem.item} ground count`);
    if (!seen.has(groundKey) || blocked.has(groundKey)) throw new Error(`${level.id}: ground item ${groundItem.item} is not on reachable open floor at ${groundKey}`);
    if (objectCells.has(groundKey)) throw new Error(`${level.id}: ground item ${groundItem.item} overlaps ${objectCells.get(groundKey)} at ${groundKey}`);
    if (actorCells.has(groundKey) || groundKey === key(level.spawns.player.x, level.spawns.player.y)) throw new Error(`${level.id}: ground item ${groundItem.item} overlaps an actor at ${groundKey}`);
    if (groundItemCells.has(groundKey)) throw new Error(`${level.id}: ground items overlap at ${groundKey}`);
    groundItemCells.add(groundKey);
  }
  attachInspectableMarkers(level, seen, blocked);
  for (const connector of connectorChecks) {
    const marker = connector.marker;
    if (!seen.has(key(marker.x, marker.y))) throw new Error(`${level.id}: unreachable connector marker ${connector.objectId}`);
    const inward = DIRS.filter(([dx, dy]) => seen.has(key(marker.x + dx, marker.y + dy))).length;
    if (inward < 2) throw new Error(`${level.id}: connector approach is narrower than two cells at ${connector.objectId}`);
  }
  for (const object of level.objects.filter((o) => o.interact)) {
    const marker = object.interactionMarker;
    if (!marker || !seen.has(key(marker.x, marker.y))) throw new Error(`${level.id}: unreachable interaction marker ${object.id}`);
  }
  for (const forbidden of ['return-passage', 'waiting-alcove', 'burned-rear-bay', 'collapsed-grate']) {
    const object = level.objects.find((o) => o.id?.includes(forbidden));
    if (object?.interact?.dialogue || object?.interact?.type === 'secret-exit') throw new Error(`${level.id}: ${forbidden} must remain a non-exit`);
  }
}

function assertText(value, path = 'root') {
  if (typeof value === 'string') {
    if (value.includes('—') || value.includes('--')) throw new Error(`${path}: banned dash in player-facing copy`);
    return;
  }
  if (Array.isArray(value)) value.forEach((entry, i) => assertText(entry, `${path}[${i}]`));
  else if (value && typeof value === 'object') Object.entries(value).forEach(([k, v]) => assertText(v, `${path}.${k}`));
}

for (const entry of LEVELS) assertLevel(entry);
const groundItemIds = new Set();
for (const { level } of LEVELS) {
  for (const groundItem of level.groundItems) {
    if (groundItemIds.has(groundItem.id)) throw new Error(`Duplicate South Measure ground item id ${groundItem.id}`);
    groundItemIds.add(groundItem.id);
  }
}
const DIALOGUES = CONNECTORS.flatMap((connector) => connector.endpoints.map(dialogue));
const dialogueIds = new Set([
  ...DIALOGUES.map((entry) => entry.id),
  ...SOUTH_MEASURE_CHARACTER_DIALOGUE_IDS,
  ...SOUTH_MEASURE_OBJECT_DIALOGUE_IDS
]);
if (new Set(DIALOGUES.map((entry) => entry.id)).size !== DIALOGUES.length) throw new Error('Duplicate generated connector dialogue id');
for (const { level } of LEVELS) {
  for (const id of level.dialogue) if (!dialogueIds.has(id)) throw new Error(`${level.id}: missing generated dialogue ${id}`);
  assertText({
    name: level.name,
    intro: level.intro,
    objects: level.objects,
    spawns: level.spawns,
    combatIntro: level.combatIntro,
    victoryLog: level.victoryLog
  }, level.id);
}
for (const scene of DIALOGUES) assertText(scene, scene.id);

const levelsByPath = new Map(LEVELS.map(({ level }) => [LEVEL_PATHS[level.id], level]));
levelsByPath.set('./data/levels/ash_road_south.json', JSON.parse(await readFile(resolve(LEVEL_DIR, 'ash_road_south.json'), 'utf8')));
const inwardFacingVectors = {
  ne: point(0, -1),
  se: point(1, 0),
  sw: point(0, 1),
  nw: point(-1, 0)
};
for (const connector of CONNECTORS) {
  const [first, reciprocal] = connector.endpoints;
  for (const [endpoint, destinationEndpoint] of [[first, reciprocal], [reciprocal, first]]) {
    const targetLevel = levelsByPath.get(endpoint.target.path);
    const targetGate = targetLevel?.objects.find((object) => object.interact?.dialogue === destinationEndpoint.id);
    if (!targetGate) throw new Error(`${endpoint.id}: reciprocal destination gate ${destinationEndpoint.id} is missing`);
    const dx = endpoint.target.player.x - targetGate.x;
    const dy = endpoint.target.player.y - targetGate.y;
    if (dx === 0 && dy === 0) continue;
    const inward = inwardFacingVectors[endpoint.target.player.facing];
    if (!inward || (dx * inward.x) + (dy * inward.y) <= 0 || (dx * inward.y) - (dy * inward.x) !== 0) {
      throw new Error(`${endpoint.id}: arrival must face away from ${destinationEndpoint.id} and into the destination map`);
    }
  }
}
for (const scene of DIALOGUES) {
  const target = scene.nodes.start.choices.find((choice) => choice.effects?.loadLevel)?.effects.loadLevel;
  if (!target) throw new Error(`${scene.id}: connector dialogue has no travel choice`);
  const level = levelsByPath.get(target.path);
  if (!level) throw new Error(`${scene.id}: target level is not available for validation`);
  const blocked = new Set(level.objects.filter((object) => object.blocking).map((object) => key(object.x, object.y)));
  const { x, y, facing } = target.player;
  if (!walkable(level, x, y, blocked)) throw new Error(`${scene.id}: target arrival ${x},${y} is blocked`);
  if (!reachable(level).seen.has(key(x, y))) throw new Error(`${scene.id}: target arrival ${x},${y} is disconnected`);
  if (!['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'].includes(facing)) throw new Error(`${scene.id}: invalid arrival facing ${facing}`);
  const clearNeighbors = DIRS.filter(([dx, dy]) => walkable(level, x + dx, y + dy, blocked)).length;
  if (clearNeighbors < 2) throw new Error(`${scene.id}: target arrival ${x},${y} lacks a two-cell route`);
}

await mkdir(LEVEL_DIR, { recursive: true });
await mkdir(DIALOGUE_DIR, { recursive: true });
for (const { level } of LEVELS) {
  const path = resolve(LEVEL_DIR, `${level.id.replaceAll('-', '_')}.json`);
  await writeFile(path, `${JSON.stringify(level, null, 2)}\n`);
}
for (const scene of DIALOGUES) {
  await writeFile(resolve(DIALOGUE_DIR, `${scene.id}.json`), `${JSON.stringify(scene, null, 2)}\n`);
}

console.log(`Generated ${LEVELS.length} South Measure submaps and ${DIALOGUES.length} connector dialogues.`);
