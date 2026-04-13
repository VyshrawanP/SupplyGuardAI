import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import http from "http";
import { randomUUID } from "crypto";
import { WebSocketServer } from "ws";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // --- Risk Scoring Engine ---
  // Computes risk score (0-100) and expected delay (minutes)
  app.post("/api/predict-risk", (req, res) => {
    const { weatherIntensity, trafficCongestion, disasterProximity } = req.body;
    
    // Logic: Risk = (Weather * 0.4) + (Traffic * 0.3) + (Disaster * 0.3)
    const riskScore = Math.min(100, (weatherIntensity * 0.4) + (trafficCongestion * 0.3) + (disasterProximity * 0.3));
    
    // Delay: Base delay + (Risk * 2) minutes
    const expectedDelay = Math.round(riskScore * 1.5);

    res.json({ riskScore, expectedDelay });
  });

  // --- Route Optimization Engine ---
  // Mocking Google Maps Directions API logic for the demo
  app.post("/api/optimize-route", (req, res) => {
    const { origin, destination, highRiskZones } = req.body;
    
    // In a real app, we'd call Google Maps Directions API with 'avoid' parameters
    // Here we return a simulated optimized route
    res.json({
      bestRoute: "Optimized Path via NH-44",
      eta: "4h 20m",
      improvement: "15% faster than original",
      waypoints: [origin, { lat: 12.9716, lng: 77.5946 }, destination]
    });
  });

  // --- Digital Twin Simulation Engine ---
  app.post("/api/simulate", (req, res) => {
    const { eventType, intensity, location } = req.body;
    
    // This would typically trigger a broadcast or update Firestore
    res.json({
      status: "simulation_active",
      impactRadius: intensity * 5, // km
      affectedShipments: Math.floor(Math.random() * 10) + 1
    });
  });

  // --- Flutter Web Build Middleware ---
  if (process.env.NODE_ENV !== "production") {
    // Keep Vite for preview stability in this environment
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve Flutter Web build output
    const flutterBuildPath = path.join(process.cwd(), "build/web");
    app.use(express.static(flutterBuildPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(flutterBuildPath, "index.html"));
    });
  }

  const server = http.createServer(app);

  // Local-only WebSocket signaling for offline WebRTC meshes.
  // The alerts themselves are relayed peer-to-peer via data channels after pairing.
  const wss = new WebSocketServer({ server, path: "/mesh" });
  const clients = new Map<string, import("ws").WebSocket>();

  const safeSend = (socket: import("ws").WebSocket, payload: unknown) => {
    if (socket.readyState !== socket.OPEN) return;
    socket.send(JSON.stringify(payload));
  };

  const broadcast = (payload: unknown, exceptId?: string) => {
    for (const [id, socket] of clients.entries()) {
      if (exceptId && id === exceptId) continue;
      safeSend(socket, payload);
    }
  };

  wss.on("connection", (socket) => {
    const id = randomUUID();
    clients.set(id, socket);

    safeSend(socket, { type: "welcome", id, peers: Array.from(clients.keys()).filter((peerId) => peerId !== id) });
    broadcast({ type: "peer-join", id }, id);

    socket.on("message", (raw) => {
      let msg: any = null;
      try {
        msg = JSON.parse(String(raw));
      } catch {
        return;
      }

      if (!msg || typeof msg !== "object") return;
      if (msg.type !== "signal") return;
      if (typeof msg.to !== "string" || typeof msg.from !== "string") return;

      const target = clients.get(msg.to);
      if (!target) return;
      safeSend(target, { type: "signal", to: msg.to, from: msg.from, payload: msg.payload ?? null });
    });

    socket.on("close", () => {
      clients.delete(id);
      broadcast({ type: "peer-leave", id }, id);
    });
  });

  // LAN relay fallback for offline demos (no WebRTC required).
  // When devices can reach the local server over hotspot/Wi-Fi but WebRTC is blocked, this path still delivers alerts.
  const relayWss = new WebSocketServer({ server, path: "/mesh-relay" });
  const relayClients = new Map<string, import("ws").WebSocket>();

  const relayBroadcast = (payload: unknown, exceptId?: string) => {
    for (const [id, socket] of relayClients.entries()) {
      if (exceptId && id === exceptId) continue;
      safeSend(socket, payload);
    }
  };

  relayWss.on("connection", (socket) => {
    const id = randomUUID();
    relayClients.set(id, socket);

    safeSend(socket, { type: "relay-welcome", id });

    socket.on("message", (raw) => {
      let msg: any = null;
      try {
        msg = JSON.parse(String(raw));
      } catch {
        return;
      }

      if (!msg || typeof msg !== "object") return;

      // Pass-through mesh wire messages (e.g. {kind:'mesh_alert', alert:{...}})
      if (msg.kind === "mesh_alert" && msg.alert && typeof msg.alert === "object") {
        relayBroadcast(msg, id);
      }
    });

    socket.on("close", () => {
      relayClients.delete(id);
    });
  });

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`SupplyGuard AI Server running on http://localhost:${PORT}`);
  });
}

startServer();
