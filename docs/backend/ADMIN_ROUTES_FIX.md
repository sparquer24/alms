# Admin Dashboard - Admin Routes Fix

## Issue
For Admin users, we should NOT use the inbox query pattern (`/inbox?type=analytics`). Instead, we navigate directly to proper admin page routes like `/admin/analytics`.

## Solution Implemented

### Updated `handleMenuClick` in Sidebar.tsx

The menu click handler now has a clear separation:

**For ADMIN Role:**
```typescript
if (effectiveRole === 'ADMIN') {
  // Navigate directly to admin page
  const pathSegment = item.name.replace(/\s+/g, '');
  const adminPath = `/admin/${encodeURIComponent(pathSegment)}`;
  
  // Set active item to normalized key
  setActiveItem(key);
  persistActiveNavToLocal(key);
  
  // Navigate without any inbox logic
  router.push(adminPath);
  return;
}
```

**For Non-ADMIN Roles:**
- Continue using the existing inbox pattern (`/inbox?type=...`)
- Handle inbox state management
- Support expandable menu items

## Behavior Changes

### Before
- Admin menu items might try to use inbox query parameters
- Inconsistent navigation between admin and regular users
- Mixed active item tracking

### After
- Admin menu items navigate to direct page routes:
  - User Management → `/admin/userManagement`
  - Role Mapping → `/admin/roleMapping`
  - Analytics → `/admin/analytics`
  - Flow Mapping → `/admin/flowMapping`
- No inbox logic involved for admin navigation
- Clean separation of concerns
- Consistent active menu highlighting

## Flow for Admin User

```
1. Admin clicks "Analytics" menu item
   ↓
2. handleMenuClick detects effectiveRole === 'ADMIN'
   ↓
3. Builds path: '/admin/analytics'
   ↓
4. Sets activeItem to 'analytics' (normalized)
   ↓
5. Navigates to '/admin/analytics'
   ↓
6. Sidebar syncs pathname to active menu (if context available)
   ↓
7. Analytics page renders with "Analytics" menu item highlighted
```

## Files Modified
- `frontend/src/components/Sidebar.tsx` - Updated `handleMenuClick` logic

## Testing
- ✅ Click admin menu items → navigate to correct page
- ✅ No inbox query parameters in admin URLs
- ✅ Active menu highlights current page
- ✅ Menu state persists on refresh
- ✅ Non-admin users still use inbox pattern

## Benefits
- Cleaner, more intuitive admin URLs
- Clearer code separation between admin and user flows
- Faster navigation (no inbox state management overhead for admin)
- Better UX consistency for admin users
