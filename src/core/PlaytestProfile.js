import { createGameClock } from './GameClock.js';

const PROFILE_ID_PATTERN = /^[a-z0-9][a-z0-9-]*$/;
const LEVEL_FILE_PATTERN = /^[a-z0-9_-]+\.json$/;

function clone(value) {
  return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
}

function asArray(value) {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value : [value];
}

function mergeUnique(base = [], additions = []) {
  return [...new Set([...base, ...additions])];
}

function mergeInventoryItems(base = [], additions = []) {
  const items = new Map();
  for (const entry of base) {
    if (entry?.item) items.set(entry.item, clone(entry));
  }
  for (const entry of additions) {
    if (!entry?.item) continue;
    if (Number(entry.count) <= 0) items.delete(entry.item);
    else items.set(entry.item, clone(entry));
  }
  return [...items.values()];
}

function mergeReached(base = {}, additions = {}) {
  const result = clone(base) ?? {};
  for (const [questId, stages] of Object.entries(additions ?? {})) {
    result[questId] = mergeUnique(result[questId], asArray(stages));
  }
  return result;
}

function mergeProgression(base = {}, additions = {}) {
  if (!additions || typeof additions !== 'object' || Array.isArray(additions)) return clone(base) ?? {};
  const result = { ...(clone(base) ?? {}), ...clone(additions) };
  result.primaries = {
    ...((base && typeof base.primaries === 'object') ? clone(base.primaries) : {}),
    ...((additions && typeof additions.primaries === 'object') ? clone(additions.primaries) : {})
  };
  if (additions.techniques === undefined && base.techniques !== undefined) {
    result.techniques = clone(base.techniques);
  }
  return result;
}

function mergeCompanionRun(base = {}, additions = {}) {
  if (!additions || typeof additions !== 'object' || Array.isArray(additions)) return clone(base) ?? {};
  const result = { ...(clone(base) ?? {}), ...clone(additions) };
  result.upgrades = mergeUnique(base?.upgrades, additions.upgrades);
  result.upgradeOrder = mergeUnique(base?.upgradeOrder, additions.upgradeOrder);
  result.vanishingSpentEncounters = mergeUnique(
    base?.vanishingSpentEncounters,
    additions.vanishingSpentEncounters
  );
  result.ritual = {
    ...((base && typeof base.ritual === 'object') ? clone(base.ritual) : {}),
    ...((additions && typeof additions.ritual === 'object') ? clone(additions.ritual) : {})
  };
  return result;
}

function mergeSeed(base = {}, additions = {}) {
  const result = clone(base) ?? {};
  const removedFlags = new Set(asArray(additions.clearFlags));
  result.flags = mergeUnique(result.flags, asArray(additions.flags))
    .filter((flag) => !removedFlags.has(flag));
  result.requiredLevelPaths = mergeUnique(result.requiredLevelPaths, asArray(additions.requiredLevelPaths));
  result.questStages = { ...(result.questStages ?? {}), ...(clone(additions.questStages) ?? {}) };
  result.questReached = mergeReached(result.questReached, additions.questReached);
  result.progression = mergeProgression(result.progression, additions.progression);
  result.companionRun = mergeCompanionRun(result.companionRun, additions.companionRun);
  result.clock = { ...(result.clock ?? {}), ...(clone(additions.clock) ?? {}) };
  result.inventory = {
    ...(result.inventory ?? {}),
    ...(clone(additions.inventory) ?? {}),
    items: mergeInventoryItems(result.inventory?.items, additions.inventory?.items)
  };
  return result;
}

function resolveCheckpoint(profile, checkpointId, stack = []) {
  const checkpoint = profile.checkpoints?.[checkpointId];
  if (!checkpoint) throw new Error(`Playtest profile "${profile.id}" has no checkpoint "${checkpointId}".`);
  if (stack.includes(checkpointId)) {
    throw new Error(`Playtest profile "${profile.id}" has a checkpoint cycle: ${[...stack, checkpointId].join(' -> ')}.`);
  }
  const parent = checkpoint.extends
    ? resolveCheckpoint(profile, checkpoint.extends, [...stack, checkpointId])
    : {};
  return mergeSeed(parent, checkpoint);
}

