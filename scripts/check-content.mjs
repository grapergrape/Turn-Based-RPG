import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const dataRoot = join(root, 'data');
const errors = [];

// Content this slice (Ash Chapel Breach) must contain.
const REQUIRED_ENEMY_IDS = ['red-tithe-cutthroat', 'host-touched-penitent'];
const REQUIRED_INTERACTABLE_KINDS = ['rusted-reliquary', 'field-satchel', 'damaged-altar'];
const REQUIRED_ITEM_IDS = ['relic-rounds', 'field-dressing', 'tarnished-saint-token'];
const DECAL_KINDS = new Set([
  'rubble-pile', 'rubble-decal', 'floor-crack', 'blood-stain', 'glass-debris', 'dust', 'road-dust'
]);

const seenItemIds = new Set();

async function main() {
  await checkRenderConfig();

  const jsonFiles = await findJsonFiles(dataRoot);

  for (const filePath of jsonFiles) {
    const data = await readJson(filePath);
    if (!data) continue;

    if (matchDir(filePath, 'maps')) validateMap(filePath, data);
    if (matchDir(filePath, 'levels')) validateLevel(filePath, data);
    if (matchDir(filePath, 'actors')) validateActor(filePath, data);
    if (matchDir(filePath, 'enemies')) validateEnemy(filePath, data);
    if (matchDir(filePath, 'items')) validateItem(filePath, data);
  }

  for (const id of REQUIRED_ITEM_IDS) {
    if (!seenItemIds.has(id)) {
      errors.push(`data/items: required item "${id}" is missing.`);
    }
  }

  if (errors.length > 0) {
    console.error('\nContent check failed:');
    for (const error of errors) {
      console.error(`- ${error}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log(`Content check passed. Parsed ${jsonFiles.length} JSON file(s).`);
}

function matchDir(filePath, dir) {
  return filePath.includes(`/${dir}/`) || filePath.includes(`\\${dir}\\`);
}

// Assert the renderer is configured for the fixed low-resolution presentation.
async function checkRenderConfig() {
  const configUrl = pathToFileURL(join(root, 'src', 'render', 'renderConfig.js'));
  try {
    const { RENDER_CONFIG } = await import(configUrl.href);
    const expect = (key, value) => {
      if (RENDER_CONFIG[key] !== value) {
        errors.push(`renderConfig: ${key} must be ${JSON.stringify(value)} (got ${JSON.stringify(RENDER_CONFIG[key])}).`);
      }
    };
    expect('INTERNAL_WIDTH', 640);
    expect('INTERNAL_HEIGHT', 480);
    expect('VIEWPORT_HEIGHT', 384);
    expect('TILE_WIDTH', 64);
    expect('TILE_HEIGHT', 32);
    expect('WALL_HEIGHT', 64);
    expect('DEBUG_GRID_DEFAULT', false);
  } catch (error) {
    errors.push(`renderConfig could not be loaded: ${error.message}`);
  }
}

async function findJsonFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const results = [];

  for (const entry of entries) {
    const fullPath = join(directory, entry.name);

    if (entry.isDirectory()) {
      results.push(...await findJsonFiles(fullPath));
      continue;
    }

    if (entry.isFile() && entry.name.endsWith('.json')) {
      results.push(fullPath);
    }
  }

  return results;
}

async function readJson(filePath) {
  try {
    const text = await readFile(filePath, 'utf8');
    return JSON.parse(text);
  } catch (error) {
    errors.push(`${relative(filePath)} is invalid JSON: ${error.message}`);
    return null;
  }
}

// Shared tile-grid validation for maps and levels.
function validateTiles(name, data) {
  if (!Array.isArray(data.tiles)) {
    errors.push(`${name}: tiles must be an array of strings.`);
    return;
  }

  if (data.tiles.length !== data.height) {
    errors.push(`${name}: tiles length ${data.tiles.length} does not match height ${data.height}.`);
  }

  for (let y = 0; y < data.tiles.length; y += 1) {
    const row = data.tiles[y];

    if (typeof row !== 'string') {
      errors.push(`${name}: tile row ${y} must be a string.`);
      continue;
    }

    if (row.length !== data.width) {
      errors.push(`${name}: tile row ${y} length ${row.length} does not match width ${data.width}.`);
    }

    for (const tileChar of row) {
      if (!data.legend || !Object.hasOwn(data.legend, tileChar)) {
        errors.push(`${name}: tile character "${tileChar}" is missing from legend.`);
      }
    }
  }
}

function inBounds(data, point) {
  return point && point.x >= 0 && point.y >= 0 && point.x < data.width && point.y < data.height;
}

function validateMap(filePath, data) {
  const name = relative(filePath);
  requireString(name, data.id, 'id');
  requireString(name, data.name, 'name');
  requireNumber(name, data.width, 'width');
  requireNumber(name, data.height, 'height');
  requireNumber(name, data.tileSize, 'tileSize');
  validateTiles(name, data);

  if (!data.spawns?.player) {
    errors.push(`${name}: missing spawns.player.`);
  }
}

function validateLevel(filePath, data) {
  const name = relative(filePath);
  requireString(name, data.id, 'id');
  requireString(name, data.name, 'name');
  requireString(name, data.intro, 'intro');
  requireNumber(name, data.width, 'width');
  requireNumber(name, data.height, 'height');
  requireNumber(name, data.tileSize, 'tileSize');
  validateTiles(name, data);

  const player = data.spawns?.player;
  if (!player) {
    errors.push(`${name}: missing spawns.player.`);
  } else if (!inBounds(data, player)) {
    errors.push(`${name}: player start (${player.x}, ${player.y}) is out of bounds.`);
  }

  const enemies = data.spawns?.enemies ?? [];
  if (enemies.length !== 2) {
    errors.push(`${name}: expected exactly 2 enemies, found ${enemies.length}.`);
  }
  for (const point of enemies) {
    if (!inBounds(data, point)) {
      errors.push(`${name}: enemy spawn (${point.x}, ${point.y}) is out of bounds.`);
    }
  }
  const enemyIds = enemies.map((spawn) => spawn.id);
  for (const id of REQUIRED_ENEMY_IDS) {
    if (!enemyIds.includes(id)) {
      errors.push(`${name}: required enemy "${id}" is missing from spawns.`);
    }
  }

  const objects = Array.isArray(data.objects) ? data.objects : [];
  const kinds = objects.map((object) => object.kind);
  for (const kind of REQUIRED_INTERACTABLE_KINDS) {
    if (!kinds.includes(kind)) {
      errors.push(`${name}: required interactable "${kind}" is missing.`);
    }
  }

  const pews = kinds.filter((kind) => kind === 'broken-pew').length;
  if (pews < 6) {
    errors.push(`${name}: expected at least 6 broken pews, found ${pews}.`);
  }

  const decals = kinds.filter((kind) => DECAL_KINDS.has(kind)).length;
  if (decals < 8) {
    errors.push(`${name}: expected at least 8 rubble/decal objects, found ${decals}.`);
  }

  // The three required interactables must carry an interact descriptor.
  for (const object of objects) {
    if (REQUIRED_INTERACTABLE_KINDS.includes(object.kind) && !object.interact) {
      errors.push(`${name}: "${object.kind}" must define an interact descriptor.`);
    }
  }
}

function validateActor(filePath, data) {
  const name = relative(filePath);
  requireString(name, data.id, 'id');
  requireString(name, data.name, 'name');
  requireString(name, data.type, 'type');
  validateStats(name, data.stats);
}

function validateEnemy(filePath, data) {
  const name = relative(filePath);
  requireString(name, data.id, 'id');
  requireString(name, data.name, 'name');
  requireString(name, data.type, 'type');
  requireString(name, data.faction, 'faction');
  validateStats(name, data.stats);

  if (data.faction === 'the-host') {
    const tags = Array.isArray(data.tags) ? data.tags : [];
    if (!tags.includes('host') || !tags.includes('vale-imprint')) {
      errors.push(`${name}: Host enemies must include tags "host" and "vale-imprint".`);
    }
  }
}

function validateItem(filePath, data) {
  const name = relative(filePath);
  requireString(name, data.id, 'id');
  requireString(name, data.name, 'name');
  requireString(name, data.type, 'type');
  if (typeof data.id === 'string') seenItemIds.add(data.id);
}

function validateStats(name, stats) {
  if (!stats || typeof stats !== 'object') {
    errors.push(`${name}: missing stats object.`);
    return;
  }

  requireNumber(name, stats.hp, 'stats.hp');
  requireNumber(name, stats.maxHp, 'stats.maxHp');
}

function requireString(fileName, value, fieldName) {
  if (typeof value !== 'string' || value.trim() === '') {
    errors.push(`${fileName}: ${fieldName} must be a non-empty string.`);
  }
}

function requireNumber(fileName, value, fieldName) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    errors.push(`${fileName}: ${fieldName} must be a number.`);
  }
}

function relative(filePath) {
  return filePath.replace(`${root}/`, '').replace(`${root}\\`, '');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
