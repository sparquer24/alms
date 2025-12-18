// This file contains all the role-based configurations for the Arms License Management System Dashboard
// Roles include Applicant, Zonal Superintendent, DCP, ACP, SHO, etc.
import jsCookie from "js-cookie";
import { getMenuItemsForAdminRole, getAdminMenuItems } from "./adminMenuService";

// New role config structure for dynamic sidebar
export type MenuItem = {
  name: string;
  statusIds?: number[]; // Optional status IDs for filtering applications
};

export type RoleConfig = {
  permissions: string[];
  dashboardTitle: string;
  canAccessSettings: boolean;
  menuItems: MenuItem[];
};

// ✅ Reads from cookie and builds RoleConfig
export const getRoleConfig = (userRoleOrObject: any): RoleConfig | undefined => {
  // Accept either a full user object (preferred) or a role identifier (string/code).
  // If a user object is provided, use it directly. Otherwise attempt to read the
  // `user` cookie as a fallback (legacy behavior).
  let parsedUser: any = undefined;

  // If we get a string role code (e.g. 'ADMIN', 'SHO'), create a minimal user object
  if (typeof userRoleOrObject === 'string') {
    parsedUser = { role: { code: userRoleOrObject.toUpperCase() } };
  } else if (userRoleOrObject && typeof userRoleOrObject === 'object') {
    parsedUser = userRoleOrObject;
  } else {
    const token = jsCookie.get("user");
    if (!token) {
      parsedUser = undefined;
    } else {
      try {
        parsedUser = JSON.parse(token);
      } catch (err) {
        // leave parsedUser undefined
        parsedUser = undefined;
      }
    }
  }

  // role may be under user.role or user directly
  const roleData: any = parsedUser?.role ?? parsedUser;

  if (!roleData || typeof roleData !== "object") {
    return undefined;
  }

  // Normalize keys from backend (snake_case) to frontend (camelCase)
  const code: string | undefined = roleData.code ?? roleData.role_code ?? roleData.RoleCode;
  const name: string | undefined = roleData.name ?? roleData.role_name ?? roleData.RoleName;
  const dashboardTitleRaw: string | undefined = roleData.dashboardTitle ?? roleData.dashboard_title;
  const canAccessSettingsRaw: boolean | undefined = roleData.canAccessSettings ?? roleData.can_access_settings;
  let permissionsRaw: string[] | string | undefined = roleData.permissions;
  if (permissionsRaw === undefined) permissionsRaw = roleData.permission_list ?? roleData.PermissionList;
  let menuItemsRaw: MenuItem[] | string[] | string | undefined = roleData.menuItems ?? roleData.menu_items;

  // Parse stringified JSON arrays if needed
  const safeParse = <T,>(v: any): T | undefined => {
    if (v === undefined || v === null) return undefined;
    if (Array.isArray(v)) return v as unknown as T;
    if (typeof v === "string") {
      try {
        const parsed = JSON.parse(v);
        return Array.isArray(parsed) ? (parsed as T) : undefined;
      } catch {
        return undefined;
      }
    }
    return undefined;
  };

  const permissionsArr: string[] = Array.isArray(permissionsRaw)
    ? (permissionsRaw as string[])
    : safeParse<string[]>(permissionsRaw) ?? [];

  // menu items can be array of strings or objects with name
  const menuItemsParsed = Array.isArray(menuItemsRaw)
    ? menuItemsRaw
    : safeParse<any[]>(menuItemsRaw) ?? [];

  let menuItems: MenuItem[] = (menuItemsParsed as any[]).map((it: any) => {
    // Handle new format: { name: "freshform", statusIds: [1,2,3] }
    if (it && typeof it === "object" && typeof it.name === "string") {
      return {
        name: it.name,
        statusIds: Array.isArray(it.statusIds) ? it.statusIds : undefined
      } as MenuItem;
    }
    // Handle old format: string
    if (typeof it === "string") {
      return { name: it } as MenuItem;
    }
    return { name: String(it) } as MenuItem;
  });

  // For ADMIN role, ensure all admin menu items are included
  const roleCode = code?.toUpperCase();
  if (roleCode === 'ADMIN') {
    // Admin role always gets all 4 admin pages
    const adminItems = getAdminMenuItems().map(item => ({ name: item.name }));
    menuItems = adminItems;
  }

  // Fallback menu items with status IDs for specific roles
  // Synced from ROLE_MENU_ITEMS_WITH_STATUS_IDS.json
  const roleSpecificMenuDefaults: Record<string, MenuItem[]> = {
    // Field Operational Roles
    'ZS': [
      { name: 'freshform', statusIds: [9] },
      { name: 'inbox', statusIds: [1, 9] },
      { name: 'sent', statusIds: [11, 1, 9] },
      { name: 'closed', statusIds: [10] },
      { name: 'drafts', statusIds: [13] },
      { name: 'finaldisposal', statusIds: [7] },
      { name: 'analytics' },
    ],
    'SHO': [
      { name: 'inbox', statusIds: [1, 9] },
      { name: 'sent', statusIds: [11, 1] },
    ],
    'ACP': [
      { name: 'inbox', statusIds: [1, 9] },
      { name: 'sent', statusIds: [11, 1] },
    ],
    'DCP': [
      { name: 'inbox', statusIds: [1, 9, 11] },
      { name: 'sent', statusIds: [11, 3] },
    ],

    // Administrative & Support Roles
    'AS': [
      { name: 'inbox', statusIds: [1, 9] },
      { name: 'sent', statusIds: [11, 1] },
    ],
    'ADO': [
      { name: 'inbox', statusIds: [1, 9] },
      { name: 'sent', statusIds: [11] },
    ],
    'CADO': [
      { name: 'inbox', statusIds: [1, 9, 11] },
      { name: 'sent', statusIds: [11, 3] },
    ],
    'JTCP': [
      { name: 'inbox', statusIds: [1, 9, 11] },
      { name: 'sent', statusIds: [11, 3] },
      { name: 'analytics' },
    ],
    'CP': [
      { name: 'inbox', statusIds: [1, 9, 11] },
      { name: 'sent', statusIds: [11, 3] },
      { name: 'analytics' },
    ],
    'ARMS_SUPDT': [
      { name: 'inbox', statusIds: [1, 9] },
      { name: 'sent', statusIds: [11, 1] },
    ],
    'ARMS_SEAT': [
      { name: 'inbox', statusIds: [1, 9] },
      { name: 'sent', statusIds: [11] },
    ],
    'ACO': [
      { name: 'inbox', statusIds: [1, 9] },
      { name: 'sent', statusIds: [11] },
    ],
  };

  // If menu items are empty or missing, use role-specific defaults
  if (roleCode && menuItems.length === 0 && roleSpecificMenuDefaults[roleCode]) {
    menuItems = roleSpecificMenuDefaults[roleCode];
  }

  // Menu items should be provided by the cookie/backend
  // If no menu items are provided, the role config will have an empty array

  if (code || name) {
    // Normalize dashboard title for specific roles
    let dashboardTitle = dashboardTitleRaw;
    if (!dashboardTitle) {
      const roleIdentifier = (code || name || '').toUpperCase();

      // Standardize dashboard titles for common roles
      switch (true) {
        case roleIdentifier === 'ZS' || roleIdentifier.includes('ZS'):
          dashboardTitle = 'ZS Dashboard';
          break;
        case roleIdentifier === 'DCP' || roleIdentifier.includes('DCP'):
          dashboardTitle = 'DCP Dashboard';
          break;
        case roleIdentifier === 'SHO' || roleIdentifier.includes('SHO'):
          dashboardTitle = 'SHO Dashboard';
          break;
        case roleIdentifier === 'ADMIN' || roleIdentifier.includes('ADMIN'):
          dashboardTitle = 'Admin Dashboard';
          break;
        case roleIdentifier === 'ACP' || roleIdentifier.includes('ACP'):
          dashboardTitle = 'ACP Dashboard';
          break;
        default:
          dashboardTitle = `${name || code} Dashboard`;
          break;
      }
    }

    const config = {
      permissions: permissionsArr,
      dashboardTitle,
      canAccessSettings: Boolean(canAccessSettingsRaw),
      menuItems,
    };
    return config;
  }

  return undefined; // no valid role found
};

// ✅ Role codes as constants for fallback/reference
export const RoleTypes = {
  APPLICANT: "APPLICANT",
  ZS: "ZS",
  DCP: "DCP",
  ACP: "ACP",
  SHO: "SHO",
  AS: "AS",
  ADO: "ADO",
  CADO: "CADO",
  JTCP: "JTCP",
  CP: "CP",
  ADMIN: "ADMIN",
  ARMS_SUPDT: "ARMS_SUPDT",
  ARMS_SEAT: "ARMS_SEAT",
  ACO: "ACO",
} as const;

export type RoleType = (typeof RoleTypes)[keyof typeof RoleTypes];
