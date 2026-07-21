// Authoring source for data/levels/ash_chapel_catacombs.json. This script is the
// canonical source of that level: edit it and re-run to regenerate. It builds a
// long north-south spine with branching galleries, packs the dead densely
// (bone niches lining the walls, skeletons and kneeling calcified dead across
// the floors, cobwebs in the corners), verifies every interactable is reachable
// from the spawn, and writes the level JSON.
// Run: node scripts/gen-catacombs.mjs
import { writeFile } from 'node:fs/promises';

const W = 40;
const H = 50;

function rngFrom(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rng = rngFrom(20260619);

const rooms = {
  entry:    { x0: 15, y0: 2,  x1: 24, y1: 5 },
  fever:    { x0: 3,  y0: 7,  x1: 15, y1: 14 },
  heretic:  { x0: 24, y0: 7,  x1: 36, y1: 14 },
  criminal: { x0: 3,  y0: 18, x1: 15, y1: 26 },
  loud:     { x0: 24, y0: 18, x1: 36, y1: 26 },
  unmarked: { x0: 8,  y0: 30, x1: 31, y1: 38 },
  shrine:   { x0: 12, y0: 41, x1: 27, y1: 47 }
};
const corridors = [
  { x0: 18, y0: 4, x1: 21, y1: 45 },  // the spine
  { x0: 15, y0: 10, x1: 18, y1: 11 }, // fever -> spine
  { x0: 21, y0: 10, x1: 24, y1: 11 }, // heretic -> spine
  { x0: 15, y0: 22, x1: 18, y1: 23 }, // criminal -> spine
  { x0: 21, y0: 22, x1: 24, y1: 23 }, // loud -> spine
  { x0: 18, y0: 38, x1: 21, y1: 41 }  // unmarked -> shrine link
];

const tiles = Array.from({ length: H }, () => Array(W).fill('#'));
const carve = (r) => { for (let y = r.y0; y <= r.y1; y += 1) for (let x = r.x0; x <= r.x1; x += 1) tiles[y][x] = '.'; };
Object.values(rooms).forEach(carve);
corridors.forEach(carve);

const walkable = (x, y) => x >= 0 && y >= 0 && x < W && y < H && tiles[y][x] === '.';
const objects = [];
const used = new Set();
const key = (x, y) => `${x},${y}`;
const reserve = (x, y) => used.add(key(x, y));
const add = (o) => { objects.push(o); if (o.blocking) reserve(o.x, o.y); };

const spawn = { x: 20, y: 4 };
reserve(spawn.x, spawn.y);

add({
  id: 'catacombs-return-stair', kind: 'loose-flagstone', x: 20, y: 2, name: 'Stone Stair Up',
  interact: { type: 'secret-exit', dialogue: 'ash-chapel-catacombs-return', log: 'The cut stair climbs back toward the cellar.' }
});

const note = (x, y, name, dialogue, log) => {
  add({ id: `catacombs-note-${dialogue}`, kind: 'paper-scraps', x, y, name, interact: { type: 'note', dialogue, log } });
  reserve(x, y);
};

const dirs4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const hasWall = (x, y) => dirs4.some(([dx, dy]) => tiles[y + dy]?.[x + dx] === '#');
const inRoom = (r, x, y) => x >= r.x0 && x <= r.x1 && y >= r.y0 && y <= r.y1;
const isMouth = (r, x, y) => dirs4.some(([dx, dy]) => walkable(x + dx, y + dy) && !inRoom(r, x + dx, y + dy));
const web = (x, y) => { if (walkable(x, y) && !used.has(key(x, y))) { add({ kind: 'cobweb', x, y, seed: x * 5 + y * 3 }); reserve(x, y); } };

// Reserve interactables and set-pieces FIRST so the dense bone-fill flows
// around them and never buries a note or a berth.
note(22, 4, 'Warden\'s Burial Ledger', 'ash-chapel-catacombs-ledger', 'A tin ledger nailed to the stair-head, the warden\'s hand counting his dead.');
note(5, 7, 'Warden\'s Note: the Sick', 'ash-chapel-catacombs-fever', 'A note pinned over the first gallery, where the fevered were laid.');
note(35, 7, 'Warden\'s Note: the Doubters', 'ash-chapel-catacombs-heretics', 'A note carved over a row of niches, each scratched with the question that earned it.');
note(4, 18, 'Warden\'s Note: the Useful Dead', 'ash-chapel-catacombs-criminals', 'A work-tally nailed to a post above the chained dead.');
note(35, 18, 'Warden\'s Note: the Loud Ones', 'ash-chapel-catacombs-politicals', 'A note above the largest row, in a tighter and angrier hand.');
note(9, 31, 'Warden\'s Last Tally', 'ash-chapel-catacombs-deep', 'A page torn from the ledger and left on the bones, the counting given up.');
note(20, 47, 'Warden\'s Shrine Confession', 'ash-chapel-catacombs-shrine', 'A confession folded into the hands of a skeleton crowned with carved thorn.');

add({ id: 'catacombs-fever-sealed-berth', kind: 'stone-tomb', x: 5, y: 13, blocking: true, name: 'Sealed Berth', interact: { type: 'container', log: 'A berth in the fever wall, its slab dragged aside.', loot: [{ item: 'field-dressing', count: 1 }] } });
add({ id: 'catacombs-foreman-berth', kind: 'stone-tomb', x: 13, y: 25, blocking: true, name: 'Foreman\'s Berth', interact: { type: 'container', log: 'A larger berth, the slab carved with a tally of work done.', loot: [{ item: 'relic-rounds', count: 1 }] } });
add({ id: 'catacombs-unnamed-berth', kind: 'stone-tomb', x: 26, y: 25, blocking: true, name: 'Unnamed Berth', interact: { type: 'container', log: 'A berth with the name chiselled off the slab.', loot: [{ item: 'tarnished-saint-token', count: 1 }] } });
add({ id: 'catacombs-bone-reliquary', kind: 'rusted-reliquary', x: 29, y: 37, blocking: true, name: 'Bone Reliquary', interact: { type: 'container', log: 'A reliquary stuffed with sorted finger-bones instead of relics.', loot: [{ item: 'choir-hymnal-fragment', count: 1 }] } });
add({ kind: 'host-growth', x: 6, y: 13 });
add({ kind: 'host-growth', x: 12, y: 8 });

// Pack a room: cobwebs in the corners, bone niches dense along the walls,
// skeletons and kneeling calcified dead across the floor, sparse cold candles.
function fillRoom(r, opts = {}) {
  const { nicheP = 0.55, skelP = 0.34, pileP = 0.07, penP = 0.05, candleEvery = 4, candleP = 0.55, webP = 0.16 } = opts;
  for (const [x, y] of [[r.x0, r.y0], [r.x1, r.y0], [r.x0, r.y1], [r.x1, r.y1]]) web(x, y); // corner webs
  for (let y = r.y0; y <= r.y1; y += 1) {
    for (let x = r.x0; x <= r.x1; x += 1) {
      if (!walkable(x, y) || used.has(key(x, y))) continue;
      const edge = x === r.x0 || x === r.x1 || y === r.y0 || y === r.y1;
      if (edge && hasWall(x, y) && !isMouth(r, x, y)) {
        if (rng() < nicheP) { add({ kind: 'bone-niche', x, y, blocking: true }); continue; }
        if (rng() < webP) { web(x, y); continue; } // webs strung along the walls
      }
      if ((x - r.x0) % candleEvery === 0 && (y - r.y0) % candleEvery === 0 && rng() < candleP) {
        add({ kind: 'candle-cluster', x, y }); reserve(x, y); continue;
      }
      const rr = rng();
      if (rr < penP) add({ kind: 'calcified-penitent', x, y, blocking: true });
      else if (rr < penP + pileP) { add({ kind: 'bone-pile', x, y }); reserve(x, y); }
      else if (rr < penP + pileP + skelP) { add({ kind: 'skeleton', x, y, seed: x * 7 + y * 13 }); reserve(x, y); }
      else if (rng() < 0.05) { add({ kind: 'dust', x, y }); reserve(x, y); }
    }
  }
}

fillRoom(rooms.fever);
fillRoom(rooms.heretic);
fillRoom(rooms.criminal);
fillRoom(rooms.loud);
fillRoom(rooms.unmarked, { nicheP: 0.5, skelP: 0.32 });
fillRoom(rooms.shrine, { penP: 0.16, skelP: 0.26, candleP: 0.7 }); // the warden's posed 'saints'
add({ kind: 'candle-cluster', x: 16, y: 3 });
add({ kind: 'candle-cluster', x: 23, y: 3 });
fillRoom(rooms.entry, { nicheP: 0.35, skelP: 0.12, penP: 0, candleEvery: 3, webP: 0.25 });

for (const [x, y] of [[12, 33], [20, 33], [27, 33], [16, 36], [24, 36], [16, 44], [23, 44]]) {
  if (walkable(x, y) && !used.has(key(x, y))) add({ kind: 'cracked-column', x, y, blocking: true });
}

// Spine: niches packed against the side walls, the fallen scattered down the
// lane, cold candles every few strides, webs where the corridor meets a wall.
for (let y = 6; y <= 44; y += 1) {
  for (const x of [18, 21]) {
    if (walkable(x, y) && !used.has(key(x, y)) && hasWall(x, y)) {
      if (rng() < 0.5) add({ kind: 'bone-niche', x, y, blocking: true });
      else if (rng() < 0.18) web(x, y);
    }
  }
  for (const x of [19, 20]) {
    if (walkable(x, y) && !used.has(key(x, y)) && rng() < 0.3) { add({ kind: 'skeleton', x, y, seed: x + y * 5 }); reserve(x, y); }
  }
  if (y % 5 === 0 && walkable(19, y) && !used.has(key(19, y))) { add({ kind: 'candle-cluster', x: 19, y }); reserve(19, y); }
}

// --- Reachability: every interactable must be reachable from the spawn ------
const blocked = new Set();
for (const o of objects) if (o.blocking) blocked.add(key(o.x, o.y));
const seen = new Set([key(spawn.x, spawn.y)]);
const stack = [[spawn.x, spawn.y]];
while (stack.length) {
  const [x, y] = stack.pop();
  for (const [dx, dy] of dirs4) {
    const nx = x + dx; const ny = y + dy;
    if (!walkable(nx, ny) || blocked.has(key(nx, ny)) || seen.has(key(nx, ny))) continue;
    seen.add(key(nx, ny)); stack.push([nx, ny]);
  }
}
const reachable = (x, y) => seen.has(key(x, y)) || dirs4.some(([dx, dy]) => seen.has(key(x + dx, y + dy)));
const unreachable = objects.filter((o) => o.interact && !reachable(o.x, o.y));
if (unreachable.length) {
  console.error('UNREACHABLE:', unreachable.map((o) => `${o.name ?? o.kind}@${o.x},${o.y}`));
  process.exit(1);
}

const level = {
  id: 'ash-chapel-catacombs',
  name: 'Ash Chapel Catacombs',
  intro: 'The stair gives onto cold that has not moved in years. Small pale shapes repeat through the dark in the order the warden imposed on his dead. The cut stair behind you leads back up; click it when you have seen enough.',
  width: W,
  height: H,
  tileSize: 64,
  quests: ['investigate-ash-chapel-cult'],
  dialogue: [
    'ash-chapel-catacombs-return',
    'ash-chapel-catacombs-ledger',
    'ash-chapel-catacombs-fever',
    'ash-chapel-catacombs-heretics',
    'ash-chapel-catacombs-criminals',
    'ash-chapel-catacombs-politicals',
    'ash-chapel-catacombs-deep',
    'ash-chapel-catacombs-shrine'
  ],
  mood: { floorShade: '#0a0f15', floorShadeAlpha: 0.48, ambient: '#0a141c', ambientAlpha: 0.13, vignette: 1.85 },
  tiles: tiles.map((row) => row.join('')),
  legend: {
    '#': { kind: 'wall', walkable: false },
    b: { kind: 'wall-broken', walkable: false, height: 30 },
    '.': { kind: 'floor', walkable: true }
  },
  spawns: { player: { actor: 'mara-vey', x: spawn.x, y: spawn.y }, enemies: [] },
  groundItems: [
    { id: 'catacombs-entry-saint-token', item: 'tarnished-saint-token', count: 1, x: 19, y: 6 }
  ],
  objects
};

await writeFile('data/levels/ash_chapel_catacombs.json', JSON.stringify(level, null, 2) + '\n');
const counts = {};
for (const o of objects) counts[o.kind] = (counts[o.kind] ?? 0) + 1;
console.log(`wrote ${W}x${H} catacombs, ${objects.length} objects, all interactables reachable`);
console.log('prop counts:', JSON.stringify(counts));
