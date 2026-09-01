# ALMS Frontend Architecture — Complete Reference

> **Stack:** Next.js 15 · React 18 · TypeScript 5 · Tailwind CSS 3 · Redux Toolkit  
> **Port:** 5000 (dev) · **Node:** ^18+

---

## Architecture Overview

```mermaid
graph TB
    subgraph "Client Browser"
        A[User Browser] --> B[Next.js App Router]
        B --> C[Middleware Edge]
        C -->|Auth Check| D{Authenticated?}
        D -->|No| E[/login]
        D -->|Yes| F[Role Router]
        F --> G[InboxLayout]
        F --> H[AdminLayout]
        F --> I[SuperAdminLayout]
    end

    subgraph "State Layer"
        J[Redux Store] --> K[authSlice]
        J --> L[uiSlice]
        J --> M[adminSlices]
        N[React Context] --> O[InboxContext]
        N --> P[GlobalActionContext]
        N --> Q[ApplicationContext]
    end

    subgraph "API Layer"
        R[Axios Instance] --> S[Auth Interceptor]
        S --> T[APIClient]
        T --> U[AuthApi]
        T --> V[ApplicationApi]
        T --> W[Services]
    end

    G --> N
    H --> J
    F --> J
    T --> X[Backend /api/*]
```

---

## Page Route Map

```mermaid
graph LR
    Login[/login] -->|authenticate| Root[/]
    Root -->|ADMIN| Admin{Admin Portal}
    Root -->|SUPER_ADMIN| SuperAdmin{Super Admin Portal}
    Root -->|Officer Role| Inbox{Inbox System}
    Root -->|APPLICANT| Inbox

    Admin -->|menu| UM[/admin/userManagement]
    Admin -->|menu| RM[/admin/roleMapping]
    Admin -->|menu| AN[/admin/analytics]
    Admin -->|menu| FM[/admin/flowMapping]
    Admin -->|menu| LM[/admin/locationsManagement]

    SuperAdmin -->|menu| SUM[/superAdmin/userManagement]
    SuperAdmin -->|menu| SRM[/superAdmin/roleMapping]
    SuperAdmin -->|menu| SAN[/superAdmin/analytics]
    SuperAdmin -->|menu| SFM[/superAdmin/flowMapping]
    SuperAdmin -->|menu| SLM[/superAdmin/locationsManagement]

    Inbox -->|type=forwarded| FWD[Forwarded Apps]
    Inbox -->|type=returned| RET[Returned Apps]
    Inbox -->|type=redflagged| FLG[Red Flagged Apps]
    Inbox -->|type=reenquiry| REQ[Re-Enquiry Apps]
    Inbox -->|type=sent| SENT[Sent Apps]
    Inbox -->|type=all| ALL[Combined View]
    Inbox -->|analytics| INA[/inbox/analytics]

    Root -->|ZS| FreshForm[Fresh Application Form]
    FreshForm -->|9 Steps| Submit[Submit to Backend]
```

---

## Layout Hierarchy

```mermaid
flowchart TD
    RootLayout["RootLayout<br/>fonts, metadata, providers"]
    RootProviders["RootProviders<br/>Redux + Context + Query"]
    AuthInit["AuthInitializer<br/>Check cookie → hydrate Redux"]

    subgraph Public
        LoginPage["/login<br/>Suspense → LoginContent"]
        ResetPwd["/reset-password"]
    end

    subgraph Inbox
        InboxLayout["InboxLayout<br/>auth guard"]
        Sidebar1["Sidebar<br/>role-based menu"]
        Header1["Header<br/>Create Form, Notifications"]
        InboxContent["Main Content<br/>?type= forwarded/returned/..."]
        Footer1["Footer"]
    end

    subgraph Admin
        AdminLayout["AdminLayout<br/>role=ADMIN guard"]
        Sidebar2["Sidebar<br/>admin menu items"]
        AdminContent["Admin Page Content"]
        Footer2["Footer"]
    end

    subgraph SuperAdmin
        SALayout["SuperAdminLayout<br/>role=SUPER_ADMIN guard"]
        Sidebar3["Sidebar<br/>super admin menu"]
        SAContent["Super Admin Page Content"]
        Footer3["Footer"]
    end

    RootLayout --> RootProviders
    RootProviders --> AuthInit
    AuthInit -->|authenticated| InboxLayout
    AuthInit -->|admin| AdminLayout
    AuthInit -->|super_admin| SALayout
    AuthInit -->|not authenticated| LoginPage

    InboxLayout --> Sidebar1
    InboxLayout --> Header1
    InboxLayout --> InboxContent
    InboxLayout --> Footer1

    AdminLayout --> Sidebar2
    AdminLayout --> AdminContent
    AdminLayout --> Footer2

    SALayout --> Sidebar3
    SALayout --> SAContent
    SALayout --> Footer3
```

