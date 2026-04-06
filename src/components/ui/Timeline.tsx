import React from 'react';
import { TimelineEvent } from '../../store/useStore';

export function Timeline({ items }: { items: TimelineEvent[] }) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.id} className="timeline-row">
          <div className={`timeline-dot ${item.tone === 'action' ? 'bg-cyan-300' : item.tone === 'watch' ? 'bg-orange-300' : 'bg-slate-300'}`} />
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{item.minute}</p>
            <p className="mt-1 text-sm font-semibold text-white">{item.title}</p>
            <p className="mt-1 text-sm leading-6 text-slate-300">{item.detail}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
