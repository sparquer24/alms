import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectIsAuthenticated, selectCurrentUser, selectAuthToken, restoreAuthState } from '../store/slices/authSlice';

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
      authData = JSON.parse(raw);
    } catch (e) {
      // Not JSON — treat as token-only
      authData = { token: raw, isAuthenticated: true };
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
  const [cookieAuth, setCookieAuth] = useState(null);

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

  if (cookieAuth) {
    const c = cookieAuth as any;
    return {
      isAuthenticated: c.isAuthenticated,
      user: c.user,
      token: c.token,
      userRole: c.user?.role,
      userName: c.user?.name,
      isLoading: false,
    };
  }

  return {
    isAuthenticated: reduxIsAuthenticated,
    user: reduxUser,
    token: reduxToken,
    userRole: reduxUser?.role,
    userName: reduxUser?.name,
    isLoading: !isInitialized,
  };
};
