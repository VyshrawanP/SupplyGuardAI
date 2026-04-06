import { useMemo, useState } from 'react';
import { Radio, Send } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { useMeshAlerts } from '../../store/useMeshAlerts';
import type { MeshAlertSeverity } from '../../lib/mesh/types';

const severityTone: Record<MeshAlertSeverity, string> = {
  low: 'border-emerald-400/20 bg-emerald-500/10 text-emerald-100',
  medium: 'border-amber-400/20 bg-amber-500/10 text-amber-100',
  high: 'border-orange-400/20 bg-orange-500/10 text-orange-100',
  critical: 'border-rose-400/20 bg-rose-500/10 text-rose-100',
};

export function MeshAlertsPanel() {
  const { status, peerCount, peerId, alerts, broadcast } = useMeshAlerts();
  const [message, setMessage] = useState('');
  const [severity, setSeverity] = useState<MeshAlertSeverity>('high');
  const [lat, setLat] = useState('12.9716');
  const [lng, setLng] = useState('77.5946');

  const statusLabel = useMemo(() => {
    if (status === 'connecting') return 'Connecting';
    if (status === 'online') return 'Mesh live';
    if (status === 'error') return 'Mesh error';
    return 'Idle';
  }, [status]);

  const badgeTone =
    status === 'online'
      ? 'bg-emerald-500/15 text-emerald-100 border-emerald-400/20'
      : status === 'connecting'
        ? 'bg-amber-500/15 text-amber-100 border-amber-400/20'
        : status === 'error'
          ? 'bg-rose-500/15 text-rose-100 border-rose-400/20'
          : 'bg-white/6 text-slate-200 border-white/10';

  return (
    <GlassCard className="panel-surface rounded-[30px] p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Radio className="h-4 w-4 text-cyan-300" />
          <h3 className="text-xl font-semibold">Offline mesh alerts</h3>
        </div>
        <div className={`rounded-full border px-3 py-1 text-xs ${badgeTone}`}>
          {statusLabel} | {peerCount} peers
        </div>
      </div>

      <p className="mt-2 text-sm leading-6 text-slate-300">
        Broadcasts alerts directly to nearby devices on the same LAN/hotspot, stores them in IndexedDB, dedupes by ID, and relays with a hop-based TTL.
      </p>

      <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_180px]">
        <input
          className="input-surface"
          value={message}
          placeholder="Type an emergency alert message"
          onChange={(e) => setMessage(e.target.value)}
        />
        <button
          className="ghost-button justify-center"
          onClick={() =>
            void broadcast({
              message,
              severity,
              location: { lat: Number(lat) || 0, lng: Number(lng) || 0 },
            }).then(() => setMessage(''))
          }
        >
          <Send className="h-4 w-4" />
          Broadcast
        </button>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <select className="input-surface" value={severity} onChange={(e) => setSeverity(e.target.value as MeshAlertSeverity)}>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>
        <input className="input-surface" value={lat} onChange={(e) => setLat(e.target.value)} placeholder="lat" />
        <input className="input-surface" value={lng} onChange={(e) => setLng(e.target.value)} placeholder="lng" />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-400">
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Peer ID {peerId ?? '...'}</span>
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Dedupe set {Math.min(alerts.length, 200)} alerts</span>
      </div>

      <div className="mt-4 space-y-2.5">
        {alerts.slice(0, 18).map((alert) => (
          <div key={alert.id} className={`rounded-[22px] border p-3 ${severityTone[alert.severity]}`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-semibold">
                {alert.severity.toUpperCase()} | TTL {alert.ttl} | hops {alert.hops}
              </p>
              <span className="rounded-full bg-black/15 px-2 py-1 text-[10px] uppercase tracking-[0.15em]">
                {new Date(alert.timestamp).toLocaleTimeString()}
              </span>
            </div>
            <p className="mt-1.5 text-sm leading-6 text-current/90">{alert.message}</p>
            <p className="mt-1 text-xs text-current/80">
              ({alert.location.lat.toFixed(4)}, {alert.location.lng.toFixed(4)}) | origin {alert.originPeerId.slice(0, 8)}
            </p>
          </div>
        ))}
        {alerts.length === 0 ? (
          <div className="rounded-[22px] border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
            No mesh alerts yet. Open this page on two devices on the same WiFi/hotspot and broadcast a test.
          </div>
        ) : null}
      </div>
    </GlassCard>
  );
}

