# SupplyGuard AI — Project Intelligence Document

This document serves as the comprehensive source of truth for SupplyGuard AI. It is designed to provide AI models and developers with the full technical and strategic context of the project.

---

## 1. Project Identity
- **Name:** SupplyGuard AI
- **Team:** @NEOFETCH
- **Lead:** Vyshrawan Pothuraju
- **Objective:** Google Solution Challenge 2026 — Rapid Crisis Response Open Innovation.
- **Primary SDGs:** 
    - **SDG 11 (Sustainable Cities and Communities):** Building resilient logistics infrastructure.
    - **SDG 3 (Good Health and Well-being):** Accelerating medical response in "Communication Dark" zones.
    - **SDG 13 (Climate Action):** Responding to climate-intensified disaster events.

---

## 2. The Core Innovation: "The Dark Zone Shield"
SupplyGuard AI is built on the premise that **disaster response must work when infrastructure fails.** It solves the "Fragile Communication" problem using three distinct technical layers:

### A. The BLE Store-and-Forward Mesh
Instead of relying on cell towers, our native Android apps create a **P2P Bluetooth Low Energy (BLE) Mesh**.
- **Multi-Hop Relay:** SOS signals from victims "hop" across rescue team devices.
- **Deduplication:** A custom GATT server logic ensures messages aren't looped infinitely.
- **Native Stack:** Built with Jetpack Compose (UI) and a custom Kotlin BLE engine.

### B. Conflict-Free Offline Sync (CRDTs)
Responders often work offline for hours. When they reconnect, manual data merging is impossible.
- **Tech:** Conflict-Free Replicated Data Types (CRDTs).
- **Mechanism:** Vector clocks track causality. Multiple offline updates are merged mathematically, ensuring **Zero Data Loss**.
- **Implementation:** Custom logic (not a library) for maximum efficiency on low-resource devices.

### C. AI-Augmented Command (Responsible AI)
- **Deterministic Risk Engine:** A backend service that calculates city-wide stress (0-100) based on flood levels, hospital occupancy, and route blockages.
- **Gemini Pro Integration:** Google Gemini acts as an **Intelligence Narrator**. It takes deterministic output and generates natural language "Mission Briefings" for human commanders, explaining the "Why" behind every autonomous drone launch.

---

## 3. System Architecture

### Frontend (Command Center)
- **Stack:** React, Vite, TypeScript, Framer Motion (Animations), Tailwind CSS.
- **Mapping:** Leaflet + OpenStreetMap with **OSRM (Open Source Routing Machine)** for real-time, road-following navigation paths.
- **Simulation:** A digital-twin engine that recomputes city stress in real-time based on "What-If" scenario sliders.

### Android Ecosystem (`android-apps/`)
- **Victim App:** Generates SOS packets via BLE.
- **Rescue App:** Receives mesh packets, manages local tasks, and syncs to cloud.
- **Command App (Mobile):** Tablet-optimized dashboard for field commanders.
- **Core Library:** Shared BLE engine, Room Database (SQLite), and WorkManager for background sync.

### Backend & Infrastructure
- **Cloud:** Google Cloud Run (Microservices).
- **Database:** Firestore (Real-time sync) + Firebase Auth.
- **Simulation Engine:** Node.js/TypeScript logic that seeds real-world Bengaluru entities (Hospitals, Hubs, Corridors).

---

## 4. Key Directory Map
- `/src`: Root React Command Center.
- `/android-apps`: Native Kotlin/Compose mesh applications.
- `/backend`: Microservices for risk scoring and AI explanation.
- `/docs`: Detailed implementation plans and video scripts.
- `/scripts`: Evaluation scripts for benchmarking system performance.

---

## 5. Performance Benchmarks
- **Response Latency:** 35% improvement in "Communication Dark" scenarios.
- **Data Integrity:** 100% successful CRDT merge rate in simulated 48-hour offline stress tests.
- **Scalability:** Designed to handle 10,000+ mesh-active devices per city cluster.

---

## 6. How to Talk to This Project
When asking about SupplyGuard AI, remember:
1. **Offline is Priority:** If a feature requires the internet, it must have an offline fallback.
2. **Determinism over Hallucination:** AI is for explanation and narrative; math is for dispatch and life-saving decisions.
3. **Aesthetics Matter:** The Command Center UI must look premium, high-tech, and "Judge-Ready."
