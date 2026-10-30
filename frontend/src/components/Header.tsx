'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { BadgeCheck, ChevronLeft, ChevronDown } from 'lucide-react';
import { useLayout } from '../config/layoutContext';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '../config/notificationContext';
import NotificationDropdown from './NotificationDropdown';
import Link from 'next/link';
import { APPLICATION_TYPES } from '../config/helpers';
import { canCreateApplications, isLicenseManagementRole, normalizeRole } from '@/utils/roleUtils';

interface BreadcrumbItem {
  label: string;
  href?: string;
  onClick?: () => void;
}

interface HeaderProps {
  onCreateApplication?: (typeKey: string) => void;
  onShowMessage?: (msg: string, type?: 'info' | 'error' | 'success') => void;
  /** Optional breadcrumb trail shown on the left side of the header */
  breadcrumbs?: BreadcrumbItem[];
  /** Optional title shown alongside breadcrumbs (e.g., "Application Details") */
  pageTitle?: string;
  /** Optional status badge shown in the header (for detail views) */
  statusBadge?: {
    label: string;
    className?: string;
    style?: React.CSSProperties;
  };
  /** Hide the print button */
  hidePrint?: boolean;
  /** Hide the Create Form button even if sidebar is visible */
  hideCreateForm?: boolean;
  /** Force the Create Form button to show even when the sidebar is hidden */
  showCreateForm?: boolean;
  /** Show a back button that navigates to the given URL, or to browser history if no URL is provided */
  showBackButton?: boolean;
  /** Optional URL to navigate to when back button is clicked. Defaults to router.back() */
  backHref?: string;
  /** Optional custom back handler; takes precedence over backHref */
  onBack?: () => void;
  /** Optional application type label to display in the header */
  applicationTypeLabel?: string;
}

