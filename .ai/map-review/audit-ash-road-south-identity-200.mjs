import { createHash, randomBytes } from 'node:crypto';
import {
  mkdir,
  readFile,
  readdir,
  rename,
  rm,
  stat,
  writeFile
} from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const SCRIPT_VERSION = 3;
const EXPECTED_PASSES = 200;
const CONTACT_SHEET_SIZE = 20;
const RUNTIME_CANVAS_WIDTH = 1280;
const RUNTIME_CANVAS_HEIGHT = 960;
const RUNTIME_WORLD_HEIGHT = 768;
const DEFAULT_BASE_URL = 'http://127.0.0.1:8137';
const PLAYWRIGHT_IMPORT = process.env.PLAYWRIGHT_IMPORT
  ?? 'file:///home/gaspersk/.npm/_npx/705bc6b22212b352/node_modules/playwright/index.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const scriptRelativePath = '.ai/map-review/audit-ash-road-south-identity-200.mjs';
const defaultOutputDir = path.join(repoRoot, '.ai/visual-audit/ash-road-south-200/evidence');
const ashLevelRelativePath = 'data/levels/ash_road_south.json';
const campLevelRelativePath = 'data/levels/censure_road_camp.json';
const freshPlaytestRelativePath = 'data/playtests/fresh.json';

const FAMILY_COUNTS = Object.freeze({
  'matched-comparison': 20,
  'isolated-art': 50,
  'district-composition': 60,
  'runtime-traversal': 40,
  'runtime-lighting': 20,
  'outcome-gate': 10
});

const REVIEW_VERDICTS = new Set(['pass', 'needs-work', 'fail']);

const comparisonPairs = Object.freeze([
  {
    id: 'south-arrival',
    ash: { x: 45, y: 71 },
    camp: { x: 34, y: 43 },
    expectation: 'South Measure must arrive as a civic receiving edge, not another tent-camp throat.'
  },
  {
    id: 'relief-sleeping',
    ash: { x: 29, y: 72 },
    camp: { x: 20, y: 39 },
    expectation: 'Raised pallets, shelters, and service order must replace Censure tent and bedroll language.'
  },
  {
    id: 'charity-edge',
    ash: { x: 100, y: 71 },
    camp: { x: 49, y: 38 },
    expectation: 'The charity edge must read as a South Measure institution with its own canopy and wash system.'
  },
  {
    id: 'water-center',
    ash: { x: 65, y: 54 },
    camp: { x: 35, y: 26 },
    expectation: 'The condenser court must carry civic-scale water machinery absent from the road camp.'
  },
  {
    id: 'screening-control',
    ash: { x: 65, y: 35 },
    camp: { x: 35, y: 17 },
    expectation: 'Old Measure Gates must form continuous processing lanes rather than scattered camp barriers.'
  },
  {
    id: 'freight-yard',
    ash: { x: 27, y: 51 },
    camp: { x: 17, y: 23 },
    expectation: 'Morrow freight massing must look like a bonded convoy yard, not generic camp supply scatter.'
  },
  {
    id: 'clinic-precinct',
    ash: { x: 94, y: 28 },
    camp: { x: 54, y: 20 },
    expectation: 'Compact must read as a counted clinic precinct with a hard building silhouette.'
  },
  {
    id: 'household-rows',
    ash: { x: 105, y: 50 },
    camp: { x: 51, y: 32 },
    expectation: 'Rope Rows must read as dense permanent households, not repeated temporary shelters.'
  },
  {
    id: 'burial-edge',
    ash: { x: 106, y: 11 },
    camp: { x: 57, y: 8 },
    expectation: 'The grave strip and brass-hook memorial must establish a local burial identity.'
  },
  {
    id: 'whole-settlement',
    ash: { x: 65, y: 40 },
    camp: { x: 35, y: 25 },
    expectation: 'At broad scale, South Measure must have a settlement silhouette and material zoning unlike Censure.'
  }
]);

const comparisonFramings = Object.freeze([
  { id: 'matched-close', ashHalf: { x: 12, y: 9 }, campHalf: { x: 8, y: 6 } },
  { id: 'matched-context', ashHalf: { x: 20, y: 14 }, campHalf: { x: 13, y: 10 } }
]);

const floorChecks = Object.freeze([
  { id: 'native-5', n: 5, mood: false, expectation: 'The native patch must show a location-owned seam and wear vocabulary.' },
  { id: 'repeat-6', n: 6, mood: false, expectation: 'A larger repeat must avoid obvious stamped cells or accidental continuous stripes.' },
  { id: 'traffic-8', n: 8, mood: false, expectation: 'Broad tiling must preserve directional traffic and drainage rhythm.' },
  { id: 'mood-7', n: 7, mood: true, expectation: 'The floor identity must remain legible under the outdoor mood wash.' }
]);

const identityFloors = Object.freeze([
  ['south-measure-slab', 'Civic slab seams, drains, and repair marks must read as South Measure public works.'],
  ['south-measure-yard', 'Clinker, iron traces, and freight wear must identify the Morrow work ground.'],
  ['south-measure-row', 'Service brick, gutters, and household wear must identify Rope Rows.'],
  ['south-measure-grave-strip', 'Lime ledger lines, burial cuts, and settled soil must identify the municipal grave strip.']
]);

const isolatedKinds = Object.freeze([
  { kind: 'south-measure-rowhouse-building-block', footprint: '7x5', expectation: 'Irregular roof repairs, flues, and household additions must prevent repeated block housing.' },
  { kind: 'measure-hall-building-block', footprint: '8x6', expectation: 'The hall must read as a civic anchor rather than an enlarged rowhouse.' },
  { kind: 'south-measure-burial-shed-building-block', footprint: '6x5', expectation: 'The burial shed must support the grave strip without borrowing chapel imagery.' },
  { kind: 'south-measure-berm-block', footprint: '6x2', expectation: 'The retired drainage berm must replace generic forest-edge silhouettes.' },
  { kind: 'measure-boundary-fence', prop: { orient: 'se' }, expectation: 'The boundary fence must look civic and measured, not like the Censure farm fence.' },
  { kind: 'south-measure-receiving-shelter', prop: { orient: 'se' }, expectation: 'The backed receiving shelter must read as an intake station rather than a canvas tent.' },
  { kind: 'south-measure-charity-canopy', prop: { orient: 'sw' }, expectation: 'The charity canopy must have a distinct relief-service silhouette.' },
  { kind: 'south-measure-pipe-gantry', prop: { orient: 'se' }, expectation: 'Pipe gantries must provide coherent industrial overhead rhythm.' },
  { kind: 'south-measure-queue-rail', prop: { orient: 'sw' }, expectation: 'Queue rails must join into deliberate processing lanes.' },
  { kind: 'south-measure-brass-hook-memorial', expectation: 'The memorial must provide a burial symbol owned by South Measure.' },
  { kind: 'south-measure-sample-burner', expectation: 'The sample burner must identify Compact clinical disposal at human scale.' },
  { kind: 'south-measure-settling-vat', expectation: 'The open vat must read as substantial water infrastructure, not a blue crate.' },
  { kind: 'south-measure-arrival-hearth', expectation: 'The contained arrival hearth must not recreate Censure campfire language.' },
  { kind: 'south-measure-sleeping-pallet', prop: { orient: 'se' }, expectation: 'The raised pallet must read as managed intake relief rather than a reused bedroll.' },
  { kind: 'south-measure-hand-pump', expectation: 'The hand pump must belong to the settlement water system.' },
  { kind: 'south-measure-water-vessels', prop: { orient: 'se', variant: 'household' }, label: 'water-vessels-household', expectation: 'Household vessels must form a recognizable domestic water kit.' },
  { kind: 'south-measure-water-vessels', prop: { orient: 'sw', variant: 'clinic' }, label: 'water-vessels-clinic', expectation: 'Clinic vessels must be visibly cleaner and more controlled than household storage.' },
  { kind: 'south-measure-water-vessels', prop: { orient: 'se', variant: 'freight' }, label: 'water-vessels-freight', expectation: 'Freight vessels must carry yard scale and handling wear.' },
  {
    kind: 'south-measure-notice-board',
    variants: [
      { label: 'public', orient: 'sw', variant: 'public' },
      { label: 'census', orient: 'sw', variant: 'census' },
      { label: 'sealed', orient: 'sw', variant: 'sealed' }
    ],
    expectation: 'Public, census, and sealed boards must remain visibly distinct forms of local civic administration.'
  },
  {
    kind: 'south-measure-return-stall',
    variants: [
      { label: 'returns', orient: 'se', variant: 'returns' },
      { label: 'bonded', orient: 'se', variant: 'bonded' }
    ],
    expectation: 'The ordinary return counter and locked bonded store must have distinct silhouettes and control language.'
  },
  { kind: 'south-measure-repair-rack', prop: { orient: 'sw' }, expectation: 'The repair rack must support visible maintenance work, not generic clutter.' },
  { kind: 'south-measure-service-pack', expectation: 'The service pack must replace a reused field backpack with local equipment language.' },
  { kind: 'south-measure-medicine-cart', prop: { orient: 'se' }, expectation: 'The medicine cart must be distinct from ordinary freight wagons.' },
  { kind: 'south-measure-drain-reeds', expectation: 'Drain reeds must localize vegetation to failed waterworks.' },
  { kind: 'south-measure-water-lesson', expectation: 'The pavement lesson must be South Measure child instruction, not an Ash Chapel drawing.' },
  { kind: 'measure-grave-plot', prop: { orient: 'se' }, seeds: 4, expectation: 'Grave plots must retain human irregularity and avoid a stamped grid across their surveyed families.' },
  { kind: 'water-condenser', expectation: 'The condenser must dominate the civic water identity at human scale.' },
  { kind: 'intake-screening-frame', prop: { orient: 'se' }, expectation: 'Screening frames must read as parts of lanes, not isolated repeated gates.' },
  { kind: 'freight-scale', prop: { orient: 'sw', variant: 'claim' }, expectation: 'The claim scale must communicate bonded freight handling.' },
  { kind: 'wash-wall', prop: { orient: 'sw' }, expectation: 'The wash wall must read as permanent sanitation infrastructure.' },
  { kind: 'shared-oven', prop: { orient: 'sw' }, expectation: 'The shared oven must create a permanent domestic service node.' },
  {
    kind: 'relief-machine',
    variants: [
      { label: 'generator', orient: 'se', variant: 'generator' },
      { label: 'pump-jig', orient: 'se', variant: 'pump-jig' },
      { label: 'cooling-jacket', orient: 'se', variant: 'cooling-jacket' }
    ],
    expectation: 'Annex generator, pump jig, and cooling machinery must create distinct readable work functions.'
  },
  {
    kind: 'service-pipe-run',
    variants: [
      { label: 'straight', orient: 'se', variant: 'straight' },
      { label: 'elbow', orient: 'se', variant: 'elbow' },
      { label: 'valve', orient: 'se', variant: 'valve' }
    ],
    expectation: 'Straight, elbow, and valve pipe pieces must join into a readable service system.'
  },
  { kind: 'fixed-hoist', expectation: 'Fixed hoists must establish the annex loading identity.' }
]);

const districtZones = Object.freeze([
  { id: 'south-road-arrival', x: 45, y: 71, expectation: 'The first arrival view must announce an administered settlement before any label is read.' },
  { id: 'receiving-fringe', x: 29, y: 71, expectation: 'Shelters, pallets, hearths, and water points must form one receiving operation.' },
  { id: 'charity-edge', x: 101, y: 71, expectation: 'The charity edge must read as a separate relief institution with controlled washing and cots.' },
  { id: 'water-court', x: 65, y: 54, expectation: 'The condenser, vats, channels, taps, vessels, and tools must compose one civic water court.' },
  { id: 'old-measure-gates', x: 65, y: 35, expectation: 'Screening frames, rails, scale, records, and stall must form continuous old intake lanes.' },
  { id: 'morrow-yard', x: 27, y: 51, expectation: 'Convoy lanes, cages, wagons, scale, medicine cart, and racks must create freight-yard mass.' },
  { id: 'relief-annex', x: 22, y: 25, expectation: 'The broken annex shell and machine apron must create a specific industrial silhouette.' },
  { id: 'compact-precinct', x: 94, y: 28, expectation: 'Clinic buildings and counted intake fixtures must communicate Compact political control.' },
  { id: 'rope-rows-north', x: 105, y: 42, expectation: 'North Rope Rows must read as irregular attached homes and narrow shared courts.' },
  { id: 'rope-rows-south', x: 106, y: 57, expectation: 'South Rope Rows must sustain household density without a repeated roof stamp.' },
  { id: 'grave-strip', x: 106, y: 11, expectation: 'Family grave clusters, the tool shed, reeds, and memorial must read as a local burial edge.' },
  { id: 'north-verge', x: 65, y: 8, expectation: 'The north throat must remain a settlement boundary, not revert to generic road wilderness.' }
]);

