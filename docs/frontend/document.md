Front-end Login Implementation — ALMS

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
- `LoginForm` component — collects credentials and shows validation errors.
- `authService` (e.g. `src/services/auth.ts`) — handles API calls (login, logout, refresh, getCurrentUser).
- `authStore` / `AuthContext` — stores user and token, exposes login/logout/refresh actions.
- Route guards / middleware — protects pages and redirects unauthorized users to login.
- `Sidebar` component — reads auth store and role-permissions mapping to render menu items.

Token storage and security
--------------------------
- Preferred: backend sets HTTP-only secure cookie on login. Frontend only triggers login and relies on cookie being present for auth requests.
- If cookie is not used, store access token in memory and refresh token in a secure, short-lived storage or HTTP-only cookie. Avoid localStorage for access tokens when possible.
- Always send tokens over HTTPS and include CSRF protections if using cookies.

Auth state management
---------------------
- On app start, attempt to restore session by calling `GET /auth/me` or similar to fetch current user. If it succeeds, mark user as authenticated.
- Expose convenience hooks like `useAuth()` to get user, `isAuthenticated`, and helpers (`login`, `logout`).

Sidebar behavior (how it works)
------------------------------
- Sidebar subscribes to the auth store (or uses `useAuth()` hook).
- It evaluates which menu sections and links are visible using a role-permissions map (for example: `{
  admin: ['users','settings'],
  officer: ['applications','locations']
}`).
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
- Unit: `LoginForm` validation and `authService` success/failure flows (mock fetch/axios).
- Integration: full login flow using a mocked API or test backend; assert auth store updates and sidebar shows correct items.

Files to review / update
------------------------
- `src/components/LoginForm.tsx`
- `src/services/auth.ts`
- `src/context/AuthContext.tsx` or `src/store/authSlice.ts`
- `src/components/Sidebar.tsx`
- `middleware/routeGuard.ts`

How to update this doc
----------------------
1. Confirm the exact auth endpoints in backend (`backend/src` or `docs/backend/auth-api.md`).
2. Replace storage recommendations with the actual implementation (cookie vs localStorage) used by the app.

References
----------
- Backend auth API docs: `docs/backend/auth-api.md` (check for exact endpoint names and response shapes).

Status
------
- Canonical frontend login doc created here. Other markdown files under `frontend/` should be removed to avoid duplication.
## Frontend Login Implementation

This document describes the frontend implementation of the ALMS login flow: components, API interactions, data shapes, error handling, and testing steps.

### Summary / Purpose

Provide a single, concise reference for how the frontend performs login so engineers can integrate, debug, and maintain authentication behavior.

### High-level flow

1. User opens the login page (`/login`) and submits credentials (email/username + password).
2. Frontend sends a request to the backend login endpoint (POST /auth/login) with JSON payload.
3. Backend returns an authentication response (session cookie or JSON token + user info). Frontend stores token (if applicable) and sets client state.
4. Frontend fetches current user (`GET /auth/me` or `GET /users/current`) to hydrate user profile and permissions.
5. Frontend redirects to the appropriate route based on role and intended destination.

### Endpoints used

- POST /auth/login
  - Request body: { "username"|"email": string, "password": string }
  - Success response: 200 with { user: { id, name, roles, ... }, token?: string } or sets HttpOnly session cookie
  - Error responses: 401 (invalid credentials), 429 (rate limited), 500 (server error)

- GET /auth/me
  - Returns authenticated user's profile and permissions

### Frontend responsibilities

- Validate inputs client-side (non-empty, email format if applicable).
- Show loading and disable submit during requests.
- Handle and display server errors: invalid credentials, account locked, rate limits.
- Persist authentication state:
  - Preferred: rely on HttpOnly cookies set by backend (safer).
  - If using JWTs: store in in-memory state and optionally in secure storage (avoid localStorage if possible). Refresh tokens should be stored in HttpOnly cookies.
- After login, call the user profile endpoint to fetch roles and permissions.
- Route guarding: protect pages by checking authentication and authorization; redirect unauthenticated users to `/login` and preserve return path.

### UI components and responsibilities

- LoginForm component
  - Props: onSuccess callback
  - State: email, password, loading, error
  - Actions: submit -> call API client

- AuthProvider (context)
  - Holds current user, token (if used), and auth helper methods (login, logout, refresh, isAuthorized)

- PrivateRoute / route guard
  - Checks auth context; if not authenticated, redirects to `/login?next=<orig>`

### Data shapes

- Login request: { email?: string, username?: string, password: string }
- Login response (example):
  {
    "user": { "id": "uuid", "name": "...", "roles": ["admin","user"] },
    "token": "ey..." // optional, if not using cookies
  }

### Error handling and UX

- Map backend errors to user-friendly messages:
  - 401 -> "Invalid username or password"
  - 403 -> "Account disabled"
  - 429 -> "Too many attempts, try again later"
  - 500 -> "Server error — please try again"
- Display inline field errors when provided by API.

### Security notes

- Prefer HttpOnly, Secure cookies for session tokens to mitigate XSS.
- Use CSRF protection if relying on cookies.
- Never expose raw tokens to third-party scripts.

### Edge cases

- Network failures: show retry option.
- Concurrent login attempts: ensure component prevents duplicate submissions.
- Password reset / account lock flows should be linked from login page.

### Testing & verification

1. Manual: set up a local backend and attempt login with valid and invalid credentials; verify cookie or token storage and redirection.
2. Unit tests: LoginForm validation (empty fields, email format). Mock API responses for success and common errors.
3. E2E tests: simulate full login flow and access to protected pages. Verify unauthorized users are redirected.

### Quick integration checklist for engineers

- Ensure API URL and environment variables are set.
- Wire AuthProvider at the app root and call `authProvider.login()` from LoginForm.
- Implement PrivateRoute and add to routing config.
- Add links for "Forgot password" and account help.

### Where to look in the repo

- Frontend auth components: `src/components/auth/` (or similar in your frontend source)
- API client: `src/lib/api` or `src/services/auth.ts`
- Route guards: `src/routes/PrivateRoute.tsx` or router middleware

If you want, I can also generate a small example LoginForm and AuthProvider adapted to this repo's frontend stack—tell me the frontend framework (Next.js / React / Vite) used in this project and I'll scaffold it.
