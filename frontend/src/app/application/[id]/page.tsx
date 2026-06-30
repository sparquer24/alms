import React, { Suspense } from 'react';
import ApplicationDetailClient from './ApplicationDetailClient';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  return [{ id: '1' }];
}

export default async function Page({ params }: Props) {
  return (
    <Suspense fallback={<div>Loading application details...</div>}>
      <ApplicationDetailClient params={params} />
    </Suspense>
  );
}
