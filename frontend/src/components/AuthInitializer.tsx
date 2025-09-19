"use client";

import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter, usePathname } from 'next/navigation';
import { restoreAuthState, selectIsAuthenticated, selectCurrentUser } from '../store/slices/authSlice';
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
      if (isAuthenticated && currentUser?.role && pathname) {
        try {
          const redirectPath = shouldRedirectOnStartup(currentUser.role, pathname);
          if (redirectPath) {
            logDebug(`AuthInitializer: Redirecting ${currentUser.role} user to: ${redirectPath}`);
            await router.push(redirectPath);
          }
        } catch (error) {
          logError('AuthInitializer: Error during role-based redirection', error);
        }
      } else if (!pathname) {
        logError('AuthInitializer: Missing pathname for redirection');
      }
    };

    handleRedirection();
  }, [isAuthenticated, currentUser?.role, pathname, router]);

  return null; // This component doesn't render anything
};

export default AuthInitializer;
