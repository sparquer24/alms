// Centralized helpers and constants for ALMS Frontend

export const ROLE_ZS = 'ZS';
export const ROLE_APPLICANT = 'APPLICANT';
export const ROLE_DCP = 'DCP';
export const ROLE_ACP = 'ACP';
export const ROLE_SHO = 'SHO';
export const ROLE_ADMIN = 'ADMIN';

export const CAN_VIEW_FRESH_FORM = 'canViewFreshForm';

export const APPLICATION_TYPES = [
  {
    key: 'fresh',
    label: 'Fresh Application',
    enabled: true,
  },
  {
    key: 'renewal',
    label: 'Renewal Application',
    enabled: false, // Not yet implemented
  },
  // Add more types as needed
];

// Add more constants and helpers as needed

// Example: Check if user is ZS
export const isZS = (role: string | undefined | null) => role === ROLE_ZS;

// Example: Permission check
export const hasPermission = (permissions: string[] | undefined, permission: string) => {
  return Array.isArray(permissions) && permissions.includes(permission);
}; 