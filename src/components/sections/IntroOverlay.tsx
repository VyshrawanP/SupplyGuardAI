import React from 'react';
import { Activity, Bot, Shield } from 'lucide-react';

export function IntroOverlay({ visible }: { visible: boolean }) {
  return (
    <div className={`intro-overlay ${visible ? 'intro-overlay--visible' : 'intro-overlay--hidden'}`}>
      <div className="intro-card">
        <p className="text-[11px] uppercase tracking-[0.42em] text-cyan-200/80">@NEOFETCH</p>
        <h1 className="mt-4 text-[38px] font-semibold leading-none">SupplyGuard AI</h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">
          Loading the offline Bengaluru disaster twin, mission orchestration graph, and AI what-if scenario copilot.
        </p>
        <div className="mt-6 flex flex-wrap gap-3 text-xs text-slate-200">
          <IntroBadge icon={<Shield className="h-3.5 w-3.5" />} label="Local-only simulation" />
          <IntroBadge icon={<Bot className="h-3.5 w-3.5" />} label="AI copilot live" />
          <IntroBadge icon={<Activity className="h-3.5 w-3.5" />} label="Fleet telemetry active" />
        </div>
        <div className="intro-progress mt-8">
          <div className="intro-progress__bar" />
        </div>
      </div>
    </div>
  );
}

function IntroBadge({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2">
      {icon}
      <span>{label}</span>
    </div>
  );
}
