
// Role Constants
export const ROLE_CODES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
} as const;

// Location Hierarchy Role Requirements
export const LOCATION_HIERARCHY_ROLES = {
  // Roles that require district selection
  DISTRICT_REQUIRED: ['JTCP', 'CP', 'CADO', 'ADO', 'ZS', 'DCP', 'ACP', 'SHO', 'AS'] as string[],
  // Roles that require range office selection
  RANGE_OFFICE_REQUIRED: ['DCP', 'ZS', 'ACP', 'SHO'] as string[],
  // Roles that require zone selection
  ZONE_REQUIRED: ['DCP', 'ZS', 'ACP', 'SHO'] as string[],
  // Roles that require division selection
  DIVISION_REQUIRED: ['ACP', 'SHO'] as string[],
  // Roles that require police station selection
  POLICE_STATION_REQUIRED: ['SHO'] as string[],
};

