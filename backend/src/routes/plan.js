import { Router } from "express";
import { query } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { loadOwnedStudent } from "./students.js";
import { loadStudentContext } from "../services/studentPlan.js";
import { generateStudyGuide } from "../services/ai.js";
import { materializeHorizon, ensureMaterialized } from "../services/materializer.js";

const router = Router();
router.use(requireAuth);

function monthsBetween(fromIso, toIso) {
  const a = new Date(`${fromIso}T00:00:00Z`);
  const b = new Date(`${toIso}T00:00:00Z`);
  return Math.max(0, Math.round(((b - a) / (30.44 * 86_400_000)) * 10) / 10);
}
function iso(d) {
  return d.toISOString().slice(0, 10);
}

// POST /api/students/:id/plan/generate
// 1) AI writes the study guide  2) it is persisted  3) the full day-wise plan
// is MATERIALISED into plan_items (subject/topic/resources per day) up to the
// exam window — the calendar then reads those recorded rows.
router.post(
  "/students/:id/plan/generate",
  loadOwnedStudent,
  asyncHandler(async (req, res) => {
    const { plan, calendar, student } = await loadStudentContext(req.student.id);
    const todayIso = new Date().toISOString().slice(0, 10);
    const examStart = calendar.examStart || "2027-05-10";
    const ctx = {
      year_group: student.year_group,
      exam_series: student.exam_series,
      exam_start: examStart,
      exam_end: calendar.examEnd || examStart,
      months_to_exam: monthsBetween(todayIso, examStart),
      subjects: plan.subjects,
    };

    const { generated_by, model, guide } = await generateStudyGuide(ctx);

    await query("UPDATE study_plans SET is_current = FALSE WHERE student_id = $1", [req.student.id]);
    const { rows } = await query(
      `INSERT INTO study_plans (student_id, generated_by, model, guide, meta, is_current)
       VALUES ($1,$2,$3,$4,$5,TRUE)
       RETURNING id, generated_by, model, guide, meta, created_at`,
      [
        req.student.id,
        generated_by,
        model,
        JSON.stringify(guide),
        JSON.stringify({ total_weekly_sessions: plan.totalWeeklySessions, months_to_exam: ctx.months_to_exam }),
      ]
    );
    const saved = rows[0];

    // Record the day-wise plan itself (idempotent; preserves any progress).
    const { days, written } = await materializeHorizon(req.student.id, todayIso, saved.id);

    res.status(201).json({ plan: saved, materialized: { from: todayIso, days, tasks: written } });
  })
);

// GET /api/students/:id/plan/current — the persisted, current study guide.
router.get(
  "/students/:id/plan/current",
  loadOwnedStudent,
  asyncHandler(async (req, res) => {
    const { rows } = await query(
      `SELECT id, generated_by, model, guide, meta, created_at
         FROM study_plans WHERE student_id = $1 AND is_current = TRUE
        ORDER BY created_at DESC LIMIT 1`,
      [req.student.id]
    );
    res.json({ plan: rows[0] || null });
  })
);

// GET /api/students/:id/evaluations?periods=6
// Fortnightly adherence, measured against the RECORDED plan rows.
router.get(
  "/students/:id/evaluations",
  loadOwnedStudent,
  asyncHandler(async (req, res) => {
    const periods = Math.min(parseInt(req.query.periods || "6", 10), 26);
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const results = [];
    for (let i = periods - 1; i >= 0; i--) {
      const startD = new Date(today.getTime() - (i + 1) * 14 * 86_400_000 + 86_400_000);
      const startIso = iso(startD);
      const endIso = await ensureMaterialized(req.student.id, startIso, 14);

      const { rows } = await query(
        `SELECT COUNT(*)::int AS expected,
                COUNT(*) FILTER (WHERE status='completed')::int AS completed,
                COUNT(*) FILTER (WHERE status='in_progress')::int AS in_progress,
                COUNT(*) FILTER (WHERE status='halted')::int AS halted
           FROM plan_items
          WHERE student_id=$1 AND task_date BETWEEN $2 AND $3`,
        [req.student.id, startIso, endIso]
      );
      const t = rows[0];
      const adherence = t.expected ? Math.round((t.completed / t.expected) * 100) : 0;
      const verdict = adherence >= 80 ? "on_track" : adherence >= 50 ? "at_risk" : "off_track";
      const message =
        verdict === "on_track"
          ? "On track — completion is strong. Keep the routine."
          : verdict === "at_risk"
          ? "At risk — tighten the routine and prioritise weak topics."
          : "Off track — rescope the plan and rebuild the daily habit.";

      await query(
        `INSERT INTO plan_evaluations
           (student_id, period_start, period_end, expected, completed, in_progress, halted, adherence_pct, verdict, message)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
         ON CONFLICT (student_id, period_start, period_end) DO UPDATE SET
           expected=EXCLUDED.expected, completed=EXCLUDED.completed,
           in_progress=EXCLUDED.in_progress, halted=EXCLUDED.halted,
           adherence_pct=EXCLUDED.adherence_pct, verdict=EXCLUDED.verdict, message=EXCLUDED.message`,
        [req.student.id, startIso, endIso, t.expected, t.completed, t.in_progress, t.halted, adherence, verdict, message]
      );

      results.push({
        period_start: startIso, period_end: endIso,
        expected: t.expected, completed: t.completed, in_progress: t.in_progress,
        halted: t.halted, adherence_pct: adherence, verdict, message,
      });
    }

    res.json({ evaluations: results, latest: results[results.length - 1] });
  })
);

export default router;
