import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const ROOT = new URL('../', import.meta.url);

const MAP_SPECS = {
  'south-measure-intake-undercroft': {
    path: './data/levels/south_measure_intake_undercroft.json',
    walls: ['south-measure-intake-wall'],
    floors: [
      'relief-channel-junction',
      'relief-channel-x',
      'relief-channel-y',
      'south-measure-slab'
    ],
    minimumDensity: 0.055,
    kinds: {
      'clinic-bed': 4,
      'intake-screening-frame': 4,
      'mesh-cage-panel': 8,
      'relief-machine': 8,
      'service-pipe-run': 15,
      'south-measure-brass-hook-memorial': 1,
      'south-measure-pipe-gantry': 3,
      'south-measure-storage': 12,
      'utility-railing': 18
    }
  },
  'south-measure-relief-drain': {
    path: './data/levels/south_measure_relief_drain.json',
    walls: ['south-measure-service-wall'],
    floors: [
      'relief-channel-junction',
      'relief-channel-x',
      'relief-channel-y',
      'stone'
    ],
    minimumDensity: 0.105,
    kinds: {
      'intake-screening-frame': 3,
      'relief-machine': 2,
      'rubble-decal': 7,
      'service-hatch': 5,
      'service-pipe-run': 10,
      'south-measure-drain-reeds': 4,
      'utility-railing': 18
    }
  },
  'south-measure-relief-maintenance-annex': {
    path: './data/levels/south_measure_relief_maintenance_annex.json',
    walls: ['south-measure-service-wall'],
    floors: ['south-measure-slab', 'south-measure-yard'],
    minimumDensity: 0.1,
    kinds: {
      'collapsed-culvert': 1,
      'fixed-hoist': 1,
      'intake-pump-assembly': 4,
      'mesh-cage-panel': 9,
      'relief-machine': 10,
      'rubble-pile': 3,
      'scorch-mark': 7,
      'service-pipe-run': 25,
      'south-measure-repair-rack': 4,
      'overturned-field-cart': 1
    }
  },
  'south-measure-morrow-freight-house': {
    path: './data/levels/south_measure_morrow_freight_house.json',
    walls: ['south-measure-freight-wall'],
    floors: ['farm-plank'],
    minimumDensity: 0.1,
    kinds: {
      'farm-bed': 4,
      'fixed-hoist': 1,
      'freight-scale': 1,
      'freight-wagon': 2,
      'low-stool': 8,
      'mesh-cage-panel': 12,
      'paper-scraps': 6,
      'sealed-storage-crate': 9,
      'south-measure-return-stall': 1,
      'south-measure-storage': 5,
      'south-measure-worktable': 4
    }
  },
  'south-measure-compact-clinic': {
    path: './data/levels/south_measure_compact_clinic.json',
    walls: ['canvas-tent-interior-wall'],
    floors: ['worn-canvas'],
    minimumDensity: 0.08,
    kinds: {
      'clinic-bed': 7,
      'cloth-partition': 21,
      'farm-bed': 1,
      'low-stool': 6,
      'paper-scraps': 5,
      'service-pipe-run': 11,
      'south-measure-medicine-cart': 9,
      'south-measure-queue-rail': 21,
      'south-measure-storage': 12,
      'south-measure-worktable': 5,
      'field-satchel': 1,
      'road-dust': 60,
      'wash-wall': 2
    }
  },
  'south-measure-measure-hall': {
    path: './data/levels/south_measure_measure_hall.json',
    walls: ['south-measure-domestic-wall'],
    floors: ['farm-plank'],
    minimumDensity: 0.095,
    kinds: {
      'candle-cluster': 5,
      'chalk-drawing': 3,
      'dining-bench': 4,
      'low-stool': 10,
      'road-dust': 45,
      'south-measure-storage': 6,
      'south-measure-custody-rest': 1,
      'south-measure-wall-board': 9,
      'south-measure-water-lesson': 3,
      'south-measure-worktable': 18,
      'stone-stairwell': 1
    }
  },
  'south-measure-varo-house': {
    path: './data/levels/south_measure_varo_house.json',
    walls: ['south-measure-domestic-wall'],
    floors: ['south-measure-row'],
    minimumDensity: 0.13,
    kinds: {
      'cloth-partition': 12,
      'dining-bench': 3,
      'farm-bed': 2,
      'low-stool': 10,
      'road-dust': 24,
      'south-measure-storage': 6,
      'south-measure-water-vessels': 4,
      'south-measure-worktable': 2,
      'tool-rack': 3
    }
  },
  'south-measure-hidden-rows': {
    path: './data/levels/south_measure_hidden_rows.json',
    walls: ['south-measure-domestic-wall'],
    floors: ['south-measure-row'],
    minimumDensity: 0.12,
    kinds: {
      'candle-cluster': 6,
      'dining-bench': 4,
      'farm-bed': 3,
      'laundry-line': 6,
      'road-dust': 30,
      'service-pipe-run': 25,
      'shared-oven': 2,
      'south-measure-water-vessels': 3,
      'utility-railing': 12,
      'wash-tub': 2
    }
  },
  'south-measure-charity-cellar': {
    path: './data/levels/south_measure_charity_cellar.json',
    walls: ['south-measure-intake-wall'],
    floors: ['south-measure-slab'],
    minimumDensity: 0.14,
    kinds: {
      'charity-cot': 1,
      'cloth-partition': 3,
      'collapsed-culvert': 1,
      'paper-scraps': 4,
      'road-dust': 30,
      'south-measure-medicine-cart': 6,
      'south-measure-storage': 12,
      'south-measure-worktable': 2,
      'stone-stairwell': 1
    }
  }
};

async function readJson(path) {
  return JSON.parse(await readFile(new URL(path, ROOT), 'utf8'));
}

function sortedUnique(values) {
  return [...new Set(values)].sort();
}

function objectsMatching(level, kinds, predicate = () => true) {
  const allowed = new Set(Array.isArray(kinds) ? kinds : [kinds]);
  return (level.objects ?? []).filter((object) => allowed.has(object.kind) && predicate(object));
}

function kindCount(level, kind) {
  return objectsMatching(level, kind).length;
}

function variantCount(level, kind, variant) {
  return objectsMatching(level, kind, (object) => object.variant === variant).length;
}

