import admin from 'firebase-admin';

export interface Factor {
  name: string;
  value: number;
  weight: number;
  contribution: number;
}

export interface RiskScore {
  route_id: string;
  risk_score: number;
  delay_minutes: number;
  risk_category: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  confidence_percent: number;
  contributing_factors: Factor[];
  computed_at: string;
  affected_route_ids: string[];
}

export interface DisasterEventPayload {
  event_id: string;
  type: string;
  severity: number;
  coordinates: { lat: number; lng: number };
  affected_radius_km: number;
  source: string;
  raw_payload: Record<string, unknown>;
}

function ensureFirestore(): FirebaseFirestore.Firestore {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      projectId: process.env.FIREBASE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT_ID,
    });
  }

  return admin.firestore();
}

function roundToNearestFive(minutes: number): number {
  return Math.max(0, Math.round(minutes / 5) * 5);
}

function categoryForRisk(score: number): RiskScore['risk_category'] {
  if (score <= 30) {
    return 'LOW';
  }
  if (score <= 60) {
    return 'MEDIUM';
  }
  if (score <= 85) {
    return 'HIGH';
  }
  return 'CRITICAL';
}

async function loadHistoricalRisk(routeId: string): Promise<{ incidents: number; maxIncidents: number }> {
  const month = new Date().getUTCMonth() + 1;
  const snapshot = await ensureFirestore()
    .collection('historical-risk-data')
    .where('route_id', '==', routeId)
    .where('month', '==', month)
    .get();

  const incidents = snapshot.docs.reduce((sum, doc) => sum + Number(doc.get('incident_count') || 0), 0);
  const maxIncidents = Math.max(
    incidents,
    ...snapshot.docs.map((doc) => Number(doc.get('max_historical_incidents') || 1)),
    1,
  );

  return { incidents, maxIncidents };
}

/**
 * Computes the deterministic risk score for a route given a disaster event and optional route context.
 */
export async function calculateRiskScore(
  event: DisasterEventPayload,
  routeId: string,
  affectedRouteIds: string[],
): Promise<RiskScore> {
  const payload = event.raw_payload;
  const precipitation = Number(payload.precipitation_mm_per_hr ?? 0);
  const windSpeed = Number(payload.wind_speed_kmh ?? 0);
  const currentTravelTime = Number(payload.current_travel_time_minutes ?? payload.current_travel_time ?? 0);
  const freeFlowTime = Math.max(
    1,
    Number((payload.free_flow_travel_time_minutes ?? payload.free_flow_travel_time ?? currentTravelTime) || 1),
  );
  const waterLevel = Number(payload.water_level_m ?? 0);
  const vibrationAnomaly = Boolean(payload.sensor_vibration_anomaly ?? (Number(payload.vibration_score ?? 0) >= 0.85));

  const precipitationScore = Math.min(40, (precipitation / 50) * 40);
  const windScore = Math.min(40, (windSpeed / 120) * 40);
  const weatherRisk = Math.max(precipitationScore, windScore);

  const congestionRatio = Math.max(1, currentTravelTime > 0 ? currentTravelTime / freeFlowTime : Number(payload.traffic_ratio ?? 1));
  const trafficRisk = Math.max(0, Math.min(25, ((congestionRatio - 1) / 3) * 25));

  const waterLevelRisk = Math.min(20, (waterLevel / 3) * 20);
  const sensorDamageRisk = vibrationAnomaly ? 15 : 0;
  const roadRisk = Math.max(waterLevelRisk, sensorDamageRisk);

  const historicalData = await loadHistoricalRisk(routeId);
  const historicalRisk = (historicalData.incidents / historicalData.maxIncidents) * 15;

  const compositeRiskScore = Math.min(100, Math.round(weatherRisk + trafficRisk + roadRisk + historicalRisk));
  const baseDelay = Math.max(0, freeFlowTime * (congestionRatio - 1));
  const weatherDelay = precipitationScore > 20 ? baseDelay * 0.5 : 0;
  const delayMinutes = roundToNearestFive(baseDelay + weatherDelay);

  const weatherObservedAt = payload.observed_at ? new Date(String(payload.observed_at)) : new Date();
  const trafficObservedAt = payload.checked_at ? new Date(String(payload.checked_at)) : new Date();
  const now = Date.now();

  let confidence = 95;
  if (now - weatherObservedAt.getTime() > 30 * 60 * 1000) {
    confidence -= 10;
  }
  if (now - trafficObservedAt.getTime() > 10 * 60 * 1000) {
    confidence -= 10;
  }
  if (!('water_level_m' in payload) && !('vibration_score' in payload)) {
    confidence -= 15;
  }

  const contributingFactors: Factor[] = [
    {
      name: 'weather_risk',
      value: Number(weatherRisk.toFixed(2)),
      weight: 1,
      contribution: Number(weatherRisk.toFixed(2)),
    },
    {
      name: 'traffic_risk',
      value: Number(trafficRisk.toFixed(2)),
      weight: 1,
      contribution: Number(trafficRisk.toFixed(2)),
    },
    {
      name: 'road_risk',
      value: Number(roadRisk.toFixed(2)),
      weight: 1,
      contribution: Number(roadRisk.toFixed(2)),
    },
    {
      name: 'historical_risk',
      value: Number(historicalRisk.toFixed(2)),
      weight: 1,
      contribution: Number(historicalRisk.toFixed(2)),
    },
  ];

  return {
    route_id: routeId,
    risk_score: compositeRiskScore,
    delay_minutes: delayMinutes,
    risk_category: categoryForRisk(compositeRiskScore),
    confidence_percent: Math.max(60, confidence),
    contributing_factors: contributingFactors,
    computed_at: new Date().toISOString(),
    affected_route_ids: affectedRouteIds,
  };
}
