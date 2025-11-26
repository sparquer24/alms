import { NextRequest, NextResponse } from 'next/server';

/**
 * Middleware to protect admin routes
 * Checks for authentication before allowing access to /admin/* routes
 */
export function middleware(request: NextRequest) {
    const pathname = request.nextUrl.pathname;

    // Only apply middleware to admin routes
    if (!pathname.startsWith('/admin')) {
        return NextResponse.next();
    }

    // Check if user has authentication token
    const authToken = request.cookies.get('auth')?.value;

    if (!authToken) {
        // Redirect to login if not authenticated
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        url.searchParams.set('redirect', pathname);
        return NextResponse.redirect(url);
    }

    // Token exists - allow the request to proceed
    // Final role validation will be done in the admin layout component
    return NextResponse.next();
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
