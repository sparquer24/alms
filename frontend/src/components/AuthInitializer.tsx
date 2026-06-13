"use client";

import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter, usePathname } from 'next/navigation';
import type { AppDispatch } from '../store/store';
import { selectIsAuthenticated, selectCurrentUser, selectAuthLoading, selectAuthInitialized } from '../store/slices/authSlice';
import { initializeAuth } from '../store/thunks/authThunks';
import { shouldRedirectOnStartup } from '../config/roleRedirections';
import { getCookie } from 'cookies-next';

export const AuthInitializer = () => {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const pathname = usePathname();

  const isAuthenticated = useSelector(selectIsAuthenticated);
  const currentUser = useSelector(selectCurrentUser);
  const isLoading = useSelector(selectAuthLoading);
  const initialized = useSelector(selectAuthInitialized);

  // Initialize auth once on mount
  useEffect(() => {
    dispatch(initializeAuth());
  }, [dispatch]);

  // Handle redirection after initialization
  useEffect(() => {
    if (!initialized) return;

    const handleRedirection = async () => {
      // Only proceed if we have a current user (authenticated)
      if (!isAuthenticated || !currentUser) {
        // User is not authenticated - don't call logout, just let them stay unauthenticated
        // They will be redirected to /login by route guards if needed
        return;
      }

      const roleFromState = currentUser?.role;
      const roleFromCookie = getCookie('role') as string | undefined;
      const effectiveRole = roleFromState || (roleFromCookie ? String(roleFromCookie).toUpperCase() : undefined);

      if (!effectiveRole) return;

      const redirectPath = shouldRedirectOnStartup(effectiveRole, pathname ?? undefined);
      if (redirectPath) {
        await router.replace(redirectPath);
      }
    };

    handleRedirection();
  }, [initialized, pathname, router, isAuthenticated, currentUser]);

  return null;
};

export default AuthInitializer;
