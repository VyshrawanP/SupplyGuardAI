export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface SurvivorCluster {
  cluster_id: string;
  center: { lat: number; lng: number };
  estimated_population: number;
  severity: 1 | 2 | 3 | 4 | 5;
  report_count: number;
  created_at: string;
  status: 'UNASSIGNED' | 'ASSIGNED' | 'REACHED' | 'EVACUATED';
}
