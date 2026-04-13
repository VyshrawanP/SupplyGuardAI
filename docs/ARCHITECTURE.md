# Architecture (High-level)

## Components

- **Command Console (Web)**: `src/` (React + Vite)
- **Field App (Flutter)**: `frontend/`
- **Backend services (Cloud Run / local)**: `backend/*`
- **Firestore**: operational state + events
- **Pub/Sub**: event-driven fanout between services
- **Offline stack**: Docker Compose + SQLite + WS signaling

## Data flow (Cloud)

```mermaid
flowchart LR
  Signals[Weather/Traffic/Sensors] --> Ingestion[ingestion-service]
  Ingestion -->|normalized events| Firestore[(Firestore)]
  Ingestion -->|Pub/Sub| Topics[(Pub/Sub Topics)]

  Topics --> Risk[risk-engine]
  Topics --> Route[route-optimizer]
  Topics --> Drone[drone-engine]
  Topics --> Rescue[rescue-engine]
  Topics --> Inventory[inventory-engine]
  Topics --> Anomaly[anomaly-engine]

  Risk --> Firestore
  Route --> Firestore
  Drone --> Firestore
  Rescue --> Firestore
  Inventory --> Firestore
  Anomaly --> Firestore

  Console[Command Console] <-->|read/write| Firestore
  Console --> Gateway[api-gateway]
  Gateway --> Explainer[ai-explainer]
  Explainer -->|JSON explanation| Gateway
  Gateway --> Console
```

## Offline mode

Offline mode focuses on **repeatable simulation + local coordination**, not external API availability:

- Local simulation and UI flows work without OpenWeather / Google Maps keys.
- WebSocket signaling supports local device pairing for mesh alerts.

