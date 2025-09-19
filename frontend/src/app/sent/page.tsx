"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Redirect /sent to the inbox query-based route
export default function SentRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/home/sent');
  }, [router]);

  return null;
}
