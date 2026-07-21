import { createSaveEnvelope, readSaveEnvelope } from './SaveCodec.js';
import { SAVE_SLOT_IDS, saveErrorStatus } from './SaveSchema.js';

const AUTOSAVE_SLOTS = SAVE_SLOT_IDS.filter((slot) => slot.startsWith('autosave'));

export class SaveCoordinator {
  constructor({ repository, gameVersion }) {
    this.repository = repository;
    this.gameVersion = gameVersion;
    this.writeQueue = Promise.resolve();
    this.replaceOnNextSave = false;
  }

  beginNewRun() {
    this.replaceOnNextSave = true;
  }

  async listSlots() {
    const records = await this.repository.list();
    const bySlot = new Map(records.map((record) => [record.slot, record]));
    const rows = [];
    for (const slot of SAVE_SLOT_IDS) {
      const record = bySlot.get(slot);
      if (!record) {
        rows.push({ slot, status: 'empty', record: null, summary: null });
        continue;
      }
      try {
        const read = await readSaveEnvelope(record);
        rows.push({
          slot,
          status: 'valid',
          record: read.envelope,
          summary: read.envelope.summary,
          migrated: read.migrated,
          gameVersionMismatch: read.envelope.gameVersion !== this.gameVersion
        });
      } catch (error) {
        rows.push({
          slot,
          status: saveErrorStatus(error),
          record,
          summary: record.summary ?? null,
          error: error.message,
          errorCode: error.code ?? 'unreadable'
        });
      }
    }
    return rows;
  }

  async newestValid() {
    const rows = await this.listSlots();
    return rows
      .filter((row) => row.status === 'valid')
      .sort((left, right) => Date.parse(right.record.savedAt) - Date.parse(left.record.savedAt))[0] ?? null;
  }

  async load(slot) {
    const record = await this.repository.get(slot);
    if (!record) {
      const error = new Error('Save slot is empty.');
      error.code = 'empty';
      throw error;
    }
    const read = await readSaveEnvelope(record);
    if (read.migrated) await this.repository.put(read.envelope);
    return read.envelope;
  }

  saveManual(snapshot) {
    return this.#enqueueSave(snapshot, 'manual');
  }

  saveAuto(snapshot) {
    return this.#enqueue(async () => {
      const slot = await this.#nextAutosaveSlot();
      return this.#write(snapshot, slot);
    });
  }

  importJson(text) {
    return this.#enqueue(async () => {
      const read = await readSaveEnvelope(text);
      const imported = {
        ...read.envelope,
        slot: 'manual',
        savedAt: new Date().toISOString()
      };
      const envelope = await createSaveEnvelope({
        snapshot: imported.payload,
        gameVersion: imported.gameVersion,
        slot: 'manual',
        createdAt: imported.createdAt,
        now: imported.savedAt
      });
      await this.repository.replaceAll(envelope);
      this.replaceOnNextSave = false;
      return envelope;
    });
  }

  async deleteSlot(slot) {
    await this.repository.delete(slot);
  }

  async clear() {
    await this.repository.clear();
  }

  whenIdle() {
    return this.writeQueue;
  }

  #enqueueSave(snapshot, slot) {
    return this.#enqueue(() => this.#write(snapshot, slot));
  }

  #enqueue(work) {
    const next = this.writeQueue.catch(() => undefined).then(work);
    this.writeQueue = next;
    return next;
  }

  async #write(snapshot, slot) {
    const existing = await this.repository.get(slot);
    const envelope = await createSaveEnvelope({
      snapshot,
      gameVersion: this.gameVersion,
      slot,
      createdAt: existing?.runId === snapshot.runId ? existing.createdAt : snapshot.createdAt
    });
    if (this.replaceOnNextSave) {
      await this.repository.replaceAll(envelope);
      this.replaceOnNextSave = false;
    } else {
      await this.repository.put(envelope);
    }
    return envelope;
  }

  async #nextAutosaveSlot() {
    const records = await this.repository.list();
    const autosaves = new Map(records
      .filter((record) => AUTOSAVE_SLOTS.includes(record.slot))
      .map((record) => [record.slot, record]));
    const empty = AUTOSAVE_SLOTS.find((slot) => !autosaves.has(slot));
    if (empty) return empty;
    return [...autosaves.values()]
      .sort((left, right) => Date.parse(left.savedAt) - Date.parse(right.savedAt))[0].slot;
  }
}
