export const RENEWAL_ROUTES = {
  PERSONAL_INFO: '/forms/renewal/personal-information',
  ADDRESS_DETAILS: '/forms/renewal/address-details',
  OCCUPATION: '/forms/renewal/occupation',
  CRIMINAL_HISTORY: '/forms/renewal/criminal-history',
  LICENSE_HISTORY: '/forms/renewal/license-history',
  LICENSE_DETAILS: '/forms/renewal/license-details',
  BIOMETRIC_INFO: '/forms/renewal/biometric-information',
  DOCUMENTS_UPLOAD: '/forms/renewal/documents-upload',
  PREVIEW: '/forms/renewal/preview',
  DECLARATION: '/forms/renewal/declaration',
};

export const RENEWAL_STEPS = [
  { index: 0, label: 'Personal Information', route: RENEWAL_ROUTES.PERSONAL_INFO },
  { index: 1, label: 'Address Details', route: RENEWAL_ROUTES.ADDRESS_DETAILS },
  { index: 2, label: 'Occupation / Business', route: RENEWAL_ROUTES.OCCUPATION },
  { index: 3, label: 'Criminal History', route: RENEWAL_ROUTES.CRIMINAL_HISTORY },
  { index: 4, label: 'License History', route: RENEWAL_ROUTES.LICENSE_HISTORY },
  { index: 5, label: 'License Details', route: RENEWAL_ROUTES.LICENSE_DETAILS },
  { index: 6, label: 'Biometric Information', route: RENEWAL_ROUTES.BIOMETRIC_INFO },
  { index: 7, label: 'Documents Upload', route: RENEWAL_ROUTES.DOCUMENTS_UPLOAD },
  { index: 8, label: 'Preview', route: RENEWAL_ROUTES.PREVIEW },
  { index: 9, label: 'Declaration & Submit', route: RENEWAL_ROUTES.DECLARATION },
];

export const getNextRenewalRoute = (currentRoute: string): string | null => {
  const routes = Object.values(RENEWAL_ROUTES);
  const currentIndex = routes.indexOf(currentRoute);
  return currentIndex !== -1 && currentIndex < routes.length - 1
    ? routes[currentIndex + 1]
    : null;
};

export const getPreviousRenewalRoute = (currentRoute: string): string | null => {
  const routes = Object.values(RENEWAL_ROUTES);
  const currentIndex = routes.indexOf(currentRoute);
  return currentIndex > 0 ? routes[currentIndex - 1] : null;
};

export const getRenewalRouteIndex = (route: string): number => {
  const routes = Object.values(RENEWAL_ROUTES);
  return routes.indexOf(route);
};

export const getTotalRenewalSteps = (): number => {
  return Object.values(RENEWAL_ROUTES).length;
};

export const getStepByIndex = (index: number) => {
  return RENEWAL_STEPS[index] || null;
};

export const getCurrentStepFromRoute = (route: string): number => {
  return getRenewalRouteIndex(route);
};