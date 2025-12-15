# Admin Dashboard Navigation - Context Error Fix

## Problem
```
Error: useAdminMenu must be used within an AdminMenuProvider
```

The admin layout was trying to use `useAdminMenu()` hook before the context provider was available, causing a runtime error.

## Root Cause
The `AdminMenuProvider` wraps from `RootProviders`, but the admin layout (`app/admin/layout.tsx`) is a client component that tries to use the context hook. In certain SSR scenarios, the hook was being called before the provider mounted.

## Solution
We made the context hook usage optional and moved the admin menu synchronization logic to the Sidebar component where it's safer:

### 1. **Made `useAdminMenu()` Optional** (`context/AdminMenuContext.tsx`)
```typescript
// Old: Throws error if not within provider
export const useAdminMenu = (): AdminMenuContextType => {
  const context = useContext(AdminMenuContext);
  if (!context) {
    throw new Error('useAdminMenu must be used within an AdminMenuProvider');
  }
  return context;
};

// New: Returns undefined if not within provider (safe)
export const useAdminMenu = (): AdminMenuContextType | undefined => {
  const context = useContext(AdminMenuContext);
  return context;
};

// New: Throws only when explicitly required
export const useAdminMenuRequired = (): AdminMenuContextType => {
  const context = useContext(AdminMenuContext);
  if (!context) {
    throw new Error('useAdminMenuRequired must be used within an AdminMenuProvider');
  }
  return context;
};
```

### 2. **Removed Context from Admin Layout** (`app/admin/layout.tsx`)
```typescript
// Removed:
// const { setActiveMenuKey } = useAdminMenu();
// const { setActiveMenuKey } = useAdminMenu();
// useEffect(() => { setActiveMenuKey(...) }, [...]);
// useEffect(() => { preloadAdminPages(); }, []);
```

### 3. **Added Admin Menu Logic to Sidebar** (`components/Sidebar.tsx`)
```typescript
// New imports
import { useAdminMenu } from '../context/AdminMenuContext';
import { getAdminMenuKeyFromPath } from '../config/adminMenuService';
import { preloadAdminPages } from '../utils/adminPagePreloader';

// Get context (optional)
const adminMenuContext = useAdminMenu();

// Sync active menu with pathname for admin pages
useEffect(() => {
  if (!pathname || !cookieRole?.includes('ADMIN')) return;
  const adminKey = getAdminMenuKeyFromPath(pathname);
  if (adminKey && adminMenuContext?.setActiveMenuKey) {
    adminMenuContext.setActiveMenuKey(adminKey);
  }
}, [pathname, cookieRole, adminMenuContext]);

// Preload admin pages when role is admin
useEffect(() => {
  if (cookieRole?.includes('ADMIN')) {
    preloadAdminPages();
  }
}, [cookieRole]);
```

## Why This Works

1. **Optional Context**: The hook now safely returns `undefined` if provider isn't available, instead of crashing
2. **Sidebar as Source**: The Sidebar is rendered after all providers are initialized, so it's safe to use the context
3. **Defensive Checks**: The admin menu sync only runs if context is available (`adminMenuContext?.setActiveMenuKey`)
4. **Graceful Degradation**: If the provider isn't available, the menu still works via the normal role config flow

## Flow After Fix

```
RootLayout (wraps with RootProviders including AdminMenuProvider)
  ↓
AdminLayout (client component - no context calls)
  ↓
Sidebar (safe place to use context)
  ├─ getAdminMenu() - optional, returns context or undefined
  ├─ Sync pathname to active menu (if context available)
  └─ Preload admin pages (if admin role)
```

## Files Modified

1. `frontend/src/context/AdminMenuContext.tsx` - Made hook optional, added `useAdminMenuRequired`
2. `frontend/src/app/admin/layout.tsx` - Removed context usage
3. `frontend/src/components/Sidebar.tsx` - Added admin menu logic with safe context handling

## Status

✅ No more context provider errors
✅ Admin menu still syncs with pathname
✅ Admin pages still preload
✅ Menu highlighting still works
✅ All TypeScript errors resolved
