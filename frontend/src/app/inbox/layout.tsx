"use client";

import React, { useEffect } from 'react';
import { Sidebar } from '../../components/Sidebar';
import Header from '../../components/Header';
import { InboxProvider, useInbox } from '../../context/InboxContext';
import { useSearchParams, usePathname } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { openInbox } from '../../store/slices/uiSlice';

function InboxBootloader({ onTableReload }: { onTableReload?: (t: string) => void }) {
  const { loadType } = useInbox();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const dispatch = useDispatch();

  useEffect(() => {
    try {
      if (!pathname) return;
      const type = searchParams?.get('type');
      if ((pathname === '/inbox' || pathname.startsWith('/admin')) && type) {
        const normalized = String(type);
        // ensure inbox UI is open
        dispatch(openInbox());
        // trigger load in context
        void loadType(normalized).catch(() => {});
        if (onTableReload) onTableReload(normalized);
      }
    } catch (err) {
      // ignore
    }
    // intentionally only run on mount/url change
  }, [pathname, searchParams, dispatch, loadType, onTableReload]);

  return null;
}

// Layout component that renders Sidebar and Header once for all /inbox routes
export default function InboxLayout({ children }: { children: React.ReactNode }) {
  return (
    <InboxProvider>
      <div className="flex h-screen w-full bg-gray-50 font-[family-name:var(--font-geist-sans)]">
        <InboxBootloader />
        <Sidebar onTableReload={undefined} />
        <Header onSearch={() => {}} onDateFilter={() => {}} onReset={() => {}} />
        <div className="flex-1 p-8 overflow-y-auto ml-[80px] md:ml-[18%] mt-[64px] md:mt-[70px]">
          {children}
        </div>
      </div>
    </InboxProvider>
  );
}

// Mark display name for debugging
InboxLayout.displayName = 'InboxLayout';
