// ===========================================================================
// Scheduler Service (Business Logic) — HTTP-unaware.
// Deterministically generates the daily study plan from a date, the term
// calendar, and the curriculum bank. Same inputs => same tasks (so persisted
// progress always lines up with a regenerated task).
// ===========================================================================

import { CURRICULUM, SUBJECT_META } from "../data/curriculum.js";
import { buildStudyPlan } from "./personalization.js";
import { examYearFor, defaultCalendar, academicYearStart } from "./academicYear.js";

// Generic topic bank for custom subjects that have no curated curriculum.
const GENERIC_BANK = [
  { slug: "recall-notes", title: "Active-recall notes on this week's topic", hint: "Blurt from memory, then fill gaps" },
  { slug: "practice-questions", title: "Exam-style practice questions", hint: "Mark against the scheme" },
  { slug: "past-paper", title: "Timed past-paper section", hint: "Simulate exam conditions" },
  { slug: "weak-topic", title: "Target your weakest topic", hint: "From your error log" },
  { slug: "flashcards", title: "Spaced-repetition flashcards", hint: "Quizlet / Anki" },
];

// Normalise a calendar arg (student term dates) with dynamic, year-agnostic
// fallbacks. When a student has no term dates, we derive a default UK calendar
// for their exam year (from examStart, else the next series for a Year 11).
// The topic-rotation baseline is the academic-year start, so every student's
// plan begins at the first topic regardless of which year they sit exams.
export function resolveCalendar(calendar) {
  let terms = calendar?.terms?.length ? calendar.terms : null;
  let holidays = calendar?.holidays?.length ? calendar.holidays : null;
  let examStart = calendar?.examStart || null;

  if (!terms || !examStart) {
    const examYear = examStart ? Number(examStart.slice(0, 4)) : examYearFor(11);
    const def = defaultCalendar(examYear);
    if (!terms) terms = def.term_dates;
    if (!holidays) holidays = def.holidays;
    if (!examStart) examStart = def.exam_start;
  }
  if (!holidays) holidays = [];

  const baseline = academicYearStart(terms) || `${Number(examStart.slice(0, 4)) - 1}-09-01`;
  return { terms, holidays, examStart, baseline };
}

function toDate(s) {
  return new Date(`${typeof s === "string" ? s.slice(0, 10) : s}T00:00:00Z`);
}
function iso(d) {
  return d.toISOString().slice(0, 10);
}
function inRange(d, start, end) {
  const x = toDate(iso(d));
  return x >= toDate(start) && x <= toDate(end);
}

// Phase is derived from months-to-exam, so it works for ANY exam window.
export function getPhase(date, examStart) {
  const d = toDate(date);
  const exam = toDate(examStart || `${examYearFor(11)}-05-11`);
  if (d > exam) return { key: "beyond", name: "Post-exam", focus: "Exams complete — well done!" };
  const monthsToExam = (exam - d) / (30.44 * 86_400_000);
  const month = d.getUTCMonth(); // 0=Jan
  const isSummerBreak = month === 6 || month === 7; // Jul/Aug

  if (monthsToExam <= 2.5)
    return { key: "paper_marathon", name: "Past Paper Marathon", focus: "Relentless past papers + examiner reports. Target weakest topics." };
  if (monthsToExam <= 4.5)
    return { key: "mock_sprint", name: "Mock Exam Sprint", focus: "Timed conditions. Sit full past papers, mark strictly against schemes." };
  if (isSummerBreak && monthsToExam > 8)
    return { key: "summer_bridge", name: "Summer Bridge", focus: "Morning routine. Bridge grade gaps and build the daily habit." };
  return { key: "content_mastery", name: "Content Mastery", focus: "Convert each school lesson into active-recall notes the same day." };
}

export function getDayContext(date, calendar) {
  const cal = resolveCalendar(calendar);
  const d = toDate(date);
  const dow = d.getUTCDay(); // 0=Sun ... 6=Sat
  const isWeekend = dow === 0 || dow === 6;

  const holiday = cal.holidays.find((h) => inRange(d, h.start, h.end));
  const inTerm = cal.terms.some((term) => inRange(d, term.start, term.end));
  const isSchoolDay = inTerm && !isWeekend && !holiday;

  let dayType;
  if (isSchoolDay) dayType = "school_day";
  else if (isWeekend) dayType = dow === 6 ? "saturday_output" : "sunday_consolidation";
  else dayType = holiday ? "holiday" : "non_term_weekday";

  return { date: iso(d), dow, isWeekend, isSchoolDay, holiday: holiday?.name || null, dayType };
}

