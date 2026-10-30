/**
 * Admin Page Preloading Utility
 * Enables fast navigation to admin pages by preloading components
 */


/**
 * Preload all admin page components for instant navigation
 * Call this early on admin dashboard load
 */
export async function preloadAdminPages(): Promise<void> {
    if (typeof window === 'undefined') return;

    try {

        // Dynamically import admin components to warm up the module cache
        await Promise.allSettled([
            import('@/components/UserManagement/UserManagementContent'),
            import('@/components/UserManagement/FlowMappingContent'),
            import('@/components/UserManagement/LocationsManagementContent'),
            import('@/components/UserManagement/ActionMappingContent'),
        ]);
    } catch {
        // Silent fail - preloading is just an optimization
    }
}

