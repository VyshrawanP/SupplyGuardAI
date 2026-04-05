import 'dotenv/config';
import admin from 'firebase-admin';
import express, { type Request, type Response } from 'express';
import winston from 'winston';
import { calculateCaloricCoverage } from './caloric-calculator';
import { getLifeJacketStatus } from './jacket-ledger';
import { alertSupplier } from './supplier-alerter';
import { computeWarehouseMetrics } from './threshold-checker';
import { getFirestore } from './shared';

const app = express();
const port = Number(process.env.PORT || 3006);

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  transports: [new winston.transports.Console()],
});

app.use(express.json({ limit: '2mb' }));

app.get('/inventory/:warehouse_id', async (request: Request, response: Response) => {
  try {
    const warehouseId = Array.isArray(request.params.warehouse_id) ? request.params.warehouse_id[0] : request.params.warehouse_id;
    const [metrics, caloric] = await Promise.all([
      computeWarehouseMetrics(warehouseId),
      calculateCaloricCoverage(warehouseId),
    ]);

    response.json({
      warehouse_id: warehouseId,
      metrics,
      caloric,
    });
  } catch (error) {
    logger.error({
      message: 'inventory_fetch_failed',
      error: error instanceof Error ? error.message : 'unknown_error',
    });
    response.status(500).json({ error: 'Failed to load inventory.' });
  }
});

app.post('/inventory/alert', async (request: Request, response: Response) => {
  try {
    const warehouseId = String(request.body.warehouse_id || '');
    const metrics = await computeWarehouseMetrics(warehouseId);
    const criticalItems = metrics.filter((metric) => metric.status === 'CRITICAL' || metric.status === 'DEPLETED');

    const purchaseOrders = await Promise.all(criticalItems.map((item) => alertSupplier({
      warehouse_id: warehouseId,
      item_name: item.item_name,
      quantity: Math.max(item.minimum_threshold * 2, 10),
      unit: item.unit,
      severity: 'CRITICAL',
    })));

    const caloric = await calculateCaloricCoverage(warehouseId);
    if (caloric.days_of_survival_stock < 3) {
      const firstFoodItem = metrics.find((metric) => ['food_packet_adult', 'rice_kg', 'biscuit_pack'].includes(metric.item_name));
      if (firstFoodItem) {
        await alertSupplier({
          warehouse_id: warehouseId,
          item_name: firstFoodItem.item_name,
          quantity: Math.max(firstFoodItem.minimum_threshold * 2, 10),
          unit: firstFoodItem.unit,
          severity: 'CRITICAL',
        });
      }
    }

    response.json({
      warehouse_id: warehouseId,
      triggered_alerts: criticalItems.length,
      purchase_orders: purchaseOrders.filter(Boolean),
    });
  } catch (error) {
    logger.error({
      message: 'inventory_alert_failed',
      error: error instanceof Error ? error.message : 'unknown_error',
    });
    response.status(500).json({ error: 'Failed to trigger supplier alerts.' });
  }
});

app.get('/life-jackets/status', async (_request: Request, response: Response) => {
  response.json(await getLifeJacketStatus());
});

app.post('/pubsub', async (request: Request, response: Response) => {
  try {
    const envelope = request.body as { message?: { data?: string } };
    const payload = envelope.message?.data
      ? Buffer.from(envelope.message.data, 'base64').toString('utf8')
      : '{}';
    const message = JSON.parse(payload) as {
      warehouse_id?: string;
      item_name?: string;
      quantity?: number;
      event_type?: string;
    };

    if (message.warehouse_id && message.item_name) {
      await getFirestore().collection('inventory-transactions').add({
        warehouse_id: message.warehouse_id,
        item_name: message.item_name,
        quantity: Number(message.quantity || 0),
        transaction_type: 'dispatch',
        event_type: message.event_type || 'UNKNOWN',
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    response.status(204).send();
  } catch (error) {
    logger.error({
      message: 'inventory_pubsub_failed',
      error: error instanceof Error ? error.message : 'unknown_error',
    });
    response.status(500).json({ error: 'Failed to process inventory event.' });
  }
});

app.get('/health', (_request: Request, response: Response) => {
  response.json({
    status: 'ok',
    service: 'inventory-engine',
    timestamp: new Date().toISOString(),
  });
});

app.listen(port, () => {
  logger.info({
    message: 'inventory_engine_started',
    port,
  });
});
