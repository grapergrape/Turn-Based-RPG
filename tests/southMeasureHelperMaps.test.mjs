import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import { Grid } from '../src/world/Grid.js';

const ROOT = new URL('../', import.meta.url);
const CARDINAL_DIRECTIONS = [
  { x: 1, y: 0 },
  { x: -1, y: 0 },
  { x: 0, y: 1 },
  { x: 0, y: -1 }
];
const WALL_PLANES = new Set(['se', 'sw']);
const ORIENTATIONS = new Set(['se', 'sw', 'nw', 'ne']);
const OPENED_STATE_CONTAINER_KINDS = new Set(['field-satchel', 'rusted-crate', 'sealed-storage-crate']);
const SOUTH_MEASURE_LOOT_ITEMS = new Set([
  'ducat',
  'field-dressing',
  'drone-service-parts',
  'penitent-gear-scrap',
  'relic-rounds',
  'tinned-beans'
]);
const ARRIVAL_FACINGS = new Set(['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw']);
const INWARD_FACING_VECTORS = {
  ne: { x: 0, y: -1 },
  se: { x: 1, y: 0 },
  sw: { x: 0, y: 1 },
  nw: { x: -1, y: 0 }
};
const DIALOGUE_ANCHORS = new Set([
  'undercroft-intake-clerk',
  'undercroft-original-household-roll',
  'morrow-pump-ledger',
  'charity-cellar-suspect-cabinet',
  'charity-cellar-burned-crate-labels',
  'charity-cellar-work-table'
]);

async function readJson(path) {
  return JSON.parse(await readFile(new URL(path, ROOT), 'utf8'));
}

function cellKey(cell) {
  return `${cell.x},${cell.y}`;
}

function objectById(level, id) {
  const object = (level.objects ?? []).find((entry) => entry.id === id);
  assert.ok(object, `${level.id} is missing object ${id}`);
  return object;
}

function gridWithBlockingObjects(level) {
  const grid = new Grid(level);
  for (const object of level.objects ?? []) {
    if (object.blocking) grid.addBlocked(object.x, object.y);
  }
  return grid;
}

function reachableCells(grid, start) {
  assert.equal(grid.isWalkable(start.x, start.y), true, `route start ${cellKey(start)} is walkable`);
  const seen = new Set([cellKey(start)]);
  const queue = [{ x: start.x, y: start.y }];
  for (let index = 0; index < queue.length; index += 1) {
    const cell = queue[index];
    for (const direction of CARDINAL_DIRECTIONS) {
      const next = { x: cell.x + direction.x, y: cell.y + direction.y };
      const key = cellKey(next);
      if (seen.has(key) || !grid.isWalkable(next.x, next.y)) continue;
      seen.add(key);
      queue.push(next);
    }
  }
  return seen;
}

function clearCardinalNeighbors(grid, cell) {
  return CARDINAL_DIRECTIONS.filter((direction) => (
    grid.isWalkable(cell.x + direction.x, cell.y + direction.y)
  )).length;
}

function gate(level, objectId, kind, position, marker, frame = {}, blocking = true) {
  return { level, objectId, kind, position, marker, frame, blocking };
}

function endpoint(id, source, targetLevel, targetPlayer) {
  return { id, source, targetLevel, targetPlayer };
}

