'use client';

import { FaRegSave } from 'react-icons/fa';
import { FiArrowRight, FiArrowLeft } from 'react-icons/fi';

// Type assertions for react-icons to fix React 18 compatibility
const FaRegSaveFixed = FaRegSave as any;
const FiArrowRightFixed = FiArrowRight as any;
const FiArrowLeftFixed = FiArrowLeft as any;

interface FormFooterProps {
  isDeclarationStep?: boolean;
  hidePrevious?: boolean;
  onSaveToDraft?: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  onSubmit?: () => void;
  isLoading?: boolean;
}

const FormFooter = ({
  isDeclarationStep,
  hidePrevious = false,
  onSaveToDraft,
  onNext,
  onPrevious,
  onSubmit,
  isLoading = false,
}: FormFooterProps) => (
  <footer className='w-full mt-8 bg-white px-6 py-2 flex flex-col gap-2 z-50 shadow-[0_-2px_8px_0_rgba(0,0,0,0.04)]'>
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
            className='flex items-center gap-2 bg-blue-900 text-white font-semibold px-8 py-2 rounded-md hover:bg-blue-800 transition disabled:opacity-50 disabled:cursor-not-allowed'
          >
            {isLoading ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      ) : (
        <div className='flex gap-3 justify-end mt-4'>
          <button
            type='button'
            onClick={onSaveToDraft}
            disabled={isLoading}
            suppressHydrationWarning
            className='flex items-center gap-2 border border-yellow-400 bg-yellow-100 text-yellow-700 font-semibold px-4 py-2 rounded-md hover:bg-yellow-200 transition disabled:opacity-50 disabled:cursor-not-allowed'
          >
            <FaRegSaveFixed className='text-lg' />
            {isLoading ? 'Saving...' : 'Save to Draft'}
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
            disabled={isLoading}
            suppressHydrationWarning
            className='flex items-center gap-2 bg-blue-900 text-white font-semibold px-6 py-2 rounded-md hover:bg-blue-800 transition disabled:opacity-50 disabled:cursor-not-allowed'
          >
            {isLoading ? 'Saving...' : 'Next'}
            <FiArrowRightFixed className='text-lg' />
          </button>
        </div>
      )}
    </div>
  </footer>
);

export default FormFooter;