---

## Provider Composition Tree

```mermaid
flowchart LR
    Provider["Provider (Redux)"]
    QC["QueryClientProvider<br/>@tanstack/react-query<br/>stale:5m, gc:10m"]
    LP["LayoutProvider<br/>showHeader / showSidebar"]
    NP["NotificationProvider<br/>bell badge count"]
    ATP["AdminThemeProvider<br/>light/dark mode"]
    AAP["AdminAuthProvider"]
    AMP["AdminMenuProvider"]
    UP["UserProvider"]
    AP["ApplicationProvider<br/>localStorage persist"]
    IP["InboxProvider<br/>type + data loading"]
    GAP["GlobalActionProvider<br/>prevent duplicate nav"]
    AI["AuthInitializer"]
    Children["{children}"]

    Provider --> QC --> LP --> NP --> ATP --> AAP --> AMP --> UP --> AP --> IP --> GAP
    GAP --> AI
    GAP --> Children
```

---

## State Management Architecture

```mermaid
flowchart TD
    subgraph Redux["Redux Toolkit Store"]
        Auth["authSlice<br/>user, token, authenticated, loading"]
        UI["uiSlice<br/>isInboxOpen"]
        AdminUsers["adminUserSlice"]
        AdminAudit["adminAuditSlice"]
        AdminRoles["adminRoleSlice"]
    end

    subgraph Thunks["Async Thunks"]
        Login["login()<br/>POST /auth/login<br/>→ set cookies<br/>→ fetch profile"]
        Init["initializeAuth()<br/>read auth cookie<br/>→ GET /auth/getMe"]
        Logout["logoutUser()<br/>clear cookies<br/>→ redirect /login"]
    end

    subgraph Context["React Contexts"]
        Layout["LayoutContext<br/>showHeader, showSidebar"]
        AppCtx["ApplicationContext<br/>app list (localStorage)"]
        InboxCtx["InboxContext<br/>selectedType, applications, loadType"]
        Global["GlobalActionContext<br/>action prevention, nav lock"]
        Notif["NotificationContext<br/>unread count, markRead"]
    end

    subgraph Stores["Lightweight Stores"]
        Fresh["useFreshFormStore<br/>useSyncExternalStore<br/>formData, setField, reset"]
        AppStore["applicationStore<br/>subscribe/listener pattern"]
    end

    Auth --> Thunks
    Thunks -->|dispatch| Auth
    Fresh -->|sibling| AppStore
```

---

## Authentication Flow

```mermaid
sequenceDiagram
    actor User
    participant Login as Login Page
    participant Redux as Redux Auth Slice
    participant API as AuthApi
    participant Cookie as Browser Cookies
    participant Backend as Backend Server

    User->>Login: Enter username/password
    Login->>Redux: dispatch(login())
    Redux->>API: POST /auth/login {username, password}
    API->>Backend: HTTP Request
    Backend-->>API: { token, user }
    API-->>Redux: response
    Redux->>Cookie: persistAuthCookies(token, user)
    Note over Cookie: Sets: auth, role, user cookies
    Redux->>API: GET /auth/getMe (with token)
    API->>Backend: Validate token
    Backend-->>API: { id, username, role, ... }
    API-->>Redux: user profile
    Redux->>Redux: dispatch(setCredentials)
    Redux->>Login: navigateToDefaultMenu(role)
    Login->>User: Redirect to role-based dashboard

    Note over Login,Backend: --- On Page Refresh ---

    Login->>Redux: AuthInitializer mounts
    Redux->>Cookie: read auth cookie
    Cookie-->>Redux: token
    Redux->>API: GET /auth/getMe (token)
    API->>Backend: Validate
    Backend-->>API: user profile
    API-->>Redux: dispatch(setCredentials)
    Redux->>Login: Layout checks auth state
```

---

## API Integration Layer