const LEVEL_SPECS = {
  'south-measure-intake-undercroft': {
    path: './data/levels/south_measure_intake_undercroft.json',
    width: 58,
    height: 42,
    anchors: [
      'undercroft-records-landing-rails',
      'undercroft-brass-number-hooks',
      'undercroft-lime-handprints',
      'undercroft-examination-order',
      'undercroft-restraint-drain',
      'undercroft-privacy-screens',
      'undercroft-filter-cabinet',
      'undercroft-records-vault-door',
      'undercroft-compact-copy-marks',
      'undercroft-original-household-roll',
      'undercroft-isolation-manifold',
      'undercroft-settling-feed-controls',
      'undercroft-pump-work-platform',
      'undercroft-pipe-vein',
      'undercroft-intake-clerk',
      'undercroft-return-passage'
    ]
  },
  'south-measure-relief-drain': {
    path: './data/levels/south_measure_relief_drain.json',
    width: 44,
    height: 20,
    anchors: [
      'relief-drain-raised-walk',
      'relief-drain-polluted-flow',
      'relief-drain-broken-filter-baskets',
      'relief-drain-jammed-isolation-wheel',
      'relief-drain-waiting-alcove',
      'relief-drain-childrens-crawl-marks',
      'relief-drain-trench-work-signs'
    ]
  },
  'south-measure-relief-maintenance-annex': {
    path: './data/levels/south_measure_relief_maintenance_annex.json',
    width: 40,
    height: 26,
    anchors: [
      'relief-annex-claim-desk',
      'relief-annex-dead-hoist',
      'relief-annex-machine-floor',
      'relief-annex-parts-cage',
      'relief-annex-bypass-schedule',
      'relief-annex-cooling-jacket',
      'relief-annex-relief-schedules',
      'relief-annex-burned-rear-bay'
    ]
  },
  'south-measure-morrow-freight-house': {
    path: './data/levels/south_measure_morrow_freight_house.json',
    width: 36,
    height: 22,
    anchors: [
      'morrow-public-office',
      'morrow-freight-scale',
      'morrow-route-table',
      'morrow-convoy-loss-board',
      'morrow-medicine-run-board',
      'morrow-ledger-cage',
      'morrow-pump-ledger',
      'morrow-household-surety-folios',
      'morrow-bonded-store',
      'morrow-guard-memorial-tags',
      'morrow-guard-bunks',
      'morrow-guard-mess'
    ]
  },
  'south-measure-compact-clinic': {
    path: './data/levels/south_measure_compact_clinic.json',
    width: 36,
    height: 24,
    anchors: [
      'compact-clinic-triage-desk',
      'compact-clinic-six-bed-ward',
      'compact-clinic-applicant-lane',
      'compact-clinic-placement-archive',
      'compact-clinic-blood-card-station',
      'compact-clinic-cold-service-bay',
      'compact-clinic-flow-monitor',
      'compact-clinic-backup-cell',
      'compact-clinic-isolation-room',
      'compact-clinic-staff-wash'
    ]
  },
  'south-measure-measure-hall': {
    path: './data/levels/south_measure_measure_hall.json',
    width: 34,
    height: 22,
    anchors: [
      'measure-hall-slate-school',
      'measure-hall-council-table',
      'measure-hall-kitchen',
      'measure-hall-current-water-roll',
      'measure-hall-burial-copies',
      'measure-hall-canvas-loft',
      'measure-hall-painted-strip',
      'measure-hall-empty-custody-rest',
      'measure-hall-storm-room'
    ]
  },
  'south-measure-varo-house': {
    path: './data/levels/south_measure_varo_house.json',
    width: 22,
    height: 16,
    anchors: [
      'varo-house-pump-bench',
      'varo-house-diagram-wall',
      'varo-house-cup-repair-table',
      'varo-house-family-table',
      'varo-house-sleeping-partitions',
      'varo-house-rear-work-shelf',
      'varo-house-school-tools'
    ]
  },
  'south-measure-hidden-rows': {
    path: './data/levels/south_measure_hidden_rows.json',
    width: 30,
    height: 18,
    anchors: [
      'hidden-rows-first-household-room',
      'hidden-rows-second-household-room',
      'hidden-rows-third-household-room',
      'hidden-rows-concealed-water-branch',
      'hidden-rows-shared-cooking-flue',
      'hidden-rows-treatment-room',
      'hidden-rows-meeting-table',
      'hidden-rows-private-water-list',
      'hidden-rows-grave-passage'
    ]
  },
  'south-measure-charity-cellar': {
    path: './data/levels/south_measure_charity_cellar.json',
    width: 22,
    height: 16,
    anchors: [
      'charity-cellar-clean-supply-shelves',
      'charity-cellar-suspect-cabinet',
      'charity-cellar-prayer-cards',
      'charity-cellar-burned-crate-labels',
      'charity-cellar-work-table',
      'charity-cellar-screened-patient-cot',
      'charity-cellar-collapsed-grate'
    ]
  }
};

