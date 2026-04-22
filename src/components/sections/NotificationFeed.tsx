import { NotificationItem } from '../../store/useStore';
import { GlassCard } from '../ui/GlassCard';

const severityBorderTone = {
  low: 'border-l-emerald-500',
  medium: 'border-l-amber-500',
  high: 'border-l-orange-500',
  critical: 'border-l-red-600',
} as const;

export function NotificationFeed({
  notifications,
  activeIds = [],
}: {
  notifications: NotificationItem[];
  activeIds?: string[];
}) {
  return (
    <GlassCard className="p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.14em] text-[var(--text-tertiary)]">Notification stream</p>
          <h3 className="mt-2 text-lg font-semibold text-[var(--text-primary)]">Notifications</h3>
        </div>
        <span className="ops-chip">{notifications.length} events</span>
      </div>
      <div className="mt-3 space-y-2.5">
        {notifications.map((item) => (
          <div
            key={item.id}
            className={`sub-surface border-l-4 p-3 ${severityBorderTone[item.severity]} ${
              activeIds.includes(item.id) ? 'bg-[color:var(--surface-hover)]' : ''
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-semibold text-[var(--text-primary)]">{item.title}</p>
              <div className="flex items-center gap-2">
                <span className="ops-chip">{item.source}</span>
                <span className="ops-chip">{item.status}</span>
              </div>
            </div>
            <p className="mt-1.5 text-sm leading-6 text-[var(--text-secondary)]">{item.detail}</p>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}
