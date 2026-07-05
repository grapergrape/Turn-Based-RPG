import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const outputPath = join(root, 'data', 'levels', 'censure_road_camp.json');

const WIDTH = 70;
const HEIGHT = 50;
const START = { x: 34, y: 46 };
const CAMP = { x0: 7, x1: 66, y0: 5, y1: 47 };
const SOUTH_GATE = { x0: 31, x1: 37, y: 47 };
const EAST_GATE = { x: 66, y0: 14, y1: 18 };
const TENT_TILE = 'C';
const WALKABLE_FLOOR_TILES = new Set(['.', 'r', 's', 'm', 'g', 'p']);
const PAINTABLE_CAMP_FLOOR_TILES = new Set(['.', 'm', 'g', 'p']);
const ROAD = [
  { x: 34, y: 49 },
  { x: 34, y: 43 },
  { x: 38, y: 35 },
  { x: 47, y: 27 },
  { x: 58, y: 18 },
  { x: 69, y: 16 }
];
const CAMP_DIALOGUES = [
  'censure-road-camp-long-ash-road-exit',
  'censure-road-camp-hallowfen-gate',
  'censure-road-odran-watch',
  'censure-road-camp-odran',
  'censure-road-camp-voss',
  'censure-road-camp-runa',
  'censure-road-camp-maev',
  'censure-road-camp-caldus',
  'censure-road-camp-sera',
  'censure-road-camp-pell',
  'censure-road-camp-ivarn',
  'censure-road-camp-hanne',
  'censure-road-camp-joric',
  'censure-road-camp-malco',
  'censure-road-camp-elian',
  'censure-road-camp-widow-bruna'
];
const NPCS = [
  {
    actor: 'censure-father-odran',
    x: 20,
    y: 18,
    facing: 'se',
    dialogue: 'censure-road-camp-odran',
    ambient: ['Confession after bell check. God can wait ten breaths. The road cannot.'],
    mapMarker: { label: 'Father Odran', kind: 'dialogue', reveal: 'always' }
  },
  {
    actor: 'censure-preceptor-voss',
    x: 46,
    y: 13,
    facing: 'sw',
    dialogue: 'censure-road-camp-voss',
    ambient: ['If that slate falls in the mud, nobody is eating until I can read it.'],
    mapMarker: { label: 'Preceptor Voss', kind: 'dialogue', reveal: 'always' }
  },
  {
    actor: 'censure-quartermaster-runa',
    x: 29,
    y: 31,
    facing: 'se',
    dialogue: 'censure-road-camp-runa',
    ambient: ['No seal, no ration. A sad face is not a seal.'],
    mapMarker: { label: 'Quartermaster Runa', kind: 'dialogue', reveal: 'always' }
  },
  {
    actor: 'censure-sutler-maev',
    x: 51,
    y: 37,
    facing: 'sw',
    dialogue: 'censure-road-camp-maev',
    ambient: ['Road prices are fair prices, if you ask the road.'],
    mapMarker: { label: 'Sutler Maev', kind: 'dialogue', reveal: 'always' }
  },
  {
    actor: 'censure-brother-caldus',
    x: 45,
    y: 25,
    facing: 'se',
    dialogue: 'censure-road-camp-caldus',
    ambient: ['Again. A cultist will not wait while you remember where your elbow lives.'],
    mapMarker: { label: 'Brother Caldus', kind: 'dialogue', reveal: 'explored' }
  },
  {
    actor: 'censure-bell-clerk-sera',
    x: 32,
    y: 18,
    facing: 'sw',
    dialogue: 'censure-road-camp-sera',
    ambient: ['One wrong peal sends a squad to the latrines. Ask me how I learned.'],
    mapMarker: { label: 'Bell Clerk Sera', kind: 'dialogue', reveal: 'explored' }
  },
  {
    actor: 'censure-writ-runner-pell',
    x: 14,
    y: 26,
    facing: 'se',
    dialogue: 'censure-road-camp-pell',
    ambient: ['If the board says missing, it means late. If it says late, it means dead.'],
    mapMarker: { label: 'Writ Runner Pell', kind: 'dialogue', reveal: 'explored' }
  },
  {
    actor: 'censure-novice-ivarn',
    x: 50,
    y: 25,
    facing: 'sw',
    dialogue: 'censure-road-camp-ivarn',
    ambient: ['I am not afraid. I am conserving bravery for paid work.'],
    mapMarker: { label: 'Novice Ivarn', kind: 'dialogue', reveal: 'explored' }
  },
  {
    actor: 'censure-sister-hanne',
    x: 60,
    y: 45,
    facing: 'nw',
    dialogue: 'censure-road-camp-hanne',
    ambient: ['If you bleed on the tent flap, wipe it before you faint.'],
    mapMarker: { label: 'Sister Hanne', kind: 'dialogue', reveal: 'explored' }
  },
  {
    actor: 'censure-ash-porter-joric',
    x: 44,
    y: 36,
    facing: 'se',
    dialogue: 'censure-road-camp-joric',
    ambient: ['A crate gets a destination. A porter gets a shrug. I envy crates.'],
    mapMarker: { label: 'Ash Porter Joric', kind: 'dialogue', reveal: 'explored' }
  },
  {
    actor: 'censure-evidence-keeper-malco',
    x: 55,
    y: 42,
    facing: 'nw',
    dialogue: 'censure-road-camp-malco',
    ambient: ['Do not touch the bags. One of them already hummed at me.'],
    mapMarker: { label: 'Evidence Keeper Malco', kind: 'dialogue', reveal: 'explored' }
  },
  {
    actor: 'censure-tether-guard-elian',
    x: 31,
    y: 44,
    facing: 'se',
    dialogue: 'censure-road-camp-elian',
    ambient: ['Tether line is empty. The goats filed a complaint and escaped.'],
    mapMarker: { label: 'Tether Guard Elian', kind: 'dialogue', reveal: 'explored' }
  },
  {
    actor: 'censure-widow-bruna',
    x: 56,
    y: 46,
    facing: 'nw',
    dialogue: 'censure-road-camp-widow-bruna',
    ambient: ['I wash camp linen. I do not wash camp stories.'],
    mapMarker: { label: 'Widow Bruna', kind: 'dialogue', reveal: 'explored' }
  }
];

