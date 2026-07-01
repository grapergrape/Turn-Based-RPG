import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const outputPath = join(root, 'data', 'levels', 'long_ash_road_approach.json');

const WIDTH = 160;
const HEIGHT = 70;
const START = { x: 142, y: 68 };
const GRAVEYARD = { x0: 126, x1: 148, y0: 47, y1: 59 };
const INFECTED_CAVE = { x: 90, y: 10 };
const FARM_DOOR_DIALOGUES = [
  'long-ash-farmhouse-door',
  'long-ash-barn-door',
  'long-ash-storage-shed-door',
  'long-ash-grain-shed-door',
  'long-ash-tool-shed-door',
  'long-ash-infected-cave-entrance',
  'long-ash-wolf-cultist-evidence',
  'long-ash-censure-road-camp-exit',
  'long-ash-crossroad-brother',
  'long-ash-field-brother'
];
const INFECTED_CAVE_OUTSIDE_WOLVES = [
  { id: 'host-wolf-spider', x: 88, y: 13, facing: 'se' },
  { id: 'host-wolf-maw', x: 91, y: 13, facing: 's' },
  { id: 'host-wolf-ribsplit', x: 94, y: 12, facing: 'sw' }
];
const GRAVEYARD_BODIES = [
  {
    id: 'grave-eren-voss',
    name: 'Eren Voss',
    variant: 'kneeling-fused-hands',
    x: 129,
    y: 50,
    log: 'Eren Voss kneels in the ash with both hands fused under his chin. The stone kept the prayer and lost the man.'
  },
  {
    id: 'grave-sister-maud-arel',
    name: 'Sister Maud Arel',
    variant: 'broken-halo',
    x: 132,
    y: 50,
    log: 'Sister Maud Arel went pale around a broken ring of bone. Half the halo lies in chips at her feet.'
  },
  {
    id: 'grave-toma-kest',
    name: 'Toma Kest',
    variant: 'rib-open-chest',
    x: 135,
    y: 50,
    log: 'Toma Kest stands with his ribs opened like little chapel doors. The cavity behind them is dry stone.'
  },
  {
    id: 'grave-iven-rusk',
    name: 'Iven Rusk',
    variant: 'reaching-arm',
    x: 138,
    y: 50,
    log: 'Iven Rusk reaches toward the fence with one stone hand. The other arm is folded into his chest.'
  },
  {
    id: 'grave-nara-vell',
    name: 'Nara Vell',
    variant: 'goat-skull',
    x: 129,
    y: 52,
    log: 'Nara Vell has a long goat skull where her face should be. One horn curls whole, the other snapped at the root.'
  },
  {
    id: 'grave-brother-senn-kade',
    name: 'Brother Senn Kade',
    variant: 'thorned-back',
    x: 132,
    y: 52,
    log: 'Brother Senn Kade is bent forward under pale thorns. They broke through his back and froze there.'
  },
  {
    id: 'grave-lysa-orm',
    name: 'Lysa Orm',
    variant: 'bell-jaw',
    x: 135,
    y: 52,
    log: 'Lysa Orm has a jaw pulled wide into a bell shape. Nothing rings when the wind passes through it.'
  },
  {
    id: 'grave-arno-pell',
    name: 'Arno Pell',
    variant: 'half-prayer-twist',
    x: 138,
    y: 52,
    log: 'Arno Pell is twisted halfway into prayer, one palm sealed to the chest and one elbow cracked backward.'
  },
  {
    id: 'grave-ilyen-marr',
    name: 'Ilyen Marr',
    variant: 'collapsed-shoulder',
    x: 129,
    y: 54,
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
    x: 132,
    y: 54,
    log: 'Vel Sarec rises only from the waist. The rest is buried in a hard swell of ash and root.'
  },
  {
    id: 'grave-otta-fen',
    name: 'Otta Fen',
    variant: 'split-face',
    x: 135,
    y: 54,
    log: 'Otta Fen split down the face before the Stilling took him. One side is smooth as chalk, the other all dark seam.'
  }
];
const GRAVEYARD_PLOTS = [
  [129, 50], [132, 50], [135, 50], [138, 50], [141, 50], [144, 50],
  [129, 52], [132, 52], [135, 52], [138, 52], [141, 52], [144, 52],
  [129, 54], [132, 54], [135, 54], [138, 54], [141, 54], [144, 54],
  [129, 58], [132, 58], [135, 58], [138, 58], [141, 58], [144, 58]
];
const GRAVEYARD_TOMBS = [
  { x: 141, y: 50, orient: 'se' },
  { x: 144, y: 52, orient: 'sw' },
  { x: 138, y: 58, orient: 'se' }
];
const GRAVEYARD_BONE_MARKERS = [
  { x: 128, y: 48 },
  { x: 145, y: 49 },
  { x: 140, y: 55 },
  { x: 128, y: 57 },
  { x: 145, y: 57 }
];
const GRAVEYARD_CATACOMB = { x: 143, y: 48, orient: 'se' };
const GRAVEYARD_PATH_STONES = [
  [127, 56], [130, 56], [133, 56], [136, 56], [139, 56], [142, 56], [145, 56],
  [140, 49], [140, 51], [140, 53], [140, 57]
];
const GRAVEYARD_ROOT_SEAMS = [
  [128, 50], [145, 50], [130, 55], [137, 57], [146, 58]
];
const GRAVEYARD_PRAYER_SCRATCHES = [
  [131, 49], [137, 49], [142, 51], [134, 53], [141, 55], [132, 57]
];
const GRAVEYARD_CROSS = { x: 140, y: 55 };

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
const FARM_BUILDING_TILES = new Set(['H', 'B', 'T', 'S', 'G']);

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

