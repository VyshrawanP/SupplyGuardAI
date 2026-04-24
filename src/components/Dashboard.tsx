import { useMemo, useState } from 'react';
import {
  Ambulance, Building2, MapPinned, RotateCcw,
  Play, Pause, FastForward, Map as MapIcon, Activity,
  Radio, Package, Plane, Wifi, WifiOff, Smartphone
} from 'lucide-react';
import { Map } from './Map';
import { useStore } from '../store/useStore';
import { KPIDashboard } from './sections/KPIDashboard';
import { SimulationControls } from './sections/SimulationControls';
import { ServiceOrchestration } from './sections/ServiceOrchestration';
import { HospitalOperationsView } from './sections/HospitalOperationsView';
import { LiveEventFeed } from './sections/LiveEventFeed';
import { StatusBadge } from './ui/StatusBadge';
import { INDIA_SCENARIO_CUSTOM_ID } from '../store/indiaScenarioPresets';
import { useSimulationClock } from '../hooks/useSimulationClock';
import { useAlertSound } from '../hooks/useAlertSound';
import logoSrc from '../assets/logo.png';

type Tab = 'map' | 'response' | 'apps';

export const Dashboard = ({
  onOpenHistory,
  onOpenProject,
  onOpenProjectDoc,
  onOpenDownloads,
}: {
  onOpenHistory?: () => void;
  onOpenProject?: () => void;
  onOpenProjectDoc?: (docId: string) => void;
  onOpenDownloads?: () => void;
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('map');
  const {
    settings, localities, hospitals, routes, alerts, missions, fleet,
    summary, aiBriefing, comparisons, notifications, operations,
    selectedLocalityId, selectedHospitalId,
    updateSimulation, selectLocality, selectHospital, resetSimulation,
  } = useStore();

  const clock = useSimulationClock();
  const criticalHospitalCount = hospitals.filter(h => h.status === 'critical').length;
  useAlertSound(criticalHospitalCount);

  const selectedLocality = useMemo(
    () => localities.find((item) => item.id === selectedLocalityId) ?? localities[0],
    [localities, selectedLocalityId],
  );

  const visibleMissions = useMemo(
    () => missions.filter((m) => m.localityId === selectedLocality.id).slice(0, 6),
    [missions, selectedLocality.id],
  );

  const phaseColor = clock.phase === 'Peak' ? '#ef4444' : clock.phase === 'Escalation' ? '#f59e0b' : clock.phase === 'Recovery' ? '#22c55e' : '#94a3b8';

  const tabs: Array<{ id: Tab; label: string; icon: React.ReactNode }> = [
    { id: 'map', label: 'Live Map', icon: <MapIcon className="h-4 w-4" /> },
    { id: 'response', label: 'Response', icon: <Activity className="h-4 w-4" /> },
    { id: 'apps', label: 'How It Works', icon: <Smartphone className="h-4 w-4" /> },
  ];

  return (
    <div className="dashboard-shell min-h-screen text-white">
      {/* ═══════════ HEADER ═══════════ */}
      <header className="sticky top-0 z-[1000] border-b border-white/10 bg-black/80 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-[1320px] items-center justify-between gap-4 px-4 py-3 lg:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <img src={logoSrc} alt="SupplyGuard AI" className="h-8 w-8 rounded" />
            <div className="min-w-0">
              <h1 className="truncate text-base font-semibold text-white">SupplyGuard AI</h1>
              <p className="truncate text-[11px] text-white/50">Command Console</p>
            </div>
          </div>

          {/* ── Tab Navigation ── */}
          <nav className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 p-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-sky-500/20 text-sky-300 shadow-sm'
                    : 'text-white/60 hover:text-white/90'
                }`}
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button type="button" onClick={resetSimulation} className="btn-outline">
              <RotateCcw className="h-4 w-4" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          </div>
        </div>

        {/* ── Clock Strip ── */}
        <div className="border-t border-white/5 bg-black/40">
          <div className="mx-auto flex max-w-[1320px] items-center justify-between gap-4 px-4 py-2 lg:px-6">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={clock.toggleRunning}
                className="flex h-7 w-7 items-center justify-center rounded-full border border-white/15 transition-colors hover:bg-white/10"
                aria-label={clock.running ? 'Pause' : 'Play'}
                id="sim-play-pause"
              >
                {clock.running ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3 ml-0.5" />}
              </button>
              <span className="font-mono text-sm font-bold tabular-nums" style={{ color: clock.running ? '#0ea5e9' : 'rgba(255,255,255,0.4)' }}>
                {clock.simTime}
              </span>
              <button
                type="button"
                onClick={clock.cycleSpeed}
                className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] font-semibold hover:bg-white/10"
                id="sim-speed"
              >
                <FastForward className="mr-1 inline h-3 w-3" />{clock.speed}x
              </button>
            </div>

            <div className="flex items-center gap-3">
              {/* Quick KPIs inline */}
              <span className="hidden text-xs text-white/40 md:inline">
                Risk {summary.averageRisk}% · {summary.missionsRequired} missions · {criticalHospitalCount} critical
              </span>
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                style={{ color: phaseColor, background: `${phaseColor}12`, border: `1px solid ${phaseColor}25` }}
              >
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: phaseColor }} />
                {clock.phase}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1320px] px-4 py-6 lg:px-6">

        {/* ═══════════ TAB: LIVE MAP ═══════════ */}
        {activeTab === 'map' && (
          <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)] xl:items-start">
            {/* Sidebar: Controls + KPIs only */}
            <aside className="flex flex-col gap-5">
              <div className="panel-surface rounded-2xl p-4">
                <KPIDashboard summary={summary} />
              </div>
              <SimulationControls
                settings={settings}
                localityOptions={localities.map(l => ({ id: l.id, name: l.name }))}
                onReset={resetSimulation}
                onLocalityChange={(v) => { updateSimulation({ scenarioPresetId: INDIA_SCENARIO_CUSTOM_ID, localityFocus: v }); selectLocality(v); }}
                onModeChange={(v) => updateSimulation({ scenarioPresetId: INDIA_SCENARIO_CUSTOM_ID, disasterMode: v })}
                onSimulationChange={updateSimulation}
              />
            </aside>

            {/* Map + Event Feed */}
            <section className="flex flex-col gap-6">
              <div className="panel-surface rounded-2xl p-4">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <h2 className="text-lg font-semibold">Live Operations Map</h2>
                  <div className="flex items-center gap-2">
                    <StatusBadge icon={<Ambulance className="h-3.5 w-3.5" />} label="Fleet" value={`${fleet.length}`} />
                    <StatusBadge icon={<Building2 className="h-3.5 w-3.5" />} label="Hospitals" value={`${hospitals.length}`} />
                  </div>
                </div>
                <Map simulationRunning={clock.running} simulationSpeed={clock.speed} />
              </div>
              <LiveEventFeed events={clock.events} />
            </section>
          </div>
        )}

        {/* ═══════════ TAB: RESPONSE ═══════════ */}
        {activeTab === 'response' && (
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Drone Auto-Delivery Feature Card */}
            <div className="panel-surface rounded-2xl p-5 lg:col-span-2">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-sky-500/15">
                  <Plane className="h-6 w-6 text-sky-300" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">Autonomous Drone Food & Medicine Delivery</h2>
                  <p className="mt-2 text-sm leading-relaxed text-white/70">
                    When roads are flooded or blocked, SupplyGuard AI automatically dispatches drones to deliver
                    medicine and food to cut-off areas. The system monitors hospital medicine stock in real-time —
                    when any hospital drops below 45% supply, an <strong className="text-white">automatic drone sortie</strong> is
                    triggered from the nearest relief hub, bypassing damaged roads entirely.
                  </p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-xl border border-white/8 bg-white/3 p-3">
                      <p className="text-2xl font-bold text-sky-300">{operations.droneSorties}</p>
                      <p className="text-xs text-white/50">Active drone sorties</p>
                    </div>
                    <div className="rounded-xl border border-white/8 bg-white/3 p-3">
                      <p className="text-2xl font-bold text-amber-300">{operations.autoOrdersTriggered}</p>
                      <p className="text-xs text-white/50">Auto-orders triggered</p>
                    </div>
                    <div className="rounded-xl border border-white/8 bg-white/3 p-3">
                      <p className="text-2xl font-bold text-emerald-300">{operations.currentFoodStock}%</p>
                      <p className="text-xs text-white/50">Current food stock</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <ServiceOrchestration missions={visibleMissions} />
            <HospitalOperationsView
              hospitals={hospitals}
              selectedHospitalId={selectedHospitalId}
              onSelectHospital={selectHospital}
            />
          </div>
        )}

        {/* ═══════════ TAB: HOW IT WORKS ═══════════ */}
        {activeTab === 'apps' && (
          <div className="grid gap-6">
            {/* Offline Mesh Communication */}
            <div className="panel-surface rounded-2xl p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-500/15">
                  <WifiOff className="h-6 w-6 text-amber-300" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">How Victims Reach Command — Without Internet</h2>
                  <p className="mt-2 text-sm leading-relaxed text-white/60">
                    During disasters, cell towers fail. SupplyGuard AI uses a <strong className="text-white">3-app offline mesh network</strong> so
                    victims, volunteers, and command operators stay connected even with zero internet.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              {/* App 1: Victim */}
              <div className="panel-surface rounded-2xl p-5">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-500/15">
                    <Radio className="h-5 w-5 text-rose-300" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Victim App</h3>
                    <p className="text-xs text-white/50">For people in danger</p>
                  </div>
                </div>
                <ul className="space-y-2 text-sm text-white/70">
                  <li className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-400" />
                    <span>Send SOS with GPS location — <strong className="text-white">no internet needed</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-400" />
                    <span>Uses <strong className="text-white">Bluetooth mesh</strong> to relay SOS to nearby phones</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-400" />
                    <span>Receive rescue ETA and shelter directions offline</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-400" />
                    <span>Share medical info for hospital triage prep</span>
                  </li>
                </ul>
                <div className="mt-4 rounded-lg bg-rose-500/8 px-3 py-2 text-xs text-rose-200">
                  📱 Works with zero connectivity — mesh range up to 100m per hop
                </div>
              </div>

              {/* App 2: Volunteer */}
              <div className="panel-surface rounded-2xl p-5">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/15">
                    <Wifi className="h-5 w-5 text-emerald-300" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Volunteer App</h3>
                    <p className="text-xs text-white/50">For field responders</p>
                  </div>
                </div>
                <ul className="space-y-2 text-sm text-white/70">
                  <li className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                    <span>Receive victim SOS locations via mesh relay</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                    <span>Acts as a <strong className="text-white">mesh bridge</strong> — relays data toward internet-connected nodes</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                    <span>Report road conditions and blocked routes offline</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                    <span>Get AI-optimized rescue routes when any connection restores</span>
                  </li>
                </ul>
                <div className="mt-4 rounded-lg bg-emerald-500/8 px-3 py-2 text-xs text-emerald-200">
                  🔗 Bridge between offline victims and online command
                </div>
              </div>

              {/* App 3: Command */}
              <div className="panel-surface rounded-2xl p-5">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-500/15">
                    <MapIcon className="h-5 w-5 text-sky-300" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Command App</h3>
                    <p className="text-xs text-white/50">This dashboard</p>
                  </div>
                </div>
                <ul className="space-y-2 text-sm text-white/70">
                  <li className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-400" />
                    <span>Aggregates all SOS reports onto the live map</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-400" />
                    <span>AI dispatches ambulances, drones, food convoys automatically</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-400" />
                    <span>Tracks hospital bed availability in real-time</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-400" />
                    <span>Full <strong className="text-white">offline mode</strong> — simulation runs locally without server</span>
                  </li>
                </ul>
                <div className="mt-4 rounded-lg bg-sky-500/8 px-3 py-2 text-xs text-sky-200">
                  🖥️ Works offline with local simulation engine
                </div>
              </div>
            </div>

            {/* Data Flow Diagram */}
            <div className="panel-surface rounded-2xl p-6">
              <h3 className="text-lg font-semibold mb-4">Offline Data Flow</h3>
              <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-0">
                <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 px-4 py-3 text-center">
                  <p className="text-sm font-semibold text-rose-300">Victim Phone</p>
                  <p className="text-xs text-white/40 mt-1">SOS + GPS</p>
                </div>
                <div className="text-white/30 text-xs sm:px-3">→ Bluetooth Mesh →</div>
                <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 text-center">
                  <p className="text-sm font-semibold text-emerald-300">Volunteer Phone</p>
                  <p className="text-xs text-white/40 mt-1">Relay Bridge</p>
                </div>
                <div className="text-white/30 text-xs sm:px-3">→ Wi-Fi/Cell →</div>
                <div className="rounded-xl bg-sky-500/10 border border-sky-500/20 px-4 py-3 text-center">
                  <p className="text-sm font-semibold text-sky-300">Command Console</p>
                  <p className="text-xs text-white/40 mt-1">AI Dispatch</p>
                </div>
                <div className="text-white/30 text-xs sm:px-3">→ Auto →</div>
                <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 px-4 py-3 text-center">
                  <p className="text-sm font-semibold text-amber-300">Drone / Ambulance</p>
                  <p className="text-xs text-white/40 mt-1">Rescue + Supply</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-white/8 bg-black/50">
        <div className="mx-auto flex max-w-[1320px] items-center justify-between px-4 py-4 text-xs text-white/40 lg:px-6">
          <p>SupplyGuard AI · Google Solution Challenge 2026</p>
          <p>Offline-ready disaster coordination</p>
        </div>
      </footer>
    </div>
  );
};
