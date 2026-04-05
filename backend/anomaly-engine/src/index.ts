import 'dotenv/config';
import express, { type Request, type Response } from 'express';
import { publishSystemAlert } from './alert-publisher';
import { runDelayMonitor } from './monitors/delay-monitor';
import { runDroneMonitor } from './monitors/drone-monitor';
import { runInventoryMonitor } from './monitors/inventory-monitor';
import { runTeamMonitor } from './monitors/team-monitor';
import { logger } from './shared';

const app = express();
const port = Number(process.env.PORT || 3007);

app.use(express.json({ limit: '2mb' }));

async function runAllMonitors(): Promise<void> {
  await Promise.allSettled([
    runDelayMonitor(),
    runDroneMonitor(),
    runInventoryMonitor(),
    runTeamMonitor(),
  ]);
}

app.post('/pubsub', async (request: Request, response: Response) => {
  try {
    const envelope = request.body as { message?: { data?: string } };
    const payload = envelope.message?.data
      ? Buffer.from(envelope.message.data, 'base64').toString('utf8')
      : '{}';
    const message = JSON.parse(payload) as { event_type?: string; entity_id?: string };

    await publishSystemAlert({
      alert_type: message.event_type || 'EXTERNAL_ANOMALY_EVENT',
      severity: 'MEDIUM',
      description: `Anomaly engine received upstream event ${message.event_type || 'UNKNOWN'}.`,
      entity_id: message.entity_id,
      entity_type: 'upstream_event',
      metadata: message,
    });

    response.status(204).send();
  } catch (error) {
    logger.error({
      message: 'anomaly_pubsub_failed',
      error: error instanceof Error ? error.message : 'unknown_error',
    });
    response.status(500).json({ error: 'Failed to process anomaly event.' });
  }
});

app.get('/health', (_request: Request, response: Response) => {
  response.json({
    status: 'ok',
    service: 'anomaly-engine',
    timestamp: new Date().toISOString(),
  });
});

app.listen(port, () => {
  logger.info({
    message: 'anomaly_engine_started',
    port,
  });
  void runAllMonitors();
  setInterval(() => void runDelayMonitor(), 30_000);
  setInterval(() => void runDroneMonitor(), 30_000);
  setInterval(() => void runTeamMonitor(), 60_000);
  setInterval(() => void runInventoryMonitor(), 5 * 60_000);
});
