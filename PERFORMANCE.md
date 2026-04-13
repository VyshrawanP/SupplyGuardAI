# Performance And Resilience Notes

This document describes the circuit-breaker behavior added to the root runtime path of SupplyGuard AI.

## Overview

Three external dependencies are protected with circuit breakers:

- OSRM public routing API
- Gemini AI API
- OpenWeather API

The implementation lives in:

- [dependencyResilience.ts](/home/asus/Documents/SupplyGuardAI/src/lib/server/dependencyResilience.ts)
- [server.ts](/home/asus/Documents/SupplyGuardAI/server.ts)

## Circuit Breaker Design

Each dependency uses the same breaker policy:

- trip after `3` failures
- cooldown for `30` seconds
- after cooldown, move to `half-open`
- if the next request succeeds, close the circuit
- if the next request fails, reopen the circuit

Tracked state per dependency:

- `state`
- `failureCount`
- `lastSuccessAt`
- `lastFailureAt`
- `openUntil`
- `cachedResponseAvailable`
- `fallbackHits`
- `successCount`
- `failureTotal`
- chaos settings used for testing

## Fallback Behavior

### OSRM

Primary behavior:

- request live route geometry from the OSRM public routing API

Fallback:

- last successful OSRM response kept in memory

Use case:

- route optimization remains available even when OSRM temporarily fails after at least one successful call

### AI

Primary behavior:

- request a disaster briefing from Gemini

Fallback:

- last successful AI response

Use case:

- operators still receive a response during brief AI outages, but it may be stale

### Weather

Primary behavior:

- request current weather for a city from OpenWeather

Fallback:

- last successful weather response

Use case:

- weather panels can continue showing the last known result during short outages

## Health Endpoint

The server exposes:

```text
GET /health/dependencies
```

Example response shape:

```json
{
  "checkedAt": "2026-04-12T10:00:00.000Z",
  "dependencies": [
    {
      "name": "osrm",
      "state": "closed",
      "failureCount": 0,
      "lastSuccessAt": "2026-04-12T09:59:52.000Z",
      "lastFailureAt": null,
      "openUntil": null,
      "cachedResponseAvailable": true,
      "fallbackHits": 2,
      "successCount": 14,
      "failureTotal": 3,
      "chaosMode": "healthy",
      "chaosDelayMs": 0,
      "chaosFailureRate": 0.5
    }
  ],
  "transitions": [
    {
      "dependency": "osrm",
      "from": "closed",
      "to": "open",
      "reason": "failure_threshold_reached",
      "at": "2026-04-12T09:58:30.000Z"
    }
  ]
}
```

## Server Endpoints Using Breakers

These root-server endpoints use the resilience layer:

- `POST /api/optimize-route`
- `GET /api/weather/current`
- `POST /api/ai/briefing`

These are defined in [server.ts](/home/asus/Documents/SupplyGuardAI/server.ts).

## Chaos Controls

Internal endpoints exist to inject failure or latency:

- `POST /internal/chaos/dependencies/:name`
- `POST /internal/chaos/reset`

Supported dependency names:

- `osrm`
- `ai`
- `weather`

Supported modes:

- `healthy`
- `drop`
- `delay`
- `flaky`

## Chaos Test

Chaos test script:

- [chaos-test.ts](/home/asus/Documents/SupplyGuardAI/scripts/chaos-test.ts)

Default behavior:

- runs for `30` minutes
- randomly changes dependency behavior
- hits OSRM, AI, and Weather-backed endpoints
- reads `/health/dependencies`
- logs circuit transitions
- prints a final summary

### Run It

Start the app first:

```bash
npm run dev
```

In another terminal:

```bash
npx tsx scripts/chaos-test.ts
```

Optional shorter run:

```bash
CHAOS_DURATION_MINUTES=2 npx tsx scripts/chaos-test.ts
```

Optional different target:

```bash
CHAOS_BASE_URL=http://localhost:3000 npx tsx scripts/chaos-test.ts
```

## Notes On Real-World Behavior

### OSRM

Because the current setup uses the public OSRM demo service, availability is not guaranteed.
This is acceptable for demo testing, but for production you should replace it with a dedicated routing service.

### AI and Weather

If `GEMINI_API_KEY` or `OPENWEATHER_API_KEY` are not configured, those dependencies will fail live calls and the circuit will eventually open.
Fallback only works after at least one successful response has been cached.

## Current Intent

This resilience layer gives the root SupplyGuard runtime:

- dependency visibility
- controlled degradation
- health introspection
- chaos testing support

It does not remove the need for proper production infrastructure, but it makes the current project much easier to test under unstable conditions.
