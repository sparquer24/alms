import React from 'react';

const Card: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className='bg-white rounded-lg p-4 shadow-sm border border-gray-100 min-w-[160px]'>
    <div className='text-xs text-gray-500'>{label}</div>
    <div className='mt-2 font-medium text-gray-900'>{value}</div>
  </div>
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

const RenewalSummary: React.FC<{ applicationId?: string; renewalId?: string; data?: any }> = ({ applicationId, renewalId, data }) => {
  const applicantName = data?.applicantName || '—';
  const displayId = data?.acknowledgementNo || renewalId || '—';

  return (
    <div className='flex gap-4 overflow-x-auto py-2'>
      <Card label='Application ID' value={applicationId || data?.applicationId || '—'} />
      <Card label='Renewal ID' value={displayId} />
      <Card label='Applicant' value={applicantName} />
      <Card label='License No' value={data?.licenseNumber || '—'} />
      <Card label='Status' value={getStatusLabel(data)} />
      <Card label='Date' value={getDateDisplay(data)} />
    </div>
  );
};

export default RenewalSummary;
