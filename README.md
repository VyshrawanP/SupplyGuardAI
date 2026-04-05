# SupplyGuard AI

SupplyGuard AI is a disaster logistics platform for routing, drone dispatch, rescue coordination, inventory resilience, anomaly monitoring, explainability, and offline field operations. This repository is being restructured into a monorepo with independent backend services, a Flutter client, Firestore configuration, and operational scripts.

## Architecture

- `frontend/`: Flutter application for coordinators, operators, and public survivor reporting.
- `backend/api-gateway`: Firebase-authenticated gateway with rate limits, request tracing, proxy routing, and downstream health aggregation.
- `backend/ingestion-service`: External signal intake, normalization, Firestore persistence, and Pub/Sub publication.
- `backend/risk-engine`: Deterministic route risk scoring and downstream decision publication.
- `firestore/`: Security rules, composite indexes, and seed data for the Odisha cyclone scenario.
- `scripts/`: Operational helpers for Pub/Sub setup and Firestore seeding.

## Current Status

Implemented in this pass:

- Root environment contract in [.env.example](/home/asus/Documents/SupplyGuardAI/.env.example)
- Firestore access rules in [firestore.rules](/home/asus/Documents/SupplyGuardAI/firestore/firestore.rules)
- Firestore indexes in [firestore.indexes.json](/home/asus/Documents/SupplyGuardAI/firestore/firestore.indexes.json)
- Odisha cyclone seed dataset in [seed.js](/home/asus/Documents/SupplyGuardAI/firestore/seed-data/seed.js)
- API gateway in [index.ts](/home/asus/Documents/SupplyGuardAI/backend/api-gateway/src/index.ts)
- Ingestion service in [index.ts](/home/asus/Documents/SupplyGuardAI/backend/ingestion-service/src/index.ts)
- Risk engine in [index.ts](/home/asus/Documents/SupplyGuardAI/backend/risk-engine/src/index.ts)

Still to be completed:

- Route optimizer, drone engine, rescue engine, inventory engine, anomaly engine, AI explainer, simulation engine, and offline server
- Flutter app models, services, providers, and feature screens
- Offline `docker-compose.yml`, deployment scripts, and expanded operator runbooks

## Prerequisites

- Node.js 18+
- npm 10+
- Firebase project with Firestore and Authentication enabled
- Google Cloud project with Pub/Sub enabled
- Service account credentials exported through `GOOGLE_APPLICATION_CREDENTIALS`

## Local Development

1. Copy `.env.example` to `.env` and fill in Firebase, Google Maps, OpenWeatherMap, Gemini, and Twilio credentials.
2. Install service dependencies inside each backend service you want to run, for example:

```bash
cd backend/api-gateway && npm install
cd ../ingestion-service && npm install
cd ../risk-engine && npm install
```

3. Seed Firestore:

```bash
node scripts/seed-firestore.js
```

4. Start the services:

```bash
cd backend/api-gateway && npm run dev
cd backend/ingestion-service && npm run dev
cd backend/risk-engine && npm run dev
```

## Pub/Sub Setup

Create required topics and push subscriptions with:

```bash
bash scripts/setup-pubsub.sh
```

## Firestore Data Model

- `users`
- `warehouses`
- `warehouses/{warehouseId}/inventory`
- `shipments`
- `drone-fleet`
- `rescue-teams`
- `disaster-events`
- `suppliers`
- `life-jacket-ledger`
- `ai-explanations`
- `route-risk-scores`

## Verification Notes

This workspace does not currently have `tsc` installed globally, and dependencies have not been installed for the newly added backend services yet. The code has been written to compile as standalone TypeScript service packages, but a compile/test pass still needs to be run after `npm install` in each service directory.

## License

Apache 2.0
