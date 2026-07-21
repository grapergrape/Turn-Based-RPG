import { createHash } from 'node:crypto';
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const playwrightImport = process.env.PLAYWRIGHT_IMPORT
  ?? 'file:///home/gaspersk/.npm/_npx/705bc6b22212b352/node_modules/playwright/index.mjs';
const { chromium } = await import(playwrightImport);

const SCRIPT_VERSION = 1;
const EXPECTED_PER_MAP = Object.freeze({
  'detached-crop': 140,
  'native-runtime-focus': 40,
  'broad-composition': 20
});
const EXPECTED_MAP_COUNT = 9;
const EXPECTED_PASSES_PER_MAP = 200;
const EXPECTED_TOTAL_PASSES = 1800;
const BROWSER_ATTEMPTS_PER_BATCH = 4;
const VOID_RGB = Object.freeze([5, 5, 5]);

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const levelDir = path.join(repoRoot, 'data/levels');

const sharedCriteria = Object.freeze([
  ['overall-silhouette', 'Overall silhouette', 'The room footprint and major masses should identify this place before labels are read.', [0.5, 0.5]],
  ['material-language', 'Material language', 'Floor, wall, cloth, timber, stone, and metal treatment should support this map alone.', [0.24, 0.26]],
  ['zone-hierarchy', 'Zone hierarchy', 'Primary, secondary, and service zones should read through scale and placement.', [0.5, 0.34]],
  ['prop-scale', 'Prop scale', 'Furniture and machinery should read at native scale without looking like scattered tokens.', [0.34, 0.54]],
  ['floor-rhythm', 'Floor rhythm', 'Wear, seams, drainage, and traffic marks should reinforce circulation and use.', [0.52, 0.68]],
  ['boundary-rhythm', 'Boundary rhythm', 'Walls, rails, cages, and cloth screens should make intentional boundaries without maze noise.', [0.76, 0.34]],
  ['negative-space', 'Negative space', 'Walkable lanes and work clearances should look deliberate and remain easy to parse.', [0.5, 0.52]],
  ['depth-occlusion', 'Depth and occlusion', 'Tall elements should layer cleanly without hiding the feature that defines the zone.', [0.7, 0.7]],
  ['light-and-contact', 'Light and contact', 'Upper-left shading and grounded contact shadows should make every volume sit in the room.', [0.3, 0.72]],
  ['distinct-at-glance', 'Distinct at a glance', 'This map should not be mistaken for another Ash Road South helper interior.', [0.5, 0.5]]
]);

