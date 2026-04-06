import { NotificationItem } from '../../store/useStore';
import { GlassCard } from '../ui/GlassCard';

const severityTone = {
  low: 'border-emerald-400/20 bg-emerald-500/10 text-emerald-100',
  medium: 'border-amber-400/20 bg-amber-500/10 text-amber-100',
  high: 'border-orange-400/20 bg-orange-500/10 text-orange-100',
  critical: 'border-rose-400/20 bg-rose-500/10 text-rose-100',
} as const;

export function NotificationFeed({
  notifications,
  activeIds = [],
}: {
  notifications: NotificationItem[];
  activeIds?: string[];
}) {
  return (
    <GlassCard className="panel-surface rounded-[30px] p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.28em] text-slate-400">Notification stream</p>
          <h3 className="mt-2 text-xl font-semibold text-white">Every possible notification</h3>
        </div>
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
          {notifications.length} events
        </span>
      </div>
      <div className="mt-3 space-y-2.5">
        {notifications.map((item) => (
          <div key={item.id} className={`rounded-[22px] border p-3 ${severityTone[item.severity]} ${
            activeIds.includes(item.id) ? 'ring-1 ring-cyan-300/60' : ''
          }`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-semibold">{item.title}</p>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-black/15 px-2 py-1 text-[10px] uppercase tracking-[0.15em]">{item.source}</span>
                <span className="rounded-full bg-black/15 px-2 py-1 text-[10px] uppercase tracking-[0.15em]">{item.status}</span>
              </div>
            </div>
            <p className="mt-1.5 text-sm leading-6 text-current/90">{item.detail}</p>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}
