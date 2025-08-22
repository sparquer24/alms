import { getCookie } from 'cookies-next';

// Return the raw token string from the auth cookie. Supports legacy JSON or token-only.
export function getAuthTokenFromCookie(): string | null {
  try {
    const c = getCookie('auth');
    if (!c) return null;
    if (typeof c === 'string') {
      try {
        const parsed = JSON.parse(c);
        return parsed?.token ?? parsed?.accessToken ?? null;
      } catch (e) {
        return c;
      }
    }
    if (typeof c === 'object') return (c as any)?.token ?? null;
    return null;
  } catch (e) {
    console.error('getAuthTokenFromCookie error', e);
    return null;
  }
}

export function getUserFromCookie(): any | null {
  try {
    const u = getCookie('user');
    if (!u) return null;
    if (typeof u === 'string') {
      try {
        return JSON.parse(u);
      } catch (e) {
        return u;
      }
    }
    return u as any;
  } catch (e) {
    console.error('getUserFromCookie error', e);
    return null;
  }
}

export function getRoleFromCookie(): string | null {
  try {
    const r = getCookie('role');
    if (!r) return null;
    return typeof r === 'string' ? r : String(r);
  } catch (e) {
    console.error('getRoleFromCookie error', e);
    return null;
  }
}

export function isAuthCookieValid(): boolean {
  const token = getAuthTokenFromCookie();
  const user = getUserFromCookie();
  // At minimum require token and user object (id or username) or role cookie
  if (!token) return false;
  if (!user || (!user.id && !user.username && !getRoleFromCookie())) return false;
  return true;
}

export default {
  getAuthTokenFromCookie,
  getUserFromCookie,
  getRoleFromCookie,
  isAuthCookieValid,
};
