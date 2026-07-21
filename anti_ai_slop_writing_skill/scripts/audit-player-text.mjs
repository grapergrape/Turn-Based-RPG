#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_ROOT = path.resolve(SCRIPT_DIR, '..', '..');
const cliArgs = process.argv.slice(2);
const jsonOutput = cliArgs.includes('--json');
const verbose = cliArgs.includes('--verbose');
const hardOnly = cliArgs.includes('--hard-only');
const rootArgIndex = cliArgs.indexOf('--root');
const limitArgIndex = cliArgs.indexOf('--limit');
const root = rootArgIndex >= 0
  ? path.resolve(cliArgs[rootArgIndex + 1] ?? '')
  : DEFAULT_ROOT;
const reportLimit = limitArgIndex >= 0
  ? Math.max(1, Number.parseInt(cliArgs[limitArgIndex + 1], 10) || 12)
  : 12;

const PLAYER_KEYS = Object.freeze({
  dialogue: new Set([
    'title', 'lines', 'label', 'log', 'failLog', 'failureLog', 'page', 'pages',
    'lastPrompt', 'nextPrompt', 'skipPrompt'
  ]),
  levels: new Set([
    'name', 'title', 'intro', 'briefing', 'combatIntro', 'lines', 'label',
    'useLabel', 'log', 'successLog', 'failLog', 'failureLog', 'victoryLog',
    'text', 'facts', 'ambient', 'combatStartBarks'
  ]),
  actors: new Set(['name', 'title', 'role', 'summary', 'background']),
  enemies: new Set(['name', 'description', 'aggro', 'inspect']),
  items: new Set(['name', 'description', 'effect']),
  quests: new Set(['title', 'task', 'description', 'text']),
  companions: new Set(['name', 'description', 'effect']),
  techniques: new Set(['name', 'summary']),
  maps: new Set(['name', 'title', 'description', 'text', 'label'])
});

