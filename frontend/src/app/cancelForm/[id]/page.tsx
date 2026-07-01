import CancelFormDetailClient from './CancelFormDetailClient';

// Pre-renders IDs 1-1000 as static shells for output: 'export'.
// The actual ID is resolved client-side via useParams() in CancelFormDetailClient.
export function generateStaticParams() {
  return Array.from({ length: 1000 }, (_, i) => ({ id: String(i + 1) }));
}

export default function CancelFormDetailPage() {
  return <CancelFormDetailClient />;
}
