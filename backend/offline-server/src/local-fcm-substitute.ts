import { db } from './local-db';
import { sendToDevice } from './hotspot-broadcaster';

/**
 * Delivers a push-style message over WebSocket or queues it locally when offline.
 */
export function sendOfflineNotification(deviceId: string, payload: Record<string, unknown>): void {
  const delivered = sendToDevice(deviceId, {
    type: 'notification',
    payload,
  });

  if (!delivered) {
    db.prepare(
      'INSERT OR REPLACE INTO pending_notifications (id, device_id, payload, created_at) VALUES (?, ?, ?, ?)',
    ).run(
      `${deviceId}-${Date.now()}`,
      deviceId,
      JSON.stringify(payload),
      new Date().toISOString(),
    );
  }
}

export function flushPendingNotifications(deviceId: string): void {
  const rows = db.prepare('SELECT id, payload FROM pending_notifications WHERE device_id = ?').all(deviceId) as Array<{ id: string; payload: string }>;
  for (const row of rows) {
    const delivered = sendToDevice(deviceId, {
      type: 'notification',
      payload: JSON.parse(row.payload),
    });
    if (delivered) {
      db.prepare('DELETE FROM pending_notifications WHERE id = ?').run(row.id);
    }
  }
}
