import 'dotenv/config';
import admin from 'firebase-admin';
import { PubSub } from '@google-cloud/pubsub';
import express, { type Request, type Response } from 'express';
import winston from 'winston';
import { assessRouteElevation } from './elevation-checker';
import { getAlternativeRoutes } from './maps-client';
import { rankRoutes } from './route-ranker';
import type { GeoPoint, OptimizedRoute, RiskDecisionMessage } from './types';

const app = express();
const port = Number(process.env.PORT || 3003);
const pubsub = new PubSub({
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
});

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  transports: [new winston.transports.Console()],
});

function getFirestore(): FirebaseFirestore.Firestore {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      projectId: process.env.FIREBASE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT_ID,
    });
  }

  return admin.firestore();
}

app.use(express.json({ limit: '2mb' }));

async function findShipmentById(shipmentId: string): Promise<FirebaseFirestore.DocumentSnapshot> {
  return getFirestore().collection('shipments').doc(shipmentId).get();
}

async function findShipmentByRouteId(routeId: string): Promise<FirebaseFirestore.QueryDocumentSnapshot | null> {
  const snapshot = await getFirestore()
    .collection('shipments')
    .where('route_id', '==', routeId)
    .limit(1)
    .get();
  return snapshot.empty ? null : snapshot.docs[0];
}

async function storeOptimizedRoute(result: OptimizedRoute): Promise<void> {
  const firestore = getFirestore();
  await firestore.collection('optimized-routes').doc(`${result.shipment_id}-${Date.now()}`).set({
    ...result,
    created_at: admin.firestore.FieldValue.serverTimestamp(),
  });

  await pubsub.topic(process.env.PUBSUB_ROUTE_UPDATES_TOPIC || 'route-updates').publishMessage({
    json: result,
    attributes: {
      shipment_id: result.shipment_id,
      improvement_minutes: String(result.improvement_minutes),
    },
  });
}

async function optimizeShipmentRoute(shipmentId: string, fallbackRiskScore = 0): Promise<OptimizedRoute> {
  const shipmentSnapshot = await findShipmentById(shipmentId);
  if (!shipmentSnapshot.exists) {
    throw new Error(`Shipment ${shipmentId} not found.`);
  }

  const shipmentData = shipmentSnapshot.data() as Record<string, unknown>;
  const origin = shipmentData.origin as GeoPoint;
  const destination = shipmentData.destination as GeoPoint;

  const alternatives = await getAlternativeRoutes(origin, destination);
  const enrichedRoutes = await Promise.all(
    alternatives.map(async (route) => {
      const elevation = await assessRouteElevation(route.polyline_points);
      const durationRiskPenalty = Math.min(100, fallbackRiskScore + (elevation.flood_risk_zone ? 15 : 0));
      return {
        ...route,
        routeRiskScore: durationRiskPenalty,
        elevationPenalty: elevation.elevation_penalty,
        flood_risk_zone: elevation.flood_risk_zone,
        elevation_profile: elevation.elevation_profile,
      };
    }),
  );

  const ranked = rankRoutes(enrichedRoutes);
  if (ranked.length === 0) {
    throw new Error(`No routes available for shipment ${shipmentId}.`);
  }

  const originalEtaMinutes = Math.round((alternatives[0]?.total_duration_seconds || 0) / 60);
  const optimizedEtaMinutes = Math.round(ranked[0].route.total_duration_seconds / 60);
  const improvementMinutes = Math.max(0, originalEtaMinutes - optimizedEtaMinutes);
  const improvementPercent = originalEtaMinutes > 0
    ? Number(((improvementMinutes / originalEtaMinutes) * 100).toFixed(2))
    : 0;

  const result: OptimizedRoute = {
    shipment_id: shipmentId,
    primary_route: ranked[0].route,
    alternatives: ranked.map((entry) => ({
      ...entry.route,
      score: entry.score,
      flood_risk_zone: enrichedRoutes.find((route) => route.route_index === entry.route.route_index)?.flood_risk_zone ?? false,
      elevation_profile: enrichedRoutes.find((route) => route.route_index === entry.route.route_index)?.elevation_profile ?? [],
    })),
    recommendation_reason: `Selected route ${ranked[0].route.route_index} because it produced the lowest weighted ETA/risk/elevation/distance score.`,
    improvement_minutes: improvementMinutes,
    improvement_percent: improvementPercent,
    generated_at: new Date().toISOString(),
  };

  await storeOptimizedRoute(result);
  return result;
}

app.post('/optimize', async (request: Request, response: Response) => {
  try {
    const shipmentId = String(request.body.shipment_id || '');
    const fallbackRiskScore = Number(request.body.risk_score || 0);
    if (!shipmentId) {
      response.status(400).json({ error: 'shipment_id is required.' });
      return;
    }

    const result = await optimizeShipmentRoute(shipmentId, fallbackRiskScore);
    response.json(result);
  } catch (error) {
    logger.error({
      message: 'route_optimization_failed',
      error: error instanceof Error ? error.message : 'unknown_error',
    });
    response.status(500).json({ error: 'Failed to optimize route.' });
  }
});

app.post('/pubsub', async (request: Request, response: Response) => {
  try {
    const envelope = request.body as { message?: { data?: string; attributes?: Record<string, string> } };
    const payload = envelope.message?.data
      ? Buffer.from(envelope.message.data, 'base64').toString('utf8')
      : '{}';
    const message = JSON.parse(payload) as RiskDecisionMessage;
    const routeId = message.score.route_id;
    const shipment = await findShipmentByRouteId(routeId);

    if (!shipment) {
      response.status(204).send();
      return;
    }

    const result = await optimizeShipmentRoute(shipment.id, message.score.risk_score);
    response.status(200).json(result);
  } catch (error) {
    logger.error({
      message: 'route_pubsub_failed',
      error: error instanceof Error ? error.message : 'unknown_error',
    });
    response.status(500).json({ error: 'Failed to process route optimization message.' });
  }
});

app.get('/health', (_request: Request, response: Response) => {
  response.json({
    status: 'ok',
    service: 'route-optimizer',
    timestamp: new Date().toISOString(),
  });
});

app.listen(port, () => {
  logger.info({
    message: 'route_optimizer_started',
    port,
  });
});
