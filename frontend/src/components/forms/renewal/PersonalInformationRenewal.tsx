'use client';
import React, { useState, useEffect } from 'react';
import { FormDataLoader } from '../../../utils/formDataLoader';
import { IoMdMale, IoMdFemale } from 'react-icons/io';
import { Input } from '../elements/Input';
import { useRouter, useSearchParams } from 'next/navigation';
import FormFooter from '../elements/footer';
import { useRenewalForm } from './RenewalFormContext';
import { getNextRenewalRoute, getPreviousRenewalRoute } from './renewalRoutes';

const IoMdMaleFixed = IoMdMale as any;
const IoMdFemaleFixed = IoMdFemale as any;

interface FormData {
  acknowledgementNo: string;
  firstName: string;
  middleName: string;
  lastName: string;
  filledBy: string;
  parentOrSpouseName: string;
  sex: string;
  placeOfBirth: string;
  dateOfBirth: string;
  panNumber: string;
  aadharNumber: string;
  dobInWords: string;
}

const initialState: FormData = {
  acknowledgementNo: '',
  firstName: '',
  middleName: '',
  lastName: '',
  filledBy: '',
  parentOrSpouseName: '',
  sex: '',
  placeOfBirth: '',
  dateOfBirth: '',
  panNumber: '',
  aadharNumber: '',
  dobInWords: '',
};

// Removed mockPrefillData. Only real API data will be used.

const validatePersonalInfo = (formData: FormData): string[] => {
  const validationErrors: string[] = [];

  if (!formData.firstName?.trim()) {
    validationErrors.push('First name is required');
  }
  if (!formData.lastName?.trim()) {
    validationErrors.push('Last name is required');
  }
  if (!formData.parentOrSpouseName?.trim()) {
    validationErrors.push('Parent/Spouse name is required');
  }
  if (!formData.sex) {
    validationErrors.push('Please select sex');
  }

  return validationErrors;
};