export function playtestLevelFile(levelPath) {
  const normalized = String(levelPath ?? '').replaceAll('\\', '/').split(/[?#]/, 1)[0];
  const fileName = normalized.slice(normalized.lastIndexOf('/') + 1);
  return LEVEL_FILE_PATTERN.test(fileName) ? fileName : null;
}

export function resolvePlaytestSeed(profile, levelPath) {
  if (!profile || typeof profile !== 'object' || Array.isArray(profile)) {
    throw new Error('Playtest profile must be an object.');
  }
  if (!PROFILE_ID_PATTERN.test(profile.id ?? '')) {
    throw new Error('Playtest profile id is invalid.');
  }
  const levelFile = playtestLevelFile(levelPath);
  if (!levelFile) throw new Error(`Playtest level path is invalid: ${levelPath}.`);
  const levelEntry = profile.levels?.[levelFile];
  if (!levelEntry) throw new Error(`Playtest profile "${profile.id}" does not cover ${levelFile}.`);

  let seed = mergeSeed({}, profile.defaults);
  if (levelEntry.checkpoint) seed = mergeSeed(seed, resolveCheckpoint(profile, levelEntry.checkpoint));
  seed = mergeSeed(seed, levelEntry);
  delete seed.extends;
  delete seed.checkpoint;
  delete seed.clearFlags;
  seed.profileId = profile.id;
  seed.levelFile = levelFile;
  return seed;
}

export async function loadPlaytestSeed(profileId, { levelPath, fetchImpl = globalThis.fetch } = {}) {
  const normalizedId = String(profileId ?? '').trim().toLowerCase();
  if (!PROFILE_ID_PATTERN.test(normalizedId)) throw new Error(`Invalid playtest profile: ${profileId}.`);
  if (typeof fetchImpl !== 'function') throw new Error('Playtest profile loading requires fetch.');
  const response = await fetchImpl(`./data/playtests/${normalizedId}.json`);
  if (!response?.ok) {
    throw new Error(`Could not load playtest profile "${normalizedId}" (${response?.status ?? 'request failed'}).`);
  }
  const profile = await response.json();
  if (profile.id !== normalizedId) {
    throw new Error(`Playtest profile file "${normalizedId}" declares id "${profile.id ?? ''}".`);
  }
  return resolvePlaytestSeed(profile, levelPath);
}

export function playtestRequiredItemIds(seed) {
  return (seed?.inventory?.items ?? [])
    .filter((entry) => entry?.item && Number(entry.count) > 0)
    .map((entry) => entry.item);
}

export function applyPlaytestProgression(player, progression, techniqueDefs = {}) {
  if (!player || !progression || typeof progression !== 'object' || Array.isArray(progression)) return false;
  const current = clone(player.progression) ?? {};
  const primaries = {
    ...(current.basePrimaries ?? current.primaries ?? {}),
    ...(clone(progression.primaries) ?? {})
  };
  const techniques = progression.techniques === 'all'
    ? Object.keys(techniqueDefs)
    : progression.techniques === undefined
      ? current.techniques
      : clone(progression.techniques);
  player.progression = {
    ...current,
    ...clone(progression),
    basePrimaries: primaries,
    primaries: { ...primaries },
    techniques
  };
  player.refreshProgressionStats?.();
  player.hp = player.maxHp;
  player.ap = player.maxAp;
  return true;
}

export function applyPlaytestInventory(inventory, inventorySeed) {
  if (!inventory || !inventorySeed || typeof inventorySeed !== 'object' || Array.isArray(inventorySeed)) return false;
  if (Number.isFinite(inventorySeed.maxCarryWeight)) {
    inventory.maxCarryWeight = Math.max(0, inventorySeed.maxCarryWeight);
  }
  let changed = false;
  for (const entry of inventorySeed.items ?? []) {
    if (!entry?.item || Number(entry.count) <= 0) continue;
    if (!inventory.itemDefs?.[entry.item]) {
      throw new Error(`Playtest inventory item is not loaded: ${entry.item}.`);
    }
    inventory.add(entry.item, entry.count, {
      condition: entry.condition,
      loaded: entry.loaded,
      ignoreCapacity: true
    });
    changed = true;
  }
  return changed;
}

export function playtestClock(seed) {
  return seed?.clock && Object.keys(seed.clock).length > 0 ? createGameClock(seed.clock) : null;
}