function region({ minX = -Infinity, maxX = Infinity, minY = -Infinity, maxY = Infinity }) {
  return (object) => (
    object.x >= minX
    && object.x <= maxX
    && object.y >= minY
    && object.y <= maxY
  );
}

function walkableCellCount(level) {
  let count = 0;
  for (const row of level.tiles) {
    for (const tile of row) {
      if (level.legend[tile]?.walkable) count += 1;
    }
  }
  return count;
}

function floorCells(level, floorStyles) {
  const styles = new Set(Array.isArray(floorStyles) ? floorStyles : [floorStyles]);
  const cells = [];
  for (let y = 0; y < level.height; y += 1) {
    for (let x = 0; x < level.width; x += 1) {
      if (styles.has(level.legend[level.tiles[y][x]]?.floor)) cells.push({ x, y });
    }
  }
  return cells;
}

function span(cells, axis) {
  assert.ok(cells.length > 0, `cannot measure an empty ${axis} span`);
  const values = cells.map((cell) => cell[axis]);
  return Math.max(...values) - Math.min(...values) + 1;
}

function interiorRowsWithoutWalls(level) {
  let count = 0;
  for (let y = 1; y < level.height - 1; y += 1) {
    let open = true;
    for (let x = 1; x < level.width - 1; x += 1) {
      if (!level.legend[level.tiles[y][x]]?.walkable) {
        open = false;
        break;
      }
    }
    if (open) count += 1;
  }
  return count;
}

function widestUnblockedRun(level, minY, maxY) {
  const blocked = new Set(
    (level.objects ?? [])
      .filter((object) => object.blocking)
      .map((object) => `${object.x},${object.y}`)
  );
  let widest = 0;
  for (let y = minY; y <= maxY; y += 1) {
    let current = 0;
    for (let x = 1; x < level.width - 1; x += 1) {
      const walkable = level.legend[level.tiles[y][x]]?.walkable;
      if (walkable && !blocked.has(`${x},${y}`)) {
        current += 1;
        widest = Math.max(widest, current);
      } else {
        current = 0;
      }
    }
  }
  return widest;
}

function hasHorizontalLane(level, minX, maxX, minY, maxY) {
  const blocked = new Set(
    (level.objects ?? [])
      .filter((object) => object.blocking)
      .map((object) => `${object.x},${object.y}`)
  );
  const open = (x, y) => (
    x >= minX && x <= maxX && y >= minY && y <= maxY
    && level.legend[level.tiles[y][x]]?.walkable
    && !blocked.has(`${x},${y}`)
  );
  const queue = [];
  const seen = new Set();
  for (let y = minY; y <= maxY; y += 1) {
    if (!open(minX, y)) continue;
    queue.push({ x: minX, y });
    seen.add(`${minX},${y}`);
  }
  for (let index = 0; index < queue.length; index += 1) {
    const cell = queue[index];
    if (cell.x === maxX) return true;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const next = { x: cell.x + dx, y: cell.y + dy };
      const key = `${next.x},${next.y}`;
      if (seen.has(key) || !open(next.x, next.y)) continue;
      seen.add(key);
      queue.push(next);
    }
  }
  return false;
}

function assertRegionCount(level, label, kinds, bounds, minimum) {
  const count = objectsMatching(level, kinds, region(bounds)).length;
  assert.ok(count >= minimum, `${level.id} ${label} has ${count} objects, expected at least ${minimum}`);
}

function assertBroadDistribution(level) {
  const quadrantCounts = [0, 0, 0, 0];
  for (const object of level.objects ?? []) {
    const east = object.x >= level.width / 2 ? 1 : 0;
    const south = object.y >= level.height / 2 ? 2 : 0;
    quadrantCounts[east + south] += 1;
  }
  const minimum = Math.max(4, Math.floor(level.objects.length * 0.08));
  for (const [index, count] of quadrantCounts.entries()) {
    assert.ok(count >= minimum, `${level.id} quadrant ${index} has ${count} objects, expected at least ${minimum}`);
  }
}

function assertUndercroft(level) {
  const channel = floorCells(level, ['relief-channel-x', 'relief-channel-y', 'relief-channel-junction']);
  assert.ok(channel.length >= 180, `${level.id} needs a visually dominant maintenance channel`);
  assert.ok(span(channel, 'y') >= level.height * 0.85, `${level.id} channel must run along most of the east side`);
  assert.ok(Math.min(...channel.map((cell) => cell.x)) >= level.width * 0.7, `${level.id} channel moved out of the east maintenance band`);
  assert.equal(kindCount(level, 'intake-clerk-wicket'), 1, `${level.id} needs one fused Clerk wicket`);
  assertRegionCount(level, 'northwest records vault', ['south-measure-storage', 'mesh-cage-panel', 'paper-scraps', 'sealed-storage-crate'], { maxX: 19, maxY: 17 }, 18);
  assertRegionCount(level, 'north triage wicket', ['intake-screening-frame', 'intake-clerk-wicket', 'mesh-cage-panel', 'utility-railing', 'south-measure-worktable'], { minX: 20, maxX: 42, maxY: 13 }, 14);
  assertRegionCount(level, 'southwest examination room', ['clinic-bed', 'cloth-partition', 'medicine-cart', 'south-measure-medicine-cart', 'wash-wall'], { maxX: 19, minY: 19 }, 14);
  assertRegionCount(level, 'center-east pump chamber', ['relief-machine', 'intake-pump-assembly', 'machine-oil', 'service-pipe-run', 'south-measure-pipe-gantry'], { minX: 20, maxX: 42, minY: 14 }, 18);
  assertRegionCount(level, 'east maintenance channel dressing', ['utility-railing', 'service-pipe-run', 'intake-pump-assembly', 'machine-oil', 'south-measure-pipe-gantry'], { minX: 42 }, 24);
  assertRegionCount(level, 'civil processing wall', ['south-measure-wall-board', 'south-measure-brass-hook-memorial', 'utility-railing'], { minX: 20, maxX: 38, minY: 35 }, 12);
  assert.ok(variantCount(level, 'south-measure-wall-board', 'handprints') >= 2, `${level.id} needs a visible consolidated lime-handprint trace`);
  const galleryPipes = objectsMatching(level, 'service-pipe-run', region({ minX: 27, maxX: 35, minY: 21, maxY: 21 }));
  const galleryRails = objectsMatching(level, 'utility-railing', region({ minX: 27, maxX: 35, minY: 23, maxY: 23 }));
  assert.equal(galleryPipes.length, 9, `${level.id} pipe gallery needs one continuous nine-cell pipe run`);
  assert.equal(galleryRails.length, 9, `${level.id} pipe gallery needs one continuous nine-cell rail run`);
  assert.ok(galleryPipes.every((object) => object.connected), `${level.id} pipe gallery lost its connection metadata`);
  assertRegionCount(level, 'grated pipe gallery', ['service-hatch', 'south-measure-pipe-gantry', 'south-measure-repair-rack'], { minX: 25, maxX: 38, minY: 19, maxY: 23 }, 9);
  const machineBank = objectsMatching(level, 'relief-machine', region({ minX: 20, maxX: 41, minY: 14, maxY: 27 }));
  for (const machine of machineBank) {
    const nearest = Math.min(...machineBank
      .filter((other) => other !== machine)
      .map((other) => Math.abs(other.x - machine.x) + Math.abs(other.y - machine.y)));
    assert.ok(nearest <= 4, `${level.id} machine at ${machine.x},${machine.y} became an isolated token`);
  }
}

