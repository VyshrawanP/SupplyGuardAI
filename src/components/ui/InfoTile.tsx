import React from 'react';

export function InfoTile({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="sub-surface p-3">
      <div className="flex items-center gap-2 text-sm text-slate-300">
        <span className="text-slate-400">{icon}</span>
        <span className="uppercase tracking-[0.12em] text-slate-500">{label}</span>
      </div>
      <p className="mt-3 text-lg font-semibold text-slate-100">{value}</p>
    </div>
  );
}
