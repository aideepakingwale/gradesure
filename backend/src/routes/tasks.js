import { Router } from "express";
import { z } from "zod";
import { query } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { loadOwnedStudent } from "./students.js";
import { loadStudentContext } from "../services/studentPlan.js";
import { ensureMaterialized, materializeWindow } from "../services/materializer.js";

const router = Router();
router.use(requireAuth);

const ITEM_COLS = `to_char(task_date,'YYYY-MM-DD') AS task_date, day_type, phase, mode,
  subject_key, subject_name, exam_board AS board, topic_slug, topic_title, hint,
  activity, time_block, priority, resources, status, minutes_spent, note`;

// Group recorded rows into the calendar's day objects.
function groupByDay(rows, startIso, days) {
  const byDate = new Map();
  rows.forEach((r) => {
    if (!byDate.has(r.task_date)) {
      byDate.set(r.task_date, {
        date: r.task_date,
        day_type: r.day_type,
        is_school_day: r.day_type === "school_day",
        phase: { name: r.phase },
        mode: r.mode,
        tasks: [],
      });
    }
    byDate.get(r.task_date).tasks.push({
      subject_key: r.subject_key,
      subject_name: r.subject_name,
      board: r.board,
      topic_slug: r.topic_slug,
      topic_title: r.topic_title,
      hint: r.hint,
      activity: r.activity,
      time_block: r.time_block,
      priority: r.priority,
      resources: r.resources || [],
      status: r.status,
      minutes_spent: r.minutes_spent,
      note: r.note,
    });
  });
  // Return in date order, including any (unexpected) empty dates as rest days.
  const out = [];
  for (let i = 0; i < days; i++) {
    const d = addDaysIso(startIso, i);
    out.push(byDate.get(d) || { date: d, day_type: "rest", is_school_day: false, phase: { name: null }, mode: null, tasks: [] });
  }
  return out;
}

function addDaysIso(iso, n) {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

// GET /api/students/:id/plan?start=YYYY-MM-DD&days=30
// Reads the RECORDED plan (plan_items); self-materializes missing dates.
router.get(
  "/students/:id/plan",
  loadOwnedStudent,
  asyncHandler(async (req, res) => {
    const days = Math.min(parseInt(req.query.days || "30", 10), 120);
    const start = (req.query.start || new Date().toISOString().slice(0, 10)).slice(0, 10);
    const end = await ensureMaterialized(req.student.id, start, days);
    const { rows } = await query(
      `SELECT ${ITEM_COLS} FROM plan_items
        WHERE student_id = $1 AND task_date BETWEEN $2 AND $3
        ORDER BY task_date, time_block NULLS LAST, subject_key`,
      [req.student.id, start, end]
    );
    res.json({ start, days, plan: groupByDay(rows, start, days) });
  })
);

// GET /api/students/:id/plan/day/:date
router.get(
  "/students/:id/plan/day/:date",
  loadOwnedStudent,
  asyncHandler(async (req, res) => {
    const date = req.params.date.slice(0, 10);
    await ensureMaterialized(req.student.id, date, 1);
    const { rows } = await query(
      `SELECT ${ITEM_COLS} FROM plan_items
        WHERE student_id = $1 AND task_date = $2
        ORDER BY time_block NULLS LAST, subject_key`,
      [req.student.id, date]
    );
    res.json({ day: groupByDay(rows, date, 1)[0] });
  })
);

const progressSchema = z.object({
  task_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  subject_key: z.string().min(1),
  topic_slug: z.string().min(1),
  status: z.enum(["not_started", "in_progress", "completed", "halted"]),
  minutes_spent: z.number().int().min(0).max(1000).optional(),
  note: z.string().max(1000).nullable().optional(),
});

// PUT /api/students/:id/progress — update the recorded task's state.
router.put(
  "/students/:id/progress",
  loadOwnedStudent,
  validate(progressSchema),
  asyncHandler(async (req, res) => {
    const b = req.body;
    const update = () =>
      query(
        `UPDATE plan_items
            SET status = $5, minutes_spent = $6, note = $7
          WHERE student_id = $1 AND task_date = $2 AND subject_key = $3 AND topic_slug = $4
          RETURNING to_char(task_date,'YYYY-MM-DD') AS task_date, subject_key, topic_slug,
                    status, minutes_spent, note`,
        [req.student.id, b.task_date, b.subject_key, b.topic_slug, b.status, b.minutes_spent ?? 0, b.note ?? null]
      );

    let { rows } = await update();
    if (rows.length === 0) {
      // Date not recorded yet (beyond horizon) — materialize it, then update.
      await materializeWindow(req.student.id, b.task_date, 1);
      ({ rows } = await update());
    }
    if (rows.length === 0) {
      return res.status(404).json({ error: "No such task on that date." });
    }
    res.json({ progress: rows[0] });
  })
);

// GET /api/students/:id/plan/profile — personalisation summary.
router.get(
  "/students/:id/plan/profile",
  loadOwnedStudent,
  asyncHandler(async (req, res) => {
    const { plan } = await loadStudentContext(req.student.id);
    res.json({
      total_weekly_sessions: plan.totalWeeklySessions,
      subjects: plan.subjects,
    });
  })
);

export default router;
