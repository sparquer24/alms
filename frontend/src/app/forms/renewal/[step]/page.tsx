import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

const RenewalStepPage = ({ searchParams }: { searchParams?: Record<string, string | string[] | undefined> }) => {
  const id = searchParams?.id || searchParams?.applicationId || searchParams?.applicantId;
  const query = id ? `?id=${encodeURIComponent(String(id))}` : '';
  redirect(`/forms/renewal${query}`);
};

export default RenewalStepPage;
