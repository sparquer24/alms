/**
 * Navigation Utilities
 * Handles dynamic routing based on role and menu configuration
 */

import { getRoleConfig } from '@/config/roles';
import { getAdminMenuPath, AdminMenuItemKey } from '@/config/adminMenuService';

/**
 * Navigate to the first menu item for a given role
 * This ensures users land on their most relevant page after login
 *
 * @param role - User's role (string format like 'ADMIN', 'ZS', 'SHO', etc.)
 * @param router - Next.js router instance for navigation
 * @returns true if navigation was triggered, false otherwise
 */
export function navigateToDefaultMenu(
    role: string | undefined,
    router: any
): boolean {
    if (!role || !router) {
        return false;
    }

    try {
        // Get role configuration
        const roleConfig = getRoleConfig(role);
        if (!roleConfig || !roleConfig.menuItems || roleConfig.menuItems.length === 0) {
            console.warn(`[navigateToDefaultMenu] No menu items found for role: ${role}`);
            return false;
        }

        // Get first menu item
        const firstMenuItem = roleConfig.menuItems[0];
        if (!firstMenuItem || !firstMenuItem.name) {
            console.warn(`[navigateToDefaultMenu] First menu item invalid for role: ${role}`);
            return false;
        }

        const menuItemName = firstMenuItem.name.toLowerCase().trim();

        // Determine target path based on menu item name
        let targetPath: string | null = null;

        // Admin role - special handling
        const upperRole = role.toUpperCase();
        if (upperRole === 'ADMIN' || upperRole === 'ADMINISTRATOR' || upperRole === 'SUPER_ADMIN') {
            // Admin menu items map to specific paths
            const adminMenuPath = getAdminMenuPath(menuItemName as AdminMenuItemKey);
            if (adminMenuPath) {
                targetPath = adminMenuPath;
            } else {
                // Fallback to first admin page
                targetPath = '/admin/userManagement';
            }
        }
        // Inbox types (SHO, DCP, ACP, AS, ADO, CADO, JTCP, CP, ARMS_SUPDT, ARMS_SEAT, ACO)
        else if (menuItemName === 'inbox') {
            // Build inbox URL with appropriate type
            // Determine type based on role and available menu items
            let inboxType = 'forwarded';

            // If freshform is in the menu, use it as default inbox type for some roles
            if (role.toUpperCase() === 'ZS') {
                // ZS has freshform as first menu item, not inbox
                inboxType = 'freshform';
            } else {
                // For most roles, inbox is first and default type is forwarded
                inboxType = 'forwarded';
            }

            targetPath = `/inbox?type=${inboxType}`;
        }
        // Fresh form
        else if (menuItemName === 'freshform') {
            targetPath = '/freshform';
        }
        // Other menu items
        else {
            // Generic fallback - assume it's a path like /menuitems or similar
            targetPath = `/${menuItemName}`;
        }

        if (!targetPath) {
            console.warn(`[navigateToDefaultMenu] Could not determine target path for: ${menuItemName}`);
            return false;
        }

        // Set flag to tell Sidebar to skip localStorage restoration
        try {
            if (typeof sessionStorage !== 'undefined') {
                sessionStorage.setItem('loginRedirectApplied', 'true');
            }
        } catch (e) {
            console.warn('[navigateToDefaultMenu] Could not set sessionStorage flag', e);
        }

        // Perform navigation
        console.log(`[navigateToDefaultMenu] Redirecting ${role} to: ${targetPath}`);
        router.push(targetPath);

        return true;
    } catch (error) {
        console.error('[navigateToDefaultMenu] Error navigating to default menu:', error);
        return false;
    }
}

/**
 * Get the menu item name for a given role (useful for debugging)
 */
export function getDefaultMenuItemForRole(role: string | undefined): string | null {
    if (!role) return null;

    try {
        const roleConfig = getRoleConfig(role);
        if (!roleConfig?.menuItems?.[0]?.name) {
            return null;
        }
        return roleConfig.menuItems[0].name;
    } catch (error) {
        console.error('[getDefaultMenuItemForRole] Error:', error);
        return null;
    }
}