const mapDefinitions = Object.freeze([
  {
    stem: 'south_measure_intake_undercroft',
    id: 'south-measure-intake-undercroft',
    concepts: [
      ['civil-stair', 'Civil stair arrival', 'The south stair and first circulation choice should read as a controlled civic intake.', 'undercroft-civil-stair'],
      ['clerk-wicket', 'Sealed clerk wicket', 'The raised clerk position should dominate the intake side as a defended administrative post.', 'undercroft-intake-clerk'],
      ['records-vault', 'Records vault', 'The northwest records mass should feel dense, old, and physically separated.', 'undercroft-original-household-roll'],
      ['exam-bay', 'Examination bay', 'Screens, drain, restraint fittings, and storage should form one legible examination zone.', 'undercroft-restraint-drain'],
      ['pump-chamber', 'Pump chamber', 'The east pump chamber should carry the greatest mechanical visual mass in the map.', 'undercroft-isolation-manifold'],
      ['settling-controls', 'Settling controls', 'The feed controls should connect visually to the pump system instead of reading as a lone prop.', 'undercroft-settling-feed-controls'],
      ['pipe-gantry', 'Pipe gantry', 'Pipes, work platform, and railings should create layered industrial depth.', 'undercroft-pump-work-platform'],
      ['wet-channel', 'Wet maintenance channel', 'The east edge should read as a wet service run distinct from the dry records and intake zones.', 'undercroft-pipe-vein'],
      ['civil-traces', 'Civil processing traces', 'Hooks, handprints, copies, and orders should make the intake history visible in the architecture.', 'undercroft-lime-handprints'],
      ['return-passage', 'Return passage', 'The return route should be visually clear without weakening the sealed institutional character.', 'undercroft-return-passage']
    ]
  },
  {
    stem: 'south_measure_relief_drain',
    id: 'south-measure-relief-drain',
    concepts: [
      ['channel-dominance', 'Drain channel dominance', 'The depressed polluted flow should be the first and longest shape read in the map.', 'relief-drain-polluted-flow'],
      ['raised-walk', 'Raised service walk', 'The north walk and its railing should read as a continuous safer route above the channel.', 'relief-drain-raised-walk'],
      ['valve-chamber', 'Valve chamber', 'The isolation wheel and connected pipework should form a coherent valve station.', 'relief-drain-jammed-isolation-wheel'],
      ['repair-trench', 'Repair trench mouth', 'The repair entrance should look like a worked service branch rather than another doorway.', 'drain-repair-trench'],
      ['resident-alcove', 'Resident alcove', 'The waiting alcove should show improvised occupation without losing the drain identity.', 'relief-drain-waiting-alcove'],
      ['filter-debris', 'Broken filter debris', 'Baskets, reeds, and channel debris should explain the failing filtration line.', 'relief-drain-broken-filter-baskets'],
      ['annex-hatch', 'Annex floor hatch', 'The hatch connection should feel mechanically integrated with the drain floor.', 'drain-annex-floor-hatch'],
      ['culvert-end', 'Collapsed culvert', 'The east termination should close the channel with a damaged, heavy silhouette.', 'drain-collapsed-culvert'],
      ['crawl-marks', 'Crawl marks', 'Small human traces should remain readable against the large wet infrastructure.', 'relief-drain-childrens-crawl-marks'],
      ['flooded-cache', 'Flooded repair cache', 'The repair crate should belong to a recognizable work pocket beside the water line.', 'drain-flooded-repair-crate']
    ]
  },
  {
    stem: 'south_measure_relief_maintenance_annex',
    id: 'south-measure-relief-maintenance-annex',
    concepts: [
      ['loading-entry', 'Loading entry', 'The south entrance should open onto a loading and claims zone, not an empty hall.', 'annex-main-door'],
      ['claim-desk', 'Claim desk', 'The claim desk should anchor the human administrative edge of the machine floor.', 'relief-annex-claim-desk'],
      ['dead-hoist', 'Dead hoist', 'The hoist and loading apparatus should form a strong industrial silhouette.', 'relief-annex-dead-hoist'],
      ['machine-floor', 'Machine floor', 'Repeated machinery and work clearances should make the center dense but navigable.', 'relief-annex-machine-floor'],
      ['parts-cage', 'Parts cage', 'The north cage should read as a continuous secured store with visible contents.', 'relief-annex-parts-cage'],
      ['bypass-bench', 'Bypass bench', 'Schedules and parts should make the bypass station look actively worked.', 'relief-annex-bypass-schedule'],
      ['cooling-jacket', 'Cooling jacket', 'The west cooling assembly should have a distinct mass and pipe relationship.', 'relief-annex-cooling-jacket'],
      ['burned-bay', 'Burned rear bay', 'The east bay should break the shell with an unmistakable damaged silhouette and scorch field.', 'relief-annex-burned-rear-bay'],
      ['relief-board', 'Relief schedules', 'The schedule wall should read within the work system rather than as isolated exposition.', 'relief-annex-relief-schedules'],
      ['floor-hatch', 'Drain access hatch', 'The floor hatch should visually connect the annex machinery to the drain below.', 'annex-floor-hatch']
    ]
  },
  {
    stem: 'south_measure_morrow_freight_house',
    id: 'south-measure-morrow-freight-house',
    concepts: [
      ['public-office', 'Public freight office', 'The public counter should establish a tight working office immediately inside the main door.', 'morrow-public-office'],
      ['freight-scale', 'Freight scale', 'The scale should be a dominant central working object with clear loading space.', 'morrow-freight-scale'],
      ['route-table', 'Route table', 'Maps and route work should give the central table a distinct dispatch function.', 'morrow-route-table'],
      ['ledger-cage', 'Ledger cage', 'The north ledger run should read as a secured continuous enclosure.', 'morrow-ledger-cage'],
      ['bonded-store', 'Bonded store', 'The east store should show dense freight mass behind a controlled boundary.', 'morrow-bonded-store'],
      ['convoy-boards', 'Convoy boards', 'Loss and medicine boards should form one readable route-planning wall.', 'morrow-convoy-loss-board'],
      ['guard-bunks', 'Guard bunks', 'Bunks and personal gear should make the west side occupied without turning domestic.', 'morrow-guard-bunks'],
      ['guard-mess', 'Guard mess', 'The mess pocket should be compact, worn, and subordinate to freight operations.', 'morrow-guard-mess'],
      ['surety-folios', 'Surety folios', 'Ledgers and folios should create visible administrative density around the cage.', 'morrow-household-surety-folios'],
      ['rear-loading', 'Rear loading door', 'The rear door should terminate a believable freight path through the building.', 'freight-rear-door']
    ]
  },
  {
    stem: 'south_measure_compact_clinic',
    id: 'south-measure-compact-clinic',
    concepts: [
      ['triage-entry', 'Triage entry', 'The south entry, desk, and dressing supplies should read as a compact triage station.', 'compact-clinic-triage-desk'],
      ['six-bed-ward', 'Six-bed ward', 'Six beds should form one orderly central ward with repeated bedside detail and usable lanes.', 'compact-clinic-six-bed-ward'],
      ['applicant-lane', 'Applicant lane', 'Canvas screens should guide the east queue without creating hard maze-like rooms.', 'compact-clinic-applicant-lane'],
      ['placement-archive', 'Placement archive', 'Records and blood cards should give the northeast corner a precise clerical function.', 'compact-clinic-placement-archive'],
      ['blood-cards', 'Blood-card station', 'The blood-card wall should remain legible among nearby clinical storage.', 'compact-clinic-blood-card-station'],
      ['cold-service', 'Cold service bay', 'The northwest service machinery should feel colder and harder than the canvas ward.', 'compact-clinic-cold-service-bay'],
      ['flow-monitor', 'Flow monitor', 'The monitor and backup cell should read as one constrained utility system.', 'compact-clinic-flow-monitor'],
      ['isolation-room', 'Isolation room', 'The west isolation bed should be screened and visually separate from the six-bed ward.', 'compact-clinic-isolation-room'],
      ['staff-wash', 'Staff wash', 'The rear wash zone should show repetitive clinical use and drainage.', 'compact-clinic-staff-wash'],
      ['field-satchel', 'Field supply pocket', 'The satchel and nearby service storage should look intentionally staged for emergency use.', 'clinic-censure-field-satchel']
    ]
  },
  {
    stem: 'south_measure_measure_hall',
    id: 'south-measure-measure-hall',
    concepts: [
      ['assembly-entry', 'Assembly entry', 'The main door should reveal an unmistakably open civic assembly floor.', 'hall-main-door'],
      ['slate-school', 'Slate school', 'Repeated desks should create a classroom field rather than a single symbolic table.', 'measure-hall-slate-school'],
      ['council-table', 'Council table', 'A long rear council table should command the formal end of the room.', 'measure-hall-council-table'],
      ['hall-kitchen', 'Hall kitchen', 'Oven, tables, and stores should form a working west kitchen edge.', 'measure-hall-kitchen'],
      ['water-roll', 'Water roll', 'The current water record should sit in a visibly maintained civic records wall.', 'measure-hall-current-water-roll'],
      ['burial-copies', 'Burial copies', 'The burial archive should read as stored public memory, not generic shelving.', 'measure-hall-burial-copies'],
      ['canvas-loft', 'Canvas loft', 'The loft access and hanging canvas should create vertical utility at the rear.', 'measure-hall-canvas-loft'],
      ['painted-strip', 'Painted measure strip', 'The painted strip should bind the rear civic fixtures into one visual line.', 'measure-hall-painted-strip'],
      ['custody-rest', 'Custody rest', 'The empty custody place should remain a distinct absence within the hall furniture.', 'measure-hall-empty-custody-rest'],
      ['storm-room', 'Storm room', 'The small storm room should read as a compact protected annex to the open hall.', 'measure-hall-storm-room']
    ]
  },
  {
    stem: 'south_measure_varo_house',
    id: 'south-measure-varo-house',
    concepts: [
      ['door-bench', 'Door and pump bench', 'The entry should immediately read as a cramped repair household.', 'varo-house-pump-bench'],
      ['diagram-wall', 'Pump diagram wall', 'The diagram should belong to the repair bench and remain readable at native scale.', 'varo-house-diagram-wall'],
      ['cup-repair', 'Cup repair table', 'Small tools and repaired cups should make the front work table feel used.', 'varo-house-cup-repair-table'],
      ['family-table', 'Family table', 'Place settings and tight seating should distinguish the meal table from work benches.', 'varo-house-family-table'],
      ['sleeping-curtains', 'Sleeping curtains', 'Curtains and bed niches should divide sleep space softly inside the small shell.', 'varo-house-sleeping-partitions'],
      ['rear-shelf', 'Rear work shelf', 'Packed shelving should give the rear wall dense household and repair storage.', 'varo-house-rear-work-shelf'],
      ['school-tools', 'School tools', 'The school-tool pocket should read as part of family life, not freight storage.', 'varo-house-school-tools'],
      ['repair-satchel', 'Repair satchel', 'The satchel should sit in a believable ready-work cluster.', 'varo-censure-repair-satchel'],
      ['main-threshold', 'Main threshold', 'The doorway should preserve a narrow but readable route into the crowded home.', 'varo-main-door'],
      ['lived-in-density', 'Lived-in density', 'Beds, stove, water, tools, shelves, and meals should make the whole house feel occupied.', 'varo-house-family-table']
    ]
  },
  {
    stem: 'south_measure_hidden_rows',
    id: 'south-measure-hidden-rows',
    concepts: [
      ['drying-entry', 'Drying-frame entrance', 'Laundry and hanging cloth should conceal and announce the shared entrance at once.', 'hidden-rows-drying-frame'],
      ['first-household', 'First household', 'The first family cluster should have its own bed, storage, and domestic identity.', 'hidden-rows-first-household-room'],
      ['second-household', 'Second household', 'The second household should read as a separate lived-in cluster off the common lane.', 'hidden-rows-second-household-room'],
      ['third-household', 'Third household', 'The third household should remain distinct through furniture and wear, not labels.', 'hidden-rows-third-household-room'],
      ['water-branch', 'Concealed water branch', 'The hidden pipe branch should visibly feed the row and shape nearby use.', 'hidden-rows-concealed-water-branch'],
      ['cooking-flue', 'Shared cooking flue', 'Oven and flue should create a communal heat and cooking center.', 'hidden-rows-shared-cooking-flue'],
      ['treatment-room', 'Treatment room', 'The treatment bed should form a modest clinical pocket inside domestic space.', 'hidden-rows-treatment-room'],
      ['meeting-table', 'Meeting table', 'The shared table should define a compact collective meeting place.', 'hidden-rows-meeting-table'],
      ['private-list', 'Private water list', 'The private list should be secured and visually connected to communal decisions.', 'hidden-rows-private-water-list'],
      ['grave-passage', 'Grave passage', 'The narrow rear passage and rail should look concealed, compressed, and directional.', 'hidden-rows-grave-passage']
    ]
  },
  {
    stem: 'south_measure_charity_cellar',
    id: 'south-measure-charity-cellar',
    concepts: [
      ['stair-arrival', 'Cellar stair arrival', 'The stair should reveal a compact medicine reserve rather than another bare stone room.', 'charity-cellar-stair'],
      ['clean-shelves', 'Clean supply shelves', 'Long clean shelf runs should create the strongest storage silhouette.', 'charity-cellar-clean-supply-shelves'],
      ['suspect-cabinet', 'Suspect cabinet', 'The locked suspect cabinet should read as separate and more controlled than clean stores.', 'charity-cellar-suspect-cabinet'],
      ['prayer-cards', 'Prayer cards', 'The prayer-card wall should remain a small human layer against dense medical storage.', 'charity-cellar-prayer-cards'],
      ['burned-labels', 'Burned crate labels', 'The evidence labels should visibly connect damaged containers to the work area.', 'charity-cellar-burned-crate-labels'],
      ['evidence-bench', 'Evidence bench', 'The workbench should be large and cluttered enough to define an investigation zone.', 'charity-cellar-work-table'],
      ['screened-cot', 'Screened patient cot', 'The patient cot should be clearly screened from medicine and evidence stores.', 'charity-cellar-screened-patient-cot'],
      ['collapsed-grate', 'Collapsed grate', 'The grate and crawl should form a low, damaged termination at the west edge.', 'charity-cellar-collapsed-grate'],
      ['spoiled-crate', 'Spoiled relief crate', 'The spoiled crate should sit inside a coherent suspect-supply cluster.', 'cellar-spoiled-relief-crate'],
      ['compact-reserve', 'Compact reserve density', 'The whole cellar should feel tightly stocked while preserving a clear central work lane.', 'charity-cellar-work-table']
    ]
  }
]);

