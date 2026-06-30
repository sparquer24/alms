'use client';
import React from 'react';

interface StepHeaderProps {
  steps: string[];
  currentStep: number;
  onStepClick?: (step: number) => void;
  lockedSteps?: Set<number>;
}

export const StepHeader: React.FC<StepHeaderProps> = ({
  steps,
  currentStep,
  onStepClick = () => {},
  lockedSteps = new Set(),
}) => {
  const handleClick = (idx: number) => {
    if (lockedSteps.has(idx)) return;
    onStepClick(idx);
  };

  return (
      <header className='w-full fixed top-0 left-0 z-40 h-20' aria-hidden={false}>
      <div className='w-full'>
        <div className='max-w-7xl 2xl:max-w-[1600px] w-full mx-auto py-2 px-4 sm:px-8'>
          <h1 className='text-lg sm:text-2xl font-bold text-blue-900 tracking-wide uppercase text-center'>
            FRESH APPLICATION FORM
          </h1>
        </div>
      </div>
        <div
          className='max-w-7xl 2xl:max-w-[1600px] w-full mx-auto rounded-lg shadow px-2 py-1 mt-0 bg-gradient-to-r from-[#0d2977] to-[#23408e]'>
          <div className='flex justify-center items-center gap-1 xl:gap-2 2xl:gap-3 px-2 py-1'>
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
                    <div className='w-0 h-0 border-l-6 border-r-6 border-t-6 border-transparent border-t-white mt-[-2px]' />
                  )}
                </div>
              );
            })}
          </div>


        </div>
    </header>
  );
};
