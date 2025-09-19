"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomeTypeRedirect({ params }: { params: Promise<{ type: string }> }) {
  const router = useRouter();

  useEffect(() => {
    let mounted = true;
    (async () => {
      const resolved = await params;
      if (!mounted) return;
      const resolvedType = String(resolved.type).toLowerCase();
      // Replace with query-based URL to centralize rendering
      router.push(`/home?type=${encodeURIComponent(resolvedType)}`);
    })();
    return () => { mounted = false; };
  }, [params, router]);

  return null;
}
