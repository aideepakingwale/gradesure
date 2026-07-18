import { useState } from "react";
import { longLabel } from "../../utils/dates.js";
import { STATUS, PRIORITY, ACTIVITY_LABELS, subjectColor } from "../../utils/ui.js";
import {
  SubjectIcon, ActivityIcon, ClockIcon, PlayIcon, CheckIcon, PauseIcon,
  ResetIcon, NoteIcon, ExternalLinkIcon,
} from "../icons.jsx";

// Day view — full task cards: subject icon, time block, activity kind,
// priority, resources, a 4-state status control and free-text notes.
export default function DayView({ dayIso, day, resources, onSetStatus }) {
  if (!day) return <div className="card mt-4 text-slate-400">Loading day…</div>;

  const total = day.tasks.length;
  const done = day.tasks.filter((t) => t.status === "completed").length;

  return (
    <div className="mt-4 rounded-xl border border-slate-200 bg-white shadow-sm">
      {/* day header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900">{longLabel(dayIso)}</h3>
          <p className="mt-0.5 text-sm text-slate-500">{day.mode}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="badge bg-brand-50 text-brand-700 ring-1 ring-brand-100">{day.phase?.name}</span>
          <span className="badge bg-slate-100 text-slate-600">
            {day.is_school_day ? "Evening routine" : "Morning routine"}
          </span>
          <span className={`badge ${done === total && total ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
            {done}/{total} completed
          </span>
        </div>
      </div>

      {total === 0 ? (
        <p className="p-8 text-center text-slate-400">No scheduled sessions — a rest day.</p>
      ) : (
        <div className="divide-y divide-slate-100">
          {day.tasks.map((task) => (
            <TaskRow
              key={`${task.subject_key}-${task.topic_slug}`}
              task={task}
              dayIso={dayIso}
              resources={resources}
              onSetStatus={onSetStatus}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function TaskRow({ task, dayIso, resources, onSetStatus }) {
  const [noteOpen, setNoteOpen] = useState(false);
  const [note, setNote] = useState(task.note || "");
  const status = STATUS[task.status] || STATUS.not_started;
  const prio = PRIORITY[task.priority] || PRIORITY.medium;
  const color = subjectColor(task.subject_key);
  // Prefer the resources RECORDED on the plan row; fall back to the directory.
  const subjectRes = task.resources?.length
    ? task.resources
    : resources[task.subject_key]?.resources || [];

  const set = (next, withNote = note) => onSetStatus(dayIso, task, next, withNote || null);
  const saveNote = () => {
    set(task.status === "not_started" && note ? "in_progress" : task.status);
    setNoteOpen(false);
  };

  const actionBtn = "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition";

  return (
    <div className="px-5 py-4">
      <div className="flex flex-wrap items-start gap-4">
        {/* subject icon block */}
        <span className="grid h-11 w-11 flex-none place-items-center rounded-xl"
              style={{ backgroundColor: `${color}15`, color }}>
          <SubjectIcon subject={task.subject_key} className="h-6 w-6" />
        </span>

        {/* body */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              {task.subject_name} · {task.board}
            </span>
            <span className={`badge ${prio.cls}`}>{prio.label}</span>
          </div>
          <h4 className="mt-0.5 font-bold text-slate-800">{task.topic_title}</h4>
          {task.hint && <p className="mt-0.5 text-sm text-slate-500">{task.hint}</p>}

          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <ClockIcon className="h-3.5 w-3.5 text-slate-400" /> {task.time_block}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <ActivityIcon activity={task.activity} className="h-3.5 w-3.5 text-slate-400" />
              {ACTIVITY_LABELS[task.activity] || "Study"}
            </span>
          </div>

          {subjectRes.length > 0 && (
            <div className="mt-2.5 flex flex-wrap gap-2">
              {subjectRes.slice(0, 3).map((r) => (
                <a key={r.name} href={r.url} target="_blank" rel="noreferrer"
                   className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-brand-700 transition hover:border-brand-200 hover:bg-brand-50">
                  {r.name}
                  <ExternalLinkIcon className="h-3 w-3 text-slate-400" />
                </a>
              ))}
            </div>
          )}

          {task.note && !noteOpen && (
            <p className="mt-2.5 inline-flex items-start gap-1.5 rounded-lg bg-slate-50 px-3 py-1.5 text-xs text-slate-500 ring-1 ring-slate-100">
              <NoteIcon className="mt-px h-3.5 w-3.5 flex-none text-slate-400" /> {task.note}
            </p>
          )}
        </div>

        {/* status + actions */}
        <div className="flex w-full flex-col items-start gap-2 sm:w-auto sm:items-end">
          <span className={`badge ${status.cls}`}>{status.label}</span>
          <div className="flex flex-wrap gap-1.5">
            {task.status !== "in_progress" && (
              <button className={`${actionBtn} border border-slate-200 bg-white text-slate-600 hover:bg-slate-50`}
                      onClick={() => set("in_progress")}>
                <PlayIcon className="h-3.5 w-3.5" /> Start
              </button>
            )}
            {task.status !== "completed" && (
              <button className={`${actionBtn} bg-emerald-600 text-white hover:bg-emerald-700`}
                      onClick={() => set("completed")}>
                <CheckIcon className="h-3.5 w-3.5" /> Complete
              </button>
            )}
            {task.status !== "halted" && (
              <button className={`${actionBtn} border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100`}
                      onClick={() => { setNoteOpen(true); set("halted"); }}>
                <PauseIcon className="h-3.5 w-3.5" /> Halt
              </button>
            )}
            {task.status !== "not_started" && (
              <button className={`${actionBtn} border border-slate-200 bg-white text-slate-500 hover:bg-slate-50`}
                      onClick={() => set("not_started")}>
                <ResetIcon className="h-3.5 w-3.5" /> Reset
              </button>
            )}
            <button className={`${actionBtn} border border-slate-200 bg-white text-slate-500 hover:bg-slate-50`}
                    onClick={() => setNoteOpen((o) => !o)}>
              <NoteIcon className="h-3.5 w-3.5" /> Note
            </button>
          </div>
        </div>
      </div>

      {noteOpen && (
        <div className="mt-3 sm:pl-[60px]">
          <textarea
            className="input min-h-[70px] text-sm"
            placeholder={task.status === "halted" ? "Why is this halted? (e.g. topic not covered in class yet)" : "Add a note…"}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={1000}
          />
          <div className="mt-2 flex gap-2">
            <button className="btn-primary px-4 py-1.5 text-xs" onClick={saveNote}>Save note</button>
            <button className="btn-ghost px-4 py-1.5 text-xs" onClick={() => setNoteOpen(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