function isInfectedCaveClearance(x, y) {
  if (x >= INFECTED_CAVE.x - 10 && x <= INFECTED_CAVE.x + 10 && y >= INFECTED_CAVE.y - 6 && y <= INFECTED_CAVE.y + 7) {
    return true;
  }
  const trailA = { x: INFECTED_CAVE.x, y: INFECTED_CAVE.y + 3 };
  const trailB = { x: 116, y: 8 };
  return x >= trailA.x && x <= trailB.x && y >= 6 && y <= 14 && distToSegment(x, y, trailA, trailB) <= 1.35;
}

function canBlock(x, y) {
  if (!inBounds(x, y)) return false;
  if (reserved.has(key(x, y))) return false;
  if (hasObjectAt(x, y)) return false;
  if (isProtectedRange(x, y)) return false;
  const tile = getTile(x, y);
  if (tile === 'r' || tile === 's' || FARM_BUILDING_TILES.has(tile)) return false;
  return true;
}

function hash(x, y, salt = 0) {
  let h = (Math.imul(x + salt * 17, 374761393) + Math.imul(y + 97, 668265263)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return (h ^ (h >>> 16)) >>> 0;
}

function forestBlockKind(h, dense) {
  const roll = h % 100;
  if (dense) {
    if (roll < 68) return 'ash-tree';
    if (roll < 78) return 'scrub-bush';
    if (roll < 90) return 'fallen-ash-log';
    return 'ash-tree-stump';
  }
  if (roll < 46) return 'ash-tree';
  if (roll < 66) return 'scrub-bush';
  if (roll < 82) return 'fallen-ash-log';
  return 'ash-tree-stump';
}

function forestSeedSalt(kind) {
  if (kind === 'ash-tree') return 11;
  if (kind === 'scrub-bush') return 13;
  if (kind === 'fallen-ash-log') return 15;
  return 17;
}

function canPlaceSapling(x, y) {
  if (!inBounds(x, y)) return false;
  if (isProtectedRange(x, y)) return false;
  if (reserved.has(key(x, y)) || hasObjectAt(x, y)) return false;
  if (getTile(x, y) !== 'd') return false;
  if (roadDistance(x, y) < 4.6) return false;
  return true;
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
      const kind = forestBlockKind(hash(jitterX, jitterY, 7), inTopForest || inRightForest);
      addObject(kind, jitterX, jitterY, {
        blocking: true,
        seed: hash(jitterX, jitterY, forestSeedSalt(kind))
      });
    }
  }

  for (let y = 3; y < HEIGHT - 2; y += 3) {
    for (let x = 47; x < WIDTH - 2; x += 4) {
      const h = hash(x, y, 23);
      if ((h % 100) > 16) continue;
      const sx = Math.max(1, Math.min(WIDTH - 2, x + ((h >> 5) % 3) - 1));
      const sy = Math.max(1, Math.min(HEIGHT - 2, y + ((h >> 9) % 3) - 1));
      if (!canPlaceSapling(sx, sy)) continue;
      addObject('ash-sapling', sx, sy, { seed: hash(sx, sy, 25) });
    }
  }

  for (let y = 5; y < HEIGHT - 2; y += 5) {
    for (let x = 4; x < WIDTH - 2; x += 7) {
      const h = hash(x, y, 19);
      if ((h % 100) > 25) continue;
      if (roadDistance(x, y) < 4 || isProtectedRange(x, y)) continue;
      if (FARM_BUILDING_TILES.has(getTile(x, y)) || reserved.has(key(x, y))) continue;
      const bx = x + (h % 3) - 1;
      const by = y + ((h >> 4) % 3) - 1;
      if (!inBounds(bx, by) || hasObjectAt(bx, by)) continue;
      addObject('scrub-bush', bx, by, { seed: h });
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
  paintRect(17, 43, 25, 51, 'H');
  paintRect(28, 43, 36, 50, 'B');
  paintRect(14, 54, 20, 60, 'T');
  paintRect(23, 56, 28, 60, 'S');
  paintRect(31, 56, 36, 60, 'G');
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

  addFarmDoor('farmhouse-door', 'Farmhouse Door', 21, 51, 'long-ash-farmhouse-door', 'The farmhouse door is thumb-polished around the latch.', { wallPlane: 'sw', variant: 'farmhouse' });
  addFarmDoor('barn-door', 'Barn Door', 36, 50, 'long-ash-barn-door', 'The barn door rides low on its track, with chaff pressed into the groove.', { wallPlane: 'sw', variant: 'barn' });
  addFarmDoor('storage-shed-door', 'Storage Shed Door', 25, 60, 'long-ash-storage-shed-door', 'The storage shed door has a ring pull worn bright at the bottom edge.', { wallPlane: 'sw', variant: 'storage-shed' });
  addFarmDoor('grain-shed-door', 'Grain Shed Door', 33, 60, 'long-ash-grain-shed-door', 'Dry seed husks are packed under the grain shed door.', { wallPlane: 'sw', variant: 'grain-shed' });
  addFarmDoor('tool-shed-door', 'Tool Shed Door', 20, 57, 'long-ash-tool-shed-door', 'The tool shed door gives after the hasp is worked loose.', {
    wallPlane: 'se',
    variant: 'tool-shed',
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
  const { wallPlane, variant, ...interactExtras } = extraInteract;
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
  object.mapMarker = { label: name, kind: 'exit' };
  if (wallPlane) object.wallPlane = wallPlane;
  if (variant) object.variant = variant;
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
      id: `long-ash-farm-victim-${victim.member}`,
      blocking: true,
      member: victim.member,
      seed: hash(victim.x, victim.y, 149),
      interact: {
        type: 'note',
        log: 'The farm family has been raised on rough crosses in the yard. Their field coats are stiff with old blood and chaff.',
        questUpdate: { quest: 'calcified-brothers', stage: 'family-known' }
      }
    });
  }
  addObject('blood-sigil', 29, 53, { seed: hash(29, 53, 151) });
  addObject('blood-sigil', 35, 54, { seed: hash(35, 54, 151) });
}

