import React, { Suspense } from 'react';
import ApplicationDetailClient from './ApplicationDetailClient';
import { ApplicationDetailSkeleton } from '../../../components/Skeleton';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  // Return a static list of params to avoid 401 unauthorized errors during build
  // since we don't have a user token available here.
  const params = Array.from({ length: 1000 }, (_, i) => ({ id: String(i + 1) }));
  return params;
}

export default async function Page({ params }: Props) {
  return (
    <Suspense fallback={<ApplicationDetailSkeleton />}>
      <ApplicationDetailClient params={params} />
    </Suspense>
  );
}
