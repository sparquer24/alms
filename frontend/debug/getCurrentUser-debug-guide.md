# Authentication Cookie Debugging Guide

## Issues Identified and Fixed

### 1. Cookie Management Issues

**Problem**: Inconsistent cookie structure and missing proper attributes
**Solution**: 
- Added proper cookie attributes (`sameSite`, `secure`, `httpOnly`)
- Created helper functions for consistent cookie management
- Improved error handling for cookie parsing

### 2. Token Validation Issues

**Problem**: `auth/me` endpoint might not be properly validating tokens
**Solution**:
- Enhanced error handling in `getCurrentUser` API call
- Added detailed logging for debugging
- Improved response validation

### 3. CORS Configuration

**Problem**: Missing proper CORS setup for credentials
**Solution**:
- Added `credentials: 'include'` to all API requests
- Ensured proper cookie handling across domains

### 4. Redux State Synchronization

**Problem**: Auth state restoration might not be working correctly
**Solution**:
- Improved `restoreAuthState` function with better error handling
- Added comprehensive logging for debugging
- Enhanced cookie validation

## Debugging Steps

### Step 1: Check Browser Console

1. Open browser developer tools (F12)
2. Go to Console tab
3. Look for authentication-related logs:
   - "Making login request to:"
   - "Login response:"
   - "Making getCurrentUser request with token:"
   - "getCurrentUser response:"
   - "Restoring auth state from cookie:"
   - "Auth state restored successfully"

### Step 2: Check Application Storage

1. Go to Application tab in developer tools
2. Check Cookies section for `auth` cookie
3. Verify cookie structure:
   ```json
   {
     "token": "your-jwt-token",
     "user": {
       "id": "user-id",
       "name": "User Name",
       "role": "USER_ROLE",
       ...
     },
     "isAuthenticated": true,
     "role": "USER_ROLE",
     "name": "User Name"
   }
   ```

### Step 3: Use Debug Component

The `AuthDebugInfo` component (visible in development mode) shows:
- Current Redux authentication state
- Cookie information
- Debug actions (log to console, clear data)

### Step 4: Test Authentication Flow

1. **Login Test**:
   - Clear all browser data
   - Go to login page
   - Use test credentials: `dcp_user` / `1234`
   - Check console for login response
   - Verify cookie is set correctly

2. **Token Validation Test**:
   - After login, check if `auth/me` endpoint is called
   - Verify token is included in Authorization header
   - Check response for user data

3. **Page Refresh Test**:
   - After successful login, refresh the page
   - Check if authentication state is restored from cookie
   - Verify user is not redirected to login

## Common Issues and Solutions

### Issue 1: Cookie Not Set After Login

**Symptoms**: User logs in successfully but gets redirected to login on page refresh
**Debug Steps**:
1. Check login API response for token
2. Verify cookie is set with proper attributes
3. Check for CORS issues in network tab

**Solution**: Ensure backend sets proper `Set-Cookie` header with correct attributes

### Issue 2: Token Not Included in API Requests

**Symptoms**: API calls return 401 errors
**Debug Steps**:
1. Check if token is retrieved from cookie
2. Verify Authorization header is set
3. Check cookie parsing logic

**Solution**: Verify cookie structure and token extraction logic

### Issue 3: Auth State Not Restored on Page Load

**Symptoms**: User appears logged out after page refresh
**Debug Steps**:
1. Check if cookie exists
2. Verify cookie parsing
3. Check Redux state restoration

**Solution**: Ensure `restoreAuthState` function works correctly

### Issue 4: CORS Issues

**Symptoms**: API requests fail with CORS errors
**Debug Steps**:
1. Check network tab for CORS errors
2. Verify backend CORS configuration
3. Check if credentials are included

**Solution**: Backend must include:
```
Access-Control-Allow-Credentials: true
Access-Control-Allow-Origin: [your-frontend-domain]
```

## Backend Requirements

### 1. Login Endpoint (`/auth/login`)

Should return:
```json
{
  "success": true,
  "body": {
    "token": "jwt-token-here",
    "user": {
      "id": "user-id",
      "name": "User Name",
      "role": "USER_ROLE",
      ...
    }
  }
}
```

### 2. Get Current User Endpoint (`/auth/me`)

Should:
- Accept `Authorization: Bearer <token>` header
- Return user data if token is valid
- Return 401 if token is invalid

### 3. CORS Configuration

Backend must include:
```
Access-Control-Allow-Credentials: true
Access-Control-Allow-Origin: [your-frontend-domain]
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

## Testing Checklist

- [ ] Login with valid credentials
- [ ] Check cookie is set after login
- [ ] Verify token is included in API requests
- [ ] Test page refresh maintains authentication
- [ ] Test logout clears all data
- [ ] Test invalid token handling
- [ ] Test CORS with different domains

## Debug Commands

### Clear All Authentication Data
```javascript
// In browser console
localStorage.clear();
document.cookie = 'auth=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
window.location.reload();
```

### Check Current Auth State
```javascript
// In browser console
console.log('Redux State:', store.getState().auth);
console.log('Cookie:', document.cookie);
```

### Test API Endpoints
```javascript
// Test login
fetch('http://localhost:8000/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username: 'dcp_user', password: '1234' }),
  credentials: 'include'
}).then(r => r.json()).then(console.log);

// Test getCurrentUser
fetch('http://localhost:8000/auth/me', {
  headers: { 
    'Authorization': 'Bearer YOUR_TOKEN_HERE',
    'Content-Type': 'application/json'
  },
  credentials: 'include'
}).then(r => r.json()).then(console.log);
``` 