const districtFramings = Object.freeze([
  { id: 'tight', halfX: 7, halfY: 5, offsetX: 0, offsetY: 0 },
  { id: 'near', halfX: 10, halfY: 7, offsetX: 0, offsetY: 0 },
  { id: 'context', halfX: 14, halfY: 10, offsetX: 0, offsetY: 0 },
  { id: 'approach', halfX: 15, halfY: 10, offsetX: -3, offsetY: 3 },
  { id: 'wide', halfX: 20, halfY: 14, offsetX: 2, offsetY: -2 }
]);

const traversalRoutes = Object.freeze([
  { id: 'arrival-spine', origin: [65, 77], checkpoints: [[65, 76], [65, 72], [64, 68], [64, 64]], expectation: 'The southern spine must reveal civic intake layers in a readable sequence.' },
  { id: 'receiving-fringe', origin: [47, 75], checkpoints: [[45, 75], [38, 72], [30, 70], [20, 70]], expectation: 'The west receiving edge must sustain its identity across player-scale movement.' },
  { id: 'charity-run', origin: [70, 68], checkpoints: [[72, 70], [85, 70], [97, 72], [108, 70]], expectation: 'The route into charity service must transition from road to institution without camp repetition.' },
  { id: 'water-spine', origin: [65, 64], checkpoints: [[65, 63], [65, 60], [65, 57], [65, 54]], expectation: 'The relief channel must guide the player into the water court.' },
  { id: 'water-crossing', origin: [49, 61], checkpoints: [[50, 60], [56, 58], [70, 60], [78, 59]], expectation: 'Cross-court traversal must preserve machine hierarchy and clear pedestrian lanes.' },
  { id: 'measure-gates', origin: [65, 45], checkpoints: [[64, 44], [63, 40], [63, 36], [64, 31]], expectation: 'Approaching the old gates must progressively reveal organized screening lanes.' },
  { id: 'morrow-loop', origin: [49, 59], checkpoints: [[48, 58], [40, 56], [24, 54], [16, 45]], expectation: 'The west loop must resolve into a coherent freight operation instead of sparse props.' },
  { id: 'annex-approach', origin: [21, 33], checkpoints: [[20, 32], [20, 28], [20, 25], [23, 24]], expectation: 'The annex approach must build toward a damaged industrial mass.' },
  { id: 'east-household-loop', origin: [76, 63], checkpoints: [[78, 62], [89, 67], [108, 62], [119, 52]], expectation: 'The east loop must shift clearly from court edge to dense household lanes.' },
  { id: 'north-spine', origin: [65, 29], checkpoints: [[65, 28], [89, 22], [88, 13], [65, 3]], expectation: 'The north spine must retain settlement identity through the Compact, grave, and chain-gate approach.' }
]);

const lightingZones = Object.freeze([
  { id: 'arrival', x: 32, y: 69, expectation: 'Arrival shelters and hearths must remain legible in every outdoor light phase.' },
  { id: 'water-court', x: 65, y: 58, expectation: 'Water machinery and channels must retain material separation in every light phase.' },
  { id: 'old-gates', x: 64, y: 39, expectation: 'Screening lanes must remain readable at dawn, noon, dusk, and night.' },
  { id: 'rope-rows', x: 106, y: 52, expectation: 'Household silhouettes and lanes must survive low-light tinting.' },
  { id: 'grave-strip', x: 105, y: 15, expectation: 'Graves and memorial forms must remain distinct without baked glow.' }
]);

const lightingTimes = Object.freeze([
  { id: 'dawn', minuteOfDay: 330 },
  { id: 'noon', minuteOfDay: 720 },
  { id: 'dusk', minuteOfDay: 1110 },
  { id: 'night', minuteOfDay: 1260 }
]);

const outcomeChecks = Object.freeze([
  { id: 'compact-close', x: 72, y: 59, flags: ['south-measure-compact'], expectation: 'Compact governance must add a visible census register at the water court.' },
  { id: 'compact-context', x: 78, y: 62, flags: ['south-measure-compact'], expectation: 'The Compact outcome dressing must read in player-scale court context.' },
  { id: 'morrow-close', x: 56, y: 60, flags: ['south-measure-morrow'], expectation: 'Morrow governance must add a bonded service store at the court.' },
  { id: 'morrow-context', x: 49, y: 58, flags: ['south-measure-morrow'], expectation: 'The Morrow outcome dressing must connect visually to the freight side.' },
  { id: 'resident-close', x: 70, y: 60, flags: ['south-measure-resident'], expectation: 'Resident governance must add a visible local pump-key table.' },
  { id: 'resident-context', x: 72, y: 63, flags: ['south-measure-resident'], expectation: 'The resident outcome dressing must remain legible among taps and queues.' },
  { id: 'sealed-close', x: 62, y: 57, flags: ['south-measure-sealed'], expectation: 'The sealed outcome must add a restrictive ration board beside the channel.' },
  { id: 'sealed-context', x: 58, y: 54, flags: ['south-measure-sealed'], expectation: 'The sealed outcome dressing must read within the whole water-system composition.' },
  { id: 'north-chain-closed', x: 65, y: 4, flags: [], expectation: 'The closed north chain must remain a strong settlement boundary.' },
  { id: 'north-lane-open', x: 65, y: 4, flags: ['south-measure-north-lane-open'], expectation: 'The open north-lane state must visibly replace the closed-chain reading.' }
]);

function parseArgs(argv) {
  const options = {
    mode: null,
    outputDir: defaultOutputDir,
    baseUrl: DEFAULT_BASE_URL,
    headed: false,
    findingsPath: null,
    reviewer: null,
    contactSheetsInspected: false,
    requireReviewed: 0,
    requirePassed: 0,
    help: false
  };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (['--capture', '--review', '--verify'].includes(argument)) {
      const mode = argument.slice(2);
      if (options.mode && options.mode !== mode) throw new Error('Choose exactly one of --capture, --review, or --verify');
      options.mode = mode;
    } else if (argument === '--output') {
      options.outputDir = path.resolve(requireArgumentValue(argv, ++index, argument));
    } else if (argument.startsWith('--output=')) {
      options.outputDir = path.resolve(argument.slice('--output='.length));
    } else if (argument === '--base-url') {
      options.baseUrl = requireArgumentValue(argv, ++index, argument);
    } else if (argument.startsWith('--base-url=')) {
      options.baseUrl = argument.slice('--base-url='.length);
    } else if (argument === '--headed') {
      options.headed = true;
    } else if (argument === '--findings') {
      options.findingsPath = path.resolve(requireArgumentValue(argv, ++index, argument));
    } else if (argument.startsWith('--findings=')) {
      options.findingsPath = path.resolve(argument.slice('--findings='.length));
    } else if (argument === '--reviewer') {
      options.reviewer = requireArgumentValue(argv, ++index, argument).trim();
    } else if (argument.startsWith('--reviewer=')) {
      options.reviewer = argument.slice('--reviewer='.length).trim();
    } else if (argument === '--confirm-contact-sheets-inspected') {
      options.contactSheetsInspected = true;
    } else if (argument === '--require-reviewed') {
      options.requireReviewed = wholeNumber(requireArgumentValue(argv, ++index, argument), argument, 0, EXPECTED_PASSES);
    } else if (argument.startsWith('--require-reviewed=')) {
      options.requireReviewed = wholeNumber(argument.slice('--require-reviewed='.length), '--require-reviewed', 0, EXPECTED_PASSES);
    } else if (argument === '--require-passed') {
      options.requirePassed = wholeNumber(requireArgumentValue(argv, ++index, argument), argument, 0, EXPECTED_PASSES);
    } else if (argument.startsWith('--require-passed=')) {
      options.requirePassed = wholeNumber(argument.slice('--require-passed='.length), '--require-passed', 0, EXPECTED_PASSES);
    } else if (argument === '--help' || argument === '-h') {
      options.help = true;
    } else {
      throw new Error(`Unknown argument: ${argument}`);
    }
  }
  return options;
}

function requireArgumentValue(argv, index, flag) {
  const value = argv[index];
  if (!value || value.startsWith('--')) throw new Error(`${flag} requires a value`);
  return value;
}

function wholeNumber(value, flag, minimum, maximum) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < minimum || parsed > maximum) {
    throw new Error(`${flag} must be an integer from ${minimum} through ${maximum}`);
  }
  return parsed;
}

function usage() {
  return [
    'Ash Road South surface identity audit: exactly 200 evidence-backed visual checks.',
    '',
    'Capture:',
    '  node .ai/map-review/audit-ash-road-south-identity-200.mjs --capture',
    '',
    'Review after manually inspecting all ten contact sheets:',
    '  node .ai/map-review/audit-ash-road-south-identity-200.mjs --review \\',
    '    --confirm-contact-sheets-inspected --reviewer "NAME" --findings /path/to/findings.json',
    '',
    'Final approval requires all 200 records to be reviewed and individually passed:',
    '  node .ai/map-review/audit-ash-road-south-identity-200.mjs --verify \\',
    '    --require-reviewed=200 --require-passed=200',
    '',
    'Copy review-template.json outside the evidence directory, then fill all family summaries',
    'and all 200 pass entries. Every pass retains its pass number, criterion id, and image hash:',
    '  {',
    '    "schema": "ash-road-south-pass-review",',
    '    "schemaVersion": 1,',
    '    "familySummaries": {',
    '      "matched-comparison": { "verdict": "pass", "summary": "specific family finding" }',
    '    },',
    '    "passes": {',
    '      "001": {',
    '        "passNumber": 1, "criterionId": "comparison-south-arrival-matched-close",',
    '        "imageSha256": "copied from template", "verdict": "pass",',
    '        "finding": "specific observation from this exact image"',
    '      }',
    '    }',
    '  }',
    '',
    'Options:',
    `  --base-url <url>   Server root. Default: ${DEFAULT_BASE_URL}`,
    `  --output <dir>     Evidence directory. Default: ${path.relative(repoRoot, defaultOutputDir)}`,
    '  --headed          Show Chrome during capture.',
    '  --require-reviewed=<n>  Verification review threshold, 0 through 200.',
    '  --require-passed=<n>    Verification pass threshold, 0 through 200.',
    '',
    'Capture refuses to merge with an existing evidence run. Use a new --output directory for a rerun.'
  ].join('\n');
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function stableStringify(value) {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

function countBy(records, field) {
  const counts = {};
  for (const record of records) counts[record[field]] = (counts[record[field]] ?? 0) + 1;
  return counts;
}

function clamp(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, value));
}

function cropAround(level, center, half) {
  const x0 = clamp(center.x - half.x, 0, level.width - 1);
  const y0 = clamp(center.y - half.y, 0, level.height - 1);
  const x1 = clamp(center.x + half.x, 0, level.width - 1);
  const y1 = clamp(center.y + half.y, 0, level.height - 1);
  return { x0, y0, x1, y1 };
}

function exactCriterion(id, family, title, expectation, target) {
  return {
    id,
    family,
    title,
    expectation,
    target,
    decisionRule: 'Record a concrete visible finding. Do not award a pass from labels, source intent, or a differently framed image.'
  };
}

