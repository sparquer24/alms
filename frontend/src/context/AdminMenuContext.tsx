'use client';

import React, {
  createContext,
  useContext,
  useCallback,
  useMemo,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import {
  getMenuItemsForAdminRole,
  AdminMenuItem,
  getAdminMenuKeyFromPath,
} from '../config/adminMenuService';

interface AdminMenuContextType {
  // Stable role & menu state
  userRole: string | null;
  menuItems: AdminMenuItem[];

  // Navigation state
  activeMenuKey: string | null;
  setActiveMenuKey: (key: string | null) => void;

  // Utilities
  isAdminUser: () => boolean;
  getMenuItemPath: (key: string) => string | undefined;
}

const AdminMenuContext = createContext<AdminMenuContextType | undefined>(undefined);

interface AdminMenuProviderProps {
  children: ReactNode;
  userRole?: string | null;
}

/**
 * AdminMenuProvider: Provides stable, cached admin menu state
 *
 * This context ensures:
 * - Menu items don't reset on route changes
 * - Active menu highlighting persists and syncs with URL
 * - Role is validated once and cached
 * - Prevents unnecessary re-renders
 */
export const AdminMenuProvider: React.FC<AdminMenuProviderProps> = ({
  children,
  userRole: initialUserRole,
}) => {
  // Stable role state - only changes when user actually changes
  const [cachedUserRole, setCachedUserRole] = useState<string | null>(null);
  const [menuItems, setMenuItems] = useState<AdminMenuItem[]>([]);
  const [activeMenuKey, setActiveMenuKey] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  // Initialize from cookie if needed (client-side only)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const userCookie = document.cookie.split(';').find(c => c.trim().startsWith('user='));

      if (userCookie) {
        const value = decodeURIComponent(userCookie.split('=')[1]);
        const parsed = JSON.parse(value);
        const role = parsed?.role?.code || parsed?.code;
        if (role) {
          setCachedUserRole(role.toUpperCase());
        }
      }
    } catch (e) {
      // ignore cookie parsing errors
    }

    setHydrated(true);
  }, []);

  // Update cached role when prop changes
  useEffect(() => {
    if (initialUserRole && initialUserRole !== cachedUserRole) {
      const normalized =
        typeof initialUserRole === 'string' ? initialUserRole.toUpperCase() : cachedUserRole;
      if (normalized) {
        setCachedUserRole(normalized);
      }
    }
  }, [initialUserRole, cachedUserRole]);

  // Build menu items when role changes
  useEffect(() => {
    if (!cachedUserRole) {
      setMenuItems([]);
      return;
    }

    // Admin role always gets all menu items
    const items = getMenuItemsForAdminRole(cachedUserRole);
    setMenuItems(items);
  }, [cachedUserRole]);

  // Sync active menu with URL (called from sidebar)
  const handleActiveMenuKeyChange = useCallback((key: string | null) => {
    setActiveMenuKey(key);

    // Persist to sessionStorage for consistency across page reloads
    if (typeof window !== 'undefined') {
      try {
        if (key) {
          sessionStorage.setItem('activeAdminMenuKey', key);
        } else {
          sessionStorage.removeItem('activeAdminMenuKey');
        }
      } catch (e) {
        // ignore storage errors
      }
    }
  }, []);

  // Restore active menu from sessionStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined' || activeMenuKey) return;

    try {
      const stored = sessionStorage.getItem('activeAdminMenuKey');
      if (stored) {
        setActiveMenuKey(stored);
      }
    } catch (e) {
      // ignore
    }
  }, [activeMenuKey]);

  const isAdminUser = useCallback(() => {
    return cachedUserRole === 'ADMIN';
  }, [cachedUserRole]);

  const getMenuItemPath = useCallback(
    (key: string) => {
      const item = menuItems.find(m => m.key === key);
      return item?.path;
    },
    [menuItems]
  );

  const value: AdminMenuContextType = useMemo(
    () => ({
      userRole: cachedUserRole,
      menuItems,
      activeMenuKey,
      setActiveMenuKey: handleActiveMenuKeyChange,
      isAdminUser,
      getMenuItemPath,
    }),
    [
      cachedUserRole,
      menuItems,
      activeMenuKey,
      isAdminUser,
      getMenuItemPath,
      handleActiveMenuKeyChange,
    ]
  );

  if (!hydrated) {
    return <>{children}</>;
  }

  return <AdminMenuContext.Provider value={value}>{children}</AdminMenuContext.Provider>;
};

/**
 * Hook to access admin menu context
 * Returns undefined if not within provider (safe to use)
 */
export const useAdminMenu = (): AdminMenuContextType | undefined => {
  const context = useContext(AdminMenuContext);
  return context;
};

/**
 * Hook that throws if not within provider (use this if context is required)
 */
export const useAdminMenuRequired = (): AdminMenuContextType => {
  const context = useContext(AdminMenuContext);
  if (!context) {
    throw new Error('useAdminMenuRequired must be used within an AdminMenuProvider');
  }
  return context;
};
