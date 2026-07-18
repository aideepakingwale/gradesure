import { TrendingUpIcon } from "./icons.jsx";

const VERDICT = {
  on_track: { label: "On track", cls: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200", bar: "bg-emerald-500" },
  at_risk: { label: "At risk", cls: "bg-amber-50 text-amber-700 ring-1 ring-amber-200", bar: "bg-amber-400" },
  off_track: { label: "Off track", cls: "bg-rose-50 text-rose-700 ring-1 ring-rose-200", bar: "bg-rose-400" },
};

function fmt(d) {
  return new Date(`${d}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

// Fortnightly adherence checkpoints: is the plan working & being followed?
export default function EvaluationPanel({ evaluations, latest }) {
  if (!evaluations?.length) return null;
  const v = VERDICT[latest?.verdict] || VERDICT.off_track;

  return (
    <div className="card mt-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="grid h-11 w-11 flex-none place-items-center rounded-xl bg-brand-50 text-brand-600">
            <TrendingUpIcon className="h-6 w-6" />
          </span>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Plan check-ins</h2>
            <p className="text-sm text-slate-500">Fortnightly adherence — is the plan being followed?</p>
          </div>
        </div>
        <span className={`badge ${v.cls}`}>{v.label} · {latest.adherence_pct}%</span>
      </div>

      {latest?.message && (
        <p className={`mt-4 rounded-lg px-3.5 py-2.5 text-sm ${v.cls}`}>{latest.message}</p>
      )}

      <div className="mt-4 space-y-2.5">
        {evaluations.map((e) => {
          const ev = VERDICT[e.verdict] || VERDICT.off_track;
          return (
            <div key={e.period_start} className="flex items-center gap-3">
              <span className="w-28 flex-none text-xs tabular-nums text-slate-400 sm:w-32">
                {fmt(e.period_start)} – {fmt(e.period_end)}
              </span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                <div className={`h-full rounded-full ${ev.bar}`} style={{ width: `${Math.min(e.adherence_pct, 100)}%` }} />
              </div>
              <span className="w-20 flex-none text-right text-xs tabular-nums text-slate-500">
                {e.completed}/{e.expected} · {e.adherence_pct}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
