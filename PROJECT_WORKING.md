# SupplyGuard AI: Project Working

This document explains how the project works as a system.
It is not a code walkthrough. It describes what the app is doing, what data is flowing through it, and which parts of the repo are responsible for that behavior.

## 1. What This Project Is

SupplyGuard AI is a disaster logistics and response simulation platform.

In the current runnable root app, the system simulates disaster pressure across Bengaluru and shows:

- affected localities
- hospital stress
- logistics routes
- mission dispatches
- fleet movement
- operational alerts
- scenario comparisons

The app is designed to feel like a disaster command center rather than a static dashboard.

## 2. The Two Layers In This Repo

This repo currently contains two layers:

- A root React app
- A larger monorepo architecture for backend, frontend, Firestore, Docker, and scripts

### Root React app

This is the part currently being used and actively run with:

```bash
npm run dev
```

Its main files are:

- [server.ts](/home/asus/Documents/SupplyGuardAI/server.ts)
- [src/App.tsx](/home/asus/Documents/SupplyGuardAI/src/App.tsx)
- [src/components/Dashboard.tsx](/home/asus/Documents/SupplyGuardAI/src/components/Dashboard.tsx)
- [src/components/Map.tsx](/home/asus/Documents/SupplyGuardAI/src/components/Map.tsx)
- [src/store/useStore.ts](/home/asus/Documents/SupplyGuardAI/src/store/useStore.ts)

### Monorepo architecture

This is the broader production-style structure created for the full SupplyGuard AI platform:

- [backend](/home/asus/Documents/SupplyGuardAI/backend)
- [frontend](/home/asus/Documents/SupplyGuardAI/frontend)
- [firestore](/home/asus/Documents/SupplyGuardAI/firestore)
- [docker](/home/asus/Documents/SupplyGuardAI/docker)
- [scripts](/home/asus/Documents/SupplyGuardAI/scripts)

That part defines the long-term production system design, but the root React app is the current working simulation experience.

## 3. How The Current Root App Works

The current root app works as a simulation pipeline:

1. Base simulation settings are defined.
2. Bengaluru localities, hospitals, hubs, corridors, and fleet units are seeded.
3. A scenario engine computes stress on the city.
4. Derived operational objects are generated.
5. The dashboard renders those derived objects as a command-center UI.
6. The map translates simulation entities into real Bengaluru map positions and road-following route geometry.

So the app is not just displaying static data.
It is computing a full response state from scenario inputs.

## 4. Main Simulation Inputs

The simulation starts from a small set of operator-controlled settings in [src/store/useStore.ts](/home/asus/Documents/SupplyGuardAI/src/store/useStore.ts).

These include:

- selected locality focus
- disaster mode
- water level
- earthquake level
- storm level
- heat level
- medicine buffer

These settings act like the command center’s scenario dial.

When they change, the simulation recomputes the entire operational state.

## 5. Seeded Real-World Entities

The project starts from seeded Bengaluru entities.

These are defined in [src/store/useStore.ts](/home/asus/Documents/SupplyGuardAI/src/store/useStore.ts):

- localities such as Whitefield, KR Puram, Indiranagar, MG Road, Koramangala, Electronic City, Jayanagar, Rajarajeshwari Nagar, Hebbal, and Yelahanka
- hospitals such as Manipal, Vydehi, CMH, St. John’s, Apollo, BGS, Aster, and Bowring
- relief hubs such as Peenya, Hoskote, and Bommasandra
- major corridors between those locations
- fleet units such as ambulances, drones, food convoys, rescue teams, evacuation buses, and utility rigs

These entities are the raw operational building blocks of the simulation.

## 6. What The Scenario Engine Computes

The main scenario computation happens in [src/store/useStore.ts](/home/asus/Documents/SupplyGuardAI/src/store/useStore.ts), inside the simulation logic.

From the operator settings, it computes:

- locality risk score
- flood/water depth effect
- earthquake structural stress
- storm impact
- heat stress
- accessibility
- affected population
- medicine demand
- food demand
- rescue demand
- evacuation demand
- support pressure

This means every locality becomes a dynamic emergency zone rather than just a point on a map.

## 7. How Hospitals Are Affected

After locality stress is computed, hospitals are evaluated.

For each hospital, the system computes:

- occupancy
- medicine stock
- power backup strength
- current patients
- incoming patients
- outgoing patients
- drone inbound load
- rescue teams assigned
- food stock
- auto-order ETA
- hospital status: stable, surge, or critical

So the hospital layer is downstream of locality pressure.
If surrounding localities worsen, hospitals inherit that pressure.

## 8. How Routes Are Evaluated

Corridors are then evaluated based on the localities they connect.

For each route, the system computes:

- route risk score
- estimated travel time
- route status: open, slow, restricted, or blocked

This gives the command center a logistics picture.
It is not enough to know that an area is affected.
The system also asks whether response movement through that area is still possible.

## 9. How Missions Are Created

Once strained or critical localities are identified, the simulation generates missions.

Each affected locality gets service plans such as:

- ambulance surge
- drone medicine lift
- food convoy staging
- rescue extraction
- evacuation bus dispatch
- utility restoration

