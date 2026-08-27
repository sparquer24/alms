'use client';

import React, { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { normalizeRole } from '@/utils/roleUtils';
import { Search, X } from 'lucide-react';

export interface BreadcrumbCrumb {
  label: string;
  href?: string;
  onClick?: () => void;
  isCurrent?: boolean;
}

export interface PageSubHeaderProps {
  /** Optional custom breadcrumbs array. If omitted, derives from role + title */
  breadcrumbs?: BreadcrumbCrumb[];
  /** Section / page title shown in bold gold (#D4AF37) */
  title: string;
  /** Role label override (e.g. "Super Admin" | "Admin"). Defaults to active user role */
  roleLabel?: string;
  /** Meta badge or timestamp text (e.g. "• Updated: 10:30 AM" or "• 24 Active Users") */
  metaBadge?: ReactNode;
  /** Right-aligned action controls (filter pills, buttons, search inputs, modal triggers) */
  actions?: ReactNode;
  /** Optional second row or full-width child elements */
  children?: ReactNode;
  /** Additional custom class names */
  className?: string;
}

/**
 * Standardized Sticky Page Sub-Header for ALMS Super Admin and Admin pages
 * Provides consistent Navy/Gold theme, breadcrumb title, glassmorphism actions, and sticky positioning.
 */
export const PageSubHeader: React.FC<PageSubHeaderProps> = ({
  breadcrumbs,
  title,
  roleLabel,
  metaBadge,
  actions,
  children,
  className = '',
}) => {
  const { userRole } = useAuth();
  const pathname = usePathname();

  const effectiveRole = normalizeRole(userRole);
  const isSuperAdmin = effectiveRole === 'SUPER_ADMIN' || (pathname ? pathname.startsWith('/superAdmin') : false);
  const defaultRoleLabel = roleLabel || (isSuperAdmin ? 'Super Admin' : 'Admin');
  const defaultRoleHref = isSuperAdmin ? '/superAdmin/userManagement' : '/admin/userManagement';

  return (
    <div
      className={`sticky top-0 z-30 bg-[#0F2D52]/95 backdrop-blur-md text-white px-4 sm:px-6 lg:px-8 py-2.5 shadow-md border-b border-[#1E3A8A]/50 transition-all ${className}`}
    >
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Left Section: Breadcrumbs / Title */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs text-gray-300 min-w-0">
          {breadcrumbs && breadcrumbs.length > 0 ? (
            breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && <span className="text-gray-400 flex-shrink-0">/</span>}
                {crumb.isCurrent ? (
                  <span className="text-[#D4AF37] font-semibold truncate">{crumb.label}</span>
                ) : crumb.href ? (
                  <Link href={crumb.href} className="hover:text-white transition-colors truncate">
                    {crumb.label}
                  </Link>
                ) : crumb.onClick ? (
                  <button
                    type="button"
                    onClick={crumb.onClick}
                    className="hover:text-white transition-colors truncate text-left"
                  >
                    {crumb.label}
                  </button>
                ) : (
                  <span className="truncate">{crumb.label}</span>
                )}
              </React.Fragment>
            ))
          ) : (
            <>
              <Link href={defaultRoleHref} className="hover:text-white transition-colors flex-shrink-0 font-medium">
                {defaultRoleLabel}
              </Link>
              <span className="text-gray-400 flex-shrink-0">/</span>
              <span className="text-[#D4AF37] font-semibold truncate">{title}</span>
            </>
          )}

          {metaBadge && (
            <span className="hidden sm:inline-flex items-center text-gray-400 text-xs font-normal">
              {typeof metaBadge === 'string' ? `• ${metaBadge.replace(/^[•\s]+/, '')}` : metaBadge}
            </span>
          )}
        </div>

        {/* Right Section: Action Controls / Filters */}
        {actions && (
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 flex-shrink-0">
            {actions}
          </div>
        )}
      </div>

      {/* Optional Expanded Multi-Tier Row */}
      {children && <div className="max-w-7xl mx-auto mt-2 pt-2 border-t border-white/10">{children}</div>}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* SubHeader Helper Widgets (Pills, Buttons, Search)                         */
/* -------------------------------------------------------------------------- */

export interface SubHeaderPillOption<T extends string = string> {
  key: T;
  label: string;
  count?: number;
}

export interface SubHeaderPillsProps<T extends string = string> {
  options: SubHeaderPillOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Active style variant: 'gold' (default) or 'white' */
  variant?: 'gold' | 'white';
  className?: string;
}

export function SubHeaderPills<T extends string = string>({
  options,
  value,
  onChange,
  variant = 'gold',
  className = '',
}: SubHeaderPillsProps<T>) {
  return (
    <div
      className={`flex items-center rounded-lg bg-white/10 p-0.5 border border-white/10 text-xs ${className}`}
    >
      {options.map(item => {
        const isActive = value === item.key;
        const activeClass =
          variant === 'gold'
            ? 'bg-[#B8860B] text-white shadow-xs'
            : 'bg-white text-[#0F2D52] shadow-xs';
        return (
          <button
            key={item.key}
            type="button"
            onClick={() => onChange(item.key)}
            className={`px-2.5 py-1 rounded-md transition-all font-medium flex items-center gap-1 whitespace-nowrap ${
              isActive ? activeClass : 'text-gray-300 hover:text-white'
            }`}
          >
            <span>{item.label}</span>
            {item.count !== undefined && item.count > 0 && (
              <span
                className={`text-[10px] px-1 py-0.2 rounded-full font-bold ${
                  isActive ? 'bg-black/20 text-white' : 'bg-white/20 text-gray-200'
                }`}
              >
                {item.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export interface SubHeaderButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'glass' | 'primary' | 'success' | 'danger';
  icon?: ReactNode;
  children?: ReactNode;
}

export const SubHeaderButton: React.FC<SubHeaderButtonProps> = ({
  variant = 'glass',
  icon,
  children,
  className = '',
  ...props
}) => {
  let variantClass =
    'p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-gray-200 hover:text-white text-xs flex items-center gap-1.5 transition-colors border border-white/10 disabled:opacity-50';

  if (variant === 'primary') {
    variantClass =
      'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#B8860B] hover:bg-[#A0750A] text-xs font-semibold text-white shadow-xs transition-all disabled:opacity-50';
  } else if (variant === 'success') {
    variantClass =
      'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white shadow-xs transition-all disabled:opacity-50';
  } else if (variant === 'danger') {
    variantClass =
      'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-xs font-semibold text-white shadow-xs transition-all disabled:opacity-50';
  }

  return (
    <button type="button" className={`${variantClass} ${className}`} {...props}>
      {icon}
      {children && <span>{children}</span>}
    </button>
  );
};

export interface SubHeaderSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const SubHeaderSearch: React.FC<SubHeaderSearchProps> = ({
  value,
  onChange,
  placeholder = 'Search...',
  className = '',
}) => {
  return (
    <div className={`relative flex-1 min-w-[160px] sm:min-w-[220px] max-w-xs ${className}`}>
      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-8 pr-7 py-1.5 rounded-lg bg-white/10 border border-white/10 text-xs text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#D4AF37] focus:border-[#D4AF37] transition-all"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
          title="Clear search"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );
};

export default PageSubHeader;
