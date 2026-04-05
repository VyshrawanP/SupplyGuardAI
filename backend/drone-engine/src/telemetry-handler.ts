import admin from 'firebase-admin';
import { PubSub } from '@google-cloud/pubsub';
import type { GeoPoint } from './types';

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

function haversineKm(left: GeoPoint, right: GeoPoint): number {
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const dLat = toRadians(right.lat - left.lat);
  const dLng = toRadians(right.lng - left.lng);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(toRadians(left.lat)) * Math.cos(toRadians(right.lat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Applies drone telemetry, computes ETA updates, and raises operational anomalies.
 */
export async function handleTelemetryUpdate(payload: {
  drone_id: string;
  dispatch_id: string;
  current_position: GeoPoint;
  battery_percent: number;
  destination: GeoPoint;
  estimated_speed_kmh?: number;
}): Promise<void> {
  const firestore = getFirestore();
  const droneRef = firestore.collection('drone-fleet').doc(payload.drone_id);
  const dispatchRef = firestore.collection('drone-dispatches').doc(payload.dispatch_id);

  await firestore.runTransaction(async (transaction) => {
    transaction.update(droneRef, {
      current_position: payload.current_position,
      battery_percent: payload.battery_percent,
      last_telemetry_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    });

    const remainingDistanceKm = haversineKm(payload.current_position, payload.destination);
    const speedKmh = Math.max(1, payload.estimated_speed_kmh || 60);
    const etaMinutes = Math.round((remainingDistanceKm / speedKmh) * 60);

    transaction.set(dispatchRef, {
      eta_minutes: etaMinutes,
      last_telemetry_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
  });

  if (payload.battery_percent < 15) {
    await pubsub.topic(process.env.PUBSUB_ALERTS_TOPIC || 'alerts').publishMessage({
      json: {
        alert_type: 'EMERGENCY_RETURN',
        drone_id: payload.drone_id,
        dispatch_id: payload.dispatch_id,
        battery_percent: payload.battery_percent,
      },
      attributes: {
        severity: 'CRITICAL',
        entity_type: 'drone',
      },
    });
  }

  const dispatchSnapshot = await dispatchRef.get();
  const lastTelemetry = dispatchSnapshot.get('last_telemetry_at') as admin.firestore.Timestamp | undefined;
  if (lastTelemetry && Date.now() - lastTelemetry.toMillis() > 5 * 60 * 1000) {
    await pubsub.topic(process.env.PUBSUB_ALERTS_TOPIC || 'alerts').publishMessage({
      json: {
        alert_type: 'LOST_DRONE',
        drone_id: payload.drone_id,
        dispatch_id: payload.dispatch_id,
        last_known_position: payload.current_position,
      },
      attributes: {
        severity: 'HIGH',
        entity_type: 'drone',
      },
    });
  }
}
