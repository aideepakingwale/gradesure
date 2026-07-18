import { useEffect, useState, useCallback } from "react";
import { api } from "../api.js";
import { subjectColor } from "../utils/ui.js";
import {
  SubjectIcon, LibraryIcon, ExternalLinkIcon, PlusIcon, ResetIcon, FileTextIcon,
} from "../components/icons.jsx";

// Admin console — the master reference library. Subjects → topics → references
// (learning links + past papers). Changes feed every generated plan; the
// "Apply to all plans" action pushes updates into recorded schedules.
export default function Admin() {
  const [overview, setOverview] = useState(null);
  const [subjectKey, setSubjectKey] = useState(null);
  const [topicSlug, setTopicSlug] = useState(""); // '' = subject-level
  const [refs, setRefs] = useState([]);
  const [busyRefresh, setBusyRefresh] = useState(false);
  const [notice, setNotice] = useState("");

  const loadOverview = useCallback(async () => {
    const o = await api.adminRefOverview();
    setOverview(o);
    if (!subjectKey && o.subjects.length) setSubjectKey(o.subjects[0].key);
  }, [subjectKey]);

  useEffect(() => { loadOverview(); }, [loadOverview]);

  const loadRefs = useCallback(async () => {
    if (!subjectKey) return;
    const { references } = await api.adminRefList(subjectKey, topicSlug);
    setRefs(references);
  }, [subjectKey, topicSlug]);

  useEffect(() => { loadRefs(); }, [loadRefs]);

  const subject = overview?.subjects.find((s) => s.key === subjectKey);

  async function refreshPlans() {
    setBusyRefresh(true);
    setNotice("");
    try {
      const { refreshed } = await api.adminRefreshPlans();
      setNotice(`Applied to ${refreshed.length} student plans (${refreshed.reduce((a, r) => a + r.tasks, 0)} tasks refreshed).`);
    } catch (e) {
      setNotice(`Refresh failed: ${e.message}`);
    } finally {
      setBusyRefresh(false);
    }
  }

  if (!overview) return <p className="text-slate-400">Loading reference library…</p>;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="grid h-11 w-11 flex-none place-items-center rounded-xl bg-brand-50 text-brand-600">
            <LibraryIcon className="h-6 w-6" />
          </span>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">Master reference library</h1>
            <p className="text-slate-500">
              Curated links per subject &amp; topic (incl. past papers). Every generated plan reads from here.
            </p>
          </div>
        </div>
        <button className="btn-primary" onClick={refreshPlans} disabled={busyRefresh}>
          <ResetIcon className="h-4 w-4" />
          {busyRefresh ? "Applying…" : "Apply to all plans"}
        </button>
      </div>
      {notice && <p className="mt-3 rounded-lg bg-emerald-50 px-3.5 py-2 text-sm text-emerald-700 ring-1 ring-emerald-100">{notice}</p>}

      <div className="mt-6 grid gap-5 lg:grid-cols-[280px_1fr]">
        {/* subject / topic tree */}
        <div className="card max-h-[70vh] overflow-y-auto p-3">
          {overview.subjects.map((s) => (
            <div key={s.key}>
              <button
                onClick={() => { setSubjectKey(s.key); setTopicSlug(""); }}
                className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm font-semibold transition ${
                  s.key === subjectKey && topicSlug === "" ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <span className="grid h-6 w-6 flex-none place-items-center rounded-md"
                      style={{ backgroundColor: `${subjectColor(s.key)}15`, color: subjectColor(s.key) }}>
                  <SubjectIcon subject={s.key} className="h-3.5 w-3.5" />
                </span>
                <span className="min-w-0 flex-1 truncate">{s.name}</span>
                <span className="text-[10px] text-slate-400">{s.subject_level}</span>
              </button>
              {s.key === subjectKey &&
                s.topics.map((t) => (
                  <button
                    key={t.slug}
                    onClick={() => setTopicSlug(t.slug)}
                    className={`ml-8 flex w-[calc(100%-2rem)] items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left text-xs transition ${
                      topicSlug === t.slug ? "bg-brand-50 font-semibold text-brand-700" : "text-slate-500 hover:bg-slate-50"
                    }`}
                  >
                    <span className="min-w-0 flex-1 truncate">{t.title}</span>
                    <span className={`text-[10px] ${t.refs ? "text-slate-400" : "text-rose-400"}`}>{t.refs}</span>
                  </button>
                ))}
            </div>
          ))}
        </div>

        {/* references editor */}
        <div className="card">
          <h2 className="font-bold text-slate-800">
            {subject?.name}
            <span className="ml-2 text-sm font-medium text-slate-400">
              {topicSlug === "" ? "· subject-level references" : `· ${subject?.topics.find((t) => t.slug === topicSlug)?.title || topicSlug}`}
            </span>
          </h2>

          <div className="mt-4 space-y-2">
            {refs.length === 0 && <p className="text-sm text-slate-400">No references yet — add the first one below.</p>}
            {refs.map((r) => (
              <RefRow key={r.id} r={r} onChanged={() => { loadRefs(); loadOverview(); }} />
            ))}
          </div>

          <AddRefForm
            subjectKey={subjectKey}
            topicSlug={topicSlug || null}
            onAdded={() => { loadRefs(); loadOverview(); }}
          />
        </div>
      </div>
    </div>
  );
}

