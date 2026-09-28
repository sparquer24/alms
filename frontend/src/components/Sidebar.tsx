'use client';

import React, {
  memo,
  useCallback,
  useMemo,
  useState,
  useEffect,
  startTransition,
  useRef,
} from 'react';
import Image from 'next/image';
const ImageFixed = Image as any;

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { CornerUpRight, Undo2, Flag, FolderCheck, RefreshCcw, List, ChevronDown, ChevronRight } from 'lucide-react';

const CornerUpRightFixed = CornerUpRight as any;
const Undo2Fixed = Undo2 as any;
const FlagFixed = Flag as any;
const FolderCheckFixed = FolderCheck as any;
const RefreshCcwFixed = RefreshCcw as any;
const ListFixed = List as any;

import { logoutUser } from '../store/thunks/authThunks';
import { toggleInbox, openInbox, closeInbox } from '../store/slices/uiSlice';
import { useAuth } from '@/hooks/useAuth';
import { useLayout } from '../config/layoutContext';
import { useInbox } from '../context/InboxContext';
import { useGlobalAction } from '../context/GlobalActionContext';
import { useSidebarCounts } from '../hooks/useSidebarCounts';
import { menuMeta, MenuMetaKey } from '../config/menuMeta';
import { getRoleConfig } from '../config/roles';
import { getRoleBasedRedirectPath } from '../config/roleRedirections';
import { isAdminRole } from '../utils/roleUtils';
import { useAdminMenu } from '../context/AdminMenuContext';
import {
  getAdminMenuKeyFromPath,
  getAdminMenuItems,
  getAdminPathForMenuItem,
} from '../config/adminMenuService';
import { getSuperAdminPathForMenuItem } from '../config/superAdminMenuService';
import { preloadAdminPages } from '../utils/adminPagePreloader';
import { HamburgerButton } from './HamburgerButton';

