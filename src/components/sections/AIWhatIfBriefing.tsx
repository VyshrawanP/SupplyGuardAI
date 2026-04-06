import { Bot } from 'lucide-react';
import { AIBriefing, ScenarioComparison } from '../../store/useStore';
import { GlassCard } from '../ui/GlassCard';

export function AIWhatIfBriefing({
  briefing,
  comparisons,
}: {
  briefing: AIBriefing;
  comparisons: ScenarioComparison[];
}) {
  return (
    <GlassCard className="border-cyan-300/12 bg-cyan-500/6 p-4">
      <div className="flex items-center gap-2">
        <Bot className="h-4 w-4 text-cyan-300" />
        <h2 className="text-lg font-semibold">AI what-if briefing</h2>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-300">{briefing.summary}</p>
      <div className="mt-4 grid gap-2">
        {comparisons.map((item) => (
          <div key={item.label} className="rounded-2xl border border-white/10 bg-slate-950/45 px-3 py-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-slate-200">{item.label}</p>
              <span className={`text-xs font-semibold ${
                item.delta > 0 ? 'text-orange-200' : item.delta < 0 ? 'text-emerald-200' : 'text-slate-200'
              }`}>
                {item.delta > 0 ? '+' : ''}{item.delta}{item.suffix}
              </span>
            </div>
            <p className="mt-1 text-lg font-semibold text-white">{item.current}{item.suffix}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 space-y-2">
        {briefing.priorities.map((priority) => (
          <div key={priority} className="rounded-2xl border border-white/10 bg-slate-950/45 px-3 py-3 text-sm leading-6 text-slate-200">
            {priority}
          </div>
        ))}
      </div>
    </GlassCard>
  );
}
