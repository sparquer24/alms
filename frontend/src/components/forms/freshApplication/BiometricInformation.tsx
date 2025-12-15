'use client';
import React, { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { toast } from 'react-toastify';
// Load react-webcam dynamically to avoid SSR/type conflicts
// @ts-expect-error - dynamic import & react-webcam types can conflict with project React types
const Webcam = dynamic(() => import('react-webcam').then(mod => mod.default), {
  ssr: false,
}) as any;
import FormFooter from '../elements/footer';
import { useRouter, useSearchParams } from 'next/navigation';
import { FileUploadService } from '../../../services/fileUpload';
import { postData } from '../../../api/axiosConfig';
import { ApplicationService } from '../../../api/applicationService';
import { FORM_ROUTES } from '../../../config/formRoutes';
import MantraSDKService from '../../../services/mantraSDKService';
import BiometricAPIService from '../../../services/biometricAPIService';

type BiometricForm = {
  fingerprint: File | null;
  iris: File | null;
  photograph: File | null;
  signature: File | null;
};

const initialState: BiometricForm = {
  fingerprint: null,
  iris: null,
  photograph: null,
  signature: null,
};

const BiometricInformation = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const applicantId = searchParams?.get('applicantId') || searchParams?.get('id') || null;
  // Preserve the original query key used so we don't change `applicantId` -> `id` unexpectedly
  const queryIdKey = searchParams?.get('applicantId')
    ? 'applicantId'
    : searchParams?.get('id')
      ? 'id'
      : 'id';

  const [form, setForm] = useState<BiometricForm>(initialState);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [streamActive, setStreamActive] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [existingBiometricData, setExistingBiometricData] = useState<any | null>(null);
  const [photoSubmitted, setPhotoSubmitted] = useState(false);
  const [almsLicenseId, setAlmsLicenseId] = useState<string | null>(null);

  // Mantra SDK fingerprint capture states
  const [mantraSDKReady, setMantraSDKReady] = useState(false);
  const [fingerprintDeviceConnected, setFingerprintDeviceConnected] = useState(false);
  const [fingerprintCapturing, setFingerprintCapturing] = useState(false);
  const [enrolledFingerprints, setEnrolledFingerprints] = useState<any[]>([]);
  const [fingerprintPreviewImage, setFingerprintPreviewImage] = useState<string | null>(null);
  const [showFingerprintPreviewModal, setShowFingerprintPreviewModal] = useState(false);
  const [pendingCaptureResult, setPendingCaptureResult] = useState<any | null>(null);
  const [pendingFingerPosition, setPendingFingerPosition] = useState<string>('RIGHT_THUMB');

  // Device diagnostics/settings states
  const [showDeviceSettings, setShowDeviceSettings] = useState(false);
  const [diagnosticResults, setDiagnosticResults] = useState<any>({});
  const [diagnosticLoading, setDiagnosticLoading] = useState<string | null>(null);

  const webcamRef = useRef<any>(null);

  // Map frontend biometric keys to backend `FileType` enum values (Prisma)
  const FILE_TYPE_MAP = {
    photograph: 'PHOTOGRAPH',
    signature: 'SIGNATURE_THUMB',
    iris: 'IRIS_SCAN',
    fingerprint: 'SIGNATURE_THUMB', // thumb impression / signature thumb
  } as const;

  /** 🧩 Handle file input changes */
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

  /** 🧹 Clean up preview on unmount */
  useEffect(() => {
    // Initialize Mantra SDK
    const initializeMantra = async () => {
      const initialized = await MantraSDKService.initialize();
      setMantraSDKReady(initialized);

      if (initialized) {
        // Check device connectivity
        const deviceStatus = await MantraSDKService.isDeviceConnected();
        setFingerprintDeviceConnected(deviceStatus.isConnected);

        if (deviceStatus.isConnected) {
          toast.info('Fingerprint device detected and ready');
        } else {
          // Show warning with suggestion to use diagnostics
          toast.warning(
            'Fingerprint device not connected. Use Settings → Diagnostics to troubleshoot.'
          );
        }
      }
    };

    // Fetch existing application biometric data to render and merge when patching.
    // The backend sometimes returns a wrapper like:
    // { biometricData: { id, biometricData: { photo: {...}, ... }, applicationId } }
    // or directly: { biometricData: { photo: {...}, ... } }
    // Normalize to the inner biometric object so the rest of the component can
    // read `existingBiometricData.photo`, `existingBiometricData.signature`, etc.
    const loadExisting = async () => {
      if (!applicantId) return;
      try {
        const resp = await ApplicationService.getApplication(applicantId as string);
        const data = resp?.data || null;
        const bioWrapper = data?.biometricData || null;

        let normalized: any = null;
        if (bioWrapper) {
          // If the payload has a nested `biometricData` property, use that inner object
          if (bioWrapper.biometricData) normalized = bioWrapper.biometricData;
          else normalized = bioWrapper;
        }

        setExistingBiometricData(normalized);
        if (normalized?.photo?.url) setPhotoPreview(normalized.photo.url);
        // Capture ALMS license id from application data if present
        const licenseId = data?.almsLicenseId ?? data?.alms_license_id ?? data?.licenseId ?? null;
        if (licenseId) setAlmsLicenseId(licenseId);

        // Load enrolled fingerprints from backend
        if (applicantId) {
          try {
            const fingerprints = await BiometricAPIService.getEnrolledFingerprints(applicantId);
            setEnrolledFingerprints(fingerprints);
          } catch (err) {
            console.warn('Could not load enrolled fingerprints', err);
          }
        }
      } catch (err) {
        console.warn('Could not load existing biometric data', err);
      }
    };

    initializeMantra();
    loadExisting();

    // Cleanup: if a locally-created object URL was used for preview, revoke it when
    // the component unmounts or applicantId changes. If preview is a remote URL,
    // revokeObjectURL is harmless (no-op) in most browsers.
    return () => {
      if (photoPreview && photoPreview.startsWith('blob:')) URL.revokeObjectURL(photoPreview);
    };
  }, [applicantId]);

  /** 📸 Capture webcam photo */
  const capturePhoto = async () => {
    if (!webcamRef.current) return;
    const dataUrl = webcamRef.current.getScreenshot();
    if (!dataUrl) {
      toast.error('Failed to capture photo. Ensure webcam is active.');
      return;
    }

    setPhotoPreview(dataUrl);
    const blob = await (await fetch(dataUrl)).blob();
    const file = new File([blob], 'photograph.jpg', { type: 'image/jpeg' });
    setForm(prev => ({ ...prev, photograph: file }));

    // Optional: Upload captured photo as base64 to backend's upload-file endpoint
    if (applicantId) {
      const base64DataUrl = dataUrl; // "data:image/jpeg;base64,..."
      try {
        // compute size from blob
        const blobForSize = await (await fetch(base64DataUrl)).blob();
        const fileSize = blobForSize.size || 0;

        await postData(`/application-form/${encodeURIComponent(applicantId)}/upload-file`, {
          fileType: FILE_TYPE_MAP.photograph,
          fileUrl: base64DataUrl,
          fileName: 'photograph.jpg',
          fileSize,
          description: 'Photograph',
        });

        console.info('Photograph uploaded as base64 in fileUrl to upload-file');
      } catch (err: any) {
        console.warn('Failed to upload photograph as base64 to upload-file', err);
      }
    }

    setStreamActive(false);
  };

  const removePhoto = () => {
    setPhotoPreview(null);
    setForm(prev => ({ ...prev, photograph: null }));
    setPhotoSubmitted(false);
  };

  /** 📤 Submit captured photograph */
  const submitPhoto = async () => {
    if (!form.photograph || !photoPreview) {
      toast.warning('Please capture or upload a photograph first.');
      return;
    }

    try {
      setUploadingFiles(true);
      setUploadProgress('Submitting photograph...');

      if (applicantId) {
        // Upload the photograph file
        const photoFile = form.photograph as File;

        await FileUploadService.uploadFile(applicantId, photoFile, 'OTHER', 'Photograph');

        // Convert to base64 and update biometric data
        const reader = new FileReader();
        reader.onload = async () => {
          const dataUrl = reader.result as string;
          const biometricData = {
            photo: {
              fileType: 'photo',
              fileName: photoFile.name,
              url: dataUrl,
              uploadedAt: new Date().toISOString(),
            },
          };

          // Merge with existing biometric data
          if (existingBiometricData) {
            Object.keys(existingBiometricData).forEach(key => {
              if (key !== 'photo' && !biometricData[key as keyof typeof biometricData]) {
                biometricData[key as keyof typeof biometricData] = existingBiometricData[key];
              }
            });
          }

          await ApplicationService.updateApplication(
            applicantId,
            { biometricData } as any,
            'personal'
          );

          setPhotoSubmitted(true);
          toast.success('Photograph submitted successfully!');
        };
        reader.readAsDataURL(photoFile);
      } else {
        toast.warning('Please create application first.');
      }
    } catch (err: any) {
      console.error('Photo submission error:', err);
      toast.error('Failed to submit photograph');
    } finally {
      setUploadingFiles(false);
      setUploadProgress('');
    }
  };

  /** 🧠 Upload biometric files to backend */
  const uploadBiometricFiles = async (appId: string) => {
    if (!appId) return;
    // Helper to convert File -> data URL (base64)
    const fileToDataUrl = (file: File) =>
      new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = err => reject(err);
        reader.readAsDataURL(file);
      });

    // Build biometricData payload with base64 URLs as requested
    const biometricData: any = {};
    const filesToUpload: Array<{ file: File; type: string; desc: string }> = [];

    if (form.signature) {
      try {
        const dataUrl = await fileToDataUrl(form.signature);
        biometricData.signature = {
          fileType: FILE_TYPE_MAP.signature,
          fileName: form.signature.name,
          url: dataUrl,
          uploadedAt: new Date().toISOString(),
        };
        filesToUpload.push({
          file: form.signature,
          type: FILE_TYPE_MAP.signature,
          desc: 'Signature',
        });
      } catch (err) {
        console.warn('Failed to read signature file as base64', err);
      }
    }

    if (form.photograph) {
      try {
        const dataUrl = await fileToDataUrl(form.photograph);
        biometricData.photo = {
          fileType: FILE_TYPE_MAP.photograph,
          fileName: form.photograph.name,
          url: dataUrl,
          uploadedAt: new Date().toISOString(),
        };
        filesToUpload.push({
          file: form.photograph,
          type: FILE_TYPE_MAP.photograph,
          desc: 'Photograph',
        });
      } catch (err) {
        console.warn('Failed to read photograph file as base64', err);
      }
    }

    if (form.iris) {
      try {
        const dataUrl = await fileToDataUrl(form.iris);
        biometricData.irisScan = {
          fileType: FILE_TYPE_MAP.iris,
          fileName: form.iris.name,
          url: dataUrl,
          uploadedAt: new Date().toISOString(),
        };
        filesToUpload.push({ file: form.iris, type: FILE_TYPE_MAP.iris, desc: 'Iris' });
      } catch (err) {
        console.warn('Failed to read iris file as base64', err);
      }
    }

    if (form.fingerprint) {
      try {
        const dataUrl = await fileToDataUrl(form.fingerprint);
        biometricData.fingerprint = {
          fileType: FILE_TYPE_MAP.fingerprint,
          fileName: form.fingerprint.name,
          url: dataUrl,
          uploadedAt: new Date().toISOString(),
        };
        filesToUpload.push({
          file: form.fingerprint,
          type: FILE_TYPE_MAP.fingerprint,
          desc: 'Fingerprint',
        });
      } catch (err) {
        console.warn('Failed to read fingerprint file as base64', err);
      }
    }

    // Merge existing biometric data for items user did not replace
    if (existingBiometricData) {
      Object.keys(existingBiometricData).forEach(key => {
        if (!biometricData[key]) {
          biometricData[key] = existingBiometricData[key];
        }
      });
    }

    // If there is nothing to upload or patch, return early
    if (Object.keys(biometricData).length === 0) return false;

    try {
      setUploadingFiles(true);

      // Upload files rage/backend as before (keeps current behavior)
      for (let i = 0; i < filesToUpload.length; i++) {
        const { file, type, desc } = filesToUpload[i];
        setUploadProgress(`Uploading ${file.name} (${i + 1}/${filesToUpload.length})`);
        await FileUploadService.uploadFile(appId, file, type, desc);
      }

      // PATCH application form with biometricData (use ApplicationService to keep payload handling consistent)
      await ApplicationService.updateApplication(appId, { biometricData } as any, 'personal');

      toast.success('Biometric data updated successfully');
    } catch (err: any) {
      console.error('Biometric upload/patch error:', err);
      toast.error('Failed to update biometric data');
    } finally {
      setUploadingFiles(false);
      setUploadProgress('');
    }
  };

  /** 🔄 Navigation handlers */
  const handleSaveToDraft = async () => {
    if (!applicantId) return toast.warning('Please create application first.');
    await uploadBiometricFiles(applicantId);
  };

  const handleNext = async () => {
    if (!applicantId) return toast.warning('Please save Personal Info first.');
    await uploadBiometricFiles(applicantId);
    router.push(`${FORM_ROUTES.DOCUMENTS_UPLOAD}?${queryIdKey}=${encodeURIComponent(applicantId)}`);
  };

  const handlePrevious = () => {
    if (applicantId)
      router.push(
        `${FORM_ROUTES.LICENSE_DETAILS}?${queryIdKey}=${encodeURIComponent(applicantId)}`
      );
    else router.back();
  };

  /** 🔍 Fingerprint Capture via Mantra SDK */
  const handleCaptureFingerprintMantra = async (fingerPosition: string = 'RIGHT_THUMB') => {
    if (!mantraSDKReady || !fingerprintDeviceConnected) {
      toast.error('Fingerprint device is not available. Please check Settings for diagnostics.');
      setShowDeviceSettings(true);
      return;
    }

    try {
      setFingerprintCapturing(true);
      setUploadProgress('Initializing fingerprint device...');

      // Check device status before capture
      const deviceStatus = await MantraSDKService.isDeviceConnected();

      if (!deviceStatus.isConnected) {
        toast.error('Fingerprint device disconnected. Check Settings → Diagnostics.');
        setFingerprintDeviceConnected(false);
        setShowDeviceSettings(true);
        return;
      }

      // Prompt user to place finger on device
      toast.info('📍 Please place your finger on the device and keep it steady.');
      setUploadProgress('Waiting for fingerprint placement...');

      // Capture fingerprint with quality threshold
      const captureResult = await MantraSDKService.captureFinger(60, 10000); // 60% quality, 10 second timeout

      if (!captureResult.success) {
        toast.error(`Fingerprint capture failed: ${captureResult.errorMessage}`);
        return;
      }

      setUploadProgress(`Fingerprint captured successfully (Quality: ${captureResult.quality}%)`);
      toast.success(`✓ Captured successfully! Quality: ${captureResult.quality}%`);

      // Get fingerprint image for preview
      setUploadProgress('Getting fingerprint preview...');

      try {
        const fingerprintImage = await MantraSDKService.getImage('0'); // 0 = BMP format

        // Store capture result and show preview modal
        setPendingCaptureResult(captureResult);
        setPendingFingerPosition(fingerPosition);

        if (fingerprintImage) {
          const previewUrl = `data:image/bmp;base64,${fingerprintImage}`;
          setFingerprintPreviewImage(previewUrl);
        } else {
          setFingerprintPreviewImage(null); // Show modal without image
        }

        setShowFingerprintPreviewModal(true);
        toast.info('👆 Preview ready - Accept to enroll or Retake for better quality');
      } catch (imageError: any) {
        // Still show preview modal even if image fails
        setPendingCaptureResult(captureResult);
        setPendingFingerPosition(fingerPosition);
        setFingerprintPreviewImage(null);
        setShowFingerprintPreviewModal(true);
        toast.warning('⚠️ Image preview unavailable, but you can still enroll with template');
      }

      setUploadProgress('');
    } catch (error: any) {
      toast.error('❌ Fingerprint capture failed. Please try again.');
    } finally {
      setFingerprintCapturing(false);
      setUploadProgress('');
    }
  };

  /** 🔏 Verify Fingerprint against enrolled templates */
  const handleVerifyFingerprint = async () => {
    if (!mantraSDKReady || !fingerprintDeviceConnected) {
      toast.error('Fingerprint device is not available.');
      return;
    }

    if (enrolledFingerprints.length === 0) {
      toast.warning('No enrolled fingerprints found. Please enroll first.');
      return;
    }

    try {
      setFingerprintCapturing(true);
      setUploadProgress('Capturing fingerprint for verification...');

      // Capture live fingerprint
      const captureResult = await MantraSDKService.captureFinger(60, 10000);

      if (!captureResult.success) {
        toast.error(`Capture failed: ${captureResult.errorMessage}`);
        return;
      }

      setUploadProgress('Verifying fingerprint...');

      // Send to backend for verification
      const verificationResponse = await BiometricAPIService.verifyFingerprint(
        applicantId!,
        {
          template: captureResult.template,
          quality: captureResult.quality,
          isoTemplate: captureResult.isoTemplate,
          captureTime: captureResult.captureTime!,
        },
        65 // Match threshold
      );

      if (verificationResponse.success) {
        if (verificationResponse.isMatch) {
          toast.success(`✓ Fingerprint matched! (Score: ${verificationResponse.matchScore}/100)`);
        } else {
          toast.warning(
            `Fingerprint did not match. (Score: ${verificationResponse.matchScore}/100)`
          );
        }
      } else {
        toast.error(`Verification failed: ${verificationResponse.message}`);
      }
    } catch (error: any) {
      console.error('Verification error:', error);
      toast.error('Verification failed. Please try again.');
    } finally {
      setFingerprintCapturing(false);
      setUploadProgress('');
    }
  };

  /** 🗑️ Delete enrolled fingerprint */
  const handleDeleteFingerprint = async (fingerprintId: string) => {
    if (!applicantId) return;

    try {
      const result = await BiometricAPIService.deleteEnrolledFingerprint(
        applicantId,
        fingerprintId
      );
      if (result.success) {
        toast.success('Fingerprint deleted successfully');
        // Refresh list
        const fingerprints = await BiometricAPIService.getEnrolledFingerprints(applicantId);
        setEnrolledFingerprints(fingerprints);
      } else {
        toast.error(result.message);
      }
    } catch (error: any) {
      toast.error('Failed to delete fingerprint');
    }
  };

  /** Accept fingerprint preview and enroll */
  const handleAcceptFingerprintPreview = async () => {
    if (!pendingCaptureResult || !applicantId) {
      toast.error('Invalid capture data');
      return;
    }

    try {
      setFingerprintCapturing(true);
      setUploadProgress('Enrolling fingerprint...');

      const enrollmentResponse = await BiometricAPIService.enrollFingerprint(
        applicantId,
        pendingFingerPosition,
        {
          template: pendingCaptureResult.template,
          quality: pendingCaptureResult.quality,
          isoTemplate: pendingCaptureResult.isoTemplate,
          captureTime: pendingCaptureResult.captureTime!,
        },
        `Captured via Mantra SDK - ${pendingFingerPosition}`
      );

      if (enrollmentResponse.success) {
        toast.success(`✓ Fingerprint enrolled successfully at position: ${pendingFingerPosition}`);

        // Refresh enrolled fingerprints list
        const fingerprints = await BiometricAPIService.getEnrolledFingerprints(applicantId);
        setEnrolledFingerprints(fingerprints);

        // Close modal and reset
        setShowFingerprintPreviewModal(false);
        setFingerprintPreviewImage(null);
        setPendingCaptureResult(null);
      } else {
        toast.error(`Failed to enroll fingerprint: ${enrollmentResponse.message}`);
      }
    } catch (error: any) {
      toast.error('❌ Fingerprint enrollment failed. Please try again.');
    } finally {
      setFingerprintCapturing(false);
      setUploadProgress('');
    }
  };

  /** Reject fingerprint preview and retake */
  const handleRejectFingerprintPreview = () => {
    setShowFingerprintPreviewModal(false);
    setFingerprintPreviewImage(null);
    setPendingCaptureResult(null);
    setPendingFingerPosition('RIGHT_THUMB');
    toast.info(
      '👆 Fingerprint rejected. Ready to capture again. Place your finger and click Capture.'
    );
  };

  /** ⚙️ DIAGNOSTIC TEST FUNCTIONS FOR DEVICE TROUBLESHOOTING */

  const runDiagnostic = async (testName: string, testFn: () => Promise<any>) => {
    try {
      setDiagnosticLoading(testName);
      const result = await testFn();
      console.log(`[Diagnostic] ${testName} result:`, result);
      setDiagnosticResults((prev: any) => ({
        ...prev,
        [testName]: {
          success: true,
          data: result,
          timestamp: new Date().toLocaleTimeString(),
        },
      }));

      toast.success(`✓ ${testName} passed`);
    } catch (error: any) {
      setDiagnosticResults((prev: any) => ({
        ...prev,
        [testName]: {
          success: false,
          error: error.message,
          errorCode: error.errorCode,
          timestamp: new Date().toLocaleTimeString(),
        },
      }));

      toast.error(`✗ ${testName} failed: ${error.message}`);
    } finally {
      setDiagnosticLoading(null);
    }
  };

  const testCheckDevice = async () => {
    const result = await MantraSDKService.isDeviceConnected();
    if (!result.isConnected) {
      throw new Error(result.errorMessage || 'Device not connected');
    }
    return { connected: result.isConnected, info: result };
  };

  const testGetConnectedDevice = async () => {
    const result = await MantraSDKService.getConnectedDeviceList();
    if (!result || result.length === 0) {
      throw new Error('No connected devices found');
    }
    return { devices: result };
  };

  const testGetSupportedDevice = async () => {
    const result = await MantraSDKService.getSupportedDeviceList();
    if (!result || result.length === 0) {
      throw new Error('No supported devices found');
    }
    return { devices: result };
  };

  const testGetInfo = async () => {
    const result = await MantraSDKService.getDeviceInfo();
    if (!result) {
      throw new Error('Failed to get device info');
    }
    return { info: result };
  };

  const testCapture = async () => {
    const result = await MantraSDKService.captureFinger(60, 10000);
    if (!result.success) {
      const error = new Error(result.errorMessage || 'Capture failed');
      (error as any).errorCode = result.errorCode;
      throw error;
    }
    return {
      success: true,
      quality: result.quality,
      template: result.template ? 'Present' : 'Missing',
    };
  };

  const testGetImage = async () => {
    const result = await MantraSDKService.getImage('0');
    if (!result) {
      throw new Error('Failed to get fingerprint image');
    }
    return { imageSize: result.length, format: 'BMP (base64)' };
  };

  const testGetTemplate = async () => {
    const result = await MantraSDKService.getTemplate();
    if (!result) {
      throw new Error('Failed to get template');
    }
    return { template: result ? 'Present' : 'Missing', size: result ? result.length : 0 };
  };

  const testMatch = async () => {
    if (enrolledFingerprints.length === 0) {
      throw new Error('No enrolled fingerprints to match against');
    }

    const template = await MantraSDKService.getTemplate();
    if (!template) {
      throw new Error('No template available from last capture');
    }

    const result = await MantraSDKService.matchFinger(60, 10000, template);
    return { matchScore: result.score, matched: result.isMatch };
  };

  /** 🔍 Fingerprint & Iris scans */
  const handleScanFingerprint = async () => {
    if (!mantraSDKReady || !fingerprintDeviceConnected) {
      toast.error('Fingerprint device not available. Please check connection.');
      return;
    }

    // Use Mantra SDK capture instead
    await handleCaptureFingerprintMantra('RIGHT_THUMB');
  };

  const handleScanIris = async () => {
    try {
      const res = await fetch('/api/device/scan/iris', { method: 'POST' });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      setForm(prev => ({ ...prev, iris: new File([blob], 'iris.bin') }));
      toast.success('Iris captured successfully');
    } catch {
      toast.error('Failed to capture iris');
    }
  };

  return (
    <form className='p-6 space-y-6'>
      <h2 className='text-xl font-bold'>Biometric Information</h2>

      {(applicantId || almsLicenseId) && (
        <div className='mb-4 p-3 bg-blue-100 border border-blue-400 text-blue-700 rounded flex justify-between items-center'>
          <div className='flex flex-col'>
            {/* <strong>Application ID: {applicantId ?? '—'}</strong> */}
            {almsLicenseId && <strong className='text-sm'>License ID: {almsLicenseId}</strong>}
          </div>
          <button
            type='button'
            onClick={() => applicantId && ApplicationService.getApplication(applicantId)}
            className='px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700'
          >
            Refresh Data
          </button>
        </div>
      )}

      {/* 🔹 Fingerprint and Iris Section */}
      <div className='grid md:grid-cols-2 gap-8'>
        <div>
          <div className='flex justify-between items-center mb-2'>
            <div className='font-semibold'>Signature / Thumb Impression</div>
            <button
              type='button'
              onClick={() => setShowDeviceSettings(!showDeviceSettings)}
              className='px-3 py-1 text-sm bg-gray-600 hover:bg-gray-700 text-white rounded flex items-center gap-1'
              title='Open device diagnostics and settings'
            >
              ⚙️ Settings
            </button>
          </div>
          <div className='space-y-2'>
            {/* Mantra SDK Fingerprint Capture (if device available) */}
            {mantraSDKReady && fingerprintDeviceConnected ? (
              <div className='flex items-center space-x-3'>
                <button
                  type='button'
                  onClick={() => handleCaptureFingerprintMantra('RIGHT_THUMB')}
                  disabled={fingerprintCapturing || uploadingFiles}
                  className={`px-4 py-2 rounded text-white font-medium ${
                    fingerprintCapturing || uploadingFiles
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {fingerprintCapturing ? 'Capturing...' : 'Scan Fingerprint'}
                </button>
                <span className='text-sm text-green-600'>✓ Device Ready</span>
              </div>
            ) : (
              <div className='flex items-center space-x-3'>
                <button
                  type='button'
                  onClick={() => toast.error('Fingerprint device not connected')}
                  disabled
                  aria-disabled='true'
                  className='px-4 py-2 bg-gray-400 text-white rounded cursor-not-allowed'
                >
                  Scan Fingerprint
                </button>
                <span className='text-sm text-gray-500'>
                  {!mantraSDKReady ? 'Mantra SDK not initialized' : 'Device not connected'}
                </span>
              </div>
            )}

            {/* Enrolled Fingerprints List */}
            {enrolledFingerprints.length > 0 && (
              <div className='mt-4 p-3 bg-blue-50 rounded border border-blue-200'>
                <div className='font-semibold text-sm mb-2'>Enrolled Fingerprints:</div>
                <div className='space-y-2'>
                  {enrolledFingerprints.map((fp: any) => (
                    <div
                      key={fp.id}
                      className='flex justify-between items-center text-sm p-2 bg-white rounded border'
                    >
                      <div>
                        <span className='font-medium'>{fp.position}</span>
                        <span className='text-gray-600 ml-2'>Quality: {fp.quality}%</span>
                      </div>
                      <button
                        type='button'
                        onClick={() => handleDeleteFingerprint(fp.id)}
                        className='px-2 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600'
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type='button'
                  onClick={handleVerifyFingerprint}
                  disabled={fingerprintCapturing}
                  className={`mt-3 w-full px-3 py-2 rounded text-white text-sm font-medium ${
                    fingerprintCapturing
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  {fingerprintCapturing ? 'Verifying...' : 'Verify Fingerprint'}
                </button>
              </div>
            )}

            <label className='block border-2 border-dashed p-3 text-center text-gray-600 rounded-lg cursor-pointer hover:border-blue-400'>
              Or upload signature/thumb
              <input type='file' name='signature' className='hidden' onChange={handleFileChange} />
            </label>
            {existingBiometricData?.signature && (
              <div className='mt-2 text-sm text-gray-600'>
                Existing: {existingBiometricData.signature.fileName}{' '}
                {existingBiometricData.signature.url && (
                  <a
                    href={existingBiometricData.signature.url}
                    target='_blank'
                    rel='noreferrer'
                    className='underline text-blue-600'
                  >
                    View
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        <div>
          <div className='font-semibold mb-2'>Iris Scan</div>
          <div className='space-y-2'>
            <div className='flex items-center space-x-3'>
              <button
                type='button'
                onClick={handleScanIris}
                disabled
                aria-disabled='true'
                aria-label='Iris scanning will be available soon'
                title='Iris scanning will be available soon'
                className='px-4 py-2 bg-gray-400 text-white rounded cursor-not-allowed'
              >
                Scan Iris
              </button>
              <span className='text-sm text-gray-500'>Iris scanning will be available soon</span>
            </div>
            <label className='block border-2 border-dashed p-3 text-center text-gray-600 rounded-lg cursor-pointer hover:border-blue-400'>
              Or upload iris scan
              <input type='file' name='iris' className='hidden' onChange={handleFileChange} />
            </label>
            {existingBiometricData?.irisScan && (
              <div className='mt-2 text-sm text-gray-600'>
                Existing: {existingBiometricData.irisScan.fileName}{' '}
                {existingBiometricData.irisScan.url && (
                  <a
                    href={existingBiometricData.irisScan.url}
                    target='_blank'
                    rel='noreferrer'
                    className='underline text-blue-600'
                  >
                    View
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 🔹 Photograph Section */}
      <div>
        <div className='font-semibold mb-2'>Photograph</div>
        <p className='text-sm text-gray-600 mb-3'>
          Capture the applicant's live photo using webcam or upload an existing photograph. Ensure
          the subject is centered and clearly visible.
        </p>

        <div className='grid md:grid-cols-2 gap-6 items-start'>
          {/* Webcam Section */}
          <div className='space-y-3'>
            {streamActive ? (
              <>
                <Webcam
                  ref={webcamRef}
                  audio={false}
                  screenshotFormat='image/jpeg'
                  className='w-48 h-48 object-cover rounded border bg-black'
                />
                <div className='flex space-x-2'>
                  <button
                    type='button'
                    onClick={capturePhoto}
                    className='px-4 py-2 bg-indigo-600 text-white rounded'
                  >
                    Capture
                  </button>
                  <button
                    type='button'
                    onClick={() => setStreamActive(false)}
                    className='px-4 py-2 bg-gray-400 text-white rounded'
                  >
                    Stop Camera
                  </button>
                </div>
              </>
            ) : (
              <div className='flex flex-col space-y-2'>
                <button
                  type='button'
                  onClick={() => setStreamActive(true)}
                  className='px-4 py-2 bg-green-600 text-white rounded'
                >
                  Use Webcam
                </button>
                <label className='block border-2 border-dashed border-gray-300 rounded-lg p-4 text-center text-gray-600 cursor-pointer hover:border-blue-400'>
                  Or upload photograph
                  <input
                    type='file'
                    name='photograph'
                    accept='image/*'
                    className='hidden'
                    onChange={handleFileChange}
                  />
                </label>
                {existingBiometricData?.photo && (
                  <div className='mt-2 text-sm text-gray-600'>
                    Existing: {existingBiometricData.photo.fileName}{' '}
                    {existingBiometricData.photo.url && (
                      <a
                        href={existingBiometricData.photo.url}
                        target='_blank'
                        rel='noreferrer'
                        className='underline text-blue-600'
                      >
                        View
                      </a>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Preview Section */}
          {photoPreview && (
            <div className='flex flex-col items-center'>
              <span className='font-semibold mb-2'>Captured Photo Preview</span>
              <img
                src={photoPreview}
                alt='Captured'
                className='w-48 h-48 object-cover rounded border shadow'
              />
              <div className='flex gap-2 mt-2'>
                {!photoSubmitted && (
                  <button
                    type='button'
                    onClick={submitPhoto}
                    disabled={uploadingFiles || photoSubmitted}
                    className={`px-4 py-2 rounded text-white font-medium ${
                      uploadingFiles || photoSubmitted
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-green-600 hover:bg-green-700'
                    }`}
                  >
                    {uploadingFiles ? 'Submitting...' : 'Submit'}
                  </button>
                )}
                {!photoSubmitted && (
                  <button
                    type='button'
                    onClick={removePhoto}
                    disabled={uploadingFiles}
                    className={`px-3 py-2 rounded text-white font-medium ${
                      uploadingFiles
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-red-500 hover:bg-red-600'
                    }`}
                  >
                    Remove
                  </button>
                )}
                {photoSubmitted && (
                  <span className='text-green-600 font-semibold'>✓ Submitted</span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Fingerprint Preview Modal */}
      {showFingerprintPreviewModal && pendingCaptureResult && (
        <div
          className='fixed inset-0 bg-black/75 flex items-center justify-center z-[9999] p-4'
          style={{ display: 'flex', visibility: 'visible' }}
        >
          <div className='bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-auto'>
            <div className='border-b px-6 py-4 sticky top-0 bg-white'>
              <h2 className='text-2xl font-bold text-gray-800'>Fingerprint Preview</h2>
              <p className='text-sm text-gray-500 mt-1'>Review your fingerprint before enrolling</p>
            </div>

            <div className='px-6 py-6'>
              {/* Quality Section */}
              <div className='mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200'>
                <p className='text-gray-700 font-medium'>Quality Score</p>
                <p className='text-2xl font-bold text-blue-600 mt-1'>
                  {pendingCaptureResult?.quality || 0}%
                </p>
                <div className='w-full bg-gray-300 rounded-full h-2 mt-3'>
                  <div
                    className='bg-blue-600 h-2 rounded-full'
                    style={{ width: `${pendingCaptureResult?.quality || 0}%` }}
                  ></div>
                </div>
              </div>

              {/* Fingerprint Image Section */}
              <div className='mb-6'>
                <p className='text-gray-700 font-medium mb-3'>Captured Fingerprint</p>
                <div className='flex justify-center bg-gray-100 rounded-lg p-4 min-h-[300px] items-center'>
                  {fingerprintPreviewImage ? (
                    <div className='flex flex-col items-center gap-2'>
                      <img
                        src={fingerprintPreviewImage}
                        alt='Fingerprint Preview'
                        className='max-w-full max-h-96 border-2 border-gray-300 rounded shadow'
                        onError={e => {
                          e.currentTarget.src =
                            'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23f0f0f0" width="200" height="200"/%3E%3Ctext x="50%" y="50%" font-size="16" text-anchor="middle" dy=".3em" fill="%23999"%3EImage Load Failed%3C/text%3E%3C/svg%3E';
                        }}
                      />
                      <p className='text-xs text-gray-400'>
                        Fingerprint Image ({Math.round(fingerprintPreviewImage.length / 1024)} KB)
                      </p>
                    </div>
                  ) : (
                    <div className='text-center'>
                      <p className='text-gray-500 text-lg'>📷 No preview image available</p>
                      <p className='text-sm text-gray-400 mt-2'>
                        You can still enroll this fingerprint using the template data
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Finger Position Section */}
              <div className='mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200'>
                <p className='text-gray-700 font-medium'>Finger Position</p>
                <p className='text-lg text-gray-600 mt-2 font-semibold'>{pendingFingerPosition}</p>
              </div>

              {/* Action Buttons */}
              <div className='flex gap-3 pt-4 border-t'>
                <button
                  onClick={handleAcceptFingerprintPreview}
                  disabled={fingerprintCapturing}
                  className={`flex-1 px-4 py-3 rounded-lg font-semibold text-white transition-colors ${
                    fingerprintCapturing
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-green-600 hover:bg-green-700 active:bg-green-800'
                  }`}
                >
                  {fingerprintCapturing ? 'Enrolling...' : '✓ Accept & Enroll'}
                </button>
                <button
                  onClick={handleRejectFingerprintPreview}
                  disabled={fingerprintCapturing}
                  className={`flex-1 px-4 py-3 rounded-lg font-semibold text-white transition-colors ${
                    fingerprintCapturing
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-red-600 hover:bg-red-700 active:bg-red-800'
                  }`}
                >
                  ↻ Retake
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ⚙️ DEVICE SETTINGS & DIAGNOSTICS MODAL */}
      {showDeviceSettings && (
        <div
          className='fixed inset-0 bg-black/75 flex items-center justify-center z-[9999] p-4'
          style={{
            display: 'flex',
            visibility: 'visible',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div className='bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-y-auto flex flex-col'>
            <div className='border-b px-6 py-4 sticky top-0 bg-white flex justify-between items-center'>
              <div>
                <h2 className='text-2xl font-bold text-gray-800'>Device Settings & Diagnostics</h2>
                <p className='text-sm text-gray-500 mt-1'>
                  Test Mantra MFS500 device connectivity and API endpoints
                </p>
              </div>
              <button
                onClick={() => setShowDeviceSettings(false)}
                className='text-gray-600 hover:text-gray-900 text-2xl font-bold'
              >
                ✕
              </button>
            </div>

            <div className='px-6 py-6 overflow-y-auto flex-1'>
              {/* Connection Status */}
              <div
                className='mb-6 p-4 rounded-lg border-2'
                style={{
                  backgroundColor: fingerprintDeviceConnected ? '#ecfdf5' : '#fef2f2',
                  borderColor: fingerprintDeviceConnected ? '#10b981' : '#ef4444',
                }}
              >
                <p
                  className='font-semibold'
                  style={{ color: fingerprintDeviceConnected ? '#059669' : '#dc2626' }}
                >
                  {fingerprintDeviceConnected ? '✓ Device Connected' : '✗ Device Not Connected'}
                </p>
                <p className='text-sm text-gray-600 mt-1'>
                  {fingerprintDeviceConnected
                    ? 'Device is online and ready for testing'
                    : 'Device is offline. Please check the connection and restart the device service.'}
                </p>
              </div>

              {/* Diagnostic Buttons Grid */}
              <div className='grid grid-cols-2 gap-3 mb-6'>
                <button
                  onClick={() => runDiagnostic('Check Device', testCheckDevice)}
                  disabled={diagnosticLoading === 'Check Device'}
                  className='px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium text-sm transition-colors'
                >
                  {diagnosticLoading === 'Check Device' ? '⟳ Testing...' : 'Check Device'}
                </button>

                <button
                  onClick={() => runDiagnostic('Get Connected Device', testGetConnectedDevice)}
                  disabled={diagnosticLoading === 'Get Connected Device'}
                  className='px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium text-sm transition-colors'
                >
                  {diagnosticLoading === 'Get Connected Device'
                    ? '⟳ Testing...'
                    : 'Get Connected Device'}
                </button>

                <button
                  onClick={() => runDiagnostic('Get Supported Device', testGetSupportedDevice)}
                  disabled={diagnosticLoading === 'Get Supported Device'}
                  className='px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium text-sm transition-colors'
                >
                  {diagnosticLoading === 'Get Supported Device'
                    ? '⟳ Testing...'
                    : 'Get Supported Device'}
                </button>

                <button
                  onClick={() => runDiagnostic('Get Info', testGetInfo)}
                  disabled={diagnosticLoading === 'Get Info'}
                  className='px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium text-sm transition-colors'
                >
                  {diagnosticLoading === 'Get Info' ? '⟳ Testing...' : 'Get Info'}
                </button>

                <button
                  onClick={() => runDiagnostic('Capture', testCapture)}
                  disabled={diagnosticLoading === 'Capture' || !fingerprintDeviceConnected}
                  className='px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-medium text-sm transition-colors'
                >
                  {diagnosticLoading === 'Capture' ? '⟳ Testing...' : 'Capture'}
                </button>

                <button
                  onClick={() => runDiagnostic('Get Image', testGetImage)}
                  disabled={diagnosticLoading === 'Get Image'}
                  className='px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-medium text-sm transition-colors'
                >
                  {diagnosticLoading === 'Get Image' ? '⟳ Testing...' : 'Get Image'}
                </button>

                <button
                  onClick={() => runDiagnostic('Get Template', testGetTemplate)}
                  disabled={diagnosticLoading === 'Get Template'}
                  className='px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-medium text-sm transition-colors'
                >
                  {diagnosticLoading === 'Get Template' ? '⟳ Testing...' : 'Get Template'}
                </button>

                <button
                  onClick={() => runDiagnostic('Match', testMatch)}
                  disabled={diagnosticLoading === 'Match' || enrolledFingerprints.length === 0}
                  className='px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-medium text-sm transition-colors'
                >
                  {diagnosticLoading === 'Match' ? '⟳ Testing...' : 'Match'}
                </button>
              </div>

              {/* Results Display Container */}
              {Object.keys(diagnosticResults).length > 0 && (
                <div className='mt-6 pt-6 border-t border-gray-200'>
                  <div className='flex justify-between items-center mb-4'>
                    <p className='font-bold text-lg text-gray-800'>📊 Test Results</p>
                    <span className='text-sm text-gray-600'>
                      {Object.values(diagnosticResults).filter((r: any) => r.success).length}/
                      {Object.keys(diagnosticResults).length} Passed
                    </span>
                  </div>

                  <div className='space-y-3'>
                    {Object.entries(diagnosticResults).map(([testName, result]: [string, any]) => (
                      <div
                        key={testName}
                        className='p-4 rounded-lg border-2 transition-all'
                        style={{
                          backgroundColor: result.success ? '#ecfdf5' : '#fef2f2',
                          borderColor: result.success ? '#10b981' : '#ef4444',
                        }}
                      >
                        <div className='flex justify-between items-start'>
                          <div className='flex-1'>
                            <p
                              className='font-bold flex items-center gap-2'
                              style={{ color: result.success ? '#059669' : '#dc2626' }}
                            >
                              {result.success ? '✓' : '✗'} {testName}
                            </p>
                            {result.timestamp && (
                              <p className='text-xs text-gray-500 mt-1'>{result.timestamp}</p>
                            )}
                          </div>
                        </div>

                        {result.success ? (
                          <div className='mt-3 text-sm text-gray-700'>
                            <details className='cursor-pointer'>
                              <summary className='font-medium text-gray-700 hover:text-gray-900'>
                                📋 View Details
                              </summary>
                              <pre className='bg-gray-100 p-3 rounded border border-gray-300 text-xs overflow-auto max-h-48 mt-2 text-gray-800'>
                                {JSON.stringify(result.data, null, 2)}
                              </pre>
                            </details>
                          </div>
                        ) : (
                          <div className='mt-3 text-sm' style={{ color: '#991b1b' }}>
                            <p className='font-semibold'>{result.error || 'Unknown error'}</p>
                            {result.errorCode && (
                              <p className='text-xs mt-2'>
                                Error Code:{' '}
                                <code
                                  className='bg-red-200 px-2 py-1 rounded'
                                  style={{ color: '#7f1d1d' }}
                                >
                                  {result.errorCode}
                                </code>
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Clear Results Button */}
              {Object.keys(diagnosticResults).length > 0 && (
                <button
                  onClick={() => setDiagnosticResults({})}
                  className='mt-6 w-full px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg font-medium text-sm'
                >
                  Clear Results
                </button>
              )}

              {/* Close Button */}
              <button
                onClick={() => setShowDeviceSettings(false)}
                className='mt-4 w-full px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold'
              >
                Close Settings
              </button>
            </div>
          </div>
        </div>
      )}

      <FormFooter
        onSaveToDraft={handleSaveToDraft}
        onNext={handleNext}
        onPrevious={handlePrevious}
        isLoading={uploadingFiles}
      />
    </form>
  );
};

export default BiometricInformation;
