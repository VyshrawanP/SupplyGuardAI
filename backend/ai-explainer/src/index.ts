import 'dotenv/config';
import express, { type Request, type Response } from 'express';
import { generateExplanation } from './gemini-client';
import { logger } from './shared';

const app = express();
const port = Number(process.env.PORT || 3008);

app.use(express.json({ limit: '2mb' }));

app.post('/explain', async (request: Request, response: Response) => {
  try {
    const explanation = await generateExplanation(request.body as Parameters<typeof generateExplanation>[0]);
    response.json(explanation);
  } catch (error) {
    logger.error({
      message: 'explain_failed',
      error: error instanceof Error ? error.message : 'unknown_error',
    });
    response.status(500).json({ error: 'Failed to generate explanation.' });
  }
});

app.post('/pubsub', async (request: Request, response: Response) => {
  try {
    const envelope = request.body as { message?: { data?: string } };
    const payload = envelope.message?.data
      ? Buffer.from(envelope.message.data, 'base64').toString('utf8')
      : '{}';
    const message = JSON.parse(payload) as {
      alert_id?: string;
      alert_type?: string;
      severity?: string;
      description?: string;
      metadata?: Record<string, unknown>;
    };

    const explanation = await generateExplanation({
      event_id: message.alert_id,
      event_type: message.alert_type || 'SYSTEM_ALERT',
      location_name: String(message.metadata?.location_name || 'Unknown location'),
      lat: Number(message.metadata?.lat || 0),
      lng: Number(message.metadata?.lng || 0),
      severity: Number(message.metadata?.severity || 3),
      risk_score: Number(message.metadata?.risk_score || 60),
      risk_category: String(message.metadata?.risk_category || message.severity || 'HIGH'),
      factors_json: JSON.stringify(message.metadata?.factors || []),
      confidence_percent: Number(message.metadata?.confidence_percent || 75),
      action_taken: String(message.metadata?.action_taken || message.alert_type || 'ALERT_PUBLISHED'),
      threshold: Number(message.metadata?.threshold || 60),
      original_eta: Number(message.metadata?.original_eta || 0),
      optimized_eta: Number(message.metadata?.optimized_eta || 0),
      improvement_minutes: Number(message.metadata?.improvement_minutes || 0),
      alternatives_json: JSON.stringify(message.metadata?.alternatives || []),
    });

    response.status(200).json(explanation);
  } catch (error) {
    logger.error({
      message: 'explainer_pubsub_failed',
      error: error instanceof Error ? error.message : 'unknown_error',
    });
    response.status(500).json({ error: 'Failed to process explanation event.' });
  }
});

app.get('/health', (_request: Request, response: Response) => {
  response.json({
    status: 'ok',
    service: 'ai-explainer',
    timestamp: new Date().toISOString(),
  });
});

app.listen(port, () => {
  logger.info({
    message: 'ai_explainer_started',
    port,
  });
});