const tiles = Array.from({ length: HEIGHT }, (_, y) =>
  Array.from({ length: WIDTH }, (_, x) => undergrowthChar(x, y))
);
const objects = [];
const levelTransitions = [];
const reserved = new Set();

function key(x, y) {
  return `${x},${y}`;
}

function inBounds(x, y) {
  return x >= 0 && y >= 0 && x < WIDTH && y < HEIGHT;
}

function hash(x, y, salt = 0) {
  let h = (Math.imul(x + salt * 17, 374761393) + Math.imul(y + 97, 668265263)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return (h ^ (h >>> 16)) >>> 0;
}

function undergrowthChar(x, y) {
  const roll = hash(x, y, 1) % 100;
  if (roll < 44) return 'u';
  if (roll < 72) return 'v';
  if (roll < 90) return 'l';
  return 't';
}

function setTile(x, y, char) {
  if (inBounds(x, y)) tiles[y][x] = char;
}

function getTile(x, y) {
  return inBounds(x, y) ? tiles[y][x] : null;
}

function paintRect(x0, y0, x1, y1, char) {
  for (let y = y0; y <= y1; y += 1) {
    for (let x = x0; x <= x1; x += 1) setTile(x, y, char);
  }
}

function paintOpenRect(x0, y0, x1, y1, char, allowed = PAINTABLE_CAMP_FLOOR_TILES) {
  for (let y = y0; y <= y1; y += 1) {
    for (let x = x0; x <= x1; x += 1) {
      if (!allowed.has(getTile(x, y))) continue;
      setTile(x, y, char);
    }
  }
}

function distToSegment(px, py, a, b) {
  const vx = b.x - a.x;
  const vy = b.y - a.y;
  const wx = px - a.x;
  const wy = py - a.y;
  const len2 = vx * vx + vy * vy;
  const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, (wx * vx + wy * vy) / len2));
  const qx = a.x + t * vx;
  const qy = a.y + t * vy;
  return Math.hypot(px - qx, py - qy);
}

function roadDistance(x, y) {
  let best = Number.POSITIVE_INFINITY;
  for (let i = 0; i < ROAD.length - 1; i += 1) {
    best = Math.min(best, distToSegment(x, y, ROAD[i], ROAD[i + 1]));
  }
  return best;
}

function addObject(kind, x, y, extra = {}) {
  if (!inBounds(x, y)) return null;
  const object = { kind, x, y, ...extra };
  if (!object.id) object.id = `${kind}-${objects.length + 1}`;
  objects.push(object);
  if (object.blocking) reserved.add(key(x, y));
  return object;
}

function hasObjectAt(x, y) {
  return objects.some((object) => object.x === x && object.y === y);
}

function canPlace(x, y) {
  if (!inBounds(x, y)) return false;
  if (reserved.has(key(x, y)) || hasObjectAt(x, y)) return false;
  const tile = getTile(x, y);
  return WALKABLE_FLOOR_TILES.has(tile);
}

function paintTentFootprint(x0, y0, x1, y1) {
  paintRect(x0, y0, x1, y1, TENT_TILE);
}

