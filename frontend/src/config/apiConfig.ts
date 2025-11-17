// API Configuration
// Use a relative API path by default so client calls route through the reverse proxy
const rawApiBase = process.env.NEXT_PUBLIC_API_URL || '/api';
const apiBase = rawApiBase.replace(/\/$/, '');

export const apiConfig = {
  baseURL: apiBase,

  // Authentication endpoints
  auth: {
    login: '/auth/login',
    logout: '/auth/logout',
    refresh: '/auth/refresh',
    profile: '/auth/profile',
  },

  // User management endpoints
  users: {
    base: '/users',
    profile: '/users/profile',
    updateProfile: '/users/profile',
  },

  // Application endpoints
  applications: {
    base: '/applications',
    fresh: '/applications/fresh',
    renewal: '/applications/renewal',
    duplicate: '/applications/duplicate',
    status: '/applications/status',
  },

  // Location endpoints (hierarchical)
  locations: {
    base: '/locations',
    states: '/locations/states',
    districts: '/locations/districts',
    zones: '/locations/zones',
    divisions: '/locations/divisions',
    policeStations: '/locations/police-stations',
    hierarchy: '/locations/hierarchy',
  },

  // File upload endpoints
  files: {
    upload: '/files/upload',
    download: '/files/download',
  },

  // Workflow endpoints
  workflow: {
    base: '/workflow',
    submit: '/workflow/submit',
    approve: '/workflow/approve',
    reject: '/workflow/reject',
    history: '/workflow/history',
  },
};

// Helper function to build full API URLs
export const buildApiUrl = (endpoint: string): string => {
  const baseUrl = apiConfig.baseURL.replace(/\/$/, ''); // Remove trailing slash
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${baseUrl}${cleanEndpoint}`;
};

// Export individual endpoint groups for easier imports
export const { auth, users, applications, locations, files, workflow } = apiConfig;