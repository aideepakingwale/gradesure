// ===========================================================================
// Materializer — records the personalised day-wise plan into plan_items.
//
// The scheduler/personalization engine COMPUTES each day's tasks; this module
// WRITES them to the database with full lesson detail (subject, topic, hint,
// time block, activity, priority and the topic's resource links). From then on
// the calendar reads the recorded rows, and status updates land on them.
//
// Upserts are conflict-safe on (student_id, task_date, subject_key, topic_slug)
// and NEVER overwrite student state (status / minutes_spent / note).
// ===========================================================================
import { query } from "../db.js";
import { generateRange } from "./scheduler.js";
import { loadStudentContext } from "./studentPlan.js";
import { loadReferenceMap, resolveTaskResources } from "./referenceStore.js";

const CHUNK = 120; // rows per INSERT statement

/**
 * Generate and record the plan for [startIso, startIso + days) for a student.
 * Existing rows are refreshed (topic/time/resources) but student progress
 * (status, minutes, note) is preserved. Returns the number of rows written.
 */
export async function materializeWindow(studentId, startIso, days, planId = null) {
  const { plan, calendar } = await loadStudentContext(studentId);
  const generated = generateRange(startIso, days, plan, calendar);

  // Load the admin-managed reference library once for this student's subjects.
  const subjectKeys = [...new Set(generated.flatMap((d) => d.tasks.map((t) => t.subject_key)))];
  const refMap = await loadReferenceMap(subjectKeys);

  const rows = [];
  for (const day of generated) {
    for (const t of day.tasks) {
      rows.push([
        studentId, planId, day.date, day.day_type, day.phase?.name || null, day.mode || null,
        t.subject_key, t.subject_name, t.board || null,
        t.topic_slug, t.topic_title, t.hint || null,
        t.activity || "study", t.time_block || null, t.priority || null,
        JSON.stringify(resolveTaskResources(refMap, t.subject_key, t.topic_slug, t.subject_name, t.topic_title)),
      ]);
    }
  }

  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK);
    const params = [];
    const values = chunk
      .map((r, j) => {
        const b = j * 16;
        params.push(...r);
        return `($${b + 1},$${b + 2},$${b + 3},$${b + 4},$${b + 5},$${b + 6},$${b + 7},$${b + 8},$${b + 9},$${b + 10},$${b + 11},$${b + 12},$${b + 13},$${b + 14},$${b + 15},$${b + 16}::jsonb)`;
      })
      .join(",");
    await query(
      `INSERT INTO plan_items
         (student_id, plan_id, task_date, day_type, phase, mode,
          subject_key, subject_name, exam_board,
          topic_slug, topic_title, hint,
          activity, time_block, priority, resources)
       VALUES ${values}
       ON CONFLICT (student_id, task_date, subject_key, topic_slug) DO UPDATE SET
         plan_id     = COALESCE(EXCLUDED.plan_id, plan_items.plan_id),
         day_type    = EXCLUDED.day_type,
         phase       = EXCLUDED.phase,
         mode        = EXCLUDED.mode,
         subject_name= EXCLUDED.subject_name,
         exam_board  = EXCLUDED.exam_board,
         topic_title = EXCLUDED.topic_title,
         hint        = EXCLUDED.hint,
         activity    = EXCLUDED.activity,
         time_block  = EXCLUDED.time_block,
         priority    = EXCLUDED.priority,
         resources   = EXCLUDED.resources`,
      params
    );
  }

  // Reconcile: remove rows in this window that the CURRENT schedule no longer
  // contains (stale leftovers from earlier weightings/term dates). Rows the
  // student acted on (status <> not_started) are kept as history.
  const endIso = addDaysIso(startIso, days - 1);
  const gDates = [];
  const gSubjects = [];
  const gSlugs = [];
  rows.forEach((r) => {
    gDates.push(r[2]);
    gSubjects.push(r[6]);
    gSlugs.push(r[9]);
  });
  await query(
    `DELETE FROM plan_items pi
      WHERE pi.student_id = $1
        AND pi.task_date BETWEEN $2 AND $3
        AND pi.status = 'not_started'
        AND NOT EXISTS (
          SELECT 1
            FROM unnest($4::date[], $5::text[], $6::text[]) AS g(d, s, t)
           WHERE g.d = pi.task_date AND g.s = pi.subject_key AND g.t = pi.topic_slug
        )`,
    [studentId, startIso, endIso, gDates, gSubjects, gSlugs]
  );

  // One-time-safe legacy merge: carry statuses saved in the old task_progress
  // table onto the recorded rows (only where the recorded row is untouched).
  await query(
    `UPDATE plan_items pi
        SET status = tp.status, minutes_spent = tp.minutes_spent, note = tp.note
       FROM task_progress tp
      WHERE tp.student_id = pi.student_id
        AND tp.task_date = pi.task_date
        AND tp.subject_key = pi.subject_key
        AND tp.topic_slug = pi.topic_slug
        AND pi.status = 'not_started'
        AND tp.status <> 'not_started'
        AND pi.student_id = $1`,
    [studentId]
  );

  return rows.length;
}

/**
 * Ensure every date in [startIso, startIso + days) has recorded rows;
 * materialize the window if any date is missing. Self-healing read path.
 */
export async function ensureMaterialized(studentId, startIso, days) {
  const end = addDaysIso(startIso, days - 1);
  const { rows } = await query(
    `SELECT COUNT(DISTINCT task_date)::int AS have
       FROM plan_items
      WHERE student_id = $1 AND task_date BETWEEN $2 AND $3`,
    [studentId, startIso, end]
  );
  if (rows[0].have < days) {
    await materializeWindow(studentId, startIso, days);
  }
  return end;
}

/**
 * Full-horizon materialization used when an AI plan is generated:
 * from `fromIso` through the student's exam end (min 60, max 420 days).
 */
export async function materializeHorizon(studentId, fromIso, planId) {
  const { calendar } = await loadStudentContext(studentId);
  const endIso = calendar.examEnd || calendar.examStart || addDaysIso(fromIso, 180);
  const days = Math.min(Math.max(diffDays(fromIso, endIso) + 1, 60), 420);
  const written = await materializeWindow(studentId, fromIso, days, planId);
  return { days, written };
}

function addDaysIso(iso, n) {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
function diffDays(a, b) {
  return Math.round((new Date(`${b}T00:00:00Z`) - new Date(`${a}T00:00:00Z`)) / 86_400_000);
}
