import { AlertTriangle, BrainCircuit, ShieldAlert, TimerReset } from 'lucide-react';
import { DecisionPoint, StressScenarioReport as StressScenarioReportType, StressTimelineItem } from '../../store/useStore';
import { GlassCard } from '../ui/GlassCard';

export function StressScenarioReport({
  report,
  selectedTimelineId,
  selectedDecisionId,
  onSelectTimeline,
  onSelectDecision,
}: {
  report: StressScenarioReportType;
  selectedTimelineId: string;
  selectedDecisionId: string;
  onSelectTimeline: (id: string) => void;
  onSelectDecision: (id: string) => void;
}) {
  const selectedTimeline = report.timeline.find((item) => item.id === selectedTimelineId) ?? report.timeline[0];
  const selectedDecision = report.decisions.find((item) => item.id === selectedDecisionId) ?? report.decisions[0];

  return (
    <GlassCard className="panel-surface rounded-[30px] p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.28em] text-slate-400">Stress Test Scenario</p>
          <h3 className="mt-2 text-2xl font-semibold text-white">{report.title}</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {report.conditions.map((condition) => (
            <span key={condition} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] uppercase tracking-[0.15em] text-slate-300">
              {condition}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-white">
            <TimerReset className="h-4 w-4 text-cyan-300" />
            <h4 className="text-lg font-semibold">Full simulation timeline</h4>
          </div>
          {report.timeline.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTimeline(item.id)}
              className={`w-full rounded-[22px] border p-4 text-left transition ${
                item.id === selectedTimeline.id
                  ? 'border-cyan-300/35 bg-cyan-500/10'
                  : 'border-white/10 bg-white/5 hover:bg-white/8'
              }`}
            >
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{item.time}</p>
              <p className="mt-1.5 text-sm font-semibold text-white">{item.title}</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">{item.detail}</p>
            </button>
          ))}
        </div>

        <div className="space-y-4">
          <div>
            <div className="flex items-center gap-2 text-white">
              <AlertTriangle className="h-4 w-4 text-orange-300" />
              <h4 className="text-lg font-semibold">Critical decision points</h4>
            </div>
            <div className="mt-3 space-y-3">
              {report.decisions.map((decision) => (
                <button
                  key={decision.id}
                  type="button"
                  onClick={() => onSelectDecision(decision.id)}
                  className={`w-full rounded-[22px] border p-4 text-left transition ${
                    decision.id === selectedDecision.id
                      ? 'border-cyan-300/35 bg-cyan-500/10'
                      : 'border-white/10 bg-white/5 hover:bg-white/8'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-white">{decision.title}</p>
                    <span className={`rounded-full px-2.5 py-1 text-[10px] uppercase tracking-[0.15em] ${
                      decision.risk === 'Critical'
                        ? 'bg-rose-500/15 text-rose-100'
                        : decision.risk === 'High'
                          ? 'bg-orange-500/15 text-orange-100'
                          : decision.risk === 'Medium'
                            ? 'bg-amber-500/15 text-amber-100'
                            : 'bg-emerald-500/15 text-emerald-100'
                    }`}>
                      {decision.risk} risk
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{decision.rationale}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-[22px] border border-emerald-400/20 bg-emerald-500/10 p-4 text-emerald-100">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4" />
                <h4 className="text-sm font-semibold">Succeeded</h4>
              </div>
              <div className="mt-3 space-y-2">
                {report.evaluation.successes.map((item) => (
                  <p key={item} className="text-sm leading-6">{item}</p>
                ))}
              </div>
            </div>

            <div className="rounded-[22px] border border-rose-400/20 bg-rose-500/10 p-4 text-rose-100">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                <h4 className="text-sm font-semibold">Failed</h4>
              </div>
              <div className="mt-3 space-y-2">
                {report.evaluation.failures.map((item) => (
                  <p key={item} className="text-sm leading-6">{item}</p>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-[22px] border border-cyan-300/15 bg-cyan-500/8 p-4">
            <div className="flex items-center gap-2 text-white">
              <BrainCircuit className="h-4 w-4 text-cyan-300" />
              <h4 className="text-sm font-semibold">Evaluation</h4>
            </div>
            <div className="mt-3 space-y-3 text-sm leading-6 text-slate-300">
              <p><span className="font-semibold text-white">Decision accuracy:</span> {report.evaluation.decisionAccuracy}</p>
              <p><span className="font-semibold text-white">Resilience vs cascading failure:</span> {report.evaluation.resilience}</p>
              <p><span className="font-semibold text-white">Explainability under bad data:</span> {report.evaluation.explainability}</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <FocusPanel
              title="Selected timeline focus"
              item={selectedTimeline}
              empty="No timeline step selected."
            />
            <FocusPanel
              title="Selected decision focus"
              item={selectedDecision}
              empty="No decision selected."
            />
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

function FocusPanel({
  title,
  item,
  empty,
}: {
  title: string;
  item: StressTimelineItem | DecisionPoint | undefined;
  empty: string;
}) {
  return (
    <div className="rounded-[22px] border border-white/10 bg-white/5 p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{title}</p>
      {item ? (
        <div className="mt-3 space-y-2 text-sm text-slate-300">
          <p className="font-semibold text-white">{item.title}</p>
          <p>Localities: {item.localityIds.length}</p>
          <p>Hospitals: {item.hospitalIds.length}</p>
          <p>Routes: {item.routeIds.length}</p>
          <p>Notifications: {item.notificationIds.length}</p>
        </div>
      ) : (
        <p className="mt-3 text-sm text-slate-400">{empty}</p>
      )}
    </div>
  );
}
