import { publishSystemAlert } from '../alert-publisher';
import { getFirestore } from '../shared';

/**
 * Detects shipments that are falling materially behind expected progress.
 */
export async function runDelayMonitor(): Promise<void> {
  const snapshot = await getFirestore().collection('shipments').where('status', 'in', ['IN_TRANSIT', 'AT_RISK', 'DELAYED']).get();
  const thresholdPercent = Number(process.env.DELAY_ANOMALY_THRESHOLD_PERCENT || 40);

  for (const doc of snapshot.docs) {
    const lastUpdate = doc.get('last_position_update')?.toDate?.() as Date | undefined;
    if (!lastUpdate) {
      continue;
    }

    const elapsedMinutes = Math.max(1, (Date.now() - lastUpdate.getTime()) / 60000);
    const totalEta = Math.max(1, Number(doc.get('current_eta_minutes') || 1));
    const expectedProgress = elapsedMinutes / totalEta;
    const distanceCovered = Number(doc.get('distance_covered_km') || 0);
    const totalDistance = Math.max(1, Number(doc.get('total_distance_km') || 1));
    const actualProgress = distanceCovered / totalDistance;

    if (actualProgress < expectedProgress * 0.6) {
      const remainingDistance = Math.max(0, totalDistance - distanceCovered);
      const pace = Math.max(0.1, distanceCovered / elapsedMinutes);
      const revisedEta = remainingDistance / pace;
      const delayIncreasePercent = ((revisedEta - totalEta) / totalEta) * 100;

      if (delayIncreasePercent > thresholdPercent) {
        await publishSystemAlert({
          alert_type: 'DELAY_ANOMALY',
          severity: 'HIGH',
          description: `Shipment ${doc.id} is significantly behind schedule and may require re-optimization.`,
          entity_id: doc.id,
          entity_type: 'shipment',
          metadata: {
            revised_eta_minutes: Math.round(revisedEta),
            delay_increase_percent: Number(delayIncreasePercent.toFixed(2)),
          },
        });
      }
    }
  }
}
