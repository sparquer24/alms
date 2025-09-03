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
      // Admin users can start at the main dashboard or admin area
      return '/';
      
    case 'DCP':
    case 'ACP': 
    case 'CP':
      // Higher officials start at reports/dashboard for overview
      return '/reports';
      
    case 'ARMS_SUPDT':
      // Arms superintendent focuses on final disposals
      return '/final';
      
    case 'SHO':
      // SHO starts at inbox to handle applications
      return '/inbox/forwarded';
    case 'ZS':
      // ZS starts at freshform
      return '/freshform';
      
    case 'APPLICANT':
      // Applicants start at their sent applications or fresh form
      return '/sent';
      
    case 'ADO':
    case 'CADO':
      // Administrative officers start at dashboard
      return '/';
      
    default:
      // Default to main dashboard
      return '/';
  }
}

/**
 * Get role-specific navigation preferences
 */
export function getRoleNavigationConfig(userRole: string) {
  switch (userRole) {
    case 'ADMIN':
      return {
        defaultRoute: '/',
        preferredSections: ['dashboard', 'admin', 'reports'],
        hasAdminAccess: true
      };
      
    case 'DCP':
    case 'ACP':
    case 'CP':
      return {
        defaultRoute: '/reports',
        preferredSections: ['reports', 'final', 'dashboard'],
        hasAdminAccess: false
      };
      
    case 'ARMS_SUPDT':
      return {
        defaultRoute: '/final',
        preferredSections: ['final', 'reports', 'dashboard'],
        hasAdminAccess: false
      };
      
    case 'SHO':
      return {
        defaultRoute: '/inbox/forwarded',
        preferredSections: ['inbox', 'sent', 'dashboard'],
        hasAdminAccess: false
      };
    case 'ZS':
      return {
        defaultRoute: '/freshform',
        preferredSections: ['sent', 'freshform', 'notifications'],
        hasAdminAccess: false
      };
      
    case 'APPLICANT':
      return {
        defaultRoute: '/sent',
        preferredSections: ['sent', 'freshform', 'notifications'],
        hasAdminAccess: false
      };
      
    default:
      return {
        defaultRoute: '/',
        preferredSections: ['dashboard'],
        hasAdminAccess: false
      };
  }
}

/**
 * Check if user should be redirected on app startup based on role
 */
export function shouldRedirectOnStartup(userRole: string, currentPath: string): string | null {
  // Only allow role-based redirect from the login page. Never redirect away from '/' dashboard.
  if (currentPath !== '/login') {
    return null;
  }

  const roleBasedPath = getRoleBasedRedirectPath(userRole);

  // If role-based path is different from current (login), redirect to it
  if (roleBasedPath !== currentPath) {
    return roleBasedPath;
  }

  return null;
}

export const roleRedirections: Record<string, { default: string; preferredSections?: string[] }> = {
  ZS: {
    default: '/freshform',
    preferredSections: ['sent', 'freshform', 'notifications'],
  },
  // ... other roles ...
};
