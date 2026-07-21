import {
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
  seenTechniqueIds
} from './validation/validationContext.mjs';
import { validateDialogue, validateQuest } from './validation/dialogueValidator.mjs';
import { validateItem, validateWeaponCatalog } from './validation/itemValidator.mjs';
import { validateLevel, validateMap } from './validation/levelValidator.mjs';
import { validateActor, validateEnemy } from './validation/renderCatalogValidator.mjs';
import { validateTechnique } from './validation/techniqueValidator.mjs';
import { validateVerticalSliceContent, validateVerticalSliceLevel } from './validation/verticalSliceValidator.mjs';
import { validateCompanion, validateCompanionCatalog } from './validation/companionValidator.mjs';
import { validatePlaytestProfiles } from './validation/playtestProfileValidator.mjs';
import {
  registerDialogueRouteContent,
  registerLevelRouteContent,
  validateLevelRouteDestinations
} from './validation/levelRouteValidator.mjs';

async function main() {
  await checkRenderConfig();

  const jsonFiles = await findJsonFiles(dataRoot);

  for (const filePath of jsonFiles) {
    const data = await readJson(filePath);
    if (!data) continue;

    if (matchDir(filePath, 'maps')) validateMap(filePath, data);
    if (matchDir(filePath, 'levels')) {
      validateLevel(filePath, data);
      validateVerticalSliceLevel(filePath, data);
      registerLevelRouteContent(filePath, data);
    }
    if (matchDir(filePath, 'actors')) validateActor(filePath, data);
    if (matchDir(filePath, 'enemies')) validateEnemy(filePath, data);
    if (matchDir(filePath, 'items')) validateItem(filePath, data);
    if (matchDir(filePath, 'quests')) validateQuest(filePath, data);
    if (matchDir(filePath, 'dialogue')) {
      validateDialogue(filePath, data);
      registerDialogueRouteContent(filePath, data);
    }
    if (matchDir(filePath, 'techniques')) validateTechnique(filePath, data);
    if (matchDir(filePath, 'companions')) validateCompanion(filePath, data);
  }

  validateVerticalSliceContent();
  validateWeaponCatalog();
  validateCompanionCatalog();
  await validatePlaytestProfiles();
  validateLevelRouteDestinations();
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
