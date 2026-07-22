# ALMS — Arms License Management System

## Complete System Documentation

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [System Architecture](#2-system-architecture)
3. [Business Logic & Workflows](#3-business-logic--workflows)
4. [User Roles & Permissions](#4-user-roles--permissions)
5. [Frontend Architecture](#5-frontend-architecture)
6. [Backend Architecture](#6-backend-architecture)
7. [Complete API Reference](#7-complete-api-reference)
8. [Database Schema](#8-database-schema)
9. [Authentication & Authorization](#9-authentication--authorization)
10. [Workflow Engine](#10-workflow-engine)
11. [Developer Guide](#11-developer-guide)
12. [End-to-End Flows](#12-end-to-end-flows)

---

# 1. Project Overview

## 1.1 Purpose

The **Arms License Management System (ALMS)** is a comprehensive digital platform to manage the complete lifecycle of arms (firearm) license applications in Indian police jurisdictions. It replaces traditional paper-based workflows with a fully digitized, multi-level approval system.

**Core Objectives:**

- Digitize the entire arms license application process
- Enable multi-level verification and approval through police hierarchy
- Provide biometric (fingerprint) enrollment and duplicate detection
- Support both fresh (new) and renewal license applications
- Generate verifiable QR codes for issued licenses
- Provide analytics and reporting for administrators

## 1.2 Key Stakeholders

| Stakeholder                      | Role in System                                                      |
| -------------------------------- | ------------------------------------------------------------------- |
| **Citizens / Applicants**        | Submit fresh & renewal applications, upload documents, track status |
| **Station House Officer (SHO)**  | First-level verification, ground reports, forwarding                |
| **Zonal Superintendent (ZS)**    | Zone-level review and recommendation                                |
| **ACP / DCP**                    | District/zone level review, approval recommendation                 |
| **Joint CP / Commissioner (CP)** | Final approval authority                                            |
| **ADMIN / SUPER_ADMIN**          | System configuration, user management, analytics                    |
| **Arms Superintendent (AS)**     | License issuance and management                                     |

---

# 2. System Architecture

## 2.1 High-Level Architecture Diagram

```mermaid
graph TB
    subgraph ClientLayer["Client Layer"]
        BROWSER[Web Browser]
        MOBILE[Mobile Browser]
    end

    subgraph CDNLayer["CDN / Static"]
        NEXT_STATIC[Next.js Static Assets]
        NGINX[Nginx Reverse Proxy]
    end

    subgraph FrontendLayer["Frontend - Next.js 14 (App Router)"]
        UI[React Components & Pages]
        CONTEXT[React Context Providers<br/>Auth, App, Inbox, AdminMenu, Theme]
        STORE[State Management<br/>Redux + Zustand]
        HOOKS[Custom Hooks<br/>useAuth, useApplicationForm, useLocationHierarchy]
        API_CLIENT[API Client Layer<br/>Axios Instance + Interceptors]
        MIDDLEWARE[Next.js Middleware<br/>Auth Check + Role Redirect]
        FORMS[Multi-Step Forms<br/>Fresh & Renewal]
    end

    subgraph BackendLayer["Backend - NestJS 10"]
        GUARDS[Auth Guards<br/>JwtAuthGuard / AuthGuard]
        CONTROLLERS[REST Controllers<br/>16 Modules]
        SERVICES[Business Services<br/>18 Services]
        DTO[DTO Validation<br/>class-validator]
        INTERCEPTORS[Interceptors<br/>Logging, Error Handling]
        SWAGGER[Swagger / OpenAPI Docs]
    end

    subgraph DatabaseLayer["Data Layer"]
        PRISMA[Prisma ORM]
        PG[(PostgreSQL Database)]
        FILES[File Storage<br/>Uploads Directory]
    end

    subgraph ExternalLayer["External Integrations"]
        MANTRA[Mantra Biometric SDK<br/>Fingerprint Enrollment/Verification]
        QR[QR Code Generation]
    end

    BROWSER --> NGINX
    MOBILE --> NGINX
    NGINX --> UI
    UI --> API_CLIENT
    API_CLIENT --> MIDDLEWARE
    MIDDLEWARE --> CONTROLLERS
    CONTROLLERS --> GUARDS
    GUARDS --> SERVICES
    SERVICES --> DTO
    SERVICES --> PRISMA
    PRISMA --> PG
    CONTROLLERS --> INTERCEPTORS
    CONTROLLERS --> SWAGGER
    UI --> FORMS
    FORMS --> CONTEXT
    CONTEXT --> HOOKS
    HOOKS --> STORE
    UI --> MANTRA
    UI --> QR
```

## 2.2 Technology Stack

```mermaid
mindmap
  root((ALMS Tech Stack))
    Frontend
      Next.js 14 (App Router)
      React 18 + TypeScript
      Tailwind CSS
      Redux Toolkit
      Zustand
      Axios HTTP Client
      Recharts (Analytics)
      Tiptap (Rich Text)
    Backend
      NestJS 10
      TypeScript
      Prisma ORM
      JWT (jsonwebtoken)
      bcrypt
      Swagger / OpenAPI
      class-validator
    Database
      PostgreSQL 14+
      Prisma Migrations
    Infrastructure
      Docker & Docker Compose
      Nginx Reverse Proxy
      PM2 Process Manager
      EC2 (AWS)
    External
      Mantra Biometric SDK
      QR Code Libraries
```

## 2.3 Application Flow Diagram

```mermaid
flowchart TD
    A[User visits ALMS] --> B{Has auth cookie?}
    B -->|No| C[Redirect to /login]
    B -->|Yes| D[Parse JWT from cookie]
    D --> E{Token valid?}
    E -->|Expired/Invalid| C
    E -->|Valid| F[Extract role from token]
    F --> G{Role?}

    G -->|ADMIN| H[Redirect to /admin/dashboard]
    G -->|SUPER_ADMIN| I[Redirect to /superAdmin/...]
    G -->|APPLICANT| J[Show applicant dashboard]
    G -->|SHO/ZS/ACP/DCP/JTCP/CP| K[Redirect to officer dashboard]
    G -->|AS/ADO/CADO| L[Redirect to arms dashboard]

    H --> M[Admin: Manage users, roles, locations, analytics]
    I --> N[Super Admin: Full system control, flow mapping]
    J --> O[Applicant: Submit fresh/renewal applications]
    K --> P[Officer: Inbox -> Review -> Process -> Forward]
    L --> Q[Arms: License processing & issuance]
```

---

# 3. Business Logic & Workflows

## 3.1 Fresh Application Lifecycle

```mermaid
flowchart LR
    START([Citizen applies<br/>online]) --> DRAFT[DRAFT<br/>Fill multi-step form]
    DRAFT --> INITIATE[INITIATE<br/>Submit for review]
    INITIATE --> FORWARD[FORWARD<br/>Assigned to officer]
    FORWARD --> UNDER_REVIEW[UNDER_REVIEW<br/>Officer reviews]

    UNDER_REVIEW --> RECOMMEND[RECOMMEND<br/>Officer recommends]
    UNDER_REVIEW --> NOT_RECOMMEND[NOT_RECOMMEND<br/>Not recommended]
    UNDER_REVIEW --> RE_ENQUIRY[RE_ENQUIRY<br/>More info needed]
    UNDER_REVIEW --> GROUND_REPORT[GROUND_REPORT<br/>Ground report]

    RECOMMEND --> APPROVED[APPROVED ✓<br/>License issued]
    RECOMMEND --> FORWARD_TO_NEXT[FORWARD<br/>To higher authority]
    NOT_RECOMMEND --> REJECT[REJECT ✗]
    RE_ENQUIRY --> UNDER_REVIEW
    GROUND_REPORT --> UNDER_REVIEW
    FORWARD_TO_NEXT --> UNDER_REVIEW

    APPROVED --> END([Terminal])
    REJECT --> END
```

### Step-by-Step Form Wizard

```mermaid
flowchart TB
    subgraph WIZARD["Application Wizard - 10 Steps"]
        direction TB
        S01[Step 1<br/>Personal Info<br/>Name, Aadhar, PAN, DOB] --> S02
        S02[Step 2<br/>Address Details<br/>Present & Permanent] --> S03
        S03[Step 3<br/>Occupation & Business<br/>Job, Office Address] --> S04
        S04[Step 4<br/>Criminal History<br/>Convictions, FIR, Bonds] --> S05
        S05[Step 5<br/>License History<br/>Previous apps, suspension] --> S06
        S06[Step 6<br/>License Details<br/>Weapon type, purpose] --> S07
        S07[Step 7<br/>Biometric Info<br/>Photo, Signature, Iris] --> S08
        S08[Step 8<br/>Document Upload<br/>Aadhar, PAN, Certificates] --> S09
        S09[Step 9<br/>Preview<br/>Review all data] --> S10
        S10[Step 10<br/>Declaration<br/>Accept terms & submit]
    end

    S10 --> SUBMITTED[Application Submitted<br/>Status: INITIATE]
```

## 3.2 Renewal Lifecycle

```mermaid
flowchart LR
    EXISTING[Existing License<br/>Holder] --> CREATE[RENEWAL DRAFT]
    CREATE --> COPY[Copy data from<br/>fresh license record]
    COPY --> UPDATE[Update details<br/>Address, Occupation]
    UPDATE --> SUBMIT[Submit for review]
    SUBMIT --> WORKFLOW[Workflow Processing<br/>Same as Fresh]
    WORKFLOW --> APPROVED[APPROVED]
    WORKFLOW --> REJECTED[REJECTED]
    APPROVED --> MERGE{Merge Required?}
    MERGE -->|Yes| MERGE_OP[Merge renewal data<br/>into fresh license]
    MERGE -->|No| FINAL[License Renewed]
    MERGE_OP --> AUDIT[Audit Log Created]
    AUDIT --> FINAL
```

### Key Renewal Rules

- **Pre-population**: Renewal form can copy all data from the original fresh license
- **License Number**: The `acknowledgementNo` from the fresh license becomes the `licenseNumber` in renewal
- **Uniqueness**: Only one active renewal per license at a time
- **Merge**: Upon approval, JTCP/CP can merge renewal data back into the fresh license record
- **Audit Trail**: Every merge operation is logged in `LicensesMergeAuditLog`

## 3.3 Application Deletion / Cancellation

```mermaid
flowchart TD
    DEL_REQ[Delete Request<br/>Received] --> CHECK_STATUS{Application<br/>Status?}
    CHECK_STATUS -->|DRAFT| ALLOWED[Allow Deletion]
    CHECK_STATUS -->|INITIATE or beyond| BLOCKED[Block Deletion]

    ALLOWED --> DEL_CHILD[Delete child records:<br/>CriminalHistories<br/>LicenseHistories<br/>LicenseDetails<br/>BiometricData<br/>FileUploads<br/>Addresses]
    DEL_CHILD --> DEL_MAIN[Delete main<br/>application record]
    DEL_MAIN --> DONE[Deleted Successfully]

    BLOCKED --> MSG[Error: Only DRAFT<br/>applications can<br/>be deleted]
```

## 3.4 Complete Workflow State Machine

```mermaid
stateDiagram-v2
    [*] --> DRAFT: Applicant creates

    DRAFT --> INITIATE: Submit application
    DRAFT --> [*]: Delete draft

    INITIATE --> UNDER_REVIEW: Officer takes up
    INITIATE --> FORWARD: Forward to other

    FORWARD --> UNDER_REVIEW: Received by next

    UNDER_REVIEW --> RECOMMEND: Recommend
    UNDER_REVIEW --> NOT_RECOMMEND: Not recommend
    UNDER_REVIEW --> RE_ENQUIRY: Request more info
    UNDER_REVIEW --> GROUND_REPORT: Generate report
    UNDER_REVIEW --> FORWARD: Forward up hierarchy

    RECOMMEND --> APPROVED: Final approve
    RECOMMEND --> FORWARD: Forward for higher approval

    NOT_RECOMMEND --> REJECT: Reject
    NOT_RECOMMEND --> FORWARD: Forward for review

    RE_ENQUIRY --> UNDER_REVIEW: Re-enquiry done
    GROUND_REPORT --> UNDER_REVIEW: Report received

    APPROVED --> [*]: Terminal - License Issued
    REJECT --> [*]: Terminal - Rejected
    CLOSE --> [*]: Terminal - Closed
    DISPOSE --> [*]: Terminal - Disposed
    CANCEL --> [*]: Terminal - Cancelled
```

---

## 3.5 Approval Hierarchy

```mermaid
graph TB
    LEVEL0[Level 0: APPLICANT] -->|Submit| LEVEL1

    subgraph LEVEL1[Level 1: Station House Officer]
        SHO[SHO<br/>Station House Officer]
    end

    subgraph LEVEL2[Level 2: Zonal Level]
        ZS[ZS<br/>Zonal Superintendent]
    end

    subgraph LEVEL3[Level 3: Assistant Commissioner]
        ACP[ACP<br/>Assistant Commissioner<br/>of Police]
    end

    subgraph LEVEL4[Level 4: Deputy Commissioner]
        DCP[DCP<br/>Deputy Commissioner<br/>of Police]
    end

    subgraph LEVEL5[Level 5: Joint Commissioner]
        JTCP[JTCP<br/>Joint Commissioner<br/>of Police]
    end

    subgraph LEVEL6[Level 6: Commissioner]
        CP[CP<br/>Commissioner<br/>of Police]
    end

    SHO -->|Forward / Recommend| ZS
    ZS -->|Forward / Recommend| ACP
    ACP -->|Forward / Recommend| DCP
    DCP -->|Forward / Recommend| JTCP
    JTCP -->|Forward / Recommend| CP

    CP -->|Final Approval| APPROVED[✓ APPROVED]

    style APPROVED fill:#22c55e,color:#fff
    style LEVEL0 fill:#f3f4f6
    style LEVEL1 fill:#dbeafe
    style LEVEL2 fill:#e0e7ff
    style LEVEL3 fill:#c7d2fe
    style LEVEL4 fill:#a5b4fc
    style LEVEL5 fill:#818cf8
    style LEVEL6 fill:#6366f1,color:#fff
```

## 3.6 Action-to-Status Mapping

```mermaid
flowchart LR
    subgraph Actions["Available Actions"]
        INITIATE[INITIATE]
        FORWARD[FORWARD]
        RECOMMEND[RECOMMEND]
        NOT_RECOMMEND[NOT_RECOMMEND]
        APPROVE[APPROVED]
        REJECT[REJECT]
        RE_ENQUIRY[RE_ENQUIRY]
        GROUND_REPORT[GROUND_REPORT]
        RED_FLAG[RED_FLAG]
        CLOSE[CLOSE]
        DISPOSE[DISPOSE]
        CANCEL[CANCEL]
    end

    subgraph ResultingStatus["Resulting Status"]
        S_INIT[INITIATE]
        S_FWD[FORWARD]
        S_REC[RECOMMEND]
        S_NREC[NOT_RECOMMEND]
        S_APPR[APPROVED]
        S_REJ[REJECT]
        S_REN[RE_ENQUIRY]
        S_GR[GROUND_REPORT]
        S_CLOSE[CLOSE]
        S_DISP[DISPOSE]
        S_CANC[CANCEL]
    end

    INITIATE --> S_INIT
    FORWARD --> S_FWD
    RECOMMEND --> S_REC
    NOT_RECOMMEND --> S_NREC
    APPROVE --> S_APPR
    REJECT --> S_REJ
    RE_ENQUIRY --> S_REN
    GROUND_REPORT --> S_GR
    RED_FLAG --> S_FWD
    CLOSE --> S_CLOSE
    DISPOSE --> S_DISP
    CANCEL --> S_CANC

    style S_APPR fill:#22c55e,color:#fff
    style S_REJ fill:#ef4444,color:#fff
    style S_CLOSE fill:#f97316,color:#fff
    style S_DISP fill:#f97316,color:#fff
    style S_CANC fill:#ef4444,color:#fff
```

---

# 4. User Roles & Permissions

## 4.1 Complete Role Reference

| #   | Role Code     | Display Name                 | Category | Can Access Settings | Can Forward | Can Re-enquiry | Can Generate Report | Can FLAF | Can Create Fresh |
| --- | ------------- | ---------------------------- | -------- | ------------------- | ----------- | -------------- | ------------------- | -------- | ---------------- |
| 1   | `APPLICANT`   | Applicant                    | Citizen  | ✗                   | ✗           | ✗              | ✗                   | ✗        | ✗                |
| 2   | `SHO`         | Station House Officer        | Police   | ✗                   | ✓           | ✓              | ✓                   | ✓        | ✓                |
| 3   | `ZS`          | Zonal Superintendent         | Police   | ✗                   | ✓           | ✓              | ✓                   | ✓        | ✓                |
| 4   | `ACP`         | Asst. Commissioner of Police | Police   | ✗                   | ✓           | ✓              | ✓                   | ✓        | ✓                |
| 5   | `DCP`         | Dy. Commissioner of Police   | Police   | ✗                   | ✓           | ✓              | ✓                   | ✓        | ✓                |
| 6   | `JTCP`        | Joint Commissioner of Police | Police   | ✗                   | ✓           | ✗              | ✗                   | ✓        | ✓                |
| 7   | `CP`          | Commissioner of Police       | Police   | ✗                   | ✓           | ✗              | ✗                   | ✓        | ✓                |
| 8   | `AS`          | Arms Superintendent          | Police   | ✗                   | ✓           | ✗              | ✗                   | ✓        | ✓                |
| 9   | `ADO`         | Administrative Officer       | Admin    | ✓                   | ✓           | ✗              | ✗                   | ✓        | ✓                |
| 10  | `CADO`        | Chief Administrative Officer | Admin    | ✓                   | ✓           | ✗              | ✗                   | ✓        | ✓                |
| 11  | `ADMIN`       | System Administrator         | Admin    | ✓                   | ✓           | ✗              | ✗                   | ✓        | ✓                |
| 12  | `SUPER_ADMIN` | Super Administrator          | Admin    | ✓                   | ✓           | ✓              | ✓                   | ✓        | ✓                |

## 4.2 Role Permission Flags (from `Roles` model)

| Field                        | Type      | Default | Description                                       |
| ---------------------------- | --------- | ------- | ------------------------------------------------- |
| `is_active`                  | `Boolean` | `true`  | Whether the role is active for login              |
| `dashboard_title`            | `String`  | —       | Custom title shown on the role's dashboard        |
| `menu_items`                 | `Json?`   | —       | JSON array of menu configurations for the sidebar |
| `permissions`                | `Json?`   | —       | JSON object with custom permission flags          |
| `can_access_settings`        | `Boolean` | `false` | Can access system settings pages                  |
| `can_forward`                | `Boolean` | `false` | Can forward applications to next user             |
| `can_re_enquiry`             | `Boolean` | `false` | Can request re-enquiry on applications            |
| `can_generate_ground_report` | `Boolean` | `false` | Can generate ground reports                       |
| `can_FLAF`                   | `Boolean` | `false` | Can access Fresh Application Form                 |
| `can_create_freshLicence`    | `Boolean` | `false` | Can create fresh license records                  |

## 4.3 Role-Action Mapping

Each role's permitted actions are stored in the `RolesActionsMapping` table. This is a many-to-many relationship:

```mermaid
erDiagram
    ROLES ||--o{ ROLES_ACTIONS_MAPPING : "has"
    ACTIONES ||--o{ ROLES_ACTIONS_MAPPING : "has"
    ROLES_ACTIONS_MAPPING {
        int id PK
        int roleId FK
        int actionId FK
        boolean isActive
    }
```

**Logic**:

- A role `roleId` can only perform actions that are in `RolesActionsMapping` with `isActive = true`
- The `WorkflowService.handleUserAction()` validates this before processing
- Attempting an unmapped action results in `403 Forbidden`

---

# 5. Frontend Architecture

## 5.1 Component Tree

```mermaid
graph TB
    subgraph APP["Next.js App Root"]
        LAYOUT[Root Layout]
        PROVIDERS[RootProviders]
        AUTH_INIT[AuthInitializer]
    end

    subgraph PAGES["Pages (App Router)"]
        LOGIN[/login]
        DASHBOARD[/ (dashboard)]
        INBOX[/inbox]
        INBOX_TYPE[/inbox/[type]]
        APP_DETAIL[/application/[id]]
        FRESH_FORM[/forms/createFreshApplication/[step]]
        RENEWAL_FORM[/forms/renewal]
        ADMIN[/admin/*]
        SUPER_ADMIN[/superAdmin/*]
        SETTINGS[/settings]
        REPORTS[/reports]
        NOTIFICATIONS[/notifications]
        PUBLIC_VERIFY[/public/application/[id]]
    end

    subgraph COMPONENTS["Shared Components"]
        SIDEBAR[Sidebar]
        HEADER[Header]
        APP_TABLE[ApplicationTable]
        PROC_MODAL[ProcessApplicationModal]
        FWD_MODAL[ForwardApplicationModal]
        PROCEEDINGS[ProceedingsForm]
        RENEWAL_PROC[RenewalProceedingsForm]
        QR_DISPLAY[QRCodeDisplay]
        SKELETON[Skeleton Loaders]
        CASCADE_LOC[CascadingLocationSelect]
    end

    subgraph FRESH_FORM_COMPS["Fresh Form Components"]
        PERSONAL[PersonalInformation]
        ADDRESS[AddressDetails]
        OCCUPATION[OccupationDetails]
        OCCUPATION_BIZ[OccupationBussiness]
        CRIMINAL[CriminalHistory]
        LICENSE_HIST[LicenseHistory]
        LICENSE_DET[LicenseDetails]
        BIOMETRIC[BiometricInformation]
        DOCUMENTS[DocumentsUpload]
        PREVIEW[Preview]
        DECLARATION[Declaration]
    end

    subgraph ADMIN_COMPS["Admin Components"]
        ADMIN_DASH[Admin Dashboard]
        USER_MGMT[User Management]
        ROLE_MGMT[Role Management]
        PERM_MATRIX[Permission Matrix]
        LOCATION_MGMT[Location Management]
        ANALYTICS[Analytics Dashboard]
        WORKFLOW_CFG[Workflow Configuration]
        FLOW_MAP[Flow Mapping]
    end

    subgraph CHARTS["Analytics Charts"]
        TIMELINE[TimelineChart]
        ROLE_LOAD[RoleLoadChart]
        STATUS_DIST[StatusDistributionChart]
        SUMMARY[SummaryStats]
        APPS_TABLE[ApplicationsTable]
    end

    PROVIDERS --> LAYOUT
    LAYOUT --> HEADER
    LAYOUT --> SIDEBAR
    LAYOUT --> PAGES

    INBOX --> APP_TABLE
    INBOX_TYPE --> APP_TABLE
    APP_DETAIL --> PROC_MODAL
    APP_DETAIL --> FWD_MODAL
    APP_DETAIL --> PROCEEDINGS
    APP_DETAIL --> QR_DISPLAY
    APP_DETAIL --> RENEWAL_PROC

    FRESH_FORM --> FRESH_FORM_COMPS
    FRESH_FORM --> CASCADE_LOC

    ADMIN --> ADMIN_COMPS
    ADMIN --> ANALYTICS
    ADMIN --> CHARTS

    SUPER_ADMIN --> ADMIN_COMPS
```

## 5.2 State Management Architecture

```mermaid
graph TB
    subgraph GLOBAL_STATE["Global State"]
        REDUX[Redux Store]
        REDUX --> AUTH_SLICE[authSlice<br/>user, token, loading]
        REDUX --> UI_SLICE[uiSlice<br/>inbox visibility]
    end

    subgraph CONTEXT["React Context"]
        APP_CTX[ApplicationContext<br/>Current application data]
        INBOX_CTX[InboxContext<br/>Application list, loading]
        ADMIN_MENU[AdminMenuContext<br/>Menu items, active key]
        ADMIN_THEME[AdminThemeContext<br/>Dark/Light mode]
        ADMIN_AUTH[AdminAuthContext<br/>Admin login state]
        LAYOUT_CTX[LayoutContext<br/>Header/Sidebar visibility]
        GLOBAL_ACTION[GlobalActionContext<br/>Action state, navigation]
        NOTIF_CTX[NotificationContext<br/>Notifications, unread count]
        USER_CTX[UserContext<br/>Basic user info]
    end

    subgraph ZUSTAND["Zustand Stores"]
        FRESH_FORM_STORE[useFreshFormStore<br/>Multi-step form data]
    end

    subgraph HOOKS["Custom Hooks"]
        USE_AUTH[useAuth<br/>Auth selector]
        USE_APP_FORM[useApplicationForm<br/>Form state, navigation]
        USE_LOC_HIER[useLocationHierarchy<br/>Location data]
        USE_SIDEBAR[useSidebarCounts<br/>Counts by status]
        USE_RENEWAL_WF[useRenewalWorkflow<br/>Renewal actions]
        USE_FILE_UPLOAD[useFileUpload<br/>File management]
    end

    HOOKS --> REDUX
    HOOKS --> CONTEXT
    HOOKS --> ZUSTAND
    COMPONENTS[UI Components] --> HOOKS
    COMPONENTS --> CONTEXT
```

## 5.3 API Service Layer

```mermaid
graph TB
    COMP[React Components] --> HOOKS

    subgraph API_LAYER["API Service Layer"]
        AXIOS[axiosConfig.ts<br/>Base axios instance]
        AXIOS --> INTERCEPTORS[Interceptors<br/>Auth header, 401 handling]

        AUTH_CLIENT[authenticatedApiClient.ts<br/>ApiClient class]
        AUTH_CLIENT --> AXIOS

        APP_SVC[applicationService.ts<br/>Fresh app CRUD]
        RENEWAL_SVC[renewalService.ts<br/>Renewal CRUD]
        LOCATION_SVC[locationApi.ts<br/>Location hierarchy]
        FILE_SVC[fileUploadService.ts<br/>File management]
        BIOMETRIC_SVC[biometricAPIService.ts<br/>Biometric operations]
        SIDEBAR_SVC[sidebarApiCalls.ts<br/>Status-based queries]
        WEAPON_SVC[weapons.ts<br/>Weapon types]

        APP_SVC --> AUTH_CLIENT
        RENEWAL_SVC --> AUTH_CLIENT
        LOCATION_SVC --> AXIOS
        FILE_SVC --> AUTH_CLIENT
        BIOMETRIC_SVC --> AXIOS
        SIDEBAR_SVC --> AUTH_CLIENT
        WEAPON_SVC --> AUTH_CLIENT
    end

    HOOKS --> API_LAYER
```

---

# 6. Backend Architecture

## 6.1 Module Dependency Diagram

```mermaid
graph TB
    ROOT[AppModule] --> HEALTH[HealthModule]
    ROOT --> AUTH[AuthModule]
    ROOT --> USER[UserModule]
    ROOT --> ROLES[RolesModule]
    ROOT --> STATUS[StatusModule]
    ROOT --> ACTIONS[ActionesModule]
    ROOT --> WEAPONS[WeaponsModule]
    ROOT --> LOCATIONS[LocationsModule]
    ROOT --> FRESH[ApplicationFormModule]
    ROOT --> RENEWAL[RenewalFormModule]
    ROOT --> WORKFLOW[WorkflowModule]
    ROOT --> FLOW_MAP[FlowMappingModule]
    ROOT --> BIOMETRIC[BiometricModule]
    ROOT --> ANALYTICS[AnalyticsModule]
    ROOT --> PUBLIC[PublicModule]
    ROOT --> QR[QRCodeModule]

    AUTH --> PRISMA_SVC(PrismaService)
    FRESH --> PRISMA_SVC
    RENEWAL --> PRISMA_SVC
    WORKFLOW --> PRISMA_SVC
    BIOMETRIC --> PRISMA_SVC
    LOCATIONS --> PRISMA_SVC
    ANALYTICS --> PRISMA_SVC

    WORKFLOW --> CONSTANTS[Workflow Constants<br/>workflow-actions.ts]
    FRESH --> CONSTANTS
    RENEWAL --> CONSTANTS

    GUARDS[AuthGuard / JwtAuthGuard] --> AUTH
    GUARDS --> FRESH
    GUARDS --> RENEWAL
    GUARDS --> WORKFLOW
    GUARDS --> BIOMETRIC
    GUARDS --> LOCATIONS
```

## 6.2 Request Processing Pipeline

```mermaid
flowchart TD
    REQ[HTTP Request] --> CORS[CORS Check]
    CORS --> GLOBAL_PREFIX[Global Prefix: /api]
    GLOBAL_PREFIX --> GUARD{Auth Guard}

    GUARD -->|JwtAuthGuard| JWT_CHECK{Has valid<br/>JWT token?}
    GUARD -->|AuthGuard| AUTH_CHECK{JWT valid<br/>& user exists?}

    JWT_CHECK -->|No| 401[401 Unauthorized]
    AUTH_CHECK -->|No| 401

    JWT_CHECK -->|Yes| DECODED[JWT Decoded<br/>Attach to request.user]
    AUTH_CHECK -->|Yes| DB_USER[Fetch user from DB<br/>Include role & location]
    DB_USER --> ROLE_CHECK{Role has<br/>permission?}

    ROLE_CHECK -->|No| 403[403 Forbidden]
    ROLE_CHECK -->|Yes| DECODED

    DECODED --> CONTROLLER[Route to Controller]
    CONTROLLER --> VALIDATION[ValidationPipe<br/>DTO validation]
    VALIDATION --> SERVICE[Business Service]
    SERVICE --> DATABASE[Database Operations via Prisma]

    DATABASE --> RESPONSE[Response]
    SERVICE --> RESPONSE

    RESPONSE --> LOGGING[LoggingInterceptor<br/>Log request/response]
    LOGGING --> ERROR_CHECK{Error?}
    ERROR_CHECK -->|Yes| ERROR_HANDLER[ErrorsInterceptor /<br/>AllExceptionsFilter]
    ERROR_CHECK -->|No| CLIENT[Client Response]

    ERROR_HANDLER --> CLIENT
```

## 6.3 Complete Controller & Service Registry

### Authentication Module

| Controller       | Route   | Methods                                                |
| ---------------- | ------- | ------------------------------------------------------ |
| `AuthController` | `/auth` | `POST login`, `GET getMe`, `POST logout`, `GET verify` |

| Service       | Key Dependencies          |
| ------------- | ------------------------- |
| `AuthService` | `prisma`, `jwt`, `bcrypt` |

### User Module

| Controller       | Route    | Methods                                           |
| ---------------- | -------- | ------------------------------------------------- |
| `UserController` | `/users` | `POST`, `GET`, `GET :id`, `PUT :id`, `DELETE :id` |

| Service       | Key Methods                                       |
| ------------- | ------------------------------------------------- |
| `UserService` | CRUD operations with role and location assignment |

### Roles Module

| Controller              | Route          | Methods                                                                                         |
| ----------------------- | -------------- | ----------------------------------------------------------------------------------------------- |
| `RolesController`       | `/admin/roles` | `GET`, `GET :id`, `POST`, `PUT :id`, `DELETE :id`, `PATCH :id/deactivate`, `PATCH :id/activate` |
| `PublicRolesController` | `/roles`       | `GET` (public)                                                                                  |

| Service        | Key Methods                                    |
| -------------- | ---------------------------------------------- |
| `RolesService` | CRUD with permission and menu_items management |

### Status Module

| Controller         | Route     | Methods                    |
| ------------------ | --------- | -------------------------- |
| `StatusController` | `/status` | `POST`, `GET`, `PATCH :id` |

### Actions Module

| Controller           | Route       | Methods                                                                                              |
| -------------------- | ----------- | ---------------------------------------------------------------------------------------------------- |
| `ActionesController` | `/actiones` | `GET`, `POST RolesActionsMapping`, `PATCH RolesActionsMapping/:id`, `DELETE RolesActionsMapping/:id` |

### Fresh Application Module

| Controller                       | Route                 | Methods                                                                                                                                                                                                                                                                                    |
| -------------------------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ApplicationFormController`      | `/application-form`   | `POST personal-details`, `PATCH`, `POST :applicationId/upload-file`, `DELETE :id`, `DELETE application/:id`, `GET`, `GET helpers/states`, `GET helpers/districts/:stateId`, `GET helpers/police-stations/:divisionId`, `GET helpers/validate-ids`, `GET users-in-hierarchy/:applicationId` |
| `ApplicationHierarchyController` | `/users-in-hierarchy` | `GET :applicationId`                                                                                                                                                                                                                                                                       |

### Renewal Module

| Controller              | Route            | Methods                                                                                                                                                                                                                             |
| ----------------------- | ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `RenewalFormController` | `/renewal-forms` | `POST`, `PATCH`, `POST /:applicationId/upload-file`, `DELETE /file/:fileId`, `DELETE /application/:applicationId`, `GET`, `GET /:applicationId`, `GET merge-audit-logs/all`, `GET merge-audit-logs/:mergeId`, `POST approved/merge` |

### Workflow Module

| Controller                      | Route       | Methods                                    |
| ------------------------------- | ----------- | ------------------------------------------ |
| `WorkflowController`            | `/workflow` | `POST action`                              |
| `WorkflowController (statuses)` | `/workflow` | `GET statuses-actions`, `GET applications` |

### Flow Mapping Module

| Controller              | Route           | Methods                                                                                                                                                                      |
| ----------------------- | --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `FlowMappingController` | `/flow-mapping` | `GET :roleId`, `GET`, `PUT :roleId`, `POST`, `POST validate`, `DELETE :roleId`, `GET :roleId/next-roles`, `POST :sourceRoleId/duplicate/:targetRoleId`, `POST :roleId/reset` |

### Locations Module

| Controller            | Route        | Methods                                                                   |
| --------------------- | ------------ | ------------------------------------------------------------------------- |
| `LocationsController` | `/locations` | CRUD for states, districts, zones, divisions, police stations + hierarchy |

### Weapons Module

| Controller          | Route      | Methods                   |
| ------------------- | ---------- | ------------------------- |
| `WeaponsController` | `/Weapons` | `GET` (list weapon types) |

### Biometric Module

| Controller            | Route        | Methods                                                                                                                                                                                                                                 |
| --------------------- | ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `BiometricController` | `/biometric` | `POST device/status`, `GET templates/for-matching`, `POST enroll/:applicantId`, `POST store/:applicantId`, `POST verify/:applicantId`, `GET enrolled/:applicantId`, `DELETE :applicantId/:fingerprintId`, `GET audit-logs/:applicantId` |

| Service                      | Description                                                                                 |
| ---------------------------- | ------------------------------------------------------------------------------------------- |
| `BiometricService`           | Core biometric operations: enrollment, verification, template matching, duplicate detection |
| `BiometricEncryptionService` | Template encryption/decryption                                                              |
| `BiometricAuditService`      | Biometric action audit logging                                                              |

### Analytics Module

| Controller            | Route              | Methods                                                                                               |
| --------------------- | ------------------ | ----------------------------------------------------------------------------------------------------- |
| `AnalyticsController` | `/admin/analytics` | `GET applications`, `GET role-load`, `GET states`, `GET admin-activities`, `GET applications/details` |

### Other Modules

| Module         | Services                                            |
| -------------- | --------------------------------------------------- |
| `PublicModule` | `PublicService` — public application lookup         |
| `QRCodeModule` | `QRCodeService` — QR code generation & verification |
| `HealthModule` | Health check endpoints                              |

---

# 7. Complete API Reference

## 7.1 Authentication APIs

### POST `/api/auth/login`

Authenticate user credentials.

**Auth:** None (public)

**Request Body:**

```json
{
  "username": "string (required) - Login username",
  "password": "string (required) - Login password"
}
```

**Success Response (200):**

```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs... (JWT string)",
  "user": {
    "id": "1",
    "username": "admin",
    "email": "admin@example.com",
    "name": "Admin",
    "role": {
      "id": 1,
      "code": "ADMIN",
      "name": "Administrator",
      "is_active": true,
      "dashboard_title": "Admin Dashboard",
      "menu_items": [ ... ],
      "permissions": { ... },
      "can_access_settings": true,
      "can_forward": true,
      "can_re_enquiry": false,
      "can_generate_ground_report": false,
      "can_FLAF": true,
      "can_create_freshLicence": true
    }
  }
}
```

**Error Responses:**
| Status | Body |
|---|---|
| `401` | `{ "success": false, "message": "Invalid username or password" }` |
| `401` | `{ "success": false, "message": "Login failed - role inactive: ROLE_CODE" }` |

**Business Purpose:** Authenticate users and issue a JWT token (24h expiry). Sets `auth` and `role` cookies.

---

### GET `/api/auth/getMe`

Get current user's profile with location details.

**Auth:** `AuthGuard` (Bearer token required)

**Success Response (200):**

```json
{
  "id": "1",
  "username": "admin",
  "email": "admin@example.com",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z",
  "role": {
    "id": 1,
    "code": "ADMIN",
    "name": "Administrator",
    "is_active": true,
    "dashboard_title": "Admin Dashboard",
    "menu_items": [ ... ],
    "permissions": { ... }
  },
  "location": {
    "state": { "id": "1", "name": "West Bengal" },
    "district": { "id": "1", "name": "Kolkata" },
    "division": { "id": "1", "name": "Division 1" },
    "zone": { "id": "1", "name": "Zone A" },
    "policeStation": { "id": "1", "name": "Lalbazar PS" }
  }
}
```

---

### GET `/api/auth/verify`

Verify if the current JWT token is valid.

**Auth:** `AuthGuard` (Bearer token required)

**Success Response (200):**

```json
{
  "valid": true,
  "user": {
    "sub": "1",
    "username": "admin",
    "role_code": "ADMIN",
    "state_id": 1,
    "district_id": 1
  }
}
```

---

### POST `/api/auth/logout`

Logout current session.

**Auth:** None

**Response (200):**

```json
{
  "success": true,
  "message": "Logged out"
}
```

---

## 7.2 Fresh Application APIs

All endpoints below require `AuthGuard` (Bearer token).

### POST `/api/application-form/personal-details`

Create new application with personal details. Application is automatically set to **DRAFT** status.

**Request Body:**

```json
{
  "acknowledgementNo": "string (optional) - Custom acknowledgement number",
  "firstName": "string (required) - Applicant first name",
  "middleName": "string (optional) - Middle name",
  "lastName": "string (required) - Last name",
  "parentOrSpouseName": "string (required) - Parent or spouse name",
  "filledBy": "string (optional) - Who filled the form",
  "sex": "enum (required) - MALE | FEMALE | OTHER",
  "placeOfBirth": "string (optional) - Place of birth",
  "dateOfBirth": "ISO8601 string (optional) - Date of birth",
  "dobInWords": "string (optional) - DOB in words",
  "aadharNumber": "string (optional) - 12-digit Aadhar number",
  "panNumber": "string (optional) - PAN number",
  "isDeclarationAccepted": "boolean (optional)",
  "isAwareOfLegalConsequences": "boolean (optional)",
  "isTermsAccepted": "boolean (optional)"
}
```

**Response (201):**

```json
{
  "success": true,
  "applicationId": 123,
  "message": "Personal details saved with DRAFT status"
}
```

**Error Codes:** `400` (Bad Request), `401` (Unauthorized), `500` (Server Error)

---

### PATCH `/api/application-form?applicationId={id}&isSubmit={boolean}`

Update application sections. Supports partial updates of any combination of sections.

**Query Parameters:**
| Param | Type | Required | Description |
|---|---|---|---|
| `applicationId` | number | Yes | Application ID |
| `isSubmit` | boolean | No | Set to `true` to submit/finalize |

**Request Body — Sections (all optional):**

**Section A: Present Address**

```json
{
  "presentAddress": {
    "addressLine": "123 Main Street, Block A",
    "stateId": 1,
    "districtId": 1,
    "policeStationId": 1,
    "zoneId": 1,
    "divisionId": 1,
    "sinceResiding": "2020-01-15T00:00:00.000Z",
    "telephoneOffice": "033-12345678",
    "telephoneResidence": "033-87654321",
    "officeMobileNumber": "9876543210",
    "alternativeMobile": "9123456789"
  }
}
```

**Section B: Permanent Address** (same structure as Present Address)

**Section C: Personal Details Update**

```json
{
  "personalDetails": {
    "firstName": "Jane",
    "middleName": "M",
    "lastName": "Doe",
    "parentOrSpouseName": "Janet Doe",
    "sex": "FEMALE",
    "dateOfBirth": "1992-08-15",
    "aadharNumber": "123456789012",
    "panNumber": "ABCDE1234F",
    "dobInWords": "Fifteenth August Nineteen Ninety Two",
    "isDeclarationAccepted": true,
    "isAwareOfLegalConsequences": true,
    "isTermsAccepted": true
  }
}
```

**Section D: Occupation & Business**

```json
{
  "occupationAndBusiness": {
    "occupation": "Software Engineer",
    "officeAddress": "456 Corporate Plaza, IT Park, Sector V",
    "stateId": 1,
    "districtId": 1,
    "cropLocation": "Village ABC, Block XYZ",
    "areaUnderCultivation": 5.5
  }
}
```

**Section E: Criminal History** (replaces all existing)

```json
{
  "criminalHistories": [
    {
      "isConvicted": false,
      "isBondExecuted": false,
      "isProhibited": false,
      "firDetails": [
        {
          "firNumber": "123/2018",
          "underSection": "35",
          "policeStation": "Central PS",
          "unit": "2/3",
          "District": "Hyderabad",
          "state": "Telangana",
          "offence": "",
          "sentence": "",
          "DateOfSentence": "2020-07-10"
        }
      ]
    }
  ]
}
```

**Section F: License History** (replaces all existing)

```json
{
  "licenseHistories": [
    {
      "hasAppliedBefore": true,
      "dateAppliedFor": "2019-06-15",
      "previousAuthorityName": "District Magistrate, Kolkata",
      "previousResult": "REJECTED",
      "hasLicenceSuspended": false,
      "hasFamilyLicence": true,
      "familyMemberName": "John Doe (Father)",
      "familyLicenceNumber": "LIC123456789",
      "familyWeaponsEndorsed": ["Pistol .32", "Rifle .22"],
      "hasSafePlace": true,
      "safePlaceDetails": "Steel almirah with double lock in bedroom",
      "hasTraining": true,
      "trainingDetails": "Basic firearms training from XYZ Academy, Cert No: ABC123"
    }
  ]
}
```

**Section G: License Details** (replaces all existing)

```json
{
  "licenseDetails": [
    {
      "needForLicense": "SELF_PROTECTION",
      "armsCategory": "RESTRICTED",
      "requestedWeaponIds": [1, 2, 3],
      "areaOfValidity": "District-wide",
      "ammunitionDescription": "50 rounds of .32 ammunition",
      "specialConsiderationReason": "Required for personal protection",
      "licencePlaceArea": "Urban areas of Kolkata district",
      "wildBeastsSpecification": "Wild boars, leopards"
    }
  ]
}
```

**Section H: Biometric Data**

```json
{
  "biometricData": {
    "signature": {
      "fileType": "signature",
      "fileName": "signature.png",
      "url": "https://example.com/uploads/signature.png",
      "uploadedAt": "2024-01-15T10:30:00.000Z"
    },
    "photo": {
      "fileType": "photo",
      "fileName": "photo.jpg",
      "url": "https://example.com/uploads/photo.jpg",
      "uploadedAt": "2024-01-15T10:31:00.000Z"
    },
    "irisScan": {
      "fileType": "irisScan",
      "fileName": "iris.png",
      "url": "https://example.com/uploads/iris.png",
      "uploadedAt": "2024-01-15T10:32:00.000Z"
    },
    "fingerprint": {
      "fileType": "fingerprint",
      "fileName": "fingerprint.png",
      "url": "https://example.com/uploads/fingerprint.png",
      "uploadedAt": "2024-01-15T10:33:00.000Z"
    }
  }
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "Application details updated successfully",
  "data": {
    "updatedSections": ["presentAddress", "criminalHistories", "licenseDetails"],
    "application": {
      "id": 1,
      "acknowledgementNo": "ALMS1696050000000",
      "firstName": "John",
      "lastName": "Doe",
      "workflowStatus": {
        "id": 1,
        "code": "DRAFT",
        "name": "Draft"
      },
      "presentAddress": { ... },
      "permanentAddress": { ... },
      "occupationAndBusiness": { ... },
      "criminalHistories": [ ... ],
      "licenseHistories": [ ... ],
      "licenseDetails": [ ... ],
      "biometricData": { ... }
    }
  }
}
```

---

### POST `/api/application-form/{applicationId}/upload-file`

Store file URL and metadata for an application.

**Auth:** `AuthGuard`

**Path Parameters:**
| Param | Type | Description |
|---|---|---|
| `applicationId` | number | Application ID |

**Request Body:**

```json
{
  "fileType": "enum (required) - AADHAR_CARD | PAN_CARD | TRAINING_CERTIFICATE | OTHER_STATE_LICENSE | EXISTING_LICENSE | SAFE_CUSTODY | MEDICAL_REPORT | REJECTED_LICENSE | CLAIM_DOCS | SIGNATURE_THUMB | PHOTOGRAPH | IRIS_SCAN | OTHER",
  "fileUrl": "string (required) - URL or path to the uploaded file",
  "fileName": "string (required) - Original file name",
  "fileSize": "number (required) - File size in bytes (max 10MB)"
}
```

**Response (201):**

```json
{
  "success": true,
  "message": "File uploaded successfully",
  "data": {
    "id": 1,
    "applicationId": 123,
    "fileType": "AADHAR_CARD",
    "fileName": "aadhar_card.pdf",
    "fileUrl": "uploads/application-123/files/AADHAR_CARD_1696507200000_aadhar_card.pdf",
    "fileSize": 2048576,
    "uploadedAt": "2023-10-05T12:00:00.000Z"
  }
}
```

**Notes:** For `PHOTOGRAPH`, `SIGNATURE_THUMB`, and `IRIS_SCAN` types, only the latest file is kept (previous files of the same type are auto-deleted).

---

### DELETE `/api/application-form/{id}`

Delete a specific file record.

**Auth:** `AuthGuard`

| Param | Type   | Description                |
| ----- | ------ | -------------------------- |
| `id`  | number | Uploaded file ID to delete |

**Response (200):**

```json
{
  "success": true,
  "message": "File record deleted successfully",
  "data": true
}
```

---

### DELETE `/api/application-form/application/{id}`

Delete an entire application. Only DRAFT applications can be deleted.

**Auth:** `AuthGuard`

| Param | Type   | Description              |
| ----- | ------ | ------------------------ |
| `id`  | number | Application ID to delete |

**Response (200):**

```json
{
  "success": true,
  "message": "Application deleted successfully",
  "data": true
}
```

**Error:** `400` — "Only applications in DRAFT status can be deleted"

---

### GET `/api/application-form`

Get applications with filtering, pagination, and search.

**Auth:** `AuthGuard`

**Query Parameters:**
| Param | Type | Default | Description |
|---|---|---|---|
| `page` | number | 1 | Page number |
| `limit` | number | 10 | Items per page |
| `searchField` | string | — | Field to search (`id`, `firstName`, `lastName`, `acknowledgementNo`) |
| `search` | string | — | Search value |
| `orderBy` | string | `createdAt` | Sort field |
| `order` | `asc`\|`desc` | `desc` | Sort direction |
| `applicationId` | number | — | Filter by application ID |
| `acknowledgementNo` | string | — | Filter by acknowledgement number |
| `statusIds` | string | — | Comma-separated status IDs or codes |
| `isOwned` | boolean | `false` | Filter by current user's ownership |
| `isSent` | boolean | `false` | Filter by applications sent by user |

**Response (200):**

```json
{
  "success": true,
  "message": "Applications retrieved successfully",
  "data": [
    {
      "id": 1,
      "almsLicenseId": "ALMS...",
      "acknowledgementNo": "ALMS1696050000000",
      "applicantName": "John Doe",
      "applicationType": "Fresh",
      "createdAt": "2023-10-05T12:00:00.000Z",
      "workflowStatusId": 1,
      "workflowStatus": {
        "id": 1,
        "code": "DRAFT",
        "name": "Draft"
      },
      "currentUser": {
        "id": 1,
        "username": "john_applicant"
      },
      "previousUser": null
    }
  ],
  "usersInHierarchy": [],
  "pagination": {
    "total": 50,
    "page": 1,
    "limit": 10,
    "totalPages": 5
  }
}
```

---

### GET `/api/application-form/helpers/states`

Get all states for form dropdowns.

**Auth:** `AuthGuard`

**Response (200):**

```json
{
  "success": true,
  "message": "States retrieved successfully",
  "data": [
    { "id": 1, "name": "West Bengal" },
    { "id": 2, "name": "Maharashtra" }
  ]
}
```

---

### GET `/api/application-form/helpers/districts/{stateId}`

Get districts by state ID.

**Auth:** `AuthGuard`

**Response (200):**

```json
{
  "success": true,
  "message": "Districts retrieved successfully",
  "data": [
    { "id": 1, "name": "Kolkata", "stateId": 1 },
    { "id": 2, "name": "Howrah", "stateId": 1 }
  ]
}
```

---

### GET `/api/application-form/helpers/police-stations/{divisionId}`

Get police stations by division ID.

**Auth:** `AuthGuard`

**Response (200):**

```json
{
  "success": true,
  "message": "Police stations retrieved successfully",
  "data": [
    { "id": 1, "name": "Lalbazar Police Station", "divisionId": 1 },
    { "id": 2, "name": "Bowbazar Police Station", "divisionId": 1 }
  ]
}
```

---

### GET `/api/application-form/helpers/validate-ids?stateId=1&districtId=1`

Validate reference IDs (state, district).

**Auth:** `AuthGuard`

**Response (200):**

```json
{
  "success": true,
  "message": "ID validation completed",
  "data": {
    "state": {
      "id": 1,
      "exists": true,
      "data": { "id": 1, "name": "West Bengal" }
    },
    "district": {
      "id": 1,
      "exists": true,
      "data": { "id": 1, "name": "Kolkata", "stateId": 1 }
    }
  }
}
```

---

### GET `/api/application-form/users-in-hierarchy/{applicationId}?applicationType=FreshLicenseApplicationForm`

Get users in hierarchy that the current user can forward the application to.

**Auth:** `AuthGuard`

**Business Logic:**

1. Fetches the application to determine the applicant's location (present address)
2. Gets the current user's role
3. Looks up `RoleFlowMapping` for the current role → finds `nextRoleIds`
4. Queries users whose `roleId` is in `nextRoleIds` AND whose location matches the applicant's location

**Response (200):**

```json
{
  "success": true,
  "message": "Users in hierarchy fetched successfully",
  "data": [
    {
      "id": 5,
      "username": "officer_zs",
      "roleId": 3,
      "roleCode": "ZS"
    }
  ]
}
```

---

## 7.3 Renewal APIs

All endpoints below require `AuthGuard` unless specified.

### POST `/api/renewal-forms`

Create a new renewal application with personal details.

**Auth:** `AuthGuard`

**Request Body:**

```json
{
  "licenseNumber": "ALMS1696050000000 (required) - Existing license number to renew",
  "firstName": "XYZ (required)",
  "middleName": "K (optional)",
  "lastName": "Sharma (required)",
  "parentOrSpouseName": "Ramesh Sharma (required)",
  "sex": "MALE (required)",
  "dateOfBirth": "1990-05-10 (optional, ISO date)",
  "dobInWords": "Tenth May Nineteen Ninety (optional)",
  "panNumber": "ABCDE1234F (optional)",
  "aadharNumber": "123456789012 (optional, 12 digits)",
  "filledBy": "Self (optional)"
}
```

**Response (201):**

```json
{
  "id": 1,
  "acknowledgementNo": "RENEWAL-1715754373000-a1b2c3d4",
  "licenseNumber": "ALMS1696050000000",
  "applicantName": "XYZ Sharma",
  "parentOrSpouseName": "Ramesh Sharma",
  "sex": "MALE",
  "dateOfBirth": "1990-05-10T00:00:00.000Z",
  "panNumber": "ABCDE1234F",
  "aadharNumber": "123456789012",
  "createdAt": "2024-05-14T12:00:00.000Z",
  "isSubmit": false,
  "workflowStatusId": 1,
  "currentUserId": 1
}
```

**Error:** `409 Conflict` — "A renewal application for this license already exists."

---

### PATCH `/api/renewal-forms?applicationId={id}&isSubmit={boolean}`

Update renewal application details.

**Auth:** `AuthGuard`

**Query Parameters:**
| Param | Type | Required | Description |
|---|---|---|---|
| `applicationId` | number | Yes | Application ID |
| `isSubmit` | boolean | No | Whether to submit |

**Request Body:**

```json
{
  "personalDetails": { ... },
  "addressDetails": { ... },
  "occupationAndBusiness": { ... },
  "licenseDetails": { ... },
  "acceptanceFlags": {
    "isDeclarationAccepted": true,
    "isAwareOfLegalConsequences": true,
    "isTermsAccepted": true
  },
  "isSubmit": true
}
```

---

### POST `/api/renewal-forms/{applicationId}/upload-file`

Upload file to renewal application.

**Auth:** `AuthGuard`

**Request Body:**

```json
{
  "fileType": "AADHAR_CARD",
  "fileUrl": "https://example.com/files/renewal_aadhar.pdf",
  "fileName": "renewal_aadhar.pdf",
  "fileSize": 1048576
}
```

---

### DELETE `/api/renewal-forms/file/{fileId}`

Delete a file from renewal application.

**Auth:** `AuthGuard`

**Response:** `204 No Content`

---

### DELETE `/api/renewal-forms/application/{applicationId}`

Delete entire renewal application (DRAFT only).

**Auth:** `AuthGuard`

**Response:** `204 No Content`

---

### GET `/api/renewal-forms`

Get renewal applications with pagination, filtering, and search.

**Auth:** `AuthGuard`

**Query Parameters:**
| Param | Type | Default | Description |
|---|---|---|---|
| `page` | number | 1 | Page number |
| `limit` | number | 10 | Items per page |
| `search` | string | — | Search by name, license number, acknowledgement no |
| `status` | string | — | Filter by workflow status (code or name) |
| `currentUserId` | number | — | Filter by current user ID |
| `ordering` | `ASC`\|`DESC` | `DESC` | Sort order |
| `orderBy` | string | `createdAt` | Sort field |

**Response (200):**

```json
{
  "data": [ ... ],
  "total": 25
}
```

---

### GET `/api/renewal-forms/{applicationId}`

Get single renewal application with all details.

**Auth:** `AuthGuard`

**Response (200):**

```json
{
  "id": 1,
  "acknowledgementNo": "RENEWAL-...",
  "licenseNumber": "ALMS1696050000000",
  "applicantName": "XYZ Sharma",
  "workflowStatus": { "id": 1, "code": "DRAFT", "name": "Draft" },
  "currentUser": { ... },
  "presentAddress": { ... },
  "permanentAddress": { ... },
  "occupationAndBusiness": { ... },
  "licenseDetails": [ ... ],
  "fileUploads": [ ... ],
  "biometricData": { ... },
  "workflowHistories": [ ... ]
}
```

---

### POST `/api/renewal-forms/approved/merge`

Merge renewal license data into fresh license record.

**Auth:** `JwtAuthGuard` (JTCP or CP role required)

**Request Body:**

```json
{
  "freshLicenseId": 1,
  "renewalLicenseId": 5
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "Renewal license successfully merged into fresh license",
  "data": {
    "mergeId": "MERGE-1715754373000-12345678",
    "freshLicenseId": 1,
    "renewalLicenseId": 5,
    "mergedFields": ["firstName", "lastName", "dateOfBirth", "aadharNumber", "presentAddress", "occupationAndBusiness", "licenseDetails"],
    "mergedAt": "2024-05-15T11:15:30.000Z",
    "mergedBy": 2,
    "freshLicenseUpdated": { ... }
  }
}
```

**Merge Logic:**

- Validates `freshLicense.acknowledgementNo === renewalLicense.licenseNumber`
- Merges: personal details, addresses (present & permanent), occupation, license details
- Creates a `LicensesMergeAuditLog` entry
- Only `JTCP` and `CP` roles can perform merge

---

### GET `/api/renewal-forms/merge-audit-logs/all`

Get all merge audit logs with pagination.

**Auth:** `AuthGuard`

**Query Parameters:** `page`, `limit`, `mergeId`, `freshLicenseId`, `renewalLicenseId`, `status`

---

### GET `/api/renewal-forms/merge-audit-logs/{mergeId}`

Get single merge audit log by merge ID.

**Auth:** `AuthGuard`

---

## 7.4 Workflow APIs

### POST `/api/workflow/action`

Process a workflow action on an application.

**Auth:** `JwtAuthGuard` (Bearer token required)

**Request Body:**

```json
{
  "applicationId": 1,
  "actionId": 3,
  "nextUserId": 5,
  "remarks": "Application reviewed and recommended for approval",
  "applicationType": "FreshLicenseApplicationForm",
  "attachments": [
    {
      "name": "verification_report.pdf",
      "type": "DOCUMENT",
      "contentType": "application/pdf",
      "url": "https://example.com/files/verification_report.pdf"
    }
  ]
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "forward performed successfully.",
  "updatedApplication": { ... }
}
```

**Action Categories:**
| Category | Actions | nextUserId Required |
|---|---|---|
| **Forward** | `FORWARD` | Yes |
| **Terminal** | `APPROVED`, `REJECT`, `CLOSE`, `DISPOSE`, `CANCEL` | No |
| **In-Place** | `RE_ENQUIRY`, `GROUND_REPORT`, `RECOMMEND`, `INITIATE`, `RED_FLAG` | No |

**Processing Pipeline:**

1. Extract user from JWT
2. Validate `actionId` exists and is active in `Actiones` table
3. Check role-action permission via `RolesActionsMapping`
4. Determine next user and validate action type
5. Find corresponding status for action
6. Update application fields (status, flags, currentUserId)
7. Preserve terminal statuses if already applied
8. Create workflow history entry with role tracking

---

### GET `/api/workflow/statuses-actions`

Get all available statuses and actions.

**Auth:** `JwtAuthGuard`

**Response (200):**

```json
{
  "statuses": [
    { "id": 1, "code": "DRAFT", "name": "Draft", "isActive": true },
    { "id": 2, "code": "INITIATE", "name": "Initiate", "isActive": true },
    { "id": 3, "code": "FORWARD", "name": "Forward", "isActive": true }
  ],
  "actions": [
    {
      "id": 1,
      "code": "FORWARD",
      "name": "Forward",
      "description": "...",
      "isActive": true
    },
    { "id": 2, "code": "APPROVED", "name": "Approved", "isActive": true }
  ]
}
```

---

### GET `/api/workflow/applications?applicationType=FreshLicenseApplicationForm`

Get applications for workflow by type.

**Auth:** `JwtAuthGuard`

| Param             | Value                                                     | Description      |
| ----------------- | --------------------------------------------------------- | ---------------- |
| `applicationType` | `FreshLicenseApplicationForm` \| `RenewalApplicationForm` | Application type |

---

## 7.5 Flow Mapping APIs

All endpoints require `AuthGuard`.

### GET `/api/flow-mapping`

Get all flow mappings.

**Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "currentRoleId": 2,
      "currentRole": {
        "id": 2,
        "code": "SHO",
        "name": "Station House Officer"
      },
      "nextRoleIds": [3, 4],
      "nextRoles": [
        { "id": 3, "code": "ZS", "name": "Zonal Superintendent" },
        { "id": 4, "code": "ACP", "name": "Assistant Commissioner" }
      ],
      "updatedAt": "2024-01-15T10:00:00Z"
    }
  ]
}
```

### GET `/api/flow-mapping/:roleId`

Get flow mapping for a specific role.

### PUT `/api/flow-mapping/:roleId`

Update flow mapping for a role.

**Request Body:**

```json
{
  "nextRoleIds": [3, 4, 5]
}
```

### POST `/api/flow-mapping`

Create new flow mapping.

**Request Body:**

```json
{
  "currentRoleId": 2,
  "nextRoleIds": [3, 4]
}
```

### POST `/api/flow-mapping/validate`

Validate a flow mapping for circular dependencies.

### DELETE `/api/flow-mapping/:roleId`

Delete flow mapping.

### GET `/api/flow-mapping/:roleId/next-roles`

Get next roles for a specific role.

### POST `/api/flow-mapping/:sourceRoleId/duplicate/:targetRoleId`

Duplicate flow mapping from source role to target role.

### POST `/api/flow-mapping/:roleId/reset`

Reset flow mapping to system defaults.

---

## 7.6 Location APIs

### GET `/api/locations/states`

Get all states.

**Response (200):**

```json
[
  { "id": 1, "name": "West Bengal", "createdAt": "...", "updatedAt": "..." },
  { "id": 2, "name": "Maharashtra", ... }
]
```

### GET `/api/locations/districts?stateId=1`

Get districts (optionally filtered by state).

### GET `/api/locations/zones?districtId=1`

Get zones.

### GET `/api/locations/divisions?zoneId=1`

Get divisions.

### GET `/api/locations/police-stations?divisionId=1`

Get police stations.

### GET `/api/locations/hierarchy?stateId=1&districtId=1&zoneId=1&divisionId=1&policeStationId=1`

Get hierarchical location data. Supports querying at any level.

### POST / PUT Endpoints for CRUD

| Method | Endpoint                             | Body                                       |
| ------ | ------------------------------------ | ------------------------------------------ |
| `POST` | `/api/locations/states`              | `{ "name": "New State" }`                  |
| `POST` | `/api/locations/districts`           | `{ "name": "New District", "stateId": 1 }` |
| `POST` | `/api/locations/zones`               | `{ "name": "New Zone", "districtId": 1 }`  |
| `POST` | `/api/locations/divisions`           | `{ "name": "New Division", "zoneId": 1 }`  |
| `POST` | `/api/locations/police-stations`     | `{ "name": "New PS", "divisionId": 1 }`    |
| `PUT`  | `/api/locations/states/:id`          | `{ "name": "Updated Name" }`               |
| `PUT`  | `/api/locations/districts/:id`       | `{ "name": "Updated Name" }`               |
| `PUT`  | `/api/locations/zones/:id`           | `{ "name": "Updated Name" }`               |
| `PUT`  | `/api/locations/divisions/:id`       | `{ "name": "Updated Name" }`               |
| `PUT`  | `/api/locations/police-stations/:id` | `{ "name": "Updated Name" }`               |

---

## 7.7 Biometric APIs

All endpoints require `AuthGuard`.

### POST `/api/biometric/device/status`

Check biometric device connection status.

---

### GET `/api/biometric/templates/for-matching`

Get all stored fingerprint templates for client-side matching.

**Response (200):**

```json
{
  "success": true,
  "templates": [
    {
      "applicationId": 1,
      "almsLicenseId": "ALMS...",
      "applicantName": "John Doe",
      "fingerPosition": "RIGHT_THUMB",
      "template": "base64_encoded_template_string",
      "enrolledAt": "2024-01-15T10:30:00Z"
    }
  ],
  "message": "Found 25 stored templates"
}
```

---

### POST `/api/biometric/enroll/:applicantId`

Enroll a fingerprint with duplicate validation.

**Request Body:**

```json
{
  "fingerTemplate": {
    "template": "base64_encoded_template",
    "quality": 85,
    "captureTime": "2024-01-15T10:30:00Z"
  },
  "fingerPosition": "RIGHT_THUMB",
  "description": "Right thumb enrollment"
}
```

**Response (200):**

```json
{
  "success": true,
  "fingerprintId": "a1b2c3d4e5f6...",
  "message": "Fingerprint enrolled successfully at position RIGHT_THUMB",
  "enrolledAt": "2024-01-15T10:30:00Z"
}
```

**Error (409):** — Duplicate fingerprint detected

---

### POST `/api/biometric/store/:applicantId`

Store a fingerprint directly (after client-side validation passes).

---

### POST `/api/biometric/verify/:applicantId`

Verify a captured fingerprint against stored templates.

**Request Body:**

```json
{
  "fingerTemplate": {
    "template": "base64_encoded_template",
    "quality": 80,
    "captureTime": "2024-01-15T10:35:00Z"
  },
  "matchThreshold": 65
}
```

**Response (200):**

```json
{
  "success": true,
  "isMatch": true,
  "matchScore": 92,
  "matchedFingerPosition": "RIGHT_THUMB",
  "message": "Fingerprint matched at position: RIGHT_THUMB"
}
```

---

### GET `/api/biometric/enrolled/:applicantId`

Get list of enrolled fingerprints (without sensitive template data).

### DELETE `/api/biometric/:applicantId/:fingerprintId`

Delete an enrolled fingerprint.

### GET `/api/biometric/audit-logs/:applicantId`

Get biometric audit logs for an application.

---

## 7.8 User Management APIs

### POST `/api/users`

Create a new user.

**Request Body:**

```json
{
  "username": "new_user",
  "email": "user@example.com",
  "password": "securePassword123",
  "roleId": 1,
  "stateId": 1,
  "districtId": 1,
  "zoneId": 1,
  "divisionId": 1,
  "policeStationId": 1,
  "phoneNo": "9876543210"
}
```

### GET `/api/users`

Get all users.

### GET `/api/users/:id`

Get user by ID.

### PUT `/api/users/:id`

Update user.

### DELETE `/api/users/:id`

Delete user.

---

## 7.9 Analytics APIs

All endpoints require `JwtAuthGuard`.

### GET `/api/admin/analytics/applications`

Get applications aggregated by ISO week.

**Query Parameters:** `fromDate`, `toDate`, `stateId`, `zoneId`

**Response:**

```json
[
  { "week": "2024-W14", "count": 25 },
  { "week": "2024-W15", "count": 32 }
]
```

### GET `/api/admin/analytics/role-load`

Get application load distributed by role.

**Response:**

```json
[
  { "name": "Station House Officer", "value": 45, "code": "SHO" },
  { "name": "Zonal Superintendent", "value": 30, "code": "ZS" }
]
```

### GET `/api/admin/analytics/states`

Get state distribution (approved/rejected/pending counts).

**Response:**

```json
[
  { "state": "approved", "count": 120 },
  { "state": "rejected", "count": 15 },
  { "state": "pending", "count": 65 }
]
```

### GET `/api/admin/analytics/admin-activities`

Get recent admin activity feed.

**Response:**

```json
[
  {
    "id": 1,
    "user": "officer_dcp",
    "action": "FORWARD",
    "time": "May 15, 2024 at 11:30 AM",
    "almsLicenseId": "ALMS...",
    "applicantName": "John Doe"
  }
]
```

### GET `/api/admin/analytics/applications/details`

Get detailed application records.

**Query Parameters:** `status` (APPROVED|REJECTED|PENDING), `page`, `limit`, `q` (search), `sort`, `fromDate`, `toDate`

---

## 7.10 Public & QR API

### GET `/api/public/application/{applicationId}`

Public endpoint to verify license status (used by QR code scanners).

**Auth:** None (public)

**Response (200):**

```json
{
  "applicantName": "John Doe",
  "applicationNumber": "ALMS1696050000000",
  "applicationStatus": "APPROVED",
  "statusCode": "APPROVED",
  "weaponType": "Pistol .32",
  "areaOfValidity": "District-wide"
}
```

### GET `/api/qrcode/generate/{applicationId}`

Generate QR code for a license. Redirects to QR code image or returns base64.

**Auth:** `AuthGuard`

### GET `/api/qrcode/check/{applicationId}`

Check if QR code is valid for an application.

**Auth:** `AuthGuard`

---

## 7.11 Health Check API

### GET `/api/health`

Basic health check.

**Response (200):**

```json
{
  "status": "ok",
  "timestamp": "2024-05-15T11:15:30.000Z"
}
```

### GET `/api/health/ready`

Readiness check.

---

# 8. Database Schema

## 8.1 Complete Entity Relationship Diagram

```mermaid
erDiagram
    Users |o--|| Roles : "has role"
    Users |o--o| States : "located in state"
    Users |o--o| Districts : "located in district"
    Users |o--o| Zones : "located in zone"
    Users |o--o| Divisions : "located in division"
    Users |o--o| PoliceStations : "located in station"

    Roles ||--o{ RolesActionsMapping : "permitted actions"
    Actiones ||--o{ RolesActionsMapping : "mapped to roles"
    Roles ||--o| RoleFlowMapping : "flow config"

    States ||--o{ Districts : "contains"
    Districts ||--o{ Zones : "contains"
    Zones ||--o{ Divisions : "contains"
    Divisions ||--o{ PoliceStations : "contains"

    FreshLicenseApplicationPersonalDetails |o--|| Statuses : "workflow status"
    FreshLicenseApplicationPersonalDetails |o--o| Users : "current owner"
    FreshLicenseApplicationPersonalDetails |o--o| Users : "previous owner"
    FreshLicenseApplicationPersonalDetails |o--o| FLAFAddressesAndContactDetails : "present address"
    FreshLicenseApplicationPersonalDetails |o--o| FLAFAddressesAndContactDetails : "permanent address"
    FreshLicenseApplicationPersonalDetails |o--o| FLAFOccupationAndBusiness : "occupation"
    FreshLicenseApplicationPersonalDetails ||--o{ FLAFCriminalHistories : "has"
    FreshLicenseApplicationPersonalDetails ||--o{ FLAFLicenseHistories : "has"
    FreshLicenseApplicationPersonalDetails ||--o{ FLAFLicenseDetails : "has"
    FreshLicenseApplicationPersonalDetails ||--o{ FLAFFileUploads : "has"
    FreshLicenseApplicationPersonalDetails |o--o| FLAFBiometricDatas : "has"
    FreshLicenseApplicationPersonalDetails ||--o{ FreshLicenseApplicationsFormWorkflowHistories : "has"

    FLAFLicenseDetails }o--o{ WeaponTypeMaster : "requests weapons"

    RenewalFormPersonalDetails |o--|| Statuses : "workflow status"
    RenewalFormPersonalDetails |o--o| Users : "current owner"
    RenewalFormPersonalDetails |o--o| Users : "previous owner"
    RenewalFormPersonalDetails |o--o| RenewalAddressesAndContactDetails : "present address"
    RenewalFormPersonalDetails |o--o| RenewalAddressesAndContactDetails : "permanent address"
    RenewalFormPersonalDetails |o--o| RenewalOccupationAndBusiness : "occupation"
    RenewalFormPersonalDetails ||--o{ RenewalLicenseDetails : "has"
    RenewalFormPersonalDetails ||--o{ RenewalFileUploads : "has"
    RenewalFormPersonalDetails |o--o| RenewalBiometricDatas : "has"
    RenewalFormPersonalDetails ||--o{ RenewalApplicationsFormWorkflowHistories : "has"

    RenewalLicenseDetails }o--o{ WeaponTypeMaster : "requests weapons"

    LicensesMergeAuditLog }o--|| FreshLicenseApplicationPersonalDetails : "fresh license"
    LicensesMergeAuditLog }o--|| RenewalFormPersonalDetails : "renewal license"
    LicensesMergeAuditLog |o--o| Users : "merged by"

    FLAFAddressesAndContactDetails }o--|| States : "ref"
    FLAFAddressesAndContactDetails }o--|| Districts : "ref"
    FLAFAddressesAndContactDetails }o--|| Zones : "ref"
    FLAFAddressesAndContactDetails }o--|| Divisions : "ref"
    FLAFAddressesAndContactDetails }o--|| PoliceStations : "ref"
```

## 8.2 Complete Table Reference

### 8.2.1 Users & Roles

#### `Users`

| Column            | Type        | Required | Default       | Description            |
| ----------------- | ----------- | -------- | ------------- | ---------------------- |
| `id`              | `Int` (PK)  | ✓        | autoincrement | Unique user ID         |
| `username`        | `String`    | ✓        | —             | Login username         |
| `email`           | `String?`   | —        | —             | Email (unique)         |
| `password`        | `String`    | ✓        | —             | bcrypt hashed password |
| `phoneNo`         | `String?`   | —        | —             | Phone number (unique)  |
| `roleId`          | `Int` (FK)  | ✓        | —             | FK → Roles.id          |
| `stateId`         | `Int?` (FK) | —        | —             | FK → States.id         |
| `districtId`      | `Int?` (FK) | —        | —             | FK → Districts.id      |
| `zoneId`          | `Int?` (FK) | —        | —             | FK → Zones.id          |
| `divisionId`      | `Int?` (FK) | —        | —             | FK → Divisions.id      |
| `policeStationId` | `Int?` (FK) | —        | —             | FK → PoliceStations.id |
| `createdAt`       | `DateTime`  | ✓        | `now()`       | Creation timestamp     |
| `updatedAt`       | `DateTime`  | ✓        | `@updatedAt`  | Update timestamp       |

#### `Roles`

| Column                       | Type              | Required | Default       | Description                     |
| ---------------------------- | ----------------- | -------- | ------------- | ------------------------------- |
| `id`                         | `Int` (PK)        | ✓        | autoincrement | Unique role ID                  |
| `code`                       | `String` (unique) | ✓        | —             | Role code (e.g., ADMIN, DCP)    |
| `name`                       | `String`          | ✓        | —             | Display name                    |
| `is_active`                  | `Boolean`         | ✓        | `true`        | Active flag                     |
| `dashboard_title`            | `String`          | ✓        | —             | Dashboard heading text          |
| `menu_items`                 | `Json?`           | —        | —             | JSON array of menu item configs |
| `permissions`                | `Json?`           | —        | —             | JSON object of permissions      |
| `can_access_settings`        | `Boolean`         | ✓        | `false`       | Settings access                 |
| `can_forward`                | `Boolean`         | ✓        | `false`       | Forward capability              |
| `can_re_enquiry`             | `Boolean`         | ✓        | `false`       | Re-enquiry capability           |
| `can_generate_ground_report` | `Boolean`         | ✓        | `false`       | Ground report capability        |
| `can_FLAF`                   | `Boolean`         | ✓        | `false`       | Fresh license form access       |
| `can_create_freshLicence`    | `Boolean`         | ✓        | `false`       | Fresh license creation          |
| `created_at`                 | `DateTime`        | ✓        | `now()`       | —                               |
| `updated_at`                 | `DateTime`        | ✓        | `@updatedAt`  | —                               |

#### `RolesActionsMapping`

| Column                | Type                        | Description                    |
| --------------------- | --------------------------- | ------------------------------ |
| `id`                  | `Int` (PK)                  | Auto-increment                 |
| `roleId`              | `Int` (FK)                  | FK → Roles.id                  |
| `actionId`            | `Int` (FK)                  | FK → Actiones.id               |
| `isActive`            | `Boolean` (default: `true`) | Whether mapping is active      |
| **Unique constraint** |                             | `@@unique([roleId, actionId])` |

#### `RoleFlowMapping`

| Column                    | Type               | Description                      |
| ------------------------- | ------------------ | -------------------------------- |
| `id`                      | `Int` (PK)         | Auto-increment                   |
| `currentRoleId`           | `Int` (FK, unique) | FK → Roles.id                    |
| `nextRoleIds`             | `Int[]`            | Array of role IDs for forwarding |
| `updatedBy`               | `Int?` (FK)        | FK → Users.id                    |
| `createdAt` / `updatedAt` | `DateTime`         | Timestamps                       |

### 8.2.2 Workflow

#### `Statuses`

| Column                    | Type                         | Description                                   |
| ------------------------- | ---------------------------- | --------------------------------------------- |
| `id`                      | `Int` (PK)                   | Auto-increment                                |
| `code`                    | `String` (unique)            | Status code (DRAFT, INITIATE, APPROVED, etc.) |
| `name`                    | `String`                     | Display name                                  |
| `description`             | `String?`                    | Description                                   |
| `isActive`                | `Boolean` (default: `true`)  | Active flag                                   |
| `isStarted`               | `Boolean` (default: `false`) | Whether this is the initial/start status      |
| `createdAt` / `updatedAt` | `DateTime`                   | Timestamps                                    |

#### `Actiones`

| Column                    | Type                        | Description                                   |
| ------------------------- | --------------------------- | --------------------------------------------- |
| `id`                      | `Int` (PK)                  | Auto-increment                                |
| `code`                    | `String` (unique)           | Action code (FORWARD, APPROVED, REJECT, etc.) |
| `name`                    | `String`                    | Display name                                  |
| `description`             | `String?`                   | Description                                   |
| `isActive`                | `Boolean` (default: `true`) | Active flag                                   |
| `createdAt` / `updatedAt` | `DateTime`                  | Timestamps                                    |

### 8.2.3 Fresh Application Models

#### `FreshLicenseApplicationPersonalDetails`

| Column                       | Type               | Required | Default       | Description                         |
| ---------------------------- | ------------------ | -------- | ------------- | ----------------------------------- |
| `id`                         | `Int` (PK)         | ✓        | autoincrement | Application ID                      |
| `acknowledgementNo`          | `String?` (unique) | —        | —             | Application reference number        |
| `firstName`                  | `String`           | ✓        | —             | Applicant first name                |
| `middleName`                 | `String?`          | —        | —             | Middle name                         |
| `lastName`                   | `String`           | ✓        | —             | Last name                           |
| `parentOrSpouseName`         | `String`           | ✓        | —             | Parent/spouse name                  |
| `sex`                        | `Sex` (enum)       | ✓        | —             | MALE / FEMALE / OTHER               |
| `placeOfBirth`               | `String?`          | —        | —             | Birth place                         |
| `dateOfBirth`                | `DateTime?`        | —        | —             | Date of birth                       |
| `dobInWords`                 | `String?`          | —        | —             | DOB written out                     |
| `panNumber`                  | `String?`          | —        | —             | PAN number                          |
| `aadharNumber`               | `String?`          | —        | —             | 12-digit Aadhar                     |
| `almsLicenseId`              | `String?`          | —        | —             | ALMS license ID                     |
| `filledBy`                   | `String?`          | —        | —             | Who filled form                     |
| `occupationAndBusinessId`    | `Int?` (FK)        | —        | —             | FK → FLAFOccupationAndBusiness      |
| `presentAddressId`           | `Int?` (FK)        | —        | —             | FK → FLAFAddressesAndContactDetails |
| `permanentAddressId`         | `Int?` (FK)        | —        | —             | FK → FLAFAddressesAndContactDetails |
| `currentUserId`              | `Int?` (FK)        | —        | —             | FK → Users (current owner)          |
| `previousUserId`             | `Int?` (FK)        | —        | —             | FK → Users (previous owner)         |
| `workflowStatusId`           | `Int?` (FK)        | —        | —             | FK → Statuses                       |
| `isApproved`                 | `Boolean?`         | —        | `false`       | Approved flag                       |
| `isRejected`                 | `Boolean?`         | —        | `false`       | Rejected flag                       |
| `isPending`                  | `Boolean?`         | —        | `false`       | Pending flag                        |
| `isRecommended`              | `Boolean?`         | —        | `false`       | Recommended flag                    |
| `isNotRecommended`           | `Boolean?`         | —        | `false`       | Not recommended flag                |
| `isReEnquiry`                | `Boolean?`         | —        | `false`       | Re-enquiry flag                     |
| `isReEnquiryDone`            | `Boolean?`         | —        | `false`       | Re-enquiry completed                |
| `isGroundReportGenerated`    | `Boolean?`         | —        | `false`       | Ground report flag                  |
| `isFLAFGenerated`            | `Boolean?`         | —        | `false`       | FLAF generated flag                 |
| `isDeclarationAccepted`      | `Boolean?`         | —        | `false`       | Declarations accepted               |
| `isAwareOfLegalConsequences` | `Boolean?`         | —        | `false`       | Legal awareness                     |
| `isTermsAccepted`            | `Boolean?`         | —        | `false`       | Terms accepted                      |
| `isSubmit`                   | `Boolean?`         | —        | `false`       | Submitted flag                      |
| `createdAt` / `updatedAt`    | `DateTime`         | ✓        | Timestamps    | —                                   |

#### `FLAFAddressesAndContactDetails`

| Column               | Type       | Description            |
| -------------------- | ---------- | ---------------------- |
| `id`                 | `Int` (PK) | Auto-increment         |
| `addressLine`        | `String`   | Full address           |
| `stateId`            | `Int` (FK) | FK → States.id         |
| `districtId`         | `Int` (FK) | FK → Districts.id      |
| `policeStationId`    | `Int` (FK) | FK → PoliceStations.id |
| `zoneId`             | `Int` (FK) | FK → Zones.id          |
| `divisionId`         | `Int` (FK) | FK → Divisions.id      |
| `sinceResiding`      | `DateTime` | Date since residing    |
| `telephoneOffice`    | `String?`  | Office phone           |
| `telephoneResidence` | `String?`  | Residence phone        |
| `officeMobileNumber` | `String?`  | Office mobile          |
| `alternativeMobile`  | `String?`  | Alt mobile             |

#### `FLAFOccupationAndBusiness`

| Column                 | Type       | Description             |
| ---------------------- | ---------- | ----------------------- |
| `id`                   | `Int` (PK) | Auto-increment          |
| `occupation`           | `String`   | Occupation name         |
| `officeAddress`        | `String`   | Office address          |
| `stateId`              | `Int` (FK) | FK → States.id          |
| `districtId`           | `Int` (FK) | FK → Districts.id       |
| `cropLocation`         | `String?`  | Crop location (farmers) |
| `areaUnderCultivation` | `Float?`   | Area in acres           |

#### `FLAFCriminalHistories`

| Column              | Type                         | Description                                 |
| ------------------- | ---------------------------- | ------------------------------------------- |
| `id`                | `Int` (PK)                   | Auto-increment                              |
| `applicationId`     | `Int` (FK)                   | FK → FreshLicenseApplicationPersonalDetails |
| `isConvicted`       | `Boolean` (default: `false`) | Convicted flag                              |
| `isBondExecuted`    | `Boolean` (default: `false`) | Bond executed                               |
| `bondDate`          | `DateTime?`                  | Bond date                                   |
| `bondPeriod`        | `String?`                    | Bond period                                 |
| `isProhibited`      | `Boolean` (default: `false`) | Prohibited flag                             |
| `prohibitionDate`   | `DateTime?`                  | Prohibition date                            |
| `prohibitionPeriod` | `String?`                    | Prohibition period                          |
| `firDetails`        | `Json?`                      | FIR details as JSON array                   |

#### `FLAFLicenseHistories`

| Column                    | Type             | Description               |
| ------------------------- | ---------------- | ------------------------- |
| `id`                      | `Int` (PK)       | Auto-increment            |
| `applicationId`           | `Int` (FK)       | FK → application          |
| `hasAppliedBefore`        | `Boolean`        | Previously applied        |
| `dateAppliedFor`          | `DateTime?`      | Previous application date |
| `previousAuthorityName`   | `String?`        | Previous authority        |
| `previousResult`          | `LicenseResult?` | APPROVED/REJECTED/PENDING |
| `hasLicenceSuspended`     | `Boolean`        | Suspension flag           |
| `suspensionAuthorityName` | `String?`        | Suspension authority      |
| `suspensionReason`        | `String?`        | Suspension reason         |
| `hasFamilyLicence`        | `Boolean`        | Family license flag       |
| `familyMemberName`        | `String?`        | Family member name        |
| `familyLicenceNumber`     | `String?`        | Family license number     |
| `familyWeaponsEndorsed`   | `String[]`       | Array of weapons          |
| `hasSafePlace`            | `Boolean`        | Safe place flag           |
| `safePlaceDetails`        | `String?`        | Safe place details        |
| `hasTraining`             | `Boolean`        | Training flag             |
| `trainingDetails`         | `String?`        | Training details          |

#### `FLAFLicenseDetails`

| Column                       | Type                 | Description                                |
| ---------------------------- | -------------------- | ------------------------------------------ |
| `id`                         | `Int` (PK)           | Auto-increment                             |
| `applicationId`              | `Int` (FK)           | FK → application                           |
| `needForLicense`             | `LicensePurpose?`    | SELF_PROTECTION / SPORTS / HEIRLOOM_POLICY |
| `armsCategory`               | `ArmsCategory?`      | RESTRICTED / PERMISSIBLE                   |
| `areaOfValidity`             | `String?`            | Validity area                              |
| `ammunitionDescription`      | `String?`            | Ammunition details                         |
| `specialConsiderationReason` | `String?`            | Special reason                             |
| `licencePlaceArea`           | `String?`            | License place area                         |
| `wildBeastsSpecification`    | `String?`            | Wild beasts                                |
| Many-to-Many                 | `WeaponTypeMaster[]` | `requestedWeapons`                         |

#### `FLAFBiometricDatas`

| Column          | Type               | Description                                           |
| --------------- | ------------------ | ----------------------------------------------------- |
| `id`            | `Int` (PK)         | Auto-increment                                        |
| `applicationId` | `Int` (FK, unique) | FK → application                                      |
| `biometricData` | `Json`             | JSON object with signature, photo, iris, fingerprints |

#### `FLAFFileUploads`

| Column          | Type              | Description       |
| --------------- | ----------------- | ----------------- |
| `id`            | `Int` (PK)        | Auto-increment    |
| `applicationId` | `Int` (FK)        | FK → application  |
| `fileType`      | `FileType` (enum) | File category     |
| `fileUrl`       | `String`          | File URL/path     |
| `fileName`      | `String`          | Original filename |
| `fileSize`      | `Int`             | Size in bytes     |
| `uploadedAt`    | `DateTime`        | Upload timestamp  |

#### `FreshLicenseApplicationsFormWorkflowHistories`

| Column           | Type        | Description           |
| ---------------- | ----------- | --------------------- |
| `id`             | `Int` (PK)  | Auto-increment        |
| `applicationId`  | `Int` (FK)  | FK → application      |
| `previousUserId` | `Int` (FK)  | FK → Users (sender)   |
| `nextUserId`     | `Int` (FK)  | FK → Users (receiver) |
| `actionTaken`    | `String`    | Action performed      |
| `remarks`        | `String?`   | Remarks/comments      |
| `previousRoleId` | `Int?` (FK) | FK → Roles            |
| `nextRoleId`     | `Int?` (FK) | FK → Roles            |
| `actionesId`     | `Int?` (FK) | FK → Actiones         |
| `attachments`    | `Json?`     | Attachments JSON      |
| `createdAt`      | `DateTime`  | Timestamp             |

### 8.2.4 Renewal Models

The renewal models mirror the fresh license models closely, but are in separate tables:

| Renewal Table                              | Fresh Counterpart                               |
| ------------------------------------------ | ----------------------------------------------- |
| `RenewalFormPersonalDetails`               | `FreshLicenseApplicationPersonalDetails`        |
| `RenewalAddressesAndContactDetails`        | `FLAFAddressesAndContactDetails`                |
| `RenewalOccupationAndBusiness`             | `FLAFOccupationAndBusiness`                     |
| `RenewalLicenseDetails`                    | `FLAFLicenseDetails`                            |
| `RenewalFileUploads`                       | `FLAFFileUploads`                               |
| `RenewalBiometricDatas`                    | `FLAFBiometricDatas`                            |
| `RenewalApplicationsFormWorkflowHistories` | `FreshLicenseApplicationsFormWorkflowHistories` |

### 8.2.5 Location Hierarchy

```mermaid
flowchart TB
    States -->|has many| Districts
    Districts -->|has many| Zones
    Zones -->|has many| Divisions
    Divisions -->|has many| PoliceStations
```

Each location table has: `id` (PK), `name` (unique), parent FK, `createdAt`, `updatedAt`.

### 8.2.6 Other Master Tables

#### `WeaponTypeMaster`

| Column        | Type              | Description    |
| ------------- | ----------------- | -------------- |
| `id`          | `Int` (PK)        | Auto-increment |
| `name`        | `String` (unique) | Weapon name    |
| `description` | `String?`         | Description    |
| `imageUrl`    | `String?`         | Image URL      |

#### `LicensesMergeAuditLog`

| Column             | Type                          | Description                                 |
| ------------------ | ----------------------------- | ------------------------------------------- |
| `id`               | `Int` (PK)                    | Auto-increment                              |
| `mergeId`          | `String` (unique)             | Merge identifier                            |
| `freshLicenseId`   | `Int` (FK)                    | FK → FreshLicenseApplicationPersonalDetails |
| `renewalLicenseId` | `Int` (FK)                    | FK → RenewalFormPersonalDetails             |
| `mergedFields`     | `String?`                     | Comma-separated field names                 |
| `mergedBy`         | `Int?` (FK)                   | FK → Users                                  |
| `mergedAt`         | `DateTime`                    | Merge timestamp                             |
| `status`           | `String` (default: COMPLETED) | Merge status                                |
| `remarks`          | `String?`                     | Remarks                                     |

### 8.2.7 Enum Reference

```mermaid
mindmap
  root((ALMS Enums))
    Sex
      MALE
      FEMALE
      OTHER
    ArmsCategory
      RESTRICTED
      PERMISSIBLE
    AreaOfUse
      DISTRICT
      STATE
      INDIA
    LicensePurpose
      SELF_PROTECTION
      SPORTS
      HEIRLOOM_POLICY
    LicenseResult
      APPROVED
      REJECTED
      PENDING
    FileType
      AADHAR_CARD
      PAN_CARD
      TRAINING_CERTIFICATE
      OTHER_STATE_LICENSE
      EXISTING_LICENSE
      SAFE_CUSTODY
      MEDICAL_REPORT
      REJECTED_LICENSE
      CLAIM_DOCS
      SIGNATURE_THUMB
      PHOTOGRAPH
      IRIS_SCAN
      OTHER
```

---

# 9. Authentication & Authorization

## 9.1 Complete Login Sequence

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Middleware as Next.js Middleware
    participant Backend
    participant DB

    User->>Frontend: Enter username & password
    Frontend->>Frontend: Validate form fields
    Frontend->>Backend: POST /api/auth/login
    Backend->>DB: Find user by username
    DB-->>Backend: User with role + password hash
    Backend->>Backend: bcrypt.compare(password, hash)

    alt Invalid credentials
        Backend-->>Frontend: 401 { message: "Invalid username or password" }
        Frontend-->>User: Show error
    else Role inactive
        Backend-->>Frontend: 401 { message: "Login failed - role inactive" }
        Frontend-->>User: Show "Role deactivated" error
    else Success
        Backend->>Backend: Generate JWT (24h expiry)
        Backend->>Backend: Set role cookie (HttpOnly)
        Backend-->>Frontend: 200 { token, user, success: true }
        Frontend->>Frontend: Store auth cookie (JSON with token)
        Frontend->>Frontend: Store role cookie
        Frontend->>Frontend: Dispatch authSlice.setCredentials()
        Frontend->>Frontend: Redirect to role-based dashboard
        User->>User: Access granted
    end
```

## 9.2 JWT Token Structure

```json
{
  "sub": "1",
  "username": "dcp_officer",
  "email": "dcp@example.com",
  "user_id": 1,
  "role_code": "DCP",
  "role_id": 5,
  "role": "DCP",
  "state_id": 1,
  "district_id": 1,
  "zone_id": null,
  "name": "DCP Officer",
  "iat": 1715754373,
  "exp": 1715840773
}
```

## 9.3 Auth Guard Comparison

| Feature              | `JwtAuthGuard`                              | `AuthGuard`                                    |
| -------------------- | ------------------------------------------- | ---------------------------------------------- |
| **Usage**            | Admin/analytics endpoints                   | Application/CRUD endpoints                     |
| **DB Lookup**        | No (JWT only)                               | Yes (fetch user from DB)                       |
| **Role Check**       | No                                          | Yes (`@Roles` decorator)                       |
| **Permission Check** | No                                          | Yes (via decorators)                           |
| **User Attached**    | `req.user` with decoded JWT + mapped fields | `req.user` with decoded JWT + full user object |
| **Error Messages**   | Generic                                     | Detailed (role inactive, user not found, etc.) |
| **Performance**      | Fast                                        | Medium (DB query on each request)              |

## 9.4 Role-Based Access Control Flow

```mermaid
flowchart TD
    REQ[Protected Request] --> GUARD[AuthGuard.canActivate]
    GUARD --> JWT_CHECK{Token valid?}
    JWT_CHECK -->|No| 401[401 Unauthorized]
    JWT_CHECK -->|Yes| DB_FETCH[Fetch user from DB<br/>with role relation]
    DB_FETCH --> USER_EXISTS{User exists?}
    USER_EXISTS -->|No| 401
    USER_EXISTS -->|Yes| ROLE_DECORATOR{Has @Roles decorator?}
    ROLE_DECORATOR -->|No| ALLOW[Allow access]
    ROLE_DECORATOR -->|Yes| CHECK_ROLES{User role in<br/>allowed list?}
    CHECK_ROLES -->|No| 403[403 Forbidden]
    CHECK_ROLES -->|Yes| ALLOW
    ALLOW --> ATTACH[Attach user to request]
    ATTACH --> HANDLER[Execute handler]
```

---

# 10. Workflow Engine

## 10.1 Complete Action Processing

```mermaid
flowchart TD
    INPUT[Workflow Action Request] --> USER[Extract user from JWT]
    USER --> ROLE[Get user roleId]
    ROLE --> VALIDATE[Validate actionId against Actiones table]
    VALIDATE --> PERM_CHECK[Check RolesActionsMapping:<br/>roleId + actionId]

    PERM_CHECK --> PERM{Has Permission?}
    PERM -->|No| FORBIDDEN[403 Forbidden]
    PERM -->|Yes| ACTION_TYPE{Action Type}

    ACTION_TYPE -->|TERMINAL| TERMINAL_PROC[Process terminal<br/>APPROVED / REJECT / CLOSE / DISPOSE / CANCEL]
    ACTION_TYPE -->|FORWARD| FORWARD_PROC[Process forward<br/>Requires nextUserId]
    ACTION_TYPE -->|IN_PLACE| IN_PLACE_PROC[Process in-place<br/>RECOMMEND / RE_ENQUIRY / etc.]

    TERMINAL_PROC --> STATUS_FLAGS
    FORWARD_PROC --> STATUS_FLAGS
    IN_PLACE_PROC --> STATUS_FLAGS

    STATUS_FLAGS[Set boolean flags:<br/>isApproved / isRejected / isRecommended etc.]
    STATUS_FLAGS --> UPDATE_STATUS[Update workflowStatusId]
    UPDATE_STATUS --> PRESERVE{Preserve terminal?}

    PRESERVE -->|Already approved/rejected| KEEP_TERMINAL[Keep terminal status]
    PRESERVE -->|Not terminal| SET_NEW[Set new status]

    KEEP_TERMINAL --> UPDATE_APP[Update application record]
    SET_NEW --> UPDATE_APP

    UPDATE_APP --> HISTORY[Create workflow history entry]
    HISTORY --> HISTORY_DATA[Store: previousUser, nextUser,<br/>actionTaken, remarks, roleIds,<br/>actionesId, attachments]

    HISTORY_DATA --> RESPONSE[Return success response]
```

## 10.2 Workflow History Tracking

```mermaid
sequenceDiagram
    participant User as Current User
    participant Service as WorkflowService
    participant DB as Database

    User->>Service: Process workflow action
    Service->>DB: Validate role-action permission
    Service->>DB: Fetch application (fresh or renewal)
    Service->>DB: Find matching status
    Service->>DB: Update application flags & status
    Service->>DB: Create workflow history record
    Service->>DB: Record:
    Note over DB: applicationId, previousUserId, nextUserId,<br/>actionTaken, remarks, previousRoleId,<br/>nextRoleId, actionesId, attachments
    Service->>User: Return updated application
```

## 10.3 Terminal Status Preservation Logic

When an application has been marked with a terminal action (APPROVED/REJECT/RECOMMEND/NOT_RECOMMEND), subsequent actions preserve that terminal status:

```typescript
// WorkflowService - Fresh Application Processing
if (application.isApproved) {
  newStatusId = status.code === "APPROVED" ? status.id : approvedStatus.id;
} else if (application.isRejected) {
  newStatusId = status.code === "REJECT" ? status.id : rejectedStatus.id;
} else if (application.isRecommended) {
  newStatusId = status.code === "RECOMMEND" ? status.id : recommendedStatus.id;
}
```

This ensures the audit trail accurately reflects the final disposition of each application.

## 10.4 Circular Dependency Detection

The `FlowMappingService` implements circular dependency detection when creating/updating role flow mappings:

```mermaid
flowchart TD
    CREATE[Create/Update Flow Mapping] --> CHECK[Check for circular path]
    CHECK --> BUILD[Build adjacency list from all mappings]
    BUILD --> DFS[DFS from target role]
    DFS --> FOUND{Can reach current role?}
    FOUND -->|Yes| REJECT[Reject: Circular dependency detected]
    FOUND -->|No| ACCEPT[Accept: Valid mapping]
    REJECT --> ERROR[Return error with circular path details]
    ACCEPT --> SAVE[Save flow mapping]
```

---

# 11. Developer Guide

## 11.1 Prerequisites

| Requirement | Version   | Purpose            |
| ----------- | --------- | ------------------ |
| Node.js     | 18+ (LTS) | Runtime            |
| PostgreSQL  | 14+       | Database           |
| npm / yarn  | Latest    | Package management |
| Docker      | 20+       | Containerization   |
| Git         | Latest    | Version control    |

## 11.2 Quick Start

```bash
# 1. Clone the repository
git clone <repository-url>
cd alms

# 2. Backend setup
cd backend
cp .env.example .env    # Edit with your database credentials
npm install
npx prisma generate
npx prisma migrate dev  # Run migrations
npx prisma db seed      # Seed with initial data
npm run start:dev       # Start backend on :3000

# 3. Frontend setup (new terminal)
cd frontend
cp .env.example .env.local
npm install
npm run dev             # Start frontend on :3001
```

## 11.3 Environment Reference

### Backend (`backend/.env`)

```env
# ─── Server ───
PORT=3000
NODE_ENV=development

# ─── Database ───
DATABASE_URL="postgresql://postgres:password@localhost:5432/alms?schema=public"

# ─── JWT ───
JWT_SECRET=your-256-bit-secret-key-change-in-production

# ─── CORS Origins (comma-separated) ───
CORS_ORIGIN=http://localhost:3000,http://localhost:3001

# ─── File Upload ───
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
```

### Frontend (`frontend/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXT_PUBLIC_APP_NAME=ALMS
NEXT_PUBLIC_APP_URL=http://localhost:3001
```

## 11.4 Available Scripts

### Backend

| Script                      | Description                               |
| --------------------------- | ----------------------------------------- |
| `npm run start:dev`         | Start with hot-reload (NestJS watch mode) |
| `npm run build`             | Compile to `/dist`                        |
| `npm run start:prod`        | Start production server                   |
| `npm run lint`              | Run ESLint                                |
| `npm run test`              | Run Jest tests                            |
| `npx prisma studio`         | Open Prisma Studio GUI                    |
| `npx prisma generate`       | Regenerate Prisma client                  |
| `npx prisma migrate dev`    | Create/apply migrations                   |
| `npx prisma migrate deploy` | Apply migrations (production)             |
| `npx prisma db seed`        | Run seed script                           |

### Frontend

| Script          | Description              |
| --------------- | ------------------------ |
| `npm run dev`   | Start Next.js dev server |
| `npm run build` | Build for production     |
| `npm start`     | Start production server  |
| `npm run lint`  | Run ESLint               |
| `npm run test`  | Run Jest tests           |

## 11.5 Docker Commands

```bash
# Start all services (dev)
docker-compose up --build

# Start specific services
docker-compose up -d db        # Database only
docker-compose up backend      # Backend only

# Production deployment
docker-compose -f docker-compose.prod.yml up --build

# Unified deployment (backend + frontend in one container)
docker-compose -f docker-compose.unified.yml up --build

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend
```

## 11.6 Migration Workflow

```bash
# Development: Create new migration
npx prisma migrate dev --name add_new_field

# Development: Reset database (loses data)
npx prisma migrate reset

# Production: Apply pending migrations
npx prisma migrate deploy

# Production: Check migration status
npx prisma migrate status
```

---

# 12. End-to-End Flows

## 12.1 Complete Fresh Application Journey

```mermaid
sequenceDiagram
    actor Citizen as Citizen
    participant Frontend
    participant Backend
    participant DB

    Note over Citizen: === FORM FILLING PHASE ===

    Citizen->>Frontend: Navigate to fresh application
    Frontend->>Frontend: Initialize multi-step form
    Citizen->>Frontend: Step 1: Fill personal info (name, Aadhar, PAN, DOB)
    Frontend->>Backend: POST /api/application-form/personal-details
    Backend->>DB: Create FreshLicenseApplicationPersonalDetails (DRAFT)
    Backend-->>Frontend: { applicationId: 123 }
    Frontend->>Citizen: Step 2: Address Details
    Frontend->>Backend: PATCH /api/application-form?applicationId=123
    Backend->>DB: Create/update FLAFAddressesAndContactDetails
    Frontend->>Citizen: Step 3-8: Fill remaining sections
    Frontend->>Backend: PATCH calls for each section

    Note over Citizen: === SUBMISSION PHASE ===

    Citizen->>Frontend: Step 9: Preview all data
    Citizen->>Frontend: Step 10: Accept declaration & submit
    Frontend->>Backend: PATCH /api/application-form?applicationId=123&isSubmit=true
    Note over Backend: Validate declarations accepted
    Note over Backend: Find INITIATE status (isStarted=true)
    Backend->>DB: Update workflowStatusId = INITIATE id
    Backend->>DB: Set isSubmit=true, isPending=true
    Backend->>DB: Create workflow history entry
    Backend-->>Frontend: Application submitted successfully
    Frontend->>Citizen: Show success with application number

    Note over Citizen: === PROCESSING PHASE ===

    Citizen->>Frontend: Track application status
    Frontend->>Backend: GET /api/application-form?applicationId=123
    Backend->>DB: Fetch application with workflowStatus
    Backend-->>Frontend: { status: "UNDER_REVIEW" }
    Frontend->>Citizen: Application under review

    Citizen->>Frontend: Check status again later
    Frontend->>Backend: GET /api/application-form?applicationId=123
    Backend-->>Frontend: { status: "APPROVED" }
    Frontend->>Citizen: License approved!
```

## 12.2 Complete Renewal Journey

```mermaid
sequenceDiagram
    actor Citizen
    participant Frontend
    participant Backend
    participant DB

    Note over Citizen: === INITIATION ===
    Citizen->>Frontend: Navigate to renewal form
    Citizen->>Frontend: Enter existing license number
    Frontend->>Backend: POST /api/renewal-forms { licenseNumber }
    Backend->>DB: Check if renewal already exists for this license
    DB-->>Backend: No existing renewal
    Backend->>DB: Get DRAFT status
    Backend->>DB: Create RenewalFormPersonalDetails
    Backend-->>Frontend: { id: 5, acknowledgementNo: "RENEWAL-..." }

    Note over Citizen: === DATA COPY ===
    Citizen->>Frontend: Request to copy from fresh license
    Frontend->>Backend: Copy from fresh license (internal service)
    Backend->>DB: Fetch fresh license with addresses, occupation
    Backend->>DB: Create renewal addresses (copied)
    Backend->>DB: Create renewal occupation (copied)
    Backend->>DB: Update renewal with copied data
    Backend-->>Frontend: Renewal pre-filled with existing data

    Note over Citizen: === UPDATE ===
    Citizen->>Frontend: Update address, occupation as needed
    Frontend->>Backend: PATCH /api/renewal-forms?applicationId=5
    Backend->>DB: Update sections
    Citizen->>Frontend: Upload documents
    Frontend->>Backend: POST /api/renewal-forms/5/upload-file

    Note over Citizen: === SUBMIT ===
    Citizen->>Frontend: Accept declaration & submit
    Frontend->>Backend: PATCH /api/renewal-forms?applicationId=5&isSubmit=true
    Backend->>DB: Set workflowStatusId = INITIATE
    Backend->>DB: Create workflow history
    Backend-->>Frontend: Renewal submitted

    Note over Citizen: === WORKFLOW ===
    Note over Backend: Application goes through police hierarchy

    Note over Citizen: === MERGE (After Approval) ===
    Citizen->>Frontend: Check status - APPROVED
    Admin->>Frontend: Navigate to merge page
    Frontend->>Backend: POST /api/renewal-forms/approved/merge
    Note over Backend: Verify JTCP/CP role
    Note over Backend: Validate acknowledgementNo === licenseNumber
    Backend->>DB: Fetch fresh & renewal licenses
    Backend->>DB: Merge fields (personal, address, occupation, license)
    Backend->>DB: Create LicensesMergeAuditLog
    Backend-->>Frontend: { mergeId, mergedFields }
    Frontend->>Admin: Merge successful
```

## 12.3 Complete Officer Processing Journey

```mermaid
sequenceDiagram
    actor Officer
    participant Frontend
    participant Backend
    participant DB

    Note over Officer: === LOGIN ===
    Officer->>Frontend: Enter credentials
    Frontend->>Backend: POST /api/auth/login
    Backend-->>Frontend: { token, role: "DCP" }
    Frontend->>Frontend: Redirect to DCP dashboard

    Note over Officer: === INBOX ===
    Officer->>Frontend: View inbox
    Frontend->>Backend: GET /api/application-form?statusIds=1,2,3&isOwned=true
    Backend->>DB: Query applications where currentUserId = officer
    DB-->>Backend: Application list
    Backend-->>Frontend: { data: [apps], pagination }
    Frontend->>Officer: Display application table with status badges

    Note over Officer: === REVIEW ===
    Officer->>Frontend: Click application #123
    Frontend->>Backend: GET /api/application-form?applicationId=123
    Backend->>DB: Fetch full application with all relations
    DB-->>Backend: Complete application data
    Backend-->>Frontend: Full application detail
    Frontend->>Officer: Display: personal info, addresses, documents, history

    Note over Officer: === DECISION ===
    Officer->>Frontend: Click "Process" button
    Frontend->>Backend: GET /api/application-form/users-in-hierarchy/123
    Backend->>DB: Find next users via RoleFlowMapping
    DB-->>Backend: Eligible next users
    Backend-->>Frontend: { data: [nextUsers] }
    Frontend->>Officer: Show ProcessModal with actions & user list

    Officer->>Frontend: Select: Forward to ZS
    Officer->>Frontend: Add remarks: "Verified documents. Recommended."
    Frontend->>Backend: POST /api/workflow/action
    Note over Backend: Validate DCP can perform FORWARD
    Backend->>DB: Check RolesActionsMapping
    Backend->>DB: Update application: currentUserId = ZS_ID
    Backend->>DB: Set isRecommended = true
    Backend->>DB: Create workflow history
    Backend-->>Frontend: { success, message: "forward performed successfully" }
    Frontend->>Officer: Action successful! Redirect to inbox

    Note over Officer: === CONTINUE ===
    Officer->>Frontend: Back to inbox, next application...
```

---

## Appendix A: API Status Codes Reference

| Status Code | Description                               |
| ----------- | ----------------------------------------- |
| `200`       | Success                                   |
| `201`       | Created                                   |
| `204`       | No Content (delete success)               |
| `400`       | Bad Request — Invalid input               |
| `401`       | Unauthorized — Missing/invalid token      |
| `403`       | Forbidden — Insufficient role/permissions |
| `404`       | Not Found — Resource doesn't exist        |
| `409`       | Conflict — Duplicate entry                |
| `500`       | Internal Server Error                     |

## Appendix B: File Type Enum Values

| Value                  | Description                  |
| ---------------------- | ---------------------------- |
| `AADHAR_CARD`          | Aadhar card (identity proof) |
| `PAN_CARD`             | PAN card (tax identity)      |
| `TRAINING_CERTIFICATE` | Arms training certificate    |
| `OTHER_STATE_LICENSE`  | License from another state   |
| `EXISTING_LICENSE`     | Current/previous license     |
| `SAFE_CUSTODY`         | Safe custody document        |
| `MEDICAL_REPORT`       | Medical fitness report       |
| `REJECTED_LICENSE`     | Previously rejected license  |
| `CLAIM_DOCS`           | Claim/ownership documents    |
| `SIGNATURE_THUMB`      | Signature or thumbprint      |
| `PHOTOGRAPH`           | Passport-size photo          |
| `IRIS_SCAN`            | Iris biometric scan          |
| `OTHER`                | Other supporting documents   |

## Appendix C: Status Code Constants

```typescript
export const STATUS_CODES = {
  DRAFT: "DRAFT",
  INITIATE: "INITIATE",
  FORWARD: "FORWARD",
  UNDER_REVIEW: "UNDER_REVIEW",
  RE_ENQUIRY: "RE_ENQUIRY",
  GROUND_REPORT: "GROUND_REPORT",
  APPROVED: "APPROVED",
  REJECT: "REJECT",
  CLOSE: "CLOSE",
  DISPOSE: "DISPOSE",
  CANCEL: "CANCEL",
};
```

## Appendix D: Action Code Constants

```typescript
export const ACTION_CODES = {
  INITIATE: "INITIATE",
  FORWARD: "FORWARD",
  RE_ENQUIRY: "RE_ENQUIRY",
  GROUND_REPORT: "GROUND_REPORT",
  RECOMMEND: "RECOMMEND",
  NOT_RECOMMEND: "NOT_RECOMMEND",
  APPROVED: "APPROVED",
  REJECT: "REJECT",
  CLOSE: "CLOSE",
  DISPOSE: "DISPOSE",
  CANCEL: "CANCEL",
  RED_FLAG: "RED_FLAG",
};
```

## Appendix E: Action Categories

| Category     | Actions                                                            | Description               |
| ------------ | ------------------------------------------------------------------ | ------------------------- |
| **Terminal** | `REJECT`, `APPROVED`, `CLOSE`, `DISPOSE`, `CANCEL`                 | Ends the workflow         |
| **Forward**  | `FORWARD`                                                          | Transfers to another user |
| **In-Place** | `RE_ENQUIRY`, `GROUND_REPORT`, `RECOMMEND`, `INITIATE`, `RED_FLAG` | Stays with current user   |

---

> **Document Version**: 2.0 (Enhanced)  
> **Generated**: June 2026  
> **Project**: ALMS — Arms License Management System
