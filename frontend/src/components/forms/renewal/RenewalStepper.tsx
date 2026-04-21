'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { RENEWAL_STEPS } from './renewalRoutes';

const FiCheck = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

interface RenewalStepperProps {
  showLabels?: boolean;
  orientation?: 'horizontal' | 'vertical';
}

const RenewalStepper: React.FC<RenewalStepperProps> = ({
  showLabels = true,
  orientation = 'horizontal'
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isMounted, setIsMounted] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    setIsMounted(true);
    const currentStep = RENEWAL_STEPS.find(step => step.route === pathname);
    setCurrentStepIndex(currentStep?.index ?? 0);
  }, [pathname]);

  const getQueryParam = (key: string): string => {
    return searchParams?.get(key) || '';
  };

  const handleStepClick = (route: string, index: number) => {
    if (index <= currentStepIndex) {
      router.push(`${route}?id=${getQueryParam('id')}`);
    }
  };

  if (!isMounted) {
    return (
      <div className="w-full bg-white py-4 px-6 border-b border-gray-200">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          {RENEWAL_STEPS.map((step, index) => (
            <React.Fragment key={step.index}>
              <div className="flex flex-col items-center gap-1 p-2">
                <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm bg-gray-200 text-gray-500">
                  {index + 1}
                </div>
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  }

  if (orientation === 'vertical') {
    return (
      <div className="w-64 bg-white p-4 border-r border-gray-200">
        <h3 className="text-lg font-bold mb-4 text-gray-800">Renewal Steps</h3>
        <nav className="space-y-2">
          {RENEWAL_STEPS.map((step, index) => {
            const isCompleted = index < currentStepIndex;
            const isCurrent = index === currentStepIndex;
            const isClickable = index <= currentStepIndex;

            return (
              <button
                key={step.index}
                onClick={() => handleStepClick(step.route, index)}
                disabled={!isClickable}
                className={`
                  w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all
                  ${isCurrent 
                    ? 'bg-blue-600 text-white' 
                    : isCompleted 
                      ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                      : 'bg-gray-50 text-gray-400'}
                  ${isClickable ? 'cursor-pointer' : 'cursor-not-allowed'}
                `}
              >
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center font-semibold
                  ${isCurrent 
                    ? 'bg-white text-blue-600' 
                    : isCompleted 
                      ? 'bg-green-600 text-white' 
                      : 'bg-gray-300 text-gray-500'}
                `}>
                  {isCompleted ? <FiCheck className="w-5 h-5" /> : index + 1}
                </div>
                {showLabels && (
                  <span className={`text-sm font-medium ${isCurrent ? 'text-white' : ''}`}>
                    {step.label}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    );
  }

  return (
    <div className="w-full bg-white py-4 px-6 border-b border-gray-200">
      <div className="flex items-center justify-between max-w-6xl mx-auto">
        {RENEWAL_STEPS.map((step, index) => {
          const isCompleted = index < currentStepIndex;
          const isCurrent = index === currentStepIndex;
          const isClickable = index <= currentStepIndex;

          return (
            <React.Fragment key={step.index}>
              <button
                onClick={() => handleStepClick(step.route, index)}
                disabled={!isClickable}
                className={`
                  flex flex-col items-center gap-1 p-2 rounded-lg transition-all
                  ${isClickable ? 'cursor-pointer hover:bg-gray-100' : 'cursor-not-allowed'}
                `}
              >
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm
                  ${isCurrent 
                    ? 'bg-blue-600 text-white ring-4 ring-blue-100' 
                    : isCompleted 
                      ? 'bg-green-500 text-white' 
                      : 'bg-gray-200 text-gray-500'}
                `}>
                  {isCompleted ? <FiCheck className="w-5 h-5" /> : index + 1}
                </div>
                {showLabels && (
                  <span className={`
                    text-xs font-medium text-center max-w-[80px]
                    ${isCurrent ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-400'}
                  `}>
                    {step.label}
                  </span>
                )}
              </button>
              {index < RENEWAL_STEPS.length - 1 && (
                <div className={`
                  flex-1 h-1 mx-2 rounded
                  ${isCompleted ? 'bg-green-500' : 'bg-gray-200'}
                `} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default RenewalStepper;