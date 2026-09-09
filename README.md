# ALMS — Arms License Management System

A full-stack web application for digitizing and managing the end-to-end lifecycle of arms licenses — from fresh applications and renewals to cancellations, verification, hearings, and reporting — used by applicants, police station staff, and administrative/superadmin roles across a defined workflow hierarchy.

## Tech Stack

**Backend**
- [NestJS](https://nestjs.com/) 11 (TypeScript)
- PostgreSQL via [Prisma ORM](https://www.prisma.io/) 6
- JWT-based authentication (`jsonwebtoken`)
- Swagger (`@nestjs/swagger`) for API documentation
- Jest for testing

**Frontend**
- [Next.js](https://nextjs.org/) 15 (App Router) + React 18, TypeScript
- Tailwind CSS
- Redux Toolkit + TanStack Query for state/data management
- Chart.js for analytics dashboards
- Tiptap for rich text editing, jsPDF/html2canvas for document export

**Tooling**
- npm workspaces (root `package.json` orchestrates `backend` + `frontend`)
- Docker (dev & prod Dockerfiles for both apps)

## Project Structure

```
alms/
├── backend/            # NestJS API server
│   ├── src/
│   │   ├── modules/    # Feature modules (see below)
│   │   ├── constants/
│   │   └── main.ts
│   ├── prisma/         # Schema, migrations, seed scripts
│   └── scripts/        # Backup / restore / ops shell scripts
├── frontend/           # Next.js application
│   └── src/
│       ├── app/        # App Router pages, layouts, API routes
│       ├── components/ # Shared UI components
│       └── config/      # Roles, redirections, layout context
└── package.json        # Workspace root
```

### Backend modules (`backend/src/modules`)
`auth`, `user`, `roles`, `licenses`, `renewal`, `CancelForm`, `FreshLicenseApplicationForm`, `FLAWorkflow`, `flowMapping`, `verification`, `hearings`, `weapons`, `documents`, `biometric`, `actions`, `locations`, `notifications`, `analytics`, `audit`, `status`, `scheduler`, `health`, `public`

### Frontend route groups (`frontend/src/app`)
`admin`, `superAdmin`, `dashboard`, `application`, `forms`, `freshform`, `renewalApplication`, `cancelForm`, `inbox`, `licenses`, `notifications`, `reports`, `settings`, `login`, `reset-password`, `landing`, `public`, `api`

## Getting Started

```bash
# install all workspace dependencies
npm install

# run backend + frontend together
npm run dev

# or individually
npm run dev:backend
npm run dev:frontend
```

Backend-specific (Prisma):
```bash
cd backend
npm run prisma:generate
npm run prisma:migrate:dev
npm run seed
```

See [backend/README.md](backend/README.md) and [backend/PRISMA_MIGRATION_GUIDE.md](backend/PRISMA_MIGRATION_GUIDE.md) for backend setup/migration details, and [production_setup_guide.md](production_setup_guide.md) for deployment.

## Codebase Snapshot

_Figures below are a point-in-time count of `backend/src` and `frontend/src` (`.ts`/`.tsx`/`.js`/`.jsx`, excluding `node_modules`), generated 2026-09-09._

| Metric | Backend | Frontend | Total |
|---|---:|---:|---:|
| Files | 136 | 359 | **495** |
| Lines of code | 25,113 | 85,409 | **110,522** |
| Words | 80,640 | 272,233 | **352,873** |

| Category | Count |
|---|---:|
| Backend modules | 24 |
| Backend controllers (route files) | 23 |
| API endpoints (`@Get/@Post/@Put/@Delete/@Patch`) | 133 |
| Database tables (Prisma models) | 42 |
| Frontend pages (`app/**/page.tsx`) | 50 |
| Frontend layouts (`layout.tsx`) | 9 |
| Frontend components (`src/components`) | 152 |
| Frontend API client files | 19 |

> These numbers will drift as the codebase evolves; re-run a `find`/`wc -l` sweep over `backend/src` and `frontend/src` to refresh them.

## Key Roles & Workflow

The system models a multi-role license approval workflow (e.g. Applicant → Station/Zone staff → District/Admin → SuperAdmin), with role-based routing enforced in [frontend/src/config/roles.ts](frontend/src/config/roles.ts) and [frontend/src/config/roleRedirections.ts](frontend/src/config/roleRedirections.ts), and mirrored authorization in the backend `auth`/`roles` modules.
