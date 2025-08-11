// This file contains all the role-based configurations for the Arms License Management System Dashboard
// Roles include Applicant, Zonal Superintendent, DCP, ACP, SHO, etc.

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

export const roleConfigurations: Record<string, RoleConfig> = {
  ZS: {
    permissions: ["read", "write", "canViewFreshForm"],
    dashboardTitle: "ZS Dashboard",
    canAccessSettings: false,
    menuItems: [
      { name: "freshform" },
      { name: "inbox" },
      { name: "sent" },
      { name: "closed" },
      { name: "finaldisposal" },
      { name: "reports" },
    ],
  },
  DCP: {
    permissions: ["read", "write", "approve"],
    dashboardTitle: "DCP Dashboard",
    canAccessSettings: true,
    menuItems: [
      { name: "inbox" },
      { name: "sent" },
      { name: "finaldisposal" },
      { name: "reports" },
    ],
  },
  ACP: {
    permissions: ["read", "write"],
    dashboardTitle: "ACP Dashboard",
    canAccessSettings: true,
    menuItems: [
      { name: "inbox" },
      { name: "sent" },
      { name: "finaldisposal" },
      { name: "reports" },
      { name: "logout" },
    ],
  },
  SHO: {
    permissions: ["read"],
    dashboardTitle: "SHO Dashboard",
    canAccessSettings: true,
    menuItems: [
      { name: "inbox" },
      { name: "sent" },
      { name: "finaldisposal" },
      { name: "reports" },
      { name: "logout" },
    ],
  },
  ADMIN: {
    permissions: ["read", "write", "admin"],
    dashboardTitle: "Admin Dashboard",
    canAccessSettings: true,
    menuItems: [
      { name: "userManagement" },
      { name: "roleMapping" },
      { name: "analytics" }, // New tab for analytics or total reports
    ],
  },
};

export const getRoleConfig = (role: string): RoleConfig => {
  return roleConfigurations[role] ?? roleConfigurations["SHO"];
};

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
