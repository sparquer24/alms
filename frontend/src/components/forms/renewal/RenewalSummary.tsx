import React from 'react';

const Item: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <span className='whitespace-nowrap'>
    <span className='text-xs font-semibold uppercase tracking-wide text-gray-500'>{label}:</span>{' '}
    <span className='text-sm font-semibold text-gray-900'>{value}</span>
  </span>
);

const getStatusLabel = (data?: any) => {
  if (!data) return '—';
  if (data.workflowStatus?.name) return data.workflowStatus.name;
  if (data.workflowStatus?.code) return data.workflowStatus.code;
  if (data.isSubmit === true) return 'Submitted';
  return 'Draft';
};

const getDateDisplay = (data?: any) => {
  if (data?.createdAt) return new Date(data.createdAt).toLocaleDateString();
  if (data?.updatedAt) return new Date(data.updatedAt).toLocaleDateString();
  return '—';
};

const RenewalSummary: React.FC<{ licenseId?: string; renewalId?: string; data?: any }> = ({ licenseId, renewalId, data }) => {
  const applicantName = data?.applicantName || '—';
  const displayId = data?.acknowledgementNo || renewalId || '—';

  return (
    <div className='flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border border-gray-200 bg-gray-50 px-4 py-1.5 overflow-x-auto'>
      <Item label='License ID' value={licenseId || data?.licenseId || '—'} />
      <span className='text-gray-300'>|</span>
      <Item label='Fresh Acknowledgement No' value={displayId} />
      <span className='text-gray-300'>|</span>
      <Item label='Applicant' value={applicantName} />
      <span className='text-gray-300'>|</span>
      <Item label='License No' value={data?.licenseNumber || '—'} />
      <span className='text-gray-300'>|</span>
      <Item label='Status' value={getStatusLabel(data)} />
      <span className='text-gray-300'>|</span>
      <Item label='Date' value={getDateDisplay(data)} />
    </div>
  );
};

export default RenewalSummary;
