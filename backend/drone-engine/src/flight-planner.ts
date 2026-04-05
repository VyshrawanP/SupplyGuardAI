import axios from 'axios';
import admin from 'firebase-admin';
import type { FlightPlan, GeoPoint } from './types';

function getFirestore(): FirebaseFirestore.Firestore {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      projectId: process.env.FIREBASE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT_ID,
    });
  }

  return admin.firestore();
}

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}

function toDegrees(value: number): number {
  return (value * 180) / Math.PI;
}

function haversineKm(left: GeoPoint, right: GeoPoint): number {
  const dLat = toRadians(right.lat - left.lat);
  const dLng = toRadians(right.lng - left.lng);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(toRadians(left.lat)) * Math.cos(toRadians(right.lat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function interpolateGreatCircle(origin: GeoPoint, destination: GeoPoint, fraction: number): GeoPoint {
  const lat1 = toRadians(origin.lat);
  const lng1 = toRadians(origin.lng);
  const lat2 = toRadians(destination.lat);
  const lng2 = toRadians(destination.lng);

  const angularDistance = 2 * Math.asin(Math.sqrt(
    Math.sin((lat2 - lat1) / 2) ** 2
      + Math.cos(lat1) * Math.cos(lat2) * Math.sin((lng2 - lng1) / 2) ** 2,
  ));

  if (angularDistance === 0) {
    return origin;
  }

  const a = Math.sin((1 - fraction) * angularDistance) / Math.sin(angularDistance);
  const b = Math.sin(fraction * angularDistance) / Math.sin(angularDistance);

  const x = a * Math.cos(lat1) * Math.cos(lng1) + b * Math.cos(lat2) * Math.cos(lng2);
  const y = a * Math.cos(lat1) * Math.sin(lng1) + b * Math.cos(lat2) * Math.sin(lng2);
  const z = a * Math.sin(lat1) + b * Math.sin(lat2);

  const lat = Math.atan2(z, Math.sqrt(x * x + y * y));
  const lng = Math.atan2(y, x);

  return { lat: toDegrees(lat), lng: toDegrees(lng) };
}

function pointInPolygon(point: GeoPoint, polygon: GeoPoint[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lng;
    const yi = polygon[i].lat;
    const xj = polygon[j].lng;
    const yj = polygon[j].lat;
    const intersects = ((yi > point.lat) !== (yj > point.lat))
      && (point.lng < ((xj - xi) * (point.lat - yi)) / ((yj - yi) || Number.EPSILON) + xi);
    if (intersects) {
      inside = !inside;
    }
  }
  return inside;
}

async function terrainElevation(point: GeoPoint): Promise<number> {
  if (process.env.OFFLINE_MODE === 'true' || !process.env.GOOGLE_MAPS_ELEVATION_API_KEY) {
    return 35;
  }

  const response = await axios.get('https://maps.googleapis.com/maps/api/elevation/json', {
    params: {
      locations: `${point.lat},${point.lng}`,
      key: process.env.GOOGLE_MAPS_ELEVATION_API_KEY,
    },
    timeout: 10_000,
  });

  return Number(response.data?.results?.[0]?.elevation || 35);
}

async function adjustNoFlyWaypoint(point: GeoPoint): Promise<GeoPoint> {
  const snapshot = await getFirestore().collection('no-fly-zones').get();
  const intersects = snapshot.docs.some((doc) => pointInPolygon(point, (doc.get('polygon') as GeoPoint[]) || []));
  if (!intersects) {
    return point;
  }

  return { lat: point.lat, lng: point.lng + (2 / (111 * Math.cos(toRadians(point.lat)))) };
}

/**
 * Builds a waypoint-level flight plan with terrain clearance and no-fly-zone avoidance.
 */
export async function createFlightPlan(
  origin: GeoPoint,
  destination: GeoPoint,
  batteryPercent: number,
  cruiseSpeedKmh = 60,
): Promise<FlightPlan> {
  const baseWaypoints = Array.from({ length: 12 }, (_, index) => interpolateGreatCircle(origin, destination, index / 11));
  const adjustedWaypoints = await Promise.all(baseWaypoints.map(adjustNoFlyWaypoint));

  const waypoints = await Promise.all(adjustedWaypoints.map(async (point) => {
    const elevation = await terrainElevation(point);
    return {
      ...point,
      altitude_m: Math.max(elevation + 50, 100),
    };
  }));

  const totalDistanceKm = waypoints.slice(1).reduce((sum, waypoint, index) => (
    sum + haversineKm(waypoints[index], waypoint)
  ), 0);
  const estimatedFlightMinutes = Math.round((totalDistanceKm / Math.max(1, cruiseSpeedKmh)) * 60);
  const batteryConsumptionPercent = Number((totalDistanceKm * 3 + 5).toFixed(2));
  const batteryRemaining = Number((batteryPercent - batteryConsumptionPercent).toFixed(2));

  return {
    waypoints,
    total_distance_km: Number(totalDistanceKm.toFixed(2)),
    estimated_flight_minutes: estimatedFlightMinutes,
    battery_consumption_percent: batteryConsumptionPercent,
    battery_remaining_at_destination: batteryRemaining,
    return_possible: batteryRemaining > 30,
  };
}
