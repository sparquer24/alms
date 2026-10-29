import { redirect } from 'next/navigation';

// The step-per-URL renewal flow was retired: the single-page form at
// /forms/renewal handles every step. Keep old links (licenseId/renewalId) working.
export default async function LegacyRenewalStepPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(await searchParams)) {
    if (typeof value === 'string') query.set(key, value);
  }
  const qs = query.toString();
  redirect(qs ? `/forms/renewal?${qs}` : '/forms/renewal');
}
