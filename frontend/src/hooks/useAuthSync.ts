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
    const authData = JSON.parse(decodeURIComponent(authCookie.split('=')[1]));
    if (
      authData &&
      authData.token &&
      authData.user &&
      authData.user.id &&
      authData.user.name &&
      authData.user.role &&
      authData.isAuthenticated
    ) {
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
    return {
      isAuthenticated: cookieAuth.isAuthenticated,
      user: cookieAuth.user,
      token: cookieAuth.token,
      userRole: cookieAuth.user.role,
      userName: cookieAuth.user.name,
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
