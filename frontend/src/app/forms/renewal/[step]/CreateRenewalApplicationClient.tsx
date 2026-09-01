'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useRenewalApplicationForm } from '../../../../hooks/useRenewalApplicationForm';
import RenewalSummary from '../../../../components/forms/renewal/RenewalSummary';

// Renewal step section components
import PersonalDetailsSection from '../../../../components/forms/renewal/sections/PersonalDetailsSection';
import AddressDetailsSection from '../../../../components/forms/renewal/sections/AddressDetailsSection';
import OccupationSection from '../../../../components/forms/renewal/sections/OccupationSection';
import CriminalHistory from '../../../../components/forms/renewal/sections/CriminalHistory';
import LicenseHistory from '../../../../components/forms/renewal/sections/LicenseHistory';
import LicenseDetailsSection from '../../../../components/forms/renewal/sections/LicenseDetailsSection';
import BiometricInformation from '../../../../components/forms/renewal/sections/BiometricInformation';
import DocumentsSection from '../../../../components/forms/renewal/sections/DocumentsSection';
import DeclarationSection from '../../../../components/forms/renewal/sections/DeclarationSection';
import ApplicationPreview from '../../../../components/forms/renewal/sections/ApplicationPreview';

interface StepPageProps {
  params: Promise<{ step: string }>;
}

const steps = [
  'Personal Information',
  'Address Details',
  'Occupation/Business',
  'Criminal History',
  'License History',
  'License Details',
  'Biometric Information',
  'Documents Upload',
  'Preview',
  'Declaration & Submit',
];

const stepToSlug = (name: string) =>
  name
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

const StepPage: React.FC<StepPageProps> = ({ params }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState<string | null>(null);

  const { formData, patchFormData, isLoading, isSaving, saveStep, renewalId, licenseId } =
    useRenewalApplicationForm();

  useEffect(() => {
    params.then((resolvedParams) => {
      setStep(resolvedParams.step);
    });
  }, [params]);

  if (!step || isLoading) {
    return (
      <div className='p-8 flex items-center justify-center min-h-[400px]'>
        <div className='flex flex-col items-center space-y-4'>
          <div className='w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin'></div>
          <p className='text-gray-600 font-medium'>Loading application step...</p>
        </div>
      </div>
    );
  }

  const currentStepIndex = steps.findIndex((s) => stepToSlug(s) === step);

  const handleInputChange = (e: any) => {
    const { name, value, type, checked } = e.target || {};
    if (!name) return;

    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      patchFormData({
        [parent]: {
          ...(formData as any)[parent],
          [child]: type === 'checkbox' ? checked : value,
        },
      } as any);
    } else {
      patchFormData({
        [name]: type === 'checkbox' ? checked : value,
      } as any);
    }
  };

  const currentParams = new URLSearchParams(searchParams ? searchParams.toString() : '');

  const navigateToStep = (targetIndex: number) => {
    const targetSlug =
      targetIndex === 8
        ? 'preview'
        : targetIndex === 9
        ? 'declaration'
        : stepToSlug(steps[targetIndex]);
    const qs = currentParams.toString();
    if (qs) {
      router.push(`/forms/renewal/${targetSlug}?${qs}`);
    } else {
      router.push(`/forms/renewal/${targetSlug}`);
    }
  };

  const handleNext = async () => {
    try {
      await saveStep();
      if (currentStepIndex < steps.length - 1) {
        navigateToStep(currentStepIndex + 1);
      }
    } catch (err) {
      // Error handled by hook toast
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      navigateToStep(currentStepIndex - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      await saveStep(undefined, { isSubmit: true });
      router.push('/inbox?type=all');
    } catch (err) {
      // Error handled by hook toast
    }
  };

  const handleFileChange = (name: string, file: File | null) => {
    patchFormData({ [name]: file } as any);
  };

  const renderStepComponent = () => {
    switch (step) {
      case stepToSlug('Personal Information'):
        return <PersonalDetailsSection formData={formData} onChange={handleInputChange} />;
      case stepToSlug('Address Details'):
        return <AddressDetailsSection formData={formData} onChange={handleInputChange} />;
      case stepToSlug('Occupation/Business'):
        return <OccupationSection formData={formData} onChange={handleInputChange} />;
      case stepToSlug('Criminal History'):
        return <CriminalHistory formData={formData} onChange={handleInputChange} />;
      case stepToSlug('License History'):
        return (
          <LicenseHistory
            formData={formData}
            onChange={handleInputChange}
            renewalId={renewalId}
            onPatch={patchFormData}
          />
        );
      case stepToSlug('License Details'):
        return (
          <LicenseDetailsSection
            formData={formData}
            onChange={handleInputChange}
            renewalId={renewalId}
            onPatch={patchFormData}
          />
        );
      case stepToSlug('Biometric Information'):
        return (
          <BiometricInformation
            formData={formData}
            renewalId={renewalId}
            onChange={handleInputChange}
            onFileChange={handleFileChange}
          />
        );
      case stepToSlug('Documents Upload'):
        return (
          <DocumentsSection
            formData={formData}
            renewalId={renewalId}
            onPatch={patchFormData}
          />
        );
      case 'preview':
        return <ApplicationPreview formData={formData} />;
      case 'declaration':
        return <DeclarationSection formData={formData} onChange={handleInputChange} />;
      default:
        return <div>Step not implemented: {step}</div>;
    }
  };

  return (
    <div className='p-6 sm:p-8 space-y-6'>
      {/* Renewal Summary Banner */}
      <RenewalSummary
        renewalId={String(renewalId || '')}
        licenseId={String(licenseId || formData.licenseId || '')}
        data={formData}
      />

      {/* Main Step Content */}
      <div className='bg-white rounded-xl'>{renderStepComponent()}</div>

      {/* Action Footer Navigation Buttons */}
      <div className='flex justify-between items-center pt-6 border-t border-gray-200'>
        <button
          type='button'
          onClick={handlePrev}
          disabled={currentStepIndex === 0 || isSaving}
          className='px-6 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed'
        >
          Previous
        </button>

        <div className='flex items-center space-x-3'>
          {step === 'declaration' ? (
            <button
              type='button'
              onClick={handleSubmit}
              disabled={isSaving}
              className='px-8 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-md transition-colors disabled:opacity-50 flex items-center space-x-2'
            >
              {isSaving ? (
                <>
                  <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin' />
                  <span>Submitting...</span>
                </>
              ) : (
                <span>Submit Renewal Application</span>
              )}
            </button>
          ) : (
            <button
              type='button'
              onClick={handleNext}
              disabled={isSaving}
              className='px-8 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-md transition-colors disabled:opacity-50 flex items-center space-x-2'
            >
              {isSaving ? (
                <>
                  <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin' />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save & Continue</span>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default StepPage;
