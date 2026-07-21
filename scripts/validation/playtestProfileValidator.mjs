import { readdir, readFile } from 'node:fs/promises';
import { basename, join } from 'node:path';

import {
  DRONE_NAME_MAX,
  DRONE_REGISTRATION_FLAGS,
  normalizeDroneName
} from '../../src/companions/CompanionSystem.js';
import { resolvePlaytestSeed } from '../../src/core/PlaytestProfile.js';
import {
  BUILD_PROFILE_IDS,
  PRIMARY_ATTRIBUTE_IDS,
  dataRoot,
  errors,
  relative,
  seenItemIds,
  seenQuestIds,
  seenTechniqueIds
} from './validationContext.mjs';

const LEVEL_PATH_PATTERN = /^\.\/data\/levels\/[a-z0-9_-]+\.json$/;
const ID_PATTERN = /^[a-z0-9][a-z0-9-]*$/;

function asArray(value) {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value : [value];
}

function addStrings(target, values) {
  for (const value of asArray(values)) {
    if (typeof value === 'string' && value) target.add(value);
  }
}

function collectConditionFlags(conditions, target) {
  if (!conditions || typeof conditions !== 'object' || Array.isArray(conditions)) return;
  addStrings(target, conditions.flag);
  addStrings(target, conditions.flags);
  addStrings(target, conditions.notFlag);
  addStrings(target, conditions.flagsAbsent);
  addStrings(target, conditions.flagsAtLeast?.of);
}

function collectAuthoredFlags(value, target) {
  if (!value || typeof value !== 'object') return;
  if (Array.isArray(value)) {
    for (const entry of value) collectAuthoredFlags(entry, target);
    return;
  }
  collectConditionFlags(value.conditions, target);
  addStrings(target, value.setFlag);
  addStrings(target, value.clearFlag);
  addStrings(target, value.visibleWhenFlags);
  addStrings(target, value.hiddenWhenFlags);
  addStrings(target, value.disabledWhenFlags);
  addStrings(target, value.closedWhenFlags);
  for (const entry of Object.values(value)) collectAuthoredFlags(entry, target);
}

function collectProducedFlags(value, target) {
  if (!value || typeof value !== 'object') return;
  if (Array.isArray(value)) {
    for (const entry of value) collectProducedFlags(entry, target);
    return;
  }
  addStrings(target, value.setFlag);
  addStrings(target, value.clearFlag);
  for (const entry of Object.values(value)) collectProducedFlags(entry, target);
}

async function json(filePath) {
  return JSON.parse(await readFile(filePath, 'utf8'));
}

async function jsonFiles(directory) {
  return (await readdir(directory, { withFileTypes: true }))
    .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
    .map((entry) => join(directory, entry.name));
}

function rawSeedEntries(profile) {
  return [
    ['defaults', profile.defaults ?? {}],
    ...Object.entries(profile.checkpoints ?? {}).map(([id, entry]) => [`checkpoints.${id}`, entry]),
    ...Object.entries(profile.levels ?? {}).map(([id, entry]) => [`levels.${id}`, entry])
  ];
}

function validateRawSeed(profileName, label, seed, companions) {
  if (!seed || typeof seed !== 'object' || Array.isArray(seed)) {
    errors.push(`${profileName}: ${label} must be an object.`);
    return;
  }
  for (const field of ['flags', 'clearFlags', 'requiredLevelPaths']) {
    if (seed[field] !== undefined && !Array.isArray(seed[field])) {
      errors.push(`${profileName}: ${label}.${field} must be an array.`);
    }
  }
  for (const flag of [...asArray(seed.flags), ...asArray(seed.clearFlags)]) {
    if (typeof flag !== 'string' || !ID_PATTERN.test(flag)) {
      errors.push(`${profileName}: ${label} has invalid flag ${JSON.stringify(flag)}.`);
    }
  }
  if (seed.progression?.build !== undefined && !BUILD_PROFILE_IDS.has(seed.progression.build)) {
    errors.push(`${profileName}: ${label}.progression.build is unknown: ${seed.progression.build}.`);
  }
  if (seed.progression?.techniques !== undefined && seed.progression.techniques !== 'all') {
    if (!Array.isArray(seed.progression.techniques)) {
      errors.push(`${profileName}: ${label}.progression.techniques must be "all" or an array.`);
    } else {
      for (const techniqueId of seed.progression.techniques) {
        if (!seenTechniqueIds.has(techniqueId)) {
          errors.push(`${profileName}: ${label} references unknown technique "${techniqueId}".`);
        }
      }
    }
  }
  for (const [primaryId, rating] of Object.entries(seed.progression?.primaries ?? {})) {
    if (!PRIMARY_ATTRIBUTE_IDS.has(primaryId) || !Number.isInteger(rating) || rating < 0 || rating > 10) {
      errors.push(`${profileName}: ${label}.progression.primaries.${primaryId} must be an integer from 0 to 10.`);
    }
  }
  for (const entry of seed.inventory?.items ?? []) {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry) || !seenItemIds.has(entry.item)) {
      errors.push(`${profileName}: ${label} references unknown playtest inventory item "${entry?.item ?? ''}".`);
      continue;
    }
    if (!Number.isInteger(entry.count) || entry.count < 0) {
      errors.push(`${profileName}: ${label} inventory count for "${entry.item}" must be a zero or greater integer.`);
    }
  }
  validateCompanionRun(profileName, label, seed.companionRun, companions);
}

