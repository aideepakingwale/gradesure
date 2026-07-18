import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { BOARDS, SUBJECT_CATALOG, TIER_GRADES } from "../data/subjectCatalog.js";

const router = Router();

// GET /api/catalog/subjects — boards, subjects and tier/grade rules for the UI.
router.get("/subjects", requireAuth, (req, res) => {
  res.json({ boards: BOARDS, subjects: SUBJECT_CATALOG, tier_grades: TIER_GRADES });
});

export default router;
