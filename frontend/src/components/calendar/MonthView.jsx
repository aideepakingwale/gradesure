import {
  WEEKDAY_LABELS, monthGridStart, parseIso, rangeIso, sameMonth, isTodayIso,
} from "../../utils/dates.js";
import { subjectColor, subjectShort } from "../../utils/ui.js";

// FullCalendar-style month grid (per calendar-20): bordered day cells, day
// number top-right, events as colored pills (max 3 + "+N more"), today ringed.
export default function MonthView({ anchor, daysMap, onOpenDay }) {
  const gridStart = monthGridStart(parseIso(anchor));
  const cells = rangeIso(gridStart, 42);
  const anchorDate = parseIso(anchor);

  return (
    <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      {/* weekday header row */}
      <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/80">
        {WEEKDAY_LABELS.map((w) => (
          <div key={w} className="py-2.5 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
            <span className="hidden sm:inline">{w}</span>
            <span className="sm:hidden">{w.slice(0, 1)}</span>
          </div>
        ))}
      </div>

      {/* 6-week grid */}
      <div className="grid grid-cols-7">
        {cells.map((d, idx) => {
          const day = daysMap[d];
          const inMonth = sameMonth(parseIso(d), anchorDate);
          const isToday = isTodayIso(d);
          const tasks = day?.tasks || [];
          const shown = tasks.slice(0, 3);
          const extra = tasks.length - shown.length;
          const notLastCol = (idx + 1) % 7 !== 0;
          const notLastRow = idx < 35;

          return (
            <button
              key={d}
              onClick={() => onOpenDay(d)}
              className={`group flex min-h-[92px] flex-col p-1.5 text-left align-top transition sm:min-h-[112px] sm:p-2
                ${notLastCol ? "border-r border-slate-100" : ""}
                ${notLastRow ? "border-b border-slate-100" : ""}
                ${inMonth ? "bg-white hover:bg-brand-50/40" : "bg-slate-50/60 hover:bg-slate-100/60"}`}
            >
              {/* day number — top right, today = solid indigo disc */}
              <div className="flex justify-end">
                <span className={`grid h-6 w-6 place-items-center rounded-full text-xs font-semibold ${
                  isToday
                    ? "bg-brand-600 text-white"
                    : inMonth
                    ? "text-slate-700 group-hover:text-slate-900"
                    : "text-slate-300"
                }`}>
                  {parseIso(d).getDate()}
                </span>
              </div>

              {/* event pills */}
              <div className="mt-1 flex flex-1 flex-col gap-1">
                {shown.map((t) => {
                  const done = t.status === "completed";
                  return (
                    <span
                      key={`${t.subject_key}-${t.topic_slug}`}
                      title={`${t.subject_name}: ${t.topic_title}`}
                      className={`hidden truncate rounded px-1.5 py-0.5 text-[11px] font-semibold leading-4 text-white sm:block ${
                        done ? "opacity-100" : "opacity-75"
                      }`}
                      style={{ backgroundColor: subjectColor(t.subject_key) }}
                    >
                      {done && "✓ "}{subjectShort(t.subject_name)}
                    </span>
                  );
                })}
                {/* mobile: dots instead of pills */}
                {tasks.length > 0 && (
                  <span className="flex gap-1 sm:hidden">
                    {tasks.slice(0, 4).map((t, i) => (
                      <span key={i} className="h-1.5 w-1.5 rounded-full"
                            style={{ backgroundColor: subjectColor(t.subject_key), opacity: t.status === "completed" ? 1 : 0.5 }} />
                    ))}
                  </span>
                )}
                {extra > 0 && (
                  <span className="hidden text-[11px] font-medium text-slate-400 sm:block">+{extra} more</span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
