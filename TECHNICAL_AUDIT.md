# SupplyGuard AI: Technical Audit & System Breakdown

## 1. PROJECT STRUCTURE

The project is a complex, multi-stack ecosystem designed for disaster logistics and rescue operations. It is organized as a monorepo containing web, mobile, and backend components.

### Directory Tree Overview
-   **Root**: React-based Command Center Dashboard (Vite + TypeScript).
-   **`frontend/`**: Field Operations App (Flutter).
-   **`backend/`**: Suite of microservices (Node.js/TypeScript) with Docker support.
-   **`android-apps/`**: Native Android application suite (Kotlin/Gradle) using a shared core.
-   **`src/`**: React source code for the main web dashboard.
-   **`lib/`**: Flutter launcher code (links to `frontend/`).
-   **`android/`**: Android platform folder for the Flutter app.
-   **`ios/`, `linux/`, `macos/`, `windows/`, `web/`**: Platform-specific folders for the Flutter app.
-   **`scripts/`**: Utility scripts (e.g., impact evaluation).
-   **`docs/`**: Project documentation.

### Core Components
| Component | Technology | Role |
| :--- | :--- | :--- |
| **Command Center (Web)** | React, Vite, Tailwind CSS | High-level situational awareness, fleet tracking, and simulation. |
| **Field App (Flutter)** | Flutter, Riverpod, Firebase | On-the-ground operations for field agents. |
| **Mesh Apps (Android)** | Kotlin, Room, Retrofit | Resilient offline communication suite (Victim, Rescue, Command). |
| **Microservices** | Express, Docker, Axios | Domain-specific logic (Risk, Route Optimization, Anomaly Detection). |
| **Demo Server** | Node.js, Express, WebSocket | All-in-one server for local testing and APK distribution. |

---

## 2. BUILD & RUN COMMANDS

### Root (Web Dashboard & Demo Backend)
Located in `/`.
-   `npm install`: Installs web and root server dependencies.
-   `npm run dev`: Starts the Express server (`server.ts`) which also serves the Vite development server.
-   `npm run build`: Generates the production React bundle in `dist/`.
-   `npm run preview`: Previews the production build.
-   `npm run evaluate`: Runs the AI impact evaluation script.

### Field App (Flutter)
Located in `frontend/` (or run from root if configured).
-   `flutter pub get`: Installs Dart dependencies.
-   `flutter run`: Runs the app on a connected device/emulator.
-   `flutter build apk`: Builds the Android production APK.
-   `flutter build web`: Builds the web version of the field app.

### Native Android Suite
Located in `android-apps/`.
-   `./gradlew assembleDebug`: Builds all debug APKs (`victim`, `rescue`, `command-center`).
-   `./gradlew :victim:installDebug`: Installs the Victim app on a device.
-   `./gradlew :rescue:installDebug`: Installs the Rescue app.

### Microservices
Located in `backend/`.
-   Each service has its own `package.json`.
-   `docker-compose up`: (If present in `docker/`) Orchestrates the entire backend stack.

---

## 3. FRONTEND ANALYSIS (React)

### Architecture
The React frontend is a Single Page Application (SPA) built with Vite. It uses a **Component-Based Architecture** with a central state store.

