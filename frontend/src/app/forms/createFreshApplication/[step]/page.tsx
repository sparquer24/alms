'use client';
import React, { useState, useEffect } from 'react';
import { IoMdHome } from 'react-icons/io';

// Type assertion for react-icons to fix React 18 compatibility
const IoMdHomeFixed = IoMdHome as any;
// freshApplication step components
import PersonalInformation from '../../../../components/forms/freshApplication/PersonalInformation'; // step1
import AddressDetails from '../../../../components/forms/freshApplication/AddressDetails'; // step2
import OccupationBussiness from '../../../../components/forms/freshApplication/OccupationBussiness'; // step3
import LicenseDetails from '../../../../components/forms/freshApplication/LicenseDetails'; // step5
import CriminalHistory from '../../../../components/forms/freshApplication/CriminalHistory'; // step6
import LicenseHistory from '../../../../components/forms/freshApplication/LicenseHistory'; // step7
import BiometricInformation from '../../../../components/forms/freshApplication/BiometricInformation'; // step8 (disabled)
import DocumentsUpload from '../../../../components/forms/freshApplication/DocumentsUpload'; // step9
import Preview from '../../../../components/forms/freshApplication/Preview'; // preview
import Declaration from '../../../../components/forms/freshApplication/Declaration'; // declaration
import { StepHeader } from '../../../../components/forms/elements/StepHeader';
import { ApplicationTypeSelector } from '../../../../components/forms/elements/ApplicationTypeSelector';
import { ApplicationFormProvider, useApplicationFormContext } from '../../../../context/ApplicationFormContext';

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

// Helper to slugify step names for URLs and comparison
const stepToSlug = (name: string) =>
  name
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

import { useRouter, useSearchParams } from 'next/navigation';
import { ApplicationService } from '../../../../api/applicationService';

