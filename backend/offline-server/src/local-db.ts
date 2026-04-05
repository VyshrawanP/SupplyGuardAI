import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import admin from 'firebase-admin';

const dataDir = '/data';
const dbPath = path.join(dataDir, 'supplyguard-offline.db');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

export const db = new Database(dbPath);

export function initializeLocalDb(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS shipments (id TEXT PRIMARY KEY, payload TEXT, updated_at TEXT);
    CREATE TABLE IF NOT EXISTS drones (id TEXT PRIMARY KEY, payload TEXT, updated_at TEXT);
    CREATE TABLE IF NOT EXISTS warehouses (id TEXT PRIMARY KEY, payload TEXT, updated_at TEXT);
    CREATE TABLE IF NOT EXISTS inventory (id TEXT PRIMARY KEY, payload TEXT, updated_at TEXT);
    CREATE TABLE IF NOT EXISTS rescue_teams (id TEXT PRIMARY KEY, payload TEXT, updated_at TEXT);
    CREATE TABLE IF NOT EXISTS survivor_reports (id TEXT PRIMARY KEY, payload TEXT, updated_at TEXT);
    CREATE TABLE IF NOT EXISTS alerts (id TEXT PRIMARY KEY, payload TEXT, updated_at TEXT);
    CREATE TABLE IF NOT EXISTS drone_dispatches (id TEXT PRIMARY KEY, payload TEXT, updated_at TEXT);
    CREATE TABLE IF NOT EXISTS pending_notifications (id TEXT PRIMARY KEY, device_id TEXT, payload TEXT, created_at TEXT);
  `);
}

function getFirestore(): FirebaseFirestore.Firestore {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      projectId: process.env.FIREBASE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT_ID,
    });
  }
  return admin.firestore();
}

/**
 * Pulls the latest Firestore state into the local SQLite mirror.
 */
export async function pullFromFirestore(): Promise<void> {
  const firestore = getFirestore();
  const collections = [
    ['shipments', 'shipments'],
    ['drone-fleet', 'drones'],
    ['warehouses', 'warehouses'],
    ['rescue-teams', 'rescue_teams'],
    ['survivor-reports', 'survivor_reports'],
    ['system-alerts', 'alerts'],
    ['drone-dispatches', 'drone_dispatches'],
  ] as const;

  for (const [firestoreCollection, table] of collections) {
    const snapshot = await firestore.collection(firestoreCollection).get();
    const insert = db.prepare(`INSERT OR REPLACE INTO ${table} (id, payload, updated_at) VALUES (?, ?, ?)`);
    for (const doc of snapshot.docs) {
      insert.run(doc.id, JSON.stringify(doc.data()), new Date().toISOString());
    }
  }
}

/**
 * Pushes the local SQLite mirror back to Firestore using last-write-wins semantics.
 */
export async function pushToFirestore(): Promise<void> {
  const firestore = getFirestore();
  const mappings = [
    ['shipments', 'shipments'],
    ['drones', 'drone-fleet'],
    ['warehouses', 'warehouses'],
    ['rescue_teams', 'rescue-teams'],
    ['survivor_reports', 'survivor-reports'],
    ['alerts', 'system-alerts'],
    ['drone_dispatches', 'drone-dispatches'],
  ] as const;

  for (const [table, collection] of mappings) {
    const rows = db.prepare(`SELECT id, payload FROM ${table}`).all() as Array<{ id: string; payload: string }>;
    for (const row of rows) {
      await firestore.collection(collection).doc(row.id).set(JSON.parse(row.payload), { merge: true });
    }
  }
}