const LOOT_SPECS = {
  'south-measure-intake-undercroft': {
    container: {
      id: 'undercroft-rejected-issue-crate',
      kind: 'sealed-storage-crate',
      x: 4,
      y: 4,
      name: 'Rejected Issue Crate',
      log: 'The intake clerk marked the crate REJECTED. Its broken seal exposes sound supplies set aside for salvage.',
      loot: [
        { item: 'field-dressing', count: 1 },
        { item: 'ducat', count: 2 },
        { item: 'drone-service-parts', count: 2 }
      ]
    },
    groundItems: [{ id: 'undercroft-loose-ducat', item: 'ducat', count: 1, x: 5, y: 4 }]
  },
  'south-measure-relief-drain': {
    container: {
      id: 'drain-flooded-repair-crate',
      kind: 'rusted-crate',
      x: 29,
      y: 15,
      name: 'Flooded Repair Crate',
      log: 'Floodwater carried this repair crate into the filter baskets. Most of the kit has rotted into the boards.',
      loot: [
        { item: 'penitent-gear-scrap', count: 1 },
        { item: 'ducat', count: 1 }
      ]
    },
    groundItems: [{ id: 'drain-loose-gear-scrap', item: 'penitent-gear-scrap', count: 1, x: 30, y: 15 }]
  },
  'south-measure-relief-maintenance-annex': {
    container: {
      id: 'annex-condemned-parts-crate',
      kind: 'sealed-storage-crate',
      x: 8,
      y: 5,
      name: 'Condemned Parts Crate',
      log: 'A relief clerk scored the seal twice and wrote SCRAP across the lid.',
      loot: [
        { item: 'penitent-gear-scrap', count: 2 },
        { item: 'drone-service-parts', count: 2 }
      ]
    },
    groundItems: [{ id: 'annex-loose-gear-scrap', item: 'penitent-gear-scrap', count: 1, x: 9, y: 5 }]
  },
  'south-measure-morrow-freight-house': {
    container: {
      id: 'freight-written-off-road-crate',
      kind: 'sealed-storage-crate',
      x: 31,
      y: 12,
      name: 'Written-Off Road Crate',
      log: 'The Morrow seal is cut through. A red tally marks the load as road loss, cleared for recovery.',
      loot: [
        { item: 'relic-rounds', count: 2 },
        { item: 'tinned-beans', count: 1 },
        { item: 'drone-service-parts', count: 2 }
      ]
    },
    groundItems: [{ id: 'freight-loose-ducat', item: 'ducat', count: 1, x: 32, y: 12 }]
  },
  'south-measure-compact-clinic': {
    container: {
      id: 'clinic-censure-field-satchel',
      kind: 'field-satchel',
      x: 12,
      y: 4,
      name: 'Censure Field Satchel',
      log: 'A blue cord marks this satchel for Censure field use.',
      loot: [
        { item: 'field-dressing', count: 1 },
        { item: 'tinned-beans', count: 1 },
        { item: 'drone-service-parts', count: 1 }
      ]
    },
    groundItems: [{ id: 'clinic-loose-field-dressing', item: 'field-dressing', count: 1, x: 12, y: 3 }]
  },
  'south-measure-measure-hall': {
    container: {
      id: 'hall-storm-issue-crate',
      kind: 'sealed-storage-crate',
      x: 14,
      y: 4,
      name: 'Storm Issue Crate',
      log: 'The hall clerk broke the seal and chalked PUBLIC ISSUE across the lid.',
      loot: [
        { item: 'tinned-beans', count: 1 },
        { item: 'ducat', count: 2 }
      ]
    },
    groundItems: [{ id: 'hall-loose-tinned-beans', item: 'tinned-beans', count: 1, x: 15, y: 4 }]
  },
  'south-measure-varo-house': {
    container: {
      id: 'varo-censure-repair-satchel',
      kind: 'field-satchel',
      x: 13,
      y: 5,
      name: 'Censure Repair Satchel',
      log: 'A household tag reads FOR CENSURE USE. The strap is looped shut, not locked.',
      loot: [{ item: 'penitent-gear-scrap', count: 1 }]
    },
    groundItems: [{ id: 'varo-loose-tinned-beans', item: 'tinned-beans', count: 1, x: 4, y: 14 }]
  },
  'south-measure-hidden-rows': {
    container: {
      id: 'hidden-rows-free-clinic-satchel',
      kind: 'field-satchel',
      x: 8,
      y: 15,
      name: 'Free Clinic Satchel',
      log: 'A cloth tag reads FREE CLINIC. TAKE WHAT THE FEVER NEEDS.',
      loot: [
        { item: 'field-dressing', count: 1 },
        { item: 'tinned-beans', count: 1 },
        { item: 'drone-service-parts', count: 1 }
      ]
    },
    groundItems: [{ id: 'hidden-rows-loose-tinned-beans', item: 'tinned-beans', count: 1, x: 17, y: 8 }]
  },
  'south-measure-charity-cellar': {
    container: {
      id: 'cellar-spoiled-relief-crate',
      kind: 'sealed-storage-crate',
      x: 5,
      y: 8,
      name: 'Spoiled Relief Crate',
      log: 'Mildew took the top layer. A chalk cross marks the dry packets for field salvage.',
      loot: [
        { item: 'field-dressing', count: 1 },
        { item: 'tinned-beans', count: 1 }
      ]
    },
    groundItems: [{ id: 'cellar-loose-field-dressing', item: 'field-dressing', count: 1, x: 4, y: 6 }]
  }
};

const LEVEL_PATHS = {
  'ash-road-south': './data/levels/ash_road_south.json',
  ...Object.fromEntries(Object.entries(LEVEL_SPECS).map(([id, spec]) => [id, spec.path]))
};

