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
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4'></div>
          <p className='text-gray-600'>Loading...</p>
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

        <div className='flex-1 overflow-y-auto ml-[80px] md:ml-[18%] mt-[64px] md:mt-[70px] flex flex-col'>

          <div className="flex-grow p-8">

            {children}

          </div>

          <Footer />

        </div>

      </div>

    </InboxProvider>
  );
}

// Mark display name for debugging
InboxLayout.displayName = 'InboxLayout';