function clickArea(x0, y0, x1, y1) {
  return { x0, y0, x1, y1 };
}

function addLevelTransition(id, x, y, path, player, extra = {}) {
  const transition = {
    id,
    x,
    y,
    loadLevel: {
      path,
      player
    }
  };
  if (Array.isArray(extra.clickAreas) && extra.clickAreas.length > 0) {
    transition.clickAreas = extra.clickAreas.map((area) => ({
      x0: area.x0,
      y0: area.y0,
      x1: area.x1,
      y1: area.y1
    }));
  }
  levelTransitions.push(transition);
}

function addTentFlap(id, name, x, y, transition, extra = {}) {
  const approach = transition?.approach ?? { x, y: y + 1 };
  if (transition?.path) {
    addLevelTransition(`${id}-transition`, approach.x, approach.y, transition.path, transition.player ?? { x: 6, y: 7 }, {
      clickAreas: transition.clickAreas
    });
  }
  return addObject('canvas-tent-flap', x, y, {
    id,
    name,
    wallPlane: extra.wallPlane ?? 'sw',
    seed: hash(x, y, extra.salt ?? 57),
    ...(extra.mapMarker ? { mapMarker: extra.mapMarker } : {})
  });
}

function paintRoads() {
  for (let y = 0; y < HEIGHT; y += 1) {
    for (let x = 0; x < WIDTH; x += 1) {
      const d = roadDistance(x, y);
      if (d <= 4.15) setTile(x, y, 's');
      if (d <= 2.15) setTile(x, y, 'r');
    }
  }
}

function paintCamp() {
  paintRect(CAMP.x0, CAMP.y0, CAMP.x1, CAMP.y1, '.');
  for (let y = CAMP.y0; y <= CAMP.y1; y += 1) {
    for (let x = CAMP.x0; x <= CAMP.x1; x += 1) {
      if (x < 10 && y < 9) setTile(x, y, undergrowthChar(x, y));
      if (x > 63 && y < 9) setTile(x, y, undergrowthChar(x, y));
      if (x < 9 && y > 43) setTile(x, y, undergrowthChar(x, y));
    }
  }
}

function isSouthGate(x, y) {
  return y === SOUTH_GATE.y && x >= SOUTH_GATE.x0 && x <= SOUTH_GATE.x1;
}

function isEastGate(x, y) {
  return x === EAST_GATE.x && y >= EAST_GATE.y0 && y <= EAST_GATE.y1;
}

function placePerimeter() {
  for (let x = CAMP.x0; x <= CAMP.x1; x += 1) {
    if (!isSouthGate(x, CAMP.y0)) {
      addObject('farm-fence', x, CAMP.y0, { blocking: true, orient: 'se', seed: hash(x, CAMP.y0, 11) });
    }
    if (!isSouthGate(x, CAMP.y1)) {
      addObject('farm-fence', x, CAMP.y1, { blocking: true, orient: 'se', seed: hash(x, CAMP.y1, 13) });
    }
  }
  for (let y = CAMP.y0 + 1; y <= CAMP.y1 - 1; y += 1) {
    addObject('farm-fence', CAMP.x0, y, { blocking: true, orient: 'sw', seed: hash(CAMP.x0, y, 17) });
    if (!isEastGate(CAMP.x1, y)) {
      addObject('farm-fence', CAMP.x1, y, { blocking: true, orient: 'sw', seed: hash(CAMP.x1, y, 19) });
    }
  }
}

function placeRoadGates() {
  addObject('quarantine-barricade', 30, 44, {
    id: 'censure-road-south-gate-west-post',
    blocking: true,
    seed: hash(30, 44, 23)
  });
  addObject('quarantine-barricade', 38, 44, {
    id: 'censure-road-south-gate-east-post',
    blocking: true,
    seed: hash(38, 44, 23)
  });
  addObject('road-sign-post', 34, 48, {
    id: 'censure-road-long-ash-gate',
    name: 'Long Ash Road Gate',
    seed: hash(34, 48, 29),
    interact: {
      type: 'secret-exit',
      dialogue: 'censure-road-camp-long-ash-road-exit',
      log: 'The south road drops back toward the long ash fields and the chapel breach.'
    },
    mapMarker: { label: 'Long Ash Road', kind: 'exit', reveal: 'always' }
  });
  for (const y of [15, 16, 17]) {
    addObject('quarantine-barricade', 67, y, {
      id: `censure-road-hallowfen-gate-${y}`,
      blocking: true,
      seed: hash(67, y, 31),
      ...(y === 16 ? {
        name: 'Hallowfen Checkpoint Gate',
        interact: {
          type: 'note',
          dialogue: 'censure-road-camp-hallowfen-gate',
          log: 'The east road is chained until Preceptor Voss signs the marching slate.'
        },
        mapMarker: { label: 'Hallowfen Checkpoints', kind: 'exit', reveal: 'always' }
      } : {})
    });
  }
}

