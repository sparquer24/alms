// Next.js client instrumentation (runs before the app hydrates).
// `onRouterTransitionStart` fires for every client-side navigation — <Link>,
// router.push/replace and back/forward — so the global progress bar can start
// the instant an officer clicks, before the next page has finished loading.

import { NAVIGATION_START_EVENT } from './utils/navigationEvents';

export function onRouterTransitionStart(url: string) {
  if (typeof window === 'undefined') return;
  try {
    const target = new URL(url, window.location.href);
    const current = window.location;
    // Same URL (or hash-only change) won't re-render a route, so no bar.
    if (target.pathname === current.pathname && target.search === current.search) return;
  } catch {
    /* fall through and show the bar */
  }
  window.dispatchEvent(new Event(NAVIGATION_START_EVENT));
}
