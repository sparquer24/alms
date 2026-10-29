'use client';

import React, { useEffect, useState } from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { useAuth } from '../../hooks/useAuth';
import { useLayout } from '../../config/layoutContext';
import { useIsomorphicLayoutEffect } from '../../hooks/useIsomorphicLayoutEffect';
import { PageLayoutSkeleton, ContentSkeleton } from '../../components/Skeleton';

/**
 * Layout for all /cancelForm/* routes.
 * Provides the same sidebar + header shell as the inbox layout,
 * with auth guard so unauthenticated users are redirected to login.
 */
export default function CancelFormLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, initialized } = useAuth();
  const { headerOptions, setShowSidebar, setShowHeader, headerHeight } = useLayout();
  const [checked, setChecked] = useState(() => initialized && !isLoading && isAuthenticated);

  useIsomorphicLayoutEffect(() => {
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

  if (!initialized || isLoading || !checked) {
    return (
      <PageLayoutSkeleton sidebar={false}><ContentSkeleton /></PageLayoutSkeleton>





    );
  }

  return (
    <div className='flex h-screen bg-[#F3F5F8] font-sans antialiased overflow-hidden selection:bg-[#0B1F3A] selection:text-white'>
      <Header hideCreateForm {...headerOptions} />

      {/* Main content area — full width when sidebar is removed */}
      <main
        className='flex-1 w-full min-w-0 overflow-auto flex flex-col pt-[54px] md:pt-[58px]'
        style={headerHeight != null ? { paddingTop: headerHeight } : undefined}
      >
        <div className='flex-grow'>
          {children}
        </div>
        <Footer />
      </main>
    </div>
  );
}

CancelFormLayout.displayName = 'CancelFormLayout';
