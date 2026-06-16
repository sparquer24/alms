import React, { useEffect } from 'react';
import RenewalSummary from './RenewalSummary';
import { ApplicationTypeSelector } from '../elements/ApplicationTypeSelector';
import { useApplicationFormContext } from '../../../context/ApplicationFormContext';
import { AdminActionService } from '../../../services/admin/actions';

const RenewalHeader: React.FC<{ applicationId?: string; renewalId?: string; summaryData?: any }> = ({ applicationId, renewalId, summaryData }) => {
  const { applicationTypeId, setApplicationType } = useApplicationFormContext();

  // Auto-select "Renewal" application type on mount
  useEffect(() => {
    AdminActionService.getApplicationTypes(true).then(types => {
      if (!applicationTypeId) {
        const renewalType = types.find(
          t => t.name?.toLowerCase().includes('renewal') || t.code?.toLowerCase().includes('renewal')
        );
        if (renewalType) {
          setApplicationType(renewalType.id, renewalType.name);
        }
      }
    }).catch((err) => {
      console.warn('Failed to load application types for Renewal auto-select', err);
    });
  }, []); // Run once on mount

  return (
    <header className='mb-6'>
      <div className='flex items-center justify-between rounded-2xl bg-[#001F54] px-6 py-4 text-white shadow-lg'>
        <div>
          <p className='text-xs uppercase tracking-[0.24em] text-blue-100'>Renewal Form</p>
          <h1 className='mt-1 text-2xl font-semibold'>Renewal Application</h1>
        </div>
        <div className='flex items-center gap-3'>
          <button
            type='button'
            onClick={() => globalThis.history?.back?.()}
            className='rounded-md bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/20'
          >
            Back
          </button>
        </div>
      </div>

      {/* Application Type Selector */}
      <div className='mt-4'>
        <div className='bg-white border border-gray-200 rounded-lg p-3 shadow-sm'>
          <ApplicationTypeSelector
            selectedTypeId={applicationTypeId}
            onTypeChange={setApplicationType}
            showCategory={false}
          />
        </div>
      </div>

      <div className='mt-4'>
        <RenewalSummary applicationId={applicationId} renewalId={renewalId} data={summaryData} />
      </div>
    </header>
  );
};

export default RenewalHeader;