function isGraveyardGate(x, y) {
  return x === GRAVEYARD.x0 && (y === 56 || y === 57);
}

function paintGraveyardGround() {
  paintRect(GRAVEYARD.x0, GRAVEYARD.y0, GRAVEYARD.x1, GRAVEYARD.y1, 'g');
  for (let x = GRAVEYARD.x0; x <= GRAVEYARD.x1; x += 1) {
    setTile(x, 56, 's');
  }
  for (let y = GRAVEYARD.y0 + 1; y <= GRAVEYARD.y1 - 1; y += 1) {
    setTile(127, y, 's');
    setTile(140, y, 's');
    setTile(146, y, 's');
  }
  setTile(GRAVEYARD.x0 - 1, 56, 's');
  setTile(GRAVEYARD.x0 - 1, 57, 's');
}

function placeGraveyardWalls() {
  for (let x = GRAVEYARD.x0; x <= GRAVEYARD.x1; x += 1) {
    addObject('graveyard-wall', x, GRAVEYARD.y0, {
      blocking: true,
      orient: 'se',
      seed: hash(x, GRAVEYARD.y0, 61)
    });
    addObject('graveyard-wall', x, GRAVEYARD.y1, {
      blocking: true,
      orient: 'se',
      seed: hash(x, GRAVEYARD.y1, 61)
    });
  }
  for (let y = GRAVEYARD.y0 + 1; y <= GRAVEYARD.y1 - 1; y += 1) {
    if (!isGraveyardGate(GRAVEYARD.x0, y)) {
      addObject('graveyard-wall', GRAVEYARD.x0, y, {
        blocking: true,
        orient: 'sw',
        seed: hash(GRAVEYARD.x0, y, 63)
      });
    }
    addObject('graveyard-wall', GRAVEYARD.x1, y, {
      blocking: true,
      orient: 'sw',
      seed: hash(GRAVEYARD.x1, y, 63)
    });
  }
}

