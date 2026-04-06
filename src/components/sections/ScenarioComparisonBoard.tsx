import { Bot } from 'lucide-react';
import { ScenarioComparison } from '../../store/useStore';
import { GlassCard } from '../ui/GlassCard';

export function ScenarioComparisonBoard({ comparisons }: { comparisons: ScenarioComparison[] }) {
  return (
    <GlassCard className="panel-surface rounded-[30px] p-5">
      <div className="flex items-center gap-2">
        <Bot className="h-4 w-4 text-cyan-300" />
        <h3 className="text-xl font-semibold">Scenario comparison board</h3>
      </div>
      <div className="mt-4 grid gap-3">
        {comparisons.map((item) => (
          <div key={item.label} className="rounded-[22px] border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-white">{item.label}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">Current simulated state</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-semibold text-white">{item.current}{item.suffix}</p>
                <p className={`text-xs font-semibold ${item.delta > 0 ? 'text-orange-200' : item.delta < 0 ? 'text-emerald-200' : 'text-slate-300'}`}>
                  {item.delta > 0 ? '+' : ''}{item.delta}{item.suffix} from baseline
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}
