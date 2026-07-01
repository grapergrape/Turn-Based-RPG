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
    y: 30,
    facing: 'se',
    dialogue: 'censure-road-camp-runa',
    ambient: ['No seal, no ration. A sad face is not a seal.'],
    mapMarker: { label: 'Quartermaster Runa', kind: 'dialogue', reveal: 'always' }
  },
  {
    actor: 'censure-sutler-maev',
    x: 49,
    y: 35,
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
    y: 46,
    facing: 'nw',
    dialogue: 'censure-road-camp-hanne',
    ambient: ['If you bleed on the tent flap, wipe it before you faint.'],
    mapMarker: { label: 'Sister Hanne', kind: 'dialogue', reveal: 'explored' }
  },
  {
    actor: 'censure-ash-porter-joric',
    x: 39,
    y: 33,
    facing: 'se',
    dialogue: 'censure-road-camp-joric',
    ambient: ['A crate gets a destination. A porter gets a shrug. I envy crates.'],
    mapMarker: { label: 'Ash Porter Joric', kind: 'dialogue', reveal: 'explored' }
  },
  {
    actor: 'censure-evidence-keeper-malco',
    x: 58,
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
  return tile === '.' || tile === 'r' || tile === 's';
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
  addObject('canvas-tent', 16, 16, {
    id: 'censure-road-odran-private-tent',
    blocking: true,
    name: "Father Odran's Tent",
    seed: hash(16, 16, 35),
    interact: {
      type: 'note',
      log: "Father Odran's private tent smells of lamp oil, damp canvas, and shaving soap.",
      lock: {
        id: 'censure-road-odran-tent-flap',
        title: "Father Odran's Tent",
        lines: [
          'A private flap is tied with ledger cord. The knot is ordinary. The consequences are not.'
        ],
        methods: [
          {
            id: 'open-ledger-cord',
            label: 'Open the ledger cord',
            field: 'security',
            dc: 55,
            successLog: 'The cord comes loose without snapping the wax fleck.',
            failLog: 'The knot holds, and the canvas gives a loud dry pop.'
          }
        ]
      },
      search: {
        title: "Father Odran's Tent",
        lines: [
          'A cot, a travel chest, and folded church linen fill the private tent.'
        ],
        useLabel: 'Inspect the tent',
        methods: [
          {
            id: 'search-folded-linen',
            label: 'Search the folded linen',
            field: 'search',
            dc: 45,
            conditions: {
              flagsAbsent: ['odran-late-visit-suspected', 'odran-late-visit-seen', 'odran-late-visit-resolved']
            },
            successLog: "Under a stack of priestly cloth, you find a woman's underlinen tucked hard against the chest wall.",
            failLog: 'The linen is folded too tightly. If there is a secret here, it stays flat.',
            success: {
              setFlag: 'odran-late-visit-suspected',
              log: "The hidden underlinen gives you a reason to watch Father Odran's tent after last bell."
            }
          }
        ]
      }
    },
    mapMarker: { label: "Father Odran's Tent", kind: 'locked', reveal: 'explored' }
  });
  addObject('canvas-tent', 18, 13, {
    id: 'censure-road-writ-chapel-west',
    blocking: true,
    name: 'Writ Chapel',
    seed: hash(18, 13, 37),
    mapMarker: { label: 'Writ Chapel', kind: 'note', reveal: 'always' }
  });
  addObject('canvas-tent', 22, 13, {
    id: 'censure-road-writ-chapel-east',
    blocking: true,
    name: 'Writ Chapel',
    seed: hash(22, 13, 37)
  });
  addObject('chapel-banner', 19, 15, { id: 'censure-road-chapel-banner', blocking: true, seed: hash(19, 15, 39) });
  addObject('prayer-lectern', 21, 16, {
    id: 'censure-road-writ-lectern',
    blocking: true,
    name: 'Writ Lectern',
    seed: hash(21, 16, 41),
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
  addObject('canvas-tent', 45, 9, {
    id: 'censure-road-preceptor-tent',
    blocking: true,
    name: 'Preceptor Tent',
    seed: hash(45, 9, 61),
    mapMarker: { label: 'Preceptor Tent', kind: 'dialogue', reveal: 'always' }
  });
  addObject('settlement-table', 47, 11, { id: 'censure-road-preceptor-table', blocking: true, seed: hash(47, 11, 63) });
  addObject('paper-scraps', 48, 12, { id: 'censure-road-preceptor-slate-scraps', seed: hash(48, 12, 65) });
  addObject('rusted-crate', 43, 12, { id: 'censure-road-preceptor-crate', blocking: true, seed: hash(43, 12, 67) });
}

function placeDrillYard() {
  for (const cell of [
    [42, 22], [52, 22], [42, 28], [52, 28]
  ]) {
    addObject('quarantine-barricade', cell[0], cell[1], {
      blocking: true,
      seed: hash(cell[0], cell[1], 71)
    });
  }
  addObject('chalk-drawing', 47, 25, { id: 'censure-road-drill-yard-chalk', seed: hash(47, 25, 73) });
  addObject('tool-rack', 43, 25, { id: 'censure-road-drill-yard-rack', blocking: true, seed: hash(43, 25, 75) });
  addObject('field-harrow', 51, 26, { id: 'censure-road-drill-yard-harrow', blocking: true, orient: 'sw', seed: hash(51, 26, 77) });
}

function placeQuartermaster() {
  addObject('settlement-table', 28, 29, {
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
    [25, 28, 'sealed-storage-crate'],
    [26, 31, 'rusted-crate'],
    [31, 28, 'sealed-storage-crate'],
    [32, 31, 'rusted-barrel']
  ]) {
    addObject(kind, x, y, {
      id: `censure-road-quartermaster-${kind}-${x}-${y}`,
      blocking: true,
      seed: hash(x, y, 83)
    });
  }
}

function placeSupplyAndTrader() {
  for (const [x, y] of [
    [38, 32], [41, 32], [38, 35], [42, 35]
  ]) {
    addObject('canvas-tent', x, y, {
      id: `censure-road-supply-tent-${x}-${y}`,
      blocking: true,
      name: 'Supply Tent',
      seed: hash(x, y, 89),
      ...(x === 38 && y === 32 ? { mapMarker: { label: 'Supply Tents', kind: 'note', reveal: 'always' } } : {})
    });
  }
  for (const [x, y, kind] of [
    [36, 34, 'sealed-storage-crate'],
    [37, 36, 'rusted-crate'],
    [43, 33, 'sealed-storage-crate'],
    [44, 35, 'rusted-barrel']
  ]) {
    addObject(kind, x, y, {
      id: `censure-road-supply-${kind}-${x}-${y}`,
      blocking: true,
      seed: hash(x, y, 91)
    });
  }
  addObject('field-cart', 50, 34, {
    id: 'censure-road-sutler-cart',
    blocking: true,
    orient: 'nw',
    name: "Maev's Cart",
    seed: hash(50, 34, 93),
    mapMarker: { label: 'Sutler Trader', kind: 'dialogue', reveal: 'always' }
  });
  addObject('settlement-table', 48, 34, { id: 'censure-road-sutler-table', blocking: true, seed: hash(48, 34, 95) });
  addObject('low-stool', 47, 36, { id: 'censure-road-sutler-stool', blocking: true, seed: hash(47, 36, 97) });
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
  addObject('canvas-tent', 61, 45, {
    id: 'censure-road-medic-tent',
    blocking: true,
    name: 'Medic Tent',
    seed: hash(61, 45, 107),
    mapMarker: { label: 'Medic Tent', kind: 'dialogue', reveal: 'always' }
  });
  addObject('camp-bedroll', 63, 46, { id: 'censure-road-medic-bedroll', seed: hash(63, 46, 109) });
  addObject('wash-tub', 58, 45, { id: 'censure-road-medic-wash-tub', blocking: true, seed: hash(58, 45, 111) });
}

function placeQuarters() {
  for (const [x, y] of [
    [13, 36], [17, 36], [13, 40], [18, 40]
  ]) {
    addObject('canvas-tent', x, y, {
      id: `censure-road-cult-breaker-tent-${x}-${y}`,
      blocking: true,
      name: 'Cult-Breaker Quarters',
      seed: hash(x, y, 113),
      ...(x === 13 && y === 36 ? { mapMarker: { label: 'Cult-Breaker Quarters', kind: 'note', reveal: 'always' } } : {})
    });
  }
  for (const [x, y] of [
    [15, 38], [20, 38], [16, 41]
  ]) {
    addObject('camp-bedroll', x, y, { id: `censure-road-bedroll-${x}-${y}`, seed: hash(x, y, 115) });
  }
  addObject('campfire', 19, 39, { id: 'censure-road-quarters-fire', seed: hash(19, 39, 117) });
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
      const h = hash(x, y, 131);
      if ((h % 100) >= (tile === 'r' ? 36 : 13)) continue;
      addObject('road-dust', x, y, { seed: h });
    }
  }
}

function placeSmallDressing() {
  for (const [x, y, kind] of [
    [24, 17, 'wax-stain'],
    [27, 18, 'paper-scraps'],
    [30, 28, 'paper-scraps'],
    [35, 41, 'rubble-decal'],
    [54, 35, 'road-dust'],
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
placeRoadDust();
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
    u: { kind: 'ash-tree', floor: 'forest-floor', walkable: false },
    v: { kind: 'scrub-bush', floor: 'forest-floor', walkable: false },
    l: { kind: 'fallen-ash-log', floor: 'forest-floor', walkable: false },
    t: { kind: 'ash-tree-stump', floor: 'forest-floor', walkable: false },
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

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(level, null, 2)}\n`, 'utf8');
console.log(`Generated ${outputPath}`);
