'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { useAuth } from '../../hooks/useAuth';
import { useLayout } from '../../config/layoutContext';

/**
 * Layout for all /cancelForm/* routes.
 * Provides the same sidebar + header shell as the inbox layout,
 * with auth guard so unauthenticated users are redirected to login.
 */
export default function CancelFormLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, initialized } = useAuth();
  const { headerOptions, setShowSidebar, setShowHeader } = useLayout();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    setShowHeader(true);
    setShowSidebar(false);

    return () => {
      setShowSidebar(true);
    };
  }, [setShowHeader, setShowSidebar]);

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
          <div className='animate-spin rounded-full h-10 w-10 border-b-2 border-[#001F54] mx-auto mb-4'></div>
          <p className='text-sm text-gray-600'>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='flex h-screen bg-[#F4F6F9] font-sans antialiased overflow-hidden selection:bg-[#0F2D52] selection:text-white'>
      <Header hideCreateForm {...headerOptions} />

      {/* Main content area — full width when sidebar is removed */}
      <main className='flex-1 w-full min-w-0 overflow-auto flex flex-col pt-[64px] md:pt-[78px]'>
        <div className='flex-grow'>
          {children}
        </div>
        <Footer />
      </main>
    </div>
  );
}

CancelFormLayout.displayName = 'CancelFormLayout';
