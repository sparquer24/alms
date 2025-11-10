'use client';
import React, { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
// Load react-webcam dynamically to avoid SSR/type conflicts
// @ts-ignore - dynamic import & react-webcam types can conflict with project React types
const Webcam = dynamic(() => import('react-webcam').then(mod => mod.default), {
  ssr: false,
}) as any;
import FormFooter from '../elements/footer';
import { useRouter, useSearchParams } from 'next/navigation';
import { FileUploadService } from '../../../services/fileUpload';
import { postData } from '../../../api/axiosConfig';
import { ApplicationService } from '../../../api/applicationService';
import { FORM_ROUTES } from '../../../config/formRoutes';

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

  const [form, setForm] = useState<BiometricForm>(initialState);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [streamActive, setStreamActive] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [existingBiometricData, setExistingBiometricData] = useState<any | null>(null);

  const webcamRef = useRef<any>(null);

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
      } catch (err) {
        console.warn('Could not load existing biometric data', err);
      }
    };

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
      alert('Failed to capture photo. Ensure webcam is active.');
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
          fileType: 'OTHER',
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
          fileType: 'signature',
          fileName: form.signature.name,
          url: dataUrl,
          uploadedAt: new Date().toISOString(),
        };
        filesToUpload.push({ file: form.signature, type: 'OTHER', desc: 'Signature' });
      } catch (err) {
        console.warn('Failed to read signature file as base64', err);
      }
    }

    if (form.photograph) {
      try {
        const dataUrl = await fileToDataUrl(form.photograph);
        biometricData.photo = {
          fileType: 'photo',
          fileName: form.photograph.name,
          url: dataUrl,
          uploadedAt: new Date().toISOString(),
        };
        filesToUpload.push({ file: form.photograph, type: 'OTHER', desc: 'Photograph' });
      } catch (err) {
        console.warn('Failed to read photograph file as base64', err);
      }
    }

    if (form.iris) {
      try {
        const dataUrl = await fileToDataUrl(form.iris);
        biometricData.irisScan = {
          fileType: 'iris',
          fileName: form.iris.name,
          url: dataUrl,
          uploadedAt: new Date().toISOString(),
        };
        filesToUpload.push({ file: form.iris, type: 'OTHER', desc: 'Iris' });
      } catch (err) {
        console.warn('Failed to read iris file as base64', err);
      }
    }

    if (form.fingerprint) {
      try {
        const dataUrl = await fileToDataUrl(form.fingerprint);
        biometricData.fingerprint = {
          fileType: 'fingerprint',
          fileName: form.fingerprint.name,
          url: dataUrl,
          uploadedAt: new Date().toISOString(),
        };
        filesToUpload.push({ file: form.fingerprint, type: 'OTHER', desc: 'Fingerprint' });
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
    if (Object.keys(biometricData).length === 0) return;

    try {
      setUploadingFiles(true);

      // Upload files to storage/backend as before (keeps current behavior)
      for (let i = 0; i < filesToUpload.length; i++) {
        const { file, type, desc } = filesToUpload[i];
        setUploadProgress(`Uploading ${file.name} (${i + 1}/${filesToUpload.length})`);
        await FileUploadService.uploadFile(appId, file, type, desc);
      }

      // PATCH application form with biometricData (use ApplicationService to keep payload handling consistent)
      await ApplicationService.updateApplication(appId, { biometricData } as any, 'personal');

      alert('Biometric data updated successfully');
    } catch (err: any) {
      console.error('Biometric upload/patch error:', err);
      alert('Failed to update biometric data');
    } finally {
      setUploadingFiles(false);
      setUploadProgress('');
    }
  };

  /** 🔄 Navigation handlers */
  const handleSaveToDraft = async () => {
    if (!applicantId) return alert('Please create application first.');
    await uploadBiometricFiles(applicantId);
  };

  const handleNext = async () => {
    if (!applicantId) return alert('Please save Personal Info first.');
    await uploadBiometricFiles(applicantId);
    router.push(`${FORM_ROUTES.DOCUMENTS_UPLOAD}?id=${encodeURIComponent(applicantId)}`);
  };

  const handlePrevious = () => {
    if (applicantId)
      router.push(`${FORM_ROUTES.LICENSE_DETAILS}?id=${encodeURIComponent(applicantId)}`);
    else router.back();
  };

  /** 🔍 Fingerprint & Iris scans */
  const handleScanFingerprint = async () => {
    try {
      const res = await fetch('/api/device/scan/fingerprint', { method: 'POST' });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      setForm(prev => ({ ...prev, fingerprint: new File([blob], 'fingerprint.bin') }));
      alert('Fingerprint captured successfully');
    } catch {
      alert('Failed to capture fingerprint');
    }
  };

  const handleScanIris = async () => {
    try {
      const res = await fetch('/api/device/scan/iris', { method: 'POST' });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      setForm(prev => ({ ...prev, iris: new File([blob], 'iris.bin') }));
      alert('Iris captured successfully');
    } catch {
      alert('Failed to capture iris');
    }
  };

  return (
    <form className='p-6 space-y-6'>
      <h2 className='text-xl font-bold'>Biometric Information</h2>

      {/* 🔹 Fingerprint and Iris Section */}
      <div className='grid md:grid-cols-2 gap-8'>
        <div>
          <div className='font-semibold mb-2'>Signature / Thumb Impression</div>
          <div className='space-y-2'>
            <div className='flex items-center space-x-3'>
              <button
                type='button'
                onClick={handleScanFingerprint}
                disabled
                aria-disabled='true'
                aria-label='Fingerprint scanning will be available soon'
                title='Fingerprint scanning will be available soon'
                className='px-4 py-2 bg-gray-400 text-white rounded cursor-not-allowed'
              >
                Scan Fingerprint
              </button>
              <span className='text-sm text-gray-500'>
                Fingerprint scanning will be available soon
              </span>
            </div>
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
                  className='w-full h-60 object-cover rounded border bg-black'
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
              <button
                type='button'
                onClick={removePhoto}
                className='mt-2 px-3 py-1 bg-red-500 text-white rounded'
              >
                Remove
              </button>
            </div>
          )}
        </div>
      </div>

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
