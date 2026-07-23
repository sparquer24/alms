import React, { Suspense } from 'react';
import ApplicationDetailPage from '../../application/[id]/page';
import { ApplicationDetailSkeleton } from '../../../components/Skeleton';

interface Props {
	params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
	// Return a static list of params to avoid 401 unauthorized errors during build
	const params = Array.from({ length: 1000 }, (_, i) => ({ id: String(i + 1) }));
	return params;
}

export default async function RenewalApplicationPage({ params }: Props) {
	return (
		<Suspense fallback={<ApplicationDetailSkeleton />}>
			<ApplicationDetailPage params={params} />
		</Suspense>
	);
}
