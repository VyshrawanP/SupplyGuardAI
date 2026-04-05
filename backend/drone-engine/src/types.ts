export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface DroneCandidate {
  drone_id: string;
  distance_km: number;
  battery_percent: number;
  max_payload_kg: number;
  available_payload_kg: number;
  suitability_score: number;
}

export interface PayloadManifestItem {
  item_name: string;
  requested_quantity: number;
  assigned_quantity: number;
  unit: string;
  weight_kg_per_unit: number;
  warehouse_id: string;
}

export interface FlightPlanWaypoint extends GeoPoint {
  altitude_m: number;
}

export interface FlightPlan {
  waypoints: FlightPlanWaypoint[];
  total_distance_km: number;
  estimated_flight_minutes: number;
  battery_consumption_percent: number;
  battery_remaining_at_destination: number;
  return_possible: boolean;
}

export interface DroneDispatchRequest {
  disaster_zone_center: GeoPoint;
  survivor_cluster_center: GeoPoint;
  requested_payload_manifest: Array<{
    item_name: string;
    quantity: number;
    unit: string;
    size?: string;
    weight_kg_per_unit?: number;
  }>;
  operator_uid?: string;
}