const CONNECTOR_PAIRS = [
  [
    endpoint(
      'south-measure-civil-stair-surface',
      gate('ash-road-south', 'ash-road-south-civil-stair', 'service-hatch', { x: 64, y: 36 }, { x: 64, y: 37 }, { orient: 'se' }),
      'south-measure-intake-undercroft',
      { x: 29, y: 39, facing: 'ne' }
    ),
    endpoint(
      'south-measure-civil-stair-undercroft',
      gate('south-measure-intake-undercroft', 'undercroft-civil-stair', 'south-measure-door', { x: 29, y: 41 }, { x: 29, y: 40 }, { wallPlane: 'sw' }),
      'ash-road-south',
      { x: 64, y: 37, facing: 'sw' }
    )
  ],
  [
    endpoint(
      'south-measure-collapsed-culvert-surface',
      gate('ash-road-south', 'ash-road-south-collapsed-culvert', 'collapsed-culvert', { x: 120, y: 73 }, { x: 119, y: 73 }),
      'south-measure-relief-drain',
      { x: 41, y: 15, facing: 'nw' }
    ),
    endpoint(
      'south-measure-collapsed-culvert-drain',
      gate('south-measure-relief-drain', 'drain-collapsed-culvert', 'south-measure-door', { x: 43, y: 15 }, { x: 42, y: 15 }, { wallPlane: 'se' }),
      'ash-road-south',
      { x: 119, y: 73, facing: 'nw' }
    )
  ],
  [
    endpoint(
      'south-measure-repair-trench-surface',
      gate('ash-road-south', 'ash-road-south-repair-trench', 'service-hatch', { x: 31, y: 54 }, { x: 31, y: 55 }, { orient: 'sw' }),
      'south-measure-relief-drain',
      { x: 20, y: 2, facing: 'sw' }
    ),
    endpoint(
      'south-measure-repair-trench-drain',
      gate('south-measure-relief-drain', 'drain-repair-trench', 'south-measure-door', { x: 20, y: 0 }, { x: 20, y: 1 }, { wallPlane: 'sw' }),
      'ash-road-south',
      { x: 31, y: 55, facing: 'sw' }
    )
  ],
  [
    endpoint(
      'south-measure-annex-service-hatch-surface',
      gate('ash-road-south', 'ash-road-south-annex-service-hatch', 'service-hatch', { x: 20, y: 24 }, { x: 20, y: 25 }, { orient: 'sw' }),
      'south-measure-relief-drain',
      { x: 2, y: 16, facing: 'se' }
    ),
    endpoint(
      'south-measure-annex-service-hatch-drain',
      gate('south-measure-relief-drain', 'drain-annex-service-hatch', 'south-measure-door', { x: 0, y: 16 }, { x: 1, y: 16 }, { wallPlane: 'se' }),
      'ash-road-south',
      { x: 20, y: 25, facing: 'sw' }
    )
  ],
  [
    endpoint(
      'south-measure-annex-main-door-surface',
      gate('ash-road-south', 'ash-road-south-annex-main-door', 'south-measure-door', { x: 18, y: 26 }, { x: 18, y: 27 }, { wallPlane: 'sw' }),
      'south-measure-relief-maintenance-annex',
      { x: 19, y: 23, facing: 'ne' }
    ),
    endpoint(
      'south-measure-annex-main-door-annex',
      gate('south-measure-relief-maintenance-annex', 'annex-main-door', 'south-measure-door', { x: 19, y: 25 }, { x: 19, y: 24 }, { wallPlane: 'sw' }),
      'ash-road-south',
      { x: 18, y: 27, facing: 'sw' }
    )
  ],
  [
    endpoint(
      'south-measure-freight-main-door-surface',
      gate('ash-road-south', 'ash-road-south-freight-main-door', 'south-measure-door', { x: 31, y: 48 }, { x: 30, y: 48 }, { wallPlane: 'se' }),
      'south-measure-morrow-freight-house',
      { x: 2, y: 13, facing: 'se' }
    ),
    endpoint(
      'south-measure-freight-main-door-freight',
      gate('south-measure-morrow-freight-house', 'freight-main-door', 'south-measure-door', { x: 0, y: 13 }, { x: 1, y: 13 }, { wallPlane: 'se' }),
      'ash-road-south',
      { x: 30, y: 48, facing: 'nw' }
    )
  ],
  [
    endpoint(
      'south-measure-freight-rear-door-surface',
      gate('ash-road-south', 'ash-road-south-freight-rear-door', 'south-measure-door', { x: 37, y: 49 }, { x: 37, y: 50 }, { wallPlane: 'sw' }),
      'south-measure-morrow-freight-house',
      { x: 29, y: 19, facing: 'ne' }
    ),
    endpoint(
      'south-measure-freight-rear-door-freight',
      gate('south-measure-morrow-freight-house', 'freight-rear-door', 'south-measure-door', { x: 29, y: 21 }, { x: 29, y: 20 }, { wallPlane: 'sw' }),
      'ash-road-south',
      { x: 37, y: 50, facing: 'sw' }
    )
  ],
  [
    endpoint(
      'south-measure-clinic-main-door-surface',
      gate('ash-road-south', 'ash-road-south-clinic-main-door', 'south-measure-door', { x: 98, y: 33 }, { x: 98, y: 34 }, { wallPlane: 'sw' }),
      'south-measure-compact-clinic',
      { x: 18, y: 21, facing: 'ne' }
    ),
    endpoint(
      'south-measure-clinic-main-door-clinic',
      gate('south-measure-compact-clinic', 'clinic-main-door', 'south-measure-door', { x: 18, y: 23 }, { x: 18, y: 22 }, { wallPlane: 'sw' }),
      'ash-road-south',
      { x: 98, y: 34, facing: 'sw' }
    )
  ],
  [
    endpoint(
      'south-measure-hall-main-door-surface',
      gate('ash-road-south', 'ash-road-south-hall-main-door', 'south-measure-door', { x: 94, y: 51 }, { x: 94, y: 52 }, { wallPlane: 'sw' }),
      'south-measure-measure-hall',
      { x: 17, y: 19, facing: 'ne' }
    ),
    endpoint(
      'south-measure-hall-main-door-hall',
      gate('south-measure-measure-hall', 'hall-main-door', 'south-measure-door', { x: 17, y: 21 }, { x: 17, y: 20 }, { wallPlane: 'sw' }),
      'ash-road-south',
      { x: 94, y: 52, facing: 'sw' }
    )
  ],
  [
    endpoint(
      'south-measure-varo-door-surface',
      gate('ash-road-south', 'ash-road-south-varo-door', 'south-measure-door', { x: 114, y: 48 }, { x: 113, y: 48 }, { wallPlane: 'se' }),
      'south-measure-varo-house',
      { x: 2, y: 10, facing: 'se' }
    ),
    endpoint(
      'south-measure-varo-door-varo',
      gate('south-measure-varo-house', 'varo-main-door', 'south-measure-door', { x: 0, y: 10 }, { x: 1, y: 10 }, { wallPlane: 'se' }),
      'ash-road-south',
      { x: 113, y: 48, facing: 'nw' }
    )
  ],
  [
    endpoint(
      'south-measure-hidden-rows-drying-frame-surface',
      gate('ash-road-south', 'ash-road-south-hidden-rows-drying-frame', 'south-measure-door', { x: 124, y: 58 }, { x: 125, y: 58 }, { wallPlane: 'se' }),
      'south-measure-hidden-rows',
      { x: 2, y: 6, facing: 'se' }
    ),
    endpoint(
      'south-measure-hidden-rows-drying-frame-rows',
      gate('south-measure-hidden-rows', 'hidden-rows-drying-frame', 'south-measure-door', { x: 0, y: 6 }, { x: 1, y: 6 }, { wallPlane: 'se' }),
      'ash-road-south',
      { x: 125, y: 58, facing: 'se' }
    )
  ],
  [
    endpoint(
      'south-measure-hidden-rows-grave-passage-surface',
      gate('ash-road-south', 'ash-road-south-hidden-rows-grave-passage', 'service-hatch', { x: 112, y: 16 }, { x: 112, y: 16 }, { orient: 'sw' }, false),
      'south-measure-hidden-rows',
      { x: 24, y: 2, facing: 'sw' }
    ),
    endpoint(
      'south-measure-hidden-rows-grave-passage-rows',
      gate('south-measure-hidden-rows', 'hidden-rows-grave-passage-exit', 'south-measure-door', { x: 24, y: 0 }, { x: 24, y: 1 }, { wallPlane: 'sw' }),
      'ash-road-south',
      { x: 112, y: 16, facing: 'ne' }
    )
  ],
  [
    endpoint(
      'south-measure-charity-trapdoor-surface',
      gate('ash-road-south', 'ash-road-south-charity-trapdoor', 'service-hatch', { x: 96, y: 72 }, { x: 96, y: 72 }, { orient: 'se' }, false),
      'south-measure-charity-cellar',
      { x: 18, y: 13, facing: 'nw' }
    ),
    endpoint(
      'south-measure-charity-trapdoor-cellar',
      gate('south-measure-charity-cellar', 'charity-cellar-stair', 'south-measure-door', { x: 21, y: 13 }, { x: 20, y: 13 }, { wallPlane: 'se' }),
      'ash-road-south',
      { x: 96, y: 72, facing: 'se' }
    )
  ],
  [
    endpoint(
      'south-measure-drain-undercroft-valve-drain',
      gate('south-measure-relief-drain', 'drain-undercroft-valve', 'south-measure-door', { x: 12, y: 0 }, { x: 12, y: 1 }, { wallPlane: 'sw' }),
      'south-measure-intake-undercroft',
      { x: 55, y: 15, facing: 'nw' }
    ),
    endpoint(
      'south-measure-drain-undercroft-valve-undercroft',
      gate('south-measure-intake-undercroft', 'undercroft-drain-valve', 'south-measure-door', { x: 57, y: 15 }, { x: 56, y: 15 }, { wallPlane: 'se' }),
      'south-measure-relief-drain',
      { x: 12, y: 2, facing: 'sw' }
    )
  ],
  [
    endpoint(
      'south-measure-annex-drain-hatch-annex',
      gate('south-measure-relief-maintenance-annex', 'annex-floor-hatch', 'service-hatch', { x: 3, y: 19 }, { x: 4, y: 19 }, { orient: 'se' }),
      'south-measure-relief-drain',
      { x: 4, y: 13, facing: 'sw' }
    ),
    endpoint(
      'south-measure-annex-drain-hatch-drain',
      gate('south-measure-relief-drain', 'drain-annex-floor-hatch', 'service-hatch', { x: 4, y: 12 }, { x: 4, y: 13 }, { orient: 'se' }),
      'south-measure-relief-maintenance-annex',
      { x: 4, y: 19, facing: 'se' }
    )
  ]
];

