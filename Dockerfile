# ===========================================================================
# EduEnterprise — single-container image (for zero-cost cloud: Render/Fly/Koyeb).
# Builds the React SPA and bundles it into the Node API, which serves both the
# API and the static app from ONE origin (no CORS, one service + a Postgres URL).
#
#   docker build -t eduenterprise .
#   docker run -p 4000:4000 -e DATABASE_URL=postgres://... -e JWT_SECRET=... eduenterprise
#
# For local multi-layer development use docker-compose.yml instead.
# ===========================================================================

# --- Stage 1: build the frontend (same-origin API base) --------------------
FROM node:20-alpine AS web
WORKDIR /web
ENV VITE_API_BASE_URL=/api
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# --- Stage 2: API runtime that also serves the built SPA -------------------
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=4000

COPY backend/package.json backend/package-lock.json* ./
RUN npm install --omit=dev
COPY backend/src ./src

# Bundle the compiled SPA; index.js serves it from ./public automatically.
COPY --from=web /web/dist ./public

EXPOSE 4000
USER node
CMD ["node", "src/index.js"]
