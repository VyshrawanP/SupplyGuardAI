import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`SupplyGuard AI Server running on http://localhost:${PORT}`);
  });
}

startServer();
