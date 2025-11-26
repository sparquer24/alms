/**
 * Utility functions for role-based redirections
 * Configuration-driven approach for managing role-based routing
 */

import { RoleTypes } from './roles';
import { normalizeRole } from '../utils/roleUtils';

export type UserRole = 'DCP' | 'ACP' | 'CP' | 'JTCP' | 'ADMIN' | 'ARMS_SUPDT' | 'SHO' | 'ZS' | 'APPLICANT' | 'ADO' | 'CADO' | 'AS';

/**
 * Configuration for role-based redirections
 * Maps each role to its default landing page path
 */
const ROLE_REDIRECT_CONFIG: Record<string, string> = {
  [RoleTypes.ADMIN]: '/admin/userManagement',
  [RoleTypes.ARMS_SUPDT]: '/inbox?type=forwarded',
  [RoleTypes.SHO]: '/inbox?type=forwarded',
  [RoleTypes.ZS]: '/inbox?type=forwarded',
  [RoleTypes.DCP]: '/inbox?type=forwarded',
  [RoleTypes.ACP]: '/inbox?type=forwarded',
  [RoleTypes.CP]: '/inbox?type=forwarded',
  [RoleTypes.JTCP]: '/inbox?type=forwarded',
  [RoleTypes.ADO]: '/inbox?type=forwarded',
  [RoleTypes.CADO]: '/inbox?type=forwarded',
  [RoleTypes.AS]: '/inbox?type=forwarded',
  [RoleTypes.APPLICANT]: '/inbox?type=sent',
};

/**
 * Officer roles that should redirect to inbox pattern
 */
const OFFICER_ROLES = new Set<string>([
  RoleTypes.ARMS_SUPDT,
  RoleTypes.SHO,
  RoleTypes.ZS,
  RoleTypes.ADO,
  RoleTypes.CADO,
  RoleTypes.DCP,
  RoleTypes.ACP,
  RoleTypes.CP,
  RoleTypes.JTCP,
  RoleTypes.AS,
]);

/**
 * Get the default redirect path for a user based on their role
 * Uses centralized configuration instead of hardcoded switch statements
 */
export function getRoleBasedRedirectPath(userRole?: any): string {
  // Use the centralized normalizeRole utility which handles both string and object roles
  const normalizedRole = normalizeRole(userRole);
  if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
    console.log('[roleRedirections] getRoleBasedRedirectPath - userRole:', userRole, 'normalized:', normalizedRole);
  }

  if (!normalizedRole) {
    return '/inbox?type=forwarded'; // Fallback default
  }

  // Look up role in configuration
  const redirectPath = ROLE_REDIRECT_CONFIG[normalizedRole];
  if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
    console.log('[roleRedirections] Redirect path for', normalizedRole, ':', redirectPath);
  }

  // Return configured path or fallback default
  return redirectPath || '/inbox?type=forwarded';
}

/**
 * Determine if a user should be redirected on startup based on their role and current path
 * Returns the path to redirect to, or null if no redirection is needed
 */
export function shouldRedirectOnStartup(userRole?: any, currentPath?: string): string | null {
  // Defensive checks: don't attempt string operations on undefined
  if (!currentPath) return null;

  // Use the centralized normalizeRole utility which handles both string and object roles
  const normalizedRole = normalizeRole(userRole);

  // Don't redirect if user is already on login page or auth-related pages
  if (currentPath === '/login' || currentPath.startsWith('/auth')) {
    return null;
  }

  // If user is on the root path ('/'), redirect them to their role-based default
  if (currentPath === '/') {
    const defaultPath = getRoleBasedRedirectPath(normalizedRole);
    // Only redirect if there's a configured default path
    if (defaultPath !== '/') {
      return defaultPath;
    }
  }

  // No redirection needed
  return null;
}

/**
 * Check if a role is an officer role (non-admin, non-applicant)
 */
export function isOfficerRole(userRole?: any): boolean {
  const normalizedRole = normalizeRole(userRole);
  return normalizedRole ? OFFICER_ROLES.has(normalizedRole) : false;
}

/**
 * Check if a role is an admin role
 * @deprecated Use isAdminRole from ../utils/roleUtils instead
 */
export function isAdminRole(userRole?: any): boolean {
  const normalizedRole = normalizeRole(userRole);
  return normalizedRole === RoleTypes.ADMIN;
}

/**
 * Check if a role is an applicant role
 */
export function isApplicantRole(userRole?: any): boolean {
  const normalizedRole = normalizeRole(userRole);
  return normalizedRole === RoleTypes.APPLICANT;
}