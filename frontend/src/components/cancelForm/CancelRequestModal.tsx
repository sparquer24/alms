'use client';

import React, { useEffect, useState } from 'react';
import CancelService from '@/api/cancelService';
import { ApplicationService } from '@/api/applicationService';
import MantraSDKService from '@/services/mantraSDKService';
import toast from 'react-hot-toast';
import { X, ExternalLink, Fingerprint, Shield, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';

const LoaderFixed = Loader2 as any;

interface CancelRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  prefillLicenseId?: string;
}

type VerificationStep = 'ENTER_APP_ID' | 'VERIFYING_BIOMETRICS' | 'VERIFIED' | 'FAILED';

export default function CancelRequestModal({
  isOpen,
  onClose,
  onSuccess,
  prefillLicenseId,
}: CancelRequestModalProps) {

  const [loading, setLoading] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [verificationChecking, setVerificationChecking] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<VerificationStep>('ENTER_APP_ID');
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
  const [capturingStep, setCapturingStep] = useState('');

  const [existingCancel, setExistingCancel] = useState<{ id: number; status: string } | null>(null);
  const [checkingExisting, setCheckingExisting] = useState(false);

  const [formData, setFormData] = useState({
    licenseId: prefillLicenseId || '',
    applicationType: 'FreshApplication',
    cancellationReason: '',
    remarks: '',
  });

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        licenseId: prefillLicenseId || '',
        applicationType: 'FreshApplication',
        cancellationReason: '',
        remarks: '',
      });
      setLoading(false);
      setIsVerified(false);
      setVerificationChecking(false);
      setVerificationError(null);
      setApplicantDetails(null);
      setBiometricTargetThumb(null);
      setEnrolledTemplates([]);
      setExistingCancel(null);
      setCheckingExisting(false);
      setFingerprintCapturing(false);
      setShowFingerprintPreviewModal(false);
      setPendingCaptureResult(null);
      setFingerprintPreviewImage(null);
      setCapturingStep('');
      setVerificationStatus('ENTER_APP_ID');
    }
  }, [isOpen, prefillLicenseId]);

  useEffect(() => {
    if (prefillLicenseId && isOpen) {
      checkBiometricRequirement(prefillLicenseId);
    }
  }, [prefillLicenseId, isOpen]);

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

  const checkIfCancelExists = async (licenseId: number): Promise<{ id: number; status: string } | null> => {
    try {
      setCheckingExisting(true);
      // First check for PENDING cancel request
      const pendingResponse = await CancelService.getCancelRequests({
        licenseId,
        status: 'PENDING',
      });
      const pendingData = pendingResponse?.data || [];
      if (Array.isArray(pendingData) && pendingData.length > 0) {
        return { id: pendingData[0].id, status: 'PENDING' };
      }

      // Also check for APPROVED cancel request (application already cancelled)
      const approvedResponse = await CancelService.getCancelRequests({
        licenseId,
        status: 'APPROVED',
      });
      const approvedData = approvedResponse?.data || [];
      if (Array.isArray(approvedData) && approvedData.length > 0) {
        return { id: approvedData[0].id, status: 'APPROVED' };
      }

      return null;
    } catch {
      return null;
    } finally {
      setCheckingExisting(false);
    }
  };

  const checkBiometricRequirement = async (licenseIdentifier: string) => {
    try {
      setVerificationChecking(true);
      setVerificationError(null);

      // First check if a cancel request already exists (pending or approved)
      const existing = await checkIfCancelExists(Number(licenseIdentifier));
      if (existing) {
        setExistingCancel(existing);
        setVerificationStatus('FAILED');
        if (existing.status === 'PENDING') {
          setVerificationError('A pending cancel request already exists for this license.');
        } else if (existing.status === 'APPROVED') {
          setVerificationError('This license has already been cancelled.');
        }
        setVerificationChecking(false);
        return;
      }

      const response = await ApplicationService.getLicense(licenseIdentifier);
      const freshData = response?.data ?? response;
      if (!freshData) {
        throw new Error('No license data found for the provided License ID or License Number.');
      }

      const numericLicenseId = String(freshData.licenseId || freshData.id || licenseIdentifier);
      const bioData = freshData.biometricData?.biometricData || freshData.biometricData || null;
      const fingerprints = bioData?.fingerprints || [];

      const userThumbprints = fingerprints
        .filter((f: any) => f.position === 'RIGHT_THUMB' || f.position === 'LEFT_THUMB')
        .map((f: any) => ({
          template: f.template,
          fingerPosition: f.position,
          licenseId: numericLicenseId,
        }));

      const name =
        [freshData.firstName, freshData.middleName, freshData.lastName]
          .filter(Boolean)
          .join(' ') || freshData.applicantName || 'Applicant';

      const details = {
        name,
        licenseNumber: getLicenseNumber(freshData),
        licenseId: numericLicenseId,
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
      setVerificationError(err?.message || 'Failed to fetch application details.');
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
    setFormData((prev) => ({
      ...prev,
      [name]: value,
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
        applicationType: 'Cancel Application',
        applicantName: applicantDetails?.name || '',
        cancellationReason: formData.cancellationReason,
        remarks: formData.remarks,
      };

      await CancelService.createCancelRequest(payload);
      toast.success('Cancellation request submitted successfully');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Submit failed', error);
      // Handle "pending cancel request already exists" error gracefully
      const message = error?.response?.data?.message || error?.message || 'Failed to submit cancellation request';
      if (message.includes('pending cancel request already exists')) {
        toast.error('A cancellation request has already been submitted for this license. Please process the existing request first.');
        setVerificationStatus('FAILED');
        setVerificationError('A pending cancel request already exists. You cannot create a duplicate.');
        // Try to find the existing request ID for navigation
        const existing = await checkIfCancelExists(Number(formData.licenseId));
        if (existing) {
          setExistingCancel(existing);
        }
      } else if (message.includes('already cancelled') || message.includes('already been cancelled')) {
        toast.error('This license has already been cancelled.');
        setVerificationStatus('FAILED');
        setVerificationError('This license has already been cancelled.');
      } else {
        toast.error(message);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // Render the verification step
  const renderVerificationStep = () => {
    if (verificationChecking && verificationStatus === 'ENTER_APP_ID') {
      return (
        <div className="flex flex-col items-center justify-center min-h-[250px]">
          <LoaderFixed className="w-10 h-10 animate-spin text-alms-navy mb-4" />
          <p className="text-gray-600 font-medium">Fetching application details...</p>
        </div>
      );
    }

    if (verificationStatus === 'FAILED' && existingCancel) {
      const isPending = existingCancel.status === 'PENDING';
      const isApproved = existingCancel.status === 'APPROVED';

      return (
        <div className="space-y-5">
          {isPending && (
            <>
              <div className="bg-red-50 border border-red-200 rounded-xl p-5">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-6 h-6 text-red-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-sm font-semibold text-red-800">Cancel Request Already Exists</h4>
                    <p className="text-sm text-red-700 mt-1">
                      A pending cancellation request (ID: #{existingCancel.id}) already exists for license{' '}
                      <strong>#{formData.licenseId}</strong>. You cannot create a duplicate request.
                    </p>
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                Please process the existing request, or wait for it to be reviewed before creating a new one.
              </p>
            </>
          )}

          {isApproved && (
            <>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <h4 className="text-sm font-semibold text-blue-800">Application Already Cancelled</h4>
                      <p className="text-sm text-blue-700 mt-1">
                        The license <strong>#{formData.licenseId}</strong> has already been cancelled.
                        No further cancellation requests can be raised for this license.
                      </p>
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                This application has been processed and its license has been cancelled. If you need further assistance, please contact the administrator.
              </p>
            </>
          )}

          <div className="flex flex-wrap justify-end gap-3 pt-2">
            <button
              onClick={onClose}
              className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium text-sm transition-colors"
            >
              Close
            </button>
            {isPending && (
              <a
                href={`/cancelForm/${existingCancel.id}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-alms-navy hover:bg-alms-navy-dark text-white rounded-lg font-medium text-sm transition-colors shadow-sm"
              >
                <ExternalLink className="w-4 h-4" />
                View Existing Request
              </a>
            )}
            {(isPending || isApproved) && (
              <a
                href={`/licenses/${formData.licenseId}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium text-sm transition-colors shadow-sm"
              >
                <ExternalLink className="w-4 h-4" />
                View Fresh Details
              </a>
            )}
          </div>
        </div>
      );
    }

    if (verificationStatus === 'FAILED' && !existingCancel) {
      return (
        <div className="space-y-5">
          <div className="bg-red-50 border border-red-200 rounded-xl p-5">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-semibold text-red-800">Verification Failed</h4>
                <p className="text-sm text-red-700 mt-1">{verificationError}</p>
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <button
              onClick={() => {
                setVerificationStatus('ENTER_APP_ID');
                setVerificationError(null);
              }}
              className="px-5 py-2.5 bg-alms-navy hover:bg-alms-navy-dark text-white rounded-lg font-medium text-sm transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    if (verificationStatus === 'ENTER_APP_ID') {
      return (
        <div className="space-y-5">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
            <Shield className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-800">Verification Required</p>
              <p className="text-xs text-amber-700 mt-1">
                Enter the License ID or License Number to look up the applicant and perform verification before creating a cancel request.
              </p>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              License ID / License Number
            </label>
            <input
              type="text"
              placeholder="Enter License ID or License Number"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-alms-navy/20 focus:border-alms-navy outline-none transition-all text-sm"
              value={formData.licenseId}
              onChange={(e) => setFormData((prev) => ({ ...prev, licenseId: e.target.value }))}
            />
          </div>
          {verificationError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-700">{verificationError}</p>
            </div>
          )}
          <button
            onClick={() => checkBiometricRequirement(formData.licenseId)}
            disabled={!formData.licenseId}
            className="w-full px-5 py-2.5 bg-alms-navy hover:bg-alms-navy-dark text-white rounded-lg font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            Check Application
          </button>
        </div>
      );
    }

    if (verificationStatus === 'VERIFYING_BIOMETRICS') {
      return (
        <div className="space-y-5">
          <div className="border-b border-gray-200 pb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Fingerprint className="w-5 h-5 text-alms-navy" />
              Biometric Verification Required
            </h3>
            <p className="text-sm text-gray-500 mt-1">Verify that you are the original applicant.</p>
          </div>

          {applicantDetails && (
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 space-y-2.5">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 font-medium">Applicant Name</span>
                <span className="text-gray-800 font-semibold">{applicantDetails.name}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 font-medium">License ID</span>
                <span className="text-gray-800 font-semibold">{applicantDetails.licenseId}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 font-medium">License Number</span>
                <span className="text-gray-800 font-semibold">{applicantDetails.licenseNumber}</span>
              </div>
            </div>
          )}

          {verificationError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-700">{verificationError}</p>
            </div>
          )}

          <div className="p-5 rounded-xl border border-gray-200 bg-white shadow-sm space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Required Hand & Finger</label>
              <select
                value={biometricTargetThumb || 'RIGHT_THUMB'}
                disabled
                className="w-full p-2.5 border border-gray-300 rounded-lg shadow-sm bg-gray-100 cursor-not-allowed text-gray-700 font-semibold text-sm"
              >
                <option value="RIGHT_THUMB">Right Hand Thumb</option>
                <option value="LEFT_THUMB">Left Hand Thumb</option>
              </select>
              <p className="text-xs text-alms-navy mt-1.5 font-medium">
                Please scan your enrolled{' '}
                {biometricTargetThumb === 'LEFT_THUMB'
                  ? 'Left hand thumb print'
                  : 'Right hand thumb print'}{' '}
                from the fresh application.
              </p>
            </div>

            {mantraSDKReady && deviceConnected ? (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleVerifyBiometrics}
                  disabled={fingerprintCapturing}
                  className="px-5 py-2.5 bg-alms-navy hover:bg-alms-navy-dark text-white rounded-lg font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm"
                >
                  <Fingerprint className="w-4 h-4" />
                  {fingerprintCapturing ? 'Scanning...' : 'Scan Fingerprint'}
                </button>
                <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Device Ready
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={checkDeviceConnection}
                  disabled={deviceChecking}
                  className="px-5 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium text-sm transition-colors flex items-center gap-2"
                >
                  {deviceChecking ? 'Checking...' : 'Retry Device Check'}
                </button>
                <span className="text-xs text-gray-500 font-medium">
                  {!mantraSDKReady ? 'Mantra SDK not initialized' : 'Device not connected'}
                </span>
              </div>
            )}
          </div>
        </div>
      );
    }

    return null;
  };

  // Render the form step
  const renderForm = () => (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-1.5">
          <label htmlFor="modal-licenseId" className="block text-sm font-medium text-gray-700">
            Target License ID
          </label>
          <input
            type="text"
            id="modal-licenseId"
            name="licenseId"
            value={formData.licenseId}
            disabled
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed text-gray-700 font-medium text-sm"
          />
          <p className="text-xs text-gray-400">Verified target ID of the license.</p>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="modal-applicationType" className="block text-sm font-medium text-gray-700">
            Application Type
          </label>
          <input
            type="text"
            id="modal-applicationType"
            name="applicationType"
            value="Cancel Application"
            disabled
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed text-gray-700 font-medium text-sm"
          />
        </div>
      </div>

      {applicantDetails && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-green-800">Applicant Verified</p>
            <p className="text-xs text-green-700 mt-1">
              {applicantDetails.name} — License: {applicantDetails.licenseNumber}
            </p>
          </div>
        </div>
      )}

      <div className="space-y-1.5">
        <label htmlFor="modal-cancellationReason" className="block text-sm font-medium text-gray-700">
          Reason for Cancellation <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="modal-cancellationReason"
          name="cancellationReason"
          value={formData.cancellationReason}
          onChange={handleChange}
          required
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-alms-navy/20 focus:border-alms-navy outline-none transition-all text-sm"
          placeholder="E.g., Voluntary surrender by applicant"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="modal-remarks" className="block text-sm font-medium text-gray-700">
          Additional Remarks
        </label>
        <textarea
          id="modal-remarks"
          name="remarks"
          value={formData.remarks}
          onChange={handleChange}
          rows={3}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-alms-navy/20 focus:border-alms-navy outline-none transition-all text-sm resize-none"
          placeholder="Provide any additional context or details for this request (optional)"
        />
      </div>

      <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
        <button
          type="button"
          onClick={onClose}
          className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium text-sm transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium text-sm transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm"
        >
          {loading ? (
            <>
              <LoaderFixed className="w-4 h-4 animate-spin" />
              Submitting
            </>
          ) : (
            'Submit Request'
          )}
        </button>
      </div>
    </form>
  );

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-[60] transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[61] flex items-center justify-center p-4">
        <div
          className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-[fadeIn_200ms_ease-out]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-white">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Initiate License Cancellation
                </h2>
                <p className="text-xs text-gray-500">
                  {verificationStatus === 'ENTER_APP_ID'
                    ? 'Verify the application first'
                    : verificationStatus === 'VERIFYING_BIOMETRICS'
                      ? 'Biometric verification in progress'
                      : 'Fill in the cancellation details'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Step indicator */}
          <div className="px-6 pt-4 pb-2">
            <div className="flex items-center gap-2">
              <div
                className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                  verificationStatus === 'VERIFIED'
                    ? 'bg-green-500 text-white'
                    : verificationStatus === 'VERIFYING_BIOMETRICS'
                      ? 'bg-alms-navy text-white'
                      : verificationStatus === 'FAILED'
                        ? 'bg-red-500 text-white'
                        : 'bg-alms-navy text-white'
                }`}
              >
                1
              </div>
              <span
                className={`text-xs font-medium ${
                  verificationStatus !== 'ENTER_APP_ID' ? 'text-green-600' : 'text-alms-navy'
                }`}
              >
                {verificationStatus === 'VERIFIED' ? 'Verified' : 'Verification'}
              </span>
              <div className="flex-1 h-px bg-gray-200 mx-2" />
              <div
                className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                  verificationStatus === 'VERIFIED'
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-400'
                }`}
              >
                2
              </div>
              <span
                className={`text-xs font-medium ${
                  verificationStatus === 'VERIFIED' ? 'text-alms-navy' : 'text-gray-400'
                }`}
              >
                Details
              </span>
            </div>
          </div>

          {/* Body */}
          <div className="px-6 py-4 max-h-[60vh] overflow-y-auto">
            {!isVerified && verificationStatus !== 'VERIFIED'
              ? renderVerificationStep()
              : renderForm()}
          </div>
        </div>
      </div>

      {/* Fingerprint Preview Modal */}
      {showFingerprintPreviewModal && pendingCaptureResult && (
        <>
          <div className="fixed inset-0 bg-black/60 z-[70]" />
          <div className="fixed inset-0 z-[71] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-gray-200 text-center space-y-4">
              <h3 className="text-lg font-bold text-gray-900">Fingerprint Preview</h3>
              <p className="text-sm text-gray-500">Quality: {pendingCaptureResult.quality}%</p>
              {fingerprintPreviewImage && (
                <div className="flex justify-center border border-gray-200 p-4 rounded-xl bg-gray-50">
                  <img src={fingerprintPreviewImage} alt="Fingerprint Preview" className="max-h-60" />
                </div>
              )}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowFingerprintPreviewModal(false);
                    setPendingCaptureResult(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAcceptFingerprintPreview}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm"
                >
                  Accept & Verify
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