const detachedVariants = Object.freeze([
  { width: 0.28, height: 0.34, dx: 0, dy: 0, label: 'tight-center' },
  { width: 0.34, height: 0.4, dx: -0.04, dy: -0.02, label: 'near-northwest' },
  { width: 0.34, height: 0.4, dx: 0.04, dy: 0.02, label: 'near-southeast' },
  { width: 0.42, height: 0.46, dx: -0.06, dy: 0.04, label: 'context-west' },
  { width: 0.42, height: 0.46, dx: 0.06, dy: -0.04, label: 'context-east' },
  { width: 0.5, height: 0.54, dx: 0, dy: -0.06, label: 'wide-north' },
  { width: 0.56, height: 0.6, dx: 0, dy: 0.06, label: 'wide-south' }
]);

const broadInsets = Object.freeze([
  [0, 0, 0, 0], [1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1],
  [1, 1, 0, 0], [0, 1, 1, 0], [0, 0, 1, 1], [1, 0, 0, 1], [1, 0, 1, 0],
  [0, 1, 0, 2], [2, 0, 0, 0], [0, 2, 0, 0], [0, 0, 2, 0], [0, 0, 0, 2],
  [2, 1, 0, 0], [0, 2, 1, 0], [0, 0, 2, 1], [1, 0, 0, 2], [1, 1, 1, 1]
]);

function parseArgs(argv) {
  const options = {
    outputDir: path.join(repoRoot, '.ai/visual-audit/ash-road-south-200-passes'),
    mapSelectors: [],
    smokePerMode: null,
    planOnly: false,
    headed: false
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--output') options.outputDir = path.resolve(requireValue(argv, ++index, arg));
    else if (arg === '--maps') options.mapSelectors = requireValue(argv, ++index, arg).split(',').map((value) => value.trim()).filter(Boolean);
    else if (arg === '--smoke-per-mode') options.smokePerMode = positiveInteger(requireValue(argv, ++index, arg), arg);
    else if (arg === '--plan-only') options.planOnly = true;
    else if (arg === '--headed') options.headed = true;
    else if (arg === '--help' || arg === '-h') options.help = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return options;
}

function requireValue(argv, index, flag) {
  const value = argv[index];
  if (!value || value.startsWith('--')) throw new Error(`${flag} requires a value`);
  return value;
}

function positiveInteger(value, flag) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 20) {
    throw new Error(`${flag} must be an integer from 1 through 20`);
  }
  return parsed;
}

function usage() {
  return [
    'Capture exactly 200 Ash Road South visual evidence passes per helper map.',
    '',
    'Full certifying run:',
    '  GAME_AUDIT_URL=http://127.0.0.1:8080 MAP_AUDIT_URL=http://127.0.0.1:8080/.ai/map-review/capture-scene.html \\',
    '    node .ai/map-review/capture-south-measure-200-passes.mjs --output .ai/visual-audit/ash-road-south-200-passes',
    '',
    'Bounded, explicitly non-certifying smoke run:',
    '  node .ai/map-review/capture-south-measure-200-passes.mjs --maps south-measure-varo-house \\',
    '    --smoke-per-mode 1 --output /tmp/south-measure-200-smoke',
    '',
    'Options:',
    '  --maps <id,stem>       Select maps. Any subset is non-certifying.',
    '  --smoke-per-mode <n>   Capture the first n records in each of the three modes.',
    '  --plan-only            Validate the complete 1,800-record recipe without a browser.',
    '  --headed               Show Chrome while capturing.',
    '  --output <dir>          Evidence output directory.'
  ].join('\n');
}