const ENDPOINTS = CONNECTOR_PAIRS.flat();
assert.equal(CONNECTOR_PAIRS.length, 15, 'South Measure has fifteen reciprocal connector pairs');
assert.equal(ENDPOINTS.length, 30, 'South Measure has thirty connector endpoints');
assert.equal(new Set(ENDPOINTS.map((entry) => entry.id)).size, 30, 'connector dialogue ids are unique');

const levels = new Map();
for (const [id, spec] of Object.entries(LEVEL_SPECS)) {
  const level = await readJson(spec.path.replace('./', ''));
  assert.equal(level.id, id);
  levels.set(id, level);
}
levels.set('ash-road-south', await readJson('data/levels/ash_road_south.json'));

const hiddenRows = levels.get('south-measure-hidden-rows');
const hiddenRowsDryingGate = objectById(hiddenRows, 'hidden-rows-drying-frame');
const hiddenRowsEntryScreen = hiddenRows.objects.find((object) => (
  object.kind === 'laundry-line' && object.variant === 'entry-screen'
));
assert.ok(hiddenRowsEntryScreen, 'Hidden Rows has a dedicated domestic drying screen at its west door');
assert.deepEqual(
  { x: hiddenRowsEntryScreen.x, y: hiddenRowsEntryScreen.y, orient: hiddenRowsEntryScreen.orient },
  { x: 1, y: 7, orient: 'se' },
  'the drying screen stands directly in front of the west door'
);
assert.equal(hiddenRowsEntryScreen.blocking, false, 'the drying screen is soft scenery and cannot close the entry route');
assert.deepEqual(hiddenRowsDryingGate.interactionMarker, { x: 1, y: 6 }, 'the west-door interaction marker remains outside the drying screen');
const hiddenRowsEntryGrid = gridWithBlockingObjects(hiddenRows);
assert.equal(hiddenRowsEntryGrid.isWalkable(1, 6), true, 'the drying screen leaves the west-door use cell walkable');
assert.equal(
  reachableCells(hiddenRowsEntryGrid, hiddenRows.spawns.player).has('1,6'),
  true,
  'the player can still reach the west-door use cell through the drying screen'
);

