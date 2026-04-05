import admin from 'firebase-admin';
import type { DroneCandidate, GeoPoint } from './types';

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
 * Selects and atomically reserves the best available drone for a dispatch.
 */
export async function selectDrone(
  zoneCenter: GeoPoint,
  requestedPayloadKg: number,
): Promise<{ selected: DroneCandidate; candidates: DroneCandidate[]; droneData: Record<string, unknown> }> {
  const firestore = getFirestore();
  const snapshot = await firestore.collection('drone-fleet').where('status', '==', 'IDLE').get();
  const maxRange = Number(process.env.DRONE_MAX_RANGE_KM || 15);

  const candidates = snapshot.docs
    .map((doc) => {
      const homeDepot = doc.get('home_depot') as GeoPoint;
      const distanceKm = haversineKm(homeDepot, zoneCenter);
      const batteryPercent = Number(doc.get('battery_percent') || 0);
      const maxPayloadKg = Number(doc.get('max_payload_kg') || 0);
      const availablePayloadKg = Number(doc.get('available_payload_kg') || 0);
      const suitabilityScore = (batteryPercent * 0.4)
        + ((1 - distanceKm / maxRange) * 0.4 * 100)
        + ((availablePayloadKg / Math.max(1, maxPayloadKg)) * 0.2 * 100);

      return {
        drone_id: doc.id,
        distance_km: Number(distanceKm.toFixed(2)),
        battery_percent: batteryPercent,
        max_payload_kg: maxPayloadKg,
        available_payload_kg: availablePayloadKg,
        suitability_score: Number(suitabilityScore.toFixed(2)),
        _doc: doc,
      };
    })
    .filter((candidate) => candidate.distance_km <= maxRange)
    .filter((candidate) => candidate.battery_percent >= 30)
    .filter((candidate) => candidate.available_payload_kg >= requestedPayloadKg)
    .sort((left, right) => right.suitability_score - left.suitability_score);

  if (candidates.length === 0) {
    throw new Error('No eligible drone candidates available.');
  }

  const topCandidates = candidates.slice(0, 3);
  const selected = topCandidates[0];
  const droneRef = firestore.collection('drone-fleet').doc(selected.drone_id);

  await firestore.runTransaction(async (transaction) => {
    const latest = await transaction.get(droneRef);
    if (!latest.exists || latest.get('status') !== 'IDLE') {
      throw new Error('Selected drone is no longer available.');
    }

    transaction.update(droneRef, {
      status: 'ASSIGNED',
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    });
  });

  return {
    selected: {
      drone_id: selected.drone_id,
      distance_km: selected.distance_km,
      battery_percent: selected.battery_percent,
      max_payload_kg: selected.max_payload_kg,
      available_payload_kg: selected.available_payload_kg,
      suitability_score: selected.suitability_score,
    },
    candidates: topCandidates.map(({ _doc, ...candidate }) => candidate),
    droneData: selected._doc.data() as Record<string, unknown>,
  };
}
