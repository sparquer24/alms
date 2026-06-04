import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

/**
 * Middleware to protect admin and super admin routes
 * Checks for authentication before allowing access to /admin/* and /superAdmin/* routes
 */
export async function middleware(request: NextRequest) {
    const pathname = request.nextUrl.pathname;

    // Apply middleware to both admin and super admin routes
    const isProtectedRoute = pathname.startsWith('/admin') || pathname.startsWith('/superAdmin');
    
    if (!isProtectedRoute) {
        return NextResponse.next();
    }

    // Check if user has authentication token
    const authCookieVal = request.cookies.get('auth')?.value;

    if (!authCookieVal) {
        return redirectToLogin(request, pathname);
    }

    // Try to parse the token (it could be JSON encoded string or a raw JWT token)
    let token: string | null = null;
    try {
        const parsed = JSON.parse(decodeURIComponent(authCookieVal));
        token = parsed?.token ?? parsed?.accessToken ?? null;
    } catch (e) {
        token = authCookieVal;
    }

    if (!token) {
        return redirectToLogin(request, pathname);
    }

    try {
        // Verify token signature against JWT_SECRET
        const secretStr = process.env.JWT_SECRET || '3097adb9893605ecbca993d05142aef1d4a92cd44f6ece72f32750f6697b82555d2634fa846a2ae78c2465d637b04568244fefaaf5e5f3514b92f357e43111d7';
        const secret = new TextEncoder().encode(secretStr);
        await jwtVerify(token, secret);
        
        // Token is valid! Proceed to the page
        return NextResponse.next();
    } catch (error) {
        console.error('[Middleware] JWT verification failed:', error);
        return redirectToLogin(request, pathname);
    }
}

function redirectToLogin(request: NextRequest, pathname: string) {
    // Redirect to login if not authenticated
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
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public (public files)
         */
        '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
    ],
};
