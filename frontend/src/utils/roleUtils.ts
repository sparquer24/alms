import { RoleTypes } from '../config/roles';

/**
 * Type for role values - can be string or object with code/name properties
 */
export type RoleValue = string | number | { code?: string; name?: string;[key: string]: any } | undefined | null;

/**
 * Numeric role ID to role code mapping
 */
const NUMERIC_ROLE_MAP: Record<string, string> = {
  '12': 'SUPER_ADMIN',  // Super Admin role ID
  '14': 'ADMIN',
  '3': 'ADMIN',
  '15': 'SUPER_ADMIN',  // Alternative Super Admin role ID
  '16': 'SUPER_ADMIN',  // Alternative Super Admin role ID
  '7': 'ZS',
  '2': 'ZS',
};

/**
 * Normalize a role to uppercase string
 * Handles both string roles and object roles with code/name properties
 */
export const normalizeRole = (role: RoleValue): string | undefined => {
  if (!role) return undefined;

  if (typeof role === 'string') {
    const trimmed = role.trim();
    // Check if it's a numeric role ID
    if (/^[0-9]+$/.test(trimmed)) {
      const mapped = NUMERIC_ROLE_MAP[trimmed];
      return mapped || trimmed;
    }
    return trimmed.toUpperCase();
  }

  if (typeof role === 'number') {
    const asString = String(role);
    const mapped = NUMERIC_ROLE_MAP[asString];
    return mapped || asString;
  }

  if (typeof role === 'object') {
    const roleObj = role as any;
    // Try code property first (most common)
    if (roleObj.code && typeof roleObj.code === 'string') {
      return roleObj.code.toUpperCase();
    }
    // Fall back to name property
    if (roleObj.name && typeof roleObj.name === 'string') {
      return roleObj.name.toUpperCase();
    }
  }

  return undefined;
};

/**
 * Check if a role is ADMIN or SUPER_ADMIN
 */
export const isAdminRole = (role: RoleValue): boolean => {
  const normalized = normalizeRole(role);
  return normalized === 'ADMIN' || normalized === 'SUPER_ADMIN';
};

/**
 * Check if a role matches any of the provided roles
 */
export const isRoleIn = (role: RoleValue, allowedRoles: string[]): boolean => {
  const normalized = normalizeRole(role);
  if (!normalized) return false;
  return allowedRoles.some(r => r.toUpperCase() === normalized);
};

/**
 * Check if a role can access admin pages
 */
export const canAccessAdmin = (role: RoleValue): boolean => {
  return isAdminRole(role);
};

export const getRoleHierarchy = (): Record<string, string[]> => ({
  [RoleTypes.SHO]: [RoleTypes.ACP, RoleTypes.ZS],
  [RoleTypes.ACP]: [RoleTypes.DCP, RoleTypes.ZS, RoleTypes.SHO],
  [RoleTypes.ZS]: [RoleTypes.ACP, RoleTypes.DCP, RoleTypes.ARMS_SUPDT],
  [RoleTypes.DCP]: [RoleTypes.ZS, RoleTypes.ACP, RoleTypes.CP, RoleTypes.JTCP, RoleTypes.ARMS_SUPDT],
  [RoleTypes.JTCP]: [RoleTypes.CP, RoleTypes.CADO],
  [RoleTypes.CP]: [RoleTypes.JTCP],
  [RoleTypes.CADO]: [RoleTypes.JTCP, RoleTypes.CP],
  [RoleTypes.ACO]: [RoleTypes.CADO, RoleTypes.ACP],
  [RoleTypes.AS]: [RoleTypes.ADO, RoleTypes.DCP],
  [RoleTypes.ARMS_SUPDT]: [RoleTypes.ARMS_SEAT, RoleTypes.DCP],
  [RoleTypes.ARMS_SEAT]: [RoleTypes.ADO, RoleTypes.ARMS_SUPDT],
  [RoleTypes.ADO]: [RoleTypes.CADO, RoleTypes.ARMS_SUPDT],
  [RoleTypes.ADMIN]: [
    RoleTypes.ZS,
    RoleTypes.DCP,
    RoleTypes.ACP,
    RoleTypes.SHO,
    RoleTypes.AS,
    RoleTypes.ARMS_SUPDT,
    RoleTypes.ARMS_SEAT,
    RoleTypes.ADO,
    RoleTypes.CADO,
    RoleTypes.JTCP,
    RoleTypes.CP
  ],
  [RoleTypes.SUPER_ADMIN]: [
    RoleTypes.ZS,
    RoleTypes.DCP,
    RoleTypes.ACP,
    RoleTypes.SHO,
    RoleTypes.AS,
    RoleTypes.ARMS_SUPDT,
    RoleTypes.ARMS_SEAT,
    RoleTypes.ADO,
    RoleTypes.CADO,
    RoleTypes.JTCP,
    RoleTypes.CP,
    RoleTypes.ADMIN
  ]
});

