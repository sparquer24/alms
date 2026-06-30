import React, { Suspense } from 'react';
import PublicApplicationPage from './PublicApplicationClient';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  return [{ id: '1' }];
}

export default async function Page({ params }: Props) {
  return (
    <Suspense fallback={<div>Loading application...</div>}>
      <PublicApplicationPage params={params} />
    </Suspense>
  );
}
