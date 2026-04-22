import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import http from "http";
import { randomUUID } from "crypto";
import { WebSocketServer } from "ws";
import fs from "fs";
import os from "os";
import { spawn } from "child_process";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // --- Downloads (source bundles) ---
  // Lets users download the three "apps" from the browser in one place.
  // Uses tar.gz generation via system `tar` to avoid adding dependencies.
  const repoRoot = process.cwd();

  type DownloadSpec = { filename: string; include: string[] };
  const downloads: Record<string, DownloadSpec> = {
    all: {
      filename: "SupplyGuardAI-all.tar.gz",
      include: [
        "src",
        "docs",
        "backend",
        "frontend",
        "android-apps",
        "README.md",
        "SOLUTION_CHALLENGE.md",
        "package.json",
        "tsconfig.json",
        "vite.config.ts",
        "server.ts",
        "index.html",
      ],
    },
    "web-console": {
      filename: "SupplyGuardAI-web-console.tar.gz",
      include: ["src", "docs", "README.md", "SOLUTION_CHALLENGE.md", "package.json", "tsconfig.json", "vite.config.ts", "server.ts", "index.html"],
    },
    "flutter-frontend": {
      filename: "SupplyGuardAI-flutter-frontend.tar.gz",
      include: ["frontend"],
    },
    "android-mesh": {
      filename: "SupplyGuardAI-android-mesh.tar.gz",
      include: ["android-apps"],
    },
  };

  const tarExclude = [
    "--exclude=.git",
    "--exclude=node_modules",
    "--exclude=dist",
    "--exclude=build",
    "--exclude=.dart_tool",
    "--exclude=.gradle",
    "--exclude=.idea",
    "--exclude=.vscode",
    "--exclude=Pods",
    "--exclude=DerivedData",
  ];

  const runTar = (outputPath: string, include: string[]) =>
    new Promise<void>((resolve, reject) => {
      const args = ["-czf", outputPath, ...tarExclude, ...include];
      const proc = spawn("tar", args, { cwd: repoRoot });
      let stderr = "";
      proc.stderr.on("data", (chunk) => {
        stderr += String(chunk);
      });
      proc.on("error", reject);
      proc.on("close", (code) => {
        if (code === 0) return resolve();
        reject(new Error(stderr || `tar exited with code ${code}`));
      });
    });

  app.get("/downloads/:id", async (req, res) => {
    const id = String(req.params.id || "");
    const spec = downloads[id];
    if (!spec) {
      return res.status(404).json({ ok: false, error: "unknown_download" });
    }

    const tmpPath = path.join(os.tmpdir(), `${randomUUID()}-${spec.filename}`);
    try {
      await runTar(tmpPath, spec.include);
      res.setHeader("Cache-Control", "no-store");
      return res.download(tmpPath, spec.filename, () => {
        try {
          fs.unlinkSync(tmpPath);
        } catch {
          // ignore cleanup failure
        }
      });
    } catch (err) {
      try {
        if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
      } catch {
        // ignore cleanup failure
      }
      return res.status(500).json({ ok: false, error: "download_failed", message: err instanceof Error ? err.message : String(err) });
    }
  });

  // --- APK downloads (Android) ---
  // Serves prebuilt debug APKs from android-apps/* so users can download directly from the main page.
  const apkDownloads: Record<string, { filename: string; path: string }> = {
    "command-center": {
      filename: "SupplyGuardAI-command-center-debug.apk",
      path: path.join(repoRoot, "android-apps/command-center/build/outputs/apk/debug/command-center-debug.apk"),
    },
    rescue: {
      filename: "SupplyGuardAI-rescue-debug.apk",
      path: path.join(repoRoot, "android-apps/rescue/build/outputs/apk/debug/rescue-debug.apk"),
    },
    victim: {
      filename: "SupplyGuardAI-victim-debug.apk",
      path: path.join(repoRoot, "android-apps/victim/build/outputs/apk/debug/victim-debug.apk"),
    },
  };

  app.get("/downloads/apk/:id", (req, res) => {
    const id = String(req.params.id || "");
    const spec = apkDownloads[id];
    if (!spec) {
      return res.status(404).json({ ok: false, error: "unknown_apk" });
    }
    if (!fs.existsSync(spec.path)) {
      return res.status(404).json({ ok: false, error: "apk_missing", hint: "Build APKs under android-apps/*/build/outputs/apk/..." });
    }

    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Content-Type", "application/vnd.android.package-archive");
    return res.download(spec.path, spec.filename);
  });

  app.get("/downloads/apk-all", async (_req, res) => {
    const specs = Object.values(apkDownloads);
    const missing = specs.filter((spec) => !fs.existsSync(spec.path));
    if (missing.length) {
      return res.status(404).json({
        ok: false,
        error: "apk_missing",
        hint: "Build APKs under android-apps/*/build/outputs/apk/debug/...",
      });
    }

    const tmpPath = path.join(os.tmpdir(), `${randomUUID()}-SupplyGuardAI-apks.zip`);
    try {
      const proc = spawn(
        "zip",
        ["-j", tmpPath, ...specs.map((spec) => spec.path)],
        { cwd: repoRoot },
      );
      let stderr = "";
      proc.stderr.on("data", (chunk) => {
        stderr += String(chunk);
      });
      await new Promise<void>((resolve, reject) => {
        proc.on("error", reject);
        proc.on("close", (code) => {
          if (code === 0) return resolve();
          reject(new Error(stderr || `zip exited with code ${code}`));
        });
      });

      res.setHeader("Cache-Control", "no-store");
      return res.download(tmpPath, "SupplyGuardAI-apks.zip", () => {
        try {
          fs.unlinkSync(tmpPath);
        } catch {
          // ignore cleanup failure
        }
      });
    } catch (err) {
      try {
        if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
      } catch {
        // ignore cleanup failure
      }
      return res.status(500).json({
        ok: false,
        error: "apk_bundle_failed",
        message: err instanceof Error ? err.message : String(err),
      });
    }
  });

  const listZipEntries = (zipPath: string) =>
    new Promise<string[]>((resolve, reject) => {
      const proc = spawn("unzip", ["-Z1", zipPath], { cwd: repoRoot });
      let stdout = "";
      let stderr = "";
      proc.stdout.on("data", (chunk) => {
        stdout += String(chunk);
      });
      proc.stderr.on("data", (chunk) => {
        stderr += String(chunk);
      });
      proc.on("error", reject);
      proc.on("close", (code) => {
        if (code !== 0) return reject(new Error(stderr || `unzip exited with code ${code}`));
        resolve(stdout.split("\n").map((line) => line.trim()).filter(Boolean));
      });
    });

  const pickLauncherPng = (entries: string[]) => {
    const candidates = entries.filter((entry) => /(^|\/)ic_launcher(_round)?\.png$/i.test(entry) && entry.startsWith("res/mipmap"));
    const priority = ["xxxhdpi", "xxhdpi", "xhdpi", "hdpi", "mdpi"];
    for (const density of priority) {
      const match = candidates.find((entry) => entry.includes(`mipmap-${density}`));
      if (match) return match;
      const v4match = candidates.find((entry) => entry.includes(`mipmap-${density}-v4`));
      if (v4match) return v4match;
    }
    return candidates[0] ?? null;
  };

  app.get("/downloads/apk/:id/icon", async (req, res) => {
    const id = String(req.params.id || "");
    const spec = apkDownloads[id];
    if (!spec) {
      return res.status(404).json({ ok: false, error: "unknown_apk" });
    }
    if (!fs.existsSync(spec.path)) {
      return res.status(404).json({ ok: false, error: "apk_missing" });
    }

    try {
      const entries = await listZipEntries(spec.path);
      const iconEntry = pickLauncherPng(entries);
      if (!iconEntry) {
        return res.status(404).json({ ok: false, error: "icon_missing" });
      }

      res.setHeader("Cache-Control", "no-store");
      res.setHeader("Content-Type", "image/png");

      const proc = spawn("unzip", ["-p", spec.path, iconEntry], { cwd: repoRoot });
      proc.on("error", () => {
        if (!res.headersSent) res.status(500);
        res.end();
      });
      proc.stdout.pipe(res);
      proc.stderr.on("data", () => {
        // ignore
      });
      proc.on("close", (code) => {
        if (code !== 0) {
          if (!res.headersSent) res.status(500);
          res.end();
        }
      });
    } catch (err) {
      return res.status(500).json({ ok: false, error: "icon_extract_failed", message: err instanceof Error ? err.message : String(err) });
    }
  });

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
    // Prefer serving the React + Vite build output (dist/) in production.
    // Keep Flutter build accessible under /flutter when present.
    const distPath = path.join(process.cwd(), "dist");
    const distIndex = path.join(distPath, "index.html");

    const flutterBuildPath = path.join(process.cwd(), "build/web");
    const flutterIndex = path.join(flutterBuildPath, "index.html");

    const hasDist = fs.existsSync(distIndex);
    const hasFlutter = fs.existsSync(flutterIndex);

    if (hasFlutter) {
      app.use("/flutter", express.static(flutterBuildPath));
    }

    if (hasDist) {
      app.use(express.static(distPath));
      app.get(/^(?!\/(api|mesh|mesh-relay|downloads)(\/|$)).*/, (req, res) => {
        res.sendFile(distIndex);
      });
    } else if (hasFlutter) {
      // Fallback: Serve Flutter Web build output
      app.use(express.static(flutterBuildPath));
      app.get(/^(?!\/(api|mesh|mesh-relay|downloads)(\/|$)).*/, (req, res) => {
        res.sendFile(flutterIndex);
      });
    }
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
  // When devices can reach the local server over hotspot/Wi-Fi but WebRTC is blocked,
  // this path still delivers alerts. Implemented as SSE + HTTP POST for maximum browser reliability.
  const relaySseClients = new Map<string, import("express").Response>();

  const relaySseSend = (res: import("express").Response, payload: unknown) => {
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
  };

  const relaySseBroadcast = (payload: unknown, exceptId?: string) => {
    for (const [id, res] of relaySseClients.entries()) {
      if (exceptId && id === exceptId) continue;
      relaySseSend(res, payload);
    }
  };

  app.get("/mesh-relay/events", (req, res) => {
    res.status(200);
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    // Helps in local reverse-proxy situations
    res.setHeader("X-Accel-Buffering", "no");

    const id = randomUUID();
    relaySseClients.set(id, res);

    relaySseSend(res, { type: "relay-welcome", id });
    const heartbeat = setInterval(() => {
      // keep connection alive
      res.write(`: ping ${Date.now()}\n\n`);
    }, 15_000);

    req.on("close", () => {
      clearInterval(heartbeat);
      relaySseClients.delete(id);
    });
  });

  app.post("/mesh-relay/publish", (req, res) => {
    const msg = req.body;
    const senderId = typeof req.query.sender === "string" ? req.query.sender : undefined;

    // Pass-through mesh wire messages (e.g. {kind:'mesh_alert', alert:{...}})
    if (msg?.kind === "mesh_alert" && msg.alert && typeof msg.alert === "object") {
      relaySseBroadcast(msg, senderId);
      return res.json({ ok: true });
    }

    return res.status(400).json({ ok: false, error: "invalid_payload" });
  });

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`SupplyGuard AI Server running on http://localhost:${PORT}`);
  });
}

startServer();
