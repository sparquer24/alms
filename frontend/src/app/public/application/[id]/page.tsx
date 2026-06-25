'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import PublicApplicationView from '../../../../components/PublicApplicationView';

interface PublicApplicationPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function PublicApplicationPage({ params }: PublicApplicationPageProps) {
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const typeParam = searchParams?.get('type') || '';
  const type = typeParam === 'renewal' ? 'renewal' : 'fresh';

  useEffect(() => {
    params.then(resolvedParams => {
      setApplicationId(resolvedParams.id);
    });
  }, [params]);

  if (!applicationId) {
    return null;
  }

  return <PublicApplicationView applicationId={applicationId} type={type} />;
}
