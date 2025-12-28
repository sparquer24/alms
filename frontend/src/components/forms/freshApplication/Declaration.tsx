'use client';
import React, { useState } from 'react';
import { Checkbox } from '../elements/Checkbox';
import { Frown } from 'lucide-react';

// Type assertion for lucide-react icons to fix React 18 compatibility
const FrownFixed = Frown as any;
import FormFooter from '../elements/footer';
import { ApplicationService } from '../../../api/applicationService';
import { useSearchParams, useRouter } from 'next/navigation';
import { patchData } from '../../../api/axiosConfig';
import { FORM_ROUTES } from '../../../config/formRoutes';
import SuccessModal from '../../modals/SuccessModal';

const initialState = {
  declareTrue: false,
  declareFalseInfo: false,
  declareTerms: false,
};

const Declaration = () => {
  const router = useRouter();
  const [form, setForm] = useState(initialState);
  const [almsLicenseId, setAlmsLicenseId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const searchParams = useSearchParams();
  const applicantId = searchParams?.get('applicantId') || searchParams?.get('id');

  // Load license id for display (if available)
  React.useEffect(() => {
    const loadLicense = async () => {
      if (!applicantId) return;
      try {
        const resp = await ApplicationService.getApplication(applicantId);
        const data = resp?.data || resp;
        const licenseId = data?.almsLicenseId ?? data?.alms_license_id ?? data?.licenseId ?? null;
        if (licenseId) setAlmsLicenseId(licenseId);
      } catch (err) {
        // ignore
      }
    };
    loadLicense();
  }, [applicantId]);

  // Debug logging
  const handleCheck = (name: string, checked: boolean) => {
    setForm(prev => ({ ...prev, [name]: checked }));
    // Clear error when user interacts
    if (error) setError(null);
  };

  const validateForm = (): boolean => {
    if (!form.declareTrue) {
      setError('Please confirm that you declare the information to be true and correct.');
      return false;
    }
    if (!form.declareFalseInfo) {
      setError('Please confirm that you are aware of legal consequences.');
      return false;
    }
    if (!form.declareTerms) {
      setError('Please agree to the terms and conditions.');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    if (!applicantId) {
      setError('Application ID not found. Please complete previous steps first.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const payload = {
        isDeclarationAccepted: form.declareTrue,
        isAwareOfLegalConsequences: form.declareFalseInfo,
        isTermsAccepted: form.declareTerms,
      };
      const response = await patchData(
        `/application-form?applicationId=${applicantId}&isSubmit=true`,
        payload
      );
      setShowSuccessModal(true);
    } catch (err: any) {
      const errorMsg = err?.message || 'Failed to submit application. Please try again.';
      setError(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrevious = () => {
    // Navigate to Preview step
    if (applicantId) {
      router.push(`${FORM_ROUTES.PREVIEW}?id=${applicantId}`);
    } else {
      router.back();
    }
  };

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
  };

  const handleNavigateHome = () => {
    setShowSuccessModal(false);
    router.push('/inbox?type=freshform'); // Navigate to dashboard or home page
  };

  return (
    <div className='p-4 bg-white'>
      {/* <div className=""> */}
      <div className='max-w-6xl mx-auto'>
        <div className='text-center mb-6'>
          <h2 className='text-3xl font-bold mb-2 text-gray-800'>Declaration & Submit</h2>
          <div className='w-24 h-1 bg-blue-600 mx-auto rounded-full mb-4'></div>
        </div>
        <form onSubmit={e => e.preventDefault()} className=''>
          {/* Display Application ID and License ID if available */}
          {(applicantId || almsLicenseId) && (
            <div className='mb-6 p-3 bg-blue-100 border border-blue-400 text-blue-700 rounded text-lg font-semibold max-w-md mx-auto text-center'>
              {/* <div>Application ID: <span className="font-bold">{applicantId ?? '—'}</span></div> */}
              {almsLicenseId && (
                <strong className='text-sm mt-1'>License ID: {almsLicenseId}</strong>
              )}
            </div>
          )}{' '}
          {error && (
            <div className='mb-4 p-4 bg-red-50 border border-red-200 rounded-md max-w-lg mx-auto'>
              <div className='flex items-start'>
                <FrownFixed className='h-5 w-5 text-red-600 mr-2 flex-shrink-0 mt-0.5' />
                <p className='text-sm text-red-800'>{error}</p>
              </div>
            </div>
          )}
          <div className='mb-8 max-w-2xl mx-auto'>
            <div className='bg-white border border-gray-200 rounded-lg shadow-sm p-6'>
              <div className='text-lg font-medium text-gray-900 mb-4 text-center'>
                Please check all boxes to proceed:
              </div>
              <div className='flex flex-col gap-4'>
                <Checkbox
                  label='I hereby declare that the information provided above is true and correct to the best of my knowledge and belief.'
                  name='declareTrue'
                  checked={form.declareTrue}
                  onChange={checked => handleCheck('declareTrue', checked)}
                />
                <Checkbox
                  label='I understand that providing false information may result in legal consequences and rejection of my application.'
                  name='declareFalseInfo'
                  checked={form.declareFalseInfo}
                  onChange={checked => handleCheck('declareFalseInfo', checked)}
                />
                <Checkbox
                  label='I agree to abide by all terms and conditions related to the arms license and will use the weapon responsibly.'
                  name='declareTerms'
                  checked={form.declareTerms}
                  onChange={checked => handleCheck('declareTerms', checked)}
                />
              </div>
            </div>
          </div>
          <FormFooter
            isDeclarationStep
            onSubmit={handleSubmit}
            onPrevious={handlePrevious}
            isLoading={isSubmitting}
          />
        </form>
      </div>
      {/* </div> */}
      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={handleCloseSuccessModal}
        title='Application Submitted Successfully!'
        onNavigateHome={handleNavigateHome}
        autoRedirectSeconds={5}
        hideCloseButton={true}
      />
    </div>
  );
};

export default Declaration;
