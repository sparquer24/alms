# 🚀 Flow Mapping - Quick Start Guide

## 5-Minute Setup

### Prerequisites
- Node.js 18+
- PostgreSQL running
- Backend and frontend both set up

### Step 1: Database Migration (1 min)

```bash
cd backend
npx prisma migrate dev --name add_role_flow_mapping
```

This creates the `RoleFlowMapping` table.

### Step 2: Verify Backend (1 min)

```bash
# Test the API endpoint
curl http://localhost:3001/api/roles

# Should return a list of roles with id, name, code, etc.
```

### Step 3: Start Services (1 min)

Terminal 1 - Backend:
```bash
cd backend
npm run dev
# Should show: Listening on port 3001
```

Terminal 2 - Frontend:
```bash
cd frontend
npm run dev
# Should show: Ready on http://localhost:5000
```

### Step 4: Access Page (1 min)

Open browser:
```
http://localhost:5000/admin/flowMapping
```

### Step 5: Test It (1 min)

1. Click "Select Current Role" dropdown
2. Select a role (e.g., "DCP")
3. Click "Select Next Roles (Can Forward To)"
4. Select 1-2 roles (e.g., "ACP", "SHO")
5. Click "Save Mapping"
6. Should see success toast

✅ Done!

---

## What You Should See

### On Success
- Green "Success" toast: "Flow mapping saved successfully"
- Workflow diagram updates with selected roles
- Audit information appears showing timestamp
- Diagram shows arrows from current role to next roles

### If Something Goes Wrong

**API Not Responding?**
```bash
# Check backend is running
curl http://localhost:3001/api/roles
```

**Can't Select Roles?**
```bash
# Ensure roles exist in database
npx prisma studio
# Check Roles table
```

**Circular Dependency Error?**
- This is expected behavior
- Try selecting different next roles

---

## Next Steps

### Test Features

1. **Reset Mapping**
   - Click "Reset Mapping" button
   - Confirm deletion
   - Mapping clears

2. **Duplicate Mapping**
   - Select a role with existing mapping
   - Click "Duplicate Mapping"
   - Select target role
   - New mapping created with same next roles

3. **View Audit Info**
   - Mapping shows who updated it and when

4. **Test Circular Detection**
   - Try: A → B, B → C, C → A
   - Last step should show circular error

---

## Common Issues

### "Role with ID X not found"
```bash
# List available roles
curl http://localhost:3001/api/roles
# Use a valid role ID
```

### "Circular workflow detected"
This is working correctly! Try different role combinations.

### "Port 3001 already in use"
```bash
# Kill process on port 3001
# macOS/Linux
lsof -ti:3001 | xargs kill -9

# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F
```

### Page shows "Failed to load roles"
- Check backend is running
- Check network in browser DevTools
- Verify API_URL environment variable

---

## File Locations

- **Frontend Page**: `frontend/src/app/admin/flowMapping/page.tsx`
- **Backend Controller**: `backend/src/modules/flowMapping/flow-mapping.controller.ts`
- **Backend Service**: `backend/src/modules/flowMapping/flow-mapping.service.ts`
- **Visualization**: `frontend/src/components/admin/WorkflowGraphPreview.tsx`
- **Database**: `backend/prisma/schema.prisma`

---

## Quick Test

Copy & paste in browser console to test API:

```javascript
// Get all roles
fetch('http://localhost:3001/api/roles')
  .then(r => r.json())
  .then(d => console.log('Roles:', d));

// Get flow mapping for role 1
fetch('http://localhost:3001/api/flow-mapping/1')
  .then(r => r.json())
  .then(d => console.log('Mapping:', d));

// Validate flow mapping
fetch('http://localhost:3001/api/flow-mapping/validate', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    currentRoleId: 1,
    nextRoleIds: [2, 3]
  })
})
.then(r => r.json())
.then(d => console.log('Validation:', d));
```

---

## Documentation

- **Full Docs**: `FLOW_MAPPING_IMPLEMENTATION_COMPLETE.md`
- **Migration**: `FLOW_MAPPING_MIGRATION_GUIDE.md`
- **API Testing**: `FLOW_MAPPING_API_TESTING.md`
- **Summary**: `FLOW_MAPPING_SUMMARY.md`

---

## Key Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/flow-mapping/:roleId` | Get mapping |
| PUT | `/flow-mapping/:roleId` | Save mapping |
| POST | `/flow-mapping/validate` | Validate mapping |
| POST | `/flow-mapping/:roleId/reset` | Clear mapping |

See `FLOW_MAPPING_API_TESTING.md` for complete list.

---

## Need Help?

1. Check the error message
2. Look in the browser console (DevTools)
3. Check backend logs
4. Review documentation files
5. Verify database migration ran
6. Ensure backend service is running

---

**Ready to go!** 🎉

The Flow Mapping page is ready to use. Select roles, set up workflows, and save!
