import React, { memo, useCallback, useMemo, useState, useEffect, startTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { CornerUpRight, Undo2, Flag, FolderCheck } from "lucide-react";
import { ChartBarIcon } from "@heroicons/react/outline";

import { logoutUser } from "../store/thunks/authThunks";
import { toggleInbox, openInbox, closeInbox } from "../store/slices/uiSlice";
import { useAuthSync } from "../hooks/useAuthSync";
import { useLayout } from "../config/layoutContext";
import { useInbox } from "../context/InboxContext";
import { useSidebarCounts } from "../hooks/useSidebarCounts";
import { menuMeta, MenuMetaKey } from "../config/menuMeta";
import { getRoleConfig } from "../config/roles";
import { getRoleBasedRedirectPath } from "../config/roleRedirections";
import { HamburgerButton } from "./HamburgerButton";

interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
  count?: number;
  active?: boolean;
  onClick?: () => void;
}

// Reusable MenuItem component
const MenuItem = memo(({ icon, label, count, active, onClick }: MenuItemProps) => (
  <li>
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center w-full px-4 py-2 rounded-md text-left transition-colors duration-150
        ${active ? "bg-[#001F54] text-white" : "hover:bg-gray-100 text-gray-800"}`}
    >
      <span className="inline-flex items-center justify-center w-6 h-6 mr-2" aria-hidden="true">
        {icon}
      </span>
      <span className="flex-grow">{label}</span>
      {count !== undefined && (
        <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-medium text-white bg-[#6366F1] rounded-full">
          {count}
        </span>
      )}
    </button>
  </li>
));

// Ultra-optimized InboxSubMenuItem component with advanced flickering prevention
const InboxSubMenuItem = memo(({ 
  name, 
  label, 
  icon, 
  count, 
  active, 
  onClick 
}: {
  name: string;
  label: string;
  icon: React.ReactNode;
  count?: number;
  active: boolean;
  onClick: (name: string) => void;
}) => {
  // Minimize re-render logging in production
  if (process.env.NODE_ENV === 'development') {
    console.log('🔄 InboxSubMenuItem render:', name, 'active:', active, 'count:', count);
  }
  
  // Create ultra-stable click handler
  const handleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onClick(name);
  }, [onClick, name]);

  // Memoize className to prevent recalculation
  const buttonClassName = useMemo(() => 
    `flex items-center w-full px-2 py-1 rounded-md text-left text-sm transition-colors duration-150 ${
      active ? "bg-[#001F54] text-white" : "hover:bg-gray-100 text-gray-800"
    }`, [active]
  );

  return (
    <li>
      <button
        type="button"
        onClick={handleClick}
        className={buttonClassName}
        aria-pressed={active}
      >
        <span className="inline-flex items-center justify-center w-6 h-6 mr-2 transition-colors" aria-hidden="true">
          {icon}
        </span>
        <span className="flex-grow">{label}</span>
        {typeof count === 'number' && count > 0 && (
          <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-medium text-white bg-[#6366F1] rounded-full ml-2">
            {count}
          </span>
        )}
      </button>
    </li>
  );
}, (prevProps, nextProps) => {
  // Highly efficient comparison - only re-render when essential props change
  const propsEqual = (
    prevProps.name === nextProps.name &&
    prevProps.active === nextProps.active &&
    prevProps.count === nextProps.count
    // Deliberately exclude onClick and other stable props
  );
  
  if (process.env.NODE_ENV === 'development' && !propsEqual) {
    console.log('🔄 InboxSubMenuItem props changed for:', prevProps.name, {
      activeChanged: prevProps.active !== nextProps.active,
      countChanged: prevProps.count !== nextProps.count,
      prevActive: prevProps.active,
      nextActive: nextProps.active,
      prevCount: prevProps.count,
      nextCount: nextProps.count
    });
  }
  
  return propsEqual;
});

interface SidebarProps {
  onStatusSelect?: (statusId: string) => void;
  onTableReload?: (subItem: string) => void;
}

export const Sidebar = memo(({ onStatusSelect, onTableReload }: SidebarProps = {}) => {
  const { showSidebar } = useLayout();
  const [visible, setVisible] = useState(false);
  const [activeItem, setActiveItem] = useState(() => {
    if (typeof window !== "undefined" && window.localStorage) {
      return localStorage.getItem("activeNavItem") || "";
    }
    return "";
  });
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({});
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const dispatch = useDispatch();
  const { userRole, token } = useAuthSync();
  const [roleConfig, setRoleConfig] = useState(getRoleConfig(userRole));
  const router = useRouter();
  // Role derived from the `user` cookie (if present) will override or supplement auth state.
  const [cookieRole, setCookieRole] = useState<string | undefined>(undefined);

const getUserRoleFromCookie = () => {
  if (typeof window === "undefined" || !document?.cookie) return undefined;
  try {
    // 1. Find "user" cookie from document.cookie
    const raw = document.cookie.split(';').map(c => c.trim()).find(c => c.startsWith('user='));
    if (!raw) return undefined;

    // 2. Remove "user=" prefix
    let value = raw.substring('user='.length);

    // 3. Decode if URI encoded (sometimes cookies are saved encoded)
    let decoded = decodeURIComponent(value);

    // 4. Sometimes cookies are prefixed with "j:" or wrapped in quotes → clean it
    if (decoded.startsWith('j:')) decoded = decoded.slice(2);
    if ((decoded.startsWith('"') && decoded.endsWith('"')) || (decoded.startsWith("'") && decoded.endsWith("'"))) {
      decoded = decoded.slice(1, -1);
    }

    // 5. Parse string → object
    const parsed = JSON.parse(decoded);

    // 6. Get role object
    const roleObj = parsed?.role ?? parsed;
    if (!roleObj) return undefined;

    // 7. If role is a string → return directly
    if (typeof roleObj === 'string') return roleObj.toUpperCase();

    // 8. If role is object → prefer "code", fallback to "name"
    if (typeof roleObj === 'object') {
      if (roleObj.code) return String(roleObj.code).toUpperCase();
      if (roleObj.name) return String(roleObj.name).toUpperCase();
    }
  } catch (err) {
    // ignore parse errors
  }
  return undefined;
};

  // Define RootState type or import it from your store typings
  interface RootState {
    ui: {
      isInboxOpen: boolean;
    };
    // ...other state slices
  }
  const isInboxOpen = useSelector((state: RootState) => state.ui.isInboxOpen); // Get inbox state from Redux

  useEffect(() => {
    // prefer cookie-derived role when available (role code or name), fallback to auth sync role
    const effective = cookieRole || userRole || "SHO";
    console.log('🔄 Role config update:', { cookieRole, userRole, effective });
    const config = getRoleConfig(effective);
    console.log('📋 Role config result:', config);
    setRoleConfig(config);
  }, [userRole, cookieRole]);

  // Use the optimized sidebar counts hook with more stable conditions
  const shouldFetchCounts = useMemo(() => 
    visible && !cookieRole?.includes('ADMIN'), 
    [visible, cookieRole]
  );
  
  const { applicationCounts: rawCounts, loading: loadingCounts, refreshCounts } = useSidebarCounts(shouldFetchCounts);
  
  // Create stable reference to counts to prevent unnecessary re-renders
  const applicationCounts = useMemo(() => ({
    forwardedCount: rawCounts?.forwardedCount || 0,
    returnedCount: rawCounts?.returnedCount || 0,
    redFlaggedCount: rawCounts?.redFlaggedCount || 0,
    disposedCount: rawCounts?.disposedCount || 0,
  }), [
    rawCounts?.forwardedCount,
    rawCounts?.returnedCount, 
    rawCounts?.redFlaggedCount,
    rawCounts?.disposedCount
  ]);

  useEffect(() => {
    // read cookie role once on mount (client-side only)
    if (typeof window !== 'undefined') {
      const r = getUserRoleFromCookie();
      if (r) setCookieRole(r);
    }
  }, []);

  useEffect(() => {
    if (showSidebar) setVisible(true);
    else setTimeout(() => setVisible(false), 400);
  }, [showSidebar]);

  const handleMenuClick = useCallback(async (item: { name: string; childs?: { name: string }[] }) => {
    if (item.name.toLowerCase() !== "inbox") {
      dispatch(closeInbox()); // Close the inbox if another menu item is clicked
    }
    if (item.childs?.length) {
      setExpandedMenus((prev) => ({ ...prev, [item.name]: !prev[item.name] }));
    } else {
      setActiveItem(item.name);
      localStorage.setItem("activeNavItem", item.name);
      const effectiveRole = cookieRole || userRole;
      // Only ADMIN can access /admin/*
      if (effectiveRole === 'ADMIN') {
        const pathSegment = item.name.replace(/\s+/g, '');
        router.push(`/admin/${encodeURIComponent(pathSegment)}`);
      } else {
        // For non-admins, use role-based redirect logic
        // Special case: if menu is "dashboard" or similar, use getRoleBasedRedirectPath
        if (item.name.toLowerCase().includes('dashboard')) {
          const redirectPath = getRoleBasedRedirectPath(effectiveRole);
          router.push(redirectPath);
        } else {
          // For other menu items, try to route to /inbox?type={item}
          // You may want to map item names to types as needed
          const type = item.name.replace(/\s+/g, '').toLowerCase();
          router.push(`/inbox?type=${encodeURIComponent(type)}`);
        }
      }
    }
  }, [router, dispatch, cookieRole, userRole]);

  const handleInboxToggle = useCallback(() => {
    console.log('📂 Inbox toggle clicked, current state:', isInboxOpen);
    dispatch(toggleInbox()); // Dispatch toggle action
  }, [dispatch, isInboxOpen]);

  const { loadType } = useInbox();

  const handleInboxSubItemClick = useCallback((subItem: string) => {
    console.log('🔄 inboxSubItem clicked:', subItem, 'current active:', activeItem);

    const activeItemKey = `inbox-${subItem}`;
    const currentPath = window.location.pathname;
    const effectiveRole = cookieRole || userRole;
    // For admin, use /admin/inbox, for others use /inbox
    const isAdmin = effectiveRole === 'ADMIN';
    const isOnInboxBase = isAdmin
      ? currentPath === '/admin/userManagement' || currentPath.startsWith('/admin')
      : currentPath === '/inbox' || currentPath.startsWith('/inbox');

    // Delegate loading to InboxContext which ensures a single fetch per type
    const normalized = String(subItem).toLowerCase();
    startTransition(() => {
      setActiveItem(activeItemKey);
      localStorage.setItem('activeNavItem', activeItemKey);

      if (!isInboxOpen) {
        dispatch(openInbox());
      }
    });

    // Update context (single fetch) and update URL without forcing a full remount
    loadType(normalized).catch((e) => console.error('loadType error', e));
    const targetBase = isAdmin ? '/admin/userManagement' : '/inbox';
    const targetUrl = `${targetBase}?type=${encodeURIComponent(normalized)}`;
    if (isOnInboxBase) {
      // replace state to avoid adding history entries when already under inbox/home
      window.history.replaceState(null, '', targetUrl);
      if (onTableReload) onTableReload(normalized);
    } else {
      router.push(targetUrl);
    }
  }, [dispatch, isInboxOpen, activeItem, onTableReload, router, cookieRole, userRole]);

  const handleLogout = useCallback(async () => {
    if (token) {
      await dispatch(logoutUser() as any);
      // Small delay to ensure cookies are removed and Redux reset has propagated
      await new Promise((res) => setTimeout(res, 250));
    }
    router.push("/login");
  }, [dispatch, router, token]);

  // Update menuItems logic with type casting and guards
  const menuItems = useMemo(() => {
    const items = roleConfig?.menuItems ?? [];
    console.log('🔍 Sidebar menuItems generation:', {
      roleConfig,
      items,
      effectiveRole: cookieRole || userRole,
      itemCount: items.length
    });
    return items.map((item) => {
      const key = item.name as MenuMetaKey;
      return {
        name: item.name,
        label: menuMeta[key]?.label || item.name,
        icon: menuMeta[key]?.icon,
      };
    });
  }, [roleConfig, cookieRole, userRole]);

  // Create stable icons outside of memoization to prevent recreating React elements
  const forwardedIcon = useMemo(() => <CornerUpRight className="w-6 h-6 mr-2" aria-label="Forwarded" />, []);
  const returnedIcon = useMemo(() => <Undo2 className="w-6 h-6 mr-2" aria-label="Returned" />, []);
  const redFlaggedIcon = useMemo(() => <Flag className="w-6 h-6 mr-2" aria-label="Red Flagged" />, []);
  const disposedIcon = useMemo(() => <FolderCheck className="w-6 h-6 mr-2" aria-label="Disposed" />, []);

  // Create highly stable inbox sub-items to prevent flickering
  const inboxSubItems = useMemo(() => {
    console.log('📦 inboxSubItems memoization triggered with counts:', {
      forwarded: applicationCounts?.forwardedCount,
      returned: applicationCounts?.returnedCount,
      redFlagged: applicationCounts?.redFlaggedCount,
      disposed: applicationCounts?.disposedCount
    });
    
    return [
      { 
        name: "forwarded", 
        label: "Forwarded", 
        icon: forwardedIcon, 
        count: applicationCounts?.forwardedCount || 0
      },
      { 
        name: "returned", 
        label: "Returned", 
        icon: returnedIcon, 
        count: applicationCounts?.returnedCount || 0
      },
      { 
        name: "redFlagged", 
        label: "Red Flagged", 
        icon: redFlaggedIcon, 
        count: applicationCounts?.redFlaggedCount || 0
      },
      { 
        name: "disposed", 
        label: "Disposed", 
        icon: disposedIcon, 
        count: applicationCounts?.disposedCount || 0
      },
    ];
  }, [
    // Include stable icon references
    forwardedIcon,
    returnedIcon,
    redFlaggedIcon,
    disposedIcon,
    // Only re-create when counts actually change
    applicationCounts?.forwardedCount, 
    applicationCounts?.returnedCount, 
    applicationCounts?.redFlaggedCount, 
    applicationCounts?.disposedCount
  ]);

  if (!visible && !showSidebar) return null;
  // Only render sidebar if allowed role
  // determine effective role used for rendering checks
  const effectiveRole = cookieRole || userRole;
  if (!effectiveRole) {
    console.warn('⚠️ Sidebar: No effective role found, cannot render');
    return null;
  }

  console.log('✅ Sidebar rendering with:', {
    effectiveRole,
    menuItemsCount: menuItems.length,
    roleConfig: roleConfig ? 'exists' : 'missing',
    visible,
    showSidebar
  });

  return (
    <>
      <div className="md:hidden fixed top-4 left-4 z-50">
        <HamburgerButton open={mobileSidebarOpen} onClick={() => setMobileSidebarOpen((v) => !v)} />
      </div>
      <aside
        className={`z-40 w-[80vw] max-w-xs md:w-[18%] h-screen bg-white border-r border-gray-200 fixed left-0 top-0
        ${showSidebar || mobileSidebarOpen ? 'opacity-100 transform translate-x-0' : 'opacity-0 pointer-events-none -translate-x-full'}
        md:opacity-100 md:transform md:translate-x-0 md:pointer-events-auto`}
      >
        <div className="p-4 flex items-center border-b border-gray-100">
          <Image src="/icon-alms.svg" alt="Arms License Icon" width={52} height={52} className="mr-2" />
          <h1 className="text-lg font-bold">Arms License</h1>
        </div>
        <div className="bg-[#001F54] text-white p-4 flex items-center">
          <span className="mr-3">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </span>
          <span className="font-bold">{roleConfig?.dashboardTitle ?? "Dashboard"}</span>
        </div>
        <nav className="flex-1 overflow-y-auto py-2 px-2">
          <ul className="space-y-1">
            {/* Collapsible Inbox Section */}
            {effectiveRole !== 'ADMIN' && (
              <li>
                <button
                  type="button"
                  onClick={handleInboxToggle}
                  className={`flex items-center w-full px-4 py-2 rounded-md text-left ${isInboxOpen ? "bg-[#001F54] text-white" : "hover:bg-gray-100 text-gray-800"}`}
                >
                  <span className="inline-flex items-center justify-center w-6 h-6 mr-2 group-hover:text-indigo-600 transition-colors" aria-hidden="true">
                    {menuMeta.inbox.icon}
                  </span>
                  <span className="flex-grow">{menuMeta.inbox.label}</span>
                  <span className="ml-2">{isInboxOpen ? '▾' : '▸'}</span>
                </button>
                {isInboxOpen && (
                  <ul className="ml-8 mt-1 space-y-1" role="menu">
                    {inboxSubItems.map((sub) => {
                      // Pre-calculate active state to prevent inline computation
                      const isActive = activeItem === `inbox-${sub.name}`;
                      
                      return (
                        <InboxSubMenuItem
                          key={`inbox-sub-${sub.name}`} // More specific key
                          name={sub.name}
                          label={sub.label}
                          icon={sub.icon}
                          count={sub.count}
                          active={isActive}
                          onClick={handleInboxSubItemClick}
                        />
                      );
                    })}
                  </ul>
                )}
              </li>
            )}
            {/* Render other menu items except inbox, settings, login */}
            {menuItems
              .filter((item) => item.name !== "inbox")
              .map((item) => (
                <MenuItem
                  key={item.name}
                  icon={item.icon}
                  label={item.label}
                  active={activeItem === item.name}
                  onClick={() => handleMenuClick({ name: item.name })}
                />
              ))}
            {/* Add Flow Mapping menu item for ADMIN users */}
            {effectiveRole === "ADMIN" && (
              <li>
                <a href="/admin/flowMapping" className="flex items-center gap-2 px-4 py-2 hover:bg-gray-200 rounded-md">
                  <ChartBarIcon className="w-5 h-5" />
                  <span>Flow Mapping</span>
                </a>
              </li>
            )}
          </ul>
        </nav>
        <div className="absolute bottom-0 w-full p-4 border-t border-gray-200">
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-2 rounded-md text-left transition-colors duration-150 hover:bg-gray-100 text-gray-800"
          >
            <span className="inline-flex items-center justify-center w-6 h-6 mr-2" aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-9A2.25 2.25 0 002.25 5.25v13.5A2.25 2.25 0 004.5 21h9a2.25 2.25 0 002.25-2.25V15" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 12H9m3-3l-3 3 3 3" />
              </svg>
            </span>
            Logout
          </button>
        </div>
      </aside>
    </>
  );
});

// Add display names for debugging
Sidebar.displayName = 'Sidebar';
InboxSubMenuItem.displayName = 'InboxSubMenuItem';
MenuItem.displayName = 'MenuItem';
