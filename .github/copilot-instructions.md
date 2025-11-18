````instructions
## Quick orientation for AI coding agents

This repo is a monorepo with two main workspaces: `backend` (NestJS + Prisma) and `frontend` (Next.js). The goal of edits is to follow existing patterns and preserve API contracts. Refer to the files below for exact shapes and examples.

### Project entry points
- Root workspace: `package.json` (workspace scripts, see `dev`, `start`, `prisma:*` scripts).
- Backend: `backend/src/main.ts` (loads root `.env`, sets global prefix `/api`, enables CORS, serves Swagger at `/api/api-docs`).
- Frontend: `frontend` is a Next.js app (scripts in `frontend/package.json`; dev uses `PORT=5000`).

### Important dirs and files to consult
- `backend/src/modules/` — Put new controllers/services in the correct module (auth, user, FreshLicenseApplicationForm, FLAWorkflow, locations).
- `backend/prisma/schema.prisma` — Source of truth for DB models, enums and relations. Use it to craft queries and DTOs.
- `backend/prisma/seed.ts` — initial data (roles/statuses) used by the app; update when adding new roles/status codes.
- `docs/backend/api-reference-for-frontend.md` — canonical API payloads and responses for frontend integration. Use before changing request/response shapes.
- `backend/db/prismaClient.ts` — centralized Prisma client usage (follow this pattern for DB access).

### Build / dev / test commands (use these exact npm scripts)
- Root (monorepo): `npm run dev` — generates Prisma client then starts backend and frontend concurrently.
- Backend (local dev): `npm -w backend run start:dev` (uses `ts-node-dev`).
- Backend build: `npm -w backend run build` (TypeScript compile). Production start: `npm -w backend run start:prod`.
- Prisma: run migrations and generate client from root scripts: `npm run prisma:generate`, `npm run prisma:migrate` (these cd into `backend`).
- Frontend dev/build/test: `npm -w frontend run dev`, `npm -w frontend run build`, `npm -w frontend run test`.

### Conventions & patterns you must preserve
- All API routes are prefixed with `/api` (set in `main.ts`). When adding endpoints, ensure routing respects the global prefix.
- Authentication uses JWT. Swagger is configured with bearer auth named `JWT-auth` — keep security decorators consistent when adding endpoints.
- Database: Prisma is the canonical schema and migrations source. Always update `backend/prisma/schema.prisma` and run `prisma migrate/dev` + `prisma generate` when altering models.
- Module structure: Add controllers, services and DTOs under the existing `modules/<moduleName>/` directory. Follow existing DTO validation (class-validator + class-transformer) patterns.
- Workflow/roles: Roles and status codes are seeded; changes to workflow often require schema + seed updates (see `prisma/seed.ts` and `prisma/update-roles.ts`).

### Practical examples from the repo
- Add a route: create `backend/src/modules/<module>/controllers/*.ts`, corresponding `services/*.ts`, and `dto/*.ts`. Register the controller/service in `modules/<module>/module.ts`.
- DB access: import the Prisma client from `backend/src/db/prismaClient.ts` and use typed access (e.g., `prisma.users.findUnique({...})`).
- API docs: update Swagger decorators on controllers and DTOs so new endpoints appear under `/api/api-docs`.

### Integration points & external dependencies
- Postgres via `DATABASE_URL` (backend/prisma datasource). Tests and CI expect a running DB for migrations; local dev often uses Docker compose files (`docker-compose.yml`, `backend/docker-compose.yml`).
- Auth uses JWT; token verification middleware and guard patterns live under `auth` module.
- Frontend interacts with backend using the API shapes in `docs/backend/api-reference-for-frontend.md` — changing shapes requires coordinating frontend changes.

### Quick checks before opening a PR
1. Run `npm run prisma:generate` then `npm -w backend run build` to ensure TypeScript + Prisma types compile.
2. Start services with `npm run dev` and confirm backend logs: "Backend listening on http://localhost:<port>" and Swagger at `/api/api-docs`.
3. Update `docs/backend/api-reference-for-frontend.md` if any public payloads change.

### Project overview: big picture, key features and scope
- Architecture: monorepo split into `backend` (NestJS + Prisma + Postgres) and `frontend` (Next.js). Backend is the authority for business logic and DB schema (`backend/prisma/schema.prisma`).
- Key features:
  - Multi-step Fresh License Application (personal details, addresses, occupation, criminal history, biometrics, file uploads, license details).
  - Role-based workflow and forwarding with audit trails (`FreshLicenseApplicationsFormWorkflowHistories`, `ActionHistories`).
  - User & role management with location scoping (state/district/zone/division/policeStation).
  - Location hierarchy and helper endpoints to populate frontend forms (states → districts → zones → divisions → police stations).
  - File uploads and biometric JSON storage.
- Scope items implemented vs to-verify:
  - Implemented: application lifecycle, workflow tracking, location hierarchy, seed-driven roles/status.
  - To verify before changes: PDF/FLAF generation flows, background jobs or cron tasks, and any external integrations (not obvious from code). Check `scripts/` and `backend/src` for batch or worker code.

### Data flows (how requests move through the system)
1. Frontend calls REST endpoints under `/api/*` using JWT in `Authorization` header.
2. Controller → Service → Prisma client (`backend/src/db/prismaClient.ts`) → Postgres.
3. Workflow actions create history records for audit; file uploads and biometric data are stored in dedicated tables.

