'use client';
import React from 'react';
import { IoMdMale, IoMdFemale } from 'react-icons/io';

// Type assertions for react-icons to fix React 18 compatibility
const IoMdMaleFixed = IoMdMale as any;
const IoMdFemaleFixed = IoMdFemale as any;
import { Input } from '../elements/Input';
import { useRouter } from 'next/navigation';
import FormFooter from '../elements/footer';
import { useApplicationForm } from '../../../hooks/useApplicationForm';
import { FORM_ROUTES } from '../../../config/formRoutes';

const initialState = {
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

// Validation rules for personal information
const validatePersonalInfo = (formData: any) => {
  const validationErrors = [];

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

const PersonalInformation: React.FC = () => {
  const router = useRouter();
  const [isMounted, setIsMounted] = React.useState(false);

  const {
    form,
    applicantId,
    almsLicenseId,
    isSubmitting,
    isLoading,
    submitError,
    submitSuccess,
    handleChange,
    saveFormData,
    navigateToNext,
    loadExistingData,
  } = useApplicationForm({
    initialState,
    formSection: 'personal',
    validationRules: validatePersonalInfo,
  });

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  // Manual data refresh functionality for cases where automatic loading doesn't work
  const handleRefreshData = async () => {
    if (applicantId) {
      await loadExistingData(applicantId);
    }
  };

  const handleSaveToDraft = async () => {
    await saveFormData();
  };

  const handleNext = async () => {
    const savedApplicantId = await saveFormData();

    if (savedApplicantId) {
      navigateToNext(FORM_ROUTES.ADDRESS_DETAILS, savedApplicantId);
    } else {
    }
  };

  const handlePrevious = () => {
    router.back();
  };

  return (
    <div className='p-6'>
      <h2 className='text-xl font-bold mb-4'>Personal Information</h2>

      {/* Display Applicant ID if available - only after mount to avoid hydration mismatch */}
      {isMounted && (applicantId || almsLicenseId) && (
        <div className='mb-4 p-3 bg-blue-100 border border-blue-400 text-blue-700 rounded flex justify-between items-center'>
          <div className='flex flex-col'>
            <strong>Application ID: {applicantId ?? '—'}</strong>
            {almsLicenseId && (
              <strong className='text-sm'>License ID: {almsLicenseId}</strong>
            )}
          </div>
          <button
            type='button'
            onClick={handleRefreshData}
            disabled={isLoading}
            className='px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50'
          >
            {isLoading ? 'Loading...' : 'Refresh Data'}
          </button>
        </div>
      )}

      {/* Loading indicator */}
      {isMounted && isLoading && (
        <div className='mb-4 p-3 bg-gray-100 border border-gray-400 text-gray-700 rounded'>
          <span className='flex items-center'>
            <svg
              className='animate-spin -ml-1 mr-3 h-5 w-5 text-gray-700'
              xmlns='http://www.w3.org/2000/svg'
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
            Loading...
          </span>
        </div>
      )}

      {/* Display success/error messages - only after mount to avoid hydration mismatch */}
      {isMounted && submitSuccess && (
        <div className='mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded'>
          {submitSuccess}
        </div>
      )}
      {isMounted && submitError && (
        <div className='mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded'>
          {submitError}
        </div>
      )}

      
      <div className='grid  grid-cols-4 gap-10 mb-4'>
        <Input
          label='1. Applicant First Name'
          name='firstName'
          value={form.firstName}
          onChange={handleChange}
          required
          //placeholder="Enter first name"
        />
        <div className='flex flex-col'>
          <label className='block text-sm font-medium text-gray-700 mb-1' htmlFor='middleName'>
            Applicant Middle Name
            <span className='ml-1 text-xs text-gray-400 align-middle'>(optional)</span>
          </label>
          <Input
            label=''
            name='middleName'
            value={form.middleName}
            onChange={handleChange}
            //placeholder="Enter middle name"
          />
        </div>
        <Input
          label='Applicant Last Name'
          name='lastName'
          value={form.lastName}
          onChange={handleChange}
          required
          //placeholder="Enter last name"
        />
        <div className='flex flex-col'>
          <label htmlFor='filledBy' className='block text-sm font-medium text-gray-700 mb-1'>
            Application filled by (ZS name)
            <br />
          </label>
          <Input
            label=''
            name='filledBy'
            value={form.filledBy}
            onChange={handleChange}
            //    //placeholder="Self/Agent/Other"
          />
        </div>
        <Input
          label='2. Parent/ Spouse Name'
          name='parentOrSpouseName'
          value={form.parentOrSpouseName}
          onChange={handleChange}
          required
          //placeholder="Enter parent/spouse name"
        />
        <div className='flex flex-col'>
          <span className='block text-sm font-medium text-gray-700 mb-1'>3. Sex</span>
          <div className='flex items-center gap-6'>
            <label className='flex items-center gap-2'>
              <input
                type='radio'
                name='sex'
                value='MALE'
                checked={form.sex === 'MALE'}
                onChange={handleChange}
                suppressHydrationWarning
              />
              Male
              <IoMdMaleFixed className='text-xl' />
            </label>
            <label className='flex items-center gap-2'>
              <input
                type='radio'
                name='sex'
                value='FEMALE'
                checked={form.sex === 'FEMALE'}
                onChange={handleChange}
                suppressHydrationWarning
              />
              Female
              <IoMdFemaleFixed className='text-xl' />
            </label>
          </div>
        </div>
        <Input
          label='4. Place of Birth (Nativity)'
          name='placeOfBirth'
          value={form.placeOfBirth}
          onChange={handleChange}
          //placeholder="Enter place of birth"
        />
        <div className='flex flex-col'>
          <label
            htmlFor='dateOfBirth'
            className='block text-sm font-medium text-gray-700 mb-1 relative group'
          >
            5. Date of birth in Christian era
            <span className='ml-1 text-blue-500 cursor-help'>ⓘ</span>
            <span className='invisible group-hover:visible absolute left-0 top-full mt-1 w-64 p-2 bg-gray-800 text-white text-xs rounded shadow-lg z-10'>
              Must be 21 years old on the date of application
            </span>
          </label>
          <Input
            label=''
            name='dateOfBirth'
            type='date'
            value={form.dateOfBirth}
            onChange={handleChange}
            //placeholder="mm/dd/yyyy"
          />
        </div>
        <Input
          label='6. PAN'
          name='panNumber'
          value={form.panNumber}
          onChange={handleChange}
          //placeholder="10-CHARACTER PAN NUMBER"
          maxLength={10}
        />
        <Input
          label='7. Aadhar Number'
          name='aadharNumber'
          value={form.aadharNumber}
          onChange={handleChange}
          //placeholder="12-digit Aadhar number"
          maxLength={12}
        />
        <Input
          label='Date of Birth in Words'
          name='dobInWords'
          value={form.dobInWords}
          onChange={handleChange}
          //placeholder="Enter DOB in words"
        />
      </div>

      <FormFooter
        onSaveToDraft={handleSaveToDraft}
        onNext={handleNext}
        onPrevious={handlePrevious}
        hidePrevious={true}
        isLoading={isSubmitting}
      />
    </div>
  );
};

export default PersonalInformation;
