// Local-time date helpers. All ISO strings are YYYY-MM-DD built from LOCAL
// date parts (never toISOString, which would shift across timezones).

export const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
export const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function iso(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseIso(s) {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function today() {
  const n = new Date();
  return new Date(n.getFullYear(), n.getMonth(), n.getDate());
}

export function todayIso() {
  return iso(today());
}

export function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export function addMonths(d, n) {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

// Monday-based start of week.
export function startOfWeek(d) {
  const x = new Date(d);
  const dow = (x.getDay() + 6) % 7; // Mon=0 .. Sun=6
  x.setDate(x.getDate() - dow);
  return x;
}

export function startOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

// First cell of a 6x7 month grid (Monday on/before the 1st).
export function monthGridStart(d) {
  return startOfWeek(startOfMonth(d));
}

export function sameMonth(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

export function isTodayIso(s) {
  return s === todayIso();
}

export function rangeIso(startDate, count) {
  const out = [];
  for (let i = 0; i < count; i++) out.push(iso(addDays(startDate, i)));
  return out;
}

// Human labels
export function dayNumber(s) {
  return parseIso(s).getDate();
}
export function weekdayShort(s) {
  return WEEKDAY_LABELS[(parseIso(s).getDay() + 6) % 7];
}
export function monthShort(s) {
  return MONTHS[parseIso(s).getMonth()].slice(0, 3);
}
export function longLabel(s) {
  const d = parseIso(s);
  return `${WEEKDAY_LABELS[(d.getDay() + 6) % 7]}, ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}
