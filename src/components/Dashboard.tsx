import {
  Ambulance,
  ArrowRight,
  Bot,
  Building2,
  MapPinned,
  Package,
  RadioTower,
  Shield,
  Siren,
  Truck,
  Waves,
  Wifi,
  Zap,
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

const services = [
  {
    icon: Ambulance,
    title: 'Medical response',
    body: 'Ambulances, hospital surge load, trauma routing, and urgent medicine support coordinated together.',
  },
  {
    icon: Package,
    title: 'Supply continuity',
    body: 'Food packets, buffer stock, and critical relief inventory pushed where disruption is highest.',
  },
  {
    icon: Truck,
    title: 'Route intelligence',
    body: 'Corridor health, alternate movement paths, and risk-aware logistics routing across Bengaluru.',
  },
  {
    icon: RadioTower,
    title: 'Offline command ops',
    body: 'Built for local-only field demos with no live API dependency for the core simulation flow.',
  },
];

export const Dashboard = () => {
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

  const selectedLocality = localities.find((item) => item.id === selectedLocalityId) ?? localities[0];
  const supportedHospitals = hospitals.filter((hospital) => selectedLocality.hospitalIds.includes(hospital.id));
  const topRoutes = routes.slice().sort((a, b) => b.riskScore - a.riskScore).slice(0, 4);
  const visibleMissions = missions.filter((mission) => mission.localityId === selectedLocality.id).slice(0, 6);
  const serviceSummary = Object.entries(
    missions.reduce<Record<string, number>>((acc, mission) => {
      acc[mission.service] = (acc[mission.service] ?? 0) + 1;
      return acc;
    }, {})
  );

  const movingFleet = fleet.filter((unit) => unit.status === 'moving' || unit.status === 'critical').length;
  const routeWarnings = routes.filter((route) => route.status !== 'open').length;
  const signalQuality = Math.max(
    35,
    Math.min(
      99,
      Math.round((summary.autonomyScore + aiBriefing.confidence + (100 - routeWarnings * 8)) / 3)
    )
  );
  const signalLabel = signalQuality > 80 ? 'Field ready' : signalQuality > 60 ? 'Stable' : 'Weak zones';
  const selectedStressTimeline = stressReport.timeline.find((item) => item.id === selectedStressTimelineId) ?? stressReport.timeline[0];
  const selectedStressDecision = stressReport.decisions.find((item) => item.id === selectedStressDecisionId) ?? stressReport.decisions[0];
  const activeNotificationIds = Array.from(new Set([
    ...selectedStressTimeline.notificationIds,
    ...selectedStressDecision.notificationIds,
  ]));

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#040b14_0%,#071220_48%,#0a1520_100%)] text-white">
      <header className="sticky top-0 z-50 border-b border-white/8 bg-slate-950/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-4 py-4 lg:px-6">
          <div>
            <p className="text-[11px] uppercase tracking-[0.35em] text-cyan-200/80">@NEOFETCH by Vyshrawan Abul</p>
            <h1 className="mt-1 text-lg font-semibold text-white">SupplyGuard AI</h1>
          </div>
          <nav className="hidden items-center gap-6 text-sm text-slate-300 md:flex">
            <a href="#overview" className="hover:text-white">Overview</a>
            <a href="#simulation" className="hover:text-white">Simulation</a>
            <a href="#operations" className="hover:text-white">Operations</a>
            <a href="#impact" className="hover:text-white">Impact</a>
          </nav>
          <div className="flex items-center gap-3">
            <div className="hidden rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300 sm:flex">
              <Wifi className="mr-2 h-3.5 w-3.5 text-cyan-300" />
              Signal {signalQuality}% {signalLabel}
            </div>
            <a href="#simulation" className="rounded-full bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300">
              Open Simulation
            </a>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-[1440px] flex-col gap-5 px-4 py-5 lg:px-6 lg:py-6">
        <section id="overview" className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="panel-surface rounded-[32px] p-6 lg:p-8">
            <BrandHero />
            <div className="mt-5 flex flex-wrap gap-3">
              <a href="#simulation" className="inline-flex items-center gap-2 rounded-full bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300">
                Launch Scenario
                <ArrowRight className="h-4 w-4" />
              </a>
              <a href="#impact" className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
                View Case Studies
              </a>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {services.map((item) => (
                <div key={item.title} className="rounded-[24px] border border-white/10 bg-white/5 p-4">
                  <item.icon className="h-5 w-5 text-cyan-300" />
                  <h3 className="mt-4 text-base font-semibold text-white">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{item.body}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-5">
            <section className="panel-surface rounded-[32px] p-6">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-cyan-300" />
                <h2 className="text-xl font-semibold">Operational overview</h2>
              </div>
              <div className="mt-4">
                <KPIDashboard summary={summary} />
              </div>
            </section>

            <section className="panel-surface rounded-[32px] p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.28em] text-slate-400">Signal quality</p>
                  <h2 className="mt-2 text-xl font-semibold text-white">Field communications readiness</h2>
                </div>
                <div className="rounded-full bg-cyan-400/15 px-4 py-2 text-sm font-semibold text-cyan-100">
                  {signalQuality}% {signalLabel}
                </div>
              </div>
              <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/8">
                <div className="h-full rounded-full bg-[linear-gradient(90deg,#22c55e_0%,#38bdf8_55%,#f59e0b_100%)]" style={{ width: `${signalQuality}%` }} />
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">AI confidence</p>
                  <p className="mt-2 text-2xl font-semibold text-white">{aiBriefing.confidence}%</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Moving fleet</p>
                  <p className="mt-2 text-2xl font-semibold text-white">{movingFleet}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Route warnings</p>
                  <p className="mt-2 text-2xl font-semibold text-white">{routeWarnings}</p>
                </div>
              </div>
            </section>
          </div>
        </section>

        <section id="simulation" className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
          <div className="flex flex-col gap-5">
            <SimulationControls
              settings={settings}
              localityOptions={localities.map((locality) => ({ id: locality.id, name: locality.name }))}
              onReset={resetSimulation}
              onLocalityChange={(value) => {
                updateSimulation({ localityFocus: value });
                selectLocality(value);
              }}
              onModeChange={(value) => updateSimulation({ disasterMode: value })}
              onSimulationChange={updateSimulation}
            />
            <AIWhatIfBriefing briefing={aiBriefing} comparisons={comparisons} />
          </div>

          <section className="panel-surface rounded-[32px] p-4 sm:p-5 lg:p-6">
            <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.35em] text-slate-400">Interactive map</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Responsive Bengaluru operations view</h2>
              </div>
              <div className="flex flex-wrap gap-3">
                <StatusBadge icon={<Ambulance className="h-3.5 w-3.5" />} label="Fleet" value={`${fleet.length}`} />
                <StatusBadge icon={<Building2 className="h-3.5 w-3.5" />} label="Hospitals" value={`${hospitals.length}`} />
                <StatusBadge icon={<MapPinned className="h-3.5 w-3.5" />} label="Routes" value={`${routes.length}`} />
              </div>
            </div>
            <Map />
          </section>
        </section>

        <section id="operations" className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
          <ServiceOrchestration missions={visibleMissions} />
          <SystemAlerts alerts={alerts} />
        </section>

        <section className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
          <LiveOperationsStats stats={operations} />
          <NotificationFeed notifications={notifications} activeIds={activeNotificationIds} />
        </section>

        <section className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
          <ScenarioComparisonBoard comparisons={comparisons} />
          <ResponseMatrix summary={serviceSummary} />
        </section>

        <section>
          <StressScenarioReport
            report={stressReport}
            selectedTimelineId={selectedStressTimelineId}
            selectedDecisionId={selectedStressDecisionId}
            onSelectTimeline={selectStressTimeline}
            onSelectDecision={selectStressDecision}
          />
        </section>

        <section className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="panel-surface rounded-[32px] p-6">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-cyan-300" />
              <h2 className="text-xl font-semibold text-white">Locality intelligence</h2>
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

          <HospitalOperationsView
            hospitals={hospitals}
            selectedHospitalId={selectedHospitalId}
            onSelectHospital={selectHospital}
          />
        </section>

        <section id="impact">
          <CaseStudies />
        </section>

        <section className="panel-surface rounded-[32px] p-6 lg:p-8">
          <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div>
              <p className="text-[11px] uppercase tracking-[0.35em] text-cyan-200/80">Call To Action</p>
              <h2 className="mt-3 text-3xl font-semibold leading-tight text-white">Build the full field-ready command center on top of this prototype</h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
                The current frontend is now structured like a real product demo with responsive sections, map intelligence, signal quality, and scenario storytelling. It is ready for the next iteration into a true production command platform.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <a href="#simulation" className="inline-flex items-center justify-center rounded-full bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300">
                Run Scenario
              </a>
              <a href="#overview" className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
                Back To Top
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/8 bg-slate-950/60">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-3 px-4 py-6 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between lg:px-6">
          <p>SupplyGuard AI prototype by @NEOFETCH</p>
          <p>Offline Bengaluru simulation | Responsive command interface | Local-only demo</p>
        </div>
      </footer>
    </div>
  );
};