const PersonalInformationRenewal: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const applicantId = searchParams?.get('applicationId') || searchParams?.get('id') || searchParams?.get('applicantId');

  const {
    state,
    updateFormData,
    setApplicantId,
    setIsLoading,
    setIsSubmitting,
    setSubmitError,
    setSubmitSuccess,
    goToNextStep,
    goToPreviousStep,
  } = useRenewalForm();

  const [form, setForm] = useState<FormData>(initialState);
  const [isMounted, setIsMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    setIsMounted(true);
    const fetchData = async () => {
      if (applicantId) {
        setApplicantId(applicantId);
        setLoading(true);
        setLoadError(null);
        try {
          const data = await FormDataLoader.loadAllSections(applicantId);
          if (data.personalInformation) {
            setForm((prev) => ({ ...prev, ...data.personalInformation }));
            updateFormData('personalInformation', data.personalInformation);
            setSubmitSuccess('Existing data loaded successfully');
            setTimeout(() => setSubmitSuccess(null), 3000);
          }
        } catch (err: any) {
          setLoadError('Failed to load existing data.');
        } finally {
          setLoading(false);
        }
      }
    };
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicantId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveToDraft = async () => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      updateFormData('personalInformation', form);
      setSubmitSuccess('Draft saved successfully!');
      setTimeout(() => setSubmitSuccess(null), 3000);
    } catch (error) {
      setSubmitError('Failed to save draft');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = async () => {
    const errors = validatePersonalInfo(form);
    if (errors.length > 0) {
      setSubmitError(errors.join(', '));
      return;
    }

    updateFormData('personalInformation', form);
    const nextRoute = getNextRenewalRoute('/forms/renewal/personal-information');
    if (nextRoute) {
      router.push(`${nextRoute}${applicantId ? `?id=${applicantId}` : ''}`);
    }
  };

  const handlePrevious = () => {
    router.back();
  };

  if (loading) {
    return <div className="p-4 text-center">Loading existing data...</div>;
  }
  if (loadError) {
    return <div className="p-4 text-center text-red-600">{loadError}</div>;
  }
  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-2">Personal Information</h2>
        <p className="text-sm text-gray-600">Step 1 of 10 - Renewal Application</p>
      </div>

      {isMounted && (state.applicantId || state.almsLicenseId) && (
        <div className="mb-4 p-3 bg-blue-100 border border-blue-400 text-blue-700 rounded flex justify-between items-center">
          <div className="flex flex-col">
            <strong>Application ID: {state.applicantId ?? '—'}</strong>
            {state.almsLicenseId && (
              <strong className="text-sm">License ID: {state.almsLicenseId}</strong>
            )}
          </div>
          <button
            type="button"
            onClick={async () => {
              setLoading(true);
              setLoadError(null);
              try {
                const data = await FormDataLoader.loadAllSections(applicantId);
                if (data.personalInformation) {
                  setForm((prev) => ({ ...prev, ...data.personalInformation }));
                  updateFormData('personalInformation', data.personalInformation);
                  setSubmitSuccess('Data refreshed');
                  setTimeout(() => setSubmitSuccess(null), 3000);
                }
              } catch (err: any) {
                setLoadError('Failed to refresh data.');
              } finally {
                setLoading(false);
              }
            }}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Refresh Data
          </button>
        </div>
      )}

      {state.isLoading && (
        <div className="mb-4 p-3 bg-gray-100 border border-gray-400 text-gray-700 rounded">
          Loading...
        </div>
      )}

      {state.submitSuccess && (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
          {state.submitSuccess}
        </div>
      )}
      {state.submitError && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {state.submitError}
        </div>
      )}

      <div className="grid grid-cols-4 gap-10 mb-4">
        <Input
          label="1. Applicant First Name"
          name="firstName"
          value={form.firstName}
          onChange={handleChange}
          required
        />
        <div className="flex flex-col">
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="middleName">
            Applicant Middle Name
            <span className="ml-1 text-xs text-gray-400 align-middle">(optional)</span>
          </label>
          <Input
            label=""
            name="middleName"
            value={form.middleName}
            onChange={handleChange}
          />
        </div>
        <Input
          label="Applicant Last Name"
          name="lastName"
          value={form.lastName}
          onChange={handleChange}
          required
        />
        <div className="flex flex-col">
          <label htmlFor="filledBy" className="block text-sm font-medium text-gray-700 mb-1">
            Application filled by (ZS name)
          </label>
          <Input
            label=""
            name="filledBy"
            value={form.filledBy}
            onChange={handleChange}
          />
        </div>
        <Input
          label="2. Parent/ Spouse Name"
          name="parentOrSpouseName"
          value={form.parentOrSpouseName}
          onChange={handleChange}
          required
        />
        <div className="flex flex-col">
          <span className="block text-sm font-medium text-gray-700 mb-1">3. Sex</span>
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="sex"
                value="MALE"
                checked={form.sex === 'MALE'}
                onChange={handleChange}
                suppressHydrationWarning
              />
              Male
              <IoMdMaleFixed className="text-xl" />
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="sex"
                value="FEMALE"
                checked={form.sex === 'FEMALE'}
                onChange={handleChange}
                suppressHydrationWarning
              />
              Female
              <IoMdFemaleFixed className="text-xl" />
            </label>
          </div>
        </div>
        <Input
          label="4. Place of Birth (Nativity)"
          name="placeOfBirth"
          value={form.placeOfBirth}
          onChange={handleChange}
        />
        <div className="flex flex-col">
          <label
            htmlFor="dateOfBirth"
            className="block text-sm font-medium text-gray-700 mb-1 relative group"
          >
            5. Date of birth in Christian era
            <span className="ml-1 text-blue-500 cursor-help">ⓘ</span>
            <span className="invisible group-hover:visible absolute left-0 top-full mt-1 w-64 p-2 bg-gray-800 text-white text-xs rounded shadow-lg z-10">
              Must be 21 years old on the date of application
            </span>
          </label>
          <Input
            label=""
            name="dateOfBirth"
            type="date"
            value={form.dateOfBirth}
            onChange={handleChange}
          />
        </div>
        <Input
          label="6. PAN"
          name="panNumber"
          value={form.panNumber}
          onChange={handleChange}
          maxLength={10}
        />
        <Input
          label="7. Aadhar Number"
          name="aadharNumber"
          value={form.aadharNumber}
          onChange={handleChange}
          maxLength={12}
        />
        <Input
          label="Date of Birth in Words"
          name="dobInWords"
          value={form.dobInWords}
          onChange={handleChange}
        />
      </div>

      <FormFooter
        onSaveToDraft={handleSaveToDraft}
        onNext={handleNext}
        onPrevious={handlePrevious}
        hidePrevious={true}
        isLoading={state.isSubmitting}
      />
    </div>
  );
};

export default PersonalInformationRenewal;