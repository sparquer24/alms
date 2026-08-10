'use client';
import React, { useState, useEffect, useRef, Suspense } from 'react';
import { IoMdHome } from 'react-icons/io';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { ApplicationService } from '../../../api/applicationService';
import { StepHeader } from '../../../components/forms/elements/StepHeader';

const IoMdHomeFixed = IoMdHome as any;

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

function LayoutSkeleton() {
  return (
    <div className='relative min-h-screen overflow-x-hidden bg-[#eef2f9]'>
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
      <div
        className='relative z-10 flex justify-center w-full px-4 sm:px-6 lg:px-8'
        style={{ paddingTop: 100, paddingBottom: 48 }}
      >
        <div className='rounded-2xl bg-white border border-blue-100 shadow-xl w-full max-w-7xl 2xl:max-w-[1600px] p-6 animate-pulse'>
          <div className='h-3 w-40 bg-gray-200 rounded mx-auto mb-8'></div>
          <div className='space-y-4'>
            <div className='h-8 bg-gray-200 rounded w-full'></div>
            <div className='h-32 bg-gray-200 rounded w-full'></div>
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

  const getLockedSteps = (data: any, currentIdx: number, hasAppId: boolean): Set<number> => {
    const unlocked = new Set<number>();
    unlocked.add(0);

    if (data) {
      if (data.firstName) unlocked.add(1);
      if (data.presentAddress || data.addresses?.length > 0) unlocked.add(2);
      if (data.occupationAndBusiness) unlocked.add(3);
      if (data.criminalHistories?.length > 0) unlocked.add(4);
      if (data.licenseHistories?.length > 0) unlocked.add(5);
      if (data.licenseDetails?.length > 0) unlocked.add(6);
      const hasBiometric = data.biometricData?.biometricData?.fingerprints?.length > 0
        || data.biometricData?.fingerprints?.length > 0
        || data.fileUploads?.some((f: any) => f.fileType === 'PHOTOGRAPH');
      if (hasBiometric) unlocked.add(7);
      // Preview step (index 8) is always unlocked so users can preview their application at any time
      unlocked.add(8);
    } else if (hasAppId) {
      unlocked.add(1);
    }

    unlocked.add(currentIdx);

    const locked = new Set<number>();
    for (let i = 0; i < steps.length; i++) {
      if (!unlocked.has(i)) locked.add(i);
    }
    return locked;
  };

  useEffect(() => {
    const checkEditable = async () => {
      if (!applicantId) {
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
        } else {
          setAllowedToEdit(false);
          router.push('/');
        }
      } catch (err) {
        setAllowedToEdit(true);
      }
    };
    checkEditable();
  }, [applicantId, router, pathname]);

  useEffect(() => {
    if (allowedToEdit) {
      setLockedSteps(getLockedSteps(applicationData, currentStep, !!applicantId));
    }
  }, [applicationData, allowedToEdit, currentStep, applicantId]);

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

    if (idx === declarationIndex) {
      if (applicantId) {
        try {
          const resp = await ApplicationService.getApplication(applicantId as string);
          const latestData = resp?.data || null;
          setApplicationData(latestData);

          const missingFields: string[] = [];
          if (!latestData) {
            setValidationError('Application data not loaded. Please complete all steps first.');
            isNavigatingRef.current = false;
            return;
          }

          if (!latestData.presentAddress) missingFields.push('Present Address');
          if (!latestData.permanentAddress) missingFields.push('Permanent Address');
          if (!latestData.occupationAndBusiness) missingFields.push('Occupation/Business Information');

          const biometricData = latestData.biometricData?.biometricData || latestData.biometricData;
          const hasFingerprints = biometricData?.fingerprints && Array.isArray(biometricData.fingerprints) && biometricData.fingerprints.length > 0;
          const hasPhoto = latestData.fileUploads?.some((f: any) => f.fileType === 'PHOTOGRAPH');
          if (!hasFingerprints && !hasPhoto) {
            missingFields.push('Biometric Information (Photograph or Fingerprint)');
          }

          const uploadedFilesCount = latestData.fileUploads?.length || 0;
          if (!latestData.fileUploads || !Array.isArray(latestData.fileUploads) || uploadedFilesCount < 3) {
            const remaining = 3 - uploadedFilesCount;
            missingFields.push(`Document Uploads (Need ${remaining} more document${remaining > 1 ? 's' : ''}, minimum 3 required)`);
          }

          if (missingFields.length > 0) {
            setValidationError(`Please complete the following before submitting:\n• ${missingFields.join('\n• ')}`);
            isNavigatingRef.current = false;
            return;
          }
        } catch (err) {
          setValidationError('Failed to validate application data. Please try again.');
          isNavigatingRef.current = false;
          return;
        }
      } else {
        setValidationError('Please create and save an application first.');
        isNavigatingRef.current = false;
        return;
      }
      setValidationError(null);
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
    <div className='relative min-h-screen overflow-x-hidden bg-[#eef2f9]'>
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
        className='flex max-w-8xl px-4 justify-center items-start sm:px-8'
        className='relative z-10 flex w-full justify-center px-4 sm:px-6 lg:px-8'
        style={{
          paddingTop: 24,
          paddingBottom: 48,
        }}
      >
        <div
          className='rounded-2xl bg-white border border-blue-100 shadow-xl w-full max-w-7xl 2xl:max-w-[1600px] flex flex-col p-0 animate-step-transition'
          key={pathname || ''}
        >
          {children}
        </div>
      </div>

      {/* Validation Error Modal */}
      {validationError && (
        <div
          className='fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] p-4'
          onClick={() => setValidationError(null)}
        >
          <div
            className='bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden'
            onClick={e => e.stopPropagation()}
          >
            <div className='bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-5'>
              <div className='flex items-center gap-4'>
                <div className='bg-white/20 rounded-full p-3'>
                  <svg className='w-8 h-8 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' />
                  </svg>
                </div>
                <div>
                  <h2 className='text-xl font-bold text-white'>Incomplete Application</h2>
                  <p className='text-amber-100 text-sm mt-1'>Please complete all required steps</p>
                </div>
              </div>
            </div>
            <div className='px-6 py-6'>
              <div className='bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4'>
                <div className='whitespace-pre-line text-amber-800 text-sm'>{validationError}</div>
              </div>
              <p className='text-gray-600 text-sm'>
                You must complete all the required sections before proceeding to the Declaration & Submit step.
              </p>
            </div>
            <div className='border-t border-gray-200 px-6 py-4 bg-gray-50 flex justify-end'>
              <button
                type='button'
                onClick={() => setValidationError(null)}
                className='px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors'
              >
                OK, I'll complete them
              </button>
            </div>
          </div>
        </div>
      )}
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