// Shared skeleton component for loading states — defined outside component to avoid re-creation on every render
function FormStepSkeleton() {
  return (
    <div
      className='relative min-h-screen'
      style={{
        backgroundImage: 'url(/backgroundIMGALMS.jpeg)',
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
      }}
    >
      <div className='flex justify-center' style={{ paddingTop: 100, minHeight: '100vh' }}>
        <div className='rounded-2xl bg-white border border-blue-100 shadow-xl max-w-7xl 2xl:max-w-[1600px] w-full p-6 mx-4'>
          <div className='animate-pulse space-y-8'>
            {/* Step header skeleton */}
            <div className='flex items-center justify-center space-x-4 mb-8'>
              {[...Array(10)].map((_, i) => (
                <div key={i} className='h-3 w-20 bg-gray-200 rounded'></div>
              ))}
            </div>
            {/* Form fields skeleton */}
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              {[...Array(6)].map((_, i) => (
                <div key={i} className='space-y-2'>
                  <div className='h-4 w-32 bg-gray-200 rounded'></div>
                  <div className='h-10 w-full bg-gray-200 rounded-lg'></div>
                </div>
              ))}
            </div>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              {[...Array(4)].map((_, i) => (
                <div key={i} className='space-y-2'>
                  <div className='h-4 w-32 bg-gray-200 rounded'></div>
                  <div className='h-10 w-full bg-gray-200 rounded-lg'></div>
                </div>
              ))}
            </div>
            <div className='flex justify-between pt-6'>
              <div className='h-12 w-24 bg-gray-200 rounded-lg'></div>
              <div className='h-12 w-32 bg-gray-200 rounded-lg'></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FormPageInner({ params }: StepPageProps) {
  const { applicationTypeId, categoryId, setApplicationType, setCategoryId } = useApplicationFormContext();
  return <StepPageInner
    params={params}
    applicationTypeId={applicationTypeId}
    categoryId={categoryId}
    setApplicationType={setApplicationType}
    setCategoryId={setCategoryId}
  />;
}

function StepPage({ params }: StepPageProps) {
  return (
    <ApplicationFormProvider>
      <FormPageInner params={params} />
    </ApplicationFormProvider>
  );
}

interface StepPageInnerProps extends StepPageProps {
  applicationTypeId: number | null;
  categoryId: number | null;
  setApplicationType: (id: number | null, name: string | null) => void;
  setCategoryId: (id: number | null) => void;
}

const StepPageInner: React.FC<StepPageInnerProps> = ({ params, applicationTypeId, categoryId, setApplicationType, setCategoryId }) => {
  const router = useRouter();
  const [step, setStep] = useState<string | null>(null);
  const [allowedToEdit, setAllowedToEdit] = useState<boolean | null>(null);
  const [applicationData, setApplicationData] = useState<any>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const searchParams = useSearchParams();
  const applicantId =
    searchParams?.get('id') ||
    searchParams?.get('applicationId') ||
    searchParams?.get('applicantId') ||
    null;

  // Handle params Promise in useEffect
  useEffect(() => {
    params.then(resolvedParams => {
      setStep(resolvedParams.step);
    });
  }, [params]);

  // Form-level guard: only allow editing when application is in DRAFT state.
  // Also fetch application data for validation
  useEffect(() => {
    const checkEditable = async () => {
      // If no application id present, allow creating a new application
      if (!applicantId) {
        setAllowedToEdit(true);
        return;
      }
      try {
        const resp = await ApplicationService.getApplication(applicantId as string);
        const data = resp?.data || null;
        setApplicationData(data); // Store application data for validation
        const code = data?.workflowStatus?.code || data?.status?.code || null;
        // Normalize code to string and uppercase for comparison
        if (String(code).toUpperCase() === 'DRAFT') {
          setAllowedToEdit(true);
        } else {
          setAllowedToEdit(false);
          // Redirect user back to home page — keep them from editing non-draft apps
          router.push('/');
        }
      } catch (err) {
        // If the GET fails (e.g., 404), allow edit flow to let user create a new one
        setAllowedToEdit(true);
      }
    };
    checkEditable();
    // Intentionally run only when applicantId changes
  }, [applicantId, router]);

  // Show skeleton loading while params are being resolved, checking edit permissions, or navigating between steps
  if (!step || allowedToEdit === null || isNavigating) {
    return <FormStepSkeleton />;
  }

  let StepComponent: React.ComponentType<any> | null = null;
  let currentStep = 0;

  // Find the index of the current step by slug
  // Special handling for preview and declaration which use different slug patterns
  let stepIndex;
  if (step === 'preview') {
    stepIndex = 8; // Preview is at index 7 (adjusted after removing biometric step)
  } else if (step === 'declaration') {
    stepIndex = 9; // Declaration & Submit is at index 8 (adjusted)
  } else {
    stepIndex = steps.findIndex(s => stepToSlug(s) === step);
  }
  currentStep = stepIndex >= 0 ? stepIndex : 0;

  switch (step) {
    case stepToSlug('Personal Information'):
      StepComponent = PersonalInformation;
      break;
    case stepToSlug('Address Details'):
      StepComponent = AddressDetails;
      break;
    case stepToSlug('Occupation/Business'):
      StepComponent = OccupationBussiness;
      break;
    case stepToSlug('Criminal History'):
      StepComponent = CriminalHistory;
      break;
    case stepToSlug('License History'):
      StepComponent = LicenseHistory;
      break;
    case stepToSlug('License Details'):
      StepComponent = LicenseDetails;
      break;
    case stepToSlug('Biometric Information'):
      StepComponent = BiometricInformation;
      break;
    case stepToSlug('Documents Upload'):
      StepComponent = DocumentsUpload;
      break;
    case 'preview':
      StepComponent = Preview;
      break;
    case 'declaration':
      StepComponent = Declaration;
      break;
    default:
      StepComponent = () => <div>Step not implemented: {step}</div>;
  }

  // Handler to change step and update the URL
  const handleStepClick = async (idx: number) => {
    // Guard against rapid double-clicks while navigation is in progress
    if (isNavigating) return;

    // Compute dynamic preview/declaration indices to avoid hardcoding after step removal
    const previewIndex = steps.findIndex(s => s.toLowerCase().includes('preview'));
    const declarationIndex = steps.findIndex(s => s.toLowerCase().includes('declaration'));

    // Show loading skeleton immediately while we process navigation
    setIsNavigating(true);

    // preserve any existing search params (including optional application id) when navigating
    const currentParams = new URLSearchParams(searchParams ? searchParams.toString() : '');
    const pushWithParams = (path: string) => {
      const qs = currentParams.toString();
      if (qs) router.push(`${path}?${qs}`);
      else router.push(path);
    };

    // Validate before navigating to Declaration step
    if (idx === declarationIndex) {
      // Re-fetch latest application data before validation
      if (applicantId) {
        try {
          const resp = await ApplicationService.getApplication(applicantId as string);
          const latestData = resp?.data || null;
          setApplicationData(latestData);

          // Validate required fields
          const missingFields: string[] = [];

          if (!latestData) {
            setValidationError('Application data not loaded. Please complete all steps first.');
            setIsNavigating(false);
            return;
          }

          // Check presentAddress
          if (!latestData.presentAddress) {
            missingFields.push('Present Address');
          }

          // Check permanentAddress
          if (!latestData.permanentAddress) {
            missingFields.push('Permanent Address');
          }

          // Check occupationAndBusiness
          if (!latestData.occupationAndBusiness) {
            missingFields.push('Occupation/Business Information');
          }

          // Check biometricData - check for fingerprints or photo
          const biometricData = latestData.biometricData?.biometricData || latestData.biometricData;
          const hasFingerprints =
            biometricData?.fingerprints &&
            Array.isArray(biometricData.fingerprints) &&
            biometricData.fingerprints.length > 0;
          const hasPhoto = latestData.fileUploads?.some((f: any) => f.fileType === 'PHOTOGRAPH');
          if (!hasFingerprints && !hasPhoto) {
            missingFields.push('Biometric Information (Photograph or Fingerprint)');
          }

          // Check fileUploads - at least 3 documents should be uploaded
          const uploadedFilesCount = latestData.fileUploads?.length || 0;
          if (
            !latestData.fileUploads ||
            !Array.isArray(latestData.fileUploads) ||
            uploadedFilesCount < 3
          ) {
            const remaining = 3 - uploadedFilesCount;
            missingFields.push(
              `Document Uploads (Need ${remaining} more document${remaining > 1 ? 's' : ''}, minimum 3 required)`
            );
          }

          if (missingFields.length > 0) {
            setValidationError(
              `Please complete the following before submitting:\n• ${missingFields.join('\n• ')}`
            );
            setIsNavigating(false);
            return;
          }
        } catch (err) {
          setValidationError('Failed to validate application data. Please try again.');
          setIsNavigating(false);
          return;
        }
      } else {
        setValidationError('Please create and save an application first.');
        setIsNavigating(false);
        return;
      }

      // Clear any previous validation error
      setValidationError(null);
    }

    // Navigate to the selected step — no need to setIsNavigating(false) here
    // because the component will unmount and remount on the new page
    if (idx === previewIndex) {
      pushWithParams('/forms/createFreshApplication/preview');
    } else if (idx === declarationIndex) {
      pushWithParams('/forms/createFreshApplication/declaration');
    } else {
      pushWithParams(`/forms/createFreshApplication/${stepToSlug(steps[idx])}`);
    }
  };

  // Handler for go home button
  const handleGoHome = () => {
    router.push('/inbox?type=drafts');
  };

  // Show home button on all steps
  const showHomeButton = true;

  const isLicenseDetails = step === stepToSlug('License Details');

  return (
    <div
      className='relative min-h-screen'
      style={{
        backgroundImage: 'url(/backgroundIMGALMS.jpeg)',
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
      }}
    >
      {showHomeButton && (
        <div className='fixed top-4 left-6 z-50'>
          <button
            onClick={handleGoHome}
            className='flex items-center justify-center w-12 h-12 bg-white hover:bg-gray-50 rounded-full shadow-lg border-2 border-blue-500 transition-all duration-200 hover:scale-105'
            title='Go to Home'
          >
            <IoMdHomeFixed className='text-2xl text-[#0d2977]' />
          </button>
        </div>
      )}
      <StepHeader steps={steps} currentStep={currentStep} onStepClick={handleStepClick} />
      <div
        className=' flex max-w-8xl px-4  justify-center sm:px-8 '
        style={{
          paddingTop: 100, // match header height (80px)
          minHeight: '100vh',
        }}
      >
        <div
          className='rounded-2xl bg-white border border-blue-100 shadow-xl max-w-7xl 2xl:max-w-[1600px] w-full flex flex-col p-0'
        >
          {/* Application Type & Category Selector at top of form */}
          <div className='px-6 pt-5 pb-2 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-2xl'>
            <ApplicationTypeSelector
              selectedTypeId={applicationTypeId}
              onTypeChange={setApplicationType}
              showCategory={false}
            />
          </div>
          {StepComponent && <StepComponent />}
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
            {/* Header */}
            <div className='bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-5'>
              <div className='flex items-center gap-4'>
                <div className='bg-white/20 rounded-full p-3'>
                  <svg
                    className='w-8 h-8 text-white'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
                    />
                  </svg>
                </div>
                <div>
                  <h2 className='text-xl font-bold text-white'>Incomplete Application</h2>
                  <p className='text-amber-100 text-sm mt-1'>Please complete all required steps</p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className='px-6 py-6'>
              <div className='bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4'>
                <div className='whitespace-pre-line text-amber-800 text-sm'>{validationError}</div>
              </div>

              <p className='text-gray-600 text-sm'>
                You must complete all the required sections before proceeding to the Declaration &
                Submit step.
              </p>
            </div>

            {/* Footer */}
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
};

export default StepPage;
