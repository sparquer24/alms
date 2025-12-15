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
import { CornerUpRight, Undo2, Flag, FolderCheck, RefreshCcw } from 'lucide-react';

const CornerUpRightFixed = CornerUpRight as any;
const Undo2Fixed = Undo2 as any;
const FlagFixed = Flag as any;
const FolderCheckFixed = FolderCheck as any;
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
import {
  getAdminMenuKeyFromPath,
  getAdminMenuItems,
  getAdminPathForMenuItem,
} from '../config/adminMenuService';
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
  const { showSidebar } = useLayout();
  const [visible, setVisible] = useState(false);
  const dispatch = useDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { userRole, token, user } = useAuthSync();
  const { loadType, selectedType } = useInbox();
  const isMountedRef = useRef(false);
  const isInboxOpen = useSelector((state: any) => state.ui?.isInboxOpen); // moved up so other handlers can read it
  // Prevent auto active changes during API-triggered refreshes
  const activeFreezeRef = useRef<boolean>(false);
  const activeUnfreezeTimerRef = useRef<number | null>(null);
  const freezeActive = useCallback((ms: number = 2000) => {
    try {
      activeFreezeRef.current = true;
      if (activeUnfreezeTimerRef.current) {
        clearTimeout(activeUnfreezeTimerRef.current);
        activeUnfreezeTimerRef.current = null;
      }
      activeUnfreezeTimerRef.current = window.setTimeout(() => {
        activeFreezeRef.current = false;
        activeUnfreezeTimerRef.current = null;
      }, ms) as unknown as number;
    } catch (e) {
      /* ignore */
    }
  }, []);

  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setHydrated(true);
  }, []);

  // Ensure we restore previously-selected active nav from localStorage on first client mount
  // unless the current URL explicitly sets a type (URL beats localStorage).
  // Also respect the loginRedirectApplied flag to skip localStorage after fresh login.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      // Check if this is a fresh login redirect
      const isLoginRedirect = sessionStorage?.getItem('loginRedirectApplied') === 'true';
      if (isLoginRedirect) {
        // Clear the flag and skip localStorage restoration
        try {
          sessionStorage.removeItem('loginRedirectApplied');
        } catch (e) {}
        // URL will drive the state instead
        return;
      }

      const url = new URL(window.location.href);
      const typeParam = url.searchParams.get('type');
      if (typeParam) return; // URL takes precedence
      const stored = window.localStorage?.getItem('activeNavItem');
      if (!stored) return;
      let key = normalizeNavKey(stored);
      if (!key) return;
      // If stored value was saved without `inbox-` (e.g. 'drafts'), try prefixing
      // so we recover inbox-{type} semantics used by the rest of the sidebar.
      if (!key.startsWith('inbox-')) {
        const alt = normalizeNavKey(`inbox-${stored}`);
        if (alt && alt.startsWith('inbox-')) key = alt;
      }
      // Only set when no active item yet to avoid stomping URL-driven state
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
    // run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // Sync active menu key with pathname for admin pages
  useEffect(() => {
    const normalizedRole = userRole ? String(userRole).toUpperCase() : cookieRole?.toUpperCase();
    if (!pathname || !normalizedRole?.includes('ADMIN')) return;
    const adminKey = getAdminMenuKeyFromPath(pathname);
    if (adminKey) {
      // Allow pathname sync to update activeItem even during freeze,
      // but only if activeItem doesn't already match (prevents flickering)
      if (activeFreezeRef.current && activeItem === adminKey) return;
      // Update activeItem to match the current admin page
      setActiveItem(adminKey);
      if (typeof window === 'undefined' || !adminKey) return;
      try {
        const toStore = adminKey.startsWith('inbox-') ? adminKey.slice('inbox-'.length) : adminKey;
        localStorage.setItem('activeNavItem', toStore);
      } catch (e) {
        /* ignore */
      }
      if (adminMenuContext?.setActiveMenuKey) {
        adminMenuContext.setActiveMenuKey(adminKey);
      }
    }
  }, [pathname, cookieRole, userRole, adminMenuContext, activeItem]);

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

  // Sidebar counts hook — only fetch when visible and not admin (keeps existing behavior)
  const shouldFetchCounts = useMemo(
    () => visible && !cookieRole?.includes('ADMIN'),
    [visible, cookieRole]
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
    }),
    [
      rawCounts?.forwardedCount,
      rawCounts?.returnedCount,
      rawCounts?.redFlaggedCount,
      rawCounts?.reEnquiryCount,
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
     Client-only initialization and URL -> activeItem sync
     - runs once on mount and whenever pathname + query change.
     - centralizes localStorage writes and inbox loading to avoid duplication.
  -----------------------------*/
  useEffect(() => {
    // client-only initialization on first mount
    if (typeof window === 'undefined') return;

    // only run once on mount to read cookie and optionally active item from localStorage or URL
    if (!isMountedRef.current) {
      isMountedRef.current = true;
      const r = getUserRoleFromCookie();
      if (r) setCookieRole(r);

      // For admin users, initialize with first admin menu item
      if (isAdminRole(r || userRole)) {
        try {
          const adminItems = getAdminMenuItems();
          if (adminItems.length > 0) {
            const firstAdminKey = normalizeNavKey(adminItems[0].name);
            if (!activeFreezeRef.current) {
              setActiveItem(firstAdminKey);
              persistActiveNavToLocal(firstAdminKey);
            }
          }
        } catch (e) {}
        return;
      }

      // Read active nav from URL first (query beats localStorage)
      try {
        const url = new URL(window.location.href);
        const pathnameNow = url.pathname;
        const typeParam = url.searchParams.get('type');
        if ((pathnameNow === '/inbox' || pathnameNow.startsWith('/admin')) && typeParam) {
          const skip =
            typeof window !== 'undefined' && window.sessionStorage
              ? window.sessionStorage.getItem('skipOpenInbox') === 'true'
              : false;
          // clear the flag if present
          try {
            if (skip && typeof window !== 'undefined' && window.sessionStorage) {
              window.sessionStorage.removeItem('skipOpenInbox');
            }
          } catch (e) {}

          if (skip) {
            // When the skip flag is set we want the URL to update but keep the
            // inbox UI closed and treat the clicked item as a top-level active
            // item (no `inbox-` prefix). Also call onTableReload so parent can
            // refresh content.
            try {
              const topKey = normalizeNavKey(String(typeParam).toLowerCase());
              if (!activeFreezeRef.current) {
                setActiveItem(topKey);
                persistActiveNavToLocal(topKey);
              }
              if (onTableReload) onTableReload(String(typeParam));
            } catch (e) {
              /* swallow */
            }
            return;
          }

          const key = normalizeNavKey(`inbox-${String(typeParam).toLowerCase()}`);
          if (!activeFreezeRef.current) {
            setActiveItem(key);
            persistActiveNavToLocal(key);
          }
          // ensure inbox open & load
          try {
            // Only auto-open the inbox if the user hasn't explicitly closed it
            const desiredOpen =
              typeof window !== 'undefined' && window.localStorage
                ? window.localStorage.getItem('inboxDesiredOpen')
                : null;
            if (desiredOpen !== 'false') {
              dispatch(openInbox());
            }
            void loadType(String(typeParam), false).catch(() => {});
            if (onTableReload) onTableReload(String(typeParam));
            if (String(typeParam).toLowerCase() === 'forwarded') scheduleInboxForwardedRefresh();
          } catch (e) {
            /* swallow */
          }
          return;
        }
      } catch (e) {
        // ignore
      }

      // fallback: read previously stored activeNavItem from localStorage (if any)
      try {
        const stored = window.localStorage?.getItem('activeNavItem') ?? '';
        if (stored) {
          let key = normalizeNavKey(stored);
          if (!key.startsWith('inbox-')) {
            const alt = normalizeNavKey(`inbox-${stored}`);
            if (alt && alt.startsWith('inbox-')) key = alt;
          }
          setActiveItem(key);
          persistActiveNavToLocal(key);
        }
      } catch (e) {
        // ignore
      }
    }

    // If pathname or searchParams changed and point to an inbox type -> sync
    try {
      if (!pathname) return;

      // For admin users, skip inbox syncing
      const effectiveRole = cookieRole ?? userRole;
      if (isAdminRole(effectiveRole)) {
        // Admin users don't use inbox-based routing
        return;
      }

      const type = searchParams?.get('type');
      if ((pathname === '/inbox' || pathname.startsWith('/admin')) && type) {
        // Respect a short-lived session flag indicating we should skip
        // opening the inbox UI even though the URL changed. This is used
        // when we want the URL to reflect the selection but keep the
        // inbox visually closed (Option B behavior).
        const skip =
          typeof window !== 'undefined' && window.sessionStorage
            ? window.sessionStorage.getItem('skipOpenInbox') === 'true'
            : false;
        try {
          if (skip && typeof window !== 'undefined' && window.sessionStorage) {
            window.sessionStorage.removeItem('skipOpenInbox');
          }
        } catch (e) {}

        if (skip) {
          try {
            const topKey = normalizeNavKey(String(type).toLowerCase());
            if (!activeFreezeRef.current) {
              setActiveItem(topKey);
              persistActiveNavToLocal(topKey);
            }
            if (onTableReload) onTableReload(String(type));
          } catch (e) {
            /* swallow */
          }
          return;
        }

        const newActive = normalizeNavKey(`inbox-${String(type).toLowerCase()}`);
        if (!activeFreezeRef.current && newActive !== activeItem) {
          setActiveItem(newActive);
          persistActiveNavToLocal(newActive);
          if (!isMountedRef.current) return;
          try {
            if (!((window as any).__REDUX_INBOX_OPEN__ || false)) {
              /* noop hook for potential global flag */
            }
            const desiredOpen =
              typeof window !== 'undefined' && window.localStorage
                ? window.localStorage.getItem('inboxDesiredOpen')
                : null;
            if (desiredOpen !== 'false') {
              dispatch(openInbox());
            }
            void loadType(String(type), false).catch(() => {});
            if (onTableReload) onTableReload(String(type));
            if (String(type).toLowerCase() === 'forwarded') scheduleInboxForwardedRefresh();
          } catch (e) {
            /* swallow */
          }
        }
      }
    } catch (e) {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, String(searchParams?.toString()), cookieRole, userRole]); // we use stringified params to trigger on query changes

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
  -----------------------------*/
  useEffect(() => {
    if (!activeItem) return;

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
      if (!allowed.has(normalizedActive)) {
        // Fallback to first admin item or userManagement
        const fallback = normalizeNavKey(adminMenuItems[0]?.name as string) || 'usermanagement';
        if (!activeFreezeRef.current) {
          setActiveItem(fallback);
          persistActiveNavToLocal(fallback);
        }
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
      if (!activeFreezeRef.current) {
        setActiveItem(fallback);
        persistActiveNavToLocal(fallback);
      }
    }
  }, [menuItems, activeItem, normalizeNavKey, cookieRole, userRole]);

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
      // Freeze active highlight briefly on menu navigation
      freezeActive(2000);
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
      const topLevelInboxLike = new Set(['freshform', 'sent', 'closed', 'drafts', 'finaldisposal']);

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
        setActiveItem(key);
        persistActiveNavToLocal(key);
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
            router.push(redirectPath);
          }
        }
        return;
      }

      const type = item.name.replace(/\s+/g, '');
      const wasTopLevel = key && topLevelInboxLike.has(key);
      const target = `/inbox?type=${encodeURIComponent(type)}`;

      // Only navigate if not already on this path
      if (typeof window !== 'undefined') {
        const currentPath = window.location.pathname + window.location.search;
        if (currentPath === target) {
          // Already on this page
          return;
        }
      }

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
    },
    [
      cookieRole,
      userRole,
      normalizeNavKey,
      router,
      scheduleInboxForwardedRefresh,
      dispatch,
      freezeActive,
    ]
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
      // Freeze active highlight during API-driven updates
      freezeActive(2500);
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
      freezeActive,
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
    const set = new Set<string>();
    menuItems.forEach(mi => {
      try {
        const k = normalizeNavKey(mi.name as string);
        if (k.startsWith('inbox-')) {
          set.add(k.replace('inbox-', ''));
        }
      } catch (e) {}
    });
    const fallbacks = ['forwarded', 'returned', 'redflagged', 'reenquiry'];
    if (set.size === 0) fallbacks.forEach(f => set.add(f));
    else fallbacks.forEach(f => set.add(f)); // ensure common types present

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

                return (
                  <MenuItem
                    key={`menu-${normalizedKey}`}
                    icon={item.icon}
                    label={item.label}
                    active={isActive}
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
