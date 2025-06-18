import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define protected routes that require authentication
const protectedRoutes = [
  '/freshform',
  '/application',
  '/sent',
  '/inbox',
  '/reports',
  '/settings',
  '/final',
];

// Define public routes that don't require authentication
const publicRoutes = [
  '/login',
  '/reset-password',
];

// Define role-based access for specific routes
const roleBasedAccess: Record<string, string[]> = {
  '/reports': ['DCP', 'ACP', 'CP', 'ADMIN'],
  '/final': ['DCP', 'CP', 'ADMIN', 'ARMS_SUPDT'],
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Allow access to public routes without authentication
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }
  
  // Check if route is protected
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  
  if (isProtectedRoute) {
    // Get the auth cookie
    const authCookie = request.cookies.get('auth')?.value;
    
    // If no auth cookie exists, redirect to login
    if (!authCookie) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    
    try {
      // Parse the auth data
      const authData = JSON.parse(authCookie);
      
      // Check if token exists
      if (!authData.token || !authData.isAuthenticated) {
        return NextResponse.redirect(new URL('/login', request.url));
      }
      
      // Check role-based access for specific routes
      for (const [route, allowedRoles] of Object.entries(roleBasedAccess)) {
        if (pathname.startsWith(route) && !allowedRoles.includes(authData.role)) {
          // Redirect to home page if user role doesn't have access
          return NextResponse.redirect(new URL('/', request.url));
        }
      }
    } catch (error) {
      // If there's an error parsing the cookie, redirect to login
      console.error('Error parsing auth cookie:', error);
      return NextResponse.redirect(new URL('/login', request.url));
    }
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
     * - public (public files)
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};
