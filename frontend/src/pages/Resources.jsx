import { useEffect, useState } from "react";
import { api } from "../api.js";
import { subjectColor } from "../utils/ui.js";
import { SubjectIcon, ExternalLinkIcon, LibraryIcon, AlertIcon } from "../components/icons.jsx";

// Curated free-resource directory, grouped by subject with proper icons.
export default function Resources() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.getResources().then(setData);
  }, []);

  if (!data) return <p className="text-slate-400">Loading resources…</p>;

  const subjects = Object.entries(data.by_subject);

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-slate-900">Free resource directory</h1>
      <p className="mt-1 text-slate-500">
        Curated, exam-board-matched and free. These are the core of the digital curriculum — bookmark them.
      </p>

      <section className="mt-7">
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-50 text-brand-600">
            <LibraryIcon className="h-5 w-5" />
          </span>
          <h2 className="text-lg font-bold text-slate-900">Cross-subject essentials</h2>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.general.map((r) => (
            <ResourceCard key={r.name} r={r} />
          ))}
        </div>
      </section>

      <section className="mt-9 space-y-6">
        {subjects.map(([key, block]) => {
          const color = subjectColor(key);
          return (
            <div key={key} className="card">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="grid h-9 w-9 place-items-center rounded-lg"
                        style={{ backgroundColor: `${color}15`, color }}>
                    <SubjectIcon subject={key} className="h-5 w-5" />
                  </span>
                  <h2 className="text-lg font-bold text-slate-900">{block.subject}</h2>
                </div>
                <span className="badge bg-slate-100 text-slate-600">{block.board}</span>
              </div>
              {block.note && (
                <p className="mt-3 flex items-start gap-2 rounded-lg bg-amber-50 px-3.5 py-2.5 text-sm text-amber-700 ring-1 ring-amber-100">
                  <AlertIcon className="mt-0.5 h-4 w-4 flex-none" /> {block.note}
                </p>
              )}
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {block.resources.map((r) => (
                  <ResourceCard key={r.name} r={r} />
                ))}
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}

function ResourceCard({ r }) {
  return (
    <a
      href={r.url}
      target="_blank"
      rel="noreferrer"
      className="group block rounded-xl border border-slate-200 bg-white p-4 transition hover:border-brand-300 hover:shadow-sm"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-slate-800 group-hover:text-brand-700">{r.name}</h3>
        <ExternalLinkIcon className="mt-0.5 h-4 w-4 flex-none text-slate-300 transition group-hover:text-brand-500" />
      </div>
      <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-brand-600">{r.type}</p>
      <p className="mt-1 text-sm text-slate-500">{r.tag}</p>
    </a>
  );
}
