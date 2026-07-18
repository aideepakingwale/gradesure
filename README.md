# 🎓 EduEnterprise — GCSE Grade 8–9 Master Planner

A production-grade, multi-layer full-stack application that guides a UK Year 11
student to **Grade 8–9** across 9 GCSE subjects for the **May/June 2027** exam series.

Parents register, create child profiles, and track progress against an
**algorithmically generated daily study plan** mapped to Lampton School term dates,
the correct exam boards, and curated free resources.

---

## Architecture (multi-layer)

```
┌──────────────┐     ┌─────────────────────┐     ┌──────────────────────┐
│   web (SPA)  │ ──► │   api (REST)        │ ──► │   db (PostgreSQL)    │
│ React + Vite │     │ Node.js + Express   │     │ users / students /   │
│ Tailwind     │     │ JWT + RBAC + Zod    │     │ subjects / progress  │
│ Recharts     │     │ modular service/    │     │                      │
│ Nginx        │     │ repository layers   │     │                      │
└──────────────┘     └─────────────────────┘     └──────────────────────┘
        :80 (8088)            :4000                       :5432
```

| Layer | Tech | Responsibility |
|-------|------|----------------|
| **Presentation** | React 18, Vite, Tailwind CSS, Recharts, React Router | Attractive education UI, planner calendar, analytics charts |
| **API** | Node.js, Express, JWT, bcrypt, Zod, Helmet, rate-limit | Auth, RBAC, business logic (scheduler), validation |
| **Data** | PostgreSQL 16 | Persistent users, student profiles, subjects, task progress |
| **Orchestration** | Docker Compose | One-command local run; portable to cloud |

**Design patterns** — routing layer (`routes/`), business-logic service layer
(`services/scheduler.js` + `services/personalization.js`, both HTTP-unaware),
data-access via a shared pool (`db.js`), and a shared core (`config.js`, Zod
schemas, error classes).

**Key features**
- **Registration with email confirmation** — parents register (email mandatory); a
  verification link is emailed (SMTP via `.env`) and **login is blocked until verified**.
  Without SMTP configured, the link is logged/returned so dev never dead-ends.
- **Guided student onboarding** — 3-step wizard: school & exam window → **school term
  dates** (pre-filled, editable; they reshape the schedule) → subjects with current/target
  grades and tier.
- **AI-generated study plan (persisted)** — `services/ai.js` calls **Groq** (primary),
  falls back to **Google Gemini** free tier, then to a built-in rule-based engine, so the
  app works with zero API keys. The guide (per-subject strategy, resources, techniques,
  evaluation rubric) is saved in the `study_plans` table.
- **Hyper-personalised curation** — `services/personalization.js` weights each
  subject by its grade gap (`target − current`) and Foundation-tier risk, then
  allocates 15 weekly sessions so weak/critical subjects recur more often and
  strong subjects less. Re-curates automatically whenever a grade/target/tier changes.
- **Calendar views** — Month (completion at a glance), Week (mark tasks inline),
  Day (full task cards + resource links). Statuses: **Not started · In progress ·
  Completed · Halted (with notes)**; state persists via upsert.
- **Periodic evaluation** — fortnightly adherence checkpoints (`plan_evaluations`):
  expected vs completed vs halted → **on-track / at-risk / off-track** verdicts, shown to
  parents and students.
- **Landing page** — public marketing page with infographic hero, feature grid, and
  how-it-works; app lives under `/app`.
- **Multi-tenant + RBAC** — parents register, add multiple children, and only ever
  see their own (ownership-checked on every route).

---

## Two topologies, one codebase

The **same code** runs locally and in the cloud. The app owns its schema
(`backend/src/schema.sql`, applied on boot by `backend/src/migrate.js`), so no
manual DB setup is ever needed — just point it at an empty Postgres.

| | Local | Cloud (zero cost) |
|---|---|---|
| Shape | 3 containers: `db` + `api` + `web` (nginx) via `docker-compose.yml` | 1 container (API serves the built SPA) via root `Dockerfile` + managed Postgres |
| Run | `docker compose up --build` | Render Blueprint (`render.yaml`) / `fly deploy` (`fly.toml`) |
| Origin | web :8088 proxies `/api` → api | single origin, no CORS |

## Quick start (local Docker)

Prerequisites: **Docker Desktop**.

```bash
cp .env.example .env          # optional: adjust ports / secrets
docker compose up --build     # builds db + api + web
```

Then open **http://localhost:8088**