function validateCompanionRun(profileName, label, run, companions) {
  if (run === undefined) return;
  const field = `${label}.companionRun`;
  if (!run || typeof run !== 'object' || Array.isArray(run)) {
    errors.push(`${profileName}: ${field} must be an object.`);
    return;
  }
  const definition = companions.get(run.definitionId);
  if (!definition) errors.push(`${profileName}: ${field}.definitionId is unknown: ${run.definitionId ?? ''}.`);
  if (run.recruited !== undefined && typeof run.recruited !== 'boolean') {
    errors.push(`${profileName}: ${field}.recruited must be a boolean.`);
  }
  if (run.recruited && !normalizeDroneName(run.name).valid) {
    errors.push(`${profileName}: ${field}.name must contain 1 to ${DRONE_NAME_MAX} supported characters.`);
  }
  if (run.hp !== undefined && run.hp !== null && (!Number.isInteger(run.hp) || run.hp < 0)) {
    errors.push(`${profileName}: ${field}.hp must be null or a zero or greater integer.`);
  }
  if (run.disabled !== undefined && typeof run.disabled !== 'boolean') {
    errors.push(`${profileName}: ${field}.disabled must be a boolean.`);
  }
  for (const numberField of ['upgradePoints', 'rewardedLevel']) {
    if (run[numberField] !== undefined && (!Number.isInteger(run[numberField]) || run[numberField] < 0)) {
      errors.push(`${profileName}: ${field}.${numberField} must be a zero or greater integer.`);
    }
  }
  const nodeIds = new Set((definition?.branches ?? []).flatMap((branch) =>
    (branch.nodes ?? []).map((node) => node.id)));
  for (const arrayField of ['upgrades', 'upgradeOrder', 'vanishingSpentEncounters']) {
    if (run[arrayField] !== undefined && !Array.isArray(run[arrayField])) {
      errors.push(`${profileName}: ${field}.${arrayField} must be an array.`);
    }
  }
  for (const nodeId of run.upgrades ?? []) {
    if (!nodeIds.has(nodeId)) errors.push(`${profileName}: ${field}.upgrades references unknown node "${nodeId}".`);
  }
  for (const nodeId of run.upgradeOrder ?? []) {
    if (!(run.upgrades ?? []).includes(nodeId)) {
      errors.push(`${profileName}: ${field}.upgradeOrder references uninstalled node "${nodeId}".`);
    }
  }
  if (run.ritual !== undefined && (!run.ritual || typeof run.ritual !== 'object' || Array.isArray(run.ritual))) {
    errors.push(`${profileName}: ${field}.ritual must be an object.`);
    return;
  }
  for (const booleanField of ['opened', 'completed']) {
    if (run.ritual?.[booleanField] !== undefined && typeof run.ritual[booleanField] !== 'boolean') {
      errors.push(`${profileName}: ${field}.ritual.${booleanField} must be a boolean.`);
    }
  }
  if (run.ritual?.failedModels !== undefined && !Array.isArray(run.ritual.failedModels)) {
    errors.push(`${profileName}: ${field}.ritual.failedModels must be an array.`);
  }
}

async function questDefinitions() {
  const definitions = new Map();
  for (const filePath of await jsonFiles(join(dataRoot, 'quests'))) {
    const quest = await json(filePath);
    definitions.set(quest.id, new Set((quest.stages ?? []).map((stage) => stage.id)));
  }
  return definitions;
}

async function companionDefinitions() {
  const definitions = new Map();
  for (const filePath of await jsonFiles(join(dataRoot, 'companions'))) {
    if (basename(filePath) === 'index.json') continue;
    const companion = await json(filePath);
    if (companion?.id) definitions.set(companion.id, companion);
  }
  return definitions;
}

async function authoredFlagSet(levelFiles, dialogueFiles) {
  const flags = new Set();
  for (const filePath of [...levelFiles, ...dialogueFiles]) collectAuthoredFlags(await json(filePath), flags);
  addStrings(flags, DRONE_REGISTRATION_FLAGS);
  return flags;
}

function containsInteractionType(value, type) {
  if (!value || typeof value !== 'object') return false;
  if (Array.isArray(value)) return value.some((entry) => containsInteractionType(entry, type));
  if (value.interact?.type === type) return true;
  return Object.values(value).some((entry) => containsInteractionType(entry, type));
}