function placeGraveyardPlots() {
  for (const [x, y] of GRAVEYARD_PLOTS) {
    const plotOrient = ((x + y) & 1) ? 'sw' : 'se';
    addObject('graveyard-packed-ash', x, y, {
      seed: hash(x, y, 64)
    });
    addObject('calcified-grave-plot', x, y, {
      orient: plotOrient,
      seed: hash(x, y, 65)
    });
    addObject('calcified-headstone', x, y - 1, {
      blocking: true,
      seed: hash(x, y, 66)
    });
  }
  for (const tomb of GRAVEYARD_TOMBS) {
    addObject('graveyard-tomb-slab', tomb.x, tomb.y, {
      blocking: true,
      orient: tomb.orient,
      seed: hash(tomb.x, tomb.y, 76)
    });
  }
  for (const marker of GRAVEYARD_BONE_MARKERS) {
    addObject('graveyard-bone-marker', marker.x, marker.y, {
      blocking: true,
      seed: hash(marker.x, marker.y, 77)
    });
  }
}

function placeGraveyardCatacomb() {
  addObject('graveyard-catacomb-mouth', GRAVEYARD_CATACOMB.x, GRAVEYARD_CATACOMB.y, {
    id: 'graveyard-catacomb-mouth',
    blocking: true,
    orient: GRAVEYARD_CATACOMB.orient,
    seed: hash(GRAVEYARD_CATACOMB.x, GRAVEYARD_CATACOMB.y, 78)
  });
  for (const [x, y, salt] of [
    [140, 48, 79],
    [145, 48, 80],
    [142, 49, 81]
  ]) {
    addObject('rubble-decal', x, y, { seed: hash(x, y, salt) });
  }
  addObject('floor-crack', 143, 49, { seed: hash(143, 49, 82) });
}

function placeGraveyardDressing() {
  addObject('graveyard-remnant-cross', GRAVEYARD_CROSS.x, GRAVEYARD_CROSS.y, {
    id: 'graveyard-remnant-cross',
    blocking: true,
    seed: hash(GRAVEYARD_CROSS.x, GRAVEYARD_CROSS.y, 84)
  });
  for (const [x, y] of GRAVEYARD_PATH_STONES) {
    addObject('graveyard-path-stones', x, y, { seed: hash(x, y, 85) });
  }
  for (const [x, y] of GRAVEYARD_ROOT_SEAMS) {
    addObject('graveyard-root-seam', x, y, { seed: hash(x, y, 86) });
  }
  for (const [x, y] of GRAVEYARD_PRAYER_SCRATCHES) {
    addObject('graveyard-prayer-scratch', x, y, { seed: hash(x, y, 87) });
  }
  for (const [x, y] of [
    [127, 56], [134, 56], [142, 56], [146, 56], [127, 51], [146, 53], [127, 58],
    [141, 49], [144, 51], [139, 57]
  ]) {
    addObject('road-dust', x, y, { seed: hash(x, y, 68) });
  }
  for (const [x, y] of [
    [128, 49], [145, 51], [140, 55], [136, 57], [147, 58], [142, 52], [130, 57]
  ]) {
    addObject('rubble-decal', x, y, { seed: hash(x, y, 69) });
  }
  for (const [x, y] of [
    [127, 55], [143, 55], [146, 57]
  ]) {
    addObject('candle-cluster', x, y, { seed: hash(x, y, 70) });
    addObject('wax-stain', x, y, { seed: hash(x, y, 71) });
  }
  addObject('floor-crack', 140, 49, { seed: hash(140, 49, 72) });
  addObject('floor-crack', 145, 57, { seed: hash(145, 57, 72) });
}

