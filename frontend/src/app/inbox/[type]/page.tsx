"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';


// Compatibility wrapper: redirect to /inbox?type=... to use the new query-based inbox page
export default function InboxTypeRedirect({ params }: { params: Promise<{ type: string }> }) {
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
    return () => { mounted = false; };
  }, [params, router]);

  return null;
}
