// ===========================================================================
// Academic-year engine — makes the whole platform year-agnostic.
// Given a year group and "today", it works out the exam series and a sensible
// default UK school calendar (approximate; parents adjust to their own school).
// GCSE exams sit in May/June at the end of Year 11.
// ===========================================================================

const pad = (n) => String(n).padStart(2, "0");

/**
 * The calendar year in which a student sits their GCSEs.
 * Year 11 → the summer of the current/upcoming academic year; each year below
 * that pushes the exam year out by one.
 */
export function examYearFor(yearGroup, now = new Date()) {
  const y = now.getFullYear();
  const m = now.getMonth(); // 0 = Jan … 11 = Dec
  let academicEndYear;
  if (m >= 8) academicEndYear = y + 1;       // Sep–Dec: this school year ends next year
  else if (m <= 5) academicEndYear = y;      // Jan–Jun: exams this summer
  else academicEndYear = y + 1;              // Jul–Aug: gap → next school year
  const yg = Math.min(Math.max(Number(yearGroup) || 11, 7), 11);
  return academicEndYear + (11 - yg);
}

/**
 * A default UK GCSE calendar for a given exam year: three terms, the usual
 * holidays, and a May/June exam window. Dates are typical, not authoritative.
 */
export function defaultCalendar(examYear) {
  const py = examYear - 1; // autumn term is the previous calendar year
  return {
    exam_series: `May/June ${examYear}`,
    exam_start: `${examYear}-05-11`,
    exam_end: `${examYear}-06-19`,
    term_dates: [
      { name: "Autumn", start: `${py}-09-02`, end: `${py}-12-19` },
      { name: "Spring", start: `${examYear}-01-06`, end: `${examYear}-03-27` },
      { name: "Summer", start: `${examYear}-04-13`, end: `${examYear}-07-22` },
    ],
    holidays: [
      { name: "October half term", start: `${py}-10-27`, end: `${py}-10-31` },
      { name: "Christmas", start: `${py}-12-22`, end: `${examYear}-01-02` },
      { name: "February half term", start: `${examYear}-02-16`, end: `${examYear}-02-20` },
      { name: "Easter", start: `${examYear}-03-30`, end: `${examYear}-04-10` },
      { name: "May half term", start: `${examYear}-05-25`, end: `${examYear}-05-29` },
    ],
  };
}

/** Convenience: defaults straight from a year group + today. */
export function defaultCalendarForYearGroup(yearGroup, now = new Date()) {
  return defaultCalendar(examYearFor(yearGroup, now));
}

/**
 * Academic-year start = earliest term start. Used as the topic-rotation anchor
 * so every student's plan begins at the first topic regardless of exam year.
 */
export function academicYearStart(terms) {
  if (terms?.length) {
    return terms.map((t) => String(t.start).slice(0, 10)).sort()[0];
  }
  return null;
}

// eslint exports helper (kept for clarity in imports)
export const _pad = pad;