function buildPlan({ ash, camp, catalog, runtimeBaseFlags = [] }) {
  if (ash.id !== 'ash-road-south') throw new Error(`Expected ash-road-south surface, got ${ash.id}`);
  if (camp.id !== 'censure-road-camp') throw new Error(`Expected censure-road-camp comparator, got ${camp.id}`);
  if (isolatedKinds.length !== 34) throw new Error(`Isolated kind recipe has ${isolatedKinds.length} entries, expected 34`);
  const passes = [];
  const add = (family, tool, criterion, state) => {
    const passNumber = passes.length + 1;
    const signatureObject = { passFamily: family, tool, state };
    const stateSignature = stableStringify(signatureObject);
    passes.push({
      passNumber,
      file: `pass-${String(passNumber).padStart(3, '0')}.png`,
      family,
      tool,
      criterion,
      state,
      stateSignature,
      stateSha256: sha256(stateSignature)
    });
  };

  for (const pair of comparisonPairs) {
    for (const framing of comparisonFramings) {
      const wholeContext = pair.id === 'whole-settlement' && framing.id === 'matched-context';
      const ashCrop = wholeContext
        ? { x0: 0, y0: 0, x1: ash.width - 1, y1: ash.height - 1 }
        : cropAround(ash, pair.ash, pair.id === 'whole-settlement' ? { x: 47, y: 29 } : framing.ashHalf);
      const campCrop = wholeContext
        ? { x0: 0, y0: 0, x1: camp.width - 1, y1: camp.height - 1 }
        : cropAround(camp, pair.camp, pair.id === 'whole-settlement' ? { x: 26, y: 18 } : framing.campHalf);
      add(
        'matched-comparison',
        'capture-scene.html',
        exactCriterion(
          `comparison-${pair.id}-${framing.id}`,
          'matched-comparison',
          `${pair.id} ${framing.id}`,
          pair.expectation,
          { ashCrop, campCrop }
        ),
        { pairId: pair.id, framing: framing.id, ashCrop, campCrop, flags: [] }
      );
    }
  }

  for (const [style, styleExpectation] of identityFloors) {
    for (const check of floorChecks) {
      add(
        'isolated-art',
        'preview-floor.html',
        exactCriterion(
          `floor-${style}-${check.id}`,
          'isolated-art',
          `${style} ${check.id}`,
          `${styleExpectation} ${check.expectation}`,
          { floorStyle: style, patchSize: check.n, mood: check.mood }
        ),
        { kind: 'floor', style, n: check.n, mood: check.mood, scale: 1 }
      );
    }
  }

  for (const entry of isolatedKinds) {
    const catalogEntry = catalog[entry.kind];
    if (!catalogEntry) throw new Error(`Isolated audit kind is not registered: ${entry.kind}`);
    const label = entry.label ?? entry.kind;
    add(
      'isolated-art',
      'preview-catalog.html',
      exactCriterion(
        `isolated-${label}`,
        'isolated-art',
        label,
        entry.expectation,
        {
          kind: entry.kind,
          prop: entry.prop ?? null,
          variants: entry.variants ?? null,
          footprint: entry.footprint ?? null,
          seeds: entry.seeds ?? 1
        }
      ),
      {
        kind: entry.kind,
        label,
        section: catalogEntry.category,
        prop: entry.prop ?? null,
        variants: entry.variants ?? null,
        footprint: entry.footprint ?? null,
        seeds: entry.seeds ?? 1,
        scale: 1
      }
    );
  }

  for (const zone of districtZones) {
    for (const framing of districtFramings) {
      const center = { x: zone.x + framing.offsetX, y: zone.y + framing.offsetY };
      const crop = cropAround(ash, center, { x: framing.halfX, y: framing.halfY });
      add(
        'district-composition',
        'capture-scene.html',
        exactCriterion(
          `district-${zone.id}-${framing.id}`,
          'district-composition',
          `${zone.id} ${framing.id}`,
          zone.expectation,
          { district: zone.id, crop }
        ),
        { level: ashLevelRelativePath, district: zone.id, framing: framing.id, crop, flags: [] }
      );
    }
  }

  for (const route of traversalRoutes) {
    route.checkpoints.forEach(([x, y], checkpointIndex) => {
      add(
        'runtime-traversal',
        'real-game-runtime',
        exactCriterion(
          `traversal-${route.id}-${checkpointIndex + 1}`,
          'runtime-traversal',
          `${route.id} checkpoint ${checkpointIndex + 1}`,
          route.expectation,
          { route: route.id, checkpoint: checkpointIndex + 1, x, y }
        ),
        {
          level: ashLevelRelativePath,
          route: route.id,
          routeOrigin: { x: route.origin[0], y: route.origin[1] },
          checkpointIndex,
          target: { x, y },
          minuteOfDay: 720,
          flags: []
        }
      );
    });
  }

  for (const zone of lightingZones) {
    for (const time of lightingTimes) {
      add(
        'runtime-lighting',
        'real-game-runtime',
        exactCriterion(
          `lighting-${zone.id}-${time.id}`,
          'runtime-lighting',
          `${zone.id} at ${time.id}`,
          zone.expectation,
          { zone: zone.id, phase: time.id, minuteOfDay: time.minuteOfDay }
        ),
        {
          level: ashLevelRelativePath,
          zone: zone.id,
          target: { x: zone.x, y: zone.y },
          phase: time.id,
          minuteOfDay: time.minuteOfDay,
          flags: []
        }
      );
    }
  }

  for (const outcome of outcomeChecks) {
    add(
      'outcome-gate',
      'real-game-runtime',
      exactCriterion(
        `outcome-${outcome.id}`,
        'outcome-gate',
        outcome.id,
        outcome.expectation,
        { x: outcome.x, y: outcome.y, flags: outcome.flags }
      ),
      {
        level: ashLevelRelativePath,
        outcome: outcome.id,
        target: { x: outcome.x, y: outcome.y },
        minuteOfDay: 720,
        flags: [...outcome.flags]
      }
    );
  }

  validateRuntimeFocusCells(ash, passes, runtimeBaseFlags);
  validatePlan(passes);
  return passes;
}

function validateRuntimeFocusCells(level, passes, runtimeBaseFlags) {
  const actors = new Set([
    ...(level.spawns?.npcs ?? []),
    ...(level.spawns?.enemies ?? [])
  ].filter(Boolean).map((actor) => `${actor.x},${actor.y}`));
  const matchesAnyFlag = (rule, flags) => [].concat(rule ?? []).some((flag) => flags.has(flag));
  const visibleForFlags = (object, flags) => {
    const waitsForVisibleFlag = Array.isArray(object.visibleWhenFlags) && object.visibleWhenFlags.length > 0;
    return !matchesAnyFlag(object.hiddenWhenFlags, flags)
      && (!waitsForVisibleFlag || matchesAnyFlag(object.visibleWhenFlags, flags));
  };
  const blockingForFlags = (flags) => new Set(
    (level.objects ?? [])
      .filter((object) => object.blocking && visibleForFlags(object, flags))
      .map((object) => `${object.x},${object.y}`)
  );
  const isWalkable = (point, blockers) => {
    const tile = level.tiles?.[point.y]?.[point.x];
    return tile != null
      && level.legend?.[tile]?.walkable === true
      && !blockers.has(`${point.x},${point.y}`);
  };
  const validate = (point, label, blockers) => {
    const tile = level.tiles?.[point.y]?.[point.x];
    if (tile == null || level.legend?.[tile]?.walkable !== true) throw new Error(`${label} is not a walkable surface cell at ${point.x},${point.y}`);
    if (blockers.has(`${point.x},${point.y}`)) throw new Error(`${label} is occupied by a blocking object at ${point.x},${point.y}`);
    if (actors.has(`${point.x},${point.y}`)) throw new Error(`${label} is occupied by an actor at ${point.x},${point.y}`);
  };
  const reachable = (start, target, blockers) => {
    const startKey = `${start.x},${start.y}`;
    const targetKey = `${target.x},${target.y}`;
    const queue = [start];
    const visited = new Set([startKey]);
    for (let index = 0; index < queue.length; index += 1) {
      const point = queue[index];
      if (`${point.x},${point.y}` === targetKey) return true;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const next = { x: point.x + dx, y: point.y + dy };
        const key = `${next.x},${next.y}`;
        if (visited.has(key) || !isWalkable(next, blockers)) continue;
        visited.add(key);
        queue.push(next);
      }
    }
    return false;
  };
  const playerStart = level.spawns?.player;
  if (!Number.isInteger(playerStart?.x) || !Number.isInteger(playerStart?.y)) {
    throw new Error('Ash Road South audit requires an authored player spawn');
  }
  for (const pass of passes.filter((entry) => entry.tool === 'real-game-runtime')) {
    const flags = new Set([...(runtimeBaseFlags ?? []), ...(pass.state.flags ?? [])]);
    const blockers = blockingForFlags(flags);
    validate(pass.state.target, `Pass ${pass.passNumber} runtime focus`, blockers);
    const origin = pass.state.routeOrigin ?? playerStart;
    if (pass.state.routeOrigin) validate(origin, `Pass ${pass.passNumber} route origin`, blockers);
    if (!reachable(origin, pass.state.target, blockers)) {
      throw new Error(`Pass ${pass.passNumber} runtime focus ${pass.state.target.x},${pass.state.target.y} is disconnected from ${origin.x},${origin.y}`);
    }
  }
}

function validatePlan(passes) {
  if (passes.length !== EXPECTED_PASSES) throw new Error(`Recipe has ${passes.length} passes, expected ${EXPECTED_PASSES}`);
  const counts = countBy(passes, 'family');
  for (const [family, expected] of Object.entries(FAMILY_COUNTS)) {
    if (counts[family] !== expected) throw new Error(`${family} has ${counts[family] ?? 0} passes, expected ${expected}`);
  }
  const stateSignatures = new Set();
  const files = new Set();
  for (const [index, pass] of passes.entries()) {
    if (pass.passNumber !== index + 1) throw new Error(`Pass sequence breaks at ${index + 1}`);
    if (stateSignatures.has(pass.stateSignature)) throw new Error(`Duplicate state signature at pass ${pass.passNumber}`);
    if (files.has(pass.file)) throw new Error(`Duplicate evidence file ${pass.file}`);
    stateSignatures.add(pass.stateSignature);
    files.add(pass.file);
  }
}

async function sourceFileList() {
  const files = new Set([
    scriptRelativePath,
    'index.html',
    ashLevelRelativePath,
    campLevelRelativePath,
    '.ai/map-review/capture-scene.html',
    '.ai/map-review/preview-floor.html',
    '.ai/map-review/preview-catalog.html',
    freshPlaytestRelativePath,
    'scripts/gen-ash-road-south.mjs',
    'scripts/content/ash-road-south-cast.mjs'
  ]);
  await collectFiles(path.join(repoRoot, 'src'), 'src', files, (relativePath) => relativePath.endsWith('.js'));
  const actorRoot = path.join(repoRoot, 'data/actors');
  try {
    await collectFiles(actorRoot, 'data/actors', files, (relativePath) => relativePath.endsWith('.json'));
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
  }
  return [...files].sort();
}

async function collectFiles(absoluteDirectory, relativeDirectory, destination, include) {
  const entries = await readdir(absoluteDirectory, { withFileTypes: true });
  for (const entry of entries) {
    const absolutePath = path.join(absoluteDirectory, entry.name);
    const relativePath = path.posix.join(relativeDirectory, entry.name);
    if (entry.isDirectory()) await collectFiles(absolutePath, relativePath, destination, include);
    else if (entry.isFile() && include(relativePath)) destination.add(relativePath);
  }
}

async function collectSourceHashes() {
  const hashes = {};
  for (const relativePath of await sourceFileList()) {
    hashes[relativePath] = sha256(await readFile(path.join(repoRoot, relativePath)));
  }
  return {
    files: hashes,
    setSha256: sha256(stableStringify(hashes))
  };
}

async function collectServedSourceHashes(baseUrl, localSourceHashes, stage) {
  const hashes = {};
  const sourcePaths = Object.keys(localSourceHashes.files).sort();
  for (const [index, relativePath] of sourcePaths.entries()) {
    const encodedPath = relativePath.split('/').map((part) => encodeURIComponent(part)).join('/');
    const url = new URL(`/${encodedPath}`, baseUrl);
    url.searchParams.set('auditSourceStage', stage);
    url.searchParams.set('auditSourceIndex', String(index));
    const response = await fetch(url, {
      cache: 'no-store',
      headers: { 'cache-control': 'no-cache' }
    });
    if (!response.ok) throw new Error(`${stage}: base URL did not serve ${relativePath} (${response.status} ${response.statusText})`);
    hashes[relativePath] = sha256(Buffer.from(await response.arrayBuffer()));
    if (hashes[relativePath] !== localSourceHashes.files[relativePath]) {
      throw new Error(`${stage}: ${url.origin} does not serve repoRoot file ${relativePath}`);
    }
  }
  const served = { files: hashes, setSha256: sha256(stableStringify(hashes)) };
  if (!sameJson(served, localSourceHashes)) throw new Error(`${stage}: served source set does not equal the local source set`);
  return served;
}

