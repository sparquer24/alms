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
    { name: "reports" },
  ],
  SHO: [
    { name: "inbox" },
    { name: "freshform" },
    { name: "sent" },
    { name: "closed" },
    { name: "drafts" },
    { name: "reports" },
  ],
  ZS: [
    { name: "inbox" },
    { name: "sent" },
    { name: "closed" },
    { name: "reports" },
  ],
  DCP: [
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
  console.log('🔍 getRoleConfig called with:', { userRole, token: token ? 'exists' : 'missing' });

  if (!token) {
    console.warn('❌ No user token found in cookie');
    return undefined;
  }

  let parsedUser: any;
  try {
    parsedUser = JSON.parse(token);
    console.log('✅ Parsed user cookie:', parsedUser);
  } catch (err) {
    console.error("❌ Invalid user cookie:", err);
    return undefined;
  }

  // role may be under user.role or user directly
  const roleData: any = parsedUser?.role ?? parsedUser;
  console.log('🔍 Role data extracted:', roleData);

  if (!roleData || typeof roleData !== "object") {
    console.warn('❌ Invalid role data structure');
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

  console.log('🔍 Extracted role properties:', { code, name, menuItemsRaw });

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

  // Fallback to default menu items if none found
  if (menuItems.length === 0) {
    const roleKey = (code || name || '').toUpperCase();
    menuItems = defaultMenuItems[roleKey] || defaultMenuItems.SHO;
    console.log(`⚠️ No menu items in cookie, using default for ${roleKey}:`, menuItems);
  } else {
    console.log('✅ Menu items from cookie:', menuItems);
  }

  if (code || name) {
    const config = {
      permissions: permissionsArr,
      dashboardTitle: dashboardTitleRaw ?? `${name || code} Dashboard`,
      canAccessSettings: Boolean(canAccessSettingsRaw),
      menuItems,
    };
    console.log('✅ Final role config:', config);
    return config;
  }

  console.warn('❌ No valid code or name found in role data');
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
