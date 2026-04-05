import admin from 'firebase-admin';
import { PubSub } from '@google-cloud/pubsub';
import { getFirestore, logger } from './shared';

const pubsub = new PubSub({
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
});

/**
 * Persists a system alert, publishes it to Pub/Sub, and notifies coordinator audiences.
 */
export async function publishSystemAlert(payload: {
  alert_type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  entity_id?: string;
  entity_type?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const firestore = getFirestore();
  const alertRef = firestore.collection('system-alerts').doc();

  await alertRef.set({
    alert_id: alertRef.id,
    acknowledged: false,
    created_at: admin.firestore.FieldValue.serverTimestamp(),
    ...payload,
  });

  await pubsub.topic(process.env.PUBSUB_ALERTS_TOPIC || 'alerts').publishMessage({
    json: {
      alert_id: alertRef.id,
      ...payload,
    },
    attributes: {
      severity: payload.severity,
      alert_type: payload.alert_type,
    },
  });

  const users = await firestore.collection('users')
    .where('role', 'in', ['admin', 'field_coordinator'])
    .get();

  const tokens = users.docs
    .map((doc) => String(doc.get('device_token') || ''))
    .filter(Boolean);

  if (tokens.length > 0) {
    await admin.messaging().sendEachForMulticast({
      tokens,
      data: {
        alert_id: alertRef.id,
        alert_type: payload.alert_type,
        severity: payload.severity,
        description: payload.description,
      },
    });
  }

  logger.info({
    message: 'system_alert_created',
    alert_id: alertRef.id,
    ...payload,
  });
}
