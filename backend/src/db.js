import pkg from "pg";
import { config } from "./config.js";

const { Pool } = pkg;

// Managed Postgres (Neon, Supabase, Render, etc.) requires TLS. Enable it when
// the URL asks for SSL, when a hosted host is detected, or when PGSSL=true.
const url = config.databaseUrl;
const needsSsl =
  /sslmode=require/i.test(url) ||
  /neon\.tech|supabase\.co|render\.com|amazonaws\.com/i.test(url) ||
  process.env.PGSSL === "true";

// A single shared connection pool (Data Access foundation).
export const pool = new Pool({
  connectionString: url,
  max: 10,
  idleTimeoutMillis: 30_000,
  ssl: needsSsl ? { rejectUnauthorized: false } : false,
});

pool.on("error", (err) => {
  console.error("[db] Unexpected idle client error", err);
});

export const query = (text, params) => pool.query(text, params);

// Wait for the database to accept connections (used on boot).
export async function waitForDb(retries = 15, delayMs = 2000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await pool.query("SELECT 1");
      console.log("[db] Connected.");
      return;
    } catch (err) {
      console.log(
        `[db] Not ready (attempt ${attempt}/${retries}): ${err.code || err.message}`
      );
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  throw new Error("[db] Could not connect after multiple attempts.");
}
