'use client';
import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { Input } from '../elements/Input';
import FormFooter from '../elements/footer';
import { useRouter, useSearchParams } from 'next/navigation';
import { useRenewalForm } from './RenewalFormContext';
import { getNextRenewalRoute, getPreviousRenewalRoute } from './renewalRoutes';

const Webcam = dynamic(() => import('react-webcam').then(mod => mod.default), {
  ssr: false,
}) as any;

interface BiometricData {
  height: string;
  weight: string;
  identificationMark: string;
  eyeColor: string;
  hairColor: string;
  bloodGroup: string;
}

const initialState: BiometricData = {
  height: '',
  weight: '',
  identificationMark: '',
  eyeColor: '',
  hairColor: '',
  bloodGroup: '',
};

const mockPrefill: BiometricData = {
  height: '175',
  weight: '75',
  identificationMark: 'Scar on left forearm',
  eyeColor: 'Brown',
  hairColor: 'Black',
  bloodGroup: 'O+',
};

const BiometricInformationRenewal: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const applicantId = searchParams?.get('id') || searchParams?.get('applicantId');

  const { state, updateFormData, setIsSubmitting, setSubmitError, setSubmitSuccess } = useRenewalForm();
  const [form, setForm] = useState<BiometricData>(initialState);
  const [streamActive, setStreamActive] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoSubmitted, setPhotoSubmitted] = useState(false);
  const webcamRef = useRef<any>(null);

  useEffect(() => {
    if (applicantId) {
      setForm(mockPrefill);
      setSubmitSuccess('Biometric data loaded');
      setTimeout(() => setSubmitSuccess(null), 3000);
    }
  }, [applicantId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

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

  const openWebcamModal = () => {
    setStreamActive(true);
  };

  const capturePhoto = () => {
    if (!webcamRef.current) return;
    const dataUrl = webcamRef.current.getScreenshot();
    if (!dataUrl) return;
    setPhotoPreview(dataUrl);
    setStreamActive(false);
    setPhotoSubmitted(true);
  };

  const retakePhoto = () => {
    setPhotoPreview(null);
    setPhotoSubmitted(false);
    setStreamActive(true);
  };

  const handleSaveToDraft = () => {
    setIsSubmitting(true);
    updateFormData('biometricInformation', form);
    setSubmitSuccess('Saved to draft');
    setTimeout(() => setSubmitSuccess(null), 3000);
    setIsSubmitting(false);
  };

  const handleNext = () => {
    updateFormData('biometricInformation', form);
    const nextRoute = getNextRenewalRoute('/forms/renewal/biometric-information');
    router.push(`${nextRoute}${applicantId ? `?id=${applicantId}` : ''}`);
  };

  const handlePrevious = () => {
    const prevRoute = getPreviousRenewalRoute('/forms/renewal/biometric-information');
    router.push(`${prevRoute}${applicantId ? `?id=${applicantId}` : ''}`);
  };

  return (
    <form className="p-6 space-y-6">
      <h2 className="text-xl font-bold">Biometric Information</h2>

      {(applicantId || state.almsLicenseId) && (
        <div className="mb-4 p-3 bg-blue-100 border border-blue-400 text-blue-700 rounded flex justify-between items-center">
          <div className="flex flex-col">
            {state.almsLicenseId && <strong className="text-sm">License ID: {state.almsLicenseId}</strong>}
          </div>
          <button
            type="button"
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Refresh Data
          </button>
        </div>
      )}

      {state.submitSuccess && (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">{state.submitSuccess}</div>
      )}
      {state.submitError && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">{state.submitError}</div>
      )}

      {/* Fingerprint and Iris Section */}
      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <div className="flex justify-between items-center mb-2">
            <div className="font-semibold">Signature / Thumb Impression</div>
          </div>
          <div className="space-y-2">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Hand & Finger</label>
              <select className="w-full md:w-64 p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
                <option value="RIGHT_THUMB">Right Hand Thumb</option>
                <option value="LEFT_THUMB">Left Hand Thumb</option>
              </select>
              <p className="text-sm text-red-500 mt-1 font-medium">Only thumb fingers are allowed.</p>
            </div>

            <div className="flex items-center space-x-3">
              <button type="button" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium">
                Scan Fingerprint
              </button>
            </div>
          </div>
        </div>

        <div>
          <div className="font-semibold mb-2">Iris Scan</div>
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <button type="button" disabled className="px-4 py-2 bg-gray-400 text-white rounded cursor-not-allowed">
                Scan Iris
              </button>
              <span className="text-sm text-gray-500">Iris scanning will be available soon</span>
            </div>
          </div>
        </div>
      </div>

      {/* Photograph Section */}
      <div>
        <div className="font-semibold mb-2">Photograph</div>
        <p className="text-sm text-gray-600 mb-3">
          Capture the applicant's live photo using webcam or upload an existing photograph. Ensure
          the subject is centered and clearly visible.
        </p>

        <div className="grid md:grid-cols-2 gap-6 items-start">
          <div className="space-y-3">
            <div className="flex flex-col space-y-2">
              <button
                type="button"
                onClick={openWebcamModal}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-medium"
              >
                📷 Use Webcam
              </button>
              <label className="block border-2 border-dashed border-gray-300 rounded-lg p-4 text-center text-gray-600 cursor-pointer hover:border-blue-400">
                Or upload photograph
                <input
                  type="file"
                  name="photograph"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>
            </div>

            {streamActive && (
              <div className="mt-2">
                <Webcam
                  ref={webcamRef}
                  audio={false}
                  screenshotFormat="image/jpeg"
                  width={320}
                  height={240}
                  className="rounded-lg border"
                />
                <div className="flex gap-2 mt-2">
                  <button type="button" onClick={capturePhoto} className="px-4 py-2 bg-green-600 text-white rounded font-medium">
                    Capture
                  </button>
                  <button type="button" onClick={() => setStreamActive(false)} className="px-4 py-2 bg-gray-500 text-white rounded font-medium">
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {photoPreview && (
            <div className="flex flex-col items-center">
              <span className="font-semibold mb-2">Captured Photo Preview</span>
              <img src={photoPreview} alt="Captured" className="w-48 h-48 object-cover rounded border shadow" />
              <div className="flex gap-2 mt-2">
                {!photoSubmitted && (
                  <button type="button" className="px-4 py-2 bg-green-600 text-white rounded font-medium">
                    Submit
                  </button>
                )}
                {!photoSubmitted && (
                  <button type="button" onClick={retakePhoto} className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded font-medium">
                    Retake
                  </button>
                )}
                {photoSubmitted && (
                  <span className="text-green-600 font-semibold">✓ Submitted</span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <FormFooter
        onSaveToDraft={handleSaveToDraft}
        onNext={handleNext}
        onPrevious={handlePrevious}
        isLoading={state.isSubmitting}
      />
    </form>
  );
};

export default BiometricInformationRenewal;