function assertDrain(level) {
  const channel = floorCells(level, ['relief-channel-x', 'relief-channel-y', 'relief-channel-junction']);
  assert.ok(channel.length >= 150, `${level.id} needs a broad polluted lower channel`);
  assert.ok(span(channel, 'x') >= level.width * 0.88, `${level.id} channel must span most of the map`);
  assert.ok(Math.min(...channel.map((cell) => cell.y)) >= level.height / 2, `${level.id} channel must remain on the lower bank`);
  const walkRails = objectsMatching(level, 'utility-railing', region({ minX: 2, maxX: 41, minY: 10, maxY: 10 }));
  assert.equal(walkRails.length, 40, `${level.id} raised walk needs one continuous forty-cell rail run`);
  assert.deepEqual(
    walkRails.map((object) => object.x).sort((a, b) => a - b),
    Array.from({ length: 40 }, (_, index) => index + 2),
    `${level.id} raised walk rail developed a gap`
  );
  assertRegionCount(
    level,
    'worked repair trench',
    ['service-hatch', 'south-measure-repair-rack', 'south-measure-worktable', 'tool-rack', 'sealed-storage-crate', 'utility-railing', 'machine-oil', 'paper-scraps'],
    { minX: 18, maxX: 24, minY: 2, maxY: 7 },
    12
  );
  assertRegionCount(
    level,
    'collapsed channel termination',
    ['collapsed-culvert', 'service-pipe-run', 'rubble-pile', 'rubble-decal'],
    { minX: 39, minY: 13, maxY: 17 },
    7
  );
  assertRegionCount(
    level,
    'coupled isolation station',
    ['relief-machine', 'intake-pump-assembly', 'service-pipe-run'],
    { minX: 8, maxX: 16, minY: 1, maxY: 8 },
    6
  );
  assertRegionCount(
    level,
    'inhabited resident alcove',
    ['farm-bed', 'laundry-line', 'south-measure-water-vessels', 'low-stool', 'shared-oven', 'candle-cluster', 'south-measure-storage'],
    { minX: 28, maxX: 36, minY: 2, maxY: 8 },
    7
  );
  assertRegionCount(level, 'failed filter line', 'intake-screening-frame', { minX: 33, maxX: 37, minY: 14, maxY: 16 }, 3);
  assertRegionCount(level, 'flooded repair cache', ['rusted-crate', 'south-measure-repair-rack', 'service-pipe-run'], { minX: 29, maxX: 31, minY: 15, maxY: 16 }, 3);
  assertRegionCount(level, 'lower-channel damage', ['machine-oil', 'rubble-decal', 'rubble-pile', 'south-measure-drain-reeds', 'rusted-crate'], { minY: 12 }, 20);
  assert.ok(widestUnblockedRun(level, 9, 11) >= 28, `${level.id} lost the long open raised-walk sightline`);
}

function assertAnnex(level) {
  const cageBack = objectsMatching(level, 'mesh-cage-panel', region({ minX: 11, maxX: 29, minY: 2, maxY: 2 }));
  const cageFront = objectsMatching(level, 'mesh-cage-panel', region({ minX: 11, maxX: 29, minY: 7, maxY: 7 }));
  const cageSides = objectsMatching(level, 'mesh-cage-panel', (object) => (
    (object.x === 11 || object.x === 29) && object.y >= 3 && object.y <= 6
  ));
  assert.equal(cageBack.length, 19, `${level.id} parts cage lost its continuous back perimeter`);
  assert.equal(cageFront.length, 16, `${level.id} parts cage needs one deliberate three-cell gate`);
  assert.equal(cageSides.length, 8, `${level.id} parts cage lost a side perimeter`);
  assertRegionCount(level, 'north parts cage stock', 'south-measure-storage', { minX: 11, maxX: 29, minY: 3, maxY: 6 }, 4);
  assertRegionCount(level, 'west generator room', ['relief-machine', 'intake-pump-assembly', 'rusted-barrel'], { maxX: 9, minY: 9, maxY: 18 }, 8);
  assertRegionCount(level, 'central machine floor', ['relief-machine', 'intake-pump-assembly', 'service-pipe-run', 'south-measure-pipe-gantry', 'south-measure-repair-rack', 'machine-oil', 'service-hatch'], { minX: 10, maxX: 29, minY: 9, maxY: 18 }, 34);
  const centralSystems = objectsMatching(level, ['relief-machine', 'intake-pump-assembly'], region({ minX: 10, maxX: 29, minY: 9, maxY: 18 }));
  assert.equal(centralSystems.length, 8, `${level.id} central floor needs eight large machine systems`);
  assert.equal(new Set(centralSystems.map((object) => object.kind)).size, 2, `${level.id} central floor needs mixed machine masses`);
  assert.equal(objectsMatching(level, 'service-pipe-run', region({ minX: 11, maxX: 29, minY: 12, maxY: 12 })).length, 19, `${level.id} machine systems lost their continuous service trunk`);
  assertRegionCount(
    level,
    'integrated drain-hatch landing',
    ['service-pipe-run', 'service-hatch', 'south-measure-pipe-gantry', 'intake-pump-assembly', 'utility-railing', 'tool-rack', 'rusted-barrel'],
    { minX: 1, maxX: 9, minY: 18, maxY: 22 },
    22
  );
  assertRegionCount(
    level,
    'relief records band',
    ['south-measure-wall-board', 'south-measure-worktable', 'south-measure-storage', 'paper-scraps'],
    { minX: 30, minY: 9, maxY: 21 },
    6
  );
  const workingSlabs = floorCells(level, 'south-measure-slab');
  assert.ok(workingSlabs.length >= 650, `${level.id} needs a broad quiet civic-slab work floor`);
  const burnedYard = floorCells(level, 'south-measure-yard');
  assert.ok(burnedYard.length >= 55, `${level.id} needs a broad dirty-clinker burn footprint`);
  assert.ok(burnedYard.every((cell) => cell.x >= 31), `${level.id} burned clinker escaped the east bay`);
  assert.ok(span(burnedYard, 'x') >= 8 && span(burnedYard, 'y') >= 9, `${level.id} burn footprint is too small to read as one bay`);
  assertRegionCount(level, 'T-shaped circulation wear', 'road-dust', { minX: 11, maxX: 29, minY: 9, maxY: 19 }, 20);
  let collapsedTeeth = 0;
  for (let y = 9; y <= 10; y += 1) {
    for (let x = 31; x <= 38; x += 1) if (!level.legend[level.tiles[y][x]]?.walkable) collapsedTeeth += 1;
  }
  assert.ok(collapsedTeeth >= 6, `${level.id} needs a jagged collapsed partition silhouette`);
  const burnKinds = [
    'collapsed-culvert', 'overturned-field-cart', 'relief-machine', 'south-measure-repair-rack',
    'sealed-storage-crate', 'rusted-barrel', 'rubble-decal', 'rubble-pile', 'scorch-mark'
  ];
  assertRegionCount(level, 'burned east bay', burnKinds, { minX: 31, minY: 8, maxY: 18 }, 20);
  assert.ok(
    new Set(objectsMatching(level, burnKinds, region({ minX: 31, minY: 8, maxY: 18 })).map((object) => object.kind)).size >= 8,
    `${level.id} burned bay collapsed back into repeated rubble icons`
  );
  assert.ok(kindCount(level, 'rubble-pile') <= 4, `${level.id} burned bay uses too many repeated rubble piles`);
  assertRegionCount(level, 'south loading bay', ['fixed-hoist', 'freight-scale', 'freight-wagon', 'sealed-storage-crate', 'utility-railing'], { minY: 19 }, 10);
}

