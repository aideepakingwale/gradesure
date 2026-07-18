import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

import { config } from "./config.js";
import { waitForDb } from "./db.js";
import { runMigrations } from "./migrate.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";

import authRoutes from "./routes/auth.js";
import studentRoutes from "./routes/students.js";
import taskRoutes from "./routes/tasks.js";
import planRoutes from "./routes/plan.js";
import analyticsRoutes from "./routes/analytics.js";
import resourceRoutes from "./routes/resources.js";
import catalogRoutes from "./routes/catalog.js";
import adminRoutes from "./routes/admin.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();

// Helmet with CSP relaxed enough to serve our own static SPA in single-container mode.
app.use(helmet({ contentSecurityPolicy: false }));
app.use(
  cors({
    origin: config.corsOrigin === "*" ? true : config.corsOrigin.split(","),
    credentials: false,
  })
);
app.use(express.json({ limit: "256kb" }));
app.use(morgan(config.env === "production" ? "combined" : "dev"));

// Basic rate limiting on auth to slow credential stuffing.
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });

app.get("/api/health", (req, res) =>
  res.json({ status: "ok", service: "eduenterprise-api", time: new Date().toISOString() })
);

app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/students", studentRoutes);
app.use("/api", taskRoutes); // /api/students/:id/plan, /progress
app.use("/api", planRoutes); // /api/students/:id/plan/generate|current, /evaluations
app.use("/api", analyticsRoutes); // /api/students/:id/analytics
app.use("/api/resources", resourceRoutes);
app.use("/api/catalog", catalogRoutes);
app.use("/api/admin", adminRoutes);

// --- Single-container mode: serve the built SPA if it was bundled in ---------
// The root Dockerfile copies the frontend build into ./public. When present,
// the API serves the app from the same origin (no CORS, one service in cloud).
const publicDir = resolve(process.env.PUBLIC_DIR || join(__dirname, "..", "public"));
const servingStatic = existsSync(join(publicDir, "index.html"));
if (servingStatic) {
  app.use(express.static(publicDir));
  // SPA fallback: any non-API GET returns index.html for client-side routing.
  app.get(/^\/(?!api\/).*/, (req, res) => {
    res.sendFile(join(publicDir, "index.html"));
  });
  console.log(`[api] Serving SPA from ${publicDir}`);
}

app.use(notFound);
app.use(errorHandler);

async function start() {
  await waitForDb();
  await runMigrations();
  app.listen(config.port, () => {
    console.log(`[api] EduEnterprise API listening on :${config.port} (${config.env})`);
  });
}

start().catch((err) => {
  console.error("[api] Fatal startup error:", err);
  process.exit(1);
});
