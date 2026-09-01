import React from 'react';

interface Props {
  onPrev?: () => void;
  onNext?: () => void;
  onSubmit?: () => void;
  disablePrev?: boolean;
  disableNext?: boolean;
  submitting?: boolean;
}

const StepNavigation: React.FC<Props> = ({ onPrev, onNext, onSubmit, disablePrev, disableNext, submitting }) => {
  return (
    <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
      <button type="button" onClick={onPrev} className={`px-6 py-2 rounded-lg font-medium ${disablePrev ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-gray-500 text-white'}`} disabled={disablePrev}>← Previous</button>
      {onSubmit ? (
        <button type="button" onClick={onSubmit} className="px-6 py-2 bg-green-600 text-white rounded-lg" disabled={submitting}>{submitting ? 'Submitting...' : 'Submit Application'}</button>
      ) : (
        <button type="button" onClick={onNext} className={`px-6 py-2 bg-blue-600 text-white rounded-lg`} disabled={disableNext}>Next →</button>
      )}
    </div>
  );
};

export default StepNavigation;
