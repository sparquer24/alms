'use client';

import React from 'react';
import { RefreshCw, FileText } from 'lucide-react';

interface FormStepHeaderProps {
  /** The main title of the step, e.g. "Personal Information" */
  title: string;
  /** Short descriptive summary of what this step is for */
  subtitle?: string;
  /** Current step index (1-based), e.g. 1 */
  stepNumber?: number;
  /** Total number of steps, e.g. 10 */
  totalSteps?: number;
  /** Application ID or License ID if available */
  applicationId?: string | number | null;
  /** Acknowledgement number if available */
  acknowledgementNo?: string | null;
  /** Callback for data refresh */
  onRefresh?: () => void;
  /** Whether the refresh action is currently loading */
  isRefreshing?: boolean;
  /** Custom extra elements to render on the right side */
  extraActions?: React.ReactNode;
}

export const FormStepHeader: React.FC<FormStepHeaderProps> = ({
  title,
  subtitle,
  stepNumber,
  totalSteps = 10,
  applicationId,
  acknowledgementNo,
  onRefresh,
  isRefreshing = false,
  extraActions,
}) => {
  return (
    <div className='w-full bg-white px-6 pt-5 pb-4 border-b border-gray-100 select-none'>
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3'>
        {/* Left Section: Step Name & Ack Number on the same line */}
        <div className='flex items-center gap-3 flex-wrap min-w-0'>
          <h2 className='text-xl sm:text-2xl font-black text-[#0B1F3A] tracking-tight'>
            {title}
          </h2>
          {acknowledgementNo && (
            <span className='inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold bg-slate-100 text-slate-800 border border-slate-300 shadow-2xs'>
              <FileText className='w-3.5 h-3.5 text-[#0B1F3A]' />
              <span>Ack: {acknowledgementNo}</span>
            </span>
          )}
        </div>

        {/* Right Section: Step 1 to 10 on the right side, with App ID and Refresh */}
        <div className='flex items-center gap-2.5 flex-wrap flex-shrink-0'>
          {stepNumber && (
            <span className='inline-flex items-center px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase bg-blue-50 text-[#0B1F3A] border border-blue-200 shadow-2xs'>
              Step {stepNumber} of {totalSteps}
            </span>
          )}

          {applicationId && (
            <div className='inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 font-mono shadow-2xs'>
              <span className='text-[#0B1F3A] font-bold text-[10px] uppercase tracking-wider'>
                App ID:
              </span>
              <span className='font-bold text-slate-900'>{applicationId}</span>
            </div>
          )}

          {onRefresh && (
            <button
              type='button'
              onClick={onRefresh}
              disabled={isRefreshing}
              title='Refresh application data'
              className='inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 active:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 hover:text-[#0B1F3A] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B1F3A]'
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#0B1F3A] ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>
          )}

          {extraActions}
        </div>
      </div>

      {subtitle && (
        <p className='text-xs sm:text-sm text-gray-500 mt-1.5 font-normal'>
          {subtitle}
        </p>
      )}
    </div>
  );
};

export default FormStepHeader;
