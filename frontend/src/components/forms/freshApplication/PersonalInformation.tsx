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
import { FieldRule } from '../../../utils/validation/types';
import { useFormValidation } from '../../../hooks/useFormValidation';

// ─── Constants ────────────────────────────────────────────────────────────────

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

// ─── Validation Rules ─────────────────────────────────────────────────────────

const personalInfoRules: FieldRule[] = [
  { name: 'firstName', type: 'text', required: true },
  { name: 'middleName', type: 'text', required: false },
  { name: 'lastName', type: 'text', required: true },
  { name: 'filledBy', type: 'text', required: true },
  { name: 'parentOrSpouseName', type: 'text', required: true },
  { name: 'sex', type: 'select', required: true, errorMessages: { required: 'Please select Gender.' } },
  { name: 'placeOfBirth', type: 'text', required: true },
  { name: 'dateOfBirth', type: 'date', required: true, noFuture: true, minAge: 21, maxAge: 30, errorMessages: { noFuture: 'Date of Birth cannot be a future date.', minAge: 'Applicant must be at least 21 years old.', maxAge: 'Applicant must not be older than 30 years.' } },
  { name: 'panNumber', type: 'pan', required: true },
  { name: 'aadharNumber', type: 'aadhaar', required: true, errorMessages: { format: 'Aadhaar Number must contain exactly 12 digits.' } },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Convert a Date to "Twenty-Fifth January Two Thousand Five" style string */
function dateToDobInWords(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr + 'T00:00:00'); // avoid timezone shift
  if (isNaN(date.getTime())) return '';

  const ones = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen',
  ];
  const tens = ['', '', 'Twenty', 'Thirty'];
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  const ordinalSuffix = (n: number) => {
    if (n === 1 || n === 21 || n === 31) return 'First';
    if (n === 2 || n === 22) return 'Second';
    if (n === 3 || n === 23) return 'Third';
    if (n >= 4 && n <= 19) return ones[n] + 'th';
    if (n === 20) return 'Twentieth';
    if (n === 30) return 'Thirtieth';
    // 21-31 (except above)
    const t = Math.floor(n / 10);
    const o = n % 10;
    return tens[t] + '-' + ones[o] + 'th';
  };

  const numberToWords = (n: number): string => {
    if (n === 0) return 'Zero';
    if (n < 20) return ones[n];
    if (n < 100) {
      const t = Math.floor(n / 10);
      const o = n % 10;
      return tens[t] + (o ? ' ' + ones[o] : '');
    }
    if (n < 1000) {
      const h = Math.floor(n / 100);
      const rem = n % 100;
      return ones[h] + ' Hundred' + (rem ? ' ' + numberToWords(rem) : '');
    }
    if (n < 10000) {
      const th = Math.floor(n / 1000);
      const rem = n % 1000;
      return ones[th] + ' Thousand' + (rem ? ' ' + numberToWords(rem) : '');
    }
    return String(n);
  };

  const day = date.getDate();
  const month = date.getMonth();
  const year = date.getFullYear();

  return `${ordinalSuffix(day)} ${months[month]} ${numberToWords(year)}`;
}

// ─── Component ────────────────────────────────────────────────────────────────

