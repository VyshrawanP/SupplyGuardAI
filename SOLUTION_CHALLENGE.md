# SupplyGuard AI — Google Solution Challenge Submission Pack

This file is the *judge-first* overview: what problem we solve, which SDGs we target, how we measure impact, how to run the demo, and how we use AI responsibly.

## 1) Problem

During floods, storms, earthquakes, and heatwaves, **the supply chain becomes the emergency**:

- roads become unreliable (blocked/slow/restricted)
- hospitals surge (occupancy + medicine stock volatility)
- relief inventory becomes fragmented (stockouts, delayed replenishment)
- communications degrade (offline/patchy connectivity)

The result is avoidable delays in medical delivery, rescue coordination, and basic supplies distribution.

## 2) SDG Alignment (Primary + Secondary)

**Primary SDG**
- **SDG 11 — Sustainable Cities and Communities**: resilient logistics, emergency operations, and continuity under disruption.

**Secondary SDGs**
- **SDG 3 — Good Health and Well‑Being**: reduce time-to-care via hospital surge routing, medicine lift, and triage coordination.
- **SDG 13 — Climate Action**: climate-intensified disasters increase disruption frequency; the system is designed for flood/storm/heat stress.

## 3) Solution (What SupplyGuard AI is)

SupplyGuard AI is a disaster logistics command system with:

- **Risk scoring** for corridors/localities (0–100) and actionable categories
- **Route intelligence** with risk-aware travel time and “route warnings”
- **Service orchestration** across ambulance, drones, rescue teams, evacuation buses, and utilities
- **Inventory resilience** (coverage, buffer, auto-orders)
- **Digital-twin simulation** so decisions can be tested before field deployment
- **Offline field mode** (local-only demo + WebSocket signaling for meshes)
- **AI explanation layer** that explains deterministic decisions in plain language

## 4) What’s “AI” vs Deterministic (Responsible AI boundary)

SupplyGuard AI intentionally separates:

- **Deterministic decision engines** (risk scoring, dispatch logic, simulation)
- **AI explainer** (Gemini) that **only** narrates decisions already made

This reduces the chance of AI hallucinations causing operational harm.

See: `backend/ai-explainer/src/prompt-builder.ts`.

## 5) Impact Metrics (How we measure)

We measure system performance using a **repeatable scenario suite** (so judges can reproduce results):

- **ETA reduction** (avg route ETA minutes down)
- **Coverage improvement** (medicine/food coverage % up)
- **Critical backlog reduction** (critical missions count down)
- **Stability** (autonomy score and AI confidence tracking)

Run the evaluation script:

```bash
npm run evaluate
```

It prints a scenario-by-scenario table derived from `src/store/indiaHistoryReplays.ts`.

## 6) Judge Quickstart (Fastest demo path)

**Option A — Local-only (recommended for judging)**

```bash
cp .env.example .env
npm install
npm run dev
```

Open `http://localhost:3000` and use:

- **Full view** toggle (top-right)
- **Simulation** controls (disaster mode + intensity)
- **History replay** (if enabled in your build) for repeatable benchmark narratives

Video/demo helpers:

- `docs/VIDEO_SCRIPT.md`
- `docs/DEMO_CHECKLIST.md`

**Option B — Full cloud (advanced)**

Follow `README.md` deployment steps with Firebase + Google Cloud.

## 7) Privacy & Safety

- **Data minimization**: operational alerts can be generated without storing PII.
- **Role-based access**: use Firebase Auth + user roles stored in Firestore (admin/observer/etc.).
- **Demo vs production**: demo defaults may be more permissive to reduce friction; production rules should be tightened (see notes in `firestore.rules`).

## 8) Scalability & Sustainability

- Microservices on Cloud Run (ingestion, risk, routing, drone, rescue, inventory, anomaly, explainer, simulation)
- Pub/Sub topics for event-driven updates
- Offline stack (SQLite + local services) for field operation when internet is down

## 9) What makes this “top-tier”

1. **Reproducible impact**: the demo includes a repeatable scenario suite + evaluation script.
2. **Human-in-the-loop**: AI explains; deterministic engines decide; humans approve.
3. **Offline-first**: designed for disaster conditions, not perfect connectivity.
4. **Clear SDG mapping**: explicit primary + secondary SDGs and measurable metrics.

## 10) 3-minute video structure (recommended)

- 0:00–0:20 — disaster logistics problem + SDGs
- 0:20–1:20 — live demo: simulate disruption → see risk → dispatch plan → inventory + hospital surge
- 1:20–2:10 — explainability: show “why” behind a decision
- 2:10–2:40 — offline mode + field mesh alerts
- 2:40–3:00 — impact metrics + call to action
