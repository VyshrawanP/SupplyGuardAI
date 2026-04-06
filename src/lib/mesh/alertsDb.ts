import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { MeshAlert } from './types';

type StoredMeshAlert = MeshAlert & {
  receivedAt: string; // ISO8601
};

interface MeshDbSchema extends DBSchema {
  alerts: {
    key: string;
    value: StoredMeshAlert;
    indexes: { byTimestamp: string };
  };
}

let dbPromise: Promise<IDBPDatabase<MeshDbSchema>> | null = null;

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB<MeshDbSchema>('supplyguard_mesh', 1, {
      upgrade(db) {
        const store = db.createObjectStore('alerts', { keyPath: 'id' });
        store.createIndex('byTimestamp', 'timestamp');
      },
    });
  }
  return dbPromise;
}

export async function meshDbListAlerts(limit = 200): Promise<StoredMeshAlert[]> {
  const db = await getDb();
  const index = db.transaction('alerts').store.index('byTimestamp');
  // Fetch newest first by walking the index backwards.
  const results: StoredMeshAlert[] = [];
  let cursor = await index.openCursor(null, 'prev');
  while (cursor && results.length < limit) {
    results.push(cursor.value);
    cursor = await cursor.continue();
  }
  return results;
}

export async function meshDbHasAlert(id: string): Promise<boolean> {
  const db = await getDb();
  const existing = await db.get('alerts', id);
  return existing != null;
}

export async function meshDbUpsertAlert(alert: MeshAlert): Promise<void> {
  const db = await getDb();
  const record: StoredMeshAlert = {
    ...alert,
    receivedAt: new Date().toISOString(),
  };
  await db.put('alerts', record);
}

export async function meshDbPruneOlderThan(cutoffIso: string): Promise<void> {
  const db = await getDb();
  const tx = db.transaction('alerts', 'readwrite');
  const index = tx.store.index('byTimestamp');
  let cursor = await index.openCursor(null, 'next'); // oldest first
  while (cursor) {
    if (cursor.value.timestamp >= cutoffIso) {
      break;
    }
    await cursor.delete();
    cursor = await cursor.continue();
  }
  await tx.done;
}

