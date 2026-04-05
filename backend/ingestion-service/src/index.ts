import 'dotenv/config';
import express, { type Request, type Response } from 'express';
import winston from 'winston';
import { persistDisasterEvent, markDisasterEventProcessed } from './firestore-writer';
import { normalizeSignal, type RawSignal } from './normalizer';
import { publishDisasterEvent } from './pubsub-publisher';
import { pollDisasterSignals } from './scheduler';

const app = express();
const port = Number(process.env.PORT || 3001);

let lastIngestionTimestamp: string | null = null;

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  transports: [new winston.transports.Console()],
});

app.use(express.json({ limit: '2mb' }));

/**
 * Ingests one raw signal, normalizes it, stores it, and publishes it downstream.
 */
async function processSignal(signal: RawSignal) {
  const event = normalizeSignal(signal);
  await persistDisasterEvent(event);
  await publishDisasterEvent(event);
  lastIngestionTimestamp = new Date().toISOString();
  return event;
}

/**
 * Executes the scheduled poll cycle against all configured upstream sources.
 */
async function runSchedulerCycle(): Promise<void> {
  try {
    const signals = await pollDisasterSignals();
    for (const signal of signals) {
      await processSignal(signal);
    }
    logger.info({
      message: 'scheduler_cycle_completed',
      signalCount: signals.length,
      lastIngestionTimestamp,
    });
  } catch (error) {
    logger.error({
      message: 'scheduler_cycle_failed',
      error: error instanceof Error ? error.message : 'unknown_error',
    });
  }
}

app.post('/ingest', async (request: Request, response: Response) => {
  try {
    const signal = request.body as RawSignal;
    const event = await processSignal(signal);
    response.status(202).json({ status: 'accepted', event });
  } catch (error) {
    logger.error({
      message: 'ingest_failed',
      error: error instanceof Error ? error.message : 'unknown_error',
    });
    response.status(400).json({ error: 'Failed to ingest webhook payload.' });
  }
});

app.post('/ingest/simulate', async (request: Request, response: Response) => {
  try {
    const signal = request.body as RawSignal;
    const event = await processSignal({
      ...signal,
      source: signal.source || 'simulation-engine',
    });
    response.status(202).json({ status: 'accepted', event });
  } catch (error) {
    logger.error({
      message: 'simulation_ingest_failed',
      error: error instanceof Error ? error.message : 'unknown_error',
    });
    response.status(400).json({ error: 'Failed to ingest simulated signal.' });
  }
});

app.post('/acknowledge', async (request: Request, response: Response) => {
  try {
    const eventId = String(request.body.event_id || '');
    if (!eventId) {
      response.status(400).json({ error: 'event_id is required.' });
      return;
    }

    await markDisasterEventProcessed(eventId);
    response.json({ status: 'updated', event_id: eventId });
  } catch (error) {
    logger.error({
      message: 'acknowledge_failed',
      error: error instanceof Error ? error.message : 'unknown_error',
    });
    response.status(500).json({ error: 'Failed to acknowledge event processing.' });
  }
});

app.get('/health', (_request: Request, response: Response) => {
  response.json({
    status: 'ok',
    last_ingestion_timestamp: lastIngestionTimestamp,
    service: 'ingestion-service',
  });
});

app.listen(port, () => {
  logger.info({
    message: 'ingestion_service_started',
    port,
  });

  void runSchedulerCycle();
  setInterval(() => {
    void runSchedulerCycle();
  }, 60_000);
});
