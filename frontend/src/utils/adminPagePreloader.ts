/**
 * Admin Page Preloading Utility
 * Enables fast navigation to admin pages by preloading components
 */

import { getAdminMenuItems } from '../config/adminMenuService';

/**
 * Preload all admin page components for instant navigation
 * Call this early on admin dashboard load
 */
export async function preloadAdminPages(): Promise<void> {
    if (typeof window === 'undefined') return;

    try {
        const _items = getAdminMenuItems();

        // Dynamically import admin components to warm up the module cache
        const imports = await Promise.allSettled([
            import('@/components/UserManagement/UserManagementContent'),
            import('@/components/analytics/AnalyticsDashboard'),
            import('@/components/UserManagement/FlowMappingContent'),
            import('@/components/UserManagement/LocationsManagementContent'),
            import('@/components/UserManagement/ActionMappingContent'),
        ]);

        // Log any import failures (don't block on them)
        imports.forEach((result, index) => {
            if (result.status === 'rejected') {
                console.debug(`Failed to preload admin component ${index}:`, result.reason);
            }
        });
    } catch (err) {
        // Silent fail - preloading is just an optimization
        console.debug('Admin component preloading error:', err);
    }
}

/**
 * Preload a specific admin page component
 */
export async function preloadAdminPage(key: string): Promise<void> {
    if (typeof window === 'undefined') return;

    try {
        const pathMap: Record<string, () => Promise<any>> = {
            'userManagement': () => import('@/components/UserManagement/UserManagementContent'),
            'analytics': () => import('@/components/analytics/AnalyticsDashboard'),
            'flowMapping': () => import('@/components/UserManagement/FlowMappingContent'),
            'locationsManagement': () => import('@/components/UserManagement/LocationsManagementContent'),
            'actionMapping': () => import('@/components/UserManagement/ActionMappingContent'),
        };

        const importer = pathMap[key];
        if (importer) {
            await importer();
        }
    } catch (err) {
        console.debug(`Failed to preload admin component: ${key}`, err);
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
