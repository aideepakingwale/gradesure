// ===========================================================================
// Master reference library (admin-managed, DB-backed).
//  - Seeded once from the curated code data: subject-level directory links,
//    topic-exact links for every curriculum topic, and past-paper sources.
//  - The materializer, AI guide and resources page all read from here.
//  - Code-generated search links (topicLinks.js) remain only as a fallback
//    for subjects/topics the admin hasn't covered yet.
// ===========================================================================
import { query } from "../db.js";
import { CURRICULUM, SUBJECT_META } from "../data/curriculum.js";
import { RESOURCES, GENERAL_RESOURCES } from "../data/resources.js";
import { topicResources } from "./topicLinks.js";

const PAPER_HINT = /past paper|papers|assessment/i;

// --- One-time seed (runs on boot when the table is empty) -------------------
export async function seedReferencesIfEmpty() {
  const { rows } = await query("SELECT COUNT(*)::int AS n FROM reference_resources");
  if (rows[0].n > 0) return 0;

  const items = [];
  // Subject-level directory links (category by tag heuristic).
  for (const [key, block] of Object.entries(RESOURCES)) {
    (block.resources || []).forEach((r, i) => {
      items.push([key, null, PAPER_HINT.test(`${r.type} ${r.tag}`) ? "past_papers" : "learning",
        r.name, r.url, r.tag || r.type || null, (i + 1) * 10]);
    });
  }
  // Cross-subject essentials.
  GENERAL_RESOURCES.forEach((r, i) => {
    items.push(["general", null, PAPER_HINT.test(`${r.type} ${r.tag}`) ? "past_papers" : "learning",
      r.name, r.url, r.tag || null, (i + 1) * 10]);
  });
  // Topic-exact links for every curriculum topic.
  for (const [key, topics] of Object.entries(CURRICULUM)) {
    const subjectName = SUBJECT_META[key]?.name || key;
    for (const t of topics) {
      topicResources(key, subjectName, t.title).forEach((r, i) => {
        items.push([key, t.slug, "learning", r.name, r.url, r.tag || null, (i + 1) * 10]);
      });
    }
  }

  const CHUNK = 200;
  for (let i = 0; i < items.length; i += CHUNK) {
    const chunk = items.slice(i, i + CHUNK);
    const params = [];
    const values = chunk
      .map((r, j) => {
        const b = j * 7;
        params.push(...r);
        return `($${b + 1},$${b + 2},$${b + 3},$${b + 4},$${b + 5},$${b + 6},$${b + 7})`;
      })
      .join(",");
    await query(
      `INSERT INTO reference_resources (subject_key, topic_slug, category, name, url, tag, sort_order)
       VALUES ${values}`,
      params
    );
  }
  console.log(`[refs] Seeded master reference library with ${items.length} entries.`);
  return items.length;
}

// --- Read paths --------------------------------------------------------------

/**
 * Load all active references for a set of subjects into a lookup map:
 *   "<subject>|<topic_slug>" -> [refs]   and   "<subject>|" -> subject-level refs
 */
export async function loadReferenceMap(subjectKeys) {
  const { rows } = await query(
    `SELECT subject_key, topic_slug, category, name, url, tag
       FROM reference_resources
      WHERE is_active AND subject_key = ANY($1)
      ORDER BY sort_order, name`,
    [subjectKeys]
  );
  const map = new Map();
  for (const r of rows) {
    const k = `${r.subject_key}|${r.topic_slug || ""}`;
    if (!map.has(k)) map.set(k, []);
    map.get(k).push({ name: r.name, url: r.url, tag: r.tag, category: r.category });
  }
  return map;
}

/**
 * Resolve the links to record on one task:
 *  1. admin-curated topic refs  2. subject-level refs  3. generated fallback.
 * Learning links first, capped at 4 (past-paper link appended when present).
 */
export function resolveTaskResources(map, subjectKey, topicSlug, subjectName, topicTitle) {
  const topicRefs = map.get(`${subjectKey}|${topicSlug}`) || [];
  const subjRefs = map.get(`${subjectKey}|`) || [];
  let picked = topicRefs.filter((r) => r.category === "learning").slice(0, 3);
  if (picked.length === 0) picked = subjRefs.filter((r) => r.category === "learning").slice(0, 3);
  if (picked.length === 0) picked = topicResources(subjectKey, subjectName, topicTitle);
  const paper = topicRefs.find((r) => r.category === "past_papers") ||
                subjRefs.find((r) => r.category === "past_papers");
  if (paper) picked = [...picked.slice(0, 3), paper];
  return picked.map(({ name, url, tag }) => ({ name, url, tag }));
}

/** Subject-level refs for the AI guide (top 4 learning links per subject). */
export function subjectLevelRefs(map, subjectKey) {
  return (map.get(`${subjectKey}|`) || [])
    .filter((r) => r.category === "learning")
    .slice(0, 4)
    .map(({ name, url, tag }) => ({ name, url, tag }));
}