const grids = new Map([...levels].map(([id, level]) => [id, gridWithBlockingObjects(level)]));
const groundItemIds = new Set();

for (const [id, spec] of Object.entries(LEVEL_SPECS)) {
  const level = levels.get(id);
  const grid = grids.get(id);
  assert.equal(level.width, spec.width, `${id} width remains locked`);
  assert.equal(level.height, spec.height, `${id} height remains locked`);
  assert.equal(level.tiles.length, spec.height, `${id} has one tile row per map row`);
  assert.equal(level.tiles.every((row) => row.length === spec.width), true, `${id} tile rows match the locked width`);
  assert.equal(level.spawns.player.actor, 'mara-vey', `${id} uses the player actor spawn`);
  assert.ok(ARRIVAL_FACINGS.has(level.spawns.player.facing), `${id} player start has a valid facing`);
  assert.equal(grid.isWalkable(level.spawns.player.x, level.spawns.player.y), true, `${id} player start is walkable`);
  assert.ok(Array.isArray(level.spawns.npcs), `${id} has an NPC spawn list`);
  assert.equal(
    (level.spawns.enemies ?? []).length,
    ['south-measure-charity-cellar', 'south-measure-intake-undercroft'].includes(id) ? 1 : 0,
    `${id} has only its planned conditional encounter`
  );
  const lootSpec = LOOT_SPECS[id];
  assert.ok(lootSpec, `${id} has a locked sparse-loot specification`);
  assert.deepEqual(level.groundItems, lootSpec.groundItems, `${id} keeps its authored ground pickup`);
  assert.deepEqual(level.levelTransitions ?? [], [], `${id} has no untracked walk-on exits`);
  assert.equal(
    (level.combatTriggers ?? []).length,
    id === 'south-measure-intake-undercroft' ? 1 : 0,
    `${id} has only its planned combat trigger`
  );

  const actorCells = new Set([cellKey(level.spawns.player)]);
  for (const spawn of [...(level.spawns.npcs ?? []), ...(level.spawns.enemies ?? [])]) {
    assert.equal(grid.isWalkable(spawn.x, spawn.y), true, `${id}:${spawn.actor ?? spawn.id} stands on walkable floor`);
    actorCells.add(cellKey(spawn));
  }

  const occupied = new Set();
  const containers = [];
  for (const object of level.objects ?? []) {
    assert.ok(object.x >= 0 && object.x < level.width, `${id}:${object.id ?? object.kind} x is in bounds`);
    assert.ok(object.y >= 0 && object.y < level.height, `${id}:${object.id ?? object.kind} y is in bounds`);
    assert.equal(occupied.has(`${object.x},${object.y}`), false, `${id} has no object overlap at ${object.x},${object.y}`);
    occupied.add(`${object.x},${object.y}`);
    if (object.interact?.type === 'container') {
      containers.push(object);
      assert.ok(OPENED_STATE_CONTAINER_KINDS.has(object.kind), `${id}:${object.id} has opened-state container art`);
      assert.equal(object.blocking, true, `${id}:${object.id} blocks its occupied cell`);
      assert.equal(typeof object.id, 'string', `${id} loot container has a stable id`);
      assert.equal(typeof object.name, 'string', `${id}:${object.id} has a player-facing name`);
      assert.equal(typeof object.interact.log, 'string', `${id}:${object.id} has a player-facing log`);
      assert.ok(object.interact.log.length > 0, `${id}:${object.id} has nonempty container copy`);
      assert.ok(Array.isArray(object.interact.loot) && object.interact.loot.length > 0, `${id}:${object.id} contains sparse loot`);
      for (const loot of object.interact.loot) {
        assert.ok(SOUTH_MEASURE_LOOT_ITEMS.has(loot.item), `${id}:${object.id} contains an approved common item`);
        assert.ok(Number.isInteger(loot.count) && loot.count > 0, `${id}:${object.id} has a positive ${loot.item} count`);
      }
    } else {
      assert.equal(object.interact?.loot, undefined, `${id}:${object.id ?? object.kind} does not carry orphaned loot`);
    }
    if (object.wallPlane !== undefined) {
      assert.ok(WALL_PLANES.has(object.wallPlane), `${id}:${object.id ?? object.kind} has a valid wall plane`);
    }
    if (object.orient !== undefined) {
      assert.ok(ORIENTATIONS.has(object.orient), `${id}:${object.id ?? object.kind} has a valid orientation`);
    }
  }
  assert.equal(containers.length, 1, `${id} keeps exactly one contextual loot container`);
  const container = objectById(level, lootSpec.container.id);
  assert.deepEqual({
    id: container.id,
    kind: container.kind,
    x: container.x,
    y: container.y,
    name: container.name,
    log: container.interact.log,
    loot: container.interact.loot
  }, lootSpec.container, `${id} keeps its authored container placement and contents`);

  const reachable = reachableCells(grid, level.spawns.player);
  const groundItemCells = new Set();
  for (const groundItem of level.groundItems) {
    const groundKey = cellKey(groundItem);
    assert.equal(typeof groundItem.id, 'string', `${id}:${groundItem.item} has a stable ground-item id`);
    assert.ok(groundItem.id.length > 0, `${id}:${groundItem.item} has a nonempty ground-item id`);
    assert.equal(groundItemIds.has(groundItem.id), false, `${id}:${groundItem.id} is unique across helper maps`);
    assert.ok(SOUTH_MEASURE_LOOT_ITEMS.has(groundItem.item), `${id} ground pickup uses an approved common item`);
    assert.ok(Number.isInteger(groundItem.count) && groundItem.count > 0, `${id} ground pickup has a positive count`);
    assert.equal(grid.isWalkable(groundItem.x, groundItem.y), true, `${id}:${groundItem.item} lies on open floor`);
    assert.equal(occupied.has(groundKey), false, `${id}:${groundItem.item} does not overlap an object`);
    assert.equal(actorCells.has(groundKey), false, `${id}:${groundItem.item} does not overlap an actor`);
    assert.equal(groundItemCells.has(groundKey), false, `${id} ground pickups do not overlap each other`);
    assert.equal(reachable.has(groundKey), true, `${id}:${groundItem.item} is reachable from the player start`);
    groundItemIds.add(groundItem.id);
    groundItemCells.add(groundKey);
  }

  for (const anchorId of spec.anchors) {
    const anchor = objectById(level, anchorId);
    if (DIALOGUE_ANCHORS.has(anchorId)) {
      assert.equal(typeof anchor.interact?.dialogue, 'string', `${id}:${anchorId} opens its authored evidence conversation`);
      assert.equal(level.dialogue.includes(anchor.interact.dialogue), true, `${id}:${anchorId} loads its dialogue`);
    } else {
      assert.equal(anchor.interact?.type, 'note', `${id}:${anchorId} remains an inspectable plot anchor`);
      assert.ok(
        typeof anchor.interact.log === 'string' || (Array.isArray(anchor.interact.log) && anchor.interact.log.length > 0),
        `${id}:${anchorId} has inspectable copy`
      );
    }
    assert.ok(anchor.interactionMarker, `${id}:${anchorId} has a use cell`);
    assert.equal(grid.isWalkable(anchor.interactionMarker.x, anchor.interactionMarker.y), true, `${id}:${anchorId} use cell is walkable`);
    assert.equal(
      Math.abs(anchor.x - anchor.interactionMarker.x) + Math.abs(anchor.y - anchor.interactionMarker.y),
      1,
      `${id}:${anchorId} use cell is cardinally adjacent`
    );
  }
}