> If port 8088 (or 5432/4000) is busy, edit `WEB_PORT` / `DB_PORT` / `API_PORT`
> in `.env`. Keep `CORS_ORIGIN` matching the web port.

**Single-container** (the exact image the cloud runs — SPA + API on one origin):

```bash
docker build -t eduenterprise .
docker run -p 4000:4000 -e DATABASE_URL=postgres://user:pass@host/db \
  -e JWT_SECRET=$(openssl rand -hex 48) -e PGSSL=true eduenterprise
# whole app on http://localhost:4000
```

### Demo login (seeded)
| Role | Email | Password |
|------|-------|----------|
| Parent | `parent@demo.local` | `Password123!` |
| Admin  | `admin@eduenterprise.local` | `Password123!` |

The demo parent already has a student profile mirroring the real academic baseline.
You can also **register a fresh parent account** from the UI.

---

## Run without Docker (dev mode)

```bash
# 1. Postgres (via Docker just for the DB)
docker compose up -d db

# 2. API
cd backend && npm install && DATABASE_URL=postgres://edu:edu_secret@localhost:5432/eduenterprise \
  JWT_SECRET=dev npm run dev

# 3. Web (proxies /api -> :4000)
cd frontend && npm install && npm run dev   # http://localhost:5173
```

---

## API surface

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | `/api/auth/register` | – | Parent self-registration (sends verification email) |
| POST | `/api/auth/verify` | – | Confirm email token → JWT |
| POST | `/api/auth/resend` | – | Re-send verification email |
| POST | `/api/auth/login` | – | Login → JWT (blocked until email verified) |
| GET  | `/api/auth/me` | ✔ | Current user |
| POST | `/api/students/:id/plan/generate` | ✔ (owner) | AI-generate + persist study guide (Groq→Gemini→rule-based) |
| GET | `/api/students/:id/plan/current` | ✔ (owner) | The persisted current study guide |
| GET | `/api/students/:id/evaluations?periods` | ✔ (owner) | Fortnightly adherence checkpoints |
| GET/POST | `/api/students` | ✔ | List / create child profiles |
| GET/PATCH/DELETE | `/api/students/:id` | ✔ (owner) | Read / update / delete |
| PUT | `/api/students/:id/subjects` | ✔ (owner) | Upsert subject enrolment |
| GET | `/api/students/:id/plan?start&days` | ✔ (owner) | Personalised plan + saved progress |
| GET | `/api/students/:id/plan/day/:date` | ✔ (owner) | Single day |
| GET | `/api/students/:id/plan/profile` | ✔ (owner) | Personalisation summary (weekly load + reasons) |
| PUT | `/api/students/:id/progress` | ✔ (owner) | Upsert a task's status |
| GET | `/api/students/:id/analytics?days` | ✔ (owner) | Completion analytics |
| GET | `/api/resources` | ✔ | Curated free-resource directory |

**RBAC / security:** every student-scoped route validates ownership
(`parent_id === req.user.sub`, admins bypass) — neutralising IDOR. Passwords are
bcrypt-hashed; auth is stateless JWT; inputs are Zod-validated; Helmet + CORS +
auth rate-limiting are enabled.

---

## Zero-cost cloud deployment

Turnkey — the app applies its own schema on boot, so you only supply a
`DATABASE_URL`. Full guide: [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).
Database schema & persistence model: [`docs/DATABASE.md`](docs/DATABASE.md).

- **Render (one click)** — New → Blueprint → this repo. [`render.yaml`](render.yaml)
  provisions a free Postgres + a free Docker web service (API + bundled SPA),
  wires `DATABASE_URL`, and generates `JWT_SECRET`. Done.
- **Fly.io / Koyeb / Railway** — deploy the root `Dockerfile` (`fly.toml` included),
  attach a free Postgres, set `JWT_SECRET`. Scales to zero.
- **Always-free database** — point `DATABASE_URL` at a [Neon](https://neon.tech)
  or Supabase Postgres; SSL auto-enables. No manual SQL step — tables + demo seed
  are created on first boot.

---

## Educational strategy

See **[`docs/GCSE_Grade9_Study_Guide.md`](docs/GCSE_Grade9_Study_Guide.md)** for the
full Grade 8–9 plan: per-subject free resources (YouTube, past papers, PDFs),
the monthly→weekly→daily schedule, mock-exam and past-paper strategy, and the
active-recall techniques that separate a Grade 5 from a Grade 9.