async function targetProducedState(levelPath) {
  const level = await json(levelPath);
  const flags = new Set();
  collectProducedFlags(level, flags);
  for (const dialogueId of level.dialogue ?? []) {
    const filePath = join(dataRoot, 'dialogue', `${dialogueId}.json`);
    collectProducedFlags(await json(filePath), flags);
  }
  const recruitsCompanion = containsInteractionType(level, 'drone-shrine');
  if (recruitsCompanion) addStrings(flags, DRONE_REGISTRATION_FLAGS);
  return { flags, recruitsCompanion };
}

function validateResolvedSeed(profileName, levelFile, seed, authoredFlags, producedState, quests, levelNames) {
  for (const flag of seed.flags ?? []) {
    if (!authoredFlags.has(flag)) {
      errors.push(`${profileName}: ${levelFile} seeds unknown flag "${flag}".`);
    }
    if (producedState.flags.has(flag)) {
      errors.push(`${profileName}: ${levelFile} pre-completes target-owned flag "${flag}".`);
    }
  }
  if (producedState.recruitsCompanion && seed.companionRun?.recruited) {
    errors.push(`${profileName}: ${levelFile} pre-completes its target-owned companion recruitment.`);
  }
  for (const [questId, stageId] of Object.entries(seed.questStages ?? {})) {
    if (!quests.get(questId)?.has(stageId)) {
      errors.push(`${profileName}: ${levelFile} seeds unknown quest stage "${questId}:${stageId}".`);
    }
  }
  for (const [questId, stages] of Object.entries(seed.questReached ?? {})) {
    for (const stageId of stages) {
      if (!quests.get(questId)?.has(stageId)) {
        errors.push(`${profileName}: ${levelFile} seeds unknown reached stage "${questId}:${stageId}".`);
      }
    }
  }
  for (const levelPath of seed.requiredLevelPaths ?? []) {
    const fileName = basename(levelPath);
    if (!LEVEL_PATH_PATTERN.test(levelPath) || !levelNames.has(fileName)) {
      errors.push(`${profileName}: ${levelFile} references unknown required level path "${levelPath}".`);
    }
  }
}

export async function validatePlaytestProfiles() {
  const playtestDirectory = join(dataRoot, 'playtests');
  const profileFiles = await jsonFiles(playtestDirectory);
  const levelFiles = await jsonFiles(join(dataRoot, 'levels'));
  const dialogueFiles = await jsonFiles(join(dataRoot, 'dialogue'));
  const levelNames = new Set(levelFiles.map((filePath) => basename(filePath)));
  const authoredFlags = await authoredFlagSet(levelFiles, dialogueFiles);
  const quests = await questDefinitions();
  const companions = await companionDefinitions();

  for (const profilePath of profileFiles) {
    const profileName = relative(profilePath);
    const profile = await json(profilePath);
    if (!ID_PATTERN.test(profile.id ?? '') || basename(profilePath) !== `${profile.id}.json`) {
      errors.push(`${profileName}: id must match its lowercase kebab-case file name.`);
    }
    if (profile.version !== 1) errors.push(`${profileName}: version must be 1.`);
    if (!profile.checkpoints || typeof profile.checkpoints !== 'object' || Array.isArray(profile.checkpoints)) {
      errors.push(`${profileName}: checkpoints must be an object.`);
    }
    if (!profile.levels || typeof profile.levels !== 'object' || Array.isArray(profile.levels)) {
      errors.push(`${profileName}: levels must be an object.`);
      continue;
    }

    for (const [label, seed] of rawSeedEntries(profile)) validateRawSeed(profileName, label, seed, companions);
    for (const [checkpointId, checkpoint] of Object.entries(profile.checkpoints ?? {})) {
      if (!ID_PATTERN.test(checkpointId)) errors.push(`${profileName}: invalid checkpoint id "${checkpointId}".`);
      if (checkpoint.extends !== undefined && !profile.checkpoints?.[checkpoint.extends]) {
        errors.push(`${profileName}: checkpoint "${checkpointId}" extends unknown checkpoint "${checkpoint.extends}".`);
      }
    }
    for (const levelFile of Object.keys(profile.levels)) {
      if (!levelNames.has(levelFile)) errors.push(`${profileName}: levels contains unknown file "${levelFile}".`);
    }
    if (profile.id === 'fresh') {
      for (const levelFile of levelNames) {
        if (!profile.levels[levelFile]) errors.push(`${profileName}: fresh profile does not cover ${levelFile}.`);
      }
    }

    for (const [levelFile, entry] of Object.entries(profile.levels)) {
      if (!levelNames.has(levelFile)) continue;
      if (entry.checkpoint !== undefined && !profile.checkpoints?.[entry.checkpoint]) {
        errors.push(`${profileName}: ${levelFile} uses unknown checkpoint "${entry.checkpoint}".`);
        continue;
      }
      try {
        const seed = resolvePlaytestSeed(profile, `./data/levels/${levelFile}`);
        const producedState = await targetProducedState(join(dataRoot, 'levels', levelFile));
        validateResolvedSeed(profileName, levelFile, seed, authoredFlags, producedState, quests, levelNames);
      } catch (error) {
        errors.push(`${profileName}: ${levelFile} could not resolve: ${error.message}`);
      }
    }
  }
}
