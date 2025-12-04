'use client';

import React, { useEffect } from 'react';
import { useSearchParams, usePathname } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { useInbox } from '../context/InboxContext';
import { openInbox } from '../store/slices/uiSlice';

export default function InboxBootloaderClient({
  onTableReload,
}: {
  onTableReload?: (t: string) => void;
}) {
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