function pngDimensions(buffer) {
  if (buffer.length < 24 || buffer.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a') {
    throw new Error('Canvas blob is not a valid PNG');
  }
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

async function atomicWrite(targetPath, data) {
  await mkdir(path.dirname(targetPath), { recursive: true });
  const temporaryPath = path.join(
    path.dirname(targetPath),
    `.${path.basename(targetPath)}.${process.pid}.${randomBytes(6).toString('hex')}.tmp`
  );
  try {
    await writeFile(temporaryPath, data, { flag: 'wx' });
    await rename(temporaryPath, targetPath);
  } catch (error) {
    await rm(temporaryPath, { force: true }).catch(() => {});
    throw error;
  }
}

async function atomicWriteJson(targetPath, value) {
  await atomicWrite(targetPath, jsonDocument(value));
}

function jsonDocument(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function installBrowserErrorCollector(page) {
  let errors = [];
  page.on('pageerror', (error) => errors.push(`pageerror: ${String(error?.stack ?? error)}`));
  page.on('console', (message) => {
    const text = message.text();
    // Chromium's generic resource error omits the URL. The response and
    // requestfailed handlers below retain the actionable URL and status while
    // explicitly ignoring only favicon traffic.
    if (message.type() === 'error' && !text.includes('favicon') && !text.includes('Failed to load resource')) {
      errors.push(`console: ${text}`);
    }
  });
  page.on('response', (response) => {
    if (response.status() >= 400 && !response.url().endsWith('/favicon.ico')) {
      errors.push(`response: ${response.status()} ${response.url()}`);
    }
  });
  page.on('requestfailed', (request) => {
    if (!request.url().endsWith('/favicon.ico')) {
      errors.push(`requestfailed: ${request.failure()?.errorText ?? 'unknown'} ${request.url()}`);
    }
  });
  return {
    reset() { errors = []; },
    take() { return [...errors]; }
  };
}

function assertNoBrowserErrors(errors, stage) {
  if (errors.length > 0) throw new Error(`${stage} browser errors:\n${errors.join('\n')}`);
}

async function navigateToReady(page, collector, url, canvasSelector) {
  collector.reset();
  await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForFunction(
    () => document.title === 'CAPTURE-READY' || document.title === 'CAPTURE-ERROR',
    null,
    { timeout: 60000 }
  );
  if (await page.title() !== 'CAPTURE-READY') {
    throw new Error(`Capture harness failed at ${url}: ${await page.locator('body').innerText()}`);
  }
  await page.locator(canvasSelector).waitFor({ state: 'attached', timeout: 10000 });
}

async function extractCanvasPng(page, selector, { cropHeight = null } = {}) {
  const extracted = await page.locator(selector).evaluate(async (canvas, requestedCrop) => {
    if (!(canvas instanceof HTMLCanvasElement)) throw new Error('Capture target is not a canvas');
    if (canvas.width <= 0 || canvas.height <= 0) throw new Error(`Invalid canvas ${canvas.width}x${canvas.height}`);
    let captureCanvas = canvas;
    if (requestedCrop.cropHeight != null) {
      if (!Number.isInteger(requestedCrop.cropHeight) || requestedCrop.cropHeight <= 0 || requestedCrop.cropHeight > canvas.height) {
        throw new Error(`Invalid canvas crop height ${requestedCrop.cropHeight} for ${canvas.width}x${canvas.height}`);
      }
      captureCanvas = document.createElement('canvas');
      captureCanvas.width = canvas.width;
      captureCanvas.height = requestedCrop.cropHeight;
      const cropContext = captureCanvas.getContext('2d', { willReadFrequently: true });
      if (!cropContext) throw new Error('Canvas crop has no 2D context');
      cropContext.imageSmoothingEnabled = false;
      cropContext.drawImage(canvas, 0, 0, canvas.width, requestedCrop.cropHeight, 0, 0, canvas.width, requestedCrop.cropHeight);
    }
    const context = captureCanvas.getContext('2d', { willReadFrequently: true });
    if (!context) throw new Error('Canvas has no 2D context');
    const sampleWidth = 9;
    const sampleHeight = 8;
    const sampleCanvas = document.createElement('canvas');
    sampleCanvas.width = sampleWidth;
    sampleCanvas.height = sampleHeight;
    const sampleContext = sampleCanvas.getContext('2d', { willReadFrequently: true });
    sampleContext.imageSmoothingEnabled = false;
    sampleContext.drawImage(captureCanvas, 0, 0, sampleWidth, sampleHeight);
    const sample = sampleContext.getImageData(0, 0, sampleWidth, sampleHeight).data;
    const luminance = [];
    let lumaTotal = 0;
    let alphaPixels = 0;
    const colors = new Set();
    for (let index = 0; index < sampleWidth * sampleHeight; index += 1) {
      const offset = index * 4;
      const r = sample[offset];
      const g = sample[offset + 1];
      const b = sample[offset + 2];
      const a = sample[offset + 3];
      const value = (0.2126 * r) + (0.7152 * g) + (0.0722 * b);
      luminance.push(value);
      lumaTotal += value;
      if (a > 0) alphaPixels += 1;
      colors.add(`${r},${g},${b},${a}`);
    }
    let bits = '';
    for (let y = 0; y < sampleHeight; y += 1) {
      for (let x = 0; x < sampleWidth - 1; x += 1) {
        const left = luminance[y * sampleWidth + x];
        const right = luminance[y * sampleWidth + x + 1];
        bits += left > right ? '1' : '0';
      }
    }
    let dHash = '';
    for (let index = 0; index < bits.length; index += 4) {
      dHash += Number.parseInt(bits.slice(index, index + 4), 2).toString(16);
    }
    const blob = await new Promise((resolve, reject) => {
      captureCanvas.toBlob((value) => value ? resolve(value) : reject(new Error('canvas.toBlob returned null')), 'image/png');
    });
    const bytes = new Uint8Array(await blob.arrayBuffer());
    let binary = '';
    const chunkSize = 0x8000;
    for (let offset = 0; offset < bytes.length; offset += chunkSize) {
      binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
    }
    return {
      base64: btoa(binary),
      canvas: { width: captureCanvas.width, height: captureCanvas.height },
      fingerprint: {
        algorithm: 'dhash-9x8-luma-v1',
        dHash,
        sampledMeanLuminance: Number((lumaTotal / luminance.length).toFixed(3)),
        sampledOpaqueRatio: Number((alphaPixels / luminance.length).toFixed(6)),
        sampledUniqueColors: colors.size
      }
    };
  }, { cropHeight });
  const buffer = Buffer.from(extracted.base64, 'base64');
  const dimensions = pngDimensions(buffer);
  if (dimensions.width !== extracted.canvas.width || dimensions.height !== extracted.canvas.height) {
    throw new Error(`PNG dimensions ${dimensions.width}x${dimensions.height} do not match canvas ${extracted.canvas.width}x${extracted.canvas.height}`);
  }
  return { buffer, canvas: extracted.canvas, fingerprint: extracted.fingerprint };
}

function hammingHex(left, right) {
  if (left.length !== right.length) return Number.POSITIVE_INFINITY;
  let distance = 0;
  for (let index = 0; index < left.length; index += 1) {
    let value = Number.parseInt(left[index], 16) ^ Number.parseInt(right[index], 16);
    while (value) {
      distance += value & 1;
      value >>>= 1;
    }
  }
  return distance;
}

function nearDuplicateWarnings(record, previousRecords) {
  const warnings = [];
  for (const previous of previousRecords) {
    const distance = hammingHex(record.perceptualFingerprint.dHash, previous.perceptualFingerprint.dHash);
    const leftRatio = record.canvas.width / record.canvas.height;
    const rightRatio = previous.canvas.width / previous.canvas.height;
    if (distance <= 5 && Math.abs(leftRatio - rightRatio) <= 0.08) {
      warnings.push({
        previousPass: previous.passNumber,
        hammingDistance: distance,
        note: 'Perceptually close evidence. Inspect both passes on their contact sheets; exact PNG hashes remain distinct.'
      });
    }
  }
  return warnings;
}

function detachedUrl(baseUrl, levelRelativePath, crop, scale = 0.58) {
  const url = new URL('/.ai/map-review/capture-scene.html', baseUrl);
  url.searchParams.set('level', `./${levelRelativePath}`);
  url.searchParams.set('scale', String(scale));
  url.searchParams.set('includeDormant', '1');
  url.searchParams.set('x0', String(crop.x0));
  url.searchParams.set('y0', String(crop.y0));
  url.searchParams.set('x1', String(crop.x1));
  url.searchParams.set('y1', String(crop.y1));
  return url.href;
}

async function captureDetachedCanvas(page, collector, url) {
  await navigateToReady(page, collector, url, '#out');
  const evidence = await extractCanvasPng(page, '#out');
  const browserErrors = collector.take();
  assertNoBrowserErrors(browserErrors, url);
  return { ...evidence, url, browserErrors };
}

async function composeComparison(page, collector, left, right) {
  collector.reset();
  await page.setContent('<!doctype html><title>COMPOSE</title><canvas id="comparison"></canvas>', { waitUntil: 'load' });
  await page.evaluate(async ({ leftBase64, rightBase64 }) => {
    const loadImage = (base64) => new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('Comparison component image failed to decode'));
      image.src = `data:image/png;base64,${base64}`;
    });
    const [leftImage, rightImage] = await Promise.all([loadImage(leftBase64), loadImage(rightBase64)]);
    const canvas = document.querySelector('#comparison');
    canvas.width = 1400;
    canvas.height = 620;
    const context = canvas.getContext('2d');
    context.imageSmoothingEnabled = false;
    context.fillStyle = '#050505';
    context.fillRect(0, 0, canvas.width, canvas.height);
    const drawContained = (image, x, y, width, height) => {
      const scale = Math.min(width / image.naturalWidth, height / image.naturalHeight);
      const drawWidth = Math.max(1, Math.floor(image.naturalWidth * scale));
      const drawHeight = Math.max(1, Math.floor(image.naturalHeight * scale));
      const dx = x + Math.floor((width - drawWidth) / 2);
      const dy = y + Math.floor((height - drawHeight) / 2);
      context.drawImage(image, dx, dy, drawWidth, drawHeight);
      context.strokeStyle = '#6f5a3a';
      context.strokeRect(x, y, width, height);
    };
    drawContained(leftImage, 12, 12, 676, 596);
    drawContained(rightImage, 712, 12, 676, 596);
    document.title = 'CAPTURE-READY';
  }, {
    leftBase64: left.buffer.toString('base64'),
    rightBase64: right.buffer.toString('base64')
  });
  const evidence = await extractCanvasPng(page, '#comparison');
  const browserErrors = collector.take();
  assertNoBrowserErrors(browserErrors, 'comparison composition');
  return { ...evidence, browserErrors };
}

async function captureComparison(record, context) {
  const ashUrl = detachedUrl(context.baseUrl, ashLevelRelativePath, record.state.ashCrop, 0.62);
  const campUrl = detachedUrl(context.baseUrl, campLevelRelativePath, record.state.campCrop, 0.72);
  const ash = await captureDetachedCanvas(context.detachedPage, context.detachedErrors, ashUrl);
  const camp = await captureDetachedCanvas(context.detachedPage, context.detachedErrors, campUrl);
  const composite = await composeComparison(context.composePage, context.composeErrors, ash, camp);
  return {
    ...composite,
    capture: {
      urls: [ashUrl, campUrl],
      componentImages: [
        { side: 'ash-road-south', sha256: sha256(ash.buffer), canvas: ash.canvas, fingerprint: ash.fingerprint },
        { side: 'censure-road-camp', sha256: sha256(camp.buffer), canvas: camp.canvas, fingerprint: camp.fingerprint }
      ]
    },
    browserErrors: [...ash.browserErrors, ...camp.browserErrors, ...composite.browserErrors],
    camera: null,
    player: null,
    time: null,
    flags: []
  };
}

