
import { Ambulance, BellRing, Package, Plane, Shield, Users } from 'lucide-react';
import type { ReactNode } from 'react';
import { OperationsStats } from '../../store/useStore';
import { GlassCard } from '../ui/GlassCard';

export function LiveOperationsStats({ stats }: { stats: OperationsStats }) {
  return (
    <GlassCard className="panel-surface rounded-[30px] p-4 sm:p-5">
      <div className="flex items-center gap-2">
        <BellRing className="h-4 w-4 text-cyan-300" />
        <h3 className="text-xl font-semibold">Live operations stats</h3>
      </div>
      <div className="mt-3 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={<Ambulance className="h-4 w-4 text-rose-300" />} label="Ambulance in" value={String(stats.ambulanceArrivals)} sub={`${stats.ambulanceDepartures} out`} />
        <StatCard icon={<Users className="h-4 w-4 text-cyan-300" />} label="Hospital people" value={Intl.NumberFormat('en-IN').format(stats.hospitalPeopleNow)} sub="current across network" />
        <StatCard icon={<Plane className="h-4 w-4 text-sky-300" />} label="Drone sorties" value={String(stats.droneSorties)} sub={`${stats.rescueTeamsActive} rescue teams`} />
        <StatCard icon={<Package className="h-4 w-4 text-emerald-300" />} label="Food stock" value={`${stats.currentFoodStock}%`} sub={`${stats.autoOrdersTriggered} auto-orders`} />
      </div>
      <div className="mt-2.5 rounded-[22px] border border-white/10 bg-white/5 p-3 text-sm text-slate-300">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-emerald-300" />
          <span>{stats.completedNotifications} completed notifications in the active simulation window.</span>
        </div>
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
    <div className="rounded-[22px] border border-white/10 bg-white/5 p-3">
      <div className="flex items-center gap-2 text-sm text-slate-300">
        {icon}
        <span>{label}</span>
      </div>
      <p className="mt-2 text-xl font-semibold text-white">{value}</p>
      <p className="mt-0.5 text-xs uppercase tracking-[0.16em] text-slate-400">{sub}</p>
    </div>
  );
}
