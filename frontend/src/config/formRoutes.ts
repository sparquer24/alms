export const FORM_ROUTES = {
  PERSONAL_INFO: '/forms/createFreshApplication/personal-information',
  ADDRESS_DETAILS: '/forms/createFreshApplication/address-details',
  OCCUPATION_DETAILS: '/forms/createFreshApplication/occupation-business',
  CRIMINAL_HISTORY: '/forms/createFreshApplication/criminal-history',
  LICENSE_HISTORY: '/forms/createFreshApplication/license-history',
  LICENSE_DETAILS: '/forms/createFreshApplication/license-details',
  // BIOMETRIC_INFO: '/forms/createFreshApplication/biometric-information',
  DOCUMENTS_UPLOAD: '/forms/createFreshApplication/documents-upload',
  PREVIEW: '/forms/createFreshApplication/preview',
  DECLARATION: '/forms/createFreshApplication/declaration',
};

export const getNextRoute = (currentRoute: string): string | null => {
  const routes = Object.values(FORM_ROUTES);
  const currentIndex = routes.indexOf(currentRoute);
  return currentIndex !== -1 && currentIndex < routes.length - 1
    ? routes[currentIndex + 1]
    : null;
};

export const getPreviousRoute = (currentRoute: string): string | null => {
  const routes = Object.values(FORM_ROUTES);
  const currentIndex = routes.indexOf(currentRoute);
  return currentIndex > 0 ? routes[currentIndex - 1] : null;
};

export const getRouteIndex = (route: string): number => {
  const routes = Object.values(FORM_ROUTES);
  return routes.indexOf(route);
};

export const getTotalSteps = (): number => {
  return Object.values(FORM_ROUTES).length;
};