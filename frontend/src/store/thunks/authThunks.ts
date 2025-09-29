import { createAsyncThunk } from '@reduxjs/toolkit';
import { AuthApi } from '../../config/APIClient';
import { setCredentials, setLoading, setError, logout } from '../slices/authSlice';
import { setCookie, getCookie } from 'cookies-next';

// Single-flight guard to dedupe concurrent /auth/me requests
let ongoingFetchCurrentUser: Promise<any> | null = null;
async function fetchCurrentUser(token: string) {
  if (!token) return null;
  if (ongoingFetchCurrentUser) return ongoingFetchCurrentUser;
  // Use getMe to retrieve the canonical user payload
  ongoingFetchCurrentUser = AuthApi.getMe(token).finally(() => {
    ongoingFetchCurrentUser = null;
  });
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
    console.warn('Failed to read cookie snapshot', e);
    return null;
  }
}

function saveCookieSnapshot(snapshot: Record<string, any>) {
  try {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(COOKIE_SNAPSHOT_KEY, JSON.stringify(snapshot));
  } catch (e) {
    console.warn('Failed to save cookie snapshot', e);
  }
}

function removeCookieSnapshot() {
  try {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(COOKIE_SNAPSHOT_KEY);
  } catch (e) {
    console.warn('Failed to remove cookie snapshot', e);
  }
}

function clearAllAuthCookies() {
  try {
    // cookies-next delete helpers aren't used here to avoid SSR issues
    setCookie('auth', '', { maxAge: 0, path: '/' });
    setCookie('user', '', { maxAge: 0, path: '/' });
    setCookie('role', '', { maxAge: 0, path: '/' });
  } catch (e) {
    console.warn('Failed to clear auth cookies', e);
  }
}

export const initializeAuth = createAsyncThunk(
  'auth/initialize',
  async (_, { dispatch }) => {
    try {
      // Check cookies for auth data (be defensive about parsing)
      const cookieAuth = getCookie('auth');
      const cookieUser = getCookie('user');
      const cookieRole = getCookie('role');
      // Detect cookie changes across refreshes: compare with saved snapshot
      const savedSnapshot = readCookieSnapshot();
      const currentSnapshot = {
        auth: cookieAuth ?? null,
        user: cookieUser ?? null,
        role: cookieRole ?? null,
      };
      // If any cookie is missing, clear all and logout
      if (!cookieAuth || !cookieUser || !cookieRole) {
        console.warn('One or more auth cookies missing; clearing and logging out');
        clearAllAuthCookies();
        removeCookieSnapshot();
        dispatch(logout());
        return;
      }
      if (savedSnapshot && JSON.stringify(savedSnapshot) !== JSON.stringify(currentSnapshot)) {
        // Cookies changed externally — clear stale auth state and cookies
        console.warn('Auth cookies changed since last snapshot; clearing local auth state');
        clearAllAuthCookies();
        removeCookieSnapshot();
        dispatch(logout());
        return;
      }
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
          // Persist only the token in the cookie (token-only semantics)
          setCookie('auth', token, {
            maxAge: 60 * 60 * 24, // 1 day
            path: '/',
          });
          // Save snapshot for future refresh checks
          saveCookieSnapshot({ auth: token, user: getCookie('user') ?? null, role: getCookie('role') ?? null });
          return { user, token };
        } else {
          dispatch(logout());
        }
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
      dispatch(logout());
    }
  }
);

export const login = createAsyncThunk(
  'auth/login',
  async ({ username, password }: { username: string; password: string }, { dispatch }) => {
    try {
      console.log('🔐 Auth thunk - login started');
      console.log('📝 Login credentials:', { username, passwordLength: password.length });

      dispatch(setLoading(true));

      console.log('📡 Making API call to AuthApi.login...');
      const response = await AuthApi.login({ username, password });
      console.log('📡 Login API response received:', response);

      // Handle different response structures
      let token: string;
      let user: any = null;

      console.log('🔍 Checking response structure:', {
        hasBody: !!response.body,
        hasSuccess: !!response.success,
        hasStatusCode: response.statusCode,
        response: response
      });

      // Backend returns { success: true, token: "...", user: {...} } directly (not wrapped in body)
      if (response.success && (response as any).token) {
        // Direct response from backend
        token = (response as any).token;
        user = (response as any).user;
        console.log('✅ Token found in direct response');
      } else if (response.body && response.body.token) {
        // Standard wrapped response structure
        token = response.body.token;
        user = response.body.user;
        console.log('✅ Token found in response.body');
      } else {
        console.error('❌ Login response missing token:', response);
        if (response.statusCode === 401) {
          throw new Error(response.message || 'Invalid username or password');
        }
        throw new Error('Login succeeded but no token was returned.');
      }

      console.log('🔍 Token received (first 20 chars):', token.substring(0, 20) + '...');

      // After obtaining the token, always call /auth/getMe to fetch canonical user info
      let userPayload = null;
      try {
        const meResponse = await AuthApi.getMe(token);
        if (meResponse && meResponse.success && (meResponse.body || (meResponse as any).data)) {
          userPayload = meResponse.body ?? (meResponse as any).data ?? meResponse;
        }
      } catch (meErr) {
        userPayload = null;
      }
      // Fallback: decode token if getMe fails
      if (!userPayload) {
        try {
          const tokenPayload = JSON.parse(atob(token.split('.')[1]));
          userPayload = {
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
      // Defensive cookie writing
      setCookie('auth', token, { maxAge: 60 * 60 * 24, path: '/' });
      try {
        setCookie('user', JSON.stringify(userPayload), { maxAge: 60 * 60 * 24, path: '/' });
      } catch (e) { }
      // Always set role cookie using role.code from getMe response
      let roleCode = '';
      if (userPayload?.role) {
        if (typeof userPayload.role === 'object' && userPayload.role.code) {
          roleCode = userPayload.role.code;
        } else if (typeof userPayload.role === 'string') {
          roleCode = userPayload.role;
        }
      }
      setCookie('role', roleCode, { maxAge: 60 * 60 * 24, path: '/' });
      saveCookieSnapshot({ auth: token, user: JSON.stringify(userPayload), role: roleCode });
      return { token, user: userPayload };
    } catch (error) {
      console.error('❌ Login thunk error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      console.error('❌ Error message:', errorMessage);

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
        // Do not store in Redux, just return
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
      await AuthApi.logout();
      dispatch(logout());

      // Clear auth data from cookies
      removeCookieSnapshot();
      clearAllAuthCookies();
    } catch (error) {
      console.error('Logout error:', error);
      // Still logout locally even if API call fails
      dispatch(logout());

      // Clear auth data from cookies even if API call fails
      removeCookieSnapshot();
      clearAllAuthCookies();
    } finally {
      dispatch(setLoading(false));
    }
  }
);