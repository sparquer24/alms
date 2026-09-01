# ALMS Backend Documentation

## API Overview
The backend exposes a comprehensive set of REST APIs, grouped by module:

### Auth APIs
- `POST /auth/login` — User login, returns JWT token.
- `GET /auth/getMe` — Get current user profile (protected).
- `GET /auth/verify` — Verify JWT token validity.

### User APIs
- `POST /users` — Create a new user.
- `GET /users` — List users, filter by role.

### Application Form APIs
- `POST /application-form` — Create a new arms license application (multi-step, deeply validated).
- `GET /application-form` — List all applications (filtered by role/status).
- `GET /application-form/:id` — Get details of a specific application (access controlled).
- `GET /application-form/helpers/states` — List all states.
- `GET /application-form/helpers/districts/:stateId` — List districts for a state.
- `GET /application-form/helpers/police-stations/:divisionId` — List police stations for a division.
- `GET /application-form/helpers/validate-ids` — Validate reference IDs (state, district, police station).
- `GET /application-form/helpers/check-aadhar/:aadharNumber` — Check if Aadhar number already exists.

### Workflow APIs
- `POST /workflow/forward` — Forward an application to the next role/user, track workflow action.

### Location APIs
- `GET /locations/states` — List states (or get by ID).
- `GET /locations/districts` — List districts (filter by state).
- `GET /locations/zones` — List zones (filter by district).
- `GET /locations/divisions` — List divisions (filter by zone).
- `GET /locations/police-stations` — List police stations (filter by division).
- `GET /locations/hierarchy` — Get full location hierarchy for a given ID.

---

## Core API Logic
- **Authentication**: Secure login, token verification, and user profile retrieval.
- **User Management**: Create and list users, assign roles.
- **Application Form**: Deeply validated, multi-step creation; retrieval and filtering; reference validation; duplicate checks.
- **Workflow**: Forwarding applications, tracking actions and history.
- **Location Data**: Hierarchical queries for states, districts, zones, divisions, and police stations.

All APIs are protected by role-based access and permission checks where required. The core logic ensures data integrity, security, and workflow transparency.

---

## Overview
This backend powers the Arms & Ammunition License Management System (ALMS). It is built with NestJS (TypeScript), Prisma ORM, and PostgreSQL. The backend handles authentication, user management, application workflows, and all business logic for license applications.

---

## Folder Structure
```
backend/
├── docker-compose.yml
├── Dockerfile
├── logs/
├── node_modules/
├── package.json
├── prisma/
│   ├── migrations/
│   ├── schema.prisma
│   └── seed.ts
├── src/
│   ├── constants/
│   ├── db/
│   │   └── prismaClient.ts
│   ├── decorators/
│   ├── main.ts
│   ├── middleware/
│   ├── modules/
│   │   ├── app.module.ts
│   │   ├── auth/
│   │   ├── FLAWorkflow/
│   │   ├── FreshLicenseApplicationForm/
│   │   ├── locations/
│   │   └── user/
│   ├── request/
│   └── response/
└── tsconfig.json
```

---

## Main Modules
- **auth/**: Handles authentication (JWT), login, and permission checks.
- **user/**: User CRUD, role assignment, and filtering.
- **FreshLicenseApplicationForm/**: Core logic for creating, validating, and retrieving license applications.
- **FLAWorkflow/**: Manages application forwarding, workflow history, and role/user transitions.
- **locations/**: Manages states, districts, zones, divisions, and police stations.

---

## Prisma Schema & Database Structure
### Key Models
- **Users**: System users, linked to roles and location hierarchy (state, district, zone, division, police station).
- **Roles**: Define permissions and workflow capabilities (admin, police, user, etc.).
- **Statuses**: Track application progress (Draft, Submitted, Under Review, etc.).
- **States, Districts, Zones, Divisions, PoliceStations**: Geographical hierarchy for addresses and jurisdiction.
- **FreshLicenseApplicationsForms**: Main application table, linked to addresses, contact info, occupation, biometric, criminal history, license history, file uploads, and workflow history.
- **Workflow & ActionHistories**: Track application movement and actions between users/roles.
- **Supporting Models**: License request details, file uploads, criminal/occupation/contact/address/biometric histories.

### Schema Depth & Table Connections
- **Users** connect to **Roles** (roleId), and optionally to **PoliceStations**, **States**, **Districts**, **Zones**, **Divisions** for location-based permissions.
- **Roles** have many **Users** and are referenced in applications for current/previous role.
- **Statuses** are referenced by applications to track their progress.
- **FreshLicenseApplicationsForms** is the central table, connecting:
  - **Addresses** (present/permanent)
  - **ContactInfos**
  - **OccupationInfos**
  - **BiometricDatas**
  - **CriminalHistories**
  - **LicenseHistories**
  - **LicenseRequestDetails**
  - **FileUploads**
  - **WorkflowHistories**
  - **Current/Previous Role & User**
  - **State/District**
- **Workflow**: Applications are forwarded between users/roles, tracked in **FreshLicenseApplicationsFormWorkflowHistories** and **ActionHistories**.
- **Supporting Tables**: Each application can have multiple related records (e.g., criminal history, license history, file uploads).

### Schema Coverage
- All major entities for arms license management are modeled:
  - User, Role, Status, Location hierarchy
  - Application form and all its sections
  - Workflow and audit history
  - Document/file uploads
  - License request and history
  - Biometric and criminal details

---

## How Tables Relate (Depth)
- **One-to-many**: Users to Applications, Applications to Histories, Applications to FileUploads, etc.
- **Many-to-one**: Application to User, Role, Status, Location.
- **Many-to-many**: LicenseRequestDetails to WeaponTypeMaster.
- **Foreign keys**: Used throughout for referential integrity (e.g., applicationId, userId, roleId, stateId, etc.).
- **Enums**: Used for sex, arms category, file type, license purpose, weapon category, etc.

---

## What Has Been Done
- All core schemas for arms license management are implemented and connected.
- Application form logic is deeply normalized: every section (address, contact, occupation, biometric, criminal, license history, workflow) is a separate table, linked by foreign keys.
- Workflow and status tracking are robust, supporting multi-role review and forwarding.
- Location hierarchy is fully modeled for jurisdiction and permissions.
- All relationships are enforced via Prisma and PostgreSQL.
- Seed scripts and migrations are provided for initial data setup.

---

## Getting Started
- Set up PostgreSQL and configure `DATABASE_URL`.
- Run migrations and seed scripts in `prisma/`.
- Start backend with `npm install` and `npm run start:dev`.

---

## Extending
- Add new roles, statuses, or workflow steps by updating the Prisma schema and seed scripts.
- Extend modules for new business logic or endpoints.
- Update relationships or add new tables as needed for future features.

---

## License
MIT
