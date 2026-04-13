import { GlassCard } from '../ui/GlassCard';
import { indiaHistoryReplayScenarios } from '../../store/indiaHistoryReplays';

function formatDeltaPts(delta: number) {
  const rounded = Math.round(delta);
  return `${rounded >= 0 ? '+' : ''}${rounded} pts`;
}

function formatDeltaPct(deltaPct: number) {
  const rounded = Math.round(deltaPct);
  return `${rounded >= 0 ? '+' : ''}${rounded}%`;
}

const caseStudies = indiaHistoryReplayScenarios.slice(0, 4).map((scenario) => {
  const start = scenario.phases[0];
  const end = scenario.phases[scenario.phases.length - 1];
  const etaDeltaPct = start.avgEtaMinutes === 0 ? 0 : ((end.avgEtaMinutes - start.avgEtaMinutes) / start.avgEtaMinutes) * 100;

  return {
    year: String(scenario.year),
    title: scenario.title,
    headline: scenario.judgeGoal,
    metrics: `ETA ${start.avgEtaMinutes}→${end.avgEtaMinutes} (${formatDeltaPct(etaDeltaPct)}), Medicine ${start.medicineCoverage}→${end.medicineCoverage} (${formatDeltaPts(end.medicineCoverage - start.medicineCoverage)})`,
    insight: `Benchmark replay inspired by historic conditions: ${scenario.inspiredBy}`,
  };
});

export function CaseStudies() {
  return (
    <GlassCard className="p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Proven impact</p>
          <h3 className="mt-2 text-lg font-semibold text-slate-100">Repeatable benchmark scenarios</h3>
        </div>
        <span className="ops-chip">Repeatable benchmark</span>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-300">
        These metrics are generated from the built-in replay scenarios so the demo stays consistent across runs.
        Run <span className="font-semibold text-white">npm run evaluate</span> for the full table.
      </p>
      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        {caseStudies.map((item) => (
          <article key={item.title} className="sub-surface p-4">
            <div className="flex items-center justify-between gap-3">
              <span className="ops-chip">{item.year}</span>
              <span className="text-xs text-slate-400">{item.title}</span>
            </div>
            <h4 className="mt-3 text-lg font-semibold text-white">{item.headline}</h4>
            <p className="mt-3 text-sm text-slate-200">{item.metrics}</p>
            <p className="mt-3 text-sm leading-6 text-slate-300">{item.insight}</p>
          </article>
        ))}
      </div>
    </GlassCard>
  );
}
