import admin from 'firebase-admin';
import { publishSystemAlert } from '../alert-publisher';
import { getFirestore } from '../shared';

/**
 * Detects deployed teams that have stopped reporting status.
 */
export async function runTeamMonitor(): Promise<void> {
  const thresholdMinutes = Number(process.env.TEAM_SILENCE_ALERT_MINUTES || 30);
  const snapshot = await getFirestore().collection('rescue-teams').where('status', '==', 'DEPLOYED').get();

  for (const doc of snapshot.docs) {
    const lastUpdate = doc.get('last_status_update')?.toDate?.() as Date | undefined;
    if (!lastUpdate || Date.now() - lastUpdate.getTime() <= thresholdMinutes * 60 * 1000) {
      continue;
    }

    await publishSystemAlert({
      alert_type: 'TEAM_UNREACHABLE',
      severity: 'HIGH',
      description: `Rescue team ${doc.id} has not reported status within ${thresholdMinutes} minutes.`,
      entity_id: doc.id,
      entity_type: 'rescue_team',
      metadata: {
        last_known_position: doc.get('current_position'),
      },
    });

    const token = String(doc.get('device_token') || '');
    if (token) {
      await admin.messaging().send({
        token,
        data: {
          type: 'STATUS_PING',
          team_id: doc.id,
        },
      });
    }
  }
}
