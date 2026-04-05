import admin from 'firebase-admin';
import { getFirestore } from './shared';

/**
 * Returns current life jacket ledger status and flags overdue assets.
 */
export async function getLifeJacketStatus(): Promise<Record<string, unknown>> {
  const snapshot = await getFirestore().collection('life-jacket-ledger').get();
  const grouped = {
    IN_USE: 0,
    RETURNED: 0,
    LOST: 0,
    AVAILABLE: 0,
    OVERDUE: 0,
  };

  const now = Date.now();
  let totalDispatchedToday = 0;
  let returned = 0;
  let missionDurationHoursSum = 0;
  let missionDurationCount = 0;

  for (const doc of snapshot.docs) {
    const status = String(doc.get('status') || 'AVAILABLE') as keyof typeof grouped;
    if (status in grouped) {
      grouped[status] += 1;
    }

    const createdAt = doc.get('created_at') as admin.firestore.Timestamp | undefined;
    const updatedAt = doc.get('updated_at') as admin.firestore.Timestamp | undefined;
    if (createdAt && now - createdAt.toMillis() < 24 * 60 * 60 * 1000) {
      totalDispatchedToday += 1;
    }
    if (status === 'RETURNED') {
      returned += 1;
      if (createdAt && updatedAt) {
        missionDurationHoursSum += (updatedAt.toMillis() - createdAt.toMillis()) / (60 * 60 * 1000);
        missionDurationCount += 1;
      }
    }
    if (status === 'IN_USE' && createdAt && now - createdAt.toMillis() > 24 * 60 * 60 * 1000) {
      grouped.OVERDUE += 1;
    }
  }

  return {
    grouped,
    total_dispatched_today: totalDispatchedToday,
    return_rate_percent: totalDispatchedToday > 0 ? Number(((returned / totalDispatchedToday) * 100).toFixed(2)) : 0,
    average_mission_duration_hours: missionDurationCount > 0
      ? Number((missionDurationHoursSum / missionDurationCount).toFixed(2))
      : 0,
  };
}

/**
 * Updates a jacket ledger entry when a QR scan changes its status.
 */
export async function updateJacketStatus(jacketId: string, status: 'IN_USE' | 'RETURNED' | 'LOST' | 'AVAILABLE'): Promise<void> {
  await getFirestore().collection('life-jacket-ledger').doc(jacketId).set({
    status,
    updated_at: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });
}
