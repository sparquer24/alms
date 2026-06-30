"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function InboxTypeRedirectClient({ params }: { params: Promise<{ type: string }> }) {
  const router = useRouter();

  useEffect(() => {
    let mounted = true;
    (async () => {
      const resolved = await params;
      if (!mounted) return;
      const t = String(resolved.type).toLowerCase();
      // Use replace so history is clean and use query-based URL
      router.push(`/inbox?type=${encodeURIComponent(t)}`);
    })();
    return () => {
      mounted = false;
    };
  }, [params, router]);

  return null;
}
