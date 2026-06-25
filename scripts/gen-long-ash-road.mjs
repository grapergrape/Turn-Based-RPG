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
const FARM_DOOR_DIALOGUES = [
  'long-ash-farmhouse-door',
  'long-ash-barn-door',
  'long-ash-storage-shed-door',
  'long-ash-grain-shed-door',
  'long-ash-tool-shed-door'
];
const GRAVEYARD_BODIES = [
  {
    id: 'grave-eren-voss',
    name: 'Eren Voss',
    variant: 'kneeling-fused-hands',
    x: 129,
    y: 54,
    log: 'Eren Voss kneels in the ash with both hands fused under his chin. The stone kept the prayer and lost the man.'
  },
  {
    id: 'grave-sister-maud-arel',
    name: 'Sister Maud Arel',
    variant: 'broken-halo',
    x: 132,
    y: 54,
    log: 'Sister Maud Arel went pale around a broken ring of bone. Half the halo lies in chips at her feet.'
  },
  {
    id: 'grave-toma-kest',
    name: 'Toma Kest',
    variant: 'rib-open-chest',
    x: 135,
    y: 54,
    log: 'Toma Kest stands with his ribs opened like little chapel doors. The cavity behind them is dry stone.'
  },
  {
    id: 'grave-iven-rusk',
    name: 'Iven Rusk',
    variant: 'reaching-arm',
    x: 138,
    y: 54,
    log: 'Iven Rusk reaches toward the fence with one stone hand. The other arm is folded into his chest.'
  },
  {
    id: 'grave-nara-vell',
    name: 'Nara Vell',
    variant: 'goat-skull',
    x: 128,
    y: 56,
    log: 'Nara Vell has a long goat skull where her face should be. One horn curls whole, the other snapped at the root.'
  },
  {
    id: 'grave-brother-senn-kade',
    name: 'Brother Senn Kade',
    variant: 'thorned-back',
    x: 131,
    y: 56,
    log: 'Brother Senn Kade is bent forward under pale thorns. They broke through his back and froze there.'
  },
  {
    id: 'grave-lysa-orm',
    name: 'Lysa Orm',
    variant: 'bell-jaw',
    x: 134,
    y: 56,
    log: 'Lysa Orm has a jaw pulled wide into a bell shape. Nothing rings when the wind passes through it.'
  },
  {
    id: 'grave-arno-pell',
    name: 'Arno Pell',
    variant: 'half-prayer-twist',
    x: 137,
    y: 56,
    log: 'Arno Pell is twisted halfway into prayer, one palm sealed to the chest and one elbow cracked backward.'
  },
  {
    id: 'grave-ilyen-marr',
    name: 'Ilyen Marr',
    variant: 'collapsed-shoulder',
    x: 130,
    y: 58,
    log: 'Ilyen Marr slumps under one collapsed shoulder. The ash at his feet has been packed smoother than the rest.',
    search: {
      title: "Ilyen Marr's Grave",
      lines: [
        'A narrow seam runs below the packed ash, too straight for weather.'
      ],
      useLabel: "Inspect Ilyen's grave",
      methods: [
        {
          id: 'read-disturbed-ash',
          label: 'Read the disturbed ash',
          field: 'search',
          dc: 40,
          successLog: 'A crawl space opens under the roots. A black mourning ring is tied there in waxed thread.',
          failLog: 'The roots and loose ash give you no clean read.',
          success: {
            setFlag: 'looted-ilyen-marr-grave',
            inventory: {
              add: [
                {
                  item: 'mourning-ring',
                  count: 1
                }
              ]
            }
          }
        }
      ]
    }
  },
  {
    id: 'grave-vel-sarec',
    name: 'Vel Sarec',
    variant: 'buried-lower-body',
    x: 133,
    y: 58,
    log: 'Vel Sarec rises only from the waist. The rest is buried in a hard swell of ash and root.'
  },
  {
    id: 'grave-otta-fen',
    name: 'Otta Fen',
    variant: 'split-face',
    x: 136,
    y: 58,
    log: 'Otta Fen split down the face before the Stilling took him. One side is smooth as chalk, the other all dark seam.'
  }
];

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
  paintRect(17, 43, 25, 51, 'B');
  paintRect(28, 43, 36, 50, 'B');
  paintRect(14, 54, 20, 60, 'B');
  paintRect(23, 56, 28, 60, 'B');
  paintRect(31, 56, 36, 60, 'B');
}

