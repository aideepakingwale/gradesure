import { Router } from "express";
import { z } from "zod";
import { query } from "../db.js";
import { validate } from "../middleware/validate.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { SUBJECT_META } from "../data/curriculum.js";
import { CATALOG_BY_KEY, BOARDS, TIER_GRADES } from "../data/subjectCatalog.js";
import { materializeHorizon } from "../services/materializer.js";

// Refresh the FULL recorded future plan after profile/subject changes —
// horizon-wide so no stale rows survive beyond a partial window (statuses kept).
async function rematerializeFuture(studentId) {
  const today = new Date().toISOString().slice(0, 10);
  await materializeHorizon(studentId, today);
}

const router = Router();
router.use(requireAuth);

// Ownership guard: a parent may only touch their own students. Admins see all.
async function loadOwnedStudent(req, res, next) {
  const { id } = req.params;
  const { rows } = await query("SELECT * FROM students WHERE id = $1", [id]);
  const student = rows[0];
  if (!student) return res.status(404).json({ error: "Student not found." });
  if (req.user.role !== "admin" && student.parent_id !== req.user.sub) {
    return res.status(403).json({ error: "You do not have access to this student." });
  }
  req.student = student;
  next();
}

const studentSchema = z.object({
  full_name: z.string().min(2).max(120),
  school: z.string().max(160).optional(),
  year_group: z.number().int().min(7).max(13).optional(),
  exam_series: z.string().max(60).optional(),
  exam_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  exam_end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  term_dates: z
    .array(z.object({ name: z.string().max(60), start: z.string(), end: z.string() }))
    .max(6)
    .optional(),
  holidays: z
    .array(z.object({ name: z.string().max(60), start: z.string(), end: z.string() }))
    .max(12)
    .optional(),
});

const gradeRe = /^[1-9]$/;
const subjectSchema = z.object({
  subject_key: z.string().min(2).max(60),
  subject_name: z.string().min(2).max(120).optional(),
  exam_board: z.string().min(1).max(60),
  tier: z.enum(["Foundation", "Higher"]).nullable().optional(),
  current_grade: z.string().regex(gradeRe, "Grade must be 1–9").nullable().optional(),
  target_grade: z.string().regex(gradeRe, "Grade must be 1–9").default("9"),
});

// UK GCSE rules: tier only exists for tiered subjects (Maths, Sciences, MFL,
// Statistics); Foundation papers cannot award above grade 5.
function validateGcseRules(b) {
  const cat = CATALOG_BY_KEY[b.subject_key];
  if (!BOARDS.includes(b.exam_board)) {
    return `Unknown exam board "${b.exam_board}". Choose one of: ${BOARDS.join(", ")}.`;
  }
  if (cat && !cat.tiered && b.tier) {
    return `${cat.name} is not a tiered GCSE — a single paper covers grades 1–9. Remove the tier.`;
  }
  if (cat?.tiered && b.tier && b.current_grade && !TIER_GRADES[b.tier].includes(b.current_grade)) {
    return b.tier === "Foundation"
      ? `Foundation tier awards grades 1–5 only — a current grade of ${b.current_grade} is not possible on Foundation.`
      : `Higher tier awards grades 3–9 — a current grade of ${b.current_grade} is not possible on Higher.`;
  }
  return null;
}

// GET /api/students — list caller's students (admins: all)
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const sql =
      req.user.role === "admin"
        ? "SELECT * FROM students ORDER BY created_at DESC"
        : "SELECT * FROM students WHERE parent_id = $1 ORDER BY created_at DESC";
    const params = req.user.role === "admin" ? [] : [req.user.sub];
    const { rows } = await query(sql, params);
    res.json({ students: rows });
  })
);

// POST /api/students
router.post(
  "/",
  validate(studentSchema),
  asyncHandler(async (req, res) => {
    const b = req.body;
    const { rows } = await query(
      `INSERT INTO students
         (parent_id, full_name, school, year_group, exam_series, exam_start, exam_end, term_dates, holidays)
       VALUES ($1, $2, COALESCE($3,'Lampton School'), COALESCE($4,11), COALESCE($5,'May/June 2027'),
               $6, $7, COALESCE($8,'[]'::jsonb), COALESCE($9,'[]'::jsonb))
       RETURNING *`,
      [
        req.user.sub, b.full_name, b.school, b.year_group, b.exam_series,
        b.exam_start ?? null, b.exam_end ?? null,
        b.term_dates ? JSON.stringify(b.term_dates) : null,
        b.holidays ? JSON.stringify(b.holidays) : null,
      ]
    );
    res.status(201).json({ student: rows[0] });
  })
);

