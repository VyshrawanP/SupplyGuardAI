import admin from 'firebase-admin';
import type { SurvivorCluster } from './types';

/**
 * Sends a high-priority rescue mission briefing to the assigned team members.
 */
export async function notifyRescueTeam(params: {
  team_id: string;
  cluster: SurvivorCluster;
  supplies: { water_cases: number; medical_kits: number; food_packets: number };
}): Promise<void> {
  const teamSnapshot = await admin.firestore().collection('rescue-teams').doc(params.team_id).get();
  const roster = Array.isArray(teamSnapshot.get('roster')) ? teamSnapshot.get('roster') as string[] : [];
  const deviceToken = String(teamSnapshot.get('device_token') || '');

  if (!deviceToken) {
    return;
  }

  await admin.messaging().send({
    token: deviceToken,
    android: {
      priority: 'high',
    },
    data: {
      mission_type: 'RESCUE_ASSIGNMENT',
      cluster_coordinates: `${params.cluster.center.lat},${params.cluster.center.lng}`,
      estimated_population: String(params.cluster.estimated_population),
      supplies_to_carry: JSON.stringify(params.supplies),
      maps_link: `https://maps.google.com/maps?daddr=${params.cluster.center.lat},${params.cluster.center.lng}`,
      team_members: roster.join(', '),
    },
  });
}
