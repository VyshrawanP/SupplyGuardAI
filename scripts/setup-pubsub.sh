#!/usr/bin/env bash
set -euo pipefail

PROJECT_ID="${GOOGLE_CLOUD_PROJECT_ID:-supplyguard-ai}"

topics=(
  disaster-signals
  risk-decisions
  route-updates
  drone-telemetry
  alerts
  inventory-events
)

for topic in "${topics[@]}"; do
  gcloud pubsub topics create "$topic" --project="$PROJECT_ID" || true
done

gcloud pubsub subscriptions create risk-engine-disaster-signals \
  --project="$PROJECT_ID" \
  --topic=disaster-signals \
  --push-endpoint="${RISK_ENGINE_URL:-https://risk-engine}/pubsub" \
  --push-auth-service-account="${PUBSUB_PUSH_SA:-pubsub-push@$PROJECT_ID.iam.gserviceaccount.com}" || true

gcloud pubsub subscriptions create route-optimizer-risk-decisions \
  --project="$PROJECT_ID" \
  --topic=risk-decisions \
  --push-endpoint="${ROUTE_OPTIMIZER_URL:-https://route-optimizer}/pubsub" \
  --push-auth-service-account="${PUBSUB_PUSH_SA:-pubsub-push@$PROJECT_ID.iam.gserviceaccount.com}" || true

gcloud pubsub subscriptions create drone-engine-risk-decisions \
  --project="$PROJECT_ID" \
  --topic=risk-decisions \
  --push-endpoint="${DRONE_ENGINE_URL:-https://drone-engine}/pubsub" \
  --push-auth-service-account="${PUBSUB_PUSH_SA:-pubsub-push@$PROJECT_ID.iam.gserviceaccount.com}" || true

gcloud pubsub subscriptions create anomaly-engine-alerts \
  --project="$PROJECT_ID" \
  --topic=alerts \
  --push-endpoint="${ANOMALY_ENGINE_URL:-https://anomaly-engine}/pubsub" \
  --push-auth-service-account="${PUBSUB_PUSH_SA:-pubsub-push@$PROJECT_ID.iam.gserviceaccount.com}" || true

gcloud pubsub subscriptions create ai-explainer-alerts \
  --project="$PROJECT_ID" \
  --topic=alerts \
  --push-endpoint="${AI_EXPLAINER_URL:-https://ai-explainer}/pubsub" \
  --push-auth-service-account="${PUBSUB_PUSH_SA:-pubsub-push@$PROJECT_ID.iam.gserviceaccount.com}" || true

gcloud pubsub subscriptions create inventory-engine-events \
  --project="$PROJECT_ID" \
  --topic=inventory-events \
  --push-endpoint="${INVENTORY_ENGINE_URL:-https://inventory-engine}/pubsub" \
  --push-auth-service-account="${PUBSUB_PUSH_SA:-pubsub-push@$PROJECT_ID.iam.gserviceaccount.com}" || true
