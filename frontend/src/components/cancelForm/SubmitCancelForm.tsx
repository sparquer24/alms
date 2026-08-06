'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import CancelService from '@/api/cancelService';
import { ApplicationService } from '@/api/applicationService';
import MantraSDKService from '@/services/mantraSDKService';
import toast from 'react-hot-toast';
import { useLayout } from '../../config/layoutContext';

// Full-screen background + centered card shell used by every pre-verification
// gate screen, matching the License Renewal Verification page's design
// exactly (same background image, gradient overlay, card sizing/shadow).
function VerificationShell({
  children,
  showBackButton,
}: {
  children: React.ReactNode;
  showBackButton?: boolean;
}) {
  return (
    // Fixed, not just min-h-screen: this renders inside /cancelForm/new's
    // padded page shell (with its own "Back to Listings" bar), which isn't
    // present on the Renewal page. Pinning to the viewport lets the card sit
    // centered in the true viewport — matching Renewal exactly — regardless
    // of the parent page's layout.
    <div
      className="fixed inset-0 z-40 flex flex-col bg-cover bg-center bg-fixed overflow-auto bg-[url('/backgroundIMGALMS.jpeg')]"
      role='main'
    >
      <div
        className='absolute inset-0 bg-gradient-to-br from-black/40 via-black/30 to-black/50 backdrop-blur-[2px]'
        aria-hidden='true'
      />
      {showBackButton && (
        <button
          type='button'
          onClick={() => window.history.back()}
          className='absolute top-6 left-6 z-20 inline-flex items-center gap-2 text-sm font-medium text-white/90 hover:text-white bg-black/20 hover:bg-black/30 backdrop-blur-sm px-4 py-2 rounded-md transition-colors'
        >
          <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M10 19l-7-7m0 0l7-7m0 7h18' />
          </svg>
          Go Back
        </button>
      )}
      <div className='relative flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 z-10'>
        <div className='max-w-md w-full space-y-6 bg-white/90 p-10 rounded-lg shadow-xl backdrop-blur-sm border border-white/40 transition-all duration-300'>
          {children}
        </div>
      </div>
    </div>
  );
}

