import React from 'react';

const sliderLabel = (value: number) => {
  if (value > 75) return 'Severe';
  if (value > 50) return 'Elevated';
  if (value > 25) return 'Watch';
  return 'Stable';
};

export function SliderControl({
  icon,
  label,
  value,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="sub-surface p-3">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-200">
          <span className="text-slate-400">{icon}</span>
          <span>{label}</span>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-slate-100">{value}%</p>
          <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">{sliderLabel(value)}</p>
        </div>
      </div>
      <input
        className="slider-input"
        type="range"
        min="0"
        max="100"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </div>
  );
}
