Frontend Login Implementation — ALMS

Overview
--------
This document describes how the frontend implements user login for ALMS and how the application sidebar reacts to authentication state and user roles.

Assumptions
-----------
- Frontend is a React/Next.js application (project contains `next.config.ts`).
- Backend exposes authentication endpoints (login, refresh, current-user) and returns an auth token (JWT or similar) and optionally a refresh token.
- App uses a central client (fetch/axios) and a client-side store (React Context, Redux, or Zustand).

Contract (what the frontend implements)
--------------------------------------
- Inputs: user credentials (email/username + password).
- Outputs: authenticated user context (id, name, roles), auth token stored securely, navigation to protected routes.
- Error modes: invalid credentials (422/401), network errors, expired refresh token.

High-level flow
---------------
1. User fills the login form and submits credentials.
2. Frontend calls POST /auth/login (or configured endpoint) with credentials.
3. On success: backend returns access token and user profile or an endpoint for fetching current user.
4. Frontend stores the token using the chosen strategy (HTTP-only cookie when possible; otherwise secure in-memory + fallback storage).
5. Frontend updates the user store and redirects to the default post-login route.
6. Sidebar listens to auth state and updates items visible based on roles and permissions.

Components and files (typical)
-----------------------------
- LoginForm component — collects credentials and shows validation errors.
- authService (src/services/auth.ts) — handles API calls (login, logout, refresh, getCurrentUser).
- authStore / AuthContext — stores user and token, exposes login/logout/refresh actions.
- Route guards / middleware — protects pages and redirects unauthorized users to login.
- Sidebar component — reads auth store and role-permissions mapping to render menu items.

Token storage and security
--------------------------
- Preferred: backend sets HTTP-only secure cookie on login. Frontend only triggers login and relies on cookie being present for auth requests.
- If cookie is not used, store access token in memory and refresh token in a secure, short-lived storage or HTTP-only cookie. Avoid localStorage for access tokens when possible.
- Always send tokens over HTTPS and include CSRF protections if using cookies.

Auth state management
---------------------
- On app start, attempt to restore session by calling `GET /auth/me` or similar to fetch current user. If it succeeds, mark user as authenticated.
- Expose convenience hooks like `useAuth()` to get user, isAuthenticated, and helpers (login, logout).

Sidebar behavior (how it works)
------------------------------
- Sidebar subscribes to the auth store (or uses `useAuth()` hook).
- It evaluates which menu sections and links are visible using a role-permissions map (for example: {
  admin: ['users','settings'],
  officer: ['applications','locations']
}).
- When user logs in: auth store updates, Sidebar re-renders and shows permitted items. If the current page is no longer permitted, router redirects to an allowed page.
- When user logs out or session expires: Sidebar hides protected items and shows public links (login/help). If the user was on a protected route, redirect to `/login`.

Routing and guards
------------------
- Protect routes at the page-level (Next.js middleware or HOC) by checking `isAuthenticated` and `hasPermission` before rendering.
- For SSR pages, perform server-side session checks and redirect as needed.

Error handling and UX
---------------------
- Show inline validation errors for bad credentials.
- Show a global banner for network or server errors.
- If refresh fails, force logout and show a message explaining re-login is required.

Edge cases
----------
- Token expires while user is active — use a refresh flow and retry the original request.
- Partial login (token but no profile) — fetch user profile immediately after login.
- Role changes mid-session — re-fetch permissions on critical actions or when notified by backend events.

Tests (minimal suggestions)
--------------------------
- Unit: LoginForm validation and authService success/failure flows (mock fetch/axios).
- Integration: full login flow using a mocked API or test backend; assert auth store updates and sidebar shows correct items.

Files to review / update
------------------------
- src/components/LoginForm.tsx
- src/services/auth.ts
- src/context/AuthContext.tsx or src/store/authSlice.ts
- src/components/Sidebar.tsx
- middleware/routeGuard.ts

How to update this doc
----------------------
1. Confirm the exact auth endpoints in backend (`backend/src` or `docs/backend/auth-api.md`).
2. Replace storage recommendations with the actual implementation (cookie vs localStorage) used by the app.

References
----------
- Backend auth API docs: `docs/backend/auth-api.md` (check for exact endpoint names and response shapes).

