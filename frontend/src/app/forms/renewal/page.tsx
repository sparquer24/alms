'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'react-toastify';
import { ApplicationService } from '../../../api/applicationService';
import { RenewalService } from '../../../api/renewalService';
import CancelService from '../../../api/cancelService';
import MantraSDKService from '../../../services/mantraSDKService';
import BiometricAPIService from '../../../services/biometricAPIService';

function RenewalEntryGateContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const licenseIdParam = searchParams?.get('licenseId') || '';
  const renewalIdParam = searchParams?.get('renewalId') || searchParams?.get('id') || '';

  const [inputLicenseId, setInputLicenseId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const [isBiometricRequired, setIsBiometricRequired] = useState(false);
  const [biometricVerified, setBiometricVerified] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [licenseRecord, setLicenseRecord] = useState<any>(null);

  useEffect(() => {
    if (licenseIdParam) {
      if (renewalIdParam) {
        router.replace(
          `/forms/renewal/personal-information?licenseId=${encodeURIComponent(
            licenseIdParam
          )}&renewalId=${encodeURIComponent(renewalIdParam)}`
        );
      } else {
        handleValidateAndProceed(licenseIdParam);
      }
    }
  }, [licenseIdParam, renewalIdParam]);

  const handleValidateAndProceed = async (targetLicenseId: string) => {
    if (!targetLicenseId?.trim()) {
      setError('Please enter a valid License ID or License Number.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setStatusMessage('Validating license status and checking cancellation records...');

    try {
      // 1. Fetch license details
      const licResp = await ApplicationService.getLicense(targetLicenseId.trim());
      const licData = licResp?.data || licResp;
      if (!licData) {
        throw new Error('License record not found. Please verify the License ID.');
      }

      setLicenseRecord(licData);
      const licNo = licData.licenseNumber || licData.licenseNo || targetLicenseId;

      // 2. Cancellation Check: Reject if CANCELLED
      const licStatus = String(licData.status?.code || licData.status || '').toUpperCase();
      if (licStatus === 'CANCELLED') {
        throw new Error('This license is CANCELLED and is not eligible for renewal.');
      }

      // Check active pending cancellation requests
      try {
        const cancelRequests = await CancelService.getCancelRequests();
        const pendingCancel = (cancelRequests?.data || cancelRequests || []).find(
          (req: any) =>
            (req.licenseId === licData.id || req.licenseNumber === licNo) &&
            String(req.status || '').toUpperCase() === 'PENDING'
        );
        if (pendingCancel) {
          throw new Error(
            'This license has a cancellation request in progress and cannot be renewed.'
          );
        }
      } catch (cancelErr: any) {
        if (cancelErr.message && cancelErr.message.includes('cannot be renewed')) {
          throw cancelErr;
        }
        // Ignore minor API cancellation check error
      }

      // 3. Biometric Check: Check if biometrics were enrolled
      const hasEnrolledBiometrics =
        licData.biometricData?.fingerprints?.length > 0 ||
        licData.fingerprints?.length > 0;

      if (hasEnrolledBiometrics && !biometricVerified) {
        setIsBiometricRequired(true);
        setStatusMessage('Biometric fingerprint verification required for renewal.');
        setIsLoading(false);
        return;
      }

      // 4. Draft creation or loading
      setStatusMessage('Initializing renewal application draft...');
      let appData: any = {};
      const lastModifiedAppType = String(licData.lastModifiedAppType || '').toUpperCase();
      const renewalAppId = licData.lastModifiedRenewalId || licData.renewalApplicationId || (lastModifiedAppType === 'RENEWAL' ? licData.lastModifiedAppId : null);
      const freshAppId = licData.freshApplicationId || (lastModifiedAppType === 'FRESH' ? licData.lastModifiedAppId : null);

      if (lastModifiedAppType === 'RENEWAL' && renewalAppId) {
        try {
          const renewalResp = await RenewalService.getRenewalForm(String(renewalAppId));
          appData = renewalResp?.data || renewalResp || {};
        } catch (rErr) {
          console.warn('Could not fetch renewal form by lastModifiedRenewalId:', rErr);
        }
      } else if (freshAppId) {
        try {
          const appResp = await ApplicationService.getApplication(String(freshAppId));
          appData = appResp?.data || appResp || {};
        } catch (appErr) {
          console.warn('Could not fetch fresh application for draft creation:', appErr);
        }
      }

      const applicantName =
        licData.applicantName ||
        appData.applicantName ||
        [appData.firstName, appData.middleName, appData.lastName].filter(Boolean).join(' ') ||
        '';

      const existing = await RenewalService.findRenewalByLicenseNumber(licNo);
      let activeRenewalId = '';

      if (existing && existing.id) {
        activeRenewalId = String(existing.id);
      } else {
        const payload = {
          licenseId: licData.licenseId || licData.id || targetLicenseId,
          licenseNumber: licNo,
          applicantName,
          fatherName: licData.fatherName || appData.fatherName || appData.parentOrSpouseName || '',
          applicantGender: licData.applicantGender || licData.gender || appData.applicantGender || appData.sex || '',
          applicantMobile: licData.applicantMobile || licData.mobile || appData.applicantMobile || appData.mobile || '',
          applicantEmail: licData.applicantEmail || licData.email || appData.applicantEmail || appData.email || '',
          presentAddress: licData.presentAddress || appData.presentAddress || (appData.addresses && appData.addresses[0]?.address) || '',
          permanentAddress: licData.permanentAddress || appData.permanentAddress || (appData.addresses && appData.addresses[1]?.address) || '',
        };
        try {
          const createResp = await RenewalService.createRenewalForm(payload);
          const created = createResp?.data || createResp;
          activeRenewalId = String(created?.id || created?.renewalApplicationId || '');
        } catch (createErr: any) {
          if (createErr?.status === 409) {
            const foundDraft = await RenewalService.findRenewalByLicenseNumber(licNo);
            if (foundDraft && foundDraft.id) {
              activeRenewalId = String(foundDraft.id);
            }
          } else {
            throw createErr;
          }
        }
      }

      toast.success('License validated successfully!');
      router.replace(
        `/forms/renewal/personal-information?licenseId=${encodeURIComponent(
          licData.id || targetLicenseId
        )}&renewalId=${encodeURIComponent(activeRenewalId)}`
      );
    } catch (err: any) {
      console.error('License entry gate error:', err);
      setError(err.message || 'Failed to validate license.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleScanFingerprint = async () => {
    setIsScanning(true);
    setError(null);
    try {
      const deviceStatus = await MantraSDKService.isDeviceConnected();
      if (!deviceStatus?.isConnected) {
        throw new Error('Mantra MFS500 biometric scanner not detected. Please connect device.');
      }
      const captureResult = await MantraSDKService.captureFinger();
      if (!captureResult || !captureResult.success) {
        throw new Error(captureResult?.errorMessage || 'Failed to capture thumbprint scan. Please try again.');
      }
      setBiometricVerified(true);
      toast.success('Fingerprint verified successfully!');
      if (licenseRecord) {
        await handleValidateAndProceed(String(licenseRecord.id || inputLicenseId));
      }
    } catch (err: any) {
      console.error('Biometric verification error:', err);
      setError(err.message || 'Fingerprint match failed.');
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col bg-cover bg-center bg-fixed relative overflow-hidden bg-[url('/backgroundIMGALMS.jpeg')]"
      role='main'
    >
      <div
        className='absolute inset-0 bg-gradient-to-br from-black/40 via-black/30 to-black/50 backdrop-blur-[2px]'
        aria-hidden='true'
      />
      <div className='relative flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 z-10'>
        <div className='max-w-md w-full space-y-6 bg-white/90 p-10 rounded-lg shadow-xl backdrop-blur-sm border border-white/40 transition-all duration-300'>
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
                License Renewal Verification
              </h2>
              <p className='mt-2 text-sm text-gray-600'>
                Please enter your License ID or License Number to verify your identity and
                start the renewal process.
              </p>
            </div>

            {error && (
              <div className='bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm'>
                {error}
              </div>
            )}

            {statusMessage && !error && (
              <div className='bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-xl text-sm'>
                {statusMessage}
              </div>
            )}

            {!isBiometricRequired ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleValidateAndProceed(inputLicenseId);
                }}
                className='space-y-4'
              >
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    License ID / License Number
                  </label>
                  <input
                    type='text'
                    value={inputLicenseId}
                    onChange={(e) => setInputLicenseId(e.target.value)}
                    placeholder='e.g. LIC-2026-98745'
                    className='w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 font-medium'
                    required
                  />
                </div>

                <button
                  type='submit'
                  disabled={isLoading}
                  className='w-full py-3.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-lg transition-colors disabled:opacity-50 flex items-center justify-center space-x-2'
                >
                  {isLoading ? (
                    <>
                      <div className='w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin' />
                      <span>Validating License...</span>
                    </>
                  ) : (
                    <span>Validate & Proceed</span>
                  )}
                </button>
              </form>
            ) : (
              <div className='space-y-6 text-center bg-blue-50/50 p-6 rounded-xl border border-blue-100'>
                <div className='space-y-2'>
                  <h3 className='text-lg font-semibold text-blue-900'>Biometric Verification Required</h3>
                  <p className='text-sm text-gray-600'>
                    Please scan your enrolled thumbprint on the Mantra MFS500 device to authenticate your license renewal.
                  </p>
                </div>

                <button
                  type='button'
                  onClick={handleScanFingerprint}
                  disabled={isScanning}
                  className='w-full py-3.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-lg transition-colors disabled:opacity-50 flex items-center justify-center space-x-2'
                >
                  {isScanning ? (
                    <>
                      <div className='w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin' />
                      <span>Scanning Fingerprint...</span>
                    </>
                  ) : (
                    <span>Scan Fingerprint & Verify</span>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RenewalEntryGatePage() {
  return (
    <Suspense
      fallback={
        <div className='min-h-screen flex items-center justify-center bg-slate-50'>
          <div className='w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin' />
        </div>
      }
    >
      <RenewalEntryGateContent />
    </Suspense>
  );
}
