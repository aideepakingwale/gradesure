// ===========================================================================
// UK GCSE subject catalog — the source of truth for what parents can
// configure, per England's 9-1 GCSE standards (Ofqual):
//
//  • TIERED subjects (Foundation / Higher entry): Mathematics, the Sciences
//    (Combined Science Trilogy and separate Biology/Chemistry/Physics),
//    Modern Foreign Languages, and Statistics.
//      - Foundation tier: grades 1–5 available (a student CANNOT be awarded
//        above grade 5 on Foundation papers).
//      - Higher tier: grades 4–9 (grade 3 as a safety-net "allowed grade").
//  • UNTIERED subjects: everything else (English Language & Literature,
//    humanities, Computer Science, Sociology, arts…) — a single paper set
//    covering the full 1–9 range. Tier does not apply.
//
// Awarding bodies (exam boards) in the UK:
export const BOARDS = ["AQA", "Edexcel", "OCR", "WJEC Eduqas", "CCEA"];

// Grade ranges by tier (used for validation + UI dropdowns).
export const TIER_GRADES = {
  Foundation: ["1", "2", "3", "4", "5"],
  Higher: ["3", "4", "5", "6", "7", "8", "9"],
  none: ["1", "2", "3", "4", "5", "6", "7", "8", "9"],
};

// core: pre-ticked in the "add student" wizard (the common 9-subject load).
const S = (key, name, tiered, defaultBoard, core = false, spec = null) => ({
  key, name, tiered, defaultBoard, core, spec,
});

export const SUBJECT_CATALOG = [
  // --- core set ---
  S("maths", "Mathematics", true, "Edexcel", true),
  S("combined_science", "Combined Science (Trilogy)", true, "AQA", true),
  S("english_lang", "English Language", false, "AQA", true),
  S("english_lit", "English Literature", false, "Edexcel", true),
  S("computer_science", "Computer Science", false, "OCR", true, "J277"),
  S("geography", "Geography", false, "AQA", true),
  S("religious_studies", "Religious Studies", false, "AQA", true),
  S("sociology", "Sociology", false, "AQA", true),
  S("french", "French", true, "AQA", true),
  // --- additional common GCSEs ---
  S("biology", "Biology (separate)", true, "AQA"),
  S("chemistry", "Chemistry (separate)", true, "AQA"),
  S("physics", "Physics (separate)", true, "AQA"),
  S("spanish", "Spanish", true, "AQA"),
  S("german", "German", true, "AQA"),
  S("statistics", "Statistics", true, "Edexcel"),
  S("history", "History", false, "Edexcel"),
  S("business", "Business", false, "Edexcel"),
  S("psychology", "Psychology", false, "AQA"),
  S("art_design", "Art & Design", false, "AQA"),
  S("design_technology", "Design & Technology", false, "AQA"),
  S("food_nutrition", "Food Preparation & Nutrition", false, "WJEC Eduqas"),
  S("music", "Music", false, "AQA"),
  S("physical_education", "Physical Education", false, "AQA"),
];

export const CATALOG_BY_KEY = Object.fromEntries(SUBJECT_CATALOG.map((s) => [s.key, s]));

export function isTiered(subjectKey) {
  return CATALOG_BY_KEY[subjectKey]?.tiered ?? false;
}
