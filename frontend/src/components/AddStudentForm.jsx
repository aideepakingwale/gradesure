import { useEffect, useState } from "react";
import { api } from "../api.js";
import { AlertIcon } from "./icons.jsx";

// Guided student onboarding: basics → term dates → subjects. Everything is
// year-agnostic: the calendar defaults come from the server for the chosen
// year group's exam series, and subjects are catalog-driven (standard boards,
// tier only where UK GCSEs are tiered, validated grades).
export default function AddStudentForm({ onDone, onCancel }) {
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [catalog, setCatalog] = useState(null); // { boards, subjects, tier_grades }

  const [basics, setBasics] = useState({
    full_name: "", school: "Lampton School", year_group: 11,
    exam_series: "", exam_start: "", exam_end: "",
  });
  const [terms, setTerms] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [subjects, setSubjects] = useState([]);

  // Load the UK GCSE catalog (boards, tiering rules, grade ranges).
  useEffect(() => {
    api.getCatalog().then((cat) => {
      setCatalog(cat);
      setSubjects(
        cat.subjects.map((s) => ({
          key: s.key,
          name: s.name,
          tiered: s.tiered,
          board: s.defaultBoard,
          tier: s.tiered ? "Higher" : null, // neutral default: uncapped entry
          current: "",                       // parent selects — no fixed prefill
          target: "9",                       // aspirational default, editable
          enabled: s.core,
        }))
      );
    }).catch((e) => setError(e.message));
  }, []);

  // Load dynamic calendar defaults for the exam series of the chosen year group.
  useEffect(() => {
    let alive = true;
    api.getCalendarDefaults(basics.year_group).then((def) => {
      if (!alive) return;
      setBasics((b) => ({ ...b, exam_series: def.exam_series, exam_start: def.exam_start, exam_end: def.exam_end }));
      setTerms(def.term_dates);
      setHolidays(def.holidays);
    }).catch((e) => setError(e.message));
    return () => { alive = false; };
  }, [basics.year_group]);

  const setB = (k) => (e) => setBasics({ ...basics, [k]: e.target.value });
  const setTerm = (i, k) => (e) => setTerms(terms.map((t, j) => (j === i ? { ...t, [k]: e.target.value } : t)));
  const setSub = (i, k) => (e) => {
    const v = e.target.value;
    setSubjects(subjects.map((s, j) => {
      if (j !== i) return s;
      const next = { ...s, [k]: v };
      // Foundation awards 1–5 only: clamp an out-of-range current grade.
      if (k === "tier" && v === "Foundation" && next.current && Number(next.current) > 5) next.current = "";
      return next;
    }));
  };
  const toggleSub = (i) => () => setSubjects(subjects.map((s, j) => (j === i ? { ...s, enabled: !s.enabled } : s)));

  const gradesFor = (s) => {
    if (!catalog) return [];
    if (s.tiered && s.tier) return catalog.tier_grades[s.tier];
    return catalog.tier_grades.none;
  };

  async function submit() {
    setBusy(true);
    setError("");
    try {
      const { student } = await api.createStudent({
        full_name: basics.full_name,
        school: basics.school,
        year_group: Number(basics.year_group),
        exam_series: basics.exam_series,
        exam_start: basics.exam_start || null,
        exam_end: basics.exam_end || null,
        term_dates: terms,
        holidays,
      });
      for (const s of subjects.filter((x) => x.enabled)) {
        await api.upsertSubject(student.id, {
          subject_key: s.key,
          subject_name: s.name,
          exam_board: s.board,
          tier: s.tiered ? s.tier : null,
          current_grade: s.current || null,
          target_grade: s.target,
        });
      }
      onDone(student);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  const steps = ["Student", "Term dates", "Subjects & grades"];
  const enabledCount = subjects.filter((s) => s.enabled).length;

  return (
    <div className="card mt-5">
      {/* Stepper */}
      <div className="flex items-center gap-2">
        {steps.map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <span className={`grid h-7 w-7 place-items-center rounded-full text-xs font-bold ${
              i <= step ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-400"
            }`}>{i + 1}</span>
            <span className={`hidden text-sm font-semibold sm:inline ${i <= step ? "text-slate-700" : "text-slate-400"}`}>
              {label}
            </span>
            {i < steps.length - 1 && <span className="mx-1 h-px w-6 bg-slate-200" />}
          </div>
        ))}
      </div>

      {error && <div className="mt-3 rounded-lg bg-accent-500/10 px-3 py-2 text-sm text-accent-500">{error}</div>}

      {step === 0 && (
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label">Child's full name</label>
            <input className="input" value={basics.full_name} onChange={setB("full_name")} placeholder="e.g. Aanya" minLength={2} required />
          </div>
          <div>
            <label className="label">School</label>
            <input className="input" value={basics.school} onChange={setB("school")} />
          </div>
          <div>
            <label className="label">Year group</label>
            <select className="input" value={basics.year_group} onChange={setB("year_group")}>
              {[9, 10, 11].map((y) => <option key={y} value={y}>Year {y}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Exam series</label>
            <input className="input" value={basics.exam_series} onChange={setB("exam_series")} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Exams start</label>
              <input className="input" type="date" value={basics.exam_start} onChange={setB("exam_start")} />
            </div>
            <div>
              <label className="label">Exams end</label>
              <input className="input" type="date" value={basics.exam_end} onChange={setB("exam_end")} />
            </div>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="mt-5">
          <p className="text-sm text-slate-500">
            School term dates shape the plan: school days get evening sessions, holidays get morning
            deep-work. Pre-filled for the <b>{basics.exam_series || "exam"}</b> series — adjust to your school.
          </p>
          <div className="mt-3 space-y-2">
            {terms.map((t, i) => (
              <div key={i} className="grid grid-cols-1 gap-2 rounded-xl border border-slate-100 p-3 sm:grid-cols-3">
                <input className="input" value={t.name} onChange={setTerm(i, "name")} placeholder="Term name" />
                <input className="input" type="date" value={t.start} onChange={setTerm(i, "start")} />
                <input className="input" type="date" value={t.end} onChange={setTerm(i, "end")} />
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-slate-400">Standard half-term and seasonal holidays are included automatically.</p>
        </div>
      )}

      {step === 2 && (
        <div className="mt-5">
          <p className="text-sm text-slate-500">
            Tick the GCSEs your child is taking and set the board, tier and grades.
            <b className="text-slate-600"> Tier applies only to Maths, the Sciences, languages and
            Statistics</b> — other subjects are untiered (one paper, grades 1–9).
          </p>
          <p className="mt-1.5 flex items-start gap-1.5 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700 ring-1 ring-amber-100">
            <AlertIcon className="mt-px h-3.5 w-3.5 flex-none" />
            Foundation tier can only award grades 1–5. If the target is 6+, the student needs Higher-tier entry.
          </p>

          {!catalog ? (
            <p className="mt-4 text-sm text-slate-400">Loading subject catalog…</p>
          ) : (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[680px] text-left text-sm">
                <thead className="text-xs uppercase tracking-wide text-slate-400">
                  <tr>
                    <th className="py-2 pr-2"></th>
                    <th className="py-2 pr-2">Subject</th>
                    <th className="pr-2">Exam board</th>
                    <th className="pr-2">Tier</th>
                    <th className="pr-2">Current</th>
                    <th>Target</th>
                  </tr>
                </thead>
                <tbody>
                  {subjects.map((s, i) => (
                    <tr key={s.key} className={`border-t border-slate-100 ${s.enabled ? "" : "opacity-40"}`}>
                      <td className="py-2 pr-2">
                        <input type="checkbox" checked={s.enabled} onChange={toggleSub(i)} />
                      </td>
                      <td className="py-2 pr-2 font-semibold text-slate-700">{s.name}</td>
                      <td className="pr-2">
                        <select className="input px-2 py-1.5" value={s.board} onChange={setSub(i, "board")} disabled={!s.enabled}>
                          {catalog.boards.map((b) => <option key={b}>{b}</option>)}
                        </select>
                      </td>
                      <td className="pr-2">
                        {s.tiered ? (
                          <select className="input px-2 py-1.5" value={s.tier || "Higher"} onChange={setSub(i, "tier")} disabled={!s.enabled}>
                            <option value="Higher">Higher</option>
                            <option value="Foundation">Foundation</option>
                          </select>
                        ) : (
                          <span className="text-xs text-slate-400">n/a — untiered</span>
                        )}
                      </td>
                      <td className="pr-2">
                        <select className="input px-2 py-1.5" value={s.current} onChange={setSub(i, "current")} disabled={!s.enabled}>
                          <option value="">Not set</option>
                          {gradesFor(s).map((g) => <option key={g}>{g}</option>)}
                        </select>
                      </td>
                      <td>
                        <select className="input px-2 py-1.5" value={s.target} onChange={setSub(i, "target")} disabled={!s.enabled}>
                          {catalog.tier_grades.none.map((g) => <option key={g}>{g}</option>)}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-2">
        <button type="button" className="btn-ghost" onClick={step === 0 ? onCancel : () => setStep(step - 1)}>
          {step === 0 ? "Cancel" : "← Back"}
        </button>
        {step === 2 && <span className="text-xs text-slate-400">{enabledCount} subjects selected</span>}
        {step < 2 ? (
          <button
            type="button"
            className="btn-primary"
            disabled={step === 0 && basics.full_name.trim().length < 2}
            onClick={() => setStep(step + 1)}
          >
            Next →
          </button>
        ) : (
          <button type="button" className="btn-primary" onClick={submit} disabled={busy || enabledCount === 0}>
            {busy ? "Creating profile…" : "✓ Create profile"}
          </button>
        )}
      </div>
    </div>
  );
}
