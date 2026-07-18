import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  LineChart, Line, Cell,
} from "recharts";
import { api } from "../api.js";
import EvaluationPanel from "../components/EvaluationPanel.jsx";
import { ArrowLeftIcon } from "../components/icons.jsx";

export default function Analytics() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [student, setStudent] = useState(null);
  const [evals, setEvals] = useState(null);

  useEffect(() => {
    async function load() {
      const [{ student }, analytics, evaluations] = await Promise.all([
        api.getStudent(id),
        api.getAnalytics(id, 60),
        api.getEvaluations(id, 6).catch(() => null),
      ]);
      setStudent(student);
      setData(analytics);
      setEvals(evaluations);
    }
    load();
  }, [id]);

  if (!data) return <p className="text-slate-400">Crunching the numbers…</p>;

  const { summary, per_subject, daily } = data;

  // cumulative completion trajectory
  let running = 0;
  const trajectory = daily.map((d) => {
    running += d.completed;
    return { date: d.date.slice(5), completed: running };
  });

  const barColor = (pct) => (pct >= 75 ? "#10b981" : pct >= 40 ? "#f59e0b" : "#f43f5e");

  return (
    <div>
      <Link to={`/app/students/${id}`} className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:underline">
        <ArrowLeftIcon className="h-3.5 w-3.5" /> Back to planner
      </Link>
      <h1 className="mt-1 text-2xl font-extrabold text-slate-800">
        {student?.full_name} · Progress analytics
      </h1>
      <p className="text-slate-500">Rolling {summary ? data.window.days : 60}-day window.</p>

      {/* KPI tiles */}
      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Overall completion" value={`${summary.completion_pct}%`} accent="brand" />
        <Kpi label="Tasks completed" value={summary.completed} sub={`of ${summary.total_tasks}`} accent="emerald" />
        <Kpi label="In progress" value={summary.in_progress} accent="amber" />
        <Kpi label="Study time" value={`${summary.total_hours}h`} sub="logged" accent="brand" />
      </div>

      {evals?.evaluations?.some((e) => e.expected > 0) && (
        <EvaluationPanel evaluations={evals.evaluations} latest={evals.latest} />
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="card">
          <h3 className="font-bold text-slate-800">Completion trajectory</h3>
          <p className="text-sm text-slate-500">Cumulative tasks completed over the window.</p>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trajectory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef2ff" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} interval={Math.ceil(trajectory.length / 8)} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="completed" stroke="#4f46e5" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h3 className="font-bold text-slate-800">Completion by subject</h3>
          <p className="text-sm text-slate-500">Percentage of scheduled tasks completed.</p>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={per_subject} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef2ff" />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="subject_name" width={120} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => `${v}%`} />
                <Bar dataKey="completion_pct" radius={[0, 6, 6, 0]}>
                  {per_subject.map((s, i) => (
                    <Cell key={i} fill={barColor(s.completion_pct)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="card mt-6">
        <h3 className="font-bold text-slate-800">Per-subject detail</h3>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-slate-400">
              <tr>
                <th className="py-2">Subject</th>
                <th>Completed</th>
                <th>Scheduled</th>
                <th>Completion</th>
                <th>Minutes</th>
              </tr>
            </thead>
            <tbody>
              {per_subject.map((s) => (
                <tr key={s.subject_key} className="border-t border-slate-100">
                  <td className="py-2 font-semibold text-slate-700">{s.subject_name}</td>
                  <td>{s.completed}</td>
                  <td>{s.total}</td>
                  <td>
                    <span className="badge" style={{ background: `${barColor(s.completion_pct)}22`, color: barColor(s.completion_pct) }}>
                      {s.completion_pct}%
                    </span>
                  </td>
                  <td>{s.minutes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Kpi({ label, value, sub, accent = "brand" }) {
  const ring = {
    brand: "ring-brand-100", emerald: "ring-emerald-100", amber: "ring-amber-100",
  }[accent];
  return (
    <div className={`card ring-2 ${ring}`}>
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-3xl font-extrabold text-slate-800">{value}</p>
      {sub && <p className="text-xs text-slate-400">{sub}</p>}
    </div>
  );
}
