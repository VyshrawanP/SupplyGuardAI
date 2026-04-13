const BASE_URL = process.env.CHAOS_BASE_URL ?? 'http://localhost:3000';
const DURATION_MINUTES = Number(process.env.CHAOS_DURATION_MINUTES ?? 30);
const ITERATION_DELAY_MS = Number(process.env.CHAOS_ITERATION_DELAY_MS ?? 5000);

type DependencyName = 'osrm' | 'ai' | 'weather';
type ChaosMode = 'healthy' | 'drop' | 'delay' | 'flaky';

type HealthItem = {
  name: DependencyName;
  state: string;
  failureCount: number;
  lastSuccessAt: string | null;
  lastFailureAt: string | null;
  openUntil: string | null;
  fallbackHits: number;
  successCount: number;
  failureTotal: number;
  chaosMode: ChaosMode;
  chaosDelayMs: number;
  chaosFailureRate: number;
};

const dependencyNames: DependencyName[] = ['osrm', 'ai', 'weather'];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const randomChoice = <T,>(items: T[]) => items[Math.floor(Math.random() * items.length)];

async function post(path: string, body: unknown) {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return response;
}

async function getHealth() {
  const response = await fetch(`${BASE_URL}/health/dependencies`);
  if (!response.ok) {
    throw new Error(`Health endpoint failed with ${response.status}`);
  }
  return (await response.json()) as {
    checkedAt: string;
    dependencies: HealthItem[];
    transitions: Array<{
      dependency: DependencyName;
      from: string;
      to: string;
      reason: string;
      at: string;
    }>;
  };
}

async function hitDependency(name: DependencyName) {
  if (name === 'osrm') {
    return fetch(`${BASE_URL}/api/optimize-route`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        origin: { lat: 12.9784, lng: 77.6408 },
        destination: { lat: 12.9352, lng: 77.6245 },
        waypoints: [{ lat: 12.9756, lng: 77.6066 }],
      }),
    });
  }

  if (name === 'ai') {
    return fetch(`${BASE_URL}/api/ai/briefing`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        locality: 'Indiranagar',
        disasterMode: 'compound',
        riskScore: 76,
      }),
    });
  }

  return fetch(`${BASE_URL}/api/weather/current?city=Bengaluru`);
}

function randomChaosConfig() {
  const mode = randomChoice<ChaosMode>(['healthy', 'healthy', 'delay', 'flaky', 'drop']);
  if (mode === 'healthy') {
    return { mode, delayMs: 0, failureRate: 0 };
  }
  if (mode === 'delay') {
    return { mode, delayMs: randomChoice([500, 1500, 3000, 5000]), failureRate: 0 };
  }
  if (mode === 'drop') {
    return { mode, delayMs: 0, failureRate: 1 };
  }
  return { mode, delayMs: randomChoice([0, 500, 1500]), failureRate: randomChoice([0.3, 0.5, 0.8]) };
}

async function main() {
  const startedAt = Date.now();
  const endsAt = startedAt + DURATION_MINUTES * 60_000;

  const lastState = new Map<DependencyName, string>();
  const summary = {
    requests: { osrm: 0, ai: 0, weather: 0 },
    failures: { osrm: 0, ai: 0, weather: 0 },
    fallbackHits: { osrm: 0, ai: 0, weather: 0 },
    trips: { osrm: 0, ai: 0, weather: 0 },
    recoveries: { osrm: 0, ai: 0, weather: 0 },
  };

  await post('/internal/chaos/reset', {});
  console.log(`[chaos] started at ${new Date(startedAt).toISOString()} for ${DURATION_MINUTES} minutes`);

  while (Date.now() < endsAt) {
    for (const dependency of dependencyNames) {
      const chaos = randomChaosConfig();
      await post(`/internal/chaos/dependencies/${dependency}`, chaos);
      console.log(
        `[chaos] ${dependency} => mode=${chaos.mode} delay=${chaos.delayMs} failureRate=${chaos.failureRate}`,
      );
    }

    for (const dependency of dependencyNames) {
      summary.requests[dependency] += 1;
      try {
        const response = await hitDependency(dependency);
        if (!response.ok) {
          summary.failures[dependency] += 1;
          console.log(`[call] ${dependency} failed with status ${response.status}`);
        } else {
          const body = await response.json();
          if (body?.fallbackUsed) {
            summary.fallbackHits[dependency] += 1;
            console.log(`[call] ${dependency} served via fallback`);
          } else {
            console.log(`[call] ${dependency} served live`);
          }
        }
      } catch (error) {
        summary.failures[dependency] += 1;
        console.log(`[call] ${dependency} threw ${error instanceof Error ? error.message : 'unknown error'}`);
      }
    }

    const health = await getHealth();
    for (const dependency of health.dependencies) {
      const previous = lastState.get(dependency.name);
      if (previous && previous !== dependency.state) {
        console.log(
          `[transition] ${dependency.name}: ${previous} -> ${dependency.state} at ${health.checkedAt}`,
        );
        if (dependency.state === 'open') {
          summary.trips[dependency.name] += 1;
        }
        if (previous === 'open' && dependency.state === 'closed') {
          summary.recoveries[dependency.name] += 1;
        }
      }
      lastState.set(dependency.name, dependency.state);
    }

    await sleep(ITERATION_DELAY_MS);
  }

  await post('/internal/chaos/reset', {});
  const finalHealth = await getHealth();

  console.log('\n=== Chaos Test Summary ===');
  console.log(`Duration minutes: ${DURATION_MINUTES}`);
  console.log(`Base URL: ${BASE_URL}`);
  for (const dependency of dependencyNames) {
    console.log(
      `${dependency}: requests=${summary.requests[dependency]}, failures=${summary.failures[dependency]}, fallbackHits=${summary.fallbackHits[dependency]}, trips=${summary.trips[dependency]}, recoveries=${summary.recoveries[dependency]}`,
    );
  }

  console.log('\n=== Final Circuit State ===');
  for (const dependency of finalHealth.dependencies) {
    console.log(
      `${dependency.name}: state=${dependency.state}, failureCount=${dependency.failureCount}, lastSuccessAt=${dependency.lastSuccessAt}, lastFailureAt=${dependency.lastFailureAt}`,
    );
  }
}

void main().catch((error) => {
  console.error('[chaos] test failed', error);
  process.exitCode = 1;
});
