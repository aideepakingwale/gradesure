-- ===========================================================================
-- EduEnterprise :: PostgreSQL schema (single source of truth)
-- Data persistence layer for the GCSE Grade 9 Master Planner.
--
-- Run by the API on every boot via src/migrate.js. Fully idempotent
-- (IF NOT EXISTS / ON CONFLICT), so it is safe to re-run and makes cloud
-- deployment turnkey: point DATABASE_URL at an empty Postgres and start the API.
-- ===========================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";      -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "citext";         -- case-insensitive email

-- --- Roles / enums --------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('parent', 'student', 'admin');
  END IF;
  -- Fresh DBs get all four statuses; existing DBs are patched in migrate.js
  -- (ALTER TYPE ... ADD VALUE must run outside a transaction block).
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_status') THEN
    CREATE TYPE task_status AS ENUM ('not_started', 'in_progress', 'completed', 'halted');
  END IF;
END$$;

-- --- Users (account owners: parents / admins) ------------------------------
CREATE TABLE IF NOT EXISTS users (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email             CITEXT UNIQUE NOT NULL,
  password_hash     TEXT NOT NULL,
  full_name         TEXT NOT NULL,
  role              user_role NOT NULL DEFAULT 'parent',
  email_verified    BOOLEAN NOT NULL DEFAULT FALSE,
  verification_token TEXT,
  verification_sent_at TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- Idempotent add-columns for pre-existing deployments.
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_token TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_sent_at TIMESTAMPTZ;

-- --- Students (child profiles owned by a parent) ---------------------------
CREATE TABLE IF NOT EXISTS students (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  full_name     TEXT NOT NULL,
  school        TEXT DEFAULT 'Lampton School',
  year_group    SMALLINT NOT NULL DEFAULT 11,
  exam_series   TEXT NOT NULL DEFAULT 'May/June 2027',
  exam_start    DATE,
  exam_end      DATE,
  term_dates    JSONB NOT NULL DEFAULT '[]',   -- [{name,start,end}]
  holidays      JSONB NOT NULL DEFAULT '[]',   -- [{name,start,end}]
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_students_parent ON students(parent_id);
ALTER TABLE students ADD COLUMN IF NOT EXISTS exam_start DATE;
ALTER TABLE students ADD COLUMN IF NOT EXISTS exam_end DATE;
ALTER TABLE students ADD COLUMN IF NOT EXISTS term_dates JSONB NOT NULL DEFAULT '[]';
ALTER TABLE students ADD COLUMN IF NOT EXISTS holidays JSONB NOT NULL DEFAULT '[]';

-- --- Subjects enrolled per student -----------------------------------------
CREATE TABLE IF NOT EXISTS student_subjects (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id    UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  subject_key   TEXT NOT NULL,
  subject_name  TEXT NOT NULL,
  exam_board    TEXT NOT NULL,
  tier          TEXT,
  current_grade TEXT,
  target_grade  TEXT NOT NULL DEFAULT '8',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (student_id, subject_key)
);
CREATE INDEX IF NOT EXISTS idx_subjects_student ON student_subjects(student_id);

-- --- Task progress ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS task_progress (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id    UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  task_date     DATE NOT NULL,
  subject_key   TEXT NOT NULL,
  topic_slug    TEXT NOT NULL,
  status        task_status NOT NULL DEFAULT 'not_started',
  minutes_spent INTEGER NOT NULL DEFAULT 0,
  note          TEXT,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (student_id, task_date, subject_key, topic_slug)
);
CREATE INDEX IF NOT EXISTS idx_progress_student_date ON task_progress(student_id, task_date);

-- --- Materialised day-wise plan (THE recorded schedule) ---------------------
-- One row per scheduled task per day, written by services/materializer.js when
-- a plan is generated (and self-healed on read). Carries the full lesson
-- detail — subject, topic, hint, time block, activity, priority AND the
-- resource links for that topic — plus the student's live status/notes.
CREATE TABLE IF NOT EXISTS plan_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id    UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  plan_id       UUID,                          -- study_plans.id that produced it (nullable)
  task_date     DATE NOT NULL,
  day_type      TEXT NOT NULL DEFAULT 'school_day',
  phase         TEXT,
  mode          TEXT,
  subject_key   TEXT NOT NULL,
  subject_name  TEXT NOT NULL,
  exam_board    TEXT,
  topic_slug    TEXT NOT NULL,
  topic_title   TEXT NOT NULL,
  hint          TEXT,
  activity      TEXT NOT NULL DEFAULT 'study',
  time_block    TEXT,
  priority      TEXT,
  resources     JSONB NOT NULL DEFAULT '[]',   -- [{name,url,tag}] for THIS topic
  status        task_status NOT NULL DEFAULT 'not_started',
  minutes_spent INTEGER NOT NULL DEFAULT 0,
  note          TEXT,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (student_id, task_date, subject_key, topic_slug)
);
CREATE INDEX IF NOT EXISTS idx_plan_items_student_date ON plan_items(student_id, task_date);

-- --- Master reference library (admin-managed) -------------------------------
-- Curated external resources per subject and per topic, plus past papers.
-- Admins CRUD these via /api/admin/references; the materializer, AI guide and
-- resources page all read from here (code-generated links are only a fallback).
CREATE TABLE IF NOT EXISTS reference_resources (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_key TEXT NOT NULL,                    -- e.g. 'maths', or 'general'
  topic_slug  TEXT,                             -- NULL = subject-level reference
  category    TEXT NOT NULL DEFAULT 'learning', -- learning | past_papers
  name        TEXT NOT NULL,
  url         TEXT NOT NULL,
  tag         TEXT,
  sort_order  INTEGER NOT NULL DEFAULT 100,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  updated_by  UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_refs_subject_topic ON reference_resources(subject_key, topic_slug);

-- --- AI-generated study plans (persisted) ----------------------------------
CREATE TABLE IF NOT EXISTS study_plans (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id    UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  generated_by  TEXT NOT NULL DEFAULT 'rule-based',  -- groq | gemini | rule-based
  model         TEXT,
  guide         JSONB NOT NULL,      -- { summary, subjects[], techniques[], evaluation_rubric }
  meta          JSONB NOT NULL DEFAULT '{}',
  is_current    BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_plans_student ON study_plans(student_id, is_current);

-- --- Periodic evaluation checkpoints (adherence measurement) ----------------
CREATE TABLE IF NOT EXISTS plan_evaluations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id    UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  period_start  DATE NOT NULL,
  period_end    DATE NOT NULL,
  expected      INTEGER NOT NULL DEFAULT 0,
  completed     INTEGER NOT NULL DEFAULT 0,
  in_progress   INTEGER NOT NULL DEFAULT 0,
  halted        INTEGER NOT NULL DEFAULT 0,
  adherence_pct INTEGER NOT NULL DEFAULT 0,
  verdict       TEXT NOT NULL DEFAULT 'off_track',   -- on_track | at_risk | off_track
  message       TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (student_id, period_start, period_end)
);
CREATE INDEX IF NOT EXISTS idx_evals_student ON plan_evaluations(student_id, period_end);

-- --- updated_at trigger ----------------------------------------------------
CREATE OR REPLACE FUNCTION touch_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_users_touch ON users;
CREATE TRIGGER trg_users_touch BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
DROP TRIGGER IF EXISTS trg_students_touch ON students;
CREATE TRIGGER trg_students_touch BEFORE UPDATE ON students
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
DROP TRIGGER IF EXISTS trg_progress_touch ON task_progress;
CREATE TRIGGER trg_progress_touch BEFORE UPDATE ON task_progress
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
DROP TRIGGER IF EXISTS trg_plan_items_touch ON plan_items;
CREATE TRIGGER trg_plan_items_touch BEFORE UPDATE ON plan_items
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
DROP TRIGGER IF EXISTS trg_refs_touch ON reference_resources;
CREATE TRIGGER trg_refs_touch BEFORE UPDATE ON reference_resources
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- ===========================================================================
-- Seed: demo admin + demo parent (both PRE-VERIFIED). Password: Password123!
-- ===========================================================================
INSERT INTO users (id, email, password_hash, full_name, role, email_verified)
VALUES
  ('00000000-0000-0000-0000-000000000001',
   'admin@eduenterprise.local',
   '$2b$10$UJKQJCSaLlZ9Z6Fzz0wH8ebE14akdGeyH9m3RmI7As/ewYIYwYdji',
   'Platform Admin', 'admin', TRUE),
  ('00000000-0000-0000-0000-000000000002',
   'parent@demo.local',
   '$2b$10$UJKQJCSaLlZ9Z6Fzz0wH8ebE14akdGeyH9m3RmI7As/ewYIYwYdji',
   'Demo Parent', 'parent', TRUE)
ON CONFLICT (email) DO NOTHING;

-- Demo student with Lampton term dates + exam window.
INSERT INTO students (id, parent_id, full_name, school, year_group, exam_series,
                      exam_start, exam_end, term_dates, holidays)
VALUES
  ('00000000-0000-0000-0000-0000000000a1',
   '00000000-0000-0000-0000-000000000002',
   'Demo Student', 'Lampton School', 11, 'May/June 2027',
   '2027-05-10', '2027-06-18',
   '[{"name":"Autumn","start":"2026-09-03","end":"2026-12-18"},
     {"name":"Spring","start":"2027-01-05","end":"2027-03-26"},
     {"name":"Summer","start":"2027-04-12","end":"2027-07-21"}]',
   '[{"name":"October half term","start":"2026-10-26","end":"2026-10-30"},
     {"name":"Christmas","start":"2026-12-19","end":"2027-01-04"},
     {"name":"February half term","start":"2027-02-15","end":"2027-02-19"},
     {"name":"Easter","start":"2027-03-27","end":"2027-04-11"},
     {"name":"May half term","start":"2027-05-31","end":"2027-06-04"}]')
ON CONFLICT (id) DO NOTHING;

INSERT INTO student_subjects
  (student_id, subject_key, subject_name, exam_board, tier, current_grade, target_grade)
VALUES
  ('00000000-0000-0000-0000-0000000000a1','maths','Mathematics','Edexcel','Foundation','5','8'),
  ('00000000-0000-0000-0000-0000000000a1','combined_science','Combined Science','AQA','Higher','7','9'),
  ('00000000-0000-0000-0000-0000000000a1','english_lit','English Literature','Edexcel',NULL,'5','8'),
  ('00000000-0000-0000-0000-0000000000a1','english_lang','English Language','AQA',NULL,'5','8'),
  ('00000000-0000-0000-0000-0000000000a1','computer_science','Computer Science','OCR',NULL,'6','8'),
  ('00000000-0000-0000-0000-0000000000a1','sociology','Sociology','AQA',NULL,'6','8'),
  ('00000000-0000-0000-0000-0000000000a1','religious_studies','Religious Studies','AQA',NULL,'5','8'),
  ('00000000-0000-0000-0000-0000000000a1','french','French','AQA','Foundation','4','7'),
  ('00000000-0000-0000-0000-0000000000a1','geography','Geography','AQA',NULL,'7','9')
ON CONFLICT (student_id, subject_key) DO NOTHING;
