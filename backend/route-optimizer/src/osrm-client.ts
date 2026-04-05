import axios from 'axios';
import type { GeoPoint, Route } from './types';

function stepInstruction(step: Record<string, unknown>): string {
  const maneuver = step.maneuver as Record<string, unknown> | undefined;
  const modifier = maneuver?.modifier ? ` ${String(maneuver.modifier)}` : '';
  return `${String(maneuver?.type || 'continue')}${modifier}`.trim();
}

/**
 * Requests alternative routes from the local OSRM service for offline routing.
 */
export async function getOsrmRoutes(origin: GeoPoint, destination: GeoPoint): Promise<Route[]> {
  const baseUrl = process.env.LOCAL_OSRM_URL || 'http://localhost:5000';
  const url = `${baseUrl}/route/v1/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}`;

  try {
    const response = await axios.get(url, {
      params: {
        alternatives: true,
        steps: true,
        geometries: 'geojson',
      },
      timeout: 10_000,
    });

    const routes = Array.isArray(response.data?.routes) ? response.data.routes : [];
    return routes.map((route: Record<string, unknown>, index: number) => {
      const legs = Array.isArray(route.legs) ? route.legs : [];
      const steps = legs.flatMap((leg) => Array.isArray((leg as Record<string, unknown>).steps) ? (leg as Record<string, unknown>).steps : []);
      const geometry = route.geometry as { coordinates?: number[][] } | undefined;

      return {
        route_index: index,
        polyline_points: (geometry?.coordinates || []).map(([lng, lat]) => ({ lat, lng })),
        total_distance_meters: Number(route.distance || 0),
        total_duration_seconds: Number(route.duration || 0),
        steps: steps.map((step) => {
          const current = step as Record<string, unknown>;
          return {
            instruction: stepInstruction(current),
            distance_meters: Number(current.distance || 0),
            duration_seconds: Number(current.duration || 0),
          };
        }),
        avoids_tolls: false,
        avoids_ferries: false,
        provider: 'OSRM',
      } satisfies Route;
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown_error';
    throw new Error(`OSRM fallback unavailable: ${message}; fallback_available=false`);
  }
}
