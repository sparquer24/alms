/**
 * Utility functions for role-based redirections
 */

export type UserRole = 'DCP' | 'ACP' | 'CP' | 'JTCP' | 'ADMIN' | 'ARMS_SUPDT' | 'SHO' | 'ZS' | 'APPLICANT' | 'ADO' | 'CADO';

/**
 * Get the default redirect path for a user based on their role
 */
export function getRoleBasedRedirectPath(userRole?: string): string {
  // Defensive normalization: accept undefined, objects, lowercase values, and trim whitespace
  const role = userRole ? String(userRole).trim().toUpperCase() : undefined;
  switch (role) {
    case 'ADMIN':
      return '/admin/userManagement';

    case 'ARMS_SUPDT':
    case 'SHO':
      // Officers forwarded to a special inbox view
      return '/inbox?type=forwarded';

    case 'ZS':
      // ZS users create fresh forms by default
      return '/inbox?type=freshform';

    case 'APPLICANT':
      return '/inbox?type=sent';

    case 'DCP':
    case 'ACP':
    case 'CP':
    case 'JTCP':
    case 'ADO':
    case 'CADO':
      return '/inbox?type=forwarded';

    default:
      // Fallback: send to root so router.push always receives a string
      return '/';
  }
}

/**
 * Determine if a user should be redirected on startup based on their role and current path
 * Returns the path to redirect to, or null if no redirection is needed
 */
export function shouldRedirectOnStartup(userRole?: string, currentPath?: string): string | null {
  // Defensive checks: don't attempt string operations on undefined
  if (!currentPath) return null;
  // Normalize role for comparisons
  const normalizedRole = userRole ? String(userRole).trim().toUpperCase() : undefined;

  // Don't redirect if user is already on login page or auth-related pages
  if (currentPath === '/login' || currentPath.startsWith('/auth')) {
    return null;
  }

  const defaultPath = getRoleBasedRedirectPath(normalizedRole);

  // If user is on the root path ('/') and has a specific role-based default, redirect them
  if (currentPath === '/' && defaultPath !== '/') {
    return defaultPath;
  }

  // For admin users, always redirect from root to admin dashboard
  if (normalizedRole === 'ADMIN' && currentPath === '/') {
    return '/admin/userManagement';
  }

  // For officer roles, redirect from root to their inbox
  const officerRoles = ['ARMS_SUPDT', 'SHO', 'ZS', 'ADO', 'CADO', 'DCP', 'ACP', 'CP', 'JTCP'];
  if (normalizedRole && officerRoles.includes(normalizedRole) && currentPath === '/') {
    return getRoleBasedRedirectPath(normalizedRole);
  }

  // No redirection needed
  return null;
}