// GET /api/students/:id — with subjects
router.get(
  "/:id",
  loadOwnedStudent,
  asyncHandler(async (req, res) => {
    const { rows } = await query(
      "SELECT * FROM student_subjects WHERE student_id = $1 ORDER BY subject_name",
      [req.student.id]
    );
    res.json({ student: req.student, subjects: rows });
  })
);

// PATCH /api/students/:id
router.patch(
  "/:id",
  loadOwnedStudent,
  validate(studentSchema.partial()),
  asyncHandler(async (req, res) => {
    const fields = ["full_name", "school", "year_group", "exam_series", "exam_start", "exam_end"];
    const jsonFields = ["term_dates", "holidays"];
    const set = [];
    const vals = [];
    fields.forEach((f) => {
      if (req.body[f] !== undefined) {
        vals.push(req.body[f]);
        set.push(`${f} = $${vals.length}`);
      }
    });
    jsonFields.forEach((f) => {
      if (req.body[f] !== undefined) {
        vals.push(JSON.stringify(req.body[f]));
        set.push(`${f} = $${vals.length}::jsonb`);
      }
    });
    if (set.length === 0) return res.json({ student: req.student });
    vals.push(req.student.id);
    const { rows } = await query(
      `UPDATE students SET ${set.join(", ")} WHERE id = $${vals.length} RETURNING *`,
      vals
    );
    // Term dates / exam window changed → refresh the recorded schedule.
    if (["term_dates", "holidays", "exam_start", "exam_end"].some((f) => req.body[f] !== undefined)) {
      await rematerializeFuture(req.student.id);
    }
    res.json({ student: rows[0] });
  })
);

// DELETE /api/students/:id
router.delete(
  "/:id",
  loadOwnedStudent,
  asyncHandler(async (req, res) => {
    await query("DELETE FROM students WHERE id = $1", [req.student.id]);
    res.json({ ok: true });
  })
);

// PUT /api/students/:id/subjects — upsert a subject enrolment
router.put(
  "/:id/subjects",
  loadOwnedStudent,
  validate(subjectSchema),
  asyncHandler(async (req, res) => {
    const b = req.body;
    const ruleError = validateGcseRules(b);
    if (ruleError) return res.status(400).json({ error: ruleError });
    const cat = CATALOG_BY_KEY[b.subject_key];
    if (cat && !cat.tiered) b.tier = null; // belt & braces: untiered stays untiered
    const name = b.subject_name || cat?.name || SUBJECT_META[b.subject_key]?.name || b.subject_key;
    const { rows } = await query(
      `INSERT INTO student_subjects
         (student_id, subject_key, subject_name, exam_board, tier, current_grade, target_grade)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       ON CONFLICT (student_id, subject_key) DO UPDATE SET
         subject_name = EXCLUDED.subject_name,
         exam_board   = EXCLUDED.exam_board,
         tier         = EXCLUDED.tier,
         current_grade= EXCLUDED.current_grade,
         target_grade = EXCLUDED.target_grade
       RETURNING *`,
      [req.student.id, b.subject_key, name, b.exam_board, b.tier ?? null, b.current_grade ?? null, b.target_grade]
    );
    // Grades/tier changed → the weighting changed → refresh the recorded schedule.
    await rematerializeFuture(req.student.id);
    res.json({ subject: rows[0] });
  })
);

// DELETE /api/students/:id/subjects/:subjectKey
router.delete(
  "/:id/subjects/:subjectKey",
  loadOwnedStudent,
  asyncHandler(async (req, res) => {
    await query(
      "DELETE FROM student_subjects WHERE student_id = $1 AND subject_key = $2",
      [req.student.id, req.params.subjectKey]
    );
    // Dropping a subject reshapes the week — refresh the recorded schedule.
    await rematerializeFuture(req.student.id);
    res.json({ ok: true });
  })
);

export default router;
export { loadOwnedStudent };
