import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { query } from "../db.js";
import { RESOURCES, GENERAL_RESOURCES } from "../data/resources.js";

const router = Router();

// GET /api/resources — the directory, served from the admin-managed master
// library (subject-level entries). Board/notes metadata comes from the static
// directory; the hardcoded lists are only a fallback for uncovered subjects.
router.get("/", requireAuth, async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT subject_key, category, name, url, tag
         FROM reference_resources
        WHERE is_active AND topic_slug IS NULL
        ORDER BY subject_key, sort_order, name`
    );
    const bySubject = new Map();
    rows.forEach((r) => {
      if (!bySubject.has(r.subject_key)) bySubject.set(r.subject_key, []);
      bySubject.get(r.subject_key).push({ name: r.name, url: r.url, tag: r.tag, type: r.category === "past_papers" ? "Past papers" : "Resource" });
    });

    const by_subject = {};
    for (const [key, block] of Object.entries(RESOURCES)) {
      by_subject[key] = {
        ...block,
        resources: bySubject.get(key)?.length ? bySubject.get(key) : block.resources,
      };
    }
    // Subjects the admin added that aren't in the static directory.
    for (const [key, refs] of bySubject.entries()) {
      if (key !== "general" && !by_subject[key]) {
        by_subject[key] = { subject: key, board: "", resources: refs };
      }
    }

    const general = bySubject.get("general")?.length ? bySubject.get("general") : GENERAL_RESOURCES;
    res.json({ by_subject, general });
  } catch (err) {
    next(err);
  }
});

export default router;
