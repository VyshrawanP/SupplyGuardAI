import React from 'react';

export function PulseStrip({
  icon,
  label,
  value,
  meta,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  meta: string;
}) {
  return (
    <div className="pulse-strip">
      <div className="pulse-strip__glow" />
      <div className="relative z-10 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{label}</p>
          <p className="mt-2 text-[30px] font-semibold text-white">{value}</p>
          <p className="mt-1 text-sm text-slate-300">{meta}</p>
        </div>
        <div className="mt-1 rounded-full border border-white/10 bg-white/5 p-3 text-white">
          {icon}
        </div>
      </div>
    </div>
  );
}
