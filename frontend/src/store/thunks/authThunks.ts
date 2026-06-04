import { createAsyncThunk } from '@reduxjs/toolkit';
import { AuthApi } from '../../config/APIClient';
import { setCredentials, setLoading, setError, logout, setInitialized } from '../slices/authSlice';
import { setCookie, getCookie, deleteCookie } from 'cookies-next';

const NUMERIC_ROLE_MAP: Record<string, string> = {
  '2': 'ZS',
  '3': 'ADMIN',
  '7': 'ZS',
  '12': 'SUPER_ADMIN',
  '14': 'ADMIN',
  '15': 'SUPER_ADMIN',
  '16': 'SUPER_ADMIN',
};

function normalizeRole(user: any): string | undefined {
  if (!user) return undefined;
  const roleObj = user?.role ?? user;
  let candidate =
    roleObj?.code ||
    roleObj?.key ||
    roleObj?.name ||
    user?.roleCode ||
    user?.role_id ||
    user?.roleId ||
    (typeof roleObj === 'string' ? roleObj : null) ||
    (Array.isArray(user?.roles) ? user.roles[0] : null);
  if (!candidate && typeof roleObj === 'object' && roleObj.id) {
    candidate = NUMERIC_ROLE_MAP[String(roleObj.id)] || String(roleObj.id);
  }
  if (candidate && /^[0-9]+$/.test(String(candidate))) {
    const mapped = NUMERIC_ROLE_MAP[String(candidate)];
    if (mapped) candidate = mapped;
  }
  return candidate ? String(candidate).trim().toUpperCase() : undefined;
}

async function persistAuthCookies(token: string, user: any) {
  const role = normalizeRole(user);
  const minimalUser = {
    id: user?.id ?? null,
    role: role ?? (typeof user?.role === 'string' ? user.role : null),
    username: user?.username ?? user?.userName ?? null,
    name: user?.name ?? null,
  };
  const cookieOptions = { maxAge: 60 * 60 * 24, path: '/' };
  try { setCookie('auth', token, cookieOptions); } catch { /* ignore */ }
  if (role) {
    try { setCookie('role', role, cookieOptions); } catch { /* ignore */ }
  }
  try {
    setCookie('user', JSON.stringify(minimalUser), cookieOptions);
  } catch {
    try {
      setCookie('user', JSON.stringify({ id: minimalUser.id, role: minimalUser.role }), cookieOptions);
    } catch { /* ignore */ }
  }
}

function clearAuthCookies() {
  const cookieOptions = { maxAge: 0, path: '/' };
  try { deleteCookie('auth', cookieOptions); } catch { /* ignore */ }
  try { deleteCookie('role', cookieOptions); } catch { /* ignore */ }
  try { deleteCookie('user', cookieOptions); } catch { /* ignore */ }
  try { deleteCookie('auth_pending', cookieOptions); } catch { /* ignore */ }
}

export const initializeAuth = createAsyncThunk(
  'auth/initialize',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      const cookieAuth = getCookie('auth');
      if (!cookieAuth) {
        dispatch(setInitialized(true));
        return rejectWithValue(null);
      }

      let token: string | null = null;
      try {
        const parsed = JSON.parse(cookieAuth as string);
        token = parsed?.token ?? parsed?.accessToken ?? null;
      } catch {
        token = typeof cookieAuth === 'string' ? cookieAuth : null;
      }

      if (!token) {
        dispatch(setInitialized(true));
        return rejectWithValue(null);
      }

      const meResponse = await AuthApi.getMe(token);

      // The backend /auth/getMe endpoint returns the user object directly
      // (e.g. { id, username, role, location, ... }), NOT wrapped in
      // { success: true, body: ... }. Handle both response formats.
      let user: any = null;
      if (meResponse) {
        // Format 1: Wrapped { success: true, body: { ... } } or { data: { ... } }
        if (meResponse.success && (meResponse.body || (meResponse as any).data)) {
          user = meResponse.body ?? (meResponse as any).data ?? meResponse;
        // Format 2: Direct user object from backend (no `success` wrapper)
        } else if ((meResponse as any).id || (meResponse as any).username) {
          user = meResponse;
        }
      }

      if (user) {
        const role = normalizeRole(user);

        if (!role) {
          dispatch(setInitialized(true));
          return rejectWithValue(null);
        }

        const normalizedUser = { ...user, role: String(role).toUpperCase() };
        dispatch(setCredentials({ user: normalizedUser, token }));

        try {
          if (!getCookie('role')) {
            setCookie('role', String(role), { maxAge: 60 * 60 * 24, path: '/' });
          }
          if (!getCookie('user')) {
            setCookie('user', JSON.stringify({
              id: user?.id ?? null,
              role: String(role).toUpperCase(),
              username: user?.username ?? user?.userName ?? null,
              name: user?.name ?? null,
            }), { maxAge: 60 * 60 * 24, path: '/' });
          }
        } catch { /* ignore */ }

        dispatch(setInitialized(true));
        return { user: normalizedUser, token };
      }

      // getMe returned an unrecognized response — the token may have been
      // rejected by the server. Clear the stale cookie so there's no
      // inconsistency between Redux state and cookie-based auth readers.
      try {
        deleteCookie('auth', { path: '/' });
      } catch { /* best-effort */ }
      dispatch(setInitialized(true));
      return rejectWithValue(null);
    } catch {
      // Transient network or server error. Don't call logout() which would
      // clear cookies and force re-login. Instead, mark initialized and let
      // the page guard handle the unauthenticated state gracefully.
      dispatch(setInitialized(true));
      return rejectWithValue(null);
    }
  }
);

