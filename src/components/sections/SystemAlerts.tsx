import { Siren } from 'lucide-react';
import { AlertItem } from '../../store/useStore';
import { GlassCard } from '../ui/GlassCard';

const severityBorderTone = {
  low: 'border-l-emerald-500',
  medium: 'border-l-amber-500',
  high: 'border-l-orange-500',
  critical: 'border-l-red-600',
} as const;

export function SystemAlerts({ alerts }: { alerts: AlertItem[] }) {
  return (
    <GlassCard className="p-4 sm:p-5">
      <div className="flex items-center gap-2">
        <Siren className="h-4 w-4 text-slate-400" />
        <h3 className="text-lg font-semibold text-slate-100">System alerts</h3>
      </div>
      <div className="mt-4 space-y-3">
        {alerts.map((alert) => (
          <div key={alert.id} className={`sub-surface border-l-4 p-4 ${severityBorderTone[alert.severity]}`}>
            <p className="text-sm font-semibold text-slate-100">{alert.title}</p>
            <p className="mt-2 text-sm leading-6 text-slate-300">{alert.message}</p>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}
