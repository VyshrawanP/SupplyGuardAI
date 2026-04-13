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
    <div className="flex items-center justify-between gap-3 rounded px-3 py-2 text-xs text-slate-200">
      <span className="inline-flex items-center gap-2 text-slate-400">
        <span className="inline-flex h-2 w-2 rounded-full bg-slate-500" aria-hidden="true" />
        {icon ? <span className="text-slate-400">{icon}</span> : null}
        <span className="uppercase tracking-[0.12em]">{label}</span>
      </span>
      <span className="font-semibold text-slate-100">{value}</span>
    </div>
  );
}
