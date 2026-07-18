// ===========================================================================
// Personalization Service (Business Logic) — HTTP-unaware.
// Turns a student's subject profile (current grade, target grade, tier) into a
// hyper-personalised weekly study allocation: weak subjects and Foundation-tier
// subjects get more weekly sessions; strong subjects get fewer.
//
// Deterministic: same subject profile => same weekly plan (so the scheduler and
// persisted progress stay aligned).
// ===========================================================================

import { SUBJECTS, SUBJECT_META } from "../data/curriculum.js";

const WEEKDAYS = [1, 2, 3, 4, 5]; // Mon..Fri
const BLOCKS_PER_DAY = 3;
const WEEKLY_SLOTS = WEEKDAYS.length * BLOCKS_PER_DAY; // 15

// Parse grades like "5", "7-8", "8/9" -> a representative integer.
function parseGrade(g, fallback) {
  if (g == null) return fallback;
  const m = String(g).match(/\d+/g);
  if (!m) return fallback;
  const nums = m.map(Number);
  return Math.round(nums.reduce((a, b) => a + b, 0) / nums.length);
}

function priorityReason({ tierRisk, gap, target }) {
  if (tierRisk) return "Foundation tier caps at Grade 5 — move to Higher. Highest priority.";
  if (gap >= 3) return `A ${gap}-grade climb to ${target} — needs the most reps.`;
  if (gap === 2) return `A solid stretch to Grade ${target}.`;
  if (gap === 1) return `Close — polish to lock in Grade ${target}.`;
  return `Maintain Grade ${target}.`;
}

function priorityLabel({ tierRisk, gap }) {
  if (tierRisk) return "critical";
  if (gap >= 3) return "high";
  if (gap === 2) return "medium";
  return "maintain";
}

/**
 * Build a personalised weekly study plan from a student's subjects.
 * @param {Array} subjects rows from student_subjects (may be empty)
 * @returns {{ subjects, weekdaySlots, priorityOrder, meta, totalWeeklySessions }}
 */
export function buildStudyPlan(subjects) {
  // Fall back to the full 9-subject set at equal weight if none provided.
  const list =
    subjects && subjects.length
      ? subjects.map((s) => ({
          key: s.subject_key,
          name: s.subject_name || SUBJECT_META[s.subject_key]?.name || s.subject_key,
          board: s.exam_board || SUBJECT_META[s.subject_key]?.board || "",
          tier: s.tier || null,
          current: parseGrade(s.current_grade, 5),
          target: parseGrade(s.target_grade, 8),
        }))
      : SUBJECTS.map((key) => ({
          key,
          name: SUBJECT_META[key].name,
          board: SUBJECT_META[key].board,
          tier: null,
          current: 5,
          target: 8,
        }));

  // Compute weight per subject.
  list.forEach((s) => {
    s.gap = Math.max(0, s.target - s.current);
    s.tierRisk = s.tier === "Foundation";
    s.weight = 1 + s.gap + (s.tierRisk ? 2 : 0);
    s.priority = priorityLabel(s);
    s.reason = priorityReason(s);
  });

  // Priority order: heaviest weight first, then bigger gap, then name.
  const priorityOrder = [...list].sort(
    (a, b) => b.weight - a.weight || b.gap - a.gap || a.name.localeCompare(b.name)
  );

  // --- Allocate weekly sessions: weight-proportional (largest remainder), ---
  // --- minimum 1 per subject, so priorities stay expressed at ANY count. ---
  const n = list.length;
  const alloc = new Map(list.map((s) => [s.key, 0]));

  if (n <= WEEKLY_SLOTS) {
    const totalW = list.reduce((a, s) => a + s.weight, 0);
    const shares = priorityOrder.map((s) => {
      const ideal = (WEEKLY_SLOTS * s.weight) / totalW;
      return { key: s.key, base: Math.max(1, Math.floor(ideal)), frac: ideal - Math.floor(ideal), weight: s.weight };
    });
    shares.forEach((sh) => alloc.set(sh.key, sh.base));
    let sum = shares.reduce((a, sh) => a + sh.base, 0);
    // Pad leftover slots to the largest fractional remainders (weight tiebreak).
    const byFrac = [...shares].sort((a, b) => b.frac - a.frac || b.weight - a.weight);
    let i = 0;
    while (sum < WEEKLY_SLOTS) {
      const sh = byFrac[i % byFrac.length];
      alloc.set(sh.key, alloc.get(sh.key) + 1);
      sum += 1;
      i += 1;
    }
    // Trim any overshoot from the lightest subjects (never below 1).
    const byWeightAsc = [...shares].sort((a, b) => a.weight - b.weight);
    i = 0;
    while (sum > WEEKLY_SLOTS && i < 1000) {
      const sh = byWeightAsc[i % byWeightAsc.length];
      if (alloc.get(sh.key) > 1) {
        alloc.set(sh.key, alloc.get(sh.key) - 1);
        sum -= 1;
      }
      i += 1;
    }
  } else {
    // More subjects than weekly slots: give the top WEEKLY_SLOTS one each.
    priorityOrder.slice(0, WEEKLY_SLOTS).forEach((s) => alloc.set(s.key, 1));
  }

  list.forEach((s) => (s.sessionsPerWeek = alloc.get(s.key)));

  // --- Interleave into a placement list, spread heavy subjects across days --
  const placement = [];
  const rem = new Map(alloc);
  let guard = 0;
  while (placement.length < WEEKLY_SLOTS && guard < 1000) {
    let placedAny = false;
    for (const s of priorityOrder) {
      if (rem.get(s.key) > 0) {
        placement.push(s.key);
        rem.set(s.key, rem.get(s.key) - 1);
        placedAny = true;
        if (placement.length >= WEEKLY_SLOTS) break;
      }
    }
    if (!placedAny) break;
    guard += 1;
  }

  // Map placement into weekday -> [block0, block1, block2].
  // idx % 5 chooses the day so a subject's repeats spread across the week.
  const weekdaySlots = {};
  WEEKDAYS.forEach((d) => (weekdaySlots[d] = []));
  placement.forEach((key, idx) => {
    const day = WEEKDAYS[idx % WEEKDAYS.length];
    weekdaySlots[day].push(key);
  });

  const meta = {};
  list.forEach((s) => (meta[s.key] = { name: s.name, board: s.board, tier: s.tier }));

  return {
    subjects: priorityOrder.map((s) => ({
      key: s.key,
      name: s.name,
      board: s.board,
      tier: s.tier,
      current: s.current,
      target: s.target,
      gap: s.gap,
      sessionsPerWeek: s.sessionsPerWeek,
      priority: s.priority,
      reason: s.reason,
    })),
    priorityOrder: priorityOrder.map((s) => s.key),
    weekdaySlots,
    meta,
    totalWeeklySessions: WEEKLY_SLOTS,
  };
}
