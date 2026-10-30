'use client';

import { useEffect, useState } from 'react';
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
  /** Overrides disableActions for Save to Draft only (a draft may be incomplete). */
  disableSaveDraft?: boolean;
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
  disableSaveDraft,
  errors,
}: FormFooterProps) => {
  const errorEntries = errors ? Object.entries(errors).filter(([_, msg]) => msg && msg.trim()) : [];
  // Which button started the current save, so only that one shows the spinner
  // (both stay disabled). Null when loading was started from elsewhere.
  const [pendingAction, setPendingAction] = useState<'draft' | 'next' | null>(null);
  useEffect(() => {
    if (!isLoading) setPendingAction(null);
  }, [isLoading]);
  const draftBusy = isLoading && pendingAction !== 'next';
  const nextBusy = isLoading && pendingAction !== 'draft';

  return (
    <footer className='w-full mt-8 bg-slate-50/80 border-t border-slate-200 px-6 py-4 flex flex-col gap-3 z-30 rounded-b-2xl shadow-xs'>
      {errorEntries.length > 0 && (
        <div className='bg-red-50 border-l-4 border-red-500 rounded-r-lg p-3.5 mb-1 shadow-xs'>
          <div className='flex items-start gap-2.5'>
            <svg className='w-5 h-5 text-red-500 shrink-0 mt-0.5' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z' />
            </svg>
            <div>
              <p className='text-sm font-bold text-red-900'>Please correct the following fields to proceed:</p>
              <ul className='mt-1 text-xs text-red-700 list-disc list-inside space-y-0.5 font-medium'>
                {errorEntries.map(([field, msg]) => (
                  <li key={field}>{msg}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Official Form Header Legend in Navy Blue */}
      <div className='flex flex-wrap items-center gap-2 text-xs sm:text-sm font-semibold text-[#0B1F3A]'>
        <span>SCHEDULE–III Part – II</span>
        <span className='text-gray-300'>|</span>
        <span>Application Form</span>
        <span className='text-gray-300'>|</span>
        <span className='font-bold text-[#0B1F3A]'>
          Form A-1 <span className='font-normal text-xs text-gray-600'>[for individuals]</span>
        </span>
        <span className='text-gray-300'>|</span>
        <span className='text-gray-700'>
          Form of application for an arms license In{' '}
          <span className='font-bold text-[#0B1F3A]'>Form II, III and IV</span>
        </span>
      </div>

      <div className='w-full flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1'>
        <div className='flex items-center text-xs text-gray-600 font-medium'>
          <span className='text-red-600 font-bold mr-1.5'>NOTE:</span>
          <span>Please review the data before proceeding to the next step.</span>
        </div>

        {isDeclarationStep ? (
          <div className='flex flex-wrap items-center gap-3 justify-end'>
            {!hidePrevious && (
              <button
                type='button'
                onClick={onPrevious}
                disabled={isLoading}
                suppressHydrationWarning
                className='flex items-center gap-2 border-2 border-[#0B1F3A] text-[#0B1F3A] font-bold px-5 py-2.5 rounded-xl bg-white hover:bg-slate-100 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm shadow-xs'
              >
                <FiArrowLeftFixed className='text-base' />
                Previous
              </button>
            )}
            <button
              type='button'
              onClick={onSubmit}
              disabled={isLoading}
              suppressHydrationWarning
              className='flex items-center justify-center gap-2 bg-[#0B1F3A] hover:bg-[#15325B] text-white font-bold px-8 py-2.5 rounded-xl shadow-md transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed min-w-[140px] text-xs sm:text-sm'
            >
              {isLoading ? (
                <>
                  <Spinner size="sm" color="text-white" /> Submitting...
                </>
              ) : (
                'Submit Application'
              )}
            </button>
          </div>
        ) : (
          <div className='flex flex-wrap items-center gap-3 justify-end'>
            <button
              type='button'
              onClick={() => {
                setPendingAction('draft');
                onSaveToDraft?.();
              }}
              disabled={isLoading || (disableSaveDraft ?? disableActions)}
              suppressHydrationWarning
              className='flex items-center justify-center gap-2 border border-amber-300 bg-amber-50 text-amber-900 font-semibold px-4 py-2.5 rounded-xl hover:bg-amber-100 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed min-w-[140px] text-xs sm:text-sm shadow-xs'
            >
              {draftBusy ? (
                <>
                  <Spinner size="sm" color="text-amber-700" /> Saving...
                </>
              ) : (
                <>
                  <FaRegSaveFixed className='text-sm text-amber-700' />
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
                className='flex items-center gap-2 border-2 border-[#0B1F3A] text-[#0B1F3A] font-bold px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm shadow-xs'
              >
                <FiArrowLeftFixed className='text-base' />
                Previous
              </button>
            )}

            <button
              type='button'
              onClick={() => {
                setPendingAction('next');
                onNext?.();
              }}
              disabled={isLoading || disableActions}
              suppressHydrationWarning
              className='flex items-center justify-center gap-2 bg-[#0B1F3A] hover:bg-[#15325B] text-white font-bold px-6 py-2.5 rounded-xl shadow-md transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed min-w-[120px] text-xs sm:text-sm'
            >
              {nextBusy ? (
                <>
                  <Spinner size="sm" color="text-white" /> Saving...
                </>
              ) : (
                <>
                  Next Step
                  <FiArrowRightFixed className='text-base' />
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
