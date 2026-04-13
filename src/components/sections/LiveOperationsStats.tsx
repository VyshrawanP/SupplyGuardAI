
import { Ambulance, BellRing, CheckCircle2, Package, Plane, Users } from 'lucide-react';
import type { ReactNode } from 'react';
import { OperationsStats } from '../../store/useStore';
import { GlassCard } from '../ui/GlassCard';

export function LiveOperationsStats({ stats }: { stats: OperationsStats }) {
  return (
    <GlassCard className="p-4 sm:p-5">
      <div className="flex items-center gap-2">
        <BellRing className="h-4 w-4 text-slate-400" />
        <h3 className="text-lg font-semibold">Live ops</h3>
      </div>
      <p className="mt-2 text-xs leading-5 text-slate-400">
        Live counters update from the simulation engine in this prototype (offline-friendly).
      </p>
      <div className="mt-3 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          icon={<Ambulance className="h-4 w-4 text-slate-400" />}
          label="Ambulance"
          value={String(stats.ambulanceArrivals)}
          sub={`${stats.ambulanceDepartures} out`}
        />
        <StatCard
          icon={<Users className="h-4 w-4 text-slate-400" />}
          label="Hospital"
          value={Intl.NumberFormat('en-IN').format(stats.hospitalPeopleNow)}
          sub="people now"
        />
        <StatCard
          icon={<Plane className="h-4 w-4 text-slate-400" />}
          label="Drone"
          value={String(stats.droneSorties)}
          sub={`${stats.rescueTeamsActive} rescue teams`}
        />
        <StatCard
          icon={<Package className="h-4 w-4 text-slate-400" />}
          label="Food"
          value={`${stats.currentFoodStock}%`}
          sub={`${stats.autoOrdersTriggered} auto-orders`}
        />
        <StatCard
          icon={<CheckCircle2 className="h-4 w-4 text-slate-400" />}
          label="Completed"
          value={String(stats.completedNotifications)}
          sub="notifications"
        />
      </div>
    </GlassCard>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="sub-surface p-3">
      <div className="flex items-center gap-2 text-sm text-slate-300">
        {icon}
        <span>{label}</span>
      </div>
      <p className="mt-1.5 text-xl font-semibold text-white">{value}</p>
      <p className="mt-0.5 text-xs text-slate-400">{sub}</p>
    </div>
  );
}
