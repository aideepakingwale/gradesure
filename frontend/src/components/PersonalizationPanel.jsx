import { useState } from "react";
import { PRIORITY, subjectColor } from "../utils/ui.js";
import { TargetIcon, SubjectIcon, ChevronDownIcon, ChevronUpIcon } from "./icons.jsx";

// Explains the curated plan: weekly load + reason per subject.
export default function PersonalizationPanel({ profile }) {
  const [open, setOpen] = useState(false);
  if (!profile) return null;

  return (
    <div className="card mt-5">
      <button className="flex w-full items-center justify-between gap-3 text-left" onClick={() => setOpen((o) => !o)}>
        <div className="flex items-start gap-3">
          <span className="grid h-11 w-11 flex-none place-items-center rounded-xl bg-brand-50 text-brand-600">
            <TargetIcon className="h-6 w-6" />
          </span>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Weekly focus allocation</h2>
            <p className="text-sm text-slate-500">
              {profile.total_weekly_sessions} sessions a week, weighted by grade gap and tier risk.
            </p>
          </div>
        </div>
        <span className="flex-none text-slate-400">
          {open ? <ChevronUpIcon className="h-5 w-5" /> : <ChevronDownIcon className="h-5 w-5" />}
        </span>
      </button>

      {open && (
        <div className="mt-4 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {profile.subjects.map((s) => {
            const prio = PRIORITY[s.priority] || PRIORITY.medium;
            const color = subjectColor(s.key);
            return (
              <div key={s.key} className="rounded-xl border border-slate-100 p-3 transition hover:border-slate-200">
                <div className="flex items-center gap-2.5">
                  <span className="grid h-8 w-8 flex-none place-items-center rounded-lg"
                        style={{ backgroundColor: `${color}15`, color }}>
                    <SubjectIcon subject={s.key} className="h-[18px] w-[18px]" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-bold text-slate-800">{s.name}</h3>
                    <p className="text-[11px] text-slate-400">{s.board}</p>
                  </div>
                  <span className={`badge ${prio.cls}`}>{prio.label}</span>
                </div>
                <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                  <span className="font-bold text-slate-700">{s.sessionsPerWeek}×/week</span>
                  <span aria-hidden="true">·</span>
                  <span>
                    Grade {s.current} → <b className="text-emerald-600">{s.target}</b>
                  </span>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">{s.reason}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
