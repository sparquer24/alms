/**
 * Centralized Admin Menu Configuration Service
 * Provides stable, cached menu items for admin role across all admin pages
 */

import { MenuItem } from './roles';

export type AdminMenuItemKey =
    | 'userManagement'
    | 'roleMapping'
    | 'analytics'
    | 'flowMapping'
    | 'locationsManagement';

export interface AdminMenuItem extends MenuItem {
    path: string;
    key: AdminMenuItemKey;
    label: string;
    order: number;
}

/**
 * Core admin menu items - These are the 5 required admin pages
 * Ordered for consistent display in sidebar
 */
export const ADMIN_MENU_ITEMS: Record<AdminMenuItemKey, AdminMenuItem> = {
    userManagement: {
        name: 'userManagement',
        key: 'userManagement',
        label: 'User Management',
        path: '/admin/userManagement',
        order: 1,
    },
    roleMapping: {
        name: 'roleMapping',
        key: 'roleMapping',
        label: 'Role Mapping',
        path: '/admin/roleMapping',
        order: 2,
    },
    analytics: {
        name: 'analytics',
        key: 'analytics',
        label: 'Analytics',
        path: '/admin/analytics',
        order: 3,
    },
    flowMapping: {
        name: 'flowMapping',
        key: 'flowMapping',
        label: 'Flow Mapping',
        path: '/admin/flowMapping',
        order: 4,
    },
    locationsManagement: {
        name: 'locationsManagement',
        key: 'locationsManagement',
        label: 'Locations Management',
        path: '/admin/locationsManagement',
        order: 5,
    },
};

/**
 * Get the full admin menu items ordered by priority
 */
export function getAdminMenuItems(): AdminMenuItem[] {
    return Object.values(ADMIN_MENU_ITEMS).sort((a, b) => a.order - b.order);
}

/**
 * Get admin menu item by key
 */
export function getAdminMenuItem(key: AdminMenuItemKey): AdminMenuItem | undefined {
    return ADMIN_MENU_ITEMS[key];
}

/**
 * Get admin menu item path by key
 */
export function getAdminMenuPath(key: AdminMenuItemKey): string | undefined {
    return ADMIN_MENU_ITEMS[key]?.path;
}

/**
 * Check if a path is an admin menu path
 */
export function isAdminMenuPath(pathname: string): boolean {
    return Object.values(ADMIN_MENU_ITEMS).some(item => pathname === item.path || pathname.startsWith(item.path));
}

/**
 * Extract admin menu key from pathname
 */
export function getAdminMenuKeyFromPath(pathname: string): AdminMenuItemKey | null {
    const item = Object.values(ADMIN_MENU_ITEMS).find(
        item => pathname === item.path || pathname.startsWith(item.path)
    );
    return item?.key || null;
}

/**
 * Normalize admin menu item names (handle various formats from backend)
 */
export function normalizeAdminMenuItem(name: string): AdminMenuItemKey | null {
    const normalized = name.toLowerCase().replace(/\s+/g, '');
    const candidates: Record<string, AdminMenuItemKey> = {
        'usermanagement': 'userManagement',
        'user_management': 'userManagement',
        'user-management': 'userManagement',
        'rolemapping': 'roleMapping',
        'role_mapping': 'roleMapping',
        'role-mapping': 'roleMapping',
        'rolesmanagement': 'roleMapping',
        'roles_management': 'roleMapping',
        'roles-management': 'roleMapping',
        'analytics': 'analytics',
        'flowmapping': 'flowMapping',
        'flow_mapping': 'flowMapping',
        'flow-mapping': 'flowMapping',
        'flowmap': 'flowMapping',
        'flow': 'flowMapping',
        'locationsmanagement': 'locationsManagement',
        'locations_management': 'locationsManagement',
        'locations-management': 'locationsManagement',
        'locationmanagement': 'locationsManagement',
        'location_management': 'locationsManagement',
        'location-management': 'locationsManagement',
        'locations': 'locationsManagement',
    };

    // Try direct match first
    if (candidates[normalized]) {
        return candidates[normalized];
    }

    // Try partial matches for edge cases
    for (const [key, value] of Object.entries(candidates)) {
        if (normalized.includes(key) || key.includes(normalized)) {
            return value;
        }
    }

    return null;
}

/**
 * Build menu items array from raw menu item names (from DB/API)
 * Ensures only valid admin menu items are included and in correct order
 */
export function buildAdminMenuItemsFromNames(names: (string | MenuItem)[]): AdminMenuItem[] {
    if (!Array.isArray(names)) return [];

    const validItems = new Set<AdminMenuItemKey>();

    names.forEach(item => {
        const itemName = typeof item === 'string' ? item : (item?.name || '');
        const normalized = normalizeAdminMenuItem(itemName);
        if (normalized) {
            validItems.add(normalized);
        }
    });

    // If empty, return all admin items (Admin role should see everything)
    if (validItems.size === 0) {
        return getAdminMenuItems();
    }

    return getAdminMenuItems().filter(item => validItems.has(item.key));
}

/**
 * Ensure Admin role always has all menu items
 * This function overrides any restricted menu item list for ADMIN users
 */
export function getMenuItemsForAdminRole(
    roleCode?: string,
    menuItemsFromRole?: (string | MenuItem)[]
): AdminMenuItem[] {
    const isAdmin = roleCode?.toUpperCase() === 'ADMIN';

    if (isAdmin) {
        // Admin always gets all menu items
        return getAdminMenuItems();
    }

    // For other roles, filter to valid items
    if (menuItemsFromRole && menuItemsFromRole.length > 0) {
        return buildAdminMenuItemsFromNames(menuItemsFromRole);
    }

    return [];
}