async function captureIsolated(record, context) {
  const state = record.state;
  let url;
  if (record.tool === 'preview-floor.html') {
    url = new URL('/.ai/map-review/preview-floor.html', context.baseUrl);
    url.searchParams.set('style', state.style);
    url.searchParams.set('n', String(state.n));
    url.searchParams.set('scale', String(state.scale));
    url.searchParams.set('labels', '0');
    if (state.mood) url.searchParams.set('mood', '1');
  } else {
    url = new URL('/.ai/map-review/preview-catalog.html', context.baseUrl);
    url.searchParams.set('section', state.section);
    url.searchParams.set('kinds', state.kind);
    url.searchParams.set('seeds', String(state.seeds));
    url.searchParams.set('scale', String(state.scale));
    const isolatedCellCount = (state.variants?.length ?? 1) * state.seeds;
    url.searchParams.set('cols', isolatedCellCount > 1 ? '2' : '1');
    url.searchParams.set('labels', '0');
    if (state.prop) url.searchParams.set('prop', JSON.stringify(state.prop));
    if (state.variants) url.searchParams.set('variants', JSON.stringify(state.variants));
    if (state.footprint) {
      url.searchParams.set('footprint', state.footprint);
      const [width, height] = state.footprint.split('x').map(Number);
      url.searchParams.set('cellW', String(Math.max(520, (width + height) * 64 + 180)));
      url.searchParams.set('cellH', String(Math.max(430, (width + height) * 38 + 210)));
    } else {
      url.searchParams.set('cellW', '320');
      url.searchParams.set('cellH', '300');
    }
  }
  await navigateToReady(context.isolatedPage, context.isolatedErrors, url.href, '#c');
  const evidence = await extractCanvasPng(context.isolatedPage, '#c');
  const browserErrors = context.isolatedErrors.take();
  assertNoBrowserErrors(browserErrors, `isolated pass ${record.passNumber}`);
  return {
    ...evidence,
    capture: { url: url.href },
    browserErrors,
    camera: null,
    player: null,
    time: null,
    flags: []
  };
}

async function captureDistrict(record, context) {
  const url = detachedUrl(context.baseUrl, ashLevelRelativePath, record.state.crop, 0.62);
  const evidence = await captureDetachedCanvas(context.detachedPage, context.detachedErrors, url);
  return {
    ...evidence,
    capture: { url },
    camera: null,
    player: null,
    time: null,
    flags: []
  };
}

async function bootRuntime(context) {
  const url = new URL('/', context.baseUrl);
  url.searchParams.set('level', ashLevelRelativePath);
  url.searchParams.set('skipIntro', '1');
  url.searchParams.set('noCombat', '1');
  url.searchParams.set('playtest', 'fresh');
  context.runtimeErrors.reset();
  await context.runtimePage.goto(url.href, { waitUntil: 'networkidle', timeout: 60000 });
  await context.runtimePage.waitForFunction(
    () => Boolean(globalThis.hostDebug?.game?.()?.ready && globalThis.hostDebug.game().level?.id === 'ash-road-south'),
    null,
    { timeout: 60000 }
  );
  context.runtimeBaseFlags = await context.runtimePage.evaluate(() => {
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
    game.anim.tick = 0;
    game.anim.pulse = 0;
    game.anim.flicker = 0;
    game.anim.idleFrame = 0;
    game.anim.bob = 0;
    game.render();
    return [...game.flags].sort();
  });
  const browserErrors = context.runtimeErrors.take();
  assertNoBrowserErrors(browserErrors, 'Ash Road South runtime boot');
  context.runtimeBootUrl = url.href;
  context.lastTraversalRoute = null;
}

async function setRuntimeFlagsAndTime(page, baseFlags, flags, minuteOfDay) {
  return page.evaluate(({ capturedBaseFlags, requestedFlags, requestedMinute }) => {
    const game = globalThis.hostDebug.game();
    game.loop.stop();
    game.flags.clear();
    for (const flag of capturedBaseFlags) game.flags.add(flag);
    for (const flag of requestedFlags) game.flags.add(flag);
    game._syncFlagConditionalObjects?.();
    game.clock.minuteOfDay = requestedMinute;
    game.clock.minuteCarry = 0;
    game.areaTitleTimer = 0;
    game.areaTitle = null;
    game.journalNotice = null;
    game.uiScreen = null;
    game.mode = 'explore';
    game.debugGrid = false;
    game.pendingExploreTarget = null;
    game.preCombatTarget = null;
    game.anim.tick = 0;
    game.anim.pulse = 0;
    game.anim.flicker = 0;
    game.anim.idleFrame = 0;
    game.anim.bob = 0;
    return [...game.flags].sort();
  }, { capturedBaseFlags: baseFlags, requestedFlags: flags, requestedMinute: minuteOfDay });
}

function assertRuntimeStateMatches(runtime, state, baseFlags, passNumber) {
  const expectedFlags = [...new Set([...baseFlags, ...(state.flags ?? [])])].sort();
  if (runtime.player?.x !== state.target.x || runtime.player?.y !== state.target.y) {
    throw new Error(`Runtime pass ${passNumber} requested target ${state.target.x},${state.target.y} but captured ${runtime.player?.x},${runtime.player?.y}`);
  }
  if (runtime.time?.minuteOfDay !== state.minuteOfDay) {
    throw new Error(`Runtime pass ${passNumber} requested minute ${state.minuteOfDay} but captured ${runtime.time?.minuteOfDay}`);
  }
  if (state.phase && runtime.time?.phase !== state.phase) {
    throw new Error(`Runtime pass ${passNumber} requested phase ${state.phase} but captured ${runtime.time?.phase}`);
  }
  if (!sameJson(runtime.flags, expectedFlags)) {
    throw new Error(`Runtime pass ${passNumber} requested flags ${JSON.stringify(expectedFlags)} but captured ${JSON.stringify(runtime.flags)}`);
  }
}

function assertRuntimeEvidenceDimensions(runtime, evidence, passNumber) {
  if (runtime.canvas?.width !== RUNTIME_CANVAS_WIDTH || runtime.canvas?.height !== RUNTIME_CANVAS_HEIGHT) {
    throw new Error(
      `Runtime pass ${passNumber} raw canvas is ${runtime.canvas?.width}x${runtime.canvas?.height}, `
      + `expected ${RUNTIME_CANVAS_WIDTH}x${RUNTIME_CANVAS_HEIGHT}`
    );
  }
  if (evidence.canvas?.width !== RUNTIME_CANVAS_WIDTH || evidence.canvas?.height !== RUNTIME_WORLD_HEIGHT) {
    throw new Error(
      `Runtime pass ${passNumber} world evidence is ${evidence.canvas?.width}x${evidence.canvas?.height}, `
      + `expected ${RUNTIME_CANVAS_WIDTH}x${RUNTIME_WORLD_HEIGHT}`
    );
  }
}

async function captureTraversal(record, context) {
  context.runtimeErrors.reset();
  const state = record.state;
  if (context.lastTraversalRoute !== state.route) {
    await setRuntimeFlagsAndTime(context.runtimePage, context.runtimeBaseFlags, [], state.minuteOfDay);
    const teleported = await context.runtimePage.evaluate(({ x, y }) => globalThis.hostDebug.teleport(x, y), state.routeOrigin);
    if (!teleported?.ok) throw new Error(`Could not place traversal origin for ${state.route}: ${teleported?.reason}`);
    context.lastTraversalRoute = state.route;
  }
  const runtime = await context.runtimePage.evaluate(async ({ target, expectedRoute, checkpointIndex, expectedMinute, expectedFlags }) => {
    const { findPath } = await import('/src/world/Pathfinder.js');
    const game = globalThis.hostDebug.game();
    game.loop.stop();
    const start = { x: game.player.x, y: game.player.y };
    const path = findPath(game.grid, game.player.position, target, game._occupiedSet(game.player));
    if (!path || path.length === 0) throw new Error(`No runtime path from ${start.x},${start.y} to ${target.x},${target.y}`);
    let completedSteps = 0;
    for (const cell of path) {
      const direction = {
        x: Math.sign(cell.x - game.player.position.x),
        y: Math.sign(cell.y - game.player.position.y)
      };
      if (!game._tryStep(game.player, direction, { logBlock: false })) {
        throw new Error(`Runtime movement blocked before ${cell.x},${cell.y}`);
      }
      game._advanceMovement(10);
      completedSteps += 1;
      if (game.mode !== 'explore') throw new Error(`Traversal left explore mode at ${game.player.x},${game.player.y}`);
    }
    game.render();
    const canvas = document.querySelector('#game');
    const time = game._buildClockReadout();
    return {
      route: expectedRoute,
      checkpointIndex,
      start,
      pathLength: path.length,
      completedSteps,
      player: { x: game.player.x, y: game.player.y, facing: game.player.facing, pxOffset: { ...game.player.pxOffset } },
      camera: { ...game.renderer.camera },
      time,
      flags: [...game.flags].sort(),
      requested: { target, minuteOfDay: expectedMinute, flags: expectedFlags },
      canvas: { width: canvas.width, height: canvas.height },
      mode: game.mode,
      levelId: game.level.id
    };
  }, {
    target: state.target,
    expectedRoute: state.route,
    checkpointIndex: state.checkpointIndex,
    expectedMinute: state.minuteOfDay,
    expectedFlags: state.flags
  });
  if (runtime.levelId !== 'ash-road-south' || runtime.mode !== 'explore') throw new Error(`Traversal pass ${record.passNumber} left Ash Road South explore runtime`);
  if (runtime.completedSteps !== runtime.pathLength) throw new Error(`Traversal pass ${record.passNumber} completed ${runtime.completedSteps} of ${runtime.pathLength} steps`);
  assertRuntimeStateMatches(runtime, state, context.runtimeBaseFlags, record.passNumber);
  const evidence = await extractCanvasPng(context.runtimePage, '#game', { cropHeight: RUNTIME_WORLD_HEIGHT });
  assertRuntimeEvidenceDimensions(runtime, evidence, record.passNumber);
  const browserErrors = context.runtimeErrors.take();
  assertNoBrowserErrors(browserErrors, `runtime traversal pass ${record.passNumber}`);
  return {
    ...evidence,
    capture: { url: context.runtimeBootUrl, runtime },
    browserErrors,
    camera: runtime.camera,
    player: runtime.player,
    time: runtime.time,
    flags: runtime.flags
  };
}

async function captureRuntimeState(record, context) {
  context.runtimeErrors.reset();
  const state = record.state;
  await setRuntimeFlagsAndTime(context.runtimePage, context.runtimeBaseFlags, state.flags, state.minuteOfDay);
  const runtime = await context.runtimePage.evaluate(({ target, expectedFlags, expectedMinute }) => {
    const game = globalThis.hostDebug.game();
    const teleported = globalThis.hostDebug.teleport(target.x, target.y);
    if (!teleported?.ok) throw new Error(`Runtime focus failed at ${target.x},${target.y}: ${teleported?.reason}`);
    game.render();
    const canvas = document.querySelector('#game');
    return {
      player: { x: game.player.x, y: game.player.y, facing: game.player.facing, pxOffset: { ...game.player.pxOffset } },
      camera: { ...game.renderer.camera },
      time: game._buildClockReadout(),
      flags: [...game.flags].sort(),
      requested: { target, minuteOfDay: expectedMinute, flags: expectedFlags },
      canvas: { width: canvas.width, height: canvas.height },
      mode: game.mode,
      levelId: game.level.id
    };
  }, { target: state.target, expectedFlags: state.flags, expectedMinute: state.minuteOfDay });
  if (runtime.levelId !== 'ash-road-south' || runtime.mode !== 'explore') throw new Error(`Runtime pass ${record.passNumber} is not an Ash Road South explore frame`);
  assertRuntimeStateMatches(runtime, state, context.runtimeBaseFlags, record.passNumber);
  const evidence = await extractCanvasPng(context.runtimePage, '#game', { cropHeight: RUNTIME_WORLD_HEIGHT });
  assertRuntimeEvidenceDimensions(runtime, evidence, record.passNumber);
  const browserErrors = context.runtimeErrors.take();
  assertNoBrowserErrors(browserErrors, `runtime pass ${record.passNumber}`);
  return {
    ...evidence,
    capture: { url: context.runtimeBootUrl, runtime },
    browserErrors,
    camera: runtime.camera,
    player: runtime.player,
    time: runtime.time,
    flags: runtime.flags
  };
}

