'use client';

import React, { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';

export default function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    
    // Check initial state
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setIsOffline(true);
    }

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isMounted || !isOffline) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 w-full z-[9999] bg-red-600 text-white px-4 py-3 shadow-md flex items-center justify-center space-x-3 transition-transform duration-300 ease-in-out transform translate-y-0">
      <WifiOff className="w-5 h-5 animate-pulse" />
      <span className="font-medium text-sm md:text-base">
        You are currently offline. Please check your internet connection to continue using ALMS.
      </span>
    </div>
  );
}
