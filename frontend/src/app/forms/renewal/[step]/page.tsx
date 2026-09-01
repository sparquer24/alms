import StepPage from './CreateRenewalApplicationClient';

interface Props {
  params: Promise<{ step: string }>;
}

export async function generateStaticParams() {
  return [
    { step: 'personal-information' },
    { step: 'address-details' },
    { step: 'occupation-business' },
    { step: 'criminal-history' },
    { step: 'license-history' },
    { step: 'license-details' },
    { step: 'biometric-information' },
    { step: 'documents-upload' },
    { step: 'preview' },
    { step: 'declaration' },
  ];
}

export default async function Page({ params }: Props) {
  return <StepPage params={params} />;
}
