'use client';

import React, { memo, useCallback, useMemo, useState, useEffect, useRef } from 'react';
import Image from 'next/image';
const ImageFixed = Image as any;

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { CornerUpRight, Undo2, Flag, RefreshCcw } from 'lucide-react';

const CornerUpRightFixed = CornerUpRight as any;
const Undo2Fixed = Undo2 as any;
const FlagFixed = Flag as any;
const RefreshCcwFixed = RefreshCcw as any;

import { logoutUser } from '../store/thunks/authThunks';
import { toggleInbox, openInbox, closeInbox } from '../store/slices/uiSlice';
import { useAuthSync } from '../hooks/useAuthSync';
import { useLayout } from '../config/layoutContext';
import { useInbox } from '../context/InboxContext';
import { useSidebarCounts } from '../hooks/useSidebarCounts';
import { menuMeta, MenuMetaKey } from '../config/menuMeta';
import { getRoleConfig } from '../config/roles';
import { getRoleBasedRedirectPath } from '../config/roleRedirections';
import { isAdminRole } from '../utils/roleUtils';
import { useAdminMenu } from '../context/AdminMenuContext';
import { getAdminMenuKeyFromPath, getAdminPathForMenuItem } from '../config/adminMenuService';
import { preloadAdminPages } from '../utils/adminPagePreloader';
import { HamburgerButton } from './HamburgerButton';
import {
  extractTabFromRoute,
  buildActiveItemFromRoute,
  getValidInboxTypes,
  clearSkipInboxFlag,
  routeStateChanged,
  type RouteTabState,
} from '../utils/sidebarRouteSync';

/* ----------------------------
  Small helper memo components
   - keep these simple and memoized
-----------------------------*/
interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
  count?: number;
  active?: boolean;
  onClick?: () => void;
  onActivate?: () => void;
}
const MenuItem = memo(({ icon, label, count, active, onClick, onActivate }: MenuItemProps) => (
  <li>
    <button
      type='button'
      onMouseDown={onActivate}
      onClick={onClick}
      className={`flex items-center w-full px-4 py-2 rounded-md text-left transition-colors duration-150
        ${active ? 'bg-[#001F54] text-white' : 'hover:bg-gray-100 text-gray-800'}`}
      aria-pressed={active}
      aria-current={active ? 'page' : undefined}
      role='menuitem'
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onActivate?.();
          onClick?.();
        }
      }}
    >
      <span className='inline-flex items-center justify-center w-6 h-6 mr-2' aria-hidden='true'>
        {icon}
      </span>
      <span className='flex-grow'>{label}</span>
      {count !== undefined && (
        <span className='inline-flex items-center justify-center px-2 py-1 text-xs font-medium text-white bg-[#6366F1] rounded-full'>
          {count}
        </span>
      )}
    </button>
  </li>
));

const InboxSubMenuItem = memo(
  ({
    name,
    label,
    icon,
    count,
    active,
    onClick,
    onActivate,
  }: {
    name: string;
    label: string;
    icon: React.ReactNode;
    count?: number;
    active: boolean;
    onClick: (name: string) => void;
    onActivate?: (name: string) => void;
  }) => {
    const handleClick = useCallback(
      (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onClick(name);
      },
      [onClick, name]
    );

    const className = useMemo(
      () =>
        `flex items-center w-full px-2 py-1 rounded-md text-left text-sm transition-colors duration-150 ${active ? 'bg-[#001F54] text-white' : 'hover:bg-gray-100 text-gray-800'}`,
      [active]
    );

    return (
      <li>
        <button
          type='button'
          onMouseDown={() => onActivate?.(name)}
          onClick={handleClick}
          className={className}
          aria-pressed={active}
          aria-current={active ? 'page' : undefined}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onActivate?.(name);
              onClick(name);
            }
          }}
        >
          <span
            className='inline-flex items-center justify-center w-6 h-6 mr-2 transition-colors'
            aria-hidden='true'
          >
            {icon}
          </span>
          <span className='flex-grow'>{label}</span>
          {typeof count === 'number' && count > 0 && (
            <span className='inline-flex items-center justify-center px-2 py-1 text-xs font-medium text-white bg-[#6366F1] rounded-full ml-2'>
              {count}
            </span>
          )}
        </button>
      </li>
    );
  }
);

/* ----------------------------
  Sidebar main component
-----------------------------*/
interface SidebarProps {
  onStatusSelect?: (statusId: string) => void;
  onTableReload?: (subItem: string) => void;
}

