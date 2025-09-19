"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Redirect final page to inbox query route
export default function FinalRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/home/final');
  }, [router]);

  return null;
}
