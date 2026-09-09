'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { Sidebar } from '../../components/Sidebar';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { InboxProvider } from '../../context/InboxContext';
import InboxBootloaderClient from '../../components/InboxBootloaderClient';
import { useAuth } from '../../hooks/useAuth';


// Layout component that renders Sidebar and Header once for all /inbox routes
export default function InboxLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, initialized } = useAuth();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    // Wait for auth initialization
    if (!initialized || isLoading) return;
    if (checked) return;

    // Check authentication
    if (!isAuthenticated) {
      window.location.href = '/login';
      return;
    }

    // If authenticated, we're good
    setChecked(true);
  }, [isAuthenticated, isLoading, initialized, checked]);

  // Show loading while checking auth
  if (!initialized || isLoading || !checked) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-10 w-10 border-b-2 border-[#001F54] mx-auto mb-4'></div>
          <p className='text-sm text-gray-600'>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <InboxProvider>
      <div className='flex h-screen bg-[#F4F6F9] font-sans antialiased overflow-hidden selection:bg-[#0F2D52] selection:text-white'>
        <Suspense fallback={null}>
          <InboxBootloaderClient />
        </Suspense>
        <Suspense fallback={null}>
          <Sidebar onTableReload={undefined} />
        </Suspense>

        <Header />

        <main className='flex-1 ml-0 md:ml-66 min-w-0 overflow-auto flex flex-col pt-[64px] md:pt-[78px]'>
          <div className='flex-grow flex flex-col min-h-0'>
            {children}
          </div>
          <Footer />
        </main>
      </div>
    </InboxProvider>
  );
}

// Mark display name for debugging
InboxLayout.displayName = 'InboxLayout';