const PersonalInformation: React.FC = () => {
  const router = useRouter();
  const [isMounted, setIsMounted] = React.useState(false);
  const validation = useFormValidation(personalInfoRules);

  const {
    form,
    setForm,
    applicantId,
    almsLicenseId,
    isSubmitting,
    isLoading,
    submitError,
    submitSuccess,
    saveFormData,
    navigateToNext,
    loadExistingData,
    fieldErrors,
    setFieldErrors,
  } = useApplicationForm({
    initialState,
    formSection: 'personal',
    validationRules: validation.validateAll,
  });

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  // ── Auto-generate DOB in words when dateOfBirth changes ──
  React.useEffect(() => {
    const words = dateToDobInWords(form.dateOfBirth);
    if (words !== form.dobInWords) {
      setForm((prev: any) => ({ ...prev, dobInWords: words }));
    }
  }, [form.dateOfBirth]);

  // ── Handle change with real-time validation ──
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    const { value: filtered, error } = validation.processChange(name, value, form);
    setForm((prev: any) => ({ ...prev, [name]: filtered }));
    setFieldErrors((prev: any) => ({ ...prev, [name]: error }));
  };

  // ── Blur handler: auto-trim + re-validate ──
  const handleBlur = (
    e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    const { value: trimmed, error } = validation.processBlur(name, value, form);
    if (trimmed !== value) {
      setForm((prev: any) => ({ ...prev, [name]: trimmed }));
    }
    setFieldErrors((prev: any) => ({ ...prev, [name]: error }));
  };

  // ── Trim all values before submission ──
  const getTrimmedForm = () => {
    const trimmed: any = {};
    for (const key of Object.keys(form)) {
      trimmed[key] = typeof form[key] === 'string' ? form[key].trim() : form[key];
    }
    return trimmed;
  };

  // Manual data refresh functionality for cases where automatic loading doesn't work
  const handleRefreshData = async () => {
    if (applicantId) {
      await loadExistingData(applicantId);
    }
  };

  const handleSaveToDraft = async () => {
    // Trim values before save
    const trimmed = getTrimmedForm();
    setForm(trimmed);
    await saveFormData(undefined, trimmed);
  };

  const handleNext = async () => {
    // Trim values before validation and save
    const trimmed = getTrimmedForm();
    setForm(trimmed);

    const savedApplicantId = await saveFormData(undefined, trimmed);

    if (savedApplicantId) {
      navigateToNext(FORM_ROUTES.ADDRESS_DETAILS, savedApplicantId);
    }
  };

  const handlePrevious = () => {
    router.back();
  };

  // ── Mandatory label helper ──
  const requiredLabel = (text: string) => (
    <>
      {text}
      <span className='text-red-500 ml-1'>*</span>
    </>
  );

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

      
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 mb-4'>
        {/* 1. Applicant First Name (mandatory) */}
        <Input
          label='1. Applicant First Name'
          name='firstName'
          value={form.firstName}
          onChange={handleChange}
          onBlur={handleBlur}
          required
          error={fieldErrors.firstName}
        />

        {/* Applicant Middle Name (optional) */}
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
            onBlur={handleBlur}
            error={fieldErrors.middleName}
          />
        </div>

        {/* Applicant Last Name (mandatory) */}
        <Input
          label='Applicant Last Name'
          name='lastName'
          value={form.lastName}
          onChange={handleChange}
          onBlur={handleBlur}
          required
          error={fieldErrors.lastName}
        />

        {/* Application filled by (ZS name) (mandatory) */}
        <div className='flex flex-col'>
          <label htmlFor='filledBy' className='block text-sm font-medium text-gray-700 mb-1'>
            Application filled by (ZS name)
            <span className='text-red-500 ml-1'>*</span>
          </label>
          <Input
            label=''
            name='filledBy'
            value={form.filledBy}
            onChange={handleChange}
            onBlur={handleBlur}
            error={fieldErrors.filledBy}
          />
        </div>

        {/* 2. Parent/ Spouse Name (mandatory) */}
        <Input
          label='2. Parent/ Spouse Name'
          name='parentOrSpouseName'
          value={form.parentOrSpouseName}
          onChange={handleChange}
          onBlur={handleBlur}
          required
          error={fieldErrors.parentOrSpouseName}
        />

        {/* 3. Sex/Gender (mandatory) */}
        <div className='flex flex-col'>
          <span className='block text-sm font-medium text-gray-700 mb-1'>
            3. Sex
            <span className='text-red-500 ml-1'>*</span>
          </span>
          <div className='flex items-center gap-6'>
            <label className='flex items-center gap-2'>
              <input
                type='radio'
                name='sex'
                value='MALE'
                checked={form.sex === 'MALE'}
                onChange={(e) => {
                  const { name, value } = e.target;
                  setForm((prev: any) => ({ ...prev, [name]: value }));
                  const { error } = validation.processChange(name, value, { ...form, [name]: value });
                  setFieldErrors((prev: any) => ({ ...prev, [name]: error }));
                }}
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
                onChange={(e) => {
                  const { name, value } = e.target;
                  setForm((prev: any) => ({ ...prev, [name]: value }));
                  const { error } = validation.processChange(name, value, { ...form, [name]: value });
                  setFieldErrors((prev: any) => ({ ...prev, [name]: error }));
                }}
                suppressHydrationWarning
              />
              Female
              <IoMdFemaleFixed className='text-xl' />
            </label>
          </div>
          {fieldErrors.sex && <p className="text-red-500 text-xs mt-1">{fieldErrors.sex}</p>}
        </div>

        {/* 4. Place of Birth (Nativity) (mandatory) */}
        <Input
          label='4. Place of Birth (Nativity)'
          name='placeOfBirth'
          value={form.placeOfBirth}
          onChange={handleChange}
          onBlur={handleBlur}
          required
          error={fieldErrors.placeOfBirth}
        />

        {/* 5. Date of Birth (mandatory) */}
        <div className='flex flex-col'>
          <label
            htmlFor='dateOfBirth'
            className='block text-sm font-medium text-gray-700 mb-1 relative group'
          >
            5. Date of birth in Christian era
            <span className='text-red-500 ml-1'>*</span>
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
            onBlur={handleBlur}
            max={new Date().toISOString().split('T')[0]}
            error={fieldErrors.dateOfBirth}
          />
        </div>

        {/* 6. PAN (mandatory) */}
        <Input
          label='6. PAN'
          name='panNumber'
          value={form.panNumber}
          onChange={handleChange}
          onBlur={handleBlur}
          required
          error={fieldErrors.panNumber}
          maxLength={10}
        />

        {/* 7. Aadhaar Number (mandatory) */}
        <Input
          label='7. Aadhar Number'
          name='aadharNumber'
          value={form.aadharNumber}
          onChange={handleChange}
          onBlur={handleBlur}
          required
          error={fieldErrors.aadharNumber}
          maxLength={12}
        />

        {/* Date of Birth in Words (read-only, auto-generated) */}
        <Input
          label='Date of Birth in Words'
          name='dobInWords'
          value={form.dobInWords}
          onChange={() => {}}
          readOnly
        />
      </div>

      <FormFooter
        onSaveToDraft={handleSaveToDraft}
        onNext={handleNext}
        onPrevious={handlePrevious}
        hidePrevious={true}
        isLoading={isSubmitting}
        disableActions={!validation.isValid(form)}
      />
    </div>
  );
};

export default PersonalInformation;
