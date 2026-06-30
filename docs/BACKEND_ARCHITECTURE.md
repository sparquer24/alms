# ALMS Backend Architecture & API Documentation

> **Arms License Management System** — Complete Backend Reference

---

## Table of Contents

1. [System Architecture Overview](#1-system-architecture-overview)
2. [Module Architecture](#2-module-architecture)
3. [Request Processing Pipeline](#3-request-processing-pipeline)
4. [Authentication & Authorization](#4-authentication--authorization)
5. [Complete API Reference](#5-complete-api-reference)
6. [Workflow Engine](#6-workflow-engine)
7. [Core Business Logic](#7-core-business-logic)
8. [Developer Guide](#8-developer-guide)
9. [Appendix: Constants & Enums](#9-appendix-constants--enums)

---

## 1. System Architecture Overview

### 1.1 High-Level Architecture

```mermaid
graph TB
    subgraph "Frontend (Next.js)"
        UI[Browser / PWA]
        MW[Edge Middleware<br/>Auth + Redirect]
    end

    subgraph "Backend (NestJS)"
        API[API Gateway<br/>/api/*]
        MID[Global Middleware<br/>AuthGuard + JwtAuthGuard]
        MOD[Module Layer<br/>16 NestJS Modules]
        SVC[Service Layer<br/>18 Services]
        DTO[DTO Validation<br/>class-validator]
        DB_ACCESS[(Prisma ORM)]
    end

    subgraph "External"
        FE[Frontend App<br/>port 3000]
        SWAGGER[Swagger Docs<br/>/api/api-docs]
        BIO[Biometric Device<br/>Fingerprint Scanner]
    end

    UI --> MW
    MW --> FE
    FE -->|HTTP/JSON| API
    API --> MID
    MID --> MOD
    MOD --> SVC
    SVC --> DTO
    DTO --> DB_ACCESS
    BIO <-->|USB/Serial| MOD
    
    API --> SWAGGER

    style API fill:#4CAF50,color:#fff
    style MID fill:#FF9800,color:#fff
    style DB_ACCESS fill:#2196F3,color:#fff
```

### 1.2 Technology Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Runtime** | Node.js | 18+ | Server-side JavaScript runtime |
| **Framework** | NestJS | 10.x | Progressive Node.js framework |
| **Language** | TypeScript | 5.x | Type-safe development |
| **ORM** | Prisma | 5.x | Database ORM with type safety |
| **Database** | PostgreSQL | 14+ | Primary database |
| **Auth** | JWT (jsonwebtoken) | 9.x | Token-based authentication |
| **Password** | bcrypt | 5.x | Password hashing |
| **Validation** | class-validator | 0.14.x | DTO validation |
| **Swagger** | @nestjs/swagger | 7.x | API documentation |
| **Encryption** | Node.js crypto | Built-in | AES-256-GCM biometric data |
| **QR Code** | qrcode | 1.5.x | QR code generation |
| **Container** | Docker | Latest | Containerization |

### 1.3 Project Structure

```
backend/
├── src/
│   ├── main.ts                          # Entry point, bootstrap, Swagger setup
│   ├── constants/
│   │   ├── auth.ts                      # Auth error messages & role codes
│   │   └── workflow-actions.ts           # Workflow status/action/role constants
│   ├── db/
│   │   └── prismaClient.ts              # Standalone Prisma client instance
│   ├── decorators/
│   │   ├── permissions.decorator.ts      # @RequirePermissions() decorator
│   │   └── roles.decorator.ts            # @Roles() decorator
│   ├── dto/
│   │   └── common.dto.ts                # Shared DTOs (Location, User, Workflow, API Response)
│   ├── filters/
│   │   └── all-exceptions.filter.ts      # Global exception filter
│   ├── interceptors/
│   │   ├── errors.interceptor.ts         # Error & timeout interceptor
│   │   └── logging.interceptor.ts        # HTTP request/response logging
│   ├── middleware/
│   │   ├── auth.middleware.ts            # AuthGuard (JWT + role/permission check)
│   │   └── jwt-auth.guard.ts             # JwtAuthGuard (simple JWT validation)
│   ├── modules/
│   │   ├── app.module.ts                 # Root module importing all feature modules
│   │   ├── actions/                      # Role-action mappings
│   │   ├── analytics/                    # Admin analytics & reports
│   │   ├── auth/                         # Authentication & login
│   │   ├── biometric/                    # Fingerprint enrollment & verification
│   │   ├── FLAWorkflow/                  # Workflow engine (action processing)
│   │   ├── flowMapping/                  # Role-to-role flow configuration
│   │   ├── FreshLicenseApplicationForm/  # Fresh license applications
│   │   ├── health/                       # Health check endpoint
│   │   ├── locations/                    # Geographic hierarchy CRUD
│   │   ├── public/                       # Public read-only endpoints (QR)
│   │   ├── qrcode/                       # QR code generation
│   │   ├── renewal/                      # Renewal license applications
│   │   ├── roles/                        # Role management
│   │   ├── status/                       # Status definitions
│   │   ├── user/                         # User management
│   │   └── weapons/                      # Weapon type master
│   ├── request/
│   │   ├── auth.ts                       # LoginRequest DTO
│   │   └── renewal-form.ts               # Renewal form request/response interfaces
│   ├── response/
│   │   └── auth.ts                       # LoginResponse, UserProfileResponse
│   └── services/
│       └── prisma.service.ts             # PrismaService (DI wrapper with lifecycle)
├── prisma/
│   └── schema.prisma                     # Complete database schema
├── Dockerfile / Dockerfile.prod
├── docker-compose.yml
└── package.json
```

---

## 2. Module Architecture

### 2.1 Module Dependency Graph

```mermaid
graph TB
    subgraph "Core Infrastructure"
        APP[AppModule]
        PRISMA[PrismaService]
        AUTH_MID[AuthGuard / JwtAuthGuard]
        FILTERS[AllExceptionsFilter]
        INTERCEPTORS[LoggingInterceptor<br/>ErrorsInterceptor]
    end

    subgraph "Feature Modules"
        AUTH[AuthModule]
        USER[UserModule]
        FLA[FreshLicenseAppModule]
        RENEWAL[RenewalFormModule]
        WORKFLOW[FLAWorkflowModule]
        LOC[LocationsModule]
        ROLES[RolesModule]
        ACTIONS[ActionesModule]
        STATUS[StatusModule]
        FLOW_MAP[FlowMappingModule]
        BIO[BiometricModule]
        ANALYTICS[AnalyticsModule]
        WEAPONS[WeaponsModule]
        QR[QRCodeModule]
        PUBLIC[PublicModule]
        HEALTH[HealthModule]
    end

    APP --> AUTH
    APP --> USER
    APP --> FLA
    APP --> RENEWAL
    APP --> WORKFLOW
    APP --> LOC
    APP --> ROLES
    APP --> ACTIONS
    APP --> STATUS
    APP --> FLOW_MAP
    APP --> BIO
    APP --> ANALYTICS
    APP --> WEAPONS
    APP --> QR
    APP --> PUBLIC
    APP --> HEALTH

    AUTH --> PRISMA
    USER --> PRISMA
    FLA --> PRISMA
    RENEWAL --> PRISMA
    WORKFLOW --> PRISMA
    BIO --> PRISMA

    FLA --> WORKFLOW
    RENEWAL --> WORKFLOW
    WORKFLOW --> ACTIONS
    WORKFLOW --> STATUS
    ANALYTICS --> FLA
    ANALYTICS --> RENEWAL
    QR --> PUBLIC

    style APP fill:#4CAF50,color:#fff
    style PRISMA fill:#2196F3,color:#fff
    style AUTH_MID fill:#FF9800,color:#fff
```

### 2.2 Module Registry

| # | Module | Path | Features |
|---|--------|------|----------|
| 1 | **AuthModule** | `modules/auth/` | Login, profile, token verification, logout |
| 2 | **UserModule** | `modules/user/` | CRUD users with role/location filtering |
| 3 | **ApplicationFormModule** | `modules/FreshLicenseApplicationForm/` | Fresh license lifecycle, file uploads, hierarchy |
| 4 | **RenewalFormModule** | `modules/renewal/` | Renewal lifecycle, license merging, audit |
| 5 | **FLAWorkflowModule** | `modules/FLAWorkflow/` | Action processing, status transitions |
| 6 | **LocationsModule** | `modules/locations/` | Geographic hierarchy CRUD |
| 7 | **RolesModule** | `modules/roles/` | Role CRUD, activation, public lookup |
| 8 | **ActionesModule** | `modules/actions/` | Role-action mapping management |
| 9 | **StatusModule** | `modules/status/` | Status definition management |
| 10 | **FlowMappingModule** | `modules/flowMapping/` | Role flow configuration, cycle detection |
| 11 | **AnalyticsModule** | `modules/analytics/` | Reports, dashboards, activity feed |
| 12 | **BiometricModule** | `modules/biometric/` | Fingerprint enrollment, verification, audit |
| 13 | **WeaponsModule** | `modules/weapons/` | Weapon type master list |
| 14 | **QRCodeModule** | `modules/qrcode/` | QR code generation for applications |
| 15 | **PublicModule** | `modules/public/` | Public read-only application view (QR scans) |
| 16 | **HealthModule** | `modules/health/` | Health check endpoint |

---

## 3. Request Processing Pipeline

### 3.1 Complete Request Flow

```mermaid
sequenceDiagram
    participant C as Client
    participant N as Nginx/Ingress
    participant B as Bootstrap (main.ts)
    participant G as Global Pipe<br/>(ValidationPipe)
    participant F as Global Filter<br/>(AllExceptionsFilter)
    participant I1 as LoggingInterceptor
    participant I2 as ErrorsInterceptor
    participant M as Middleware/Guard
    participant CO as Controller
    participant S as Service
    participant DB as Database (Prisma)

    C->>N: HTTP Request
    N->>B: Port 3000 (or 80/443 via reverse proxy)
    
    Note over B: Body size limit: 10MB<br/>CORS origins configured<br/>Global prefix: /api
    
    B->>G: Transform + Validate
    G->>G: whitelist: true<br/>transform: true<br/>implicitConversion: true
    
    B->>I1: LoggingInterceptor
    I1->>I1: Log: [timestamp] METHOD /api/route<br/>Query, Body (sanitized), Params
    
    B->>I2: ErrorsInterceptor
    I2->>I2: Timeout: 60s
    
    B->>F: AllExceptionsFilter
    Note over F: Catches ALL exceptions<br/>HTTP 4xx → warn log<br/>HTTP 5xx → error log
    
    alt Requires Auth
        I2->>M: JwtAuthGuard or AuthGuard
        M->>M: Verify JWT token<br/>Extract user payload<br/>Check roles + permissions
    end
    
    M->>CO: Route to Controller Method
    CO->>S: Delegate to Service
    S->>DB: Prisma Query
    
    DB-->>S: Result
    S-->>CO: Transformed Response
    CO-->>I2: Response Data
    I2-->>I1: 
    I1-->>I1: Log: [timestamp] METHOD /api/route STATUS DURATIONms
    I1-->>C: JSON Response
```

### 3.2 Global Configuration (main.ts)

```typescript
// Bootstrap Configuration
- Global Prefix: /api
- Validation Pipe: transform, whitelist, implicitConversion
- Global Filters: AllExceptionsFilter
- Global Interceptors: LoggingInterceptor, ErrorsInterceptor
- CORS: Configurable origins (default: localhost:3000/3001/5000/5001, alms.sparquer.com)
- Body Limit: 10MB
- Swagger: /api/api-docs with JWT bearer auth
- Port: 3000 (configurable via PORT env)
```

### 3.3 Guard Comparison

| Feature | JwtAuthGuard | AuthGuard |
|---------|-------------|-----------|
| **Decorator** | `@UseGuards(JwtAuthGuard)` | `@UseGuards(AuthGuard)` |
| **JWT Verify** | ✅ Yes | ✅ Yes |
| **DB User Lookup** | ❌ No | ✅ Yes (prisma.users.findUnique) |
| **Role Check** | ❌ No | ✅ Yes (via `@Roles()` decorator) |
| **Permission Check** | ❌ No | ✅ Yes (via `@RequirePermissions()` decorator) |
| **User on Request** | `request.user` with mapped fields | `request.user` with full role + location data |
| **Best For** | Simple auth verification | Routes needing role/permission checks |

---

## 4. Authentication & Authorization

### 4.1 Authentication Flow

```mermaid
sequenceDiagram
    participant U as User/Frontend
    participant C as AuthController
    participant S as AuthService
    participant DB as Database
    participant JWT as JWT Token

    U->>C: POST /api/auth/login<br/>{ username, password }
    C->>S: login(loginDto)
    
    S->>DB: Find user by username
    DB-->>S: User + Role (includes role.is_active)
    
    alt User Not Found
        S-->>U: 401 Invalid credentials
    else Role Inactive
        S-->>U: 401 Role inactive
    else Success
        S->>S: bcrypt.compare(password, user.password)
        alt Password Match
            S->>JWT: Generate token with payload
            Note over JWT: Payload: sub, user_id, username,<br/>role_id, role_code, state_id,<br/>district_id, zone_id, is_active
            JWT-->>S: JWT Token
            S-->>C: { success, token, user }
            C-->>U: 200 { token, user, role cookie }
        else Password Mismatch
            S-->>U: 401 Invalid credentials
        end
    end
```

### 4.2 JWT Token Structure

```json
{
  "sub": 1,
  "user_id": 1,
  "username": "dcp_user",
  "role_id": 5,
  "role_code": "DCP",
  "state_id": 1,
  "district_id": 2,
  "zone_id": 3,
  "is_active": true,
  "iat": 1692600000,
  "exp": 1692686400
}
```

### 4.3 JWT Guard Mapping (JwtAuthGuard)

| JWT Field | Mapped Field | Purpose |
|-----------|-------------|---------|
| `user_id` | `userId` | User identifier |
| `role_id` | `roleId` | Role identifier |
| `state_id` | `stateId` | User's state jurisdiction |
| `district_id` | `districtId` | User's district jurisdiction |
| `zone_id` | `zoneId` | User's zone jurisdiction |
| `role_code` | `roleCode` | Role code for filtering |

### 4.4 Auth Endpoints

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/auth/login` | POST | None | Authenticate user, get JWT |
| `/api/auth/getMe` | GET | JWT | Get current user profile + location |
| `/api/auth/logout` | POST | None | Logout handler |
| `/api/auth/verify` | GET | JWT | Verify token validity |

---

## 5. Complete API Reference

### 5.1 Authentication

#### `POST /api/auth/login`

Authenticate user credentials and return JWT token.

**Request Body:**
```json
{
  "username": "dcp_user",
  "password": "1234"
}
```

**Response (200):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "1",
    "username": "dcp_user",
    "email": "dcp@example.com",
    "role": {
      "id": 8,
      "code": "CADO",
      "name": "Chief Administrative Officer",
      "is_active": true,
      "dashboard_title": "CADO Dashboard",
      "menu_items": "[\"inbox\",\"sent\",\"finaldisposal\"]",
      "permissions": "[\"read\",\"write\"]",
      "can_access_settings": true,
      "can_forward": false,
      "can_re_enquiry": false,
      "can_generate_ground_report": false,
      "can_FLAF": false,
      "can_create_freshLicence": false
    }
  }
}
```

**Error Responses:**
| Status | Condition |
|--------|-----------|
| 401 | Invalid username or password |
| 401 | Login failed - role inactive |

---

#### `GET /api/auth/getMe`

Get authenticated user's profile with role and location information.

**Auth:** JWT Bearer Token

**Response (200):**
```json
{
  "id": "1",
  "username": "dcp_user",
  "email": "dcp@example.com",
  "createdAt": "2025-08-20T12:00:00.000Z",
  "updatedAt": "2025-08-20T12:00:00.000Z",
  "role": {
    "id": 8,
    "code": "CADO",
    "name": "Chief Administrative Officer",
    "is_active": true,
    "dashboard_title": "CADO Dashboard",
    "menu_items": ["inbox", "sent", "finaldisposal"],
    "permissions": ["read", "write"],
    "can_access_settings": true,
    "can_forward": false,
    "can_re_enquiry": false,
    "can_generate_ground_report": false,
    "can_FLAF": false,
    "can_create_freshLicence": false
  },
  "location": {
    "state": { "id": "1", "name": "State A" },
    "district": { "id": "2", "name": "District B" },
    "division": { "id": "5", "name": "Division X" },
    "zone": { "id": "3", "name": "Zone Y" },
    "policeStation": { "id": "7", "name": "Police Station Z" }
  }
}
```

---

#### `GET /api/auth/verify`

Verify that the JWT token is valid.

**Auth:** JWT Bearer Token

**Response (200):**
```json
{
  "valid": true,
  "user": { ... }
}
```

---

#### `POST /api/auth/logout`

Handle logout (clears any server-side state if needed).

**Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### 5.2 User Management

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/users` | JWT | Create new user |
| GET | `/api/users` | JWT | List users (with role/location filtering) |
| GET | `/api/users/:id` | JWT | Get user by ID |
| PUT | `/api/users/:id` | JWT | Update user |
| DELETE | `/api/users/:id` | JWT | Delete user |

#### `POST /api/users`

**Auth:** JWT Bearer Token (requires appropriate role)

**Request Body:**
```json
{
  "username": "new_user",
  "email": "user@example.com",
  "password": "securePassword123",
  "role": "DCP"
}
```

**Role Options:** `APPLICANT`, `SHO`, `ZS`, `ACP`, `DCP`, `CP`, `ADMIN`, `SUPER_ADMIN`, `ARMS_SUPDT`

---

#### `GET /api/users`

**Auth:** JWT Bearer Token

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `role` | string | Filter by role code |
| `page` | number | Page number |
| `limit` | number | Items per page |

**Note:** Filters by location hierarchy — admins see users within their state; SUPER_ADMIN sees all.

---

### 5.3 Fresh License Application

**Base URL:** `/api/application-form`
**Auth:** JWT Bearer Token (all endpoints)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/application-form/personal-details` | Create new draft application (Step 1) |
| PATCH | `/api/application-form?isSubmit=true` | Update sections + submit |
| GET | `/api/application-form` | List applications (paginated, filterable) |
| GET | `/api/application-form/:id` | Get application by ID |
| GET | `/api/application-form/user/:id` | Get applications for user |
| POST | `/api/application-form/:applicationId/upload-file` | Upload file metadata |
| DELETE | `/api/application-form/:id` | Delete file record |
| DELETE | `/api/application-form/application/:id` | Delete draft application |
| GET | `/api/application-form/hierarchy/:applicationId` | Get hierarchy info |

#### `POST /api/application-form/personal-details`

Create a new fresh license application draft.

**Request Body:**
```json
{
  "firstName": "John",
  "middleName": "M",
  "lastName": "Doe",
  "parentOrSpouseName": "Jane Doe",
  "sex": "MALE",
  "dateOfBirth": "1990-01-15",
  "dobInWords": "Fifteenth January Nineteen Ninety",
  "placeOfBirth": "Kolkata",
  "aadharNumber": "123456789012",
  "panNumber": "ABCDE1234F"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Personal details created successfully",
  "data": {
    "id": 1,
    "acknowledgementNo": "ALMS2025-0001",
    "firstName": "John",
    "lastName": "Doe",
    "sex": "MALE",
    "userId": 1,
    "workflowStatusId": 1,
    "isDraft": true,
    "createdAt": "2025-08-20T12:00:00.000Z"
  }
}
```

#### `PATCH /api/application-form?isSubmit=true`

Update application sections. When `isSubmit=true`, submits the application into the workflow.

**Request Body (PatchApplicationDetailsDto):**
```json
{
  "isDeclarationAccepted": true,
  "isAwareOfLegalConsequences": true,
  "isTermsAccepted": true,
  "isSubmit": true,
  "addresses": { ... },
  "personalDetails": { ... },
  "occupationAndBusiness": { ... },
  "criminalHistories": [...],
  "licenseHistories": [...],
  "licenseDetails": [...],
  "biometricData": { ... }
}
```

**Patchable Sections:**
| Section DTO | Nested Object | Key Fields |
|-------------|---------------|------------|
| `PatchAddressDetailsDto` | `addresses` | presentAddress, permanentAddress |
| `PatchPersonalDetailsDto` | `personalDetails` | firstName, lastName, dob, aadhar, pan |
| `PatchOccupationBusinessDto` | `occupationAndBusiness` | occupation, businessName, businessAddress |
| `PatchCriminalHistoryDto` | `criminalHistories[]` | caseDetails, courtName, FIRNumber, status |
| `PatchLicenseHistoryDto` | `licenseHistories[]` | previousLicenseNo, issuingAuthority, status |
| `PatchLicenseDetailsDto` | `licenseDetails[]` | weaponType, weaponMake, caliber, purpose |
| `PatchBiometricDataDto` | `biometricData` | fingerprints, templates, qualityScore |

#### `GET /api/application-form`

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `page` | number | Page number (default: 1) |
| `limit` | number | Items per page (default: 10) |
| `statusId` | string | Comma-separated status IDs |
| `search` | string | Search term |
| `searchField` | string | Field to search |
| `orderBy` | string | Sort field |
| `order` | enum | `ASC` or `DESC` |

---

### 5.4 Renewal Application

**Base URL:** `/api/renewal`
**Auth:** JWT Bearer Token (all endpoints)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/renewal` | Create renewal application |
| PATCH | `/api/renewal?isSubmit=true` | Update + submit renewal |
| GET | `/api/renewal` | List renewal applications |
| GET | `/api/renewal/:applicationId` | Get specific renewal |
| POST | `/api/renewal/:applicationId/upload-file` | Upload file metadata |
| DELETE | `/api/renewal/file/:fileId` | Delete file record |
| DELETE | `/api/renewal/application/:applicationId` | Delete draft renewal |
| POST | `/api/renewal/approved/merge` | Merge renewal → fresh license |
| GET | `/api/renewal/merge-audit-logs/all` | List merge audit logs |
| GET | `/api/renewal/merge-audit-logs/:mergeId` | Get specific merge audit |

#### `POST /api/renewal`

Create a new renewal application draft.

**Request Body:**
```json
{
  "licenseNumber": "WB-2020-001234",
  "firstName": "John",
  "middleName": "M",
  "lastName": "Doe",
  "parentOrSpouseName": "Jane Doe",
  "sex": "MALE",
  "dateOfBirth": "1990-01-15"
}
```

**Key Difference from Fresh:** Requires `licenseNumber` for existing license.

#### `POST /api/renewal/approved/merge`

Merge an approved renewal license into the fresh license record.

**Auth:** Requires JTCP or CP role

**Request Body:**
```json
{
  "renewalApplicationId": 1,
  "freshApplicationId": 1
}
```

**Response:**
```json
{
  "success": true,
  "message": "Licenses merged successfully",
  "data": {
    "renewalToFresh": { ... },
    "freshToRenewal": { ... }
  }
}
```

---

### 5.5 Workflow Engine

**Base URL:** `/api/workflow`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/workflow/action` | JWT | Process workflow action |
| GET | `/api/workflow/statuses-actions` | JWT | Get statuses & actions |
| GET | `/api/workflow/applications` | JWT | List applications by type |
| GET | `/api/workflow/applications/:id` | JWT | Get application by ID |
| PATCH | `/api/workflow/applications/:id/status` | JWT | Update application status |
| GET | `/api/workflow/users-in-hierarchy` | JWT | Get users in hierarchy |

#### `POST /api/workflow/action`

Process a workflow action (forward, approve, reject, etc.).

**Auth:** JWT Bearer Token

**Request Body:**
```json
{
  "applicationId": 1,
  "applicationType": "fresh",    // "fresh" | "renewal"
  "actionId": 3,
  "nextUserId": 5,
  "remarks": "Forwarding for senior review",
  "attachments": [
    {
      "name": "ground_report.pdf",
      "type": "DOCUMENT",
      "contentType": "application/pdf",
      "url": "https://storage.example.com/ground_report.pdf"
    }
  ]
}
```

**Workflow Action Categories:**

| Category | Actions | Effect |
|----------|---------|--------|
| **Terminal** | REJECT, APPROVED, CLOSE, DISPOSE, CANCEL | Ends the workflow |
| **Forward** | FORWARD | Transfers to next user |
| **In-Place** | RE_ENQUIRY, GROUND_REPORT, RECOMMEND, INITIATE, RED_FLAG | Keeps with current user |

**Response (200):**
```json
{
  "success": true,
  "message": "Application forwarded to next reviewer",
  "data": {
    "applicationId": 1,
    "status": "UNDER_REVIEW",
    "currentUserId": 5,
    "nextUser": {
      "id": 5,
      "username": "senior_officer"
    },
    "workflowHistory": {
      "id": 42,
      "actionTaken": "FORWARD",
      "remarks": "Forwarding for senior review",
      "createdAt": "2025-08-20T12:00:00.000Z"
    }
  }
}
```

---

### 5.6 Location Management

**Base URL:** `/api/locations`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/locations/states` | JWT | List all states |
| GET | `/api/locations/states/:id` | JWT | Get state by ID |
| POST | `/api/locations/states` | JWT | Create state |
| PUT | `/api/locations/states/:id` | JWT | Update state |
| GET | `/api/locations/districts` | JWT | List districts (filter by `stateId`) |
| GET | `/api/locations/districts/:id` | JWT | Get district by ID |
| POST | `/api/locations/districts` | JWT | Create district |
| PUT | `/api/locations/districts/:id` | JWT | Update district |
| GET | `/api/locations/zones` | JWT | List zones (filter by `districtId`) |
| GET | `/api/locations/zones/:id` | JWT | Get zone by ID |
| POST | `/api/locations/zones` | JWT | Create zone |
| PUT | `/api/locations/zones/:id` | JWT | Update zone |
| GET | `/api/locations/divisions` | JWT | List divisions (filter by `zoneId`) |
| GET | `/api/locations/divisions/:id` | JWT | Get division by ID |
| POST | `/api/locations/divisions` | JWT | Create division |
| PUT | `/api/locations/divisions/:id` | JWT | Update division |
| GET | `/api/locations/police-stations` | JWT | List police stations (filter by `divisionId`) |
| GET | `/api/locations/police-stations/:id` | JWT | Get police station by ID |
| POST | `/api/locations/police-stations` | JWT | Create police station |
| PUT | `/api/locations/police-stations/:id` | JWT | Update police station |
| GET | `/api/locations/hierarchy` | JWT | Get full location path for a location ID |

### 5.7 Analytics & Reports

**Base URL:** `/api/admin/analytics`
**Auth:** JWT Bearer Token (all endpoints)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/analytics/applications` | Application counts by ISO week |
| GET | `/api/admin/analytics/role-load` | Application load by role |
| GET | `/api/admin/analytics/states` | Application distribution by status |
| GET | `/api/admin/analytics/admin-activities` | Recent admin workflow activities |
| GET | `/api/admin/analytics/applications/details` | Detailed application list with summary counts |

**Common Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `startDate` | ISO8601 | Filter start date |
| `endDate` | ISO8601 | Filter end date |
| `page` | number | Page for paginated endpoints |
| `limit` | number | Items per page |
| `q` | string | Search query |
| `status` | enum | `APPROVED`, `PENDING`, `REJECTED` |
| `sortBy` | string | Sort field |
| `sortOrder` | enum | `ASC`, `DESC` |

---

### 5.8 Roles & Permissions

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/roles` | JWT | List all roles |
| GET | `/api/roles/:id` | JWT | Get role by ID |
| POST | `/api/roles` | JWT | Create role |
| PUT | `/api/roles/:id` | JWT | Update role |
| DELETE | `/api/roles/:id` | JWT | Delete role |
| PATCH | `/api/roles/:id/activate` | JWT | Activate role |
| PATCH | `/api/roles/:id/deactivate` | JWT | Deactivate role |
| GET | `/api/public-roles` | JWT | Public role lookup |

### 5.9 Action-Role Mappings

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/actiones` | JWT | Get actions for user (filter by `applicationId`) |
| POST | `/api/actiones/RolesActionsMapping` | JWT | Create action mapping |
| PATCH | `/api/actiones/RolesActionsMapping/:id` | JWT | Update action mapping |
| DELETE | `/api/actiones/RolesActionsMapping/:id` | JWT | Soft delete action mapping |

### 5.10 Status Definitions

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/status` | JWT | List statuses (filter by `code`) |
| POST | `/api/status` | JWT | Create status |
| PUT | `/api/status/:id` | JWT | Update status |

### 5.11 Flow Mapping

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/flow-mapping` | JWT | Create flow mapping |
| GET | `/api/flow-mapping` | JWT | List flow mappings |
| PUT | `/api/flow-mapping/:id` | JWT | Update flow mapping |
| POST | `/api/flow-mapping/validate` | JWT | Validate flow (cycle detection) |
| DELETE | `/api/flow-mapping/:id` | JWT | Delete flow mapping |

### 5.12 Biometric

**Base URL:** `/api/biometric`
**Auth:** AuthGuard (all endpoints)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/biometric/device/status` | Check device readiness |
| GET | `/api/biometric/templates/for-matching` | Get stored templates |
| POST | `/api/biometric/enroll/:applicantId` | Enroll fingerprint |
| POST | `/api/biometric/store/:applicantId` | Store verified fingerprint |
| POST | `/api/biometric/verify/:applicantId` | Verify fingerprint |
| GET | `/api/biometric/enrolled/:applicantId` | List enrolled fingerprints |
| DELETE | `/api/biometric/:applicantId/:fingerprintId` | Delete fingerprint |
| GET | `/api/biometric/audit-logs/:applicantId` | Get audit logs |

### 5.13 Other Endpoints

| Method | Endpoint | Module | Auth | Description |
|--------|----------|--------|------|-------------|
| GET | `/api/weapons` | Weapons | JWT | List weapon types |
| GET | `/api/health` | Health | None | Health check |
| POST | `/api/qrcode/generate/:applicationId` | QRCode | JWT | Generate QR code for application |
| GET | `/api/qrcode/check-permission` | QRCode | JWT | Check QR generation permission |
| GET | `/api/public/application/:id` | Public | None | Public application view (QR scans) |
| GET | `/api/public/check-renewal-duplicate?licenseNumber=...` | Public | None | Check renewal duplicate |

---

## 6. Workflow Engine

### 6.1 Workflow State Machine

```mermaid
stateDiagram-v2
    [*] --> DRAFT: Create Application
    DRAFT --> INITIATE: Submit Application
    INITIATE --> UNDER_REVIEW: FORWARD
    UNDER_REVIEW --> RE_ENQUIRY: Request More Info
    UNDER_REVIEW --> GROUND_REPORT: Generate Report
    UNDER_REVIEW --> RECOMMEND: Recommend
    UNDER_REVIEW --> NOT_RECOMMEND: Not Recommend
    UNDER_REVIEW --> FORWARD: Forward to Senior
    UNDER_REVIEW --> APPROVED: Final Approval
    UNDER_REVIEW --> REJECT: Reject
    UNDER_REVIEW --> RED_FLAG: Flag for Review
    RE_ENQUIRY --> UNDER_REVIEW: Applicant Responds
    GROUND_REPORT --> UNDER_REVIEW: Report Submitted
    RECOMMEND --> UNDER_REVIEW: Senior Reviews
    NOT_RECOMMEND --> REJECT: Auto-Reject
    RED_FLAG --> UNDER_REVIEW: Review Complete
    APPROVED --> [*]: Terminal
    REJECT --> [*]: Terminal
    APPROVED --> CLOSE: Close Case
    APPROVED --> DISPOSE: Dispose
    CANCEL --> [*]: Cancel Application
```

### 6.2 Workflow Action Processing

```mermaid
sequenceDiagram
    participant U as User (Officer)
    participant C as WorkflowController
    participant S as WorkflowService
    participant A as ActionesService
    participant DB as Database

    U->>C: POST /api/workflow/action<br/>{ applicationId, actionId, nextUserId, remarks }
    C->>S: processWorkflowAction(dto)
    
    S->>DB: Get application (fresh/renewal)
    S->>DB: Get action details
    S->>A: Check role-action permission
    
    alt Permission Denied
        A-->>S: Error
        S-->>C: 403 Forbidden
        C-->>U: "Action not allowed for this role"
    else Forward Action
        S->>DB: Update application.currentUserId = nextUserId
        S->>DB: Create workflow history record
        S->>DB: Update application.workflowStatusId
        S-->>C: Success
        C-->>U: "Forwarded to next officer"
    else Terminal Action (Approve/Reject)
        S->>DB: Set isApproved / isRejected flags
        S->>DB: Update status to APPROVED/REJECTED
        S->>DB: Create workflow history record
        S-->>C: Success
        C-->>U: "Application approved/rejected"
    else In-Place Action
        S->>DB: Create workflow history record
        S->>DB: Update status (RE_ENQUIRY/GROUND_REPORT/etc.)
        S-->>C: Success
        C-->>U: "Action recorded"
    end
```

### 6.3 Workflow Constants

```typescript
// ROLE CODES
const ROLE_CODES = {
  ZS: 'ZS',                    // Zonal Superintendent
  SHO: 'SHO',                  // Station House Officer
  ACP: 'ACP',                  // Assistant Commissioner of Police
  DCP: 'DCP',                  // Deputy Commissioner of Police
  AS: 'AS',                    // Arms Superintendent
  ADO: 'ADO',                  // Administrative Officer
  CADO: 'CADO',                // Chief Administrative Officer
  JTCP: 'JTCP',                // Joint Commissioner of Police
  CP: 'CP',                    // Commissioner of Police
  APPLICANT: 'APPLICANT',      // Citizen Applicant
  ADMIN: 'ADMIN',              // System Administrator
  SUPER_ADMIN: 'SUPER_ADMIN'   // Super Administrator
};

// STATUS CODES
const STATUS_CODES = {
  DRAFT: 'DRAFT',
  INITIATE: 'INITIATE',
  FORWARD: 'FORWARD',
  UNDER_REVIEW: 'UNDER_REVIEW',
  RE_ENQUIRY: 'RE_ENQUIRY',
  GROUND_REPORT: 'GROUND_REPORT',
  APPROVED: 'APPROVED',
  REJECT: 'REJECT',
  CLOSE: 'CLOSE',
  DISPOSE: 'DISPOSE',
  CANCEL: 'CANCEL'
};

// ACTION CODES
const ACTION_CODES = {
  INITIATE: 'INITIATE',
  FORWARD: 'FORWARD',
  RE_ENQUIRY: 'RE_ENQUIRY',
  GROUND_REPORT: 'GROUND_REPORT',
  RECOMMEND: 'RECOMMEND',
  NOT_RECOMMEND: 'NOT_RECOMMEND',
  APPROVED: 'APPROVED',
  REJECT: 'REJECT',
  CLOSE: 'CLOSE',
  DISPOSE: 'DISPOSE',
  CANCEL: 'CANCEL',
  RED_FLAG: 'RED_FLAG'
};
```

### 6.4 Approval Hierarchy

```mermaid
graph TB
    subgraph "Initial Processing"
        APPLICANT -->|Submit| ADO[ADO<br/>Administrative Officer]
        ADO -->|Verify| SHO[SHO<br/>Station House Officer]
    end

    subgraph "Review Chain"
        SHO -->|Forward| ZS[ZS<br/>Zonal Superintendent]
        ZS -->|Recommend| ACP[ACP<br/>Asst. Commissioner]
        ACP -->|Forward| DCP[DCP<br/>Deputy Commissioner]
    end

    subgraph "Final Authority"
        DCP -->|Forward| CP[CP/JTCP<br/>Commissioner / Joint CP]
        CP -->|Approve| APPROVED[(APPROVED)]
        CP -->|Reject| REJECTED[(REJECTED)]
    end

    subgraph "Alternative Paths"
        AS[AS<br/>Arms Superintendent]
        CADO[CADO<br/>Chief Admin Officer]
    end

    ZS -->|Ground Report| AS
    AS -->|Submit| ZS
    ACP -->|Re-Enquiry| APPLICANT
    APPLICANT -->|Respond| ACP

    style APPROVED fill:#4CAF50,color:#fff
    style REJECTED fill:#f44336,color:#fff
```

### 6.5 Role-Action Validator

The `ActionesService` dynamically filters available actions based on:
1. **User's role** — matched against `RolesActionsMapping`
2. **Current application status** — hides terminal actions if already taken
3. **Application type** — fresh vs renewal specific actions

---

## 7. Core Business Logic

### 7.1 Fresh Application Lifecycle

```mermaid
flowchart LR
    A[Create Draft] --> B[Fill Personal Details]
    B --> C[Fill Address Details]
    C --> D[Fill Occupation<br/>& Business]
    D --> E[Fill Criminal<br/>History]
    E --> F[Fill License<br/>History]
    F --> G[Fill License<br/>Details]
    G --> H[Upload Documents]
    H --> I[Biometric<br/>Enrollment]
    I --> J[Submit Application]
    J --> K[Enter Workflow]
    
    style K fill:#2196F3,color:#fff
    style J fill:#4CAF50,color:#fff
```

**Business Rules:**
- Draft status allows partial saves at any step
- Submission transitions status from `DRAFT` → `INITIATE`
- Workflow begins after submission
- Applicant can be contacted via `RE_ENQUIRY` for additional info

### 7.2 Renewal Application Lifecycle

```mermaid
flowchart LR
    A[Enter License No] --> B[Auto-populate<br/>Existing Data]
    B --> C[Update Details]
    C --> D[Upload Documents]
    D --> E[Submit Renewal]
    E --> F[Workflow Review]
    F --> G{Merge Decision}
    G -->|Approve| H[Merge into<br/>Fresh License]
    G -->|Reject| I[Rejected]
    
    style H fill:#4CAF50,color:#fff
    style I fill:#f44336,color:#fff
```

**Key Business Rules:**
- Requires valid existing `licenseNumber`
- Can copy data from existing fresh license via `copyFromFreshLicense()`
- Merge operation transfers renewal data into fresh license record
- All merges are audited via `LicensesMergeAuditLog`
- Merge requires JTCP or CP role authorization

### 7.3 License Merge Logic

The `mergeLicenses()` method performs:
1. **Transaction-based** — all updates in a single Prisma transaction
2. **Data migration** — copies renewal fields → fresh license record
3. **Address handling** — updates both present and permanent addresses
4. **Occupation merging** — transfers occupation and business data
5. **License details** — merges weapon/license specifications
6. **Audit trail** — creates `LicensesMergeAuditLog` entry with before/after snapshots

### 7.4 Biometric Security

```mermaid
flowchart TB
    subgraph "Enrollment Pipeline"
        DEV[Biometric Device] --> CAPTURE[Capture Fingerprint]
        CAPTURE --> HASH[SHA-256<br/>Template Hash]
        HASH --> DEDUP[Check Duplicates]
        DEDUP -->|Unique| ENCRYPT[AES-256-GCM<br/>Encrypt Template]
        ENCRYPT --> STORE[(Database)]
        DEDUP -->|Duplicate| REJECT[Reject Enrollment]
    end

    subgraph "Verification Pipeline"
        NEW[New Scan] --> HASH2[SHA-256 Hash]
        HASH2 --> MATCH[Compare Templates]
        MATCH -->|Match > Threshold| VERIFY[Verified ✅]
        MATCH -->|Below Threshold| REJECT2[Rejected ❌]
    end

    subgraph "Encryption Layer"
        KEY[BIOMETRIC_ENCRYPTION_KEY] --> AES[AES-256-GCM]
        AES --> IV[Random IV per record]
        IV --> TAG[Auth Tag]
        TAG --> STORE2[Store: iv + tag + ciphertext]
    end

    style ENCRYPT fill:#FF9800,color:#fff
    style AES fill:#9C27B0,color:#fff
```

### 7.5 Analytics Data Flow

```mermaid
flowchart TB
    subgraph "Data Sources"
        FLA[(Fresh License<br/>Applications)]
        REN[(Renewal<br/>Applications)]
        HIST[(Workflow<br/>Histories)]
    end

    subgraph "Analytics Service"
        WEEK[getApplicationsByWeek]
        ROLE[getRoleLoad]
        STATUS[getApplicationStates]
        ACTIVITY[getAdminActivities]
        DETAILS[getApplicationsDetails]
    end

    subgraph "API Responses"
        APPS[Application Trends]
        LOAD[Role Distribution]
        STATES[Status Distribution]
        FEED[Activity Feed]
        LIST[Paginated App List]
    end

    FLA --> WEEK
    FLA --> ROLE
    FLA --> STATUS
    REN --> WEEK
    REN --> ROLE
    HIST --> ACTIVITY
    FLA --> DETAILS
    REN --> DETAILS

    WEEK --> APPS
    ROLE --> LOAD
    STATUS --> STATES
    ACTIVITY --> FEED
    DETAILS --> LIST

    style WEEK fill:#4CAF50,color:#fff
    style ROLE fill:#2196F3,color:#fff
    style ACTIVITY fill:#FF9800,color:#fff
```

---

## 8. Developer Guide

### 8.1 Prerequisites

- **Node.js** 18+ 
- **PostgreSQL** 14+
- **npm** or **yarn**
- **Docker** (optional, for containerized setup)

### 8.2 Environment Variables

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/alms_db"

# Authentication
JWT_SECRET="your-jwt-secret-key"
JWT_EXPIRATION="86400"        # 24 hours in seconds

# Encryption
BIOMETRIC_ENCRYPTION_KEY="32-byte-aes-key-for-biometric-data"

# CORS
CORS_ORIGIN="http://localhost:3000,http://localhost:5000"

# Server
PORT=3000
NODE_ENV="development"

# Application
FRONTEND_URL="http://localhost:3000"
PUBLIC_URL="http://localhost:3000"
```

### 8.3 Setup Commands

```bash
# Install dependencies
cd backend
npm install

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Seed the database
npx prisma db seed

# Start development server
npm run start:dev

# Build for production
npm run build

# Start production
npm run start:prod
```

### 8.4 Docker Setup

```bash
# Build and start
docker compose up --build

# Production build
docker build -f Dockerfile.prod -t alms-backend .

# Run with compose
docker compose -f docker-compose.yml up
```

### 8.5 Available Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `npm run start:dev` | `nest start --watch` | Dev with hot reload |
| `npm run build` | `nest build` | Compile TypeScript |
| `npm run start:prod` | `node dist/main` | Production start |
| `npm run lint` | `eslint` | Lint TypeScript files |
| `npx prisma studio` | Prisma Studio | Database GUI |
| `npx prisma migrate dev` | Prisma Migrate | Run migrations |
| `npm run seed` | `ts-node prisma/seed.ts` | Seed database |

---

## 9. Appendix: Constants & Enums

### 9.1 Error Messages (auth.ts)

```typescript
const ERROR_MESSAGES = {
  CREDENTIALS_REQUIRED: 'Username and password are required',
  INVALID_CREDENTIALS: 'Invalid username or password',
  ROLE_INACTIVE: 'Login failed - role inactive',
  USER_NOT_FOUND: 'User not found',
  INTERNAL_SERVER_ERROR: 'Internal server error',
  UNAUTHORIZED: 'Unauthorized access',
  TOKEN_EXPIRED: 'Token has expired',
  INVALID_TOKEN: 'Invalid token provided'
};
```

### 9.2 Helper Functions (workflow-actions.ts)

```typescript
isTerminalAction(code)    // REJECT, APPROVED, CLOSE, DISPOSE, CANCEL
isForwardAction(code)     // FORWARD
isInPlaceAction(code)     // RE_ENQUIRY, GROUND_REPORT, RECOMMEND, INITIATE, RED_FLAG
isApprovalAction(code)    // APPROVED
isRejectionAction(code)   // REJECT
isReEnquiryAction(code)   // RE_ENQUIRY
isRecommendAction(code)   // RECOMMEND
isNotRecommendAction(code)// NOT_RECOMMEND
```

### 9.3 File Type Enums

```prisma
enum FileType {
  AADHAR_CARD           // Aadhar card document
  PAN_CARD              // PAN card document
  TRAINING_CERTIFICATE  // Weapon training certificate
  OTHER_STATE_LICENSE   // License from another state
  EXISTING_LICENSE      // Current license document
  SAFE_CUSTODY          // Safe custody proof
  MEDICAL_REPORT        // Medical fitness report
  REJECTED_LICENSE      // Previously rejected license
  CLAIM_DOCS            // Claim documents
  SIGNATURE_THUMB       // Signature or thumb impression
  PHOTOGRAPH            // Applicant photograph
  IRIS_SCAN             // Iris scan data
  OTHER                 // Other documents
}
```

### 9.4 License Enums

```prisma
enum Sex { MALE, FEMALE, OTHER }
enum ArmsCategory { RESTRICTED, PERMISSIBLE }
enum AreaOfUse { DISTRICT, STATE, INDIA }
enum previousStatusOfLicence { APPROVED, PENDING, REJECTED }
enum LicensePurpose { SELF_PROTECTION, SPORTS, HEIRLOOM_POLICY }
enum LicenseResult { APPROVED, REJECTED, PENDING }
```

### 9.5 API Response Standard

**Success Response:**
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { ... },
  "count": 42
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Error message here",
  "error": "Detailed error info"
}
```

**Global Exception Response:**
```json
{
  "statusCode": 400,
  "timestamp": "2025-08-20T12:00:00.000Z",
  "path": "/api/users",
  "method": "POST",
  "error": "Bad Request",
  "message": "Validation failed"
}
```

---

> **Document Version:** 1.0  
> **Generated:** 2025  
> **Project:** ALMS — Arms License Management System  
> **Tech Stack:** NestJS 10.x · TypeScript 5.x · Prisma 5.x · PostgreSQL 14+ · JWT · bcrypt · AES-256-GCM
