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

  // Webcam modal states
  const [showWebcamModal, setShowWebcamModal] = useState(false);
  const [webcamCapturedPhoto, setWebcamCapturedPhoto] = useState<string | null>(null);

  // Duplicate fingerprint error modal state
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicateMatchInfo, setDuplicateMatchInfo] = useState<{
    applicationId: string;
    almsLicenseId: string | null;
    applicantName: string;
    fingerPosition: string;
  } | null>(null);

  // Success modal state
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successInfo, setSuccessInfo] = useState<{
    fingerPosition: string;
    quality: number;
    enrolledAt: string;
  } | null>(null);

  // Photo success/error modal states
  const [showPhotoSuccessModal, setShowPhotoSuccessModal] = useState(false);
  const [showPhotoErrorModal, setShowPhotoErrorModal] = useState(false);
  const [photoErrorMessage, setPhotoErrorMessage] = useState<string>('');

  // Info tooltip state
  const [showInfoTooltip, setShowInfoTooltip] = useState(false);

  // Capturing modal state (for skeleton loading)
  const [showCapturingModal, setShowCapturingModal] = useState(false);
  const [capturingStep, setCapturingStep] = useState<string>('');

  const webcamRef = useRef<any>(null);

  // Map frontend biometric keys to backend `FileType` enum values (Prisma)
  const FILE_TYPE_MAP = {
    photograph: 'PHOTOGRAPH',
    signature: 'SIGNATURE_THUMB',
    iris: 'IRIS_SCAN',
    fingerprint: 'SIGNATURE_THUMB', // thumb impression / signature thumb
  } as const;

  /**
   * 🔄 Convert remote image URL to base64 data URL
   * Fetches the image and converts it to base64 format
   */
  const convertUrlToBase64 = async (url: string): Promise<string | null> => {
    try {
      console.log('🔄 [BiometricInformation] Converting URL to base64:', url);
      const response = await fetch(url);
      if (!response.ok) {
        console.error('❌ [BiometricInformation] Failed to fetch image:', response.status);
        return null;
      }
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          console.log('✅ [BiometricInformation] Converted to base64, length:', base64?.length);
          resolve(base64);
        };
        reader.onerror = () => {
          console.error('❌ [BiometricInformation] FileReader error');
          reject(null);
        };
        reader.readAsDataURL(blob);
      });
    } catch (err) {
      console.error('❌ [BiometricInformation] Error converting URL to base64:', err);
      return null;
    }
  };

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
        console.log('📦 [BiometricInformation] Full API response data:', data);

        const bioWrapper = data?.biometricData || null;

        let normalized: any = null;
        if (bioWrapper) {
          // If the payload has a nested `biometricData` property, use that inner object
          if (bioWrapper.biometricData) normalized = bioWrapper.biometricData;
          else normalized = bioWrapper;
        }
        console.log('🔍 [BiometricInformation] Normalized biometric data:', normalized);

        setExistingBiometricData(normalized);

        // ✅ Prefill enrolled fingerprints from biometricData.fingerprints
        if (
          normalized?.fingerprints &&
          Array.isArray(normalized.fingerprints) &&
          normalized.fingerprints.length > 0
        ) {
          console.log(
            '👆 [BiometricInformation] Found existing fingerprints:',
            normalized.fingerprints
          );
          setEnrolledFingerprints(normalized.fingerprints);
        }

        // Track if photo was found to avoid duplicate setting
        let photoFound = false;
        let photoUrlToConvert: string | null = null;

        // ✅ Check for photo URL from biometricData first
        if (normalized?.photo?.url) {
          console.log(
            '📸 [BiometricInformation] Found photo in biometricData:',
            normalized.photo.url
          );
          photoUrlToConvert = normalized.photo.url;
          photoFound = true;
        }

        // ✅ Check for PHOTOGRAPH in fileUploads array (primary source based on API structure)
        const fileUploads = data?.fileUploads || [];
        console.log('📁 [BiometricInformation] File uploads:', fileUploads);

        if (Array.isArray(fileUploads) && fileUploads.length > 0 && !photoFound) {
          // Find PHOTOGRAPH file type - exact match for fileType: "PHOTOGRAPH"
          const photographUpload = fileUploads.find((upload: any) => {
            const fileType = (upload.fileType || '').toString().toUpperCase();
            console.log(
              '🔍 [BiometricInformation] Checking file upload:',
              upload.fileName,
              'fileType:',
              fileType
            );
            return fileType === 'PHOTOGRAPH';
          });

          if (photographUpload) {
            const photoUrl = photographUpload.fileUrl || '';
            console.log('📸 [BiometricInformation] Found PHOTOGRAPH in fileUploads:', {
              id: photographUpload.id,
              fileName: photographUpload.fileName,
              fileUrl: photoUrl,
              fileType: photographUpload.fileType,
            });
            if (photoUrl) {
              photoUrlToConvert = photoUrl;
              photoFound = true;
            }
          }
        }

        // ✅ Convert URL to base64 for display (removes localhost URL dependency)
        if (photoUrlToConvert) {
          const base64Photo = await convertUrlToBase64(photoUrlToConvert);
          if (base64Photo) {
            setPhotoPreview(base64Photo);
            setPhotoSubmitted(true); // Mark as already submitted
            console.log('✅ [BiometricInformation] Photo preview set with base64 data');
          } else {
            // Fallback to URL if base64 conversion fails
            console.warn(
              '⚠️ [BiometricInformation] Base64 conversion failed, using URL as fallback'
            );
            setPhotoPreview(photoUrlToConvert);
            setPhotoSubmitted(true);
          }
        }

        // Capture ALMS license id from application data if present
        const licenseId = data?.almsLicenseId ?? data?.alms_license_id ?? data?.licenseId ?? null;
        if (licenseId) setAlmsLicenseId(licenseId);
      } catch (err) {
        console.error('❌ [BiometricInformation] Failed to load existing biometric data:', err);
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
        // Upload the photograph file using FileUploadService with PHOTOGRAPH fileType
        // Backend will automatically delete existing PHOTOGRAPH entries to keep only the latest
        const photoFile = form.photograph as File;
        await FileUploadService.uploadFile(applicantId, photoFile, 'PHOTOGRAPH', 'Photograph');

        setPhotoSubmitted(true);
        toast.success('Photograph submitted successfully!');
      } else {
        toast.warning('Please create application first.');
      }
    } catch (err: any) {
      toast.error('Failed to submit photograph');
    } finally {
      setUploadingFiles(false);
      setUploadProgress('');
    }
  };

  /** 🧠 Upload biometric files to backend */
  const uploadBiometricFiles = async (appId: string) => {
    if (!appId) return;

    const filesToUpload: Array<{ file: File; type: string; desc: string }> = [];

    if (form.signature) {
      filesToUpload.push({
        file: form.signature,
        type: FILE_TYPE_MAP.signature,
        desc: 'Signature',
      });
    }

    if (form.photograph) {
      filesToUpload.push({
        file: form.photograph,
        type: FILE_TYPE_MAP.photograph,
        desc: 'Photograph',
      });
    }

    if (form.iris) {
      filesToUpload.push({ file: form.iris, type: FILE_TYPE_MAP.iris, desc: 'Iris' });
    }

    if (form.fingerprint) {
      filesToUpload.push({
        file: form.fingerprint,
        type: FILE_TYPE_MAP.fingerprint,
        desc: 'Fingerprint',
      });
    }

    // If there is nothing to upload, return early
    if (filesToUpload.length === 0) return false;

    try {
      setUploadingFiles(true);

      // Upload files using FileUploadService
      for (let i = 0; i < filesToUpload.length; i++) {
        const { file, type, desc } = filesToUpload[i];
        setUploadProgress(`Uploading ${file.name} (${i + 1}/${filesToUpload.length})`);
        await FileUploadService.uploadFile(appId, file, type, desc);
      }

      toast.success('Biometric files uploaded successfully');
    } catch (err: any) {
      toast.error('Failed to upload biometric files');
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
      setShowCapturingModal(true);
      setCapturingStep('Initializing fingerprint device...');

      // Check device status before capture
      const deviceStatus = await MantraSDKService.isDeviceConnected();

      if (!deviceStatus.isConnected) {
        toast.error('Fingerprint device disconnected. Check Settings → Diagnostics.');
        setFingerprintDeviceConnected(false);
        setShowDeviceSettings(true);
        setShowCapturingModal(false);
        return;
      }

      // Prompt user to place finger on device
      setCapturingStep('Place your finger on the scanner...');
      toast.info('📍 Please place your finger on the device and keep it steady.');

      // Capture fingerprint with quality threshold
      setCapturingStep('Scanning fingerprint...');
      const captureResult = await MantraSDKService.captureFinger(60, 10000); // 60% quality, 10 second timeout

      if (!captureResult.success) {
        toast.error(`Fingerprint capture failed: ${captureResult.errorMessage}`);
        setShowCapturingModal(false);
        return;
      }

      setCapturingStep('Processing captured fingerprint...');
      toast.success(`✓ Captured successfully! Quality: ${captureResult.quality}%`);

      // Get fingerprint image for preview (use bitmapData from capture or getImage API)
      setCapturingStep('Generating preview...');

      try {
        // Prefer bitmapData from capture result (faster, no additional API call)
        let previewImage: string | null = captureResult.bitmapData || null;

        if (!previewImage) {
          // Fall back to getImage API if bitmapData not in capture result
          previewImage = await MantraSDKService.getImage('0'); // 0 = BMP format
        }

        // Store capture result and show preview modal
        setPendingCaptureResult(captureResult);
        setPendingFingerPosition(fingerPosition);

        if (previewImage) {
          const previewUrl = `data:image/bmp;base64,${previewImage}`;
          setFingerprintPreviewImage(previewUrl);
        } else {
          setFingerprintPreviewImage(null); // Show modal without image
        }

        setShowCapturingModal(false);
        setShowFingerprintPreviewModal(true);
        toast.info('👆 Preview ready - Accept to enroll or Retake for better quality');
      } catch (imageError: any) {
        // Still show preview modal even if image fails
        setPendingCaptureResult(captureResult);
        setPendingFingerPosition(fingerPosition);
        setFingerprintPreviewImage(null);
        setShowCapturingModal(false);
        setShowFingerprintPreviewModal(true);
        toast.warning('⚠️ Image preview unavailable, but you can still enroll with template');
      }

      setUploadProgress('');
    } catch (error: any) {
      toast.error('❌ Fingerprint capture failed. Please try again.');
      setShowCapturingModal(false);
    } finally {
      setFingerprintCapturing(false);
      setCapturingStep('');
    }
  };

  /** Accept fingerprint preview and enroll using client-side matching */
  const handleAcceptFingerprintPreview = async () => {
    if (!pendingCaptureResult || !applicantId) {
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

      // STEP 1: Get all stored templates from backend
      const templatesResponse = await BiometricAPIService.getTemplatesForMatching(applicantId);

      if (!templatesResponse.success) {
        toast.error('Failed to fetch templates for matching');
        setFingerprintCapturing(false);
        setUploadProgress('');
        return;
      }

      // STEP 2: Use Mantra SDK's verify endpoint to check against each stored template
      const liveTemplate = biometricTemplate.template;
      const matchThreshold = 65;
      let matchFound = false;
      let matchedTemplate: any = null;
      let matchScore = 0;

      setUploadProgress(
        `Matching against ${templatesResponse.templates.length} stored fingerprints...`
      );

      for (const storedTemplate of templatesResponse.templates) {
        try {
          // Use Mantra SDK's verify endpoint for accurate fingerprint matching
          const matchResult = await MantraSDKService.verifyTemplate(
            storedTemplate.template, // Gallery (stored)
            liveTemplate, // Probe (live)
            matchThreshold
          );

          if (matchResult.isMatch || matchResult.score >= matchThreshold) {
            // Match found - stop checking immediately
            matchFound = true;
            matchedTemplate = storedTemplate;
            matchScore = matchResult.score;
            break; // Exit the loop immediately
          }
        } catch (matchError) {
          // Continue checking other templates
        }
      }

      // If match was found, show error modal and exit without storing
      if (matchFound && matchedTemplate) {
        // Store duplicate info for modal display
        setDuplicateMatchInfo({
          applicationId: matchedTemplate.applicationId || 'Unknown',
          almsLicenseId: matchedTemplate.almsLicenseId || null,
          applicantName: matchedTemplate.applicantName || 'Unknown',
          fingerPosition: matchedTemplate.fingerPosition || 'Unknown',
        });
        setShowDuplicateModal(true);

        // Close fingerprint preview modal and reset
        setShowFingerprintPreviewModal(false);
        setFingerprintPreviewImage(null);
        setPendingCaptureResult(null);
        setFingerprintCapturing(false);
        setUploadProgress('');
        return; // Exit function - do NOT store fingerprint
      }

      // STEP 3: No match found - store the fingerprint
      setUploadProgress('No duplicate found. Storing fingerprint...');

      const storeResponse = await BiometricAPIService.storeFingerprint(
        applicantId,
        pendingFingerPosition,
        biometricTemplate,
        `Captured via Mantra SDK - ${pendingFingerPosition}`
      );

      if (!storeResponse.success) {
        toast.error(`Failed to store fingerprint: ${storeResponse.message}`);
        setFingerprintCapturing(false);
        setUploadProgress('');
        return;
      }

      // Fingerprint was unique and has been stored successfully
      // Show success modal
      setSuccessInfo({
        fingerPosition: pendingFingerPosition,
        quality: pendingCaptureResult.quality,
        enrolledAt: storeResponse.enrolledAt || new Date().toISOString(),
      });
      setShowSuccessModal(true);

      // Auto-close success modal after 5 seconds
      setTimeout(() => {
        setShowSuccessModal(false);
        setSuccessInfo(null);
      }, 5000);

      // Replace local state with latest fingerprint only (keep only the most recent)
      setEnrolledFingerprints([
        {
          id: storeResponse.fingerprintId,
          position: pendingFingerPosition,
          enrolledAt: storeResponse.enrolledAt,
          quality: pendingCaptureResult.quality,
          bitmapData: pendingCaptureResult.bitmapData || fingerprintPreviewImage,
        },
      ]);

      // Close fingerprint preview modal and reset
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

  /** Cancel fingerprint preview without retaking */
  const handleCancelFingerprintPreview = () => {
    setShowFingerprintPreviewModal(false);
    setFingerprintPreviewImage(null);
    setPendingCaptureResult(null);
    setPendingFingerPosition('RIGHT_THUMB');
  };

  /** 📷 WEBCAM MODAL HANDLERS */

  /** Open webcam modal */
  const openWebcamModal = () => {
    setShowWebcamModal(true);
    setWebcamCapturedPhoto(null);
    setStreamActive(true);
  };

  /** Capture photo in webcam modal */
  const capturePhotoInModal = () => {
    if (!webcamRef.current) return;
    const dataUrl = webcamRef.current.getScreenshot();
    if (!dataUrl) {
      toast.error('Failed to capture photo. Ensure webcam is active.');
      return;
    }
    setWebcamCapturedPhoto(dataUrl);
    setStreamActive(false);
  };

  /** Retake photo in webcam modal */
  const retakePhotoInModal = () => {
    setWebcamCapturedPhoto(null);
    setStreamActive(true);
  };

  /** Submit photo from webcam modal */
  const submitPhotoFromModal = async () => {
    if (!webcamCapturedPhoto) {
      toast.warning('Please capture a photo first.');
      return;
    }

    try {
      setUploadingFiles(true);
      setUploadProgress('Submitting photograph...');

      // Convert data URL to File
      const blob = await (await fetch(webcamCapturedPhoto)).blob();
      const file = new File([blob], 'photograph.jpg', { type: 'image/jpeg' });

      setPhotoPreview(webcamCapturedPhoto);
      setForm(prev => ({ ...prev, photograph: file }));

      if (applicantId) {
        // Upload the photograph using FileUploadService with PHOTOGRAPH fileType
        // Backend will automatically delete existing PHOTOGRAPH entries to keep only the latest
        await FileUploadService.uploadFile(applicantId, file, 'PHOTOGRAPH', 'Photograph');

        setPhotoSubmitted(true);

        // Close webcam modal first
        setShowWebcamModal(false);
        setWebcamCapturedPhoto(null);
        setStreamActive(false);

        // Show success modal
        setShowPhotoSuccessModal(true);

        // Auto-close success modal after 5 seconds
        setTimeout(() => {
          setShowPhotoSuccessModal(false);
        }, 5000);
      } else {
        toast.warning('Please create application first.');
        // Close modal
        setShowWebcamModal(false);
        setWebcamCapturedPhoto(null);
        setStreamActive(false);
      }
    } catch (err: any) {
      console.error('❌ [BiometricInformation] Photo upload error:', err);
      setPhotoErrorMessage(err?.message || 'Failed to submit photograph. Please try again.');
      setShowPhotoErrorModal(true);

      // Close webcam modal
      setShowWebcamModal(false);
      setWebcamCapturedPhoto(null);
      setStreamActive(false);
    } finally {
      setUploadingFiles(false);
      setUploadProgress('');
    }
  };

  /** Cancel webcam modal */
  const cancelWebcamModal = () => {
    setShowWebcamModal(false);
    setWebcamCapturedPhoto(null);
    setStreamActive(false);
  };

  /** ⚙️ DIAGNOSTIC TEST FUNCTIONS FOR DEVICE TROUBLESHOOTING */

  const runDiagnostic = async (testName: string, testFn: () => Promise<any>) => {
    try {
      setDiagnosticLoading(testName);
      const result = await testFn();
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
            <div className='flex items-center gap-2'>
              {/* Info Icon with Tooltip */}
              <div className='relative'>
                <button
                  type='button'
                  onClick={() => setShowInfoTooltip(!showInfoTooltip)}
                  className='p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-full transition-colors'
                  title='Device setup information'
                >
                  <svg className='w-5 h-5' fill='currentColor' viewBox='0 0 20 20'>
                    <path
                      fillRule='evenodd'
                      d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z'
                      clipRule='evenodd'
                    />
                  </svg>
                </button>
                {/* Info Tooltip Popover */}
                {showInfoTooltip && (
                  <div className='absolute right-0 top-8 w-80 bg-white border border-gray-200 rounded-lg shadow-xl z-50 p-4'>
                    <div className='flex justify-between items-start mb-3'>
                      <h4 className='font-semibold text-gray-800 flex items-center gap-2'>
                        <svg
                          className='w-5 h-5 text-blue-600'
                          fill='currentColor'
                          viewBox='0 0 20 20'
                        >
                          <path
                            fillRule='evenodd'
                            d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z'
                            clipRule='evenodd'
                          />
                        </svg>
                        Device Setup Guide
                      </h4>
                      <button
                        type='button'
                        onClick={() => setShowInfoTooltip(false)}
                        className='text-gray-400 hover:text-gray-600'
                      >
                        ✕
                      </button>
                    </div>
                    <div className='space-y-3 text-sm text-gray-600'>
                      <div className='flex items-start gap-2'>
                        <span className='text-green-500 mt-0.5'>✔</span>
                        <div>
                          <strong>1. Connect Device</strong>
                          <p className='text-xs text-gray-500'>
                            Connect Mantra MFS500 via USB port
                          </p>
                        </div>
                      </div>
                      <div className='flex items-start gap-2'>
                        <span className='text-green-500 mt-0.5'>✔</span>
                        <div>
                          <strong>2. Install Device Drivers</strong>
                          <p className='text-xs text-gray-500'>
                            Install Mantra MFS500 drivers from official website
                          </p>
                        </div>
                      </div>
                      <div className='flex items-start gap-2'>
                        <span className='text-green-500 mt-0.5'>✔</span>
                        <div>
                          <strong>3. Install RD Service</strong>
                          <p className='text-xs text-gray-500'>
                            Install and run Mantra RD Service application
                          </p>
                        </div>
                      </div>
                      <div className='flex items-start gap-2'>
                        <span className='text-green-500 mt-0.5'>✔</span>
                        <div>
                          <strong>4. Start MorfinAuth Service</strong>
                          <p className='text-xs text-gray-500'>
                            Ensure MorfinAuth SDK is running on port 8030
                          </p>
                        </div>
                      </div>
                      <div className='flex items-start gap-2'>
                        <span className='text-blue-500 mt-0.5'>ℹ</span>
                        <div>
                          <strong>Troubleshooting</strong>
                          <p className='text-xs text-gray-500'>
                            Use Settings → Diagnostics to test connectivity
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className='mt-3 pt-3 border-t border-gray-200'>
                      <a
                        href='https://www.mantratecapp.com/MorfinAuth_Setup_Dist.exe'
                        target='_blank'
                        rel='noopener noreferrer'
                        className='text-xs text-blue-600 hover:underline flex items-center gap-1'
                      >
                        <svg
                          className='w-3 h-3'
                          fill='none'
                          stroke='currentColor'
                          viewBox='0 0 24 24'
                        >
                          <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth={2}
                            d='M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4'
                          />
                        </svg>
                        Download MorfinAuth SDK
                      </a>
                    </div>
                  </div>
                )}
              </div>
              <button
                type='button'
                onClick={() => setShowDeviceSettings(!showDeviceSettings)}
                className='px-3 py-1 text-sm bg-gray-600 hover:bg-gray-700 text-white rounded flex items-center gap-1'
                title='Open device diagnostics and settings'
              >
                ⚙️ Settings
              </button>
            </div>
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

            {/* Show only the latest enrolled fingerprint with improved UI */}
            {enrolledFingerprints.length > 0 &&
              (() => {
                const latestFp = enrolledFingerprints[enrolledFingerprints.length - 1];
                return (
                  <div className='mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200 shadow-sm'>
                    <div className='flex items-center gap-2 mb-3'>
                      <div className='bg-green-500 rounded-full p-1'>
                        <svg className='w-4 h-4 text-white' fill='currentColor' viewBox='0 0 20 20'>
                          <path
                            fillRule='evenodd'
                            d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                            clipRule='evenodd'
                          />
                        </svg>
                      </div>
                      <span className='font-semibold text-green-700 text-sm'>
                        Fingerprint Enrolled Successfully
                      </span>
                    </div>
                    <div className='flex items-center gap-4'>
                      {/* Fingerprint Image */}
                      <div className='w-20 h-24 bg-white rounded-lg overflow-hidden border-2 border-green-300 shadow-md'>
                        {latestFp.bitmapData ? (
                          <img
                            src={
                              latestFp.bitmapData.startsWith('data:')
                                ? latestFp.bitmapData
                                : `data:image/bmp;base64,${latestFp.bitmapData}`
                            }
                            alt={latestFp.position}
                            className='w-full h-full object-cover'
                          />
                        ) : (
                          <div className='w-full h-full flex items-center justify-center bg-gray-50'>
                            <svg
                              className='h-10 w-10 text-green-400'
                              fill='none'
                              viewBox='0 0 24 24'
                              stroke='currentColor'
                            >
                              <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth={1.5}
                                d='M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4'
                              />
                            </svg>
                          </div>
                        )}
                      </div>
                      {/* Fingerprint Details */}
                      <div className='flex flex-col gap-1'>
                        <div className='flex items-center gap-2'>
                          <span className='text-sm text-gray-500'>Position:</span>
                          <span className='font-semibold text-gray-800 bg-white px-2 py-0.5 rounded text-sm border'>
                            {latestFp.position}
                          </span>
                        </div>
                        <div className='flex items-center gap-2'>
                          <span className='text-sm text-gray-500'>Quality:</span>
                          <span
                            className={`font-semibold px-2 py-0.5 rounded text-sm ${
                              latestFp.quality >= 80
                                ? 'bg-green-100 text-green-700'
                                : latestFp.quality >= 60
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {latestFp.quality}%
                          </span>
                        </div>
                        {latestFp.enrolledAt && (
                          <span className='text-xs text-gray-400'>
                            Enrolled: {new Date(latestFp.enrolledAt).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}
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
          {/* Webcam & Upload Section */}
          <div className='space-y-3'>
            <div className='flex flex-col space-y-2'>
              <button
                type='button'
                onClick={openWebcamModal}
                className='px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-medium'
              >
                📷 Use Webcam
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

      {/* 🔄 CAPTURING MODAL - Skeleton Loading UI */}
      {showCapturingModal && (
        <div
          className='fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] p-4'
          style={{ display: 'flex', visibility: 'visible' }}
        >
          <div className='bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden'>
            {/* Header */}
            <div className='bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5'>
              <div className='flex items-center gap-4'>
                <div className='bg-white/20 rounded-full p-3 relative'>
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
                      d='M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11'
                    />
                  </svg>
                  {/* Pulsing ring animation */}
                  <div className='absolute inset-0 rounded-full border-2 border-white/50 animate-ping'></div>
                </div>
                <div>
                  <h2 className='text-xl font-bold text-white'>Capturing Fingerprint</h2>
                  <p className='text-blue-100 text-sm mt-1'>
                    Keep your finger steady on the scanner
                  </p>
                </div>
              </div>
            </div>

            {/* Content - Skeleton Loading */}
            <div className='px-6 py-6'>
              {/* Current Step with Animation */}
              <div className='text-center mb-6'>
                <div className='inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full'>
                  <svg
                    className='w-5 h-5 text-blue-600 animate-spin'
                    fill='none'
                    viewBox='0 0 24 24'
                  >
                    <circle
                      className='opacity-25'
                      cx='12'
                      cy='12'
                      r='10'
                      stroke='currentColor'
                      strokeWidth='4'
                    ></circle>
                    <path
                      className='opacity-75'
                      fill='currentColor'
                      d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                    ></path>
                  </svg>
                  <span className='text-blue-700 font-medium'>{capturingStep}</span>
                </div>
              </div>

              {/* Fingerprint Scanner Animation */}
              <div className='flex justify-center mb-6'>
                <div className='relative w-44 h-52 bg-gradient-to-b from-gray-100 to-gray-200 rounded-2xl border-2 border-blue-400 overflow-hidden shadow-inner'>
                  {/* Scanning Line Animation */}
                  <div className='absolute inset-x-0 h-1.5 bg-gradient-to-r from-blue-400 via-blue-600 to-blue-400 animate-scan-line shadow-lg'></div>

                  {/* Fingerprint Placeholder Skeleton */}
                  <div className='absolute inset-4 flex flex-col items-center justify-center'>
                    <div className='relative'>
                      <svg
                        className='w-28 h-36 text-gray-300 animate-pulse'
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={1}
                          d='M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4'
                        />
                      </svg>
                    </div>
                  </div>

                  {/* Corner markers */}
                  <div className='absolute top-3 left-3 w-5 h-5 border-t-3 border-l-3 border-blue-500 rounded-tl'></div>
                  <div className='absolute top-3 right-3 w-5 h-5 border-t-3 border-r-3 border-blue-500 rounded-tr'></div>
                  <div className='absolute bottom-3 left-3 w-5 h-5 border-b-3 border-l-3 border-blue-500 rounded-bl'></div>
                  <div className='absolute bottom-3 right-3 w-5 h-5 border-b-3 border-r-3 border-blue-500 rounded-br'></div>

                  {/* Glow effect at bottom */}
                  <div className='absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-blue-100/50 to-transparent'></div>
                </div>
              </div>

              {/* Step Indicators */}
              <div className='mb-6'>
                <div className='flex items-center justify-between text-xs text-gray-500 mb-3'>
                  <div
                    className={`flex items-center gap-1 ${capturingStep.includes('Initializing') ? 'text-blue-600 font-medium' : capturingStep.includes('Place') || capturingStep.includes('Scanning') || capturingStep.includes('Processing') || capturingStep.includes('Generating') ? 'text-green-600' : 'text-gray-400'}`}
                  >
                    {capturingStep.includes('Place') ||
                    capturingStep.includes('Scanning') ||
                    capturingStep.includes('Processing') ||
                    capturingStep.includes('Generating')
                      ? '✓'
                      : '1.'}{' '}
                    Initialize
                  </div>
                  <div
                    className={`flex items-center gap-1 ${capturingStep.includes('Place') ? 'text-blue-600 font-medium' : capturingStep.includes('Scanning') || capturingStep.includes('Processing') || capturingStep.includes('Generating') ? 'text-green-600' : 'text-gray-400'}`}
                  >
                    {capturingStep.includes('Scanning') ||
                    capturingStep.includes('Processing') ||
                    capturingStep.includes('Generating')
                      ? '✓'
                      : '2.'}{' '}
                    Place Finger
                  </div>
                  <div
                    className={`flex items-center gap-1 ${capturingStep.includes('Scanning') ? 'text-blue-600 font-medium' : capturingStep.includes('Processing') || capturingStep.includes('Generating') ? 'text-green-600' : 'text-gray-400'}`}
                  >
                    {capturingStep.includes('Processing') || capturingStep.includes('Generating')
                      ? '✓'
                      : '3.'}{' '}
                    Capture
                  </div>
                  <div
                    className={`flex items-center gap-1 ${capturingStep.includes('Processing') || capturingStep.includes('Generating') ? 'text-blue-600 font-medium' : 'text-gray-400'}`}
                  >
                    4. Process
                  </div>
                </div>
                <div className='w-full bg-gray-200 rounded-full h-2 overflow-hidden'>
                  <div className='bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full animate-progress-bar'></div>
                </div>
              </div>

              {/* Visual Instructions */}
              <div className='grid grid-cols-3 gap-3 mb-4'>
                <div className='text-center p-3 bg-gray-50 rounded-lg'>
                  <div className='w-10 h-10 mx-auto mb-2 bg-blue-100 rounded-full flex items-center justify-center'>
                    <svg
                      className='w-5 h-5 text-blue-600'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0'
                      />
                    </svg>
                  </div>
                  <p className='text-xs text-gray-600 font-medium'>Keep Flat</p>
                </div>
                <div className='text-center p-3 bg-gray-50 rounded-lg'>
                  <div className='w-10 h-10 mx-auto mb-2 bg-blue-100 rounded-full flex items-center justify-center'>
                    <svg
                      className='w-5 h-5 text-blue-600'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122'
                      />
                    </svg>
                  </div>
                  <p className='text-xs text-gray-600 font-medium'>Gentle Press</p>
                </div>
                <div className='text-center p-3 bg-gray-50 rounded-lg'>
                  <div className='w-10 h-10 mx-auto mb-2 bg-blue-100 rounded-full flex items-center justify-center'>
                    <svg
                      className='w-5 h-5 text-blue-600'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
                      />
                    </svg>
                  </div>
                  <p className='text-xs text-gray-600 font-medium'>Hold Still</p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className='border-t border-gray-200 px-6 py-4 bg-gray-50 flex justify-center'>
              <button
                type='button'
                onClick={() => {
                  setShowCapturingModal(false);
                  setFingerprintCapturing(false);
                  setCapturingStep('');
                }}
                className='px-6 py-2.5 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium text-sm transition-colors flex items-center gap-2'
              >
                <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M6 18L18 6M6 6l12 12'
                  />
                </svg>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fingerprint Preview Modal */}
      {showFingerprintPreviewModal && pendingCaptureResult && (
        <div
          className='fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] p-4'
          style={{ display: 'flex', visibility: 'visible' }}
        >
          <div className='bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-auto border border-gray-200'>
            {/* Header with ALMS theme */}
            <div className='bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5'>
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
                      d='M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11'
                    />
                  </svg>
                </div>
                <div>
                  <h2 className='text-xl font-bold text-white'>Fingerprint Preview</h2>
                  <p className='text-blue-100 text-sm mt-1'>Review and confirm before enrolling</p>
                </div>
              </div>
            </div>

            <div className='px-6 py-6'>
              {/* Quality Score with Visual Indicator */}
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
                      {(pendingCaptureResult?.quality || 0) >= 80 ? (
                        <svg
                          className='w-6 h-6 text-green-600'
                          fill='currentColor'
                          viewBox='0 0 20 20'
                        >
                          <path
                            fillRule='evenodd'
                            d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
                            clipRule='evenodd'
                          />
                        </svg>
                      ) : (pendingCaptureResult?.quality || 0) >= 60 ? (
                        <svg
                          className='w-6 h-6 text-yellow-600'
                          fill='currentColor'
                          viewBox='0 0 20 20'
                        >
                          <path
                            fillRule='evenodd'
                            d='M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z'
                            clipRule='evenodd'
                          />
                        </svg>
                      ) : (
                        <svg
                          className='w-6 h-6 text-red-600'
                          fill='currentColor'
                          viewBox='0 0 20 20'
                        >
                          <path
                            fillRule='evenodd'
                            d='M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z'
                            clipRule='evenodd'
                          />
                        </svg>
                      )}
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

              {/* Fingerprint Image Section */}
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
                          onError={e => {
                            e.currentTarget.src =
                              'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23f0f0f0" width="200" height="200"/%3E%3Ctext x="50%" y="50%" font-size="16" text-anchor="middle" dy=".3em" fill="%23999"%3EImage Load Failed%3C/text%3E%3C/svg%3E';
                          }}
                        />
                        {/* Success indicator overlay */}
                        <div className='absolute -top-2 -right-2 bg-green-500 rounded-full p-1.5 shadow-lg'>
                          <svg
                            className='w-4 h-4 text-white'
                            fill='currentColor'
                            viewBox='0 0 20 20'
                          >
                            <path
                              fillRule='evenodd'
                              d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                              clipRule='evenodd'
                            />
                          </svg>
                        </div>
                      </div>
                      <p className='text-xs text-gray-500 flex items-center gap-1'>
                        <svg className='w-3 h-3' fill='currentColor' viewBox='0 0 20 20'>
                          <path
                            fillRule='evenodd'
                            d='M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z'
                            clipRule='evenodd'
                          />
                        </svg>
                        Image Size: {Math.round(fingerprintPreviewImage.length / 1024)} KB
                      </p>
                    </div>
                  ) : (
                    <div className='text-center py-8'>
                      <div className='bg-gray-200 rounded-full p-4 mx-auto w-16 h-16 flex items-center justify-center mb-3'>
                        <svg
                          className='w-8 h-8 text-gray-400'
                          fill='none'
                          stroke='currentColor'
                          viewBox='0 0 24 24'
                        >
                          <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth={2}
                            d='M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z'
                          />
                        </svg>
                      </div>
                      <p className='text-gray-500 font-medium'>No preview image available</p>
                      <p className='text-sm text-gray-400 mt-1'>
                        Template data captured - you can still enroll
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Finger Position Badge */}
              <div className='mb-6'>
                <h3 className='text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide'>
                  Finger Position
                </h3>
                <div className='flex items-center gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200'>
                  <div className='bg-blue-600 rounded-full p-2'>
                    <svg
                      className='w-5 h-5 text-white'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11'
                      />
                    </svg>
                  </div>
                  <div>
                    <p className='text-sm text-blue-600'>Selected Position</p>
                    <p className='text-lg font-semibold text-blue-800'>{pendingFingerPosition}</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className='flex gap-3 pt-4 border-t border-gray-200'>
                <button
                  onClick={handleAcceptFingerprintPreview}
                  disabled={fingerprintCapturing}
                  className={`flex-1 px-4 py-3.5 rounded-lg font-semibold text-white transition-all flex items-center justify-center gap-2 ${
                    fingerprintCapturing
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-green-600 hover:bg-green-700 active:bg-green-800 shadow-lg hover:shadow-xl'
                  }`}
                >
                  {fingerprintCapturing ? (
                    <>
                      <svg className='w-5 h-5 animate-spin' fill='none' viewBox='0 0 24 24'>
                        <circle
                          className='opacity-25'
                          cx='12'
                          cy='12'
                          r='10'
                          stroke='currentColor'
                          strokeWidth='4'
                        ></circle>
                        <path
                          className='opacity-75'
                          fill='currentColor'
                          d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                        ></path>
                      </svg>
                      Enrolling...
                    </>
                  ) : (
                    <>
                      <svg className='w-5 h-5' fill='currentColor' viewBox='0 0 20 20'>
                        <path
                          fillRule='evenodd'
                          d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                          clipRule='evenodd'
                        />
                      </svg>
                      Accept & Enroll
                    </>
                  )}
                </button>
                <button
                  onClick={handleRejectFingerprintPreview}
                  disabled={fingerprintCapturing}
                  className={`flex-1 px-4 py-3.5 rounded-lg font-semibold text-white transition-all flex items-center justify-center gap-2 ${
                    fingerprintCapturing
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-orange-500 hover:bg-orange-600 active:bg-orange-700'
                  }`}
                >
                  <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15'
                    />
                  </svg>
                  Retake
                </button>
                <button
                  onClick={handleCancelFingerprintPreview}
                  disabled={fingerprintCapturing}
                  className={`px-4 py-3.5 rounded-lg font-semibold text-white transition-all flex items-center justify-center gap-2 ${
                    fingerprintCapturing
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-gray-500 hover:bg-gray-600 active:bg-gray-700'
                  }`}
                >
                  <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M6 18L18 6M6 6l12 12'
                    />
                  </svg>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 📷 WEBCAM CAPTURE MODAL */}
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
              {/* Camera / Preview Display */}
              <div className='flex justify-center mb-6'>
                <div className='relative'>
                  {/* Live camera view - always render Webcam but hide when photo captured */}
                  {streamActive && !webcamCapturedPhoto && (
                    <Webcam
                      ref={webcamRef}
                      audio={false}
                      screenshotFormat='image/jpeg'
                      className='w-72 h-72 object-cover rounded-lg border-2 border-gray-300 bg-black'
                      videoConstraints={{
                        width: 480,
                        height: 480,
                        facingMode: 'user',
                      }}
                    />
                  )}

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
                  disabled={uploadingFiles}
                  className={`flex-1 px-4 py-3 rounded-lg font-semibold text-white transition-colors ${
                    uploadingFiles
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

      {/* ⚠️ DUPLICATE FINGERPRINT ERROR MODAL */}
      {showDuplicateModal && duplicateMatchInfo && (
        <div
          className='fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] p-4'
          style={{ display: 'flex', visibility: 'visible' }}
        >
          <div className='bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-200'>
            {/* Header with ALMS red theme */}
            <div className='bg-gradient-to-r from-red-600 to-red-700 px-6 py-5'>
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
                  <h2 className='text-xl font-bold text-white'>Duplicate Fingerprint Detected</h2>
                  <p className='text-red-100 text-sm mt-1'>
                    This user already exists in the system
                  </p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className='px-6 py-6'>
              <div className='bg-red-50 border-l-4 border-red-500 rounded-r-lg p-4 mb-5'>
                <div className='flex items-start'>
                  <div className='flex-shrink-0'>
                    <svg className='h-5 w-5 text-red-500' fill='currentColor' viewBox='0 0 20 20'>
                      <path
                        fillRule='evenodd'
                        d='M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z'
                        clipRule='evenodd'
                      />
                    </svg>
                  </div>
                  <div className='ml-3'>
                    <p className='text-sm font-medium text-red-800'>
                      Cannot enroll this fingerprint. It matches an existing record.
                    </p>
                  </div>
                </div>
              </div>

              <div className='bg-gray-50 rounded-lg p-4 border border-gray-200'>
                <h3 className='text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide'>
                  Existing Record Details
                </h3>
                <div className='space-y-3'>
                  <div className='flex items-center justify-between py-2 border-b border-gray-200'>
                    <span className='text-sm text-gray-600'>Application ID</span>
                    <span className='text-sm font-semibold text-gray-900'>
                      {duplicateMatchInfo.applicationId}
                    </span>
                  </div>
                  {duplicateMatchInfo.almsLicenseId && (
                    <div className='flex items-center justify-between py-2 border-b border-gray-200'>
                      <span className='text-sm text-gray-600'>License ID</span>
                      <span className='text-sm font-semibold text-gray-900'>
                        {duplicateMatchInfo.almsLicenseId}
                      </span>
                    </div>
                  )}
                  <div className='flex items-center justify-between py-2 border-b border-gray-200'>
                    <span className='text-sm text-gray-600'>Applicant Name</span>
                    <span className='text-sm font-semibold text-gray-900'>
                      {duplicateMatchInfo.applicantName}
                    </span>
                  </div>
                  <div className='flex items-center justify-between py-2'>
                    <span className='text-sm text-gray-600'>Finger Position</span>
                    <span className='text-sm font-semibold text-gray-900'>
                      {duplicateMatchInfo.fingerPosition}
                    </span>
                  </div>
                </div>
              </div>

              <p className='text-gray-500 text-sm mt-4 text-center'>
                Please use a different finger or contact the administrator if you believe this is an
                error.
              </p>
            </div>

            {/* Footer */}
            <div className='border-t border-gray-200 px-6 py-4 bg-gray-50 flex justify-end gap-3'>
              <button
                type='button'
                onClick={() => {
                  setShowDuplicateModal(false);
                  setDuplicateMatchInfo(null);
                }}
                className='px-5 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium text-sm transition-colors'
              >
                Close
              </button>
              <button
                type='button'
                onClick={() => {
                  setShowDuplicateModal(false);
                  setDuplicateMatchInfo(null);
                }}
                className='px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors'
              >
                Try Different Finger
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ SUCCESS FINGERPRINT ENROLLED MODAL */}
      {showSuccessModal && successInfo && (
        <div
          className='fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] p-4'
          style={{ display: 'flex', visibility: 'visible' }}
        >
          <div className='bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-200'>
            {/* Header with ALMS green theme */}
            <div className='bg-gradient-to-r from-green-600 to-green-700 px-6 py-5'>
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
                      d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
                    />
                  </svg>
                </div>
                <div>
                  <h2 className='text-xl font-bold text-white'>
                    Fingerprint Enrolled Successfully
                  </h2>
                  <p className='text-green-100 text-sm mt-1'>Biometric data saved to the system</p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className='px-6 py-6'>
              <div className='bg-green-50 border-l-4 border-green-500 rounded-r-lg p-4 mb-5'>
                <div className='flex items-start'>
                  <div className='flex-shrink-0'>
                    <svg className='h-5 w-5 text-green-500' fill='currentColor' viewBox='0 0 20 20'>
                      <path
                        fillRule='evenodd'
                        d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
                        clipRule='evenodd'
                      />
                    </svg>
                  </div>
                  <div className='ml-3'>
                    <p className='text-sm font-medium text-green-800'>
                      The fingerprint has been successfully captured and stored.
                    </p>
                  </div>
                </div>
              </div>

              <div className='bg-gray-50 rounded-lg p-4 border border-gray-200'>
                <h3 className='text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide'>
                  Enrollment Details
                </h3>
                <div className='space-y-3'>
                  <div className='flex items-center justify-between py-2 border-b border-gray-200'>
                    <span className='text-sm text-gray-600'>Finger Position</span>
                    <span className='text-sm font-semibold text-gray-900'>
                      {successInfo.fingerPosition}
                    </span>
                  </div>
                  <div className='flex items-center justify-between py-2 border-b border-gray-200'>
                    <span className='text-sm text-gray-600'>Capture Quality</span>
                    <span className='text-sm font-semibold text-green-600'>
                      {successInfo.quality}%
                    </span>
                  </div>
                  <div className='flex items-center justify-between py-2'>
                    <span className='text-sm text-gray-600'>Enrolled At</span>
                    <span className='text-sm font-semibold text-gray-900'>
                      {new Date(successInfo.enrolledAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <p className='text-gray-500 text-sm mt-4 text-center'>
                This window will close automatically in 5 seconds.
              </p>
            </div>

            {/* Footer */}
            <div className='border-t border-gray-200 px-6 py-4 bg-gray-50 flex justify-center'>
              <button
                type='button'
                onClick={() => {
                  setShowSuccessModal(false);
                  setSuccessInfo(null);
                }}
                className='px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium text-sm transition-colors'
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 📸 PHOTO SUCCESS MODAL */}
      {showPhotoSuccessModal && (
        <div
          className='fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] p-4'
          style={{ display: 'flex', visibility: 'visible' }}
        >
          <div className='bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200'>
            {/* Header */}
            <div className='bg-gradient-to-r from-green-500 to-green-600 px-6 py-5'>
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
                      d='M5 13l4 4L19 7'
                    />
                  </svg>
                </div>
                <div>
                  <h2 className='text-xl font-bold text-white'>Photo Uploaded!</h2>
                  <p className='text-green-100 text-sm mt-1'>Your photograph has been saved</p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className='px-6 py-6'>
              {/* Photo Preview */}
              <div className='flex justify-center mb-6'>
                <div className='relative'>
                  <div className='w-32 h-40 rounded-lg overflow-hidden border-4 border-green-500 shadow-lg'>
                    {photoPreview ? (
                      <img
                        src={photoPreview}
                        alt='Uploaded photograph'
                        className='w-full h-full object-cover'
                      />
                    ) : (
                      <div className='w-full h-full bg-gray-100 flex items-center justify-center'>
                        <svg
                          className='w-12 h-12 text-gray-400'
                          fill='none'
                          stroke='currentColor'
                          viewBox='0 0 24 24'
                        >
                          <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth={2}
                            d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                  {/* Success checkmark overlay */}
                  <div className='absolute -bottom-2 -right-2 bg-green-500 rounded-full p-1.5 shadow-lg'>
                    <svg
                      className='w-5 h-5 text-white'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={3}
                        d='M5 13l4 4L19 7'
                      />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Success Message */}
              <div className='text-center mb-4'>
                <p className='text-gray-700 font-medium'>Photograph uploaded successfully!</p>
                <p className='text-gray-500 text-sm mt-1'>
                  Your photo has been saved to your application.
                </p>
              </div>

              {/* Auto-close indicator */}
              <div className='flex items-center justify-center gap-2 text-sm text-gray-500'>
                <svg className='w-4 h-4 animate-spin' fill='none' viewBox='0 0 24 24'>
                  <circle
                    className='opacity-25'
                    cx='12'
                    cy='12'
                    r='10'
                    stroke='currentColor'
                    strokeWidth='4'
                  ></circle>
                  <path
                    className='opacity-75'
                    fill='currentColor'
                    d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                  ></path>
                </svg>
                <span>This message will close automatically</span>
              </div>
            </div>

            {/* Footer */}
            <div className='border-t border-gray-200 px-6 py-4 bg-gray-50 flex justify-center'>
              <button
                type='button'
                onClick={() => setShowPhotoSuccessModal(false)}
                className='px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium text-sm transition-colors flex items-center gap-2'
              >
                <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M5 13l4 4L19 7'
                  />
                </svg>
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ❌ PHOTO ERROR MODAL */}
      {showPhotoErrorModal && (
        <div
          className='fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] p-4'
          style={{ display: 'flex', visibility: 'visible' }}
        >
          <div className='bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200'>
            {/* Header */}
            <div className='bg-gradient-to-r from-red-500 to-red-600 px-6 py-5'>
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
                      d='M6 18L18 6M6 6l12 12'
                    />
                  </svg>
                </div>
                <div>
                  <h2 className='text-xl font-bold text-white'>Upload Failed</h2>
                  <p className='text-red-100 text-sm mt-1'>
                    There was a problem uploading your photo
                  </p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className='px-6 py-6'>
              {/* Error Icon */}
              <div className='flex justify-center mb-6'>
                <div className='w-20 h-20 bg-red-100 rounded-full flex items-center justify-center'>
                  <svg
                    className='w-10 h-10 text-red-500'
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
              </div>

              {/* Error Message */}
              <div className='text-center mb-4'>
                <p className='text-gray-700 font-medium'>Failed to upload photograph</p>
                <p className='text-gray-500 text-sm mt-2 bg-gray-100 rounded-lg p-3'>
                  {photoErrorMessage || 'An unexpected error occurred. Please try again.'}
                </p>
              </div>

              {/* Suggestion */}
              <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-3'>
                <div className='flex items-start gap-2'>
                  <svg
                    className='w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0'
                    fill='currentColor'
                    viewBox='0 0 20 20'
                  >
                    <path
                      fillRule='evenodd'
                      d='M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z'
                      clipRule='evenodd'
                    />
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

            {/* Footer */}
            <div className='border-t border-gray-200 px-6 py-4 bg-gray-50 flex justify-center gap-3'>
              <button
                type='button'
                onClick={() => {
                  setShowPhotoErrorModal(false);
                  setPhotoErrorMessage('');
                }}
                className='px-6 py-2.5 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium text-sm transition-colors'
              >
                Close
              </button>
              <button
                type='button'
                onClick={() => {
                  setShowPhotoErrorModal(false);
                  setPhotoErrorMessage('');
                  openWebcamModal();
                }}
                className='px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors flex items-center gap-2'
              >
                <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15'
                  />
                </svg>
                Try Again
              </button>
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