export const login = createAsyncThunk(
  'auth/login',
  async ({ username, password }: { username: string; password: string }, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setLoading(true));
      dispatch(setError(''));

      const response = await AuthApi.login({ username, password });

      let token: string;
      let user: any = null;

      if (response.success && (response as any).token) {
        token = (response as any).token;
        user = (response as any).user;
      } else if (response.body && response.body.token) {
        token = response.body.token;
        user = response.body.user;
      } else {
        const errorMessage = (response as any)?.message || (response as any)?.error || 'Login failed';
        dispatch(setError(errorMessage));
        dispatch(setLoading(false));
        return rejectWithValue(errorMessage);
      }

      // Persist cookies BEFORE calling getMe so that any API calls or
      // page navigation triggered afterward can rely on cookie-based auth.
      // Use a minimal user object since we don't have the full profile yet.
      try {
        await persistAuthCookies(token, user || { role: (response as any)?.user?.role });
      } catch { /* best-effort cookie writes */ }

      const meResponse = await AuthApi.getMe(token);

      // Handle the same dual response format as initializeAuth:
      // 1. Wrapped { success: true, body: { ... } }
      // 2. Direct user object { id, username, role, ... }
      if (meResponse) {
        if (meResponse.success && (meResponse.body || (meResponse as any).data)) {
          user = meResponse.body ?? (meResponse as any).data ?? meResponse;
        } else if ((meResponse as any).id || (meResponse as any).username) {
          user = meResponse;
        }
      }

      // Fallback to JWT token payload decoding if getMe didn't return a user
      if (!user) {
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
            availableActions: [],
          };
        } catch {
          dispatch(setError('Invalid token received from server'));
          dispatch(setLoading(false));
          return rejectWithValue('Invalid token received from server');
        }
      }

      const role = normalizeRole(user);
      if (!role) {
        dispatch(setError('No role assigned to your account.'));
        dispatch(setLoading(false));
        return rejectWithValue('No role assigned to your account.');
      }

      const normalizedUser = { ...user, role: String(role).toUpperCase() };
      dispatch(setCredentials({ user: normalizedUser, token }));

      // Refresh cookies with full user data now that we have the complete profile
      try {
        await persistAuthCookies(token, normalizedUser);
      } catch { /* best-effort cookie writes */ }

      dispatch(setLoading(false));
      return { user: normalizedUser, token };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      dispatch(setError(errorMessage));
      dispatch(setLoading(false));
      return rejectWithValue(errorMessage);
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { dispatch }) => {
    try {
      dispatch(setLoading(true));
      try {
        await AuthApi.logout();
      } catch { /* best-effort */ }

      clearAuthCookies();
      dispatch(logout());

      if (typeof window !== 'undefined') {
        window.location.assign('/login');
      }
    } catch {
      dispatch(logout());
      clearAuthCookies();
      if (typeof window !== 'undefined') {
        window.location.assign('/login');
      }
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
      const authCookie = getCookie('auth');
      let token: string | null = null;
      if (authCookie) {
        try {
          const parsed = JSON.parse(authCookie as string);
          token = parsed?.token ?? parsed?.accessToken ?? null;
        } catch {
          token = typeof authCookie === 'string' ? authCookie : null;
        }
      }
      if (!token) throw new Error('No authentication token found');

      const response = await AuthApi.getCurrentUser(token);
      if (response.success && response.body) {
        return { user: response.body, token };
      }
      throw new Error(response.message || 'Failed to get current user');
    } catch (err) {
      dispatch(setError(err instanceof Error ? err.message : 'Failed to get current user'));
      throw err;
    } finally {
      dispatch(setLoading(false));
    }
  }
);