### Key Components (`src/components`)
-   **Dashboard.tsx**: The main orchestration component. Manages layout and high-level view switching.
-   **Map.tsx**: The visual core. Uses `react-leaflet` and Google Maps components to display real-time drone positions, risk zones, and mission paths.
-   **layout/**: Contains structural components like `Sidebar`, `Header`, and `Footer`.
-   **ui/**: Atomic UI components (Buttons, Cards, Modals) styled with Tailwind CSS.
-   **sections/**: Domain-specific panels (Fleet Status, Risk Analysis, Inventory).

### State Management (`src/store`)
-   **useStore.ts**: A comprehensive **Zustand** store.
    -   **State**: Fleet status, active missions, simulation parameters, and UI toggles.
    -   **Logic**: Actions for updating drone coordinates, triggering simulations, and handling alerts.
-   **useMeshAlerts.ts**: Specialized store for handling offline mesh notifications.

### API & Data Fetching
-   Uses **Axios** for communication with the demo server or API Gateway.
-   **Endpoints**:
    -   `/api/predict-risk`: Fetches AI-calculated risk scores.
    -   `/api/optimize-route`: Gets optimized mission paths.
    -   `/api/simulate`: Triggers digital twin simulations.
-   **WebSocket**: Connects to `ws://localhost:3000/mesh` for real-time situational updates.

---

## 4. BACKEND ANALYSIS (Gradle & Node)

### Native Android Backend (`android-apps/core`)
-   **Database**: **Room (SQLite)** for local persistent storage of mesh messages and victim data.
-   **Networking**: **Retrofit** for syncing with the central server when connectivity is available.
-   **Background Tasks**: **WorkManager** for periodic syncing and location reporting.
-   **Architecture**: MVVM pattern within each sub-app (Victim, Rescue).

### Microservices (`backend/`)
-   **API Gateway**: Acts as the single entry point. Handles authentication (Firebase), rate limiting, and circuit breaking.
-   **Services**:
    -   `risk-engine`: Python/Node service for calculating risk based on environmental factors.
    -   `route-optimizer`: Pathfinding logic avoiding high-risk zones.
    -   `simulation-engine`: Handles "what-if" disaster scenarios.

### Demo Server (`server.ts`)
-   **Role**: A "Swiss Army Knife" for developers.
-   **Features**:
    -   Dynamic APK bundling: Generates zip files of APKs on the fly.
    -   Mesh Relay: Provides an SSE (Server-Sent Events) fallback for peer-to-peer communication in restricted networks.

---

## 5. DATA FLOW

1.  **SOS Trigger**: A Victim app (Android) or Field App (Flutter) sends an alert.
2.  **Propagation**: 
    -   If online: Sent to **Firestore** and the **API Gateway**.
    -   If offline: Propagated via **Bluetooth/Wi-Fi Mesh** to nearby Rescue devices.
3.  **Processing**: The **Anomaly Engine** detects the surge, and the **Risk Engine** calculates environmental danger.
4.  **Dashboard Update**: The React Command Center receives updates via **Firestore Listeners** or **WebSockets**.
5.  **Response**: A dispatcher assigns a drone or rescue team. The **Route Optimizer** provides a safe path.
6.  **Execution**: Instructions are pushed back to the Field App or Drone via the **Drone Engine**.

---

## 6. DEPENDENCIES

### Frontend (React)
-   `lucide-react`: Modern iconography.
-   `motion`: For smooth, premium UI transitions.
-   `zustand`: Lightweight state management.
-   `leaflet` & `@vis.gl/react-google-maps`: Hybrid mapping solution.
-   `recharts`: Data visualization for risk and fleet metrics.

### Frontend (Flutter)
-   `flutter_riverpod`: Reactive state management.
-   `firebase_messaging`: Push notifications.
-   `flutter_map`: Offline-capable maps.
-   `flutter_blue_plus`: Bluetooth Low Energy (BLE) for mesh networking.

### Android Core
-   `androidx.room`: Local SQLite abstraction.
-   `kotlinx-coroutines`: Asynchronous programming.
-   `com.squareup.retrofit2`: Type-safe HTTP client.

---

## 7. CONFIGURATION & ENVIRONMENT

-   **.env**: Root environment file for API keys (Google Maps, Firebase, GenAI).
-   **firebase-applet-config.json**: Firebase project settings.
-   **wrangler.jsonc**: Configuration for Cloudflare deployment (if used).
-   **Gradle Properties**: `android-apps/gradle.properties` defines build-specific flags.

---

## 8. ARCHITECTURE SUMMARY

### Patterns
-   **Hexagonal / Ports & Adapters**: Used in microservices to isolate business logic from transport layers.
-   **Micro-Frontend approach**: The web dashboard integrates Flutter-web components under the `/flutter` path.
-   **Pub/Sub**: Heavy reliance on real-time event streams (Firestore, WebSockets, SSE).

### Strengths
-   **Resilience**: Excellent fallback mechanisms (Online -> Local Relay -> Mesh).
-   **Scalability**: Microservices architecture allows independent scaling of heavy engines (Simulation, Risk).
-   **UX**: Rich animations and hybrid maps provide a "Mission Control" feel.

### Weaknesses
-   **Complexity**: High barrier to entry for new developers due to multiple tech stacks.
-   **State Duplication**: Potential for desync between the Zustand store and Firestore if not carefully managed.

---

## 9. ISSUES & RISKS

-   **Code Smell**: `server.ts` is becoming a "God Object" in the demo environment, mixing APK distribution, mesh relay, and simulation logic.
-   **Risk**: Heavy reliance on system-level `tar` and `zip` commands in `server.ts` may fail on non-Linux environments.
-   **Missing Logic**: No explicit "Conflict Resolution" logic found for merging offline mesh data back into the main Firestore database.
-   **Performance**: Large Leaflet map renders with many moving markers might require virtualization or Canvas-based rendering.

---

## 10. EXECUTION GUIDE

### Phase 1: Environment Setup
1.  Ensure Node.js (v20+), Flutter, and Android Studio (with Kotlin/Gradle) are installed.
2.  Copy `.env.example` to `.env` and fill in API keys.

### Phase 2: Running the Web Dashboard
```bash
# From root
npm install
npm run dev
```
Open `http://localhost:3000`.

### Phase 3: Running the Field App
```bash
# From frontend/
flutter pub get
flutter run -d chrome # for web
# or
flutter run # for mobile
```

### Phase 4: Building Android Mesh Suite
```bash
# From android-apps/
./gradlew assembleDebug
```
APKs will be located in `android-apps/*/build/outputs/apk/debug/`.

### Phase 5: Production Build
```bash
# From root
npm run build
# The 'dist' folder is now ready for deployment.
```