```mermaid
flowchart TD
    subgraph HTTP["HTTP Layer"]
        AXIOS["axiosInstance<br/>baseURL: NEXT_PUBLIC_API_URL<br/>timeout: 30s"]
        REQ["Request Interceptor<br/>auto-attach Bearer token"]
        RES["Response Interceptor<br/>401 → clear cookies → /login"]
    end

    subgraph Client["ApiClient Class"]
        AUTH["ensureAuthHeader()<br/>1. Check axios header<br/>2. Read auth cookie<br/>3. Redirect if missing"]
        GET["get<T>(endpoint, params)"]
        POST["post<T>(endpoint, data)"]
        PUT["put<T>(endpoint, data)"]
        DEL["delete<T>(endpoint)"]
        UPLOAD["uploadFile<T>(endpoint, formData)"]
    end

    subgraph Facade["APIClient Facade"]
        AuthAPI["AuthApi<br/>login, logout, getMe"]
        AppAPI["ApplicationApi<br/>getAll, getById, create, forward"]
        DocAPI["DocumentApi<br/>upload, store, delete"]
        ReportAPI["ReportApi<br/>statistics, PDF"]
        UserAPI["UserApi<br/>byRole, preferences"]
        QRAPI["QRCodeApi<br/>generate, check"]
        PublicAPI["PublicApi<br/>no auth required"]
    end

    subgraph Services["Domain Services"]
        SB["sidebarApiCalls.ts<br/>fetchApplicationsByStatusKey()<br/>fetchApplicationCounts()<br/>getApplicationByApplicationId()<br/>API cache (30s TTL)"]
        APP_SVC["ApplicationService<br/>createApplication()<br/>updateApplication()<br/>extractSectionData()"]
        WEP["WeaponsService<br/>getAll()"]
    end

    AXIOS --> REQ
    AXIOS --> RES
    Client --> AXIOS
    AUTH --> Client
    Facade --> Client
    Services --> Facade
    SB --> AppAPI
    APP_SVC -->|fetchData| AXIOS
```

---

## Data Fetching Flow (Inbox Example)

```mermaid
sequenceDiagram
    actor User
    participant Sidebar
    participant InboxCtx as InboxContext
    participant Service as sidebarApiCalls
    participant Cache as In-Memory Cache
    participant APIClient as ApplicationApi
    participant Backend

    User->>Sidebar: Click "Forwarded" sub-item
    Sidebar->>Sidebar: setActiveItem('inbox-forwarded')
    Sidebar->>Sidebar: dispatch(openInbox())
    Sidebar->>InboxCtx: loadType('forwarded', false, statusIds)
    InboxCtx->>Service: fetchApplicationsByStatusKey('forwarded', statusIds)
    Service->>Service: convertStatusNamesToIds('forwarded') → '1,9,3,11'
    Service->>Cache: check cache key 'fetchApplicationsByStatus_1,9,3,11'
    alt Cache Hit (< 30s)
        Cache-->>Service: cached data
    else Cache Miss
        Service->>APIClient: getAll({ statusIds: '1,9,3,11' })
        APIClient->>Backend: GET /application-form?statusIds=1,9,3,11
        Backend-->>APIClient: Application[]
        APIClient-->>Service: ApiResponse
        Service->>Service: transformApiApplicationToApplicationData()
        Service->>Cache: setCachedData(key, apps, 30000)
    end
    Service-->>InboxCtx: ApplicationData[]
    InboxCtx->>InboxCtx: setApplications(transformedData)
    Sidebar->>Sidebar: router.push('/inbox?type=forwarded')
    User->>User: Sees application list
```

---

## Form Submission Flow

```mermaid
sequenceDiagram
    actor ZSOfficer as ZS Officer
    participant Form as FreshApplicationForm
    participant Validator as Validation Engine
    participant Uploader as File Upload Handler
    participant Payload as Payload Builder
    participant API as ApplicationApi
    participant Backend

    ZSOfficer->>Form: Fill 9 steps
    ZSOfficer->>Form: Click Submit on Declaration step
    Form->>Validator: validateAllStepsForSubmission()
    Validator-->>Form: isValid=true

    Form->>Uploader: uploadFilesAndGetUrls()
    Uploader->>Uploader: Compress images (300px max, 0.3 quality)
    Uploader->>Uploader: Convert to base64
    Uploader-->>Form: fileUploads[]

    Form->>Payload: createPayload(formData, userId, fileUploads)
    Payload-->>Form: nested API payload

    Form->>API: create(payload)
    API->>Backend: POST /application-form (10MB limit)

    alt 413 Payload Too Large
        Backend-->>API: 413 error
        API-->>Form: error
        Form->>Form: Retry without file uploads
        Form->>API: create(payload_without_files)
        API->>Backend: POST /application-form
        Backend-->>API: success
        API-->>Form: { acknowledgementNo, applicationId }
        Form->>ZSOfficer: "Files too large, upload separately"
    else Success
        Backend-->>API: { id, acknowledgementNo }
        API-->>Form: response
        Form->>Form: Clear localStorage draft
        Form->>ZSOfficer: Show success + acknowledgement number
    end
```

