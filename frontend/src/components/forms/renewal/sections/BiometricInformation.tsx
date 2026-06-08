'use client';
import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import dynamic from 'next/dynamic';
import { toast } from 'react-toastify';
import { FormField } from '../../elements/FormField';
// @ts-expect-error - dynamic import & react-webcam types can conflict with project React types
const Webcam = dynamic(() => import('react-webcam').then(mod => mod.default), {
  ssr: false,
}) as any;
import RenewalService from '../../../../api/renewalService';
import MantraSDKService from '../../../../services/mantraSDKService';
import BiometricAPIService from '../../../../services/biometricAPIService';

type BiometricForm = {
  fingerprint: File | null;
  iris: File | null;
  photograph: File | null;
  signature: File | null;
};

type ErrorsMap = Record<string, string | undefined>;

const initialState: BiometricForm = {
  fingerprint: null,
  iris: null,
  photograph: null,
  signature: null,
};

const BiometricInformation = forwardRef(function BiometricInformation(
  props: {
    formData: any;
    renewalId: string;
    onChange: (e: any) => void;
    onFileChange: (name: string, file: File | null) => void;
    onPrevious?: () => void;
    onNext?: () => void;
    onSaveToDraft?: () => void;
    errors?: ErrorsMap;
  },
  ref,
) {
  const { renewalId, onPrevious, onNext, onSaveToDraft, errors = {} } = props;
  const [form, setForm] = useState<BiometricForm>(initialState);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [streamActive, setStreamActive] = useState(false);
  const [webcamReady, setWebcamReady] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoSubmitted, setPhotoSubmitted] = useState(false);
  const [mantraSDKReady, setMantraSDKReady] = useState(false);
  const [fingerprintDeviceConnected, setFingerprintDeviceConnected] = useState(false);
  const [fingerprintCapturing, setFingerprintCapturing] = useState(false);
  const [enrolledFingerprints, setEnrolledFingerprints] = useState<any[]>([]);
  const [fingerprintPreviewImage, setFingerprintPreviewImage] = useState<string | null>(null);
  const [showFingerprintPreviewModal, setShowFingerprintPreviewModal] = useState(false);
  const [pendingCaptureResult, setPendingCaptureResult] = useState<any | null>(null);
  const [pendingFingerPosition, setPendingFingerPosition] = useState<string>('RIGHT_THUMB');
  const [selectedFinger, setSelectedFinger] = useState<string>('RIGHT_THUMB');
  const [showDeviceSettings, setShowDeviceSettings] = useState(false);
  const [diagnosticResults, setDiagnosticResults] = useState<any>({});
  const [diagnosticLoading, setDiagnosticLoading] = useState<string | null>(null);
  const [showWebcamModal, setShowWebcamModal] = useState(false);
  const [webcamCapturedPhoto, setWebcamCapturedPhoto] = useState<string | null>(null);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicateMatchInfo, setDuplicateMatchInfo] = useState<any>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successInfo, setSuccessInfo] = useState<any>(null);
  const [showPhotoSuccessModal, setShowPhotoSuccessModal] = useState(false);
  const [showPhotoErrorModal, setShowPhotoErrorModal] = useState(false);
  const [photoErrorMessage, setPhotoErrorMessage] = useState<string>('');
  const [showInfoTooltip, setShowInfoTooltip] = useState(false);
  const [showCapturingModal, setShowCapturingModal] = useState(false);
  const [capturingStep, setCapturingStep] = useState<string>('');
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const webcamRef = useRef<any>(null);

  useImperativeHandle(ref, () => ({
    focusFirstInvalid: () => {
      const firstKey = Object.keys(errors).find(k => !!errors[k]);
      if (firstKey) {
        const el = document.getElementById(firstKey);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          try { (el as HTMLElement).focus(); } catch { /* ignore focus errors */ }
        }
      }
    },
  }));

  useEffect(() => {
    const initializeMantra = async () => {
      const initialized = await MantraSDKService.initialize();
      setMantraSDKReady(initialized);
      if (initialized) {
        const deviceStatus = await MantraSDKService.isDeviceConnected();
        setFingerprintDeviceConnected(deviceStatus.isConnected);
        if (deviceStatus.isConnected) toast.info('Fingerprint device detected and ready');
        else toast.warning('Fingerprint device not connected. Use Settings → Diagnostics to troubleshoot.');
      }
    };
    initializeMantra();
    return () => {
      if (photoPreview && photoPreview.startsWith('blob:')) URL.revokeObjectURL(photoPreview);
    };
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files } = e.target;
    if (files && files[0]) {
      const file = files[0];
      setForm(prev => ({ ...prev, [name]: file }));
      if (name === 'photograph') {
        const url = URL.createObjectURL(file);
        setPhotoPreview(url);
      }
    }
  };

  const removePhoto = () => {
    setPhotoPreview(null);
    setForm(prev => ({ ...prev, photograph: null }));
    setPhotoSubmitted(false);
  };

  const submitPhoto = async () => {
    if (!form.photograph || !photoPreview) {
      toast.warning('Please capture or upload a photograph first.');
      return;
    }
    try {
      setUploadingFiles(true);
      setUploadProgress('Submitting photograph...');
      if (renewalId) {
        await RenewalService.uploadDocument(renewalId, 'PHOTOGRAPH', form.photograph as File);
        setPhotoSubmitted(true);
        toast.success('Photograph submitted successfully!');
      } else {
        toast.warning('Please create renewal application first.');
      }
    } catch (err: any) {
      toast.error('Failed to submit photograph');
    } finally {
      setUploadingFiles(false);
      setUploadProgress('');
    }
  };

  const handleCaptureFingerprintMantra = async (fingerPosition: string = selectedFinger) => {
    if (!mantraSDKReady || !fingerprintDeviceConnected) {
      toast.error('Fingerprint device is not available. Please check Settings for diagnostics.');
      setShowDeviceSettings(true);
      return;
    }
    try {
      setFingerprintCapturing(true);
      setShowCapturingModal(true);
      setCapturingStep('Initializing fingerprint device...');
      const deviceStatus = await MantraSDKService.isDeviceConnected();
      if (!deviceStatus.isConnected) {
        toast.error('Fingerprint device disconnected. Check Settings → Diagnostics.');
        setFingerprintDeviceConnected(false);
        setShowDeviceSettings(true);
        setShowCapturingModal(false);
        return;
      }
      setCapturingStep('Place your finger on the scanner...');
      toast.info('📍 Please place your finger on the device and keep it steady.');
      setCapturingStep('Scanning fingerprint...');
      const captureResult = await MantraSDKService.captureFinger(60, 10000);
      if (!captureResult.success) {
        toast.error(`Fingerprint capture failed: ${captureResult.errorMessage}`);
        setShowCapturingModal(false);
        return;
      }
      setCapturingStep('Processing captured fingerprint...');
      toast.success(`✓ Captured successfully! Quality: ${captureResult.quality}%`);
      setCapturingStep('Generating preview...');
      try {
        let previewImage: string | null = captureResult.bitmapData || null;
        if (!previewImage) previewImage = await MantraSDKService.getImage('0');
        setPendingCaptureResult(captureResult);
        setPendingFingerPosition(fingerPosition);
        if (previewImage) setFingerprintPreviewImage(`data:image/bmp;base64,${previewImage}`);
        else setFingerprintPreviewImage(null);
        setShowCapturingModal(false);
        setShowFingerprintPreviewModal(true);
        toast.info('👆 Preview ready - Accept to enroll or Retake for better quality');
      } catch (imageError: any) {
        setPendingCaptureResult(captureResult);
        setPendingFingerPosition(fingerPosition);
        setFingerprintPreviewImage(null);
        setShowCapturingModal(false);
        setShowFingerprintPreviewModal(true);
        toast.warning('⚠️ Image preview unavailable, but you can still enroll with template');
      }
    } catch (error: any) {
      toast.error('❌ Fingerprint capture failed. Please try again.');
      setShowCapturingModal(false);
    } finally {
      setFingerprintCapturing(false);
      setCapturingStep('');
    }
  };

  const handleAcceptFingerprintPreview = async () => {
    if (!pendingCaptureResult || !renewalId) {
      toast.error('Invalid capture data');
      return;
    }
    try {
      setFingerprintCapturing(true);
      setUploadProgress('Fetching stored templates for matching...');
      const biometricTemplate = {
        template: pendingCaptureResult.template,
        quality: pendingCaptureResult.quality,
        captureTime: pendingCaptureResult.captureTime!,
        bitmapData: pendingCaptureResult.bitmapData,
      };
      const templatesResponse = await BiometricAPIService.getTemplatesForMatching(renewalId);
      if (!templatesResponse.success) {
        toast.error('Failed to fetch templates for matching');
        setFingerprintCapturing(false);
        setUploadProgress('');
        return;
      }
      const liveTemplate = biometricTemplate.template;
      const matchThreshold = 65;
      let matchFound = false, matchedTemplate: any = null;
      setUploadProgress(`Matching against ${templatesResponse.templates.length} stored fingerprints...`);
      for (const storedTemplate of templatesResponse.templates) {
        try {
          const matchResult = await MantraSDKService.verifyTemplate(storedTemplate.template, liveTemplate, matchThreshold);
          if (matchResult.isMatch || matchResult.score >= matchThreshold) {
            matchFound = true;
            matchedTemplate = storedTemplate;
            break;
          }
        } catch (e) {}
      }
      if (matchFound && matchedTemplate) {
        setDuplicateMatchInfo({
          applicationId: matchedTemplate.applicationId || 'Unknown',
          almsLicenseId: matchedTemplate.almsLicenseId || null,
          applicantName: matchedTemplate.applicantName || 'Unknown',
          fingerPosition: matchedTemplate.fingerPosition || 'Unknown',
        });
        setShowDuplicateModal(true);
        setShowFingerprintPreviewModal(false);
        setFingerprintPreviewImage(null);
        setPendingCaptureResult(null);
        setFingerprintCapturing(false);
        setUploadProgress('');
        return;
      }
      setUploadProgress('No duplicate found. Storing fingerprint...');
      const storeResponse = await BiometricAPIService.storeFingerprint(renewalId, pendingFingerPosition, biometricTemplate, `Captured via Mantra SDK - ${pendingFingerPosition}`);
      if (!storeResponse.success) {
        toast.error(`Failed to store fingerprint: ${storeResponse.message}`);
        setFingerprintCapturing(false);
        setUploadProgress('');
        return;
      }
      setSuccessInfo({ fingerPosition: pendingFingerPosition, quality: pendingCaptureResult.quality, enrolledAt: storeResponse.enrolledAt || new Date().toISOString() });
      setShowSuccessModal(true);
      setTimeout(() => setShowSuccessModal(false), 5000);
      setEnrolledFingerprints([{ id: storeResponse.fingerprintId, position: pendingFingerPosition, enrolledAt: storeResponse.enrolledAt, quality: pendingCaptureResult.quality, bitmapData: pendingCaptureResult.bitmapData || fingerprintPreviewImage }]);
      setShowFingerprintPreviewModal(false);
      setFingerprintPreviewImage(null);
      setPendingCaptureResult(null);
    } catch (error: any) {
      toast.error('❌ Fingerprint enrollment failed. Please try again.');
    } finally {
      setFingerprintCapturing(false);
      setUploadProgress('');
    }
  };

  const handleRejectFingerprintPreview = () => {
    setShowFingerprintPreviewModal(false);
    setFingerprintPreviewImage(null);
    setPendingCaptureResult(null);
    setPendingFingerPosition(selectedFinger);
    handleCaptureFingerprintMantra(selectedFinger);
  };

  const handleCancelFingerprintPreview = () => {
    setShowFingerprintPreviewModal(false);
    setFingerprintPreviewImage(null);
    setPendingCaptureResult(null);
    setPendingFingerPosition(selectedFinger);
  };

  const openWebcamModal = () => { setShowWebcamModal(true); setWebcamCapturedPhoto(null); setStreamActive(true); setWebcamReady(false); };
  const capturePhotoInModal = () => {
    if (!webcamRef.current) { toast.error('Webcam not ready. Please wait.'); return; }
    if (!webcamReady) { toast.error('Camera stream not ready. Please wait a moment.'); return; }
    const dataUrl = webcamRef.current.getScreenshot();
    if (!dataUrl) { toast.error('Failed to capture photo. Ensure webcam is active.'); return; }
    setWebcamCapturedPhoto(dataUrl);
    setStreamActive(false);
  };
  const retakePhotoInModal = () => { setWebcamCapturedPhoto(null); setStreamActive(true); setWebcamReady(false); };
  const submitPhotoFromModal = async () => {
    if (!webcamCapturedPhoto) { toast.warning('Please capture a photo first.'); return; }
    try {
      setUploadingFiles(true);
      setUploadProgress('Submitting photograph...');
      const blob = await (await fetch(webcamCapturedPhoto)).blob();
      const file = new File([blob], 'photograph.jpg', { type: 'image/jpeg' });
      setPhotoPreview(webcamCapturedPhoto);
      setForm(prev => ({ ...prev, photograph: file }));
      if (renewalId) {
        await RenewalService.uploadDocument(renewalId, 'PHOTOGRAPH', file);
        setPhotoSubmitted(true);
        setShowWebcamModal(false);
        setWebcamCapturedPhoto(null);
        setStreamActive(false);
        setShowPhotoSuccessModal(true);
        setTimeout(() => setShowPhotoSuccessModal(false), 5000);
      } else {
        toast.warning('Please create renewal application first.');
        setShowWebcamModal(false);
      }
    } catch (err: any) {
      setPhotoErrorMessage(err?.message || 'Failed to submit photograph.');
      setShowPhotoErrorModal(true);
      setShowWebcamModal(false);
    } finally {
      setUploadingFiles(false);
      setUploadProgress('');
    }
  };
  const cancelWebcamModal = () => { setShowWebcamModal(false); setWebcamCapturedPhoto(null); setStreamActive(false); setWebcamReady(false); };

  const runDiagnostic = async (testName: string, testFn: () => Promise<any>) => {
    try {
      setDiagnosticLoading(testName);
      const result = await testFn();
      setDiagnosticResults((prev: any) => ({ ...prev, [testName]: { success: true, data: result, timestamp: new Date().toLocaleTimeString() } }));
      toast.success(`✓ ${testName} passed`);
    } catch (error: any) {
      setDiagnosticResults((prev: any) => ({ ...prev, [testName]: { success: false, error: error.message, timestamp: new Date().toLocaleTimeString() } }));
      toast.error(`✗ ${testName} failed: ${error.message}`);
    } finally { setDiagnosticLoading(null); }
  };

  const testCheckDevice = async () => {
    const result = await MantraSDKService.isDeviceConnected();
    if (!result.isConnected) throw new Error(result.errorMessage || 'Device not connected');
    return result;
  };
  const testCapture = async () => {
    const result = await MantraSDKService.captureFinger(60, 10000);
    if (!result.success) throw new Error(result.errorMessage || 'Capture failed');
    return result;
  };
  const testGetInfo = async () => {
    const result = await MantraSDKService.getDeviceInfo();
    if (!result) throw new Error('Failed to get device info');
    return result;
  };
  const testGetImage = async () => {
    const result = await MantraSDKService.getImage('0');
    if (!result) throw new Error('Failed to get image');
    return result;
  };

  const handleScanIris = async () => {
    try {
      const res = await fetch('/api/device/scan/iris', { method: 'POST' });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      setForm(prev => ({ ...prev, iris: new File([blob], 'iris.bin') }));
      toast.success('Iris captured successfully');
    } catch { toast.error('Failed to capture iris'); }
  };

  return (
    <section className='p-6 rounded-2xl border border-gray-100 bg-white shadow-sm space-y-8'>
      <h2 className='text-xl font-bold text-gray-800'>Biometric Information</h2>

      {/* Fingerprint Section */}
      <div className='grid md:grid-cols-2 gap-8'>
        <div>
          <div className='flex justify-between items-center mb-4'>
            <h3 className='text-lg font-semibold text-gray-800'>Signature / Thumb Impression</h3>
            <div className='flex items-center gap-2'>
              <div className='relative'>
                <button 
                  type='button' 
                  onClick={() => setShowInfoTooltip(!showInfoTooltip)} 
                  className='p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-full transition-colors' 
                  title='Device setup information'
                >
                  <svg className='w-5 h-5' fill='currentColor' viewBox='0 0 20 20'>
                    <path fillRule='evenodd' d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z' clipRule='evenodd' />
                  </svg>
                </button>
                {showInfoTooltip && (
                  <div className='absolute right-0 top-8 w-80 bg-white border border-gray-200 rounded-lg shadow-xl z-50 p-4'>
                    <h4 className='font-semibold text-gray-800 mb-3'>Device Setup Guide</h4>
                    <div className='space-y-2 text-sm text-gray-600'>
                      <p>✔ Connect Mantra MFS500 via USB</p>
                      <p>✔ Install Mantra drivers</p>
                      <p>✔ Run Mantra RD Service</p>
                      <p>✔ Start MorfinAuth SDK on port 8030</p>
                    </div>
                  </div>
                )}
              </div>
              <button 
                type='button' 
                onClick={() => setShowDeviceSettings(!showDeviceSettings)} 
                className='px-3 py-1.5 text-sm bg-gray-600 hover:bg-gray-700 text-white rounded-md flex items-center gap-1.5 transition-colors'
              >
                <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' />
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 12a3 3 0 11-6 0 3 3 0 016 0z' />
                </svg>
                Settings
              </button>
            </div>
          </div>

          <FormField 
            label='Select Hand & Finger' 
            required 
            error={errors['selectedFinger']}
            helpText='Only thumb fingers are allowed for enrollment.'
          >
            <select 
              id='selectedFinger'
              value={selectedFinger} 
              onChange={(e) => setSelectedFinger(e.target.value)} 
              disabled={fingerprintCapturing} 
              className='w-full md:w-64 p-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#6366F1] focus:border-transparent bg-white disabled:bg-gray-100 disabled:cursor-not-allowed'
            >
              <option value='RIGHT_THUMB'>Right Hand Thumb</option>
              <option value='LEFT_THUMB'>Left Hand Thumb</option>
            </select>
          </FormField>

          <div className='mt-4'>
            {mantraSDKReady && fingerprintDeviceConnected ? (
              <button 
                type='button' 
                onClick={() => handleCaptureFingerprintMantra(selectedFinger)} 
                disabled={fingerprintCapturing || uploadingFiles} 
                className='px-5 py-2.5 bg-[#6366F1] hover:bg-[#5558E3] text-white rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2'
              >
                <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.2-2.858.571-4.177' />
                </svg>
                {fingerprintCapturing ? 'Capturing...' : 'Scan Fingerprint'}
              </button>
            ) : (
              <button 
                type='button' 
                disabled 
                className='px-5 py-2.5 bg-gray-400 text-white rounded-md font-medium cursor-not-allowed flex items-center gap-2'
              >
                <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.2-2.858.571-4.177' />
                </svg>
                Scan Fingerprint
              </button>
            )}
            {!mantraSDKReady && (
              <p className='text-sm text-amber-600 mt-2 bg-amber-50 border border-amber-200 rounded-md px-3 py-2'>
                ⚠️ Mantra SDK not initialized. Please ensure the device service is running.
              </p>
            )}
          </div>

          {enrolledFingerprints.length > 0 && (() => {
            const latestFp = enrolledFingerprints[enrolledFingerprints.length - 1];
            return (
              <div className='mt-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200'>
                <div className='flex items-center gap-2 mb-3'>
                  <svg className='w-5 h-5 text-green-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' />
                  </svg>
                  <span className='font-semibold text-green-700 text-sm'>Fingerprint Enrolled Successfully</span>
                </div>
                <div className='flex items-center gap-4'>
                  <div className='w-20 h-24 bg-white rounded-lg overflow-hidden border-2 border-green-300 shadow-sm'>
                    {latestFp.bitmapData ? (
                      <img 
                        src={latestFp.bitmapData.startsWith('data:') ? latestFp.bitmapData : `data:image/bmp;base64,${latestFp.bitmapData}`} 
                        alt={latestFp.position} 
                        className='w-full h-full object-cover' 
                        onLoad={() => setUploadProgress('')} 
                      />
                    ) : (
                      <span className='text-xs text-gray-500 p-1'>{uploadProgress || ''}</span>
                    )}
                  </div>
                  <div className='space-y-1'>
                    <p><span className='text-gray-500 text-sm'>Position:</span> <b className='text-gray-800'>{latestFp.position}</b></p>
                    <p><span className='text-gray-500 text-sm'>Quality:</span> <b className={latestFp.quality >= 60 ? 'text-green-600' : 'text-red-600'}>{latestFp.quality}%</b></p>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Iris Scan Section */}
        <div>
          <h3 className='text-lg font-semibold text-gray-800 mb-4'>Iris Scan</h3>
          <button 
            type='button' 
            onClick={handleScanIris} 
            disabled 
            className='px-5 py-2.5 bg-gray-400 text-white rounded-md font-medium cursor-not-allowed flex items-center gap-2'
          >
            <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 12a3 3 0 11-6 0 3 3 0 016 0z' />
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z' />
            </svg>
            Scan Iris
          </button>
          <p className='text-sm text-gray-500 mt-3 bg-gray-50 border border-gray-200 rounded-md px-3 py-2'>
            ℹ️ Iris scanning will be available soon. Please check back later for updates.
          </p>
        </div>
      </div>

      {/* Photograph Section */}
      <div className='border-t border-gray-200 pt-6'>
        <h3 className='text-lg font-semibold text-gray-800 mb-2'>Photograph</h3>
        <p className='text-sm text-gray-600 mb-5'>Capture the applicant's live photo using webcam or upload an existing photograph.</p>

        <div className='grid md:grid-cols-2 gap-6 items-start'>
          <div className='space-y-4'>
            <button 
              type='button' 
              onClick={openWebcamModal} 
              className='w-full md:w-auto px-5 py-3 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium transition-colors flex items-center justify-center gap-2'
            >
              <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z' />
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 13a3 3 0 11-6 0 3 3 0 016 0z' />
              </svg>
              Use Webcam
            </button>
            
            <div className='relative'>
              <div className='absolute inset-0 flex items-center'>
                <div className='w-full border-t border-gray-300'></div>
              </div>
              <div className='relative flex justify-center text-sm'>
                <span className='px-3 bg-white text-gray-500'>or</span>
              </div>
            </div>

            <label className='block border-2 border-dashed border-gray-300 rounded-lg p-6 text-center text-gray-600 cursor-pointer hover:border-[#6366F1] hover:bg-gray-50 transition-colors'>
              <svg className='w-8 h-8 mx-auto mb-2 text-gray-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' />
              </svg>
              <span className='font-medium'>Upload Photograph</span>
              <span className='block text-xs text-gray-500 mt-1'>Click to browse files</span>
              <input 
                type='file' 
                name='photograph' 
                accept='image/*' 
                className='hidden' 
                onChange={handleFileChange} 
              />
            </label>
          </div>

          {photoPreview && (
            <div className='flex flex-col items-center'>
              <div className='relative'>
                <img 
                  src={photoPreview} 
                  alt='Preview' 
                  className='w-48 h-48 object-cover rounded-lg border-2 border-gray-200 shadow-md' 
                />
                {photoSubmitted && (
                  <div className='absolute top-2 right-2 bg-green-500 rounded-full p-1'>
                    <svg className='w-4 h-4 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={3} d='M5 13l4 4L19 7' />
                    </svg>
                  </div>
                )}
              </div>
              <div className='flex gap-3 mt-4'>
                {!photoSubmitted && (
                  <button 
                    type='button' 
                    onClick={submitPhoto} 
                    disabled={uploadingFiles} 
                    className='px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium transition-colors disabled:opacity-50 flex items-center gap-2'
                  >
                    <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1M8 12l4-4m0 0l4 4m-4-4v12' />
                    </svg>
                    {uploadingFiles ? 'Submitting...' : 'Submit'}
                  </button>
                )}
                {!photoSubmitted && (
                  <button 
                    type='button' 
                    onClick={removePhoto} 
                    disabled={uploadingFiles} 
                    className='px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-md font-medium transition-colors disabled:opacity-50 flex items-center gap-2'
                  >
                    <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16' />
                    </svg>
                    Remove
                  </button>
                )}
                {photoSubmitted && (
                  <span className='text-green-600 font-semibold flex items-center gap-2'>
                    <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' />
                    </svg>
                    Submitted
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Capturing Modal */}
      {showCapturingModal && (
        <div className='fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] p-4'>
          <div className='bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden'>
            <div className='bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5'>
              <h2 className='text-xl font-bold text-white'>Capturing Fingerprint</h2>
              <p className='text-blue-100 text-sm mt-1'>Keep your finger steady on the scanner</p>
            </div>
            <div className='px-6 py-6'>
              <div className='flex justify-center mb-4'>
                <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
              </div>
              <p className='text-center text-gray-700 mb-6'>{capturingStep}</p>
              <button 
                type='button' 
                onClick={() => setShowCapturingModal(false)} 
                className='w-full px-4 py-2.5 bg-gray-500 hover:bg-gray-600 text-white rounded-md font-medium transition-colors'
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fingerprint Preview Modal */}
      {showFingerprintPreviewModal && (
        <div className='fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] p-4'>
          <div className='bg-white rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden'>
            <div className='bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5'>
              <h2 className='text-xl font-bold text-white'>Fingerprint Preview</h2>
              <p className='text-blue-100 text-sm mt-1'>Review and confirm before enrolling</p>
            </div>
            <div className='px-6 py-6'>
              <div className='grid grid-cols-2 gap-4 mb-4'>
                <div className='bg-gray-50 rounded-lg p-3 border border-gray-200'>
                  <p className='text-xs text-gray-500 uppercase'>Quality</p>
                  <p className='text-lg font-semibold text-gray-800'>{pendingCaptureResult?.quality || 0}%</p>
                </div>
                <div className='bg-gray-50 rounded-lg p-3 border border-gray-200'>
                  <p className='text-xs text-gray-500 uppercase'>Position</p>
                  <p className='text-lg font-semibold text-gray-800'>{pendingFingerPosition}</p>
                </div>
              </div>
            </div>
            <div className='flex gap-3 p-6 border-t border-gray-200 bg-gray-50'>
              <button 
                onClick={handleAcceptFingerprintPreview} 
                disabled={fingerprintCapturing} 
                className='flex-1 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium transition-colors disabled:opacity-50'
              >
                Accept & Enroll
              </button>
              <button 
                onClick={handleRejectFingerprintPreview} 
                disabled={fingerprintCapturing} 
                className='flex-1 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-md font-medium transition-colors disabled:opacity-50'
              >
                Retake
              </button>
              <button 
                onClick={handleCancelFingerprintPreview} 
                disabled={fingerprintCapturing} 
                className='px-4 py-2.5 bg-gray-500 hover:bg-gray-600 text-white rounded-md font-medium transition-colors disabled:opacity-50'
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Webcam Modal */}
      {showWebcamModal && (
        <div className='fixed inset-0 bg-black/75 flex items-center justify-center z-[9999] p-4'>
          <div className='bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden'>
            <div className='border-b px-6 py-4 flex justify-between items-center bg-gray-50'>
              <h2 className='text-xl font-bold text-gray-800 flex items-center gap-2'>
                <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z' />
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 13a3 3 0 11-6 0 3 3 0 016 0z' />
                </svg>
                Capture Photograph
              </h2>
              <button 
                onClick={cancelWebcamModal} 
                className='text-gray-400 hover:text-gray-600 transition-colors'
              >
                <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                </svg>
              </button>
            </div>
            <div className='px-6 py-6'>
              {streamActive && !webcamCapturedPhoto && (
                <Webcam 
                  ref={webcamRef} 
                  audio={false} 
                  screenshotFormat='image/jpeg' 
                  className='w-full max-w-sm mx-auto rounded-lg border-2 border-gray-300 bg-black' 
                  videoConstraints={{ width: 480, height: 480, facingMode: 'user' }}
                  onUserMedia={() => setWebcamReady(true)}
                  onError={() => { toast.error('Webcam error: Unable to access camera'); setStreamActive(false); }}
                />
              )}
              {webcamCapturedPhoto && (
                <img 
                  src={webcamCapturedPhoto} 
                  alt='Captured Preview' 
                  className='w-full max-w-sm mx-auto rounded-lg border-2 border-green-400 shadow-lg' 
                />
              )}
              <div className='flex gap-3 mt-6'>
                <button 
                  type='button' 
                  onClick={submitPhotoFromModal} 
                  disabled={uploadingFiles || !webcamCapturedPhoto} 
                  className='flex-1 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2'
                >
                  <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
                  </svg>
                  {uploadingFiles ? 'Submitting...' : 'Submit'}
                </button>
                <button 
                  type='button' 
                  onClick={webcamCapturedPhoto ? retakePhotoInModal : capturePhotoInModal} 
                  className='flex-1 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-md font-medium transition-colors flex items-center justify-center gap-2'
                >
                  <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.001 0 01-15.357-2m15.356 2H15' />
                  </svg>
                  {webcamCapturedPhoto ? 'Recapture' : 'Capture'}
                </button>
                <button 
                  type='button' 
                  onClick={cancelWebcamModal} 
                  className='px-4 py-2.5 bg-gray-500 hover:bg-gray-600 text-white rounded-md font-medium transition-colors'
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Device Settings Modal */}
      {showDeviceSettings && (
        <div className='fixed inset-0 bg-black/75 flex items-center justify-center z-[9999] p-4'>
          <div className='bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-y-auto'>
            <div className='border-b px-6 py-4 flex justify-between items-center bg-gray-50'>
              <div>
                <h2 className='text-xl font-bold text-gray-800'>Device Settings & Diagnostics</h2>
                <p className='text-sm text-gray-500 mt-1'>Test Mantra MFS500 device connectivity</p>
              </div>
              <button 
                onClick={() => setShowDeviceSettings(false)} 
                className='text-gray-400 hover:text-gray-600 transition-colors'
              >
                <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                </svg>
              </button>
            </div>
            <div className='px-6 py-6'>
              <div className='grid grid-cols-2 gap-3 mb-6'>
                <button 
                  onClick={() => runDiagnostic('Check Device', testCheckDevice)} 
                  disabled={diagnosticLoading === 'Check Device'} 
                  className='px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2'
                >
                  <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' />
                  </svg>
                  Check Device
                </button>
                <button 
                  onClick={() => runDiagnostic('Capture', testCapture)} 
                  disabled={diagnosticLoading === 'Capture'} 
                  className='px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2'
                >
                  <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z' />
                  </svg>
                  Capture
                </button>
                <button 
                  onClick={() => runDiagnostic('Get Info', testGetInfo)} 
                  disabled={diagnosticLoading === 'Get Info'} 
                  className='px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2'
                >
                  <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
                  </svg>
                  Get Info
                </button>
                <button 
                  onClick={() => runDiagnostic('Get Image', testGetImage)} 
                  disabled={diagnosticLoading === 'Get Image'} 
                  className='px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2'
                >
                  <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' />
                  </svg>
                  Get Image
                </button>
              </div>
              {Object.keys(diagnosticResults).length > 0 && (
                <div className='mt-6 pt-6 border-t border-gray-200'>
                  <p className='font-semibold text-gray-800 mb-4 flex items-center gap-2'>
                    <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' />
                    </svg>
                    Test Results
                  </p>
                  <div className='space-y-3'>
                    {Object.entries(diagnosticResults).map(([testName, result]: [string, any]) => (
                      <div 
                        key={testName} 
                        className='p-4 rounded-lg border-2 flex items-center justify-between' 
                        style={{ 
                          backgroundColor: result.success ? '#ecfdf5' : '#fef2f2', 
                          borderColor: result.success ? '#10b981' : '#ef4444' 
                        }}
                      >
                        <div className='flex items-center gap-3'>
                          {result.success ? (
                            <svg className='w-5 h-5 text-green-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' />
                            </svg>
                          ) : (
                            <svg className='w-5 h-5 text-red-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z' />
                            </svg>
                          )}
                          <span className='font-medium' style={{ color: result.success ? '#059669' : '#dc2626' }}>
                            {testName}
                          </span>
                        </div>
                        <span className='text-xs text-gray-500'>{result.timestamp}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <button 
                onClick={() => setShowDeviceSettings(false)} 
                className='mt-6 w-full px-4 py-2.5 bg-gray-600 hover:bg-gray-700 text-white rounded-md font-medium transition-colors'
              >
                Close Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Duplicate Fingerprint Error Modal */}
      {showDuplicateModal && duplicateMatchInfo && (
        <div className='fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] p-4'>
          <div className='bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-auto border border-gray-200'>
            <div className='bg-gradient-to-r from-red-600 to-red-700 px-6 py-5'>
              <div className='flex items-center gap-4'>
                <div className='bg-white/20 rounded-full p-3'>
                  <svg className='w-8 h-8 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' />
                  </svg>
                </div>
                <div>
                  <h2 className='text-xl font-bold text-white'>Duplicate Fingerprint Detected</h2>
                  <p className='text-red-100 text-sm mt-1'>This user already exists in the system</p>
                </div>
              </div>
            </div>
            <div className='px-6 py-6'>
              <div className='bg-red-50 border-l-4 border-red-500 rounded-r-lg p-4 mb-5'>
                <p className='text-sm font-medium text-red-800'>Cannot enroll this fingerprint. It matches an existing record.</p>
              </div>
              <div className='bg-gray-50 rounded-lg p-4 border border-gray-200'>
                <h3 className='text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide'>Existing Record Details</h3>
                <div className='space-y-3'>
                  <div className='flex items-center justify-between py-2 border-b border-gray-200'>
                    <span className='text-sm text-gray-600'>Application ID</span>
                    <span className='text-sm font-semibold text-gray-900'>{duplicateMatchInfo.applicationId}</span>
                  </div>
                  {duplicateMatchInfo.almsLicenseId && (
                    <div className='flex items-center justify-between py-2 border-b border-gray-200'>
                      <span className='text-sm text-gray-600'>License ID</span>
                      <span className='text-sm font-semibold text-gray-900'>{duplicateMatchInfo.almsLicenseId}</span>
                    </div>
                  )}
                  <div className='flex items-center justify-between py-2 border-b border-gray-200'>
                    <span className='text-sm text-gray-600'>Applicant Name</span>
                    <span className='text-sm font-semibold text-gray-900'>{duplicateMatchInfo.applicantName}</span>
                  </div>
                  <div className='flex items-center justify-between py-2'>
                    <span className='text-sm text-gray-600'>Finger Position</span>
                    <span className='text-sm font-semibold text-gray-900'>{duplicateMatchInfo.fingerPosition}</span>
                  </div>
                </div>
              </div>
              <p className='text-gray-500 text-sm mt-4 text-center'>Please use a different finger or contact the administrator if you believe this is an error.</p>
            </div>
            <div className='border-t border-gray-200 px-6 py-4 bg-gray-50 flex justify-end'>
              <button 
                type='button' 
                onClick={() => { setShowDuplicateModal(false); setDuplicateMatchInfo(null); }} 
                className='px-5 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md font-medium text-sm transition-colors'
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Fingerprint Enrolled Modal */}
      {showSuccessModal && successInfo && (
        <div className='fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] p-4'>
          <div className='bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-200'>
            <div className='bg-gradient-to-r from-green-600 to-green-700 px-6 py-5'>
              <div className='flex items-center gap-4'>
                <div className='bg-white/20 rounded-full p-3'>
                  <svg className='w-8 h-8 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' />
                  </svg>
                </div>
                <div>
                  <h2 className='text-xl font-bold text-white'>Fingerprint Enrolled Successfully</h2>
                  <p className='text-green-100 text-sm mt-1'>Biometric data saved to the system</p>
                </div>
              </div>
            </div>
            <div className='px-6 py-6'>
              <div className='bg-green-50 border-l-4 border-green-500 rounded-r-lg p-4 mb-5'>
                <p className='text-sm font-medium text-green-800'>The fingerprint has been successfully captured and stored.</p>
              </div>
              <div className='bg-gray-50 rounded-lg p-4 border border-gray-200'>
                <h3 className='text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide'>Enrollment Details</h3>
                <div className='space-y-3'>
                  <div className='flex items-center justify-between py-2 border-b border-gray-200'>
                    <span className='text-sm text-gray-600'>Finger Position</span>
                    <span className='text-sm font-semibold text-gray-900'>{successInfo.fingerPosition}</span>
                  </div>
                  <div className='flex items-center justify-between py-2 border-b border-gray-200'>
                    <span className='text-sm text-gray-600'>Capture Quality</span>
                    <span className='text-sm font-semibold text-green-600'>{successInfo.quality}%</span>
                  </div>
                  <div className='flex items-center justify-between py-2'>
                    <span className='text-sm text-gray-600'>Enrolled At</span>
                    <span className='text-sm font-semibold text-gray-900'>{new Date(successInfo.enrolledAt).toLocaleString()}</span>
                  </div>
                </div>
              </div>
              <p className='text-gray-500 text-sm mt-4 text-center'>This window will close automatically in 5 seconds.</p>
            </div>
            <div className='border-t border-gray-200 px-6 py-4 bg-gray-50 flex justify-center'>
              <button 
                type='button' 
                onClick={() => { setShowSuccessModal(false); setSuccessInfo(null); }} 
                className='px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium text-sm transition-colors'
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Photo Success Modal */}
      {showPhotoSuccessModal && (
        <div className='fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] p-4'>
          <div className='bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200'>
            <div className='bg-gradient-to-r from-green-500 to-green-600 px-6 py-5'>
              <div className='flex items-center gap-4'>
                <div className='bg-white/20 rounded-full p-3'>
                  <svg className='w-8 h-8 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
                  </svg>
                </div>
                <div>
                  <h2 className='text-xl font-bold text-white'>Photo Uploaded!</h2>
                  <p className='text-green-100 text-sm mt-1'>Your photograph has been saved</p>
                </div>
              </div>
            </div>
            <div className='px-6 py-6'>
              <div className='flex justify-center mb-6'>
                <div className='relative'>
                  <div className='w-32 h-40 rounded-lg overflow-hidden border-4 border-green-500 shadow-lg'>
                    {photoPreview ? (
                      <img src={photoPreview} alt='Uploaded photograph' className='w-full h-full object-cover' />
                    ) : (
                      <div className='w-full h-full bg-gray-100 flex items-center justify-center'>
                        <svg className='w-12 h-12 text-gray-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className='absolute -bottom-2 -right-2 bg-green-500 rounded-full p-1.5 shadow-lg'>
                    <svg className='w-5 h-5 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={3} d='M5 13l4 4L19 7' />
                    </svg>
                  </div>
                </div>
              </div>
              <div className='text-center mb-4'>
                <p className='text-gray-700 font-medium'>Photograph uploaded successfully!</p>
                <p className='text-gray-500 text-sm mt-1'>Your photo has been saved to your application.</p>
              </div>
              <div className='flex items-center justify-center gap-2 text-sm text-gray-500'>
                <svg className='w-4 h-4 animate-spin' fill='none' viewBox='0 0 24 24'>
                  <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4'></circle>
                  <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'></path>
                </svg>
                <span>This message will close automatically</span>
              </div>
            </div>
            <div className='border-t border-gray-200 px-6 py-4 bg-gray-50 flex justify-center'>
              <button 
                type='button' 
                onClick={() => setShowPhotoSuccessModal(false)} 
                className='px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium text-sm transition-colors flex items-center gap-2'
              >
                <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
                </svg>
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Photo Error Modal */}
      {showPhotoErrorModal && (
        <div className='fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] p-4'>
          <div className='bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200'>
            <div className='bg-gradient-to-r from-red-500 to-red-600 px-6 py-5'>
              <div className='flex items-center gap-4'>
                <div className='bg-white/20 rounded-full p-3'>
                  <svg className='w-8 h-8 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                  </svg>
                </div>
                <div>
                  <h2 className='text-xl font-bold text-white'>Upload Failed</h2>
                  <p className='text-red-100 text-sm mt-1'>There was a problem uploading your photo</p>
                </div>
              </div>
            </div>
            <div className='px-6 py-6'>
              <div className='flex justify-center mb-6'>
                <div className='w-20 h-20 bg-red-100 rounded-full flex items-center justify-center'>
                  <svg className='w-10 h-10 text-red-500' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' />
                  </svg>
                </div>
              </div>
              <div className='text-center mb-4'>
                <p className='text-gray-700 font-medium'>Failed to upload photograph</p>
                <p className='text-gray-500 text-sm mt-2 bg-gray-100 rounded-lg p-3'>{photoErrorMessage || 'An unexpected error occurred. Please try again.'}</p>
              </div>
              <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-3'>
                <div className='flex items-start gap-2'>
                  <svg className='w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0' fill='currentColor' viewBox='0 0 20 20'>
                    <path fillRule='evenodd' d='M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z' clipRule='evenodd' />
                  </svg>
                  <div className='text-sm text-yellow-800'>
                    <p className='font-medium'>Try these steps:</p>
                    <ul className='mt-1 list-disc list-inside text-yellow-700'>
                      <li>Check your internet connection</li>
                      <li>Try capturing the photo again</li>
                      <li>Ensure good lighting for the photo</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            <div className='border-t border-gray-200 px-6 py-4 bg-gray-50 flex justify-center gap-3'>
              <button 
                type='button' 
                onClick={() => { setShowPhotoErrorModal(false); setPhotoErrorMessage(''); }} 
                className='px-6 py-2.5 bg-gray-500 hover:bg-gray-600 text-white rounded-md font-medium text-sm transition-colors'
              >
                Close
              </button>
              <button 
                type='button' 
                onClick={() => { setShowPhotoErrorModal(false); setPhotoErrorMessage(''); openWebcamModal(); }} 
                className='px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium text-sm transition-colors flex items-center gap-2'
              >
                <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.001 0 01-15.357-2m15.356 2H15' />
                </svg>
                Try Again
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
});

BiometricInformation.displayName = 'BiometricInformation';

export default BiometricInformation;