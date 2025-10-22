import { getCookie, setCookie, deleteCookie } from 'cookies-next';

export function getAuthTokenFromCookie(): string | null {
  try {
    const cookie = getCookie('auth');
    if (!cookie) return null;
    // Support token-only (string) and legacy JSON-wrapped cookie
    if (typeof cookie === 'string') {
      try {
        // Try parse JSON that contains token
        const parsed = JSON.parse(cookie);
        return parsed?.token ?? parsed?.accessToken ?? cookie;
      } catch (e) {
        // not JSON, return as-is
        return cookie;
      }
    }
    // If cookie is an object-like (some libs), try to extract
    try {
      const asAny: any = cookie;
      return asAny?.token ?? asAny?.accessToken ?? null;
    } catch (e) {
      return null;
    }
  } catch (error) {
    console.error('Error reading auth cookie:', error);
    return null;
  }
}

export function getUserFromCookie(): any | null {
  try {
    const cookie = getCookie('user');
    if (!cookie) return null;
    if (typeof cookie === 'string') {
      try {
        return JSON.parse(cookie);
      } catch (e) {
        return cookie;
      }
    }
    return cookie;
  } catch (error) {
    console.error('Error reading user cookie:', error);
    return null;
  }

}

export function isAuthCookieValid(): boolean {
  try {
    const token = getAuthTokenFromCookie();
    const user = getUserFromCookie();
    const role = getCookie('role');

    if (!token) return false;

    // If token looks like a JWT, try to validate expiry
    try {
      const parts = (token as string).split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]));
        if (payload?.exp && typeof payload.exp === 'number') {
          const now = Math.floor(Date.now() / 1000);
          if (payload.exp < now) return false;
        }
      }
    } catch (e) {
      // ignore token decode errors - presence of token is minimal requirement
    }

    // Require user and role to be present for a fully valid cookie set
    if (!user) return false;
    if (!role) return false;

    return true;
  } catch (error) {
    console.error('Error validating auth cookie:', error);
    return false;
  }
}

export default {
  getAuthTokenFromCookie,
  getUserFromCookie,
  isAuthCookieValid,
};
