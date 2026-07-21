export const SAVE_MAGIC = 'vale-imprint-save';
export const SAVE_FORMAT_VERSION = 1;
export const SAVE_SLOT_IDS = Object.freeze([
  'manual',
  'autosave-1',
  'autosave-2',
  'autosave-3'
]);

export const SAVE_SLOT_SET = new Set(SAVE_SLOT_IDS);

const LEVEL_PATH_PATTERN = /^\.\/data\/levels\/[a-z0-9_-]+(?:\/[a-z0-9_-]+)*\.json$/;
const CONTENT_ID_PATTERN = /^[a-z0-9][a-z0-9_-]*$/;
const FACING_SET = new Set(['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw']);
const MAX_LEVEL_RECORDS = 256;
const MAX_LIST_ENTRIES = 4096;
const MIGRATIONS = new Map();

export class SaveValidationError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'SaveValidationError';
    this.code = code;
  }
}

export function isSafeLevelPath(path) {
  return typeof path === 'string' && LEVEL_PATH_PATTERN.test(path);
}

export function registerSaveMigration(fromVersion, migrate) {
  if (!Number.isInteger(fromVersion) || fromVersion < 1 || typeof migrate !== 'function') {
    throw new TypeError('Save migrations require a positive source version and a function.');
  }
  MIGRATIONS.set(fromVersion, migrate);
}

export function clearSaveMigrationsForTests() {
  MIGRATIONS.clear();
}

export function validateSaveEnvelopeShape(envelope) {
  if (!isRecord(envelope)) throw invalid('malformed', 'Save record is not an object.');
  if (envelope.magic !== SAVE_MAGIC) throw invalid('wrong-game', 'Save record belongs to another game.');
  if (!Number.isInteger(envelope.formatVersion) || envelope.formatVersion < 1) {
    throw invalid('malformed', 'Save format version is missing.');
  }
  if (typeof envelope.gameVersion !== 'string' || envelope.gameVersion.trim() === '') {
    throw invalid('malformed', 'Game version is missing.');
  }
  if (envelope.gameVersion.length > 128) throw invalid('malformed', 'Game version is invalid.');
  if (typeof envelope.runId !== 'string' || envelope.runId.trim() === '') {
    throw invalid('malformed', 'Run identifier is missing.');
  }
  if (!SAVE_SLOT_SET.has(envelope.slot)) throw invalid('malformed', 'Save slot is invalid.');
  if (!isIsoDate(envelope.createdAt) || !isIsoDate(envelope.savedAt)) {
    throw invalid('malformed', 'Save timestamps are invalid.');
  }
  validateSummary(envelope.summary);
  if (!isRecord(envelope.payload)) throw invalid('malformed', 'Save payload is missing.');
  if (typeof envelope.checksum !== 'string' || !/^[a-f0-9]{64}$/.test(envelope.checksum)) {
    throw invalid('malformed', 'Save checksum is invalid.');
  }
  return envelope;
}

