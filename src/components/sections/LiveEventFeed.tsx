import { useEffect, useRef } from 'react';
import type { SimClockEvent } from '../../hooks/useSimulationClock';

export function LiveEventFeed({ events }: { events: SimClockEvent[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [events.length]);

  if (events.length === 0) {
    return (
      <div className="panel-surface rounded-[28px] p-5">
        <p className="section-kicker">Live event feed</p>
        <h2 className="mt-2 text-xl font-semibold text-white">Event log</h2>
        <p className="mt-4 text-sm text-white/50 text-center py-8">
          Press ▶ Play on the simulation clock to start generating live events
        </p>
      </div>
    );
  }

  return (
    <div className="panel-surface rounded-[28px] p-5">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <p className="section-kicker">Live event feed</p>
          <h2 className="mt-2 text-xl font-semibold text-white">Event log</h2>
        </div>
        <span className="text-xs text-white/50 font-mono">{events.length} events</span>
      </div>

      <div
        ref={scrollRef}
        className="space-y-1 max-h-[280px] overflow-y-auto pr-2"
        style={{ scrollBehavior: 'smooth' }}
      >
        {events.map((evt) => (
          <div
            key={evt.id}
            className="flex items-start gap-3 rounded-xl px-3 py-2 text-sm transition-colors"
            style={{
              background: evt.severity === 'critical'
                ? 'rgba(239, 68, 68, 0.08)'
                : evt.severity === 'warning'
                  ? 'rgba(234, 179, 8, 0.06)'
                  : 'transparent',
            }}
          >
            <span
              className="shrink-0 font-mono text-[11px] tabular-nums"
              style={{ color: 'var(--text-muted, rgba(255,255,255,0.35))' }}
            >
              {evt.wallClock}
            </span>

            <span className="shrink-0 text-base leading-none">{evt.emoji}</span>

            <span
              className="leading-relaxed"
              style={{
                color: evt.severity === 'critical'
                  ? '#f87171'
                  : evt.severity === 'warning'
                    ? '#fbbf24'
                    : 'rgba(255,255,255,0.75)',
              }}
            >
              {evt.message}
            </span>

            <span
              className="ml-auto shrink-0 font-mono text-[10px]"
              style={{ color: 'rgba(255,255,255,0.25)' }}
            >
              {evt.time}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
