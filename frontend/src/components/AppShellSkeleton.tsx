'use client';

import React, { Suspense } from 'react';
import { useAuth } from '../hooks/useAuth';
import { LayoutProvider, useLayout } from '../config/layoutContext';
import { Sidebar } from './Sidebar';
import Header from './Header';

interface AppShellSkeletonProps {
  /** Pages like Licenses render full-width without the sidebar. */
  sidebar?: boolean;
  /** Placeholder chrome shown before the user is known (first load / login). */
  sidebarFallback: React.ReactNode;
  headerFallback: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Loading-state page frame. Once the officer is signed in it renders the real
 * Sidebar and Header — so moving between pages keeps the navigation steady and
 * only the content area shows a placeholder — and falls back to grey skeleton
 * chrome only on the very first load, before auth is known.
 */
export default function AppShellSkeleton(props: AppShellSkeletonProps) {
  // Full-width pages get their own layout context with the sidebar off, so the
  // real Header lines up exactly where the page's own header will be.
  if (props.sidebar === false) {
    return (
      <LayoutProvider initialShowSidebar={false}>
        <ShellFrame {...props} />
      </LayoutProvider>
    );
  }
  return <ShellFrame {...props} />;
}

function ShellFrame({ sidebar = true, sidebarFallback, headerFallback, children }: AppShellSkeletonProps) {
  const { isAuthenticated, initialized } = useAuth();
  const { headerHeight } = useLayout();
  const useRealChrome = initialized && isAuthenticated;

  return (
    <div className='flex h-screen w-full bg-[#F4F6F9] font-sans antialiased overflow-hidden relative'>
      {/* Indian National Tricolor Animated Top Flag Loader (Runs simultaneously with skeleton) */}
      <div className='absolute top-0 inset-x-0 h-[3px] z-50 pointer-events-none overflow-hidden bg-slate-200/50'>
        <div className='absolute inset-0 flex opacity-40'>
          <div className='w-1/3 bg-[#FF9933]' />
          <div className='w-1/3 bg-[#FFFFFF]' />
          <div className='w-1/3 bg-[#138808]' />
        </div>
        <div className='absolute inset-0 flag-runner-bar' />
      </div>
      {sidebar &&
        (useRealChrome ? (
          <Suspense fallback={sidebarFallback}>
            <Sidebar />
          </Suspense>
        ) : (
          sidebarFallback
        ))}
      {useRealChrome ? <Header showBackButton={!sidebar} /> : headerFallback}
      <main
        className={`flex-1 min-w-0 overflow-y-auto flex flex-col pt-[64px] md:pt-[78px] ${sidebar ? 'ml-0 md:ml-66' : 'ml-0'}`}
        style={useRealChrome && headerHeight != null ? { paddingTop: headerHeight } : undefined}
      >
        <div className='flex-grow p-3 sm:p-4 lg:p-6'>{children}</div>
      </main>
    </div>
  );
}
