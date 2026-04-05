import admin from 'firebase-admin';
import twilio from 'twilio';
import type { PurchaseOrder } from './shared';
import { getFirestore } from './shared';

function haversineKm(
  left: { lat: number; lng: number },
  right: { lat: number; lng: number },
): number {
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const dLat = toRadians(right.lat - left.lat);
  const dLng = toRadians(right.lng - left.lng);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(toRadians(left.lat)) * Math.cos(toRadians(right.lat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function findBestSupplier(itemName: string, warehouseLocation: { lat: number; lng: number }) {
  const snapshot = await getFirestore().collection('suppliers').get();
  const matches = snapshot.docs
    .filter((doc) => Array.isArray(doc.get('items_supported')) && (doc.get('items_supported') as string[]).includes(itemName))
    .map((doc) => {
      const location = doc.get('location') as { lat: number; lng: number };
      return {
        id: doc.id,
        data: doc.data(),
        distanceKm: haversineKm(warehouseLocation, location),
      };
    })
    .filter((supplier) => supplier.distanceKm <= 200)
    .sort((left, right) => {
      const leftResponse = Number(left.data.response_time_hours || 999);
      const rightResponse = Number(right.data.response_time_hours || 999);
      return leftResponse - rightResponse || left.distanceKm - right.distanceKm;
    });

  return matches[0] || null;
}

/**
 * Creates supplier alerts and a purchase order for a critical inventory item.
 */
export async function alertSupplier(params: {
  warehouse_id: string;
  item_name: string;
  quantity: number;
  unit: string;
  severity: 'LOW' | 'CRITICAL';
}): Promise<PurchaseOrder | null> {
  const firestore = getFirestore();
  const warehouseSnapshot = await firestore.collection('warehouses').doc(params.warehouse_id).get();
  const warehouseLocation = warehouseSnapshot.get('location') as { lat: number; lng: number };
  const supplier = await findBestSupplier(params.item_name, warehouseLocation);
  if (!supplier) {
    return null;
  }

  const createdAt = new Date();
  const requiredBy = new Date(createdAt.getTime() + (params.severity === 'CRITICAL' ? 24 : 72) * 60 * 60 * 1000);
  const po: PurchaseOrder = {
    po_id: firestore.collection('purchase-orders').doc().id,
    warehouse_id: params.warehouse_id,
    supplier_id: supplier.id,
    items: [{
      item_name: params.item_name,
      quantity: params.quantity,
      unit: params.unit,
      urgency: params.severity === 'CRITICAL' ? 'EMERGENCY' : 'STANDARD',
    }],
    delivery_address: String(warehouseSnapshot.get('address') || ''),
    created_at: createdAt.toISOString(),
    required_by: requiredBy.toISOString(),
    estimated_cost_inr: params.quantity * 250,
  };

  await firestore.collection('inventory-alerts').add({
    warehouse_id: params.warehouse_id,
    supplier_id: supplier.id,
    item_name: params.item_name,
    status: 'PENDING',
    severity: params.severity,
    acknowledged: false,
    created_at: admin.firestore.FieldValue.serverTimestamp(),
  });

  await firestore.collection('purchase-orders').doc(po.po_id).set(po);

  await firestore.collection('mail').add({
    to: [String(supplier.data.email || '')],
    message: {
      subject: `SupplyGuard ${params.severity} inventory alert`,
      text: `Please replenish ${params.item_name} for warehouse ${params.warehouse_id}.`,
    },
  });

  if (params.severity === 'CRITICAL' && process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM_NUMBER) {
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    await client.messages.create({
      from: process.env.TWILIO_FROM_NUMBER,
      to: String(supplier.data.phone || ''),
      body: `CRITICAL SupplyGuard restock alert: ${params.item_name} needed at warehouse ${params.warehouse_id}.`,
    });
  }

  return po;
}
