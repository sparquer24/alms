"use client";

import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter, usePathname } from 'next/navigation';
import { restoreAuthState, selectIsAuthenticated, selectCurrentUser } from '../store/slices/authSlice';
import { getCookie } from 'cookies-next';
import { shouldRedirectOnStartup } from '../config/roleRedirections';
import { logError, logDebug } from '@/utils/loggingUtils';

/**
 * Component to initialize auth state on app startup
 * This should be rendered once at the root level
 */
export const AuthInitializer: React.FC = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const currentUser = useSelector(selectCurrentUser);

  useEffect(() => {
    // Restore auth state from cookies/localStorage on app startup
    try {
      dispatch(restoreAuthState());
    } catch (error) {
      logError('AuthInitializer: Failed to restore auth state', error);
    }
  }, [dispatch]);

  useEffect(() => {
    // Handle role-based redirection after auth state is restored
    const handleRedirection = async () => {
      try {
        if (!pathname) {
          logError('AuthInitializer: Missing pathname for redirection');
          return;
        }

        // Prefer role from Redux-hydrated user, fallback to role cookie
        const roleFromState = currentUser?.role;
        const roleFromCookie = getCookie('role') as string | undefined;
        const effectiveRole = roleFromState || (roleFromCookie ? String(roleFromCookie).toUpperCase() : undefined);

  logDebug(`AuthInitializer: isAuthenticated=${isAuthenticated} roleFromState=${roleFromState} roleFromCookie=${roleFromCookie} pathname=${pathname}`);

        if (isAuthenticated && effectiveRole) {
          const redirectPath = shouldRedirectOnStartup(effectiveRole, pathname);
          if (redirectPath) {
            logDebug(`AuthInitializer: Redirecting ${effectiveRole} user to: ${redirectPath}`);
            await router.push(redirectPath);
          }
        }
      } catch (error) {
        logError('AuthInitializer: Error during role-based redirection', error);
      }
    };

    handleRedirection();
  }, [isAuthenticated, currentUser?.role, pathname, router]);

  return null; // This component doesn't render anything
};

export default AuthInitializer;