async function captureOne(record, context) {
  if (record.family === 'matched-comparison') return captureComparison(record, context);
  if (record.family === 'isolated-art') return captureIsolated(record, context);
  if (record.family === 'district-composition') return captureDistrict(record, context);
  if (record.family === 'runtime-traversal') return captureTraversal(record, context);
  if (record.family === 'runtime-lighting' || record.family === 'outcome-gate') return captureRuntimeState(record, context);
  throw new Error(`No capture implementation for ${record.family}`);
}

async function createContactSheet(page, collector, outputDir, records, batchIndex) {
  if (records.length !== CONTACT_SHEET_SIZE) throw new Error(`Contact sheet batch ${batchIndex} has ${records.length} records`);
  const images = [];
  for (const record of records) {
    images.push((await readFile(path.join(outputDir, record.image.path))).toString('base64'));
  }
  collector.reset();
  await page.setContent('<!doctype html><title>SHEET</title><canvas id="sheet"></canvas>', { waitUntil: 'load' });
  await page.evaluate(async ({ imageData, cards, batch }) => {
    const decoded = await Promise.all(imageData.map((base64) => new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('Contact-sheet image failed to decode'));
      image.src = `data:image/png;base64,${base64}`;
    })));
    const canvas = document.querySelector('#sheet');
    canvas.width = 1500;
    canvas.height = 1060;
    const context = canvas.getContext('2d');
    context.imageSmoothingEnabled = false;
    context.fillStyle = '#050505';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = '#c8b99a';
    context.font = '18px monospace';
    context.fillText(`ASH ROAD SOUTH IDENTITY AUDIT, SHEET ${batch + 1}`, 14, 24);
    const columns = 5;
    const cellWidth = 296;
    const cellHeight = 252;
    for (let index = 0; index < decoded.length; index += 1) {
      const image = decoded[index];
      const column = index % columns;
      const row = Math.floor(index / columns);
      const x = 10 + column * cellWidth;
      const y = 38 + row * cellHeight;
      const imageWidth = 286;
      const imageHeight = 205;
      const scale = Math.min(imageWidth / image.naturalWidth, imageHeight / image.naturalHeight);
      const drawWidth = Math.max(1, Math.floor(image.naturalWidth * scale));
      const drawHeight = Math.max(1, Math.floor(image.naturalHeight * scale));
      const dx = x + Math.floor((imageWidth - drawWidth) / 2);
      const dy = y + Math.floor((imageHeight - drawHeight) / 2);
      context.drawImage(image, dx, dy, drawWidth, drawHeight);
      context.strokeStyle = '#5d4c34';
      context.strokeRect(x, y, imageWidth, imageHeight);
      context.fillStyle = '#efe1bd';
      context.font = '13px monospace';
      context.fillText(`${String(cards[index].passNumber).padStart(3, '0')} ${cards[index].family}`, x + 3, y + 220);
      context.fillStyle = '#b8a888';
      context.font = '11px monospace';
      context.fillText(cards[index].criterionId.slice(0, 40), x + 3, y + 238);
    }
    document.title = 'CAPTURE-READY';
  }, {
    imageData: images,
    cards: records.map((record) => ({ passNumber: record.passNumber, family: record.family, criterionId: record.criterion.id })),
    batch: batchIndex
  });
  const evidence = await extractCanvasPng(page, '#sheet');
  const browserErrors = collector.take();
  assertNoBrowserErrors(browserErrors, `contact sheet ${batchIndex + 1}`);
  const start = batchIndex * CONTACT_SHEET_SIZE + 1;
  const end = start + CONTACT_SHEET_SIZE - 1;
  const relativePath = `contact-sheet-${String(start).padStart(3, '0')}-${String(end).padStart(3, '0')}.png`;
  await atomicWrite(path.join(outputDir, relativePath), evidence.buffer);
  return {
    path: relativePath,
    startPass: start,
    endPass: end,
    includedPasses: records.map((record) => record.passNumber),
    sha256: sha256(evidence.buffer),
    bytes: evidence.buffer.length,
    width: evidence.canvas.width,
    height: evidence.canvas.height,
    perceptualFingerprint: evidence.fingerprint,
    browserErrors
  };
}

function reviewPassKey(passNumber) {
  return String(passNumber).padStart(3, '0');
}

function buildReviewTemplate(records) {
  return {
    schema: 'ash-road-south-pass-review',
    schemaVersion: 1,
    familySummaries: Object.fromEntries(
      Object.keys(FAMILY_COUNTS).map((family) => [family, { verdict: '', summary: '' }])
    ),
    passes: Object.fromEntries(records.map((record) => [
      reviewPassKey(record.passNumber),
      {
        passNumber: record.passNumber,
        criterionId: record.criterion.id,
        imageSha256: record.image.sha256,
        verdict: '',
        finding: ''
      }
    ]))
  };
}

function reviewTemplateEvidence(records) {
  const template = buildReviewTemplate(records);
  const buffer = Buffer.from(jsonDocument(template));
  return {
    template,
    buffer,
    metadata: {
      path: 'review-template.json',
      sha256: sha256(buffer),
      bytes: buffer.length,
      passEntries: EXPECTED_PASSES,
      familySummaries: Object.keys(FAMILY_COUNTS).length
    }
  };
}

async function ensureFreshCaptureTarget(outputDir) {
  const filesystemRoot = path.parse(outputDir).root;
  if (outputDir === filesystemRoot || outputDir === repoRoot) {
    throw new Error('Evidence output must be a dedicated directory, not the filesystem or repository root');
  }
  await mkdir(outputDir, { recursive: true });
  const entries = await readdir(outputDir);
  const conflicting = entries.filter((name) => /^pass-\d{3}\.png$/.test(name)
    || /^contact-sheet-\d{3}-\d{3}\.png$/.test(name)
    || name === 'manifest.json'
    || name === 'review-ledger.jsonl'
    || name === 'review-template.json');
  if (conflicting.length > 0) {
    throw new Error(`Evidence directory already contains an audit run (${conflicting.slice(0, 5).join(', ')}). Use a new --output directory.`);
  }
}

async function loadCaptureInputs() {
  const [ashSource, campSource, freshPlaytestSource, catalogModule, playtestModule] = await Promise.all([
    readFile(path.join(repoRoot, ashLevelRelativePath)),
    readFile(path.join(repoRoot, campLevelRelativePath)),
    readFile(path.join(repoRoot, freshPlaytestRelativePath)),
    import(`${pathToFileURL(path.join(repoRoot, 'src/render/spriteCatalog.js')).href}?audit=${Date.now()}`),
    import(`${pathToFileURL(path.join(repoRoot, 'src/core/PlaytestProfile.js')).href}?audit=${Date.now()}`)
  ]);
  const ash = JSON.parse(ashSource.toString('utf8'));
  const playtestProfile = JSON.parse(freshPlaytestSource.toString('utf8'));
  const playtestSeed = playtestModule.resolvePlaytestSeed(playtestProfile, `./${ashLevelRelativePath}`);
  return {
    ash,
    camp: JSON.parse(campSource.toString('utf8')),
    catalog: catalogModule.SPRITE_CATALOG,
    runtimeBaseFlags: [...new Set(playtestSeed.flags ?? [])].sort()
  };
}

async function runCapture(options) {
  await ensureFreshCaptureTarget(options.outputDir);
  const inputs = await loadCaptureInputs();
  const plan = buildPlan(inputs);
  const sourceHashes = await collectSourceHashes();
  const servedSourcesBefore = await collectServedSourceHashes(options.baseUrl, sourceHashes, 'before-capture');
  const { chromium } = await import(PLAYWRIGHT_IMPORT);
  const browserExecutablePath = process.env.CHROME_PATH ?? '/opt/google/chrome/chrome';
  const browser = await chromium.launch({
    executablePath: browserExecutablePath,
    headless: !options.headed
  });
  const browserVersion = await browser.version();
  const context = {
    baseUrl: options.baseUrl,
    detachedPage: await browser.newPage({ viewport: { width: 1600, height: 1200 }, deviceScaleFactor: 1 }),
    isolatedPage: await browser.newPage({ viewport: { width: 1600, height: 1200 }, deviceScaleFactor: 1 }),
    runtimePage: await browser.newPage({ viewport: { width: 1600, height: 1200 }, deviceScaleFactor: 1 }),
    composePage: await browser.newPage({ viewport: { width: 1600, height: 1200 }, deviceScaleFactor: 1 }),
    sheetPage: await browser.newPage({ viewport: { width: 1600, height: 1200 }, deviceScaleFactor: 1 })
  };
  context.detachedErrors = installBrowserErrorCollector(context.detachedPage);
  context.isolatedErrors = installBrowserErrorCollector(context.isolatedPage);
  context.runtimeErrors = installBrowserErrorCollector(context.runtimePage);
  context.composeErrors = installBrowserErrorCollector(context.composePage);
  context.sheetErrors = installBrowserErrorCollector(context.sheetPage);
  const records = [];
  const exactImageHashes = new Set();
  const startedAt = new Date().toISOString();

  try {
    await bootRuntime(context);
    if (!sameJson(context.runtimeBaseFlags, inputs.runtimeBaseFlags)) {
      throw new Error('Browser runtime base flags do not match the resolved fresh playtest profile');
    }
    for (const planned of plan) {
      const captured = await captureOne(planned, context);
      const imageHash = sha256(captured.buffer);
      if (exactImageHashes.has(imageHash)) {
        throw new Error(`Pass ${planned.passNumber} duplicates an earlier PNG exactly (${imageHash})`);
      }
      exactImageHashes.add(imageHash);
      const record = {
        passNumber: planned.passNumber,
        family: planned.family,
        tool: planned.tool,
        criterion: planned.criterion,
        state: planned.state,
        stateSignature: planned.stateSignature,
        stateSha256: planned.stateSha256,
        sourceHash: sourceHashes.setSha256,
        sourceLevelHashes: {
          [ashLevelRelativePath]: sourceHashes.files[ashLevelRelativePath],
          ...(planned.family === 'matched-comparison' ? { [campLevelRelativePath]: sourceHashes.files[campLevelRelativePath] } : {})
        },
        image: {
          path: planned.file,
          sha256: imageHash,
          bytes: captured.buffer.length,
          width: captured.canvas.width,
          height: captured.canvas.height
        },
        canvas: captured.canvas,
        camera: captured.camera,
        player: captured.player,
        time: captured.time,
        flags: captured.flags,
        perceptualFingerprint: captured.fingerprint,
        browserErrors: captured.browserErrors,
        capture: captured.capture,
        nearDuplicateWarnings: [],
        review: null
      };
      record.nearDuplicateWarnings = nearDuplicateWarnings(record, records);
      await atomicWrite(path.join(options.outputDir, planned.file), captured.buffer);
      records.push(record);
      console.log(`${String(planned.passNumber).padStart(3, '0')}/${EXPECTED_PASSES} ${planned.family} ${planned.criterion.id}`);
    }

    const contactSheets = [];
    for (let batchIndex = 0; batchIndex < EXPECTED_PASSES / CONTACT_SHEET_SIZE; batchIndex += 1) {
      const batch = records.slice(batchIndex * CONTACT_SHEET_SIZE, (batchIndex + 1) * CONTACT_SHEET_SIZE);
      contactSheets.push(await createContactSheet(context.sheetPage, context.sheetErrors, options.outputDir, batch, batchIndex));
    }
    const currentSources = await collectSourceHashes();
    if (currentSources.setSha256 !== sourceHashes.setSha256) {
      const changedFiles = [...new Set([
        ...Object.keys(sourceHashes.files),
        ...Object.keys(currentSources.files)
      ])]
        .filter((relativePath) => sourceHashes.files[relativePath] !== currentSources.files[relativePath])
        .sort();
      throw new Error(
        `Audited source files changed during capture: ${changedFiles.join(', ') || 'unknown file set'}. `
        + 'Discard this mixed-state run and capture again.'
      );
    }
    const servedSourcesAfter = await collectServedSourceHashes(options.baseUrl, currentSources, 'after-capture');
    const templateEvidence = reviewTemplateEvidence(records);
    await atomicWrite(path.join(options.outputDir, templateEvidence.metadata.path), templateEvidence.buffer);
    const manifest = {
      schema: 'ash-road-south-surface-identity-audit',
      schemaVersion: SCRIPT_VERSION,
      status: 'captured-unreviewed',
      subject: { levelId: 'ash-road-south', levelFile: ashLevelRelativePath, scope: 'surface-only' },
      comparator: { levelId: 'censure-road-camp', levelFile: campLevelRelativePath, scope: 'matched-comparison-only' },
      startedAt,
      capturedAt: new Date().toISOString(),
      baseUrl: options.baseUrl,
      playwrightImport: PLAYWRIGHT_IMPORT,
      browser: {
        version: browserVersion,
        executablePath: browserExecutablePath,
        headless: !options.headed
      },
      runtimeBaseFlags: context.runtimeBaseFlags,
      contract: {
        totalPasses: EXPECTED_PASSES,
        familyCounts: FAMILY_COUNTS,
        exactDuplicateStatesAllowed: false,
        exactDuplicatePngsAllowed: false,
        nearDuplicates: 'warn',
        contactSheets: 10,
        imagesPerContactSheet: CONTACT_SHEET_SIZE,
        captureMethod: 'backing canvas toBlob image/png followed by atomic filesystem rename',
        reviewEntries: EXPECTED_PASSES,
        finalApproval: { reviewed: EXPECTED_PASSES, passed: EXPECTED_PASSES }
      },
      sourceHashes,
      servedSourceHashes: {
        beforeCapture: servedSourcesBefore,
        afterCapture: servedSourcesAfter
      },
      records,
      contactSheets,
      reviewTemplate: templateEvidence.metadata,
      review: null,
      reviewedCount: 0,
      passedCount: 0
    };
    const ledger = records.map((record) => JSON.stringify(record)).join('\n') + '\n';
    await atomicWrite(path.join(options.outputDir, 'review-ledger.jsonl'), ledger);
    await atomicWriteJson(path.join(options.outputDir, 'manifest.json'), manifest);
    console.log(`captured ${records.length} unique passes and ${contactSheets.length} contact sheets in ${options.outputDir}`);
    console.log('Manual contact-sheet inspection and --review are still required before certification.');
  } finally {
    await browser.close();
  }
}

