'use client';
import React from 'react';
import { IoMdHome } from 'react-icons/io';

interface StepHeaderProps {
  title?: string;
  steps: string[];
  currentStep: number;
  onStepClick?: (step: number) => void;
  lockedSteps?: Set<number>;
  onGoHome?: () => void;
}

export const StepHeader: React.FC<StepHeaderProps> = ({
  title = 'FRESH APPLICATION FORM',
  steps,
  currentStep,
  onStepClick = () => {},
  lockedSteps = new Set(),
  onGoHome,
}) => {
  const handleClick = (idx: number) => {
    if (lockedSteps.has(idx)) return;
    onStepClick(idx);
  };

  return (
    <header className='w-full z-40 relative' aria-hidden={false}>
      <div className='w-full'>
        <div className='max-w-7xl 2xl:max-w-[1600px] w-full mx-auto py-2 px-4 sm:px-8'>
          <h1 className='text-lg sm:text-2xl font-bold text-blue-900 tracking-wide uppercase text-center'>
            {title}
          </h1>
        </div>
      </div>
        <div
          className='relative max-w-7xl 2xl:max-w-[1600px] w-full mx-auto rounded-lg shadow px-2 py-1 mt-0 bg-gradient-to-r from-[#0d2977] to-[#23408e]'>

          {/* Home button — pinned to the left edge of the bar */}
          {onGoHome && (
            <div className='absolute left-3 top-1/2 -translate-y-1/2 z-10'>
              <button
                type='button'
                onClick={onGoHome}
                title='Go to Home'
                className='flex items-center justify-center w-8 h-8 bg-white hover:bg-gray-50 rounded-full shadow-lg border-2 border-blue-500 transition-all duration-200 hover:scale-105 shrink-0'
              >
                <IoMdHome className='text-2xl text-[#0d2977]' />
              </button>
            </div>
          )}

          {/* Step tabs — centred independently of the home button; wrap on narrow screens */}
          <div
            className={`flex flex-wrap justify-center items-center gap-1 xl:gap-2 2xl:gap-3 py-1 ${onGoHome ? 'px-12' : 'px-2'}`}
          >
            {steps.map((stepName, idx) => {
              const active = currentStep === idx;
              const locked = lockedSteps.has(idx);
              return (
                <div key={idx} className='flex flex-col items-center'>
                  <button
                    type='button'
                    onClick={() => handleClick(idx)}
                    suppressHydrationWarning
                    disabled={locked}
                    title={locked ? 'Complete the previous step first' : stepName}
                    aria-current={active ? 'step' : undefined}
                    className={`px-3 py-2 text-sm font-medium transition-all duration-150 transform-gpu focus:outline-none flex flex-col items-center select-none
                      ${
                        active
                          ? 'bg-white text-[#0d2977]'
                          : locked
                          ? 'bg-transparent text-blue-300/50 cursor-not-allowed'
                          : 'bg-transparent text-blue-100 hover:bg-white hover:text-[#0d2977] rounded-sm'
                      }
                    `}
                    style={{
                      borderTopLeftRadius: '10px',
                      borderTopRightRadius: '10px',
                      minWidth: 88,
                    }}
                  >
                    {locked && (
                      <svg className='w-3 h-3 mb-0.5 text-blue-300/60' fill='currentColor' viewBox='0 0 20 20'>
                        <path fillRule='evenodd' d='M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z' clipRule='evenodd' />
                      </svg>
                    )}
                    <span className={`text-xs ${active ? 'font-bold' : 'font-semibold'} ${locked ? 'text-blue-300/50' : ''}`}>
                      {stepName}
                    </span>
                  </button>
                  {active && (
                    <div className='w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-transparent border-t-white mt-[-2px]' />
                  )}
                </div>
              );
            })}
          </div>

        </div>
    </header>
  );
};