export default function SubmitCancelForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlLicenseId = searchParams?.get('licenseId') || '';

  const [loading, setLoading] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [verificationChecking, setVerificationChecking] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<'ENTER_APP_ID' | 'VERIFYING_BIOMETRICS' | 'VERIFIED' | 'FAILED'>('ENTER_APP_ID');
  const [verificationError, setVerificationError] = useState<string | null>(null);

  const [applicantDetails, setApplicantDetails] = useState<{
    name: string;
    licenseNumber: string;
    licenseId: string;
  } | null>(null);
  const [biometricTargetThumb, setBiometricTargetThumb] = useState<string | null>(null);
  const [enrolledTemplates, setEnrolledTemplates] = useState<any[]>([]);

  // Mantra fingerprint capture states
  const [mantraSDKReady, setMantraSDKReady] = useState(false);
  const [deviceConnected, setDeviceConnected] = useState(false);
  const [deviceChecking, setDeviceChecking] = useState(false);
  const [fingerprintCapturing, setFingerprintCapturing] = useState(false);
  const [showFingerprintPreviewModal, setShowFingerprintPreviewModal] = useState(false);
  const [pendingCaptureResult, setPendingCaptureResult] = useState<any | null>(null);
  const [fingerprintPreviewImage, setFingerprintPreviewImage] = useState<string | null>(null);
  const [capturingStep, setCapturingStep] = useState<string>('');

  const [formData, setFormData] = useState({
    licenseId: urlLicenseId,
    applicationType: 'FreshApplication',
    cancellationReason: '',
    remarks: ''
  });

  // Hide the persistent app header for the entire cancellation flow — every
  // screen here (License ID entry, biometric step, "not allowed", and the
  // actual cancellation form) uses its own full-width background takeover
  // with no navbar, matching the Renewal flow.
  const { setShowHeader } = useLayout();
  useEffect(() => {
    setShowHeader(false);
    return () => setShowHeader(true);
  }, [setShowHeader]);

  useEffect(() => {
    if (urlLicenseId) {
      setFormData(prev => ({ ...prev, licenseId: urlLicenseId }));
      checkBiometricRequirement(urlLicenseId);
    } else {
      setVerificationStatus('ENTER_APP_ID');
    }
  }, [urlLicenseId]);

  const checkDeviceConnection = async () => {
    try {
      setDeviceChecking(true);
      const initialized = await MantraSDKService.initialize();
      setMantraSDKReady(initialized);
      if (initialized) {
        const status = await MantraSDKService.isDeviceConnected();
        setDeviceConnected(status.isConnected);
      } else {
        setDeviceConnected(false);
      }
    } catch {
      setDeviceConnected(false);
    } finally {
      setDeviceChecking(false);
    }
  };

  const getLicenseNumber = (data: any): string => {
    if (!data) return '';
    return (
      data.licenseNumber ||
      data.almsLicenseId ||
      data.licenseId ||
      data.previousLicenseNumber ||
      data.licenseHistories?.[0]?.previousLicenseNumber ||
      data.licenseHistory?.[0]?.previousLicenseNumber ||
      data.previousApplicationDetails?.previousLicenseNumber ||
      'Pending'
    );
  };

  const checkBiometricRequirement = async (licenseIdentifier: string) => {
    try {
      setVerificationChecking(true);
      setVerificationError(null);

      const response = await ApplicationService.getLicense(licenseIdentifier);
      const freshData = response?.data ?? response;
      if (!freshData) {
        throw new Error('No license data found for the provided License ID or License Number.');
      }

      // Check if the license has been CANCELLED
      if (freshData.status === 'CANCELLED') {
        setVerificationError(
          'This license has already been cancelled.',
        );
        setVerificationStatus('FAILED');
        setVerificationChecking(false);
        return;
      }

      // Check if a cancellation request already exists in PENDING state
      try {
        const pendingResponse = await CancelService.getCancelRequests({
          licenseId: Number(freshData.licenseId || freshData.id || licenseIdentifier),
          status: 'PENDING',
        });
        const pendingData = pendingResponse?.data || [];
        if (Array.isArray(pendingData) && pendingData.length > 0) {
          setVerificationError(
            'A cancellation request for this license already exists and is pending approval.',
          );
          setVerificationStatus('FAILED');
          setVerificationChecking(false);
          return;
        }
      } catch {
        // If the check fails, continue anyway (backend will validate)
      }

      const numericLicenseId = String(freshData.licenseId || freshData.id || licenseIdentifier);
      const bioData = freshData.biometricData?.biometricData || freshData.biometricData || null;
      const fingerprints = bioData?.fingerprints || [];

      const userThumbprints = fingerprints
        .filter((f: any) => f.position === 'RIGHT_THUMB' || f.position === 'LEFT_THUMB')
        .map((f: any) => ({
          template: f.template,
          fingerPosition: f.position,
          licenseId: numericLicenseId
        }));

      const name = [
        freshData.firstName,
        freshData.middleName,
        freshData.lastName
      ].filter(Boolean).join(' ') || freshData.applicantName || 'Applicant';

      const details = {
        name,
        licenseNumber: getLicenseNumber(freshData),
        licenseId: numericLicenseId
      };
      setApplicantDetails(details);
      setFormData(prev => ({ ...prev, licenseId: numericLicenseId }));

      if (userThumbprints.length > 0) {
        setEnrolledTemplates(userThumbprints);
        const target = userThumbprints[0].fingerPosition;
        setBiometricTargetThumb(target);
        setVerificationStatus('VERIFYING_BIOMETRICS');
        checkDeviceConnection();
      } else {
        setIsVerified(true);
        setVerificationStatus('VERIFIED');
      }
    } catch (err: any) {
      setVerificationError(err?.message || 'Failed to fetch license details.');
      setVerificationStatus('ENTER_APP_ID');
    } finally {
      setVerificationChecking(false);
    }
  };

  const handleVerifyBiometrics = async () => {
    try {
      setFingerprintCapturing(true);
      setVerificationError(null);

      const status = await MantraSDKService.isDeviceConnected();
      if (!status.isConnected) {
        setVerificationError('Fingerprint device is not connected. Please connect the device and try again.');
        setDeviceConnected(false);
        setFingerprintCapturing(false);
        return;
      }

      setCapturingStep('Place your thumb on the scanner...');
      const captureResult = await MantraSDKService.captureFinger(60, 10000);
      if (!captureResult.success) {
        setVerificationError(`Fingerprint capture failed: ${captureResult.errorMessage}`);
        setFingerprintCapturing(false);
        return;
      }

      setCapturingStep('Processing fingerprint...');
      try {
        let previewImage: string | null = captureResult.bitmapData || null;
        if (!previewImage) {
          previewImage = await MantraSDKService.getImage('0');
        }
        setPendingCaptureResult(captureResult);
        if (previewImage) {
          setFingerprintPreviewImage(`data:image/bmp;base64,${previewImage}`);
        } else {
          setFingerprintPreviewImage(null);
        }
        setShowFingerprintPreviewModal(true);
      } catch (imageError) {
        setPendingCaptureResult(captureResult);
        setFingerprintPreviewImage(null);
        setShowFingerprintPreviewModal(true);
      }
    } catch (err: any) {
      setVerificationError(err?.message || 'Biometric verification failed.');
    } finally {
      setFingerprintCapturing(false);
      setCapturingStep('');
    }
  };

  const handleAcceptFingerprintPreview = async () => {
    if (!pendingCaptureResult) {
      setVerificationError('Invalid capture data');
      return;
    }

    try {
      setFingerprintCapturing(true);
      setVerificationChecking(true);

      let matchFound = false;
      const liveTemplate = pendingCaptureResult.template;

      for (const storedFp of enrolledTemplates) {
        try {
          const matchResult = await MantraSDKService.verifyTemplate(storedFp.template, liveTemplate, 65);
          if (matchResult.isMatch || matchResult.score >= 65) {
            matchFound = true;
            break;
          }
        } catch (matchErr) {
          console.warn('[Mantra verifyTemplate] Match failed', matchErr);
        }
      }

      setShowFingerprintPreviewModal(false);
      setFingerprintPreviewImage(null);
      setPendingCaptureResult(null);

      if (matchFound) {
        toast.success('Biometric verification successful!');
        setIsVerified(true);
        setVerificationStatus('VERIFIED');
      } else {
        setVerificationError('Verification failed: Scanned fingerprint does not match. Please try again.');
      }
    } catch (error: any) {
      setVerificationError(error.message || 'Verification check failed.');
    } finally {
      setFingerprintCapturing(false);
      setVerificationChecking(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.licenseId || !formData.cancellationReason) {
      toast.error('Please provide the license target ID and reason');
      return;
    }

    // Guard: prevent double-submission if user clicks Submit twice rapidly
    if (loading) return;

    try {
      setLoading(true);
      const payload = {
        licenseId: Number(formData.licenseId),
        applicationType: 'Cancel Application', // Always matching request payload format "Cancel Application"
        applicantName: applicantDetails?.name || '',
        cancellationReason: formData.cancellationReason,
        remarks: formData.remarks
      };

      await CancelService.createCancelRequest(payload);
      toast.success('Cancellation request submitted successfully');
      router.push('/inbox');
    } catch (error: any) {
      console.error('Submit failed', error);
      toast.error(error?.message || 'Failed to submit cancellation request');
    } finally {
      setLoading(false);
    }
  };

  if (verificationChecking && verificationStatus === 'ENTER_APP_ID') {
    return (
      <VerificationShell>
        <div className='space-y-6 py-8 text-center'>
          <div className='mx-auto w-12 h-12 border-4 border-[#001F54] border-t-transparent rounded-full animate-spin flex items-center justify-center'>
            <span className='text-xl'>🪪</span>
          </div>
          <h3 className='text-lg font-bold text-gray-900'>Loading License Details...</h3>
          <p className='text-sm text-gray-500'>Fetching application details</p>
        </div>
      </VerificationShell>
    );
  }

  if (verificationStatus === 'ENTER_APP_ID') {
    return (
      <VerificationShell showBackButton>
        <div className='space-y-6'>
          <div className='text-center'>
            <div className='mb-6 flex justify-center'>
              <img
                src='/icon-alms.svg'
                alt='ALMS Logo'
                width={100}
                height={100}
                className='drop-shadow-md h-auto'
              />
            </div>
            <h2 className='text-2xl font-bold tracking-tight text-gray-900'>
              License Cancellation Verification
            </h2>
            <p className='mt-2 text-sm text-gray-600'>
              Please enter your License ID or License Number to verify your identity and start
              the cancellation process.
            </p>
          </div>

          {verificationError && (
            <div className='rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700'>
              {verificationError}
            </div>
          )}

          <div className='space-y-4'>
            <div>
              <label
                htmlFor='cancel-license-id'
                className='block text-sm font-semibold text-gray-700 mb-1'
              >
                License ID or License Number
              </label>
              <input
                id='cancel-license-id'
                type='text'
                value={formData.licenseId}
                onChange={e => setFormData(prev => ({ ...prev, licenseId: e.target.value }))}
                placeholder='e.g. 12 or LUAN20260703132128000625'
                className='w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37] bg-white text-gray-900 font-semibold'
              />
            </div>

            <button
              onClick={() => checkBiometricRequirement(formData.licenseId)}
              disabled={verificationChecking || !formData.licenseId.trim()}
              className='w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-md text-sm font-semibold text-gray-900 bg-[#D4AF37] hover:bg-[#C4A02F] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#D4AF37] disabled:opacity-60 disabled:cursor-not-allowed transition-all hover:scale-[1.01]'
            >
              {verificationChecking ? 'Checking...' : 'Verify / Continue'}
            </button>
          </div>
        </div>
      </VerificationShell>
    );
  }

  if (verificationStatus === 'VERIFYING_BIOMETRICS') {
    return (
      <div className='max-w-2xl mx-auto w-full bg-white rounded-lg shadow-sm border border-gray-200 p-8 space-y-6'>
        <div className='text-center border-b border-gray-200 pb-4'>
          <h2 className='text-2xl font-bold text-gray-900'>Biometric Verification Required</h2>
          <p className='text-sm text-gray-500 mt-1'>Verify that you are the original applicant.</p>
        </div>

        {applicantDetails && (
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 font-medium">Applicant Name</span>
              <span className="text-gray-800 font-semibold">{applicantDetails.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 font-medium">License ID</span>
              <span className="text-gray-800 font-semibold">{applicantDetails.licenseId}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 font-medium">License Number</span>
              <span className="text-gray-800 font-semibold">{applicantDetails.licenseNumber}</span>
            </div>
          </div>
        )}

        {verificationError && (
          <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {verificationError}
          </div>
        )}

        <div className='p-6 rounded-xl border border-gray-200 bg-white shadow-sm space-y-4'>
          <div>
            <label className='block text-sm font-semibold text-gray-700 mb-1'>Required Hand & Finger</label>
            <select
              value={biometricTargetThumb || 'RIGHT_THUMB'}
              disabled
              className='w-full p-2.5 border border-gray-300 rounded-md shadow-sm bg-gray-100 cursor-not-allowed text-gray-700 font-semibold'
            >
              <option value="RIGHT_THUMB">Right Hand Thumb</option>
              <option value="LEFT_THUMB">Left Hand Thumb</option>
            </select>
            <p className="text-sm text-blue-600 mt-1 font-medium">
              Please scan your enrolled {biometricTargetThumb === 'LEFT_THUMB' ? 'Left hand thumb print' : 'Right hand thumb print'} from the fresh application.
            </p>
          </div>

          {mantraSDKReady && deviceConnected ? (
            <div className='flex items-center space-x-3'>
              <button
                type='button'
                onClick={handleVerifyBiometrics}
                disabled={fingerprintCapturing}
                className='px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-md font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-md'
              >
                <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.2-2.858.571-4.177' />
                </svg>
                {fingerprintCapturing ? 'Scanning...' : 'Scan Fingerprint'}
              </button>
              <span className='text-sm text-green-600 font-medium'>✓ Device Ready</span>
            </div>
          ) : (
            <div className='flex items-center space-x-3'>
              <button
                type='button'
                onClick={() => checkDeviceConnection()}
                className='px-5 py-2.5 bg-gray-300 text-gray-600 rounded-md font-semibold flex items-center gap-2'
              >
                Retry Device Check
              </button>
              <span className='text-sm text-gray-500 font-medium'>
                {!mantraSDKReady ? 'Mantra SDK not initialized' : 'Device not connected'}
              </span>
            </div>
          )}
        </div>

        {showFingerprintPreviewModal && pendingCaptureResult && (
          <div className='fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] p-4'>
            <div className='bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-gray-200 text-center space-y-4'>
              <h3 className='text-lg font-bold text-gray-900'>Fingerprint Preview</h3>
              <p className='text-sm text-gray-500'>Quality: {pendingCaptureResult.quality}%</p>
              {fingerprintPreviewImage && (
                <div className='flex justify-center border border-gray-200 p-4 rounded bg-gray-50'>
                  <img src={fingerprintPreviewImage} alt="Fingerprint Preview" className='max-h-60' />
                </div>
              )}
              <div className='flex justify-end gap-3'>
                <button
                  onClick={() => {
                    setShowFingerprintPreviewModal(false);
                    setPendingCaptureResult(null);
                  }}
                  className='px-4 py-2 border border-gray-300 rounded text-sm text-gray-700'
                >
                  Cancel
                </button>
                <button
                  onClick={handleAcceptFingerprintPreview}
                  className='px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm font-semibold'
                >
                  Accept & Verify
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (verificationStatus === 'FAILED') {
    return (
      <VerificationShell>
        <div className='text-center space-y-5'>
          <div className='relative mx-auto w-20 h-20'>
            <div className='absolute inset-0 rounded-full bg-red-400 animate-ping opacity-20' aria-hidden='true' />
            <div className='relative inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-100 ring-8 ring-red-50'>
              <svg className='w-9 h-9 text-red-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
              </svg>
            </div>
          </div>

          <div>
            <h2 className='text-2xl font-bold tracking-tight text-gray-900'>Cancellation Not Allowed</h2>
            <p className='mt-1.5 text-sm text-gray-500'>
              We couldn&apos;t start a new cancellation request for this license.
            </p>
          </div>

          <div className='rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700 text-left'>
            {verificationError || 'This license has already been cancelled.'}
          </div>

          <button
            type='button'
            onClick={() => {
              setVerificationStatus('ENTER_APP_ID');
              setVerificationError(null);
              setFormData(prev => ({ ...prev, licenseId: '' }));
            }}
            className='w-full flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-md shadow-md text-sm font-semibold text-gray-900 bg-[#D4AF37] hover:bg-[#C4A02F] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#D4AF37] transition-all hover:scale-[1.01]'
          >
            <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M10 19l-7-7m0 0l7-7m0 7h18' />
            </svg>
            Try Another License
          </button>
        </div>
      </VerificationShell>
    );
  }

  // VERIFIED: Render SubmitCancelForm — same full-viewport background
  // takeover as the verification gate screens (fixed, not just min-h-screen,
  // so it spans the true viewport edge-to-edge regardless of this page's
  // padded parent container).
  return (
    <div
      className="fixed inset-0 z-40 flex items-start justify-center bg-cover bg-center bg-fixed overflow-auto bg-[url('/backgroundIMGALMS.jpeg')] py-10 px-4"
    >
      <div
        className='absolute inset-0 bg-gradient-to-br from-black/40 via-black/30 to-black/50 backdrop-blur-[2px]'
        aria-hidden='true'
      />
      <div className='relative z-10 max-w-2xl w-full my-auto'>
      <div className='bg-white/90 backdrop-blur-sm rounded-lg shadow-xl border border-white/40 p-8'>
        <div className='mb-6 pb-5 border-b border-gray-200 flex items-start gap-4'>
          <div className='flex-shrink-0 w-11 h-11 rounded-full bg-red-50 ring-4 ring-red-50/60 flex items-center justify-center'>
            <svg className='w-5 h-5 text-red-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 3v2m6-2v2M4 7h16M5 7v12a2 2 0 002 2h10a2 2 0 002-2V7M9 12h6' />
            </svg>
          </div>
          <div>
            <h2 className='text-2xl font-bold tracking-tight text-gray-900'>Initiate License Cancellation</h2>
            <p className='text-sm text-gray-500 mt-1'>Submit a request to permanently cancel an existing approved license application.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className='space-y-6'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 rounded-xl p-4 border border-slate-200'>
            <div className='space-y-1.5'>
               <label htmlFor='licenseId' className='block text-sm font-semibold text-gray-700'>
                 Target License ID
               </label>
               <input
                 type='text'
                 id='licenseId'
                 name='licenseId'
                 value={formData.licenseId}
                 disabled
                 className='w-full px-4 py-2.5 border border-gray-200 rounded-md bg-white cursor-not-allowed text-gray-800 font-semibold shadow-sm'
               />
               <p className='text-xs text-gray-500 flex items-center gap-1'>
                 <svg className='w-3.5 h-3.5 text-emerald-500 flex-shrink-0' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                   <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
                 </svg>
                 Verified target ID of the license.
               </p>
            </div>

            <div className='space-y-1.5'>
               <label htmlFor='applicationType' className='block text-sm font-semibold text-gray-700'>
                 Application Type
               </label>
               <input
                 type='text'
                 id='applicationType'
                 name='applicationType'
                 value="Cancel Application"
                 disabled
                 className='w-full px-4 py-2.5 border border-gray-200 rounded-md bg-white cursor-not-allowed text-gray-800 font-semibold shadow-sm'
               />
            </div>
          </div>

          <div className='space-y-1.5'>
            <label htmlFor='cancellationReason' className='block text-sm font-semibold text-gray-700'>
              Reason for Cancellation <span className='text-red-500'>*</span>
            </label>
            <input
              type='text'
              id='cancellationReason'
              name='cancellationReason'
              value={formData.cancellationReason}
              onChange={handleChange}
              required
              className='w-full px-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500/40 focus:border-red-500 transition-colors'
              placeholder='E.g., Voluntary surrender by applicant'
            />
          </div>

          <div className='space-y-1.5'>
            <label htmlFor='remarks' className='block text-sm font-semibold text-gray-700'>
              Additional Remarks
            </label>
            <textarea
              id='remarks'
              name='remarks'
              value={formData.remarks}
              onChange={handleChange}
              rows={4}
              className='w-full px-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500/40 focus:border-red-500 resize-none transition-colors'
              placeholder='Provide any additional context or details for this request (optional)'
            />
          </div>

          <div className='pt-5 flex justify-end gap-3 border-t border-gray-100'>
            <button
              type='button'
              onClick={() => router.back()}
              className='px-6 py-2.5 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-semibold transition-colors'
            >
              Cancel
            </button>
            <button
              type='submit'
              disabled={loading}
              className='px-6 py-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-md font-semibold shadow-md flex items-center transition-all hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100'
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Submitting
                </>
              ) : (
                <>
                  <svg className='w-4 h-4 mr-2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
                  </svg>
                  Submit Request
                </>
              )}
            </button>
          </div>
        </form>
      </div>
      </div>
    </div>
  );
}
