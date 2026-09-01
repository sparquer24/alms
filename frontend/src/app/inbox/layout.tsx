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
      <div className='flex h-screen w-full bg-gray-50 font-[family-name:var(--font-geist-sans)]'>
        <Suspense fallback={null}>
          <InboxBootloaderClient />
        </Suspense>
        <Suspense fallback={null}>

          <Sidebar onTableReload={undefined} />

        </Suspense>

        <Header />

        <div className='flex-1 flex flex-col overflow-hidden ml-0 md:ml-66 mt-[64px] md:mt-[90px] h-[calc(100vh-64px)] md:h-[calc(100vh-90px)]'>
          {/* This region is the only scrollable area — header/footer stay put, only its content (e.g. table rows) scrolls */}
          <div className='flex-1 min-h-0 overflow-y-auto p-2 flex flex-col'>
            <div className="w-full flex-1 min-h-0 flex flex-col">
              {children}
            </div>
          </div>
          <Footer />
        </div>

      </div>

    </InboxProvider>
  );
}

// Mark display name for debugging
InboxLayout.displayName = 'InboxLayout';