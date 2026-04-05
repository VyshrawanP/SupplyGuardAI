import 'dotenv/config';
import admin from 'firebase-admin';
import express, { type Request, type Response } from 'express';
import winston from 'winston';
import { selectDrone } from './drone-selector';
import { sendMissionBriefing } from './fcm-notifier';
import { createFlightPlan } from './flight-planner';
import { assignPayload } from './payload-assigner';
import { handleTelemetryUpdate } from './telemetry-handler';
import type { DroneDispatchRequest, GeoPoint } from './types';

const app = express();
const port = Number(process.env.PORT || 3004);

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

async function createDispatch(requestPayload: DroneDispatchRequest): Promise<Record<string, unknown>> {
  const firestore = getFirestore();
  const requestedPayloadWeight = requestPayload.requested_payload_manifest.reduce(
    (sum, item) => sum + item.quantity * Number(item.weight_kg_per_unit || 1),
    0,
  );

  const { selected, candidates, droneData } = await selectDrone(
    requestPayload.disaster_zone_center,
    requestedPayloadWeight,
  );

  const dispatchRef = firestore.collection('drone-dispatches').doc();
  const assignment = await assignPayload(
    dispatchRef.id,
    requestPayload.disaster_zone_center,
    selected.drone_id,
    requestPayload.requested_payload_manifest,
    selected.max_payload_kg,
  );

  const flightPlan = await createFlightPlan(
    droneData.home_depot as GeoPoint,
    requestPayload.survivor_cluster_center,
    selected.battery_percent,
    Number(droneData.cruise_speed_kmh || 60),
  );

  const dispatch = {
    dispatch_id: dispatchRef.id,
    drone_id: selected.drone_id,
    status: 'ASSIGNED',
    disaster_zone_center: requestPayload.disaster_zone_center,
    destination: requestPayload.survivor_cluster_center,
    payload_manifest: assignment.manifest,
    total_payload_weight_kg: assignment.totalPayloadWeightKg,
    flight_plan: flightPlan,
    candidate_rankings: candidates,
    operator_uid: String(requestPayload.operator_uid || droneData.operator_uid || ''),
    eta_minutes: flightPlan.estimated_flight_minutes,
    dispatched_at: new Date().toISOString(),
  };

  await dispatchRef.set({
    ...dispatch,
    created_at: admin.firestore.FieldValue.serverTimestamp(),
    updated_at: admin.firestore.FieldValue.serverTimestamp(),
  });

  if (dispatch.operator_uid) {
    await sendMissionBriefing({
      dispatch_id: dispatchRef.id,
      operator_uid: dispatch.operator_uid,
      drone_id: dispatch.drone_id,
      destination: requestPayload.survivor_cluster_center,
      payload_manifest: assignment.manifest,
      estimated_flight_minutes: flightPlan.estimated_flight_minutes,
      battery_at_dispatch: selected.battery_percent,
      flight_plan: flightPlan,
    });
  }

  return dispatch;
}

app.post('/dispatch', async (request: Request, response: Response) => {
  try {
    const dispatch = await createDispatch(request.body as DroneDispatchRequest);
    response.status(201).json(dispatch);
  } catch (error) {
    logger.error({
      message: 'drone_dispatch_failed',
      error: error instanceof Error ? error.message : 'unknown_error',
    });
    response.status(500).json({ error: 'Failed to dispatch drone.' });
  }
});

app.post('/telemetry', async (request: Request, response: Response) => {
  try {
    await handleTelemetryUpdate(request.body as {
      drone_id: string;
      dispatch_id: string;
      current_position: GeoPoint;
      battery_percent: number;
      destination: GeoPoint;
      estimated_speed_kmh?: number;
    });
    response.status(202).json({ status: 'accepted' });
  } catch (error) {
    logger.error({
      message: 'telemetry_failed',
      error: error instanceof Error ? error.message : 'unknown_error',
    });
    response.status(500).json({ error: 'Failed to process telemetry.' });
  }
});

app.post('/pubsub', async (request: Request, response: Response) => {
  try {
    const envelope = request.body as { message?: { data?: string; attributes?: Record<string, string> } };
    const attributes = envelope.message?.attributes || {};
    if (attributes.drone_dispatch_required !== 'true') {
      response.status(204).send();
      return;
    }

    const payload = envelope.message?.data
      ? Buffer.from(envelope.message.data, 'base64').toString('utf8')
      : '{}';
    const message = JSON.parse(payload) as { event?: { coordinates?: GeoPoint } };
    const center = message.event?.coordinates;
    if (!center) {
      response.status(400).json({ error: 'Missing disaster coordinates.' });
      return;
    }

    const dispatch = await createDispatch({
      disaster_zone_center: center,
      survivor_cluster_center: center,
      requested_payload_manifest: [
        { item_name: 'life_jacket', quantity: 5, unit: 'piece', weight_kg_per_unit: 1.2, size: 'M' },
        { item_name: 'first_aid_kit', quantity: 2, unit: 'kit', weight_kg_per_unit: 1.5 },
        { item_name: 'drinking_water_litre', quantity: 10, unit: 'litre', weight_kg_per_unit: 1 },
      ],
    });

    response.status(200).json(dispatch);
  } catch (error) {
    logger.error({
      message: 'drone_pubsub_failed',
      error: error instanceof Error ? error.message : 'unknown_error',
    });
    response.status(500).json({ error: 'Failed to process drone dispatch message.' });
  }
});

app.get('/fleet/status', async (_request: Request, response: Response) => {
  const snapshot = await getFirestore().collection('drone-fleet').get();
  response.json(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
});

app.put('/dispatch/:id/status', async (request: Request, response: Response) => {
  try {
    const status = String(request.body.status || '');
    const dispatchId = Array.isArray(request.params.id) ? request.params.id[0] : request.params.id;
    await getFirestore().collection('drone-dispatches').doc(dispatchId).set({
      status,
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
    response.json({ status: 'updated' });
  } catch (error) {
    response.status(500).json({ error: 'Failed to update dispatch status.' });
  }
});

app.get('/health', (_request: Request, response: Response) => {
  response.json({
    status: 'ok',
    service: 'drone-engine',
    timestamp: new Date().toISOString(),
  });
});

app.listen(port, () => {
  logger.info({
    message: 'drone_engine_started',
    port,
  });
});
