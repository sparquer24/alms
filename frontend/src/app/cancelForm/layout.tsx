'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { Sidebar } from '../../components/Sidebar';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { useAuth } from '../../hooks/useAuth';

/**
 * Layout for all /cancelForm/* routes.
 * Provides the same sidebar + header shell as the inbox layout,
 * with auth guard so unauthenticated users are redirected to login.
 */
export default function CancelFormLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, initialized } = useAuth();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!initialized || isLoading) return;
    if (checked) return;

    if (!isAuthenticated) {
      window.location.href = '/login';
      return;
    }

    setChecked(true);
  }, [isAuthenticated, isLoading, initialized, checked]);

  // Show spinner while auth is being resolved
  if (!initialized || isLoading || !checked) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4'></div>
          <p className='text-gray-600'>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='flex h-screen w-full bg-gray-50 font-[family-name:var(--font-geist-sans)]'>
      <Suspense fallback={null}>
        <Sidebar />
      </Suspense>

      <Header hideCreateForm />

      {/* Main content area — mirrors inbox layout margins */}
      <div className='flex-1 overflow-y-auto ml-[80px] md:ml-[18%] mt-[64px] md:mt-[70px] flex flex-col'>
        <div className='flex-grow p-6 md:p-8'>
          <div className='w-full'>{children}</div>
        </div>
        <Footer />
      </div>
    </div>
  );
}

CancelFormLayout.displayName = 'CancelFormLayout';