function assertFreightHouse(level) {
  assertRegionCount(level, 'west guard quarters', ['farm-bed', 'shared-oven', 'dining-table', 'dining-bench', 'pantry-shelf', 'tool-rack', 'low-stool'], { maxX: 9, maxY: 13 }, 11);
  assertRegionCount(level, 'north ledger and bonded cages', ['mesh-cage-panel', 'south-measure-storage', 'sealed-storage-crate', 'grain-cage', 'grain-sack-stack', 'rusted-crate'], { minY: 1, maxY: 6 }, 25);
  assertRegionCount(level, 'central public office', ['south-measure-worktable', 'low-stool', 'paper-scraps', 'south-measure-notice-board', 'south-measure-wall-board'], { minX: 10, maxX: 24, minY: 7 }, 15);
  assertRegionCount(level, 'east bonded store', ['mesh-cage-panel', 'sealed-storage-crate', 'grain-cage', 'grain-sack-stack', 'rusted-crate'], { minX: 25 }, 15);
  assertRegionCount(level, 'southwest freight weighbridge', 'freight-scale', { maxX: 9, minY: 14 }, 1);
  assertRegionCount(level, 'threshold public counter', ['south-measure-return-stall', 'south-measure-queue-rail', 'south-measure-notice-board', 'low-stool', 'paper-scraps'], { maxX: 9, minY: 10, maxY: 16 }, 7);
  assertRegionCount(level, 'rear loading termination', ['fixed-hoist', 'freight-wagon', 'service-hatch', 'sealed-storage-crate', 'utility-railing', 'road-dust'], { minX: 26, maxX: 34, minY: 17 }, 12);
  const routeTable = level.objects.find((object) => object.id === 'morrow-route-table');
  assert.equal(routeTable?.variant, 'route', `${level.id} dispatch anchor must use the dedicated route-map surface`);
  assert.equal(kindCount(level, 'freight-scale'), 1, `${level.id} needs one dominant weighbridge rather than paired checkpoint pads`);
  const ledgerBack = objectsMatching(level, 'mesh-cage-panel', (object) => object.variant === 'ledger' && object.y === 2 && object.x >= 11 && object.x <= 23);
  assert.equal(ledgerBack.length, 13, `${level.id} ledger cage needs an unbroken thirteen-cell rear boundary`);
  assert.equal(span(ledgerBack, 'x'), 13, `${level.id} ledger cage rear boundary must be continuous`);
  const ledgerFront = objectsMatching(level, 'mesh-cage-panel', (object) => object.variant === 'ledger' && object.y === 6);
  assert.equal(ledgerFront.length, 11, `${level.id} ledger cage needs a continuous front with one two-cell entry`);
  const bondedCargo = objectsMatching(level, ['sealed-storage-crate', 'grain-cage', 'grain-sack-stack', 'rusted-crate'], region({ minX: 26, maxX: 34, minY: 2, maxY: 5 }));
  assert.ok(bondedCargo.length >= 18, `${level.id} bonded store must pack freight directly behind the mesh boundary`);
  const freightWear = objectsMatching(level, 'road-dust');
  assert.ok(freightWear.length >= 65 && span(freightWear, 'x') >= 33 && span(freightWear, 'y') >= 8, `${level.id} needs a continuous entry-scale-loading traffic hierarchy`);
}

