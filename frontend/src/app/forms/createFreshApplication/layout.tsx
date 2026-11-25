'use client';
import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { ApplicationService } from '../../../api/applicationService';
import { StepHeader } from '../../../components/forms/elements/StepHeader';
import { WarningAlertModal } from '../../../components/forms/elements/WarningAlertModal';


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

const MANDATORY_SECTIONS = [
  { index: 0, name: 'Personal Information' },
  { index: 1, name: 'Address Details' },
  { index: 2, name: 'Occupation/Business' },
  { index: 3, name: 'Criminal History' },
  { index: 4, name: 'License History' },
  { index: 5, name: 'License Details' },
  { index: 6, name: 'Biometric Information' },
  { index: 7, name: 'Documents Upload' },
];

const isStepComplete = (data: any, stepIndex: number): boolean => {
  if (!data) return false;
  switch (stepIndex) {
    case 0: // Personal Information
      return Boolean(data.firstName || data.personalDetails?.firstName);
    case 1: { // Address Details
      const hasPresent = Boolean(
        data.presentAddress ||
        (Array.isArray(data.addresses) && data.addresses.some((a: any) => (a.type || '').toLowerCase() === 'present' || a.addressLine))
      );
      const hasPermanent = Boolean(
        data.permanentAddress ||
        (Array.isArray(data.addresses) && (data.addresses.some((a: any) => (a.type || '').toLowerCase() === 'permanent') || data.addresses.length >= 2)) ||
        data.presentAddress
      );
      return hasPresent && hasPermanent;
    }
    case 2: // Occupation/Business
      return Boolean(
        data.occupationAndBusiness &&
        (data.occupationAndBusiness.occupation || (typeof data.occupationAndBusiness === 'object' && Object.keys(data.occupationAndBusiness).length > 0))
      );
    case 3: // Criminal History
      return Boolean(Array.isArray(data.criminalHistories) && data.criminalHistories.length > 0);
    case 4: // License History
      return Boolean(
        (Array.isArray(data.licenseHistories) && data.licenseHistories.length > 0) ||
        (Array.isArray(data.licenseHistory) && data.licenseHistory.length > 0)
      );
    case 5: // License Details
      return Boolean(Array.isArray(data.licenseDetails) && data.licenseDetails.length > 0);
    case 6: { // Biometric Information
      const biometric = data.biometricData?.biometricData || data.biometricData;
      const hasFingerprints = Boolean(
        biometric?.fingerprints && Array.isArray(biometric.fingerprints) && biometric.fingerprints.length > 0
      );
      const hasPhoto = Boolean(
        (Array.isArray(data.fileUploads) && data.fileUploads.some((f: any) => (f.fileType || '').toUpperCase() === 'PHOTOGRAPH')) ||
        biometric?.photo
      );
      return hasFingerprints || hasPhoto;
    }
    case 7: { // Documents Upload
      if (!Array.isArray(data.fileUploads)) return false;
      const uploadedTypes = new Set(
        data.fileUploads.map((f: any) => (f.fileType || '').toUpperCase())
      );
      return uploadedTypes.has('AADHAR_CARD') && uploadedTypes.has('PAN_CARD');
    }
    default:
      return false;
  }
};

const getMissingMandatorySections = (data: any): string[] => {
  if (!data) {
    return MANDATORY_SECTIONS.map(s => s.name);
  }
  return MANDATORY_SECTIONS.filter(s => !isStepComplete(data, s.index)).map(s => s.name);
};

const areAllMandatorySectionsComplete = (data: any): boolean => {
  if (!data) return false;
  return MANDATORY_SECTIONS.every(s => isStepComplete(data, s.index));
};