function placeWritChapel() {
  paintTentFootprint(14, 14, 17, 18);
  addTentFlap(
    'censure-road-odran-private-tent-flap',
    "Father Odran's Tent",
    16,
    18,
    {
      path: './data/levels/censure_road_odran_tent_interior.json',
      approach: { x: 16, y: 19 },
      player: { x: 8, y: 7 },
      clickAreas: [clickArea(14, 14, 17, 18)]
    },
    {
      salt: 35,
      mapMarker: { label: "Father Odran's Tent", kind: 'exit', reveal: 'explored' }
    }
  );

  paintTentFootprint(20, 12, 26, 16);
  addTentFlap(
    'censure-road-writ-chapel-flap',
    'Writ Chapel',
    23,
    16,
    {
      path: './data/levels/censure_road_writ_chapel_tent.json',
      approach: { x: 23, y: 17 },
      clickAreas: [clickArea(20, 12, 26, 16)]
    },
    {
      salt: 37,
      mapMarker: { label: 'Writ Chapel', kind: 'exit', reveal: 'always' }
    }
  );
  addObject('chapel-banner', 19, 17, { id: 'censure-road-chapel-banner', blocking: true, seed: hash(19, 17, 39) });
  addObject('prayer-lectern', 21, 18, {
    id: 'censure-road-writ-lectern',
    blocking: true,
    name: 'Writ Lectern',
    seed: hash(21, 18, 41),
    interact: {
      type: 'note',
      log: 'Fresh writ copies are stacked by route: chapel, road camp, Hallowfen wall. The last stack is still tied.'
    }
  });
  addObject('chapel-font', 18, 18, { id: 'censure-road-chapel-font', blocking: true, seed: hash(18, 18, 43) });
  addObject('candle-cluster', 22, 18, { id: 'censure-road-chapel-candles', seed: hash(22, 18, 45) });
  addObject('chapel-banner', 25, 18, {
    id: 'censure-road-confession-screen',
    blocking: true,
    name: 'Confession Screen',
    seed: hash(25, 18, 47),
    interact: {
      type: 'note',
      dialogue: 'censure-road-odran-watch',
      log: 'The screen is canvas over a spare fence frame. Someone scratched a price table into the wood and then crossed it out.'
    },
    mapMarker: { label: 'Confession Screen', kind: 'note', reveal: 'always' }
  });
}

function placeBellMast() {
  addObject('broken-bell', 32, 16, {
    id: 'censure-road-bell-mast',
    blocking: true,
    name: 'Bell Mast',
    seed: hash(32, 16, 53),
    interact: {
      type: 'note',
      log: 'The camp bell hangs from a patched road mast. Each peal marks one route, one alarm, or one body count.'
    },
    mapMarker: { label: 'Bell Mast', kind: 'note', reveal: 'always' }
  });
  addObject('bell-rope', 33, 17, {
    id: 'censure-road-bell-rope',
    seed: hash(33, 17, 55)
  });
}

function placePreceptorTent() {
  paintTentFootprint(43, 8, 49, 12);
  addTentFlap(
    'censure-road-preceptor-tent-flap',
    'Preceptor Tent',
    46,
    12,
    {
      path: './data/levels/censure_road_preceptor_tent.json',
      approach: { x: 47, y: 13 },
      clickAreas: [clickArea(43, 8, 49, 12)]
    },
    {
      salt: 61,
      mapMarker: { label: 'Preceptor Tent', kind: 'exit', reveal: 'always' }
    }
  );
  addObject('settlement-table', 50, 13, { id: 'censure-road-preceptor-table', blocking: true, seed: hash(50, 13, 63) });
  addObject('paper-scraps', 48, 13, { id: 'censure-road-preceptor-slate-scraps', seed: hash(48, 13, 65) });
  addObject('rusted-crate', 42, 13, { id: 'censure-road-preceptor-crate', blocking: true, seed: hash(42, 13, 67) });
}

