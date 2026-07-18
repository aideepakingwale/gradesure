import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { BOARDS, SUBJECT_CATALOG, TIER_GRADES } from "../data/subjectCatalog.js";
import { defaultCalendarForYearGroup } from "../services/academicYear.js";

const router = Router();

// GET /api/catalog/subjects — boards, subjects and tier/grade rules for the UI.
router.get("/subjects", requireAuth, (req, res) => {
  res.json({ boards: BOARDS, subjects: SUBJECT_CATALOG, tier_grades: TIER_GRADES });
});

// GET /api/catalog/calendar-defaults?year_group=11
// Dynamic UK GCSE calendar for the year group's exam series (year-agnostic).
router.get("/calendar-defaults", requireAuth, (req, res) => {
  const yg = parseInt(req.query.year_group || "11", 10);
  res.json(defaultCalendarForYearGroup(yg));
});

export default router;
