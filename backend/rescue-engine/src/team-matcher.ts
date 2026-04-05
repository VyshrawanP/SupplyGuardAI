import axios from 'axios';
import admin from 'firebase-admin';
import type { GeoPoint, SurvivorCluster } from './types';

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

async function computeEtaMinutes(origin: GeoPoint, destination: GeoPoint): Promise<number> {
  if (process.env.OFFLINE_MODE === 'true' || !process.env.GOOGLE_MAPS_DIRECTIONS_API_KEY) {
    return Math.round(haversineKm(origin, destination) * 1.3 * 2);
  }

  const response = await axios.get('https://maps.googleapis.com/maps/api/distancematrix/json', {
    params: {
      origins: `${origin.lat},${origin.lng}`,
      destinations: `${destination.lat},${destination.lng}`,
      key: process.env.GOOGLE_MAPS_DIRECTIONS_API_KEY,
    },
    timeout: 10_000,
  });

  return Math.round(Number(response.data?.rows?.[0]?.elements?.[0]?.duration?.value || 0) / 60);
}

/**
 * Assigns the highest-scoring available rescue team to a survivor cluster.
 */
export async function matchTeamToCluster(cluster: SurvivorCluster): Promise<Record<string, unknown>> {
  const firestore = getFirestore();
  const snapshot = await firestore.collection('rescue-teams').where('status', '==', 'AVAILABLE').get();

  const scoredTeams = snapshot.docs.map((doc) => {
    const position = doc.get('current_position') as GeoPoint;
    const distanceKm = haversineKm(position, cluster.center);
    const suppliesAdequacy = Number(doc.get('supplies_adequacy') || 0);
    const teamCapacity = Number(doc.get('team_capacity') || 0);
    const score = ((1 / Math.max(distanceKm, 0.5)) * 0.5)
      + (suppliesAdequacy * 0.3)
      + (teamCapacity * 0.2);

    return {
      id: doc.id,
      position,
      supplies_adequacy: suppliesAdequacy,
      team_capacity: teamCapacity,
      score,
    };
  }).sort((left, right) => right.score - left.score);

  if (scoredTeams.length === 0) {
    throw new Error('No available rescue teams.');
  }

  const selected = scoredTeams[0];
  const etaMinutes = await computeEtaMinutes(selected.position, cluster.center);
  const assignmentRef = firestore.collection('rescue-assignments').doc();

  await firestore.runTransaction(async (transaction) => {
    const teamRef = firestore.collection('rescue-teams').doc(selected.id);
    const teamSnapshot = await transaction.get(teamRef);
    if (!teamSnapshot.exists || teamSnapshot.get('status') !== 'AVAILABLE') {
      throw new Error('Selected rescue team is no longer available.');
    }

    transaction.update(teamRef, {
      status: 'DEPLOYED',
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    });

    transaction.set(assignmentRef, {
      assignment_id: assignmentRef.id,
      cluster_id: cluster.cluster_id,
      team_id: selected.id,
      status: 'DISPATCHED',
      eta_minutes: etaMinutes,
      dispatched_at: admin.firestore.FieldValue.serverTimestamp(),
      supplies_to_carry: {
        water_cases: Math.ceil(cluster.estimated_population / 20),
        medical_kits: Math.max(1, Math.ceil(cluster.severity / 2)),
        food_packets: Math.ceil(cluster.estimated_population * 1.5),
      },
    });

    transaction.set(firestore.collection('survivor-clusters').doc(cluster.cluster_id), {
      status: 'ASSIGNED',
      assignment_id: assignmentRef.id,
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
  });

  return {
    assignment_id: assignmentRef.id,
    cluster_id: cluster.cluster_id,
    team_id: selected.id,
    eta_minutes: etaMinutes,
  };
}