function LayoutSkeleton() {
  return (
    <div className='relative min-h-screen flex flex-col overflow-x-hidden bg-[#eef2f9]'>
      {/* Background image with soft opacity veil */}
      <div className='fixed inset-0 z-0' aria-hidden='true'>
        <div
          className='absolute inset-0 bg-cover bg-center'
          style={{
            backgroundImage: 'url(/backgroundIMGALMS.jpeg)',
            backgroundRepeat: 'no-repeat',
          }}
        />
        <div className='absolute inset-0 bg-white/70' />
      </div>

      {/* Indian National Tricolor Apex Ribbon with Active Flag Loader Runner */}
      <div className='fixed top-0 inset-x-0 h-[3px] z-50 pointer-events-none overflow-hidden bg-slate-200/50'>
        <div className='absolute inset-0 flex opacity-40'>
          <div className='w-1/3 bg-[#FF9933]' />
          <div className='w-1/3 bg-[#FFFFFF]' />
          <div className='w-1/3 bg-[#138808]' />
        </div>
        <div className='absolute inset-0 flag-runner-bar' />
      </div>

      <div
        className='relative z-10 flex-1 flex flex-col items-center w-full px-4 sm:px-6 lg:px-8'
        style={{ paddingTop: 20, paddingBottom: 48 }}
      >
        {/* Title Badge with Navy Blue & Gold styling */}
        <div className='w-full flex items-center justify-center mt-3 mb-2'>
          <div className='inline-flex items-center gap-2.5 px-6 py-1.5 rounded-full bg-[#0B1F3A] text-white shadow-md border border-[#1D3C68]'>
            <span className='w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse' />
            <span className='text-xs sm:text-sm font-black tracking-widest uppercase text-white'>
              FRESH APPLICATION FORM
            </span>
          </div>
        </div>

        {/* Step Navigation Bar Skeleton */}
        <div className='w-full max-w-7xl xl:max-w-[1700px] 2xl:max-w-[1900px] rounded-2xl shadow-lg px-3 py-2 bg-[#0B1F3A] border-2 border-[#15325B] mb-4 flex items-center gap-3 overflow-x-auto'>
          <div className='h-8 w-8 rounded-full bg-white/20 shrink-0' />
          <div className='flex items-center gap-4 flex-1 justify-center min-w-[700px]'>
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className='flex flex-col items-center gap-1'>
                <div className={`h-6 w-6 rounded-full ${i === 0 ? 'bg-[#D4AF37]' : 'bg-white/20'}`} />
                <div className='h-2 w-14 rounded bg-white/25' />
              </div>
            ))}
          </div>
        </div>

        {/* Form Card Skeleton */}
        <div className='rounded-2xl bg-white border border-slate-200/80 shadow-xl w-full max-w-7xl xl:max-w-[1700px] 2xl:max-w-[1900px] p-6 sm:p-8 space-y-6'>
          <div className='flex items-center justify-between pb-4 border-b border-slate-100'>
            <div className='flex items-center gap-3'>
              <div className='h-10 w-10 rounded-xl flag-skeleton-shimmer' />
              <div className='h-5 w-48 rounded-md flag-skeleton-shimmer' />
            </div>
            <div className='h-6 w-24 rounded-full flag-skeleton-shimmer' />
          </div>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className='space-y-2'>
                <div className='h-3.5 w-28 rounded flag-skeleton-shimmer' />
                <div className='h-10 w-full rounded-xl flag-skeleton-shimmer' />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function FreshApplicationLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [allowedToEdit, setAllowedToEdit] = useState<boolean | null>(null);
  const [applicationData, setApplicationData] = useState<any>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [lockedSteps, setLockedSteps] = useState<Set<number>>(new Set());
  const isNavigatingRef = useRef(false);

  // Get active step name from URL
  const activeStepSlug = (pathname || '').split('/').pop() || '';
  const currentStep = React.useMemo(() => {
    if (!activeStepSlug) return 0;
    if (activeStepSlug === 'preview') return 8;
    if (activeStepSlug === 'declaration') return 9;
    const idx = steps.findIndex(s => stepToSlug(s) === activeStepSlug);
    return idx >= 0 ? idx : 0;
  }, [activeStepSlug]);

  const applicantId =
    searchParams?.get('id') ||
    searchParams?.get('applicationId') ||
    searchParams?.get('applicantId') ||
    null;

  // Reset isNavigatingRef when path changes
  useEffect(() => {
    isNavigatingRef.current = false;
  }, [pathname]);

  const getLockedSteps = (data: any, hasAppId: boolean): Set<number> => {
    const unlocked = new Set<number>();
    unlocked.add(0);

    if (data) {
      let allPreviousComplete = true;
      for (let i = 0; i < 8; i++) {
        if (allPreviousComplete && isStepComplete(data, i)) {
          unlocked.add(i + 1);
        } else {
          allPreviousComplete = false;
        }
      }

      // Preview (index 8) and Declaration (index 9) unlock ONLY when all 8 mandatory sections are complete
      if (allPreviousComplete) {
        unlocked.add(8);
        unlocked.add(9);
      }
    } else if (hasAppId) {
      unlocked.add(1);
    }

    const locked = new Set<number>();
    for (let i = 0; i < steps.length; i++) {
      if (!unlocked.has(i)) locked.add(i);
    }
    return locked;
  };

  useEffect(() => {
    const checkEditable = async () => {
      if (!applicantId) {
        if (currentStep >= 8) {
          router.replace('/forms/createFreshApplication/personal-information');
          setValidationError('Please complete all mandatory sections before accessing Preview or Declaration & Submit.');
        }
        setAllowedToEdit(true);
        return;
      }
      try {
        const resp = await ApplicationService.getApplication(applicantId as string);
        const data = resp?.data || null;
        setApplicationData(data);
        const code = data?.workflowStatus?.code || data?.status?.code || null;
        if (String(code).toUpperCase() === 'DRAFT') {
          setAllowedToEdit(true);
          if (currentStep >= 8) {
            const missing = getMissingMandatorySections(data);
            if (missing.length > 0) {
              const firstIncompleteIdx = MANDATORY_SECTIONS.find(s => !isStepComplete(data, s.index))?.index ?? 0;
              const targetSlug = stepToSlug(steps[firstIncompleteIdx]);
              const currentParams = new URLSearchParams(searchParams ? searchParams.toString() : '');
              const qs = currentParams.toString();
              router.replace(`/forms/createFreshApplication/${targetSlug}${qs ? `?${qs}` : ''}`);
              setValidationError(
                `Please complete the following mandatory sections before accessing ${steps[currentStep]}:\n• ${missing.join('\n• ')}`
              );
            }
          }
        } else {
          setAllowedToEdit(false);
          router.push('/');
        }
      } catch {
        setAllowedToEdit(true);
      }
    };
    checkEditable();
  }, [applicantId, router, pathname, currentStep, searchParams]);

  useEffect(() => {
    if (allowedToEdit) {
      setLockedSteps(getLockedSteps(applicationData, !!applicantId));
    }
  }, [applicationData, allowedToEdit, applicantId]);

  const handleStepClick = async (idx: number) => {
    if (isNavigatingRef.current) return;

    const previewIndex = steps.findIndex(s => s.toLowerCase().includes('preview'));
    const declarationIndex = steps.findIndex(s => s.toLowerCase().includes('declaration'));

    isNavigatingRef.current = true;

    const currentParams = new URLSearchParams(searchParams ? searchParams.toString() : '');
    const pushWithParams = (path: string) => {
      const qs = currentParams.toString();
      if (qs) router.push(`${path}?${qs}`);
      else router.push(path);
    };

    if (idx === previewIndex || idx === declarationIndex) {
      if (applicantId) {
        try {
          const resp = await ApplicationService.getApplication(applicantId as string);
          const latestData = resp?.data || null;
          setApplicationData(latestData);

          const missingFields = getMissingMandatorySections(latestData);

          if (missingFields.length > 0) {
            setValidationError(
              `Please complete the following mandatory sections before proceeding to ${steps[idx]}:\n• ${missingFields.join('\n• ')}`
            );
            isNavigatingRef.current = false;
            return;
          }
        } catch {
          setValidationError('Failed to validate application data. Please try again.');
          isNavigatingRef.current = false;
          return;
        }
      } else {
        setValidationError(`Please complete all mandatory sections before proceeding to ${steps[idx]}.`);
        isNavigatingRef.current = false;
        return;
      }
      setValidationError(null);
    } else if (lockedSteps.has(idx)) {
      isNavigatingRef.current = false;
      return;
    }

    if (idx === previewIndex) {
      pushWithParams('/forms/createFreshApplication/preview');
    } else if (idx === declarationIndex) {
      pushWithParams('/forms/createFreshApplication/declaration');
    } else {
      pushWithParams(`/forms/createFreshApplication/${stepToSlug(steps[idx])}`);
    }
  };

  const handleGoHome = () => {
    router.push('/inbox?type=all');
  };

  if (allowedToEdit === null) {
    return <LayoutSkeleton />;
  }

  return (
    <div className='relative min-h-screen flex flex-col overflow-x-hidden bg-[#eef2f9]'>
      {/* Background image with soft opacity veil so the form card stays readable on any screen/zoom */}
      <div className='fixed inset-0 z-0' aria-hidden='true'>
        <div
          className='absolute inset-0 bg-cover bg-center'
          style={{
            backgroundImage: 'url(/backgroundIMGALMS.jpeg)',
            backgroundRepeat: 'no-repeat',
          }}
        />
        <div className='absolute inset-0 bg-white/70' />
      </div>

      <style>{`
        @keyframes fadeInSlide {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-step-transition {
          animation: fadeInSlide 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>

      <StepHeader
        steps={steps}
        currentStep={currentStep}
        onStepClick={handleStepClick}
        lockedSteps={lockedSteps}
        onGoHome={handleGoHome}
      />

      <div
        className='relative z-10 flex-1 flex w-full justify-center px-4 sm:px-6 lg:px-8'
        style={{
          paddingTop: 24,
          paddingBottom: 48,
        }}
      >
        <div
          className='rounded-2xl bg-white border border-slate-200/80 shadow-xl w-full max-w-7xl xl:max-w-[1700px] 2xl:max-w-[1900px] flex flex-col p-0 animate-step-transition overflow-hidden'
          key={pathname || ''}
        >
          {currentStep >= 8 && (!applicationData || !areAllMandatorySectionsComplete(applicationData)) ? (
            <LayoutSkeleton />
          ) : (
            children
          )}
        </div>
      </div>

      {/* Validation Error Modal */}
      <WarningAlertModal
        isOpen={Boolean(validationError)}
        title='Incomplete Application'
        subtitle='Please complete all required steps'
        alertMessage={validationError}
        description='You must complete all the required sections before proceeding to the Preview or Declaration & Submit step.'
        onBackdropClick={() => setValidationError(null)}
        actions={
          <button
            type='button'
            onClick={() => setValidationError(null)}
            className='px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors'
          >
            OK, I&apos;ll complete them
          </button>
        }
      />
    </div>
  );
}

export default function FreshApplicationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<LayoutSkeleton />}>
      <FreshApplicationLayoutContent>{children}</FreshApplicationLayoutContent>
    </Suspense>
  );
}
