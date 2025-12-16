'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthSync } from '@/hooks/useAuthSync';
import { isAdminRole } from '@/utils/roleUtils';

// Redirect /analytics to the appropriate analytics page based on user role
export default function AnalyticsRedirect() {
  const router = useRouter();
  const { userRole, token } = useAuthSync();

  useEffect(() => {
    // If not logged in, redirect to login
    if (!token) {
      router.push('/login');
      return;
    }

    // Admin users go to admin analytics
    if (isAdminRole(userRole)) {
      router.push('/admin/analytics');
    } else {
      // Non-admin users (JTCP, CP, ZS, etc.) go to inbox analytics
      router.push('/inbox/analytics');
    }
  }, [router, token, userRole]);

  return (
    <div className='flex items-center justify-center min-h-screen'>
      <div className='text-center'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4'></div>
        <p className='text-gray-600'>Redirecting to analytics...</p>
      </div>
    </div>
  );
}
