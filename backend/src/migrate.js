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

    // Give the demo student a valid calendar for the NEXT exam series (any year).
    const { defaultCalendarForYearGroup } = await import("./services/academicYear.js");
    const { rows: demo } = await client.query(
      "SELECT id, year_group FROM students WHERE id = '00000000-0000-0000-0000-0000000000a1' AND (term_dates = '[]'::jsonb OR exam_start IS NULL)"
    );
    if (demo[0]) {
      const cal = defaultCalendarForYearGroup(demo[0].year_group);
      await client.query(
        `UPDATE students SET exam_series=$1, exam_start=$2, exam_end=$3, term_dates=$4, holidays=$5
          WHERE id = $6`,
        [cal.exam_series, cal.exam_start, cal.exam_end,
         JSON.stringify(cal.term_dates), JSON.stringify(cal.holidays),
         demo[0].id]
      );
      console.log(`[migrate] Demo student calendar set to ${cal.exam_series}.`);
    }
  } catch (err) {
    console.error("[migrate] Failed to apply schema:", err.message);
    throw err;
  } finally {
    client.release();
  }
}
