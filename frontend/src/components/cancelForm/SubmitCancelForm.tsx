'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import CancelService from '@/api/cancelService';
import { ApplicationService } from '@/api/applicationService';
import MantraSDKService from '@/services/mantraSDKService';
import toast from 'react-hot-toast';
import {
  User, Hash, Users, VenusAndMars, Calendar, CreditCard, Fingerprint, ShieldCheck,
  FileText, AlertTriangle, UploadCloud, CheckCircle2, Info, Ban,
  Bold, Italic, Underline, List, ListOrdered, Link2, Send, MessageSquare, X,
} from 'lucide-react';

const fmtDate = (value?: string | null): string => {
  if (!value) return 'N/A';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return 'N/A';
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

// Compact labeled row used in the License Details sidebar card.
function SummaryRow({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: React.ReactNode }) {
  return (
    <div className='flex items-start gap-3 py-2.5 first:pt-0 last:pb-0 rounded-lg -mx-2 px-2 hover:bg-[#0F2D52]/5 transition-colors duration-200'>
      <div className='flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-[#0F2D52]/5 to-[#0F2D52]/10 flex items-center justify-center mt-0.5'>
        <Icon className='w-3.5 h-3.5 text-[#0F2D52]' />
      </div>
      <div className='min-w-0'>
        <p className='text-[10px] font-semibold text-gray-400 uppercase tracking-wide'>{label}</p>
        <p className='text-sm font-semibold text-gray-900 truncate'>{value}</p>
      </div>
    </div>
  );
}

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
  // Full license/application record fetched for the target license ID —
  // used to render the License Details panel on the cancellation form.
  const [licenseDetails, setLicenseDetails] = useState<any>(null);
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

  // Supporting document uploads (PDF only)
  const [attachmentFiles, setAttachmentFiles] = useState<File[]>([]);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const MAX_ATTACHMENTS = 10;
  const MAX_ATTACHMENT_SIZE = 5 * 1024 * 1024; // 5MB

  const onAttachmentSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setAttachmentError(null);

    const valid: File[] = [];
    for (const f of files) {
      const isPdf = f.type === 'application/pdf';
      const isImage = f.type.startsWith('image/');
      if (!isPdf && !isImage) {
        setAttachmentError('Only PDF or image files are allowed.');
        e.target.value = '';
        return;
      }
      if (f.size > MAX_ATTACHMENT_SIZE) {
        setAttachmentError('File too large (max 5MB).');
        e.target.value = '';
        return;
      }
      valid.push(f);
    }

    const merged = [...attachmentFiles, ...valid];
    if (merged.length > MAX_ATTACHMENTS) {
      setAttachmentError(`You can only attach up to ${MAX_ATTACHMENTS} files.`);
      e.target.value = '';
      return;
    }

    const names = merged.map(f => f.name);
    if (new Set(names).size !== names.length) {
      setAttachmentError('Duplicate file names are not allowed.');
      e.target.value = '';
      return;
    }

    setAttachmentFiles(merged);
    e.target.value = '';
  };

  const removeAttachment = (index: number) => {
    setAttachmentFiles(prev => prev.filter((_, i) => i !== index));
    setAttachmentError(null);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Lightweight markdown toolbox for the Additional Remarks field
  const remarksRef = useRef<HTMLTextAreaElement | null>(null);

  const wrapRemarksSelection = (before: string, after: string = before) => {
    const ta = remarksRef.current;
    if (!ta) return;
    const start = ta.selectionStart ?? 0;
    const end = ta.selectionEnd ?? 0;
    const val = formData.remarks || '';
    const selected = val.slice(start, end);
    const newVal = val.slice(0, start) + before + selected + after + val.slice(end);
    setFormData(prev => ({ ...prev, remarks: newVal }));
    requestAnimationFrame(() => {
      const pos = start + before.length + selected.length + after.length;
      ta.focus();
      ta.setSelectionRange(pos, pos);
    });
  };

  const insertRemarksListItem = () => {
    const ta = remarksRef.current;
    if (!ta) return;
    const start = ta.selectionStart ?? 0;
    const val = formData.remarks || '';
    const needsNewline = start > 0 && val[start - 1] !== '\n';
    const insertion = `${needsNewline ? '\n' : ''}- `;
    const newVal = val.slice(0, start) + insertion + val.slice(start);
    setFormData(prev => ({ ...prev, remarks: newVal }));
    requestAnimationFrame(() => {
      const pos = start + insertion.length;
      ta.focus();
      ta.setSelectionRange(pos, pos);
    });
  };

  const insertRemarksNumberedItem = () => {
    const ta = remarksRef.current;
    if (!ta) return;
    const start = ta.selectionStart ?? 0;
    const val = formData.remarks || '';
    const needsNewline = start > 0 && val[start - 1] !== '\n';
    const insertion = `${needsNewline ? '\n' : ''}1. `;
    const newVal = val.slice(0, start) + insertion + val.slice(start);
    setFormData(prev => ({ ...prev, remarks: newVal }));
    requestAnimationFrame(() => {
      const pos = start + insertion.length;
      ta.focus();
      ta.setSelectionRange(pos, pos);
    });
  };

  const insertRemarksLink = () => {
    const ta = remarksRef.current;
    if (!ta) return;
    const url = window.prompt('Enter URL');
    if (!url) return;
    const start = ta.selectionStart ?? 0;
    const end = ta.selectionEnd ?? 0;
    const val = formData.remarks || '';
    const selected = val.slice(start, end) || 'link text';
    const insertion = `[${selected}](${url})`;
    const newVal = val.slice(0, start) + insertion + val.slice(end);
    setFormData(prev => ({ ...prev, remarks: newVal }));
    requestAnimationFrame(() => {
      const pos = start + insertion.length;
      ta.focus();
      ta.setSelectionRange(pos, pos);
    });
  };

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
      setLicenseDetails(freshData);
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
          <div className='mx-auto w-12 h-12 border-4 border-[#0F2D52] border-t-transparent rounded-full animate-spin flex items-center justify-center'>
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
            <div className='rounded-md border border-[#0F2D52]/20 bg-[#0F2D52]/5 p-4 text-sm text-[#0F2D52]'>
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
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-cover bg-center bg-fixed overflow-auto bg-[url('/backgroundIMGALMS.jpeg')] py-10 px-4">
        <div
          className='absolute inset-0 bg-gradient-to-br from-black/40 via-black/30 to-black/50 backdrop-blur-[2px]'
          aria-hidden='true'
        />
        <div className='relative z-10 max-w-2xl w-full bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/50 overflow-hidden'>
          <div className='h-1.5 bg-[#0F2D52]' />
          <div className='p-8 space-y-6'>
            <div className='text-center pb-5 border-b border-gray-200'>
              <div className='mx-auto mb-3 w-12 h-12 rounded-full bg-[#0F2D52]/5 ring-4 ring-[#0F2D52]/10 shadow-sm flex items-center justify-center'>
                <Fingerprint className='w-6 h-6 text-[#0F2D52]' />
              </div>
              <h2 className='text-2xl font-bold tracking-tight text-gray-900'>Biometric Verification Required</h2>
              <p className='text-sm text-gray-500 mt-1'>Verify that you are the original applicant.</p>
            </div>

            {applicantDetails && (
              <div className='grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 rounded-xl p-4 border border-slate-200'>
                <div className='flex items-start gap-1.5'>
                  <User className='w-3.5 h-3.5 text-[#0F2D52] mt-0.5 flex-shrink-0' />
                  <div>
                    <p className='text-[10px] font-semibold text-gray-500 uppercase tracking-wide'>Applicant Name</p>
                    <p className='text-sm font-semibold text-gray-900'>{applicantDetails.name}</p>
                  </div>
                </div>
                <div className='flex items-start gap-1.5'>
                  <Hash className='w-3.5 h-3.5 text-[#0F2D52] mt-0.5 flex-shrink-0' />
                  <div>
                    <p className='text-[10px] font-semibold text-gray-500 uppercase tracking-wide'>License ID</p>
                    <p className='text-sm font-semibold text-gray-900'>{applicantDetails.licenseId}</p>
                  </div>
                </div>
                <div className='flex items-start gap-1.5'>
                  <ShieldCheck className='w-3.5 h-3.5 text-[#0F2D52] mt-0.5 flex-shrink-0' />
                  <div>
                    <p className='text-[10px] font-semibold text-gray-500 uppercase tracking-wide'>License Number</p>
                    <p className='text-sm font-semibold text-gray-900'>{applicantDetails.licenseNumber}</p>
                  </div>
                </div>
              </div>
            )}

            {verificationError && (
              <div className='rounded-md border border-[#0F2D52]/20 bg-[#0F2D52]/5 p-4 text-sm text-[#0F2D52]'>
                {verificationError}
              </div>
            )}

            <div className='p-6 rounded-xl border border-gray-200 bg-slate-50 space-y-4'>
              <div>
                <label className='block text-sm font-semibold text-gray-700 mb-1'>Required Hand & Finger</label>
                <select
                  value={biometricTargetThumb || 'RIGHT_THUMB'}
                  disabled
                  className='w-full p-2.5 border border-gray-300 rounded-md shadow-sm bg-white cursor-not-allowed text-gray-700 font-semibold'
                >
                  <option value="RIGHT_THUMB">Right Hand Thumb</option>
                  <option value="LEFT_THUMB">Left Hand Thumb</option>
                </select>
                <p className="text-sm text-[#0F2D52] mt-1 font-medium">
                  Please scan your enrolled {biometricTargetThumb === 'LEFT_THUMB' ? 'Left hand thumb print' : 'Right hand thumb print'} from the fresh application.
                </p>
              </div>

              {mantraSDKReady && deviceConnected ? (
                <div className='flex items-center space-x-3'>
                  <button
                    type='button'
                    onClick={handleVerifyBiometrics}
                    disabled={fingerprintCapturing}
                    className='px-5 py-2.5 bg-[#0F2D52] hover:bg-[#0B2340] text-white rounded-md font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-md hover:scale-[1.02]'
                  >
                    <Fingerprint className='w-5 h-5' />
                    {fingerprintCapturing ? 'Scanning...' : 'Scan Fingerprint'}
                  </button>
                  <span className='text-sm text-emerald-600 font-medium flex items-center gap-1.5'>
                    <span className='w-2 h-2 rounded-full bg-emerald-500' />
                    Device Ready
                  </span>
                </div>
              ) : (
                <div className='flex items-center space-x-3'>
                  <button
                    type='button'
                    onClick={() => checkDeviceConnection()}
                    className='px-5 py-2.5 bg-gray-200 text-gray-600 hover:bg-gray-300 rounded-md font-semibold flex items-center gap-2 transition-colors'
                  >
                    Retry Device Check
                  </button>
                  <span className='text-sm text-gray-500 font-medium'>
                    {!mantraSDKReady ? 'Mantra SDK not initialized' : 'Device not connected'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {showFingerprintPreviewModal && pendingCaptureResult && (
          <div className='fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] p-4'>
            <div className='bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-white/50 text-center space-y-4'>
              <h3 className='text-lg font-bold text-gray-900'>Fingerprint Preview</h3>
              <p className='text-sm text-gray-500'>Quality: {pendingCaptureResult.quality}%</p>
              {fingerprintPreviewImage && (
                <div className='flex justify-center border border-gray-200 p-4 rounded-lg bg-slate-50'>
                  <img src={fingerprintPreviewImage} alt="Fingerprint Preview" className='max-h-60' />
                </div>
              )}
              <div className='flex justify-end gap-3'>
                <button
                  onClick={() => {
                    setShowFingerprintPreviewModal(false);
                    setPendingCaptureResult(null);
                  }}
                  className='px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50 transition-colors'
                >
                  Cancel
                </button>
                <button
                  onClick={handleAcceptFingerprintPreview}
                  className='px-4 py-2 bg-[#0F2D52] hover:bg-[#0B2340] text-white rounded-md text-sm font-semibold shadow-md transition-all'
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
            <div className='absolute inset-0 rounded-full bg-[#0F2D52]/30 animate-ping opacity-20' aria-hidden='true' />
            <div className='relative inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#0F2D52]/5 ring-8 ring-[#0F2D52]/10'>
              <svg className='w-9 h-9 text-[#0F2D52]' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
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

          <div className='rounded-md border border-[#0F2D52]/20 bg-[#0F2D52]/5 p-4 text-sm text-[#0F2D52] text-left'>
            {verificationError || 'This license has already been cancelled.'}
          </div>

          <button
            type='button'
            onClick={() => router.push('/licenses?tab=all')}
            className='w-full flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-md shadow-md text-sm font-semibold text-white bg-[#0F2D52] hover:bg-[#0B2340] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0F2D52] transition-all hover:scale-[1.01]'
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

  // VERIFIED: Premium enterprise government dashboard UI for the License
  // Cancellation Request — a floating License Details sidebar (left) and
  // the cancellation form (right) on a flat light-gray dashboard canvas.
  return (
    <div className="fixed inset-0 z-40 flex items-start justify-center overflow-auto bg-[#F6F8FC] py-10 px-4">
      <div className='relative z-10 w-full max-w-7xl my-auto flex flex-col lg:flex-row gap-6'>

        {/* LEFT SIDEBAR (320px) — stretches to match the height of the right content card */}
        <aside className='w-full lg:w-80 flex-shrink-0 flex flex-col'>
          {licenseDetails && (
            <div className='h-full flex flex-col bg-white rounded-[18px] shadow-[0_8px_30px_rgba(0,0,0,0.06)] border border-gray-100 overflow-hidden hover:shadow-[0_12px_40px_rgba(0,0,0,0.09)] transition-shadow duration-300'>
              <div className='h-1.5 bg-[#0F2D52]' />
              <div className='flex-1 flex flex-col p-5'>
                <div className='flex items-center gap-2.5 mb-1 pb-4 border-b border-gray-100'>
                  <div className='flex-shrink-0 w-9 h-9 rounded-xl bg-[#0F2D52] flex items-center justify-center shadow-sm shadow-[#0F2D52]/30'>
                    <ShieldCheck className='w-4 h-4 text-white' />
                  </div>
                  <div>
                    <h3 className='text-base font-bold text-gray-900'>License Details</h3>
                    <p className='text-[11px] text-gray-400'>Verified applicant record</p>
                  </div>
                </div>

                <div className='flex-1 flex flex-col justify-center divide-y divide-gray-100'>
                  <SummaryRow icon={User} label='Applicant Name' value={applicantDetails?.name || 'N/A'} />
                  <SummaryRow icon={Hash} label='License Number' value={applicantDetails?.licenseNumber || 'N/A'} />
                  <SummaryRow icon={Users} label='Father / Spouse Name' value={licenseDetails.parentOrSpouseName || 'N/A'} />
                  <SummaryRow icon={VenusAndMars} label='Gender' value={licenseDetails.sex || 'N/A'} />
                  <SummaryRow icon={Calendar} label='Date of Birth' value={fmtDate(licenseDetails.dateOfBirth)} />
                  <SummaryRow icon={CreditCard} label='PAN Number' value={licenseDetails.panNumber || 'N/A'} />
                  <SummaryRow icon={Fingerprint} label='Aadhar Number' value={licenseDetails.aadharNumber || 'N/A'} />
                  <SummaryRow icon={ShieldCheck} label='Arms Category' value={licenseDetails.licenseDetails?.[0]?.armsCategory || 'N/A'} />
                </div>

                <div className='flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-100 px-3 py-2.5 mt-4'>
                  <CheckCircle2 className='w-4 h-4 text-emerald-600 flex-shrink-0' />
                  <p className='text-[11px] font-semibold text-emerald-700'>Identity verified for this cancellation request</p>
                </div>
              </div>
            </div>
          )}
        </aside>

        {/* RIGHT CONTENT */}
        <div className='flex-1 w-full bg-white rounded-[18px] shadow-[0_8px_30px_rgba(0,0,0,0.06)] border border-gray-100 overflow-hidden'>
          <div className='p-3'>
            {/* Header */}
            <div className='flex items-start justify-between gap-4  border-b border-gray-100'>
              <div className='flex items-center gap-4'>
                <div className='flex-shrink-0 w-14 h-14 rounded-2xl bg-[#0F2D52] shadow-md shadow-[#0F2D52]/30 flex items-center justify-center'>
                  <Ban className='w-7 h-7 text-white' />
                </div>
                <div>
                  <h2 className='text-2xl font-bold tracking-tight text-gray-900'>Initiate License Cancellation</h2>
                  <p className='text-sm text-gray-500 mt-1'>Submit a request to permanently cancel an approved license.</p>
                </div>
              </div>

              {/* Decorative illustration */}
              <div className='relative hidden sm:block flex-shrink-0 w-20 h-16' aria-hidden='true'>
                <div className='absolute left-0 top-2 w-14 h-16 bg-[#0F2D52]/5 rounded-lg border border-[#0F2D52]/15 -rotate-6' />
                <div className='absolute left-3 top-0 w-14 h-16 bg-white rounded-lg border border-gray-200 shadow-sm flex flex-col gap-1.5 p-2.5'>
                  <div className='h-1.5 w-8 rounded-full bg-[#0F2D52]/20' />
                  <div className='h-1.5 w-10 rounded-full bg-gray-200' />
                  <div className='h-1.5 w-6 rounded-full bg-gray-200' />
                </div>
                <div className='absolute -right-1 -bottom-1 w-6 h-6 rounded-full bg-red-500 border-2 border-white flex items-center justify-center shadow-sm'>
                  <X className='w-3 h-3 text-white' strokeWidth={3} />
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className='space-y-6'>
              {/* Section 1: Summary */}
              <div className='bg-[#0F2D52]/5 rounded-2xl p-5 border border-[#0F2D52]/15'>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div className='bg-white rounded-xl p-4 border border-gray-100 flex items-center gap-3 shadow-sm'>
                    <div className='flex-shrink-0 w-10 h-10 rounded-lg bg-[#0F2D52]/5 flex items-center justify-center'>
                      <ShieldCheck className='w-5 h-5 text-[#0F2D52]' />
                    </div>
                    <div className='min-w-0'>
                      <p className='text-xs font-semibold text-gray-500'>Target License ID</p>
                      <p className='text-base font-bold text-gray-900 truncate'>{formData.licenseId}</p>
                    </div>
                  </div>
                  <div className='bg-white rounded-xl p-4 border border-gray-100 flex items-center gap-3 shadow-sm'>
                    <div className='flex-shrink-0 w-10 h-10 rounded-lg bg-[#0F2D52]/5 flex items-center justify-center'>
                      <FileText className='w-5 h-5 text-[#0F2D52]' />
                    </div>
                    <div className='min-w-0'>
                      <p className='text-xs font-semibold text-gray-500'>Application Type</p>
                      <p className='text-base font-bold text-gray-900 truncate'>Cancel Application</p>
                    </div>
                  </div>
                </div>
                <p className='mt-3 text-xs text-emerald-700 font-semibold flex items-center gap-1.5'>
                  <CheckCircle2 className='w-3.5 h-3.5 flex-shrink-0' />
                  Verified target ID of the license.
                </p>
              </div>

              {/* Section 2 + 3: Reason & Additional Remarks (left, stacked) vs. Supporting Documents (right, stretches to match) */}
              <div className='grid grid-cols-1 md:grid-cols-2 gap-5'>
                <div className='space-y-5'>
                  <div className='space-y-1.5'>
                    <label htmlFor='cancellationReason' className='block text-sm font-semibold text-gray-700'>
                      Reason for Cancellation <span className='text-[#0F2D52]'>*</span>
                    </label>
                    <div className='relative'>
                      <MessageSquare className='pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400' />
                      <input
                        type='text'
                        id='cancellationReason'
                        name='cancellationReason'
                        value={formData.cancellationReason}
                        onChange={handleChange}
                        required
                        className='w-full pl-10 pr-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-[#0F2D52]/15 focus:border-[#0F2D52] transition-all'
                        placeholder='E.g., Voluntary surrender by applicant'
                      />
                    </div>
                  </div>

                  <div className='space-y-1.5'>
                    <label htmlFor='remarks' className='block text-sm font-semibold text-gray-700'>
                      Additional Remarks
                    </label>
                    <div className='rounded-xl border border-gray-200 focus-within:ring-4 focus-within:ring-[#0F2D52]/15 focus-within:border-[#0F2D52] transition-all overflow-hidden'>
                      <div className='flex flex-wrap items-center gap-0.5 bg-slate-50 border-b border-gray-200 px-2 py-1.5'>
                        <button type='button' onClick={() => wrapRemarksSelection('**')} className='p-1.5 rounded-md text-gray-500 hover:bg-white hover:text-[#0F2D52] hover:shadow-sm transition-colors' title='Bold'>
                          <Bold className='w-3.5 h-3.5' />
                        </button>
                        <button type='button' onClick={() => wrapRemarksSelection('*')} className='p-1.5 rounded-md text-gray-500 hover:bg-white hover:text-[#0F2D52] hover:shadow-sm transition-colors' title='Italic'>
                          <Italic className='w-3.5 h-3.5' />
                        </button>
                        <button type='button' onClick={() => wrapRemarksSelection('__')} className='p-1.5 rounded-md text-gray-500 hover:bg-white hover:text-[#0F2D52] hover:shadow-sm transition-colors' title='Underline'>
                          <Underline className='w-3.5 h-3.5' />
                        </button>
                        <div className='w-px h-4 bg-gray-300 mx-1' />
                        <button type='button' onClick={insertRemarksListItem} className='p-1.5 rounded-md text-gray-500 hover:bg-white hover:text-[#0F2D52] hover:shadow-sm transition-colors' title='Bullet list'>
                          <List className='w-3.5 h-3.5' />
                        </button>
                        <button type='button' onClick={insertRemarksNumberedItem} className='p-1.5 rounded-md text-gray-500 hover:bg-white hover:text-[#0F2D52] hover:shadow-sm transition-colors' title='Numbered list'>
                          <ListOrdered className='w-3.5 h-3.5' />
                        </button>
                        <button type='button' onClick={insertRemarksLink} className='p-1.5 rounded-md text-gray-500 hover:bg-white hover:text-[#0F2D52] hover:shadow-sm transition-colors' title='Link'>
                          <Link2 className='w-3.5 h-3.5' />
                        </button>
                      </div>
                      <textarea
                        ref={remarksRef}
                        id='remarks'
                        name='remarks'
                        value={formData.remarks}
                        onChange={handleChange}
                        rows={5}
                        className='w-full px-4 py-3 border-0 focus:outline-none focus:ring-0 resize-none transition-colors'
                        placeholder='Provide additional details...'
                      />
                    </div>
                    <p className='text-xs text-gray-400'>
                      Tip: Use <span className='font-mono bg-gray-100 px-1 rounded'>**bold**</span> for quick formatting.
                    </p>
                  </div>
                </div>

                <div className='space-y-1.5 flex flex-col'>
                  <label className='block text-sm font-semibold text-gray-700'>
                    Supporting Documents <span className='text-gray-400 font-normal'>(optional)</span>
                  </label>
                  <div className='relative rounded-xl border-2 border-dashed border-gray-200 bg-slate-50/60 hover:border-[#0F2D52]/50 hover:bg-[#0F2D52]/5 transition-all duration-300 p-4 text-center group'>
                    <input
                      id='cancelAttachments'
                      type='file'
                      accept='application/pdf,image/*'
                      multiple
                      onChange={onAttachmentSelect}
                      className='absolute inset-0 opacity-0 cursor-pointer'
                    />
                    <div className='flex flex-col items-center gap-1.5 pointer-events-none'>
                      <div className='w-10 h-10 rounded-full bg-[#0F2D52]/5 group-hover:bg-[#0F2D52]/10 flex items-center justify-center transition-all duration-300 group-hover:-translate-y-0.5'>
                        <UploadCloud className='w-5 h-5 text-[#0F2D52]' />
                      </div>
                      <p className='text-sm font-semibold text-[#0F2D52]'>Choose PDF or Image</p>
                      <p className='text-[11px] text-gray-500'>Drag & Drop or Browse Files</p>
                      <p className='text-[11px] text-gray-400'>Max 10 files, 5MB each — PDF, JPG, PNG</p>
                    </div>
                  </div>

                  {attachmentError && (
                    <p className='text-xs text-[#0F2D52] flex items-center gap-1'>
                      <AlertTriangle className='w-3.5 h-3.5 flex-shrink-0' />
                      {attachmentError}
                    </p>
                  )}

                  {attachmentFiles.length > 0 && (
                    <ul className='space-y-1.5 flex-1 overflow-y-auto pr-1'>
                      {attachmentFiles.map((file, idx) => (
                        <li
                          key={`${file.name}-${idx}`}
                          className='flex items-center gap-2 bg-white border border-gray-100 rounded-lg px-3 py-2 shadow-sm'
                        >
                          <FileText className='w-4 h-4 text-[#0F2D52] flex-shrink-0' />
                          <span className='flex-1 min-w-0 truncate text-xs text-gray-800' title={file.name}>
                            {file.name}
                          </span>
                          <span className='text-[10px] text-gray-400 flex-shrink-0'>{formatFileSize(file.size)}</span>
                          <button
                            type='button'
                            onClick={() => removeAttachment(idx)}
                            className='flex-shrink-0 text-gray-400 hover:text-[#0F2D52] transition-colors'
                            aria-label={`Remove ${file.name}`}
                          >
                            <X className='w-3.5 h-3.5' />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {/* Section 4: Info alert */}
              <div className='flex items-start gap-3 bg-[#0F2D52]/5 border border-[#0F2D52]/15 rounded-2xl p-4'>
                <Info className='w-5 h-5 text-[#0F2D52] flex-shrink-0 mt-0.5' />
                <p className='text-xs text-[#0F2D52] leading-relaxed'>
                  Your request will be reviewed before approval. Please verify all details before submission.
                </p>
              </div>

              {/* Bottom actions */}
              <div className='flex justify-end gap-3 pt-2'>
                <button
                  type='button'
                  onClick={() => router.back()}
                  className='px-6 py-3 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 font-semibold transition-colors flex items-center gap-2'
                >
                  <X className='w-4 h-4' />
                  Cancel
                </button>
                <button
                  type='submit'
                  disabled={loading}
                  className='px-6 py-3 bg-[#0F2D52] hover:bg-[#0B2340] text-white rounded-xl font-semibold shadow-lg shadow-[#0F2D52]/25 flex items-center gap-2 transition-all hover:scale-[1.02] hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100'
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Submitting
                    </>
                  ) : (
                    <>
                      <Send className='w-4 h-4' />
                      Submit Request
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
