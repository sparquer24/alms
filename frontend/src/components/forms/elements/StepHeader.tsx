'use client';
import React, { useState, useEffect } from 'react';

interface StepHeaderProps {
  steps: string[];
  currentStep: number;
  onStepClick?: (step: number) => void;
}

export const StepHeader: React.FC<StepHeaderProps> = ({
  steps,
  currentStep,
  onStepClick = () => {},
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [pressedIndex, setPressedIndex] = useState<number | null>(null);

  useEffect(() => {
    if (pressedIndex !== null) {
      const t = setTimeout(() => setPressedIndex(null), 220);
      return () => clearTimeout(t);
    }
  }, [pressedIndex]);

  const handleClick = (idx: number) => {
    if (isLoading) return;
    setPressedIndex(idx);
    setIsLoading(true);

    // small visual press before switching
    setTimeout(() => {
      try {
        onStepClick(idx);
      } finally {
        // keep skeleton visible briefly for smoothness
        setTimeout(() => setIsLoading(false), 450);
      }
    }, 160);
  };

  return (
      <header className='w-full fixed top-0 left-0 z-40 h-20' aria-hidden={false}>
      <div className='w-full flex justify-center py-2 px-3'>
        <h1 className='text-lg sm:text-2xl font-bold text-blue-900 tracking-wide uppercase'>
          FRESH APPLICATION FORM
        </h1>
      </div>
        <div
          className='max-w-7xl mx-auto rounded-lg shadow px-2 py-1 mt-0  bg-gradient-to-r from-[#0d2977] to-[#23408e]'>
          <div className='flex space-x-2  px-2 py-1 justify-center items-center'>
            {steps.map((stepName, idx) => {
              const active = currentStep === idx;
              const pressed = pressedIndex === idx;
              return (
                <div key={idx} className='flex flex-col items-center'>
                  <button
                    type='button'
                    onClick={() => handleClick(idx)}
                    suppressHydrationWarning
                    aria-current={active ? 'step' : undefined}
                    aria-disabled={isLoading}
                    className={`px-3 py-2 text-sm font-medium transition-transform duration-150 transform-gpu focus:outline-none flex flex-col items-center select-none
                      ${
                        active
                          ? 'bg-white text-[#0d2977]'
                          : 'bg-transparent text-blue-100 hover:bg-white hover:text-[#0d2977] rounded-sm'
                      }
                      ${pressed ? 'scale-95' : 'scale-100'}
                    `}
                    style={{
                      borderTopLeftRadius: '10px',
                      borderTopRightRadius: '10px',
                      minWidth: 88,
                    }}
                  >
                    <span className={`text-xs ${active ? 'font-bold' : 'font-semibold'}`}>
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

          {isLoading && (
            <div className='mt-2 px-2'>
              <div className='animate-pulse'>
                <div className='h-2 rounded bg-white/30 w-3/4 mx-auto' />
              </div>
            </div>
          )}
        </div>
    </header>
  );
};