export const Sidebar = memo(({ onStatusSelect, onTableReload }: SidebarProps = {}) => {
  // ===========================
  // HOOKS SECTION - All state first
  // ===========================

  // Layout hooks
  const { showSidebar } = useLayout();
  const [visible, setVisible] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Router/navigation hooks
  const dispatch = useDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Auth/user hooks
  const { userRole, token, user } = useAuthSync();
  const { loadType, selectedType } = useInbox();
  const isInboxOpen = useSelector((state: any) => state.ui?.isInboxOpen);

  // State management
  const [activeItem, setActiveItem] = useState<string>('');
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({});
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [activeStatusIds, setActiveStatusIds] = useState<number[] | undefined>(undefined);
  const [cookieRole, setCookieRole] = useState<string | undefined>(undefined);
  const [roleConfig, setRoleConfig] = useState(() => getRoleConfig(userRole));

  // Refs
  const isMountedRef = useRef(false);
  const refreshTimerRef = useRef<number | null>(null);

  // Context
  const adminMenuContext = useAdminMenu();

  // ===========================
  // EFFECTS SECTION - All effects after state
  // ===========================

  // Hydration effect
  useEffect(() => {
    setHydrated(true);
  }, []);

  // Restore from localStorage on first mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const url = new URL(window.location.href);
      const typeParam = url.searchParams.get('type');
      if (typeParam) return;
      const stored = window.localStorage?.getItem('activeNavItem');
      if (!stored) return;
      let key = normalizeNavKey(stored);
      if (!key) return;
      if (!key.startsWith('inbox-')) {
        const alt = normalizeNavKey(`inbox-${stored}`);
        if (alt && alt.startsWith('inbox-')) key = alt;
      }
      setActiveItem(prev => {
        if (prev && String(prev).trim().length > 0) return prev;
        try {
          const toStore = key.startsWith('inbox-') ? key.slice('inbox-'.length) : key;
          localStorage.setItem('activeNavItem', toStore);
        } catch (e) {}
        return key;
      });
    } catch (e) {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync admin menu key with pathname
  useEffect(() => {
    const normalizedRole = userRole ? String(userRole).toUpperCase() : cookieRole?.toUpperCase();
    if (!pathname || !normalizedRole?.includes('ADMIN')) return;
    const adminKey = getAdminMenuKeyFromPath(pathname);
    if (adminKey) {
      if (adminMenuContext?.setActiveMenuKey) {
        try {
          adminMenuContext.setActiveMenuKey(adminKey);
        } catch (e) {
          if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
            console.warn('[Sidebar] Failed to set admin menu key:', e);
          }
        }
      }
    }
  }, [pathname, cookieRole, userRole, adminMenuContext]);

  // Preload admin pages
  useEffect(() => {
    const normalizedRole = userRole ? String(userRole).toUpperCase() : cookieRole?.toUpperCase();
    if (normalizedRole?.includes('ADMIN')) {
      preloadAdminPages();
    }
  }, [cookieRole, userRole]);

  // ===========================
  // CALLBACKS SECTION
  // ===========================

  // Persist active nav key
  const persistActiveNavToLocal = useCallback((key?: string) => {
    if (typeof window === 'undefined' || !key) return;
    try {
      const toStore = key.startsWith('inbox-') ? key.slice('inbox-'.length) : key;
      localStorage.setItem('activeNavItem', toStore);
    } catch (e) {
      /* ignore */
    }
  }, []);

  // Normalize navigation keys
  const normalizeNavKey = useCallback((raw?: string | null) => {
    if (!raw) return '';
    const s = String(raw).trim();
    if (s.toLowerCase().startsWith('inbox-')) {
      return `inbox-${s.slice('inbox-'.length).replace(/\s+/g, '').toLowerCase()}`;
    }
    if (
      !s.includes(' ') &&
      s === s.toLowerCase() &&
      ['forwarded', 'returned', 'redflagged', 'reenquiry'].includes(s)
    ) {
      return `inbox-${s.replace(/\s+/g, '').toLowerCase()}`;
    }
    return s.replace(/\s+/g, '').toLowerCase();
  }, []);

  // Read role from cookie
  const getUserRoleFromCookie = useCallback(() => {
    if (typeof window === 'undefined' || !document?.cookie) return undefined;
    try {
      const raw = document.cookie
        .split(';')
        .map(c => c.trim())
        .find(c => c.startsWith('user='));
      if (!raw) return undefined;
      let value = raw.substring('user='.length);
      let decoded = decodeURIComponent(value);
      if (decoded.startsWith('j:')) decoded = decoded.slice(2);
      if (
        (decoded.startsWith('"') && decoded.endsWith('"')) ||
        (decoded.startsWith("'") && decoded.endsWith("'"))
      )
        decoded = decoded.slice(1, -1);
      const parsed = JSON.parse(decoded);
      const roleObj = parsed?.role ?? parsed;
      if (!roleObj) return undefined;
      if (typeof roleObj === 'string') return roleObj.toUpperCase();
      if (typeof roleObj === 'object') {
        if (roleObj.code) return String(roleObj.code).toUpperCase();
        if (roleObj.name) return String(roleObj.name).toUpperCase();
      }
    } catch (err) {
      // ignore
    }
    return undefined;
  }, []);

  // Schedule inbox forwarded refresh
  const scheduleInboxForwardedRefresh = useCallback((targetUrl?: string) => {
    // client-only
    if (typeof window === 'undefined') return;
    try {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }

      const readsForwarded = (() => {
        try {
          const u = targetUrl
            ? new URL(targetUrl, window.location.origin)
            : new URL(window.location.href);
          return (
            (u.pathname === '/inbox' || u.pathname.startsWith('/inbox')) &&
            u.searchParams.get('type') === 'forwarded'
          );
        } catch (e) {
          return false;
        }
      })();

      if (!readsForwarded) return;

      const cookieName = 'inbox_forwarded_refreshed';
      const readCookie = () => {
        const m = document.cookie
          .split(';')
          .map(c => c.trim())
          .find(c => c.startsWith(`${cookieName}=`));
        if (!m) return null;
        return decodeURIComponent(m.split('=')[1]);
      };
      const setCookie = (val: string, minutes = 10) => {
        const d = new Date();
        d.setTime(d.getTime() + minutes * 60 * 1000);
        const expires = 'expires=' + d.toUTCString();
        document.cookie = `${cookieName}=${encodeURIComponent(val)}; ${expires}; path=/`;
      };

      if (readCookie() === 'true') return;
      setCookie('true', 10);

      refreshTimerRef.current = window.setTimeout(() => {
        try {
          const cur = new URL(window.location.href);
          if (
            (cur.pathname === '/inbox' || cur.pathname.startsWith('/inbox')) &&
            cur.searchParams.get('type') === 'forwarded'
          ) {
            window.location.reload();
          }
        } catch (e) {
          // ignore
        }
      }, 4000) as unknown as number;
    } catch (e) {
      // ignore
    }
  }, []);

  useEffect(() => {
    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
    };
  }, []);

  /* ----------------------------
     Build deduped menuItems from roleConfig
  -----------------------------*/
  const menuItems = useMemo(() => {
    const items = (roleConfig?.menuItems ?? []) as Array<{ name: string; statusIds?: number[] }>;
    const map = new Map<
      string,
      { name: string; label: string; icon: React.ReactNode | null; statusIds?: number[] }
    >();
    items.forEach(item => {
      if (!item || !item.name) return;
      const raw = String(item.name).trim();
      const normalized = raw.replace(/\s+/g, '').toLowerCase();
      const canonicalKey = (Object.keys(menuMeta) as string[]).find(
        k => k.toLowerCase() === normalized
      ) as MenuMetaKey | undefined;
      const keyForLabel = canonicalKey ?? (raw as MenuMetaKey);
      const iconFn = canonicalKey
        ? menuMeta[canonicalKey]?.icon
        : menuMeta[keyForLabel as MenuMetaKey]?.icon;
      const label = canonicalKey && menuMeta[canonicalKey] ? menuMeta[canonicalKey].label : raw;

      const existing = map.get(normalized);
      if (existing) {
        const existingIds = existing.statusIds ?? [];
        const incomingIds = Array.isArray(item.statusIds) ? item.statusIds : [];
        const merged = Array.from(new Set([...existingIds, ...incomingIds]));
        existing.statusIds = merged.length ? merged : undefined;
        map.set(normalized, existing);
      } else {
        map.set(normalized, {
          name: raw,
          label,
          icon: iconFn ? (iconFn() as any) : null,
          statusIds:
            Array.isArray(item.statusIds) && item.statusIds.length ? item.statusIds : undefined,
        });
      }
    });
    return Array.from(map.values());
  }, [roleConfig]);

  // Sidebar counts
  const shouldFetchCounts = useMemo(
    () => visible && !cookieRole?.includes('ADMIN'),
    [visible, cookieRole]
  );
  const {
    applicationCounts: rawCounts,
    loading: loadingCounts,
    refreshCounts,
  } = useSidebarCounts(shouldFetchCounts);

  // Stabilized counts object
  const applicationCounts = useMemo(
    () => ({
      forwardedCount: rawCounts?.forwardedCount || 0,
      returnedCount: rawCounts?.returnedCount || 0,
      redFlaggedCount: rawCounts?.redFlaggedCount || 0,
      reEnquiryCount: rawCounts?.reEnquiryCount || 0,
    }),
    [
      rawCounts?.forwardedCount,
      rawCounts?.returnedCount,
      rawCounts?.redFlaggedCount,
      rawCounts?.reEnquiryCount,
    ]
  );

  // State to track previous route for change detection
  const prevRouteStateRef = useRef<RouteTabState | null>(null);

  // Ref to track when handleMenuClick just set activeItem to prevent race condition
  const menuClickSetActiveItemRef = useRef<string | null>(null);
  const menuClickTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /* ----------------------------
     Unified route -> activeItem synchronization
     - Runs on mount to read URL/localStorage
     - Runs on pathname/query changes to sync UI
     - Centralized logic to avoid duplication
  -----------------------------*/
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      // Parse current route state once
      const currentRouteState = extractTabFromRoute(pathname, searchParams);

      // Check if route actually changed (not just hash or unrelated query params)
      const routeChanged = routeStateChanged(prevRouteStateRef.current, currentRouteState);
      prevRouteStateRef.current = currentRouteState;

      // Skip processing if route didn't meaningfully change
      if (!routeChanged && isMountedRef.current) return;

      // Only run setup on first mount
      if (!isMountedRef.current) {
        isMountedRef.current = true;
        const r = getUserRoleFromCookie();
        if (r) setCookieRole(r);
      }

      const { type, isInboxPage, isAdminPage, shouldSkipInboxOpen } = currentRouteState;

      // If on inbox/admin page with type parameter, process the tab selection
      if ((isInboxPage || isAdminPage) && type) {
        // Clear the skip flag and use its value for this navigation
        const wasSkipFlagSet = shouldSkipInboxOpen || clearSkipInboxFlag();

        if (wasSkipFlagSet) {
          // Treat as top-level selection (no inbox- prefix)
          const topKey = normalizeNavKey(type);

          // Only update if this wasn't just set by handleMenuClick
          if (topKey !== menuClickSetActiveItemRef.current) {
            setActiveItem(topKey);
            persistActiveNavToLocal(topKey);
            if (onTableReload) onTableReload(type);
          }
          return;
        }

        // Build normalized active item key for inbox tabs
        const newActiveKey = buildActiveItemFromRoute(type, isInboxPage, false, normalizeNavKey);

        // Only update if this is a new selection AND wasn't just set by handleMenuClick
        if (
          newActiveKey &&
          newActiveKey !== activeItem &&
          newActiveKey !== menuClickSetActiveItemRef.current
        ) {
          setActiveItem(newActiveKey);
          persistActiveNavToLocal(newActiveKey);

          // Load inbox data and optionally open the panel
          try {
            const desiredOpen =
              typeof window !== 'undefined' && window.localStorage
                ? window.localStorage.getItem('inboxDesiredOpen')
                : null;
            if (desiredOpen !== 'false') {
              dispatch(openInbox());
            }
            void loadType(type, false).catch(() => {});
            if (onTableReload) onTableReload(type);

            // Schedule refresh for forwarded inbox
            if (type.toLowerCase() === 'forwarded') {
              scheduleInboxForwardedRefresh();
            }
          } catch (e) {
            if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
              console.warn('[Sidebar] Error loading inbox type:', e);
            }
          }
        }
      } else if (!isMountedRef.current) {
        // On first mount with no URL type param, restore from localStorage
        try {
          const stored = window.localStorage?.getItem('activeNavItem') ?? '';
          if (stored) {
            let key = normalizeNavKey(stored);
            // Recover inbox-{type} semantics if stored without prefix
            if (!key.startsWith('inbox-')) {
              const alt = normalizeNavKey(`inbox-${stored}`);
              if (alt && alt.startsWith('inbox-')) key = alt;
            }
            setActiveItem(key);
            persistActiveNavToLocal(key);
          }
        } catch (e) {
          if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
            console.warn('[Sidebar] Error restoring activeItem from localStorage:', e);
          }
        }
      }
    } catch (e) {
      if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
        console.warn('[Sidebar] Error in route sync effect:', e);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, String(searchParams?.toString())]); // we use stringified params to trigger on query changes

  /* ----------------------------
     Persist activeItem -> localStorage when it actually changes
  -----------------------------*/
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      if (activeItem) {
        persistActiveNavToLocal(activeItem);
      }
    } catch (e) {
      /* ignore */
    }
  }, [activeItem]);

  /* ----------------------------
     Update roleConfig each time user/userRole/cookieRole changes
  -----------------------------*/
  useEffect(() => {
    try {
      const effectiveInput = cookieRole ?? user ?? userRole ?? 'SHO';
      const cfg = getRoleConfig(effectiveInput);
      setRoleConfig(cfg);
      if (process.env.NODE_ENV !== 'production') {
        try {
          console.debug(
            '[Sidebar] effective role input:',
            effectiveInput,
            'roleConfig menuItems:',
            cfg?.menuItems
          );
        } catch (e) {}
      }
    } catch (e) {
      if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
        console.warn('[Sidebar] Failed to update roleConfig:', e);
      }
    }
  }, [cookieRole, userRole, user]);

  /* ----------------------------
     Validate activeItem when menu items change (role change)
  -----------------------------*/
  useEffect(() => {
    if (!activeItem) return;
    const allowed = new Set<string>();
    menuItems.forEach(mi => {
      const k = normalizeNavKey(mi.name as string);
      if (k) allowed.add(k);
    });
    // Always allow inbox-* keys (they can be created from table actions / deep links)
    const normalizedActive = normalizeNavKey(activeItem);
    if (normalizedActive.startsWith('inbox-')) {
      // keep inbox-* as valid even if it's not present in menuItems (it may be a dynamic type)
      return;
    }

    // Ensure a few common fallbacks are present as valid inbox types
    ['forwarded', 'returned', 'redflagged', 'reenquiry'].forEach(t => allowed.add(`inbox-${t}`));

    if (!allowed.has(normalizedActive)) {
      const fallback = menuItems.length
        ? normalizeNavKey(menuItems[0].name as string)
        : 'dashboard';
      setActiveItem(fallback);
      persistActiveNavToLocal(fallback);
    }
  }, [menuItems, activeItem, normalizeNavKey]);

  /* ----------------------------
     Auto-load inbox when activeItem points to inbox-{type}
  -----------------------------*/
  // Auto-load inbox when activeItem points to inbox-{type}
  // We intentionally exclude `activeStatusIds` from deps to avoid triggering
  // the effect when we restore status ids from localStorage (which would loop).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    try {
      if (activeItem && activeItem.startsWith('inbox-')) {
        const t = activeItem.replace('inbox-', '');
        if (!isMountedRef.current) return;
        // open inbox if not open — but respect user's explicit preference
        try {
          const desiredOpen =
            typeof window !== 'undefined' && window.localStorage
              ? window.localStorage.getItem('inboxDesiredOpen')
              : null;
          if (desiredOpen !== 'false') {
            dispatch(openInbox());
          }
        } catch (e) {
          dispatch(openInbox());
        }

        // Try to restore any stored status ids from localStorage, but only set state
        // when the restored value differs from current to avoid extra renders.
        let restoredStatusIds: number[] | undefined = undefined;
        try {
          const s = localStorage.getItem('activeStatusIds');
          if (s) {
            const parsed = JSON.parse(s);
            if (Array.isArray(parsed)) restoredStatusIds = parsed;
            try {
              const cur = activeStatusIds;
              const different = !cur || JSON.stringify(cur) !== JSON.stringify(restoredStatusIds);
              if (restoredStatusIds && different) setActiveStatusIds(restoredStatusIds);
            } catch (e) {
              if (restoredStatusIds) setActiveStatusIds(restoredStatusIds);
            }
          }
        } catch (e) {}

        // call loadType with restored or current activeStatusIds (prefer restored)
        const toPass = restoredStatusIds ?? activeStatusIds ?? undefined;
        void loadType(String(t).toLowerCase(), false, toPass).catch(() => {});
        if (onTableReload) onTableReload(String(t));
      }
    } catch (e) {
      /* ignore */
    }
  }, [activeItem, dispatch, loadType, onTableReload]);

  /* ----------------------------
     Menu click handlers
  -----------------------------*/
  const handleMenuClick = useCallback(
    async (item: { name: string; childs?: { name: string }[]; statusIds?: number[] }) => {
      if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
        console.log(
          '[Sidebar] handleMenuClick - item.name:',
          item.name,
          'userRole:',
          userRole,
          'cookieRole:',
          cookieRole
        );
      }

      try {
        if (item.name.toLowerCase() !== 'inbox') {
          dispatch(closeInbox());
        }

        if (item.childs?.length) {
          const k = normalizeNavKey(item.name as string) || item.name;
          setExpandedMenus(prev => ({ ...prev, [k]: !prev[k] }));
          return;
        }

        const key = normalizeNavKey(item.name as string);

        // Get effective role (use userRole, fall back to cookieRole)
        const effectiveRole = userRole || cookieRole;

        if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
          console.log(
            '[Sidebar] effectiveRole:',
            effectiveRole,
            'isAdminRole result:',
            isAdminRole(effectiveRole)
          );
        }

        // Check if this is an admin user navigating to an admin menu item
        if (isAdminRole(effectiveRole)) {
          // Get the admin path from config using the menu item name
          const adminPath = getAdminPathForMenuItem(item.name);

          if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
            console.log('[Sidebar] Admin user detected. adminPath for', item.name, ':', adminPath);
          }

          if (adminPath) {
            // This is a valid admin menu item
            if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
              console.log('[Sidebar] Navigating to admin path:', adminPath);
            }

            // Set flag to prevent route sync effect from overwriting this selection
            menuClickSetActiveItemRef.current = key;
            if (menuClickTimeoutRef.current) clearTimeout(menuClickTimeoutRef.current);
            menuClickTimeoutRef.current = setTimeout(() => {
              menuClickSetActiveItemRef.current = null;
            }, 100);

            setActiveItem(key);
            persistActiveNavToLocal(key);
            router.push(adminPath);
            return;
          }
        }

        // For non-ADMIN roles: use inbox pattern
        // Special-case: treat certain inbox-like items as top-level selections
        // so clicking them will close the inbox and make the clicked menu item active
        // (no `inbox-` prefix). This prevents URL-driven inbox activation when
        // these are intended to behave as standalone menu entries.
        const topLevelInboxLike = new Set([
          'freshform',
          'sent',
          'closed',
          'drafts',
          'finaldisposal',
        ]);

        if (key && topLevelInboxLike.has(key)) {
          try {
            // ensure inbox is closed immediately in the UI
            dispatch(closeInbox());
            try {
              if (typeof window !== 'undefined' && window.localStorage) {
                window.localStorage.setItem('inboxDesiredOpen', 'false');
              }
            } catch (e) {}
          } catch (e) {}

          // Set flag to prevent route sync effect from overwriting this selection
          menuClickSetActiveItemRef.current = key;
          if (menuClickTimeoutRef.current) clearTimeout(menuClickTimeoutRef.current);
          menuClickTimeoutRef.current = setTimeout(() => {
            menuClickSetActiveItemRef.current = null;
          }, 100);

          setActiveItem(key);
          persistActiveNavToLocal(key);
        } else {
          // Set flag to prevent route sync effect from overwriting this selection
          menuClickSetActiveItemRef.current = key;
          if (menuClickTimeoutRef.current) clearTimeout(menuClickTimeoutRef.current);
          menuClickTimeoutRef.current = setTimeout(() => {
            menuClickSetActiveItemRef.current = null;
          }, 100);

          setActiveItem(key);
        }

        if (item.statusIds && item.statusIds.length) {
          setActiveStatusIds(item.statusIds);
          try {
            localStorage.setItem('activeStatusIds', JSON.stringify(item.statusIds));
          } catch (e) {}
        } else {
          setActiveStatusIds(undefined);
          try {
            localStorage.removeItem('activeStatusIds');
          } catch (e) {}
        }

        if (item.name.toLowerCase().includes('dashboard')) {
          const redirectPath = getRoleBasedRedirectPath(effectiveRole);
          router.push(redirectPath);
          return;
        }

        const type = item.name.replace(/\s+/g, '');
        const wasTopLevel = key && topLevelInboxLike.has(key);
        const target = `/inbox?type=${encodeURIComponent(type)}`;
        if (wasTopLevel) {
          try {
            // set a short-lived session flag so the pathname/searchParams sync
            // effect can detect this navigation and avoid opening the inbox.
            if (typeof window !== 'undefined' && window.sessionStorage) {
              window.sessionStorage.setItem('skipOpenInbox', 'true');
            }
          } catch (e) {}
          // push the URL so it's reflected in the address bar, but the sync
          // effect will read the flag and avoid opening the inbox UI.
          router.push(target);
          scheduleInboxForwardedRefresh(target);
          if (onTableReload) onTableReload(key);
        } else {
          try {
            const inboxKey = normalizeNavKey(`inbox-${type}`);
            if (inboxKey) {
              setActiveItem(inboxKey);
              persistActiveNavToLocal(inboxKey);
            }
          } catch (e) {}
          router.push(target);
          scheduleInboxForwardedRefresh(target);
        }
      } catch (e) {
        if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
          console.warn('[Sidebar] Error in handleMenuClick:', e);
        }
      }
    },
    [cookieRole, userRole, normalizeNavKey, router, scheduleInboxForwardedRefresh, dispatch]
  );

  const handleInboxToggle = useCallback(() => {
    try {
      const newState = !isInboxOpen;
      dispatch(toggleInbox());
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('inboxDesiredOpen', newState ? 'true' : 'false');
      }
    } catch (e) {
      try {
        dispatch(toggleInbox());
      } catch (err) {}
    }
  }, [dispatch, isInboxOpen]);

  const handleInboxSubItemClick = useCallback(
    (subItem: string) => {
      try {
        // Check if admin user is trying to access inbox (should not happen)
        if (isAdminRole(userRole || cookieRole)) {
          // Admin users shouldn't be in inbox - redirect to admin dashboard
          router.push('/admin/userManagement');
          return;
        }

        const activeItemKey = normalizeNavKey(`inbox-${subItem}`);
        setActiveItem(activeItemKey);
        persistActiveNavToLocal(activeItemKey);

        try {
          const desiredOpen =
            typeof window !== 'undefined' && window.localStorage
              ? window.localStorage.getItem('inboxDesiredOpen')
              : null;
          if (desiredOpen !== 'false') {
            if (!isInboxOpen) dispatch(openInbox());
          }
        } catch (e) {
          if (!isInboxOpen) dispatch(openInbox());
        }

        // Resolve statusIds fallback logic
        let customStatusIds: number[] | undefined = activeStatusIds;
        try {
          if (!customStatusIds) {
            const inboxMenu = menuItems.find(
              mi =>
                String(mi.name || '')
                  .replace(/\s+/g, '')
                  .toLowerCase() === 'inbox'
            );
            if (inboxMenu?.statusIds && inboxMenu.statusIds.length)
              customStatusIds = inboxMenu.statusIds;
          }
          if (!customStatusIds) {
            const direct = menuItems.find(
              mi =>
                String(mi.name || '')
                  .replace(/\s+/g, '')
                  .toLowerCase() === String(subItem).replace(/\s+/g, '').toLowerCase()
            );
            if (direct?.statusIds && direct.statusIds.length) customStatusIds = direct.statusIds;
          }
          // Final fallback: known static mappings for some inbox types
          if (!customStatusIds) {
            try {
              const normalized = String(subItem).replace(/\s+/g, '').toLowerCase();
              if (normalized === 'reenquiry') {
                customStatusIds = [5];
              }
            } catch (e) {
              /* ignore */
            }
          }
        } catch (e) {
          /* ignore */
        }

        // If user clicked the same inbox type that's already selected, force a reload
        const forceReload =
          !!selectedType && String(selectedType).toLowerCase() === String(subItem).toLowerCase();
        void loadType(String(subItem), forceReload, customStatusIds).catch(() => {});

        const targetBase = '/inbox';
        const targetUrl = `${targetBase}?type=${encodeURIComponent(subItem)}`;

        const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
        const isOnInboxBase = currentPath === '/inbox' || currentPath.startsWith('/inbox');

        if (isOnInboxBase) {
          try {
            window.history.replaceState(null, '', targetUrl);
          } catch (e) {}
          if (onTableReload) onTableReload(subItem);
        } else {
          router.push(targetUrl);
          scheduleInboxForwardedRefresh(targetUrl);
        }
      } catch (e) {
        if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
          console.warn('[Sidebar] Error in handleInboxSubItemClick:', e);
        }
      }
    },
    [
      activeStatusIds,
      cookieRole,
      userRole,
      dispatch,
      loadType,
      menuItems,
      onTableReload,
      router,
      scheduleInboxForwardedRefresh,
      normalizeNavKey,
      isInboxOpen,
    ]
  );

  /* ----------------------------
     Memoize active item checker to avoid recalculation on every render
  -----------------------------*/
  const isItemActive = useCallback(
    (itemName: string) => {
      if (!itemName || !activeItem) return false;
      const normalizedKey = normalizeNavKey(itemName);

      // Direct match
      if (activeItem === normalizedKey) return true;

      // Check if any child of this menu item is active (for hierarchical menus)
      if (String(activeItem).startsWith(`${normalizedKey}-`)) return true;

      return false;
    },
    [activeItem, normalizeNavKey]
  );

  const handleLogout = useCallback(async () => {
    if (token) {
      await dispatch(logoutUser() as any);
      await new Promise(res => setTimeout(res, 250));
    }
    router.push('/login');
  }, [dispatch, router, token]);

  /* ----------------------------
     Visible & role guard
  -----------------------------*/
  useEffect(() => {
    if (showSidebar) setVisible(true);
    else setTimeout(() => setVisible(false), 400);
  }, [showSidebar]);

  /* ----------------------------
     Icons / inboxSubItems
  -----------------------------*/
  const forwardedIcon = useMemo(
    () => <CornerUpRightFixed className='w-6 h-6 mr-2' aria-label='Forwarded' />,
    []
  );
  const returnedIcon = useMemo(
    () => <Undo2Fixed className='w-6 h-6 mr-2' aria-label='Returned' />,
    []
  );
  const redFlaggedIcon = useMemo(
    () => <FlagFixed className='w-6 h-6 mr-2' aria-label='Red Flagged' />,
    []
  );
  const reenquiryIcon = useMemo(
    () => <RefreshCcwFixed className='w-6 h-6 mr-2' aria-label='Re Enquiry' />,
    []
  );

  const inboxSubItems = useMemo(() => {
    // Get valid inbox types (either from menu items or fallback defaults)
    const validTypes = new Set<string>();

    // First, add any inbox types from menu items
    menuItems.forEach(mi => {
      try {
        const k = normalizeNavKey(mi.name as string);
        if (k.startsWith('inbox-')) {
          const typeOnly = k.replace('inbox-', '');
          validTypes.add(typeOnly);
        }
      } catch (e) {
        /* ignore */
      }
    });

    // If no menu items defined inbox types, use standard defaults
    if (validTypes.size === 0) {
      getValidInboxTypes().forEach(t => validTypes.add(t));
    } else {
      // Otherwise, ensure common types are also present
      getValidInboxTypes().forEach(t => validTypes.add(t));
    }

    // Build display items
    const iconMap: Record<string, React.ReactNode> = {
      forwarded: forwardedIcon,
      returned: returnedIcon,
      redflagged: redFlaggedIcon,
      reenquiry: reenquiryIcon,
    };

    const countMap: Record<string, number> = {
      forwarded: applicationCounts?.forwardedCount || 0,
      returned: applicationCounts?.returnedCount || 0,
      redflagged: applicationCounts?.redFlaggedCount || 0,
      reenquiry: applicationCounts?.reEnquiryCount || 0,
    };

    const labelFor = (n: string) =>
      n.toLowerCase() === 'redflagged' ? 'Red Flagged' : n.charAt(0).toUpperCase() + n.slice(1);

    return Array.from(validTypes).map(name => ({
      name,
      label: labelFor(name),
      icon: iconMap[name] ?? forwardedIcon,
      count: countMap[name] ?? 0,
    }));
  }, [
    menuItems,
    normalizeNavKey,
    forwardedIcon,
    returnedIcon,
    redFlaggedIcon,
    reenquiryIcon,
    applicationCounts?.forwardedCount,
    applicationCounts?.returnedCount,
    applicationCounts?.redFlaggedCount,
    applicationCounts?.reEnquiryCount,
  ]);

  /* ----------------------------
     Cleanup: Clear timeout when component unmounts
  -----------------------------*/
  useEffect(() => {
    return () => {
      if (menuClickTimeoutRef.current) {
        clearTimeout(menuClickTimeoutRef.current);
        menuClickTimeoutRef.current = null;
      }
    };
  }, []);

  const effectiveRole = cookieRole ?? userRole;
  // During SSR or before hydration we return null to keep server and
  // initial client HTML identical. After hydration we render normally.
  if (!hydrated) return null;
  if (!visible && !showSidebar) return null;
  if (!effectiveRole) return null;

  /* ----------------------------
     Render
  -----------------------------*/
  return (
    <>
      <div className='md:hidden fixed top-4 left-4 z-50'>
        <HamburgerButton open={mobileSidebarOpen} onClick={() => setMobileSidebarOpen(v => !v)} />
      </div>
      <aside
        className={`z-40 w-[80vw] max-w-xs md:w-[18%] h-screen bg-white border-r border-gray-200 fixed left-0 top-0
        ${showSidebar || mobileSidebarOpen ? 'opacity-100 transform translate-x-0' : 'opacity-0 pointer-events-none -translate-x-full'}
        md:opacity-100 md:transform md:translate-x-0 md:pointer-events-auto`}
      >
        <div className='p-4 flex items-center border-b border-gray-100'>
          <ImageFixed
            src='/icon-alms.svg'
            alt='Arms License Icon'
            width={52}
            height={52}
            className='mr-2'
          />
          <h1 className='text-lg font-bold'>Arms License</h1>
        </div>
        <div className='bg-[#001F54] text-white p-4 flex items-center'>
          <span className='mr-3'>
            <svg
              xmlns='http://www.w3.org/2000/svg'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
              strokeLinecap='round'
              strokeLinejoin='round'
              className='w-5 h-5'
            >
              <path d='M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2' />
              <circle cx='12' cy='7' r='4' />
            </svg>
          </span>
          <span className='font-bold'>{roleConfig?.dashboardTitle ?? 'Dashboard'}</span>
        </div>

        <nav className='flex-1 overflow-y-auto py-2 px-2'>
          <ul className='space-y-1'>
            {effectiveRole !== 'ADMIN' && (
              <li>
                {/* highlight Inbox when any inbox-{type} is active, not only when the panel is expanded */}
                <button
                  type='button'
                  onClick={handleInboxToggle}
                  className={`flex items-center w-full px-4 py-2 rounded-md text-left ${
                    (activeItem && String(activeItem).startsWith('inbox-')) || isInboxOpen
                      ? 'bg-[#001F54] text-white'
                      : 'hover:bg-gray-100 text-gray-800'
                  }`}
                >
                  <span
                    className='inline-flex items-center justify-center w-6 h-6 mr-2 group-hover:text-indigo-600 transition-colors'
                    aria-hidden='true'
                  >
                    {menuMeta.inbox.icon() as any}
                  </span>
                  <span className='flex-grow'>{menuMeta.inbox.label}</span>
                  <span className='ml-2'>{isInboxOpen ? '▾' : '▸'}</span>
                </button>
                {isInboxOpen && (
                  <ul className='ml-8 mt-1 space-y-1' role='menu'>
                    {inboxSubItems.map(sub => {
                      const isActive = activeItem === normalizeNavKey(`inbox-${sub.name}`);
                      return (
                        <InboxSubMenuItem
                          key={`inbox-sub-${sub.name}`}
                          name={sub.name}
                          label={sub.label}
                          icon={sub.icon}
                          count={sub.count}
                          active={isActive}
                          onClick={handleInboxSubItemClick}
                          onActivate={name => {
                            try {
                              const activeItemKey = normalizeNavKey(`inbox-${name}`);
                              setActiveItem(activeItemKey);
                              persistActiveNavToLocal(activeItemKey);
                            } catch (e) {}
                          }}
                        />
                      );
                    })}
                  </ul>
                )}
              </li>
            )}

            {menuItems
              .filter(
                item =>
                  String(item.name || '')
                    .replace(/\s+/g, '')
                    .toLowerCase() !== 'inbox'
              )
              .map(item => {
                const normalizedKey = normalizeNavKey(item.name as string);

                return (
                  <MenuItem
                    key={`menu-${normalizedKey}`}
                    icon={item.icon}
                    label={item.label}
                    active={isItemActive(item.name as string)}
                    onClick={() => handleMenuClick({ name: item.name, statusIds: item.statusIds })}
                    onActivate={() => {
                      try {
                        setActiveItem(normalizedKey);
                        persistActiveNavToLocal(normalizedKey);
                      } catch (e) {}
                    }}
                  />
                );
              })}
          </ul>
        </nav>

        <div className='absolute bottom-0 w-full p-4 border-t border-gray-200'>
          <button
            type='button'
            onClick={handleLogout}
            className='flex items-center w-full px-4 py-2 rounded-md text-left transition-colors duration-150 hover:bg-gray-100 text-gray-800'
          >
            <span
              className='inline-flex items-center justify-center w-6 h-6 mr-2'
              aria-hidden='true'
            >
              <svg
                xmlns='http://www.w3.org/2000/svg'
                fill='none'
                viewBox='0 0 24 24'
                strokeWidth='1.5'
                stroke='currentColor'
                className='w-6 h-6'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  d='M15.75 9V5.25A2.25 2.25 0 0013.5 3h-9A2.25 2.25 0 002.25 5.25v13.5A2.25 2.25 0 004.5 21h9a2.25 2.25 0 002.25-2.25V15'
                />
                <path strokeLinecap='round' strokeLinejoin='round' d='M18 12H9m3-3l-3 3 3 3' />
              </svg>
            </span>
            Logout
          </button>
        </div>
      </aside>
    </>
  );
});
