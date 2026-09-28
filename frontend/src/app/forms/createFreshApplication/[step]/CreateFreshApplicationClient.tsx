'use client';
import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { FormSkeleton } from '../../../../components/forms/elements/FormSkeleton';

// freshApplication step components — loaded on demand so navigating to one
// step doesn't force-download the code for every other step (Biometric and
// Preview alone are 1,600-2,900 lines each).
const stepLoading = () => <FormSkeleton rows={5} />;
const PersonalInformation = dynamic(() => import('../../../../components/forms/freshApplication/PersonalInformation'), { loading: stepLoading }); // step1
const AddressDetails = dynamic(() => import('../../../../components/forms/freshApplication/AddressDetails'), { loading: stepLoading }); // step2
const OccupationBussiness = dynamic(() => import('../../../../components/forms/freshApplication/OccupationBussiness'), { loading: stepLoading }); // step3
const LicenseDetails = dynamic(() => import('../../../../components/forms/freshApplication/LicenseDetails'), { loading: stepLoading }); // step5
const CriminalHistory = dynamic(() => import('../../../../components/forms/freshApplication/CriminalHistory'), { loading: stepLoading }); // step6
const LicenseHistory = dynamic(() => import('../../../../components/forms/freshApplication/LicenseHistory'), { loading: stepLoading }); // step7
const BiometricInformation = dynamic(() => import('../../../../components/forms/freshApplication/BiometricInformation'), { loading: stepLoading, ssr: false }); // step8
const DocumentsUpload = dynamic(() => import('../../../../components/forms/freshApplication/DocumentsUpload'), { loading: stepLoading }); // step9
const Preview = dynamic(() => import('../../../../components/forms/freshApplication/Preview'), { loading: stepLoading }); // preview
const Declaration = dynamic(() => import('../../../../components/forms/freshApplication/Declaration'), { loading: stepLoading }); // declaration

interface StepPageProps {
  params: Promise<{ step: string }>;
}

// Helper to slugify step names for URLs and comparison
const stepToSlug = (name: string) =>
  name
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

const StepPage: React.FC<StepPageProps> = ({ params }) => {
  const [step, setStep] = useState<string | null>(null);

  // Handle params Promise in useEffect
  useEffect(() => {
    params.then(resolvedParams => {
      setStep(resolvedParams.step);
    });
  }, [params]);

  if (!step) {
    return <FormSkeleton rows={5} />;
  }

  switch (step) {
    case stepToSlug('Personal Information'):
      return <PersonalInformation />;
    case stepToSlug('Address Details'):
      return <AddressDetails />;
    case stepToSlug('Occupation/Business'):
      return <OccupationBussiness />;
    case stepToSlug('Criminal History'):
      return <CriminalHistory />;
    case stepToSlug('License History'):
      return <LicenseHistory />;
    case stepToSlug('License Details'):
      return <LicenseDetails />;
    case stepToSlug('Biometric Information'):
      return <BiometricInformation />;
    case stepToSlug('Documents Upload'):
      return <DocumentsUpload />;
    case 'preview':
      return <Preview />;
    case 'declaration':
      return <Declaration />;
    default:
      return <div>Step not implemented: {step}</div>;
  }
};

export default StepPage;
