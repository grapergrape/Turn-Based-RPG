import {
  SAVE_FORMAT_VERSION,
  SAVE_MAGIC,
  migrateSaveEnvelope,
  validateRunSnapshot,
  validateSaveEnvelopeShape
} from './SaveSchema.js';

const MAX_IMPORTED_JSON_LENGTH = 8 * 1024 * 1024;

export async function createSaveEnvelope({
  snapshot,
  gameVersion,
  slot,
  now = new Date(),
  createdAt = null
}) {
  validateRunSnapshot(snapshot);
  if (typeof gameVersion !== 'string' || gameVersion.trim() === '') {
    throw new TypeError('Game version is required to create a save.');
  }
  const savedAt = isoDate(now);
  const envelope = {
    magic: SAVE_MAGIC,
    formatVersion: SAVE_FORMAT_VERSION,
    gameVersion: String(gameVersion),
    runId: snapshot.runId,
    slot,
    createdAt: createdAt ?? snapshot.createdAt ?? savedAt,
    savedAt,
    summary: buildSaveSummary(snapshot),
    payload: clone(snapshot)
  };
  envelope.checksum = await checksumForEnvelope(envelope);
  validateSaveEnvelopeShape(envelope);
  return envelope;
}

export async function readSaveEnvelope(value, options = {}) {
  if (typeof value === 'string' && value.length > MAX_IMPORTED_JSON_LENGTH) {
    const error = new Error('Save file is too large.');
    error.code = 'too-large';
    throw error;
  }
  const parsed = typeof value === 'string' ? parseSaveJson(value) : clone(value);
  validateSaveEnvelopeShape(parsed);
  const expected = await checksumForEnvelope(parsed);
  if (expected !== parsed.checksum) {
    const error = new Error('Save checksum does not match its contents.');
    error.code = 'checksum';
    throw error;
  }
  const migrated = migrateSaveEnvelope(parsed, options.targetVersion ?? SAVE_FORMAT_VERSION);
  validateRunSnapshot(migrated.payload);
  const didMigrate = migrated.formatVersion !== parsed.formatVersion;
  if (didMigrate) migrated.checksum = await checksumForEnvelope(migrated);
  return {
    envelope: migrated,
    migrated: didMigrate
  };
}

export function exportSaveJson(envelope) {
  validateSaveEnvelopeShape(envelope);
  return `${JSON.stringify(envelope, null, 2)}\n`;
}

export function buildSaveSummary(snapshot) {
  const progression = snapshot.player?.progression ?? {};
  const clock = snapshot.clock ?? {};
  return {
    playerName: snapshot.player?.name ?? 'Unnamed Agent',
    playerLevel: Math.max(1, Math.floor(Number(progression.level) || 1)),
    levelName: snapshot.levelName ?? snapshot.levelPath,
    levelPath: snapshot.levelPath,
    fieldDay: Math.max(1, Math.floor(Number(clock.fieldDay) || 1)),
    minuteOfDay: Math.max(0, Math.min(1439, Math.floor(Number(clock.minuteOfDay) || 0))),
    playtimeSeconds: Math.max(0, Math.floor(Number(snapshot.playtimeSeconds) || 0))
  };
}

export async function checksumForEnvelope(envelope) {
  const unsigned = { ...envelope };
  delete unsigned.checksum;
  const bytes = new TextEncoder().encode(stableStringify(unsigned));
  const cryptoApi = globalThis.crypto;
  if (!cryptoApi?.subtle) {
    const error = new Error('Save checksums require Web Crypto.');
    error.code = 'crypto-unavailable';
    throw error;
  }
  const digest = await cryptoApi.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map((value) => value.toString(16).padStart(2, '0')).join('');
}

export function stableStringify(value) {
  return JSON.stringify(sortValue(value));
}

function sortValue(value) {
  if (Array.isArray(value)) return value.map(sortValue);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.keys(value)
      .sort()
      .map((key) => [key, sortValue(value[key])])
  );
}

function parseSaveJson(value) {
  try {
    return JSON.parse(value);
  } catch {
    const error = new Error('Save file is not valid JSON.');
    error.code = 'malformed';
    throw error;
  }
}

function clone(value) {
  if (typeof structuredClone === 'function') return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}

function isoDate(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) throw new TypeError('Save timestamp is invalid.');
  return date.toISOString();
}
