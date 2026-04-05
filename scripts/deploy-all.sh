#!/usr/bin/env bash
set -euo pipefail

PROJECT_ID="${GOOGLE_CLOUD_PROJECT_ID:-supplyguard-ai}"
REGION="${GOOGLE_CLOUD_REGION:-asia-south1}"
SERVICE_ACCOUNT="${CLOUD_RUN_SERVICE_ACCOUNT:-default}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

required_cmds=(gcloud firebase npm)
for cmd in "${required_cmds[@]}"; do
  command -v "$cmd" >/dev/null 2>&1 || { echo "Missing required command: $cmd"; exit 1; }
done

SERVICES=(
  "api-gateway:3000:backend/api-gateway:1Gi:1:1"
  "ingestion-service:3001:backend/ingestion-service:1Gi:1:0"
  "risk-engine:3002:backend/risk-engine:1Gi:1:0"
  "route-optimizer:3003:backend/route-optimizer:1Gi:1:0"
  "drone-engine:3004:backend/drone-engine:1Gi:1:0"
  "rescue-engine:3005:backend/rescue-engine:1Gi:1:0"
  "inventory-engine:3006:backend/inventory-engine:1Gi:1:0"
  "anomaly-engine:3007:backend/anomaly-engine:1Gi:1:0"
  "ai-explainer:3008:backend/ai-explainer:1Gi:1:0"
  "simulation-engine:3009:backend/simulation-engine:1Gi:1:0"
  "offline-server:3010:backend/offline-server:2Gi:2:0"
)

APIS=(
  run.googleapis.com
  cloudbuild.googleapis.com
  pubsub.googleapis.com
  cloudscheduler.googleapis.com
  artifactregistry.googleapis.com
  firebase.googleapis.com
  firestore.googleapis.com
)

echo "Enabling required Google Cloud APIs..."
gcloud services enable "${APIS[@]}" --project="$PROJECT_ID"

echo "Creating Pub/Sub topics and subscriptions..."
bash "$SCRIPT_DIR/setup-pubsub.sh"

echo "Deploying Firestore rules and indexes..."
firebase use "$PROJECT_ID"
firebase deploy --only firestore:rules --project "$PROJECT_ID"
firebase deploy --only firestore:indexes --project "$PROJECT_ID"

echo "Building and deploying Cloud Run services..."
declare -A SERVICE_URLS
for entry in "${SERVICES[@]}"; do
  IFS=":" read -r name port source memory cpu min_instances <<< "$entry"
  echo "Deploying $name from $source"
  gcloud run deploy "$name" \
    --project="$PROJECT_ID" \
    --region="$REGION" \
    --source="$ROOT_DIR/$source" \
    --allow-unauthenticated \
    --port="$port" \
    --memory="$memory" \
    --cpu="$cpu" \
    --min-instances="$min_instances" \
    --service-account="$SERVICE_ACCOUNT" \
    --set-env-vars="GOOGLE_CLOUD_PROJECT_ID=$PROJECT_ID,OFFLINE_MODE=false"

  SERVICE_URLS["$name"]="$(gcloud run services describe "$name" --project="$PROJECT_ID" --region="$REGION" --format='value(status.url)')"
done

echo "Creating Cloud Scheduler jobs..."
gcloud scheduler jobs create http supplyguard-ingestion-poll \
  --project="$PROJECT_ID" \
  --location="$REGION" \
  --schedule="*/5 * * * *" \
  --uri="${SERVICE_URLS[ingestion-service]}/health" \
  --http-method=GET || true

gcloud scheduler jobs create http supplyguard-anomaly-kick \
  --project="$PROJECT_ID" \
  --location="$REGION" \
  --schedule="*/5 * * * *" \
  --uri="${SERVICE_URLS[anomaly-engine]}/health" \
  --http-method=GET || true

echo "Installing frontend dependencies and building Flutter web bundle if Flutter is available..."
if command -v flutter >/dev/null 2>&1; then
  (cd "$ROOT_DIR/frontend" && flutter pub get && flutter build web --release)
  firebase deploy --only hosting --project "$PROJECT_ID"
else
  echo "Flutter SDK not found; skipping Flutter build and Firebase Hosting deploy."
fi

echo "Seeding Firestore..."
node "$SCRIPT_DIR/seed-firestore.js"

echo
echo "Deployment complete. Service URLs:"
for name in "${!SERVICE_URLS[@]}"; do
  echo "  $name -> ${SERVICE_URLS[$name]}"
done
