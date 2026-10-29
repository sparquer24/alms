'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { Sidebar } from '../../components/Sidebar';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { InboxProvider } from '../../context/InboxContext';
import InboxBootloaderClient from '../../components/InboxBootloaderClient';
import { useAuth } from '../../hooks/useAuth';
import { useLayout } from '../../config/layoutContext';
import { PageLayoutSkeleton, ContentSkeleton } from '../../components/Skeleton';

function InboxMainContent({ children }: { children: React.ReactNode }) {
  const { sidebarCollapsed, headerHeight } = useLayout();

  return (
    <main
      className={`flex-1 ml-0 ${sidebarCollapsed ? 'md:ml-22' : 'md:ml-66'} min-w-0 overflow-auto flex flex-col transition-all duration-300 pt-[54px] md:pt-[58px]`}
      style={headerHeight != null ? { paddingTop: headerHeight } : undefined}
    >
      <div className='flex-grow flex flex-col min-h-0'>
        {children}
      </div>
      <Footer />
    </main>
  );
}

// Layout component that renders Sidebar and Header once for all /inbox routes
export default function InboxLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, initialized } = useAuth();
  const [checked, setChecked] = useState(() => initialized && !isLoading && isAuthenticated);

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
      <PageLayoutSkeleton>
        <ContentSkeleton />
      </PageLayoutSkeleton>
    );
  }

  return (
    <InboxProvider>
      <div className='flex h-screen bg-[#F3F5F8] font-sans antialiased overflow-hidden selection:bg-[#0B1F3A] selection:text-white'>
        <Suspense fallback={null}>
          <InboxBootloaderClient />
        </Suspense>
        <Suspense fallback={null}>
          <Sidebar onTableReload={undefined} />
        </Suspense>

        <Header />

        <InboxMainContent>{children}</InboxMainContent>
      </div>
    </InboxProvider>
  );
}

InboxLayout.displayName = 'InboxLayout';
