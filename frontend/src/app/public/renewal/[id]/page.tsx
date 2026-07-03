import React from 'react';
import PublicRenewalPage from './PublicRenewalClient';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  const params = Array.from({ length: 10 }, (_, i) => ({ id: String(i + 1) }));

  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    const res = await fetch(`${apiUrl}/renewal-forms`, { next: { revalidate: 0 } });
    const data = await res.json();
    const items = data?.data || data;
    if (Array.isArray(items)) {
      items.forEach((item: any) => {
        const idStr = String(item.id);
        if (idStr && !params.some(p => p.id === idStr)) {
          params.push({ id: idStr });
        }
      });
    }
  } catch (error) {
    // API offline or build-time error, fallback to static params
  }

  return params;
}

export default async function Page({ params }: Props) {
  return <PublicRenewalPage params={params} />;
}
