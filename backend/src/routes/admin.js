import { Router } from "express";
import { z } from "zod";
import { query } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { CURRICULUM, SUBJECT_META } from "../data/curriculum.js";
import { SUBJECT_CATALOG } from "../data/subjectCatalog.js";
import { materializeWindow } from "../services/materializer.js";

const router = Router();
router.use(requireAuth, requireRole("admin"));

// GET /api/admin/references/overview — subjects + topics tree with counts.
router.get(
  "/references/overview",
  asyncHandler(async (req, res) => {
    const { rows } = await query(
      `SELECT subject_key, COALESCE(topic_slug,'') AS topic_slug, COUNT(*)::int AS n,
              COUNT(*) FILTER (WHERE is_active)::int AS active
         FROM reference_resources GROUP BY 1, 2`
    );
    const counts = new Map(rows.map((r) => [`${r.subject_key}|${r.topic_slug}`, r]));
    const subjects = SUBJECT_CATALOG.map((s) => ({
      key: s.key,
      name: s.name,
      subject_level: counts.get(`${s.key}|`)?.active || 0,
      topics: (CURRICULUM[s.key] || []).map((t) => ({
        slug: t.slug,
        title: t.title,
        refs: counts.get(`${s.key}|${t.slug}`)?.active || 0,
      })),
    }));
    subjects.push({
      key: "general", name: "Cross-subject (general)",
      subject_level: counts.get("general|")?.active || 0, topics: [],
    });
    res.json({ subjects });
  })
);

// GET /api/admin/references?subject_key=&topic_slug=  (topic_slug '' = subject-level)
router.get(
  "/references",
  asyncHandler(async (req, res) => {
    const { subject_key, topic_slug } = req.query;
    if (!subject_key) return res.status(400).json({ error: "subject_key is required." });
    const params = [subject_key];
    let where = "subject_key = $1";
    if (topic_slug !== undefined) {
      if (topic_slug === "") where += " AND topic_slug IS NULL";
      else {
        params.push(topic_slug);
        where += ` AND topic_slug = $${params.length}`;
      }
    }
    const { rows } = await query(
      `SELECT id, subject_key, topic_slug, category, name, url, tag, sort_order, is_active, updated_at
         FROM reference_resources WHERE ${where}
        ORDER BY topic_slug NULLS FIRST, sort_order, name`,
      params
    );
    res.json({ references: rows });
  })
);

const refSchema = z.object({
  subject_key: z.string().min(2).max(60),
  topic_slug: z.string().max(80).nullable().optional(),
  category: z.enum(["learning", "past_papers"]).default("learning"),
  name: z.string().min(2).max(120),
  url: z.string().url().max(500),
  tag: z.string().max(200).nullable().optional(),
  sort_order: z.number().int().min(0).max(10000).optional(),
  is_active: z.boolean().optional(),
});

// POST /api/admin/references
router.post(
  "/references",
  validate(refSchema),
  asyncHandler(async (req, res) => {
    const b = req.body;
    const { rows } = await query(
      `INSERT INTO reference_resources
         (subject_key, topic_slug, category, name, url, tag, sort_order, is_active, updated_by)
       VALUES ($1,$2,$3,$4,$5,$6,COALESCE($7,100),COALESCE($8,TRUE),$9)
       RETURNING *`,
      [b.subject_key, b.topic_slug || null, b.category, b.name, b.url, b.tag ?? null,
       b.sort_order ?? null, b.is_active ?? null, req.user.sub]
    );
    res.status(201).json({ reference: rows[0] });
  })
);

// PUT /api/admin/references/:id
router.put(
  "/references/:id",
  validate(refSchema.partial()),
  asyncHandler(async (req, res) => {
    const fields = ["subject_key", "topic_slug", "category", "name", "url", "tag", "sort_order", "is_active"];
    const set = [];
    const vals = [];
    fields.forEach((f) => {
      if (req.body[f] !== undefined) {
        vals.push(req.body[f]);
        set.push(`${f} = $${vals.length}`);
      }
    });
    if (set.length === 0) return res.status(400).json({ error: "Nothing to update." });
    vals.push(req.user.sub);
    set.push(`updated_by = $${vals.length}`);
    vals.push(req.params.id);
    const { rows } = await query(
      `UPDATE reference_resources SET ${set.join(", ")} WHERE id = $${vals.length} RETURNING *`,
      vals
    );
    if (rows.length === 0) return res.status(404).json({ error: "Reference not found." });
    res.json({ reference: rows[0] });
  })
);

// DELETE /api/admin/references/:id
router.delete(
  "/references/:id",
  asyncHandler(async (req, res) => {
    const { rowCount } = await query("DELETE FROM reference_resources WHERE id = $1", [req.params.id]);
    if (rowCount === 0) return res.status(404).json({ error: "Reference not found." });
    res.json({ ok: true });
  })
);

// POST /api/admin/references/refresh-plans
// Push the updated library into every student's recorded plan.
router.post(
  "/references/refresh-plans",
  asyncHandler(async (req, res) => {
    const { rows: students } = await query(
      `SELECT s.id, s.full_name, MIN(pi.task_date) AS first, MAX(pi.task_date) AS last
         FROM students s JOIN plan_items pi ON pi.student_id = s.id
        GROUP BY s.id, s.full_name`
    );
    const results = [];
    for (const s of students) {
      const first = s.first.toISOString().slice(0, 10);
      const days = Math.round((s.last - s.first) / 86_400_000) + 1;
      const tasks = await materializeWindow(s.id, first, days);
      results.push({ student: s.full_name, tasks });
    }
    res.json({ refreshed: results });
  })
);

export default router;
