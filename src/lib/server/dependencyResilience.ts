import { GoogleGenAI } from '@google/genai';

export type DependencyName = 'osrm' | 'ai' | 'weather';
export type CircuitState = 'closed' | 'open' | 'half-open';
export type ChaosMode = 'healthy' | 'drop' | 'delay' | 'flaky';

type CachedValue = unknown;

export interface DependencyHealthSnapshot {
  name: DependencyName;
  state: CircuitState;
  failureCount: number;
  lastSuccessAt: string | null;
  lastFailureAt: string | null;
  openUntil: string | null;
  cachedResponseAvailable: boolean;
  fallbackHits: number;
  successCount: number;
  failureTotal: number;
  chaosMode: ChaosMode;
  chaosDelayMs: number;
  chaosFailureRate: number;
}

export interface CircuitTransition {
  dependency: DependencyName;
  from: CircuitState;
  to: CircuitState;
  reason: string;
  at: string;
}

interface CircuitOptions {
  name: DependencyName;
  failureThreshold: number;
  cooldownMs: number;
}

interface ChaosConfig {
  mode: ChaosMode;
  delayMs: number;
  failureRate: number;
}

interface CircuitRecord {
  state: CircuitState;
  failureCount: number;
  lastSuccessAt: Date | null;
  lastFailureAt: Date | null;
  openUntil: Date | null;
  cachedResponse: CachedValue | null;
  fallbackHits: number;
  successCount: number;
  failureTotal: number;
  chaos: ChaosConfig;
}

const FAILURE_THRESHOLD = 3;
const COOLDOWN_MS = 30_000;

const circuitRecords = new Map<DependencyName, CircuitRecord>();
const transitionLog: CircuitTransition[] = [];

const ensureRecord = (name: DependencyName): CircuitRecord => {
  const existing = circuitRecords.get(name);
  if (existing) {
    return existing;
  }

  const created: CircuitRecord = {
    state: 'closed',
    failureCount: 0,
    lastSuccessAt: null,
    lastFailureAt: null,
    openUntil: null,
    cachedResponse: null,
    fallbackHits: 0,
    successCount: 0,
    failureTotal: 0,
    chaos: {
      mode: 'healthy',
      delayMs: 0,
      failureRate: 0.5,
    },
  };
  circuitRecords.set(name, created);
  return created;
};

const transitionState = (
  name: DependencyName,
  record: CircuitRecord,
  nextState: CircuitState,
  reason: string,
) => {
  if (record.state === nextState) {
    return;
  }

  transitionLog.push({
    dependency: name,
    from: record.state,
    to: nextState,
    reason,
    at: new Date().toISOString(),
  });
  record.state = nextState;
};

const formatDate = (value: Date | null) => (value ? value.toISOString() : null);

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const applyChaos = async (name: DependencyName, record: CircuitRecord) => {
  const { mode, delayMs, failureRate } = record.chaos;

  if (mode === 'healthy') {
    return;
  }

  if (mode === 'delay') {
    await sleep(delayMs);
    return;
  }

  if (mode === 'drop') {
    throw new Error(`Chaos drop injected for ${name}`);
  }

  if (mode === 'flaky') {
    if (delayMs > 0) {
      await sleep(delayMs);
    }
    if (Math.random() < failureRate) {
      throw new Error(`Chaos flaky failure injected for ${name}`);
    }
  }
};

export class DependencyCircuitBreaker<T = unknown> {
  private readonly name: DependencyName;
  private readonly failureThreshold: number;
  private readonly cooldownMs: number;

  constructor(options: CircuitOptions) {
    this.name = options.name;
    this.failureThreshold = options.failureThreshold;
    this.cooldownMs = options.cooldownMs;
    ensureRecord(this.name);
  }

  async run(
    operation: () => Promise<T>,
    fallback?: () => T | null,
  ): Promise<{ value: T; fallbackUsed: boolean }> {
    const record = ensureRecord(this.name);
    const now = new Date();

    if (record.state === 'open') {
      if (record.openUntil && record.openUntil.getTime() > now.getTime()) {
        const fallbackValue = fallback?.() ?? (record.cachedResponse as T | null);
        if (fallbackValue !== null) {
          record.fallbackHits += 1;
          return { value: fallbackValue, fallbackUsed: true };
        }
        throw new Error(`${this.name} circuit is open`);
      }

      transitionState(this.name, record, 'half-open', 'cooldown_elapsed');
    }

    try {
      await applyChaos(this.name, record);
      const value = await operation();
      record.cachedResponse = value;
      record.failureCount = 0;
      record.successCount += 1;
      record.lastSuccessAt = new Date();
      record.openUntil = null;
      transitionState(this.name, record, 'closed', 'request_succeeded');
      return { value, fallbackUsed: false };
    } catch (error) {
      record.failureCount += 1;
      record.failureTotal += 1;
      record.lastFailureAt = new Date();

      if (record.state === 'half-open' || record.failureCount >= this.failureThreshold) {
        record.openUntil = new Date(Date.now() + this.cooldownMs);
        transitionState(this.name, record, 'open', 'failure_threshold_reached');
      }

      const fallbackValue = fallback?.() ?? (record.cachedResponse as T | null);
      if (fallbackValue !== null) {
        record.fallbackHits += 1;
        return { value: fallbackValue, fallbackUsed: true };
      }

      throw error;
    }
  }
}

export const dependencyBreakers = {
  osrm: new DependencyCircuitBreaker<unknown>({
    name: 'osrm',
    failureThreshold: FAILURE_THRESHOLD,
    cooldownMs: COOLDOWN_MS,
  }),
  ai: new DependencyCircuitBreaker<unknown>({
    name: 'ai',
    failureThreshold: FAILURE_THRESHOLD,
    cooldownMs: COOLDOWN_MS,
  }),
  weather: new DependencyCircuitBreaker<unknown>({
    name: 'weather',
    failureThreshold: FAILURE_THRESHOLD,
    cooldownMs: COOLDOWN_MS,
  }),
};

