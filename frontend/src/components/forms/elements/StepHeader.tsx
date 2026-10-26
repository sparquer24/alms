'use client';
import React from 'react';
import { IoMdHome } from 'react-icons/io';

interface StepHeaderProps {
  steps: string[];
  currentStep: number;
  onStepClick?: (step: number) => void;
  lockedSteps?: Set<number>;
  onGoHome?: () => void;
  title?: string;
}

export const StepHeader: React.FC<StepHeaderProps> = ({
  steps,
  currentStep,
  onStepClick = () => {},
  lockedSteps = new Set(),
  onGoHome,
  title = 'FRESH APPLICATION FORM',
}) => {
  const handleClick = (idx: number) => {
    if (lockedSteps.has(idx)) return;
    onStepClick(idx);
  };

  return (
    <header className='w-full z-40 relative' aria-hidden={false}>
      <div className='w-full px-4 sm:px-6 lg:px-8 mt-4'>
        <div className='max-w-7xl xl:max-w-[1700px] 2xl:max-w-[1900px] w-full mx-auto py-1'>
          <h1 className='text-base sm:text-xl font-black text-[#0B1F3A] tracking-wider uppercase text-center'>
            {title}
          </h1>
        </div>
      </div>
      <div className='w-full px-4 sm:px-6 lg:px-8'>
        <div
          className='relative max-w-7xl xl:max-w-[1700px] 2xl:max-w-[1900px] w-full mx-auto rounded-xl shadow-md px-2 py-1 bg-[#0B1F3A] border border-[#15325B]'
        >
          {/* Home button — pinned to the left edge of the bar */}
          {onGoHome && (
            <div className='absolute left-3 top-1/2 -translate-y-1/2 z-10'>
              <button
                type='button'
                onClick={onGoHome}
                title='Go to Home'
                aria-label='Go to Home'
                className='flex items-center justify-center w-8 h-8 bg-white hover:bg-amber-50 rounded-full shadow-md border-2 border-[#D4AF37] transition-all duration-200 hover:scale-105 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]'
              >
                <IoMdHome className='text-lg text-[#0B1F3A]' />
              </button>
            </div>
          )}

          {/* Step tabs — single row, scrollable on smaller viewports */}
          <div
            className={`flex flex-nowrap items-center py-1 overflow-x-auto thin-scrollbar ${onGoHome ? 'pl-14 pr-3' : 'px-2'}`}
          >
            {steps.map((stepName, idx) => {
              const active = currentStep === idx;
              const locked = lockedSteps.has(idx);
              return (
                <div key={idx} className='flex flex-1 min-w-[90px] flex-col items-center flex-shrink-0'>
                  <button
                    type='button'
                    onClick={() => handleClick(idx)}
                    suppressHydrationWarning
                    disabled={locked}
                    title={locked ? 'Complete the previous step first' : stepName}
                    aria-current={active ? 'step' : undefined}
                    className={`px-2.5 py-1.5 text-xs font-semibold transition-all duration-150 transform-gpu focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] flex flex-col items-center select-none whitespace-nowrap rounded-t-lg
                      ${
                        active
                          ? 'bg-white text-[#0B1F3A] shadow-xs'
                          : locked
                          ? 'bg-transparent text-gray-500 cursor-not-allowed'
                          : 'bg-transparent text-gray-300 hover:bg-white/10 hover:text-white'
                      }
                    `}
                  >
                    {locked && (
                      <svg className='w-3 h-3 mb-0.5 text-gray-500' fill='currentColor' viewBox='0 0 20 20'>
                        <path fillRule='evenodd' d='M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z' clipRule='evenodd' />
                      </svg>
                    )}
                    <span className={`text-[11px] ${active ? 'font-bold text-[#0B1F3A]' : ''}`}>
                      {stepName}
                    </span>
                  </button>
                  {active && (
                    <div className='w-0 h-0 border-l-[5px] border-r-[5px] border-t-[5px] border-transparent border-t-white mt-[-1px]' />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </header>
  );
};
