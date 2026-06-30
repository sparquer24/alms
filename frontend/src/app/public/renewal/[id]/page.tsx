'use client';

import React, { useState, useEffect } from 'react';
import PublicApplicationView from '../../../../components/PublicApplicationView';

interface PublicRenewalPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function PublicRenewalPage({ params }: PublicRenewalPageProps) {
  const [applicationId, setApplicationId] = useState<string | null>(null);

  useEffect(() => {
    params.then(resolvedParams => {
      setApplicationId(resolvedParams.id);
    });
  }, [params]);

  if (!applicationId) {
    return null;
  }

  return <PublicApplicationView applicationId={applicationId} type="renewal" />;
}
