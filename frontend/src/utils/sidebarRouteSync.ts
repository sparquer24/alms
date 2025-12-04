/**
 * Sidebar Route Synchronization Service
 * Centralizes URL parsing and tab selection logic to avoid duplication and improve testability
 */

export interface RouteTabState {
    type: string | null;
    isInboxPage: boolean;
    isAdminPage: boolean;
    shouldSkipInboxOpen: boolean;
}

export interface TabSyncConfig {
    pathname: string;
    searchParams: URLSearchParams;
    skipOpenInboxFlag?: boolean;
}

/**
 * Extract tab information from current route
 * Optimized single-pass parsing
 */
export function extractTabFromRoute(pathname: string, searchParams: URLSearchParams | null): RouteTabState {
    if (!pathname) {
        return {
            type: null,
            isInboxPage: false,
            isAdminPage: false,
            shouldSkipInboxOpen: false,
        };
    }

    // Determine page type
    const isInboxPage = pathname === '/inbox' || pathname.startsWith('/inbox');
    const isAdminPage = pathname.startsWith('/admin');

    // Get type parameter if on inbox or admin page
    const type = (isInboxPage || isAdminPage) ? (searchParams ? searchParams.get('type') : null) : null;

    // Check if we should skip opening inbox
    let shouldSkipInboxOpen = false;
    if (typeof window !== 'undefined' && window.sessionStorage) {
        try {
            shouldSkipInboxOpen = window.sessionStorage.getItem('skipOpenInbox') === 'true';
        } catch (e) {
            /* ignore */
        }
    }

    return {
        type,
        isInboxPage,
        isAdminPage,
        shouldSkipInboxOpen,
    };
}

/**
 * Determine if route has changed in a meaningful way (not just hash/query params)
 */
export function hasRouteChanged(
    prevPathname: string | null,
    currentPathname: string | null,
    prevType: string | null,
    currentType: string | null
): boolean {
    if (!prevPathname || !currentPathname) return true;

    // Different paths = route changed
    if (prevPathname !== currentPathname) return true;

    // Same path but different type = route changed (for inbox tabs)
    if (prevType !== currentType) return true;

    return false;
}

/**
 * Build normalized active item key from route
 */
export function buildActiveItemFromRoute(
    type: string | null,
    isInboxPage: boolean,
    shouldSkipInboxOpen: boolean,
    normalizeNavKey: (raw?: string | null) => string
): string | null {
    if (!type) return null;

    // If skipping inbox open, treat as top-level selection (no inbox- prefix)
    if (shouldSkipInboxOpen) {
        return normalizeNavKey(type);
    }

    // Otherwise, add inbox- prefix for inbox tabs
    if (isInboxPage) {
        return normalizeNavKey(`inbox-${type}`);
    }

    // For other pages (admin), just normalize the type
    return normalizeNavKey(type);
}

/**
 * Get valid inbox types that can be selected
 */
export function getValidInboxTypes(): Set<string> {
    return new Set(['forwarded', 'returned', 'redflagged', 'reenquiry']);
}

/**
 * Validate if a tab type is valid for selection
 */
export function isValidTabType(
    type: string | null,
    allowedMenuItems: string[],
    isInboxContext: boolean
): boolean {
    if (!type) return false;

    // For inbox context, allow standard types
    if (isInboxContext) {
        return getValidInboxTypes().has(type.toLowerCase());
    }

    // For other contexts, check against allowed menu items
    return allowedMenuItems.some(
        item => item.toLowerCase().replace(/\s+/g, '') === String(type).toLowerCase().replace(/\s+/g, '')
    );
}

/**
 * Clear the skip inbox flag and return its previous state
 */
export function clearSkipInboxFlag(): boolean {
    if (typeof window === 'undefined' || !window.sessionStorage) return false;

    try {
        const wasSet = window.sessionStorage.getItem('skipOpenInbox') === 'true';
        window.sessionStorage.removeItem('skipOpenInbox');
        return wasSet;
    } catch (e) {
        return false;
    }
}

/**
 * Check if we should reload the current page
 * Used for deferred refresh logic
 */
export function shouldReloadCurrentPage(pathname: string, type: string | null): boolean {
    return (
        (pathname === '/inbox' || pathname.startsWith('/inbox')) &&
        type === 'forwarded'
    );
}

/**
 * Memoized route comparison function to prevent unnecessary effect triggers
 */
export function routeStateChanged(
    prevState: RouteTabState | null,
    currentState: RouteTabState
): boolean {
    if (!prevState) return true;

    return (
        prevState.type !== currentState.type ||
        prevState.isInboxPage !== currentState.isInboxPage ||
        prevState.isAdminPage !== currentState.isAdminPage
    );
}
