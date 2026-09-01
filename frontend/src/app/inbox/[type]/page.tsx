import React from 'react';
import InboxTypeRedirectClient from './InboxTypeRedirectClient';

export async function generateStaticParams() {
  return [
    { type: 'all' },
    { type: 'forwarded' },
    { type: 'returned' },
    { type: 'redflagged' },
    { type: 'drafts' },
    { type: 'sent' },
    { type: 'closed' },
    { type: 'freshform' },
    { type: 'reenquiry' },
    { type: 'renewal' },
  ];
}

interface Props {
  params: Promise<{ type: string }>;
}

export default async function Page({ params }: Props) {
  return <InboxTypeRedirectClient params={params} />;
}
