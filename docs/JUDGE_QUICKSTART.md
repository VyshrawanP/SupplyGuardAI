# Judge Quickstart (5 minutes)

## Fastest path: local-only demo

```bash
cp .env.example .env
npm install
npm run dev
```

Open `http://localhost:3000`.

Note: the web console works in offline mode by default (`VITE_OFFLINE_MODE=true`) and will simulate hospital capacity if Firebase is not configured.

### What to click

1. Toggle **Full view** (top-right).
2. Go to **Simulation**.
3. Change **Disaster mode** and sliders to see:
   - risk score changes
   - route status changes (open/slow/restricted/blocked)
   - missions auto-orchestrated by service type
   - hospital + inventory pressure shifts
4. Open **Impact** section:
   - Scenario suite metrics derived from the built-in replay scenarios

## Verify measurable impact (repeatable)

```bash
npm run evaluate
```

This prints a table derived from `src/store/indiaHistoryReplays.ts` showing ETA deltas and coverage improvements.