async function readManifest(outputDir) {
  const manifestPath = path.join(outputDir, 'manifest.json');
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  if (manifest.schema !== 'ash-road-south-surface-identity-audit' || manifest.schemaVersion !== SCRIPT_VERSION) {
    throw new Error(`Unsupported audit manifest at ${manifestPath}`);
  }
  return manifest;
}

async function readLedger(outputDir) {
  const source = await readFile(path.join(outputDir, 'review-ledger.jsonl'), 'utf8');
  return source.split('\n').filter(Boolean).map((line, index) => {
    try {
      return JSON.parse(line);
    } catch (error) {
      throw new Error(`Invalid review-ledger.jsonl line ${index + 1}: ${error.message}`);
    }
  });
}

function assertExactObjectKeys(value, expectedKeys, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${label} must be an object`);
  const actual = Object.keys(value).sort();
  const expected = [...expectedKeys].sort();
  if (!sameJson(actual, expected)) throw new Error(`${label} must contain exactly: ${expected.join(', ')}`);
}

function concreteReviewText(value, label) {
  if (typeof value !== 'string') throw new Error(`${label} must be a string`);
  const normalized = value.trim().replace(/\s+/g, ' ');
  const placeholder = /^(todo|tbd|none|n\/a|na|pass|fail|ok|looks good|needs work)[.!]*$/i;
  if (normalized.length < 12 || normalized.split(' ').length < 3 || placeholder.test(normalized)) {
    throw new Error(`${label} must be a concrete observation of at least three words`);
  }
  return normalized;
}

function worstVerdict(verdicts) {
  if (verdicts.includes('fail')) return 'fail';
  if (verdicts.includes('needs-work')) return 'needs-work';
  return 'pass';
}

function validateFindings(value, records) {
  assertExactObjectKeys(value, ['schema', 'schemaVersion', 'familySummaries', 'passes'], 'Findings file');
  if (value.schema !== 'ash-road-south-pass-review' || value.schemaVersion !== 1) {
    throw new Error('Findings file has the wrong review schema');
  }
  assertExactObjectKeys(value.familySummaries, Object.keys(FAMILY_COUNTS), 'familySummaries');
  const expectedPassKeys = records.map((record) => reviewPassKey(record.passNumber));
  assertExactObjectKeys(value.passes, expectedPassKeys, 'passes');
  if (Object.keys(value.passes).length !== EXPECTED_PASSES) throw new Error(`Findings must contain exactly ${EXPECTED_PASSES} pass entries`);

  const passes = {};
  const verdictsByFamily = Object.fromEntries(Object.keys(FAMILY_COUNTS).map((family) => [family, []]));
  for (const record of records) {
    const key = reviewPassKey(record.passNumber);
    const finding = value.passes[key];
    assertExactObjectKeys(
      finding,
      ['passNumber', 'criterionId', 'imageSha256', 'verdict', 'finding'],
      `passes.${key}`
    );
    if (finding.passNumber !== record.passNumber) throw new Error(`passes.${key} has the wrong passNumber`);
    if (finding.criterionId !== record.criterion.id) throw new Error(`passes.${key} has the wrong criterionId`);
    if (finding.imageSha256 !== record.image.sha256) throw new Error(`passes.${key} has the wrong imageSha256`);
    if (!REVIEW_VERDICTS.has(finding.verdict)) throw new Error(`passes.${key} verdict must be pass, needs-work, or fail`);
    passes[key] = {
      passNumber: finding.passNumber,
      criterionId: finding.criterionId,
      imageSha256: finding.imageSha256,
      verdict: finding.verdict,
      finding: concreteReviewText(finding.finding, `passes.${key}.finding`)
    };
    verdictsByFamily[record.family].push(finding.verdict);
  }

  const familySummaries = {};
  for (const family of Object.keys(FAMILY_COUNTS)) {
    const summary = value.familySummaries[family];
    assertExactObjectKeys(summary, ['verdict', 'summary'], `familySummaries.${family}`);
    const derivedVerdict = worstVerdict(verdictsByFamily[family]);
    if (summary.verdict !== derivedVerdict) {
      throw new Error(`familySummaries.${family}.verdict must be ${derivedVerdict}, the worst verdict among that family's passes`);
    }
    familySummaries[family] = {
      verdict: summary.verdict,
      summary: concreteReviewText(summary.summary, `familySummaries.${family}.summary`)
    };
  }
  return { familySummaries, passes };
}

async function runReview(options) {
  if (!options.contactSheetsInspected) {
    throw new Error('--review is allowed only after manual inspection of all ten contact sheets. Add --confirm-contact-sheets-inspected after doing that work.');
  }
  if (!options.reviewer) throw new Error('--reviewer is required for --review');
  if (!options.findingsPath) throw new Error('--findings is required for --review');
  await verifyEvidence(options.outputDir, 0, 0, { quiet: true });
  const [manifest, ledger, findingsSource] = await Promise.all([
    readManifest(options.outputDir),
    readLedger(options.outputDir),
    readFile(options.findingsPath, 'utf8')
  ]);
  if (manifest.review || ledger.some((record) => record.review)) {
    throw new Error('This evidence run is already reviewed. Capture a fresh run rather than overwriting review history.');
  }
  const findings = validateFindings(JSON.parse(findingsSource), manifest.records);
  const reviewedAt = new Date().toISOString();
  const applyReview = (record) => {
    const passFinding = findings.passes[reviewPassKey(record.passNumber)];
    return {
      ...record,
      review: {
        reviewer: options.reviewer,
        reviewedAt,
        family: record.family,
        passNumber: record.passNumber,
        criterionId: record.criterion.id,
        imageSha256: record.image.sha256,
        verdict: passFinding.verdict,
        finding: passFinding.finding
      }
    };
  };
  const reviewedRecords = manifest.records.map(applyReview);
  const reviewedLedger = ledger.map(applyReview);
  const passedCount = reviewedRecords.filter((record) => record.review.verdict === 'pass').length;
  manifest.records = reviewedRecords;
  manifest.status = passedCount === EXPECTED_PASSES ? 'reviewed-passed' : 'reviewed-with-findings';
  manifest.reviewedCount = reviewedRecords.length;
  manifest.passedCount = passedCount;
  manifest.review = {
    reviewer: options.reviewer,
    reviewedAt,
    contactSheetsInspected: true,
    contactSheetCount: manifest.contactSheets.length,
    familySummaries: findings.familySummaries
  };
  await atomicWrite(
    path.join(options.outputDir, 'review-ledger.jsonl'),
    reviewedLedger.map((record) => JSON.stringify(record)).join('\n') + '\n'
  );
  await atomicWriteJson(path.join(options.outputDir, 'manifest.json'), manifest);
  console.log(`reviewed ${reviewedRecords.length} evidence records: ${passedCount} pass, ${reviewedRecords.length - passedCount} need work or fail`);
  console.log('Final approval requires --verify --require-reviewed=200 --require-passed=200.');
}

function sameJson(left, right) {
  return stableStringify(left) === stableStringify(right);
}

