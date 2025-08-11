# getCurrentUser API Debug Guide

## Issue Diagnosis

The `getCurrentUser` API call might be failing due to several possible reasons. Here's how to debug:

### 1. Check Console Logs

Open your browser's Developer Tools (F12) and look for these logs when `getCurrentUser` is called:

```
Console → Network Tab → Look for the /api/auth/me request
```

### 2. Common Issues & Solutions

#### **Issue 1: No Token in Cookies**
**Symptoms:** Request goes without Authorization header
**Check:** In Application/Storage → Cookies → Look for 'auth' cookie
**Fix:** Ensure login process stores token in cookies

#### **Issue 2: Token Format Issues**
**Symptoms:** 401 Unauthorized response
**Debug Code:** Add this temporarily to check token:
```typescript
// Add to getCurrentUser before the API call
const token = getAuthToken();
console.log('Token from cookies:', token);
if (!token) {
  console.error('No token found in cookies');
  return;
}
```

#### **Issue 3: API Endpoint Issues**
**Symptoms:** 404 Not Found or CORS errors
**Check:** Network tab shows the exact URL being called
**Expected URL:** `http://localhost:3001/api/auth/me`

#### **Issue 4: Server Not Running**
**Symptoms:** Network error, ERR_CONNECTION_REFUSED
**Fix:** Ensure backend server is running on port 3001

### 3. Debug Version of getCurrentUser

Replace your getCurrentUser temporarily with this debug version:

```typescript
getCurrentUser: async (): Promise<ApiResponse<any>> => {
  try {
    console.log('=== getCurrentUser Debug Start ===');
    
    // Check if token exists
    const token = getAuthToken();
    console.log('Token from cookies:', token ? 'Found' : 'Missing');
    console.log('Token value:', token);
    
    if (!token) {
      console.error('No token available for getCurrentUser');
      throw new Error('No authentication token found');
    }
    
    // Check cookies directly
    const authCookie = getCookie('auth');
    console.log('Auth cookie raw:', authCookie);
    
    if (authCookie) {
      try {
        const authData = JSON.parse(authCookie as string);
        console.log('Parsed auth data:', authData);
      } catch (e) {
        console.error('Failed to parse auth cookie:', e);
      }
    }
    
    console.log('Making API call to /api/auth/me...');
    const result = await apiClient.get('/api/auth/me');
    console.log('getCurrentUser success:', result);
    console.log('=== getCurrentUser Debug End ===');
    
    return result;
  } catch (error) {
    console.error('=== getCurrentUser Error ===');
    console.error('Error details:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    throw error;
  }
},
```

### 4. Check Network Request

In the Network tab, when getCurrentUser is called, you should see:

```
Request URL: http://localhost:3001/api/auth/me
Request Method: GET
Status Code: 200 (if successful)

Request Headers:
- Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
- Content-Type: application/json

Response (if successful):
{
  "success": true,
  "statusCode": 200,
  "body": {
    "id": "user_123",
    "name": "John Doe",
    // ... user data
  }
}
```

### 5. Backend Server Check

Ensure your backend server:
1. Is running on port 3001
2. Has the `/api/auth/me` endpoint implemented
3. Accepts Bearer token authentication
4. Returns the expected response format

### 6. CORS Issues

If you see CORS errors, ensure your backend has proper CORS configuration:
```javascript
// Backend should have:
app.use(cors({
  origin: 'http://localhost:5000', // Your frontend URL
  credentials: true
}));
```

### 7. Quick Test

Try this in your browser console when logged in:
```javascript
// Check if auth cookie exists
document.cookie.includes('auth')

// Manual API test
fetch('http://localhost:3001/api/auth/me', {
  headers: {
    'Authorization': 'Bearer ' + JSON.parse(getCookie('auth')).token,
    'Content-Type': 'application/json'
  }
}).then(r => r.json()).then(console.log);
```

### 8. Common Response Codes

- **200**: Success ✅
- **401**: Invalid/expired token 🔑
- **404**: Endpoint not found 🔍
- **500**: Server error 🚨
- **CORS Error**: CORS configuration issue 🌐

Run through these checks and let me know what you find in the console/network tabs!
