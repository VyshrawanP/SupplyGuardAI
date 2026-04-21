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
  relayConnected: boolean;
  relayClientId: string | null;
  relayPeerCount: number;
  relayPeerIds: string[];
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
let relaySse: EventSource | null = null;

const buildSignalingUrl = () => {
  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  // In local dev, some setups open the UI on `:5173` while the Express server (and mesh endpoints)
  // live on `:3000`. Prefer `:3000` unless we're already on it.
  const host = window.location.hostname;
  const port = window.location.port && window.location.port !== '3000' ? '3000' : window.location.port;
  const withPort = port ? `${host}:${port}` : host;
  return `${proto}//${withPort}/mesh`;
};

const buildRelayEventsUrl = () => {
  const proto = window.location.protocol;
  const host = window.location.hostname;
  const port = window.location.port && window.location.port !== '3000' ? '3000' : window.location.port;
  const withPort = port ? `${host}:${port}` : host;
  return `${proto}//${withPort}/mesh-relay/events`;
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
  relayConnected: false,
  relayClientId: null,
  relayPeerCount: 0,
  relayPeerIds: [],
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

      // Start LAN relay first (more reliable than WebRTC in constrained environments).
      relaySse = new EventSource(buildRelayEventsUrl());
      relaySse.onopen = () => set({ relayConnected: true });
      relaySse.onerror = () => {
        // EventSource will retry; we still keep WebRTC mesh running.
        set({ relayConnected: false, relayClientId: null, relayPeerCount: 0, relayPeerIds: [] });
      };
      relaySse.onmessage = async (event) => {
        const raw = String(event.data ?? '');
        const parsed = (() => {
          try {
            return JSON.parse(raw);
          } catch {
            return null;
          }
        })();
        if (!parsed) return;

        if (parsed?.type === 'relay-welcome' && typeof parsed.id === 'string') {
          const peers = Array.isArray(parsed.peers) ? parsed.peers : [];
          const ids = peers.map((p: any) => String(p?.id ?? '')).filter(Boolean);
          set({ relayClientId: parsed.id, relayPeerIds: ids, relayPeerCount: ids.length });
          return;
        }

        if (parsed?.type === 'relay-peer-join' && typeof parsed.id === 'string') {
          const state = get();
          const next = Array.from(new Set([...state.relayPeerIds, parsed.id]));
          set({ relayPeerIds: next, relayPeerCount: next.length });
          return;
        }

        if (parsed?.type === 'relay-peer-leave' && typeof parsed.id === 'string') {
          const state = get();
          const next = state.relayPeerIds.filter((id) => id !== parsed.id);
          set({ relayPeerIds: next, relayPeerCount: next.length });
          return;
        }

        // MeshWireMessage relay (server pass-through).
        if (parsed?.kind !== 'mesh_alert' || !parsed.alert) return;
        const alert = parsed.alert as MeshAlert;

        const state = get();
        const normalized = normalizeAlert(alert);

        if (seenIds.has(normalized.id)) {
          return;
        }

        if (await meshDbHasAlert(normalized.id)) {
          seenIds.add(normalized.id);
          return;
        }

        seenIds.add(normalized.id);
        await meshDbUpsertAlert(normalized);
        set({ alerts: [normalized, ...state.alerts].slice(0, 200) });
      };

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
    relaySse?.close();
    relaySse = null;
    set({
      status: 'idle',
      started: false,
      peerCount: 0,
      peerId: null,
      relayConnected: false,
      relayClientId: null,
      relayPeerCount: 0,
      relayPeerIds: [],
    });
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
    const relayClientId = get().relayClientId;
    if (get().relayConnected && relayClientId) {
      void fetch(`/mesh-relay/publish?sender=${encodeURIComponent(relayClientId)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(msg),
      });
    }
  },
}));