### Common developer tasks (step-by-step)
- Add an API endpoint:
  1. Create controller/service/DTO under `backend/src/modules/<module>/`.
  2. Add Swagger decorators to controller and DTOs.
  3. If DB changes: update `backend/prisma/schema.prisma`, run `npm -w backend run prisma:migrate:dev`, then `npm run prisma:generate`.
  4. Run `npm -w backend run build` to verify compilation.
  5. Run `npm run dev` and verify endpoint in Swagger at `/api/api-docs`.
  6. Update `docs/backend/api-reference-for-frontend.md` if public payloads changed.

- Change DB model:
  1. Update `schema.prisma`.
  2. Run `npm -w backend run prisma:migrate:dev` and `npm run prisma:generate`.
  3. Update DTOs/services and build.

### PR checklist (add to PRs or pre-merge review)
- Run these locally before opening a PR:

```powershell
npm run prisma:generate
npm -w backend run build
npm -w frontend run lint || true
npm -w frontend run test || true
````

- Sanity checks:
  - Swagger is available at `/api/api-docs` and shows the new endpoints.
  - If DB schema changed, migration was added and `prisma generate` runs cleanly.
  - Update `docs/backend/api-reference-for-frontend.md` for frontend-affecting changes.

### Suggested improvements (optional additions you can make)

- Add a short PR template that includes the PR checklist above.
- Add Docker-compose quick-start steps (root `docker-compose.yml` and `backend/docker-compose.yml`) showing how to bring up Postgres + services for local testing.
- Provide a minimal controller/service/DTO skeleton in the repo to enforce patterns (I can generate one if you want).

If you'd like the PR checklist, Docker quick-start, or a sample module added now, tell me which and I'll update the file and add supporting artifacts.

```## Quick orientation for AI coding agents

This repo is a monorepo with two main workspaces: `backend` (NestJS + Prisma) and `frontend` (Next.js). The goal of edits is to follow existing patterns and preserve API contracts. Refer to the files below for exact shapes and examples.

- Project entry points
  - Root workspace: `package.json` (workspace scripts, see `dev`, `start`, `prisma:*` scripts).
  - Backend: `backend/src/main.ts` (loads root `.env`, sets global prefix `/api`, enables CORS, serves Swagger at `/api/api-docs`).
  - Frontend: `frontend` is a Next.js app (scripts in `frontend/package.json`; dev uses `PORT=5000`).

- Important dirs and files to consult
  - `backend/src/modules/` — Put new controllers/services in the correct module (auth, user, FreshLicenseApplicationForm, FLAWorkflow, locations).
  - `backend/prisma/schema.prisma` — Source of truth for DB models, enums and relations. Use it to craft queries and DTOs.
  - `backend/prisma/seed.ts` — initial data (roles/statuses) used by the app; update when adding new roles/status codes.
  - `docs/backend/api-reference-for-frontend.md` — canonical API payloads and responses for frontend integration. Use before changing request/response shapes.
  - `backend/db/prismaClient.ts` — centralized Prisma client usage (follow this pattern for DB access).

- Build / dev / test commands (use these exact npm scripts)
  - Root (monorepo): `npm run dev` — generates Prisma client then starts backend and frontend concurrently.
  - Backend (local dev): `npm -w backend run start:dev` (uses `ts-node-dev`).
  - Backend build: `npm -w backend run build` (TypeScript compile). Production start: `npm -w backend run start:prod`.
  - Prisma: run migrations and generate client from root scripts: `npm run prisma:generate`, `npm run prisma:migrate` (these cd into `backend`).
  - Frontend dev/build/test: `npm -w frontend run dev`, `npm -w frontend run build`, `npm -w frontend run test`.

- Conventions & patterns you must preserve
  - All API routes are prefixed with `/api` (set in `main.ts`). When adding endpoints, ensure routing respects the global prefix.
  - Authentication uses JWT. Swagger is configured with bearer auth named `JWT-auth` — keep security decorators consistent when adding endpoints.
  - Database: Prisma is the canonical schema and migrations source. Always update `backend/prisma/schema.prisma` and run `prisma migrate/dev` + `prisma generate` when altering models.
  - Module structure: Add controllers, services and DTOs under the existing `modules/<moduleName>/` directory. Follow existing DTO validation (class-validator + class-transformer) patterns.
  - Workflow/roles: Roles and status codes are seeded; changes to workflow often require schema + seed updates (see `prisma/seed.ts` and `prisma/update-roles.ts`).

- Practical examples from the repo
  - Add a route: create `backend/src/modules/<module>/controllers/*.ts`, corresponding `services/*.ts`, and `dto/*.ts`. Register the controller/service in `modules/<module>/module.ts`.
  - DB access: import the Prisma client from `backend/src/db/prismaClient.ts` and use typed access (e.g., `prisma.users.findUnique({...})`).
  - API docs: update Swagger decorators on controllers and DTOs so new endpoints appear under `/api/api-docs`.

- Integration points & external dependencies
  - Postgres via `DATABASE_URL` (backend/prisma datasource). Tests and CI expect a running DB for migrations; local dev often uses Docker compose files (`docker-compose.yml`, `backend/docker-compose.yml`).
  - Auth uses JWT; token verification middleware and guard patterns live under `auth` module.
  - Frontend interacts with backend using the API shapes in `docs/backend/api-reference-for-frontend.md` — changing shapes requires coordinating frontend changes.

- Quick checks before opening a PR
  1. Run `npm run prisma:generate` then `npm -w backend run build` to ensure TypeScript + Prisma types compile.
 2. Start services with `npm run dev` and confirm backend logs: "Backend listening on http://localhost:<port>" and Swagger at `/api/api-docs`.
 3. Update `docs/backend/api-reference-for-frontend.md` if any public payloads change.

If anything in these instructions is unclear or you want more automated checks (lint, tests, CI hooks), tell me where you'd like the focus and I'll iterate the file.
```
