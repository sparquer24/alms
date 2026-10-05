'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { NAVIGATION_START_EVENT } from '../utils/navigationEvents';

/**
 * Thin top-of-page progress bar shown while moving between pages.
 * Started by `onRouterTransitionStart` (see instrumentation-client.ts) and
 * completed as soon as the new route's pathname/query is committed.
 */
export default function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const routeKey = `${pathname}?${searchParams?.toString() ?? ''}`;

  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const activeRef = useRef(false);
  const trickleRef = useRef<number | null>(null);
  const showDelayRef = useRef<number | null>(null);
  const hideRef = useRef<number | null>(null);
  const safetyRef = useRef<number | null>(null);

  const clearTimers = () => {
    [trickleRef, showDelayRef, hideRef, safetyRef].forEach(ref => {
      if (ref.current != null) {
        window.clearTimeout(ref.current);
        window.clearInterval(ref.current);
        ref.current = null;
      }
    });
  };

  const finish = () => {
    if (!activeRef.current) return;
    activeRef.current = false;
    clearTimers();
    setProgress(100);
    hideRef.current = window.setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 250);
  };

  useEffect(() => {
    const start = () => {
      clearTimers();
      activeRef.current = true;
      setProgress(8);
      // Skip the bar entirely for navigations that resolve almost instantly
      // (prefetched routes) so it doesn't flicker.
      showDelayRef.current = window.setTimeout(() => setVisible(true), 120);
      trickleRef.current = window.setInterval(() => {
        setProgress(p => (p >= 90 ? p : p + (90 - p) * 0.12));
      }, 200);
      // Never leave the bar stuck if a navigation is cancelled or fails.
      safetyRef.current = window.setTimeout(finish, 15000);
    };

    window.addEventListener(NAVIGATION_START_EVENT, start);
    return () => {
      window.removeEventListener(NAVIGATION_START_EVENT, start);
      clearTimers();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    finish();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeKey]);

  return (
    <div
      aria-hidden='true'
      className='pointer-events-none fixed inset-x-0 top-0 z-[9999] h-[3px]'
      style={{ opacity: visible ? 1 : 0, transition: 'opacity 200ms ease' }}
    >
      <div
        className='h-full bg-[#0F2D52] shadow-[0_0_8px_rgba(15,45,82,0.5)]'
        style={{
          width: `${progress}%`,
          transition: progress === 0 ? 'none' : 'width 200ms ease-out',
        }}
      />
    </div>
  );
}