const Header = (props: HeaderProps) => {
  const {
    onShowMessage,
    breadcrumbs,
    pageTitle,
    statusBadge,
    hidePrint,
    hideCreateForm,
    showCreateForm,
    showBackButton,
    backHref,
    onBack,
    applicationTypeLabel,
  } = props;
  const { showHeader, showSidebar, sidebarCollapsed, setHeaderHeight } = useLayout();
  const headerRef = useRef<HTMLElement>(null);
  const { userName, isLoading, user, userRole: hookUserRole } = useAuth();
  const [displayName, setDisplayName] = useState<string | undefined>(undefined);
  const { unreadCount } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const router = useRouter();
  const pathname = usePathname();

  const showLicenseManagement = isLicenseManagementRole(hookUserRole);
  const isLicensesActive = pathname === '/licenses';

  const effectiveRole = normalizeRole(hookUserRole);
  const isSuperAdmin = effectiveRole === 'SUPER_ADMIN' || (pathname && pathname.startsWith('/superAdmin'));
  const isAdmin = effectiveRole === 'ADMIN' || (pathname && pathname.startsWith('/admin'));
  
  const roleLabel = React.useMemo(() => {
    if (isSuperAdmin) return 'Super Admin';
    if (isAdmin) return 'Admin';
    if (hookUserRole) {
      const clean = String(hookUserRole).replace(/_/g, ' ').trim();
      return clean.charAt(0).toUpperCase() + clean.slice(1);
    }
    return 'User';
  }, [isSuperAdmin, isAdmin, hookUserRole]);

  const defaultRouteMeta = React.useMemo(() => {
    if (!pathname) return null;
    const defaultRoleHref = isSuperAdmin ? '/superAdmin/userManagement' : isAdmin ? '/admin/userManagement' : '/inbox?type=all';
    const map: Record<string, { roleTitle: string; pageTitle: string; roleHref?: string }> = {
      '/dashboard': { roleTitle: roleLabel, pageTitle: 'Dashboard', roleHref: defaultRoleHref },
      '/inbox': { roleTitle: roleLabel, pageTitle: 'Inbox', roleHref: '/inbox?type=all' },
      '/superAdmin/userManagement': { roleTitle: 'Super Admin', pageTitle: 'User Management', roleHref: '/superAdmin/userManagement' },
      '/admin/userManagement': { roleTitle: 'Admin', pageTitle: 'User Management', roleHref: '/admin/userManagement' },
      '/superAdmin/roleMapping': { roleTitle: 'Super Admin', pageTitle: 'Role Management', roleHref: '/superAdmin/roleMapping' },
      '/admin/roleMapping': { roleTitle: 'Admin', pageTitle: 'Role Management', roleHref: '/admin/roleMapping' },
      '/superAdmin/flowMapping': { roleTitle: 'Super Admin', pageTitle: 'Flow Mapping', roleHref: '/superAdmin/flowMapping' },
      '/admin/flowMapping': { roleTitle: 'Admin', pageTitle: 'Flow Mapping', roleHref: '/admin/flowMapping' },
      '/superAdmin/approvalRules': { roleTitle: 'Super Admin', pageTitle: 'Approval Rules', roleHref: '/superAdmin/approvalRules' },
      '/admin/approvalRules': { roleTitle: 'Admin', pageTitle: 'Approval Rules', roleHref: '/admin/approvalRules' },
      '/superAdmin/locationsManagement': { roleTitle: 'Super Admin', pageTitle: 'Locations Management', roleHref: '/superAdmin/locationsManagement' },
      '/admin/locationsManagement': { roleTitle: 'Admin', pageTitle: 'Locations Management', roleHref: '/admin/locationsManagement' },
      '/superAdmin/actionMapping': { roleTitle: 'Super Admin', pageTitle: 'Action Mapping', roleHref: '/superAdmin/actionMapping' },
      '/admin/actionMapping': { roleTitle: 'Admin', pageTitle: 'Action Mapping', roleHref: '/admin/actionMapping' },
      '/licenses': { roleTitle: roleLabel, pageTitle: 'License Management', roleHref: '/licenses' },
      '/settings': { roleTitle: roleLabel, pageTitle: 'User Settings', roleHref: '/settings' },
      '/notifications': { roleTitle: roleLabel, pageTitle: 'Notifications', roleHref: '/notifications' },
      '/reports': { roleTitle: roleLabel, pageTitle: 'Reports', roleHref: '/reports' },
      '/freshform': { roleTitle: roleLabel, pageTitle: 'Fresh Applications', roleHref: '/freshform' },
      '/cancelForm': { roleTitle: roleLabel, pageTitle: 'Cancellation Requests', roleHref: '/cancelForm' },
      '/application': { roleTitle: roleLabel, pageTitle: 'Application Details', roleHref: '/inbox?type=all' },
      '/renewalApplication': { roleTitle: roleLabel, pageTitle: 'Renewal Application', roleHref: '/inbox?type=all' },
    };

    if (map[pathname]) return map[pathname];
    for (const [route, meta] of Object.entries(map)) {
      if (pathname.startsWith(route) && route !== '/') return meta;
    }
    return null;
  }, [pathname, isSuperAdmin, isAdmin, roleLabel]);

  const effectiveBreadcrumbs = React.useMemo(() => {
    if (breadcrumbs && breadcrumbs.length > 0) return breadcrumbs;
    if (defaultRouteMeta) {
      return [
        { label: defaultRouteMeta.roleTitle, href: defaultRouteMeta.roleHref },
        { label: defaultRouteMeta.pageTitle },
      ];
    }
    return undefined;
  }, [breadcrumbs, defaultRouteMeta]);

  const effectivePageTitle = pageTitle || defaultRouteMeta?.pageTitle;

  useEffect(() => {
    const name = userName || user?.name || user?.username;
    if (!isLoading && name) setDisplayName(name);
  }, [userName, user, isLoading, hookUserRole]);

  // Keep the shared layout context in sync with the header's real rendered height
  useEffect(() => {
    if (!showHeader) {
      setHeaderHeight(null);
      return;
    }
    const node = headerRef.current;
    if (!node) return;

    const measure = () => setHeaderHeight(node.getBoundingClientRect().bottom);
    measure();

    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(node);
    return () => resizeObserver.disconnect();
  }, [showHeader, setHeaderHeight, effectiveBreadcrumbs, effectivePageTitle]);

  const hasValidUserName = !isLoading && typeof displayName === 'string' && displayName.length > 0;
  const handleDropdownClick = (type: (typeof APPLICATION_TYPES)[number]) => {
    setShowDropdown(false);
    if (type.enabled) {
      if (type.key === 'fresh') {
        router.push('/forms/createFreshApplication/personal-information');
      } else if (type.key === 'renewal') {
        router.push('/forms/renewal');
      } else if (type.key === 'cancel') {
        router.push('/cancelForm/new');
      } else {
        router.push(`/inbox?type=${encodeURIComponent(type.key)}`);
      }
    } else if (onShowMessage) {
      onShowMessage('This feature will come soon', 'info');
    }
  };

  if (!showHeader) return null;

  const canCreateApplication = canCreateApplications(hookUserRole);

  // Position based on sidebar presence and desktop collapsed state
  const headerLeftClass = showSidebar
    ? sidebarCollapsed
      ? 'left-0 md:left-22'
      : 'left-0 md:left-66'
    : 'left-0';

  const hasBreadcrumbs = effectiveBreadcrumbs && effectiveBreadcrumbs.length > 0;

  return (
    <header
      ref={headerRef}
      className={`fixed top-0 right-0 ${headerLeftClass} min-w-[200px] bg-[#0B1F3A] border-b border-white/10 ${
        hasBreadcrumbs ? 'h-auto min-h-[56px] md:min-h-[58px] py-1.5' : 'h-[56px] md:h-[58px]'
      } px-4 sm:px-6 lg:px-8 flex items-center justify-between shadow-xs z-40 transition-all duration-300`}
    >
      <div className='w-full mx-auto flex items-center justify-between gap-3'>
        {/* Left section: breadcrumbs / page title / create form */}
        <div className='flex items-center gap-3 min-w-0'>
          {/* Back button */}
          {showBackButton && (
            <button
              type='button'
              onClick={() => (onBack ? onBack() : backHref ? router.push(backHref) : router.back())}
              className='flex items-center gap-1 px-2.5 py-1 text-white hover:bg-white/10 rounded-lg flex-shrink-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]'
              aria-label='Go back'
              title='Go back'
            >
              <ChevronLeft className='h-4 w-4' />
              <span className='text-xs font-semibold'>Back</span>
            </button>
          )}

          {/* Show Create Form when allowed */}
          {(showSidebar || showCreateForm) && !hideCreateForm && canCreateApplication && (
            <div className='relative flex-shrink-0'>
              <button
                type='button'
                className='px-3 py-1.5 bg-white text-[#0B1F3A] hover:bg-amber-50 hover:border-[#D4AF37] border border-transparent rounded-lg flex items-center justify-center font-bold text-xs whitespace-nowrap shadow-xs transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]'
                onClick={() => setShowDropdown(v => !v)}
                aria-expanded={showDropdown}
                aria-haspopup='true'
              >
                <span className='mr-1.5'>Create Form</span>
                <ChevronDown className='w-3.5 h-3.5 text-[#0B1F3A]' />
              </button>
              {showDropdown && (
                <div className='absolute left-0 mt-1.5 w-52 bg-white border border-gray-200 rounded-xl shadow-xl z-50 py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-150'>
                  <div className='px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100'>
                    Application Type
                  </div>
                  {APPLICATION_TYPES.map(type => (
                    <button
                      key={type.key}
                      className={`w-full text-left px-3.5 py-2 text-xs font-medium hover:bg-gray-100 transition-colors ${
                        type.enabled ? 'text-gray-800' : 'text-gray-400 cursor-not-allowed'
                      }`}
                      onClick={() => handleDropdownClick(type)}
                      disabled={!type.enabled}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* License Management nav item */}
          {(showSidebar || showCreateForm) && !hideCreateForm && showLicenseManagement && (
            <div className='relative flex-shrink-0 hidden sm:block'>
              <button
                type='button'
                onClick={() => router.push('/licenses')}
                aria-current={isLicensesActive ? 'page' : undefined}
                className={`px-3 py-1.5 rounded-lg flex items-center justify-center font-bold text-xs whitespace-nowrap shadow-xs transition-all border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] ${
                  isLicensesActive
                    ? 'bg-white text-[#0B1F3A] border-[#D4AF37] ring-2 ring-[#D4AF37]/50 shadow-sm'
                    : 'bg-white text-[#0B1F3A] hover:bg-amber-50 hover:border-[#D4AF37] border-transparent'
                }`}
              >
                <BadgeCheck className={`w-3.5 h-3.5 mr-1.5 ${isLicensesActive ? 'text-[#D4AF37]' : 'text-[#0B1F3A]'}`} aria-hidden='true' />
                <span>Licenses</span>
              </button>
            </div>
          )}

          {/* Breadcrumbs or Page Title */}
          {(hasBreadcrumbs || effectivePageTitle) && (
            <nav className='min-w-0 flex-1' aria-label='Breadcrumb'>
              {hasBreadcrumbs && effectiveBreadcrumbs ? (
                <ol className='flex items-center space-x-1.5 text-xs truncate'>
                  {effectiveBreadcrumbs.map((crumb, idx) => {
                    const isLast = idx === effectiveBreadcrumbs.length - 1;
                    return (
                      <li key={idx} className='flex items-center space-x-1.5 min-w-0'>
                        {idx > 0 && <span className='text-gray-400 flex-shrink-0'>/</span>}
                        {crumb.onClick ? (
                          <button
                            type='button'
                            onClick={crumb.onClick}
                            className={`transition-colors truncate ${
                              isLast ? 'text-[#D4AF37] font-semibold' : 'text-gray-300 hover:text-white'
                            }`}
                          >
                            {crumb.label}
                          </button>
                        ) : crumb.href ? (
                          <Link
                            href={crumb.href}
                            className={`transition-colors truncate ${
                              isLast ? 'text-[#D4AF37] font-semibold' : 'text-gray-300 hover:text-white'
                            }`}
                          >
                            {crumb.label}
                          </Link>
                        ) : (
                          <span className={`truncate ${isLast ? 'text-[#D4AF37] font-semibold' : 'text-gray-300'}`}>
                            {crumb.label}
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ol>
              ) : (
                <div className='flex items-center gap-2 text-white font-semibold text-sm truncate'>
                  <span className='text-[#D4AF37] font-bold'>{effectivePageTitle}</span>
                </div>
              )}
            </nav>
          )}
        </div>

        {/* Right section: status badge + actions */}
        <div className='flex items-center space-x-2.5 justify-end flex-shrink-0'>
          {/* Application Type badge */}
          {applicationTypeLabel && (
            <div className='hidden sm:flex items-center space-x-1.5 bg-white/10 rounded-lg px-2.5 py-1 text-xs'>
              <span
                className={`inline-block px-2.5 py-0.5 text-xs font-semibold rounded-full border whitespace-nowrap ${
                  applicationTypeLabel.toLowerCase().includes('renewal')
                    ? 'bg-amber-600/90 text-white border-amber-500'
                    : applicationTypeLabel.toLowerCase().includes('cancel')
                      ? 'bg-red-600/90 text-white border-red-500'
                      : 'bg-emerald-600/90 text-white border-emerald-500'
                }`}
              >
                {applicationTypeLabel}
              </span>
            </div>
          )}

          {/* Status badge */}
          {statusBadge && (
            <div className='flex items-center space-x-1.5 bg-white/10 rounded-lg px-2.5 py-1 text-xs'>
              <span
                className={`inline-block px-2.5 py-0.5 text-xs font-semibold rounded-full border ${
                  statusBadge.className || 'bg-white/20 text-white border-white/30'
                }`}
                style={statusBadge.style}
              >
                {statusBadge.label}
              </span>
            </div>
          )}

          {/* Notifications */}
          <div className='relative'>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className='p-1.5 text-gray-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]'
              aria-label='Toggle notifications'
              aria-expanded={showNotifications}
              title='Notifications'
            >
              <svg
                xmlns='http://www.w3.org/2000/svg'
                className='h-5 w-5'
                fill='none'
                viewBox='0 0 24 24'
                stroke='currentColor'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9'
                />
              </svg>
              {unreadCount > 0 && (
                <span className='absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full border border-[#0B1F3A]'>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            {showNotifications && (
              <NotificationDropdown onClose={() => setShowNotifications(false)} />
            )}
          </div>

          {/* Print button */}
          {!hidePrint && (
            <button
              onClick={() => globalThis.print()}
              className='p-1.5 text-gray-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]'
              aria-label='Print page'
              title='Print'
            >
              <svg
                xmlns='http://www.w3.org/2000/svg'
                className='h-5 w-5'
                fill='none'
                viewBox='0 0 24 24'
                stroke='currentColor'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M6 9V2h12v7m-6 4v6m-6 0h12'
                />
              </svg>
            </button>
          )}

          {/* User profile avatar / settings link */}
          {hasValidUserName && (
            <Link
              href='/settings'
              className='flex items-center hover:ring-2 hover:ring-[#D4AF37] rounded-full p-0.5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]'
              title={`Logged in as ${displayName} (${roleLabel})`}
              aria-label={`Settings for ${displayName}`}
            >
              <div className='bg-[#D4AF37] text-[#0B1F3A] rounded-full w-7 h-7 flex items-center justify-center font-black text-xs shadow-sm'>
                {displayName.charAt(0).toUpperCase()}
              </div>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
