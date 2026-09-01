'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import Header from '@/components/Header';
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
          <div className='animate-spin rounded-full h-10 w-10 border-b-2 border-[#001F54] mx-auto mb-4'></div>
          <p className='text-sm text-gray-600'>Authenticating...</p>
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
      <div className='flex h-screen bg-[#F4F6F9] font-sans antialiased overflow-hidden selection:bg-[#0F2D52] selection:text-white'>
        <Sidebar />
        <Header />
        <main className='flex-1 ml-0 md:ml-66 min-w-0 overflow-auto flex flex-col pt-[64px] md:pt-[86px]'>
          <div className="flex-grow">
            {children}
          </div>
          <Footer />
        </main>
      </div>
    </LayoutProvider>
  );
}
