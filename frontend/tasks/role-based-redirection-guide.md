# Role-Based Authentication & Redirection System

## 🎯 Overview

The ALMS system now implements role-based redirections after login and authentication, ensuring users are directed to the most relevant section based on their role and responsibilities.

## 🔄 Role-Based Redirection Logic

### After Login Success
Users are automatically redirected to role-appropriate sections:

| Role | Redirect Path | Reason |
|------|---------------|---------|
| **ADMIN** | `/` | Main dashboard for system overview |
| **DCP/ACP/CP** | `/reports` | High-level officials need reports and analytics |
| **ARMS_SUPDT** | `/final` | Arms Superintendent handles final disposals |
| **SHO/ZS** | `/inbox/forwarded` | Field officers process forwarded applications |
| **APPLICANT** | `/sent` | Applicants check their submitted applications |
| **ADO/CADO** | `/` | Administrative officers use main dashboard |

### Authentication Flow with Role Redirection

```
1. User opens app
   ↓
2. AuthInitializer checks cookies
   ↓
3. If authenticated → Role-based redirect
   If not authenticated → /login
   ↓
4. Login success → Role-based redirect
   Login failure → Stay on login
```

## 🚀 Implementation Details

### Files Modified

#### 1. `src/config/roleRedirections.ts` (NEW)
- **`getRoleBasedRedirectPath(role)`**: Returns appropriate path for each role
- **`getRoleNavigationConfig(role)`**: Returns navigation preferences
- **`shouldRedirectOnStartup(role, currentPath)`**: Determines if redirect is needed

#### 2. `src/app/login/page.tsx`
- Updated to use role-based redirection after successful login
- Imports `getRoleBasedRedirectPath` for post-login routing

#### 3. `src/app/page.tsx` (Main Dashboard)
- Checks if user should be redirected based on role when accessing root
- Allows certain roles to stay on dashboard, redirects others

#### 4. `src/middleware.ts`
- Updated public route handling to use role-based redirects
- Login page redirects authenticated users to role-appropriate paths

#### 5. `src/components/AuthInitializer.tsx`
- Added role-based redirection on app startup
- Handles automatic routing after auth state restoration

### API Response Handling

The system expects these fields from the authentication APIs:

#### Login API (`/api/auth/login`) Response:
```json
{
  "success": true,
  "body": {
    "token": "jwt_token_here"
  }
}
```

#### User Info API (`/api/auth/me`) Response:
```json
{
  "success": true,
  "body": {
    "id": "user123",
    "name": "John Doe",
    "username": "john.doe", 
    "email": "john@example.com",
    "role": "DCP",
    "designation": "District Collector",
    "permissions": ["read:applications", "write:applications"],
    "availableActions": [
      { "action": "approve", "resource": "application" }
    ]
  }
}
```

## 🧪 Testing Role-Based Redirections

### Test Scenarios

1. **DCP User Login**:
   - Login with `dcp_user` / `1234`
   - Should redirect to `/reports`

2. **SHO User Login**:
   - Login with `sho_user` / `1234` 
   - Should redirect to `/inbox/forwarded`

3. **Applicant Login**:
   - Login with `applicant_user` / `1234`
   - Should redirect to `/sent`

4. **Direct Dashboard Access**:
   - Access `/` while authenticated
   - Should redirect based on role (unless role allows dashboard)

5. **Login Page Access While Authenticated**:
   - Access `/login` while logged in
   - Should redirect to role-appropriate page

### Expected Behavior

| User Action | Current Path | Expected Redirect |
|-------------|--------------|-------------------|
| DCP logs in | `/login` | `/reports` |
| SHO accesses root | `/` | `/inbox/forwarded` |
| Applicant on login page | `/login` (authenticated) | `/sent` |
| Admin anywhere | Any public route | `/` (dashboard) |

## 🎯 Benefits

1. **User Experience**: Users land on most relevant section immediately
2. **Role Efficiency**: Each role starts where they work most
3. **Workflow Optimization**: Reduces navigation time
4. **Security**: Role-based access control integrated with routing

## 🔧 Customization

To modify role redirections, update `src/config/roleRedirections.ts`:

```typescript
// Add new role
case 'NEW_ROLE':
  return '/new-role-path';

// Modify existing role
case 'SHO':
  return '/different-path'; // Changed from /inbox/forwarded
```

---

**✅ Role-based authentication and redirection system is now complete and ready for testing!**
