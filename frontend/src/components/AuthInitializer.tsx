"use client";

import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch } from '../store/store';
import { useRouter, usePathname } from 'next/navigation';
import { selectIsAuthenticated, selectCurrentUser } from '../store/slices/authSlice';
import { initializeAuth } from '../store/thunks/authThunks';
import { getCookie } from 'cookies-next';
import { shouldRedirectOnStartup } from '../config/roleRedirections';
import { logError, logDebug } from '@/utils/loggingUtils';

/**
 * Component to initialize auth state on app startup
 * This should be rendered once at the root level
 */
export const AuthInitializer = () => {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const pathname = usePathname();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const currentUser = useSelector(selectCurrentUser);

  // Defensive init: some third-party bundles or browser extensions
  // (e.g. a floating sidebar script) may read a localStorage key like
  // "floatingSidebar" and call Object.keys on it. If that key is missing
  // or contains "null", Object.keys will throw. Ensure a safe default.
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const key = 'floatingSidebar';
        const raw = localStorage.getItem(key);
        if (raw === null || raw === 'null') {
          localStorage.setItem(key, JSON.stringify({}));
          // keep quiet in normal runs; debug available via existing logger
          // logDebug(`AuthInitializer: initialized ${key} to {}`);
        }
      }
    } catch (err) {
      // Non-fatal: if localStorage is disabled or access throws, continue.
      // use existing logging util if available
      // eslint-disable-next-line no-console
      console.debug('AuthInitializer: safe storage init failed', err);
    }
  }, []);

  useEffect(() => {
    // Initialize auth state on startup: validate token via API and persist canonical user.
    try {
      // initializeAuth performs getMe, writes cookies if needed, and may redirect.
      void dispatch(initializeAuth());
    } catch (error) {
      logError('AuthInitializer: Failed to initialize auth state', error);
    }
  }, [dispatch]);

  useEffect(() => {
    // Handle role-based redirection after auth state is restored
    // Only run on initial mount and pathname changes, not on every auth state change
    const handleRedirection = async () => {
      try {
        if (!pathname) {
          logError('AuthInitializer: Missing pathname for redirection');
          return;
        }

        // Don't redirect if we're not authenticated yet
        if (!isAuthenticated) {
          return;
        }

        // Prefer role from Redux-hydrated user, fallback to role cookie
        const roleFromState = currentUser?.role;
        const roleFromCookie = getCookie('role') as string | undefined;
        const effectiveRole = roleFromState || (roleFromCookie ? String(roleFromCookie).toUpperCase() : undefined);

        logDebug(`AuthInitializer: isAuthenticated=${isAuthenticated} roleFromState=${roleFromState} roleFromCookie=${roleFromCookie} pathname=${pathname}`);

        if (effectiveRole) {
          const redirectPath = shouldRedirectOnStartup(effectiveRole, pathname);
          if (redirectPath) {
            logDebug(`AuthInitializer: Redirecting ${effectiveRole} user to: ${redirectPath}`);
            await router.push(redirectPath);
          } else {
            logDebug(`AuthInitializer: No redirect needed for ${effectiveRole} at ${pathname}`);
          }
        }
      } catch (error) {
        logError('AuthInitializer: Error during role-based redirection', error);
      }
    };

    handleRedirection();
  }, [pathname, router]);

  return null; // This component doesn't render anything
}

// Named export to avoid SSR issues with default export
export default AuthInitializer;
