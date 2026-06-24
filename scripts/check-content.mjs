import {
  REQUIRED_DIALOGUE_IDS,
  REQUIRED_ITEM_IDS,
  REQUIRED_QUEST_IDS,
  checkRenderConfig,
  dataRoot,
  errors,
  findJsonFiles,
  matchDir,
  readJson,
  referencedActorIds,
  referencedDialogueIds,
  referencedItemIds,
  referencedTechniqueIds,
  seenActorIds,
  seenDialogueIds,
  seenItemIds,
  seenQuestIds,
  seenTechniqueIds
} from './validation/validationContext.mjs';
import { validateDialogue, validateQuest } from './validation/dialogueValidator.mjs';
import { validateItem } from './validation/itemValidator.mjs';
import { validateLevel, validateMap } from './validation/levelValidator.mjs';
import { validateActor, validateEnemy } from './validation/renderCatalogValidator.mjs';
import { validateTechnique } from './validation/techniqueValidator.mjs';

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
    if (matchDir(filePath, 'quests')) validateQuest(filePath, data);
    if (matchDir(filePath, 'dialogue')) validateDialogue(filePath, data);
    if (matchDir(filePath, 'techniques')) validateTechnique(filePath, data);
  }

  for (const id of REQUIRED_ITEM_IDS) {
    if (!seenItemIds.has(id)) {
      errors.push(`data/items: required item "${id}" is missing.`);
    }
  }
  for (const id of REQUIRED_QUEST_IDS) {
    if (!seenQuestIds.has(id)) {
      errors.push(`data/quests: required quest "${id}" is missing.`);
    }
  }
  for (const id of REQUIRED_DIALOGUE_IDS) {
    if (!seenDialogueIds.has(id)) {
      errors.push(`data/dialogue: required dialogue "${id}" is missing.`);
    }
  }
  for (const id of referencedItemIds) {
    if (!seenItemIds.has(id)) {
      errors.push(`data/items: referenced item "${id}" is missing.`);
    }
  }
  for (const id of referencedActorIds) {
    if (!seenActorIds.has(id)) {
      errors.push(`data/actors: referenced actor "${id}" is missing.`);
    }
  }
  for (const id of referencedDialogueIds) {
    if (!seenDialogueIds.has(id)) {
      errors.push(`data/dialogue: referenced dialogue "${id}" is missing.`);
    }
  }
  for (const id of referencedTechniqueIds) {
    if (!seenTechniqueIds.has(id)) {
      errors.push(`data/techniques: referenced technique "${id}" is missing.`);
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

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
