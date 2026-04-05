import admin from 'firebase-admin';
import { PubSub } from '@google-cloud/pubsub';
import type { DisasterEventPayload, RiskScore } from './risk-calculator';

const pubsub = new PubSub({
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
});

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
 * Persists the risk score and publishes actionable decisions to downstream services.
 */
export async function publishRiskDecision(
  event: DisasterEventPayload,
  score: RiskScore,
): Promise<void> {
  const firestore = getFirestore();
  await firestore.collection('route-risk-scores').doc(`${score.route_id}-${Date.now()}`).set({
    ...score,
    event_id: event.event_id,
    created_at: admin.firestore.FieldValue.serverTimestamp(),
  });

  if (score.risk_score >= 60) {
    await pubsub.topic(process.env.PUBSUB_RISK_DECISIONS_TOPIC || 'risk-decisions').publishMessage({
      json: {
        event,
        score,
      },
      attributes: {
        route_id: score.route_id,
        risk_category: score.risk_category,
        risk_score: String(score.risk_score),
        ...(score.risk_score >= 85 ? { drone_dispatch_required: 'true' } : {}),
      },
    });
  }
}
