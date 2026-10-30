/**
 * Utility functions for role-based redirections
 * Configuration-driven approach for managing role-based routing
 */

import { RoleTypes } from './roles';
import { normalizeRole } from '../utils/roleUtils';

/**
 * Configuration for role-based redirections
 * Maps each role to its default landing page path
 */
const ROLE_REDIRECT_CONFIG: Record<string, string> = {
  [RoleTypes.ADMIN]: '/dashboard',
  [RoleTypes.SUPER_ADMIN]: '/dashboard',
  // ZS/DCP see zone-scoped dashboard data; JTCP/CP see district-scoped data;
  // AS/ARMS_SUPDT (Arms section) see state-scoped dashboard data.
  [RoleTypes.ARMS_SUPDT]: '/dashboard',
  [RoleTypes.SHO]: '/inbox?type=all',
  [RoleTypes.ZS]: '/dashboard',
  [RoleTypes.DCP]: '/dashboard',
  [RoleTypes.ACP]: '/inbox?type=all',
  [RoleTypes.CP]: '/dashboard',
  [RoleTypes.JTCP]: '/dashboard',
  [RoleTypes.ADO]: '/inbox?type=all',
  [RoleTypes.CADO]: '/inbox?type=all',
  [RoleTypes.AS]: '/dashboard',
  [RoleTypes.APPLICANT]: '/inbox?type=sent',
};

/**
 * Get the default redirect path for a user based on their role
 * Uses centralized configuration instead of hardcoded switch statements
 */
export function getRoleBasedRedirectPath(userRole?: any): string {
  // Use the centralized normalizeRole utility which handles both string and object roles
  const normalizedRole = normalizeRole(userRole);
  

  if (!normalizedRole) {
    return '/inbox?type=all'; // Fallback default
  }

  // Look up role in configuration
  const redirectPath = ROLE_REDIRECT_CONFIG[normalizedRole];

  // Return configured path or fallback default
  return redirectPath || '/inbox?type=all';
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

  // Don't redirect if user is already on their role-specific admin/superAdmin routes
  if (normalizedRole === RoleTypes.ADMIN && currentPath.startsWith('/admin')) {
    return null;
  }
  if (normalizedRole === RoleTypes.SUPER_ADMIN && currentPath.startsWith('/superAdmin')) {
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
 * Check if a role is an admin role
 * @deprecated Use isAdminRole from ../utils/roleUtils instead
 */
export function isAdminRole(userRole?: any): boolean {
  const normalizedRole = normalizeRole(userRole);
  return normalizedRole === RoleTypes.ADMIN || normalizedRole === RoleTypes.SUPER_ADMIN;
}

