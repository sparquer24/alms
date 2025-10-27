// This file contains all the role-based configurations for the Arms License Management System Dashboard
// Roles include Applicant, Zonal Superintendent, DCP, ACP, SHO, etc.
import jsCookie from "js-cookie";

// New role config structure for dynamic sidebar
export type MenuItem = {
  name: string;
};

export type RoleConfig = {
  permissions: string[];
  dashboardTitle: string;
  canAccessSettings: boolean;
  menuItems: MenuItem[];
};

// Default menu items for common roles
const defaultMenuItems: Record<string, MenuItem[]> = {
  ADMIN: [
    { name: "userManagement" },
    { name: "roleManagement" },
    { name: "flowMapping" },
    { name: "drafts" },
    { name: "reports" },
  ],
  SHO: [
    { name: "inbox" },
    { name: "freshform" },
    { name: "sent" },
    { name: "closed" },
  ],
  ZS: [
    { name: "inbox" },
    { name: "freshform" },
    { name: "sent" },
    { name: "closed" },
    { name: "drafts" },
    { name: "finaldisposal" },
  ],
  DCP: [
    { name: "inbox" },
    { name: "sent" },
    { name: "closed" },
  ],
  AS: [
    { name: "inbox" },
    { name: "sent" },
    { name: "closed" },
    { name: "finaldisposal" },
    { name: "reports" },
  ],
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
    if (typeof it === "string") return { name: it } as MenuItem;
    if (it && typeof it === "object" && typeof it.name === "string") return { name: it.name } as MenuItem;
    return { name: String(it) } as MenuItem;
  });

  // Fallback to default menu items if none found, or ensure ZS users always have required menu items
  const roleKey = (code || name || '').toUpperCase();

  if (menuItems.length === 0) {
    menuItems = defaultMenuItems[roleKey] || defaultMenuItems.SHO;
  } else {

    // Ensure ZS users always have essential menu items regardless of cookie content
    if (roleKey === 'ZS' || roleKey.includes('ZS')) {
      const requiredZSItems = ['inbox', 'freshform', 'sent', 'closed', 'drafts', 'finaldisposal'];
      const currentItemNames = menuItems.map(item => item.name);

      // Add missing required items
      requiredZSItems.forEach(requiredItem => {
        if (!currentItemNames.includes(requiredItem)) {
          menuItems.push({ name: requiredItem });
        }
      });
    }
  }

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