// Sign-safe modulo (JS "%" keeps the sign of the dividend, which breaks
// indexing for dates before the July 2026 baseline where weekIndex < 0).
function mod(n, m) {
  return ((n % m) + m) % m;
}

// Rotate a subject's topic by the week index (modulo the topic bank length).
// Falls back to a generic bank for custom subjects with no curated curriculum.
function topicForWeek(subjectKey, weekIndex) {
  const bank = CURRICULUM[subjectKey] || GENERIC_BANK;
  return bank[mod(weekIndex, bank.length)];
}

// Subject metadata resolved from the personalised plan, then the static map.
function metaFor(plan, key) {
  return plan.meta[key] || SUBJECT_META[key] || { name: key, board: "" };
}

// Weeks since the student's academic-year start (the topic-rotation anchor).
function weekIndexFor(date, baseline) {
  const base = toDate(baseline);
  const days = Math.floor((toDate(date) - base) / 86_400_000);
  return Math.floor(days / 7);
}

// Time blocks differ for morning (holiday/summer) vs evening (school day).
const EVENING_BLOCKS = ["17:30–18:00", "18:00–18:30", "18:30–19:00"];
const MORNING_BLOCKS = ["10:00–10:45", "11:00–11:45", "12:00–12:45"];

/**
 * Generate the full plan for a single date, personalised to `plan`.
 * @param {string} date  YYYY-MM-DD
 * @param {object} plan  result of buildStudyPlan(subjects)
 */
export function generateDay(date, plan, calendar) {
  const cal = resolveCalendar(calendar);
  const ctx = getDayContext(date, cal);
  const phase = getPhase(date, cal.examStart);
  const weekIndex = weekIndexFor(date, cal.baseline);
  const blocks = ctx.isSchoolDay ? EVENING_BLOCKS : MORNING_BLOCKS;
  const order = plan.priorityOrder;
  const pick = (i) => order[mod(i, order.length)]; // rotate by priority order

  let subjects;
  let mode;
  let activity; // the "kind" of session, shown in the UI

  if (ctx.dayType === "saturday_output") {
    // Output day: timed past papers on the two highest-priority subjects.
    mode = "Output Day — timed past papers & mark schemes only.";
    activity = "past_paper";
    subjects = [pick(weekIndex), pick(weekIndex + 1)];
  } else if (ctx.dayType === "sunday_consolidation") {
    mode = "Consolidation — blurting, organising notes, spaced-repetition, rest.";
    activity = "consolidation";
    subjects = [pick(weekIndex + 2)];
  } else {
    // School day (evening) OR holiday/summer weekday (morning): use the
    // personalised weekday allocation. Non-Mon–Fri fallbacks to priority order.
    mode = phase.focus;
    activity = phase.key === "mock_sprint" || phase.key === "paper_marathon" ? "past_paper" : "study";
    subjects =
      plan.weekdaySlots[ctx.dow]?.length
        ? plan.weekdaySlots[ctx.dow]
        : [pick(weekIndex), pick(weekIndex + 1), pick(weekIndex + 2)];
  }

  const tasks = subjects.map((subjectKey, i) => {
    const topic = topicForWeek(subjectKey, weekIndex + i);
    const meta = metaFor(plan, subjectKey);
    const subj = plan.subjects.find((s) => s.key === subjectKey);
    return {
      subject_key: subjectKey,
      subject_name: meta.name,
      board: meta.board,
      tier: meta.tier || null,
      priority: subj?.priority || "medium",
      activity,
      topic_slug: topic.slug,
      topic_title: topic.title,
      hint: topic.hint,
      time_block: blocks[i] || blocks[blocks.length - 1],
    };
  });

  return {
    date: ctx.date,
    day_type: ctx.dayType,
    is_school_day: ctx.isSchoolDay,
    holiday: ctx.holiday,
    week_index: weekIndex,
    phase: { key: phase.key, name: phase.name },
    mode,
    tasks,
  };
}

/**
 * Generate a range of days starting at `startDate` for `count` days.
 * @param {object} plan result of buildStudyPlan(subjects)
 */
export function generateRange(startDate, count = 30, plan, calendar) {
  const out = [];
  const start = toDate(startDate);
  const p = plan || buildStudyPlan(null);
  const cal = resolveCalendar(calendar);
  for (let i = 0; i < count; i++) {
    const d = new Date(start.getTime() + i * 86_400_000);
    out.push(generateDay(iso(d), p, cal));
  }
  return out;
}

export { defaultCalendar, examYearFor } from "./academicYear.js";
