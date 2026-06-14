'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { LayoutProvider } from '@/config/layoutContext';
import { normalizeRole } from '@/utils/roleUtils';
import Footer from '@/components/Footer';

export default function SuperAdminLayout({ children }: { children: any }) {
  const { userRole, token, isLoading, initialized } = useAuth();
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    // Wait until auth is initialized and we have the necessary values
    if (!initialized || isLoading) return;
    if (checked) return;

    // Check token
    if (!token) {
      router.replace('/login');
      return;
    }

    // Check role exists
    const effectiveRole = normalizeRole(userRole);
    if (!effectiveRole) {
      router.replace('/login?error=no_role');
      return;
    }

    // Check if user is SUPER_ADMIN
    if (effectiveRole !== 'SUPER_ADMIN') {
      // Not a super admin, redirect to appropriate page
      if (effectiveRole === 'ADMIN') {
        router.replace('/admin/userManagement');
      } else {
        router.replace('/');
      }
      return;
    }

    setChecked(true);
  }, [token, userRole, isLoading, initialized, checked, router]);

  // Show loading while checking authentication
  if (isLoading || !checked || !initialized) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4'></div>
          <p className='text-gray-600'>Authenticating...</p>
        </div>
      </div>
    );
  }

  // Don't render anything if user is not authenticated as super admin
  const effectiveRole = normalizeRole(userRole);
  if (!token || !effectiveRole || effectiveRole !== 'SUPER_ADMIN') {
    return null; // Don't render anything while redirecting
  }

  return (
    <LayoutProvider>
      <div className='flex h-screen bg-gray-50'>
        <Sidebar />
        <main className='flex-1 ml-[80px] md:ml-[18%] min-w-0 overflow-auto flex flex-col'>
          <div className="flex-grow">
            {children}
          </div>
          <Footer />
        </main>
      </div>
    </LayoutProvider>
  );
}
