"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthSync } from '../../hooks/useAuthSync';
import { getRoleConfig } from '../../config/roles';

// Redirect /sent to the inbox query-based route with auth/permission checks
export default function SentRedirect() {
  const router = useRouter();
  const { isAuthenticated, userRole, isLoading: authLoading } = useAuthSync();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    // Check permission
    const roleConfig = getRoleConfig(userRole);
    if (!roleConfig || !roleConfig.permissions.includes('canViewSent')) {
      router.push('/');
      return;
    }

  router.replace('/home?type=sent');
  }, [authLoading, isAuthenticated, userRole, router]);

  return null;
}
