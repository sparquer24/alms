# Arms License Management System (ALMS) - Project Overview

## Purpose
The Arms License Management System (ALMS) is a comprehensive web application designed to manage arms license applications and their lifecycle. It implements a role-based workflow, allowing applications to move through various stages of approval by different authorities, ensuring secure, efficient, and transparent processing.

## Key Features
- **Role-Based Workflow:** Applications are processed by multiple roles (Applicant, Zonal Superintendent, SHO, ACP, DCP, CP, etc.), each with specific permissions and responsibilities.
- **Document Management:** Secure upload, storage, and retrieval of required documents for each application.
- **Application Tracking:** Applicants and authorities can track the status and history of applications in real time.
- **Real-Time Notifications:** WebSocket-based notifications for status changes, assignments, and system alerts.
- **Comprehensive Reporting:** APIs and dashboards for application statistics, status breakdowns, and performance metrics.
- **Security:** Role-based access control, audit logging, and secure file storage.

## Main Application States
- **Fresh Form:** Initial application state, requires document upload.
- **Forwarded:** Under review by authorities, can be forwarded or returned.
- **Returned:** Requires resubmission by the applicant.
- **Red Flagged:** Marked for special investigation.
- **Disposed:** Final state, no further actions.

## Technology Stack
- **Frontend:** Next.js (React), Tailwind CSS
- **Backend:** Node.js (API), WebSocket server
- **Database:** Managed via Prisma ORM
- **Other:** JWT authentication, PDF generation, charting (Chart.js)

## Directory Structure (Key Parts)
- `src/app/` - Main application pages and routing
- `src/components/` - Reusable UI components
- `src/config/` - Role definitions, authentication, and utility functions
- `src/store/` - Redux store configuration
- `prisma/` - Database schema and migrations

## Getting Started
- Install dependencies: `npm install`
- Run development server: `npm run dev`
- Open [http://localhost:3000](http://localhost:3000) in your browser

For detailed API, workflow, and schema documentation, see the respective markdown files in the project root. 