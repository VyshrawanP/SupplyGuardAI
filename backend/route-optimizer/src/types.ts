export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface RouteStep {
  instruction: string;
  distance_meters: number;
  duration_seconds: number;
}

export interface Route {
  route_index: number;
  polyline_points: GeoPoint[];
  total_distance_meters: number;
  total_duration_seconds: number;
  steps: RouteStep[];
  avoids_tolls: boolean;
  avoids_ferries: boolean;
  provider: 'GOOGLE_MAPS' | 'OSRM';
  base_risk_score?: number;
}

export interface RouteScore {
  route_index: number;
  total_score: number;
  eta_score: number;
  risk_score: number;
  elevation_score: number;
  distance_score: number;
}

export interface OptimizedRoute {
  shipment_id: string;
  primary_route: Route;
  alternatives: Array<Route & { score: RouteScore; flood_risk_zone: boolean; elevation_profile: number[] }>;
  recommendation_reason: string;
  improvement_minutes: number;
  improvement_percent: number;
  generated_at: string;
}

export interface RiskDecisionMessage {
  event: {
    event_id: string;
    type: string;
    severity: number;
    coordinates: GeoPoint;
    affected_radius_km: number;
    source: string;
    raw_payload: Record<string, unknown>;
  };
  score: {
    route_id: string;
    risk_score: number;
    delay_minutes: number;
    risk_category: string;
    confidence_percent: number;
    contributing_factors: Array<Record<string, unknown>>;
    computed_at: string;
    affected_route_ids: string[];
  };
}
