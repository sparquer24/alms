"use client";

import React from 'react';
import ApplicationDetailPage from '../../application/[id]/page';

interface Props {
  // `params` is provided as a Promise in the new Next.js behavior
  params: Promise<{ id: string }> | { id: string };
}

export default function RenewalApplicationPage({ params }: Props) {
  // Unwrap params promise using React.use() (Next.js migration helper).
  // React.use is available in Next.js runtime to synchronously unwrap route params.
  // @ts-ignore
  const resolvedParams = (React as any).use ? (React as any).use(params) : params;
  const id = (resolvedParams && (resolvedParams as any).id) || '';

  const promiseParams = Promise.resolve({ id });
  return <ApplicationDetailPage params={promiseParams} />;
}
