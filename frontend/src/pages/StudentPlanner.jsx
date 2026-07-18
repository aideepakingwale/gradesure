import { useEffect, useState, useCallback } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api.js";
import { parseIso, startOfWeek, monthGridStart, todayIso } from "../utils/dates.js";
import { NEXT_STATUS } from "../utils/ui.js";
import CalendarHeader from "../components/calendar/CalendarHeader.jsx";
import MonthView from "../components/calendar/MonthView.jsx";
import WeekView from "../components/calendar/WeekView.jsx";
import DayView from "../components/calendar/DayView.jsx";
import PersonalizationPanel from "../components/PersonalizationPanel.jsx";
import StudyGuidePanel from "../components/StudyGuidePanel.jsx";
import EvaluationPanel from "../components/EvaluationPanel.jsx";
import { ArrowLeftIcon, ChartBarIcon } from "../components/icons.jsx";

// Window (start date + day count) that a given view needs loaded.
function windowFor(view, anchorIso) {
  const a = parseIso(anchorIso);
  if (view === "month") return { start: isoOf(monthGridStart(a)), days: 42 };
  if (view === "week") return { start: isoOf(startOfWeek(a)), days: 7 };
  return { start: anchorIso, days: 1 };
}
function isoOf(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function StudentPlanner() {
  const { id } = useParams();
  const [student, setStudent] = useState(null);
  const [profile, setProfile] = useState(null);
  const [resources, setResources] = useState({});
  const [daysMap, setDaysMap] = useState({});
  const [aiPlan, setAiPlan] = useState(null);
  const [evals, setEvals] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [view, setView] = useState("week");
  const [anchor, setAnchor] = useState(todayIso());
  const [loading, setLoading] = useState(true);

  // One-time context load.
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const [{ student }, res, prof, current, evaluations] = await Promise.all([
          api.getStudent(id),
          api.getResources(),
          api.getProfile(id),
          api.getCurrentPlan(id).catch(() => ({ plan: null })),
          api.getEvaluations(id, 4).catch(() => null),
        ]);
        if (!alive) return;
        setStudent(student);
        setResources(res.by_subject || {});
        setProfile(prof);
        setAiPlan(current?.plan || null);
        setEvals(evaluations);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [id]);

  // Fetch the plan window whenever view/anchor changes.
  const loadWindow = useCallback(async () => {
    const { start, days } = windowFor(view, anchor);
    const { plan } = await api.getPlan(id, start, days);
    setDaysMap((prev) => {
      const next = { ...prev };
      plan.forEach((d) => { next[d.date] = d; });
      return next;
    });
  }, [id, view, anchor]);

  useEffect(() => { loadWindow(); }, [loadWindow]);

  // Set an explicit status (+ optional note) — used by DayView.
  const onSetStatus = useCallback(
    async (dayIso, task, nextStatus, note) => {
      setDaysMap((prev) => {
        const day = prev[dayIso];
        if (!day) return prev;
        return {
          ...prev,
          [dayIso]: {
            ...day,
            tasks: day.tasks.map((t) =>
              t.subject_key === task.subject_key && t.topic_slug === task.topic_slug
                ? { ...t, status: nextStatus, note: note ?? t.note }
                : t
            ),
          },
        };
      });
      try {
        await api.saveProgress(id, {
          task_date: dayIso,
          subject_key: task.subject_key,
          topic_slug: task.topic_slug,
          status: nextStatus,
          minutes_spent: task.minutes_spent || 0,
          note: note ?? task.note ?? null,
        });
      } catch {
        loadWindow();
      }
    },
    [id, loadWindow]
  );

  // Quick-tap cycle — used by WeekView.
  const onToggle = useCallback(
    (dayIso, task) => onSetStatus(dayIso, task, NEXT_STATUS[task.status || "not_started"], task.note),
    [onSetStatus]
  );

  const onGenerate = useCallback(async () => {
    setGenerating(true);
    try {
      const { plan } = await api.generatePlan(id);
      setAiPlan(plan);
    } catch (err) {
      alert(`Plan generation failed: ${err.message}`);
    } finally {
      setGenerating(false);
    }
  }, [id]);

  const openDay = useCallback((dayIso) => {
    setAnchor(dayIso);
    setView("day");
  }, []);

  if (loading) return <p className="text-slate-400">Loading planner…</p>;
  if (!student) return <p className="text-slate-400">Student not found.</p>;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link to="/app" className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:underline">
            <ArrowLeftIcon className="h-3.5 w-3.5" /> All students
          </Link>
          <h1 className="mt-1 text-2xl font-extrabold text-slate-900">{student.full_name}'s Grade 9 Planner</h1>
          <p className="text-slate-500">{student.school} · Year {student.year_group} · {student.exam_series}</p>
        </div>
        <Link to={`/app/students/${id}/analytics`} className="btn-ghost">
          <ChartBarIcon className="h-4 w-4" /> View analytics
        </Link>
      </div>

      <StudyGuidePanel plan={aiPlan} onGenerate={onGenerate} generating={generating} />
      {evals?.evaluations?.some((e) => e.expected > 0) && (
        <EvaluationPanel evaluations={evals.evaluations} latest={evals.latest} />
      )}
      <PersonalizationPanel profile={profile} />

      <CalendarHeader
        view={view}
        setView={setView}
        anchor={anchor}
        setAnchor={setAnchor}
        onToday={() => setAnchor(todayIso())}
      />

      {view === "month" && (
        <MonthView anchor={anchor} daysMap={daysMap} onOpenDay={openDay} />
      )}
      {view === "week" && (
        <WeekView anchor={anchor} daysMap={daysMap} onToggle={onToggle} onOpenDay={openDay} />
      )}
      {view === "day" && (
        <DayView dayIso={anchor} day={daysMap[anchor]} resources={resources} onSetStatus={onSetStatus} />
      )}
    </div>
  );
}
