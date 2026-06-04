import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

/**
 * Role-based redirect configuration — maps role codes to default landing pages.
 * Centralised here so the middleware can redirect authenticated users without
 * importing the frontend config module (which imports client-only code).
 *
 * ⚠️ Keep in sync with getRoleBasedRedirectPath in config/roleRedirections.ts
 */
const ROLE_REDIRECT_MAP: Record<string, string> = {
  'ADMIN': '/admin/userManagement',
  'SUPER_ADMIN': '/superAdmin/userManagement',
  'ARMS_SUPDT': '/inbox?type=forwarded',
  'SHO': '/inbox?type=forwarded',
  'ZS': '/inbox?type=forwarded',
  'DCP': '/inbox?type=forwarded',
  'ACP': '/inbox?type=forwarded',
  'CP': '/inbox?type=forwarded',
  'JTCP': '/inbox?type=forwarded',
  'ADO': '/inbox?type=forwarded',
  'CADO': '/inbox?type=forwarded',
  'AS': '/inbox?type=forwarded',
  'APPLICANT': '/inbox?type=sent',
};

/**
 * Get the role from cookies by checking multiple cookie keys.
 * The role may be stored in a dedicated 'role' cookie, inside the 'auth' cookie,
 * or inside the 'user' cookie.
 */
function extractRoleFromCookies(request: NextRequest): string | undefined {
  // 1. Direct 'role' cookie
  const roleCookie = request.cookies.get('role')?.value;
  if (roleCookie) {
    const cleaned = String(roleCookie).replace(/"/g, '').trim().toUpperCase();
    if (cleaned) return cleaned;
  }

  // 2. Parse the 'auth' cookie (JWT) for role from payload
  const authVal = request.cookies.get('auth')?.value;
  if (authVal) {
    try {
      const decoded = decodeURIComponent(authVal);
      // Try JSON wrapper first
      try {
        const parsed = JSON.parse(decoded);
        const roleFromAuth =
          parsed?.role?.code ||
          parsed?.role ||
          parsed?.user?.role?.code ||
          parsed?.user?.role ||
          null;
        if (roleFromAuth) return String(roleFromAuth).toUpperCase();
      } catch {
        // Not JSON — try JWT decode
      }
      // Try JWT payload
      const parts = decoded.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(
          Buffer.from(parts[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8'),
        );
        const roleFromJwt =
          payload?.role?.code ||
          payload?.role ||
          payload?.roleCode ||
          payload?.role_id ||
          null;
        if (roleFromJwt) return String(roleFromJwt).toUpperCase();
      }
    } catch {
      // ignore
    }
  }

  // 3. Parse the 'user' cookie
  const userVal = request.cookies.get('user')?.value;
  if (userVal) {
    try {
      const parsed = JSON.parse(userVal);
      const roleFromUser =
        parsed?.role?.code ||
        parsed?.roleCode ||
        parsed?.role_id ||
        parsed?.role ||
        null;
      if (roleFromUser) return String(roleFromUser).toUpperCase();
    } catch {
      // ignore
    }
  }

  return undefined;
}

/**
 * Check if a user is authenticated by verifying the JWT in the auth cookie.
 * Returns the extracted token string if valid, null otherwise.
 */
async function isAuthenticated(request: NextRequest): Promise<string | null> {
  const authCookieVal = request.cookies.get('auth')?.value;
  if (!authCookieVal) return null;

  let token: string | null = null;
  try {
    const parsed = JSON.parse(decodeURIComponent(authCookieVal));
    token = parsed?.token ?? parsed?.accessToken ?? null;
  } catch {
    token = authCookieVal;
  }

  if (!token) return null;

  try {
    const secretStr =
      process.env.JWT_SECRET ||
      '3097adb9893605ecbca993d05142aef1d4a92cd44f6ece72f32750f6697b82555d2634fa846a2ae78c2465d637b04568244fefaaf5e5f3514b92f357e43111d7';
    const secret = new TextEncoder().encode(secretStr);
    await jwtVerify(token, secret);
    return token;
  } catch {
    return null;
  }
}

/**
 * Middleware that:
 * 1. Redirects authenticated users away from /login to their role-based page
 * 2. Protects /admin and /superAdmin routes from unauthenticated access
 */
export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // ── Rule 1: Redirect authenticated users away from /login ───────────────
  if (pathname === '/login') {
    const token = await isAuthenticated(request);
    if (token) {
      const role = extractRoleFromCookies(request);
      if (role && ROLE_REDIRECT_MAP[role]) {
        return NextResponse.redirect(new URL(ROLE_REDIRECT_MAP[role], request.url));
      }
      // Authenticated but no role found — redirect to inbox as fallback
      return NextResponse.redirect(new URL('/inbox?type=forwarded', request.url));
    }
    // Not authenticated — allow access to login page
    return NextResponse.next();
  }

  // ── Rule 2: Protect /admin and /superAdmin routes ──────────────────────
  const isProtectedRoute =
    pathname.startsWith('/admin') || pathname.startsWith('/superAdmin');

  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  const token = await isAuthenticated(request);

  if (!token) {
    return redirectToLogin(request, pathname);
  }

  // Token is valid — proceed
  return NextResponse.next();
}

function redirectToLogin(request: NextRequest, pathname: string) {
  const url = request.nextUrl.clone();
  url.pathname = '/login';
  url.searchParams.set('redirect', pathname);
  return NextResponse.redirect(url);
}

/**
 * Configure which routes the middleware should run on
 */
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};
