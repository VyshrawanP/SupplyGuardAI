import { computeWarehouseMetrics } from './threshold-checker';
import { getFirestore } from './shared';

export const CALORIC_VALUES = {
  food_packet_adult: 500,
  food_packet_child: 300,
  emergency_ration_bar: 400,
  rice_kg: 3600,
  dal_kg: 3400,
  biscuit_pack: 450,
} as const;

export const SURVIVAL_REQUIREMENTS = {
  adult_kcal_per_day: 1200,
  child_kcal_per_day: 800,
  assumed_child_ratio: 0.30,
} as const;

/**
 * Computes warehouse caloric sufficiency and survival stock runway.
 */
export async function calculateCaloricCoverage(warehouseId: string): Promise<{
  total_kcal_available: number;
  population_supportable: number;
  days_of_survival_stock: number;
}> {
  const metrics = await computeWarehouseMetrics(warehouseId);
  const warehouseSnapshot = await getFirestore().collection('warehouses').doc(warehouseId).get();
  const assignedPopulation = Number(warehouseSnapshot.get('assigned_population') || 1);

  const totalKcal = metrics.reduce((sum, item) => {
    const calories = CALORIC_VALUES[item.item_name as keyof typeof CALORIC_VALUES];
    return sum + item.current_quantity * Number(calories || 0);
  }, 0);

  const weightedRequirement = (SURVIVAL_REQUIREMENTS.adult_kcal_per_day * (1 - SURVIVAL_REQUIREMENTS.assumed_child_ratio))
    + (SURVIVAL_REQUIREMENTS.child_kcal_per_day * SURVIVAL_REQUIREMENTS.assumed_child_ratio);
  const populationSupportable = Math.floor(totalKcal / weightedRequirement);
  const daysOfSurvivalStock = Number((populationSupportable / Math.max(1, assignedPopulation)).toFixed(2));

  return {
    total_kcal_available: totalKcal,
    population_supportable: populationSupportable,
    days_of_survival_stock: daysOfSurvivalStock,
  };
}
