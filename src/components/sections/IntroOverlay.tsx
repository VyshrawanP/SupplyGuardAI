import { Shield } from 'lucide-react';

export function IntroOverlay({ visible }: { visible: boolean }) {
  if (!visible) return null;

  return (
    <div className="intro-overlay">
      <div className="intro-card">
        <div className="flex items-center gap-2 text-sm text-cyan-100/90">
          <Shield className="h-4 w-4" />
          <span>Starting offline command console…</span>
        </div>
        <h1 className="mt-3 text-2xl font-semibold leading-tight text-white">SupplyGuard AI</h1>
        <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">
          Loading the Bengaluru simulation and live operations panels.
        </p>
      </div>
    </div>
  );
}