const LABEL_KEYS = new Set(['label', 'useLabel']);
const PROSE_KEYS = new Set([
  'lines', 'log', 'failLog', 'failureLog', 'successLog', 'victoryLog', 'text',
  'intro', 'briefing', 'combatIntro', 'description', 'summary', 'background',
  'ambient', 'combatStartBarks', 'aggro', 'inspect', 'facts', 'page', 'pages'
]);
const GROUPED_TEXT_KEYS = new Set([
  'lines', 'intro', 'briefing', 'combatIntro', 'page', 'pages', 'facts'
]);
const INTENTIONAL_UI_LABELS = new Set([
  'back', 'cancel', 'close', 'continue', 'done', 'leave', 'return', 'stay outside',
  'stay inside'
]);
const SUSPECT_PATTERNS = Object.freeze([
  ['stock opener', /\b(?:it(?:'|’)s worth noting|it(?:'|’)s important to remember|at the end of the day|needless to say|rest assured)\b/i],
  ['essay transition', /(?:^|[.!?]\s+)(?:certainly|moreover|additionally|furthermore|in conclusion|ultimately|that said),/i],
  ['marketing phrase', /\b(?:not just\b[^.!?]{0,80}\bbut\b|whether you(?:'|’)re\b[^.!?]{0,80}\bor\b)/i],
  ['suspect vocabulary', /\b(?:delve|tapestry|testament|vibrant|pivotal|intricate|myriad|realm|foster|leverage|robust|seamless|nuanced|multifaceted|underscore|bustling|ever-evolving|fast-paced|game-changer)\b/i],
  ['stock image', /\b(?:whisper of|dance of|symphony of|beacon of|treasure trove)\b/i],
  ['explanatory tail', /\b(?:that|this) is (?:what|why|where|how|the (?:part|reason|thing))\b/i]
]);

function listJsonFiles(directory) {
  if (!fs.existsSync(directory)) return [];
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...listJsonFiles(entryPath));
    else if (entry.isFile() && entry.name.endsWith('.json')) files.push(entryPath);
  }
  return files.sort();
}

function normalizeText(value) {
  return value
    .replace(/[“”]/g, '"')
    .replace(/’/g, "'")
    .replace(/^\s*"|"\s*$/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function wordCount(value) {
  return (value.match(/[A-Za-z0-9]+(?:['’][A-Za-z0-9]+)*/g) ?? []).length;
}

function sentences(value) {
  return (value.replace(/[“”"]/g, '').match(/[^.!?]+[.!?]+|[^.!?]+$/g) ?? [])
    .map((sentence) => sentence.trim())
    .filter((sentence) => wordCount(sentence) > 0);
}

function findClippedRun(value) {
  const units = sentences(value);
  if (units.length < 3) return null;
  const counts = units.map(wordCount);
  for (let start = 0; start <= counts.length - 3; start += 1) {
    const three = counts.slice(start, start + 3);
    const average = three.reduce((sum, count) => sum + count, 0) / three.length;
    if (three.every((count) => count <= 7) && average <= 5.5) {
      return { start, counts: three };
    }
  }
  for (let start = 0; start <= counts.length - 4; start += 1) {
    const four = counts.slice(start, start + 4);
    const average = four.reduce((sum, count) => sum + count, 0) / four.length;
    if (four.every((count) => count <= 9) && average <= 6.5) {
      return { start, counts: four };
    }
  }
  return null;
}

function hasOrnamentalTriple(value) {
  const normalized = value.replace(/[“”"]/g, '');
  return /\b[^,.;:!?]{2,45},\s+[^,.;:!?]{2,45},\s+(?:and|or)\s+[^,.;:!?]{2,45}[.!?]/i.test(normalized)
    || /(?:^|[.!?]\s+)([A-Za-z']+)\b[^.!?]{2,55}[.!?]\s+\1\b[^.!?]{2,55}[.!?]\s+\1\b/i.test(normalized);
}

function collectStrings(
  value,
  section,
  file,
  jsonPath = '$',
  inheritedKey = '$',
  output = [],
  groupOutput = []
) {
  if (typeof value === 'string') {
    if (PLAYER_KEYS[section]?.has(inheritedKey)) {
      output.push({
        file: path.relative(root, file),
        path: jsonPath,
        key: inheritedKey,
        text: value
      });
    }
    return output;
  }
  if (Array.isArray(value)) {
    if (
      GROUPED_TEXT_KEYS.has(inheritedKey)
      && value.length >= 2
      && value.every((entry) => typeof entry === 'string')
    ) {
      groupOutput.push({
        file: path.relative(root, file),
        path: `${jsonPath} (combined)`,
        key: inheritedKey,
        text: value.join(' ')
      });
    }
    value.forEach((entry, index) => {
      collectStrings(entry, section, file, `${jsonPath}[${index}]`, inheritedKey, output, groupOutput);
    });
    return output;
  }
  if (value && typeof value === 'object') {
    for (const [key, entry] of Object.entries(value)) {
      collectStrings(entry, section, file, `${jsonPath}.${key}`, key, output, groupOutput);
    }
  }
  return output;
}

function choiceShape(choice, startNode) {
  const route = choice.close
    ? 'close'
    : choice.next === startNode
      ? 'start'
      : choice.next
        ? 'next'
        : 'stay';
  return [
    route,
    choice.conditions ? 'condition' : 'open',
    choice.effects ? 'effect' : 'plain'
  ].join(':');
}

function dialogueFingerprint(dialogue) {
  if (!dialogue?.nodes || typeof dialogue.nodes !== 'object') return null;
  const nodeNames = Object.keys(dialogue.nodes);
  if (nodeNames.length < 2) return null;
  const nodeSet = new Set(nodeNames);
  const hasInternalRoute = nodeNames.some((nodeName) => {
    const choices = Array.isArray(dialogue.nodes[nodeName]?.choices)
      ? dialogue.nodes[nodeName].choices
      : [];
    return choices.some((choice) => choice.next && nodeSet.has(choice.next));
  });
  if (!hasInternalRoute) return null;
  const startNode = nodeNames.includes('start') ? 'start' : nodeNames[0];
  return nodeNames.map((nodeName) => {
    const node = dialogue.nodes[nodeName] ?? {};
    const lineCount = Array.isArray(node.lines) ? node.lines.length : node.lines ? 1 : 0;
    const choices = Array.isArray(node.choices) ? node.choices : [];
    return `L${lineCount}C${choices.length}[${choices.map((choice) => choiceShape(choice, startNode)).join(',')}]`;
  }).join('|');
}

function addGroup(map, key, entry) {
  if (!map.has(key)) map.set(key, []);
  map.get(key).push(entry);
}

function uniqueFiles(entries) {
  return new Set(entries.map((entry) => entry.file)).size;
}

function excerpt(value, length = 150) {
  const compact = value.replace(/\s+/g, ' ').trim();
  return compact.length > length ? `${compact.slice(0, length - 1)}…` : compact;
}

const dataRoot = path.join(root, 'data');
if (!fs.existsSync(dataRoot)) {
  console.error(`No data directory found under ${root}`);
  process.exit(2);
}

const strings = [];
const proseGroups = [];
const dialogues = [];
let filesParsed = 0;

for (const [section] of Object.entries(PLAYER_KEYS)) {
  const sectionRoot = path.join(dataRoot, section);
  for (const file of listJsonFiles(sectionRoot)) {
    let data;
    try {
      data = JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch (error) {
      console.error(`${path.relative(root, file)}: ${error.message}`);
      process.exit(2);
    }
    filesParsed += 1;
    collectStrings(data, section, file, '$', '$', strings, proseGroups);
    if (section === 'dialogue') {
      const fingerprint = dialogueFingerprint(data);
      if (fingerprint) {
        dialogues.push({
          file: path.relative(root, file),
          id: data.id ?? path.basename(file, '.json'),
          fingerprint
        });
      }
    }
  }
}

const indexPath = path.join(root, 'index.html');
if (fs.existsSync(indexPath)) {
  const indexHtml = fs.readFileSync(indexPath, 'utf8');
  const titleMatch = indexHtml.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (titleMatch) {
    strings.push({
      file: 'index.html',
      path: '<title>',
      key: 'title',
      text: titleMatch[1].replace(/\s+/g, ' ').trim()
    });
  }
  for (const match of indexHtml.matchAll(/\b(aria-label|placeholder|alt|title)=(['"])(.*?)\2/gi)) {
    strings.push({
      file: 'index.html',
      path: `@${match[1].toLowerCase()}`,
      key: 'label',
      text: match[3]
    });
  }
}

const hardFailures = [];
const styleWarnings = [];
const clippedLadders = [];
const crossLineLadders = [];
const ornamentalTriples = [];
const repeatedProse = new Map();
const repeatedLabels = new Map();
const topologyGroups = new Map();

for (const entry of strings) {
  if (entry.text.includes('—')) {
    hardFailures.push({ ...entry, rule: 'em dash' });
  }
  if (entry.text.includes('--')) {
    hardFailures.push({ ...entry, rule: 'doubled hyphen' });
  }

  for (const [rule, pattern] of SUSPECT_PATTERNS) {
    if (pattern.test(entry.text)) styleWarnings.push({ ...entry, rule });
  }

  if (PROSE_KEYS.has(entry.key)) {
    const normalized = normalizeText(entry.text);
    if (wordCount(normalized) >= 6 && normalized.length >= 32) {
      addGroup(repeatedProse, normalized, entry);
    }
    const clippedRun = findClippedRun(entry.text);
    if (clippedRun) clippedLadders.push({ ...entry, ...clippedRun });
    if (hasOrnamentalTriple(entry.text)) ornamentalTriples.push(entry);
  }

  if (LABEL_KEYS.has(entry.key)) {
    const normalized = normalizeText(entry.text);
    if (!INTENTIONAL_UI_LABELS.has(normalized)) addGroup(repeatedLabels, normalized, entry);
  }
}

for (const entry of proseGroups) {
  const clippedRun = findClippedRun(entry.text);
  const basePath = entry.path.replace(/ \(combined\)$/, '');
  const alreadyFlagged = clippedLadders.some((candidate) =>
    candidate.file === entry.file && candidate.path.startsWith(`${basePath}[`));
  if (clippedRun && !alreadyFlagged) crossLineLadders.push({ ...entry, ...clippedRun });
}

for (const dialogue of dialogues) addGroup(topologyGroups, dialogue.fingerprint, dialogue);

const proseCollisions = [...repeatedProse.entries()]
  .filter(([, entries]) => uniqueFiles(entries) >= 2)
  .sort((a, b) => uniqueFiles(b[1]) - uniqueFiles(a[1]) || a[0].localeCompare(b[0]));
const labelCollisions = [...repeatedLabels.entries()]
  .filter(([, entries]) => uniqueFiles(entries) >= 4)
  .sort((a, b) => uniqueFiles(b[1]) - uniqueFiles(a[1]) || a[0].localeCompare(b[0]));
const topologyCollisions = [...topologyGroups.entries()]
  .filter(([, entries]) => entries.length >= 5)
  .sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]));

const report = {
  root,
  filesParsed,
  playerStrings: strings.length,
  hardFailures,
  review: {
    styleWarnings,
    clippedLadders,
    crossLineLadders,
    ornamentalTriples,
    repeatedProse: proseCollisions.map(([text, entries]) => ({ text, entries })),
    repeatedLabels: labelCollisions.map(([text, entries]) => ({ text, entries })),
    topologyGroups: topologyCollisions.map(([fingerprint, entries]) => ({ fingerprint, entries }))
  }
};

if (jsonOutput) {
  console.log(JSON.stringify(report, null, 2));
} else {
  console.log(`Player text audit: ${filesParsed} JSON files, ${strings.length} player-facing strings across data and index.html.`);
  console.log(`Hard failures: ${hardFailures.length}`);
  if (!hardOnly) {
    console.log(`Review leads: ${styleWarnings.length} suspect phrases, ${clippedLadders.length} clipped strings, ${crossLineLadders.length} cross-line ladders, ${ornamentalTriples.length} possible ornamental triples.`);
    console.log(`Corpus collisions: ${proseCollisions.length} repeated prose groups, ${labelCollisions.length} repeated label groups, ${topologyCollisions.length} common multi-node dialogue topologies.`);
  }

  const printEntries = (heading, entries, formatter) => {
    if (entries.length === 0) return;
    console.log(`\n${heading}`);
    entries.slice(0, verbose ? entries.length : reportLimit).forEach((entry, index) => {
      console.log(`${index + 1}. ${formatter(entry)}`);
    });
    if (!verbose && entries.length > reportLimit) {
      console.log(`   ${entries.length - reportLimit} more. Re-run with --verbose or --json.`);
    }
  };

  printEntries('Hard failures', hardFailures, (entry) =>
    `${entry.rule}: ${entry.file} ${entry.path}\n   ${excerpt(entry.text)}`);
  if (!hardOnly) {
    printEntries('Suspect phrases', styleWarnings, (entry) =>
      `${entry.rule}: ${entry.file} ${entry.path}\n   ${excerpt(entry.text)}`);
    printEntries('Clipped-string leads', clippedLadders, (entry) =>
      `${entry.file} ${entry.path} [${entry.counts.join(', ')} words]\n   ${excerpt(entry.text)}`);
    printEntries('Cross-line ladder leads', crossLineLadders, (entry) =>
      `${entry.file} ${entry.path} [${entry.counts.join(', ')} words]\n   ${excerpt(entry.text)}`);
    printEntries('Possible ornamental triples', ornamentalTriples, (entry) =>
      `${entry.file} ${entry.path}\n   ${excerpt(entry.text)}`);
    printEntries('Repeated prose', proseCollisions, ([text, entries]) =>
      `${uniqueFiles(entries)} files: ${excerpt(text)}\n   ${[...new Set(entries.map((entry) => entry.file))].slice(0, 5).join(', ')}`);
    printEntries('Repeated authored labels', labelCollisions, ([text, entries]) =>
      `${uniqueFiles(entries)} files: ${text}\n   ${[...new Set(entries.map((entry) => entry.file))].slice(0, 5).join(', ')}`);
    printEntries('Common multi-node dialogue topologies', topologyCollisions, ([fingerprint, entries]) =>
      `${entries.length} dialogues: ${fingerprint}\n   ${entries.slice(0, 5).map((entry) => entry.id).join(', ')}`);
  }
}

if (hardFailures.length > 0) process.exitCode = 1;
