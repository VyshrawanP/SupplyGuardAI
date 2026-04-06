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
    <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-slate-200">
      <span className="inline-flex items-center gap-2 text-slate-400">{icon}{label}</span>
      <span className="ml-2 font-semibold text-white">{value}</span>
    </div>
  );
}
