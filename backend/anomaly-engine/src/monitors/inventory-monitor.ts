import { publishSystemAlert } from '../alert-publisher';
import { getFirestore } from '../shared';

/**
 * Flags warehouses with critical inventory and abnormal burn rates.
 */
export async function runInventoryMonitor(): Promise<void> {
  const warehouseSnapshot = await getFirestore().collection('warehouses').get();

  for (const warehouse of warehouseSnapshot.docs) {
    const inventorySnapshot = await warehouse.ref.collection('inventory').get();

    for (const item of inventorySnapshot.docs) {
      const quantity = Number(item.get('quantity') || 0);
      const threshold = Number(item.get('minimum_threshold') || 0);
      const dailyConsumption = Number(item.get('daily_consumption_rate') || 1);
      const normalRate = Math.max(1, Number(item.get('baseline_daily_rate') || dailyConsumption));

      const hasPendingAlert = !(await getFirestore()
        .collection('inventory-alerts')
        .where('warehouse_id', '==', warehouse.id)
        .where('item_name', '==', item.id)
        .where('status', '==', 'PENDING')
        .limit(1)
        .get()).empty;

      if ((quantity <= threshold || quantity <= 0) && !hasPendingAlert) {
        await publishSystemAlert({
          alert_type: 'INVENTORY_CRITICAL',
          severity: quantity <= 0 ? 'CRITICAL' : 'HIGH',
          description: `Warehouse ${warehouse.id} is critically low on ${item.id}.`,
          entity_id: warehouse.id,
          entity_type: 'warehouse',
          metadata: {
            item_name: item.id,
            quantity,
          },
        });
      }

      if (dailyConsumption >= normalRate * 3) {
        await publishSystemAlert({
          alert_type: 'MASS_CASUALTY_INDICATOR',
          severity: 'HIGH',
          description: `Warehouse ${warehouse.id} is consuming ${item.id} at over 3x the normal rate.`,
          entity_id: warehouse.id,
          entity_type: 'warehouse',
          metadata: {
            item_name: item.id,
            depletion_rate_per_day: dailyConsumption,
            baseline_rate_per_day: normalRate,
          },
        });
      }
    }
  }
}
