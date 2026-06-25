'use client';

import { FaRegSave } from 'react-icons/fa';
import { FiArrowRight, FiArrowLeft } from 'react-icons/fi';

// Type assertions for react-icons to fix React 18 compatibility
const FaRegSaveFixed = FaRegSave as any;
const FiArrowRightFixed = FiArrowRight as any;
const FiArrowLeftFixed = FiArrowLeft as any;

import { Spinner } from './Spinner';

interface FormFooterProps {
  isDeclarationStep?: boolean;
  hidePrevious?: boolean;
  onSaveToDraft?: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  onSubmit?: () => void;
  isLoading?: boolean;
  disableActions?: boolean;
  errors?: Record<string, string>;
}

const FormFooter = ({
  isDeclarationStep,
  hidePrevious = false,
  onSaveToDraft,
  onNext,
  onPrevious,
  onSubmit,
  isLoading = false,
  disableActions = false,
  errors,
}: FormFooterProps) => {
  const errorEntries = errors ? Object.entries(errors).filter(([_, msg]) => msg && msg.trim()) : [];

  return (
    <footer className='w-full mt-8 bg-white px-6 py-2 flex flex-col gap-2 z-50 shadow-[0_-2px_8px_0_rgba(0,0,0,0.04)]'>
      {errorEntries.length > 0 && (
        <div className='bg-red-50 border-l-4 border-red-500 rounded-r-md p-3 mb-2'>
          <div className='flex items-start gap-2'>
            <svg className='w-5 h-5 text-red-500 shrink-0 mt-0.5' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z' />
            </svg>
            <div>
              <p className='text-sm font-semibold text-red-800'>Please fix the following errors to proceed:</p>
              <ul className='mt-1 text-sm text-red-700 list-disc list-inside space-y-0.5'>
                {errorEntries.map(([field, msg]) => (
                  <li key={field}>{msg}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
      <div className='flex flex-wrap items-center gap-2 text-[15px] font-medium text-[#1A237E]'>
        <span>SCHEDULE–III Part – II</span>
        <span className='mx-1'>|</span>
        <span>Application Form</span>
        <span className='mx-1'>|</span>
        <span className='font-bold'>
          Form A-1 <span className='font-normal text-xs text-black'>[for individuals]</span>
        </span>
        <span className='mx-1'>|</span>
        <span>
          Form of application for an arms license In{' '}
          <span className='font-bold'>Form II, III and IV</span>
        </span>
      </div>
      <div className='mt-2 w-full'>
        <div className='flex items-center'>
          <span className='text-red-600 font-bold mr-2'>NOTE:</span>
          <span className='text-black'>
            Please review the data before submitting of your Arms License application
          </span>
        </div>
      {isDeclarationStep ? (
        <div className='flex w-full justify-between mt-4'>
          {!hidePrevious && (
            <button
              type='button'
              onClick={onPrevious}
              disabled={isLoading}
              suppressHydrationWarning
              className='flex items-center gap-2 border border-blue-900 text-blue-900 font-semibold px-6 py-2 rounded-md bg-white hover:bg-blue-50 transition disabled:opacity-50 disabled:cursor-not-allowed'
            >
              <FiArrowLeftFixed className='text-lg' />
              Previous
            </button>
          )}
          <button
            type='button'
            onClick={onSubmit}
            disabled={isLoading}
            suppressHydrationWarning
            className='flex items-center justify-center gap-2 bg-blue-900 text-white font-semibold px-8 py-2 rounded-md hover:bg-blue-800 transition disabled:opacity-50 disabled:cursor-not-allowed min-w-[140px]'
          >
            {isLoading ? (
              <>
                <Spinner size="sm" color="text-white" /> Submitting...
              </>
            ) : (
              'Submit'
            )}
          </button>
        </div>
      ) : (
        <div className='flex gap-3 justify-end mt-4'>
          <button
            type='button'
            onClick={onSaveToDraft}
            disabled={isLoading || disableActions}
            suppressHydrationWarning
            className='flex items-center justify-center gap-2 border border-yellow-400 bg-yellow-100 text-yellow-700 font-semibold px-4 py-2 rounded-md hover:bg-yellow-200 transition disabled:opacity-50 disabled:cursor-not-allowed min-w-[160px]'
          >
            {isLoading ? (
              <>
                <Spinner size="sm" color="text-yellow-700" /> Saving...
              </>
            ) : (
              <>
                <FaRegSaveFixed className='text-lg' />
                Save to Draft
              </>
            )}
          </button>

          {!hidePrevious && (
            <button
              type='button'
              onClick={onPrevious}
              disabled={isLoading}
              suppressHydrationWarning
              className='flex items-center gap-2 border border-blue-900 text-blue-900 font-semibold px-4 py-2 rounded-md bg-white hover:bg-blue-50 transition disabled:opacity-50 disabled:cursor-not-allowed'
            >
              <FiArrowLeftFixed className='text-lg' />
              Previous
            </button>
          )}
          <button
            type='button'
            onClick={onNext}
            disabled={isLoading || disableActions}
            suppressHydrationWarning
            className='flex items-center justify-center gap-2 bg-blue-900 text-white font-semibold px-6 py-2 rounded-md hover:bg-blue-800 transition disabled:opacity-50 disabled:cursor-not-allowed min-w-[120px]'
          >
            {isLoading ? (
              <>
                <Spinner size="sm" color="text-white" /> Saving...
              </>
            ) : (
              <>
                Next
                <FiArrowRightFixed className='text-lg' />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  </footer>
  );
};

export default FormFooter;
