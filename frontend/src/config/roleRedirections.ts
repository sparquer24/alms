/**
 * Utility functions for role-based redirections
 */

export type UserRole = 'DCP' | 'ACP' | 'CP' | 'ADMIN' | 'ARMS_SUPDT' | 'SHO' | 'ZS' | 'APPLICANT' | 'ADO' | 'CADO';

/**
 * Get the default redirect path for a user based on their role
 */
export function getRoleBasedRedirectPath(userRole: string): string {
  switch (userRole) {
    case 'ADMIN':
      return '/admin';

    case 'ARMS_SUPDT':
    case 'SHO':
      // Officers forwarded to a special inbox view
      return '/home?type=forwarded';

    case 'ZS':
      // ZS users create fresh forms by default
      return '/home?type=freshform';

    case 'APPLICANT':
      return '/home?type=sent';

    case 'DCP':
    case 'ACP':
    case 'CP':
    case 'ADO':
    case 'CADO':
      return '/home?type=forwarded';

    default:
      return '/';
  }
}

/**
 * Determine if a user should be redirected on startup based on their role and current path
 * Returns the path to redirect to, or null if no redirection is needed
 */
export function shouldRedirectOnStartup(userRole: string, currentPath: string): string | null {
  // Don't redirect if user is already on login page or auth-related pages
  if (currentPath === '/login' || currentPath.startsWith('/auth')) {
    return null;
  }

  const defaultPath = getRoleBasedRedirectPath(userRole);

  // If user is on the root path ('/') and has a specific role-based default, redirect them
  if (currentPath === '/' && defaultPath !== '/') {
    return defaultPath;
  }

  // For admin users, always redirect from root to admin dashboard
  if (userRole === 'ADMIN' && currentPath === '/') {
    return '/admin';
  }

  // For officer roles, redirect from root to their inbox
  const officerRoles = ['ARMS_SUPDT', 'SHO', 'ZS', 'ADO', 'CADO', 'DCP', 'ACP', 'CP'];
  if (officerRoles.includes(userRole) && currentPath === '/') {
    return getRoleBasedRedirectPath(userRole);
  }

  // No redirection needed
  return null;
}