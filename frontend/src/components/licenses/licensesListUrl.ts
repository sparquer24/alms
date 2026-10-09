/**
 * Remembers the last License Management list URL (tab, filters, page) for the
 * session so pages opened from the list can send the user back to the same view.
 */
const LICENSES_LIST_URL_KEY = 'licenses:lastListUrl';
const OPENED_FROM_LIST_KEY = 'licenses:openedFromList';
const DEFAULT_LICENSES_LIST_URL = '/licenses?tab=all';

export const saveLicensesListUrl = (url: string) => {
  try {
    sessionStorage.setItem(LICENSES_LIST_URL_KEY, url);
  } catch {
    /* storage unavailable */
  }
};

export const getLicensesListUrl = () => {
  try {
    const url = sessionStorage.getItem(LICENSES_LIST_URL_KEY);
    if (url && url.startsWith('/licenses')) return url;
  } catch {
    /* storage unavailable */
  }
  return DEFAULT_LICENSES_LIST_URL;
};

/**
 * Marks that a license detail page was opened from the list, meaning the list
 * entry sits directly behind it in browser history.
 */
export const markLicenseOpenedFromList = (licenseId: string | number) => {
  try {
    sessionStorage.setItem(OPENED_FROM_LIST_KEY, String(licenseId));
  } catch {
    /* storage unavailable */
  }
};

/**
 * True (and clears the mark) when this license was opened from the list, so the
 * detail page's Back can pop history instead of pushing a duplicate list entry —
 * pushing makes the list's own Back return to the license, looping forever.
 */
export const consumeLicenseOpenedFromList = (licenseId: string | number) => {
  try {
    const opened = sessionStorage.getItem(OPENED_FROM_LIST_KEY) === String(licenseId);
    sessionStorage.removeItem(OPENED_FROM_LIST_KEY);
    return opened;
  } catch {
    return false;
  }
};
