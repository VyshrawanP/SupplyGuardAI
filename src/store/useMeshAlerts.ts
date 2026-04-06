import { create } from 'zustand';
import { meshDbHasAlert, meshDbListAlerts, meshDbPruneOlderThan, meshDbUpsertAlert } from '../lib/mesh/alertsDb';
import { MeshClient } from '../lib/mesh/meshClient';
import type { MeshAlert, MeshAlertSeverity, MeshWireMessage } from '../lib/mesh/types';

type MeshStatus = 'idle' | 'connecting' | 'online' | 'error';

type MeshAlertsState = {
  status: MeshStatus;
  started: boolean;
  peerId: string | null;
  peerCount: number;
  alerts: MeshAlert[];
  error: string | null;
  start: () => Promise<void>;
  stop: () => void;
  broadcast: (input: {
    message: string;
    severity: MeshAlertSeverity;
    location: { lat: number; lng: number };
    ttl?: number;
  }) => Promise<void>;
};

const seenIds = new Set<string>();

let client: MeshClient | null = null;

const buildSignalingUrl = () => {
  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${proto}//${window.location.host}/mesh`;
};

const normalizeAlert = (alert: MeshAlert): MeshAlert => ({
  ...alert,
  ttl: Math.max(0, Math.min(16, Math.floor(alert.ttl))),
  hops: Math.max(0, Math.min(64, Math.floor(alert.hops))),
});

export const useMeshAlerts = create<MeshAlertsState>((set, get) => ({
  status: 'idle',
  started: false,
  peerId: null,
  peerCount: 0,
  alerts: [],
  error: null,
  start: async () => {
    if (get().started) return;
    set({ started: true, status: 'connecting', error: null });

    try {
      const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      await meshDbPruneOlderThan(cutoff);
      const existing = await meshDbListAlerts(200);
      existing.forEach((a) => seenIds.add(a.id));
      set({ alerts: existing.map(({ receivedAt: _receivedAt, ...alert }) => alert) });

      client = new MeshClient(
        {
          signalingUrl: buildSignalingUrl(),
          maxRelayRttMs: 280,
        },
        {
          onPeerCount: (count) => set({ peerCount: count, peerId: client?.id ?? null }),
          onAlert: async (alert, meta) => {
            const state = get();
            const normalized = normalizeAlert(alert);

            if (seenIds.has(normalized.id)) {
              return;
            }

            // Extra safety: check durable store to dedupe across refresh.
            if (await meshDbHasAlert(normalized.id)) {
              seenIds.add(normalized.id);
              return;
            }

            seenIds.add(normalized.id);
            await meshDbUpsertAlert(normalized);
            set({ alerts: [normalized, ...state.alerts].slice(0, 200) });

            // Relay automatically (mesh behavior) with hop-based TTL.
            if (normalized.ttl > 0) {
              const relayed: MeshAlert = {
                ...normalized,
                ttl: normalized.ttl - 1,
                hops: normalized.hops + 1,
              };
              const msg: MeshWireMessage = { kind: 'mesh_alert', alert: relayed };
              client?.broadcastWireMessage(msg, meta.fromPeerId);
            }
          },
          onDebug: (message, extra) => {
            // Keep console-only; UI stays calm even if mesh is noisy.
            // eslint-disable-next-line no-console
            console.debug('[mesh]', message, extra ?? '');
          },
        },
      );

      await client.connect();
      set({ status: 'online', peerId: client.id ?? null });
    } catch (error) {
      set({ status: 'error', error: error instanceof Error ? error.message : 'mesh_start_failed' });
    }
  },
  stop: () => {
    client?.disconnect();
    client = null;
    set({ status: 'idle', started: false, peerCount: 0, peerId: null });
  },
  broadcast: async ({ message, severity, location, ttl = 4 }) => {
    const peerId = get().peerId ?? 'unknown';
    const id = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const alert: MeshAlert = normalizeAlert({
      id,
      message: message.trim(),
      location,
      timestamp: new Date().toISOString(),
      severity,
      ttl,
      hops: 0,
      originPeerId: peerId,
    });

    if (!alert.message) return;

    const state = get();
    if (!seenIds.has(alert.id)) {
      seenIds.add(alert.id);
      await meshDbUpsertAlert(alert);
      set({ alerts: [alert, ...state.alerts].slice(0, 200) });
    }

    const msg: MeshWireMessage = { kind: 'mesh_alert', alert };
    client?.broadcastWireMessage(msg);
  },
}));