function placeDrillYard() {
  for (const cell of [
    [42, 22], [47, 22], [52, 22], [57, 22], [62, 22], [42, 28], [47, 29], [52, 28], [57, 29], [62, 29]
  ]) {
    addObject('quarantine-barricade', cell[0], cell[1], {
      blocking: true,
      seed: hash(cell[0], cell[1], 71)
    });
  }
  for (const [x, y, orient] of [
    [44, 23, 'se'],
    [50, 23, 'se'],
    [55, 23, 'se'],
    [60, 23, 'se'],
    [43, 27, 'sw'],
    [51, 27, 'sw'],
    [56, 28, 'sw'],
    [61, 28, 'sw'],
    [46, 29, 'se'],
    [49, 29, 'se']
  ]) {
    addObject('farm-fence', x, y, {
      id: `censure-road-drill-yard-rope-${x}-${y}`,
      orient,
      seed: hash(x, y, 72)
    });
  }
  addObject('chalk-drawing', 47, 25, { id: 'censure-road-drill-yard-chalk', seed: hash(47, 25, 73) });
  for (const [x, y] of [
    [45, 24],
    [49, 27],
    [48, 25],
    [41, 26],
    [54, 27]
  ]) {
    addObject('chalk-drawing', x, y, {
      id: `censure-road-drill-yard-chalk-${x}-${y}`,
      seed: hash(x, y, 74)
    });
  }
  for (const [x, y] of [
    [40, 24], [41, 25], [42, 26], [43, 24], [44, 26], [45, 27],
    [48, 24], [49, 25], [50, 26], [51, 24], [52, 25], [53, 26],
    [54, 24], [55, 25], [56, 26], [57, 27], [58, 24], [59, 25], [60, 26], [61, 27]
  ]) {
    addObject('trampled-mud', x, y, {
      id: `censure-road-training-mud-${x}-${y}`,
      seed: hash(x, y, 79)
    });
  }
  for (const [x, y] of [
    [41, 24], [42, 25], [44, 24], [44, 27], [46, 26], [47, 27]
  ]) {
    addObject('practice-scars', x, y, {
      id: `censure-road-sword-yard-scars-${x}-${y}`,
      seed: hash(x, y, 80)
    });
  }
  for (const [x, y, orient, label] of [
    [41, 25, 'se', 'west'],
    [44, 27, 'sw', 'east']
  ]) {
    addObject('training-dummy', x, y, {
      id: `censure-road-sword-yard-dummy-${label}`,
      blocking: true,
      orient,
      name: 'Sword Dummy',
      seed: hash(x, y, 81),
      ...(label === 'west' ? {
        interact: {
          type: 'note',
          log: 'The practice dummy is wrapped in old Censure cloth. Blade cuts have opened the straw along one shoulder.'
        },
        mapMarker: { label: 'Sword Yard', kind: 'note', reveal: 'explored' }
      } : {})
    });
  }
  addObject('tool-rack', 43, 25, { id: 'censure-road-drill-yard-rack', blocking: true, seed: hash(43, 25, 75) });
  addObject('tool-rack', 53, 24, { id: 'censure-road-drill-yard-east-rack', blocking: true, seed: hash(53, 24, 76) });
  addObject('field-harrow', 51, 26, { id: 'censure-road-drill-yard-harrow', blocking: true, orient: 'sw', seed: hash(51, 26, 77) });
  addObject('field-satchel', 48, 28, { id: 'censure-road-drill-yard-satchel', blocking: true, seed: hash(48, 28, 78) });
  for (const [x, y, orient, label] of [
    [57, 24, 'sw', 'left'],
    [59, 25, 'sw', 'center'],
    [61, 26, 'sw', 'right']
  ]) {
    addObject('devil-target', x, y, {
      id: `censure-road-shooting-range-target-${label}`,
      blocking: true,
      orient,
      name: 'Devil Target',
      seed: hash(x, y, 82),
      ...(label === 'center' ? {
        interact: {
          type: 'note',
          log: 'A horned devil is painted in tar and red chalk. Every shot has gone high.'
        },
        mapMarker: { label: 'Shooting Range', kind: 'note', reveal: 'explored' }
      } : {})
    });
  }
  for (const [x, y] of [
    [53, 27], [54, 28], [55, 27], [56, 27], [57, 28], [58, 27]
  ]) {
    addObject('spent-casings', x, y, {
      id: `censure-road-shooting-range-casings-${x}-${y}`,
      seed: hash(x, y, 84)
    });
  }
}

function placeQuartermaster() {
  paintTentFootprint(24, 25, 32, 29);
  addTentFlap(
    'censure-road-quartermaster-tent-flap',
    'Quartermaster Tent',
    28,
    29,
    {
      path: './data/levels/censure_road_quartermaster_tent.json',
      approach: { x: 28, y: 30 },
      clickAreas: [clickArea(24, 25, 32, 29)]
    },
    {
      salt: 81,
      mapMarker: { label: 'Quartermaster Tent', kind: 'exit', reveal: 'always' }
    }
  );
  addObject('settlement-table', 28, 31, {
    id: 'censure-road-quartermaster-table',
    blocking: true,
    name: 'Quartermaster Table',
    seed: hash(28, 29, 81),
    interact: {
      type: 'note',
      log: 'Runa has split the ledger into issue, debt, and excuses. Excuses has the longest column.'
    },
    mapMarker: { label: 'Quartermaster', kind: 'dialogue', reveal: 'always' }
  });
  for (const [x, y, kind] of [
    [25, 30, 'sealed-storage-crate'],
    [26, 32, 'rusted-crate'],
    [31, 30, 'sealed-storage-crate'],
    [32, 32, 'rusted-barrel'],
    [23, 31, 'field-satchel'],
    [33, 30, 'sealed-storage-crate']
  ]) {
    addObject(kind, x, y, {
      id: `censure-road-quartermaster-${kind}-${x}-${y}`,
      blocking: true,
      seed: hash(x, y, 83)
    });
  }
}

