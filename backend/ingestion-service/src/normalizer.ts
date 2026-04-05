import admin from 'firebase-admin';
import { v4 as uuidv4 } from 'uuid';

export interface DisasterEvent {
  event_id: string;
  type: 'FLOOD' | 'CYCLONE' | 'ROAD_BLOCKAGE' | 'HEAVY_RAIN' | 'EARTHQUAKE' | 'BRIDGE_FAILURE';
  severity: 1 | 2 | 3 | 4 | 5;
  coordinates: { lat: number; lng: number };
  affected_radius_km: number;
  source: string;
  raw_payload: Record<string, unknown>;
  processed: boolean;
  created_at: FirebaseFirestore.Timestamp;
  expires_at: FirebaseFirestore.Timestamp;
}

export interface RawSignal {
  source: string;
  signalType?: string;
  coordinates?: { lat: number; lng: number };
  payload: Record<string, unknown>;
}

function ensureFirestore(): void {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      projectId: process.env.FIREBASE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT_ID,
    });
  }
}

function inferEventType(signal: RawSignal): DisasterEvent['type'] {
  const payload = signal.payload;
  const precipitation = Number(payload.precipitation_mm_per_hr ?? 0);
  const windSpeed = Number(payload.wind_speed_kmh ?? 0);
  const waterLevel = Number(payload.water_level_m ?? 0);
  const trafficRatio = Number(payload.traffic_ratio ?? 0);
  const vibration = Number(payload.vibration_score ?? 0);

  if (waterLevel > 0) {
    return 'FLOOD';
  }
  if (windSpeed >= 60) {
    return 'CYCLONE';
  }
  if (trafficRatio >= 2.5 || vibration >= 0.85) {
    return 'ROAD_BLOCKAGE';
  }
  if (precipitation > 0) {
    return 'HEAVY_RAIN';
  }

  return 'ROAD_BLOCKAGE';
}

function inferSeverity(payload: Record<string, unknown>): DisasterEvent['severity'] {
  const precipitation = Number(payload.precipitation_mm_per_hr ?? 0);
  const windSpeed = Number(payload.wind_speed_kmh ?? 0);
  const trafficRatio = Number(payload.traffic_ratio ?? 0);
  const waterLevel = Number(payload.water_level_m ?? 0);

  if (precipitation > 50 || windSpeed > 90 || waterLevel > 3) {
    return 5;
  }
  if ((precipitation >= 20 && precipitation <= 50) || (windSpeed >= 60 && windSpeed <= 90) || (waterLevel >= 1 && waterLevel <= 3) || trafficRatio > 4) {
    return 4;
  }
  if (trafficRatio >= 2.5) {
    return 3;
  }
  if (precipitation > 0 || windSpeed > 0) {
    return 2;
  }

  return 1;
}

/**
 * Normalizes any raw upstream signal into a deterministic DisasterEvent document.
 */
export function normalizeSignal(signal: RawSignal): DisasterEvent {
  ensureFirestore();

  const createdAt = admin.firestore.Timestamp.now();
  const expiresAt = admin.firestore.Timestamp.fromMillis(createdAt.toMillis() + 72 * 60 * 60 * 1000);
  const severity = inferSeverity(signal.payload);

  return {
    event_id: uuidv4(),
    type: inferEventType(signal),
    severity,
    coordinates: signal.coordinates ?? {
      lat: Number(signal.payload.lat ?? signal.payload.latitude ?? 0),
      lng: Number(signal.payload.lng ?? signal.payload.longitude ?? 0),
    },
    affected_radius_km: Number(signal.payload.affected_radius_km ?? Math.max(3, severity * 5)),
    source: signal.source,
    raw_payload: signal.payload,
    processed: false,
    created_at: createdAt,
    expires_at: expiresAt,
  };
}
