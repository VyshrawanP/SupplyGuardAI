import { Siren } from 'lucide-react';
import { AlertItem } from '../../store/useStore';
import { GlassCard } from '../ui/GlassCard';

const severityClass = {
  low: 'bg-emerald-500/15 text-emerald-100 border-emerald-400/20',
  medium: 'bg-amber-500/15 text-amber-100 border-amber-400/20',
  high: 'bg-orange-500/15 text-orange-100 border-orange-400/20',
  critical: 'bg-rose-500/15 text-rose-100 border-rose-400/20',
} as const;

export function SystemAlerts({ alerts }: { alerts: AlertItem[] }) {
  return (
    <GlassCard className="panel-surface rounded-[30px] p-5">
      <div className="flex items-center gap-2">
        <Siren className="h-4 w-4 text-rose-300" />
        <h3 className="text-xl font-semibold">System alerts</h3>
      </div>
      <div className="mt-4 space-y-3">
        {alerts.map((alert) => (
          <div key={alert.id} className={`rounded-[22px] border p-4 ${severityClass[alert.severity]}`}>
            <p className="text-sm font-semibold">{alert.title}</p>
            <p className="mt-2 text-sm leading-6 text-current/90">{alert.message}</p>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}
