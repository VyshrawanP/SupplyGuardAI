import admin from 'firebase-admin';
import { getFirestore, type GeoPoint } from './shared';

function pointInPolygon(point: GeoPoint, polygon: GeoPoint[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lng;
    const yi = polygon[i].lat;
    const xj = polygon[j].lng;
    const yj = polygon[j].lat;
    const intersect = ((yi > point.lat) !== (yj > point.lat))
      && (point.lng < ((xj - xi) * (point.lat - yi)) / ((yj - yi) || Number.EPSILON) + xi);
    if (intersect) {
      inside = !inside;
    }
  }
  return inside;
}

function haversineKm(left: GeoPoint, right: GeoPoint): number {
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const dLat = toRadians(right.lat - left.lat);
  const dLng = toRadians(right.lng - left.lng);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(toRadians(left.lat)) * Math.cos(toRadians(right.lat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function markRoadsInPolygon(sessionId: string, polygon: GeoPoint[]): Promise<number> {
  const snapshot = await getFirestore().collection(`sim-${sessionId}-shipments`).get();
  let affected = 0;

  for (const doc of snapshot.docs) {
    const polyline = doc.get('polyline') as GeoPoint[] | undefined;
    const intersects = Array.isArray(polyline) && polyline.some((point) => pointInPolygon(point, polygon));
    if (intersects) {
      affected += 1;
      await doc.ref.set({
        simulated_route_status: 'IMPASSABLE',
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
    }
  }

  return affected;
}

/**
 * Applies the requested scenario to the cloned simulation namespace.
 */
export async function runScenario(
  sessionId: string,
  scenarioType: string,
  parameters: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const firestore = getFirestore();

  if (scenarioType === 'FLOOD') {
    const polygon = parameters.polygon as GeoPoint[];
    const roadsAffected = await markRoadsInPolygon(sessionId, polygon);

    const warehouseSnapshot = await firestore.collection(`sim-${sessionId}-warehouses`).get();
    let warehousesInaccessible = 0;
    for (const doc of warehouseSnapshot.docs) {
      const location = doc.get('location') as GeoPoint;
      const simulatedElevation = Number(doc.get('simulated_elevation_m') || 4);
      if (pointInPolygon(location, polygon) && simulatedElevation < 5) {
        warehousesInaccessible += 1;
        await doc.ref.set({ simulated_status: 'INACCESSIBLE' }, { merge: true });
      }
    }

    await firestore.collection(`sim-${sessionId}-disaster-events`).add({
      type: 'FLOOD',
      polygon,
      water_level_meters: Number(parameters.water_level_meters || 0),
      duration_hours: Number(parameters.duration_hours || 0),
      created_at: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
      roads_affected: roadsAffected,
      warehouses_inaccessible: warehousesInaccessible,
      generated_survivor_reports: Math.max(5, Math.round(roadsAffected * 2)),
    };
  }

  if (scenarioType === 'CYCLONE') {
    const eye = parameters.eye_coordinates as GeoPoint;
    const radiusKm = Number(parameters.radius_km || 0);
    const shipmentSnapshot = await firestore.collection(`sim-${sessionId}-shipments`).get();
    let affected = 0;

    for (const doc of shipmentSnapshot.docs) {
      const polyline = doc.get('polyline') as GeoPoint[] | undefined;
      const withinRadius = Array.isArray(polyline) && polyline.some((point) => haversineKm(point, eye) <= radiusKm);
      if (withinRadius) {
        affected += 1;
        await doc.ref.set({
          simulated_damage_band: haversineKm((polyline || [eye])[0], eye) <= 20 ? 'DESTROYED' : 'PASSABLE_WITH_CAUTION',
        }, { merge: true });
      }
    }

    return {
      roads_affected: affected,
      prepositioning_required: true,
      outage_radius_km: radiusKm,
    };
  }

  if (scenarioType === 'ROAD_COLLAPSE') {
    const segmentId = String(parameters.road_segment_id || '');
    const shipmentSnapshot = await firestore.collection(`sim-${sessionId}-shipments`).where('route_id', '==', segmentId).get();
    for (const doc of shipmentSnapshot.docs) {
      await doc.ref.set({
        simulated_route_status: 'BLOCKED',
      }, { merge: true });
    }
    return {
      blocked_segment_id: segmentId,
      affected_shipments: shipmentSnapshot.size,
    };
  }

  if (scenarioType === 'BRIDGE_FAILURE') {
    const bridgeNodeId = String(parameters.bridge_node_id || '');
    const shipmentSnapshot = await firestore.collection(`sim-${sessionId}-shipments`).get();
    const impacted = shipmentSnapshot.docs.filter((doc) => String(doc.get('route_id') || '').includes(bridgeNodeId));
    for (const doc of impacted) {
      await doc.ref.set({
        simulated_bridge_status: 'UNUSABLE',
      }, { merge: true });
    }
    return {
      bridge_node_id: bridgeNodeId,
      affected_shipments: impacted.length,
      alternate_crossings_within_50km: Math.max(1, Math.round(impacted.length / 2)),
    };
  }

  throw new Error(`Unsupported scenario type: ${scenarioType}`);
}
