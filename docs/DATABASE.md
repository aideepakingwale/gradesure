# 🗄️ cloud9 — Database Schema & Persistence Model

> **Where are the day-wise plans?** In **`plan_items`** — one recorded row per
> task per day, with the subject, the exact topic/lesson, the hint, the time
> block, the activity kind, the priority **and the resource links for that
> lesson** (JSONB). The calendar reads these rows; status updates write to them.

---

## 1. How the plan gets into the database

```
 parent clicks "Generate plan"
        │
        ▼
 ┌─────────────────┐   guide (strategy JSON)   ┌──────────────┐
 │ AI service       │ ────────────────────────► │ study_plans  │
 │ Groq→Gemini→rule │                           └──────────────┘
 └─────────────────┘
        │  personalised weighting (grade gap + tier risk)
        ▼
 ┌─────────────────┐   one row per task/day    ┌──────────────┐
 │ Scheduler +      │ ────────────────────────► │ plan_items   │  ◄── calendar reads
 │ Materializer     │   today → exam end        │  (RECORDED)  │  ◄── statuses write
 └─────────────────┘                            └──────────────┘
```

- **`POST /api/students/:id/plan/generate`** saves the AI guide **and
  materialises the full horizon** — today through the student's `exam_end`
  (e.g. 338 days ≈ 870 task rows for a 9-subject student).
- The read path is **self-healing**: if the calendar requests dates that were
  never materialised, they are generated and recorded on the fly.
- Editing **grades, tier, term dates or the exam window** automatically
  re-materialises the future (topic/time/priority refresh) while **preserving
  every status, minute and note** the student has logged.

## 2. The tables

```
users ──< students ──< student_subjects
              │
              ├──< plan_items         ★ the recorded day-wise plan
              ├──< study_plans        the AI guide (strategy layer)
              ├──< plan_evaluations   fortnightly adherence results
              └──< task_progress      legacy (auto-merged into plan_items)
```

### ★ `plan_items` — the recorded day-wise plan
| Column | Meaning |
|---|---|
| `student_id`, `task_date` | whose plan, which day |
| `day_type`, `phase`, `mode` | school_day / saturday_output / holiday… + study phase |
| `subject_key`, `subject_name`, `exam_board` | e.g. `maths`, Mathematics, Edexcel |
| `topic_slug`, `topic_title`, `hint` | the exact lesson, e.g. *"Quadratics: factorising, formula, completing square"* |
| `activity` | `study` \| `past_paper` \| `consolidation` |
| `time_block` | e.g. `17:30–18:00` (evenings on school days, mornings otherwise) |
| `priority` | `critical` / `high` / `medium` / `maintain` (from the personalisation engine) |
| `resources` JSONB | `[{name,url,tag}]` — the links for **this** lesson |
| `status`, `minutes_spent`, `note` | the student's live state (incl. `halted` + reason) |
| UNIQUE | `(student_id, task_date, subject_key, topic_slug)` |

```sql
-- a week of the recorded plan, exactly as the calendar shows it:
SELECT task_date, time_block, subject_name, topic_title, activity, status
FROM plan_items
WHERE student_id = '<id>' AND task_date BETWEEN '2026-09-14' AND '2026-09-20'
ORDER BY task_date, time_block;

-- the resources recorded for one lesson:
SELECT jsonb_pretty(resources) FROM plan_items
WHERE student_id = '<id>' AND task_date = '2026-09-14' AND subject_key = 'french';
```

### `users` — accounts
`email` (citext, unique) · bcrypt `password_hash` · `role` (parent/student/admin)
· `email_verified` + `verification_token` (hard email gate).

### `students` — child profiles (the plan's INPUTS)
`parent_id` FK · school/year/exam_series · `exam_start`/`exam_end` ·
`term_dates` JSONB · `holidays` JSONB. Term dates decide school-day evening
sessions vs holiday morning sessions; the exam window sets the phases and the
materialisation horizon.

### `student_subjects` — the personalisation INPUTS
`subject_key` (unique per student) · `exam_board` · `tier` (Foundation ⇒
*critical* priority) · `current_grade` → `target_grade` (the gap sets
sessions/week). Changing a row re-materialises the future plan.

### `study_plans` — the AI guide (strategy layer)
`generated_by` (`groq`/`gemini`/`rule-based`) · `model` · `guide` JSONB
(headline, summary, per-subject strategy + resources, techniques, evaluation
rubric) · `is_current` (one active guide per student). `plan_items.plan_id`
links each recorded task to the generation run that produced it.

### `plan_evaluations` — fortnightly adherence
`period_start/end` (14-day windows) · `expected` (recorded tasks in window) ·
`completed`/`in_progress`/`halted` tallies · `adherence_pct` · `verdict`
(≥80% on_track · ≥50% at_risk · else off_track).

### `task_progress` — legacy
The pre-materialisation status store. Kept only so old statuses auto-merge
into `plan_items` on materialisation; no code reads or writes it anymore.

## 3. Inspect it yourself

```bash
docker exec -it edu_db psql -U edu -d eduenterprise

\dt
SELECT COUNT(*), MIN(task_date), MAX(task_date) FROM plan_items;
SELECT task_date, subject_name, topic_title, status FROM plan_items
  WHERE task_date = CURRENT_DATE ORDER BY time_block;
SELECT generated_by, model, created_at FROM study_plans WHERE is_current;
SELECT period_start, adherence_pct, verdict FROM plan_evaluations ORDER BY period_end DESC LIMIT 5;
```
