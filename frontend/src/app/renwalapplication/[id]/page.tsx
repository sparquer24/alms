import { redirect } from 'next/navigation';

interface RenewalApplicationRoutePageProps {
	params: {
		id: string;
	};
}

export default function RenewalApplicationRoutePage({ params }: RenewalApplicationRoutePageProps) {
	redirect(`/renewalApplication/${params.id}`);
}
