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
import { ApplicationService } from '../../../../api/applicationService';
import MantraSDKService from '../../../../services/mantraSDKService';
import BiometricAPIService from '../../../../services/biometricAPIService';
import { openAttachment } from '../../../../utils/attachmentViewer';

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
    isReadOnly?: boolean;
    errors?: ErrorsMap;
  },
  ref,
) {
  const { formData, renewalId, onPrevious, onNext, onSaveToDraft, isReadOnly = false, errors = {} } = props;
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

  const [uploadedPhotoId, setUploadedPhotoId] = useState<number | null>(null);
  const [showPhotoDeleteConfirm, setShowPhotoDeleteConfirm] = useState(false);
  const [cameraPermissionDenied, setCameraPermissionDenied] = useState(false);

  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');

  const handleDevices = React.useCallback(
    (mediaDevices: MediaDeviceInfo[]) => {
      const videoDevices = mediaDevices.filter(({ kind }) => kind === "videoinput");
      setDevices(videoDevices);
      if (videoDevices.length > 0 && !selectedDeviceId) {
        setSelectedDeviceId(videoDevices[0].deviceId);
      }
    },
    [selectedDeviceId]
  );

  useEffect(() => {
    if (!showWebcamModal) return;
    if (typeof navigator !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
      navigator.mediaDevices.enumerateDevices().then(handleDevices).catch(err => {
        console.warn('[Webcam] Enumerate devices failed:', err);
      });
    }
  }, [showWebcamModal, handleDevices]);

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

  // Sync photo state from formData.photographUploaded
  useEffect(() => {
    const photoDoc = formData?.photographUploaded;
    if (photoDoc) {
      setUploadedPhotoId(photoDoc.id || null);
      setPhotoPreview(photoDoc.fileUrl || photoDoc.url || null);
      setPhotoSubmitted(true);
    } else {
      setUploadedPhotoId(null);
      setPhotoPreview(null);
      setPhotoSubmitted(false);
    }
  }, [formData?.photographUploaded]);

  useEffect(() => {
    const fetchFingerprints = async () => {
      if (!renewalId) return;
      try {
        const fingerprints = await BiometricAPIService.getEnrolledFingerprints(renewalId);
        if (Array.isArray(fingerprints) && fingerprints.length > 0) {
          const mapped = fingerprints.map((fp: any) => ({
            id: fp.id || fp.fingerprintId || null,
            position: fp.fingerPosition || fp.position || 'RIGHT_THUMB',
            enrolledAt: fp.enrolledAt || fp.createdAt || null,
            quality: fp.quality || 100,
            bitmapData: fp.bitmapData || fp.image || fp.bitmap_data || null
          }));
          setEnrolledFingerprints(mapped);
        }
      } catch (err) {
        console.warn('[BiometricInformation] Failed to fetch enrolled fingerprints:', err);
      }
    };
    fetchFingerprints();
  }, [renewalId]);

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

  /** 📷 Handle camera permission state using Permissions API */
  useEffect(() => {
    if (!showWebcamModal) return;

    let permissionStatus: PermissionStatus | null = null;

    const handleStateChange = () => {
      if (!permissionStatus) return;
      console.log('📷 [Permissions API] Camera state is:', permissionStatus.state);
      if (permissionStatus.state === 'denied') {
        // Do NOT setStreamActive(false) or setCameraPermissionDenied(true) automatically here.
        // False negatives are common in Electron or HTTP setups. We let react-webcam mount and attempt getUserMedia.
        console.warn('📷 [Permissions API] Camera permission is denied by query, but attempting to mount Webcam for real-time validation.');
      } else if (permissionStatus.state === 'granted') {
        setCameraPermissionDenied(false);
        setStreamActive(true);
      } else if (permissionStatus.state === 'prompt') {
        setCameraPermissionDenied(false);
        setStreamActive(true);
      }
    };

    const setupPermissionsQuery = async () => {
      if (typeof navigator !== 'undefined' && navigator.permissions && navigator.permissions.query) {
        try {
          const status = await navigator.permissions.query({ name: 'camera' as PermissionName });
          permissionStatus = status;
          handleStateChange();
          status.onchange = handleStateChange;
        } catch (e) {
          console.warn('[BiometricInformation] Camera Permissions API query not fully supported:', e);
        }
      }
    };

    setupPermissionsQuery();

    return () => {
      if (permissionStatus) {
        permissionStatus.onchange = null;
      }
    };
  }, [showWebcamModal]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files } = e.target;
    if (files && files[0]) {
      const file = files[0];
      if (name === 'photograph') {
        // Check if photograph already exists
        if (uploadedPhotoId || photoSubmitted) {
          toast.error('Please delete the existing photograph first.');
          e.target.value = '';
          return;
        }

        // 1. Supported File Types: .jpg, .jpeg, .png
        const allowedExtensions = ['jpg', 'jpeg', 'png'];
        const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
        const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png'];
        if (!allowedExtensions.includes(fileExtension) || !allowedMimeTypes.includes(file.type)) {
          toast.error('Unsupported file format. Please upload a JPG, JPEG, or PNG image.');
          e.target.value = '';
          return;
        }

        // 2. File Size Validation: 20 KB - 5 MB
        const minSize = 20 * 1024;
        const maxSize = 5 * 1024 * 1024;
        if (file.size < minSize) {
          toast.error('File size too small. Minimum allowed size is 20 KB.');
          e.target.value = '';
          return;
        }
        if (file.size > maxSize) {
          toast.error('File size too large. Maximum allowed size is 5 MB.');
          e.target.value = '';
          return;
        }

        // 3. Image Validation (Corrupt / Unreadable check)
        const isValidImg = await new Promise<boolean>((resolve) => {
          const img = new Image();
          const objectUrl = URL.createObjectURL(file);
          img.src = objectUrl;
          img.onload = () => {
            URL.revokeObjectURL(objectUrl);
            resolve(true);
          };
          img.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            resolve(false);
          };
        });

        if (!isValidImg) {
          toast.error('The uploaded image file appears to be corrupted or unreadable. Please choose a valid image.');
          e.target.value = '';
          return;
        }

        const url = URL.createObjectURL(file);
        setPhotoPreview(url);
        
        // Notify parent
        props.onFileChange('photographUploaded', file);
      }
    }
  };

  const confirmRemovePhoto = async () => {
    if (uploadedPhotoId) {
      try {
        setUploadingFiles(true);
        setUploadProgress('Deleting photograph...');
        await RenewalService.deleteRenewalFile(uploadedPhotoId);
        setUploadedPhotoId(null);
        setPhotoPreview(null);
        setPhotoSubmitted(false);
        setShowPhotoDeleteConfirm(false);
        props.onFileChange('photographUploaded', null);
        toast.success('Photograph deleted successfully!');
      } catch (err: any) {
        const errMsg = err?.response?.data?.error || err?.message || 'Failed to delete photograph.';
        toast.error(errMsg);
      } finally {
        setUploadingFiles(false);
        setUploadProgress('');
      }
    } else {
      setPhotoPreview(null);
      setPhotoSubmitted(false);
      setShowPhotoDeleteConfirm(false);
      props.onFileChange('photographUploaded', null);
    }
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
      
      // STEP 1: Verify against the fresh application's original fingerprint
      if (formData?.applicationId) {
        setUploadProgress('Verifying against original fresh application fingerprint...');
        const freshResponse = await ApplicationService.getApplication(formData.applicationId);
        const freshData = freshResponse?.data || freshResponse;
        if (freshData) {
          const bioData = freshData.biometricData?.biometricData || freshData.biometricData || null;
          const fingerprints = bioData?.fingerprints || [];
          const originalFp = fingerprints.find((f: any) => f.position === pendingFingerPosition);
          if (originalFp && originalFp.template) {
            const matchResult = await MantraSDKService.verifyTemplate(originalFp.template, pendingCaptureResult.template, 65);
            if (!matchResult.isMatch && matchResult.score < 65) {
              toast.error(`Verification failed: Captured fingerprint does not match the registered ${pendingFingerPosition === 'LEFT_THUMB' ? 'Left hand thumb print' : 'Right hand thumb print'} from the fresh application.`);
              setFingerprintCapturing(false);
              setUploadProgress('');
              return;
            }
          }
        }
      }

      setUploadProgress('Fetching stored templates for matching...');
      const biometricTemplate = {
        template: pendingCaptureResult.template,
        quality: pendingCaptureResult.quality,
        captureTime: pendingCaptureResult.captureTime!,
        bitmapData: pendingCaptureResult.bitmapData,
      };
      // For renewal applications, we do not perform duplicate fingerprint check
      // as the applicant's fingerprint will match their own original record in the system.
      setUploadProgress('Storing fingerprint...');
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

  const openWebcamModal = () => {
    setShowWebcamModal(true);
    setWebcamCapturedPhoto(null);
    setStreamActive(true);
    setWebcamReady(false);
    setCameraPermissionDenied(false);
  };

  const capturePhotoInModal = () => {
    if (!webcamRef.current) { toast.error('Webcam not ready. Please wait.'); return; }
    if (!webcamReady) { toast.error('Camera stream not ready. Please wait a moment.'); return; }
    const dataUrl = webcamRef.current.getScreenshot();
    if (!dataUrl) { toast.error('Failed to capture photo. Ensure webcam is active.'); return; }
    setWebcamCapturedPhoto(dataUrl);
    setStreamActive(false);
  };

  const retakePhotoInModal = () => {
    setWebcamCapturedPhoto(null);
    setStreamActive(true);
    setWebcamReady(false);
    setCameraPermissionDenied(false);
  };

  const submitPhotoFromModal = async () => {
    if (!webcamCapturedPhoto) {
      toast.warning('Please capture a photo first.');
      return;
    }
    if (uploadedPhotoId || photoSubmitted) {
      toast.error('Please delete the existing photograph first.');
      return;
    }
    try {
      setUploadingFiles(true);
      setUploadProgress('Submitting photograph...');

      const dataURLtoBlob = (dataurl: string) => {
        const arr = dataurl.split(',');
        const mime = arr[0].match(/:(.*?);/)![1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        return new Blob([u8arr], { type: mime });
      };

      const blob = dataURLtoBlob(webcamCapturedPhoto);

      const minSize = 2 * 1024;
      const maxSize = 5 * 1024 * 1024;
      if (blob.size < minSize) {
        toast.error('Captured photograph size is too small. Please ensure your camera is working correctly.');
        return;
      }
      if (blob.size > maxSize) {
        toast.error('Captured photograph size is too large (over 5 MB).');
        return;
      }

      const file = new File([blob], 'photograph.jpg', { type: 'image/jpeg' });
      setPhotoPreview(webcamCapturedPhoto);

      if (renewalId) {
        props.onFileChange('photographUploaded', file);
        setShowWebcamModal(false);
        setWebcamCapturedPhoto(null);
        setStreamActive(false);
        setWebcamReady(false);
        setShowPhotoSuccessModal(true);
        setTimeout(() => setShowPhotoSuccessModal(false), 5000);
      } else {
        toast.warning('Please create renewal application first.');
        setShowWebcamModal(false);
        setWebcamCapturedPhoto(null);
        setStreamActive(false);
        setWebcamReady(false);
      }
    } catch (err: any) {
      setPhotoErrorMessage(err?.message || 'Failed to submit photograph.');
      setShowPhotoErrorModal(true);
      setShowWebcamModal(false);
      setWebcamCapturedPhoto(null);
      setStreamActive(false);
      setWebcamReady(false);
    } finally {
      setUploadingFiles(false);
      setUploadProgress('');
    }
  };

  const cancelWebcamModal = () => {
    setShowWebcamModal(false);
    setWebcamCapturedPhoto(null);
    setStreamActive(false);
    setWebcamReady(false);
    setCameraPermissionDenied(false);
  };

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
            {!isReadOnly && (
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
            )}
          </div>

          {!isReadOnly && (
          <>
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
          </>
          )}

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
                  <div className='space-y-1 text-sm'>
                    <p><span className='text-gray-500'>Position:</span> <b className='text-gray-800'>{latestFp.position}</b></p>
                    <p><span className='text-gray-500'>Quality:</span> <b className={latestFp.quality >= 60 ? 'text-green-600' : 'text-red-600'}>{latestFp.quality}%</b></p>
                    {latestFp.id && (
                      <p>
                        <span className='text-gray-500'>Fingerprint ID (API):</span>{' '}
                        <code className='text-xs bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200 text-gray-700 font-mono'>
                          {latestFp.id}
                        </code>
                      </p>
                    )}
                    {latestFp.enrolledAt && (
                      <p>
                        <span className='text-gray-500'>Enrolled At:</span>{' '}
                        <span className='text-xs text-gray-600 font-semibold'>
                          {new Date(latestFp.enrolledAt).toLocaleString()}
                        </span>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>

        {!isReadOnly && (
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
        )}
      </div>

      {/* Photograph Section */}
      <div className='bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden p-6 mt-6'>
        <div className='flex items-center space-x-2 mb-4 border-b border-gray-100 pb-3'>
          <span className='text-xl'>📸</span>
          <h3 className='text-lg font-bold text-gray-800'>Photograph Capture & Upload</h3>
        </div>
        
        <p className='text-sm text-gray-500 mb-4 leading-relaxed'>
          Upload a recent passport-size photograph (JPG, JPEG, PNG, max 5 MB) or capture using your webcam.
        </p>

        <div className='grid md:grid-cols-2 gap-6 items-stretch'>
          {/* Webcam & Upload Section */}
          {!isReadOnly && (
          <div className='flex flex-col justify-between space-y-4 border border-gray-100 rounded-xl p-4 bg-slate-50/50'>
            <div className='space-y-3'>
              <button
                type='button'
                onClick={openWebcamModal}
                disabled={Boolean(photoPreview || photoSubmitted)}
                className={`w-full px-4 py-3 text-white rounded-lg font-semibold flex items-center justify-center space-x-2 transition-all shadow-sm ${
                  Boolean(photoPreview || photoSubmitted)
                    ? 'bg-gray-300 cursor-not-allowed text-gray-500'
                    : 'bg-blue-600 hover:bg-blue-700 active:scale-[0.98]'
                }`}
              >
                <span>📷</span>
                <span>Capture with Webcam</span>
              </button>
              
              <div className='relative flex items-center justify-center my-2'>
                <div className='absolute inset-0 flex items-center'><span className='w-full border-t border-gray-200' /></div>
                <span className='relative bg-slate-50 px-3 text-xs text-gray-400 font-medium uppercase'>or</span>
              </div>

              <label
                className={`relative flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-5 text-center transition-all group ${
                  Boolean(photoPreview || photoSubmitted)
                    ? 'border-gray-200 bg-gray-100/50 text-gray-400 cursor-not-allowed'
                    : 'border-gray-300 text-gray-600 cursor-pointer hover:border-blue-500 hover:bg-blue-50/30'
                }`}
              >
                <span className='text-2xl mb-1 transition-transform group-hover:scale-110'>📤</span>
                <span className={`text-sm font-semibold transition-colors ${
                  Boolean(photoPreview || photoSubmitted) ? 'text-gray-400' : 'text-gray-700 group-hover:text-blue-600'
                }`}>
                  Upload Photograph
                </span>
                <span className='text-xs text-gray-400 mt-1'>Supports JPG, JPEG, PNG (20 KB - 5 MB)</span>
                <input
                  type='file'
                  name='photograph'
                  accept='.jpg,.jpeg,.png'
                  disabled={Boolean(photoPreview || photoSubmitted)}
                  className='hidden'
                  onChange={handleFileChange}
                />
              </label>
            </div>
          </div>
          )}

          {/* Preview Section */}
          <div className='flex flex-col items-center justify-center border border-gray-100 rounded-xl p-4 bg-slate-50/50 min-h-[200px]'>
            {photoPreview ? (
              <div className='flex flex-col items-center w-full'>
                <div className='relative p-2 bg-white rounded-lg shadow-md border border-gray-200'>
                  <img
                    src={photoPreview}
                    alt='Captured Preview'
                    className='w-40 h-40 object-cover rounded-md'
                  />
                  <span className={`absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded shadow ${
                    photoSubmitted ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-amber-100 text-amber-700 border border-amber-200'
                  }`}>
                    {photoSubmitted ? '✓ Submitted' : '⚠ Pending'}
                  </span>
                </div>
                
                {isReadOnly ? (
                  <div className='flex-1 text-center py-2 text-sm font-semibold text-green-600 bg-green-50 rounded-lg border border-green-200 mt-4'>
                    ✓ Photo Saved
                  </div>
                ) : showPhotoDeleteConfirm ? (
                  <div className='mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-center w-full max-w-[260px] animate-fade-in'>
                    <p className='text-xs font-semibold text-red-700 leading-normal mb-3'>
                      Are you sure you want to delete the photograph? This action cannot be undone.
                    </p>
                    <div className='flex gap-2 justify-center'>
                      <button
                        type='button'
                        onClick={confirmRemovePhoto}
                        disabled={uploadingFiles}
                        className='px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs rounded transition-colors shadow-sm'
                      >
                        {uploadingFiles ? 'Deleting...' : 'Yes, Delete'}
                      </button>
                      <button
                        type='button'
                        onClick={() => setShowPhotoDeleteConfirm(false)}
                        disabled={uploadingFiles}
                        className='px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold text-xs rounded transition-colors'
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className='flex gap-2 mt-4 w-full max-w-[240px]'>
                    {!photoSubmitted ? (
                      <button
                        type='button'
                        onClick={submitPhoto}
                        disabled={uploadingFiles}
                        className='flex-1 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold text-sm transition-all shadow-sm'
                      >
                        {uploadingFiles ? 'Uploading...' : 'Submit Photo'}
                      </button>
                    ) : (
                      <div className='flex-1 text-center py-2 text-sm font-semibold text-green-600 bg-green-50 rounded-lg border border-green-200'>
                        ✓ Photo Saved
                      </div>
                    )}
                    <button
                      type='button'
                      onClick={() => setShowPhotoDeleteConfirm(true)}
                      disabled={uploadingFiles}
                      className='px-3 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold text-sm transition-all shadow-sm'
                      title='Delete photograph'
                    >
                      🗑️ Delete
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className='flex flex-col items-center text-center text-gray-400 p-6'>
                <div className='w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-3xl mb-2'>👤</div>
                <p className='text-sm font-medium'>No Photograph Selected</p>
                <p className='text-xs text-gray-400 mt-1 max-w-[200px]'>Capture from your webcam or upload a file to preview</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Webcam Modal */}
      {showWebcamModal && (
        <div
          className='fixed inset-0 bg-black/75 flex items-center justify-center z-[9999] p-4'
          style={{ display: 'flex', visibility: 'visible' }}
        >
          <div className='bg-white rounded-lg shadow-2xl max-w-lg w-full max-h-[90vh] overflow-auto'>
            <div className='border-b px-6 py-4 sticky top-0 bg-white flex justify-between items-center'>
              <div>
                <h2 className='text-2xl font-bold text-gray-800'>📷 Capture Photograph</h2>
                <p className='text-sm text-gray-500 mt-1'>
                  {webcamCapturedPhoto
                    ? 'Review your photo before submitting'
                    : 'Position yourself and capture'}
                </p>
              </div>
              <button
                onClick={cancelWebcamModal}
                disabled={uploadingFiles}
                className='text-gray-600 hover:text-gray-900 text-2xl font-bold'
              >
                ✕
              </button>
            </div>

            <div className='px-6 py-6'>
              {/* Camera Device Selection Dropdown */}
              {devices.length > 1 && !webcamCapturedPhoto && (
                <div className='mb-4'>
                  <label className='block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1'>Select Camera Device</label>
                  <select
                    value={selectedDeviceId}
                    onChange={(e) => setSelectedDeviceId(e.target.value)}
                    className='w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent bg-white text-sm'
                  >
                    {devices.map((device, idx) => (
                      <option key={device.deviceId} value={device.deviceId}>
                        {device.label || `Camera ${idx + 1}`}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Camera / Preview Display */}
              <div className='flex justify-center mb-6'>
                <div className='relative'>
                  {/* Camera Permission States: request | denied | loading | live | captured */}
                  {!streamActive && !cameraPermissionDenied && !webcamCapturedPhoto ? (
                    <div className='w-72 h-72 rounded-lg border-2 border-blue-300 bg-blue-50 flex flex-col items-center justify-center p-6'>
                      <div className='w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mb-4'>
                        <svg className='w-7 h-7 text-blue-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z' />
                        </svg>
                      </div>
                      <h3 className='text-lg font-bold text-gray-800 mb-2'>Camera Access Needed</h3>
                      <p className='text-sm text-gray-600 text-center leading-relaxed mb-4'>
                        This application needs access to your camera to capture a live photograph for the license application.
                      </p>
                      <button
                        type='button'
                        onClick={() => { setStreamActive(true); setWebcamReady(false); }}
                        className='px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-sm transition-colors shadow-md'
                      >
                        Grant Camera Access
                      </button>
                    </div>
                  ) : cameraPermissionDenied ? (
                    <div className='w-72 h-72 rounded-lg border-2 border-red-300 bg-gray-50 flex flex-col items-center justify-center p-6'>
                      <div className='w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mb-4'>
                        <svg className='w-7 h-7 text-red-500' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636' />
                        </svg>
                      </div>
                      <h3 className='text-lg font-bold text-gray-800 mb-2'>Camera Access Denied</h3>
                      <p className='text-sm text-gray-600 text-center leading-relaxed mb-6'>
                        Camera access is required to capture a photograph.
                      </p>
                      <button
                        type='button'
                        onClick={() => { setCameraPermissionDenied(false); setStreamActive(true); setWebcamReady(false); }}
                        className='px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors shadow-md'
                      >
                        Try Again
                      </button>
                    </div>
                  ) : streamActive && !webcamCapturedPhoto ? (
                    <div className='relative w-72 h-72'>
                      {!webcamReady && (
                        <div className='absolute inset-0 w-full h-full rounded-lg border-2 border-gray-300 bg-gray-50 flex flex-col items-center justify-center z-10'>
                          <div className='animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4'></div>
                          <p className='text-sm text-gray-500'>Requesting camera access...</p>
                          <p className='text-xs text-gray-400 mt-1'>Please allow camera when prompted by your browser</p>
                        </div>
                      )}
                      <Webcam
                        ref={webcamRef}
                        audio={false}
                        screenshotFormat='image/jpeg'
                        className='w-full h-full object-cover rounded-lg border-2 border-gray-300 bg-gray-900'
                        videoConstraints={{
                          width: 480,
                          height: 480,
                          facingMode: selectedDeviceId ? undefined : 'user',
                          deviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined
                        }}
                        onUserMedia={() => { setWebcamReady(true); setCameraPermissionDenied(false); }}
                        onUserMediaError={(err: any) => {
                          console.error('❌ [Webcam] Camera access failure detailed:', err);
                          const errName = err?.name || '';
                          const errMsg = err?.message || '';
                          console.error(`❌ [Webcam] Error Name: ${errName}, Message: ${errMsg}`);
                          
                          if (errName === 'NotAllowedError' || errName === 'PermissionDeniedError' || errMsg.includes('Permission') || errMsg.includes('denied')) {
                            setStreamActive(false);
                            setCameraPermissionDenied(true);
                            toast.error('Camera permission was denied. Please allow camera access in browser settings.');
                          } else if (errName === 'NotFoundError' || errName === 'DevicesNotFoundError') {
                            setStreamActive(false);
                            toast.error('No camera device found on your system. Please connect a webcam.');
                          } else if (errName === 'NotReadableError' || errName === 'TrackStartError') {
                            setStreamActive(false);
                            toast.error('Camera is currently in use by another application (Zoom, Teams, etc.). Please close it and try again.');
                          } else if (errName === 'OverconstrainedError' || errName === 'ConstraintNotSatisfiedError') {
                            setStreamActive(false);
                            toast.error('Camera does not support the requested video constraints.');
                          } else {
                            setStreamActive(false);
                            setCameraPermissionDenied(true);
                            toast.error(`Unable to access camera (${errName || 'Error'}: ${errMsg || 'Unknown error'}).`);
                          }
                        }}
                      />
                    </div>
                  ) : null}

                  {/* Captured photo preview */}
                  {webcamCapturedPhoto && (
                    <img
                      src={webcamCapturedPhoto}
                      alt='Captured Preview'
                      className='w-72 h-72 object-cover rounded-lg border-2 border-green-400 shadow-lg'
                    />
                  )}

                  {/* Status indicator */}
                  <div className='absolute bottom-2 left-1/2 transform -translate-x-1/2'>
                    <span
                      className={`text-white text-xs px-2 py-1 rounded ${webcamCapturedPhoto ? 'bg-green-600' : 'bg-black/50'}`}
                    >
                      {webcamCapturedPhoto ? '✓ Photo Captured' : 'Live Preview'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Instructions */}
              <div className='mb-6 p-3 bg-blue-50 rounded-lg border border-blue-200'>
                <p className='text-sm text-blue-700'>
                  {!webcamCapturedPhoto
                    ? '💡 Tip: Ensure good lighting and center your face in the frame. Click Capture when ready.'
                    : '💡 Tip: Review the photo above. Click Submit if satisfied, or Recapture to try again.'}
                </p>
              </div>

              {/* Action Buttons */}
              <div className='flex gap-3'>
                <button
                  type='button'
                  onClick={submitPhotoFromModal}
                  disabled={uploadingFiles || !webcamCapturedPhoto}
                  className={`flex-1 px-4 py-3 rounded-lg font-semibold text-white transition-colors ${
                    uploadingFiles || !webcamCapturedPhoto
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-green-600 hover:bg-green-700 active:bg-green-800'
                  }`}
                >
                  {uploadingFiles ? 'Submitting...' : '✓ Submit'}
                </button>
                <button
                  type='button'
                  onClick={webcamCapturedPhoto ? retakePhotoInModal : capturePhotoInModal}
                  disabled={uploadingFiles || (!webcamCapturedPhoto && !webcamReady)}
                  className={`flex-1 px-4 py-3 rounded-lg font-semibold text-white transition-colors ${
                    uploadingFiles || (!webcamCapturedPhoto && !webcamReady)
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-orange-500 hover:bg-orange-600 active:bg-orange-700'
                  }`}
                >
                  {webcamCapturedPhoto ? '↻ Recapture' : '📸 Capture'}
                </button>
                <button
                  type='button'
                  onClick={cancelWebcamModal}
                  disabled={uploadingFiles}
                  className={`flex-1 px-4 py-3 rounded-lg font-semibold text-white transition-colors ${
                    uploadingFiles
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-gray-500 hover:bg-gray-600 active:bg-gray-700'
                  }`}
                >
                  ✕ Close
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

      {/* Fingerprint Preview Modal */}
      {showFingerprintPreviewModal && pendingCaptureResult && (
        <div
          className='fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] p-4 text-left font-normal'
          style={{ display: 'flex', visibility: 'visible' }}
        >
          <div className='bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-auto border border-gray-200'>
            <div className='bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5'>
              <div className='flex items-center gap-4'>
                <div className='bg-white/20 rounded-full p-3'>
                  <svg className='w-8 h-8 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11' />
                  </svg>
                </div>
                <div>
                  <h2 className='text-xl font-bold text-white'>Fingerprint Preview</h2>
                  <p className='text-blue-100 text-sm mt-1'>Review and confirm before enrolling</p>
                </div>
              </div>
            </div>

            <div className='px-6 py-6'>
              <div className='mb-6'>
                <div
                  className={`p-4 rounded-xl border-2 ${
                    (pendingCaptureResult?.quality || 0) >= 80
                      ? 'bg-green-50 border-green-300'
                      : (pendingCaptureResult?.quality || 0) >= 60
                        ? 'bg-yellow-50 border-yellow-300'
                        : 'bg-red-50 border-red-300'
                  }`}
                >
                  <div className='flex items-center justify-between mb-3'>
                    <div className='flex items-center gap-2'>
                      <span
                        className={`font-semibold ${
                          (pendingCaptureResult?.quality || 0) >= 80
                            ? 'text-green-700'
                            : (pendingCaptureResult?.quality || 0) >= 60
                              ? 'text-yellow-700'
                              : 'text-red-700'
                        }`}
                      >
                        {(pendingCaptureResult?.quality || 0) >= 80
                          ? 'Excellent Quality'
                          : (pendingCaptureResult?.quality || 0) >= 60
                            ? 'Good Quality'
                            : 'Low Quality - Consider Retaking'}
                      </span>
                    </div>
                    <span
                      className={`text-3xl font-bold ${
                        (pendingCaptureResult?.quality || 0) >= 80
                          ? 'text-green-600'
                          : (pendingCaptureResult?.quality || 0) >= 60
                            ? 'text-yellow-600'
                            : 'text-red-600'
                      }`}
                    >
                      {pendingCaptureResult?.quality || 0}%
                    </span>
                  </div>
                  <div className='w-full bg-gray-200 rounded-full h-3 overflow-hidden'>
                    <div
                      className={`h-3 rounded-full transition-all duration-500 ${
                        (pendingCaptureResult?.quality || 0) >= 80
                          ? 'bg-green-500'
                          : (pendingCaptureResult?.quality || 0) >= 60
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                      }`}
                      style={{ width: `${pendingCaptureResult?.quality || 0}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className='mb-6'>
                <h3 className='text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide'>
                  Captured Fingerprint
                </h3>
                <div className='flex justify-center bg-gradient-to-b from-gray-50 to-gray-100 rounded-xl p-6 min-h-[280px] items-center border border-gray-200'>
                  {fingerprintPreviewImage ? (
                    <div className='flex flex-col items-center gap-3'>
                      <div className='relative'>
                        <img
                          src={fingerprintPreviewImage}
                          alt='Fingerprint Preview'
                          className='max-w-full max-h-80 border-4 border-white rounded-lg shadow-lg'
                        />
                      </div>
                    </div>
                  ) : (
                    <div className='text-center py-8'>
                      <p className='text-gray-500 font-medium'>No preview image available</p>
                    </div>
                  )}
                </div>
              </div>

              <div className='mb-6'>
                <h3 className='text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide'>
                  Finger Position
                </h3>
                <div className='flex items-center gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200'>
                  <div className='bg-blue-600 rounded-full p-2 text-white'>
                    👆
                  </div>
                  <div>
                    <p className='font-bold text-blue-900'>
                      {pendingFingerPosition}
                    </p>
                    <p className='text-xs text-blue-700'>Selected biometric type</p>
                  </div>
                </div>
              </div>

              <div className='flex justify-end gap-3 pt-4 border-t border-gray-100'>
                <button
                  type='button'
                  onClick={handleCancelFingerprintPreview}
                  className='px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold transition-colors'
                >
                  Cancel
                </button>
                <button
                  type='button'
                  onClick={handleRejectFingerprintPreview}
                  className='px-5 py-2.5 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-semibold transition-colors'
                >
                  Retake
                </button>
                <button
                  type='button'
                  onClick={handleAcceptFingerprintPreview}
                  className='px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors shadow-sm'
                >
                  Accept & Enroll
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Capturing Status Modal */}
      {showCapturingModal && (
        <div
          className='fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] p-4 text-left font-normal'
          style={{ display: 'flex', visibility: 'visible' }}
        >
          <div className='bg-white rounded-xl shadow-2xl max-w-md w-full p-6 text-center space-y-4'>
            <div className='mx-auto w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin flex items-center justify-center'>
              <span className='text-2xl'>👆</span>
            </div>
            <h3 className='text-lg font-bold text-gray-900'>Biometric Scan in Progress</h3>
            <p className='text-sm text-gray-500'>{capturingStep}</p>
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
                    <span className='text-sm text-gray-600'>License ID</span>
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