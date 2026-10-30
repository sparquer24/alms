"use client";

import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter, usePathname } from 'next/navigation';
import type { AppDispatch } from '../store/store';
import { selectIsAuthenticated, selectCurrentUser, selectAuthLoading, selectAuthInitialized } from '../store/slices/authSlice';
import { initializeAuth } from '../store/thunks/authThunks';
import { shouldRedirectOnStartup } from '../config/roleRedirections';
import { normalizeRole } from '../utils/roleUtils';

export const AuthInitializer = () => {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const pathname = usePathname();

  const isAuthenticated = useSelector(selectIsAuthenticated);
  const currentUser = useSelector(selectCurrentUser);
  const isLoading = useSelector(selectAuthLoading);
  const initialized = useSelector(selectAuthInitialized);

  // Initialize auth only if it hasn't been initialized yet.
  // Guarding on `initialized` prevents a redundant network call (and the
  // associated loading skeleton) on every client-side navigation after the
  // first page load.
  useEffect(() => {
    if (!initialized) {
      dispatch(initializeAuth());
    }
    // `dispatch` is stable; `initialized` is the only reactive dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialized]);

  // Handle redirection after initialization for page refresh scenarios
  useEffect(() => {
    // Only act after initialization and when on root path
    if (!initialized) return;
    if (isLoading) return;
    if (!isAuthenticated || !currentUser) return;
    if (!pathname) return;

    // Normalize the role from the current user
    const normalizedRole = normalizeRole(currentUser?.role);


    // Skip redirection on the root path '/' - layouts handle their own redirects
    // This prevents double-redirects with the login page
    if (pathname === '/') {
      const redirectPath = shouldRedirectOnStartup(normalizedRole, pathname);

      if (redirectPath) {
        router.replace(redirectPath);
      }
    }
  }, [initialized, isLoading, isAuthenticated, currentUser, pathname, router]);

  return null;
};

export default AuthInitializer;
