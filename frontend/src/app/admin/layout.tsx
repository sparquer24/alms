'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { Sidebar } from '@/components/Sidebar';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

import { LayoutProvider, useLayout } from '@/config/layoutContext';
import { normalizeRole } from '@/utils/roleUtils';
import { PageLayoutSkeleton, ContentSkeleton } from '@/components/Skeleton';

export default function AdminLayout({ children }: { children: any }) {
  const { userRole, token, isLoading, initialized } = useAuth();
  const router = useRouter();
  const effectiveRole = useMemo(() => {
    return normalizeRole(userRole);
  }, [userRole]);

  const [checked, setChecked] = useState(
    () => initialized && !isLoading && !!token && effectiveRole === 'ADMIN'
  );

  useEffect(() => {
    if (!initialized || isLoading) return;
    if (checked) return;

    if (!token) {
      router.replace('/login');
      return;
    }

    if (!effectiveRole) {
      router.replace('/login?error=no_role');
      return;
    }

    if (effectiveRole === 'SUPER_ADMIN') {
      router.replace('/superAdmin/userManagement');
      return;
    }

    if (effectiveRole !== 'ADMIN') {
      router.replace('/');
      return;
    }

    setChecked(true);
  }, [token, effectiveRole, isLoading, initialized, checked, router]);

  if (isLoading || !checked || !initialized) {
    return (
      <PageLayoutSkeleton>
        <ContentSkeleton />
      </PageLayoutSkeleton>
    );
  }

  if (!token || !effectiveRole || effectiveRole !== 'ADMIN') {
    return null;
  }

  return (
    <LayoutProvider>
      <AdminLayoutBody>{children}</AdminLayoutBody>
    </LayoutProvider>
  );
}

function AdminLayoutBody({ children }: { children: any }) {
  const { headerHeight, sidebarCollapsed } = useLayout();

  return (
    <div className='flex h-screen bg-[#F3F5F8] font-sans antialiased overflow-hidden selection:bg-[#0B1F3A] selection:text-white'>
      <Sidebar />
      <Header />
      <main
        className={`isolate flex-1 ml-0 ${sidebarCollapsed ? 'md:ml-22' : 'md:ml-66'} min-w-0 overflow-auto flex flex-col transition-all duration-300 pt-[54px] md:pt-[58px]`}
        style={headerHeight != null ? { paddingTop: headerHeight } : undefined}
      >
        <div className="flex-grow min-h-0 flex flex-col">
          {children}
        </div>
        <Footer />
      </main>
    </div>
  );
}