Status
------
- New file created here to be the canonical frontend login doc. Other markdown files under `frontend/` were removed to avoid duplication; keep `docs/frontend/document.md` if you want to preserve a broader frontend guide.

## Workflow Overview

The ALMS frontend is a React-based application built with Next.js. It provides a role-based navigation system and dynamic user interactions. Here's an overview of the workflow:

1. **Navigation**:
   - The `Sidebar` and `Navbar` components handle navigation.
   - Role-based redirection ensures users are directed to appropriate sections based on their roles (e.g., Admins to the dashboard, DCP/ACP to reports).

2. **User Interactions**:
   - Users interact with forms, tables, and modals for tasks like managing applications, viewing reports, and updating settings.
   - Components like `ApplicationTable` and `BatchProcessingModal` provide dynamic and interactive UI elements.

3. **Data Flow**:
   - The application uses Redux for state management (`authSlice` for authentication state).
   - API calls fetch data (e.g., user details, application data) and update the Redux store.
   - Components subscribe to the store to reflect real-time updates.

---

## API Integration

### APIs Used
- **Authentication API**:
  - Endpoint: `/auth`
  - Used in `Login` and `AuthInitializer` components to manage user sessions.
  - Returns tokens and user details.

- **User Management API**:
  - Endpoint: `/users`
  - Used in `AdminUserManagement` to fetch and manage user data.
  - Returns a list of users with details like `id`, `username`, `role`, etc.

- **Application API**:
  - Endpoint: `/applications`
  - Used in `ApplicationDetailPage` and `InboxPage` to fetch application data.
  - Returns application details like `id`, `status`, `createdAt`, etc.

### API Call Locations
- `src/config/APIClient.ts`: Centralized API client configuration.
- `src/pages/admin/user-management.tsx`: Example of API usage for fetching user data.

---

## Login Handling

### Authentication Flow
1. **Startup**:
   - `AuthInitializer` restores authentication state from cookies or local storage.
   - If no valid session is found, users are redirected to `/login`.

2. **Login**:
   - The `Login` page dispatches the `setCredentials` action upon successful login.
   - Tokens are stored in cookies for session persistence.

3. **Session Management**:
   - Middleware (`src/middleware.ts`) protects routes by checking authentication status.
   - Role-based redirection is handled using `getRoleBasedRedirectPath` in `roleRedirections.ts`.

---

## Data Pattern

### Data Structures
- **User Data**:
  ```typescript
  interface User {
    id: string;
    username: string;
    officeName: string;
    phoneNo: string;
    role: {
      id: number;
      name: string;
    };
    createdAt: string;
  }
  ```

- **Application Data**:
  ```typescript
  interface ApplicationData {
    id: string;
    status: string;
    createdAt: string;
    updatedAt: string;
  }
  ```

- **Redux State**:
  - `authSlice` manages authentication state:
    ```typescript
    interface AuthState {
      user: User | null;
      token: string | null;
      isAuthenticated: boolean;
      loading: boolean;
      error: string | null;
    }
    ```

---

## Folder Structure

### Overview
```
src/
├── app/                # Next.js app directory for routing and layouts
├── components/         # Reusable React components
├── config/             # Configuration files (e.g., API client, auth logic)
├── context/            # React context for global state
├── hooks/              # Custom React hooks
├── pages/              # Next.js pages for routing
├── store/              # Redux store and slices
├── styles/             # Global and component-specific styles
├── tasks/              # Documentation and implementation guides
```

### Key Folders and Files
- **`src/app/`**:
  - Contains route-specific components (e.g., `login`, `settings`, `inbox`).
  - `layout.tsx`: Root layout for the application.

- **`src/components/`**:
  - `Sidebar.tsx`: Handles navigation.
  - `ApplicationTable.tsx`: Displays user or application data in a table format.

- **`src/config/`**:
  - `APIClient.ts`: Centralized API client configuration.
  - `roleRedirections.ts`: Logic for role-based redirection.

- **`src/store/`**:
  - `authSlice.ts`: Redux slice for authentication state.

- **`styles/`**:
  - `globals.css`: Global styles for the application.

- **`tasks/`**:
  - Contains markdown files documenting implementation details (e.g., `role-based-redirection-guide.md`).

---

This documentation should provide a comprehensive understanding of the ALMS frontend for new developers or contributors. Let me know if you need further details!
