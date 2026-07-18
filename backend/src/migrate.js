import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { pool } from "./db.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Apply the idempotent schema on boot. This makes local and cloud identical:
// the app owns its schema, so a fresh managed Postgres needs no manual setup.
export async function runMigrations() {
  const sql = await readFile(join(__dirname, "schema.sql"), "utf8");
  const client = await pool.connect();
  try {
    await client.query(sql);
    // Enum values must be added OUTSIDE a transaction block; run standalone.
    // (No-op on fresh DBs where 'halted' is already in the CREATE TYPE.)
    await client.query("ALTER TYPE task_status ADD VALUE IF NOT EXISTS 'halted'");
    console.log("[migrate] Schema applied (idempotent).");
    // Populate the master reference library on first boot.
    const { seedReferencesIfEmpty } = await import("./services/referenceStore.js");
    await seedReferencesIfEmpty();
  } catch (err) {
    console.error("[migrate] Failed to apply schema:", err.message);
    throw err;
  } finally {
    client.release();
  }
}
