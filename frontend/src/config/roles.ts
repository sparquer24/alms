// This file contains all the role-based configurations for the Arms License Management System Dashboard
// Roles include Applicant, Zonal Superintendent, DCP, ACP, SHO, etc.
import jsCookie from "js-cookie";

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
export const getRoleConfig = (userRole: any): RoleConfig | undefined => {
  const token = jsCookie.get("user");

  if (!token) {
    return undefined;
  }

  let parsedUser: any;
  try {
    parsedUser = JSON.parse(token);
  } catch (err) {
    return undefined;
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
