import React, { Suspense } from 'react';
import CancelFormDetailClient from './CancelFormDetailClient';

interface Props {
  params: Promise<{ id: string }>;
}

// Pre-renders IDs 1-1000 as static shells for output: 'export'.
// The actual ID is resolved client-side via useParams() in CancelFormDetailClient.
export async function generateStaticParams() {
  return Array.from({ length: 10 }, (_, i) => ({ id: String(i + 1) }));
}

export default async function CancelFormDetailPage({ params }: Props) {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-600 mr-3" />
        <span className="text-xl font-medium text-gray-700">Loading request...</span>
      </div>
    }>
      <CancelFormDetailClient />
    </Suspense>
  );
}
