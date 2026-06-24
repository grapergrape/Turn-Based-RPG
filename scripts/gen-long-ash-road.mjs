import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const outputPath = join(root, 'data', 'levels', 'long_ash_road_approach.json');

const WIDTH = 160;
const HEIGHT = 70;
const START = { x: 142, y: 68 };
const GRAVEYARD = { x0: 127, x1: 140, y0: 52, y1: 59 };

const ROAD_MAIN = [
  { x: 142, y: 68 },
  { x: 130, y: 64 },
  { x: 118, y: 58 },
  { x: 104, y: 52 },
  { x: 91, y: 46 },
  { x: 80, y: 41 },
  { x: 68, y: 33 }
];
const ROAD_BRANCH = [
  { x: 91, y: 46 },
  { x: 100, y: 38 },
  { x: 113, y: 31 }
];
const ROAD_CENSURE = [
  { x: 115, y: 31 },
  { x: 116, y: 4 }
];
const ROAD_REMNANT = [
  { x: 115, y: 31 },
  { x: 117, y: 55 }
];
const ALL_ROADS = [ROAD_MAIN, ROAD_BRANCH, ROAD_CENSURE, ROAD_REMNANT];

const tiles = Array.from({ length: HEIGHT }, () => Array.from({ length: WIDTH }, () => '.'));
const objects = [];
const reserved = new Set();

function key(x, y) {
  return `${x},${y}`;
}

function inBounds(x, y) {
  return x >= 0 && y >= 0 && x < WIDTH && y < HEIGHT;
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
  for (const road of ALL_ROADS) {
    for (let i = 0; i < road.length - 1; i += 1) {
      best = Math.min(best, distToSegment(x, y, road[i], road[i + 1]));
    }
  }
  return best;
}

