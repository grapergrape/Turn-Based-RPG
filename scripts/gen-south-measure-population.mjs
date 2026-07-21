import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  SOUTH_MEASURE_NEW_CAST,
  actorDataForSouthMeasure
} from './content/south-measure-population.mjs';
import {
  SOUTH_MEASURE_CHARACTER_DIALOGUE_IDS,
  SOUTH_MEASURE_POPULATION_DIALOGUES
} from './content/south-measure-dialogues.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

async function writeJson(relativePath, value) {
  const path = resolve(ROOT, relativePath);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function assertPlayerText(value, path = 'root') {
  if (typeof value === 'string') {
    if (value.includes('—') || value.includes('--')) throw new Error(`${path}: banned dash in player-facing copy`);
    return;
  }
  if (Array.isArray(value)) value.forEach((entry, index) => assertPlayerText(entry, `${path}[${index}]`));
  else if (value && typeof value === 'object') {
    Object.entries(value).forEach(([key, entry]) => assertPlayerText(entry, `${path}.${key}`));
  }
}

for (const person of SOUTH_MEASURE_NEW_CAST) {
  const actor = actorDataForSouthMeasure(person);
  assertPlayerText(actor, actor.id);
  await writeJson(`data/actors/${actor.id}.json`, actor);
}

const intakeClerk = {
  id: 'south-measure-intake-clerk',
  name: 'Junia Lector, the Intake Clerk',
  type: 'enemy',
  faction: 'the-host',
  spriteId: 'south-measure-intake-clerk',
  description: 'A Bloom-era admission clerk fixed through her own wicket. One shoulder still wears a clerk coat. Fused hands hold a stamp of wrist bone while uneven rib mouths repeat household denials.',
  stats: { hp: 18, maxHp: 18, actionPoints: 6, moveCost: 2 },
  progression: {
    level: 1,
    build: 'host-threat',
    complexity: 'boss',
    xpReward: 30,
    primaries: { body: 3, agility: 1, eye: 3, intelligence: 4, religion: 4, voice: 4, nerve: 4 }
  },
  attacks: [
    {
      id: 'denial-stamp',
      name: 'Denial Stamp',
      apCost: 3,
      damage: 2,
      range: 4,
      accuracyField: 'doctrine',
      damageField: 'hostSigns'
    },
    {
      id: 'wicket-drag',
      name: 'Wicket Drag',
      apCost: 3,
      damage: 3,
      range: 1,
      accuracyField: 'unarmed',
      damageField: 'unarmed'
    }
  ],
  loot: [],
  tags: ['host', 'vale-imprint', 'human', 'fixed', 'intake-clerk']
};

const falseCatechist = {
  id: 'south-measure-false-catechist',
  name: 'Salome Naso, the False Catechist',
  type: 'enemy',
  faction: 'the-host',
  spriteId: 'south-measure-false-catechist',
  description: 'Salome remains lucid and human-sized. A narrow mouth has opened along her sternum beneath the teacher’s wrap, with small teeth, one lifted rib edge, and a second voice repeating confessions from inside her chest.',
  aggro: [
    'Do not make the children watch this lesson.',
    'You wanted the honest voice. Hear it.'
  ],
  stats: { hp: 12, maxHp: 12, actionPoints: 6, moveCost: 1 },
  progression: {
    level: 1,
    build: 'host-threat',
    complexity: 'elite',
    xpReward: 24,
    primaries: { body: 3, agility: 3, eye: 3, intelligence: 4, religion: 4, voice: 4, nerve: 3 }
  },
  attacks: [
    {
      id: 'catechist-grip',
      name: 'Catechist Grip',
      apCost: 3,
      damage: 2,
      range: 1,
      accuracyField: 'unarmed',
      damageField: 'unarmed'
    }
  ],
  loot: [],
  tags: ['host', 'vale-imprint', 'human', 'choir', 'false-catechist', 'early-stage-three']
};

for (const enemy of [intakeClerk, falseCatechist]) {
  assertPlayerText(enemy, enemy.id);
  await writeJson(`data/enemies/${enemy.id}.json`, enemy);
}

for (const dialogue of SOUTH_MEASURE_POPULATION_DIALOGUES) {
  assertPlayerText(dialogue, dialogue.id);
  await writeJson(`data/dialogue/${dialogue.id}.json`, dialogue);
}

console.log(
  `Generated ${SOUTH_MEASURE_NEW_CAST.length} interior actors, 2 Host records, ` +
  `${SOUTH_MEASURE_CHARACTER_DIALOGUE_IDS.length} character conversations, and ` +
  `${SOUTH_MEASURE_POPULATION_DIALOGUES.length - SOUTH_MEASURE_CHARACTER_DIALOGUE_IDS.length} evidence conversations.`
);
