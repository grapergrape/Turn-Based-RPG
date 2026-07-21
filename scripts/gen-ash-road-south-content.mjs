import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  ASH_ROAD_SOUTH_CAST,
  ASH_ROAD_SOUTH_DIALOGUE_IDS,
  actorDataForAshRoadSouth
} from './content/ash-road-south-cast.mjs';
import {
  SOUTH_MEASURE_ITEMS,
  SOUTH_MEASURE_QUESTS
} from './content/south-measure-state.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

async function writeJson(path, value) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

for (const dialogueId of ASH_ROAD_SOUTH_DIALOGUE_IDS) {
  const path = join(root, 'data', 'dialogue', `${dialogueId}.json`);
  const dialogue = JSON.parse(await readFile(path, 'utf8'));
  if (dialogue.id !== dialogueId) {
    throw new Error(`${path} must contain dialogue id ${dialogueId}.`);
  }
}

for (const person of ASH_ROAD_SOUTH_CAST) {
  await writeJson(join(root, 'data', 'actors', `${person.id}.json`), actorDataForAshRoadSouth(person));
}

for (const quest of SOUTH_MEASURE_QUESTS) {
  await writeJson(join(root, 'data', 'quests', `${quest.id}.json`), quest);
}

for (const item of SOUTH_MEASURE_ITEMS) {
  await writeJson(join(root, 'data', 'items', `${item.id}.json`), item);
}

console.log(`Generated ${ASH_ROAD_SOUTH_CAST.length} actors, ${SOUTH_MEASURE_QUESTS.length} quests, and ${SOUTH_MEASURE_ITEMS.length} quest items. Validated ${ASH_ROAD_SOUTH_DIALOGUE_IDS.length} dialogue files.`);
