'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import LandingPage from './landing/page';
import { getRoleBasedRedirectPath } from '../config/roleRedirections';
import { PageLayoutSkeleton, ContentSkeleton } from '../components/Skeleton';

export default function Home() {
  const { isAuthenticated, isLoading, userRole, initialized } = useAuth();
  const router = useRouter();

  // Handle redirection after auth initialization on root path
  useEffect(() => {
    if (!initialized || isLoading) return;

    // If authenticated, redirect based on role (using centralized redirect rules)
    if (isAuthenticated && userRole) {
      const redirectPath = getRoleBasedRedirectPath(userRole);
      router.replace(redirectPath);
      return;
    }

    // If not authenticated, show landing page (no redirect to login)
  }, [isAuthenticated, isLoading, userRole, initialized, router]);

  // Start both Flag Loader and Skeleton Loader at the exact same time right from initial load
  if (!initialized || isLoading) {
    return (
      <PageLayoutSkeleton>
        <ContentSkeleton />
      </PageLayoutSkeleton>
    );
  }

  // Show landing page for unauthenticated users
  if (!isAuthenticated) {
    return <LandingPage />;
  }

  // This return is fallback (should not reach here due to redirect)
  return null;
}
