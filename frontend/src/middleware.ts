import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Import role-based redirection logic
function getRoleBasedRedirectPath(userRole: string): string {
  console.log('getRoleBasedRedirectPath called with userRole:', userRole);
  
  // Define valid roles
  const validRoles = ['ADMIN', 'DCP', 'ACP', 'CP', 'ARMS_SUPDT', 'SHO', 'ZS', 'APPLICANT', 'ADO', 'CADO', 'AS', 'ARMS_SEAT', 'JTCP'];
  
  if (!userRole || !validRoles.includes(userRole)) {
    console.warn('Invalid or undefined role detected:', userRole);
    return '/login?error=invalid_role';
  }
  
  switch (userRole) {
    case 'ADMIN':
      return '/';
    case 'DCP':
    case 'ACP': 
    case 'CP':
      return '/reports';
    case 'ARMS_SUPDT':
      return '/final';
    case 'SHO':
    case 'ZS':
      return '/inbox/forwarded';
    case 'APPLICANT':
      return '/sent';
    case 'ADO':
    case 'CADO':
      return '/';
    case 'AS':
    case 'ARMS_SEAT':
    case 'JTCP':
      return '/';
    default:
      console.warn('Unhandled role:', userRole);
      return '/login?error=unhandled_role';
  }
}

// Define protected routes that require authentication
const protectedRoutes = [
  '/freshform',
  '/application',
  '/sent',
  '/inbox',
  '/reports',
  '/settings',
  '/final',
  '/notifications',
];

// Define public routes that don't require authentication
const publicRoutes = [
  '/login',
  '/reset-password',
];

// Define admin routes that require admin authentication
const adminRoutes = [
  '/admin/users',
  '/admin/locations',
  '/admin/forwarding', 
  '/admin/reports',
];

// Define role-based access for specific routes
const roleBasedAccess: Record<string, string[]> = {
  '/reports': ['DCP', 'ACP', 'CP', 'ADMIN'],
  '/final': ['DCP', 'CP', 'ADMIN', 'ARMS_SUPDT'],
};

// Helper function to parse and validate auth cookie
function parseAuthCookie(authCookie: string | undefined): { isAuthenticated: boolean; userRole?: string } {
  if (!authCookie) {
    console.log('No auth cookie found');
    return { isAuthenticated: false };
  }

  try {
    const authData = JSON.parse(authCookie);
    console.log('Parsed auth data:', authData);
    
    const isAuthenticated = !!(authData.token && authData.isAuthenticated);
    const userRole = authData.role || authData.user?.role;
    
    console.log('Extracted authentication status:', isAuthenticated, 'userRole:', userRole);
    
    if (isAuthenticated && !userRole) {
      console.warn('User is authenticated but no role found in cookie');
    }
    
    return { isAuthenticated, userRole };
  } catch (error) {
    console.error('Error parsing auth cookie:', error);
    return { isAuthenticated: false };
  }
}

// Helper function to check if route requires authentication
function isRouteProtected(pathname: string): boolean {
  return protectedRoutes.some(route => pathname.startsWith(route)) ||
         adminRoutes.some(route => pathname.startsWith(route));
}

// Helper function to check if user has role-based access
function hasRoleAccess(pathname: string, userRole: string | undefined): boolean {
  for (const [route, allowedRoles] of Object.entries(roleBasedAccess)) {
    if (pathname.startsWith(route)) {
      return !!(userRole && allowedRoles.includes(userRole));
    }
  }
  return true; // If no specific role requirement, allow access
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for static files and API routes
  if (pathname.startsWith('/_next') || 
      pathname.startsWith('/api') || 
      pathname.includes('.') ||
      pathname === '/favicon.ico') {
    return NextResponse.next();
  }
  
  // Get and parse auth cookie
  const authCookie = request.cookies.get('auth')?.value;
  const { isAuthenticated, userRole } = parseAuthCookie(authCookie);
  
  // Handle public routes
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    // If authenticated user tries to access login page, redirect to role-based path
    if (isAuthenticated && userRole) {
      const redirectPath = getRoleBasedRedirectPath(userRole);
      console.log('Authenticated user accessing public route, redirecting to:', redirectPath);
      return NextResponse.redirect(new URL(redirectPath, request.url));
    } else if (isAuthenticated && !userRole) {
      // User is authenticated but has no role - this is a data issue
      console.warn('Authenticated user has no role, showing error');
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('error', 'no_role');
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }
  
  // Handle admin routes (separate admin authentication - for future implementation)
  if (adminRoutes.some(route => pathname.startsWith(route))) {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
    if (userRole !== 'ADMIN') {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }
  
  // Handle admin login route
  if (pathname === '/admin/login') {
    // Always allow access to admin login page (separate from regular login)
    return NextResponse.next();
  }
  
  // Handle protected routes
  if (isRouteProtected(pathname)) {
    // Check authentication
    if (!isAuthenticated) {
      console.log('User not authenticated, redirecting to login');
      return NextResponse.redirect(new URL('/login', request.url));
    }
    
    // Check if user has a valid role
    if (!userRole) {
      console.warn('User authenticated but no role found, redirecting to login for re-authentication');
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('error', 'no_role');
      return NextResponse.redirect(loginUrl);
    }
    
    // Check role-based access
    if (!hasRoleAccess(pathname, userRole)) {
      console.log('User does not have access to this route, redirecting to home');
      return NextResponse.redirect(new URL('/', request.url));
    }
    
    return NextResponse.next();
  }
  
  // For root path, check authentication and redirect accordingly
  if (pathname === '/') {
    if (!isAuthenticated) {
      console.log('Root path accessed by unauthenticated user, redirecting to login');
      return NextResponse.redirect(new URL('/login', request.url));
    }
    
    // Check if user has a valid role
    if (!userRole) {
      console.warn('Root path accessed by authenticated user with no role, redirecting to login');
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('error', 'no_role');
      return NextResponse.redirect(loginUrl);
    }
    
    // Allow root path access - role-based redirection will be handled by the component
    return NextResponse.next();
  }
  
  return NextResponse.next();
}

// Configure the middleware to run only on specific routes
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder (public files)
     * - api routes (handled separately)
     * - static assets
     */
    '/((?!_next/static|_next/image|favicon.ico|public|api|.*\\.).*)',
  ],
};
