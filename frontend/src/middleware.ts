
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Import role-based redirection logic
function getRoleBasedRedirectPath(userRole: string): string {
  // Define valid roles
  const validRoles = ['ADMIN', 'DCP', 'ACP', 'CP', 'ARMS_SUPDT', 'SHO', 'ZS', 'APPLICANT', 'ADO', 'CADO'];
  if (!userRole || !validRoles.includes(userRole)) {
    return '/login?error=invalid_role';
  }
  switch (userRole) {
    case 'ADMIN':
      return '/admin/users';
    case 'DCP':
    case 'ACP':
    case 'CP':
    case 'ARMS_SUPDT':
      return '/home?type=final';
    case 'ADO':
    case 'CADO':
    case 'SHO':
      return '/home?type=forwarded';
    case 'ZS':
      return '/home?type=freshform';
    case 'APPLICANT':
      return '/home?type=sent';
    default:
      return '/';
  }
}

const protectedRoutes = [
  '/createforms/freshform',
  '/application',
  '/sent',
  '/home',
  '/reports',
  '/settings',
  '/final',
  '/notifications',
];
const publicRoutes = [
  '/login',
  '/reset-password',
];
const adminRoutes = [
  '/admin/users',
  '/admin/locations',
  '/admin/forwarding',
  '/admin/reports',
];
const roleBasedAccess: Record<string, string[]> = {
  '/reports': ['DCP', 'ACP', 'CP', 'ADMIN'],
  '/final': ['DCP', 'CP', 'ADMIN', 'ARMS_SUPDT'],
};

function parseAuthCookie(authCookie: string | undefined): { isAuthenticated: boolean; userRole?: string } {
  if (!authCookie) {
    return { isAuthenticated: false };
  }
  try {
    let authData: any = null;
    const trimmed = authCookie.trim();
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      authData = JSON.parse(trimmed);
    } else if (trimmed.split('.').length === 3) {
      try {
        const parts = trimmed.split('.');
        const payload = parts[1];
        const b64 = payload.replace(/-/g, '+').replace(/_/g, '/');
        const json = Buffer.from(b64, 'base64').toString('utf8');
        const parsedPayload = JSON.parse(json);
        authData = {
          token: trimmed,
          user: parsedPayload,
          role: parsedPayload.role || parsedPayload.roleCode || parsedPayload.role_id || parsedPayload.roleId,
          isAuthenticated: true,
          exp: parsedPayload.exp,
        };
      } catch (jwtErr) {
        authData = { token: trimmed, isAuthenticated: true };
      }
    } else {
      try {
        authData = JSON.parse(trimmed);
      } catch (e) {
        authData = { token: trimmed, isAuthenticated: true };
      }
    }
    const token = authData?.token ?? null;
    let isAuthenticated = false;
    let userRole = authData?.role || authData?.user?.role;
    if (token) {
      const exp = authData?.exp ?? authData?.user?.exp ?? null;
      if (typeof exp === 'number') {
        const now = Math.floor(Date.now() / 1000);
        isAuthenticated = exp > now;
      } else {
        isAuthenticated = true;
      }
    } else {
      isAuthenticated = !!(authData?.isAuthenticated);
    }
    if (!userRole) {
      userRole = authData?.roleCode ?? authData?.role_id ?? authData?.user?.roleCode ?? undefined;
    }
    return { isAuthenticated, userRole };
  } catch (error) {
    return { isAuthenticated: false };
  }
}

function isRouteProtected(pathname: string): boolean {
  return protectedRoutes.some(route => pathname.startsWith(route)) ||
    adminRoutes.some(route => pathname.startsWith(route));
}
function hasRoleAccess(pathname: string, userRole: string | undefined): boolean {
  for (const [route, allowedRoles] of Object.entries(roleBasedAccess)) {
    if (pathname.startsWith(route)) {
      return !!(userRole && allowedRoles.includes(userRole));
    }
  }
  return true;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico') {
    return NextResponse.next();
  }

  // Strictly check for all three cookies
  const roleCookie = request.cookies.get('role');
  const userCookie = request.cookies.get('user');
  const authCookie = request.cookies.get('auth');
  const allCookiesPresent = roleCookie && userCookie && authCookie;

  // If any cookie is missing, clear all and redirect to login
  if (!allCookiesPresent) {
    const response = NextResponse.redirect(new URL('/login', request.url));
    request.cookies.getAll().forEach(cookie => {
      response.cookies.delete(cookie.name);
    });
    return response;
  }

  // Parse auth cookie for role-based redirect
  const { isAuthenticated, userRole } = parseAuthCookie(authCookie?.value);

  // If not authenticated or no role, redirect to login
  if (!isAuthenticated || !userRole) {
    const response = NextResponse.redirect(new URL('/login', request.url));
    request.cookies.getAll().forEach(cookie => {
      response.cookies.delete(cookie.name);
    });
    return response;
  }

  // If on login page and all cookies present, redirect to role-based home
  if (pathname === '/login') {
    const redirectPath = getRoleBasedRedirectPath(userRole);
    return NextResponse.redirect(new URL(redirectPath, request.url));
  }

  // For protected/admin routes, check role-based access
  if (adminRoutes.some(route => pathname.startsWith(route))) {
    if (userRole !== 'ADMIN') {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }
  if (isRouteProtected(pathname)) {
    if (!hasRoleAccess(pathname, userRole)) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  // Default: allow request
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public|api|.*\.).*)',
  ],
};
