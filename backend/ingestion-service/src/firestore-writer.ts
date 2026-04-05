import admin from 'firebase-admin';
import type { DisasterEvent } from './normalizer';

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
 * Writes a normalized disaster event to Firestore.
 */
export async function persistDisasterEvent(event: DisasterEvent): Promise<void> {
  await getFirestore().collection('disaster-events').doc(event.event_id).set({
    ...event,
    updated_at: admin.firestore.FieldValue.serverTimestamp(),
  });
}

/**
 * Marks an event as processed after downstream acknowledgement.
 */
export async function markDisasterEventProcessed(eventId: string): Promise<void> {
  await getFirestore().collection('disaster-events').doc(eventId).set({
    processed: true,
    processed_at: admin.firestore.FieldValue.serverTimestamp(),
    updated_at: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });
}
