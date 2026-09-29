/**
 * Remembers the last License Management list URL (tab, filters, page) for the
 * session so pages opened from the list can send the user back to the same view.
 */
const LICENSES_LIST_URL_KEY = 'licenses:lastListUrl';
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
