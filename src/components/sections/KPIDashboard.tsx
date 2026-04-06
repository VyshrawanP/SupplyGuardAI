import { Summary } from '../../store/useStore';
import { MetricCard } from '../ui/MetricCard';

export function KPIDashboard({ summary }: { summary: Summary }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <MetricCard label="Avg risk" value={`${summary.averageRisk}%`} />
      <MetricCard label="Autonomy" value={`${summary.autonomyScore}%`} />
      <MetricCard label="Impacted people" value={Intl.NumberFormat('en-IN', { notation: 'compact' }).format(summary.impactedPopulation)} />
      <MetricCard label="Missions" value={String(summary.missionsRequired)} />
      <MetricCard label="Medicine" value={`${summary.medicineCoverage}%`} />
      <MetricCard label="Food cover" value={`${summary.foodCoverage}%`} />
    </div>
  );
}
