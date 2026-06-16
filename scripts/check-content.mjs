import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = process.cwd();
const dataRoot = join(root, 'data');
const errors = [];

async function main() {
  const jsonFiles = await findJsonFiles(dataRoot);

  for (const filePath of jsonFiles) {
    const data = await readJson(filePath);
    if (!data) continue;

    if (filePath.includes('/maps/') || filePath.includes('\\maps\\')) {
      validateMap(filePath, data);
    }

    if (filePath.includes('/actors/') || filePath.includes('\\actors\\')) {
      validateActor(filePath, data);
    }

    if (filePath.includes('/enemies/') || filePath.includes('\\enemies\\')) {
      validateEnemy(filePath, data);
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

function validateMap(filePath, data) {
  const name = relative(filePath);

  requireString(name, data.id, 'id');
  requireString(name, data.name, 'name');
  requireNumber(name, data.width, 'width');
  requireNumber(name, data.height, 'height');
  requireNumber(name, data.tileSize, 'tileSize');

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

  if (!data.spawns?.player) {
    errors.push(`${name}: missing spawns.player.`);
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
