import React from 'react';
import ApplicationDetailPage from '../../application/[id]/page';

interface Props {
	params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
	return [{ id: '1' }];
}

export default async function RenewalApplicationPage({ params }: Props) {
	return <ApplicationDetailPage params={params} />;
}
