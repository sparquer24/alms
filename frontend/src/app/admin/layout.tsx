'use client';

import { useAuthSync } from '../../hooks/useAuthSync';
import { PageLayoutSkeleton } from '../../components/Skeleton';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { LayoutProvider } from '@/config/layoutContext';
import { canAccessAdmin } from '@/utils/roleUtils';

export default function AdminLayout({ children }: { children: any }) {
  const { userRole, token, isLoading } = useAuthSync();
  const router = useRouter();
  const pathname = usePathname();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
      console.log(
        '[AdminLayout] - userRole:',
        userRole,
        'token exists:',
        !!token,
        'isLoading:',
        isLoading,
        'checked:',
        checked
      );
    }

    // Only check auth once and don't redirect immediately
    if (checked || isLoading) return;

    // Check token
    if (!token) {
      console.warn('[AdminLayout] No token found, redirecting to /login');
      router.replace('/login');
      return;
    }

    // Check role exists
    if (!userRole) {
      console.warn('[AdminLayout] No userRole found, redirecting to /login');
      router.replace('/login?error=no_role');
      return;
    }

    // Check if user has admin access
    if (!canAccessAdmin(userRole)) {
      console.warn('[AdminLayout] User is not ADMIN, redirecting to /');
      router.replace('/');
      return;
    }

    if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
      console.log('[AdminLayout] Auth checks passed, allowing access');
    }

    setChecked(true);
  }, [token, userRole, isLoading, checked, router]);

  // Show loading while checking authentication
  if (isLoading || !checked) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4'></div>
          <p className='text-gray-600'>Authenticating...</p>
        </div>
      </div>
    );
  }

  // Don't render anything if user is not authenticated as admin
  if (!token || !userRole || !canAccessAdmin(userRole)) {
    return null; // Don't render anything while redirecting
  }

  return (
    <LayoutProvider>
      <div className='flex h-screen bg-gray-50'>
        <Sidebar />
        <main className='flex-1 ml-[80px] md:ml-[18%] min-w-0 overflow-auto'>{children}</main>
      </div>
    </LayoutProvider>
  );
}
