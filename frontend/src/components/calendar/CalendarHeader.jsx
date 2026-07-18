import { MONTHS, parseIso, startOfWeek, addDays } from "../../utils/dates.js";
import { ChevronLeftIcon, ChevronRightIcon } from "../icons.jsx";

// FullCalendar-style toolbar (per calendar-20): grouped prev/next + Today on
// the left, period title centered, joined Month/Week/Day switcher on the right.
export default function CalendarHeader({ view, setView, anchor, setAnchor, onToday }) {
  const label = periodLabel(view, anchor);

  const step = (dir) => {
    const d = parseIso(anchor);
    if (view === "month") setAnchor(isoOf(new Date(d.getFullYear(), d.getMonth() + dir, 1)));
    else if (view === "week") setAnchor(isoOf(addDays(d, dir * 7)));
    else setAnchor(isoOf(addDays(d, dir)));
  };

  return (
    <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
      {/* left: nav buttons */}
      <div className="flex items-center gap-2">
        <div className="inline-flex overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <button onClick={() => step(-1)} aria-label="Previous"
                  className="grid h-9 w-9 place-items-center text-slate-500 transition hover:bg-slate-50 hover:text-slate-800">
            <ChevronLeftIcon className="h-4 w-4" />
          </button>
          <span className="w-px bg-slate-200" />
          <button onClick={() => step(1)} aria-label="Next"
                  className="grid h-9 w-9 place-items-center text-slate-500 transition hover:bg-slate-50 hover:text-slate-800">
            <ChevronRightIcon className="h-4 w-4" />
          </button>
        </div>
        <button onClick={onToday}
                className="h-9 rounded-lg border border-brand-200 bg-white px-4 text-sm font-semibold text-brand-700 shadow-sm transition hover:bg-brand-50">
          Today
        </button>
      </div>

      {/* center: period title */}
      <h2 className="order-first w-full text-center text-2xl font-semibold text-slate-800 sm:order-none sm:w-auto">
        {label}
      </h2>

      {/* right: view switcher (joined group, active = solid) */}
      <div className="inline-flex overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        {["month", "week", "day"].map((v, i) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`h-9 px-4 text-sm font-semibold capitalize transition ${
              view === v ? "bg-brand-600 text-white" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
            } ${i > 0 ? "border-l border-slate-200" : ""}`}
          >
            {v}
          </button>
        ))}
      </div>
    </div>
  );
}

function isoOf(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function periodLabel(view, anchorIso) {
  const d = parseIso(anchorIso);
  if (view === "month") return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  if (view === "week") {
    const s = startOfWeek(d);
    const e = addDays(s, 6);
    const sM = MONTHS[s.getMonth()].slice(0, 3);
    const eM = MONTHS[e.getMonth()].slice(0, 3);
    return s.getMonth() === e.getMonth()
      ? `${s.getDate()} – ${e.getDate()} ${sM} ${e.getFullYear()}`
      : `${s.getDate()} ${sM} – ${e.getDate()} ${eM} ${e.getFullYear()}`;
  }
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}
