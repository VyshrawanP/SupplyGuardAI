import React from 'react';

export function StatusBadge({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-full border border-white/10 bg-slate-950/55 px-4 py-2 text-xs text-slate-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-md">
      <span className="inline-flex items-center gap-2 text-slate-400">{icon}{label}</span>
      <span className="ml-2 font-semibold text-white">{value}</span>
    </div>
  );
}