for (const [forward, reverse] of CONNECTOR_PAIRS) {
  assert.equal(forward.targetLevel, reverse.source.level, `${forward.id} targets the map that owns ${reverse.id}`);
  assert.equal(reverse.targetLevel, forward.source.level, `${reverse.id} targets the map that owns ${forward.id}`);

  for (const [arrival, destinationGate] of [[forward.targetPlayer, reverse.source], [reverse.targetPlayer, forward.source]]) {
    if (arrival.x === destinationGate.position.x && arrival.y === destinationGate.position.y) continue;
    const inward = INWARD_FACING_VECTORS[arrival.facing];
    assert.ok(inward, `${destinationGate.objectId} uses a cardinal isometric arrival facing`);
    const gateToArrival = {
      x: arrival.x - destinationGate.position.x,
      y: arrival.y - destinationGate.position.y
    };
    assert.ok(
      (gateToArrival.x * inward.x) + (gateToArrival.y * inward.y) > 0,
      `${destinationGate.objectId} arrival faces away from its doorway and into the destination map`
    );
    assert.equal(
      (gateToArrival.x * inward.y) - (gateToArrival.y * inward.x),
      0,
      `${destinationGate.objectId} arrival direction stays perpendicular to its doorway plane`
    );
  }
}

for (const spec of ENDPOINTS) {
  const sourceLevel = levels.get(spec.source.level);
  const targetLevel = levels.get(spec.targetLevel);
  const sourceGrid = grids.get(spec.source.level);
  const targetGrid = grids.get(spec.targetLevel);
  assert.ok(sourceLevel, `${spec.id} source level is loaded`);
  assert.ok(targetLevel, `${spec.id} target level is loaded`);

  const sourceObject = objectById(sourceLevel, spec.source.objectId);
  assert.equal(sourceObject.kind, spec.source.kind, `${spec.id} uses its intended physical gate`);
  assert.deepEqual({ x: sourceObject.x, y: sourceObject.y }, spec.source.position, `${spec.id} gate cell remains fixed`);
  assert.deepEqual(sourceObject.interactionMarker, spec.source.marker, `${spec.id} use cell remains fixed`);
  assert.equal(sourceObject.blocking ?? false, spec.source.blocking, `${spec.id} gate collision remains intentional`);
  assert.equal(sourceObject.interact?.dialogue, spec.id, `${spec.id} is owned by its source gate`);
  assert.equal(sourceLevel.dialogue.includes(spec.id), true, `${spec.id} is loaded by its source map`);
  assert.equal(sourceGrid.isWalkable(spec.source.marker.x, spec.source.marker.y), true, `${spec.id} source use cell is walkable`);
  assert.ok(
    Math.abs(spec.source.position.x - spec.source.marker.x) + Math.abs(spec.source.position.y - spec.source.marker.y) <= 1,
    `${spec.id} source gate and use cell touch cardinally or share a walkable hatch cell`
  );
  assert.ok(clearCardinalNeighbors(sourceGrid, spec.source.marker) >= 2, `${spec.id} source use cell has two-cell clearance`);
  for (const [property, expected] of Object.entries(spec.source.frame)) {
    assert.equal(sourceObject[property], expected, `${spec.id} keeps ${property} ${expected}`);
  }
  if (sourceObject.kind === 'south-measure-door') {
    if (sourceObject.wallPlane === 'sw') {
      assert.equal(spec.source.position.x, spec.source.marker.x, `${spec.id} sw-plane door uses the matching grid axis`);
    } else {
      assert.equal(spec.source.position.y, spec.source.marker.y, `${spec.id} se-plane door uses the matching grid axis`);
    }
  }

  const dialogue = await readJson(`data/dialogue/${spec.id}.json`);
  assert.equal(dialogue.id, spec.id);
  const travelChoices = dialogue.nodes.start.choices.filter((choice) => choice.effects?.loadLevel);
  assert.ok(travelChoices.length >= 1, `${spec.id} has at least one authored travel route`);
  for (const choice of travelChoices) {
    assert.deepEqual(choice.effects.loadLevel, {
      path: LEVEL_PATHS[spec.targetLevel],
      player: spec.targetPlayer
    }, `${spec.id} preserves destination, arrival, and facing for ${choice.label}`);
  }
  assert.ok(ARRIVAL_FACINGS.has(spec.targetPlayer.facing), `${spec.id} arrival facing is valid`);
  assert.equal(targetGrid.isWalkable(spec.targetPlayer.x, spec.targetPlayer.y), true, `${spec.id} arrival is walkable`);
  assert.ok(clearCardinalNeighbors(targetGrid, spec.targetPlayer) >= 2, `${spec.id} arrival has two-cell clearance`);
}

