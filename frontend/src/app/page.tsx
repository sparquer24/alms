'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import LandingPage from './landing/page';

export default function Home() {
  const { isAuthenticated, isLoading, userRole, initialized } = useAuth();
  const router = useRouter();

  // Handle redirection after auth initialization on root path
  useEffect(() => {
    if (!initialized || isLoading) return;

    // If authenticated, redirect based on role
    if (isAuthenticated && userRole) {
      const redirectMap: Record<string, string> = {
        ADMIN: '/dashboard',
        SUPER_ADMIN: '/dashboard',
        ARMS_SUPDT: '/inbox',
        SHO: '/inbox',
        ZS: '/inbox',
        DCP: '/inbox',
        ACP: '/inbox',
        CP: '/inbox',
        JTCP: '/inbox',
        ADO: '/inbox',
        CADO: '/inbox',
        AS: '/inbox',
        ARMS_SEAT: '/inbox',
        ACO: '/inbox',
        APPLICANT: '/inbox?type=all',
      };

      const redirectPath = redirectMap[userRole] || '/inbox';
      router.replace(redirectPath);
      return;
    }

    // If not authenticated, show landing page (no redirect to login)
  }, [isAuthenticated, isLoading, userRole, initialized, router]);

  // Show loading screen while checking authentication
  if (!initialized || isLoading) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4'></div>
          <p className='text-gray-600'>Loading...</p>
        </div>
      </div>
    );
  }

  // Show landing page for unauthenticated users
  if (!isAuthenticated) {
    return <LandingPage />;
  }

  // This return is fallback (should not reach here due to redirect)
  return null;
}
