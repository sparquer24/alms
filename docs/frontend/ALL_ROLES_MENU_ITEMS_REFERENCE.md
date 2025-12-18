# All Roles Menu Items & Tabs Configuration

## Overview
Frontend configuration for all 13 roles with their specific menu items (tabs) and associated status IDs.

**Location:** `frontend/src/config/roles.ts`

---

## Role-by-Role Configuration

### 1. **ZS - Zonal Superintendent** 🔵
**Tabs:** 6 different tables
```
- Fresh Form (status: INITIATE [9])
- Inbox (status: FORWARD [1], INITIATE [9])
- Sent (status: RECOMMEND [11], FORWARD [1], INITIATE [9])
- Closed (status: CLOSE [10])
- Drafts (status: DRAFT [13])
- Final Disposal (status: DISPOSE [7])
```

---

### 2. **SHO - Station House Officer** 🔵
**Tabs:** 4 different tables
```
- Inbox (status: FORWARD [1], INITIATE [9])
- Fresh Form (status: INITIATE [9])
- Sent (status: RECOMMEND [11], FORWARD [1])
- Closed (status: CLOSE [10])
```

---

### 3. **ACP - Assistant Commissioner of Police** 🔵
**Tabs:** 3 different tables
```
- Inbox (status: FORWARD [1], INITIATE [9])
- Sent (status: RECOMMEND [11], FORWARD [1])
- Closed (status: CLOSE [10])
```

---

### 4. **DCP - Deputy Commissioner of Police** 🔵
**Tabs:** 3 different tables
```
- Inbox (status: FORWARD [1], INITIATE [9], RECOMMEND [11])
- Sent (status: RECOMMEND [11], APPROVED [3])
- Closed (status: CLOSE [10], DISPOSE [7])
```

---

### 5. **AS - Arms Superintendent** 🔵
**Tabs:** 5 different tables
```
- Inbox (status: FORWARD [1], INITIATE [9])
- Sent (status: RECOMMEND [11], FORWARD [1])
- Closed (status: CLOSE [10])
- Final Disposal (status: DISPOSE [7])
- Reports (status: FORWARD [1], INITIATE [9], CLOSE [10], DISPOSE [7], APPROVED [3])
```

---

### 6. **ADO - Administrative Officer** 🔵
**Tabs:** 2 different tables
```
- Inbox (status: FORWARD [1], INITIATE [9])
- Sent (status: RECOMMEND [11])
```

---

### 7. **CADO - Chief Administrative Officer** 🔵
**Tabs:** 3 different tables
```
- Inbox (status: FORWARD [1], INITIATE [9], RECOMMEND [11])
- Sent (status: RECOMMEND [11], APPROVED [3])
- Closed (status: CLOSE [10], DISPOSE [7])
```

---

### 8. **JTCP - Joint Commissioner of Police** 🔵
**Tabs:** 3 different tables
```
- Inbox (status: FORWARD [1], INITIATE [9], RECOMMEND [11])
- Sent (status: RECOMMEND [11], APPROVED [3])
- Closed (status: CLOSE [10], DISPOSE [7])
```

---

### 9. **CP - Commissioner of Police** 🔵
**Tabs:** 4 different tables
```
- Inbox (status: FORWARD [1], INITIATE [9], RECOMMEND [11])
- Sent (status: RECOMMEND [11], APPROVED [3])
- Closed (status: CLOSE [10], DISPOSE [7])
- Final Disposal (status: DISPOSE [7])
```

---

### 10. **ARMS_SUPDT - Arms Superintendent** 🔵
**Tabs:** 4 different tables
```
- Inbox (status: FORWARD [1], INITIATE [9])
- Sent (status: RECOMMEND [11], FORWARD [1])
- Closed (status: CLOSE [10])
- Final Disposal (status: DISPOSE [7])
```

---

### 11. **ARMS_SEAT - Arms Seat** 🔵
**Tabs:** 2 different tables
```
- Inbox (status: FORWARD [1], INITIATE [9])
- Sent (status: RECOMMEND [11])
```

---

### 12. **ACO - Assistant Compliance Officer** 🔵
**Tabs:** 3 different tables
```
- Inbox (status: FORWARD [1], INITIATE [9])
- Sent (status: RECOMMEND [11])
- Closed (status: CLOSE [10])
```

---

### 13. **APPLICANT - Citizen Applicant** 🔵
**Tabs:** 1 table only
```
- Drafts (status: DRAFT [13])
```

---

### 14. **ADMIN - System Administrator** 🔴
**Tabs:** Admin-specific (not role tables, but admin functions)
```
- User Management
- Role Mapping
- Analytics
- Flow Mapping
- Locations Management (optional)
```

---

## Status IDs Reference

| ID  | Status Code    | Description |
|-----|----------------|------------|
| 1   | FORWARD        | Application forwarded to next stage |
| 3   | APPROVED       | Application approved |
| 7   | DISPOSE        | Application in final disposal |
| 9   | INITIATE       | Application initiated/fresh form |
| 10  | CLOSE          | Application closed |
| 11  | RECOMMEND      | Application recommended |
| 13  | DRAFT          | Draft status (unsaved) |

---

## How It Works

### Frontend Flow:
1. User logs in → Role data received from backend
2. `getRoleConfig(userRole)` reads menu items from cookie
3. If backend provides menu items with statusIds → Use them
4. **NEW:** If backend menu items are empty/missing → Use role-specific defaults from this config
5. Sidebar renders with all tabs + their status ID filters
6. User clicks tab → Displays applications matching that tab's statusIds

### Backend Integration:
- Backend role data includes `menu_items` JSON field
- Frontend parses and uses if available
- Fallback ensures frontend works even if backend data incomplete

---

## Implementation Details

**File:** `frontend/src/config/roles.ts`

**Function:** `getRoleConfig(userRoleOrObject)`
- Extracts role code from user object or cookie
- Builds menu items array with statusIds
- Returns `RoleConfig` object containing:
  - `menuItems`: Array of tabs with their statusIds
  - `dashboardTitle`: Role-specific dashboard title
  - `permissions`: Array of permission strings
  - `canAccessSettings`: Boolean for settings access

---

## Testing Checklist

### For Each Role:
- [ ] Login as role user
- [ ] Verify all expected tabs appear in sidebar
- [ ] Click each tab → Verify correct applications load
- [ ] Verify no extra tabs show up
- [ ] Verify application counts match tab name
- [ ] Verify menu items persist across page refresh

### Example - ZS User:
- [ ] Fresh Form tab shows INITIATE (9) status apps
- [ ] Inbox tab shows FORWARD (1) + INITIATE (9) apps
- [ ] Sent tab shows RECOMMEND (11) + FORWARD (1) + INITIATE (9) apps
- [ ] Closed tab shows CLOSE (10) status apps
- [ ] Drafts tab shows DRAFT (13) status apps
- [ ] Final Disposal tab shows DISPOSE (7) status apps

---

## Notes

✅ **All 13 roles now have proper tab configurations**
✅ **Each role shows only their authorized tabs**
✅ **Status ID filtering prevents unauthorized access**
✅ **Fallback ensures frontend works independently**
✅ **Backend can still override with proper cookie data**