/* ----------------------------
  Small helper memo components
   - keep these simple and memoized
-----------------------------*/
interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
  count?: number;
  active?: boolean;
  loading?: boolean;
  onClick?: () => void;
  onActivate?: () => void;
}
const MenuItem = memo(({ icon, label, count, active, loading, onClick, onActivate }: MenuItemProps) => (
  <li>
    <button
      type='button'
      onMouseDown={onActivate}
      onClick={onClick}
      className={`flex items-center w-full px-0 py-2 rounded-md text-left text-sm transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#001F54] focus-visible:ring-offset-2
        ${active ? 'bg-[#001F54] text-white font-medium shadow-sm' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}
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
      <span className={`inline-flex items-center justify-center w-7 h-7 mr-3 flex-shrink-0 transition-colors pl-3 ${active ? 'text-white' : 'text-gray-500'}`} aria-hidden='true'>
        {icon}
      </span>
      <span className='flex-1 truncate'>{label}</span>
      <span className='pr-3'></span>
      {count !== undefined && count > 0 && (
        <span className={`inline-flex items-center justify-center min-w-[22px] h-5 px-1.5 text-xs font-semibold rounded-full ml-2 transition-colors ${
          active ? 'bg-white/20 text-white font-bold' : 'bg-[#0F2D52] text-white'
        }`}>
          {count > 99 ? '99+' : count}
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
    loading,
    onClick,
    onActivate,
  }: {
    name: string;
    label: string;
    icon: React.ReactNode;
    count?: number;
    active: boolean;
    loading?: boolean;
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
        `flex items-center w-full px-0 py-2 rounded-md text-left text-sm transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#001F54] focus-visible:ring-offset-2 ${active ? 'bg-[#001F54] text-white font-medium shadow-sm' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`,
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
            className={`inline-flex items-center justify-center w-7 h-7 mr-3 flex-shrink-0 transition-colors pl-3 ${active ? 'text-white' : 'text-gray-500'}`}
            aria-hidden='true'
          >
            {icon}
          </span>
          <span className='flex-1 truncate'>{label}</span>
          {typeof count === 'number' && count > 0 && (
            <span className={`inline-flex items-center justify-center min-w-[22px] h-5 px-1.5 text-xs font-semibold rounded-full ml-2 mr-3 transition-colors ${
              active ? 'bg-white/20 text-white font-bold' : 'bg-[#0F2D52] text-white'
            }`}>
              {count > 99 ? '99+' : count}
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
  const { showSidebar } = useLayout();
  const [visible, setVisible] = useState(false);
  const dispatch = useDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { userRole, token, user } = useAuth();
  const { loadType, selectedType, isLoading: isInboxLoading } = useInbox();
  const { isActionInProgress, startAction, endAction, canNavigateTo, setActiveNavigationPath } =
    useGlobalAction();
  const isMountedRef = useRef(false);
  const isInboxOpen = useSelector((state: any) => state.ui?.isInboxOpen); // moved up so other handlers can read it

  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setHydrated(true);
  }, []);

  // avoid reading window/localStorage during render — init blank and sync on client
  const [activeItem, setActiveItem] = useState<string>('');
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({});
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [activeStatusIds, setActiveStatusIds] = useState<number[] | undefined>(undefined);
  const [cookieRole, setCookieRole] = useState<string | undefined>(undefined);
  const [roleConfig, setRoleConfig] = useState(() => getRoleConfig(userRole));

  // Get admin menu context (optional, may not be available)
  const adminMenuContext = useAdminMenu();

  /* ----------------------------
     Route -> active key derivation (single source of truth)
     - Active tab is always computed from the current pathname/query,
       never from localStorage. localStorage is only used as a fallback
       when the route itself carries no derivable nav state (e.g. bare
       `/inbox` with no `type` query, right after a fresh login).
  -----------------------------*/
  const searchParamsKey = searchParams ? searchParams.toString() : '';

  const routeState = useMemo(() => {
    const effectiveRole = cookieRole ?? userRole;
    if (!pathname) return { activeKey: '', inboxType: null as string | null };

    if (isAdminRole(effectiveRole)) {
      if (pathname === '/dashboard' || pathname.startsWith('/dashboard')) {
        return { activeKey: 'dashboard', inboxType: null };
      }
      const adminKey = getAdminMenuKeyFromPath(pathname);
      if (adminKey) return { activeKey: adminKey, inboxType: null };
      // Fall through to the /inbox?type=... derivation below — admins can
      // land there via drill-downs (e.g. the Analytics Dashboard summary
      // cards linking to /inbox?type=cancel) and the matching sidebar item
      // should still highlight even though it isn't one of ADMIN_MENU_ITEMS.
    }

    if (pathname.startsWith('/cancelForm')) {
      return { activeKey: 'cancelform', inboxType: null };
    }

    const params = new URLSearchParams(searchParamsKey);
    const type = params.get('type');
    if ((pathname === '/inbox' || pathname.startsWith('/admin')) && type) {
      const rawType = String(type).toLowerCase();
      const topLevelMap: Record<string, string> = {
        sent: 'sent',
        closed: 'closed',
        drafts: 'drafts',
        cancel: 'cancelform',
        cancelform: 'cancelform',
        freshform: 'freshform',
        applications: 'applications',
      };
      if (topLevelMap[rawType]) {
        return { activeKey: topLevelMap[rawType], inboxType: rawType };
      }
      return { activeKey: `inbox-${rawType}`, inboxType: rawType };
    }

    return { activeKey: '', inboxType: null };
  }, [pathname, searchParamsKey, cookieRole, userRole]);

  // Keep activeItem in sync with the route-derived key. Click handlers set
  // activeItem optimistically before navigating; once the route updates,
  // this recomputes to the same value, so there is no need for a "freeze"
  // window to prevent the two from fighting each other.
  useEffect(() => {
    if (routeState.activeKey) {
      setActiveItem(routeState.activeKey);
      persistActiveNavToLocal(routeState.activeKey);
      if (isAdminRole(cookieRole ?? userRole) && adminMenuContext?.setActiveMenuKey) {
        adminMenuContext.setActiveMenuKey(routeState.activeKey as any);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeState.activeKey]);

  // Drive inbox data loading from the route's `type` query param.
  // InboxContext.loadType already no-ops when the type is unchanged and not
  // forced, so this naturally avoids duplicate fetches on repeat visits.
  useEffect(() => {
    if (!routeState.inboxType) return;
    if (isAdminRole(cookieRole ?? userRole)) return;

    const rawType = routeState.inboxType;
    const skip =
      typeof window !== 'undefined' && window.sessionStorage
        ? window.sessionStorage.getItem('skipOpenInbox') === 'true'
        : false;
    try {
      if (skip && typeof window !== 'undefined' && window.sessionStorage) {
        window.sessionStorage.removeItem('skipOpenInbox');
      }
    } catch (e) {}

    const topLevelInboxLike = new Set(['sent', 'closed', 'drafts', 'cancelform', 'freshform', 'applications']);
    try {
      if (skip || topLevelInboxLike.has(routeState.activeKey)) {
        dispatch(closeInbox());
      } else {
        const desiredOpen =
          typeof window !== 'undefined' && window.localStorage
            ? window.localStorage.getItem('inboxDesiredOpen')
            : null;
        if (desiredOpen !== 'false') {
          dispatch(openInbox());
        }
      }
      void loadType(rawType, false).catch(() => {});
      if (onTableReload) onTableReload(rawType);
      if (rawType === 'forwarded') scheduleInboxForwardedRefresh();
    } catch (e) {
      /* swallow */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeState.inboxType, routeState.activeKey, cookieRole, userRole]);

  // Fallback: when the route carries no derivable nav state (e.g. bare
  // `/inbox` with no `type` query), restore the last-selected item from
  // localStorage once on mount so the sidebar isn't blank.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (routeState.activeKey) return; // URL already won
    if (isAdminRole(cookieRole ?? userRole)) return;
    try {
      const isLoginRedirect = sessionStorage?.getItem('loginRedirectApplied') === 'true';
      if (isLoginRedirect) {
        try {
          sessionStorage.removeItem('loginRedirectApplied');
        } catch (e) {}
        return;
      }
      const stored = window.localStorage?.getItem('activeNavItem') ?? '';
      if (!stored) return;
      let key = normalizeNavKey(stored);
      if (!key) return;
      if (!key.startsWith('inbox-')) {
        const alt = normalizeNavKey(`inbox-${stored}`);
        if (alt && alt.startsWith('inbox-')) key = alt;
      }
      setActiveItem(prev => (prev ? prev : key));
    } catch (e) {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Preload admin pages once on mount
  useEffect(() => {
    const normalizedRole = userRole ? String(userRole).toUpperCase() : cookieRole?.toUpperCase();
    if (normalizedRole?.includes('ADMIN')) {
      preloadAdminPages();
    }
  }, [cookieRole, userRole]);

  // Persist active nav key to localStorage but store inbox types without the `inbox-` prefix
  const persistActiveNavToLocal = useCallback((key?: string) => {
    if (typeof window === 'undefined' || !key) return;
    try {
      const toStore = key.startsWith('inbox-') ? key.slice('inbox-'.length) : key;
      localStorage.setItem('activeNavItem', toStore);
    } catch (e) {
      /* ignore */
    }
  }, []);

  // timer for scheduled refresh
  const refreshTimerRef = useRef<number | null>(null);

  // Sidebar counts hook — fetch as soon as sidebar is shown (use showSidebar, not visible,
  // because `visible` starts false and is updated asynchronously in an effect)
  const shouldFetchCounts = useMemo(
    () => showSidebar && !cookieRole?.includes('ADMIN'),
    [showSidebar, cookieRole]
  );
  const {
    applicationCounts: rawCounts,
    loading: loadingCounts,
    refreshCounts,
  } = useSidebarCounts(shouldFetchCounts);

  // stabilized counts object to avoid re-renders
  const applicationCounts = useMemo(
    () => ({
      forwardedCount: rawCounts?.forwardedCount || 0,
      returnedCount: rawCounts?.returnedCount || 0,
      redFlaggedCount: rawCounts?.redFlaggedCount || 0,
      reEnquiryCount: rawCounts?.reEnquiryCount || 0,
      allCount: rawCounts?.allCount || 0,
    }),
    [
      rawCounts?.forwardedCount,
      rawCounts?.returnedCount,
      rawCounts?.redFlaggedCount,
      rawCounts?.reEnquiryCount,
      rawCounts?.allCount,
    ]
  );

  /* ----------------------------
     Utility: normalize nav key
  -----------------------------*/
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

  /* ----------------------------
     Client-only: read role cookie once on mount
  -----------------------------*/
  const getUserRoleFromCookie = useCallback(() => {
    if (typeof window === 'undefined' || !document?.cookie) return undefined;
    try {
      const raw = document.cookie
        .split(';')
        .map(c => c.trim())
        .find(c => c.startsWith('user='));
      if (!raw) return undefined;
      const value = raw.substring('user='.length);
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

  /* ----------------------------
     scheduleInboxForwardedRefresh (kept but guarded)
  -----------------------------*/
  const scheduleInboxForwardedRefresh = useCallback((targetUrl?: string) => {
    // Previously this scheduled a forced window reload for forwarded inbox.
    // That behavior caused an unexpected sidebar refresh after clicking.
    // We disable the auto-reload to keep navigation smooth and client-side.
    if (refreshTimerRef.current) {
      try {
        clearTimeout(refreshTimerRef.current);
      } catch (e) {}
      refreshTimerRef.current = null;
    }
    return;
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

  /* ----------------------------
     Client-only initialization: read the role cookie once on mount.
  -----------------------------*/
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (isMountedRef.current) return;
    isMountedRef.current = true;
    const r = getUserRoleFromCookie();
    if (r) setCookieRole(r);
    try {
      sessionStorage?.removeItem('loginRedirectApplied');
    } catch (e) {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Admin fallback: if we're an admin on a path that doesn't map to a known
  // admin menu item (routeState.activeKey is empty), default to the first
  // admin menu item so the sidebar isn't blank.
  useEffect(() => {
    const effectiveRole = cookieRole ?? userRole;
    if (!isAdminRole(effectiveRole) || routeState.activeKey) return;
    try {
      const adminItems = getAdminMenuItems();
      if (adminItems.length > 0) {
        const firstAdminKey = normalizeNavKey(adminItems[0].name);
        setActiveItem(prev => (prev ? prev : firstAdminKey));
      }
    } catch (e) {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeState.activeKey, cookieRole, userRole]);

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
  }, [cookieRole, userRole, user]);

  /* ----------------------------
     Validate activeItem when menu items change (role change)
     - The route is the single source of truth (see routeState above), so if
       the route already resolves to an activeKey, never second-guess it here.
       Without this guard, a transient/incomplete roleConfig during
       hydration (e.g. the 'SHO' default used before the real role loads)
       could momentarily report the correct route-derived item (e.g.
       'cancelform') as "not in this role's menu" and stomp it back to some
       fallback, even though the route itself is unambiguous.
  -----------------------------*/
  useEffect(() => {
    if (!activeItem) return;
    if (routeState.activeKey) return;

    const effectiveRole = cookieRole ?? userRole;
    const isAdmin = isAdminRole(effectiveRole);

    // For admin users, validate against admin menu items
    if (isAdmin) {
      const adminMenuItems = getAdminMenuItems();
      const allowed = new Set<string>();
      adminMenuItems.forEach(mi => {
        const k = normalizeNavKey(mi.name as string);
        if (k) allowed.add(k);
      });

      const normalizedActive = normalizeNavKey(activeItem);

      // Admins can legitimately land on /inbox?type=... via drill-downs (e.g.
      // Analytics dashboard charts) even though those keys aren't part of
      // ADMIN_MENU_ITEMS — don't stomp the route-derived key back to
      // "dashboard" in that case.
      const inboxDrilldownKeys = new Set([
        'sent',
        'closed',
        'drafts',
        'cancelform',
        'freshform',
        'applications',
      ]);
      if (inboxDrilldownKeys.has(normalizedActive) || normalizedActive.startsWith('inbox-')) {
        return;
      }

      if (!allowed.has(normalizedActive)) {
        // Fallback to first admin item or userManagement
        const fallback = normalizeNavKey(adminMenuItems[0]?.name as string) || 'usermanagement';
        setActiveItem(fallback);
        persistActiveNavToLocal(fallback);
      }
      return;
    }

    // For non-admin users, validate against regular menu items
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
  }, [menuItems, activeItem, normalizeNavKey, cookieRole, userRole, routeState.activeKey]);

  /* ----------------------------
     Auto-load inbox when activeItem points to inbox-{type}
  -----------------------------*/
  // Auto-load inbox when activeItem points to inbox-{type}
  // We intentionally exclude `activeStatusIds` from deps to avoid triggering
  // the effect when we restore status ids from localStorage (which would loop).
   
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
      const actionId = `menu-${item.name.toLowerCase().replace(/\s+/g, '')}`;

      // Prevent repeated clicks on the same menu item while its action is in progress
      if (isActionInProgress(actionId) || isInboxLoading) {
        console.debug('[Sidebar] Menu click blocked - action in progress:', actionId);
        return;
      }
      // Only block navigation if same actionId is in progress
      // (canNavigateTo now accepts actionId)
      // Start the action to block duplicate clicks for this menu item
      if (!startAction(actionId)) {
        console.debug('[Sidebar] Menu click blocked - could not start action:', actionId);
        return;
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

        // Check if this is an admin user navigating to an admin menu item
        if (isAdminRole(effectiveRole)) {
          // Check if SUPER_ADMIN or ADMIN and get appropriate path
          const isSuperAdmin = effectiveRole === 'SUPER_ADMIN';
          const adminPath = isSuperAdmin
            ? getSuperAdminPathForMenuItem(item.name)
            : getAdminPathForMenuItem(item.name);

          if (adminPath) {

            // Only navigate if not already on this path
            if (typeof window !== 'undefined') {
              const currentPath = window.location.pathname;
              if (currentPath === adminPath) {
                // Already on this page, just update active item
                setActiveItem(key);
                persistActiveNavToLocal(key);
                return;
              }
            }

            // Check if we can navigate to this path
            if (!canNavigateTo(adminPath)) {
              console.debug('[Sidebar] Navigation blocked by global action:', adminPath);
              return;
            }

            setActiveItem(key);
            persistActiveNavToLocal(key);
            router.push(adminPath);
            return;
          }
        }

        // For non-ADMIN roles: use inbox pattern
        // Special-case: treat certain inbox-like items as top-level selections
        const topLevelInboxLike = new Set([
          'freshform',
          'sent',
          'closed',
          'drafts',
          "applications",
          'cancelform',
        ]);

        if (key && topLevelInboxLike.has(key)) {
          try {
            dispatch(closeInbox());
            try {
              if (typeof window !== 'undefined' && window.localStorage) {
                window.localStorage.setItem('inboxDesiredOpen', 'false');
              }
            } catch (e) {}
          } catch (e) {}
          setActiveItem(key);
          persistActiveNavToLocal(key);
          // For 'sent', trigger navigation to inbox with type=sent and load data
          if (key === 'sent') {
            const sentPath = '/inbox?type=sent';
            if (!canNavigateTo(sentPath)) {
              return;
            }
            // Pre-load the sent data into InboxContext so the table renders immediately on arrival
            void loadType('sent', false, item.statusIds).catch(() => {});
            router.push(sentPath);
            endAction(actionId);
            return;
          }
        } else {
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

          // Only navigate if not already on this path
          if (typeof window !== 'undefined') {
            const currentPath = window.location.pathname + window.location.search;
            if (currentPath !== redirectPath) {
              if (!canNavigateTo(redirectPath)) {
                return;
              }
              router.push(redirectPath);
              endAction(actionId);
            }
          }
          return;
        }

        // Handle cancelform menu item (now displays inside the unified inbox)
        if (item.name.toLowerCase().replace(/\s+/g, '') === 'cancelform') {
          const cancelPath = '/inbox?type=cancel';
          if (!canNavigateTo(cancelPath)) {
            return;
          }
          setActiveItem(key);
          persistActiveNavToLocal(key);
          // Pre-load cancel requests data
          void loadType('cancel', false, item.statusIds).catch(() => {});
          router.push(cancelPath);
          endAction(actionId);
          return;
        }



        const type = item.name.replace(/\s+/g, '').toLowerCase();
        const wasTopLevel = key && topLevelInboxLike.has(key);
        const target = `/inbox?type=${encodeURIComponent(type)}`;

        // Only navigate if not already on this path
        let isSamePath = false;
        if (typeof window !== 'undefined') {
          const currentPath = window.location.pathname + window.location.search;
          if (currentPath === target) {
            isSamePath = true;
          }
        }

        if (!canNavigateTo(target) && !isSamePath) {
          return;
        }

        if (wasTopLevel) {
          try {
            if (typeof window !== 'undefined' && window.sessionStorage) {
              window.sessionStorage.setItem('skipOpenInbox', 'true');
            }
          } catch (e) {}
          // Always pre-load data into InboxContext (force=true when already on same page)
          void loadType(type, isSamePath, item.statusIds).catch(() => {});
          if (isSamePath) {
            if (onTableReload) onTableReload(key);
          } else {
            router.push(target);
            endAction(actionId);
            scheduleInboxForwardedRefresh(target);
            if (onTableReload) onTableReload(key);
          }
        } else {
          try {
            const inboxKey = normalizeNavKey(`inbox-${type}`);
            if (inboxKey) {
              setActiveItem(inboxKey);
              persistActiveNavToLocal(inboxKey);
            }
          } catch (e) {}
          if (isSamePath) {
            // If already on this page, force reload data
            await loadType(type, true, item.statusIds).catch(() => {});
          } else {
            router.push(target);
            endAction(actionId);
            scheduleInboxForwardedRefresh(target);
          }
        }
      } finally {
        endAction(actionId);
      }
    },
    [
      cookieRole,
      userRole,
      normalizeNavKey,
      router,
      scheduleInboxForwardedRefresh,
      dispatch,
      isActionInProgress,
      isInboxLoading,
      startAction,
      endAction,
      canNavigateTo,
      setActiveNavigationPath,
      onTableReload,
      persistActiveNavToLocal,
    ]
  );

  const handleInboxToggle = useCallback(() => {
    try {
      const newState = !isInboxOpen;
      
      // When clicking Inbox button (not just toggling), navigate to show all inbox items
      if (!isInboxOpen) {
        // Opening inbox - navigate to combined view
        const activeItemKey = normalizeNavKey('inbox-all');
        setActiveItem(activeItemKey);
        persistActiveNavToLocal(activeItemKey);
        
        // Navigate to combined inbox view
        router.push('/inbox?type=all');
      }
      
      dispatch(toggleInbox());
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('inboxDesiredOpen', newState ? 'true' : 'false');
      }
    } catch (e) {
      try {
        dispatch(toggleInbox());
      } catch (err) {}
    }
  }, [dispatch, isInboxOpen, normalizeNavKey, persistActiveNavToLocal, setActiveItem, router]);

  const handleInboxSubItemClick = useCallback(
    async (subItem: string) => {
      const actionId = `inbox-${subItem.toLowerCase().replace(/\s+/g, '')}`;

      // Prevent repeated clicks on the same sub-item while its action is in progress
      if (isActionInProgress(actionId) || isInboxLoading) {
        console.debug('[Sidebar] Inbox sub-item click blocked - action in progress:', actionId);
        return;
      }
      // Only block navigation if same actionId is in progress
      // (canNavigateTo now accepts actionId)
      if (!startAction(actionId)) {
        console.debug('[Sidebar] Inbox sub-item click blocked - could not start action:', actionId);
        return;
      }

      try {
        // Check if admin user is trying to access inbox (should not happen)
        if (isAdminRole(userRole || cookieRole)) {
          // Admin users shouldn't be in inbox - redirect to role-appropriate dashboard
          const redirectPath = getRoleBasedRedirectPath(userRole || cookieRole);
          router.push(redirectPath);
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
        let customStatusIds: number[] | undefined = undefined;
        try {
          const isAllTab = String(subItem).toLowerCase() === 'all';
          if (isAllTab) {
            customStatusIds = activeStatusIds;
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
          } else {
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

        // Clear loading state immediately — loadType has its own loading indicator
        endAction(actionId);

        // If user clicked the same inbox type that's already selected, force a reload
        const forceReload =
          !!selectedType && String(selectedType).toLowerCase() === String(subItem).toLowerCase();
        await loadType(String(subItem), forceReload, customStatusIds).catch(() => {});

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
          if (canNavigateTo(targetUrl)) {
            router.push(targetUrl);
            scheduleInboxForwardedRefresh(targetUrl);
          }
        }
      } finally {
        // Always release the lock for this actionId
        endAction(actionId);
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
      isActionInProgress,
      isInboxLoading,
      startAction,
      endAction,
      canNavigateTo,
      setActiveNavigationPath,
      selectedType,
      persistActiveNavToLocal,
    ]
  );

  const handleLogout = useCallback(async () => {
    if (token) {
      await dispatch(logoutUser() as any);
      await new Promise(res => setTimeout(res, 250));
    }
    router.push('/login');
  }, [dispatch, router, token]);

  /* ----------------------------
     Icons / inboxSubItems
  -----------------------------*/
  const allApplicationsIcon = useMemo(
    () => <ListFixed className='w-5 h-5' aria-label='All Applications' />,
    []
  );
  const forwardedIcon = useMemo(
    () => <CornerUpRightFixed className='w-5 h-5' aria-label='Forwarded' />,
    []
  );
  const returnedIcon = useMemo(
    () => <Undo2Fixed className='w-5 h-5' aria-label='Returned' />,
    []
  );
  const redFlaggedIcon = useMemo(
    () => <FlagFixed className='w-5 h-5' aria-label='Red Flagged' />,
    []
  );
  const reenquiryIcon = useMemo(
    () => <RefreshCcwFixed className='w-5 h-5' aria-label='Re Enquiry' />,
    []
  );

  const inboxSubItems = useMemo(() => {
    const set = new Set<string>();
    set.add('all'); // 'all' (All Applications) is always first
    menuItems.forEach(mi => {
      try {
        const k = normalizeNavKey(mi.name as string);
        if (k.startsWith('inbox-') && k !== 'inbox-all') {
          set.add(k.replace('inbox-', ''));
        }
      } catch (e) {}
    });
    const fallbacks = ['all', 'forwarded', 'returned', 'redflagged', 'reenquiry'];
    if (set.size === 0) fallbacks.forEach(f => set.add(f));
    else fallbacks.forEach(f => set.add(f)); // ensure common types present

    const iconMap: Record<string, React.ReactNode> = {
      all: allApplicationsIcon,
      forwarded: forwardedIcon,
      returned: returnedIcon,
      redflagged: redFlaggedIcon,
      reenquiry: reenquiryIcon,
    };
    const countMap: Record<string, number> = {
      all: applicationCounts?.allCount || 0,
      forwarded: applicationCounts?.forwardedCount || 0,
      returned: applicationCounts?.returnedCount || 0,
      redflagged: applicationCounts?.redFlaggedCount || 0,
      reenquiry: applicationCounts?.reEnquiryCount || 0,
    };
    const labelFor = (n: string) => {
      if (n.toLowerCase() === 'all') return 'All Applications';
      if (n.toLowerCase() === 'redflagged') return 'Red Flagged';
      return n.charAt(0).toUpperCase() + n.slice(1);
    };
    return Array.from(set).map(name => ({
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
    applicationCounts?.allCount,
  ]);

  /* ----------------------------
     Visible & role guard
  -----------------------------*/
  useEffect(() => {
    if (showSidebar) setVisible(true);
    else setTimeout(() => setVisible(false), 400);
  }, [showSidebar]);

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
      {/* Mobile backdrop overlay */}
      {mobileSidebarOpen && (
        <div
          className='md:hidden fixed inset-0 z-30 bg-black/40 backdrop-blur-sm transition-opacity duration-300'
          onClick={() => setMobileSidebarOpen(false)}
          aria-hidden='true'
        />
      )}
      <aside
        className={`z-40 w-[80vw] max-w-xs md:w-60 h-screen md:h-auto bg-white border border-gray-200 fixed left-0 top-0 md:left-4 md:top-4 md:bottom-4 flex flex-col shadow-xl md:shadow-lg md:rounded-2xl overflow-hidden
        transition-all duration-300 ease-in-out
        ${showSidebar || mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0`}
      >
        <div className='p-3 flex items-center gap-2 border-b border-gray-100'>
          <ImageFixed
            src='/icon-alms.svg'
            alt='Arms License Icon'
            width={36}
            height={36}
          />
          <h1 className='text-sm font-bold leading-tight truncate'>Arms License</h1>
        </div>
        {isAdminRole(effectiveRole) ? (
          <button
            type='button'
            onClick={() => {
              setActiveItem('dashboard');
              persistActiveNavToLocal('dashboard');
              router.push('/dashboard');
            }}
            className={`w-full text-left px-0 py-2.5 flex items-center gap-2 transition-all cursor-pointer focus-visible:outline-none ${
              pathname === '/dashboard'
                ? 'bg-[#0F2D52] text-[#D4AF37] font-bold border-l-4 border-[#D4AF37] shadow-inner'
                : 'bg-[#001F54] text-white hover:bg-[#0A1C33]'
            }`}
          >
            <svg
              xmlns='http://www.w3.org/2000/svg'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
              strokeLinecap='round'
              strokeLinejoin='round'
              className={`w-6 h-6 flex-shrink-0 pl-3 ${pathname === '/dashboard' ? 'text-[#D4AF37]' : 'text-white'}`}
            >
              <path d='M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2' />
              <circle cx='12' cy='7' r='4' />
            </svg>
            <span className='font-semibold text-sm truncate flex-1'>{roleConfig?.dashboardTitle ?? 'Dashboard'}</span>
            <span className='pr-3'></span>
          </button>
        ) : (
          <button
            type='button'
            onClick={() => {
              const defaultHome = getRoleBasedRedirectPath(effectiveRole);
              router.push(defaultHome);
            }}
            className='w-full text-left bg-[#0F2D52] text-[#D4AF37] font-bold border-l-4 border-[#D4AF37] px-0 py-2.5 flex items-center gap-2 shadow-inner transition-all cursor-pointer focus-visible:outline-none'
          >
            <svg
              xmlns='http://www.w3.org/2000/svg'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
              strokeLinecap='round'
              strokeLinejoin='round'
              className='w-6 h-6 flex-shrink-0 pl-3 text-[#D4AF37]'
            >
              <path d='M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2' />
              <circle cx='12' cy='7' r='4' />
            </svg>
            <span className='font-semibold text-sm truncate flex-1'>{roleConfig?.dashboardTitle ?? 'Dashboard'}</span>
            <span className='pr-3'></span>
          </button>
        )}

        <nav className='flex-1 overflow-y-auto py-2 px-0'>
          <ul className='space-y-1'>
            {!isAdminRole(effectiveRole) && (
              <li>
                {/* highlight Inbox when any inbox-{type} is active, not only when the panel is expanded */}
                <button
                  type='button'
                  onClick={handleInboxToggle}
                  className={`flex items-center w-full px-0 py-2 rounded-md text-left text-sm transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#001F54] focus-visible:ring-offset-2 ${
                    (activeItem && String(activeItem).startsWith('inbox-')) || isInboxOpen
                      ? 'bg-[#001F54] text-white font-medium shadow-sm'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <span
                    className='inline-flex items-center justify-center w-7 h-7 mr-3 flex-shrink-0 transition-colors pl-3'
                    aria-hidden='true'
                  >
                    {menuMeta.inbox.icon() as any}
                  </span>
                  <span className='flex-1'>{menuMeta.inbox.label}</span>
                  <span className='ml-2 mr-3 flex-shrink-0 transition-transform duration-200' style={{ transform: isInboxOpen ? 'rotate(0deg)' : 'rotate(-90deg)' }}>
                    <ChevronDown className='w-6 h-6' />
                  </span>
                </button>
                {isInboxOpen && (
                  <ul className='ml-8 mt-1 space-y-1' role='menu'>
                    {inboxSubItems.map(sub => {
                      const isActive = activeItem === normalizeNavKey(`inbox-${sub.name}`);
                      const subActionId = `inbox-${sub.name.toLowerCase().replace(/\s+/g, '')}`;
                      const isSubLoading = isActionInProgress(subActionId);
                      return (
                        <InboxSubMenuItem
                          key={`inbox-sub-${sub.name}`}
                          name={sub.name}
                          label={sub.label}
                          icon={sub.icon}
                          count={sub.count}
                          active={isActive}
                          loading={isSubLoading}
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

                // Determine active state for the main menu item.
                // - active if activeItem matches the normalized key (case-insensitive for admin items)
                // - also active if any of its children are active (so parent and child can be active simultaneously)
                // - as a general fallback, consider active if activeItem startsWith `${normalizedKey}-` (covers derived keys)
                let isActive =
                  activeItem === normalizedKey ||
                  String(activeItem).toLowerCase() === normalizedKey.toLowerCase() ||
                  activeItem === String(item.name);

                try {
                  if (
                    !isActive &&
                    Array.isArray((item as any).childs) &&
                    (item as any).childs.length
                  ) {
                    const childs = (item as any).childs as Array<{ name?: string }>;
                    // If any child normalized key equals activeItem mark parent active
                    for (const c of childs) {
                      const childKey = normalizeNavKey(String(c?.name ?? ''));
                      if (childKey && childKey === activeItem) {
                        isActive = true;
                        break;
                      }
                      // also check combined keys like `${parent}-${child}` if those conventions are used
                      const combined = normalizeNavKey(
                        `${String(item.name)}-${String(c?.name ?? '')}`
                      );
                      if (combined && combined === activeItem) {
                        isActive = true;
                        break;
                      }
                    }
                  }
                } catch (e) {
                  // ignore any errors during active determination
                }

                if (
                  !isActive &&
                  normalizedKey &&
                  activeItem &&
                  String(activeItem).startsWith(`${normalizedKey}-`)
                ) {
                  isActive = true;
                }

                const menuActionId = `menu-${normalizedKey || item.name?.toLowerCase().replace(/\s+/g, '')}`;
                const isLoading = isActionInProgress(menuActionId);

                return (
                  <MenuItem
                    key={`menu-${normalizedKey}`}
                    icon={item.icon}
                    label={item.label}
                    active={isActive}
                    loading={isLoading}
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

        <div className='p-3 border-t border-gray-200 mt-auto'>
          <button
            type='button'
            onClick={handleLogout}
            className='flex items-center w-full px-0 py-2 rounded-md text-left text-sm transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#001F54] focus-visible:ring-offset-2 text-gray-600 hover:bg-red-50 hover:text-red-700'
          >
            <span
              className='inline-flex items-center justify-center w-7 h-7 mr-3 flex-shrink-0 pl-3'
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
            <span className='pr-3'></span>
          </button>
        </div>
      </aside>
    </>
  );
});