function placeGraveyard() {
  paintGraveyardGround();
  placeGraveyardWalls();
  placeGraveyardPlots();
  placeGraveyardCatacomb();
  placeGraveyardDressing();
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
  const edgeKind = h % 13 === 0 ? 'fallen-ash-log' : h % 7 === 0 ? 'ash-tree-stump' : 'scrub-bush';
  addObject(edgeKind, x, y, {
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
  const cultistEvidence = {
    name: 'Dead Cultist',
    interact: {
      type: 'note',
      dialogue: 'long-ash-wolf-cultist-evidence',
      log: 'The dead cultist is torn open near the throat and cuff.'
    }
  };
  const wolfEvidence = {
    name: 'Dead Host Wolf',
    interact: {
      type: 'note',
      dialogue: 'long-ash-wolf-cultist-evidence',
      log: 'The dead wolf lies among torn cult cloth and blackened blood.'
    }
  };
  for (const [x, y] of cultists) {
    addObject('dead-cultist', x, y, { seed: hash(x, y, 71), ...cultistEvidence });
  }
  addObject('dead-host-wolf-spider', 98, 32, { seed: hash(98, 32, 73), ...wolfEvidence });
  addObject('dead-host-wolf-maw', 102, 35, { seed: hash(102, 35, 73), ...wolfEvidence });
  addObject('dead-host-wolf-ribsplit', 105, 33, { seed: hash(105, 33, 73), ...wolfEvidence });
  for (const [x, y] of [
    [96, 34], [98, 35], [100, 33], [102, 36], [104, 34], [106, 36], [99, 31]
  ]) {
    addObject('blood-stain', x, y, { seed: hash(x, y, 79) });
  }
}

function clearInfectedCaveApproach() {
  const removable = new Set(['ash-tree', 'ash-tree-stump', 'fallen-ash-log', 'ash-sapling', 'scrub-bush']);
  for (let i = objects.length - 1; i >= 0; i -= 1) {
    const object = objects[i];
    if (!removable.has(object.kind) || !isInfectedCaveClearance(object.x, object.y)) continue;
    if (object.blocking) reserved.delete(key(object.x, object.y));
    objects.splice(i, 1);
  }
}

function placeInfectedCave() {
  clearInfectedCaveApproach();
  for (const [x, y, id] of [
    [85, 10, 'infected-cave-rubble-west'],
    [88, 11, 'infected-cave-rubble-threshold-west'],
    [92, 11, 'infected-cave-rubble-threshold-east'],
    [95, 10, 'infected-cave-rubble-east'],
    [90, 12, 'infected-cave-rubble-trail']
  ]) {
    addObject('rubble-decal', x, y, { id, seed: hash(x, y, 157) });
  }
  addObject('floor-crack', 90, 11, { id: 'infected-cave-threshold-crack', seed: hash(90, 11, 157) });
  for (const [x, y, id] of [
    [83, 9, 'infected-cave-far-west-rocks'],
    [85, 10, 'infected-cave-west-shoulder-rocks'],
    [87, 11, 'infected-cave-west-lip-rocks'],
    [93, 11, 'infected-cave-east-lip-rocks'],
    [95, 10, 'infected-cave-east-shoulder-rocks'],
    [97, 9, 'infected-cave-far-east-rocks']
  ]) {
    addObject('rubble-pile', x, y, {
      id,
      blocking: true,
      seed: hash(x, y, 159)
    });
  }
  addObject('infected-cave-entrance', INFECTED_CAVE.x, INFECTED_CAVE.y, {
    id: 'infected-cave-entrance',
    blocking: true,
    name: 'Infected Cave',
    seed: hash(INFECTED_CAVE.x, INFECTED_CAVE.y, 161),
    interact: {
      type: 'secret-entrance',
      dialogue: 'long-ash-infected-cave-entrance',
      log: 'Wet fur and sick rot gather in the cold between the stones. Wolf tracks vanish into the black mouth.'
    },
    mapMarker: { label: 'Infected Cave', kind: 'danger' }
  });
}

function placeRoadDressing() {
  for (const [x, y] of [
    [142, 68], [134, 65], [123, 61], [112, 56], [102, 52],
    [92, 46], [81, 41], [70, 34], [101, 38], [113, 31],
    [116, 5], [117, 54]
  ]) {
  addObject('road-dust', x, y, { seed: hash(x, y, 83) });
  }
  addObject('road-sign-post', 116, 5, {
    id: 'long-ash-censure-camp-sign',
    name: 'Censure Camp Sign',
    seed: hash(116, 5, 89),
    interact: {
      type: 'secret-entrance',
      dialogue: 'long-ash-censure-road-camp-exit',
      log: 'The board points toward the Censure road camp. Dark undergrowth crowds the way north.'
    },
    mapMarker: { label: 'Censure Road Camp', kind: 'exit', reveal: 'always' }
  });
  addObject('road-sign-post', 117, 55, {
    id: 'long-ash-remnant-spur-sign',
    name: 'Remnant Spur Sign',
    seed: hash(117, 55, 89),
    interact: {
      type: 'note',
      log: 'The old waypost points down the Remnant capital road. The bell nail is empty.'
    }
  });
  addObject('road-sign-post', 141, 67, {
    id: 'long-ash-start-sign',
    name: 'Ash Chapel Sign',
    seed: hash(141, 67, 89),
    interact: {
      type: 'note',
      log: 'The plank points back toward Ash Chapel. Fresh boot cuts in the dust all lead north.'
    }
  });
}

function placeRoadContentPass() {
  addObject('broken-bell', 121, 63, {
    id: 'long-ash-old-bell-marker',
    blocking: true,
    name: 'Old Bell Marker',
    seed: hash(121, 63, 191),
    interact: {
      type: 'note',
      log: 'The field bell has been split through the mouth. Someone took the clapper and scratched the road office mark from the yoke.'
    }
  });
  addObject('candle-cluster', 120, 62, {
    id: 'long-ash-old-bell-candles',
    seed: hash(120, 62, 193)
  });
  addObject('wax-stain', 120, 63, {
    id: 'long-ash-old-bell-wax',
    seed: hash(120, 63, 195)
  });
  addObject('rubble-decal', 122, 64, {
    id: 'long-ash-old-bell-rubble',
    seed: hash(122, 64, 197)
  });
  addObject('road-dust', 121, 64, {
    id: 'long-ash-old-bell-road-dust',
    seed: hash(121, 64, 199)
  });

  addObject('field-cart', 104, 50, {
    id: 'long-ash-stripped-cart',
    blocking: true,
    orient: 'nw',
    name: 'Stripped Cart',
    seed: hash(104, 50, 201),
    interact: {
      type: 'note',
      log: 'The cart was dragged sideways and stripped clean. Red thread is caught on the left wheel.'
    }
  });
  addObject('field-satchel', 107, 52, {
    id: 'long-ash-cart-satchel',
    name: 'Cart Satchel',
    seed: hash(107, 52, 203),
    interact: {
      type: 'container',
      log: 'A small satchel is tied under the cart bed. The cultists missed the knot.',
      loot: [
        { item: 'ducat', count: 6 },
        { item: 'field-dressing', count: 1 }
      ]
    }
  });
  addObject('road-dust', 104, 50, {
    id: 'long-ash-stripped-cart-dust',
    seed: hash(104, 50, 205)
  });
  addObject('rubble-decal', 105, 51, {
    id: 'long-ash-stripped-cart-rubble',
    seed: hash(105, 51, 207)
  });
  addObject('road-dust', 106, 51, {
    id: 'long-ash-cart-drag-dust',
    seed: hash(106, 51, 209)
  });
}

function placeCalcifiedBrothers() {
  addObject('calcified-crossroad-brother', 113, 31, {
    id: 'long-ash-crossroad-brother',
    blocking: true,
    name: 'Garron Holt',
    seed: hash(113, 31, 173),
    interact: {
      type: 'note',
      dialogue: 'long-ash-crossroad-brother',
      log: 'The man at the crossroads points with both hands. One calcified arm aims up the Hallowfen road.'
    }
  });

  addObject('calcified-scarecrow-brother', 50, 35, {
    id: 'long-ash-field-brother',
    blocking: true,
    name: 'Edrin Holt',
    seed: hash(50, 35, 175),
    interact: {
      type: 'note',
      dialogue: 'long-ash-field-brother',
      log: 'A calcified man stands lashed above the wheat. His face is still soft enough to move.'
    }
  });

  addObject('field-satchel', 83, 31, {
    id: 'long-ash-holt-forest-stash',
    name: 'Old Holt Stash',
    seed: hash(83, 31, 177),
    interact: {
      type: 'container',
      log: 'The roots hide a tarred field satchel. The leather has gone stiff, but the knot kept the water out.',
      loot: [
        { item: 'ducat', count: 12 },
        { item: 'road-warden-chit', count: 1 },
        { item: 'tarnished-saint-token', count: 1 }
      ]
    }
  });
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
placeCalcifiedBrothers();
scatterForest();
placeMapEdges();
placeWheatModels();
placeFarmMachinery();
placeFarmVictims();
placeInfectedCave();
placeRoadContentPass();

objects.sort((a, b) => (a.y - b.y) || (a.x - b.x) || a.kind.localeCompare(b.kind));

const level = {
  id: 'long-ash-road-approach',
  name: 'Long Ash Road Approach',
  intro: 'The Hallowfen road opens into dead wheat, dark tree cover, and a graveyard where the infected were buried standing.',
  width: WIDTH,
  height: HEIGHT,
  tileSize: 64,
  quests: ['investigate-ash-chapel-cult', 'calcified-brothers'],
  dialogue: FARM_DOOR_DIALOGUES,
  tiles: tiles.map((row) => row.join('')),
  legend: {
    '.': { kind: 'floor', floor: 'ash-dirt', walkable: true },
    r: { kind: 'floor', floor: 'ash-road', walkable: true },
    s: { kind: 'floor', floor: 'road-shoulder', walkable: true },
    w: { kind: 'floor', floor: 'wheat-field', walkable: true },
    f: { kind: 'floor', floor: 'furrow-field', walkable: true },
    d: { kind: 'floor', floor: 'forest-floor', walkable: true },
    g: { kind: 'floor', floor: 'graveyard-earth', walkable: true },
    H: { kind: 'farmhouse-building-block', walkable: false },
    B: { kind: 'barn-building-block', walkable: false },
    T: { kind: 'tool-shed-building-block', walkable: false },
    S: { kind: 'storage-shed-building-block', walkable: false },
    G: { kind: 'grain-shed-building-block', walkable: false }
  },
  mood: {
    floorShade: '#15130e',
    floorShadeAlpha: 0.02,
    ambient: '#b8aa83',
    ambientAlpha: 0.09,
    vignette: 0.24,
    sun: {
      enabled: true,
      shadowOffsetX: 12,
      shadowOffsetY: 6,
      shadowAlpha: 0.12
    }
  },
  spawns: {
    player: { actor: 'mara-vey', x: START.x, y: START.y },
    enemies: INFECTED_CAVE_OUTSIDE_WOLVES.map((wolf, index) => ({
      ...wolf,
      encounter: 'infected-cave-mouth',
      spawnId: `infected-cave-mouth-wolf-${index + 1}`,
      aggroRadius: 2
    })),
    npcs: []
  },
  combatTriggers: [
    {
      id: 'infected-cave-mouth-trigger',
      encounter: 'infected-cave-mouth',
      x: 90,
      y: 12,
      radius: 3,
      forceCombat: true,
      intro: [
        'Three shapes uncoil from the rocks. The wolves still move like a pack.'
      ]
    }
  ],
  victoryLog: 'The cave mouth falls quiet. The black entrance remains.',
  objects
};

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(level, null, 2)}\n`, 'utf8');
console.log(`Generated ${outputPath}`);
