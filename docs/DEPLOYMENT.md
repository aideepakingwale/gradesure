# ☁️ cloud9 — Cloud Deployment Guide (zero cost)

Deploy **cloud9** (the GCSE Grade 8–9 planner) to the cloud for **£0/month**.
The app **owns its schema**: on boot, `backend/src/migrate.js` applies
`backend/src/schema.sql` (idempotent) to whatever Postgres `DATABASE_URL`
points at — **no manual SQL, ever**. Point it at an empty database and start it.

| | Local | Cloud (zero cost) |
|---|---|---|
| Topology | 3 containers: `db` + `api` + `web` (nginx) | **1 container** (API serves the built SPA) + managed Postgres |
| Run | `docker compose up --build` | Render Blueprint / `fly deploy` |
| Origin | web :8088 proxies `/api` → api | single origin, no CORS config needed |

---

## Option A — Render one-click Blueprint ⭐ (recommended)

1. Push this repo to GitHub (`.env` is git-ignored — your keys stay local).
2. In [Render](https://render.com): **New → Blueprint** → select the repo.
   It reads [`render.yaml`](../render.yaml) and provisions:
   - a **free PostgreSQL** database (`edu-db`),
   - a **free Docker web service** built from the root [`Dockerfile`](../Dockerfile)
     (React SPA + API in one image), with `DATABASE_URL` wired automatically
     and a strong `JWT_SECRET` generated for you.
3. Click **Apply**, wait for the first deploy, then add your secrets
   (service → **Environment**): `RESEND_API_KEY`, `GROQ_API_KEY`,
   `GEMINI_API_KEY`, and set `APP_BASE_URL` to your service URL
   (e.g. `https://cloud9-xxxx.onrender.com`) so email links point at the cloud app.
4. Open the URL. Health check: `GET /api/health` → `{"status":"ok"}`.

> Render's free Postgres expires after ~30 days. For an **always-free**
> database use Option C (Neon) — delete the `databases:` block in
> `render.yaml` and set `DATABASE_URL` yourself.

## Option B — Fly.io (scales to zero)

```bash
fly launch --no-deploy            # reads fly.toml (rename the app if taken)
fly postgres create               # free-allowance Postgres
fly postgres attach <pg-app>      # sets DATABASE_URL secret automatically
fly secrets set JWT_SECRET=$(openssl rand -hex 48) \
  RESEND_API_KEY=re_... GROQ_API_KEY=gsk_... GEMINI_API_KEY=AIza... \
  APP_BASE_URL=https://<your-app>.fly.dev
fly deploy
```

`fly.toml` sets `min_machines_running = 0`, so it costs nothing while idle.
Koyeb / Railway work identically — deploy the root `Dockerfile`, attach a
Postgres, set the same variables.

## Option C — always-free database (Neon)

1. Create a project at [neon.tech](https://neon.tech) (serverless Postgres, scales to zero).
2. Copy the **pooled** connection string (`...-pooler...neon.tech/db?sslmode=require`).
3. Set it as `DATABASE_URL` on your host. TLS is auto-detected
   (`sslmode=require` in the URL, or force with `PGSSL=true`).
4. Deploy — tables and the demo seed are created on first boot.

---

## Environment variables (complete reference)

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | ✅ | Postgres connection string (Neon/Render/Fly/Supabase) |
| `JWT_SECRET` | ✅ | Token signing — `openssl rand -hex 48` (Render generates it) |
| `APP_BASE_URL` | ✅ cloud | Public URL of the app — used to build email verification links |
| `PGSSL` | cloud | `true` for managed Postgres (auto-detected for Neon/Supabase/Render/RDS) |
| `RESEND_API_KEY` | for email | [resend.com/api-keys](https://resend.com/api-keys) — real verification emails. Blank = links logged to console |
| `RESEND_FROM` | – | Default `cloud9 <onboarding@resend.dev>` (must stay `onboarding@resend.dev` until you verify a domain) |
| `GROQ_API_KEY` | for AI | [console.groq.com/keys](https://console.groq.com/keys) — primary AI plan generator |
| `GEMINI_API_KEY` | for AI | [aistudio.google.com/apikey](https://aistudio.google.com/apikey) — AI fallback |
| `GROQ_MODEL` / `GEMINI_MODEL` | – | Defaults: `llama-3.3-70b-versatile` / `gemini-1.5-flash` |
| `SMTP_HOST/PORT/USER/PASS/FROM` | – | Classic SMTP fallback, used only when Resend key is blank |
| `PORT` / `NODE_ENV` | – | Default `4000` / set `production` in cloud |

**Graceful degradation:** with **zero** optional keys the app still fully works —
AI plans fall back to the built-in engine, and email verification links are
logged + shown in the UI.

---

## Post-deploy checklist

- [ ] `GET /api/health` returns `{"status":"ok"}`
- [ ] Landing page loads; a deep link like `/app` also loads (SPA fallback)
- [ ] Register a parent → verification email arrives (or link in logs) → login works
- [ ] Add a child → planner shows tasks → AI guide badge shows **Groq** (not "Built-in engine")
- [ ] Mark a task complete → refresh → persisted
- [ ] Remove/lock the demo seed accounts (`parent@demo.local`, `admin@…`) for public deployments
- [ ] `JWT_SECRET` is a generated value, not the default

## How the data persists (summary)

Only **state** lives in the database — the day-wise schedule is *computed*,
not stored. See [`docs/DATABASE.md`](DATABASE.md) for the full schema and the
reasoning. Practical consequence for deployment: the database stays tiny
(fits every free tier), and regenerating a plan never requires a data migration.
