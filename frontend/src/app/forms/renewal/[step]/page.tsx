'use client';
import React, { useState, useEffect } from 'react';
import { IoMdHome } from 'react-icons/io';

const IoMdHomeFixed = IoMdHome as any;

import PersonalInformationRenewal from '../../../../components/forms/renewal/PersonalInformationRenewal';
import AddressDetailsRenewal from '../../../../components/forms/renewal/AddressDetailsRenewal';
import OccupationRenewal from '../../../../components/forms/renewal/OccupationRenewal';
import CriminalHistoryRenewal from '../../../../components/forms/renewal/CriminalHistoryRenewal';
import LicenseHistoryRenewal from '../../../../components/forms/renewal/LicenseHistoryRenewal';
import LicenseDetailsRenewal from '../../../../components/forms/renewal/LicenseDetailsRenewal';
import BiometricInformationRenewal from '../../../../components/forms/renewal/BiometricInformationRenewal';
import DocumentsUploadRenewal from '../../../../components/forms/renewal/DocumentsUploadRenewal';
import PreviewRenewal from '../../../../components/forms/renewal/PreviewRenewal';
import DeclarationRenewal from '../../../../components/forms/renewal/DeclarationRenewal';
import { RenewalFormProvider } from '../../../../components/forms/renewal/RenewalFormContext';
import { StepHeader } from '../../../../components/forms/elements/StepHeader';

