import {
  errors,
  relative,
  seenDialogueIds,
  seenItemIds,
  seenQuestIds
} from './validationContext.mjs';
import { validateDialogueEffects } from './dialogueValidator.mjs';
import { validateBarkCollection } from './textRules.mjs';

const MAIN_LEVEL_ID = 'ash-chapel-breach';
const CELLAR_LEVEL_ID = 'ash-chapel-cellar';
const REQUIRED_MAIN_ENEMY_IDS = [
  'choir-flesh-eater',
  'choir-candle-bearer',
  'choir-throat-singer',
  'host-touched-penitent'
];
const REQUIRED_INTERACTABLE_KINDS = ['rusted-reliquary', 'field-satchel', 'damaged-altar', 'rusted-barrel'];
const REQUIRED_ITEM_IDS = [
  'ducat',
  'relic-rounds',
  'field-dressing',
  'tarnished-saint-token',
  'road-warden-chit',
  'choir-hymnal-fragment'
];
const REQUIRED_QUEST_IDS = ['investigate-ash-chapel-cult'];
const REQUIRED_DIALOGUE_IDS = [
  'ash-chapel-altar-rite',
  'ash-chapel-barrel-ladder',
  'ash-chapel-cellar-corpse',
  'ash-chapel-cellar-ladder',
  'ash-chapel-cult-ledger'
];

const DECAL_KINDS = new Set([
  'rubble-pile', 'rubble-decal', 'floor-crack', 'blood-stain', 'glass-debris', 'dust', 'road-dust'
]);

export function validateVerticalSliceLevel(filePath, data) {
  const name = relative(filePath);
  if (data.id !== MAIN_LEVEL_ID && data.id !== CELLAR_LEVEL_ID) return;
  for (const id of REQUIRED_QUEST_IDS) {
    if (!Array.isArray(data.quests) || !data.quests.includes(id)) {
      errors.push(`${name}: required quest "${id}" is missing from quests.`);
    }
  }

  const enemies = data.spawns?.enemies ?? [];
  const objects = Array.isArray(data.objects) ? data.objects : [];
  if (data.id === MAIN_LEVEL_ID) validateAshChapelMain(name, data, enemies, objects);
  if (data.id === CELLAR_LEVEL_ID) validateAshChapelCellar(name, data, objects);
}

export function validateVerticalSliceContent() {
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
}

