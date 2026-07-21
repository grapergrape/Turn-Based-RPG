import { SAVE_SLOT_IDS, SAVE_SLOT_SET } from './SaveSchema.js';

const DATABASE_NAME = 'vale-imprint-saves';
const DATABASE_VERSION = 1;
const STORE_NAME = 'save-records';

export class IndexedDbSaveRepository {
  constructor({ indexedDb = globalThis.indexedDB, databaseName = DATABASE_NAME } = {}) {
    this.indexedDb = indexedDb;
    this.databaseName = databaseName;
    this.databasePromise = null;
  }

  async list() {
    const db = await this.#database();
    return requestResult(db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).getAll());
  }

  async get(slot) {
    assertSlot(slot);
    const db = await this.#database();
    return requestResult(db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).get(slot));
  }

  async put(record) {
    assertSlot(record?.slot);
    const db = await this.#database();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    transaction.objectStore(STORE_NAME).put(record);
    await transactionDone(transaction);
    return record;
  }

  async delete(slot) {
    assertSlot(slot);
    const db = await this.#database();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    transaction.objectStore(STORE_NAME).delete(slot);
    await transactionDone(transaction);
  }

  async clear() {
    const db = await this.#database();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    transaction.objectStore(STORE_NAME).clear();
    await transactionDone(transaction);
  }

  async replaceAll(record) {
    assertSlot(record?.slot);
    const db = await this.#database();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    store.clear();
    store.put(record);
    await transactionDone(transaction);
    return record;
  }

  async #database() {
    if (!this.indexedDb) {
      const error = new Error('Browser save storage is unavailable.');
      error.code = 'storage-unavailable';
      throw error;
    }
    if (!this.databasePromise) {
      this.databasePromise = new Promise((resolve, reject) => {
        const request = this.indexedDb.open(this.databaseName, DATABASE_VERSION);
        request.onupgradeneeded = () => {
          const db = request.result;
          if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME, { keyPath: 'slot' });
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error ?? new Error('Save database could not be opened.'));
        request.onblocked = () => reject(new Error('Save database upgrade is blocked by another tab.'));
      });
    }
    return this.databasePromise;
  }
}

export class MemorySaveRepository {
  constructor(records = []) {
    this.records = new Map(records.map((record) => [record.slot, clone(record)]));
    this.failNextWrite = null;
  }

  async list() {
    return [...this.records.values()].map(clone);
  }

  async get(slot) {
    assertSlot(slot);
    return clone(this.records.get(slot));
  }

  async put(record) {
    this.#maybeFail();
    assertSlot(record?.slot);
    this.records.set(record.slot, clone(record));
    return clone(record);
  }

  async delete(slot) {
    assertSlot(slot);
    this.records.delete(slot);
  }

  async clear() {
    this.records.clear();
  }

  async replaceAll(record) {
    this.#maybeFail();
    assertSlot(record?.slot);
    this.records = new Map([[record.slot, clone(record)]]);
    return clone(record);
  }

  #maybeFail() {
    if (!this.failNextWrite) return;
    const error = this.failNextWrite;
    this.failNextWrite = null;
    throw error;
  }
}

function assertSlot(slot) {
  if (!SAVE_SLOT_SET.has(slot)) {
    throw new TypeError(`Unknown save slot: ${slot}. Expected ${SAVE_SLOT_IDS.join(', ')}.`);
  }
}

function requestResult(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Save database request failed.'));
  });
}

function transactionDone(transaction) {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error('Save transaction failed.'));
    transaction.onabort = () => reject(transaction.error ?? new Error('Save transaction was aborted.'));
  });
}

function clone(value) {
  if (value === undefined) return undefined;
  if (typeof structuredClone === 'function') return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}