export function validateRunSnapshot(snapshot) {
  if (!isRecord(snapshot)) throw invalid('malformed', 'Run snapshot is missing.');
  if (!boundedString(snapshot.runId, 128) || !isIsoDate(snapshot.createdAt)) {
    throw invalid('malformed', 'Run identity is invalid.');
  }
  if (!isSafeLevelPath(snapshot.levelPath)) {
    throw invalid('unsafe-level', 'Saved level path is not allowed.');
  }
  if (!boundedString(snapshot.levelName, 256)) throw invalid('malformed', 'Saved level name is invalid.');
  if (!isFiniteNonNegative(snapshot.playtimeSeconds)) throw invalid('malformed', 'Saved playtime is invalid.');
  if (!isRecord(snapshot.player) || !boundedString(snapshot.player.name, 128)) {
    throw invalid('malformed', 'Saved player state is missing.');
  }
  validatePoint(snapshot.player.position, 'player position');
  if (!FACING_SET.has(snapshot.player.facing) || !isFiniteNonNegative(snapshot.player.hp) || !isFinitePositive(snapshot.player.maxHp)) {
    throw invalid('malformed', 'Saved player vitals are invalid.');
  }
  if (!['explore', 'victory'].includes(snapshot.mode)) throw invalid('malformed', 'Saved run mode is invalid.');
  validateInventory(snapshot.inventory);
  validateContentIds(snapshot.requiredItemIds, 'required item identifiers');
  if (!Array.isArray(snapshot.contentLevelPaths) || snapshot.contentLevelPaths.length > MAX_LEVEL_RECORDS
    || !snapshot.contentLevelPaths.every(isSafeLevelPath)) {
    throw invalid('unsafe-level', 'Saved content level references are invalid.');
  }
  if (!snapshot.contentLevelPaths.includes(snapshot.levelPath)) {
    throw invalid('malformed', 'Current level is missing from saved content references.');
  }
  if (!boundedStringList(snapshot.flags)) {
    throw invalid('malformed', 'Saved flags are invalid.');
  }
  if (!Array.isArray(snapshot.questStages) || snapshot.questStages.length > MAX_LIST_ENTRIES
    || !snapshot.questStages.every(isContentIdPair)) {
    throw invalid('malformed', 'Saved quest stages are invalid.');
  }
  if (!Array.isArray(snapshot.questReached) || snapshot.questReached.length > MAX_LIST_ENTRIES
    || !snapshot.questReached.every(isQuestReachedEntry)) {
    throw invalid('malformed', 'Saved quest history is invalid.');
  }
  if (!boundedStringList(snapshot.awardedQuestXp)) {
    throw invalid('malformed', 'Saved quest rewards are invalid.');
  }
  if (!Array.isArray(snapshot.levels) || snapshot.levels.length === 0 || snapshot.levels.length > MAX_LEVEL_RECORDS) {
    throw invalid('malformed', 'Saved level states are invalid.');
  }
  const seenPaths = new Set();
  for (const entry of snapshot.levels) {
    if (!isRecord(entry) || !isSafeLevelPath(entry.path) || !isRecord(entry.state)) {
      throw invalid('malformed', 'A saved level state is invalid.');
    }
    if (seenPaths.has(entry.path)) throw invalid('malformed', 'A saved level state is duplicated.');
    seenPaths.add(entry.path);
    validateLevelState(entry.state);
  }
  if (!seenPaths.has(snapshot.levelPath)) throw invalid('malformed', 'Current level state is missing.');
  if (!isRecord(snapshot.clock) || !isFinitePositive(snapshot.clock.fieldDay)
    || !Number.isFinite(snapshot.clock.minuteOfDay)) {
    throw invalid('malformed', 'Saved field clock is invalid.');
  }
  return snapshot;
}

export function migrateSaveEnvelope(envelope, targetVersion = SAVE_FORMAT_VERSION) {
  validateSaveEnvelopeShape(envelope);
  if (envelope.formatVersion > targetVersion) {
    throw invalid('future-version', 'Save was written by a newer save format.');
  }

  let current = envelope;
  while (current.formatVersion < targetVersion) {
    const migration = MIGRATIONS.get(current.formatVersion);
    if (!migration) {
      throw invalid('migration-missing', `No migration exists for save format ${current.formatVersion}.`);
    }
    const migrated = migration(structuredCloneSafe(current));
    if (!isRecord(migrated) || migrated.formatVersion !== current.formatVersion + 1) {
      throw invalid('migration-failed', `Migration from save format ${current.formatVersion} failed.`);
    }
    current = migrated;
  }
  validateSaveEnvelopeShape(current);
  validateRunSnapshot(current.payload);
  return current;
}

export function saveErrorStatus(error) {
  const code = error?.code ?? 'unreadable';
  if (code === 'future-version' || code === 'migration-missing' || code === 'unsafe-level') {
    return 'incompatible';
  }
  return 'corrupt';
}

function validatePoint(point, label) {
  if (!isRecord(point) || !Number.isInteger(point.x) || !Number.isInteger(point.y)) {
    throw invalid('malformed', `Saved ${label} is invalid.`);
  }
}

function validateSummary(summary) {
  if (!isRecord(summary) || !boundedString(summary.playerName, 128)
    || !isFinitePositive(summary.playerLevel) || !boundedString(summary.levelName, 256)
    || !isSafeLevelPath(summary.levelPath) || !isFinitePositive(summary.fieldDay)
    || !Number.isFinite(summary.minuteOfDay) || !isFiniteNonNegative(summary.playtimeSeconds)) {
    throw invalid('malformed', 'Save summary is invalid.');
  }
}

