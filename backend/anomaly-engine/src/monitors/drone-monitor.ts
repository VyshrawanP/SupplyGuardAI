import { publishSystemAlert } from '../alert-publisher';
import { getFirestore } from '../shared';

/**
 * Monitors active drone dispatches for telemetry silence, low battery, and overdue arrival.
 */
export async function runDroneMonitor(): Promise<void> {
  const snapshot = await getFirestore().collection('drone-dispatches').where('status', '==', 'IN_FLIGHT').get();

  for (const doc of snapshot.docs) {
    const lastTelemetry = doc.get('last_telemetry_at')?.toDate?.() as Date | undefined;
    const batteryPercent = Number(doc.get('flight_plan')?.battery_remaining_at_destination ?? doc.get('battery_percent') ?? 100);
    const dispatchedAt = doc.get('dispatched_at')?.toDate?.() as Date | undefined;
    const etaMinutes = Number(doc.get('eta_minutes') || 0);

    if (lastTelemetry && Date.now() - lastTelemetry.getTime() > 300_000) {
      await publishSystemAlert({
        alert_type: 'DRONE_LOST',
        severity: 'HIGH',
        description: `Drone dispatch ${doc.id} has not sent telemetry in over 5 minutes.`,
        entity_id: doc.id,
        entity_type: 'drone_dispatch',
      });
    }

    if (batteryPercent < 15) {
      await publishSystemAlert({
        alert_type: 'DRONE_EMERGENCY_RETURN',
        severity: 'CRITICAL',
        description: `Drone dispatch ${doc.id} is below emergency battery threshold.`,
        entity_id: doc.id,
        entity_type: 'drone_dispatch',
      });
    }

    if (dispatchedAt && etaMinutes > 0 && Date.now() > dispatchedAt.getTime() + (etaMinutes + 10) * 60 * 1000) {
      await publishSystemAlert({
        alert_type: 'DRONE_OVERDUE',
        severity: 'HIGH',
        description: `Drone dispatch ${doc.id} has passed its estimated arrival time.`,
        entity_id: doc.id,
        entity_type: 'drone_dispatch',
      });
    }
  }
}