---

## Role-Based Menu System

```mermaid
flowchart TD
    subgraph Sources["Role Input Sources"]
        S1["userRole (Redux)"]
        S2["cookieRole (document.cookie)"]
    end

    subgraph Resolution["Role Resolution"]
        R1["normalizeRole()<br/>string | object | numeric ID → uppercase code"]
        R2["getRoleConfig()<br/>read role data from cookie<br/>extract menuItems, permissions"]
    end

    subgraph Menus["Menu Generation"]
        M1["isAdminRole()?"]
        M1 -->|YES| M2["getAdminMenuItems()<br/>5 items: userMgmt, roleMgmt,<br/>analytics, flowMapping, locations"]
        M1 -->|NO| M3["getSuperAdminMenuItems()<br/>5 items under /superAdmin/"]
        M1 -->|Officer| M4["roleSpecificMenuDefaults<br/>ZS: freshform, inbox, sent...<br/>SHO: inbox, sent...<br/>DCP: inbox, sent..."]
    end

    subgraph Sidebar["Sidebar Rendering"]
        SB1["Build menuItems[] with dedup"]
        SB2["Render Inbox sub-menu<br/>Forwarded | Returned | RedFlagged | ReEnquiry"]
        SB3["Badge counts via useSidebarCounts"]
        SB4["Active state via localStorage<br/>activeNavItem"]
        SB5["Navigation prevention via<br/>GlobalActionContext"]
    end

    Sources --> R1 --> R2 --> Menus --> Sidebar
```

---

## Component Inventory

### Top-Level Components

| Component | File | Lines | Purpose |
|---|---|---|---|
| **Sidebar** | `Sidebar.tsx` | ~900 | Role-based navigation with inbox sub-menu |
| **Header** | `Header.tsx` | ~400 | Top bar with create form, notifications, print |
| **RootProviders** | `RootProviders.tsx` | ~60 | Provider composition root |
| **AuthInitializer** | `AuthInitializer.tsx` | ~50 | Auth bootstrap on mount |
| **ProtectedRoute** | `ProtectedRoute.tsx` | ~50 | Route guard wrapper |
| **LoginForm** | `LoginForm.tsx` | ~60 | Simple login form (legacy) |
| **Navbar** | `Navbar.tsx` | ~40 | Simple top nav (legacy) |
| **Footer** | `Footer.tsx` | ~30 | App footer |

### Admin UI Kit (`components/admin/`)

| Component | Purpose | Props |
|---|---|---|
| `AdminTable` | Sortable/filterable table | columns, data, loading, pagination |
| `AdminCard` | Info card | title, children, className |
| `AdminModal` | Dialog | isOpen, onClose, title, size, children |
| `AdminFilter` | Search + date range | onFilter, onReset |
| `AdminToolbar` | Action buttons | buttons, className |
| `AdminErrorAlert` | Error display | message, onRetry |
| `AdminErrorBoundary` | Error boundary | children, fallback |
| `AdminFormSkeleton` | Form loader | rows, columns |
| `AdminTableSkeleton` | Table loader | rows, columns |
| `AdminCardSkeleton` | Card loader | count |
| `AdminSectionSkeleton` | Section loader | - |
| `Breadcrumb` | Navigation trail | items[] |
| `ConfirmationDialog` | Confirm/cancel | isOpen, message, onConfirm, onCancel |
| `PermissionMatrix` | Role-permission grid | roles, permissions |
| `RoleFormModal` | Role create/edit | role, onSave, onClose |
| `RoleTable` | Roles list | roles, onEdit, onDelete |
| `WorkflowGraphPreview` | Workflow diagram | flowData |

### Analytics Components (`components/analytics/`)

