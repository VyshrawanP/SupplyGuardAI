import { RadioTower } from 'lucide-react';
import { ServiceMission } from '../../store/useStore';
import { GlassCard } from '../ui/GlassCard';

const serviceTone: Record<string, string> = {
  ambulance: 'text-rose-200 bg-rose-500/15',
  drone: 'text-sky-100 bg-sky-500/15',
  food: 'text-yellow-100 bg-yellow-500/15',
  rescue: 'text-orange-100 bg-orange-500/15',
  evacuation: 'text-violet-100 bg-violet-500/15',
  utility: 'text-emerald-100 bg-emerald-500/15',
};

export function ServiceOrchestration({ missions }: { missions: ServiceMission[] }) {
  return (
    <GlassCard className="p-4 sm:p-5">
      <div className="flex items-center gap-2">
        <RadioTower className="h-4 w-4 text-slate-400" />
        <h3 className="text-xl font-semibold">Service orchestration board</h3>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {missions.map((mission) => (
          <div key={mission.id} className="sub-surface p-4">
            <div className="flex items-center justify-between gap-3">
              <div className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${serviceTone[mission.service]}`}>
                {mission.service}
              </div>
              <span className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] ${
                mission.priority === 'critical'
                  ? 'bg-rose-500/15 text-rose-100'
                  : mission.priority === 'priority'
                    ? 'bg-orange-500/15 text-orange-100'
                    : 'bg-slate-500/20 text-slate-200'
              }`}>
                {mission.status}
              </span>
            </div>
            <h4 className="mt-3 text-base font-semibold">{mission.title}</h4>
            <p className="mt-2 text-sm leading-6 text-slate-300">{mission.narrative}</p>
            <div className="mt-4 grid grid-cols-3 gap-2 text-xs text-slate-300">
              <span>Units {mission.units}</span>
              <span>ETA {mission.etaMinutes}m</span>
              <span>Risk {mission.routeRisk}%</span>
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}
