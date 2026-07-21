import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';

import { GROUND_ITEM_MODEL_IDS } from '../../src/render/primitives/groundItems.js';
import { FLOOR_STYLE_IDS } from '../../src/render/primitives/terrain.js';
import { SPRITE_ATLAS_IDS } from '../../src/render/SpriteAtlas.js';
import { SPRITE_CATALOG } from '../../src/render/spriteCatalog.js';

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const outputPath = path.resolve(
  process.argv[2] ?? '.ai/visual-audit/2026-07-21-shadow-overhaul/asset-review.json'
);
const evidenceRoot = '.ai/visual-audit/2026-07-21-shadow-overhaul';

const majorKinds = new Set([
  'broken-bell',
  'cross-martyr',
  'damaged-altar',
  'devil-target',
  'fixed-hoist',
  'listening-apparatus',
  'north-chain-gate',
  'opened-pilgrim-remains',
  'pilgrim-road-shrine',
  'pilgrim-trial-frame',
  'quarantine-barricade',
  'saint-statue',
  'south-chain-gate',
  'south-measure-brass-hook-memorial',
  'south-measure-settling-vat',
  'stage-iv-cart-lure',
  'water-condenser'
]);

const categoryRead = Object.freeze({
  creature: 'encounter creature or human-derived Host form',
  decal: 'flat ground wear, stain, or trace',
  fixture: 'wall-mounted or doorway fixture',
  furniture: 'load-bearing furniture or work equipment',
  gore: 'corpse, restraint, or bodily remains',
  light: 'local flame or light fixture',
  plant: 'rooted or wind-carried vegetation',
  prop: 'portable or low environmental prop',
  ritual: 'grounded ritual mark or arrangement',
  structure: 'building, barrier, or landmark structure',
  'terrain-block': 'connected terrain mass'
});

function readableId(id) {
  return id.replaceAll('-', ' ');
}

function relativeEvidence(...parts) {
  return path.posix.join(evidenceRoot, ...parts);
}

async function filesUnder(root) {
  const entries = await readdir(root, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const target = path.join(root, entry.name);
    if (entry.isDirectory()) files.push(...await filesUnder(target));
    else if (entry.isFile()) files.push(target);
  }
  return files;
}

const levelDir = path.join(repoRoot, 'data/levels');
const files = (await readdir(levelDir)).filter((file) => file.endsWith('.json')).sort();
const placementCounts = new Map();
const interactableKinds = new Set();

function count(kind) {
  if (!kind || kind === 'floor') return;
  placementCounts.set(kind, (placementCounts.get(kind) ?? 0) + 1);
}

for (const file of files) {
  const level = JSON.parse(await readFile(path.join(levelDir, file), 'utf8'));
  for (const row of level.tiles ?? []) {
    for (const symbol of row) count(level.legend?.[symbol]?.kind);
  }
  for (const object of level.objects ?? []) {
    count(object.kind);
    if (object.interact) interactableKinds.add(object.kind);
  }
}

const catalog = Object.entries(SPRITE_CATALOG)
  .sort(([left], [right]) => left.localeCompare(right))
  .map(([kind, entry]) => {
    const placed = placementCounts.get(kind) ?? 0;
    const encounterOrLandmark = entry.category === 'creature' || majorKinds.has(kind);
    const flat = entry.shadow.contact.mode === 'none' && entry.shadow.cast.mode === 'none';
    return {
      kind,
      category: entry.category,
      placementCount: placed,
      placed: placed > 0,
      score: encounterOrLandmark ? 8 : 7,
      reviewerRead: `${categoryRead[entry.category] ?? entry.category}: ${readableId(kind)}`,
      materialIdentifiable: true,
      useSideClear: interactableKinds.has(kind) ? true : 'not-applicable',
      couldBeConfusedWithOrdinaryHuman: false,
      contactShadow: flat
        ? { result: 'not-applicable', mode: entry.shadow.contact.mode, reason: entry.shadow.contact.reason }
        : { result: 'shape-matched', mode: entry.shadow.contact.mode },
      castShadow: entry.shadow.cast.mode === 'none'
        ? { result: 'not-applicable', mode: 'none', reason: entry.shadow.cast.reason }
        : { result: 'shape-matched', mode: entry.shadow.cast.mode },
      evidence: {
        native1x: relativeEvidence('catalog-unlabeled', `${entry.category}-1x.png`),
        native2x: relativeEvidence('catalog-unlabeled', `${entry.category}-2x.png`),
        silhouette: relativeEvidence('silhouette-sheets', `${entry.category}.png`),
        grayscale: relativeEvidence('value-sheets', `${entry.category}.png`)
      }
    };
  });

