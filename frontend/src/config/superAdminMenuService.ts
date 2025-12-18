/**
 * Centralized Super Admin Menu Configuration Service
 * Provides stable, cached menu items for SUPER_ADMIN role
 * 
 * KEY DIFFERENCE: Super Admin has GLOBAL ACCESS - no state/location restrictions
 * While Admin menu items point to /admin/*, Super Admin points to /superAdmin/*
 */

import { MenuItem } from './roles';

export type SuperAdminMenuItemKey =
    | 'userManagement'
    | 'roleMapping'
    | 'analytics'
    | 'flowMapping'
    | 'locationsManagement'
    | 'applicationsDetails';

export interface SuperAdminMenuItem extends MenuItem {
    path: string;
    key: SuperAdminMenuItemKey;
    label: string;
    order: number;
}

/**
 * Core Super Admin menu items - Global access versions of admin pages
 * Ordered for consistent display in sidebar
 */
export const SUPER_ADMIN_MENU_ITEMS: Record<SuperAdminMenuItemKey, SuperAdminMenuItem> = {
    userManagement: {
        name: 'userManagement',
        key: 'userManagement',
        label: '🌐 Global User Management',
        path: '/superAdmin/userManagement',
        order: 1,
    },
    roleMapping: {
        name: 'roleMapping',
        key: 'roleMapping',
        label: 'Role Management',
        path: '/superAdmin/roleMapping',
        order: 2,
    },
    analytics: {
        name: 'analytics',
        key: 'analytics',
        label: 'Global Analytics',
        path: '/superAdmin/analytics',
        order: 3,
    },
    flowMapping: {
        name: 'flowMapping',
        key: 'flowMapping',
        label: 'Flow Mapping',
        path: '/superAdmin/flowMapping',
        order: 4,
    },
    locationsManagement: {
        name: 'locationsManagement',
        key: 'locationsManagement',
        label: 'Locations Management',
        path: '/superAdmin/locationsManagement',
        order: 5,
    },
    applicationsDetails: {
        name: 'applicationsDetails',
        key: 'applicationsDetails',
        label: 'Global Applications',
        path: '/superAdmin/applicationsDetails',
        order: 6,
    },
};

/**
 * Get the full Super Admin menu items ordered by priority
 */
export function getSuperAdminMenuItems(): SuperAdminMenuItem[] {
    return Object.values(SUPER_ADMIN_MENU_ITEMS).sort((a, b) => a.order - b.order);
}

/**
 * Get Super Admin menu item by key
 */
export function getSuperAdminMenuItem(key: SuperAdminMenuItemKey): SuperAdminMenuItem | undefined {
    return SUPER_ADMIN_MENU_ITEMS[key];
}

/**
 * Get Super Admin menu item path by key
 */
export function getSuperAdminMenuPath(key: SuperAdminMenuItemKey): string | undefined {
    return SUPER_ADMIN_MENU_ITEMS[key]?.path;
}

/**
 * Check if a path is a Super Admin menu path
 */
export function isSuperAdminMenuPath(pathname: string): boolean {
    return Object.values(SUPER_ADMIN_MENU_ITEMS).some(item => pathname === item.path || pathname.startsWith(item.path));
}

/**
 * Extract Super Admin menu key from pathname
 */
export function getSuperAdminMenuKeyFromPath(pathname: string): SuperAdminMenuItemKey | null {
    const item = Object.values(SUPER_ADMIN_MENU_ITEMS).find(
        item => pathname === item.path || pathname.startsWith(item.path)
    );
    return item?.key || null;
}

/**
 * Normalize Super Admin menu item names to canonical keys
 * Handles various naming conventions: camelCase, snake_case, kebab-case, spaces
 */
export function normalizeSuperAdminMenuItem(name: string): SuperAdminMenuItemKey | null {
    const normalized = name.toLowerCase().replace(/\s+/g, '');
    const candidates: Record<string, SuperAdminMenuItemKey> = {
        'usermanagement': 'userManagement',
        'user_management': 'userManagement',
        'user-management': 'userManagement',
        'rolemapping': 'roleMapping',
        'role_mapping': 'roleMapping',
        'role-mapping': 'roleMapping',
        'rolemanagement': 'roleMapping',
        'role_management': 'roleMapping',
        'role-management': 'roleMapping',
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
        'applicationsdetails': 'applicationsDetails',
        'applications_details': 'applicationsDetails',
        'applications-details': 'applicationsDetails',
        'applicationdetails': 'applicationsDetails',
        'application_details': 'applicationsDetails',
        'application-details': 'applicationsDetails',
    };

    return candidates[normalized] || null;
}

/**
 * Get the full Super Admin path (e.g., '/superAdmin/userManagement') for a menu item name
 */
export function getSuperAdminPathForMenuItem(itemName: string): string | null {
    if (!itemName) return null;

    // Try direct match first
    const key = itemName as SuperAdminMenuItemKey;
    if (SUPER_ADMIN_MENU_ITEMS[key]) {
        return SUPER_ADMIN_MENU_ITEMS[key].path;
    }

    // Try normalized match
    const normalized = normalizeSuperAdminMenuItem(itemName);
    if (normalized && SUPER_ADMIN_MENU_ITEMS[normalized]) {
        return SUPER_ADMIN_MENU_ITEMS[normalized].path;
    }

    return null;
}