function placeSupplyAndTrader() {
  paintTentFootprint(35, 31, 38, 35);
  paintTentFootprint(40, 31, 43, 35);
  addTentFlap(
    'censure-road-supply-tent-flap',
    'Supply Tent',
    38,
    35,
    {
      path: './data/levels/censure_road_supply_tent.json',
      approach: { x: 39, y: 36 },
      player: { x: 9, y: 7 },
      clickAreas: [clickArea(35, 31, 38, 35), clickArea(40, 31, 43, 35)]
    },
    {
      salt: 89,
      mapMarker: { label: 'Supply Tent', kind: 'exit', reveal: 'always' }
    }
  );
  for (const [x, y, kind] of [
    [34, 34, 'sealed-storage-crate'],
    [37, 36, 'rusted-crate'],
    [39, 33, 'sealed-storage-crate'],
    [44, 33, 'sealed-storage-crate'],
    [44, 35, 'rusted-barrel'],
    [41, 36, 'field-satchel']
  ]) {
    addObject(kind, x, y, {
      id: `censure-road-supply-${kind}-${x}-${y}`,
      blocking: true,
      seed: hash(x, y, 91)
    });
  }
  paintTentFootprint(48, 32, 53, 36);
  addTentFlap(
    'censure-road-sutler-tent-flap',
    "Maev's Trade Tent",
    50,
    36,
    {
      path: './data/levels/censure_road_sutler_tent.json',
      approach: { x: 50, y: 37 },
      player: { x: 5, y: 7 },
      clickAreas: [clickArea(48, 32, 53, 36)]
    },
    {
      salt: 92,
      mapMarker: { label: 'Sutler Tent', kind: 'exit', reveal: 'always' }
    }
  );
  addObject('field-cart', 55, 34, {
    id: 'censure-road-sutler-cart',
    blocking: true,
    orient: 'nw',
    name: "Maev's Cart",
    seed: hash(55, 34, 93),
    mapMarker: { label: 'Sutler Trader', kind: 'dialogue', reveal: 'always' }
  });
  addObject('settlement-table', 54, 35, { id: 'censure-road-sutler-table', blocking: true, seed: hash(54, 35, 95) });
  addObject('low-stool', 47, 37, { id: 'censure-road-sutler-stool', blocking: true, seed: hash(47, 37, 97) });
  addObject('field-satchel', 53, 37, { id: 'censure-road-sutler-satchel', blocking: true, seed: hash(53, 37, 98) });
  addObject('paper-scraps', 52, 38, { id: 'censure-road-sutler-price-tags', seed: hash(52, 38, 99) });
}

function placeEvidenceShed() {
  paintRect(56, 37, 62, 40, 'S');
  addObject('farm-door', 59, 40, {
    id: 'censure-road-evidence-shed-door',
    blocking: true,
    wallPlane: 'sw',
    variant: 'storage-shed',
    name: 'Evidence Shed',
    seed: hash(59, 40, 101),
    interact: {
      type: 'note',
      log: 'The evidence shed is sealed with three tags: cult relics, road bodies, and objects that talked back.'
    },
    mapMarker: { label: 'Evidence Shed', kind: 'note', reveal: 'always' }
  });
  addObject('paper-scraps', 57, 42, { id: 'censure-road-evidence-tags', seed: hash(57, 42, 103) });
}

function placeMedicTent() {
  paintTentFootprint(61, 42, 65, 46);
  addTentFlap(
    'censure-road-medic-tent-flap',
    'Medic Tent',
    61,
    46,
    {
      path: './data/levels/censure_road_medic_tent.json',
      approach: { x: 60, y: 46 },
      player: { x: 2, y: 7 },
      clickAreas: [clickArea(61, 42, 65, 46)]
    },
    {
      salt: 107,
      mapMarker: { label: 'Medic Tent', kind: 'exit', reveal: 'always' }
    }
  );
  addObject('camp-bedroll', 60, 44, { id: 'censure-road-medic-bedroll', seed: hash(60, 44, 109) });
  addObject('field-satchel', 59, 43, { id: 'censure-road-medic-field-kit', blocking: true, seed: hash(59, 43, 110) });
  addObject('wash-tub', 57, 45, { id: 'censure-road-medic-wash-tub', blocking: true, seed: hash(57, 45, 111) });
}

