import { PubSub } from '@google-cloud/pubsub';
import winston from 'winston';
import type { DisasterEvent } from './normalizer';

const pubsub = new PubSub({
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
});

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  transports: [new winston.transports.Console()],
});

const topicName = process.env.PUBSUB_DISASTER_SIGNALS_TOPIC || 'disaster-signals';

async function delay(milliseconds: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, milliseconds));
}

/**
 * Publishes a normalized disaster event to Pub/Sub with bounded retries.
 */
export async function publishDisasterEvent(event: DisasterEvent): Promise<string> {
  let attempt = 0;
  let lastError: unknown;

  while (attempt < 3) {
    try {
      const messageId = await pubsub.topic(topicName).publishMessage({
        json: event,
        attributes: {
          event_type: event.type,
          severity: String(event.severity),
          source: event.source,
        },
      });

      logger.info({
        message: 'pubsub_publish_success',
        event_id: event.event_id,
        topic: topicName,
        messageId,
      });

      return messageId;
    } catch (error) {
      lastError = error;
      attempt += 1;
      if (attempt < 3) {
        await delay(250 * 2 ** attempt);
      }
    }
  }

  logger.error({
    message: 'pubsub_publish_failed',
    event_id: event.event_id,
    topic: topicName,
    error: lastError instanceof Error ? lastError.message : 'unknown_error',
  });
  throw lastError;
}
