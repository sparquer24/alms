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
    case 'ZS':
    case 'ADO':
    case 'CADO':
    case 'DCP':
    case 'ACP': 
    case 'CP':
      return '/home/forwarded';

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
  
  // Get the default redirect path for the user's role
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
    return '/home/forwarded';
  }
  
  // No redirection needed
  return null;
}