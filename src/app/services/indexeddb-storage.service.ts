import { Injectable } from '@angular/core';

interface KeyValueRecord<T> {
  key: string;
  value: T;
  updatedAt: string;
}

@Injectable({ providedIn: 'root' })
export class IndexedDbStorageService {
  // Dedicated IndexedDB database for app state (separate from image blobs).
  private readonly dbName = 'vtt-app-db';
  private readonly dbVersion = 1;
  private readonly storeName = 'key-value';

  private dbPromise: Promise<IDBDatabase> | null = null;

  private getDb(): Promise<IDBDatabase> {
    if (this.dbPromise) {
      return this.dbPromise;
    }

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'key' });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    return this.dbPromise;
  }

  async get<T>(key: string): Promise<T | null> {
    const db = await this.getDb();

    return new Promise<T | null>((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readonly');
      const store = tx.objectStore(this.storeName);
      const request = store.get(key);

      request.onsuccess = () => {
        const record = request.result as KeyValueRecord<T> | undefined;
        resolve(record?.value ?? null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async set<T>(key: string, value: T): Promise<void> {
    const db = await this.getDb();

    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);
      const record: KeyValueRecord<T> = {
        key,
        value,
        updatedAt: new Date().toISOString()
      };
      store.put(record);

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  }

  async remove(key: string): Promise<void> {
    const db = await this.getDb();

    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);
      store.delete(key);

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  }

  /**
   * Migration helper that moves a JSON payload from localStorage into IndexedDB
   * the first time the app sees it.
   */
  async migrateJsonFromLocalStorage<T>(key: string): Promise<T | null> {
    const existing = await this.get<T>(key);
    if (existing !== null) {
      return existing;
    }

    const raw = localStorage.getItem(key);
    if (!raw) {
      return null;
    }

    try {
      const parsed = JSON.parse(raw) as T;
      await this.set(key, parsed);
      localStorage.removeItem(key);
      return parsed;
    } catch {
      // Store raw fallback when legacy data is not JSON.
      const fallback = raw as unknown as T;
      await this.set(key, fallback);
      localStorage.removeItem(key);
      return fallback;
    }
  }
}