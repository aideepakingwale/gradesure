import {
  startOfWeek, parseIso, rangeIso, isTodayIso, WEEKDAY_LABELS,
} from "../../utils/dates.js";
import { subjectColor, subjectShort, STATUS } from "../../utils/ui.js";
import { SubjectIcon, CheckIcon } from "../icons.jsx";

// Week view — 7 day columns (timeGrid-inspired). Click the status circle to
// cycle a task; click anywhere else on the card to open the full day view.
export default function WeekView({ anchor, daysMap, onToggle, onOpenDay }) {
  const start = startOfWeek(parseIso(anchor));
  const week = rangeIso(start, 7);

  return (
    <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="grid min-w-[840px] grid-cols-7 divide-x divide-slate-100">
        {week.map((d) => {
          const day = daysMap[d];
          const isToday = isTodayIso(d);
          const dow = WEEKDAY_LABELS[(parseIso(d).getDay() + 6) % 7];
          const tasks = day?.tasks || [];
          const done = tasks.filter((t) => t.status === "completed").length;

          return (
            <div key={d} className="flex min-h-[280px] flex-col">
              {/* column header */}
              <button
                onClick={() => onOpenDay(d)}
                className={`border-b px-3 py-2.5 text-left transition hover:bg-slate-50 ${
                  isToday ? "border-brand-200 bg-brand-50/70" : "border-slate-100 bg-slate-50/50"
                }`}
              >
                <p className={`text-[11px] font-semibold uppercase tracking-wider ${isToday ? "text-brand-600" : "text-slate-400"}`}>
                  {dow}
                </p>
                <div className="mt-0.5 flex items-baseline justify-between">
                  <span className={`text-xl font-bold ${isToday ? "text-brand-700" : "text-slate-700"}`}>
                    {parseIso(d).getDate()}
                  </span>
                  {tasks.length > 0 && (
                    <span className={`text-[11px] font-medium ${done === tasks.length ? "text-emerald-600" : "text-slate-400"}`}>
                      {done}/{tasks.length}
                    </span>
                  )}
                </div>
              </button>

              {/* event cards */}
              <div className="flex-1 space-y-1.5 p-1.5">
                {tasks.length === 0 ? (
                  <p className="px-1 pt-6 text-center text-[11px] text-slate-300">No sessions</p>
                ) : (
                  tasks.map((t) => {
                    const color = subjectColor(t.subject_key);
                    const st = STATUS[t.status] || STATUS.not_started;
                    const completed = t.status === "completed";
                    return (
                      <div
                        key={`${t.subject_key}-${t.topic_slug}`}
                        className="group flex cursor-pointer items-center gap-2 rounded-lg border border-slate-100 bg-white p-2 shadow-sm transition hover:border-slate-200 hover:shadow"
                        style={{ borderLeft: `3px solid ${color}` }}
                        onClick={() => onOpenDay(d)}
                        title={t.topic_title}
                      >
                        <span className="grid h-7 w-7 flex-none place-items-center rounded-md"
                              style={{ backgroundColor: `${color}18`, color }}>
                          <SubjectIcon subject={t.subject_key} className="h-4 w-4" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className={`truncate text-xs font-bold ${completed ? "text-slate-400 line-through" : "text-slate-700"}`}>
                            {subjectShort(t.subject_name)}
                          </p>
                          <p className="truncate text-[10px] text-slate-400">{t.time_block}</p>
                        </div>
                        {/* status toggle circle */}
                        <button
                          onClick={(e) => { e.stopPropagation(); onToggle(d, t); }}
                          title={`${st.label} — click to change`}
                          className={`grid h-5 w-5 flex-none place-items-center rounded-full border-2 transition ${
                            completed
                              ? "border-emerald-500 bg-emerald-500 text-white"
                              : t.status === "in_progress"
                              ? "border-amber-400 bg-amber-50"
                              : t.status === "halted"
                              ? "border-rose-400 bg-rose-50"
                              : "border-slate-300 bg-white hover:border-brand-400"
                          }`}
                        >
                          {completed && <CheckIcon className="h-3 w-3" />}
                          {t.status === "in_progress" && <span className="h-2 w-2 rounded-full bg-amber-400" />}
                          {t.status === "halted" && <span className="h-0.5 w-2 rounded bg-rose-400" />}
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
      <p className="border-t border-slate-100 py-2 text-center text-xs text-slate-400">
        Click the circle to update status · click a card for the full day plan
      </p>
    </div>
  );
}
