# SupplyGuard AI

SupplyGuard AI is a disaster logistics platform for route disruption detection, drone dispatch, rescue coordination, inventory resilience, simulation, explainable decision support, and offline field operation. The repository is organized as a monorepo with independent backend services, a Flutter frontend, Firestore configuration, and deployment tooling for both Google Cloud and laptop-based offline command centers.

## Google Solution Challenge (Judge-first links)

- `SOLUTION_CHALLENGE.md` (SDGs, impact metrics, and demo checklist)
- `docs/JUDGE_QUICKSTART.md` (5-minute run path)
- `docs/ARCHITECTURE.md` (system diagram)
- `docs/RESPONSIBLE_AI.md` (AI boundary + mitigations)
- `docs/PRIVACY_SECURITY.md` (security posture notes)
- `docs/VIDEO_SCRIPT.md` (3-minute script)
- `docs/DEMO_CHECKLIST.md` (run-of-show)

## System Overview

SupplyGuard AI ingests weather, traffic, and sensor signals, normalizes them into disaster events, scores operational risk deterministically, and then triggers downstream actions such as rerouting shipments, dispatching drones, notifying rescue teams, raising inventory alerts, and generating human-readable explanations. A simulation engine models scenario impacts in cloned state, and an offline server provides a field-deployable fallback using SQLite and WebSockets.

Primary backend services:

- `backend/api-gateway`
- `backend/ingestion-service`
- `backend/risk-engine`
- `backend/route-optimizer`
- `backend/drone-engine`
- `backend/rescue-engine`
- `backend/inventory-engine`
- `backend/anomaly-engine`
- `backend/ai-explainer`
- `backend/simulation-engine`
- `backend/offline-server`

Frontend:

- `frontend/`: Flutter application for command map, alerts, inventory, simulation, metrics, and survivor self-reporting.

Data and operations:

- `firestore/`: Firestore rules, indexes, and seed data.
- `docker/`: Offline Docker Compose deployment.
- `scripts/`: Pub/Sub, cloud deploy, offline setup, and Firestore seed scripts.

## Repository Structure

```text
SupplyGuardAI/
├── frontend/
├── backend/
│   ├── api-gateway/
│   ├── ingestion-service/
│   ├── risk-engine/
│   ├── route-optimizer/
│   ├── drone-engine/
│   ├── rescue-engine/
│   ├── inventory-engine/
│   ├── anomaly-engine/
│   ├── ai-explainer/
│   ├── simulation-engine/
│   └── offline-server/
├── firestore/
├── docker/
├── scripts/
└── README.md
```

## Prerequisites

- Node.js 18+
- npm 10+
- Flutter 3.24+ for frontend builds
- Firebase CLI
- Google Cloud SDK with `gcloud`
- Docker Engine + Docker Compose plugin
- SQLite 3
- A Google Cloud project with:
  - Cloud Run
  - Pub/Sub
  - Cloud Scheduler
  - Firestore
  - Firebase Auth
  - Firebase Hosting

## Environment Variables

Copy `.env.example` to `.env` and fill in the required values.

Core groups:

- Google Cloud: `GOOGLE_CLOUD_PROJECT_ID`, `GOOGLE_APPLICATION_CREDENTIALS`
- Firebase: `FIREBASE_API_KEY`, `FIREBASE_PROJECT_ID`, `FIREBASE_APP_ID`
- Maps and weather: `GOOGLE_MAPS_API_KEY`, `GOOGLE_MAPS_DIRECTIONS_API_KEY`, `GOOGLE_MAPS_ELEVATION_API_KEY`, `OPENWEATHER_API_KEY`
- AI and messaging: `GEMINI_API_KEY`, `TWILIO_*`, `SENDGRID_*`
- Pub/Sub: `PUBSUB_*`
- Service URLs: `*_SERVICE_URL`, `API_GATEWAY_URL`
- Offline: `OFFLINE_MODE`, `LOCAL_SERVER_IP`, `LOCAL_OSRM_URL`, `LOCAL_TILESERVER_URL`

## Local Development

1. Create `.env`:

```bash
cp .env.example .env
```

2. Install dependencies:

```bash
npm install
```

3. Start the local command console (offline-friendly demo):

```bash
npm run dev
```

Open `http://localhost:3000`.

4. Optional: measurable benchmark output (repeatable):

```bash
npm run evaluate
```

## Multi-service local development (advanced)

Install dependencies for the backend services you want to run:

```bash
cd backend/api-gateway && npm install
cd ../ingestion-service && npm install
cd ../risk-engine && npm install
cd ../route-optimizer && npm install
cd ../drone-engine && npm install
cd ../rescue-engine && npm install
cd ../inventory-engine && npm install
cd ../anomaly-engine && npm install
cd ../ai-explainer && npm install
cd ../simulation-engine && npm install
cd ../offline-server && npm install
```

Seed Firestore (optional):

```bash
node scripts/seed-firestore.js
```

Start selected services:

```bash
cd backend/api-gateway && npm run dev
cd backend/ingestion-service && npm run dev
cd backend/risk-engine && npm run dev
```

Start the Flutter app:

```bash
cd frontend
flutter pub get
flutter run
```

## Cloud Deployment Guide

1. Authenticate Google Cloud and Firebase:

```bash
gcloud auth login
gcloud config set project supplyguard-ai
firebase login
firebase use supplyguard-ai
```

