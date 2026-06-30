import React from 'react';
import PublicRenewalPage from './PublicRenewalClient';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  return [{ id: '1' }];
}

export default async function Page({ params }: Props) {
  return <PublicRenewalPage params={params} />;
}
