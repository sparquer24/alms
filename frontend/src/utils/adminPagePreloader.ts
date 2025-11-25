/**
 * Admin Page Preloading Utility
 * Enables fast navigation to admin pages by preloading components
 */

import { getAdminMenuItems, getAdminMenuPath } from '../config/adminMenuService';

/**
 * Preload all admin page components for instant navigation
 * Call this early on admin dashboard load
 */
export async function preloadAdminPages(): Promise<void> {
    if (typeof window === 'undefined') return;

    try {
        const items = getAdminMenuItems();

        // Dynamically import admin page components to warm up the module cache
        const imports = await Promise.allSettled([
            import('@/app/admin/userManagement/page'),
            import('@/app/admin/roleMapping/page'),
            import('@/app/admin/analytics/page'),
            import('@/app/admin/flowMapping/page'),
        ]);

        // Log any import failures (don't block on them)
        imports.forEach((result, index) => {
            if (result.status === 'rejected') {
                console.debug(`Failed to preload admin page ${index}:`, result.reason);
            }
        });
    } catch (err) {
        // Silent fail - preloading is just an optimization
        console.debug('Admin page preloading error:', err);
    }
}

/**
 * Preload a specific admin page
 */
export async function preloadAdminPage(key: string): Promise<void> {
    if (typeof window === 'undefined') return;

    try {
        const pathMap: Record<string, () => Promise<any>> = {
            'userManagement': () => import('@/app/admin/userManagement/page'),
            'roleMapping': () => import('@/app/admin/roleMapping/page'),
            'analytics': () => import('@/app/admin/analytics/page'),
            'flowMapping': () => import('@/app/admin/flowMapping/page'),
        };

        const importer = pathMap[key];
        if (importer) {
            await importer();
        }
    } catch (err) {
        console.debug(`Failed to preload admin page: ${key}`, err);
    }
}

/**
 * Create a link prefetch strategy for admin menu items
 * Preload the next likely page when user hovers over a menu item
 */
export function createAdminMenuPrefetcher() {
    const items = getAdminMenuItems();

    return {
        /**
         * Prefetch a menu item on hover
         */
        prefetch: (key: string) => {
            // Use requestIdleCallback if available for non-blocking prefetch
            if ('requestIdleCallback' in window) {
                (window as any).requestIdleCallback(() => preloadAdminPage(key), { timeout: 2000 });
            } else {
                // Fallback to setTimeout
                setTimeout(() => preloadAdminPage(key), 0);
            }
        },

        /**
         * Prefetch all admin pages
         */
        prefetchAll: function () {
            items.forEach(item => {
                this.prefetch(item.key);
            });
        },
    };
}
