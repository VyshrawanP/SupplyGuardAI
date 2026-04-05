import admin from 'firebase-admin';
import { PubSub } from '@google-cloud/pubsub';
import type { GeoPoint, PayloadManifestItem } from './types';

const pubsub = new PubSub({
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
});

function getFirestore(): FirebaseFirestore.Firestore {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      projectId: process.env.FIREBASE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT_ID,
    });
  }

  return admin.firestore();
}

function haversineKm(left: GeoPoint, right: GeoPoint): number {
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const dLat = toRadians(right.lat - left.lat);
  const dLng = toRadians(right.lng - left.lng);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(toRadians(left.lat)) * Math.cos(toRadians(right.lat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function nearestWarehouses(zoneCenter: GeoPoint): Promise<Array<{ id: string; data: Record<string, unknown>; distanceKm: number }>> {
  const snapshot = await getFirestore().collection('warehouses').get();
  return snapshot.docs
    .map((doc) => {
      const location = doc.get('location') as GeoPoint;
      return {
        id: doc.id,
        data: doc.data() as Record<string, unknown>,
        distanceKm: haversineKm(location, zoneCenter),
      };
    })
    .sort((left, right) => left.distanceKm - right.distanceKm);
}

/**
 * Assigns payload inventory from the nearest feasible warehouses and decrements stock transactionally.
 */
export async function assignPayload(
  dispatchId: string,
  zoneCenter: GeoPoint,
  droneId: string,
  requestedManifest: Array<{ item_name: string; quantity: number; unit: string; size?: string; weight_kg_per_unit?: number }>,
  maxPayloadKg: number,
): Promise<{ manifest: PayloadManifestItem[]; totalPayloadWeightKg: number }> {
  const firestore = getFirestore();
  const warehouses = await nearestWarehouses(zoneCenter);
  const manifest: PayloadManifestItem[] = [];

  await firestore.runTransaction(async (transaction) => {
    for (const requestedItem of requestedManifest) {
      let remaining = requestedItem.quantity;

      for (const warehouse of warehouses.slice(0, 2)) {
        if (remaining <= 0) {
          break;
        }

        const inventoryRef = firestore.collection('warehouses').doc(warehouse.id).collection('inventory').doc(requestedItem.item_name);
        const inventorySnapshot = await transaction.get(inventoryRef);
        if (!inventorySnapshot.exists) {
          continue;
        }

        const quantity = Number(inventorySnapshot.get('quantity') || 0);
        if (quantity <= 0) {
          continue;
        }

        const assignedQuantity = Math.min(quantity, remaining);
        remaining -= assignedQuantity;

        transaction.update(inventoryRef, {
          quantity: quantity - assignedQuantity,
          updated_at: admin.firestore.FieldValue.serverTimestamp(),
        });

        manifest.push({
          item_name: requestedItem.item_name,
          requested_quantity: requestedItem.quantity,
          assigned_quantity: assignedQuantity,
          unit: requestedItem.unit,
          weight_kg_per_unit: Number(requestedItem.weight_kg_per_unit || 1),
          warehouse_id: warehouse.id,
        });
      }

      if (remaining > 0) {
        throw new Error(`Insufficient stock for ${requestedItem.item_name}.`);
      }
    }
  });

  const totalPayloadWeightKg = manifest.reduce(
    (sum, item) => sum + item.assigned_quantity * item.weight_kg_per_unit,
    0,
  );

  if (totalPayloadWeightKg > maxPayloadKg) {
    throw new Error(`Payload weight ${totalPayloadWeightKg}kg exceeds drone capacity ${maxPayloadKg}kg.`);
  }

  await Promise.all(manifest.map(async (item) => {
    await pubsub.topic(process.env.PUBSUB_INVENTORY_EVENTS_TOPIC || 'inventory-events').publishMessage({
      json: {
        dispatch_id: dispatchId,
        drone_id: droneId,
        warehouse_id: item.warehouse_id,
        item_name: item.item_name,
        quantity: item.assigned_quantity,
        event_type: 'DRONE_DISPATCH_DECREMENT',
      },
      attributes: {
        warehouse_id: item.warehouse_id,
        item_name: item.item_name,
      },
    });
  }));

  const jacketWrites = manifest
    .filter((item) => item.item_name === 'life_jacket')
    .flatMap((item) => Array.from({ length: item.assigned_quantity }, (_, index) =>
      firestore.collection('life-jacket-ledger').doc(`${dispatchId}-lj-${index + 1}`).set({
        dispatch_id: dispatchId,
        drone_id: droneId,
        jacket_id: `${dispatchId}-LJ-${index + 1}`,
        size: requestedManifest.find((entry) => entry.item_name === 'life_jacket')?.size || 'M',
        status: 'IN_USE',
        created_at: admin.firestore.FieldValue.serverTimestamp(),
      }),
    ));

  await Promise.all(jacketWrites);

  return {
    manifest,
    totalPayloadWeightKg: Number(totalPayloadWeightKg.toFixed(2)),
  };
}