function assertClinic(level) {
  const wardBeds = objectsMatching(level, 'clinic-bed', (object) => object.variant !== 'isolation');
  assert.equal(wardBeds.length, 6, `${level.id} needs exactly six central ward beds`);
  assert.equal(variantCount(level, 'clinic-bed', 'isolation'), 1, `${level.id} needs one separate isolation bed`);
  assert.equal(new Set(wardBeds.map((bed) => bed.y)).size, 2, `${level.id} ward beds need two readable rows`);
  assert.ok(span(wardBeds, 'x') >= 9, `${level.id} ward beds need a broad central footprint`);
  assertRegionCount(level, 'northwest cold service', ['relief-machine', 'mesh-cage-panel'], { maxX: 9, maxY: 6 }, 4);
  assertRegionCount(level, 'east applicant lane', ['south-measure-queue-rail', 'cloth-partition', 'low-stool', 'south-measure-notice-board'], { minX: 26, minY: 6 }, 30);
  const verticalQueue = objectsMatching(level, 'south-measure-queue-rail', region({ minX: 29, maxX: 29, minY: 6, maxY: 20 }));
  assert.equal(verticalQueue.length, 15, `${level.id} applicant queue needs an unbroken fifteen-cell north-south rail`);
  assert.deepEqual(verticalQueue.map((object) => object.y).sort((a, b) => a - b), Array.from({ length: 15 }, (_, index) => index + 6));
  const queueTurn = objectsMatching(level, 'south-measure-queue-rail', region({ minX: 23, maxX: 28, minY: 20, maxY: 20 }));
  assert.equal(queueTurn.length, 6, `${level.id} applicant queue needs a six-cell triage turn`);
  const archiveRun = objectsMatching(level, 'south-measure-storage', region({ minX: 25, maxX: 33, minY: 3, maxY: 3 }));
  assert.equal(archiveRun.length, 5, `${level.id} placement archive needs five close-spaced record units`);
  assert.equal(span(archiveRun, 'x'), 9, `${level.id} placement archive must span its whole northeast wall`);
  assert.ok(archiveRun.every((object) => ['archive-shelf', 'current-records'].includes(object.variant)), `${level.id} archive wall contains generic storage`);
  assert.ok(level.objects.some((object) => object.kind === 'south-measure-worktable' && object.variant === 'records' && object.x === 29 && object.y === 5), `${level.id} queue must terminate at a records handling table`);
  assertRegionCount(level, 'south triage and dressing station', ['south-measure-worktable', 'south-measure-medicine-cart', 'medicine-cart', 'low-stool', 'cloth-partition'], { minY: 19 }, 10);
  assertRegionCount(level, 'west isolation area', ['clinic-bed', 'cloth-partition', 'south-measure-worktable', 'south-measure-storage', 'candle-cluster'], { maxX: 9, minY: 7, maxY: 18 }, 6);
  assertRegionCount(level, 'rear staff wash zone', ['wash-wall', 'wash-tub', 'laundry-line', 'mortuary-drain', 'trampled-mud', 'south-measure-water-vessels'], { minX: 16, maxX: 24, maxY: 6 }, 13);
  assertRegionCount(level, 'field emergency pocket', ['field-satchel', 'south-measure-storage', 'south-measure-medicine-cart', 'south-measure-worktable', 'paper-scraps'], { minX: 9, maxX: 14, minY: 2, maxY: 5 }, 6);
  const monitorPipes = objectsMatching(level, 'service-pipe-run', region({ minX: 5, maxX: 13, minY: 4, maxY: 5 }));
  assert.equal(monitorPipes.length, 11, `${level.id} flow monitor needs one complete U-shaped service line`);
  assert.equal(objectsMatching(level, 'service-pipe-run', region({ minX: 5, maxX: 13, minY: 5, maxY: 5 })).length, 9, `${level.id} monitor and backup cell need a continuous nine-cell cross-run`);
  const applicantScreens = objectsMatching(level, 'cloth-partition', region({ minX: 33, maxX: 33, minY: 8, maxY: 17 }));
  assert.deepEqual(applicantScreens.map((object) => object.y).sort((a, b) => a - b), [8, 9, 10, 11, 13, 14, 15, 16, 17], `${level.id} applicant screens need two deliberate connected runs with one opening`);
  const trafficWear = objectsMatching(level, 'road-dust');
  assert.ok(trafficWear.length >= 60, `${level.id} needs a visible traffic-wear hierarchy`);
  assert.ok(span(trafficWear, 'x') >= 24 && span(trafficWear, 'y') >= 15, `${level.id} traffic wear must mark both ward crossing and entry lane`);
  assert.ok(interiorRowsWithoutWalls(level) >= 22, `${level.id} must remain one open canvas shell without hard-wall maze bands`);
}

function assertMeasureHall(level) {
  const schoolTables = objectsMatching(level, 'south-measure-worktable', (object) => object.variant === 'school');
  const councilTables = objectsMatching(level, 'south-measure-worktable', (object) => object.variant === 'council');
  assert.ok(schoolTables.length >= 9, `${level.id} needs repeated slate-school desks`);
  assert.ok(schoolTables.every((table) => table.y >= 15), `${level.id} school desks must remain on the bright front floor`);
  assert.ok(councilTables.length >= 5, `${level.id} needs a long rear council table`);
  assert.ok(span(councilTables, 'x') >= 9, `${level.id} council table must read as a long run`);
  assertRegionCount(level, 'front school floor', ['south-measure-worktable', 'low-stool', 'chalk-drawing', 'south-measure-water-lesson'], { minX: 8, maxX: 27, minY: 14 }, 25);
  assertRegionCount(level, 'west kitchen', ['shared-oven', 'south-measure-worktable', 'pantry-shelf', 'wash-wall', 'south-measure-water-vessels', 'dining-table', 'dining-bench', 'candle-cluster'], { maxX: 7, minY: 7, maxY: 15 }, 9);
  assertRegionCount(level, 'rear records loft and storm room', ['stone-stairwell', 'cloth-partition', 'laundry-line', 'camp-bedroll', 'utility-railing', 'sealed-storage-crate', 'south-measure-storage', 'clinic-bed', 'charity-cot', 'candle-cluster'], { minX: 7, maxY: 7 }, 20);
  const waterRoll = objectsMatching(level, ['south-measure-storage', 'south-measure-worktable', 'south-measure-notice-board', 'south-measure-water-vessels', 'paper-scraps'], region({ minX: 28, maxX: 32, minY: 7, maxY: 12 }));
  assert.ok(waterRoll.length >= 8, `${level.id} current water roll needs records, handling, vessels, and census board in one cluster`);
  assert.ok(waterRoll.filter((object) => object.kind === 'south-measure-storage' && object.variant === 'current-records').length >= 3, `${level.id} water roll needs three maintained record units`);
  assert.ok(waterRoll.some((object) => object.kind === 'south-measure-notice-board' && object.variant === 'census'), `${level.id} water roll needs a public census board`);
  assert.equal(variantCount(level, 'south-measure-storage', 'burial-copies'), 3, `${level.id} burial copies need a three-unit public-memory archive mass`);
  assertRegionCount(level, 'burial copy memorial cluster', ['south-measure-storage', 'south-measure-wall-board', 'candle-cluster'], { minX: 20, maxX: 24, maxY: 5 }, 6);
  const loft = level.objects.find((object) => object.id === 'measure-hall-canvas-loft');
  assert.deepEqual({ kind: loft?.kind, variant: loft?.variant, x: loft?.x, y: loft?.y }, { kind: 'stone-stairwell', variant: 'cellar-flight', x: 10, y: 4 }, `${level.id} loft needs a visible rising stair flight`);
  assertRegionCount(level, 'canvas loft destination', ['cloth-partition', 'laundry-line', 'camp-bedroll', 'utility-railing', 'stone-stairwell'], { minX: 7, maxX: 13, maxY: 4 }, 12);
  const paintedStrip = objectsMatching(level, 'south-measure-wall-board', (object) => object.variant === 'slate' && object.y === 0);
  assert.equal(paintedStrip.length, 7, `${level.id} painted measure strip needs seven adjacent wall panels`);
  assert.equal(span(paintedStrip, 'x'), 7, `${level.id} painted measure strip must form one continuous wall register`);
  assert.equal(kindCount(level, 'south-measure-custody-rest'), 1, `${level.id} needs one visible empty custody footprint`);
  assert.equal(objectsMatching(level, 'south-measure-worktable', region({ minX: 19, maxX: 21, minY: 10, maxY: 12 })).length, 0, `${level.id} custody absence must not regress into another records table`);
  const hallWear = objectsMatching(level, 'road-dust');
  assert.ok(hallWear.length >= 45 && span(hallWear, 'x') >= 25 && span(hallWear, 'y') >= 17, `${level.id} needs one durable entry-school-council-service wear graph`);
  assert.ok(interiorRowsWithoutWalls(level) >= 8, `${level.id} needs a broad open assembly floor`);
}

