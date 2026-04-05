import admin from 'firebase-admin';
import type { FlightPlan, PayloadManifestItem } from './types';

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
 * Sends a data-only mission briefing to the assigned drone operator and logs the notification.
 */
export async function sendMissionBriefing(params: {
  dispatch_id: string;
  operator_uid: string;
  drone_id: string;
  destination: { lat: number; lng: number };
  payload_manifest: PayloadManifestItem[];
  estimated_flight_minutes: number;
  battery_at_dispatch: number;
  flight_plan: FlightPlan;
}): Promise<void> {
  const firestore = getFirestore();
  const userSnapshot = await firestore.collection('users').doc(params.operator_uid).get();
  const deviceToken = String(userSnapshot.get('device_token') || '');
  if (!deviceToken) {
    return;
  }

  const data = {
    drone_id: params.drone_id,
    destination_link: `https://maps.google.com/maps?daddr=${params.destination.lat},${params.destination.lng}`,
    payload_manifest: params.payload_manifest.map((item) => `${item.item_name}:${item.assigned_quantity}${item.unit}`).join(', '),
    estimated_flight_minutes: String(params.estimated_flight_minutes),
    battery_at_dispatch: String(params.battery_at_dispatch),
    waypoints_count: String(params.flight_plan.waypoints.length),
  };

  await admin.messaging().send({
    token: deviceToken,
    data,
  });

  await firestore
    .collection('drone-dispatches')
    .doc(params.dispatch_id)
    .collection('notifications')
    .add({
      operator_uid: params.operator_uid,
      delivered_at: admin.firestore.FieldValue.serverTimestamp(),
      payload: data,
    });
}
