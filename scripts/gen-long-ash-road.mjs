import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const outputPath = join(root, 'data', 'levels', 'long_ash_road_approach.json');

const WIDTH = 160;
const HEIGHT = 70;
const START = { x: 142, y: 68 };
const WALKABLE_TILES = new Set(['.', 'r', 's', 'w', 'f', 'd', 'g']);
const GRAVEYARD = { x0: 126, x1: 148, y0: 47, y1: 59 };
const GRAVEYARD_CHAPELS = [
  { tile: 'V', kind: 'graveyard-vigil-chapel-block', x0: 130, x1: 131, y0: 45, y1: 46 },
  { tile: 'M', kind: 'graveyard-mortuary-chapel-block', x0: 141, x1: 142, y0: 44, y1: 46 }
];
const INFECTED_CAVE = { x: 90, y: 10 };
const EDRIN_FIELD_POSITION = Object.freeze({ x: 50, y: 35 });
const groundItems = [
  { id: 'long-ash-charcoal-cart-rounds', item: 'relic-rounds', count: 2, x: 119, y: 49 },
  { id: 'long-ash-warden-cart-ration', item: 'tinned-beans', count: 1, x: 111, y: 23 },
  { id: 'long-ash-holt-forest-dressing', item: 'field-dressing', count: 1, x: 93, y: 25 },
  { id: 'long-ash-east-road-chit', item: 'road-warden-chit', count: 1, x: 108, y: 52 },
  { id: 'long-ash-grave-road-ducats', item: 'ducat', count: 3, x: 137, y: 61 },
  { id: 'long-ash-west-field-gear', item: 'penitent-gear-scrap', count: 1, x: 29, y: 36 },
  { id: 'long-ash-cave-trail-token', item: 'tarnished-saint-token', count: 1, x: 90, y: 15 }
];
const LONG_ASH_DIALOGUES = [
  'long-ash-carter-edda-farr',
  'long-ash-stage-iv-cart-ambush',
  'long-ash-farmhouse-door',
  'long-ash-barn-door',
  'long-ash-storage-shed-door',
  'long-ash-grain-shed-door',
  'long-ash-tool-shed-door',
  'long-ash-infected-cave-entrance',
  'long-ash-wolf-cultist-evidence',
  'long-ash-censure-road-camp-exit',
  'long-ash-crossroad-brother',
  'long-ash-field-brother',
  'long-ash-vigil-chapel-entry',
  'long-ash-mortuary-chapel-entry',
  'long-ash-listening-shortcut-return'
];
const LONG_ASH_JOURNAL_NOTES = [
  {
    flag: 'long-ash-edda-spared-account-heard',
    text: 'The cultists left Deborah alive after she failed their test for Remnant loyalty. They took the cart because it could be sold.'
  },
  {
    flag: 'long-ash-stage-iv-cart-recognized',
    text: 'The overturned cart in the Stage IV trap is Deborah Carbo\'s. Her white hub cord and spilled charcoal survived the road west.'
  },
  {
    flag: 'long-ash-carter-road-account-heard',
    text: 'Deborah Carbo saw a Censure wagon stop at the north route post. Red-cuffed cultists stole her cart before the old bell gave three closure peals.'
  },
  {
    flag: 'long-ash-carter-wheel-crush-read',
    text: 'Deborah Carbo\'s crushed foot had swollen for hours before the closure peals. The thieves dropped her cart wheel across it during the robbery.'
  },
  {
    flag: 'long-ash-carter-cart-knot-revealed',
    text: 'Red office wax on Deborah Carbo\'s knife matched a cord tucked under the stripped cart axle farther up the road.'
  },
  {
    flag: 'long-ash-pump-sabotage-found',
    text: 'Quarry grit was pressed behind the Carbo pump collar. The handle would survive while the inner sleeve wore itself raw.'
  },
  {
    flag: 'long-ash-farm-cart-drag-read',
    text: 'Five separate heel cuts leave the Carbo farm cart toward the east lane. The yard was swept after the load passed.'
  },
  {
    flag: 'long-ash-holt-death-order-read',
    text: 'The Carbo father died from the throat wound. The cross nails and ritual cuts were made after his blood had stopped.'
  },
  {
    flag: 'long-ash-holt-erased-defense-read',
    text: 'Short defensive cuts on the Carbo father carry no black-gold reaction. A postmortem opening was carved across them to hide the struggle.'
  },
  {
    flag: 'long-ash-tool-coffer-opened',
    text: 'A buckled coffer under the Carbo tool rack held one clean dressing and two Penitent gear teeth.'
  },
  {
    flag: 'long-ash-cart-axle-cord-found',
    text: 'A waxed cord under the stripped cart axle carries a road-office knot. Someone used it to hold the brake pin out of sight.'
  },
  {
    flag: 'long-ash-cart-sabotage-proved',
    text: 'The stripped cart axle failed in a forced sequence. The brake pin was pulled first, then the left wheel was struck loose after the cart stopped.'
  },
  {
    flag: 'long-ash-kill-site-wounds-read',
    text: 'The cultist at the kill site died from a narrow chest puncture. Wolf damage came later, once the body was already cooling.'
  },
  {
    flag: 'long-ash-kill-site-no-opening-found',
    text: 'No fresh Host opening began in the kill-site corpse. The black-gold residue was rubbed into dead cuts from another source.'
  },
  {
    flag: 'long-ash-wolf-prayer-knots-found',
    text: 'Prayer knots were tied across a dead Host wolf after its ribs had cooled. The Censure pattern at the kill site was staged.'
  },
  {
    flag: 'long-ash-old-bell-clapper-removed',
    text: 'The old field bell lost its clapper to tools, not weather. Four wrench bites remain under the yoke.'
  },
  {
    flag: 'long-ash-old-bell-peal-rule-read',
    text: 'Three peal rules remain on the old bell yoke. A fourth was cut away with a narrow office chisel.'
  },
  {
    flag: 'long-ash-bell-cache-found',
    text: 'Loose road stone beside the old bell covered a dry satchel with Censure entry tools, a road chit, and four ducats.'
  },
  {
    flag: 'long-ash-grave-order-read',
    text: 'The graveyard bodies were already calcified when they were set upright. Stone dust lies beneath the old lifting abrasions.'
  },
  {
    flag: 'long-ash-grave-burial-error-found',
    text: 'The burial crew wrapped the faces first and left opened ribs exposed to runoff. Their containment order was reversed.'
  },
  {
    flag: 'long-ash-grave-response-pattern-found',
    text: 'Every black-gold seam in the grave cluster bends toward the old bell marker. The bodies answered one signal before the stone fixed them.'
  },
  {
    flag: 'long-ash-warden-route-strip-found',
    text: 'A stopped warden cart carried a route strip for the north spur. Its final checkpoint was struck out in red wax.'
  },
  {
    flag: 'long-ash-route-post-peal-rule-found',
    text: 'The north route post once ordered a fourth peal before road closure. The rule was shaved away after the post was mounted.'
  },
  {
    flag: 'long-ash-dry-stave-cache-found',
    text: 'One broken supply barrel kept a dry inner stave. Beans and a sealed field dressing were wrapped behind it.'
  },
  {
    flag: 'long-ash-forest-cache-found',
    text: 'Three nearly erased placement signs led to a tarred cache in the northeast woods.'
  },
  {
    flag: 'long-ash-holt-stash-knot-read',
    text: 'Eleazar Carbo\'s directions led to his old forest satchel. The outer knot was false, tied to shed rain while the inner cord stayed dry.'
  }
];
const INFECTED_CAVE_OUTSIDE_WOLVES = [
  { id: 'host-wolf-spider', x: 88, y: 13, facing: 'se' },
  { id: 'host-wolf-maw', x: 91, y: 13, facing: 's' },
  { id: 'host-wolf-ribsplit', x: 94, y: 12, facing: 'sw' }
];
const GRAVEYARD_BODIES = [
  {
    id: 'grave-eren-voss',
    name: 'Aaron Crispus',
    variant: 'kneeling-fused-hands',
    x: 129,
    y: 50,
    log: 'Aaron Crispus kneels in the ash with both hands fused under his chin. The stone kept the prayer and lost the man.',
    search: {
      title: 'Calcified Grave Cluster',
      lines: [
        'Aaron faces the road. The bodies behind him stand at different angles, each set above a packed grave.'
      ],
      useLabel: 'Inspect Aaron Crispus',
      methods: [
        {
          id: 'compare-grave-calcification',
          label: 'Compare the calcification order',
          field: 'medicine',
          dc: 45,
          successLog: 'Stone dust lies beneath old lifting abrasions. These bodies were already calcified when they were set upright.',
          failLog: 'Weather has rounded the fractures until age and handling look alike.',
          success: {
            setFlag: 'long-ash-grave-order-read'
          }
        },
        {
          id: 'audit-grave-handling',
          label: 'Audit the burial handling',
          field: 'containment',
          dc: 60,
          successLog: 'The crew wrapped the faces first and left opened ribs exposed to runoff. Their containment order was reversed.',
          failLog: 'Old wraps and wash marks do not give up a safe handling sequence.',
          success: {
            setFlag: 'long-ash-grave-burial-error-found'
          }
        },
        {
          id: 'read-grave-response-pattern',
          label: 'Trace the fixed black-gold seams',
          field: 'hostSigns',
          dc: 65,
          successLog: 'Every seam bends toward the old bell marker. The bodies answered one signal before the stone fixed them.',
          failLog: 'The seams break at too many weathered joints to prove a shared direction.',
          success: {
            setFlag: 'long-ash-grave-response-pattern-found'
          }
        }
      ]
    }
  },
  {
    id: 'grave-sister-maud-arel',
    name: 'Sister Monica',
    variant: 'broken-halo',
    x: 132,
    y: 50,
    log: 'Sister Monica went pale around a broken ring of bone. Half the halo lies in chips at her feet.'
  },
  {
    id: 'grave-toma-kest',
    name: 'Thomas Silo',
    variant: 'rib-open-chest',
    x: 135,
    y: 50,
    log: 'Thomas Silo stands with his ribs opened like little chapel doors. The cavity behind them is dry stone.'
  },
  {
    id: 'grave-iven-rusk',
    name: 'Isaac Rufus',
    variant: 'reaching-arm',
    x: 138,
    y: 50,
    log: 'Isaac Rufus reaches toward the fence with one stone hand. The other arm is folded into his chest.'
  },
  {
    id: 'grave-nara-vell',
    name: 'Naomi Felix',
    variant: 'goat-skull',
    x: 129,
    y: 52,
    log: 'Naomi Felix has a long goat skull where her face should be. One horn curls whole, the other snapped at the root.'
  },
  {
    id: 'grave-brother-senn-kade',
    name: 'Brother Malachi Mercator',
    variant: 'thorned-back',
    x: 132,
    y: 52,
    log: 'Brother Malachi Mercator is bent forward under pale thorns. They broke through his back and froze there.'
  },
  {
    id: 'grave-lysa-orm',
    name: 'Susanna Niger',
    variant: 'bell-jaw',
    x: 135,
    y: 52,
    log: 'Susanna Niger has a jaw pulled wide into a bell shape. Nothing rings when the wind passes through it.'
  },
  {
    id: 'grave-arno-pell',
    name: 'Aaron Celsus',
    variant: 'half-prayer-twist',
    x: 138,
    y: 52,
    log: 'Aaron Celsus is twisted halfway into prayer, one palm sealed to the chest and one elbow cracked backward.'
  },
  {
    id: 'grave-ilyen-marr',
    name: 'Jeremiah Fullo',
    variant: 'collapsed-shoulder',
    x: 129,
    y: 54,
    log: 'Jeremiah Fullo slumps under one collapsed shoulder. The ash at his feet has been packed smoother than the rest.',
    search: {
      title: "Jeremiah Fullo's Grave",
      lines: [
        'A narrow seam runs below the packed ash, too straight for weather.'
      ],
      useLabel: "Inspect Jeremiah's grave",
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
    name: 'Levi Sabinus',
    variant: 'buried-lower-body',
    x: 132,
    y: 54,
    log: 'Levi Sabinus rises only from the waist. The rest is buried in a hard swell of ash and root.'
  },
  {
    id: 'grave-otta-fen',
    name: 'Obadiah Lupus',
    variant: 'split-face',
    x: 135,
    y: 54,
    log: 'Obadiah Lupus split down the face before the Stilling took him. One side is smooth as chalk, the other all dark seam.'
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
const EXTERIOR_BUILDING_TILES = new Set(['H', 'B', 'T', 'S', 'G', ...GRAVEYARD_CHAPELS.map((chapel) => chapel.tile)]);

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
  if (isGraveyardChapelCell(x, y)) return true;
  if (x >= 12 && x <= 37 && y >= 42 && y <= 61) return true;
  if (x >= START.x - 2 && x <= START.x + 2 && y >= START.y - 2 && y <= START.y + 1) return true;
  return false;
}

function isGraveyardChapelCell(x, y) {
  return GRAVEYARD_CHAPELS.some((chapel) =>
    x >= chapel.x0 && x <= chapel.x1 && y >= chapel.y0 && y <= chapel.y1
  );
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
  if (tile === 'r' || tile === 's' || EXTERIOR_BUILDING_TILES.has(tile)) return false;
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
      const chapelRoofCell = isGraveyardChapelCell(x, y);
      if (getTile(x, y) !== 'd' && !(fringe && getTile(x, y) === '.') && !chapelRoofCell) continue;
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
      if (EXTERIOR_BUILDING_TILES.has(getTile(x, y)) || reserved.has(key(x, y))) continue;
      const bx = x + (h % 3) - 1;
      const by = y + ((h >> 4) % 3) - 1;
      if (!inBounds(bx, by) || hasObjectAt(bx, by) || isProtectedRange(bx, by)) continue;
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

  // Generations approaching Eleazar wore a small dark patch through the wheat.
  // The open ground separates his unchanged silhouette from the tall crop.
  paintRect(
    EDRIN_FIELD_POSITION.x - 1,
    EDRIN_FIELD_POSITION.y - 1,
    EDRIN_FIELD_POSITION.x + 1,
    EDRIN_FIELD_POSITION.y + 1,
    'f'
  );

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

  addObject('field-cart', 26, 47, {
    id: 'long-ash-holt-farm-cart',
    blocking: true,
    orient: 'sw',
    name: 'Carbo Farm Cart',
    seed: hash(26, 47, 47),
    interact: {
      type: 'note',
      log: 'The cart bed is empty. A broom passed over the yard behind it.',
      search: {
        title: 'Carbo Farm Cart',
        lines: [
          'Chaff fills the wheel grooves. The ground beneath the rear axle was swept in short, hurried strokes.'
        ],
        useLabel: 'Inspect the empty cart',
        methods: [
          {
            id: 'count-drag-marks',
            label: 'Read the ground beneath the axle',
            field: 'search',
            dc: 45,
            successLog: 'Five separate heel cuts leave the cart toward the east lane. The broom missed the deepest edges.',
            failLog: 'Wind and chaff break the marks into scraps with no useful order.',
            success: {
              setFlag: 'long-ash-farm-cart-drag-read'
            }
          }
        ]
      }
    }
  });
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
  addObject('water-pump', 15, 52, {
    id: 'long-ash-holt-water-pump',
    blocking: true,
    name: 'Carbo Water Pump',
    seed: hash(15, 52, 45),
    interact: {
      type: 'note',
      log: 'The handle moves. Something grinds inside the iron collar on every downstroke.',
      search: {
        title: 'Carbo Water Pump',
        lines: [
          'Rust freckles the collar, but the drag comes from deeper in the sleeve.'
        ],
        useLabel: 'Work the pump handle',
        methods: [
          {
            id: 'strip-pump-collar',
            label: 'Strip the pump collar',
            field: 'engineering',
            dc: 40,
            successLog: 'Quarry grit was pressed behind the collar. The handle would survive while the inner sleeve wore itself raw.',
            failLog: 'Old grease and chaff hide the source of the drag.',
            success: {
              setFlag: 'long-ash-pump-sabotage-found'
            }
          }
        ]
      }
    }
  });
  addObject('feed-trough', 18, 53, { blocking: true, orient: 'se', seed: hash(18, 53, 45) });
  addObject('field-plow', 23, 52, { blocking: true, orient: 'sw', seed: hash(23, 52, 45) });
  addObject('field-harrow', 27, 53, { blocking: true, orient: 'sw', seed: hash(27, 53, 45) });
  addObject('tool-rack', 34, 53, {
    id: 'long-ash-holt-tool-rack',
    blocking: true,
    name: 'Carbo Tool Rack',
    seed: hash(34, 53, 45),
    interact: {
      type: 'note',
      log: 'A low iron coffer is bolted beneath the rack. Its hinge has buckled into the lid.',
      search: {
        title: 'Carbo Tool Coffer',
        lines: [
          'The coffer has no keyway. A bent hinge and a warped lid hold it shut.'
        ],
        useLabel: 'Leave the coffer shut',
        methods: [
          {
            id: 'straighten-coffer-hinge',
            label: 'Straighten the hinge with entry hooks',
            requiresItem: 'censure-entry-roll',
            field: 'security',
            dc: 50,
            conditions: {
              notFlag: 'long-ash-tool-coffer-opened'
            },
            successLog: 'The hooks pull the hinge pin straight enough to lift the lid without breaking it.',
            failLog: 'The pin turns inside the buckle, then catches harder.',
            success: {
              setFlag: 'long-ash-tool-coffer-opened',
              inventory: {
                add: [
                  { item: 'field-dressing', count: 1 },
                  { item: 'penitent-gear-scrap', count: 2 }
                ]
              }
            }
          },
          {
            id: 'tear-coffer-hinge',
            label: 'Wrench the hinge out',
            primary: 'body',
            dc: 7,
            conditions: {
              notFlag: 'long-ash-tool-coffer-opened'
            },
            successLog: 'You brace the rack and wrench. The hinge tears free with a crack that rolls across the yard.',
            failLog: 'The rack shudders, but the coffer keeps its grip.',
            success: {
              setFlag: [
                'long-ash-tool-coffer-opened',
                'long-ash-tool-coffer-forced'
              ],
              inventory: {
                add: [
                  { item: 'field-dressing', count: 1 },
                  { item: 'penitent-gear-scrap', count: 2 }
                ]
              }
            }
          }
        ]
      }
    }
  });
  addObject('woodpile', 29, 57, { blocking: true, seed: hash(29, 57, 45) });
  addObject('field-plow', 21, 59, { blocking: true, orient: 'se', seed: hash(21, 59, 45) });
  addObject('field-harrow', 30, 55, { blocking: true, orient: 'sw', seed: hash(30, 55, 45) });
  addObject('feed-trough', 22, 59, { blocking: true, orient: 'sw', seed: hash(22, 59, 45) });
  addObject('wagon-wheel', 25, 52, { blocking: true, seed: hash(25, 52, 45) });
}

function placeFarmVictims() {
  const victims = [
    {
      x: 27,
      y: 51,
      member: 'father',
      name: 'Carbo Father',
      log: 'The father hangs with his chin against the rope. Blood dried under his collar before the cross took his weight.',
      search: {
        title: 'Carbo Father',
        lines: [
          'His throat, forearms, and the long cut over his chest carry different ages of blood.'
        ],
        useLabel: 'Inspect the body',
        methods: [
          {
            id: 'read-holt-death-order',
            label: 'Order the wounds',
            field: 'medicine',
            dc: 40,
            successLog: 'The throat wound bled freely. The cross nails and ritual cuts did not. He was dead before they raised him.',
            failLog: 'Dried blood has joined the cuts into one dark sheet.',
            success: {
              setFlag: 'long-ash-holt-death-order-read'
            }
          },
          {
            id: 'read-erased-defense',
            label: 'Read the black-gold reaction lines',
            field: 'hostSigns',
            dc: 60,
            successLog: 'Short defensive cuts carry no black-gold reaction. A postmortem opening was carved across them to hide the struggle.',
            failLog: 'The dried seams give no clear boundary between injury and ritual work.',
            success: {
              setFlag: 'long-ash-holt-erased-defense-read'
            }
          }
        ]
      }
    },
    {
      x: 29,
      y: 51,
      member: 'mother',
      name: 'Carbo Mother',
      log: 'A house key remains tied inside the mother\'s left sleeve. Her right wrist is bound with fresh grain cord.'
    },
    {
      x: 31,
      y: 51,
      member: 'grandparent',
      name: 'Carbo Grandparent',
      log: 'An old leg splint was cut away before the grandparent was lifted. The split wood lies under the cross.'
    },
    {
      x: 33,
      y: 51,
      member: 'older-child',
      name: 'Older Carbo Child',
      log: 'One boot is missing from the older child. A bare heel track ends at the yard gate.'
    },
    {
      x: 35,
      y: 51,
      member: 'younger-child',
      name: 'Younger Carbo Child',
      log: 'A small coat button is caught in the twine. The ash below the cross has not been disturbed since rain.'
    }
  ];
  for (const victim of victims) {
    addObject('blood-stain', victim.x, victim.y, { seed: hash(victim.x, victim.y, 147) });
    addObject('farm-cross-victim', victim.x, victim.y, {
      id: `long-ash-farm-victim-${victim.member}`,
      blocking: true,
      member: victim.member,
      name: victim.name,
      seed: hash(victim.x, victim.y, 149),
      interact: {
        type: 'note',
        log: victim.log,
        ...(victim.search ? { search: victim.search } : {}),
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

function paintGraveyardChapels() {
  for (const chapel of GRAVEYARD_CHAPELS) {
    paintRect(chapel.x0, chapel.y0, chapel.x1, chapel.y1, chapel.tile);
  }
}

function isGraveyardChapelClearance(x, y) {
  return GRAVEYARD_CHAPELS.some((chapel) =>
    x >= chapel.x0 - 1 && x <= chapel.x1 + 1 && y >= chapel.y0 - 2 && y <= chapel.y1
  );
}

function isGraveyardChapelEntranceWall(x, y) {
  return y === GRAVEYARD.y0 && GRAVEYARD_CHAPELS.some((chapel) => x >= chapel.x0 && x <= chapel.x1);
}

function clearGraveyardChapelViews() {
  const removable = new Set(['ash-tree', 'ash-tree-stump', 'fallen-ash-log', 'ash-sapling', 'scrub-bush']);
  for (let index = objects.length - 1; index >= 0; index -= 1) {
    const object = objects[index];
    if (!removable.has(object.kind) || !isGraveyardChapelClearance(object.x, object.y)) continue;
    if (object.blocking) reserved.delete(key(object.x, object.y));
    objects.splice(index, 1);
  }
  // The north perimeter yields to each chapel entrance. Removing these wall
  // segments after placement preserves every later generated object id.
  for (let index = objects.length - 1; index >= 0; index -= 1) {
    const object = objects[index];
    if (object.kind !== 'graveyard-wall' || !isGraveyardChapelEntranceWall(object.x, object.y)) continue;
    if (object.blocking) reserved.delete(key(object.x, object.y));
    objects.splice(index, 1);
  }
  // A narrow strip of cemetery earth keeps the chapels from reading as sheds
  // dropped into the forest. It changes after forest scatter so existing ids
  // on the long road remain stable when the generator is rerun.
  for (const chapel of GRAVEYARD_CHAPELS) {
    paintRect(chapel.x0 - 1, chapel.y0 - 1, chapel.x1 + 1, chapel.y1, 'g');
    paintRect(chapel.x0, chapel.y0, chapel.x1, chapel.y1, chapel.tile);
    paintRect(chapel.x0, GRAVEYARD.y0, chapel.x1, GRAVEYARD.y0 + 1, 's');
  }
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
  const bodyPlots = new Set(GRAVEYARD_BODIES.map((body) => key(body.x, body.y)));
  for (const [x, y] of GRAVEYARD_PLOTS) {
    const plotOrient = ((x + y) & 1) ? 'sw' : 'se';
    addObject('graveyard-packed-ash', x, y, {
      seed: hash(x, y, 64)
    });
    addObject('calcified-grave-plot', x, y, {
      orient: plotOrient,
      seed: hash(x, y, 65)
    });
    // A grave with a calcified body gets no cut stone: the dead were stood
    // upright at the head of their own plots and left as the markers.
    if (!bodyPlots.has(key(x, y))) {
      addObject('calcified-headstone', x, y - 1, {
        blocking: true,
        seed: hash(x, y, 66)
      });
    }
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
    seed: hash(GRAVEYARD_CATACOMB.x, GRAVEYARD_CATACOMB.y, 78),
    name: 'Ash-Choked Catacomb Mouth',
    interact: {
      type: 'secret-entrance',
      dialogue: 'long-ash-listening-shortcut-return',
      log: 'Stone steps end at packed ash. A colder draft waits behind it.'
    },
    mapMarker: {
      label: 'Catacomb Mouth',
      kind: 'exit',
      reveal: 'explored'
    }
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

function placeGraveyardChapelEntries() {
  addObject('graveyard-path-stones', 131, 47, {
    id: 'long-ash-vigil-chapel-entry',
    seed: hash(131, 47, 88),
    name: 'Vigil Chapel Door',
    clickAreas: [
      { x0: 129, y0: 45, x1: 130, y1: 46 },
      { x0: 130, y0: 46, x1: 131, y1: 47 }
    ],
    interactionMarker: { x: 130, y: 46 },
    interact: {
      type: 'secret-entrance',
      dialogue: 'long-ash-vigil-chapel-entry',
      log: 'A narrow chapel door stands beyond the graveyard wall gap.'
    },
    mapMarker: {
      label: 'Vigil Chapel',
      kind: 'exit',
      reveal: 'explored'
    }
  });
  addObject('graveyard-path-stones', 142, 47, {
    id: 'long-ash-mortuary-chapel-entry',
    seed: hash(142, 47, 89),
    name: 'Mortuary Chapel Door',
    clickAreas: [
      { x0: 140, y0: 45, x1: 141, y1: 46 },
      { x0: 141, y0: 46, x1: 142, y1: 47 }
    ],
    interactionMarker: { x: 141, y: 46 },
    interact: {
      type: 'secret-entrance',
      dialogue: 'long-ash-mortuary-chapel-entry',
      log: 'Broad steps rise to the mortuary door. Old wash water has whitened their edges.'
    },
    mapMarker: {
      label: 'Mortuary Chapel',
      kind: 'exit',
      reveal: 'explored'
    }
  });
}

function placeGraveyardAttendantShrine() {
  addObject('censure-attendant-shrine', 136, 48, {
    id: 'long-ash-censure-attendant-shrine',
    name: 'Censure Attendant Shrine',
    blocking: true,
    seed: hash(136, 48, 90),
    interactionMarker: { x: 136, y: 49 },
    activationCell: { x: 137, y: 48 },
    interact: { type: 'drone-shrine' }
  });
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
  paintGraveyardChapels();
  placeGraveyardWalls();
  placeGraveyardPlots();
  placeGraveyardCatacomb();
  placeGraveyardDressing();
  placeGraveyardChapelEntries();
  placeGraveyardAttendantShrine();
  // Each body stands one tile up from its plot, planted where a headstone
  // would go: the dead mark their own graves.
  for (const body of GRAVEYARD_BODIES) {
    addObject('calcified-grave-body', body.x, body.y - 1, {
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
      if (
        Math.abs(x - EDRIN_FIELD_POSITION.x) <= 2 &&
        Math.abs(y - EDRIN_FIELD_POSITION.y) <= 2
      ) continue;
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
    {
      id: 'long-ash-kill-cultist-west',
      x: 96,
      y: 33,
      log: 'The western cultist fell with one hand trapped under the breastplate. Small teeth worried the free cuff.'
    },
    {
      id: 'long-ash-kill-cultist-south',
      x: 99,
      y: 36,
      log: 'The southern cultist lost a boot in the mud. Wolf bites climb one calf and stop below the knee.'
    },
    {
      id: 'long-ash-kill-cultist-stable',
      x: 103,
      y: 32,
      log: 'This cultist lies clear of the churned center. A narrow puncture marks the chest under the torn robe.',
      search: {
        title: 'Cultist at the Kill Site',
        lines: [
          'The chest wound, wolf tears, and black-gold smears do not share the same edge.'
        ],
        useLabel: 'Inspect the cultist',
        methods: [
          {
            id: 'separate-kill-site-wounds',
            label: 'Separate the wound ages',
            field: 'medicine',
            dc: 45,
            successLog: 'The chest puncture killed him. Wolf damage came later, once the body was already cooling.',
            failLog: 'Mud and tooth damage have chewed the wound margins past an easy reading.',
            success: {
              setFlag: 'long-ash-kill-site-wounds-read'
            }
          },
          {
            id: 'test-for-fresh-opening',
            label: 'Test the black-gold wound edges',
            field: 'hostSigns',
            dc: 60,
            successLog: 'No fresh Host opening began here. Residue from another source was rubbed into cuts after death.',
            failLog: 'Old blood and black-gold grit answer each other too closely to separate.',
            success: {
              setFlag: 'long-ash-kill-site-no-opening-found'
            }
          }
        ]
      }
    },
    {
      id: 'long-ash-kill-cultist-east',
      x: 105,
      y: 35,
      log: 'A snapped knife rests under the eastern cultist. The blade carries cloth, not fur.'
    },
    {
      id: 'long-ash-kill-cultist-center',
      x: 101,
      y: 34,
      log: 'The center cultist died face down. Someone rolled the body once, searched the belt, then set it back.'
    }
  ];
  for (const cultist of cultists) {
    addObject('dead-cultist', cultist.x, cultist.y, {
      id: cultist.id,
      seed: hash(cultist.x, cultist.y, 71),
      name: 'Dead Cultist',
      interact: {
        type: 'note',
        dialogue: 'long-ash-wolf-cultist-evidence',
        log: cultist.log,
        ...(cultist.search ? { search: cultist.search } : {})
      }
    });
  }
  addObject('dead-host-wolf-spider', 98, 32, {
    id: 'long-ash-kill-wolf-spider',
    seed: hash(98, 32, 73),
    name: 'Dead Host Wolf',
    interact: {
      type: 'note',
      dialogue: 'long-ash-wolf-cultist-evidence',
      log: 'The six-legged wolf folded under itself. Two cult knife cuts cross the bite damage along its flank.'
    }
  });
  addObject('dead-host-wolf-maw', 102, 35, {
    id: 'long-ash-kill-wolf-maw',
    seed: hash(102, 35, 73),
    name: 'Dead Host Wolf',
    interact: {
      type: 'note',
      dialogue: 'long-ash-wolf-cultist-evidence',
      log: 'The throat-mawed wolf died biting through a red stole. The cloth is still wedged behind its inner teeth.'
    }
  });
  addObject('dead-host-wolf-ribsplit', 105, 33, {
    id: 'long-ash-kill-wolf-ribsplit',
    seed: hash(105, 33, 73),
    name: 'Dead Host Wolf',
    interact: {
      type: 'note',
      dialogue: 'long-ash-wolf-cultist-evidence',
      log: 'Prayer cord has been tied across the rib-split wolf. The knots sit above blood that had already dried.',
      search: {
        title: 'Rib-Split Host Wolf',
        lines: [
          'The cord follows a Censure binding pattern, but no field hand would tie it this far from the opened joints.'
        ],
        useLabel: 'Inspect the prayer cord',
        methods: [
          {
            id: 'read-staged-prayer-knots',
            label: 'Read the prayer knots',
            field: 'doctrine',
            dc: 50,
            successLog: 'The knots were tied after the ribs cooled. Someone staged Censure work on a body their rites never touched.',
            failLog: 'Blood has stiffened the cord into a knot with no clear order.',
            success: {
              setFlag: 'long-ash-wolf-prayer-knots-found'
            }
          }
        ]
      }
    }
  });
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
      log: 'The field bell has been split through the mouth. Someone took the clapper and scratched the road office mark from the yoke.',
      search: {
        title: 'Old Bell Marker',
        lines: [
          'Rust fills the split mouth. The yoke still carries tool bites and shallow rule notches.'
        ],
        useLabel: 'Inspect the broken bell',
        methods: [
          {
            id: 'read-clapper-removal',
            label: 'Read the clapper fitting',
            field: 'engineering',
            dc: 45,
            successLog: 'Four wrench bites sit under the yoke. The clapper pin was driven out with tools, not lost to weather.',
            failLog: 'The split mouth has shifted the fitting too far to read cleanly.',
            success: {
              setFlag: 'long-ash-old-bell-clapper-removed'
            }
          },
          {
            id: 'read-erased-peal-rule',
            label: 'Read the yoke notches',
            field: 'doctrine',
            dc: 50,
            successLog: 'Three peal rules remain. A fourth was cut away with a narrow road-office chisel.',
            failLog: 'The surviving notches could mark hours, warnings, or a clerk\'s private count.',
            success: {
              setFlag: 'long-ash-old-bell-peal-rule-read'
            }
          }
        ]
      }
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
      log: 'The cart was dragged sideways and stripped clean. Red thread is caught on the left wheel.',
      search: {
        title: 'Stripped Cart',
        lines: [
          'The left wheel leans out from the hub. Mud seals the axle bed and the brake housing.'
        ],
        useLabel: 'Inspect the stripped cart',
        methods: [
          {
            id: 'find-hidden-axle-cord',
            label: 'Search the axle bed',
            field: 'search',
            dc: 40,
            successLog: 'A waxed cord lies under the axle. Its road-office knot held the brake pin out of sight.',
            failLog: 'Mud and axle grease give you nothing but black fingers.',
            success: {
              setFlag: 'long-ash-cart-axle-cord-found'
            }
          },
          {
            id: 'reconstruct-cart-break',
            label: 'Reconstruct the break sequence',
            field: 'engineering',
            dc: 55,
            successLog: 'The brake pin was pulled first. Someone struck the wheel loose only after the stopped cart had settled.',
            failLog: 'Too many hands stripped the running gear after the break.',
            success: {
              setFlag: 'long-ash-cart-sabotage-proved'
            }
          }
        ]
      }
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

  addObject('field-satchel', 107, 34, {
    id: 'long-ash-kill-site-satchel',
    name: 'Discarded Kill-Site Satchel',
    seed: hash(107, 34, 211),
    visibleWhenFlags: [
      'long-ash-kill-site-wounds-read'
    ],
    interact: {
      type: 'container',
      log: 'Beyond the corpse with the narrow chest wound, a satchel strap follows the last clean line through the mud.',
      loot: [
        { item: 'ducat', count: 2 },
        { item: 'road-warden-chit', count: 1 }
      ]
    }
  });

  addObject('rubble-decal', 124, 62, {
    id: 'long-ash-bell-cache-stones',
    name: 'Loose Shoulder Stones',
    seed: hash(124, 62, 213),
    hiddenWhenFlags: [
      'long-ash-bell-cache-found'
    ],
    interact: {
      type: 'note',
      log: 'Flat shoulder stones press into the wet road edge beside the bell.',
      search: {
        title: 'Bell-Side Road Cache',
        lines: [
          'Rain has packed the shoulder flat. Only the stone edges can show which one was lifted and set back.'
        ],
        methods: [
          {
            id: 'trace-bell-cache-stones',
            label: 'Trace the reset stones',
            field: 'search',
            dc: 55,
            successLog: 'Three stones sit on dry grit. The middle one lifts, exposing the satchel knot.',
            failLog: 'Every stone carries the same wet ash and road pressure.',
            success: {
              setFlag: 'long-ash-bell-cache-found'
            }
          }
        ]
      }
    }
  });
  addObject('field-satchel', 124, 62, {
    id: 'long-ash-bell-side-satchel',
    name: 'Bell-Side Road Cache',
    seed: hash(124, 62, 214),
    visibleWhenFlags: [
      'long-ash-bell-cache-found'
    ],
    interact: {
      type: 'container',
      log: 'A tarred satchel waits in the dry hollow below the lifted stones.',
      loot: [
        { item: 'ducat', count: 4 },
        { item: 'censure-entry-roll', count: 1 },
        { item: 'road-warden-chit', count: 1 }
      ]
    }
  });

  addObject('field-cart', 113, 23, {
    id: 'long-ash-stopped-warden-cart',
    blocking: true,
    orient: 'nw',
    name: 'Stopped Warden Cart',
    seed: hash(113, 23, 215)
  });
  addObject('sealed-storage-crate', 112, 23, {
    id: 'long-ash-warden-cart-crate',
    blocking: true,
    name: 'Warden Cart Crate',
    seed: hash(112, 23, 217),
    interact: {
      type: 'container',
      log: 'The crate is still roped to the stopped cart. A route pocket has been stitched beneath the lid.',
      lock: {
        id: 'long-ash-warden-cart-crate-lock',
        title: 'Warden Cart Crate',
        lines: [
          'Wet rope crosses the lid. One corner sits higher where paper has kept the wood from swelling.'
        ],
        methods: [
          {
            id: 'recover-warden-route-strip',
            label: 'Find the route pocket',
            field: 'search',
            dc: 45,
            successLog: 'A waxed route strip slides from under the lid. Its final north-spur checkpoint is struck out in red.',
            failLog: 'Rope, wet wood, and old wax make every seam look deliberate.',
            success: {
              setFlag: 'long-ash-warden-route-strip-found'
            }
          }
        ]
      },
      loot: [
        { item: 'ducat', count: 4 },
        { item: 'tinned-beans', count: 1 },
        { item: 'relic-rounds', count: 1 }
      ]
    }
  });

  addObject('road-sign-post', 118, 18, {
    id: 'long-ash-north-route-post',
    name: 'North Route Post',
    seed: hash(118, 18, 219),
    interact: {
      type: 'note',
      log: 'A rule board faces the Censure road. One line was shaved down after the post was mounted.',
      search: {
        title: 'North Route Post',
        lines: [
          'Three peal orders remain under the road-office seal. The bare strip below them is the width of a fourth.'
        ],
        useLabel: 'Inspect the route post',
        methods: [
          {
            id: 'restore-route-peal-rule',
            label: 'Reconstruct the missing peal rule',
            field: 'doctrine',
            dc: 45,
            successLog: 'The missing line ordered a fourth peal before road closure. It was shaved away after the board was fixed in place.',
            failLog: 'The surviving orders do not fix the missing line\'s office or purpose.',
            success: {
              setFlag: 'long-ash-route-post-peal-rule-found'
            }
          }
        ]
      }
    }
  });

  addObject('rusted-barrel', 55, 62, {
    id: 'long-ash-dry-stave-barrel',
    blocking: true,
    name: 'Broken Supply Barrel',
    seed: hash(55, 62, 221),
    interact: {
      type: 'container',
      log: 'One stave has split outward. The barrel smells of wet iron and old beans.',
      lock: {
        id: 'long-ash-dry-stave-lock',
        title: 'Broken Supply Barrel',
        lines: [
          'Rain reached the outer staves. A narrow hollow remains somewhere behind the iron band.'
        ],
        methods: [
          {
            id: 'find-dry-inner-stave',
            label: 'Find the dry inner stave',
            field: 'search',
            dc: 40,
            successLog: 'One stave sounds dry. Its inner slat lifts over a sealed wrap.',
            failLog: 'Every stave answers with the same wet thud.',
            success: {
              setFlag: 'long-ash-dry-stave-cache-found'
            }
          }
        ]
      },
      loot: [
        { item: 'tinned-beans', count: 1 },
        { item: 'field-dressing', count: 1 }
      ]
    }
  });

  addObject('ash-tree-stump', 145, 25, {
    id: 'long-ash-forest-cache-stump',
    blocking: true,
    name: 'Split Ash Stump',
    seed: hash(145, 25, 223),
    interact: {
      type: 'note',
      log: 'A dead ash stump has split down to its roots. Old cuts crowd the exposed wood.',
      search: {
        title: 'Split Ash Stump',
        lines: [
          'The roots carry old cuts, animal rub, and weather scars. A true placement sign would be almost gone.'
        ],
        methods: [
          {
            id: 'follow-erased-cache-signs',
            label: 'Follow the placement signs',
            field: 'search',
            dc: 63,
            successLog: 'Three shallow cuts agree across separate roots. They lead your hand to a false bark flap and the cache cord.',
            failLog: 'The forest offers too many scratches and no trustworthy sequence.',
            success: {
              setFlag: 'long-ash-forest-cache-found'
            }
          }
        ]
      }
    }
  });
  addObject('field-satchel', 146, 25, {
    id: 'long-ash-forest-specialist-cache',
    name: 'Split Root Cache',
    seed: hash(146, 25, 224),
    visibleWhenFlags: [
      'long-ash-forest-cache-found'
    ],
    interact: {
      type: 'container',
      log: 'A tarred bundle is pressed under the false bark flap beside the split root.',
      loot: [
        { item: 'ducat', count: 8 },
        { item: 'relic-rounds', count: 2 },
        { item: 'tarnished-saint-token', count: 1 }
      ]
    }
  });
}

function placeCalcifiedBrothers() {
  addObject('calcified-crossroad-brother', 113, 31, {
    id: 'long-ash-crossroad-brother',
    blocking: true,
    name: 'Gideon Carbo',
    seed: hash(113, 31, 173),
    interact: {
      type: 'note',
      dialogue: 'long-ash-crossroad-brother',
      log: 'Both of the man\'s arms are fixed into directions. One calcified hand marks Hallowfen, the other the Carbo farm.'
    }
  });

  addObject('calcified-scarecrow-brother', EDRIN_FIELD_POSITION.x, EDRIN_FIELD_POSITION.y, {
    id: 'long-ash-field-brother',
    blocking: true,
    name: 'Eleazar Carbo',
    seed: hash(EDRIN_FIELD_POSITION.x, EDRIN_FIELD_POSITION.y, 175),
    interact: {
      type: 'note',
      dialogue: 'long-ash-field-brother',
      log: 'A calcified man stands lashed above the wheat. His face is still soft enough to move.'
    }
  });

  addObject('field-satchel', 83, 31, {
    id: 'long-ash-holt-forest-stash',
    name: 'Old Carbo Stash',
    seed: hash(83, 31, 177),
    visibleWhenFlags: [
      'long-ash-field-family-truth',
      'long-ash-field-family-lie'
    ],
    interact: {
      type: 'container',
      log: 'The roots hide a tarred field satchel. The leather has gone stiff, but the knot kept the water out.',
      lock: {
        id: 'long-ash-holt-stash-lock',
        title: 'Old Carbo Stash',
        lines: [
          'Eleazar described a split stump and a false outer knot. Rain has tightened both cords into the roots.'
        ],
        methods: [
          {
            id: 'read-holt-stash-knot',
            label: 'Read the false knot',
            field: 'search',
            dc: 40,
            successLog: 'The outer cord sheds rain. The dry inner loop slips free when pulled against the root grain.',
            failLog: 'Both cords bite deeper into the wet leather.',
            success: {
              setFlag: 'long-ash-holt-stash-knot-read'
            }
          }
        ]
      },
      loot: [
        { item: 'ducat', count: 12 },
        { item: 'road-warden-chit', count: 1 },
        { item: 'tarnished-saint-token', count: 1 }
      ]
    }
  });
}

function placeStrandedCarter() {
  addObject('wagon-wheel', 120, 48, {
    id: 'long-ash-edda-detached-wheel',
    name: 'Deborah Carbo\'s Detached Wheel',
    blocking: true,
    seed: hash(120, 48, 179)
  });
  addObject('grain-sack-stack', 121, 49, {
    id: 'long-ash-edda-charcoal-sacks',
    name: 'Charcoal Sacks',
    blocking: true,
    seed: hash(121, 49, 181)
  });
}

function placeStageIvCartAmbush() {
  addObject('overturned-field-cart', 77, 35, {
    id: 'long-ash-stage-iv-overturned-cart',
    name: 'Overturned Charcoal Cart',
    blocking: true,
    orient: 'sw',
    seed: hash(77, 35, 183)
  });
  addObject('stage-iv-cart-lure', 76, 35, {
    id: 'long-ash-stage-iv-cart-lure',
    name: 'Woman Beneath the Cart',
    seed: hash(76, 35, 185),
    ambient: [
      'Please. The wheel. My leg is under it.'
    ],
    hiddenWhenFlags: [
      'long-ash-stage-iv-cart-ambush-sprung'
    ]
  });
  addObject('field-satchel', 78, 36, {
    id: 'long-ash-edda-flat-purse',
    name: 'Deborah Carbo\'s Flat Purse',
    seed: hash(78, 36, 186),
    visibleWhenFlags: [
      'long-ash-stage-iv-cart-ambush-sprung'
    ],
    interact: {
      type: 'container',
      log: 'A flat purse hangs beneath the broken cart bed by a severed white cord. Twenty ducats sit inside in four short stacks.',
      loot: [
        { item: 'ducat', count: 20 }
      ],
      questUpdate: {
        quest: 'edda-farrs-account',
        stage: 'return-purse',
        log: 'Deborah\'s flat purse held twenty ducats, exactly the count she gave.'
      }
    }
  });

  // These quiet decals reserve the four emergence cells from later forest
  // scatter without announcing what waits there.
  for (const [x, y] of [[74, 31], [77, 30], [70, 35], [82, 39]]) {
    addObject('road-dust', x, y, { seed: hash(x, y, 187) });
  }
}

function placeRpgLootAndGrowth() {
  const placeIfClear = (kind, x, y, extra = {}) => {
    if (!WALKABLE_TILES.has(getTile(x, y)) || hasObjectAt(x, y)) return null;
    return addObject(kind, x, y, extra);
  };

  placeIfClear('field-backpack', 61, 41, {
    id: 'long-ash-abandoned-field-pack',
    name: 'Abandoned Field Pack',
    seed: hash(61, 41, 227),
    interact: {
      type: 'container',
      log: 'A field pack sits where the forest floor rises against the road. Mold has taken the straps, not the waxed lining.',
      loot: [
        { item: 'field-dressing', count: 1 },
        { item: 'tinned-beans', count: 1 },
        { item: 'ducat', count: 3 }
      ]
    }
  });
  placeIfClear('small-pouch', 130, 48, {
    id: 'long-ash-grave-lime-pouch',
    name: 'Lime-Stiff Pouch',
    seed: hash(130, 48, 229),
    interact: {
      type: 'container',
      log: 'A small pouch is caught between two grave stones. The cord is stiff with lime.',
      loot: [
        { item: 'ducat', count: 2 },
        { item: 'tarnished-saint-token', count: 1 }
      ]
    }
  });

  for (const [x, y] of [
    [14, 5], [35, 5], [56, 5], [70, 5], [91, 5], [105, 5],
    [133, 5], [147, 5], [21, 10], [49, 10], [77, 10], [98, 10],
    [126, 10], [14, 15], [35, 15], [63, 15], [84, 15], [105, 15],
    [140, 15], [7, 20], [42, 20], [70, 20], [98, 20], [133, 20],
    [154, 20], [21, 25], [49, 25], [77, 25], [105, 25], [140, 25],
    [14, 30], [42, 30], [63, 30], [91, 30], [126, 30], [154, 30],
    [21, 35], [49, 35], [91, 35], [119, 35]
  ]) {
    placeIfClear('dead-grass-tuft', x, y, {
      id: `long-ash-dead-grass-${x}-${y}`,
      seed: hash(x, y, 231)
    });
  }
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
placeStrandedCarter();
placeStageIvCartAmbush();
scatterForest();
placeMapEdges();
placeWheatModels();
placeFarmMachinery();
placeFarmVictims();
placeInfectedCave();
placeRoadContentPass();
clearGraveyardChapelViews();
placeRpgLootAndGrowth();

objects.sort((a, b) => (a.y - b.y) || (a.x - b.x) || a.kind.localeCompare(b.kind));

const level = {
  id: 'long-ash-road-approach',
  name: 'Long Ash Road Approach',
  intro: 'The Hallowfen road opens into dead wheat, dark tree cover, and a graveyard where no one dug graves for the calcified. They planted each one upright to stand watch over an empty plot.',
  width: WIDTH,
  height: HEIGHT,
  tileSize: 64,
  quests: ['investigate-ash-chapel-cult', 'calcified-brothers', 'edda-farrs-account'],
  dialogue: LONG_ASH_DIALOGUES,
  journalNotes: LONG_ASH_JOURNAL_NOTES,
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
    G: { kind: 'grain-shed-building-block', walkable: false },
    ...Object.fromEntries(
      GRAVEYARD_CHAPELS.map((chapel) => [chapel.tile, { kind: chapel.kind, walkable: false }])
    )
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
    enemies: [
      ...INFECTED_CAVE_OUTSIDE_WOLVES.map((wolf, index) => ({
        ...wolf,
        encounter: 'infected-cave-mouth',
        spawnId: `infected-cave-mouth-wolf-${index + 1}`,
        aggroRadius: 2
      })),
      {
        id: 'stage-iv-lure',
        x: 76,
        y: 35,
        facing: 'se',
        encounter: 'long-ash-stage-iv-cart-ambush',
        spawnId: 'long-ash-stage-iv-lure',
        aggroRadius: 0,
        dormantUntilCombat: true
      },
      ...[
        { x: 74, y: 31, facing: 'se', spriteId: 'stage-iv-runner-ash' },
        { x: 77, y: 30, facing: 's', spriteId: 'stage-iv-runner-road' },
        { x: 70, y: 35, facing: 'e', spriteId: 'stage-iv-runner-road' },
        { x: 82, y: 39, facing: 'nw', spriteId: 'stage-iv-runner-ash' }
      ].map((runner, index) => ({
        id: 'stage-iv-runner',
        ...runner,
        encounter: 'long-ash-stage-iv-cart-ambush',
        spawnId: `long-ash-stage-iv-runner-${index + 1}`,
        aggroRadius: 0,
        dormantUntilCombat: true
      }))
    ],
    npcs: [
      {
        actor: 'long-ash-carter-edda-farr',
        x: 118,
        y: 47,
        facing: 'sw',
        dialogue: 'long-ash-carter-edda-farr',
        ambient: [
          'The dry sacks went north. The wet one stayed honest.'
        ],
        mapMarker: {
          label: 'Deborah Carbo',
          kind: 'dialogue',
          reveal: 'explored'
        }
      }
    ]
  },
  combatTriggers: [
    {
      id: 'long-ash-stage-iv-cart-ambush-trigger',
      encounter: 'long-ash-stage-iv-cart-ambush',
      x: 76,
      y: 35,
      radius: 5,
      dialogue: 'long-ash-stage-iv-cart-ambush',
      intro: [
        'Four bodies break from the ash scrub. Stolen coats hang over strips of red cloth, and every head turns with the old woman.',
        'The runners come low, ribs working open with each stride.'
      ]
    },
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
  groundItems,
  objects
};

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(level, null, 2)}\n`, 'utf8');
console.log(`Generated ${outputPath}`);
