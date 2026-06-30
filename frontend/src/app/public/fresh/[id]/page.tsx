import React from 'react';
import PublicFreshPage from './PublicFreshClient';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  return [{ id: '1' }];
}

export default async function Page({ params }: Props) {
  return <PublicFreshPage params={params} />;
}
