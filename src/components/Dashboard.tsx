import { useMemo } from 'react';
import { Ambulance, Building2, Download, MapPinned, RotateCcw, ScrollText, Timer } from 'lucide-react';
import { Map } from './Map';
import { useStore } from '../store/useStore';
import { BrandHero } from './sections/BrandHero';
import { KPIDashboard } from './sections/KPIDashboard';
import { SimulationControls } from './sections/SimulationControls';
import { AIWhatIfBriefing } from './sections/AIWhatIfBriefing';
import { ServiceOrchestration } from './sections/ServiceOrchestration';
import { SystemAlerts } from './sections/SystemAlerts';
import { HospitalOperationsView } from './sections/HospitalOperationsView';
import { LocalityIntelligence } from './sections/LocalityIntelligence';
import { LiveOperationsStats } from './sections/LiveOperationsStats';
import { NotificationFeed } from './sections/NotificationFeed';
import { StatusBadge } from './ui/StatusBadge';
import { EfficiencySnapshot } from './sections/EfficiencySnapshot';
import { INDIA_SCENARIO_CUSTOM_ID } from '../store/indiaScenarioPresets';

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
  const {
    settings,
    localities,
    hospitals,
    routes,
    alerts,
    missions,
    fleet,
    timeline,
    summary,
    aiBriefing,
    comparisons,
    notifications,
    operations,
    selectedLocalityId,
    selectedHospitalId,
    updateSimulation,
    selectLocality,
    selectHospital,
    resetSimulation,
  } = useStore();

  const selectedLocality = useMemo(
    () => localities.find((item) => item.id === selectedLocalityId) ?? localities[0],
    [localities, selectedLocalityId],
  );

  const supportedHospitals = useMemo(
    () => hospitals.filter((hospital) => selectedLocality.hospitalIds.includes(hospital.id)),
    [hospitals, selectedLocality.hospitalIds],
  );

  const topRoutes = useMemo(
    () => routes.slice().sort((a, b) => b.riskScore - a.riskScore).slice(0, 4),
    [routes],
  );

  const visibleMissions = useMemo(
    () => missions.filter((mission) => mission.localityId === selectedLocality.id).slice(0, 6),
    [missions, selectedLocality.id],
  );

  const routeWarnings = routes.filter((route) => route.status !== 'open').length;
  const signalQuality = Math.max(
    35,
    Math.min(99, Math.round((summary.autonomyScore + aiBriefing.confidence + (100 - routeWarnings * 8)) / 3)),
  );
  const signalLabel = signalQuality > 80 ? 'Field ready' : signalQuality > 60 ? 'Stable' : 'Weak zones';
  const recentNotifications = useMemo(() => notifications.slice(0, 10), [notifications]);

  const mapBadges = (
    <div className="grid gap-2 sm:grid-cols-3">
      <div className="panel-surface px-3 py-2">
        <StatusBadge icon={<Ambulance className="h-3.5 w-3.5" />} label="Fleet" value={`${fleet.length}`} />
      </div>
      <div className="panel-surface px-3 py-2">
        <StatusBadge icon={<Building2 className="h-3.5 w-3.5" />} label="Hospitals" value={`${hospitals.length}`} />
      </div>
      <div className="panel-surface px-3 py-2">
        <StatusBadge icon={<MapPinned className="h-3.5 w-3.5" />} label="Routes" value={`${routes.length}`} />
      </div>
    </div>
  );

  return (
    <div className="dashboard-shell min-h-screen text-white">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-black/70 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-[1320px] items-center justify-between gap-4 px-4 py-4 lg:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="landing-mark flex h-8 w-8 items-center justify-center rounded">
              <span className="text-sm font-bold text-black">SG</span>
            </div>
            <div className="min-w-0">
              <p className="truncate text-[11px] uppercase tracking-[0.35em] text-white/60">SupplyGuard AI</p>
              <h1 className="mt-1 truncate text-lg font-semibold text-white">Command Console</h1>
            </div>
          </div>

          <div className="hidden items-center gap-2 sm:flex">
            {onOpenProject ? (
              <button type="button" onClick={onOpenProject} className="btn-outline">
                <ScrollText className="h-4 w-4" />
                Docs
              </button>
            ) : null}
            {onOpenProjectDoc ? (
              <button type="button" onClick={() => onOpenProjectDoc('judge-quickstart')} className="btn-outline">
                <Timer className="h-4 w-4" />
                Quickstart
              </button>
            ) : null}
            {onOpenDownloads ? (
              <button type="button" onClick={onOpenDownloads} className="btn-outline">
                <Download className="h-4 w-4" />
                Downloads
              </button>
            ) : null}
            {onOpenHistory ? (
              <button type="button" onClick={onOpenHistory} className="btn-outline">
                <MapPinned className="h-4 w-4" />
                Replay
              </button>
            ) : null}
            <button type="button" onClick={resetSimulation} className="btn-outline">
              <RotateCcw className="h-4 w-4" />
              Reset
            </button>
            <div className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70">
              Signal {signalQuality}% {signalLabel}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-[1320px] flex-col gap-6 px-4 py-6 lg:px-6 lg:py-8">
        <section className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)] xl:items-start">
          <aside className="flex flex-col gap-6">
            <div className="panel-surface rounded-[28px] p-5">
              <BrandHero />
              <div className="mt-5">
                <KPIDashboard summary={summary} />
              </div>
            </div>

            <SimulationControls
              settings={settings}
              localityOptions={localities.map((locality) => ({ id: locality.id, name: locality.name }))}
              onReset={resetSimulation}
              onLocalityChange={(value) => {
                updateSimulation({ scenarioPresetId: INDIA_SCENARIO_CUSTOM_ID, localityFocus: value });
                selectLocality(value);
              }}
              onModeChange={(value) =>
                updateSimulation({ scenarioPresetId: INDIA_SCENARIO_CUSTOM_ID, disasterMode: value })
              }
              onSimulationChange={updateSimulation}
            />

            <EfficiencySnapshot
              summary={summary}
              aiBriefing={aiBriefing}
              missions={missions}
              routes={routes}
              hospitals={hospitals}
              scenarioPresetId={settings.scenarioPresetId}
            />

            <AIWhatIfBriefing briefing={aiBriefing} comparisons={comparisons} />
          </aside>

          <section className="flex flex-col gap-6">
            <div className="panel-surface rounded-[28px] p-4 sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="section-kicker">Command map</p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">Live operations</h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-white/70">
                    Tune intensity to see routing risk, mission queues, and hospital strain update together.
                  </p>
                </div>
                <div className="hidden flex-col items-end gap-2 sm:flex">
                  <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/80">
                    Signal {signalQuality}% {signalLabel}
                  </div>
                  {mapBadges}
                </div>
              </div>
              <div className="mt-4">
                <Map />
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="panel-surface rounded-[28px] p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="section-kicker">Locality</p>
                    <h2 className="mt-2 text-xl font-semibold text-white">Intelligence</h2>
                  </div>
                  <div className="text-right text-xs text-white/60">
                    Active focus: <span className="text-white/85">{selectedLocality?.name ?? '—'}</span>
                  </div>
                </div>
                <div className="mt-4">
                  <LocalityIntelligence
                    locality={selectedLocality}
                    hospitals={supportedHospitals}
                    fleet={fleet.slice(0, 5)}
                    routes={topRoutes}
                    timeline={timeline}
                  />
                </div>
              </div>

              <div className="grid gap-6">
                <SystemAlerts alerts={alerts} />
                <LiveOperationsStats stats={operations} />
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <ServiceOrchestration missions={visibleMissions} />
              <HospitalOperationsView
                hospitals={hospitals}
                selectedHospitalId={selectedHospitalId}
                onSelectHospital={selectHospital}
              />
            </div>

            <NotificationFeed notifications={recentNotifications} />
          </section>
        </section>
      </main>

      <footer className="border-t border-white/10 bg-black/60">
        <div className="mx-auto flex max-w-[1320px] flex-col gap-3 px-4 py-6 text-sm text-white/60 sm:flex-row sm:items-center sm:justify-between lg:px-6">
          <p>SupplyGuard AI</p>
          <p>Offline-friendly simulation | Command console</p>
        </div>
      </footer>
    </div>
  );
};
