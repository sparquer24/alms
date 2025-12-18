export const INVENTORY_ROLES = ['T&L Section', 'STORE', 'JTCP', 'CP']; 

// Role Constants
export const ROLE_CODES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
} as const;

export const DATATABLE_ROLE_CONFIG = {
    divisionRoles: ['DCP', 'CADO', 'STORE', 'JTCP', 'CP'],
    policeStationRoles: ['ACP', 'DCP', 'CADO', 'STORE', 'JTCP', 'CP'],
    zoneRoles: ['CADO', 'STORE', 'JTCP', 'CP'],
    // Add other role groups as needed
};

export const DASHBOARD_ROLE_CONFIG = ['SHO','DCP','CADO','STORE','JTCP','CP','AS']

// Location Hierarchy Role Requirements
export const LOCATION_HIERARCHY_ROLES = {
  // Roles that require district selection
  DISTRICT_REQUIRED: ['JTCP', 'CP', 'CADO', 'ADO', 'ZS', 'DCP', 'ACP', 'SHO', 'AS'] as string[],
  // Roles that require zone selection
  ZONE_REQUIRED: ['DCP', 'ZS', 'ACP', 'SHO'] as string[],
  // Roles that require division selection
  DIVISION_REQUIRED: ['ACP', 'SHO'] as string[],
  // Roles that require police station selection
  POLICE_STATION_REQUIRED: ['SHO'] as string[],
};