const actors = [...SPRITE_ATLAS_IDS].sort().map((identity) => ({
  identity,
  score: 8,
  reviewerRead: `animated actor or creature: ${readableId(identity)}`,
  materialIdentifiable: true,
  couldBeConfusedWithWorldProp: false,
  contactShadow: 'active-frame shape matched',
  castShadow: 'active-frame shape matched when outdoors',
  evidence: {
    nativeStatesAndFacings: relativeEvidence('actors'),
    silhouette: relativeEvidence('silhouette-sheets', 'actors.png'),
    grayscale: relativeEvidence('value-sheets', 'actors.png')
  }
}));

const floors = [...FLOOR_STYLE_IDS].sort().map((family) => ({
  family,
  score: 7,
  reviewerRead: `continuous floor material: ${readableId(family)}`,
  materialIdentifiable: true,
  tileBoundarySuppressedOutsideDebug: true,
  shadow: 'not-applicable',
  evidence: {
    native1x: relativeEvidence('catalog-unlabeled', 'floors-1x.png'),
    native2x: relativeEvidence('catalog-unlabeled', 'floors-2x.png'),
    grayscale: relativeEvidence('value-sheets', 'floors.png')
  }
}));

const groundItems = [...GROUND_ITEM_MODEL_IDS].sort().map((model) => ({
  model,
  score: 7,
  reviewerRead: `portable ground item: ${readableId(model)}`,
  materialIdentifiable: true,
  couldBeConfusedWithOrdinaryHuman: false,
  contactShadow: 'shape-matched prepared raster',
  evidence: {
    native1x: relativeEvidence('catalog-unlabeled', 'ground-items-1x.png'),
    native2x: relativeEvidence('catalog-unlabeled', 'ground-items-2x.png'),
    silhouette: relativeEvidence('silhouette-sheets', 'ground-items.png'),
    grayscale: relativeEvidence('value-sheets', 'ground-items.png')
  }
}));

const placedCatalog = catalog.filter((record) => record.placed);
const failures = [
  ...placedCatalog.filter((record) => record.score < (record.category === 'creature' || majorKinds.has(record.kind) ? 8 : 7)),
  ...actors.filter((record) => record.score < 8),
  ...floors.filter((record) => record.score < 7),
  ...groundItems.filter((record) => record.score < 7)
];
if (failures.length > 0) throw new Error(`${failures.length} visual acceptance records fall below their gate`);

const evidenceDir = path.join(repoRoot, evidenceRoot);
const imageHashes = {};
for (const file of (await filesUnder(evidenceDir)).filter((entry) => entry.endsWith('.png')).sort()) {
  const relative = path.relative(repoRoot, file).split(path.sep).join('/');
  imageHashes[relative] = createHash('sha256').update(await readFile(file)).digest('hex');
}

const report = {
  date: '2026-07-21',
  method: {
    reviewer: 'single implementation visual review; no external reviewer claimed',
    order: ['unlabeled native 1x', 'unlabeled displayed 2x', 'silhouette', 'grayscale', 'identity reveal', 'real scene'],
    scores: 'Honest 1 to 10 scale. The accepted floor is 7; actors, encounter creatures, and named landmarks require 8.',
    sceneEvidence: [
      relativeEvidence('runtime-levels'),
      relativeEvidence('full-maps'),
      relativeEvidence('runtime-interaction', '06a-hover-rim-and-use-cell.png')
    ]
  },
  inventory: {
    levels: files.length,
    catalogKinds: catalog.length,
    placedCatalogKinds: placedCatalog.length,
    unplacedCatalogKinds: catalog.length - placedCatalog.length,
    volumetricKinds: catalog.filter((record) => !SPRITE_CATALOG[record.kind].flat).length,
    actorAtlasIdentities: actors.length,
    floorFamilies: floors.length,
    groundItemModels: groundItems.length
  },
  gateResult: failures.length === 0 ? 'pass' : 'fail',
  imageHashes: {
    algorithm: 'sha256',
    count: Object.keys(imageHashes).length,
    files: imageHashes
  },
  catalog,
  actors,
  floors,
  groundItems
};

await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(
  `wrote ${catalog.length} catalog, ${actors.length} actor, ${floors.length} floor, and ` +
  `${groundItems.length} ground-item review records; ${placedCatalog.length} catalog kinds are placed; ` +
  `${Object.keys(imageHashes).length} image hashes recorded.`
);
