import admin from 'firebase-admin';
import { calculateDepletionRate } from './depletion-calculator';
import type { InventoryMetrics } from './shared';
import { getFirestore } from './shared';

function inventoryStatus(daysRemaining: number): InventoryMetrics['status'] {
  if (daysRemaining < 1) {
    return 'DEPLETED';
  }
  if (daysRemaining <= 3) {
    return 'CRITICAL';
  }
  if (daysRemaining <= 7) {
    return 'LOW';
  }
  return 'ADEQUATE';
}

/**
 * Computes threshold metrics for every item in a warehouse inventory.
 */
export async function computeWarehouseMetrics(warehouseId: string): Promise<InventoryMetrics[]> {
  const snapshot = await getFirestore().collection('warehouses').doc(warehouseId).collection('inventory').get();

  const metrics = await Promise.all(snapshot.docs.map(async (doc) => {
    const currentQuantity = Number(doc.get('quantity') || 0);
    const depletionRate = Math.max(0.1, await calculateDepletionRate(warehouseId, doc.id));
    const daysRemaining = Number((currentQuantity / depletionRate).toFixed(2));
    const lastRestockedAt = doc.get('last_restocked_at') as admin.firestore.Timestamp | undefined;

    return {
      item_name: doc.id,
      current_quantity: currentQuantity,
      unit: String(doc.get('unit') || 'unit'),
      minimum_threshold: Number(doc.get('minimum_threshold') || 0),
      days_remaining: daysRemaining,
      depletion_rate_per_day: depletionRate,
      status: inventoryStatus(daysRemaining),
      last_restocked_at: lastRestockedAt?.toDate().toISOString() || new Date(0).toISOString(),
    } satisfies InventoryMetrics;
  }));

  return metrics.sort((left, right) => left.days_remaining - right.days_remaining);
}