function placeQuarters() {
  paintTentFootprint(12, 36, 14, 40);
  paintTentFootprint(16, 35, 18, 40);
  paintTentFootprint(20, 36, 22, 40);
  addTentFlap(
    'censure-road-quarters-tent-flap',
    'Cult-Breaker Quarters',
    16,
    40,
    {
      path: './data/levels/censure_road_quarters_tent.json',
      approach: { x: 16, y: 41 },
      clickAreas: [
        clickArea(12, 36, 14, 40),
        clickArea(16, 35, 18, 40),
        clickArea(20, 36, 22, 40)
      ]
    },
    {
      salt: 113,
      mapMarker: { label: 'Cult-Breaker Quarters', kind: 'exit', reveal: 'always' }
    }
  );
  for (const [x, y] of [
    [11, 38], [23, 38], [16, 41]
  ]) {
    addObject('camp-bedroll', x, y, { id: `censure-road-bedroll-${x}-${y}`, seed: hash(x, y, 115) });
  }
  for (const [x, y] of [
    [14, 41],
    [19, 41],
    [22, 41]
  ]) {
    addObject('field-satchel', x, y, {
      id: `censure-road-quarters-kit-${x}-${y}`,
      blocking: true,
      seed: hash(x, y, 116)
    });
  }
  addObject('campfire', 19, 42, { id: 'censure-road-quarters-fire', seed: hash(19, 42, 117) });
}

function placeWritBoardAndWorkSites() {
  addObject('quarantine-sign', 14, 25, {
    id: 'censure-road-writ-board',
    blocking: true,
    name: 'Writ Board',
    seed: hash(14, 25, 121),
    interact: {
      type: 'note',
      log: 'The board sorts orders by road bell. Hallowfen has three missed marks and one ink smear where a name was cut out.'
    },
    mapMarker: { label: 'Writ Board', kind: 'note', reveal: 'always' }
  });
  addObject('feed-trough', 64, 33, {
    id: 'censure-road-tether-line',
    blocking: true,
    orient: 'sw',
    name: 'Tether Line',
    seed: hash(64, 33, 123),
    interact: {
      type: 'note',
      log: 'The tether line is empty except for chewed rope and one offended hoofprint.'
    },
    mapMarker: { label: 'Tether Line', kind: 'note', reveal: 'always' }
  });
  addObject('field-harrow', 11, 44, {
    id: 'censure-road-ash-latrines',
    blocking: true,
    orient: 'se',
    name: 'Ash Latrines',
    seed: hash(11, 44, 125),
    interact: {
      type: 'note',
      log: 'A prayer slip nailed to the latrine post asks God for mercy and better hinges.'
    },
    mapMarker: { label: 'Ash Latrines', kind: 'note', reveal: 'always' }
  });
  for (const [x, y] of [
    [43, 43], [45, 43], [47, 43]
  ]) {
    addObject('rusted-barrel', x, y, {
      id: `censure-road-water-barrel-${x}`,
      blocking: true,
      name: 'Water Barrels',
      seed: hash(x, y, 127),
      ...(x === 45 ? {
        interact: {
          type: 'note',
          log: 'Three water barrels sit under wax seals. One seal has tooth marks and a guilty thumbprint.'
        },
        mapMarker: { label: 'Water Barrels', kind: 'note', reveal: 'always' }
      } : {})
    });
  }
  addObject('water-pump', 46, 44, { id: 'censure-road-water-pump', blocking: true, seed: hash(46, 44, 129) });
}

function placeRoadDust() {
  for (let y = 0; y < HEIGHT; y += 1) {
    for (let x = 0; x < WIDTH; x += 1) {
      const tile = getTile(x, y);
      if (tile !== 'r' && tile !== 's') continue;
      if (hasObjectAt(x, y)) continue;
      const h = hash(x, y, 131);
      if ((h % 100) >= (tile === 'r' ? 36 : 13)) continue;
      addObject('road-dust', x, y, { seed: h });
    }
  }
}

