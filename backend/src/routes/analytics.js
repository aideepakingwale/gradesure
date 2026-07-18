import { Router } from "express";
import { query } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { loadOwnedStudent } from "./students.js";
import { ensureMaterialized } from "../services/materializer.js";

const router = Router();
router.use(requireAuth);

// GET /api/students/:id/analytics?start=YYYY-MM-DD&days=60
// Parent/admin only. Reads the RECORDED plan (plan_items).
router.get(
  "/students/:id/analytics",
  requireRole("parent", "admin"),
  loadOwnedStudent,
  asyncHandler(async (req, res) => {
    const days = Math.min(parseInt(req.query.days || "60", 10), 180);
    const today = new Date();
    const start =
      req.query.start?.slice(0, 10) ||
      new Date(today.getTime() - Math.floor(days / 2) * 86_400_000)
        .toISOString()
        .slice(0, 10);

    const end = await ensureMaterialized(req.student.id, start, days);

    const [summaryQ, subjectsQ, dailyQ] = await Promise.all([
      query(
        `SELECT COUNT(*)::int AS total,
                COUNT(*) FILTER (WHERE status='completed')::int AS completed,
                COUNT(*) FILTER (WHERE status='in_progress')::int AS in_progress,
                COUNT(*) FILTER (WHERE status='halted')::int AS halted,
                COALESCE(SUM(minutes_spent),0)::int AS minutes
           FROM plan_items
          WHERE student_id=$1 AND task_date BETWEEN $2 AND $3`,
        [req.student.id, start, end]
      ),
      query(
        `SELECT subject_key, MAX(subject_name) AS subject_name,
                COUNT(*)::int AS total,
                COUNT(*) FILTER (WHERE status='completed')::int AS completed,
                COALESCE(SUM(minutes_spent),0)::int AS minutes
           FROM plan_items
          WHERE student_id=$1 AND task_date BETWEEN $2 AND $3
          GROUP BY subject_key ORDER BY MAX(subject_name)`,
        [req.student.id, start, end]
      ),
      query(
        `SELECT to_char(task_date,'YYYY-MM-DD') AS date,
                COUNT(*)::int AS total,
                COUNT(*) FILTER (WHERE status='completed')::int AS completed
           FROM plan_items
          WHERE student_id=$1 AND task_date BETWEEN $2 AND $3
          GROUP BY task_date ORDER BY task_date`,
        [req.student.id, start, end]
      ),
    ]);

    const s = summaryQ.rows[0];
    res.json({
      window: { start, end, days },
      summary: {
        total_tasks: s.total,
        completed: s.completed,
        in_progress: s.in_progress,
        halted: s.halted,
        not_started: s.total - s.completed - s.in_progress - s.halted,
        completion_pct: s.total ? Math.round((s.completed / s.total) * 100) : 0,
        total_minutes: s.minutes,
        total_hours: Math.round((s.minutes / 60) * 10) / 10,
      },
      per_subject: subjectsQ.rows.map((r) => ({
        ...r,
        completion_pct: r.total ? Math.round((r.completed / r.total) * 100) : 0,
      })),
      daily: dailyQ.rows,
    });
  })
);

export default router;