| Component | Purpose |
|---|---|
| `AnalyticsDashboard` | Main wrapper with stats, charts, table |
| `AdminActivityFeed` | Recent action timeline |
| `FiltersHeader` | Date range + dropdown filters |
| `SummaryStats` | KPI cards (pending, approved, rejected, returned) |
| `TimelineChart` | Line chart of applications over time |
| `RoleLoadChart` | Workload per role bar chart |
| `StatusDistributionChart` | Pie/bar by status |
| `ApplicationsTable` | Filterable application list |

### Form Section Components (`components/forms/freshApplication/`)

| Component | Step | Key Fields |
|---|---|---|
| `PersonalInformation` | 1 | Name, DOB, PAN, Aadhar, Mobile, Email |
| `AddressDetails` | 2 | Present/Permanent address, LocationCascade |
| `OccupationBussiness` | 3 | Occupation, Office address, Crop, Cultivation |
| `CriminalHistory` | 4 | Dynamic array: convicted, FIR, case pending |
| `LicenseHistory` | 5 | Previous apps, family licenses, training |
| `LicenseDetails` | 6 | Weapon, category, validity, ammunition |
| `BiometricInformation` | 7 | Signature, Iris, Photograph |
| `DocumentsUpload` | 8 | Aadhar, PAN, Photo, Certificates |
| `Preview` | 9 | Read-only review |
| `Declaration` | 9 | Truth declaration, legal acceptance |

### Form UI Elements (`components/forms/elements/`)

```
Button, Input, Select, Checkbox, DateOfBirth, FileUpload,
FormField, Card, Alert, LocationHierarchy, StepHeader, Tooltip, footer
```

---

## Redux State Shape

```typescript
interface RootState {
  auth: {
    isAuthenticated: boolean;
    user: User | null;
    token: string | null;
    loading: boolean;
    error: string | null;
    initialized: boolean;
  };
  ui: {
    isInboxOpen: boolean;
  };
  adminUsers: { /* admin user CRUD state */ };
  adminAudit: { /* audit log state */ };
  adminRoles: { /* role management state */ };
}
```

---

## Fresh Application Data Model

```mermaid
erDiagram
    ApplicationForm {
        int id PK
        string acknowledgementNo UK
        string firstName
        string middleName
        string lastName
        string parentOrSpouseName
        enum sex "MALE | FEMALE | OTHER"
        string placeOfBirth
        date dateOfBirth
        string panNumber
        string aadharNumber
        int currentUserId FK
        int workflowStatusId FK
        boolean isApproved
        boolean isRejected
        boolean isPending
        boolean isReEnquiry
    }

    PresentAddress {
        int id PK
        string addressLine
        int stateId FK
        int districtId FK
        int zoneId FK
        int divisionId FK
        int policeStationId FK
        date sinceResiding
        string officeMobile
    }

    PermanentAddress {
        int id PK
        string addressLine
        int stateId FK
        int districtId FK
        int zoneId FK
        int divisionId FK
        int policeStationId FK
        date sinceResiding
    }

    OccupationBusiness {
        int id PK
        string occupation
        string officeAddress
        int stateId FK
        int districtId FK
        string cropLocation
        float areaUnderCultivation
    }

    CriminalHistory {
        int id PK
        int applicationId FK
        boolean isConvicted
        boolean isBondExecuted
        date bondDate
        boolean isProhibited
        json firDetails
    }

    LicenseHistory {
        int id PK
        int applicationId FK
        boolean hasAppliedBefore
        boolean hasLicenceSuspended
        boolean hasFamilyLicence
        boolean hasSafePlace
        boolean hasTraining
    }

    LicenseDetails {
        int id PK
        int applicationId FK
        enum needForLicense "SELF_PROTECTION | SPORTS | HEIRLOOM"
        enum armsCategory "RESTRICTED | PERMISSIBLE"
        string areaOfValidity
    }

    BiometricData {
        int id PK
        int applicationId FK UK
        json biometricData "signature, iris, photo URLs"
    }

    FileUploads {
        int id PK
        int applicationId FK
        enum fileType "AADHAR_CARD | PAN_CARD | PHOTOGRAPH | ..."
        string fileUrl
        string fileName
        int fileSize
    }

    WorkflowHistory {
        int id PK
        int applicationId FK
        int previousUserId FK
        int nextUserId FK
        string actionTaken
        string remarks
        int previousRoleId FK
        int nextRoleId FK
        json attachments
    }

    ApplicationForm ||--o{ PresentAddress : "present address"
    ApplicationForm ||--o{ PermanentAddress : "permanent address"
    ApplicationForm ||--o{ OccupationBusiness : "occupation"
    ApplicationForm ||--o{ CriminalHistory : "criminal records"
    ApplicationForm ||--o{ LicenseHistory : "license history"
    ApplicationForm ||--o{ LicenseDetails : "license details"
    ApplicationForm ||--o| BiometricData : "biometric"
    ApplicationForm ||--o{ FileUploads : "documents"
    ApplicationForm ||--o{ WorkflowHistory : "workflow trail"
```