function paintCampFloorTextures() {
  const gravelRects = [
    [18, 12, 34, 20],
    [41, 12, 52, 15],
    [23, 29, 34, 33],
    [34, 34, 56, 38],
    [29, 18, 40, 32]
  ];
  const mudRects = [
    [39, 22, 63, 29],
    [10, 38, 24, 43],
    [40, 41, 48, 45],
    [9, 42, 15, 45],
    [56, 43, 65, 46],
    [62, 31, 65, 34]
  ];
  const pathRects = [
    [33, 18, 35, 47, 'm'],
    [16, 18, 35, 20, 'm'],
    [34, 16, 66, 18, 'm'],
    [45, 13, 48, 18, 'm'],
    [39, 24, 63, 27, 'm'],
    [27, 29, 35, 32, 'm'],
    [34, 35, 51, 37, 'm'],
    [15, 40, 61, 42, 'm'],
    [58, 42, 62, 46, 'm'],
    [55, 40, 60, 42, 'g'],
    [29, 18, 35, 20, 'g'],
    [39, 24, 45, 27, 'g'],
    [34, 35, 41, 37, 'g'],
    [50, 36, 56, 38, 'g']
  ];
  const canvasRects = [
    [15, 18, 17, 20],
    [22, 16, 24, 18],
    [45, 12, 47, 14],
    [27, 29, 29, 31],
    [37, 35, 39, 37],
    [49, 36, 51, 38],
    [60, 45, 62, 47],
    [15, 40, 17, 42]
  ];

  for (const rect of gravelRects) paintOpenRect(...rect, 'g');
  for (const rect of mudRects) paintOpenRect(...rect, 'm');
  for (const [x0, y0, x1, y1, char] of pathRects) paintOpenRect(x0, y0, x1, y1, char);
  for (const rect of canvasRects) paintOpenRect(...rect, 'p');
}

function placeSmallDressing() {
  for (const [x, y, kind] of [
    [24, 17, 'wax-stain'],
    [27, 18, 'paper-scraps'],
    [30, 28, 'paper-scraps'],
    [35, 41, 'rubble-decal'],
    [55, 36, 'road-dust'],
    [62, 34, 'rubble-decal'],
    [16, 45, 'road-dust'],
    [52, 12, 'floor-crack']
  ]) {
    addObject(kind, x, y, { id: `censure-road-${kind}-${x}-${y}`, seed: hash(x, y, 137) });
  }
}

paintCamp();
paintRoads();
placeEvidenceShed();
placePerimeter();
placeRoadGates();
placeWritChapel();
placeBellMast();
placePreceptorTent();
placeDrillYard();
placeQuartermaster();
placeSupplyAndTrader();
placeMedicTent();
placeQuarters();
placeWritBoardAndWorkSites();
paintCampFloorTextures();
placeRoadDust();
placeSmallDressing();

objects.sort((a, b) => (a.y - b.y) || (a.x - b.x) || a.kind.localeCompare(b.kind));

const level = {
  id: 'censure-road-camp',
  name: 'Censure Road Camp',
  intro: 'The Censure road camp sits between two dead routes: one back to Ash Chapel, one toward the silent Hallowfen bells.',
  width: WIDTH,
  height: HEIGHT,
  tileSize: 64,
  quests: ['investigate-ash-chapel-cult', 'calcified-brothers', 'censure-road-confession'],
  dialogue: CAMP_DIALOGUES,
  tiles: tiles.map((row) => row.join('')),
  legend: {
    '.': { kind: 'floor', floor: 'packed-earth', walkable: true },
    r: { kind: 'floor', floor: 'ash-road', walkable: true },
    s: { kind: 'floor', floor: 'road-shoulder', walkable: true },
    m: { kind: 'floor', floor: 'mud-track', walkable: true },
    g: { kind: 'floor', floor: 'ash-gravel', walkable: true },
    p: { kind: 'floor', floor: 'worn-canvas', walkable: true },
    u: { kind: 'ash-tree', floor: 'forest-floor', walkable: false },
    v: { kind: 'scrub-bush', floor: 'forest-floor', walkable: false },
    l: { kind: 'fallen-ash-log', floor: 'forest-floor', walkable: false },
    t: { kind: 'ash-tree-stump', floor: 'forest-floor', walkable: false },
    C: { kind: 'canvas-tent-building-block', walkable: false },
    S: { kind: 'storage-shed-building-block', walkable: false }
  },
  mood: {
    floorShade: '#10130d',
    floorShadeAlpha: 0.05,
    ambient: '#b8aa83',
    ambientAlpha: 0.08,
    vignette: 0.28,
    sun: {
      enabled: true,
      shadowOffsetX: 12,
      shadowOffsetY: 6,
      shadowAlpha: 0.14
    }
  },
  spawns: {
    player: { actor: 'mara-vey', x: START.x, y: START.y },
    enemies: [],
    npcs: NPCS
  },
  objects
};

if (levelTransitions.length > 0) level.levelTransitions = levelTransitions;

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(level, null, 2)}\n`, 'utf8');
console.log(`Generated ${outputPath}`);
