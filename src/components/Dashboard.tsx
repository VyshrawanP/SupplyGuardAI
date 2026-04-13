import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  Activity,
  Ambulance,
  BarChart3,
  Building2,
  MapPinned,
  Wifi,
} from 'lucide-react';
import { Map } from './Map';
import { useStore } from '../store/useStore';
import { BrandHero } from './sections/BrandHero';
import { KPIDashboard } from './sections/KPIDashboard';
import { SimulationControls } from './sections/SimulationControls';
import { AIWhatIfBriefing } from './sections/AIWhatIfBriefing';
import { ServiceOrchestration } from './sections/ServiceOrchestration';
import { SystemAlerts } from './sections/SystemAlerts';
import { StressScenarioReport } from './sections/StressScenarioReport';
import { ScenarioComparisonBoard } from './sections/ScenarioComparisonBoard';
import { ResponseMatrix } from './sections/ResponseMatrix';
import { CaseStudies } from './sections/CaseStudies';
import { HospitalOperationsView } from './sections/HospitalOperationsView';
import { LocalityIntelligence } from './sections/LocalityIntelligence';
import { LiveOperationsStats } from './sections/LiveOperationsStats';
import { NotificationFeed } from './sections/NotificationFeed';
import { StatusBadge } from './ui/StatusBadge';
import { MeshAlertsPanel } from './sections/MeshAlertsPanel';
import { EfficiencySnapshot } from './sections/EfficiencySnapshot';
import { INDIA_SCENARIO_CUSTOM_ID } from '../store/indiaScenarioPresets';

type DashboardSection = 'command' | 'operations' | 'impact';

const DASHBOARD_SECTION_STORAGE_KEY = 'sg_dashboard_section';

