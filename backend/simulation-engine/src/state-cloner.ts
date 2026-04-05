import admin from 'firebase-admin';
import { getFirestore } from './shared';

const COLLECTIONS = [
  'shipments',
  'drone-fleet',
  'warehouses',
  'rescue-teams',
  'survivor-clusters',
  'disaster-events',
  'route-risk-scores',
] as const;

/**
 * Clones the live operational collections into a session-scoped simulation namespace.
 */
export async function cloneSystemState(sessionId: string): Promise<Record<string, number>> {
  const firestore = getFirestore();
  const manifest: Record<string, number> = {};
  const ttlAt = admin.firestore.Timestamp.fromMillis(Date.now() + 60 * 60 * 1000);

  for (const collectionName of COLLECTIONS) {
    const snapshot = await firestore.collection(collectionName).get();
    manifest[collectionName] = snapshot.size;

    for (const doc of snapshot.docs) {
      await firestore.collection(`sim-${sessionId}-${collectionName}`).doc(doc.id).set({
        ...doc.data(),
        simulation_session_id: sessionId,
        sim_created_at: admin.firestore.FieldValue.serverTimestamp(),
        ttl_at: ttlAt,
      });
    }
  }

  return manifest;
}