function assertVaroHouse(level) {
  assert.equal(level.legend['.'].floor, 'south-measure-row', `${level.id} needs the quieter directional service-brick floor`);
  assertRegionCount(level, 'entrance pump bench', ['farm-workbench', 'south-measure-hand-pump', 'south-measure-repair-rack', 'tool-rack', 'south-measure-water-vessels', 'rusted-barrel', 'machine-oil', 'paper-scraps', 'low-stool', 'south-measure-wall-board'], { maxX: 7, minY: 7 }, 14);
  assertRegionCount(level, 'cup repair corner', ['south-measure-worktable', 'south-measure-repair-rack', 'tool-rack', 'dining-bench', 'low-stool', 'south-measure-water-vessels', 'candle-cluster', 'shared-oven', 'pantry-shelf', 'wash-tub'], { maxX: 12, minY: 4, maxY: 8 }, 12);
  assertRegionCount(level, 'family common room', ['south-measure-worktable', 'dining-bench', 'low-stool', 'south-measure-water-vessels', 'paper-scraps'], { minX: 7, maxX: 14, minY: 10 }, 8);
  const rearShelves = objectsMatching(level, 'south-measure-storage', region({ minY: 2, maxY: 2 }));
  assert.equal(rearShelves.length, 6, `${level.id} needs six units in one rear shelf wall`);
  assert.ok(span(rearShelves, 'x') >= 15, `${level.id} rear shelf must span most of the house`);
  assert.ok(variantCount(level, 'south-measure-storage', 'work-shelf') >= 5, `${level.id} needs a continuous open tool-shelf silhouette`);
  assert.equal(variantCount(level, 'south-measure-storage', 'school-tools'), 1, `${level.id} needs one distinct school-tool section`);
  assertRegionCount(level, 'school and ready-work cluster', ['south-measure-storage', 'field-satchel', 'chalk-drawing', 'south-measure-water-lesson', 'tool-rack', 'low-stool'], { minX: 13, maxX: 17, minY: 2, maxY: 5 }, 7);
  const repairSatchel = level.objects.find((object) => object.id === 'varo-censure-repair-satchel');
  assert.deepEqual(
    { kind: repairSatchel?.kind, x: repairSatchel?.x, y: repairSatchel?.y, marker: repairSatchel?.interactionMarker },
    { kind: 'field-satchel', x: 13, y: 5, marker: { x: 14, y: 5 } },
    `${level.id} repair satchel lost its visible ready-work position`
  );
  const frontOccluders = level.objects.filter((object) => (
    object.blocking
    && ((object.x === 14 && object.y === 5) || (object.x === 13 && object.y === 6))
  ));
  assert.deepEqual(frontOccluders, [], `${level.id} repair satchel must stay clear of front occluders`);
  assert.equal(variantCount(level, 'south-measure-worktable', 'family-meal'), 1, `${level.id} needs one family meal surface`);
  assert.equal(variantCount(level, 'south-measure-worktable', 'cup-repair'), 1, `${level.id} needs one active cup-repair surface`);
  const curtains = objectsMatching(level, 'cloth-partition');
  assert.equal(curtains.length, 12, `${level.id} needs two short soft sleeping-niche curtain runs`);
  assert.equal(curtains.filter((object) => object.y === 3).length, 4, `${level.id} north sleeping niche needs a short horizontal curtain cap`);
  assert.equal(curtains.filter((object) => object.y === 9).length, 4, `${level.id} south sleeping niche needs a short horizontal curtain cap`);
  assert.equal(curtains.filter((object) => object.x === 15).length, 6, `${level.id} sleeping niches need two short side returns`);
  assert.ok(curtains.every((object) => object.variant === 'domestic'), `${level.id} sleeping boundaries must use soft domestic curtains`);
  const householdWear = objectsMatching(level, 'road-dust');
  assert.ok(householdWear.length >= 24 && span(householdWear, 'x') >= 20 && span(householdWear, 'y') >= 11, `${level.id} needs a visible entrance-family-sleep wear route`);
  assert.equal(kindCount(level, 'farm-bed'), 2, `${level.id} needs exactly two curtained beds`);
  assert.ok(interiorRowsWithoutWalls(level) >= 14, `${level.id} needs one open common room around soft sleeping boundaries`);
}