function MiniPill({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm transition ${
        active ? 'bg-white/10 text-white' : 'text-slate-300 hover:bg-white/8 hover:text-white'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

export const Dashboard = ({ onOpenHistory }: { onOpenHistory?: () => void }) => {
  const [section, setSection] = useState<DashboardSection>(() => {
    if (typeof window === 'undefined') return 'command';
    const stored = window.localStorage.getItem(DASHBOARD_SECTION_STORAGE_KEY);
    return stored === 'operations' || stored === 'impact' || stored === 'command' ? stored : 'command';
  });

  useEffect(() => {
    window.localStorage.setItem(DASHBOARD_SECTION_STORAGE_KEY, section);
  }, [section]);

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
    stressReport,
    selectedLocalityId,
    selectedHospitalId,
    selectedStressTimelineId,
    selectedStressDecisionId,
    updateSimulation,
    selectLocality,
    selectHospital,
    selectStressTimeline,
    selectStressDecision,
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

  const serviceSummary = useMemo(
    () =>
      Object.entries(
        missions.reduce<Record<string, number>>((acc, mission) => {
          acc[mission.service] = (acc[mission.service] ?? 0) + 1;
          return acc;
        }, {}),
      ),
    [missions],
  );

  const routeWarnings = routes.filter((route) => route.status !== 'open').length;
  const signalQuality = Math.max(
    35,
    Math.min(99, Math.round((summary.autonomyScore + aiBriefing.confidence + (100 - routeWarnings * 8)) / 3)),
  );
  const signalLabel = signalQuality > 80 ? 'Field ready' : signalQuality > 60 ? 'Stable' : 'Weak zones';

  const selectedStressTimeline =
    stressReport.timeline.find((item) => item.id === selectedStressTimelineId) ?? stressReport.timeline[0];
  const selectedStressDecision =
    stressReport.decisions.find((item) => item.id === selectedStressDecisionId) ?? stressReport.decisions[0];

  const activeNotificationIds = Array.from(
    new Set([...selectedStressTimeline.notificationIds, ...selectedStressDecision.notificationIds]),
  );

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
      <header className="sticky top-0 z-50 border-b border-white/8 bg-slate-950/55 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-[1320px] items-center justify-between gap-4 px-4 py-4 lg:px-6">
          <div className="min-w-0">
            <p className="truncate text-[11px] uppercase tracking-[0.35em] text-cyan-200/80">SupplyGuard AI</p>
            <h1 className="mt-1 truncate text-lg font-semibold text-white">Bengaluru Command Console</h1>
          </div>

          <nav className="hidden items-center gap-1 rounded-full border border-white/10 bg-white/5 p-1 md:flex">
            <MiniPill
              active={section === 'command'}
              icon={<MapPinned className="h-4 w-4" />}
              label="Command"
              onClick={() => setSection('command')}
            />
            <MiniPill
              active={section === 'operations'}
              icon={<Activity className="h-4 w-4" />}
              label="Operations"
              onClick={() => setSection('operations')}
            />
            <MiniPill
              active={section === 'impact'}
              icon={<BarChart3 className="h-4 w-4" />}
              label="Impact"
              onClick={() => setSection('impact')}
            />
          </nav>

          <div className="flex items-center gap-3">
            {onOpenHistory ? (
              <button
                type="button"
                onClick={onOpenHistory}
                className="hidden rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:bg-white/10 sm:inline-flex"
              >
                History replay
              </button>
            ) : null}
            <div className="hidden rounded-full border border-white/10 bg-slate-950/55 px-3 py-2 text-xs text-slate-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] sm:flex">
              <Wifi className="mr-2 h-3.5 w-3.5 text-cyan-300" />
              Signal {signalQuality}% {signalLabel}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-[1320px] flex-col gap-6 px-4 py-6 lg:px-6 lg:py-8">
        {section === 'command' ? (
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
                    <h2 className="mt-2 text-2xl font-semibold text-white">Operations view</h2>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                      Set disaster mode and intensity to see routing, missions, and hospital pressure update together.
                    </p>
                  </div>
                  <div className="hidden flex-col items-end gap-2 sm:flex">
                    <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200">
                      Signal {signalQuality}% {signalLabel}
                    </div>
                    {mapBadges}
                  </div>
                </div>
                <div className="mt-4">
                  <Map />
                </div>
              </div>

              <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                <div className="panel-surface rounded-[28px] p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="section-kicker">Locality</p>
                      <h2 className="mt-2 text-xl font-semibold text-white">Intelligence</h2>
                    </div>
                    <div className="text-right text-xs text-slate-400">
                      Active focus: <span className="text-slate-200">{selectedLocality?.name ?? '—'}</span>
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

              <NotificationFeed notifications={notifications} activeIds={activeNotificationIds} />
            </section>
          </section>
        ) : section === 'operations' ? (
          <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="flex flex-col gap-6">
              <ServiceOrchestration missions={visibleMissions} />
              <div className="grid gap-6 lg:grid-cols-2">
                <LiveOperationsStats stats={operations} />
                <NotificationFeed notifications={notifications} activeIds={activeNotificationIds} />
              </div>
              <HospitalOperationsView
                hospitals={hospitals}
                selectedHospitalId={selectedHospitalId}
                onSelectHospital={selectHospital}
              />
            </div>
            <div className="flex flex-col gap-6">
              <SystemAlerts alerts={alerts} />
              <MeshAlertsPanel />
            </div>
          </section>
        ) : (
          <section className="grid gap-6">
            <CaseStudies />
            <div className="grid gap-6 lg:grid-cols-2">
              <ScenarioComparisonBoard comparisons={comparisons} />
              <ResponseMatrix summary={serviceSummary} />
            </div>
            <StressScenarioReport
              report={stressReport}
              selectedTimelineId={selectedStressTimelineId}
              selectedDecisionId={selectedStressDecisionId}
              onSelectTimeline={selectStressTimeline}
              onSelectDecision={selectStressDecision}
            />
          </section>
        )}
      </main>

      <footer className="border-t border-white/8 bg-slate-950/60">
        <div className="mx-auto flex max-w-[1320px] flex-col gap-3 px-4 py-6 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between lg:px-6">
          <p>SupplyGuard AI prototype</p>
          <p>Offline-friendly simulation | Command console prototype</p>
        </div>
      </footer>
    </div>
  );
};
