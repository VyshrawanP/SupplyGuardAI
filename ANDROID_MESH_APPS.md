# SupplyGuard Offline Mesh Android Apps

This repo contains a standalone native Android workspace at `android-apps/` that builds two offline-first apps:

- Victim App: `ai.supplyguard.victim`
- Rescue Team App: `ai.supplyguard.rescue`

Both apps communicate without internet using a BLE-based store-and-forward mesh and sync to the backend when the network is available.

## 1) Architecture (Modules + Layers)

Workspace: `android-apps/` (Gradle multi-module)

- `:core` (Android library)
  - `data/`: wire formats + payload models (`MeshEnvelope`, `SosPayload`, `ResponsePayload`)
  - `db/`: Room database (`AppDatabase`, `MeshMessageEntity`, `MeshMessageDao`)
  - `mesh/`: BLE discovery + message exchange + routing (`BleMeshEngine`, `MeshRouter`, `MeshRepository`)
  - `net/`: Retrofit backend client (`BackendApi`, `BackendClient`)
  - `work/`: WorkManager sync (`BackendSyncWorker`, `WorkScheduler`)
- `:victim` (Android app, Jetpack Compose, MVVM)
  - `VictimApp` creates DB/repo/mesh engine and schedules sync
  - `VictimViewModel` generates SOS and stores it locally
  - `MainActivity` UI: name/location/need + `SEND SOS`
- `:rescue` (Android app, Jetpack Compose, MVVM)
  - `RescueApp` creates DB/repo/mesh engine and schedules sync
  - `RescueViewModel` watches SOS stream + sends responses
  - `MainActivity` UI: list of SOS + “Send Response”

MVVM boundaries:

- UI (Compose) only talks to ViewModel
- ViewModel talks to `MeshRepository`
- `MeshRepository` persists messages and provides streams (Flow)
- `BleMeshEngine` performs local radio exchange and hands inbound messages to `MeshRouter`

## 2) Data Models (Kotlin data classes)

Main envelope (`android-apps/core/src/main/java/ai/supplyguard/data/MeshModels.kt`):

- `MeshEnvelope`
  - `id`: UUID string
  - `type`: `SOS` | `RESPONSE` | `ACK`
  - `timestampEpochMs`
  - `ttl`: hop limit
  - `hops`: current hop count
  - `originDeviceId`
  - `payload`: JSON string for the specific payload type
- `SosPayload { name, locationText, need }`
- `ResponsePayload { targetMessageId, message }`
- `AckPayload { targetMessageId }`

## 3) BLE Communication Manager (Core Logic)

File: `android-apps/core/src/main/java/ai/supplyguard/mesh/BleMeshEngine.kt`

What it does:

- Advertise a fixed BLE service UUID (`BleUuids.SERVICE_UUID`) so nearby peers can discover us.
- Host a GATT server with one write characteristic (`BleUuids.MESSAGE_CHAR_UUID`) to receive messages.
- Run a duty-cycled scan loop (scan a few seconds, rest longer) to find peers and connect.
- On connection, push “forward candidates” (messages not attempted recently) to that peer by writing the characteristic.

Why this yields multi-hop:

- Every device stores all received messages locally.
- Every device periodically forwards stored messages to peers.
- Messages spread hop-by-hop until TTL hits 0.

## 4) Message Routing Logic (Dedupe + TTL)

Files:

- `android-apps/core/src/main/java/ai/supplyguard/mesh/MeshRouter.kt`
- `android-apps/core/src/main/java/ai/supplyguard/db/Entities.kt`

Rules:

- Dedupe: Room primary key is the message ID. Inserts use `OnConflictStrategy.IGNORE`.
- Store: every new message is persisted.
- Forward: only messages with `ttl > 0` are eligible.
- When forwarding: `ttl = ttl - 1`, `hops = hops + 1`.
- Avoid loops: a device will not forward messages it already has (dedupe prevents re-adding).

## 5) Sample UI Screens (Jetpack Compose)

Victim:

- File: `android-apps/victim/src/main/java/ai/supplyguard/victim/MainActivity.kt`
- “SEND SOS” + optional fields (Name, Location, Need)
- Permission gate requests BLE permissions.

Rescue:

- File: `android-apps/rescue/src/main/java/ai/supplyguard/rescue/MainActivity.kt`
- SOS list (from local DB stream) + Respond dialog
- Permission gate requests BLE permissions.

## 6) Background Sync Worker

Files:

- `android-apps/core/src/main/java/ai/supplyguard/work/BackendSyncWorker.kt`
- `android-apps/core/src/main/java/ai/supplyguard/work/WorkScheduler.kt`

Behavior:

- When the device has internet, WorkManager batches unsynced messages and POSTs them:
  - `POST /api/messages`
- On success: marks messages as `SYNCED`.
- On failure: retries.

Configure base URL in each app’s `Application`:

- `android-apps/victim/src/main/java/ai/supplyguard/victim/VictimApp.kt`
- `android-apps/rescue/src/main/java/ai/supplyguard/rescue/RescueApp.kt`

## 7) Build + Run (APK)

Prereqs:

- Android Studio installed (includes Android SDK)
- Set one of:
  - `ANDROID_HOME=/path/to/Android/Sdk`
  - or create `android-apps/local.properties` with `sdk.dir=/path/to/Android/Sdk`

Build debug APKs:

```bash
cd android-apps
./gradlew :victim:assembleDebug
./gradlew :rescue:assembleDebug
```

Outputs:

- `android-apps/victim/build/outputs/apk/debug/victim-debug.apk`
- `android-apps/rescue/build/outputs/apk/debug/rescue-debug.apk`

Install to a device (example):

```bash
adb install -r android-apps/victim/build/outputs/apk/debug/victim-debug.apk
adb install -r android-apps/rescue/build/outputs/apk/debug/rescue-debug.apk
```

## 8) Step-by-Step Implementation Plan (Next Hardening)

Current code is a working baseline. For production hardening:

1. Add message chunking + MTU negotiation fallback.
2. Track and surface RSSI-derived distance and last-relay attribution in DB.
3. Add ACK protocol (explicit ack messages) and victim retry worker until ACK/RESPONSE.
4. Add a ForegroundService toggle for “active scanning” during operations; keep duty-cycle in background.
5. Add optional WiFi Direct transport behind `MeshTransport` interface for higher bandwidth.
6. Add crypto:
   - message signing
   - replay protection beyond UUID
   - role-based keys for rescue devices
7. Backend:
   - idempotent upserts for `/api/messages`
   - server-side dedupe by `id`

