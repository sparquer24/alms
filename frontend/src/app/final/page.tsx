"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthSync } from '../../hooks/useAuthSync';
import { getRoleConfig } from '../../config/roles';

// Redirect final page to inbox query route with auth/permission checks
export default function FinalRedirect() {
  const router = useRouter();
  const { isAuthenticated, userRole, isLoading: authLoading } = useAuthSync();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    const roleConfig = getRoleConfig(userRole);
    if (!roleConfig || !roleConfig.permissions.includes('canViewFinalDisposal')) {
      router.push('/');
      return;
    }

  router.replace('/home?type=final');
  }, [authLoading, isAuthenticated, userRole, router]);

  return null;
}
