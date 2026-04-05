import type { Route, RouteScore } from './types';

export interface RankedRoute {
  route: Route;
  score: RouteScore;
}

/**
 * Applies weighted ranking across ETA, risk, elevation, and distance where lower is better.
 */
export function rankRoutes(
  routes: Array<Route & { elevationPenalty: number; routeRiskScore: number }>,
): RankedRoute[] {
  if (routes.length === 0) {
    return [];
  }

  const maxDuration = Math.max(...routes.map((route) => route.total_duration_seconds), 1);
  const maxRisk = Math.max(...routes.map((route) => route.routeRiskScore), 1);
  const maxElevation = Math.max(...routes.map((route) => route.elevationPenalty), 1);
  const maxDistance = Math.max(...routes.map((route) => route.total_distance_meters), 1);

  return routes
    .map((route) => {
      const etaScore = (route.total_duration_seconds / maxDuration) * 100 * 0.4;
      const riskScore = (route.routeRiskScore / maxRisk) * 100 * 0.35;
      const elevationScore = (route.elevationPenalty / maxElevation) * 100 * 0.15;
      const distanceScore = (route.total_distance_meters / maxDistance) * 100 * 0.1;

      return {
        route,
        score: {
          route_index: route.route_index,
          total_score: Number((etaScore + riskScore + elevationScore + distanceScore).toFixed(2)),
          eta_score: Number(etaScore.toFixed(2)),
          risk_score: Number(riskScore.toFixed(2)),
          elevation_score: Number(elevationScore.toFixed(2)),
          distance_score: Number(distanceScore.toFixed(2)),
        },
      };
    })
    .sort((left, right) => left.score.total_score - right.score.total_score);
}
