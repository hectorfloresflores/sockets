# syntax=docker/dockerfile:1

# ---------------------------------------------------------------------------
# Stage 1: build the React frontend into static files (frontend/dist).
# ---------------------------------------------------------------------------
FROM node:22-bookworm-slim AS frontend-build
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# ---------------------------------------------------------------------------
# Stage 2: install backend deps. better-sqlite3 is a native module, so we make
# build tools available in case a prebuilt binary is not downloaded.
# ---------------------------------------------------------------------------
FROM node:22-bookworm-slim AS backend-deps
WORKDIR /app/backend
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*
COPY backend/package.json backend/package-lock.json ./
RUN npm ci --omit=dev
COPY backend/ ./

# ---------------------------------------------------------------------------
# Stage 3: minimal runtime image. Keeps the backend/ and frontend/ folders as
# siblings so the server can resolve ../../frontend/dist at runtime.
# ---------------------------------------------------------------------------
FROM node:22-bookworm-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app

# Backend code + compiled node_modules.
COPY --from=backend-deps /app/backend ./backend
# Built static frontend served by the backend.
COPY --from=frontend-build /app/frontend/dist ./frontend/dist

# SQLite lives here; mount a volume at this path to persist across restarts.
RUN mkdir -p /app/backend/data \
  && chown -R node:node /app

USER node
EXPOSE 3001

# Passwords can be overridden at deploy time via -e / --env (see README).
ENV PORT=3001

WORKDIR /app/backend
CMD ["node", "src/index.js"]
