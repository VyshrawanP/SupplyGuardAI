import admin from 'firebase-admin';

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface ShipmentRouteMatch {
  shipment_id: string;
  route_id: string;
  polyline: GeoPoint[];
}

function getFirestore(): FirebaseFirestore.Firestore {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      projectId: process.env.FIREBASE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT_ID,
    });
  }

  return admin.firestore();
}

/**
 * Computes the great-circle distance between two coordinates in kilometers.
 */
export function haversineDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const earthRadiusKm = 6371;
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
}

/**
 * Returns true when any point in a route polyline falls within the disaster radius.
 */
export function routeIntersectsDisaster(
  routePolyline: GeoPoint[],
  disasterCenter: GeoPoint,
  radiusKm: number,
): boolean {
  return routePolyline.some((point) => haversineDistanceKm(
    point.lat,
    point.lng,
    disasterCenter.lat,
    disasterCenter.lng,
  ) <= radiusKm);
}

/**
 * Finds shipment routes intersecting with the current disaster radius.
 */
export async function findAffectedRoutes(
  disasterCenter: GeoPoint,
  radiusKm: number,
): Promise<ShipmentRouteMatch[]> {
  const snapshot = await getFirestore().collection('shipments').get();
  return snapshot.docs
    .map((doc) => {
      const polyline = Array.isArray(doc.get('polyline'))
        ? (doc.get('polyline') as GeoPoint[])
        : [];
      return {
        shipment_id: doc.id,
        route_id: String(doc.get('route_id') || doc.id),
        polyline,
      };
    })
    .filter((route) => routeIntersectsDisaster(route.polyline, disasterCenter, radiusKm));
}