export const dependencyHealth = () =>
  (['osrm', 'ai', 'weather'] as DependencyName[]).map((name) => {
    const record = ensureRecord(name);
    return {
      name,
      state: record.state,
      failureCount: record.failureCount,
      lastSuccessAt: formatDate(record.lastSuccessAt),
      lastFailureAt: formatDate(record.lastFailureAt),
      openUntil: formatDate(record.openUntil),
      cachedResponseAvailable: record.cachedResponse !== null,
      fallbackHits: record.fallbackHits,
      successCount: record.successCount,
      failureTotal: record.failureTotal,
      chaosMode: record.chaos.mode,
      chaosDelayMs: record.chaos.delayMs,
      chaosFailureRate: record.chaos.failureRate,
    } satisfies DependencyHealthSnapshot;
  });

export const dependencyTransitions = () => [...transitionLog];

export const setDependencyChaos = (
  name: DependencyName,
  config: Partial<ChaosConfig>,
) => {
  const record = ensureRecord(name);
  record.chaos = {
    mode: config.mode ?? record.chaos.mode,
    delayMs: config.delayMs ?? record.chaos.delayMs,
    failureRate: config.failureRate ?? record.chaos.failureRate,
  };
};

export const resetDependencyChaos = () => {
  for (const name of ['osrm', 'ai', 'weather'] as DependencyName[]) {
    const record = ensureRecord(name);
    record.chaos = {
      mode: 'healthy',
      delayMs: 0,
      failureRate: 0.5,
    };
  }
};

export const cachedDependencyValue = <T,>(name: DependencyName) =>
  ensureRecord(name).cachedResponse as T | null;

type OsrmRouteResponse = {
  code: string;
  routes: Array<{
    geometry: {
      coordinates: number[][];
      type: string;
    };
    distance: number;
    duration: number;
  }>;
};

export async function fetchOsrmRouteWithBreaker(input: {
  coordinates: Array<{ lat: number; lng: number }>;
}) {
  const { value, fallbackUsed } = await dependencyBreakers.osrm.run(
    async () => {
      const points = input.coordinates.map((point) => `${point.lng},${point.lat}`).join(';');
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${points}?overview=full&geometries=geojson&steps=false&continue_straight=false`,
      );
      if (!response.ok) {
        throw new Error(`OSRM responded with ${response.status}`);
      }
      return (await response.json()) as OsrmRouteResponse;
    },
    () => cachedDependencyValue<OsrmRouteResponse>('osrm'),
  );

  return { response: value as OsrmRouteResponse, fallbackUsed };
}

type WeatherResponse = {
  city: string;
  source: 'live' | 'fallback';
  fetchedAt: string;
  condition: string;
  temperatureC: number;
  windSpeedKph: number;
  humidityPercent: number;
};

export async function fetchWeatherWithBreaker(city: string) {
  const apiKey = process.env.OPENWEATHER_API_KEY;

  const { value, fallbackUsed } = await dependencyBreakers.weather.run(
    async () => {
      if (!apiKey) {
        throw new Error('OPENWEATHER_API_KEY is not configured');
      }

      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`,
      );
      if (!response.ok) {
        throw new Error(`Weather API responded with ${response.status}`);
      }

      const payload = await response.json();
      return {
        city,
        source: 'live',
        fetchedAt: new Date().toISOString(),
        condition: payload.weather?.[0]?.main ?? 'Unknown',
        temperatureC: Number(payload.main?.temp ?? 0),
        windSpeedKph: Number(payload.wind?.speed ?? 0) * 3.6,
        humidityPercent: Number(payload.main?.humidity ?? 0),
      } satisfies WeatherResponse;
    },
    () => cachedDependencyValue<WeatherResponse>('weather'),
  );

  const weather = value as WeatherResponse;
  return {
    response: fallbackUsed ? { ...weather, source: 'fallback' as const } : weather,
    fallbackUsed,
  };
}

type AiBriefingResponse = {
  source: 'live' | 'fallback';
  fetchedAt: string;
  summary: string;
  priority: string;
  recommendedAction: string;
};

export async function fetchAiBriefingWithBreaker(input: {
  locality: string;
  disasterMode: string;
  riskScore: number;
}) {
  const apiKey = process.env.GEMINI_API_KEY;

  const { value, fallbackUsed } = await dependencyBreakers.ai.run(
    async () => {
      if (!apiKey) {
        throw new Error('GEMINI_API_KEY is not configured');
      }

      const client = new GoogleGenAI({ apiKey });
      const prompt = [
        'You are a disaster logistics summarizer.',
        'Respond in JSON only with keys summary, priority, recommendedAction.',
        `Locality: ${input.locality}`,
        `Disaster mode: ${input.disasterMode}`,
        `Risk score: ${input.riskScore}`,
      ].join('\n');

      const result = await client.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: prompt,
      });

      const text = result.text?.trim() ?? '';
      const parsed = JSON.parse(text);
      return {
        source: 'live',
        fetchedAt: new Date().toISOString(),
        summary: String(parsed.summary ?? ''),
        priority: String(parsed.priority ?? ''),
        recommendedAction: String(parsed.recommendedAction ?? ''),
      } satisfies AiBriefingResponse;
    },
    () => cachedDependencyValue<AiBriefingResponse>('ai'),
  );

  const briefing = value as AiBriefingResponse;
  return {
    response: fallbackUsed ? { ...briefing, source: 'fallback' as const } : briefing,
    fallbackUsed,
  };
}
