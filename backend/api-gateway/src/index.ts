import 'dotenv/config';
import axios, { type AxiosRequestConfig } from 'axios';
import cors from 'cors';
import express, { type Request, type Response } from 'express';
import rateLimit from 'express-rate-limit';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { v4 as uuidv4 } from 'uuid';
import winston from 'winston';
import { verifyFirebaseToken, type AuthenticatedRequest } from './middleware/auth';
import { createServiceCircuitBreaker } from './middleware/circuit-breaker';

interface DownstreamService {
  key: string;
  baseUrl: string;
  healthPath?: string;
}

const port = Number(process.env.PORT || 3000);
const app = express();

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  transports: [new winston.transports.Console()],
});

const services: Record<string, DownstreamService> = {
  ingestion: { key: 'ingestion', baseUrl: process.env.INGESTION_SERVICE_URL || 'http://localhost:3001', healthPath: '/health' },
  risk: { key: 'risk', baseUrl: process.env.RISK_ENGINE_URL || 'http://localhost:3002', healthPath: '/health' },
  route: { key: 'route', baseUrl: process.env.ROUTE_OPTIMIZER_URL || 'http://localhost:3003', healthPath: '/health' },
  drone: { key: 'drone', baseUrl: process.env.DRONE_ENGINE_URL || 'http://localhost:3004', healthPath: '/health' },
  rescue: { key: 'rescue', baseUrl: process.env.RESCUE_ENGINE_URL || 'http://localhost:3005', healthPath: '/health' },
  inventory: { key: 'inventory', baseUrl: process.env.INVENTORY_ENGINE_URL || 'http://localhost:3006', healthPath: '/health' },
  anomaly: { key: 'anomaly', baseUrl: process.env.ANOMALY_ENGINE_URL || 'http://localhost:3007', healthPath: '/health' },
  explainer: { key: 'explainer', baseUrl: process.env.AI_EXPLAINER_URL || 'http://localhost:3008', healthPath: '/health' },
  simulation: { key: 'simulation', baseUrl: process.env.SIMULATION_ENGINE_URL || 'http://localhost:3009', healthPath: '/health' },
};

const breakerRegistry = new Map(
  Object.values(services).map((service) => [
    service.key,
    createServiceCircuitBreaker<AxiosRequestConfig, unknown>(async (config) => {
      const response = await axios({
        validateStatus: () => true,
        timeout: 15_000,
        ...config,
      });

      if (response.status >= 500) {
        throw new Error(`Downstream ${service.key} failed with ${response.status}`);
      }

      return response.data;
    }),
  ]),
);

app.disable('x-powered-by');
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: [
    process.env.FLUTTER_WEB_ORIGIN || 'http://localhost:5173',
    'http://localhost:3000',
  ],
  credentials: true,
}));

app.use((request: Request, _response: Response, next) => {
  request.headers['x-request-id'] = request.header('x-request-id') || uuidv4();
  next();
});

app.use((request: Request, _response: Response, next) => {
  logger.info({
    message: 'incoming_request',
    method: request.method,
    path: request.path,
    requestId: request.headers['x-request-id'],
    ip: request.ip,
  });
  next();
});

