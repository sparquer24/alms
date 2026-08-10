import React from 'react';
import { StepHeader } from '../elements/StepHeader';
import RenewalSummary from './RenewalSummary';

export const RENEWAL_SECTIONS = [
  'Personal Information',
  'Address Details',
  'Occupation/Business',
  'Criminal History',
  'License Details',
  'License History',
  'Biometric Information',
  'Upload Documents',
  'Preview',
  'Declaration',
];

const RenewalHeader: React.FC<{
  licenseId?: string;
  renewalId?: string;
  summaryData?: any;
  currentStep: number;
  onStepClick: (step: number) => void;
  lockedSteps?: Set<number>;
  onGoHome?: () => void;
}> = ({ licenseId, renewalId, summaryData, currentStep, onStepClick, lockedSteps, onGoHome }) => {
  return (
    <header className='mb-2'>
      <StepHeader
        steps={RENEWAL_SECTIONS}
        title='RENEWAL APPLICATION FORM'
        currentStep={currentStep}
        onStepClick={onStepClick}
        lockedSteps={lockedSteps}
        onGoHome={onGoHome}
      />

      <div className='mt-2'>
        <RenewalSummary licenseId={licenseId} renewalId={renewalId} data={summaryData} />
      </div>
    </header>
  );
};

export default RenewalHeader;
