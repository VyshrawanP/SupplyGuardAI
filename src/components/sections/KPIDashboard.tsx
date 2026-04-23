import { Summary } from '../../store/useStore';
import { MetricCard } from '../ui/MetricCard';

export function KPIDashboard({ summary }: { summary: Summary }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <MetricCard label="Avg risk" value={`${summary.averageRisk}%`} numericValue={summary.averageRisk} suffix="%" />
      <MetricCard label="Autonomy" value={`${summary.autonomyScore}%`} numericValue={summary.autonomyScore} suffix="%" />
      <MetricCard label="Impacted people" value={Intl.NumberFormat('en-IN', { notation: 'compact' }).format(summary.impactedPopulation)} numericValue={summary.impactedPopulation} suffix="" />
      <MetricCard label="Missions" value={String(summary.missionsRequired)} numericValue={summary.missionsRequired} />
      <MetricCard label="Medicine" value={`${summary.medicineCoverage}%`} numericValue={summary.medicineCoverage} suffix="%" />
      <MetricCard label="Food cover" value={`${summary.foodCoverage}%`} numericValue={summary.foodCoverage} suffix="%" />
    </div>
  );
}
