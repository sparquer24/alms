import { createAsyncThunk } from '@reduxjs/toolkit';
import { AuthApi } from '../../config/APIClient';
import { setCredentials, setLoading, setError, logout } from '../slices/authSlice';
import { setCookie, getCookie } from 'cookies-next';

// Single-flight guard to dedupe concurrent /auth/me requests
let ongoingFetchCurrentUser: Promise<any> | null = null;
async function fetchCurrentUser(token: string) {
  if (!token) return null;
  if (ongoingFetchCurrentUser) return ongoingFetchCurrentUser;
  // Use getMe to retrieve the canonical user payload (log request/response)
  ongoingFetchCurrentUser = (async () => {
    try {
      try {
      } catch { }
      const resp = await AuthApi.getMe(token);
      return resp;
    } finally {
      ongoingFetchCurrentUser = null;
    }
  })();
  return ongoingFetchCurrentUser;
}

// Helpers for cookie snapshotting (detect changes across page refreshes)
const COOKIE_SNAPSHOT_KEY = 'auth_cookie_snapshot_v1';

function readCookieSnapshot(): Record<string, any> | null {
  try {
    if (typeof window === 'undefined') return null;
    const raw = window.localStorage.getItem(COOKIE_SNAPSHOT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function saveCookieSnapshot(snapshot: Record<string, any>) {
  try {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(COOKIE_SNAPSHOT_KEY, JSON.stringify(snapshot));
  } catch (e) {
  }
}

function removeCookieSnapshot() {
  try {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(COOKIE_SNAPSHOT_KEY);
  } catch (e) {
  }
}

// ----------------------
// Helper: cookie persistence & verification
// ----------------------
const verifyCookieWrittenTop = (name: string) => {
  try {
    if (typeof document === 'undefined') return false;
    return document.cookie.split('; ').some(c => c.startsWith(`${name}=`));
  } catch {
    return false;
  }
};

const writeCookieWithRetryTop = async (name: string, value: string, maxAgeSec = 60 * 60 * 24) => {
  try {
    setCookie(name, value, { maxAge: maxAgeSec, path: '/' });
  } catch (e) {
  }
  if (!verifyCookieWrittenTop(name) && typeof window !== 'undefined') {
    // retry once after a tiny delay
    await new Promise(res => setTimeout(res, 50));
    try { setCookie(name, value, { maxAge: maxAgeSec, path: '/' }); } catch { /* ignore */ }
  }
  return verifyCookieWrittenTop(name);
};

const pollForCookieTop = async (name: string, timeout = 2000, interval = 100) => {
  try {
    if (verifyCookieWrittenTop(name)) return true;
    const start = Date.now();
    while (Date.now() - start < timeout) {
      // eslint-disable-next-line no-await-in-loop
      await new Promise((r) => setTimeout(r, interval));
      if (verifyCookieWrittenTop(name)) return true;
    }
  } catch (e) {
    // ignore
  }
  return false;
};

async function persistAuthCookies(token: string, user: any) {
  // If auth cookie already exists, don't rewrite it here (we may have written it earlier)
  const authAlready = verifyCookieWrittenTop('auth');
  // Persist auth, role, and user cookies robustly and save snapshot
  const numericRoleToCode: Record<string, string> = { '14': 'ADMIN', '7': 'ZS', '2': 'ZS' };

  // Compute normalized role
  const extractRoleString = (u: any): string | null => {
    const roleObj = u?.role;
    const candidate = roleObj?.code || roleObj?.key || roleObj?.name || u?.roleCode || u?.role_id || u?.roleId || (typeof roleObj === 'string' ? roleObj : null) || (Array.isArray(u?.roles) ? u.roles[0] : null) || null;
    if (!candidate) return null;
    return String(candidate).trim().toUpperCase();
  };

  let normalizedRole = extractRoleString(user) || (typeof user?.role === 'string' ? String(user.role).toUpperCase() : undefined);
  let roleToPersist = normalizedRole;
  if (!roleToPersist) {
    const candidateRoleId = user?.role?.id ?? user?.role_id ?? user?.roleId;
    if (candidateRoleId) {
      const roleIdStr = String(candidateRoleId);
      roleToPersist = numericRoleToCode[roleIdStr] ?? roleIdStr;
    }
  }

  const minimalUserForCookie: Record<string, any> = {
    id: user?.id ?? null,
    role: (user?.role && typeof user.role === 'string') ? user.role : roleToPersist ?? null,
    username: user?.username ?? user?.userName ?? null,
    name: user?.name ?? null,
  };

  // Write cookies with verification
  const authOk = authAlready ? true : await writeCookieWithRetryTop('auth', token);
  const roleOk = roleToPersist ? await writeCookieWithRetryTop('role', String(roleToPersist)) : false;
  let userOk = false;
  try {
    userOk = await writeCookieWithRetryTop('user', JSON.stringify(minimalUserForCookie));
  } catch {
    userOk = false;
  }

  if (!userOk) {
    const tinyUser = JSON.stringify({ id: minimalUserForCookie.id, role: minimalUserForCookie.role });
    try { await writeCookieWithRetryTop('user', tinyUser); } catch { /* ignore */ }
  }

  // Fallbacks to localStorage
  if (typeof window !== 'undefined') {
    try {
      if (!verifyCookieWrittenTop('auth')) window.localStorage.setItem('auth_fallback', token);
      if (!verifyCookieWrittenTop('role') && roleToPersist) window.localStorage.setItem('role_fallback', String(roleToPersist));
      if (!verifyCookieWrittenTop('user')) window.localStorage.setItem('user_fallback', JSON.stringify(minimalUserForCookie));
    } catch (e) {
    }
  }

  // Diagnostic snapshot after writes
  try {
    if (typeof document !== 'undefined') {
    }
  } catch (e) {
    // ignore
  }

  // Save snapshot
  const snapshotAuth = verifyCookieWrittenTop('auth') ? token : (typeof window !== 'undefined' ? window.localStorage.getItem('auth_fallback') : null);
  const snapshotRole = verifyCookieWrittenTop('role') ? roleToPersist : (typeof window !== 'undefined' ? window.localStorage.getItem('role_fallback') : null);
  const snapshotUser = verifyCookieWrittenTop('user') ? JSON.stringify(minimalUserForCookie) : (typeof window !== 'undefined' ? window.localStorage.getItem('user_fallback') : null);
  saveCookieSnapshot({ auth: snapshotAuth, user: snapshotUser, role: snapshotRole });

  // Wait for role cookie when expected (to avoid server missing it on next request)
  if (typeof window !== 'undefined' && roleToPersist) {
    const roleVisible = verifyCookieWrittenTop('role') || await pollForCookieTop('role', 2000, 100);
    if (!roleVisible) {
      try {
        const fallback = window.localStorage.getItem('role_fallback');
        if (fallback) {
          try { setCookie('role', String(fallback), { maxAge: 60 * 60 * 24, path: '/' }); } catch { /* ignore */ }
          // tiny pause
          await new Promise(r => setTimeout(r, 100));
        }
      } catch { /* ignore */ }
    }
  }

  // Cleanup temporary marker cookie if present (login flow sets `auth_pending` during the exchange)
  try {
    if (verifyCookieWrittenTop('auth_pending')) {
      try { setCookie('auth_pending', '', { maxAge: 0, path: '/' }); } catch { /* ignore */ }
    }
  } catch (e) {
    // ignore cleanup errors
  }
}


export const initializeAuth = createAsyncThunk(
  'auth/initialize',
  async (_, { dispatch }) => {
    try {
      // Check cookies for auth data (be defensive about parsing)
      const cookieAuth = getCookie('auth');
      // Detect cookie changes across refreshes: compare with saved snapshot
      const savedSnapshot = readCookieSnapshot();
      const currentSnapshot = {
        auth: cookieAuth ?? null,
        user: getCookie('user') ?? null,
        role: getCookie('role') ?? null,
      };
      if (savedSnapshot && JSON.stringify(savedSnapshot) !== JSON.stringify(currentSnapshot)) {
        // If a login is currently in-flight on another tab or same tab, a temporary
        // `auth_pending` cookie is set. In that case, wait briefly for the login to
        // finish before assuming cookies were externally modified — this avoids
        // clearing cookies immediately during our own login flow.
        try {
          const pending = getCookie('auth_pending');
          if (pending) {
            const start = Date.now();
            // wait for auth_pending to be removed (login finished) or timeout
            while (Date.now() - start < 2000) {
              // eslint-disable-next-line no-await-in-loop
              await new Promise((r) => setTimeout(r, 100));
              if (!getCookie('auth_pending')) break;
            }
            // recompute snapshot after wait
            const recheck = {
              auth: getCookie('auth') ?? null,
              user: getCookie('user') ?? null,
              role: getCookie('role') ?? null,
            };
            if (JSON.stringify(savedSnapshot) === JSON.stringify(recheck)) {
            } else {
              removeCookieSnapshot();
              dispatch(logout());
              return;
            }
          } else {
            // No pending login — clear as before
            removeCookieSnapshot();
            dispatch(logout());
            return;
          }
        } catch (e) {
          removeCookieSnapshot();
          dispatch(logout());
          return;
        }
      }
      if (cookieAuth) {
        // Try to JSON-parse first (legacy), otherwise treat cookieAuth as a raw token string
        let token: string | null = null;
        try {
          const parsed = JSON.parse(cookieAuth as string);
          token = parsed?.token ?? parsed?.accessToken ?? null;
        } catch (e) {
          // Not JSON, assume token string
          token = typeof cookieAuth === 'string' ? cookieAuth : null;
        }

        if (token) {
          // Use the token to fetch canonical user payload (deduped)
          const userResponse = await fetchCurrentUser(token);
          if (userResponse && userResponse.success && userResponse.body) {
            const user = userResponse.body;
            dispatch(setCredentials({ user, token }));
            // Persist only the token in the cookie (token-only semantics)
            try {
              setCookie('auth', token, { maxAge: 60 * 60 * 24, path: '/' });
            } catch (e) {
            }

            // Ensure role and user cookies exist so page-load checks succeed.
            // Compute a minimal user and role similar to login flow.
            try {
              const numericRoleToCode: Record<string, string> = {
                '14': 'ADMIN',
                '7': 'ZS',
                '2': 'ZS',
              };

              let roleToPersist: string | undefined;
              // Prefer explicit role string from payload
              if (user && user.role) {
                if (typeof user.role === 'string') roleToPersist = String(user.role).toUpperCase();
                else if (user.role.code) roleToPersist = String(user.role.code).toUpperCase();
                else if (user.role.id) roleToPersist = numericRoleToCode[String(user.role.id)] ?? String(user.role.id);
              } else if (user?.roleCode) {
                roleToPersist = String(user.roleCode).toUpperCase();
              }

              const minimalUserForCookie: Record<string, any> = {
                id: user?.id ?? null,
                role: roleToPersist ?? (typeof user?.role === 'string' ? user.role : null),
                username: user?.username ?? user?.userName ?? null,
                name: user?.name ?? null,
              };

              if (!getCookie('role') && roleToPersist) {
                try { setCookie('role', String(roleToPersist), { maxAge: 60 * 60 * 24, path: '/' }); } catch { /* ignore */ }
              }
              if (!getCookie('user')) {
                try { setCookie('user', JSON.stringify(minimalUserForCookie), { maxAge: 60 * 60 * 24, path: '/' }); } catch { /* ignore */ }
              }
            } catch (e) {
            }

            // Save snapshot for future refresh checks
            saveCookieSnapshot({ auth: token, user: getCookie('user') ?? null, role: getCookie('role') ?? null });

            // If all three cookies are present, redirect based on role
            try {
              if (typeof window !== 'undefined') {
                const cAuth = getCookie('auth');
                const cRole = getCookie('role');
                const cUser = getCookie('user');
                if (cAuth && cRole && cUser) {
                  // Normalize role
                  const roleStr = String(cRole).replace(/"/g, '').trim().toUpperCase();
                  const isAdmin = roleStr === 'ADMIN' || roleStr === 'ADMINISTRATOR' || roleStr === 'SUPERADMIN';
                  const target = isAdmin ? '/admin/userManagement' : '/inbox?type=freshform';
                  // Only redirect if not already on the target to avoid loops
                  try {
                    const current = window.location.pathname + window.location.search;
                    if (!current.startsWith(target)) {
                      window.location.href = target;
                    }
                  } catch (e) {
                    // best-effort
                  }
                }
              }
            } catch (e) {
              // ignore
            }

            return { user, token };
          } else {
            dispatch(logout());
          }
        }
      }
    } catch (error) {
      dispatch(logout());
    }
  }
);

export const login = createAsyncThunk(
  'auth/login',
  async ({ username, password }: { username: string; password: string }, { dispatch }) => {
    try {
      dispatch(setLoading(true));
      const response = await AuthApi.login({ username, password });
      // Handle different response structures
      let token: string;
      let user: any = null;
      // Backend returns { success: true, token: "...", user: {...} } directly (not wrapped in body)
      if (response.success && (response as any).token) {
        // Direct response from backend
        token = (response as any).token;
        user = (response as any).user;
      } else if (response.body && response.body.token) {
        // Standard wrapped response structure
        token = response.body.token;
        user = response.body.user;
      } else {
        if (response.statusCode === 401) {
          const errorMessage = response.message || 'Invalid username or password';
          dispatch(setError(errorMessage));
          throw new Error(errorMessage);
        }
        throw new Error('Login succeeded but no token was returned.');
      }
      // After obtaining the token, write the token-only auth cookie immediately so
      // subsequent requests (including getMe) have the token available in cookies.
      try {
        try {
          setCookie('auth', token, { maxAge: 60 * 60 * 24, path: '/' });
          // Set a short-lived marker so other initialization code can know login is in-flight
          setCookie('auth_pending', '1', { maxAge: 60, path: '/' });

          // If the login response already included a user with a role, persist the
          // role cookie immediately so server-side middleware can see it on the
          // next request. Don't overwrite an existing role cookie.
          try {
            const existingRole = getCookie('role');
            if (!existingRole && user) {
              // Support nested role object with `code`, a plain string, or roleCode
              const roleCandidate = user?.role?.code ?? user?.role ?? user?.roleCode ?? user?.role_id ?? null;
              if (roleCandidate) {
                const normalized = String(roleCandidate).toUpperCase();
                try { setCookie('role', normalized, { maxAge: 60 * 60 * 24, path: '/' }); } catch { /* ignore */ }
              }
            }
          } catch (e) {
            // ignore role write errors
          }
        } catch (cookieErr) {
        }
        const meResponse = await AuthApi.getMe(token);
        if (meResponse && meResponse.success && (meResponse.body || (meResponse as any).data)) {
          // Some clients return body, others return data
          const payload = meResponse.body ?? (meResponse as any).data ?? meResponse;
          // Store the complete payload as the user object (preserve role object)
          user = payload;
          // Normalize role using user.role.code if available
          const roleCodeFromPayload = (user && user.role && user.role.code) ? user.role.code : (user?.roleCode ?? null);
          if (roleCodeFromPayload) {
            try {
              user = { ...user, role: String(roleCodeFromPayload).trim().toUpperCase() };
            } catch (e) {
              // ignore
            }
          }
        } else {
          // Fallback: decode token for basic user info
          try {
            const tokenPayload = JSON.parse(atob(token.split('.')[1]));
            user = {
              id: tokenPayload.userId || tokenPayload.sub,
              username: tokenPayload.username,
              role: tokenPayload.role,
              name: tokenPayload.name || tokenPayload.username,
              email: tokenPayload.email || '',
              designation: tokenPayload.designation || '',
              createdAt: new Date().toISOString(),
              lastLogin: new Date().toISOString(),
              permissions: [],
              availableActions: []
            };
          } catch (tokenError) {
            throw new Error('Invalid token received from server');
          }
        }
      } catch (meErr) {
        // Fallback: decode token for basic user info
        try {
          const tokenPayload = JSON.parse(atob(token.split('.')[1]));
          user = {
            id: tokenPayload.userId || tokenPayload.sub,
            username: tokenPayload.username,
            role: tokenPayload.role,
            name: tokenPayload.name || tokenPayload.username,
            email: tokenPayload.email || '',
            designation: tokenPayload.designation || '',
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString(),
            permissions: [],
            availableActions: []
          };
        } catch (tokenError) {
          throw new Error('Invalid token received from server');
        }
      }
      // Robust role extraction & normalization
      const extractRoleString = (u: any): string | null => {
        // Support a variety of role shapes: nested objects with code/name/key, flat fields, or arrays
        const roleObj = u?.role;
        const candidate =
          roleObj?.code || roleObj?.key || roleObj?.name ||
          u?.roleCode || u?.role_id || u?.roleId ||
          (typeof roleObj === 'string' ? roleObj : null) ||
          (Array.isArray(u?.roles) ? u.roles[0] : null) ||
          null;
        if (!candidate) return null;
        return String(candidate).trim().toUpperCase();
      };
      const roleString = extractRoleString(user);
      // Always normalize and set the role on the user object when possible
      if (roleString) {
        user = { ...user, role: roleString };
      } else if (typeof user.role === 'string') {
        // Ensure existing role strings are normalized to uppercase
        user = { ...user, role: String(user.role).toUpperCase() };
      }

      dispatch(setCredentials({ user, token }));

      // Persist cookies and wait for them to be visible; helper handles retries + snapshot
      await persistAuthCookies(token, user);
      // Finally reload so server-side middleware sees the fresh cookies and can redirect.
      try {
        if (typeof window !== 'undefined') {
        }
      } catch { /* best-effort */ }
      // NOTE: Previously this thunk forced a window.location.reload() here which
      // could race with client-side navigation and middleware. We intentionally
      // do not reload here and instead let the UI perform the navigation so
      // redirects (including admin routes) work reliably.

      return { token, user };
    } catch (error: any) {
      // Extract error message from axios error response
      let errorMessage = 'Login failed';
      
      // Check for axios error response structure
      if (error?.response?.data) {
        const data = error.response.data;
        // Handle the 401 error format: { statusCode: 401, message: "...", error: "Unauthorized" }
        errorMessage = data.message || data.error || errorMessage;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      dispatch(setError(errorMessage));
      throw error;
    } finally {
      dispatch(setLoading(false));
    }
  }
);

export const getCurrentUser = createAsyncThunk(
  'auth/getCurrentUser',
  async (_, { dispatch }) => {
    try {
      dispatch(setLoading(true));

      // Get token from cookies (support token-only and legacy JSON)
      const authCookie = getCookie('auth');
      let token: string | null = null;
      if (authCookie) {
        try {
          const parsed = JSON.parse(authCookie as string);
          token = parsed?.token ?? parsed?.accessToken ?? null;
        } catch (e) {
          token = typeof authCookie === 'string' ? authCookie : null;
        }
      }

      if (!token) throw new Error('No authentication token found');

      const response = await AuthApi.getCurrentUser(token);

      if (response.success && response.body) {
        const user = response.body;
        dispatch(setCredentials({ user, token }));
        return { user, token };
      } else {
        throw new Error(response.message || 'Failed to get current user');
      }
    } catch (error) {
      dispatch(setError(error instanceof Error ? error.message : 'Failed to get current user'));
      throw error;
    } finally {
      dispatch(setLoading(false));
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { dispatch }) => {
    try {
      dispatch(setLoading(true));
      // Call backend logout if available (best-effort)
      try {
        await AuthApi.logout();
      } catch (apiErr) {
      }

      // Reset Redux auth state
      dispatch(logout());

      // Clear auth cookies and local snapshot
      // Remove saved snapshot
      removeCookieSnapshot();
      // Explicitly clear cookies that represent auth state
      try {
        try { setCookie('auth', '', { maxAge: 0, path: '/' }); } catch { /* ignore */ }
        try { setCookie('user', '', { maxAge: 0, path: '/' }); } catch { /* ignore */ }
        try { setCookie('role', '', { maxAge: 0, path: '/' }); } catch { /* ignore */ }
        try { setCookie('auth_pending', '', { maxAge: 0, path: '/' }); } catch { /* ignore */ }
        if (typeof window !== 'undefined') {
          try { window.localStorage.removeItem('auth_fallback'); } catch { /* ignore */ }
          try { window.localStorage.removeItem('role_fallback'); } catch { /* ignore */ }
          try { window.localStorage.removeItem('user_fallback'); } catch { /* ignore */ }
        }
      } catch (e) {
      }

      // Additionally remove all cookies visible to the document and clear storage
      try {
        if (typeof document !== 'undefined') {
          // Iterate over all cookies and expire them
          const cookies = document.cookie ? document.cookie.split(';') : [];
          cookies.forEach((c) => {
            const eqPos = c.indexOf('=');
            const name = eqPos > -1 ? c.substr(0, eqPos).trim() : c.trim();
            try {
              // Expire cookie for current path
              document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
              // Also attempt to expire cookie without path and with root domain attempt (best-effort)
              document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT`;
            } catch (e) {
              // ignore per-cookie errors
            }
          });
        }
      } catch (e) {
        // ignore
      }

      try {
        if (typeof window !== 'undefined') {
          try { window.localStorage.clear(); } catch { /* ignore */ }
          try { window.sessionStorage.clear(); } catch { /* ignore */ }
        }
      } catch (e) {
        // ignore
      }

      // Give browser a short moment to clear cookies before redirect/login attempts
      await new Promise((res) => setTimeout(res, 200));
      // Redirect to login page so user lands on the auth screen
      try {
        if (typeof window !== 'undefined') {
          window.location.assign('/login');
        }
      } catch (e) {
        // ignore
      }
    } catch (error) {
      // Still logout locally even if API call fails
      dispatch(logout());

      // Clear auth data from cookies even if API call fails
      removeCookieSnapshot();
      try {
        try { setCookie('auth', '', { maxAge: 0, path: '/' }); } catch { /* ignore */ }
        try { setCookie('user', '', { maxAge: 0, path: '/' }); } catch { /* ignore */ }
        try { setCookie('role', '', { maxAge: 0, path: '/' }); } catch { /* ignore */ }
        try { setCookie('auth_pending', '', { maxAge: 0, path: '/' }); } catch { /* ignore */ }
        if (typeof window !== 'undefined') {
          try { window.localStorage.removeItem('auth_fallback'); } catch { /* ignore */ }
          try { window.localStorage.removeItem('role_fallback'); } catch { /* ignore */ }
          try { window.localStorage.removeItem('user_fallback'); } catch { /* ignore */ }
        }
      } catch (e) {
      }
      // Also attempt to wipe all cookies and storages in the error case
      try {
        if (typeof document !== 'undefined') {
          const cookies = document.cookie ? document.cookie.split(';') : [];
          cookies.forEach((c) => {
            const eqPos = c.indexOf('=');
            const name = eqPos > -1 ? c.substr(0, eqPos).trim() : c.trim();
            try {
              document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
              document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT`;
            } catch (e) { /* ignore */ }
          });
        }
      } catch (e) { /* ignore */ }
      try { if (typeof window !== 'undefined') { window.localStorage.clear(); window.sessionStorage.clear(); } } catch (e) { /* ignore */ }
      // Short wait to let browser clear cookies
      await new Promise((res) => setTimeout(res, 200));
      try {
        if (typeof window !== 'undefined') {
          window.location.assign('/login');
        }
      } catch (e) {
        // ignore redirect failures
      }
    } finally {
      dispatch(setLoading(false));
    }
  }
);