"use client";
import React from "react";

interface StepHeaderProps {
  steps: string[];
  currentStep: number;
  onStepClick?: (step: number) => void;
}

export const StepHeader: React.FC<StepHeaderProps> = ({
  steps,
  currentStep,
  onStepClick = () => {},
}) => (
  <header className="flex flex-col items-center w-full fixed top-0 left-0 z-40" >
    <div className="w-full flex justify-center ">
         <h1 className="text-2xl font-bold text-blue-900 tracking-wide uppercase">FRESH APPLICATION FORM</h1>
    </div>
    
    <div className="max-w-7xl  rounded-sm shadow px-2 py-1 mt-2 mx-auto" style={{ background: 'linear-gradient(90deg, #0d2977 0%, #23408e 100%)' }}>
      <div className="flex space-x-2  overflow-x-auto  scrollbar-thin scrollbar-thumb-blue-300 scrollbar-track-blue-100 px-2 py-1 justify-center">
        {steps.map((stepName, idx) => (
          <div key={idx} className="flex flex-col items-center">
            <button
              type="button"
              onClick={() => onStepClick(idx)}
              suppressHydrationWarning
              className={`px-3 py-1 text-sm font-medium transition-all duration-200 flex flex-col items-center
                ${currentStep === idx
                  ? "bg-white text-[#0d2977] h-full"
                  : "bg-transparent text-blue-100 hover:bg-white hover:text-[#0d2977] h-full rounded-sm"}
              `}
              style={{
                borderTopLeftRadius: "10px",
                borderTopRightRadius: "10px",
                minWidth: "90px"
              }}
            >
              {/* <span className="mb-0.5 text-xs">Step {idx + 1}</span> */}
              <span className={`text-xs ${currentStep === idx ? "font-bold" : "font-semibold"}`}>{`${stepName}`}</span>
            </button>
            {currentStep === idx && (
              <div className="w-0 h-0 border-l-6 border-r-6 border-t-6 border-transparent border-t-white mt-[-2px]" />
            )}
          </div>
        ))}
      </div>
    </div>
  </header>
);