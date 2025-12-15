# ZS Role Menu Items Fix

## Problem
The ZS (Zonal Superintendent) role was missing the `sent`, `closed`, and `finaldisposal` tabs in the sidebar, even though the backend has these configured.

## Root Cause
The frontend `getRoleConfig()` function in `roles.ts` was only using menu items from the backend cookie data. If the backend didn't return menu items with proper status IDs, the sidebar would display an empty menu or incomplete items.

## Solution
Added role-specific menu item defaults in `frontend/src/config/roles.ts` that serve as fallbacks when:
1. Menu items from backend are empty
2. Menu items are missing or improperly formatted

## Changes Made

### File: `frontend/src/config/roles.ts`

Added fallback menu item configuration for specific roles with their associated status IDs:

**ZS (Zonal Superintendent):**
```typescript
'ZS': [
  { name: 'freshform', statusIds: [9] },
  { name: 'inbox', statusIds: [1, 9] },
  { name: 'sent', statusIds: [11, 1, 9] },        // ✅ NOW SHOWS
  { name: 'closed', statusIds: [10] },            // ✅ NOW SHOWS
  { name: 'drafts', statusIds: [13] },
  { name: 'finaldisposal', statusIds: [7] },      // ✅ NOW SHOWS
]
```

**Also configured for:**
- **DCP** (Deputy Commissioner of Police)
- **ACP** (Assistant Commissioner of Police)
- **SHO** (Station House Officer)

## How It Works

1. `getRoleConfig()` reads menu items from backend cookie
2. If backend provides menu items with proper structure, use them
3. **NEW:** If no menu items or incomplete, check role-specific defaults
4. Fallback configuration ensures all roles have correct tabs with status IDs
5. Sidebar renders with all available tabs for each role

## Status IDs Mapping

| Status ID | Status Code    | Description |
|-----------|----------------|------------|
| 1         | FORWARD        | Forwarded to next stage |
| 3         | APPROVED       | Application approved |
| 7         | DISPOSE        | Final disposal |
| 9         | INITIATE       | Fresh form initiated |
| 10        | CLOSE          | Closed |
| 11        | RECOMMEND      | Recommended |
| 13        | DRAFT          | Draft |

## Testing

✅ **ZS users should now see:**
- Fresh Form (freshform)
- Inbox (inbox) 
- Sent (sent) ← NEW
- Closed (closed) ← NEW
- Drafts (drafts)
- Final Disposal (finaldisposal) ← NEW

✅ **Each tab shows applications with specific statuses**
- Sent tab: RECOMMEND (11), FORWARD (1), INITIATE (9) status applications
- Closed tab: CLOSE (10) status applications
- Final Disposal tab: DISPOSE (7) status applications

## Files Modified
- ✅ `frontend/src/config/roles.ts` - Added role-specific menu defaults

## Notes
- Backend should still provide menu items via cookie for best practice
- This fallback ensures frontend works even if backend data is incomplete
- All status ID mappings align with backend `ROLE_MENU_ITEMS_WITH_STATUS_IDS.json`
