import 'dotenv/config';
import express, { type Request, type Response } from 'express';
import { analyzeSimulationImpact } from './impact-analyzer';
import { runScenario } from './scenario-runner';
import { cloneSystemState } from './state-cloner';
import { getFirestore, logger } from './shared';

const app = express();
const port = Number(process.env.PORT || 3009);

app.use(express.json({ limit: '2mb' }));

app.post('/simulate', async (request: Request, response: Response) => {
  try {
    const sessionId = getFirestore().collection('_simulation-sessions').doc().id;
    const scenarioType = String(request.body.scenario_type || '');
    const scenarioParameters = request.body.parameters || {};

    const cloneManifest = await cloneSystemState(sessionId);
    const scenarioEffects = await runScenario(sessionId, scenarioType, scenarioParameters);
    const result = await analyzeSimulationImpact(sessionId, scenarioType, scenarioParameters);

    await getFirestore().collection('_simulation-sessions').doc(sessionId).set({
      session_id: sessionId,
      scenario_type: scenarioType,
      scenario_parameters: scenarioParameters,
      clone_manifest: cloneManifest,
      scenario_effects: scenarioEffects,
      result,
      created_at: new Date().toISOString(),
    });

    response.status(201).json({
      session_id: sessionId,
      clone_manifest: cloneManifest,
      scenario_effects: scenarioEffects,
      result,
    });
  } catch (error) {
    logger.error({
      message: 'simulation_start_failed',
      error: error instanceof Error ? error.message : 'unknown_error',
    });
    response.status(500).json({ error: 'Failed to start simulation.' });
  }
});

app.get('/simulate/:session_id', async (request: Request, response: Response) => {
  const sessionId = Array.isArray(request.params.session_id) ? request.params.session_id[0] : request.params.session_id;
  const snapshot = await getFirestore().collection('_simulation-sessions').doc(sessionId).get();
  if (!snapshot.exists) {
    response.status(404).json({ error: 'Simulation session not found.' });
    return;
  }
  response.json(snapshot.data());
});

app.delete('/simulate/:session_id', async (request: Request, response: Response) => {
  try {
    const sessionId = Array.isArray(request.params.session_id) ? request.params.session_id[0] : request.params.session_id;
    const firestore = getFirestore();
    const collections = [
      'shipments',
      'drone-fleet',
      'warehouses',
      'rescue-teams',
      'survivor-clusters',
      'disaster-events',
      'route-risk-scores',
    ];

    for (const suffix of collections) {
      const snapshot = await firestore.collection(`sim-${sessionId}-${suffix}`).get();
      await Promise.all(snapshot.docs.map((doc) => doc.ref.delete()));
    }

    await firestore.collection('_simulation-sessions').doc(sessionId).delete();
    response.json({ status: 'deleted', session_id: sessionId });
  } catch (error) {
    response.status(500).json({ error: 'Failed to delete simulation session.' });
  }
});

app.post('/simulate/:session_id/inject', async (request: Request, response: Response) => {
  try {
    const sessionId = Array.isArray(request.params.session_id) ? request.params.session_id[0] : request.params.session_id;
    const scenarioType = String(request.body.scenario_type || 'FLOOD');
    const scenarioParameters = request.body.parameters || {};
    const scenarioEffects = await runScenario(sessionId, scenarioType, scenarioParameters);
    const result = await analyzeSimulationImpact(sessionId, scenarioType, scenarioParameters);
    await getFirestore().collection('_simulation-sessions').doc(sessionId).set({
      last_injected_at: new Date().toISOString(),
      latest_injection: {
        scenario_type: scenarioType,
        scenario_parameters: scenarioParameters,
        scenario_effects: scenarioEffects,
      },
      result,
    }, { merge: true });
    response.json({ session_id: sessionId, scenario_effects: scenarioEffects, result });
  } catch (error) {
    response.status(500).json({ error: 'Failed to inject simulation event.' });
  }
});

app.get('/health', (_request: Request, response: Response) => {
  response.json({
    status: 'ok',
    service: 'simulation-engine',
    timestamp: new Date().toISOString(),
  });
});

app.listen(port, () => {
  logger.info({
    message: 'simulation_engine_started',
    port,
  });
});