for (const [id, level] of levels) {
  if (id === 'ash-road-south') continue;
  const expectedDialogue = ENDPOINTS
    .filter((entry) => entry.source.level === id)
    .map((entry) => entry.id)
    .sort();
  assert.deepEqual(
    level.dialogue.filter((dialogueId) => expectedDialogue.includes(dialogueId)).sort(),
    expectedDialogue,
    `${id} loads every physical connector endpoint alongside its population conversations`
  );
}

for (const [id, spec] of Object.entries(LEVEL_SPECS)) {
  const level = levels.get(id);
  const grid = grids.get(id);
  const useCells = (level.objects ?? [])
    .filter((object) => object.interact)
    .map((object) => ({ id: object.id, cell: object.interactionMarker }));
  const arrivals = ENDPOINTS.filter((entry) => entry.targetLevel === id).map((entry) => ({
    dialogue: entry.id,
    cell: entry.targetPlayer
  }));
  assert.ok(arrivals.length > 0, `${id} has at least one inbound route`);
  for (const arrival of arrivals) {
    const reachable = reachableCells(grid, arrival.cell);
    for (const useCell of useCells) {
      assert.ok(useCell.cell, `${id}:${useCell.id} has an interaction marker`);
      assert.equal(
        reachable.has(cellKey(useCell.cell)),
        true,
        `${arrival.dialogue} reaches ${id}:${useCell.id} by cardinal movement`
      );
    }
  }
}

for (const [levelId, objectId] of [
  ['south-measure-intake-undercroft', 'undercroft-return-passage'],
  ['south-measure-relief-drain', 'relief-drain-waiting-alcove'],
  ['south-measure-relief-maintenance-annex', 'relief-annex-burned-rear-bay'],
  ['south-measure-charity-cellar', 'charity-cellar-collapsed-grate']
]) {
  const object = objectById(levels.get(levelId), objectId);
  assert.equal(object.interact?.dialogue, undefined, `${levelId}:${objectId} is not a connector`);
  assert.notEqual(object.interact?.type, 'secret-exit', `${levelId}:${objectId} remains an intentional non-exit`);
  assert.notEqual(object.mapMarker?.kind, 'exit', `${levelId}:${objectId} is not marked as an exit`);
}

const clinic = levels.get('south-measure-compact-clinic');
const wardBeds = clinic.objects.filter((object) => object.kind === 'clinic-bed' && object.variant !== 'isolation');
const isolationBeds = clinic.objects.filter((object) => object.kind === 'clinic-bed' && object.variant === 'isolation');
assert.equal(wardBeds.length, 6, 'Compact clinic has exactly six ward beds');
assert.equal(isolationBeds.length, 1, 'Compact clinic has one separately marked isolation bed');
assert.equal(objectById(clinic, 'compact-clinic-six-bed-ward').kind, 'clinic-bed');
assert.equal(objectById(clinic, 'compact-clinic-isolation-room').variant, 'isolation');

const reliefDrain = levels.get('south-measure-relief-drain');
assert.equal(reliefDrain.legend['+']?.floor, 'relief-channel-junction', 'drain branches use the fitted junction floor');
assert.equal(reliefDrain.tiles[14][10], '+', 'west channel branch has a junction tile');
assert.equal(reliefDrain.tiles[14][40], '+', 'east channel branch has a junction tile');

console.log('South Measure helper map contract tests passed.');
