'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { Sidebar } from '@/components/Sidebar';
import Footer from '@/components/Footer';

import { LayoutProvider } from '@/config/layoutContext';

import { normalizeRole } from '@/utils/roleUtils';


export default function AdminLayout({ children }: { children: any }) {
  const { userRole, token, isLoading, initialized } = useAuth();
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  const effectiveRole = useMemo(() => {
    return normalizeRole(userRole);
  }, [userRole]);

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
    if (!effectiveRole) {
      router.replace('/login?error=no_role');
      return;
    }

    // SUPER_ADMIN should be redirected to superAdmin routes
    if (effectiveRole === 'SUPER_ADMIN') {
      router.replace('/superAdmin/userManagement');
      return;
    }

    // Check if user has admin access (only ADMIN role, not SUPER_ADMIN)
    if (effectiveRole !== 'ADMIN') {
      router.replace('/');
      return;
    }

    setChecked(true);
  }, [token, effectiveRole, isLoading, initialized, checked, router]);

  // Show loading while checking authentication
  if (isLoading || !checked || !initialized) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-10 w-10 border-b-2 border-[#001F54] mx-auto mb-4'></div>
          <p className='text-sm text-gray-600'>Authenticating...</p>
        </div>
      </div>
    );
  }

  // Don't render anything if user is not authenticated as admin
  if (!token || !effectiveRole || effectiveRole !== 'ADMIN') {
    return null;
  }

  return (
    <LayoutProvider>

      <div className='flex h-screen bg-gray-50 font-[family-name:var(--font-geist-sans)]'>

        <Sidebar />

        <main className='flex-1 ml-0 md:ml-66 min-w-0 overflow-auto flex flex-col'>

          <div className="flex-grow">

            {children}

          </div>

          <Footer />

        </main>

      </div>

    </LayoutProvider>
  );
}