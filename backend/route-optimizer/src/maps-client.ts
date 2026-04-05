import axios from 'axios';
import admin from 'firebase-admin';
import { getOsrmRoutes } from './osrm-client';
import type { GeoPoint, Route, RouteStep } from './types';

const requestCache = new Map<string, { expiresAt: number; routes: Route[] }>();

function getFirestore(): FirebaseFirestore.Firestore {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      projectId: process.env.FIREBASE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT_ID,
    });
  }

  return admin.firestore();
}

function decodePolyline(encoded: string): GeoPoint[] {
  let index = 0;
  let lat = 0;
  let lng = 0;
  const points: GeoPoint[] = [];

  while (index < encoded.length) {
    let result = 0;
    let shift = 0;
    let byte = 0;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const deltaLat = (result & 1) ? ~(result >> 1) : (result >> 1);
    lat += deltaLat;

    result = 0;
    shift = 0;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const deltaLng = (result & 1) ? ~(result >> 1) : (result >> 1);
    lng += deltaLng;

    points.push({ lat: lat / 1e5, lng: lng / 1e5 });
  }

  return points;
}

async function loadHighRiskWaypoints(): Promise<string | undefined> {
  const snapshot = await getFirestore().collection('high-risk-zones').get();
  const waypointCenters = snapshot.docs
    .flatMap((doc) => {
      const polygon = doc.get('polygon') as GeoPoint[] | undefined;
      if (!Array.isArray(polygon) || polygon.length === 0) {
        return [];
      }

      const avgLat = polygon.reduce((sum, point) => sum + Number(point.lat || 0), 0) / polygon.length;
      const avgLng = polygon.reduce((sum, point) => sum + Number(point.lng || 0), 0) / polygon.length;
      return [`via:${avgLat},${avgLng}`];
    });

  return waypointCenters.length > 0 ? waypointCenters.join('|') : undefined;
}

function parseGoogleSteps(route: Record<string, unknown>): RouteStep[] {
  const legs = Array.isArray(route.legs) ? route.legs : [];
  return legs.flatMap((leg) => {
    const currentLeg = leg as Record<string, unknown>;
    const steps = Array.isArray(currentLeg.steps) ? currentLeg.steps : [];
    return steps.map((step) => {
      const currentStep = step as Record<string, unknown>;
      return {
        instruction: String(currentStep.html_instructions || currentStep.maneuver || 'Continue'),
        distance_meters: Number((currentStep.distance as Record<string, unknown> | undefined)?.value || 0),
        duration_seconds: Number((currentStep.duration as Record<string, unknown> | undefined)?.value || 0),
      };
    });
  });
}

/**
 * Fetches up to three candidate routes from Google Maps and falls back to OSRM when needed.
 */
export async function getAlternativeRoutes(origin: GeoPoint, destination: GeoPoint): Promise<Route[]> {
  const cacheKey = `${origin.lat},${origin.lng}:${destination.lat},${destination.lng}`;
  const cached = requestCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.routes;
  }

  const offlineMode = process.env.OFFLINE_MODE === 'true';
  const apiKey = process.env.GOOGLE_MAPS_DIRECTIONS_API_KEY || process.env.GOOGLE_MAPS_API_KEY;
  if (offlineMode || !apiKey) {
    const routes = await getOsrmRoutes(origin, destination);
    requestCache.set(cacheKey, { expiresAt: Date.now() + 5 * 60 * 1000, routes });
    return routes;
  }

  try {
    const avoidWaypoints = await loadHighRiskWaypoints();
    const response = await axios.get('https://maps.googleapis.com/maps/api/directions/json', {
      params: {
        origin: `${origin.lat},${origin.lng}`,
        destination: `${destination.lat},${destination.lng}`,
        alternatives: true,
        avoid: 'tolls|ferries',
        waypoints: avoidWaypoints,
        key: apiKey,
      },
      timeout: 10_000,
      validateStatus: () => true,
    });

    if (response.status === 429 || response.data?.status === 'OVER_QUERY_LIMIT') {
      const routes = await getOsrmRoutes(origin, destination);
      requestCache.set(cacheKey, { expiresAt: Date.now() + 5 * 60 * 1000, routes });
      return routes;
    }

    const routes = Array.isArray(response.data?.routes) ? response.data.routes.slice(0, 3) : [];
    const parsedRoutes = routes.map((route: Record<string, unknown>, index: number) => {
      const legs = Array.isArray(route.legs) ? route.legs : [];
      const totalDistance = legs.reduce((sum, leg) => {
        const current = leg as Record<string, unknown>;
        return sum + Number((current.distance as Record<string, unknown> | undefined)?.value || 0);
      }, 0);
      const totalDuration = legs.reduce((sum, leg) => {
        const current = leg as Record<string, unknown>;
        return sum + Number(((current.duration_in_traffic || current.duration) as Record<string, unknown> | undefined)?.value || 0);
      }, 0);

      return {
        route_index: index,
        polyline_points: decodePolyline(String((route.overview_polyline as Record<string, unknown> | undefined)?.points || '')),
        total_distance_meters: totalDistance,
        total_duration_seconds: totalDuration,
        steps: parseGoogleSteps(route),
        avoids_tolls: true,
        avoids_ferries: true,
        provider: 'GOOGLE_MAPS',
      } satisfies Route;
    });

    requestCache.set(cacheKey, { expiresAt: Date.now() + 5 * 60 * 1000, routes: parsedRoutes });
    return parsedRoutes;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown_error';
    const routes = await getOsrmRoutes(origin, destination);
    requestCache.set(cacheKey, { expiresAt: Date.now() + 5 * 60 * 1000, routes });
    if (routes.length === 0) {
      throw new Error(`Directions lookup failed: ${message}`);
    }
    return routes;
  }
}
