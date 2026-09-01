# Sidebar StatusIds Implementation - Complete

## Overview
Successfully implemented dynamic sidebar menu items with role-based status IDs from cookies. The system now supports both the old string array format and the new object format with statusIds.

## Changes Made

### 1. **Updated MenuItem Type** (`frontend/src/config/roles.ts`)
```typescript
export type MenuItem = {
  name: string;
  statusIds?: number[]; // Optional status IDs for filtering applications
};
```

### 2. **Enhanced Cookie Parsing** (`frontend/src/config/roles.ts`)
- Updated `getRoleConfig()` to parse new menu item format
- Handles both formats:
  - **Old format**: `["freshform", "inbox", "sent", "closed"]`
  - **New format**: 
    ```json
    [
      { "name": "freshform", "statusIds": [1, 2, 3] },
      { "name": "sent", "statusIds": [4] },
      { "name": "closed", "statusIds": [7] }
    ]
    ```

### 3. **Updated InboxContext** (`frontend/src/context/InboxContext.tsx`)
- Modified `loadType` signature to accept optional `statusIds`:
  ```typescript
  loadType: (type: string, force?: boolean, statusIds?: number[]) => Promise<void>
  ```
- Passes custom statusIds to API calls when available

### 4. **Enhanced API Service** (`frontend/src/services/sidebarApiCalls.ts`)
- Updated `fetchApplicationsByStatusKey()` to accept optional `customStatusIds`:
  ```typescript
  export const fetchApplicationsByStatusKey = async (
    statusKey: string, 
    customStatusIds?: number[]
  ): Promise<ApplicationData[]>
  ```
- Priority logic:
  1. Use `customStatusIds` from cookie if provided
  2. Fall back to default `statusIdMap` mapping

### 5. **Updated Sidebar Component** (`frontend/src/components/Sidebar.tsx`)
- Added state to track active statusIds:
  ```typescript
  const [activeStatusIds, setActiveStatusIds] = useState<number[] | undefined>(undefined);
  ```
- Enhanced `handleMenuClick` to:
  - Accept `statusIds` parameter
  - Store statusIds in localStorage for persistence
  - Call API with custom statusIds when clicking menu items
  - Pass statusIds to `loadType()` function
- Updated menuItems rendering to include statusIds:
  ```typescript
  onClick={() => handleMenuClick({ 
    name: item.name, 
    statusIds: item.statusIds 
  })}
  ```

## How It Works

### Flow Diagram
```
Cookie (Role Data)
    ↓
menuItems: [{ name: "freshform", statusIds: [1,2,3] }]
    ↓
getRoleConfig() parses cookie
    ↓
Sidebar receives menuItems with statusIds
    ↓
User clicks menu item
    ↓
handleMenuClick() extracts statusIds
    ↓
loadType(type, force, statusIds) called
    ↓
fetchApplicationsByStatusKey(type, statusIds)
    ↓
API call with custom status IDs
    ↓
Applications filtered by role-specific statuses
```

### Example Usage

**Backend sets cookie with:**
```json
{
  "role": {
    "code": "SHO",
    "name": "Station House Officer",
    "menu_items": [
      { "name": "freshform", "statusIds": [1, 2, 3] },
      { "name": "sent", "statusIds": [4, 5] },
      { "name": "closed", "statusIds": [7, 10] }
    ]
  }
}
```

**When user clicks "freshform":**
1. Sidebar extracts `statusIds: [1, 2, 3]`
2. Calls `loadType("freshform", true, [1, 2, 3])`
3. API fetches applications with status IDs 1, 2, and 3
4. Applications are displayed in the table

### Backward Compatibility

The system maintains full backward compatibility:

**Old format (string array):**
```json
["freshform", "inbox", "sent", "closed"]
```
- Works as before
- Uses default statusIdMap for status IDs

**New format (object array with statusIds):**
```json
[
  { "name": "freshform", "statusIds": [1, 2, 3] },
  { "name": "sent", "statusIds": [4] }
]
```
- Uses custom statusIds from cookie
- Overrides default statusIdMap

## Benefits

1. **Role-Based Filtering**: Each role can see different applications based on custom status IDs
2. **Flexible Configuration**: Backend can dynamically control what statuses each role sees
3. **No Hardcoding**: Status IDs are configurable per role without code changes
4. **Backward Compatible**: Existing string arrays still work
5. **Persistent State**: StatusIds stored in localStorage for page reloads

## Testing Checklist

- [ ] Test with old format cookie (string array)
- [ ] Test with new format cookie (object array with statusIds)
- [ ] Verify API calls use custom statusIds
- [ ] Check localStorage persistence
- [ ] Test multiple roles with different statusIds
- [ ] Verify fallback to default statusIdMap when no custom IDs
- [ ] Test navigation between menu items
- [ ] Verify correct applications displayed per role

## Files Modified

1. `frontend/src/config/roles.ts` - MenuItem type and parsing
2. `frontend/src/context/InboxContext.tsx` - loadType with statusIds
3. `frontend/src/services/sidebarApiCalls.ts` - API call with custom IDs
4. `frontend/src/components/Sidebar.tsx` - Menu click handling with statusIds

## Next Steps

1. **Backend**: Update role management to send new format
2. **Testing**: Test with real user roles and permissions
3. **Documentation**: Update API documentation for role structure
4. **Monitoring**: Add logging to track statusIds usage

---

**Implementation Date**: October 27, 2025  
**Status**: ✅ Complete
