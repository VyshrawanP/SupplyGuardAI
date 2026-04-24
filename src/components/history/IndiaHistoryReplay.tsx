import { useEffect, useMemo, useState } from 'react';
import L from 'leaflet';
import { Circle, MapContainer, Marker, Polyline, TileLayer, useMap } from 'react-leaflet';
import { ArrowLeft, Pause, Play, RotateCcw, MapPinned } from 'lucide-react';
import { renderToStaticMarkup } from 'react-dom/server';
import { GlassCard } from '../ui/GlassCard';
import { MetricCard } from '../ui/MetricCard';
import { indiaHistoryReplayScenarios, type HistoryMarker, type IndiaHistoryReplayScenario } from '../../store/indiaHistoryReplays';

type LatLng = { lat: number; lng: number };

const resolveTileUrlTemplate = () => {
  const explicit = (import.meta.env.VITE_TILE_URL_TEMPLATE || '').trim();
  if (explicit) return explicit;

  const tileServerBase = (import.meta.env.VITE_LOCAL_TILESERVER_URL || '').trim();
  if (tileServerBase) {
    const base = tileServerBase.endsWith('/') ? tileServerBase.slice(0, -1) : tileServerBase;
    const style = (import.meta.env.VITE_TILE_STYLE || 'basic').trim() || 'basic';
    return `${base}/styles/${encodeURIComponent(style)}/{z}/{x}/{y}.png`;
  }

  return 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
};

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function computeEfficiencyScore(phase: {
  autonomyScore: number;
  aiConfidence: number;
  avgEtaMinutes: number;
  blockedRoutes: number;
  medicineCoverage: number;
  foodCoverage: number;
  criticalMissions: number;
}) {
  const etaPenalty = clamp(100 - phase.avgEtaMinutes, 15, 100);
  const blockedPenalty = clamp(100 - phase.blockedRoutes * 10, 30, 100);
  const criticalPenalty = clamp(100 - phase.criticalMissions * 4, 20, 100);
  const coverage = Math.round((phase.medicineCoverage + phase.foodCoverage) / 2);

  return Math.round(
    clamp(
      phase.autonomyScore * 0.28 +
        phase.aiConfidence * 0.18 +
        coverage * 0.22 +
        etaPenalty * 0.18 +
        blockedPenalty * 0.08 +
        criticalPenalty * 0.06,
    ),
  );
}

const divMarkerIcon = (html: string, className: string, size: [number, number], anchor: [number, number]) =>
  L.divIcon({ html, className, iconSize: size, iconAnchor: anchor });

const markerTone = (type: HistoryMarker['type']) => {
  switch (type) {
    case 'hub':
      return { bg: '#67e8f9', fg: '#082f49', border: 'rgba(255,255,255,0.85)' };
    case 'hospital':
      return { bg: '#34d399', fg: '#052e16', border: 'rgba(255,255,255,0.85)' };
    case 'shelter':
      return { bg: '#c4b5fd', fg: '#1e1b4b', border: 'rgba(255,255,255,0.85)' };
    default:
      return { bg: '#fb7185', fg: '#4c0519', border: 'rgba(255,255,255,0.85)' };
  }
};

const replayMarkerIcon = (marker: HistoryMarker) => {
  const tone = markerTone(marker.type);
  return divMarkerIcon(
    renderToStaticMarkup(
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          borderRadius: 999,
          padding: '6px 10px',
          border: `1px solid ${tone.border}`,
          background: tone.bg,
          color: tone.fg,
          boxShadow: '0 10px 24px rgba(2,8,23,0.35)',
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: '0.06em',
        }}
      >
        <span>{marker.type === 'hub' ? 'HUB' : marker.type === 'impact' ? 'IMPACT' : marker.type.toUpperCase()}</span>
        <span style={{ fontWeight: 700, letterSpacing: 'normal' }}>{marker.label}</span>
      </div>,
    ),
    'leaflet-replay-marker',
    [140, 28],
    [70, 14],
  );
};

function MapController({ center, zoom }: { center: LatLng; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom, { animate: true, duration: 0.6 });
  }, [center.lat, center.lng, zoom, map]);
  return null;
}

