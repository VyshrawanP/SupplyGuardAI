import 'dotenv/config';
import express, { type Request, type Response } from 'express';
import winston from 'winston';
import { publishRiskDecision } from './pubsub-downstream';
import { calculateRiskScore, type DisasterEventPayload } from './risk-calculator';
import { findAffectedRoutes } from './route-scorer';

const app = express();
const port = Number(process.env.PORT || 3002);

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  transports: [new winston.transports.Console()],
});

app.use(express.json({ limit: '2mb' }));

async function processDisasterEvent(event: DisasterEventPayload) {
  const affectedRoutes = await findAffectedRoutes(event.coordinates, event.affected_radius_km);

  if (affectedRoutes.length === 0) {
    return [];
  }

  const allRouteIds = affectedRoutes.map((route) => route.route_id);
  const results = await Promise.all(
    affectedRoutes.map(async (route) => {
      const score = await calculateRiskScore(event, route.route_id, allRouteIds);
      await publishRiskDecision(event, score);
      return score;
    }),
  );

  return results;
}

app.post('/score', async (request: Request, response: Response) => {
  try {
    const event = request.body as DisasterEventPayload;
    const scores = await processDisasterEvent(event);
    response.json({ scores });
  } catch (error) {
    logger.error({
      message: 'risk_score_failed',
      error: error instanceof Error ? error.message : 'unknown_error',
    });
    response.status(500).json({ error: 'Failed to compute risk scores.' });
  }
});

app.post('/pubsub', async (request: Request, response: Response) => {
  try {
    const envelope = request.body as { message?: { data?: string } };
    const messageData = envelope.message?.data
      ? Buffer.from(envelope.message.data, 'base64').toString('utf8')
      : '{}';
    const event = JSON.parse(messageData) as DisasterEventPayload;
    const scores = await processDisasterEvent(event);
    response.status(204).send(scores);
  } catch (error) {
    logger.error({
      message: 'risk_pubsub_failed',
      error: error instanceof Error ? error.message : 'unknown_error',
    });
    response.status(500).json({ error: 'Failed to process disaster signal.' });
  }
});

app.get('/health', (_request: Request, response: Response) => {
  response.json({
    status: 'ok',
    service: 'risk-engine',
    timestamp: new Date().toISOString(),
  });
});

app.listen(port, () => {
  logger.info({
    message: 'risk_engine_started',
    port,
  });
});
