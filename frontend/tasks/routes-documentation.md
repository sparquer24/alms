# ALMS Routes Documentation

## Overview
This document provides a comprehensive overview of all routes in the Arms License Management System (ALMS) frontend application, their authentication requirements, and role-based access controls.

## Authentication Flow
1. App starts with `AuthInitializer` restoring auth state from cookies
2. Routes are protected by Next.js middleware (`src/middleware.ts`)
3. Components use `useAuthSync` hook for unified auth state
4. Automatic redirections based on authentication status

## Route Categories

### 🔓 Public Routes (No Authentication Required)
These routes are accessible without authentication:

| Route | File Location | Description |
|-------|---------------|-------------|
| `/login` | `src/app/login/page.tsx` | User login page |
| `/reset-password` | `src/app/reset-password/page.tsx` | Password reset page |

**Behavior:** 
- If authenticated user visits these routes, they are redirected to `/`
- Handled by middleware and PublicRoute component

### 🔒 Protected Routes (Authentication Required)

#### Main Application Routes
| Route | File Location | Description | Additional Notes |
|-------|---------------|-------------|------------------|
| `/` | `src/app/page.tsx` | Main dashboard | Entry point after login |
| `/freshform` | `src/app/freshform/page.tsx` | Fresh application form | Create new applications |
| `/application/[id]` | `src/app/application/[id]/page.tsx` | Application details | Dynamic route for specific applications |
| `/sent` | `src/app/sent/page.tsx` | Sent applications | User's submitted applications |
| `/inbox/[type]` | `src/app/inbox/[type]/page.tsx` | Inbox with types | Dynamic route for different inbox types |
| `/notifications` | `src/app/notifications/page.tsx` | Notifications | User notifications |
| `/settings` | `src/app/settings/page.tsx` | User settings | Profile and preferences |
| `/final` | `src/app/final/page.tsx` | Final processing | **Role-restricted** |

#### Role-Based Protected Routes
These routes have additional role-based access control:

| Route | Required Roles | Description |
|-------|----------------|-------------|
| `/reports` | DCP, ACP, CP, ADMIN | Reports and analytics |
| `/final` | DCP, CP, ADMIN, ARMS_SUPDT | Final application processing |

### 👨‍💼 Admin Routes (Admin Authentication Required)
These routes require separate admin authentication:

| Route | File Location | Description |
|-------|---------------|-------------|
| `/admin/login` | `src/app/admin/login/page.tsx` | Admin login |
| `/admin/users` | `src/app/admin/users/page.tsx` | User management |
| `/admin/locations` | `src/app/admin/locations/page.tsx` | Location management |
| `/admin/forwarding` | `src/app/admin/forwarding/page.tsx` | Forwarding settings |
| `/admin/reports` | `src/app/admin/reports/page.tsx` | Admin reports |

## Route Protection Implementation

### Middleware Protection (`src/middleware.ts`)
```typescript
// Protected routes array
const protectedRoutes = [
  '/freshform',
  '/application',
  '/sent',
  '/inbox',
  '/reports',
  '/settings',
  '/final',
];

// Public routes array
const publicRoutes = [
  '/login',
  '/reset-password',
];

// Role-based access control
const roleBasedAccess = {
  '/reports': ['DCP', 'ACP', 'CP', 'ADMIN'],
  '/final': ['DCP', 'CP', 'ADMIN', 'ARMS_SUPDT'],
};
```

### Component-Level Protection
- **ProtectedRoute**: Wraps components requiring authentication
- **PublicRoute**: Wraps public components (redirects if authenticated)
- **useAuthSync**: Hook providing unified auth state

## User Roles and Permissions

### Available Roles
1. **DCP** - District Collector of Police
2. **ACP** - Assistant Collector of Police  
3. **CP** - Commissioner of Police
4. **ADMIN** - System Administrator
5. **ARMS_SUPDT** - Arms Superintendent
6. **SHO** - Station House Officer
7. **ZS** - Zonal Supervisor
8. **APPLICANT** - Regular applicant

### Role-Based Route Access Matrix
| Route | APPLICANT | SHO | ZS | ACP | DCP | CP | ADMIN | ARMS_SUPDT |
|-------|-----------|-----|----|----|-----|-------|-------|------------|
| `/` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/freshform` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/application/[id]` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/sent` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/inbox/[type]` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/notifications` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/settings` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/reports` | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ |
| `/final` | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| `/admin/*` | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |

## Cookie Structure
Authentication state is stored in cookies with the following structure:

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user123",
    "name": "John Doe",
    "username": "john.doe",
    "email": "john@example.com",
    "role": "DCP",
    "designation": "District Collector",
    "permissions": ["read:applications", "write:applications"],
    "availableActions": [
      { "action": "approve", "resource": "application" },
      { "action": "reject", "resource": "application" }
    ]
  },
  "isAuthenticated": true,
  "role": "DCP",
  "name": "John Doe"
}
```

## Error Handling and Redirections

### Authentication Errors
- **No auth cookie**: Redirect to `/login`
- **Invalid cookie**: Clear cookie, redirect to `/login`
- **Expired token**: Clear auth state, redirect to `/login`

### Authorization Errors  
- **Insufficient role**: Redirect to `/` (dashboard)
- **Role not found**: Redirect to `/login`

### Route Not Found
- **404 errors**: Handled by Next.js default 404 page

## Development Testing

### Test Credentials
For development/testing purposes:
- **Username**: `dcp_user` | **Password**: `1234` | **Role**: DCP
- **Username**: `acp_user` | **Password**: `1234` | **Role**: ACP  
- **Username**: `sho_user` | **Password**: `1234` | **Role**: SHO
- **Username**: `zs_user` | **Password**: `1234` | **Role**: ZS
- **Username**: `applicant_user` | **Password**: `1234` | **Role**: APPLICANT

### Testing Route Protection
1. Access protected route without authentication → Should redirect to `/login`
2. Login with appropriate role → Should access route successfully
3. Access route without proper role → Should redirect to `/`
4. Access public route while authenticated → Should redirect to `/`

## File Structure Summary
```
src/
├── app/
│   ├── layout.tsx              # Root layout with auth providers
│   ├── page.tsx                # Main dashboard (/)
│   ├── login/page.tsx          # Login page
│   ├── reset-password/page.tsx # Password reset
│   ├── freshform/page.tsx      # Fresh application form
│   ├── application/[id]/       # Application details
│   ├── sent/page.tsx           # Sent applications
│   ├── inbox/[type]/          # Inbox
│   ├── notifications/page.tsx  # Notifications
│   ├── settings/page.tsx       # Settings
│   ├── final/page.tsx          # Final processing
│   ├── reports/page.tsx        # Reports
│   └── admin/                  # Admin routes
├── middleware.ts               # Route protection middleware
├── components/
│   ├── ProtectedRoute.tsx      # Protected route wrapper
│   ├── PublicRoute.tsx         # Public route wrapper
│   └── AuthInitializer.tsx     # Auth state initializer
└── hooks/
    └── useAuthSync.ts          # Auth state hook
```

## Next Steps for Enhancement
1. ✅ Implement proper authentication flow
2. ✅ Add route protection middleware
3. ✅ Create role-based access control
4. 🔄 Add loading states for route transitions
5. ⏳ Implement session timeout handling
6. ⏳ Add audit logging for route access
7. ⏳ Create admin dashboard for route management
