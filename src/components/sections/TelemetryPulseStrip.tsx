import { Activity, Bot, CircleGauge, Truck } from 'lucide-react';
import { PulseStrip } from '../ui/PulseStrip';

export function TelemetryPulseStrip({
  movingFleet,
  activeFleet,
  autonomyScore,
  confidence,
  routeWarnings,
}: {
  movingFleet: number;
  activeFleet: number;
  autonomyScore: number;
  confidence: number;
  routeWarnings: number;
}) {
  return (
    <section className="panel-surface rounded-[30px] p-4">
      <div className="grid gap-3 lg:grid-cols-4">
        <PulseStrip icon={<Activity className="h-4 w-4 text-cyan-300" />} label="Live assets in motion" value={`${movingFleet}`} meta={`${activeFleet} active units`} />
        <PulseStrip icon={<CircleGauge className="h-4 w-4 text-emerald-300" />} label="Operational tempo" value={`${autonomyScore}%`} meta="Autonomous response score" />
        <PulseStrip icon={<Bot className="h-4 w-4 text-sky-300" />} label="AI confidence" value={`${confidence}%`} meta="Copilot scenario certainty" />
        <PulseStrip icon={<Truck className="h-4 w-4 text-orange-300" />} label="Route degradation" value={`${routeWarnings}`} meta="Corridors under watch" />
      </div>
    </section>
  );
}
