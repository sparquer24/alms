# ALMS Frontend — Complete Architecture Documentation

> **Project:** Arms License Management System (ALMS)  
> **Framework:** Next.js 15 (App Router) + React 18  
> **Styling:** Tailwind CSS 3 + Custom CSS  
> **State:** Redux Toolkit + React Context  
> **Language:** TypeScript 5  
> **Package Manager:** npm  
> **Port:** 5000 (development)

---

## Table of Contents

1. [Project Structure](#1-project-structure)
2. [Technology Stack](#2-technology-stack)
3. [Routing & Navigation](#3-routing--navigation)
4. [Component Architecture](#4-component-architecture)
5. [State Management](#5-state-management)
6. [API Integration Layer](#6-api-integration-layer)
7. [Authentication & Authorization](#7-authentication--authorization)
8. [Forms System](#8-forms-system)
9. [Role-Based Access Control](#9-role-based-access-control)
10. [Hooks & Utilities](#10-hooks--utilities)
11. [Type System](#11-type-system)
12. [Middleware & Security](#12-middleware--security)
13. [Data Flow Patterns](#13-data-flow-patterns)
14. [Developer Guide](#14-developer-guide)

---

## 1. Project Structure

```
frontend/
├── src/
│   ├── app/                    # Next.js App Router Pages
│   │   ├── admin/              # Admin portal (state-scoped)
│   │   │   ├── analytics/
│   │   │   ├── flowMapping/
│   │   │   ├── locationsManagement/
│   │   │   ├── permissions/
│   │   │   ├── roleMapping/
│   │   │   ├── roles/
│   │   │   ├── userManagement/
│   │   │   ├── users/
│   │   │   ├── workflows/
│   │   │   └── layout.tsx      # Admin layout (guarded)
│   │   ├── superAdmin/         # Super Admin portal (global)
│   │   │   ├── analytics/
│   │   │   ├── flowMapping/
│   │   │   ├── locationsManagement/
│   │   │   ├── roleMapping/
│   │   │   ├── userManagement/
│   │   │   └── layout.tsx      # Super Admin layout (guarded)
│   │   ├── inbox/              # Officer Inbox pages
│   │   │   ├── analytics/
│   │   │   ├── applications/
│   │   │   ├── layout.tsx      # Inbox layout (sidebar + header)
│   │   │   └── page.tsx
│   │   ├── application/[id]/
│   │   ├── applications/
│   │   ├── forms/
│   │   │   └── createFreshApplication/[step]/
│   │   ├── freshform/
│   │   ├── renewalApplication/[id]/
│   │   ├── login/
│   │   ├── notifications/
│   │   ├── reports/
│   │   ├── settings/
│   │   ├── reset-password/
│   │   ├── layout.tsx          # Root layout
│   │   └── page.tsx            # Landing page
│   ├── api/                    # Axios configuration & raw API functions
│   │   ├── axiosConfig.ts
│   │   └── applicationService.ts
│   ├── components/             # All React components
│   │   ├── admin/              # Admin UI kit (10+ shared components)
│   │   ├── analytics/          # Analytics dashboard components
│   │   ├── charts/             # Chart components (recharts/chart.js)
│   │   ├── createFreshApplicationForm/  # Modular fresh form (steps)
│   │   ├── forms/              # Form elements & section components
│   │   │   ├── elements/       # Reusable form UI elements
│   │   │   ├── freshApplication/  # Fresh app form sections (9 steps)
│   │   │   └── renewal/        # Renewal form components
│   │   ├── modals/             # Modal dialogs
│   │   ├── renewal/            # Renewal-specific components
│   │   ├── tables/             # Data table component
│   │   ├── UserManagement/     # Admin user management UI
│   │   ├── Sidebar.tsx         # Main navigation sidebar
│   │   ├── Header.tsx          # Top header bar
│   │   ├── RootProviders.tsx   # Provider composition root
│   │   ├── AuthInitializer.tsx # Auth bootstrap component
│   │   ├── ProtectedRoute.tsx  # Route guard
│   │   └── ...                 # 60+ components total
│   ├── config/                 # Configuration files
│   │   ├── adminMenuService.ts
│   │   ├── superAdminMenuService.ts
│   │   ├── APIClient.ts        # API client facade
│   │   ├── APIsEndpoints.ts    # Endpoint constants
│   │   ├── authenticatedApiClient.ts  # Auth-aware HTTP client
│   │   ├── formRoutes.ts
│   │   ├── helpers.ts
│   │   ├── layoutContext.tsx
│   │   ├── menuMeta.ts
│   │   ├── notificationContext.tsx
│   │   ├── roleRedirections.ts
│   │   ├── roles.ts            # Role configuration
│   │   ├── statusMap.ts        # Status ID mappings
│   │   └── apiConfig.ts
│   ├── context/                # React Context providers
│   │   ├── AdminAuthContext.tsx
│   │   ├── AdminMenuContext.tsx
│   │   ├── AdminThemeContext.tsx
│   │   ├── ApplicationContext.tsx
│   │   ├── GlobalActionContext.tsx
│   │   ├── InboxContext.tsx
│   │   └── UserContext.tsx
│   ├── hooks/                  # Custom React hooks
│   │   ├── useAuth.ts
│   │   └── useSidebarCounts.ts
│   ├── services/               # Domain-specific API services
│   │   ├── sidebarApiCalls.ts   # Main data fetching service
│   │   └── weapons.ts
│   ├── store/                  # Redux Toolkit store
│   │   ├── index.ts
│   │   ├── store.ts
│   │   ├── applicationStore.ts
│   │   ├── slices/
│   │   │   ├── authSlice.ts
│   │   │   ├── uiSlice.ts
│   │   │   ├── adminUserSlice.ts
│   │   │   ├── adminAuditSlice.ts
│   │   │   └── adminRoleSlice.ts
│   │   └── thunks/
│   │       └── authThunks.ts
│   ├── stores/                 # Zustand-like stores
│   │   └── useFreshFormStore.ts
│   ├── styles/                 # Admin design system & CSS
│   │   ├── admin-design-system.ts
│   │   └── admin.css
│   ├── types/                  # TypeScript type definitions
│   │   ├── api.ts
│   │   ├── application.ts
│   │   ├── index.ts
│   │   └── location.ts
│   ├── utils/                  # Utility functions
│   │   ├── adminPagePreloader.ts
│   │   ├── apiUtils.ts
│   │   ├── applicationMapper.ts
│   │   ├── authCookies.ts
│   │   ├── formDataLoader.ts
│   │   ├── icons.tsx
│   │   ├── imageCompress.ts
│   │   ├── loggingUtils.ts
│   │   ├── navigationUtils.ts
│   │   ├── renewalFileUpload.ts
│   │   ├── roleUtils.ts
│   │   └── stringUtils.ts
│   └── __tests__/
├── styles/
│   └── globals.css             # Global CSS
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
├── package.json
└── middleware.ts               # Next.js Edge middleware
```

---

## 2. Technology Stack

### Core Framework

| Technology       | Version | Purpose                         |
| ---------------- | ------- | ------------------------------- |
| **Next.js**      | ^15.3.3 | React framework with App Router |
| **React**        | ^18.3.1 | UI library                      |
| **TypeScript**   | ^5.9.3  | Type safety                     |
| **Tailwind CSS** | ^3.3.5  | Utility-first styling           |

### State Management

| Library                   | Version  | Purpose                        |
| ------------------------- | -------- | ------------------------------ |
| **@reduxjs/toolkit**      | ^2.8.2   | Global state (auth, UI, admin) |
| **react-redux**           | ^9.2.0   | React bindings for Redux       |
| **@tanstack/react-query** | ^5.90.10 | Server state / data fetching   |

### UI & Styling Libraries

| Library              | Version  | Purpose                 |
| -------------------- | -------- | ----------------------- |
| **@heroicons/react** | ^1.0.6   | SVG icons               |
| **lucide-react**     | ^0.525.0 | Icon library            |
| **react-icons**      | ^5.5.0   | Icon components         |
| **@mantine/core**    | ^5.10.5  | UI component library    |
| **@mantine/rte**     | ^5.10.5  | Rich text editor        |
| **@tiptap/react**    | ^3.13.0  | Rich text editor engine |
| **react-select**     | ^5.10.1  | Enhanced select inputs  |
| **react-datepicker** | ^8.4.0   | Date picker             |

### Charts & Data Visualization

| Library             | Version | Purpose                    |
| ------------------- | ------- | -------------------------- |
| **recharts**        | ^3.0.2  | React chart library        |
| **chart.js**        | ^4.5.0  | Chart rendering            |
| **react-chartjs-2** | ^5.3.0  | React wrapper for Chart.js |

### HTTP & API

| Library          | Version | Purpose           |
| ---------------- | ------- | ----------------- |
| **axios**        | ^1.10.0 | HTTP client       |
| **jose**         | ^6.2.3  | JWT decoding      |
| **cookies-next** | ^6.0.0  | Cookie management |

### Document & Export

| Library         | Version | Purpose                     |
| --------------- | ------- | --------------------------- |
| **jspdf**       | ^3.0.1  | PDF generation              |
| **html2canvas** | ^1.4.1  | HTML to canvas (PDF export) |
| **xlsx**        | ^0.18.5 | Excel export                |
| **papaparse**   | ^5.5.3  | CSV parsing                 |
| **file-saver**  | ^2.0.5  | File download               |

### Testing

| Library                    | Version | Purpose                     |
| -------------------------- | ------- | --------------------------- |
| **jest**                   | ^30.0.3 | Test runner                 |
| **@testing-library/react** | ^16.3.0 | Component testing           |
| **ts-jest**                | ^29.4.0 | TypeScript Jest transformer |

### Development Tools

| Library                   | Version  | Purpose         |
| ------------------------- | -------- | --------------- |
| **eslint**                | ^9       | Linting         |
| **prettier**              | ^3.2.5   | Code formatting |
| **@next/bundle-analyzer** | ^15.5.15 | Bundle analysis |
| **postcss**               | ^8.4.31  | CSS processing  |

---

## 3. Routing & Navigation

### 3.1 Next.js App Router Structure

The application uses **Next.js App Router** with a mix of:

- **Server Components** (default)
- **Client Components** (`"use client"` directive — most pages)
- **Dynamic Routes** (`[id]`, `[step]`, `[type]`)
- **Route Groups** (admin, superAdmin, inbox each with their own layout)

### 3.2 Route Map

```
/login                              → Login page (public)
/                                   → Landing/dashboard (redirects based on role)
/not-found                          → 404 page
/error                              → Error boundary
/500                                → Server error page

/application/[id]                   → Application detail view
/applications                       → All applications listing

/forms/createFreshApplication/[step]  → Multi-step fresh application form
/freshform                          → Fresh form landing

/renewalApplication/[id]            → Renewal application detail
/renwalapplication/[id]             → Alternate renewal route
/forms/renewal                      → Renewal form creation

/inbox                              → Inbox (role-based, redirects to ?type=forwarded)
/inbox?type=forwarded               → Forwarded applications
/inbox?type=returned                → Returned applications
/inbox?type=redflagged              → Red-flagged applications
/inbox?type=reenquiry               → Re-enquiry applications
/inbox?type=sent                    → Sent (recommended) applications
/inbox?type=all                     → Combined inbox view
/inbox/analytics                    → Inbox analytics
/inbox/applications                 → All inbox applications

/notifications                      → Notifications page

/reports                            → Reports
/reports/myreports                  → My reports

/settings                           → User settings
/settings/change-password           → Change password

/reset-password                     → Password reset

/admin                              → Admin dashboard
/admin/userManagement               → User management (state-scoped)
/admin/roleMapping                  → Role management
/admin/analytics                    → State analytics dashboard
/admin/flowMapping                  → Workflow flow mapping
/admin/locationsManagement          → Location hierarchy management
/admin/users                        → Users list
/admin/users/create                 → Create user
/admin/users/[id]/edit              → Edit user
/admin/permissions                  → Permissions management
/admin/workflows                    → Workflow configuration
/admin/reports                      → Admin reports
/admin/forwarding                   → Forwarding configuration
/admin/addadmin                     → Add admin user
/admin/reset-password               → Admin password reset
/admin/roles                        → Role management

/superAdmin                         → Super Admin dashboard
/superAdmin/userManagement          → Global user management
/superAdmin/roleMapping             → Global role mapping
/superAdmin/analytics               → Global analytics
/superAdmin/flowMapping             → Global flow mapping
/superAdmin/locationsManagement     → Global locations management
```

### 3.3 Role-Based Redirect System

**File:** `src/config/roleRedirections.ts`

Defined in `ROLE_REDIRECT_CONFIG`:
| Role | Default Redirect |
|---|---|
| `ADMIN` | `/admin/userManagement` |
| `SUPER_ADMIN` | `/superAdmin/userManagement` |
| All Officer roles (SHO, DCP, ACP, ZS, etc.) | `/inbox?type=forwarded` |
| `APPLICANT` | `/inbox?type=sent` |

The `navigateToDefaultMenu()` function in `src/utils/navigationUtils.ts` performs dynamic role-based navigation after login by reading the user's role configuration.

### 3.4 Layout Hierarchy

```
RootLayout (src/app/layout.tsx)
├── Global CSS + Fonts
├── RootProviders (Redux + Context + Query)
└── Page Content
    ├── Public Pages (login, reset-password)
    │   └── No sidebar/header
    ├── AdminLayout (/admin/*)
    │   ├── Auth Guard (role = ADMIN)
    │   ├── Sidebar (admin menu)
    │   ├── Main Content
    │   └── Footer
    ├── SuperAdminLayout (/superAdmin/*)
    │   ├── Auth Guard (role = SUPER_ADMIN)
    │   ├── Sidebar (super admin menu)
    │   ├── Main Content
    │   └── Footer
    └── InboxLayout (/inbox/*)
        ├── Auth Guard (authenticated)
        ├── InboxBootloaderClient
        ├── Sidebar (role-based menu)
        ├── Header (with "Create Form" button)
        ├── Main Content
        └── Footer
```

---

## 4. Component Architecture

### 4.1 Provider Composition (RootProviders)

```
RootProviders
├── Provider (Redux store)
│   └── QueryClientProvider (@tanstack/react-query)
│       └── LayoutProvider (showHeader/showSidebar state)
│           └── NotificationProvider
│               └── AdminThemeProvider
│                   └── AdminAuthProvider
│                       └── AdminMenuProvider
│                           └── UserProvider
│                               └── ApplicationProvider
│                                   └── InboxProvider
│                                       └── GlobalActionProvider
│                                           ├── AuthInitializer
│                                           └── {children}
```

### 4.2 Core Layout Components

#### Sidebar (`src/components/Sidebar.tsx`)

- **Role-based menu rendering** — Reads menu items from role config (cookie or defaults)
- **Inbox sub-menu** — Forwarded, Returned, Red Flagged, Re-Enquiry with badge counts
- **Admin/Super Admin menus** — 5 items: User Management, Role Management, Analytics, Flow Mapping, Locations Management
- **Active state persistence** — localStorage `activeNavItem`
- **Navigation prevention** — Uses `GlobalActionContext` to prevent duplicate navigations
- **Badge counts** — Fetched via `useSidebarCounts` hook (30s cache)
- **Logout button** — Dispatches `logoutUser` thunk
- **Mobile responsive** — Collapsible hamburger menu on small screens

#### Header (`src/components/Header.tsx`)

- **Create Form dropdown** — For ZS role users (Fresh Application, Renewal)
- **Renewal modal** — Validates fresh application is approved before creating renewal
- **Breadcrumb support** — Configurable breadcrumb trail
- **Status badge** — Optional status indicator for detail views
- **Notification bell** — With unread count badge
- **Print button** — Global print (hidden via `hidePrint` prop)
- **User avatar** — First letter of username with link to settings

#### Footer (`src/components/Footer.tsx`)

- Dark/light variant support
- Configurable via `variant` prop

### 4.3 Admin Component Library

All in `src/components/admin/`:

| Component              | Purpose                                           |
| ---------------------- | ------------------------------------------------- |
| `AdminTable`           | Reusable data table with sort, filter, pagination |
| `AdminCard`            | Info card with title, content, optional actions   |
| `AdminModal`           | Modal dialog with configurable size               |
| `AdminFilter`          | Filter bar with search, date range, status select |
| `AdminToolbar`         | Action toolbar with buttons                       |
| `AdminErrorAlert`      | Error display with retry                          |
| `AdminErrorBoundary`   | React error boundary wrapper                      |
| `AdminFormSkeleton`    | Form loading skeleton                             |
| `AdminTableSkeleton`   | Table loading skeleton                            |
| `AdminCardSkeleton`    | Card loading skeleton                             |
| `AdminSectionSkeleton` | Section loading skeleton                          |
| `Breadcrumb`           | Navigation breadcrumbs                            |
| `ConfirmationDialog`   | Confirm/cancel dialog                             |
| `PermissionMatrix`     | Role-permission grid                              |
| `RoleFormModal`        | Role create/edit form                             |
| `RoleTable`            | Roles list table                                  |
| `WorkflowGraphPreview` | Workflow visualization                            |

### 4.4 Analytics Components

| Component                 | Purpose                                     |
| ------------------------- | ------------------------------------------- |
| `AnalyticsDashboard`      | Main analytics dashboard wrapper            |
| `AdminActivityFeed`       | Recent admin actions timeline               |
| `FiltersHeader`           | Date range and filter controls              |
| `SummaryStats`            | Key metrics cards (pending, approved, etc.) |
| `TimelineChart`           | Application trends over time                |
| `RoleLoadChart`           | Workload per admin role                     |
| `StatusDistributionChart` | Status breakdown pie/bar chart              |
| `ApplicationsTable`       | Filterable applications list                |

### 4.5 Form Components (Fresh Application)

#### Modular approach (`createFreshApplicationForm/`)

```
steps/
├── PersonalInfo.tsx
├── AddressDetails.tsx
├── OccupationBusiness.tsx
├── CriminalHistory.tsx
├── LicenseDetails.tsx
├── BiometricInfo.tsx
├── DocumentsUpload.tsx
├── PreviewStep.tsx
└── Declaration.tsx
ui/
├── TextInput.tsx
├── SelectInput.tsx
└── FileUpload.tsx
```

#### Legacy approach (`forms/freshApplication/`)

```
FreshApplicationFormContext.tsx
PersonalInformation.tsx
AddressDetails.tsx
OccupationBussiness.tsx
OccupationDetails.tsx
CriminalHistory.tsx
LicenseHistory.tsx
LicenseDetails.tsx
BiometricInformation.tsx
DocumentsUpload.tsx
Preview.tsx
Declaration.tsx
```

### 4.6 Form Elements (`forms/elements/`)

| Component           | Purpose                       |
| ------------------- | ----------------------------- |
| `Button`            | Reusable button with variants |
| `Input`             | Text input with validation    |
| `Select`            | Dropdown select               |
| `Checkbox`          | Checkbox input                |
| `DateOfBirth`       | Date of birth picker          |
| `FileUpload`        | File upload with preview      |
| `FormField`         | Generic form field wrapper    |
| `Card`              | Card container                |
| `Alert`             | Alert/notification banner     |
| `LocationHierarchy` | Cascading location selector   |
| `StepHeader`        | Form step indicator           |
| `Tooltip`           | Tooltip popover               |
| `footer`            | Form step footer              |

### 4.7 Renewal Components

| Component                       | Purpose             |
| ------------------------------- | ------------------- |
| `RenewalApplicationDetailsPage` | Renewal detail view |
| `RenewalHeader`                 | Renewal form header |
| `RenewalSummary`                | Renewal summary     |
| `ProceedingsForm`               | Proceedings form    |
| `RenewalProceedingsForm`        | Renewal proceedings |

#### Renewal Sections (`forms/renewal/sections/`)

```
PersonalDetailsSection.tsx
AddressDetailsSection.tsx
OccupationSection.tsx
CriminalHistory.tsx
LicenseHistory.tsx
LicenseDetailsSection.tsx
BiometricInformation.tsx
DocumentsSection.tsx
DeclarationSection.tsx
```

### 4.8 Other Key Components

| Component                     | Purpose                                             |
| ----------------------------- | --------------------------------------------------- |
| `ApplicationTable`            | Main application listing table                      |
| `ApplicationTimeline`         | Application status/action timeline                  |
| `EnhancedApplicationTimeline` | Enhanced timeline with more details                 |
| `ApprovedApplicationsList`    | List of approved apps                               |
| `ForwardApplicationModal`     | Forward app with user/role selection                |
| `ProcessApplicationModal`     | Process (approve/reject/flag) modal                 |
| `BatchProcessingModal`        | Batch process multiple applications                 |
| `ConfirmationModal`           | Generic confirmation dialog                         |
| `SuccessModal`                | Success notification modal                          |
| `NotificationDropdown`        | Notifications dropdown panel                        |
| `QRCodeDisplay`               | QR code display component                           |
| `RichTextEditor`              | Rich text editor (Mantine/TipTap)                   |
| `TiptapRichTextEditor`        | TipTap-based rich text editor                       |
| `CascadingLocationSelect`     | State → District → Zone → Division → Police Station |
| `FormStepNavigation`          | Multi-step form navigation                          |
| `MultiStepForm`               | Generic multi-step form container                   |
| `LoadingState`                | Loading indicator                                   |
| `Skeleton`                    | Skeleton loaders                                    |
| `DashboardCharts`             | Dashboard summary charts                            |
| `DashboardSummary`            | Dashboard statistics summary                        |
| `ProtectedRoute`              | Auth route guard component                          |
| `InboxBootloaderClient`       | Initial inbox data loader                           |

---

## 5. State Management

### 5.1 Redux Store Architecture

**File:** `src/store/store.ts`

```
Root Reducer
├── auth      → authSlice      (authentication state)
├── ui        → uiSlice        (UI state: inbox open/close)
├── adminUsers → adminUserSlice  (admin user management)
├── adminAudit  → adminAuditSlice  (admin audit logs)
└── adminRoles  → adminRoleSlice   (admin role management)
```

**State reset on logout:** The root reducer intercepts `auth/logout` action and returns `undefined`, which causes all reducers to reinitialize to their default state.

### 5.2 Auth Slice (`src/store/slices/authSlice.ts`)

```typescript
interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  initialized: boolean; // Auth initialization completed
}

// Selectors
selectCurrentUser;
selectIsAuthenticated;
selectAuthToken;
selectAuthLoading;
selectAuthError;
selectAuthInitialized;
```

### 5.3 UI Slice (`src/store/slices/uiSlice.ts`)

Manages inbox panel open/close state:

- `toggleInbox`
- `openInbox`
- `closeInbox`

### 5.4 Auth Thunks (`src/store/thunks/authThunks.ts`)

| Thunk            | Trigger           | Description                                                 |
| ---------------- | ----------------- | ----------------------------------------------------------- |
| `login`          | Login form submit | Calls AuthApi.login, persists cookies, fetches user profile |
| `logoutUser`     | Logout button     | Calls AuthApi.logout, clears cookies, redirects to /login   |
| `initializeAuth` | App mount         | Reads auth cookie, validates token via /auth/getMe          |
| `getCurrentUser` | Manual refresh    | Fetches current user profile                                |

**Cookie persistence:** Auth thunks synchronize Redux state with browser cookies:

- `auth` cookie — JWT token
- `role` cookie — User role code (uppercase)
- `user` cookie — Minimal user JSON (id, role, username, name)

### 5.5 React Context Providers

| Context               | File                              | Purpose                                         |
| --------------------- | --------------------------------- | ----------------------------------------------- |
| `LayoutContext`       | `config/layoutContext.tsx`        | showHeader/showSidebar state                    |
| `NotificationContext` | `config/notificationContext.tsx`  | Notification state with polling                 |
| `ApplicationContext`  | `context/ApplicationContext.tsx`  | Application list state (localStorage persisted) |
| `InboxContext`        | `context/InboxContext.tsx`        | Inbox type selection & data loading             |
| `GlobalActionContext` | `context/GlobalActionContext.tsx` | Prevent duplicate navigations/actions           |
| `UserContext`         | `context/UserContext.tsx`         | Current user state                              |
| `AdminAuthContext`    | `context/AdminAuthContext.tsx`    | Admin-specific auth                             |
| `AdminMenuContext`    | `context/AdminMenuContext.tsx`    | Admin menu active state                         |
| `AdminThemeContext`   | `context/AdminThemeContext.tsx`   | Admin theme (light/dark)                        |

### 5.6 Lightweight Stores

**Fresh Form Store** (`src/stores/useFreshFormStore.ts`):

- Uses React `useSyncExternalStore` hook
- Module-level state (no external dependency like Zustand)
- API: `useFreshFormStore()` → `{ formData, setField, reset }`

**Application Store** (`src/store/applicationStore.ts`):

- Custom minimal store with subscribe/listener pattern
- Simple `setApplications` / `clearApplications` API

---

## 6. API Integration Layer

### 6.1 Architecture Overview

```
Axios Instance (axiosConfig.ts)
├── Interceptors: auto-attach Bearer token
├── Interceptors: 401 → redirect to /login
└── Methods: fetchData, postData, putData, patchData, deleteData

AuthenticatedApiClient (authenticatedApiClient.ts)
├── ensureAuthHeader() — checks axios header, then cookies
├── get(), post(), put(), delete(), uploadFile()
└── auto-redirect on 401

APIClient (APIClient.ts)
├── AuthApi — login, logout, getMe, changePassword, resetPassword
├── ApplicationApi — CRUD + status + forward + batch
├── RenewalApi — delete renewal
├── DocumentApi — upload, store URL, get, delete
├── ReportApi — statistics, by-status, PDF generation
├── UserApi — by-role, preferences
├── RoleApi — actions, hierarchy
├── NotificationApi — getAll, markAsRead, markAllAsRead
├── QRCodeApi — generate, checkPermission
├── PublicApi — getApplicationDetails (no auth)
└── DashboardApi — getSummary (stats + trends + activities)

Domain Services (services/)
├── sidebarApiCalls.ts — Main data service
│   ├── fetchApplicationsByStatusKey()
│   ├── fetchAllApplications()
│   ├── fetchApplicationsByStatus()
│   ├── fetchApplicationCounts()
│   ├── getApplicationByApplicationId()
│   └── Transform functions
└── weapons.ts — WeaponsService.getAll()

API Service Class (api/applicationService.ts)
├── ApplicationService.createApplication()
├── ApplicationService.updateApplication()
├── ApplicationService.getApplication()
├── ApplicationService.extractSectionData()
└── ApplicationService.completeDebugCheck()
```

### 6.2 API Client Classes

#### AuthApi (public endpoints — no token required for login)

| Method           | Endpoint                     | Description          |
| ---------------- | ---------------------------- | -------------------- |
| `login`          | POST `/auth/login`           | User authentication  |
| `getCurrentUser` | GET `/auth/me`               | Current user profile |
| `getMe`          | GET `/auth/getMe`            | Minimal user object  |
| `logout`         | POST `/auth/logout`          | Session invalidation |
| `changePassword` | POST `/auth/change-password` | Password change      |
| `resetPassword`  | POST `/auth/reset-password`  | Password reset email |
| `refreshToken`   | POST `/auth/refresh-token`   | Token refresh        |

#### ApplicationApi (authenticated)

| Method              | Endpoint                                    | Description                                                        |
| ------------------- | ------------------------------------------- | ------------------------------------------------------------------ |
| `getAll`            | GET `/application-form`                     | List applications (with optional `statusIds`, `isSent`, `isOwned`) |
| `getById`           | GET `/application-form?applicationId={id}`  | Single application                                                 |
| `create`            | POST `/application-form`                    | Create fresh application                                           |
| `updateStatus`      | PUT `/applications/{id}/status`             | Update status                                                      |
| `forward`           | POST `/applications/{id}/forward`           | Forward to next user                                               |
| `batchProcess`      | POST `/applications/batch`                  | Batch process applications                                         |
| `getByStatuses`     | GET `/application-form?statusIds={ids}`     | Filter by status IDs                                               |
| `deleteApplication` | DELETE `/application-form/application/{id}` | Delete application                                                 |

#### SidebarApiCalls Service (`sidebarApiCalls.ts`)

This is the primary data fetching service used by pages. Key features:

- **API-level caching**: 30-second TTL in-memory cache (`apiCache` Map)
- **Status ID mapping**: Converts status keys (e.g., 'forwarded') to numeric status IDs via `STATUS_MAP`
- **Data transformation**: Deep transforms backend API response → frontend `ApplicationData` interface
- **DetailedApplicationData interface**: Full type definition covering all API response fields
- **Photo URL resolution**: Extracts photo from nested biometric data or file uploads
- **Sent applications**: Special handling with `isSent` parameter
- **Combined "all" type**: Fetches forwarded + returned + redflagged + reenquiry in parallel

### 6.3 Axios Configuration (`src/api/axiosConfig.ts`)

- **Base URL**: `NEXT_PUBLIC_API_URL || /api`
- **Timeout**: 30 seconds
- **Request interceptor**: Auto-attaches `Authorization: Bearer {token}` from cookies
- **Response interceptor**: On 401 (non-login requests), clears cookies and redirects to `/login`
- **Error extraction**: Deeply nested error message resolution (`details.response.error` → `response.data.message` → `error.message`)

### 6.4 Authentication API Client (`src/config/authenticatedApiClient.ts`)

Wraps axios with `ensureAuthHeader()` that checks:

1. Existing axios Authorization header (in-flight login)
2. `auth` cookie (normal usage)
3. Redirects to `/login` if no token found (browser only)

Provides:

- `get()`, `post()`, `put()`, `delete()`, `uploadFile()` methods
- URL building with `/api` deduplication
- 401 auto-redirect on any method

---

## 7. Authentication & Authorization

### 7.1 Login Flow

```
User enters credentials
  → Login page form submit
  → dispatch(login({ username, password }))
    → AuthApi.login() (POST /auth/login)
    → Response: { token, user }
    → persistAuthCookies(token, user) — sets auth, role, user cookies
    → AuthApi.getMe(token) — fetches full profile
    → dispatch(setCredentials({ user, token }))
    → navigateToDefaultMenu(role, router)
      → reads role config menu items
      → navigates to first menu item's path
```

### 7.2 Auth Initialization on Page Load

```
App mounts
  → AuthInitializer component mounts
  → dispatch(initializeAuth())
    → Reads auth cookie
    → If token exists, calls AuthApi.getMe(token)
    → If valid, dispatch(setCredentials)
    → If invalid, clear cookie, mark initialized
  → Layouts check auth state
  → Protected routes render or redirect
```

### 7.3 JWT Token Handling

- **Storage**: Browser cookie (`auth`)
- **Validation**: Decoded client-side to check `exp` (expiration)
- **Decoding**: Via `jose` library or manual `atob()` base64 decode
- **Refresh**: Via `/auth/refresh-token` endpoint
- **Logout**: Clears cookies, calls backend logout, redirects to `/login`

### 7.4 Role Resolution

**File:** `src/utils/roleUtils.ts` + `src/store/thunks/authThunks.ts`

Handles multiple role formats:

- String role codes: `'ADMIN'`, `'ZS'`, `'SHO'`
- Object roles: `{ code: 'ADMIN' }`, `{ name: 'Zonal Superintendent' }`
- Numeric role IDs: `'12'` → `'SUPER_ADMIN'`, `'2'` → `'ZS'`

**Numeric Role ID Map:**

```typescript
const NUMERIC_ROLE_MAP = {
  "2": "ZS",
  "3": "ADMIN",
  "7": "ZS",
  "12": "SUPER_ADMIN",
  "14": "ADMIN",
  "15": "SUPER_ADMIN",
  "16": "SUPER_ADMIN",
};
```

### 7.5 Cookie-Based Auth for Middleware

The `proxy.ts` file handles cookie-based auth checking at the Next.js edge:

1. Parses `auth` cookie (supports raw JWT, JSON-wrapped, or cookie-parsed)
2. Falls back to `role` cookie if role not in auth cookie
3. Falls back to `user` cookie for role extraction
4. JWT expiration check
5. Role-based route protection:
   - Public routes: `/login`, `/reset-password`
   - Protected routes: `/inbox`, `/applications`, `/reports`, etc.
   - Admin routes: `/admin/*` (requires ADMIN role)
   - Role-specific access: `/reports` (DCP, ACP, CP, ADMIN)

---

## 8. Forms System

### 8.1 Fresh Application Form (9 Steps)

```
Step 1:  Personal Information
         - First/Middle/Last Name, Filled By, Parent/Spouse, Sex, Place of Birth
         - Date of Birth, PAN, Aadhar, DOB in Words
         - Mobile, Email, ID Type/Number

Step 2:  Address Details
         - Present Address (with CascadingLocationSelect)
         - Permanent Address (with "same as present" toggle)
         - Contact Information (Office Phone, Residence, Mobile, Alternative)

Step 3:  Occupation & Business
         - Occupation, Office Address, State/District
         - Crop Protection Location, Area Under Cultivation

Step 4:  Criminal History
         - Dynamic array of criminal records (add/remove)
         - Conviction status, pending cases, FIR details

Step 5:  License History
         - Previous applications, family licenses
         - Safe storage, training details

Step 6:  License Details
         - Need for license, weapon category, weapon selection
         - Area of validity, ammunition description
         - Special considerations, Form IV details

Step 7:  Biometric Information
         - Signature, Iris scan, Photograph

Step 8:  Documents Upload
         - Aadhar Card, Address Proof, Photograph, PAN Card
         - Character Certificate, Medical Certificate, Training Certificate
         - Other State License

Step 9:  Preview & Declaration
         - Review all entered data
         - Agree to truth declaration, legal consequences, terms
```

### 8.2 Form Data Flow

```
State: FormData interface (comprehensive, 100+ fields)
Storage:
  - Draft: localStorage('alms-license-draft') — auto-save, auto-restore on mount
  - Test data: "Fill Test Data" button populates all fields
Validation:
  - Per-step validation (validateCurrentStep)
  - Full validation on submit (validateAllStepsForSubmission)
API Submission:
  1. Upload files → get base64 URLs (with aggressive compression for 413 avoidance)
  2. Build payload via createPayload()
  3. POST to /application-form
  4. Handle 413 → retry without files
  5. On success → call parent onSubmit with acknowledgement info
```

### 8.3 Renewal Form

- **Trigger**: ZS user clicks "Create Form" → "Renewal"
- **Lookup**: Enter approved Fresh Application ID
- **Validation**: Checks workflow status is APPROVED or has APPROVED history
- **Redirect**: `/forms/renewal?applicationId={id}`

### 8.4 Form Routes Configuration

```typescript
// src/config/formRoutes.ts
FORM_ROUTES = {
  PERSONAL_INFO: "/forms/createFreshApplication/personal-information",
  ADDRESS_DETAILS: "/forms/createFreshApplication/address-details",
  OCCUPATION_DETAILS: "/forms/createFreshApplication/occupation-business",
  CRIMINAL_HISTORY: "/forms/createFreshApplication/criminal-history",
  LICENSE_HISTORY: "/forms/createFreshApplication/license-history",
  LICENSE_DETAILS: "/forms/createFreshApplication/license-details",
  BIOMETRIC_INFO: "/forms/createFreshApplication/biometric-information",
  DOCUMENTS_UPLOAD: "/forms/createFreshApplication/documents-upload",
  PREVIEW: "/forms/createFreshApplication/preview",
  DECLARATION: "/forms/createFreshApplication/declaration",
};
```

---

## 9. Role-Based Access Control

### 9.1 Roles in the System

| Role Code     | Display Name                     | Type         |
| ------------- | -------------------------------- | ------------ |
| `SUPER_ADMIN` | Super Administrator              | System Admin |
| `ADMIN`       | System Administrator             | System Admin |
| `DCP`         | Deputy Commissioner of Police    | Officer      |
| `ACP`         | Assistant Commissioner of Police | Officer      |
| `CP`          | Commissioner of Police           | Officer      |
| `SHO`         | Station House Officer            | Officer      |
| `ZS`          | Zonal Superintendent             | Officer      |
| `ADO`         | Administrative Officer           | Support      |
| `CADO`        | Chief Administrative Officer     | Support      |
| `AS`          | Arms Superintendent              | Support      |
| `ARMS_SUPDT`  | ARMS Superintendent              | Support      |
| `ARMS_SEAT`   | ARMS Seat                        | Support      |
| `JTCP`        | Joint Commissioner of Police     | Officer      |
| `ACO`         | Assistant Compliance Officer     | Support      |
| `APPLICANT`   | License Applicant                | Citizen      |

### 9.2 Role Configuration (`src/config/roles.ts`)

Each role has:

- **permissions**: Array of permission strings
- **dashboardTitle**: Display name in sidebar header
- **canAccessSettings**: Boolean flag
- **menuItems**: Array of `{ name: string, statusIds?: number[] }`

**Default menu items** are defined in `roleSpecificMenuDefaults` for each role:

| Role            | Menu Items                                                                                        |
| --------------- | ------------------------------------------------------------------------------------------------- |
| **ZS**          | freshform, inbox (statusIds: [1,9]), sent, closed, drafts, finaldisposal, analytics, applications |
| **SHO**         | inbox (statusIds: [1,9]), sent                                                                    |
| **ACP**         | inbox (statusIds: [1,9]), sent                                                                    |
| **DCP**         | inbox (statusIds: [1,9,11]), sent                                                                 |
| **AS**          | inbox (statusIds: [1,9]), sent                                                                    |
| **ADO**         | inbox (statusIds: [1,9]), sent                                                                    |
| **CADO**        | inbox (statusIds: [1,9,11]), sent                                                                 |
| **JTCP**        | inbox (statusIds: [1,9,11]), sent, analytics                                                      |
| **CP**          | inbox (statusIds: [1,9,11]), sent, analytics                                                      |
| **ARMS_SUPDT**  | inbox (statusIds: [1,9]), sent                                                                    |
| **ARMS_SEAT**   | inbox (statusIds: [1,9]), sent                                                                    |
| **ACO**         | inbox (statusIds: [1,9]), sent                                                                    |
| **ADMIN**       | User Management, Role Management, Analytics, Flow Mapping, Locations Management                   |
| **SUPER_ADMIN** | Same as ADMIN but under `/superAdmin/` routes                                                     |

### 9.3 Status ID Mapping (`src/config/statusMap.ts`)

Maps menu keys to backend numeric status IDs:

| Key                          | Status IDs    | Description                  |
| ---------------------------- | ------------- | ---------------------------- |
| `forwarded`                  | [1, 9, 3, 11] | FORWARD + INITIATE           |
| `returned`                   | [2, 13]       | REJECT (treated as returned) |
| `redflagged`                 | [8]           | RED_FLAG                     |
| `disposed` / `finaldisposal` | [7]           | DISPOSE                      |
| `approved`                   | [11, 3]       | RECOMMEND + APPROVED         |
| `freshform`                  | [9]           | INITIATE                     |
| `closed`                     | [10]          | CLOSE                        |
| `cancelled`                  | [4]           | CANCEL                       |
| `reEnquiry`                  | [5]           | RE_ENQUIRY                   |
| `groundReport`               | [6]           | GROUND_REPORT                |
| `drafts`                     | [12]          | DRAFTS                       |

### 9.4 Role Hierarchy (`src/utils/roleUtils.ts`)

```typescript
SHO → [ACP, ZS]
ACP → [DCP, ZS, SHO]
ZS → [ACP, DCP, ARMS_SUPDT]
DCP → [ZS, ACP, CP, JTCP, ARMS_SUPDT]
JTCP → [CP, CADO]
CP → [JTCP]
CADO → [JTCP, CP]
AS → [ADO, DCP]
ARMS_SUPDT → [ARMS_SEAT, DCP]
ARMS_SEAT → [ADO, ARMS_SUPDT]
ADO → [CADO, ARMS_SUPDT]
ADMIN → [All officer roles]
SUPER_ADMIN → [All roles including ADMIN]
```

### 9.5 Role-Based Actions

**File:** `src/utils/roleUtils.ts` — `getRoleBasedActions()`

Defines available actions per role:
| Role | Actions |
|---|---|
| **DCP** | approve, reject, recommend, not-recommend, return, flag, re-enquiry, dispose |
| **JTCP** | recommend, not-recommend, return, flag, re-enquiry |
| **ACP** | approve, reject, recommend, not-recommend, return, flag, re-enquiry |
| **ZS** | approve, reject, recommend, not-recommend, return, flag, re-enquiry |
| **SHO** | approve (enquiry), reject (enquiry), recommend, not-recommend, return, flag, re-enquiry |
| **ADMIN** | approve, reject, recommend, not-recommend, return, flag, re-enquiry |
| **SUPER_ADMIN** | approve, reject, recommend, not-recommend, return, flag, re-enquiry, dispose |

---

## 10. Hooks & Utilities

### 10.1 Custom Hooks

#### `useAuth()` (`src/hooks/useAuth.ts`)

Reads auth state from Redux store via selectors:

```typescript
const {
  user,
  userRole,
  userName,
  userId,
  token,
  isAuthenticated,
  isLoading,
  initialized,
} = useAuth();
```

#### `useSidebarCounts()` (`src/hooks/useSidebarCounts.ts`)

- Fetches application counts for sidebar badges
- 2-minute throttle between fetches
- Returns: `{ applicationCounts, loading, error, refreshCounts, lastFetch }`

### 10.2 Utility Functions

| File                    | Key Exports                                                                                                              | Purpose                         |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------ | ------------------------------- |
| `roleUtils.ts`          | `normalizeRole()`, `isAdminRole()`, `isRoleIn()`, `getRoleHierarchy()`, `getRoleDisplayNames()`, `getRoleBasedActions()` | Role normalization and checks   |
| `authCookies.ts`        | `getAuthTokenFromCookie()`, `getUserFromCookie()`, `isAuthCookieValid()`                                                 | Cookie-based auth               |
| `applicationMapper.ts`  | `mapAPIApplicationToTableData()`                                                                                         | API → ApplicationData transform |
| `apiUtils.ts`           | `fetchNextUsers()`, `fetchUsers()`, `fetchUsersByRoles()`                                                                | User fetching                   |
| `navigationUtils.ts`    | `navigateToDefaultMenu()`, `getDefaultMenuItemForRole()`                                                                 | Post-login navigation           |
| `icons.tsx`             | CheckIcon, ForwardIcon, RejectIcon, ReturnIcon, FlagIcon, DisposeIcon, ReviewIcon, PendingIcon                           | SVG icon components             |
| `stringUtils.ts`        | `capitalieWords()`                                                                                                       | String formatting               |
| `imageCompress.ts`      | Image compression utilities                                                                                              | Client-side image compression   |
| `formDataLoader.ts`     | Form data loading helpers                                                                                                | Load form state from API        |
| `adminPagePreloader.ts` | `preloadAdminPages()`                                                                                                    | Prefetch admin pages            |
| `loggingUtils.ts`       | Logging utilities                                                                                                        | Debug logging helpers           |
| `renewalFileUpload.ts`  | Renewal file upload                                                                                                      | Renewal-specific upload logic   |

---

## 11. Type System

### 11.1 Core Types (`src/types/index.ts`)

```typescript
// User
interface User {
  id;
  name;
  username;
  email;
  role;
  designation;
  createdAt;
  lastLogin;
  permissions;
  availableActions;
  location;
}

// Auth State
interface AuthState {
  isAuthenticated;
  user;
  token;
  loading;
  error;
}

// Application Data (comprehensive — 100+ fields)
interface ApplicationData {
  id;
  acknowledgementNo;
  firstName;
  lastName;
  applicantName;
  applicantMobile;
  applicantEmail;
  fatherName;
  sex;
  dob;
  aadharNumber;
  panNumber;
  placeOfBirth;
  presentAddress;
  permanentAddress;
  occupationAndBusiness;
  status;
  status_id;
  workflowStatus;
  currentUser;
  previousUser;
  applicationType;
  applicationDate;
  documents;
  biometricData;
  history;
  workflowHistories;
  criminalHistories;
  licenseHistories;
  licenseDetails;
  actions: {
    canForward;
    canApprove;
    canReject;
    canRaiseRedflag;
    canReturn;
    canDispose;
  }; // 7 boolean flags
  usersInHierarchy; // Array of { id, username, roleId, locationIds }
}

// Workflow
interface WorkflowHistory {
  id;
  applicationId;
  previousUserId;
  nextUserId;
  actionTaken;
  remarks;
  attachments;
  actiones;
}
interface WorkflowActiones {
  id;
  code;
  name;
  description;
  isActive;
}

// Application Status
type ApplicationStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "returned"
  | "red-flagged"
  | "disposed"
  | "initiated"
  | "cancelled"
  | "re-enquiry"
  | "ground-report"
  | "closed"
  | "recommended"
  | "under_review"
  | "forwarded"
  | "final_disposal"
  | "sent";

// Location
interface LocationOption {
  id: number;
  name: string;
}
interface State extends LocationOption {
  districts;
}
interface District extends LocationOption {
  stateId;
  zones;
}
interface Zone extends LocationOption {
  districtId;
  divisions;
}
interface Division extends LocationOption {
  zoneId;
  stations;
}
interface PoliceStation extends LocationOption {
  divisionId;
}

// User Role
type UserRole =
  | "ADMIN"
  | "DCP"
  | "ACP"
  | "CP"
  | "ARMS_SUPDT"
  | "SHO"
  | "ZS"
  | "APPLICANT"
  | "ADO"
  | "CADO"
  | "AS"
  | "ARMS_SEAT"
  | "JTCP";
```

### 11.2 API Types (`src/types/api.ts`)

```typescript
interface ApiResponse<T> {
  success;
  message?;
  data;
  error?;
}
interface APIApplication {
  id;
  acknowledgementNo;
  firstName;
  lastName;
  status;
  createdAt;
  applicationType;
}
interface ApplicationQueryParams {
  statusIds?;
  page?;
  limit?;
  search?;
  isSent?;
}
```

---

## 12. Middleware & Security

### 12.1 Edge Middleware (`proxy.ts`)

Runs on all non-static, non-API routes. Handles:

- **Auth cookie parsing**: Raw JWT, JSON-wrapped, or standard cookie
- **Role extraction**: From auth cookie, role cookie, or user cookie
- **Route protection**: Public vs protected vs admin routes
- **Redirect logic**: Unauthenticated → `/login`; wrong role → `/`; no role → `/login?error=no_role`
- **Admin route guard**: Only ADMIN role can access `/admin/*`
- **Role-specific access**: Reports route restricted to DCP, ACP, CP, ADMIN

### 12.2 Security Headers (next.config.js)

```javascript
headers: [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];
```

### 12.3 401 Handling

**Axios response interceptor**: On 401 from any non-login request:

1. Clears `auth`, `user`, `role` cookies
2. Redirects to `/login`

**AuthenticatedApiClient**: Each method (get/post/put/delete) catches auth errors and calls `redirectToLogin()`.

---

## 13. Data Flow Patterns

### 13.1 Application Listing Flow

```
User clicks inbox sub-item (e.g., "Forwarded")
  → Sidebar.handleInboxSubItemClick('forwarded')
    → freezeActive(2500ms)
    → setActiveItem('inbox-forwarded')
    → dispatch(openInbox())
    → loadType('forwarded', forceReload, customStatusIds)
      → InboxContext
        → fetchApplicationsByStatusKey('forwarded', customStatusIds)
          → ApplicationApi.getAll({ statusIds: '1,9,3,11' })
            → GET /application-form?statusIds=1,9,3,11
          → Transform API response → ApplicationData[]
        → setApplications(transformedData)
    → router.push('/inbox?type=forwarded')
  → InboxLayout renders with new data
```

### 13.2 Application Detail Flow

```
User clicks application row
  → Navigate to /application/{id}
  → ApplicationDataLoader mounts
    → getApplicationByApplicationId(id)
      → ApplicationApi.getById(id)
      → transformDetailedToApplicationData(detailedApp)
    → Render detail view with all sections
```

### 13.3 Form Submission Flow

```
ZS user fills fresh application form (9 steps)
  → Click Submit on Declaration step
  → validateAllStepsForSubmission()
  → uploadFilesAndGetUrls() — compress images, get base64
  → createPayload() — build nested API payload
  → ApplicationApi.create(payload) — POST /application-form
  → Handle 413 → retry without files
  → On success → show acknowledgement number
  → Clear local storage draft
```

### 13.4 Workflow Action Flow

```
Officer processes application
  → Opens ProcessApplicationModal / ForwardApplicationModal
  → Selects action (approve/reject/forward/return/flag/re-enquiry)
  → For forward: selects next user from usersInHierarchy
  → Submits action
  → API call: POST /applications/{id}/forward or UPDATE status
  → On success: refresh inbox data
  → InboxContext.loadType(currentType, true) — force reload
```

---

## 14. Developer Guide

### 14.1 Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Environment variables (create .env.local)
NEXT_PUBLIC_API_URL=http://localhost:3001/api
BACKEND_URL=http://localhost:3001

# Start development server (port 5000)
npm run dev
```

### 14.2 Available Scripts

| Script          | Command                   | Description                    |
| --------------- | ------------------------- | ------------------------------ |
| `dev`           | `next dev`                | Development server (port 5000) |
| `build`         | `next build`              | Production build               |
| `build:analyze` | `ANALYZE=true next build` | Bundle analysis                |
| `start`         | `next start`              | Production server              |
| `lint`          | `eslint .`                | Lint check                     |
| `lint:fix`      | `eslint . --fix`          | Lint auto-fix                  |
| `format`        | `prettier --write .`      | Format code                    |
| `format:check`  | `prettier --check .`      | Check formatting               |
| `type-check`    | `tsc --noEmit`            | TypeScript check               |
| `test`          | `jest`                    | Run tests                      |
| `test:watch`    | `jest --watch`            | Watch mode tests               |
| `test:coverage` | `jest --coverage`         | Test coverage                  |
| `code-quality`  | All quality checks        | Combined lint + format + types |

### 14.3 Environment Variables

| Variable              | Default                 | Purpose                  |
| --------------------- | ----------------------- | ------------------------ |
| `NEXT_PUBLIC_API_URL` | `/api`                  | Backend API base URL     |
| `BACKEND_URL`         | `http://localhost:3001` | Backend URL for rewrites |
| `PORT`                | `5000`                  | Dev server port          |

### 14.4 Build & Deployment

```bash
# Production build (standalone output)
npm run build

# Output: .next/standalone/
# Includes: compiled app, static files, package.json

# Deployment (Docker)
# Uses Dockerfile.prod with standalone output

# Next.js config optimizations:
# - Bundle analyzer support
# - Webpack chunk splitting (vendor, mantine, charts)
# - Image optimization (webp, avif)
# - React strict mode
# - SWC transforms for speed
```

### 14.5 Adding a New Page

1. Add route directory in `src/app/` (e.g., `src/app/admin/new-feature/page.tsx`)
2. Mark as `"use client"` if using hooks or browser APIs
3. Add menu item to role config in `src/config/roles.ts`
4. For admin pages, add to `ADMIN_MENU_ITEMS` in `src/config/adminMenuService.ts`
5. Add redirect in `src/config/roleRedirections.ts` if needed
6. Add auth guard in layout if needed

### 14.6 Adding a New API Call

1. Add endpoint constant in `src/config/APIsEndpoints.ts`
2. Add method to appropriate client class in `src/config/APIClient.ts`
3. For complex transforms, add service in `src/services/`
4. Add types in `src/types/` if needed

### 14.7 Key Conventions

- **File naming**: PascalCase for components, camelCase for utilities
- **CSS**: Tailwind utility classes preferred, custom CSS in `styles/` only for complex needs
- **State**: Redux for global auth/UI, Context for feature-specific state, local state for component-only
- **API calls**: Through APIClient or domain services (sidebarApiCalls.ts), not raw axios
- **Forms**: Use controlled components with `name` attribute and centralized `handleChange`
- **Error handling**: API errors captured in `apiError` state + toast notifications
- **Loading states**: Skeleton components for initial load, spinners for actions
- **Type safety**: Use TypeScript interfaces for all data structures

---

## Appendices

### A. API Endpoint Summary

| Endpoint                               | Method | Auth | Service                 | Purpose                |
| -------------------------------------- | ------ | ---- | ----------------------- | ---------------------- |
| `/auth/login`                          | POST   | No   | AuthApi                 | User login             |
| `/auth/me`                             | GET    | Yes  | AuthApi                 | Current user           |
| `/auth/getMe`                          | GET    | Yes  | AuthApi                 | Minimal user           |
| `/auth/logout`                         | POST   | Yes  | AuthApi                 | Logout                 |
| `/auth/change-password`                | POST   | Yes  | AuthApi                 | Change password        |
| `/application-form`                    | GET    | Yes  | ApplicationApi          | List applications      |
| `/application-form`                    | POST   | Yes  | ApplicationApi          | Create application     |
| `/application-form?applicationId={id}` | PATCH  | Yes  | ApplicationService      | Update application     |
| `/applications/{id}/status`            | PUT    | Yes  | ApplicationApi          | Update status          |
| `/applications/{id}/forward`           | POST   | Yes  | ApplicationApi          | Forward application    |
| `/applications/batch`                  | POST   | Yes  | ApplicationApi          | Batch process          |
| `/application-form/application/{id}`   | DELETE | Yes  | ApplicationApi          | Delete                 |
| `/users`                               | GET    | Yes  | UserApi                 | List users by role     |
| `/users/next`                          | GET    | Yes  | apiUtils                | Next users for forward |
| `/locations/states`                    | GET    | Yes  | CascadingLocationSelect | States list            |
| `/locations/districts`                 | GET    | Yes  | CascadingLocationSelect | Districts by state     |
| `/locations/zones`                     | GET    | Yes  | CascadingLocationSelect | Zones by district      |
| `/locations/divisions`                 | GET    | Yes  | CascadingLocationSelect | Divisions by zone      |
| `/locations/police-stations`           | GET    | Yes  | CascadingLocationSelect | Police stations        |
| `/qrcode/generate/{id}`                | GET    | Yes  | QRCodeApi               | Generate QR            |
| `/qrcode/check/{id}`                   | GET    | Yes  | QRCodeApi               | Check QR permission    |
| `/public/application/{id}`             | GET    | No   | PublicApi               | Public app details     |
| `/Weapons`                             | GET    | Yes  | WeaponsService          | Weapons list           |

### B. Key Data Transformations

**API → ApplicationData** (in `sidebarApiCalls.ts`):

- `transformApiApplicationToApplicationData()` — For list endpoints
- `transformDetailedToApplicationData()` — For single application GET

**FormData → API Payload** (in `ApplicationService`):

- `preparePayload()` — Section-specific transforms for personal, address, occupation, criminal, license-history, license-details

### C. Cache Strategy

| Cache              | Location                   | TTL                     | Purpose                  |
| ------------------ | -------------------------- | ----------------------- | ------------------------ |
| In-memory          | `sidebarApiCalls.ts` (Map) | 30s                     | Application list fetches |
| Application counts | `sidebarApiCalls.ts`       | 5 min                   | Sidebar badge counts     |
| localStorage       | `ApplicationContext`       | Persistent              | Application list         |
| localStorage       | `FreshApplicationForm`     | Persistent              | Form draft               |
| React Query        | `RootProviders`            | 5 min stale / 10 min GC | Server state             |

### D. ZS-Specific Features

- **"Create Form" button** in header — only visible for ZS role
- **Fresh Application**: Navigates to `/forms/createFreshApplication/personal-information`
- **Renewal**: Opens modal, validates approved fresh application, redirects to `/forms/renewal`
- **QR Code generation**: ZS-only permission via `/qrcode/generate/{id}`
- **Fresh Form menu item**: Default first menu item for ZS
- **Ownership filter**: `isOwned=true` param added to application list calls for ZS

---

_Generated: June 2026 | ALMS Frontend v1.0_
