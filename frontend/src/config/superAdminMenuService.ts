/**
 * Centralized Super Admin Menu Configuration Service
 */

import { MenuItem } from './roles';

export type SuperAdminMenuItemKey =
    | 'userManagement'
    | 'roleMapping'
    | 'actionManagement'
    | 'roleActionMapping'
    | 'analytics'
    | 'flowMapping'
    | 'locationsManagement'
    | 'applicationTypeManagement'
    | 'categoryManagement'
    | 'workflowManagement';

export interface SuperAdminMenuItem extends MenuItem {
    path: string;
    key: SuperAdminMenuItemKey;
    label: string;
    order: number;
}

export const SUPER_ADMIN_MENU_ITEMS: Record<SuperAdminMenuItemKey, SuperAdminMenuItem> = {
    userManagement: {
        name: 'userManagement',
        key: 'userManagement',
        label: 'User Management',
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
    actionManagement: {
        name: 'actionManagement',
        key: 'actionManagement',
        label: 'Action Management',
        path: '/superAdmin/actionManagement',
        order: 3,
    },
    roleActionMapping: {
        name: 'roleActionMapping',
        key: 'roleActionMapping',
        label: 'Role-Action Mapping',
        path: '/superAdmin/roleActionMapping',
        order: 4,
    },
    analytics: {
        name: 'analytics',
        key: 'analytics',
        label: 'Global Analytics',
        path: '/superAdmin/analytics',
        order: 5,
    },
    flowMapping: {
        name: 'flowMapping',
        key: 'flowMapping',
        label: 'Flow Mapping',
        path: '/superAdmin/flowMapping',
        order: 6,
    },
    locationsManagement: {
        name: 'locationsManagement',
        key: 'locationsManagement',
        label: 'Locations Management',
        path: '/superAdmin/locationsManagement',
        order: 7,
    },
    applicationTypeManagement: {
        name: 'applicationTypeManagement',
        key: 'applicationTypeManagement',
        label: 'Application Types',
        path: '/superAdmin/applicationTypeManagement',
        order: 8,
    },
    categoryManagement: {
        name: 'categoryManagement',
        key: 'categoryManagement',
        label: 'Categories',
        path: '/superAdmin/categoryManagement',
        order: 9,
    },
    workflowManagement: {
        name: 'workflowManagement',
        key: 'workflowManagement',
        label: 'Workflows',
        path: '/superAdmin/workflowManagement',
        order: 10,
    }
};

export function getSuperAdminMenuItems(): SuperAdminMenuItem[] {
    return Object.values(SUPER_ADMIN_MENU_ITEMS).sort((a, b) => a.order - b.order);
}

export function getSuperAdminMenuItem(key: SuperAdminMenuItemKey): SuperAdminMenuItem | undefined {
    return SUPER_ADMIN_MENU_ITEMS[key];
}

export function getSuperAdminMenuPath(key: SuperAdminMenuItemKey): string | undefined {
    return SUPER_ADMIN_MENU_ITEMS[key]?.path;
}

export function isSuperAdminMenuPath(pathname: string): boolean {
    return Object.values(SUPER_ADMIN_MENU_ITEMS).some(item => pathname === item.path || pathname.startsWith(item.path));
}

export function getSuperAdminMenuKeyFromPath(pathname: string): SuperAdminMenuItemKey | null {
    const item = Object.values(SUPER_ADMIN_MENU_ITEMS).find(
        item => pathname === item.path || pathname.startsWith(item.path)
    );
    return item?.key || null;
}

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
        'actionmanagement': 'actionManagement',
        'action_management': 'actionManagement',
        'action-management': 'actionManagement',
        'actionsmanagement': 'actionManagement',
        'actions_management': 'actionManagement',
        'actions': 'actionManagement',
        'roleactionmapping': 'roleActionMapping',
        'role_action_mapping': 'roleActionMapping',
        'role-action-mapping': 'roleActionMapping',
        'actionsmapping': 'roleActionMapping',
        'locationsmanagement': 'locationsManagement',
        'locations_management': 'locationsManagement',
        'locations-management': 'locationsManagement',
        'locationmanagement': 'locationsManagement',
        'location_management': 'locationsManagement',
        'location-management': 'locationsManagement',
        'locations': 'locationsManagement',
        'applicationtypemanagement': 'applicationTypeManagement',
        'application_type_management': 'applicationTypeManagement',
        'application-type-management': 'applicationTypeManagement',
        'applicationtypes': 'applicationTypeManagement',
        'apptypes': 'applicationTypeManagement',
        'categorymanagement': 'categoryManagement',
        'category_management': 'categoryManagement',
        'category-management': 'categoryManagement',
        'categories': 'categoryManagement',
        'workflowmanagement': 'workflowManagement',
        'workflow_management': 'workflowManagement',
        'workflow-management': 'workflowManagement',
        'workflows': 'workflowManagement',
    };
    return candidates[normalized] || null;
}

export function getSuperAdminPathForMenuItem(itemName: string): string | null {
    if (!itemName) return null;
    const key = itemName as SuperAdminMenuItemKey;
    if (SUPER_ADMIN_MENU_ITEMS[key]) {
        return SUPER_ADMIN_MENU_ITEMS[key].path;
    }
    const normalized = normalizeSuperAdminMenuItem(itemName);
    if (normalized && SUPER_ADMIN_MENU_ITEMS[normalized]) {
        return SUPER_ADMIN_MENU_ITEMS[normalized].path;
    }
    return null;
}
