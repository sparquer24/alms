import { useEffect, useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectIsAuthenticated, selectCurrentUser, selectAuthToken, restoreAuthState, setCredentials } from '../store/slices/authSlice';
import { AuthApi } from '../config/APIClient';

function getAuthFromCookie() {
  if (typeof document === 'undefined') return null;
  const authCookie = document.cookie
    .split('; ')
    .find(row => row.startsWith('auth='));
  if (!authCookie) return null;
  try {
    const raw = decodeURIComponent(authCookie.split('=')[1]);
    let authData: any = null;

    try {
      // First try to parse as JSON
      authData = JSON.parse(raw);
    } catch (e) {
      // If parsing fails, check if it's a JWT token
      if (raw.startsWith('eyJhbGciOi')) {
        // It's a JWT token, create minimal auth data
        authData = { token: raw, isAuthenticated: true };
      } else {
        // Not JSON or JWT — treat as token-only
        authData = { token: raw, isAuthenticated: true };
      }
    }

    // Accept partial auth cookie (token + user info) and mark as valid if token exists
    if (authData && authData.token) {
      // If user object exists, prefer returning it
      return authData;
    }
  } catch (e) {
    // ignore
  }
  return null;
}

// Safely extract role from a JWT token payload (if present)
function extractRoleFromJwt(token?: string | null): string | undefined {
  if (!token) return undefined;
  try {
    const parts = token.split('.');
    if (parts.length < 2) return undefined;
    // atob can throw if not valid base64
    const json = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
    const payload = JSON.parse(json);
    const candidate =
      payload.role ||
      payload.userRole ||
      payload.roleCode ||
      payload.role_code ||
      payload.roleId ||
      payload.role_id ||
      (Array.isArray(payload.roles) ? payload.roles[0] : undefined) ||
      payload.user?.role?.code ||
      payload.user?.role ||
      payload.user?.roleCode;
    if (candidate && typeof candidate === 'string') return candidate.toUpperCase();
  } catch {
    // ignore decoding issues silently
  }
  return undefined;
}

/**
 * Hook to get the unified auth state from Redux
 * This should be used instead of the Context auth in components
 */
export const useAuthSync = () => {
  const dispatch = useDispatch();
  const reduxIsAuthenticated = useSelector(selectIsAuthenticated);
  const reduxUser = useSelector(selectCurrentUser);
  const reduxToken = useSelector(selectAuthToken);
  const [isInitialized, setIsInitialized] = useState(false);
  const [cookieAuth, setCookieAuth] = useState<any>(null);
  const [isFetchingUser, setIsFetchingUser] = useState(false);
  const fetchAttemptedRef = useRef(false);
  const [hydrationAttempts, setHydrationAttempts] = useState(0);
  const [userHydrationFailed, setUserHydrationFailed] = useState(false);
  const cachedRoleRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    const auth = getAuthFromCookie();
    if (auth) {
      setCookieAuth(auth);
      setIsInitialized(true);
    } else if (!reduxIsAuthenticated && !reduxUser && !isInitialized) {
      dispatch(restoreAuthState());
      setIsInitialized(true);
    } else if (!isInitialized) {
      setIsInitialized(true);
    }
  }, [dispatch, reduxIsAuthenticated, reduxUser, isInitialized]);

  // When we have a token-only cookie (no user object), attempt to resolve user/role
  useEffect(() => {
    const tryFetchUser = async () => {
      if (!cookieAuth || !cookieAuth.token) return;
      // If we already have a user or are mid-fetch, skip
      if (cookieAuth.user || isFetchingUser || fetchAttemptedRef.current) return;
      setIsFetchingUser(true);
      fetchAttemptedRef.current = true;
      setHydrationAttempts(a => a + 1);
      try {
        // Always try to fetch full user if we only have token
        const me: any = await AuthApi.getMe(cookieAuth.token);
        // Broad response pattern support
        let user: any = null;
        if (me) {
          user = me.body || me.data || me.user || me.payload || me.result || null;
          // Some APIs wrap data differently
          if (user && user.user) user = user.user; // unwrap nested user
        }
        // If still not found but response itself looks like a user (has role-like field)
        if (!user && me && (me.role || me.roleCode || me.role_id || me.roleId)) {
          user = me;
        }
        // If user has a nested role object with code, flatten it
        if (user && typeof user.role === 'object' && user.role?.code) {
          user = { ...user, role: user.role.code };
        }
        if (user) {
          dispatch(setCredentials({ user, token: cookieAuth.token }));
          setCookieAuth((prev: any) => ({ ...(prev || {}), user }));
          setUserHydrationFailed(false);
        } else {
          // Try to salvage role from JWT and create minimal user
            const decodedRole = extractRoleFromJwt(cookieAuth.token);
            if (decodedRole) {
              const minimalUser = { id: 'jwt-user', role: decodedRole, name: 'Admin', permissions: [], availableActions: [] };
              dispatch(setCredentials({ user: minimalUser as any, token: cookieAuth.token }));
              setCookieAuth((prev: any) => ({ ...(prev || {}), user: minimalUser }));
              setUserHydrationFailed(false);
            } else {
              setUserHydrationFailed(true);
            }
        }
      } catch (e) {
        // On failure, still attempt JWT role decode
        const decodedRole = extractRoleFromJwt(cookieAuth.token);
        if (decodedRole) {
          const minimalUser = { id: 'jwt-user', role: decodedRole, name: 'Admin', permissions: [], availableActions: [] };
          dispatch(setCredentials({ user: minimalUser as any, token: cookieAuth.token }));
          setCookieAuth((prev: any) => ({ ...(prev || {}), user: minimalUser }));
          setUserHydrationFailed(false);
        } else {
          setUserHydrationFailed(true);
        }
      } finally {
        setIsFetchingUser(false);
      }
    };
    tryFetchUser();
  }, [cookieAuth, isFetchingUser, dispatch]);

  if (cookieAuth) {
    const c = cookieAuth as any;
    const normalizedRole = (c.user?.role && typeof c.user.role === 'string')
      ? c.user.role.toUpperCase()
      : extractRoleFromJwt(c.token);
    if (normalizedRole && !cachedRoleRef.current) cachedRoleRef.current = normalizedRole;
    return {
      isAuthenticated: c.isAuthenticated,
      user: c.user,
      token: c.token,
      userRole: cachedRoleRef.current || normalizedRole,
      userName: c.user?.name,
      isLoading: isFetchingUser, // remain loading while we try to fetch user details
      isFetchingUser,
      hydrationAttempts,
      userHydrationFailed,
    };
  }

  return {
    isAuthenticated: reduxIsAuthenticated,
    user: reduxUser,
    token: reduxToken,
    userRole: (() => {
      const computed = (reduxUser?.role ? reduxUser.role.toUpperCase() : extractRoleFromJwt(reduxToken || undefined));
      if (computed && !cachedRoleRef.current) cachedRoleRef.current = computed;
      return cachedRoleRef.current || computed;
    })(),
    userName: reduxUser?.name,
    isLoading: !isInitialized || isFetchingUser,
    isFetchingUser,
    hydrationAttempts,
    userHydrationFailed,
  };
};
