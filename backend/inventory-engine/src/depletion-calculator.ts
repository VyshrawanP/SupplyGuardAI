import admin from 'firebase-admin';
import defaultRates from './disaster-defaults.json';
import { getFirestore } from './shared';

/**
 * Computes a rolling seven-day depletion rate for a warehouse item.
 */
export async function calculateDepletionRate(warehouseId: string, itemName: string): Promise<number> {
  const cutoff = admin.firestore.Timestamp.fromMillis(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const snapshot = await getFirestore()
    .collection('inventory-transactions')
    .where('warehouse_id', '==', warehouseId)
    .where('item_name', '==', itemName)
    .where('timestamp', '>=', cutoff)
    .get();

  const outbound = snapshot.docs
    .filter((doc) => doc.get('transaction_type') === 'dispatch')
    .reduce((sum, doc) => sum + Number(doc.get('quantity') || 0), 0);

  const rate = snapshot.empty
    ? Number(defaultRates[itemName as keyof typeof defaultRates] || 1)
    : outbound / 7;

  await getFirestore().collection('inventory-rate-cache').doc(`${warehouseId}-${itemName}`).set({
    warehouse_id: warehouseId,
    item_name: itemName,
    depletion_rate_per_day: rate,
    updated_at: admin.firestore.FieldValue.serverTimestamp(),
  });

  return Number(rate.toFixed(2));
}
