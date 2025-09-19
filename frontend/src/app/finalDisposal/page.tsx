"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Redirect to inbox query route for final disposal
export default function FinalDisposalRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/home/finaldisposal');
  }, [router]);

  return null;
}
