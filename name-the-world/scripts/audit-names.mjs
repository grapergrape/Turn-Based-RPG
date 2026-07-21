#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '..', '..');
const ledgerPath = path.join(repoRoot, 'name-the-world', 'references', 'retcon-ledger.json');
const actorDir = path.join(repoRoot, 'data', 'actors');
const failures = [];

function fail(message) {
  failures.push(message);
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function walkFiles(rootPath, extensions) {
  if (!fs.existsSync(rootPath)) return [];
  const files = [];
  for (const entry of fs.readdirSync(rootPath, { withFileTypes: true })) {
    const filePath = path.join(rootPath, entry.name);
    if (entry.isDirectory()) files.push(...walkFiles(filePath, extensions));
    else if (extensions.has(path.extname(entry.name))) files.push(filePath);
  }
  return files;
}

function relative(filePath) {
  return path.relative(repoRoot, filePath).split(path.sep).join('/');
}

function lineFor(text, index) {
  return text.slice(0, index).split('\n').length;
}

function reportMatch(filePath, text, index, label) {
  fail(`${relative(filePath)}:${lineFor(text, index)} contains ${label}`);
}

const ledger = readJson(ledgerPath);
if (ledger.schemaVersion !== 1) fail('retcon ledger schemaVersion must be 1');
if (!Array.isArray(ledger.entries)) fail('retcon ledger entries must be an array');

const entries = Array.isArray(ledger.entries) ? ledger.entries : [];
const entriesById = new Map();
const displays = new Map();
const allowedKinds = new Set(['actor', 'canon', 'dead', 'enemy', 'mention', 'place']);
const requiredFields = ['id', 'kind', 'oldDisplay', 'display', 'stratum', 'household', 'sourceBasis'];

for (const entry of entries) {
  for (const field of requiredFields) {
    if (typeof entry?.[field] !== 'string' || !entry[field].trim()) {
      fail(`ledger entry ${entry?.id ?? '<missing id>'} has no ${field}`);
    }
  }
  if (!allowedKinds.has(entry.kind)) fail(`ledger entry ${entry.id} has unsupported kind ${entry.kind}`);
  if (entriesById.has(entry.id)) fail(`ledger contains duplicate id ${entry.id}`);
  entriesById.set(entry.id, entry);
  if (!/^[\x20-\x7e]+$/.test(entry.display)) fail(`ledger display ${entry.display} is not printable ASCII`);
  const displayKey = entry.display.toLowerCase();
  if (displays.has(displayKey)) {
    fail(`ledger display ${entry.display} is shared by ${displays.get(displayKey)} and ${entry.id}`);
  } else {
    displays.set(displayKey, entry.id);
  }
}

const protectedAnchor = entriesById.get(ledger.protectedAnchor);
if (!protectedAnchor || protectedAnchor.display !== 'Father Marius Vale') {
  fail('protected canon:first-icon anchor must remain Father Marius Vale');
}

for (const entry of entries) {
  if (entry.id !== ledger.protectedAnchor && /\bVale\b/.test(entry.display)) {
    fail(`ledger entry ${entry.id} reuses protected Vale name`);
  }
}

const actorFiles = walkFiles(actorDir, new Set(['.json']));
const actorIds = new Set();
for (const filePath of actorFiles) {
  const actor = readJson(filePath);
  if (typeof actor.id !== 'string' || !actor.id) {
    fail(`${relative(filePath)} has no stable actor id`);
    continue;
  }
  if (actorIds.has(actor.id)) fail(`actor id ${actor.id} is duplicated`);
  actorIds.add(actor.id);
  const entry = entriesById.get(actor.id);
  if (!entry || entry.kind !== 'actor') {
    fail(`${relative(filePath)} actor ${actor.id} is missing from the retcon ledger`);
    continue;
  }
  if (actor.name !== entry.display) {
    fail(`${relative(filePath)} uses ${JSON.stringify(actor.name)} but ledger records ${JSON.stringify(entry.display)}`);
  }
  if (!/^[\x20-\x7e]+$/.test(String(actor.name ?? ''))) {
    fail(`${relative(filePath)} actor name is not printable ASCII`);
  }
  if (actor.id.startsWith('ash-road-south-')) {
    const currentNameId = `ash-road-south-${entry.display.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`;
    if (actor.id === currentNameId) {
      fail(`${relative(filePath)} derives its stable id from the retconned display name`);
    }
  }
}

for (const entry of entries.filter((candidate) => candidate.kind === 'actor')) {
  if (!actorIds.has(entry.id)) fail(`ledger actor ${entry.id} has no data/actors record`);
}

const scanFiles = [
  ...walkFiles(path.join(repoRoot, 'data'), new Set(['.json'])),
  ...walkFiles(path.join(repoRoot, 'docs'), new Set(['.md'])),
  ...walkFiles(path.join(repoRoot, 'src'), new Set(['.js'])),
  ...walkFiles(path.join(repoRoot, 'scripts'), new Set(['.mjs', '.js', '.html'])),
  ...walkFiles(path.join(repoRoot, 'tests'), new Set(['.mjs', '.js'])),
  ...walkFiles(path.join(repoRoot, 'game_art_skill'), new Set(['.md'])),
  ...walkFiles(path.join(repoRoot, 'character_creature_art_skill'), new Set(['.md'])),
  ...walkFiles(path.join(repoRoot, 'late90s_isometric_crpg_skill'), new Set(['.md'])),
  path.join(repoRoot, 'README.md'),
  path.join(repoRoot, 'AGENTS.md'),
  path.join(repoRoot, 'index.html')
].filter((filePath) => fs.existsSync(filePath));

const ignoredMigrationFiles = new Set([
  'scripts/migrate-character-names.mjs',
  'scripts/cleanup-character-name-references.mjs',
  'scripts/repair-name-cleanup.mjs'
]);
const blockedDefaults = /\b(?:Mara|Voss|Kael|Kaelen|Elara|Elias|Silas|Marcus|Lyra|Vey|Veyl|Veyr|Hale|Thorne|Vance|Blackwood)\b/g;
const retiredStandaloneNames = /\b(?:Brin|Caldra|Caldus|Dain|Feld|Ilyra|Iven|Kess|Odran|Pell|Rhun|Senn|Sol|Tor|Vek|Venn)\b/g;
const oldDisplays = entries
  .filter((entry) => entry.oldDisplay !== entry.display)
  .map((entry) => entry.oldDisplay)
  .sort((left, right) => right.length - left.length);

for (const filePath of new Set(scanFiles)) {
  if (ignoredMigrationFiles.has(relative(filePath))) continue;
  const text = fs.readFileSync(filePath, 'utf8');
  blockedDefaults.lastIndex = 0;
  const blocked = blockedDefaults.exec(text);
  if (blocked) reportMatch(filePath, text, blocked.index, `blocked default ${JSON.stringify(blocked[0])}`);
  retiredStandaloneNames.lastIndex = 0;
  const retiredStandalone = retiredStandaloneNames.exec(text);
  if (retiredStandalone) {
    reportMatch(filePath, text, retiredStandalone.index, `retired standalone name ${JSON.stringify(retiredStandalone[0])}`);
  }
  for (const oldDisplay of oldDisplays) {
    const index = text.indexOf(oldDisplay);
    if (index >= 0) {
      reportMatch(filePath, text, index, `retired display ${JSON.stringify(oldDisplay)}`);
      break;
    }
  }
  const oldGate = text.search(/Veyr(?:'|\u2019)s Gate/);
  if (oldGate >= 0) reportMatch(filePath, text, oldGate, 'retired place name Veyr\'s Gate');
}

const rendererFiles = walkFiles(path.join(repoRoot, 'src', 'render'), new Set(['.js']));
for (const filePath of rendererFiles) {
  const text = fs.readFileSync(filePath, 'utf8');
  const legacySymbol = text.search(/MARA_|deriveMara|bakeMara|maraAppearance/);
  if (legacySymbol >= 0) reportMatch(filePath, text, legacySymbol, 'a character-specific player-rendering symbol');
}

const creationModule = await import(pathToFileURL(path.join(repoRoot, 'src', 'core', 'CharacterCreation.js')).href);
const defaultCreation = creationModule.defaultCharacterCustomization();
if (defaultCreation.name !== '') fail('new-character creation must start with a blank name');
if (creationModule.customizationCanConfirm(defaultCreation)) fail('blank new-character name must not confirm');

if (failures.length) {
  console.error(`Name audit failed with ${failures.length} issue${failures.length === 1 ? '' : 's'}:`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log(`Name audit passed: ${entries.length} ledger entries, ${actorFiles.length} actor records.`);
}
