# YouTube Automation Platform

Framewise is a React creator workspace backed by an Express API for prompt evolution, Gemini video generation, YouTube publishing, and analytics collection. The repository is an npm-workspaces monorepo: frontend and backend can be developed, built, and deployed independently.

## Requirements

- Node.js 22 LTS and npm 10+
- Docker Desktop with Compose v2 for the full local stack
- Gemini and YouTube OAuth credentials for live generation and channel publishing; the frontend remains usable with its demo fixtures without them

## Local development

```powershell
npm install
Copy-Item .env.example .env
Copy-Item backend/.env.example backend/.env
Copy-Item frontend/.env.example frontend/.env
```

Set unique `JWT_SECRET`, `JWT_REFRESH_SECRET`, and a 64-character hex `TOKEN_ENCRYPTION_KEY` in `backend/.env`. Set a local `DATABASE_URL` and `REDIS_URL`, then start PostgreSQL and Redis with your preferred local services or Compose. Apply schema migrations and launch each process:

```powershell
npm run db:deploy
npm run dev:backend
npm run dev:frontend
```

Frontend: `http://localhost:5173`. API: `http://localhost:5000/api`. Swagger UI: `http://localhost:5000/api-docs`. Health check: `http://localhost:5000/api/health`.

For the full containerized stack, copy `.env.example` to root `.env`, replace all placeholder secrets, then run `docker compose up --build`. The UI is served at `http://localhost:8080`; the API is at `http://localhost:5000`.

## Workspace commands

- `npm run dev:frontend` and `npm run build:frontend` work independently of backend services.
- `npm run dev:backend` starts the API and scheduler; PostgreSQL must be available.
- `npm run build:backend` generates Prisma Client and compiles backend TypeScript.
- `npm run build` builds both workspaces.
- `npm run db:generate`, `npm run db:migrate`, `npm run db:deploy`, `npm run db:seed`, and `npm run db:studio` manage Prisma.
- `npm run db:seed` requires `SEED_ADMIN_EMAIL` and a `SEED_ADMIN_PASSWORD` of at least 10 characters. Never use seeded credentials in production.

The frontend demo login is local and deterministic. Configure `VITE_API_URL` to connect auth, prompt, video, upload, analytics, and settings clients to the API. Read methods retain fixture fallback behavior for frontend development.

## Architecture

- `frontend/src/features`: route-facing modules; `pages`, `layouts`, `components`, `routes`, `hooks`, `services`, `store`, `types`, and `data` hold screens and client contracts.
- `backend/src/modules`: auth, users, prompts, prompt evolution, videos, metadata, uploads, channels, notifications, analytics, and settings.
- `backend/src/services`: Gemini, YouTube, local media storage, and analytics integrations.
- `backend/src/jobs`: database-configured daily generation and due-upload scheduler.
- `backend/prisma`: PostgreSQL schema, migration history, and seed script.
- `docs`: API and deployment notes.

The backend is the source of truth for Gemini/Google credentials, password hashes, access control, persisted workflow state, and media files. The demo UI's image previews are presentation fixtures; real generated files are stored under the backend upload volume.

An AI-assisted YouTube production workspace for prompt authoring, video generation review, publishing schedules, upload operations, channel analytics, and metadata.

## Stack

React 18, TypeScript, Vite 6, Tailwind CSS, React Router 6, TanStack Query, Axios, React Hook Form, Zod, Zustand, and Recharts. Shared controls follow shadcn/ui composition conventions and are styled with the local design system.

## Getting started

Requires Node.js 18 or later.

```sh
npm install
npm run dev
```

Use `npm run build` for strict TypeScript checking and a production bundle, or `npm run preview` to serve that bundle locally. `npm run lint` runs the TypeScript project checks.

## Demo and backend

The login page includes a demo workspace. Demo sign-in is local and accepts the prefilled credentials; signup, password recovery, prompt/video lists, analytics summaries, and settings have mock data or local interactions for frontend evaluation. No Gemini or YouTube credentials are embedded in the client.

Copy `.env.example` to `.env` and set `VITE_API_BASE_URL` to a Spring Boot API origin or path when integrating a backend. The Axios client applies bearer tokens, normalizes API errors, attempts refresh after a 401 response, and clears an expired session. Service modules under `src/services` are the integration boundary; React Query hooks live under `src/hooks`.

## Code map

- `src/features`: route-facing feature module entry points for prompts, publishing, videos, channels, analytics, and settings.
- `src/pages` and `src/layouts`: screen implementations and responsive application/authentication shells.
- `src/components`: shared buttons, badges, dialogs, fields, and empty states.
- `src/routes`: protected route and role access checks.
- `src/store`: persisted authentication/preferences and cross-feature prompt, upload, and notification state.
- `src/services`: Axios-backed auth, prompt, video, upload, analytics, and settings services.
- `src/data`: deterministic demo fixtures used while the backend is unavailable.
- `src/types` and `src/constants`: shared contracts, route paths, and query keys.

The demo API methods fall back to fixtures for read operations; connect the feature services to matching Spring Boot endpoints before production deployment. OAuth secrets, Gemini keys, token signing, and actual video storage belong on the backend. React Router 6 remains pinned for Node 18 compatibility; its current patched major requires Node 20 or later.