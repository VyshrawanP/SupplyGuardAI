import 'dotenv/config';
import http from 'node:http';
import express, { type Request, type Response } from 'express';
import { broadcastLocalUpdate, startHotspotBroadcaster } from './hotspot-broadcaster';
import { flushPendingNotifications, sendOfflineNotification } from './local-fcm-substitute';
import { db, initializeLocalDb, pullFromFirestore } from './local-db';
import { startSyncManager } from './sync-manager';

const app = express();
const port = Number(process.env.PORT || 3010);
const server = http.createServer(app);

app.use(express.json({ limit: '2mb' }));

app.get('/health', (_request: Request, response: Response) => {
  response.json({
    status: 'ok',
    service: 'offline-server',
    timestamp: new Date().toISOString(),
  });
});

app.get('/offline/shipments', (_request: Request, response: Response) => {
  const rows = db.prepare('SELECT id, payload FROM shipments').all() as Array<{ id: string; payload: string }>;
  response.json(rows.map((row) => ({ id: row.id, ...JSON.parse(row.payload) })));
});

app.post('/offline/notify', (request: Request, response: Response) => {
  const deviceId = String(request.body.device_id || '');
  sendOfflineNotification(deviceId, request.body.payload || {});
  response.status(202).json({ status: 'queued_or_sent' });
});

app.post('/offline/register-device', (request: Request, response: Response) => {
  const deviceId = String(request.body.device_id || '');
  flushPendingNotifications(deviceId);
  response.json({ status: 'registered' });
});

app.post('/offline/update', (request: Request, response: Response) => {
  const table = String(request.body.table || '');
  const id = String(request.body.id || '');
  const payload = request.body.payload || {};
  db.prepare(`INSERT OR REPLACE INTO ${table} (id, payload, updated_at) VALUES (?, ?, ?)`).run(
    id,
    JSON.stringify(payload),
    new Date().toISOString(),
  );
  broadcastLocalUpdate({
    type: 'document-update',
    table,
    id,
    payload,
  });
  response.status(202).json({ status: 'updated' });
});

server.listen(port, async () => {
  initializeLocalDb();
  startHotspotBroadcaster(server);
  startSyncManager();
  await pullFromFirestore().catch(() => undefined);
  console.log(`Offline server listening on port ${port}`);
});
