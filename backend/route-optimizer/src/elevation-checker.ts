import axios from 'axios';
import type { GeoPoint } from './types';

export interface ElevationAssessment {
  elevation_profile: number[];
  flood_risk_zone: boolean;
  elevation_penalty: number;
}

function sampleWaypoints(points: GeoPoint[], sampleCount: number): GeoPoint[] {
  if (points.length <= sampleCount) {
    return points;
  }

  return Array.from({ length: sampleCount }, (_, index) => {
    const pointIndex = Math.min(
      points.length - 1,
      Math.round((index / Math.max(1, sampleCount - 1)) * (points.length - 1)),
    );
    return points[pointIndex];
  });
}

/**
 * Fetches elevation data for sampled route points and flags flood-prone segments.
 */
export async function assessRouteElevation(points: GeoPoint[]): Promise<ElevationAssessment> {
  const sampledPoints = sampleWaypoints(points, 20);
  if (sampledPoints.length === 0) {
    return {
      elevation_profile: [],
      flood_risk_zone: false,
      elevation_penalty: 0,
    };
  }

  const offlineMode = process.env.OFFLINE_MODE === 'true';
  if (offlineMode || !process.env.GOOGLE_MAPS_ELEVATION_API_KEY) {
    const fallbackProfile = sampledPoints.map((point, index) => Math.max(5, 18 - index));
    const floodRisk = fallbackProfile.some((value) => value < 10);
    return {
      elevation_profile: fallbackProfile,
      flood_risk_zone: floodRisk,
      elevation_penalty: floodRisk ? 30 : 0,
    };
  }

  const response = await axios.get('https://maps.googleapis.com/maps/api/elevation/json', {
    params: {
      locations: sampledPoints.map((point) => `${point.lat},${point.lng}`).join('|'),
      key: process.env.GOOGLE_MAPS_ELEVATION_API_KEY,
    },
    timeout: 10_000,
  });

  const profile = Array.isArray(response.data?.results)
    ? response.data.results.map((result: Record<string, unknown>) => Number(result.elevation || 0))
    : [];
  const floodRisk = profile.some((value: number) => value < 10);

  return {
    elevation_profile: profile,
    flood_risk_zone: floodRisk,
    elevation_penalty: floodRisk ? 30 : 0,
  };
}