function paintRoads() {
  for (let y = 0; y < HEIGHT; y += 1) {
    for (let x = 0; x < WIDTH; x += 1) {
      const d = roadDistance(x, y);
      if (d <= 4.2) setTile(x, y, 's');
      if (d <= 2.25) setTile(x, y, 'r');
    }
  }
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

function isProtectedRange(x, y) {
  if (x >= 95 && x <= 106 && y >= 31 && y <= 37) return true;
  if (x >= GRAVEYARD.x0 - 1 && x <= GRAVEYARD.x1 + 1 && y >= GRAVEYARD.y0 && y <= GRAVEYARD.y1) return true;
  if (x >= 12 && x <= 37 && y >= 42 && y <= 61) return true;
  if (x >= START.x - 2 && x <= START.x + 2 && y >= START.y - 2 && y <= START.y + 1) return true;
  return false;
}

function canBlock(x, y) {
  if (!inBounds(x, y)) return false;
  if (reserved.has(key(x, y))) return false;
  if (isProtectedRange(x, y)) return false;
  const tile = getTile(x, y);
  if (tile === 'r' || tile === 's' || tile === 'B') return false;
  return true;
}

function hash(x, y, salt = 0) {
  let h = (Math.imul(x + salt * 17, 374761393) + Math.imul(y + 97, 668265263)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return (h ^ (h >>> 16)) >>> 0;
}

function scatterForest() {
  for (let y = 1; y < HEIGHT - 1; y += 2) {
    for (let x = 45; x < WIDTH - 1; x += 2) {
      const inTopForest = x >= 45 && y <= 38;
      const inRightForest = x >= 90 && y >= 20;
      const fringe = x >= 58 && x <= 90 && y >= 24 && y <= 63;
      if (!inTopForest && !inRightForest && !fringe) continue;
      if (getTile(x, y) !== 'd' && !(fringe && getTile(x, y) === '.')) continue;
      if (roadDistance(x, y) < 5.2) continue;
      const h = hash(x, y, 3);
      const dense = inTopForest || inRightForest ? 62 : 23;
      if ((h % 100) >= dense) continue;
      const jitterX = Math.max(0, Math.min(WIDTH - 1, x + ((h >> 3) % 3) - 1));
      const jitterY = Math.max(0, Math.min(HEIGHT - 1, y + ((h >> 6) % 3) - 1));
      if (!canBlock(jitterX, jitterY)) continue;
      addObject('ash-tree', jitterX, jitterY, { blocking: true, seed: hash(jitterX, jitterY, 11) });
    }
  }

  for (let y = 5; y < HEIGHT - 2; y += 5) {
    for (let x = 4; x < WIDTH - 2; x += 7) {
      const h = hash(x, y, 19);
      if ((h % 100) > 25) continue;
      if (roadDistance(x, y) < 4 || isProtectedRange(x, y)) continue;
      if (getTile(x, y) === 'B' || reserved.has(key(x, y))) continue;
      addObject('scrub-bush', x + (h % 3) - 1, y + ((h >> 4) % 3) - 1, { seed: h });
    }
  }

  for (const stump of [
    [44, 20], [57, 17], [63, 43], [75, 49], [83, 59], [124, 57], [144, 50], [151, 64]
  ]) {
    const [x, y] = stump;
    if (canBlock(x, y)) addObject('ash-tree-stump', x, y, { blocking: true, seed: hash(x, y, 31) });
  }
}

function paintFarm() {
  paintRect(6, 0, 60, 69, '.');
  paintRect(12, 7, 27, 25, 'w');
  paintRect(29, 6, 39, 25, 'f');
  paintRect(41, 4, 58, 26, 'w');
  paintRect(12, 28, 28, 39, 'w');
  paintRect(30, 28, 39, 39, 'f');
  paintRect(40, 28, 60, 38, 'w');
  paintRect(40, 40, 60, 49, 'w');
  paintRect(12, 63, 25, 69, 'w');
  paintRect(26, 63, 35, 69, 'w');
  paintRect(36, 62, 39, 69, 'f');
  paintRect(40, 53, 49, 60, 'w');
  paintRect(50, 53, 60, 69, 'f');
  paintRect(63, 55, 73, 69, 'w');
  paintRect(76, 60, 86, 69, 'w');

  // Creek bed on the far western edge of the planning map, expressed with dark ash floor.
  for (let y = 0; y < HEIGHT; y += 1) {
    const x = 6 + Math.round(Math.sin(y * 0.22) * 1.4);
    setTile(x, y, 'd');
    if (inBounds(x + 1, y) && y % 3 !== 0) setTile(x + 1, y, 'd');
  }

  // Farm compound and outbuildings.
  paintRect(18, 44, 23, 50, 'B');
  paintRect(14, 48, 16, 55, 'B');
  paintRect(24, 54, 28, 58, 'B');
  paintRect(30, 47, 32, 50, 'B');
  paintRect(33, 56, 35, 59, 'B');
}

function placeFarmObjects() {
  for (let x = 12; x <= 37; x += 1) {
    if (x !== 24 && x !== 25) {
      addObject('farm-fence', x, 42, { blocking: true, orient: 'se', seed: hash(x, 42, 41) });
    }
    if (x < 18 || x > 21) {
      addObject('farm-fence', x, 61, { blocking: true, orient: 'se', seed: hash(x, 61, 41) });
    }
  }
  for (let y = 43; y <= 60; y += 1) {
    if (y !== 52 && y !== 53) {
      addObject('farm-fence', 12, y, { blocking: true, orient: 'sw', seed: hash(12, y, 43) });
    }
    if (y !== 52 && y !== 53) {
      addObject('farm-fence', 37, y, { blocking: true, orient: 'sw', seed: hash(37, y, 43) });
    }
  }
  addObject('field-cart', 28, 47, { blocking: true, orient: 'sw', seed: hash(28, 47, 47) });
  addObject('field-cart', 19, 58, { blocking: true, orient: 'se', seed: hash(19, 58, 47) });
  addObject('hay-rick', 11, 65, { blocking: true, seed: hash(11, 65, 53) });
  addObject('hay-rick', 52, 51, { blocking: true, seed: hash(52, 51, 53) });
  addObject('hay-rick', 70, 58, { blocking: true, seed: hash(70, 58, 53) });
}

function placeGraveyard() {
  paintRect(GRAVEYARD.x0 - 1, GRAVEYARD.y0, GRAVEYARD.x1 + 1, GRAVEYARD.y1, 'd');
  for (let x = GRAVEYARD.x0 - 1; x <= GRAVEYARD.x1 + 1; x += 1) {
    if (x % 2 === 0) addObject('farm-fence', x, GRAVEYARD.y0, { blocking: true, orient: 'se', seed: hash(x, GRAVEYARD.y0, 61) });
    if (x % 2 === 1) addObject('farm-fence', x, GRAVEYARD.y1, { blocking: true, orient: 'se', seed: hash(x, GRAVEYARD.y1, 61) });
  }
  for (let y = GRAVEYARD.y0 + 1; y <= GRAVEYARD.y1 - 1; y += 1) {
    if (y % 2 === 0) addObject('farm-fence', GRAVEYARD.x0 - 1, y, { blocking: true, orient: 'sw', seed: hash(GRAVEYARD.x0 - 1, y, 63) });
    if (y % 2 === 1) addObject('farm-fence', GRAVEYARD.x1 + 1, y, { blocking: true, orient: 'sw', seed: hash(GRAVEYARD.x1 + 1, y, 63) });
  }
  const markers = [
    [129, 54], [132, 54], [135, 54], [138, 54],
    [128, 56], [131, 56], [134, 56], [137, 56],
    [130, 58], [133, 58], [136, 58]
  ];
  for (const [x, y] of markers) {
    addObject('calcified-grave-marker', x, y, { blocking: true, seed: hash(x, y, 67) });
  }
}

function isMapExit(x, y) {
  if (y === 0 && x >= 113 && x <= 119) return true;
  if (y === HEIGHT - 1 && x >= 138 && x <= 146) return true;
  return false;
}

function addMapEdgeBlock(x, y, side) {
  if (!inBounds(x, y) || isMapExit(x, y) || reserved.has(key(x, y))) return;
  const tile = getTile(x, y);
  const farmEdge = x <= 60 || tile === 'w' || tile === 'f';
  if (farmEdge) {
    addObject('farm-fence', x, y, {
      blocking: true,
      orient: side === 'left' || side === 'right' ? 'sw' : 'se',
      seed: hash(x, y, 97)
    });
    return;
  }
  const h = hash(x, y, 101);
  addObject(h % 7 === 0 ? 'ash-tree-stump' : 'scrub-bush', x, y, {
    blocking: true,
    seed: h
  });
}

function placeMapEdges() {
  for (let x = 0; x < WIDTH; x += 1) {
    addMapEdgeBlock(x, 0, 'top');
    addMapEdgeBlock(x, HEIGHT - 1, 'bottom');
  }
  for (let y = 1; y < HEIGHT - 1; y += 1) {
    addMapEdgeBlock(0, y, 'left');
    addMapEdgeBlock(WIDTH - 1, y, 'right');
  }
}

function placeWheatModels() {
  for (let y = 1; y < HEIGHT - 1; y += 1) {
    for (let x = 1; x < WIDTH - 1; x += 1) {
      const tile = getTile(x, y);
      if (tile !== 'w' && tile !== 'f') continue;
      if (reserved.has(key(x, y)) || hasObjectAt(x, y)) continue;
      const h = hash(x, y, 109);
      const rowStripe = ((x + Math.floor(y * 0.65)) % 2) === 0;
      const chance = tile === 'w' ? 82 : 45;
      if (!rowStripe || (h % 100) >= chance) continue;
      addObject('wheat-clump', x, y, {
        density: tile === 'w' ? 'full' : 'thin',
        seed: h
      });
    }
  }
}

function placeKillSite() {
  const cultists = [
    [96, 33], [99, 36], [103, 32], [105, 35], [101, 34]
  ];
  for (const [x, y] of cultists) addObject('dead-cultist', x, y, { seed: hash(x, y, 71) });
  addObject('dead-host-wolf-spider', 98, 32, { seed: hash(98, 32, 73) });
  addObject('dead-host-wolf-maw', 102, 35, { seed: hash(102, 35, 73) });
  addObject('dead-host-wolf-ribsplit', 105, 33, { seed: hash(105, 33, 73) });
  for (const [x, y] of [
    [96, 34], [98, 35], [100, 33], [102, 36], [104, 34], [106, 36], [99, 31]
  ]) {
    addObject('blood-stain', x, y, { seed: hash(x, y, 79) });
  }
}

function placeRoadDressing() {
  for (const [x, y] of [
    [142, 68], [134, 65], [123, 61], [112, 56], [102, 52],
    [92, 46], [81, 41], [70, 34], [101, 38], [113, 31],
    [116, 5], [117, 54]
  ]) {
    addObject('road-dust', x, y, { seed: hash(x, y, 83) });
  }
  addObject('road-sign-post', 116, 5, { seed: hash(116, 5, 89) });
  addObject('road-sign-post', 113, 31, { seed: hash(113, 31, 89) });
  addObject('road-sign-post', 117, 55, { seed: hash(117, 55, 89) });
  addObject('road-sign-post', 141, 67, { seed: hash(141, 67, 89) });
}

function paintForestFloor() {
  paintRect(45, 0, 159, 38, 'd');
  paintRect(90, 20, 159, 69, 'd');
  for (let y = 26; y <= 69; y += 1) {
    for (let x = 61; x <= 91; x += 1) {
      if (hash(x, y, 5) % 100 < 28) setTile(x, y, 'd');
    }
  }
}

paintForestFloor();
paintFarm();
paintRoads();
placeFarmObjects();
placeGraveyard();
placeKillSite();
placeRoadDressing();
scatterForest();
placeMapEdges();
placeWheatModels();

objects.sort((a, b) => (a.y - b.y) || (a.x - b.x) || a.kind.localeCompare(b.kind));

const level = {
  id: 'long-ash-road-approach',
  name: 'Long Ash Road Approach',
  intro: 'The Hallowfen road opens into dead wheat, dark tree cover, and a graveyard where the infected were buried standing.',
  width: WIDTH,
  height: HEIGHT,
  tileSize: 64,
  quests: ['investigate-ash-chapel-cult'],
  dialogue: [],
  tiles: tiles.map((row) => row.join('')),
  legend: {
    '.': { kind: 'floor', floor: 'ash-dirt', walkable: true },
    r: { kind: 'floor', floor: 'ash-road', walkable: true },
    s: { kind: 'floor', floor: 'road-shoulder', walkable: true },
    w: { kind: 'floor', floor: 'wheat-field', walkable: true },
    f: { kind: 'floor', floor: 'furrow-field', walkable: true },
    d: { kind: 'floor', floor: 'forest-floor', walkable: true },
    B: { kind: 'farm-building-block', walkable: false }
  },
  mood: {
    floorShade: '#15130e',
    floorShadeAlpha: 0.18,
    ambient: '#050505',
    ambientAlpha: 0.08,
    vignette: 1.1
  },
  spawns: {
    player: { actor: 'mara-vey', x: START.x, y: START.y },
    enemies: [],
    npcs: []
  },
  objects
};

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(level, null, 2)}\n`, 'utf8');
console.log(`Generated ${outputPath}`);