function validateAshChapelMain(name, data, enemies, objects) {
  const enemyIds = enemies.map((spawn) => spawn.id);
  if (enemies.length < 6) {
    errors.push(`${name}: expected at least 6 spread enemies, found ${enemies.length}.`);
  }
  for (const id of REQUIRED_MAIN_ENEMY_IDS) {
    if (!enemyIds.includes(id)) {
      errors.push(`${name}: required enemy "${id}" is missing from spawns.`);
    }
  }

  const encounterIds = new Set(enemies.map((spawn) => spawn.encounter).filter(Boolean));
  if (encounterIds.size < 3) {
    errors.push(`${name}: expected at least 3 enemy encounter groups, found ${encounterIds.size}.`);
  }
  for (const spawn of enemies) {
    if (!spawn.encounter) {
      errors.push(`${name}: enemy "${spawn.id}" must define an encounter id.`);
    }
  }

  if (!Array.isArray(data.combatTriggers) || data.combatTriggers.length < 3) {
    errors.push(`${name}: combatTriggers must define at least 3 spread trigger zones.`);
  } else {
    for (const trigger of data.combatTriggers) {
      if (!trigger.encounter) errors.push(`${name}: combat trigger at (${trigger.x}, ${trigger.y}) must define encounter.`);
      if (!Array.isArray(trigger.intro) || trigger.intro.length === 0) {
        errors.push(`${name}: combat trigger "${trigger.id ?? trigger.encounter}" must define intro lines.`);
      }
      validateBarkCollection(name, trigger.combatStartBarks, `combatTriggers.${trigger.id ?? trigger.encounter ?? 'unknown'}.combatStartBarks`);
    }
  }

  const requiredMainDialogue = [
    'ash-chapel-altar-rite',
    'ash-chapel-barrel-ladder',
    'ash-chapel-cult-ledger'
  ];
  for (const id of requiredMainDialogue) {
    if (!Array.isArray(data.dialogue) || !data.dialogue.includes(id)) {
      errors.push(`${name}: required main dialogue "${id}" is missing from dialogue.`);
    }
  }

  const kinds = objects.map((object) => object.kind);
  for (const kind of REQUIRED_INTERACTABLE_KINDS) {
    if (!kinds.includes(kind)) {
      errors.push(`${name}: required interactable "${kind}" is missing.`);
    }
  }
  for (const object of objects) {
    if (object.kind !== 'rusted-barrel' && REQUIRED_INTERACTABLE_KINDS.includes(object.kind) && !object.interact) {
      errors.push(`${name}: "${object.kind}" must define an interact descriptor.`);
    }
  }

  const pews = kinds.filter((kind) => kind === 'broken-pew').length;
  if (pews < 10) {
    errors.push(`${name}: expected at least 10 broken pews, found ${pews}.`);
  }

  const decals = kinds.filter((kind) => DECAL_KINDS.has(kind)).length;
  if (decals < 12) {
    errors.push(`${name}: expected at least 12 rubble/decal objects, found ${decals}.`);
  }

  const hasCampfire = objects.some((object) => object.kind === 'campfire');
  if (!hasCampfire) {
    errors.push(`${name}: expected a campfire prop for the cultist camp.`);
  }

  const hasAmbient = enemies.some((spawn) => Array.isArray(spawn.ambient) && spawn.ambient.length > 0);
  if (!hasAmbient) {
    errors.push(`${name}: expected at least one enemy spawn with ambient lines.`);
  }

  const hasSecretEntrance = objects.some((object) =>
    object.kind === 'rusted-barrel' && object.interact?.type === 'secret-entrance' && object.interact?.dialogue
  );
  if (!hasSecretEntrance) {
    errors.push(`${name}: expected a rusted-barrel secret entrance with dialogue.`);
  }

  const hasCultLedger = objects.some((object) =>
    object.kind === 'paper-scraps' && object.name === 'Cult Ledger' && object.interact?.dialogue === 'ash-chapel-cult-ledger'
  );
  if (!hasCultLedger) {
    errors.push(`${name}: expected a Cult Ledger paper-scraps object with dialogue.`);
  }

  if (!Array.isArray(data.combatIntro) || data.combatIntro.length === 0) {
    errors.push(`${name}: combatIntro must contain at least one fallback line.`);
  }
  if (!data.onVictory?.questUpdate) {
    errors.push(`${name}: onVictory.questUpdate is required for this slice.`);
  }
  validateDialogueEffects(name, data.onVictory, 'onVictory');
}

function validateAshChapelCellar(name, data, objects) {
  const requiredCellarDialogue = [
    'ash-chapel-cellar-corpse',
    'ash-chapel-cellar-ladder'
  ];
  for (const id of requiredCellarDialogue) {
    if (!Array.isArray(data.dialogue) || !data.dialogue.includes(id)) {
      errors.push(`${name}: required cellar dialogue "${id}" is missing from dialogue.`);
    }
  }

  const hasSecretExit = objects.some((object) =>
    object.kind === 'rusted-barrel' && object.interact?.type === 'secret-exit' && object.interact?.dialogue
  );
  if (!hasSecretExit) {
    errors.push(`${name}: expected a secret-exit ladder with dialogue.`);
  }

  const hasSecretCorpseLoot = objects.some((object) =>
    object.kind === 'corpse' && object.name === 'Dead Road Warden' && Array.isArray(object.interact?.loot)
  );
  if (!hasSecretCorpseLoot) {
    errors.push(`${name}: expected the secret area Dead Road Warden corpse to contain loot.`);
  }

  const lootEntries = objects.flatMap((object) => object.interact?.loot ?? []);
  if (lootEntries.length < 6) {
    errors.push(`${name}: expected richer secret-area loot, found ${lootEntries.length} loot entries.`);
  }
}
