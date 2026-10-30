'use client';

import React, { useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { getCookie, setCookie } from 'cookies-next';
import ApplicationsByTypeView from '../../components/ApplicationsByTypeView';
import { useAuth } from '@/hooks/useAuth';
import { ContentSkeleton } from '../../components/Skeleton';
import { isAdminRole } from '../../utils/roleUtils';
import { getRoleBasedRedirectPath } from '../../config/roleRedirections';

function InboxContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryType = searchParams?.get('type') || 'all';
  const shouldRefresh = searchParams?.get('refresh') === 'true';

  const { isAuthenticated, userRole, initialized } = useAuth();

  // Handle refresh parameter - only refresh once per login
  useEffect(() => {
    if (shouldRefresh) {
      const refreshed = getCookie('pageRefreshed');
      if (!refreshed) {
        const timer = setTimeout(() => {
          setCookie('pageRefreshed', 'true', { maxAge: 60 * 5 });
          window.location.reload();
        }, 1000);
        return () => clearTimeout(timer);
      }
    }
  }, [shouldRefresh]);

  // Redirect admin users to their admin dashboard, but only on a bare /inbox
  // visit (stray nav link/bookmark). An explicit ?type= means the admin
  // intentionally drilled down here (e.g. from the Analytics Dashboard
  // summary cards) and should see the filtered list, not get bounced.
  // For non-admin users on bare /inbox, normalize to /inbox?type=all.
  useEffect(() => {
    if (initialized && !searchParams?.get('type')) {
      if (isAdminRole(userRole)) {
        const redirectPath = getRoleBasedRedirectPath(userRole);
        router.push(redirectPath);
      } else {
        router.replace('/inbox?type=all');
      }
    }
  }, [initialized, userRole, router, searchParams]);

  useEffect(() => {
    if (initialized && !isAuthenticated) {
      router.push('/login');
    }
  }, [initialized, isAuthenticated, router]);

  return <ApplicationsByTypeView queryType={queryType} />;
}

// Main component with Suspense boundary
export default function InboxQueryPage() {
  return (
    <Suspense fallback={<ContentSkeleton />}>
      <InboxContent />
    </Suspense>
  );
}
