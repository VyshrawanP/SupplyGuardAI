import { indiaHistoryReplayScenarios } from '../src/store/indiaHistoryReplays.ts';

type ScenarioRow = {
  id: string;
  title: string;
  year: number;
  etaStart: number;
  etaEnd: number;
  etaDeltaPct: number;
  medicineStart: number;
  medicineEnd: number;
  medicineDeltaPts: number;
  foodStart: number;
  foodEnd: number;
  foodDeltaPts: number;
  criticalStart: number;
  criticalEnd: number;
  blockedStart: number;
  blockedEnd: number;
};

const toPct = (value: number) => `${Math.round(value)}%`;
const toPts = (value: number) => `${value >= 0 ? '+' : ''}${Math.round(value)} pts`;

function computeRow(scenario: (typeof indiaHistoryReplayScenarios)[number]): ScenarioRow {
  const start = scenario.phases[0];
  const end = scenario.phases[scenario.phases.length - 1];

  const etaDeltaPct = start.avgEtaMinutes === 0 ? 0 : ((end.avgEtaMinutes - start.avgEtaMinutes) / start.avgEtaMinutes) * 100;

  return {
    id: scenario.id,
    title: scenario.title,
    year: scenario.year,
    etaStart: start.avgEtaMinutes,
    etaEnd: end.avgEtaMinutes,
    etaDeltaPct,
    medicineStart: start.medicineCoverage,
    medicineEnd: end.medicineCoverage,
    medicineDeltaPts: end.medicineCoverage - start.medicineCoverage,
    foodStart: start.foodCoverage,
    foodEnd: end.foodCoverage,
    foodDeltaPts: end.foodCoverage - start.foodCoverage,
    criticalStart: start.criticalMissions,
    criticalEnd: end.criticalMissions,
    blockedStart: start.blockedRoutes,
    blockedEnd: end.blockedRoutes,
  };
}

function printMarkdown(rows: ScenarioRow[]) {
  console.log('# SupplyGuard AI — Repeatable Impact Benchmarks');
  console.log('');
  console.log('Derived from `src/store/indiaHistoryReplays.ts`.');
  console.log('');
  console.log('| Scenario | ETA (min) | ETA Δ | Medicine | Food | Critical missions | Blocked routes |');
  console.log('|---|---:|---:|---:|---:|---:|---:|');

  for (const row of rows) {
    const etaDeltaLabel = row.etaDeltaPct < 0 ? toPct(row.etaDeltaPct) : `+${toPct(row.etaDeltaPct)}`;
    console.log(
      `| ${row.title} (${row.year}) | ${row.etaStart} → ${row.etaEnd} | ${etaDeltaLabel} | ${row.medicineStart} → ${row.medicineEnd} (${toPts(row.medicineDeltaPts)}) | ${row.foodStart} → ${row.foodEnd} (${toPts(row.foodDeltaPts)}) | ${row.criticalStart} → ${row.criticalEnd} | ${row.blockedStart} → ${row.blockedEnd} |`,
    );
  }
}

function main() {
  const rows = indiaHistoryReplayScenarios.map(computeRow);
  printMarkdown(rows);
}

main();
