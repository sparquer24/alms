import { getCookie } from "cookies-next";

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
      } catch {
        // not JSON, return as-is
        return cookie;
      }
    }
    // If cookie is an object-like (some libs), try to extract
    try {
      const asAny: any = cookie;
      return asAny?.token ?? asAny?.accessToken ?? null;
    } catch {
      return null;
    }
  } catch {
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
      } catch {
        return cookie;
      }
    }
    return cookie;
  } catch {
    return null;
  }

}

