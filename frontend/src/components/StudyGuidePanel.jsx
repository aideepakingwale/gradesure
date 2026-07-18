import { useState } from "react";
import { subjectColor } from "../utils/ui.js";
import {
  SparklesIcon, SubjectIcon, ExternalLinkIcon, ChevronDownIcon, ChevronUpIcon,
  BoltIcon, ResetIcon,
} from "./icons.jsx";

const PROVIDER_BADGE = {
  groq: { label: "Groq AI", cls: "bg-orange-50 text-orange-700 ring-1 ring-orange-200" },
  gemini: { label: "Gemini AI", cls: "bg-sky-50 text-sky-700 ring-1 ring-sky-200" },
  "rule-based": { label: "Built-in engine", cls: "bg-slate-100 text-slate-600 ring-1 ring-slate-200" },
};

// The persisted AI-generated study guide + a generate/regenerate action.
export default function StudyGuidePanel({ plan, onGenerate, generating }) {
  const [open, setOpen] = useState(true);

  if (!plan) {
    return (
      <div className="card mt-5 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="grid h-11 w-11 flex-none place-items-center rounded-xl bg-brand-50 text-brand-600">
            <SparklesIcon className="h-6 w-6" />
          </span>
          <div>
            <h2 className="text-lg font-bold text-slate-900">AI study guide</h2>
            <p className="text-sm text-slate-500">
              Generate a personalised guide from current grades, targets, tier risk and term dates —
              saved to the account so it loads instantly next time.
            </p>
          </div>
        </div>
        <button className="btn-primary flex-none" onClick={onGenerate} disabled={generating}>
          <BoltIcon className="h-4 w-4" />
          {generating ? "Generating…" : "Generate plan"}
        </button>
      </div>
    );
  }

  const g = plan.guide || {};
  const provider = PROVIDER_BADGE[plan.generated_by] || PROVIDER_BADGE["rule-based"];
  const rubric = g.evaluation_rubric;

  return (
    <div className="card mt-5">
      <button className="flex w-full items-start justify-between gap-3 text-left" onClick={() => setOpen((o) => !o)}>
        <div className="flex items-start gap-3">
          <span className="grid h-11 w-11 flex-none place-items-center rounded-xl bg-brand-50 text-brand-600">
            <SparklesIcon className="h-6 w-6" />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">{g.headline || "Your AI study guide"}</h2>
              <span className={`badge ${provider.cls}`}>{provider.label}</span>
            </div>
            <p className="mt-1 text-sm text-slate-500">{g.summary}</p>
          </div>
        </div>
        <span className="mt-1 flex-none text-slate-400">
          {open ? <ChevronUpIcon className="h-5 w-5" /> : <ChevronDownIcon className="h-5 w-5" />}
        </span>
      </button>

      {open && (
        <>
          {Array.isArray(g.subjects) && g.subjects.length > 0 && (
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {g.subjects.map((s) => {
                const color = subjectColor(s.key);
                return (
                  <div key={s.key} className="rounded-xl border border-slate-100 p-3.5 transition hover:border-slate-200">
                    <div className="flex items-center gap-2.5">
                      <span className="grid h-8 w-8 flex-none place-items-center rounded-lg"
                            style={{ backgroundColor: `${color}15`, color }}>
                        <SubjectIcon subject={s.key} className="h-[18px] w-[18px]" />
                      </span>
                      <h3 className="text-sm font-bold text-slate-800">{s.name}</h3>
                    </div>
                    {s.focus && <p className="mt-2 text-xs font-semibold text-brand-700">{s.focus}</p>}
                    {s.strategy && <p className="mt-1 text-xs leading-relaxed text-slate-500">{s.strategy}</p>}
                    {Array.isArray(s.resources) && s.resources.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
                        {s.resources.map((r) => (
                          <a key={r.name} href={r.url} target="_blank" rel="noreferrer"
                             className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:underline">
                            {r.name} <ExternalLinkIcon className="h-3 w-3 text-slate-400" />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {Array.isArray(g.techniques) && g.techniques.length > 0 && (
            <div className="mt-5">
              <h3 className="text-sm font-bold text-slate-700">Grade-9 techniques</h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {g.techniques.map((t) => (
                  <span key={t.name} title={t.description}
                        className="badge bg-brand-50 text-brand-700 ring-1 ring-brand-100">
                    {t.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {rubric && (
            <div className="mt-4 rounded-xl bg-slate-50 p-3.5 text-xs text-slate-500 ring-1 ring-slate-100">
              <b className="text-slate-700">Evaluation rubric</b> · {rubric.cadence} —{" "}
              <span className="font-medium text-emerald-600">{rubric.on_track}</span> ·{" "}
              <span className="font-medium text-amber-600">{rubric.at_risk}</span> ·{" "}
              <span className="font-medium text-rose-600">{rubric.off_track}</span>
            </div>
          )}

          <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
            <span>Saved {new Date(plan.created_at).toLocaleDateString("en-GB")}{plan.model ? ` · ${plan.model}` : ""}</span>
            <button className="btn-ghost gap-1.5 px-3 py-1.5 text-xs" onClick={onGenerate} disabled={generating}>
              <ResetIcon className="h-3.5 w-3.5" />
              {generating ? "Regenerating…" : "Regenerate"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