function validateInventory(inventory) {
  if (!isRecord(inventory) || !Array.isArray(inventory.counts) || !Array.isArray(inventory.instances)
    || inventory.counts.length > MAX_LIST_ENTRIES || inventory.instances.length > MAX_LIST_ENTRIES
    || !isRecord(inventory.equipment)) {
    throw invalid('malformed', 'Saved inventory is missing.');
  }
  for (const entry of inventory.counts) {
    if (!isRecord(entry) || !isContentId(entry.item) || !Number.isInteger(entry.count) || entry.count < 0) {
      throw invalid('malformed', 'Saved inventory stack is invalid.');
    }
  }
  for (const entry of inventory.instances) {
    if (!isRecord(entry) || !isContentId(entry.itemId) || !boundedString(entry.entryKey, 192)) {
      throw invalid('malformed', 'Saved inventory instance is invalid.');
    }
    if (!isFiniteNonNegative(entry.condition) || (entry.loaded != null && !isFiniteNonNegative(entry.loaded))) {
      throw invalid('malformed', 'Saved inventory condition is invalid.');
    }
  }
  if (!Object.values(inventory.equipment).every((value) => boundedString(value, 192))) {
    throw invalid('malformed', 'Saved equipment is invalid.');
  }
}

function validateLevelState(state) {
  for (const key of [
    'consumedObjects', 'killedObjects', 'unlockedObjects', 'openedObjects', 'lootedObjects',
    'revealedObjects', 'deadEnemies', 'lootedEnemies', 'clearedEncounters', 'appliedLevelEvents',
    'seenCombatTriggers', 'exploredMapTiles'
  ]) {
    if (!boundedStringList(state[key])) throw invalid('malformed', `Saved level ${key} is invalid.`);
  }
  for (const key of ['searchedObjects', 'actorStates', 'tradeStockByActor']) {
    if (!Array.isArray(state[key]) || state[key].length > MAX_LIST_ENTRIES
      || !state[key].every((entry) => Array.isArray(entry) && entry.length === 2 && boundedString(entry[0], 256))) {
      throw invalid('malformed', `Saved level ${key} is invalid.`);
    }
  }
  if (!Array.isArray(state.groundItems) || state.groundItems.length > MAX_LIST_ENTRIES) {
    throw invalid('malformed', 'Saved ground items are invalid.');
  }
  for (const item of state.groundItems) {
    if (!isRecord(item) || !isContentId(item.itemId) || !Number.isFinite(item.x) || !Number.isFinite(item.y)) {
      throw invalid('malformed', 'A saved ground item is invalid.');
    }
  }
}

function isRecord(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isContentId(value) {
  return typeof value === 'string' && value.length <= 128 && CONTENT_ID_PATTERN.test(value);
}

function isContentIdPair(value) {
  return Array.isArray(value) && value.length === 2 && value.every(isContentId);
}

function isQuestReachedEntry(value) {
  return Array.isArray(value) && value.length === 2 && isContentId(value[0])
    && Array.isArray(value[1]) && value[1].length <= MAX_LIST_ENTRIES && value[1].every(isContentId);
}

function validateContentIds(value, label) {
  if (!Array.isArray(value) || value.length > MAX_LIST_ENTRIES || !value.every(isContentId)) {
    throw invalid('malformed', `Saved ${label} are invalid.`);
  }
}

function boundedStringList(value) {
  return Array.isArray(value) && value.length <= MAX_LIST_ENTRIES
    && value.every((entry) => boundedString(entry, 256));
}

function boundedString(value, maxLength) {
  return typeof value === 'string' && value.trim() !== '' && value.length <= maxLength;
}

function isFiniteNonNegative(value) {
  return Number.isFinite(value) && value >= 0;
}

function isFinitePositive(value) {
  return Number.isFinite(value) && value > 0;
}

function isIsoDate(value) {
  return typeof value === 'string' && Number.isFinite(Date.parse(value));
}

function invalid(code, message) {
  return new SaveValidationError(code, message);
}

function structuredCloneSafe(value) {
  if (typeof structuredClone === 'function') return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}
