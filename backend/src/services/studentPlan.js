// Data-access + service glue: load a student's subjects (-> personalised plan)
// and their calendar (term dates / exam window). Shared by plan/analytics/AI.
import { query } from "../db.js";
import { buildStudyPlan } from "./personalization.js";

// pg returns DATE columns as JS Date objects; normalise to YYYY-MM-DD.
export function toIsoDate(v) {
  if (!v) return null;
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  return String(v).slice(0, 10);
}

export async function loadStudentContext(studentId) {
  const [subjectsRes, studentRes] = await Promise.all([
    query(
      "SELECT subject_key, subject_name, exam_board, tier, current_grade, target_grade FROM student_subjects WHERE student_id = $1",
      [studentId]
    ),
    query(
      "SELECT id, full_name, school, year_group, exam_series, exam_start, exam_end, term_dates, holidays FROM students WHERE id = $1",
      [studentId]
    ),
  ]);
  const student = studentRes.rows[0];
  const plan = buildStudyPlan(subjectsRes.rows);
  const calendar = {
    terms: student?.term_dates || [],
    holidays: student?.holidays || [],
    examStart: toIsoDate(student?.exam_start),
    examEnd: toIsoDate(student?.exam_end),
  };
  return { plan, calendar, student, subjects: subjectsRes.rows };
}

// Back-compat helper returning just the personalised plan.
export async function loadStudyPlan(studentId) {
  return (await loadStudentContext(studentId)).plan;
}