function placeFarmObjects() {
  const bottomFenceGaps = new Set([18, 19, 20, 21, 25, 33]);
  for (let x = 12; x <= 37; x += 1) {
    if (x !== 24 && x !== 25) {
      addObject('farm-fence', x, 42, { blocking: true, orient: 'se', seed: hash(x, 42, 41) });
    }
    if (!bottomFenceGaps.has(x)) {
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

  addFarmDoor('farmhouse-door', 'Farmhouse Door', 21, 51, 'long-ash-farmhouse-door', 'The farmhouse door is thumb-polished around the latch.', { wallPlane: 'sw' });
  addFarmDoor('barn-door', 'Barn Door', 36, 50, 'long-ash-barn-door', 'The barn door rides low on its track, with chaff pressed into the groove.', { wallPlane: 'sw' });
  addFarmDoor('storage-shed-door', 'Storage Shed Door', 25, 60, 'long-ash-storage-shed-door', 'The storage shed door has a ring pull worn bright at the bottom edge.', { wallPlane: 'sw' });
  addFarmDoor('grain-shed-door', 'Grain Shed Door', 33, 60, 'long-ash-grain-shed-door', 'Dry seed husks are packed under the grain shed door.', { wallPlane: 'sw' });
  addFarmDoor('tool-shed-door', 'Tool Shed Door', 20, 57, 'long-ash-tool-shed-door', 'The tool shed door gives after the hasp is worked loose.', {
    wallPlane: 'se',
    lock: {
      id: 'long-ash-tool-shed-lock',
      title: 'Tool Shed Lock',
      lines: [
        'A bent hasp holds the tool shed shut. Fresh scratches cut through the rust around it.'
      ],
      methods: [
        {
          id: 'pick-hasp',
          label: 'Pick the hasp',
          field: 'security',
          dc: 35,
          successLog: 'The hasp gives. The shed door can be worked open.',
          failLog: 'The hasp holds, and the entry roll flexes against the rust.'
        },
        {
          id: 'force-frame',
          label: 'Force the frame',
          primary: 'body',
          dc: 3,
          successLog: 'The frame cracks at the latch. The shed door pulls loose.',
          failLog: 'The old frame groans, but the latch stays set.'
        }
      ]
    }
  });

  addObject('field-cart', 26, 47, { blocking: true, orient: 'sw', seed: hash(26, 47, 47) });
  addObject('field-cart', 13, 58, { blocking: true, orient: 'se', seed: hash(13, 58, 47) });
  addObject('hay-rick', 11, 65, { blocking: true, seed: hash(11, 65, 53) });
  addObject('hay-rick', 52, 51, { blocking: true, seed: hash(52, 51, 53) });
  addObject('hay-rick', 70, 58, { blocking: true, seed: hash(70, 58, 53) });
}

function addFarmDoor(id, name, x, y, dialogue, log, extraInteract = {}) {
  const { wallPlane, ...interactExtras } = extraInteract;
  const object = {
    id,
    blocking: true,
    name,
    seed: hash(x, y, 44),
    interact: {
      type: 'secret-entrance',
      dialogue,
      log,
      ...interactExtras
    }
  };
  if (wallPlane) object.wallPlane = wallPlane;
  addObject('farm-door', x, y, object);
}

function placeFarmMachinery() {
  // Yard machinery from the planning map compound: clustered around the house
  // and barns, leaving the fence gates and building footprints clear.
  addObject('water-pump', 15, 52, { blocking: true, seed: hash(15, 52, 45) });
  addObject('feed-trough', 18, 53, { blocking: true, orient: 'se', seed: hash(18, 53, 45) });
  addObject('field-plow', 23, 52, { blocking: true, orient: 'sw', seed: hash(23, 52, 45) });
  addObject('field-harrow', 26, 50, { blocking: true, orient: 'sw', seed: hash(26, 50, 45) });
  addObject('tool-rack', 34, 53, { blocking: true, seed: hash(34, 53, 45) });
  addObject('woodpile', 29, 57, { blocking: true, seed: hash(29, 57, 45) });
  addObject('field-plow', 21, 59, { blocking: true, orient: 'se', seed: hash(21, 59, 45) });
  addObject('field-harrow', 30, 55, { blocking: true, orient: 'sw', seed: hash(30, 55, 45) });
  addObject('feed-trough', 22, 59, { blocking: true, orient: 'sw', seed: hash(22, 59, 45) });
  addObject('wagon-wheel', 26, 52, { blocking: true, seed: hash(26, 52, 45) });
}

function placeFarmVictims() {
  const victims = [
    { x: 27, y: 51, member: 'father' },
    { x: 29, y: 51, member: 'mother' },
    { x: 31, y: 51, member: 'grandparent' },
    { x: 33, y: 51, member: 'older-child' },
    { x: 35, y: 51, member: 'younger-child' }
  ];
  for (const victim of victims) {
    addObject('blood-stain', victim.x, victim.y, { seed: hash(victim.x, victim.y, 147) });
    addObject('farm-cross-victim', victim.x, victim.y, {
      blocking: true,
      member: victim.member,
      seed: hash(victim.x, victim.y, 149)
    });
  }
  addObject('blood-sigil', 29, 53, { seed: hash(29, 53, 151) });
  addObject('blood-sigil', 35, 54, { seed: hash(35, 54, 151) });
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
  for (const body of GRAVEYARD_BODIES) {
    addObject('calcified-grave-body', body.x, body.y, {
      id: body.id,
      blocking: true,
      name: body.name,
      variant: body.variant,
      seed: hash(body.x, body.y, 67),
      interact: {
        type: 'note',
        log: body.log,
        ...(body.search ? { search: body.search } : {})
      }
    });
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
placeFarmMachinery();
placeFarmVictims();

objects.sort((a, b) => (a.y - b.y) || (a.x - b.x) || a.kind.localeCompare(b.kind));

const level = {
  id: 'long-ash-road-approach',
  name: 'Long Ash Road Approach',
  intro: 'The Hallowfen road opens into dead wheat, dark tree cover, and a graveyard where the infected were buried standing.',
  width: WIDTH,
  height: HEIGHT,
  tileSize: 64,
  quests: ['investigate-ash-chapel-cult'],
  dialogue: FARM_DOOR_DIALOGUES,
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