function RefRow({ r, onChanged }) {
  const [busy, setBusy] = useState(false);
  const act = async (fn) => { setBusy(true); try { await fn(); await onChanged(); } finally { setBusy(false); } };
  return (
    <div className={`flex flex-wrap items-center gap-3 rounded-xl border border-slate-100 px-3.5 py-2.5 ${r.is_active ? "" : "opacity-50"}`}>
      {r.category === "past_papers"
        ? <FileTextIcon className="h-4 w-4 flex-none text-amber-500" title="Past papers" />
        : <LibraryIcon className="h-4 w-4 flex-none text-brand-500" title="Learning" />}
      <div className="min-w-0 flex-1">
        <a href={r.url} target="_blank" rel="noreferrer"
           className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-800 hover:text-brand-700">
          {r.name} <ExternalLinkIcon className="h-3 w-3 text-slate-300" />
        </a>
        <p className="truncate text-xs text-slate-400">{r.tag || r.url}</p>
      </div>
      <button className="btn-ghost px-2.5 py-1 text-xs" disabled={busy}
              onClick={() => act(() => api.adminRefUpdate(r.id, { is_active: !r.is_active }))}>
        {r.is_active ? "Disable" : "Enable"}
      </button>
      <button className="btn px-2.5 py-1 text-xs bg-rose-50 text-rose-600 ring-1 ring-rose-200 hover:bg-rose-100"
              disabled={busy}
              onClick={() => { if (confirm(`Delete "${r.name}"?`)) act(() => api.adminRefDelete(r.id)); }}>
        Delete
      </button>
    </div>
  );
}

function AddRefForm({ subjectKey, topicSlug, onAdded }) {
  const empty = { name: "", url: "", tag: "", category: "learning" };
  const [f, setF] = useState(empty);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function add() {
    setBusy(true);
    setErr("");
    try {
      await api.adminRefCreate({
        subject_key: subjectKey, topic_slug: topicSlug,
        category: f.category, name: f.name, url: f.url, tag: f.tag || null,
      });
      setF(empty);
      await onAdded();
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-5 rounded-xl bg-slate-50 p-4 ring-1 ring-slate-100">
      <p className="text-sm font-bold text-slate-700">Add reference</p>
      {err && <p className="mt-1 text-xs text-rose-600">{err}</p>}
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        <input className="input py-2 text-sm" placeholder="Name (e.g. Corbettmaths — Quadratics)" value={f.name} onChange={set("name")} />
        <input className="input py-2 text-sm" placeholder="https://…" value={f.url} onChange={set("url")} />
        <input className="input py-2 text-sm" placeholder="Short description (optional)" value={f.tag} onChange={set("tag")} />
        <div className="flex gap-2">
          <select className="input flex-1 py-2 text-sm" value={f.category} onChange={set("category")}>
            <option value="learning">Learning resource</option>
            <option value="past_papers">Past papers</option>
          </select>
          <button className="btn-primary px-4 py-2 text-sm" onClick={add}
                  disabled={busy || f.name.length < 2 || !/^https?:\/\//.test(f.url)}>
            <PlusIcon className="h-4 w-4" /> Add
          </button>
        </div>
      </div>
    </div>
  );
}
