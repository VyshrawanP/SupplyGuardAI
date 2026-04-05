import fs from 'node:fs';
import path from 'node:path';
import net from 'node:net';
import { broadcastLocalUpdate } from './hotspot-broadcaster';
import { pullFromFirestore, pushToFirestore } from './local-db';

const syncLogPath = path.join('/data', 'sync-log.json');

async function canReachHost(host: string, port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = net.connect({ host, port, timeout: 3000 }, () => {
      socket.end();
      resolve(true);
    });
    socket.on('error', () => resolve(false));
    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
  });
}

async function writeSyncLog(entry: Record<string, unknown>): Promise<void> {
  const existing = fs.existsSync(syncLogPath)
    ? JSON.parse(fs.readFileSync(syncLogPath, 'utf8')) as Record<string, unknown>[]
    : [];
  existing.push(entry);
  fs.writeFileSync(syncLogPath, JSON.stringify(existing, null, 2));
}

/**
 * Starts connectivity monitoring and runs bidirectional sync when the link comes back.
 */
export function startSyncManager(): void {
  let wasOnline = false;

  setInterval(async () => {
    const pingTarget = process.env.CONNECTIVITY_PING_URL || '8.8.8.8';
    const online = await canReachHost(pingTarget, 53);

    broadcastLocalUpdate({
      type: 'connectivity-status',
      online,
      checked_at: new Date().toISOString(),
    });

    if (online && !wasOnline) {
      await pushToFirestore();
      await pullFromFirestore();
      await writeSyncLog({
        synced_at: new Date().toISOString(),
        direction: 'bidirectional',
        status: 'success',
      });
    }

    wasOnline = online;
  }, 30_000);
}