const steps = [
  'Personal Information',
  'Address Details',
  'Occupation / Business',
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

import { useRouter, useSearchParams } from 'next/navigation';

interface StepPageProps {
  params: Promise<{ step: string }>;
}

const RenewalStepPage: React.FC<StepPageProps> = ({ params }) => {
  const router = useRouter();
  const [step, setStep] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const applicantId = searchParams?.get('id') || searchParams?.get('applicantId') || null;

  useEffect(() => {
    params.then(resolvedParams => {
      setStep(resolvedParams.step);
    });
  }, [params]);

  if (!step) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  let StepComponent: React.ComponentType<any> | null = null;
  let currentStep = 0;

  let stepIndex;
  if (step === 'preview') {
    stepIndex = 8;
  } else if (step === 'declaration') {
    stepIndex = 9;
  } else {
    stepIndex = steps.findIndex(s => stepToSlug(s) === step);
  }
  currentStep = stepIndex >= 0 ? stepIndex : 0;

  switch (step) {
    case stepToSlug('Personal Information'):
      StepComponent = PersonalInformationRenewal;
      break;
    case stepToSlug('Address Details'):
      StepComponent = AddressDetailsRenewal;
      break;
    case stepToSlug('Occupation / Business'):
      StepComponent = OccupationRenewal;
      break;
    case stepToSlug('Criminal History'):
      StepComponent = CriminalHistoryRenewal;
      break;
    case stepToSlug('License History'):
      StepComponent = LicenseHistoryRenewal;
      break;
    case stepToSlug('License Details'):
      StepComponent = LicenseDetailsRenewal;
      break;
    case stepToSlug('Biometric Information'):
      StepComponent = BiometricInformationRenewal;
      break;
    case stepToSlug('Documents Upload'):
      StepComponent = DocumentsUploadRenewal;
      break;
    case 'preview':
    case stepToSlug('Preview'):
      StepComponent = PreviewRenewal;
      break;
    case stepToSlug('Declaration & Submit'):
    case 'declaration':
      StepComponent = DeclarationRenewal;
      break;
    default:
      StepComponent = () => <div>Step not implemented: {step}</div>;
  }

  const handleStepClick = (idx: number) => {
    const previewIndex = steps.findIndex(s => s.toLowerCase().includes('preview'));
    const declarationIndex = steps.findIndex(s => s.toLowerCase().includes('declaration'));
    
    const currentParams = new URLSearchParams(searchParams ? searchParams.toString() : '');
    const qs = currentParams.toString();
    const basePath = '/forms/renewal';

    if (idx === previewIndex) {
      router.push(`${qs ? `${basePath}/preview?${qs}` : `${basePath}/preview`}`);
    } else if (idx === declarationIndex) {
      router.push(`${qs ? `${basePath}/declaration?${qs}` : `${basePath}/declaration`}`);
    } else {
      router.push(`${qs ? `${basePath}/${stepToSlug(steps[idx])}?${qs}` : `${basePath}/${stepToSlug(steps[idx])}`}`);
    }
  };

  const handleGoHome = () => {
    router.push('/inbox?type=renewal');
  };

  return (
    <RenewalFormProvider>
      <div
        className="relative min-h-screen"
        style={{
          backgroundImage: 'url(/backgroundIMGALMS.jpeg)',
          backgroundSize: 'cover',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
        }}
      >
        {/* Home Button */}
        <div className="fixed top-4 left-6 z-50">
          <button
            onClick={handleGoHome}
            className="flex items-center justify-center w-12 h-12 bg-white hover:bg-gray-50 rounded-full shadow-lg border-2 border-blue-500 transition-all duration-200 hover:scale-105"
            title="Go to Home"
          >
            <IoMdHomeFixed className="text-2xl text-[#0d2977]" />
          </button>
        </div>

        {/* Step Header - Same as Fresh Application */}
        <RenewalStepHeader steps={steps} currentStep={currentStep} onStepClick={handleStepClick} />

        <div className="flex max-w-8xl px-4 justify-center sm:px-8" style={{ paddingTop: 100, minHeight: '100vh' }}>
          <div className="rounded-2xl bg-white border border-blue-100 shadow-xl max-w-7xl w-full flex flex-col p-0" style={{ maxHeight: 'calc(100vh - 80px)', overflowY: 'auto' }}>
            {StepComponent && <StepComponent />}
          </div>
        </div>
      </div>
    </RenewalFormProvider>
  );
};

interface StepHeaderProps {
  steps: string[];
  currentStep: number;
  onStepClick?: (step: number) => void;
}

const RenewalStepHeader: React.FC<StepHeaderProps> = ({
  steps,
  currentStep,
  onStepClick = () => {},
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [pressedIndex, setPressedIndex] = useState<number | null>(null);

  useEffect(() => {
    if (pressedIndex !== null) {
      const t = setTimeout(() => setPressedIndex(null), 220);
      return () => clearTimeout(t);
    }
  }, [pressedIndex]);

  const handleClick = (idx: number) => {
    if (isLoading) return;
    setPressedIndex(idx);
    setIsLoading(true);

    setTimeout(() => {
      try {
        onStepClick(idx);
      } finally {
        setTimeout(() => setIsLoading(false), 450);
      }
    }, 160);
  };

  return (
    <header className="w-full fixed top-0 left-0 z-40 h-20" aria-hidden={false}>
      <div className="w-full flex justify-center py-2 px-3">
        <h1 className="text-lg sm:text-2xl font-bold text-blue-900 tracking-wide uppercase">
          RENEWAL APPLICATION FORM
        </h1>
      </div>
      <div
        className="max-w-7xl mx-auto rounded-lg shadow px-2 py-1 mt-0 bg-gradient-to-r from-[#0d2977] to-[#23408e]">
        <div className="flex space-x-2 px-2 py-1 justify-center items-center">
          {steps.map((stepName, idx) => {
            const active = currentStep === idx;
            const pressed = pressedIndex === idx;
            return (
              <div key={idx} className="flex flex-col items-center">
                <button
                  type="button"
                  onClick={() => handleClick(idx)}
                  suppressHydrationWarning
                  aria-current={active ? 'step' : undefined}
                  aria-disabled={isLoading}
                  className={`px-3 py-2 text-sm font-medium transition-transform duration-150 transform-gpu focus:outline-none flex flex-col items-center select-none
                    ${
                      active
                        ? 'bg-white text-[#0d2977]'
                        : 'bg-transparent text-blue-100 hover:bg-white hover:text-[#0d2977] rounded-sm'
                    }
                    ${pressed ? 'scale-95' : 'scale-100'}
                  `}
                  style={{
                    borderTopLeftRadius: '10px',
                    borderTopRightRadius: '10px',
                    minWidth: 88,
                  }}
                >
                  <span className={`text-xs ${active ? 'font-bold' : 'font-semibold'}`}>
                    {stepName}
                  </span>
                </button>
                {active && (
                  <div className="w-0 h-0 border-l-6 border-r-6 border-t-6 border-transparent border-t-white mt-[-2px]" />
                )}
              </div>
            );
          })}
        </div>

        {isLoading && (
          <div className="mt-2 px-2">
            <div className="animate-pulse">
              <div className="h-2 rounded bg-white/30 w-3/4 mx-auto" />
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default RenewalStepPage;