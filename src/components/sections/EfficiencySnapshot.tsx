import { BarChart3 } from 'lucide-react';
import type { AIBriefing, HospitalStatus, RouteStatus, ServiceMission, Summary } from '../../store/useStore';
import { getIndiaScenarioPresetLabel } from '../../store/indiaScenarioPresets';
import { GlassCard } from '../ui/GlassCard';
import { MetricCard } from '../ui/MetricCard';

export function EfficiencySnapshot({
  summary,
  aiBriefing,
  missions,
  routes,
  hospitals,
  scenarioPresetId,
}: {
  summary: Summary;
  aiBriefing: AIBriefing;
  missions: ServiceMission[];
  routes: RouteStatus[];
  hospitals: HospitalStatus[];
  scenarioPresetId: string;
}) {
  const criticalMissions = missions.filter((mission) => mission.priority === 'critical').length;
  const avgEtaMinutes = missions.length
    ? Math.round(missions.reduce((sum, mission) => sum + mission.etaMinutes, 0) / missions.length)
    : 0;
  const blockedRoutes = routes.filter((route) => route.status === 'blocked').length;
  const criticalHospitals = hospitals.filter((hospital) => hospital.status === 'critical').length;
  const presetLabel = getIndiaScenarioPresetLabel(scenarioPresetId);

  return (
    <GlassCard className="p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-cyan-300" />
          <h3 className="text-lg font-semibold text-white">Efficiency snapshot</h3>
        </div>
        {presetLabel ? (
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-slate-200">
            {presetLabel}
          </span>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <MetricCard label="Autonomy" value={`${summary.autonomyScore}%`} />
        <MetricCard label="AI confidence" value={`${aiBriefing.confidence}%`} />
        <MetricCard label="Avg ETA" value={avgEtaMinutes ? `${avgEtaMinutes} min` : '—'} />
        <MetricCard label="Critical missions" value={`${criticalMissions}`} />
        <MetricCard label="Blocked routes" value={`${blockedRoutes}`} />
        <MetricCard label="Critical hospitals" value={`${criticalHospitals}`} />
        <MetricCard label="Medicine cover" value={`${summary.medicineCoverage}%`} />
        <MetricCard label="Food cover" value={`${summary.foodCoverage}%`} />
      </div>
    </GlassCard>
  );
}