function sha256(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function slug(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function stableViewKey(record) {
  if (record.mode === 'native-runtime-focus') {
    return JSON.stringify([record.mode, record.view.x, record.view.y]);
  }
  // capture-scene converts a grid rectangle into these four isometric screen
  // edges. Different grid rectangles that collapse to the same four values
  // are the same visual crop and therefore must not count twice.
  return JSON.stringify([
    record.mode,
    record.view.x0 - record.view.y1,
    record.view.x1 - record.view.y0,
    record.view.x0 + record.view.y0,
    record.view.x1 + record.view.y1
  ]);
}

function pngDimensions(buffer) {
  const signature = '89504e470d0a1a0a';
  if (buffer.length < 24 || buffer.subarray(0, 8).toString('hex') !== signature) {
    throw new Error('Screenshot is not a valid PNG');
  }
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

function criteriaFor(definition) {
  const concept = definition.concepts.map(([id, title, expectation, anchorId]) => ({
    id: `concept-${id}`,
    title,
    expectation,
    target: { anchorId }
  }));
  const shared = sharedCriteria.map(([id, title, expectation, focus]) => ({
    id: `composition-${id}`,
    title,
    expectation,
    target: { normalized: focus }
  }));
  const criteria = [...concept, ...shared];
  if (criteria.length !== 20) throw new Error(`${definition.id}: expected 20 criteria, got ${criteria.length}`);
  return criteria;
}

function occupiedCells(level) {
  const occupied = new Set();
  for (const object of level.objects ?? []) occupied.add(`${object.x},${object.y}`);
  const spawns = level.spawns ?? {};
  for (const actor of [spawns.player, ...(spawns.npcs ?? []), ...(spawns.enemies ?? [])].filter(Boolean)) {
    occupied.add(`${actor.x},${actor.y}`);
  }
  return occupied;
}

function walkableCells(level) {
  const occupied = occupiedCells(level);
  const cells = [];
  for (let y = 0; y < level.height; y += 1) {
    const row = level.tiles[y];
    for (let x = 0; x < level.width; x += 1) {
      if (level.legend[row[x]]?.walkable && !occupied.has(`${x},${y}`)) cells.push({ x, y });
    }
  }
  if (cells.length < 40) throw new Error(`${level.id}: only ${cells.length} unoccupied walkable focus cells`);
  return cells;
}

function resolveTarget(level, criterion) {
  const anchorId = criterion.target.anchorId;
  if (anchorId) {
    const object = (level.objects ?? []).find((entry) => entry.id === anchorId);
    if (!object) throw new Error(`${level.id}: missing visual criterion anchor ${anchorId}`);
    return { x: object.x, y: object.y, source: `object:${anchorId}` };
  }
  const [nx, ny] = criterion.target.normalized;
  return {
    x: Math.round(nx * (level.width - 1)),
    y: Math.round(ny * (level.height - 1)),
    source: `normalized:${nx.toFixed(2)},${ny.toFixed(2)}`
  };
}

function nearestUnusedCell(cells, target, used, variant) {
  const bias = variant === 0 ? { x: -0.35, y: -0.2 } : { x: 0.65, y: 0.45 };
  let best = null;
  let bestScore = Infinity;
  for (const cell of cells) {
    const key = `${cell.x},${cell.y}`;
    if (used.has(key)) continue;
    const dx = cell.x - target.x - bias.x;
    const dy = cell.y - target.y - bias.y;
    const score = dx * dx + dy * dy + (cell.y * 0.0001) + (cell.x * 0.000001);
    if (score < bestScore) {
      best = cell;
      bestScore = score;
    }
  }
  if (!best) throw new Error('Could not allocate a unique runtime focus cell');
  used.add(`${best.x},${best.y}`);
  return { ...best, targetDistance: Number(Math.sqrt(bestScore).toFixed(3)) };
}

function uniqueCrop(level, target, variant, used, salt) {
  const baseWidth = clamp(Math.round(level.width * variant.width), 7, level.width - 2);
  const baseHeight = clamp(Math.round(level.height * variant.height), 6, level.height - 2);
  for (let attempt = 0; attempt < 800; attempt += 1) {
    const ring = Math.floor(attempt / 25);
    const offsetIndex = attempt % 25;
    const ox = (offsetIndex % 5) - 2;
    const oy = Math.floor(offsetIndex / 5) - 2;
    const widthDelta = ((ring + salt) % 5) - 2;
    const heightDelta = ((Math.floor(ring / 5) + salt) % 5) - 2;
    const cropWidth = clamp(baseWidth + widthDelta, 6, level.width - 1);
    const cropHeight = clamp(baseHeight + heightDelta, 5, level.height - 1);
    const centerX = target.x + variant.dx * level.width + ox + (ring % 3) - 1;
    const centerY = target.y + variant.dy * level.height + oy + (Math.floor(ring / 3) % 3) - 1;
    const minimumX0 = Math.max(0, target.x - cropWidth + 1);
    const maximumX0 = Math.min(level.width - cropWidth, target.x);
    const minimumY0 = Math.max(0, target.y - cropHeight + 1);
    const maximumY0 = Math.min(level.height - cropHeight, target.y);
    const x0 = clamp(Math.round(centerX - cropWidth / 2), minimumX0, maximumX0);
    const y0 = clamp(Math.round(centerY - cropHeight / 2), minimumY0, maximumY0);
    const crop = { x0, y0, x1: x0 + cropWidth - 1, y1: y0 + cropHeight - 1 };
    const key = `${crop.x0},${crop.y0},${crop.x1},${crop.y1}`;
    if (used.has(key)) continue;
    used.add(key);
    return crop;
  }
  throw new Error(`${level.id}: unable to allocate 140 unique detached crops`);
}

function buildPlan(definition, level, levelSha256) {
  if (level.id !== definition.id) {
    throw new Error(`${definition.stem}: expected level id ${definition.id}, got ${level.id}`);
  }
  if (level.width < 8 || level.height < 7) throw new Error(`${level.id}: map is too small for audit crops`);
  const criteria = criteriaFor(definition);
  const targets = criteria.map((criterion) => resolveTarget(level, criterion));
  const passes = [];
  const usedCrops = new Set();

  for (let cycle = 0; cycle < detachedVariants.length; cycle += 1) {
    for (let criterionIndex = 0; criterionIndex < criteria.length; criterionIndex += 1) {
      const passNumber = passes.length + 1;
      const variant = detachedVariants[cycle];
      const crop = uniqueCrop(level, targets[criterionIndex], variant, usedCrops, passNumber);
      passes.push({
        mapId: level.id,
        levelStem: definition.stem,
        passNumber,
        mode: 'detached-crop',
        criterion: criteria[criterionIndex],
        view: {
          kind: 'grid-crop',
          ...crop,
          variant: variant.label,
          criterionTarget: targets[criterionIndex]
        }
      });
    }
  }

  const cells = walkableCells(level);
  const usedFocus = new Set();
  for (let variant = 0; variant < 2; variant += 1) {
    for (let criterionIndex = 0; criterionIndex < criteria.length; criterionIndex += 1) {
      const focus = nearestUnusedCell(cells, targets[criterionIndex], usedFocus, variant);
      passes.push({
        mapId: level.id,
        levelStem: definition.stem,
        passNumber: passes.length + 1,
        mode: 'native-runtime-focus',
        criterion: criteria[criterionIndex],
        view: {
          kind: 'runtime-grid-focus',
          x: focus.x,
          y: focus.y,
          targetDistance: focus.targetDistance,
          variant: variant + 1,
          criterionTarget: targets[criterionIndex]
        }
      });
    }
  }

  for (let criterionIndex = 0; criterionIndex < criteria.length; criterionIndex += 1) {
    const [left, top, right, bottom] = broadInsets[criterionIndex];
    passes.push({
      mapId: level.id,
      levelStem: definition.stem,
      passNumber: passes.length + 1,
      mode: 'broad-composition',
      criterion: criteria[criterionIndex],
      view: {
        kind: 'broad-grid-composition',
        x0: left,
        y0: top,
        x1: level.width - 1 - right,
        y1: level.height - 1 - bottom,
        insets: { left, top, right, bottom },
        coverage: Number((((level.width - left - right) * (level.height - top - bottom)) / (level.width * level.height)).toFixed(4)),
        criterionTarget: targets[criterionIndex]
      }
    });
  }

  const kindCounts = {};
  for (const object of level.objects ?? []) kindCounts[object.kind] = (kindCounts[object.kind] ?? 0) + 1;
  return {
    mapId: level.id,
    levelStem: definition.stem,
    levelFile: `data/levels/${definition.stem}.json`,
    levelSha256,
    dimensions: { width: level.width, height: level.height },
    sourceMetrics: {
      objects: level.objects?.length ?? 0,
      groundItems: level.groundItems?.length ?? 0,
      walkableUnoccupiedCells: cells.length,
      objectKindCounts: Object.fromEntries(Object.entries(kindCounts).sort(([a], [b]) => a.localeCompare(b)))
    },
    criteria,
    passes
  };
}

function countModes(records) {
  const result = Object.fromEntries(Object.keys(EXPECTED_PER_MAP).map((mode) => [mode, 0]));
  for (const record of records) result[record.mode] = (result[record.mode] ?? 0) + 1;
  return result;
}

function validateCompleteRecipe(plans) {
  if (plans.length !== EXPECTED_MAP_COUNT) throw new Error(`Recipe has ${plans.length} maps, expected ${EXPECTED_MAP_COUNT}`);
  const globalPaths = new Set();
  for (const plan of plans) {
    if (plan.passes.length !== EXPECTED_PASSES_PER_MAP) {
      throw new Error(`${plan.mapId}: recipe has ${plan.passes.length} passes, expected ${EXPECTED_PASSES_PER_MAP}`);
    }
    const counts = countModes(plan.passes);
    for (const [mode, expected] of Object.entries(EXPECTED_PER_MAP)) {
      if (counts[mode] !== expected) throw new Error(`${plan.mapId}: ${mode} has ${counts[mode]} records, expected ${expected}`);
    }
    const passNumbers = new Set(plan.passes.map((record) => record.passNumber));
    if (passNumbers.size !== EXPECTED_PASSES_PER_MAP || !plan.passes.every((record, index) => record.passNumber === index + 1)) {
      throw new Error(`${plan.mapId}: pass numbers are not the exact sequence 1 through 200`);
    }
    const views = new Set(plan.passes.map(stableViewKey));
    if (views.size !== EXPECTED_PASSES_PER_MAP) throw new Error(`${plan.mapId}: planned crop/focus records are not unique`);
    const criterionCounts = new Map(plan.criteria.map((criterion) => [criterion.id, 0]));
    for (const record of plan.passes) criterionCounts.set(record.criterion.id, (criterionCounts.get(record.criterion.id) ?? 0) + 1);
    for (const [criterionId, count] of criterionCounts) {
      if (count !== 10) throw new Error(`${plan.mapId}: criterion ${criterionId} has ${count} passes, expected 10`);
    }
    for (const record of plan.passes) {
      const relativePath = screenshotPath(record);
      const identity = `${plan.mapId}:${relativePath}`;
      if (globalPaths.has(identity)) throw new Error(`Duplicate screenshot plan path: ${identity}`);
      globalPaths.add(identity);
    }
  }
  const total = plans.reduce((sum, plan) => sum + plan.passes.length, 0);
  if (total !== EXPECTED_TOTAL_PASSES) throw new Error(`Recipe has ${total} passes, expected ${EXPECTED_TOTAL_PASSES}`);
  return { maps: plans.length, passesPerMap: EXPECTED_PASSES_PER_MAP, totalPasses: total };
}

function screenshotPath(record) {
  return path.posix.join(
    'screenshots',
    record.levelStem,
    `pass-${String(record.passNumber).padStart(3, '0')}-${record.mode}.png`
  );
}

function selectMaps(plans, selectors) {
  if (selectors.length === 0) return plans;
  const wanted = new Set(selectors);
  const selected = plans.filter((plan) => wanted.has(plan.mapId) || wanted.has(plan.levelStem));
  const resolved = new Set(selected.flatMap((plan) => [plan.mapId, plan.levelStem]));
  const unknown = selectors.filter((selector) => !resolved.has(selector));
  if (unknown.length > 0) throw new Error(`Unknown map selector(s): ${unknown.join(', ')}`);
  return selected;
}

function selectPasses(plan, smokePerMode) {
  if (smokePerMode == null) return plan.passes;
  return Object.keys(EXPECTED_PER_MAP).flatMap((mode) => plan.passes.filter((record) => record.mode === mode).slice(0, smokePerMode));
}

function sceneBounds(width, height) {
  return {
    width: (width + height - 1) * 32 + 64 + 96,
    height: (width + height - 2) * 16 + 32 + 64 + 96
  };
}

function captureScale(plan, record) {
  const cropWidth = record.view.x1 - record.view.x0 + 1;
  const cropHeight = record.view.y1 - record.view.y0 + 1;
  const bounds = sceneBounds(cropWidth, cropHeight);
  if (record.mode === 'broad-composition') return Math.min(0.62, 1240 / bounds.width, 760 / bounds.height);
  return Math.min(0.82, 920 / bounds.width, 650 / bounds.height);
}

function openDoorGroups(level) {
  const groups = new Set((level.hiddenRegions ?? []).map((region) => region.doorGroup).filter(Boolean));
  for (const object of level.objects ?? []) if (object.doorGroup) groups.add(object.doorGroup);
  return [...groups].sort();
}

function installBrowserErrorCollector(page) {
  let errors = [];
  page.on('pageerror', (error) => errors.push(`pageerror: ${String(error?.stack ?? error)}`));
  page.on('console', (message) => {
    if (message.type() === 'error' && !message.text().includes('Failed to load resource')) {
      errors.push(`console: ${message.text()}`);
    }
  });
  page.on('response', (response) => {
    if (response.status() >= 400 && !response.url().endsWith('/favicon.ico')) {
      errors.push(`response: ${response.status()} ${response.url()}`);
    }
  });
  page.on('requestfailed', (request) => {
    if (!request.url().endsWith('/favicon.ico')) errors.push(`requestfailed: ${request.failure()?.errorText ?? 'unknown'} ${request.url()}`);
  });
  return {
    reset() { errors = []; },
    assert(stage) {
      if (errors.length > 0) throw new Error(`${stage} browser/runtime errors:\n${errors.join('\n')}`);
    }
  };
}

async function canvasMetrics(page, selector) {
  return page.locator(selector).evaluate((canvas, voidRgb) => {
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) throw new Error('Capture canvas has no 2D context');
    const width = canvas.width;
    const height = canvas.height;
    if (width <= 0 || height <= 0) throw new Error(`Capture canvas has invalid dimensions ${width}x${height}`);
    const pixels = context.getImageData(0, 0, width, height).data;
    const step = Math.max(1, Math.ceil(Math.sqrt((width * height) / 65536)));
    const colors = new Set();
    let sampledPixels = 0;
    let nonVoidPixels = 0;
    let luminanceTotal = 0;
    let edgeComparisons = 0;
    let edgeTransitions = 0;
    let fingerprint = 2166136261;
    for (let y = 0; y < height; y += step) {
      let previous = null;
      for (let x = 0; x < width; x += step) {
        const offset = (y * width + x) * 4;
        const r = pixels[offset];
        const g = pixels[offset + 1];
        const b = pixels[offset + 2];
        const a = pixels[offset + 3];
        const packed = (((r << 24) | (g << 16) | (b << 8) | a) >>> 0);
        colors.add(packed);
        sampledPixels += 1;
        if (r !== voidRgb[0] || g !== voidRgb[1] || b !== voidRgb[2]) nonVoidPixels += 1;
        luminanceTotal += (0.2126 * r) + (0.7152 * g) + (0.0722 * b);
        if (previous !== null) {
          edgeComparisons += 1;
          if (previous !== packed) edgeTransitions += 1;
        }
        previous = packed;
        fingerprint ^= packed;
        fingerprint = Math.imul(fingerprint, 16777619) >>> 0;
      }
    }
    return {
      width,
      height,
      sampleStep: step,
      sampledPixels,
      sampledUniqueColors: colors.size,
      sampledNonVoidRatio: Number((nonVoidPixels / sampledPixels).toFixed(6)),
      sampledMeanLuminance: Number((luminanceTotal / sampledPixels).toFixed(3)),
      sampledHorizontalEdgeRatio: Number((edgeTransitions / Math.max(1, edgeComparisons)).toFixed(6)),
      sampledFingerprint: fingerprint.toString(16).padStart(8, '0')
    };
  }, VOID_RGB);
}

async function attachScreenshotMetrics(outputDir, record, canvas, absolutePath) {
  const buffer = await readFile(absolutePath);
  const fileStat = await stat(absolutePath);
  const dimensions = pngDimensions(buffer);
  if (dimensions.width !== canvas.width || dimensions.height !== canvas.height) {
    throw new Error(`${record.mapId} pass ${record.passNumber}: screenshot ${dimensions.width}x${dimensions.height} does not match canvas ${canvas.width}x${canvas.height}`);
  }
  if (canvas.sampledNonVoidRatio <= 0) throw new Error(`${record.mapId} pass ${record.passNumber}: screenshot is entirely void`);
  return {
    path: path.relative(outputDir, absolutePath).split(path.sep).join('/'),
    sha256: sha256(buffer),
    bytes: fileStat.size,
    width: dimensions.width,
    height: dimensions.height
  };
}

async function captureDetached({ page, errors, baseUrl, outputDir, plan, level, record }) {
  const scale = captureScale(plan, record);
  const url = new URL(baseUrl);
  url.searchParams.set('level', `./data/levels/${plan.levelStem}.json`);
  url.searchParams.set('scale', scale.toFixed(6));
  url.searchParams.set('includeDormant', '1');
  url.searchParams.set('x0', record.view.x0);
  url.searchParams.set('y0', record.view.y0);
  url.searchParams.set('x1', record.view.x1);
  url.searchParams.set('y1', record.view.y1);
  const groups = openDoorGroups(level);
  if (groups.length > 0) url.searchParams.set('openDoorGroups', groups.join(','));

  errors.reset();
  await page.goto(url.href, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForFunction(() => document.title === 'CAPTURE-READY' || document.title === 'CAPTURE-ERROR', null, { timeout: 60000 });
  if (await page.title() !== 'CAPTURE-READY') {
    throw new Error(`${record.mapId} pass ${record.passNumber}: ${await page.locator('body').innerText()}`);
  }
  errors.assert(`${record.mapId} pass ${record.passNumber}`);
  const canvas = await canvasMetrics(page, '#out');
  const relativePath = screenshotPath(record);
  const absolutePath = path.join(outputDir, relativePath);
  await mkdir(path.dirname(absolutePath), { recursive: true });
  await page.locator('#out').screenshot({ path: absolutePath });
  const screenshot = await attachScreenshotMetrics(outputDir, record, canvas, absolutePath);
  errors.assert(`${record.mapId} pass ${record.passNumber} screenshot`);
  return {
    ...record,
    screenshot,
    metrics: {
      evidenceType: record.mode,
      sourceLevelSha256: plan.levelSha256,
      requestedScale: Number(scale.toFixed(6)),
      browserTitle: await page.title(),
      canvas,
      source: {
        levelWidth: plan.dimensions.width,
        levelHeight: plan.dimensions.height,
        objectCount: plan.sourceMetrics.objects,
        openDoorGroups: groups
      }
    }
  };
}

async function bootRuntimeMap({ page, errors, gameBaseUrl, plan }) {
  const url = new URL('/', gameBaseUrl);
  url.searchParams.set('level', `data/levels/${plan.levelStem}.json`);
  url.searchParams.set('skipIntro', '1');
  url.searchParams.set('noCombat', '1');
  url.searchParams.set('playtest', 'fresh');
  errors.reset();
  await page.goto(url.href, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForFunction(
    (expectedId) => Boolean(globalThis.hostDebug?.game?.()?.ready && globalThis.hostDebug.game().level?.id === expectedId),
    plan.mapId,
    { timeout: 60000 }
  );
  await page.evaluate(() => {
    const game = globalThis.hostDebug.game();
    game.loop.stop();
    game.areaTitleTimer = 0;
    game.areaTitle = null;
    game.journalNotice = null;
    game.uiScreen = null;
    game.mode = 'explore';
    game.debugGrid = false;
    game.pathQueue = [];
    game.pendingExploreTarget = null;
    game.preCombatTarget = null;
    game.render();
  });
  errors.assert(`${plan.mapId} runtime boot`);
}

async function captureRuntime({ page, errors, outputDir, plan, record }) {
  errors.reset();
  const runtime = await page.evaluate(({ x, y, expectedId, expectedStem }) => {
    const game = globalThis.hostDebug.game();
    game.loop.stop();
    const teleport = globalThis.hostDebug.teleport(x, y);
    if (!teleport?.ok) throw new Error(`Runtime focus ${x},${y} failed: ${teleport?.reason ?? 'unknown reason'}`);
    game.areaTitleTimer = 0;
    game.areaTitle = null;
    game.journalNotice = null;
    game.uiScreen = null;
    game.mode = 'explore';
    game.debugGrid = false;
    game.anim.tick = 0;
    game.anim.pulse = 0;
    game.anim.flicker = 0;
    game.render();
    const samples = [];
    for (let index = 0; index < 3; index += 1) {
      const start = performance.now();
      game.render();
      samples.push(performance.now() - start);
    }
    samples.sort((a, b) => a - b);
    const canvas = document.querySelector('#game');
    const rect = canvas.getBoundingClientRect();
    const cache = game.renderer.staticScene;
    return {
      expectedId,
      expectedPath: `./data/levels/${expectedStem}.json`,
      actualId: game.level?.id,
      actualPath: game.levelPath,
      ready: game.ready,
      mode: game.mode,
      uiScreen: game.uiScreen,
      player: { x: game.player.x, y: game.player.y, pxOffset: { ...game.player.pxOffset } },
      camera: { ...game.renderer.camera },
      worldOrigin: { ...game.renderer.worldOrigin },
      sceneBounds: { width: game.renderer.sceneBounds?.width, height: game.renderer.sceneBounds?.height },
      canvas: {
        width: canvas.width,
        height: canvas.height,
        cssWidth: rect.width,
        cssHeight: rect.height
      },
      browser: {
        innerWidth,
        innerHeight,
        devicePixelRatio,
        visualScale: visualViewport?.scale ?? 1
      },
      counts: {
        actors: game.actors?.length ?? 0,
        props: game.level?.props?.length ?? 0,
        interactables: game.level?.interactables?.length ?? 0,
        hiddenTiles: game.hiddenTiles?.size ?? 0
      },
      cache: {
        width: cache?.canvas?.width,
        height: cache?.canvas?.height,
        logicalWidth: cache?.logicalWidth,
        logicalHeight: cache?.logicalHeight
      },
      renderTimingMs: {
        samples,
        average: samples.reduce((sum, value) => sum + value, 0) / samples.length,
        max: samples[samples.length - 1]
      }
    };
  }, { x: record.view.x, y: record.view.y, expectedId: plan.mapId, expectedStem: plan.levelStem });

  if (!runtime.ready || runtime.actualId !== plan.mapId || runtime.actualPath !== runtime.expectedPath) {
    throw new Error(`${record.mapId} pass ${record.passNumber}: wrong runtime level ${runtime.actualId} at ${runtime.actualPath}`);
  }
  if (runtime.player.x !== record.view.x || runtime.player.y !== record.view.y) {
    throw new Error(`${record.mapId} pass ${record.passNumber}: runtime focus did not reach ${record.view.x},${record.view.y}`);
  }
  if (runtime.mode !== 'explore' || runtime.uiScreen !== null) {
    throw new Error(`${record.mapId} pass ${record.passNumber}: runtime did not remain in unobstructed field view`);
  }
  if (runtime.canvas.width !== 1280 || runtime.canvas.height !== 960) {
    throw new Error(`${record.mapId} pass ${record.passNumber}: runtime canvas is ${runtime.canvas.width}x${runtime.canvas.height}, expected 1280x960`);
  }
  if (runtime.browser.devicePixelRatio !== 1 || runtime.browser.visualScale !== 1) {
    throw new Error(`${record.mapId} pass ${record.passNumber}: browser zoom is not 100 percent`);
  }
  errors.assert(`${record.mapId} pass ${record.passNumber}`);
  const canvas = await canvasMetrics(page, '#game');
  const relativePath = screenshotPath(record);
  const absolutePath = path.join(outputDir, relativePath);
  await mkdir(path.dirname(absolutePath), { recursive: true });
  await page.locator('#game').screenshot({ path: absolutePath });
  const screenshot = await attachScreenshotMetrics(outputDir, record, canvas, absolutePath);
  errors.assert(`${record.mapId} pass ${record.passNumber} screenshot`);
  return {
    ...record,
    view: { ...record.view, actualCamera: runtime.camera },
    screenshot,
    metrics: {
      evidenceType: record.mode,
      sourceLevelSha256: plan.levelSha256,
      canvas,
      runtime
    }
  };
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

async function makeContactSheet({ page, errors, outputDir, plan, records, batchStart }) {
  const cards = [];
  for (const record of records) {
    const absolutePath = path.join(outputDir, record.screenshot.path);
    const image = await readFile(absolutePath);
    cards.push(`
      <figure>
        <img src="data:image/png;base64,${image.toString('base64')}" alt="pass ${record.passNumber}">
        <figcaption><b>${String(record.passNumber).padStart(3, '0')}</b> ${escapeHtml(record.mode)}<br>${escapeHtml(record.criterion.id)}</figcaption>
      </figure>`);
  }
  const batchEnd = batchStart + 19;
  const html = `<!doctype html>
    <style>
      *{box-sizing:border-box}html,body{margin:0;background:#050505;color:#c8b99a;font:12px monospace}
      main{width:1360px;padding:12px;overflow:hidden}h1{height:26px;margin:0 0 8px;font-size:15px;font-weight:normal;overflow:hidden;white-space:nowrap}
      section{display:grid;grid-template-columns:repeat(5,256px);gap:12px}
      figure{height:194px;margin:0;border:1px solid #3a2d22;background:#0d0b09;display:grid;grid-template-rows:158px 34px;overflow:hidden;contain:paint}
      img{width:254px;height:158px;display:block;object-fit:contain;image-rendering:pixelated;background:#050505}
      figcaption{padding:3px 5px;line-height:13px;overflow:hidden;white-space:nowrap}b{color:#f4e7c0}
    </style>
    <main id="sheet"><h1>${escapeHtml(plan.mapId)} passes ${String(batchStart).padStart(3, '0')} to ${String(batchEnd).padStart(3, '0')}</h1><section>${cards.join('')}</section></main>`;
  errors.reset();
  await page.setContent(html, { waitUntil: 'load' });
  await page.evaluate(async () => {
    const images = [...document.images];
    await Promise.all(images.map((image) => image.decode()));
    if (images.some((image) => image.naturalWidth <= 0 || image.naturalHeight <= 0)) throw new Error('Contact sheet contains a broken image');
    document.body.getBoundingClientRect();
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  });
  await page.waitForTimeout(100);
  const relativePath = path.posix.join(
    'contact-sheets',
    plan.levelStem,
    `passes-${String(batchStart).padStart(3, '0')}-${String(batchEnd).padStart(3, '0')}.png`
  );
  const absolutePath = path.join(outputDir, relativePath);
  await mkdir(path.dirname(absolutePath), { recursive: true });
  await page.locator('#sheet').screenshot({ path: absolutePath });
  errors.assert(`${plan.mapId} contact sheet ${batchStart}`);
  const buffer = await readFile(absolutePath);
  return {
    path: relativePath,
    batchStart,
    batchEnd,
    includedPasses: records.map((record) => record.passNumber),
    sha256: sha256(buffer),
    bytes: buffer.length,
    ...pngDimensions(buffer)
  };
}

function contactSheetBatches(records) {
  const batches = new Map();
  for (const record of records) {
    const start = Math.floor((record.passNumber - 1) / 20) * 20 + 1;
    if (!batches.has(start)) batches.set(start, []);
    batches.get(start).push(record);
  }
  return [...batches].sort(([a], [b]) => a - b);
}

function isRecoverableBrowserFailure(error) {
  const message = String(error?.message ?? error);
  return /target page, context or browser has been closed|target closed|page crashed|browser (?:has been )?closed|browser disconnected|connection closed/i.test(message);
}

async function captureBatch({
  options,
  outputDir,
  detachedBaseUrl,
  gameBaseUrl,
  plan,
  level,
  batchStart,
  batchRecords,
  mapIndex,
  mapCount,
  progressByPass
}) {
  for (let attempt = 1; attempt <= BROWSER_ATTEMPTS_PER_BATCH; attempt += 1) {
    let browser = null;
    try {
      browser = await chromium.launch({
        executablePath: process.env.CHROME_PATH ?? '/opt/google/chrome/chrome',
        headless: !options.headed,
        args: ['--disable-dev-shm-usage']
      });
      const needsDetachedPage = batchRecords.some((record) => record.mode !== 'native-runtime-focus');
      const needsRuntimePage = batchRecords.some((record) => record.mode === 'native-runtime-focus');
      const detachedPage = needsDetachedPage
        ? await browser.newPage({ viewport: { width: 1500, height: 1000 }, deviceScaleFactor: 1 })
        : null;
      const runtimePage = needsRuntimePage
        ? await browser.newPage({ viewport: { width: 1600, height: 1200 }, deviceScaleFactor: 1 })
        : null;
      const sheetPage = await browser.newPage({ viewport: { width: 1400, height: 1000 }, deviceScaleFactor: 1 });
      const detachedErrors = detachedPage ? installBrowserErrorCollector(detachedPage) : null;
      const runtimeErrors = runtimePage ? installBrowserErrorCollector(runtimePage) : null;
      const sheetErrors = installBrowserErrorCollector(sheetPage);
      const records = [];

      if (runtimePage) await bootRuntimeMap({ page: runtimePage, errors: runtimeErrors, gameBaseUrl, plan });
      for (const record of batchRecords) {
        const captured = record.mode === 'native-runtime-focus'
          ? await captureRuntime({ page: runtimePage, errors: runtimeErrors, outputDir, plan, record })
          : await captureDetached({ page: detachedPage, errors: detachedErrors, baseUrl: detachedBaseUrl, outputDir, plan, level, record });
        records.push(captured);
        console.log(
          `${String(mapIndex + 1).padStart(2, '0')}/${mapCount} ${plan.mapId} `
          + `${String(progressByPass.get(record.passNumber)).padStart(3, '0')}/${progressByPass.size} `
          + `pass ${String(record.passNumber).padStart(3, '0')} ${record.mode}`
        );
      }
      const contactSheet = await makeContactSheet({
        page: sheetPage,
        errors: sheetErrors,
        outputDir,
        plan,
        records,
        batchStart
      });
      return { records, contactSheet };
    } catch (error) {
      const disconnected = Boolean(browser && !browser.isConnected());
      if ((!disconnected && !isRecoverableBrowserFailure(error)) || attempt === BROWSER_ATTEMPTS_PER_BATCH) throw error;
      console.warn(
        `${plan.mapId} passes ${String(batchStart).padStart(3, '0')}-${String(batchStart + 19).padStart(3, '0')}: `
        + `browser disconnected; retrying batch (${attempt + 1}/${BROWSER_ATTEMPTS_PER_BATCH})`
      );
    } finally {
      if (browser) await browser.close().catch(() => {});
    }
  }
  throw new Error(`${plan.mapId} pass batch ${batchStart}: exhausted browser retries`);
}

function validateCapturedRecords(capturedMaps, { certifying, expectFullMaps }) {
  const imageHashes = new Set();
  const screenshotPaths = new Set();
  let total = 0;
  for (const map of capturedMaps) {
    const viewKeys = new Set();
    const mapHashes = new Set();
    for (const record of map.records) {
      total += 1;
      if (!record.mapId || !record.passNumber || !record.mode || !record.criterion || !record.view || !record.screenshot || !record.metrics) {
        throw new Error(`${map.mapId}: an evidence record is missing a required field`);
      }
      const viewKey = stableViewKey(record);
      if (viewKeys.has(viewKey)) throw new Error(`${map.mapId}: duplicate crop/focus at pass ${record.passNumber}`);
      viewKeys.add(viewKey);
      if (mapHashes.has(record.screenshot.sha256)) throw new Error(`${map.mapId}: pixel-identical screenshots include pass ${record.passNumber}`);
      mapHashes.add(record.screenshot.sha256);
      if (imageHashes.has(record.screenshot.sha256)) throw new Error(`Global pixel-identical screenshot at ${record.screenshot.path}`);
      imageHashes.add(record.screenshot.sha256);
      if (screenshotPaths.has(record.screenshot.path)) throw new Error(`Duplicate screenshot path ${record.screenshot.path}`);
      screenshotPaths.add(record.screenshot.path);
    }
    if (expectFullMaps) {
      if (map.records.length !== EXPECTED_PASSES_PER_MAP) throw new Error(`${map.mapId}: captured ${map.records.length}, expected 200`);
      const counts = countModes(map.records);
      for (const [mode, expected] of Object.entries(EXPECTED_PER_MAP)) {
        if (counts[mode] !== expected) throw new Error(`${map.mapId}: captured ${counts[mode]} ${mode}, expected ${expected}`);
      }
      if (map.contactSheets.length !== 10) throw new Error(`${map.mapId}: generated ${map.contactSheets.length} contact sheets, expected 10`);
    }
  }
  if (certifying && total !== EXPECTED_TOTAL_PASSES) throw new Error(`Captured ${total} passes, expected 1,800`);
  return { totalCaptured: total, uniqueViews: total, uniqueScreenshotHashes: imageHashes.size, uniqueScreenshotPaths: screenshotPaths.size };
}

async function writeReports({ outputDir, plans, selectedPlans, capturedMaps, options, certifying, startedAt, validation }) {
  const finishedAt = new Date().toISOString();
  const status = certifying
    ? 'complete-and-validated'
    : options.smokePerMode == null ? 'partial-map-validated' : 'partial-smoke-validated';
  const manifest = {
    schema: 'ash-road-south-visual-pass-manifest',
    schemaVersion: SCRIPT_VERSION,
    certifying,
    status,
    startedAt,
    finishedAt,
    sources: {
      gameAuditUrl: process.env.GAME_AUDIT_URL ?? 'http://127.0.0.1:8080',
      detachedAuditUrl: process.env.MAP_AUDIT_URL ?? 'http://127.0.0.1:8080/.ai/map-review/capture-scene.html',
      playwrightImport,
      scriptVersion: SCRIPT_VERSION
    },
    contract: {
      maps: EXPECTED_MAP_COUNT,
      passesPerMap: EXPECTED_PASSES_PER_MAP,
      totalPasses: EXPECTED_TOTAL_PASSES,
      modesPerMap: EXPECTED_PER_MAP,
      criteriaPerMap: 20,
      recordsPerCriterion: 10,
      identicalScreenshotsAllowed: false,
      contactSheetBatchSize: 20
    },
    selection: {
      selectedMaps: selectedPlans.map((plan) => plan.mapId),
      smokePerMode: options.smokePerMode,
      allMapsSelected: selectedPlans.length === plans.length
    },
    validation,
    maps: capturedMaps
  };
  const report = {
    schema: 'ash-road-south-visual-pass-report',
    schemaVersion: SCRIPT_VERSION,
    certifying,
    status: manifest.status,
    finishedAt,
    expected: manifest.contract,
    actual: {
      mapsCaptured: capturedMaps.length,
      recordsCaptured: validation.totalCaptured,
      uniqueViews: validation.uniqueViews,
      uniqueScreenshotHashes: validation.uniqueScreenshotHashes,
      uniqueScreenshotPaths: validation.uniqueScreenshotPaths,
      modeCounts: countModes(capturedMaps.flatMap((map) => map.records)),
      contactSheets: capturedMaps.reduce((sum, map) => sum + map.contactSheets.length, 0)
    },
    checks: [
      { id: 'complete-recipe', passed: true, detail: 'Nine map recipes validate at exactly 200 records and 20 criteria each.' },
      { id: 'selected-record-fields', passed: true, detail: 'Every captured record has map id, pass number, mode, criterion, unique view, screenshot, and metrics.' },
      { id: 'selected-view-uniqueness', passed: validation.uniqueViews === validation.totalCaptured, detail: `${validation.uniqueViews} unique crop/focus definitions.` },
      { id: 'selected-pixel-uniqueness', passed: validation.uniqueScreenshotHashes === validation.totalCaptured, detail: `${validation.uniqueScreenshotHashes} unique exact PNG hashes.` },
      { id: 'certifying-scope', passed: certifying, detail: certifying ? 'All 1,800 required records were captured.' : 'Smoke or subset mode is intentionally non-certifying.' }
    ],
    maps: capturedMaps.map((map) => ({
      mapId: map.mapId,
      levelStem: map.levelStem,
      levelSha256: map.levelSha256,
      records: map.records.length,
      modeCounts: countModes(map.records),
      uniqueScreenshotHashes: new Set(map.records.map((record) => record.screenshot.sha256)).size,
      contactSheets: map.contactSheets.map((sheet) => sheet.path)
    }))
  };
  await mkdir(outputDir, { recursive: true });
  await Promise.all([
    writeFile(path.join(outputDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`),
    writeFile(path.join(outputDir, 'report.json'), `${JSON.stringify(report, null, 2)}\n`)
  ]);
}

async function loadPlans() {
  const plans = [];
  const levels = new Map();
  for (const definition of mapDefinitions) {
    const levelPath = path.join(levelDir, `${definition.stem}.json`);
    const source = await readFile(levelPath);
    const level = JSON.parse(source.toString('utf8'));
    levels.set(definition.stem, level);
    plans.push(buildPlan(definition, level, sha256(source)));
  }
  validateCompleteRecipe(plans);
  return { plans, levels };
}

async function assertLevelSourcesUnchanged(plans) {
  for (const plan of plans) {
    const source = await readFile(path.join(repoRoot, plan.levelFile));
    const currentHash = sha256(source);
    if (currentHash !== plan.levelSha256) {
      throw new Error(`${plan.mapId}: level source changed during capture; discard this mixed-state audit and rerun`);
    }
  }
}

async function run() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    console.log(usage());
    return;
  }
  const { plans, levels } = await loadPlans();
  console.log(`validated complete recipe: ${plans.length} maps x ${EXPECTED_PASSES_PER_MAP} passes = ${EXPECTED_TOTAL_PASSES}`);
  if (options.planOnly) return;

  const selectedPlans = selectMaps(plans, options.mapSelectors);
  const certifying = selectedPlans.length === plans.length && options.smokePerMode == null;
  const outputDir = options.outputDir;
  const startedAt = new Date().toISOString();
  await mkdir(outputDir, { recursive: true });
  const capturedMaps = [];
  const detachedBaseUrl = process.env.MAP_AUDIT_URL ?? 'http://127.0.0.1:8080/.ai/map-review/capture-scene.html';
  const gameBaseUrl = process.env.GAME_AUDIT_URL ?? 'http://127.0.0.1:8080';

  for (const [mapIndex, plan] of selectedPlans.entries()) {
    const level = levels.get(plan.levelStem);
    const selectedRecords = selectPasses(plan, options.smokePerMode).sort((a, b) => a.passNumber - b.passNumber);
    const progressByPass = new Map(selectedRecords.map((record, index) => [record.passNumber, index + 1]));
    const records = [];
    const contactSheets = [];
    for (const [batchStart, batchRecords] of contactSheetBatches(selectedRecords)) {
      const captured = await captureBatch({
        options,
        outputDir,
        detachedBaseUrl,
        gameBaseUrl,
        plan,
        level,
        batchStart,
        batchRecords: batchRecords.sort((a, b) => a.passNumber - b.passNumber),
        mapIndex,
        mapCount: selectedPlans.length,
        progressByPass
      });
      records.push(...captured.records);
      contactSheets.push(captured.contactSheet);
    }
    capturedMaps.push({
      mapId: plan.mapId,
      levelStem: plan.levelStem,
      levelFile: plan.levelFile,
      levelSha256: plan.levelSha256,
      dimensions: plan.dimensions,
      sourceMetrics: plan.sourceMetrics,
      criteria: plan.criteria,
      records,
      contactSheets
    });
  }
  await assertLevelSourcesUnchanged(selectedPlans);
  const validation = validateCapturedRecords(capturedMaps, {
    certifying,
    expectFullMaps: options.smokePerMode == null
  });
  await writeReports({ outputDir, plans, selectedPlans, capturedMaps, options, certifying, startedAt, validation });
  console.log(
    `${certifying ? 'certified' : 'smoke-validated'} ${validation.totalCaptured} captures with `
    + `${validation.uniqueScreenshotHashes} unique PNG hashes in ${outputDir}`
  );
}

await run();