Each mission includes:

- origin hub
- destination locality or hospital
- units needed
- ETA
- route risk
- priority
- execution status
- narrative explanation

This is how the system turns emergency conditions into operational action.

## 10. How Fleet Units Are Positioned

Fleet units are not random.
They are derived from the mission set.

The simulation places fleet units according to:

- their home relief hub
- the mission type they belong to
- the locality they are serving
- readiness
- fuel or battery
- load
- ETA
- mission state

So the fleet layer is the visible moving response arm of the scenario.

## 11. How Alerts, Briefings, and Notifications Are Created

After the simulation computes locality, hospital, route, and mission states, it creates operational intelligence objects.

These include:

- top-level alerts
- AI briefing
- scenario comparisons
- notifications
- operations metrics
- stress timeline
- decision points

This is what powers the right side of the command-center experience.

The goal is:

- not just show data
- but tell the operator what matters now

## 12. How The UI Is Structured

The top-level visual shell is built in:

- [src/App.tsx](/home/asus/Documents/SupplyGuardAI/src/App.tsx)
- [src/components/Dashboard.tsx](/home/asus/Documents/SupplyGuardAI/src/components/Dashboard.tsx)

The dashboard is organized into operational sections:

- hero and overview
- KPI summary
- command map
- simulation controls
- AI what-if briefing
- mission orchestration
- system alerts
- live operations stats
- notification feed
- scenario comparison
- response matrix
- stress scenario report
- locality intelligence
- hospital operations
- case studies

So the UI is not one single page of random cards.
It is arranged as a command workflow:

- understand situation
- inspect geography
- see response actions
- compare outcomes
- decide next move

## 13. How The Real Map Works

The real map behavior is in [src/components/Map.tsx](/home/asus/Documents/SupplyGuardAI/src/components/Map.tsx).

It uses:

- OpenStreetMap as the base map
- Leaflet for rendering
- OSRM public API for road-following route geometry

### What the map shows

The map renders:

- localities as real Bengaluru points
- hospitals as medical markers
- hubs as relief hub markers
- routes as road-following corridor lines
- missions as routed operational lines
- risk circles around localities
- fleet units along mission paths

### Why this matters

Earlier versions projected synthetic coordinates onto the city.
Now the app uses real Bengaluru anchors and OSRM-generated route shapes so the simulation feels much closer to actual streets and movement corridors.

## 14. How Routing Works Now

Routing is no longer manually drawn.

For each corridor or mission path:

1. the app builds a route descriptor
2. the app sends coordinates to the OSRM public routing engine
3. OSRM returns GeoJSON route geometry
4. the app decodes that geometry into lat/lng points
5. Leaflet renders those points as route polylines

The route cache is stored:

- in memory during the session
- in `localStorage` across reloads

This is why route lines can persist more reliably even if OSRM is temporarily unavailable later.

## 15. How Fleet Marker Positioning Works

Fleet units are shown along routed paths, not just between endpoints.

The app:

1. finds the mission related to the fleet unit
2. gets the routed mission path from OSRM
3. calculates the unit’s progress ratio from simulation data
4. samples the correct point along the routed polyline
5. places the fleet marker at that sampled point

So vehicles appear along the actual route path rather than floating between origin and destination.

## 16. How The Command Flow Feels To A User

When a user opens the project:

1. the intro overlay appears
2. the dashboard loads seeded Bengaluru emergency entities
3. the simulation engine computes citywide stress and response state
4. the command map shows the geography of the current situation
5. the right and lower panels explain impact, missions, hospitals, and alerts
6. the user changes simulation controls
7. the whole scenario recomputes
8. the map, metrics, missions, alerts, and briefings update together

This creates the effect of a live operational command center.

## 17. What server.ts Is Doing

[server.ts](/home/asus/Documents/SupplyGuardAI/server.ts) starts the local dev server.

In development:

- it starts Express
- it mounts Vite middleware
- it exposes a few API endpoints used for mock/demo behavior

These endpoints include:

- risk prediction
- route optimization
- simulation activation

So `server.ts` is the local bridge that serves the app and keeps a few demo API behaviors available.

## 18. What The Larger Monorepo Is Meant To Do

Outside the root app, the broader monorepo is intended to represent the full production system architecture.

That includes:

- ingestion of disaster signals
- risk scoring
- route optimization
- drone engine
- rescue engine
- inventory engine
- anomaly engine
- AI explanation engine
- simulation engine
- offline server
- Firestore schema and rules
- Flutter frontend
- Docker offline deployment

So conceptually:

- the root React app is the current working simulation front-end
- the monorepo is the larger system blueprint and implementation base

## 19. What Is Actually “Working” Right Now

At the current stage, the most concrete active experience is:

- the root React command-center simulation
- OpenStreetMap + Leaflet map
- OSRM-driven route geometry
- dynamic scenario recomputation from operator controls
- dashboard-level operational intelligence

This is the best place to understand the project’s live behavior.

## 20. In One Sentence

SupplyGuard AI works by taking a disaster scenario configuration, turning it into computed emergency pressure across Bengaluru, generating response operations from that pressure, and visualizing the full result as a command-center simulation on a real street map.