export function IndiaHistoryReplay({
  onBack,
}: {
  onBack: () => void;
}) {
  const [scenarioId, setScenarioId] = useState(indiaHistoryReplayScenarios[0]?.id ?? 'kerala-floods-2018');
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<1 | 2 | 4 | 8>(1);

  const scenario: IndiaHistoryReplayScenario = useMemo(() => {
    return indiaHistoryReplayScenarios.find((item) => item.id === scenarioId) ?? indiaHistoryReplayScenarios[0];
  }, [scenarioId]);

  const phases = scenario.phases;
  const phase = phases[Math.min(phaseIndex, phases.length - 1)];
  const efficiencyScore = computeEfficiencyScore(phase);

  const impactMarker = scenario.markers.find((marker) => marker.type === 'impact') ?? scenario.markers[0];
  const center = scenario.map.center;

  const routeLines = useMemo(() => {
    const impact = impactMarker ? { lat: impactMarker.lat, lng: impactMarker.lng } : center;
    const hubs = scenario.markers.filter((marker) => marker.type === 'hub');
    return hubs.map((hub) => ({
      id: `${hub.id}->impact`,
      points: [
        { lat: hub.lat, lng: hub.lng },
        impact,
      ] satisfies LatLng[],
    }));
  }, [scenario.markers, impactMarker, center]);

  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => {
      setPhaseIndex((current) => (current + 1) % phases.length);
    }, Math.max(260, Math.round(2200 / speed)));
    return () => window.clearInterval(timer);
  }, [playing, phases.length, speed]);

  useEffect(() => {
    setPhaseIndex(0);
    setPlaying(false);
    setSpeed(1);
  }, [scenarioId]);

  const severityRadiusMeters = Math.max(15_000, Math.round(scenario.map.radiusKm * 1000 * (0.65 + phase.severity / 160)));

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#070b14_0%,#0d1423_42%,#0f1b30_100%)] text-white">
      <header className="sticky top-0 z-50 border-b border-slate-500/30 bg-slate-950/70 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-[1480px] items-center justify-between gap-4 px-4 py-4 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
            <div>
              <p className="text-[11px] uppercase tracking-[0.35em] text-cyan-200/80">History replay</p>
              <h1 className="mt-1 text-lg font-semibold text-white">Past disaster scenarios with map playback</h1>
            </div>
          </div>
          <div className="hidden items-center gap-3 md:flex">
            <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200">
              Phase {phaseIndex + 1}/{phases.length} • {speed}x
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <MapPinned className="h-4 w-4 text-cyan-300" />
              India map view
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-[1480px] gap-6 px-4 py-6 lg:grid-cols-[360px_minmax(0,1fr)_360px] lg:px-8 lg:py-8">
        <section className="flex flex-col gap-5">
          <GlassCard className="panel-surface p-4">
            <p className="text-[11px] uppercase tracking-[0.3em] text-slate-400">Scenario</p>
            <h2 className="mt-1 text-lg font-semibold">{scenario.title} ({scenario.year})</h2>
            <p className="mt-2 text-sm text-slate-300">{scenario.inspiredBy}</p>
            <p className="mt-2 text-sm text-slate-200">{scenario.judgeGoal}</p>

            <label className="field-label mt-4" htmlFor="history-scenario">Choose scenario</label>
            <select
              id="history-scenario"
              className="input-surface"
              value={scenarioId}
              onChange={(event) => setScenarioId(event.target.value)}
            >
              {indiaHistoryReplayScenarios.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title} ({item.year})
                </option>
              ))}
            </select>
          </GlassCard>

          <GlassCard className="panel-surface p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.3em] text-slate-400">Playback</p>
                <h3 className="mt-1 text-lg font-semibold">Timeline</h3>
              </div>
              <div className="flex items-center gap-2">
                <div className="hidden items-center rounded-full border border-white/10 bg-white/5 p-1 sm:flex">
                  {[1, 2, 4, 8].map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setSpeed(value as 1 | 2 | 4 | 8)}
                      className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                        speed === value ? 'bg-emerald-500/15 text-emerald-200' : 'text-slate-300 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      {value}x
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setPhaseIndex(0)}
                  className="ghost-button"
                  title="Restart"
                >
                  <RotateCcw className="h-4 w-4" />
                  Restart
                </button>
                <button
                  type="button"
                  onClick={() => setPlaying((current) => !current)}
                  className="ghost-button"
                  title={playing ? 'Pause' : 'Play'}
                >
                  {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  {playing ? 'Pause' : 'Play'}
                </button>
              </div>
            </div>

            <div className="mt-3 grid gap-2">
              {phases.map((item, index) => {
                const active = index === phaseIndex;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setPlaying(false);
                      setPhaseIndex(index);
                    }}
                    className={`w-full rounded-2xl border px-3 py-2 text-left transition ${
                      active ? 'border-cyan-300/50 bg-cyan-300/10' : 'border-white/10 bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs font-semibold text-slate-300">{item.minute}</span>
                      <span className="text-xs text-slate-400">Severity {item.severity}%</span>
                    </div>
                    <p className="mt-1 text-sm font-semibold text-white">{item.title}</p>
                    <p className="mt-1 text-sm text-slate-300">{item.note}</p>
                  </button>
                );
              })}
            </div>
          </GlassCard>
        </section>

        <section className="flex flex-col gap-5">
          <GlassCard className="panel-surface p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.3em] text-slate-400">Map</p>
                <h2 className="mt-1 text-lg font-semibold text-white">Replay map</h2>
              </div>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-slate-200">
                {phase.minute} • {phase.title}
              </span>
            </div>

            <div className="mt-3 overflow-hidden rounded-[22px] border border-white/10">
              <MapContainer
                center={center}
                zoom={scenario.map.zoom}
                scrollWheelZoom={false}
                style={{ height: 520, width: '100%' }}
              >
                <TileLayer
                  attribution='&copy; OpenStreetMap contributors'
                  url={resolveTileUrlTemplate()}
                />
                <MapController center={center} zoom={scenario.map.zoom} />

                {scenario.markers.map((marker) => (
                  <Marker
                    key={marker.id}
                    position={{ lat: marker.lat, lng: marker.lng }}
                    icon={replayMarkerIcon(marker)}
                  />
                ))}

                {impactMarker ? (
                  <Circle
                    center={{ lat: impactMarker.lat, lng: impactMarker.lng }}
                    radius={severityRadiusMeters}
                    pathOptions={{
                      color: '#38bdf8',
                      weight: 2,
                      fillColor: '#38bdf8',
                      fillOpacity: 0.12 + phase.severity / 900,
                    }}
                  />
                ) : null}

                {routeLines.map((route) => (
                  <Polyline
                    key={route.id}
                    positions={route.points}
                    pathOptions={{
                      color: '#facc15',
                      weight: 3,
                      opacity: 0.45,
                      dashArray: '6 8',
                    }}
                  />
                ))}
              </MapContainer>
            </div>
          </GlassCard>
        </section>

        <section className="flex flex-col gap-5">
          <GlassCard className="panel-surface p-4">
            <p className="text-[11px] uppercase tracking-[0.3em] text-slate-400">Judge view</p>
            <h2 className="mt-1 text-lg font-semibold text-white">Efficiency</h2>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <MetricCard label="Efficiency score" value={`${efficiencyScore}%`} />
              <MetricCard label="AI confidence" value={`${phase.aiConfidence}%`} />
              <MetricCard label="Autonomy" value={`${phase.autonomyScore}%`} />
              <MetricCard label="Avg ETA" value={`${phase.avgEtaMinutes} min`} />
              <MetricCard label="Critical missions" value={`${phase.criticalMissions}`} />
              <MetricCard label="Blocked routes" value={`${phase.blockedRoutes}`} />
              <MetricCard label="Medicine cover" value={`${phase.medicineCoverage}%`} />
              <MetricCard label="Food cover" value={`${phase.foodCoverage}%`} />
            </div>

            <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/50 p-3 text-sm text-slate-300">
              <p className="font-semibold text-slate-200">What to judge</p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>As severity rises, does the system keep ETA from exploding?</li>
                <li>Do medicine/food coverage and autonomy recover over phases?</li>
                <li>Are blocked routes handled via staging hubs and alternative dispatch?</li>
              </ul>
            </div>
          </GlassCard>
        </section>
      </main>
    </div>
  );
}
