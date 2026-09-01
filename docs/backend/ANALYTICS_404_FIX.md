# Analytics 404 Fix - Backend Restart Required

## Issue
Endpoints return 404 Not Found:
- `/api/analytics/admin-activities`
- `/api/analytics/role-load`
- `/api/analytics/states`
- `/api/analytics/applications`

## Root Cause
The AnalyticsModule was just created and imported into app.module.ts. The backend needs to be restarted for NestJS to register the new routes.

## Solution

### Step 1: Stop the Backend Server
If the backend is running, stop it:
```bash
# In the terminal running backend
Ctrl + C
```

### Step 2: Clear NestJS Cache (Optional but Recommended)
```bash
cd backend
npm run build
```

### Step 3: Restart the Backend
```bash
cd backend
npm run dev
```

### Step 4: Verify Routes are Registered
You should see output similar to:
```
[NestFactory] Starting Nest application...
[InstanceLoader] AppModule dependencies initialized
[InstanceLoader] AnalyticsModule dependencies initialized
[RoutesResolver] AnalyticsController {/api/analytics}:
  [GET] /api/analytics/applications
  [GET] /api/analytics/role-load
  [GET] /api/analytics/states
  [GET] /api/analytics/admin-activities
[RoutesResolver] Other routes...
```

### Step 5: Test the Endpoints

**Option A: Browser**
Visit: `http://localhost:3001/api/analytics/applications`

**Option B: PowerShell**
```powershell
curl "http://localhost:3001/api/analytics/applications"
```

**Option C: cURL**
```bash
curl "http://localhost:3001/api/analytics/applications"
```

Expected response:
```json
{
  "success": true,
  "data": []
}
```

Or if database has data:
```json
{
  "success": true,
  "data": [
    {"week": "2025-W45", "count": 5, "date": "2025-W45"}
  ]
}
```

## Complete Backend Restart Checklist

- [ ] Stop backend (Ctrl+C in terminal)
- [ ] Verify it stopped (should show exit message)
- [ ] Wait 2 seconds
- [ ] Run `cd backend && npm run dev`
- [ ] Wait for "Listening on port 3001" message
- [ ] Check console for route registration messages
- [ ] Test one endpoint in browser
- [ ] Refresh frontend page
- [ ] Check frontend console for successful API calls

## If Still Getting 404

### Check 1: Verify Backend is Running
```bash
# In PowerShell
netstat -ano | findstr :3001
```
Should show a listening port.

### Check 2: Verify App Module Imports
Check `/backend/src/modules/app.module.ts`:
```typescript
import { AnalyticsModule } from './analytics/analytics.module';

@Module({
  imports: [..., AnalyticsModule], // Must be in imports array
})
```

### Check 3: Verify Controller/Module Files Exist
```bash
# Should show these files:
c:\Users\preml\Desktop\office\alms\backend\src\modules\analytics\
  ├── analytics.controller.ts
  ├── analytics.service.ts
  ├── analytics.module.ts
  └── dto/
      └── analytics.dto.ts
```

### Check 4: Check for TypeScript Errors
```bash
cd backend
npx tsc --noEmit
```
Should show no errors.

### Check 5: Rebuild and Try Again
```bash
cd backend
npm run build
npm run dev
```

## Frontend Configuration

Make sure frontend is pointing to correct backend URL in `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

Or default is: `http://localhost:3001/api`

## Expected Behavior After Restart

### On Analytics Page Load:
1. Four API requests should fire to:
   - http://localhost:3001/api/analytics/applications
   - http://localhost:3001/api/analytics/role-load
   - http://localhost:3001/api/analytics/states
   - http://localhost:3001/api/analytics/admin-activities

2. Each should return 200 OK with JSON response

3. Charts should render (empty if no data, or with data if database populated)

4. No 404 errors in console

5. No JSON parsing errors

## Testing Script

Run this in frontend console to test all endpoints:
```javascript
const baseURL = 'http://localhost:3001/api';

async function testEndpoints() {
  const endpoints = [
    'analytics/applications',
    'analytics/role-load',
    'analytics/states',
    'analytics/admin-activities'
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${baseURL}/${endpoint}`);
      const text = await response.text();
      console.log(`${endpoint}: ${response.status}`, JSON.parse(text));
    } catch (error) {
      console.error(`${endpoint}: ERROR`, error);
    }
  }
}

testEndpoints();
```

## Summary

The analytics endpoints are properly configured but require a backend restart to be registered with NestJS. After restart, all endpoints should return 200 OK with JSON responses containing the `success` flag and `data` array.