function assertHiddenRows(level) {
  const householdRegions = [
    { maxX: 9, maxY: 8 },
    { minX: 11, maxX: 18, maxY: 8 },
    { minX: 20, maxX: 25, maxY: 8 }
  ];
  const householdKinds = ['farm-bed', 'shared-oven', 'dining-table', 'dining-bench', 'pantry-shelf', 'low-stool', 'south-measure-water-vessels', 'south-measure-repair-rack', 'south-measure-worktable', 'south-measure-storage', 'wash-tub', 'tool-rack', 'candle-cluster', 'paper-scraps'];
  for (const [index, bounds] of householdRegions.entries()) {
    assertRegionCount(level, `household ${index + 1}`, householdKinds, bounds, 8);
    assert.equal(objectsMatching(level, 'farm-bed', region(bounds)).length, 1, `${level.id} household ${index + 1} needs its own bed`);
  }
  assertRegionCount(level, 'shared meeting room', ['south-measure-worktable', 'south-measure-storage', 'dining-bench', 'low-stool', 'south-measure-wall-board', 'paper-scraps'], { minX: 11, maxX: 20, minY: 13 }, 8);
  assertRegionCount(level, 'drying-frame entry', ['south-measure-door', 'laundry-line', 'wash-wall', 'wash-tub', 'south-measure-water-vessels'], { maxX: 9, maxY: 8 }, 10);
  assertRegionCount(level, 'southwest treatment room', ['clinic-bed', 'cloth-partition', 'south-measure-medicine-cart', 'south-measure-storage', 'south-measure-worktable', 'wash-wall', 'candle-cluster', 'field-satchel'], { maxX: 9, minY: 12 }, 14);
  const waterBranch = objectsMatching(level, 'service-pipe-run', region({ minX: 2, maxX: 24, minY: 9, maxY: 9 }));
  assert.equal(waterBranch.length, 20, `${level.id} needs a long concealed branch behind all households`);
  assert.ok(span(waterBranch, 'x') >= 22, `${level.id} concealed branch must span all three household rooms`);
  assert.ok(waterBranch.filter((object) => object.variant === 'valve').length >= 3, `${level.id} branch needs one visible household valve per room`);
  const cookingFlue = objectsMatching(level, 'service-pipe-run', region({ minX: 19, maxX: 19, minY: 2, maxY: 6 }));
  assert.equal(cookingFlue.length, 5, `${level.id} needs a continuous vertical cooking flue`);
  assert.deepEqual(cookingFlue.map((object) => object.y).sort((a, b) => a - b), [2, 3, 4, 5, 6]);
  const flueAnchor = level.objects.find((object) => object.id === 'hidden-rows-shared-cooking-flue');
  assert.deepEqual(
    {
      kind: flueAnchor?.kind,
      x: flueAnchor?.x,
      y: flueAnchor?.y,
      variant: flueAnchor?.variant,
      wallPlane: flueAnchor?.wallPlane,
      connected: flueAnchor?.connected,
      marker: flueAnchor?.interactionMarker
    },
    {
      kind: 'service-pipe-run',
      x: 19,
      y: 9,
      variant: 'elbow',
      wallPlane: 'sw',
      connected: { xMinus: true, yMinus: true },
      marker: { x: 19, y: 10 }
    },
    `${level.id} cooking flue lost its visible branch elbow`
  );
  const communalOven = level.objects.find((object) => object.kind === 'shared-oven' && object.x === 20 && object.y === 10);
  assert.ok(communalOven, `${level.id} needs a visible communal oven below the flue`);
  assert.equal(communalOven.x - communalOven.y, flueAnchor.x - flueAnchor.y, `${level.id} oven and flue must share one isometric axis`);
  assert.equal(variantCount(level, 'south-measure-wall-board', 'private-list'), 1, `${level.id} needs one visibly secured private list`);
  assert.equal(variantCount(level, 'south-measure-worktable', 'meeting'), 1, `${level.id} needs one dominant shared meeting table`);
  assert.equal(variantCount(level, 'south-measure-worktable', 'council'), 0, `${level.id} meeting room must not split into duplicate council tables`);
  assert.ok(level.objects.some((object) => object.kind === 'laundry-line' && object.x === 1 && object.y === 5), `${level.id} drying cloth must cross the entry sightline`);
  const rowWear = objectsMatching(level, 'road-dust', region({ minX: 1, maxX: 25, minY: 11, maxY: 11 }));
  assert.equal(rowWear.length, 25, `${level.id} needs one continuous twenty-five-cell longitudinal wear band`);
  const passageRails = objectsMatching(level, 'utility-railing', region({ minX: 25, minY: 2 }));
  assert.ok(passageRails.length >= 13, `${level.id} needs a compressed full-height grave passage rail`);
  assert.ok(span(passageRails, 'y') >= 15, `${level.id} grave passage must run from the north door to the rear rooms`);
  assertRegionCount(level, 'grave passage', ['south-measure-door', 'utility-railing', 'rubble-pile', 'rubble-decal'], { minX: 24 }, 20);
  assert.ok(hasHorizontalLane(level, 1, 28, 10, 11), `${level.id} needs a continuous shared lane across all three households`);
  assert.ok(interiorRowsWithoutWalls(level) >= 7, `${level.id} needs a legible shared lane and soft lower-room boundaries`);
}

