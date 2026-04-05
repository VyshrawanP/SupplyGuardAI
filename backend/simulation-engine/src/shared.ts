import admin from 'firebase-admin';
import winston from 'winston';

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface SimulationResult {
  session_id: string;
  scenario_type: string;
  scenario_parameters: object;
  impact_summary: {
    shipments_disrupted: number;
    shipments_rerouted: number;
    drones_dispatched: number;
    warehouses_inaccessible: number;
    estimated_survivors: number;
    rescue_missions_triggered: number;
    inventory_depleted_items: string[];
    supplier_alerts_generated: number;
    estimated_response_time_minutes: number;
    estimated_lives_at_risk: number;
  };
  affected_shipments: Record<string, unknown>[];
  affected_warehouses: Record<string, unknown>[];
  drone_deployment_plan: Record<string, unknown>[];
  rescue_deployment_plan: Record<string, unknown>[];
  inventory_runway: { [item: string]: number };
  pre_positioning_recommendation: Record<string, unknown>[];
  computed_at: string;
}

export function getFirestore(): FirebaseFirestore.Firestore {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      projectId: process.env.FIREBASE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT_ID,
    });
  }

  return admin.firestore();
}

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  transports: [new winston.transports.Console()],
});
