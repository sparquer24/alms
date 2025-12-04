
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getRoleBasedRedirectPath } from './config/roleRedirections';

const protectedRoutes = [
  '/createforms/freshform',
  '/application',
  '/sent',
  '/inbox',
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
  '/admin/userManagement',
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
    let userRole: any = authData?.role || authData?.user?.role;

    // If role is an object (e.g. { code: 'ADMIN' }), flatten it and support different property names
    if (userRole && typeof userRole === 'object') {
      userRole = userRole.code || userRole.key || userRole.name || null;
    }

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
      userRole = authData?.roleCode ?? authData?.role_id ?? authData?.user?.roleCode ?? authData?.user?.role_id ?? undefined;
    }

    if (typeof userRole === 'string') {
      userRole = userRole.toUpperCase();
    }

    // Map known numeric role ids to role codes for robust handling
    const numericRoleMap: Record<string, string> = {
      '14': 'ADMIN',
      '7': 'ZS',
      '2': 'ZS', // backend sometimes uses 2 for ZS role_id in JWT payloads
      // add other mappings as needed
    };
    if (userRole && /^[0-9]+$/.test(String(userRole))) {
      const mapped = numericRoleMap[String(userRole)];
      if (mapped) userRole = mapped;
    }
    if (isAuthenticated && !userRole) {
    }

    return { isAuthenticated, userRole };
  } catch (error) {
    return { isAuthenticated: false };
  }
}

function isRouteProtected(pathname: string): boolean {
  // Remove query parameters for route matching
  const cleanPath = pathname.split('?')[0];
  return protectedRoutes.some(route => cleanPath.startsWith(route)) ||
    adminRoutes.some(route => cleanPath.startsWith(route));
}
function hasRoleAccess(pathname: string, userRole: string | undefined): boolean {
  // Remove query parameters for route matching
  const cleanPath = pathname.split('?')[0];
  for (const [route, allowedRoles] of Object.entries(roleBasedAccess)) {
    if (cleanPath.startsWith(route)) {
      return !!(userRole && allowedRoles.includes(userRole));
    }
  }
  return true;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip proxy for static files and API routes
  if (pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico') {
    return NextResponse.next();
  }

  // Get and parse auth cookie
  const authCookie = request.cookies.get('auth')?.value;
  let { isAuthenticated, userRole } = parseAuthCookie(authCookie);

  // Fallback: check standalone role cookie if role still missing
  if (!userRole) {
    const roleCookie = request.cookies.get('role')?.value;
    if (roleCookie) {
      try {
        userRole = String(roleCookie).replace(/"/g, '').trim().toUpperCase();
      } catch (e) {
        userRole = String(roleCookie).toUpperCase();
      }
    }
  }

  // Fallback: attempt to parse user cookie if present
  if (!userRole) {
    const userCookieRaw = request.cookies.get('user')?.value;
    if (userCookieRaw) {
      try {
        const parsedUser = JSON.parse(userCookieRaw);
        const flattenedRole = parsedUser?.role?.code || parsedUser?.roleCode || parsedUser?.role_id || parsedUser?.role || null;
        if (flattenedRole) userRole = String(flattenedRole).toUpperCase();
      } catch {
        // ignore
      }
    }
  }

  // Handle public routes
  if (publicRoutes.some(route => pathname.split('?')[0].startsWith(route))) {
    // If authenticated user tries to access login page, redirect to role-based path
    if (isAuthenticated && userRole) {
      const redirectPath = getRoleBasedRedirectPath(userRole);
      return NextResponse.redirect(new URL(redirectPath, request.url));
    } else if (isAuthenticated && !userRole) {
      // User is authenticated but has no role - this is a data issue
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('error', 'no_role');
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // Handle admin routes (separate admin authentication - for future implementation)
  if (adminRoutes.some(route => pathname.split('?')[0].startsWith(route))) {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
    if (userRole !== 'ADMIN') {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }
  if (isRouteProtected(pathname)) {
    // Check authentication
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Check if user has a valid role
    if (!userRole) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('error', 'no_role');
      return NextResponse.redirect(loginUrl);
    }

    // Check role-based access
    if (!hasRoleAccess(pathname, userRole)) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  // For root path, check authentication and redirect accordingly
  if (pathname === '/') {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Check if user has a valid role
    if (!userRole) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('error', 'no_role');
      return NextResponse.redirect(loginUrl);
    }

    // Allow root path access - role-based redirection will be handled by the component
    return NextResponse.next();
  }

  return NextResponse.next();
}

// Configure the proxy to run only on specific routes
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public|api|.*\.).*)',
  ],
};