export const getRoleDisplayNames = (): Record<string, string> => ({
  [RoleTypes.SHO]: 'Station House Officer (SHO)',
  [RoleTypes.ACP]: 'Assistant Commissioner of Police (ACP)',
  [RoleTypes.ZS]: 'Zonal Superintendent (ZS)',
  [RoleTypes.DCP]: 'Deputy Commissioner of Police (DCP)',
  [RoleTypes.JTCP]: 'Joint Commissioner of Police (JCP)',
  [RoleTypes.CP]: 'Commissioner of Police (CP)',
  [RoleTypes.ADO]: 'Administrative Officer (ADO)',
  [RoleTypes.CADO]: 'Chief Administrative Officer (CADO)',
  [RoleTypes.ARMS_SUPDT]: 'ARMS Superintendent',
  [RoleTypes.ARMS_SEAT]: 'ARMS Seat',
  [RoleTypes.AS]: 'Arms Superintendent (AS)',
  [RoleTypes.ACO]: 'Assistant Compliance Officer (ACO)',
  [RoleTypes.ADMIN]: 'System Administrator',
  [RoleTypes.SUPER_ADMIN]: 'Super Administrator'
});

export const getRoleBasedActions = (role: string): { value: string; label: string }[] => {
  const common = [
    { value: 'return', label: 'Return Application' },
    { value: 'flag', label: 'Red Flag' },
    { value: 're-enquiry', label: 'Re-Enquiry' },
  ];

  const roleActions: Record<string, { value: string; label: string }[]> = {
    DCP: [
      { value: 'approve', label: 'Approve (TA)' },
      { value: 'reject', label: 'Reject' },
      { value: 'recommend', label: 'Recommend' },
      { value: 'not-recommend', label: 'Not Recommend' },
      ...common,
      { value: 'dispose', label: 'Dispose Application' },
    ],
    JTCP: [
      { value: 'recommend', label: 'Recommend to CP' },
      { value: 'not-recommend', label: 'Not Recommend' },
      ...common,
    ],
    ACP: [
      { value: 'approve', label: 'Recommend Approve' },
      { value: 'reject', label: 'Recommend Reject' },
      { value: 'recommend', label: 'Recommend' },
      { value: 'not-recommend', label: 'Not Recommend' },
      ...common,
    ],
    ZS: [
      { value: 'approve', label: 'Preliminarily Verify' },
      { value: 'reject', label: 'Preliminarily Reject' },
      { value: 'recommend', label: 'Recommend' },
      { value: 'not-recommend', label: 'Not Recommend' },
      ...common,
    ],
    SHO: [
      { value: 'approve', label: 'Enquiry Complete (Favorable)' },
      { value: 'reject', label: 'Enquiry Complete (Unfavorable)' },
      { value: 'recommend', label: 'Recommend' },
      { value: 'not-recommend', label: 'Not Recommend' },
      ...common,
    ],
    ADMIN: [
      { value: 'approve', label: 'Approve' },
      { value: 'reject', label: 'Reject' },
      { value: 'recommend', label: 'Recommend' },
      { value: 'not-recommend', label: 'Not Recommend' },
      ...common,
    ],
    SUPER_ADMIN: [
      { value: 'approve', label: 'Approve' },
      { value: 'reject', label: 'Reject' },
      { value: 'recommend', label: 'Recommend' },
      { value: 'not-recommend', label: 'Not Recommend' },
      ...common,
      { value: 'dispose', label: 'Dispose Application' },
    ],
  };

  return roleActions[role] || common;
};