function assertCharityCellar(level) {
  assert.equal(level.legend['.'].floor, 'south-measure-slab', `${level.id} needs a quiet slab floor beneath the medicine aisles`);
  const cleanRun = objectsMatching(level, 'south-measure-storage', (object) => object.variant === 'clean-shelf');
  assert.equal(cleanRun.length, 5, `${level.id} needs five wide clean-shelf units`);
  assert.ok(cleanRun.every((object) => object.y === 3), `${level.id} clean shelves must form one wall-aligned run`);
  assert.ok(span(cleanRun, 'x') >= 9, `${level.id} clean shelf run must dominate the north reserve`);
  assert.equal(variantCount(level, 'south-measure-storage', 'suspect-shelf'), 2, `${level.id} needs a visibly separate suspect cabinet pair`);
  assert.equal(kindCount(level, 'mesh-cage-panel'), 0, `${level.id} should read as an open medicine reserve, not a freight cage`);
  assertRegionCount(level, 'suspect stock pocket', ['south-measure-storage', 'sealed-storage-crate', 'rusted-crate', 'south-measure-wall-board', 'south-measure-medicine-cart', 'utility-railing', 'paper-scraps', 'scorch-mark'], { maxX: 6, minY: 6, maxY: 10 }, 10);
  assert.equal(variantCount(level, 'south-measure-wall-board', 'prayer-cards'), 2, `${level.id} needs a clustered prayer-card wall`);
  assert.equal(variantCount(level, 'south-measure-worktable', 'evidence-bench'), 1, `${level.id} needs one dedicated evidence bench`);
  assert.equal(variantCount(level, 'south-measure-worktable', 'burned-label'), 1, `${level.id} needs one visibly burned label-sorting surface`);
  assertRegionCount(level, 'south evidence bench', ['south-measure-worktable', 'paper-scraps', 'scorch-mark', 'low-stool', 'sealed-storage-crate', 'rusted-crate', 'tool-rack'], { minX: 6, maxX: 14, minY: 10 }, 13);
  assertRegionCount(level, 'screened patient cot', ['charity-cot', 'cloth-partition', 'south-measure-medicine-cart', 'wash-wall', 'candle-cluster'], { minX: 15, maxY: 8 }, 14);
  assertRegionCount(level, 'collapsed west crawl', ['collapsed-culvert', 'service-pipe-run', 'rubble-pile', 'rubble-decal'], { maxX: 4, maxY: 4 }, 8);
  assert.deepEqual(
    { x: level.spawns.player.x, y: level.spawns.player.y, facing: level.spawns.player.facing },
    { x: 18, y: 13, facing: 'nw' },
    `${level.id} player must arrive with the stair visible ahead`
  );
  const ladder = objectsMatching(level, 'stone-stairwell', (object) => object.variant === 'cellar-flight')[0];
  assert.deepEqual(
    { x: ladder?.x, y: ladder?.y, blocking: ladder?.blocking, variant: ladder?.variant, orient: ladder?.orient },
    { x: 19, y: 13, blocking: false, variant: 'cellar-flight', orient: 'se' },
    `${level.id} needs one exposed five-tread cellar flight`
  );
  const stairRails = objectsMatching(level, 'utility-railing', (object) => object.variant === 'service' && object.x === 20 && [12, 14].includes(object.y));
  assert.deepEqual(stairRails.map(({ x, y }) => `${x},${y}`).sort(), ['20,12', '20,14']);
  const arrivalStock = objectsMatching(level, ['south-measure-storage', 'south-measure-medicine-cart', 'medicine-cart'], (object) => (
    object.blocking && object.x >= 16 && object.x <= 20 && object.y >= 9 && object.y <= 13
  ));
  assert.deepEqual(arrivalStock.map(({ x, y }) => `${x},${y}`).sort(), ['16,11', '16,13', '19,11'], `${level.id} needs three medicine units visible from the stair`);
  const blocked = new Set(level.objects.filter((object) => object.blocking).map((object) => `${object.x},${object.y}`));
  for (let y = 9; y <= 13; y += 1) {
    assert.ok(!blocked.has(`17,${y}`) && !blocked.has(`18,${y}`), `${level.id} central medicine lane lost two-cell clearance at row ${y}`);
  }
  const cellarWear = objectsMatching(level, 'road-dust');
  assert.ok(cellarWear.length >= 30 && span(cellarWear, 'x') >= 15 && span(cellarWear, 'y') >= 10, `${level.id} needs stair, shelf, and evidence aisle wear`);
  assert.ok(interiorRowsWithoutWalls(level) >= 12, `${level.id} needs open working aisles around three dense perimeter masses`);
}

const CONCEPT_ASSERTIONS = {
  'south-measure-intake-undercroft': assertUndercroft,
  'south-measure-relief-drain': assertDrain,
  'south-measure-relief-maintenance-annex': assertAnnex,
  'south-measure-morrow-freight-house': assertFreightHouse,
  'south-measure-compact-clinic': assertClinic,
  'south-measure-measure-hall': assertMeasureHall,
  'south-measure-varo-house': assertVaroHouse,
  'south-measure-hidden-rows': assertHiddenRows,
  'south-measure-charity-cellar': assertCharityCellar
};

function kindDistribution(level) {
  const counts = new Map();
  for (const object of level.objects ?? []) counts.set(object.kind, (counts.get(object.kind) ?? 0) + 1);
  return new Map([...counts].map(([kind, count]) => [kind, count / level.objects.length]));
}

function distributionDistance(left, right) {
  const keys = new Set([...left.keys(), ...right.keys()]);
  let difference = 0;
  for (const key of keys) difference += Math.abs((left.get(key) ?? 0) - (right.get(key) ?? 0));
  return difference / 2;
}

const levels = new Map();
for (const [id, spec] of Object.entries(MAP_SPECS)) {
  const level = await readJson(spec.path);
  levels.set(id, level);
  assert.equal(level.id, id, `${spec.path} has the wrong level id`);

  const wallKinds = sortedUnique(
    Object.values(level.legend)
      .filter((entry) => !entry.walkable && entry.kind)
      .map((entry) => entry.kind)
  );
  const floorStyles = sortedUnique(
    Object.values(level.legend)
      .filter((entry) => entry.walkable && entry.floor)
      .map((entry) => entry.floor)
  );
  assert.deepEqual(wallKinds, spec.walls, `${id} lost its wall identity`);
  assert.deepEqual(floorStyles, spec.floors, `${id} lost its floor identity`);

  const walkable = walkableCellCount(level);
  const density = level.objects.length / walkable;
  assert.ok(density >= spec.minimumDensity, `${id} visual density ${density.toFixed(3)} is below ${spec.minimumDensity}`);
  for (const [kind, minimum] of Object.entries(spec.kinds)) {
    const count = kindCount(level, kind);
    assert.ok(count >= minimum, `${id} has ${count} ${kind} objects, expected at least ${minimum}`);
  }

  assertBroadDistribution(level);
  CONCEPT_ASSERTIONS[id](level);
}

const levelEntries = [...levels.entries()];
for (let leftIndex = 0; leftIndex < levelEntries.length; leftIndex += 1) {
  for (let rightIndex = leftIndex + 1; rightIndex < levelEntries.length; rightIndex += 1) {
    const [leftId, left] = levelEntries[leftIndex];
    const [rightId, right] = levelEntries[rightIndex];
    const distance = distributionDistance(kindDistribution(left), kindDistribution(right));
    assert.ok(
      distance >= 0.25,
      `${leftId} and ${rightId} prop profiles are too similar (${distance.toFixed(3)})`
    );
  }
}

console.log('southMeasureVisualIdentity: nine concept signatures, composition, density, and pairwise distinction passed.');
