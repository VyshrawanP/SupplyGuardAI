import { Package } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';

const serviceTone: Record<string, string> = {
  ambulance: 'text-rose-200 bg-rose-500/15',
  drone: 'text-sky-100 bg-sky-500/15',
  food: 'text-yellow-100 bg-yellow-500/15',
  rescue: 'text-orange-100 bg-orange-500/15',
  evacuation: 'text-violet-100 bg-violet-500/15',
  utility: 'text-emerald-100 bg-emerald-500/15',
};

export function ResponseMatrix({ summary }: { summary: Array<[string, number]> }) {
  return (
    <GlassCard className="p-4 sm:p-5">
      <div className="flex items-center gap-2">
        <Package className="h-4 w-4 text-slate-400" />
        <h3 className="text-lg font-semibold text-slate-100">Response matrix</h3>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {summary.map(([service, count]) => (
          <div key={service} className="sub-surface p-4">
            <div className={`inline-flex rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${serviceTone[service]}`}>
              {service}
            </div>
            <p className="mt-3 text-3xl font-semibold text-slate-100">{count}</p>
            <p className="mt-1 text-sm text-slate-300">mission lanes active in current scenario</p>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}