2. Create Pub/Sub topics and subscriptions:

```bash
bash scripts/setup-pubsub.sh
```

3. Deploy everything:

```bash
bash scripts/deploy-all.sh
```

4. Verify Cloud Run services:

```bash
gcloud run services list --region asia-south1
```

## Offline Deployment Guide

1. Prepare `.env` with `OFFLINE_MODE=true`.
2. Run the offline setup:

```bash
bash scripts/setup-offline.sh
```

3. Start or refresh the stack manually if needed:

```bash
docker compose -f docker/docker-compose.yml up -d --build
```

4. Connect field devices to the same hotspot and browse to the reported local IP.

## Docker Compose

Offline startup command:

```bash
docker compose -f docker/docker-compose.yml up -d --build
```

Services include:

- all backend engines
- `osrm-backend`
- `tileserver-gl`
- `offline-server`

## API Reference

### API Gateway

- `POST /api/v1/ingest`
- `POST /api/v1/predict-risk`
- `POST /api/v1/optimize-route`
- `POST /api/v1/dispatch-drone`
- `POST /api/v1/alert-rescue`
- `POST /api/v1/inventory/alert`
- `GET /api/v1/inventory/:id`
- `GET /api/v1/life-jackets/status`
- `POST /api/v1/simulate`
- `POST /api/v1/explain`
- `GET /api/v1/dashboard/metrics`
- `GET /api/v1/health`

Example request:

```http
POST /api/v1/dispatch-drone
Authorization: Bearer <firebase-id-token>
Content-Type: application/json

{
  "disaster_zone_center": {"lat": 19.88, "lng": 85.91},
  "survivor_cluster_center": {"lat": 19.87, "lng": 85.92},
  "requested_payload_manifest": [
    {"item_name": "life_jacket", "quantity": 5, "unit": "piece", "weight_kg_per_unit": 1.2}
  ]
}
```

Example response:

```json
{
  "dispatch_id": "abc123",
  "drone_id": "drn-001",
  "status": "ASSIGNED",
  "eta_minutes": 18
}
```

## Firestore Schema Reference

Top-level collections in active use:

- `users`
- `shipments`
- `warehouses`
- `drone-fleet`
- `drone-dispatches`
- `rescue-teams`
- `rescue-assignments`
- `survivor-reports`
- `survivor-clusters`
- `disaster-events`
- `route-risk-scores`
- `optimized-routes`
- `inventory-alerts`
- `purchase-orders`
- `inventory-transactions`
- `life-jacket-ledger`
- `system-alerts`
- `ai-explanations`
- `suppliers`

Simulation/session namespaces:

- `sim-{sessionId}-shipments`
- `sim-{sessionId}-warehouses`
- `sim-{sessionId}-drone-fleet`
- other mirrored collections created by the simulation engine

## Frontend Build Commands

Flutter web:

```bash
cd frontend
flutter build web --release
```

Flutter Android:

```bash
cd frontend
flutter build apk --release
```

## Cloud Run Deployment Commands

Individual service example:

```bash
gcloud run deploy api-gateway \
  --source=backend/api-gateway \
  --region=asia-south1 \
  --allow-unauthenticated
```

Equivalent services exist for:

- `ingestion-service`
- `risk-engine`
- `route-optimizer`
- `drone-engine`
- `rescue-engine`
- `inventory-engine`
- `anomaly-engine`
- `ai-explainer`
- `simulation-engine`
- `offline-server`

## Firestore Seed Command

```bash
node scripts/seed-firestore.js
```

## Troubleshooting

1. `npm install` fails in a backend service:
   Check network access and rerun inside the service folder.
2. Firestore permission errors:
   Deploy rules and verify the authenticated user role in `users/{uid}`.
3. Maps API calls fail:
   Confirm the relevant Google Maps APIs are enabled and keys are present in `.env`.
4. Gemini explanations fall back every time:
   Verify `GEMINI_API_KEY` is configured and outbound network access is available.
5. Drone dispatch fails with no candidates:
   Check drone battery, payload capacity, and range threshold in Firestore and `.env`.
6. Offline route optimization fails:
   Ensure `docker/osrm-data/india-latest.osrm` exists and `osrm-backend` is healthy.
7. Flutter app cannot start:
   Install Flutter, run `flutter pub get`, and confirm Firebase options are configured.
8. WebSocket offline notifications do not arrive:
   Verify devices register with the offline hotspot and the offline server is listening on port `3010`.
9. Firestore seed script fails:
   Confirm `GOOGLE_APPLICATION_CREDENTIALS` points to a valid service account and the project ID matches.
10. Docker Compose starts but services stay unhealthy:
    Inspect container logs with `docker compose -f docker/docker-compose.yml logs -f`.

## Contributing

1. Create a feature branch.
2. Keep service changes isolated to the relevant package/folder.
3. Run local checks where toolchains are available:
   Backend: `./node_modules/.bin/tsc --noEmit`
   Frontend: `flutter analyze`
4. Update docs and environment references when behavior changes.
5. Open a PR with rollout notes, affected services, and verification steps.

## License

Apache License 2.0

## Notes

- Several backend services in this repository have already been written and locally TypeScript-checked in their package folders.
- The Flutter toolchain was not available in this workspace during implementation, so frontend verification still requires a real `flutter pub get` and `flutter analyze` pass on a machine with Flutter installed.
