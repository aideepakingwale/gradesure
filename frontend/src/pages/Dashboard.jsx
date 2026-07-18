import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";
import AddStudentForm from "../components/AddStudentForm.jsx";
import { PlusIcon, GraduationCapIcon, ChartBarIcon, CalendarIcon } from "../components/icons.jsx";

export default function Dashboard() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const { students } = await api.listStudents();
      setStudents(students);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, []);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800">Student profiles</h1>
          <p className="text-slate-500">Create a child profile, then open their Grade 9 planner.</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm((v) => !v)}>
          <PlusIcon className="h-4 w-4" /> New student profile
        </button>
      </div>

      {showForm && (
        <AddStudentForm
          onCancel={() => setShowForm(false)}
          onDone={async () => {
            setShowForm(false);
            await load();
          }}
        />
      )}

      {loading ? (
        <p className="mt-8 text-slate-400">Loading…</p>
      ) : students.length === 0 && !showForm ? (
        <div className="card mt-8 text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-brand-50 text-brand-600">
            <GraduationCapIcon className="h-8 w-8" />
          </div>
          <h2 className="mt-3 font-bold text-slate-700">No student profiles yet</h2>
          <p className="mt-1 text-sm text-slate-500">
            Add your child's school, subjects, grades and term dates — the AI builds the plan from there.
          </p>
          <button className="btn-primary mt-4" onClick={() => setShowForm(true)}>Add your first student</button>
        </div>
      ) : (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {students.map((s) => (
            <StudentCard key={s.id} student={s} />
          ))}
        </div>
      )}
    </div>
  );
}

function StudentCard({ student }) {
  return (
    <div className="card flex flex-col">
      <div className="flex items-center gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-full bg-brand-100 text-lg font-bold text-brand-700">
          {student.full_name.charAt(0).toUpperCase()}
        </div>
        <div>
          <h3 className="font-bold text-slate-800">{student.full_name}</h3>
          <p className="text-xs text-slate-500">
            {student.school} · Year {student.year_group}
          </p>
        </div>
      </div>
      <p className="mt-3 text-sm text-slate-500">Exam series: {student.exam_series}</p>
      <div className="mt-5 flex gap-2">
        <Link to={`/app/students/${student.id}`} className="btn-primary flex-1 text-sm">
          <CalendarIcon className="h-4 w-4" /> Open planner
        </Link>
        <Link to={`/app/students/${student.id}/analytics`} className="btn-ghost text-sm" title="Analytics">
          <ChartBarIcon className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