---

## Security & Auth Architecture

```mermaid
sequenceDiagram
    participant Browser
    participant NextJS as Next.js Edge
    participant App as App Component
    participant Redux
    participant Axios
    participant Backend

    Note over Browser,Backend: --- Layer 1: Edge Middleware ---
    Browser->>NextJS: Request /inbox?type=forwarded
    NextJS->>NextJS: Read auth cookie
    NextJS->>NextJS: Parse JWT / JSON / raw
    NextJS->>NextJS: Extract role
    alt No token
        NextJS-->>Browser: Redirect /login
    else No role
        NextJS-->>Browser: Redirect /login?error=no_role
    else Wrong role for route
        NextJS-->>Browser: Redirect /
    else Valid
        NextJS-->>Browser: Pass through to App
    end

    Note over Browser,Backend: --- Layer 2: React Auth Guard ---
    App->>Redux: initializeAuth()
    Redux->>Axios: GET /auth/getMe
    Axios->>Backend: Bearer token
    Backend-->>Axios: { id, username, role }
    Axios-->>Redux: dispatch(setCredentials)
    Redux-->>App: isAuthenticated=true, userRole='ZS'

    Note over Browser,Backend: --- Layer 3: Layout Guard ---
    App->>App: AdminLayout checks role='ADMIN'
    alt Role mismatch
        App->>Browser: Redirect /login
    else Role matches
        App->>App: Render protected content
    end

    Note over Browser,Backend: --- Layer 4: Axios 401 Interceptor ---
    App->>Axios: GET /api/protected-resource
    Axios->>Backend: Bearer token (expired)
    Backend-->>Axios: 401 Unauthorized
    Axios->>Axios: Clear auth cookies
    Axios->>Browser: window.location.href = '/login'
```

---

## Status ID Mapping & Menu System

```mermaid
flowchart LR
    subgraph Menu["Sidebar Menu Items"]
        ZS["ZS Menu<br/>freshform[9], inbox[1,9],<br/>sent, closed, drafts,<br/>finaldisposal, analytics"]
        SHO["SHO Menu<br/>inbox[1,9], sent"]
        DCP["DCP Menu<br/>inbox[1,9,11], sent"]
        CP["CP Menu<br/>inbox[1,9,11], sent,<br/>analytics"]
    end

    subgraph Statuses["Backend Status Codes"]
        S1["1: FORWARD"]
        S2["2: REJECT"]
        S3["3: APPROVED"]
        S4["4: CANCEL"]
        S5["5: RE_ENQUIRY"]
        S6["6: GROUND_REPORT"]
        S7["7: DISPOSE"]
        S8["8: RED_FLAG"]
        S9["9: INITIATE"]
        S10["10: CLOSE"]
        S11["11: RECOMMEND"]
        S12["12: DRAFT"]
    end

    Menu -->|statusIdMap| Statuses
```

---

## Developer Quick Reference

### Directory Map
```
src/
├── app/           # Pages (Next.js App Router)
├── api/           # Axios config
├── components/    # All React components
├── config/        # Config, API clients, roles
├── context/       # React Context providers
├── hooks/         # Custom hooks
├── services/      # Data services
├── store/         # Redux store
├── stores/        # Lightweight stores
├── styles/        # Admin design system
├── types/         # TypeScript interfaces
└── utils/         # Utilities
```

### Key Patterns
1. **Auth**: Redux + cookies + middleware (3-layer)
2. **API**: Axios → ApiClient → APIClient facade → Domain services
3. **State**: Redux (global) → Context (feature) → useState (local)
4. **Forms**: Controlled components, per-step validation, draft in localStorage
5. **Navigation**: Sidebar menu → role-based redirect → inbox type system

### Environment Variables
```
NEXT_PUBLIC_API_URL = http://localhost:3001/api
BACKEND_URL          = http://localhost:3001
PORT                 = 5000
```

---

*Generated: June 2026 | ALMS Frontend v1.0*
