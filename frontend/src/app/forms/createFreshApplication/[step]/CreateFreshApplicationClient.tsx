'use client';
import React, { useState, useEffect } from 'react';

// freshApplication step components
import PersonalInformation from '../../../../components/forms/freshApplication/PersonalInformation'; // step1
import AddressDetails from '../../../../components/forms/freshApplication/AddressDetails'; // step2
import OccupationBussiness from '../../../../components/forms/freshApplication/OccupationBussiness'; // step3
import LicenseDetails from '../../../../components/forms/freshApplication/LicenseDetails'; // step5
import CriminalHistory from '../../../../components/forms/freshApplication/CriminalHistory'; // step6
import LicenseHistory from '../../../../components/forms/freshApplication/LicenseHistory'; // step7
import BiometricInformation from '../../../../components/forms/freshApplication/BiometricInformation'; // step8
import DocumentsUpload from '../../../../components/forms/freshApplication/DocumentsUpload'; // step9
import Preview from '../../../../components/forms/freshApplication/Preview'; // preview
import Declaration from '../../../../components/forms/freshApplication/Declaration'; // declaration

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
    return null;
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
