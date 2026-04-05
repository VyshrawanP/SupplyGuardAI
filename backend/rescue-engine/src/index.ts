import 'dotenv/config';
import admin from 'firebase-admin';
import express, { type Request, type Response } from 'express';
import winston from 'winston';
import { detectSurvivorClusters } from './cluster-detector';
import { notifyRescueTeam } from './fcm-notifier';
import { matchTeamToCluster } from './team-matcher';
import type { SurvivorCluster } from './types';

const app = express();
const port = Number(process.env.PORT || 3005);

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

app.post('/alert', async (request: Request, response: Response) => {
  try {
    const cluster = request.body as SurvivorCluster;
    const assignment = await matchTeamToCluster(cluster);
    await notifyRescueTeam({
      team_id: String(assignment.team_id),
      cluster,
      supplies: {
        water_cases: Math.ceil(cluster.estimated_population / 20),
        medical_kits: Math.max(1, Math.ceil(cluster.severity / 2)),
        food_packets: Math.ceil(cluster.estimated_population * 1.5),
      },
    });
    response.status(201).json(assignment);
  } catch (error) {
    logger.error({
      message: 'rescue_alert_failed',
      error: error instanceof Error ? error.message : 'unknown_error',
    });
    response.status(500).json({ error: 'Failed to dispatch rescue team.' });
  }
});

app.post('/survivor-report', async (request: Request, response: Response) => {
  try {
    const reportRef = await getFirestore().collection('survivor-reports').add({
      ...request.body,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      cluster_id: null,
    });
    const clusters = await detectSurvivorClusters();
    response.status(201).json({ report_id: reportRef.id, clusters });
  } catch (error) {
    logger.error({
      message: 'survivor_report_failed',
      error: error instanceof Error ? error.message : 'unknown_error',
    });
    response.status(500).json({ error: 'Failed to submit survivor report.' });
  }
});

app.get('/clusters/active', async (_request: Request, response: Response) => {
  const snapshot = await getFirestore().collection('survivor-clusters').get();
  response.json(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
});

app.put('/assignment/:id/status', async (request: Request, response: Response) => {
  try {
    const assignmentId = Array.isArray(request.params.id) ? request.params.id[0] : request.params.id;
    await getFirestore().collection('rescue-assignments').doc(assignmentId).set({
      status: String(request.body.status || ''),
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
    response.json({ status: 'updated' });
  } catch (error) {
    response.status(500).json({ error: 'Failed to update assignment status.' });
  }
});

app.get('/health', (_request: Request, response: Response) => {
  response.json({
    status: 'ok',
    service: 'rescue-engine',
    timestamp: new Date().toISOString(),
  });
});

app.listen(port, () => {
  logger.info({
    message: 'rescue_engine_started',
    port,
  });
});