const standardLimiter = rateLimit({
  windowMs: 60_000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

const simulationLimiter = rateLimit({
  windowMs: 60_000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/v1', verifyFirebaseToken, standardLimiter);
app.use('/api/v1/simulate', simulationLimiter);

/**
 * Performs a safe downstream call through the configured circuit breaker.
 */
async function callService(
  serviceKey: string,
  config: AxiosRequestConfig,
): Promise<{ data: unknown; source: 'live' | 'cache' }> {
  const breakerEntry = breakerRegistry.get(serviceKey);
  if (!breakerEntry) {
    throw new Error(`No circuit breaker registered for ${serviceKey}`);
  }

  try {
    const data = await breakerEntry.breaker.fire(config);
    return { data, source: 'live' };
  } catch (error) {
    if (breakerEntry.lastKnownGood != null) {
      logger.warn({
        message: 'circuit_breaker_fallback',
        serviceKey,
        error: error instanceof Error ? error.message : 'unknown_error',
      });
      return { data: breakerEntry.lastKnownGood, source: 'cache' };
    }

    throw error;
  }
}

function proxiedRoute(path: string, serviceKey: keyof typeof services, targetPath: string): void {
  const service = services[serviceKey];
  app.use(
    path,
    createProxyMiddleware({
      target: service.baseUrl,
      changeOrigin: true,
      pathRewrite: { [`^${path}`]: targetPath },
      proxyTimeout: 15_000,
      on: {
        proxyReq(proxyReq, req) {
          proxyReq.setHeader('x-request-id', req.headers['x-request-id'] || uuidv4());
          const authRequest = req as AuthenticatedRequest;
          if (authRequest.user) {
            proxyReq.setHeader('x-user-id', authRequest.user.uid);
            proxyReq.setHeader('x-user-role', authRequest.user.role);
          }
        },
      },
    }),
  );
}

proxiedRoute('/api/v1/ingest', 'ingestion', '/ingest');
proxiedRoute('/api/v1/predict-risk', 'risk', '/score');
proxiedRoute('/api/v1/optimize-route', 'route', '/optimize');
proxiedRoute('/api/v1/dispatch-drone', 'drone', '/dispatch');
proxiedRoute('/api/v1/alert-rescue', 'rescue', '/alert');
proxiedRoute('/api/v1/inventory/alert', 'inventory', '/inventory/alert');
proxiedRoute('/api/v1/simulate', 'simulation', '/simulate');
proxiedRoute('/api/v1/explain', 'explainer', '/explain');
proxiedRoute('/api/v1/life-jackets/status', 'inventory', '/life-jackets/status');
proxiedRoute('/api/v1/inventory', 'inventory', '/inventory');

async function buildHealthPayload(): Promise<{
  status: 'ok' | 'degraded';
  timestamp: string;
  services: Array<Record<string, unknown>>;
}> {
  const checks = await Promise.all(
    Object.values(services).map(async (service) => {
      try {
        const health = await axios.get(`${service.baseUrl}${service.healthPath || '/health'}`, {
          timeout: 3000,
          validateStatus: () => true,
        });
        return {
          service: service.key,
          url: service.baseUrl,
          healthy: health.status < 500,
          statusCode: health.status,
          payload: health.data,
        };
      } catch (error) {
        return {
          service: service.key,
          url: service.baseUrl,
          healthy: false,
          statusCode: 0,
          error: error instanceof Error ? error.message : 'unknown_error',
        };
      }
    }),
  );

  return {
    status: checks.every((check) => check.healthy) ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    services: checks,
  };
}

app.get('/health', async (_request: Request, response: Response) => {
  response.json(await buildHealthPayload());
});

app.get('/api/v1/health', async (request: Request, response: Response) => {
  response.json(await buildHealthPayload());
});

app.get('/api/v1/dashboard/metrics', async (_request: Request, response: Response) => {
  try {
    const [fleet, inventoryStatus, alerts, risks] = await Promise.all([
      callService('drone', { method: 'GET', url: `${services.drone.baseUrl}/fleet/status` }),
      callService('inventory', { method: 'GET', url: `${services.inventory.baseUrl}/life-jackets/status` }),
      callService('explainer', { method: 'GET', url: `${services.explainer.baseUrl}/health` }),
      callService('risk', { method: 'GET', url: `${services.risk.baseUrl}/health` }),
    ]);

    response.json({
      generated_at: new Date().toISOString(),
      sources: {
        fleet: fleet.source,
        inventory: inventoryStatus.source,
        explainer: alerts.source,
        risk: risks.source,
      },
      metrics: {
        fleet: fleet.data,
        inventory: inventoryStatus.data,
        explainer: alerts.data,
        risk: risks.data,
      },
    });
  } catch (error) {
    logger.error({
      message: 'dashboard_metrics_failed',
      error: error instanceof Error ? error.message : 'unknown_error',
    });
    response.status(503).json({ error: 'Dashboard metrics are unavailable.' });
  }
});

app.listen(port, () => {
  logger.info({
    message: 'api_gateway_started',
    port,
    services,
  });
});