async function verifyEvidence(outputDir, requireReviewed, requirePassed, { quiet = false } = {}) {
  const [manifest, ledger, currentSources, outputEntries, currentInputs] = await Promise.all([
    readManifest(outputDir),
    readLedger(outputDir),
    collectSourceHashes(),
    readdir(outputDir),
    loadCaptureInputs()
  ]);
  const currentPlan = buildPlan(currentInputs);
  if (manifest.subject?.levelId !== 'ash-road-south' || manifest.subject?.scope !== 'surface-only') {
    throw new Error('Manifest subject is not the Ash Road South surface');
  }
  if (manifest.comparator?.levelId !== 'censure-road-camp' || manifest.comparator?.scope !== 'matched-comparison-only') {
    throw new Error('Manifest comparator scope is invalid');
  }
  if (manifest.contract?.totalPasses !== EXPECTED_PASSES
    || manifest.contract?.reviewEntries !== EXPECTED_PASSES
    || !sameJson(manifest.contract?.finalApproval, { reviewed: EXPECTED_PASSES, passed: EXPECTED_PASSES })
    || !sameJson(manifest.contract.familyCounts, FAMILY_COUNTS)) {
    throw new Error('Manifest contract does not describe the exact 200-pass recipe');
  }
  if (manifest.records?.length !== EXPECTED_PASSES || ledger.length !== EXPECTED_PASSES) {
    throw new Error(`Expected 200 manifest and ledger records, got ${manifest.records?.length ?? 0} and ${ledger.length}`);
  }
  if (manifest.sourceHashes?.setSha256 !== sha256(stableStringify(manifest.sourceHashes?.files ?? {}))) {
    throw new Error('Manifest source hash aggregate is internally inconsistent');
  }
  if (!sameJson(manifest.sourceHashes, currentSources)) {
    throw new Error('Audited source hashes no longer match the current repository state');
  }
  assertExactObjectKeys(manifest.servedSourceHashes, ['beforeCapture', 'afterCapture'], 'servedSourceHashes');
  for (const [stage, servedSources] of Object.entries(manifest.servedSourceHashes)) {
    if (servedSources?.setSha256 !== sha256(stableStringify(servedSources?.files ?? {}))) {
      throw new Error(`${stage} served-source aggregate is internally inconsistent`);
    }
    if (!sameJson(servedSources, currentSources)) throw new Error(`${stage} served-source set does not equal repoRoot`);
  }
  if (typeof manifest.browser?.version !== 'string' || manifest.browser.version.trim().length === 0) {
    throw new Error('Manifest does not record the capture browser version');
  }
  if (!Array.isArray(manifest.runtimeBaseFlags)
    || !sameJson(manifest.runtimeBaseFlags, [...new Set(manifest.runtimeBaseFlags)].sort())) {
    throw new Error('Manifest runtimeBaseFlags are missing or non-canonical');
  }
  if (!sameJson(manifest.runtimeBaseFlags, currentInputs.runtimeBaseFlags)) {
    throw new Error('Manifest runtimeBaseFlags do not match the current fresh playtest profile');
  }
  const passFiles = outputEntries.filter((name) => /^pass-\d{3}\.png$/.test(name)).sort();
  const sheetFiles = outputEntries.filter((name) => /^contact-sheet-\d{3}-\d{3}\.png$/.test(name)).sort();
  if (passFiles.length !== EXPECTED_PASSES) throw new Error(`Evidence directory has ${passFiles.length} pass PNGs, expected 200`);
  if (sheetFiles.length !== 10 || manifest.contactSheets?.length !== 10) throw new Error('Evidence directory must contain exactly ten registered contact sheets');
  if (!outputEntries.includes('review-template.json')) throw new Error('Evidence directory is missing review-template.json');
  const expectedTemplate = reviewTemplateEvidence(manifest.records);
  const templateBuffer = await readFile(path.join(outputDir, 'review-template.json'));
  if (!sameJson(manifest.reviewTemplate, expectedTemplate.metadata)
    || templateBuffer.length !== expectedTemplate.metadata.bytes
    || sha256(templateBuffer) !== expectedTemplate.metadata.sha256
    || !sameJson(JSON.parse(templateBuffer.toString('utf8')), expectedTemplate.template)) {
    throw new Error('review-template.json does not match the exact captured pass recipe and image hashes');
  }
  const stateHashes = new Set();
  const imageHashes = new Set();
  const counts = {};
  let reviewedCount = 0;
  let passedCount = 0;
  const reviewVerdictsByFamily = Object.fromEntries(Object.keys(FAMILY_COUNTS).map((family) => [family, []]));
  for (let index = 0; index < EXPECTED_PASSES; index += 1) {
    const record = manifest.records[index];
    const ledgerRecord = ledger[index];
    const planned = currentPlan[index];
    const expectedNumber = index + 1;
    const expectedFile = `pass-${String(expectedNumber).padStart(3, '0')}.png`;
    if (record.passNumber !== expectedNumber || ledgerRecord.passNumber !== expectedNumber) throw new Error(`Record sequence breaks at pass ${expectedNumber}`);
    if (record.image?.path !== expectedFile || passFiles[index] !== expectedFile) throw new Error(`Pass ${expectedNumber} has the wrong evidence path`);
    if (!sameJson(record, ledgerRecord)) throw new Error(`Manifest and ledger disagree at pass ${expectedNumber}`);
    const recordedPlan = {
      passNumber: record.passNumber,
      file: record.image.path,
      family: record.family,
      tool: record.tool,
      criterion: record.criterion,
      state: record.state,
      stateSignature: record.stateSignature,
      stateSha256: record.stateSha256
    };
    if (!sameJson(recordedPlan, planned)) {
      throw new Error(`Pass ${expectedNumber} does not match the recipe rebuilt from current map and catalog inputs`);
    }
    if (record.stateSha256 !== sha256(record.stateSignature)
      || record.stateSignature !== stableStringify({ passFamily: record.family, tool: record.tool, state: record.state })) {
      throw new Error(`Pass ${expectedNumber} has an invalid state signature`);
    }
    if (stateHashes.has(record.stateSha256)) throw new Error(`Pass ${expectedNumber} duplicates a state signature`);
    stateHashes.add(record.stateSha256);
    const buffer = await readFile(path.join(outputDir, expectedFile));
    const fileStat = await stat(path.join(outputDir, expectedFile));
    const dimensions = pngDimensions(buffer);
    const imageHash = sha256(buffer);
    if (imageHash !== record.image.sha256 || fileStat.size !== record.image.bytes
      || dimensions.width !== record.image.width || dimensions.height !== record.image.height
      || dimensions.width !== record.canvas.width || dimensions.height !== record.canvas.height) {
      throw new Error(`Pass ${expectedNumber} image evidence does not match its record`);
    }
    if (record.tool === 'real-game-runtime') {
      const rawCanvas = record.capture?.runtime?.canvas;
      if (rawCanvas?.width !== RUNTIME_CANVAS_WIDTH || rawCanvas?.height !== RUNTIME_CANVAS_HEIGHT
        || record.canvas.width !== RUNTIME_CANVAS_WIDTH || record.canvas.height !== RUNTIME_WORLD_HEIGHT) {
        throw new Error(`Pass ${expectedNumber} does not preserve the raw-canvas and world-only runtime dimensions`);
      }
    }
    if (imageHashes.has(imageHash)) throw new Error(`Pass ${expectedNumber} duplicates an exact PNG hash`);
    imageHashes.add(imageHash);
    if (record.sourceHash !== manifest.sourceHashes.setSha256) throw new Error(`Pass ${expectedNumber} source hash is stale`);
    const expectedLevelHashes = {
      [ashLevelRelativePath]: manifest.sourceHashes.files[ashLevelRelativePath],
      ...(record.family === 'matched-comparison'
        ? { [campLevelRelativePath]: manifest.sourceHashes.files[campLevelRelativePath] }
        : {})
    };
    if (!sameJson(record.sourceLevelHashes, expectedLevelHashes)) {
      throw new Error(`Pass ${expectedNumber} has the wrong level-source provenance`);
    }
    if (!record.perceptualFingerprint?.dHash || record.perceptualFingerprint.algorithm !== 'dhash-9x8-luma-v1') {
      throw new Error(`Pass ${expectedNumber} has no valid perceptual fingerprint`);
    }
    if (!Array.isArray(record.browserErrors) || record.browserErrors.length !== 0) throw new Error(`Pass ${expectedNumber} records browser errors`);
    for (const key of ['camera', 'player', 'time', 'flags']) {
      if (!Object.hasOwn(record, key)) throw new Error(`Pass ${expectedNumber} is missing ${key}`);
    }
    if (!Array.isArray(record.flags)) throw new Error(`Pass ${expectedNumber} flags are not recorded as an array`);
    if (!record.criterion?.expectation || !record.criterion?.decisionRule) throw new Error(`Pass ${expectedNumber} lacks an exact criterion`);
    if (record.tool === 'real-game-runtime') {
      const runtime = record.capture?.runtime;
      const expectedFlags = [...new Set([...manifest.runtimeBaseFlags, ...(record.state.flags ?? [])])].sort();
      if (!runtime
        || !sameJson(runtime.requested, {
          target: record.state.target,
          minuteOfDay: record.state.minuteOfDay,
          flags: record.state.flags
        })
        || record.player?.x !== record.state.target.x
        || record.player?.y !== record.state.target.y
        || record.time?.minuteOfDay !== record.state.minuteOfDay
        || (record.state.phase && record.time?.phase !== record.state.phase)
        || !sameJson(record.flags, expectedFlags)
        || !sameJson(runtime.player, record.player)
        || !sameJson(runtime.camera, record.camera)
        || !sameJson(runtime.time, record.time)
        || !sameJson(runtime.flags, record.flags)) {
        throw new Error(`Pass ${expectedNumber} runtime target, time, flags, or captured state do not match the rebuilt request`);
      }
    }
    counts[record.family] = (counts[record.family] ?? 0) + 1;
    if (record.review) {
      reviewedCount += 1;
      assertExactObjectKeys(
        record.review,
        ['reviewer', 'reviewedAt', 'family', 'passNumber', 'criterionId', 'imageSha256', 'verdict', 'finding'],
        `Pass ${expectedNumber} review`
      );
      if (record.review.family !== record.family
        || record.review.passNumber !== record.passNumber
        || record.review.criterionId !== record.criterion.id
        || record.review.imageSha256 !== record.image.sha256
        || !REVIEW_VERDICTS.has(record.review.verdict)
        || concreteReviewText(record.review.finding, `Pass ${expectedNumber} review finding`) !== record.review.finding) {
        throw new Error(`Pass ${expectedNumber} has an invalid pass-specific review`);
      }
      reviewVerdictsByFamily[record.family].push(record.review.verdict);
      if (record.review.verdict === 'pass') passedCount += 1;
    }
  }
  if (!sameJson(counts, FAMILY_COUNTS)) throw new Error(`Captured family counts are wrong: ${JSON.stringify(counts)}`);
  for (const [index, sheet] of manifest.contactSheets.entries()) {
    const start = index * CONTACT_SHEET_SIZE + 1;
    const end = start + CONTACT_SHEET_SIZE - 1;
    const expectedPath = `contact-sheet-${String(start).padStart(3, '0')}-${String(end).padStart(3, '0')}.png`;
    if (sheet.path !== expectedPath || sheetFiles[index] !== expectedPath
      || !sameJson(sheet.includedPasses, Array.from({ length: CONTACT_SHEET_SIZE }, (_, offset) => start + offset))) {
      throw new Error(`Contact sheet ${index + 1} has the wrong coverage`);
    }
    const buffer = await readFile(path.join(outputDir, expectedPath));
    const dimensions = pngDimensions(buffer);
    if (sha256(buffer) !== sheet.sha256 || buffer.length !== sheet.bytes
      || dimensions.width !== sheet.width || dimensions.height !== sheet.height
      || sheet.browserErrors?.length !== 0) {
      throw new Error(`Contact sheet ${index + 1} does not match its manifest record`);
    }
  }
  if (manifest.reviewedCount !== reviewedCount) throw new Error(`Manifest reviewedCount is ${manifest.reviewedCount}, actual is ${reviewedCount}`);
  if (manifest.passedCount !== passedCount) throw new Error(`Manifest passedCount is ${manifest.passedCount}, actual is ${passedCount}`);
  if (reviewedCount !== 0 && reviewedCount !== EXPECTED_PASSES) {
    throw new Error(`A review must contain exactly ${EXPECTED_PASSES} pass-specific records, not ${reviewedCount}`);
  }
  if (reviewedCount > 0) {
    assertExactObjectKeys(
      manifest.review,
      ['reviewer', 'reviewedAt', 'contactSheetsInspected', 'contactSheetCount', 'familySummaries'],
      'Manifest review'
    );
    if (!manifest.review.contactSheetsInspected || manifest.review.contactSheetCount !== 10) {
      throw new Error('Reviewed evidence lacks the manual contact-sheet inspection attestation');
    }
    assertExactObjectKeys(manifest.review.familySummaries, Object.keys(FAMILY_COUNTS), 'Manifest family summaries');
    for (const family of Object.keys(FAMILY_COUNTS)) {
      const summary = manifest.review.familySummaries[family];
      assertExactObjectKeys(summary, ['verdict', 'summary'], `Manifest family summary ${family}`);
      const derivedVerdict = worstVerdict(reviewVerdictsByFamily[family]);
      if (summary.verdict !== derivedVerdict
        || concreteReviewText(summary.summary, `Manifest family summary ${family}`) !== summary.summary) {
        throw new Error(`Manifest family summary ${family} does not match its pass-specific verdicts`);
      }
    }
    for (const record of manifest.records) {
      if (record.review.reviewer !== manifest.review.reviewer || record.review.reviewedAt !== manifest.review.reviewedAt) {
        throw new Error(`Pass ${record.passNumber} review provenance differs from the manifest review`);
      }
    }
    const expectedStatus = passedCount === EXPECTED_PASSES ? 'reviewed-passed' : 'reviewed-with-findings';
    if (manifest.status !== expectedStatus) throw new Error(`Reviewed manifest status must be ${expectedStatus}`);
  } else if (manifest.review !== null || manifest.status !== 'captured-unreviewed') {
    throw new Error('Unreviewed evidence has inconsistent review metadata');
  }
  if (requireReviewed > reviewedCount) throw new Error(`Verification requires ${requireReviewed} reviewed records, but only ${reviewedCount} are reviewed`);
  if (requirePassed > passedCount) throw new Error(`Verification requires ${requirePassed} passed records, but only ${passedCount} passed`);
  const approved = reviewedCount === EXPECTED_PASSES && passedCount === EXPECTED_PASSES;
  const result = {
    passes: EXPECTED_PASSES,
    uniqueStateHashes: stateHashes.size,
    uniqueImageHashes: imageHashes.size,
    contactSheets: manifest.contactSheets.length,
    reviewedCount,
    passedCount,
    approved,
    sourceSetSha256: currentSources.setSha256
  };
  if (!quiet) {
    console.log(
      `verified ${result.passes} passes, ${result.uniqueImageHashes} unique PNGs, ${result.contactSheets} contact sheets, `
      + `${result.reviewedCount} reviewed, ${result.passedCount} passed, final approval ${result.approved ? 'yes' : 'no'}`
    );
  }
  return result;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    console.log(usage());
    return;
  }
  if (!options.mode) throw new Error(`Choose --capture, --review, or --verify.\n\n${usage()}`);
  if (options.mode === 'capture') await runCapture(options);
  else if (options.mode === 'review') await runReview(options);
  else await verifyEvidence(options.outputDir, options.requireReviewed, options.requirePassed);
}

await main();
